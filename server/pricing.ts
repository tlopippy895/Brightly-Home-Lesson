/**
 * Authoritative Server-Side Pricing Configuration for Brightly Home Lesson
 * 
 * Central Source of Truth for:
 * - Monthly: ₦2,500 per child (30 days access)
 * - Termly: ₦6,000 per child (1 Term access)
 * - Annual: ₦18,000 per child (Full session - 3 Terms access)
 * - Founding-Family Annual: ₦15,000 per eligible child (Limited Founding Offer)
 * 
 * Critical Rules:
 * 1. Client-supplied prices are NEVER trusted.
 * 2. Displayed price, initialization amount, and verified amount must strictly match.
 * 3. Never retrospectively alter paid subscriptions or historical ledger records.
 */

export type SubscriptionPlanType = 'monthly' | 'termly' | 'annual' | 'founding_annual';

export interface PricingPlanConfig {
  id: SubscriptionPlanType;
  name: string;
  badge: string;
  priceNaira: number;
  priceKobo: number;
  periodLabel: string;
  durationDays: number;
  description: string;
  termsCovered: number[];
  popular?: boolean;
  isFoundingOffer?: boolean;
  features: string[];
}

export const STANDARD_TUITION_FEES = {
  currency: 'NGN',
  currencySymbol: '₦',
  monthlyPlanFee: 2500,
  termlyPlanFee: 6000,
  annualPlanFee: 18000,
  foundingAnnualPlanFee: 15000,
  // Aliases for comprehensive API consistency
  monthlyPass: 2500,
  termlyTuition: 6000,
  annualTuition: 18000,
  foundingAnnualOffer: 15000,
  monthDurationDays: 30,
  termDurationDays: 100,
  annualDurationDays: 365,
};

export const BRIGHTLY_PRICING_PLANS: Record<SubscriptionPlanType, PricingPlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Flexible Pass',
    badge: 'Flexible Monthly Access',
    priceNaira: 2500,
    priceKobo: 250000,
    periodLabel: 'per child / month',
    durationDays: 30,
    description: '30 days full access to all published subjects for the child’s enrolled class with daily 30-minute lessons and progress tracking.',
    termsCovered: [1, 2, 3],
    features: [
      '30 days active access from payment date',
      'All 6 Core Nigerian primary subjects unlocked for enrolled class',
      'Interactive Whiteboard & Teacher Speech Engine',
      'Adaptive AI Re-Explanation Tutor interventions',
      'Continuous diagnostic progress reports',
      'No automatic recurring card debits (prepaid access)'
    ]
  },
  termly: {
    id: 'termly',
    name: 'Termly Single Pass',
    badge: '1 Child • 1 Academic Term',
    priceNaira: 6000,
    priceKobo: 600000,
    periodLabel: 'per child / term',
    durationDays: 100,
    description: 'Full term access to all published subjects for the enrolled class for the selected academic term (Term 1, 2, or 3).',
    termsCovered: [1], // Applied to the purchased term
    popular: true,
    features: [
      'Full Term syllabus access (100 days coverage)',
      'All 6 Core Nigerian primary subjects unlocked for enrolled class',
      'Interactive Whiteboard & Teacher Speech Engine',
      'Adaptive AI Re-Explanation Tutor interventions',
      'Parent Diagnostic Progress Reports & weekly summaries',
      'Official NERDC Scheme of Work compliance'
    ]
  },
  annual: {
    id: 'annual',
    name: 'Annual Master Session Pass',
    badge: 'Full Session • 3 Terms Complete',
    priceNaira: 18000,
    priceKobo: 1800000,
    periodLabel: 'per child / academic year',
    durationDays: 365,
    description: 'Complete 3-term academic year access for one child across all published subjects with revision and continuous diagnostic mastery.',
    termsCovered: [1, 2, 3],
    features: [
      'All 3 Terms unlocked (First, Second, and Third Term)',
      'Full 365-day academic session coverage',
      'All 6 Core Subjects unlocked simultaneously',
      'National Common Entrance Examination revision modules',
      'Unlimited Adaptive Re-Teaching Interventions',
      'Full Parent Governance & Exportable Tuition Receipts'
    ]
  },
  founding_annual: {
    id: 'founding_annual',
    name: 'Founding-Family Annual Offer',
    badge: 'Limited Founding Offer • Save ₦3,000',
    priceNaira: 15000,
    priceKobo: 1500000,
    periodLabel: 'per eligible child / academic year',
    durationDays: 365,
    description: 'Special early pilot founding family offer covering all 3 terms (full session) at a discounted rate of ₦15,000.',
    termsCovered: [1, 2, 3],
    isFoundingOffer: true,
    features: [
      'Exclusive ₦15,000 founding-family rate (saves ₦3,000 off standard ₦18,000 annual)',
      'All 3 Terms unlocked (Full Academic Session)',
      'Full 365-day access for one enrolled child',
      'Direct line to Brightly educational advisory support',
      'Guaranteed pricing protection for subsequent academic terms',
      'Official verified Paystack payment receipt'
    ]
  }
};

/**
 * Returns the authoritative plan price in Naira
 */
export function getAuthoritativePlanPrice(planType: string, isFoundingFamily: boolean = false): number {
  if (planType === 'monthly') {
    return STANDARD_TUITION_FEES.monthlyPlanFee;
  }
  if (planType === 'founding_annual' || (planType === 'annual' && isFoundingFamily)) {
    return STANDARD_TUITION_FEES.foundingAnnualPlanFee;
  }
  if (planType === 'annual') {
    return STANDARD_TUITION_FEES.annualPlanFee;
  }
  // Default to termly
  return STANDARD_TUITION_FEES.termlyPlanFee;
}

/**
 * Returns the authoritative duration in days for the plan
 */
export function getPlanDurationDays(planType: string): number {
  if (planType === 'monthly') return STANDARD_TUITION_FEES.monthDurationDays;
  if (planType === 'annual' || planType === 'founding_annual') return STANDARD_TUITION_FEES.annualDurationDays;
  return STANDARD_TUITION_FEES.termDurationDays;
}

/**
 * Returns a descriptive title for the invoice/receipt
 */
export function getPlanTitle(planType: string, term?: number): string {
  switch (planType) {
    case 'monthly':
      return 'Brightly Home Lesson — 30-Day Flexible Monthly Pass';
    case 'annual':
      return 'Brightly Home Lesson — Annual Master Session Pass (3 Terms)';
    case 'founding_annual':
      return 'Brightly Home Lesson — Founding-Family Annual Pass (3 Terms)';
    case 'termly':
    default:
      return `Brightly Home Lesson — Term ${term || 1} Learning Plan`;
  }
}
