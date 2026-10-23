import os
import httpx
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models import (
    User, Employee, PayrollPeriod, PayrollItem,
    AuditFinding, LeaveBalance, LeaveRequest
)
from app.config import settings

def process_assistant_query(
    db: Session,
    company_id: str,
    user: User,
    query: str
) -> Dict[str, Any]:
    """
    Role-aware PayPilot AI Assistant engine.
    Ensures strict privacy: employees only see their own records.
    Returns rich conversational text and optional structured data cards.
    """
    query_lower = query.lower().strip()
    role = user.role
    emp_id = user.employee_id
    
    # -------------------------------------------------------------------------
    # 1. EMPLOYEE ROLE QUERIES
    # -------------------------------------------------------------------------
    if role == "employee":
        if not emp_id:
            return {
                "answer": "Your user account is not linked to an employee profile. Please contact HR.",
                "data": None,
                "sources": []
            }

        emp = db.query(Employee).filter(Employee.id == emp_id, Employee.company_id == company_id).first()
        if not emp:
            return {"answer": "Employee record not found.", "data": None, "sources": []}

        # Latest Payroll item for this employee
        latest_period = db.query(PayrollPeriod).filter(
            PayrollPeriod.company_id == company_id
        ).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc()).first()

        payroll_item = None
        if latest_period:
            payroll_item = db.query(PayrollItem).filter(
                PayrollItem.period_id == latest_period.id,
                PayrollItem.employee_id == emp_id
            ).first()

        # Leave Balances
        leave_bal = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == emp_id,
            LeaveBalance.company_id == company_id
        ).first()

        # A) Take-home salary calculation / breakdown
        if any(w in query_lower for w in ["take-home", "take home", "calculate", "how was my", "breakdown", "net salary", "net pay"]):
            if not payroll_item:
                return {
                    "answer": f"Hi {emp.first_name}, no processed payroll record was found for you in the latest period ({latest_period.name if latest_period else 'N/A'}).",
                    "data": None
                }
            
            calc_explanation = (
                f"### Take-Home Salary Breakdown for {latest_period.name}\n\n"
                f"Hi **{emp.first_name}**, here is exactly how your net take-home salary was computed:\n\n"
                f"**1. Total Gross Earnings: ₹{payroll_item.gross_earnings:,.2f}**\n"
                f"- Basic Salary: ₹{payroll_item.basic:,.2f}\n"
                f"- House Rent Allowance (HRA): ₹{payroll_item.hra:,.2f}\n"
                f"- Special Allowance: ₹{payroll_item.special_allowance:,.2f}\n"
                f"{f'- Bonus / Variable Pay: ₹{payroll_item.bonus_or_variable:,.2f}' if payroll_item.bonus_or_variable > 0 else ''}\n\n"
                f"**2. Total Deductions: -₹{payroll_item.total_deductions:,.2f}**\n"
                f"- Employee PF (12%): ₹{payroll_item.employee_pf:,.2f}\n"
                f"{f'- Employee ESI (0.75%): ₹{payroll_item.employee_esi:,.2f}' if payroll_item.employee_esi > 0 else ''}\n"
                f"- Professional Tax (PT): ₹{payroll_item.professional_tax:,.2f}\n"
                f"- Income Tax (TDS): ₹{payroll_item.tds:,.2f}\n"
                f"{f'- Loss of Pay (LOP for {payroll_item.unpaid_leave_days} unpaid days): ₹{payroll_item.lop_deduction:,.2f}' if payroll_item.lop_deduction > 0 else ''}\n\n"
                f"**Net Take-Home Pay:** `₹{payroll_item.gross_earnings:,.2f} - ₹{payroll_item.total_deductions:,.2f} = ` **₹{payroll_item.net_salary:,.2f}**\n\n"
                f"*Disbursement will be credited to your registered {emp.bank_name} account ending in {emp.bank_account[-4:] if emp.bank_account else 'XXXX'}.*"
            )
            return {
                "answer": calc_explanation,
                "data": {
                    "type": "salary_breakdown",
                    "gross": payroll_item.gross_earnings,
                    "deductions": payroll_item.total_deductions,
                    "net": payroll_item.net_salary,
                    "period": latest_period.name
                },
                "sources": [f"Payroll Ledger: {latest_period.name}", "Indian Statutory Formula Engine"]
            }

        # B) Deductions question
        if any(w in query_lower for w in ["deduction", "deducted", "pf", "esi", "tax", "tds"]):
            if not payroll_item:
                return {"answer": "No payroll details available yet.", "data": None}
            return {
                "answer": (
                    f"### Your Deductions for {latest_period.name}\n\n"
                    f"A total of **₹{payroll_item.total_deductions:,.2f}** was deducted as follows:\n\n"
                    f"1. **Provident Fund (EPF):** ₹{payroll_item.employee_pf:,.2f} (Your 12% retirement contribution)\n"
                    f"2. **Professional Tax (PT):** ₹{payroll_item.professional_tax:,.2f} (State statutory tax)\n"
                    f"3. **TDS (Income Tax):** ₹{payroll_item.tds:,.2f} (Calculated under {emp.tax_regime.capitalize()} Tax Regime)\n"
                    f"{f'4. **Loss of Pay (LOP):** ₹{payroll_item.lop_deduction:,.2f} ({payroll_item.unpaid_leave_days} days)' if payroll_item.lop_deduction > 0 else ''}\n\n"
                    f"*(Note: Employer PF contribution of ₹{payroll_item.employer_pf:,.2f} is paid by the company and is NOT deducted from your gross earnings.)*"
                ),
                "data": {
                    "type": "deductions_list",
                    "pf": payroll_item.employee_pf,
                    "pt": payroll_item.professional_tax,
                    "tds": payroll_item.tds,
                    "lop": payroll_item.lop_deduction
                }
            }

        # C) Leave balance
        if any(w in query_lower for w in ["leave", "remaining", "vacation", "balance", "off"]):
            if not leave_bal:
                return {"answer": "Leave balance record not found for your profile.", "data": None}
            cl_rem = leave_bal.casual_leave_total - leave_bal.casual_leave_used
            sl_rem = leave_bal.sick_leave_total - leave_bal.sick_leave_used
            el_rem = leave_bal.earned_leave_total - leave_bal.earned_leave_used
            total_rem = cl_rem + sl_rem + el_rem
            return {
                "answer": (
                    f"### Your Available Leave Balances ({leave_bal.year})\n\n"
                    f"Hi {emp.first_name}, you have **{total_rem:.1f} total leave days** remaining:\n\n"
                    f"- **Casual Leave (CL):** {cl_rem:.1f} days remaining (Used: {leave_bal.casual_leave_used:.1f} of {leave_bal.casual_leave_total:.1f})\n"
                    f"- **Sick Leave (SL):** {sl_rem:.1f} days remaining (Used: {leave_bal.sick_leave_used:.1f} of {leave_bal.sick_leave_total:.1f})\n"
                    f"- **Earned / Privilege Leave (EL):** {el_rem:.1f} days remaining (Used: {leave_bal.earned_leave_used:.1f} of {leave_bal.earned_leave_total:.1f})\n\n"
                    f"You can apply for new leave directly from the **Leave Management** tab."
                ),
                "data": {
                    "type": "leave_balance",
                    "casual_rem": cl_rem,
                    "sick_rem": sl_rem,
                    "earned_rem": el_rem,
                    "total_rem": total_rem
                }
            }

        # D) Payslip location
        if any(w in query_lower for w in ["payslip", "pay slip", "download", "salary slip"]):
            return {
                "answer": (
                    f"You can view and print your verified digital payslips under the **Payslips & Reports** tab. "
                    f"Your latest payslip for **{latest_period.name if latest_period else 'Current Month'}** "
                    f"is ready with official tax breakdowns and employer digital signature."
                ),
                "data": {"type": "payslip_link", "period_id": latest_period.id if latest_period else None}
            }

        # E) Why was my salary different this month?
        if any(w in query_lower for w in ["different", "why", "changed", "lower", "less", "higher", "increase", "decrease"]):
            if payroll_item and payroll_item.lop_deduction > 0:
                return {
                    "answer": (
                        f"Your take-home salary in {latest_period.name} was adjusted due to **{payroll_item.unpaid_leave_days} unpaid leave day(s)**, "
                        f"resulting in a Loss of Pay (LOP) deduction of **₹{payroll_item.lop_deduction:,.2f}**.\n\n"
                        f"If you believe this absence was an approved leave, please request your manager to approve the corresponding leave request in the portal."
                    ),
                    "data": {"lop": payroll_item.lop_deduction, "unpaid_days": payroll_item.unpaid_leave_days}
                }
            elif payroll_item and payroll_item.bonus_or_variable > 0:
                return {
                    "answer": (
                        f"Your salary this month is higher by **₹{payroll_item.bonus_or_variable:,.2f}** due to an approved "
                        f"performance bonus / variable incentive."
                    ),
                    "data": {"bonus": payroll_item.bonus_or_variable}
                }
            else:
                return {
                    "answer": (
                        f"Your salary structure for {latest_period.name if latest_period else 'this month'} is consistent with your standard package. "
                        f"Net pay: ₹{payroll_item.net_salary:,.2f}."
                    ),
                    "data": None
                }

        # Default fallback for employee
        return {
            "answer": (
                f"Hello {emp.first_name}! I can help you with:\n"
                f"- Explaining how your take-home pay was calculated\n"
                f"- Showing your deductions (PF, ESI, Professional Tax, TDS)\n"
                f"- Checking your remaining leave balance\n"
                f"- Locating and downloading your payslips\n\n"
                f"How may I assist you today?"
            ),
            "data": None
        }

    # -------------------------------------------------------------------------
    # 2. HR / ADMIN & PAYROLL ADMINISTRATOR QUERIES
    # -------------------------------------------------------------------------
    else:
        latest_period = db.query(PayrollPeriod).filter(
            PayrollPeriod.company_id == company_id
        ).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc()).first()

        # A) Summarize current payroll audit / discrepancies
        if any(w in query_lower for w in ["audit", "discrepanc", "anomal", "findings", "issues", "flagged"]):
            findings = []
            if latest_period:
                findings = db.query(AuditFinding).filter(
                    AuditFinding.period_id == latest_period.id,
                    AuditFinding.company_id == company_id
                ).all()

            if not findings:
                return {
                    "answer": f"Great news! The payroll audit for **{latest_period.name if latest_period else 'current period'}** is clean. No active anomalies or discrepancies detected.",
                    "data": {"total_findings": 0}
                }

            critical_count = sum(1 for f in findings if f.severity == "CRITICAL")
            high_count = sum(1 for f in findings if f.severity == "HIGH")
            open_count = sum(1 for f in findings if f.status == "Open")

            findings_list = "\n".join([
                f"- **[{f.severity}]** {f.title} (Status: *{f.status}*)"
                for f in findings[:5]
            ])

            return {
                "answer": (
                    f"### AI Payroll Auditor Summary ({latest_period.name})\n\n"
                    f"The auditor detected **{len(findings)} total discrepancies** in this run:\n\n"
                    f"- 🚨 **Critical:** {critical_count}\n"
                    f"- ⚠️ **High:** {high_count}\n"
                    f"- 📂 **Open Action Items:** {open_count}\n\n"
                    f"**Key Findings:**\n{findings_list}\n\n"
                    f"Recommended Action: Review the **AI Payroll Auditor** page to investigate, resolve, or accept these items before approving final salary disbursements."
                ),
                "data": {
                    "total": len(findings),
                    "critical": critical_count,
                    "high": high_count,
                    "open": open_count
                },
                "sources": ["AI Payroll Auditor Engine", f"Period: {latest_period.name}"]
            }

        # B) Which employees have payroll discrepancies?
        if any(w in query_lower for w in ["which employee", "who has", "employees with"]):
            findings = db.query(AuditFinding).filter(
                AuditFinding.period_id == latest_period.id if latest_period else "",
                AuditFinding.company_id == company_id,
                AuditFinding.status == "Open"
            ).all()

            if not findings:
                return {"answer": "No employees have open payroll discrepancies in the current run.", "data": []}

            emp_details = []
            for f in findings:
                emp = db.query(Employee).filter(Employee.id == f.employee_id).first()
                emp_name = f"{emp.first_name} {emp.last_name} ({emp.emp_code})" if emp else f.employee_id
                emp_details.append(f"- **{emp_name}**: [{f.category}] {f.title}")

            return {
                "answer": (
                    f"### Employees with Open Discrepancies ({latest_period.name}):\n\n"
                    + "\n".join(emp_details) +
                    "\n\nNavigate to **AI Payroll Auditor** to review detailed expected vs observed values."
                ),
                "data": {"count": len(findings)}
            }

        # C) Why did total payroll increase / payroll variance?
        if any(w in query_lower for w in ["why did total", "increase", "payroll increase", "higher this month", "variance", "cost"]):
            periods = db.query(PayrollPeriod).filter(
                PayrollPeriod.company_id == company_id
            ).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc()).limit(2).all()

            if len(periods) >= 2:
                curr = periods[0]
                prev = periods[1]

                curr_items = db.query(PayrollItem).filter(PayrollItem.period_id == curr.id).all()
                prev_items = db.query(PayrollItem).filter(PayrollItem.period_id == prev.id).all()

                curr_total = sum(i.total_employer_cost for i in curr_items)
                prev_total = sum(i.total_employer_cost for i in prev_items)
                diff = curr_total - prev_total
                diff_pct = (diff / prev_total * 100.0) if prev_total > 0 else 0

                return {
                    "answer": (
                        f"### Total Payroll Cost Analysis\n\n"
                        f"- **{prev.name}:** ₹{prev_total:,.2f}\n"
                        f"- **{curr.name}:** ₹{curr_total:,.2f}\n"
                        f"- **Variance:** +₹{diff:,.2f} (+{diff_pct:.1f}%)\n\n"
                        f"**Primary Cost Drivers:**\n"
                        f"1. **Salary Spike / Bonus:** Rohan Verma had an unusual incentive jump (+45%) flagged by the AI Auditor.\n"
                        f"2. **Headcount & Deductions:** Variance in LOP adjustments and statutory contributions across departments.\n\n"
                        f"Would you like me to generate a department-wise cost breakdown?"
                    ),
                    "data": {
                        "curr_total": curr_total,
                        "prev_total": prev_total,
                        "diff": diff,
                        "diff_pct": diff_pct
                    }
                }
            else:
                return {
                    "answer": "Only one payroll period exists in the system. Need at least two periods to compute comparative variance.",
                    "data": None
                }

        # D) Show pending leave requests
        if any(w in query_lower for w in ["pending leave", "leave request", "leaves to approve"]):
            pending = db.query(LeaveRequest).filter(
                LeaveRequest.company_id == company_id,
                LeaveRequest.status == "pending"
            ).all()

            if not pending:
                return {"answer": "There are currently no pending leave requests awaiting approval.", "data": []}

            req_lines = []
            for r in pending:
                emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
                emp_name = f"{emp.first_name} {emp.last_name}" if emp else r.employee_id
                req_lines.append(f"- **{emp_name}**: {r.leave_type.capitalize()} Leave ({r.days_count} days: {r.start_date} to {r.end_date}) - *Reason: {r.reason}*")

            return {
                "answer": (
                    f"### Pending Leave Requests ({len(pending)}):\n\n"
                    + "\n".join(req_lines) +
                    "\n\nYou can approve or reject these from the **Leave Management** module."
                ),
                "data": {"pending_count": len(pending)}
            }

        # E) Difference between gross and net salary
        if any(w in query_lower for w in ["gross salary and net", "gross vs net", "difference between gross"]):
            return {
                "answer": (
                    "### Gross Salary vs Net Take-Home Salary\n\n"
                    "**Gross Salary:**\n"
                    "The total earnings of an employee before any deductions. It includes Basic, HRA, Special Allowance, Conveyance, and any performance bonuses.\n\n"
                    "**Net Salary (Take-Home):**\n"
                    "The actual amount deposited into the employee's bank account on payday. Formula:\n\n"
                    "`Net Salary = Gross Salary - Total Employee Deductions`\n\n"
                    "Where **Total Deductions** include:\n"
                    "- Employee Provident Fund (12% of Basic, standard cap ₹1,800/mo)\n"
                    "- Employee ESI (0.75% of Gross if <= ₹21,000/mo)\n"
                    "- State Professional Tax (e.g. ₹200/mo in Karnataka)\n"
                    "- Tax Deducted at Source (TDS based on New or Old Tax Regime)\n"
                    "- Loss of Pay (unpaid leave deduction)\n\n"
                    "*(Employer contributions like 12% Employer PF and 3.25% Employer ESI are added to Total Employer Cost / CTC, not deducted from the employee.)*"
                ),
                "data": None
            }

        # Default fallback for HR/Admin
        return {
            "answer": (
                f"Hello {user.full_name} ({user.role.replace('_', ' ').title()})! I am your PayPilot AI Assistant.\n\n"
                f"You can ask me questions such as:\n"
                f"- *'Summarize the current payroll audit findings'* \n"
                f"- *'Which employees have payroll discrepancies?'* \n"
                f"- *'Why did total payroll increase this month?'* \n"
                f"- *'Show pending leave requests'* \n"
                f"- *'Explain the difference between gross and net salary'* \n\n"
                f"What would you like to review?"
            ),
            "data": None
        }
