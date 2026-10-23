import pytest
from app.database import SessionLocal
from app.models import Company, User, Employee, PayrollPeriod, PayrollItem
from app.routes.employees import list_employees
from app.routes.payroll import get_period_detail
from fastapi import HTTPException

def test_tenant_isolation_employee_directory():
    """Verify that a user from Company A cannot view employees of Company B."""
    db = SessionLocal()
    try:
        # Create Company A and Company B
        comp_a = Company(id="test_comp_a", name="Company Alpha")
        comp_b = Company(id="test_comp_b", name="Company Beta")
        db.merge(comp_a)
        db.merge(comp_b)
        
        # User in Company A
        user_a = User(
            id="usr_alpha_admin",
            company_id="test_comp_a",
            email="admin@alpha.com",
            full_name="Alpha Admin",
            role="admin"
        )
        db.merge(user_a)

        # Employees in Company A and Company B
        emp_a = Employee(
            id="emp_alpha_01",
            company_id="test_comp_a",
            emp_code="ALP-001",
            first_name="Alice",
            last_name="Alpha",
            email="alice@alpha.com",
            department="Engineering",
            designation="Engineer"
        )
        emp_b = Employee(
            id="emp_beta_01",
            company_id="test_comp_b",
            emp_code="BET-001",
            first_name="Bob",
            last_name="Beta",
            email="bob@beta.com",
            department="Marketing",
            designation="Marketer"
        )
        db.merge(emp_a)
        db.merge(emp_b)
        db.commit()

        # Query employees as user_a (Company A)
        res = list_employees(user=user_a, db=db)
        emp_ids = [e["id"] for e in res["employees"]]
        
        # Must contain Alpha employee, must NOT contain Beta employee
        assert "emp_alpha_01" in emp_ids
        assert "emp_beta_01" not in emp_ids

    finally:
        db.rollback()
        db.query(Employee).filter(Employee.id.in_(["emp_alpha_01", "emp_beta_01"])).delete()
        db.query(User).filter(User.id == "usr_alpha_admin").delete()
        db.query(Company).filter(Company.id.in_(["test_comp_a", "test_comp_b"])).delete()
        db.commit()
        db.close()

def test_tenant_isolation_payroll_period():
    """Verify that a user from Company A cannot read or access Company B's payroll period."""
    db = SessionLocal()
    try:
        comp_a = Company(id="test_comp_a2", name="Company Alpha 2")
        comp_b = Company(id="test_comp_b2", name="Company Beta 2")
        db.merge(comp_a)
        db.merge(comp_b)

        period_b = PayrollPeriod(
            id="period_beta_oct2",
            company_id="test_comp_b2",
            month=10,
            year=2026,
            name="October 2026 Beta 2"
        )
        db.merge(period_b)

        # User belonging to Company A
        user_a = User(
            id="usr_alpha_2",
            company_id="test_comp_a2",
            email="admin2@alpha.com",
            full_name="Alpha Admin 2",
            role="admin"
        )
        db.merge(user_a)
        db.commit()

        # Attempting to fetch Period B with User A's tenant credentials must throw 404
        with pytest.raises(HTTPException) as excinfo:
            get_period_detail(id="period_beta_oct2", user=user_a, db=db)
        assert excinfo.value.status_code == 404

    finally:
        db.rollback()
        db.query(PayrollPeriod).filter(PayrollPeriod.id == "period_beta_oct2").delete()
        db.query(User).filter(User.id == "usr_alpha_2").delete()
        db.query(Company).filter(Company.id.in_(["test_comp_a2", "test_comp_b2"])).delete()
        db.commit()
        db.close()
