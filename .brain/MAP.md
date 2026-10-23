# PayPilot AI: Codebase & Architecture Map

## 1. System Topology Overview
PayPilot AI is a modern Indian HCM & Payroll SaaS platform built with:
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy 2.0 + SQLite (`paypilot.db`)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Recharts
- **Statutory Engine**: Deterministic Indian calculations (EPF, ESIC, Professional Tax, TDS New Regime FY 26-27, LOP daily rate)
- **AI Payroll Auditor**: Multi-rule discrepancy validator (salary variance spikes, unbilled absences, negative net pay, missing bank KYC)
- **AI Assistant**: Role-grounded conversational payroll engine with exact calculation explanations

## 2. Directory Structure & Key Files
```
paypilot-ai/
├── .agents/
│   └── skills/
│       └── antigravity-pro/
│           └── SKILL.md            # Antigravity Pro master agentic harness
├── .brain/
│   ├── MAP.md                      # Codebase architecture & endpoint mapping
│   ├── STATUS.md                   # Current state & test metrics
│   ├── HANDOFF.md                  # Runtime ports, daemons & credentials
│   └── DECISIONS.md                # Architectural records & statutory rules
├── AGENTS.md                       # Active workspace multi-agent rules
├── DESIGN.md                       # Awesome-design-md tokens, typography & grid
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application & middleware
│   │   ├── models.py               # SQLAlchemy models (Employee, Attendance, Leave, Payroll, Audit)
│   │   ├── database.py             # SQLite engine & session management
│   │   ├── payroll_engine.py       # Deterministic statutory Indian calculation algorithms
│   │   ├── auditor_engine.py       # Multi-rule payroll variance & discrepancy scanner
│   │   ├── seed_data.py            # Seed data generator with 4 pitch-ready anomalies
│   │   └── routes/
│   │       ├── auth.py             # User switching & current identity
│   │       ├── dashboard.py        # Enterprise KPI metrics & recent activity
│   │       ├── employees.py        # Employee master records & 360° drawer
│   │       ├── attendance.py       # Attendance logging & terminal clock-in
│   │       ├── leave.py            # Quota balances & approval workflow
│   │       ├── salary_structure.py # CTC breakdown & component slabs
│   │       ├── payroll.py          # Payroll periods, calculations & adjustments
│   │       ├── auditor.py          # AI Audit scan, findings & resolution
│   │       ├── assistant.py        # Grounded AI assistant responses
│   │       ├── reports.py          # Bank CMS NEFT, EPFO ECR, and CSV exports
│   │       └── seed.py             # Demo database restoration endpoint
│   └── tests/
│       ├── test_payroll_engine.py  # 5 deterministic calculation tests (100% pass)
│       └── test_auditor_engine.py  # 4 discrepancy detector tests (100% pass)
└── frontend/
    └── src/
        ├── App.tsx                 # Root application & tab routing
        ├── index.css               # Inter font, clean slate-50 tokens, print styles
        ├── types/index.ts          # TypeScript interfaces & types
        ├── services/api.ts         # Axios/fetch API proxy service
        ├── components/
        │   ├── Navbar.tsx          # Minimalist enterprise top navigation bar
        │   ├── Sidebar.tsx         # Left sidebar with 10 standard routes & badges
        │   └── GuidedDemoModal.tsx # 10-step interactive pitch walkthrough
        └── pages/
            ├── DashboardPage.tsx   # Compact KPI cards & self-service employee portal
            ├── EmployeesPage.tsx   # Data table, department filters & 360° profile drawer
            ├── AttendancePage.tsx  # Attendance ledger & web clock-in terminal
            ├── LeavePage.tsx       # Quota balances (CL, SL, EL) & requests table
            ├── SalaryStructurePage.tsx # Statutory rules (EPF, ESIC, PT) & compensation
            ├── PayrollProcessingPage.tsx # Enterprise stepper, metrics & adjustment modal
            ├── AIAuditorPage.tsx   # Pre-disbursement audit cards & inspection modal
            ├── AIAssistantPage.tsx # Grounded conversational chat interface
            ├── PayslipsReportsPage.tsx # Printable official payslip & banking CMS exports
            └── SettingsPage.tsx    # Corporate entity settings & demo reset
```
