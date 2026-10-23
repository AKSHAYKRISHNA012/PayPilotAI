import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { Employee, User } from '../types';
import {
  Search, Plus, X, ChevronRight, CheckCircle, AlertCircle
} from 'lucide-react';

interface EmployeesPageProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');

  // Selected Employee for 360 Drawer
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'salary' | 'attendance' | 'leaves' | 'payslips'>('profile');

  // New Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [newEmp, setNewEmp] = useState({
    emp_code: 'BTI-007',
    first_name: '',
    last_name: '',
    email: '',
    phone: '+91 9876543210',
    department: 'Engineering',
    designation: 'Frontend Engineer',
    basic: 35000,
    hra: 17500,
    special_allowance: 7500,
    ctc_annual: 800000,
    pan: 'ABCDE5678F',
    bank_name: 'HDFC Bank',
    bank_account: '50100987654321',
    ifsc: 'HDFC0001234',
    tax_regime: 'new',
    state: 'Karnataka'
  });

  const isEmployeeRole = currentUser?.role === 'employee';

  useEffect(() => {
    loadEmployees();
  }, [search, department, status, currentUser]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees(search, department, status);
      setEmployees(res.employees);
      if (isEmployeeRole && res.employees.length > 0 && !selectedEmpId) {
        handleViewDetails(res.employees[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      setSelectedEmpId(id);
      setDetailLoading(true);
      const res = await api.getEmployeeDetail(id);
      setDetailData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.first_name || !newEmp.last_name || !newEmp.email) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setFormSubmitting(true);
      await api.createEmployee(newEmp);
      setIsAddModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to create employee');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEmployeeRole ? 'My Profile' : 'Employees'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEmployeeRole
              ? 'Personal profile, statutory identifiers, and salary parameters'
              : 'Workforce records, bank information, and salary structures'}
          </p>
        </div>

        {!isEmployeeRole && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      {!isEmployeeRole && (
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-hidden focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-600"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Design">Design</option>
              <option value="Human Resources">Human Resources</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-indigo-600"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}

      {/* Clean Employee Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Employee</th>
                <th className="py-2.5 px-3.5">Department & Role</th>
                <th className="py-2.5 px-3.5">Monthly Gross</th>
                <th className="py-2.5 px-3.5">PAN & Bank Account</th>
                <th className="py-2.5 px-3.5">Tax Regime</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No employees matching search criteria
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5">
                      <p className="font-semibold text-slate-900">{emp.first_name} {emp.last_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{emp.emp_code} &bull; {emp.email}</p>
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-medium text-slate-800">{emp.designation}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-semibold text-slate-900">{formatINR(emp.monthly_gross || 0)}</p>
                      <p className="text-[10px] text-slate-400">CTC: {formatINR(emp.ctc_annual || 0)}/yr</p>
                    </td>
                    <td className="py-3 px-3.5 font-mono">
                      <p className="text-slate-700">{emp.pan || 'MISSING'}</p>
                      <p className="text-[11px] text-slate-400">
                        {emp.bank_account ? `A/c: ****${emp.bank_account.slice(-4)}` : <span className="text-red-600 font-medium">Missing Bank</span>}
                      </p>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {emp.tax_regime.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => handleViewDetails(emp.id)}
                        className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Degree Employee Detail Drawer */}
      {selectedEmpId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/30">
          <div className="bg-white w-full max-w-xl h-full shadow-lg flex flex-col border-l border-slate-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {detailData?.employee?.first_name} {detailData?.employee?.last_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {detailData?.employee?.emp_code} &bull; {detailData?.employee?.designation} &bull; {detailData?.employee?.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmpId(null)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-5 gap-5 text-xs font-medium text-slate-500 bg-slate-50">
              <button
                onClick={() => setActiveTab('profile')}
                className={`cursor-pointer py-2.5 border-b-2 transition-colors ${
                  activeTab === 'profile' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                Profile & KYC
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`cursor-pointer py-2.5 border-b-2 transition-colors ${
                  activeTab === 'salary' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                Compensation
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`cursor-pointer py-2.5 border-b-2 transition-colors ${
                  activeTab === 'attendance' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`cursor-pointer py-2.5 border-b-2 transition-colors ${
                  activeTab === 'leaves' ? 'border-slate-900 text-slate-900 font-semibold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                Leaves
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-400">Loading details...</div>
              ) : (
                <>
                  {activeTab === 'profile' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                          <p className="font-medium text-slate-800 mt-0.5">{detailData?.employee?.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Phone</span>
                          <p className="font-medium text-slate-800 mt-0.5">{detailData?.employee?.phone}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Joining Date</span>
                          <p className="font-medium text-slate-800 mt-0.5">{detailData?.employee?.joining_date}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
                          <p className="font-medium text-slate-800 mt-0.5">{detailData?.employee?.state}</p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-900 pt-2">Statutory Identifiers & Banking</h4>
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">PAN</span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5">{detailData?.employee?.pan || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Tax Regime</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{detailData?.employee?.tax_regime?.toUpperCase()} Regime</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Bank Name</span>
                          <p className="font-semibold text-slate-800 mt-0.5">{detailData?.employee?.bank_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Account Number</span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5">
                            {detailData?.employee?.bank_account || <span className="text-red-600">Missing</span>}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">IFSC Code</span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5">
                            {detailData?.employee?.ifsc || <span className="text-red-600">Missing</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'salary' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                        <span className="font-medium text-slate-600">Annual CTC Package:</span>
                        <span className="text-base font-bold text-slate-900">
                          {formatINR(detailData?.salary_structure?.ctc_annual || 0)}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Salary Component</th>
                              <th className="py-2 px-3 text-right">Monthly (INR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="py-2 px-3 text-slate-700">Basic Pay</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-900">{formatINR(detailData?.salary_structure?.basic || 0)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 text-slate-700">House Rent Allowance (HRA)</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-900">{formatINR(detailData?.salary_structure?.hra || 0)}</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 text-slate-700">Special Allowance</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-900">{formatINR(detailData?.salary_structure?.special_allowance || 0)}</td>
                            </tr>
                            <tr className="bg-slate-50 font-semibold">
                              <td className="py-2.5 px-3 text-slate-900">Total Monthly Gross</td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                                {formatINR(
                                  (detailData?.salary_structure?.basic || 0) +
                                  (detailData?.salary_structure?.hra || 0) +
                                  (detailData?.salary_structure?.special_allowance || 0)
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'attendance' && (
                    <div className="space-y-3">
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Timestamps</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detailData?.recent_attendance?.map((att: any, i: number) => (
                              <tr key={i}>
                                <td className="py-2 px-3 font-mono">{att.date}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                    att.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                                    att.status === 'absent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {att.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500">{att.check_in || '-'} &bull; {att.check_out || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === 'leaves' && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Casual Leave</span>
                        <p className="text-base font-bold text-slate-900 mt-1">{detailData?.leave_balance?.casual_remaining} Days</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sick Leave</span>
                        <p className="text-base font-bold text-slate-900 mt-1">{detailData?.leave_balance?.sick_remaining} Days</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Earned Leave</span>
                        <p className="text-base font-bold text-slate-900 mt-1">{detailData?.leave_balance?.earned_remaining} Days</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmp.first_name}
                    onChange={(e) => setNewEmp({ ...newEmp, first_name: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmp.last_name}
                    onChange={(e) => setNewEmp({ ...newEmp, last_name: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Employee Code</label>
                  <input
                    type="text"
                    value={newEmp.emp_code}
                    onChange={(e) => setNewEmp({ ...newEmp, emp_code: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Design">Design</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700">Basic (₹)</label>
                  <input
                    type="number"
                    value={newEmp.basic}
                    onChange={(e) => setNewEmp({ ...newEmp, basic: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">HRA (₹)</label>
                  <input
                    type="number"
                    value={newEmp.hra}
                    onChange={(e) => setNewEmp({ ...newEmp, hra: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Special Allow. (₹)</label>
                  <input
                    type="number"
                    value={newEmp.special_allowance}
                    onChange={(e) => setNewEmp({ ...newEmp, special_allowance: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">PAN Number</label>
                  <input
                    type="text"
                    value={newEmp.pan}
                    onChange={(e) => setNewEmp({ ...newEmp, pan: e.target.value.toUpperCase() })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Bank Account Number</label>
                  <input
                    type="text"
                    value={newEmp.bank_account}
                    onChange={(e) => setNewEmp({ ...newEmp, bank_account: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cursor-pointer px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="cursor-pointer px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  {formSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
