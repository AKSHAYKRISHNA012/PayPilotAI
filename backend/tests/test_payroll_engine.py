import pytest
from app.payroll_engine import (
    calculate_payroll_item, calculate_professional_tax,
    calculate_monthly_tds_estimate, round_curr
)

def test_round_curr():
    assert round_curr(100.456) == 100.46
    assert round_curr(100.454) == 100.45
    assert round_curr(0) == 0.0

def test_professional_tax_karnataka():
    # Karnataka: ₹0 if <= 15000, ₹200 if > 15000
    assert calculate_professional_tax(12000.0, "Karnataka") == 0.0
    assert calculate_professional_tax(15000.0, "Karnataka") == 0.0
    assert calculate_professional_tax(15001.0, "Karnataka") == 200.0
    assert calculate_professional_tax(75000.0, "Karnataka") == 200.0

def test_professional_tax_maharashtra():
    assert calculate_professional_tax(6000.0, "Maharashtra") == 0.0
    assert calculate_professional_tax(8500.0, "Maharashtra") == 175.0
    assert calculate_professional_tax(25000.0, "Maharashtra") == 200.0

def test_esi_applicability():
    # Low wage employee (gross <= 21,000): ESI is 0.75% for employee, 3.25% for employer
    result_low = calculate_payroll_item(
        basic=10000.0,
        hra=5000.0,
        special_allowance=3000.0,
        pf_applicable=True,
        esi_applicable=True,
        pt_applicable=True,
        pt_state="Karnataka"
    )
    assert result_low["gross_earnings"] == 18000.0
    assert result_low["employee_esi"] == round_curr(18000.0 * 0.0075) # 135.0
    assert result_low["employer_esi"] == round_curr(18000.0 * 0.0325) # 585.0

    # High wage employee (gross > 21,000): ESI should be 0
    result_high = calculate_payroll_item(
        basic=30000.0,
        hra=15000.0,
        special_allowance=10000.0,
        pf_applicable=True,
        esi_applicable=True,
        pt_applicable=True,
        pt_state="Karnataka"
    )
    assert result_high["gross_earnings"] == 55000.0
    assert result_high["employee_esi"] == 0.0
    assert result_high["employer_esi"] == 0.0

def test_pf_statutory_cap():
    # Statutory capped PF: 12% of min(basic, 15000) = ₹1,800
    res = calculate_payroll_item(
        basic=50000.0,
        hra=25000.0,
        special_allowance=15000.0,
        pf_applicable=True,
        pf_type="statutory_capped_1800"
    )
    assert res["employee_pf"] == 1800.0
    assert res["employer_pf"] == 1800.0

    # Uncapped actual basic PF: 12% of 50000 = ₹6,000
    res_uncapped = calculate_payroll_item(
        basic=50000.0,
        hra=25000.0,
        special_allowance=15000.0,
        pf_applicable=True,
        pf_type="actual_basic"
    )
    assert res_uncapped["employee_pf"] == 6000.0
    assert res_uncapped["employer_pf"] == 6000.0

def test_unpaid_leave_lop_deduction():
    # 22 working days, 2 unpaid leave days
    # Gross: 44,000 => Daily rate: 2,000 => LOP: 4,000
    res = calculate_payroll_item(
        basic=24000.0,
        hra=12000.0,
        special_allowance=8000.0,
        unpaid_leave_days=2.0,
        working_days=22,
        pf_applicable=False,
        pt_applicable=False
    )
    assert res["gross_earnings"] == 44000.0
    assert res["lop_deduction"] == 4000.0
    assert res["total_deductions"] == 4000.0
    assert res["net_salary"] == 40000.0

def test_net_salary_equation():
    res = calculate_payroll_item(
        basic=40000.0,
        hra=20000.0,
        special_allowance=10000.0,
        pf_applicable=True,
        pt_applicable=True,
        pt_state="Karnataka",
        unpaid_leave_days=1.0,
        working_days=22
    )
    # Net = Gross - Deductions
    assert round_curr(res["gross_earnings"] - res["total_deductions"]) == res["net_salary"]
    # Total employer cost = Gross + Employer PF + Employer ESI
    assert round_curr(res["gross_earnings"] + res["employer_pf"] + res["employer_esi"]) == res["total_employer_cost"]
