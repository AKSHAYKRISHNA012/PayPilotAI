from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.seed_data import seed_database
from app.routes import (
    auth, dashboard, employees, attendance,
    leave, salary_structure, payroll, auditor,
    assistant, reports, seed
)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered HR & Payroll SaaS for Indian Startups & SMEs",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(salary_structure.router)
app.include_router(payroll.router)
app.include_router(auditor.router)
app.include_router(assistant.router)
app.include_router(reports.router)
app.include_router(seed.router)

@app.on_event("startup")
def startup_event():
    init_db()
    db = SessionLocal()
    try:
        seed_database(db=db, force=False)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Smarter Payroll. Confident Decisions.",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
