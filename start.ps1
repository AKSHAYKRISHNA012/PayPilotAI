Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "              PayPilot AI - AI-Powered HR & Payroll SaaS" -ForegroundColor Cyan
Write-Host "              Smarter Payroll. Confident Decisions." -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting Python FastAPI Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting React + Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "PayPilot AI is running!" -ForegroundColor Green
Write-Host " - Web Application:   http://127.0.0.1:5173/" -ForegroundColor Green
Write-Host " - FastAPI Backend:   http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host " - Swagger API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
