import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  Menu, 
  Settings,
  Wallet
} from 'lucide-react';
import { StudentProfile, GradeLevel, TeacherPersona, VoiceTone } from '../types';
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
  onOpenProfileSettings?: () => void;
  activeTeacher: TeacherPersona;
  walletBalance: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentRole?: 'parent' | 'pupil' | 'guest' | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeStudent,
  voiceEnabled,
  onToggleVoice,
  onOpenProfileSettings,
  walletBalance,
  onToggleSidebar,
  currentRole,
}) => {
  return (
    <header id="app-header" className="bg-white border-b border-sky-100 shadow-xs sticky top-0 z-30 w-full max-w-full overflow-hidden">
      {/* Sleek, Single-Tier Clean Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 max-w-full">
        {/* Left: Mobile Drawer Button + Authentic Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          {onToggleSidebar && (
            <button
              id="top-hamburger-btn"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <BrandLogo size="md" variant="inline" showSubtitle={false} />
          
          <span className="hidden lg:inline-block bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider">
            PRIMARY 1-6
          </span>
        </div>

        {/* Center / Class Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="header-class-indicator-btn"
            onClick={onOpenProfileSettings}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#006738] border border-emerald-200 text-xs font-black transition-all cursor-pointer shadow-2xs"
            title="Class selection in Settings"
          >
            <span className="text-[10px] uppercase text-emerald-700 font-bold hidden sm:inline">Class:</span>
            <span>Primary {activeStudent.grade}</span>
            <ChevronDown className="w-3 h-3 text-emerald-700" />
          </button>
        </div>

        {/* Right Controls: Quick Voice Narration Toggle + User Profile & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick Voice Audio Toggle Button */}
          <button
            id="voice-toggle-btn"
            onClick={onToggleVoice}
            title={voiceEnabled ? 'Teacher Voice Active (Click to Mute)' : 'Teacher Voice Muted (Click to Unmute)'}
            aria-label={voiceEnabled ? 'Mute teacher voice' : 'Unmute teacher voice'}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              voiceEnabled
                ? 'bg-emerald-50 border-emerald-200 text-[#006738] hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-[#006738]" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* User Profile & Settings Button */}
          <button
            id="header-profile-settings-btn"
            onClick={onOpenProfileSettings}
            className="flex items-center gap-2 pl-1.5 pr-2.5 sm:pr-3 py-1.5 rounded-2xl bg-[#FEFCE8] hover:bg-amber-100 border border-amber-300 text-slate-900 transition-all shadow-xs group cursor-pointer shrink-0"
            title="User Profile & Settings"
          >
            {/* Pupil Avatar / Photo */}
            <div 
              className="w-7 h-7 rounded-full overflow-hidden border border-amber-400 shrink-0 flex items-center justify-center text-xs font-black text-white shadow-2xs"
              style={{ backgroundColor: activeStudent.avatarColor || '#006738' }}
            >
              {activeStudent.avatarUrl ? (
                <img
                  src={activeStudent.avatarUrl}
                  alt={activeStudent.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                activeStudent.name.charAt(0)
              )}
            </div>

            {/* Name + Settings Icon */}
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-[#006738] leading-tight truncate max-w-[70px] sm:max-w-[110px]">
                {activeStudent.name}
              </span>
              <span className="text-[9px] text-amber-800 font-bold uppercase tracking-wider flex items-center gap-0.5">
                <span>Settings</span>
                <span className="text-[10px]">⚙️</span>
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-amber-700 transition-transform group-hover:translate-y-0.5 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
