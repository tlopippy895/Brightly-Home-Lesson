import React from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  Calculator, 
  FlaskConical, 
  Globe, 
  Scale, 
  Sprout, 
  UserCheck, 
  Sparkles,
  PlayCircle,
  GraduationCap
} from 'lucide-react';
import { SubjectName, GradeLevel, StudentProfile, LessonTopic, TeacherPersona } from '../types';
import { NIGERIAN_TEACHERS, getTeacherForGrade } from '../data/teachers';

interface SubjectSelectionViewProps {
  activeStudent: StudentProfile;
  allLessons: LessonTopic[];
  onSelectSubject: (subject: SubjectName) => void;
  onStartLesson: (lesson: LessonTopic) => void;
  onExploreClassSelection: () => void;
}

interface SubjectCardData {
  name: SubjectName;
  displayName: string;
  iconEmoji: string;
  nerdcTheme: string;
  description: string;
  accentBg: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
  topicsSample: string[];
}

const NIGERIAN_SUBJECTS: SubjectCardData[] = [
  {
    name: 'Mathematics',
    displayName: 'Mathematics',
    iconEmoji: '📐',
    nerdcTheme: 'Universal Basic Numeracy',
    description: 'Numbers, fractions, whole values, multiplication, measurements, money in Naira, word problems, and real-life everyday calculations.',
    accentBg: 'from-emerald-50/50 to-white',
    badgeColor: 'bg-emerald-100 text-[#026838] border-emerald-300',
    borderColor: 'border-emerald-200 hover:border-[#026838]',
    textColor: 'text-[#026838]',
    topicsSample: ['Whole Numbers & Place Value', 'Proper & Improper Fractions', 'Addition & Multiplication in Naira', 'Perimeter & Area of Real Objects'],
  },
  {
    name: 'English Studies',
    displayName: 'English Studies',
    iconEmoji: '📚',
    nerdcTheme: 'Literacy, Grammar & Phonics',
    description: 'Reading comprehension, phonemic awareness, parts of speech, tenses, vocabulary development, and expressive narrative writing.',
    accentBg: 'from-amber-50/50 to-white',
    badgeColor: 'bg-amber-100 text-[#D97706] border-amber-300',
    borderColor: 'border-amber-200 hover:border-[#D97706]',
    textColor: 'text-[#D97706]',
    topicsSample: ['Phonics & Pronunciation Rules', 'Nouns, Pronouns & Verbs in Context', 'African Folk Story Comprehension', 'Formal & Informal Letter Formats'],
  },
  {
    name: 'Basic Science & Technology',
    displayName: 'Basic Science & Tech',
    iconEmoji: '🔬',
    nerdcTheme: 'Scientific Inquiry & Digital Literacy',
    description: 'Living and non-living things, MR NIGER D characteristics, the solar system, simple machines, water purification, and computer fundamentals.',
    accentBg: 'from-teal-50/50 to-white',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    borderColor: 'border-teal-200 hover:border-teal-600',
    textColor: 'text-teal-800',
    topicsSample: ['Living Things & MR NIGER D Rules', 'Water Purification & Safe Drinking', 'Simple Machines in the Home', 'Intro to Computer Keyboard & Mouse'],
  },
  {
    name: 'Social Studies',
    displayName: 'Social Studies',
    iconEmoji: '🌍',
    nerdcTheme: 'Environment, Society & Geography',
    description: 'Nigerian geography, the 6 geopolitical zones, river confluences, climate regions, cultural festivals, and community values.',
    accentBg: 'from-indigo-50/50 to-white',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderColor: 'border-indigo-200 hover:border-indigo-600',
    textColor: 'text-indigo-800',
    topicsSample: ['6 Geopolitical Zones of Nigeria', 'Confluence of Rivers Niger & Benue', 'Nigerian Cultural Festivals & Heritage', 'Family Structure & Peaceful Coexistence'],
  },
  {
    name: 'Civic Education',
    displayName: 'Civic Education',
    iconEmoji: '⚖️',
    nerdcTheme: 'Citizenship, Rights & National Unity',
    description: 'Duties of Nigerian citizens, national symbols, respect for the national flag and anthem, good governance, and democratic participation.',
    accentBg: 'from-blue-50/50 to-white',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    borderColor: 'border-blue-200 hover:border-blue-600',
    textColor: 'text-blue-800',
    topicsSample: ['National Symbols: Flag, Coat of Arms', 'Rights & Responsibilities of a Child', 'Honesty & Community Leadership', 'Traffic Rules & National Unity'],
  },
  {
    name: 'Agricultural Science',
    displayName: 'Agricultural Science',
    iconEmoji: '🌾',
    nerdcTheme: 'Food Production, Crops & Livestock',
    description: 'Nigerian food crops (yam, cassava, maize), farm tools and safety, domestic animals, soil classification, and practical gardening.',
    accentBg: 'from-lime-50/50 to-white',
    badgeColor: 'bg-lime-100 text-lime-900 border-lime-300',
    borderColor: 'border-lime-200 hover:border-lime-600',
    textColor: 'text-lime-800',
    topicsSample: ['Tubers, Cereals & Legumes in Nigeria', 'Safe Handling of Farm Tools', 'Care of Domestic Farm Animals', 'Soil Types & Simple Composting'],
  },
];

export const SubjectSelectionView: React.FC<SubjectSelectionViewProps> = ({
  activeStudent,
  allLessons,
  onSelectSubject,
  onStartLesson,
  onExploreClassSelection,
}) => {
  return (
    <div id="subject-selection-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-[11px] font-black uppercase text-[#026838]">
            <span>📚 NIGERIAN CURRICULUM SUBJECTS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>PRIMARY {activeStudent.grade}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#026838] uppercase font-display tracking-tight">
            Select a Subject
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
            Choose a subject to explore weekly topics, whiteboard instructions, teaching aids, and practice questions for Primary {activeStudent.grade}.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreClassSelection}
          className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 shrink-0 flex items-center gap-2.5 transition-all cursor-pointer"
        >
          <GraduationCap className="w-5 h-5 text-[#026838]" />
          <div className="text-left">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Class</span>
            <span className="text-xs font-black text-slate-900">Primary {activeStudent.grade} (Change Class)</span>
          </div>
        </button>
      </div>

      {/* Grid of 6 Subjects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {NIGERIAN_SUBJECTS.map((sub) => {
          // Find matching teacher
          const teacher = getTeacherForGrade(activeStudent.grade);
          // Find lessons matching this subject and current grade
          const matchingLessons = allLessons.filter(l => l.subject === sub.name && l.grade === activeStudent.grade);
          const nextLesson = matchingLessons[0] || allLessons.find(l => l.subject === sub.name);

          return (
            <div
              key={sub.name}
              id={`subject-card-${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className={`rounded-[28px] p-5 sm:p-6 border-2 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md bg-gradient-to-b ${sub.accentBg} ${sub.borderColor} group`}
            >
              <div className="space-y-3">
                {/* Header Row: Visual Icon & Tag */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    {sub.iconEmoji}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${sub.badgeColor}`}>
                    Pri {activeStudent.grade} • 3 Terms
                  </span>
                </div>

                {/* Subject Title & Theme */}
                <div>
                  <h3 className={`text-lg font-black uppercase font-display tracking-tight leading-tight ${sub.textColor}`}>
                    {sub.displayName}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    {sub.nerdcTheme}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {sub.description}
                </p>

                {/* Assigned Dedicated Class Teacher */}
                <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-300 shrink-0 bg-white">
                    {teacher.imageUrl ? (
                      <img src={teacher.imageUrl} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">{teacher.avatarEmoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black text-slate-900 truncate block uppercase">
                      {teacher.name}
                    </span>
                    <span className="text-[9px] text-[#026838] font-bold block truncate">
                      {teacher.classTitle} (Primary {activeStudent.grade})
                    </span>
                  </div>
                </div>

                {/* Sample Topics */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Key Topics:
                  </span>
                  <div className="flex flex-col gap-1">
                    {sub.topicsSample.slice(0, 3).map((tp, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#026838] shrink-0" />
                        <span className="truncate">{tp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectSubject(sub.name)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                  <span>View All Topics</span>
                </button>

                {nextLesson && (
                  <button
                    type="button"
                    onClick={() => onStartLesson(nextLesson)}
                    className="p-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-black text-xs uppercase flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title={`Start 30-min lesson: ${nextLesson.topic}`}
                  >
                    <PlayCircle className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
