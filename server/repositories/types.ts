/**
 * Brightly Home Lesson — Repository Architecture Contracts
 * 
 * Formal interfaces defining domain data access operations.
 * Implemented by both PostgreSQL (production/staging) and JSON (development-only).
 */

import {
  ParentAccount,
  StudentProfile,
  TermPaymentRecord,
  WalletTransaction,
  CreditLedgerEntry,
  ReferralRecord,
  AdminUser,
  UserSession,
  AuditLogEntry,
  ParentPilotFeedback,
  PilotIncident,
  AccountStatus,
  GradeLevel,
  SubjectName,
  VoiceTone,
  SubscriptionPlanType,
  MasteryLevel
} from '../types';
import { ServerCurriculumRecord } from '../db';

export interface IParentRepository {
  findById(id: string): Promise<ParentAccount | null>;
  findByEmail(email: string): Promise<ParentAccount | null>;
  findByPhone(phone: string): Promise<ParentAccount | null>;
  findByReferralCode(code: string): Promise<ParentAccount | null>;
  findByIdentifier(identifier: string): Promise<ParentAccount | null>;
  findAll(): Promise<ParentAccount[]>;
  create(parent: ParentAccount): Promise<ParentAccount>;
  update(id: string, updates: Partial<ParentAccount>): Promise<ParentAccount | null>;
  setAccountStatus(id: string, status: AccountStatus): Promise<boolean>;
  updateFailedPinAttempts(id: string, attempts: number, lockoutUntil?: number): Promise<void>;
  resetPin(id: string, newPin: string): Promise<boolean>;
  updateWalletBalance(id: string, newBalance: number): Promise<void>;
  delete(id: string): Promise<boolean>;
}

export interface IPupilRepository {
  findById(id: string): Promise<StudentProfile | null>;
  findByUsername(username: string): Promise<StudentProfile | null>;
  findByParentId(parentId: string): Promise<StudentProfile[]>;
  findAll(): Promise<StudentProfile[]>;
  create(pupil: StudentProfile): Promise<StudentProfile>;
  update(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile | null>;
  setAccountStatus(id: string, status: AccountStatus): Promise<boolean>;
  updateGrade(id: string, grade: GradeLevel): Promise<StudentProfile | null>;
  updateVoiceTone(id: string, tone: VoiceTone): Promise<StudentProfile | null>;
  updateAvatar(id: string, avatarUrl: string): Promise<StudentProfile | null>;
  resetPin(id: string, newPin: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface CompletedLessonRecord {
  id?: number | string;
  pupilId: string;
  topicId: string;
  subject: SubjectName;
  title: string;
  score: number;
  badge?: string;
  reexplained: boolean;
  retestPassed?: boolean;
  masteryLevel?: MasteryLevel;
  curriculumVersion?: string;
  sourceReference?: string;
  objectivesMastery?: any;
  userAnswers?: any;
  completedAt?: string;
}

export interface ICompletedLessonRepository {
  findByPupilId(pupilId: string): Promise<CompletedLessonRecord[]>;
  findByPupilAndTopic(pupilId: string, topicId: string): Promise<CompletedLessonRecord | null>;
  recordCompletion(lesson: CompletedLessonRecord): Promise<CompletedLessonRecord>;
  countByPupil(pupilId: string): Promise<number>;
  countAll(): Promise<number>;
}

export interface IPaymentRepository {
  findById(id: string): Promise<TermPaymentRecord | null>;
  findByReference(reference: string): Promise<TermPaymentRecord | null>;
  findByParentId(parentId: string): Promise<TermPaymentRecord[]>;
  findByPupilId(pupilId: string): Promise<TermPaymentRecord[]>;
  findAll(): Promise<TermPaymentRecord[]>;
  create(payment: TermPaymentRecord): Promise<TermPaymentRecord>;
  update(reference: string, updates: Partial<TermPaymentRecord>): Promise<TermPaymentRecord | null>;
  finalizePayment(reference: string, updates: { amount?: number; channel?: string; paystackReference?: string; paidAt?: string }): Promise<TermPaymentRecord | null>;
  failPayment(reference: string): Promise<TermPaymentRecord | null>;
  refundOrDispute(reference: string, type: 'refund' | 'dispute'): Promise<TermPaymentRecord | null>;
  delete(reference: string): Promise<boolean>;
}

export interface IWalletRepository {
  createTransaction(tx: WalletTransaction): Promise<WalletTransaction>;
  findByParentId(parentId: string): Promise<WalletTransaction[]>;
  findAll(): Promise<WalletTransaction[]>;
  getBalance(parentId: string): Promise<number>;
  credit(parentId: string, amount: number, description: string, channel: string, reference?: string): Promise<{ newBalance: number; transaction: WalletTransaction }>;
  debit(parentId: string, amount: number, description: string): Promise<{ success: boolean; newBalance?: number; transaction?: WalletTransaction; error?: string }>;
}

export interface ICreditLedgerRepository {
  createEntry(entry: CreditLedgerEntry): Promise<CreditLedgerEntry>;
  findByParentId(parentId: string): Promise<CreditLedgerEntry[]>;
  findAll(): Promise<CreditLedgerEntry[]>;
}

export interface IReferralRepository {
  findById(id: string): Promise<ReferralRecord | null>;
  findByReferredParentId(referredParentId: string): Promise<ReferralRecord | null>;
  findByReferrerParentId(referrerParentId: string): Promise<ReferralRecord[]>;
  findByReferrerAndReferred(referrerParentId: string, referredParentId: string): Promise<ReferralRecord | null>;
  findAll(): Promise<ReferralRecord[]>;
  create(referral: ReferralRecord): Promise<ReferralRecord>;
  update(id: string, updates: Partial<ReferralRecord>): Promise<ReferralRecord | null>;
}

export interface ICurriculumRepository {
  findById(id: string): Promise<ServerCurriculumRecord | null>;
  findAll(): Promise<ServerCurriculumRecord[]>;
  filter(grade?: number, term?: 1 | 2 | 3, week?: number): Promise<ServerCurriculumRecord[]>;
  create(record: ServerCurriculumRecord): Promise<ServerCurriculumRecord>;
  update(id: string, updates: Partial<ServerCurriculumRecord>): Promise<ServerCurriculumRecord | null>;
  count(): Promise<number>;
}

export interface IAuditLogRepository {
  create(entry: AuditLogEntry): Promise<AuditLogEntry>;
  findAll(): Promise<AuditLogEntry[]>;
  filter(targetType?: string, targetId?: string): Promise<AuditLogEntry[]>;
}

export interface ISessionRepository {
  create(session: UserSession): Promise<UserSession>;
  findByToken(token: string): Promise<UserSession | null>;
  deleteByToken(token: string): Promise<boolean>;
  revokeByUserId(userId: string): Promise<void>;
  revokeByStudentId(studentId: string): Promise<void>;
  cleanExpired(): Promise<number>;
}

export interface PasswordResetOtpRecord {
  parentId: string;
  otpHash: string;
  attempts: number;
  expiresAt: number;
  createdAt?: string;
}

export interface IPasswordResetOtpRepository {
  save(record: PasswordResetOtpRecord): Promise<void>;
  findByParentId(parentId: string): Promise<PasswordResetOtpRecord | null>;
  delete(parentId: string): Promise<boolean>;
  incrementAttempts(parentId: string): Promise<number>;
}

export interface IAdminRepository {
  findById(id: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  findAll(): Promise<AdminUser[]>;
  create(admin: AdminUser): Promise<AdminUser>;
  updatePassword(id: string, hash: string, salt: string): Promise<boolean>;
}

export interface IPilotRepository {
  addFeedback(feedback: ParentPilotFeedback): Promise<ParentPilotFeedback>;
  getFeedbacks(studentIdFilter?: string): Promise<ParentPilotFeedback[]>;
  addIncident(incident: PilotIncident): Promise<PilotIncident>;
  updateIncident(id: string, updates: Partial<PilotIncident>): Promise<PilotIncident | null>;
  getIncidents(): Promise<PilotIncident[]>;
}

export interface IRepositoryContainer {
  readonly providerName: 'postgres' | 'json';
  readonly isDurable: boolean;
  readonly parents: IParentRepository;
  readonly pupils: IPupilRepository;
  readonly completedLessons: ICompletedLessonRepository;
  readonly payments: IPaymentRepository;
  readonly wallet: IWalletRepository;
  readonly creditLedger: ICreditLedgerRepository;
  readonly referrals: IReferralRepository;
  readonly curriculum: ICurriculumRepository;
  readonly auditLogs: IAuditLogRepository;
  readonly sessions: ISessionRepository;
  readonly otps: IPasswordResetOtpRepository;
  readonly admins: IAdminRepository;
  readonly pilot: IPilotRepository;
}
