import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Star, 
  CheckCircle2, 
  PlayCircle, 
  HelpCircle, 
  Award, 
  Bot, 
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Camera
} from 'lucide-react';
import { StudentProfile, LessonTopic, TeacherPersona } from '../types';

interface DashboardViewProps {
  student: StudentProfile;
  currentLesson: LessonTopic;
  teacher?: TeacherPersona;
  onStartLesson: (lesson?: LessonTopic) => void;
  onViewAllLessons: () => void;
  onOpenProgress: () => void;
  onOpenPupilPhotoModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  currentLesson,
  teacher,
  onStartLesson,
  onViewAllLessons,
  onOpenProgress,
  onOpenPupilPhotoModal,
}) => {
  return (
    <div id="dashboard-view-container" className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#026838] uppercase tracking-tight font-display">
            Welcome Back, {student.name}!
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Primary {student.grade} NERDC Curriculum • Ready to master today's topic?
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="rounded-full bg-white px-5 py-2 shadow-sm border border-gray-100">
            <span className="text-sm font-black text-[#D97706] uppercase tracking-tight">
              Wallet: ₦3,500
            </span>
          </div>
          
          {/* Pupil Avatar with Instant Edit Button */}
          <div className="relative group cursor-pointer" onClick={onOpenPupilPhotoModal}>
            <div 
              className="h-12 w-12 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center bg-white"
            >
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={`${student.name}'s picture`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: student.avatarColor || '#1E88E5' }}
                >
                  {student.name.charAt(0)}
                </div>
              )}
            </div>
            {onOpenPupilPhotoModal && (
              <div 
                className="absolute -bottom-1 -right-1 p-1 bg-[#FBC02D] rounded-full text-black shadow-sm transition-transform group-hover:scale-110"
                title="Change pupil photo"
              >
                <Camera className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid: 8 Cols (Hero + Stats) & 4 Cols (Schedule + Wins) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Hero Next Lesson Card */}
          <section 
            id="hero-next-lesson-card"
            className="relative rounded-[32px] bg-[#FEFCE8] p-6 md:p-8 border-4 border-dashed border-[#FBC02D] shadow-sm"
          >
            <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-4">
              <div className="space-y-3 flex-1">
                <span className="inline-block rounded-full bg-[#F59E0B] px-4 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  Next Lesson
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight uppercase font-display">
                  {currentLesson.topic}
                </h2>
                <p className="text-sm md:text-lg font-bold text-gray-600">
                  Primary {currentLesson.grade} • Term {currentLesson.term} • Week {currentLesson.week} ({currentLesson.subject})
                </p>
                <div className="flex items-center gap-3 pt-3">
                  <button 
                    id="cta-start-today-lesson-btn"
                    onClick={() => onStartLesson(currentLesson)}
                    className="rounded-2xl bg-[#43A047] px-6 md:px-8 py-3.5 md:py-4 text-base md:text-lg font-black text-white shadow-[0_6px_0_0_#1B5E20] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#1B5E20] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wider flex items-center gap-2"
                  >
                    <span>START TODAY'S LESSON</span>
                    <span className="text-xl">🌟</span>
                  </button>
                </div>
              </div>

              {/* Teacher Display Badge */}
              <div className="flex flex-col items-center gap-1.5 self-center sm:self-start shrink-0">
                <div className="h-24 w-24 md:h-28 md:w-28 rounded-3xl bg-white p-1.5 shadow-lg border border-amber-200 overflow-hidden">
                  {teacher?.imageUrl ? (
                    <img
                      src={teacher.imageUrl}
                      alt={teacher.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="h-full w-full rounded-2xl bg-[#1E88E5] flex items-center justify-center text-4xl md:text-5xl shadow-inner">
                      {teacher?.avatarEmoji || '👩🏾‍🏫'}
                    </div>
                  )}
                </div>
                <span className="text-xs font-black text-[#026838] uppercase tracking-wide">
                  {teacher?.name || 'Master Teacher'}
                </span>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  {teacher?.subjectSpecialty || currentLesson.subject}
                </span>
              </div>
            </div>
          </section>

          {/* 3 Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Lessons Done */}
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <p className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                Lessons Done
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#1E88E5] font-display">
                  {student.lessonsCompletedThisWeek}
                </span>
                <span className="text-lg font-bold text-gray-300">
                  / {student.totalLessonsThisWeek}
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#1E88E5] transition-all duration-500"
                  style={{ width: `${(student.lessonsCompletedThisWeek / student.totalLessonsThisWeek) * 100}%` }}
                />
              </div>
            </div>

            {/* 2. Overall Score */}
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <p className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                Overall Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#43A047] font-display">
                  {student.overallScore}%
                </span>
                <span className="text-xs font-bold text-[#43A047]">
                  ↗ 5%
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#43A047] transition-all duration-500"
                  style={{ width: `${student.overallScore}%` }}
                />
              </div>
            </div>

            {/* 3. Active Subject */}
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
              <p className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                Active Subject
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#D97706] font-display truncate">
                  {student.topSubject}
                </span>
                <span className="text-xs rounded-lg bg-[#FEFCE8] px-2 py-0.5 text-[#D97706] font-black shrink-0 border border-[#FBC02D]/40">
                  P{student.grade}
                </span>
              </div>
              <div className="mt-3 flex gap-1 text-sm">
                <span className="text-[#FBC02D]">⭐</span>
                <span className="text-[#FBC02D]">⭐</span>
                <span className="text-[#FBC02D]">⭐</span>
                <span className="text-[#FBC02D]">⭐</span>
                <span className="text-[#FBC02D]">⭐</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Weekly Schedule Section */}
          <section className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#026838] uppercase font-display">
                Weekly Schedule
              </h3>
              <button 
                onClick={onViewAllLessons}
                className="text-xs font-black text-[#1E88E5] hover:underline uppercase"
              >
                Curriculum →
              </button>
            </div>

            <div className="space-y-3">
              {/* Monday (Completed) */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-[#F0FDF4] p-3.5 border-2 border-[#43A047]">
                <div className="h-10 w-10 rounded-xl bg-[#43A047] text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">
                    Regions & Climates
                  </p>
                  <p className="text-[10px] text-[#43A047] font-black uppercase tracking-wider">
                    Completed
                  </p>
                </div>
                <span className="text-lg shrink-0">✅</span>
              </div>

              {/* Wednesday (In Progress) */}
              <div className="flex items-center gap-3.5 rounded-2xl border-2 border-[#FBC02D] bg-[#FFFBEB] p-3.5 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-[#FBC02D] text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                  W
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">
                    Major Cities
                  </p>
                  <p className="text-[10px] text-[#D97706] font-black uppercase tracking-wider">
                    In Progress
                  </p>
                </div>
                <button
                  onClick={() => onStartLesson(currentLesson)}
                  className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-white text-[10px] font-black uppercase shrink-0 shadow-sm hover:brightness-105"
                >
                  Resume
                </button>
              </div>

              {/* Friday (Upcoming) */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-gray-50 p-3.5 border-2 border-transparent">
                <div className="h-10 w-10 rounded-xl bg-gray-300 text-white flex items-center justify-center text-sm font-black shrink-0">
                  F
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-500 truncate">
                    Weekly Quiz
                  </p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">
                    Upcoming
                  </p>
                </div>
                <span className="text-lg opacity-30 shrink-0">📅</span>
              </div>
            </div>
          </section>

          {/* Recent Wins */}
          <section className="rounded-[32px] bg-[#1E88E5] p-6 text-white shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase font-display">
                Recent Wins
              </h3>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="flex gap-3">
              <div 
                className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner cursor-pointer hover:scale-110 transition-transform" 
                title="Math Master"
              >
                🧮
              </div>
              <div 
                className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner cursor-pointer hover:scale-110 transition-transform" 
                title="Quick Learner"
              >
                ⚡
              </div>
              <div 
                className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner cursor-pointer hover:scale-110 transition-transform" 
                title="Science Star"
              >
                🧪
              </div>
            </div>
            <p className="text-xs text-blue-100 font-medium">
              3 Mastery badges unlocked this term under NERDC criteria!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
