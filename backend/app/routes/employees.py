import uuid
from datetime import date, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    Employee, SalaryStructure, AttendanceRecord,
    LeaveBalance, LeaveRequest, PayrollItem, PayrollPeriod,
    AuditLog, User, Company, EmployeeDocument
)
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/employees", tags=["employees"])

class EmployeeCreate(BaseModel):
    emp_code: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = "+91 9876543210"
    department: str
    designation: str
    manager_id: Optional[str] = None
    employment_type: Optional[str] = "full_time" # full_time, contract, intern
    employment_status: Optional[str] = "active" # active, probation, notice_period, resigned, terminated
    joining_date: Optional[date] = None
    pan: Optional[str] = "ABCDE1234F"
    bank_name: Optional[str] = "HDFC Bank"
    bank_account: Optional[str] = "50100123456789"
    ifsc: Optional[str] = "HDFC0001234"
    tax_regime: Optional[str] = "new"
    state: Optional[str] = "Karnataka"
    ctc_annual: float = 600000.0
    basic: float = 25000.0
    hra: float = 12500.0
    special_allowance: float = 12500.0

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[str] = None
    employment_type: Optional[str] = None
    employment_status: Optional[str] = None
    status: Optional[str] = None
    pan: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc: Optional[str] = None
    tax_regime: Optional[str] = None
    state: Optional[str] = None

class DocumentCreate(BaseModel):
    document_type: str # pan_card, aadhaar_card, offer_letter, form_16, resume
    title: str
    file_name: str
    file_url: Optional[str] = None
    file_size_kb: Optional[int] = 150

@router.get("")
def list_employees(
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    query = db.query(Employee).filter(Employee.company_id == comp_id)

    # Privacy constraint: If standard employee, they only see themselves unless HR/Admin
    if user.role == "employee" and user.employee_id:
        query = query.filter(Employee.id == user.employee_id)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (Employee.first_name.ilike(s)) |
            (Employee.last_name.ilike(s)) |
            (Employee.emp_code.ilike(s)) |
            (Employee.email.ilike(s))
        )
    if department and department != "all":
        query = query.filter(Employee.department == department)
    if status and status != "all":
        query = query.filter(Employee.status == status)

    employees = query.order_by(Employee.emp_code.asc()).all()
    results = []
    for emp in employees:
        sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == emp.id).first()
        results.append({
            "id": emp.id,
            "emp_code": emp.emp_code,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "name": f"{emp.first_name} {emp.last_name}",
            "email": emp.email,
            "phone": emp.phone,
            "department": emp.department,
            "designation": emp.designation,
            "joining_date": emp.joining_date.isoformat() if emp.joining_date else None,
            "status": emp.status,
            "pan": emp.pan,
            "bank_account": emp.bank_account,
            "ifsc": emp.ifsc,
            "tax_regime": emp.tax_regime,
            "state": emp.state,
            "monthly_gross": (sal.basic + sal.hra + sal.special_allowance) if sal else 0.0,
            "ctc_annual": sal.ctc_annual if sal else 0.0
        })
    return {"employees": results, "total": len(results)}

@router.get("/{id}")
def get_employee_detail(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    # Privacy check
    if user.role == "employee" and user.employee_id and user.employee_id != id:
        raise HTTPException(status_code=403, detail="Unauthorized to view other employee details")

    emp = db.query(Employee).filter(Employee.id == id, Employee.company_id == comp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Salary Structure
    sal = db.query(SalaryStructure).filter(SalaryStructure.employee_id == id).first()

    # Leave Balance
    lb = db.query(LeaveBalance).filter(LeaveBalance.employee_id == id).first()

    # Recent Attendance records (last 10)
    attendance = db.query(AttendanceRecord).filter(
        AttendanceRecord.employee_id == id
    ).order_by(AttendanceRecord.date.desc()).limit(15).all()

    # Recent Leave Requests
    leave_reqs = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == id
    ).order_by(LeaveRequest.applied_on.desc()).all()

    # Payslip History
    payslips = []
    payroll_items = db.query(PayrollItem).filter(
        PayrollItem.employee_id == id
    ).all()
    for pi in payroll_items:
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == pi.period_id).first()
        payslips.append({
            "period_id": pi.period_id,
            "period_name": period.name if period else "Period",
            "period_status": period.status if period else "draft",
            "gross": pi.gross_earnings,
            "deductions": pi.total_deductions,
            "net": pi.net_salary,
            "item_id": pi.id
        })

    return {
        "employee": {
            "id": emp.id,
            "emp_code": emp.emp_code,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "phone": emp.phone,
            "department": emp.department,
            "designation": emp.designation,
            "joining_date": emp.joining_date.isoformat() if emp.joining_date else None,
            "status": emp.status,
            "pan": emp.pan,
            "bank_name": emp.bank_name,
            "bank_account": emp.bank_account,
            "ifsc": emp.ifsc,
            "tax_regime": emp.tax_regime,
            "state": emp.state
        },
        "salary_structure": {
            "ctc_annual": sal.ctc_annual if sal else 0.0,
            "basic": sal.basic if sal else 0.0,
            "hra": sal.hra if sal else 0.0,
            "special_allowance": sal.special_allowance if sal else 0.0,
            "pf_applicable": sal.pf_applicable if sal else True,
            "pf_type": sal.pf_type if sal else "statutory_capped_1800",
            "esi_applicable": sal.esi_applicable if sal else False,
            "pt_applicable": sal.pt_applicable if sal else True,
            "pt_state": sal.pt_state if sal else "Karnataka"
        } if sal else None,
        "leave_balance": {
            "casual_remaining": (lb.casual_leave_total - lb.casual_leave_used) if lb else 0,
            "sick_remaining": (lb.sick_leave_total - lb.sick_leave_used) if lb else 0,
            "earned_remaining": (lb.earned_leave_total - lb.earned_leave_used) if lb else 0,
            "year": lb.year if lb else 2026
        } if lb else None,
        "recent_attendance": [
            {
                "date": a.date.isoformat(),
                "status": a.status,
                "check_in": a.check_in,
                "check_out": a.check_out
            } for a in attendance
        ],
        "leave_requests": [
            {
                "id": lr.id,
                "leave_type": lr.leave_type,
                "start_date": lr.start_date.isoformat(),
                "end_date": lr.end_date.isoformat(),
                "days_count": lr.days_count,
                "reason": lr.reason,
                "status": lr.status
            } for lr in leave_reqs
        ],
        "payslips": payslips
    }

@router.post("")
def create_employee(
    emp_in: EmployeeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    comp_id = user.company_id
    comp = db.query(Company).filter(Company.id == comp_id).first()
    
    # Enforce Plan Employee Limit
    if comp:
        active_count = db.query(Employee).filter(
            Employee.company_id == comp_id,
            Employee.status == "active"
        ).count()
        if active_count >= comp.max_employees:
            raise HTTPException(
                status_code=403,
                detail=f"Employee limit reached ({active_count}/{comp.max_employees}) for {comp.plan_tier.upper()} plan. Please upgrade your subscription to add more employees."
            )

    new_id = f"emp_{uuid.uuid4().hex[:6]}"

    emp = Employee(
        id=new_id,
        company_id=comp_id,
        emp_code=emp_in.emp_code,
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        email=emp_in.email,
        phone=emp_in.phone,
        department=emp_in.department,
        designation=emp_in.designation,
        manager_id=emp_in.manager_id,
        employment_type=emp_in.employment_type or "full_time",
        employment_status=emp_in.employment_status or "active",
        joining_date=emp_in.joining_date or date.today(),
        status="active",
        pan=emp_in.pan,
        bank_name=emp_in.bank_name,
        bank_account=emp_in.bank_account,
        ifsc=emp_in.ifsc,
        tax_regime=emp_in.tax_regime or "new",
        state=emp_in.state or "Karnataka"
    )
    db.add(emp)

    # Salary structure
    sal = SalaryStructure(
        id=f"sal_{new_id}",
        company_id=comp_id,
        employee_id=new_id,
        ctc_annual=emp_in.ctc_annual,
        basic=emp_in.basic,
        hra=emp_in.hra,
        special_allowance=emp_in.special_allowance,
        pf_applicable=True,
        pf_type="statutory_capped_1800",
        esi_applicable=(emp_in.basic + emp_in.hra + emp_in.special_allowance) <= 21000.0,
        pt_applicable=True,
        pt_state=emp_in.state or "Karnataka"
    )
    db.add(sal)

    # Leave balance
    lb = LeaveBalance(
        id=f"lb_{new_id}",
        company_id=comp_id,
        employee_id=new_id,
        year=2026,
        casual_leave_total=12.0,
        casual_leave_used=0.0,
        sick_leave_total=10.0,
        sick_leave_used=0.0,
        earned_leave_total=15.0,
        earned_leave_used=0.0
    )
    db.add(lb)

    # Audit log
    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=comp_id,
        user_id=user.id,
        action="EMPLOYEE_CREATED",
        entity_type="EMPLOYEE",
        entity_id=new_id,
        details=f"Created employee {emp_in.first_name} {emp_in.last_name} ({emp_in.emp_code})"
    ))

    db.commit()
    return {"status": "success", "employee_id": new_id, "message": "Employee created successfully"}

@router.put("/{id}")
def update_employee(
    id: str,
    emp_in: EmployeeUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    emp = db.query(Employee).filter(Employee.id == id, Employee.company_id == user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in emp_in.dict(exclude_unset=True).items():
        if value is not None:
            setattr(emp, field, value)

    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=user.company_id,
        user_id=user.id,
        action="EMPLOYEE_UPDATED",
        entity_type="EMPLOYEE",
        entity_id=id,
        details=f"Updated employee {emp.first_name} {emp.last_name}"
    ))

    db.commit()
    return {"status": "success", "message": "Employee updated successfully"}

@router.delete("/{id}")
def deactivate_employee(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    emp = db.query(Employee).filter(Employee.id == id, Employee.company_id == user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp.status = "inactive"
    emp.employment_status = "terminated"
    db.commit()
    return {"status": "success", "message": "Employee deactivated successfully"}

# -------------------------------------------------------------
# EMPLOYEE DOCUMENT MANAGEMENT WORKFLOW
# -------------------------------------------------------------

@router.get("/{id}/documents")
def list_employee_documents(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all KYC and HR documents for an employee."""
    # Privacy check
    if user.role == "employee" and user.employee_id != id:
        raise HTTPException(status_code=403, detail="Employees can only access their own documents.")

    emp = db.query(Employee).filter(Employee.id == id, Employee.company_id == user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    docs = db.query(EmployeeDocument).filter(
        EmployeeDocument.employee_id == id,
        EmployeeDocument.company_id == user.company_id
    ).order_by(EmployeeDocument.uploaded_at.desc()).all()

    # Pre-seed standard mock KYC documents if none exist yet for demonstration
    if not docs:
        default_docs = [
            ("pan_card", "PAN Card Verification Copy", f"PAN_{emp.pan}.pdf", 180),
            ("offer_letter", "Signed Employment Offer Letter", f"Offer_{emp.emp_code}.pdf", 320),
            ("form_16", "Form 16 Part B (FY 25-26)", f"Form16_{emp.emp_code}.pdf", 250)
        ]
        for dtype, title, fname, size in default_docs:
            d = EmployeeDocument(
                id=f"doc_{uuid.uuid4().hex[:8]}",
                company_id=user.company_id,
                employee_id=id,
                document_type=dtype,
                title=title,
                file_name=fname,
                file_size_kb=size,
                file_url=f"/documents/secure/{fname}",
                uploaded_by="HR Administrator"
            )
            db.add(d)
        db.commit()
        docs = db.query(EmployeeDocument).filter(
            EmployeeDocument.employee_id == id,
            EmployeeDocument.company_id == user.company_id
        ).all()

    return {
        "documents": [
            {
                "id": d.id,
                "document_type": d.document_type,
                "title": d.title,
                "file_name": d.file_name,
                "file_size_kb": d.file_size_kb,
                "file_url": d.file_url,
                "uploaded_by": d.uploaded_by,
                "uploaded_at": d.uploaded_at.isoformat()
            }
            for d in docs
        ]
    }

@router.post("/{id}/documents")
def add_employee_document(
    id: str,
    doc_in: DocumentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or record an employee document (PAN, Aadhaar, Offer letter, etc.)."""
    if user.role not in ["admin", "payroll_admin", "owner"] and user.employee_id != id:
        raise HTTPException(status_code=403, detail="Permission denied to upload documents.")

    emp = db.query(Employee).filter(Employee.id == id, Employee.company_id == user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_doc = EmployeeDocument(
        id=f"doc_{uuid.uuid4().hex[:8]}",
        company_id=user.company_id,
        employee_id=id,
        document_type=doc_in.document_type,
        title=doc_in.title,
        file_name=doc_in.file_name,
        file_size_kb=doc_in.file_size_kb or 150,
        file_url=doc_in.file_url or f"/documents/secure/{doc_in.file_name}",
        uploaded_by=user.full_name
    )
    db.add(new_doc)
    db.commit()

    return {"status": "success", "message": "Document uploaded successfully", "document_id": new_doc.id}

@router.delete("/{id}/documents/{doc_id}")
def delete_employee_document(
    id: str,
    doc_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an employee document."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    doc = db.query(EmployeeDocument).filter(
        EmployeeDocument.id == doc_id,
        EmployeeDocument.employee_id == id,
        EmployeeDocument.company_id == user.company_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return {"status": "success", "message": "Document deleted successfully"}
