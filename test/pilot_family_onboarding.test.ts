import assert from 'node:assert';
import crypto from 'node:crypto';
import { db } from '../server/db';
import { gates } from '../server/gates';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — PILOT FAMILY ONBOARDING & GOVERNANCE TEST');
console.log('================================================================');

async function runOnboardingTestSuite() {
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

  // --- 1. Account Classification Integrity ---
  console.log('\n--- 1. Account Classification Integrity ---');

  test('Classification', 'Existing parent accounts correctly classified as demo or test fixtures', () => {
    const parents = db.getAllParents();
    const parentMain = parents.find(p => p.id === 'parent_main');
    const parentAlt = parents.find(p => p.id === 'parent_alt');
    assert.ok(parentMain);
    assert.ok(parentAlt);
    // Neither represents an actual verified external pilot participant
    assert.notStrictEqual(parentMain?.accountType, 'verified_real_pilot_participant');
    assert.notStrictEqual(parentAlt?.accountType, 'verified_real_pilot_participant');
  });

  test('Classification', 'Pre-configured pupils classified without falsely claiming external status', () => {
    const students = db.getStudents();
    students.forEach(s => {
      // Must NOT be marked as verified real pilot participant unless explicitly onboarded
      assert.notStrictEqual(s.accountType, 'verified_real_pilot_participant');
    });
  });

  // --- 2. Administrator-Controlled Real Family Onboarding ---
  console.log('\n--- 2. Administrator-Controlled Real Family Onboarding ---');

  let testParentId = '';
  let testPupilId = '';

  test('Onboarding', 'Rejects onboarding when mandatory parental consent is not verified', () => {
    assert.throws(() => {
      db.onboardPilotFamily({
        parent: {
          name: 'Mr. Unconsented Parent',
          email: 'unconsented@test.ng',
          phone: '+234 803 000 0000',
          consentRecorded: false,
          consentDate: new Date().toISOString()
        },
        pupils: [{ name: 'Child Without Consent', grade: 4 }]
      });
    }, /parental consent/i);
  });

  test('Onboarding', 'Rejects onboarding with invalid email or phone number', () => {
    assert.throws(() => {
      db.onboardPilotFamily({
        parent: {
          name: 'Mr. Bad Email',
          email: 'notanemail',
          phone: '+234 803 000 0000',
          consentRecorded: true,
          consentDate: new Date().toISOString()
        },
        pupils: [{ name: 'Child', grade: 4 }]
      });
    }, /valid parent email/i);

    assert.throws(() => {
      db.onboardPilotFamily({
        parent: {
          name: 'Mr. Short Phone',
          email: 'valid@test.ng',
          phone: '1234',
          consentRecorded: true,
          consentDate: new Date().toISOString()
        },
        pupils: [{ name: 'Child', grade: 4 }]
      });
    }, /valid contact mobile phone/i);
  });

  test('Onboarding', 'Successfully onboards real family with verified consent and minimum child data', () => {
    const result = db.onboardPilotFamily({
      parent: {
        name: 'Pastor & Mrs. Balogun',
        email: `balogun.family.${Date.now()}@pilot.ng`,
        phone: '+234 803 456 7890',
        pin: '3456',
        consentRecorded: true,
        consentDate: '2026-10-09T08:00:00Z',
        consentNote: 'Signed written consent on file; minimum necessary data recorded.'
      },
      pupils: [
        { name: 'David Balogun', grade: 4, gender: 'boy', pin: '1234' },
        { name: 'Grace Balogun', grade: 3, gender: 'girl', pin: '1234' }
      ]
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.parent.accountType, 'verified_real_pilot_participant');
    assert.strictEqual(result.parent.accountStatus, 'active');
    assert.strictEqual(result.pupils.length, 2);
    assert.strictEqual(result.pupils[0].paymentStatus, 'FREE_PREVIEW');
    assert.strictEqual(result.pupils[0].currentWeek, 1);
    assert.strictEqual(result.pupils[0].accountType, 'verified_real_pilot_participant');

    // Verify secret PIN is NOT returned in the API result
    assert.strictEqual((result.parent as any).pin, undefined);
    assert.strictEqual((result.pupils[0] as any).pin, undefined);

    testParentId = result.parent.id;
    testPupilId = result.pupils[0].id;
  });

  // --- 3. Credential Reset & Security Governance ---
  console.log('\n--- 3. Credential Reset & Security Governance ---');

  test('Governance', 'Administrator can securely reset parent PIN without exposing previous PIN', () => {
    assert.ok(testParentId);
    const reset = db.resetParentPin(testParentId, '8899');
    assert.strictEqual(reset, true);

    const verified = db.verifyParentPin('8899', testParentId);
    assert.strictEqual(verified, true);

    const oldFails = db.verifyParentPin('3456', testParentId);
    assert.strictEqual(oldFails, false);
  });

  test('Governance', 'Administrator can deactivate account and revoke access safely', () => {
    assert.ok(testParentId);
    const deactivated = db.setAccountStatus('parent', testParentId, 'deactivated');
    assert.strictEqual(deactivated, true);

    const parent = db.getParentAccount(testParentId);
    assert.strictEqual(parent.accountStatus, 'deactivated');

    // Reactivate for safety
    db.setAccountStatus('parent', testParentId, 'active');
  });

  // --- 4. Cross-Family Pupil Access Isolation ---
  console.log('\n--- 4. Cross-Family Pupil Access Isolation ---');

  test('Isolation', 'Newly onboarded parent only accesses their own registered children', () => {
    assert.ok(testParentId);
    assert.ok(testPupilId);
    const ownChildren = db.getStudentsByParentId(testParentId);
    assert.strictEqual(ownChildren.length, 2);
    assert.ok(ownChildren.some(c => c.id === testPupilId));
    assert.ok(!ownChildren.some(c => c.id === 'chidi'));
    assert.ok(!ownChildren.some(c => c.id === 'fatima'));
  });

  // Cleanup test family to maintain clean cohort count for baseline tests
  try {
    if (testParentId) {
      const children = db.getStudentsByParentId(testParentId);
      children.forEach(c => db.deleteStudent(c.id));
      db.deleteParent(testParentId);
    }
  } catch {
    // Ignore cleanup
  }

  console.log('\n================================================================');
  console.log(`  ONBOARDING TEST SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runOnboardingTestSuite();
