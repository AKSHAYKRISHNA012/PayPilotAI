import pytest
from app.payroll_engine import (
    calculate_ctc_breakdown, calculate_professional_tax,
    calculate_monthly_tds_estimate, round_curr
)

def test_ctc_calculator_reconciliation_12_lakhs():
    """Verify 12 Lakhs CTC reconciliation under New Tax Regime."""
    res = calculate_ctc_breakdown(
        annual_ctc=1200000.0,
        regime="new",
        state="Karnataka",
        pf_capped=True
    )
    # Monthly CTC: 100,000
    assert res["monthly_ctc"] == 100000.0
    # Gross + Employer PF (1,800) == Monthly CTC
    assert res["monthly_gross"] + res["employer_pf"] + res["employer_esi"] == res["monthly_ctc"]
    assert res["monthly_gross"] == 98200.0
    assert res["basic"] == 49100.0
    assert res["hra"] == 24550.0
    assert res["special_allowance"] == 24550.0
    # Employer PF capped at 1,800
    assert res["employer_pf"] == 1800.0
    assert res["employee_pf"] == 1800.0
    # ESIC is 0 for gross > 21,000
    assert res["employee_esi"] == 0.0
    assert res["employer_esi"] == 0.0
    # PT in Karnataka for gross > 15,000 is 200
    assert res["professional_tax"] == 200.0
    # Monthly take-home + employee deductions == Monthly gross
    assert round(res["monthly_take_home"] + res["total_employee_deductions"], 2) == res["monthly_gross"]
    # Reconciled annual CTC matches within 0.01
    assert abs(res["reconciled_annual_ctc"] - 1200000.0) < 1.0
    assert res["reconciliation_variance"] < 0.01

def test_ctc_calculator_reconciliation_3_lakhs():
    """Verify 3 Lakhs CTC (Entry salary tier) calculation and reconciliation."""
    res = calculate_ctc_breakdown(
        annual_ctc=300000.0,
        regime="new",
        state="Karnataka",
        pf_capped=True
    )
    assert res["monthly_ctc"] == 25000.0
    # Reconciles: Gross + Employer Contributions == Monthly CTC
    assert round(res["monthly_gross"] + res["total_employer_contribution"], 2) == res["monthly_ctc"]
    # Section 87A rebate should make tax zero under 7L taxable
    assert res["monthly_tds"] == 0.0
    # Take-home + deductions == Gross
    assert round(res["monthly_take_home"] + res["total_employee_deductions"], 2) == res["monthly_gross"]

def test_ctc_calculator_low_wage_esic_threshold():
    """Verify low wage employee (CTC 2.4L) triggers 0.75% / 3.25% ESIC correctly."""
    res = calculate_ctc_breakdown(
        annual_ctc=240000.0,
        regime="new",
        state="Karnataka",
        pf_capped=True
    )
    assert res["monthly_ctc"] == 20000.0
    assert res["monthly_gross"] <= 21000.0
    assert res["employee_esi"] > 0.0
    assert res["employer_esi"] > 0.0
    # Gross + Employer PF + Employer ESIC == 20,000
    assert round(res["monthly_gross"] + res["employer_pf"] + res["employer_esi"], 2) == 20000.0

def test_ctc_calculator_multiple_salary_levels():
    """Test reconciliation invariant across wide salary bands from 3L to 50L."""
    test_ctcs = [300000, 500000, 750000, 1000000, 1500000, 2500000, 5000000]
    for ctc in test_ctcs:
        for regime in ["new", "old"]:
            for state in ["Karnataka", "Maharashtra", "Delhi", "Telangana"]:
                res = calculate_ctc_breakdown(annual_ctc=float(ctc), regime=regime, state=state)
                # Invariant 1: Monthly Employer Cost matches Monthly CTC
                assert res["reconciliation_variance"] < 1.0
                # Invariant 2: Take-home + Deductions == Gross
                assert round(res["monthly_take_home"] + res["total_employee_deductions"], 2) == res["monthly_gross"]
                # Invariant 3: Take-Home is never negative
                assert res["monthly_take_home"] >= 0.0

def test_ctc_calculator_state_pt_variation():
    """Verify that changing state immediately adjusts Professional Tax output."""
    res_delhi = calculate_ctc_breakdown(annual_ctc=1200000.0, state="Delhi")
    res_karnataka = calculate_ctc_breakdown(annual_ctc=1200000.0, state="Karnataka")
    res_mh = calculate_ctc_breakdown(annual_ctc=1200000.0, state="Maharashtra")

    assert res_delhi["professional_tax"] == 0.0
    assert res_karnataka["professional_tax"] == 200.0
    assert res_mh["professional_tax"] == 200.0
