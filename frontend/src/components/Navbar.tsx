import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  Shield, UserCheck, Users, RotateCcw,
  ChevronDown, Check, Play, Building2, Menu, X as CloseIcon
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  demoUsers: User[];
  onSwitchUser: (userId: string) => void;
  onOpenGuidedDemo: () => void;
  onResetData: () => void;
  onOpenSubscription?: () => void;
  onNavigateLanding?: () => void;
  onOpenAuth?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  demoUsers,
  onSwitchUser,
  onOpenGuidedDemo,
  onResetData,
  onOpenSubscription,
  onNavigateLanding,
  onOpenAuth,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = async () => {
    if (confirm('Restore demo data to original state with seeded anomalies for pitch presentation?')) {
      setResetting(true);
      await onResetData();
      setResetting(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
            <Shield className="w-3 h-3 text-slate-600" /> {role === 'owner' ? 'Owner' : 'HR / Admin'}
          </span>
        );
      case 'payroll_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <UserCheck className="w-3 h-3 text-indigo-600" /> Payroll Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <Users className="w-3 h-3 text-gray-600" /> Employee
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between no-print">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3 sm:gap-6">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="w-5 h-5 text-slate-700" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>
        )}

        <div
          onClick={onNavigateLanding}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Go to Public Marketing Website"
        >
          <div className="w-7 h-7 rounded-md bg-slate-900 group-hover:bg-indigo-600 transition flex items-center justify-center text-white font-bold text-xs">
            P
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900 tracking-tight font-sans">
              PayPilot <span className="text-indigo-600 font-extrabold">AI</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              | HCM
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 pl-6 border-l border-slate-200 text-xs text-slate-600 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentUser?.company?.name || 'BharatTech Innovations Pvt. Ltd.'}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Subscription Plan Badge / Upgrade CTA */}
        {onOpenSubscription && (
          <button
            onClick={onOpenSubscription}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="capitalize">{currentUser?.company?.plan_tier || 'Growth'} Plan</span>
            <span className="text-[10px] text-indigo-500 font-normal hidden sm:inline">• Upgrade</span>
          </button>
        )}

        {/* Public Website View */}
        {onNavigateLanding && (
          <button
            onClick={onNavigateLanding}
            className="cursor-pointer hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition"
          >
            <span>Public Site</span>
          </button>
        )}

        {/* Guided Demo Tour */}
        <button
          onClick={onOpenGuidedDemo}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
          <span className="hidden sm:inline">Guided Demo</span>
        </button>

        {/* Reset Demo Data */}
        <button
          onClick={handleReset}
          disabled={resetting}
          title="Restore seeded anomalies for pitch presentation"
          className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Role Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="cursor-pointer flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                {currentUser?.full_name}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
            <div className="sm:hidden">
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </button>

          {/* Clean Dropdown */}
          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona
                </p>
                <p className="text-[11px] text-slate-500">
                  Test role-based access control instantaneously
                </p>
              </div>

              <div className="py-1">
                {demoUsers.map((user) => {
                  const isSelected = user.id === currentUser?.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user.id);
                        setRoleDropdownOpen(false);
                      }}
                      className={`cursor-pointer w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-slate-50 font-medium' : ''
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          {user.full_name}
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {user.designation}
                        </p>
                      </div>
                      <div className="scale-90 origin-right">{getRoleBadge(user.role)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
