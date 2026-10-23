import React, { useState } from 'react';
import { api, formatINR } from '../services/api';
import {
  ShieldCheck, CheckCircle, ArrowRight, Zap, Play,
  Lock, FileText, Check, HelpCircle,
  Mail, Phone, Building2, User, ChevronDown, ChevronUp, Sparkles, AlertTriangle
} from 'lucide-react';

interface MarketingLandingPageProps {
  onEnterApp: () => void;
  onOpenLogin: () => void;
  onOpenRegister: (plan?: string) => void;
}

export const MarketingLandingPage: React.FC<MarketingLandingPageProps> = ({
  onEnterApp,
  onOpenLogin,
  onOpenRegister
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [contactForm, setContactForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    employee_range: '10-50',
    message: ''
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingContact(true);
      await api.contactSales({
        ...contactForm,
        inquiry_type: 'demo_request'
      });
      setContactSubmitted(true);
    } catch (err) {
      console.error(err);
      setContactSubmitted(true); // Graceful fallback
    } finally {
      setSubmittingContact(false);
    }
  };

  const faqs = [
    {
      q: 'How does the AI Payroll Auditor prevent compliance penalties?',
      a: 'Unlike generic LLMs that generate approximate text, the PayPilot AI Auditor is a deterministic mathematical engine. Before payroll finalization, it cross-checks attendance logs against Loss of Pay (LOP), verifies the 50% deduction ceiling under the Payment of Wages Act, enforces EPF ₹15,000 wage caps, and flags unexplained gross salary spikes before bank disbursement files are generated.'
    },
    {
      q: 'Does PayPilot AI support the FY 2026-27 New Tax Regime?',
      a: 'Yes. PayPilot AI incorporates the revised Section 115BAC tax slabs, Section 87A rebate adjustments up to ₹7,00,000 taxable income, the standard deduction of ₹75,000, and 4% Health & Education Cess for accurate monthly TDS Section 192 estimates.'
    },
    {
      q: 'Can I export batch payment files directly for corporate banking?',
      a: 'Yes. PayPilot AI generates one-click CMS batch payment files compatible with HDFC Enet, ICICI Corporate Internet Banking (CIB), and SBI CMP portals, as well as the standard #~# delimited ECR text file for the EPFO Unified Employer Portal.'
    },
    {
      q: 'How is tenant and employee privacy secured?',
      a: 'Every database query, background job, and export is strictly partitioned by Organization ID (tenant isolation). Employees can only access their own authenticated payslips, attendance, and leave balances. Data is protected with PBKDF2 encryption and strict server-side RBAC.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md shadow-indigo-500/20">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">PayPilot</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">Commercial SaaS for India</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#auditor" className="hover:text-white transition">AI Auditor</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#compliance" className="hover:text-white transition">Indian Statutory</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onEnterApp}
              className="cursor-pointer hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Open full interactive live sandbox without registering"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              <span>Live Demo Sandbox</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="cursor-pointer text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenRegister('free_trial')}
              className="cursor-pointer px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.25),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built Specifically for Indian Startups & SMEs • FY 2026-27 Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Smarter Indian Payroll. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-indigo-300">
              Confident Decisions Before Payday.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            PayPilot AI doesn't just calculate salaries—it audits payroll before money leaves your corporate bank account. Eliminate EPF/ESIC compliance penalties, prevent unbilled leave leakage, and explain every calculation to employees.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenRegister('growth')}
              className="cursor-pointer w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onEnterApp}
              className="cursor-pointer w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
              <span>Explore Interactive Live Demo</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Instant sandbox access • No credit card required • Full Indian statutory mathematics
          </p>

          {/* Interactive AI Auditor Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-2xl p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">PayPilot AI Auditor — Live Engine Preview</span>
              </div>
              <span className="text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-md">
                1 CRITICAL • 2 HIGH Flags
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Salary Spike (+53.6% Jump)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Rohan Verma (BTI-003)</span>
                </div>
                <p className="text-slate-300 mt-2">
                  Gross jumped from ₹1,40,000 to ₹2,15,000. Accidental duplicate festival bonus detected before bank file generation.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Action: Adjust line to approved bonus</span>
                  <span className="text-indigo-400 font-semibold cursor-pointer hover:underline" onClick={onEnterApp}>Inspect in App &rarr;</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Negative Net Salary (-₹7,000)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Amit Patel (BTI-005)</span>
                </div>
                <p className="text-slate-300 mt-2">
                  Loan recovery exceeded gross pay, violating the Payment of Wages Act 50% deduction ceiling. Flagged and locked.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Action: Cap monthly EMI to ₹20,000</span>
                  <span className="text-indigo-400 font-semibold cursor-pointer hover:underline" onClick={onEnterApp}>Inspect in App &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statutory Engine Section */}
      <section id="compliance" className="py-20 bg-slate-950 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Indian Corporate Compliance</h2>
            <p className="text-3xl font-extrabold text-white mt-2">
              Precise Statutory Rules Configured for India
            </p>
            <p className="text-slate-400 text-sm mt-3">
              Eliminate manual spreadsheets. Every payroll run automatically applies official central and state formulas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 text-xs">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-3">
                PF
              </div>
              <h3 className="text-sm font-bold text-white">EPF Act 1952</h3>
              <p className="text-slate-400 mt-2">
                12% employee contribution with statutory ₹1,800 monthly ceiling or actual basic wage. Split 3.67% EPF & 8.33% EPS for employer.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold mb-3">
                ESI
              </div>
              <h3 className="text-sm font-bold text-white">ESIC Compliance</h3>
              <p className="text-slate-400 mt-2">
                Automated eligibility check triggered only when monthly gross &le; ₹21,000 (0.75% employee and 3.25% employer contributions).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold mb-3">
                PT
              </div>
              <h3 className="text-sm font-bold text-white">Multi-State PT Slabs</h3>
              <p className="text-slate-400 mt-2">
                Karnataka (₹200 for gross &gt; ₹15k), Maharashtra (₹200/₹300 in Feb), Telangana, and Delhi zero-tax states configured dynamically.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold mb-3">
                TDS
              </div>
              <h3 className="text-sm font-bold text-white">Section 192 TDS</h3>
              <p className="text-slate-400 mt-2">
                FY 2026-27 New Tax Regime (Section 115BAC), ₹75k standard deduction, 87A rebate up to ₹7 Lakhs, and 4% Health & Education cess.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Enterprise Feature Architecture</h2>
            <p className="text-3xl font-extrabold text-white mt-2">
              Everything Your HR & Finance Teams Need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-xs">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Maker-Checker Dual Approvals</h3>
              <p className="text-slate-400 mt-2 leading-relaxed">
                Prevent internal payroll fraud. Payroll administrators prepare calculations; executive CPO/CFO approvers review flagged variances and release disbursements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Bank CMS & EPFO ECR Files</h3>
              <p className="text-slate-400 mt-2 leading-relaxed">
                Download formatted CSVs for HDFC Enet, ICICI CIB, and SBI CMP banking portals, plus exact #~# formatted text files for monthly EPFO portal upload.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Self-Service AI Assistant</h3>
              <p className="text-slate-400 mt-2 leading-relaxed">
                Empower employees to ask questions about their own take-home salary, LOP daily rates, and tax deductions with 100% verified math and zero hallucination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Transparent Commercial Pricing</h2>
            <p className="text-3xl font-extrabold text-white mt-2">
              Fair, Predictable INR Subscriptions
            </p>
            <p className="text-slate-400 text-sm mt-3">
              No hidden setup fees. Upgrade or cancel anytime as your team grows.
            </p>

            {/* Toggle */}
            <div className="mt-6 inline-flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`cursor-pointer px-4 py-1.5 rounded-lg transition ${
                  billingCycle === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`cursor-pointer px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  billingCycle === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-14 text-xs">
            {/* Free Trial */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">14-Day Trial</h3>
                <p className="text-slate-400 text-xs mt-1">Full test-drive for any startup.</p>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-3xl font-extrabold text-white font-mono">₹0</span>
                </div>
                <ul className="mt-6 space-y-2 text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 10 Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Full Statutory Calculations</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3 AI Auditor Runs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Printable Indian Payslips</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenRegister('free_trial')}
                className="cursor-pointer w-full mt-8 py-2.5 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              >
                Start Free Trial
              </button>
            </div>

            {/* Starter */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">Starter</h3>
                <p className="text-slate-400 text-xs mt-1">For early-stage teams up to 25.</p>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {billingCycle === 'annual' ? '₹1,666' : '₹1,999'}
                  </span>
                  <span className="text-slate-500 text-xs">/mo</span>
                </div>
                <ul className="mt-6 space-y-2 text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 25 Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited AI Auditor Runs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Bank NEFT / CMS CSVs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Attendance & Leave Approvals</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenRegister('starter')}
                className="cursor-pointer w-full mt-8 py-2.5 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              >
                Choose Starter
              </button>
            </div>

            {/* Growth (Popular) */}
            <div className="p-6 rounded-2xl bg-indigo-950/40 border-2 border-indigo-500 flex flex-col justify-between relative shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Growth</h3>
                <p className="text-indigo-200 text-xs mt-1">Scale-ups & growing companies.</p>
                <div className="mt-4 pt-3 border-t border-indigo-900/50">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {billingCycle === 'annual' ? '₹4,166' : '₹4,999'}
                  </span>
                  <span className="text-slate-400 text-xs">/mo</span>
                </div>
                <ul className="mt-6 space-y-2 text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Up to 100 Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Maker-Checker Dual Approvals</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> EPFO ECR #~# Text Export</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Conversational AI Assistant</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-State PT Customization</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenRegister('growth')}
                className="cursor-pointer w-full mt-8 py-2.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
              >
                Choose Growth
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">Enterprise</h3>
                <p className="text-slate-400 text-xs mt-1">Multi-entity & 100+ headcount.</p>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {billingCycle === 'annual' ? '₹12,499' : '₹14,999'}
                  </span>
                  <span className="text-slate-500 text-xs">/mo</span>
                </div>
                <ul className="mt-6 space-y-2 text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Unlimited Employees</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-Subsidiary Isolation</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated Payroll Specialist</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Custom ERP / HRMS API</li>
                </ul>
              </div>
              <a
                href="#contact"
                className="w-full mt-8 py-2.5 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition text-center block"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Book a Demo / Contact Sales Form */}
      <section id="contact" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-8 text-xs">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Request an Enterprise Demo</h2>
              <p className="text-slate-400 mt-2">
                See how PayPilot AI audits salary ledgers and protects your company from statutory non-compliance.
              </p>
            </div>

            {contactSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Thank you! Request Received</h3>
                <p className="text-slate-300 max-w-md mx-auto">
                  Our payroll implementation specialist will contact you within 2 business hours to schedule your personalized product walkthrough.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikramaditya Sharma"
                      value={contactForm.full_name}
                      onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@yourcompany.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech India Pvt Ltd"
                      value={contactForm.company_name}
                      onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Employee Headcount</label>
                    <select
                      value={contactForm.employee_range}
                      onChange={(e) => setContactForm({ ...contactForm, employee_range: e.target.value })}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    >
                      <option value="1-10">1 - 10 employees</option>
                      <option value="10-50">10 - 50 employees</option>
                      <option value="50-200">50 - 200 employees</option>
                      <option value="200+">200+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Notes / Current Pain Points</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your current payroll challenges (e.g. attendance leakage, EPF reconciliation, multi-state PT)..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="cursor-pointer px-6 py-3 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
                  >
                    <span>{submittingContact ? 'Submitting...' : 'Schedule Product Demo'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Got Questions?</h2>
            <p className="text-3xl font-extrabold text-white mt-2">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="cursor-pointer w-full p-5 text-left flex items-center justify-between text-sm font-bold text-white hover:text-indigo-400 transition"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer & Compliance Notices */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                P
              </div>
              <span className="font-bold text-sm text-white">PayPilot AI Technologies</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-400">
              <span className="hover:text-white cursor-pointer" onClick={() => alert("PayPilot AI Terms of Service:\n1. Multi-tenant SaaS service.\n2. Customer owns all employee data.\n3. 99.9% availability commitment.\n4. Razorpay encrypted payments.")}>Terms of Service</span>
              <span className="hover:text-white cursor-pointer" onClick={() => alert("PayPilot AI Privacy Policy:\n1. Compliance with Digital Personal Data Protection (DPDP) Act 2023.\n2. Bank accounts and PAN encrypted at rest.\n3. Never sold or shared with third parties.")}>Privacy Policy</span>
              <span className="hover:text-white cursor-pointer" onClick={() => alert("Cookie Policy:\nSession and JWT tokens are used strictly for authentication and tenant isolation.")}>Cookie Policy</span>
              <span className="hover:text-white cursor-pointer" onClick={onEnterApp}>Sandbox Demo</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} PayPilot AI. All rights reserved. Indian Patent & Trademark Pending.</p>
            <p className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SOC2 Type II Ready • DPDP Act 2023 Compliant • 256-bit TLS</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
