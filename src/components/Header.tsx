import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CreditCard, 
  Lock, 
  GraduationCap, 
  Wallet,
  Users,
  ChevronDown,
  Menu,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { StudentProfile, GradeLevel, TeacherPersona, VoiceTone } from '../types';
import { NIGERIAN_TEACHERS } from '../data/teachers';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
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
  activeTeacher: TeacherPersona;
  walletBalance: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentRole?: 'parent' | 'pupil' | 'guest' | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
  activeTeacher,
  walletBalance,
  onToggleSidebar,
  isSidebarOpen,
  currentRole,
  onSignOut,
}) => {
  const grades: GradeLevel[] = [1, 2, 3, 4, 5, 6];
  const isEnrolled = activeStudent.grade === activeStudent.registeredGrade;
  const isTermPaid = isEnrolled && (activeStudent.termlyTuition?.[activeStudent.currentTerm]?.paid || activeStudent.activeSubscription);

  return (
    <header id="app-header" className="bg-white border-b border-sky-100 shadow-sm sticky top-0 z-30">
      {/* Top Nigerian National Curriculum Accent Banner */}
      <div className="bg-[#006738] text-white px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Button in Top Bar */}
          {onToggleSidebar && (
            <button
              id="top-hamburger-btn"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation drawer"
              className="md:hidden p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all mr-1"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-xs">
            PRIMARY 1-6
          </span>
          <span className="hidden sm:inline font-black tracking-tight text-white/95 uppercase text-[11px]">
            ✨ BRIGHTLY HOME LESSON • "Learn. Understand. Practice. Master." • Teach for Mastery Before Speed (NERDC)
          </span>
          <span className="sm:hidden font-bold">✨ Teach for Mastery (NERDC)</span>

          {/* Enrolled Class Tag */}
          <span className="hidden lg:inline-flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-amber-200 border border-white/20">
            <span>Enrolled: Pri {activeStudent.registeredGrade}</span>
            {isTermPaid ? (
              <span className="text-[#86EFAC]">✓ Term {activeStudent.currentTerm} Active</span>
            ) : (
              <span className="text-amber-300">🔒 Tuition Pending</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-white">
            <Wallet className="w-3.5 h-3.5 text-[#FBC02D]" />
            <span className="text-[11px] font-bold">Wallet: <strong className="text-[#FBC02D] font-black">₦{walletBalance.toLocaleString()}</strong></span>
          </div>

          {currentRole && (
            <div className="hidden sm:inline-flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white border border-white/20">
              <span>{currentRole === 'parent' ? '👤 Parent' : currentRole === 'pupil' ? '🎒 Pupil' : '👀 Guest'}</span>
            </div>
          )}

          {onSignOut && (
            <button
              id="switch-role-btn"
              onClick={onSignOut}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all uppercase border border-white/20 cursor-pointer"
              title="Switch Role / Return to Gateway"
            >
              <LogOut className="w-3 h-3 text-[#FBC02D]" />
              <span className="hidden md:inline">Switch</span>
            </button>
          )}

          <button
            id="parent-handoff-top-btn"
            onClick={onOpenHandoffModal}
            className="flex items-center gap-1.5 bg-[#008751] hover:bg-[#007043] text-white px-3 py-1 rounded-full text-[11px] font-black tracking-wider transition-all border border-white/20 uppercase cursor-pointer"
          >
            <Lock className="w-3 h-3 text-[#FBC02D]" />
            <span className="hidden sm:inline">Parent PIN</span>
            <span className="sm:hidden">PIN</span>
          </button>
        </div>
      </div>

      {/* Main Header Controls */}
      <div className="px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Hamburger Toggle + Brand Emblem from uploaded image + Title + Grade Level Pills */}
        <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          {onToggleSidebar && (
            <button
              id="hamburger-menu-btn"
              onClick={onToggleSidebar}
              aria-label="Open navigation menu"
              className="flex items-center justify-center p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-800 border border-slate-300 transition-all shrink-0 active:scale-95 shadow-xs"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
          )}

          {/* Authentic Brand Logo & Title from image */}
          <div className="flex items-center gap-2.5 shrink-0">
            <BrandLogo size="md" variant="inline" showSubtitle={false} />
            <span className="hidden xl:inline-block bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-xs">
              PRIMARY 1-6
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden lg:block shrink-0 mx-1" />

          <span className="text-xs font-black text-[#006738] uppercase tracking-wider mr-1 hidden lg:inline shrink-0">
            CLASS:
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {grades.map((grade) => {
              const isCurrent = activeStudent.grade === grade;
              const isRegistered = activeStudent.registeredGrade === grade;
              return (
                <button
                  key={grade}
                  id={`grade-pill-${grade}`}
                  onClick={() => onGradeChange(grade)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all relative ${
                    isCurrent
                      ? 'bg-[#006738] text-white shadow-md scale-105 ring-2 ring-[#F59E0B]'
                      : 'bg-white text-slate-700 hover:bg-sky-50 border border-slate-200'
                  }`}
                  title={isRegistered ? `Registered Class: Primary ${grade}` : `Primary ${grade}`}
                >
                  <span>Pri {grade}</span>
                  {isRegistered && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F59E0B] ring-1 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Teacher Persona + Voice Tone Switcher + Voice Toggle + Subscribe */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
          {/* Teacher Selector Badge */}
          <button
            id="teacher-selector-btn"
            onClick={onOpenTeacherSelector}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl bg-[#FEFCE8] border-2 border-[#FBC02D] text-amber-950 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm"
          >
            {activeTeacher.imageUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden border border-[#FBC02D] shrink-0 bg-white shadow-xs">
                <img
                  src={activeTeacher.imageUrl}
                  alt={activeTeacher.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <span className="text-base">{activeTeacher.avatarEmoji}</span>
            )}
            <div className="flex flex-col text-left">
              <span className="leading-tight text-[11px] font-black text-[#006738] uppercase">{activeTeacher.name}</span>
              <span className="text-[9px] text-amber-800 font-bold hidden sm:inline">{voiceTone === 'phonics' ? 'Phonics Voice' : 'Normal Voice'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
          </button>

          {/* Voice Narration Control */}
          <button
            id="voice-toggle-btn"
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Teacher Voice Active' : 'Teacher Voice Muted'}
            className={`p-2 rounded-xl border-2 transition-all flex items-center gap-1.5 text-xs font-bold ${
              voiceEnabled
                ? 'bg-white border-slate-300 text-[#006738] hover:border-[#006738] shadow-xs'
                : 'bg-slate-100 border-slate-300 text-slate-400'
            }`}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#006738]" />
                <span className="text-[11px] text-[#006738] font-black hidden lg:inline">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] text-slate-500 hidden lg:inline">Mute</span>
              </>
            )}
          </button>

          {/* Paystack Subscribe Button */}
          <button
            id="header-subscribe-btn"
            onClick={onOpenSubscribeModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black text-xs border border-[#D97706] shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-all uppercase tracking-wider"
          >
            <CreditCard className="w-4 h-4 text-[#78350F]" />
            <span className="hidden xs:inline">Paystack</span>
          </button>
        </div>
      </div>
    </header>
  );
};

