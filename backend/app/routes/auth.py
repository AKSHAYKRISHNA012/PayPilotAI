from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import User, Employee, Company
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "demo"

class SwitchDemoRequest(BaseModel):
    user_id: str

def get_current_user(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Demo auth middleware: uses X-User-Id header or falls back to admin.
    """
    user = None
    if x_user_id:
        user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        user = db.query(User).filter(User.role == "admin").first()
    if not user:
        raise HTTPException(status_code=401, detail="Authentication failed")
    return user

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        emp = None
        if u.employee_id:
            emp = db.query(Employee).filter(Employee.id == u.employee_id).first()
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "employee_id": u.employee_id,
            "department": emp.department if emp else "Operations / Executive",
            "designation": emp.designation if emp else ("HR Administrator" if u.role == "admin" else "Payroll Head")
        })
    return {"users": result}

@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = None
    if user.employee_id:
        emp = db.query(Employee).filter(Employee.id == user.employee_id).first()
    comp = db.query(Company).filter(Company.id == user.company_id).first()
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "employee_id": user.employee_id,
        "department": emp.department if emp else "Executive",
        "designation": emp.designation if emp else ("Administrator" if user.role == "admin" else "Payroll Admin"),
        "company": {
            "id": comp.id if comp else settings.DEFAULT_COMPANY_ID,
            "name": comp.name if comp else settings.DEFAULT_COMPANY_NAME
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        # Fallback to first user
        user = db.query(User).first()
    return {
        "status": "success",
        "token": f"token_{user.id}",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "employee_id": user.employee_id
        }
    }
