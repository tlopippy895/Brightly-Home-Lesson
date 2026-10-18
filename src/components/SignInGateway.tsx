import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  BrainCircuit, 
  BarChart2, 
  Users, 
  HelpCircle, 
  Phone, 
  KeyRound, 
  GraduationCap, 
  UserPlus, 
  ArrowLeft,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { StudentProfile } from '../types';
import { api } from '../services/api';
import { BrandLogo } from './BrandLogo';
import { ParentSignUpFlow, ParentSignUpResult } from './ParentSignUpFlow';
import heroPupilsImg from '../assets/images/login_hero_pupils_1792317086931.jpg';

interface SignInGatewayProps {
  onSignInAsParent: (studentId?: string) => void;
  onSignInAsPupil: (studentId?: string) => void;
  onSignInAsAdmin?: () => void;
  onContinueAsGuest: () => void;
  onSignUpComplete: (result: ParentSignUpResult) => void;
  students: StudentProfile[];
  activeStudent: StudentProfile;
}

export const SignInGateway: React.FC<SignInGatewayProps> = ({
  onSignInAsParent,
  onSignInAsPupil,
  onSignInAsAdmin,
  onSignUpComplete,
  students,
  activeStudent,
}) => {
  // Input fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recovery Mode State ('login' | 'forgot-password' | 'pupil-modal')
  const [authView, setAuthView] = useState<'login' | 'forgot-password' | 'child-picker'>('login');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpWizardOpen, setIsSignUpWizardOpen] = useState(false);

  // If in Parent Multi-Step Wizard mode, render the flow
  if (isSignUpWizardOpen) {
    return (
      <ParentSignUpFlow
        onCancel={() => setIsSignUpWizardOpen(false)}
        onComplete={(result) => {
          setIsSignUpWizardOpen(false);
          onSignUpComplete(result);
        }}
      />
    );
  }

  // Handle Parent Login
  const handleParentLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Please enter your email or Nigerian phone number.');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('Please enter your password or security PIN.');
      return;
    }

    setIsLoading(true);
    try {
      // Check for admin credential pattern
      if (cleanId.includes('admin') || cleanId === 'admin@brightly.ng') {
        const adminRes = await api.loginAdmin(cleanId, cleanPass);
        if (adminRes.success && onSignInAsAdmin) {
          onSignInAsAdmin();
          return;
        }
      }

      const res = await api.loginParent(cleanId, cleanPass);
      if (res.success) {
        onSignInAsParent(activeStudent?.id || students[0]?.id);
      } else {
        setErrorMessage(res.message || 'Invalid credentials. Please verify your phone/email and password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Child / Pupil Login
  const handlePupilLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanInput = identifier.trim();
    const cleanPin = password.trim() || '1234';

    if (!cleanInput) {
      // If inputs are empty, open the visual child picker so child can easily click their photo/name
      setAuthView('child-picker');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate via backend pupil login
      const res = await api.loginPupil(cleanInput, cleanPin);
      if (res.success && res.student) {
        onSignInAsPupil(res.student.id);
      } else {
        // Fallback matching against preloaded students
        const normalized = cleanInput.toLowerCase().replace(/\s+/g, ' ');
        const matched = students.find(
          s => s.name.trim().toLowerCase().replace(/\s+/g, ' ') === normalized ||
               s.id.toLowerCase() === normalized.replace(/\s+/g, '') ||
               (s.loginIdentifier && s.loginIdentifier.toLowerCase() === normalized.replace(/\s+/g, ''))
        );

        if (matched) {
          onSignInAsPupil(matched.id);
        } else {
          setErrorMessage(res.message || `No pupil account found for "${cleanInput}". Please check spelling or select from child accounts.`);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Pupil sign in failed. Please ask your parent for assistance.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password / PIN Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = forgotIdentifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your registered phone number or email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword(cleanId, newPassword, confirmNewPassword);
      if (res.success) {
        setSuccessMessage('Password reset successfully! You can now log in with your new password.');
        setIdentifier(cleanId);
        setPassword(newPassword);
        setTimeout(() => {
          setAuthView('login');
          setSuccessMessage(null);
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Unable to reset password. Please check your phone or email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#E6F4EA] flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-x-hidden selection:bg-[#FFD54F] selection:text-slate-900 font-sans">
      
      {/* Decorative Sunshine in Top Right */}
      <div className="absolute top-4 right-6 sm:top-8 sm:right-12 pointer-events-none opacity-90 animate-pulse hidden sm:block">
        <Sun className="w-16 h-16 sm:w-20 sm:h-20 text-[#F59E0B] fill-[#FDE047]/60" />
      </div>

      {/* Top Header with Brand Logo & Slogan */}
      <header className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center pt-2 pb-6 text-center z-10">
        <BrandLogo size="lg" colorScheme="blue" variant="stacked" showSubtitle={true} />
      </header>

      {/* Main Two-Column Card */}
      <main className="w-full max-w-5xl mx-auto z-10">
        <div className="bg-white rounded-[32px] shadow-2xl border border-sky-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: HERO INFORMATION & LEARNING ILLUSTRATION */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#E0F2FE] via-[#F8FAFC] to-[#FEF3C7] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-sky-100">
            <div className="space-y-4">
              
              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0369A1] font-display tracking-tight leading-tight">
                Better Learning <br className="hidden sm:inline" />
                for a Brighter <br className="hidden sm:inline" />
                Future
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Brightly Home Lesson helps Nigerian primary school children understand what they learn in school, with patient teachers, engaging lessons and real progress.
              </p>

              {/* Curriculum Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FBBF24] text-slate-900 font-black text-xs shadow-xs">
                <GraduationCap className="w-4 h-4 text-slate-900" />
                <span>Primary 1 – 6 &nbsp;|&nbsp; Nigerian Curriculum</span>
              </div>

              {/* Hero Illustration */}
              <div className="pt-2 rounded-2xl overflow-hidden shadow-xs border border-white/80 bg-white/40">
                <img 
                  src={heroPupilsImg} 
                  alt="Nigerian primary school pupils learning enthusiastically with tablet and books" 
                  className="w-full h-56 sm:h-64 object-cover rounded-xl"
                />
              </div>
            </div>

            {/* 4 Feature Badges at Bottom */}
            <div className="grid grid-cols-4 gap-2 pt-6 mt-4 border-t border-sky-200/50">
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">
                  Nigerian Curriculum Aligned
                </span>
              </div>

              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">
                  Adaptive Re-teaching
                </span>
              </div>

              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">
                  Progress Tracking
                </span>
              </div>

              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 leading-tight">
                  Parent Reports
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: WELCOME BACK AUTHENTICATION FORM */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
            
            {/* VIEW A: FORGOT PASSWORD / PIN RECOVERY */}
            {authView === 'forgot-password' ? (
              <div className="space-y-5 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </button>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">
                    Recover Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Reset your password securely using your registered mobile number or email.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs font-bold text-red-800 rounded-r-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-bold text-emerald-900 rounded-r-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. 0803 123 4567 or parent@example.ng"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 text-sm font-medium outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      New Password (min. 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 text-sm font-medium outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 text-sm font-medium outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-sm uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Resetting Password...' : 'Reset Password & Log In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : authView === 'child-picker' ? (
              /* VIEW B: DIRECT CHILD PICKER (IF CHILD TAPS CHILD LOGIN WITHOUT TYPING) */
              <div className="space-y-5 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Standard Login</span>
                </button>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center mb-3">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">
                    Pupil / Child Login
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Select your pupil profile or enter your first name and 4-digit PIN below.
                  </p>
                </div>

                {/* Grid of registered pupil avatars */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {students.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSignInAsPupil(child.id)}
                      className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all text-left flex items-center gap-3 cursor-pointer group"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden"
                        style={{ backgroundColor: child.avatarColor || '#0284C7' }}
                      >
                        {child.avatarUrl ? (
                          <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          child.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 group-hover:text-amber-800">
                          {child.name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          Primary {child.grade}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-500 text-center font-medium">
                    Or type your name and PIN on the main form.
                  </p>
                </div>
              </div>
            ) : (
              /* VIEW C: STANDARD LOGIN (EXACT IMAGE 1 REPRODUCTION) */
              <div className="space-y-5">
                
                {/* User/Lock icon badge */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                {/* Headings */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                    Welcome Back!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Log in to continue your learning journey.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs font-bold text-red-800 rounded-r-xl flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-bold text-emerald-900 rounded-r-xl flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleParentLogin} className="space-y-4">
                  {/* Field 1: Email or Phone Number */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-identifier"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your email or phone number"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 text-sm font-medium outline-hidden transition-all bg-white"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password / PIN */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      Password / PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password or PIN"
                        className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 text-sm font-medium outline-hidden transition-all bg-white"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => {
                        setForgotIdentifier(identifier);
                        setAuthView('forgot-password');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                    >
                      Forgot Password or PIN?
                    </button>
                  </div>

                  {/* Button 1: Parent / Guardian Login (Sunshine Yellow) */}
                  <button
                    type="submit"
                    id="parent-login-btn"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#FBBF24] hover:bg-[#F59E0B] active:scale-[0.99] text-slate-900 font-black text-sm tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Signing in...' : 'Parent / Guardian Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Button 2: Child / Pupil Login (Outline Blue) */}
                  <button
                    type="button"
                    id="pupil-login-btn"
                    onClick={handlePupilLogin}
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-white hover:bg-sky-50 active:scale-[0.99] border-2 border-[#0284C7] text-[#0284C7] font-black text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4 text-[#0284C7]" />
                    <span>Child / Pupil Login</span>
                    <ArrowRight className="w-4 h-4 text-[#0284C7]" />
                  </button>

                  {/* Divider: OR */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-3 text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                      OR
                    </span>
                    <div className="border-t border-slate-200 w-full" />
                  </div>

                  {/* Button 3: Create Parent Account (Vibrant Green) */}
                  <button
                    type="button"
                    id="create-parent-account-btn"
                    onClick={() => setIsSignUpWizardOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-white" />
                    <span>Create Parent Account</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </form>

                {/* Need Help Box */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-start gap-3 mt-4 text-xs">
                  <HelpCircle className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">
                      Need help? Contact our support team at
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1 text-[#0284C7]">
                        <Mail className="w-3 h-3" />
                        <a href="mailto:support@brightly.ng" className="hover:underline">support@brightly.ng</a>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#22C55E]" />
                        <span>+234 800 123 4567</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </main>

      {/* Bottom Footer: Trusted by Nigerian Families */}
      <footer className="w-full max-w-5xl mx-auto pt-6 pb-2 text-center text-xs text-slate-600 space-y-1 z-10">
        <div className="flex items-center justify-center gap-1.5 font-black text-slate-800 text-sm">
          <span>💛</span>
          <span>Trusted by Nigerian Families</span>
        </div>
        <p className="text-[11px] font-bold text-slate-500">
          Safe &nbsp;•&nbsp; Engaging &nbsp;•&nbsp; Effective
        </p>
      </footer>

    </div>
  );
};
