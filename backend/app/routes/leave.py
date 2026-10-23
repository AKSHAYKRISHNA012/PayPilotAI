import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LeaveBalance, LeaveRequest, Employee, User, AuditLog
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api/leave", tags=["leave"])

class ApplyLeaveRequest(BaseModel):
    employee_id: Optional[str] = None
    leave_type: str  # casual, sick, earned, unpaid_lop
    start_date: date
    end_date: date
    days_count: float
    reason: str

class ReviewLeaveRequest(BaseModel):
    status: str  # approved, rejected
    review_comment: Optional[str] = None

@router.get("/balances")
def get_leave_balances(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    query = db.query(LeaveBalance).filter(LeaveBalance.company_id == comp_id)

    if user.role == "employee" and user.employee_id:
        query = query.filter(LeaveBalance.employee_id == user.employee_id)

    balances = query.all()
    results = []
    for b in balances:
        emp = db.query(Employee).filter(Employee.id == b.employee_id).first()
        results.append({
            "employee_id": b.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "emp_code": emp.emp_code if emp else "",
            "year": b.year,
            "casual_total": b.casual_leave_total,
            "casual_used": b.casual_leave_used,
            "casual_remaining": b.casual_leave_total - b.casual_leave_used,
            "sick_total": b.sick_leave_total,
            "sick_used": b.sick_leave_used,
            "sick_remaining": b.sick_leave_total - b.sick_leave_used,
            "earned_total": b.earned_leave_total,
            "earned_used": b.earned_leave_used,
            "earned_remaining": b.earned_leave_total - b.earned_leave_used,
            "total_remaining": (
                (b.casual_leave_total - b.casual_leave_used) +
                (b.sick_leave_total - b.sick_leave_used) +
                (b.earned_leave_total - b.earned_leave_used)
            )
        })
    return {"balances": results}

@router.get("/requests")
def get_leave_requests(
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    query = db.query(LeaveRequest).filter(LeaveRequest.company_id == comp_id)

    if user.role == "employee" and user.employee_id:
        query = query.filter(LeaveRequest.employee_id == user.employee_id)

    if status and status != "all":
        query = query.filter(LeaveRequest.status == status)

    reqs = query.order_by(LeaveRequest.applied_on.desc()).all()
    results = []
    for r in reqs:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        results.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "emp_code": emp.emp_code if emp else "",
            "department": emp.department if emp else "",
            "leave_type": r.leave_type,
            "start_date": r.start_date.isoformat(),
            "end_date": r.end_date.isoformat(),
            "days_count": r.days_count,
            "reason": r.reason,
            "status": r.status,
            "applied_on": r.applied_on.isoformat() if r.applied_on else None,
            "reviewed_by": r.reviewed_by,
            "review_comment": r.review_comment
        })
    return {"requests": results, "pending_count": sum(1 for r in results if r["status"] == "pending")}

@router.post("/apply")
def apply_leave(
    req: ApplyLeaveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_emp_id = req.employee_id or user.employee_id
    if not target_emp_id:
        raise HTTPException(status_code=400, detail="Employee ID required")

    comp_id = user.company_id
    new_req = LeaveRequest(
        id=f"lr_{uuid.uuid4().hex[:8]}",
        company_id=comp_id,
        employee_id=target_emp_id,
        leave_type=req.leave_type,
        start_date=req.start_date,
        end_date=req.end_date,
        days_count=req.days_count,
        reason=req.reason,
        status="pending",
        applied_on=date.today()
    )
    db.add(new_req)
    db.commit()
    return {"status": "success", "message": "Leave application submitted successfully", "request_id": new_req.id}

@router.post("/requests/{id}/review")
def review_leave(
    id: str,
    req: ReviewLeaveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    l_req = db.query(LeaveRequest).filter(
        LeaveRequest.id == id,
        LeaveRequest.company_id == user.company_id
    ).first()
    if not l_req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    l_req.status = req.status
    l_req.reviewed_by = user.full_name
    l_req.review_comment = req.review_comment

    # If approved, update Leave Balance
    if req.status == "approved":
        lb = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == l_req.employee_id,
            LeaveBalance.company_id == user.company_id
        ).first()
        if lb:
            if l_req.leave_type == "casual":
                lb.casual_leave_used += l_req.days_count
            elif l_req.leave_type == "sick":
                lb.sick_leave_used += l_req.days_count
            elif l_req.leave_type == "earned":
                lb.earned_leave_used += l_req.days_count

    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=user.company_id,
        user_id=user.id,
        action="LEAVE_REVIEWED",
        entity_type="LEAVE_REQUEST",
        entity_id=id,
        details=f"Leave request marked {req.status} for employee {l_req.employee_id}"
    ))

    db.commit()
    return {"status": "success", "message": f"Leave request {req.status}"}
