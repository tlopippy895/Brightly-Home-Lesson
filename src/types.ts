export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SubjectName = 
  | 'Mathematics'
  | 'English Studies'
  | 'Basic Science & Technology'
  | 'Social Studies'
  | 'Civic Education'
  | 'Agricultural Science';

export type LessonStatus = 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' | 'LOCKED';

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
    completedAt: string;
    objectivesMastery?: { objective: string; mastered: boolean }[];
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

