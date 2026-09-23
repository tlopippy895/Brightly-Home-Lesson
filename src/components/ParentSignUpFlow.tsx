import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Check, 
  CreditCard, 
  Building2, 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  BookOpen,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GradeLevel, VoiceTone, StudentProfile } from '../types';
import pupilBoy from '../assets/images/nigerian_pupil_boy_1788178837558.jpg';
import pupilGirl from '../assets/images/nigerian_pupil_girl_1788178854346.jpg';

export interface NewPupilFormItem {
  id: string;
  name: string;
  grade: GradeLevel;
  gender: 'boy' | 'girl';
  avatarUrl: string;
  avatarColor: string;
  preferredVoiceTone: VoiceTone;
}

export interface ParentSignUpResult {
  parent: {
    name: string;
    email: string;
    phone: string;
    pin: string;
  };
  pupils: NewPupilFormItem[];
  term: number;
  isAnnual: boolean;
  amountPaid: number;
  paymentMethod: string;
  receiptNo: string;
}

interface ParentSignUpFlowProps {
  onCancel: () => void;
  onComplete: (result: ParentSignUpResult) => void;
}

export const ParentSignUpFlow: React.FC<ParentSignUpFlowProps> = ({
  onCancel,
  onComplete,
}) => {
  // Step 1: Parent Details, Step 2: Pupil/Pupils, Step 3: Term & Payment, Step 4: Receipt / Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Parent Account Form
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [formError, setFormError] = useState<string | null>(null);

  // Step 2: Pupils Form (Supports 1 or multiple children)
  const [pupils, setPupils] = useState<NewPupilFormItem[]>([
    {
      id: `pupil_${Date.now()}_1`,
      name: '',
      grade: 4,
      gender: 'boy',
      avatarUrl: pupilBoy,
      avatarColor: '#008751',
      preferredVoiceTone: 'nigerian_teacher',
    },
  ]);

  // Step 3: Term Selection & Payment
  // "Click the term and make payment"
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [isAnnualPlan, setIsAnnualPlan] = useState(false);
  const [paymentChannel, setPaymentChannel] = useState<'paystack' | 'bank_transfer' | 'ussd'>('paystack');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Step 4: Official Receipt
  const [generatedReceipt, setGeneratedReceipt] = useState<{
    receiptNo: string;
    date: string;
    reference: string;
    amount: number;
    termTitle: string;
    pupilsCount: number;
  } | null>(null);

  // PIN helpers
  const handlePinChange = (idx: number, val: string, isConfirm = false) => {
    if (!/^\d*$/.test(val)) return;
    const targetArr = isConfirm ? [...confirmPin] : [...parentPin];
    targetArr[idx] = val.slice(-1);
    if (isConfirm) {
      setConfirmPin(targetArr);
    } else {
      setParentPin(targetArr);
    }
    setFormError(null);

    if (val && idx < 3) {
      const nextId = isConfirm ? `confirm-pin-${idx + 1}` : `parent-pin-${idx + 1}`;
      document.getElementById(nextId)?.focus();
    }
  };

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToPupils = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!parentEmail.trim() || !parentEmail.includes('@')) {
      setFormError('Please enter a valid email address for lesson reports.');
      return;
    }
    if (!parentPhone.trim() || parentPhone.length < 10) {
      setFormError('Please enter a valid Nigerian mobile phone / WhatsApp number.');
      return;
    }

    const pinStr = parentPin.join('');
    const confirmPinStr = confirmPin.join('');
    if (pinStr.length !== 4) {
      setFormError('Please create a 4-digit Parent Security PIN.');
      return;
    }
    if (pinStr !== confirmPinStr) {
      setFormError('Your 4-digit PINs do not match. Please check and re-enter.');
      return;
    }

    setFormError(null);
    setStep(2);
  };

  // Step 2 Helpers
  const handleAddPupil = () => {
    setPupils((prev) => [
      ...prev,
      {
        id: `pupil_${Date.now()}_${prev.length + 1}`,
        name: '',
        grade: 4,
        gender: prev.length % 2 === 1 ? 'girl' : 'boy',
        avatarUrl: prev.length % 2 === 1 ? pupilGirl : pupilBoy,
        avatarColor: prev.length % 2 === 1 ? '#D97706' : '#008751',
        preferredVoiceTone: 'nigerian_teacher',
      },
    ]);
  };

  const handleRemovePupil = (index: number) => {
    if (pupils.length <= 1) return;
    setPupils((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePupil = (index: number, updates: Partial<NewPupilFormItem>) => {
    setPupils((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleProceedToPayment = () => {
    for (let i = 0; i < pupils.length; i++) {
      if (!pupils[i].name.trim()) {
        setFormError(`Please enter a name for Pupil #${i + 1}.`);
        return;
      }
    }
    setFormError(null);
    setStep(3);
  };

  // Pricing Calculation
  const standardTermFeePerPupil = 12000;
  const annualFeePerPupil = 30000; // 3 terms with discount (save ₦6,000)
  const tuitionAmountPerChild = isAnnualPlan ? annualFeePerPupil : standardTermFeePerPupil;
  const totalPayable = pupils.length * tuitionAmountPerChild;

  // Step 3: Complete Payment & Generate Receipt
  const handleExecutePayment = async () => {
    setIsSubmittingPayment(true);
    setFormError(null);

    try {
      // Simulate real verification & slight delay
      await new Promise((r) => setTimeout(r, 1200));

      const receiptNo = `BRT-TERM-P${pupils[0]?.grade || 4}${selectedTerm}-${Date.now().toString().slice(-6)}`;
      const ref = `PAYSTACK_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      const receiptData = {
        receiptNo,
        date: new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }),
        reference: ref,
        amount: totalPayable,
        termTitle: isAnnualPlan 
          ? 'Full Academic Session (All 3 Terms)' 
          : selectedTerm === 1 
          ? 'First Term (Sept - Dec)' 
          : selectedTerm === 2 
          ? 'Second Term (Jan - April)' 
          : 'Third Term (April - July)',
        pupilsCount: pupils.length,
      };

      setGeneratedReceipt(receiptData);
      setStep(4);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#026838', '#FBC02D', '#1E88E5', '#10B981'],
      });
    } catch (err: any) {
      setFormError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleFinishAndEnter = () => {
    if (!generatedReceipt) return;

    onComplete({
      parent: {
        name: parentName.trim(),
        email: parentEmail.trim(),
        phone: parentPhone.trim(),
        pin: parentPin.join(''),
      },
      pupils: pupils.map((p) => ({
        ...p,
        name: p.name.trim(),
      })),
      term: selectedTerm,
      isAnnual: isAnnualPlan,
      amountPaid: totalPayable,
      paymentMethod: paymentChannel === 'paystack' ? 'Paystack' : paymentChannel === 'bank_transfer' ? 'Bank Transfer' : 'USSD',
      receiptNo: generatedReceipt.receiptNo,
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 antialiased selection:bg-emerald-100 selection:text-emerald-900 py-6">
      <div className="bg-white rounded-3xl border border-gray-100 max-w-xl w-full p-6 sm:p-8 relative transition-all duration-300 shadow-sm">
        
        {/* Step Progression Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-2">
            <span className={step >= 1 ? 'text-[#026838]' : 'text-gray-400'}>1. Parent Account</span>
            <span className={step >= 2 ? 'text-[#026838]' : 'text-gray-400'}>2. Enroll Pupils</span>
            <span className={step >= 3 ? 'text-[#026838]' : 'text-gray-400'}>3. Term & Tuition</span>
            <span className={step >= 4 ? 'text-[#026838]' : 'text-gray-400'}>4. Complete</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-[#026838] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Global Error Notice */}
        {formError && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: Parent Account Registration                           */}
        {/* ------------------------------------------------------------- */}
        {step === 1 && (
          <form onSubmit={handleProceedToPupils} className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#026838] tracking-tight">
                  Parent Account Sign Up
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Set up your parent governance profile and security PIN
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                  Parent / Guardian Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    id="signup-parent-name"
                    type="text"
                    required
                    placeholder="e.g. Mr. Emmanuel Okafor"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#026838] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                  Email Address (for Reports & Receipts)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    id="signup-parent-email"
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#026838] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1">
                  Phone Number (WhatsApp Progress Updates)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    id="signup-parent-phone"
                    type="tel"
                    required
                    placeholder="0803 123 4567"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#026838] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* 4-digit Parent Security PIN */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="w-4 h-4 text-[#026838]" />
                  <label className="text-xs font-black text-gray-900 uppercase tracking-wide">
                    Create 4-Digit Parent Security PIN
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  This PIN protects the Parent Portal, payment receipts, and progress digests.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Enter 4-Digit PIN</span>
                    <div className="flex gap-2">
                      {parentPin.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`parent-pin-${idx}`}
                          type="password"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(idx, e.target.value, false)}
                          className="w-10 h-11 bg-[#f8fafc] border border-gray-200 focus:border-[#026838] focus:bg-white rounded-lg text-center font-bold text-lg text-gray-900 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Confirm 4-Digit PIN</span>
                    <div className="flex gap-2">
                      {confirmPin.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`confirm-pin-${idx}`}
                          type="password"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(idx, e.target.value, true)}
                          className="w-10 h-11 bg-[#f8fafc] border border-gray-200 focus:border-[#026838] focus:bg-white rounded-lg text-center font-bold text-lg text-gray-900 focus:outline-none"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="signup-continue-to-pupils-btn"
                type="submit"
                className="w-full py-3.5 px-4 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue: Enroll Pupil(s)</span>
                <ArrowRight className="w-4 h-4 text-[#FBC02D]" />
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: Enroll Pupil or Pupils                                */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#026838] tracking-tight">
                  Sign Up Pupil or Pupils
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Register each child who will be learning on Brightly Home Lesson
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            {/* List of Pupil Cards */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {pupils.map((pupil, idx) => (
                <div
                  key={pupil.id}
                  className="bg-white rounded-2xl p-4 border-2 border-emerald-100 shadow-xs relative space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Pupil #{idx + 1}
                    </span>
                    {pupils.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePupil(idx)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove pupil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wide mb-1">
                        Child's Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chinedu"
                        value={pupil.name}
                        onChange={(e) => handleUpdatePupil(idx, { name: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#026838] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wide mb-1">
                        Class / Primary Level
                      </label>
                      <select
                        value={pupil.grade}
                        onChange={(e) => handleUpdatePupil(idx, { grade: Number(e.target.value) as GradeLevel })}
                        className="w-full px-3 py-2.5 bg-[#f8fafc] border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#026838] focus:bg-white"
                      >
                        <option value={1}>Primary 1 (NERDC Universal Basic Ed)</option>
                        <option value={2}>Primary 2 (NERDC Universal Basic Ed)</option>
                        <option value={3}>Primary 3 (NERDC Universal Basic Ed)</option>
                        <option value={4}>Primary 4 (NERDC Universal Basic Ed)</option>
                        <option value={5}>Primary 5 (NERDC Universal Basic Ed)</option>
                        <option value={6}>Primary 6 (National Common Entrance)</option>
                      </select>
                    </div>
                  </div>

                  {/* Gender / Avatar & Voice Tone */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Avatar:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdatePupil(idx, { gender: 'boy', avatarUrl: pupilBoy })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          pupil.gender === 'boy'
                            ? 'bg-emerald-100 text-[#026838] border border-emerald-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        👦 Boy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePupil(idx, { gender: 'girl', avatarUrl: pupilGirl })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          pupil.gender === 'girl'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        👧 Girl
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Tutor Accent:</span>
                      <select
                        value={pupil.preferredVoiceTone}
                        onChange={(e) => handleUpdatePupil(idx, { preferredVoiceTone: e.target.value as VoiceTone })}
                        className="text-[11px] font-bold bg-[#f8fafc] border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
                      >
                        <option value="nigerian_teacher">Normal Voice (Nigerian)</option>
                        <option value="phonics">Phonics & Elocution</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Another Child Button */}
            <button
              type="button"
              id="signup-add-another-pupil-btn"
              onClick={handleAddPupil}
              className="w-full py-2.5 px-3 border-2 border-dashed border-[#026838] text-[#026838] hover:bg-emerald-50/50 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Pupil ({pupils.length} Enrolled)</span>
            </button>

            <div className="pt-2">
              <button
                type="button"
                id="signup-continue-to-terms-btn"
                onClick={handleProceedToPayment}
                className="w-full py-3.5 px-4 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue: Select Term & Make Payment</span>
                <ArrowRight className="w-4 h-4 text-[#FBC02D]" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: Click the Term and Make Payment                       */}
        {/* ------------------------------------------------------------- */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#026838] tracking-tight">
                  Click the Term & Make Payment
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Select the academic term to unlock subjects, teachings & full curriculum
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            {/* Clickable Term Cards - User Explicitly Asked: "Click the term and make payment" */}
            <div className="space-y-2.5">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wide block">
                Select School Term:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Term 1 */}
                <div
                  id="select-term-1-card"
                  onClick={() => {
                    setSelectedTerm(1);
                    setIsAnnualPlan(false);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
                    selectedTerm === 1 && !isAnnualPlan
                      ? 'border-[#026838] bg-emerald-50/70 shadow-xs ring-2 ring-[#026838]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-gray-900 uppercase">First Term</span>
                    {selectedTerm === 1 && !isAnnualPlan && (
                      <span className="w-4 h-4 rounded-full bg-[#026838] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">Sept – Dec (Harmattan)</p>
                  <div className="mt-2 text-xs font-black text-[#026838]">
                    ₦12,000 <span className="text-[9px] font-normal text-gray-500">/ pupil</span>
                  </div>
                </div>

                {/* Term 2 */}
                <div
                  id="select-term-2-card"
                  onClick={() => {
                    setSelectedTerm(2);
                    setIsAnnualPlan(false);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
                    selectedTerm === 2 && !isAnnualPlan
                      ? 'border-[#026838] bg-emerald-50/70 shadow-xs ring-2 ring-[#026838]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-gray-900 uppercase">Second Term</span>
                    {selectedTerm === 2 && !isAnnualPlan && (
                      <span className="w-4 h-4 rounded-full bg-[#026838] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">Jan – April (Easter)</p>
                  <div className="mt-2 text-xs font-black text-[#026838]">
                    ₦12,000 <span className="text-[9px] font-normal text-gray-500">/ pupil</span>
                  </div>
                </div>

                {/* Term 3 */}
                <div
                  id="select-term-3-card"
                  onClick={() => {
                    setSelectedTerm(3);
                    setIsAnnualPlan(false);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
                    selectedTerm === 3 && !isAnnualPlan
                      ? 'border-[#026838] bg-emerald-50/70 shadow-xs ring-2 ring-[#026838]/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-gray-900 uppercase">Third Term</span>
                    {selectedTerm === 3 && !isAnnualPlan && (
                      <span className="w-4 h-4 rounded-full bg-[#026838] text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">April – July (Promotion)</p>
                  <div className="mt-2 text-xs font-black text-[#026838]">
                    ₦12,000 <span className="text-[9px] font-normal text-gray-500">/ pupil</span>
                  </div>
                </div>
              </div>

              {/* Annual Bundle Option */}
              <div
                id="select-term-annual-card"
                onClick={() => setIsAnnualPlan(true)}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
                  isAnnualPlan
                    ? 'border-[#FBC02D] bg-[#FEFCE8] shadow-xs ring-2 ring-[#FBC02D]/40'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-900 uppercase">
                      Full Academic Session (All 3 Terms Bundle)
                    </span>
                    <span className="text-[9px] bg-[#FBC02D] text-gray-900 font-black px-2 py-0.5 rounded-full">
                      SAVE ₦6,000
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Unlocks First, Second, and Third terms all year round for uninterrupted mastery
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-amber-950">
                    ₦30,000 <span className="text-[9px] font-normal text-gray-500">/ pupil</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Enrolled Pupils:</span>
                <span className="font-bold text-gray-900">{pupils.length} Child(ren)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Selected Coverage:</span>
                <span className="font-bold text-[#026838]">
                  {isAnnualPlan ? 'All 3 Terms (Full Session)' : `Term ${selectedTerm} (NERDC Universal Curriculum)`}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                <span className="text-sm font-black text-gray-900">Total Tuition Payable:</span>
                <span className="text-lg font-black text-[#026838]">
                  ₦{totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Channels */}
            <div className="space-y-2">
              <span className="text-xs font-black text-gray-700 uppercase tracking-wide block">
                Choose Payment Channel:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentChannel('paystack')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentChannel === 'paystack'
                      ? 'border-[#026838] bg-emerald-50 text-[#026838]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#026838]" />
                  <span>Paystack</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('bank_transfer')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentChannel === 'bank_transfer'
                      ? 'border-[#026838] bg-emerald-50 text-[#026838]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-[#FBC02D]" />
                  <span>Bank Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChannel('ussd')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentChannel === 'ussd'
                      ? 'border-[#026838] bg-emerald-50 text-[#026838]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#1E88E5]" />
                  <span>USSD Code</span>
                </button>
              </div>
            </div>

            {/* Action Button: Pay & Activate Term */}
            <div className="pt-2">
              <button
                type="button"
                id="signup-execute-payment-btn"
                disabled={isSubmittingPayment}
                onClick={handleExecutePayment}
                className="w-full py-4 px-4 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment of ₦{totalPayable.toLocaleString()}...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#FBC02D]" />
                    <span>Click to Pay ₦{totalPayable.toLocaleString()} & Activate Term</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: Official Receipt & Enter Platform to Pick Subjects    */}
        {/* ------------------------------------------------------------- */}
        {step === 4 && generatedReceipt && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-[#026838] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-[#026838]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#026838] tracking-tight">
                Enrollment & Term Payment Confirmed!
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Welcome to Brightly Home Lesson family, {parentName}!
              </p>
            </div>

            {/* Digital Receipt Card */}
            <div className="bg-[#f8fafc] rounded-2xl p-5 border border-emerald-200 text-left space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OFFICIAL TUITION RECEIPT</span>
                  <div className="text-xs font-black text-gray-900">{generatedReceipt.receiptNo}</div>
                </div>
                <span className="text-[10px] font-black text-[#026838] bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  PAID IN FULL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Parent Name</span>
                  <span className="font-bold text-gray-800">{parentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Term Activated</span>
                  <span className="font-bold text-[#026838]">{generatedReceipt.termTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Pupils Registered</span>
                  <span className="font-bold text-gray-800">{pupils.map(p => `${p.name} (Pri ${p.grade})`).join(', ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Total Amount</span>
                  <span className="font-black text-[#026838]">₦{generatedReceipt.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between">
                <span>Ref: {generatedReceipt.reference}</span>
                <span>Date: {generatedReceipt.date}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-amber-700 shrink-0" />
              <div className="text-xs text-amber-900">
                <strong>Next:</strong> Subjects are now listed for your pupil(s) to pick for teachings and interactive whiteboard lessons!
              </div>
            </div>

            {/* Button: View the Page / Pick Subjects */}
            <button
              type="button"
              id="signup-enter-platform-btn"
              onClick={handleFinishAndEnter}
              className="w-full py-4 px-4 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Platform & Pick Subjects for Teaching</span>
              <ArrowRight className="w-4 h-4 text-[#FBC02D]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
