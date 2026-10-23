import React, { useState } from 'react';
import {
  Building2, ShieldCheck, Calendar, Users, Check,
  ArrowRight, ArrowLeft, Sparkles, X, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    companyName: 'BharatTech Innovations Pvt. Ltd.',
    pan: 'AABCB1234F',
    tan: 'BLRB12345C',
    address: 'Koramangala, Bengaluru, Karnataka 560034',
    pfCapping: 'statutory_capped_1800',
    esicEnabled: true,
    ptState: 'Karnataka',
    taxRegime: 'new',
    payCycleDay: '30',
    workingDays: '22',
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onComplete();
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Wizard Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Organization Setup Wizard</h3>
              <p className="text-[11px] text-slate-400">Step {currentStep} of 4 • Configure your statutory payroll environment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Dots / Bar */}
        <div className="bg-slate-100 h-1.5 w-full">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 sm:p-8 space-y-5 text-xs text-slate-700 flex-1 overflow-y-auto max-h-[70vh]">
          {/* STEP 1: Corporate Entity */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Step 1: Corporate Registration & Tax IDs</h4>
              </div>
              <p className="text-slate-500 text-[11px]">
                These credentials populate your TDS reports, EPFO ECR exports, and employee payslip headers.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Corporate PAN (10 Alphanumeric)</label>
                    <input
                      type="text"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">TAN (Tax Deduction Acct)</label>
                    <input
                      type="text"
                      value={formData.tan}
                      onChange={(e) => setFormData({ ...formData, tan: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Registered Office Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Statutory Defaults */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Step 2: Statutory Compliance Rules</h4>
              </div>
              <p className="text-slate-500 text-[11px]">
                Define statutory defaults automatically applied when adding new employees.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Employees Provident Fund (EPF) Scheme</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      onClick={() => setFormData({ ...formData, pfCapping: 'statutory_capped_1800' })}
                      className={`cursor-pointer p-3 rounded-lg border flex flex-col justify-between ${
                        formData.pfCapping === 'statutory_capped_1800'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold">Statutory Cap (₹1,800/mo)</span>
                      <span className="text-[10px] text-slate-500 mt-1">12% on wage ceiling of ₹15,000 (standard for Indian private sector)</span>
                    </label>

                    <label
                      onClick={() => setFormData({ ...formData, pfCapping: 'actual_basic' })}
                      className={`cursor-pointer p-3 rounded-lg border flex flex-col justify-between ${
                        formData.pfCapping === 'actual_basic'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-bold">Actual Basic (Uncapped)</span>
                      <span className="text-[10px] text-slate-500 mt-1">12% computed on actual earned basic wage without cap</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Primary State (Professional Tax)</label>
                    <select
                      value={formData.ptState}
                      onChange={(e) => setFormData({ ...formData, ptState: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 cursor-pointer"
                    >
                      <option value="Karnataka">Karnataka (₹200/mo)</option>
                      <option value="Maharashtra">Maharashtra (₹200/mo, ₹300 Feb)</option>
                      <option value="Telangana">Telangana (₹200/mo)</option>
                      <option value="Delhi">Delhi (Zero PT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 block mb-1">Default Income Tax Regime</label>
                    <select
                      value={formData.taxRegime}
                      onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 cursor-pointer"
                    >
                      <option value="new">New Tax Regime (Section 115BAC, ₹75k Std Ded)</option>
                      <option value="old">Old Tax Regime (Section 80C, 80D, HRA)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pay Cycle */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Step 3: Payroll Calendar & Work Days</h4>
              </div>
              <p className="text-slate-500 text-[11px]">
                Controls the loss-of-pay (LOP) per-day wage formula and monthly ledger closing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Standard Working Days / Month</label>
                  <input
                    type="number"
                    min="20"
                    max="31"
                    value={formData.workingDays}
                    onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Typical: 22 days for 5-day workweeks, 26 for 6-day</p>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Disbursement Cut-off Day</label>
                  <select
                    value={formData.payCycleDay}
                    onChange={(e) => setFormData({ ...formData, payCycleDay: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 cursor-pointer"
                  >
                    <option value="25">25th of every month</option>
                    <option value="28">28th of every month</option>
                    <option value="30">30th / Last day of month</option>
                    <option value="1">1st of following month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Ready & Verification */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200 text-center py-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Configuration Complete!</h4>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Your statutory parameters for <strong>{formData.companyName}</strong> are initialized. The AI Payroll Auditor is armed with your rules to guard against salary leaks and compliance discrepancies.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Corporate PAN:</span>
                  <span className="font-mono font-bold text-slate-800">{formData.pan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provident Fund Rule:</span>
                  <span className="font-semibold text-slate-800">
                    {formData.pfCapping === 'statutory_capped_1800' ? '₹1,800 Cap' : 'Actual Basic'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Professional Tax:</span>
                  <span className="font-semibold text-slate-800">{formData.ptState} Schedule</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Standard Workdays:</span>
                  <span className="font-mono font-bold text-slate-800">{formData.workingDays} Days</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="cursor-pointer px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer px-3.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium"
            >
              Configure Later
            </button>
            <button
              onClick={handleNext}
              className="cursor-pointer px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-2xs"
            >
              <span>{currentStep === 4 ? 'Save & Launch Workspace' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
