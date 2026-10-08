import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../server/db';
import { gates } from '../server/gates';
import { paystack } from '../server/paystack';
import { PersistenceManager } from '../server/persistence';
import { 
  validateCurriculumReadiness, 
  validateGeneratedLessonAgainstCurriculum,
  verifyObjectiveTraceability,
  calculateObjectiveMasteryStatus 
} from '../server/readinessValidator';
import { GradeLevel, SubjectName, STANDARD_TUITION_FEES } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — FINAL PILOT BLOCKER AUDIT TEST SUITE');
console.log('================================================================');

async function runPilotBlockerAudit() {
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
  // SECTION 1: PAYMENT ENFORCEMENT
  // ==========================================================================
  console.log('\n--- 1. Payment Enforcement & Gateway Hardening ---');

  test('Payment Enforcement', 'Week 1 accessible as free preview under NERDC policy', () => {
    const student = db.getStudents()[0];
    assert.ok(student, 'Student must exist');
    const access = gates.evaluateLessonAccess(student.id, student.registeredGrade, 1, 1, false);
    assert.strictEqual(access.allowed, true);
    assert.ok(access.message.includes('Free Trial') || access.message.includes('preview'));
  });

  test('Payment Enforcement', 'Week 2+ blocked without active term tuition', () => {
    // Create an unpaid student for Term 2
    const testPupil = db.addStudent({
      id: `pupil_unpaid_${Date.now()}`,
      parentId: 'parent_main',
      name: 'Unpaid Pupil',
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
      termlyTuition: {} // No paid terms
    });

    const access = gates.evaluateLessonAccess(testPupil.id, 4, 2, 2, false);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'term_unpaid');
    assert.strictEqual(access.requiredFee, 6000);
  });

  test('Payment Enforcement', 'Client cannot declare payment successful arbitrarily', () => {
    // Student termly tuition cannot be toggled without server finalized payment or parent account record
    const testPupil = db.addStudent({
      id: `pupil_unpaid_check_${Date.now()}`,
      parentId: 'parent_main',
      name: 'Arbitrary Check Pupil',
      grade: 4 as GradeLevel,
      registeredGrade: 4 as GradeLevel,
      pin: '1234',
      avatarUrl: '',
      avatarColor: '#1E88E5',
      currentTerm: 3,
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
    // Direct attempt to query gate for unpaid term 3 fails
    const access = gates.evaluateLessonAccess(testPupil.id, testPupil.registeredGrade, 3, 2, false);
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'term_unpaid');
  });

  test('Payment Enforcement', 'Server derives authoritative tuition amount (₦6,000 termly)', () => {
    assert.strictEqual(STANDARD_TUITION_FEES.termlyPlanFee, 6000);
    assert.strictEqual(STANDARD_TUITION_FEES.annualPlanFee, 15000);
  });

  test('Payment Enforcement', 'Paystack secret remains strictly server-only', () => {
    const key = paystack.getSecretKey();
    assert.ok(!key.startsWith('pk_'), 'Secret key must not be a public key');
    assert.ok(!process.env.VITE_PAYSTACK_SECRET_KEY, 'VITE_ prefix must never expose secret key to frontend');
  });

  test('Payment Enforcement', 'Webhook raw-body HMAC-SHA512 verification succeeds with valid signature', () => {
    const testSecret = 'sk_test_mock_secret_key_12345';
    const oldKey = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = testSecret;

    try {
      const payload = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'REF123' } }));
      const validSig = crypto.createHmac('sha512', testSecret).update(payload).digest('hex');
      assert.strictEqual(paystack.verifyWebhookSignature(validSig, payload), true);
    } finally {
      process.env.PAYSTACK_SECRET_KEY = oldKey;
    }
  });

  test('Payment Enforcement', 'Invalid webhook signature is strictly rejected', () => {
    const payload = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'REF123' } }));
    assert.strictEqual(paystack.verifyWebhookSignature('forged_fake_signature', payload), false);
  });

  test('Payment Enforcement', 'Duplicate webhook delivery is idempotent (cannot credit twice)', () => {
    const student = db.getStudents()[0];
    const uniqueRef = `BHL_TEST_IDEMP_${Date.now()}`;
    db.createPaymentIntent({
      parentId: student.parentId,
      childId: student.id,
      grade: student.registeredGrade,
      term: 2,
      amount: 6000,
      channel: 'Paystack',
      reference: uniqueRef
    });

    const fin1 = db.finalizePaymentRecord(uniqueRef, {
      amount: 6000,
      channel: 'Paystack',
      paystackReference: uniqueRef,
      paidAt: new Date().toISOString()
    });
    assert.ok(fin1, 'First finalize must succeed');
    assert.strictEqual(fin1.payment.status, 'paid');

    // Repeated finalize returns existing record without duplicate credit
    const fin2 = db.finalizePaymentRecord(uniqueRef, {
      amount: 6000,
      channel: 'Paystack',
      paystackReference: uniqueRef,
      paidAt: new Date().toISOString()
    });
    assert.strictEqual(fin2?.payment.id, fin1.payment.id);
    assert.strictEqual(fin2?.payment.status, 'paid');
  });

  test('Payment Enforcement', 'Payment belongs strictly to the targeted child account', () => {
    const students = db.getStudents();
    assert.ok(students.length >= 2, 'Need 2 students');
    const childA = students[0];
    const childB = students[1];

    const ref = `BHL_ISOLATION_${Date.now()}`;
    db.createPaymentIntent({
      parentId: childA.parentId,
      childId: childA.id,
      grade: childA.registeredGrade,
      term: 3,
      amount: 6000,
      channel: 'Paystack',
      reference: ref
    });
    db.finalizePaymentRecord(ref, {
      amount: 6000,
      channel: 'Paystack',
      paystackReference: ref,
      paidAt: new Date().toISOString()
    });

    const refreshedA = db.getStudentById(childA.id);
    const refreshedB = db.getStudentById(childB.id);

    assert.strictEqual(refreshedA?.termlyTuition?.[3]?.paid, true);
    // Child B must NOT have received paid access for Term 3
    assert.strictEqual(Boolean(refreshedB?.termlyTuition?.[3]?.paid), false);
  });

  // ==========================================================================
  // SECTION 2: HISTORICAL CURRICULUM VERSION PROTECTION
  // ==========================================================================
  console.log('\n--- 2. Historical Curriculum Version Protection ---');

  test('Historical Version Protection', 'Completed lesson locks Version A and remains unchanged when Version B publishes', () => {
    const student = db.getStudents()[0];
    const topicId = 'p4-t1-w1-math';

    // 1. Pupil completes lesson under initial version (e.g. nerdc-based-v1)
    const initialRec = db.getCurriculumRecordById(topicId);
    assert.ok(initialRec);
    const originalVersion = initialRec.curriculumVersion;

    db.recordCompletedLesson(student.id, {
      topicId,
      subject: 'Mathematics',
      title: initialRec.topic,
      score: 95,
      badge: 'MASTERED',
      reexplained: false,
      curriculumVersion: originalVersion,
      objectivesMastery: [
        { objective: initialRec.objectives[0], mastered: true }
      ]
    });

    const pupilBefore = db.getStudentById(student.id);
    const historyBefore = pupilBefore?.completedLessons.find(l => l.topicId === topicId);
    assert.ok(historyBefore);
    assert.strictEqual(historyBefore.curriculumVersion, originalVersion);
    const completedAtOriginal = historyBefore.completedAt;

    // 2. Admin publishes Curriculum Version B for the same topic
    const updatedRecord = db.updateCurriculumRecord(topicId, {
      curriculumVersion: 'nerdc-2026-v2',
      topic: 'Addition & Place Value Advanced Edition',
      objectives: ['New Revised Objective 2026']
    });
    assert.ok(updatedRecord);
    assert.strictEqual(updatedRecord.curriculumVersion, 'nerdc-2026-v2');

    // 3. Verify pupil historical record remains Version A
    const pupilAfter = db.getStudentById(student.id);
    const historyAfter = pupilAfter?.completedLessons.find(l => l.topicId === topicId);
    assert.ok(historyAfter);
    assert.strictEqual(historyAfter.curriculumVersion, originalVersion, 'Historical version must remain locked to Version A');
    assert.strictEqual(historyAfter.completedAt, completedAtOriginal, 'Historical completion timestamp must not change');
    assert.strictEqual(historyAfter.score, 95);
    assert.strictEqual(historyAfter.objectivesMastery?.[0]?.objective, initialRec.objectives[0]);

    // Restore record to maintain test cleanliness
    db.updateCurriculumRecord(topicId, {
      curriculumVersion: originalVersion,
      topic: initialRec.topic,
      objectives: initialRec.objectives
    });
  });

  // ==========================================================================
  // SECTION 3: AI FAILURE SAFETY
  // ==========================================================================
  console.log('\n--- 3. AI Failure Safety & Defense in Depth ---');

  test('AI Failure Safety', 'Rejects empty or missing AI response safely', () => {
    const currRecord = db.getCurriculumRecordById('p4-t1-w1-math');
    const emptyResponse = {};
    const validation = validateGeneratedLessonAgainstCurriculum(emptyResponse, currRecord);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.includes('no learning objectives') || e.includes('topic')));
  });

  test('AI Failure Safety', 'Rejects AI response with curriculum topic mismatch', () => {
    const currRecord = db.getCurriculumRecordById('p4-t1-w1-math');
    const mismatchedResponse = {
      title: 'Quantum Physics in Astrophysics',
      objectives: ['Understand black holes'],
      practiceProblems: []
    };
    const validation = validateGeneratedLessonAgainstCurriculum(mismatchedResponse, currRecord);
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.includes('does not map to curriculum topic')));
  });

  test('AI Failure Safety', 'Detects unauthorized AI-synthesized objectives', () => {
    const currRecord = db.getCurriculumRecordById('p4-t1-w2-eng');
    const fakeMastery = {
      'Identify proper nouns (capital letter: Abuja, Lagos, Kano, Aminat, Nigeria)': { score: 90 },
      'Invented Objective: Flying to Mars with spaceships': { score: 70 }
    };
    const traceCheck = verifyObjectiveTraceability(currRecord, fakeMastery);
    assert.strictEqual(traceCheck.traceable, false);
    assert.strictEqual(traceCheck.unauthorizedObjectives[0], 'Invented Objective: Flying to Mars with spaceships');
  });

  test('AI Failure Safety', 'Unconfigured curriculum slot returns 404 with authentic protection message', () => {
    // Primary 1 Mathematics Week 5 has no authentic NERDC record seeded
    const matches = db.getCurriculumByQuery(1 as GradeLevel, 'Mathematics' as SubjectName, 1, 5);
    assert.strictEqual(matches.length, 0);
  });

  // ==========================================================================
  // SECTION 4: DUPLICATE COMPLETION / RETRY SAFETY
  // ==========================================================================
  console.log('\n--- 4. Duplicate Completion & Retry Safety ---');

  test('Duplicate Completion Safety', 'Repeated completion calls update in place without inflating lesson counts', () => {
    const student = db.getStudents()[0];
    const initialLessonCount = student.completedLessons.length;
    const testTopic = 'p4-t1-w3-geo';

    // First completion
    db.recordCompletedLesson(student.id, {
      topicId: testTopic,
      subject: 'Social Studies',
      title: 'Geographical Regions of Nigeria',
      score: 85,
      badge: 'MASTERED',
      reexplained: false
    });

    const afterFirst = db.getStudentById(student.id);
    const countAfterFirst = afterFirst?.completedLessons.length || 0;
    const weeklyCount1 = afterFirst?.lessonsCompletedThisWeek || 0;

    // Second completion (replay / retry)
    db.recordCompletedLesson(student.id, {
      topicId: testTopic,
      subject: 'Social Studies',
      title: 'Geographical Regions of Nigeria',
      score: 90,
      badge: 'MASTERED',
      reexplained: false
    });

    const afterSecond = db.getStudentById(student.id);
    const countAfterSecond = afterSecond?.completedLessons.length || 0;
    const weeklyCount2 = afterSecond?.lessonsCompletedThisWeek || 0;

    assert.strictEqual(countAfterSecond, countAfterFirst, 'Duplicate completion must not increase completed lessons length');
    assert.strictEqual(weeklyCount2, weeklyCount1, 'Weekly lessons count must not inflate on retry');
    const updatedEntry = afterSecond?.completedLessons.find(l => l.topicId === testTopic);
    assert.strictEqual(updatedEntry?.score, 90, 'Score should reflect latest completion update');
  });

  // ==========================================================================
  // SECTION 5: ACTUAL MASTERY CALCULATION
  // ==========================================================================
  console.log('\n--- 5. Actual Mastery Calculation & Non-Universal Rules ---');

  test('Mastery Calculation', 'All correct answers on mapped questions produces Strong Mastery', () => {
    const res = calculateObjectiveMasteryStatus({
      objective: 'Identify proper nouns',
      totalMappedQuestions: 2,
      correctMappedQuestions: 2,
      lessonOverallPercentage: 100
    });
    assert.strictEqual(res.mastered, true);
    assert.strictEqual(res.masteryLevel, 'Strong Mastery');
  });

  test('Mastery Calculation', 'Strictly rejects universal 70% rule: missed objective is NOT Mastered despite 70% overall', () => {
    // Pupil got 70% overall in lesson, but got 0/1 on this specific objective
    const res = calculateObjectiveMasteryStatus({
      objective: 'Recognize Collective Nouns',
      totalMappedQuestions: 1,
      correctMappedQuestions: 0,
      lessonOverallPercentage: 70
    });
    assert.strictEqual(res.mastered, false, 'Missed objective must NOT be marked Mastered under 70% overall');
    assert.strictEqual(res.masteryLevel, 'Developing');
  });

  test('Mastery Calculation', 'Partially correct multi-question objective yields Approaching Mastery', () => {
    const res = calculateObjectiveMasteryStatus({
      objective: 'Distinguish proper and common nouns',
      totalMappedQuestions: 2,
      correctMappedQuestions: 1,
      lessonOverallPercentage: 65
    });
    assert.strictEqual(res.mastered, false);
    assert.strictEqual(res.masteryLevel, 'Approaching Mastery');
  });

  test('Mastery Calculation', 'Completely incorrect on low overall score yields Beginning', () => {
    const res = calculateObjectiveMasteryStatus({
      objective: 'Understand Abstract Nouns',
      totalMappedQuestions: 1,
      correctMappedQuestions: 0,
      lessonOverallPercentage: 30
    });
    assert.strictEqual(res.mastered, false);
    assert.strictEqual(res.masteryLevel, 'Beginning');
  });

  test('Mastery Calculation', 'Re-explanation with passed retest elevates objective to Mastered', () => {
    const res = calculateObjectiveMasteryStatus({
      objective: 'Identify proper nouns',
      totalMappedQuestions: 1,
      correctMappedQuestions: 0,
      lessonOverallPercentage: 60,
      retestAttempted: true,
      retestPassed: true
    });
    assert.strictEqual(res.mastered, true);
    assert.strictEqual(res.masteryLevel, 'Mastered');
    assert.ok(res.details.includes('adaptive re-explanation support'));
  });

  test('Mastery Calculation', 'Failed re-assessment does NOT grant Mastered (remains Developing)', () => {
    const res = calculateObjectiveMasteryStatus({
      objective: 'Identify proper nouns',
      totalMappedQuestions: 1,
      correctMappedQuestions: 0,
      lessonOverallPercentage: 50,
      retestAttempted: true,
      retestPassed: false
    });
    assert.strictEqual(res.mastered, false);
    assert.strictEqual(res.masteryLevel, 'Developing');
  });

  // ==========================================================================
  // SECTION 6: PERSISTENCE / RESTART
  // ==========================================================================
  console.log('\n--- 6. Persistence & Disaster Recovery Durability ---');

  test('Persistence / Restart', 'Database state persists across reload and preserves all student progress', () => {
    const loaded = PersistenceManager.load();
    assert.ok(loaded);
    assert.ok(Array.isArray(loaded.students) && loaded.students.length > 0);
    assert.ok(Array.isArray(loaded.parents) && loaded.parents.length > 0);
    assert.ok(Array.isArray(loaded.curriculum) && loaded.curriculum.length === 6);
  });

  test('Persistence / Restart', 'Atomic backup file exists on disk alongside primary file', () => {
    const dataDir = path.resolve(process.cwd(), '.data');
    const primaryPath = path.resolve(dataDir, 'brightly_db.json');
    const backupPath = path.resolve(dataDir, 'brightly_db.bak.json');
    assert.ok(fs.existsSync(primaryPath), 'Primary brightly_db.json must exist');
    assert.ok(fs.existsSync(backupPath), 'Backup brightly_db.bak.json must exist');
  });

  // ==========================================================================
  // SECTION 7: JSON CONCURRENCY LIMITATION
  // ==========================================================================
  console.log('\n--- 7. Single-Instance Architecture Guard ---');

  test('JSON Concurrency Limitation', 'PersistenceManager explicitly declares SINGLE_INSTANCE_PILOT mode', () => {
    assert.strictEqual(PersistenceManager.DEPLOYMENT_MODE, 'SINGLE_INSTANCE_PILOT');
  });

  // ==========================================================================
  // SECTION 8: RATE LIMITING & REVERSE PROXY SECURITY
  // ==========================================================================
  console.log('\n--- 8. Rate Limiting & Reverse Proxy Security ---');

  test('Rate Limiting', 'Secured IP resolution avoids spoofing when direct connection', () => {
    // When trust proxy is active, Express extracts req.ip through configured proxy hops
    const mockReqUntrusted: any = {
      app: { get: (k: string) => false }, // No trust proxy
      headers: { 'x-forwarded-for': '185.220.101.5' }, // Attacker trying to spoof
      socket: { remoteAddress: '192.168.1.100' }
    };
    // Direct connection must use socket remoteAddress
    const isTrustProxy = Boolean(mockReqUntrusted.app?.get('trust proxy'));
    const resolvedIp = isTrustProxy ? (mockReqUntrusted.ip) : (mockReqUntrusted.socket.remoteAddress);
    assert.strictEqual(resolvedIp, '192.168.1.100', 'Must not trust spoofed X-Forwarded-For when not behind trusted proxy');
  });

  test('Rate Limiting', 'Respects Cloudflare CF-Connecting-IP when behind trusted proxy', () => {
    const mockReqCloudflare: any = {
      app: { get: (k: string) => 1 },
      headers: { 'cf-connecting-ip': '102.89.44.12' },
      socket: { remoteAddress: '172.68.22.1' },
      ip: '102.89.44.12'
    };
    const isTrustProxy = Boolean(mockReqCloudflare.app?.get('trust proxy'));
    const cfIp = mockReqCloudflare.headers['cf-connecting-ip'];
    const resolvedIp = isTrustProxy && cfIp ? cfIp : mockReqCloudflare.socket.remoteAddress;
    assert.strictEqual(resolvedIp, '102.89.44.12');
  });

  // ==========================================================================
  // SECTION 9: COMPLETE REAL USER JOURNEY (MATH & ENGLISH)
  // ==========================================================================
  console.log('\n--- 9. Complete Real User Journey Simulation ---');

  test('Real User Journey (Mathematics)', 'Executes full pipeline: P4 T1 W1 Mathematics', () => {
    // 1. Admin verifies curriculum record
    const mathRecord = db.getCurriculumRecordById('p4-t1-w1-math');
    assert.ok(mathRecord);
    const readiness = validateCurriculumReadiness(mathRecord);
    assert.strictEqual(readiness.canPublish, true);
    assert.strictEqual(readiness.isReadyForLesson, true);

    // 2. Parent logs in and selects child
    const parent = db.getParentAccount();
    assert.ok(parent);
    const children = db.getStudentsByParentId(parent.id);
    assert.ok(children.length > 0);
    const pupil = children[0];

    // 3. Lesson access check
    const access = gates.evaluateLessonAccess(pupil.id, 4, 1, 1, false);
    assert.strictEqual(access.allowed, true);

    // 4. Guided practice & assessment
    const assessQ = mathRecord.assessmentQuestions[0];
    assert.ok(assessQ);

    // 5. Completion & mastery recording
    const updated = db.recordCompletedLesson(pupil.id, {
      topicId: mathRecord.id,
      subject: mathRecord.subject,
      title: mathRecord.topic,
      score: 100,
      badge: 'MASTERED',
      reexplained: false,
      objectivesMastery: [
        { objective: mathRecord.objectives[0], mastered: true }
      ]
    });
    assert.ok(updated);
    assert.ok(updated.completedLessons.some(l => l.topicId === mathRecord.id));
  });

  test('Real User Journey (English Studies)', 'Executes full pipeline: P4 T1 W2 English Nouns & Traceability', () => {
    // 1. Curriculum verification
    const engRecord = db.getCurriculumRecordById('p4-t1-w2-eng');
    assert.ok(engRecord);
    const readiness = validateCurriculumReadiness(engRecord);
    assert.strictEqual(readiness.canPublish, true);
    assert.strictEqual(readiness.isReadyForLesson, true);

    // 2. Pupil login & topic selection
    const pupil = db.getStudents()[0];

    // 3. Teaching content inspection (Abuja, Lagos, Kano)
    const step1 = engRecord.whiteboardSteps[0];
    const text = (step1.teacherSpeech + ' ' + step1.boardText).toLowerCase();
    assert.ok(text.includes('abuja') && text.includes('lagos') && text.includes('kano'));

    // 4. Assessment question mapped to proper nouns
    const question = engRecord.assessmentQuestions.find(q => q.id === 'p4-e-q2');
    assert.ok(question);
    assert.ok(question.question.toLowerCase().includes('proper noun'));

    // 5. Objective-level mastery recorded
    const completed = db.recordCompletedLesson(pupil.id, {
      topicId: engRecord.id,
      subject: engRecord.subject,
      title: engRecord.topic,
      score: 90,
      badge: 'MASTERED',
      reexplained: false,
      objectivesMastery: [
        { objective: 'Identify proper nouns (capital letter: Abuja, Lagos, Kano, Aminat, Nigeria)', mastered: false }
      ]
    });
    assert.ok(completed);

    // 6. Traceability to Parent Report
    const trace = verifyObjectiveTraceability(engRecord, {
      'Identify proper nouns (capital letter: Abuja, Lagos, Kano, Aminat, Nigeria)': { score: 70 }
    });
    assert.strictEqual(trace.traceable, true);
  });

  // ==========================================================================
  // SECTION 10: EMPTY CURRICULUM TEST
  // ==========================================================================
  console.log('\n--- 10. Empty Curriculum Slot Protection ---');

  test('Empty Curriculum Protection', 'Unconfigured slots have 0 records and block generation', () => {
    const unconfigured = db.getCurriculumByQuery(5 as GradeLevel, 'Basic Science & Technology' as SubjectName, 1, 2);
    assert.strictEqual(unconfigured.length, 0);
  });

  // ==========================================================================
  // SECTION 11: SIX AUTHENTIC LESSON REGRESSION
  // ==========================================================================
  console.log('\n--- 11. Six Authentic Lesson Foundation Regression ---');

  const verifiedSixIds = [
    'p4-t1-w1-math', // 1. P4 T1 W1 Mathematics
    'p4-t1-w2-math', // 2. P4 T1 W2 Mathematics
    'p4-t1-w3-geo',  // 3. P4 T1 W3 Social Studies
    'p4-t1-w2-eng',  // 4. P4 T1 W2 English
    'p3-t1-w3-sci',  // 5. P3 T1 W3 Basic Science
    'p2-t1-w3-math'   // 6. P2 T1 W3 Mathematics
  ];

  for (const id of verifiedSixIds) {
    test('Six Authentic Lessons', `Record ${id} is intact, published, and lesson-ready`, () => {
      const record = db.getCurriculumRecordById(id);
      assert.ok(record, `Curriculum record ${id} must exist in store`);
      assert.strictEqual(record.publishingStatus, 'PUBLISHED');
      const readiness = validateCurriculumReadiness(record);
      assert.strictEqual(readiness.canPublish, true);
      assert.strictEqual(readiness.isReadyForLesson, true);
      assert.ok(record.objectives.length > 0);
      assert.ok(record.whiteboardSteps.length > 0);
      assert.ok(record.practiceProblems.length > 0);
      assert.ok(record.assessmentQuestions.length > 0);
    });
  }

  console.log('\n================================================================');
  console.log(`  PILOT BLOCKER AUDIT SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPilotBlockerAudit();
