import React from 'react';
import { 
  GraduationCap, 
  BookMarked, 
  Sparkles, 
  CheckCircle, 
  BrainCircuit,
  Repeat,
  ArrowRight
} from 'lucide-react';

interface HowItWorksSectionProps {
  onStartLesson?: () => void;
  onExploreSubjects?: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = () => {
  const steps = [
    {
      step: 1,
      title: "Choose your child's class",
      description: "Select Primary 1 to Primary 6 aligned with their school class.",
      icon: <GraduationCap className="w-5 h-5 text-[#026838]" />,
      badge: "Step 1",
      badgeColor: "bg-emerald-50 text-[#026838] border-emerald-200",
      accentBg: "bg-emerald-500/10",
    },
    {
      step: 2,
      title: "Select a subject and topic",
      description: "Based on the Nigerian NERDC Curriculum term-by-term scheme of work.",
      icon: <BookMarked className="w-5 h-5 text-[#D97706]" />,
      badge: "Step 2",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      accentBg: "bg-amber-500/10",
    },
    {
      step: 3,
      title: "Learn with the AI Nigerian teacher",
      description: "Patient 30-minute lesson with relatable Nigerian examples and visual aids.",
      icon: <Sparkles className="w-5 h-5 text-[#026838]" />,
      badge: "Step 3",
      badgeColor: "bg-emerald-50 text-[#026838] border-emerald-200",
      accentBg: "bg-emerald-500/10",
    },
    {
      step: 4,
      title: "Practise and participate",
      description: "Interactive questions, active voice/chat responses and guided activities.",
      icon: <CheckCircle className="w-5 h-5 text-[#1E88E5]" />,
      badge: "Step 4",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      accentBg: "bg-blue-500/10",
    },
    {
      step: 5,
      title: "Check understanding",
      description: "Targeted mastery checks determine whether the pupil has understood the concept.",
      icon: <BrainCircuit className="w-5 h-5 text-[#D97706]" />,
      badge: "Step 5",
      badgeColor: "bg-amber-50 text-amber-900 border-amber-200",
      accentBg: "bg-amber-500/10",
    },
    {
      step: 6,
      title: "Receive additional explanation and practice when necessary",
      description: "Adaptive re-teaching loop breaks down weak areas until true mastery is achieved.",
      icon: <Repeat className="w-5 h-5 text-[#026838]" />,
      badge: "Step 6",
      badgeColor: "bg-emerald-50 text-[#026838] border-emerald-200",
      accentBg: "bg-emerald-500/10",
    },
  ];

  return (
    <section 
      id="how-brightly-home-lesson-works"
      className="w-full rounded-[28px] sm:rounded-[36px] bg-white border border-slate-200/90 p-5 sm:p-7 md:p-8 shadow-xs space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#026838] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            🌱
          </div>
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 uppercase font-display tracking-tight">
              HOW BRIGHTLY HOME LESSON WORKS
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              A structured, patient 6-step mastery journey based on the Nigerian NERDC curriculum
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-black uppercase text-[#026838] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            6 Structured Steps
          </span>
        </div>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {steps.map((st) => (
          <div
            key={st.step}
            className="rounded-2xl bg-gradient-to-b from-slate-50/80 to-white border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-200 group relative overflow-hidden"
          >
            {/* Step Top Bar: Number + Icon */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center font-black text-xs text-slate-900 group-hover:scale-105 transition-transform">
                  {st.step}
                </div>
                <div className={`p-2 rounded-xl ${st.accentBg} transition-transform group-hover:rotate-6`}>
                  {st.icon}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${st.badgeColor}`}>
                  {st.badge}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase font-display leading-snug tracking-tight">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {st.description}
                </p>
              </div>
            </div>

            {/* Bottom Step Indicator line */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Step {st.step} of 6</span>
              {st.step < 6 ? (
                <ArrowRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
              ) : (
                <span className="text-[#026838] font-black">✓ Mastery</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
