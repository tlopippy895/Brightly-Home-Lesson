import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Download, 
  Lock, 
  Wallet,
  Receipt,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { StudentProfile, GradeLevel } from '../types';
import { api } from '../services/api';

interface PaymentSubscriptionViewProps {
  activeStudent: StudentProfile;
  students: StudentProfile[];
  walletBalance: number;
  onPaymentSuccess: (term: number, grade: GradeLevel, amount: number) => void;
  onSelectStudent?: (student: StudentProfile) => void;
}

interface PackagePlan {
  id: 'termly' | 'annual' | 'family';
  name: string;
  badge: string;
  priceNaira: number;
  periodLabel: string;
  description: string;
  popular?: boolean;
  features: string[];
}

const PACKAGES: PackagePlan[] = [
  {
    id: 'termly',
    name: 'Termly Single Pass',
    badge: '1 Child • 1 Term',
    priceNaira: 6000,
    periodLabel: 'per child / term',
    description: 'Full term access to all 6 NERDC subjects for one child, including adaptive tutor and daily 30-min lessons.',
    features: [
      'Full Term 1, 2, or 3 syllabus access',
      'All 6 Core Nigerian primary subjects',
      'Interactive Whiteboard & Speech Engine',
      'Adaptive AI Re-Explanation Tutor',
      'Parent Diagnostic Progress Reports',
    ],
  },
  {
    id: 'annual',
    name: 'Annual Master Pass',
    badge: 'Best Value • 1 Session (3 Terms)',
    priceNaira: 15000,
    periodLabel: 'per child / academic year',
    description: 'Complete 3 terms (Full Session) access with ₦3,000 discount (normally ₦18,000), comprehensive revision, and continuous diagnostic mastery.',
    popular: true,
    features: [
      'All 3 Terms (Full Session Complete)',
      'Saves ₦3,000 compared to termly payments (₦15,000 vs ₦18,000)',
      'All 6 Core Subjects unlocked',
      'National Common Entrance revision modules',
      'Unlimited Adaptive Re-Teaching Interventions',
      'Full Parent Governance & Exportable Receipts',
    ],
  },
  {
    id: 'family',
    name: 'Multi-Child Family Pass',
    badge: 'Up to 3 Children • Full Session',
    priceNaira: 28000,
    periodLabel: 'per session (up to 3 children)',
    description: 'Comprehensive annual pass covering up to 3 siblings across Primary 1 to 6 with separate profiles, independent pace, and reports.',
    features: [
      'Up to 3 Enrolled Children profiles',
      'All Grades Primary 1–6 unlocked simultaneously',
      'Individual personalized learning pace',
      'Independent voice preferences & teacher assignment',
      'Consolidated Parent Billing & Tax Invoices',
    ],
  },
];

export const PaymentSubscriptionView: React.FC<PaymentSubscriptionViewProps> = ({
  activeStudent,
  students,
  walletBalance,
  onPaymentSuccess,
  onSelectStudent,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'termly' | 'annual' | 'family'>('termly');
  const [targetStudentId, setTargetStudentId] = useState<string>(activeStudent.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentChannel, setPaymentChannel] = useState<'paystack' | 'wallet'>('paystack');
  const [confirmedReceipt, setConfirmedReceipt] = useState<{
    receiptNo: string;
    studentName: string;
    grade: GradeLevel;
    term: number;
    amount: number;
    channel: string;
    paidAt: string;
  } | null>(null);

  const targetStudent = students.find(s => s.id === targetStudentId) || activeStudent;
  const selectedPlan = PACKAGES.find(p => p.id === selectedPlanId) || PACKAGES[0];

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const termToPay = targetStudent.currentTerm || 1;

      if (paymentChannel === 'wallet') {
        const response = await api.payTuition(
          targetStudent.id,
          targetStudent.grade,
          termToPay,
          selectedPlan.priceNaira,
          'Wallet'
        );

        if (response && response.success) {
          setConfirmedReceipt({
            receiptNo: response.receipt?.receiptNo || `BRT-WAL-${Date.now().toString().slice(-6)}`,
            studentName: targetStudent.name,
            grade: targetStudent.grade,
            term: termToPay,
            amount: selectedPlan.priceNaira,
            channel: 'Parent Digital Wallet',
            paidAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          });
          onPaymentSuccess(termToPay, targetStudent.grade, selectedPlan.priceNaira);
        } else {
          setErrorMessage(response?.message || 'Payment from wallet could not be completed. Please check your wallet balance.');
        }
        return;
      }

      // Paystack Flow
      const initResponse = await api.initializePaystack({
        studentId: targetStudent.id,
        grade: targetStudent.grade,
        term: termToPay,
        planType: selectedPlanId === 'annual' ? 'annual' : 'termly'
      });

      if (!initResponse.success || !initResponse.reference) {
        setErrorMessage(initResponse.message || 'Could not connect to Paystack payment gateway.');
        return;
      }

      const reference = initResponse.reference;
      const publicKey = initResponse.publicKey || (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';
      const paystackPop = (window as any).PaystackPop;

      if (paystackPop && publicKey) {
        const handler = paystackPop.setup({
          key: publicKey,
          email: 'parents@brightly.ng',
          amount: initResponse.amount * 100,
          currency: 'NGN',
          ref: reference,
          callback: async (resp: any) => {
            const verifyRes = await api.verifyPaystack(resp.reference || reference);
            if (verifyRes.success && verifyRes.verified) {
              setConfirmedReceipt({
                receiptNo: verifyRes.payment?.receiptNo || reference,
                studentName: targetStudent.name,
                grade: targetStudent.grade,
                term: termToPay,
                amount: initResponse.amount,
                channel: 'Paystack Live',
                paidAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              });
              onPaymentSuccess(termToPay, targetStudent.grade, initResponse.amount);
            } else {
              setErrorMessage('Payment verification could not be confirmed.');
            }
          },
          onClose: () => {
            setErrorMessage('Payment was cancelled. No payment was recorded.');
          }
        });
        handler.openIframe();
      } else {
        // Direct sandbox verify
        const verifyRes = await api.verifyPaystack(reference);
        if (verifyRes.success && verifyRes.verified) {
          setConfirmedReceipt({
            receiptNo: verifyRes.payment?.receiptNo || reference,
            studentName: targetStudent.name,
            grade: targetStudent.grade,
            term: termToPay,
            amount: initResponse.amount,
            channel: 'Paystack Live',
            paidAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          });
          onPaymentSuccess(termToPay, targetStudent.grade, initResponse.amount);
        } else {
          setErrorMessage('Payment could not be verified.');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setErrorMessage('A network error occurred while reaching the payment service. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div id="payment-subscription-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-[11px] font-black uppercase text-[#026838]">
            <span>💳 TUITION & SUBSCRIPTION MANAGEMENT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>PAYSTACK INTEGRATED</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#026838] uppercase font-display tracking-tight">
            Home Lesson Packages & Tuition
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
            Choose a home lesson package for your child. Instant activation via Paystack card, bank transfer, USSD, or your digital wallet balance.
          </p>
        </div>

        {/* Digital Wallet Card */}
        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/90 shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#026838] text-white flex items-center justify-center font-black shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Parent Wallet Balance</span>
            <span className="text-lg font-black text-[#026838]">
              ₦{walletBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Receipt Modal / Banner if payment was just completed */}
      {confirmedReceipt && (
        <div className="p-6 rounded-[28px] bg-gradient-to-r from-emerald-50 via-white to-amber-50 border-2 border-emerald-400 shadow-md space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#026838] text-white flex items-center justify-center font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-100 px-2 py-0.5 rounded">
                  Payment Confirmed • Receipt Issued
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase font-display">
                  Official Tuition Confirmation Receipt
                </h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              Receipt No: {confirmedReceipt.receiptNo}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Pupil</span>
              <span className="font-black text-slate-900">{confirmedReceipt.studentName} (Pri {confirmedReceipt.grade})</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Tuition Period</span>
              <span className="font-black text-slate-900">Term {confirmedReceipt.term} (Full Syllabus)</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Amount Settled</span>
              <span className="font-black text-[#026838]">₦{confirmedReceipt.amount.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Channel</span>
              <span className="font-black text-slate-900">{confirmedReceipt.channel}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-medium">
              Receipt verified under NERDC Curriculum standards. Valid for current school term.
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-black uppercase text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / Save Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* Select Child for Package Activation */}
      {students.length > 1 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#026838]" />
            <span className="text-xs font-black text-slate-900 uppercase">
              Activating Package For:
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTargetStudentId(s.id);
                  if (onSelectStudent) onSelectStudent(s);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  targetStudentId === s.id
                    ? 'bg-[#026838] text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] opacity-75">(Primary {s.grade})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3 Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGES.map((pkg) => {
          const isSelected = selectedPlanId === pkg.id;

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPlanId(pkg.id)}
              className={`rounded-[28px] p-6 border-2 transition-all duration-200 flex flex-col justify-between cursor-pointer relative bg-white ${
                isSelected
                  ? 'border-[#026838] ring-4 ring-[#026838]/10 shadow-lg -translate-y-1'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-black font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-xs tracking-wider">
                  Recommended
                </span>
              )}

              <div className="space-y-4">
                {/* Header */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {pkg.badge}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 uppercase font-display mt-2">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 font-display">
                      ₦{pkg.priceNaira.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      {pkg.periodLabel}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    What's Included:
                  </span>
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#026838] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId(pkg.id);
                  }}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-[#026838] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Selected Package</span>
                    </>
                  ) : (
                    <span>Choose This Plan</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Action Panel */}
      <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#026838]" />
            <h4 className="text-base font-black text-slate-900 uppercase font-display">
              Ready to Activate: {selectedPlan.name}
            </h4>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Beneficiary: <strong className="text-slate-900">{targetStudent.name}</strong> • Class: Primary {targetStudent.grade} • Total: <strong className="text-[#026838] text-sm">₦{selectedPlan.priceNaira.toLocaleString()}</strong>
          </p>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input 
                type="radio" 
                name="pay-channel" 
                checked={paymentChannel === 'paystack'} 
                onChange={() => setPaymentChannel('paystack')}
                className="accent-[#026838]"
              />
              <span>Pay with Paystack (Card, Transfer, USSD)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input 
                type="radio" 
                name="pay-channel" 
                checked={paymentChannel === 'wallet'} 
                onChange={() => setPaymentChannel('wallet')}
                className="accent-[#026838]"
              />
              <span>Debit Wallet (₦{walletBalance.toLocaleString()})</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full md:w-auto px-8 py-4 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_5px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <CreditCard className="w-5 h-5 text-slate-950" />
          <span>{isProcessing ? 'Processing via Paystack...' : `Pay ₦${selectedPlan.priceNaira.toLocaleString()} via Paystack`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
