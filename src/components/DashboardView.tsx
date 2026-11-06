import React, { useState, useMemo, useEffect } from 'react';
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
  Repeat,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import { StudentProfile, LessonTopic, TeacherPersona, SubjectName, GradeLevel } from '../types';
import { StepByStepGuide } from './StepByStepGuide';
import { SubjectPickerSection } from './SubjectPickerSection';
import { HowItWorksSection } from './HowItWorksSection';
import { getTeacherForLesson, getTeacherForGrade, getTeacherForSubject } from '../data/teachers';
import { getMasteryLevel } from '../utils/mastery';
import { getTermStructureConfig } from '../data/curriculumHierarchy';
import { getSchemeTopicsForWeek, getFullLessonForSchemeRecord } from '../data/schemeOfWorkRegistry';
import { ChildLessonNavigator } from './ChildLessonNavigator';

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
  // Exact layout order:
  // A. Friendly Welcome
  // B. Select Term
  // C. Select Week
  // D. Four Big Buttons (Continue Learning, My Subjects, My Progress, My Achievements)
  // Followed by active interactive feature content
  // =========================================================================
  if (currentRole === 'pupil') {
    // 1. Term selection (1, 2, 3) - defaults to pupil's registered current term
    const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(student.currentTerm || 1);

    // 2. Week selection - defaults to pupil's registered current week
    const [selectedWeek, setSelectedWeek] = useState<number>(student.currentWeek || 1);

    // 3. Active feature tab below the four big buttons: 'subjects' | 'progress' | 'achievements'
    const [activeFeatureTab, setActiveFeatureTab] = useState<'subjects' | 'progress' | 'achievements'>('subjects');

    // Term calendar configuration derived from actual system standards
    const termConfig = useMemo(() => {
      return getTermStructureConfig(student.grade, selectedTerm);
    }, [student.grade, selectedTerm]);

    // When selectedTerm changes, validate and clear invalid week selections
    useEffect(() => {
      if (selectedWeek > termConfig.totalWeeks) {
        setSelectedWeek(1);
      }
    }, [selectedTerm, termConfig.totalWeeks, selectedWeek]);

    // All lessons for this child's grade
    const gradeLessons = useMemo(() => {
      return allLessons.filter(l => l.grade === student.grade);
    }, [allLessons, student.grade]);

    // Lessons in the selected term
    const termLessons = useMemo(() => {
      return gradeLessons.filter(l => l.term === selectedTerm);
    }, [gradeLessons, selectedTerm]);

    // Lessons in the selected week
    const weekLessons = useMemo(() => {
      return termLessons.filter(l => l.week === selectedWeek);
    }, [termLessons, selectedWeek]);

    // Authentic curriculum scheme topics for the selected week
    const schemeWeekTopics = useMemo(() => {
      return getSchemeTopicsForWeek(student.grade, selectedTerm, selectedWeek);
    }, [student.grade, selectedTerm, selectedWeek]);

    // Weeks that have active lessons in this term
    const weeksWithLessonsMap = useMemo(() => {
      const map = new Map<number, LessonTopic[]>();
      termLessons.forEach(l => {
        const arr = map.get(l.week) || [];
        arr.push(l);
        map.set(l.week, arr);
      });
      return map;
    }, [termLessons]);

    // Track completed lessons
    const completedTopicIds = useMemo(() => {
      return new Set((student.completedLessons || []).map(c => c.topicId));
    }, [student.completedLessons]);

    const isLessonCompleted = (lesson: LessonTopic) => {
      return completedTopicIds.has(lesson.id) ||
        (student.completedLessons || []).some(
          c => c.subject === lesson.subject && c.title === lesson.topic
        );
    };

    // Find unfinished lesson in selected week
    const unfinishedWeekLesson = useMemo(() => {
      if (weekLessons.length === 0) return null;
      return weekLessons.find(l => !isLessonCompleted(l)) || weekLessons[0];
    }, [weekLessons, student.completedLessons]);

    // Fallback lesson if selected week has no available lessons yet
    const fallbackLesson = useMemo(() => {
      if (unfinishedWeekLesson) return unfinishedWeekLesson;
      if (termLessons.length > 0) return termLessons[0];
      if (gradeLessons.length > 0) return gradeLessons[0];
      return currentLesson;
    }, [unfinishedWeekLesson, termLessons, gradeLessons, currentLesson]);

    // Handler for Continue Learning button
    const handleContinueLearning = () => {
      if (unfinishedWeekLesson) {
        onStartLesson(unfinishedWeekLesson);
      } else if (weekLessons.length > 0) {
        onStartLesson(weekLessons[0]);
      } else {
        onStartLesson(fallbackLesson);
      }
    };

    // Supported academic terms with real configuration checks
    const supportedTerms: { termNum: 1 | 2 | 3; name: string; months: string }[] = [
      { termNum: 1, name: 'First Term', months: 'Sept – Dec' },
      { termNum: 2, name: 'Second Term', months: 'Jan – April' },
      { termNum: 3, name: 'Third Term', months: 'April – July' },
    ];

    const isUnassessed = !student.completedLessons || student.completedLessons.length === 0;
    const masteryInfo = getMasteryLevel(student.overallScore, student.completedLessons?.length || 0);

    return (
      <div 
        id="pupil-dashboard-view" 
        className="w-full max-w-full overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-6 bg-[#EBF5FB]/60 min-h-screen text-slate-900"
      >
        {/* ========================================================================= */}
        {/* A. FRIENDLY WELCOME                                                       */}
        {/* ========================================================================= */}
        <section 
          id="pupil-friendly-welcome"
          className="w-full rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 p-5 sm:p-7 md:p-8 text-slate-900 shadow-md relative overflow-hidden border border-amber-300/60"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-center sm:text-left">
              {/* Pupil Avatar with Picture Trigger */}
              <div className="relative shrink-0">
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1.5 border border-white/80 shadow-2xs">
                  <span>Primary {student.grade}</span>
                  <span className="text-slate-400">•</span>
                  <span>{termConfig.termName}</span>
                  <span className="text-slate-400">•</span>
                  <span>Week {selectedWeek}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-slate-950">
                  Hello, Champion! 👋
                </h1>
                <p className="text-xs sm:text-sm font-bold text-slate-800/90 mt-1 max-w-xl">
                  Welcome, {student.name}! Ready for another fun learning adventure today? You are doing wonderfully!
                </p>
              </div>
            </div>

            {/* Quick Star & Mastery Counter */}
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl px-5 py-3.5 border border-white shadow-sm flex items-center gap-3 shrink-0">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="text-2xl font-black text-slate-900 font-display">
                  {isUnassessed ? 'Ready!' : `${student.overallScore}%`}
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  {masteryInfo.level}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* B. SELECT TERM                                                            */}
        {/* ========================================================================= */}
        <section id="pupil-select-term" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#D97706] flex items-center justify-center font-black">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase font-display tracking-tight">
                  Select Term
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Choose which academic term you want to learn today
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black text-[#026838] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {termConfig.termName} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {supportedTerms.map((term) => {
              const isSelected = selectedTerm === term.termNum;
              const termLessonsCount = gradeLessons.filter(l => l.term === term.termNum).length;
              const hasAvailableLessons = termLessonsCount > 0;

              return (
                <button
                  key={term.termNum}
                  type="button"
                  id={`select-term-card-${term.termNum}`}
                  onClick={() => setSelectedTerm(term.termNum)}
                  className={`p-4 sm:p-5 rounded-3xl text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] border-2 group ${
                    isSelected
                      ? 'bg-white border-[#F59E0B] shadow-md ring-4 ring-[#F59E0B]/30'
                      : 'bg-white/80 border-slate-200/90 hover:border-amber-300 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {term.months}
                    </span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <Check className="w-3 h-3 stroke-[3]" /> Selected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Term {term.termNum}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-950 font-display">
                      {term.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      {hasAvailableLessons ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#026838] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#026838]" />
                          {termLessonsCount} Lesson{termLessonsCount > 1 ? 's' : ''} Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Lessons Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* C. SELECT WEEK                                                            */}
        {/* ========================================================================= */}
        <section id="pupil-select-week" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#026838] flex items-center justify-center font-black">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase font-display tracking-tight">
                  Select Week
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {termConfig.termName} • {termConfig.totalWeeks} configured weeks in academic calendar
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
              Week {selectedWeek} Selected
            </span>
          </div>

          {/* Week Selector Ribbon / Grid */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
            <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {Array.from({ length: termConfig.totalWeeks }, (_, i) => i + 1).map((weekNum) => {
                const isSelected = selectedWeek === weekNum;
                const lessonsInWeek = weeksWithLessonsMap.get(weekNum) || [];
                const hasLessons = lessonsInWeek.length > 0;
                const isRevision = termConfig.revisionWeeks?.includes(weekNum);
                const isAssessment = termConfig.assessmentWeeks?.includes(weekNum);
                const isExam = termConfig.examinationWeeks?.includes(weekNum);

                return (
                  <button
                    key={weekNum}
                    type="button"
                    id={`select-week-btn-${weekNum}`}
                    onClick={() => setSelectedWeek(weekNum)}
                    className={`min-w-[90px] sm:min-w-[105px] p-2.5 sm:p-3 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 border-2 shrink-0 ${
                      isSelected
                        ? 'bg-amber-100/80 border-[#F59E0B] shadow-sm ring-2 ring-[#F59E0B]/50'
                        : hasLessons
                        ? 'bg-[#F8FAFC] border-slate-200 hover:border-amber-300 hover:bg-white'
                        : 'bg-slate-50/60 border-slate-200/80 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {isExam ? 'Exam' : isAssessment ? 'Test' : isRevision ? 'Revision' : 'Study'}
                    </span>
                    <span className={`text-base sm:text-lg font-black font-display ${isSelected ? 'text-amber-950 scale-105' : 'text-slate-900'}`}>
                      Week {weekNum}
                    </span>
                    {hasLessons ? (
                      <span className="inline-block text-[9px] font-black text-[#026838] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {lessonsInWeek.length} Ready
                      </span>
                    ) : (
                      <span className="inline-block text-[8px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded uppercase">
                        Coming Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* If the selected week has NO available lessons, display clear prompt */}
          {weekLessons.length === 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">📢</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-900">
                    LESSONS COMING SOON FOR WEEK {selectedWeek}
                  </div>
                  <p className="text-xs font-medium text-amber-950 mt-0.5">
                    Verified lessons for Primary {student.grade}, {termConfig.termName}, Week {selectedWeek} are being prepared. You can explore available lessons in Week 1 or Week 2!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeek(1)}
                className="px-4 py-2 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer shrink-0 transition-all active:scale-95"
              >
                Go to Week 1 Lessons 🚀
              </button>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* D. FOUR BIG BUTTONS                                                       */}
        {/* 1. Continue Learning                                                      */}
        {/* 2. My Subjects                                                            */}
        {/* 3. My Progress                                                            */}
        {/* 4. My Achievements                                                        */}
        {/* ========================================================================= */}
        <section id="pupil-four-big-buttons" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* 1. Continue Learning Button */}
            <button
              type="button"
              id="big-btn-continue-learning"
              onClick={handleContinueLearning}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#026838] to-[#014d28] text-white text-left shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex flex-col justify-between min-h-[140px] group cursor-pointer border-2 border-emerald-500"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                  30-Min Lesson
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-black uppercase font-display leading-tight flex items-center gap-1.5">
                  <span>Continue Learning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-emerald-100 font-medium line-clamp-1 mt-0.5">
                  {unfinishedWeekLesson 
                    ? `${unfinishedWeekLesson.subject}: ${unfinishedWeekLesson.topic}`
                    : weekLessons.length > 0 
                    ? `Practice: ${weekLessons[0].topic}`
                    : 'Jump to Available Lesson'}
                </p>
              </div>
            </button>

            {/* 2. My Subjects Button */}
            <button
              type="button"
              id="big-btn-my-subjects"
              onClick={() => setActiveFeatureTab('subjects')}
              className={`p-4 sm:p-5 rounded-3xl text-left transition-all flex flex-col justify-between min-h-[140px] group cursor-pointer border-2 ${
                activeFeatureTab === 'subjects'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 border-amber-500 shadow-md ring-4 ring-amber-300/40'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-amber-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  activeFeatureTab === 'subjects' ? 'bg-black/10 text-slate-950' : 'bg-amber-100 text-[#D97706]'
                }`}>
                  <BookOpen className="w-7 h-7" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  activeFeatureTab === 'subjects' ? 'bg-black/10 text-slate-950' : 'bg-amber-50 text-[#D97706]'
                }`}>
                  Week {selectedWeek}
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-black uppercase font-display leading-tight">
                  My Subjects
                </h3>
                <p className={`text-xs font-medium line-clamp-1 mt-0.5 ${
                  activeFeatureTab === 'subjects' ? 'text-slate-900/90' : 'text-slate-500'
                }`}>
                  {weekLessons.length > 0 
                    ? `${weekLessons.length} Lesson${weekLessons.length > 1 ? 's' : ''} Ready · ${schemeWeekTopics.length} Subjects` 
                    : `${schemeWeekTopics.length} Subjects in Scheme`}
                </p>
              </div>
            </button>

            {/* 3. My Progress Button */}
            <button
              type="button"
              id="big-btn-my-progress"
              onClick={() => setActiveFeatureTab('progress')}
              className={`p-4 sm:p-5 rounded-3xl text-left transition-all flex flex-col justify-between min-h-[140px] group cursor-pointer border-2 ${
                activeFeatureTab === 'progress'
                  ? 'bg-gradient-to-br from-[#1E88E5] to-[#1565C0] text-white border-blue-600 shadow-md ring-4 ring-blue-300/40'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  activeFeatureTab === 'progress' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#1E88E5]'
                }`}>
                  <Trophy className="w-7 h-7" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  activeFeatureTab === 'progress' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#1E88E5]'
                }`}>
                  {student.overallScore}% Score
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-black uppercase font-display leading-tight">
                  My Progress
                </h3>
                <p className={`text-xs font-medium line-clamp-1 mt-0.5 ${
                  activeFeatureTab === 'progress' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  Mastery scores & stars
                </p>
              </div>
            </button>

            {/* 4. My Achievements Button */}
            <button
              type="button"
              id="big-btn-my-achievements"
              onClick={() => setActiveFeatureTab('achievements')}
              className={`p-4 sm:p-5 rounded-3xl text-left transition-all flex flex-col justify-between min-h-[140px] group cursor-pointer border-2 ${
                activeFeatureTab === 'achievements'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white border-purple-600 shadow-md ring-4 ring-purple-300/40'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-purple-400 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  activeFeatureTab === 'achievements' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Award className="w-7 h-7" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  activeFeatureTab === 'achievements' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'
                }`}>
                  {student.completedLessons?.length || 0} Badges
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-base sm:text-lg font-black uppercase font-display leading-tight">
                  My Achievements
                </h3>
                <p className={`text-xs font-medium line-clamp-1 mt-0.5 ${
                  activeFeatureTab === 'achievements' ? 'text-purple-100' : 'text-slate-500'
                }`}>
                  Trophies & star certificates
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE CONTENT PANEL CONTROLLED BY SELECTED TERM, WEEK & BIG BUTTONS */}
        {/* ========================================================================= */}
        <section id="pupil-active-feature-panel" className="space-y-4">
          
          {/* 1. MY SUBJECTS VIEW (Shows subjects and lessons for selected Term & Week) */}
          {activeFeatureTab === 'subjects' && (
            <div className="bg-white rounded-[28px] sm:rounded-[36px] border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#026838]">
                    <span>📖 Lesson Subjects</span>
                    <span>•</span>
                    <span>{termConfig.termName}</span>
                    <span>•</span>
                    <span>Week {selectedWeek}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 font-display mt-0.5">
                    Available Subjects & Lessons for Week {selectedWeek}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onViewAllLessons}
                  className="text-xs font-black text-[#026838] uppercase hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Explore Full Curriculum</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {schemeWeekTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schemeWeekTopics.map((topicRec) => {
                    const fullLesson = getFullLessonForSchemeRecord(topicRec) ||
                      weekLessons.find(l => l.subject === topicRec.subject);
                    const completed = fullLesson ? isLessonCompleted(fullLesson) : false;
                    const assignedTeacher = fullLesson 
                      ? (getTeacherForLesson(fullLesson) || getTeacherForSubject(fullLesson.subject, student.grade) || getTeacherForGrade(student.grade))
                      : (getTeacherForSubject(topicRec.subject, student.grade) || getTeacherForGrade(student.grade));

                    return (
                      <div
                        key={topicRec.id}
                        className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between gap-4 group ${
                          fullLesson
                            ? 'border-slate-200 hover:border-emerald-400 bg-white hover:shadow-md'
                            : 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-amber-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-[#D97706] tracking-wider">
                              {topicRec.subject}
                            </span>
                            {fullLesson ? (
                              completed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                  30-Min Lesson Ready
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                                LESSONS COMING SOON
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-black text-slate-900 font-display group-hover:text-[#026838] transition-colors leading-snug">
                            {fullLesson ? fullLesson.topic : topicRec.topic}
                          </h4>

                          <p className="text-xs text-slate-600 font-medium line-clamp-2">
                            {fullLesson 
                              ? fullLesson.subtopic 
                              : (topicRec.subtopics && topicRec.subtopics.length > 0 
                                  ? topicRec.subtopics.join(' • ') 
                                  : topicRec.contentDetails || 'Scheduled in scheme of work.')}
                          </p>

                          {/* Teacher Note */}
                          <div className="flex items-center gap-2 pt-1 text-xs text-slate-700 font-semibold">
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-xs">
                              {assignedTeacher?.avatarEmoji || '👩🏾‍🏫'}
                            </div>
                            <span>
                              {assignedTeacher?.name 
                                ? `Taught by ${assignedTeacher.name}` 
                                : `Primary ${student.grade} Dedicated Teacher`}
                            </span>
                          </div>
                        </div>

                        {fullLesson ? (
                          <button
                            type="button"
                            onClick={() => onStartLesson(fullLesson)}
                            className="w-full py-3 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>{completed ? 'Practice Again' : 'Start Lesson 🚀'}</span>
                          </button>
                        ) : (
                          <div className="w-full py-2.5 px-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                            <span>🌱 Topic scheduled in scheme · Lesson coming soon</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : weekLessons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weekLessons.map((lesson) => {
                    const assignedTeacher = getTeacherForLesson(lesson) || getTeacherForSubject(lesson.subject, student.grade) || getTeacherForGrade(student.grade);
                    const completed = isLessonCompleted(lesson);

                    return (
                      <div
                        key={lesson.id}
                        className="p-5 rounded-3xl border-2 border-slate-200 hover:border-emerald-400 bg-white hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-[#D97706] tracking-wider">
                              {lesson.subject}
                            </span>
                            {completed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                30-Min Session
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-black text-slate-900 font-display group-hover:text-[#026838] transition-colors leading-snug">
                            {lesson.topic}
                          </h4>

                          <p className="text-xs text-slate-600 font-medium line-clamp-2">
                            {lesson.subtopic}
                          </p>

                          <div className="flex items-center gap-2 pt-1 text-xs text-slate-700 font-semibold">
                            <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-xs">
                              {assignedTeacher?.avatarEmoji || '👩🏾‍🏫'}
                            </div>
                            <span>Taught by {assignedTeacher?.name || 'Dedicated Class Teacher'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onStartLesson(lesson)}
                          className="w-full py-3 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>{completed ? 'Practice Again' : 'Start Lesson 🚀'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-amber-50/60 border border-amber-200 text-center space-y-3">
                  <div className="text-3xl">🌱</div>
                  <h4 className="text-base font-black text-slate-900 uppercase font-display">
                    LESSONS COMING SOON FOR WEEK {selectedWeek}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    We are actively finalizing verified lessons for Primary {student.grade}, {termConfig.termName}, Week {selectedWeek}.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWeek(1)}
                      className="px-5 py-2.5 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      Jump to Week 1 Lessons Available Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MY PROGRESS VIEW (Progress filtered by selected term/week) */}
          {activeFeatureTab === 'progress' && (
            <div className="bg-white rounded-[28px] sm:rounded-[36px] border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#1E88E5]">
                    <span>📊 Learning Progress</span>
                    <span>•</span>
                    <span>Primary {student.grade}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 font-display mt-0.5">
                    Your Mastery Level & Learning History
                  </h3>
                </div>
                {onOpenProgress && (
                  <button
                    type="button"
                    onClick={onOpenProgress}
                    className="text-xs font-black text-[#1E88E5] uppercase hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Full Progress Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Weekly & Term Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Overall Score</span>
                  <div className="text-2xl font-black text-emerald-950 font-display mt-0.5">
                    {student.overallScore}%
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {masteryInfo.level}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Weekly Goal</span>
                  <div className="text-2xl font-black text-amber-950 font-display mt-0.5">
                    {student.lessonsCompletedThisWeek} / {student.totalLessonsThisWeek}
                  </div>
                  <span className="text-[11px] font-bold text-amber-700">
                    Lessons Completed
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Top Subject</span>
                  <div className="text-base font-black text-blue-950 font-display mt-1 truncate">
                    {student.topSubject || 'Mathematics'}
                  </div>
                  <span className="text-[11px] font-bold text-blue-700">
                    Primary {student.grade}
                  </span>
                </div>
              </div>

              {/* Completed Lessons Log */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Completed Lessons ({student.completedLessons?.length || 0})
                </h4>

                {student.completedLessons && student.completedLessons.length > 0 ? (
                  <div className="space-y-2">
                    {student.completedLessons.map((item, idx) => {
                      const mastery = getMasteryLevel(item.score);
                      return (
                        <div 
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[10px] font-black uppercase text-[#D97706]">
                              {item.subject}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </h5>
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
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                    No completed lessons recorded yet. Start your first 30-minute practice session!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. MY ACHIEVEMENTS VIEW (Real achievements earned by child) */}
          {activeFeatureTab === 'achievements' && (
            <div className="bg-white rounded-[28px] sm:rounded-[36px] border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-purple-600">
                  <span>🏆 Star Badges & Honors</span>
                  <span>•</span>
                  <span>Primary {student.grade}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 font-display mt-0.5">
                  Your Earned Achievements & Milestones
                </h3>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* 1. Real lesson badges earned */}
                {(student.completedLessons || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 flex items-start gap-3 shadow-2xs"
                  >
                    <span className="text-2xl shrink-0">🎖️</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">
                        {item.badge || 'Topic Master'}
                      </h4>
                      <p className="text-[11px] font-bold text-amber-800 line-clamp-1 mt-0.5">
                        {item.title}
                      </p>
                      <span className="text-[10px] font-black text-[#026838] block mt-1">
                        Score: {item.score}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* 2. Primary Class Enrollment Honor */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 flex items-start gap-3 shadow-2xs">
                  <span className="text-2xl shrink-0">🌟</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">
                      Class Champion
                    </h4>
                    <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                      Enrolled in Primary {student.grade}
                    </p>
                    <span className="text-[10px] font-black text-emerald-700 block mt-1">
                      Active Learner
                    </span>
                  </div>
                </div>

                {/* 3. Consistent Practice Milestone */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 flex items-start gap-3 shadow-2xs">
                  <span className="text-2xl shrink-0">🏆</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">
                      Mastery Status
                    </h4>
                    <p className="text-[11px] font-bold text-purple-800 mt-0.5">
                      {masteryInfo.level}
                    </p>
                    <span className="text-[10px] font-black text-purple-700 block mt-1">
                      {student.overallScore}% Overall Average
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              <span>🇳🇬 BASED ON THE NIGERIAN PRIMARY CURRICULUM</span>
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
                  <h4 className="text-xs font-black text-slate-900 uppercase">Nigerian Virtual Teacher</h4>
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
