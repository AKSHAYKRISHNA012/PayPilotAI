import React, { useState } from 'react';
import { X, ArrowRight, Play, ChevronRight, Check } from 'lucide-react';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onSwitchUser: (userId: string) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSwitchUser,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      step: 1,
      title: '1. Overview Dashboard',
      description: 'Review workforce metrics: headcount, attendance rate, pending leave approvals, and current monthly payroll expenditure.',
      targetTab: 'dashboard',
      targetUser: 'usr_admin',
      roleBadge: 'HR / Admin',
      actionLabel: 'Go to Overview',
      highlight: 'Notice the top alert banner identifying 4 active payroll discrepancies before salary processing.'
    },
    {
      step: 2,
      title: '2. Employee Records & Attendance',
      description: 'Review employee master data, department allocations, compensation structures, and daily attendance logs.',
      targetTab: 'employees',
      targetUser: 'usr_admin',
      roleBadge: 'HR / Admin',
      actionLabel: 'View Employees',
      highlight: 'Open Priya Sharma (BTI-002) to inspect her 360° profile and attendance history (4 absent days recorded).'
    },
    {
      step: 3,
      title: '3. Payroll Processing (October 2026)',
      description: 'Open the active payroll period. Inspect gross earnings, statutory deductions (PF, ESI, PT, TDS), and flagged line items.',
      targetTab: 'payroll',
      targetUser: 'usr_payroll',
      roleBadge: 'Payroll Admin',
      actionLabel: 'Open Payroll Processing',
      highlight: 'Review line items marked with amber "Flagged" badges requiring investigation.'
    },
    {
      step: 4,
      title: '4. Run AI Payroll Audit',
      description: 'Trigger the autonomous auditor engine to run deterministic statutory rule checks and variance threshold scans.',
      targetTab: 'auditor',
      targetUser: 'usr_payroll',
      roleBadge: 'Payroll Admin',
      actionLabel: 'Open AI Auditor',
      highlight: 'Click "Run Payroll Audit" to perform full pre-disbursement verification.'
    },
    {
      step: 5,
      title: '5. Review Seeded Discrepancies',
      description: 'Inspect the 4 detected anomalies: Salary Spike (+53.6%), Attendance Mismatch, Negative Net Pay, and Missing Bank KYC.',
      targetTab: 'auditor',
      targetUser: 'usr_payroll',
      roleBadge: 'Payroll Admin',
      actionLabel: 'Inspect Findings',
      highlight: 'Findings are categorized by Critical, High, and Medium severity with clear remediation steps.'
    },
    {
      step: 6,
      title: '6. Numerical Expected vs. Observed Values',
      description: 'Click into any finding to see exact numerical formulas, statutory ceiling violations, and before/after values.',
      targetTab: 'auditor',
      targetUser: 'usr_payroll',
      roleBadge: 'Payroll Admin',
      actionLabel: 'View Anomaly Details',
      highlight: 'Look at Rohan Verma (+₹75,000 double bonus) or Amit Patel (Negative -₹7,000 net pay).'
    },
    {
      step: 7,
      title: '7. Resolve Anomaly & Recalculate',
      description: 'Adjust the line item with audit resolution notes. The system logs the change and clears the discrepancy flag.',
      targetTab: 'auditor',
      targetUser: 'usr_payroll',
      roleBadge: 'Payroll Admin',
      actionLabel: 'Test Resolving',
      highlight: 'Notice how the status updates to Resolved and the payroll ledger reflects clean arithmetic.'
    },
    {
      step: 8,
      title: '8. Employee Self-Service Experience',
      description: 'Switch persona to Rohan Verma (Staff Backend Engineer) to test the employee portal view.',
      targetTab: 'dashboard',
      targetUser: 'usr_emp_rohan',
      roleBadge: 'Employee (Rohan Verma)',
      actionLabel: 'Switch to Rohan Verma',
      highlight: 'The interface cleanly adapts: only personal compensation, leave balances, and payslips are visible.'
    },
    {
      step: 9,
      title: '9. AI Salary Explanation',
      description: 'Ask: "How was my take-home salary calculated?" or "Why was my salary different this month?"',
      targetTab: 'assistant',
      targetUser: 'usr_emp_rohan',
      roleBadge: 'Employee (Rohan Verma)',
      actionLabel: 'Open AI Assistant',
      highlight: 'The assistant uses deterministic calculation data from the engine to break down every rupee transparently.'
    },
    {
      step: 10,
      title: '10. Official Indian Payslip & Banking Export',
      description: 'View the verified printable payslip and download the corporate bank NEFT CMS batch payment file.',
      targetTab: 'reports',
      targetUser: 'usr_emp_rohan',
      roleBadge: 'Employee (Rohan Verma)',
      actionLabel: 'View Payslip & Finish',
      highlight: 'Print or export CSV directly. PayPilot AI: "Smarter Payroll. Confident Decisions."'
    }
  ];

  const step = demoSteps[currentStep];

  const handleExecuteStep = () => {
    onSwitchUser(step.targetUser);
    onNavigateTab(step.targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Guided Demo Walkthrough</h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Step {currentStep + 1} of {demoSteps.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Standard 3–5 minute pitch walkthrough
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1 flex">
          {demoSteps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-full ${
                idx <= currentStep ? 'bg-indigo-600' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Active Persona: <strong className="text-slate-900">{step.roleBadge}</strong>
            </span>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900">
              {step.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong className="font-semibold text-slate-900">Demo Focus: </strong>
            <span>{step.highlight}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteStep}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {currentStep < demoSteps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
