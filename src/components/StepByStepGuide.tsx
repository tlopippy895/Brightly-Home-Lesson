import React from 'react';
import { 
  CheckCircle2, 
  PlayCircle, 
  ArrowRight, 
  UserCheck, 
  BookOpen, 
  Award, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StudentProfile, LessonTopic, TeacherPersona } from '../types';

interface StepByStepGuideProps {
  student: StudentProfile;
  currentLesson: LessonTopic;
  teacher?: TeacherPersona;
  onStartLesson: (lesson?: LessonTopic) => void;
  onOpenLessons: () => void;
  onOpenProgress: () => void;
  onOpenParentPortal?: () => void;
}

export const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  student,
  currentLesson,
  teacher,
  onStartLesson,
  onOpenLessons,
  onOpenProgress,
  onOpenParentPortal,
}) => {
  const steps = [
    {
      stepNumber: 1,
      title: 'Pick Today\'s Lesson',
      statusText: `Ready: ${currentLesson.topic}`,
      subtitle: `${currentLesson.subject} • Primary ${currentLesson.grade} • Week ${currentLesson.week}`,
      actionLabel: 'Start 30-Min Lesson',
      badge: 'Step 1',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: '📖',
      onClick: () => onStartLesson(currentLesson),
      buttonStyle: 'bg-[#026838] hover:bg-[#014d28] text-white',
      isPrimary: true,
    },
    {
      stepNumber: 2,
      title: 'Learn with Master Teacher',
      statusText: `${teacher?.name || 'Mrs. Chidinma Okafor'}`,
      subtitle: '6-Phase NERDC sequence: Whiteboard, Practice & Retest',
      actionLabel: 'Explore Curriculum',
      badge: 'Step 2',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: '👩🏾‍🏫',
      onClick: onOpenLessons,
      buttonStyle: 'bg-[#FBC02D] hover:bg-[#f59e0b] text-gray-900 border border-amber-400',
      isPrimary: false,
    },
    {
      stepNumber: 3,
      title: 'Track Mastery & Badges',
      statusText: `${student.overallScore}% Overall Score`,
      subtitle: `${student.lessonsCompletedThisWeek}/${student.totalLessonsThisWeek} lessons done this week`,
      actionLabel: 'View Report Card',
      badge: 'Step 3',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '🏆',
      onClick: onOpenProgress,
      buttonStyle: 'bg-[#1E88E5] hover:bg-[#1565C0] text-white',
      isPrimary: false,
    },
  ];

  return (
    <section 
      id="step-by-step-guide" 
      className="bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/80 rounded-[28px] p-5 sm:p-6 border-2 border-[#026838]/20 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#026838] text-white flex items-center justify-center font-black text-sm shadow-xs">
            1-2-3
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#026838] uppercase font-display tracking-tight flex items-center gap-2">
              <span>Today's Learning Roadmap</span>
              <span className="text-xs bg-[#FBC02D] text-gray-900 font-bold px-2 py-0.5 rounded-full lowercase tracking-normal">
                easy step-by-step
              </span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Follow these simple 3 steps to finish today's work with ease
            </p>
          </div>
        </div>

        {onOpenParentPortal && (
          <button
            onClick={onOpenParentPortal}
            className="text-xs font-black text-[#026838] hover:text-[#014d28] flex items-center gap-1 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#026838] transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#FBC02D]" />
            <span>Parent Governance</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {steps.map((st) => (
          <div
            key={st.stepNumber}
            className={`rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between border-2 bg-white relative overflow-hidden group ${
              st.isPrimary 
                ? 'border-[#026838] shadow-sm ring-1 ring-[#026838]/10' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${st.badgeColor}`}>
                  {st.badge}
                </span>
                <span className="text-xl">{st.icon}</span>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase font-display tracking-tight">
                  {st.title}
                </h3>
                <p className="text-xs font-bold text-[#026838] truncate mt-0.5">
                  {st.statusText}
                </p>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                  {st.subtitle}
                </p>
              </div>
            </div>

            <div className="pt-3">
              <button
                id={`step-action-btn-${st.stepNumber}`}
                onClick={st.onClick}
                className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs group-hover:shadow cursor-pointer ${st.buttonStyle}`}
              >
                <span>{st.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
