import pytest
from app.database import SessionLocal, init_db
from app.models import (
    Company, User, Employee, PayrollPeriod, PayrollItem,
    SalaryStructure, SimulationScenario, SimulationItem, HRWorkflowTask, AuditLog
)
from app.intelligence_engine import (
    run_digital_twin_simulation, save_simulation_scenario,
    generate_payroll_forecast, run_intelligent_anomaly_detection,
    explain_payslip_variance, get_or_generate_workflow_tasks,
    execute_workflow_task_action
)

@pytest.fixture
def test_setup():
    init_db()
    db = SessionLocal()
    comp_id = "test_comp_intel"
    try:
        # Create test company
        comp = Company(id=comp_id, name="Intelligence Engine Test Corp")
        db.merge(comp)
        db.commit()

        # Create Admin and Employee users
        admin_user = User(
            id="usr_intel_admin",
            company_id=comp_id,
            email="admin@intelcorp.com",
            full_name="Intel Admin",
            role="payroll_admin"
        )
        emp_user = User(
            id="usr_intel_emp",
            company_id=comp_id,
            email="emp@intelcorp.com",
            full_name="Alice Roy",
            employee_id="emp_intel_01",
            role="employee"
        )
        other_emp_user = User(
            id="usr_intel_other",
            company_id=comp_id,
            email="other@intelcorp.com",
            full_name="Bob Sen",
            employee_id="emp_intel_02",
            role="employee"
        )
        db.merge(admin_user)
        db.merge(emp_user)
        db.merge(other_emp_user)
        db.commit()

        # Create employees
        emp1 = Employee(
            id="emp_intel_01",
            company_id=comp_id,
            emp_code="INT-001",
            first_name="Alice",
            last_name="Roy",
            email="emp@intelcorp.com",
            department="Engineering",
            designation="Senior Dev",
            bank_name="HDFC Bank",
            bank_account="50100234567890",
            ifsc="HDFC0001234",
            state="Karnataka"
        )
        emp2 = Employee(
            id="emp_intel_02",
            company_id=comp_id,
            emp_code="INT-002",
            first_name="Bob",
            last_name="Sen",
            email="other@intelcorp.com",
            department="Product",
            designation="PM",
            bank_name="ICICI Bank",
            bank_account="",  # trigger missing bank details anomaly
            ifsc="",
            state="Karnataka"
        )
        db.merge(emp1)
        db.merge(emp2)
        db.commit()

        # Salary structures
        sal1 = SalaryStructure(
            id="sal_intel_01",
            company_id=comp_id,
            employee_id="emp_intel_01",
            ctc_annual=1200000.0,
            basic=50000.0,
            hra=25000.0,
            special_allowance=25000.0,
            pf_applicable=True,
            esi_applicable=False,
            pt_applicable=True,
            pt_state="Karnataka"
        )
        sal2 = SalaryStructure(
            id="sal_intel_02",
            company_id=comp_id,
            employee_id="emp_intel_02",
            ctc_annual=960000.0,
            basic=40000.0,
            hra=20000.0,
            special_allowance=20000.0,
            pf_applicable=True,
            esi_applicable=False,
            pt_applicable=True,
            pt_state="Karnataka"
        )
        db.merge(sal1)
        db.merge(sal2)
        db.commit()

        # Create past payroll periods and items
        period1 = PayrollPeriod(
            id="prd_intel_sep",
            company_id=comp_id,
            month=9,
            year=2026,
            name="September 2026",
            status="processed"
        )
        period2 = PayrollPeriod(
            id="prd_intel_oct",
            company_id=comp_id,
            month=10,
            year=2026,
            name="October 2026",
            status="processed"
        )
        db.merge(period1)
        db.merge(period2)
        db.commit()

        item1_p1 = PayrollItem(
            id="item_intel_01_sep",
            period_id="prd_intel_sep",
            company_id=comp_id,
            employee_id="emp_intel_01",
            gross_earnings=100000.0,
            basic=50000.0,
            hra=25000.0,
            special_allowance=25000.0,
            employee_pf=1800.0,
            employee_esi=0.0,
            professional_tax=200.0,
            tds=6000.0,
            total_deductions=8000.0,
            net_salary=92000.0,
            employer_pf=1800.0,
            employer_esi=0.0,
            total_employer_cost=101800.0,
            unpaid_leave_days=0.0
        )
        db.merge(item1_p1)

        # In October, Alice had 2 days unpaid leave (loss of pay)
        item1_p2 = PayrollItem(
            id="item_intel_01_oct",
            period_id="prd_intel_oct",
            company_id=comp_id,
            employee_id="emp_intel_01",
            gross_earnings=93548.39,
            basic=46774.19,
            hra=23387.10,
            special_allowance=23387.10,
            employee_pf=1800.0,
            employee_esi=0.0,
            professional_tax=200.0,
            tds=5500.0,
            total_deductions=7500.0,
            net_salary=86048.39,
            employer_pf=1800.0,
            employer_esi=0.0,
            total_employer_cost=95348.39,
            unpaid_leave_days=2.0
        )
        item2_p2 = PayrollItem(
            id="item_intel_02_oct",
            period_id="prd_intel_oct",
            company_id=comp_id,
            employee_id="emp_intel_02",
            gross_earnings=80000.0,
            basic=40000.0,
            hra=20000.0,
            special_allowance=20000.0,
            employee_pf=1800.0,
            employee_esi=0.0,
            professional_tax=200.0,
            tds=4000.0,
            total_deductions=6000.0,
            net_salary=74000.0,
            employer_pf=1800.0,
            employer_esi=0.0,
            total_employer_cost=81800.0,
            unpaid_leave_days=0.0
        )
        db.merge(item1_p2)
        db.merge(item2_p2)
        db.commit()

        yield {
            "db": db,
            "company_id": comp_id,
            "admin_user": admin_user,
            "emp_user": emp_user,
            "other_emp_user": other_emp_user,
            "period_id": "prd_intel_oct",
            "item_id": "item_intel_01_oct"
        }
    finally:
        db.rollback()
        # Cleanup test company data
        db.query(AuditLog).filter(AuditLog.company_id == comp_id).delete()
        db.query(SimulationItem).filter(SimulationItem.company_id == comp_id).delete()
        db.query(SimulationScenario).filter(SimulationScenario.company_id == comp_id).delete()
        db.query(HRWorkflowTask).filter(HRWorkflowTask.company_id == comp_id).delete()
        db.query(PayrollItem).filter(PayrollItem.company_id == comp_id).delete()
        db.query(PayrollPeriod).filter(PayrollPeriod.company_id == comp_id).delete()
        db.query(SalaryStructure).filter(SalaryStructure.company_id == comp_id).delete()
        db.query(Employee).filter(Employee.company_id == comp_id).delete()
        db.query(User).filter(User.company_id == comp_id).delete()
        db.query(Company).filter(Company.id == comp_id).delete()
        db.commit()
        db.close()


def test_digital_twin_simulation_and_isolation(test_setup):
    """Verify that digital twin models increments, bonuses, and hires accurately without altering production tables."""
    db = test_setup["db"]
    comp_id = test_setup["company_id"]
    
    # Baseline count of production payroll items before simulation
    prod_items_before = db.query(PayrollItem).filter(PayrollItem.company_id == comp_id).count()

    sim_params = {
        "scenario_name": "Q1 10% Engineering Hike & New Hire",
        "description": "Evaluating 10% hike and 1 backend engineer hire",
        "salary_increment_pct": 10.0,
        "bonus_pool_total": 50000.0,
        "department_filter": "Engineering",
        "base_period_id": "prd_intel_oct",
        "new_hires": [
            {
                "designation": "Junior Backend Dev",
                "department": "Engineering",
                "monthly_gross": 50000.0,
                "state": "Karnataka"
            }
        ]
    }

    result = run_digital_twin_simulation(
        db=db,
        company_id=comp_id,
        base_period_id="prd_intel_oct",
        department_hikes={"Engineering": 10.0},
        new_hires=sim_params["new_hires"],
        bonus_pool=50000.0
    )

    # Assert deterministic calculations
    assert result["baseline_summary"]["headcount"] == 2
    assert result["simulated_summary"]["headcount"] == 3
    assert result["baseline_summary"]["total_cost_ctc"] > 0
    assert result["simulated_summary"]["total_cost_ctc"] > result["baseline_summary"]["total_cost_ctc"]
    assert result["variance"]["cost_delta_monthly"] > 0
    assert len(result["simulated_items"]) == 3

    # CRITICAL: Production records must NOT be modified
    prod_items_after = db.query(PayrollItem).filter(PayrollItem.company_id == comp_id).count()
    assert prod_items_before == prod_items_after

    # Save scenario
    saved = save_simulation_scenario(
        db=db,
        company_id=comp_id,
        user_id="usr_intel_admin",
        name=sim_params["scenario_name"],
        description=sim_params["description"],
        base_period_id="prd_intel_oct",
        simulation_result=result,
        parameters=sim_params
    )

    assert saved.id is not None
    assert saved.baseline_total_cost == result["baseline_summary"]["total_cost_ctc"]

    # Verify scenario persisted in simulation tables
    sc = db.query(SimulationScenario).filter(SimulationScenario.id == saved.id).first()
    assert sc is not None
    assert sc.company_id == comp_id
    assert sc.cost_delta == result["variance"]["cost_delta_monthly"]


def test_payroll_forecasting(test_setup):
    """Verify statistical payroll forecasting produces projections with transparent assumptions and bounds."""
    db = test_setup["db"]
    comp_id = test_setup["company_id"]

    forecast = generate_payroll_forecast(db, comp_id, forecast_months=4)

    assert "forecast_series" in forecast
    assert "next_month_projection" in forecast
    assert "assumptions" in forecast

    projected_items = [f for f in forecast["forecast_series"] if f["is_forecast"]]
    assert len(projected_items) == 4

    # Every projected point must have bounds and uncertainty metrics
    for p in projected_items:
        assert p["is_forecast"] is True
        assert p["payroll_cost"] > 0
        assert p["lower_bound"] <= p["payroll_cost"] <= p["upper_bound"]

    # Assumptions must be clearly listed
    assert len(forecast["assumptions"]) >= 3
    assert any("Statutory" in a for a in forecast["assumptions"])


def test_anomaly_detection_radar(test_setup):
    """Verify multi-factor anomaly radar detects missing bank accounts and compliance risks."""
    db = test_setup["db"]
    comp_id = test_setup["company_id"]

    radar = run_intelligent_anomaly_detection(db, comp_id, period_id="prd_intel_oct")
    assert "anomalies" in radar
    anomalies = radar["anomalies"]
    assert len(anomalies) > 0

    # Bob Sen has missing bank details
    missing_bank_anomaly = next((a for a in anomalies if a["rule_code"] == "MISSING_BANK_CREDENTIALS"), None)
    assert missing_bank_anomaly is not None
    assert missing_bank_anomaly["employee_id"] == "emp_intel_02"
    assert missing_bank_anomaly["severity"] == "HIGH"
    assert "recommended_investigation_steps" in missing_bank_anomaly


def test_explainable_payslip_isolation_and_math(test_setup):
    """Verify payslip assistant computes exact mathematical diff and enforces employee privacy."""
    db = test_setup["db"]
    comp_id = test_setup["company_id"]
    admin = test_setup["admin_user"]
    emp = test_setup["emp_user"]
    other_emp = test_setup["other_emp_user"]

    # 1. Admin can inspect payslip
    explanation_admin = explain_payslip_variance(
        db=db,
        company_id=comp_id,
        user=admin,
        employee_id="emp_intel_01",
        period_id_curr="prd_intel_oct",
        period_id_prev="prd_intel_sep",
        question="Why did take-home pay reduce this month?"
    )
    assert explanation_admin["employee_name"] == "Alice Roy"
    assert "components" in explanation_admin
    assert explanation_admin["net_difference"] < 0

    # 2. Alice (the owner of the payslip) can inspect her own payslip
    explanation_owner = explain_payslip_variance(
        db=db,
        company_id=comp_id,
        user=emp,
        employee_id="emp_intel_01",
        period_id_curr="prd_intel_oct",
        period_id_prev="prd_intel_sep",
        question="Why is my pay lower?"
    )
    assert explanation_owner["employee_id"] == "emp_intel_01"

    # 3. PRIVACY ENFORCEMENT: Other employee cannot access Alice's payslip
    denied = explain_payslip_variance(
        db=db,
        company_id=comp_id,
        user=other_emp,
        employee_id="emp_intel_01",
        period_id_curr="prd_intel_oct",
        period_id_prev="prd_intel_sep",
        question="Show me this salary."
    )
    assert "error" in denied
    assert "Access Denied" in denied["error"]


def test_hr_workflow_agent_actions(test_setup):
    """Verify workflow agent generates tasks and requires authorized human review for sensitive actions."""
    db = test_setup["db"]
    comp_id = test_setup["company_id"]
    admin = test_setup["admin_user"]
    emp = test_setup["emp_user"]

    tasks = get_or_generate_workflow_tasks(db, comp_id)
    assert len(tasks) > 0

    task = tasks[0]
    task_id = task["id"]

    # Employee cannot approve consequential HR tasks
    emp_action = execute_workflow_task_action(
        db=db,
        company_id=comp_id,
        user=emp,
        task_id=task_id,
        action="approve"
    )
    assert "error" in emp_action
    assert "Permission Denied" in emp_action["error"]

    # Admin CAN approve task
    res = execute_workflow_task_action(
        db=db,
        company_id=comp_id,
        user=admin,
        task_id=task_id,
        action="approve"
    )
    assert res["status"] == "success"
    assert res["new_status"] == "approved"
