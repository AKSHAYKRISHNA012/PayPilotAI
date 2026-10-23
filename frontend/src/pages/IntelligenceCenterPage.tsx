import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../services/api';
import {
  User, SimulationResult, SimulationScenario,
  PayrollForecastData, AnomalyRadarData, AnomalyRadarItem,
  ExplainPayslipResult, HRWorkflowTaskItem, IntelligenceSummary
} from '../types';
import {
  Sparkles, TrendingUp, Cpu, ShieldAlert, BotMessageSquare,
  CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Plus,
  Trash2, Save, FileText, ArrowUpRight, ArrowDownRight, Info,
  ChevronRight, Check, X, Shield, Users, DollarSign,
  HelpCircle, Sliders, Calendar, ArrowRight, Zap, Play
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

interface IntelligenceCenterPageProps {
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
}

export const IntelligenceCenterPage: React.FC<IntelligenceCenterPageProps> = ({
  currentUser,
  onNavigateTab
}) => {
  const isEmployee = currentUser?.role === 'employee';
  const [activeTab, setActiveTab] = useState<'digital_twin' | 'forecast' | 'anomalies' | 'payslip_assistant' | 'workflow_agent'>(
    isEmployee ? 'payslip_assistant' : 'digital_twin'
  );

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<IntelligenceSummary | null>(null);

  // Tab 1: Digital Twin State
  const [simHikePct, setSimHikePct] = useState<number>(10);
  const [simBonusPool, setSimBonusPool] = useState<number>(50000);
  const [simBonusDept, setSimBonusDept] = useState<string>('all');
  const [deptHikes, setDeptHikes] = useState<Record<string, number>>({
    Engineering: 10,
    Marketing: 5,
    Operations: 5,
    Design: 5
  });
  const [newHires, setNewHires] = useState<Array<{
    designation: string;
    department: string;
    monthly_gross: number;
    state: string;
  }>>([
    { designation: 'Junior Cloud Engineer', department: 'Engineering', monthly_gross: 55000, state: 'Karnataka' }
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>([]);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [scenarioDescInput, setScenarioDescInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingScenario, setSavingScenario] = useState(false);

  // Tab 2: Forecast State
  const [forecastMonths, setForecastMonths] = useState<number>(4);
  const [forecastData, setForecastData] = useState<PayrollForecastData | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Tab 3: Anomaly Radar State
  const [anomalyData, setAnomalyData] = useState<AnomalyRadarData | null>(null);
  const [anomalyFilter, setAnomalyFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRadarItem | null>(null);

  // Tab 4: Explainable Payslip Assistant State
  const [payslipEmployeeId, setPayslipEmployeeId] = useState<string>(currentUser?.employee_id || 'emp_001');
  const [currPeriodId, setCurrPeriodId] = useState<string>('period_oct_2026');
  const [prevPeriodId, setPrevPeriodId] = useState<string>('period_sep_2026');
  const [payslipQuery, setPayslipQuery] = useState<string>('Why is my take-home pay lower this month?');
  const [explaining, setExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<ExplainPayslipResult | null>(null);

  // Tab 5: HR Workflow Agent State
  const [workflowTasks, setWorkflowTasks] = useState<HRWorkflowTaskItem[]>([]);
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load summary and initial tab data
  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const sum = await api.getIntelligenceSummary();
      setSummary(sum);

      if (!isEmployee) {
        // Load default simulation
        runSimulation();
        // Load saved scenarios
        loadSavedScenarios();
        // Load forecast
        loadForecast(forecastMonths);
        // Load anomalies
        loadAnomalies();
        // Load workflow tasks
        loadWorkflowTasks();
      } else {
        // Employee default: load payslip explanation
        fetchPayslipExplanation();
      }
    } catch (err) {
      console.error('Failed to load intelligence initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Digital Twin Handlers
  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateDigitalTwin({
        base_period_id: 'period_oct_2026',
        department_hikes: deptHikes,
        new_hires: newHires,
        bonus_pool: simBonusPool,
        bonus_department: simBonusDept === 'all' ? undefined : simBonusDept
      });
      setSimulationResult(res);
    } catch (err: any) {
      showNotification('error', err?.message || 'Simulation execution failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const loadSavedScenarios = async () => {
    try {
      const res = await api.getSimulationScenarios();
      setSavedScenarios(res.scenarios || []);
    } catch (err) {
      console.warn('Failed to load saved scenarios', err);
    }
  };

  const handleSaveScenario = async () => {
    if (!simulationResult || !scenarioNameInput.trim()) return;
    setSavingScenario(true);
    try {
      await api.saveSimulationScenario({
        name: scenarioNameInput.trim(),
        description: scenarioDescInput.trim() || undefined,
        base_period_id: 'period_oct_2026',
        simulation_result: simulationResult,
        parameters: {
          department_hikes: deptHikes,
          new_hires: newHires,
          bonus_pool: simBonusPool,
          bonus_department: simBonusDept
        }
      });
      showNotification('success', `Scenario '${scenarioNameInput}' saved to library safely.`);
      setShowSaveModal(false);
      setScenarioNameInput('');
      setScenarioDescInput('');
      loadSavedScenarios();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save simulation scenario');
    } finally {
      setSavingScenario(false);
    }
  };

  const handleDeleteScenario = async (id: string, name: string) => {
    if (!confirm(`Delete scenario '${name}'?`)) return;
    try {
      await api.deleteSimulationScenario(id);
      showNotification('success', `Scenario '${name}' removed.`);
      loadSavedScenarios();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete scenario');
    }
  };

  const addNewHireRow = () => {
    setNewHires([
      ...newHires,
      { designation: 'Full-Stack Developer', department: 'Engineering', monthly_gross: 65000, state: 'Karnataka' }
    ]);
  };

  const removeNewHireRow = (idx: number) => {
    setNewHires(newHires.filter((_, i) => i !== idx));
  };

  // 2. Forecast Handler
  const loadForecast = async (m: number) => {
    setLoadingForecast(true);
    try {
      const res = await api.getPayrollForecast(m);
      setForecastData(res);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to generate payroll forecast');
    } finally {
      setLoadingForecast(false);
    }
  };

  // 3. Anomaly Radar Handler
  const loadAnomalies = async () => {
    try {
      const res = await api.getAnomalyRadar();
      setAnomalyData(res);
      if (res.anomalies?.length > 0 && !selectedAnomaly) {
        setSelectedAnomaly(res.anomalies[0]);
      }
    } catch (err) {
      console.warn('Failed to load anomaly radar', err);
    }
  };

  // 4. Payslip Explanation Handler
  const fetchPayslipExplanation = async (overrideQuery?: string) => {
    setExplaining(true);
    try {
      const q = overrideQuery !== undefined ? overrideQuery : payslipQuery;
      const res = await api.explainPayslip({
        employee_id: isEmployee ? currentUser?.employee_id : payslipEmployeeId,
        current_period_id: currPeriodId,
        comparison_period_id: prevPeriodId,
        question: q
      });
      setExplanationResult(res);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to generate payslip explanation');
    } finally {
      setExplaining(false);
    }
  };

  // 5. Workflow Agent Handlers
  const loadWorkflowTasks = async () => {
    try {
      const res = await api.getWorkflowTasks();
      setWorkflowTasks(res.tasks || []);
    } catch (err) {
      console.warn('Failed to load workflow tasks', err);
    }
  };

  const handleReviewTask = async (taskId: string, action: 'approve' | 'reject') => {
    setReviewingTaskId(taskId);
    try {
      const res = await api.reviewWorkflowTask(taskId, action);
      showNotification('success', `Task marked as ${res.new_status} by ${res.approved_by}`);
      loadWorkflowTasks();
    } catch (err: any) {
      showNotification('error', err?.message || 'Action review failed');
    } finally {
      setReviewingTaskId(null);
    }
  };

  const filteredAnomalies = anomalyData?.anomalies.filter(a => {
    if (anomalyFilter === 'ALL') return true;
    return a.severity === anomalyFilter;
  }) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-md transition-all ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>PREDICTIVE HR & DECISION PLATFORM</span>
              </span>
              <span className="text-xs text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
                Engine v2.6 · Indian Statutory Compliant
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              PayPilot Intelligence Engine
            </h1>
            <p className="text-indigo-200/90 text-sm mt-1 max-w-2xl leading-relaxed">
              Deterministic payroll simulations, forward-looking cost projections with transparent bounds, multi-factor anomaly radar, and explainable employee payslips.
            </p>
          </div>

          {/* Quick Metrics Badge Array */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              <p className="text-xs text-indigo-200 font-medium">Projected Nov 2026</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {summary ? formatINR(summary.next_month_projection.expected_cost) : '₹7,04,175'}
              </p>
              <span className="text-[10px] text-emerald-300 flex items-center mt-0.5">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                +{summary?.next_month_projection.expected_variance_pct || 2.5}% expected
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              <p className="text-xs text-indigo-200 font-medium">Active Radar Alerts</p>
              <p className="text-lg font-bold text-amber-300 mt-0.5">
                {summary?.total_open_anomalies || 5} Flags
              </p>
              <span className="text-[10px] text-amber-200">
                {summary?.anomaly_summary.critical || 2} Critical / Violations
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 col-span-2 sm:col-span-1">
              <p className="text-xs text-indigo-200 font-medium">Pending Approvals</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {summary?.pending_workflow_tasks || 3} Tasks
              </p>
              <span className="text-[10px] text-indigo-300">Human-in-the-Loop</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mt-8 border-b border-white/15 overflow-x-auto scrollbar-none">
          {!isEmployee && (
            <>
              <button
                onClick={() => setActiveTab('digital_twin')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'digital_twin'
                    ? 'border-emerald-400 text-white bg-white/10 shadow-sm'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Payroll Digital Twin</span>
              </button>

              <button
                onClick={() => setActiveTab('forecast')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'forecast'
                    ? 'border-emerald-400 text-white bg-white/10 shadow-sm'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Payroll Forecasting</span>
              </button>

              <button
                onClick={() => setActiveTab('anomalies')}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  activeTab === 'anomalies'
                    ? 'border-emerald-400 text-white bg-white/10 shadow-sm'
                    : 'border-transparent text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Intelligent Anomaly Radar</span>
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded text-[10px]">
                  {summary?.total_open_anomalies || 5}
                </span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('payslip_assistant')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'payslip_assistant'
                ? 'border-emerald-400 text-white bg-white/10 shadow-sm'
                : 'border-transparent text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <BotMessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Explainable Payslip Assistant</span>
          </button>

          {!isEmployee && (
            <button
              onClick={() => setActiveTab('workflow_agent')}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'workflow_agent'
                  ? 'border-emerald-400 text-white bg-white/10 shadow-sm'
                  : 'border-transparent text-indigo-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>HR Workflow Agent</span>
              <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px]">
                {workflowTasks.filter(t => t.status === 'pending_approval').length || 3}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAYROLL DIGITAL TWIN                                              */}
      {/* ========================================================================= */}
      {activeTab === 'digital_twin' && (
        <div className="space-y-6">
          {/* Controls & Parameters Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Simulation Workspace: What-If Model</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Calculates projected payroll costs through the live deterministic engine without altering production records.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={!simulationResult}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Scenario</span>
                </button>
                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isSimulating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isSimulating ? 'Calculating Math...' : 'Run Simulation'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              {/* Department Increments */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Department Salary Increments (%)
                </label>
                {Object.keys(deptHikes).map(dept => (
                  <div key={dept} className="flex items-center justify-between space-x-3">
                    <span className="text-xs font-medium text-gray-700 w-28 truncate">{dept}</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={deptHikes[dept]}
                      onChange={e => setDeptHikes({ ...deptHikes, [dept]: Number(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                    />
                    <span className="text-xs font-bold text-indigo-700 w-10 text-right">
                      {deptHikes[dept]}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Bonus Pool Simulation */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Discretionary Bonus Pool (₹)
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Total Pool Budget</label>
                    <input
                      type="number"
                      step="5000"
                      value={simBonusPool}
                      onChange={e => setSimBonusPool(Number(e.target.value))}
                      className="w-full text-xs font-medium px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Target Department</label>
                    <select
                      value={simBonusDept}
                      onChange={e => setSimBonusDept(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="all">Company-wide Equal Split</option>
                      <option value="Engineering">Engineering Only</option>
                      <option value="Marketing">Marketing Only</option>
                      <option value="Design">Design Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Workforce Expansion Builder */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Planned New Hires ({newHires.length})
                  </label>
                  <button
                    onClick={addNewHireRow}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Hire</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                  {newHires.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4 text-center">No new hires scheduled in this model.</p>
                  ) : (
                    newHires.map((nh, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between text-xs gap-2">
                        <div className="truncate flex-1">
                          <p className="font-semibold text-gray-800 truncate">{nh.designation}</p>
                          <p className="text-[11px] text-gray-500">{nh.department} · {formatINR(nh.monthly_gross)}/mo</p>
                        </div>
                        <button
                          onClick={() => removeNewHireRow(idx)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Variance KPI Cards */}
          {simulationResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Baseline Actual (Oct 2026)</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatINR(simulationResult.baseline_summary.total_cost_ctc)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {simulationResult.baseline_summary.headcount} Staff Members
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projected Simulated Cost</p>
                <p className="text-xl font-bold text-indigo-700 mt-1">
                  {formatINR(simulationResult.simulated_summary.total_cost_ctc)}
                </p>
                <p className="text-xs text-indigo-600 mt-1 font-medium">
                  {simulationResult.simulated_summary.headcount} Staff Members (+{simulationResult.variance.headcount_added})
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Monthly Delta</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xl font-bold text-emerald-700">
                    +{formatINR(simulationResult.variance.cost_delta_monthly)}
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +{simulationResult.variance.cost_delta_pct}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Full statutory deductions included</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Annualized Financial Impact</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  +{formatINR(simulationResult.variance.cost_delta_annualized)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Run-rate expansion over 12 months</p>
              </div>
            </div>
          )}

          {/* Department Breakdown Bar */}
          {simulationResult && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Simulated Cost Impact by Department
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {simulationResult.department_breakdown.map((dept, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800">{dept.department}</span>
                      <span className={`text-xs font-semibold ${dept.delta > 0 ? 'text-indigo-600' : 'text-gray-500'}`}>
                        +{dept.delta_pct}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Baseline: {formatINR(dept.baseline_cost)}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">Simulated: {formatINR(dept.simulated_cost)}</p>
                    {dept.headcount_delta > 0 && (
                      <span className="inline-block mt-2 text-[10px] bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
                        +{dept.headcount_delta} Planned Hire
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Simulated Employee Table */}
          {simulationResult && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Itemized Simulated Compensation & Statutory Math
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Proves EPF (12% ₹1,800 cap), ESI threshold eligibility, Section 115BAC TDS estimation, and PT.
                  </p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                  Zero Production Alterations
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Employee / Role</th>
                      <th className="py-3 px-3">Dept</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3 text-right">Old Gross</th>
                      <th className="py-3 px-3 text-right">New Gross</th>
                      <th className="py-3 px-3 text-right">Basic</th>
                      <th className="py-3 px-3 text-right">EPF (12%)</th>
                      <th className="py-3 px-3 text-right">TDS (Est.)</th>
                      <th className="py-3 px-3 text-right">Simulated Net</th>
                      <th className="py-3 px-4 text-right">Monthly Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {simulationResult.simulated_items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {item.employee_name}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{item.department}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.change_type === 'new_hire'
                              ? 'bg-purple-100 text-purple-700'
                              : item.change_type === 'salary_hike'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.change_type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-500">
                          {formatINR(item.old_gross)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900">
                          {formatINR(item.new_gross)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-600">
                          {formatINR(item.simulated_basic)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-600">
                          {formatINR(item.simulated_pf)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-gray-600">
                          {formatINR(item.simulated_tds)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatINR(item.simulated_net)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                          +{formatINR(item.cost_delta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Saved Scenarios Library */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center space-x-2">
              <Save className="w-4 h-4 text-gray-500" />
              <span>Saved Simulation Scenarios Library</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Authorized scenario models saved by HR & Finance leadership for boardroom appraisal reviews.
            </p>

            {savedScenarios.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No saved simulation scenarios yet.</p>
                <p className="text-[11px] text-gray-400">Click 'Save Scenario' after running a simulation to bookmark it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedScenarios.map((sc) => (
                  <div key={sc.id} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors bg-white shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{sc.name}</h4>
                        {sc.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{sc.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteScenario(sc.id, sc.name)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Baseline</span>
                        <span className="font-semibold text-gray-700">{formatINR(sc.baseline_total_cost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Simulated</span>
                        <span className="font-semibold text-indigo-700">{formatINR(sc.simulated_total_cost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Monthly Delta</span>
                        <span className="font-bold text-emerald-700">+{formatINR(sc.cost_delta)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900">Save Simulation Scenario</h3>
            <p className="text-xs text-gray-500 mt-1">
              Store this projected compensation model separately from live payroll tables for audit review.
            </p>

            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Scenario Name *</label>
                <input
                  type="text"
                  value={scenarioNameInput}
                  onChange={e => setScenarioNameInput(e.target.value)}
                  placeholder="e.g. Q1 2027 Engineering 10% Hike & 2 Hires"
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Description / Assumptions</label>
                <textarea
                  value={scenarioDescInput}
                  onChange={e => setScenarioDescInput(e.target.value)}
                  placeholder="e.g. Approved in preliminary finance committee meeting..."
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScenario}
                disabled={savingScenario || !scenarioNameInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingScenario ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYROLL FORECASTING                                               */}
      {/* ========================================================================= */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Expenditure Forecast with Uncertainty Bounds</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Statistical projection grounded in actual payroll ledger run-rate and scheduled hiring commitments.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">Horizon:</span>
                {[3, 4, 6].map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setForecastMonths(m);
                      loadForecast(m);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      forecastMonths === m
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Projection Chart */}
            <div className="h-72 w-full pt-4">
              {loadingForecast ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Generating statistical forecast...
                </div>
              ) : forecastData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData.forecast_series} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatINR(val), 'Projected Payroll']}
                      contentStyle={{ borderRadius: '0.75rem', borderColor: '#e2e8f0', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper_bound"
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorUpper)"
                      name="Upper Bound (High Uncertainty)"
                    />
                    <Area
                      type="monotone"
                      dataKey="payroll_cost"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCost)"
                      name="Expected Projected Run-rate"
                    />
                    <Line
                      type="monotone"
                      dataKey="lower_bound"
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      dot={false}
                      name="Lower Bound"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>

            {/* Assumptions Box */}
            {forecastData && (
              <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Documented Projection Assumptions</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  {forecastData.assumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTELLIGENT ANOMALY RADAR                                         */}
      {/* ========================================================================= */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Severity Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Severity:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setAnomalyFilter(sev)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    anomalyFilter === sev
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-500">
              Showing {filteredAnomalies.length} unresolved payroll irregularities
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Anomaly Cards List */}
            <div className="lg:col-span-6 space-y-3">
              {filteredAnomalies.map(anom => (
                <div
                  key={anom.id}
                  onClick={() => setSelectedAnomaly(anom)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedAnomaly?.id === anom.id
                      ? 'border-indigo-600 bg-indigo-50/30 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      anom.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : anom.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {anom.severity} · {anom.category}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">{anom.rule_code}</span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mt-2">{anom.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{anom.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-2.5 border-t border-gray-100">
                    <span className="font-medium text-gray-700">{anom.employee_name} ({anom.department})</span>
                    <span className="text-indigo-600 font-semibold flex items-center">
                      Investigate <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Investigation Playbook */}
            <div className="lg:col-span-6">
              {selectedAnomaly ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 sticky top-6 space-y-5">
                  <div className="pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        selectedAnomaly.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedAnomaly.severity} PRIORITY
                      </span>
                      <span className="text-xs font-mono text-gray-400">{selectedAnomaly.rule_code}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-2">{selectedAnomaly.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Target: {selectedAnomaly.employee_name} ({selectedAnomaly.emp_code}) · {selectedAnomaly.department}
                    </p>
                  </div>

                  {/* Observed vs Expected Comparison */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-50/70 rounded-xl border border-red-100">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Observed Value</span>
                      <span className="text-xs font-semibold text-gray-900 mt-1 block">{selectedAnomaly.observed_value}</span>
                    </div>
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Expected / Mandate</span>
                      <span className="text-xs font-semibold text-gray-900 mt-1 block">{selectedAnomaly.expected_value}</span>
                    </div>
                  </div>

                  {/* Narrative Evidence */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Audit Evidence Details</h4>
                    <p className="text-xs text-gray-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedAnomaly.description}
                    </p>
                  </div>

                  {/* Investigation Playbook */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Recommended Resolution Playbook</h4>
                    <ul className="space-y-2">
                      {selectedAnomaly.recommended_investigation_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Status: {selectedAnomaly.status}</span>
                    <button
                      onClick={() => {
                        showNotification('success', `Investigation recorded for ${selectedAnomaly.title}. Audit trail stamped.`);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Mark Remediated
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-400">
                  Select an anomaly item from the left to view the verified resolution playbook.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXPLAINABLE PAYSLIP ASSISTANT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'payslip_assistant' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <BotMessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Explainable Payslip Assistant</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Employees and authorized HR can query the exact mathematical diff between payroll cycles.
                </p>
              </div>

              {/* Period Selectors */}
              <div className="flex items-center space-x-3 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Current Cycle</label>
                  <select
                    value={currPeriodId}
                    onChange={e => setCurrPeriodId(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="period_oct_2026">October 2026</option>
                  </select>
                </div>
                <span className="text-gray-400 mt-3 font-bold">vs</span>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">Prior Baseline</label>
                  <select
                    value={prevPeriodId}
                    onChange={e => setPrevPeriodId(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="period_sep_2026">September 2026</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Query Presets */}
            <div className="pt-4">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                Frequently Asked Variance Questions
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Why is my take-home pay lower this month?',
                  'Explain my Loss of Pay (LOP) calculation',
                  'Why did my TDS tax withholding change?',
                  'Check my Provident Fund (EPF) deduction'
                ].map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setPayslipQuery(preset);
                      fetchPayslipExplanation(preset);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg transition-colors font-medium"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={payslipQuery}
                onChange={e => setPayslipQuery(e.target.value)}
                placeholder="Ask specific question about salary components..."
                className="flex-1 text-xs px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={() => fetchPayslipExplanation()}
                disabled={explaining}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                {explaining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BotMessageSquare className="w-3.5 h-3.5" />}
                <span>{explaining ? 'Analyzing...' : 'Ask Assistant'}</span>
              </button>
            </div>
          </div>

          {/* Explanation Output Container */}
          {explanationResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Mathematical Component Decomposition */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    Component Mathematical Decomposition
                  </h3>
                  <span className="text-xs font-mono font-bold text-gray-600">
                    Net Delta: <span className={explanationResult.net_difference < 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {explanationResult.net_difference < 0 ? '-' : '+'}{formatINR(Math.abs(explanationResult.net_difference))}
                    </span>
                  </span>
                </div>

                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Component</th>
                      <th className="py-2.5 px-3 text-right">Sep 2026</th>
                      <th className="py-2.5 px-3 text-right">Oct 2026</th>
                      <th className="py-2.5 px-4 text-right">Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {explanationResult.components.map((c, i) => (
                      <tr key={i} className={`hover:bg-slate-50 ${c.name.includes('Net') ? 'bg-slate-50/80 font-bold' : ''}`}>
                        <td className="py-2.5 px-4 font-sans text-gray-900">{c.name}</td>
                        <td className="py-2.5 px-3 text-right text-gray-500">{formatINR(c.prev)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-800">{formatINR(c.curr)}</td>
                        <td className={`py-2.5 px-4 text-right font-bold ${
                          c.diff > 0 ? 'text-emerald-700' : c.diff < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {c.diff > 0 ? `+${formatINR(c.diff)}` : c.diff < 0 ? `-${formatINR(Math.abs(c.diff))}` : '₹0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Natural Language Grounded Explanation */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Grounded Explanation</span>
                  </span>
                  {explanationResult.is_ai_synthesized && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                      OpenAI Synthesized
                    </span>
                  )}
                </div>

                <div className="prose prose-xs max-w-none text-xs text-gray-700 leading-relaxed space-y-2 whitespace-pre-line">
                  {explanationResult.grounded_explanation}
                </div>

                <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 italic">
                  Note: Explanations are mathematically constrained by Indian tax code (Sec 115BAC) and EPFO rules.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HR WORKFLOW AGENT                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'workflow_agent' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Autonomous HR Workflow Action Queue</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Prepares onboarding checklists, compliance reminders, and salary changes. Requires explicit authorized human approval before execution.
              </p>
            </div>

            <div className="divide-y divide-gray-100 mt-4">
              {workflowTasks.map(task => (
                <div key={task.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{task.task_type}</span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{task.description}</p>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-gray-700 flex items-start space-x-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Consequential Action:</strong> {task.consequential_action}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {task.status === 'pending_approval' ? (
                      <>
                        <button
                          onClick={() => handleReviewTask(task.id, 'reject')}
                          disabled={reviewingTaskId === task.id}
                          className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReviewTask(task.id, 'approve')}
                          disabled={reviewingTaskId === task.id}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          {reviewingTaskId === task.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Authorize Action</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-gray-800 block">
                          {task.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          by {task.approved_by || 'HR Admin'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
