export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SubjectName = 
  | 'Mathematics'
  | 'English Studies'
  | 'Basic Science & Technology'
  | 'Social Studies'
  | 'Civic Education'
  | 'Agricultural Science';

export type VoiceTone = 'nigerian_teacher' | 'phonics';

export type MasteryLevel = 'Beginning' | 'Developing' | 'Approaching Mastery' | 'Mastered' | 'Strong Mastery';

export interface ObjectiveMasteryRecord {
  objective: string;
  mastered: boolean;
  masteryLevel?: MasteryLevel;
  details?: string;
}

export interface TermlyPaymentRecord {
  paid: boolean;
  paidAt?: string;
  amount: number;
  term?: number;
  grade?: GradeLevel;
  reference?: string;
  receiptNo?: string;
  channel?: 'Paystack' | 'Bank Transfer' | 'Flutterwave' | 'USSD' | 'Wallet';
  accessExpires?: string;
}

export interface StudentProfile {
  id: string;
  parentId: string;
  name: string;
  username?: string;
  password?: string;
  grade: GradeLevel;
  registeredGrade: GradeLevel;
  pin: string;
  avatarUrl: string;
  avatarColor: string;
  currentTerm: 1 | 2 | 3;
  currentWeek: number;
  lessonsCompletedThisWeek: number;
  totalLessonsThisWeek: number;
  topSubject: SubjectName;
  overallScore: number;
  scoreChangeText: string;
  completedLessons: {
    topicId: string;
    subject: SubjectName;
    title: string;
    score: number;
    badge: string;
    reexplained: boolean;
    completedAt: string;
    objectivesMastery?: ObjectiveMasteryRecord[];
    curriculumVersion?: string;
    sourceReference?: string;
  }[];
  activeSubscription: boolean;
  termlyTuition: Record<number, TermlyPaymentRecord>;
  preferredVoiceTone?: VoiceTone;
}

export interface ParentAccount {
  id: string;
  name: string;
  email: string;
  pin: string;
  phone: string;
  walletBalance: number;
  referralCode: string;
  referredCount: number;
  subscriptionPlan: 'none' | 'termly' | 'annual';
  subscriptionExpiry: string;
}

export const STANDARD_TUITION_FEES = {
  currency: 'NGN',
  currencySymbol: '₦',
  termlyPlanFee: 6000,
  annualPlanFee: 15000,
  termDurationDays: 100,
};

export type PaymentStatus = 'not_paid' | 'pending' | 'paid' | 'failed' | 'expired';

export interface TermPaymentRecord {
  id: string;
  parentId: string;
  childId: string;
  childName: string;
  grade: GradeLevel;
  term: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  channel: string;
  transactionReference: string;
  paystackReference?: string;
  receiptNo: string;
  paymentDate?: string;
  accessStartDate?: string;
  accessEndDate?: string;
  planTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  channel: string;
  reference: string;
  date: string;
}

export interface FeatureGateEvaluation {
  allowed: boolean;
  gate: string;
  reason?: 'unregistered_class' | 'term_unpaid' | 'pin_required' | 'insufficient_wallet' | 'active_required';
  message: string;
  requiredFee?: number;
  details?: Record<string, any>;
}

export type PublishingStatus = 'NOT_AVAILABLE' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED';

export interface CurriculumReviewMetadata {
  sourceDocument?: string;
  sourceReference?: string;
  curriculumVersion: string;
  publishingStatus: PublishingStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  notes?: string;
}

export interface CurriculumCoverageStat {
  grade: GradeLevel;
  className: string;
  totalSubjects: number;
  activeSubjects: number;
  totalWeeksAvailable: number;
  recordsCount: number;
  publishedCount: number;
  underReviewCount: number;
  draftCount: number;
}

export type UserRole = 'admin' | 'parent' | 'pupil' | 'guest';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  role: UserRole;
  parentId?: string;
  studentId?: string;
  email?: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'CURRICULUM_CREATE' | 'CURRICULUM_UPDATE' | 'WORKFLOW_TRANSITION' | 'CURRICULUM_IMPORT' | 'PAYMENT_VERIFIED' | 'ROLE_CHANGE';
  targetType: 'curriculum' | 'payment' | 'user' | 'system';
  targetId: string;
  details?: Record<string, any>;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  timestamp: string;
}

export type WeekPeriodType = 
  | 'instructional' 
  | 'revision' 
  | 'assessment' 
  | 'examination' 
  | 'special_instructional';

export interface TermStructureConfig {
  termNumber: 1 | 2 | 3;
  termName: 'First Term' | 'Second Term' | 'Third Term';
  totalWeeks: number; // Variable week count (e.g. 10, 11, 12, 13, 14 weeks)
  revisionWeeks?: number[];
  assessmentWeeks?: number[];
  examinationWeeks?: number[];
  specialInstructionalWeeks?: number[];
  structureNotes?: string;
}

export interface CurriculumRecord {
  id: string;
  grade: GradeLevel;
  subject: SubjectName;
  term: number;
  week: number;
  weekType?: WeekPeriodType;
  periodTitle?: string;
  specialPeriodNote?: string;
  theme?: string | null;
  topic: string;
  subtopic?: string | null;
  learningObjectives: string[];
  competencies?: string[] | null;
  contentOutline?: string;
  learningActivities?: string[];
  teachingResources?: string[];
  teachingAids?: Array<{
    id: string;
    title: string;
    type: 'visual' | 'diagram' | 'audio' | 'object' | 'story';
    description: string;
    suggestedUsage?: string;
  }>;
  assessmentQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
  practiceQuestions?: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  curriculumVersion: string;
  publishingStatus: PublishingStatus;
  sourceDocument?: string;
  sourceReference?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  notes?: string;
  readiness?: LessonReadinessReport;
}

export type LessonReadinessStatus = 'READY' | 'WARNING' | 'NOT READY';

export interface ReadinessCheckDetail {
  ruleId: string;
  ruleName: string;
  category: 'metadata' | 'pedagogy' | 'source' | 'workflow';
  passed: boolean;
  severity: 'blocking' | 'warning';
  message: string;
}

export interface LessonReadinessReport {
  recordId: string;
  status: LessonReadinessStatus;
  isReadyForLesson: boolean;
  canPublish: boolean;
  errors: string[];
  warnings: string[];
  checks: ReadinessCheckDetail[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    blockingErrorsCount: number;
    warningsCount: number;
  };
  inspectedAt: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        parentId?: string;
        studentId?: string;
        email?: string;
        name: string;
      } | null;
      session?: UserSession | null;
      rawBody?: Buffer;
    }
  }
}



