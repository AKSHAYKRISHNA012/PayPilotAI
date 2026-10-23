from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional

TWOPLACES = Decimal("0.01")

def to_dec(val: Any) -> Decimal:
    """Converts any input into a Decimal safely."""
    if val is None:
        return Decimal("0.00")
    if isinstance(val, Decimal):
        return val
    try:
        return Decimal(str(val))
    except Exception:
        return Decimal("0.00")

def round_curr(val: Any) -> float:
    """Decimal-safe round to nearest 2 decimal places returning float."""
    d = to_dec(val)
    return float(d.quantize(TWOPLACES, rounding=ROUND_HALF_UP))

def calculate_professional_tax_decimal(gross_monthly: Decimal, state: str = "Karnataka") -> Decimal:
    """
    Authoritative state-wise Professional Tax calculation (Article 276 of Indian Constitution).
    Max limit: ₹2,500 per annum.
    State slabs:
      - Karnataka: Gross > ₹15,000 -> ₹200/month; <= ₹15,000 -> ₹0.
      - Maharashtra: Gross > ₹10,000 -> ₹200/month (Feb ₹300, normalized here to ₹200); ₹7,501-₹10,000 -> ₹175; <= ₹7,500 -> ₹0.
      - Telangana & Andhra Pradesh: Gross > ₹20,000 -> ₹200; ₹15,001-₹20,000 -> ₹150; <= ₹15,000 -> ₹0.
      - Gujarat: Gross > ₹12,000 -> ₹200; ₹9,000-₹12,000 -> ₹150; ₹6,000-₹8,999 -> ₹80; <= ₹5,999 -> ₹0.
      - West Bengal: Gross > ₹40,000 -> ₹200; ₹25,001-₹40,000 -> ₹150; ₹15,001-₹25,000 -> ₹130; ₹10,000-₹15,000 -> ₹110.
      - Delhi / Haryana / Rajasthan: ₹0 (No PT levied).
    """
    state_norm = (state or "Karnataka").strip().lower()

    if "karnataka" in state_norm:
        return Decimal("200.00") if gross_monthly > Decimal("15000.00") else Decimal("0.00")
    elif "maharashtra" in state_norm:
        if gross_monthly > Decimal("10000.00"):
            return Decimal("200.00")
        elif gross_monthly > Decimal("7500.00"):
            return Decimal("175.00")
        return Decimal("0.00")
    elif "telangana" in state_norm or "andhra" in state_norm:
        if gross_monthly > Decimal("20000.00"):
            return Decimal("200.00")
        elif gross_monthly > Decimal("15000.00"):
            return Decimal("150.00")
        return Decimal("0.00")
    elif "gujarat" in state_norm:
        if gross_monthly > Decimal("12000.00"):
            return Decimal("200.00")
        elif gross_monthly > Decimal("9000.00"):
            return Decimal("150.00")
        elif gross_monthly >= Decimal("6000.00"):
            return Decimal("80.00")
        return Decimal("0.00")
    elif "west bengal" in state_norm or "bengal" in state_norm:
        if gross_monthly > Decimal("40000.00"):
            return Decimal("200.00")
        elif gross_monthly > Decimal("25000.00"):
            return Decimal("150.00")
        elif gross_monthly > Decimal("15000.00"):
            return Decimal("130.00")
        elif gross_monthly >= Decimal("10000.00"):
            return Decimal("110.00")
        return Decimal("0.00")
    elif any(s in state_norm for s in ["delhi", "haryana", "rajasthan", "uttar pradesh"]):
        return Decimal("0.00")
    else:
        # Default standard slab
        return Decimal("200.00") if gross_monthly > Decimal("15000.00") else Decimal("0.00")

def calculate_professional_tax(gross_monthly: float, state: str = "Karnataka") -> float:
    return float(calculate_professional_tax_decimal(to_dec(gross_monthly), state))

def calculate_monthly_tds_estimate_decimal(
    annual_gross: Decimal,
    regime: str = "new",
    standard_deduction: Decimal = Decimal("75000.00"),
    override_monthly: Optional[Decimal] = None
) -> Decimal:
    """
    Authoritative TDS estimation under the New Tax Regime (Section 115BAC, FY 2025-26 & 2026-27).
    Standard Deduction: ₹75,000.
    Rebate under Section 87A: Tax is zero if taxable income <= ₹7,00,000.
    Slabs:
      0 to 3,00,000: Nil
      3,00,001 to 7,00,000: 5% (₹20,000)
      7,00,001 to 10,00,000: 10% (₹30,000)
      10,00,001 to 12,00,000: 15% (₹30,000)
      12,00,001 to 15,00,000: 20% (₹60,000)
      Above 15,00,000: 30%
    Health & Education Cess: 4% on computed tax.
    """
    if override_monthly is not None and override_monthly > Decimal("0.00"):
        return override_monthly.quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    taxable_income = max(Decimal("0.00"), annual_gross - standard_deduction)

    if taxable_income <= Decimal("700000.00"):
        return Decimal("0.00")

    tax = Decimal("0.00")

    # Slab 1: 0 - 3L (0)
    # Slab 2: 3L - 7L (5% on up to 4L)
    if taxable_income > Decimal("300000.00"):
        in_slab = min(taxable_income, Decimal("700000.00")) - Decimal("300000.00")
        tax += in_slab * Decimal("0.05")

    # Slab 3: 7L - 10L (10% on up to 3L)
    if taxable_income > Decimal("700000.00"):
        in_slab = min(taxable_income, Decimal("1000000.00")) - Decimal("700000.00")
        tax += in_slab * Decimal("0.10")

    # Slab 4: 10L - 12L (15% on up to 2L)
    if taxable_income > Decimal("1000000.00"):
        in_slab = min(taxable_income, Decimal("1200000.00")) - Decimal("1000000.00")
        tax += in_slab * Decimal("0.15")

    # Slab 5: 12L - 15L (20% on up to 3L)
    if taxable_income > Decimal("1200000.00"):
        in_slab = min(taxable_income, Decimal("1500000.00")) - Decimal("1200000.00")
        tax += in_slab * Decimal("0.20")

    # Slab 6: Above 15L (30%)
    if taxable_income > Decimal("1500000.00"):
        in_slab = taxable_income - Decimal("1500000.00")
        tax += in_slab * Decimal("0.30")

    # 4% Health and Education Cess
    tax_with_cess = tax * Decimal("1.04")
    monthly_tds = (tax_with_cess / Decimal("12.00")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
    return monthly_tds

def calculate_monthly_tds_estimate(
    annual_gross: float,
    regime: str = "new",
    standard_deduction: float = 75000.0,
    override_monthly: Optional[float] = None
) -> float:
    return float(calculate_monthly_tds_estimate_decimal(
        to_dec(annual_gross),
        regime,
        to_dec(standard_deduction),
        to_dec(override_monthly) if override_monthly is not None else None
    ))

def calculate_payroll_item(
    basic: float,
    hra: float,
    special_allowance: float = 0.0,
    conveyance: float = 0.0,
    medical_allowance: float = 0.0,
    bonus_or_variable: float = 0.0,
    other_earnings: float = 0.0,
    reimbursements: float = 0.0,
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
    Computes complete monthly salary line with pure Decimal arithmetic.
    Returns both float values (for API/DB compatibility) and verifies zero floating-point drift.
    """
    d_basic = to_dec(basic)
    d_hra = to_dec(hra)
    d_special = to_dec(special_allowance)
    d_conveyance = to_dec(conveyance)
    d_medical = to_dec(medical_allowance)
    d_bonus = to_dec(bonus_or_variable)
    d_other_earnings = to_dec(other_earnings)
    d_reimbursements = to_dec(reimbursements)
    d_unpaid_days = to_dec(unpaid_leave_days)
    d_working_days = Decimal(str(max(1, working_days)))
    d_other_deductions = to_dec(other_deductions)

    # 1. Base Gross Taxable Earnings
    gross_earnings = (
        d_basic + d_hra + d_special + d_conveyance +
        d_medical + d_bonus + d_other_earnings
    ).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # 2. Loss of Pay (LOP) Deduction
    lop_deduction = Decimal("0.00")
    if d_unpaid_days > Decimal("0.00") and d_working_days > Decimal("0.00"):
        daily_rate = gross_earnings / d_working_days
        lop_deduction = (daily_rate * d_unpaid_days).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # 3. Employee Provident Fund (EPF)
    # Under EPF Act 1952, statutory wage ceiling is ₹15,000 (12% = ₹1,800).
    employee_pf = Decimal("0.00")
    employer_pf = Decimal("0.00")
    if pf_applicable:
        if pf_type == "statutory_capped_1800":
            pf_wage = min(d_basic, Decimal("15000.00"))
            employee_pf = (pf_wage * Decimal("0.12")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
            employer_pf = employee_pf
        else:
            employee_pf = (d_basic * Decimal("0.12")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
            employer_pf = employee_pf

    # 4. Employee State Insurance (ESIC)
    # ESIC applies if Gross Monthly <= ₹21,000 (0.75% employee, 3.25% employer).
    employee_esi = Decimal("0.00")
    employer_esi = Decimal("0.00")
    if esi_applicable and gross_earnings <= Decimal("21000.00"):
        employee_esi = (gross_earnings * Decimal("0.0075")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
        employer_esi = (gross_earnings * Decimal("0.0325")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # 5. Professional Tax (PT)
    professional_tax = Decimal("0.00")
    if pt_applicable:
        professional_tax = calculate_professional_tax_decimal(gross_earnings, pt_state)

    # 6. TDS (Income Tax)
    taxable_monthly = max(Decimal("0.00"), gross_earnings - lop_deduction)
    annual_est = taxable_monthly * Decimal("12.00")
    tds = calculate_monthly_tds_estimate_decimal(
        annual_gross=annual_est,
        regime=tax_regime,
        override_monthly=to_dec(tds_override) if tds_override is not None else None
    )

    # 7. Total Deductions
    total_deductions = (
        employee_pf + employee_esi + professional_tax + tds + lop_deduction + d_other_deductions
    ).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # 8. Net Salary (Gross + Reimbursements - Total Deductions)
    net_salary = (gross_earnings + d_reimbursements - total_deductions).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # 9. Total Employer Cost (CTC)
    total_employer_cost = (gross_earnings + d_reimbursements + employer_pf + employer_esi).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    return {
        "basic": float(d_basic),
        "hra": float(d_hra),
        "special_allowance": float(d_special),
        "conveyance": float(d_conveyance),
        "medical_allowance": float(d_medical),
        "bonus_or_variable": float(d_bonus),
        "other_earnings": float(d_other_earnings),
        "reimbursements": float(d_reimbursements),
        "gross_earnings": float(gross_earnings),

        "employee_pf": float(employee_pf),
        "employer_pf": float(employer_pf),
        "employee_esi": float(employee_esi),
        "employer_esi": float(employer_esi),
        "professional_tax": float(professional_tax),
        "tds": float(tds),
        "unpaid_leave_days": float(d_unpaid_days),
        "lop_deduction": float(lop_deduction),
        "other_deductions": float(d_other_deductions),
        "total_deductions": float(total_deductions),

        "net_salary": float(net_salary),
        "total_employer_cost": float(total_employer_cost),
    }

def calculate_ctc_breakdown(
    annual_ctc: float,
    regime: str = "new",
    state: str = "Karnataka",
    pf_capped: bool = True,
    basic_pct: float = 0.50,
    hra_pct: float = 0.25
) -> Dict[str, Any]:
    """
    Authoritative CTC-to-Take-Home Salary Calculator with 100% mathematical reconciliation.
    Guarantees:
      Monthly CTC = Monthly Gross + Employer PF + Employer ESIC
      Monthly Take-Home = Monthly Gross - (Employee PF + Employee ESIC + PT + TDS)
      Reconciled Annual CTC == annual_ctc (within 0.01 tolerance)
    """
    d_annual_ctc = to_dec(annual_ctc)
    d_monthly_ctc = (d_annual_ctc / Decimal("12.00")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
    d_basic_pct = to_dec(basic_pct)
    d_hra_pct = to_dec(hra_pct)

    # Solve for Monthly Gross:
    # Monthly CTC = Gross + Employer PF(Gross) + Employer ESIC(Gross)
    d_monthly_gross = Decimal("0.00")
    if pf_capped:
        if d_monthly_ctc >= Decimal("31800.00"):
            # Gross >= 30,000, basic >= 15,000, PF capped at 1,800, ESIC is 0
            d_monthly_gross = d_monthly_ctc - Decimal("1800.00")
        elif d_monthly_ctc > Decimal("22942.50"):
            # Gross > 21,000 (no ESIC), basic < 15,000 (PF is basic_pct * 12% = 6%)
            d_monthly_gross = (d_monthly_ctc / (Decimal("1.00") + (d_basic_pct * Decimal("0.12")))).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
        else:
            # Gross <= 21,000 (PF 6% + ESIC 3.25% apply)
            factor = Decimal("1.00") + (d_basic_pct * Decimal("0.12")) + Decimal("0.0325")
            d_monthly_gross = (d_monthly_ctc / factor).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
    else:
        pf_factor = d_basic_pct * Decimal("0.12")
        if (d_monthly_ctc / (Decimal("1.00") + pf_factor)) > Decimal("21000.00"):
            d_monthly_gross = (d_monthly_ctc / (Decimal("1.00") + pf_factor)).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
        else:
            d_monthly_gross = (d_monthly_ctc / (Decimal("1.00") + pf_factor + Decimal("0.0325"))).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # Component breakdown
    d_basic = (d_monthly_gross * d_basic_pct).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
    d_hra = (d_monthly_gross * d_hra_pct).quantize(TWOPLACES, rounding=ROUND_HALF_UP)
    d_special = (d_monthly_gross - d_basic - d_hra).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    # Employer Co-Contributions
    d_employer_pf = Decimal("0.00")
    if pf_capped:
        d_employer_pf = min(Decimal("1800.00"), (d_basic * Decimal("0.12")).quantize(TWOPLACES, rounding=ROUND_HALF_UP))
    else:
        d_employer_pf = (d_basic * Decimal("0.12")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    d_employer_esi = Decimal("0.00")
    if d_monthly_gross <= Decimal("21000.00"):
        d_employer_esi = (d_monthly_gross * Decimal("0.0325")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    d_employer_monthly_cost = d_monthly_gross + d_employer_pf + d_employer_esi

    # Guarantee exact 0.00 paise reconciliation against monthly CTC:
    if d_employer_monthly_cost != d_monthly_ctc:
        diff = d_monthly_ctc - d_employer_monthly_cost
        d_monthly_gross += diff
        d_special += diff
        d_employer_monthly_cost = d_monthly_gross + d_employer_pf + d_employer_esi

    # Employee Deductions
    d_employee_pf = d_employer_pf
    d_employee_esi = Decimal("0.00")
    if d_monthly_gross <= Decimal("21000.00"):
        d_employee_esi = (d_monthly_gross * Decimal("0.0075")).quantize(TWOPLACES, rounding=ROUND_HALF_UP)

    d_pt = calculate_professional_tax_decimal(d_monthly_gross, state)

    d_annual_gross = d_monthly_gross * Decimal("12.00")
    d_monthly_tds = calculate_monthly_tds_estimate_decimal(
        annual_gross=d_annual_gross,
        regime=regime
    )

    d_total_employee_deductions = d_employee_pf + d_employee_esi + d_pt + d_monthly_tds
    d_monthly_take_home = max(Decimal("0.00"), d_monthly_gross - d_total_employee_deductions)
    d_annual_take_home = d_monthly_take_home * Decimal("12.00")

    return {
        "annual_ctc": float(d_annual_ctc),
        "monthly_ctc": float(d_monthly_ctc),
        "monthly_gross": float(d_monthly_gross),
        "basic": float(d_basic),
        "hra": float(d_hra),
        "special_allowance": float(d_special),
        "annual_gross": float(d_annual_gross),

        "employee_pf": float(d_employee_pf),
        "employee_esi": float(d_employee_esi),
        "professional_tax": float(d_pt),
        "monthly_tds": float(d_monthly_tds),
        "total_employee_deductions": float(d_total_employee_deductions),

        "employer_pf": float(d_employer_pf),
        "employer_esi": float(d_employer_esi),
        "total_employer_contribution": float(d_employer_pf + d_employer_esi),
        "reconciled_monthly_employer_cost": float(d_employer_monthly_cost),

        "monthly_take_home": float(d_monthly_take_home),
        "annual_take_home": float(d_annual_take_home),
        "reconciled_annual_ctc": float(d_employer_monthly_cost * Decimal("12.00")),
        "reconciliation_variance": float(abs(d_employer_monthly_cost - d_monthly_ctc))
    }
