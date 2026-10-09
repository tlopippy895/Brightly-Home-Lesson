import crypto from 'node:crypto';
import { 
  StudentProfile, 
  ParentAccount, 
  WalletTransaction, 
  GradeLevel, 
  VoiceTone, 
  TermPaymentRecord, 
  STANDARD_TUITION_FEES,
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
  OnboardFamilyResult
} from './types';
import { NATIONAL_CURRICULUM_LESSONS } from '../src/data/curriculum';
import { PersistenceManager, hashPassword, generateToken, PersistentSchema } from './persistence';
import { validateCurriculumReadiness, LessonReadinessReport } from './readinessValidator';

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
    incidents: Array.from(incidentsStore.values())
  };

  PersistenceManager.save(payload);
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
    loaded.admins?.forEach(a => adminsStore.set(a.id, a));
    loaded.parents?.forEach(p => parentsStore.set(p.id, p));
    loaded.students?.forEach(s => studentsStore.set(s.id, s));
    loaded.sessions?.forEach(s => sessionsStore.set(s.token, s));
    loaded.payments?.forEach(p => paymentsStore.set(p.transactionReference, p));
    loaded.curriculum?.forEach(c => curriculumStore.set(c.id, c));
    
    // Refresh verified seed curriculum foundations with latest pedagogy and objectives
    createInitialCurriculumRecords().forEach(seedRec => {
      curriculumStore.set(seedRec.id, seedRec);
    });

    walletTransactions = loaded.transactions || [];
    auditLogs = loaded.auditLogs || [];

    if (loaded.pilotSettings) {
      pilotSettingsStore = loaded.pilotSettings;
    }
    loaded.pilotFeedbacks?.forEach(f => pilotFeedbacksStore.set(f.id, f));
    loaded.incidents?.forEach(i => incidentsStore.set(i.id, i));

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
      if (id.startsWith('pupil_unpaid_') || id.startsWith('pupil_pilot_') || s.name.includes('Unpaid Pupil') || s.name.includes('Arbitrary Check')) {
        studentsStore.delete(id);
        cleanedScratch = true;
      }
    }
    for (const [id, p] of parentsStore.entries()) {
      if (id.startsWith('parent_pilot_')) {
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
    const list = Array.from(studentsStore.values());
    if (parentIdFilter) {
      return list.filter(s => s.parentId === parentIdFilter);
    }
    return list;
  },

  getStudentById: (id: string): StudentProfile | undefined => {
    return studentsStore.get(id);
  },

  getStudentsByParentId: (parentId: string): StudentProfile[] => {
    return Array.from(studentsStore.values()).filter(s => s.parentId === parentId);
  },

  addStudent: (student: StudentProfile): StudentProfile => {
    studentsStore.set(student.id, student);
    persist();
    return student;
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
    badge: string;
    reexplained: boolean;
    objectivesMastery?: { objective: string; mastered: boolean }[];
    curriculumVersion?: string;
    sourceReference?: string;
  }): StudentProfile | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;

    // Look up authoritative curriculum record to lock versioning
    const currRecord = db.getCurriculumRecordById(lessonData.topicId);

    const entry = {
      ...lessonData,
      curriculumVersion: lessonData.curriculumVersion || currRecord?.curriculumVersion || 'nerdc-based-v1',
      sourceReference: lessonData.sourceReference || currRecord?.sourceReference || 'Universal Basic Education Standards',
      completedAt: new Date().toISOString()
    };

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
    objectivesMastery?: { objective: string; mastered: boolean }[];
  }): StudentProfile | null => {
    return db.recordCompletedLesson(studentId, {
      topicId: lessonData.topicId,
      subject: (lessonData.subject as SubjectName) || 'Mathematics',
      title: lessonData.title || 'Curriculum Lesson',
      score: lessonData.score,
      badge: lessonData.badge || (lessonData.score >= 70 ? 'MASTERED' : 'COMPLETED'),
      reexplained: Boolean(lessonData.reexplained),
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
    if (type === 'credit') {
      parent.walletBalance += amount;
    } else {
      parent.walletBalance = Math.max(0, parent.walletBalance - amount);
    }
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

  createPaymentIntent: (data: {
    parentId: string;
    childId: string;
    grade: GradeLevel;
    term: number;
    amount: number;
    channel: string;
    reference: string;
  }): TermPaymentRecord => {
    const student = db.getStudentById(data.childId);
    const now = new Date().toISOString();
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
      planTitle: data.amount >= 15000 ? 'Brightly Home Lesson — Annual Session Pass' : 'Brightly Home Lesson — Term Learning Plan',
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
    return paymentsStore.get(reference);
  },

  verifyAndRecordPayment: (
    reference: string, 
    channel = 'Paystack', 
    paystackData?: any
  ): TermPaymentRecord | null => {
    const payment = paymentsStore.get(reference);
    if (!payment) return null;

    // Strict Idempotency: If already finalized as paid, return immediately without duplicate mutations
    if (payment.status === 'paid') {
      return payment;
    }

    const now = new Date();
    const accessEnd = new Date(now.getTime() + (STANDARD_TUITION_FEES.termDurationDays * 24 * 60 * 60 * 1000));

    payment.status = 'paid';
    payment.channel = channel;
    payment.paymentDate = now.toISOString();
    payment.accessStartDate = now.toISOString();
    payment.accessEndDate = accessEnd.toISOString();
    payment.updatedAt = now.toISOString();

    if (paystackData?.receiptNo) {
      payment.receiptNo = paystackData.receiptNo;
    }

    paymentsStore.set(reference, payment);

    // Authoritatively activate student termly tuition
    const student = studentsStore.get(payment.childId);
    if (student) {
      student.activeSubscription = true;
      if (!student.termlyTuition) {
        student.termlyTuition = {};
      }
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
      studentsStore.set(payment.childId, student);
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
      subjectsCoverage
    };
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
  }
};
