import { RegulatoryItem } from '../types';

export const REGULATORY_AND_PORTALS: RegulatoryItem[] = [
  {
    id: 'nerdc',
    name: 'NERDC National Curriculum Portal',
    category: 'Curriculum',
    domain: 'nerdc.gov.ng',
    url: 'https://nerdc.gov.ng',
    purpose: 'Access official Primary 1–6 national schemes of work, review standard learning objectives, and ensure 100% curriculum alignment.',
    actionRequired: 'Verify Primary 1–6 NERDC scheme alignment and UBE mastery requirements.',
    status: 'Compliant & Integrated'
  },
  {
    id: 'ndpc',
    name: 'Nigeria Data Protection Commission (NDPC)',
    category: 'Data Protection',
    domain: 'services.ndpc.gov.ng',
    url: 'https://services.ndpc.gov.ng',
    purpose: 'Register Brightly Home Lesson as a Data Controller handling minor/child data under the Nigeria Data Protection Act (NDPA & COPPA).',
    actionRequired: 'Zero child PII collected directly from kids; all auth managed by parent with PIN access.',
    status: 'Verified'
  },
  {
    id: 'cac',
    name: 'Corporate Affairs Commission (CAC iCRP)',
    category: 'Corporate & Tax',
    domain: 'icrp.cac.gov.ng',
    url: 'https://icrp.cac.gov.ng',
    purpose: 'Legal corporate identity registration as a Private Limited Company for Nigerian EdTech services.',
    actionRequired: 'Secure enterprise corporate identity & compliance records.',
    status: 'Verified'
  },
  {
    id: 'firs',
    name: 'FIRS TaxPro-Max System',
    category: 'Corporate & Tax',
    domain: 'taxpromax.firs.gov.ng',
    url: 'https://taxpromax.firs.gov.ng',
    purpose: 'Manage corporate Tax Identification Number (TIN) for tax compliance and enterprise billing.',
    actionRequired: 'Linked with electronic invoicing and VAT filing.',
    status: 'Active Production'
  },
  {
    id: 'paystack',
    name: 'Paystack Payment Gateway',
    category: 'AI & Payments',
    domain: 'dashboard.paystack.com',
    url: 'https://dashboard.paystack.com',
    purpose: 'Manage live subscription plans (₦12,000 termly / ₦30,000 annual) via Card, USSD, Bank Transfer, and secure Webhook verification.',
    actionRequired: 'Live webhook verification `/api/v1/webhooks/paystack` and wallet referral credits.',
    status: 'Active Production'
  },
  {
    id: 'parent_governance',
    name: 'Parent Academic Governance Engine',
    category: 'Infrastructure',
    domain: 'portal.brightly.ng',
    url: 'https://brightly.ng/parent-portal',
    purpose: 'Real-time parent governance hub for termly tuition status, preferred teacher voice tones, and in-app weekly mastery reports.',
    actionRequired: 'Synchronizes registered class tuition clearance and pedagogical preferences.',
    status: 'Active Production'
  },
  {
    id: 'supabase',
    name: 'Supabase PostgreSQL & Auth',
    category: 'Infrastructure',
    domain: 'supabase.com',
    url: 'https://supabase.com',
    purpose: 'Relational database schemas with Row Level Security (RLS) for profiles, subscriptions, lessons, and progress tracking.',
    actionRequired: 'Enforces parent ownership and PIN-protected child profile isolation.',
    status: 'Active Production'
  },
  {
    id: 'groq_gemini',
    name: 'AI Intelligence Engine (Gemini & Groq)',
    category: 'AI & Payments',
    domain: 'ai.google.dev',
    url: 'https://ai.google.dev',
    purpose: 'Dynamic 6-phase lesson synthesis, adaptive re-explanation tutor loop, and diagnostic assessment generator.',
    actionRequired: 'Server-side API routes (`/api/lessons/generate`, `/api/lessons/reexplain`).',
    status: 'Active Production'
  }
];
