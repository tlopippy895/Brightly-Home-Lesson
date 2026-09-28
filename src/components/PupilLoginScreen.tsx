import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { StudentProfile } from '../types';
import pupilBannerImg from '../assets/images/pupil_login_banner_1790237504057.jpg';

interface PupilLoginScreenProps {
  students: StudentProfile[];
  activeStudent: StudentProfile;
  onSelectStudentAndLogin: (studentId: string) => void;
  onBackToGateway: () => void;
  onOpenSignUp: () => void;
}

export const PupilLoginScreen: React.FC<PupilLoginScreenProps> = ({
  students,
  activeStudent,
  onSelectStudentAndLogin,
  onBackToGateway,
  onOpenSignUp,
}) => {
  // Pre-select first student or active student
  const [selectedPupilId, setSelectedPupilId] = useState<string>(activeStudent?.id || students[0]?.id || 'chidi');
  const selectedPupil = students.find(s => s.id === selectedPupilId) || students[0];

  const [usernameInput, setUsernameInput] = useState<string>(
    selectedPupil?.username || selectedPupil?.name.toLowerCase() || 'chidi'
  );
  const [passwordInput, setPasswordInput] = useState<string>(
    selectedPupil?.password || selectedPupil?.pin || '1234'
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // When pupil selects their profile card
  const handleSelectPupil = (pupil: StudentProfile) => {
    setSelectedPupilId(pupil.id);
    setUsernameInput(pupil.username || pupil.name.toLowerCase());
    setPasswordInput(pupil.password || pupil.pin || '1234');
    setErrorMsg(null);
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!usernameInput.trim()) {
      setErrorMsg('Please enter your pupil username or name.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMsg('Please enter your password or 4-digit PIN.');
      return;
    }

    setIsSubmitting(true);

    // Find student matching either id, username, or name (case-insensitive)
    const cleanUser = usernameInput.trim().toLowerCase();
    const matchedPupil = students.find(s => 
      s.id.toLowerCase() === cleanUser ||
      (s.username && s.username.toLowerCase() === cleanUser) ||
      s.name.toLowerCase() === cleanUser
    ) || selectedPupil;

    // Validate password / PIN (accepts student's password, student's pin, or default '1234')
    const validPassword = matchedPupil.password || matchedPupil.pin || '1234';
    const isValid = (passwordInput === validPassword) || (passwordInput === '1234') || (passwordInput === matchedPupil.pin);

    setTimeout(() => {
      setIsSubmitting(false);
      if (isValid) {
        onSelectStudentAndLogin(matchedPupil.id);
      } else {
        setErrorMsg(`Incorrect password for ${matchedPupil.name}. Default PIN is 1234 or ask your parent.`);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FCE7F3] via-[#F3E8FF] to-[#E0E7FF] flex flex-col items-center justify-center p-3 sm:p-6 antialiased relative overflow-hidden select-none">
      
      {/* Potted Plant 1: Bottom Left (as seen in uploaded image) */}
      <div className="fixed bottom-0 left-2 sm:left-10 z-0 pointer-events-none opacity-85 hidden sm:block">
        <svg width="120" height="170" viewBox="0 0 120 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ceramic Pot */}
          <path d="M40 120L45 160C45.5 163 48 165 51 165H69C72 165 74.5 163 75 160L80 120H40Z" fill="#FBCFE8" stroke="#F472B6" strokeWidth="2" />
          <ellipse cx="60" cy="120" rx="20" ry="4" fill="#F472B6" />
          {/* Leaves */}
          <path d="M60 120C60 90 35 70 20 75C20 95 45 110 60 120Z" fill="#86EFAC" stroke="#4ADE80" strokeWidth="2" />
          <path d="M60 115C60 85 85 65 100 70C100 90 75 105 60 115Z" fill="#4ADE80" stroke="#22C55E" strokeWidth="2" />
          <path d="M60 110C60 70 50 40 60 25C70 40 60 70 60 110Z" fill="#BBF7D0" stroke="#86EFAC" strokeWidth="2" />
          {/* Peach Flower Bud */}
          <circle cx="60" cy="22" r="6" fill="#FDA4AF" />
          <circle cx="20" cy="73" r="4" fill="#FDE047" />
          <circle cx="100" cy="68" r="4" fill="#FDE047" />
        </svg>
      </div>

      {/* Potted Plant 2: Bottom Right (as seen in uploaded image) */}
      <div className="fixed bottom-0 right-2 sm:right-10 z-0 pointer-events-none opacity-85 hidden sm:block">
        <svg width="120" height="170" viewBox="0 0 120 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ceramic Pot */}
          <path d="M40 120L45 160C45.5 163 48 165 51 165H69C72 165 74.5 163 75 160L80 120H40Z" fill="#E9D5FF" stroke="#C084FC" strokeWidth="2" />
          <ellipse cx="60" cy="120" rx="20" ry="4" fill="#C084FC" />
          {/* Leaves */}
          <path d="M60 120C60 90 85 70 100 75C100 95 75 110 60 120Z" fill="#86EFAC" stroke="#4ADE80" strokeWidth="2" />
          <path d="M60 115C60 85 35 65 20 70C20 90 45 105 60 115Z" fill="#4ADE80" stroke="#22C55E" strokeWidth="2" />
          <path d="M60 110C60 70 70 40 60 25C50 40 60 70 60 110Z" fill="#BBF7D0" stroke="#86EFAC" strokeWidth="2" />
          {/* Flower Bud */}
          <circle cx="60" cy="22" r="6" fill="#F472B6" />
        </svg>
      </div>

      {/* Top Header Navigation */}
      <div className="w-full max-w-[390px] flex items-center justify-between mb-2 z-20">
        <button
          type="button"
          onClick={onBackToGateway}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 text-xs font-bold shadow-xs backdrop-blur-sm transition-all cursor-pointer border border-purple-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roles</span>
        </button>

        <span className="text-[10px] font-black tracking-wider uppercase text-purple-900 bg-white/90 px-3 py-1 rounded-full border border-purple-200 shadow-2xs flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#F59E0B]" />
          <span>Pupil Sign In Access</span>
        </span>
      </div>

      {/* Main Card Wrapper */}
      <div className="w-full max-w-[390px] relative z-10">
        
        {/* Floating 3D Elements matching the uploaded image */}
        {/* 1. Top-Left: Lavender Speech Bubble with User Avatar */}
        <div className="absolute -top-1 left-3 sm:left-4 z-30 animate-bounce duration-1000 pointer-events-none drop-shadow-md">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#DDD6FE] to-[#C4B5FD] flex items-center justify-center text-white border-2 border-white shadow-md">
            <User className="w-5 h-5 text-purple-700" />
          </div>
        </div>

        {/* 2. Top-Right: Purple 3D Padlock */}
        <div className="absolute -top-3 right-4 sm:right-6 z-30 pointer-events-none drop-shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C084FC] to-[#A855F7] flex items-center justify-center text-white border-2 border-white shadow-md">
            <Lock className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* 3. Middle-Right: Peach Checkmark Badge */}
        <div className="absolute top-24 -right-3 z-30 pointer-events-none drop-shadow-md hidden sm:block">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FECDD3] to-[#FDA4AF] flex items-center justify-center text-white border-2 border-white shadow-sm">
            <Check className="w-5 h-5 text-rose-600 stroke-[3]" />
          </div>
        </div>

        {/* 4. Golden Sparkle Stars */}
        <div className="absolute top-12 -left-2 z-30 text-amber-400 text-lg pointer-events-none drop-shadow-sm">
          ✦
        </div>
        <div className="absolute top-2 right-18 z-30 text-amber-400 text-sm pointer-events-none drop-shadow-sm">
          ✦
        </div>

        {/* Character Illustration Banner leaning over the card */}
        <div className="w-full flex justify-center -mb-9 relative z-20 pointer-events-none">
          <div className="w-48 h-48 sm:w-52 sm:h-52 relative overflow-hidden rounded-full drop-shadow-[0_15px_30px_rgba(168,85,247,0.3)] ring-4 ring-white">
            <img
              src={pupilBannerImg}
              alt="Pupil Sign In Mascot"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        {/* 3D Soft White Card (matching uploaded screenshot) */}
        <div className="bg-white/95 backdrop-blur-md rounded-[40px] p-6 sm:p-8 pt-11 shadow-[0_20px_60px_-15px_rgba(167,139,250,0.3)] border-2 border-white relative overflow-hidden text-center animate-fadeIn">
          
          {/* Welcome Back! Header */}
          <div className="space-y-0.5 mb-5">
            <h1 className="text-2xl sm:text-[28px] font-black text-[#1E1B4B] tracking-tight font-display">
              Welcome Back!
            </h1>
            <p className="text-xs text-gray-500 font-bold">
              Login to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            
            {/* Input 1: Username / Email */}
            <div className="relative text-left">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="pupil-username-input"
                type="text"
                required
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Username / Email"
                className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#A855F7] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Input 2: Password with Eye Toggle */}
            <div className="relative text-left">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="pupil-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Password"
                className="w-full pl-11 pr-11 py-3.5 bg-[#F8FAFC] border border-gray-200/80 rounded-2xl text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#A855F7] focus:bg-white transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => setShowForgotNotice(!showForgotNotice)}
                className="text-[11px] font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Forgot Password Notice */}
            {showForgotNotice && (
              <div className="p-3 bg-purple-50/90 rounded-2xl border border-purple-200 text-left text-[11px] text-purple-900 font-medium animate-fadeIn space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-950">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Pupil Access Recovery:</span>
                </div>
                <p>
                  Default Pupil PIN is <strong className="font-black text-purple-950">1234</strong>. Parents can look up or change each child's individual password from <strong>Parent Governance</strong>.
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-700 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Radiant Gradient Login Button matching the uploaded design */}
            <button
              id="pupil-login-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#F472B6] via-[#A855F7] to-[#818CF8] hover:from-[#EC4899] hover:via-[#9333EA] hover:to-[#6366F1] text-white font-black text-sm rounded-2xl shadow-[0_12px_28px_rgba(244,114,182,0.35)] hover:shadow-[0_16px_32px_rgba(168,85,247,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entering Classroom...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Pupil Assistance Note */}
          <div className="mt-5 pt-3 border-t border-purple-100 text-xs text-purple-900/80 font-medium">
            <span>Need help signing in? Ask your parent to look up your 4-digit PIN in Parent Governance.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
