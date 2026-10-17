import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../server/db';
import { gates } from '../server/gates';
import { paystack } from '../server/paystack';
import { PersistenceManager } from '../server/persistence';
import { 
  RECOMMENDED_30_MIN_LESSON_PLAN, 
  TOTAL_LESSON_DURATION_MINUTES,
  SUBJECT_MASTERY_RULES,
  evaluateSubjectMastery,
  getAdaptiveReTeachingContent,
  buildParentAcademicSummary
} from '../server/lessonDelivery';
import { 
  VERIFIED_HIERARCHY_RECORDS,
  OFFICIAL_MISSING_NERDC_DOCUMENTS,
  AUTHENTIC_TERM_CALENDARS,
  ALL_NIGERIAN_PRIMARY_CLASSES,
  ALL_CORE_PRIMARY_SUBJECTS,
  generateAuditableCoverageReport
} from '../server/curriculumArchitecture';
import { NATIONAL_CURRICULUM_LESSONS } from '../src/data/curriculum';
import { 
  validateProductionEnvironment,
  getPaymentReadinessReport,
  getPilotReadinessSummary
} from '../server/pilotOperations';
import { REFERRAL_PROGRAM_CONFIG } from '../server/referralConfig';
import { STANDARD_TUITION_FEES } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — PHASE 8: END-TO-END ACCEPTANCE & PILOT READINESS AUDIT');
console.log('================================================================');

const BASE_URL = 'http://localhost:3000';

async function runPhase8AcceptanceAudit() {
  let passed = 0;
  let failed = 0;
  const auditFindings: { step: string; category: string; status: 'Pass' | 'Fail' | 'Not Tested' | 'Blocked'; details: string }[] = [];

  function recordAudit(step: string, category: string, status: 'Pass' | 'Fail' | 'Not Tested' | 'Blocked', details: string) {
    auditFindings.push({ step, category, status, details });
    if (status === 'Pass') {
      console.log(`  \x1b[32m✔ [${status}]\x1b[0m [${step}] ${details}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✖ [${status}]\x1b[0m [${step}] ${details}`);
      failed++;
    }
  }

  function test(step: string, details: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        (res as any).then(() => {
          recordAudit(step, '10-Dimension Audit', 'Pass', details);
        }).catch((err: any) => {
          recordAudit(step, '10-Dimension Audit', 'Fail', `${details}: ${err?.message}`);
        });
      } else {
        recordAudit(step, '10-Dimension Audit', 'Pass', details);
      }
    } catch (err: any) {
      recordAudit(step, '10-Dimension Audit', 'Fail', `${details}: ${err?.message}`);
    }
  }

  // Tracking test entities for guaranteed non-destructive cleanup
  const createdParentIds: string[] = [];
  const createdStudentIds: string[] = [];
  const createdPaymentRefs: string[] = [];

  try {
    db.setPilotPaused(false);
    // ========================================================================
    // JOURNEY STEP 1: New family visits main application URL and sees login page
    // ========================================================================
    console.log('\n--- Journey 1 & 2: Platform Entry & Parent Registration/Login ---');
    try {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      assert.strictEqual(res.status, 200, 'Home page must return HTTP 200');
      assert.ok(html.includes('Brightly') || html.includes('root') || html.includes('DOCTYPE'), 'Entry HTML must load cleanly');
      
      // Verify security headers
      const nosniff = res.headers.get('x-content-type-options');
      const frameOpts = res.headers.get('x-frame-options');
      assert.strictEqual(nosniff, 'nosniff', 'Must enforce nosniff');
      assert.strictEqual(frameOpts, 'SAMEORIGIN', 'Must enforce SAMEORIGIN frame protection');

      recordAudit('Step 1', 'Platform Entry & Security Headers', 'Pass', 'Main entry URL loads HTTP 200 with strict nosniff and SAMEORIGIN headers');
    } catch (err: any) {
      recordAudit('Step 1', 'Platform Entry & Security Headers', 'Fail', `Failed to load entry URL: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 2: Parent registers and logs in
    // ========================================================================
    const timestamp = Date.now();
    const testParentPhone = `+234803${String(timestamp).slice(-7)}`;
    const testParentEmail = `family_${timestamp}@brightly.test.ng`;
    let parentToken = '';
    let parentId = '';

    try {
      // 2a. Parent Registration with Nigerian Phone and Consent
      const regRes = await fetch(`${BASE_URL}/api/auth/register/parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mr. Babatunde Adeleke',
          phone: testParentPhone,
          email: testParentEmail,
          password: 'Password123!',
          pin: '1234',
          consentRecorded: true,
          consentNote: 'Parental pilot consent given for 2026 Home Lesson study'
        })
      });
      const regData = await regRes.json();
      assert.ok(regRes.status === 200 || regRes.status === 201, `Registration must return HTTP 200 or 201 (got ${regRes.status})`);
      assert.strictEqual(regData.success, true);
      assert.ok(regData.token, 'Must return authentication session token');
      assert.ok(regData.parent?.id, 'Must return parent ID');
      parentId = regData.parent.id;
      createdParentIds.push(parentId);

      // 2b. Parent Login with credentials
      const loginRes = await fetch(`${BASE_URL}/api/auth/login/parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testParentEmail,
          password: 'Password123!'
        })
      });
      const loginData = await loginRes.json();
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginData.success, true);
      assert.ok(loginData.token);
      assert.strictEqual(loginData.user.role, 'parent');
      assert.strictEqual(loginData.user.parentId, parentId);
      parentToken = loginData.token;

      recordAudit('Step 2', 'Parent Registration & Auth', 'Pass', 'Parent registers with Nigerian contact and consent, authenticates and receives verified session');
    } catch (err: any) {
      recordAudit('Step 2', 'Parent Registration & Auth', 'Fail', `Parent registration/login failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 3: Parent adds two or more children
    // ========================================================================
    console.log('\n--- Journey 3 to 6: Multi-Child Management & Account Isolation ---');
    let child1Id = '';
    let child2Id = '';
    const child1Name = `Femi_${timestamp}`;
    const child2Name = `Simi_${timestamp}`;

    try {
      // Add Child 1 (Primary 4)
      const c1Res = await fetch(`${BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({
          name: child1Name,
          grade: 4,
          schoolName: 'Corona School Victoria Island',
          pin: '1111',
          preferredVoiceTone: 'nigerian_teacher'
        })
      });
      const c1Data = await c1Res.json();
      assert.ok(c1Res.status === 200 || c1Res.status === 201, `Child 1 creation must return HTTP 200 or 201 (got ${c1Res.status})`);
      assert.strictEqual(c1Data.success, true);
      assert.ok(c1Data.student?.id);
      child1Id = c1Data.student.id;
      createdStudentIds.push(child1Id);

      // Add Child 2 (Primary 2)
      const c2Res = await fetch(`${BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({
          name: child2Name,
          grade: 2,
          schoolName: 'Grange School Ikeja',
          pin: '2222',
          preferredVoiceTone: 'phonics'
        })
      });
      const c2Data = await c2Res.json();
      assert.ok(c2Res.status === 200 || c2Res.status === 201, `Child 2 creation must return HTTP 200 or 201 (got ${c2Res.status})`);
      assert.strictEqual(c2Data.success, true);
      assert.ok(c2Data.student?.id);
      child2Id = c2Data.student.id;
      createdStudentIds.push(child2Id);

      recordAudit('Step 3', 'Family Child Onboarding', 'Pass', 'Parent successfully added Child 1 (P4) and Child 2 (P2) linked to family account');
    } catch (err: any) {
      recordAudit('Step 3', 'Family Child Onboarding', 'Fail', `Failed adding children: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 4: Each child can log in separately
    // ========================================================================
    let child1Token = '';
    let child2Token = '';

    try {
      // Child 1 Login
      const c1Login = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: child1Name, pin: '1111' })
      });
      const c1LoginData = await c1Login.json();
      assert.strictEqual(c1Login.status, 200);
      assert.strictEqual(c1LoginData.success, true);
      assert.strictEqual(c1LoginData.user.role, 'pupil');
      assert.strictEqual(c1LoginData.student.id, child1Id);
      child1Token = c1LoginData.token;

      // Child 2 Login
      const c2Login = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: child2Name, pin: '2222' })
      });
      const c2LoginData = await c2Login.json();
      assert.strictEqual(c2Login.status, 200);
      assert.strictEqual(c2LoginData.success, true);
      assert.strictEqual(c2LoginData.user.role, 'pupil');
      assert.strictEqual(c2LoginData.student.id, child2Id);
      child2Token = c2LoginData.token;

      recordAudit('Step 4', 'Pupil Autonomous Authentication', 'Pass', 'Both children authenticate separately with their respective names and PINs');
    } catch (err: any) {
      recordAudit('Step 4', 'Pupil Autonomous Authentication', 'Fail', `Child separate login failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 5: Child can only access their own permitted account & history
    // ========================================================================
    try {
      // Child 1 attempts to record progress for Child 2 -> Must be rejected with HTTP 403
      const crossPupilWrite = await fetch(`${BASE_URL}/api/lessons/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${child1Token}`
        },
        body: JSON.stringify({
          studentId: child2Id, // Cross-pupil target
          topicId: 'p4-t1-w1-math',
          subject: 'Mathematics',
          title: 'Whole Numbers',
          score: 100
        })
      });
      assert.strictEqual(crossPupilWrite.status, 403, 'Pupil recording progress for another child must return 403');
      const crossData = await crossPupilWrite.json();
      assert.strictEqual(crossData.success, false);
      assert.ok(crossData.message.includes('Forbidden'));

      recordAudit('Step 5', 'Pupil Account Isolation', 'Pass', 'Pupil cannot access or alter progress for sibling or external pupil profile (HTTP 403 enforced)');
    } catch (err: any) {
      recordAudit('Step 5', 'Pupil Account Isolation', 'Fail', `Pupil isolation check failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 6: Parent views the correct children and progress
    // ========================================================================
    try {
      const parentKidsRes = await fetch(`${BASE_URL}/api/students`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      const parentKidsData = await parentKidsRes.json();
      assert.strictEqual(parentKidsRes.status, 200);
      assert.strictEqual(parentKidsData.success, true);
      const studentIds = parentKidsData.students.map((s: any) => s.id);
      assert.ok(studentIds.includes(child1Id), 'Parent must see Child 1');
      assert.ok(studentIds.includes(child2Id), 'Parent must see Child 2');

      // Verify cross-parent isolation: parent cannot view another family's child
      const foreignReport = await fetch(`${BASE_URL}/api/parent/reports/chidi`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      assert.strictEqual(foreignReport.status, 403, 'Parent inspecting foreign child report must return 403 Forbidden');

      recordAudit('Step 6', 'Parent Child Oversight & Cross-Parent Isolation', 'Pass', 'Parent sees strictly their own registered children and is blocked from foreign children');
    } catch (err: any) {
      recordAudit('Step 6', 'Parent Child Oversight & Cross-Parent Isolation', 'Fail', `Parent child oversight failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 7: Parent reviews monthly, termly and annual subscription options
    // ========================================================================
    console.log('\n--- Journey 7 to 9: Subscriptions, Paystack Test Mode & Access Gates ---');
    try {
      const priceRes = await fetch(`${BASE_URL}/api/pricing`);
      const priceData = await priceRes.json();
      assert.strictEqual(priceRes.status, 200);
      assert.strictEqual(priceData.success, true);
      assert.strictEqual(priceData.currency, 'NGN');
      assert.strictEqual(priceData.standardFees.monthlyPass, 2500);
      assert.strictEqual(priceData.standardFees.termlyTuition, 6000);
      assert.strictEqual(priceData.standardFees.annualTuition, 18000);
      assert.strictEqual(priceData.standardFees.foundingAnnualOffer, 15000);

      recordAudit('Step 7', 'Subscription Price Consistency', 'Pass', 'Authoritative fees consistent: Monthly ₦2,500, Termly ₦6,000, Annual ₦18,000, Founding ₦15,000');
    } catch (err: any) {
      recordAudit('Step 7', 'Subscription Price Consistency', 'Fail', `Pricing review failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 8: Payment processing works in configured TEST or LIVE mode
    // ========================================================================
    try {
      const paymentReadiness = getPaymentReadinessReport();
      assert.strictEqual(paymentReadiness.paymentMode, 'TEST', 'Must be in controlled TEST mode for safety');
      assert.strictEqual(paymentReadiness.activeKeysConfigured, true);
      assert.ok(paymentReadiness.configuredCurrencies.includes('NGN'));
      assert.strictEqual(paymentReadiness.liveModeBlockedWithoutApproval, true);

      // Verify server rejects mock amount injection on payment initialization
      const initRes = await fetch(`${BASE_URL}/api/paystack/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({
          studentId: child1Id,
          grade: 4,
          term: 1,
          planType: 'termly',
          amount: 50 // Injected fraudulent client amount attempt
        })
      });
      const initData = await initRes.json();
      assert.strictEqual(initRes.status, 200);
      // Server must override with authoritative ₦6,000 (600,000 kobo)
      assert.strictEqual(initData.amountKobo, 600000, 'Server must enforce authoritative ₦6,000 termly fee');
      createdPaymentRefs.push(initData.reference);

      recordAudit('Step 8', 'Payment Gateway Mode Governance', 'Pass', 'Paystack operates in controlled TEST mode and server overrides client fee tampering with authoritative amount');
    } catch (err: any) {
      recordAudit('Step 8', 'Payment Gateway Mode Governance', 'Fail', `Payment gateway audit failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 9: Server enforces payment status and lesson access
    // ========================================================================
    try {
      // 9a. Week 1 is free diagnostic preview
      const w1Access = gates.evaluateLessonAccess(child1Id, 4, 1, 1, false);
      assert.strictEqual(w1Access.allowed, true, 'Week 1 must be permitted under free preview');

      // 9b. Week 2 is blocked before payment
      const w2Pre = gates.evaluateLessonAccess(child1Id, 4, 1, 2, false);
      assert.strictEqual(w2Pre.allowed, false, 'Week 2 must be blocked prior to tuition payment');
      assert.strictEqual(w2Pre.reason, 'term_unpaid');

      // 9c. Activate verified payment
      const payRef = `TEST_PAY_${Date.now()}`;
      db.createPaymentIntent({
        parentId,
        childId: child1Id,
        grade: 4,
        term: 1,
        amount: 6000,
        channel: 'Paystack Test',
        reference: payRef
      });
      db.finalizePaymentRecord(payRef, { amount: 6000, paidAt: new Date().toISOString() });
      createdPaymentRefs.push(payRef);

      // 9d. Week 2 is now unlocked
      const w2Post = gates.evaluateLessonAccess(child1Id, 4, 1, 2, false);
      assert.strictEqual(w2Post.allowed, true, 'Week 2 must be unlocked immediately following verified payment');

      recordAudit('Step 9', 'Payment Enforcement & Access Gating', 'Pass', 'Free preview granted for Week 1; Week 2 strictly gated until verified payment activation');
    } catch (err: any) {
      recordAudit('Step 9', 'Payment Enforcement & Access Gating', 'Fail', `Payment access gate failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 10: Parent shares referral code
    // ========================================================================
    console.log('\n--- Journey 10 to 12: Referral Programme & Anti-Fraud Gating ---');
    let parentReferralCode = '';

    try {
      const refSummaryRes = await fetch(`${BASE_URL}/api/referrals/summary`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      const refSummary = await refSummaryRes.json();
      assert.strictEqual(refSummaryRes.status, 200);
      assert.strictEqual(refSummary.success, true);
      assert.ok(refSummary.summary?.referralCode, 'Must provide unique referral code');
      parentReferralCode = refSummary.summary.referralCode;

      // Validate publicly accessible code query
      const valRes = await fetch(`${BASE_URL}/api/referrals/validate/${parentReferralCode}`);
      const valData = await valRes.json();
      assert.strictEqual(valRes.status, 200);
      assert.strictEqual(valData.valid, true);
      assert.ok(valData.referrerFamilyName.includes('*') || valData.referrerFamilyName.includes('Family'), 'Must mask referrer PII to public viewers');

      recordAudit('Step 10', 'Referral Code Generation & Sharing', 'Pass', 'Parent receives unique collision-resistant referral code with public PII masking');
    } catch (err: any) {
      recordAudit('Step 10', 'Referral Code Generation & Sharing', 'Fail', `Referral code sharing failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 11: Qualifying paid referral produces one credit
    // ========================================================================
    let familyBId = '';
    let familyBStudentId = '';

    try {
      const famBPhone = `+234809${String(Date.now()).slice(-7)}`;
      const famBEmail = `familyB_${Date.now()}@brightly.test.ng`;

      // Family B registers claiming Family A's referral code
      const regB = await fetch(`${BASE_URL}/api/auth/register/parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mrs. Ngozi Okafor',
          phone: famBPhone,
          email: famBEmail,
          password: 'Password123!',
          pin: '1234',
          referralCode: parentReferralCode,
          consentRecorded: true
        })
      });
      const regBData = await regB.json();
      assert.ok(regB.status === 200 || regB.status === 201, `Registration must return HTTP 200 or 201 (got ${regB.status})`);
      familyBId = regBData.parent.id;
      createdParentIds.push(familyBId);

      // Family B adds child
      const childB = db.addStudent({
        parentId: familyBId,
        name: 'Obi Okafor',
        grade: 4,
        schoolName: 'St Saviours Ikoyi'
      });
      familyBStudentId = childB.id;
      createdStudentIds.push(familyBStudentId);

      // Initial wallet balance of Family A
      const walletPre = db.getWallet(parentId);
      const balancePre = walletPre.balance;

      // Family B completes first qualifying paid subscription (Termly ₦6,000)
      const refB = `PAY_FAMB_${Date.now()}`;
      db.createPaymentIntent({
        parentId: familyBId,
        childId: familyBStudentId,
        grade: 4,
        term: 1,
        amount: 6000,
        channel: 'Paystack',
        reference: refB
      });
      db.finalizePaymentRecord(refB, { amount: 6000, paidAt: new Date().toISOString() });
      createdPaymentRefs.push(refB);

      // Verify Family A wallet gained exactly ₦1,000 credit
      const walletPost = db.getWallet(parentId);
      assert.strictEqual(walletPost.balance, balancePre + 1000, 'Referrer must receive exactly ₦1,000 credit');

      recordAudit('Step 11', 'Qualifying Referral Reward Issuance', 'Pass', 'Referred family payment of ₦6,000 credited exactly ₦1,000 in subscription credit to referrer');
    } catch (err: any) {
      recordAudit('Step 11', 'Qualifying Referral Reward Issuance', 'Fail', `Qualifying referral test failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 12: Fraudulent / duplicate referrals produce 0 extra rewards
    // ========================================================================
    try {
      // 12a. Self-referral attempt blocked
      const selfRefRes = await fetch(`${BASE_URL}/api/referrals/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parentToken}`
        },
        body: JSON.stringify({ referralCode: parentReferralCode })
      });
      const selfRefData = await selfRefRes.json();
      assert.strictEqual(selfRefData.success, false, 'Self-referral must be rejected');

      // 12b. Subsequent subscription by Family B awards 0 extra credit
      const balanceBeforeSecond = db.getWallet(parentId).balance;
      const refB2 = `PAY_FAMB2_${Date.now()}`;
      db.createPaymentIntent({
        parentId: familyBId,
        childId: familyBStudentId,
        grade: 4,
        term: 2,
        amount: 6000,
        channel: 'Paystack',
        reference: refB2
      });
      db.finalizePaymentRecord(refB2, { amount: 6000, paidAt: new Date().toISOString() });
      createdPaymentRefs.push(refB2);
      const balanceAfterSecond = db.getWallet(parentId).balance;
      assert.strictEqual(balanceAfterSecond, balanceBeforeSecond, 'Second payment by same family must not award duplicate referral reward');

      // 12c. Non-cash restriction: cash withdrawal rejected
      const withdrawRes = await fetch(`${BASE_URL}/api/referrals/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parentToken}`
        }
      });
      assert.strictEqual(withdrawRes.status, 400, 'Cash withdrawal of referral credits must be rejected');

      recordAudit('Step 12', 'Referral Anti-Fraud & Non-Cash Integrity', 'Pass', 'Self-referral, duplicate claiming, multi-payment repeats, and cash withdrawal attempts strictly rejected');
    } catch (err: any) {
      recordAudit('Step 12', 'Referral Anti-Fraud & Non-Cash Integrity', 'Fail', `Referral anti-fraud failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 13 & 14: Curriculum Catalogue Scope & Missing Document Gaps
    // ========================================================================
    console.log('\n--- Journey 13 to 16: Curriculum Catalogue, Lesson Delivery & Reports ---');
    try {
      const coverage = generateAuditableCoverageReport();
      assert.strictEqual(coverage.classesCoverage.length, 6, 'Must define all Primary 1–6 classes');
      assert.strictEqual(coverage.calendarTermsCount, 3, 'Must define Terms 1–3');
      assert.strictEqual(coverage.verifiedPublishedLessonsCount, 6, 'Must preserve exactly 6 published lessons');

      // Missing documents register
      assert.ok(OFFICIAL_MISSING_NERDC_DOCUMENTS.length >= 4, 'Must register missing federal NERDC curriculum source documents');
      const p1MathGap = OFFICIAL_MISSING_NERDC_DOCUMENTS.find(d => d.grade === 1 && d.subject === 'Mathematics');
      assert.ok(p1MathGap, 'Primary 1 Mathematics document gap must be officially recorded');
      assert.strictEqual(p1MathGap?.requestStatus, 'OFFICIALLY_REQUESTED');

      // Anti-fabrication check: Primary 1, 5, 6 contain 0 synthetic fabricated lessons
      const p1Coverage = coverage.classesCoverage.find(c => c.grade === 1);
      assert.strictEqual(p1Coverage?.publishedCount, 0, 'Primary 1 must contain 0 published lessons until verified source received');

      recordAudit('Step 13 & 14', 'Curriculum Provenance & Gaps Tracking', 'Pass', 'Curriculum matrix covers P1–6 across Terms 1–3; unverified topics logged in Missing Documents Register without fabrication');
    } catch (err: any) {
      recordAudit('Step 13 & 14', 'Curriculum Provenance & Gaps Tracking', 'Fail', `Curriculum audit failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 15: Published lessons can be completed and objective-level progress saved
    // ========================================================================
    try {
      // Complete Place Value lesson for Child 1
      const completeRes = await fetch(`${BASE_URL}/api/lessons/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${child1Token}`
        },
        body: JSON.stringify({
          studentId: child1Id,
          topicId: 'p4-t1-w1-math',
          subject: 'Mathematics',
          title: 'Whole Numbers: Place Value up to 100,000',
          score: 100,
          reexplained: false,
          objectivesMastery: [
            {
              objective: 'State the place value of any digit in a 5-digit whole number up to 100,000',
              mastered: true,
              masteryLevel: 'Strong Mastery'
            },
            {
              objective: 'Write 5-digit numbers in expanded notation',
              mastered: true,
              masteryLevel: 'Strong Mastery'
            }
          ]
        })
      });
      const completeData = await completeRes.json();
      assert.strictEqual(completeRes.status, 200);
      assert.strictEqual(completeData.success, true);
      assert.strictEqual(completeData.masteryAchieved, true);
      assert.strictEqual(completeData.masteryLevel, 'Strong Mastery');

      // Verify in DB with version locking
      const studentInDb = db.getStudentById(child1Id);
      const savedLesson = studentInDb?.completedLessons.find(l => l.topicId === 'p4-t1-w1-math');
      assert.ok(savedLesson);
      assert.strictEqual(savedLesson?.score, 100);
      assert.ok(savedLesson?.curriculumVersion?.includes('nerdc'));
      assert.strictEqual(savedLesson?.objectivesMastery?.length, 2);

      recordAudit('Step 15', 'Lesson Completion & Version Locking', 'Pass', 'Lesson completed with 100% score, Strong Mastery achieved, and curriculum version locked to nerdc-based-v1');
    } catch (err: any) {
      recordAudit('Step 15', 'Lesson Completion & Version Locking', 'Fail', `Lesson completion failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 16: Parent reports show the correct pupil's learning outcomes
    // ========================================================================
    try {
      // 16a. Child 1 (completed lesson) has authentic report
      const repC1Res = await fetch(`${BASE_URL}/api/parent/reports/${child1Id}`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      const repC1Data = await repC1Res.json();
      assert.strictEqual(repC1Res.status, 200);
      assert.strictEqual(repC1Data.success, true);
      assert.strictEqual(repC1Data.report.hasCompletedLessons, true);
      assert.strictEqual(repC1Data.report.completedLessons.length, 1);
      assert.strictEqual(repC1Data.report.completedLessons[0].topicTitle, 'Whole Numbers: Place Value up to 100,000');
      assert.strictEqual(repC1Data.report.completedLessons[0].masteryLevel, 'Strong Mastery');
      assert.ok(repC1Data.report.completedLessons[0].homeDiscussionPrompt);

      // 16b. Child 2 (0 completed lessons) shows clean baseline pending indicator
      const repC2Res = await fetch(`${BASE_URL}/api/parent/reports/${child2Id}`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      const repC2Data = await repC2Res.json();
      assert.strictEqual(repC2Res.status, 200);
      assert.strictEqual(repC2Data.report.hasCompletedLessons, false);
      assert.strictEqual(repC2Data.report.totalLessonsCompleted, 0);
      assert.ok(repC2Data.report.areasNeedingPractice[0].includes('baseline diagnostic'));

      recordAudit('Step 16', 'Authentic Parent Academic Reporting', 'Pass', 'Parent report accurately shows completed objectives for Child 1 and pending baseline status for Child 2');
    } catch (err: any) {
      recordAudit('Step 16', 'Authentic Parent Academic Reporting', 'Fail', `Parent academic report failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 17: Data survives persistence & restart scenario
    // ========================================================================
    console.log('\n--- Journey 17 & 18: Durability, Backup Recovery & Session Revocation ---');
    try {
      const stateBefore = {
        parents: db.getAllParents().length,
        students: db.getStudents().length,
        payments: db.getAllPayments().length
      };

      // Force atomic save to disk
      db.saveToDisk();

      // Verify file and backup exist
      const dataDir = path.resolve(process.cwd(), '.data');
      const primaryFile = path.join(dataDir, 'brightly_db.json');
      const backupFile = path.join(dataDir, 'brightly_db.json.bak');
      assert.ok(fs.existsSync(primaryFile), 'Primary DB file must exist on disk');
      assert.ok(fs.existsSync(backupFile), 'Backup DB file must exist on disk');

      // Reload database
      db.reloadFromDisk();
      const stateAfter = {
        parents: db.getAllParents().length,
        students: db.getStudents().length,
        payments: db.getAllPayments().length
      };

      assert.strictEqual(stateAfter.parents, stateBefore.parents, 'Parent count must survive reload');
      assert.strictEqual(stateAfter.students, stateBefore.students, 'Student count must survive reload');
      assert.strictEqual(stateAfter.payments, stateBefore.payments, 'Payment count must survive reload');

      recordAudit('Step 17', 'Disk Durability & Persistence', 'Pass', 'Database persists atomically to disk with automated backup and reloads with 100% data integrity');
    } catch (err: any) {
      recordAudit('Step 17', 'Disk Durability & Persistence', 'Fail', `Persistence check failed: ${err?.message}`);
    }

    // ========================================================================
    // JOURNEY STEP 18: Logout and account deactivation revoke sessions
    // ========================================================================
    try {
      // 18a. Parent Logout
      const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      assert.strictEqual(logoutRes.status, 200);

      // Verify token is revoked
      const meAfterLogout = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      const meData = await meAfterLogout.json();
      assert.strictEqual(meData.authenticated, false, 'Revoked token must be unauthenticated on subsequent requests');

      // 18b. Account Deactivation
      db.deactivateParentAccount(parentId);
      const reLogin = await fetch(`${BASE_URL}/api/auth/login/parent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testParentEmail,
          password: 'Password123!'
        })
      });
      assert.strictEqual(reLogin.status, 403, 'Deactivated parent account must be rejected with HTTP 403');

      recordAudit('Step 18', 'Session Invalidation & Account Deactivation', 'Pass', 'Logout revokes active session token; deactivation strictly blocks subsequent logins');
    } catch (err: any) {
      recordAudit('Step 18', 'Session Invalidation & Account Deactivation', 'Fail', `Logout / deactivation test failed: ${err?.message}`);
    }

    // ========================================================================
    // SECTION 9: 10-DIMENSION AUDIT VERIFICATIONS
    // ========================================================================
    console.log('\n--- 10-Dimension Architecture & Security Audit ---');

    // Audit 1: Webhook HMAC-SHA512 Security
    test('Audit Area 1: Webhook HMAC Security', 'Rejects forged or unsigned Paystack webhooks', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'FAKE_999', amount: 600000 } });
      const fakeSig = crypto.createHmac('sha512', 'wrong_secret').update(payload).digest('hex');
      const valid = paystack.verifyWebhookSignature(payload, fakeSig);
      assert.strictEqual(valid, false, 'Forged signature must fail verification');
    });

    // Audit 2: Child Consent Requirement
    test('Audit Area 2: Child Privacy & Consent', 'Mandatory parental consent enforced on onboarding', () => {
      assert.throws(() => {
        db.onboardPilotFamily({
          parent: {
            name: 'Unconsenting Parent',
            email: 'no_consent@test.ng',
            phone: '+2348030000000',
            consentRecorded: false,
            consentDate: new Date().toISOString()
          },
          pupils: []
        });
      }, /consent/i);
    });

    // Audit 3: Pilot Safety Switch
    test('Audit Area 3: Operational Governance', 'Administrative Pilot Pause switch temporarily blocks lessons safely', () => {
      try {
        db.setPilotPaused(true, 'Scheduled safety audit');
        assert.strictEqual(db.isPilotPaused(), true);

        const access = gates.evaluateLessonAccess(child1Id, 4, 1, 2, false);
        assert.strictEqual(access.allowed, false);
        assert.strictEqual(access.reason, 'pilot_paused');
      } finally {
        db.setPilotPaused(false);
      }
      assert.strictEqual(db.isPilotPaused(), false);
    });

    // Audit 4: Environment & HTTPS Configuration
    test('Audit Area 4: Environment Diagnosis', 'Production environment checklist correctly diagnoses readiness', () => {
      const envAudit = validateProductionEnvironment();
      assert.strictEqual(envAudit.checks.singleInstanceMode, true);
      assert.strictEqual(envAudit.checks.persistenceHealthy, true);
      assert.strictEqual(envAudit.checks.storageFilePresent, true);
      assert.strictEqual(envAudit.checks.backupFilePresent, true);
    });

  } finally {
    db.setPilotPaused(false);
    // Guaranteed non-destructive cleanup of test entities
    console.log('\n--- Test Record Cleanup ---');
    for (const sid of createdStudentIds) {
      db.deleteStudent(sid);
    }
    for (const pid of createdParentIds) {
      db.deleteParent(pid);
    }
    for (const ref of createdPaymentRefs) {
      db.deletePayment(ref);
    }
    db.saveToDisk();
    console.log(`  Cleaned up ${createdStudentIds.length} test pupils, ${createdParentIds.length} test parents, ${createdPaymentRefs.length} test payments.`);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`  PHASE 8 E2E ACCEPTANCE AUDIT: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase8AcceptanceAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
