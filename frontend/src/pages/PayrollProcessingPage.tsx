import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { PayrollPeriod, PayrollItem, User } from '../types';
import {
  Calculator, ShieldAlert, CheckCircle2, AlertTriangle,
  Play, Check, Lock, RefreshCw, FileText, ArrowRight,
  Filter, Edit, Download, ShieldCheck, ChevronRight, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PayrollProcessingPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
}

export const PayrollProcessingPage: React.FC<PayrollProcessingPageProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('period_oct_2026');
  const [periodDetail, setPeriodDetail] = useState<PayrollPeriod | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [deptFilter, setDeptFilter] = useState('all');
  const [auditFilter, setAuditFilter] = useState('all');

  // Edit item modal
  const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
  const [editForm, setEditForm] = useState({
    bonus_or_variable: 0,
    unpaid_leave_days: 0,
    other_deductions: 0,
    notes: ''
  });
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodItems(selectedPeriodId);
    }
  }, [selectedPeriodId, deptFilter, auditFilter]);

  const loadPeriods = async () => {
    try {
      const res = await api.getPayrollPeriods();
      setPeriods(res.periods);
      if (res.periods.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(res.periods[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPeriodItems = async (pId: string) => {
    try {
      setLoading(true);
      const res = await api.getPeriodDetail(pId, deptFilter, auditFilter);
      setPeriodDetail(res.period);
      setItems(res.items);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      setCalculating(true);
      await api.calculatePayroll(selectedPeriodId);
      await loadPeriodItems(selectedPeriodId);
      await loadPeriods();
    } catch (err: any) {
      alert(err.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (summary?.flagged_count > 0) {
      const proceed = confirm(
        `WARNING: There are still ${summary.flagged_count} flagged payroll discrepancies in this run!\n\nAre you sure you want to approve and finalize processing?`
      );
      if (!proceed) return;
    } else {
      if (!confirm(`Confirm salary disbursement processing for ${periodDetail?.name}? This will lock the ledger.`)) {
        return;
      }
    }

    try {
      setProcessing(true);
      await api.processPayroll(selectedPeriodId);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      await loadPeriodItems(selectedPeriodId);
      await loadPeriods();
    } catch (err: any) {
      alert(err.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (item: PayrollItem) => {
    setEditingItem(item);
    setEditForm({
      bonus_or_variable: item.bonus_or_variable,
      unpaid_leave_days: item.unpaid_leave_days,
      other_deductions: item.other_deductions,
      notes: item.notes || ''
    });
  };

  const handleSaveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setSavingItem(true);
      await api.updatePayrollItem(editingItem.id, editForm);
      setEditingItem(null);
      await loadPeriodItems(selectedPeriodId);
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setSavingItem(false);
    }
  };

  const workflowSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'calculated', label: 'Calculated' },
    { key: 'audited', label: 'Audited' },
    { key: 'approved', label: 'Approved' },
    { key: 'processed', label: 'Processed' }
  ];

  const getStepIndex = (status?: string) => {
    switch (status) {
      case 'draft': return 0;
      case 'calculated': return 1;
      case 'audited': return 2;
      case 'approved': return 3;
      case 'processed': return 4;
      default: return 1;
    }
  };

  const currentStepIdx = getStepIndex(periodDetail?.status);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              Payroll Processing
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {periodDetail?.name || 'October 2026'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculate gross salaries, compute statutory deductions, and execute pre-disbursement checks.
          </p>
        </div>

        {/* Period Selector & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={handleCalculatePayroll}
            disabled={calculating || periodDetail?.status === 'processed'}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${calculating ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>

          <button
            onClick={() => onNavigateTab('auditor')}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
            <span>Review AI Audit</span>
          </button>

          <button
            onClick={handleProcessPayroll}
            disabled={processing || periodDetail?.status === 'processed'}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            {periodDetail?.status === 'processed' ? (
              <>
                <Lock className="w-3.5 h-3.5 text-indigo-200" />
                <span>Locked & Disbursed</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Process</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern Standard Enterprise Stepper */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {workflowSteps.map((ws, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={ws.key} className="flex items-center flex-1 last:flex-initial">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCompleted
                        ? 'bg-indigo-600 text-white'
                        : isCurrent
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'text-slate-900 font-semibold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {ws.label}
                  </span>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-3 transition-colors ${
                      idx < currentStepIdx ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Gross Earnings</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatINR(summary?.total_gross || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Deductions</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            -{formatINR(summary?.total_deductions || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Net Take-Home</span>
          <p className="text-xl font-bold text-indigo-700 mt-1 font-mono">
            {formatINR(summary?.total_net || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Employer Cost</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {formatINR(summary?.total_employer_cost || 0)}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          (summary?.flagged_count || 0) > 0 ? 'bg-red-50/40 border-red-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Audit Status</span>
          <div className="flex items-center gap-1.5 mt-1">
            {(summary?.flagged_count || 0) > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-sm font-semibold text-red-700">{summary?.flagged_count} Flagged</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-semibold text-slate-800">All Verified</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Discrepancy Notification Banner */}
      {(summary?.flagged_count || 0) > 0 && (
        <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-amber-900">
              <strong>{summary.flagged_count} line items</strong> require audit review before payout finalization.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('auditor')}
            className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
          >
            Review AI Audit findings &rarr;
          </button>
        </div>
      )}

      {/* Payroll Items Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Filter:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-800"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Design">Design</option>
              <option value="Human Resources">Human Resources</option>
            </select>

            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-800"
            >
              <option value="all">All Audit Statuses</option>
              <option value="flagged">Flagged Only</option>
              <option value="clean">Clean Only</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <a
            href={api.getExportCsvUrl(selectedPeriodId)}
            download
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Gross Earnings</th>
                <th className="py-2.5 px-4">PF (Emp)</th>
                <th className="py-2.5 px-4">Prof Tax</th>
                <th className="py-2.5 px-4">TDS (Tax)</th>
                <th className="py-2.5 px-4">LOP Deduction</th>
                <th className="py-2.5 px-4">Total Deductions</th>
                <th className="py-2.5 px-4">Net Salary</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    item.audit_status === 'flagged' ? 'bg-red-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{item.employee_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{item.emp_code} &bull; {item.department}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {formatINR(item.gross_earnings)}
                    {item.bonus_or_variable > 0 && (
                      <span className="block text-[10px] text-indigo-600 font-normal">
                        +{formatINR(item.bonus_or_variable)} Bonus
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{formatINR(item.employee_pf)}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{formatINR(item.professional_tax)}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{formatINR(item.tds)}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {item.lop_deduction > 0 ? (
                      <span className="text-amber-700">
                        {formatINR(item.lop_deduction)} ({item.unpaid_leave_days}d)
                      </span>
                    ) : (
                      '₹0.00'
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    -{formatINR(item.total_deductions)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span className={item.net_salary < 0 ? 'text-red-600' : 'text-slate-900'}>
                      {formatINR(item.net_salary)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        item.audit_status === 'flagged'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : item.audit_status === 'resolved'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.audit_status === 'flagged' && <AlertTriangle className="w-3 h-3" />}
                      {item.audit_status === 'resolved' && <Check className="w-3 h-3" />}
                      {item.audit_status === 'clean' && <CheckCircle2 className="w-3 h-3" />}
                      {item.audit_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEditModal(item)}
                      className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline px-2 py-1"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adjust Line Item</h3>
                <p className="text-xs text-slate-500">{editingItem.employee_name} ({editingItem.emp_code})</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItemEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Bonus / Variable Incentive (₹)</label>
                <input
                  type="number"
                  value={editForm.bonus_or_variable}
                  onChange={(e) => setEditForm({ ...editForm, bonus_or_variable: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono"
                />
                <span className="text-[11px] text-slate-500">Adjust or clear duplicate bonus.</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Unpaid Leave Days (LOP)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={editForm.unpaid_leave_days}
                  onChange={(e) => setEditForm({ ...editForm, unpaid_leave_days: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono"
                />
                <span className="text-[11px] text-slate-500">Apply corresponding unpaid leave deduction.</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Other Deductions / Advance Recovery (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.other_deductions}
                  onChange={(e) => setEditForm({ ...editForm, other_deductions: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono"
                />
                <span className="text-[11px] text-slate-500">Cap loan or advance deduction to avoid negative net pay.</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Adjustment Note *</label>
                <input
                  type="text"
                  required
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="e.g. Corrected festival bonus duplicate / capped advance deduction"
                  className="w-full mt-1 p-2 rounded-md border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="cursor-pointer px-3.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="cursor-pointer px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {savingItem ? 'Saving...' : 'Recalculate & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
