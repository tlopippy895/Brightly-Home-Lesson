import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Users, 
  BarChart3, 
  FileText, 
  Plus, 
  Edit3, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Image as ImageIcon, 
  ArrowRight, 
  ChevronRight,
  HelpCircle,
  Check,
  X,
  UploadCloud,
  RefreshCw,
  Eye,
  Calendar,
  Award,
  Receipt,
  FileCheck,
  Compass,
  ListOrdered
} from 'lucide-react';
import { 
  GradeLevel, 
  SubjectName, 
  LessonTopic, 
  StudentProfile, 
  ConcreteVisualAid, 
  TeachingAidType, 
  UserRole, 
  TermPaymentRecord,
  CurriculumRecord,
  PublishingStatus,
  TeachingAidRecord,
  QuestionRecord,
  CurriculumCoverageStat
} from '../types';
import { CURRICULUM_DATA, NATIONAL_CURRICULUM_LESSONS } from '../data/curriculum';
import { ALL_CORE_SUBJECTS, CURRICULUM_VERSION_METADATA } from '../data/curriculumHierarchy';
import { NIGERIAN_TEACHERS } from '../data/teachers';
import { api } from '../services/api';

interface AdminDashboardViewProps {
  students: StudentProfile[];
  onClose?: () => void;
  onSelectLessonForPreview?: (lesson: LessonTopic) => void;
  currentRole?: UserRole | null;
  onAuthenticatedAsAdmin?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  students,
  onClose,
  onSelectLessonForPreview,
  currentRole,
  onAuthenticatedAsAdmin,
}) => {
  // Admin Authentication State (Backed by Server Session Token)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    currentRole === 'admin' && Boolean(api.getSessionToken())
  );
  const [adminEmail, setAdminEmail] = useState('admin@brightly.ng');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'overview' | 'explorer' | 'aids' | 'questions' | 'import' | 'operations'>('overview');

  // Backend Data State
  const [coverageData, setCoverageData] = useState<any>(null);
  const [curriculumRecords, setCurriculumRecords] = useState<CurriculumRecord[]>([]);
  const [teachingAids, setTeachingAids] = useState<TeachingAidRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [adminPayments, setAdminPayments] = useState<TermPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Explorer Cascading Filter State
  const [explorerClass, setExplorerClass] = useState<GradeLevel>(4);
  const [explorerSubject, setExplorerSubject] = useState<SubjectName>('Mathematics');
  const [explorerTerm, setExplorerTerm] = useState<number>(1);
  const [explorerWeek, setExplorerWeek] = useState<number>(1);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<CurriculumRecord> | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Detail Inspector Modal State
  const [inspectingRecord, setInspectingRecord] = useState<CurriculumRecord | null>(null);

  // Import Staging Tool State
  const [importDocTitle, setImportDocTitle] = useState('NERDC Basic Education Curriculum - Phase 2');
  const [importDocRef, setImportDocRef] = useState('NERDC-BEC-2024-VOL-02');
  const [importPayloadJson, setImportPayloadJson] = useState('');
  const [importPreviewResult, setImportPreviewResult] = useState<any>(null);

  // Load backend curriculum data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [covRes, currRes, aidsRes, qRes, payRes] = await Promise.all([
        api.getCurriculumCoverage(),
        api.getCurriculumRecords(),
        api.getTeachingAids(),
        api.getQuestions(),
        api.getAdminPayments()
      ]);

      if (covRes && covRes.success && covRes.coverage) {
        setCoverageData(covRes.coverage);
      }
      if (currRes && currRes.success && currRes.records) {
        setCurriculumRecords(currRes.records);
      }
      if (aidsRes && aidsRes.success && aidsRes.aids) {
        setTeachingAids(aidsRes.aids);
      }
      if (qRes && qRes.success && qRes.questions) {
        setQuestions(qRes.questions);
      }
      if (payRes && payRes.success && payRes.payments) {
        setAdminPayments(payRes.payments);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentRole === 'admin' && api.getSessionToken()) {
      setIsAdminAuthenticated(true);
    }
  }, [currentRole]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadData();
    }
  }, [isAdminAuthenticated]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const res = await api.loginAdmin(adminEmail, adminPassword);
      if (res.success && res.token) {
        setIsAdminAuthenticated(true);
        if (onAuthenticatedAsAdmin) {
          onAuthenticatedAsAdmin();
        }
      } else {
        setAuthError(res.message || 'Invalid administrator credentials. Access denied.');
      }
    } catch {
      setAuthError('Connection error during administrator authentication.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Find exact matching curriculum record for the cascading explorer
  const matchedExplorerRecord = curriculumRecords.find(
    r => r.grade === explorerClass && 
         r.subject === explorerSubject && 
         r.term === explorerTerm && 
         r.week === explorerWeek
  );

  // Workflow transition handler
  const handleTransitionWorkflow = async (recordId: string, newStatus: PublishingStatus) => {
    try {
      const res = await api.transitionPublishingWorkflow(recordId, newStatus, 'Administrator (Curriculum Control)');
      if (res && res.success && res.record) {
        setStatusMessage({ type: 'success', text: `Status updated to ${newStatus} for ${res.record.topic}.` });
        await loadData();
        if (inspectingRecord && inspectingRecord.id === recordId) {
          setInspectingRecord(res.record);
        }
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Workflow transition failed.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Workflow transition failed.' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Open Editor for Creating New
  const handleOpenCreateModal = (defaultGrade?: GradeLevel, defaultSubject?: SubjectName, defaultTerm?: number, defaultWeek?: number) => {
    setIsCreatingNew(true);
    setEditingRecord({
      grade: defaultGrade || explorerClass,
      subject: defaultSubject || explorerSubject,
      term: (defaultTerm || explorerTerm) as 1 | 2 | 3,
      week: defaultWeek || explorerWeek,
      topic: '',
      subtopic: '',
      theme: 'Universal Basic Education Core Scheme',
      competencies: ['Knowledge Application', 'Problem Solving'],
      objectives: ['Understand core concepts according to NERDC guidelines.'],
      contentOutline: '',
      learningActivities: ['Direct teacher instruction', 'Guided concrete practice'],
      teachingResources: ['Chalkboard', 'Concrete visual aids'],
      isFree: (defaultWeek || explorerWeek) === 1,
      teacherId: 'ibrahim',
      publishingStatus: 'DRAFT',
      curriculumVersion: 'nerdc-based-v1',
      sourceDocument: 'NERDC Scheme of Work for Basic Education',
      sourceReference: 'NERDC Primary Curriculum Framework'
    });
    setIsEditorOpen(true);
  };

  // Open Editor for Existing
  const handleOpenEditModal = (record: CurriculumRecord) => {
    setIsCreatingNew(false);
    setEditingRecord({ ...record });
    setIsEditorOpen(true);
  };

  // Save Curriculum Record (Create or Update)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editingRecord.topic || !editingRecord.grade || !editingRecord.subject || !editingRecord.term || !editingRecord.week) {
      alert('Please fill all required fields: Grade, Subject, Term, Week, and Topic.');
      return;
    }

    try {
      if (isCreatingNew) {
        const res = await api.createCurriculumRecord(editingRecord);
        if (res && res.success) {
          setStatusMessage({ type: 'success', text: 'New draft curriculum record created successfully!' });
          setIsEditorOpen(false);
          await loadData();
        } else {
          alert(res.message || 'Failed to create record.');
        }
      } else if (editingRecord.id) {
        const res = await api.updateCurriculumRecord(editingRecord.id, editingRecord);
        if (res && res.success) {
          setStatusMessage({ type: 'success', text: 'Curriculum record updated successfully!' });
          setIsEditorOpen(false);
          await loadData();
          if (inspectingRecord && inspectingRecord.id === editingRecord.id) {
            setInspectingRecord(res.record || null);
          }
        } else {
          alert(res.message || 'Failed to update record.');
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Save failed.');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Import preview handler
  const handleTestImportPreview = async () => {
    if (!importPayloadJson.trim()) {
      alert('Please paste valid JSON curriculum entries to preview.');
      return;
    }
    try {
      const parsed = JSON.parse(importPayloadJson);
      const res = await api.previewCurriculumImport({
        documentTitle: importDocTitle,
        documentReference: importDocRef,
        entries: Array.isArray(parsed) ? parsed : [parsed]
      });
      setImportPreviewResult(res);
    } catch (err: any) {
      alert('Invalid JSON: ' + err.message);
    }
  };

  // If not yet authenticated, render the Admin Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[520px] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] border-2 border-slate-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0284C7] text-white flex items-center justify-center text-2xl mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-[#0284C7] bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Admin & Governance Security Gate
            </span>
            <h2 className="text-xl font-black text-slate-900 uppercase font-display">
              Administrator Login
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Authenticated access to the NERDC curriculum management system, scheme of work controls, and teaching aids library.
            </p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Administrator Email:
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setAuthError(null);
                }}
                placeholder="admin@brightly.ng"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Administrator Password:
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder="Enter administrator password..."
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-[#0284C7]"
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? 'Authenticating...' : 'Unlock Admin Console'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            Authorized Curriculum Director account: <strong className="text-slate-800 font-mono">admin@brightly.ng</strong>
          </p>
        </div>
      </div>
    );
  }

  // Derive active coverage numbers from backend data (or fallback to local records)
  const totalRecords = coverageData?.totalRecords ?? curriculumRecords.length;
  const publishedCount = coverageData?.publishedCount ?? curriculumRecords.filter(r => r.publishingStatus === 'PUBLISHED').length;
  const underReviewCount = coverageData?.underReviewCount ?? curriculumRecords.filter(r => r.publishingStatus === 'UNDER_REVIEW').length;
  const draftCount = coverageData?.draftCount ?? curriculumRecords.filter(r => r.publishingStatus === 'DRAFT').length;
  const totalAidsCount = coverageData?.totalTeachingAids ?? teachingAids.length;
  const totalQuestionsCount = coverageData?.totalQuestionsAvailable ?? questions.length;

  return (
    <div id="admin-dashboard-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Status Alert Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
            : 'bg-red-50 text-red-900 border border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Admin Header - Clean Sky Blue Administrative Theme */}
      <div className="bg-white border-2 border-sky-300 text-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#0284C7] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              Curriculum Control Active
            </span>
            <span className="text-xs text-slate-800 font-black font-mono">
              Based on the Nigerian NERDC Curriculum ({CURRICULUM_VERSION_METADATA.id})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-[#0284C7]">
            BRIGHTLY CURRICULUM & OPERATIONS MANAGEMENT
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-3xl">
            Manage authentic Primary 1–6 curriculum schemes, teaching aids, questions bank, and publication approvals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Record</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdminAuthenticated(false)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Lock Admin
          </button>
        </div>
      </div>

      {/* Curriculum Safety & Regulatory Transparency Banner */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black uppercase tracking-wide text-[11px] block text-amber-900">
              NERDC Curriculum Safety Standard
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              Brightly Home Lesson displays <strong>only authentic curriculum records</strong>. Missing weeks and subjects are marked <strong>NOT AVAILABLE</strong> until official NERDC source documents are formally reviewed. AI enhances explanations, but never silently invents curriculum structure.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setAdminTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'overview'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Curriculum Overview & Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('explorer')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'explorer'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Scheme of Work & Weekly Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('aids')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'aids'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Teaching Aids Library ({totalAidsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'questions'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Questions & Assessment Bank ({totalQuestionsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('import')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'import'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Curriculum Import Foundation</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('operations')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'operations'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pupils & Verified Payments</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW & CURRICULUM COVERAGE MATRIX */}
      {/* ========================================================================= */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Curriculum</span>
              <div className="text-2xl font-black text-slate-900 font-display">{totalRecords} Records</div>
              <span className="text-[10px] font-bold text-slate-500">Across Primary 1–6</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Published</span>
              <div className="text-2xl font-black text-[#026838] font-display">{publishedCount} Live</div>
              <span className="text-[10px] font-bold text-emerald-600">Active in Classroom</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Under Review</span>
              <div className="text-2xl font-black text-amber-600 font-display">{underReviewCount} Records</div>
              <span className="text-[10px] font-bold text-amber-700">QA Verification</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Drafts</span>
              <div className="text-2xl font-black text-slate-600 font-display">{draftCount} Records</div>
              <span className="text-[10px] font-bold text-slate-400">Not visible to pupils</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Teaching Aids</span>
              <div className="text-2xl font-black text-[#0284C7] font-display">{totalAidsCount} Items</div>
              <span className="text-[10px] font-bold text-sky-700">Concrete & Diagrams</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Questions Bank</span>
              <div className="text-2xl font-black text-indigo-700 font-display">{totalQuestionsCount} Items</div>
              <span className="text-[10px] font-bold text-indigo-600">Practice & Mastery</span>
            </div>
          </div>

          {/* Primary 1–6 Coverage Status Cards */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0284C7] tracking-wider block">
                Class Scheme Coverage (Primary 1–6)
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                National Curriculum Availability by Grade Level
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map(grade => {
                const gradeRecords = curriculumRecords.filter(r => r.grade === grade);
                const isPopulated = gradeRecords.length > 0;
                return (
                  <div 
                    key={grade} 
                    className={`p-5 rounded-2xl border ${
                      isPopulated 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-slate-50/70 border-slate-200'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 uppercase">Primary {grade}</h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isPopulated 
                          ? 'bg-[#026838] text-white' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isPopulated ? `${gradeRecords.length} Records Active` : 'Awaiting Curriculum'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      {isPopulated ? (
                        <>
                          <div className="font-medium text-slate-700">
                            Available: <strong className="text-emerald-800">Yes ({gradeRecords.length} verified lessons)</strong>
                          </div>
                          <div className="text-slate-500">
                            Subjects covered: {Array.from(new Set(gradeRecords.map(r => r.subject))).join(', ')}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-slate-500">
                            Available: <strong className="text-slate-700">No</strong>
                          </div>
                          <div className="text-slate-400 italic">
                            Awaiting official NERDC syllabus source material.
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setExplorerClass(grade);
                          setAdminTab('explorer');
                        }}
                        className="text-[#0284C7] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Scheme</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(grade)}
                        className="text-slate-600 font-bold hover:text-slate-900 cursor-pointer"
                      >
                        + Add Record
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* National Coverage Matrix Table */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase font-display">
                  National Curriculum Scheme Matrix
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Showing exact existence and review status across all 6 core subjects and classes.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                Universal Basic Education Framework
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Term</th>
                    <th className="py-2.5 px-3">Populated Weeks</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {([1, 2, 3, 4, 5, 6] as GradeLevel[]).flatMap(grade => 
                    ALL_CORE_SUBJECTS.map(subject => {
                      const matched = curriculumRecords.filter(r => r.grade === grade && r.subject === subject);
                      const isAvailable = matched.length > 0;
                      const status: PublishingStatus = isAvailable 
                        ? (matched[0].publishingStatus || 'PUBLISHED')
                        : 'NOT_AVAILABLE';

                      return (
                        <tr key={`${grade}-${subject}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">Primary {grade}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{subject}</td>
                          <td className="py-3 px-3 font-medium text-slate-600">Term 1</td>
                          <td className="py-3 px-3 font-mono">
                            {isAvailable ? matched.map(m => `Wk ${m.week}`).join(', ') : 'None'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              status === 'PUBLISHED' 
                                ? 'bg-emerald-100 text-[#026838]' 
                                : status === 'APPROVED'
                                ? 'bg-blue-100 text-blue-800'
                                : status === 'UNDER_REVIEW'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'DRAFT'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {status === 'NOT_AVAILABLE' ? 'NOT AVAILABLE' : status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isAvailable ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setExplorerClass(grade);
                                  setExplorerSubject(subject);
                                  setExplorerTerm(matched[0].term);
                                  setExplorerWeek(matched[0].week);
                                  setAdminTab('explorer');
                                }}
                                className="text-[#0284C7] font-bold hover:underline cursor-pointer"
                              >
                                View Record
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenCreateModal(grade, subject, 1, 1)}
                                className="text-slate-400 hover:text-[#0284C7] font-bold cursor-pointer"
                              >
                                + Add Draft
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SCHEME OF WORK & WEEKLY EXPLORER */}
      {/* ========================================================================= */}
      {adminTab === 'explorer' && (
        <div className="space-y-6">
          {/* Cascading Filter Bar */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black uppercase text-[#0284C7] tracking-wider block">
                NERDC Cascading Scheme Explorer
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Select Class, Subject, Term and Week
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Select Class */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Class / Grade:</label>
                <select
                  value={explorerClass}
                  onChange={(e) => setExplorerClass(Number(e.target.value) as GradeLevel)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#0284C7]"
                >
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <option key={g} value={g}>Primary {g}</option>
                  ))}
                </select>
              </div>

              {/* Select Subject */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Subject (Core 6):</label>
                <select
                  value={explorerSubject}
                  onChange={(e) => setExplorerSubject(e.target.value as SubjectName)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#0284C7]"
                >
                  {ALL_CORE_SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Select Term */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Term:</label>
                <select
                  value={explorerTerm}
                  onChange={(e) => setExplorerTerm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#0284C7]"
                >
                  <option value={1}>First Term</option>
                  <option value={2}>Second Term</option>
                  <option value={3}>Third Term</option>
                </select>
              </div>

              {/* Select Week */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Week Number (1–12):</label>
                <select
                  value={explorerWeek}
                  onChange={(e) => setExplorerWeek(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#0284C7]"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Result Card: Exists or Not Available */}
          {matchedExplorerRecord ? (
            /* RECORD EXISTS: FULL HIERARCHY PRESENTATION */
            <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-[#0284C7] text-white rounded">
                      Primary {matchedExplorerRecord.grade} • Term {matchedExplorerRecord.term} • Week {matchedExplorerRecord.week}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      ID: {matchedExplorerRecord.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      matchedExplorerRecord.publishingStatus === 'PUBLISHED' 
                        ? 'bg-emerald-100 text-[#026838]' 
                        : matchedExplorerRecord.publishingStatus === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800'
                        : matchedExplorerRecord.publishingStatus === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {matchedExplorerRecord.publishingStatus}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display uppercase tracking-tight">
                    {matchedExplorerRecord.topic}
                  </h2>
                  <p className="text-xs text-slate-600 font-bold">
                    Subtopic: {matchedExplorerRecord.subtopic || 'Foundational Principles'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                  {onSelectLessonForPreview && (
                    <button
                      type="button"
                      onClick={() => onSelectLessonForPreview(matchedExplorerRecord)}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#026838] border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview in 30-Min Classroom</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(matchedExplorerRecord)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Record</span>
                  </button>
                </div>
              </div>

              {/* Workflow Status Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Publishing Workflow Status:</span>
                  <span className="text-slate-500">
                    Current stage: <strong className="text-slate-900 uppercase">{matchedExplorerRecord.publishingStatus}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {matchedExplorerRecord.publishingStatus !== 'UNDER_REVIEW' && (
                    <button
                      type="button"
                      onClick={() => handleTransitionWorkflow(matchedExplorerRecord.id, 'UNDER_REVIEW')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-black uppercase text-[10px] cursor-pointer"
                    >
                      Move to Under Review
                    </button>
                  )}
                  {matchedExplorerRecord.publishingStatus !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleTransitionWorkflow(matchedExplorerRecord.id, 'APPROVED')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-black uppercase text-[10px] cursor-pointer"
                    >
                      Mark Approved
                    </button>
                  )}
                  {matchedExplorerRecord.publishingStatus !== 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleTransitionWorkflow(matchedExplorerRecord.id, 'PUBLISHED')}
                      className="px-3 py-1.5 bg-[#026838] hover:bg-[#014d28] text-white rounded-xl font-black uppercase text-[10px] cursor-pointer shadow-xs"
                    >
                      Publish to Pupils ✓
                    </button>
                  )}
                </div>
              </div>

              {/* Complete NERDC Pedagogical Hierarchy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Theme & Competencies</span>
                    <div className="font-bold text-slate-900">{matchedExplorerRecord.theme || 'Universal Basic Education Theme'}</div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchedExplorerRecord.competencies?.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-700">
                          {c}
                        </span>
                      )) || <span className="text-slate-400">None specified</span>}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Learning Objectives</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium">
                      {matchedExplorerRecord.objectives?.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Learning Activities</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium">
                      {matchedExplorerRecord.learningActivities?.map((act, i) => (
                        <li key={i}>{act}</li>
                      )) || <li>Direct classroom interaction and concrete practice</li>}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Teaching Aids Associated</span>
                      <span className="text-[10px] font-bold text-sky-800">{matchedExplorerRecord.concreteVisualAids?.length || 0} Aids</span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedExplorerRecord.concreteVisualAids?.map((aid, i) => (
                        <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
                          <span className="text-xl">{aid.icon || '📦'}</span>
                          <div>
                            <strong className="text-slate-900 block text-xs">{aid.title}</strong>
                            <span className="text-[10px] text-slate-500">{aid.description}</span>
                          </div>
                        </div>
                      ))}
                      {(!matchedExplorerRecord.concreteVisualAids || matchedExplorerRecord.concreteVisualAids.length === 0) && (
                        <span className="text-slate-400 italic">No teaching aids attached to this module.</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Practice & Assessment</span>
                      <span className="text-[10px] font-bold text-indigo-800">
                        {(matchedExplorerRecord.practiceProblems?.length || 0) + (matchedExplorerRecord.assessmentQuestions?.length || 0)} Questions
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Questions are graded through Brightly's 5-stage mastery model (Beginning, Developing, Approaching Mastery, Mastered, Strong Mastery).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Source Provenance</span>
                    <div className="text-slate-700 font-medium">
                      Document: <strong className="text-slate-900">{matchedExplorerRecord.sourceDocument || 'NERDC National Curriculum'}</strong>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Reference: {matchedExplorerRecord.sourceReference || 'Universal Basic Education (UBE)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* RECORD DOES NOT EXIST: EXACT EMPTY STATE AS REQUIRED */
            <div className="bg-white rounded-[28px] border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mx-auto">
                📚
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900 uppercase font-display">
                  Curriculum content has not been added yet.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Brightly Home Lesson adheres strictly to authentic NERDC curriculum records. No content has been fabricated for <strong>Primary {explorerClass} {explorerSubject} Term {explorerTerm} Week {explorerWeek}</strong>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(explorerClass, explorerSubject, explorerTerm, explorerWeek)}
                  className="px-5 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                >
                  + Add Draft Curriculum Record
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TEACHING AIDS LIBRARY */}
      {/* ========================================================================= */}
      {adminTab === 'aids' && (
        <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0284C7] tracking-wider block">
                Resource Management
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Teaching Aids & Concrete Demonstration Assets ({teachingAids.length} Active Items)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Supported aid types: Image, Diagram, Flashcard, Audio, Video, Animation, Interactive Activity, Real-life Object, Printable Resource.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachingAids.map((aid) => (
              <div key={aid.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl shrink-0">{aid.icon || '📦'}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 uppercase truncate">{aid.title}</h4>
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">{aid.aidType}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{aid.description}</p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Primary {aid.grade} • Wk {aid.week}</span>
                  <span className="text-emerald-700 font-black">✓ Linked to Lesson</span>
                </div>
              </div>
            ))}
          </div>

          {/* Section: Topics needing Teaching Aids */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase">
              Curriculum Modules Without Dedicated Teaching Aids
            </h4>
            <div className="space-y-2">
              {curriculumRecords
                .filter(r => !r.concreteVisualAids || r.concreteVisualAids.length === 0)
                .map(r => (
                  <div key={r.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                    <span className="text-slate-800 font-bold">
                      Primary {r.grade} {r.subject}: {r.topic} (Week {r.week})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(r)}
                      className="text-amber-900 font-black uppercase text-[10px] hover:underline"
                    >
                      + Attach Aid
                    </button>
                  </div>
                ))}
              {curriculumRecords.filter(r => !r.concreteVisualAids || r.concreteVisualAids.length === 0).length === 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-bold">
                  ✓ All existing curriculum modules have active teaching aids configured!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. QUESTIONS & ASSESSMENT BANK */}
      {/* ========================================================================= */}
      {adminTab === 'questions' && (
        <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#0284C7] tracking-wider block">
                Item Banking & Diagnostics
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Questions Bank & Mastery Assessment Items ({questions.length} Items)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mapped to Nigerian NERDC learning objectives and 5-stage mastery model.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-black text-[10px] uppercase">
                      Primary {q.grade} • {q.subject}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                      q.usage === 'assessment' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {q.usage}
                    </span>
                    <span className="text-slate-500 font-medium">
                      Target Mastery: <strong className="text-slate-900">{q.masteryLevel}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">ID: {q.id}</span>
                </div>

                <div className="font-bold text-slate-900 text-sm">{q.question}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-slate-700">
                  {q.options?.map((opt, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded-xl border ${
                        opt === q.correctAnswer 
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt} {opt === q.correctAnswer ? '✓ (Correct)' : ''}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    Explanation: {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUTHENTIC NERDC CURRICULUM IMPORT FOUNDATION */}
      {/* ========================================================================= */}
      {adminTab === 'import' && (
        <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-[#0284C7] tracking-wider block">
              Curriculum Import & Ingestion Staging
            </span>
            <h3 className="text-base font-black text-slate-900 uppercase font-display">
              Authentic NERDC Document Importer
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              To guarantee curriculum integrity, official curriculum documents from the Nigerian Educational Research and Development Council (NERDC) are validated through this staging tool before entering the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Source Document Title:</label>
              <input
                type="text"
                value={importDocTitle}
                onChange={(e) => setImportDocTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium outline-none focus:border-[#0284C7]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Source Reference / Edition:</label>
              <input
                type="text"
                value={importDocRef}
                onChange={(e) => setImportDocRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block">
                Paste Curriculum Batch Payload (JSON format):
              </label>
              <button
                type="button"
                onClick={() => setImportPayloadJson(JSON.stringify([
                  {
                    grade: 1,
                    subject: 'Mathematics',
                    term: 1,
                    week: 1,
                    topic: 'Whole Numbers: Counting 1 to 5',
                    subtopic: 'Object Counting with Bottle Caps',
                    theme: 'Number & Numeration',
                    objectives: ['Count objects up to 5', 'Match numerals with physical items'],
                    concreteVisualAids: [{ title: 'Bottle Caps Set', description: '5 colorful caps' }]
                  }
                ], null, 2))}
                className="text-[#0284C7] font-bold hover:underline cursor-pointer"
              >
                Insert Sample Template
              </button>
            </div>
            <textarea
              rows={8}
              value={importPayloadJson}
              onChange={(e) => setImportPayloadJson(e.target.value)}
              placeholder="Paste JSON entries here..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 font-mono text-xs outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestImportPreview}
              className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs"
            >
              Validate & Preview Import
            </button>
          </div>

          {importPreviewResult && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-800">Validation Status:</span>
                <span className={importPreviewResult.success ? 'text-emerald-700' : 'text-red-700'}>
                  {importPreviewResult.message}
                </span>
              </div>
              <div>Total Entries: <strong>{importPreviewResult.totalEntries}</strong></div>
              <div>Valid Entries: <strong>{importPreviewResult.validEntries}</strong></div>
              {importPreviewResult.errors?.length > 0 && (
                <div className="text-red-600 space-y-1">
                  <strong>Errors:</strong>
                  <ul className="list-disc pl-4">
                    {importPreviewResult.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PUPILS & VERIFIED SETTLEMENTS */}
      {/* ========================================================================= */}
      {adminTab === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Enrolled Pupils</span>
              <div className="text-3xl font-black text-slate-900 font-display">{students.length}</div>
              <p className="text-xs text-slate-500">Active pupil learning accounts</p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Verified Settlements</span>
              <div className="text-3xl font-black text-[#026838] font-display">
                {adminPayments.filter(p => p.status === 'paid').length}
              </div>
              <p className="text-xs text-slate-500">Confirmed Paystack transactions</p>
            </div>

            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Tuition Volume</span>
              <div className="text-3xl font-black text-slate-900 font-display font-mono">
                ₦{adminPayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500">Gross term tuition collected</p>
            </div>
          </div>

          {/* Verified Paystack Ledger */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-xs overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified Ledger
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase font-display mt-1">
                  Paystack Tuition Settlements
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {adminPayments.length} Total Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 px-3">Parent</th>
                    <th className="py-2.5 px-3">Child</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Term</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminPayments.map((p) => (
                    <tr key={p.id || p.transactionReference} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{p.parentId}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{p.childName}</td>
                      <td className="py-3 px-3 font-medium text-slate-600">Primary {p.grade}</td>
                      <td className="py-3 px-3 font-medium text-slate-600">Term {p.term}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">₦{p.amount.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          p.status === 'paid'
                            ? 'bg-emerald-100 text-[#026838]'
                            : p.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status === 'paid' ? 'Paid ✓' : p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[140px]">
                        {p.transactionReference}
                      </td>
                    </tr>
                  ))}
                  {adminPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                        No tuition records found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CURRICULUM RECORD EDITOR MODAL */}
      {/* ========================================================================= */}
      {isEditorOpen && editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 sm:p-8 space-y-5 my-auto max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded">
                  {isCreatingNew ? 'Create New Record' : 'Edit Curriculum Record'}
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase font-display mt-1">
                  {isCreatingNew ? 'Add Draft Curriculum Record' : `Edit: ${editingRecord.topic}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Class:</label>
                  <select
                    value={editingRecord.grade || 1}
                    onChange={(e) => setEditingRecord({ ...editingRecord, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Primary {g}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Subject:</label>
                  <select
                    value={editingRecord.subject || 'Mathematics'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, subject: e.target.value as SubjectName })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    {ALL_CORE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Term:</label>
                  <select
                    value={editingRecord.term || 1}
                    onChange={(e) => setEditingRecord({ ...editingRecord, term: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Week:</label>
                  <select
                    value={editingRecord.week || 1}
                    onChange={(e) => setEditingRecord({ ...editingRecord, week: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Curriculum Topic Name:</label>
                <input
                  type="text"
                  required
                  value={editingRecord.topic || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, topic: e.target.value })}
                  placeholder="e.g. Whole Numbers and Place Value..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Subtopic:</label>
                <input
                  type="text"
                  value={editingRecord.subtopic || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, subtopic: e.target.value })}
                  placeholder="e.g. Reading and writing numbers..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Theme:</label>
                <input
                  type="text"
                  value={editingRecord.theme || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, theme: e.target.value })}
                  placeholder="e.g. Number and Numeration"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Learning Objectives (One per line):</label>
                <textarea
                  rows={3}
                  value={editingRecord.objectives?.join('\n') || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, objectives: e.target.value.split('\n').filter(Boolean) })}
                  placeholder="1. Identify place value..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Competencies (Comma separated):</label>
                <input
                  type="text"
                  value={editingRecord.competencies?.join(', ') || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, competencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Critical Thinking, Problem Solving"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Publishing Status:</label>
                  <select
                    value={editingRecord.publishingStatus || 'DRAFT'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, publishingStatus: e.target.value as PublishingStatus })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="DRAFT">DRAFT (Hidden from pupils)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PUBLISHED">PUBLISHED (Live in classroom)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Source Document:</label>
                  <input
                    type="text"
                    value={editingRecord.sourceDocument || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, sourceDocument: e.target.value })}
                    placeholder="NERDC National Curriculum"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black uppercase text-xs cursor-pointer shadow-xs"
                >
                  Save Curriculum Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
