import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowLeft, Check, Sparkles, GraduationCap, UserPlus } from 'lucide-react';
import { StudentProfile } from '../types';
import { api } from '../services/api';
import brightlyLogoImg from '../assets/images/brightly_logo_1790080723576.jpg';
import { ParentSignUpFlow, ParentSignUpResult } from './ParentSignUpFlow';

interface SignInGatewayProps {
  onSignInAsParent: () => void;
  onSignInAsPupil: (studentId?: string) => void;
  onContinueAsGuest: () => void;
  onSignUpComplete: (result: ParentSignUpResult) => void;
  students: StudentProfile[];
  activeStudent: StudentProfile;
}

export const SignInGateway: React.FC<SignInGatewayProps> = ({
  onSignInAsParent,
  onSignInAsPupil,
  onContinueAsGuest,
  onSignUpComplete,
  students,
  activeStudent,
}) => {
  const [viewMode, setViewMode] = useState<'gateway' | 'parent_pin' | 'pupil_select' | 'parent_signup'>('gateway');
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudent?.id || students[0]?.id || '');

  // If in Parent Sign Up mode, render the dedicated multi-step onboarding wizard
  if (viewMode === 'parent_signup') {
    return (
      <ParentSignUpFlow
        onCancel={() => setViewMode('gateway')}
        onComplete={(result) => {
          onSignUpComplete(result);
        }}
      />
    );
  }

  const handlePinDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);
    setPinError(null);

    if (val && index < 3) {
      const nextInput = document.getElementById(`gateway-pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`gateway-pin-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === 'Enter') {
      handleVerifyParentPin();
    }
  };

  const handleVerifyParentPin = async () => {
    const fullPin = pin.join('');
    if (fullPin.length !== 4) {
      setPinError('Please enter all 4 digits of your Parent PIN.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    try {
      // Default fast path for 1234
      if (fullPin === '1234') {
        api.verifyParentPin(fullPin).catch(() => {});
        onSignInAsParent();
        return;
      }

      const result = await api.verifyParentPin(fullPin);
      if (result && result.allowed) {
        onSignInAsParent();
      } else {
        setPinError(result?.message || 'Incorrect PIN. The default Parent PIN is 1234.');
      }
    } catch (err) {
      if (fullPin === '1234') {
        onSignInAsParent();
      } else {
        setPinError('Incorrect PIN. The default Parent PIN is 1234.');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Plain Gateway Entry without outer board or card border */}
      <div className="w-full max-w-[380px] text-center relative transition-all duration-300 py-6">
        
        {/* Entry Gateway Logo - 3D House B on Open Book */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 flex items-center justify-center relative group">
          <img
            src={brightlyLogoImg}
            alt="Brightly Home Lesson"
            className="w-full h-full object-contain filter drop-shadow-md rounded-2xl hover:scale-105 transition-transform duration-200"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* View Mode: Main Gateway */}
        {viewMode === 'gateway' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Titles */}
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Brightly Home Lesson
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Sign in to continue
              </p>
            </div>

            {/* Role Action Buttons in Green & Yellow */}
            <div className="space-y-3 pt-1">
              {/* Primary Green Button: Sign in as Parent */}
              <button
                id="signin-as-parent-btn"
                onClick={() => setViewMode('parent_pin')}
                className="w-full py-3 px-4 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#FBC02D]" />
                <span>Sign in as Parent</span>
              </button>

              {/* Vibrant Golden Yellow Button: Sign in as Pupil */}
              <button
                id="signin-as-pupil-btn"
                onClick={() => {
                  if (students.length > 1) {
                    setViewMode('pupil_select');
                  } else {
                    onSignInAsPupil(students[0]?.id);
                  }
                }}
                className="w-full py-3 px-4 bg-[#FBC02D] hover:bg-[#F59E0B] active:bg-[#D97706] text-gray-900 font-bold text-sm rounded-xl border border-amber-400/60 shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-[#026838]" />
                <span>Sign in as Pupil</span>
              </button>

              {/* High-visibility Sign Up Action: Parent Sign Up */}
              <div className="pt-2">
                <button
                  id="signup-as-parent-gateway-btn"
                  onClick={() => setViewMode('parent_signup')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-50 to-amber-50 hover:from-emerald-100 hover:to-amber-100 text-[#026838] font-bold text-xs uppercase tracking-wider rounded-xl border-2 border-[#026838]/30 hover:border-[#026838] shadow-xs hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <UserPlus className="w-4 h-4 text-[#026838] group-hover:scale-110 transition-transform" />
                  <span>Sign Up as Parent & Enroll Pupils</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#FBC02D]" />
                </button>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-gray-100 pt-1" />

            {/* Guest / View Only Link */}
            <div>
              <button
                id="continue-as-guest-btn"
                onClick={onContinueAsGuest}
                className="text-xs text-gray-500 hover:text-[#026838] underline decoration-dotted underline-offset-4 font-medium transition-colors cursor-pointer"
              >
                Continue as Guest (view only)
              </button>
            </div>
          </div>
        )}

        {/* View Mode: Parent PIN Entry */}
        {viewMode === 'parent_pin' && (
          <div className="space-y-5 animate-fadeIn">
            <button
              onClick={() => {
                setViewMode('gateway');
                setPin(['', '', '', '']);
                setPinError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#026838] transition-colors font-medium self-start mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to roles</span>
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#026838] tracking-tight">
                Parent Security PIN
              </h2>
              <p className="text-xs text-gray-500">
                Enter your 4-digit PIN (Default: <strong className="text-gray-800">1234</strong>)
              </p>
            </div>

            {/* 4-digit PIN Inputs */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  id={`gateway-pin-input-${idx}`}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="w-11 h-13 bg-[#f8fafc] border-2 border-gray-200 focus:border-[#026838] focus:bg-white rounded-xl text-center text-xl font-bold text-gray-900 focus:outline-none transition-all"
                />
              ))}
            </div>

            {pinError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              id="confirm-parent-pin-btn"
              onClick={handleVerifyParentPin}
              disabled={isVerifyingPin}
              className="w-full py-3 px-4 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingPin ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#FBC02D]" />
                  <span>Sign in as Parent</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* View Mode: Pupil Profile Selector (if multiple children exist) */}
        {viewMode === 'pupil_select' && (
          <div className="space-y-5 animate-fadeIn">
            <button
              onClick={() => setViewMode('gateway')}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#026838] transition-colors font-medium self-start mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to roles</span>
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#026838] tracking-tight">
                Select Pupil Profile
              </h2>
              <p className="text-xs text-gray-500">
                Choose who is learning today
              </p>
            </div>

            <div className="space-y-2 text-left">
              {students.map((pupil) => (
                <div
                  key={pupil.id}
                  onClick={() => setSelectedStudentId(pupil.id)}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    selectedStudentId === pupil.id
                      ? 'border-[#026838] bg-emerald-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pupil.avatarUrl}
                      alt={pupil.name}
                      className="w-9 h-9 rounded-full object-cover border border-amber-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900">{pupil.name}</div>
                      <div className="text-[10px] text-gray-500">Primary {pupil.grade} • Term {pupil.currentTerm}</div>
                    </div>
                  </div>
                  {selectedStudentId === pupil.id && (
                    <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              id="confirm-pupil-signin-btn"
              onClick={() => onSignInAsPupil(selectedStudentId)}
              className="w-full py-3 px-4 bg-[#026838] hover:bg-[#014d28] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#FBC02D]" />
              <span>Enter Classroom</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
