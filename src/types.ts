export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SubjectName = 
  | 'Mathematics'
  | 'English Studies'
  | 'Basic Science & Technology'
  | 'Social Studies'
  | 'Civic Education'
  | 'Agricultural Science';

export type LessonStatus = 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' | 'LOCKED';

export type MasteryLevel = 
  | 'Beginning' 
  | 'Developing' 
  | 'Approaching Mastery' 
  | 'Mastered' 
  | 'Strong Mastery';

export interface TeacherPersona {
  id: string;
  name: string;
  title: string;
  assignedGrade: GradeLevel;
  classTitle: string;
  ethnicGroup: 'Igbo' | 'Hausa' | 'Yoruba' | 'Efik/Ibibio' | 'Edo';
  gender: 'female' | 'male';
  region?: string;
  avatarEmoji: string;
  avatarColor: string;
  imageUrl?: string;
  subjectSpecialty?: SubjectName | string;
  gradeRange: string;
  description: string;
  greeting: string;
  accentNote: string;
}

export type TeachingAidType = 
  | 'image' 
  | 'diagram' 
  | 'flashcard' 
  | 'audio' 
  | 'video' 
  | 'animation' 
  | 'interactive activity' 
  | 'real-life object' 
  | 'printable resource';

export interface ConcreteVisualAid {
  title: string;
  description: string;
  itemType: 'agege_bread' | 'oranges' | 'naira_notes' | 'cowries' | 'mangoes' | 'shapes_chart' | 'nigerian_map' | 'clock_face' | 'measuring_cylinder' | 'general';
  icon: string;
  caption: string;
  aidType?: TeachingAidType;
  resourceAvailable?: boolean;
}

export interface WhiteboardStep {
  stepNumber: number;
  title: string;
  teacherSpeech: string;
  boardText: string;
  bulletPoints: string[];
  equationOrHighlight?: string;
  diagramSvgType?: string;
  visualAidCaption?: string;
}

export interface PracticeItem {
  id: string;
  question: string;
  concreteContext: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  visualAidIcon: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  contextNigerian: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint: string;
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

export interface LessonTopic {
  id: string;
  grade: GradeLevel;
  term: 1 | 2 | 3;
  week: number;
  subject: SubjectName;
  topic: string;
  subtopic: string;
  weekType?: WeekPeriodType;
  periodTitle?: string;
  specialPeriodNote?: string;
  isFree: boolean; // Week 1 Maths is free by default
  objectives: string[];
  lastWeekRevision: string;
  previousKnowledge: string;
  concreteVisualAids: ConcreteVisualAid[];
  whiteboardSteps: WhiteboardStep[];
  practiceProblems: PracticeItem[];
  assessmentQuestions: AssessmentQuestion[];
  teacherId: string;
  status?: LessonStatus;
  userScore?: number;
  reexplained?: boolean;
}

export type VoiceTone = 'nigerian_teacher' | 'phonics';

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
  parentId?: string;
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
    objectivesMastery?: { objective: string; mastered: boolean; masteryLevel?: MasteryLevel; details?: string }[];
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
  accountType?: string;
  accountStatus?: 'active' | 'deactivated';
  deactivatedAt?: string;
}

export interface ParentAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  pin?: string;
  walletBalance: number;
  referralCode: string;
  referredCount: number;
  subscriptionPlan: 'none' | 'termly' | 'annual';
  subscriptionExpiry: string;
  accountType?: string;
  accountStatus?: string;
  consentRecorded?: boolean;
}

export type SubscriptionPlanType = 'monthly' | 'termly' | 'annual' | 'founding_annual';

export interface PricingPlanConfig {
  id: SubscriptionPlanType;
  name: string;
  badge: string;
  priceNaira: number;
  priceKobo: number;
  periodLabel: string;
  durationDays: number;
  description: string;
  termsCovered: number[];
  popular?: boolean;
  isFoundingOffer?: boolean;
  features: string[];
}

export const STANDARD_TUITION_FEES = {
  currency: 'NGN',
  currencySymbol: '₦',
  monthlyPlanFee: 2500,
  termlyPlanFee: 6000,
  annualPlanFee: 18000,
  foundingAnnualPlanFee: 15000,
  monthDurationDays: 30,
  termDurationDays: 100,
  annualDurationDays: 365,
};

export const BRIGHTLY_PRICING_PLANS: Record<SubscriptionPlanType, PricingPlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Flexible Pass',
    badge: 'Flexible Monthly Access',
    priceNaira: 2500,
    priceKobo: 250000,
    periodLabel: 'per child / month',
    durationDays: 30,
    description: '30 days full access to all published subjects for the child’s enrolled class with daily 30-minute lessons and progress tracking.',
    termsCovered: [1, 2, 3],
    features: [
      '30 days active access from payment date',
      'All 6 Core Nigerian primary subjects unlocked for enrolled class',
      'Interactive Whiteboard & Teacher Speech Engine',
      'Adaptive AI Re-Explanation Tutor interventions',
      'Continuous diagnostic progress reports',
      'No automatic recurring card debits (prepaid access)'
    ]
  },
  termly: {
    id: 'termly',
    name: 'Termly Single Pass',
    badge: '1 Child • 1 Academic Term',
    priceNaira: 6000,
    priceKobo: 600000,
    periodLabel: 'per child / term',
    durationDays: 100,
    description: 'Full term access to all published subjects for the enrolled class for the selected academic term (Term 1, 2, or 3).',
    termsCovered: [1],
    popular: true,
    features: [
      'Full Term syllabus access (100 days coverage)',
      'All 6 Core Nigerian primary subjects unlocked for enrolled class',
      'Interactive Whiteboard & Teacher Speech Engine',
      'Adaptive AI Re-Explanation Tutor interventions',
      'Parent Diagnostic Progress Reports & weekly summaries',
      'Official NERDC Scheme of Work compliance'
    ]
  },
  annual: {
    id: 'annual',
    name: 'Annual Master Session Pass',
    badge: 'Full Session • 3 Terms Complete',
    priceNaira: 18000,
    priceKobo: 1800000,
    periodLabel: 'per child / academic year',
    durationDays: 365,
    description: 'Complete 3-term academic year access for one child across all published subjects with revision and continuous diagnostic mastery.',
    termsCovered: [1, 2, 3],
    features: [
      'All 3 Terms unlocked (First, Second, and Third Term)',
      'Full 365-day academic session coverage',
      'All 6 Core Subjects unlocked simultaneously',
      'National Common Entrance Examination revision modules',
      'Unlimited Adaptive Re-Teaching Interventions',
      'Full Parent Governance & Exportable Tuition Receipts'
    ]
  },
  founding_annual: {
    id: 'founding_annual',
    name: 'Founding-Family Annual Offer',
    badge: 'Limited Founding Offer • Save ₦3,000',
    priceNaira: 15000,
    priceKobo: 1500000,
    periodLabel: 'per eligible child / academic year',
    durationDays: 365,
    description: 'Special early pilot founding family offer covering all 3 terms (full session) at a discounted rate of ₦15,000.',
    termsCovered: [1, 2, 3],
    isFoundingOffer: true,
    features: [
      'Exclusive ₦15,000 founding-family rate (saves ₦3,000 off standard ₦18,000 annual)',
      'All 3 Terms unlocked (Full Academic Session)',
      'Full 365-day access for one enrolled child',
      'Direct line to Brightly educational advisory support',
      'Guaranteed pricing protection for subsequent academic terms',
      'Official verified Paystack payment receipt'
    ]
  }
};

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
  planType?: SubscriptionPlanType;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  parentId: string;
  childId: string;
  childName?: string;
  amount: number;
  term: number;
  grade?: GradeLevel;
  paymentDate: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  transactionReference: string;
  channel?: string;
  receiptNo?: string;
}


export interface ParentReportPayload {
  studentName: string;
  gradeText: string;
  weekText: string;
  overallScore: number;
  lessonsCompleted: number;
  totalWeeklyLessons: number;
  masteryRating: 'EXEMPLARY' | 'MASTERED' | 'DEVELOPING';
  topSubject: string;
  aiInterventionsCount: number;
  completedModules: string[];
  teacherRecommendation: string;
  homeActivityPrompt: string;
  timestamp: string;
}

export interface RegulatoryItem {
  id: string;
  name: string;
  category: 'Curriculum' | 'Data Protection' | 'Corporate & Tax' | 'Infrastructure' | 'Cloud & Payments';
  domain: string;
  url: string;
  purpose: string;
  actionRequired: string;
  status: 'Compliant & Integrated' | 'Verified' | 'Configured' | 'Active Production';
}

export type UserRole = 'pupil' | 'parent' | 'admin' | 'guest';

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

export interface CurriculumRecord extends LessonTopic {
  theme?: string | null;
  competencies?: string[] | null;
  contentOutline?: string;
  learningActivities?: string[];
  teachingResources?: string[];
  publishingStatus: PublishingStatus;
  sourceDocument?: string;
  sourceReference?: string;
  curriculumVersion: string;
  reviewedBy?: string;
  approvedBy?: string;
  publishedAt?: string;
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

export interface TeachingAidRecord {
  id: string;
  topicId: string;
  topicTitle: string;
  grade: GradeLevel;
  subject: SubjectName;
  term: number;
  week: number;
  title: string;
  description: string;
  aidType: TeachingAidType;
  icon: string;
  caption: string;
  concreteItemType: string;
  resourceAvailable: boolean;
}

export interface QuestionRecord {
  id: string;
  topicId: string;
  grade: GradeLevel;
  subject: SubjectName;
  term: number;
  week: number;
  topic: string;
  learningObjective: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  questionType: 'multiple_choice' | 'concrete_problem' | 'fill_blank';
  question: string;
  options: string[];
  correctAnswer: string | number;
  explanation: string;
  usage: 'practice' | 'assessment';
  masteryLevel: 'Beginning' | 'Developing' | 'Approaching Mastery' | 'Mastered' | 'Strong Mastery';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
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

// --------------------------------------------------------------------------
// CONTROLLED PILOT OPERATIONS & READINESS (FRONTEND)
// --------------------------------------------------------------------------

export type PilotStatusLevel = 'READY' | 'WARNING' | 'NOT READY';

export interface EnvironmentConfigItem {
  name: string;
  isSet: boolean;
  status: PilotStatusLevel;
  formatNote: string;
  maskedIndicator: string;
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
    persistenceMode: string;
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

// --------------------------------------------------------------------------
// PHASE 5: REFERRAL PROGRAMME & SUBSCRIPTION CREDIT TYPES
// --------------------------------------------------------------------------

export type ReferralStatus = 'registered' | 'pending_payment' | 'rewarded' | 'reversed' | 'disqualified';

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



