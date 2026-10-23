from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    pan = Column(String, default="AABCB1234F")
    tan = Column(String, default="BLRB12345C")
    epf_reg = Column(String, default="KN/BNG/1234567/000")
    esic_reg = Column(String, default="53000123450000001")
    address = Column(String, default="Koramangala, Bengaluru, Karnataka, 560034")
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, payroll_admin, employee
    employee_id = Column(String, nullable=True)
    password_hash = Column(String, default="hashed_demo_pw")
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = "employees"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    emp_code = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, default="+91 9876543210")
    department = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    joining_date = Column(Date, default=date.today)
    status = Column(String, default="active")  # active, inactive
    pan = Column(String, default="ABCDE1234F")
    aadhar_masked = Column(String, default="XXXX-XXXX-1234")
    uan = Column(String, default="100987654321")
    bank_name = Column(String, default="HDFC Bank")
    bank_account = Column(String, default="50100234567890")
    ifsc = Column(String, default="HDFC0001234")
    tax_regime = Column(String, default="new")  # new, old
    state = Column(String, default="Karnataka")
    created_at = Column(DateTime, default=datetime.utcnow)

class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    ctc_annual = Column(Float, default=600000.0)
    basic = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    special_allowance = Column(Float, default=0.0)
    conveyance = Column(Float, default=0.0)
    medical_allowance = Column(Float, default=0.0)
    other_allowances = Column(Float, default=0.0)
    pf_applicable = Column(Boolean, default=True)
    pf_type = Column(String, default="statutory_capped_1800")  # statutory_capped_1800 or actual_basic
    esi_applicable = Column(Boolean, default=True)
    pt_applicable = Column(Boolean, default=True)
    pt_state = Column(String, default="Karnataka")
    tds_monthly_override = Column(Float, default=0.0)
    effective_date = Column(Date, default=date.today)

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, default="present")  # present, absent, half_day, approved_leave, holiday, weekend
    check_in = Column(String, nullable=True)
    check_out = Column(String, nullable=True)
    notes = Column(String, nullable=True)

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    year = Column(Integer, default=2026)
    casual_leave_total = Column(Float, default=12.0)
    casual_leave_used = Column(Float, default=2.0)
    sick_leave_total = Column(Float, default=10.0)
    sick_leave_used = Column(Float, default=1.0)
    earned_leave_total = Column(Float, default=15.0)
    earned_leave_used = Column(Float, default=3.0)

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String, nullable=False)  # casual, sick, earned, unpaid_lop
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    applied_on = Column(Date, default=date.today)
    reviewed_by = Column(String, nullable=True)
    review_comment = Column(String, nullable=True)

class PayrollPeriod(Base):
    __tablename__ = "payroll_periods"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    name = Column(String, nullable=False)  # e.g., "October 2026"
    working_days = Column(Integer, default=22)
    status = Column(String, default="draft")  # draft, calculated, audited, approved, processed
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PayrollItem(Base):
    __tablename__ = "payroll_items"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    period_id = Column(String, ForeignKey("payroll_periods.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    
    # Earnings
    basic = Column(Float, default=0.0)
    hra = Column(Float, default=0.0)
    special_allowance = Column(Float, default=0.0)
    conveyance = Column(Float, default=0.0)
    medical_allowance = Column(Float, default=0.0)
    bonus_or_variable = Column(Float, default=0.0)
    other_earnings = Column(Float, default=0.0)
    gross_earnings = Column(Float, default=0.0)
    
    # Employee Deductions
    employee_pf = Column(Float, default=0.0)
    employee_esi = Column(Float, default=0.0)
    professional_tax = Column(Float, default=0.0)
    tds = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    lop_deduction = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    
    # Net Pay
    net_salary = Column(Float, default=0.0)
    
    # Employer Contributions
    employer_pf = Column(Float, default=0.0)
    employer_esi = Column(Float, default=0.0)
    total_employer_cost = Column(Float, default=0.0)
    
    # Audit Status
    audit_status = Column(String, default="clean")  # clean, flagged, resolved
    notes = Column(Text, nullable=True)

class AuditFinding(Base):
    __tablename__ = "audit_findings"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    period_id = Column(String, ForeignKey("payroll_periods.id"), nullable=False)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    category = Column(String, nullable=False)  # Salary Spike, Negative Pay, Attendance Mismatch, Duplicate Entry, Missing Statutory
    severity = Column(String, nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    expected_value = Column(String, nullable=True)
    observed_value = Column(String, nullable=True)
    recommended_action = Column(Text, nullable=False)
    status = Column(String, default="Open")  # Open, Investigating, Resolved, Accepted
    resolution_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    user_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
