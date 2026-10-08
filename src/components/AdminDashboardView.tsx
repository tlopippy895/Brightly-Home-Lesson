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
  ListOrdered,
  Trash2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertTriangle,
  PlayCircle
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
  CurriculumCoverageStat,
  WeekPeriodType,
  TermStructureConfig,
  LessonReadinessReport,
  LessonReadinessStatus
} from '../types';
import { CURRICULUM_DATA, NATIONAL_CURRICULUM_LESSONS } from '../data/curriculum';
import { ALL_CORE_SUBJECTS, CURRICULUM_VERSION_METADATA, getTermStructureConfig } from '../data/curriculumHierarchy';
import { NIGERIAN_TEACHERS } from '../data/teachers';
import { api } from '../services/api';
import { validateClientCurriculumReadiness } from '../utils/readinessValidator';
import { PilotReadinessPanel } from './PilotReadinessPanel';

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
  const [adminTab, setAdminTab] = useState<'overview' | 'explorer' | 'aids' | 'questions' | 'import' | 'operations' | 'pilot'>('overview');

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

  // Authentic NERDC Curriculum Import & Staging Workflow (9-Stage Architecture)
  const [importDocTitle, setImportDocTitle] = useState('NERDC Basic Education Curriculum - National Scheme');
  const [importDocRef, setImportDocRef] = useState('NERDC-BEC-2024-OFFICIAL');
  const [importFormat, setImportFormat] = useState<'json' | 'text_table' | 'csv'>('json');
  const [importRawInput, setImportRawInput] = useState('');
  const [targetImportClass, setTargetImportClass] = useState<GradeLevel>(1);
  const [targetImportSubject, setTargetImportSubject] = useState<SubjectName>('Mathematics');
  const [targetImportTerm, setTargetImportTerm] = useState<1 | 2 | 3>(1);
  const [stagedEntries, setStagedEntries] = useState<Array<{
    id: string;
    grade: GradeLevel;
    subject: SubjectName;
    term: 1 | 2 | 3;
    week: number;
    weekType: WeekPeriodType;
    periodTitle?: string;
    topic: string;
    subtopic: string;
    theme?: string;
    objectives: string[];
    concreteVisualAids?: any[];
    validationStatus: 'VALID' | 'WARNING' | 'ERROR';
    validationErrors: string[];
    isApproved: boolean;
  }>>([]);
  const [stagedFilter, setStagedFilter] = useState<'all' | 'valid' | 'needs_attention' | 'approved'>('all');
  const [editingStagedIndex, setEditingStagedIndex] = useState<number | null>(null);
  const [editingStagedItem, setEditingStagedItem] = useState<any | null>(null);
  const [isStagedEditorOpen, setIsStagedEditorOpen] = useState(false);
  const [isCommittingImport, setIsCommittingImport] = useState(false);
  const [importCommitSuccessMsg, setImportCommitSuccessMsg] = useState<string | null>(null);
  const [workflowCurrentStep, setWorkflowCurrentStep] = useState<number>(1);
  const [showReadinessAudit, setShowReadinessAudit] = useState<boolean>(false);
  const [stagedReadinessFilter, setStagedReadinessFilter] = useState<'all' | 'ready' | 'warning' | 'not_ready'>('all');

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

  // Workflow transition handler with Lesson Readiness Gate check
  const handleTransitionWorkflow = async (recordId: string, newStatus: PublishingStatus) => {
    const targetRecord = curriculumRecords.find(r => r.id === recordId) || inspectingRecord;
    if (newStatus === 'PUBLISHED' && targetRecord) {
      const candidate = { ...targetRecord, publishingStatus: 'PUBLISHED' as PublishingStatus };
      const readiness = validateClientCurriculumReadiness(candidate);
      if (readiness.status === 'NOT READY') {
        setStatusMessage({
          type: 'error',
          text: `Lesson Readiness Gate: Cannot publish. ${readiness.errors.length} blocking error(s): ${readiness.errors.join('; ')}`
        });
        setShowReadinessAudit(true);
        setTimeout(() => setStatusMessage(null), 7000);
        return;
      }
    }

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

  // Validate a single parsed curriculum item with Lesson Readiness Gate
  const validateStagedItem = (item: any): { status: 'VALID' | 'WARNING' | 'ERROR'; errors: string[]; report: LessonReadinessReport } => {
    const report = validateClientCurriculumReadiness(item);
    let status: 'VALID' | 'WARNING' | 'ERROR';
    if (report.status === 'READY') {
      status = 'VALID';
    } else if (report.status === 'WARNING') {
      status = 'WARNING';
    } else {
      status = 'ERROR';
    }
    const combinedIssues = report.status === 'READY' ? [] : [...report.errors, ...report.warnings];
    return { status, errors: combinedIssues, report };
  };

  // Helper to load authentic official templates
  const handleLoadSampleTemplate = (type: 'p1_math' | 'p5_sci' | 'p6_social' | 'term_scheme_13w') => {
    setImportCommitSuccessMsg(null);
    if (type === 'p1_math') {
      setImportDocTitle('NERDC National Curriculum for Primary 1 - Mathematics (First Term)');
      setImportDocRef('NERDC-BEC-2024-MATH-P1');
      setTargetImportClass(1);
      setTargetImportSubject('Mathematics');
      setTargetImportTerm(1);
      setImportFormat('json');
      setImportRawInput(JSON.stringify([
        {
          grade: 1,
          subject: 'Mathematics',
          term: 1,
          week: 1,
          weekType: 'instructional',
          periodTitle: 'Instructional Week 1 · Number & Numeration Foundation',
          topic: 'Whole Numbers: Counting 1 to 5',
          subtopic: 'Object Counting with Bottle Caps and Pebbles',
          theme: 'Number & Numeration',
          objectives: [
            'Count distinct concrete objects from 1 up to 5 correctly',
            'Match written numerals (1, 2, 3, 4, 5) with physical items in the classroom'
          ],
          concreteVisualAids: [
            { title: 'Bottle Caps & Pebbles', description: 'Real-world counters for primary 1 counting practice', itemType: 'general', icon: '🔘' }
          ]
        },
        {
          grade: 1,
          subject: 'Mathematics',
          term: 1,
          week: 2,
          weekType: 'instructional',
          periodTitle: 'Instructional Week 2 · Number Recognition & Ordering',
          topic: 'Whole Numbers: Counting 6 to 10',
          subtopic: 'Ordering Numbers and Quantities Up to 10',
          theme: 'Number & Numeration',
          objectives: [
            'Count concrete objects forwards and backwards from 1 to 10',
            'Identify which set of items is greater or lesser up to 10'
          ],
          concreteVisualAids: [
            { title: 'Counting Sticks', description: 'Bundles of 10 counting sticks', itemType: 'general', icon: '🥢' }
          ]
        },
        {
          grade: 1,
          subject: 'Mathematics',
          term: 1,
          week: 6,
          weekType: 'revision',
          periodTitle: 'Revision Week 6 · Number Work & Shapes Consolidation',
          topic: 'Mid-Term Revision: Number Work 1–10 & Basic Shapes',
          subtopic: 'Consolidation of Counting, Sorting, and Numeral Formation',
          theme: 'Universal Basic Education Core Scheme',
          objectives: [
            'Revise counting from 1 to 10 without hesitation',
            'Demonstrate oral and written numeral recognition from weeks 1 to 5'
          ]
        },
        {
          grade: 1,
          subject: 'Mathematics',
          term: 1,
          week: 7,
          weekType: 'assessment',
          periodTitle: 'Continuous Assessment Week 7 · First Term Mid-Term CA',
          topic: 'Mid-Term Continuous Assessment (CA 1)',
          subtopic: 'Diagnostic Evaluation of Early Numeracy Mastery',
          theme: 'Continuous Assessment Framework',
          objectives: [
            'Complete individual counting assessment with concrete counters',
            'Evaluate baseline numeracy and numeral tracing proficiency'
          ]
        }
      ], null, 2));
    } else if (type === 'p5_sci') {
      setImportDocTitle('NERDC Basic Science & Technology Curriculum - Primary 5');
      setImportDocRef('NERDC-BEC-2024-BST-P5');
      setTargetImportClass(5);
      setTargetImportSubject('Basic Science & Technology');
      setTargetImportTerm(1);
      setImportFormat('json');
      setImportRawInput(JSON.stringify([
        {
          grade: 5,
          subject: 'Basic Science & Technology',
          term: 1,
          week: 1,
          weekType: 'instructional',
          periodTitle: 'Instructional Week 1 · Environmental Quality & Pollution',
          topic: 'Environmental Quality: Air, Water and Soil Pollution',
          subtopic: 'Causes and Prevention of Local Pollution in Nigerian Communities',
          theme: 'You and Your Environment',
          objectives: [
            'Define environmental pollution and identify its three main types (Air, Water, Land)',
            'Identify major sources of water contamination in Nigerian riverine and urban communities'
          ]
        },
        {
          grade: 5,
          subject: 'Basic Science & Technology',
          term: 1,
          week: 2,
          weekType: 'instructional',
          periodTitle: 'Instructional Week 2 · Waste Management & Recycling',
          topic: 'Waste Disposal: Biodegradable and Non-Biodegradable Waste',
          subtopic: 'Proper Waste Sorting and Recycling Methods (Plastics, Nylon, Compost)',
          theme: 'You and Your Environment',
          objectives: [
            'Differentiate between biodegradable and non-biodegradable waste materials',
            'List three practical recycling habits pupils can practice at home and school'
          ]
        },
        {
          grade: 5,
          subject: 'Basic Science & Technology',
          term: 1,
          week: 7,
          weekType: 'assessment',
          periodTitle: 'Assessment Week 7 · Continuous Assessment Test',
          topic: 'Continuous Assessment 1: Environmental Studies',
          subtopic: 'Mid-Term Practical & Written Test',
          theme: 'Assessment & Evaluation',
          objectives: [
            'Assess pupil understanding of environmental conservation and waste sorting'
          ]
        }
      ], null, 2));
    } else if (type === 'p6_social') {
      setImportDocTitle('NERDC Social Studies Curriculum - Primary 6');
      setImportDocRef('NERDC-BEC-2024-SOC-P6');
      setTargetImportClass(6);
      setTargetImportSubject('Social Studies');
      setTargetImportTerm(1);
      setImportFormat('json');
      setImportRawInput(JSON.stringify([
        {
          grade: 6,
          subject: 'Social Studies',
          term: 1,
          week: 1,
          weekType: 'instructional',
          periodTitle: 'Instructional Week 1 · Civic Values & Democratic Leadership',
          topic: 'Democratic Government in Nigeria: Structure and Functions',
          subtopic: 'The Three Arms of Government: Executive, Legislature, and Judiciary',
          theme: 'Civic Responsibilities & Governance',
          objectives: [
            'Name the three arms of democratic government in Nigeria',
            'Explain the distinct roles of the President/Governor, National Assembly, and Courts'
          ]
        },
        {
          grade: 6,
          subject: 'Social Studies',
          term: 1,
          week: 12,
          weekType: 'revision',
          periodTitle: 'Revision Week 12 · Comprehensive First Term Revision',
          topic: 'First Term Examination Revision: Governance, Culture and National Unity',
          subtopic: 'Review of Weeks 1–11 Social Studies Topics',
          theme: 'Universal Basic Education Core Scheme',
          objectives: [
            'Review key concepts of democratic leadership, national symbols, and civic rights',
            'Prepare pupils for the upcoming First Term Examination'
          ]
        },
        {
          grade: 6,
          subject: 'Social Studies',
          term: 1,
          week: 13,
          weekType: 'examination',
          periodTitle: 'Examination Week 13 · First Term Summative Examination',
          topic: 'First Term Summative Examination',
          subtopic: 'Term 1 Final Examination Paper and Grading',
          theme: 'Summative Examination',
          objectives: [
            'Complete comprehensive 50-item objective and theory assessment across all Term 1 modules'
          ]
        }
      ], null, 2));
    } else {
      // 13-week Tabular text scheme
      setImportDocTitle('NERDC Comprehensive 13-Week Term Scheme of Work');
      setImportDocRef('NERDC-BEC-2024-SCHEME-13W');
      setImportFormat('text_table');
      setImportRawInput(
`Week | Topic | Subtopic | Objectives | Activities
Week 1 | Whole Numbers & Place Value | Counting and Writing in Figures up to 10,000 | Count and write numbers up to 10,000; Identify place value | Abacus practice, place value charts
Week 2 | Addition of Large Numbers | Addition without and with renaming | Add 4-digit numbers accurately; Solve word problems with Naira | Real-life market word problems
Week 3 | Subtraction of Large Numbers | Subtraction with borrowing/renaming | Subtract 4-digit numbers; Verify subtraction using addition | Practical trading balance exercises
Week 4 | Multiplication Fundamentals | Multiplication by 2-digit numbers | Multiply whole numbers by 10 and 100; Apply times tables | Grid multiplication
Week 5 | Division of Whole Numbers | Division without and with remainders | Divide 3-digit numbers by 1-digit numbers; Interpret remainders | Concrete sharing activities
Week 6 | Mid-Term Revision | Revision of Weeks 1 to 5 Topics | Revise addition, subtraction, multiplication; Clarify misconceptions | Guided revision exercises
Week 7 | Continuous Assessment (CA) | Mid-Term Continuous Assessment Test | Complete 20-item diagnostic test; Record CA scores | Continuous assessment paper
Week 8 | Introduction to Fractions | Proper, Improper & Mixed Fractions | Differentiate fraction types; Convert improper to mixed | Slicing Agege bread and oranges
Week 9 | Equivalent Fractions | Finding Equivalent Fractions by Multiplication | Generate equivalent fractions; Simplify fractions to lowest terms | Fraction wall diagrams
Week 10 | Decimals and Money | Expressing tenths and hundredths as decimals | Convert fractions to decimals; Calculate money in Naira and Kobo | Nigerian Naira notes & coins
Week 11 | Basic Geometry & 2D Shapes | Properties of Rectangles, Squares, Triangles | Identify vertices and edges; Measure perimeter | Ruler and shape cutouts
Week 12 | Term Revision | Comprehensive Revision of All 11 Weeks | Review all term objectives; Address pupil learning gaps | Mock test and group review
Week 13 | Term Examination | First Term Summative Examination | Sit for standardized term exam; Record authoritative marks | Official examination papers`
      );
    }
    setWorkflowCurrentStep(2);
  };

  // Step 2 & 3: Parse, Extract and Validate structured curriculum data
  const handleParseAndExtract = () => {
    if (!importRawInput.trim()) {
      alert('Please paste or load curriculum source text before extracting.');
      return;
    }

    setImportCommitSuccessMsg(null);
    const parsedList: any[] = [];

    if (importFormat === 'json') {
      try {
        const parsed = JSON.parse(importRawInput);
        const arrayItems = Array.isArray(parsed) ? parsed : [parsed];
        for (const raw of arrayItems) {
          const itemGrade = Number(raw.grade || targetImportClass) as GradeLevel;
          const itemSubject = (raw.subject || targetImportSubject) as SubjectName;
          const itemTerm = Number(raw.term || targetImportTerm) as 1 | 2 | 3;
          const itemWeek = Number(raw.week || 1);
          
          let inferredWeekType: WeekPeriodType = raw.weekType || 'instructional';
          const topicLower = (raw.topic || '').toLowerCase();
          const subLower = (raw.subtopic || '').toLowerCase();
          if (topicLower.includes('revision') || subLower.includes('revision')) {
            inferredWeekType = 'revision';
          } else if (topicLower.includes('assessment') || subLower.includes('assessment') || topicLower.includes('ca ') || topicLower.includes('continuous')) {
            inferredWeekType = 'assessment';
          } else if (topicLower.includes('examination') || topicLower.includes('exam') || subLower.includes('exam')) {
            inferredWeekType = 'examination';
          } else if (topicLower.includes('project') || topicLower.includes('practical') || topicLower.includes('excursion')) {
            inferredWeekType = 'special_instructional';
          }

          const objectives = Array.isArray(raw.objectives)
            ? raw.objectives
            : (raw.objectives ? String(raw.objectives).split(';').map((s: string) => s.trim()).filter(Boolean) : []);

          const validationObj = validateStagedItem({
            grade: itemGrade,
            subject: itemSubject,
            term: itemTerm,
            week: itemWeek,
            topic: raw.topic,
            objectives
          });

          parsedList.push({
            id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            grade: itemGrade,
            subject: itemSubject,
            term: itemTerm,
            week: itemWeek,
            weekType: inferredWeekType,
            periodTitle: raw.periodTitle || `${inferredWeekType === 'instructional' ? 'Instructional' : inferredWeekType === 'revision' ? 'Revision' : inferredWeekType === 'assessment' ? 'Continuous Assessment' : 'Examination'} Week ${itemWeek}`,
            topic: raw.topic || '',
            subtopic: raw.subtopic || raw.topic || '',
            theme: raw.theme || null,
            objectives,
            concreteVisualAids: raw.concreteVisualAids || [],
            validationStatus: validationObj.status,
            validationErrors: validationObj.errors,
            isApproved: false
          });
        }
      } catch (err: any) {
        alert('JSON Parsing Error: ' + err.message);
        return;
      }
    } else {
      // Tabular text or CSV parser
      const lines = importRawInput.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.toLowerCase().startsWith('week |') || line.toLowerCase().startsWith('week,') || line.toLowerCase().startsWith('#')) {
          continue;
        }

        const delimiter = importFormat === 'csv' ? ',' : (line.includes('|') ? '|' : '\t');
        const cols = line.split(delimiter).map(c => c.trim());
        if (cols.length < 2) continue;

        const weekCol = cols[0] || '';
        const weekMatch = weekCol.match(/\d+/);
        const weekNum = weekMatch ? parseInt(weekMatch[0], 10) : 1;

        const topic = cols[1] || `Week ${weekNum} Curriculum Topic`;
        const subtopic = cols[2] || topic;
        const objectivesRaw = cols[3] || 'Master core NERDC competencies for this week.';
        const activitiesRaw = cols[4] || '';

        const objectives = objectivesRaw.split(';').map(s => s.trim()).filter(Boolean);

        let inferredWeekType: WeekPeriodType = 'instructional';
        const topicLower = topic.toLowerCase();
        const subLower = subtopic.toLowerCase();
        if (topicLower.includes('revision') || subLower.includes('revision')) {
          inferredWeekType = 'revision';
        } else if (topicLower.includes('assessment') || subLower.includes('assessment') || topicLower.includes('ca ') || topicLower.includes('continuous')) {
          inferredWeekType = 'assessment';
        } else if (topicLower.includes('examination') || topicLower.includes('exam') || subLower.includes('exam')) {
          inferredWeekType = 'examination';
        } else if (topicLower.includes('project') || topicLower.includes('practical') || topicLower.includes('excursion')) {
          inferredWeekType = 'special_instructional';
        }

        const validObj = validateStagedItem({
          grade: targetImportClass,
          subject: targetImportSubject,
          term: targetImportTerm,
          week: weekNum,
          topic,
          objectives
        });

        parsedList.push({
          id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          grade: targetImportClass,
          subject: targetImportSubject,
          term: targetImportTerm,
          week: weekNum,
          weekType: inferredWeekType,
          periodTitle: `${inferredWeekType === 'instructional' ? 'Instructional' : inferredWeekType === 'revision' ? 'Revision' : inferredWeekType === 'assessment' ? 'Continuous Assessment' : 'Examination'} Week ${weekNum}`,
          topic,
          subtopic,
          theme: 'Universal Basic Education Core Scheme',
          objectives,
          learningActivities: activitiesRaw ? [activitiesRaw] : ['Direct instructional guidance', 'Concrete practice'],
          concreteVisualAids: [],
          validationStatus: validObj.status,
          validationErrors: validObj.errors,
          isApproved: false
        });
      }
    }

    if (parsedList.length === 0) {
      alert('No valid rows could be extracted from the provided text.');
      return;
    }

    setStagedEntries(parsedList);
    setWorkflowCurrentStep(4); // Advance to Admin Review & Correction Workbench
    setStatusMessage({ type: 'success', text: `Extracted ${parsedList.length} structured curriculum records. Ready for admin review.` });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Toggle approval for a single staged item
  const handleToggleApproveStaged = (index: number) => {
    setStagedEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isApproved: !copy[index].isApproved };
      return copy;
    });
  };

  // Approve all valid entries
  const handleApproveAllValid = () => {
    setStagedEntries(prev => prev.map(item => item.validationStatus === 'VALID' ? { ...item, isApproved: true } : item));
    setStatusMessage({ type: 'success', text: 'All valid curriculum entries approved for publication.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete a staged item
  const handleDeleteStagedItem = (index: number) => {
    setStagedEntries(prev => prev.filter((_, i) => i !== index));
  };

  // Open inline correction modal for a staged entry
  const handleOpenStagedItemEditor = (item: any, index: number) => {
    setEditingStagedIndex(index);
    setEditingStagedItem({ ...item });
    setIsStagedEditorOpen(true);
  };

  // Save inline correction
  const handleSaveStagedItemCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStagedIndex === null || !editingStagedItem) return;

    const validation = validateStagedItem(editingStagedItem);
    const updated = {
      ...editingStagedItem,
      validationStatus: validation.status,
      validationErrors: validation.errors
    };

    setStagedEntries(prev => {
      const copy = [...prev];
      copy[editingStagedIndex] = updated;
      return copy;
    });

    setIsStagedEditorOpen(false);
    setStatusMessage({ type: 'success', text: `Correction saved for Week ${updated.week}: ${updated.topic}.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Step 9: Commit batch to persistent database
  const handleCommitBatchPublish = async (publishingStatus: PublishingStatus) => {
    if (stagedEntries.length === 0) {
      alert('No staged entries to commit.');
      return;
    }

    const itemsToCommit = stagedEntries.filter(item => item.validationStatus !== 'ERROR');
    if (itemsToCommit.length === 0) {
      alert('Cannot commit: all staged entries contain critical validation errors. Please correct them first.');
      return;
    }

    setIsCommittingImport(true);
    setImportCommitSuccessMsg(null);
    try {
      const res = await api.commitCurriculumImport({
        documentTitle: importDocTitle,
        documentReference: importDocRef,
        entries: itemsToCommit,
        publishingStatus
      });

      if (res && res.success) {
        setImportCommitSuccessMsg(res.message);
        setStatusMessage({ type: 'success', text: res.message });
        await loadData();
        setWorkflowCurrentStep(5); // Complete
      } else {
        alert(res?.message || 'Failed to commit curriculum records.');
      }
    } catch (err: any) {
      alert(err?.message || 'Commit connection failure.');
    } finally {
      setIsCommittingImport(false);
      setTimeout(() => setStatusMessage(null), 5000);
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

        <button
          type="button"
          onClick={() => setAdminTab('pilot')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'pilot'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>Controlled Pilot & Readiness</span>
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

          {/* QUALITY CONTROL & LESSON READINESS GATE KPI BANNER */}
          {(() => {
            const reports = curriculumRecords.map(r => validateClientCurriculumReadiness(r));
            const readyCount = reports.filter(r => r.status === 'READY').length;
            const warningCount = reports.filter(r => r.status === 'WARNING').length;
            const notReadyCount = reports.filter(r => r.status === 'NOT READY').length;
            const readyForLessonCount = reports.filter(r => r.isReadyForLesson).length;

            return (
              <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#0284C7] tracking-wider block">
                      Curriculum Quality Control & Lesson Readiness Gate
                    </span>
                    <h3 className="text-base font-black text-slate-900 uppercase font-display">
                      Readiness Status Across Curriculum Records
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 bg-emerald-100 text-[#026838] rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Gate Active: Strict Anti-Fabrication</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-800">Ready for Lessons</span>
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-[#026838] font-display">{readyCount}</div>
                    <span className="text-[10px] text-emerald-700 font-medium">100% compliant with 12 NERDC rules</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-800">Ready with Warnings</span>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-700 font-display">{warningCount}</div>
                    <span className="text-[10px] text-amber-700 font-medium">Core rules passed; optional fields pending</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-rose-800">Not Ready (Blocked)</span>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-black text-rose-700 font-display">{notReadyCount}</div>
                    <span className="text-[10px] text-rose-700 font-medium">Blocked from publishing & AI Teacher</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-sky-800">Classroom Approved</span>
                      <FileCheck className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="text-2xl font-black text-sky-800 font-display">{readyForLessonCount}</div>
                    <span className="text-[10px] text-sky-700 font-medium">Published & deliverable to pupils</span>
                  </div>
                </div>
              </div>
            );
          })()}

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

              {/* LESSON READINESS GATE & QUALITY CONTROL LAYER */}
              {(() => {
                const readinessReport = validateClientCurriculumReadiness(matchedExplorerRecord);
                const isReady = readinessReport.status === 'READY';
                const isWarning = readinessReport.status === 'WARNING';
                const isNotReady = readinessReport.status === 'NOT READY';

                return (
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isReady 
                      ? 'bg-emerald-50/60 border-emerald-200' 
                      : isWarning
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            Lesson Readiness Gate · Quality Control
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide flex items-center gap-1 ${
                            isReady
                              ? 'bg-emerald-600 text-white'
                              : isWarning
                              ? 'bg-amber-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {isReady ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>READY FOR LESSON GENERATION</span>
                              </>
                            ) : isWarning ? (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>READY WITH ADVISORY WARNINGS</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>NOT READY FOR CLASSROOM</span>
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          {isReady 
                            ? 'All mandatory NERDC curriculum fields verified. Internal consistency and objective integrity passed.'
                            : isWarning
                            ? 'Mandatory curriculum standards met. Some optional pedagogical enhancements recommended.'
                            : `Defects detected: ${readinessReport.errors.length} blocking error(s) must be resolved before this record can be published.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-xs">
                          <div className="font-black text-slate-900">
                            {readinessReport.summary.passedChecks} / {readinessReport.summary.totalChecks}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">
                            Rules Verified
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowReadinessAudit(!showReadinessAudit)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>{showReadinessAudit ? 'Hide Audit' : 'Inspect 12 Rules'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable 12-Rule Audit Checklist */}
                    {showReadinessAudit && (
                      <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            Comprehensive NERDC Quality Control Rules Checklist:
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">
                            Status: <strong className={isNotReady ? 'text-rose-700' : 'text-emerald-700'}>{readinessReport.status}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {readinessReport.checks.map((chk) => (
                            <div
                              key={chk.ruleId}
                              className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                                chk.passed
                                  ? 'bg-white/80 border-emerald-200 text-slate-800'
                                  : chk.severity === 'blocking'
                                  ? 'bg-rose-100/70 border-rose-300 text-rose-950 font-medium'
                                  : 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
                              }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {chk.passed ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : chk.severity === 'blocking' ? (
                                  <AlertCircle className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold flex items-center gap-1.5 flex-wrap">
                                  <span>{chk.ruleName}</span>
                                  {!chk.passed && (
                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                      chk.severity === 'blocking' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                                    }`}>
                                      {chk.severity}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 leading-snug">
                                  {chk.message}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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
      {/* 5. AUTHENTIC NERDC CURRICULUM IMPORT & STAGING WORKBENCH (9-STAGE WORKFLOW) */}
      {/* ========================================================================= */}
      {adminTab === 'import' && (
        <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-7">
          {/* Header & Principle Notice */}
          <div className="border-b border-slate-100 pb-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase text-[#0284C7] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full tracking-wider">
                Authoritative Curriculum Pipeline · 9-Stage Ingestion
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Strict Anti-Fabrication Architecture</span>
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase font-display">
              Authentic NERDC Document Importer & Staging Workbench
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-3xl">
              Brightly Home Lesson guarantees curriculum integrity by requiring all content to originate from verified Nigerian Educational Research and Development Council (NERDC) documents. No curriculum content is ever hallucinated or synthesized by AI.
            </p>
          </div>

          {/* Visual 9-Stage Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">
              Official Curriculum Verification Workflow Pipeline:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 ${
                workflowCurrentStep >= 1 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <span className="text-[10px] font-black uppercase opacity-60">Stage 1 & 2</span>
                <span>Source Document & Ingest</span>
              </div>
              <div className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 ${
                workflowCurrentStep >= 2 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <span className="text-[10px] font-black uppercase opacity-60">Stage 3 & 4</span>
                <span>Parse & Structured Data</span>
              </div>
              <div className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 ${
                workflowCurrentStep >= 3 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <span className="text-[10px] font-black uppercase opacity-60">Stage 5</span>
                <span>Schema Validation</span>
              </div>
              <div className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 ${
                workflowCurrentStep >= 4 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <span className="text-[10px] font-black uppercase opacity-60">Stage 6 & 7</span>
                <span>Review & Correction</span>
              </div>
              <div className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 ${
                workflowCurrentStep >= 5 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <span className="text-[10px] font-black uppercase opacity-60">Stage 8 & 9</span>
                <span>Approval & Live Publish</span>
              </div>
            </div>
          </div>

          {/* STAGE 1 & 2: DOCUMENT METADATA & SOURCE INGESTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284C7]" />
                <span>1. Source Document Metadata & Intake Format</span>
              </h4>
              <div className="flex items-center gap-1.5 text-xs">
                {(['json', 'text_table', 'csv'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setImportFormat(fmt)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs uppercase cursor-pointer transition-all ${
                      importFormat === fmt 
                        ? 'bg-[#0284C7] text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {fmt === 'json' ? 'JSON Batch' : fmt === 'text_table' ? 'Tabular Scheme Text' : 'CSV Table'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">NERDC Source Document Title:</label>
                <input
                  type="text"
                  value={importDocTitle}
                  onChange={(e) => setImportDocTitle(e.target.value)}
                  placeholder="e.g. NERDC National Curriculum for Primary 1..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Official Gazette / Volume Reference:</label>
                <input
                  type="text"
                  value={importDocRef}
                  onChange={(e) => setImportDocRef(e.target.value)}
                  placeholder="e.g. NERDC-BEC-2024-MATH-VOL-01..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Target Class, Subject, and Term Selector (helpful for Tabular or CSV input) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Target Class / Stage:</label>
                <select
                  value={targetImportClass}
                  onChange={(e) => setTargetImportClass(Number(e.target.value) as GradeLevel)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#0284C7]"
                >
                  {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Primary {g} ({g <= 3 ? 'Lower Basic' : g <= 5 ? 'Middle Basic' : 'Upper Basic'})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Target Subject:</label>
                <select
                  value={targetImportSubject}
                  onChange={(e) => setTargetImportSubject(e.target.value as SubjectName)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#0284C7]"
                >
                  {ALL_CORE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Academic Term:</label>
                <select
                  value={targetImportTerm}
                  onChange={(e) => setTargetImportTerm(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#0284C7]"
                >
                  <option value={1}>Term 1 (First Term)</option>
                  <option value={2}>Term 2 (Second Term)</option>
                  <option value={3}>Term 3 (Third Term)</option>
                </select>
              </div>
            </div>

            {/* Sample Authentic Templates Bar */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-bold text-slate-700 block">
                  Quick Load Official NERDC Templates:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleTemplate('p1_math')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    + Primary 1 Maths (Counting 1–10 & Revision)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleTemplate('p5_sci')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold hover:bg-cyan-100 cursor-pointer"
                  >
                    + Primary 5 Science (Pollution & CA Test)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleTemplate('p6_social')}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold hover:bg-purple-100 cursor-pointer"
                  >
                    + Primary 6 Social (Democracy & Term Exam)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSampleTemplate('term_scheme_13w')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold hover:bg-amber-100 cursor-pointer"
                  >
                    + Full 13-Week Term Scheme
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                value={importRawInput}
                onChange={(e) => setImportRawInput(e.target.value)}
                placeholder={importFormat === 'json' ? "Paste structured JSON curriculum batch..." : "Week | Topic | Subtopic | Objectives | Activities..."}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 font-mono text-xs outline-none focus:border-[#0284C7] leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleParseAndExtract}
                className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Parse, Extract & Validate Structured Data</span>
              </button>

              {stagedEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStagedEntries([])}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold uppercase cursor-pointer"
                >
                  Clear Staging Buffer
                </button>
              )}
            </div>
          </div>

          {/* STAGE 3, 4, 5, 6, 7: ADMIN REVIEW, VALIDATION DIAGNOSTICS & CORRECTION WORKBENCH */}
          {stagedEntries.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase font-display flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-[#0284C7]" />
                    <span>Curriculum Staging Workbench ({stagedEntries.length} Items Extracted)</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Review extracted scheme records, correct any anomalies in the editor, and approve for publishing.
                  </p>
                </div>

                {/* Staging Metrics Badges */}
                {(() => {
                  const sReadyCount = stagedEntries.filter(e => validateClientCurriculumReadiness(e).status === 'READY').length;
                  const sWarningCount = stagedEntries.filter(e => validateClientCurriculumReadiness(e).status === 'WARNING').length;
                  const sNotReadyCount = stagedEntries.filter(e => validateClientCurriculumReadiness(e).status === 'NOT READY').length;
                  const sApprovedCount = stagedEntries.filter(e => e.isApproved).length;

                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {sReadyCount} Lesson Ready
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800">
                        {sWarningCount} Warnings
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-rose-100 text-rose-800">
                        {sNotReadyCount} Not Ready
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-sky-100 text-sky-800">
                        {sApprovedCount} Approved
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Staged Filtering & Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-600">Filter View:</span>
                  {([
                    { id: 'all', label: 'All Staged' },
                    { id: 'ready', label: 'Ready' },
                    { id: 'warning', label: 'Warnings' },
                    { id: 'not_ready', label: 'Not Ready' },
                    { id: 'approved', label: 'Approved' }
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStagedFilter(tab.id as any)}
                      className={`px-3 py-1 rounded-lg font-bold uppercase text-[11px] cursor-pointer transition-all ${
                        stagedFilter === tab.id ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveAllValid}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Approve All Ready Entries</span>
                  </button>
                </div>
              </div>

              {/* Interactive Staging Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-10">Approve</th>
                      <th className="py-3 px-3">Class & Subject</th>
                      <th className="py-3 px-3">Term & Week</th>
                      <th className="py-3 px-3">Period Type</th>
                      <th className="py-3 px-3">Curriculum Topic & Subtopic</th>
                      <th className="py-3 px-3">Objectives</th>
                      <th className="py-3 px-3">Readiness Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stagedEntries
                      .filter(entry => {
                        const rep = validateClientCurriculumReadiness(entry);
                        if (stagedFilter === 'ready' || stagedFilter === 'valid') return rep.status === 'READY';
                        if (stagedFilter === 'warning') return rep.status === 'WARNING';
                        if (stagedFilter === 'not_ready' || stagedFilter === 'needs_attention') return rep.status === 'NOT READY';
                        if (stagedFilter === 'approved') return entry.isApproved;
                        return true;
                      })
                      .map((entry) => {
                        const originalIndex = stagedEntries.findIndex(e => e.id === entry.id);
                        const itemReadiness = validateClientCurriculumReadiness(entry);

                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleApproveStaged(originalIndex)}
                                className="cursor-pointer"
                              >
                                {entry.isApproved ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                                )}
                              </button>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">Primary {entry.grade}</div>
                              <div className="text-[11px] text-slate-500">{entry.subject}</div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-800">Term {entry.term}</span>
                              <div className="text-[11px] text-[#0284C7] font-semibold">Week {entry.week}</div>
                            </td>

                            <td className="py-3 px-3">
                              {entry.weekType === 'revision' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                  Revision Week
                                </span>
                              ) : entry.weekType === 'assessment' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                                  Assessment (CA)
                                </span>
                              ) : entry.weekType === 'examination' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                  Term Exam
                                </span>
                              ) : entry.weekType === 'special_instructional' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-100 text-cyan-800 border border-cyan-200">
                                  Special Period
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Instructional
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 max-w-xs">
                              <div className="font-bold text-slate-900 truncate" title={entry.topic}>
                                {entry.topic}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate" title={entry.subtopic}>
                                {entry.subtopic}
                              </div>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                                {entry.objectives.length} Objectives
                              </span>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              {itemReadiness.status === 'READY' ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]" title="12/12 NERDC Rules Verified">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Ready ✓</span>
                                </span>
                              ) : itemReadiness.status === 'WARNING' ? (
                                <span className="text-amber-700 font-bold flex items-center gap-1 text-[11px]" title={itemReadiness.warnings.join('; ')}>
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Warning ⚠</span>
                                </span>
                              ) : (
                                <span className="text-red-700 font-bold flex items-center gap-1 text-[11px]" title={itemReadiness.errors.join('; ')}>
                                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                  <span>Not Ready ✕</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right whitespace-nowrap space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenStagedItemEditor(entry, originalIndex)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                              >
                                Edit / Correct
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStagedItem(originalIndex)}
                                className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                                title="Remove staged item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* STAGE 8 & 9: APPROVAL & COMMITTING TO THE CURRICULUM DATABASE */}
              <div className="bg-[#F0FDF4] border-2 border-emerald-300 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
                      Stage 8 & 9: Final Approval & Ingestion Commitment
                    </span>
                    <h5 className="text-base font-black text-slate-900 uppercase font-display">
                      Publish Staged NERDC Curriculum Records
                    </h5>
                    <p className="text-xs text-slate-600 font-medium">
                      Select target publishing stage for persistent storage in Brightly Home Lesson.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={isCommittingImport}
                      onClick={() => handleCommitBatchPublish('DRAFT')}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
                    >
                      Commit as DRAFT
                    </button>

                    <button
                      type="button"
                      disabled={isCommittingImport}
                      onClick={() => handleCommitBatchPublish('APPROVED')}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all disabled:opacity-50"
                    >
                      Commit as APPROVED
                    </button>

                    <button
                      type="button"
                      disabled={isCommittingImport}
                      onClick={() => handleCommitBatchPublish('PUBLISHED')}
                      className="px-5 py-2.5 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isCommittingImport ? 'Committing...' : 'Publish Directly to Classroom'}</span>
                    </button>
                  </div>
                </div>

                {importCommitSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-300 text-xs font-bold text-[#026838] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#026838] shrink-0" />
                    <span>{importCommitSuccessMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5.1 INLINE STAGED RECORD CORRECTION MODAL */}
      {/* ========================================================================= */}
      {isStagedEditorOpen && editingStagedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 space-y-4 my-auto max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded">
                  Staging Correction Tool (Stage 7)
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase font-display mt-0.5">
                  Correct Staged Record: Week {editingStagedItem.week}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStagedEditorOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStagedItemCorrection} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Class:</label>
                  <select
                    value={editingStagedItem.grade}
                    onChange={(e) => setEditingStagedItem({ ...editingStagedItem, grade: Number(e.target.value) as GradeLevel })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Primary {g}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Subject:</label>
                  <select
                    value={editingStagedItem.subject}
                    onChange={(e) => setEditingStagedItem({ ...editingStagedItem, subject: e.target.value as SubjectName })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    {ALL_CORE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Term:</label>
                  <select
                    value={editingStagedItem.term}
                    onChange={(e) => setEditingStagedItem({ ...editingStagedItem, term: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Week:</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={editingStagedItem.week}
                    onChange={(e) => setEditingStagedItem({ ...editingStagedItem, week: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Week Period Classification:</label>
                <select
                  value={editingStagedItem.weekType || 'instructional'}
                  onChange={(e) => setEditingStagedItem({ ...editingStagedItem, weekType: e.target.value as WeekPeriodType })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value="instructional">Instructional Week (Standard Syllabus)</option>
                  <option value="revision">Revision Week (Mid-Term or Term Revision)</option>
                  <option value="assessment">Assessment Week (Continuous Assessment / CA)</option>
                  <option value="examination">Examination Period (Term Final Examination)</option>
                  <option value="special_instructional">Special Instructional Period (Practical / Project)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Topic Title:</label>
                <input
                  type="text"
                  required
                  value={editingStagedItem.topic}
                  onChange={(e) => setEditingStagedItem({ ...editingStagedItem, topic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Subtopic:</label>
                <input
                  type="text"
                  value={editingStagedItem.subtopic}
                  onChange={(e) => setEditingStagedItem({ ...editingStagedItem, subtopic: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Learning Objectives (One per line):</label>
                <textarea
                  rows={4}
                  value={editingStagedItem.objectives.join('\n')}
                  onChange={(e) => setEditingStagedItem({ ...editingStagedItem, objectives: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium text-xs leading-relaxed"
                />
              </div>

              {/* LIVE LESSON READINESS GATE EVALUATION */}
              {(() => {
                const liveReport = validateClientCurriculumReadiness(editingStagedItem);
                const isReady = liveReport.status === 'READY';
                const isWarning = liveReport.status === 'WARNING';

                return (
                  <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    isReady
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : isWarning
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                        {isReady ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>Lesson Readiness Gate: {liveReport.status}</span>
                      </span>
                      <span className="text-[10px] font-bold opacity-75">
                        {liveReport.summary.passedChecks} / {liveReport.summary.totalChecks} Rules Passed
                      </span>
                    </div>

                    {liveReport.errors.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-rose-200">
                        <span className="text-[10px] font-black uppercase text-rose-700 block">
                          Blocking Quality Defects ({liveReport.errors.length}):
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-900 font-medium">
                          {liveReport.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {liveReport.warnings.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-amber-200">
                        <span className="text-[10px] font-black uppercase text-amber-700 block">
                          Advisory Warnings ({liveReport.warnings.length}):
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900 font-medium">
                          {liveReport.warnings.map((warn, i) => (
                            <li key={i}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStagedEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black uppercase text-xs cursor-pointer shadow-xs"
                >
                  Save Correction & Revalidate
                </button>
              </div>
            </form>
          </div>
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
      {/* 6.1 CONTROLLED PILOT READINESS & OPERATIONS */}
      {/* ========================================================================= */}
      {adminTab === 'pilot' && (
        <PilotReadinessPanel />
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                    {Array.from({ length: 14 }, (_, i) => i + 1).map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Period Classification:</label>
                  <select
                    value={editingRecord.weekType || 'instructional'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, weekType: e.target.value as WeekPeriodType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 font-bold text-xs"
                  >
                    <option value="instructional">Instructional</option>
                    <option value="revision">Revision Week</option>
                    <option value="assessment">Assessment (CA)</option>
                    <option value="examination">Term Exam</option>
                    <option value="special_instructional">Special Period</option>
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
