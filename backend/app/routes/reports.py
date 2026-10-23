from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Optional
import csv
import io
from app.database import get_db
from app.models import (
    PayrollPeriod, PayrollItem, Employee, Company,
    SalaryStructure, AttendanceRecord, LeaveBalance, User
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

def number_to_words_inr(n: float) -> str:
    """Helper to convert number to Indian currency words representation."""
    val = int(round(n))
    if val <= 0:
        return "Zero Rupees Only"
    
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_upto_thousand(num):
        out = ""
        if num >= 100:
            out += ones[num // 100] + " Hundred "
            num %= 100
        if num >= 20:
            out += tens[num // 10] + " "
            num %= 10
        if num > 0:
            out += ones[num] + " "
        return out.strip()

    crores = val // 10000000
    val %= 10000000
    lakhs = val // 100000
    val %= 100000
    thousands = val // 1000
    val %= 1000
    rem = val

    res = ""
    if crores > 0:
        res += convert_upto_thousand(crores) + " Crore "
    if lakhs > 0:
        res += convert_upto_thousand(lakhs) + " Lakh "
    if thousands > 0:
        res += convert_upto_thousand(thousands) + " Thousand "
    if rem > 0:
        res += convert_upto_thousand(rem) + " "

    return "Rupees " + res.strip() + " Only"

@router.get("/payslip/{period_id}/{employee_id}")
def get_printable_payslip(
    period_id: str,
    employee_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    # Privacy check
    if user.role == "employee" and user.employee_id and user.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    comp = db.query(Company).filter(Company.id == comp_id).first()
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == comp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == comp_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    item = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.employee_id == employee_id,
        PayrollItem.company_id == comp_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Payroll line not found for this employee")

    # Leave balance for the slip
    lb = db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).first()

    return {
        "company": {
            "name": comp.name if comp else "PayPilot Enterprise",
            "address": comp.address if comp else "Bengaluru, Karnataka",
            "pan": comp.pan if comp else "",
            "tan": comp.tan if comp else "",
            "epf_reg": comp.epf_reg if comp else "",
            "esic_reg": comp.esic_reg if comp else ""
        },
        "period": {
            "name": period.name,
            "working_days": period.working_days,
            "status": period.status
        },
        "employee": {
            "id": emp.id,
            "emp_code": emp.emp_code,
            "name": f"{emp.first_name} {emp.last_name}",
            "department": emp.department,
            "designation": emp.designation,
            "joining_date": emp.joining_date.isoformat() if emp.joining_date else "",
            "pan": emp.pan,
            "bank_name": emp.bank_name,
            "bank_account": emp.bank_account,
            "ifsc": emp.ifsc,
            "uan": emp.uan,
            "tax_regime": f"{emp.tax_regime.capitalize()} Tax Regime"
        },
        "earnings": [
            {"label": "Basic Salary", "amount": item.basic},
            {"label": "House Rent Allowance (HRA)", "amount": item.hra},
            {"label": "Special Allowance", "amount": item.special_allowance},
            {"label": "Conveyance Allowance", "amount": item.conveyance},
            {"label": "Medical Allowance", "amount": item.medical_allowance},
            {"label": "Bonus / Variable Incentive", "amount": item.bonus_or_variable},
            {"label": "Other Earnings", "amount": item.other_earnings}
        ],
        "deductions": [
            {"label": "Employee PF (12%)", "amount": item.employee_pf},
            {"label": "Employee ESI (0.75%)", "amount": item.employee_esi},
            {"label": "Professional Tax (PT)", "amount": item.professional_tax},
            {"label": "TDS / Income Tax", "amount": item.tds},
            {"label": f"Loss of Pay ({item.unpaid_leave_days:.0f} days)", "amount": item.lop_deduction},
            {"label": "Other Deductions / Advance Recovery", "amount": item.other_deductions}
        ],
        "summary": {
            "gross_earnings": item.gross_earnings,
            "total_deductions": item.total_deductions,
            "net_salary": item.net_salary,
            "net_salary_in_words": number_to_words_inr(item.net_salary),
            "employer_pf": item.employer_pf,
            "employer_esi": item.employer_esi,
            "total_employer_cost": item.total_employer_cost
        },
        "leaves": {
            "casual_remaining": (lb.casual_leave_total - lb.casual_leave_used) if lb else 0,
            "sick_remaining": (lb.sick_leave_total - lb.sick_leave_used) if lb else 0,
            "earned_remaining": (lb.earned_leave_total - lb.earned_leave_used) if lb else 0
        }
    }

@router.get("/summary/{period_id}")
def get_monthly_summary_report(
    period_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == comp_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    items = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.company_id == comp_id
    ).all()

    total_gross = sum(i.gross_earnings for i in items)
    total_net = sum(i.net_salary for i in items)
    total_deductions = sum(i.total_deductions for i in items)
    total_pf = sum(i.employee_pf for i in items)
    total_esi = sum(i.employee_esi for i in items)
    total_pt = sum(i.professional_tax for i in items)
    total_tds = sum(i.tds for i in items)
    total_employer_cost = sum(i.total_employer_cost for i in items)

    return {
        "period_name": period.name,
        "employee_count": len(items),
        "total_gross": total_gross,
        "total_net": total_net,
        "total_deductions": total_deductions,
        "statutory_breakdown": {
            "provident_fund": total_pf,
            "esi": total_esi,
            "professional_tax": total_pt,
            "tds": total_tds
        },
        "total_employer_cost": total_employer_cost
    }

@router.get("/department-report/{period_id}")
def get_department_report(
    period_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == comp_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    items = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.company_id == comp_id
    ).all()

    depts = {}
    for item in items:
        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        dept_name = emp.department if emp else "General"
        if dept_name not in depts:
            depts[dept_name] = {
                "department": dept_name,
                "headcount": 0,
                "gross_salary": 0.0,
                "net_salary": 0.0,
                "employer_cost": 0.0
            }
        depts[dept_name]["headcount"] += 1
        depts[dept_name]["gross_salary"] += item.gross_earnings
        depts[dept_name]["net_salary"] += item.net_salary
        depts[dept_name]["employer_cost"] += item.total_employer_cost

    return {"departments": list(depts.values())}

@router.get("/export-csv/{period_id}")
def export_payroll_csv(
    period_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    items = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.company_id == user.company_id
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee Code", "Employee Name", "Department", "Designation",
        "PAN", "Bank Account", "IFSC", "Gross Salary (INR)",
        "PF Employee (INR)", "ESI Employee (INR)", "Prof Tax (INR)",
        "TDS (INR)", "LOP Days", "LOP Deduction (INR)", "Total Deductions (INR)",
        "Net Salary (INR)", "Employer PF (INR)", "Employer Cost CTC (INR)", "Audit Status"
    ])

    for item in items:
        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        writer.writerow([
            emp.emp_code if emp else "",
            f"{emp.first_name} {emp.last_name}" if emp else "",
            emp.department if emp else "",
            emp.designation if emp else "",
            emp.pan if emp else "",
            emp.bank_account if emp else "",
            emp.ifsc if emp else "",
            f"{item.gross_earnings:.2f}",
            f"{item.employee_pf:.2f}",
            f"{item.employee_esi:.2f}",
            f"{item.professional_tax:.2f}",
            f"{item.tds:.2f}",
            f"{item.unpaid_leave_days:.1f}",
            f"{item.lop_deduction:.2f}",
            f"{item.total_deductions:.2f}",
            f"{item.net_salary:.2f}",
            f"{item.employer_pf:.2f}",
            f"{item.total_employer_cost:.2f}",
            item.audit_status
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=PayPilot_Payroll_{period.name.replace(' ', '_')}.csv"}
    )

@router.get("/export-bank-file/{period_id}")
def export_bank_payment_file(
    period_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates standard Indian Corporate Banking CMS / NEFT / NACH batch payment file
    (compatible with HDFC Enet, ICICI CIB, SBI CMP).
    """
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    items = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.company_id == user.company_id
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction Type", "Beneficiary Code", "Beneficiary Account Number",
        "Instrument Amount", "Beneficiary Name", "Drawee Location",
        "Print Location", "Beneficiary Email", "Beneficiary Mobile",
        "Payment Narration", "IFSC Code"
    ])

    for item in items:
        # Exclude negative or zero payouts
        if item.net_salary <= 0:
            continue
        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        writer.writerow([
            "NEFT",
            emp.emp_code if emp else "",
            emp.bank_account if emp else "",
            f"{item.net_salary:.2f}",
            f"{emp.first_name} {emp.last_name}" if emp else "",
            "Bengaluru",
            "Bengaluru",
            emp.email if emp else "",
            emp.phone if emp else "",
            f"Sal Oct 26 {emp.emp_code if emp else ''}",
            emp.ifsc if emp else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=PayPilot_Bank_Batch_{period.name.replace(' ', '_')}.csv"}
    )

@router.get("/export-epf-ecr/{period_id}")
def export_epfo_ecr_file(
    period_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates EPFO Electronic Challan cum Return (ECR) text file format with #~# delimiter
    used for official monthly PF upload on EPFO Unified Portal.
    """
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == period_id,
        PayrollPeriod.company_id == user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    items = db.query(PayrollItem).filter(
        PayrollItem.period_id == period_id,
        PayrollItem.company_id == user.company_id
    ).all()

    lines = []
    for item in items:
        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        if not emp:
            continue
        uan = emp.uan or "100987654321"
        name = f"{emp.first_name} {emp.last_name}".upper()
        gross = int(round(item.gross_earnings))
        epf_wages = int(round(min(item.basic, 15000.0)))
        eps_wages = epf_wages
        edli_wages = epf_wages
        ee_share = int(round(item.employee_pf))
        er_eps = int(round(epf_wages * 0.0833))
        er_epf = max(0, int(round(item.employer_pf)) - er_eps)
        ncp_days = int(round(item.unpaid_leave_days))

        # Format: UAN#~#MEMBER_NAME#~#GROSS#~#EPF#~#EPS#~#EDLI#~#EE_SHARE#~#ER_EPS#~#ER_EPF#~#NCP
        line = f"{uan}#~#{name}#~#{gross}#~#{epf_wages}#~#{eps_wages}#~#{edli_wages}#~#{ee_share}#~#{er_eps}#~#{er_epf}#~#{ncp_days}#~#0"
        lines.append(line)

    ecr_text = "\n".join(lines)
    return Response(
        content=ecr_text,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=EPFO_ECR_{period.name.replace(' ', '_')}.txt"}
    )

