import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  Volume2, 
  Sparkles, 
  PlayCircle,
  GraduationCap,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Rocket
} from 'lucide-react';
import { SubjectName, GradeLevel, StudentProfile, LessonTopic, VoiceTone } from '../types';
import { getTeacherForGrade } from '../data/teachers';
import { TeacherSpeechEngine } from '../utils/speech';
import { 
  getSubjectsForClass, 
  getWeekNodesForSubject, 
  getClassCurriculum,
  getTermStructureConfig,
  ClassSubject,
  WeekCurriculumNode 
} from '../data/curriculumHierarchy';

export interface SubjectSelectionViewProps {
  activeStudent: StudentProfile;
  allLessons?: LessonTopic[];
  voiceEnabled?: boolean;
  voiceTone?: VoiceTone;
  onSelectSubject?: (subject: SubjectName) => void;
  onStartLesson: (lesson: LessonTopic) => void;
  onExploreClassSelection?: () => void;
  onBackToDashboard?: () => void;
}

type SubjectPageStage = 'mode-choice' | 'subject-list' | 'subject-detail';

interface SubjectVisualMeta {
  displayName: string;
  iconEmoji: string;
  nerdcTheme: string;
  description: string;
  accentBg: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
  buttonBg: string;
}

const SUBJECT_VISUAL_MAP: Record<SubjectName, SubjectVisualMeta> = {
  'Mathematics': {
    displayName: 'Mathematics',
    iconEmoji: '📐',
    nerdcTheme: 'Universal Basic Numeracy',
    description: 'Numbers, fractions, measurements and everyday problem-solving.',
    accentBg: 'from-emerald-50/70 via-white to-teal-50/50',
    badgeColor: 'bg-emerald-100 text-[#026838] border-emerald-300',
    borderColor: 'border-emerald-200 hover:border-[#026838]',
    textColor: 'text-[#026838]',
    buttonBg: 'bg-[#026838] hover:bg-[#014d28]'
  },
  'English Studies': {
    displayName: 'English Studies',
    iconEmoji: '📚',
    nerdcTheme: 'Literacy, Grammar & Phonics',
    description: 'Reading, grammar, phonics, spellings and story writing.',
    accentBg: 'from-amber-50/70 via-white to-orange-50/50',
    badgeColor: 'bg-amber-100 text-[#D97706] border-amber-300',
    borderColor: 'border-amber-200 hover:border-[#D97706]',
    textColor: 'text-[#D97706]',
    buttonBg: 'bg-[#D97706] hover:bg-[#b45309]'
  },
  'Basic Science & Technology': {
    displayName: 'Basic Science & Tech',
    iconEmoji: '🔬',
    nerdcTheme: 'Scientific Inquiry & Digital Literacy',
    description: 'Living things, nature, simple machines and exploring our world.',
    accentBg: 'from-teal-50/70 via-white to-sky-50/50',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    borderColor: 'border-teal-200 hover:border-teal-600',
    textColor: 'text-teal-800',
    buttonBg: 'bg-teal-700 hover:bg-teal-800'
  },
  'Social Studies': {
    displayName: 'Social Studies',
    iconEmoji: '🌍',
    nerdcTheme: 'Environment, Society & Geography',
    description: 'Our families, Nigerian culture, geography and communities.',
    accentBg: 'from-indigo-50/70 via-white to-blue-50/50',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderColor: 'border-indigo-200 hover:border-indigo-600',
    textColor: 'text-indigo-800',
    buttonBg: 'bg-indigo-700 hover:bg-indigo-800'
  },
  'Civic Education': {
    displayName: 'Civic Education',
    iconEmoji: '⚖️',
    nerdcTheme: 'Citizenship, Rights & National Unity',
    description: 'Good citizenship, national symbols, rights and responsibilities.',
    accentBg: 'from-blue-50/70 via-white to-cyan-50/50',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    borderColor: 'border-blue-200 hover:border-blue-600',
    textColor: 'text-blue-800',
    buttonBg: 'bg-blue-700 hover:bg-blue-800'
  },
  'Agricultural Science': {
    displayName: 'Agricultural Science',
    iconEmoji: '🌾',
    nerdcTheme: 'Food Production, Crops & Livestock',
    description: 'Crops, domestic animals, farm tools and food production.',
    accentBg: 'from-lime-50/70 via-white to-emerald-50/50',
    badgeColor: 'bg-lime-100 text-lime-900 border-lime-300',
    borderColor: 'border-lime-200 hover:border-lime-600',
    textColor: 'text-lime-800',
    buttonBg: 'bg-[#65A30D] hover:bg-[#4D7C0F]'
  }
};

export const SubjectSelectionView: React.FC<SubjectSelectionViewProps> = ({
  activeStudent,
  voiceEnabled = true,
  voiceTone,
  onSelectSubject,
  onStartLesson,
  onExploreClassSelection,
  onBackToDashboard,
}) => {
  // Navigation stage: 'mode-choice' -> 'subject-list' -> 'subject-detail'
  const [stage, setStage] = useState<SubjectPageStage>('mode-choice');
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(activeStudent.currentTerm || 1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [classEmptyNotice, setClassEmptyNotice] = useState<string | null>(null);

  // Dedicated Class Teacher for this pupil's class
  const classTeacher = useMemo(() => {
    return getTeacherForGrade(activeStudent.grade);
  }, [activeStudent.grade]);

  // Query authentic class subjects from the structured curriculum hierarchy
  const classSubjects: ClassSubject[] = useMemo(() => {
    return getSubjectsForClass(activeStudent.grade);
  }, [activeStudent.grade]);

  // Query class curriculum metadata
  const classCurriculum = useMemo(() => {
    return getClassCurriculum(activeStudent.grade);
  }, [activeStudent.grade]);

  // Count total published lessons available in this class
  const totalClassLessonsCount = useMemo(() => {
    return classSubjects.reduce((total, sub) => {
      const subWeeks = sub.terms.reduce((wTotal, t) => wTotal + t.weeks.length, 0);
      return total + subWeeks;
    }, 0);
  }, [classSubjects]);

  // Speech engine listener
  useEffect(() => {
    const unsub = TeacherSpeechEngine.addListener((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsub();
      TeacherSpeechEngine.stop();
    };
  }, []);

  // Voice speech helper
  const speakTeacher = useCallback((text: string) => {
    if (!voiceEnabled) return;
    try {
      TeacherSpeechEngine.stop();
      TeacherSpeechEngine.speak(
        text,
        () => setIsSpeaking(false),
        classTeacher.gender,
        voiceTone || activeStudent.preferredVoiceTone || 'nigerian_teacher'
      );
    } catch (err) {
      console.warn('Teacher speech error:', err);
      setIsSpeaking(false);
    }
  }, [voiceEnabled, classTeacher.gender, voiceTone, activeStudent.preferredVoiceTone]);

  // Auto-speak teacher guidance when stage or subject changes
  useEffect(() => {
    let message = '';
    if (stage === 'mode-choice') {
      message = `Welcome! These are your subjects. Would you like me to take you through your subjects from the first one to the last, or would you like to choose a subject yourself?`;
    } else if (stage === 'subject-list') {
      message = `These are your subjects. You can choose any subject you want, or I can take you through them one after another.`;
    } else if (stage === 'subject-detail' && selectedSubject) {
      message = `Here are your lessons for ${selectedSubject}. Choose a topic to begin your 30-minute lesson!`;
    }

    if (message) {
      const timer = setTimeout(() => {
        speakTeacher(message);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [stage, selectedSubject, speakTeacher]);

  // Handle "Listen Again"
  const handleListenAgain = () => {
    if (stage === 'mode-choice') {
      speakTeacher(`Welcome! These are your subjects. Would you like me to take you through your subjects from the first one to the last, or would you like to choose a subject yourself?`);
    } else if (stage === 'subject-list') {
      speakTeacher(`These are your subjects. You can choose any subject you want, or I can take you through them one after another.`);
    } else if (stage === 'subject-detail' && selectedSubject) {
      speakTeacher(`Here are your lessons for ${selectedSubject}. Choose a topic to begin your 30-minute lesson!`);
    }
  };

  // --------------------------------------------------------------------------
  // FLOW 1: START FROM THE FIRST SUBJECT
  // Uses curriculum order from class structure. If first subject has lessons,
  // opens it. If not, moves to the next subject with available records.
  // Never invents content.
  // --------------------------------------------------------------------------
  const handleStartFromFirstSubject = () => {
    TeacherSpeechEngine.stop();
    setClassEmptyNotice(null);

    // Look for first subject in the class structure that has active curriculum records
    let foundSubject: ClassSubject | null = null;
    let foundTerm: 1 | 2 | 3 = selectedTerm;

    // Check in the natural order of subjects for this class
    for (const sub of classSubjects) {
      // Check current term first, then other terms
      const termWeeks = getWeekNodesForSubject(activeStudent.grade, sub.subjectName, selectedTerm);
      if (termWeeks.length > 0) {
        foundSubject = sub;
        foundTerm = selectedTerm;
        break;
      }
      // Check any term
      for (const t of ([1, 2, 3] as const)) {
        const w = getWeekNodesForSubject(activeStudent.grade, sub.subjectName, t);
        if (w.length > 0) {
          foundSubject = sub;
          foundTerm = t;
          break;
        }
      }
      if (foundSubject) break;
    }

    if (foundSubject) {
      setSelectedSubject(foundSubject.subjectName);
      setSelectedTerm(foundTerm);
      setStage('subject-detail');
      if (onSelectSubject) {
        onSelectSubject(foundSubject.subjectName);
      }
    } else {
      // Primary 1, 5, 6 - no curriculum records exist yet.
      setClassEmptyNotice(
        `Official curriculum records for Primary ${activeStudent.grade} are currently being prepared. No lessons have been published for this class yet.`
      );
    }
  };

  // --------------------------------------------------------------------------
  // FLOW 2: CHOOSE A SUBJECT
  // Shows all subjects belonging to the pupil's class.
  // --------------------------------------------------------------------------
  const handleChooseASubject = () => {
    TeacherSpeechEngine.stop();
    setClassEmptyNotice(null);
    setStage('subject-list');
  };

  // Select a specific subject to view its curriculum
  const handleSelectSpecificSubject = (subjectName: SubjectName) => {
    const sub = classSubjects.find(s => s.subjectName === subjectName);
    const totalWeeks = sub ? sub.terms.reduce((acc, t) => acc + t.weeks.length, 0) : 0;
    if (totalWeeks === 0) {
      // Do not allow entering non-existent curriculum
      return;
    }
    TeacherSpeechEngine.stop();
    setSelectedSubject(subjectName);
    setStage('subject-detail');
    if (onSelectSubject) {
      onSelectSubject(subjectName);
    }
  };

  // ==========================================================================
  // VIEW STAGE 1: MODE CHOICE
  // Teacher: "Welcome! These are your subjects..."
  // [ START FROM THE FIRST SUBJECT ]  [ CHOOSE A SUBJECT ]
  // ==========================================================================
  if (stage === 'mode-choice') {
    return (
      <div id="subject-mode-choice-view" className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Top Class Banner */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#026838]">
            <GraduationCap className="w-4 h-4 text-[#026838]" />
            <span>PRIMARY {activeStudent.grade} CLASSROOM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span className="text-slate-500 font-bold">{classCurriculum.stage}</span>
          </div>

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        {/* Teacher Welcome & Guidance Speech Card */}
        <div className="bg-white rounded-[32px] sm:rounded-[36px] border-2 border-emerald-300 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Teacher Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-[#026838] shadow-md bg-emerald-100 flex items-center justify-center">
                {classTeacher.imageUrl ? (
                  <img src={classTeacher.imageUrl} alt={classTeacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{classTeacher.avatarEmoji}</span>
                )}
              </div>
              {isSpeaking && (
                <div className="absolute -bottom-1 right-0 bg-[#F59E0B] text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm animate-bounce">
                  <Volume2 className="w-3 h-3" />
                  <span>Speaking</span>
                </div>
              )}
            </div>

            {/* Teacher Greeting Speech Bubble */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-black uppercase text-[#026838] tracking-wider">
                  {classTeacher.name}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  • Primary {activeStudent.grade} Class Teacher
                </span>
              </div>

              <div className="bg-[#F0FDF4] p-4 rounded-2xl border border-emerald-200">
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                  "Welcome! These are your subjects."
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug mt-1">
                  "Would you like me to take you through your subjects from the first one to the last, or would you like to choose a subject yourself?"
                </p>
              </div>

              {/* Listen Again Button */}
              <div className="pt-1 flex items-center justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleListenAgain}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>🔊 Listen Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Class Notice if Pupil selects Start First Subject on an empty class */}
        {classEmptyNotice && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs sm:text-sm text-amber-900 font-bold flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black uppercase block text-[11px] text-amber-950">
                Curriculum Notice for Primary {activeStudent.grade}
              </span>
              <p>{classEmptyNotice}</p>
              <button
                type="button"
                onClick={handleChooseASubject}
                className="text-xs text-[#026838] underline font-black uppercase cursor-pointer pt-1 block"
              >
                View Registered Primary {activeStudent.grade} Subjects →
              </button>
            </div>
          </div>
        )}

        {/* Two Clear Choices */}
        <div className="space-y-3">
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase font-display tracking-tight">
              Choose How to Learn
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Click either choice below to proceed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* OPTION 1: START FROM THE FIRST SUBJECT */}
            <button
              id="start-from-first-subject-btn"
              type="button"
              onClick={handleStartFromFirstSubject}
              className="group relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-[28px] border-3 border-emerald-300 hover:border-[#026838] p-6 sm:p-7 text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    🚀
                  </div>
                  <span className="bg-[#026838] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#026838] font-display uppercase">
                    START FROM THE FIRST SUBJECT
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                    "Learn your subjects from first to last."
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Your class teacher will guide you starting with the first available subject for Primary {activeStudent.grade}.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-black text-[#026838] uppercase">
                  Start in Sequence
                </span>
                <div className="w-9 h-9 rounded-full bg-[#026838] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </button>

            {/* OPTION 2: CHOOSE A SUBJECT */}
            <button
              id="choose-a-subject-btn"
              type="button"
              onClick={handleChooseASubject}
              className="group relative bg-gradient-to-br from-sky-50 via-white to-blue-50 hover:from-sky-100 hover:to-blue-100 rounded-[28px] border-3 border-sky-300 hover:border-[#1E88E5] p-6 sm:p-7 text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    📚
                  </div>
                  <span className="bg-[#1E88E5] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    All Subjects
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#1565C0] font-display uppercase">
                    CHOOSE A SUBJECT
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                    "Choose the subject you want to learn."
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Explore Mathematics, English Studies, Basic Science, Social Studies, and all subjects in your class.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-sky-200 flex items-center justify-between">
                <span className="text-xs font-black text-[#1565C0] uppercase">
                  Pick by Subject
                </span>
                <div className="w-9 h-9 rounded-full bg-[#1E88E5] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW STAGE 2: SUBJECT LIST
  // Displays subjects strictly belonging to the pupil's class.
  // Distinguishes Situation A (active records) vs Situation B (awaiting records).
  // ==========================================================================
  if (stage === 'subject-list') {
    return (
      <div id="pupil-subject-list-view" className="w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              TeacherSpeechEngine.stop();
              setStage('mode-choice');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Start Choice</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Class:</span>
            <span className="text-xs font-black text-[#026838] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
              Primary {activeStudent.grade}
            </span>
            {onExploreClassSelection && (
              <button
                type="button"
                onClick={onExploreClassSelection}
                className="text-[10px] text-slate-500 underline font-bold uppercase cursor-pointer hover:text-slate-800 ml-1"
              >
                Change Class
              </button>
            )}
          </div>
        </div>

        {/* Teacher Speech Card */}
        <div className="bg-[#F0FDF4] rounded-3xl border-2 border-emerald-300 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#026838] shrink-0 bg-white flex items-center justify-center">
            {classTeacher.imageUrl ? (
              <img src={classTeacher.imageUrl} alt={classTeacher.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{classTeacher.avatarEmoji}</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="text-[11px] font-black uppercase text-[#026838]">
              {classTeacher.name} says:
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
              "These are your subjects. You can choose any subject you want, or I can take you through them one after another."
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleListenAgain}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs transition-all active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>🔊 Listen Again</span>
            </button>
          </div>
        </div>

        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase font-display tracking-tight">
            PRIMARY {activeStudent.grade} SUBJECTS
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-bold">
            Choose what you would like to learn today.
          </p>
        </div>

        {/* Grid of Subject Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classSubjects.map((sub) => {
            const visual = SUBJECT_VISUAL_MAP[sub.subjectName] || {
              displayName: sub.subjectName,
              iconEmoji: '📖',
              nerdcTheme: 'Core Nigerian Curriculum',
              description: 'Standard NERDC Primary syllabus.',
              accentBg: 'from-slate-50 to-white',
              badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
              borderColor: 'border-slate-200 hover:border-slate-400',
              textColor: 'text-slate-800',
              buttonBg: 'bg-[#026838] hover:bg-[#014d28]'
            };

            // Count total weeks published across all terms for this subject in THIS grade
            const allTermsWeeks = sub.terms.reduce((acc, t) => acc + t.weeks.length, 0);
            const hasCurriculum = allTermsWeeks > 0;

            return (
              <div
                key={sub.subjectName}
                id={`subject-card-${sub.subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className={`rounded-[28px] p-5 sm:p-6 border-2 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md bg-gradient-to-b ${visual.accentBg} ${visual.borderColor} group relative`}
              >
                <div className="space-y-3">
                  {/* Top Row: Visual Icon & Availability Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      {visual.iconEmoji}
                    </div>

                    {hasCurriculum ? (
                      <span className="text-xs font-black uppercase px-3 py-1 rounded-full border bg-emerald-100 text-[#026838] border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#026838]" />
                        <span>{allTermsWeeks} {allTermsWeeks === 1 ? 'LESSON READY' : 'LESSONS READY'}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200">
                        COMING SOON
                      </span>
                    )}
                  </div>

                  {/* Subject Title */}
                  <div>
                    <h3 className={`text-xl font-black uppercase font-display tracking-tight leading-tight ${visual.textColor}`}>
                      {sub.subjectName}
                    </h3>
                  </div>

                  {/* Short Child-friendly Description */}
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {visual.description}
                  </p>

                  {/* Availability Note */}
                  <div className="pt-1">
                    {hasCurriculum ? (
                      <div className="text-[11px] text-[#026838] font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#026838] shrink-0" />
                        <span>Term 1 lessons ready to learn</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        Lessons for this subject are being prepared.
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-5 mt-3 border-t border-slate-100">
                  {hasCurriculum ? (
                    <button
                      type="button"
                      id={`choose-subject-btn-${sub.subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => handleSelectSpecificSubject(sub.subjectName)}
                      className={`w-full py-3 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98 ${visual.buttonBg}`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>CHOOSE {sub.subjectName.toUpperCase()}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>LESSONS COMING SOON</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW STAGE 3: SUBJECT DETAIL (LESSONS / WEEKS VIEW)
  // Displays authentic curriculum content for the selected subject and class.
  // Term selection (Terms 1, 2, 3) and actual week cards.
  // No fabricated lessons!
  // ==========================================================================
  const currentVisual = selectedSubject ? SUBJECT_VISUAL_MAP[selectedSubject] : null;
  const currentWeekNodes: WeekCurriculumNode[] = selectedSubject 
    ? getWeekNodesForSubject(activeStudent.grade, selectedSubject, selectedTerm)
    : [];

  const termNames: Record<number, string> = {
    1: 'First Term',
    2: 'Second Term',
    3: 'Third Term'
  };

  return (
    <div id="subject-detail-curriculum-view" className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            TeacherSpeechEngine.stop();
            setStage('subject-list');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Subjects</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-[#026838] border border-emerald-200">
            Primary {activeStudent.grade}
          </span>
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-amber-50 text-[#D97706] border border-amber-200">
            {termNames[selectedTerm]}
          </span>
        </div>
      </div>

      {/* Teacher Guidance Speech Card */}
      <div className="bg-[#F0FDF4] rounded-3xl border-2 border-emerald-300 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#026838] shrink-0 bg-white flex items-center justify-center">
          {classTeacher.imageUrl ? (
            <img src={classTeacher.imageUrl} alt={classTeacher.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{classTeacher.avatarEmoji}</span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="text-[11px] font-black uppercase text-[#026838]">
            {classTeacher.name} • {selectedSubject}
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
            "Here are your lessons for {selectedSubject}. Choose a topic to begin your 30-minute lesson!"
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={handleListenAgain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs transition-all active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>🔊 Listen Again</span>
          </button>
        </div>
      </div>

      {/* Subject Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl">
            {currentVisual?.iconEmoji || '📚'}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <span>PRIMARY {activeStudent.grade}</span>
              <span>•</span>
              <span>{classCurriculum.stage}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase font-display">
              {selectedSubject}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentVisual?.description || 'Nigerian Universal Basic Education scheme.'}
            </p>
          </div>
        </div>
      </div>

      {/* Term Selector (First Term, Second Term, Third Term) */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase text-slate-500 tracking-wider block">
          Select Academic Term:
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {([1, 2, 3] as const).map((termNum) => {
            const isSelected = selectedTerm === termNum;
            const termWeeks = selectedSubject 
              ? getWeekNodesForSubject(activeStudent.grade, selectedSubject, termNum)
              : [];
            const hasWeeks = termWeeks.length > 0;

            return (
              <button
                key={termNum}
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setSelectedTerm(termNum);
                }}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'border-[#026838] bg-[#F0FDF4] shadow-xs ring-2 ring-[#026838]/20 font-black text-[#026838]'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 font-bold'
                }`}
              >
                <span className="text-xs uppercase">{termNames[termNum]}</span>
                {hasWeeks ? (
                  <span className="text-[10px] text-[#026838] font-bold">
                    {termWeeks.length} {termWeeks.length === 1 ? 'Topic' : 'Topics'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Term Calendar Structure & Period Breakdown */}
      {(() => {
        const termConfig = getTermStructureConfig(activeStudent.grade, selectedTerm);
        return (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>NERDC Term Calendar Architecture: {termConfig.totalWeeks} Weeks Total</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {termConfig.structureNotes}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold border border-sky-200">
                Instructional Weeks (Core Syllabus)
              </span>
              {termConfig.revisionWeeks && termConfig.revisionWeeks.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  Revision: Week {termConfig.revisionWeeks.join(' & ')}
                </span>
              )}
              {termConfig.assessmentWeeks && termConfig.assessmentWeeks.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  Continuous Assessment: Week {termConfig.assessmentWeeks.join(' & ')}
                </span>
              )}
              {termConfig.examinationWeeks && termConfig.examinationWeeks.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
                  Term Exam: Week {termConfig.examinationWeeks.join(' & ')}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Week Lessons / Topics List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-sm font-black text-slate-900 uppercase font-display flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#026838]" />
            <span>Available Curriculum Lessons</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {currentWeekNodes.length} {currentWeekNodes.length === 1 ? 'Topic Available' : 'Topics Available'}
          </span>
        </div>

        {/* SITUATION A: Curriculum Records Exist */}
        {currentWeekNodes.length > 0 ? (
          <div className="space-y-3.5">
            {currentWeekNodes.map((weekNode) => {
              const weekTypeBadge = (() => {
                switch (weekNode.weekType) {
                  case 'revision':
                    return <span className="bg-amber-100 text-[#D97706] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200">🔄 Revision Week</span>;
                  case 'assessment':
                    return <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-200">📝 Continuous Assessment</span>;
                  case 'examination':
                    return <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-200">🎓 Term Examination</span>;
                  case 'special_instructional':
                    return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-200">🔬 Practical / Project</span>;
                  default:
                    return <span className="bg-emerald-100 text-[#026838] text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200">📖 Instructional Lesson</span>;
                }
              })();

              return (
                <div
                  key={weekNode.week}
                  id={`curriculum-week-${weekNode.week}`}
                  className="bg-white p-5 sm:p-6 rounded-[24px] border-2 border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#026838] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        Week {weekNode.week}
                      </span>
                      {weekTypeBadge}
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-amber-200">
                        ⏱️ 30-Minute Lesson
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      {weekNode.topic}
                    </h3>

                    {weekNode.subtopic && (
                      <p className="text-xs text-slate-600 font-medium">
                        {weekNode.subtopic}
                      </p>
                    )}

                    {weekNode.periodTitle && (
                      <p className="text-[11px] text-slate-400 font-medium italic">
                        {weekNode.periodTitle}
                      </p>
                    )}

                    {/* Simple Learning Objectives Count */}
                    {weekNode.learningObjectives && weekNode.learningObjectives.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#026838]" />
                        <span>{weekNode.learningObjectives.length} Core Learning Objectives</span>
                      </div>
                    )}
                  </div>

                  {/* START LESSON Button */}
                  <button
                    type="button"
                    onClick={() => {
                      TeacherSpeechEngine.stop();
                      onStartLesson(weekNode.lessonData);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#026838] hover:bg-[#014d28] active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
                  >
                    <PlayCircle className="w-4 h-4 text-amber-300" />
                    <span>START LESSON</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Incomplete Curriculum Note */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
              More weekly lessons for Primary {activeStudent.grade} {selectedSubject} are being prepared according to national NERDC schemes of work.
            </div>
          </div>
        ) : (
          /* SITUATION B: No Records for this Term/Subject - Strict Anti-Fabrication Notice */
          <div className="p-8 sm:p-12 bg-white rounded-[28px] border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-2xl border border-amber-200">
              📚
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-900 uppercase font-display">
                Curriculum content has not been added yet.
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Brightly Home Lesson strictly adheres to authentic Nigerian NERDC curriculum records. Official scheme of work materials for Primary {activeStudent.grade} {selectedSubject} in {termNames[selectedTerm]} have not been published yet.
              </p>
              <p className="text-[11px] text-slate-400 font-medium italic">
                We never fabricate curriculum content with AI. When official NERDC documents are verified and approved by the curriculum committee, lessons will become accessible here.
              </p>
            </div>

            {selectedTerm !== 1 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTerm(1)}
                  className="px-4 py-2 bg-emerald-50 text-[#026838] border border-emerald-300 rounded-xl text-xs font-black uppercase hover:bg-emerald-100 cursor-pointer"
                >
                  Check First Term Lessons →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
