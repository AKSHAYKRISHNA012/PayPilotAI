import React, { useState } from 'react';
import { api, setApiUserId } from '../services/api';
import { User } from '../types';
import {
  X, Lock, Mail, Building, User as UserIcon, Phone,
  ArrowRight, ShieldCheck, CheckCircle, AlertCircle, Sparkles, KeyRound
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  initialPlan?: string;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  demoUsers: User[];
  onSwitchDemoUser: (userId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  initialPlan = 'free_trial',
  onClose,
  onAuthSuccess,
  demoUsers,
  onSwitchDemoUser
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regCompany, setRegCompany] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPlan, setRegPlan] = useState(initialPlan);

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.loginUser(loginEmail, loginPassword);
      if (res.user) {
        setApiUserId(res.user.id);
        const me = await api.getMe();
        onAuthSuccess(me);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.registerOrganization({
        company_name: regCompany,
        owner_name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        plan_tier: regPlan
      });
      confetti();
      setApiUserId(res.user.id);
      const me = await api.getMe();
      onAuthSuccess(me);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotEmail);
      setSuccessMsg(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    setError(null);
    try {
      setLoading(true);
      const res = await api.resetPassword(resetToken, newPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
        setSuccessMsg(null);
        setResetToken(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base">
              P
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {mode === 'login' && 'Sign in to PayPilot AI'}
                {mode === 'register' && 'Register Organization'}
                {mode === 'forgot' && 'Password Recovery'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'login' && 'Enter your corporate credentials'}
                {mode === 'register' && 'Start your 14-day free trial'}
                {mode === 'forgot' && 'Reset your secure login password'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. ananya.sen@bharattech.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="cursor-pointer text-[11px] text-indigo-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-2.5 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Demo Profiles Quick Switcher */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 text-center">
                  Or Test Drive Seeded Demo Profiles (1-Click):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {demoUsers.slice(0, 4).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchDemoUser(u.id);
                        onClose();
                      }}
                      className="cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                        {u.full_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate text-[11px]">{u.full_name}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{u.role.replace('_', ' ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2 text-slate-500">
                Don't have an organization account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="cursor-pointer text-indigo-600 font-bold hover:underline"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER MODE */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company / Entity Name *</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Innovations Pvt Ltd"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full pl-9 p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@yourcompany.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Password (min 6 characters) *</label>
                <input
                  type="password"
                  required
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Selected Plan</label>
                <select
                  value={regPlan}
                  onChange={(e) => setRegPlan(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="free_trial">14-Day Free Trial (10 Employees)</option>
                  <option value="starter">Starter Plan (25 Employees)</option>
                  <option value="growth">Growth Plan (100 Employees - Recommended)</option>
                  <option value="enterprise">Enterprise Plan (Unlimited)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-2.5 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Creating Organization...' : 'Complete Registration & Start Trial'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="cursor-pointer text-indigo-600 font-bold hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {!resetToken ? (
                <form onSubmit={handleForgot} className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Enter your account email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ananya.sen@bharattech.in"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer w-full py-2.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? 'Checking...' : 'Generate Reset Token'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <span>Security Token Verified</span>
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-1 font-mono break-all">{resetToken}</p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter at least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="cursor-pointer w-full py-2.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="cursor-pointer text-slate-600 hover:underline font-semibold"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
