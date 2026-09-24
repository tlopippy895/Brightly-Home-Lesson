import React from 'react';
import { 
  X, 
  User, 
  Settings, 
  Volume2, 
  VolumeX, 
  CreditCard, 
  Lock, 
  GraduationCap, 
  Wallet, 
  Users, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  Camera, 
  BookOpen,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { StudentProfile, GradeLevel, TeacherPersona, VoiceTone } from '../types';

interface UserProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: StudentProfile;
  students: StudentProfile[];
  onSelectStudent: (student: StudentProfile) => void;
  onGradeChange: (grade: GradeLevel) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  voiceTone: VoiceTone;
  onSelectVoiceTone: (tone: VoiceTone) => void;
  onOpenSubscribeModal: () => void;
  onOpenHandoffModal: () => void;
  onOpenTeacherSelector: () => void;
  onOpenPupilPhotoModal?: () => void;
  onOpenAddChildModal?: () => void;
  activeTeacher: TeacherPersona;
  walletBalance: number;
  currentRole?: 'parent' | 'pupil' | 'guest' | null;
  onSignOut?: () => void;
}

export const UserProfileSettingsModal: React.FC<UserProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  students,
  onSelectStudent,
  onGradeChange,
  voiceEnabled,
  onToggleVoice,
  voiceTone,
  onSelectVoiceTone,
  onOpenSubscribeModal,
  onOpenHandoffModal,
  onOpenTeacherSelector,
  onOpenPupilPhotoModal,
  onOpenAddChildModal,
  activeTeacher,
  walletBalance,
  currentRole,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const grades: GradeLevel[] = [1, 2, 3, 4, 5, 6];
  const isEnrolled = activeStudent.grade === activeStudent.registeredGrade;
  const isTermPaid = isEnrolled && (activeStudent.termlyTuition?.[activeStudent.currentTerm]?.paid || activeStudent.activeSubscription);

  return (
    <div 
      id="profile-settings-modal-backdrop" 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="profile-settings-modal-content"
        className="bg-white rounded-[28px] sm:rounded-[36px] max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-profile-settings-btn"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer"
          aria-label="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          {/* Section 1: User Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-gray-100">
            <div className="relative group cursor-pointer" onClick={onOpenPupilPhotoModal}>
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#FBC02D] shadow-md overflow-hidden flex items-center justify-center bg-white"
              >
                {activeStudent.avatarUrl ? (
                  <img
                    src={activeStudent.avatarUrl}
                    alt={activeStudent.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                    style={{ backgroundColor: activeStudent.avatarColor || '#006738' }}
                  >
                    {activeStudent.name.charAt(0)}
                  </div>
                )}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#FBC02D] rounded-full text-black shadow-sm transition-transform group-hover:scale-110"
                title="Change pupil photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#006738] font-display uppercase tracking-tight truncate">
                  {activeStudent.name}
                </h2>
                <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                  Primary {activeStudent.grade}
                </span>
                {currentRole && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                    {currentRole === 'parent' ? '👤 Parent' : currentRole === 'pupil' ? '🎒 Pupil' : '👀 Guest'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-1">
                NERDC Nigerian Curriculum • Registered Class: Primary {activeStudent.registeredGrade}
              </p>

              {/* Child Switcher Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
                <span className="text-[11px] font-bold text-gray-400 mr-1">Switch Child:</span>
                {students.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onSelectStudent(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      st.id === activeStudent.id
                        ? 'bg-[#006738] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
                {onOpenAddChildModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddChildModal();
                    }}
                    className="px-2 py-1 rounded-lg text-xs font-bold text-[#D97706] hover:bg-amber-50 border border-dashed border-amber-300"
                  >
                    + Add Child
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Class Selection (Primary 1 - 6) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#006738]" />
                <span>Select Class / Grade Level:</span>
              </label>
              <span className="text-[11px] text-gray-500 font-bold">
                Active: Primary {activeStudent.grade}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {grades.map((grade) => {
                const isCurrent = activeStudent.grade === grade;
                const isRegistered = activeStudent.registeredGrade === grade;
                return (
                  <button
                    key={grade}
                    id={`settings-grade-${grade}`}
                    onClick={() => onGradeChange(grade)}
                    className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#006738] text-white shadow-md ring-2 ring-[#F59E0B]'
                        : 'bg-gray-50 hover:bg-emerald-50 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <span>Pri {grade}</span>
                    {isRegistered && (
                      <span className="text-[9px] text-[#F59E0B] font-bold">Enrolled</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Teacher & Voice Preferences */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#92400E] flex items-center gap-1.5">
                <span>Master Teacher & Voice Settings</span>
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenTeacherSelector();
                }}
                className="text-xs font-black text-[#006738] hover:underline"
              >
                Change Teacher →
              </button>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-200">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-300 shrink-0 bg-white">
                {activeTeacher.imageUrl ? (
                  <img
                    src={activeTeacher.imageUrl}
                    alt={activeTeacher.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl">{activeTeacher.avatarEmoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-xs text-[#006738] uppercase">
                  {activeTeacher.name}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {activeTeacher.subjectSpecialty} • {activeTeacher.yearsExperience} yrs exp
                </div>
              </div>
            </div>

            {/* Voice Tone Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-gray-700">Voice Enunciation Tone:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSelectVoiceTone('nigerian_teacher')}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    voiceTone === 'nigerian_teacher'
                      ? 'border-[#006738] bg-emerald-50/50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-black text-xs text-gray-900 flex items-center justify-between">
                    <span>Normal Voice</span>
                    {voiceTone === 'nigerian_teacher' && <Check className="w-3.5 h-3.5 text-[#006738]" />}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                    Authentic Nigerian teacher cadence & warm encouragement.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectVoiceTone('phonics')}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    voiceTone === 'phonics'
                      ? 'border-[#006738] bg-emerald-50/50 shadow-xs'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-black text-xs text-gray-900 flex items-center justify-between">
                    <span>Phonics Voice</span>
                    {voiceTone === 'phonics' && <Check className="w-3.5 h-3.5 text-[#006738]" />}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                    Crisp syllable enunciation & phoneme sounding.
                  </p>
                </button>
              </div>
            </div>

            {/* Voice Narration Active / Mute */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-gray-700">Lesson Audio Narration:</span>
              <button
                onClick={onToggleVoice}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                  voiceEnabled
                    ? 'bg-[#006738] text-white shadow-xs'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {voiceEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Voice Aloud (Active)</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Muted</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 4: Tuition & Wallet */}
          <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-sky-700" />
                <span>Wallet & Termly Tuition</span>
              </span>
              <span className="text-xs font-black text-[#006738]">
                Wallet: ₦{walletBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-sky-100">
              <div>
                <div className="text-xs font-black text-gray-900">
                  Primary {activeStudent.registeredGrade} • Term {activeStudent.currentTerm} Tuition
                </div>
                <div className="text-[11px] text-gray-500">
                  {isTermPaid ? (
                    <span className="text-emerald-600 font-bold">✓ Tuition Paid & Active</span>
                  ) : (
                    <span className="text-amber-600 font-bold">Tuition Unpaid (₦12,000 / Term)</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenSubscribeModal();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black text-xs uppercase tracking-wider transition-all self-start sm:self-auto"
              >
                Pay via Paystack
              </button>
            </div>
          </div>

          {/* Section 5: Parent Security PIN & Role Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenHandoffModal();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Parent PIN Security</span>
            </button>

            {onSignOut && (
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all ml-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Role / Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
