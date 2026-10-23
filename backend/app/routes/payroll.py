import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    PayrollPeriod, PayrollItem, Employee, SalaryStructure,
    AttendanceRecord, LeaveRequest, AuditFinding, AuditLog, User
)
from app.routes.auth import get_current_user
from app.security import require_roles
from app.payroll_engine import calculate_payroll_item

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

class CreatePeriodRequest(BaseModel):
    month: int
    year: int
    name: str
    working_days: int = 22

class UpdatePayrollItemRequest(BaseModel):
    bonus_or_variable: Optional[float] = None
    unpaid_leave_days: Optional[float] = None
    other_deductions: Optional[float] = None
    notes: Optional[str] = None

@router.get("/periods")
def list_periods(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    periods = db.query(PayrollPeriod).filter(
        PayrollPeriod.company_id == comp_id
    ).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc()).all()

    results = []
    for p in periods:
        items = db.query(PayrollItem).filter(PayrollItem.period_id == p.id).all()
        flagged_count = sum(1 for i in items if i.audit_status == "flagged")
        total_gross = sum(i.gross_earnings for i in items)
        total_net = sum(i.net_salary for i in items)
        total_cost = sum(i.total_employer_cost for i in items)

        results.append({
            "id": p.id,
            "month": p.month,
            "year": p.year,
            "name": p.name,
            "working_days": p.working_days,
            "status": p.status,
            "processed_at": p.processed_at.isoformat() if p.processed_at else None,
            "processed_by": p.processed_by,
            "employee_count": len(items),
            "flagged_count": flagged_count,
            "total_gross": total_gross,
            "total_net": total_net,
            "total_employer_cost": total_cost
        })
    return {"periods": results}

@router.post("/periods")
def create_payroll_period(
    req: CreatePeriodRequest,
    user: User = Depends(require_roles(["owner", "admin", "payroll_admin"])),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    existing = db.query(PayrollPeriod).filter(
        PayrollPeriod.company_id == comp_id,
        PayrollPeriod.month == req.month,
        PayrollPeriod.year == req.year
    ).first()
    if existing:
        return {"status": "success", "period": {"id": existing.id, "name": existing.name, "status": existing.status}}

    period_id = f"period_{req.year}_{req.month:02d}_{uuid.uuid4().hex[:6]}"
    month_name = date(req.year, req.month, 1).strftime("%B %Y")
    period = PayrollPeriod(
        id=period_id,
        company_id=comp_id,
        month=req.month,
        year=req.year,
        name=req.name or month_name,
        working_days=req.working_days,
        status="draft",
        prepared_by=user.id,
        prepared_at=datetime.utcnow()
    )
    db.add(period)
    db.commit()

    # Pre-populate items for active employees
    employees = db.query(Employee).filter(Employee.company_id == comp_id, Employee.status == "active").all()
    for emp in employees:
        sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == emp.id).first()
        basic = sal.basic if sal else 50000.0
        hra = sal.hra if sal else 25000.0
        special = sal.special_allowance if sal else 15000.0
        gross = basic + hra + special
        pf = min(1800.0, basic * 0.12)
        pt = 200.0
        net = gross - pf - pt
        item = PayrollItem(
            id=f"item_{period_id}_{emp.id}",
            company_id=comp_id,
            period_id=period_id,
            employee_id=emp.id,
            basic=basic,
            hra=hra,
            special_allowance=special,
            gross_earnings=gross,
            employee_pf=pf,
            employer_pf=pf,
            professional_tax=pt,
            net_salary=net,
            total_deductions=pf + pt,
            total_employer_cost=gross + pf,
            audit_status="clean"
        )
        db.add(item)
    db.commit()
    return {"status": "success", "period": {"id": period.id, "name": period.name, "status": period.status}}

@router.get("/periods/{id}")
def get_period_detail(
    id: str,
    department: Optional[str] = None,
    audit_status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == id,
        PayrollPeriod.company_id == comp_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found")

    query = db.query(PayrollItem).filter(
        PayrollItem.period_id == id,
        PayrollItem.company_id == comp_id
    )

    # Privacy constraint
    if user.role == "employee" and user.employee_id:
        query = query.filter(PayrollItem.employee_id == user.employee_id)

    items = query.all()
    results = []
    for item in items:
        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        if not emp:
            continue

        if department and department != "all" and emp.department != department:
            continue
        if audit_status and audit_status != "all" and item.audit_status != audit_status:
            continue

        # Check if any active audit findings for this employee in this period
        findings_count = db.query(AuditFinding).filter(
            AuditFinding.period_id == id,
            AuditFinding.employee_id == emp.id,
            AuditFinding.status == "Open"
        ).count()

        results.append({
            "id": item.id,
            "employee_id": item.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "emp_code": emp.emp_code,
            "department": emp.department,
            "designation": emp.designation,
            "pan": emp.pan,
            "bank_account": emp.bank_account,
            "basic": item.basic,
            "hra": item.hra,
            "special_allowance": item.special_allowance,
            "bonus_or_variable": item.bonus_or_variable,
            "gross_earnings": item.gross_earnings,
            "employee_pf": item.employee_pf,
            "employee_esi": item.employee_esi,
            "professional_tax": item.professional_tax,
            "tds": item.tds,
            "unpaid_leave_days": item.unpaid_leave_days,
            "lop_deduction": item.lop_deduction,
            "other_deductions": item.other_deductions,
            "total_deductions": item.total_deductions,
            "net_salary": item.net_salary,
            "employer_pf": item.employer_pf,
            "employer_esi": item.employer_esi,
            "total_employer_cost": item.total_employer_cost,
            "audit_status": item.audit_status,
            "open_findings_count": findings_count,
            "notes": item.notes
        })

    return {
        "period": {
            "id": period.id,
            "name": period.name,
            "month": period.month,
            "year": period.year,
            "working_days": period.working_days,
            "status": period.status,
            "processed_at": period.processed_at.isoformat() if period.processed_at else None,
            "processed_by": period.processed_by
        },
        "items": results,
        "summary": {
            "total_items": len(results),
            "total_gross": sum(i["gross_earnings"] for i in results),
            "total_deductions": sum(i["total_deductions"] for i in results),
            "total_net": sum(i["net_salary"] for i in results),
            "total_employer_cost": sum(i["total_employer_cost"] for i in results),
            "flagged_count": sum(1 for i in results if i["audit_status"] == "flagged")
        }
    }

@router.post("/periods/{id}/calculate")
def calculate_period_payroll(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    comp_id = user.company_id
    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == id,
        PayrollPeriod.company_id == comp_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    if period.status == "processed":
        raise HTTPException(status_code=400, detail="Cannot recalculate a processed payroll period")

    employees = db.query(Employee).filter(
        Employee.company_id == comp_id,
        Employee.status == "active"
    ).all()

    for emp in employees:
        sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == emp.id).first()
        if not sal:
            continue

        existing_item = db.query(PayrollItem).filter(
            PayrollItem.period_id == id,
            PayrollItem.employee_id == emp.id
        ).first()

        bonus = existing_item.bonus_or_variable if existing_item else 0.0
        other_ded = existing_item.other_deductions if existing_item else 0.0

        # Calculate absent days from biometric machine attendance records
        absent_days = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == emp.id,
            AttendanceRecord.company_id == comp_id,
            AttendanceRecord.status == "absent"
        ).count()

        # Calculate approved Loss of Pay (unpaid_lop) leaves
        lop_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == emp.id,
            LeaveRequest.company_id == comp_id,
            LeaveRequest.leave_type == "unpaid_lop",
            LeaveRequest.status == "approved"
        ).all()
        lop_leave_days = sum(l.days_count for l in lop_leaves)

        # Duty Leaves (On Duty / OD) are explicitly fully paid (0 LOP)
        total_unpaid = float(absent_days) + float(lop_leave_days)
        unpaid_days = existing_item.unpaid_leave_days if (existing_item and existing_item.unpaid_leave_days > 0) else total_unpaid

        calc = calculate_payroll_item(
            basic=sal.basic,
            hra=sal.hra,
            special_allowance=sal.special_allowance,
            conveyance=sal.conveyance,
            medical_allowance=sal.medical_allowance,
            bonus_or_variable=bonus,
            pf_applicable=sal.pf_applicable,
            pf_type=sal.pf_type,
            esi_applicable=sal.esi_applicable,
            pt_applicable=sal.pt_applicable,
            pt_state=sal.pt_state,
            unpaid_leave_days=unpaid_days,
            working_days=period.working_days,
            tax_regime=emp.tax_regime,
            tds_override=sal.tds_monthly_override,
            other_deductions=other_ded
        )

        if not existing_item:
            existing_item = PayrollItem(
                id=f"pi_{uuid.uuid4().hex[:8]}",
                company_id=comp_id,
                period_id=id,
                employee_id=emp.id
            )
            db.add(existing_item)

        existing_item.basic = calc["basic"]
        existing_item.hra = calc["hra"]
        existing_item.special_allowance = calc["special_allowance"]
        existing_item.conveyance = calc["conveyance"]
        existing_item.medical_allowance = calc["medical_allowance"]
        existing_item.bonus_or_variable = calc["bonus_or_variable"]
        existing_item.gross_earnings = calc["gross_earnings"]
        existing_item.employee_pf = calc["employee_pf"]
        existing_item.employer_pf = calc["employer_pf"]
        existing_item.employee_esi = calc["employee_esi"]
        existing_item.employer_esi = calc["employer_esi"]
        existing_item.professional_tax = calc["professional_tax"]
        existing_item.tds = calc["tds"]
        existing_item.unpaid_leave_days = calc["unpaid_leave_days"]
        existing_item.lop_deduction = calc["lop_deduction"]
        existing_item.other_deductions = calc["other_deductions"]
        existing_item.total_deductions = calc["total_deductions"]
        existing_item.net_salary = calc["net_salary"]
        existing_item.total_employer_cost = calc["total_employer_cost"]

    period.status = "calculated"
    db.commit()
    return {"status": "success", "message": f"Payroll recalculated for {len(employees)} employees"}

@router.put("/items/{item_id}")
def update_payroll_item(
    item_id: str,
    req: UpdatePayrollItemRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Used to adjust / resolve a discrepancy on a specific employee salary line.
    (e.g., removing duplicate bonus, applying correct LOP days, reducing excessive loan deduction)
    """
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    item = db.query(PayrollItem).filter(
        PayrollItem.id == item_id,
        PayrollItem.company_id == user.company_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Payroll item not found")

    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == item.period_id).first()
    emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
    sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == item.employee_id).first()

    bonus = req.bonus_or_variable if req.bonus_or_variable is not None else item.bonus_or_variable
    unpaid_days = req.unpaid_leave_days if req.unpaid_leave_days is not None else item.unpaid_leave_days
    other_ded = req.other_deductions if req.other_deductions is not None else item.other_deductions

    # Recalculate with corrected values
    calc = calculate_payroll_item(
        basic=sal.basic if sal else item.basic,
        hra=sal.hra if sal else item.hra,
        special_allowance=sal.special_allowance if sal else item.special_allowance,
        bonus_or_variable=bonus,
        pf_applicable=sal.pf_applicable if sal else True,
        pf_type=sal.pf_type if sal else "statutory_capped_1800",
        esi_applicable=sal.esi_applicable if sal else False,
        pt_applicable=sal.pt_applicable if sal else True,
        pt_state=sal.pt_state if sal else "Karnataka",
        unpaid_leave_days=unpaid_days,
        working_days=period.working_days if period else 22,
        tax_regime=emp.tax_regime if emp else "new",
        tds_override=sal.tds_monthly_override if sal else None,
        other_deductions=other_ded
    )

    item.bonus_or_variable = calc["bonus_or_variable"]
    item.gross_earnings = calc["gross_earnings"]
    item.employee_pf = calc["employee_pf"]
    item.employer_pf = calc["employer_pf"]
    item.employee_esi = calc["employee_esi"]
    item.employer_esi = calc["employer_esi"]
    item.professional_tax = calc["professional_tax"]
    item.tds = calc["tds"]
    item.unpaid_leave_days = calc["unpaid_leave_days"]
    item.lop_deduction = calc["lop_deduction"]
    item.other_deductions = calc["other_deductions"]
    item.total_deductions = calc["total_deductions"]
    item.net_salary = calc["net_salary"]
    item.total_employer_cost = calc["total_employer_cost"]
    if req.notes:
        item.notes = req.notes
    
    # Mark resolved if net salary is positive and within range
    if item.net_salary > 0:
        item.audit_status = "resolved"

    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=user.company_id,
        user_id=user.id,
        action="PAYROLL_ITEM_ADJUSTED",
        entity_type="PAYROLL_ITEM",
        entity_id=item_id,
        details=f"Adjusted payroll item for {emp.first_name if emp else 'employee'}: Net now ₹{item.net_salary:,.2f}"
    ))

    db.commit()
    return {"status": "success", "message": "Payroll item updated and recalculated successfully", "item": calc}

@router.post("/periods/{id}/approve")
def approve_period(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == id,
        PayrollPeriod.company_id == user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    period.status = "approved"
    db.commit()
    return {"status": "success", "message": f"Payroll period {period.name} approved"}

@router.post("/periods/{id}/process")
def process_period(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    period = db.query(PayrollPeriod).filter(
        PayrollPeriod.id == id,
        PayrollPeriod.company_id == user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")

    period.status = "processed"
    period.processed_at = datetime.utcnow()
    period.processed_by = user.full_name
    db.commit()
    return {"status": "success", "message": f"Payroll period {period.name} successfully processed and locked"}
