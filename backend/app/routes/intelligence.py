from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.database import get_db
from app.models import User, SimulationScenario
from app.routes.auth import get_current_user
from app.intelligence_engine import (
    run_digital_twin_simulation,
    save_simulation_scenario,
    generate_payroll_forecast,
    run_intelligent_anomaly_detection,
    explain_payslip_variance,
    get_or_generate_workflow_tasks,
    execute_workflow_task_action
)

router = APIRouter(prefix="/api/intelligence", tags=["intelligence"])

# Request Models
class SimulateDigitalTwinRequest(BaseModel):
    base_period_id: Optional[str] = "period_oct_2026"
    department_hikes: Optional[Dict[str, float]] = None
    individual_hikes: Optional[Dict[str, float]] = None
    new_hires: Optional[List[Dict[str, Any]]] = None
    bonus_pool: Optional[float] = 0.0
    bonus_department: Optional[str] = None

class SaveScenarioRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    base_period_id: str
    simulation_result: Dict[str, Any]
    parameters: Dict[str, Any]

class ExplainPayslipRequest(BaseModel):
    employee_id: Optional[str] = None
    current_period_id: str = "period_oct_2026"
    comparison_period_id: Optional[str] = "period_sep_2026"
    question: Optional[str] = None

class ReviewWorkflowTaskRequest(BaseModel):
    action: str  # "approve" or "reject"

@router.get("/summary")
def get_intelligence_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregated operational intelligence dashboard overview."""
    comp_id = user.company_id

    forecast_data = generate_payroll_forecast(db=db, company_id=comp_id, forecast_months=1)
    anomaly_data = run_intelligent_anomaly_detection(db=db, company_id=comp_id)
    scenarios_count = db.query(SimulationScenario).filter(SimulationScenario.company_id == comp_id).count()
    workflow_tasks = get_or_generate_workflow_tasks(db=db, company_id=comp_id)
    pending_tasks = sum(1 for t in workflow_tasks if t["status"] == "pending_approval")

    return {
        "next_month_projection": forecast_data["next_month_projection"],
        "anomaly_summary": anomaly_data["severity_summary"],
        "total_open_anomalies": anomaly_data["open_count"],
        "scenarios_count": scenarios_count,
        "pending_workflow_tasks": pending_tasks,
        "is_employee": user.role == "employee"
    }

@router.post("/digital-twin/simulate")
def simulate_digital_twin(
    req: SimulateDigitalTwinRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Executes deterministic digital twin simulation without modifying production records."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied: Only HR or Payroll Administrators can run Digital Twin simulations.")

    result = run_digital_twin_simulation(
        db=db,
        company_id=user.company_id,
        base_period_id=req.base_period_id or "period_oct_2026",
        department_hikes=req.department_hikes,
        individual_hikes=req.individual_hikes,
        new_hires=req.new_hires,
        bonus_pool=req.bonus_pool or 0.0,
        bonus_department=req.bonus_department
    )
    return result

@router.post("/digital-twin/save")
def save_scenario(
    req: SaveScenarioRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves a simulation scenario in isolated sandbox tables."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied")

    scenario = save_simulation_scenario(
        db=db,
        company_id=user.company_id,
        user_id=user.id,
        name=req.name,
        description=req.description or "",
        base_period_id=req.base_period_id,
        simulation_result=req.simulation_result,
        parameters=req.parameters
    )
    return {
        "status": "success",
        "scenario_id": scenario.id,
        "name": scenario.name,
        "cost_delta": scenario.cost_delta,
        "cost_delta_pct": scenario.cost_delta_pct
    }

@router.get("/digital-twin/scenarios")
def list_scenarios(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists saved simulation scenarios for this organization."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied")

    scenarios = db.query(SimulationScenario).filter(
        SimulationScenario.company_id == user.company_id
    ).order_by(SimulationScenario.created_at.desc()).all()

    return {
        "scenarios": [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "base_period_id": s.base_period_id,
                "baseline_total_cost": s.baseline_total_cost,
                "simulated_total_cost": s.simulated_total_cost,
                "cost_delta": s.cost_delta,
                "cost_delta_pct": s.cost_delta_pct,
                "status": s.status,
                "created_at": s.created_at.strftime("%b %d, %Y")
            }
            for s in scenarios
        ]
    }

@router.delete("/digital-twin/scenarios/{id}")
def delete_scenario(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a simulation scenario."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied")

    s = db.query(SimulationScenario).filter(
        SimulationScenario.id == id,
        SimulationScenario.company_id == user.company_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Scenario not found")

    db.delete(s)
    db.commit()
    return {"status": "success", "message": "Scenario deleted"}

@router.get("/forecast")
def get_payroll_forecast(
    months: int = Query(4, ge=1, le=12),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates statistical payroll expenditure forecast with confidence bounds."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied: Forecast access restricted to HR & Finance leadership.")

    return generate_payroll_forecast(
        db=db,
        company_id=user.company_id,
        forecast_months=months
    )

@router.get("/anomalies")
def get_anomaly_radar(
    period_id: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Multi-factor anomaly detection radar."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied")

    return run_intelligent_anomaly_detection(
        db=db,
        company_id=user.company_id,
        period_id=period_id
    )

@router.post("/explain-payslip")
def explain_payslip(
    req: ExplainPayslipRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Provides mathematically verified explanations of payslip changes with strict privacy enforcement."""
    target_emp_id = req.employee_id
    if user.role == "employee":
        target_emp_id = user.employee_id  # Enforce self-only privacy!

    if not target_emp_id:
        raise HTTPException(status_code=400, detail="Employee ID required")

    result = explain_payslip_variance(
        db=db,
        company_id=user.company_id,
        user=user,
        employee_id=target_emp_id,
        period_id_curr=req.current_period_id,
        period_id_prev=req.comparison_period_id,
        question=req.question
    )

    if "error" in result:
        raise HTTPException(status_code=403 if "Access Denied" in result["error"] else 400, detail=result["error"])

    return result

@router.get("/workflow/tasks")
def list_workflow_tasks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists HR workflow action items requiring review or execution."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied")

    tasks = get_or_generate_workflow_tasks(db=db, company_id=user.company_id)
    return {"tasks": tasks}

@router.post("/workflow/tasks/{id}/review")
def review_workflow_task(
    id: str,
    req: ReviewWorkflowTaskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approves or rejects consequential workflow actions with human-in-the-loop authorization."""
    if user.role not in ["admin", "payroll_admin", "owner"]:
        raise HTTPException(status_code=403, detail="Permission Denied")

    if req.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    res = execute_workflow_task_action(
        db=db,
        company_id=user.company_id,
        user=user,
        task_id=id,
        action=req.action
    )

    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    return res
