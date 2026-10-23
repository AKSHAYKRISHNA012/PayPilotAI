from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import AuditFinding, PayrollPeriod, Employee, User, AuditLog, PayrollItem
from app.routes.auth import get_current_user
from app.auditor_engine import run_payroll_audit

router = APIRouter(prefix="/api/auditor", tags=["auditor"])

class RunAuditRequest(BaseModel):
    period_id: str

class ResolveFindingRequest(BaseModel):
    status: str  # Resolved, Accepted, Investigating
    resolution_note: str

@router.get("/findings")
def get_findings(
    period_id: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_id = user.company_id
    query = db.query(AuditFinding).filter(AuditFinding.company_id == comp_id)

    # Privacy constraint
    if user.role == "employee" and user.employee_id:
        query = query.filter(AuditFinding.employee_id == user.employee_id)

    if period_id and period_id != "all":
        query = query.filter(AuditFinding.period_id == period_id)
    else:
        # Default to latest period
        latest_p = db.query(PayrollPeriod).filter(
            PayrollPeriod.company_id == comp_id
        ).order_by(PayrollPeriod.year.desc(), PayrollPeriod.month.desc()).first()
        if latest_p:
            query = query.filter(AuditFinding.period_id == latest_p.id)

    if severity and severity != "all":
        query = query.filter(AuditFinding.severity == severity)
    if category and category != "all":
        query = query.filter(AuditFinding.category == category)
    if status and status != "all":
        query = query.filter(AuditFinding.status == status)

    findings = query.order_by(AuditFinding.created_at.desc()).all()
    results = []
    for f in findings:
        emp = db.query(Employee).filter(Employee.id == f.employee_id).first()
        results.append({
            "id": f.id,
            "period_id": f.period_id,
            "employee_id": f.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "emp_code": emp.emp_code if emp else "",
            "department": emp.department if emp else "",
            "category": f.category,
            "severity": f.severity,
            "title": f.title,
            "description": f.description,
            "expected_value": f.expected_value,
            "observed_value": f.observed_value,
            "recommended_action": f.recommended_action,
            "status": f.status,
            "resolution_note": f.resolution_note,
            "resolved_at": f.resolved_at.isoformat() if f.resolved_at else None
        })

    # Severity counts
    critical_c = sum(1 for f in findings if f.severity == "CRITICAL" and f.status == "Open")
    high_c = sum(1 for f in findings if f.severity == "HIGH" and f.status == "Open")
    medium_c = sum(1 for f in findings if f.severity == "MEDIUM" and f.status == "Open")
    low_c = sum(1 for f in findings if f.severity == "LOW" and f.status == "Open")
    resolved_c = sum(1 for f in findings if f.status in ["Resolved", "Accepted"])

    return {
        "findings": results,
        "summary": {
            "total_open": critical_c + high_c + medium_c + low_c,
            "critical": critical_c,
            "high": high_c,
            "medium": medium_c,
            "low": low_c,
            "resolved": resolved_c
        }
    }

@router.post("/run")
def trigger_audit(
    req: RunAuditRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    findings = run_payroll_audit(db=db, company_id=user.company_id, period_id=req.period_id)
    
    db.add(AuditLog(
        id=f"log_{datetime.utcnow().timestamp()}",
        company_id=user.company_id,
        user_id=user.id,
        action="PAYROLL_AUDIT_EXECUTED",
        entity_type="PAYROLL_PERIOD",
        entity_id=req.period_id,
        details=f"Ran AI Payroll Audit: identified {len(findings)} findings"
    ))
    db.commit()

    return {
        "status": "success",
        "message": f"AI Payroll Audit completed successfully. {len(findings)} findings processed.",
        "findings_count": len(findings)
    }

@router.post("/findings/{id}/resolve")
def resolve_finding(
    id: str,
    req: ResolveFindingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user.role not in ["admin", "payroll_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    f = db.query(AuditFinding).filter(
        AuditFinding.id == id,
        AuditFinding.company_id == user.company_id
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    f.status = req.status
    f.resolution_note = req.resolution_note
    f.resolved_at = datetime.utcnow()

    # Update corresponding PayrollItem if resolved
    item = db.query(PayrollItem).filter(
        PayrollItem.period_id == f.period_id,
        PayrollItem.employee_id == f.employee_id
    ).first()
    if item and req.status == "Resolved":
        item.audit_status = "resolved"

    db.add(AuditLog(
        id=f"log_{datetime.utcnow().timestamp()}",
        company_id=user.company_id,
        user_id=user.id,
        action=f"AUDIT_FINDING_{req.status.upper()}",
        entity_type="AUDIT_FINDING",
        entity_id=id,
        details=f"Finding '{f.title}' marked as {req.status}: {req.resolution_note}"
    ))

    db.commit()
    return {"status": "success", "message": f"Finding marked as {req.status}"}
