import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  UserCheck, 
  ShieldCheck,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { LessonTopic, StudentProfile, TeacherPersona } from '../types';
import { getTeacherForLesson } from '../data/teachers';

interface MasteryResultViewProps {
  lesson: LessonTopic;
  student: StudentProfile;
  score: number;
  reexplained?: boolean;
  teacher?: TeacherPersona;
  onContinueToNextLesson: () => void;
  onRetakePractice: () => void;
  onViewParentReport: () => void;
  onExploreCurriculum: () => void;
}

export const MasteryResultView: React.FC<MasteryResultViewProps> = ({
  lesson,
  student,
  score,
  reexplained = false,
  teacher: propTeacher,
  onContinueToNextLesson,
  onRetakePractice,
  onViewParentReport,
  onExploreCurriculum,
}) => {
  // Automatically pull the correct teacher assigned specifically to this lesson's subject
  const teacher = getTeacherForLesson(lesson) || propTeacher;
  const isMastered = score >= 70;

  // Derive mastered topics and concepts from the lesson questions
  const masteredConcepts = lesson.assessmentQuestions
    .slice(0, 3)
    .map(q => q.contextNigerian || q.question);

  const conceptsNeedingPractice = reexplained 
    ? [`${lesson.topic}: Practice additional concrete examples with real-life objects`]
    : score < 100 
      ? ['Review word problem translations and double-check final calculations']
      : [];

  return (
    <div id="mastery-result-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Top Banner / Celebration Header */}
      <div className={`p-6 sm:p-8 rounded-[32px] border-2 shadow-sm relative overflow-hidden text-center space-y-4 ${
        isMastered 
          ? 'bg-gradient-to-b from-[#F0FDF4] via-white to-[#DCFCE7]/40 border-emerald-300' 
          : 'bg-gradient-to-b from-[#FEFCE8] via-white to-[#FEF3C7]/40 border-amber-300'
      }`}>
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 ${
            isMastered ? 'bg-[#026838] text-white border-emerald-400' : 'bg-[#D97706] text-white border-amber-400'
          }`}>
            {isMastered ? '🏆' : '🌱'}
          </div>
        </div>

        <div className="space-y-1">
          <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border ${
            isMastered 
              ? 'bg-emerald-100 text-[#026838] border-emerald-300' 
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            {isMastered ? 'Mastery Achieved' : 'Learning in Progress • Mastery Before Moving On'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">
            {student.name}’s Lesson Mastery Result
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
            {lesson.subject} • Primary {lesson.grade}, Term {lesson.term}, Week {lesson.week}: <strong className="text-slate-900">{lesson.topic}</strong>
          </p>
        </div>

        {/* Score & Performance Meter */}
        <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Diagnostic Score</span>
            <span className={`text-3xl font-black font-display ${isMastered ? 'text-[#026838]' : 'text-[#D97706]'}`}>
              {score}%
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Mastery Evaluation</span>
            <span className="text-xs font-black text-slate-800 uppercase">
              {isMastered ? 'Ready for Next Concept' : 'Supported by Adaptive Tutor'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Results: Mastered Topics vs Topics Needing More Practice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Mastered Topics & Competencies */}
        <div className="rounded-[28px] bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#026838] flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Mastered Topics & Concepts
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Competencies successfully demonstrated in today's lesson
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#026838] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black text-slate-900 block uppercase">
                  {lesson.topic}
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  Understood core explanation and whiteboard principles.
                </span>
              </div>
            </div>

            {masteredConcepts.map((concept, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 font-bold leading-relaxed">
                  {concept}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Topics Needing More Practice & Re-teaching Record */}
        <div className="rounded-[28px] bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-black">
              🔍
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Topics Needing More Practice
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Target areas for gentle home reinforcement
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {reexplained ? (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase">
                  <BrainCircuit className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Adaptive Tutor Re-Explanation Completed</span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  The AI teacher stepped in during Phase 5 with everyday Nigerian real-life analogies to clarify this concept before proceeding.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-slate-700 font-medium">
                🌟 Outstanding work! {student.name} answered diagnostic questions with high accuracy and confidence.
              </div>
            )}

            {conceptsNeedingPractice.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                <span className="text-xs text-slate-700 font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher Recommendations Card */}
      <div className="bg-[#FEFCE8] border-2 border-[#FBC02D] p-5 sm:p-6 rounded-[28px] space-y-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-black flex items-center justify-center font-black shadow-2xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase font-display">
              Master Teacher's Home Recommendation
            </h3>
            <span className="text-[11px] text-amber-900 font-bold uppercase">
              {teacher?.name || 'Mrs. Chidinma Okafor'} • Guidance for Parent
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          "Praise {student.name} for the focused 30-minute effort today! Encourage them to mention one thing they learned during dinner or weekend chores. Consistent 30-minute daily mastery builds lifelong academic confidence."
        </p>
      </div>

      {/* Action Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onRetakePractice}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
          <span>Practice Lesson Again</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onViewParentReport}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>View Parent Report Card</span>
          </button>

          <button
            type="button"
            onClick={onContinueToNextLesson}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <span>Proceed to Next Lesson</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
