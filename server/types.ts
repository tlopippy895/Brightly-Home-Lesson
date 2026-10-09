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
    retestPassed?: boolean;
    completedAt: string;
    objectivesMastery?: ObjectiveMasteryRecord[];
    curriculumVersion?: string;
    sourceReference?: string;
  }[];
  activeSubscription: boolean;
  termlyTuition: Record<number, TermlyPaymentRecord>;
  preferredVoiceTone?: VoiceTone;
  accountType?: AccountClassification;
  accountStatus?: AccountStatus;
  consentRecorded?: boolean;
  onboardedAt?: string;
}

export type AccountClassification = 
  | 'internal_test_fixture' 
  | 'demonstration_account' 
  | 'unused_baseline' 
  | 'verified_real_pilot_participant';

export type AccountStatus = 'active' | 'deactivated';

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
  accountType?: AccountClassification;
  accountStatus?: AccountStatus;
  consentRecorded?: boolean;
  consentDate?: string;
  consentNote?: string;
  onboardedAt?: string;
}

export interface OnboardFamilyInput {
  parent: {
    name: string;
    email: string;
    phone: string;
    pin?: string;
    consentRecorded: boolean;
    consentDate: string;
    consentNote?: string;
  };
  pupils: {
    name: string;
    grade: GradeLevel;
    gender?: 'boy' | 'girl';
    pin?: string;
    preferredVoiceTone?: VoiceTone;
  }[];
}

export interface OnboardFamilyResult {
  success: boolean;
  message: string;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    accountType: AccountClassification;
    accountStatus: AccountStatus;
    consentRecorded: boolean;
  };
  pupils: {
    id: string;
    name: string;
    grade: GradeLevel;
    parentId: string;
    accountType: AccountClassification;
    accountStatus: AccountStatus;
    enrollmentStatus: 'ACTIVE_PILOT';
    currentWeek: number;
    paymentStatus: 'FREE_PREVIEW';
  }[];
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
  reason?: 'unregistered_class' | 'term_unpaid' | 'pin_required' | 'insufficient_wallet' | 'active_required' | 'pilot_paused';
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

// --------------------------------------------------------------------------
// CONTROLLED PILOT OPERATIONS & READINESS TYPES
// --------------------------------------------------------------------------

export type PilotStatusLevel = 'READY' | 'WARNING' | 'NOT READY';

export interface EnvironmentConfigItem {
  name: string;
  isSet: boolean;
  status: PilotStatusLevel;
  formatNote: string;
  maskedIndicator: string; // e.g. "CONFIGURED (sk_test_...)" or "CONFIGURED (sk_live_...)" - never exposes full secret
  recommendation?: string;
}

export interface EnvironmentReadinessReport {
  overallStatus: PilotStatusLevel;
  deploymentMode: 'SINGLE_INSTANCE_PILOT';
  variables: EnvironmentConfigItem[];
  storage: {
    primaryExists: boolean;
    backupExists: boolean;
    dataDir: string;
    mode: 'SINGLE_INSTANCE_PILOT';
    status: PilotStatusLevel;
  };
  inspectedAt: string;
}

export interface PaymentReadinessReport {
  overallStatus: PilotStatusLevel;
  paymentMode: 'TEST' | 'LIVE' | 'NOT CONFIGURED';
  currency: 'NGN';
  standardTermTuition: number;
  standardAnnualTuition: number;
  serverSecretConfigured: boolean;
  clientPublicConfigured: boolean;
  isKeyFormatConsistent: boolean;
  webhookEndpoint: string;
  webhookSignatureMethod: 'HMAC-SHA512 (Raw Body)';
  webhookVerifiedLive: boolean;
  freePreviewWeek: 1;
  paidEnforcementWeek: '2+';
  checks: Array<{
    name: string;
    status: PilotStatusLevel;
    message: string;
  }>;
}

export interface PilotReadinessSummary {
  application: {
    buildStatus: PilotStatusLevel;
    deploymentMode: 'SINGLE_INSTANCE_PILOT';
    persistenceMode: 'Atomic JSON + Backup (.bak)';
    environmentReadiness: PilotStatusLevel;
  };
  security: {
    authenticationStatus: PilotStatusLevel;
    rbacStatus: PilotStatusLevel;
    sessionProtectionStatus: PilotStatusLevel;
    rateLimitingStatus: PilotStatusLevel;
  };
  curriculum: {
    publishedRecordsCount: number;
    readySlotsCount: number;
    warningSlotsCount: number;
    notReadySlotsCount: number;
    intentionallyEmptySlotsCount: number;
    status: PilotStatusLevel;
  };
  aiTeacher: {
    geminiConfigStatus: PilotStatusLevel;
    curriculumValidationStatus: PilotStatusLevel;
    objectiveTraceabilityStatus: PilotStatusLevel;
    failureFallbackStatus: PilotStatusLevel;
    status: PilotStatusLevel;
  };
  payments: {
    paymentConfigStatus: PilotStatusLevel;
    paystackMode: 'TEST' | 'LIVE' | 'NOT CONFIGURED';
    webhookReadiness: PilotStatusLevel;
    tuitionAmountFormatted: string;
    week1PreviewStatus: PilotStatusLevel;
    week2PaymentEnforcementStatus: PilotStatusLevel;
    status: PilotStatusLevel;
  };
  storage: {
    primaryPersistenceStatus: PilotStatusLevel;
    backupStatus: PilotStatusLevel;
    singleInstanceStatus: PilotStatusLevel;
    status: PilotStatusLevel;
  };
  inspectedAt: string;
}

export interface PilotChecklistItem {
  id: string;
  category: 'Environment' | 'Security' | 'Payment' | 'Curriculum' | 'Pedagogy' | 'Operations';
  title: string;
  verificationType: 'CODE_CHECKED' | 'EXTERNALLY_VERIFIED';
  isAutomatedCheck: boolean;
  systemEvaluated: boolean;
  manualCompleted: boolean;
  statusText: string;
  notes?: string;
}

export interface PilotSettings {
  isPaused: boolean;
  pauseReason?: string;
  pausedAt?: string;
  checklistState: Record<string, boolean>;
  webhookVerifiedLive: boolean;
  lastWebhookVerifiedAt?: string;
}

export interface ParentPilotFeedback {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentEmail?: string;
  topicId: string;
  subject: string;
  lessonTitle: string;
  q1EasyToUnderstand: 'strongly_agree' | 'agree' | 'neutral' | 'disagree';
  q2ChildEnjoyed: 'strongly_agree' | 'agree' | 'neutral' | 'disagree';
  q3TeacherExplainedClearly: 'strongly_agree' | 'agree' | 'neutral' | 'disagree';
  q4HelpedSchoolwork: 'strongly_agree' | 'agree' | 'neutral' | 'disagree';
  q5NeededRepeatedExplanation: 'no' | 'once' | 'multiple_times';
  q6ImprovementSuggestions: string;
  submittedAt: string;
}

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PilotIncident {
  id: string;
  severity: IncidentSeverity;
  category: 'security' | 'payment' | 'curriculum' | 'ai_teacher' | 'persistence' | 'ui' | 'general';
  title: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface PilotCohortPupil {
  id: string;
  name: string;
  grade: GradeLevel;
  parentId: string;
  parentName: string;
  parentEmail: string;
  enrollmentStatus: 'ACTIVE_PILOT' | 'ENROLLED';
  paymentStatus: 'FREE_PREVIEW' | 'TERM_PAID' | 'ANNUAL_PASS' | 'UNPAID';
  lessonsCompletedCount: number;
  averageScore: number;
  currentMasteryLevel: 'Beginning' | 'Developing' | 'Approaching Mastery' | 'Mastered' | 'Strong Mastery';
  lastActivityAt?: string;
  technicalIssuesCount: number;
  feedbackSubmittedCount: number;
  accountType?: AccountClassification;
  accountStatus?: AccountStatus;
}

export interface PilotMonitoringMetrics {
  activePilotPupils: number;
  lessonsStarted: number;
  lessonsCompleted: number;
  completionRate: number;
  averageLessonScore: number;
  masteryDistribution: {
    beginning: number;
    developing: number;
    approachingMastery: number;
    mastered: number;
    strongMastery: number;
  };
  reexplanationFrequency: number;
  retestSuccessRate: number;
  lessonsRequiringRepeatedSupport: number;
  paymentSuccessCount: number;
  paymentFailureCount: number;
  authFailures: number;
  aiGenerationFailures: number;
  curriculumReadinessFailures: number;
  applicationErrors: number;
  openIncidentsCount: number;
  criticalIncidentsCount: number;
  pilotPaused: boolean;
}




