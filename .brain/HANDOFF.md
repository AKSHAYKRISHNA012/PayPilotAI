# PayPilot AI: Runtime Handoff & Environment State

## 1. Running Daemons & Process State
- **FastAPI Backend Process**:
  - Running on `http://127.0.0.1:8000`
  - Command: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - Database: `backend/paypilot.db` (SQLite 3)
- **Vite Frontend Dev Server**:
  - Running on `http://localhost:5173` (or `http://127.0.0.1:5173`)
  - Command: `npm run dev -- --host 127.0.0.1 --port 5173`
  - Proxy configuration: All `/api/*` requests forward automatically to port 8000.

## 2. Active Test Personas
1. **Aditi Rao** (`usr_admin`) - Chief People Officer / Global Admin
   - Access: Complete administrative access across all 10 modules.
2. **Kavita Nair** (`usr_payroll`) - Senior Payroll Manager
   - Access: Dedicated payroll administration, calculation adjustment, and audit remediation.
3. **Rohan Verma** (`usr_emp_rohan`) - Staff Backend Engineer
   - Access: Self-service employee portal (personal compensation, attendance, leaves, payslips, personal AI assistant).
4. **Priya Sharma** (`usr_emp_priya`) - Product Marketing Lead
   - Access: Self-service employee portal (contains unbilled absence seeded anomaly).

## 3. Demo Reset Instructions
To restore the platform to the initial clean state with the 4 intentional pitch anomalies:
- In UI: Navigate to **Settings** -> Click **Reset Demo State** or click **Reset Demo** in the top navigation profile dropdown.
- Via API: `POST http://127.0.0.1:8000/api/seed/reset`
