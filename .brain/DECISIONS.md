# PayPilot AI: Architectural & Design Decisions

## 1. Statutory Indian Calculation Engine
- **Provident Fund (EPF)**:
  - 12% employee contribution on Basic Salary, statutory capped at ₹1,800/month (12% of ₹15,000 threshold).
  - Matches 12% employer contribution (3.67% EPF + 8.33% EPS).
- **Employees' State Insurance (ESIC)**:
  - 0.75% employee + 3.25% employer. Applicable only if monthly Gross Earnings <= ₹21,000.
- **Professional Tax (PT)**:
  - Standard Karnataka state slab: ₹200/month if Gross >= ₹15,000.
- **Income Tax (TDS New Regime FY 26-27 u/s 115BAC)**:
  - Slabs computed with standard deduction of ₹75,000 and Section 87A rebate up to ₹7,00,000.
- **Loss of Pay (LOP)**:
  - Calculated deterministically as `(Gross Salary / Working Days) * Unapproved Absence Days`.

## 2. AI Payroll Auditor Rule Thresholds
- **Salary Spike**: Triggered if gross salary variance exceeds +30% against historical baseline without approved promotion record.
- **Attendance Mismatch**: Triggered when recorded biometric/manual unapproved absences do not have corresponding LOP deductions in the active pay period.
- **Negative Net Pay**: Triggered when statutory deductions or loan recoveries exceed gross earnings.
- **Statutory / Bank KYC**: Triggered if bank account number or IFSC code is missing or duplicate.

## 3. UI/UX System Decision
- Adopted clean, minimalist enterprise SaaS dashboard architecture inspired by Vensure HCM, Gusto, and Rippling.
- White canvas (`#FFFFFF`) with light grey sections (`#F8FAFC`, `#F1F5F9`) and navy (`#0F172A`) / indigo (`#4338CA`) accents.
- Replaced all non-standard gradients, glassmorphism, pulse animations, and oversized cards with high-density data tables and subtle borders.
