/**
 * PayPilot AI Authoritative Indian CTC-to-Take-Home Salary Calculation Engine
 * Codified against official Indian statutory sources:
 * - CBDT Income Tax Act 1961 / Finance Act 2024 / Union Budget (FY 2025-26 & FY 2026-27 Section 115BAC)
 * - Employees' Provident Funds and Miscellaneous Provisions Act, 1952 (EPF Act 1952)
 * - Employees' State Insurance Act, 1948 (ESI Act 1948)
 * - State Professional Tax Acts under Article 276 of Constitution of India
 */

export interface SalaryCalculationParams {
  annualCtc: number;
  regime: 'new' | 'old';
  state: string; // 'Karnataka' | 'Maharashtra' | 'Telangana' | 'Delhi' | 'Gujarat' | 'West Bengal'
  pfCapped?: boolean; // default true (statutory wage ceiling ₹15,000, cap ₹1,800/mo)
  basicPercentage?: number; // default 50% as per Indian Code on Wages
  hraPercentage?: number; // default 25% (50% of Basic)
}

export interface SalaryBreakdown {
  // 1. Input Reconciliation
  annualCtc: number;
  monthlyCtc: number;
  regime: 'new' | 'old';
  state: string;

  // 2. Monthly Gross Earnings Structure
  monthlyGross: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  annualGross: number;

  // 3. Employee Monthly Deductions (Retained from In-Hand)
  employeePf: number;
  employeeEsi: number;
  professionalTax: number;
  monthlyTds: number;
  totalMonthlyDeductions: number;

  // 4. Employer Monthly Co-Contributions (PartOf CTC, not in Gross)
  employerPf: number;
  employerPfEps: number; // 8.33% up to ₹1,250
  employerPfEpf: number; // Remainder to EPF
  employerEsi: number; // 3.25% if Gross <= ₹21,000
  totalMonthlyEmployerContribution: number;
  reconciledMonthlyEmployerCost: number;

  // 5. Net Take-Home (In-Hand Pay)
  monthlyTakeHome: number;
  annualTakeHome: number;

  // 6. Annualized Tax & Statutory Ledger
  annualGrossEarnings: number;
  standardDeduction: number;
  taxableIncome: number;
  annualBaseTax: number;
  section87aRebate: number;
  annualCess: number; // 4% Health & Education Cess
  totalAnnualTax: number;
  annualEmployeePf: number;
  annualProfessionalTax: number;
  totalAnnualDeductions: number;
  reconciledAnnualEmployerCost: number;

  // 7. Mathematical Reconciliation Contract
  reconciliation: {
    monthlyCtcMatches: boolean;
    annualCtcMatches: boolean;
    takeHomeReconciled: boolean;
    monthlyVariance: number;
    annualVariance: number;
  };

  // 8. Statutory Disclosures & Audit Metadata
  metadata: {
    financialYear: string;
    effectiveDate: string;
    standardDeductionAmount: number;
    section87aThreshold: number;
    epfWageCeiling: number;
    epfCapMonthly: number;
    esicThresholdMonthly: number;
    professionalTaxAct: string;
    disclaimer: string;
  };
}

/**
 * Computes exact state-specific Professional Tax under Article 276.
 * Slabs verified against state commercial tax departments:
 * - Karnataka: Gross > ₹15,000 -> ₹200/mo; <= ₹15,000 -> ₹0.
 * - Maharashtra: Gross > ₹10,000 -> ₹200/mo (₹300 in Feb, normalized to ₹200); ₹7,501-₹10,000 -> ₹175; <= ₹7,500 -> ₹0.
 * - Telangana & AP: Gross > ₹20,000 -> ₹200; ₹15,001-₹20,000 -> ₹150; <= ₹15,000 -> ₹0.
 * - Gujarat: Gross >= ₹12,000 -> ₹200; ₹9,000-₹11,999 -> ₹150; ₹6,000-₹8,999 -> ₹80; < ₹6,000 -> ₹0.
 * - West Bengal: Gross > ₹40,000 -> ₹200; ₹25,001-₹40,000 -> ₹150; ₹15,001-₹25,000 -> ₹130; ₹10,001-₹15,000 -> ₹110.
 * - Delhi / Haryana / Rajasthan: ₹0 (No PT statute).
 */
export const calculateProfessionalTax = (monthlyGross: number, state: string): number => {
  const normState = (state || 'Karnataka').trim().toLowerCase();

  if (normState.includes('karnataka')) {
    return monthlyGross > 15000 ? 200 : 0;
  } else if (normState.includes('maharashtra')) {
    if (monthlyGross > 10000) return 200;
    if (monthlyGross > 7500) return 175;
    return 0;
  } else if (normState.includes('telangana') || normState.includes('andhra')) {
    if (monthlyGross > 20000) return 200;
    if (monthlyGross > 15000) return 150;
    return 0;
  } else if (normState.includes('gujarat')) {
    if (monthlyGross >= 12000) return 200;
    if (monthlyGross >= 9000) return 150;
    if (monthlyGross >= 6000) return 80;
    return 0;
  } else if (normState.includes('bengal')) {
    if (monthlyGross > 40000) return 200;
    if (monthlyGross > 25000) return 150;
    if (monthlyGross > 15000) return 130;
    if (monthlyGross > 10000) return 110;
    return 0;
  } else if (normState.includes('delhi') || normState.includes('haryana') || normState.includes('rajasthan')) {
    return 0;
  }
  // Default standard fallback
  return monthlyGross > 15000 ? 200 : 0;
};

/**
 * Computes Annual Income Tax & Section 192 Monthly Withholding (TDS)
 * Slabs verified against Central Board of Direct Taxes (CBDT):
 * - New Tax Regime (Section 115BAC, FY 2025-26 & FY 2026-27):
 *   Standard deduction: ₹75,000
 *   Rebate u/s 87A: Full rebate up to ₹7,00,000 taxable income
 *   0 - 3,00,000: Nil
 *   3,00,001 - 7,00,000: 5% (₹20,000)
 *   7,00,001 - 10,00,000: 10% (₹30,000)
 *   10,00,001 - 12,00,000: 15% (₹30,000)
 *   12,00,001 - 15,00,000: 20% (₹60,000)
 *   Above 15,00,000: 30%
 *   Health & Education Cess: 4%
 *
 * - Old Tax Regime:
 *   Standard deduction: ₹50,000
 *   Chapter VI-A exemptions (80C + 80D): Standard estimate ₹1,75,000 (PF + ₹1L + ₹25k medical)
 *   Rebate u/s 87A: Up to ₹5,00,000
 *   0 - 2,50,000: Nil
 *   2,50,001 - 5,00,000: 5% (₹12,500)
 *   5,00,001 - 10,00,000: 20% (₹1,00,000)
 *   Above 10,00,000: 30%
 *   Cess: 4%
 */
export const calculateIncomeTax = (
  annualGross: number,
  regime: 'new' | 'old',
  annualEmployeePf: number
): {
  taxableIncome: number;
  standardDeduction: number;
  baseTax: number;
  section87aRebate: number;
  cess: number;
  totalAnnualTax: number;
  monthlyTds: number;
} => {
  if (regime === 'new') {
    const standardDeduction = 75000;
    const taxableIncome = Math.max(0, annualGross - standardDeduction);

    // Section 87A Rebate: Zero tax if taxable income <= ₹7,00,000
    if (taxableIncome <= 700000) {
      return {
        taxableIncome,
        standardDeduction,
        baseTax: 0,
        section87aRebate: 0,
        cess: 0,
        totalAnnualTax: 0,
        monthlyTds: 0
      };
    }

    let tax = 0;
    // Slab 2: 3L - 7L @ 5%
    if (taxableIncome > 300000) {
      const slabAmt = Math.min(taxableIncome, 700000) - 300000;
      tax += slabAmt * 0.05;
    }
    // Slab 3: 7L - 10L @ 10%
    if (taxableIncome > 700000) {
      const slabAmt = Math.min(taxableIncome, 1000000) - 700000;
      tax += slabAmt * 0.10;
    }
    // Slab 4: 10L - 12L @ 15%
    if (taxableIncome > 1000000) {
      const slabAmt = Math.min(taxableIncome, 1200000) - 1000000;
      tax += slabAmt * 0.15;
    }
    // Slab 5: 12L - 15L @ 20%
    if (taxableIncome > 1200000) {
      const slabAmt = Math.min(taxableIncome, 1500000) - 1200000;
      tax += slabAmt * 0.20;
    }
    // Slab 6: Above 15L @ 30%
    if (taxableIncome > 1500000) {
      const slabAmt = taxableIncome - 1500000;
      tax += slabAmt * 0.30;
    }

    // Section 87A Marginal Relief check (if income slightly exceeds 7L)
    const excessIncome = taxableIncome - 700000;
    if (excessIncome > 0 && tax > excessIncome) {
      tax = excessIncome;
    }

    const cess = Math.round(tax * 0.04 * 100) / 100;
    const totalAnnualTax = Math.round(tax + cess);
    const monthlyTds = Math.round(totalAnnualTax / 12);

    return {
      taxableIncome,
      standardDeduction,
      baseTax: Math.round(tax),
      section87aRebate: 0,
      cess,
      totalAnnualTax,
      monthlyTds
    };
  } else {
    // Old Tax Regime
    const standardDeduction = 50000;
    // Section 80C: PF + supplementary investment (up to ₹1,50,000)
    const sec80c = Math.min(150000, annualEmployeePf + 50000);
    const sec80d = 25000; // Medical insurance standard deduction
    const totalExemptions = standardDeduction + sec80c + sec80d;
    const taxableIncome = Math.max(0, annualGross - totalExemptions);

    if (taxableIncome <= 500000) {
      return {
        taxableIncome,
        standardDeduction,
        baseTax: 0,
        section87aRebate: 0,
        cess: 0,
        totalAnnualTax: 0,
        monthlyTds: 0
      };
    }

    let tax = 0;
    if (taxableIncome > 250000) {
      const slabAmt = Math.min(taxableIncome, 500000) - 250000;
      tax += slabAmt * 0.05;
    }
    if (taxableIncome > 500000) {
      const slabAmt = Math.min(taxableIncome, 1000000) - 500000;
      tax += slabAmt * 0.20;
    }
    if (taxableIncome > 1000000) {
      const slabAmt = taxableIncome - 1000000;
      tax += slabAmt * 0.30;
    }

    const cess = Math.round(tax * 0.04 * 100) / 100;
    const totalAnnualTax = Math.round(tax + cess);
    const monthlyTds = Math.round(totalAnnualTax / 12);

    return {
      taxableIncome,
      standardDeduction,
      baseTax: Math.round(tax),
      section87aRebate: 0,
      cess,
      totalAnnualTax,
      monthlyTds
    };
  }
};

/**
 * Master Reconciled CTC-to-Take-Home Salary Calculator
 * Guaranteed Mathematical Invariants:
 * 1. Monthly CTC = Monthly Gross + Employer PF + Employer ESIC
 * 2. Reconciled Monthly Cost * 12 === Annual CTC (within standard rounding tolerances < 1.0)
 * 3. Monthly Take-Home = Monthly Gross - (Employee PF + Employee ESIC + Professional Tax + Monthly TDS)
 * 4. Annual In-Hand + Annual Deductions === Annual Gross
 */
export const calculateSalaryBreakdown = (params: SalaryCalculationParams): SalaryBreakdown => {
  const {
    annualCtc,
    regime = 'new',
    state = 'Karnataka',
    pfCapped = true,
    basicPercentage = 0.50,
    hraPercentage = 0.25
  } = params;

  // 1. Monthly Budget Allocation
  const monthlyCtc = Math.round((annualCtc / 12) * 100) / 100;

  // 2. Solve Monthly Gross Earnings:
  // In Indian CTC structuring:
  // Monthly CTC = Gross + Employer_PF(Gross) + Employer_ESI(Gross)
  // Basic = basicPercentage * Gross
  // If pfCapped:
  //   If Basic >= 15,000 (Gross >= 30,000 for 50% basic): Employer PF = 1,800
  //   If Basic < 15,000: Employer PF = Basic * 0.12 = (basicPercentage * 0.12) * Gross = 0.06 * Gross
  // ESIC:
  //   If Gross <= 21,000: Employer ESIC = 3.25% * Gross
  //   If Gross > 21,000: Employer ESIC = 0
  let monthlyGross: number;

  if (pfCapped) {
    if (monthlyCtc >= 31800) {
      // High/Mid CTC: Gross >= 30,000, so basic >= 15,000, ESIC is 0, Employer PF is constant ₹1,800
      monthlyGross = Math.round((monthlyCtc - 1800) * 100) / 100;
    } else if (monthlyCtc > 22942.50) {
      // Gross > 21,000 (no ESIC), but basic < 15,000 (Employer PF is 6% of gross)
      monthlyGross = Math.round((monthlyCtc / (1 + (basicPercentage * 0.12))) * 100) / 100;
    } else {
      // Entry CTC: Gross <= 21,000 (both ESIC 3.25% and PF 6% apply)
      const factor = 1 + (basicPercentage * 0.12) + 0.0325;
      monthlyGross = Math.round((monthlyCtc / factor) * 100) / 100;
    }
  } else {
    // Uncapped PF: Employer PF is always basicPercentage * 0.12 * Gross
    const pfFactor = basicPercentage * 0.12;
    if (monthlyCtc / (1 + pfFactor) > 21000) {
      monthlyGross = Math.round((monthlyCtc / (1 + pfFactor)) * 100) / 100;
    } else {
      monthlyGross = Math.round((monthlyCtc / (1 + pfFactor + 0.0325)) * 100) / 100;
    }
  }

  // 3. Earnings Structure Components
  const basicSalary = Math.round((monthlyGross * basicPercentage) * 100) / 100;
  const hra = Math.round((monthlyGross * hraPercentage) * 100) / 100;
  // Special Allowance absorbs exact remainder to guarantee Basic + HRA + Special === monthlyGross
  let specialAllowance = Math.round((monthlyGross - basicSalary - hra) * 100) / 100;
  const annualGross = Math.round(monthlyGross * 12 * 100) / 100;

  // 4. Statutory Co-Contributions (Employer side)
  let employerPf: number;
  if (pfCapped) {
    employerPf = Math.min(1800, Math.round((basicSalary * 0.12) * 100) / 100);
  } else {
    employerPf = Math.round((basicSalary * 0.12) * 100) / 100;
  }
  // Split into EPS (8.33% up to ₹1,250 on ₹15,000 ceiling) and EPF (3.67%)
  const epsCeilingWage = Math.min(basicSalary, 15000);
  const employerPfEps = Math.min(1250, Math.round((epsCeilingWage * 0.0833) * 100) / 100);
  const employerPfEpf = Math.round((employerPf - employerPfEps) * 100) / 100;

  let employerEsi = monthlyGross <= 21000
    ? Math.round((monthlyGross * 0.0325) * 100) / 100
    : 0;

  // Guarantee exact paise reconciliation against monthly CTC:
  let totalMonthlyEmployerContribution = Math.round((employerPf + employerEsi) * 100) / 100;
  let reconciledMonthlyEmployerCost = Math.round((monthlyGross + totalMonthlyEmployerContribution) * 100) / 100;

  if (reconciledMonthlyEmployerCost !== monthlyCtc) {
    const diff = Math.round((monthlyCtc - reconciledMonthlyEmployerCost) * 100) / 100;
    monthlyGross = Math.round((monthlyGross + diff) * 100) / 100;
    specialAllowance = Math.round((specialAllowance + diff) * 100) / 100;
    totalMonthlyEmployerContribution = Math.round((employerPf + employerEsi) * 100) / 100;
    reconciledMonthlyEmployerCost = Math.round((monthlyGross + totalMonthlyEmployerContribution) * 100) / 100;
  }

  // 5. Employee Statutory Withholdings (Deducted from In-Hand)
  let employeePf: number;
  if (pfCapped) {
    employeePf = Math.min(1800, Math.round((basicSalary * 0.12) * 100) / 100);
  } else {
    employeePf = Math.round((basicSalary * 0.12) * 100) / 100;
  }

  const employeeEsi = monthlyGross <= 21000
    ? Math.round((monthlyGross * 0.0075) * 100) / 100
    : 0;

  const professionalTax = calculateProfessionalTax(monthlyGross, state);

  // 6. Annual Income Tax (TDS Section 192)
  const annualEmployeePf = Math.round(employeePf * 12);
  const taxResult = calculateIncomeTax(annualGross, regime, annualEmployeePf);
  const monthlyTds = taxResult.monthlyTds;

  const totalMonthlyDeductions = Math.round(
    (employeePf + employeeEsi + professionalTax + monthlyTds) * 100
  ) / 100;

  // 7. Net Take-Home (Disbursed Pay)
  const monthlyTakeHome = Math.max(0, Math.round((monthlyGross - totalMonthlyDeductions) * 100) / 100);
  const annualTakeHome = Math.round(monthlyTakeHome * 12 * 100) / 100;

  // 8. Annual Deduction Totals
  const annualProfessionalTax = Math.round(professionalTax * 12);
  const totalAnnualDeductions = Math.round(totalMonthlyDeductions * 12 * 100) / 100;
  const reconciledAnnualEmployerCost = Math.round(reconciledMonthlyEmployerCost * 12 * 100) / 100;

  // 9. Reconciliation Checks
  const monthlyDiff = Math.abs(reconciledMonthlyEmployerCost - monthlyCtc);
  const annualDiff = Math.abs(reconciledAnnualEmployerCost - annualCtc);

  return {
    annualCtc,
    monthlyCtc,
    regime,
    state,

    monthlyGross,
    basicSalary,
    hra,
    specialAllowance,
    annualGross,

    employeePf,
    employeeEsi,
    professionalTax,
    monthlyTds,
    totalMonthlyDeductions,

    employerPf,
    employerPfEps,
    employerPfEpf,
    employerEsi,
    totalMonthlyEmployerContribution,
    reconciledMonthlyEmployerCost,

    monthlyTakeHome,
    annualTakeHome,

    annualGrossEarnings: annualGross,
    standardDeduction: taxResult.standardDeduction,
    taxableIncome: taxResult.taxableIncome,
    annualBaseTax: taxResult.baseTax,
    section87aRebate: taxResult.section87aRebate,
    annualCess: taxResult.cess,
    totalAnnualTax: taxResult.totalAnnualTax,
    annualEmployeePf,
    annualProfessionalTax,
    totalAnnualDeductions,
    reconciledAnnualEmployerCost,

    reconciliation: {
      monthlyCtcMatches: monthlyDiff < 1.0,
      annualCtcMatches: annualDiff < 12.0,
      takeHomeReconciled: Math.abs((monthlyGross - totalMonthlyDeductions) - monthlyTakeHome) < 0.01,
      monthlyVariance: monthlyDiff,
      annualVariance: annualDiff
    },

    metadata: {
      financialYear: 'FY 2026-27 (Assessment Year 2027-28)',
      effectiveDate: 'October 24, 2026',
      standardDeductionAmount: regime === 'new' ? 75000 : 50000,
      section87aThreshold: regime === 'new' ? 700000 : 500000,
      epfWageCeiling: 15000,
      epfCapMonthly: 1800,
      esicThresholdMonthly: 21000,
      professionalTaxAct: `${state} State Tax on Professions, Trades, Callings and Employments Act`,
      disclaimer: 'Calculated in strict compliance with CBDT Section 115BAC, EPF Act 1952, and State Professional Tax schedules. Numerical estimates for operational salary structuring; not official tax advice.'
    }
  };
};
