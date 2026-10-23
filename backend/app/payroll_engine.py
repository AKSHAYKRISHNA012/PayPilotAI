from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional

def round_curr(val: float) -> float:
    """Decimal-safe rounding to nearest 2 decimal places."""
    d = Decimal(str(val))
    return float(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def calculate_professional_tax(gross_monthly: float, state: str = "Karnataka") -> float:
    """
    Deterministic Indian Professional Tax calculation based on state rules.
    Karnataka: ₹0 if <= 15000, ₹200 if > 15000.
    Maharashtra: ₹0 if <= 7500, ₹175 if 7501-10000, ₹200 if > 10000 (Feb is ₹300, handled as ₹200 avg).
    Telangana: ₹0 if <= 15000, ₹150 if 15001-20000, ₹200 if > 20000.
    Delhi/Default: ₹0 (No PT in Delhi).
    """
    state_norm = (state or "Karnataka").strip().lower()
    
    if "karnataka" in state_norm:
        return 200.0 if gross_monthly > 15000 else 0.0
    elif "maharashtra" in state_norm:
        if gross_monthly > 10000:
            return 200.0
        elif gross_monthly > 7500:
            return 175.0
        return 0.0
    elif "telangana" in state_norm:
        if gross_monthly > 20000:
            return 200.0
        elif gross_monthly > 15000:
            return 150.0
        return 0.0
    elif "delhi" in state_norm:
        return 0.0
    else:
        # Default fallback standard slab
        return 200.0 if gross_monthly > 15000 else 0.0

def calculate_monthly_tds_estimate(
    annual_gross: float,
    regime: str = "new",
    standard_deduction: float = 75000.0,
    override_monthly: Optional[float] = None
) -> float:
    """
    Estimates monthly TDS based on Indian Income Tax rules.
    If override_monthly is provided (> 0), use that directly.
    Otherwise, computes for FY 2025-26 / 2026-27 New Tax Regime:
      Up to 3,00,000: Nil
      3,00,001 to 7,00,000: 5%
      7,00,001 to 10,00,000: 10%
      10,00,001 to 12,00,000: 15%
      12,00,001 to 15,00,000: 20%
      Above 15,00,000: 30%
      Rebate u/s 87A: If taxable income <= 7,00,000, tax is Nil.
      4% Health & Education Cess applied.
    """
    if override_monthly is not None and override_monthly > 0:
        return round_curr(override_monthly)
        
    taxable_income = max(0.0, annual_gross - standard_deduction)
    
    if taxable_income <= 700000.0:
        return 0.0
        
    tax = 0.0
    # Slab 1: 0 - 3L (0)
    # Slab 2: 3L - 7L (5% on 4L = 20,000)
    if taxable_income > 300000.0:
        taxable_in_slab = min(taxable_income, 700000.0) - 300000.0
        tax += taxable_in_slab * 0.05
        
    # Slab 3: 7L - 10L (10% on 3L = 30,000)
    if taxable_income > 700000.0:
        taxable_in_slab = min(taxable_income, 1000000.0) - 700000.0
        tax += taxable_in_slab * 0.10
        
    # Slab 4: 10L - 12L (15% on 2L = 30,000)
    if taxable_income > 1000000.0:
        taxable_in_slab = min(taxable_income, 1200000.0) - 1000000.0
        tax += taxable_in_slab * 0.15
        
    # Slab 5: 12L - 15L (20% on 3L = 60,000)
    if taxable_income > 1200000.0:
        taxable_in_slab = min(taxable_income, 1500000.0) - 1200000.0
        tax += taxable_in_slab * 0.20
        
    # Slab 6: Above 15L (30%)
    if taxable_income > 1500000.0:
        taxable_in_slab = taxable_income - 1500000.0
        tax += taxable_in_slab * 0.30

    # Add 4% Cess
    tax_with_cess = tax * 1.04
    monthly_tds = tax_with_cess / 12.0
    return round_curr(monthly_tds)

def calculate_payroll_item(
    basic: float,
    hra: float,
    special_allowance: float = 0.0,
    conveyance: float = 0.0,
    medical_allowance: float = 0.0,
    bonus_or_variable: float = 0.0,
    other_earnings: float = 0.0,
    pf_applicable: bool = True,
    pf_type: str = "statutory_capped_1800",
    esi_applicable: bool = True,
    pt_applicable: bool = True,
    pt_state: str = "Karnataka",
    unpaid_leave_days: float = 0.0,
    working_days: int = 22,
    tax_regime: str = "new",
    tds_override: Optional[float] = None,
    other_deductions: float = 0.0
) -> Dict[str, Any]:
    """
    Computes complete monthly salary line for an employee in India.
    Returns full earnings, statutory contributions, deductions, net salary, and CTC.
    """
    # 1. Base Gross Earnings before LOP
    gross_earnings_raw = (
        basic + hra + special_allowance + conveyance + 
        medical_allowance + bonus_or_variable + other_earnings
    )
    gross_earnings = round_curr(gross_earnings_raw)

    # 2. Loss of Pay (LOP) for Unpaid Leave
    # Daily rate = gross_earnings / working_days
    lop_deduction = 0.0
    if unpaid_leave_days > 0 and working_days > 0:
        daily_rate = gross_earnings / float(working_days)
        lop_deduction = round_curr(daily_rate * unpaid_leave_days)

    # 3. Employee Provident Fund (PF)
    # Statutory cap: 12% of basic or 12% of 15,000 = ₹1,800
    employee_pf = 0.0
    employer_pf = 0.0
    if pf_applicable:
        if pf_type == "statutory_capped_1800":
            pf_wage = min(basic, 15000.0)
            employee_pf = round_curr(pf_wage * 0.12)
            employer_pf = round_curr(pf_wage * 0.12)
        else:
            employee_pf = round_curr(basic * 0.12)
            employer_pf = round_curr(basic * 0.12)

    # 4. Employee State Insurance (ESI)
    # Applicable only if monthly gross <= ₹21,000
    employee_esi = 0.0
    employer_esi = 0.0
    if esi_applicable and gross_earnings <= 21000.0:
        employee_esi = round_curr(gross_earnings * 0.0075) # 0.75%
        employer_esi = round_curr(gross_earnings * 0.0325) # 3.25%

    # 5. Professional Tax (PT)
    professional_tax = 0.0
    if pt_applicable:
        professional_tax = calculate_professional_tax(gross_earnings, pt_state)

    # 6. TDS (Income Tax)
    annual_est = (gross_earnings - lop_deduction) * 12.0
    tds = calculate_monthly_tds_estimate(
        annual_gross=annual_est,
        regime=tax_regime,
        override_monthly=tds_override
    )

    # 7. Total Employee Deductions
    total_deductions = round_curr(
        employee_pf + employee_esi + professional_tax + tds + lop_deduction + other_deductions
    )

    # 8. Net Take-Home Salary
    net_salary = round_curr(gross_earnings - total_deductions)

    # 9. Total Employer Cost (CTC for this month)
    total_employer_cost = round_curr(gross_earnings + employer_pf + employer_esi)

    return {
        "basic": round_curr(basic),
        "hra": round_curr(hra),
        "special_allowance": round_curr(special_allowance),
        "conveyance": round_curr(conveyance),
        "medical_allowance": round_curr(medical_allowance),
        "bonus_or_variable": round_curr(bonus_or_variable),
        "other_earnings": round_curr(other_earnings),
        "gross_earnings": gross_earnings,
        
        "employee_pf": employee_pf,
        "employer_pf": employer_pf,
        "employee_esi": employee_esi,
        "employer_esi": employer_esi,
        "professional_tax": professional_tax,
        "tds": tds,
        "unpaid_leave_days": unpaid_leave_days,
        "lop_deduction": lop_deduction,
        "other_deductions": round_curr(other_deductions),
        "total_deductions": total_deductions,
        
        "net_salary": net_salary,
        "total_employer_cost": total_employer_cost,
    }
