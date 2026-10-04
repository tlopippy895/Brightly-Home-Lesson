import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight,
  Receipt,
  Download,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  User,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GradeLevel, StudentProfile, TermPaymentRecord, STANDARD_TUITION_FEES } from '../types';
import { api } from '../services/api';

interface TermlyTuitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  targetGrade: GradeLevel;
  targetTerm: number;
  reason?: 'unregistered_class' | 'term_unpaid';
  onPaymentSuccess: (
    studentId: string, 
    grade: GradeLevel, 
    term: number, 
    amount: number, 
    channel: 'Paystack' | 'Bank Transfer' | 'Flutterwave' | 'USSD' | 'Wallet',
    receiptNo: string,
    updatedStudent?: StudentProfile
  ) => void;
  onEnterClass?: (grade: GradeLevel, term: number) => void;
}

export const TermlyTuitionModal: React.FC<TermlyTuitionModalProps> = ({
  isOpen,
  onClose,
  student,
  targetGrade,
  targetTerm,
  reason = 'term_unpaid',
  onPaymentSuccess,
  onEnterClass,
}) => {
  const [tuitionPlan, setTuitionPlan] = useState<'termly' | 'annual'>('termly');
  const [referralCode, setReferralCode] = useState('');
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralApplied, setReferralApplied] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedPayment, setVerifiedPayment] = useState<TermPaymentRecord | null>(null);

  // Check if current target term is already paid
  const isAlreadyPaid = Boolean(student.termlyTuition?.[targetTerm]?.paid || student.activeSubscription);
  const existingPaymentRecord = student.termlyTuition?.[targetTerm];

  useEffect(() => {
    if (isOpen) {
      setPaymentState('idle');
      setErrorMessage(null);
      setShowConfirmStep(false);
      setReferralCode('');
      setReferralDiscount(0);
      setReferralApplied(false);
      setVerifiedPayment(null);
    }
  }, [isOpen, student.id, targetGrade, targetTerm]);

  if (!isOpen) return null;

  const basePrice = tuitionPlan === 'termly' 
    ? STANDARD_TUITION_FEES.termlyPlanFee 
    : STANDARD_TUITION_FEES.annualPlanFee;

  const finalAmount = Math.max(0, basePrice - referralDiscount);

  const termNames: Record<number, string> = {
    1: 'First Term (Sept – Dec)',
    2: 'Second Term (Jan – April)',
    3: 'Third Term (April – July)'
  };
  const termTitle = termNames[targetTerm] || `Term ${targetTerm}`;

  const handleApplyReferral = () => {
    if (referralCode.trim().length >= 3) {
      setReferralDiscount(1000);
      setReferralApplied(true);
      setErrorMessage(null);
    } else {
      setReferralDiscount(0);
      setReferralApplied(false);
      setErrorMessage('Please enter a valid 4-character referral code');
    }
  };

  // Launch Paystack Checkout
  const handleProceedToPaystack = async () => {
    setPaymentState('processing');
    setErrorMessage(null);

    try {
      // 1. Initialize with server
      const initResponse = await api.initializePaystack({
        studentId: student.id,
        grade: targetGrade,
        term: targetTerm,
        planType: tuitionPlan,
        referralCode: referralApplied ? referralCode : undefined
      });

      if (!initResponse.success || !initResponse.reference) {
        setPaymentState('failed');
        setErrorMessage(initResponse.message || 'We could not connect to Paystack. Please try again.');
        return;
      }

      const reference = initResponse.reference;
      const publicKey = initResponse.publicKey || (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';

      // Check for browser Paystack Inline
      const paystackPop = (window as any).PaystackPop;

      if (paystackPop && publicKey) {
        const handler = paystackPop.setup({
          key: publicKey,
          email: 'parents@brightly.ng',
          amount: initResponse.amount * 100, // in kobo
          currency: 'NGN',
          ref: reference,
          metadata: {
            custom_fields: [
              { display_name: 'Pupil Name', variable_name: 'pupil_name', value: student.name },
              { display_name: 'Class', variable_name: 'class', value: `Primary ${targetGrade}` },
              { display_name: 'Term', variable_name: 'term', value: `Term ${targetTerm}` },
            ]
          },
          callback: async (response: any) => {
            // Server verification is MANDATORY
            await verifyTransactionOnServer(response.reference || reference);
          },
          onClose: () => {
            setPaymentState('idle');
            setShowConfirmStep(false);
            setErrorMessage('Payment was cancelled. No payment was recorded.');
          }
        });
        handler.openIframe();
      } else {
        // Fallback in environments without iframe popup support: trigger server verify directly with sandbox reference
        await verifyTransactionOnServer(reference);
      }
    } catch (err: any) {
      console.error('Paystack initialization error:', err);
      setPaymentState('failed');
      setErrorMessage('We couldn\'t connect to the payment service. Please check your internet connection and try again.');
    }
  };

  // Authoritative server-side verification
  const verifyTransactionOnServer = async (reference: string) => {
    try {
      setPaymentState('processing');
      const verifyResult = await api.verifyPaystack(reference);

      if (verifyResult.success && verifyResult.verified) {
        setPaymentState('success');
        if (verifyResult.payment) {
          setVerifiedPayment(verifyResult.payment);
        }

        // Notify parent state
        onPaymentSuccess(
          student.id,
          targetGrade,
          targetTerm,
          finalAmount,
          'Paystack',
          verifyResult.payment?.receiptNo || reference,
          verifyResult.student
        );

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        setPaymentState('failed');
        setErrorMessage(verifyResult.message || 'Your payment could not be confirmed. Please contact support if money was deducted.');
      }
    } catch (err: any) {
      console.error('Server verification error:', err);
      setPaymentState('failed');
      setErrorMessage('We could not confirm this payment yet. Please contact support if money was deducted.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 my-auto transition-all text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#026838] to-[#047857] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close tuition window"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Brightly Home Lesson
            </span>
            <span className="text-emerald-100 text-xs flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Paystack Secured
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-['Fredoka',sans-serif]">
            Term Learning Plan & Payment
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Manage your child's Brightly Home Lesson learning plan and term tuition.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* STATE 5: PAYMENT ALREADY ACTIVE */}
          {isAlreadyPaid && paymentState === 'idle' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>PAYMENT ACTIVE ✓</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-700">
                  Your child's learning access is active for:
                </p>
                <div className="mt-2 p-3 bg-white rounded-xl border border-emerald-100 text-xs sm:text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Child:</span>
                    <span className="font-bold text-slate-900">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class:</span>
                    <span className="font-bold text-slate-900">Primary {targetGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Term:</span>
                    <span className="font-bold text-slate-900">{termTitle}</span>
                  </div>
                  {existingPaymentRecord?.receiptNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt No:</span>
                      <span className="font-mono text-slate-700">{existingPaymentRecord.receiptNo}</span>
                    </div>
                  )}
                  {existingPaymentRecord?.accessExpires && (
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Valid Until:</span>
                      <span className="font-semibold text-emerald-700">
                        {new Date(existingPaymentRecord.accessExpires).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {onEnterClass && (
                  <button
                    onClick={() => {
                      onClose();
                      onEnterClass(targetGrade, targetTerm);
                    }}
                    className="flex-1 min-h-[48px] bg-[#026838] hover:bg-[#01522c] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <span>Enter Class & Continue Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: PAYMENT PROCESSING */}
          {paymentState === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center border-4 border-amber-400 border-t-transparent animate-spin">
                <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Fredoka',sans-serif]">
                  Payment Processing
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                  Please wait while we confirm your payment with Paystack. Your child's lessons will unlock immediately.
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: PAYMENT SUCCESSFUL & RECEIPT */}
          {paymentState === 'success' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <div className="w-12 h-12 mx-auto bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md mb-2">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950 font-['Fredoka',sans-serif]">
                  Payment Successful ✓
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Your child's home-learning access is now active.
                </p>
              </div>

              {/* Official Receipt Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Brightly Home Lesson Receipt</span>
                  <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    PAID ✓
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Child</span>
                    <span className="font-bold text-slate-900">{student.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Class</span>
                    <span className="font-bold text-slate-900">Primary {targetGrade}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Term</span>
                    <span className="font-bold text-slate-900">{termTitle}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Amount</span>
                    <span className="font-bold text-emerald-800">₦{finalAmount.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-slate-400 block">Transaction Reference</span>
                    <span className="font-mono text-[11px] text-slate-800 break-all">
                      {verifiedPayment?.transactionReference || 'BHL-VERIFIED-TX'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[11px] text-slate-400 block">Date</span>
                    <span className="text-slate-800">
                      {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                {onEnterClass && (
                  <button
                    onClick={() => {
                      onClose();
                      onEnterClass(targetGrade, targetTerm);
                    }}
                    className="flex-[2] min-h-[48px] bg-[#026838] hover:bg-[#01522c] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <span>Enter Class & Continue Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STATE 1: PAYMENT NOT YET MADE & CONFIRMATION STEP */}
          {!isAlreadyPaid && paymentState !== 'success' && paymentState !== 'processing' && (
            <div className="space-y-4">
              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Payment Notice</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* CHILD & CLASS SUMMARY BANNER */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm text-base"
                    style={{ backgroundColor: student.avatarColor || '#026838' }}
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Paying For Pupil
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {student.name} • Primary {targetGrade}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">Term</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">Term {targetTerm}</span>
                </div>
              </div>

              {/* Step A: Selection & Plain-Language Summary */}
              {!showConfirmStep ? (
                <div className="space-y-4">
                  {/* What am I paying for? */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs sm:text-sm">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#026838]" />
                      <span>What does this payment cover?</span>
                    </div>
                    <ul className="text-slate-600 space-y-1.5 pl-5 list-disc text-xs">
                      <li>Full 30-minute daily home-learning lessons for <strong>{termTitle}</strong></li>
                      <li>Official Nigerian NERDC curriculum syllabus coverage</li>
                      <li>Encouraging Nigerian teacher voice guidance</li>
                      <li>Adaptive re-explanations whenever your child needs a simpler concept breakdown</li>
                      <li>Parent progress card with detailed mastery updates</li>
                    </ul>
                  </div>

                  {/* Plan Choice (Termly vs Annual) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTuitionPlan('termly')}
                      className={`p-3 rounded-2xl border text-left transition-all min-h-[44px] ${
                        tuitionPlan === 'termly'
                          ? 'border-[#026838] bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">Term Learning Plan</span>
                        {tuitionPlan === 'termly' && <Check className="w-4 h-4 text-[#026838]" />}
                      </div>
                      <span className="text-base font-bold text-slate-900 block">₦6,000</span>
                      <span className="text-[10px] text-slate-500">One School Term</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTuitionPlan('annual')}
                      className={`p-3 rounded-2xl border text-left transition-all min-h-[44px] ${
                        tuitionPlan === 'annual'
                          ? 'border-[#026838] bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">Full Session Plan</span>
                        {tuitionPlan === 'annual' && <Check className="w-4 h-4 text-[#026838]" />}
                      </div>
                      <span className="text-base font-bold text-slate-900 block">₦15,000</span>
                      <span className="text-[10px] text-emerald-700 font-bold">All 3 Terms (Save ₦3,000)</span>
                    </button>
                  </div>

                  {/* Referral Discount Code */}
                  <div className="pt-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Referral Code (Optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        disabled={referralApplied}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono tracking-wider focus:outline-none focus:border-emerald-600 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyReferral}
                        disabled={referralApplied}
                        className="px-3 min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {referralApplied ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                    {referralApplied && (
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                        ₦1,000 referral discount applied!
                      </span>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Total Tuition Payable</span>
                      <span className="text-xs text-slate-400">Card, Bank Transfer, or USSD</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900 font-['Fredoka',sans-serif]">
                        ₦{finalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Confirmation Trigger */}
                  <button
                    onClick={() => setShowConfirmStep(true)}
                    className="w-full min-h-[48px] bg-[#026838] hover:bg-[#01522c] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <span>PAY ₦{finalAmount.toLocaleString()} WITH PAYSTACK</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Step B: Explicit Child Confirmation before Opening Paystack */
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <span className="text-xs font-bold text-amber-900 block">
                      Please confirm your payment details:
                    </span>
                    <div className="text-xs sm:text-sm space-y-1.5 text-slate-700 bg-white p-3 rounded-xl border border-amber-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Child:</span>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Class:</span>
                        <span className="font-bold text-slate-900">Primary {targetGrade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Term:</span>
                        <span className="font-bold text-slate-900">{termTitle}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Amount:</span>
                        <span className="font-black text-emerald-800 text-sm sm:text-base">
                          ₦{finalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Payment for this child will activate lessons for <strong>{student.name}</strong> only.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmStep(false)}
                      className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceedToPaystack}
                      className="flex-[2] min-h-[48px] bg-[#026838] hover:bg-[#01522c] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                    >
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Security Badges */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            Powered by Paystack
          </span>
        </div>
      </div>
    </div>
  );
};
