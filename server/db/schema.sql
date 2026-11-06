-- ============================================================================
-- BRIGHTLY HOME LESSON — DURABLE RELATIONAL DATABASE SCHEMA (POSTGRESQL / CLOUD SQL)
-- Version: 2.1 (Production Durability Migration Blueprint)
-- Classification: AUTHORITATIVE RELATIONAL MIGRATION ASSET
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PARENT ACCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(32) UNIQUE NOT NULL,
    pin VARCHAR(8) NOT NULL,
    password_hash VARCHAR(255),
    salt VARCHAR(64),
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (wallet_balance >= 0),
    referral_code VARCHAR(32) UNIQUE NOT NULL,
    referred_count INT DEFAULT 0 NOT NULL CHECK (referred_count >= 0),
    referred_by_code VARCHAR(32),
    referred_by_parent_id VARCHAR(64) REFERENCES parents(id) ON DELETE SET NULL,
    subscription_plan VARCHAR(32) DEFAULT 'none' NOT NULL,
    subscription_expiry TIMESTAMPTZ,
    subscription_status VARCHAR(32) DEFAULT 'inactive' NOT NULL,
    account_type VARCHAR(64) DEFAULT 'demonstration_account' NOT NULL,
    account_status VARCHAR(32) DEFAULT 'active' NOT NULL,
    failed_pin_attempts INT DEFAULT 0 NOT NULL CHECK (failed_pin_attempts >= 0),
    lockout_until TIMESTAMPTZ,
    consent_recorded BOOLEAN DEFAULT FALSE NOT NULL,
    consent_date TIMESTAMPTZ,
    consent_note TEXT,
    onboarded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
CREATE INDEX IF NOT EXISTS idx_parents_referral_code ON parents(referral_code);
CREATE INDEX IF NOT EXISTS idx_parents_account_status ON parents(account_status);
CREATE INDEX IF NOT EXISTS idx_parents_lockout ON parents(lockout_until);

-- ----------------------------------------------------------------------------
-- 2. PUPIL / STUDENT PROFILES (PROTECTED BY SOFT-DELETE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pupils (
    id VARCHAR(64) PRIMARY KEY,
    parent_id VARCHAR(64) NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(64) UNIQUE,
    login_identifier VARCHAR(64),
    pin VARCHAR(8) DEFAULT '1234' NOT NULL,
    password_hash VARCHAR(255),
    grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 6),
    registered_grade SMALLINT NOT NULL CHECK (registered_grade BETWEEN 1 AND 6),
    avatar_url TEXT,
    avatar_color VARCHAR(32) DEFAULT '#008751',
    current_term SMALLINT DEFAULT 1 CHECK (current_term BETWEEN 1 AND 3),
    current_week SMALLINT DEFAULT 1,
    lessons_completed_this_week INT DEFAULT 0 CHECK (lessons_completed_this_week >= 0),
    total_lessons_this_week INT DEFAULT 0 CHECK (total_lessons_this_week >= 0),
    top_subject VARCHAR(64) DEFAULT 'Mathematics',
    overall_score SMALLINT DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
    score_change_text VARCHAR(64) DEFAULT 'Starting fresh',
    active_subscription BOOLEAN DEFAULT FALSE NOT NULL,
    preferred_voice_tone VARCHAR(32) DEFAULT 'nigerian_teacher',
    school_name VARCHAR(255),
    academic_session VARCHAR(32) DEFAULT '2024/2025',
    account_type VARCHAR(64) DEFAULT 'unused_baseline' NOT NULL,
    account_status VARCHAR(32) DEFAULT 'active' NOT NULL,
    consent_recorded BOOLEAN DEFAULT FALSE NOT NULL,
    onboarded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pupils_parent_id ON pupils(parent_id);
CREATE INDEX IF NOT EXISTS idx_pupils_username ON pupils(username);
CREATE INDEX IF NOT EXISTS idx_pupils_grade ON pupils(grade);
CREATE INDEX IF NOT EXISTS idx_pupils_account_status ON pupils(account_status);

-- ----------------------------------------------------------------------------
-- 3. COMPLETED LESSONS & MASTERY RECORDS (PERMANENT EDUCATIONAL HISTORY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS completed_lessons (
    id BIGSERIAL PRIMARY KEY,
    pupil_id VARCHAR(64) NOT NULL REFERENCES pupils(id) ON DELETE RESTRICT,
    topic_id VARCHAR(128) NOT NULL,
    subject VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
    badge VARCHAR(64),
    reexplained BOOLEAN DEFAULT FALSE NOT NULL,
    retest_passed BOOLEAN DEFAULT FALSE,
    mastery_level VARCHAR(64) NOT NULL,
    curriculum_version VARCHAR(64) DEFAULT 'NERDC-BEC-2024-v2.1' NOT NULL,
    source_reference VARCHAR(128),
    objectives_mastery JSONB DEFAULT '[]'::jsonb,
    user_answers JSONB,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_pupil_topic UNIQUE (pupil_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_completed_lessons_pupil ON completed_lessons(pupil_id);
CREATE INDEX IF NOT EXISTS idx_completed_lessons_topic ON completed_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_completed_lessons_subject ON completed_lessons(subject);
CREATE INDEX IF NOT EXISTS idx_completed_lessons_mastery ON completed_lessons(mastery_level);

-- ----------------------------------------------------------------------------
-- 4. VERIFIED PAYMENTS & TUITION TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    parent_id VARCHAR(64) NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
    child_id VARCHAR(64) NOT NULL REFERENCES pupils(id) ON DELETE RESTRICT,
    child_name VARCHAR(255) NOT NULL,
    grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 6),
    term SMALLINT NOT NULL CHECK (term BETWEEN 1 AND 3),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(8) DEFAULT 'NGN' NOT NULL,
    status VARCHAR(32) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    transaction_reference VARCHAR(128) UNIQUE NOT NULL,
    paystack_reference VARCHAR(128),
    receipt_no VARCHAR(64) UNIQUE NOT NULL,
    plan_title VARCHAR(128) NOT NULL,
    plan_type VARCHAR(32),
    payment_date TIMESTAMPTZ,
    access_start_date TIMESTAMPTZ,
    access_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_parent_id ON payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_payments_child_id ON payments(child_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- ----------------------------------------------------------------------------
-- 4B. HISTORICAL ORPHANED PAYMENTS ARCHIVE (STAGE E OPTION A)
-- Strictly preserves 514 historical test fixtures without creating false customer accounts
-- Does NOT grant subscription entitlements, lesson access, or wallet credits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS archived_payments (
    id VARCHAR(64) PRIMARY KEY,
    transaction_reference VARCHAR(128) UNIQUE,
    original_payment_id VARCHAR(64),
    parent_id VARCHAR(64),
    child_id VARCHAR(64),
    child_name VARCHAR(255),
    grade SMALLINT,
    term SMALLINT,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'NGN' NOT NULL,
    status VARCHAR(32) NOT NULL,
    channel VARCHAR(64),
    plan_title VARCHAR(255),
    plan_type VARCHAR(64),
    payment_date TIMESTAMPTZ,
    archival_reason VARCHAR(255) DEFAULT 'HISTORICAL_ORPHANED_TEST_FIXTURE' NOT NULL,
    archival_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source_reference VARCHAR(255) DEFAULT '.data/brightly_db.json' NOT NULL,
    raw_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_archived_payments_parent_id ON archived_payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_archived_payments_tx_ref ON archived_payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_archived_payments_archival_date ON archived_payments(archival_date);

-- ----------------------------------------------------------------------------
-- 5. WALLET TOP-UPS & LEDGER TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(64) PRIMARY KEY,
    parent_id VARCHAR(64) NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
    type VARCHAR(16) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    channel VARCHAR(64) NOT NULL,
    reference VARCHAR(128) UNIQUE NOT NULL,
    category VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_parent ON wallet_transactions(parent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref ON wallet_transactions(reference);

-- ----------------------------------------------------------------------------
-- 6. REFERRAL PROGRAMME INVITATIONS & REWARDS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
    id VARCHAR(64) PRIMARY KEY,
    referrer_parent_id VARCHAR(64) NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
    referrer_code VARCHAR(32) NOT NULL,
    referred_parent_id VARCHAR(64) UNIQUE NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
    referred_family_masked_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    reward_amount NUMERIC(12, 2) DEFAULT 2500.00 NOT NULL CHECK (reward_amount >= 0),
    qualifying_payment_ref VARCHAR(128),
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rewarded_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ,
    disqualification_reason TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_parent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_parent_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ----------------------------------------------------------------------------
-- 7. AUDITABLE CREDIT LEDGER (NON-WITHDRAWABLE SUBSCRIPTION CREDIT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_ledger (
    id VARCHAR(64) PRIMARY KEY,
    parent_id VARCHAR(64) NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
    type VARCHAR(16) NOT NULL CHECK (type IN ('credit', 'debit')),
    category VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference VARCHAR(128) NOT NULL,
    related_referral_id VARCHAR(64),
    related_payment_ref VARCHAR(128),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_parent ON credit_ledger(parent_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_ref ON credit_ledger(reference);

-- ----------------------------------------------------------------------------
-- 8. AUTHORITATIVE CURRICULUM RECORDS (PRIMARY 1–6)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curriculum_records (
    id VARCHAR(128) PRIMARY KEY,
    grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 6),
    subject VARCHAR(64) NOT NULL,
    term SMALLINT NOT NULL CHECK (term BETWEEN 1 AND 3),
    week SMALLINT NOT NULL,
    week_type VARCHAR(32) DEFAULT 'instructional',
    period_title VARCHAR(255),
    theme VARCHAR(255),
    topic TEXT NOT NULL,
    subtopic TEXT,
    learning_objectives JSONB DEFAULT '[]'::jsonb NOT NULL,
    competencies JSONB DEFAULT '[]'::jsonb,
    concrete_visual_aids JSONB DEFAULT '[]'::jsonb,
    assessment_questions JSONB DEFAULT '[]'::jsonb,
    practice_questions JSONB DEFAULT '[]'::jsonb,
    whiteboard_steps JSONB DEFAULT '[]'::jsonb,
    publishing_status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
    curriculum_version VARCHAR(64) DEFAULT 'NERDC-BEC-2024-v2.1' NOT NULL,
    source_document VARCHAR(255),
    source_reference VARCHAR(128),
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_curriculum_lookup ON curriculum_records(grade, subject, term, week);
CREATE INDEX IF NOT EXISTS idx_curriculum_status ON curriculum_records(publishing_status);
CREATE INDEX IF NOT EXISTS idx_curriculum_version ON curriculum_records(curriculum_version);

-- ----------------------------------------------------------------------------
-- 9. SECURITY & ADMINISTRATIVE AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    details JSONB,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(64),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- ----------------------------------------------------------------------------
-- 10. SYSTEM SESSIONS (STATEFUL AUTHENTICATION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL,
    parent_id VARCHAR(64),
    student_id VARCHAR(64),
    email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- ----------------------------------------------------------------------------
-- 11. ADMINISTRATOR ACCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) DEFAULT 'admin' NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ----------------------------------------------------------------------------
-- 12. PASSWORD RESET OTPS (DURABLE MULTI-INSTANCE VERIFICATION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_otps (
    parent_id VARCHAR(64) PRIMARY KEY REFERENCES parents(id) ON DELETE CASCADE,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INT DEFAULT 0 NOT NULL CHECK (attempts >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otps_expiry ON password_reset_otps(expires_at);

-- ----------------------------------------------------------------------------
-- 13. PILOT PARENT FEEDBACK
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pilot_feedbacks (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(64),
    parent_email VARCHAR(255),
    topic_id VARCHAR(128) NOT NULL,
    subject VARCHAR(64) NOT NULL,
    lesson_title VARCHAR(255) NOT NULL,
    q1_easy_to_understand VARCHAR(64),
    q2_child_enjoyed VARCHAR(64),
    q3_teacher_explained_clearly VARCHAR(64),
    q4_helped_schoolwork VARCHAR(64),
    q5_needed_repeated_explanation VARCHAR(64),
    q6_improvement_suggestions TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_student ON pilot_feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_topic ON pilot_feedbacks(topic_id);

-- ----------------------------------------------------------------------------
-- 14. OPERATIONAL INCIDENTS (PILOT OPERATIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pilot_incidents (
    id VARCHAR(64) PRIMARY KEY,
    severity VARCHAR(32) NOT NULL,
    category VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'OPEN' NOT NULL,
    reported_by VARCHAR(255) NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON pilot_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON pilot_incidents(severity);

