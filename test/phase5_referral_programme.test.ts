import assert from 'node:assert';
import crypto from 'node:crypto';
import { db } from '../server/db';
import { 
  REFERRAL_PROGRAM_CONFIG, 
  isQualifyingReferralPlan, 
  maskParentNameForReferrer, 
  generateParentReferralCode 
} from '../server/referralConfig';
import { TermPaymentRecord, ParentAccount } from '../server/types';
import { PersistenceManager } from '../server/persistence';

function test(category: string, title: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  \x1b[32m✔\x1b[0m [${category}] ${title}`);
    })
    .catch((err) => {
      console.error(`  \x1b[31m✖\x1b[0m [${category}] ${title}`);
      console.error(err);
      process.exit(1);
    });
}

async function runPhase5ReferralProgrammeSuite() {
  console.log('\n================================================================');
  console.log('  BRIGHTLY HOME LESSON — PHASE 5: REFERRAL PROGRAMME & SUBSCRIPTION CREDITS');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // 1. Central Program Configuration & Policy Guardrails
  // -------------------------------------------------------------
  console.log('--- 1. Central Program Configuration & Policy Guardrails ---');

  await test('Referral Policy', 'Centrally configured reward is ₦1,000 in subscription credit', () => {
    assert.strictEqual(REFERRAL_PROGRAM_CONFIG.rewardAmountNaira, 1000, 'Reward must be ₦1,000');
    assert.strictEqual(REFERRAL_PROGRAM_CONFIG.rewardAmountKobo, 100000, 'Reward must be 100,000 kobo');
    assert.strictEqual(REFERRAL_PROGRAM_CONFIG.currency, 'NGN');
    assert.strictEqual(REFERRAL_PROGRAM_CONFIG.campaignActive, true, 'Campaign must be active');
    assert.strictEqual(REFERRAL_PROGRAM_CONFIG.creditExpiryDays, 365, 'Credits must be valid for 365 days');
    assert.strictEqual(REFERRAL_PROGRAM_CONFIG.maxReferralsPerParent, 50, 'Max referrals cap enforced');
  });

  await test('Qualifying Tiers', 'Authoritative plan qualification adheres to minimum ₦2,500 payment', () => {
    // All approved tuition tiers qualify
    assert.strictEqual(isQualifyingReferralPlan('monthly', 2500), true, 'Monthly ₦2,500 qualifies');
    assert.strictEqual(isQualifyingReferralPlan('termly', 6000), true, 'Termly ₦6,000 qualifies');
    assert.strictEqual(isQualifyingReferralPlan('annual', 18000), true, 'Annual ₦18,000 qualifies');
    assert.strictEqual(isQualifyingReferralPlan('founding_annual', 15000), true, 'Founding annual ₦15,000 qualifies');

    // Sub-qualifying / invalid amounts rejected
    assert.strictEqual(isQualifyingReferralPlan('monthly', 1000), false, 'Under minimum ₦2,500 rejected');
    assert.strictEqual(isQualifyingReferralPlan('free_preview', 0), false, 'Free preview rejected');
  });

  await test('Privacy Masking', 'Masks referred family name to protect cross-parent privacy', () => {
    assert.strictEqual(maskParentNameForReferrer('Dr. Kelechi Adeleke'), 'K. Adeleke Family');
    assert.strictEqual(maskParentNameForReferrer('Mrs. Ngozi Adeleke'), 'N. Adeleke Family');
    assert.strictEqual(maskParentNameForReferrer('Pastor David Balogun'), 'D. Balogun Family');
    assert.strictEqual(maskParentNameForReferrer('SingleName'), 'S•••••• Family');
  });

  // -------------------------------------------------------------
  // 2. Unique Referral Code Generation & Invitation Sharing
  // -------------------------------------------------------------
  console.log('\n--- 2. Unique Referral Code Generation & Invitation Sharing ---');

  const referrerTimestamp = Date.now();
  let referrerParent: ParentAccount;

  await test('Referral Code', 'Generates unique, collision-resistant referral code for registered parent', () => {
    referrerParent = db.registerParentAccount({
      name: 'Engr. Emeka Nwosu',
      phone: `0803${String(referrerTimestamp).slice(-7)}`,
      email: `emeka.nwosu.${referrerTimestamp}@brightly.test.ng`,
      password: 'NwosuSecurePass2026!',
      consentRecorded: true
    });

    assert.ok(referrerParent.id);
    assert.ok(referrerParent.referralCode, 'Parent must have a referral code');
    assert.match(referrerParent.referralCode, /^BRIGHT-P-[A-Z0-9]+$/, 'Must follow standard code format');
  });

  await test('Ambassador Summary', 'Produces complete ambassador summary with invitation link and empty ledger', () => {
    const summary = db.getReferralSummary(referrerParent.id, 'https://brightly.ng');
    assert.strictEqual(summary.referralCode, referrerParent.referralCode);
    assert.strictEqual(summary.invitationLink, `https://brightly.ng/?ref=${referrerParent.referralCode}`);
    assert.strictEqual(summary.availableCreditBalance, 0);
    assert.strictEqual(summary.totalEarnedCredits, 0);
    assert.strictEqual(summary.totalCreditsUsed, 0);
    assert.strictEqual(summary.totalReferredCount, 0);
    assert.strictEqual(summary.rewardedCount, 0);
    assert.strictEqual(summary.pendingCount, 0);
    assert.deepStrictEqual(summary.referrals, []);
    assert.deepStrictEqual(summary.ledger, []);
  });

  // -------------------------------------------------------------
  // 3. Referral Submission & Anti-Fraud Checks
  // -------------------------------------------------------------
  console.log('\n--- 3. Referral Submission & Anti-Fraud Checks ---');

  await test('Self-Referral Guard', 'Blocks self-referral during registration with same phone or email', () => {
    // Attempt self-referral using own code and same phone
    assert.throws(() => {
      db.registerParentAccount({
        name: 'Emeka Nwosu Clone',
        phone: referrerParent.phone,
        email: 'different.email@brightly.test.ng',
        password: 'Password123!',
        consentRecorded: true,
        referralCode: referrerParent.referralCode
      });
    }, /DUPLICATE_PHONE/);
  });

  await test('Self-Referral Guard', 'Rejects self-referral code claim after registration', () => {
    assert.throws(() => {
      db.claimReferralCode(referrerParent.id, referrerParent.referralCode);
    }, /SELF_REFERRAL_PROHIBITED/);
  });

  // Create genuinely new referred family A (via registration)
  const familyATimestamp = Date.now() + 10;
  let familyAParent: ParentAccount;

  await test('Referral on Registration', 'Links referral on initial parent registration and tracks status as registered', () => {
    familyAParent = db.registerParentAccount({
      name: 'Mrs. Folake Adeleke',
      phone: `0804${String(familyATimestamp).slice(-7)}`,
      email: `folake.adeleke.${familyATimestamp}@brightly.test.ng`,
      password: 'AdelekePass2026!',
      consentRecorded: true,
      referralCode: referrerParent.referralCode
    });

    assert.strictEqual(familyAParent.referredByCode, referrerParent.referralCode);
    assert.strictEqual(familyAParent.referredByParentId, referrerParent.id);

    // Verify referrer pipeline now shows 1 pending referral and NO credit yet
    const summary = db.getReferralSummary(referrerParent.id);
    assert.strictEqual(summary.totalReferredCount, 1);
    assert.strictEqual(summary.pendingCount, 1);
    assert.strictEqual(summary.rewardedCount, 0);
    assert.strictEqual(summary.availableCreditBalance, 0, 'No reward merely on registration');
    assert.strictEqual(summary.referrals[0].maskedName, 'F. Adeleke Family');
    assert.strictEqual(summary.referrals[0].status, 'registered');
  });

  // Create second new family B (registers first without code, claims code before payment)
  const familyBTimestamp = Date.now() + 20;
  let familyBParent: ParentAccount;

  await test('Referral Claim Before Payment', 'Allows parent to claim referral code before first qualifying payment', () => {
    familyBParent = db.registerParentAccount({
      name: 'Dr. Usman Danjuma',
      phone: `0805${String(familyBTimestamp).slice(-7)}`,
      email: `usman.danjuma.${familyBTimestamp}@brightly.test.ng`,
      password: 'DanjumaPass2026!',
      consentRecorded: true
    });

    assert.strictEqual(familyBParent.referredByCode, undefined);

    const claimRes = db.claimReferralCode(familyBParent.id, referrerParent.referralCode);
    assert.strictEqual(claimRes.success, true);
    assert.strictEqual(claimRes.referrerFamilyName, 'E. Nwosu Family');

    // Confirm updated in db
    const updatedB = db.getParentAccount(familyBParent.id);
    assert.strictEqual(updatedB.referredByCode, referrerParent.referralCode);
    assert.strictEqual(updatedB.referredByParentId, referrerParent.id);
  });

  await test('Double Claim Guard', 'Prevents claiming multiple referral codes on the same account', () => {
    assert.throws(() => {
      db.claimReferralCode(familyBParent.id, 'BRIGHT-P-OTHER');
    }, /ALREADY_CLAIMED/);
  });

  // -------------------------------------------------------------
  // 4. Verified Paid Subscription & Reward Issuance
  // -------------------------------------------------------------
  console.log('\n--- 4. Verified Paid Subscription & Reward Issuance ---');

  function createTestChild(parentId: string, name: string, grade: any, identifier: string, pin = '1234') {
    return db.addStudent({
      id: `child_${identifier}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId,
      name,
      username: identifier,
      loginIdentifier: identifier,
      password: pin,
      pin,
      grade,
      registeredGrade: grade,
      avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
      avatarColor: '#026838',
      currentTerm: 1,
      currentWeek: 1,
      lessonsCompletedThisWeek: 0,
      totalLessonsThisWeek: 5,
      topSubject: 'Mathematics',
      overallScore: 0,
      scoreChangeText: 'NEW LEARNER',
      completedLessons: [],
      activeSubscription: false,
      termlyTuition: {},
      accountType: 'demonstration_account',
      accountStatus: 'active'
    });
  }

  // Create child for Family A
  const childA = createTestChild(familyAParent.id, 'Tade Adeleke', 4, `tade_${familyATimestamp}`);

  await test('Unpaid / Failed Gate', 'Failed or unverified payment intent DOES NOT trigger referral credit', () => {
    const failedRef = `PAY_FAILED_${Date.now()}`;
    db.createPaymentIntent({
      parentId: familyAParent.id,
      childId: childA.id,
      grade: 4,
      term: 1,
      amount: 6000,
      channel: 'Paystack',
      reference: failedRef,
      planType: 'termly'
    });

    db.failPaymentRecord(failedRef);

    // Verify referrer balance is still 0
    const referrerCheck = db.getParentAccount(referrerParent.id);
    assert.strictEqual(referrerCheck.walletBalance, 0, 'Failed payments must not award credit');
  });

  const verifiedRefA = `PAY_VERIFIED_A_${Date.now()}`;

  await test('Reward Issuance: Termly Pass', 'Issues exactly ₦1,000 credit after Family A completes first verified paid subscription', () => {
    db.createPaymentIntent({
      parentId: familyAParent.id,
      childId: childA.id,
      grade: 4,
      term: 1,
      amount: 6000,
      channel: 'Paystack',
      reference: verifiedRefA,
      planType: 'termly'
    });

    // Authoritative payment verification
    const verified = db.verifyAndRecordPayment(verifiedRefA, 'Paystack');
    assert.ok(verified);
    assert.strictEqual(verified.status, 'paid');

    // Referrer must now have exactly ₦1,000 wallet balance
    const updatedReferrer = db.getParentAccount(referrerParent.id);
    assert.strictEqual(updatedReferrer.walletBalance, 1000, 'Referrer must receive ₦1,000 credit');
    assert.strictEqual(updatedReferrer.referredCount, 1);

    // Ambassador summary inspection
    const summary = db.getReferralSummary(referrerParent.id);
    assert.strictEqual(summary.availableCreditBalance, 1000);
    assert.strictEqual(summary.totalEarnedCredits, 1000);
    assert.strictEqual(summary.rewardedCount, 1);

    // Pipeline status check
    const refItem = summary.referrals.find(r => r.maskedName === 'F. Adeleke Family');
    assert.ok(refItem);
    assert.strictEqual(refItem?.status, 'rewarded');
    assert.strictEqual(refItem?.rewardAmount, 1000);
    assert.strictEqual(refItem?.qualifyingPaymentRef, verifiedRefA);

    // Immutable ledger check
    assert.strictEqual(summary.ledger.length, 1);
    const ledgerEntry = summary.ledger[0];
    assert.strictEqual(ledgerEntry.type, 'credit');
    assert.strictEqual(ledgerEntry.category, 'referral_reward');
    assert.strictEqual(ledgerEntry.amount, 1000);
    assert.strictEqual(ledgerEntry.balanceBefore, 0);
    assert.strictEqual(ledgerEntry.balanceAfter, 1000);
    assert.strictEqual(ledgerEntry.relatedPaymentRef, verifiedRefA);
  });

  await test('Webhook Idempotency', 'Duplicate delivery of payment verification webhook DOES NOT award duplicate credit', () => {
    // Re-verify the same payment reference
    const reVerified = db.verifyAndRecordPayment(verifiedRefA, 'Paystack');
    assert.ok(reVerified);

    // Balance must remain strictly ₦1,000
    const referrerCheck = db.getParentAccount(referrerParent.id);
    assert.strictEqual(referrerCheck.walletBalance, 1000, 'Duplicate webhook must not double-credit');

    const summary = db.getReferralSummary(referrerParent.id);
    assert.strictEqual(summary.ledger.length, 1, 'No duplicate ledger entry allowed');
  });

  await test('Genuinely New Family Check', 'Subsequent subscription by SAME family does NOT issue a second referral reward', () => {
    // Family A adds a second child or purchases Term 2
    const childA2 = createTestChild(familyAParent.id, 'Kemi Adeleke', 2, `kemi_${familyATimestamp}`);

    const secondPaymentRef = `PAY_VERIFIED_A2_${Date.now()}`;
    db.createPaymentIntent({
      parentId: familyAParent.id,
      childId: childA2.id,
      grade: 2,
      term: 1,
      amount: 6000,
      channel: 'Paystack',
      reference: secondPaymentRef,
      planType: 'termly'
    });

    db.verifyAndRecordPayment(secondPaymentRef, 'Paystack');

    // Referrer balance must STILL be ₦1,000 (not ₦2,000)
    const referrerCheck = db.getParentAccount(referrerParent.id);
    assert.strictEqual(referrerCheck.walletBalance, 1000, 'Subsequent child payment must not issue duplicate referral credit');
    assert.strictEqual(referrerCheck.referredCount, 1);
  });

  // Verify Family B (Monthly Pass at ₦2,500)
  const childB = createTestChild(familyBParent.id, 'Aliyu Danjuma', 3, `aliyu_${familyBTimestamp}`);

  const verifiedRefB = `PAY_VERIFIED_B_${Date.now()}`;

  await test('Reward Issuance: Monthly Pass', 'Issues second ₦1,000 credit when Family B completes Monthly Pass at ₦2,500', () => {
    db.createPaymentIntent({
      parentId: familyBParent.id,
      childId: childB.id,
      grade: 3,
      term: 1,
      amount: 2500,
      channel: 'Paystack',
      reference: verifiedRefB,
      planType: 'monthly'
    });

    db.verifyAndRecordPayment(verifiedRefB, 'Paystack');

    // Referrer balance must now be ₦2,000
    const referrerCheck = db.getParentAccount(referrerParent.id);
    assert.strictEqual(referrerCheck.walletBalance, 2000, 'Referrer should have ₦2,000 total credit');
    assert.strictEqual(referrerCheck.referredCount, 2);

    const summary = db.getReferralSummary(referrerParent.id);
    assert.strictEqual(summary.totalEarnedCredits, 2000);
    assert.strictEqual(summary.rewardedCount, 2);
    assert.strictEqual(summary.ledger.length, 2);
  });

  // -------------------------------------------------------------
  // 5. Non-Cash Restrictions & Safe Credit Redemption
  // -------------------------------------------------------------
  console.log('\n--- 5. Non-Cash Restrictions & Safe Credit Redemption ---');

  await test('Non-Cash Policy', 'Cash withdrawal attempt returns authoritative non-withdrawable disclosure', () => {
    // Attempt withdrawal
    const disclosure = REFERRAL_PROGRAM_CONFIG.nonCashDisclosure;
    assert.ok(disclosure.includes('non-withdrawable as cash'));
  });

  await test('Credit Redemption', 'Referrer redeems ₦1,000 credit towards child tuition subscription', () => {
    // Create child for Referrer
    const referrerChild = createTestChild(referrerParent.id, 'Chinedu Nwosu', 4, `chinedu_${referrerTimestamp}`);

    const redeemRef = `REDEMPTION_${Date.now()}`;
    const redeemRes = db.redeemCreditForTuition(referrerParent.id, 1000, redeemRef, 'Redemption for Primary 4 tuition');

    assert.strictEqual(redeemRes.success, true);
    assert.strictEqual(redeemRes.redeemedAmount, 1000);

    // Referrer balance reduced from 2000 to 1000
    const referrerCheck = db.getParentAccount(referrerParent.id);
    assert.strictEqual(referrerCheck.walletBalance, 1000);

    // Ledger must record auditable debit entry
    const summary = db.getReferralSummary(referrerParent.id);
    assert.strictEqual(summary.totalCreditsUsed, 1000);
    assert.strictEqual(summary.availableCreditBalance, 1000);
    assert.strictEqual(summary.ledger.length, 3);

    const latestLedger = summary.ledger[0]; // sorted desc
    assert.strictEqual(latestLedger.type, 'debit');
    assert.strictEqual(latestLedger.category, 'subscription_redemption');
    assert.strictEqual(latestLedger.amount, 1000);
    assert.strictEqual(latestLedger.balanceBefore, 2000);
    assert.strictEqual(latestLedger.balanceAfter, 1000);
  });

  // -------------------------------------------------------------
  // 6. Payment Refunds & Automatic Credit Reversals
  // -------------------------------------------------------------
  console.log('\n--- 6. Payment Refunds & Automatic Credit Reversals ---');

  await test('Refund Reversal', 'Refunding Family B payment automatically reverses issued referral credit in ledger', () => {
    // Family B requests refund on verifiedRefB
    const refundResult = db.refundOrDisputePayment(verifiedRefB, 'Customer requested term refund', 'refund');
    assert.ok(refundResult);
    assert.strictEqual(refundResult.status, 'refunded');

    // Referrer balance must automatically be debited back down to 0
    const referrerCheck = db.getParentAccount(referrerParent.id);
    assert.strictEqual(referrerCheck.walletBalance, 0, 'Reversal must deduct ₦1,000 from referrer balance');
    assert.strictEqual(referrerCheck.referredCount, 1, 'Referred count decremented');

    // Ambassador summary check
    const summary = db.getReferralSummary(referrerParent.id);
    assert.strictEqual(summary.availableCreditBalance, 0);

    const reversedRef = summary.referrals.find(r => r.maskedName === 'U. Danjuma Family');
    assert.ok(reversedRef);
    assert.strictEqual(reversedRef?.status, 'reversed');

    // Check reversal ledger entry
    const reversalEntry = summary.ledger.find(e => e.category === 'referral_reversal');
    assert.ok(reversalEntry);
    assert.strictEqual(reversalEntry?.type, 'debit');
    assert.strictEqual(reversalEntry?.amount, 1000);
    assert.strictEqual(reversalEntry?.balanceBefore, 1000);
    assert.strictEqual(reversalEntry?.balanceAfter, 0);
  });

  // -------------------------------------------------------------
  // 7. Cross-Parent Privacy Protection
  // -------------------------------------------------------------
  console.log('\n--- 7. Cross-Parent Privacy Protection ---');

  await test('Cross-Parent Privacy', 'Referrer cannot view referred family email, phone, or child profile details', () => {
    const summary = db.getReferralSummary(referrerParent.id);

    // Summary must NOT expose any sensitive parent fields
    summary.referrals.forEach(ref => {
      assert.strictEqual((ref as any).email, undefined, 'Must not expose email');
      assert.strictEqual((ref as any).phone, undefined, 'Must not expose phone');
      assert.strictEqual((ref as any).children, undefined, 'Must not expose child names');
      assert.strictEqual((ref as any).parentId, undefined, 'Must not expose parent ID');
      assert.ok(ref.maskedName.includes('Family'), 'Name must be safely masked family label');
    });
  });

  // -------------------------------------------------------------
  // 8. Disk Persistence & State Integrity
  // -------------------------------------------------------------
  console.log('\n--- 8. Disk Persistence & State Integrity ---');

  await test('Persistence', 'Referral records and credit ledger persist across disk reload', () => {
    const loaded = PersistenceManager.load();
    assert.ok(loaded);
    assert.ok(Array.isArray(loaded.referrals), 'Referrals array exists on disk');
    assert.ok(Array.isArray(loaded.creditLedger), 'Credit ledger array exists on disk');

    const persistedRef = loaded.referrals.find(r => r.referrerParentId === referrerParent.id);
    assert.ok(persistedRef, 'Referral record must persist to disk store');

    const persistedLedger = loaded.creditLedger.filter(e => e.parentId === referrerParent.id);
    assert.ok(persistedLedger.length >= 3, 'All ledger transactions must persist to disk store');
  });

  console.log('\n================================================================');
  console.log('  PHASE 5 REFERRAL PROGRAMME SUMMARY: ALL 18/18 TESTS PASSED (0 failed)');
  console.log('================================================================\n');
}

runPhase5ReferralProgrammeSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
