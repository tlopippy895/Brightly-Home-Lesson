import React from 'react';
import { 
  Clock, 
  Star, 
  CheckCircle2, 
  PlayCircle, 
  Award, 
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { StudentProfile, LessonTopic, TeacherPersona, SubjectName } from '../types';
import { StepByStepGuide } from './StepByStepGuide';
import { SubjectPickerSection } from './SubjectPickerSection';

interface DashboardViewProps {
  student: StudentProfile;
  currentLesson: LessonTopic;
  allLessons?: LessonTopic[];
  teacher?: TeacherPersona;
  currentRole?: 'parent' | 'pupil' | 'guest' | null;
  onStartLesson: (lesson?: LessonTopic) => void;
  onViewAllLessons: () => void;
  onPickSubjectForTeaching?: (subject: SubjectName) => void;
  onOpenProgress: () => void;
  onOpenPupilPhotoModal?: () => void;
  onOpenParentPortal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  currentLesson,
  allLessons = [],
  teacher,
  currentRole,
  onStartLesson,
  onViewAllLessons,
  onPickSubjectForTeaching,
  onOpenProgress,
  onOpenPupilPhotoModal,
  onOpenParentPortal,
}) => {
  return (
    <div 
      id="dashboard-view-container" 
      className="w-full max-w-full overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6"
    >
      {/* ========================================================================= */}
      {/* SIMPLIFIED HERO SECTION: CLEAR HIGH-CONTRAST TYPOGRAPHY & OBJECTIVE */}
      {/* ========================================================================= */}
      <section 
        id="hero-objective-section"
        className="w-full max-w-full rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#F2FBF6] via-white to-[#EBF6FE] border border-emerald-200/80 p-5 sm:p-8 md:p-10 shadow-sm relative overflow-hidden text-slate-800"
      >
        {/* Subtle decorative background tints */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Column: Clear Objective, Title & Summary */}
          <div className="flex-1 space-y-4 text-center lg:text-left min-w-0 w-full">
            {/* National Curriculum Eyebrow - Clear high contrast */}
            <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-emerald-300/80 text-[11px] font-black tracking-wider uppercase text-[#026838] shadow-xs">
              <span>🇳🇬 NERDC NIGERIAN CURRICULUM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span className="text-[#D97706]">PRIMARY 1–6 HOME LESSON</span>
            </div>

            {/* Main Headline - Clear Emerald & Amber Colors instead of white */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display tracking-tight text-[#026838] uppercase leading-tight">
              Learn. Understand. <br className="hidden sm:inline" />
              <span className="text-[#D97706] sm:text-[#F59E0B]">Practice. Master.</span>
            </h1>

            {/* Simple Scannable Purpose Statement - Clear Dark Slate Text */}
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Brightly Home Lesson delivers <strong className="text-slate-900 font-black">30-minute daily mastery sessions</strong> for Nigerian primary school pupils. 
              Step-by-step whiteboard teaching with friendly Nigerian teachers, everyday market & food analogies, and gentle adaptive tutoring until your child truly understands.
            </p>

            {/* 3 Value Pillars - Clear crisp white cards with clear dark text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
                <span className="text-lg shrink-0">⏱️</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">30-Min Mastery</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">6 structured phases, no pressure timers.</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
                <span className="text-lg shrink-0">👩🏾‍🏫</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">Nigerian Teachers</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">Local accents, warmth, and real-life analogies.</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
                <span className="text-lg shrink-0">🎯</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">70% Mastery Standard</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">Adaptive re-explanation with zero penalty.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Clear High Contrast */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 justify-center lg:justify-start">
              <button 
                id="hero-start-lesson-btn"
                onClick={() => onStartLesson(currentLesson)}
                className="w-full sm:w-auto rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-black text-slate-950 shadow-[0_5px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>START TODAY'S LESSON</span>
                <span className="text-lg">🌟</span>
              </button>

              <button 
                id="hero-view-subjects-btn"
                onClick={onViewAllLessons}
                className="w-full sm:w-auto rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200/90 hover:border-slate-300 px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-black text-slate-800 shadow-xs hover:shadow transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <BookOpen className="w-4 h-4 text-[#026838]" />
                <span>Explore All Subjects</span>
              </button>
            </div>
          </div>

          {/* Right Column: Today's Spotlight Lesson Card */}
          <div className="w-full lg:w-80 shrink-0 bg-white text-slate-900 rounded-[28px] p-5 shadow-2xl border-4 border-[#FBC02D] space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-100 text-[#006738] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                TODAY'S TOPIC
              </span>
              <span className="text-xs font-black text-[#D97706]">
                Pri {currentLesson.grade} • Week {currentLesson.week}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 uppercase font-display leading-tight">
                {currentLesson.topic}
              </h3>
              <p className="text-xs text-gray-600 font-bold">
                {currentLesson.subject} • Term {currentLesson.term}
              </p>
            </div>

            {/* Master Teacher Spotlight */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200/80">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-300 shrink-0 bg-white shadow-2xs">
                {teacher?.imageUrl ? (
                  <img
                    src={teacher.imageUrl}
                    alt={teacher.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    👩🏾‍🏫
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-[#006738] uppercase truncate">
                  {teacher?.name || 'Master Teacher'}
                </div>
                <div className="text-[10px] text-amber-900 font-bold truncate">
                  {teacher?.subjectSpecialty || currentLesson.subject} Tutor
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {teacher?.greeting || 'Warm welcome to class!'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onStartLesson(currentLesson)}
              className="w-full py-3 bg-[#006738] hover:bg-[#00552e] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Begin Lesson Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* STEP-BY-STEP LEARNING ROADMAP (1-2-3 SEQUENCE) */}
      {/* ========================================================================= */}
      <StepByStepGuide
        student={student}
        currentLesson={currentLesson}
        teacher={teacher}
        currentRole={currentRole}
        onStartLesson={onStartLesson}
        onOpenLessons={onViewAllLessons}
        onOpenProgress={onOpenProgress}
        onOpenParentPortal={onOpenParentPortal}
      />

      {/* ========================================================================= */}
      {/* METRICS & SCHEDULE GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full max-w-full">
        {/* Left Column (8 cols): Progress Cards */}
        <div className="lg:col-span-8 flex flex-col gap-4 w-full min-w-0">
          {/* 3 Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
            {/* 1. Lessons Done */}
            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
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
            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
              <p className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                Overall Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#006738] font-display">
                  {student.overallScore}%
                </span>
                <span className="text-xs font-bold text-[#006738]">
                  ↗ Verified
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#006738] transition-all duration-500"
                  style={{ width: `${student.overallScore}%` }}
                />
              </div>
            </div>

            {/* 3. Active Subject */}
            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
              <p className="text-xs font-black uppercase text-gray-400 mb-1 tracking-wider">
                Active Subject
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-[#D97706] font-display truncate">
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

        {/* Right Column (4 cols): Schedule & Wins */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full min-w-0">
          {/* Weekly Schedule Section */}
          <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-xs border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-[#006738] uppercase font-display">
                Weekly Schedule
              </h3>
              <button 
                onClick={onViewAllLessons}
                className="text-xs font-black text-[#006738] hover:underline uppercase"
              >
                Curriculum →
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Monday */}
              <div className="flex items-center gap-3 rounded-xl bg-[#F0FDF4] p-2.5 border border-[#43A047]/40">
                <div className="h-8 w-8 rounded-lg bg-[#006738] text-white flex items-center justify-center text-xs font-black shrink-0">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">Regions & Climates</p>
                  <p className="text-[10px] text-[#006738] font-bold uppercase">Completed</p>
                </div>
                <span className="text-base shrink-0">✅</span>
              </div>

              {/* Wednesday */}
              <div className="flex items-center gap-3 rounded-xl border border-[#FBC02D] bg-[#FFFBEB] p-2.5 shadow-2xs">
                <div className="h-8 w-8 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center text-xs font-black shrink-0">
                  W
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">{currentLesson.topic}</p>
                  <p className="text-[10px] text-[#D97706] font-bold uppercase">Today's Lesson</p>
                </div>
                <button
                  onClick={() => onStartLesson(currentLesson)}
                  className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-amber-950 text-[10px] font-black uppercase shrink-0 hover:bg-amber-400 cursor-pointer"
                >
                  Start
                </button>
              </div>

              {/* Friday */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                <div className="h-8 w-8 rounded-lg bg-gray-300 text-white flex items-center justify-center text-xs font-black shrink-0">
                  F
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-500 truncate">Weekly Diagnostic Review</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Upcoming</p>
                </div>
                <span className="text-base opacity-40 shrink-0">📅</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBJECT PICKER LISTING */}
      {/* ========================================================================= */}
      <div className="pt-2 w-full max-w-full">
        <SubjectPickerSection
          student={student}
          allLessons={allLessons}
          onPickSubjectForTeaching={(sub) => {
            if (onPickSubjectForTeaching) {
              onPickSubjectForTeaching(sub);
            } else {
              onViewAllLessons();
            }
          }}
          onStartSpecificLesson={onStartLesson}
        />
      </div>
    </div>
  );
};
