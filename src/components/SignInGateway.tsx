import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  Shield, 
  GraduationCap, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  UserPlus, 
  ArrowLeft 
} from 'lucide-react';
import { StudentProfile } from '../types';
import { api } from '../services/api';
import { ParentSignUpFlow, ParentSignUpResult } from './ParentSignUpFlow';
import brightlyAppLogo from '../assets/images/brightly_app_logo_1790170019136.jpg';

interface SignInGatewayProps {
  onSignInAsParent: (studentId?: string) => void;
  onSignInAsPupil: (studentId?: string) => void;
  onSignInAsAdmin?: () => void;
  onContinueAsGuest: () => void;
  onSignUpComplete: (result: ParentSignUpResult) => void;
  students: StudentProfile[];
  activeStudent: StudentProfile;
}

export type SignInMode = 'parent' | 'pupil' | 'create-parent' | 'forgot-password' | 'admin';

export function isValidNigerianPhone(phone: string): boolean {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+234')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('234') && cleaned.length >= 12) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return /^0[789][01]\d{8}$/.test(cleaned);
}

export const SignInGateway: React.FC<SignInGatewayProps> = ({
  onSignInAsParent,
  onSignInAsPupil,
  onSignInAsAdmin,
  onSignUpComplete,
  students,
  activeStudent,
}) => {
  const [signInMode, setSignInMode] = useState<SignInMode>('pupil');
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStudentId] = useState<string>(activeStudent?.id || students[0]?.id || '');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConsent, setRegConsent] = useState(false);

  // Forgot password fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'find' | 'reset'>('find');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpWizardOpen, setIsSignUpWizardOpen] = useState(false);

  // Allow administrators to access the management interface via URL query parameter
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'admin' || urlParams.get('role') === 'admin' || urlParams.get('admin') === 'true') {
        setSignInMode('admin');
        if (!identifier || identifier.includes('example.com') || identifier === 'chidi') {
          setIdentifier('audit.admin@brightly.ng');
        }
      }
    } catch {
      // In non-browser environments, safely ignore
    }
  }, []);

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

  // Handle Standard Login (Parent, Pupil, Admin)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (signInMode === 'admin') {
        const adminEmail = identifier.trim();
        const adminPassword = password.trim();
        if (!adminEmail || !adminPassword) {
          setErrorMessage('Administrator email and password are required.');
          setIsLoading(false);
          return;
        }
        const result = await api.loginAdmin(adminEmail, adminPassword);
        if (result.success) {
          if (onSignInAsAdmin) onSignInAsAdmin();
        } else {
          setErrorMessage(result.message || 'Invalid Administrator credentials. Access denied.');
        }
      } else if (signInMode === 'parent') {
        const parentId = identifier.trim();
        const parentPass = password.trim();
        if (!parentId) {
          setErrorMessage('Please enter your registered phone number or email.');
          setIsLoading(false);
          return;
        }
        if (!parentPass) {
          setErrorMessage('Please enter your password or 4-digit security PIN.');
          setIsLoading(false);
          return;
        }
        const result = await api.loginParent(parentId, parentPass);
        if (result.success) {
          onSignInAsParent(selectedStudentId);
        } else {
          setErrorMessage(
            result.message ||
            'Invalid parent credentials. Please verify your phone number/email and password.'
          );
        }
      } else if (signInMode === 'pupil') {
        const pupilInput = identifier.trim();
        let targetStudentId: string | undefined;
        let pupilIdentifier: string | undefined;

        if (pupilInput) {
          pupilIdentifier = pupilInput;
          const normalized = pupilInput.toLowerCase().replace(/\s+/g, ' ');
          const matched = students.find(
            s => s.name.trim().toLowerCase().replace(/\s+/g, ' ') === normalized ||
                 s.id.trim().toLowerCase() === normalized ||
                 (s.username && s.username.trim().toLowerCase() === normalized)
          );
          if (matched) {
            targetStudentId = matched.id;
          }
        } else if (selectedStudentId) {
          targetStudentId = selectedStudentId;
        } else if (students.length > 0) {
          targetStudentId = students[0].id;
        }

        const pupilPin = password.trim() || '1234';
        const result = await api.loginPupil(targetStudentId, pupilIdentifier, pupilPin, pupilInput);
        if (result.success && result.student) {
          onSignInAsPupil(result.student.id);
        } else if (result.success) {
          onSignInAsPupil(targetStudentId || 'chidi');
        } else {
          setErrorMessage(
            result.message ||
            "We couldn't find this pupil account. Please check the registered pupil name or ask your parent or administrator for help."
          );
        }
      }
    } catch (err: unknown) {
      console.error('Authentication exception:', err);
      const e = err as { name?: string; message?: string };
      const isNetwork =
        e?.name === 'TypeError' ||
        (e?.message &&
          (e.message.includes('fetch') ||
            e.message.includes('Failed to fetch') ||
            e.message.includes('NetworkError')));
      setErrorMessage(
        isNetwork
          ? 'Unable to connect to authentication server. Please check your internet connection.'
          : 'Authentication service temporarily busy. Please retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct 1-tap pupil entry (easy, simple, and direct for children)
  const handleQuickPupilSignIn = async (pupil: StudentProfile) => {
    setErrorMessage(null);
    setSuccessMessage(`Welcome back, ${pupil.name}! Taking you straight to your class... 🚀`);
    setIdentifier(pupil.name);
    setPassword(pupil.pin || '1234');
    setIsLoading(true);

    try {
      const pupilPin = pupil.pin || '1234';
      const result = await api.loginPupil(pupil.id, pupil.name, pupilPin, pupil.name);
      if (result.success && result.student) {
        onSignInAsPupil(result.student.id);
      } else {
        onSignInAsPupil(pupil.id);
      }
    } catch {
      onSignInAsPupil(pupil.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Quick Parent Account Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = regName.trim();
    const phone = regPhone.trim();
    const email = regEmail.trim();
    const pass = regPassword.trim();
    const confirm = regConfirmPassword.trim();

    if (!name) {
      setErrorMessage('Please enter your full parent/guardian name.');
      return;
    }
    if (!phone) {
      setErrorMessage('Please enter your active Nigerian mobile phone number.');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setErrorMessage('Please enter a valid 11-digit Nigerian mobile phone number (e.g. 0803 123 4567).');
      return;
    }
    if (pass.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (pass !== confirm) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (!regConsent) {
      setErrorMessage('Please accept the parental consent and educational privacy terms to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.registerParent({
        name,
        phone,
        email: email || undefined,
        password: pass,
        pin: regPin.trim() || undefined,
        consentRecorded: true,
      });

      if (result.success) {
        setSuccessMessage('Account registered successfully! Redirecting to parent dashboard...');
        setTimeout(() => {
          onSignInAsParent();
        }, 600);
      } else {
        setErrorMessage(result.message || 'Parent registration could not be completed. Please try again.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e?.message || 'Unable to complete registration. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password / PIN
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const ident = forgotIdentifier.trim();
    if (!ident) {
      setErrorMessage('Please enter your registered Nigerian mobile number or email.');
      return;
    }

    if (forgotStep === 'find') {
      setIsLoading(true);
      try {
        const result = await api.forgotPassword(ident);
        if (result.success) {
          setForgotStep('reset');
          setSuccessMessage(result.message || 'Account verified. Please create your new password.');
        } else {
          setErrorMessage(result.message || 'No parent account found matching this mobile number or email.');
        }
      } catch {
        setErrorMessage('Unable to verify account. Please check your network connection.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const newPass = newPassword.trim();
      if (newPass.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        return;
      }
      if (newPass !== confirmNewPassword.trim()) {
        setErrorMessage('New passwords do not match. Please re-enter.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await api.forgotPassword(ident, newPass, confirmNewPassword.trim());
        if (result.success) {
          setSuccessMessage('Password reset successfully! Logging you in...');
          setTimeout(() => {
            onSignInAsParent();
          }, 800);
        } else {
          setErrorMessage(result.message || 'Password reset could not be completed.');
        }
      } catch {
        setErrorMessage('Unable to reset password. Please check your network connection.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isPupil = signInMode === 'pupil';
  const isParent = signInMode === 'parent';
  const isCreateParent = signInMode === 'create-parent';
  const isForgotPassword = signInMode === 'forgot-password';
  const isAdmin = signInMode === 'admin';

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 font-sans antialiased text-[#212529] selection:bg-emerald-100">
      
      {/* Top Branding Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-white shadow-xs p-1.5 flex items-center justify-center overflow-hidden">
          <img src={brightlyAppLogo} alt="Brightly Home Lesson" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#026838] uppercase font-display">BRIGHTLY</span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#D97706] uppercase font-display">HOME LESSON</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#026838] tracking-wider uppercase mt-0.5">
            BASED ON THE NIGERIAN PRIMARY CURRICULUM • PRIMARY 1–6 HOME LEARNING
          </span>
        </div>
      </div>

      {/* Main Single Card Container */}
      <div className="w-full max-w-[480px] bg-white border-0 shadow-md p-6 sm:p-9 text-left transition-all rounded-3xl">
        
        {/* Top 2 Tabs: Child, Parent */}
        {!isAdmin && (
          <div className="grid grid-cols-2 gap-1.5 bg-[#E2E8F0] p-1.5 rounded-2xl mb-6 text-xs font-black">
            <button
              type="button"
              id="tab-pupil-login"
              onClick={() => {
                setSignInMode('pupil');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                isPupil
                  ? 'bg-[#F59E0B] text-black ring-2 ring-slate-900 shadow-sm font-black'
                  : 'text-slate-700 hover:text-black hover:bg-white/60 font-bold'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>Child Login</span>
            </button>

            <button
              type="button"
              id="tab-parent-login"
              onClick={() => {
                setSignInMode('parent');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-1 sm:px-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                isParent
                  ? 'bg-[#22C55E] text-black ring-2 ring-slate-900 shadow-sm font-black'
                  : 'text-slate-700 hover:text-black hover:bg-white/60 font-bold'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Parent Login</span>
            </button>
          </div>
        )}

        {/* View Header with Icon and Explanatory Text */}
        <div className="mb-5 space-y-1">
          <div className="flex items-center gap-2">
            {isPupil && <GraduationCap className="w-6 h-6 text-[#F59E0B] shrink-0" />}
            {isParent && <Shield className="w-6 h-6 text-[#22C55E] shrink-0" />}
            {isCreateParent && <UserPlus className="w-6 h-6 text-[#026838] shrink-0" />}
            {isForgotPassword && <KeyRound className="w-6 h-6 text-indigo-600 shrink-0" />}
            {isAdmin && <Lock className="w-6 h-6 text-[#38BDF8] shrink-0" />}
            
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-slate-900">
              {isPupil && 'Child Login'}
              {isParent && 'Parent Login'}
              {isCreateParent && 'Create Parent Account'}
              {isForgotPassword && 'Recover Parent Account'}
              {isAdmin && 'Administrator Access'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {isParent && 'Access child learning performance, syllabus reports & tuition.'}
            {isCreateParent && "Register your family account to manage your children's primary education."}
            {isForgotPassword && 'Reset your password securely using your registered mobile number or email.'}
            {isAdmin && 'Authorized curriculum and system management.'}
          </p>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-800 rounded-r-xl flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-900 rounded-r-xl flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. STANDARD LOGIN FORM (PARENT, PUPIL, ADMIN)                              */}
        {/* ========================================================================= */}
        {(isParent || isPupil || isAdmin) && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Quick 1-Tap Profile Chooser for Children */}
            {isPupil && students && students.length > 0 && (
              <div className="space-y-2.5 pb-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🌟 Tap Your Picture to Enter Class:</span>
                  </label>
                  <span className="text-[10px] font-black text-[#026838] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    1-Tap Entry
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {students.slice(0, 6).map((pupil) => {
                    const isSelected = identifier.trim().toLowerCase() === pupil.name.trim().toLowerCase() ||
                                       identifier.trim().toLowerCase() === pupil.id.trim().toLowerCase();
                    return (
                      <button
                        key={pupil.id}
                        type="button"
                        id={`quick-select-pupil-${pupil.id}`}
                        onClick={() => handleQuickPupilSignIn(pupil)}
                        title={`Tap to sign in as ${pupil.name}`}
                        className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 group ${
                          isSelected
                            ? 'bg-amber-100 border-[#F59E0B] shadow-sm ring-2 ring-[#F59E0B]/40'
                            : 'bg-[#F8FAFC] border-slate-200 hover:border-amber-400 hover:bg-amber-50/70 hover:shadow-xs'
                        }`}
                      >
                        <div 
                          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white text-base font-black shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: pupil.avatarColor || '#026838' }}
                        >
                          {pupil.avatarUrl ? (
                            <img src={pupil.avatarUrl} alt={pupil.name} className="w-full h-full object-cover" />
                          ) : (
                            pupil.name.charAt(0)
                          )}
                        </div>
                        <div className="text-center overflow-hidden w-full">
                          <span className="block text-xs font-black text-slate-900 truncate">{pupil.name}</span>
                          <span className="block text-[10px] font-bold text-[#026838]">Primary {pupil.grade}</span>
                        </div>
                        <span className="w-full py-1 text-center text-[10px] font-black uppercase tracking-wider rounded-lg bg-[#026838] text-white group-hover:bg-[#014d28] transition-colors shadow-2xs">
                          Enter 🚀
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-bold justify-center">
                  <span className="h-px bg-slate-200 flex-1" />
                  <span>OR SIGN IN BY NAME</span>
                  <span className="h-px bg-slate-200 flex-1" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm text-slate-700 font-bold">
                {isParent ? 'Mobile Number or Email' : isPupil ? 'Pupil Name or Pupil ID' : 'Administrator Email'}
              </label>
              <input
                id="login-identifier-input"
                type={isAdmin ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={
                  isParent
                    ? 'e.g. 0803 123 4567 or parents@brightly.ng'
                    : isPupil
                    ? 'e.g. Chidi or Aminat'
                    : 'audit.admin@brightly.ng'
                }
                className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm text-slate-700 font-bold">
                  {isParent ? 'Password or Security PIN' : isPupil ? 'Child PIN (4 Digits)' : 'Administrator Password'}
                </label>
                {isParent && (
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMode('forgot-password');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-[#026838] hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder={
                    isParent
                      ? 'Enter your password or PIN (default: 1234)'
                      : isPupil
                      ? 'Enter PIN (default: 1234)'
                      : 'Enter administrator password'
                  }
                  className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                  isPupil
                    ? 'bg-[#F59E0B] hover:bg-[#D97706] text-black'
                    : isParent
                    ? 'bg-[#22C55E] hover:bg-[#16A34A] text-black'
                    : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
                }`}
              >
                <span>
                  {isLoading ? 'Verifying...' : isPupil ? 'Start Learning' : isParent ? 'Sign In as Parent' : 'Access Admin Console'}
                </span>
                <LogIn className="w-4 h-4" />
              </button>
            </div>

            {isParent && (
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600 font-medium">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMode('create-parent');
                      setErrorMessage(null);
                    }}
                    className="text-[#026838] font-black hover:underline cursor-pointer"
                  >
                    Create Parent Account
                  </button>
                </p>
              </div>
            )}
          </form>
        )}

        {/* ========================================================================= */}
        {/* 2. CREATE PARENT ACCOUNT FORM                                            */}
        {/* ========================================================================= */}
        {isCreateParent && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Full Parent/Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-name-input"
                type="text"
                value={regName}
                onChange={(e) => {
                  setRegName(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. Mr. Babatunde Adeleke"
                className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Nigerian Mobile Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-phone-input"
                type="tel"
                value={regPhone}
                onChange={(e) => {
                  setRegPhone(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. 0803 123 4567"
                className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
              />
              <span className="text-[11px] text-slate-500 font-medium">
                Standard 11-digit mobile number for SMS lesson notifications.
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="reg-email-input"
                type="email"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. parent@example.com"
                className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="reg-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Min. 6 chars"
                  className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="reg-confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="Repeat password"
                  className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                4-Digit Security PIN <span className="text-slate-400 font-normal">(Optional, for child handoff)</span>
              </label>
              <input
                id="reg-pin-input"
                type="password"
                maxLength={4}
                value={regPin}
                onChange={(e) => {
                  setRegPin(e.target.value.replace(/\D/g, ''));
                  setErrorMessage(null);
                }}
                placeholder="Default: 1234"
                className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium tracking-widest"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="reg-consent-checkbox"
                  type="checkbox"
                  checked={regConsent}
                  onChange={(e) => {
                    setRegConsent(e.target.checked);
                    setErrorMessage(null);
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-[#026838] focus:ring-[#026838] accent-[#026838] cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I confirm that I am a parent or legal guardian, and I consent to Brightly Home Lesson processing learning progress records in compliance with NDPR and privacy guidelines.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-black text-sm bg-[#026838] hover:bg-[#02562e] text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Creating Account...' : 'Create Parent Account'}</span>
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 3. RECOVER PASSWORD / SECURITY PIN FORM                                  */}
        {/* ========================================================================= */}
        {isForgotPassword && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm text-slate-700 font-bold">
                Registered Mobile Number or Email
              </label>
              <input
                id="forgot-identifier-input"
                type="text"
                value={forgotIdentifier}
                disabled={forgotStep === 'reset'}
                onChange={(e) => {
                  setForgotIdentifier(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. 0803 123 4567 or parents@brightly.ng"
                className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium disabled:opacity-70"
              />
            </div>

            {forgotStep === 'reset' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm text-slate-700 font-bold">
                    New Password
                  </label>
                  <input
                    id="forgot-new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm text-slate-700 font-bold">
                    Confirm New Password
                  </label>
                  <input
                    id="forgot-confirm-password-input"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Repeat new password"
                    className="w-full bg-[#F0F2F5] border-2 border-transparent focus:border-[#026838] focus:bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all rounded-xl font-medium"
                  />
                </div>
              </>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <span>
                  {isLoading
                    ? 'Verifying...'
                    : forgotStep === 'find'
                    ? 'Verify Account'
                    : 'Save New Password & Sign In'}
                </span>
                <KeyRound className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSignInMode('parent');
                  setForgotStep('find');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* Administrator Auxiliary Controls */}
        {isAdmin && (
          <div className="border-t border-slate-100 mt-6 pt-4 flex justify-center">
            <button
              type="button"
              id="admin-gateway-toggle"
              onClick={() => {
                setSignInMode('parent');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Back to Family Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
