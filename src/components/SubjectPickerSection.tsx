import React from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Calculator, 
  Globe, 
  FlaskConical, 
  Award, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { SubjectName, GradeLevel, StudentProfile, LessonTopic } from '../types';

interface SubjectInfo {
  name: SubjectName;
  displayName: string;
  icon: string;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  summary: string;
  topicsSample: string[];
}

const ALL_SUBJECTS: SubjectInfo[] = [
  {
    name: 'Mathematics',
    displayName: 'Mathematics',
    icon: '📐',
    badgeColor: 'bg-emerald-100 text-[#026838] border-emerald-300',
    borderColor: 'border-emerald-200 hover:border-[#026838]',
    bgColor: 'bg-gradient-to-br from-emerald-50/50 to-white',
    textColor: 'text-[#026838]',
    summary: 'Numbers, Place Value, Fractions, Word Problems & Naira Currency',
    topicsSample: ['Whole Numbers & Place Value', 'Fractions & Food Sharing', 'Addition & Multiplication in Naira'],
  },
  {
    name: 'English Studies',
    displayName: 'English Studies',
    icon: '📚',
    badgeColor: 'bg-amber-100 text-[#D97706] border-amber-300',
    borderColor: 'border-amber-200 hover:border-[#D97706]',
    bgColor: 'bg-gradient-to-br from-amber-50/40 to-white',
    textColor: 'text-[#D97706]',
    summary: 'Reading Comprehension, Phonics, Grammar, Tenses & Letter Writing',
    topicsSample: ['Phonics & Pronunciation', 'Parts of Speech & Tenses', 'Reading African Folk Stories'],
  },
  {
    name: 'Basic Science & Technology',
    displayName: 'Basic Science & Tech',
    icon: '🔬',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    borderColor: 'border-amber-200 hover:border-amber-500',
    bgColor: 'bg-gradient-to-br from-amber-50/50 to-white',
    textColor: 'text-amber-800',
    summary: 'Living Things, Solar System, Simple Machines, Energy & Computer Skills',
    topicsSample: ['Classification of Living Things', 'Water Purification & Health', 'Intro to Computer Keyboard & Mouse'],
  },
  {
    name: 'Social Studies',
    displayName: 'Social Studies',
    icon: '🌍',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderColor: 'border-indigo-200 hover:border-indigo-500',
    bgColor: 'bg-gradient-to-br from-indigo-50/50 to-white',
    textColor: 'text-indigo-800',
    summary: 'Nigerian Geography, 6 Geopolitical Zones, Rivers & Cultural Heritage',
    topicsSample: ['6 Geopolitical Zones & River Confluence', 'Nigerian Cultural Festivals', 'Family Structures & Good Neighborliness'],
  },
  {
    name: 'Civic Education',
    displayName: 'Civic Education',
    icon: '⚖️',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    borderColor: 'border-teal-200 hover:border-teal-500',
    bgColor: 'bg-gradient-to-br from-teal-50/50 to-white',
    textColor: 'text-teal-800',
    summary: 'Rights & Duties of Nigerian Citizens, National Symbols & Leadership',
    topicsSample: ['The Nigerian Flag, Coat of Arms & Anthem', 'Duties of a Child at Home & School', 'Peaceful Coexistence & Patriotism'],
  },
  {
    name: 'Agricultural Science',
    displayName: 'Agricultural Science',
    icon: '🌾',
    badgeColor: 'bg-lime-100 text-lime-900 border-lime-300',
    borderColor: 'border-lime-200 hover:border-lime-600',
    bgColor: 'bg-gradient-to-br from-lime-50/50 to-white',
    textColor: 'text-lime-800',
    summary: 'Nigerian Food Crops, Farm Animals, Soil Types & Cash Crops',
    topicsSample: ['Tubers (Yam, Cassava) & Cereals (Maize)', 'Farm Tools & Safety', 'Domestic Animals (Goats, Poultry, Cattle)'],
  },
];

interface SubjectPickerSectionProps {
  student: StudentProfile;
  allLessons: LessonTopic[];
  onPickSubjectForTeaching: (subject: SubjectName) => void;
  onStartSpecificLesson?: (lesson: LessonTopic) => void;
}

export const SubjectPickerSection: React.FC<SubjectPickerSectionProps> = ({
  student,
  allLessons,
  onPickSubjectForTeaching,
  onStartSpecificLesson,
}) => {
  return (
    <section id="curriculum-subjects-for-teachings" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#026838] text-[#FBC02D] flex items-center justify-center font-black text-sm shadow-xs">
            📚
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase font-display tracking-tight flex items-center gap-2">
              <span>Subjects for Teachings</span>
              <span className="text-[10px] bg-emerald-100 text-[#026838] border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase">
                Primary {student.grade} Curriculum
              </span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Click any subject below for your pupil to pick interactive teachings and lessons
            </p>
          </div>
        </div>

        <button
          onClick={() => onPickSubjectForTeaching('Mathematics')}
          className="text-xs font-black text-[#026838] hover:text-[#014d28] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>View All Lesson Modules</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_SUBJECTS.map((sub) => {
          // Find lessons matching this subject and student's grade
          const matchingLessons = allLessons.filter(
            (l) => l.subject === sub.name && l.grade === student.grade
          );
          const nextLesson = matchingLessons[0] || allLessons.find((l) => l.subject === sub.name);

          return (
            <div
              key={sub.name}
              id={`subject-card-${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className={`rounded-2xl p-4 sm:p-5 border-2 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md group ${sub.bgColor} ${sub.borderColor}`}
            >
              <div className="space-y-2.5">
                {/* Header row: Icon & Tag */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    {sub.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${sub.badgeColor}`}>
                    Pri {student.grade} • Term {student.currentTerm}
                  </span>
                </div>

                {/* Subject Title & Summary */}
                <div>
                  <h3 className={`text-base font-black uppercase font-display tracking-tight ${sub.textColor}`}>
                    {sub.displayName}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {sub.summary}
                  </p>
                </div>

                {/* Sample Topics Pill List */}
                <div className="pt-1 space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    Core Teaching Topics:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sub.topicsSample.slice(0, 2).map((tp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white/90 text-gray-700 font-bold px-2 py-0.5 rounded-md border border-gray-200/80 truncate max-w-full"
                      >
                        • {tp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button: Pick for Teaching */}
              <div className="pt-4 mt-2 border-t border-gray-200/60">
                <button
                  id={`btn-pick-subject-${sub.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => {
                    if (nextLesson && onStartSpecificLesson) {
                      onStartSpecificLesson(nextLesson);
                    } else {
                      onPickSubjectForTeaching(sub.name);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-[#026838] hover:bg-[#014d28] active:bg-[#01381d] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer group-hover:bg-[#FBC02D] group-hover:text-gray-900 group-hover:border group-hover:border-amber-400"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Pick for Teaching</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
