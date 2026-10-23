import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import (
    Base, Company, Employee, PayrollPeriod,
    PayrollItem, AuditFinding, AttendanceRecord
)
from app.auditor_engine import run_payroll_audit
from datetime import date

from sqlalchemy.pool import StaticPool

# In-memory test SQLite DB
@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed minimal company & employees
    comp = Company(id="comp_test", name="Test Corp")
    session.add(comp)

    emp1 = Employee(
        id="emp_test_1",
        company_id="comp_test",
        emp_code="TST-001",
        first_name="Test",
        last_name="Spike",
        email="spike@test.com",
        department="Eng",
        designation="Engineer",
        pan="ABCDE1111A",
        bank_account="1234567890",
        ifsc="HDFC0001"
    )
    emp2 = Employee(
        id="emp_test_2",
        company_id="comp_test",
        emp_code="TST-002",
        first_name="Test",
        last_name="Negative",
        email="negative@test.com",
        department="Sales",
        designation="Rep",
        pan="BCDEF2222B",
        bank_account="9876543210",
        ifsc="ICIC0001"
    )
    session.add_all([emp1, emp2])
    session.commit()

    yield session
    session.close()

def test_auditor_detects_negative_net_pay(test_db):
    period = PayrollPeriod(
        id="period_test_1",
        company_id="comp_test",
        month=10,
        year=2026,
        name="October 2026",
        working_days=22,
        status="calculated"
    )
    test_db.add(period)
    test_db.commit()

    # Item with negative net pay
    item = PayrollItem(
        id="item_neg",
        company_id="comp_test",
        period_id="period_test_1",
        employee_id="emp_test_2",
        gross_earnings=30000.0,
        total_deductions=35000.0,
        net_salary=-5000.0,
        audit_status="clean"
    )
    test_db.add(item)
    test_db.commit()

    findings = run_payroll_audit(test_db, "comp_test", "period_test_1")
    
    neg_findings = [f for f in findings if f.category == "Negative Net Pay"]
    assert len(neg_findings) == 1
    assert neg_findings[0].severity == "CRITICAL"
    assert "Negative Net Salary" in neg_findings[0].title
    assert neg_findings[0].employee_id == "emp_test_2"

def test_auditor_detects_salary_spike(test_db):
    # Previous period
    p_prev = PayrollPeriod(
        id="period_sep",
        company_id="comp_test",
        month=9,
        year=2026,
        name="September 2026",
        working_days=22,
        status="processed"
    )
    # Current period with 60% jump (> 30% threshold)
    p_curr = PayrollPeriod(
        id="period_oct",
        company_id="comp_test",
        month=10,
        year=2026,
        name="October 2026",
        working_days=22,
        status="calculated"
    )
    test_db.add_all([p_prev, p_curr])
    test_db.commit()

    prev_item = PayrollItem(
        id="item_prev",
        company_id="comp_test",
        period_id="period_sep",
        employee_id="emp_test_1",
        gross_earnings=50000.0,
        total_deductions=5000.0,
        net_salary=45000.0
    )
    curr_item = PayrollItem(
        id="item_curr",
        company_id="comp_test",
        period_id="period_oct",
        employee_id="emp_test_1",
        gross_earnings=80000.0, # Jump from 50k to 80k (+60%)
        total_deductions=8000.0,
        net_salary=72000.0
    )
    test_db.add_all([prev_item, curr_item])
    test_db.commit()

    findings = run_payroll_audit(test_db, "comp_test", "period_oct")

    spike_findings = [f for f in findings if f.category == "Salary Spike"]
    assert len(spike_findings) == 1
    assert spike_findings[0].severity == "HIGH"
    assert "+60.0%" in spike_findings[0].title
