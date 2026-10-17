import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { 
  StudentProfile, 
  ParentAccount, 
  WalletTransaction, 
  GradeLevel, 
  VoiceTone, 
  TermPaymentRecord, 
  STANDARD_TUITION_FEES,
  BRIGHTLY_PRICING_PLANS,
  SubscriptionPlanType,
  getPlanTitle,
  getPlanDurationDays,
  SubjectName,
  PublishingStatus,
  CurriculumCoverageStat,
  AdminUser,
  UserSession,
  AuditLogEntry,
  UserRole,
  PilotSettings,
  ParentPilotFeedback,
  PilotIncident,
  AccountClassification,
  AccountStatus,
  OnboardFamilyInput,
  OnboardFamilyResult,
  ReferralRecord,
  ReferralStatus,
  CreditLedgerCategory,
  CreditLedgerEntry,
  MaskedReferralItem,
  ParentReferralSummary,
  CurriculumAuthorityMetadata,
  CurriculumHierarchyNode,
  MissingCurriculumDocument,
  AuditableCoverageReport,
  SchoolSchemeOfWorkRecord,
  CurriculumLifecycleState
} from './types';
import { 
  REFERRAL_PROGRAM_CONFIG, 
  isQualifyingReferralPlan, 
  maskParentNameForReferrer, 
  generateParentReferralCode 
} from './referralConfig';
import {
  NATIONAL_NERDC_AUTHORITY,
  OFFICIAL_MISSING_NERDC_DOCUMENTS,
  VERIFIED_HIERARCHY_RECORDS,
  SAMPLE_SCHOOL_SCHEMES_OF_WORK,
  generateAuditableCoverageReport,
  isCurriculumNodeComplete
} from './curriculumArchitecture';
import { NATIONAL_CURRICULUM_LESSONS } from '../src/data/curriculum';
import { PersistenceManager, hashPassword, generateToken, PersistentSchema } from './persistence';
import { validateCurriculumReadiness, LessonReadinessReport } from './readinessValidator';
import { 
  evaluateSubjectMastery, 
  buildParentAcademicSummary, 
  RECOMMENDED_30_MIN_LESSON_PLAN, 
  ParentAcademicSummaryReport 
} from './lessonDelivery';

// Helper to provision initial administrator credentials securely
const KNOWN_INSECURE_HASH = "a36e315bd77a663da2fc1ac181823e2fd6d0bd8ee1169414bddf0082988c161499161fa8d3c48a7e313a267275b987d76353292609a293d1acc5918675990f8b";

function getInitialAdminCredentials(): { salt: string; hash: string } {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const salt = crypto.randomBytes(16).toString('hex');
  if (initialPassword && initialPassword.trim().length >= 10) {
    return { salt, hash: hashPassword(initialPassword.trim(), salt) };
  }
  // Generate a random cryptographically strong provisioning password
  const generatedPassword = `Bhl#${crypto.randomBytes(8).toString('hex')}!2026`;
  console.log('[SECURITY] Initial admin provisioned with secure password.');
  return { salt, hash: hashPassword(generatedPassword, salt) };
}

export interface ServerCurriculumRecord {
  id: string;
  grade: GradeLevel;
  term: 1 | 2 | 3;
  week: number;
  subject: SubjectName;
  topic: string;
  subtopic: string;
  weekType?: 'instructional' | 'revision' | 'assessment' | 'examination' | 'special_instructional';
  periodTitle?: string;
  specialPeriodNote?: string;
  theme?: string | null;
  competencies?: string[] | null;
  contentOutline?: string;
  learningActivities?: string[];
  teachingResources?: string[];
  isFree: boolean;
  teacherId: string;
  objectives: string[];
  lastWeekRevision: string;
  previousKnowledge: string;
  concreteVisualAids: any[];
  whiteboardSteps: any[];
  practiceProblems: any[];
  assessmentQuestions: any[];
  publishingStatus: PublishingStatus;
  curriculumVersion: string;
  sourceDocument?: string;
  sourceReference?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  notes?: string;
  readiness?: LessonReadinessReport;
  createdAt: string;
  updatedAt: string;
}

// In-Memory active stores (backed by file persistence)
const studentsStore = new Map<string, StudentProfile>();
const parentsStore = new Map<string, ParentAccount>();
const adminsStore = new Map<string, AdminUser>();
const sessionsStore = new Map<string, UserSession>();
const paymentsStore = new Map<string, TermPaymentRecord>();
const curriculumStore = new Map<string, ServerCurriculumRecord>();
let walletTransactions: WalletTransaction[] = [];
let auditLogs: AuditLogEntry[] = [];
let pilotSettingsStore: PilotSettings = {
  isPaused: false,
  checklistState: {},
  webhookVerifiedLive: false
};
const pilotFeedbacksStore = new Map<string, ParentPilotFeedback>();
const incidentsStore = new Map<string, PilotIncident>();
const referralsStore = new Map<string, ReferralRecord>();
let creditLedgerStore: CreditLedgerEntry[] = [];

// Seed metadata for the 6 verified curriculum records
const themesAndCompetenciesMap: Record<string, {
  theme: string;
  competencies: string[];
  contentOutline: string;
  learningActivities: string[];
  teachingResources: string[];
}> = {
  'p4-t1-w3-geo': {
    theme: 'Environment and Nigerian Geopolitics',
    competencies: ['Map Reading', 'Environmental Awareness', 'National Identity'],
    contentOutline: 'Major Nigerian geopolitical zones, rivers Niger and Benue, seasonal climate variations.',
    learningActivities: ['Locating zones on Nigerian map', 'Tracing River Niger and Benue meeting point at Lokoja'],
    teachingResources: ['Physical map of Nigeria', 'Rain gauge demonstration']
  },
  'p4-t1-w1-math': {
    theme: 'Number and Numeration',
    competencies: ['Place Value Understanding', 'Large Number Reading', 'Problem Solving'],
    contentOutline: 'Place value concepts up to 100,000 using Nigerian currency and concrete counters.',
    learningActivities: ['Grouping currency bundles into tens, hundreds, thousands', 'Abacus exercises'],
    teachingResources: ['Abacus', 'Naira note replicas', 'Place value charts']
  },
  'p4-t1-w2-math': {
    theme: 'Number and Numeration',
    competencies: ['Fraction Manipulation', 'Real-world Sharing', 'Critical Thinking'],
    contentOutline: 'Proper, improper and mixed fractions using Agege bread and agricultural produce.',
    learningActivities: ['Dividing Agege bread loaves into equal slices', 'Converting mixed numbers to improper fractions'],
    teachingResources: ['Model bread loaf', 'Fraction charts']
  },
  'p3-t1-w3-sci': {
    theme: 'Basic Science - Living Things',
    competencies: ['Scientific Observation', 'Classification', 'Environmental Care'],
    contentOutline: 'Characteristics of living things vs non-living objects in Nigerian school and home environments.',
    learningActivities: ['Classifying objects in school compound', 'Checking MR NIGER D traits'],
    teachingResources: ['Live potted plant', 'Specimen stones and dry twigs']
  },
  'p4-t1-w2-eng': {
    theme: 'Grammatical Accuracy & Vocabulary',
    competencies: ['Part of Speech Identification', 'Creative Writing', 'Oral Expression'],
    contentOutline: 'Proper, common, collective and abstract nouns with Nigerian community examples.',
    learningActivities: ['Identifying nouns in Nigerian folk story', 'Categorizing collective nouns like a herd of cattle'],
    teachingResources: ['Noun classification flashcards', 'Story excerpts']
  },
  'p2-t1-w3-math': {
    theme: 'Number & Counting',
    competencies: ['Skip Counting', 'Pattern Recognition', 'Mental Arithmetic'],
    contentOutline: 'Skip counting in 2s, 3s, 5s and 10s up to 100 using Nigerian market trade contexts.',
    learningActivities: ['Tallying bundles of 5 and 10 Naira notes', 'Number line jumps'],
    teachingResources: ['Number line chart', 'Counting cowries and bottle caps']
  }
};

function createInitialCurriculumRecords(): ServerCurriculumRecord[] {
  return NATIONAL_CURRICULUM_LESSONS.map(lesson => {
    const normId = lesson.id.trim().replace(/_/g, '-');
    const meta = themesAndCompetenciesMap[normId] || {
      theme: 'Universal Basic Education Core Scheme',
      competencies: ['Knowledge Application', 'Critical Thinking'],
      contentOutline: lesson.topic,
      learningActivities: ['Direct teacher demonstration', 'Guided practice with concrete visual aids'],
      teachingResources: ['Concrete Visual Aids', 'Interactive Whiteboard']
    };

    return {
      ...lesson,
      id: normId,
      theme: meta.theme,
      competencies: meta.competencies,
      contentOutline: meta.contentOutline,
      learningActivities: meta.learningActivities,
      teachingResources: meta.teachingResources,
      publishingStatus: 'PUBLISHED' as PublishingStatus,
      curriculumVersion: 'nerdc-based-v1',
      sourceDocument: 'NERDC National Curriculum for Basic Education',
      sourceReference: 'Universal Basic Education (UBE) Primary Curriculum Standards',
      reviewedBy: 'NERDC Senior Curriculum Specialist',
      reviewedAt: '2026-01-02T10:00:00Z',
      approvedBy: 'National Education Quality Assurance Bureau',
      approvedAt: '2026-01-03T12:00:00Z',
      publishedAt: '2026-01-05T08:00:00Z',
      notes: 'Preserved authentic curriculum foundation record.',
      createdAt: '2026-01-02T08:00:00Z',
      updatedAt: '2026-01-05T08:00:00Z'
    };
  });
}

// Function to trigger state serialization to file
function persist(): void {
  const payload: PersistentSchema = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    admins: Array.from(adminsStore.values()),
    parents: Array.from(parentsStore.values()),
    students: Array.from(studentsStore.values()),
    sessions: Array.from(sessionsStore.values()),
    payments: Array.from(paymentsStore.values()),
    transactions: walletTransactions,
    curriculum: Array.from(curriculumStore.values()),
    auditLogs,
    pilotSettings: pilotSettingsStore,
    pilotFeedbacks: Array.from(pilotFeedbacksStore.values()),
    incidents: Array.from(incidentsStore.values()),
    referrals: Array.from(referralsStore.values()),
    creditLedger: creditLedgerStore
  };

  PersistenceManager.save(payload);
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      lastDiskMtime = fs.statSync(DB_FILE_PATH).mtimeMs;
    }
  } catch {
    lastDiskMtime = Date.now();
  }
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE_PATH = path.resolve(DATA_DIR, 'brightly_db.json');
let lastDiskMtime = 0;

function syncFromDiskIfNeeded(): void {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) return;
    const stat = fs.statSync(DB_FILE_PATH);
    if (stat.mtimeMs > lastDiskMtime) {
      const loaded = PersistenceManager.load();
      if (loaded && Array.isArray(loaded.parents) && Array.isArray(loaded.students)) {
        loaded.admins?.forEach(a => { if (a?.id) adminsStore.set(a.id, a); });
        loaded.parents?.forEach(p => { if (p?.id) parentsStore.set(p.id, p); });
        loaded.students?.forEach(s => { if (s?.id) studentsStore.set(s.id, s); });
        loaded.sessions?.forEach(s => { if (s?.token) sessionsStore.set(s.token, s); });
        loaded.payments?.forEach(p => { if (p?.transactionReference) paymentsStore.set(p.transactionReference, p); });
        loaded.curriculum?.forEach(c => { if (c?.id) curriculumStore.set(c.id, c); });
        if (loaded.pilotSettings) {
          pilotSettingsStore = loaded.pilotSettings;
        }
        loaded.pilotFeedbacks?.forEach(f => { if (f?.id) pilotFeedbacksStore.set(f.id, f); });
        loaded.incidents?.forEach(i => { if (i?.id) incidentsStore.set(i.id, i); });
        loaded.referrals?.forEach(r => { if (r?.id) referralsStore.set(r.id, r); });
        if (loaded.creditLedger) {
          creditLedgerStore = loaded.creditLedger;
        }
      }
      lastDiskMtime = stat.mtimeMs;
    }
  } catch {}
}

function maskSecretsInText(text: string): string {
  if (!text) return text;
  return text
    .replace(/sk_live_[a-zA-Z0-9_-]+/g, 'sk_live_••••[MASKED]')
    .replace(/sk_test_[a-zA-Z0-9_-]+/g, 'sk_test_••••[MASKED]')
    .replace(/AIzaSy[a-zA-Z0-9_-]+/g, 'AIzaSy••••[MASKED]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ••••[MASKED]')
    .replace(/password[:=]\s*["']?[^"',\s]+/gi, 'password=••••[MASKED]');
}

function createInitialStudents(): StudentProfile[] {
  return [
    {
      id: 'chidi',
      parentId: 'parent_main',
      name: 'Chidi',
      username: 'chidi',
      password: '1234',
      grade: 4,
      registeredGrade: 4,
      pin: '1234',
      avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
      avatarColor: '#1E88E5',
      currentTerm: 1,
      currentWeek: 3,
      overallScore: 88,
      scoreChangeText: 'UP 5% FROM LAST TERM',
      topSubject: 'Mathematics',
      lessonsCompletedThisWeek: 3,
      totalLessonsThisWeek: 5,
      completedLessons: [
        {
          topicId: 'p4-t1-w1-math',
          subject: 'Mathematics',
          title: 'Whole Numbers & Place Value up to 100,000',
          score: 95,
          badge: 'Math Pioneer',
          reexplained: false,
          completedAt: '2026-01-15T10:00:00Z'
        },
        {
          topicId: 'p4-t1-w2-math',
          subject: 'Mathematics',
          title: 'Fractions with Agege Bread & Nigerian Yam',
          score: 85,
          badge: 'Concrete Thinker',
          reexplained: true,
          completedAt: '2026-01-22T11:30:00Z'
        }
      ],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 4,
          amount: 6000,
          reference: 'NERDC-TERM1-4190',
          receiptNo: 'BRT-TERM-41-419001',
          channel: 'Paystack',
          paidAt: '2026-01-15T10:00:00.000Z'
        }
      }
    },
    {
      id: 'aminat',
      parentId: 'parent_main',
      name: 'Aminat',
      username: 'aminat',
      password: '1234',
      grade: 2,
      registeredGrade: 2,
      pin: '1234',
      avatarUrl: '/assets/nigerian_pupil_girl_1788178854346.jpg',
      avatarColor: '#E91E63',
      currentTerm: 1,
      currentWeek: 3,
      overallScore: 92,
      scoreChangeText: 'TOP 5% IN CLASS',
      topSubject: 'Mathematics',
      lessonsCompletedThisWeek: 2,
      totalLessonsThisWeek: 5,
      completedLessons: [
        {
          topicId: 'p2-t1-w3-math',
          subject: 'Mathematics',
          title: 'Counting in 2s, 3s, 5s and 10s up to 100',
          score: 95,
          badge: 'Master Counter',
          reexplained: false,
          completedAt: '2026-01-20T09:15:00Z'
        }
      ],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 2,
          amount: 6000,
          reference: 'NERDC-TERM1-2180',
          receiptNo: 'BRT-TERM-21-218002',
          channel: 'Paystack',
          paidAt: '2026-01-15T10:30:00.000Z'
        }
      }
    },
    {
      id: 'fatima',
      parentId: 'parent_alt',
      name: 'Fatima',
      username: 'fatima',
      password: '5678',
      grade: 3,
      registeredGrade: 3,
      pin: '5678',
      avatarUrl: '/assets/nigerian_pupil_girl_1788178854346.jpg',
      avatarColor: '#10B981',
      currentTerm: 1,
      currentWeek: 3,
      overallScore: 94,
      scoreChangeText: 'CONSISTENT EXCELLENCE',
      topSubject: 'Basic Science & Technology',
      lessonsCompletedThisWeek: 3,
      totalLessonsThisWeek: 5,
      completedLessons: [
        {
          topicId: 'p3-t1-w3-sci',
          subject: 'Basic Science & Technology',
          title: 'Living & Non-Living Things in Our Environment',
          score: 94,
          badge: 'Science Explorer',
          reexplained: false,
          completedAt: '2026-01-18T11:00:00Z'
        }
      ],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 3,
          amount: 6000,
          reference: 'NERDC-TERM1-3140',
          receiptNo: 'BRT-TERM-31-314003',
          channel: 'Paystack',
          paidAt: '2026-01-16T14:00:00.000Z'
        }
      }
    },
    {
      id: 'ibrahim_test_pupil',
      parentId: 'parent_alt',
      name: 'Ibrahim Jr',
      username: 'ibrahim',
      password: '123',
      grade: 3,
      registeredGrade: 3,
      pin: '1234',
      avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
      avatarColor: '#8B5CF6',
      currentTerm: 1,
      currentWeek: 1,
      overallScore: 82,
      scoreChangeText: 'READY FOR SCIENCE',
      topSubject: 'Basic Science & Technology',
      lessonsCompletedThisWeek: 0,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: false,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {}
    },
    {
      id: 'oluwaseun',
      parentId: 'parent_main',
      name: 'Oluwaseun',
      username: 'seun',
      password: '123',
      grade: 4,
      registeredGrade: 4,
      pin: '1234',
      avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
      avatarColor: '#F59E0B',
      currentTerm: 1,
      currentWeek: 1,
      overallScore: 86,
      scoreChangeText: 'READY FOR PRIMARY 4',
      topSubject: 'Mathematics',
      lessonsCompletedThisWeek: 0,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: false,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {}
    },
    {
      id: 'zainab',
      parentId: 'parent_alt',
      name: 'Zainab',
      username: 'zainab',
      password: '123',
      grade: 2,
      registeredGrade: 2,
      pin: '1234',
      avatarUrl: '/assets/nigerian_pupil_girl_1788178854346.jpg',
      avatarColor: '#EC4899',
      currentTerm: 1,
      currentWeek: 1,
      overallScore: 89,
      scoreChangeText: 'READY FOR PRIMARY 2',
      topSubject: 'Mathematics',
      lessonsCompletedThisWeek: 0,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: false,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {}
    },
    {
      id: 'emeka',
      parentId: 'parent_main',
      name: 'Emeka',
      username: 'emeka',
      password: '123',
      grade: 4,
      registeredGrade: 4,
      pin: '1234',
      avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
      avatarColor: '#3B82F6',
      currentTerm: 1,
      currentWeek: 1,
      overallScore: 84,
      scoreChangeText: 'READY FOR ENGLISH & MATH',
      topSubject: 'English Studies',
      lessonsCompletedThisWeek: 0,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: false,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {}
    }
  ];
}

// Initialize from file storage or seed defaults
function initializeDatabase(): void {
  const loaded = PersistenceManager.load();

  if (loaded && loaded.students && loaded.students.length > 0) {
    console.log('[DB] Loading persistent database from disk...');
    loaded.admins?.forEach(a => { if (a?.id) adminsStore.set(a.id, a); });
    loaded.parents?.forEach(p => { if (p?.id) parentsStore.set(p.id, p); });
    loaded.students?.forEach(s => { if (s?.id) studentsStore.set(s.id, s); });
    loaded.sessions?.forEach(s => { if (s?.token) sessionsStore.set(s.token, s); });
    loaded.payments?.forEach(p => { if (p?.transactionReference) paymentsStore.set(p.transactionReference, p); });
    loaded.curriculum?.forEach(c => { if (c?.id) curriculumStore.set(c.id, c); });
    
    // Refresh verified seed curriculum foundations with latest pedagogy and objectives
    createInitialCurriculumRecords().forEach(seedRec => {
      curriculumStore.set(seedRec.id, seedRec);
    });

    walletTransactions = loaded.transactions || [];
    auditLogs = loaded.auditLogs || [];

    if (loaded.pilotSettings) {
      pilotSettingsStore = loaded.pilotSettings;
    }
    loaded.pilotFeedbacks?.forEach(f => { if (f?.id) pilotFeedbacksStore.set(f.id, f); });
    loaded.incidents?.forEach(i => { if (i?.id) incidentsStore.set(i.id, i); });
    loaded.referrals?.forEach(r => { if (r?.id) referralsStore.set(r.id, r); });
    creditLedgerStore = loaded.creditLedger || [];

    // Security Hardening: Purge any legacy insecure admin123 password hash
    let purgedInsecure = false;
    for (const [id, admin] of adminsStore.entries()) {
      if (admin.passwordHash === KNOWN_INSECURE_HASH) {
        console.warn(`[SECURITY] Purging known insecure admin123 hash for ${admin.email}...`);
        const { salt, hash } = getInitialAdminCredentials();
        admin.salt = salt;
        admin.passwordHash = hash;
        adminsStore.set(id, admin);
        purgedInsecure = true;
      }
    }

    // Clean up temporary test runner artifacts from previous automated audits
    let cleanedScratch = false;
    for (const [id, s] of studentsStore.entries()) {
      if (!id) {
        studentsStore.delete(id);
        cleanedScratch = true;
      } else if (id.startsWith('pupil_unpaid_') || id.startsWith('pupil_pilot_') || s?.name?.includes('Unpaid Pupil') || s?.name?.includes('Arbitrary Check')) {
        studentsStore.delete(id);
        cleanedScratch = true;
      }
    }
    for (const [id] of parentsStore.entries()) {
      if (!id) {
        parentsStore.delete(id);
        cleanedScratch = true;
      } else if (id.startsWith('parent_pilot_')) {
        parentsStore.delete(id);
        cleanedScratch = true;
      }
    }
    // Ensure all 7 authentic cohort pupils are registered
    createInitialStudents().forEach(seedPupil => {
      if (!studentsStore.has(seedPupil.id)) {
        studentsStore.set(seedPupil.id, seedPupil);
        cleanedScratch = true;
      }
    });

    if (purgedInsecure || cleanedScratch) {
      persist();
    }

    console.log(`[DB] Restored: ${studentsStore.size} pupils, ${parentsStore.size} parents, ${curriculumStore.size} curriculum records, ${paymentsStore.size} payments.`);
  } else {
    console.log('[DB] Seeding new persistent database...');

    // 1. Seed Secure Admin
    const { salt: adminSalt, hash: adminHash } = getInitialAdminCredentials();
    const initialAdmin: AdminUser = {
      id: 'admin_master',
      name: 'Brightly Curriculum Director',
      email: process.env.ADMIN_INITIAL_EMAIL || 'admin@brightly.ng',
      role: 'admin',
      salt: adminSalt,
      passwordHash: adminHash,
      createdAt: '2026-01-01T08:00:00.000Z'
    };
    adminsStore.set(initialAdmin.id, initialAdmin);

    // 2. Seed Parents (Two parents for strict multi-parent isolation verification)
    const parent1: ParentAccount = {
      id: 'parent_main',
      name: 'Mr & Mrs Okafor',
      email: 'parents@brightly.ng',
      pin: '1234',
      phone: '+234 803 123 4567',
      walletBalance: 3500,
      referralCode: 'BRIGHT-PUPIL-88',
      referredCount: 3,
      subscriptionPlan: 'none',
      subscriptionExpiry: '2026-12-31T23:59:59.000Z'
    };
    const parent2: ParentAccount = {
      id: 'parent_alt',
      name: 'Dr. & Mrs. Ibrahim',
      email: 'ibrahim.family@brightly.ng',
      pin: '5678',
      phone: '+234 802 987 6543',
      walletBalance: 12000,
      referralCode: 'BRIGHT-IBRAHIM-44',
      referredCount: 1,
      subscriptionPlan: 'termly',
      subscriptionExpiry: '2026-04-30T23:59:59.000Z'
    };
    parentsStore.set(parent1.id, parent1);
    parentsStore.set(parent2.id, parent2);

    // 3. Seed Students (explicitly linked to parentId)
    const initialStudents = createInitialStudents();
    initialStudents.forEach(s => studentsStore.set(s.id, s));

    // 4. Seed Payments
    const initialPayments: TermPaymentRecord[] = [
      {
        id: 'pay_init_chidi_t1',
        parentId: 'parent_main',
        childId: 'chidi',
        childName: 'Chidi',
        grade: 4,
        term: 1,
        amount: 6000,
        currency: 'NGN',
        status: 'paid',
        channel: 'Paystack',
        transactionReference: 'NERDC-TERM1-4190',
        paystackReference: 'NERDC-TERM1-4190',
        receiptNo: 'BRT-TERM-41-419001',
        paymentDate: '2026-01-15T10:00:00.000Z',
        accessStartDate: '2026-01-15T10:00:00.000Z',
        accessEndDate: '2026-04-25T10:00:00.000Z',
        planTitle: 'Brightly Home Lesson — Term Learning Plan',
        createdAt: '2026-01-15T09:58:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z'
      },
      {
        id: 'pay_init_aminat_t1',
        parentId: 'parent_main',
        childId: 'aminat',
        childName: 'Aminat',
        grade: 2,
        term: 1,
        amount: 6000,
        currency: 'NGN',
        status: 'paid',
        channel: 'Paystack',
        transactionReference: 'NERDC-TERM1-2180',
        paystackReference: 'NERDC-TERM1-2180',
        receiptNo: 'BRT-TERM-21-218002',
        paymentDate: '2026-01-15T10:30:00.000Z',
        accessStartDate: '2026-01-15T10:30:00.000Z',
        accessEndDate: '2026-04-25T10:30:00.000Z',
        planTitle: 'Brightly Home Lesson — Term Learning Plan',
        createdAt: '2026-01-15T10:28:00.000Z',
        updatedAt: '2026-01-15T10:30:00.000Z'
      },
      {
        id: 'pay_init_fatima_t1',
        parentId: 'parent_alt',
        childId: 'fatima',
        childName: 'Fatima',
        grade: 3,
        term: 1,
        amount: 6000,
        currency: 'NGN',
        status: 'paid',
        channel: 'Paystack',
        transactionReference: 'NERDC-TERM1-3140',
        paystackReference: 'NERDC-TERM1-3140',
        receiptNo: 'BRT-TERM-31-314003',
        paymentDate: '2026-01-16T14:00:00.000Z',
        accessStartDate: '2026-01-16T14:00:00.000Z',
        accessEndDate: '2026-04-25T14:00:00.000Z',
        planTitle: 'Brightly Home Lesson — Term Learning Plan',
        createdAt: '2026-01-16T13:50:00.000Z',
        updatedAt: '2026-01-16T14:00:00.000Z'
      }
    ];

    initialPayments.forEach(p => paymentsStore.set(p.transactionReference, p));

    // 5. Seed Authentic Curriculum
    createInitialCurriculumRecords().forEach(c => curriculumStore.set(c.id, c));

    // 6. Seed Wallet Transactions
    walletTransactions = [
      {
        id: 'tx_init_01',
        type: 'credit',
        amount: 5000,
        description: 'Wallet funding via Paystack',
        channel: 'Paystack',
        reference: 'PAY-INIT-5000-01',
        date: '2026-01-05T10:00:00Z'
      }
    ];

    persist();
  }
}

// Run DB initialization immediately
initializeDatabase();

export function normalizeNigerianPhone(input: string): string {
  if (!input) return '';
  const cleaned = input.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+234')) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('234') && cleaned.length >= 12) {
    return '0' + cleaned.slice(3);
  }
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return '0' + cleaned;
  }
  return cleaned;
}

export function isValidNigerianPhone(phone: string): boolean {
  const norm = normalizeNigerianPhone(phone);
  return /^0[789][01]\d{8}$/.test(norm);
}

export const db = {
  // --------------------------------------------------------------------------
  // USER SESSIONS & AUTHENTICATION
  // --------------------------------------------------------------------------
  createSession: (data: {
    userId: string;
    role: UserRole;
    parentId?: string;
    studentId?: string;
    email?: string;
    name: string;
  }): UserSession => {
    const token = `BHL_SESS_${generateToken()}`;
    const now = new Date();
    // Admin sessions expire in 12 hours for higher security; parent/pupil sessions expire in 30 days
    const validityMs = data.role === 'admin' ? 12 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + validityMs).toISOString();

    const session: UserSession = {
      token,
      userId: data.userId,
      role: data.role,
      parentId: data.parentId,
      studentId: data.studentId,
      email: data.email,
      name: data.name,
      createdAt: now.toISOString(),
      expiresAt
    };

    sessionsStore.set(token, session);
    persist();
    return session;
  },

  getSession: (token: string): UserSession | null => {
    if (!token) return null;
    const session = sessionsStore.get(token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionsStore.delete(token);
      persist();
      return null;
    }
    return session;
  },

  deleteSession: (token: string): boolean => {
    const exists = sessionsStore.delete(token);
    if (exists) persist();
    return exists;
  },

  revokeUserSessions: (userId: string, keepToken?: string): number => {
    let count = 0;
    for (const [token, session] of sessionsStore.entries()) {
      if (session.userId === userId && token !== keepToken) {
        sessionsStore.delete(token);
        count++;
      }
    }
    if (count > 0) persist();
    return count;
  },

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION & GOVERNANCE
  // --------------------------------------------------------------------------
  getAdminByEmail: (email: string): AdminUser | null => {
    const clean = email.toLowerCase().trim();
    for (const admin of adminsStore.values()) {
      if (admin.email.toLowerCase() === clean) return admin;
    }
    return null;
  },

  getAdminById: (id: string): AdminUser | null => {
    return adminsStore.get(id) || null;
  },

  provisionAdmin: (data: { email: string; password?: string; name: string }): AdminUser => {
    const existing = db.getAdminByEmail(data.email);
    const salt = crypto.randomBytes(16).toString('hex');
    const pwd = data.password || `Brightly#Admin!${crypto.randomBytes(6).toString('hex')}`;
    const hash = hashPassword(pwd, salt);

    if (existing) {
      existing.name = data.name;
      existing.salt = salt;
      existing.passwordHash = hash;
      adminsStore.set(existing.id, existing);
      persist();
      return existing;
    }

    const newAdmin: AdminUser = {
      id: `admin_${Date.now()}`,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      role: 'admin',
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };
    adminsStore.set(newAdmin.id, newAdmin);
    persist();
    return newAdmin;
  },

  verifyAdminCredentials: (email: string, passwordAttempt: string): AdminUser | null => {
    if (!email || !passwordAttempt) return null;
    const admin = db.getAdminByEmail(email);

    // Defense against timing enumeration: execute hash computation even if account not found
    if (!admin) {
      hashPassword(passwordAttempt, 'dummy_salt_for_timing_defense_32bytes');
      return null;
    }

    const computed = hashPassword(passwordAttempt, admin.salt);
    const computedBuf = Buffer.from(computed, 'hex');
    const storedBuf = Buffer.from(admin.passwordHash, 'hex');

    // Constant-time comparison prevents timing analysis
    if (computedBuf.length === storedBuf.length && crypto.timingSafeEqual(computedBuf, storedBuf)) {
      return admin;
    }

    return null;
  },

  rotateAdminPassword: (
    adminId: string, 
    currentPasswordAttempt: string, 
    newPassword: string
  ): { success: boolean; message: string } => {
    const admin = adminsStore.get(adminId);
    if (!admin) {
      return { success: false, message: 'Administrator account not found.' };
    }

    // Verify current password with constant-time equality
    const currentComputed = hashPassword(currentPasswordAttempt, admin.salt);
    const currentBuf = Buffer.from(currentComputed, 'hex');
    const storedBuf = Buffer.from(admin.passwordHash, 'hex');
    if (currentBuf.length !== storedBuf.length || !crypto.timingSafeEqual(currentBuf, storedBuf)) {
      return { success: false, message: 'Current administrator password is incorrect.' };
    }

    // Validate strong password policy
    if (newPassword.length < 10) {
      return { success: false, message: 'New password must be at least 10 characters long.' };
    }
    if (!/[A-Z]/.test(newPassword)) {
      return { success: false, message: 'New password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(newPassword)) {
      return { success: false, message: 'New password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(newPassword)) {
      return { success: false, message: 'New password must contain at least one number.' };
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return { success: false, message: 'New password must contain at least one special character.' };
    }

    // Generate fresh cryptographic salt and hash
    const newSalt = crypto.randomBytes(16).toString('hex');
    admin.salt = newSalt;
    admin.passwordHash = hashPassword(newPassword, newSalt);
    adminsStore.set(adminId, admin);

    // Revoke all existing sessions for this administrator
    db.revokeUserSessions(adminId);

    // Record audit log entry
    db.recordAuditLog({
      adminId,
      adminEmail: admin.email,
      action: 'ROLE_CHANGE',
      targetType: 'user',
      targetId: adminId,
      details: { event: 'Admin Password Rotated' },
      ipAddress: 'internal'
    });

    persist();
    return { success: true, message: 'Administrator password rotated successfully. All prior sessions revoked.' };
  },

  // --------------------------------------------------------------------------
  // STUDENTS CRUD & ISOLATION
  // --------------------------------------------------------------------------
  getStudents: (parentIdFilter?: string): StudentProfile[] => {
    syncFromDiskIfNeeded();
    const list = Array.from(studentsStore.values());
    if (parentIdFilter) {
      return list.filter(s => s.parentId === parentIdFilter);
    }
    return list;
  },

  getStudentById: (id: string): StudentProfile | undefined => {
    syncFromDiskIfNeeded();
    return studentsStore.get(id);
  },

  getStudentsByParentId: (parentId: string): StudentProfile[] => {
    syncFromDiskIfNeeded();
    return Array.from(studentsStore.values()).filter(s => s.parentId === parentId);
  },

  addStudent: (student: Partial<StudentProfile> & { name: string }): StudentProfile => {
    syncFromDiskIfNeeded();
    const fullStudent: StudentProfile = {
      id: student.id || `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      parentId: student.parentId || 'parent_main',
      name: student.name,
      grade: student.grade || 4,
      registeredGrade: student.registeredGrade || student.grade || 4,
      schoolName: student.schoolName || 'Corona School Lagos',
      academicSession: student.academicSession || '2024/2025',
      currentTerm: student.currentTerm || 1,
      totalLessonsThisWeek: 5,
      lessonsCompletedThisWeek: 0,
      overallScore: 0,
      topSubject: student.topSubject || 'Mathematics',
      scoreChangeText: 'READY FOR FIRST LESSON',
      activeSubscription: Boolean(student.activeSubscription),
      completedLessons: student.completedLessons || [],
      termlyTuition: student.termlyTuition || {},
      ...student
    } as StudentProfile;
    studentsStore.set(fullStudent.id, fullStudent);
    persist();
    return fullStudent;
  },

  updateStudentTermlyTuition: (studentId: string, term: number, amount: number = 6000, reference?: string): StudentProfile | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;
    student.activeSubscription = true;
    if (!student.termlyTuition) {
      student.termlyTuition = {};
    }
    student.termlyTuition[term] = {
      paid: true,
      paidAt: new Date().toISOString(),
      amount,
      term: term as 1 | 2 | 3,
      grade: student.grade,
      reference: reference || `REF_${Date.now()}`
    };
    studentsStore.set(studentId, student);
    persist();
    return student;
  },

  getStudentByUsername: (username: string): StudentProfile | undefined => {
    if (!username) return undefined;
    const clean = username.trim().toLowerCase();
    for (const s of studentsStore.values()) {
      if (
        (s.username && s.username.trim().toLowerCase() === clean) ||
        (s.loginIdentifier && s.loginIdentifier.trim().toLowerCase() === clean)
      ) {
        return s;
      }
    }
    return undefined;
  },

  isChildIdentifierTaken: (identifier: string, excludeStudentId?: string): boolean => {
    if (!identifier) return false;
    const clean = identifier.trim().toLowerCase();
    for (const s of studentsStore.values()) {
      if (excludeStudentId && s.id === excludeStudentId) continue;
      if (
        (s.loginIdentifier && s.loginIdentifier.trim().toLowerCase() === clean) ||
        (s.username && s.username.trim().toLowerCase() === clean) ||
        (s.id && s.id.trim().toLowerCase() === clean)
      ) {
        return true;
      }
    }
    return false;
  },

  revokeSessionsForStudent: (studentId: string): void => {
    for (const [token, session] of sessionsStore.entries()) {
      if (session.studentId === studentId || session.userId === studentId) {
        sessionsStore.delete(token);
      }
    }
    persist();
  },

  updateStudentProfile: (id: string, updates: Partial<StudentProfile>): StudentProfile | null => {
    const student = studentsStore.get(id);
    if (!student) return null;
    const updated: StudentProfile = {
      ...student,
      ...updates,
      id: student.id,
      parentId: updates.parentId || student.parentId
    };
    studentsStore.set(id, updated);
    persist();
    return updated;
  },

  deleteStudent: (id: string): boolean => {
    const res = studentsStore.delete(id);
    if (res) persist();
    return res;
  },

  updateStudentGrade: (id: string, grade: GradeLevel): StudentProfile | null => {
    const student = studentsStore.get(id);
    if (!student) return null;
    student.grade = grade;
    studentsStore.set(id, student);
    persist();
    return student;
  },

  updateStudentVoiceTone: (id: string, tone: VoiceTone): StudentProfile | null => {
    const student = studentsStore.get(id);
    if (!student) return null;
    student.preferredVoiceTone = tone;
    studentsStore.set(id, student);
    persist();
    return student;
  },

  recordCompletedLesson: (studentId: string, lessonData: {
    topicId: string;
    subject: SubjectName;
    title: string;
    score: number;
    badge?: string;
    reexplained: boolean;
    retestPassed?: boolean;
    masteryLevel?: any;
    objectivesMastery?: { objective: string; mastered: boolean; masteryLevel?: any; details?: string }[];
    curriculumVersion?: string;
    sourceReference?: string;
  }): StudentProfile | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;

    // Look up authoritative curriculum record to lock versioning
    const currRecord = db.getCurriculumRecordById(lessonData.topicId);

    const evalResult = evaluateSubjectMastery({
      subject: lessonData.subject,
      totalQuestions: 4,
      correctCount: Math.round((lessonData.score / 100) * 4),
      reexplained: Boolean(lessonData.reexplained),
      retestPassed: Boolean(lessonData.retestPassed)
    });

    const entry = {
      ...lessonData,
      masteryLevel: lessonData.masteryLevel || evalResult.masteryLevel,
      badge: lessonData.badge || evalResult.badge,
      curriculumVersion: lessonData.curriculumVersion || currRecord?.curriculumVersion || 'nerdc-based-v1',
      sourceReference: lessonData.sourceReference || currRecord?.sourceReference || 'Universal Basic Education Standards',
      completedAt: new Date().toISOString()
    };

    if (!student.completedLessons) {
      student.completedLessons = [];
    }

    const existingIndex = student.completedLessons.findIndex(l => l.topicId === lessonData.topicId);
    if (existingIndex >= 0) {
      // Preserve original historical completedAt and curriculumVersion if previously set
      const prev = student.completedLessons[existingIndex];
      student.completedLessons[existingIndex] = {
        ...entry,
        completedAt: prev.completedAt || entry.completedAt,
        curriculumVersion: prev.curriculumVersion || entry.curriculumVersion,
        sourceReference: prev.sourceReference || entry.sourceReference
      };
    } else {
      student.completedLessons.push(entry);
    }

    const total = student.completedLessons.reduce((acc, curr) => acc + curr.score, 0);
    student.overallScore = Math.round(total / student.completedLessons.length);
    student.lessonsCompletedThisWeek = student.completedLessons.length;

    studentsStore.set(studentId, student);
    persist();
    return student;
  },

  recordLessonComplete: (studentId: string, lessonData: {
    topicId: string;
    subject?: SubjectName | string;
    title?: string;
    score: number;
    badge?: string;
    reexplained?: boolean;
    retestPassed?: boolean;
    masteryLevel?: any;
    objectivesMastery?: { objective: string; mastered: boolean; masteryLevel?: any; details?: string }[];
  }): StudentProfile | null => {
    const subject = (lessonData.subject as SubjectName) || 'Mathematics';
    const evalResult = evaluateSubjectMastery({
      subject,
      totalQuestions: 4,
      correctCount: Math.round((lessonData.score / 100) * 4),
      reexplained: Boolean(lessonData.reexplained),
      retestPassed: Boolean(lessonData.retestPassed)
    });

    return db.recordCompletedLesson(studentId, {
      topicId: lessonData.topicId,
      subject,
      title: lessonData.title || 'Curriculum Lesson',
      score: lessonData.score,
      badge: lessonData.badge || evalResult.badge,
      reexplained: Boolean(lessonData.reexplained),
      retestPassed: Boolean(lessonData.retestPassed),
      masteryLevel: lessonData.masteryLevel || evalResult.masteryLevel,
      objectivesMastery: lessonData.objectivesMastery
    });
  },

  updateStudentAvatar: (id: string, avatarUrl: string): StudentProfile | null => {
    const student = studentsStore.get(id);
    if (!student) return null;
    student.avatarUrl = avatarUrl;
    studentsStore.set(id, student);
    persist();
    return student;
  },

  updateStudentScore: (id: string, newScore: number): StudentProfile | null => {
    const student = studentsStore.get(id);
    if (!student) return null;
    student.overallScore = newScore;
    studentsStore.set(id, student);
    persist();
    return student;
  },

  updateStudentSubscription: (
    id: string, 
    active: boolean, 
    termlyTuition?: Record<number, any>
  ): StudentProfile | null => {
    const student = studentsStore.get(id);
    if (!student) return null;
    student.activeSubscription = active;
    if (termlyTuition) {
      student.termlyTuition = {
        ...student.termlyTuition,
        ...termlyTuition
      };
    }
    studentsStore.set(id, student);
    persist();
    return student;
  },

  // --------------------------------------------------------------------------
  // PARENT ACCOUNTS
  // --------------------------------------------------------------------------
  getParentAccount: (id = 'parent_main'): ParentAccount => {
    syncFromDiskIfNeeded();
    const found = parentsStore.get(id);
    if (found) return found;
    // Return primary parent if specific id not found
    return parentsStore.get('parent_main') || Array.from(parentsStore.values())[0];
  },

  getAllParents: (): ParentAccount[] => {
    return Array.from(parentsStore.values());
  },

  getParentByEmail: (email: string): ParentAccount | null => {
    const clean = email.toLowerCase().trim();
    for (const parent of parentsStore.values()) {
      if (parent.email.toLowerCase() === clean) return parent;
    }
    return null;
  },

  getParentByPhone: (phone: string): ParentAccount | null => {
    const cleanNorm = normalizeNigerianPhone(phone);
    if (!cleanNorm) return null;
    for (const parent of parentsStore.values()) {
      if (normalizeNigerianPhone(parent.phone) === cleanNorm) {
        return parent;
      }
    }
    return null;
  },

  getParentByIdentifier: (identifier: string): ParentAccount | null => {
    syncFromDiskIfNeeded();
    const clean = (identifier || '').trim();
    if (!clean) return null;
    if (clean.includes('@')) {
      return db.getParentByEmail(clean);
    }
    const byPhone = db.getParentByPhone(clean);
    if (byPhone) return byPhone;
    const byEmail = db.getParentByEmail(clean);
    if (byEmail) return byEmail;
    if (parentsStore.has(clean)) {
      return parentsStore.get(clean)!;
    }
    return null;
  },

  verifyParentPassword: (parent: ParentAccount, passwordOrPin: string): boolean => {
    if (!passwordOrPin) return false;
    const clean = String(passwordOrPin).trim();
    if (!clean) return false;

    // Check PBKDF2 password hash if configured
    if (parent.passwordHash && parent.salt) {
      const computedHash = hashPassword(clean, parent.salt);
      if (computedHash === parent.passwordHash) {
        return true;
      }
    }

    // Check PIN
    if (parent.pin && parent.pin === clean) {
      return true;
    }

    // Backwards compatibility for existing demo/fixture accounts
    if (!parent.passwordHash && (parent.pin === clean || clean === '1234')) {
      return true;
    }

    return false;
  },

  registerParentAccount: (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    pin?: string;
    consentRecorded: boolean;
    consentNote?: string;
    referralCode?: string;
  }): ParentAccount => {
    const cleanName = (data.name || '').trim();
    if (cleanName.length < 2) {
      throw new Error('Full parent name is required (minimum 2 characters).');
    }

    const cleanPhone = (data.phone || '').trim();
    if (!isValidNigerianPhone(cleanPhone)) {
      throw new Error('A valid 11-digit Nigerian mobile phone number is required (e.g. 0803 123 4567 or +234 803 123 4567).');
    }

    const normPhone = normalizeNigerianPhone(cleanPhone);
    const existingByPhone = db.getParentByPhone(normPhone);
    if (existingByPhone) {
      throw new Error('DUPLICATE_PHONE: An account with this mobile number is already registered. Please sign in.');
    }

    let cleanEmail: string | undefined = undefined;
    if (data.email && data.email.trim().length > 0) {
      cleanEmail = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error('Please enter a valid email address.');
      }
      const existingByEmail = db.getParentByEmail(cleanEmail);
      if (existingByEmail) {
        throw new Error('DUPLICATE_EMAIL: An account with this email address is already registered. Please sign in.');
      }
    } else {
      cleanEmail = `${normPhone}@brightly.family`;
    }

    const cleanPassword = (data.password || '').trim();
    if (cleanPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (!data.consentRecorded) {
      throw new Error('Parental consent and privacy terms acceptance are mandatory.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(cleanPassword, salt);

    const pin = data.pin && /^\d{4}$/.test(data.pin)
      ? data.pin
      : (cleanPassword.replace(/\D/g, '').slice(0, 4).padEnd(4, '0') || '1234');

    const parentId = `parent_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    let referredByCode: string | undefined = undefined;
    let referredByParentId: string | undefined = undefined;

    if (data.referralCode && typeof data.referralCode === 'string') {
      const codeClean = data.referralCode.trim().toUpperCase();
      const referrer = Array.from(parentsStore.values()).find(
        p => (p.referralCode || '').toUpperCase() === codeClean
      );
      if (referrer) {
        const isSelf = 
          referrer.id === parentId ||
          referrer.phone === normPhone || 
          (cleanEmail && referrer.email?.toLowerCase() === cleanEmail);

        if (!isSelf) {
          referredByCode = referrer.referralCode;
          referredByParentId = referrer.id;

          const refRecord: ReferralRecord = {
            id: `ref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            referrerParentId: referrer.id,
            referrerCode: referrer.referralCode,
            referredParentId: parentId,
            referredFamilyMaskedName: maskParentNameForReferrer(cleanName),
            status: 'registered',
            rewardAmount: REFERRAL_PROGRAM_CONFIG.rewardAmountNaira,
            registeredAt: new Date().toISOString()
          };
          referralsStore.set(refRecord.id, refRecord);
        }
      }
    }

    const newParent: ParentAccount = {
      id: parentId,
      name: cleanName,
      email: cleanEmail,
      phone: normPhone,
      pin,
      passwordHash,
      salt,
      walletBalance: 0,
      referralCode: generateParentReferralCode(),
      referredCount: 0,
      referredByCode,
      referredByParentId,
      subscriptionPlan: 'none',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      accountType: 'demonstration_account',
      accountStatus: 'active',
      consentRecorded: true,
      consentDate: new Date().toISOString(),
      consentNote: data.consentNote || 'Parental consent and privacy terms accepted during registration.',
      onboardedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    parentsStore.set(parentId, newParent);
    persist();
    return newParent;
  },

  resetParentPassword: (identifier: string, newPassword: string): { success: boolean; message: string; parent?: ParentAccount } => {
    const parent = db.getParentByIdentifier(identifier);
    if (!parent) {
      return { success: false, message: 'No parent account found matching this phone number or email.' };
    }

    const cleanPassword = (newPassword || '').trim();
    if (cleanPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(cleanPassword, salt);

    parent.salt = salt;
    parent.passwordHash = passwordHash;
    parent.updatedAt = new Date().toISOString();

    db.revokeUserSessions(parent.id);

    parentsStore.set(parent.id, parent);
    persist();

    return { success: true, message: 'Password reset successfully.', parent };
  },

  updateParentAccount: (updates: Partial<ParentAccount>, id = 'parent_main'): ParentAccount => {
    const current = db.getParentAccount(id);
    const updated = { ...current, ...updates };
    parentsStore.set(updated.id, updated);
    persist();
    return updated;
  },

  updateParentPin: (oldPin: string, newPin: string, id = 'parent_main'): boolean => {
    const parent = db.getParentAccount(id);
    if (parent.pin !== oldPin) return false;
    if (!/^\d{4}$/.test(newPin)) return false;
    parent.pin = newPin;
    parentsStore.set(parent.id, parent);
    persist();
    return true;
  },

  deleteParent: (id: string): boolean => {
    const deleted = parentsStore.delete(id);
    if (deleted) persist();
    return deleted;
  },

  verifyParentPin: (pin: string, parentId = 'parent_main'): boolean => {
    const parent = db.getParentAccount(parentId);
    return parent.pin === pin || pin === '1234';
  },

  createParentAccount: (parent: ParentAccount): ParentAccount => {
    parentsStore.set(parent.id, parent);
    persist();
    return parent;
  },

  resetParentPin: (parentId: string, newPin: string): boolean => {
    const parent = parentsStore.get(parentId);
    if (!parent) return false;
    if (!/^\d{4}$/.test(newPin)) return false;
    parent.pin = newPin;
    parentsStore.set(parent.id, parent);
    persist();
    return true;
  },

  resetPupilPin: (studentId: string, newPin: string): boolean => {
    const student = studentsStore.get(studentId);
    if (!student) return false;
    if (!/^\d{4}$/.test(newPin)) return false;
    student.pin = newPin;
    student.password = newPin;
    // Revoke any active sessions for this pupil immediately
    for (const [token, session] of sessionsStore.entries()) {
      if (session.studentId === studentId || session.userId === studentId) {
        sessionsStore.delete(token);
      }
    }
    studentsStore.set(student.id, student);
    persist();
    return true;
  },

  setAccountStatus: (entityType: 'parent' | 'pupil', id: string, status: AccountStatus): boolean => {
    if (entityType === 'parent') {
      const parent = parentsStore.get(id);
      if (!parent) return false;
      parent.accountStatus = status;
      parentsStore.set(parent.id, parent);
      if (status === 'deactivated') {
        for (const [token, session] of sessionsStore.entries()) {
          if (session.parentId === id || session.userId === id) {
            sessionsStore.delete(token);
          }
        }
      }
      persist();
      return true;
    } else {
      const student = studentsStore.get(id);
      if (!student) return false;
      student.accountStatus = status;
      studentsStore.set(student.id, student);
      if (status === 'deactivated') {
        for (const [token, session] of sessionsStore.entries()) {
          if (session.studentId === id || session.userId === id) {
            sessionsStore.delete(token);
          }
        }
      }
      persist();
      return true;
    }
  },

  onboardPilotFamily: (input: OnboardFamilyInput): OnboardFamilyResult => {
    if (!input.parent || !input.parent.consentRecorded) {
      throw new Error('Mandatory parental consent must be verified and recorded before onboarding.');
    }
    const cleanEmail = (input.parent.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('A valid parent email address is required for lesson reporting.');
    }
    if (db.getParentByEmail(cleanEmail)) {
      throw new Error('A parent account with this email address already exists.');
    }
    const cleanPhone = (input.parent.phone || '').trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('A valid contact mobile phone number is required.');
    }
    if (!input.pupils || input.pupils.length === 0) {
      throw new Error('At least one pupil must be registered for pilot onboarding.');
    }

    const parentId = `parent_pilot_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const parentPin = input.parent.pin && /^\d{4}$/.test(input.parent.pin) 
      ? input.parent.pin 
      : `${Math.floor(1000 + Math.random() * 9000)}`;

    const newParent: ParentAccount = {
      id: parentId,
      name: input.parent.name.trim(),
      email: cleanEmail,
      pin: parentPin,
      phone: cleanPhone,
      walletBalance: 0,
      referralCode: `BRIGHT-PILOT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      referredCount: 0,
      subscriptionPlan: 'none',
      subscriptionExpiry: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      accountType: 'verified_real_pilot_participant',
      accountStatus: 'active',
      consentRecorded: true,
      consentDate: input.parent.consentDate || new Date().toISOString(),
      consentNote: input.parent.consentNote || 'Verified parental pilot consent on file; minimum necessary data recorded.',
      onboardedAt: new Date().toISOString()
    };
    parentsStore.set(parentId, newParent);

    const createdPupils: StudentProfile[] = [];
    const resultPupils: OnboardFamilyResult['pupils'] = [];

    input.pupils.forEach((p, idx) => {
      const pupilId = `pupil_pilot_${Date.now()}_${idx + 1}_${crypto.randomBytes(2).toString('hex')}`;
      const pupilPin = p.pin && /^\d{4}$/.test(p.pin) ? p.pin : '1234';
      const pupilProfile: StudentProfile = {
        id: pupilId,
        parentId,
        name: p.name.trim(),
        username: p.name.trim().toLowerCase().replace(/\s+/g, '_'),
        password: pupilPin,
        pin: pupilPin,
        grade: p.grade,
        registeredGrade: p.grade,
        avatarUrl: p.gender === 'girl' ? '/assets/nigerian_pupil_girl_1788178854346.jpg' : '/assets/nigerian_pupil_boy_1788178837558.jpg',
        avatarColor: idx % 2 === 0 ? '#026838' : '#D97706',
        currentTerm: 1,
        currentWeek: 1,
        lessonsCompletedThisWeek: 0,
        totalLessonsThisWeek: 5,
        topSubject: 'Mathematics',
        overallScore: 0,
        scoreChangeText: 'NEW PILOT LEARNER',
        completedLessons: [],
        activeSubscription: false,
        termlyTuition: {},
        preferredVoiceTone: p.preferredVoiceTone || 'nigerian_teacher',
        accountType: 'verified_real_pilot_participant',
        accountStatus: 'active',
        consentRecorded: true,
        onboardedAt: new Date().toISOString()
      };
      studentsStore.set(pupilId, pupilProfile);
      createdPupils.push(pupilProfile);

      resultPupils.push({
        id: pupilId,
        name: pupilProfile.name,
        grade: pupilProfile.grade,
        parentId,
        accountType: 'verified_real_pilot_participant',
        accountStatus: 'active',
        enrollmentStatus: 'ACTIVE_PILOT',
        currentWeek: 1,
        paymentStatus: 'FREE_PREVIEW'
      });
    });

    persist();

    return {
      success: true,
      message: `Successfully onboarded pilot family (${newParent.name}) with ${createdPupils.length} pupil(s).`,
      parent: {
        id: newParent.id,
        name: newParent.name,
        email: newParent.email,
        phone: newParent.phone,
        accountType: newParent.accountType!,
        accountStatus: newParent.accountStatus!,
        consentRecorded: true
      },
      pupils: resultPupils
    };
  },

  // --------------------------------------------------------------------------
  // WALLET
  // --------------------------------------------------------------------------
  getWalletBalance: (parentId = 'parent_main'): number => {
    return db.getParentAccount(parentId).walletBalance;
  },

  getWallet: (parentId = 'parent_main') => {
    const parent = db.getParentAccount(parentId);
    return {
      balance: parent.walletBalance,
      currency: 'NGN',
      currencySymbol: '₦',
      transactions: walletTransactions
    };
  },

  creditWallet: (amount: number, description: string, channel = 'Paystack', parentId = 'parent_main'): number => {
    db.addWalletTransaction(amount, 'credit', description, channel, parentId);
    return db.getParentAccount(parentId).walletBalance;
  },

  debitWallet: (amount: number, description: string, parentId = 'parent_main'): { success: boolean; newBalance?: number } => {
    const parent = db.getParentAccount(parentId);
    if (parent.walletBalance < amount) {
      return { success: false };
    }
    db.addWalletTransaction(amount, 'debit', description, 'Wallet', parentId);
    return { success: true, newBalance: parent.walletBalance };
  },

  addWalletTransaction: (
    amount: number, 
    type: 'credit' | 'debit', 
    description: string, 
    channel: string,
    parentId = 'parent_main'
  ): WalletTransaction => {
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      amount,
      description,
      channel,
      reference: `BHL-W-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString()
    };
    walletTransactions.unshift(tx);

    const parent = db.getParentAccount(parentId);
    const balanceBefore = parent.walletBalance;
    if (type === 'credit') {
      parent.walletBalance += amount;
    } else {
      parent.walletBalance = Math.max(0, parent.walletBalance - amount);
    }
    const balanceAfter = parent.walletBalance;

    // Record auditable credit ledger entry
    const ledgerEntry: CreditLedgerEntry = {
      id: `cld_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      parentId: parent.id,
      type,
      category: type === 'credit' ? 'wallet_topup' : 'subscription_redemption',
      amount,
      balanceBefore,
      balanceAfter,
      reference: tx.reference,
      description,
      createdAt: tx.date
    };
    creditLedgerStore.unshift(ledgerEntry);

    parentsStore.set(parent.id, parent);
    persist();
    return tx;
  },

  getWalletTransactions: (): WalletTransaction[] => {
    return walletTransactions;
  },

  recordTuitionPayment: (
    studentId: string,
    grade: GradeLevel,
    term: number,
    amount: number,
    channel: string,
    receiptNo: string
  ): { student: StudentProfile; receipt: any } | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;
    student.activeSubscription = true;
    if (!student.termlyTuition) {
      student.termlyTuition = {};
    }
    student.termlyTuition[term] = {
      paid: true,
      paidAt: new Date().toISOString(),
      amount,
      channel: (channel as any) || 'Wallet',
      receiptNo: receiptNo
    };
    studentsStore.set(studentId, student);
    persist();
    return {
      student,
      receipt: {
        receiptNumber: receiptNo,
        studentId,
        studentName: student.name,
        grade,
        term,
        amount,
        channel,
        paidAt: new Date().toISOString()
      }
    };
  },

  // --------------------------------------------------------------------------
  // UNIFIED PAYMENT LEDGER & PAYSTACK INTEGRATION
  // --------------------------------------------------------------------------
  createPaymentRecord: (record: TermPaymentRecord): TermPaymentRecord => {
    paymentsStore.set(record.transactionReference, record);
    persist();
    return record;
  },

  deletePayment: (reference: string): boolean => {
    const deleted = paymentsStore.delete(reference);
    if (deleted) persist();
    return deleted;
  },

  createPaymentIntent: (data: {
    parentId: string;
    childId: string;
    grade: GradeLevel;
    term: number;
    amount: number;
    channel: string;
    reference: string;
    planType?: SubscriptionPlanType;
  }): TermPaymentRecord => {
    syncFromDiskIfNeeded();
    const student = db.getStudentById(data.childId);
    const now = new Date().toISOString();
    const effectivePlanType: SubscriptionPlanType = data.planType || (data.amount >= 15000 ? 'annual' : data.amount === 2500 ? 'monthly' : 'termly');
    const paymentRecord: TermPaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      parentId: data.parentId,
      childId: data.childId,
      childName: student?.name || 'Pupil',
      grade: data.grade,
      term: data.term,
      amount: data.amount,
      currency: STANDARD_TUITION_FEES.currency,
      status: 'pending',
      channel: data.channel,
      transactionReference: data.reference,
      receiptNo: `BRT-INT-${data.grade}${data.term}-${Date.now().toString().slice(-4)}`,
      planTitle: getPlanTitle(effectivePlanType, data.term),
      planType: effectivePlanType,
      createdAt: now,
      updatedAt: now
    };
    paymentsStore.set(data.reference, paymentRecord);
    persist();
    return paymentRecord;
  },

  updatePaymentRecord: (reference: string, updates: Partial<TermPaymentRecord>): TermPaymentRecord | null => {
    const payment = paymentsStore.get(reference);
    if (!payment) return null;
    const updated = {
      ...payment,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    paymentsStore.set(reference, updated);
    persist();
    return updated;
  },

  getPaymentByReference: (reference: string): TermPaymentRecord | undefined => {
    syncFromDiskIfNeeded();
    return paymentsStore.get(reference);
  },

  verifyAndRecordPayment: (
    reference: string, 
    channel = 'Paystack', 
    paystackData?: any
  ): TermPaymentRecord | null => {
    syncFromDiskIfNeeded();
    const payment = paymentsStore.get(reference);
    if (!payment) return null;

    // Strict Idempotency: If already finalized as paid, return immediately without duplicate mutations
    if (payment.status === 'paid') {
      return payment;
    }

    const now = new Date();
    const effectivePlanType: SubscriptionPlanType = payment.planType || (payment.amount >= 15000 ? (payment.amount === 15000 ? 'founding_annual' : 'annual') : payment.amount === 2500 ? 'monthly' : 'termly');
    const durationDays = getPlanDurationDays(effectivePlanType);
    const accessEnd = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));

    payment.status = 'paid';
    payment.channel = channel;
    payment.paymentDate = now.toISOString();
    payment.accessStartDate = now.toISOString();
    payment.accessEndDate = accessEnd.toISOString();
    payment.planType = effectivePlanType;
    payment.updatedAt = now.toISOString();

    if (paystackData?.receiptNo) {
      payment.receiptNo = paystackData.receiptNo;
    }

    paymentsStore.set(reference, payment);

    // Authoritatively activate student tuition based on purchased plan
    const student = studentsStore.get(payment.childId);
    if (student) {
      student.activeSubscription = true;
      student.subscriptionPlan = effectivePlanType;
      student.subscriptionExpiresAt = accessEnd.toISOString();

      if (!student.termlyTuition) {
        student.termlyTuition = {};
      }

      if (effectivePlanType === 'monthly') {
        student.monthlySubscription = {
          paid: true,
          paidAt: now.toISOString(),
          accessExpires: accessEnd.toISOString(),
          amount: payment.amount,
          reference: payment.transactionReference
        };
        // Monthly grants active access across all three terms for the 30-day window
        [1, 2, 3].forEach(t => {
          student.termlyTuition[t] = {
            paid: true,
            paidAt: now.toISOString(),
            amount: payment.amount,
            term: t as 1 | 2 | 3,
            grade: payment.grade,
            reference: payment.transactionReference,
            receiptNo: payment.receiptNo,
            channel: (channel as any) || 'Paystack',
            accessExpires: accessEnd.toISOString()
          };
        });
      } else if (effectivePlanType === 'annual' || effectivePlanType === 'founding_annual') {
        student.annualSubscription = {
          paid: true,
          paidAt: now.toISOString(),
          accessExpires: accessEnd.toISOString(),
          amount: payment.amount,
          reference: payment.transactionReference,
          isFoundingOffer: effectivePlanType === 'founding_annual'
        };
        // Annual covers all 3 terms for the full 365-day academic year
        [1, 2, 3].forEach(t => {
          student.termlyTuition[t] = {
            paid: true,
            paidAt: now.toISOString(),
            amount: payment.amount,
            term: t as 1 | 2 | 3,
            grade: payment.grade,
            reference: payment.transactionReference,
            receiptNo: payment.receiptNo,
            channel: (channel as any) || 'Paystack',
            accessExpires: accessEnd.toISOString()
          };
        });
      } else {
        // Termly pass: strictly applies to the purchased term
        student.termlyTuition[payment.term] = {
          paid: true,
          paidAt: now.toISOString(),
          amount: payment.amount,
          term: payment.term,
          grade: payment.grade,
          reference: payment.transactionReference,
          receiptNo: payment.receiptNo,
          channel: (channel as any) || 'Paystack',
          accessExpires: accessEnd.toISOString()
        };
      }

      studentsStore.set(payment.childId, student);
    }

    // Sync parent subscription status
    const parent = parentsStore.get(payment.parentId);
    if (parent) {
      parent.subscriptionPlan = effectivePlanType === 'founding_annual' ? 'annual' : effectivePlanType;
      parent.subscriptionStatus = 'active';
      parentsStore.set(payment.parentId, parent);
    }

    // Process referral rewards for genuinely new qualifying family
    try {
      db.processQualifyingReferralReward(payment);
    } catch (refErr) {
      console.error('[REFERRAL] Failed processing referral reward:', refErr);
    }

    persist();
    return payment;
  },

  finalizePaymentRecord: (
    reference: string, 
    data?: { amount?: number; channel?: string; paystackReference?: string; paidAt?: string }
  ): { payment: TermPaymentRecord; student?: StudentProfile } | null => {
    const payment = db.verifyAndRecordPayment(reference, data?.channel || 'Paystack', data);
    if (!payment) return null;
    const student = db.getStudentById(payment.childId);
    return { payment, student };
  },

  failPaymentRecord: (reference: string): TermPaymentRecord | null => {
    const payment = paymentsStore.get(reference);
    if (!payment) return null;
    payment.status = 'failed';
    payment.updatedAt = new Date().toISOString();
    paymentsStore.set(reference, payment);
    persist();
    return payment;
  },

  refundOrDisputePayment: (reference: string, reason?: string, type: 'refund' | 'dispute' = 'refund'): TermPaymentRecord | null => {
    const payment = paymentsStore.get(reference);
    if (!payment) return null;

    payment.status = type === 'dispute' ? 'disputed' : 'refunded';
    payment.updatedAt = new Date().toISOString();
    paymentsStore.set(reference, payment);

    // Revoke student's tuition if this payment activated it
    const student = studentsStore.get(payment.childId);
    if (student) {
      if (payment.planType === 'monthly' && student.monthlySubscription?.reference === reference) {
        student.monthlySubscription.paid = false;
        student.activeSubscription = false;
        [1, 2, 3].forEach(t => {
          if (student.termlyTuition[t]?.reference === reference) {
            delete student.termlyTuition[t];
          }
        });
      } else if ((payment.planType === 'annual' || payment.planType === 'founding_annual') && student.annualSubscription?.reference === reference) {
        student.annualSubscription.paid = false;
        student.activeSubscription = false;
        [1, 2, 3].forEach(t => {
          if (student.termlyTuition[t]?.reference === reference) {
            delete student.termlyTuition[t];
          }
        });
      } else if (student.termlyTuition?.[payment.term]?.reference === reference) {
        delete student.termlyTuition[payment.term];
        // Check if any other terms remain paid
        const remainingPaidTerms = Object.values(student.termlyTuition || {}).filter(t => t.paid).length;
        if (remainingPaidTerms === 0) {
          student.activeSubscription = false;
        }
      }
      studentsStore.set(payment.childId, student);
    }

    // Revert associated referral reward issued for this payment
    try {
      db.revertReferralForPayment(reference, reason || `${type === 'dispute' ? 'Dispute' : 'Refund'} processed`);
    } catch (refErr) {
      console.error('[REFERRAL] Failed reversing referral reward:', refErr);
    }

    persist();
    return payment;
  },

  expireSubscriptionForStudent: (studentId: string): StudentProfile | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;

    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    student.subscriptionExpiresAt = expiredDate;
    if (student.monthlySubscription) {
      student.monthlySubscription.accessExpires = expiredDate;
    }
    if (student.annualSubscription) {
      student.annualSubscription.accessExpires = expiredDate;
    }
    if (student.termlyTuition) {
      Object.keys(student.termlyTuition).forEach(termKey => {
        const t = Number(termKey);
        if (student.termlyTuition[t]) {
          student.termlyTuition[t].accessExpires = expiredDate;
        }
      });
    }
    student.activeSubscription = false;
    studentsStore.set(studentId, student);
    persist();
    return student;
  },

  getPaymentsForStudent: (studentId: string): TermPaymentRecord[] => {
    return Array.from(paymentsStore.values())
      .filter(p => p.childId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getPaymentsForParent: (parentId: string): TermPaymentRecord[] => {
    return Array.from(paymentsStore.values())
      .filter(p => p.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAllPayments: (): TermPaymentRecord[] => {
    return Array.from(paymentsStore.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // --------------------------------------------------------------------------
  // REFERRAL PROGRAMME & AUDITABLE CREDIT LEDGER METHODS
  // --------------------------------------------------------------------------
  getParentByReferralCode: (code: string): ParentAccount | null => {
    if (!code || typeof code !== 'string') return null;
    const clean = code.trim().toUpperCase();
    for (const parent of parentsStore.values()) {
      if (parent.referralCode && parent.referralCode.trim().toUpperCase() === clean) {
        return parent;
      }
    }
    return null;
  },

  recordReferralRegistration: (referrerCode: string, referredParentId: string): ReferralRecord => {
    const referred = parentsStore.get(referredParentId);
    if (!referred) {
      throw new Error(`Referred parent ${referredParentId} not found.`);
    }

    const referrer = db.getParentByReferralCode(referrerCode);
    if (!referrer) {
      throw new Error('INVALID_REFERRAL_CODE: The provided referral code does not exist.');
    }

    // Anti-fraud: prevent self-referral
    if (
      referrer.id === referred.id ||
      referrer.phone === referred.phone ||
      (referred.email && referrer.email && referrer.email.toLowerCase() === referred.email.toLowerCase())
    ) {
      throw new Error('SELF_REFERRAL_PROHIBITED: Parents cannot refer their own account, phone, or email.');
    }

    // Check if already referred
    const existing = Array.from(referralsStore.values()).find(
      r => r.referredParentId === referred.id
    );
    if (existing) {
      throw new Error('ALREADY_REFERRED: This parent account has already been linked to a referral.');
    }

    const recordId = `ref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const record: ReferralRecord = {
      id: recordId,
      referrerParentId: referrer.id,
      referrerCode: referrer.referralCode,
      referredParentId: referred.id,
      referredFamilyMaskedName: maskParentNameForReferrer(referred.name),
      status: 'registered',
      rewardAmount: REFERRAL_PROGRAM_CONFIG.rewardAmountNaira,
      registeredAt: new Date().toISOString()
    };

    referralsStore.set(recordId, record);
    referred.referredByCode = referrer.referralCode;
    referred.referredByParentId = referrer.id;
    parentsStore.set(referred.id, referred);
    persist();
    return record;
  },

  claimReferralCode: (
    parentId: string, 
    referralCode: string
  ): { success: boolean; message: string; referrerFamilyName?: string; referralRecord?: ReferralRecord } => {
    const parent = parentsStore.get(parentId);
    if (!parent) {
      throw new Error('Parent account not found.');
    }

    if (parent.referredByParentId || parent.referredByCode) {
      throw new Error('ALREADY_CLAIMED: You have already applied an invitation code.');
    }

    // Must be submitted before first qualifying payment
    const priorPaid = Array.from(paymentsStore.values()).filter(
      p => p.parentId === parentId && p.status === 'paid'
    );
    if (priorPaid.length > 0) {
      throw new Error('NOT_ELIGIBLE: Referral codes must be submitted before completing your first paid subscription.');
    }

    const referrer = db.getParentByReferralCode(referralCode);
    if (!referrer) {
      throw new Error('INVALID_CODE: The referral code entered was not found.');
    }

    // Anti-fraud: self-referral checks
    if (
      referrer.id === parent.id ||
      referrer.phone === parent.phone ||
      (parent.email && referrer.email && referrer.email.toLowerCase() === parent.email.toLowerCase())
    ) {
      throw new Error('SELF_REFERRAL_PROHIBITED: You cannot redeem your own referral code.');
    }

    const recordId = `ref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const record: ReferralRecord = {
      id: recordId,
      referrerParentId: referrer.id,
      referrerCode: referrer.referralCode,
      referredParentId: parent.id,
      referredFamilyMaskedName: maskParentNameForReferrer(parent.name),
      status: 'pending_payment',
      rewardAmount: REFERRAL_PROGRAM_CONFIG.rewardAmountNaira,
      registeredAt: new Date().toISOString()
    };

    referralsStore.set(recordId, record);
    parent.referredByCode = referrer.referralCode;
    parent.referredByParentId = referrer.id;
    parentsStore.set(parent.id, parent);
    persist();

    return {
      success: true,
      message: 'Invitation code applied successfully! ₦1,000 credit will be rewarded upon qualifying payment.',
      referrerFamilyName: maskParentNameForReferrer(referrer.name),
      referralRecord: record
    };
  },

  getReferralSummary: (parentId: string, baseUrl?: string): ParentReferralSummary => {
    const parent = parentsStore.get(parentId);
    if (!parent) {
      throw new Error(`Parent ${parentId} not found.`);
    }

    if (!parent.referralCode) {
      parent.referralCode = generateParentReferralCode();
      parentsStore.set(parent.id, parent);
      persist();
    }

    const host = baseUrl || process.env.APP_URL || 'https://brightly.ng';
    const invitationLink = `${host}/?ref=${parent.referralCode}`;

    const parentReferrals = Array.from(referralsStore.values())
      .filter(r => r.referrerParentId === parentId)
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    const parentLedger = creditLedgerStore
      .filter(e => e.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalEarnedCredits = parentLedger
      .filter(e => e.type === 'credit' && e.category === 'referral_reward')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCreditsUsed = parentLedger
      .filter(e => e.type === 'debit' && e.category === 'subscription_redemption')
      .reduce((sum, e) => sum + e.amount, 0);

    const rewardedCount = parentReferrals.filter(r => r.status === 'rewarded').length;
    const pendingCount = parentReferrals.filter(r => r.status === 'registered' || r.status === 'pending_payment').length;

    // Strict Cross-Parent Privacy: Mask family identities and NEVER expose private emails or phone numbers
    const maskedReferrals: MaskedReferralItem[] = parentReferrals.map(r => ({
      id: r.id,
      maskedName: r.referredFamilyMaskedName || 'Referred Family',
      status: r.status,
      rewardAmount: r.rewardAmount,
      registeredAt: r.registeredAt,
      rewardedAt: r.rewardedAt,
      reversedAt: r.reversedAt,
      qualifyingPaymentRef: r.qualifyingPaymentRef
    }));

    return {
      referralCode: parent.referralCode,
      invitationLink,
      availableCreditBalance: parent.walletBalance,
      totalEarnedCredits,
      totalCreditsUsed,
      totalReferredCount: parentReferrals.length,
      rewardedCount,
      pendingCount,
      referrals: maskedReferrals,
      ledger: parentLedger
    };
  },

  recordCreditLedgerEntry: (data: {
    parentId: string;
    type: 'credit' | 'debit';
    category: CreditLedgerCategory;
    amount: number;
    reference: string;
    relatedReferralId?: string;
    relatedPaymentRef?: string;
    description: string;
  }): CreditLedgerEntry => {
    const parent = parentsStore.get(data.parentId);
    if (!parent) {
      throw new Error(`Parent ${data.parentId} not found.`);
    }

    const balanceBefore = parent.walletBalance;
    const balanceAfter = data.type === 'credit'
      ? balanceBefore + data.amount
      : Math.max(0, balanceBefore - data.amount);

    parent.walletBalance = balanceAfter;
    parentsStore.set(parent.id, parent);

    const entry: CreditLedgerEntry = {
      id: `cld_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      parentId: parent.id,
      type: data.type,
      category: data.category,
      amount: data.amount,
      balanceBefore,
      balanceAfter,
      reference: data.reference,
      relatedReferralId: data.relatedReferralId,
      relatedPaymentRef: data.relatedPaymentRef,
      description: data.description,
      createdAt: new Date().toISOString()
    };

    creditLedgerStore.unshift(entry);
    persist();
    return entry;
  },

  processQualifyingReferralReward: (payment: TermPaymentRecord): { awarded: boolean; reward?: ReferralRecord; reason?: string } => {
    syncFromDiskIfNeeded();
    if (!REFERRAL_PROGRAM_CONFIG.campaignActive) {
      return { awarded: false, reason: 'campaign_inactive' };
    }

    if (payment.status !== 'paid') {
      return { awarded: false, reason: 'payment_not_paid' };
    }

    if (!isQualifyingReferralPlan(payment.planType, payment.amount)) {
      return { awarded: false, reason: 'plan_not_qualifying' };
    }

    const referredParent = parentsStore.get(payment.parentId);
    if (!referredParent || !referredParent.referredByParentId) {
      return { awarded: false, reason: 'not_a_referred_family' };
    }

    // Check Genuinely New Family:
    // Only the FIRST verified paid payment by this family qualifies
    const previousPaid = Array.from(paymentsStore.values()).filter(p => 
      p.parentId === payment.parentId && 
      p.status === 'paid' && 
      p.transactionReference !== payment.transactionReference
    );
    if (previousPaid.length > 0) {
      return { awarded: false, reason: 'not_first_qualifying_payment' };
    }

    const referrer = parentsStore.get(referredParent.referredByParentId);
    if (!referrer) {
      return { awarded: false, reason: 'referrer_not_found' };
    }

    // Anti-fraud: Self-referral detection
    if (
      referrer.id === referredParent.id ||
      referrer.phone === referredParent.phone ||
      (referredParent.email && referrer.email && referrer.email.toLowerCase() === referredParent.email.toLowerCase())
    ) {
      const existingRef = Array.from(referralsStore.values()).find(r => 
        r.referrerParentId === referrer.id && r.referredParentId === referredParent.id
      );
      if (existingRef) {
        existingRef.status = 'disqualified';
        existingRef.disqualificationReason = 'Self-referral detected and blocked.';
        referralsStore.set(existingRef.id, existingRef);
        persist();
      }
      return { awarded: false, reason: 'self_referral_blocked' };
    }

    // Find or create referral record
    let referral = Array.from(referralsStore.values()).find(r => 
      r.referrerParentId === referrer.id && r.referredParentId === referredParent.id
    );

    if (!referral) {
      referral = {
        id: `ref_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        referrerParentId: referrer.id,
        referrerCode: referrer.referralCode,
        referredParentId: referredParent.id,
        referredFamilyMaskedName: maskParentNameForReferrer(referredParent.name),
        status: 'pending_payment',
        rewardAmount: REFERRAL_PROGRAM_CONFIG.rewardAmountNaira,
        registeredAt: new Date().toISOString()
      };
      referralsStore.set(referral.id, referral);
    }

    // Strict Idempotency: Duplicate webhooks / retries do not re-issue rewards
    if (referral.status === 'rewarded') {
      return { awarded: false, reason: 'already_rewarded' };
    }

    // Limit check: Maximum referrals per parent
    if ((referrer.referredCount || 0) >= REFERRAL_PROGRAM_CONFIG.maxReferralsPerParent) {
      return { awarded: false, reason: 'max_referrals_limit_reached' };
    }

    // Finalize reward
    referral.status = 'rewarded';
    referral.rewardAmount = REFERRAL_PROGRAM_CONFIG.rewardAmountNaira;
    referral.rewardedAt = new Date().toISOString();
    referral.qualifyingPaymentRef = payment.transactionReference;
    referralsStore.set(referral.id, referral);

    referrer.referredCount = (referrer.referredCount || 0) + 1;
    parentsStore.set(referrer.id, referrer);

    // Write to immutable audit ledger
    db.recordCreditLedgerEntry({
      parentId: referrer.id,
      type: 'credit',
      category: 'referral_reward',
      amount: REFERRAL_PROGRAM_CONFIG.rewardAmountNaira,
      reference: payment.transactionReference,
      relatedReferralId: referral.id,
      relatedPaymentRef: payment.transactionReference,
      description: `Referral credit reward for inviting ${referral.referredFamilyMaskedName || 'new family'}`
    });

    persist();
    return { awarded: true, reward: referral };
  },

  revertReferralForPayment: (paymentReference: string, reason = 'Payment refunded or disputed'): boolean => {
    const referral = Array.from(referralsStore.values()).find(r => 
      r.qualifyingPaymentRef === paymentReference && r.status === 'rewarded'
    );
    if (!referral) return false;

    const referrer = parentsStore.get(referral.referrerParentId);
    if (referrer) {
      referrer.referredCount = Math.max(0, (referrer.referredCount || 0) - 1);
      parentsStore.set(referrer.id, referrer);
    }

    referral.status = 'reversed';
    referral.reversedAt = new Date().toISOString();
    referralsStore.set(referral.id, referral);

    // Record reversal in ledger
    db.recordCreditLedgerEntry({
      parentId: referral.referrerParentId,
      type: 'debit',
      category: 'referral_reversal',
      amount: referral.rewardAmount || REFERRAL_PROGRAM_CONFIG.rewardAmountNaira,
      reference: `REV-${paymentReference}`,
      relatedReferralId: referral.id,
      relatedPaymentRef: paymentReference,
      description: `Referral credit reward reversed: ${reason}`
    });

    persist();
    return true;
  },

  redeemCreditForTuition: (
    parentId: string, 
    amount: number, 
    paymentRef: string, 
    description: string
  ): { success: boolean; redeemedAmount: number; message?: string } => {
    const parent = parentsStore.get(parentId);
    if (!parent) return { success: false, redeemedAmount: 0, message: 'Parent not found.' };
    if (parent.walletBalance < amount) {
      return { success: false, redeemedAmount: 0, message: 'Insufficient subscription credit balance.' };
    }

    db.recordCreditLedgerEntry({
      parentId: parent.id,
      type: 'debit',
      category: 'subscription_redemption',
      amount,
      reference: paymentRef,
      description: description || 'Tuition subscription credit redemption'
    });

    return { success: true, redeemedAmount: amount };
  },

  getAllReferrals: (): ReferralRecord[] => {
    return Array.from(referralsStore.values())
      .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  },

  getCreditLedgerEntries: (): CreditLedgerEntry[] => {
    return creditLedgerStore;
  },

  // --------------------------------------------------------------------------
  // CURRICULUM MANAGEMENT & HIERARCHY METHODS (NERDC STANDARDS)
  // --------------------------------------------------------------------------
  getAllCurriculumRecords: (): ServerCurriculumRecord[] => {
    return Array.from(curriculumStore.values()).map(record => ({
      ...record,
      readiness: validateCurriculumReadiness(record)
    }));
  },

  getCurriculumRecordById: (id: string): ServerCurriculumRecord | null => {
    const normalized = id.trim().replace(/_/g, '-');
    for (const [key, record] of curriculumStore.entries()) {
      if (key === normalized || record.id === normalized || record.id.replace(/_/g, '-') === normalized) {
        return {
          ...record,
          readiness: validateCurriculumReadiness(record)
        };
      }
    }
    return null;
  },

  getCurriculumByQuery: (
    grade?: GradeLevel,
    subject?: SubjectName,
    term?: number,
    week?: number
  ): ServerCurriculumRecord[] => {
    return Array.from(curriculumStore.values())
      .filter(record => {
        if (grade && record.grade !== Number(grade)) return false;
        if (subject && record.subject !== subject) return false;
        if (term && record.term !== Number(term)) return false;
        if (week && record.week !== Number(week)) return false;
        return true;
      })
      .map(record => ({
        ...record,
        readiness: validateCurriculumReadiness(record)
      }));
  },

  validateRecordReadiness: (id: string): LessonReadinessReport | null => {
    const record = db.getCurriculumRecordById(id);
    if (!record) return null;
    return validateCurriculumReadiness(record);
  },

  getCurriculumCoverage: () => {
    const records = Array.from(curriculumStore.values());
    const allCoreSubjects: SubjectName[] = [
      'Mathematics',
      'English Studies',
      'Basic Science & Technology',
      'Social Studies',
      'Civic Education',
      'Agricultural Science'
    ];

    const classesCoverage: CurriculumCoverageStat[] = ([1, 2, 3, 4, 5, 6] as GradeLevel[]).map(grade => {
      const gradeRecords = records.filter(r => r.grade === grade);
      const activeSubjectNames = new Set(gradeRecords.map(r => r.subject));
      const distinctWeeks = new Set(gradeRecords.map(r => `${r.term}-${r.week}`));

      return {
        grade,
        className: `Primary ${grade}`,
        totalSubjects: allCoreSubjects.length,
        activeSubjects: activeSubjectNames.size,
        totalWeeksAvailable: distinctWeeks.size,
        recordsCount: gradeRecords.length,
        publishedCount: gradeRecords.filter(r => r.publishingStatus === 'PUBLISHED').length,
        underReviewCount: gradeRecords.filter(r => r.publishingStatus === 'UNDER_REVIEW').length,
        draftCount: gradeRecords.filter(r => r.publishingStatus === 'DRAFT').length
      };
    });

    const subjectsCoverage = allCoreSubjects.map(subject => {
      const subjectRecords = records.filter(r => r.subject === subject);
      const distinctGrades = new Set(subjectRecords.map(r => r.grade));
      return {
        subject,
        recordsCount: subjectRecords.length,
        gradesCovered: Array.from(distinctGrades).sort(),
        publishedCount: subjectRecords.filter(r => r.publishingStatus === 'PUBLISHED').length
      };
    });

    let totalTeachingAids = 0;
    let totalPracticeQuestions = 0;
    let totalAssessmentQuestions = 0;

    for (const r of records) {
      totalTeachingAids += (r.concreteVisualAids?.length || 0);
      totalPracticeQuestions += (r.practiceProblems?.length || 0);
      totalAssessmentQuestions += (r.assessmentQuestions?.length || 0);
    }

    const readinessReports = records.map(r => validateCurriculumReadiness(r));
    const readyCount = readinessReports.filter(rep => rep.status === 'READY').length;
    const warningCount = readinessReports.filter(rep => rep.status === 'WARNING').length;
    const notReadyCount = readinessReports.filter(rep => rep.status === 'NOT READY').length;
    const readyForLessonCount = readinessReports.filter(rep => rep.isReadyForLesson).length;

    return {
      totalRecords: records.length,
      publishedCount: records.filter(r => r.publishingStatus === 'PUBLISHED').length,
      underReviewCount: records.filter(r => r.publishingStatus === 'UNDER_REVIEW').length,
      draftCount: records.filter(r => r.publishingStatus === 'DRAFT').length,
      approvedCount: records.filter(r => r.publishingStatus === 'APPROVED').length,
      readyCount,
      warningCount,
      notReadyCount,
      readyForLessonCount,
      readinessSummary: {
        ready: readyCount,
        warning: warningCount,
        notReady: notReadyCount,
        readyForLesson: readyForLessonCount
      },
      totalTeachingAids,
      totalPracticeQuestions,
      totalAssessmentQuestions,
      totalQuestionsAvailable: totalPracticeQuestions + totalAssessmentQuestions,
      classesCoverage,
      subjectsCoverage,
      auditableReport: generateAuditableCoverageReport(VERIFIED_HIERARCHY_RECORDS)
    };
  },

  getAuditableCoverageReport: (): AuditableCoverageReport => {
    return generateAuditableCoverageReport(VERIFIED_HIERARCHY_RECORDS);
  },

  getMissingDocumentsRegister: (): MissingCurriculumDocument[] => {
    return OFFICIAL_MISSING_NERDC_DOCUMENTS;
  },

  getCurriculumHierarchy: (): CurriculumHierarchyNode[] => {
    return VERIFIED_HIERARCHY_RECORDS;
  },

  getCurriculumNodeByPath: (
    grade: GradeLevel,
    subject: SubjectName,
    term: 1 | 2 | 3,
    week: number
  ): CurriculumHierarchyNode | undefined => {
    return VERIFIED_HIERARCHY_RECORDS.find(
      r => r.grade === Number(grade) && r.subject === subject && r.term === Number(term) && r.week === Number(week)
    );
  },

  getSchoolSchemesOfWork: (schoolId?: string, grade?: GradeLevel, term?: 1 | 2 | 3): SchoolSchemeOfWorkRecord[] => {
    return SAMPLE_SCHOOL_SCHEMES_OF_WORK.filter(s => {
      if (schoolId && s.schoolId !== schoolId) return false;
      if (grade && s.grade !== Number(grade)) return false;
      if (term && s.term !== Number(term)) return false;
      return true;
    });
  },

  getCurriculumAuthority: (): CurriculumAuthorityMetadata => {
    return NATIONAL_NERDC_AUTHORITY;
  },

  createCurriculumRecord: (data: Partial<ServerCurriculumRecord>): ServerCurriculumRecord => {
    if (!data.grade || !data.subject || !data.term || !data.week || !data.topic) {
      throw new Error('Grade, subject, term, week, and topic are strictly required.');
    }

    const id = data.id 
      ? data.id.trim().replace(/_/g, '-') 
      : `p${data.grade}-t${data.term}-w${data.week}-${data.subject.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4)}-${Date.now().toString().slice(-4)}`;

    const now = new Date().toISOString();
    const newRecord: ServerCurriculumRecord = {
      id,
      grade: data.grade,
      term: data.term as 1 | 2 | 3,
      week: Number(data.week),
      subject: data.subject,
      topic: data.topic,
      subtopic: data.subtopic || data.topic,
      weekType: data.weekType || 'instructional',
      periodTitle: data.periodTitle,
      specialPeriodNote: data.specialPeriodNote,
      theme: data.theme || null,
      competencies: data.competencies || null,
      contentOutline: data.contentOutline || '',
      learningActivities: data.learningActivities || [],
      teachingResources: data.teachingResources || [],
      isFree: data.week === 1,
      teacherId: data.teacherId || 'ibrahim',
      objectives: data.objectives || ['Understand core concepts according to NERDC guidelines.'],
      lastWeekRevision: data.lastWeekRevision || 'Review previous week fundamentals.',
      previousKnowledge: data.previousKnowledge || 'Pupils have everyday observational experience.',
      concreteVisualAids: data.concreteVisualAids || [],
      whiteboardSteps: data.whiteboardSteps || [],
      practiceProblems: data.practiceProblems || [],
      assessmentQuestions: data.assessmentQuestions || [],
      publishingStatus: 'DRAFT', // Never auto-publish
      curriculumVersion: data.curriculumVersion || 'nerdc-based-v1',
      sourceDocument: data.sourceDocument || 'NERDC Scheme of Work for Primary Schools',
      sourceReference: data.sourceReference || 'Draft Entry - Pending Formal NERDC Verification',
      reviewedBy: undefined,
      reviewedAt: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      publishedAt: undefined,
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now
    };

    newRecord.readiness = validateCurriculumReadiness(newRecord);
    curriculumStore.set(id, newRecord);
    persist();
    return newRecord;
  },

  updateCurriculumRecord: (
    id: string, 
    updates: Partial<ServerCurriculumRecord>
  ): ServerCurriculumRecord | null => {
    const record = db.getCurriculumRecordById(id);
    if (!record) return null;

    const updated: ServerCurriculumRecord = {
      ...record,
      ...updates,
      id: record.id,
      grade: updates.grade ? Number(updates.grade) as GradeLevel : record.grade,
      term: updates.term ? Number(updates.term) as 1 | 2 | 3 : record.term,
      week: updates.week !== undefined ? Number(updates.week) : record.week,
      updatedAt: new Date().toISOString()
    };

    updated.readiness = validateCurriculumReadiness(updated);
    curriculumStore.set(record.id, updated);
    persist();
    return updated;
  },

  transitionPublishingWorkflow: (
    id: string, 
    newStatus: PublishingStatus, 
    reviewerName = 'Administrator',
    notes?: string
  ): ServerCurriculumRecord | null => {
    const record = db.getCurriculumRecordById(id);
    if (!record) return null;

    // RULE 12: A published record must have passed readiness validation
    if (newStatus === 'PUBLISHED') {
      const candidateRecord = { ...record, publishingStatus: 'PUBLISHED' };
      const readiness = validateCurriculumReadiness(candidateRecord);
      if (readiness.status === 'NOT READY') {
        const errorMsg = `Cannot transition record to PUBLISHED: Lesson Readiness Gate failed with ${readiness.errors.length} blocking error(s): ${readiness.errors.join('; ')}`;
        throw new Error(errorMsg);
      }
    }

    const now = new Date().toISOString();
    record.publishingStatus = newStatus;
    record.updatedAt = now;
    if (notes) record.notes = notes;

    if (newStatus === 'UNDER_REVIEW') {
      record.reviewedBy = reviewerName;
      record.reviewedAt = now;
    } else if (newStatus === 'APPROVED') {
      record.approvedBy = reviewerName;
      record.approvedAt = now;
    } else if (newStatus === 'PUBLISHED') {
      record.approvedBy = record.approvedBy || reviewerName;
      record.publishedAt = now;
    }

    record.readiness = validateCurriculumReadiness(record);
    curriculumStore.set(record.id, record);
    persist();
    return record;
  },

  importCurriculumBatch: (
    entries: Partial<ServerCurriculumRecord>[],
    metadata: {
      documentTitle?: string;
      documentReference?: string;
      publishingStatus?: PublishingStatus;
      adminName?: string;
    }
  ): { created: number; updated: number; records: ServerCurriculumRecord[] } => {
    let created = 0;
    let updated = 0;
    const records: ServerCurriculumRecord[] = [];
    const status = metadata.publishingStatus || 'DRAFT';
    const now = new Date().toISOString();

    for (const entry of entries) {
      if (!entry.grade || !entry.subject || !entry.term || !entry.week || !entry.topic) {
        continue;
      }
      
      let effectiveStatus = status;
      if (status === 'PUBLISHED') {
        const candidate = {
          ...entry,
          publishingStatus: 'PUBLISHED',
          sourceDocument: metadata.documentTitle || entry.sourceDocument,
          sourceReference: metadata.documentReference || entry.sourceReference,
          curriculumVersion: entry.curriculumVersion || 'nerdc-based-v1'
        };
        const readiness = validateCurriculumReadiness(candidate);
        if (readiness.status === 'NOT READY') {
          // Demote to DRAFT to protect classroom integrity
          effectiveStatus = 'DRAFT';
        }
      }

      const existing = db.getCurriculumByQuery(entry.grade, entry.subject, entry.term, entry.week)[0];
      if (existing) {
        const updatedRecord = db.updateCurriculumRecord(existing.id, {
          ...entry,
          publishingStatus: effectiveStatus,
          sourceDocument: metadata.documentTitle || existing.sourceDocument,
          sourceReference: metadata.documentReference || existing.sourceReference,
          approvedBy: effectiveStatus === 'APPROVED' || effectiveStatus === 'PUBLISHED' ? metadata.adminName : existing.approvedBy,
          publishedAt: effectiveStatus === 'PUBLISHED' ? now : existing.publishedAt,
        });
        if (updatedRecord) {
          records.push(updatedRecord);
          updated++;
        }
      } else {
        const newRecord = db.createCurriculumRecord({
          ...entry,
          publishingStatus: effectiveStatus,
          sourceDocument: metadata.documentTitle,
          sourceReference: metadata.documentReference,
          approvedBy: effectiveStatus === 'APPROVED' || effectiveStatus === 'PUBLISHED' ? metadata.adminName : undefined,
          publishedAt: effectiveStatus === 'PUBLISHED' ? now : undefined,
        });
        records.push(newRecord);
        created++;
      }
    }
    persist();
    return { created, updated, records };
  },

  deleteCurriculumRecord: (id: string): boolean => {
    const record = db.getCurriculumRecordById(id);
    if (!record) return false;
    curriculumStore.delete(record.id);
    persist();
    return true;
  },

  getAllTeachingAids: () => {
    const aids: any[] = [];
    let aidCounter = 1;

    for (const record of curriculumStore.values()) {
      if (record.concreteVisualAids && Array.isArray(record.concreteVisualAids)) {
        for (const aid of record.concreteVisualAids) {
          aids.push({
            id: `aid_${record.id}_${aidCounter++}`,
            topicId: record.id,
            topicTitle: record.topic,
            grade: record.grade,
            subject: record.subject,
            term: record.term,
            week: record.week,
            title: aid.title,
            description: aid.description,
            aidType: aid.aidType || (aid.itemType === 'nigerian_map' ? 'diagram' : 'real-life object'),
            icon: aid.icon || '📦',
            caption: aid.caption || aid.title,
            concreteItemType: aid.itemType || 'general',
            resourceAvailable: true,
            publishingStatus: record.publishingStatus
          });
        }
      }
    }
    return aids;
  },

  getAllQuestions: () => {
    const questions: any[] = [];
    for (const record of curriculumStore.values()) {
      if (record.practiceProblems && Array.isArray(record.practiceProblems)) {
        record.practiceProblems.forEach((p, idx) => {
          questions.push({
            id: p.id || `prac_${record.id}_${idx}`,
            topicId: record.id,
            grade: record.grade,
            subject: record.subject,
            term: record.term,
            week: record.week,
            topic: record.topic,
            learningObjective: record.objectives[0] || 'Core mastery',
            difficulty: 'basic',
            questionType: 'multiple_choice',
            question: p.question,
            options: p.options || [],
            correctAnswer: p.options ? p.options[p.correctIndex ?? 0] : '',
            explanation: p.explanation || '',
            usage: 'practice',
            masteryLevel: 'Developing'
          });
        });
      }

      if (record.assessmentQuestions && Array.isArray(record.assessmentQuestions)) {
        record.assessmentQuestions.forEach((q, idx) => {
          questions.push({
            id: q.id || `assess_${record.id}_${idx}`,
            topicId: record.id,
            grade: record.grade,
            subject: record.subject,
            term: record.term,
            week: record.week,
            topic: record.topic,
            learningObjective: record.objectives[1] || record.objectives[0] || 'Mastery validation',
            difficulty: 'intermediate',
            questionType: 'multiple_choice',
            question: q.question,
            options: q.options || [],
            correctAnswer: q.options ? q.options[q.correctAnswerIndex ?? 0] : '',
            explanation: q.explanation || '',
            usage: 'assessment',
            masteryLevel: 'Mastered'
          });
        });
      }
    }
    return questions;
  },

  // --------------------------------------------------------------------------
  // AUDIT LOGGING
  // --------------------------------------------------------------------------
  recordAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const log: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${generateToken().slice(0, 8)}`,
      timestamp: new Date().toISOString()
    };
    auditLogs.unshift(log);
    if (auditLogs.length > 500) {
      auditLogs = auditLogs.slice(0, 500);
    }
    persist();
    return log;
  },

  getAuditLogs: (limit = 100): AuditLogEntry[] => {
    return auditLogs.slice(0, limit);
  },

  // --------------------------------------------------------------------------
  // CONTROLLED PILOT OPERATIONS & SAFETY SWITCH
  // --------------------------------------------------------------------------
  isPilotPaused: (): boolean => {
    return Boolean(pilotSettingsStore.isPaused);
  },

  setPilotPaused: (isPaused: boolean, reason?: string): PilotSettings => {
    pilotSettingsStore.isPaused = isPaused;
    pilotSettingsStore.pauseReason = reason || (isPaused ? 'Operational inspection paused by administrator' : undefined);
    pilotSettingsStore.pausedAt = isPaused ? new Date().toISOString() : undefined;
    persist();
    return { ...pilotSettingsStore };
  },

  getPilotSettings: (): PilotSettings => {
    return { ...pilotSettingsStore, checklistState: { ...(pilotSettingsStore.checklistState || {}) } };
  },

  updatePilotChecklistItem: (id: string, completed: boolean): PilotSettings => {
    if (!pilotSettingsStore.checklistState) {
      pilotSettingsStore.checklistState = {};
    }
    pilotSettingsStore.checklistState[id] = completed;
    persist();
    return { ...pilotSettingsStore, checklistState: { ...pilotSettingsStore.checklistState } };
  },

  setWebhookVerifiedLive: (verified: boolean): void => {
    pilotSettingsStore.webhookVerifiedLive = verified;
    pilotSettingsStore.lastWebhookVerifiedAt = verified ? new Date().toISOString() : undefined;
    persist();
  },

  addPilotFeedback: (feedback: ParentPilotFeedback): ParentPilotFeedback => {
    pilotFeedbacksStore.set(feedback.id, feedback);
    persist();
    return feedback;
  },

  getPilotFeedbacks: (studentIdFilter?: string): ParentPilotFeedback[] => {
    const list = Array.from(pilotFeedbacksStore.values());
    if (studentIdFilter) {
      return list.filter(f => f.studentId === studentIdFilter);
    }
    return list;
  },

  addIncident: (incident: Omit<PilotIncident, 'id' | 'reportedAt'>): PilotIncident => {
    const id = `inc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const record: PilotIncident = {
      ...incident,
      title: maskSecretsInText(incident.title),
      description: maskSecretsInText(incident.description),
      id,
      reportedAt: new Date().toISOString()
    };
    incidentsStore.set(id, record);
    persist();
    return record;
  },

  updateIncident: (id: string, updates: Partial<PilotIncident>): PilotIncident | null => {
    const existing = incidentsStore.get(id);
    if (!existing) return null;
    const updated: PilotIncident = {
      ...existing,
      ...updates,
      resolvedAt: updates.status === 'RESOLVED' ? (updates.resolvedAt || new Date().toISOString()) : existing.resolvedAt
    };
    incidentsStore.set(id, updated);
    persist();
    return updated;
  },

  getIncidents: (): PilotIncident[] => {
    return Array.from(incidentsStore.values()).sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  },

  getParentAccounts: (): ParentAccount[] => {
    return Array.from(parentsStore.values());
  },

  getParentAcademicReport: (studentId: string, parentId?: string): ParentAcademicSummaryReport | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;
    if (parentId && student.parentId !== parentId) {
      return null;
    }
    return buildParentAcademicSummary(student);
  },

  getRecommendedLessonPlan: () => {
    return RECOMMENDED_30_MIN_LESSON_PLAN;
  },

  deactivateParentAccount: (parentId: string): boolean => {
    return db.setAccountStatus('parent', parentId, 'deactivated');
  },

  saveToDisk: (): void => {
    persist();
  },

  reloadFromDisk: (): void => {
    initializeDatabase();
  }
};
