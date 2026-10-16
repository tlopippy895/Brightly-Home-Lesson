/**
 * Authoritative Central Referral Programme Configuration
 * Brightly Home Lesson — Nigerian Primary Tutoring Ecosystem
 * 
 * Rules:
 * - ₦1,000 in subscription credit for each successful qualifying referral.
 * - Issued ONLY after a genuinely new family completes a qualifying, verified paid subscription.
 * - Non-cash credit strictly applicable towards future pupil tuition subscriptions.
 * - Prevents self-referrals, duplicate rewards, duplicate webhook credits, and test-payment exploits.
 * - Automatic reversal upon payment refund or chargeback.
 */

export const REFERRAL_PROGRAM_CONFIG = {
  // Reward details
  rewardAmountNaira: 1000,
  rewardAmountKobo: 100000,
  refereeWelcomeDiscountNaira: 1000, // Optional ₦1,000 checkout discount for new family
  currency: 'NGN',
  currencySymbol: '₦',

  // Campaign parameters
  campaignActive: true,
  campaignName: 'Brightly Family Ambassador Programme 2026',
  campaignStartDate: '2025-01-01T00:00:00Z',
  campaignEndDate: '2027-12-31T23:59:59Z',

  // Program limits & restrictions
  maxReferralsPerParent: 50,
  maxCreditPerParentNaira: 50000,
  creditExpiryDays: 365,

  // Qualifying subscriptions
  qualifyingPlans: ['monthly', 'termly', 'annual', 'founding_annual'] as const,
  minimumQualifyingPaymentNaira: 2500,

  // Disclosure and legal copy for parents
  nonCashDisclosure: 'Subscription credits are strictly non-withdrawable as cash and apply exclusively towards future Brightly tuition subscriptions.',
  
  terms: [
    'Earn ₦1,000 in subscription credit for each genuinely new family that joins through your invitation link or code.',
    'Reward is issued immediately after the new family completes and verifies their first paid subscription pass (Monthly, Termly, or Annual).',
    'No reward is created merely upon registration or invitation link clicks; a verified qualifying tuition payment is mandatory.',
    'Self-referrals (referring your own alternate phone, email, or family accounts) are strictly prohibited and automatically blocked.',
    'Credits are added to your digital parent tuition balance and can be redeemed towards any future term or session passes.',
    'Credits cannot be withdrawn as cash or transferred to external bank accounts.',
    'If a qualifying subscription is refunded, disputed, or charged back, associated referral credits are automatically reversed in the ledger.',
    'Referral credits remain valid for 365 calendar days from the date of issue.'
  ]
};

export type QualifyingPlanType = typeof REFERRAL_PROGRAM_CONFIG.qualifyingPlans[number];

/**
 * Checks whether a given plan type qualifies for referral rewards
 */
export function isQualifyingReferralPlan(planType?: string, amountNaira?: number): boolean {
  if (!REFERRAL_PROGRAM_CONFIG.campaignActive) return false;
  
  if (amountNaira !== undefined && amountNaira < REFERRAL_PROGRAM_CONFIG.minimumQualifyingPaymentNaira) {
    return false;
  }

  if (planType && REFERRAL_PROGRAM_CONFIG.qualifyingPlans.includes(planType as any)) {
    return true;
  }

  // Fallback to checking minimum payment amount
  return (amountNaira || 0) >= REFERRAL_PROGRAM_CONFIG.minimumQualifyingPaymentNaira;
}

/**
 * Generates an authentic Nigerian family masked display name for privacy protection
 */
export function maskParentNameForReferrer(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return 'Referred Family';
  
  // Filter out titles and honorifics
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(w => !/^(mr|mrs|ms|dr|chief|pastor|barrister|prof|alhaji|alhajia|engineer|engr)\.?$/i.test(w));

  if (words.length === 0) {
    return 'Referred Family';
  }

  if (words.length === 1) {
    const name = words[0];
    return `${name.charAt(0)}•••••• Family`;
  }

  const firstName = words[0];
  const lastName = words[words.length - 1];
  const firstInitial = firstName.charAt(0).toUpperCase();
  
  return `${firstInitial}. ${lastName} Family`;
}

/**
 * Generates an uppercase alphanumeric referral code for parent
 */
export function generateParentReferralCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BRIGHT-P-${randomPart}`;
}
