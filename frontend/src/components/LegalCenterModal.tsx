import React, { useState } from 'react';
import {
  ShieldCheck, FileText, Lock, X, RefreshCw,
  Printer, CheckCircle2, ChevronRight, Scale, ShieldAlert, Award
} from 'lucide-react';

export type LegalTab = 'terms' | 'privacy' | 'refund' | 'security' | 'dpa';

interface LegalCenterModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalCenterModal: React.FC<LegalCenterModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Trust & Legal Compliance Center</h2>
              <p className="text-xs text-slate-400">
                Statutory disclosures, DPDP Act 2023 compliance, and enterprise SLAs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print document"
              className="cursor-pointer text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`cursor-pointer py-3 px-4 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy (DPDP Act)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`cursor-pointer py-3 px-4 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`cursor-pointer py-3 px-4 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'refund'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refund & Cancellation</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`cursor-pointer py-3 px-4 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & VDP Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('dpa')}
            className={`cursor-pointer py-3 px-4 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dpa'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Data Processing Agreement</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs text-slate-600 leading-relaxed space-y-6">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Privacy Policy</h3>
                  <p className="text-[11px] text-slate-400">
                    Compliant with India's Digital Personal Data Protection (DPDP) Act 2023 & GDPR standards.
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">
                  Last Updated: October 2026
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">1. Role as Data Fiduciary vs Data Processor</h4>
                <p>
                  PayPilot AI Technologies Private Limited ("PayPilot AI") functions as a <strong>Data Processor</strong> on behalf of your employer or hiring organization (the "Data Fiduciary") regarding all employee compensation, attendance records, Permanent Account Numbers (PAN), Bank Account Numbers, and Provident Fund Universal Account Numbers (UAN).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">2. Employee Information Collected</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Statutory Identifiers:</strong> PAN, EPF UAN, ESIC IP Number, and state of employment for Professional Tax schedules.</li>
                  <li><strong>Banking Details:</strong> Account Number, Beneficiary Name, and IFSC codes exclusively used for generating bank CMS disbursements.</li>
                  <li><strong>Compensation & Deductions:</strong> Base pay, allowances, provident fund contributions, and computed Section 192 TDS withholdings.</li>
                  <li><strong>Audit Metadata:</strong> Discrepancy resolution notes, approval logs, and role change audit trails.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">3. Indian Data Residency & Encryption</h4>
                <p>
                  All database records, salary ledgers, and document uploads are retained exclusively within Indian data centers (MeitY-empanelled cloud regions in Mumbai/Hyderabad). All sensitive financial and identity records are encrypted at rest using AES-256 and in transit using TLS 1.3.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">4. Employee Rights Under DPDP Act 2023</h4>
                <p>
                  Employees retain the statutory right to view their salary processing explanation, inspect uploaded KYC documents via the Self-Service Portal, and request correction of discrepancies via their organization's designated Payroll Administrator.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enterprise Terms of Service</h3>
                  <p className="text-[11px] text-slate-400">
                    B2B Master Subscription Agreement governing the PayPilot AI SaaS Platform.
                  </p>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
                  Version 2.4 (2026)
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">1. Multi-Tenant SaaS Licensing</h4>
                <p>
                  Subject to plan tier limits (Starter: 25 headcount, Growth: 100 headcount, Enterprise: Unlimited), PayPilot AI grants the customer a non-exclusive, non-transferable right to access and utilize the payroll processing and AI Auditor engines.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">2. Service Level Agreement (SLA)</h4>
                <p>
                  PayPilot AI guarantees <strong>99.9% application uptime</strong> during monthly salary disbursement windows (24th to 7th of every month). Scheduled maintenance is restricted to non-business hours with 48 hours advance notice.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">3. Customer Responsibilities & Maker-Checker Integrity</h4>
                <p>
                  The customer is strictly responsible for maintaining dual-control separation between Payroll Creators (Makers) and Authorized Disbursers (Checkers). PayPilot AI is an auditing and calculation utility; actual bank wire release remains the sole discretion and legal responsibility of the customer.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">4. Limitation of Liability</h4>
                <p>
                  In no event shall PayPilot AI's aggregate liability for statutory fines or computational variances exceed the total fees paid by the customer in the twelve (12) months preceding the incident.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND & CANCELLATION */}
          {activeTab === 'refund' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Refund & Cancellation Policy</h3>
                  <p className="text-[11px] text-slate-400">Transparent cancellation, trial conversion, and prorated refund rules.</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-semibold">
                  Zero Lock-In
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">1. 14-Day Risk-Free Trial</h4>
                <p>
                  All new organizations receive full, unrestricted access to the 14-Day Free Trial. No credit card or upfront deposit is required. If you do not choose a paid subscription tier upon trial expiration, your account transitions to read-only archival mode with zero charges.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">2. Monthly & Annual Subscription Cancellation</h4>
                <p>
                  You can cancel your subscription at any time directly through the Billing Dashboard. Monthly subscriptions will remain active until the end of the current paid billing cycle with no subsequent automated renewals.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">3. 30-Day Money-Back Guarantee on Annual Plans</h4>
                <p>
                  Annual subscribers who are dissatisfied with the AI Auditor or statutory outputs are entitled to a full 100% refund within the first 30 days of initial purchase, no questions asked. Beyond 30 days, prorated refunds are issued for unused remaining whole months.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">4. Historical Ledger Data Export</h4>
                <p>
                  Upon cancellation, customers maintain 60 days of full CSV/Excel export access to download all historical salary registers, EPFO ECR records, and payslips before tenant data is permanently scrubbed.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & VDP */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enterprise Security Architecture & VDP</h3>
                  <p className="text-[11px] text-slate-400">Zero-Trust backend authentication and responsible disclosure standards.</p>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
                  Zero Client-Secrets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Hash Verification</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    All payment webhooks are verified via HMAC-SHA256 signatures to prevent unauthorized subscription tampering.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Strict Tenant Isolation</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Database queries enforce company_id scoping across every employee, leave, and payroll ledger request.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Vulnerability Disclosure Program (VDP)</h4>
                <p>
                  We welcome responsible disclosure from security researchers. If you uncover an authentication bypass, IDOR, or cryptographic flaw, report it directly to <code>security@paypilot.ai</code>. We commit to acknowledging reports within 24 hours and deploying remediations within 72 hours.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DPA */}
          {activeTab === 'dpa' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Data Processing Agreement (DPA)</h3>
                  <p className="text-[11px] text-slate-400">Contractual commitments regarding Indian personal payroll data processing.</p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-semibold">
                  Annexure A
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">1. Subject Matter and Scope</h4>
                <p>
                  This Data Processing Agreement establishes the legal framework under which PayPilot AI processes employee personal and financial data exclusively for calculating salary structures, statutory tax deductions, and preparing bank disbursement ledgers as instructed by the customer.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">2. Security Measures</h4>
                <p>
                  PayPilot AI maintains administrative, technical, and physical safeguards designed to protect customer data from unauthorized disclosure, modification, or accidental destruction.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            For bespoke enterprise agreements, contact <span className="font-mono text-slate-700">legal@paypilot.ai</span>
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
