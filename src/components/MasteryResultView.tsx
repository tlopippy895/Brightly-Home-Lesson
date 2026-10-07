import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { LessonTopic, StudentProfile, TeacherPersona } from '../types';
import { getTeacherForLesson } from '../data/teachers';

interface MasteryResultViewProps {
  lesson: LessonTopic;
  student: StudentProfile;
  score: number;
  reexplained?: boolean;
  objectivesMastery?: { objective: string; mastered: boolean }[];
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
  objectivesMastery,
  teacher: propTeacher,
  onContinueToNextLesson,
  onRetakePractice,
  onViewParentReport,
  onExploreCurriculum,
}) => {
  // Automatically pull the correct teacher assigned specifically to this lesson's subject
  const teacher = getTeacherForLesson(lesson) || propTeacher;

  // Determine progress status based on actual demonstrated understanding
  const isStrongMastery = score >= 90 && !reexplained;
  const isMasteredWithSupport = reexplained;
  const isDeveloping = score < 70 && !reexplained;

  const progressStatusLabel = isStrongMastery
    ? 'Strong Mastery Demonstrated'
    : isMasteredWithSupport
    ? 'Mastery Achieved with Guided Re-Teaching'
    : isDeveloping
    ? 'Learning in Progress • Practising to Mastery'
    : 'Mastery Demonstrated';

  // Mastered concepts from the authentic curriculum record
  const masteredConcepts = lesson.assessmentQuestions
    .slice(0, 3)
    .map(q => q.contextNigerian || q.question);

  const practiceNotes = reexplained 
    ? [`${lesson.topic}: Practise with concrete objects around your home or compound.`]
    : score < 100 
      ? ['A little more practice with word problems will help it stick completely.']
      : ['Keep up the excellent habit of daily 30-minute practice!'];

  return (
    <div id="mastery-result-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Top Banner / Encouraging Header */}
      <div className={`p-6 sm:p-8 rounded-[32px] border-2 shadow-sm relative overflow-hidden text-center space-y-4 ${
        !isDeveloping 
          ? 'bg-gradient-to-b from-[#F0FDF4] via-white to-[#DCFCE7]/40 border-emerald-300' 
          : 'bg-gradient-to-b from-[#FEFCE8] via-white to-[#FEF3C7]/40 border-amber-300'
      }`}>
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 ${
            !isDeveloping ? 'bg-[#026838] text-white border-emerald-400' : 'bg-[#D97706] text-white border-amber-400'
          }`}>
            {!isDeveloping ? '🏆' : '🌱'}
          </div>
        </div>

        <div className="space-y-1">
          <span className={`text-[11px] font-black uppercase px-3.5 py-1 rounded-full border ${
            !isDeveloping 
              ? 'bg-emerald-100 text-[#026838] border-emerald-300' 
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            {progressStatusLabel}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 uppercase font-display tracking-tight">
            Well Done, {student.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto">
            {lesson.subject} • Primary {lesson.grade}, Term {lesson.term}, Week {lesson.week}: <strong className="text-slate-900">{lesson.topic}</strong>
          </p>
        </div>

        {/* Child-Friendly Result Summary Box */}
        <div className="max-w-xl mx-auto bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-left space-y-2">
          <div className="text-xs font-black uppercase tracking-wider text-[#026838] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#026838]" />
            <span>TODAY'S LESSON</span>
          </div>

          <div className="text-xs text-slate-700 space-y-1 font-medium">
            <div>
              <strong className="text-slate-900">Topic:</strong> {lesson.topic}
            </div>
            <div>
              <strong className="text-slate-900">What you learned:</strong> {lesson.objectives.slice(0, 2).join('; ')}
            </div>
            <div>
              <strong className="text-slate-900">Your progress:</strong>{' '}
              <span className="font-bold text-[#026838]">
                {progressStatusLabel} ({score}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Results: Mastered Concepts & Practice Encouragement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: What You Learned & Mastered */}
        <div className="rounded-[28px] bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#026838] flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Concepts Mastered Today
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Ideas you understood and practised during class
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
                  Understood core explanation and practical Nigerian examples.
                </span>
              </div>
            </div>

            {/* Objective-Level Mastery Items */}
            {((objectivesMastery && objectivesMastery.length > 0) ? objectivesMastery : (lesson.objectives || []).map(obj => ({ objective: obj, mastered: true }))).map((item, idx) => {
              const itemLevel = (item as any).masteryLevel || (item.mastered ? 'Mastered' : 'Developing');
              const isMastered = itemLevel === 'Mastered';
              const isDeveloping = itemLevel === 'Developing';

              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isMastered ? 'text-emerald-600' : isDeveloping ? 'text-amber-500' : 'text-rose-500'}`} />
                    <span className="text-xs text-slate-700 font-bold leading-relaxed">
                      {item.objective}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shrink-0 border ${
                    isMastered 
                      ? 'bg-emerald-100 text-[#026838] border-emerald-300' 
                      : isDeveloping 
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {isMastered ? '✓ Mastered' : isDeveloping ? '🌱 Developing' : 'Beginning'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Encouraging Practice / Re-teaching Summary */}
        <div className="rounded-[28px] bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-black">
              💡
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                What to Practise Next
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Encouraging steps for daily mastery
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
                  Your teacher walked you through a simplified real-life Nigerian example to strengthen your confidence.
                </p>
              </div>
            ) : isDeveloping ? (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-slate-700 font-medium">
                You're still learning this part. A little more practice with your parent will help it click completely!
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-slate-700 font-medium">
                🌟 Outstanding work! You answered with confidence and solved the exercises accurately.
              </div>
            )}

            {practiceNotes.map((item, idx) => (
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

      {/* Teacher's Recommendation */}
      <div className="bg-[#FEFCE8] border-2 border-[#FBC02D] p-5 sm:p-6 rounded-[28px] space-y-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-black flex items-center justify-center font-black shadow-2xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase font-display">
              {teacher?.name || 'Mrs. Chidinma Okafor'}’s Note to Parent
            </h3>
            <span className="text-[11px] text-amber-900 font-bold uppercase">
              Guidance for Home Practice
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          "Praise {student.name} for the focused 30-minute effort today! Consistent 30-minute daily mastery builds lifelong academic confidence. Ask them to point out examples of {lesson.topic} at home this weekend."
        </p>
      </div>

      {/* Action Navigation Footer with Child-Friendly Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onRetakePractice}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
          <span>[ PRACTICE AGAIN ]</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onViewParentReport}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>[ VIEW PARENT REPORT ]</span>
          </button>

          <button
            type="button"
            onClick={onContinueToNextLesson}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md min-h-[48px]"
          >
            <span>[ CONTINUE ]</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
