import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  Award,
  Sparkles
} from 'lucide-react';
import { GradeLevel, StudentProfile, LessonTopic } from '../types';
import { getTeacherForGrade } from '../data/teachers';

interface ClassSelectionViewProps {
  activeStudent: StudentProfile;
  students: StudentProfile[];
  allLessons: LessonTopic[];
  onSelectGrade: (grade: GradeLevel) => void;
  onExploreCurriculum: (grade: GradeLevel) => void;
  onSelectStudent?: (student: StudentProfile) => void;
}

interface ClassMeta {
  grade: GradeLevel;
  levelTitle: string;
  stageName: string;
  ageRange: string;
  badgeColor: string;
  accentBorder: string;
  accentBg: string;
  description: string;
  keyTopics: string[];
}

const NIGERIAN_CLASSES: ClassMeta[] = [
  {
    grade: 1,
    levelTitle: 'Primary 1',
    stageName: 'Lower Basic 1',
    ageRange: 'Ages 5–6',
    badgeColor: 'bg-emerald-100 text-[#026838] border-emerald-300',
    accentBorder: 'hover:border-emerald-500',
    accentBg: 'from-emerald-50/60 to-white',
    description: 'Foundational literacy, phonics, basic counting 1–99, domestic animals, and good hygiene.',
    keyTopics: ['Number Recognition 1–100', 'Letter Sounds & Phonics', 'My Family & School Community'],
  },
  {
    grade: 2,
    levelTitle: 'Primary 2',
    stageName: 'Lower Basic 2',
    ageRange: 'Ages 6–7',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    accentBorder: 'hover:border-teal-500',
    accentBg: 'from-teal-50/60 to-white',
    description: 'Simple addition with renaming, punctuation, living vs non-living things, and road safety.',
    keyTopics: ['Addition & Subtraction of 2-Digit Numbers', 'Sentences & Capital Letters', 'Care of Household Objects'],
  },
  {
    grade: 3,
    levelTitle: 'Primary 3',
    stageName: 'Lower Basic 3',
    ageRange: 'Ages 7–8',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    accentBorder: 'hover:border-amber-500',
    accentBg: 'from-amber-50/60 to-white',
    description: 'Multiplication tables, reading comprehension, states of matter, and Nigerian traditions.',
    keyTopics: ['Multiplication & Division Concepts', 'Paragraph Reading & Phonics', 'Soil Types & Local Crops'],
  },
  {
    grade: 4,
    levelTitle: 'Primary 4',
    stageName: 'Middle Basic 1',
    ageRange: 'Ages 8–9',
    badgeColor: 'bg-amber-100 text-[#D97706] border-amber-300',
    accentBorder: 'hover:border-[#D97706]',
    accentBg: 'from-amber-50/50 to-white',
    description: 'Fractions with real objects, parts of speech, living things (MR NIGER D), and 6 geopolitical zones.',
    keyTopics: ['Proper & Improper Fractions', 'Nouns, Verbs & Tenses', 'Nigerian Geography & Confluence'],
  },
  {
    grade: 5,
    levelTitle: 'Primary 5',
    stageName: 'Middle Basic 2',
    ageRange: 'Ages 9–10',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    accentBorder: 'hover:border-blue-500',
    accentBg: 'from-blue-50/60 to-white',
    description: 'Decimals, percentages, formal letter writing, simple electrical circuits, and national symbols.',
    keyTopics: ['Percentages & Decimals in Naira', 'Formal Letters & Essay Writing', 'Electricity, Magnets & Technology'],
  },
  {
    grade: 6,
    levelTitle: 'Primary 6',
    stageName: 'Upper Basic / Common Entrance',
    ageRange: 'Ages 10–11',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    accentBorder: 'hover:border-purple-500',
    accentBg: 'from-purple-50/60 to-white',
    description: 'National Common Entrance prep, advanced word problems, comprehension mastery, and civic governance.',
    keyTopics: ['Quantitative & Verbal Aptitude', 'Speed, Distance & Algebra', 'National Common Entrance Revision'],
  },
];

export const ClassSelectionView: React.FC<ClassSelectionViewProps> = ({
  activeStudent,
  students,
  allLessons,
  onSelectGrade,
  onExploreCurriculum,
  onSelectStudent,
}) => {
  return (
    <div id="class-selection-page" className="w-full max-w-full overflow-x-hidden p-3 sm:p-6 md:p-8 space-y-6">
      {/* Header Banner with Profile Indicators */}
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-[11px] font-black uppercase text-[#026838]">
            <span>🏫 NIGERIAN BASIC EDUCATION</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span>PRIMARY 1–6</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#026838] uppercase font-display tracking-tight">
            Class Selection (Primary 1–6)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
            Choose your child's primary school class. All 6 classes follow the Nigerian NERDC Universal Basic Education scheme with 30-minute structured daily mastery lessons.
          </p>

          {/* Child Switcher Selector */}
          {students && students.length > 1 && onSelectStudent && (
            <div className="pt-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Switch Child Profile:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {students.map((child) => {
                  const isSelected = child.id === activeStudent.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelectStudent(child)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#026838] text-white border-[#026838] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: child.avatarColor || '#026838' }}
                      >
                        {child.avatarUrl ? (
                          <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          child.name.charAt(0)
                        )}
                      </div>
                      <span>{child.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        Pri {child.grade}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Current Student Registration Badge */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shrink-0 flex items-center gap-3.5 shadow-2xs">
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#026838] bg-white flex items-center justify-center font-black text-sm text-white shadow-xs"
              style={{ backgroundColor: activeStudent.avatarColor || '#026838' }}
            >
              {activeStudent.avatarUrl ? (
                <img src={activeStudent.avatarUrl} alt={activeStudent.name} className="w-full h-full object-cover" />
              ) : (
                activeStudent.name.charAt(0)
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 text-[9px] bg-[#026838] text-white px-1.5 py-0.2 rounded-full font-black">
              P{activeStudent.grade}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-amber-900 uppercase block tracking-wider">
              Currently Selected Pupil
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900">{activeStudent.name}</span>
              <span className="text-xs font-bold text-[#026838] bg-emerald-100 px-2 py-0.5 rounded-full">
                Primary {activeStudent.grade}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Term {activeStudent.currentTerm || 1} • Nigerian NERDC Curriculum
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Primary Classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {NIGERIAN_CLASSES.map((cls) => {
          const isCurrentActive = activeStudent.grade === cls.grade;
          const isRegistered = activeStudent.registeredGrade === cls.grade;
          const enrolledStudentsInThisGrade = students.filter(s => s.grade === cls.grade || s.registeredGrade === cls.grade);
          const lessonCount = allLessons.filter(l => l.grade === cls.grade).length || 18;
          const classTeacher = getTeacherForGrade(cls.grade);

          return (
            <div
              key={cls.grade}
              id={`class-card-primary-${cls.grade}`}
              className={`rounded-[28px] p-5 sm:p-6 border-2 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md bg-gradient-to-b ${cls.accentBg} ${
                isCurrentActive 
                  ? 'border-[#026838] ring-4 ring-[#026838]/10 shadow-md' 
                  : 'border-slate-200 ' + cls.accentBorder
              }`}
            >
              <div className="space-y-3">
                {/* Top Row: Class Number Badge & Age Range */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#026838] text-white flex items-center justify-center font-black text-lg shadow-xs">
                      P{cls.grade}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase font-display leading-tight">
                        {cls.levelTitle}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {cls.stageName}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${cls.badgeColor}`}>
                    {cls.ageRange}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {cls.description}
                </p>

                {/* Assigned Dedicated Class Teacher */}
                <div className="flex items-center gap-2.5 p-2.5 bg-white/90 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#F59E0B] shrink-0 bg-white flex items-center justify-center">
                    {classTeacher.imageUrl ? (
                      <img src={classTeacher.imageUrl} alt={classTeacher.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{classTeacher.avatarEmoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase text-[#026838] block tracking-wide">
                      Dedicated Class Teacher
                    </span>
                    <span className="text-xs font-black text-slate-900 truncate block">
                      {classTeacher.name}
                    </span>
                  </div>
                </div>

                {/* Sample Key Topics */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Core Curriculum Topics:
                  </span>
                  <div className="flex flex-col gap-1">
                    {cls.keyTopics.map((tp, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                        <span className="truncate">{tp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enrolled Pupils in this grade */}
                {enrolledStudentsInThisGrade.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                      Enrolled Children:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {enrolledStudentsInThisGrade.map(child => {
                        const isThisChildActive = child.id === activeStudent.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => onSelectStudent && onSelectStudent(child)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              isThisChildActive
                                ? 'bg-emerald-100 text-[#026838] border-emerald-300 font-black ring-1 ring-emerald-400/50'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title={isThisChildActive ? `${child.name} is currently selected` : `Click to switch active profile to ${child.name}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#026838]" />
                            <span>{child.name}</span>
                            {isThisChildActive && (
                              <span className="text-[9px] bg-[#026838] text-white px-1.5 py-0.2 rounded-full font-black uppercase">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectGrade(cls.grade)}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentActive
                      ? 'bg-[#026838] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  {isCurrentActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Selected Class</span>
                    </>
                  ) : (
                    <span>Switch to Primary {cls.grade}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onExploreCurriculum(cls.grade)}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  title="View full scheme of work for this class"
                >
                  <span>Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
