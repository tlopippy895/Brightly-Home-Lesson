import React from 'react';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  Calendar,
  Layers,
  BookOpen,
  HelpCircle,
  Clock
} from 'lucide-react';
import { StudentProfile } from '../types';

interface ProgressAnalyticsViewProps {
  student: StudentProfile;
  onOpenParentDigest: () => void;
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
  student,
  onOpenParentDigest,
}) => {
  const subjectBreakdown = [
    { subject: 'Mathematics', mastery: 94, totalLessons: 12, completed: 10, status: 'Mastered', color: 'bg-[#006738]' },
    { subject: 'English Language', mastery: 90, totalLessons: 12, completed: 9, status: 'Mastered', color: 'bg-[#D97706]' },
    { subject: 'Basic Science & Tech', mastery: 95, totalLessons: 12, completed: 11, status: 'Mastered', color: 'bg-[#008751]' },
    { subject: 'Social Studies', mastery: 85, totalLessons: 12, completed: 8, status: 'On Track', color: 'bg-[#F59E0B]' },
    { subject: 'Civic Education', mastery: 88, totalLessons: 12, completed: 9, status: 'Mastered', color: 'bg-[#026838]' },
  ];

  const recentAssessments = [
    {
      id: 'a1',
      title: 'Mathematics: Proper Fractions & Agege Bread Sharing',
      score: 90,
      date: 'Yesterday, 3:15 PM',
      aiReexplained: true,
      analogyUsed: 'Sharing 4 Agege bread loaves among 2 siblings'
    },
    {
      id: 'a2',
      title: 'Basic Science: Living Things & MR NIGER D Characteristics',
      score: 95,
      date: '3 days ago',
      aiReexplained: false,
      analogyUsed: 'Nigerian Agama lizard & Mango tree observation'
    },
    {
      id: 'a3',
      title: 'Social Studies: Nigerian Geopolitical Zones & Capital Cities',
      score: 88,
      date: '5 days ago',
      aiReexplained: false,
      analogyUsed: 'Trip from Lagos to Abuja via Lokoja confluence'
    }
  ];

  return (
    <div id="progress-analytics-view" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#026838] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Mastery Report
            </span>
            <span className="text-xs font-bold text-gray-500">
              Primary {student.grade} • Term {student.currentTerm}
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#026838] tracking-tight font-display uppercase mt-2">
            {student.name}’s Learning Mastery & Progress
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            Continuous diagnostic tracking under the Nigerian NERDC standard
          </p>
        </div>

        <button
          onClick={onOpenParentDigest}
          className="px-6 py-3 rounded-2xl bg-[#43A047] hover:bg-[#388E3C] text-white text-xs font-black shadow-[0_4px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 uppercase tracking-wider"
        >
          <span>📊 View Parent Summary</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
          <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Cumulative Mastery</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#43A047] font-display">88%</span>
            <span className="text-[#43A047] font-black text-xs">↗ +5% from Term 1</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">Teach for Mastery Before Speed</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
          <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Weekly Pace</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#1E88E5] font-display">3 / 5</span>
            <span className="text-xs font-bold text-gray-500">Lessons Completed</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">60% of Weekly NERDC Schedule</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm">
          <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Adaptive Interventions</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#D97706] font-display">4</span>
            <span className="text-xs font-bold text-gray-500">Topics Re-explained</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">100% Retest Mastery Success</p>
        </div>
      </div>

      {/* Subject Mastery Progress Bars */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-[#026838] uppercase font-display">
          Subject-by-Subject Mastery (NERDC Standard)
        </h3>

        <div className="space-y-4">
          {subjectBreakdown.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-900 font-black uppercase">{item.subject}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">
                    {item.completed}/{item.totalLessons} Lessons Done
                  </span>
                  <span className="font-black text-gray-900 text-sm">{item.mastery}%</span>
                </div>
              </div>
              <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className={`h-full ${item.color} rounded-full transition-all duration-700`}
                  style={{ width: `${item.mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Diagnostic Assessments & Re-Explanation Log */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-black text-[#026838] uppercase font-display">
            Recent Assessment History & Mastery Analogies
          </h3>
          <span className="text-xs font-bold text-gray-400">Untimed Evaluations</span>
        </div>

        <div className="space-y-3">
          {recentAssessments.map((rec) => (
            <div key={rec.id} className="p-4 md:p-5 rounded-2xl bg-[#F0F9FF] border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-gray-900 uppercase">
                    {rec.title}
                  </h4>
                  {rec.aiReexplained && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[#FEFCE8] text-[#D97706] px-2.5 py-0.5 rounded-full border border-[#FBC02D]/40">
                      <Sparkles className="w-3 h-3" />
                      Adaptive Re-explained
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 font-medium">
                  Concrete Analogy: <span className="text-[#026838] italic font-bold">"{rec.analogyUsed}"</span>
                </p>
                <span className="text-[10px] text-gray-400 block">{rec.date}</span>
              </div>

              <div className="flex items-center gap-3 sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Score</span>
                  <span className="text-lg font-black text-[#43A047]">{rec.score}%</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#FEFCE8] border border-[#FBC02D] text-[#D97706] flex items-center justify-center font-black text-sm shadow-sm">
                  ⭐
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
