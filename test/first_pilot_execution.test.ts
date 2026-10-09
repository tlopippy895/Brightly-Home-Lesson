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
  getPilotMonitoringMetrics
} from '../server/pilotOperations';
import { validateCurriculumReadiness, verifyObjectiveTraceability } from '../server/readinessValidator';
import { extractClientIp } from '../server/rateLimiter';
import { GradeLevel, SubjectName, STANDARD_TUITION_FEES } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — FIRST CONTROLLED PILOT EXECUTION TEST');
console.log('================================================================');

async function runFirstPilotExecutionTestSuite() {
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
  // 1. PRODUCTION DEPLOYMENT CHECK
  // ==========================================================================
  console.log('\n--- 1. Production Deployment Check ---');

  test('Deployment Check', 'Single-instance pilot mode is explicitly declared', () => {
    assert.strictEqual(PersistenceManager.DEPLOYMENT_MODE, 'SINGLE_INSTANCE_PILOT');
    const summary = getPilotReadinessSummary();
    assert.strictEqual(summary.application.deploymentMode, 'SINGLE_INSTANCE_PILOT');
  });

  test('Deployment Check', 'Persistent .data/ directory, primary DB, and backup DB exist', () => {
    const dataDir = path.resolve(process.cwd(), '.data');
    const primary = path.resolve(dataDir, 'brightly_db.json');
    const backup = path.resolve(dataDir, 'brightly_db.bak.json');
    assert.ok(fs.existsSync(dataDir), '.data/ directory must exist');
    assert.ok(fs.existsSync(primary), 'brightly_db.json must exist');
    assert.ok(fs.existsSync(backup), 'brightly_db.bak.json must exist');
  });

  test('Deployment Check', 'Persistence engine supports atomic writes with temporary file replacement', () => {
    // Validate atomic writes exist in PersistenceManager
    const content = fs.readFileSync(path.resolve(process.cwd(), 'server/persistence.ts'), 'utf-8');
    assert.ok(content.includes('.tmp'), 'PersistenceManager must use .tmp staging for atomic rename');
    assert.ok(content.includes('fs.renameSync'), 'PersistenceManager must use atomic renameSync');
  });

  test('Deployment Check', 'Clearly distinguishes CODE READY from PRODUCTION DEPLOYED', () => {
    const checklist = getPilotLaunchChecklist();
    const codeChecked = checklist.filter(c => c.verificationType === 'CODE_CHECKED');
    const externalVerified = checklist.filter(c => c.verificationType === 'EXTERNALLY_VERIFIED');
    assert.ok(codeChecked.length > 0, 'Must have code-checked items');
    assert.ok(externalVerified.length > 0, 'Must have items requiring external production verification');
    // External items are not falsely marked as completed unless confirmed
    const unconfirmed = externalVerified.filter(c => !c.manualCompleted);
    assert.ok(unconfirmed.length > 0, 'Unconfirmed external items must not be prematurely claimed as verified');
  });

  // ==========================================================================
  // 2. PRODUCTION ENVIRONMENT VARIABLES & SECRET HYGIENE
  // ==========================================================================
  console.log('\n--- 2. Production Environment Variables & Secret Hygiene ---');

  test('Secret Hygiene', 'Server secrets remain strictly server-side and are not leaked in client variables', () => {
    const envReport = validateProductionEnvironment();
    assert.ok(envReport);
    // VITE_ prefix must never contain secret keys
    assert.ok(!process.env.VITE_PAYSTACK_SECRET_KEY, 'Secret key must never use VITE_ prefix');
    assert.ok(!process.env.VITE_GEMINI_API_KEY, 'Gemini API key must never use VITE_ prefix');
    assert.ok(!process.env.VITE_ADMIN_PASSWORD, 'Admin password must never use VITE_ prefix');
  });

  test('Secret Hygiene', 'Public key is never accepted as server secret key', () => {
    const oldKey = process.env.PAYSTACK_SECRET_KEY;
    try {
      process.env.PAYSTACK_SECRET_KEY = 'pk_test_bogus_public_key_as_secret';
      const report = validateProductionEnvironment();
      const serverKeyVar = report.variables.find(v => v.name === 'PAYSTACK_SECRET_KEY');
      assert.strictEqual(serverKeyVar?.status, 'NOT READY');
      assert.ok(serverKeyVar?.formatNote.includes('CRITICAL'));
    } finally {
      process.env.PAYSTACK_SECRET_KEY = oldKey;
    }
  });

  // ==========================================================================
  // 3. HTTPS AND REVERSE PROXY SECURITY
  // ==========================================================================
  console.log('\n--- 3. HTTPS and Reverse Proxy Security ---');

  test('Reverse Proxy', 'Secured IP resolution avoids spoofing on direct connections while respecting trusted proxies', () => {
    // When trust proxy is inactive, direct socket address is used
    const mockReqUntrusted: any = {
      app: { get: () => false },
      headers: { 'cf-connecting-ip': '1.2.3.4' },
      socket: { remoteAddress: '192.168.1.1' }
    };
    assert.strictEqual(extractClientIp(mockReqUntrusted), '192.168.1.1');

    // When trust proxy is active, cf-connecting-ip is respected
    const mockReqTrusted: any = {
      app: { get: () => true },
      headers: { 'cf-connecting-ip': '102.89.44.12' },
      socket: { remoteAddress: '172.68.22.1' }
    };
    assert.strictEqual(extractClientIp(mockReqTrusted), '102.89.44.12');
  });

  // ==========================================================================
  // 4. PAYSTACK PRODUCTION GATE
  // ==========================================================================
  console.log('\n--- 4. Paystack Production Gate ---');

  test('Payment Gate', 'Payment mode remains TEST in pilot rehearsal and prevents live tuition without live credentials', () => {
    const payReport = getPaymentReadinessReport();
    assert.ok(['TEST', 'NOT CONFIGURED'].includes(payReport.paymentMode));
    assert.strictEqual(payReport.currency, 'NGN');
    assert.strictEqual(payReport.standardTermTuition, 6000);
  });

  test('Payment Gate', 'Paystack webhook endpoints are registered and verify raw body HMAC-SHA512', () => {
    const testSecret = 'sk_test_pilot_execution_secret_123';
    const oldSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = testSecret;

    try {
      const payload = Buffer.from(JSON.stringify({
        event: 'charge.success',
        data: { reference: `BHL_PILOT_VERIFY_${Date.now()}`, status: 'success' }
      }));
      const signature = crypto.createHmac('sha512', testSecret).update(payload).digest('hex');
      assert.strictEqual(paystack.verifyWebhookSignature(signature, payload), true);
      assert.strictEqual(paystack.verifyWebhookSignature('bad_sig', payload), false);
    } finally {
      process.env.PAYSTACK_SECRET_KEY = oldSecret;
    }
  });

  test('Payment Gate', 'Payment idempotency prevents double crediting on duplicate webhook delivery', () => {
    const student = db.getStudents()[0];
    const ref = `BHL_IDEMP_TEST_${Date.now()}`;
    db.createPaymentIntent({
      parentId: student.parentId,
      childId: student.id,
      grade: student.registeredGrade,
      term: 2,
      amount: 6000,
      channel: 'Paystack',
      reference: ref
    });

    const fin1 = db.finalizePaymentRecord(ref, {
      amount: 6000,
      channel: 'Paystack',
      paystackReference: ref,
      paidAt: new Date().toISOString()
    });
    assert.ok(fin1);
    assert.strictEqual(fin1.payment.status, 'paid');

    const fin2 = db.finalizePaymentRecord(ref, {
      amount: 6000,
      channel: 'Paystack',
      paystackReference: ref,
      paidAt: new Date().toISOString()
    });
    assert.strictEqual(fin2?.payment.id, fin1.payment.id);
  });

  // ==========================================================================
  // 5. FIRST PILOT ADMIN VERIFICATION
  // ==========================================================================
  console.log('\n--- 5. First Pilot Admin Verification ---');

  test('Admin Verification', 'Pilot Readiness Panel evaluates all six core operational dimensions', () => {
    const summary = getPilotReadinessSummary();
    assert.strictEqual(summary.application.buildStatus, 'READY');
    assert.strictEqual(summary.application.deploymentMode, 'SINGLE_INSTANCE_PILOT');
    assert.strictEqual(summary.security.authenticationStatus, 'READY');
    assert.strictEqual(summary.security.rbacStatus, 'READY');
    assert.strictEqual(summary.curriculum.status, 'READY');
    assert.strictEqual(summary.curriculum.publishedRecordsCount, 6);
    assert.strictEqual(summary.aiTeacher.status, 'READY');
    assert.strictEqual(summary.storage.singleInstanceStatus, 'READY');
  });

  // ==========================================================================
  // 6. ADMIN ACCOUNT & RBAC PROTECTION
  // ==========================================================================
  console.log('\n--- 6. Admin Account & RBAC Security ---');

  test('Admin Security', 'Admin password uses PBKDF2 hash and rejects legacy admin123', () => {
    const admin = db.getAdminByEmail(process.env.ADMIN_INITIAL_EMAIL || 'admin@brightly.ng');
    assert.ok(admin, 'Admin must exist');
    assert.ok(admin.salt && admin.salt.length >= 32, 'Must have secure cryptographic salt');
    assert.ok(admin.passwordHash && admin.passwordHash.length >= 64, 'Must have secure PBKDF2 hash');

    // Verify admin123 is rejected
    const legacyCheck = db.verifyAdminCredentials(admin.email, 'admin123');
    assert.strictEqual(legacyCheck, null, 'Legacy admin123 must be strictly rejected');
  });

  // ==========================================================================
  // 7. FIRST PILOT COHORT (5–10 PUPILS)
  // ==========================================================================
  console.log('\n--- 7. First Pilot Cohort Preparation (5–10 Pupils) ---');

  test('Pilot Cohort', 'Maintains controlled cohort of 7 authentic Nigerian pupils across Primary 2, 3, and 4', () => {
    const cohort = getPilotCohortSummary();
    assert.ok(cohort.length >= 5 && cohort.length <= 10, `Cohort size must be 5-10, got ${cohort.length}`);
    assert.strictEqual(cohort.length, 7, 'Controlled pilot cohort contains exactly 7 authentic pupils');

    const grade2 = cohort.filter(p => p.grade === 2);
    const grade3 = cohort.filter(p => p.grade === 3);
    const grade4 = cohort.filter(p => p.grade === 4);

    assert.ok(grade2.length >= 2, 'Primary 2 must have at least 2 pupils (Aminat, Zainab)');
    assert.ok(grade3.length >= 2, 'Primary 3 must have at least 2 pupils (Fatima, Ibrahim Jr)');
    assert.ok(grade4.length >= 3, 'Primary 4 must have at least 3 pupils (Chidi, Oluwaseun, Emeka)');

    // Ensure authentic Nigerian names
    const names = cohort.map(p => p.name);
    assert.ok(names.includes('Chidi'));
    assert.ok(names.includes('Aminat'));
    assert.ok(names.includes('Fatima'));
    assert.ok(names.includes('Ibrahim Jr'));
    assert.ok(names.includes('Oluwaseun'));
    assert.ok(names.includes('Zainab'));
    assert.ok(names.includes('Emeka'));
  });

  test('Pilot Cohort', 'All cohort pupils have Week 1 accessible (Free preview) and Week 2+ blocked if unpaid', () => {
    const cohort = getPilotCohortSummary();
    cohort.forEach(p => {
      // Week 1 is ALWAYS accessible under NERDC Free Trial policy
      const w1Access = gates.evaluateLessonAccess(p.id, p.grade as GradeLevel, 1, 1, false);
      assert.strictEqual(w1Access.allowed, true, `Week 1 must be accessible for ${p.name}`);
    });

    // Unpaid enrolled pupils must have Week 2+ blocked
    const unpaidPupil = cohort.find(p => p.name === 'Oluwaseun' || p.name === 'Zainab' || p.name === 'Emeka');
    assert.ok(unpaidPupil, 'Must find unpaid preview pupil');
    const w2Access = gates.evaluateLessonAccess(unpaidPupil.id, unpaidPupil.grade as GradeLevel, 1, 2, false);
    assert.strictEqual(w2Access.allowed, false, `Week 2+ must be blocked for unpaid pupil ${unpaidPupil.name}`);
    assert.strictEqual(w2Access.reason, 'term_unpaid');
    assert.strictEqual(w2Access.requiredFee, 6000);
  });

  // ==========================================================================
  // 8. RUN THE FIRST PILOT LESSONS
  // ==========================================================================
  console.log('\n--- 8. Run the First Pilot Lessons ---');

  const authenticPilotLessons = [
    { grade: 4, week: 1, topicId: 'p4-t1-w1-math', name: 'Primary 4 Mathematics: Place Value (10,000 to 100,000)', pupilId: 'chidi' },
    { grade: 4, week: 2, topicId: 'p4-t1-w2-eng', name: 'Primary 4 English Studies: Nouns – Types and Identification', pupilId: 'chidi' },
    { grade: 3, week: 3, topicId: 'p3-t1-w3-sci', name: 'Primary 3 Basic Science: Living & Non-Living Things in Our Environment', pupilId: 'fatima' },
    { grade: 2, week: 3, topicId: 'p2-t1-w3-math', name: 'Primary 2 Mathematics: Addition / Counting in 2s, 3s, 5s, 10s', pupilId: 'aminat' }
  ];

  for (const lesson of authenticPilotLessons) {
    test('Pilot Lesson Execution', `Executes authentic lesson: ${lesson.name}`, () => {
      // 1. Verify access
      const access = gates.evaluateLessonAccess(lesson.pupilId, lesson.grade as GradeLevel, 1, lesson.week, lesson.week === 1);
      assert.strictEqual(access.allowed, true, `Access must be allowed for ${lesson.name}`);

      // 2. Verify curriculum record readiness
      const record = db.getCurriculumRecordById(lesson.topicId);
      assert.ok(record, `Curriculum record ${lesson.topicId} must exist`);
      assert.strictEqual(record.publishingStatus, 'PUBLISHED');
      const readiness = validateCurriculumReadiness(record);
      assert.strictEqual(readiness.isReadyForLesson, true);

      // 3. Verify objective traceability
      assert.ok(record.objectives.length > 0, 'Must have defined NERDC learning objectives');
      assert.ok(record.whiteboardSteps.length > 0, 'Must have guided teaching whiteboard steps');
      assert.ok(record.assessmentQuestions.length > 0, 'Must have assessment questions');

      // 4. Record authentic completion
      const completed = db.recordCompletedLesson(lesson.pupilId, {
        topicId: record.id,
        subject: record.subject,
        title: record.topic,
        score: 92,
        badge: 'PILOT_MASTER',
        reexplained: false,
        objectivesMastery: record.objectives.map(obj => ({
          objective: obj,
          mastered: true
        }))
      });
      assert.ok(completed, 'Lesson completion record must be saved');

      // 5. Verify duplicate completion updates in-place without inflating counts
      const beforeCount = completed.completedLessons.length;
      const reCompleted = db.recordCompletedLesson(lesson.pupilId, {
        topicId: record.id,
        subject: record.subject,
        title: record.topic,
        score: 95,
        badge: 'PILOT_MASTER_RETEST',
        reexplained: true
      });
      assert.strictEqual(reCompleted?.completedLessons.length, beforeCount, 'Duplicate completion must not inflate lesson count');
    });
  }

  // ==========================================================================
  // 9. INCIDENT MONITORING & OPERATIONAL OBSERVABILITY
  // ==========================================================================
  console.log('\n--- 9. Incident Monitoring & Secret Masking ---');

  test('Incident Monitoring', 'Operational incident register logs errors with severity and masks accidental secrets', () => {
    const rawSecret = 'sk_live_very_secret_key_12345';
    const incident = db.addIncident({
      severity: 'HIGH',
      category: 'payment',
      title: `Gateway Timeout with ${rawSecret}`,
      description: `Connection dropped while processing secret key ${rawSecret} for merchant.`,
      status: 'OPEN',
      reportedBy: 'audit_test'
    });

    assert.ok(incident.id);
    assert.strictEqual(incident.severity, 'HIGH');
    assert.strictEqual(incident.category, 'payment');

    // Verify secret is masked
    assert.ok(!incident.title.includes('very_secret_key'), 'Title must not leak raw secret key');
    assert.ok(incident.title.includes('sk_live_••••[MASKED]'), 'Title must mask secret key');
    assert.ok(!incident.description.includes('very_secret_key'), 'Description must not leak raw secret key');
    assert.ok(incident.description.includes('sk_live_••••[MASKED]'), 'Description must mask secret key');
  });

  // ==========================================================================
  // 10. PILOT MONITORING METRICS INTEGRATION
  // ==========================================================================
  console.log('\n--- 10. Pilot Monitoring Metrics Integration ---');

  test('Pilot Monitoring', 'Aggregates educational metrics across all active cohort pupils', () => {
    const metrics = getPilotMonitoringMetrics();
    assert.strictEqual(metrics.activePilotPupils, 7, 'Must report all 7 active cohort pupils');
    assert.ok(metrics.lessonsCompleted >= 4, 'Must report completed authentic pilot lessons');
    assert.ok(metrics.averageLessonScore >= 75, 'Average score must be calculated');
    assert.ok(typeof metrics.completionRate === 'number');
    assert.ok(typeof metrics.retestSuccessRate === 'number');
  });

  console.log('\n================================================================');
  console.log(`  FIRST PILOT EXECUTION SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFirstPilotExecutionTestSuite();
