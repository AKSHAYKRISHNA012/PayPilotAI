import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AttendanceRecord, User } from '../types';
import { Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface AttendancePageProps {
  currentUser: User | null;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markData, setMarkData] = useState({
    employee_id: 'emp_002',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in: '09:15 AM',
    check_out: '06:30 PM',
    notes: 'Regular check-in'
  });

  const isEmployee = currentUser?.role === 'employee';

  useEffect(() => {
    loadAttendance();
  }, [currentUser]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendance(10, 2026);
      setRecords(res.records);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.markAttendance(markData);
      setIsMarkModalOpen(false);
      loadAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to record attendance');
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily logs, work hours, and Loss of Pay (LOP) integration
          </p>
        </div>

        {!isEmployee && (
          <button
            onClick={() => setIsMarkModalOpen(true)}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
        )}
      </div>

      {/* Clock-In Banner (Clean, understated bar) */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold text-slate-900">
              Web & Biometric Terminal &bull; <span className="font-normal text-slate-500">Koramangala Office (Verified)</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Session: {currentUser?.full_name} &bull; Expected Shift: 09:30 AM to 06:30 PM IST
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            await api.markAttendance({
              employee_id: currentUser?.employee_id || 'emp_003',
              date: new Date().toISOString().split('T')[0],
              status: 'present',
              check_in: now,
              check_out: '06:30 PM',
              notes: 'Self-punched'
            });
            alert(`Recorded check-in timestamp: ${now}`);
            loadAttendance();
          }}
          className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          Punch Attendance
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Total Log Entries</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{summary?.total_records || records.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Present</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{summary?.present_count || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Unapproved Absences</span>
          <p className="text-xl font-bold text-red-600 mt-1">{summary?.absent_count || 0}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Half Day / Leaves</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{(summary?.half_day_count || 0) + (summary?.approved_leave_count || 0)}</p>
        </div>
      </div>

      {/* Clean Attendance Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Status Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2 py-1 rounded border border-slate-200 bg-white"
            >
              <option value="all">All Records</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="approved_leave">Approved Leave</option>
            </select>
          </div>
          <span className="text-[11px] text-slate-400">{filteredRecords.length} records shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Employee</th>
                <th className="py-2.5 px-3.5">Department</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Check-In</th>
                <th className="py-2.5 px-3.5">Check-Out</th>
                <th className="py-2.5 px-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">{r.date}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">{r.employee_name}</td>
                  <td className="py-2.5 px-3.5 text-slate-500">{r.department}</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      r.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                      r.status === 'absent' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 font-mono">{r.check_in || '-'}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 font-mono">{r.check_out || '-'}</td>
                  <td className="py-2.5 px-3.5 text-slate-500">
                    {r.status === 'absent' ? (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Unapproved (Pending LOP)
                      </span>
                    ) : (
                      r.notes || 'Normal'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {isMarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Attendance</h3>
              <button onClick={() => setIsMarkModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleMarkAttendance} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee</label>
                <select
                  value={markData.employee_id}
                  onChange={(e) => setMarkData({ ...markData, employee_id: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="emp_002">Priya Sharma (BTI-002)</option>
                  <option value="emp_003">Rohan Verma (BTI-003)</option>
                  <option value="emp_001">Sneha Rao (BTI-001)</option>
                  <option value="emp_004">Vikram Singh (BTI-004)</option>
                  <option value="emp_005">Amit Patel (BTI-005)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  value={markData.date}
                  onChange={(e) => setMarkData({ ...markData, date: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  value={markData.status}
                  onChange={(e) => setMarkData({ ...markData, status: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent (Loss of Pay)</option>
                  <option value="half_day">Half Day</option>
                  <option value="approved_leave">Approved Leave</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMarkModalOpen(false)}
                  className="cursor-pointer px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
