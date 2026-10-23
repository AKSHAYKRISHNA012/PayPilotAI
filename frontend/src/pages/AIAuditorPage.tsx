import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { AuditFinding, User } from '../types';
import {
  ShieldAlert, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Check, Eye,
  HelpCircle, ChevronRight, X, Filter, FileText, CheckCircle, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIAuditorPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
}

export const AIAuditorPage: React.FC<AIAuditorPageProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected finding modal
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadFindings();
  }, [severityFilter, categoryFilter, statusFilter]);

  const loadFindings = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditFindings(
        'period_oct_2026',
        severityFilter,
        categoryFilter,
        statusFilter
      );
      setFindings(res.findings);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    try {
      setScanning(true);
      await new Promise((r) => setTimeout(r, 800));
      await api.runPayrollAudit('period_oct_2026');
      await loadFindings();
    } catch (err: any) {
      alert(err.message || 'Audit execution failed');
    } finally {
      setScanning(false);
    }
  };

  const handleResolveFinding = async (newStatus: string) => {
    if (!selectedFinding) return;
    try {
      setResolving(true);
      await api.resolveAuditFinding(
        selectedFinding.id,
        newStatus,
        resolutionNote || `Marked ${newStatus} by ${currentUser?.full_name}`
      );
      if (newStatus === 'Resolved') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
      setSelectedFinding(null);
      setResolutionNote('');
      await loadFindings();
    } catch (err: any) {
      alert(err.message || 'Failed to update finding status');
    } finally {
      setResolving(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <HelpCircle className="w-3 h-3" /> MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
            LOW
          </span>
        );
    }
  };

  const getStatutoryCitation = (category: string, title: string) => {
    if (category === 'Negative Net Pay' || title.toLowerCase().includes('deduction')) {
      return {
        code: 'Sec 7, Payment of Wages Act, 1936',
        desc: 'Statutory cap: Total deductions cannot exceed 50% of gross wages in any wage period.'
      };
    }
    if (category === 'Salary Spike' || title.toLowerCase().includes('bonus')) {
      return {
        code: 'Payment of Bonus Act, 1965 & Income Tax Sec 192',
        desc: 'Requires verified board resolution / manager signoff for variance exceeding 30% baseline.'
      };
    }
    if (category === 'Attendance Mismatch' || title.toLowerCase().includes('lop')) {
      return {
        code: 'Factories Act 1948, Chapter VIII & Standing Orders',
        desc: 'Unpaid Leave (LOP) requires daily biometric timecard reconciliation against approved leaves.'
      };
    }
    return {
      code: 'RBI Master Directions & NACH Clearing Rules (2021)',
      desc: 'Direct wage credit mandates verified 11-character IFSC and active bank branch code.'
    };
  };

  // Pre-flight compliance pillars
  const pillars = [
    {
      id: 'statutory',
      title: 'Statutory Limits (Sec 7 Cap)',
      status: findings.some(f => f.category === 'Negative Net Pay' && f.status === 'Open') ? 'flagged' : 'passed',
      desc: 'Max 50% deduction cap per Payment of Wages Act',
      rule: 'Section 7(3)'
    },
    {
      id: 'attendance',
      title: 'Attendance & LOP Reconciliation',
      status: findings.some(f => f.category === 'Attendance Mismatch' && f.status === 'Open') ? 'warning' : 'passed',
      desc: 'Biometric punches vs approved leave ledger',
      rule: 'Factories Act Ch. VIII'
    },
    {
      id: 'spike',
      title: 'Variance & Gross Compensation',
      status: findings.some(f => f.category === 'Salary Spike' && f.status === 'Open') ? 'flagged' : 'passed',
      desc: 'Flagging anomalies >30% over 3-month median',
      rule: 'Payment of Bonus Act'
    },
    {
      id: 'banking',
      title: 'NACH Banking & KYC Integrity',
      status: findings.some(f => f.category === 'Missing Statutory Information' && f.status === 'Open') ? 'warning' : 'passed',
      desc: 'Direct wage credit IFSC and account validation',
      rule: 'RBI NACH Mandate'
    }
  ];

  const handleApplySuggestedRemediation = () => {
    if (!selectedFinding) return;
    const citation = getStatutoryCitation(selectedFinding.category, selectedFinding.title);
    setResolutionNote(
      `[Statutory Compliance Resolution - ${citation.code}]\nRemediation Applied: ${selectedFinding.recommended_action}.\nValidated by HR Admin ${currentUser?.full_name || 'System Admin'}. Safe for pre-disbursement clearance.`
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Clean Enterprise Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              AI Payroll Auditor
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Pre-Disbursement Validation Gate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Autonomous multi-rule engine that enforces statutory limits, detects compensation spikes, and reconciles attendance records before fund disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('payroll')}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Go to Payroll</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={handleRunAudit}
            disabled={scanning}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Auditing Payroll...' : 'Re-Run Audit Engine'}</span>
          </button>
        </div>
      </div>

      {/* 4-Pillar Pre-Flight Gate */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            4-Pillar Pre-Flight Compliance Verification (Oct 2026 Run)
          </span>
          <span className="text-slate-500">
            {summary?.critical === 0 ? (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Pillars Unblocked & Ready for Payout
              </span>
            ) : (
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {summary?.critical} Blocker(s) Restricting Payroll Finalization
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pillars.map((pil) => (
            <div
              key={pil.id}
              className={`p-3.5 rounded-lg border transition-all ${
                pil.status === 'passed'
                  ? 'bg-white border-slate-200'
                  : pil.status === 'warning'
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-red-50/30 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{pil.rule}</span>
                {pil.status === 'passed' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> PASS
                  </span>
                ) : pil.status === 'warning' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> WARN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-red-600" /> BLOCKED
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-2">{pil.title}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{pil.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Discrepancies</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {summary?.total_open || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Requiring review</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50/20">
          <span className="text-[11px] font-medium text-red-600 uppercase tracking-wider">Critical Severity</span>
          <p className="text-2xl font-bold text-red-700 mt-1 font-mono">
            {summary?.critical || 0}
          </p>
          <p className="text-[11px] text-red-600 mt-0.5">Blocks payout</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-amber-200 bg-amber-50/20">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">High Variance</span>
          <p className="text-2xl font-bold text-amber-800 mt-1 font-mono">
            {summary?.high || 0}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">&gt;30% spike or LOP gap</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50/20">
          <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">Medium / KYC</span>
          <p className="text-2xl font-bold text-blue-800 mt-1 font-mono">
            {summary?.medium || 0}
          </p>
          <p className="text-[11px] text-blue-600 mt-0.5">Missing bank IFSC</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Resolved</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {summary?.resolved || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Cleared & verified</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/40">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-700">Filter:</span>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-800"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-800"
          >
            <option value="all">All Categories</option>
            <option value="Salary Spike">Salary Spike</option>
            <option value="Attendance Mismatch">Attendance Mismatch</option>
            <option value="Negative Net Pay">Negative Net Pay</option>
            <option value="Missing Statutory Information">Missing KYC / Bank</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="Accepted">Accepted</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {findings.length} findings
        </span>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {findings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2.5" />
            <h3 className="text-base font-bold text-slate-900">Zero Payroll Discrepancies</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All payroll line items match statutory rules, approved attendance logs, and verified banking data.
            </p>
          </div>
        ) : (
          findings.map((f) => {
            const citation = getStatutoryCitation(f.category, f.title);
            return (
              <div
                key={f.id}
                className={`p-5 rounded-lg border transition-colors ${
                  f.status === 'Resolved' || f.status === 'Accepted'
                    ? 'bg-slate-50/70 border-slate-200 opacity-75'
                    : f.severity === 'CRITICAL'
                    ? 'bg-red-50/20 border-red-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getSeverityBadge(f.severity)}
                      <span className="text-xs font-semibold text-slate-600">{f.category}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs font-bold text-slate-900">{f.employee_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({f.emp_code})</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        f.status === 'Open' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        f.status === 'Resolved' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {f.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 font-sans">
                        {f.title}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {citation.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {f.description}
                    </p>

                    {/* Expected vs Observed Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-2xl">
                      <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Expected Value:</span>
                        <span className="font-semibold text-slate-900 font-mono">{f.expected_value}</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Observed Anomaly:</span>
                        <span className="font-semibold text-red-600 font-mono">{f.observed_value}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedFinding(f);
                        setResolutionNote(f.resolution_note || '');
                      }}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect & Resolve</span>
                    </button>

                    <button
                      onClick={() => onNavigateTab('payroll')}
                      className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      Adjust in Payroll &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect & Resolve Finding Modal */}
      {selectedFinding && (() => {
        const modalCitation = getStatutoryCitation(selectedFinding.category, selectedFinding.title);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityBadge(selectedFinding.severity)}
                    <span className="text-xs text-slate-500">{selectedFinding.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{selectedFinding.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-500">Employee Details</label>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedFinding.employee_name} ({selectedFinding.emp_code}) &bull; {selectedFinding.department}
                  </p>
                </div>

                {/* Statutory Basis Citation Banner */}
                <div className="p-3 rounded-md bg-slate-900 text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
                      Statutory Rule Citation
                    </span>
                    <span className="text-[10px] text-slate-400">Auditable Standard</span>
                  </div>
                  <p className="font-semibold text-xs text-white">{modalCitation.code}</p>
                  <p className="text-[11px] text-slate-300">{modalCitation.desc}</p>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-500">Issue Explanation</label>
                  <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                    {selectedFinding.description}
                  </p>
                </div>

                {/* Before and After Comparison */}
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-slate-900">Numerical Discrepancy Breakdown</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Authoritative Expected:</span>
                      <p className="font-semibold text-slate-900 font-mono mt-0.5">{selectedFinding.expected_value}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-red-600 uppercase">Detected Anomaly:</span>
                      <p className="font-semibold text-red-700 font-mono mt-0.5">{selectedFinding.observed_value}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-indigo-50/60 border border-indigo-200 text-indigo-950 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold block mb-0.5">Recommended Remediation:</span>
                    <span>{selectedFinding.recommended_action}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplySuggestedRemediation}
                    className="cursor-pointer shrink-0 text-[10px] font-semibold px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Auto-Fill Note
                  </button>
                </div>

                {/* Resolution Note Input */}
                <div>
                  <label className="font-semibold text-slate-700">Audit Resolution Notes *</label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="e.g. Adjusted deductions to comply with Section 7 cap; balance deferred to November 2026 cycle."
                    className="w-full mt-1.5 p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    All resolution notes are cryptographically signed with the HR admin ID and archived into the permanent payroll audit log.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleResolveFinding('Investigating')}
                  className="cursor-pointer text-xs font-semibold px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Mark as Investigating
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveFinding('Accepted')}
                    disabled={resolving}
                    className="cursor-pointer px-3.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 hover:bg-slate-100 text-slate-800"
                  >
                    Accept Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveFinding('Resolved')}
                    disabled={resolving}
                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{resolving ? 'Resolving...' : 'Confirm Resolved'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
