import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  User, 
  HelpCircle, 
  CreditCard, 
  Settings, 
  Building2,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { StudentProfile } from '../types';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeTab: 'dashboard' | 'lessons' | 'progress' | 'subscriptions' | 'settings' | 'help' | 'regulatory';
  setActiveTab: (tab: 'dashboard' | 'lessons' | 'progress' | 'subscriptions' | 'settings' | 'help' | 'regulatory') => void;
  students: StudentProfile[];
  activeStudent: StudentProfile;
  onSelectStudent: (student: StudentProfile) => void;
  onOpenAddChildModal: () => void;
  onOpenParentSummary: () => void;
  onOpenPupilPhotoModal?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  students,
  activeStudent,
  onSelectStudent,
  onOpenAddChildModal,
  onOpenParentSummary,
  onOpenPupilPhotoModal,
  isOpen = false,
  onClose,
}) => {
  const handleNavClick = (tab: 'dashboard' | 'lessons' | 'progress' | 'subscriptions' | 'settings' | 'help' | 'regulatory') => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const handleStudentSelect = (student: StudentProfile) => {
    onSelectStudent(student);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop fixed/sticky + Mobile Drawer slide-in) */}
      <aside 
        id="main-sidebar" 
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#026838] text-white flex flex-col justify-between shrink-0 shadow-2xl md:shadow-xl select-none min-h-screen overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / Logo + Mobile Close Button */}
        <div className="flex flex-col">
          <div className="p-5 pb-4 flex items-center justify-between">
            <BrandLogo size="md" darkTheme={true} showSubtitle={true} />
            {onClose && (
              <button
                id="close-sidebar-btn"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="md:hidden p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <span className="text-sm font-black">✕</span>
              </button>
            )}
          </div>

          {/* Main Navigation Menu */}
          <nav className="px-4 py-2 space-y-2">
            <button
              id="nav-btn-dashboard"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 font-bold text-sm transition-all duration-150 ${
                activeTab === 'dashboard'
                  ? 'bg-white/10 text-white shadow-inner font-black ring-1 ring-white/20'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">📊</span>
              <span className="font-bold tracking-wide uppercase">Dashboard</span>
            </button>

            <button
              id="nav-btn-lessons"
              onClick={() => handleNavClick('lessons')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 font-bold text-sm transition-all duration-150 ${
                activeTab === 'lessons'
                  ? 'bg-white/10 text-white shadow-inner font-black ring-1 ring-white/20'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">📖</span>
              <span className="font-bold tracking-wide uppercase">My Lessons</span>
              <span className="ml-auto text-[10px] bg-[#FBC02D] text-black px-2 py-0.5 rounded-full font-black">
                Pri {activeStudent.grade}
              </span>
            </button>

            <button
              id="nav-btn-progress"
              onClick={() => handleNavClick('progress')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 font-bold text-sm transition-all duration-150 ${
                activeTab === 'progress'
                  ? 'bg-white/10 text-white shadow-inner font-black ring-1 ring-white/20'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">📈</span>
              <span className="font-bold tracking-wide uppercase">Progress</span>
            </button>
          </nav>

          {/* Active Child Profile Card (Vibrant Theme with Pupil Photo) */}
          <div className="px-4 py-3">
            <div className="rounded-2xl bg-[#008751] p-4 text-center border-2 border-white/20 shadow-md relative group">
              <div className="mb-2 flex justify-center">
                <div className="relative">
                  <div 
                    className="h-14 w-14 rounded-full border-4 border-[#FBC02D] bg-white overflow-hidden flex items-center justify-center shadow-inner"
                  >
                    {activeStudent.avatarUrl ? (
                      <img
                        src={activeStudent.avatarUrl}
                        alt={`${activeStudent.name}'s photo`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white font-black text-xl"
                        style={{ backgroundColor: activeStudent.avatarColor || '#1E88E5' }}
                      >
                        {activeStudent.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {onOpenPupilPhotoModal && (
                    <button
                      type="button"
                      onClick={onOpenPupilPhotoModal}
                      title="Insert or update pupil photo"
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#FBC02D] hover:bg-amber-400 text-black shadow-md transition-all active:scale-95"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm font-bold text-white">{activeStudent.name}'s Profile</p>
              <p className="text-[10px] uppercase tracking-widest text-white/80 font-bold mt-0.5">
                Primary {activeStudent.grade} • Term {activeStudent.currentTerm}
              </p>
              {onOpenPupilPhotoModal && (
                <button
                  type="button"
                  onClick={onOpenPupilPhotoModal}
                  className="mt-2 text-[10px] text-emerald-100 hover:text-white underline font-bold transition-all block mx-auto"
                >
                  Insert / Change Photo 📷
                </button>
              )}
            </div>
          </div>

          {/* Student Switcher Pills with Pupil Avatars */}
          <div className="px-4 py-1">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-1.5 px-1">
              SWITCH STUDENT
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {students.map((student) => {
                const isSelected = activeStudent.id === student.id;
                return (
                  <button
                    key={student.id}
                    id={`student-profile-${student.id}`}
                    onClick={() => handleStudentSelect(student)}
                    className={`py-1.5 px-1.5 rounded-xl text-center transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-white text-[#026838] font-black shadow-sm text-xs'
                        : 'bg-white/10 text-white/80 hover:bg-white/20 text-xs font-semibold'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/40">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold"
                          style={{ backgroundColor: student.avatarColor || '#1E88E5' }}
                        >
                          {student.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="truncate block max-w-[60px] text-[11px]">{student.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              id="add-child-profile-btn"
              onClick={() => {
                onOpenAddChildModal();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all border border-dashed border-white/30 mt-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Child</span>
            </button>
          </div>

          {/* Parent Portal & Reports Button */}
          <div className="px-4 py-2">
            <button
              id="parent-portal-btn"
              onClick={() => {
                onOpenParentSummary();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-sm transition-all border border-white/20 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <div className="flex flex-col text-left">
                  <span className="leading-tight font-extrabold text-white">Parent Portal</span>
                  <span className="text-[9px] text-[#FBC02D] font-bold">Tuition & Progress</span>
                </div>
              </div>
              <span className="text-xs group-hover:translate-x-0.5 transition-transform text-[#FBC02D]">→</span>
            </button>
          </div>
        </div>

        {/* Bottom Area: Paystack Subscribe Button & Secondary Nav */}
        <div className="p-4 space-y-3">
          {/* Chunky Paystack Subscribe Button */}
          <button
            id="sidebar-subscribe-btn"
            onClick={() => handleNavClick('subscriptions')}
            className="w-full rounded-xl bg-[#F59E0B] py-3 px-4 font-black text-xs text-white uppercase tracking-wider shadow-[0_4px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4 text-white" />
            <span>Subscribe (Paystack)</span>
          </button>

          {/* Secondary Links */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <button
                id="nav-btn-help"
                onClick={() => handleNavClick('help')}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                  activeTab === 'help' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>HELP</span>
              </button>

              <button
                id="nav-btn-settings"
                onClick={() => handleNavClick('settings')}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                  activeTab === 'settings' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>SETTINGS</span>
              </button>

              <button
                id="nav-btn-regulatory"
                onClick={() => handleNavClick('regulatory')}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                  activeTab === 'regulatory' ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FBC02D]" />
                <span>NERDC</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
