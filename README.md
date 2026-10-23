# PayPilot AI — AI-Powered HR & Payroll SaaS for India

> **"Smarter Payroll. Confident Decisions."**  
> *PayPilot AI doesn't just process payroll. It checks payroll before payday and explains every number.*

---

## 🌟 Executive Summary & Market Positioning

**PayPilot AI** is a modern, enterprise-grade HR and payroll management SaaS designed specifically for Indian startups and SMEs. It bridges the critical trust and compliance gap in Indian payroll operations through two game-changing innovations:

1. **AI Payroll Auditor (Core Differentiator):** A deterministic, multi-rule validation engine that runs *before* money leaves your bank account. It checks for sudden salary spikes, duplicate PAN/KYC entries, unbilled absent days without approved leave, statutory capping violations, and negative net pay.
2. **Ground-Truth Conversational Assistant:** An authentic, role-restricted AI assistant that explains exact take-home calculations, statutory tax deductions (EPF, ESIC, PT, TDS Section 192), and leave balances using authoritative calculation outputs—never hallucinating authoritative values.

---

## 🚀 Live Demo Architecture

| Component | Technology | Local Port |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts | `http://127.0.0.1:5173/` |
| **Backend API** | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2 | `http://127.0.0.1:8000/` |
| **API Docs** | OpenAPI / Swagger UI | `http://127.0.0.1:8000/docs` |
| **Database** | SQLite WAL mode (zero-friction, portable local persistence) | `backend/paypilot.db` |
| **Test Suite** | Pytest (Automated mathematical & anomaly detection unit tests) | 9 tests passing (100%) |

---

## ⚡ Quick Start (One-Click)

### Option A: Windows Batch Launcher
Double-click `start.bat` in the project root:
```bat
start.bat
```

### Option B: PowerShell
```powershell
.\start.ps1
```

### Option C: Manual Setup

#### 1. Backend Setup:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://127.0.0.1:5173/`** in your browser.

---

## 🎭 Role-Based Demo Accounts

Switch between demo accounts instantaneously via the top-right profile switcher:

| Demo Profile | Role | Context & Permissions |
| :--- | :--- | :--- |
| **Ananya Sen** | **HR / Admin** (CPO) | Full enterprise access: workforce directory, leave approvals, attendance records, statutory settings, company reports. |
| **Rajesh Nair** | **Payroll Administrator** | Salary ledger processing, AI Auditor execution, discrepancy resolution, bank NEFT batch file generation. |
| **Rohan Verma** | **Employee** (Staff Backend Eng.) | Restricted Self-Service Portal: view personal compensation, leave balances, official printable payslip, and salary explanation chat. |
| **Sneha Rao** | **Employee** (Lead UI/UX Designer) | Self-service attendance records, leave applications, and monthly pay breakdown. |

---

## 🔍 Seeded Demo Anomalies (Hackathon Pitch Ready)

PayPilot AI comes pre-seeded with 4 intentional discrepancies to demonstrate the AI Payroll Auditor during investor and hackathon presentations:

1. **Salary Spike (+53.6% Jump) — Rohan Verma (BTI-003):**  
   Gross salary jumped from ₹1,40,000 to ₹2,15,000 due to an accidental duplicate festival bonus. Flagged as **HIGH** severity.
2. **Attendance Mismatch — Priya Sharma (BTI-002):**  
   Attendance logs reflect 4 unapproved absent days, but 0 Loss of Pay (LOP) was deducted. Flagged as **HIGH** severity.
3. **Negative Net Salary (-₹7,000) — Amit Patel (BTI-005):**  
   Excessive company loan recovery (₹45,000) exceeded gross earnings (₹40,000), violating the Payment of Wages Act 50% deduction ceiling. Flagged as **CRITICAL** severity.
4. **Missing Bank IFSC Code — Vikram Singh (BTI-004):**  
   DevOps Architect missing disbursement account details required for automated NACH/NEFT upload. Flagged as **MEDIUM** severity.

*Tip: Click the **"Reset Demo"** button in the header anytime to restore these anomalies for live replay!*

---

## 🇮🇳 Indian Statutory Engine Specifications

PayPilot AI incorporates exact statutory mathematics for Indian corporate compliance:

- **Employees' Provident Fund (EPF):**  
  - Employee: 12% of Basic (statutory capped at ₹1,800/mo or uncapped actual basic).
  - Employer: 12% of Basic (3.67% EPF + 8.33% EPS up to ₹1,250/mo cap).
- **Employees' State Insurance (ESIC):**  
  - Automatically triggered only if gross wage &le; ₹21,000/mo.
  - Employee contribution: 0.75%; Employer contribution: 3.25%.
- **Professional Tax (PT):**  
  - Multi-state statutory slabs (Karnataka ₹200 for gross > ₹15,000; Maharashtra; Telangana; Delhi nil).
- **Income Tax (TDS Section 192):**  
  - FY 2026-27 New Tax Regime slabs (Standard deduction ₹75,000, Section 87A rebate up to ₹7,00,000 taxable income, 4% Health & Education Cess).
- **Loss of Pay (LOP):**  
  - Daily rate formula: `(Gross Earnings / Monthly Working Days) * Unpaid Leave Days`.

---

## 📂 Production Export Capabilities

1. **Printable Indian Payslip:** Official format with employer address, PAN, TAN, EPF/ESIC establishment codes, UAN, earnings/deductions table, and net salary in Indian words (*"Rupees ... Only"*).
2. **Bank CMS Batch Payment File:** Formatted CSV for direct upload to HDFC Enet, ICICI CIB, and SBI CMP corporate banking portals.
3. **EPFO ECR Text File:** Formatted `#~#` delimited file for monthly upload on the EPFO Unified Portal.
4. **Detailed Payroll Master CSV:** Line-by-line financial ledger for finance and internal auditing.

---

## 🧪 Automated Testing

Execute the test suite verifying mathematical accuracy and anomaly detection rules:

```bash
cd backend
python -m pytest tests -v
```

Output:
```
tests/test_auditor_engine.py::test_auditor_detects_negative_net_pay PASSED
tests/test_auditor_engine.py::test_auditor_detects_salary_spike PASSED
tests/test_payroll_engine.py::test_round_curr PASSED
tests/test_payroll_engine.py::test_professional_tax_karnataka PASSED
tests/test_payroll_engine.py::test_professional_tax_maharashtra PASSED
tests/test_payroll_engine.py::test_esi_applicability PASSED
tests/test_payroll_engine.py::test_pf_statutory_cap PASSED
tests/test_payroll_engine.py::test_unpaid_leave_lop_deduction PASSED
tests/test_payroll_engine.py::test_net_salary_equation PASSED

============================== 9 passed in 0.50s ==============================
```

---

## 🏆 Guided Pitch Presentation Flow (3-Minute Script)

1. **The Hook:** *"Every month, Indian startups risk payroll compliance penalties and employee friction over surprise salary deductions. PayPilot AI solves this by checking payroll before payday and explaining every number."*
2. **The Dashboard:** Show the live headcount (6), present today (100%), and the red alert banner showing **4 active discrepancies**.
3. **The AI Auditor:** Click **"AI Payroll Auditor"**, trigger **"Run Payroll Audit"**, and showcase the 4 detected discrepancies with expected vs. observed values.
4. **The Fix:** Click **"Inspect & Resolve"** on Rohan Verma or Amit Patel, adjust the line, and show the audit status turning green (**Resolved**).
5. **The Employee Experience:** Switch role to **Rohan Verma**. Notice the UI shifts into an employee self-service portal.
6. **The AI Assistant:** Ask the assistant: *"How was my take-home salary calculated?"* Show the mathematical breakdown and source verification.
7. **The Payslip:** Open **"My Payslips"** and print the verified, compliant Indian salary slip.

---

&copy; 2026 PayPilot AI Technologies. All rights reserved.
