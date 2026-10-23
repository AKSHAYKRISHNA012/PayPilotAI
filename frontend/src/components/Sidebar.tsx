import React from 'react';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarDays,
  FileSpreadsheet, Calculator, ShieldAlert, BotMessageSquare,
  Receipt, Settings, FileBarChart, ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openDiscrepanciesCount?: number;
  userRole?: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openDiscrepanciesCount = 4,
  userRole = 'admin',
}) => {
  const isEmployee = userRole === 'employee';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['admin', 'payroll_admin', 'employee'],
    },
    {
      id: 'employees',
      label: isEmployee ? 'My Profile' : 'Employees',
      icon: Users,
      roles: ['admin', 'payroll_admin', 'employee'],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      roles: ['admin', 'payroll_admin', 'employee'],
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: CalendarDays,
      roles: ['admin', 'payroll_admin', 'employee'],
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: Calculator,
      roles: ['admin', 'payroll_admin'],
    },
    {
      id: 'payslips',
      label: 'Payslips',
      icon: Receipt,
      roles: ['admin', 'payroll_admin', 'employee'],
    },
    {
      id: 'auditor',
      label: 'AI Payroll Auditor',
      icon: ShieldAlert,
      badge: openDiscrepanciesCount > 0 ? openDiscrepanciesCount : undefined,
      badgeColor: 'bg-red-50 text-red-700 border border-red-200 font-semibold',
      roles: ['admin', 'payroll_admin'],
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: BotMessageSquare,
      roles: ['admin', 'payroll_admin', 'employee'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileBarChart,
      roles: ['admin', 'payroll_admin'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      roles: ['admin', 'payroll_admin'],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole || 'admin')
  );

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between select-none no-print shrink-0 min-h-[calc(100vh-53px)]">
      <div className="py-4 px-3">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          {isEmployee ? 'Self-Service' : 'Menu'}
        </div>

        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`cursor-pointer w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subtle enterprise footer */}
      <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400">
        <p className="font-medium text-slate-600">PayPilot HCM v1.0</p>
        <p className="text-[10px] text-slate-400">Indian Statutory Engine</p>
      </div>
    </aside>
  );
};
