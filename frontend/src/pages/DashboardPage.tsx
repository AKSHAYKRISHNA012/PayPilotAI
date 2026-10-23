import React, { useEffect, useState } from 'react';
import { api, formatINR } from '../services/api';
import { User } from '../types';
import {
  Users, CalendarCheck, Clock, ShieldAlert,
  ArrowRight, AlertCircle, CheckCircle, FileText,
  Calendar, CreditCard, ChevronRight, Calculator
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

interface DashboardPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
  onTriggerAudit: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigateTab,
  onTriggerAudit,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isEmployee = currentUser?.role === 'employee';

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sData, cData, aData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardCharts(),
        api.getRecentActivity(),
      ]);
      setStats(sData);
      setCharts(cData);
      setActivities(aData.activities || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // EMPLOYEE PERSONAL DASHBOARD VIEW (Clean, minimalist Gusto-style)
  if (isEmployee) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Simple Welcome Bar */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome back, {currentUser?.full_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Employee Portal &bull; {currentUser?.department || 'Engineering'} &bull; {currentUser?.designation}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('assistant')}
              className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Ask AI Assistant
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              View Latest Payslip
            </button>
          </div>
        </div>

        {/* Compact Employee KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Estimated Net Pay (Oct 2026)</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">₹1,18,650.00</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Disbursement: Oct 31, 2026</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Available Leave Quota</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">22.0 Days</p>
            <p className="text-[11px] text-slate-400 mt-0.5">10 Casual &bull; 9 Sick &bull; 3 Earned</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Monthly Attendance</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">100%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">18 Present &bull; 0 Absent</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Tax Regime Active</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">New Regime</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Standard Deduction ₹75k Applied</p>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('leave')}
              className="cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900">Apply for Time Off</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Request casual, sick, or earned leave</p>
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900">Download Tax Slip</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified Indian Form 16 / Payslip</p>
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50 text-left transition-colors"
            >
              <p className="text-xs font-semibold text-slate-900">Punch Attendance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Log daily in/out timestamp</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD ENTERPRISE HCM DASHBOARD (HR/Admin & Payroll Admin)
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Payroll & HR Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Payroll Period: <span className="font-semibold text-slate-800">{stats?.current_payroll_period || 'October 2026'}</span> &bull; Status: <span className="font-semibold uppercase text-indigo-700">{stats?.current_payroll_status || 'Calculated'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('auditor')}
            className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Audit Payroll
          </button>
          <button
            onClick={() => onNavigateTab('payroll')}
            className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Process Payroll
          </button>
        </div>
      </div>

      {/* Clean Payroll Alert Banner (Subtle amber/red alert banner) */}
      {stats?.discrepancies_count > 0 && (
        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {stats.discrepancies_count} payroll discrepancies require review prior to final disbursement
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                The AI Auditor detected salary changes &gt;30%, unbilled absences, and negative net salary calculations.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('auditor')}
            className="cursor-pointer shrink-0 px-3 py-1 rounded text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 transition-colors"
          >
            Review Discrepancies &rarr;
          </button>
        </div>
      )}

      {/* Compact KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Employees</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats?.total_employees || 6}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">100% Active</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Present Today</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats?.present_today || 6}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{stats?.attendance_pct || 100}% on duty</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Pending Approvals</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats?.pending_leaves || 1}</p>
          <button
            onClick={() => onNavigateTab('leave')}
            className="cursor-pointer text-[10px] font-semibold text-indigo-600 hover:underline mt-0.5 block"
          >
            Review Requests &rarr;
          </button>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Current Payroll</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(stats?.current_payroll_amount || 590800)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total Employer Cost</p>
        </div>

        <div className={`p-3.5 rounded-lg border ${
          (stats?.discrepancies_count || 0) > 0 ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] font-medium text-slate-500">Audit Status</span>
          <p className={`text-xl font-bold mt-1 ${
            (stats?.discrepancies_count || 0) > 0 ? 'text-red-700' : 'text-slate-900'
          }`}>
            {stats?.discrepancies_count > 0 ? `${stats.discrepancies_count} Open` : 'Clean'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Disbursement: {stats?.upcoming_payroll_date || 'Oct 31'}</p>
        </div>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Payroll Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payroll Trend (INR)</h3>
              <p className="text-[11px] text-slate-400">Employer Cost vs Net Disbursed Salary</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900" /> Employer Cost
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" /> Net Disbursed
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '6px', fontSize: '11px', border: 'none' }}
                />
                <Area type="monotone" dataKey="payroll_cost" stroke="#0F172A" strokeWidth={2} fill="#F1F5F9" />
                <Area type="monotone" dataKey="net_disbursed" stroke="#4338CA" strokeWidth={2} fill="#EEF2FF" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Breakdown Donut */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Attendance Breakdown</h3>
            <p className="text-[11px] text-slate-400">Monthly working days ratio</p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.attendance_breakdown || []}
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts?.attendance_breakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0F172A' : index === 1 ? '#4338CA' : index === 2 ? '#D97706' : '#DC2626'} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100">
            {(charts?.attendance_breakdown || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: idx === 0 ? '#0F172A' : idx === 1 ? '#4338CA' : idx === 2 ? '#D97706' : '#DC2626' }} />
                <span className="text-slate-600 truncate">{item.name}: <strong>{item.value}%</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity & Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Payroll Activity</h3>
            <span className="text-[10px] text-slate-400">Audit Trail</span>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.slice(0, 4).map((act, i) => (
              <div key={i} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div>
                  <p className="text-slate-800 font-medium">{act.details}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                </div>
                <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">
                  {act.entity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Key Modules</h3>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('employees')}
              className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900">Employee Master</p>
                <p className="text-[11px] text-slate-500">6 active employee profiles</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('leave')}
              className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900">Leave Approvals</p>
                <p className="text-[11px] text-slate-500">1 request pending review</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigateTab('auditor')}
              className="cursor-pointer w-full p-2.5 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900">Pre-Disbursement Audit</p>
                <p className="text-[11px] text-slate-500">Automated statutory check</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
