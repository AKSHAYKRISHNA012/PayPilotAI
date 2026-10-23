import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { MarketingLandingPage } from './pages/MarketingLandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IntelligenceCenterPage } from './pages/IntelligenceCenterPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { SalaryStructurePage } from './pages/SalaryStructurePage';
import { PayrollProcessingPage } from './pages/PayrollProcessingPage';
import { AIAuditorPage } from './pages/AIAuditorPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { PayslipsReportsPage } from './pages/PayslipsReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api, setApiUserId } from './services/api';
import { User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [currentView, setCurrentView] = useState<'marketing' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'marketing' || window.location.hash.includes('marketing')) {
        return 'marketing';
      }
    }
    return 'app';
  });
  const [openDiscrepanciesCount, setOpenDiscrepanciesCount] = useState<number>(4);
  const [isGuidedDemoOpen, setIsGuidedDemoOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authModalPlan, setAuthModalPlan] = useState<string>('free_trial');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initApp();

    const handleHash = () => {
      if (window.location.hash.includes('marketing')) {
        setCurrentView('marketing');
      } else if (window.location.hash.includes('app')) {
        setCurrentView('app');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const initApp = async () => {
    try {
      setLoading(true);
      const [uRes, meRes, fRes] = await Promise.all([
        api.getDemoUsers(),
        api.getMe(),
        api.getAuditFindings('period_oct_2026')
      ]);
      setDemoUsers(uRes.users);
      setCurrentUser(meRes);
      setOpenDiscrepanciesCount(fRes.summary?.total_open ?? 4);
    } catch (err) {
      console.error('Failed to initialize app', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    setApiUserId(userId);
    try {
      const me = await api.getMe();
      setCurrentUser(me);
      // If employee, redirect to dashboard or allowed tabs
      if (me.role === 'employee' && ['payroll', 'auditor', 'settings'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
      // Refresh discrepancies
      const fRes = await api.getAuditFindings('period_oct_2026');
      setOpenDiscrepanciesCount(fRes.summary?.total_open ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    try {
      await api.resetSeedData();
      await initApp();
      setCurrentTab('dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight">PayPilot AI</h2>
        <p className="text-xs text-slate-400 mt-1">Starting statutory engines & multi-rule payroll auditor...</p>
      </div>
    );
  }

  // 1. PUBLIC MARKETING WEBSITE VIEW
  if (currentView === 'marketing') {
    return (
      <>
        <MarketingLandingPage
          onEnterApp={() => {
            setCurrentView('app');
            if (window.location.hash.includes('marketing')) {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
          onOpenLogin={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenRegister={(plan) => {
            setAuthModalMode('register');
            setAuthModalPlan(plan || 'free_trial');
            setIsAuthModalOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          initialPlan={authModalPlan}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setCurrentView('app');
          }}
          demoUsers={demoUsers}
          onSwitchDemoUser={handleSwitchUser}
        />
      </>
    );
  }

  // 2. CORE SAAS APPLICATION PORTAL VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        demoUsers={demoUsers}
        onSwitchUser={handleSwitchUser}
        onOpenGuidedDemo={() => setIsGuidedDemoOpen(true)}
        onResetData={handleResetData}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        onNavigateLanding={() => {
          setCurrentView('marketing');
          window.location.hash = 'marketing';
        }}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          openDiscrepanciesCount={openDiscrepanciesCount}
          userRole={currentUser?.role}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-61px)] bg-slate-50">
          {currentTab === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
              onTriggerAudit={() => setCurrentTab('auditor')}
            />
          )}

          {currentTab === 'intelligence' && (
            <IntelligenceCenterPage
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesPage
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendancePage currentUser={currentUser} />
          )}

          {currentTab === 'leave' && (
            <LeavePage currentUser={currentUser} />
          )}

          {currentTab === 'salary_structures' && (
            <SalaryStructurePage currentUser={currentUser} />
          )}

          {currentTab === 'payroll' && (
            <PayrollProcessingPage
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'auditor' && (
            <AIAuditorPage
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'assistant' && (
            <AIAssistantPage
              currentUser={currentUser}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'payslips' && (
            <PayslipsReportsPage currentUser={currentUser} initialView="payslip" />
          )}

          {currentTab === 'reports' && (
            <PayslipsReportsPage currentUser={currentUser} initialView="summary" />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              onResetData={handleResetData}
              onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Guided 10-Step Pitch Tour Modal */}
      <GuidedDemoModal
        isOpen={isGuidedDemoOpen}
        onClose={() => setIsGuidedDemoOpen(false)}
        onNavigateTab={setCurrentTab}
        onSwitchUser={handleSwitchUser}
      />

      {/* SaaS Subscription & Razorpay Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onPlanUpdated={() => initApp()}
      />

      {/* Auth & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        initialPlan={authModalPlan}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
        demoUsers={demoUsers}
        onSwitchDemoUser={handleSwitchUser}
      />
    </div>
  );
};

export default App;
