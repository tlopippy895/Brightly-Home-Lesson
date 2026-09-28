import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  Award, 
  LogOut, 
  RotateCcw,
  Clock,
  Compass,
  Smile
} from 'lucide-react';
import { StudentProfile, LessonTopic, TeacherPersona, SubjectName, VoiceTone } from '../types';
import { NIGERIAN_TEACHERS, getTeacherForGrade } from '../data/teachers';
import { TeacherSpeechEngine } from '../utils/speech';
import brightlyLogoImg from '../assets/images/brightly_app_logo_1790170019136.jpg';

export interface PupilPortalViewProps {
  student: StudentProfile;
  allLessons: LessonTopic[];
  voiceEnabled: boolean;
  voiceTone: VoiceTone;
  onStartLesson: (lesson: LessonTopic) => void;
  onSignOut: () => void;
  onToggleVoice?: () => void;
}

type PupilStep = 
  | 'welcome' 
  | 'learning-mode' 
  | 'auto-intro' 
  | 'subject-picker' 
  | 'subject-intro' 
  | 'my-learning';

interface SubjectCardConfig {
  name: SubjectName;
  icon: string;
  emoji: string;
  badgeBg: string;
  cardBg: string;
  accentBorder: string;
  buttonBg: string;
  topicFocus: string;
}

const NERDC_SUBJECTS: SubjectCardConfig[] = [
  {
    name: 'Mathematics',
    icon: '📐',
    emoji: '📘',
    badgeBg: 'bg-blue-100 text-blue-900',
    cardBg: 'from-blue-50/90 to-sky-50/80',
    accentBorder: 'border-blue-300 hover:border-blue-500',
    buttonBg: 'bg-[#1E88E5] hover:bg-[#1565C0]',
    topicFocus: 'Numbers, Operations & Shapes'
  },
  {
    name: 'English Studies',
    icon: '📖',
    emoji: '📙',
    badgeBg: 'bg-amber-100 text-amber-900',
    cardBg: 'from-amber-50/90 to-orange-50/80',
    accentBorder: 'border-amber-300 hover:border-amber-500',
    buttonBg: 'bg-[#D97706] hover:bg-[#B45309]',
    topicFocus: 'Phonics, Reading & Vocabulary'
  },
  {
    name: 'Basic Science & Technology',
    icon: '🔬',
    emoji: '📗',
    badgeBg: 'bg-emerald-100 text-emerald-900',
    cardBg: 'from-emerald-50/90 to-teal-50/80',
    accentBorder: 'border-emerald-300 hover:border-emerald-500',
    buttonBg: 'bg-[#026838] hover:bg-[#014d28]',
    topicFocus: 'Living Things, Tech & Environment'
  },
  {
    name: 'Social Studies',
    icon: '🌍',
    emoji: '📕',
    badgeBg: 'bg-indigo-100 text-indigo-900',
    cardBg: 'from-indigo-50/90 to-blue-50/80',
    accentBorder: 'border-indigo-300 hover:border-indigo-500',
    buttonBg: 'bg-[#4F46E5] hover:bg-[#4338CA]',
    topicFocus: 'Communities, Culture & Nigeria'
  },
  {
    name: 'Civic Education',
    icon: '🏛️',
    emoji: '🗳️',
    badgeBg: 'bg-purple-100 text-purple-900',
    cardBg: 'from-purple-50/90 to-violet-50/80',
    accentBorder: 'border-purple-300 hover:border-purple-500',
    buttonBg: 'bg-[#7C3AED] hover:bg-[#6D28D9]',
    topicFocus: 'Good Citizenship & National Values'
  },
  {
    name: 'Agricultural Science',
    icon: '🌾',
    emoji: '🌱',
    badgeBg: 'bg-lime-100 text-lime-900',
    cardBg: 'from-lime-50/90 to-emerald-50/80',
    accentBorder: 'border-lime-300 hover:border-lime-500',
    buttonBg: 'bg-[#65A30D] hover:bg-[#4D7C0F]',
    topicFocus: 'Farming, Crops & Soil Study'
  }
];

export const PupilPortalView: React.FC<PupilPortalViewProps> = ({
  student,
  allLessons,
  voiceEnabled,
  voiceTone,
  onStartLesson,
  onSignOut,
  onToggleVoice,
}) => {
  const [currentStep, setCurrentStep] = useState<PupilStep>('welcome');
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>('Mathematics');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<boolean>(false);

  // Dedicated Class Teacher for this pupil: In the class-teacher model,
  // each primary class (Primary 1-6) has a designated class teacher across all subjects!
  const activeTeacher: TeacherPersona = useMemo(() => {
    return getTeacherForGrade(student.grade);
  }, [student.grade]);

  // Determine the next sequential lesson for "Start All Subjects"
  const nextAutomaticLesson: LessonTopic = useMemo(() => {
    // 1. Lessons for student's grade
    const gradeLessons = allLessons.filter(l => l.grade === student.grade);
    
    // 2. Completed IDs
    const completedIds = new Set((student.completedLessons || []).map(c => c.topicId));
    
    // 3. Find first uncompleted lesson
    const uncompleted = gradeLessons.find(l => !completedIds.has(l.id));
    if (uncompleted) return uncompleted;
    
    // Fallback to first grade lesson, or any lesson
    if (gradeLessons.length > 0) return gradeLessons[0];
    return allLessons[0];
  }, [allLessons, student]);

  // Determine the best lesson for the chosen subject
  const selectedSubjectLesson: LessonTopic = useMemo(() => {
    // Find matching grade and subject
    const match = allLessons.find(
      l => l.grade === student.grade && l.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
    if (match) return match;

    // Fallback: match by subject across any grade and adapt
    const subjectMatch = allLessons.find(
      l => l.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
    if (subjectMatch) {
      return {
        ...subjectMatch,
        grade: student.grade,
      };
    }

    // Default template lesson
    return {
      ...allLessons[0],
      grade: student.grade,
      subject: selectedSubject,
      topic: `Foundations of ${selectedSubject}`,
      subtopic: `Core NERDC Primary ${student.grade} Curriculum`,
    };
  }, [allLessons, selectedSubject, student.grade]);

  // Speech listener hook
  useEffect(() => {
    const unsub = TeacherSpeechEngine.addListener((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsub();
      TeacherSpeechEngine.stop();
    };
  }, []);

  // Voice narration helper
  const speakTeacherMessage = useCallback((text: string) => {
    if (!voiceEnabled) return;
    try {
      TeacherSpeechEngine.stop();
      TeacherSpeechEngine.speak(
        text,
        () => setIsSpeaking(false),
        activeTeacher.gender,
        voiceTone || student.preferredVoiceTone || 'nigerian_teacher'
      );
      setAudioError(false);
    } catch (err) {
      console.warn('Teacher speech synthesis error:', err);
      setAudioError(true);
      setIsSpeaking(false);
    }
  }, [voiceEnabled, activeTeacher.gender, voiceTone, student.preferredVoiceTone]);

  // Auto-speak on step changes
  useEffect(() => {
    if (!voiceEnabled) return;

    let messageToSpeak = '';
    if (currentStep === 'welcome') {
      messageToSpeak = `Good morning, ${student.name}! Welcome to Brightly Home Lesson. I am happy to learn with you today. Are you ready for your class?`;
    } else if (currentStep === 'learning-mode') {
      messageToSpeak = `We have different subjects for you to learn. Would you like me to take you through them one after another, or would you like to choose a subject yourself?`;
    } else if (currentStep === 'auto-intro') {
      messageToSpeak = `Great! Let's begin. Today's lesson is in ${nextAutomaticLesson.subject}. Are you ready?`;
    } else if (currentStep === 'subject-picker') {
      messageToSpeak = `Which subject would you like to learn today? Click any subject to begin!`;
    } else if (currentStep === 'subject-intro') {
      messageToSpeak = `Wonderful! Let's begin today's ${selectedSubject} lesson.`;
    }

    if (messageToSpeak) {
      // Small timeout to allow render completion
      const timer = setTimeout(() => {
        speakTeacherMessage(messageToSpeak);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentStep, student.name, nextAutomaticLesson.subject, selectedSubject, voiceEnabled, speakTeacherMessage]);

  // Play audio for current step
  const handleListenAgain = () => {
    let msg = '';
    if (currentStep === 'welcome') {
      msg = `Good morning, ${student.name}! Welcome to Brightly Home Lesson. I am happy to learn with you today. Are you ready for your class?`;
    } else if (currentStep === 'learning-mode') {
      msg = `We have different subjects for you to learn. Would you like me to take you through them one after another, or would you like to choose a subject yourself?`;
    } else if (currentStep === 'auto-intro') {
      msg = `Great! Let's begin. Today's lesson is in ${nextAutomaticLesson.subject}. Are you ready?`;
    } else if (currentStep === 'subject-picker') {
      msg = `Which subject would you like to learn today? Choose any subject to begin!`;
    } else if (currentStep === 'subject-intro') {
      msg = `Wonderful! Let's begin today's ${selectedSubject} lesson.`;
    } else if (currentStep === 'my-learning') {
      msg = `Here is your learning progress, ${student.name}. You are doing wonderful work!`;
    }
    if (msg) {
      speakTeacherMessage(msg);
    }
  };

  // Launch lesson room
  const handleStartClass = (lesson: LessonTopic) => {
    TeacherSpeechEngine.stop();
    onStartLesson(lesson);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] via-[#F0FDF4] to-[#FFFBEB] text-slate-800 flex flex-col font-sans selection:bg-[#FFD54F] selection:text-slate-900">
      {/* ========================================================================= */}
      {/* 1. SIMPLE, CHILD-FRIENDLY TOP NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="bg-white/90 backdrop-blur-md border-b-2 border-emerald-100 px-4 sm:px-8 py-3 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <img 
              src={brightlyLogoImg} 
              alt="Brightly Home Lesson" 
              className="h-10 sm:h-12 w-auto object-contain rounded-xl shadow-2xs border border-emerald-200" 
            />
            <div className="hidden sm:block">
              <span className="text-xs font-black tracking-wider uppercase text-[#026838] block leading-none">
                Brightly Home Lesson
              </span>
              <span className="text-[10px] font-bold text-amber-700 block leading-tight mt-0.5">
                Primary 1–6 Virtual Classroom
              </span>
            </div>
          </div>

          {/* Child Profile Info & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Child Identifier Badge: "Who am I? What class am I in?" */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-2xl border-2 border-emerald-200/90 shadow-2xs">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-2xs shrink-0 flex items-center justify-center text-xs font-black text-white"
                style={{ backgroundColor: student.avatarColor || '#026838' }}
              >
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  student.name.charAt(0)
                )}
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-black text-slate-900 block leading-none truncate max-w-[100px] sm:max-w-[150px]">
                  {student.name}
                </span>
                <span className="text-[10px] font-extrabold text-[#026838] uppercase block leading-tight">
                  Primary {student.grade}
                </span>
              </div>
            </div>

            {/* Sound Toggle */}
            {onToggleVoice && (
              <button
                type="button"
                onClick={onToggleVoice}
                title={voiceEnabled ? 'Teacher Voice On' : 'Teacher Voice Muted'}
                className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${
                  voiceEnabled 
                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}

            {/* My Learning Tab Button */}
            <button
              type="button"
              onClick={() => {
                TeacherSpeechEngine.stop();
                setCurrentStep(currentStep === 'my-learning' ? 'welcome' : 'my-learning');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-2 cursor-pointer ${
                currentStep === 'my-learning'
                  ? 'bg-[#026838] text-white border-[#026838] shadow-xs'
                  : 'bg-white hover:bg-emerald-50 text-[#026838] border-emerald-200 shadow-2xs'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="hidden sm:inline">My Learning</span>
            </button>

            {/* Sign Out / Switch User */}
            <button
              type="button"
              onClick={() => {
                TeacherSpeechEngine.stop();
                onSignOut();
              }}
              title="Sign Out"
              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-2 border-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN LEARNING STAGE AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE A: WELCOME SCREEN (Section 4 & 5) */}
        {/* ----------------------------------------------------------------------- */}
        {currentStep === 'welcome' && (
          <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] border-3 border-emerald-200 p-6 sm:p-10 md:p-12 shadow-xl space-y-8 text-center relative overflow-hidden animate-fade-in">
            {/* Top Playful Accents */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FFD54F]/25 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#A5D6A7]/25 rounded-full blur-2xl pointer-events-none" />

            {/* National Curriculum Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-[#E3F2FD] px-4 py-1.5 rounded-full border border-sky-300 text-xs font-black uppercase text-[#1565C0] shadow-2xs">
              <span>🇳🇬 NIGERIAN NERDC CURRICULUM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0]" />
              <span>PRIMARY {student.grade} HOME LEARNING</span>
            </div>

            {/* Teacher Avatar & Animated Speaking Bubble */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#026838] shadow-lg bg-emerald-100 flex items-center justify-center">
                  {activeTeacher.imageUrl ? (
                    <img 
                      src={activeTeacher.imageUrl} 
                      alt={activeTeacher.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-6xl">{activeTeacher.avatarEmoji}</span>
                  )}
                </div>
                {/* Speaking Wave / Sound Indicator */}
                {isSpeaking && (
                  <div className="absolute -bottom-2 right-0 bg-[#F59E0B] text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md animate-bounce">
                    <Volume2 className="w-3 h-3" />
                    <span>Speaking</span>
                  </div>
                )}
              </div>

              {/* Teacher Identity Tag */}
              <div>
                <span className="text-xs sm:text-sm font-black text-[#026838] uppercase tracking-wide block">
                  {activeTeacher.name}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {activeTeacher.title}
                </span>
              </div>
            </div>

            {/* Pupil Welcome Heading: "Who am I? What class am I in?" */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 font-display tracking-tight">
                Welcome, <span className="text-[#026838] underline decoration-[#FFD54F] decoration-4">{student.name}</span>!
              </h1>
              <div className="inline-block bg-[#FFD54F]/30 px-4 py-1 rounded-xl border border-[#FFD54F] text-amber-900 font-black text-sm uppercase tracking-wider">
                Primary {student.grade} Classroom
              </div>
            </div>

            {/* Friendly Teacher Speech Card */}
            <div className="max-w-xl mx-auto bg-[#F0FDF4] border-2 border-emerald-300/80 rounded-3xl p-5 sm:p-6 shadow-sm text-center relative">
              <div className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
                "Welcome to Brightly Home Lesson. I am your teacher, and I am happy to learn with you today."
              </div>

              {/* Audio Listen Again Button (Section 5) */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleListenAgain}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                  <Volume2 className="w-4 h-4 text-[#F59E0B]" />
                  <span>🔊 Listen Again</span>
                </button>
              </div>
            </div>

            {/* PROCEED Action Button (Section 6: One large obvious primary action) */}
            <div className="pt-2">
              <button
                id="pupil-welcome-proceed-btn"
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('learning-mode');
                }}
                className="w-full max-w-md mx-auto py-4 sm:py-5 px-8 rounded-3xl bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-slate-950 font-black text-lg sm:text-xl uppercase tracking-wider shadow-[0_6px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>PROCEED</span>
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </button>
              <p className="text-xs text-slate-500 font-bold mt-2">
                Click Proceed to choose how you want to learn today!
              </p>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE B: CHOOSE HOW TO LEARN (Section 7, 8, 9) */}
        {/* ----------------------------------------------------------------------- */}
        {currentStep === 'learning-mode' && (
          <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] border-3 border-emerald-200 p-6 sm:p-10 shadow-xl space-y-8 animate-fade-in text-center relative overflow-hidden">
            {/* Teacher Guidance Speech Bubble */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#F0FDF4] border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 text-left">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#026838] shrink-0 bg-emerald-100 flex items-center justify-center">
                {activeTeacher.imageUrl ? (
                  <img src={activeTeacher.imageUrl} alt={activeTeacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{activeTeacher.avatarEmoji}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <span className="text-[11px] font-black uppercase text-[#026838] tracking-wider block">
                  {activeTeacher.name} asks:
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                  "We have different subjects for you to learn. Would you like me to take you through them one after another, or would you like to choose a subject yourself?"
                </p>
                <div>
                  <button
                    type="button"
                    onClick={handleListenAgain}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>🔊 Listen Again</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
                How Would You Like to Learn?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Choose one option below to get started immediately.
              </p>
            </div>

            {/* TWO LARGE CHILD-FRIENDLY CHOICES (Section 7) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* OPTION 1: START ALL SUBJECTS */}
              <div 
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('auto-intro');
                }}
                className="group relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-[28px] border-3 border-emerald-300 hover:border-[#026838] p-6 sm:p-8 text-left transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl sm:text-5xl">🚀</span>
                    <span className="bg-[#026838] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                      Option 1
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#026838] font-display uppercase">
                    START ALL SUBJECTS
                  </h3>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    "Learn your subjects one after another."
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Your AI teacher will automatically guide you through today's lessons in the recommended order.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-200/80 flex items-center justify-between">
                  <span className="text-xs font-black text-[#026838] uppercase group-hover:underline">
                    Recommended Path
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#026838] text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* OPTION 2: CHOOSE A SUBJECT */}
              <div 
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('subject-picker');
                }}
                className="group relative bg-gradient-to-br from-sky-50 via-white to-blue-50 hover:from-sky-100 hover:to-blue-100 rounded-[28px] border-3 border-sky-300 hover:border-[#1E88E5] p-6 sm:p-8 text-left transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl sm:text-5xl">📚</span>
                    <span className="bg-[#1E88E5] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                      Option 2
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1565C0] font-display uppercase">
                    CHOOSE A SUBJECT
                  </h3>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    "Choose the subject you want to learn."
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Pick from Mathematics, English Studies, Science, Social Studies, and more.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-sky-200/80 flex items-center justify-between">
                  <span className="text-xs font-black text-[#1565C0] uppercase group-hover:underline">
                    Pick by Interest
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[#1E88E5] text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Back Navigation */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('welcome');
                }}
                className="text-xs font-black uppercase text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Welcome</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE C: START ALL SUBJECTS - AUTOMATIC LESSON LAUNCH (Section 8) */}
        {/* ----------------------------------------------------------------------- */}
        {currentStep === 'auto-intro' && (
          <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] border-3 border-emerald-200 p-6 sm:p-10 shadow-xl space-y-8 animate-fade-in text-center relative overflow-hidden">
            {/* Top Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-300 text-xs font-black uppercase text-[#026838]">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>AUTOMATIC CURRICULUM SEQUENCE</span>
            </div>

            {/* Teacher Speech */}
            <div className="max-w-xl mx-auto bg-[#F0FDF4] border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#026838] mx-auto bg-emerald-100">
                {activeTeacher.imageUrl ? (
                  <img src={activeTeacher.imageUrl} alt={activeTeacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{activeTeacher.avatarEmoji}</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                "Great! Let's begin."
              </h2>
              <p className="text-sm font-bold text-slate-700">
                "Today's lesson is in <span className="text-[#026838] font-black">{nextAutomaticLesson.subject}</span>. Are you ready?"
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleListenAgain}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>🔊 Listen Again</span>
                </button>
              </div>
            </div>

            {/* Spotlight Lesson Card */}
            <div className="max-w-xl mx-auto bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-3 border-[#FFD54F] rounded-3xl p-6 sm:p-8 text-left shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-[#026838] text-white">
                  {nextAutomaticLesson.subject}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Primary {nextAutomaticLesson.grade} • Week {nextAutomaticLesson.week}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider block">
                  Today's lesson is ready:
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-1">
                  {nextAutomaticLesson.topic}
                </h3>
                {nextAutomaticLesson.subtopic && (
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    {nextAutomaticLesson.subtopic}
                  </p>
                )}
              </div>

              {/* Standard 30-Minute Duration Indicator (Section 11) */}
              <div className="flex items-center gap-2 text-xs font-black text-[#026838] bg-white px-3 py-2 rounded-xl border border-emerald-200">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
                <span>30-Minute Interactive Lesson • Nigerian Teacher & Visual Aids</span>
              </div>

              {/* START CLASS Action Button */}
              <button
                id="auto-start-class-btn"
                type="button"
                onClick={() => handleStartClass(nextAutomaticLesson)}
                className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-lg uppercase tracking-wider shadow-[0_5px_0_0_#013b1f] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>START CLASS</span>
                <Play className="w-5 h-5 fill-white" />
              </button>
            </div>

            {/* Back / Alternative Choice */}
            <div className="pt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('learning-mode');
                }}
                className="text-xs font-black uppercase text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to choices</span>
              </button>

              <span className="text-slate-300">•</span>

              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('subject-picker');
                }}
                className="text-xs font-black uppercase text-[#026838] hover:underline cursor-pointer py-1"
              >
                Or choose a different subject →
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE D: CHOOSE A SUBJECT - SUBJECTS PAGE (Section 9) */}
        {/* ----------------------------------------------------------------------- */}
        {currentStep === 'subject-picker' && (
          <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] border-3 border-emerald-200 p-6 sm:p-10 shadow-xl space-y-6 animate-fade-in text-center relative overflow-hidden">
            {/* Teacher Message Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F0FDF4] border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👩🏾‍🏫</span>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#026838]">AI Nigerian Teacher:</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    "Which subject would you like to learn today? Click any subject to begin!"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleListenAgain}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs shrink-0 self-end sm:self-auto"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#F59E0B] inline mr-1" />
                <span>🔊 Listen</span>
              </button>
            </div>

            {/* Section Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
                Primary {student.grade} Subjects
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Official Nigerian NERDC Curriculum Subjects for your class.
              </p>
            </div>

            {/* LARGE ATTRACTIVE SUBJECT CARDS (Section 9) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
              {NERDC_SUBJECTS.map((sub) => {
                // Calculate simple progress for this subject
                const subjectCompletedCount = (student.completedLessons || []).filter(
                  c => c.subject.toLowerCase() === sub.name.toLowerCase()
                ).length;
                const totalSubjectLessons = 5; // Simplified visual indicator
                const progressPct = Math.min(100, Math.round((subjectCompletedCount / totalSubjectLessons) * 100)) || 20;

                return (
                  <div
                    key={sub.name}
                    onClick={() => {
                      TeacherSpeechEngine.stop();
                      setSelectedSubject(sub.name);
                      setCurrentStep('subject-intro');
                    }}
                    className={`group bg-gradient-to-br ${sub.cardBg} rounded-3xl border-3 ${sub.accentBorder} p-5 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl p-2 rounded-2xl bg-white/90 shadow-2xs">
                          {sub.icon}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${sub.badgeBg}`}>
                          NERDC
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                        {sub.name}
                      </h3>

                      <p className="text-[11px] font-bold text-slate-600">
                        Class Teacher: {activeTeacher.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {sub.topicFocus}
                      </p>
                    </div>

                    {/* Simple Child-Friendly Progress Bar (Section 16) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white overflow-hidden border border-slate-200">
                        <div 
                          className="h-full rounded-full bg-[#026838] transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Start Action Button */}
                    <button
                      type="button"
                      className={`w-full py-2.5 px-4 rounded-xl ${sub.buttonBg} text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs group-hover:shadow transition-all`}
                    >
                      <span>Start {sub.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('learning-mode');
                }}
                className="text-xs font-black uppercase text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Choices</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE E: SUBJECT PAGE / LESSON INTRO (Section 10) */}
        {/* ----------------------------------------------------------------------- */}
        {currentStep === 'subject-intro' && (
          <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] border-3 border-emerald-200 p-6 sm:p-10 shadow-xl space-y-8 animate-fade-in text-center relative overflow-hidden">
            {/* Teacher Greeting */}
            <div className="max-w-xl mx-auto bg-[#F0FDF4] border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#026838] mx-auto bg-emerald-100">
                {activeTeacher.imageUrl ? (
                  <img src={activeTeacher.imageUrl} alt={activeTeacher.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{activeTeacher.avatarEmoji}</span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#026838] font-display uppercase">
                {selectedSubject}
              </h2>
              <p className="text-sm font-bold text-slate-700">
                "Wonderful! Let's begin today's {selectedSubject} lesson."
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleListenAgain}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider hover:bg-amber-50 cursor-pointer shadow-2xs"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>🔊 Listen Again</span>
                </button>
              </div>
            </div>

            {/* Clean Lesson Card (Section 10) */}
            <div className="max-w-xl mx-auto bg-white border-3 border-[#FFD54F] rounded-3xl p-6 sm:p-8 text-left shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-[#026838] uppercase">
                  Ready to learn?
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Primary {selectedSubjectLesson.grade} • Term {selectedSubjectLesson.term || 1}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider block">
                  Today's lesson:
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-1">
                  {selectedSubjectLesson.topic}
                </h3>
                {selectedSubjectLesson.subtopic && (
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {selectedSubjectLesson.subtopic}
                  </p>
                )}
              </div>

              {/* Standard 30-Minute Lesson Notice */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                <Clock className="w-4 h-4 text-[#026838] shrink-0" />
                <span>30-minute structured interactive lesson with {activeTeacher.name}.</span>
              </div>

              {/* START CLASS (Section 10) */}
              <button
                id="subject-start-class-btn"
                type="button"
                onClick={() => handleStartClass(selectedSubjectLesson)}
                className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-[#026838] hover:bg-[#014d28] text-white font-black text-lg uppercase tracking-wider shadow-[0_5px_0_0_#013b1f] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>START CLASS</span>
                <Play className="w-5 h-5 fill-white" />
              </button>
            </div>

            {/* Back Navigation */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('subject-picker');
                }}
                className="text-xs font-black uppercase text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Choose a different subject</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* STAGE F: MY LEARNING - SIMPLE PROGRESS VIEW (Section 16) */}
        {/* ----------------------------------------------------------------------- */}
        {currentStep === 'my-learning' && (
          <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] border-3 border-emerald-200 p-6 sm:p-10 shadow-xl space-y-6 animate-fade-in text-left relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-emerald-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-xs font-black text-amber-900 uppercase">
                  <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>My Learning Progress</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-1">
                  {student.name}’s Achievements
                </h2>
                <p className="text-xs font-medium text-slate-600">
                  Primary {student.grade} • Look how much you have learned!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('welcome');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#026838] text-white font-black text-xs uppercase tracking-wider hover:bg-[#014d28] cursor-pointer self-start sm:self-auto shadow-2xs"
              >
                Continue Learning ➔
              </button>
            </div>

            {/* Simple Subject Progress Bars (Section 16 example) */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                My Subjects
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Mathematics', score: 88, emoji: '📘' },
                  { name: 'English Studies', score: 92, emoji: '📖' },
                  { name: 'Basic Science & Technology', score: 85, emoji: '🔬' },
                  { name: 'Social Studies', score: 80, emoji: '🌍' },
                ].map((item) => (
                  <div key={item.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <span>{item.emoji}</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="text-[#026838] font-black">{item.score}%</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[#026838] transition-all"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 block text-right">
                      {item.score >= 85 ? '🌟 Mastered' : '👍 Learning Well'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Earned */}
            <div className="pt-2 space-y-3">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                My Stars & Badges
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { label: 'Place Value Pioneer', emoji: '🥇' },
                  { label: 'Fractions Explorer', emoji: '🍞' },
                  { label: 'Living Things Champion', emoji: '🌱' },
                  { label: 'Daily Learner Star', emoji: '⭐' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 bg-[#FFFBEB] px-3.5 py-2 rounded-xl border border-[#FFD54F] text-xs font-black text-amber-950 shadow-2xs">
                    <span className="text-base">{b.emoji}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('welcome');
                }}
                className="text-xs font-black uppercase text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Classroom</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  TeacherSpeechEngine.stop();
                  setCurrentStep('learning-mode');
                }}
                className="px-6 py-3 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer"
              >
                Start Today's Lesson ➔
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER: REASSURING SLOGAN & NIGERIAN IDENTITY */}
      {/* ========================================================================= */}
      <footer className="text-center py-4 px-4 text-xs font-bold text-slate-500">
        <p>LEARN. UNDERSTAND. PRACTICE. MASTER. • Nigerian NERDC Primary 1–6</p>
      </footer>
    </div>
  );
};
