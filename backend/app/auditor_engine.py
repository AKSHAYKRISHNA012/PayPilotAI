import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import (
    PayrollPeriod, PayrollItem, Employee, SalaryStructure,
    AttendanceRecord, LeaveRequest, AuditFinding
)
from app.payroll_engine import round_curr

def run_payroll_audit(db: Session, company_id: str, period_id: str) -> List[AuditFinding]:
    """
    Executes comprehensive deterministic audit rules on all payroll items in the period.
    Generates structured findings with category, severity, expected vs observed,
    explanation, and recommended action.
    """
    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == company_id
    ).first()
    
    if not period:
        return []

    # Clear existing un-resolved findings for this run to allow fresh re-audit
    db.query(AuditFinding).filter(
        AuditFinding.period_id == period_id,
        AuditFinding.company_id == company_id,
        AuditFinding.status.in_(["Open", "Investigating"])
    ).delete(synchronize_session=False)
    db.commit()

    payroll_items = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.company_id == company_id
    ).all()

    # Get previous period for salary spike comparison if exists
    prev_period = db.query(PayrollPeriod).filter(
        PayrollPeriod.company_id == company_id,
        PayrollPeriod.id != period_id
    ).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc()).first()

    prev_items_by_emp: Dict[str, PayrollItem] = {}
    if prev_period:
        prev_items = db.query(PayrollItem).filter(
            PayrollItem.period_id == prev_period.id,
            PayrollItem.company_id == company_id
        ).all()
        for p in prev_items:
            prev_items_by_emp[p.employee_id] = p

    new_findings: List[AuditFinding] = []
    seen_pan_numbers: Dict[str, str] = {} # pan -> emp_id

    for item in payroll_items:
        emp = db.query(Employee).filter(
            Employee.id == item.employee_id,
            Employee.company_id == company_id
        ).first()
        if not emp:
            continue

        emp_label = f"{emp.first_name} {emp.last_name} ({emp.emp_code})"

        # Rule 1: Negative Net Pay (CRITICAL)
        if item.net_salary < 0:
            finding = AuditFinding(
                id=f"audit_{uuid.uuid4().hex[:10]}",
                company_id=company_id,
                period_id=period_id,
                employee_id=emp.id,
                category="Negative Net Pay",
                severity="CRITICAL",
                title=f"Negative Net Salary: ₹{item.net_salary:,.2f}",
                description=(
                    f"Deductions (₹{item.total_deductions:,.2f}) exceed gross earnings "
                    f"(₹{item.gross_earnings:,.2f}) for {emp_label}. An employee cannot receive "
                    f"a negative paycheck."
                ),
                expected_value="Net Pay >= ₹0.00",
                observed_value=f"Net Pay = ₹{item.net_salary:,.2f}",
                recommended_action="Review excess loan recoveries or unapproved deductions. Cap deductions to maximum 50% of gross salary as per Payment of Wages Act.",
                status="Open"
            )
            new_findings.append(finding)
            item.audit_status = "flagged"

        # Rule 2: Unusually Large Salary Spike / Variance vs Previous Month (HIGH)
        if emp.id in prev_items_by_emp:
            prev_item = prev_items_by_emp[emp.id]
            if prev_item.gross_earnings > 0:
                change_pct = ((item.gross_earnings - prev_item.gross_earnings) / prev_item.gross_earnings) * 100.0
                abs_change = item.gross_earnings - prev_item.gross_earnings
                
                # If gross jumped more than 30% or more than ₹30,000 without prior revision
                if change_pct > 30.0 and abs_change > 20000.0:
                    finding = AuditFinding(
                        id=f"audit_{uuid.uuid4().hex[:10]}",
                        company_id=company_id,
                        period_id=period_id,
                        employee_id=emp.id,
                        category="Salary Spike",
                        severity="HIGH",
                        title=f"Unusual Salary Spike of +{change_pct:.1f}% (+₹{abs_change:,.2f})",
                        description=(
                            f"Gross salary for {emp_label} increased from ₹{prev_item.gross_earnings:,.2f} "
                            f"to ₹{item.gross_earnings:,.2f}. This exceeds the 30% anomaly variance threshold."
                        ),
                        expected_value=f"₹{prev_item.gross_earnings:,.2f} (±15% variance)",
                        observed_value=f"₹{item.gross_earnings:,.2f} (+{change_pct:.1f}%)",
                        recommended_action="Verify if bonus, variable pay, or arrears were legitimately approved by HR. Check for duplicate bonus entry.",
                        status="Open"
                    )
                    new_findings.append(finding)
                    item.audit_status = "flagged"

        # Rule 3: Attendance & Leave Mismatch (HIGH)
        # Check absent days without approved leave vs unpaid_leave_days deducted
        unapproved_absent_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == emp.id,
            AttendanceRecord.company_id == company_id,
            AttendanceRecord.status == "absent"
        ).count()

        if unapproved_absent_count > 0 and item.unpaid_leave_days < unapproved_absent_count:
            missing_lop = unapproved_absent_count - item.unpaid_leave_days
            finding = AuditFinding(
                id=f"audit_{uuid.uuid4().hex[:10]}",
                company_id=company_id,
                period_id=period_id,
                employee_id=emp.id,
                category="Attendance Mismatch",
                severity="HIGH",
                title=f"Attendance Mismatch: {unapproved_absent_count} Unapproved Absences, Only {item.unpaid_leave_days:.0f} LOP Deducted",
                description=(
                    f"Attendance records indicate {unapproved_absent_count} unapproved absent day(s) for {emp_label}, "
                    f"but only {item.unpaid_leave_days} Loss of Pay (LOP) day(s) were deducted in payroll calculation."
                ),
                expected_value=f"{unapproved_absent_count} Unpaid LOP Days",
                observed_value=f"{item.unpaid_leave_days} Deducted Days ({missing_lop:.0f} unbilled absent days)",
                recommended_action=f"Update payroll item to apply {unapproved_absent_count} days LOP or verify if leaves were retrospectively approved by manager.",
                status="Open"
            )
            new_findings.append(finding)
            item.audit_status = "flagged"

        # Rule 4: Duplicate PAN or Bank Account Check (CRITICAL)
        if emp.pan:
            clean_pan = emp.pan.strip().upper()
            if clean_pan in seen_pan_numbers:
                other_emp_id = seen_pan_numbers[clean_pan]
                finding = AuditFinding(
                    id=f"audit_{uuid.uuid4().hex[:10]}",
                    company_id=company_id,
                    period_id=period_id,
                    employee_id=emp.id,
                    category="Duplicate Entry",
                    severity="CRITICAL",
                    title=f"Duplicate PAN Detected across Employees",
                    description=(
                        f"PAN {clean_pan} for {emp_label} is identical to employee ID {other_emp_id}. "
                        f"Duplicate PANs indicate ghost employee profiles or incorrect KYC records."
                    ),
                    expected_value="Unique PAN per employee",
                    observed_value=f"PAN {clean_pan} duplicated with employee {other_emp_id}",
                    recommended_action="Hold salary disbursement for both records until verified KYC documents (PAN card copy) are verified.",
                    status="Open"
                )
                new_findings.append(finding)
                item.audit_status = "flagged"
            else:
                seen_pan_numbers[clean_pan] = emp.id

        # Rule 5: Missing or Incomplete Statutory Information (MEDIUM)
        if not emp.bank_account or len(emp.bank_account.strip()) < 8 or not emp.ifsc:
            finding = AuditFinding(
                id=f"audit_{uuid.uuid4().hex[:10]}",
                company_id=company_id,
                period_id=period_id,
                employee_id=emp.id,
                category="Missing Statutory Information",
                severity="MEDIUM",
                title="Missing / Incomplete Bank Account or IFSC Code",
                description=f"Employee {emp_label} is missing valid bank disbursement details required for NACH / NEFT batch processing.",
                expected_value="Valid 9-18 digit account number and 11-character IFSC",
                observed_value=f"Account: {emp.bank_account or 'MISSING'}, IFSC: {emp.ifsc or 'MISSING'}",
                recommended_action="Contact employee to update bank account details before NACH direct deposit submission.",
                status="Open"
            )
            new_findings.append(finding)
            item.audit_status = "flagged"

        # Rule 6: Mathematical Inconsistency Check (CRITICAL)
        expected_net = round_curr(item.gross_earnings - item.total_deductions)
        if abs(item.net_salary - expected_net) > 0.05:
            finding = AuditFinding(
                id=f"audit_{uuid.uuid4().hex[:10]}",
                company_id=company_id,
                period_id=period_id,
                employee_id=emp.id,
                category="Calculation Mismatch",
                severity="CRITICAL",
                title="Mathematical Inconsistency in Net Salary Formula",
                description=(
                    f"Calculated Net Salary (₹{item.net_salary:,.2f}) does not match "
                    f"Gross (₹{item.gross_earnings:,.2f}) - Total Deductions (₹{item.total_deductions:,.2f}) = ₹{expected_net:,.2f}."
                ),
                expected_value=f"₹{expected_net:,.2f}",
                observed_value=f"₹{item.net_salary:,.2f}",
                recommended_action="Recalculate salary line using the deterministic payroll engine.",
                status="Open"
            )
            new_findings.append(finding)
            item.audit_status = "flagged"

        # If no findings, mark clean
        if item.audit_status != "flagged":
            item.audit_status = "clean"

    for f in new_findings:
        db.add(f)
    
    # Update period status
    period.status = "audited"
    db.commit()
    
    return db.query(AuditFinding).filter(
        AuditFinding.period_id == period_id,
        AuditFinding.company_id == company_id
    ).all()
