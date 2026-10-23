import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { PayslipData, User } from '../types';
import {
  Receipt, Printer, Download, FileSpreadsheet,
  Building, CheckCircle, ShieldCheck, UserCheck, Calendar
} from 'lucide-react';

interface PayslipsReportsPageProps {
  currentUser: User | null;
  initialView?: 'payslip' | 'summary' | 'departments';
}

export const PayslipsReportsPage: React.FC<PayslipsReportsPageProps> = ({ currentUser, initialView = 'payslip' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('period_oct_2026');
  const [selectedEmpId, setSelectedEmpId] = useState('emp_003');
  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [deptReport, setDeptReport] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'payslip' | 'summary' | 'departments'>(initialView);

  useEffect(() => {
    if (initialView) {
      setViewTab(initialView);
    }
  }, [initialView]);

  const isEmployee = currentUser?.role === 'employee';

  useEffect(() => {
    if (isEmployee && currentUser?.employee_id) {
      setSelectedEmpId(currentUser.employee_id);
    }
  }, [currentUser]);

  useEffect(() => {
    loadReports();
  }, [selectedPeriod, selectedEmpId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [pData, dData, sData] = await Promise.all([
        api.getPayslipData(selectedPeriod, selectedEmpId),
        !isEmployee ? api.getDepartmentReport(selectedPeriod) : Promise.resolve({ departments: [] }),
        !isEmployee ? api.getMonthlySummaryReport(selectedPeriod) : Promise.resolve(null),
      ]);
      setPayslip(pData);
      setDeptReport(dData.departments || []);
      setMonthlySummary(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header (hidden during browser print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {isEmployee ? 'My Payslips & Tax Statements' : 'Payslips & Enterprise Reports'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Printable statutory Indian payslips with digital verification, bank CMS batches, and department ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEmployee && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewTab('payslip')}
                className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewTab === 'payslip' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Payslip View
              </button>
              <button
                onClick={() => setViewTab('summary')}
                className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewTab === 'summary' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Statutory Summary
              </button>
              <button
                onClick={() => setViewTab('departments')}
                className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  viewTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Department Cost
              </button>
            </div>
          )}

          {viewTab === 'payslip' && (
            <button
              onClick={handlePrint}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Payslip</span>
            </button>
          )}

          {!isEmployee && (
            <>
              <a
                href={api.getExportBankFileUrl(selectedPeriod)}
                download
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"
                title="Download Corporate NetBanking NEFT batch payment CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Bank CMS Batch</span>
              </a>

              <a
                href={api.getExportEpfEcrUrl(selectedPeriod)}
                download
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"
                title="Download official EPFO Unified Portal ECR text file"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>EPFO ECR</span>
              </a>
            </>
          )}

          <a
            href={api.getExportCsvUrl(selectedPeriod)}
            download
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Payroll CSV</span>
          </a>
        </div>
      </div>

      {/* Selectors for Period and Employee (hidden in print) */}
      {viewTab === 'payslip' && (
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4 no-print text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Payroll Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="period_oct_2026">October 2026 (Active Run)</option>
              <option value="period_sep_2026">September 2026 (Historical)</option>
            </select>
          </div>

          {!isEmployee && (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Employee:</span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-medium text-slate-800"
              >
                <option value="emp_003">Rohan Verma (Engineering)</option>
                <option value="emp_002">Priya Sharma (Marketing)</option>
                <option value="emp_001">Sneha Rao (Design)</option>
                <option value="emp_004">Vikram Singh (DevOps)</option>
                <option value="emp_005">Amit Patel (Sales)</option>
                <option value="emp_006">Kavita Nair (HR)</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 1. OFFICIAL PRINTABLE PAYSLIP VIEW */}
      {viewTab === 'payslip' && payslip && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 max-w-4xl mx-auto printable-payslip">
          {/* Company Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                  {payslip.company.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md">{payslip.company.address}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                PAN: {payslip.company.pan} &bull; TAN: {payslip.company.tan} &bull; EPF Reg: {payslip.company.epf_reg}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Payslip for {payslip.period.name}
              </span>
              <p className="text-[11px] text-slate-500 mt-2">
                Working Days: <strong>{payslip.period.working_days} Days</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Status: <strong className="text-emerald-700 uppercase">{payslip.period.status}</strong>
              </p>
            </div>
          </div>

          {/* Employee Metadata Grid */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-6">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Employee Code</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{payslip.employee.emp_code}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Employee Name</span>
              <p className="font-bold text-slate-900 mt-0.5">{payslip.employee.name}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Department</span>
              <p className="font-medium text-slate-800 mt-0.5">{payslip.employee.department}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Designation</span>
              <p className="font-medium text-slate-800 mt-0.5">{payslip.employee.designation}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">PAN Card</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{payslip.employee.pan}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">UAN (Universal PF)</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{payslip.employee.uan}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Bank Account</span>
              <p className="font-mono font-bold text-slate-800 mt-0.5">
                {payslip.employee.bank_account ? `****${payslip.employee.bank_account.slice(-4)}` : 'MISSING'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Tax Regime</span>
              <p className="font-medium text-slate-800 mt-0.5">{payslip.employee.tax_regime}</p>
            </div>
          </div>

          {/* Earnings and Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6">
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 p-2.5 font-semibold text-slate-700 flex justify-between items-center text-[11px] uppercase tracking-wider border-b border-slate-200">
                <span>Earnings</span>
                <span>Amount (INR)</span>
              </div>
              <div className="divide-y divide-slate-100 font-medium">
                {payslip.earnings.map((e, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <span className="text-slate-700">{e.label}</span>
                    <span className="font-mono text-slate-900">{formatINR(e.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-3 font-semibold border-t border-slate-200 flex justify-between items-center text-slate-900">
                <span>Total Gross Earnings (A)</span>
                <span className="font-mono text-slate-900 font-bold">{formatINR(payslip.summary.gross_earnings)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 p-2.5 font-semibold text-slate-700 flex justify-between items-center text-[11px] uppercase tracking-wider border-b border-slate-200">
                <span>Deductions</span>
                <span>Amount (INR)</span>
              </div>
              <div className="divide-y divide-slate-100 font-medium">
                {payslip.deductions.map((d, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center">
                    <span className="text-slate-700">{d.label}</span>
                    <span className="font-mono text-red-600">-{formatINR(d.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-3 font-semibold border-t border-slate-200 flex justify-between items-center text-slate-900">
                <span>Total Deductions (B)</span>
                <span className="font-mono text-red-600 font-bold">-{formatINR(payslip.summary.total_deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight Block */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Net Take-Home Salary (A - B)
              </span>
              <p className="text-2xl font-bold text-slate-900 font-sans mt-0.5">
                {formatINR(payslip.summary.net_salary)}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <strong>In Words: </strong> {payslip.summary.net_salary_in_words}
              </p>
            </div>

            <div className="sm:text-right text-xs text-slate-600">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Employer Total Cost (CTC)</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{formatINR(payslip.summary.total_employer_cost)}</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                Includes Employer PF ({formatINR(payslip.summary.employer_pf)})
              </span>
            </div>
          </div>

          {/* Signature and Verification Footer */}
          <div className="border-t border-slate-200 pt-5 mt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-800">Digitally Verified Document</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Generated on: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST via PayPilot AI. No physical signature required.
              </p>
              <p className="text-[10px] text-slate-400">
                Leave Balance: CL ({payslip.leaves.casual_remaining}d), SL ({payslip.leaves.sick_remaining}d), EL ({payslip.leaves.earned_remaining}d)
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 w-full sm:w-auto">
              <div className="h-8 flex items-center justify-start sm:justify-end">
                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  DIGITALLY SIGNED
                </span>
              </div>
              <p className="font-bold text-slate-900 mt-1">BharatTech Innovations Pvt. Ltd.</p>
              <p className="text-[10px] text-slate-400">Authorized Signatory / Payroll Dept</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. STATUTORY MONTHLY SUMMARY REPORT */}
      {viewTab === 'summary' && monthlySummary && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Statutory & Disbursement Summary ({monthlySummary.period_name})
              </h3>
              <p className="text-xs text-slate-500">Aggregate ledger for PF, ESI, Professional Tax, and Income Tax</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 border border-slate-200">
              {monthlySummary.employee_count} Active Employees
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Payout</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-1">{formatINR(monthlySummary.total_gross)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Net Disbursed Take-Home</span>
              <p className="text-xl font-bold text-indigo-700 font-mono mt-1">{formatINR(monthlySummary.total_net)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Deductions Recovered</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-1">-{formatINR(monthlySummary.total_deductions)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Company Total CTC</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-1">{formatINR(monthlySummary.total_employer_cost)}</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-50 p-3 font-semibold text-slate-700 uppercase text-[10px] border-b border-slate-200">
              Statutory Remittance Ledger
            </div>
            <div className="divide-y divide-slate-100 p-1 font-medium">
              <div className="py-2.5 px-3 flex justify-between">
                <span>Provident Fund (EPFO Total Remittance)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(monthlySummary.statutory_breakdown.provident_fund * 2)} (Employee + Employer)</span>
              </div>
              <div className="py-2.5 px-3 flex justify-between">
                <span>Employees' State Insurance (ESIC Remittance)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(monthlySummary.statutory_breakdown.esi)}</span>
              </div>
              <div className="py-2.5 px-3 flex justify-between">
                <span>Professional Tax (Commercial Taxes Dept)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(monthlySummary.statutory_breakdown.professional_tax)}</span>
              </div>
              <div className="py-2.5 px-3 flex justify-between">
                <span>Tax Deducted at Source (TDS 192B Remittance)</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(monthlySummary.statutory_breakdown.tds)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DEPARTMENT EXPENSE REPORT */}
      {viewTab === 'departments' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Department-Wise Payroll Expense Allocation</h3>
            <p className="text-xs text-slate-500">Breakdown of gross wages and employer cost by department</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Headcount</th>
                  <th className="py-2.5 px-4">Gross Salary</th>
                  <th className="py-2.5 px-4">Net Salary</th>
                  <th className="py-2.5 px-4">Employer Cost (CTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {deptReport.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.department}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{d.headcount} Members</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{formatINR(d.gross_salary)}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{formatINR(d.net_salary)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatINR(d.employer_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
