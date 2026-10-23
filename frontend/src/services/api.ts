import { User, Employee, SalaryStructure, AttendanceRecord, LeaveBalance, LeaveRequest, PayrollPeriod, PayrollItem, AuditFinding, PayslipData } from '../types';

let currentUserId: string = 'usr_admin';

export const setApiUserId = (userId: string) => {
  currentUserId = userId;
  localStorage.setItem('paypilot_user_id', userId);
};

export const getApiUserId = (): string => {
  return localStorage.getItem('paypilot_user_id') || currentUserId;
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers || {});
  headers.set('X-User-Id', getApiUserId());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
};

export const api = {
  // Auth
  getDemoUsers: () => request<{ users: User[] }>('/api/auth/demo-users'),
  getMe: () => request<User>('/api/auth/me'),

  // Dashboard
  getDashboardStats: () => request<any>('/api/dashboard/stats'),
  getDashboardCharts: () => request<any>('/api/dashboard/charts'),
  getRecentActivity: () => request<{ activities: any[] }>('/api/dashboard/recent-activity'),

  // Employees
  getEmployees: (search?: string, department?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department && department !== 'all') params.append('department', department);
    if (status && status !== 'all') params.append('status', status);
    return request<{ employees: Employee[]; total: number }>(`/api/employees?${params.toString()}`);
  },
  getEmployeeDetail: (id: string) => request<any>(`/api/employees/${id}`),
  createEmployee: (data: any) => request<any>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => request<any>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateEmployee: (id: string) => request<any>(`/api/employees/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (month = 10, year = 2026, employeeId?: string) => {
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (employeeId && employeeId !== 'all') params.append('employee_id', employeeId);
    return request<{ records: AttendanceRecord[]; summary: any }>(`/api/attendance?${params.toString()}`);
  },
  markAttendance: (data: any) => request<any>('/api/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),

  // Leave
  getLeaveBalances: () => request<{ balances: LeaveBalance[] }>('/api/leave/balances'),
  getLeaveRequests: (status?: string) => {
    const params = status && status !== 'all' ? `?status=${status}` : '';
    return request<{ requests: LeaveRequest[]; pending_count: number }>(`/api/leave/requests${params}`);
  },
  applyLeave: (data: any) => request<any>('/api/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
  reviewLeave: (id: string, status: 'approved' | 'rejected', review_comment?: string) =>
    request<any>(`/api/leave/requests/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, review_comment })
    }),

  // Salary Structure
  getSalaryStructures: () => request<{ structures: SalaryStructure[] }>('/api/salary-structures'),
  getEmployeeSalaryStructure: (empId: string) => request<SalaryStructure>(`/api/salary-structures/${empId}`),
  updateSalaryStructure: (empId: string, data: any) =>
    request<any>(`/api/salary-structures/${empId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Payroll
  getPayrollPeriods: () => request<{ periods: PayrollPeriod[] }>('/api/payroll/periods'),
  getPeriodDetail: (id: string, department?: string, auditStatus?: string) => {
    const params = new URLSearchParams();
    if (department && department !== 'all') params.append('department', department);
    if (auditStatus && auditStatus !== 'all') params.append('audit_status', auditStatus);
    return request<{ period: PayrollPeriod; items: PayrollItem[]; summary: any }>(
      `/api/payroll/periods/${id}?${params.toString()}`
    );
  },
  calculatePayroll: (periodId: string) =>
    request<any>(`/api/payroll/periods/${periodId}/calculate`, { method: 'POST' }),
  updatePayrollItem: (itemId: string, data: any) =>
    request<any>(`/api/payroll/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  approvePayroll: (periodId: string) =>
    request<any>(`/api/payroll/periods/${periodId}/approve`, { method: 'POST' }),
  processPayroll: (periodId: string) =>
    request<any>(`/api/payroll/periods/${periodId}/process`, { method: 'POST' }),

  // AI Payroll Auditor
  getAuditFindings: (periodId?: string, severity?: string, category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (periodId && periodId !== 'all') params.append('period_id', periodId);
    if (severity && severity !== 'all') params.append('severity', severity);
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    return request<{ findings: AuditFinding[]; summary: any }>(`/api/auditor/findings?${params.toString()}`);
  },
  runPayrollAudit: (periodId: string) =>
    request<any>('/api/auditor/run', { method: 'POST', body: JSON.stringify({ period_id: periodId }) }),
  resolveAuditFinding: (id: string, status: string, resolution_note: string) =>
    request<any>(`/api/auditor/findings/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, resolution_note })
    }),

  // AI Assistant
  askAssistant: (query: string) =>
    request<{ answer: string; data?: any; sources?: string[] }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ query })
    }),

  // Payslips & Reports
  getPayslipData: (periodId: string, employeeId: string) =>
    request<PayslipData>(`/api/reports/payslip/${periodId}/${employeeId}`),
  getMonthlySummaryReport: (periodId: string) =>
    request<any>(`/api/reports/summary/${periodId}`),
  getDepartmentReport: (periodId: string) =>
    request<any>(`/api/reports/department-report/${periodId}`),
  getExportCsvUrl: (periodId: string) => `/api/reports/export-csv/${periodId}`,
  getExportBankFileUrl: (periodId: string) => `/api/reports/export-bank-file/${periodId}`,
  getExportEpfEcrUrl: (periodId: string) => `/api/reports/export-epf-ecr/${periodId}`,

  // Reset Seed
  resetSeedData: () => request<any>('/api/seed/reset', { method: 'POST' })
};

export const formatINR = (amount: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};
