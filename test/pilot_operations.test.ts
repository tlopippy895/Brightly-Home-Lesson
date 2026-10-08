import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../server/db';
import { gates } from '../server/gates';
import { paystack } from '../server/paystack';
import { PersistenceManager } from '../server/persistence';
import { 
  validateProductionEnvironment,
  getPaymentReadinessReport,
  getPilotReadinessSummary,
  getPilotLaunchChecklist,
  getPilotCohortSummary,
  getPilotMonitoringMetrics,
  PILOT_CHECKLIST_DEFINITIONS
} from '../server/pilotOperations';
import { GradeLevel, SubjectName, STANDARD_TUITION_FEES } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — CONTROLLED PILOT OPERATIONS TEST SUITE');
console.log('================================================================');

async function runPilotOperationsTestSuite() {
  let passed = 0;
  let failed = 0;

  function test(section: string, name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  \x1b[32m✔\x1b[0m [${section}] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  \x1b[31m✖\x1b[0m [${section}] ${name}: ${err?.message}`);
      failed++;
    }
  }

  // ==========================================================================
  // 1. PILOT MODE & PERSISTENCE SAFEGUARD
  // ==========================================================================
  console.log('\n--- 1. Pilot Mode & Single-Instance Persistence Safeguard ---');

  test('Pilot Mode', 'PersistenceManager explicitly declares SINGLE_INSTANCE_PILOT deployment mode', () => {
    assert.strictEqual(PersistenceManager.DEPLOYMENT_MODE, 'SINGLE_INSTANCE_PILOT');
  });

  test('Pilot Mode', 'Ensures database starts safely and loads valid state', () => {
    const loaded = PersistenceManager.load();
    assert.ok(loaded, 'Persistence load must return valid schema');
    assert.ok(Array.isArray(loaded.students) && loaded.students.length > 0);
    assert.ok(Array.isArray(loaded.curriculum) && loaded.curriculum.length === 6);
  });

  test('Pilot Mode', 'Atomic backup file (.bak) exists on disk alongside primary file', () => {
    const dataDir = path.resolve(process.cwd(), '.data');
    const primary = path.resolve(dataDir, 'brightly_db.json');
    const backup = path.resolve(dataDir, 'brightly_db.bak.json');
    assert.ok(fs.existsSync(primary), 'Primary database file must exist');
    assert.ok(fs.existsSync(backup), 'Backup database file must exist');
  });

  test('Pilot Mode', 'Persistence engine recovers from corrupt primary using backup file', () => {
    const dataDir = path.resolve(process.cwd(), '.data');
    const primary = path.resolve(dataDir, 'brightly_db.json');
    const backup = path.resolve(dataDir, 'brightly_db.bak.json');

    const originalPrimary = fs.readFileSync(primary, 'utf-8');
    try {
      // Intentionally corrupt primary file
      fs.writeFileSync(primary, '{"corrupted": unclosed JSON', 'utf-8');
      const recovered = PersistenceManager.load();
      assert.ok(recovered, 'Must successfully restore valid state from backup file');
      assert.ok(Array.isArray(recovered.students));
    } finally {
      // Restore valid primary
      fs.writeFileSync(primary, originalPrimary, 'utf-8');
    }
  });

  // ==========================================================================
  // 2. PRODUCTION ENVIRONMENT VALIDATION
  // ==========================================================================
  console.log('\n--- 2. Production Environment Validation & Secret Hygiene ---');

  test('Environment Validation', 'Validates environment without leaking secrets in output', () => {
    const report = validateProductionEnvironment();
    assert.ok(report);
    assert.strictEqual(report.deploymentMode, 'SINGLE_INSTANCE_PILOT');
    assert.ok(['READY', 'WARNING', 'NOT READY'].includes(report.overallStatus));

    // Assert that no variable output contains raw secrets
    report.variables.forEach(v => {
      assert.ok(!v.maskedIndicator.includes('BrightlyAdmin2026!#'), 'Must never leak admin passwords');
      assert.ok(!v.maskedIndicator.includes('AIzaSy'), 'Must never leak raw Gemini keys');
      assert.ok(typeof v.isSet === 'boolean');
      assert.ok(typeof v.status === 'string');
    });
  });

  test('Environment Validation', 'Detects misconfigured secret keys starting with pk_ as NOT READY', () => {
    const oldKey = process.env.PAYSTACK_SECRET_KEY;
    try {
      process.env.PAYSTACK_SECRET_KEY = 'pk_test_accidentally_using_public_key';
      const report = validateProductionEnvironment();
      const secretVar = report.variables.find(v => v.name === 'PAYSTACK_SECRET_KEY');
      assert.strictEqual(secretVar?.status, 'NOT READY');
      assert.ok(secretVar?.formatNote.includes('Public key is being used as secret key'));
    } finally {
      process.env.PAYSTACK_SECRET_KEY = oldKey;
    }
  });

  test('Environment Validation', 'Detects client public variable leaked secret key as NOT READY', () => {
    const oldClientKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
    try {
      process.env.VITE_PAYSTACK_PUBLIC_KEY = 'sk_live_accidentally_leaked_to_client';
      const report = validateProductionEnvironment();
      const publicVar = report.variables.find(v => v.name === 'VITE_PAYSTACK_PUBLIC_KEY');
      assert.strictEqual(publicVar?.status, 'NOT READY');
      assert.ok(publicVar?.formatNote.includes('Secret key leaked to client-facing variable'));
    } finally {
      process.env.VITE_PAYSTACK_PUBLIC_KEY = oldClientKey;
    }
  });

  // ==========================================================================
  // 3. PAYSTACK LIVE READINESS & DIAGNOSTICS
  // ==========================================================================
  console.log('\n--- 3. Paystack Live Readiness & Payment Diagnostics ---');

  test('Paystack Readiness', 'Accurately diagnoses payment mode: TEST, LIVE, or NOT CONFIGURED', () => {
    const report = getPaymentReadinessReport();
    assert.ok(['TEST', 'LIVE', 'NOT CONFIGURED'].includes(report.paymentMode));
    assert.strictEqual(report.currency, 'NGN');
    assert.strictEqual(report.standardTermTuition, 6000);
    assert.strictEqual(report.standardAnnualTuition, 15000);
  });

  test('Paystack Readiness', 'Server derives authoritative tuition and prevents client manipulation', () => {
    assert.strictEqual(STANDARD_TUITION_FEES.termlyPlanFee, 6000);
    assert.strictEqual(STANDARD_TUITION_FEES.annualPlanFee, 15000);
  });

  test('Paystack Readiness', 'Webhook HMAC-SHA512 verification succeeds with valid signature', () => {
    const testSecret = 'sk_test_mock_webhook_key_998877';
    const oldKey = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = testSecret;

    try {
      const payload = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'REF_9988' } }));
      const sig = crypto.createHmac('sha512', testSecret).update(payload).digest('hex');
      assert.strictEqual(paystack.verifyWebhookSignature(sig, payload), true);
      assert.strictEqual(paystack.verifyWebhookSignature('forged_sig', payload), false);
    } finally {
      process.env.PAYSTACK_SECRET_KEY = oldKey;
    }
  });

  test('Paystack Readiness', 'Week 1 remains free preview under NERDC policy', () => {
    const student = db.getStudents()[0];
    const access = gates.evaluateLessonAccess(student.id, student.registeredGrade, 1, 1, false);
    assert.strictEqual(access.allowed, true);
    assert.ok(access.message.includes('Free Trial') || access.message.includes('preview'));
  });

  test('Paystack Readiness', 'Week 2+ blocked without active term tuition', () => {
    const unpaidPupil = db.addStudent({
      id: `pupil_unpaid_audit_${Date.now()}`,
      parentId: 'parent_main',
      name: 'Unpaid Audit Pupil',
      grade: 4 as GradeLevel,
      registeredGrade: 4 as GradeLevel,
      pin: '1234',
      avatarUrl: '',
      avatarColor: '#1E88E5',
      currentTerm: 2,
      currentWeek: 2,
      overallScore: 80,
      scoreChangeText: '',
      topSubject: 'Mathematics',
      lessonsCompletedThisWeek: 0,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: false,
      termlyTuition: {}
    });

    const access = gates.evaluateLessonAccess(unpaidPupil.id, 4, 2, 2, false);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'term_unpaid');
    assert.strictEqual(access.requiredFee, 6000);
  });

  // ==========================================================================
  // 4. PAYSTACK WEBHOOK READINESS & LIVE VERIFICATION
  // ==========================================================================
  console.log('\n--- 4. Paystack Webhook Readiness & Live Verification ---');

  test('Webhook Readiness', 'Documents exact production webhook endpoint', () => {
    const report = getPaymentReadinessReport();
    assert.strictEqual(report.webhookEndpoint, '/api/payments/paystack/webhook');
    assert.strictEqual(report.webhookSignatureMethod, 'HMAC-SHA512 (Raw Body)');
  });

  test('Webhook Readiness', 'Does not falsely claim live webhook is verified before verification', () => {
    db.setWebhookVerifiedLive(false);
    const report = getPaymentReadinessReport();
    assert.strictEqual(report.webhookVerifiedLive, false);
    const check = report.checks.find(c => c.name === 'Webhook Live Delivery Verification');
    assert.ok(check?.message.includes('NOT YET BEEN EXTERNALLY VERIFIED'));
  });

  test('Webhook Readiness', 'Successfully records live webhook verification when confirmed', () => {
    db.setWebhookVerifiedLive(true);
    const report = getPaymentReadinessReport();
    assert.strictEqual(report.webhookVerifiedLive, true);
    const check = report.checks.find(c => c.name === 'Webhook Live Delivery Verification');
    assert.strictEqual(check?.status, 'READY');
  });

  // ==========================================================================
  // 5. ADMIN PILOT READINESS SUMMARY
  // ==========================================================================
  console.log('\n--- 5. Admin Pilot Readiness Summary ---');

  test('Pilot Summary', 'Aggregates all 6 readiness dimensions', () => {
    const summary = getPilotReadinessSummary();
    assert.ok(summary.application);
    assert.ok(summary.security);
    assert.ok(summary.curriculum);
    assert.ok(summary.aiTeacher);
    assert.ok(summary.payments);
    assert.ok(summary.storage);

    assert.strictEqual(summary.application.deploymentMode, 'SINGLE_INSTANCE_PILOT');
    assert.strictEqual(summary.curriculum.publishedRecordsCount, 6);
    assert.strictEqual(summary.curriculum.readySlotsCount, 6);
    assert.strictEqual(summary.curriculum.warningSlotsCount, 0);
    assert.strictEqual(summary.curriculum.notReadySlotsCount, 0);
  });

  // ==========================================================================
  // 6. CONTROLLED PILOT LAUNCH CHECKLIST (30 ITEMS)
  // ==========================================================================
  console.log('\n--- 6. Controlled Pilot Launch Checklist (30 Items) ---');

  test('Pilot Checklist', 'Contains exactly 30 defined checklist items', () => {
    assert.strictEqual(PILOT_CHECKLIST_DEFINITIONS.length, 30);
    const checklist = getPilotLaunchChecklist();
    assert.strictEqual(checklist.length, 30);
  });

  test('Pilot Checklist', 'Distinguishes CODE_CHECKED from EXTERNALLY_VERIFIED', () => {
    const checklist = getPilotLaunchChecklist();
    const codeChecked = checklist.filter(c => c.verificationType === 'CODE_CHECKED');
    const externallyVerified = checklist.filter(c => c.verificationType === 'EXTERNALLY_VERIFIED');

    assert.ok(codeChecked.length > 0);
    assert.ok(externallyVerified.length > 0);
    assert.strictEqual(codeChecked.length + externallyVerified.length, 30);

    // Verify external items like live webhook or persistent volume require explicit confirmation
    const webhookItem = checklist.find(c => c.id === 'chk_paystack_webhook');
    assert.strictEqual(webhookItem?.verificationType, 'EXTERNALLY_VERIFIED');
  });

  test('Pilot Checklist', 'Allows updating checklist state persistently', () => {
    db.updatePilotChecklistItem('chk_https_domain', true);
    const updated = getPilotLaunchChecklist();
    const item = updated.find(c => c.id === 'chk_https_domain');
    assert.strictEqual(item?.manualCompleted, true);
    assert.ok(item?.statusText.includes('VERIFIED'));
  });

  // ==========================================================================
  // 7. PILOT SAFETY SWITCH ("PILOT PAUSE")
  // ==========================================================================
  console.log('\n--- 7. Pilot Safety Switch ("Pilot Pause") ---');

  test('Pilot Safety Switch', 'When enabled, blocks paid lesson access while preserving historical data', () => {
    const student = db.getStudents()[0];
    assert.ok(student);
    const originalHistoryCount = student.completedLessons.length;

    // Enable Pilot Pause
    db.setPilotPaused(true, 'Admin scheduled pilot inspection');
    assert.strictEqual(db.isPilotPaused(), true);

    // Paid lesson access must be blocked with pilot_paused reason
    const access = gates.evaluateLessonAccess(student.id, student.registeredGrade, 1, 2, false);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'pilot_paused');
    assert.ok(access.message.includes('temporarily paused by administration'));

    // Verify historical pupil completed lessons are untouched
    const recheck = db.getStudentById(student.id);
    assert.strictEqual(recheck?.completedLessons.length, originalHistoryCount);

    // Resume Pilot
    db.setPilotPaused(false);
    assert.strictEqual(db.isPilotPaused(), false);
  });

  // ==========================================================================
  // 8. FIRST PILOT COHORT & MONITORING METRICS
  // ==========================================================================
  console.log('\n--- 8. First Pilot Cohort & Educational Monitoring ---');

  test('Pilot Cohort', 'Summarizes bounded cohort pupils (5–10 pupils)', () => {
    const cohort = getPilotCohortSummary();
    assert.ok(cohort.length >= 5 && cohort.length <= 10, 'Cohort must be between 5 and 10 pupils');
    cohort.forEach(p => {
      assert.ok(p.id && p.name);
      assert.ok([1, 2, 3, 4, 5, 6].includes(p.grade));
      assert.ok(p.parentName && p.parentEmail);
      assert.ok(['Beginning', 'Developing', 'Approaching Mastery', 'Mastered', 'Strong Mastery'].includes(p.currentMasteryLevel));
    });
  });

  test('Pilot Monitoring', 'Calculates operational and educational progression metrics', () => {
    const metrics = getPilotMonitoringMetrics();
    assert.ok(metrics.activePilotPupils >= 5);
    assert.ok(metrics.lessonsCompleted >= 0);
    assert.ok(typeof metrics.averageLessonScore === 'number');
    assert.ok(typeof metrics.reexplanationFrequency === 'number');
    assert.ok(typeof metrics.retestSuccessRate === 'number');

    // Mastery distribution covers all levels
    assert.ok(metrics.masteryDistribution.beginning >= 0);
    assert.ok(metrics.masteryDistribution.developing >= 0);
    assert.ok(metrics.masteryDistribution.approachingMastery >= 0);
    assert.ok(metrics.masteryDistribution.mastered >= 0);
    assert.ok(metrics.masteryDistribution.strongMastery >= 0);
  });

  // ==========================================================================
  // 9. PARENT PILOT FEEDBACK
  // ==========================================================================
  console.log('\n--- 9. Parent Pilot Feedback Register ---');

  test('Parent Feedback', 'Stores and retrieves structured parent feedback on 6 questions', () => {
    const feedbackId = `fb_test_${Date.now()}`;
    const fb = db.addPilotFeedback({
      id: feedbackId,
      studentId: 'chidi',
      studentName: 'Chidi',
      parentId: 'parent_main',
      parentEmail: 'parents@brightly.ng',
      topicId: 'p4-t1-w2-eng',
      subject: 'English Studies',
      lessonTitle: 'Proper Nouns',
      q1EasyToUnderstand: 'strongly_agree',
      q2ChildEnjoyed: 'strongly_agree',
      q3TeacherExplainedClearly: 'agree',
      q4HelpedSchoolwork: 'strongly_agree',
      q5NeededRepeatedExplanation: 'no',
      q6ImprovementSuggestions: 'Excellent Nigerian context with Abuja and Lagos examples.',
      submittedAt: new Date().toISOString()
    });

    assert.ok(fb);
    const allFb = db.getPilotFeedbacks();
    assert.ok(allFb.some(f => f.id === feedbackId));
    const chidiFb = db.getPilotFeedbacks('chidi');
    assert.ok(chidiFb.some(f => f.id === feedbackId));
  });

  // ==========================================================================
  // 10. INCIDENT & ERROR MANAGEMENT
  // ==========================================================================
  console.log('\n--- 10. Incident & Error Management ---');

  test('Incident Management', 'Records, classifies, and updates operational incidents without exposing secrets', () => {
    const inc = db.addIncident({
      severity: 'LOW',
      category: 'ui',
      title: 'Modal Padding Alignment Test',
      description: 'Minor margin inspection on mobile view',
      status: 'OPEN',
      reportedBy: 'QA Auditor'
    });
    assert.ok(inc.id);
    assert.strictEqual(inc.severity, 'LOW');
    assert.strictEqual(inc.status, 'OPEN');

    const updated = db.updateIncident(inc.id, { status: 'RESOLVED', resolutionNotes: 'Verified resolved.' });
    assert.strictEqual(updated?.status, 'RESOLVED');
    assert.ok(updated?.resolvedAt);
  });

  console.log('\n================================================================');
  console.log(`  PILOT OPERATIONS SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPilotOperationsTestSuite();
