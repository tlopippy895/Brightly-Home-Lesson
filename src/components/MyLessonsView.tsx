import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  CheckCircle2, 
  PlayCircle, 
  Star, 
  Clock, 
  Sparkles,
  Bot,
  Lock,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { LessonTopic, StudentProfile, GradeLevel } from '../types';
import { CURRICULUM_DATA } from '../data/curriculum';
import { getTeacherForLesson } from '../data/teachers';

interface MyLessonsViewProps {
  student: StudentProfile;
  initialSubject?: string;
  onSelectLesson: (lesson: LessonTopic) => void;
  onGradeChange: (grade: GradeLevel) => void;
  onRequestTuitionPayment: (grade: GradeLevel, term: number, reason: 'unregistered_class' | 'term_unpaid') => void;
}

export const MyLessonsView: React.FC<MyLessonsViewProps> = ({
  student,
  initialSubject = 'All',
  onSelectLesson,
  onGradeChange,
  onRequestTuitionPayment,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedTerm, setSelectedTerm] = useState<number>(student.currentTerm);
  const [selectedWeek, setSelectedWeek] = useState<number | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = ['All', 'Mathematics', 'English Studies', 'Basic Science & Technology', 'Social Studies', 'Civic Education', 'Agricultural Science'];
  const termNames: Record<number, string> = {
    1: 'First Term',
    2: 'Second Term',
    3: 'Third Term'
  };

  const isClassRegistered = student.grade === student.registeredGrade;
  const currentTermPayment = student.termlyTuition?.[selectedTerm];
  const isTermPaid = isClassRegistered && (currentTermPayment?.paid || student.activeSubscription);

  // Filter curriculum lessons by grade, term, week, subject, and search query
  const filteredLessons = CURRICULUM_DATA.filter((lesson) => {
    const matchGrade = lesson.grade === student.grade;
    const matchTerm = lesson.term === selectedTerm;
    const matchWeek = selectedWeek === 'All' || lesson.week === selectedWeek;
    const matchSubject = selectedSubject === 'All' || lesson.subject === selectedSubject;
    const matchSearch = searchQuery === '' || 
      lesson.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchTerm && matchWeek && matchSubject && matchSearch;
  });

  return (
    <div id="my-lessons-view" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FEFCE8] p-6 md:p-8 rounded-[32px] border-2 border-[#FBC02D] shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#F59E0B] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              NERDC Scheme of Work
            </span>
            <span className="bg-white text-gray-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Registered: Primary {student.registeredGrade}
            </span>
            {isTermPaid ? (
              <span className="bg-[#DCFCE7] text-[#15803D] border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{termNames[selectedTerm]} Tuition Paid</span>
              </span>
            ) : (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>{termNames[selectedTerm]} Unpaid</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#026838] tracking-tight font-display uppercase mt-2">
            Term &bull; Week &bull; Topic Selection
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
            30-Minute Structured Mastery Modules for Primary {student.grade} &bull; {termNames[selectedTerm]}
          </p>
        </div>

        {/* 1. First/Second/Third Term Selection Tabs */}
        <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-amber-200 self-start md:self-auto shadow-2xs">
          {[1, 2, 3].map((term) => {
            const isThisTermPaid = isClassRegistered && (student.termlyTuition?.[term]?.paid || student.activeSubscription);
            return (
              <button
                key={term}
                id={`term-tab-${term}`}
                onClick={() => setSelectedTerm(term)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTerm === term
                    ? 'bg-[#026838] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-amber-100/60'
                }`}
              >
                <span>{termNames[term]}</span>
                {isThisTermPaid ? (
                  <span className="text-[10px] text-[#86EFAC]">✓</span>
                ) : (
                  <Lock className="w-3 h-3 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Structured Breadcrumb Hierarchy */}
      <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-[#026838] flex flex-wrap items-center gap-2">
        <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
          Primary {student.grade}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
        <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
          {termNames[selectedTerm]}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
        <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
          {selectedWeek === 'All' ? 'All Weeks (1–12)' : `Week ${selectedWeek}`}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
        <span className="bg-[#026838] text-white px-2.5 py-1 rounded-lg shadow-2xs">
          {selectedSubject} ({filteredLessons.length} Topics Found)
        </span>
      </div>

      {/* Access Control Alert Banner (if Unregistered Class or Unpaid Term) */}
      {!isClassRegistered ? (
        <div className="bg-[#FFFBEB] border-2 border-[#FBC02D] p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 uppercase font-display">
                Class Access Restricted: Registered for Primary {student.registeredGrade}
              </h4>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                {student.name} is enrolled in <strong>Primary {student.registeredGrade}</strong>. Termly access is only granted to registered classes upon tuition settlement.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequestTuitionPayment(student.grade, selectedTerm, 'unregistered_class')}
            className="px-5 py-2.5 bg-[#026838] text-white text-xs font-black rounded-xl shadow-[0_4px_0_0_#014D25] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider shrink-0 cursor-pointer"
          >
            Register for Primary {student.grade}
          </button>
        </div>
      ) : !isTermPaid ? (
        <div className="bg-[#FFFBEB] border-2 border-[#FBC02D] p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 uppercase font-display">
                {termNames[selectedTerm]} Tuition Payment Required
              </h4>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                Termly access is granted after school fee payment (₦5,000/term or ₦12,000/annual). Unlock all Primary {student.grade} {termNames[selectedTerm]} lessons now.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequestTuitionPayment(student.grade, selectedTerm, 'term_unpaid')}
            className="px-5 py-2.5 bg-[#026838] text-white text-xs font-black rounded-xl shadow-[0_4px_0_0_#014D25] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none uppercase tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pay ₦5,000 & Unlock {termNames[selectedTerm]}</span>
          </button>
        </div>
      ) : null}

      {/* 3. Week Selection Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D97706]" />
            <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
              Select Week ({termNames[selectedTerm]} Syllabus):
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Weeks 1 to 12</span>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedWeek('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              selectedWeek === 'All'
                ? 'bg-[#026838] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Weeks
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((wk) => (
            <button
              key={wk}
              type="button"
              onClick={() => setSelectedWeek(wk)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedWeek === wk
                  ? 'bg-[#F59E0B] text-black shadow-xs font-black ring-2 ring-black/10'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              Week {wk}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Subject Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-[#026838] text-white shadow-sm'
                  : 'bg-white border border-sky-100 text-gray-600 hover:bg-sky-50'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic or concept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-sky-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#026838] text-gray-800"
          />
        </div>
      </div>

      {/* 5. Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLessons.map((lesson) => {
          const isMastered = lesson.status === 'COMPLETED';
          const isInProgress = lesson.status === 'IN_PROGRESS';
          const cardTeacher = getTeacherForLesson(lesson);

          return (
            <div
              key={lesson.id}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#026838] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full uppercase border border-[#86EFAC]">
                    Week {lesson.week} • {lesson.subject}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">
                    30 Mins
                  </span>
                </div>

                <h3 className="text-base font-black text-gray-900 uppercase font-display group-hover:text-[#026838] transition-colors line-clamp-2 leading-snug">
                  {lesson.topic}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-2">
                  {lesson.subtopic}
                </p>

                {/* Assigned Subject Master Teacher */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-700 font-bold">
                  <span className="text-base">{cardTeacher.avatarEmoji}</span>
                  <span className="text-slate-900 font-black">{cardTeacher.name}</span>
                  <span className="text-slate-400 text-[10px]">({cardTeacher.subjectSpecialty})</span>
                </div>
              </div>

              {/* Concrete Context Tag */}
              <div className="text-[11px] text-[#D97706] bg-[#FEFCE8] p-2.5 rounded-xl border border-[#FDE68A] line-clamp-1 flex items-center gap-1.5 font-medium">
                <span>📍</span>
                <span>{lesson.previousKnowledge}</span>
              </div>

              {/* Action Button & Status */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  {isMastered && (
                    <span className="inline-flex items-center gap-1.5 text-[#43A047] text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 text-[#43A047]" />
                      <span>Mastered</span>
                    </span>
                  )}
                  {isInProgress && (
                    <span className="inline-flex items-center gap-1.5 text-[#1E88E5] text-xs font-black">
                      <PlayCircle className="w-4 h-4 text-[#1E88E5]" />
                      <span>In Progress</span>
                    </span>
                  )}
                  {(lesson.status === 'UPCOMING' || !lesson.status) && (
                    <span className="text-gray-400 text-xs font-medium">
                      Upcoming
                    </span>
                  )}
                </div>

                {isTermPaid ? (
                  <button
                    id={`open-lesson-${lesson.id}`}
                    onClick={() => onSelectLesson(lesson)}
                    className="px-4 py-2 rounded-xl bg-[#43A047] text-white text-xs font-black shadow-[0_3px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Start Lesson</span>
                    <PlayCircle className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    id={`unlock-lesson-${lesson.id}`}
                    onClick={() => onRequestTuitionPayment(
                      student.grade, 
                      selectedTerm, 
                      isClassRegistered ? 'term_unpaid' : 'unregistered_class'
                    )}
                    className="px-4 py-2 rounded-xl bg-[#F59E0B] text-white text-xs font-black shadow-[0_3px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredLessons.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl p-8 sm:p-12 border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center text-xl mx-auto border border-amber-200">
              📋
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase font-display">
              Awaiting Official Curriculum Records
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
              No curriculum entries have been imported for Primary {student.grade} • {selectedSubject} • Term {selectedTerm} yet. Verified NERDC scheme of work modules will be listed here once published.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
