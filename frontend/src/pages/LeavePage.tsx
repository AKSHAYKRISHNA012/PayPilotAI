import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LeaveBalance, LeaveRequest, User } from '../types';
import { Plus, Check, X } from 'lucide-react';
import { toast } from '../components/Toast';

interface LeavePageProps {
  currentUser: User | null;
}

export const LeavePage: React.FC<LeavePageProps> = ({ currentUser }) => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Leave Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days_count: 1,
    reason: 'Personal urgent work'
  });

  const isEmployee = currentUser?.role === 'employee';

  useEffect(() => {
    loadLeaveData();
  }, [currentUser]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const [bRes, rRes] = await Promise.all([
        api.getLeaveBalances(),
        api.getLeaveRequests()
      ]);
      setBalances(bRes.balances);
      setRequests(rRes.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setApplying(true);
      await api.applyLeave(newLeave);
      setIsApplyModalOpen(false);
      loadLeaveData();
      toast.success(`Leave application submitted for ${newLeave.days_count} day(s).`, 'Leave Submitted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave', 'Leave Error');
    } finally {
      setApplying(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.reviewLeave(id, status, status === 'approved' ? 'Approved by Manager' : 'Rejected');
      loadLeaveData();
      toast.success(`Leave request ${status} successfully.`, `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to review leave request', 'Review Error');
    }
  };

  const myBalance = balances[0];

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Leave Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual leave quotas, pending approvals, and loss-of-pay coordination
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Quota Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Available Total</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {myBalance ? myBalance.total_remaining : 22} <span className="text-xs font-normal text-slate-400">Days</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">CY 2026 Quota</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Casual Leave (CL)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {myBalance ? myBalance.casual_remaining : 10} <span className="text-xs font-normal text-slate-400">Days</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Used: {myBalance ? myBalance.casual_used : 2} of {myBalance ? myBalance.casual_total : 12}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Sick Leave (SL)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {myBalance ? myBalance.sick_remaining : 9} <span className="text-xs font-normal text-slate-400">Days</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Used: {myBalance ? myBalance.sick_used : 1} of {myBalance ? myBalance.sick_total : 10}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">Earned Leave (EL)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {myBalance ? myBalance.earned_remaining : 12} <span className="text-xs font-normal text-slate-400">Days</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Used: {myBalance ? myBalance.earned_used : 3} of {myBalance ? myBalance.earned_total : 15}
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <h3 className="font-semibold text-slate-900">
            {isEmployee ? 'My Leave Applications' : 'Employee Leave Requests'}
          </h3>
          <span className="text-slate-400">
            {requests.filter(r => r.status === 'pending').length} Pending Review
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Employee</th>
                <th className="py-2.5 px-3.5">Leave Type</th>
                <th className="py-2.5 px-3.5">Duration</th>
                <th className="py-2.5 px-3.5">Days</th>
                <th className="py-2.5 px-3.5">Reason</th>
                <th className="py-2.5 px-3.5">Status</th>
                {!isEmployee && <th className="py-2.5 px-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <p className="font-semibold text-slate-900">{r.employee_name}</p>
                    <p className="text-[11px] text-slate-400">{r.emp_code} &bull; {r.department}</p>
                  </td>
                  <td className="py-2.5 px-3.5 capitalize font-medium text-slate-700">
                    {r.leave_type} Leave
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-600">
                    {r.start_date} to {r.end_date}
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">{r.days_count}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">{r.reason}</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      r.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  {!isEmployee && (
                    <td className="py-2.5 px-3.5 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReview(r.id, 'approved')}
                            className="cursor-pointer px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(r.id, 'rejected')}
                            className="cursor-pointer px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {r.reviewed_by || 'HR'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Leave Type</label>
                <select
                  value={newLeave.leave_type}
                  onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-slate-200 bg-white"
                >
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="sick">Sick Leave (SL)</option>
                  <option value="earned">Earned Leave (EL)</option>
                  <option value="unpaid_lop">Unpaid Leave (Loss of Pay)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.start_date}
                    onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.end_date}
                    onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Working Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={newLeave.days_count}
                  onChange={(e) => setNewLeave({ ...newLeave, days_count: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded border border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reason</label>
                <textarea
                  required
                  rows={2}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-slate-200"
                  placeholder="Concise justification"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="cursor-pointer px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="cursor-pointer px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  {applying ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
