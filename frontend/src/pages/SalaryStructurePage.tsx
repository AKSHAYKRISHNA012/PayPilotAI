import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import { SalaryStructure, User } from '../types';
import { Edit3 } from 'lucide-react';
import { toast } from '../components/Toast';

interface SalaryStructurePageProps {
  currentUser: User | null;
}

export const SalaryStructurePage: React.FC<SalaryStructurePageProps> = ({ currentUser }) => {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [saving, setSaving] = useState(false);

  const isEmployee = currentUser?.role === 'employee';

  useEffect(() => {
    loadStructures();
  }, [currentUser]);

  const loadStructures = async () => {
    try {
      setLoading(true);
      const res = await api.getSalaryStructures();
      setStructures(res.structures);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStructure) return;
    try {
      setSaving(true);
      await api.updateSalaryStructure(editingStructure.employee_id, editingStructure);
      setEditingStructure(null);
      loadStructures();
      toast.success('Salary breakdown & statutory caps updated.', 'Structure Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update salary structure', 'Update Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {isEmployee ? 'My Compensation' : 'Salary Structures'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Indian statutory configuration: Basic pay, HRA, Provident Fund caps, and state Professional Tax
        </p>
      </div>

      {/* Statutory Guidance Cards (Clean, standard grey cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-lg bg-white border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900">Employees' Provident Fund (EPF)</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Statutory cap: 12% on Basic up to ₹15,000 wage ceiling (₹1,800/mo) or uncapped actual 12%.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900">Employees' State Insurance (ESIC)</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Statutory threshold: 0.75% employee & 3.25% employer applicable only if monthly gross &le; ₹21,000.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200">
          <h4 className="text-xs font-bold text-slate-900">Professional Tax (PT)</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            State slabs: Karnataka ₹200 for gross &gt; ₹15,000; Maharashtra ₹200 for gross &gt; ₹10,000; Delhi nil.
          </p>
        </div>
      </div>

      {/* Structures Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Employee</th>
                <th className="py-2.5 px-3.5">Annual CTC</th>
                <th className="py-2.5 px-3.5">Basic</th>
                <th className="py-2.5 px-3.5">HRA</th>
                <th className="py-2.5 px-3.5">Special Allowance</th>
                <th className="py-2.5 px-3.5">Monthly Gross</th>
                <th className="py-2.5 px-3.5">PF Rule</th>
                <th className="py-2.5 px-3.5">PT State</th>
                {!isEmployee && <th className="py-2.5 px-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {structures.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5">
                    <p className="font-semibold text-slate-900">{s.employee_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{s.emp_code} &bull; {s.department}</p>
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">{formatINR(s.ctc_annual)}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">{formatINR(s.basic)}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">{formatINR(s.hra)}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-700">{formatINR(s.special_allowance)}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">{formatINR(s.monthly_gross || 0)}</td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      {s.pf_type === 'statutory_capped_1800' ? '₹1,800 Cap' : 'Uncapped 12%'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-700">{s.pt_state}</td>
                  {!isEmployee && (
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={() => setEditingStructure(s)}
                        className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Structure Modal */}
      {editingStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Configure Salary Structure</h3>
                <p className="text-xs text-slate-500">{editingStructure.employee_name} ({editingStructure.emp_code})</p>
              </div>
              <button onClick={() => setEditingStructure(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Annual CTC (INR)</label>
                <input
                  type="number"
                  value={editingStructure.ctc_annual}
                  onChange={(e) => setEditingStructure({ ...editingStructure, ctc_annual: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700">Basic (₹)</label>
                  <input
                    type="number"
                    value={editingStructure.basic}
                    onChange={(e) => setEditingStructure({ ...editingStructure, basic: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">HRA (₹)</label>
                  <input
                    type="number"
                    value={editingStructure.hra}
                    onChange={(e) => setEditingStructure({ ...editingStructure, hra: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Special (₹)</label>
                  <input
                    type="number"
                    value={editingStructure.special_allowance}
                    onChange={(e) => setEditingStructure({ ...editingStructure, special_allowance: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center font-medium">
                <span className="text-slate-600">Monthly Gross Total:</span>
                <span className="font-bold text-slate-900">
                  {formatINR(editingStructure.basic + editingStructure.hra + editingStructure.special_allowance)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700">Provident Fund (PF)</label>
                  <select
                    value={editingStructure.pf_type}
                    onChange={(e: any) => setEditingStructure({ ...editingStructure, pf_type: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 bg-white"
                  >
                    <option value="statutory_capped_1800">Capped (₹1,800/mo)</option>
                    <option value="actual_basic">Uncapped (12% of Basic)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Professional Tax State</label>
                  <select
                    value={editingStructure.pt_state}
                    onChange={(e) => setEditingStructure({ ...editingStructure, pt_state: e.target.value })}
                    className="w-full mt-1 p-2 rounded border border-slate-200 bg-white"
                  >
                    <option value="Karnataka">Karnataka (₹200)</option>
                    <option value="Maharashtra">Maharashtra (₹200)</option>
                    <option value="Telangana">Telangana (₹200)</option>
                    <option value="Delhi">Delhi (Nil)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStructure(null)}
                  className="cursor-pointer px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
