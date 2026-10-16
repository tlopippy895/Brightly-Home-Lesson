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
    masteryLevel?: MasteryLevel;
    curriculumVersion?: string;
    sourceReference?: string;
  }[];
  activeSubscription: boolean;
  termlyTuition: Record<number, TermlyPaymentRecord>;
  subscriptionPlan?: 'monthly' | 'termly' | 'annual' | 'founding_annual';
  subscriptionExpiresAt?: string;
  monthlySubscription?: {
    paid: boolean;
    paidAt: string;
    accessExpires: string;
    amount: number;
    reference: string;
  };
  annualSubscription?: {
    paid: boolean;
    paidAt: string;
    accessExpires: string;
    amount: number;
    reference: string;
    isFoundingOffer?: boolean;
  };
  preferredVoiceTone?: VoiceTone;
  schoolName?: string;
  academicSession?: string;
  loginIdentifier?: string;
  learningPreferences?: {
    preferredSubjects?: SubjectName[];
    studyGoalMinutes?: number;
    dailyGoal?: number;
  };
  accountType?: AccountClassification;
  accountStatus?: AccountStatus;
  deactivatedAt?: string;
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
  passwordHash?: string;
  salt?: string;
  phone: string;
  walletBalance: number;
  referralCode: string;
  referredCount: number;
  subscriptionPlan: 'none' | 'monthly' | 'termly' | 'annual';
  subscriptionExpiry: string;
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  accountType?: AccountClassification;
  accountStatus?: AccountStatus;
  referredByCode?: string;
  referredByParentId?: string;
  consentRecorded?: boolean;
  consentDate?: string;
  consentNote?: string;
  onboardedAt?: string;
  updatedAt?: string;
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

export { 
  STANDARD_TUITION_FEES, 
  BRIGHTLY_PRICING_PLANS, 
  getAuthoritativePlanPrice,
  getPlanDurationDays,
  getPlanTitle
} from './pricing';
export type { PricingPlanConfig, SubscriptionPlanType } from './pricing';

export type PaymentStatus = 'not_paid' | 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'disputed';

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
  planType?: 'monthly' | 'termly' | 'annual' | 'founding_annual';
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
  parentId?: string;
  category?: string;
}

export type ReferralStatus = 'registered' | 'pending_payment' | 'rewarded' | 'reversed' | 'disqualified';

export interface ReferralRecord {
  id: string;
  referrerParentId: string;
  referrerCode: string;
  referredParentId: string;
  referredFamilyMaskedName: string;
  status: ReferralStatus;
  rewardAmount: number;
  registeredAt: string;
  qualifyingPaymentRef?: string;
  rewardedAt?: string;
  reversedAt?: string;
  disqualificationReason?: string;
  notes?: string;
}

export type CreditLedgerCategory = 
  | 'referral_reward' 
  | 'referral_reversal' 
  | 'subscription_redemption' 
  | 'wallet_topup' 
  | 'manual_adjustment';

export interface CreditLedgerEntry {
  id: string;
  parentId: string;
  type: 'credit' | 'debit';
  category: CreditLedgerCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  relatedReferralId?: string;
  relatedPaymentRef?: string;
  description: string;
  createdAt: string;
}

export interface MaskedReferralItem {
  id: string;
  maskedName: string;
  status: ReferralStatus;
  rewardAmount: number;
  registeredAt: string;
  rewardedAt?: string;
  reversedAt?: string;
  qualifyingPaymentRef?: string;
}

export interface ParentReferralSummary {
  referralCode: string;
  invitationLink: string;
  availableCreditBalance: number;
  totalEarnedCredits: number;
  totalCreditsUsed: number;
  totalReferredCount: number;
  rewardedCount: number;
  pendingCount: number;
  referrals: MaskedReferralItem[];
  ledger: CreditLedgerEntry[];
}

export interface FeatureGateEvaluation {
  allowed: boolean;
  gate: string;
  reason?: 'unregistered_class' | 'term_unpaid' | 'pin_required' | 'insufficient_wallet' | 'active_required' | 'pilot_paused' | 'unpublished_lesson' | 'subscription_expired';
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
  action: 'CURRICULUM_CREATE' | 'CURRICULUM_UPDATE' | 'WORKFLOW_TRANSITION' | 'CURRICULUM_IMPORT' | 'PAYMENT_VERIFIED' | 'PAYMENT_FAILED' | 'PAYMENT_DISPUTED' | 'PAYMENT_REFUNDED' | 'ROLE_CHANGE' | 'REFERRAL_REWARD_ISSUED' | 'REFERRAL_REWARD_REVERSED' | 'REFERRAL_ATTACHED';
  targetType: 'curriculum' | 'payment' | 'user' | 'system' | 'referral';
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
  checks?: {
    singleInstanceMode: boolean;
    persistenceHealthy: boolean;
    storageFilePresent: boolean;
    backupFilePresent: boolean;
  };
  inspectedAt: string;
}

export interface PaymentReadinessReport {
  overallStatus: PilotStatusLevel;
  paymentMode: 'TEST' | 'LIVE' | 'NOT CONFIGURED';
  currency: 'NGN';
  standardTermTuition: number;
  standardAnnualTuition: number;
  standardMonthlyTuition?: number;
  foundingAnnualTuition?: number;
  serverSecretConfigured: boolean;
  clientPublicConfigured: boolean;
  isKeyFormatConsistent: boolean;
  webhookEndpoint: string;
  webhookSignatureMethod: 'HMAC-SHA512 (Raw Body)';
  webhookVerifiedLive: boolean;
  freePreviewWeek: 1;
  paidEnforcementWeek: '2+';
  activeKeysConfigured?: boolean;
  configuredCurrencies?: string[];
  liveModeBlockedWithoutApproval?: boolean;
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

// ============================================================================
// PHASE 6: THREE-TERM CURRICULUM ARCHITECTURE & 17-LAYER HIERARCHY TYPES
// ============================================================================

export type CurriculumAuthorityType = 'national_curriculum' | 'school_scheme_of_work';

export type CurriculumLifecycleState = 
  | 'missing'                 // Official source document not in hand; gap registered in Missing Documents Register
  | 'awaiting_verification'   // Source document submitted, awaiting curriculum specialist audit
  | 'imported'                // Raw topic outline ingested; pedagogical content/practice pending
  | 'lesson_ready'            // Full pedagogical content, visual aids, practice, & assessment passed readiness gate
  | 'published';              // Reviewed, approved and live for pupils

export type VerificationStatus = 'verified' | 'unverified' | 'discrepancy_flagged';

export interface CurriculumAuthorityMetadata {
  authorityId: 'NERDC_NATIONAL' | 'SCHOOL_SCHEME_OF_WORK';
  authorityName: string;
  standardType: CurriculumAuthorityType;
  version: string;
  jurisdiction: string;
  officialDocument: string;
  gazetteNotice?: string;
  schoolId?: string;
  schoolName?: string;
  schemeNotes?: string;
}

export interface TeachingContentDetail {
  ageAppropriateExplanation: string;
  whiteboardSteps: {
    stepNumber: number;
    title: string;
    teacherSpeech: string;
    boardText: string;
    bulletPoints?: string[];
    equationOrHighlight?: string;
    diagramSvgType?: string;
  }[];
  keyConcepts: string[];
  culturalContext: string;
  concreteExamples: string[];
}

export interface ActivitiesAndResources {
  concreteVisualAids: {
    title: string;
    description: string;
    itemType?: string;
    icon?: string;
    caption?: string;
    aidType?: string;
  }[];
  classroomActivities: string[];
  teachingAids: string[];
  homeExplorationTask: string;
}

export interface StructuredLessonPlanPhase {
  phaseNumber: number;
  name: string;
  durationMinutes: number;
  description: string;
  teacherAction: string;
  pupilAction: string;
}

export interface StructuredLessonPlan {
  phases: StructuredLessonPlanPhase[];
  totalDurationMinutes: number;
}

export interface MasteryCriteriaDetail {
  passPercentage: number;
  minimumCorrectQuestions: number;
  badgeAwarded: string;
  remedialWork: {
    triggerCondition: string;
    remedialSteps: string[];
    simplifiedConceptExplanation: string;
    guidedRetest: boolean;
  };
  enrichment: {
    triggerCondition: string;
    advancedChallengeTask: string;
    realWorldExtension: string;
  };
}

export interface ParentReportMapping {
  competencyDescriptor: string;
  reportCardComments: {
    exemplary: string;
    satisfactory: string;
    needsSupport: string;
  };
  homeDiscussionPrompt: string;
  recommendedHomeActivity: string;
}

export interface CurriculumHierarchyNode {
  // 1. Authority / Version
  authority: CurriculumAuthorityMetadata;
  curriculumVersion: string;
  
  // 2. Class
  grade: GradeLevel;
  className: string;
  stage: 'Lower Basic' | 'Middle Basic' | 'Upper Basic';
  ageRange: string;
  
  // 3. Subject
  subject: SubjectName;
  
  // 4. Academic Session
  academicSession: string;
  
  // 5. Term
  term: 1 | 2 | 3;
  termName: 'First Term' | 'Second Term' | 'Third Term';
  termTotalWeeks: number;
  
  // 6. Week
  week: number;
  weekType: 'instructional' | 'revision' | 'assessment' | 'examination' | 'special_instructional';
  periodTitle: string;
  specialPeriodNote?: string;
  
  // 7. Strand / Theme
  strand: string;
  theme: string;
  
  // 8. Topic
  topic: string;
  
  // 9. Subtopic
  subtopic: string;
  
  // 10. Learning Objectives
  learningObjectives: string[];
  
  // 11. Competencies
  competencies: string[];
  
  // 12. Teaching Content
  teachingContent: TeachingContentDetail;
  
  // 13. Activities / Resources
  activitiesAndResources: ActivitiesAndResources;
  
  // 14. Lesson Plan
  lessonPlan: StructuredLessonPlan;
  
  // 15. Practice
  practice: any[];
  
  // 16. Assessment
  assessment: any[];
  
  // 17. Mastery Criteria & Remedial/Enrichment
  masteryCriteria: MasteryCriteriaDetail;
  
  // 18. Parent Report Mapping
  parentReportMapping: ParentReportMapping;
  
  // State, Traceability & Audit
  nodeId: string;
  lessonId: string;
  lifecycleState: CurriculumLifecycleState;
  verificationStatus: VerificationStatus;
  isComplete: boolean;
  canPublish: boolean;
  sourceDocument: string;
  sourceReference: string;
  importDate: string;
  missingDocumentCode?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  publishedAt?: string;
  notes?: string;
}

export interface MissingCurriculumDocument {
  code: string;
  title: string;
  publisher: string;
  edition: string;
  isbnOrGazette: string;
  status: 'DOCUMENT_REQUESTED' | 'DOCUMENT_SUBMITTED' | 'VERIFIED_ON_FILE';
  affectedGrades: GradeLevel[];
  affectedSubjects: SubjectName[];
  grade?: GradeLevel;
  subject?: SubjectName;
  requestStatus?: string;
  notes: string;
  requestedAt: string;
}

export interface SchoolSchemeOfWorkRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  grade: GradeLevel;
  subject: SubjectName;
  term: 1 | 2 | 3;
  academicSession: string;
  baseNationalCurriculumVersion: string;
  adaptedBy: string;
  adaptedAt: string;
  customNotes?: string;
  weeks: {
    week: number;
    weekType: 'instructional' | 'revision' | 'assessment' | 'examination' | 'special_instructional';
    periodTitle: string;
    customTopic?: string;
    nationalTopicReference?: string;
    isAlignedWithNational: boolean;
  }[];
}

export interface AuditableCoverageReport {
  generatedAt: string;
  curriculumAuthority: string;
  curriculumVersion: string;
  totalClasses: number;
  classes: {
    grade: GradeLevel;
    className: string;
    stage: string;
    ageRange: string;
    status: 'active' | 'awaiting_curriculum';
    publishedCount?: number;
    terms: {
      termNumber: 1 | 2 | 3;
      termName: string;
      totalWeeks: number;
      revisionWeeks: number[];
      assessmentWeeks: number[];
      examinationWeeks: number[];
      subjects: {
        subjectName: SubjectName;
        totalWeeks: number;
        verifiedCount: number;
        lessonReadyCount: number;
        importedCount: number;
        awaitingVerificationCount: number;
        missingCount: number;
        isTermComplete: boolean;
        topics: {
          week: number;
          weekType: string;
          topicTitle: string;
          lifecycleState: CurriculumLifecycleState;
          isComplete: boolean;
          sourceDocument?: string;
          missingDocumentCode?: string;
        }[];
      }[];
    }[];
  }[];
  missingDocuments: MissingCurriculumDocument[];
  classesCoverage?: AuditableCoverageReport['classes'];
  calendarTermsCount?: number;
  verifiedPublishedLessonsCount?: number;
  summary: {
    totalClassesCount: number;
    totalPossibleTopicSlots: number;
    totalVerifiedPublished: number;
    totalLessonReady: number;
    totalImported: number;
    totalAwaitingVerification: number;
    totalMissingDocumentGaps: number;
    overallCompletenessRate: string;
    antiFabricationGuarantee: string;
  };
}





