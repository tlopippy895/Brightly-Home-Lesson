-- ============================================================================
-- BRIGHTLY HOME LESSON MIGRATION ROLLBACK SCRIPT
-- ============================================================================
BEGIN;

TRUNCATE TABLE completed_lessons CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE archived_payments CASCADE;
TRUNCATE TABLE wallet_transactions CASCADE;
TRUNCATE TABLE credit_ledger CASCADE;
TRUNCATE TABLE referrals CASCADE;
TRUNCATE TABLE pupils CASCADE;
TRUNCATE TABLE parents CASCADE;
TRUNCATE TABLE curriculum_records CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE user_sessions CASCADE;

COMMIT;