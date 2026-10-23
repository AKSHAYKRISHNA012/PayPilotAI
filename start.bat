@echo off
echo =========================================================================
echo               PayPilot AI - AI-Powered HR & Payroll SaaS
echo               Smarter Payroll. Confident Decisions.
echo =========================================================================
echo.

echo [1/2] Starting Python FastAPI Backend on port 8000...
start "PayPilot Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React + Vite Frontend on port 5173...
start "PayPilot Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================================================
echo PayPilot AI is running!
echo - Web Dashboard:  http://127.0.0.1:5173/
echo - Backend API:    http://127.0.0.1:8000/
echo - Interactive Docs: http://127.0.0.1:8000/docs
echo =========================================================================
pause
