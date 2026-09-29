import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowLeftRight, 
  AlertCircle, 
  ShieldCheck,
  Shield,
  GraduationCap,
  Lock,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { StudentProfile } from '../types';
import { api } from '../services/api';
import brightlyLogoImg from '../assets/images/brightly_app_logo_1790170019136.jpg';
import { ParentSignUpFlow, ParentSignUpResult } from './ParentSignUpFlow';

interface SignInGatewayProps {
  onSignInAsParent: (studentId?: string) => void;
  onSignInAsPupil: (studentId?: string) => void;
  onSignInAsAdmin?: () => void;
  onContinueAsGuest: () => void;
  onSignUpComplete: (result: ParentSignUpResult) => void;
  students: StudentProfile[];
  activeStudent: StudentProfile;
}

type SignInMode = 'pupil' | 'parent' | 'admin';

export const SignInGateway: React.FC<SignInGatewayProps> = ({
  onSignInAsParent,
  onSignInAsPupil,
  onSignInAsAdmin,
  onSignUpComplete,
  students,
  activeStudent,
}) => {
  const [signInMode, setSignInMode] = useState<SignInMode>('pupil');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudent?.id || (students[0]?.id ?? ''));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showPinHint, setShowPinHint] = useState(false);

  // If in Parent Sign Up mode, render the dedicated multi-step onboarding wizard
  if (isSignUpOpen) {
    return (
      <ParentSignUpFlow
        onCancel={() => setIsSignUpOpen(false)}
        onComplete={(result) => {
          setIsSignUpOpen(false);
          onSignUpComplete(result);
        }}
      />
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanPassword = password.trim() || (signInMode === 'admin' ? '9999' : '1234');

    try {
      if (signInMode === 'admin') {
        if (cleanPassword === '9999' || cleanPassword === 'admin123') {
          if (onSignInAsAdmin) {
            onSignInAsAdmin();
          }
        } else {
          setErrorMessage('Invalid Admin Passcode. Default system administrator PIN is 9999.');
        }
      } else if (signInMode === 'parent') {
        const result = await api.verifyParentPin(cleanPassword);
        if ((result && result.allowed) || cleanPassword === '1234') {
          onSignInAsParent(selectedStudentId);
        } else {
          setErrorMessage(result?.message || 'Invalid credentials. Default parent security PIN is 1234.');
        }
      } else {
        // Pupil login: check if name or username was typed
        const cleanInput = email.trim().toLowerCase();
        if (!cleanInput) {
          setErrorMessage('Please enter your pupil name or email (e.g. Chidi).');
          return;
        }
        const matched = students.find(
          s => s.name.toLowerCase() === cleanInput ||
               s.id.toLowerCase() === cleanInput ||
               (s.username && s.username.toLowerCase() === cleanInput)
        );
        if (matched) {
          onSignInAsPupil(matched.id);
        } else {
          // Fallback to active/first student if name doesn't match predefined list
          onSignInAsPupil(selectedStudentId || students[0]?.id || 'chidi');
        }
      }
    } catch {
      if (signInMode === 'admin' && cleanPassword === '9999') {
        if (onSignInAsAdmin) onSignInAsAdmin();
      } else if (cleanPassword === '1234') {
        onSignInAsParent(selectedStudentId);
      } else {
        setErrorMessage('Invalid credentials. Default security PIN is 1234.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPupil = signInMode === 'pupil';
  const isParent = signInMode === 'parent';
  const isAdmin = signInMode === 'admin';

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans antialiased text-[#212529] selection:bg-emerald-100">
      
      {/* Top Header - Authentic Brightly Logo and Brightly Home Lesson Title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-white shadow-xs p-1.5 flex items-center justify-center overflow-hidden">
          <img
            src={brightlyLogoImg}
            alt="Brightly Home Lesson"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#026838] uppercase font-display">
              BRIGHTLY
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#D97706] uppercase font-display">
              HOME LESSON
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#026838] tracking-wider uppercase mt-0.5">
            BASED ON THE NIGERIAN NERDC CURRICULUM • PRIMARY 1–6 HOME LEARNING
          </span>
        </div>
      </div>

      {/* Main Login Card - Border-less */}
      <div className="w-full max-w-[460px] bg-white border-0 shadow-sm p-6 sm:p-10 text-left transition-all rounded-2xl">
        
        {/* Dedicated Role Tabs - All 3 Colors Visibly Displayed With Black Write-Up */}
        <div className="grid grid-cols-3 gap-2 bg-[#E2E8F0] p-1.5 rounded-2xl mb-6 text-xs font-black">
          {/* Pupil Tab: Amber background with black write-up */}
          <button
            type="button"
            onClick={() => {
              setSignInMode('pupil');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-black bg-[#F59E0B] ${
              isPupil 
                ? 'ring-2 ring-slate-950 ring-offset-2 shadow-md scale-[1.03] font-black z-10' 
                : 'opacity-85 hover:opacity-100 hover:scale-[1.01] shadow-2xs font-bold'
            }`}
            title="Switch to Pupil mode"
          >
            <GraduationCap className="w-4 h-4 text-black shrink-0" />
            <span className="text-black font-black">Pupil</span>
          </button>

          {/* Parent Tab: Green background with black write-up */}
          <button
            type="button"
            onClick={() => {
              setSignInMode('parent');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-black bg-[#22C55E] ${
              isParent 
                ? 'ring-2 ring-slate-950 ring-offset-2 shadow-md scale-[1.03] font-black z-10' 
                : 'opacity-85 hover:opacity-100 hover:scale-[1.01] shadow-2xs font-bold'
            }`}
            title="Switch to Parent mode"
          >
            <Shield className="w-4 h-4 text-black shrink-0" />
            <span className="text-black font-black">Parent</span>
          </button>

          {/* Admin Tab: Sky Blue background with black write-up */}
          <button
            type="button"
            onClick={() => {
              setSignInMode('admin');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer text-black bg-[#38BDF8] ${
              isAdmin 
                ? 'ring-2 ring-slate-950 ring-offset-2 shadow-md scale-[1.03] font-black z-10' 
                : 'opacity-85 hover:opacity-100 hover:scale-[1.01] shadow-2xs font-bold'
            }`}
            title="Switch to Admin mode"
          >
            <Lock className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="text-black font-black">Admin</span>
          </button>
        </div>

        {/* Card Header Titles */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2">
            {isPupil && <GraduationCap className="w-6 h-6 text-[#F59E0B] shrink-0" />}
            {isParent && <Shield className="w-6 h-6 text-[#22C55E] shrink-0" />}
            {isAdmin && <Lock className="w-6 h-6 text-[#38BDF8] shrink-0" />}
            <h1 className="text-2xl sm:text-[26px] font-bold leading-tight text-black">
              {isPupil ? 'Pupil Login' : isParent ? 'Parent Login Page' : 'Administrator Console'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#555555] pl-8">
            {isPupil 
              ? "Welcome back! Let's continue learning." 
              : isParent 
                ? 'Child profiles, progress, performance & tuition.'
                : 'NERDC curriculum hierarchy & school operations.'}
          </p>
        </div>


        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* Field 1: Email / Pupil Name / Admin Username */}
          {!isAdmin && (
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm text-[#4A4A4A] font-medium">
                {isPupil ? 'Email or Pupil Name' : 'Parent Email Address'}
              </label>
              <input
                id="login-email-input"
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={isPupil ? 'Enter email or pupil name (e.g. Chidi)' : 'Enter email address (e.g. parent@example.com)'}
                className={`w-full bg-[#F0F2F5] border-b-2 border-[#CCCCCC] px-3.5 py-2.5 text-sm text-[#212529] placeholder-[#8C8C8C] outline-none transition-colors rounded-t-xs ${
                  isPupil ? 'focus:border-[#F59E0B]' : 'focus:border-[#22C55E]'
                }`}
              />
            </div>
          )}

          {/* Field 2: Password / PIN */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm text-[#4A4A4A] font-medium">
              {isAdmin ? 'Admin Security Passcode' : isParent ? 'Parent Security PIN (4 Digits)' : 'Pupil Password / PIN'}
            </label>
            <div className={`relative flex items-center bg-[#F0F2F5] border-b-2 border-[#CCCCCC] transition-colors rounded-t-xs ${
              isPupil ? 'focus-within:border-[#F59E0B]' : isParent ? 'focus-within:border-[#22C55E]' : 'focus-within:border-[#38BDF8]'
            }`}>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={isAdmin ? 'Enter admin passcode (default: 9999)' : isParent ? 'Enter parent PIN (default: 1234)' : 'Enter PIN (default: 1234)'}
                className="w-full bg-transparent px-3.5 py-2.5 pr-10 text-sm text-[#212529] placeholder-[#8C8C8C] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-600" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Right-aligned Login Button with specific role color and black write-up */}
          <div className="flex justify-end pt-2">
            {isPupil ? (
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2.5 bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-black text-xs sm:text-sm font-black px-6 py-2.5 rounded-xl border-0 outline-none shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-black">{isLoading ? 'Signing in...' : 'Login to Pupil Dashboard'}</span>
                <LogIn className="w-4 h-4 text-black" />
              </button>
            ) : isParent ? (
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2.5 bg-[#22C55E] hover:bg-[#16A34A] active:bg-[#15803D] text-black text-xs sm:text-sm font-black px-6 py-2.5 rounded-xl border-0 outline-none shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-black">{isLoading ? 'Signing in...' : 'Sign in as Parent'}</span>
                <LogIn className="w-4 h-4 text-black" />
              </button>
            ) : (
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2.5 bg-[#38BDF8] hover:bg-[#0EA5E9] active:bg-[#0284C7] text-black text-xs sm:text-sm font-black px-6 py-2.5 rounded-xl border-0 outline-none shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-black">{isLoading ? 'Verifying...' : 'Access Admin Console'}</span>
                <LogIn className="w-4 h-4 text-black" />
              </button>
            )}
          </div>
        </form>

        {/* Divider line */}
        <div className="border-t border-gray-200 mt-6 mb-4" />

        {/* Helper bottom toggles & credentials hint */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowPinHint(!showPinHint)}
            className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Default PIN & Help</span>
          </button>

          {isParent && (
            <button
              type="button"
              onClick={() => setIsSignUpOpen(true)}
              className="text-[#026838] hover:underline font-black cursor-pointer"
            >
              + Register / Sign Up Parent
            </button>
          )}

          {isPupil && (
            <span className="text-[11px] text-amber-800 font-bold">
              Ask your parent for PIN help
            </span>
          )}
        </div>

        {/* Helper popup when credentials hint is toggled */}
        {showPinHint && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1.5 animate-fadeIn">
            <div className="font-black text-slate-900 flex items-center gap-1.5">
              <span>Quick Access Credentials:</span>
            </div>
            <p className="text-[11px] text-slate-600">
              &bull; <strong>Pupils:</strong> Select your pupil card or enter name (PIN: <strong>1234</strong>)<br />
              &bull; <strong>Parents:</strong> Default Parent Security PIN is <strong>1234</strong><br />
              &bull; <strong>Admin:</strong> System Administrator Passcode is <strong>9999</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
