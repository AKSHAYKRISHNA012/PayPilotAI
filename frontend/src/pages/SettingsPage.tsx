import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import {
  Settings, Building, Shield, RotateCcw,
  CheckCircle, Check, Info, Lock, Sparkles, Scale
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ConfirmModal } from '../components/ConfirmModal';
import { toast } from '../components/Toast';

interface SettingsPageProps {
  currentUser: User | null;
  onResetData: () => void;
  onOpenSubscription?: () => void;
  onOpenOnboarding?: () => void;
  onOpenLegal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onResetData,
  onOpenSubscription,
  onOpenOnboarding,
  onOpenLegal,
}) => {
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    name: 'BharatTech Innovations Pvt. Ltd.',
    pan: 'AABCB1234F',
    tan: 'BLRB12345C',
    epf_reg: 'KN/BNG/1234567/000',
    esic_reg: '53000123450000001',
    address: 'Koramangala 4th Block, Bengaluru, Karnataka 560034',
    working_days_per_month: 22,
    pf_capping_default: 'statutory_capped_1800',
    tax_regime_default: 'new'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    toast.success('Company registration details & statutory defaults saved.', 'Settings Updated');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleConfirmReset = async () => {
    setShowResetConfirm(false);
    setResetting(true);
    await onResetData();
    setResetting(false);
    toast.info('Demo database restored with 4 seeded anomalies for presentation.', 'Demo State Reset');
    confetti();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="pb-5 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
          Company Settings & Statutory Policies
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure corporate registration numbers, default provident fund caps, and demo environments.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 text-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-600" />
            <span>Corporate Entity Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="font-semibold text-slate-700">Company Name</label>
              <input
                type="text"
                value={companySettings.name}
                onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Registered Office Address</label>
              <input
                type="text"
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Corporate PAN</label>
              <input
                type="text"
                value={companySettings.pan}
                onChange={(e) => setCompanySettings({ ...companySettings, pan: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Tax Deduction Account Number (TAN)</label>
              <input
                type="text"
                value={companySettings.tan}
                onChange={(e) => setCompanySettings({ ...companySettings, tan: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">EPFO Establishment ID</label>
              <input
                type="text"
                value={companySettings.epf_reg}
                onChange={(e) => setCompanySettings({ ...companySettings, epf_reg: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">ESIC Registration Code</label>
              <input
                type="text"
                value={companySettings.esic_reg}
                onChange={(e) => setCompanySettings({ ...companySettings, esic_reg: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-600" />
            <span>Statutory Defaults & Calculations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="font-semibold text-slate-700">Default Working Days Per Month</label>
              <input
                type="number"
                value={companySettings.working_days_per_month}
                onChange={(e) => setCompanySettings({ ...companySettings, working_days_per_month: Number(e.target.value) })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Used for Loss of Pay (LOP) daily rate calculations.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Default Income Tax Regime</label>
              <select
                value={companySettings.tax_regime_default}
                onChange={(e) => setCompanySettings({ ...companySettings, tax_regime_default: e.target.value })}
                className="w-full mt-1 p-2 rounded-md border border-slate-300 bg-white"
              >
                <option value="new">New Tax Regime (Default u/s 115BAC)</option>
                <option value="old">Old Tax Regime (with 80C/80D deductions)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          {saved ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Company settings updated successfully
            </span>
          ) : (
            <span className="text-slate-500">Settings apply across all payroll calculation periods.</span>
          )}

          <button
            type="submit"
            className="cursor-pointer px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            Save Settings
          </button>
        </div>
      </form>

      {/* Commercial SaaS Subscription & Plan Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Active Subscription</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              PayPilot AI {currentUser?.company?.plan_tier ? currentUser.company.plan_tier.toUpperCase() : 'GROWTH'} Plan
            </h3>
            <p className="text-slate-500 mt-1">
              Statutory payroll engine, AI anomaly auditor, and bank export integrations enabled.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {currentUser?.company?.subscription_status || 'Active'}
            </span>
            {onOpenSubscription && (
              <button
                onClick={onOpenSubscription}
                className="cursor-pointer px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
              >
                Manage Plans / Upgrade
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Headcount Limit</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              6 / {currentUser?.company?.max_employees || 100} Employees
            </p>
            <span className="text-[11px] text-slate-500">Active payroll roster</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Engine Runs</span>
            <p className="text-lg font-bold text-indigo-600 mt-1">Unlimited</p>
            <span className="text-[11px] text-slate-500">Multi-rule anomaly detection</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Provider</span>
            <p className="text-lg font-bold text-slate-900 mt-1">Razorpay India</p>
            <span className="text-[11px] text-slate-500">HMAC-SHA256 verified</span>
          </div>
        </div>
      </div>

      {/* Demo Controls Reset Card */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Reset Demo Presentation State</h3>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Restores the sample database with the 4 intentional seeded anomalies (Rohan Verma bonus spike, Priya Sharma unbilled absence, Amit Patel negative net pay, Vikram Singh missing bank details).
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={resetting}
          className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-800"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-slate-500' : 'text-slate-500'}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo State'}</span>
        </button>
      </div>

      {/* Statutory Onboarding & Legal Center Quick Launch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {onOpenOnboarding && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Organization Setup Wizard</span>
              </h4>
              <p className="text-[11px] text-slate-500">Relaunch the 4-step statutory onboarding stepper.</p>
            </div>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              Launch Wizard
            </button>
          </div>
        )}

        {onOpenLegal && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Legal & Compliance Center</span>
              </h4>
              <p className="text-[11px] text-slate-400">DPDP Act 2023, Terms of Service, 99.9% SLA & VDP.</p>
            </div>
            <button
              type="button"
              onClick={onOpenLegal}
              className="cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              View Policies
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Demo Presentation State?"
        message="This will re-initialize the database with 4 seeded compliance anomalies (Rohan Verma bonus spike, Priya Sharma unbilled absence, Amit Patel negative net pay, Vikram Singh missing bank IFSC) for pitch demonstrations."
        confirmLabel="Reset Database"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
