/**
 * Brightly Home Lesson — Development-Only JSON Repository Implementation
 * 
 * DESIGNATION: DEVELOPMENT / SYNTHETIC TEST FIXTURE ONLY
 * Not permitted for multi-instance or durable production workloads.
 * Wraps in-memory Maps with atomic disk serialization to .data/brightly_db.json.
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
  VoiceTone
} from '../../types';
import { ServerCurriculumRecord } from '../../db';
import {
  IParentRepository,
  IPupilRepository,
  ICompletedLessonRepository,
  CompletedLessonRecord,
  IPaymentRepository,
  IWalletRepository,
  ICreditLedgerRepository,
  IReferralRepository,
  ICurriculumRepository,
  IAuditLogRepository,
  ISessionRepository,
  IPasswordResetOtpRepository,
  PasswordResetOtpRecord,
  IAdminRepository,
  IPilotRepository,
  IRepositoryContainer
} from '../types';

export class JsonParentRepository implements IParentRepository {
  constructor(
    private getStore: () => Map<string, ParentAccount>,
    private persist: () => void
  ) {}

  async findById(id: string): Promise<ParentAccount | null> {
    return this.getStore().get(id) || null;
  }

  async findByEmail(email: string): Promise<ParentAccount | null> {
    const clean = email.toLowerCase().trim();
    for (const p of this.getStore().values()) {
      if (p.email && p.email.toLowerCase().trim() === clean) return p;
    }
    return null;
  }

  async findByPhone(phone: string): Promise<ParentAccount | null> {
    const raw = phone.replace(/\D/g, '');
    for (const p of this.getStore().values()) {
      if (!p.phone) continue;
      const pRaw = p.phone.replace(/\D/g, '');
      if (pRaw === raw || (raw.length >= 10 && pRaw.slice(-10) === raw.slice(-10))) {
        return p;
      }
    }
    return null;
  }

  async findByReferralCode(code: string): Promise<ParentAccount | null> {
    const clean = code.trim().toUpperCase();
    for (const p of this.getStore().values()) {
      if (p.referralCode && p.referralCode.trim().toUpperCase() === clean) return p;
    }
    return null;
  }

  async findByIdentifier(identifier: string): Promise<ParentAccount | null> {
    const clean = identifier.trim();
    if (!clean) return null;
    const store = this.getStore();
    if (store.has(clean)) return store.get(clean)!;
    if (clean.includes('@')) {
      const byEmail = await this.findByEmail(clean);
      if (byEmail) return byEmail;
    }
    const byPhone = await this.findByPhone(clean);
    if (byPhone) return byPhone;
    return null;
  }

  async findAll(): Promise<ParentAccount[]> {
    return Array.from(this.getStore().values());
  }

  async create(parent: ParentAccount): Promise<ParentAccount> {
    this.getStore().set(parent.id, parent);
    this.persist();
    return parent;
  }

  async update(id: string, updates: Partial<ParentAccount>): Promise<ParentAccount | null> {
    const current = this.getStore().get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.getStore().set(id, updated);
    this.persist();
    return updated;
  }

  async setAccountStatus(id: string, status: AccountStatus): Promise<boolean> {
    const p = this.getStore().get(id);
    if (!p) return false;
    p.accountStatus = status;
    p.updatedAt = new Date().toISOString();
    this.getStore().set(id, p);
    this.persist();
    return true;
  }

  async updateFailedPinAttempts(id: string, attempts: number, lockoutUntil = 0): Promise<void> {
    const p = this.getStore().get(id);
    if (p) {
      p.failedPinAttempts = attempts;
      p.lockoutUntil = lockoutUntil;
      this.getStore().set(id, p);
      this.persist();
    }
  }

  async resetPin(id: string, newPin: string): Promise<boolean> {
    const p = this.getStore().get(id);
    if (!p) return false;
    p.pin = newPin;
    p.failedPinAttempts = 0;
    p.lockoutUntil = 0;
    p.updatedAt = new Date().toISOString();
    this.getStore().set(id, p);
    this.persist();
    return true;
  }

  async updateWalletBalance(id: string, newBalance: number): Promise<void> {
    const p = this.getStore().get(id);
    if (p) {
      p.walletBalance = newBalance;
      this.getStore().set(id, p);
      this.persist();
    }
  }

  async delete(id: string): Promise<boolean> {
    const res = this.getStore().delete(id);
    if (res) this.persist();
    return res;
  }
}

export class JsonPupilRepository implements IPupilRepository {
  constructor(
    private getStore: () => Map<string, StudentProfile>,
    private persist: () => void
  ) {}

  async findById(id: string): Promise<StudentProfile | null> {
    return this.getStore().get(id) || null;
  }

  async findByUsername(username: string): Promise<StudentProfile | null> {
    const clean = username.trim().toLowerCase();
    for (const s of this.getStore().values()) {
      if (
        (s.username && s.username.toLowerCase() === clean) ||
        (s.loginIdentifier && s.loginIdentifier.toLowerCase() === clean)
      ) {
        return s;
      }
    }
    return null;
  }

  async findByParentId(parentId: string): Promise<StudentProfile[]> {
    return Array.from(this.getStore().values()).filter(s => s.parentId === parentId);
  }

  async findAll(): Promise<StudentProfile[]> {
    return Array.from(this.getStore().values());
  }

  async create(pupil: StudentProfile): Promise<StudentProfile> {
    this.getStore().set(pupil.id, pupil);
    this.persist();
    return pupil;
  }

  async update(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const current = this.getStore().get(id);
    if (!current) return null;
    const updated = { ...current, ...updates };
    this.getStore().set(id, updated);
    this.persist();
    return updated;
  }

  async setAccountStatus(id: string, status: AccountStatus): Promise<boolean> {
    const s = this.getStore().get(id);
    if (!s) return false;
    s.accountStatus = status;
    if (status === 'deactivated') {
      s.deactivatedAt = new Date().toISOString();
    }
    this.getStore().set(id, s);
    this.persist();
    return true;
  }

  async updateGrade(id: string, grade: GradeLevel): Promise<StudentProfile | null> {
    const s = this.getStore().get(id);
    if (!s) return null;
    s.grade = grade;
    this.getStore().set(id, s);
    this.persist();
    return s;
  }

  async updateVoiceTone(id: string, tone: VoiceTone): Promise<StudentProfile | null> {
    const s = this.getStore().get(id);
    if (!s) return null;
    s.preferredVoiceTone = tone;
    this.getStore().set(id, s);
    this.persist();
    return s;
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<StudentProfile | null> {
    const s = this.getStore().get(id);
    if (!s) return null;
    s.avatarUrl = avatarUrl;
    this.getStore().set(id, s);
    this.persist();
    return s;
  }

  async resetPin(id: string, newPin: string): Promise<boolean> {
    const s = this.getStore().get(id);
    if (!s) return false;
    s.pin = newPin;
    s.password = newPin;
    this.getStore().set(id, s);
    this.persist();
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const res = this.getStore().delete(id);
    if (res) this.persist();
    return res;
  }
}

export class JsonCompletedLessonRepository implements ICompletedLessonRepository {
  constructor(
    private getPupilStore: () => Map<string, StudentProfile>,
    private persist: () => void
  ) {}

  async findByPupilId(pupilId: string): Promise<CompletedLessonRecord[]> {
    const pupil = this.getPupilStore().get(pupilId);
    if (!pupil || !Array.isArray(pupil.completedLessons)) return [];
    return pupil.completedLessons.map((l: any) => ({
      pupilId,
      topicId: l.topicId,
      subject: l.subject,
      title: l.title,
      score: l.score,
      badge: l.badge,
      reexplained: Boolean(l.reexplained),
      retestPassed: Boolean(l.retestPassed),
      masteryLevel: l.masteryLevel,
      curriculumVersion: l.curriculumVersion || 'NERDC-BEC-2024-v2.1',
      sourceReference: l.sourceReference,
      objectivesMastery: l.objectivesMastery,
      completedAt: l.completedAt
    }));
  }

  async findByPupilAndTopic(pupilId: string, topicId: string): Promise<CompletedLessonRecord | null> {
    const lessons = await this.findByPupilId(pupilId);
    return lessons.find(l => l.topicId === topicId) || null;
  }

  async recordCompletion(lesson: CompletedLessonRecord): Promise<CompletedLessonRecord> {
    const pupil = this.getPupilStore().get(lesson.pupilId);
    if (!pupil) throw new Error(`Pupil ${lesson.pupilId} not found`);

    if (!Array.isArray(pupil.completedLessons)) {
      pupil.completedLessons = [];
    }

    const existingIdx = pupil.completedLessons.findIndex((l: any) => l.topicId === lesson.topicId);
    const entry = {
      topicId: lesson.topicId,
      subject: lesson.subject,
      title: lesson.title,
      score: lesson.score,
      badge: lesson.badge,
      reexplained: lesson.reexplained,
      retestPassed: lesson.retestPassed,
      masteryLevel: lesson.masteryLevel,
      curriculumVersion: lesson.curriculumVersion,
      sourceReference: lesson.sourceReference,
      objectivesMastery: lesson.objectivesMastery,
      completedAt: lesson.completedAt || new Date().toISOString()
    };

    if (existingIdx >= 0) {
      pupil.completedLessons[existingIdx] = entry;
    } else {
      pupil.completedLessons.push(entry);
    }

    // Update pupil aggregate score & completed count
    const totalScore = pupil.completedLessons.reduce((acc, l) => acc + (l.score || 0), 0);
    pupil.overallScore = Math.round(totalScore / pupil.completedLessons.length);
    pupil.lessonsCompletedThisWeek = (pupil.lessonsCompletedThisWeek || 0) + 1;

    this.getPupilStore().set(pupil.id, pupil);
    this.persist();
    return lesson;
  }

  async countByPupil(pupilId: string): Promise<number> {
    const pupil = this.getPupilStore().get(pupilId);
    return pupil?.completedLessons?.length || 0;
  }

  async countAll(): Promise<number> {
    let count = 0;
    for (const p of this.getPupilStore().values()) {
      if (Array.isArray(p.completedLessons)) count += p.completedLessons.length;
    }
    return count;
  }
}

export class JsonPaymentRepository implements IPaymentRepository {
  constructor(
    private getStore: () => Map<string, TermPaymentRecord>,
    private persist: () => void
  ) {}

  async findById(id: string): Promise<TermPaymentRecord | null> {
    for (const p of this.getStore().values()) {
      if (p.id === id) return p;
    }
    return null;
  }

  async findByReference(reference: string): Promise<TermPaymentRecord | null> {
    return this.getStore().get(reference) || null;
  }

  async findByParentId(parentId: string): Promise<TermPaymentRecord[]> {
    return Array.from(this.getStore().values())
      .filter(p => p.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findByPupilId(pupilId: string): Promise<TermPaymentRecord[]> {
    return Array.from(this.getStore().values())
      .filter(p => p.childId === pupilId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findAll(): Promise<TermPaymentRecord[]> {
    return Array.from(this.getStore().values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(payment: TermPaymentRecord): Promise<TermPaymentRecord> {
    this.getStore().set(payment.transactionReference, payment);
    this.persist();
    return payment;
  }

  async update(reference: string, updates: Partial<TermPaymentRecord>): Promise<TermPaymentRecord | null> {
    const current = this.getStore().get(reference);
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.getStore().set(reference, updated);
    this.persist();
    return updated;
  }

  async finalizePayment(reference: string, updates: { amount?: number; channel?: string; paystackReference?: string; paidAt?: string }): Promise<TermPaymentRecord | null> {
    const p = this.getStore().get(reference);
    if (!p) return null;
    p.status = 'paid';
    p.paymentDate = updates.paidAt || new Date().toISOString();
    p.accessStartDate = updates.paidAt || new Date().toISOString();
    if (updates.amount) p.amount = updates.amount;
    if (updates.channel) p.channel = updates.channel;
    if (updates.paystackReference) p.paystackReference = updates.paystackReference;
    p.updatedAt = new Date().toISOString();
    this.getStore().set(reference, p);
    this.persist();
    return p;
  }

  async failPayment(reference: string): Promise<TermPaymentRecord | null> {
    const p = this.getStore().get(reference);
    if (!p) return null;
    p.status = 'failed';
    p.updatedAt = new Date().toISOString();
    this.getStore().set(reference, p);
    this.persist();
    return p;
  }

  async refundOrDispute(reference: string, type: 'refund' | 'dispute'): Promise<TermPaymentRecord | null> {
    const p = this.getStore().get(reference);
    if (!p) return null;
    p.status = type === 'dispute' ? 'disputed' : 'refunded';
    p.updatedAt = new Date().toISOString();
    this.getStore().set(reference, p);
    this.persist();
    return p;
  }

  async delete(reference: string): Promise<boolean> {
    const res = this.getStore().delete(reference);
    if (res) this.persist();
    return res;
  }
}

export class JsonWalletRepository implements IWalletRepository {
  constructor(
    private getTxList: () => WalletTransaction[],
    private getParentStore: () => Map<string, ParentAccount>,
    private persist: () => void
  ) {}

  async createTransaction(tx: WalletTransaction): Promise<WalletTransaction> {
    this.getTxList().unshift(tx);
    this.persist();
    return tx;
  }

  async findByParentId(parentId: string): Promise<WalletTransaction[]> {
    return this.getTxList().filter(t => t.parentId === parentId);
  }

  async findAll(): Promise<WalletTransaction[]> {
    return this.getTxList();
  }

  async getBalance(parentId: string): Promise<number> {
    const parent = this.getParentStore().get(parentId);
    return parent?.walletBalance || 0;
  }

  async credit(parentId: string, amount: number, description: string, channel: string, reference?: string): Promise<{ newBalance: number; transaction: WalletTransaction }> {
    const parent = this.getParentStore().get(parentId);
    if (!parent) throw new Error(`Parent ${parentId} not found`);

    const ref = reference || `CR_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      parentId,
      type: 'credit',
      amount,
      description,
      channel,
      reference: ref,
      date: new Date().toISOString()
    };

    parent.walletBalance = (parent.walletBalance || 0) + amount;
    this.getTxList().unshift(tx);
    this.getParentStore().set(parentId, parent);
    this.persist();
    return { newBalance: parent.walletBalance, transaction: tx };
  }

  async debit(parentId: string, amount: number, description: string): Promise<{ success: boolean; newBalance?: number; transaction?: WalletTransaction; error?: string }> {
    const parent = this.getParentStore().get(parentId);
    if (!parent) return { success: false, error: 'Parent not found' };
    if ((parent.walletBalance || 0) < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const ref = `DB_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      parentId,
      type: 'debit',
      amount,
      description,
      channel: 'Wallet Deduction',
      reference: ref,
      date: new Date().toISOString()
    };

    parent.walletBalance = parent.walletBalance - amount;
    this.getTxList().unshift(tx);
    this.getParentStore().set(parentId, parent);
    this.persist();
    return { success: true, newBalance: parent.walletBalance, transaction: tx };
  }
}

export class JsonCreditLedgerRepository implements ICreditLedgerRepository {
  constructor(
    private getLedgerList: () => CreditLedgerEntry[],
    private persist: () => void
  ) {}

  async createEntry(entry: CreditLedgerEntry): Promise<CreditLedgerEntry> {
    this.getLedgerList().unshift(entry);
    this.persist();
    return entry;
  }

  async findByParentId(parentId: string): Promise<CreditLedgerEntry[]> {
    return this.getLedgerList().filter(l => l.parentId === parentId);
  }

  async findAll(): Promise<CreditLedgerEntry[]> {
    return this.getLedgerList();
  }
}

export class JsonReferralRepository implements IReferralRepository {
  constructor(
    private getStore: () => Map<string, ReferralRecord>,
    private persist: () => void
  ) {}

  async findById(id: string): Promise<ReferralRecord | null> {
    return this.getStore().get(id) || null;
  }

  async findByReferredParentId(referredParentId: string): Promise<ReferralRecord | null> {
    for (const r of this.getStore().values()) {
      if (r.referredParentId === referredParentId) return r;
    }
    return null;
  }

  async findByReferrerParentId(referrerParentId: string): Promise<ReferralRecord[]> {
    return Array.from(this.getStore().values()).filter(r => r.referrerParentId === referrerParentId);
  }

  async findByReferrerAndReferred(referrerParentId: string, referredParentId: string): Promise<ReferralRecord | null> {
    for (const r of this.getStore().values()) {
      if (r.referrerParentId === referrerParentId && r.referredParentId === referredParentId) {
        return r;
      }
    }
    return null;
  }

  async findAll(): Promise<ReferralRecord[]> {
    return Array.from(this.getStore().values());
  }

  async create(referral: ReferralRecord): Promise<ReferralRecord> {
    this.getStore().set(referral.id, referral);
    this.persist();
    return referral;
  }

  async update(id: string, updates: Partial<ReferralRecord>): Promise<ReferralRecord | null> {
    const current = this.getStore().get(id);
    if (!current) return null;
    const updated = { ...current, ...updates };
    this.getStore().set(id, updated);
    this.persist();
    return updated;
  }
}

export class JsonCurriculumRepository implements ICurriculumRepository {
  constructor(
    private getStore: () => Map<string, ServerCurriculumRecord>,
    private persist: () => void
  ) {}

  async findById(id: string): Promise<ServerCurriculumRecord | null> {
    return this.getStore().get(id) || null;
  }

  async findAll(): Promise<ServerCurriculumRecord[]> {
    return Array.from(this.getStore().values());
  }

  async filter(grade?: number, term?: 1 | 2 | 3, week?: number): Promise<ServerCurriculumRecord[]> {
    let records = Array.from(this.getStore().values());
    if (grade !== undefined) records = records.filter(r => r.grade === grade);
    if (term !== undefined) records = records.filter(r => r.term === term);
    if (week !== undefined) records = records.filter(r => r.week === week);
    return records;
  }

  async create(record: ServerCurriculumRecord): Promise<ServerCurriculumRecord> {
    this.getStore().set(record.id, record);
    this.persist();
    return record;
  }

  async update(id: string, updates: Partial<ServerCurriculumRecord>): Promise<ServerCurriculumRecord | null> {
    const current = this.getStore().get(id);
    if (!current) return null;
    const updated = { ...current, ...updates };
    this.getStore().set(id, updated);
    this.persist();
    return updated;
  }

  async count(): Promise<number> {
    return this.getStore().size;
  }
}

export class JsonAuditLogRepository implements IAuditLogRepository {
  constructor(
    private getList: () => AuditLogEntry[],
    private persist: () => void
  ) {}

  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    this.getList().unshift(entry);
    this.persist();
    return entry;
  }

  async findAll(): Promise<AuditLogEntry[]> {
    return this.getList();
  }

  async filter(targetType?: string, targetId?: string): Promise<AuditLogEntry[]> {
    let list = this.getList();
    if (targetType) list = list.filter(l => l.targetType === targetType);
    if (targetId) list = list.filter(l => l.targetId === targetId);
    return list;
  }
}

export class JsonSessionRepository implements ISessionRepository {
  constructor(
    private getStore: () => Map<string, UserSession>,
    private persist: () => void
  ) {}

  async create(session: UserSession): Promise<UserSession> {
    this.getStore().set(session.token, session);
    this.persist();
    return session;
  }

  async findByToken(token: string): Promise<UserSession | null> {
    return this.getStore().get(token) || null;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const res = this.getStore().delete(token);
    if (res) this.persist();
    return res;
  }

  async revokeByUserId(userId: string): Promise<void> {
    for (const [token, s] of this.getStore().entries()) {
      if (s.userId === userId || s.parentId === userId) {
        this.getStore().delete(token);
      }
    }
    this.persist();
  }

  async revokeByStudentId(studentId: string): Promise<void> {
    for (const [token, s] of this.getStore().entries()) {
      if (s.studentId === studentId || s.userId === studentId) {
        this.getStore().delete(token);
      }
    }
    this.persist();
  }

  async cleanExpired(): Promise<number> {
    const now = new Date();
    let cleaned = 0;
    for (const [token, s] of this.getStore().entries()) {
      if (new Date(s.expiresAt) < now) {
        this.getStore().delete(token);
        cleaned++;
      }
    }
    if (cleaned > 0) this.persist();
    return cleaned;
  }
}

export class JsonPasswordResetOtpRepository implements IPasswordResetOtpRepository {
  private otpsStore = new Map<string, PasswordResetOtpRecord>();

  async save(record: PasswordResetOtpRecord): Promise<void> {
    this.otpsStore.set(record.parentId, record);
  }

  async findByParentId(parentId: string): Promise<PasswordResetOtpRecord | null> {
    return this.otpsStore.get(parentId) || null;
  }

  async delete(parentId: string): Promise<boolean> {
    return this.otpsStore.delete(parentId);
  }

  async incrementAttempts(parentId: string): Promise<number> {
    const rec = this.otpsStore.get(parentId);
    if (!rec) return 0;
    rec.attempts = (rec.attempts || 0) + 1;
    this.otpsStore.set(parentId, rec);
    return rec.attempts;
  }
}

export class JsonAdminRepository implements IAdminRepository {
  constructor(
    private getStore: () => Map<string, AdminUser>,
    private persist: () => void
  ) {}

  async findById(id: string): Promise<AdminUser | null> {
    return this.getStore().get(id) || null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const clean = email.toLowerCase().trim();
    for (const a of this.getStore().values()) {
      if (a.email.toLowerCase().trim() === clean) return a;
    }
    return null;
  }

  async findAll(): Promise<AdminUser[]> {
    return Array.from(this.getStore().values());
  }

  async create(admin: AdminUser): Promise<AdminUser> {
    this.getStore().set(admin.id, admin);
    this.persist();
    return admin;
  }

  async updatePassword(id: string, hash: string, salt: string): Promise<boolean> {
    const a = this.getStore().get(id);
    if (!a) return false;
    a.passwordHash = hash;
    a.salt = salt;
    this.getStore().set(id, a);
    this.persist();
    return true;
  }
}

export class JsonPilotRepository implements IPilotRepository {
  constructor(
    private getFeedbackStore: () => Map<string, ParentPilotFeedback>,
    private getIncidentStore: () => Map<string, PilotIncident>,
    private persist: () => void
  ) {}

  async addFeedback(feedback: ParentPilotFeedback): Promise<ParentPilotFeedback> {
    this.getFeedbackStore().set(feedback.id, feedback);
    this.persist();
    return feedback;
  }

  async getFeedbacks(studentIdFilter?: string): Promise<ParentPilotFeedback[]> {
    const list = Array.from(this.getFeedbackStore().values());
    if (studentIdFilter) return list.filter(f => f.studentId === studentIdFilter);
    return list;
  }

  async addIncident(incident: PilotIncident): Promise<PilotIncident> {
    this.getIncidentStore().set(incident.id, incident);
    this.persist();
    return incident;
  }

  async updateIncident(id: string, updates: Partial<PilotIncident>): Promise<PilotIncident | null> {
    const inc = this.getIncidentStore().get(id);
    if (!inc) return null;
    const updated = { ...inc, ...updates };
    this.getIncidentStore().set(id, updated);
    this.persist();
    return updated;
  }

  async getIncidents(): Promise<PilotIncident[]> {
    return Array.from(this.getIncidentStore().values());
  }
}
