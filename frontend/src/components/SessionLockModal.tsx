import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff, UserCheck } from 'lucide-react';
import { User } from '../types';

interface SessionLockModalProps {
  isLocked: boolean;
  currentUser: User | null;
  onUnlock: () => void;
  onSwitchUser?: () => void;
}

export const SessionLockModal: React.FC<SessionLockModalProps> = ({
  isLocked,
  currentUser,
  onUnlock,
  onSwitchUser
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setError('');
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In demo environment any entry or "demo" or clicking unlock succeeds
    if (pin.trim().length > 0 || true) {
      onUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Financial Workspace Locked</h3>
          <p className="text-xs text-slate-500 mt-1">
            Inactive session locked to safeguard salary ledgers and PAN/KYC records under DPDP Act 2023.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
            {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.full_name || 'Active User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{currentUser?.email || 'user@paypilot.ai'}</p>
          </div>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase">
            {currentUser?.role || 'Admin'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Enter password or press Unlock"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full text-center tracking-widest text-sm p-2.5 rounded-lg border border-slate-300 focus:border-indigo-600 outline-none"
            autoFocus
          />

          <button
            type="submit"
            className="cursor-pointer w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <span>Unlock Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {onSwitchUser && (
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onUnlock();
                onSwitchUser();
              }}
              className="cursor-pointer text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Switch demo profile / log out &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
