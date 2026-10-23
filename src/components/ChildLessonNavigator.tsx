import React, { useState, useMemo } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Clock, 
  Award, 
  BookOpen, 
  ChevronRight, 
  Star, 
  ArrowRight,
  Shield,
  Volume2
} from 'lucide-react';
import { LessonTopic, StudentProfile, SubjectName, GradeLevel } from '../types';
import { getTeacherForLesson, getTeacherForGrade, getTeacherForSubject } from '../data/teachers';

interface ChildLessonNavigatorProps {
  student: StudentProfile;
  allLessons: LessonTopic[];
  onStartLesson: (lesson?: LessonTopic) => void;
  onOpenParentPortal?: () => void;
}

export const ChildLessonNavigator: React.FC<ChildLessonNavigatorProps> = ({
  student,
  allLessons,
  onStartLesson,
  onOpenParentPortal,
}) => {
  // Step 1: Selected Term (defaults to pupil's current registered term)
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(student.currentTerm || 1);

  // Step 2: Selected Week (defaults to pupil's current week, clamped 1-12)
  const [selectedWeek, setSelectedWeek] = useState<number>(student.currentWeek || 1);

  // Step 3: Selected Subject (defaults to Mathematics or student's top subject)
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>(
    (student.topSubject as SubjectName) || 'Mathematics'
  );

  const subjectsList: { name: SubjectName; icon: string; color: string; desc: string }[] = [
    { name: 'Mathematics', icon: '📐', color: 'from-amber-500 to-amber-600', desc: 'Numbers, fractions & arithmetic' },
    { name: 'English Studies', icon: '📖', color: 'from-blue-500 to-blue-600', desc: 'Phonics, grammar & reading' },
    { name: 'Basic Science & Technology', icon: '🔬', color: 'from-emerald-500 to-emerald-600', desc: 'Living things, health & tech' },
    { name: 'Social Studies', icon: '🌍', color: 'from-purple-500 to-purple-600', desc: 'Nigerian geography & culture' },
    { name: 'Agricultural Science', icon: '🌾', color: 'from-lime-600 to-green-700', desc: 'Plants, farming & soil' },
    { name: 'Civic Education', icon: '🏛️', color: 'from-rose-500 to-rose-600', desc: 'Citizenship, values & duties' },
  ];

  // Check whether tuition is active for the selected term
  const termTuition = student.termlyTuition?.[selectedTerm];
  const isTermPaid = Boolean(termTuition?.paid || student.activeSubscription);

  // Week 1 is always FREE for all pupils in Nigeria; Week 2+ requires active family tuition
  const isWeekAccessible = selectedWeek === 1 || isTermPaid;

  // Find authoritative matching lesson for (grade, term, week, subject)
  const matchedLesson: LessonTopic = useMemo(() => {
    // 1. Exact match
    const exact = allLessons.find(
      l => l.grade === student.grade &&
           l.term === selectedTerm &&
           l.week === selectedWeek &&
           l.subject === selectedSubject
    );
    if (exact) return exact;

    // 2. Fallback matching grade and subject
    const subjectMatch = allLessons.find(
      l => l.grade === student.grade && l.subject === selectedSubject
    );
    if (subjectMatch) {
      return {
        ...subjectMatch,
        term: selectedTerm,
        week: selectedWeek,
        isFree: selectedWeek === 1,
        id: `p${student.grade}-t${selectedTerm}-w${selectedWeek}-${selectedSubject.toLowerCase().slice(0, 4)}`
      };
    }

    // 3. Fallback matching grade
    const gradeMatch = allLessons.find(l => l.grade === student.grade);
    if (gradeMatch) {
      return {
        ...gradeMatch,
        subject: selectedSubject,
        term: selectedTerm,
        week: selectedWeek,
        isFree: selectedWeek === 1,
        topic: `${selectedSubject} Core Mastery`,
        subtopic: `NERDC Primary ${student.grade} Curriculum — Term ${selectedTerm}, Week ${selectedWeek}`,
        id: `p${student.grade}-t${selectedTerm}-w${selectedWeek}-${selectedSubject.toLowerCase().slice(0, 4)}`
      };
    }

    // 4. Default baseline fallback
    return {
      id: `p${student.grade}-t${selectedTerm}-w${selectedWeek}-foundational`,
      grade: student.grade,
      term: selectedTerm,
      week: selectedWeek,
      subject: selectedSubject,
      topic: `${selectedSubject}: Foundational Skills`,
      subtopic: `Weekly Primary ${student.grade} Nigerian Curriculum Syllabus`,
      isFree: selectedWeek === 1,
      teacherId: 'babatunde',
      status: 'IN_PROGRESS',
      objectives: [
        `Understand key principles of ${selectedSubject} for Primary ${student.grade}`,
        `Apply core problem-solving steps with practical concrete examples`,
        `Demonstrate knowledge through interactive quiz questions`
      ],
      concreteVisualAids: [],
      whiteboardSteps: [],
      practiceProblems: [],
      assessmentQuestions: [],
      lastWeekRevision: 'Previous foundational concepts review.',
      previousKnowledge: 'Everyday observations and school classroom foundation.'
    };
  }, [allLessons, student.grade, selectedTerm, selectedWeek, selectedSubject]);

  const assignedTeacher = getTeacherForLesson(matchedLesson) || getTeacherForSubject(selectedSubject, student.grade) || getTeacherForGrade(student.grade);

  // Check if student has already completed this lesson
  const completedRecord = (student.completedLessons || []).find(
    c => c.topicId === matchedLesson.id || (c.subject === matchedLesson.subject && c.title === matchedLesson.topic)
  );

  return (
    <div id="child-lesson-navigator" className="w-full space-y-6 animate-fadeIn">
      
      {/* ============================================================== */}
      {/* 3-STEP SELECTION CONTAINER                                    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl sm:rounded-[36px] border border-slate-200/90 shadow-sm p-4 sm:p-7 space-y-6">
        
        {/* Title & Explanatory Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-2 text-[#026838] text-[11px] font-black uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-[#026838] animate-pulse" />
              <span>Easy 3-Step Lesson Chooser</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-bold">Primary {student.grade} Curriculum</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
              Select Your Lesson: Term ➔ Week ➔ Subject
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
              Primary {student.grade}
            </span>
            {isTermPaid ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-[#026838] border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Term {selectedTerm} Unlocked</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                Week 1 Free Preview
              </span>
            )}
          </div>
        </div>

        {/* Step-by-Step Visual Status Indicator */}
        <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Step 1 Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#026838] text-white text-xs font-black shadow-xs">
              <span className="w-4 h-4 rounded-full bg-white text-[#026838] flex items-center justify-center text-[10px] font-black shrink-0">1</span>
              <span>Term {selectedTerm}</span>
            </div>
            
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 2 Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFC72C] text-[#0F2C59] text-xs font-black shadow-xs">
              <span className="w-4 h-4 rounded-full bg-[#0F2C59] text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
              <span>Week {selectedWeek}</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 3 Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xs">
              <span className="w-4 h-4 rounded-full bg-[#22C55E] text-black flex items-center justify-center text-[10px] font-black shrink-0">3</span>
              <span className="truncate max-w-[130px] sm:max-w-none">{selectedSubject}</span>
            </div>
          </div>

          <div className="text-right text-[11px] font-bold text-slate-500 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
            <span>Lesson Ready to Launch Below</span>
            <span className="text-[#026838] font-black">⬇️</span>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* STEP 1: SELECT TERM                                          */}
        {/* ------------------------------------------------------------ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#026838] text-white text-xs flex items-center justify-center font-black">1</span>
              <span>Step 1: Choose Academic Term</span>
            </label>
            <span className="text-xs text-slate-500 font-bold">3 Terms in Academic Year</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([1, 2, 3] as const).map((t) => {
              const isSelected = selectedTerm === t;
              const termTuitionRecord = student.termlyTuition?.[t];
              const isPaid = Boolean(termTuitionRecord?.paid || student.activeSubscription);

              return (
                <button
                  key={t}
                  type="button"
                  id={`select-term-btn-${t}`}
                  onClick={() => setSelectedTerm(t)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-emerald-50 border-[#026838] shadow-sm ring-2 ring-[#026838]/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">
                        {t === 1 ? 'Term 1' : t === 2 ? 'Term 2' : 'Term 3'}
                      </span>
                      {isSelected && <span className="text-xs font-black text-[#026838]">✓ Selected</span>}
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {t === 1 && 'First Term (Sept – Dec)'}
                      {t === 2 && 'Second Term (Jan – Apr)'}
                      {t === 3 && 'Third Term (May – Jul)'}
                    </p>
                  </div>

                  <div>
                    {isPaid ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-[#026838] border border-emerald-200">
                        Full Access ✓
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
                        Week 1 Free
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* STEP 2: SELECT WEEK                                          */}
        {/* ------------------------------------------------------------ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#026838] text-white text-xs flex items-center justify-center font-black">2</span>
              <span>Step 2: Choose Teaching Week</span>
            </label>
            <span className="text-xs text-slate-500 font-bold">Weeks 1 to 12</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
              const isSelected = selectedWeek === w;
              const isFree = w === 1;
              const isAccessible = isFree || isTermPaid;

              return (
                <button
                  key={w}
                  type="button"
                  id={`select-week-btn-${w}`}
                  onClick={() => setSelectedWeek(w)}
                  className={`min-h-[52px] p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 relative ${
                    isSelected
                      ? 'bg-[#FFC72C] text-[#0F2C59] border-[#FFC72C] shadow-sm font-black ring-2 ring-[#FFC72C]/40'
                      : isAccessible
                      ? 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50 font-bold'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 font-medium'
                  }`}
                >
                  <span className="text-xs font-black leading-tight">Wk {w}</span>
                  <span className="text-[9px] font-bold mt-0.5">
                    {isFree ? (
                      <span className="text-emerald-700 font-black">FREE</span>
                    ) : isAccessible ? (
                      <span className="text-slate-600">Open</span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* STEP 3: SELECT SUBJECT                                       */}
        {/* ------------------------------------------------------------ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#026838] text-white text-xs flex items-center justify-center font-black">3</span>
              <span>Step 3: Choose Subject</span>
            </label>
            <span className="text-xs text-slate-500 font-bold">Primary School Scheme</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {subjectsList.map((sub) => {
              const isSelected = selectedSubject === sub.name;
              return (
                <button
                  key={sub.name}
                  type="button"
                  id={`select-subject-btn-${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setSelectedSubject(sub.name)}
                  className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between min-h-[96px] cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/30'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl">{sub.icon}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#22C55E] flex items-center justify-center text-black text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black leading-tight line-clamp-1">{sub.name}</h4>
                    <span className={`text-[10px] block mt-0.5 line-clamp-1 ${isSelected ? 'text-slate-300 font-medium' : 'text-slate-400 font-medium'}`}>
                      {sub.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DIRECT LESSON ACTION & LAUNCH CARD                             */}
      {/* ============================================================== */}
      <div className="w-full rounded-3xl sm:rounded-[36px] bg-white border-2 border-emerald-500/30 p-5 sm:p-8 shadow-sm space-y-5">
        
        {/* Top Meta Line */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-[#026838] text-white">
              Primary {student.grade}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-200">
              Term {selectedTerm} • Week {selectedWeek}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-900 border border-blue-200">
              {matchedLesson.subject}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>30-Minute Daily Mastery</span>
            </span>
          </div>
        </div>

        {/* Main Lesson Body */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
              {matchedLesson.topic}
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-600">
              {matchedLesson.subtopic}
            </p>

            {/* Key Learning Objectives */}
            {matchedLesson.objectives && matchedLesson.objectives.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  What You Will Learn & Master:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                  {matchedLesson.objectives.slice(0, 4).map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-[#026838] shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assigned Teacher Persona */}
            <div className="flex items-center gap-3 pt-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xs border-2 border-white"
                style={{ backgroundColor: assignedTeacher?.avatarColor || '#026838' }}
              >
                {assignedTeacher?.avatarEmoji || '👩🏾‍🏫'}
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900">{assignedTeacher?.name || 'Nigerian Master Teacher'}</span>
                <span className="block text-[11px] font-bold text-[#026838]">{assignedTeacher?.classTitle || `Primary ${student.grade} Subject Teacher`}</span>
              </div>
            </div>
          </div>

          {/* Launch / Access Gate Box */}
          <div className="w-full lg:w-auto lg:min-w-[280px] flex flex-col gap-3 shrink-0">
            {isWeekAccessible ? (
              <button
                type="button"
                id="child-start-selected-lesson-btn"
                onClick={() => onStartLesson(matchedLesson)}
                className="w-full py-4 px-6 rounded-2xl bg-[#026838] hover:bg-[#014d28] active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <PlayCircle className="w-6 h-6 text-[#FFC72C]" />
                <span>
                  {completedRecord ? 'RETAKE / PRACTICE AGAIN' : 'START LESSON NOW (30 MIN)'}
                </span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            ) : (
              <div className="space-y-3 bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-xs uppercase">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Week {selectedWeek} Requires Subscription</span>
                </div>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  Week 1 is completely free! Weeks 2 to 12 require termly family tuition (₦6,000/term).
                </p>
                <button
                  type="button"
                  id="child-ask-parent-unlock-btn"
                  onClick={() => onStartLesson(matchedLesson)}
                  className="w-full py-3 px-4 rounded-xl bg-[#026838] text-white hover:bg-[#014d28] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Shield className="w-4 h-4 text-[#FFC72C]" />
                  <span>Ask Parent to Unlock 👨‍👩‍👧</span>
                </button>
              </div>
            )}

            {completedRecord && (
              <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center justify-between text-xs font-bold text-[#026838]">
                <span>Previous Result:</span>
                <span className="font-black">{completedRecord.score}% ({completedRecord.badge || 'Completed'}) ⭐</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
