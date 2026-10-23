export type UserRole = 'admin' | 'owner' | 'payroll_admin' | 'manager' | 'employee';

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
    pan?: string;
    tan?: string;
    plan_tier?: string;
    subscription_status?: string;
    max_employees?: number;
    trial_ends_at?: string;
  };
  subscription?: {
    plan_tier: string;
    status: string;
    billing_cycle: string;
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
  manager_id?: string;
  employment_type?: 'full_time' | 'contract' | 'intern';
  employment_status?: 'active' | 'probation' | 'notice_period' | 'resigned' | 'terminated';
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

export interface EmployeeDocument {
  id: string;
  document_type: string;
  title: string;
  file_name: string;
  file_size_kb: number;
  file_url: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface SaaSPlan {
  id: string;
  name: string;
  tagline: string;
  monthly_price: number;
  annual_price: number;
  max_employees: number;
  features: string[];
  is_popular: boolean;
}

export interface SaaSSubscription {
  company_id: string;
  company_name: string;
  plan_tier: string;
  plan_name: string;
  subscription_status: string;
  max_employees: number;
  current_employee_count: number;
  trial_ends_at?: string;
  trial_days_remaining?: number;
  billing_cycle: string;
  current_period_end?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  payment_method: string;
  paid_at?: string;
  created_at: string;
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

// ----------------------------------------------------------------------------
// PAYPILOT INTELLIGENCE ENGINE TYPES
// ----------------------------------------------------------------------------

export interface SimulationItem {
  employee_id?: string;
  employee_name: string;
  department: string;
  change_type: 'salary_hike' | 'bonus' | 'new_hire' | 'none';
  hike_pct?: number;
  bonus_amount?: number;
  old_gross: number;
  new_gross: number;
  simulated_basic: number;
  simulated_pf: number;
  simulated_esi: number;
  simulated_pt: number;
  simulated_tds: number;
  simulated_net: number;
  old_employer_cost: number;
  simulated_employer_cost: number;
  cost_delta: number;
}

export interface DepartmentBreakdown {
  department: string;
  baseline_cost: number;
  simulated_cost: number;
  headcount_delta: number;
  delta: number;
  delta_pct: number;
}

export interface SimulationResult {
  base_period_name: string;
  baseline_summary: {
    headcount: number;
    total_gross: number;
    total_net: number;
    total_employer_pf: number;
    total_cost_ctc: number;
  };
  simulated_summary: {
    headcount: number;
    total_gross: number;
    total_net: number;
    total_employer_pf: number;
    total_cost_ctc: number;
  };
  variance: {
    cost_delta_monthly: number;
    cost_delta_pct: number;
    cost_delta_annualized: number;
    headcount_added: number;
  };
  department_breakdown: DepartmentBreakdown[];
  simulated_items: SimulationItem[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description?: string;
  base_period_id: string;
  baseline_total_cost: number;
  simulated_total_cost: number;
  cost_delta: number;
  cost_delta_pct: number;
  parameters: any;
  created_by?: string;
  status: string;
  created_at: string;
}

export interface ForecastPoint {
  month: string;
  payroll_cost: number;
  lower_bound: number;
  upper_bound: number;
  headcount: number;
  is_forecast: boolean;
}

export interface PayrollForecastData {
  forecast_series: ForecastPoint[];
  next_month_projection: {
    month: string;
    expected_cost: number;
    lower_bound: number;
    upper_bound: number;
    expected_variance_pct: number;
    projected_headcount: number;
  };
  assumptions: string[];
}

export interface AnomalyRadarItem {
  id: string;
  rule_code: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  employee_id: string;
  employee_name: string;
  emp_code: string;
  department: string;
  expected_value: string;
  observed_value: string;
  recommended_investigation_steps: string[];
  status: 'Open' | 'Investigating' | 'Resolved' | 'Accepted';
}

export interface AnomalyRadarData {
  period_id?: string;
  severity_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  open_count: number;
  anomalies: AnomalyRadarItem[];
}

export interface PayslipComponentDiff {
  name: string;
  prev: number;
  curr: number;
  diff: number;
}

export interface ExplainPayslipResult {
  employee_id: string;
  employee_name: string;
  department: string;
  current_period: string;
  comparison_period: string;
  net_difference: number;
  components: PayslipComponentDiff[];
  grounded_explanation: string;
  is_ai_synthesized: boolean;
}

export interface HRWorkflowTaskItem {
  id: string;
  task_type: string;
  title: string;
  description: string;
  target_employee_id?: string;
  target_employee_name?: string;
  department?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending_approval' | 'approved' | 'rejected';
  requires_approval: boolean;
  consequential_action: string;
  payload: any;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface IntelligenceSummary {
  next_month_projection: {
    month: string;
    expected_cost: number;
    lower_bound: number;
    upper_bound: number;
    expected_variance_pct: number;
    projected_headcount: number;
  };
  anomaly_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  total_open_anomalies: number;
  scenarios_count: number;
  pending_workflow_tasks: number;
  is_employee: boolean;
}

