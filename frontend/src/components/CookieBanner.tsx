import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, Settings2 } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
}

export const CookieBanner: React.FC<{ onOpenLegalPrivacy: () => void }> = ({ onOpenLegalPrivacy }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('paypilot_cookie_consent');
    if (!saved) {
      // Delay opening slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const all = { necessary: true, functional: true, analytics: true };
    localStorage.setItem('paypilot_cookie_consent', JSON.stringify(all));
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    const min = { necessary: true, functional: false, analytics: false };
    localStorage.setItem('paypilot_cookie_consent', JSON.stringify(min));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('paypilot_cookie_consent', JSON.stringify(preferences));
    setShowPreferences(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-5 text-xs text-slate-600">
        {!showPreferences ? (
          <div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Cookie className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm tracking-tight">Cookie & Privacy Choices</h4>
                <p className="mt-1 leading-relaxed text-slate-600">
                  PayPilot AI utilizes strictly essential cookies to isolate multi-tenant sessions, prevent CSRF tampering, and maintain statutory payroll calculations securely.{' '}
                  <button
                    onClick={onOpenLegalPrivacy}
                    className="cursor-pointer text-indigo-600 hover:text-indigo-800 underline font-medium"
                  >
                    Privacy Notice
                  </button>
                  .
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="cursor-pointer text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-50 transition"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRejectNonEssential}
                  className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition text-xs"
                >
                  Essential Only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition text-xs shadow-2xs"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Cookie Preferences</h4>
              <button
                onClick={() => setShowPreferences(false)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900 text-xs">Strictly Necessary</p>
                  <p className="text-[11px] text-slate-500">Tenant session token & encryption</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Required
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900 text-xs">Functional & Security</p>
                  <p className="text-[11px] text-slate-500">Remember role views & filter settings</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900 text-xs">Performance & Diagnostics</p>
                  <p className="text-[11px] text-slate-500">Anonymous calculation latency metrics</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowPreferences(false)}
                className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
              >
                Back
              </button>
              <button
                onClick={handleSavePreferences}
                className="cursor-pointer px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
