export type UserRole = 'admin' | 'payroll_admin' | 'employee';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  employee_id?: string;
  department?: string;
  designation?: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface Employee {
  id: string;
  emp_code: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joining_date: string;
  status: 'active' | 'inactive';
  pan: string;
  bank_name?: string;
  bank_account: string;
  ifsc: string;
  tax_regime: 'new' | 'old';
  state: string;
  monthly_gross?: number;
  ctc_annual?: number;
}

export interface SalaryStructure {
  id?: string;
  employee_id: string;
  employee_name?: string;
  emp_code?: string;
  department?: string;
  designation?: string;
  ctc_annual: number;
  basic: number;
  hra: number;
  special_allowance: number;
  monthly_gross?: number;
  pf_applicable: boolean;
  pf_type: 'statutory_capped_1800' | 'actual_basic';
  esi_applicable: boolean;
  pt_applicable: boolean;
  pt_state: string;
  tds_monthly_override: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'approved_leave' | 'holiday' | 'weekend';
  check_in?: string;
  check_out?: string;
  notes?: string;
}

export interface LeaveBalance {
  employee_id: string;
  employee_name: string;
  emp_code: string;
  year: number;
  casual_total: number;
  casual_used: number;
  casual_remaining: number;
  sick_total: number;
  sick_used: number;
  sick_remaining: number;
  earned_total: number;
  earned_used: number;
  earned_remaining: number;
  total_remaining: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  leave_type: 'casual' | 'sick' | 'earned' | 'unpaid_lop';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_on: string;
  reviewed_by?: string;
  review_comment?: string;
}

export interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  name: string;
  working_days: number;
  status: 'draft' | 'calculated' | 'audited' | 'approved' | 'processed';
  processed_at?: string;
  processed_by?: string;
  employee_count: number;
  flagged_count: number;
  total_gross: number;
  total_net: number;
  total_employer_cost: number;
}

export interface PayrollItem {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  designation: string;
  pan: string;
  bank_account: string;
  basic: number;
  hra: number;
  special_allowance: number;
  bonus_or_variable: number;
  gross_earnings: number;
  employee_pf: number;
  employee_esi: number;
  professional_tax: number;
  tds: number;
  unpaid_leave_days: number;
  lop_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  employer_pf: number;
  employer_esi: number;
  total_employer_cost: number;
  audit_status: 'clean' | 'flagged' | 'resolved';
  open_findings_count?: number;
  notes?: string;
}

export interface AuditFinding {
  id: string;
  period_id: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  expected_value: string;
  observed_value: string;
  recommended_action: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Accepted';
  resolution_note?: string;
  resolved_at?: string;
}

export interface PayslipData {
  company: {
    name: string;
    address: string;
    pan: string;
    tan: string;
    epf_reg: string;
    esic_reg: string;
  };
  period: {
    name: string;
    working_days: number;
    status: string;
  };
  employee: {
    id: string;
    emp_code: string;
    name: string;
    department: string;
    designation: string;
    joining_date: string;
    pan: string;
    bank_name: string;
    bank_account: string;
    ifsc: string;
    uan: string;
    tax_regime: string;
  };
  earnings: Array<{ label: string; amount: number }>;
  deductions: Array<{ label: string; amount: number }>;
  summary: {
    gross_earnings: number;
    total_deductions: number;
    net_salary: number;
    net_salary_in_words: string;
    employer_pf: number;
    employer_esi: number;
    total_employer_cost: number;
  };
  leaves: {
    casual_remaining: number;
    sick_remaining: number;
    earned_remaining: number;
  };
}
