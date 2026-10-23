from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SalaryStructure, Employee, User, AuditLog
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/salary-structures", tags=["salary-structures"])

class SalaryStructureUpdate(BaseModel):
    ctc_annual: float
    basic: float
    hra: float
    special_allowance: float
    conveyance: Optional[float] = 0.0
    medical_allowance: Optional[float] = 0.0
    pf_applicable: bool = True
    pf_type: str = "statutory_capped_1800"
    esi_applicable: bool = True
    pt_applicable: bool = True
    pt_state: str = "Karnataka"
    tds_monthly_override: Optional[float] = 0.0

@router.get("")
def list_salary_structures(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    structures = db.query(SalaryStructure).filter(SalaryStructure.company_id == comp_id).all()

    results = []
    for s in structures:
        emp = db.query(Employee).filter(Employee.id == s.employee_id).first()
        if not emp:
            continue
        # If employee role, restrict to their own
        if user.role == "employee" and user.employee_id and user.employee_id != emp.id:
            continue

        results.append({
            "id": s.id,
            "employee_id": s.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "emp_code": emp.emp_code,
            "department": emp.department,
            "designation": emp.designation,
            "ctc_annual": s.ctc_annual,
            "basic": s.basic,
            "hra": s.hra,
            "special_allowance": s.special_allowance,
            "monthly_gross": s.basic + s.hra + s.special_allowance,
            "pf_applicable": s.pf_applicable,
            "pf_type": s.pf_type,
            "esi_applicable": s.esi_applicable,
            "pt_applicable": s.pt_applicable,
            "pt_state": s.pt_state,
            "tds_monthly_override": s.tds_monthly_override
        })
    return {"structures": results}

@router.get("/{emp_id}")
def get_employee_salary_structure(
    emp_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role == "employee" and user.employee_id and user.employee_id != emp_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    s = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == emp_id,
        SalaryStructure.company_id == user.company_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    return {
        "id": s.id,
        "employee_id": s.employee_id,
        "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "",
        "emp_code": emp.emp_code if emp else "",
        "ctc_annual": s.ctc_annual,
        "basic": s.basic,
        "hra": s.hra,
        "special_allowance": s.special_allowance,
        "monthly_gross": s.basic + s.hra + s.special_allowance,
        "pf_applicable": s.pf_applicable,
        "pf_type": s.pf_type,
        "esi_applicable": s.esi_applicable,
        "pt_applicable": s.pt_applicable,
        "pt_state": s.pt_state,
        "tds_monthly_override": s.tds_monthly_override
    }

@router.put("/{emp_id}")
def update_salary_structure(
    emp_id: str,
    req: SalaryStructureUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    s = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == emp_id,
        SalaryStructure.company_id == user.company_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    s.ctc_annual = req.ctc_annual
    s.basic = req.basic
    s.hra = req.hra
    s.special_allowance = req.special_allowance
    s.conveyance = req.conveyance
    s.medical_allowance = req.medical_allowance
    s.pf_applicable = req.pf_applicable
    s.pf_type = req.pf_type
    s.esi_applicable = req.esi_applicable
    s.pt_applicable = req.pt_applicable
    s.pt_state = req.pt_state
    s.tds_monthly_override = req.tds_monthly_override

    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=user.company_id,
        user_id=user.id,
        action="SALARY_STRUCTURE_UPDATED",
        entity_type="SALARY_STRUCTURE",
        entity_id=s.id,
        details=f"Updated salary structure for employee {emp_id}"
    ))

    db.commit()
    return {"status": "success", "message": "Salary structure updated successfully"}
