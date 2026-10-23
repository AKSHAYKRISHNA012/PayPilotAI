import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    User, Employee, Company, EmployeeInvitation,
    Subscription, AuditLog
)
from app.config import settings
from app.security import (
    hash_password, verify_password, create_access_token,
    get_current_authenticated_user, require_roles
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Expose get_current_user for all existing routes
get_current_user = get_current_authenticated_user

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "demo"

class RegisterOrgRequest(BaseModel):
    company_name: str
    owner_name: str
    email: str
    password: str
    phone: Optional[str] = "+91 9876543210"
    plan_tier: Optional[str] = "free_trial"  # free_trial, starter, growth, enterprise
    pan: Optional[str] = "AABCB1234F"
    tan: Optional[str] = "BLRB12345C"
    state: Optional[str] = "Karnataka"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class InviteUserRequest(BaseModel):
    email: str
    role: str = "employee" # hr_admin, payroll_admin, manager, employee

class SwitchDemoRequest(BaseModel):
    user_id: str

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """List seeded demo accounts for investor and hackathon review."""
    users = db.query(User).all()
    result = []
    for u in users:
        emp = None
        if u.employee_id:
            emp = db.query(Employee).filter(Employee.id == u.employee_id).first()
        comp = db.query(Company).filter(Company.id == u.company_id).first()
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "employee_id": u.employee_id,
            "company_id": u.company_id,
            "company_name": comp.name if comp else settings.DEFAULT_COMPANY_NAME,
            "department": emp.department if emp else "Operations / Executive",
            "designation": emp.designation if emp else ("HR Administrator" if u.role in ("admin", "owner") else "Payroll Head")
        })
    return {"users": result}

@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return authenticated profile with organization details and active subscription."""
    emp = None
    if user.employee_id:
        emp = db.query(Employee).filter(Employee.id == user.employee_id).first()
    comp = db.query(Company).filter(Company.id == user.company_id).first()
    
    # Active subscription check
    sub = db.query(Subscription).filter(
        Subscription.company_id == user.company_id
    ).order_by(Subscription.created_at.desc()).first()

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "employee_id": user.employee_id,
        "department": emp.department if emp else "Executive",
        "designation": emp.designation if emp else ("Administrator" if user.role in ("admin", "owner") else "Staff"),
        "company": {
            "id": comp.id if comp else settings.DEFAULT_COMPANY_ID,
            "name": comp.name if comp else settings.DEFAULT_COMPANY_NAME,
            "pan": comp.pan if comp else "AABCB1234F",
            "tan": comp.tan if comp else "BLRB12345C",
            "epf_reg": comp.epf_reg if comp else "KN/BNG/1234567/000",
            "esic_reg": comp.esic_reg if comp else "53000123450000001",
            "address": comp.address if comp else "Bengaluru, Karnataka",
            "plan_tier": comp.plan_tier if comp else "free_trial",
            "subscription_status": comp.subscription_status if comp else "trial",
            "max_employees": comp.max_employees if comp else 25,
            "trial_ends_at": comp.trial_ends_at.isoformat() if comp and comp.trial_ends_at else None
        },
        "subscription": {
            "plan_tier": sub.plan_tier if sub else (comp.plan_tier if comp else "growth"),
            "status": sub.status if sub else (comp.subscription_status if comp else "active"),
            "billing_cycle": sub.billing_cycle if sub else "monthly"
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user via Email and Password.
    Returns standard JWT Bearer token.
    Supports demo fallback passwords for seeded hackathon accounts.
    """
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        # Check if user entered an ID or fallback
        user = db.query(User).filter(User.id == clean_email).first()

    # If demo mode and user exists, verify or check demo fallback
    if user:
        if not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
    else:
        # If user still not found, check if it's the first demo account request
        if clean_email in ("demo", "admin", "ananya"):
            user = db.query(User).first()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No account found with this email address."
            )

    # Generate real signed JWT token
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "company_id": user.company_id
    })

    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "access_token": token,
        "token_type": "Bearer",
        # Keep legacy token field for backwards compatibility
        "token": f"token_{user.id}",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "employee_id": user.employee_id,
            "company_id": user.company_id
        }
    }

@router.post("/register-organization")
def register_organization(req: RegisterOrgRequest, db: Session = Depends(get_db)):
    """
    Commercial SaaS Organization Onboarding:
    Registers a new corporate tenant, sets up 14-day Free Trial, creates the owner account.
    """
    clean_email = req.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in."
        )

    # 1. Create Organization Entity
    comp_id = f"comp_{uuid.uuid4().hex[:8]}"
    trial_days = 14
    trial_expiry = datetime.utcnow() + timedelta(days=trial_days)

    max_emps = 10 if req.plan_tier == "free_trial" else (25 if req.plan_tier == "starter" else 100)

    new_company = Company(
        id=comp_id,
        name=req.company_name.strip(),
        pan=req.pan.upper() if req.pan else "AABCB1234F",
        tan=req.tan.upper() if req.tan else "BLRB12345C",
        address=f"Commercial Office, {req.state or 'Karnataka'}",
        plan_tier=req.plan_tier or "free_trial",
        max_employees=max_emps,
        subscription_status="trialing",
        trial_ends_at=trial_expiry,
        features_enabled='["ai_auditor", "bank_cms", "epfo_ecr", "multi_state_pt", "maker_checker"]'
    )
    db.add(new_company)

    # 2. Create Owner User
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    hashed_pw = hash_password(req.password)
    new_user = User(
        id=user_id,
        company_id=comp_id,
        email=clean_email,
        full_name=req.owner_name.strip(),
        role="owner",
        password_hash=hashed_pw,
        is_active=True,
        last_login_at=datetime.utcnow()
    )
    db.add(new_user)

    # 3. Create initial Subscription record
    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    new_sub = Subscription(
        id=sub_id,
        company_id=comp_id,
        plan_tier=req.plan_tier or "free_trial",
        billing_cycle="monthly",
        amount=0.0,
        currency="INR",
        status="trialing",
        current_period_start=datetime.utcnow(),
        current_period_end=trial_expiry
    )
    db.add(new_sub)

    # 4. Audit Log
    db.add(AuditLog(
        id=f"log_{uuid.uuid4().hex[:8]}",
        company_id=comp_id,
        user_id=user_id,
        user_email=clean_email,
        user_role="owner",
        action="ORGANIZATION_REGISTERED",
        entity_type="COMPANY",
        entity_id=comp_id,
        details=f"Organization '{req.company_name}' registered with 14-day trial under plan '{req.plan_tier}'"
    ))

    db.commit()

    token = create_access_token({
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "company_id": comp_id
    })

    return {
        "status": "success",
        "message": f"Organization '{req.company_name}' registered successfully with a 14-day trial.",
        "access_token": token,
        "token_type": "Bearer",
        "token": f"token_{new_user.id}",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "company_id": comp_id
        },
        "company": {
            "id": new_company.id,
            "name": new_company.name,
            "plan_tier": new_company.plan_tier,
            "trial_ends_at": trial_expiry.isoformat()
        }
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Initiates secure password recovery. Returns reset token for verification."""
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        # Do not leak whether user exists for security, return positive generic message
        return {
            "status": "success",
            "message": "If an account with that email exists, password reset instructions have been generated."
        }

    reset_token = f"rst_{uuid.uuid4().hex}"
    user.reset_token = reset_token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    return {
        "status": "success",
        "message": "Password reset link generated successfully.",
        "reset_token": reset_token  # Returned directly for ease of testing & dev
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validates reset token and sets new password."""
    user = db.query(User).filter(User.reset_token == req.token).first()
    if not user or not user.reset_token_expires_at or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired."
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    user.password_hash = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return {
        "status": "success",
        "message": "Your password has been reset successfully. Please log in with your new password."
    }

@router.post("/invite-user")
def invite_user(
    req: InviteUserRequest,
    user: User = Depends(require_roles(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    """Invite an employee, manager, or payroll administrator to the organization."""
    comp_id = user.company_id
    clean_email = req.email.strip().lower()

    existing = db.query(User).filter(User.email == clean_email, User.company_id == comp_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already belongs to this organization.")

    token = f"inv_{uuid.uuid4().hex}"
    inv = EmployeeInvitation(
        id=f"inv_{uuid.uuid4().hex[:8]}",
        company_id=comp_id,
        email=clean_email,
        role=req.role,
        token=token,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(inv)
    db.commit()

    return {
        "status": "success",
        "message": f"Invitation created for {clean_email} with role {req.role}.",
        "invitation_token": token,
        "invitation_url": f"/accept-invitation?token={token}"
    }

@router.get("/invitations")
def list_invitations(
    user: User = Depends(require_roles(["owner", "admin"])),
    db: Session = Depends(get_db)
):
    """List pending team invitations for this organization."""
    invs = db.query(EmployeeInvitation).filter(
        EmployeeInvitation.company_id == user.company_id
    ).order_by(EmployeeInvitation.created_at.desc()).all()

    return {
        "invitations": [
            {
                "id": i.id,
                "email": i.email,
                "role": i.role,
                "status": i.status,
                "expires_at": i.expires_at.isoformat(),
                "created_at": i.created_at.isoformat()
            }
            for i in invs
        ]
    }
