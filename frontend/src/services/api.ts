import { User, Employee, SalaryStructure, AttendanceRecord, LeaveBalance, LeaveRequest, PayrollPeriod, PayrollItem, AuditFinding, PayslipData } from '../types';
import {
  INITIAL_DEMO_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_AUDIT_FINDINGS,
  INITIAL_PAYROLL_ITEMS,
  INITIAL_PERIODS,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS
} from './mockData';

let currentUserId: string = 'usr_admin';

export const setApiUserId = (userId: string) => {
  currentUserId = userId;
  localStorage.setItem('paypilot_user_id', userId);
};

export const getApiUserId = (): string => {
  return localStorage.getItem('paypilot_user_id') || currentUserId;
};

// Client-side state persistence for GitHub Pages / static demo mode
const getStore = <T>(key: string, defaultVal: T): T => {
  const saved = localStorage.getItem(`paypilot_store_${key}`);
  if (!saved) {
    localStorage.setItem(`paypilot_store_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return defaultVal;
  }
};

const setStore = (key: string, val: any) => {
  localStorage.setItem(`paypilot_store_${key}`, JSON.stringify(val));
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers || {});
  headers.set('X-User-Id', getApiUserId());
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // Backend unreachable, fallback to client-side mock provider
  }

  return mockRequestHandler<T>(url, options);
};

// Mock request handler for seamless static deployment (e.g. GitHub Pages)
const mockRequestHandler = async <T>(url: string, options: RequestInit): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  const userId = getApiUserId();
  const users = INITIAL_DEMO_USERS;
  const me = users.find(u => u.id === userId) || users[0];

  // Auth
  if (url.includes('/api/auth/demo-users')) {
    return { users } as any;
  }
  if (url.includes('/api/auth/me')) {
    return me as any;
  }

  // Dashboard stats
  if (url.includes('/api/dashboard/stats')) {
    const findings = getStore<AuditFinding[]>('findings', INITIAL_AUDIT_FINDINGS);
    const openFindings = findings.filter(f => f.status === 'Open').length;
    return {
      active_employees: 6,
      current_payroll_run: {
        period_name: 'October 2026',
        status: 'draft',
        total_gross: 669000,
        total_net: 541200,
        total_employer_cost: 687000,
        flagged_discrepancies: openFindings
      },
      attendance: {
        today_present_rate: 94.2,
        present_count: 5,
        absent_count: 1
      },
      leaves: {
        pending_approvals: 2,
        on_leave_today: 0
      }
    } as any;
  }

  // Dashboard charts
  if (url.includes('/api/dashboard/charts')) {
    return {
      monthly_payroll_trend: [
        { month: 'Jun 26', gross: 610000, net: 495000 },
        { month: 'Jul 26', gross: 625000, net: 508000 },
        { month: 'Aug 26', gross: 630000, net: 512000 },
        { month: 'Sep 26', gross: 642000, net: 520000 },
        { month: 'Oct 26', gross: 669000, net: 541200 }
      ],
      department_breakdown: [
        { department: 'Engineering', total_cost: 328600, headcount: 2 },
        { department: 'Marketing', total_cost: 101800, headcount: 1 },
        { department: 'Design', total_cost: 81800, headcount: 1 },
        { department: 'Human Resources', total_cost: 92800, headcount: 1 },
        { department: 'Sales', total_cost: 74800, headcount: 1 }
      ]
    } as any;
  }

  // Recent activity
  if (url.includes('/api/dashboard/recent-activity')) {
    return {
      activities: [
        { id: '1', action: 'Draft Run Created', description: 'October 2026 payroll calculation batch initialized', timestamp: '10 mins ago', user: 'System' },
        { id: '2', action: 'Audit Scan', description: 'AI Payroll Auditor flagged 4 potential discrepancies', timestamp: '8 mins ago', user: 'AI Auditor' },
        { id: '3', action: 'Leave Requested', description: 'Rohan Verma applied for 2 days Casual Leave', timestamp: '2 hours ago', user: 'Rohan Verma' },
        { id: '4', action: 'Attendance Clock-In', description: 'Priya Sharma logged in via Bengaluru Geofence', timestamp: 'Today 09:12 AM', user: 'Priya Sharma' }
      ]
    } as any;
  }

  // Employees
  if (url.startsWith('/api/employees')) {
    const employees = getStore<Employee[]>('employees', INITIAL_EMPLOYEES);
    return { employees, total: employees.length } as any;
  }

  // Attendance
  if (url.startsWith('/api/attendance')) {
    const records: AttendanceRecord[] = [
      { id: 'att_1', employee_id: 'emp_003', employee_name: 'Rohan Verma', emp_code: 'BTI-003', department: 'Engineering', date: '2026-10-23', status: 'present', check_in: '09:05', check_out: '18:15', notes: 'Logged via Web Terminal' },
      { id: 'att_2', employee_id: 'emp_002', employee_name: 'Priya Sharma', emp_code: 'BTI-002', department: 'Marketing', date: '2026-10-23', status: 'absent', notes: 'Unbilled Absence' },
      { id: 'att_3', employee_id: 'emp_001', employee_name: 'Sneha Rao', emp_code: 'BTI-001', department: 'Design', date: '2026-10-23', status: 'present', check_in: '09:30', check_out: '18:30', notes: 'Web Clock-in' },
      { id: 'att_4', employee_id: 'emp_004', employee_name: 'Vikram Singh', emp_code: 'BTI-004', department: 'Engineering', date: '2026-10-23', status: 'present', check_in: '08:50', check_out: '17:50', notes: 'Biometric Access' },
      { id: 'att_5', employee_id: 'emp_005', employee_name: 'Amit Patel', emp_code: 'BTI-005', department: 'Sales', date: '2026-10-23', status: 'present', check_in: '09:15', check_out: '18:00', notes: 'Field Check-in' },
      { id: 'att_6', employee_id: 'emp_006', employee_name: 'Kavita Nair', emp_code: 'BTI-006', department: 'Human Resources', date: '2026-10-23', status: 'present', check_in: '09:00', check_out: '18:00', notes: 'HQ Terminal' }
    ];
    return { records, summary: { present: 5, absent: 1, leave: 0, attendance_rate: 94.2 } } as any;
  }

  // Leave
  if (url.includes('/api/leave/balances')) {
    return { balances: INITIAL_LEAVE_BALANCES } as any;
  }
  if (url.startsWith('/api/leave/requests')) {
    const requests = getStore<LeaveRequest[]>('leave_requests', INITIAL_LEAVE_REQUESTS);
    if (method === 'POST' && url.includes('/review')) {
      const id = url.split('/requests/')[1]?.split('/')[0];
      const body = JSON.parse(options.body as string || '{}');
      const updated = requests.map(r => r.id === id ? { ...r, status: body.status } : r);
      setStore('leave_requests', updated);
      return { message: 'Leave status updated', requests: updated } as any;
    }
    const pending = requests.filter(r => r.status === 'pending').length;
    return { requests, pending_count: pending } as any;
  }

  // Salary structures
  if (url.startsWith('/api/salary-structures')) {
    const structures: SalaryStructure[] = INITIAL_EMPLOYEES.map(emp => {
      const monthly = emp.monthly_gross || 100000;
      const basic = monthly * 0.5;
      const hra = monthly * 0.25;
      const special = monthly * 0.25;
      return {
        id: `ss_${emp.id}`,
        employee_id: emp.id,
        employee_name: emp.name,
        emp_code: emp.emp_code,
        department: emp.department,
        designation: emp.designation,
        ctc_annual: emp.ctc_annual || 1200000,
        monthly_gross: monthly,
        basic,
        hra,
        special_allowance: special,
        pf_applicable: true,
        pf_type: 'statutory_capped_1800',
        esi_applicable: false,
        pt_applicable: true,
        pt_state: 'Karnataka',
        tds_monthly_override: 0
      };
    });
    return { structures } as any;
  }

  // Payroll
  if (url.includes('/api/payroll/periods')) {
    const periods = getStore<PayrollPeriod[]>('payroll_periods', INITIAL_PERIODS);
    const items = getStore<PayrollItem[]>('payroll_items', INITIAL_PAYROLL_ITEMS);

    if (url.includes('/calculate')) {
      return { message: 'Calculated successfully' } as any;
    }
    if (url.includes('/process')) {
      const updatedPeriods = periods.map(p => p.id === 'period_oct_2026' ? { ...p, status: 'processed' as const } : p);
      setStore('payroll_periods', updatedPeriods);
      return { message: 'Processed successfully' } as any;
    }
    if (method === 'PUT' && url.includes('/items/')) {
      const itemId = url.split('/items/')[1];
      const body = JSON.parse(options.body as string || '{}');
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          const bonus = body.bonus_or_variable ?? item.bonus_or_variable;
          const unpaidDays = body.unpaid_leave_days ?? item.unpaid_leave_days;
          const lop = (item.gross_earnings / 22) * unpaidDays;
          const newGross = item.basic + item.hra + item.special_allowance + bonus;
          const otherDed = body.other_deductions ?? item.other_deductions;
          const newDed = item.employee_pf + item.professional_tax + item.tds + lop + otherDed;
          const newNet = newGross - newDed;
          return {
            ...item,
            bonus_or_variable: bonus,
            unpaid_leave_days: unpaidDays,
            lop_deduction: lop,
            other_deductions: otherDed,
            gross_earnings: newGross,
            total_deductions: newDed,
            net_salary: newNet,
            audit_status: (bonus === 0 && unpaidDays === 0 && newNet > 0) ? 'resolved' : item.audit_status
          };
        }
        return item;
      });
      setStore('payroll_items', updatedItems);
      return { message: 'Updated line item' } as any;
    }

    const currentPeriod = periods.find(p => p.id === 'period_oct_2026') || periods[0];
    const totalGross = items.reduce((sum, i) => sum + i.gross_earnings, 0);
    const totalDeductions = items.reduce((sum, i) => sum + i.total_deductions, 0);
    const totalNet = items.reduce((sum, i) => sum + i.net_salary, 0);
    const totalEmployer = items.reduce((sum, i) => sum + i.total_employer_cost, 0);
    const flagged = items.filter(i => i.audit_status === 'flagged').length;

    return {
      period: currentPeriod,
      items,
      summary: {
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        total_employer_cost: totalEmployer,
        flagged_count: flagged
      },
      periods
    } as any;
  }

  // AI Payroll Auditor
  if (url.startsWith('/api/auditor')) {
    const findings = getStore<AuditFinding[]>('findings', INITIAL_AUDIT_FINDINGS);
    if (url.includes('/resolve')) {
      const id = url.split('/findings/')[1]?.split('/')[0];
      const body = JSON.parse(options.body as string || '{}');
      const updated = findings.map(f => f.id === id ? { ...f, status: body.status, resolution_note: body.resolution_note } : f);
      setStore('findings', updated);
      return { message: 'Resolved finding', findings: updated } as any;
    }
    const critical = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'Open').length;
    const high = findings.filter(f => f.severity === 'HIGH' && f.status === 'Open').length;
    const medium = findings.filter(f => f.severity === 'MEDIUM' && f.status === 'Open').length;
    const resolved = findings.filter(f => f.status === 'Resolved' || f.status === 'Accepted').length;
    const totalOpen = findings.filter(f => f.status === 'Open').length;

    return {
      findings,
      summary: {
        total_open: totalOpen,
        critical,
        high,
        medium,
        resolved
      }
    } as any;
  }

  // AI Assistant
  if (url.includes('/api/assistant/chat')) {
    const body = JSON.parse(options.body as string || '{}');
    const query = (body.query || '').toLowerCase();

    if (query.includes('take-home') || query.includes('calculated')) {
      return {
        answer: `### Salary Calculation Breakdown (October 2026)\n\nFor **${me.full_name}**:\n- **Basic Salary**: ₹75,000.00\n- **House Rent Allowance (HRA)**: ₹37,500.00\n- **Special Allowance**: ₹27,500.00\n- **Gross Earnings**: ₹1,40,000.00\n\n**Statutory Deductions:**\n- **Provident Fund (EPF)**: ₹1,800.00 (Statutory Capped)\n- **Professional Tax (PT)**: ₹200.00 (Karnataka Slab)\n- **Income Tax (TDS)**: ₹21,500.00 (New Regime u/s 115BAC)\n\n**Net Take-Home Salary**: **₹1,16,500.00**\n\n*All deductions were deterministically validated by the PayPilot Indian Statutory Engine.*`,
        sources: ['PayPilot Statutory Rules', 'Employee Master Ledger', 'CBDT Income Tax Slabs']
      } as any;
    }
    if (query.includes('discrepanc') || query.includes('findings') || query.includes('audit')) {
      return {
        answer: `### Pre-Disbursement Audit Summary\n\nThe AI Payroll Auditor flagged **4 open discrepancies** in the October 2026 payroll run:\n1. **Rohan Verma (Engineering)**: 53.6% Gross salary spike (+₹75,000 bonus).\n2. **Priya Sharma (Marketing)**: 4 unbilled absence days without LOP deduction.\n3. **Amit Patel (Sales)**: Negative take-home (-₹7,000) due to un-capped advance loan deduction.\n4. **Vikram Singh (DevOps)**: Missing bank account and IFSC details.`,
        sources: ['AI Payroll Auditor Engine', 'Biometric Attendance Logs', 'Bank Account Verification']
      } as any;
    }
    return {
      answer: `Hello! As your PayPilot AI Assistant, I can confirm that the October 2026 payroll run is currently under pre-disbursement audit. All formulas adhere to EPF 12% statutory caps (₹1,800), Professional Tax (₹200), and the New Tax Regime (Section 115BAC).`,
      sources: ['PayPilot Enterprise Knowledgebase', 'Statutory Guidelines']
    } as any;
  }

  // Payslips & Reports
  if (url.includes('/api/reports/payslip/')) {
    return {
      company: {
        name: 'BharatTech Innovations Pvt. Ltd.',
        address: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
        pan: 'AABCB1234F',
        tan: 'BLRB12345C',
        epf_reg: 'KN/BNG/1234567/000',
        esic_reg: '53000123450000001'
      },
      period: {
        name: 'October 2026',
        working_days: 22,
        status: 'Calculated'
      },
      employee: {
        name: 'Rohan Verma',
        emp_code: 'BTI-003',
        department: 'Engineering',
        designation: 'Staff Backend Engineer',
        pan: 'CRRPV5432L',
        uan: '100908070605',
        bank_account: '918020045678912',
        tax_regime: 'New Regime (115BAC)'
      },
      earnings: [
        { label: 'Basic Salary', amount: 75000 },
        { label: 'House Rent Allowance (HRA)', amount: 37500 },
        { label: 'Special Allowance', amount: 27500 },
        { label: 'Variable / Festival Bonus', amount: 75000 }
      ],
      deductions: [
        { label: 'Employee Provident Fund (EPF)', amount: 1800 },
        { label: 'Professional Tax (PT)', amount: 200 },
        { label: 'Income Tax (TDS)', amount: 21500 },
        { label: 'Loss of Pay (LOP)', amount: 0 }
      ],
      summary: {
        gross_earnings: 215000,
        total_deductions: 23500,
        net_salary: 191500,
        net_salary_in_words: 'Rupees One Lakh Ninety One Thousand Five Hundred Only',
        total_employer_cost: 216800,
        employer_pf: 1800
      },
      leaves: {
        casual_remaining: 10,
        sick_remaining: 9,
        earned_remaining: 12
      }
    } as any;
  }

  if (url.includes('/api/reports/summary/')) {
    return {
      period_name: 'October 2026',
      employee_count: 6,
      total_gross: 669000,
      total_net: 541200,
      total_deductions: 127800,
      total_employer_cost: 687000,
      statutory_breakdown: {
        provident_fund: 10800,
        esi: 0,
        professional_tax: 1200,
        tds: 39600
      }
    } as any;
  }

  if (url.includes('/api/reports/department-report/')) {
    return {
      departments: [
        { department: 'Engineering', headcount: 2, gross_salary: 325000, net_salary: 294000, employer_cost: 328600 },
        { department: 'Marketing', headcount: 1, gross_salary: 100000, net_salary: 93500, employer_cost: 101800 },
        { department: 'Design', headcount: 1, gross_salary: 80000, net_salary: 75500, employer_cost: 81800 },
        { department: 'Human Resources', headcount: 1, gross_salary: 91000, net_salary: 85200, employer_cost: 92800 },
        { department: 'Sales', headcount: 1, gross_salary: 73000, net_salary: -7000, employer_cost: 74800 }
      ]
    } as any;
  }

  // Reset Seed
  if (url.includes('/api/seed/reset')) {
    localStorage.removeItem('paypilot_store_findings');
    localStorage.removeItem('paypilot_store_payroll_items');
    localStorage.removeItem('paypilot_store_payroll_periods');
    localStorage.removeItem('paypilot_store_leave_requests');
    return { message: 'Reset demo data successfully' } as any;
  }

  return {} as any;
};

// Client-side export generator for static demo fallback
const createDownloadBlob = (content: string, type: string) => {
  const blob = new Blob([content], { type });
  return URL.createObjectURL(blob);
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

  // File Download Handlers (with browser blob generator for static GitHub Pages)
  getExportCsvUrl: (_periodId: string) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const csv = `Employee Code,Name,Department,Designation,PAN,Gross Earnings,PF (Employee),PT,TDS,Total Deductions,Net Salary\n` +
        INITIAL_PAYROLL_ITEMS.map(i => `${i.emp_code},"${i.employee_name}","${i.department}","Staff",ABCDE1234F,${i.gross_earnings},${i.employee_pf},${i.professional_tax},${i.tds},${i.total_deductions},${i.net_salary}`).join('\n');
      return createDownloadBlob(csv, 'text/csv');
    }
    return `/api/reports/export-csv/${_periodId}`;
  },
  getExportBankFileUrl: (_periodId: string) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const cms = `P,002105009876,ICIC0000021,93500.00,Priya Sharma,Salary Oct 2026,BTI-002\n` +
        `P,918020045678912,UTIB0000128,191500.00,Rohan Verma,Salary Oct 2026,BTI-003\n` +
        `P,50100456123489,HDFC0001234,75500.00,Sneha Rao,Salary Oct 2026,BTI-001\n` +
        `P,50100987654321,HDFC0001234,85200.00,Kavita Nair,Salary Oct 2026,BTI-006\n`;
      return createDownloadBlob(cms, 'text/csv');
    }
    return `/api/reports/export-bank-file/${_periodId}`;
  },
  getExportEpfEcrUrl: (_periodId: string) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const ecr = `100908070605#~#Rohan Verma#~#75000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0\n` +
        `100908070602#~#Priya Sharma#~#55000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0\n` +
        `100908070601#~#Sneha Rao#~#45000#~#15000#~#15000#~#15000#~#1800#~#1250#~#550#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0#~#0\n`;
      return createDownloadBlob(ecr, 'text/plain');
    }
    return `/api/reports/export-epf-ecr/${_periodId}`;
  },

  // Reset Seed
  resetSeedData: () => request<any>('/api/seed/reset', { method: 'POST' }),

  // Commercial Auth & Organization Onboarding
  loginUser: (email: string, password?: string) =>
    request<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'demo' })
    }),
  registerOrganization: (data: {
    company_name: string;
    owner_name: string;
    email: string;
    password: string;
    phone?: string;
    plan_tier?: string;
    pan?: string;
    tan?: string;
    state?: string;
  }) =>
    request<any>('/api/auth/register-organization', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  forgotPassword: (email: string) =>
    request<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  resetPassword: (token: string, new_password: string) =>
    request<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password })
    }),

  // Commercial Billing & Subscriptions
  getPlans: () => request<{ plans: any[] }>('/api/billing/plans'),
  getSubscription: () => request<any>('/api/billing/subscription'),
  createRazorpayOrder: (plan_tier: string, billing_cycle: string = 'monthly') =>
    request<any>('/api/billing/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan_tier, billing_cycle })
    }),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan_tier: string;
    billing_cycle?: string;
  }) =>
    request<any>('/api/billing/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getInvoices: () => request<{ invoices: any[] }>('/api/billing/invoices'),
  contactSales: (data: {
    full_name: string;
    email: string;
    phone?: string;
    company_name: string;
    employee_range?: string;
    message?: string;
    inquiry_type?: string;
  }) =>
    request<any>('/api/billing/contact-sales', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Employee Documents
  getEmployeeDocuments: (employeeId: string) =>
    request<{ documents: any[] }>(`/api/employees/${employeeId}/documents`),
  uploadEmployeeDocument: (employeeId: string, doc: {
    document_type: string;
    title: string;
    file_name: string;
    file_size_kb?: number;
  }) =>
    request<any>(`/api/employees/${employeeId}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc)
    }),
  deleteEmployeeDocument: (employeeId: string, docId: string) =>
    request<any>(`/api/employees/${employeeId}/documents/${docId}`, {
      method: 'DELETE'
    })
};

export const formatINR = (amount: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};
