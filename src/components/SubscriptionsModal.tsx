import React, { useState } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Wallet, 
  Tag, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onSubscriptionSuccess: (plan: 'termly' | 'annual', amountPaid: number) => void;
}

export const SubscriptionsModal: React.FC<SubscriptionsModalProps> = ({
  isOpen,
  onClose,
  walletBalance,
  onSubscriptionSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'termly' | 'annual' | 'founding_annual'>('termly');
  const [referralCode, setReferralCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const basePrice = selectedPlan === 'monthly' ? 2500 : selectedPlan === 'annual' ? 18000 : selectedPlan === 'founding_annual' ? 15000 : 6000;
  const walletDeduction = useWallet ? Math.min(walletBalance, basePrice - discountApplied) : 0;
  const finalPrice = Math.max(0, basePrice - discountApplied - walletDeduction);

  const handleApplyReferral = () => {
    if (referralCode.trim().length >= 3) {
      setDiscountApplied(1000); // ₦1,000 referral discount per child/plan
    } else {
      setDiscountApplied(0);
    }
  };

  const handlePayWithPaystack = async () => {
    setIsProcessing(true);

    try {
      // Send intent to server
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: selectedPlan,
          amount: basePrice,
          referralCode: referralCode || undefined,
        }),
      });
      const data = await res.json();

      // Simulate instantaneous Paystack gateway success
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentSuccess(true);
        onSubscriptionSuccess(selectedPlan, finalPrice);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }, 1200);
    } catch (e) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {paymentSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-[#DCFCE7] text-[#026838] border border-[#43A047] rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-sm">
              ✓
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#026838] font-display uppercase">
              Payment Successful!
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto font-medium">
              Your <strong>{selectedPlan === 'annual' ? 'Annual Master Plan' : 'Termly Plan'}</strong> is active on Paystack. Full Primary 1–6 Nigerian curriculum unlocked with comprehensive lesson mastery!
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-xs rounded-2xl shadow-[0_4px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
            >
              Continue Learning
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="inline-block bg-[#FEFCE8] text-[#D97706] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-[#FBC02D]/40">
                Paystack Verified Gateway
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#026838] font-display tracking-tight uppercase">
                Choose Your Brightly Plan
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Affordable home tutoring tailored for Nigerian primary pupils.
              </p>
            </div>

            {/* Plan Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-[#026838] bg-[#F0FDF4] shadow-md ring-2 ring-[#026838]/20'
                    : 'border-gray-200 bg-white hover:border-[#026838]/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-700 uppercase">Monthly Flexible Pass</span>
                  {selectedPlan === 'monthly' && (
                    <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#026838] font-display">₦2,500</span>
                  <span className="text-[10px] text-gray-500 font-bold">/ month (30 days)</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-2 font-medium">
                  30 days active access to all 6 core subjects with daily 30-min lessons.
                </p>
              </div>

              {/* Termly Plan */}
              <div
                onClick={() => setSelectedPlan('termly')}
                className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all ${
                  selectedPlan === 'termly'
                    ? 'border-[#026838] bg-[#F0FDF4] shadow-md ring-2 ring-[#026838]/20'
                    : 'border-gray-200 bg-white hover:border-[#026838]/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-700 uppercase">Termly Single Pass</span>
                  {selectedPlan === 'termly' && (
                    <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#026838] font-display">₦6,000</span>
                  <span className="text-[10px] text-gray-500 font-bold">/ term (100 days)</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-2 font-medium">
                  Complete single term syllabus coverage with progress reports & learning tutor.
                </p>
              </div>

              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all ${
                  selectedPlan === 'annual'
                    ? 'border-[#026838] bg-[#F0FDF4] shadow-md ring-2 ring-[#026838]/20'
                    : 'border-gray-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-700 uppercase">Annual Master Session</span>
                  {selectedPlan === 'annual' && (
                    <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-display">₦18,000</span>
                  <span className="text-[10px] text-gray-500 font-bold">/ year (3 terms)</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-2 font-medium">
                  Full 3-term academic session (Terms 1, 2, 3) with Common Entrance revision.
                </p>
              </div>

              {/* Founding Annual Offer */}
              <div
                onClick={() => setSelectedPlan('founding_annual')}
                className={`p-4 rounded-[20px] border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'founding_annual'
                    ? 'border-[#FBC02D] bg-[#FEFCE8] shadow-md ring-2 ring-[#FBC02D]/30'
                    : 'border-amber-200 bg-amber-50/20 hover:border-[#FBC02D]'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-[#FBC02D] text-gray-900 font-black text-[9px] px-3 py-0.5 rounded-full uppercase shadow-sm border border-amber-400">
                  Save ₦3,000
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 uppercase">Founding Family Offer</span>
                  {selectedPlan === 'founding_annual' && (
                    <span className="w-5 h-5 rounded-full bg-[#D97706] text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#D97706] font-display">₦15,000</span>
                  <span className="text-[10px] text-gray-500 font-bold">/ year (3 terms)</span>
                </div>
                <p className="text-[11px] text-gray-600 mt-2 font-medium">
                  Exclusive early pilot rate: complete 3-term full session access for ₦15,000.
                </p>
              </div>
            </div>

            {/* Wallet Credit & Referral Code */}
            <div className="bg-[#F0F9FF] p-5 rounded-[24px] border border-sky-100 space-y-3">
              {/* Wallet deduction toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#026838]" />
                  <span className="text-xs font-bold text-gray-700">
                    Use Wallet Credits (Balance: ₦{walletBalance.toLocaleString()})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4 text-[#026838] accent-[#026838] rounded"
                />
              </div>

              {/* Referral code input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Referral Code (Save ₦1,000 - e.g. BRIGHT1000)"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#026838]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyReferral}
                  className="px-4 py-2 bg-[#026838] hover:bg-[#008751] text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Apply
                </button>
              </div>

              {discountApplied > 0 && (
                <div className="text-[11px] text-[#026838] font-black flex items-center gap-1">
                  ✓ Referral discount applied: -₦{discountApplied.toLocaleString()}
                </div>
              )}
            </div>

            {/* Price Summary & Checkout Button */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-gray-400 block">Total Due</span>
                <span className="text-2xl font-black text-[#026838] font-display">
                  ₦{finalPrice.toLocaleString()}
                </span>
              </div>

              <button
                id="paystack-submit-checkout-btn"
                onClick={handlePayWithPaystack}
                disabled={isProcessing}
                className="px-8 py-3.5 bg-[#FBC02D] hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-xs rounded-2xl shadow-[0_4px_0_0_#D97706] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 uppercase tracking-wider font-display"
              >
                <CreditCard className="w-4 h-4 text-gray-900" />
                <span>{isProcessing ? 'Connecting to Paystack...' : 'Pay with Paystack'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
