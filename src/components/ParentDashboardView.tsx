import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Volume2, 
  ShieldCheck, 
  ArrowRight, 
  CreditCard, 
  Calendar, 
  Sparkles, 
  PlusCircle, 
  Lightbulb, 
  X, 
  FileText, 
  HelpCircle, 
  Check, 
  ChevronRight, 
  Award,
  AlertCircle,
  Phone,
  UserCheck,
  Users,
  GraduationCap
} from 'lucide-react';
import { StudentProfile, GradeLevel, LessonTopic, VoiceTone, ParentAccount, PaymentRecord } from '../types';
import { TeacherSpeechEngine } from '../utils/speech';
import { getTeacherForGrade, getTeacherForSubject } from '../data/teachers';

interface ParentDashboardViewProps {
  students: StudentProfile[];
  activeStudent: StudentProfile;
  allLessons: LessonTopic[];
  walletBalance: number;
  parentAccount?: ParentAccount;
  parentName?: string;
  onSelectStudent: (student: StudentProfile) => void;
  onOpenAddChild: () => void;
  onOpenTuitionPay: (grade: GradeLevel, term: number) => void;
  onLaunchLessonForChild: (lesson?: LessonTopic) => void;
  onSelectVoiceTone?: (tone: VoiceTone) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  students,
  activeStudent,
  allLessons,
  walletBalance,
  parentAccount,
  parentName,
  onSelectStudent,
  onOpenAddChild,
  onOpenTuitionPay,
  onLaunchLessonForChild,
}) => {
  // 1. DYNAMIC PARENT DATA
  const activeParentName = parentAccount?.name || parentName || 'Mr and Mrs Okafor';
  const parentId = parentAccount?.id || 'parent_main';
  const connectedChildrenCount = students.length;

  // 2. MODAL & INTERACTIVE CONTROLS
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportLesson, setSelectedReportLesson] = useState<{
    date: string;
    subject: string;
    topic: string;
    duration: string;
    teacher: string;
    score: number;
    objectives: string[];
    teacherNote: string;
  } | null>(null);

  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePracticeCategory, setActivePracticeCategory] = useState<'math' | 'english' | 'science'>('math');

  // 3. DYNAMIC CHILD DATA DERIVATION
  // Active child's completed lessons from authoritative profile
  const completedLessons = activeStudent.completedLessons || [];
  const hasCompletedLessons = completedLessons.length > 0;
  const latestLesson = hasCompletedLessons ? completedLessons[completedLessons.length - 1] : null;

  // Dedicated class teacher based on child's class
  const classTeacher = getTeacherForGrade(activeStudent.grade);
  const currentSubjectTeacher = latestLesson 
    ? getTeacherForSubject(latestLesson.subject, activeStudent.grade) 
    : classTeacher;

  // Today's subject & topic
  const todaySubject = latestLesson ? latestLesson.subject : 'Mathematics';
  const todayTopic = latestLesson 
    ? latestLesson.title 
    : (allLessons.find(l => l.grade === activeStudent.grade)?.topic || 'Foundational Numbers');
  const todayDuration = '30 Minutes';
  const todayTeacher = currentSubjectTeacher.name;

  // Learning Progress Calculations
  const understandingScore = hasCompletedLessons 
    ? (activeStudent.overallScore || latestLesson?.score || 88)
    : 0;

  // Plain-language, jargon-free progress summary
  const progressExplanation = hasCompletedLessons
    ? `${activeStudent.name} is progressing well in ${activeStudent.topSubject || todaySubject}.`
    : `No lessons recorded yet for ${activeStudent.name}. Once the first lesson is completed, learning scores will appear here.`;

  // Strong Areas & Areas Needing Practice (Derived from actual completed lessons or curriculum defaults)
  const strongAreas = hasCompletedLessons
    ? [
        activeStudent.topSubject || todaySubject,
        ...(completedLessons.filter(l => l.score >= 80).map(l => l.title.split(':')[0])).slice(0, 2)
      ].filter((v, i, a) => a.indexOf(v) === i)
    : [];

  const areasNeedingPractice = hasCompletedLessons
    ? [
        ...(completedLessons.filter(l => l.reexplained || l.score < 80).map(l => l.title.split(':')[0])),
        todayTopic.includes('Fraction') ? 'Mixed Numbers' : 'Multi-step Problem Solving'
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 2)
    : [];

  // 4. TUITION & PAYMENT STATUS (PAYSTACK INTEGRATION READY)
  const currentTermPayment = activeStudent.termlyTuition?.[activeStudent.currentTerm];
  const isTuitionActive = Boolean(currentTermPayment?.paid || activeStudent.activeSubscription);

  // Dynamic Payment Record matching Paystack schema
  const paymentRecord: PaymentRecord = {
    id: `pay_${activeStudent.id}_term${activeStudent.currentTerm}`,
    parentId: parentId,
    childId: activeStudent.id,
    childName: activeStudent.name,
    amount: currentTermPayment?.amount || 6000,
    term: activeStudent.currentTerm,
    grade: activeStudent.grade,
    paymentDate: currentTermPayment?.paidAt 
      ? new Date(currentTermPayment.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : (isTuitionActive ? '15 Jan 2026' : 'Pending payment'),
    paymentStatus: isTuitionActive ? 'paid' : 'pending',
    transactionReference: currentTermPayment?.reference || (isTuitionActive ? `PAYSTACK-TERM${activeStudent.currentTerm}-${activeStudent.id.toUpperCase()}-9842` : 'PENDING-CHECKOUT'),
    channel: currentTermPayment?.channel || 'Paystack Automated Checkout',
    receiptNo: currentTermPayment?.receiptNo || (isTuitionActive ? `BRT-TERM-${activeStudent.grade}${activeStudent.currentTerm}-${activeStudent.id.slice(0, 3).toUpperCase()}01` : 'Pending')
  };

  // 5. TEACHER FEEDBACK (WRITTEN, VOICE, NAME, DATE)
  const feedbackDate = hasCompletedLessons && latestLesson?.completedAt
    ? new Date(latestLesson.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today';

  const teacherWrittenFeedback = hasCompletedLessons
    ? `Hello ${activeParentName}, ${activeStudent.name} understood ${todayTopic} today. ${
        areasNeedingPractice.length > 0 
          ? `A little more home practice with ${areasNeedingPractice[0].toLowerCase()} will help it stick completely.`
          : 'Consistent daily 30-minute learning is building real school confidence.'
      }`
    : `Hello ${activeParentName}, ${activeStudent.name} is enrolled in Primary ${activeStudent.grade}. Once ${activeStudent.name} completes today's first 30-minute lesson, my audio feedback and home practice advice will appear here.`;

  const teacherSpokenFeedback = teacherWrittenFeedback;

  // Voice narration handler using Nigerian Teacher Speech Engine
  const handlePlayTeacherVoice = () => {
    if (isPlayingAudio) {
      TeacherSpeechEngine.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    const isFemale = currentSubjectTeacher.gender === 'female';

    TeacherSpeechEngine.speak(
      teacherSpokenFeedback,
      () => setIsPlayingAudio(false),
      isFemale ? 'female' : 'male',
      'nigerian_teacher',
      todayTeacher
    );
  };

  // Find target lesson for Continue Learning
  const childLessons = allLessons.filter(l => l.grade === activeStudent.grade);
  const targetLesson = childLessons[0] || allLessons[0];

  // Helper to open lesson report modal
  const handleOpenReport = (lessonItem: {
    date: string;
    subject: string;
    topic: string;
    duration: string;
    teacher: string;
    score: number;
    objectives: string[];
    teacherNote: string;
  }) => {
    setSelectedReportLesson(lessonItem);
    setIsReportModalOpen(true);
  };

  return (
    <div id="parent-dashboard-page" className="w-full max-w-6xl mx-auto overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      
      {/* ============================================================ */}
      {/* 1. HEADER AREA: DYNAMIC PARENT DATA & CHILD SELECTOR */}
      {/* ============================================================ */}
      <header className="bg-white p-5 sm:p-7 rounded-[32px] border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[#026838] text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#026838]" />
              <span>Parent Academic Oversight</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-bold">{connectedChildrenCount === 1 ? '1 Child Connected' : `${connectedChildrenCount} Children Connected`}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase font-display tracking-tight">
              PARENT DASHBOARD
            </h1>
            <p className="text-base sm:text-lg font-bold text-slate-700">
              Welcome <span className="text-[#026838] font-black">{activeParentName}</span>
            </p>
          </div>

          <button
            type="button"
            id="parent-add-child-profile-btn"
            onClick={onOpenAddChild}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Add Child Profile</span>
          </button>
        </div>

        {/* Dynamic Child Selector Switcher */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider shrink-0">
            Select Child:
          </span>
          <div className="flex gap-2 flex-wrap items-center">
            {students.map((child) => {
              const isSelected = child.id === activeStudent.id;
              const childPayment = child.termlyTuition?.[child.currentTerm];
              const childIsPaid = Boolean(childPayment?.paid || child.activeSubscription);

              return (
                <button
                  key={child.id}
                  type="button"
                  id={`select-child-tab-${child.id}`}
                  onClick={() => onSelectStudent(child)}
                  className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2.5 border ${
                    isSelected
                      ? 'bg-[#FEFCE8] text-slate-900 border-[#F59E0B] shadow-xs ring-2 ring-[#F59E0B]/30'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div 
                    className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-[11px] text-white font-black"
                    style={{ backgroundColor: child.avatarColor || '#026838' }}
                  >
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      child.name.charAt(0)
                    )}
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight">{child.name}</span>
                    <span className="text-[10px] font-bold opacity-60 block">Primary {child.grade}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#026838] ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parent-Child Relationship Hierarchy Ribbon */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-500">Child: <strong className="text-slate-900 font-black">{activeStudent.name}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Class: <strong className="text-slate-900 font-black">Primary {activeStudent.grade}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Current Term: <strong className="text-slate-900 font-black">Term {activeStudent.currentTerm}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Lessons Completed: <strong className="text-[#026838] font-black">{activeStudent.lessonsCompletedThisWeek || completedLessons.length} of {activeStudent.totalLessonsThisWeek || 5}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Payment Status:</span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
              isTuitionActive 
                ? 'bg-emerald-50 text-[#026838] border-emerald-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {isTuitionActive ? 'Tuition Paid ✓' : 'Payment Needed'}
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* PAYMENT NOTIFICATION BANNER (IF TUITION UNPAID) */}
      {/* ============================================================ */}
      {!isTuitionActive && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-black text-amber-950 uppercase">
                Payment needed to continue lessons.
              </h3>
              <p className="text-xs text-amber-800 font-medium">
                Primary {activeStudent.grade} Term {activeStudent.currentTerm} tuition is due for {activeStudent.name}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenTuitionPay(activeStudent.grade, activeStudent.currentTerm)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            Settle Tuition via Paystack
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2-COLUMN GRID: TODAY'S SUMMARY & LEARNING PROGRESS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 2. TODAY'S LEARNING SUMMARY */}
        <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
                  {hasCompletedLessons ? "Today's Lesson Completed" : "Today's Learning"}
                </span>
                <h2 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
                  TODAY'S LEARNING SUMMARY
                </h2>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full border uppercase ${
                hasCompletedLessons
                  ? 'text-[#026838] bg-emerald-50 border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{hasCompletedLessons ? 'Completed' : 'Ready'}</span>
              </span>
            </div>

            {hasCompletedLessons ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase text-[#026838] block tracking-wide">
                    {todaySubject}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {todayTopic}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Duration: <strong className="text-slate-900 font-black">{todayDuration}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Teacher: <strong className="text-slate-900 font-black">{todayTeacher}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STATE: NO LESSON COMPLETED YET */
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-2">
                <span className="text-3xl block">📚</span>
                <h3 className="text-sm font-black text-slate-800">
                  No lesson completed yet.
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Your child's learning journey will appear here after the first lesson.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onLaunchLessonForChild(targetLesson)}
              className="min-h-[44px] w-full py-3.5 px-4 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
            >
              <span>{hasCompletedLessons ? 'Continue Learning' : 'Start First 30-Minute Lesson'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </section>

        {/* 3. CHILD LEARNING PROGRESS */}
        <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Parent-Friendly Progress
                </span>
                <h2 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
                  CHILD LEARNING PROGRESS
                </h2>
              </div>
              <span className="text-xs font-black text-slate-500">
                Primary {activeStudent.grade}
              </span>
            </div>

            {hasCompletedLessons ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-[#026838] font-display">
                      {understandingScore}%
                    </span>
                    <span className="text-xs font-black text-slate-700 uppercase block tracking-wider mt-0.5">
                      Understanding Developed
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {completedLessons.length} {completedLessons.length === 1 ? 'Lesson' : 'Lessons'} Completed
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#026838] transition-all duration-500"
                    style={{ width: `${understandingScore}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 font-bold leading-relaxed pt-1">
                  {progressExplanation}
                </p>

                {/* Plain-Language Evaluation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
                      What is your child doing well?
                    </span>
                    <ul className="text-xs space-y-1 text-slate-800 font-bold">
                      {strongAreas.map((area, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#026838] shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FEFCE8] border border-amber-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                      What should we practise at home?
                    </span>
                    <ul className="text-xs space-y-1 text-slate-800 font-bold">
                      {areasNeedingPractice.map((area, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STATE: PROGRESS PENDING FIRST LESSON */
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-2">
                <span className="text-3xl block">🌱</span>
                <h3 className="text-sm font-black text-slate-800">
                  No lesson completed yet.
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Your child's learning journey will appear here after the first lesson.
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={!hasCompletedLessons}
              onClick={() => {
                if (hasCompletedLessons && latestLesson) {
                  handleOpenReport({
                    date: 'Today',
                    subject: latestLesson.subject,
                    topic: latestLesson.title,
                    duration: '30 Minutes',
                    teacher: todayTeacher,
                    score: latestLesson.score,
                    objectives: [
                      'Identified foundational ideas and applied them to practical examples.',
                      'Worked through teacher-guided problems step by step.',
                      'Demonstrated clear understanding on diagnostic questions.'
                    ],
                    teacherNote: `Good participation by ${activeStudent.name}. Continued daily practice will build strong long-term retention.`
                  });
                }
              }}
              className={`min-h-[44px] w-full py-3.5 px-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                hasCompletedLessons
                  ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 cursor-pointer shadow-2xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 text-[#026838]" />
              <span>View Full Lesson Report</span>
            </button>
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/* 4. TEACHER FEEDBACK SECTION */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
                Teacher Feedback
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-bold text-slate-500">Date: {feedbackDate}</span>
            </div>
            <h2 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
              MESSAGE FROM {todayTeacher.toUpperCase()}
            </h2>
          </div>

          {/* Prominent LISTEN TO TEACHER Button */}
          <button
            type="button"
            id="listen-to-teacher-btn"
            onClick={handlePlayTeacherVoice}
            className={`min-h-[44px] px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
              isPlayingAudio 
                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                : 'bg-[#026838] hover:bg-[#014d28] text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isPlayingAudio ? 'Stop Teacher Voice' : 'LISTEN TO TEACHER'}</span>
          </button>
        </div>

        {/* Written Teacher Message */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FEFCE8] border-2 border-dashed border-[#FBC02D] space-y-2">
          <p className="text-sm sm:text-base text-slate-900 font-bold leading-relaxed italic">
            "{teacherWrittenFeedback}"
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/80 text-xs">
            <span className="font-black text-[#026838]">
              — {todayTeacher}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Dedicated Primary {activeStudent.grade} Class Teacher
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. HOME PRACTICE SECTION (MATHS, ENGLISH, SCIENCE) */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
              Everyday Nigerian Parent Activities
            </span>
            <h2 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
              WHAT SHOULD WE PRACTISE AT HOME?
            </h2>
          </div>

          {/* Subject Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActivePracticeCategory('math')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                activePracticeCategory === 'math'
                  ? 'bg-white text-[#026838] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mathematics
            </button>
            <button
              type="button"
              onClick={() => setActivePracticeCategory('english')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                activePracticeCategory === 'english'
                  ? 'bg-white text-[#026838] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActivePracticeCategory('science')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                activePracticeCategory === 'science'
                  ? 'bg-white text-[#026838] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Science
            </button>
          </div>
        </div>

        {/* Practice Cards by Subject */}
        {activePracticeCategory === 'math' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍊</span>
                <h3 className="text-xs font-black uppercase text-slate-900">Sharing Oranges</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Take 5 sweet oranges. Share them equally between 2 children. Explain that each child receives 2 whole oranges and 1/2 orange (a mixed number).
              </p>
              <span className="text-[10px] font-bold text-[#026838] block pt-1">Fractions & Mixed Numbers</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💵</span>
                <h3 className="text-xs font-black uppercase text-slate-900">Counting Money</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Take five ₦20 notes to make ₦100. Ask your child: "How many ₦20 notes make ₦100?" (5) and "What fraction of ₦100 is three ₦20 notes?" (3/5).
              </p>
              <span className="text-[10px] font-bold text-[#026838] block pt-1">Place Value & Currency</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📏</span>
                <h3 className="text-xs font-black uppercase text-slate-900">Measuring Items</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Use handspans or a 30cm school ruler to measure your dining table, a school textbook, and a doorway. Record and compare which object is longest.
              </p>
              <span className="text-[10px] font-bold text-[#026838] block pt-1">Length & Measurement</span>
            </div>
          </div>
        )}

        {activePracticeCategory === 'english' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <h3 className="text-xs font-black uppercase text-slate-900">Reading Short Passages</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Read a 3-sentence Nigerian folk story together at bedtime. Ask {activeStudent.name} to explain what happened in their own words and point out all the naming words (nouns).
              </p>
              <span className="text-[10px] font-bold text-[#026838] block pt-1">Reading Fluency & Comprehension</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗣️</span>
                <h3 className="text-xs font-black uppercase text-slate-900">Vocabulary Practice</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Pick 3 descriptive words during cooking or dinner (e.g., <em>steaming, nourishing, delicious</em>). Have your child create an oral sentence with each word.
              </p>
              <span className="text-[10px] font-bold text-[#026838] block pt-1">Vocabulary & Sentence Building</span>
            </div>
          </div>
        )}

        {activePracticeCategory === 'science' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              <h3 className="text-xs font-black uppercase text-slate-900">Observing Household Objects & Nature</h3>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Step into the sitting room or compound with {activeStudent.name}. Challenge them to spot 3 living things (houseplant, lizard, family dog) and 3 non-living things (radio, chair, wooden spoon) using the MR NIGER D test.
            </p>
            <span className="text-[10px] font-bold text-[#026838] block pt-1">Living & Non-Living Classification</span>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 6. LESSON HISTORY (CLICK TO VIEW PREVIOUS REPORTS) */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Click Any Completed Lesson to View Diagnostic Report
            </span>
            <h2 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
              LESSON HISTORY
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {completedLessons.length} {completedLessons.length === 1 ? 'Lesson' : 'Lessons'} Recorded
          </span>
        </div>

        {hasCompletedLessons ? (
          <div className="space-y-3">
            {completedLessons.map((item, idx) => {
              const itemTeacher = getTeacherForSubject(item.subject, activeStudent.grade).name;
              const formattedDate = item.completedAt 
                ? new Date(item.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : `Lesson ${idx + 1}`;

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenReport({
                    date: formattedDate,
                    subject: item.subject,
                    topic: item.title,
                    duration: '30 Minutes',
                    teacher: itemTeacher,
                    score: item.score,
                    objectives: [
                      'Identified foundational concepts and vocabulary for this topic.',
                      'Completed whiteboard direct instruction exercises.',
                      'Demonstrated independent problem solving on assessment.'
                    ],
                    teacherNote: `Good effort by ${activeStudent.name}. Score: ${item.score}%. Continuous practice reinforces mastery.`
                  })}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#026838] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-black">
                      ✓
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase text-slate-400">
                          {formattedDate}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-black text-[#026838]">
                          {item.subject}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {itemTeacher}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-[#026838] transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      30 Minutes
                    </span>
                    <button
                      type="button"
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white group-hover:bg-[#026838] text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-[#026838] text-xs font-black uppercase flex items-center gap-1 transition-all"
                    >
                      <span>View Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE: LESSON HISTORY */
          <div className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-2">
            <span className="text-3xl block">📋</span>
            <h3 className="text-sm font-black text-slate-800">
              No lesson completed yet.
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              Your child's learning journey will appear here after the first lesson.
            </p>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 7. PAYMENT SECTION (PAYSTACK INTEGRATION READY) */}
      {/* ============================================================ */}
      <section className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
              Is my child's lesson payment active?
            </span>
            <h2 className="text-base font-black text-slate-900 uppercase font-display tracking-tight">
              PAYMENT & TUITION STATUS
            </h2>
          </div>

          <button
            type="button"
            id="open-paystack-tuition-btn"
            onClick={() => onOpenTuitionPay(activeStudent.grade, activeStudent.currentTerm)}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Pay Tuition via Paystack</span>
          </button>
        </div>

        {/* Structured Payment Record Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Subscription Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">
                {isTuitionActive ? 'Active Plan' : 'Unpaid'}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isTuitionActive ? 'bg-emerald-100 text-[#026838]' : 'bg-red-100 text-red-700'
              }`}>
                {isTuitionActive ? 'Paid' : 'Due'}
              </span>
            </div>
            <span className="text-slate-500 font-medium block">Term {activeStudent.currentTerm} Tuition</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Amount / Plan</span>
            <span className="text-sm font-black text-slate-900 font-mono">₦{paymentRecord.amount.toLocaleString()} / Term</span>
            <span className="text-slate-500 font-medium block">Primary {activeStudent.grade} Curriculum</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Payment Date</span>
            <span className="text-sm font-black text-slate-900">{paymentRecord.paymentDate}</span>
            <span className="text-slate-500 font-medium block">Parent ID: {paymentRecord.parentId}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Transaction Reference</span>
            <span className="font-mono text-xs font-black text-slate-800 truncate block">{paymentRecord.transactionReference}</span>
            <span className="text-[10px] text-[#026838] font-bold block">{paymentRecord.channel}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100">
          <span>Digital Parent Wallet Balance: <strong className="text-slate-900 font-mono font-black">₦{walletBalance.toLocaleString()}</strong></span>
          <button
            type="button"
            onClick={() => setIsPaymentHistoryModalOpen(true)}
            className="font-black text-[#026838] hover:underline uppercase self-start sm:self-auto cursor-pointer"
          >
            View Complete Paystack History →
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MODAL: LESSON REPORT */}
      {/* ============================================================ */}
      {isReportModalOpen && selectedReportLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Academic Report
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase font-display mt-1">
                  Lesson Diagnostic Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Pupil Name:</span>
                <span className="text-slate-900">{activeStudent.name} (Primary {activeStudent.grade})</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Date & Session:</span>
                <span className="text-slate-900">{selectedReportLesson.date} ({selectedReportLesson.duration})</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Subject & Topic:</span>
                <span className="text-slate-900">{selectedReportLesson.subject} — {selectedReportLesson.topic}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Assigned Teacher:</span>
                <span className="text-[#026838]">{selectedReportLesson.teacher}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Demonstrated Mastery:</span>
                <span className="text-[#026838] font-black">{selectedReportLesson.score}% Understanding Developed</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Demonstrated Learning Objectives:
              </h4>
              <ul className="text-xs space-y-2 text-slate-700">
                {selectedReportLesson.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#026838] shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-[#FEFCE8] border border-amber-300 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-900 block">Teacher's Note to Parent:</span>
              <p className="text-xs text-slate-800 font-semibold italic">
                "{selectedReportLesson.teacherNote}"
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: COMPLETE PAYMENT HISTORY */}
      {/* ============================================================ */}
      {isPaymentHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Paystack Receipts
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase font-display mt-1">
                  Tuition Records
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentHistoryModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Parent ID:</span>
                  <span className="text-slate-900 font-mono">{paymentRecord.parentId}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Registered Pupil:</span>
                  <span className="text-slate-900">{paymentRecord.childName} (Primary {paymentRecord.grade})</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Plan Rate:</span>
                  <span className="text-slate-900 font-mono">₦{paymentRecord.amount.toLocaleString()} / Term</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Digital Wallet:</span>
                  <span className="text-[#D97706] font-mono font-black">₦{walletBalance.toLocaleString()}</span>
                </div>
              </div>

              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Official Term Receipts:
              </h4>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">{paymentRecord.receiptNo}</span>
                  <span className="text-slate-500 text-[10px]">Primary {activeStudent.grade} Term {paymentRecord.term} Tuition • {paymentRecord.channel}</span>
                  <span className="text-slate-400 text-[10px] block font-mono">Ref: {paymentRecord.transactionReference}</span>
                </div>
                <span className={`font-bold px-2 py-1 rounded border ${
                  isTuitionActive ? 'text-[#026838] bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {isTuitionActive ? `₦${paymentRecord.amount.toLocaleString()} Paid ✓` : 'Payment Needed'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentHistoryModalOpen(false);
                  onOpenTuitionPay(activeStudent.grade, activeStudent.currentTerm);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Pay Next Term
              </button>
              <button
                type="button"
                onClick={() => setIsPaymentHistoryModalOpen(false)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUPPORT */}
      {/* ============================================================ */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Brightly Counselor Desk
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase font-display mt-1">
                  Parent Support
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Have questions regarding {activeStudent.name}'s lesson pacing, payment receipts, or syllabus coverage?
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <span className="font-bold text-slate-900 block">Helpline / WhatsApp</span>
                  <span className="text-slate-500 font-mono">+234 803 123 4567</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <span className="font-bold text-slate-900 block">Parent Support Email</span>
                  <span className="text-slate-500 font-mono">parents@brightly.ng</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#026838] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
