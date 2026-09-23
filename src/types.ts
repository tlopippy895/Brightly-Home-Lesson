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
  ethnicGroup: 'Igbo' | 'Hausa' | 'Yoruba' | 'Efik/Ibibio' | 'Edo';
  gender: 'female' | 'male';
  region?: string;
  avatarEmoji: string;
  avatarColor: string;
  imageUrl?: string;
  subjectSpecialty: SubjectName;
  gradeRange: string;
  description: string;
  greeting: string;
  accentNote: string;
}

export interface ConcreteVisualAid {
  title: string;
  description: string;
  itemType: 'agege_bread' | 'oranges' | 'naira_notes' | 'cowries' | 'mangoes' | 'shapes_chart' | 'nigerian_map' | 'clock_face' | 'measuring_cylinder';
  icon: string;
  caption: string;
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

export interface LessonTopic {
  id: string;
  grade: GradeLevel;
  term: 1 | 2 | 3;
  week: number;
  subject: SubjectName;
  topic: string;
  subtopic: string;
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
  name: string;
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
