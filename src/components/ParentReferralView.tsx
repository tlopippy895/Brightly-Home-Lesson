import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowUpRight, 
  Coins, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Receipt, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ParentReferralSummary, MaskedReferralItem, CreditLedgerEntry } from '../types';
import { api } from '../services/api';

interface ParentReferralViewProps {
  walletBalance: number;
  parentName?: string;
  onNavigateToTuition?: () => void;
}

export const ParentReferralView: React.FC<ParentReferralViewProps> = ({
  walletBalance,
  parentName,
  onNavigateToTuition
}) => {
  const [summary, setSummary] = useState<ParentReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  
  // Claim code state
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [claimStatus, setClaimStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Terms accordion
  const [showTerms, setShowTerms] = useState(false);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReferralSummary();
      if (res.success && res.referralCode) {
        setSummary(res as unknown as ParentReferralSummary);
      }
    } catch (err) {
      console.error('Failed loading referral summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  const handleCopy = (text: string, type: 'code' | 'link') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCodeInput.trim()) return;

    try {
      setIsSubmittingClaim(true);
      setClaimStatus(null);
      const res = await api.claimReferralCode(claimCodeInput.trim().toUpperCase());
      if (res.success) {
        setClaimStatus({
          type: 'success',
          text: res.message || 'Invitation code applied successfully!'
        });
        setClaimCodeInput('');
        loadReferralData();
      } else {
        setClaimStatus({
          type: 'error',
          text: res.message || 'Could not apply referral code.'
        });
      }
    } catch (err: any) {
      setClaimStatus({
        type: 'error',
        text: err.message || 'Failed to apply referral code.'
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const referralCode = summary?.referralCode || 'BRIGHT-P-LOADING';
  const invitationLink = summary?.invitationLink || `https://brightly.ng/?ref=${referralCode}`;
  const totalEarned = summary?.totalEarnedCredits ?? 0;
  const totalUsed = summary?.totalCreditsUsed ?? 0;
  const availableBalance = summary?.availableCreditBalance ?? walletBalance;
  const successfulCount = summary?.rewardedCount ?? 0;
  const pendingCount = summary?.pendingCount ?? 0;
  const referralsList: MaskedReferralItem[] = summary?.referrals || [];
  const ledgerList: CreditLedgerEntry[] = summary?.ledger || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Hero Ambassador Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#014d28] via-[#026838] to-[#01351b] rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-emerald-700/40">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-300/30">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              Brightly Family Ambassador Programme
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white leading-tight">
              Earn <span className="text-amber-400">₦1,000</span> for Every Family You Welcome
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Share Brightly with Nigerian fellow parents. When a genuinely new family joins and completes their first paid subscription pass, you instantly receive ₦1,000 in subscription credits towards your children’s tuition.
            </p>
          </div>

          {/* Quick Balance Preview Card */}
          <div className="shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[220px]">
            <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold block mb-1">
              Available Credit Balance
            </span>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
              ₦{availableBalance.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-200/80 block mt-1">
              Applicable to future subscriptions
            </span>
            {onNavigateToTuition && (
              <button
                type="button"
                onClick={onNavigateToTuition}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Redeem in Tuition</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shareable Code & Link Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unique Referral Code Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#026838] flex items-center justify-center font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                Your Unique Referral Code
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Give this code to fellow parents to enter at registration
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-slate-900 select-all">
              {referralCode}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(referralCode, 'code')}
              className="py-2.5 px-4 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              {copiedType === 'code' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Shareable Invitation Link Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                Shareable Invitation Link
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                New parents clicking this link have your code auto-applied
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between gap-3">
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-700 truncate select-all">
              {invitationLink}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(invitationLink, 'link')}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              {copiedType === 'link' ? (
                <>
                  <Check className="w-4 h-4 text-amber-200" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Ambassador KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Available Balance
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#026838] font-mono">
            ₦{availableBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            Usable for future subscriptions
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Total Earned Credits
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            ₦{totalEarned.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            From verified new families
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Credits Redeemed
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
            ₦{totalUsed.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            Applied to tuition passes
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Qualifying Referrals
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {successfulCount}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            {pendingCount} pending payment verification
          </span>
        </div>
      </div>

      {/* Claim / Apply Referral Code Card (For parents who joined without a code) */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Were You Referred by Another Brightly Family?
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              If another parent invited you and you haven’t yet completed your first paid subscription, enter their invitation code below before making a payment.
            </p>
          </div>
        </div>

        <form onSubmit={handleClaimReferral} className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <input
            type="text"
            value={claimCodeInput}
            onChange={(e) => setClaimCodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. BRIGHT-P-8899AA"
            className="flex-1 px-4 py-2.5 rounded-xl border border-amber-300 bg-white font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-amber-500"
            disabled={isSubmittingClaim}
          />
          <button
            type="submit"
            disabled={isSubmittingClaim || !claimCodeInput.trim()}
            className="py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs shrink-0"
          >
            {isSubmittingClaim ? 'Applying...' : 'Apply Code'}
          </button>
        </form>

        {claimStatus && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            claimStatus.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
          }`}>
            {claimStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
            )}
            <span>{claimStatus.text}</span>
          </div>
        )}
      </div>

      {/* Referrals Pipeline & Status Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Referred Families Pipeline
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time progression from registration to verified qualifying subscription
            </p>
          </div>
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#026838]" />
            <span>Cross-Parent Privacy Protected</span>
          </div>
        </div>

        {referralsList.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#026838] flex items-center justify-center text-2xl mx-auto">
              👨‍👩‍👧‍👦
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase">
              No Referrals Yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Copy your invitation link above and share it with family and friends on WhatsApp, school groups, or church communities.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                  <th className="py-3 px-3">Referred Family</th>
                  <th className="py-3 px-3">Joined Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Credit Reward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {referralsList.map((ref) => {
                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                      Registered
                    </span>
                  );
                  if (ref.status === 'rewarded') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Rewarded ✓
                      </span>
                    );
                  } else if (ref.status === 'pending_payment') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                        Pending First Payment
                      </span>
                    );
                  } else if (ref.status === 'reversed') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                        Reversed (Refunded)
                      </span>
                    );
                  } else if (ref.status === 'disqualified') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-700 border border-slate-300">
                        Disqualified
                      </span>
                    );
                  }

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <span>{ref.maskedName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(ref.registeredAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {statusBadge}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {ref.status === 'rewarded' ? '+₦1,000' : '₦0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auditable Credit Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#026838]" />
              Auditable Subscription Credit Ledger
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Transparent, immutable ledger tracking all credit additions, reversals, and tuition redemptions
            </p>
          </div>
        </div>

        {ledgerList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-medium">
            No credit movements recorded yet. Credits will appear here when earned or redeemed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Movement</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {ledgerList.map((entry) => {
                  const isCredit = entry.type === 'credit';
                  let catBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {entry.category}
                    </span>
                  );
                  if (entry.category === 'referral_reward') {
                    catBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Referral Reward
                      </span>
                    );
                  } else if (entry.category === 'subscription_redemption') {
                    catBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Tuition Redemption
                      </span>
                    );
                  } else if (entry.category === 'referral_reversal') {
                    catBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        Refund Reversal
                      </span>
                    );
                  }

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[140px]">
                        {entry.reference}
                      </td>
                      <td className="py-3 px-3">
                        {catBadge}
                      </td>
                      <td className="py-3 px-3 text-slate-800">
                        {entry.description}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${
                        isCredit ? 'text-[#026838]' : 'text-amber-700'
                      }`}>
                        {isCredit ? `+₦${entry.amount.toLocaleString()}` : `-₦${entry.amount.toLocaleString()}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₦{entry.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Program Terms & Explanations Accordion */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <button
          type="button"
          onClick={() => setShowTerms(prev => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide group-hover:text-[#026838] transition-colors">
                Referral Programme Terms & Conditions
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Transparent rules governing credits, eligibility, and redemptions
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            {showTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTerms && (
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600 leading-relaxed animate-fadeIn">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-semibold">
              ⚠️ <strong>Non-Cash Policy:</strong> Subscription credits are strictly non-withdrawable as cash and apply exclusively towards future Brightly tuition subscriptions.
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li>Earn ₦1,000 in subscription credit for each genuinely new family that registers with your code and verifies a qualifying paid tuition subscription.</li>
              <li>Eligible plans include Monthly Pass (₦2,500), Termly Pass (₦6,000), Annual Pass (₦18,000), and Founding Family Annual Offer (₦15,000).</li>
              <li>No reward is created merely upon account registration or invitation link clicks; a verified qualifying tuition payment is mandatory.</li>
              <li>Self-referrals (referring your own alternate phone number, email, or child profile) are strictly prohibited and automatically blocked.</li>
              <li>If a qualifying subscription is subsequently refunded, disputed, or charged back, associated referral credits are automatically reversed in the audit ledger.</li>
              <li>Credits are added to your digital parent balance and remain valid for 365 calendar days from the date of issue.</li>
              <li>Cross-family privacy is strictly enforced: only masked family surnames are displayed in your ambassador pipeline.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
