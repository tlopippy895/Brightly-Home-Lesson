/**
 * Brightly Home Lesson — PostgreSQL Production/Staging Repository Implementations
 * 
 * Enterprise Relational Data-Access Layer (Stage D Runtime Integration)
 * Executes 100% parameterized SQL queries against the authoritative PostgreSQL instance.
 * Supports ACID transactions, composite uniqueness, and referential integrity.
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
  STANDARD_TUITION_FEES
} from '../../types';
import { ServerCurriculumRecord } from '../../db';
import { PostgresDatabaseAdapter } from '../../db/postgresAdapter';
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
  IPilotRepository
} from '../types';

export class PostgresParentRepository implements IParentRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): ParentAccount {
    return {
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone,
      pin: row.pin,
      passwordHash: row.password_hash || undefined,
      salt: row.salt || undefined,
      walletBalance: parseFloat(row.wallet_balance || '0'),
      referralCode: row.referral_code,
      referredCount: parseInt(row.referred_count || '0', 10),
      referredByCode: row.referred_by_code || undefined,
      referredByParentId: row.referred_by_parent_id || undefined,
      subscriptionPlan: row.subscription_plan || 'none',
      subscriptionExpiry: row.subscription_expiry ? new Date(row.subscription_expiry).toISOString() : new Date().toISOString(),
      subscriptionStatus: row.subscription_status || 'inactive',
      accountType: row.account_type || 'demonstration_account',
      accountStatus: row.account_status || 'active',
      failedPinAttempts: parseInt(row.failed_pin_attempts || '0', 10),
      lockoutUntil: row.lockout_until ? new Date(row.lockout_until).getTime() : 0,
      consentRecorded: Boolean(row.consent_recorded),
      consentDate: row.consent_date ? new Date(row.consent_date).toISOString() : undefined,
      consentNote: row.consent_note || undefined,
      onboardedAt: row.onboarded_at ? new Date(row.onboarded_at).toISOString() : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
    };
  }

  async findById(id: string): Promise<ParentAccount | null> {
    const res = await this.adapter.query(`SELECT * FROM parents WHERE id = $1`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<ParentAccount | null> {
    const res = await this.adapter.query(`SELECT * FROM parents WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByPhone(phone: string): Promise<ParentAccount | null> {
    const res = await this.adapter.query(`SELECT * FROM parents WHERE phone = $1`, [phone.trim()]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByReferralCode(code: string): Promise<ParentAccount | null> {
    const res = await this.adapter.query(`SELECT * FROM parents WHERE UPPER(referral_code) = UPPER($1)`, [code.trim()]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByIdentifier(identifier: string): Promise<ParentAccount | null> {
    const clean = identifier.trim();
    if (!clean) return null;
    const res = await this.adapter.query(
      `SELECT * FROM parents WHERE id = $1 OR LOWER(email) = LOWER($1) OR phone = $1 OR UPPER(referral_code) = UPPER($1) LIMIT 1`,
      [clean]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findAll(): Promise<ParentAccount[]> {
    const res = await this.adapter.query(`SELECT * FROM parents ORDER BY onboarded_at ASC`);
    return res.rows.map(r => this.mapRow(r));
  }

  async create(parent: ParentAccount): Promise<ParentAccount> {
    const query = `
      INSERT INTO parents (
        id, name, email, phone, pin, password_hash, salt, wallet_balance,
        referral_code, referred_count, referred_by_code, referred_by_parent_id,
        subscription_plan, subscription_expiry, subscription_status,
        account_type, account_status, failed_pin_attempts, lockout_until,
        consent_recorded, consent_date, consent_note, onboarded_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        wallet_balance = EXCLUDED.wallet_balance,
        subscription_plan = EXCLUDED.subscription_plan,
        subscription_status = EXCLUDED.subscription_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const params = [
      parent.id,
      parent.name,
      parent.email || null,
      parent.phone,
      parent.pin,
      parent.passwordHash || null,
      parent.salt || null,
      parent.walletBalance || 0,
      parent.referralCode,
      parent.referredCount || 0,
      parent.referredByCode || null,
      parent.referredByParentId || null,
      parent.subscriptionPlan || 'none',
      parent.subscriptionExpiry ? new Date(parent.subscriptionExpiry) : null,
      parent.subscriptionStatus || 'inactive',
      parent.accountType || 'demonstration_account',
      parent.accountStatus || 'active',
      parent.failedPinAttempts || 0,
      parent.lockoutUntil ? new Date(parent.lockoutUntil) : null,
      Boolean(parent.consentRecorded),
      parent.consentDate ? new Date(parent.consentDate) : null,
      parent.consentNote || null,
      parent.onboardedAt ? new Date(parent.onboardedAt) : new Date(),
      new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, updates: Partial<ParentAccount>): Promise<ParentAccount | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };
    const query = `
      UPDATE parents SET
        name = $2,
        email = $3,
        phone = $4,
        pin = $5,
        password_hash = $6,
        salt = $7,
        wallet_balance = $8,
        referral_code = $9,
        referred_count = $10,
        referred_by_code = $11,
        referred_by_parent_id = $12,
        subscription_plan = $13,
        subscription_expiry = $14,
        subscription_status = $15,
        account_type = $16,
        account_status = $17,
        failed_pin_attempts = $18,
        lockout_until = $19,
        consent_recorded = $20,
        consent_date = $21,
        consent_note = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id,
      merged.name,
      merged.email || null,
      merged.phone,
      merged.pin,
      merged.passwordHash || null,
      merged.salt || null,
      merged.walletBalance,
      merged.referralCode,
      merged.referredCount,
      merged.referredByCode || null,
      merged.referredByParentId || null,
      merged.subscriptionPlan,
      merged.subscriptionExpiry ? new Date(merged.subscriptionExpiry) : null,
      merged.subscriptionStatus,
      merged.accountType,
      merged.accountStatus,
      merged.failedPinAttempts,
      merged.lockoutUntil ? new Date(merged.lockoutUntil) : null,
      Boolean(merged.consentRecorded),
      merged.consentDate ? new Date(merged.consentDate) : null,
      merged.consentNote || null
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async setAccountStatus(id: string, status: AccountStatus): Promise<boolean> {
    const res = await this.adapter.query(
      `UPDATE parents SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id;`,
      [status, id]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async updateFailedPinAttempts(id: string, attempts: number, lockoutUntil = 0): Promise<void> {
    const lockDate = lockoutUntil > 0 ? new Date(lockoutUntil) : null;
    await this.adapter.query(
      `UPDATE parents SET failed_pin_attempts = $1, lockout_until = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3;`,
      [attempts, lockDate, id]
    );
  }

  async resetPin(id: string, newPin: string): Promise<boolean> {
    const res = await this.adapter.query(
      `UPDATE parents SET pin = $1, failed_pin_attempts = 0, lockout_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id;`,
      [newPin, id]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async updateWalletBalance(id: string, newBalance: number): Promise<void> {
    await this.adapter.query(
      `UPDATE parents SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
      [newBalance, id]
    );
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.adapter.query(`DELETE FROM parents WHERE id = $1;`, [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }
}

export class PostgresPupilRepository implements IPupilRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): StudentProfile {
    return {
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      username: row.username || undefined,
      loginIdentifier: row.login_identifier || undefined,
      pin: row.pin,
      password: row.pin,
      grade: row.grade as GradeLevel,
      registeredGrade: row.registered_grade as GradeLevel,
      avatarUrl: row.avatar_url || undefined,
      avatarColor: row.avatar_color || '#008751',
      currentTerm: row.current_term || 1,
      currentWeek: row.current_week || 1,
      lessonsCompletedThisWeek: row.lessons_completed_this_week || 0,
      totalLessonsThisWeek: row.total_lessons_this_week || 5,
      topSubject: row.top_subject || 'Mathematics',
      overallScore: row.overall_score || 0,
      scoreChangeText: row.score_change_text || 'Starting fresh',
      activeSubscription: Boolean(row.active_subscription),
      preferredVoiceTone: (row.preferred_voice_tone || 'nigerian_teacher') as VoiceTone,
      schoolName: row.school_name || undefined,
      academicSession: row.academic_session || '2024/2025',
      accountType: row.account_type || 'unused_baseline',
      accountStatus: row.account_status || 'active',
      consentRecorded: Boolean(row.consent_recorded),
      termlyTuition: row.termly_tuition !== undefined && row.termly_tuition !== null 
        ? Number(row.termly_tuition) 
        : (STANDARD_TUITION_FEES[row.grade as GradeLevel] || 15000),
      onboardedAt: row.onboarded_at ? new Date(row.onboarded_at).toISOString() : undefined,
      completedLessons: [] // Populated via join or completedLesson repo
    };
  }

  async findById(id: string): Promise<StudentProfile | null> {
    const pupilRes = await this.adapter.query(`SELECT * FROM pupils WHERE id = $1;`, [id]);
    if (!pupilRes.rows[0]) return null;
    const pupil = this.mapRow(pupilRes.rows[0]);

    // Load completed lessons
    const lessonsRes = await this.adapter.query(
      `SELECT * FROM completed_lessons WHERE pupil_id = $1 ORDER BY completed_at ASC;`,
      [id]
    );
    pupil.completedLessons = lessonsRes.rows.map((l: any) => ({
      topicId: l.topic_id,
      subject: l.subject,
      title: l.title,
      score: l.score,
      badge: l.badge,
      reexplained: Boolean(l.reexplained),
      retestPassed: Boolean(l.retest_passed),
      masteryLevel: l.mastery_level,
      curriculumVersion: l.curriculum_version,
      sourceReference: l.source_reference,
      objectivesMastery: l.objectives_mastery,
      completedAt: new Date(l.completed_at).toISOString()
    }));

    return pupil;
  }

  async findByUsername(username: string): Promise<StudentProfile | null> {
    const clean = username.trim().toLowerCase();
    const res = await this.adapter.query(
      `SELECT * FROM pupils WHERE LOWER(username) = $1 OR LOWER(login_identifier) = $1 LIMIT 1;`,
      [clean]
    );
    if (!res.rows[0]) return null;
    return this.findById(res.rows[0].id);
  }

  async findByParentId(parentId: string): Promise<StudentProfile[]> {
    const res = await this.adapter.query(
      `SELECT * FROM pupils WHERE parent_id = $1 ORDER BY onboarded_at ASC;`,
      [parentId]
    );
    const pupils: StudentProfile[] = [];
    for (const row of res.rows) {
      const full = await this.findById(row.id);
      if (full) pupils.push(full);
    }
    return pupils;
  }

  async findAll(): Promise<StudentProfile[]> {
    const res = await this.adapter.query(`SELECT * FROM pupils ORDER BY onboarded_at ASC;`);
    const pupils: StudentProfile[] = [];
    for (const row of res.rows) {
      const full = await this.findById(row.id);
      if (full) pupils.push(full);
    }
    return pupils;
  }

  async create(pupil: StudentProfile): Promise<StudentProfile> {
    const query = `
      INSERT INTO pupils (
        id, parent_id, name, username, login_identifier, pin, grade, registered_grade,
        avatar_url, avatar_color, current_term, current_week, lessons_completed_this_week,
        total_lessons_this_week, top_subject, overall_score, score_change_text,
        active_subscription, preferred_voice_tone, school_name, academic_session,
        account_type, account_status, consent_recorded, onboarded_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25, $26
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        grade = EXCLUDED.grade,
        current_term = EXCLUDED.current_term,
        current_week = EXCLUDED.current_week,
        overall_score = EXCLUDED.overall_score,
        active_subscription = EXCLUDED.active_subscription,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const params = [
      pupil.id,
      pupil.parentId,
      pupil.name,
      pupil.username || null,
      pupil.loginIdentifier || null,
      pupil.pin || '1234',
      pupil.grade,
      pupil.registeredGrade || pupil.grade,
      pupil.avatarUrl || null,
      pupil.avatarColor || '#008751',
      pupil.currentTerm || 1,
      pupil.currentWeek || 1,
      pupil.lessonsCompletedThisWeek || 0,
      pupil.totalLessonsThisWeek || 5,
      pupil.topSubject || 'Mathematics',
      pupil.overallScore || 0,
      pupil.scoreChangeText || 'Starting fresh',
      Boolean(pupil.activeSubscription),
      pupil.preferredVoiceTone || 'nigerian_teacher',
      pupil.schoolName || null,
      pupil.academicSession || '2024/2025',
      pupil.accountType || 'unused_baseline',
      pupil.accountStatus || 'active',
      Boolean(pupil.consentRecorded),
      pupil.onboardedAt ? new Date(pupil.onboardedAt) : new Date(),
      new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.findById(res.rows[0].id) as Promise<StudentProfile>;
  }

  async update(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };

    const query = `
      UPDATE pupils SET
        name = $2,
        username = $3,
        login_identifier = $4,
        pin = $5,
        grade = $6,
        registered_grade = $7,
        avatar_url = $8,
        avatar_color = $9,
        current_term = $10,
        current_week = $11,
        lessons_completed_this_week = $12,
        total_lessons_this_week = $13,
        top_subject = $14,
        overall_score = $15,
        score_change_text = $16,
        active_subscription = $17,
        preferred_voice_tone = $18,
        school_name = $19,
        academic_session = $20,
        account_type = $21,
        account_status = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id,
      merged.name,
      merged.username || null,
      merged.loginIdentifier || null,
      merged.pin,
      merged.grade,
      merged.registeredGrade,
      merged.avatarUrl || null,
      merged.avatarColor,
      merged.currentTerm,
      merged.currentWeek,
      merged.lessonsCompletedThisWeek,
      merged.totalLessonsThisWeek,
      merged.topSubject,
      merged.overallScore,
      merged.scoreChangeText,
      Boolean(merged.activeSubscription),
      merged.preferredVoiceTone,
      merged.schoolName || null,
      merged.academicSession,
      merged.accountType,
      merged.accountStatus
    ];
    await this.adapter.query(query, params);
    return this.findById(id);
  }

  async setAccountStatus(id: string, status: AccountStatus): Promise<boolean> {
    const res = await this.adapter.query(
      `UPDATE pupils SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id;`,
      [status, id]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async updateGrade(id: string, grade: GradeLevel): Promise<StudentProfile | null> {
    await this.adapter.query(
      `UPDATE pupils SET grade = $1, registered_grade = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
      [grade, id]
    );
    return this.findById(id);
  }

  async updateVoiceTone(id: string, tone: VoiceTone): Promise<StudentProfile | null> {
    await this.adapter.query(
      `UPDATE pupils SET preferred_voice_tone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
      [tone, id]
    );
    return this.findById(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<StudentProfile | null> {
    await this.adapter.query(
      `UPDATE pupils SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
      [avatarUrl, id]
    );
    return this.findById(id);
  }

  async resetPin(id: string, newPin: string): Promise<boolean> {
    const res = await this.adapter.query(
      `UPDATE pupils SET pin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id;`,
      [newPin, id]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.adapter.query(`DELETE FROM pupils WHERE id = $1;`, [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }
}

export class PostgresCompletedLessonRepository implements ICompletedLessonRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): CompletedLessonRecord {
    return {
      id: row.id,
      pupilId: row.pupil_id,
      topicId: row.topic_id,
      subject: row.subject as SubjectName,
      title: row.title,
      score: row.score,
      badge: row.badge || undefined,
      reexplained: Boolean(row.reexplained),
      retestPassed: Boolean(row.retest_passed),
      masteryLevel: row.mastery_level,
      curriculumVersion: row.curriculum_version,
      sourceReference: row.source_reference || undefined,
      objectivesMastery: row.objectives_mastery,
      userAnswers: row.user_answers,
      completedAt: new Date(row.completed_at).toISOString()
    };
  }

  async findByPupilId(pupilId: string): Promise<CompletedLessonRecord[]> {
    const res = await this.adapter.query(
      `SELECT * FROM completed_lessons WHERE pupil_id = $1 ORDER BY completed_at ASC;`,
      [pupilId]
    );
    return res.rows.map(r => this.mapRow(r));
  }

  async findByPupilAndTopic(pupilId: string, topicId: string): Promise<CompletedLessonRecord | null> {
    const res = await this.adapter.query(
      `SELECT * FROM completed_lessons WHERE pupil_id = $1 AND topic_id = $2;`,
      [pupilId, topicId]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async recordCompletion(lesson: CompletedLessonRecord): Promise<CompletedLessonRecord> {
    return this.adapter.withTransaction(async client => {
      const query = `
        INSERT INTO completed_lessons (
          pupil_id, topic_id, subject, title, score, badge, reexplained,
          retest_passed, mastery_level, curriculum_version, source_reference,
          objectives_mastery, user_answers, completed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14
        )
        ON CONFLICT (pupil_id, topic_id) DO UPDATE SET
          score = EXCLUDED.score,
          badge = EXCLUDED.badge,
          reexplained = EXCLUDED.reexplained,
          retest_passed = EXCLUDED.retest_passed,
          mastery_level = EXCLUDED.mastery_level,
          objectives_mastery = EXCLUDED.objectives_mastery,
          user_answers = EXCLUDED.user_answers,
          completed_at = EXCLUDED.completed_at
        RETURNING *;
      `;
      const params = [
        lesson.pupilId,
        lesson.topicId,
        lesson.subject,
        lesson.title,
        lesson.score,
        lesson.badge || null,
        Boolean(lesson.reexplained),
        Boolean(lesson.retestPassed),
        lesson.masteryLevel,
        lesson.curriculumVersion || 'NERDC-BEC-2024-v2.1',
        lesson.sourceReference || null,
        lesson.objectivesMastery ? JSON.stringify(lesson.objectivesMastery) : '[]',
        lesson.userAnswers ? JSON.stringify(lesson.userAnswers) : null,
        lesson.completedAt ? new Date(lesson.completedAt) : new Date()
      ];
      const res = await client.query(query, params);

      // Recalculate and update pupil overall score & lessons count atomically
      await client.query(
        `UPDATE pupils SET
          overall_score = (
            SELECT COALESCE(ROUND(AVG(score)), 0) FROM completed_lessons WHERE pupil_id = $1
          ),
          lessons_completed_this_week = lessons_completed_this_week + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;`,
        [lesson.pupilId]
      );

      return this.mapRow(res.rows[0]);
    });
  }

  async countByPupil(pupilId: string): Promise<number> {
    const res = await this.adapter.query(
      `SELECT COUNT(*)::int as count FROM completed_lessons WHERE pupil_id = $1;`,
      [pupilId]
    );
    return res.rows[0]?.count || 0;
  }

  async countAll(): Promise<number> {
    const res = await this.adapter.query(`SELECT COUNT(*)::int as count FROM completed_lessons;`);
    return res.rows[0]?.count || 0;
  }
}

export class PostgresPaymentRepository implements IPaymentRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): TermPaymentRecord {
    return {
      id: row.id,
      parentId: row.parent_id,
      childId: row.child_id,
      childName: row.child_name,
      grade: row.grade as GradeLevel,
      term: row.term as 1 | 2 | 3,
      amount: parseFloat(row.amount),
      currency: row.currency || 'NGN',
      status: row.status as any,
      channel: row.channel,
      transactionReference: row.transaction_reference,
      paystackReference: row.paystack_reference || undefined,
      receiptNo: row.receipt_no,
      planTitle: row.plan_title,
      planType: row.plan_type as any,
      paymentDate: row.payment_date ? new Date(row.payment_date).toISOString() : undefined,
      accessStartDate: row.access_start_date ? new Date(row.access_start_date).toISOString() : undefined,
      accessEndDate: row.access_end_date ? new Date(row.access_end_date).toISOString() : undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString()
    };
  }

  async findById(id: string): Promise<TermPaymentRecord | null> {
    const res = await this.adapter.query(`SELECT * FROM payments WHERE id = $1;`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByReference(reference: string): Promise<TermPaymentRecord | null> {
    const res = await this.adapter.query(`SELECT * FROM payments WHERE transaction_reference = $1;`, [reference]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByParentId(parentId: string): Promise<TermPaymentRecord[]> {
    const res = await this.adapter.query(
      `SELECT * FROM payments WHERE parent_id = $1 ORDER BY created_at DESC;`,
      [parentId]
    );
    return res.rows.map(r => this.mapRow(r));
  }

  async findByPupilId(pupilId: string): Promise<TermPaymentRecord[]> {
    const res = await this.adapter.query(
      `SELECT * FROM payments WHERE child_id = $1 ORDER BY created_at DESC;`,
      [pupilId]
    );
    return res.rows.map(r => this.mapRow(r));
  }

  async findAll(): Promise<TermPaymentRecord[]> {
    const res = await this.adapter.query(`SELECT * FROM payments ORDER BY created_at DESC;`);
    return res.rows.map(r => this.mapRow(r));
  }

  async create(payment: TermPaymentRecord): Promise<TermPaymentRecord> {
    const query = `
      INSERT INTO payments (
        id, parent_id, child_id, child_name, grade, term, amount, currency,
        status, channel, transaction_reference, paystack_reference, receipt_no,
        plan_title, plan_type, payment_date, access_start_date, access_end_date,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20
      )
      ON CONFLICT (transaction_reference) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const params = [
      payment.id,
      payment.parentId,
      payment.childId,
      payment.childName,
      payment.grade,
      payment.term,
      payment.amount,
      payment.currency || 'NGN',
      payment.status,
      payment.channel,
      payment.transactionReference,
      payment.paystackReference || null,
      payment.receiptNo,
      payment.planTitle,
      payment.planType || null,
      payment.paymentDate ? new Date(payment.paymentDate) : null,
      payment.accessStartDate ? new Date(payment.accessStartDate) : null,
      payment.accessEndDate ? new Date(payment.accessEndDate) : null,
      payment.createdAt ? new Date(payment.createdAt) : new Date(),
      new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async update(reference: string, updates: Partial<TermPaymentRecord>): Promise<TermPaymentRecord | null> {
    const current = await this.findByReference(reference);
    if (!current) return null;
    const merged = { ...current, ...updates };

    const query = `
      UPDATE payments SET
        status = $2,
        amount = $3,
        channel = $4,
        paystack_reference = $5,
        payment_date = $6,
        access_start_date = $7,
        access_end_date = $8,
        plan_title = $9,
        plan_type = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE transaction_reference = $1
      RETURNING *;
    `;
    const params = [
      reference,
      merged.status,
      merged.amount,
      merged.channel,
      merged.paystackReference || null,
      merged.paymentDate ? new Date(merged.paymentDate) : null,
      merged.accessStartDate ? new Date(merged.accessStartDate) : null,
      merged.accessEndDate ? new Date(merged.accessEndDate) : null,
      merged.planTitle,
      merged.planType || null
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async finalizePayment(reference: string, updates: { amount?: number; channel?: string; paystackReference?: string; paidAt?: string }): Promise<TermPaymentRecord | null> {
    const paidAt = updates.paidAt ? new Date(updates.paidAt) : new Date();
    const query = `
      UPDATE payments SET
        status = 'paid',
        amount = COALESCE($2, amount),
        channel = COALESCE($3, channel),
        paystack_reference = COALESCE($4, paystack_reference),
        payment_date = $5,
        access_start_date = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE transaction_reference = $1
      RETURNING *;
    `;
    const params = [
      reference,
      updates.amount || null,
      updates.channel || null,
      updates.paystackReference || null,
      paidAt
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async failPayment(reference: string): Promise<TermPaymentRecord | null> {
    const res = await this.adapter.query(
      `UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE transaction_reference = $1 RETURNING *;`,
      [reference]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async refundOrDispute(reference: string, type: 'refund' | 'dispute'): Promise<TermPaymentRecord | null> {
    const status = type === 'dispute' ? 'disputed' : 'refunded';
    const res = await this.adapter.query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE transaction_reference = $2 RETURNING *;`,
      [status, reference]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async delete(reference: string): Promise<boolean> {
    const res = await this.adapter.query(`DELETE FROM payments WHERE transaction_reference = $1;`, [reference]);
    return res.rowCount !== null && res.rowCount > 0;
  }
}

export class PostgresWalletRepository implements IWalletRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): WalletTransaction {
    return {
      id: row.id,
      parentId: row.parent_id,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      channel: row.channel,
      reference: row.reference,
      date: new Date(row.created_at).toISOString()
    };
  }

  async createTransaction(tx: WalletTransaction): Promise<WalletTransaction> {
    const query = `
      INSERT INTO wallet_transactions (id, parent_id, type, amount, description, channel, reference, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (reference) DO NOTHING
      RETURNING *;
    `;
    const params = [
      tx.id,
      tx.parentId,
      tx.type,
      tx.amount,
      tx.description,
      tx.channel,
      tx.reference,
      tx.date ? new Date(tx.date) : new Date()
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapRow(res.rows[0]) : tx;
  }

  async findByParentId(parentId: string): Promise<WalletTransaction[]> {
    const res = await this.adapter.query(
      `SELECT * FROM wallet_transactions WHERE parent_id = $1 ORDER BY created_at DESC;`,
      [parentId]
    );
    return res.rows.map(r => this.mapRow(r));
  }

  async findAll(): Promise<WalletTransaction[]> {
    const res = await this.adapter.query(`SELECT * FROM wallet_transactions ORDER BY created_at DESC;`);
    return res.rows.map(r => this.mapRow(r));
  }

  async getBalance(parentId: string): Promise<number> {
    const res = await this.adapter.query(`SELECT wallet_balance FROM parents WHERE id = $1;`, [parentId]);
    return res.rows[0] ? parseFloat(res.rows[0].wallet_balance) : 0;
  }

  async credit(parentId: string, amount: number, description: string, channel: string, reference?: string): Promise<{ newBalance: number; transaction: WalletTransaction }> {
    return this.adapter.withTransaction(async client => {
      const ref = reference || `CR_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Update parent balance atomically with row lock
      const parentRes = await client.query(
        `UPDATE parents SET wallet_balance = wallet_balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING wallet_balance;`,
        [amount, parentId]
      );
      if (!parentRes.rows[0]) throw new Error(`Parent ${parentId} not found`);
      const newBalance = parseFloat(parentRes.rows[0].wallet_balance);

      // Insert transaction
      const txRes = await client.query(
        `INSERT INTO wallet_transactions (id, parent_id, type, amount, description, channel, reference, created_at)
         VALUES ($1, $2, 'credit', $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [txId, parentId, amount, description, channel, ref]
      );

      return { newBalance, transaction: this.mapRow(txRes.rows[0]) };
    });
  }

  async debit(parentId: string, amount: number, description: string): Promise<{ success: boolean; newBalance?: number; transaction?: WalletTransaction; error?: string }> {
    return this.adapter.withTransaction(async client => {
      // Check current balance with FOR UPDATE lock
      const checkRes = await client.query(`SELECT wallet_balance FROM parents WHERE id = $1 FOR UPDATE;`, [parentId]);
      if (!checkRes.rows[0]) return { success: false, error: 'Parent not found' };
      const curBalance = parseFloat(checkRes.rows[0].wallet_balance);
      if (curBalance < amount) return { success: false, error: 'Insufficient balance' };

      const ref = `DB_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const parentRes = await client.query(
        `UPDATE parents SET wallet_balance = wallet_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING wallet_balance;`,
        [amount, parentId]
      );
      const newBalance = parseFloat(parentRes.rows[0].wallet_balance);

      const txRes = await client.query(
        `INSERT INTO wallet_transactions (id, parent_id, type, amount, description, channel, reference, created_at)
         VALUES ($1, $2, 'debit', $3, $4, 'Wallet Deduction', $5, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [txId, parentId, amount, description, ref]
      );

      return { success: true, newBalance, transaction: this.mapRow(txRes.rows[0]) };
    });
  }
}

export class PostgresCreditLedgerRepository implements ICreditLedgerRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): CreditLedgerEntry {
    return {
      id: row.id,
      parentId: row.parent_id,
      type: row.type,
      category: row.category,
      amount: parseFloat(row.amount),
      balanceBefore: parseFloat(row.balance_before),
      balanceAfter: parseFloat(row.balance_after),
      reference: row.reference,
      relatedReferralId: row.related_referral_id || undefined,
      relatedPaymentRef: row.related_payment_ref || undefined,
      description: row.description,
      createdAt: new Date(row.created_at).toISOString()
    };
  }

  async createEntry(entry: CreditLedgerEntry): Promise<CreditLedgerEntry> {
    const query = `
      INSERT INTO credit_ledger (
        id, parent_id, type, category, amount, balance_before, balance_after,
        reference, related_referral_id, related_payment_ref, description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const params = [
      entry.id,
      entry.parentId,
      entry.type,
      entry.category,
      entry.amount,
      entry.balanceBefore,
      entry.balanceAfter,
      entry.reference,
      entry.relatedReferralId || null,
      entry.relatedPaymentRef || null,
      entry.description,
      entry.createdAt ? new Date(entry.createdAt) : new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async findByParentId(parentId: string): Promise<CreditLedgerEntry[]> {
    const res = await this.adapter.query(
      `SELECT * FROM credit_ledger WHERE parent_id = $1 ORDER BY created_at DESC;`,
      [parentId]
    );
    return res.rows.map(r => this.mapRow(r));
  }

  async findAll(): Promise<CreditLedgerEntry[]> {
    const res = await this.adapter.query(`SELECT * FROM credit_ledger ORDER BY created_at DESC;`);
    return res.rows.map(r => this.mapRow(r));
  }
}

export class PostgresReferralRepository implements IReferralRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): ReferralRecord {
    return {
      id: row.id,
      referrerParentId: row.referrer_parent_id,
      referrerCode: row.referrer_code,
      referredParentId: row.referred_parent_id,
      referredFamilyMaskedName: row.referred_family_masked_name,
      status: row.status as any,
      rewardAmount: parseFloat(row.reward_amount),
      qualifyingPaymentRef: row.qualifying_payment_ref || undefined,
      registeredAt: new Date(row.registered_at).toISOString(),
      rewardedAt: row.rewarded_at ? new Date(row.rewarded_at).toISOString() : undefined,
      reversedAt: row.reversed_at ? new Date(row.reversed_at).toISOString() : undefined,
      disqualificationReason: row.disqualification_reason || undefined,
      notes: row.notes || undefined
    };
  }

  async findById(id: string): Promise<ReferralRecord | null> {
    const res = await this.adapter.query(`SELECT * FROM referrals WHERE id = $1;`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByReferredParentId(referredParentId: string): Promise<ReferralRecord | null> {
    const res = await this.adapter.query(`SELECT * FROM referrals WHERE referred_parent_id = $1;`, [referredParentId]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByReferrerParentId(referrerParentId: string): Promise<ReferralRecord[]> {
    const res = await this.adapter.query(
      `SELECT * FROM referrals WHERE referrer_parent_id = $1 ORDER BY registered_at DESC;`,
      [referrerParentId]
    );
    return res.rows.map(r => this.mapRow(r));
  }

  async findByReferrerAndReferred(referrerParentId: string, referredParentId: string): Promise<ReferralRecord | null> {
    const res = await this.adapter.query(
      `SELECT * FROM referrals WHERE referrer_parent_id = $1 AND referred_parent_id = $2;`,
      [referrerParentId, referredParentId]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findAll(): Promise<ReferralRecord[]> {
    const res = await this.adapter.query(`SELECT * FROM referrals ORDER BY registered_at DESC;`);
    return res.rows.map(r => this.mapRow(r));
  }

  async create(referral: ReferralRecord): Promise<ReferralRecord> {
    const query = `
      INSERT INTO referrals (
        id, referrer_parent_id, referrer_code, referred_parent_id,
        referred_family_masked_name, status, reward_amount, qualifying_payment_ref,
        registered_at, rewarded_at, reversed_at, disqualification_reason, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        rewarded_at = EXCLUDED.rewarded_at,
        reversed_at = EXCLUDED.reversed_at
      RETURNING *;
    `;
    const params = [
      referral.id,
      referral.referrerParentId,
      referral.referrerCode,
      referral.referredParentId,
      referral.referredFamilyMaskedName,
      referral.status,
      referral.rewardAmount,
      referral.qualifyingPaymentRef || null,
      referral.registeredAt ? new Date(referral.registeredAt) : new Date(),
      referral.rewardedAt ? new Date(referral.rewardedAt) : null,
      referral.reversedAt ? new Date(referral.reversedAt) : null,
      referral.disqualificationReason || null,
      referral.notes || null
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, updates: Partial<ReferralRecord>): Promise<ReferralRecord | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };

    const query = `
      UPDATE referrals SET
        status = $2,
        reward_amount = $3,
        qualifying_payment_ref = $4,
        rewarded_at = $5,
        reversed_at = $6,
        disqualification_reason = $7,
        notes = $8
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id,
      merged.status,
      merged.rewardAmount,
      merged.qualifyingPaymentRef || null,
      merged.rewardedAt ? new Date(merged.rewardedAt) : null,
      merged.reversedAt ? new Date(merged.reversedAt) : null,
      merged.disqualificationReason || null,
      merged.notes || null
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }
}

export class PostgresCurriculumRepository implements ICurriculumRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): ServerCurriculumRecord {
    return {
      id: row.id,
      grade: row.grade as GradeLevel,
      term: row.term as 1 | 2 | 3,
      week: row.week,
      subject: row.subject as SubjectName,
      topic: row.topic,
      subtopic: row.subtopic || row.topic,
      weekType: row.week_type || 'instructional',
      periodTitle: row.period_title || undefined,
      theme: row.theme || null,
      competencies: row.competencies || null,
      contentOutline: row.content_outline || '',
      learningActivities: row.learning_activities || [],
      teachingResources: row.teaching_resources || [],
      isFree: row.week === 1,
      teacherId: 'ibrahim',
      objectives: Array.isArray(row.learning_objectives) ? row.learning_objectives : [],
      lastWeekRevision: 'Review previous week fundamentals.',
      previousKnowledge: 'Everyday observational experience.',
      concreteVisualAids: row.concrete_visual_aids || [],
      whiteboardSteps: row.whiteboard_steps || [],
      practiceProblems: row.practice_questions || [],
      assessmentQuestions: row.assessment_questions || [],
      publishingStatus: row.publishing_status || 'DRAFT',
      curriculumVersion: row.curriculum_version || 'NERDC-BEC-2024-v2.1',
      sourceDocument: row.source_document || undefined,
      sourceReference: row.source_reference || undefined,
      reviewedBy: row.reviewed_by || undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
      approvedBy: row.approved_by || undefined,
      approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : undefined,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      notes: '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
    };
  }

  async findById(id: string): Promise<ServerCurriculumRecord | null> {
    const res = await this.adapter.query(`SELECT * FROM curriculum_records WHERE id = $1;`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findAll(): Promise<ServerCurriculumRecord[]> {
    const res = await this.adapter.query(`SELECT * FROM curriculum_records ORDER BY grade ASC, term ASC, week ASC;`);
    return res.rows.map(r => this.mapRow(r));
  }

  async filter(grade?: number, term?: 1 | 2 | 3, week?: number): Promise<ServerCurriculumRecord[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (grade !== undefined) {
      conditions.push(`grade = $${idx++}`);
      params.push(grade);
    }
    if (term !== undefined) {
      conditions.push(`term = $${idx++}`);
      params.push(term);
    }
    if (week !== undefined) {
      conditions.push(`week = $${idx++}`);
      params.push(week);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await this.adapter.query(`SELECT * FROM curriculum_records ${where} ORDER BY grade ASC, term ASC, week ASC;`, params);
    return res.rows.map(r => this.mapRow(r));
  }

  async create(record: ServerCurriculumRecord): Promise<ServerCurriculumRecord> {
    const query = `
      INSERT INTO curriculum_records (
        id, grade, subject, term, week, week_type, period_title, theme,
        topic, subtopic, learning_objectives, competencies, concrete_visual_aids,
        assessment_questions, practice_questions, whiteboard_steps, publishing_status,
        curriculum_version, source_document, source_reference, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        topic = EXCLUDED.topic,
        subtopic = EXCLUDED.subtopic,
        publishing_status = EXCLUDED.publishing_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const params = [
      record.id,
      record.grade,
      record.subject,
      record.term,
      record.week,
      record.weekType || 'instructional',
      record.periodTitle || null,
      record.theme || null,
      record.topic,
      record.subtopic || null,
      JSON.stringify(record.objectives || []),
      JSON.stringify(record.competencies || []),
      JSON.stringify(record.concreteVisualAids || []),
      JSON.stringify(record.assessmentQuestions || []),
      JSON.stringify(record.practiceProblems || []),
      JSON.stringify(record.whiteboardSteps || []),
      record.publishingStatus || 'DRAFT',
      record.curriculumVersion || 'NERDC-BEC-2024-v2.1',
      record.sourceDocument || null,
      record.sourceReference || null
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, updates: Partial<ServerCurriculumRecord>): Promise<ServerCurriculumRecord | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };

    const query = `
      UPDATE curriculum_records SET
        topic = $2,
        subtopic = $3,
        publishing_status = $4,
        assessment_questions = $5,
        practice_questions = $6,
        whiteboard_steps = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id,
      merged.topic,
      merged.subtopic || null,
      merged.publishingStatus,
      JSON.stringify(merged.assessmentQuestions || []),
      JSON.stringify(merged.practiceProblems || []),
      JSON.stringify(merged.whiteboardSteps || [])
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async count(): Promise<number> {
    const res = await this.adapter.query(`SELECT COUNT(*)::int as count FROM curriculum_records;`);
    return res.rows[0]?.count || 0;
  }
}

export class PostgresAuditLogRepository implements IAuditLogRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): AuditLogEntry {
    return {
      id: row.id,
      adminId: row.admin_id,
      adminEmail: row.admin_email,
      action: row.action as any,
      targetType: row.target_type as any,
      targetId: row.target_id,
      details: row.details,
      previousState: row.previous_state,
      newState: row.new_state,
      ipAddress: row.ip_address || undefined,
      timestamp: new Date(row.timestamp).toISOString()
    };
  }

  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const query = `
      INSERT INTO audit_logs (id, admin_id, admin_email, action, target_type, target_id, details, previous_state, new_state, ip_address, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const params = [
      entry.id,
      entry.adminId,
      entry.adminEmail,
      entry.action,
      entry.targetType,
      entry.targetId,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.previousState ? JSON.stringify(entry.previousState) : null,
      entry.newState ? JSON.stringify(entry.newState) : null,
      entry.ipAddress || null,
      entry.timestamp ? new Date(entry.timestamp) : new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async findAll(): Promise<AuditLogEntry[]> {
    const res = await this.adapter.query(`SELECT * FROM audit_logs ORDER BY timestamp DESC;`);
    return res.rows.map(r => this.mapRow(r));
  }

  async filter(targetType?: string, targetId?: string): Promise<AuditLogEntry[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (targetType) {
      conditions.push(`target_type = $${idx++}`);
      params.push(targetType);
    }
    if (targetId) {
      conditions.push(`target_id = $${idx++}`);
      params.push(targetId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await this.adapter.query(`SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC;`, params);
    return res.rows.map(r => this.mapRow(r));
  }
}

export class PostgresSessionRepository implements ISessionRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): UserSession {
    return {
      token: row.token,
      userId: row.user_id,
      role: row.role as any,
      parentId: row.parent_id || undefined,
      studentId: row.student_id || undefined,
      email: row.email || undefined,
      name: row.name,
      createdAt: new Date(row.created_at).toISOString(),
      expiresAt: new Date(row.expires_at).toISOString()
    };
  }

  async create(session: UserSession): Promise<UserSession> {
    const query = `
      INSERT INTO user_sessions (token, user_id, role, parent_id, student_id, email, name, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at
      RETURNING *;
    `;
    const params = [
      session.token,
      session.userId,
      session.role,
      session.parentId || null,
      session.studentId || null,
      session.email || null,
      session.name,
      session.createdAt ? new Date(session.createdAt) : new Date(),
      new Date(session.expiresAt)
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async findByToken(token: string): Promise<UserSession | null> {
    const res = await this.adapter.query(
      `SELECT * FROM user_sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP;`,
      [token]
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const res = await this.adapter.query(`DELETE FROM user_sessions WHERE token = $1;`, [token]);
    return res.rowCount !== null && res.rowCount > 0;
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.adapter.query(`DELETE FROM user_sessions WHERE user_id = $1 OR parent_id = $1;`, [userId]);
  }

  async revokeByStudentId(studentId: string): Promise<void> {
    await this.adapter.query(`DELETE FROM user_sessions WHERE student_id = $1 OR user_id = $1;`, [studentId]);
  }

  async cleanExpired(): Promise<number> {
    const res = await this.adapter.query(`DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP;`);
    return res.rowCount || 0;
  }
}

export class PostgresPasswordResetOtpRepository implements IPasswordResetOtpRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  async save(record: PasswordResetOtpRecord): Promise<void> {
    const query = `
      INSERT INTO password_reset_otps (parent_id, otp_hash, attempts, expires_at, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (parent_id) DO UPDATE SET
        otp_hash = EXCLUDED.otp_hash,
        attempts = EXCLUDED.attempts,
        expires_at = EXCLUDED.expires_at,
        created_at = CURRENT_TIMESTAMP;
    `;
    const params = [
      record.parentId,
      record.otpHash,
      record.attempts || 0,
      new Date(record.expiresAt)
    ];
    await this.adapter.query(query, params);
  }

  async findByParentId(parentId: string): Promise<PasswordResetOtpRecord | null> {
    const res = await this.adapter.query(
      `SELECT * FROM password_reset_otps WHERE parent_id = $1 AND expires_at > CURRENT_TIMESTAMP;`,
      [parentId]
    );
    if (!res.rows[0]) return null;
    return {
      parentId: res.rows[0].parent_id,
      otpHash: res.rows[0].otp_hash,
      attempts: res.rows[0].attempts,
      expiresAt: new Date(res.rows[0].expires_at).getTime(),
      createdAt: new Date(res.rows[0].created_at).toISOString()
    };
  }

  async delete(parentId: string): Promise<boolean> {
    const res = await this.adapter.query(`DELETE FROM password_reset_otps WHERE parent_id = $1;`, [parentId]);
    return res.rowCount !== null && res.rowCount > 0;
  }

  async incrementAttempts(parentId: string): Promise<number> {
    const res = await this.adapter.query(
      `UPDATE password_reset_otps SET attempts = attempts + 1 WHERE parent_id = $1 RETURNING attempts;`,
      [parentId]
    );
    return res.rows[0]?.attempts || 0;
  }
}

export class PostgresAdminRepository implements IAdminRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapRow(row: any): AdminUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: 'admin',
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: new Date(row.created_at).toISOString()
    };
  }

  async findById(id: string): Promise<AdminUser | null> {
    const res = await this.adapter.query(`SELECT * FROM admins WHERE id = $1;`, [id]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const res = await this.adapter.query(`SELECT * FROM admins WHERE LOWER(email) = LOWER($1);`, [email.trim()]);
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findAll(): Promise<AdminUser[]> {
    const res = await this.adapter.query(`SELECT * FROM admins ORDER BY created_at ASC;`);
    return res.rows.map(r => this.mapRow(r));
  }

  async create(admin: AdminUser): Promise<AdminUser> {
    const query = `
      INSERT INTO admins (id, name, email, role, password_hash, salt, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const params = [
      admin.id,
      admin.name,
      admin.email,
      'admin',
      admin.passwordHash,
      admin.salt,
      admin.createdAt ? new Date(admin.createdAt) : new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapRow(res.rows[0]);
  }

  async updatePassword(id: string, hash: string, salt: string): Promise<boolean> {
    const res = await this.adapter.query(
      `UPDATE admins SET password_hash = $1, salt = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id;`,
      [hash, salt, id]
    );
    return res.rowCount !== null && res.rowCount > 0;
  }
}

export class PostgresPilotRepository implements IPilotRepository {
  constructor(private adapter: PostgresDatabaseAdapter) {}

  private mapFeedback(row: any): ParentPilotFeedback {
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      parentId: row.parent_id,
      parentEmail: row.parent_email,
      topicId: row.topic_id,
      subject: row.subject,
      lessonTitle: row.lesson_title,
      q1EasyToUnderstand: row.q1_easy_to_understand,
      q2ChildEnjoyed: row.q2_child_enjoyed,
      q3TeacherExplainedClearly: row.q3_teacher_explained_clearly,
      q4HelpedSchoolwork: row.q4_helped_schoolwork,
      q5NeededRepeatedExplanation: row.q5_needed_repeated_explanation,
      q6ImprovementSuggestions: row.q6_improvement_suggestions || '',
      submittedAt: new Date(row.submitted_at).toISOString()
    };
  }

  private mapIncident(row: any): PilotIncident {
    return {
      id: row.id,
      severity: row.severity,
      category: row.category,
      title: row.title,
      description: row.description,
      status: row.status,
      reportedBy: row.reported_by,
      reportedAt: new Date(row.reported_at).toISOString(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : undefined
    };
  }

  async addFeedback(feedback: ParentPilotFeedback): Promise<ParentPilotFeedback> {
    const query = `
      INSERT INTO pilot_feedbacks (
        id, student_id, student_name, parent_id, parent_email, topic_id,
        subject, lesson_title, q1_easy_to_understand, q2_child_enjoyed,
        q3_teacher_explained_clearly, q4_helped_schoolwork, q5_needed_repeated_explanation,
        q6_improvement_suggestions, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const params = [
      feedback.id,
      feedback.studentId,
      feedback.studentName,
      feedback.parentId || null,
      feedback.parentEmail || null,
      feedback.topicId,
      feedback.subject,
      feedback.lessonTitle,
      feedback.q1EasyToUnderstand || null,
      feedback.q2ChildEnjoyed || null,
      feedback.q3TeacherExplainedClearly || null,
      feedback.q4HelpedSchoolwork || null,
      feedback.q5NeededRepeatedExplanation || null,
      feedback.q6ImprovementSuggestions || null,
      feedback.submittedAt ? new Date(feedback.submittedAt) : new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapFeedback(res.rows[0]);
  }

  async getFeedbacks(studentIdFilter?: string): Promise<ParentPilotFeedback[]> {
    if (studentIdFilter) {
      const res = await this.adapter.query(
        `SELECT * FROM pilot_feedbacks WHERE student_id = $1 ORDER BY submitted_at DESC;`,
        [studentIdFilter]
      );
      return res.rows.map(r => this.mapFeedback(r));
    }
    const res = await this.adapter.query(`SELECT * FROM pilot_feedbacks ORDER BY submitted_at DESC;`);
    return res.rows.map(r => this.mapFeedback(r));
  }

  async addIncident(incident: PilotIncident): Promise<PilotIncident> {
    const query = `
      INSERT INTO pilot_incidents (id, severity, category, title, description, status, reported_by, reported_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      incident.id,
      incident.severity,
      incident.category,
      incident.title,
      incident.description,
      incident.status || 'OPEN',
      incident.reportedBy,
      incident.reportedAt ? new Date(incident.reportedAt) : new Date()
    ];
    const res = await this.adapter.query(query, params);
    return this.mapIncident(res.rows[0]);
  }

  async updateIncident(id: string, updates: Partial<PilotIncident>): Promise<PilotIncident | null> {
    const current = await this.adapter.query(`SELECT * FROM pilot_incidents WHERE id = $1;`, [id]);
    if (!current.rows[0]) return null;

    const query = `
      UPDATE pilot_incidents SET
        severity = COALESCE($2, severity),
        category = COALESCE($3, category),
        title = COALESCE($4, title),
        description = COALESCE($5, description),
        status = COALESCE($6, status),
        resolved_at = $7
      WHERE id = $1
      RETURNING *;
    `;
    const params = [
      id,
      updates.severity || null,
      updates.category || null,
      updates.title || null,
      updates.description || null,
      updates.status || null,
      updates.resolvedAt ? new Date(updates.resolvedAt) : null
    ];
    const res = await this.adapter.query(query, params);
    return res.rows[0] ? this.mapIncident(res.rows[0]) : null;
  }

  async getIncidents(): Promise<PilotIncident[]> {
    const res = await this.adapter.query(`SELECT * FROM pilot_incidents ORDER BY reported_at DESC;`);
    return res.rows.map(r => this.mapIncident(r));
  }
}
