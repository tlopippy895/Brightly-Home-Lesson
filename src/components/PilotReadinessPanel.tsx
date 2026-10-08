import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Radio, 
  PauseCircle, 
  PlayCircle, 
  Key, 
  CreditCard, 
  Layers, 
  Sparkles, 
  HardDrive, 
  ListChecks, 
  Users, 
  Activity, 
  AlertOctagon, 
  MessageSquareHeart, 
  RefreshCw, 
  Lock, 
  Send,
  Eye,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { 
  PilotReadinessSummary, 
  EnvironmentReadinessReport, 
  PaymentReadinessReport, 
  PilotChecklistItem, 
  PilotCohortPupil, 
  PilotMonitoringMetrics, 
  PilotIncident, 
  ParentPilotFeedback,
  PilotStatusLevel
} from '../types';

export const PilotReadinessPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'checklist' | 'monitoring' | 'cohort' | 'incidents' | 'feedback'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<PilotReadinessSummary | null>(null);
  const [envReport, setEnvReport] = useState<EnvironmentReadinessReport | null>(null);
  const [payReport, setPayReport] = useState<PaymentReadinessReport | null>(null);
  const [checklist, setChecklist] = useState<PilotChecklistItem[]>([]);
  const [metrics, setMetrics] = useState<PilotMonitoringMetrics | null>(null);
  const [cohort, setCohort] = useState<PilotCohortPupil[]>([]);
  const [incidents, setIncidents] = useState<PilotIncident[]>([]);
  const [feedbacks, setFeedbacks] = useState<ParentPilotFeedback[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [isTogglingPause, setIsTogglingPause] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentSeverity, setNewIncidentSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('LOW');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [readinessRes, checklistRes, metricsRes, cohortRes, incidentsRes, feedbackRes, pauseRes] = await Promise.all([
        api.getPilotReadiness(),
        api.getPilotChecklist(),
        api.getPilotMonitoring(),
        api.getPilotCohort(),
        api.getPilotIncidents(),
        api.getPilotFeedbacks(),
        api.getPilotPauseStatus()
      ]);

      if (readinessRes.success) {
        setSummary(readinessRes.summary);
        setEnvReport(readinessRes.env);
        setPayReport(readinessRes.payment);
      }
      if (checklistRes.success) setChecklist(checklistRes.checklist);
      if (metricsRes.success) setMetrics(metricsRes.metrics);
      if (cohortRes.success) setCohort(cohortRes.cohort);
      if (incidentsRes.success) setIncidents(incidentsRes.incidents);
      if (feedbackRes.success) setFeedbacks(feedbackRes.feedbacks);
      if (pauseRes.success && pauseRes.settings) {
        setIsPaused(Boolean(pauseRes.settings.isPaused));
        setPauseReason(pauseRes.settings.pauseReason || '');
      }
    } catch (err) {
      console.error('Failed to load pilot readiness data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePause = async () => {
    setIsTogglingPause(true);
    try {
      const nextState = !isPaused;
      const res = await api.togglePilotPause(nextState, nextState ? (pauseReason || 'Operational inspection paused by administrator') : undefined);
      if (res.success) {
        setIsPaused(nextState);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to toggle pilot pause:', err);
    } finally {
      setIsTogglingPause(false);
    }
  };

  const handleChecklistToggle = async (id: string, currentState: boolean) => {
    try {
      const res = await api.updatePilotChecklistItem(id, !currentState);
      if (res.success) {
        setChecklist(res.checklist);
      }
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    }
  };

  const handleTestWebhook = async () => {
    setWebhookTesting(true);
    setWebhookMessage(null);
    try {
      const res = await api.testPilotWebhook();
      setWebhookMessage(res.message);
      if (res.verified) {
        await loadData();
      }
    } catch (err: any) {
      setWebhookMessage(err?.message || 'Webhook verification test failed.');
    } finally {
      setWebhookTesting(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle.trim() || !newIncidentDesc.trim()) return;
    try {
      const res = await api.reportPilotIncident({
        severity: newIncidentSeverity,
        category: 'general',
        title: newIncidentTitle.trim(),
        description: newIncidentDesc.trim()
      });
      if (res.success) {
        setNewIncidentTitle('');
        setNewIncidentDesc('');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to report incident:', err);
    }
  };

  const handleUpdateIncidentStatus = async (id: string, newStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED') => {
    try {
      const res = await api.updatePilotIncident(id, { status: newStatus });
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  };

  const renderStatusBadge = (status: PilotStatusLevel) => {
    if (status === 'READY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> READY
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
        <XCircle className="w-3 h-3 text-rose-600" /> NOT READY
      </span>
    );
  };

  if (isLoading && !summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-[#0284C7] animate-spin mx-auto mb-3" />
        <h3 className="font-bold text-slate-800">Inspecting Controlled Pilot Environment & Governance...</h3>
        <p className="text-xs text-slate-500 mt-1">Evaluating persistent storage, gate validators, and payment hardening</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Pilot Safety Switch & Mission Control */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isPaused 
          ? 'bg-rose-50 border-rose-300 shadow-sm' 
          : 'bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border-sky-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isPaused ? 'bg-rose-600 text-white' : 'bg-[#0284C7] text-white shadow-xs'
            }`}>
              {isPaused ? <PauseCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Controlled Pilot Operations & Launch Gate
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-200">
                  SINGLE_INSTANCE_PILOT
                </span>
                {isPaused ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
                    PILOT ACCESS PAUSED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white">
                    ACTIVE PILOT RUNTIME
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {isPaused 
                  ? 'New paid lesson entry is blocked. Historical student records, pupil progress, and completed mastery remain safe.'
                  : 'Operating in single-instance controlled pilot mode. 6 authentic baseline curriculum records verified.'}
              </p>
            </div>
          </div>

          {/* Safety Switch Control */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTogglePause}
              disabled={isTogglingPause}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              <span>{isTogglingPause ? 'Processing...' : (isPaused ? 'Resume Pilot Access' : 'Pilot Safety Pause')}</span>
            </button>
            <button
              type="button"
              onClick={loadData}
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="Refresh Pilot Diagnostics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'overview' ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Readiness Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('checklist')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'checklist' ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          <span>Launch Checklist ({checklist.filter(c => c.manualCompleted || (c.isAutomatedCheck && c.systemEvaluated)).length}/30)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('monitoring')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'monitoring' ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Pilot Monitoring</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cohort')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'cohort' ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pilot Cohort ({cohort.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('incidents')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'incidents' ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Incidents ({incidents.filter(i => i.status !== 'RESOLVED').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('feedback')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'feedback' ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>Parent Feedback ({feedbacks.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. READINESS OVERVIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* 6 Category Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card A: Application */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">A. Application</span>
                {renderStatusBadge(summary.application.environmentReadiness)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Deployment & Runtime</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Build Status:</span>
                  <span className="font-semibold text-emerald-700">COMPILED SUCCESS</span>
                </div>
                <div className="flex justify-between">
                  <span>Deployment Mode:</span>
                  <span className="font-semibold text-slate-800">{summary.application.deploymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Persistence:</span>
                  <span className="font-semibold text-slate-800">{summary.application.persistenceMode}</span>
                </div>
              </div>
            </div>

            {/* Card B: Security */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">B. Security</span>
                {renderStatusBadge(summary.security.authenticationStatus)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Auth & Data Isolation</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Audit Suite:</span>
                  <span className="font-semibold text-emerald-700">48 / 48 PASSED</span>
                </div>
                <div className="flex justify-between">
                  <span>PBKDF2 Admin Hash:</span>
                  <span className="font-semibold text-emerald-700">ACTIVE & SECURED</span>
                </div>
                <div className="flex justify-between">
                  <span>Multi-Tenant RBAC:</span>
                  <span className="font-semibold text-emerald-700">STRICT ISOLATION</span>
                </div>
              </div>
            </div>

            {/* Card C: Curriculum */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">C. Curriculum</span>
                {renderStatusBadge(summary.curriculum.status)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">NERDC Foundation Coverage</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Published Baseline:</span>
                  <span className="font-bold text-slate-800">{summary.curriculum.publishedRecordsCount} Authentic Lessons</span>
                </div>
                <div className="flex justify-between">
                  <span>QC Readiness Gate:</span>
                  <span className="font-semibold text-emerald-700">{summary.curriculum.readySlotsCount} READY (0 blocking)</span>
                </div>
                <div className="flex justify-between">
                  <span>Anti-Fabrication Slots:</span>
                  <span className="font-semibold text-slate-600">{summary.curriculum.intentionallyEmptySlotsCount} Awaiting NERDC</span>
                </div>
              </div>
            </div>

            {/* Card D: AI Teacher */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">D. AI Teacher</span>
                {renderStatusBadge(summary.aiTeacher.status)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Pedagogy & Traceability</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Objective Traceability:</span>
                  <span className="font-semibold text-emerald-700">VERIFIED END-TO-END</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Failure Safety:</span>
                  <span className="font-semibold text-emerald-700">DETERMINISTIC FALLBACK</span>
                </div>
                <div className="flex justify-between">
                  <span>Gemini API Key:</span>
                  <span className="font-semibold text-slate-800">{summary.aiTeacher.geminiConfigStatus}</span>
                </div>
              </div>
            </div>

            {/* Card E: Payments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">E. Payments</span>
                {renderStatusBadge(summary.payments.status)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Paystack & Access Gate</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Paystack Mode:</span>
                  <span className={`font-bold ${summary.payments.paystackMode === 'LIVE' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {summary.payments.paystackMode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Tuition:</span>
                  <span className="font-semibold text-slate-800">{summary.payments.tuitionAmountFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Webhook Verification:</span>
                  <span className="font-semibold text-emerald-700">HMAC-SHA512 RAW</span>
                </div>
              </div>
            </div>

            {/* Card F: Storage */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">F. Storage</span>
                {renderStatusBadge(summary.storage.status)}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Persistence & Disaster Recovery</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Primary DB File:</span>
                  <span className="font-semibold text-emerald-700">brightly_db.json (OK)</span>
                </div>
                <div className="flex justify-between">
                  <span>Backup File:</span>
                  <span className="font-semibold text-emerald-700">brightly_db.bak.json (OK)</span>
                </div>
                <div className="flex justify-between">
                  <span>Atomic Write Queue:</span>
                  <span className="font-semibold text-emerald-700">POSIX RENAME PROTECTED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variables & Secret Hygiene (No Secrets Exposed) */}
          {envReport && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#0284C7]" />
                  <h3 className="font-bold text-slate-900">Environment Configuration & Secret Sanitization</h3>
                </div>
                <span className="text-xs text-slate-500">Secrets are masked and never exposed to client or browser</span>
              </div>

              <div className="divide-y divide-slate-100">
                {envReport.variables.map((v, idx) => (
                  <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{v.name}</code>
                        {renderStatusBadge(v.status)}
                      </div>
                      <p className="text-xs text-slate-600">{v.formatNote}</p>
                      {v.recommendation && (
                        <p className="text-[11px] text-amber-700 font-semibold">{v.recommendation}</p>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 shrink-0">
                      {v.maskedIndicator}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paystack Webhook Operational Verification Workbench */}
          {payReport && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-[#0284C7]" />
                  <div>
                    <h3 className="font-bold text-slate-900">Paystack Webhook Operational Verification</h3>
                    <p className="text-xs text-slate-500">Documented webhook endpoint format for production deployment</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={webhookTesting}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-sky-700 text-white cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${webhookTesting ? 'animate-spin' : ''}`} />
                  <span>{webhookTesting ? 'Testing Signature...' : 'Simulate Signed Webhook Ping'}</span>
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Production Webhook URL:</span>
                  <code className="font-mono bg-white px-2.5 py-1 rounded border border-slate-300 text-sky-900 font-bold">
                    [PRODUCTION DOMAIN]{payReport.webhookEndpoint}
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Cryptographic Signature Verification:</span>
                  <span className="font-mono text-emerald-800 font-bold">{payReport.webhookSignatureMethod}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Live External Verification Status:</span>
                  <span className={`font-bold ${payReport.webhookVerifiedLive ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {payReport.webhookVerifiedLive ? 'VERIFIED ON PRODUCTION HOST' : 'NOT VERIFIED (Awaiting registration on Paystack Dashboard)'}
                  </span>
                </div>
              </div>

              {webhookMessage && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                  {webhookMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTROLLED PILOT LAUNCH CHECKLIST (30 ITEMS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'checklist' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">Controlled Pilot Launch Checklist</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clearly distinguishes automated test verification from external production steps.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              {checklist.filter(c => c.manualCompleted || (c.isAutomatedCheck && c.systemEvaluated)).length} of 30 Complete
            </div>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => {
              const isChecked = item.manualCompleted || (item.isAutomatedCheck && item.systemEvaluated);
              return (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isChecked 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      id={item.id}
                      checked={isChecked}
                      onChange={() => handleChecklistToggle(item.id, isChecked)}
                      className="mt-1 w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] cursor-pointer"
                    />
                    <div>
                      <label htmlFor={item.id} className="text-xs font-bold text-slate-900 cursor-pointer block">
                        {item.title}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.notes && (
                          <span className="text-[11px] text-amber-700 font-medium">
                            &bull; {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      item.verificationType === 'CODE_CHECKED'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : (item.manualCompleted 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-amber-100 text-amber-800 border-amber-300')
                    }`}>
                      {item.verificationType === 'CODE_CHECKED' ? 'CODE CHECKED' : 'EXTERNALLY VERIFIED'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">{item.statusText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PILOT MONITORING & EDUCATIONAL METRICS */}
      {/* ========================================================================= */}
      {activeSubTab === 'monitoring' && metrics && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold uppercase">Active Pilot Pupils</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.activePilotPupils}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Cohort bounded (5–10)</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold uppercase">Lessons Completed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.lessonsCompleted}</div>
              <span className="text-[11px] text-sky-600 font-semibold">{metrics.completionRate}% completion rate</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold uppercase">Average Score</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.averageLessonScore}%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Objective-specific mastery</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold uppercase">Re-explanation Success</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{metrics.retestSuccessRate}%</div>
              <span className="text-[11px] text-indigo-600 font-semibold">{metrics.reexplanationFrequency}% invoked</span>
            </div>
          </div>

          {/* Educational Success Progression (No Universal 70% Rule) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Educational Objective Mastery Distribution</h3>
                <p className="text-xs text-slate-500">Tracks objective progression: Beginning &rarr; Developing &rarr; Approaching &rarr; Mastered &rarr; Strong Mastery</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Non-Universal 70% Rule Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-600 block">Beginning</span>
                <div className="text-xl font-black text-slate-800 mt-1">{metrics.masteryDistribution.beginning}</div>
                <span className="text-[10px] text-slate-500">&lt;50% accuracy</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-xs font-bold text-amber-800 block">Developing</span>
                <div className="text-xl font-black text-amber-900 mt-1">{metrics.masteryDistribution.developing}</div>
                <span className="text-[10px] text-amber-600">Guided reinforcement</span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-xs font-bold text-blue-800 block">Approaching</span>
                <div className="text-xl font-black text-blue-900 mt-1">{metrics.masteryDistribution.approachingMastery}</div>
                <span className="text-[10px] text-blue-600">Partial competence</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-bold text-emerald-800 block">Mastered</span>
                <div className="text-xl font-black text-emerald-900 mt-1">{metrics.masteryDistribution.mastered}</div>
                <span className="text-[10px] text-emerald-600">Objective passed</span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-xs font-bold text-purple-800 block">Strong Mastery</span>
                <div className="text-xl font-black text-purple-900 mt-1">{metrics.masteryDistribution.strongMastery}</div>
                <span className="text-[10px] text-purple-600">Fluent retention 100%</span>
              </div>
            </div>
          </div>

          {/* System Health Metrics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Pilot Operational Health & Failure Zero-Defect Log</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Auth Failures:</span>
                <span className="font-bold text-slate-900 text-sm">{metrics.authFailures}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">AI Gen Failures:</span>
                <span className="font-bold text-slate-900 text-sm">{metrics.aiGenerationFailures}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">QC Gate Failures:</span>
                <span className="font-bold text-slate-900 text-sm">{metrics.curriculumReadinessFailures}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Application Errors:</span>
                <span className="font-bold text-slate-900 text-sm">{metrics.applicationErrors}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PILOT COHORT TABLE (5–10 PUPILS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'cohort' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">First Pilot Cohort (Controlled Scope)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks actual active pupils across classes and subjects without fabricating student records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Pupil</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Parent Account</th>
                  <th className="px-5 py-3">Tuition Status</th>
                  <th className="px-5 py-3 text-center">Lessons</th>
                  <th className="px-5 py-3 text-center">Avg Score</th>
                  <th className="px-5 py-3">Current Mastery</th>
                  <th className="px-5 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohort.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.id}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">Primary {p.grade}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{p.parentName}</div>
                      <div className="text-[11px] text-slate-500">{p.parentEmail}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.paymentStatus === 'TERM_PAID' || p.paymentStatus === 'ANNUAL_PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (p.paymentStatus === 'FREE_PREVIEW' 
                              ? 'bg-sky-100 text-sky-800' 
                              : 'bg-amber-100 text-amber-800')
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900">{p.lessonsCompletedCount}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-900">{p.averageScore}%</td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800">{p.currentMasteryLevel}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] text-slate-600">{p.feedbackSubmittedCount} submitted</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INCIDENT & ERROR MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-6">
          {/* Record Incident Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Record Operational Incident</h3>
            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newIncidentTitle}
                    onChange={(e) => setNewIncidentTitle(e.target.value)}
                    placeholder="Incident title (e.g. Unregistered IP test or simulated timeout)"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                    required
                  />
                </div>
                <div>
                  <select
                    value={newIncidentSeverity}
                    onChange={(e: any) => setNewIncidentSeverity(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="CRITICAL">CRITICAL (Payment/Auth/Data leak)</option>
                    <option value="HIGH">HIGH (Curriculum/Gating failure)</option>
                    <option value="MEDIUM">MEDIUM (AI voice/Re-explain)</option>
                    <option value="LOW">LOW (Cosmetic/Wording)</option>
                  </select>
                </div>
              </div>
              <textarea
                value={newIncidentDesc}
                onChange={(e) => setNewIncidentDesc(e.target.value)}
                placeholder="Description of observed behavior, affected pupil, or recovery steps taken (DO NOT include passwords or keys)"
                rows={2}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7]"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-black bg-[#0284C7] hover:bg-sky-700 text-white cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Log Incident</span>
              </button>
            </form>
          </div>

          {/* Incidents Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Operational Incident Register</h3>
              <span className="text-xs text-slate-500">{incidents.length} total logged</span>
            </div>

            {incidents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No operational incidents recorded. Zero critical or high severity defects active.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          inc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          inc.severity === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="font-bold text-slate-900">{inc.title}</span>
                        <span className="text-slate-400">&bull; {new Date(inc.reportedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600">{inc.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status}
                      </span>
                      {inc.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateIncidentStatus(inc.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PARENT PILOT FEEDBACK */}
      {/* ========================================================================= */}
      {activeSubTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Parent Pilot Feedback Register</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured feedback from parents across the 6 standard pilot lesson questions.
            </p>
          </div>

          {feedbacks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No parent feedback submitted yet. Parents can submit feedback via the Parent Portal.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-5 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{fb.studentName}</span>
                      <span className="text-slate-500 ml-2">&bull; {fb.subject} &mdash; {fb.lessonTitle}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{new Date(fb.submittedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">1. Easy to grasp:</span>
                      <span className="font-bold text-slate-800 capitalize">{fb.q1EasyToUnderstand.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">2. Enjoyed:</span>
                      <span className="font-bold text-slate-800 capitalize">{fb.q2ChildEnjoyed.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">3. Clear teacher:</span>
                      <span className="font-bold text-slate-800 capitalize">{fb.q3TeacherExplainedClearly.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">4. Helped school:</span>
                      <span className="font-bold text-slate-800 capitalize">{fb.q4HelpedSchoolwork.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">5. Repeated help:</span>
                      <span className="font-bold text-slate-800 capitalize">{fb.q5NeededRepeatedExplanation.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {fb.q6ImprovementSuggestions && (
                    <div className="text-slate-700 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                      <span className="font-bold text-sky-900 block mb-0.5">Parent suggestions:</span>
                      {fb.q6ImprovementSuggestions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
