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
  ShieldCheck,
  BrainCircuit,
  Trophy,
  Repeat
} from 'lucide-react';
import { StudentProfile, LessonTopic, TeacherPersona, SubjectName } from '../types';
import { StepByStepGuide } from './StepByStepGuide';
import { SubjectPickerSection } from './SubjectPickerSection';
import { HowItWorksSection } from './HowItWorksSection';
import { getTeacherForLesson } from '../data/teachers';
import { getMasteryLevel } from '../utils/mastery';

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
  // Automatically pull the correct teacher assigned specifically to this lesson's subject
  const lessonTeacher = getTeacherForLesson(currentLesson) || teacher;

  // =========================================================================
  // PUPIL DASHBOARD VIEW (WHEN LOGGED IN AS PUPIL)
  // Simplified, friendly, encouraging interface tailored for children
  // =========================================================================
  if (currentRole === 'pupil') {
    const studentLessons = allLessons.filter(l => l.grade === student.grade);
    const subjectsList: SubjectName[] = [
      'Mathematics',
      'English Studies',
      'Basic Science & Technology',
      'Social Studies',
      'Civic Education',
      'Agricultural Science'
    ];

    return (
      <div 
        id="pupil-dashboard-view" 
        className="w-full max-w-full overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6"
      >
        {/* Child Welcome Banner */}
        <section className="w-full rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 p-5 sm:p-7 md:p-8 text-slate-900 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              {/* Pupil Avatar with Photo Upload Trigger */}
              <div className="relative">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-white text-2xl font-black shrink-0"
                  style={{ backgroundColor: student.avatarColor || '#026838' }}
                >
                  {student.avatarUrl ? (
                    <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    student.name.charAt(0)
                  )}
                </div>
                {onOpenPupilPhotoModal && (
                  <button
                    type="button"
                    onClick={onOpenPupilPhotoModal}
                    title="Change picture"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-slate-800 shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-[#026838]" />
                  </button>
                )}
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-slate-800 mb-1 border border-white">
                  <span>Primary {student.grade}</span>
                  <span>•</span>
                  <span>Term {student.currentTerm}</span>
                  <span>•</span>
                  <span>Week {student.currentWeek}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-950">
                  Welcome, {student.name}! 🌟
                </h1>
                <p className="text-xs sm:text-sm font-bold text-slate-800/90 mt-0.5">
                  Let's continue learning. You're doing great!
                </p>
              </div>
            </div>

            {/* Quick Star Counter */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl px-5 py-3 border border-white shadow-xs flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="text-2xl font-black text-slate-900 font-display">
                  {student.overallScore}%
                </div>
                <div className="text-[10px] font-black uppercase text-emerald-800">
                  Mastery Level
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Continue Learning Featured Card */}
        <section className="w-full rounded-[28px] sm:rounded-[36px] bg-white border-2 border-emerald-500/30 p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#026838] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-[#026838]">
                CONTINUE LEARNING
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              ⏱️ 30-Minute Daily Mastery Session
            </span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-50 text-[#D97706] border border-amber-200">
                {currentLesson.subject}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                {currentLesson.topic}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {currentLesson.subtopic}
              </p>

              {/* Assigned Teacher Mini-Card */}
              <div className="flex items-center gap-2.5 pt-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs border border-white"
                  style={{ backgroundColor: lessonTeacher?.avatarColor || '#026838' }}
                >
                  {lessonTeacher?.avatarEmoji || '👩🏾‍🏫'}
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800">{lessonTeacher?.name || 'Your Nigerian Teacher'}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-[#026838] font-black text-[11px] uppercase">{lessonTeacher?.classTitle || `Primary ${student.grade} Class Teacher`}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onStartLesson(currentLesson)}
              className="w-full lg:w-auto px-8 py-4 rounded-2xl bg-[#026838] hover:bg-[#014d28] active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer shrink-0"
            >
              <PlayCircle className="w-5 h-5 text-amber-300" />
              <span>START LESSON NOW (30 MIN)</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </section>

        {/* 4 Friendly Pupil Action Tiles */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onViewAllLessons}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#026838] flex items-center justify-center font-black mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase font-display">
              My Subjects
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Mathematics, English & more
            </p>
          </button>

          <button
            type="button"
            onClick={onViewAllLessons}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E88E5] flex items-center justify-center font-black mb-3 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase font-display">
              My Lessons
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Weekly syllabus & topics
            </p>
          </button>

          <button
            type="button"
            onClick={onOpenProgress}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center font-black mb-3 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase font-display">
              My Progress
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Mastery scores & badges
            </p>
          </button>

          <button
            type="button"
            onClick={() => onStartLesson(currentLesson)}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black mb-3 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase font-display">
              Practice
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Test & master concepts
            </p>
          </button>
        </section>

        {/* Recently Learned Topics & Achievements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recently Learned Topics */}
          <section className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#026838]" />
                <span>Recently Learned Topics</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Term {student.currentTerm}
              </span>
            </div>

            {student.completedLessons && student.completedLessons.length > 0 ? (
              <div className="space-y-2.5">
                {student.completedLessons.map((item, idx) => {
                  const mastery = getMasteryLevel(item.score);
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] font-black uppercase text-[#D97706]">
                          {item.subject}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${mastery.badgeBg} ${mastery.badgeBorder} ${mastery.badgeText}`}>
                          {mastery.level} ({item.score}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center space-y-2">
                <span className="text-2xl">🌱</span>
                <p className="text-xs text-slate-700 font-bold">
                  Start your first lesson today!
                </p>
                <p className="text-[11px] text-slate-500">
                  Every completed 30-minute session will record your mastery level here.
                </p>
              </div>
            )}
          </section>

          {/* Achievements & Weekly Progress */}
          <section className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase font-display flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D97706]" />
                <span>Achievements & Weekly Goals</span>
              </h3>
              <span className="text-[10px] font-black text-[#026838] uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Primary {student.grade}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800">Weekly Lessons Target</span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {student.lessonsCompletedThisWeek} of {student.totalLessonsThisWeek} Completed
                  </div>
                </div>
                <div className="text-2xl font-black text-[#D97706]">
                  {Math.round((student.lessonsCompletedThisWeek / student.totalLessonsThisWeek) * 100)}%
                </div>
              </div>

              {/* 5-Tier Mastery Framework Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    Mastery Before Moving On
                  </span>
                  <span className="text-[10px] font-black text-[#026838]">
                    {getMasteryLevel(student.overallScore).level}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Your AI teacher ensures you truly understand each concept before introducing new topics.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* My Subjects Quick Explorer */}
        <section className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase font-display">
                My Primary {student.grade} Subjects
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Select any subject to explore NERDC curriculum topics
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllLessons}
              className="text-xs font-black text-[#026838] uppercase hover:underline"
            >
              View All Topics →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {subjectsList.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  if (onPickSubjectForTeaching) onPickSubjectForTeaching(sub);
                  else onViewAllLessons();
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 mx-auto rounded-xl bg-slate-100 text-slate-700 group-hover:bg-[#026838] group-hover:text-white flex items-center justify-center font-bold text-xs mb-2 transition-colors">
                  {sub.charAt(0)}
                </div>
                <div className="text-[11px] font-bold text-slate-800 line-clamp-1">
                  {sub}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // GUEST / LANDING PAGE VIEW (WHEN VISITING OR NOT LOGGED IN AS PUPIL)
  // Preserves full product presentation, problem definition, & curriculum pitch
  // =========================================================================
  return (
    <div 
      id="dashboard-view-container" 
      className="w-full max-w-full overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6"
    >
      {/* ========================================================================= */}
      {/* HERO SECTION: BRANDING, PURPOSE & PROBLEM STATEMENT */}
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
              <span>🇳🇬 BASED ON THE NIGERIAN NERDC CURRICULUM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span className="text-[#D97706]">PRIMARY 1–6 HOME LEARNING</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#B45309] block">
                LEARN. UNDERSTAND. PRACTICE. MASTER.
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display tracking-tight text-[#026838] uppercase leading-tight">
                30-Minute Daily Mastery Sessions
              </h1>
            </div>

            {/* Core Problem Statement Box */}
            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-2xs text-left max-w-2xl mx-auto lg:mx-0">
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                "A child can be present in school without fully understanding what was taught. <strong>Brightly Home Lesson</strong> gives that child another patient, structured opportunity to understand, practise and master the topic at home."
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Reinforces classroom learning at home</span>
                <span className="text-[#026838] font-bold">Does not replace the school teacher</span>
              </div>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
                <span className="text-lg shrink-0">⏱️</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">30-Min Mastery</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                    6 structured learning phases designed for focused daily learning.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
                <span className="text-lg shrink-0">👩🏾‍🏫</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">AI Nigerian Teacher</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                    Friendly teaching, local examples and concrete teaching aids.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-2.5">
                <span className="text-lg shrink-0">🎯</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">Mastery Before Moving On</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                    Adaptive re-explanation and practice when a child needs more support.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
              <div className="text-xs font-bold text-gray-500 uppercase">
                {currentLesson.subject}
              </div>
              <h3 className="text-lg font-black text-[#006738] font-display leading-tight">
                {currentLesson.topic}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-2">
                {currentLesson.subtopic}
              </p>
            </div>

            {/* Quick Session Spec */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
              <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
                <span className="text-gray-500 block">SESSION TIME</span>
                <span className="text-sm font-black text-[#006738]">30 MINS</span>
              </div>
              <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
                <span className="text-gray-500 block">ADAPTIVE RE-TEACH</span>
                <span className="text-sm font-black text-amber-700">ENABLED</span>
              </div>
            </div>

            {/* Assigned Teacher Pill */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-200">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xs border border-white"
                style={{ backgroundColor: lessonTeacher?.avatarColor || '#026838' }}
              >
                {lessonTeacher?.avatarEmoji || '👩🏾‍🏫'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-gray-900 truncate">
                  {lessonTeacher?.name || 'Assigned Teacher'}
                </div>
                <div className="text-[10px] text-[#026838] font-bold truncate">
                  {lessonTeacher?.classTitle || `Primary ${currentLesson.grade} Class Teacher`}
                </div>
              </div>
            </div>

            <button
              type="button"
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
      {/* HOW BRIGHTLY HOME LESSON WORKS (6 STRUCTURED STEPS) */}
      {/* ========================================================================= */}
      <HowItWorksSection
        onStartLesson={() => onStartLesson(currentLesson)}
        onExploreSubjects={onViewAllLessons}
      />

      {/* ========================================================================= */}
      {/* STEP-BY-STEP LEARNING ROADMAP (1-2-3 SEQUENCE) */}
      {/* ========================================================================= */}
      <StepByStepGuide
        student={student}
        currentLesson={currentLesson}
        teacher={lessonTeacher}
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
                type="button"
                onClick={onViewAllLessons}
                className="text-xs font-black text-[#006738] hover:underline uppercase cursor-pointer"
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
                  type="button"
                  onClick={() => onStartLesson(currentLesson)}
                  className="px-2.5 py-1 rounded-lg bg-[#F59E0B] text-amber-950 text-[10px] font-black uppercase shrink-0 hover:bg-amber-400 cursor-pointer"
                >
                  Start
                </button>
              </div>

              {/* Friday */}
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 border border-gray-100">
                <div className="h-8 w-8 rounded-lg bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-black shrink-0">
                  F
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-600 truncate">Measurement & Shapes</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Upcoming</p>
                </div>
                <span className="text-xs text-gray-400">🔒</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBJECTS PICKER / CURRICULUM EXPLORER */}
      {/* ========================================================================= */}
      <SubjectPickerSection
        onSelectSubject={(subject) => {
          if (onPickSubjectForTeaching) {
            onPickSubjectForTeaching(subject);
          } else {
            onViewAllLessons();
          }
        }}
        onViewAllCurriculum={onViewAllLessons}
      />
    </div>
  );
};
