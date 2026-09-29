import React, { useState } from 'react';
import { 
  UserCheck, 
  TrendingUp, 
  BookOpen, 
  Award, 
  CreditCard, 
  ShieldCheck, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Lock,
  Sparkles,
  Volume2,
  BrainCircuit,
  Repeat
} from 'lucide-react';
import { StudentProfile, GradeLevel, LessonTopic, VoiceTone } from '../types';
import { getMasteryLevel } from '../utils/mastery';

interface ParentDashboardViewProps {
  students: StudentProfile[];
  activeStudent: StudentProfile;
  allLessons: LessonTopic[];
  walletBalance: number;
  onSelectStudent: (student: StudentProfile) => void;
  onOpenAddChild: () => void;
  onOpenTuitionPay: (grade: GradeLevel, term: number) => void;
  onLaunchLessonForChild: (lesson?: LessonTopic) => void;
  onSelectVoiceTone: (tone: VoiceTone) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  students,
  activeStudent,
  allLessons,
  walletBalance,
  onSelectStudent,
  onOpenAddChild,
  onOpenTuitionPay,
  onLaunchLessonForChild,
  onSelectVoiceTone,
}) => {
  const [activeParentTab, setActiveParentTab] = useState<'overview' | 'lessons' | 'performance' | 'tuition'>('overview');

  const currentTermPayment = activeStudent.termlyTuition?.[activeStudent.currentTerm];
  const isTuitionPaid = currentTermPayment?.paid || activeStudent.activeSubscription;

  // Student specific completed lessons
  const studentLessons = allLessons.filter(l => l.grade === activeStudent.grade);
  const nextUpLesson = studentLessons[0] || allLessons[0];

  return (
    <div id="parent-dashboard-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Parent Welcome & Child Selector Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-[11px] font-black uppercase text-[#026838]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PARENT GOVERNANCE & ACADEMIC OVERSIGHT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#026838] uppercase font-display tracking-tight">
              Parent Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Monitor your children’s daily 30-minute learning progress, lesson mastery scores, tuition status, and diagnostic reports.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddChild}
            className="px-4 py-2.5 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Add Child Profile</span>
          </button>
        </div>

        {/* Children Profile Switcher Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            Select Child:
          </span>
          <div className="flex gap-2 flex-wrap">
            {students.map((child) => {
              const isSelected = child.id === activeStudent.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onSelectStudent(child)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 border ${
                    isSelected
                      ? 'bg-amber-50 text-slate-900 border-[#F59E0B] shadow-xs font-black ring-2 ring-[#F59E0B]/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-[10px] text-white font-black"
                    style={{ backgroundColor: child.avatarColor || '#026838' }}
                  >
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      child.name.charAt(0)
                    )}
                  </div>
                  <span>{child.name}</span>
                  <span className="text-[10px] opacity-75 font-normal">(Pri {child.grade})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Internal Parent Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveParentTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeParentTab === 'overview'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          Child Profile & Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveParentTab('lessons')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeParentTab === 'lessons'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          Lessons & Syllabus
        </button>
        <button
          type="button"
          onClick={() => setActiveParentTab('performance')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeParentTab === 'performance'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          Performance & Diagnostics
        </button>
        <button
          type="button"
          onClick={() => setActiveParentTab('tuition')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeParentTab === 'tuition'
              ? 'bg-[#026838] text-white shadow-xs'
              : 'text-slate-600 hover:bg-white'
          }`}
        >
          Subscription & Tuition
        </button>
      </div>

      {/* Tab 1: Child Profile & Overview */}
      {activeParentTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3 High-Level Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Weekly Lessons</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-[#1E88E5] font-display">{activeStudent.lessonsCompletedThisWeek}</span>
                <span className="text-sm font-bold text-slate-400">/ {activeStudent.totalLessonsThisWeek} Completed</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#1E88E5] transition-all"
                  style={{ width: `${(activeStudent.lessonsCompletedThisWeek / activeStudent.totalLessonsThisWeek) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cumulative Mastery Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-[#026838] font-display">{activeStudent.overallScore}%</span>
                <span className="text-xs font-black text-emerald-600 uppercase">Verified</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#026838] transition-all"
                  style={{ width: `${activeStudent.overallScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-[28px] border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tuition Status</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-base font-black uppercase ${isTuitionPaid ? 'text-[#026838]' : 'text-amber-700'}`}>
                  {isTuitionPaid ? 'Active & Paid' : 'Term 1 Tuition Due'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Primary {activeStudent.grade}</span>
                <button
                  type="button"
                  onClick={() => onOpenTuitionPay(activeStudent.grade, activeStudent.currentTerm)}
                  className="text-xs font-black text-[#D97706] hover:underline uppercase"
                >
                  Manage Tuition →
                </button>
              </div>
            </div>
          </div>

          {/* Child Profile Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase font-display border-b border-slate-100 pb-3">
              {activeStudent.name}’s Learning Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Registered Class</span>
                <span className="font-black text-slate-900 text-sm">Primary {activeStudent.registeredGrade}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Current Term</span>
                <span className="font-black text-slate-900 text-sm">Term {activeStudent.currentTerm}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Preferred Voice Tone</span>
                <span className="font-black text-[#026838] text-sm uppercase">
                  {activeStudent.preferredVoiceTone === 'phonics' ? '🗣️ Phonics Voice' : '🇳🇬 Nigerian Teacher Voice'}
                </span>
              </div>
            </div>

            {/* Launch Child Lesson Banner */}
            <div className="p-5 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                  Ready for Today
                </span>
                <h4 className="text-sm font-black text-slate-900 uppercase mt-1">
                  Start 30-Minute Lesson: {nextUpLesson.topic}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {nextUpLesson.subject} • Primary {nextUpLesson.grade}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onLaunchLessonForChild(nextUpLesson)}
                className="px-6 py-3 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
              >
                <span>Launch Lesson</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Lessons & Syllabus */}
      {activeParentTab === 'lessons' && (
        <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900 uppercase font-display border-b border-slate-100 pb-3">
            Primary {activeStudent.grade} NERDC Scheme of Work
          </h3>

          <div className="divide-y divide-slate-100">
            {studentLessons.slice(0, 6).map((lesson, idx) => (
              <div key={lesson.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      Week {lesson.week}
                    </span>
                    <span className="text-xs font-black text-slate-900 uppercase">
                      {lesson.topic}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {lesson.subject} • Term {lesson.term}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                    30-Min Module
                  </span>
                  <button
                    type="button"
                    onClick={() => onLaunchLessonForChild(lesson)}
                    className="px-3 py-1.5 bg-[#026838] hover:bg-[#014d28] text-white rounded-lg text-xs font-black uppercase cursor-pointer"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Performance & Diagnostics */}
      {activeParentTab === 'performance' && (
        <div className="space-y-6">
          {/* Mastery Before Moving On Philosophy Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 p-5 sm:p-6 rounded-[28px] border border-emerald-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#026838] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                Core Learning Principle
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase font-display">
                Mastery Before Moving On
              </h3>
              <p className="text-xs text-slate-600 font-medium max-w-2xl leading-relaxed">
                Brightly Home Lesson does not treat 70% as a pass-and-rush threshold. We measure depth of understanding across 5 distinct mastery stages, intervening patiently whenever a child requires additional support.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {[
                { name: 'Beginning', range: '<50%', color: 'bg-rose-100 text-rose-800' },
                { name: 'Developing', range: '50-69%', color: 'bg-amber-100 text-amber-800' },
                { name: 'Approaching Mastery', range: '70-84%', color: 'bg-blue-100 text-blue-800' },
                { name: 'Mastered', range: '85-94%', color: 'bg-emerald-100 text-emerald-800' },
                { name: 'Strong Mastery', range: '95-100%', color: 'bg-emerald-700 text-white font-black' },
              ].map(tier => (
                <div key={tier.name} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${tier.color} text-center`}>
                  <div>{tier.name}</div>
                  <div className="text-[9px] opacity-80">{tier.range}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Subject Mastery Breakdown */}
            <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase font-display border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Subject Mastery Breakdown</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Primary {activeStudent.grade}</span>
              </h4>
              <div className="space-y-3.5">
                {[
                  { name: 'Mathematics', score: 92 },
                  { name: 'English Studies', score: 88 },
                  { name: 'Basic Science & Tech', score: 94 },
                  { name: 'Social Studies', score: 85 },
                  { name: 'Civic Education', score: 80 },
                  { name: 'Agricultural Science', score: 86 },
                ].map(sub => {
                  const m = getMasteryLevel(sub.score);
                  return (
                    <div key={sub.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m.badgeBg} ${m.badgeBorder} ${m.badgeText}`}>
                            {m.level}
                          </span>
                          <span className="text-[#026838] font-black">{sub.score}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#026838]" style={{ width: `${sub.score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adaptive Re-Teaching Interventions & Support */}
            <div className="space-y-5">
              <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-3">
                <h4 className="text-sm font-black text-slate-900 uppercase font-display border-b border-slate-100 pb-2 flex items-center gap-2 text-[#026838]">
                  <BrainCircuit className="w-4 h-4 text-[#026838]" />
                  <span>Adaptive Re-Teaching Interventions</span>
                </h4>
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      Re-explanation Loop Completed
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800">✓ Mastered on Re-test</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    <strong>Topic:</strong> "Proper & Improper Fractions" (Mathematics).<br />
                    <strong>Loop Trigger:</strong> Initial confusion on numerator {'>'} denominator.<br />
                    <strong>Intervention:</strong> The AI Nigerian teacher reintroduced the concrete 4-slice Agege bread demonstration, walked through guided practice, and verified understanding with a 95% re-test score.
                  </p>
                </div>
              </div>

              {/* Recommended Parent Support */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-3">
                <h4 className="text-sm font-black text-slate-900 uppercase font-display border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>Recommended Support at Home</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  • Practice counting change with Naira notes during market or grocery purchases.<br />
                  • Encourage {activeStudent.name} to explain today's science topic ("Changes in Nature") back to you during dinner for reinforced long-term recall.
                </p>
              </div>
            </div>
          </div>

          {/* Topics Mastered vs Topics Developing Breakdown */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase font-display border-b border-slate-100 pb-2">
              Topic Mastery Status & Recent Assessments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mastered Topics */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#026838] uppercase">
                  <span>Topics Mastered (85%+)</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px]">Ready to Advance</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-700">
                  <li className="flex items-center justify-between font-medium">
                    <span>• Place Value up to 100,000 (Maths)</span>
                    <span className="font-bold text-[#026838]">Strong Mastery (95%)</span>
                  </li>
                  <li className="flex items-center justify-between font-medium">
                    <span>• Proper & Improper Fractions (Maths)</span>
                    <span className="font-bold text-[#026838]">Mastered (85%)</span>
                  </li>
                  <li className="flex items-center justify-between font-medium">
                    <span>• Living & Non-Living Things (Science)</span>
                    <span className="font-bold text-[#026838]">Strong Mastery (96%)</span>
                  </li>
                </ul>
              </div>

              {/* Developing / Approaching Mastery Topics */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-amber-900 uppercase">
                  <span>Topics Developing / Approaching Mastery</span>
                  <span className="bg-amber-100 px-2 py-0.5 rounded text-[10px]">Guided Practice</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-700">
                  <li className="flex items-center justify-between font-medium">
                    <span>• Measurement of Capacity in Litres (Maths)</span>
                    <span className="font-bold text-blue-700">Approaching Mastery (78%)</span>
                  </li>
                  <li className="flex items-center justify-between font-medium">
                    <span>• Collective Nouns in Context (English)</span>
                    <span className="font-bold text-amber-800">Developing (65%)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Subscription & Tuition */}
      {activeParentTab === 'tuition' && (
        <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Tuition & Paystack Payment Status
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Official receipts and active session access for {activeStudent.name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenTuitionPay(activeStudent.grade, activeStudent.currentTerm)}
              className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs"
            >
              Pay Tuition via Paystack
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tuition Rate</span>
              <span className="font-black text-slate-900 text-base">₦6,000 / Term</span>
              <span className="text-[10px] text-[#026838] font-bold block mt-0.5">₦15,000 Annual Pass</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Latest Receipt</span>
              <span className="font-mono font-bold text-slate-900">NERDC-TERM1-9842</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Channel</span>
              <span className="font-black text-[#026838]">Paystack Automated Checkout</span>
            </div>
          </div>

          {/* Parent Referral Bonus Program Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#026838] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#43A047]/30">
                <Sparkles className="w-3 h-3 text-[#026838]" />
                <span>Parent Referral Program • ₦1,000 Reward</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase font-display">
                Refer a Fellow Parent & You Both Get ₦1,000!
              </h4>
              <p className="text-xs text-slate-600 font-medium max-w-lg">
                When another Nigerian parent enters your referral code, they receive <strong>₦1,000 OFF</strong> their child’s tuition, and you earn <strong>₦1,000 credit</strong> directly in your Brightly Digital Wallet.
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-500">Your Shareable Referral Code</span>
              <div className="bg-white px-3.5 py-2 rounded-xl border-2 border-dashed border-[#026838] font-mono font-black text-[#026838] text-xs shadow-xs tracking-wider">
                BRIGHT-{activeStudent.name.toUpperCase()}-1000
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
