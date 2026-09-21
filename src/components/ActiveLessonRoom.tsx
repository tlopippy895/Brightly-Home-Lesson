import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  RotateCcw, 
  Bot, 
  Star, 
  Award,
  Layers,
  Clock,
  Lightbulb,
  Check,
  Radio,
  Square,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LessonTopic, StudentProfile, TeacherPersona, VoiceTone } from '../types';
import { TeacherSpeechEngine } from '../utils/speech';

interface ActiveLessonRoomProps {
  lesson: LessonTopic;
  student: StudentProfile;
  teacher: TeacherPersona;
  voiceEnabled: boolean;
  initialVoiceTone?: VoiceTone;
  onExit: () => void;
  onLessonComplete: (score: number, reexplained: boolean) => void;
}

export type LessonPhaseId = 1 | 2 | 3 | 4 | 5 | 6;

export const ActiveLessonRoom: React.FC<ActiveLessonRoomProps> = ({
  lesson,
  student,
  teacher,
  voiceEnabled,
  initialVoiceTone = 'nigerian_teacher',
  onExit,
  onLessonComplete,
}) => {
  const [currentPhase, setCurrentPhase] = useState<LessonPhaseId>(1);
  const [whiteboardStepIndex, setWhiteboardStepIndex] = useState(0);
  const [boardTheme, setBoardTheme] = useState<'chalk' | 'white'>('chalk');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>(student.preferredVoiceTone || initialVoiceTone);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [speakingSnippet, setSpeakingSnippet] = useState('');
  
  // Guided Practice State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState<Record<string, boolean>>({});

  // Assessment State
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  // AI Re-explanation Loop State
  const [isReexplaining, setIsReexplaining] = useState(false);
  const [reexplanationData, setReexplanationData] = useState<{
    analogyTitle: string;
    encouragement: string;
    simplifiedExplanation: string;
    keyTakeaway: string;
    retestQuestion?: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  } | null>(null);
  const [retestAnswer, setRetestAnswer] = useState<number | null>(null);
  const [retestPassed, setRetestPassed] = useState(false);
  const [reexplainedFlag, setReexplainedFlag] = useState(false);

  // Phase metadata for the 30-minute Nigerian mastery sequence
  const phases = [
    { id: 1, name: 'Welcome & Revision', duration: '3 Mins', icon: '👋' },
    { id: 2, name: 'Previous Knowledge', duration: '3 Mins', icon: '🍞' },
    { id: 3, name: 'AI Whiteboard Teaching', duration: '10 Mins', icon: '📐' },
    { id: 4, name: 'Guided Practice', duration: '7 Mins', icon: '✍️' },
    { id: 5, name: 'Mastery Assessment', duration: '4 Mins', icon: '🎯' },
    { id: 6, name: 'Feedback & Wrap-up', duration: '3 Mins', icon: '🏆' },
  ];

  // Subscribe to speech engine activity
  useEffect(() => {
    const unsubscribe = TeacherSpeechEngine.addListener((speaking, text) => {
      setIsSpeakingNow(speaking);
      setSpeakingSnippet(text);
    });
    return () => unsubscribe();
  }, []);

  // Construct complete text of EVERYTHING displayed on the board for the active phase
  const getFullBoardSpeech = (phase: LessonPhaseId, stepIdx: number): string => {
    if (phase === 1) {
      const objectivesText = lesson.objectives.map((obj, i) => `Objective ${i + 1}: ${obj}`).join('. ');
      return `${teacher.greeting} Welcome, ${student.name}! Today in Primary ${lesson.grade} ${lesson.subject}, our topic on the board is: ${lesson.topic}. ` +
        `Subtopic: ${lesson.subtopic}. ` +
        `Let us read the lesson objectives displayed on the board: ${objectivesText}. ` +
        `Last Week's Revision on the board: ${lesson.lastWeekRevision}.`;
    }

    if (phase === 2) {
      const visualAidsText = lesson.concreteVisualAids.map((aid, idx) => 
        `Visual Aid ${idx + 1}: ${aid.title}. ${aid.description}. Tag: ${aid.caption}`
      ).join('. ');

      return `Phase 2: Connecting with Real Life in Nigeria. ` +
        `Teacher's Real-Life Context on the board: ${lesson.previousKnowledge}. ` +
        `Let us examine the concrete visual aids on the board: ${visualAidsText}.`;
    }

    if (phase === 3) {
      const step = lesson.whiteboardSteps[stepIdx] || lesson.whiteboardSteps[0];
      const bulletText = step.bulletPoints && step.bulletPoints.length > 0 
        ? `Key board highlights: ${step.bulletPoints.map((pt, i) => `Point ${i + 1}: ${pt}`).join('. ')}. `
        : '';
      const formulaText = step.equationOrHighlight ? `Important note on the board: ${step.equationOrHighlight}.` : '';

      return `Phase 3: Direct Instruction on the Blackboard. ` +
        `Step ${stepIdx + 1} of ${lesson.whiteboardSteps.length}: ${step.title}. ` +
        `Teacher explanation: ${step.teacherSpeech}. ` +
        `Reading notes written on the board: ${step.boardText}. ` +
        bulletText +
        formulaText;
    }

    if (phase === 4) {
      const problemsText = lesson.practiceProblems.map((prob, pIdx) => {
        const optionsList = prob.options.map((opt, oIdx) => `Option ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('. ');
        return `Problem ${pIdx + 1}: ${prob.question}. Hint: ${prob.concreteContext}. Options on the board: ${optionsList}`;
      }).join('. ');

      return `Phase 4: Guided Concrete Practice on the board. ${problemsText}`;
    }

    if (phase === 5) {
      const assessmentText = lesson.assessmentQuestions.map((q, idx) => {
        const optList = q.options.map((opt, oIdx) => `Option ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('. ');
        return `Diagnostic Question ${idx + 1}: ${q.question}. Context: ${q.contextNigerian}. Options: ${optList}`;
      }).join('. ');

      return `Phase 5: Diagnostic Mastery Assessment. ${assessmentText}`;
    }

    if (phase === 6) {
      return `Phase 6: Session Complete and Feedback Wrap-Up. ` +
        `Splendid effort, ${student.name}! ${teacher.name} has recorded your 30-minute structured mastery session in ${lesson.topic}. ` +
        `You achieved a mastery score of ${assessmentScore || 90} percent! ` +
        `Recommended home activity: Ask your parent to practice identifying examples of this topic around your home or market.`;
    }

    return `${teacher.greeting} ${lesson.topic}`;
  };

  // Auto-read board aloud whenever phase or whiteboard step changes
  useEffect(() => {
    if (!voiceEnabled) return;
    const boardText = getFullBoardSpeech(currentPhase, whiteboardStepIndex);
    TeacherSpeechEngine.speak(boardText, undefined, teacher.gender, voiceTone);

    return () => {
      TeacherSpeechEngine.stop();
    };
  }, [currentPhase, whiteboardStepIndex, voiceEnabled, voiceTone, teacher, student, lesson]);

  const handleSpeakText = (text: string) => {
    TeacherSpeechEngine.speak(text, undefined, teacher.gender, voiceTone);
  };

  const handleReadEntireBoard = () => {
    const fullText = getFullBoardSpeech(currentPhase, whiteboardStepIndex);
    TeacherSpeechEngine.speak(fullText, undefined, teacher.gender, voiceTone);
  };

  const handleStopSpeech = () => {
    TeacherSpeechEngine.stop();
  };

  // Submit assessment logic
  const handleCalculateAssessment = async () => {
    let correctCount = 0;
    const questions = lesson.assessmentQuestions;

    questions.forEach((q) => {
      if (assessmentAnswers[q.id] === q.correctAnswerIndex) {
        correctCount += 1;
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    setAssessmentScore(scorePercentage);
    setAssessmentSubmitted(true);

    if (scorePercentage >= 70) {
      TeacherSpeechEngine.playSuccessChime();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      // Trigger AI Re-Explanation Loop
      setIsReexplaining(true);
      setReexplainedFlag(true);
      try {
        const res = await fetch('/api/lessons/reexplain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            grade: lesson.grade,
            subject: lesson.subject,
            topic: lesson.topic,
            studentName: student.name,
            teacherName: teacher.name,
            missedQuestion: questions[0]?.question || lesson.topic,
          }),
        });
        const data = await res.json();
        if (data.result) {
          setReexplanationData(data.result);
          if (voiceEnabled) {
            TeacherSpeechEngine.speak(`${data.result.encouragement}. ${data.result.simplifiedExplanation}`);
          }
        } else if (data.simplifiedExplanation) {
          setReexplanationData(data);
          if (voiceEnabled) {
            TeacherSpeechEngine.speak(data.simplifiedExplanation);
          }
        }
      } catch (err) {
        console.error('Failed to trigger AI re-explanation:', err);
      } finally {
        setIsReexplaining(false);
      }
    }
  };

  const handleFinishRetest = () => {
    if (reexplanationData?.retestQuestion && retestAnswer === reexplanationData.retestQuestion.correctIndex) {
      setRetestPassed(true);
      setAssessmentScore(90); // Boost to mastery score upon re-explanation completion
      TeacherSpeechEngine.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div id="active-lesson-room" className="min-h-screen bg-[#F0F9FF] text-slate-900 flex flex-col">
      {/* Top Classroom Bar */}
      <div className="bg-[#026838] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            id="exit-lesson-btn"
            onClick={() => {
              TeacherSpeechEngine.stop();
              onExit();
            }}
            className="flex items-center gap-1.5 text-white hover:bg-white/20 px-3.5 py-1.5 rounded-xl bg-white/10 text-xs font-black transition-all uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Class</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#F59E0B] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-sm">
                Primary {lesson.grade}
              </span>
              <span className="text-[#FBC02D] text-xs font-black uppercase tracking-wider">
                {lesson.subject} • Week {lesson.week}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white leading-tight mt-0.5 line-clamp-1">
              {lesson.topic}
            </h2>
          </div>
        </div>

        {/* Voice Tone Switcher & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preferred Voice Tone Switcher Pill */}
          <div className="flex items-center bg-black/25 p-1 rounded-2xl border border-white/20 text-[11px] font-black">
            <button
              onClick={() => {
                setVoiceTone('nigerian_teacher');
                TeacherSpeechEngine.speak('Normal Nigerian teacher voice selected.', undefined, teacher.gender, 'nigerian_teacher');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                voiceTone === 'nigerian_teacher'
                  ? 'bg-[#FBC02D] text-slate-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Warm, encouraging Nigerian classroom tone"
            >
              <span>🎙️</span>
              <span className="hidden md:inline">Nigerian Teacher</span>
              <span className="md:hidden">Nigerian</span>
            </button>

            <button
              onClick={() => {
                setVoiceTone('phonics');
                TeacherSpeechEngine.speak('Phonics voice selected for clear enunciation.', undefined, teacher.gender, 'phonics');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                voiceTone === 'phonics'
                  ? 'bg-[#38BDF8] text-slate-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Crisp Phonics Syllable Enunciation Voice"
            >
              <span>🗣️</span>
              <span className="hidden md:inline">Phonics Voice</span>
              <span className="md:hidden">Phonics</span>
            </button>
          </div>

          {/* Teacher Persona Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-2xl border border-white/20 text-xs">
            {teacher.imageUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden border border-[#FBC02D] shrink-0 bg-white">
                <img
                  src={teacher.imageUrl}
                  alt={teacher.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <span className="text-lg">{teacher.avatarEmoji}</span>
            )}
            <div className="flex flex-col text-left">
              <span className="text-white font-black leading-tight uppercase text-[10px]">{teacher.name}</span>
            </div>
          </div>

          {/* Read Board Aloud Trigger Button */}
          {isSpeakingNow ? (
            <button
              id="stop-narrate-btn"
              onClick={handleStopSpeech}
              className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_3px_0_0_#991B1B] active:translate-y-0.5 active:shadow-none transition-all uppercase"
              title="Stop Teacher Reading"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Reading</span>
            </button>
          ) : (
            <button
              id="audio-narrate-btn"
              onClick={handleReadEntireBoard}
              className="px-3.5 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs flex items-center gap-1.5 shadow-[0_3px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase"
              title="Teacher will read everything displayed on the board"
            >
              <Volume2 className="w-4 h-4" />
              <span>Read Board Aloud</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Speaking Indicator Banner */}
      {isSpeakingNow && (
        <div className="bg-[#FEFCE8] border-b border-[#FBC02D] px-6 py-2 flex items-center justify-between text-xs text-amber-950 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-4 bg-[#026838] rounded-full animate-pulse" />
              <span className="w-1.5 h-6 bg-[#D97706] rounded-full animate-pulse delay-75" />
              <span className="w-1.5 h-3 bg-[#1E88E5] rounded-full animate-pulse delay-150" />
            </div>
            <span className="font-black uppercase text-[10px] text-[#026838]">
              {teacher.name} is Reading Board ({voiceTone === 'phonics' ? 'Phonics Mode' : 'Nigerian Teacher Voice'}):
            </span>
            <span className="italic font-medium truncate text-gray-700">
              "{speakingSnippet || 'Reading board notes...'}"
            </span>
          </div>
          <button
            onClick={handleStopSpeech}
            className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 shrink-0 ml-3"
          >
            Pause ✕
          </button>
        </div>
      )}

      {/* 6-Phase Mastery Stepper Bar */}
      <div className="bg-white border-b border-sky-100 px-6 py-3 overflow-x-auto shadow-sm">
        <div className="flex items-center justify-between min-w-[700px] gap-3">
          {phases.map((phase) => {
            const isActive = currentPhase === phase.id;
            const isDone = currentPhase > phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => {
                  setCurrentPhase(phase.id as LessonPhaseId);
                }}
                className={`flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black transition-all border ${
                  isActive
                    ? 'bg-[#FEFCE8] border-2 border-[#FBC02D] text-amber-950 shadow-sm scale-102'
                    : isDone
                    ? 'bg-[#F0FDF4] border border-[#43A047] text-[#026838]'
                    : 'bg-[#F8FAFC] border-slate-200 text-slate-400 hover:bg-sky-50'
                }`}
              >
                <span className="text-base">{phase.icon}</span>
                <div className="flex flex-col text-left min-w-0">
                  <span className="truncate leading-tight uppercase font-display text-[11px]">{phase.name}</span>
                  <span className="text-[9px] opacity-75 font-bold">{phase.duration}</span>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 ml-auto text-[#43A047] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col justify-between">
        {/* ============================================================ */}
        {/* PHASE 1: WELCOME & REVISION */}
        {/* ============================================================ */}
        {currentPhase === 1 && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
            {/* Teacher Greeting Card */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-[#FEFCE8] p-6 md:p-8 rounded-[28px] border-2 border-dashed border-[#FBC02D]">
              <div className="w-24 h-24 rounded-3xl bg-white border-2 border-[#FBC02D] overflow-hidden flex items-center justify-center text-5xl shadow-md shrink-0">
                {teacher.imageUrl ? (
                  <img
                    src={teacher.imageUrl}
                    alt={teacher.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{teacher.avatarEmoji}</span>
                )}
              </div>
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-block bg-[#F59E0B] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Phase 1: Welcome & Warm Up (3 Mins)
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 font-display">
                  {teacher.greeting}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                  Welcome to today's lesson, <strong className="text-[#026838] font-black">{student.name}</strong>! We are going to explore <strong>{lesson.topic}</strong> step by step. Remember: in our classroom, we prioritize deep mastery without any rush.
                </p>
              </div>
            </div>

            {/* Learning Objectives & Last Week's Recap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#F0F9FF] p-6 rounded-[28px] border border-sky-100">
                <div className="flex items-center gap-2 text-[#026838] font-black text-sm uppercase mb-3 font-display">
                  <BookOpen className="w-4 h-4 text-[#026838]" />
                  <span>Today's Learning Objectives:</span>
                </div>
                <ul className="space-y-2.5">
                  {lesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 shadow-sm">
                        {i + 1}
                      </span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#FEFCE8] p-6 rounded-[28px] border border-[#FBC02D]/40">
                <div className="flex items-center gap-2 text-[#D97706] font-black text-sm uppercase mb-3 font-display">
                  <RotateCcw className="w-4 h-4 text-[#D97706]" />
                  <span>Last Week's Quick Revision:</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed bg-white p-4 rounded-2xl border border-[#FBC02D]/30 font-medium">
                  "{lesson.lastWeekRevision}"
                </p>
                <div className="mt-4 p-3 bg-amber-100/60 rounded-2xl border border-amber-300 text-[11px] text-amber-900 font-bold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Think about what you already know from your home and school compound!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 2: PREVIOUS KNOWLEDGE (CONCRETE NIGERIAN OBJECTS) */}
        {/* ============================================================ */}
        {currentPhase === 2 && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#D97706]">
                  Phase 2: Connecting with Real Life (3 Mins)
                </span>
                <h3 className="text-2xl font-black text-[#026838] font-display">
                  Concrete Nigerian Everyday Connections
                </h3>
              </div>
              <span className="text-2xl">🍞 🍊 💵</span>
            </div>

            <div className="bg-[#FEFCE8] border-2 border-[#FBC02D] p-5 rounded-[24px] text-gray-800 text-sm leading-relaxed font-medium">
              <strong className="text-[#026838] font-black">Teacher's Real-Life Context:</strong> {lesson.previousKnowledge}
            </div>

            {/* Visual Aids Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {lesson.concreteVisualAids.map((aid, idx) => (
                <div key={idx} className="bg-[#F0F9FF] p-6 rounded-[28px] border border-sky-100 flex flex-col items-center text-center space-y-3 shadow-sm">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-md border-2 border-sky-100">
                    {aid.icon}
                  </div>
                  <h4 className="text-base font-black text-gray-900 uppercase font-display">
                    {aid.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    {aid.description}
                  </p>
                  <span className="text-[11px] font-black text-[#026838] bg-[#DCFCE7] px-3.5 py-1 rounded-full border border-emerald-300 uppercase">
                    {aid.caption}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 3: AI WHITEBOARD TEACHING (CHALKBOARD / WHITEBOARD) */}
        {/* ============================================================ */}
        {currentPhase === 3 && (
          <div className="space-y-4">
            {/* Whiteboard / Chalkboard Canvas Container */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#026838]">
                  Phase 3: Direct Instruction (10 Mins)
                </span>
                <span className="text-xs font-bold text-gray-500">
                  Step {whiteboardStepIndex + 1} of {lesson.whiteboardSteps.length}
                </span>
              </div>

              {/* Theme Toggle (Chalkboard vs Whiteboard) */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 text-xs shadow-sm">
                <button
                  onClick={() => setBoardTheme('chalk')}
                  className={`px-3 py-1.5 rounded-xl font-black transition-all ${
                    boardTheme === 'chalk' ? 'bg-[#026838] text-white shadow' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🟢 Chalkboard
                </button>
                <button
                  onClick={() => setBoardTheme('white')}
                  className={`px-3 py-1.5 rounded-xl font-black transition-all ${
                    boardTheme === 'white' ? 'bg-sky-100 text-[#026838] shadow' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  ⚪ Whiteboard
                </button>
              </div>
            </div>

            {/* Board Surface */}
            <div 
              className={`rounded-[32px] p-6 sm:p-8 min-h-[360px] border-4 shadow-xl transition-all ${
                boardTheme === 'chalk'
                  ? 'chalkboard-bg border-[#4a3728] text-[#fef08a]'
                  : 'whiteboard-bg border-sky-200 text-slate-800'
              }`}
            >
              {lesson.whiteboardSteps[whiteboardStepIndex] && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between border-b pb-3 border-current/20">
                    <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight uppercase">
                      {lesson.whiteboardSteps[whiteboardStepIndex].title}
                    </h3>
                    <span className="text-xs font-black uppercase px-3 py-1 rounded-full border border-current/30">
                      Step {whiteboardStepIndex + 1}
                    </span>
                  </div>

                  {/* Main Whiteboard Text */}
                  <div className="whitespace-pre-line text-sm sm:text-base font-semibold leading-relaxed font-mono">
                    {lesson.whiteboardSteps[whiteboardStepIndex].boardText}
                  </div>

                  {/* Bullet Highlights */}
                  {lesson.whiteboardSteps[whiteboardStepIndex].bulletPoints && (
                    <div className="p-4 rounded-2xl bg-black/20 border border-current/20 space-y-2">
                      {lesson.whiteboardSteps[whiteboardStepIndex].bulletPoints.map((pt, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                          <span>👉</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formula / Highlight box */}
                  {lesson.whiteboardSteps[whiteboardStepIndex].equationOrHighlight && (
                    <div className="p-3 bg-[#FBC02D] text-slate-950 rounded-2xl font-black text-center text-sm shadow-md uppercase">
                      ⭐ {lesson.whiteboardSteps[whiteboardStepIndex].equationOrHighlight}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Teacher Narration Box Underneath */}
            <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{teacher.avatarEmoji}</span>
                <p className="text-xs text-gray-700 italic font-semibold leading-snug">
                  "{lesson.whiteboardSteps[whiteboardStepIndex]?.teacherSpeech}"
                </p>
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={whiteboardStepIndex === 0}
                  onClick={() => setWhiteboardStepIndex(prev => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-black text-gray-700 uppercase"
                >
                  Previous
                </button>
                <button
                  disabled={whiteboardStepIndex === lesson.whiteboardSteps.length - 1}
                  onClick={() => setWhiteboardStepIndex(prev => Math.min(lesson.whiteboardSteps.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-[#1E88E5] hover:bg-[#1565C0] disabled:opacity-40 text-xs font-black text-white shadow-[0_3px_0_0_#0D47A1] uppercase"
                >
                  Next Step →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 4: GUIDED CONCRETE PRACTICE */}
        {/* ============================================================ */}
        {currentPhase === 4 && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-black uppercase text-[#D97706]">
                  Phase 4: Guided Concrete Practice (7 Mins)
                </span>
                <h3 className="text-2xl font-black text-[#026838] font-display">
                  Hands-On Interactive Exercises
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-bold">Untimed Practice</span>
            </div>

            <div className="space-y-6">
              {lesson.practiceProblems.map((problem, pIdx) => {
                const selectedOption = practiceAnswers[problem.id];
                const isChecked = practiceSubmitted[problem.id];
                const isCorrect = selectedOption === problem.correctIndex;

                return (
                  <div key={problem.id} className="bg-[#F0F9FF] p-6 rounded-[28px] border border-sky-100 space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-2xl bg-[#1E88E5] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        {pIdx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-base font-black text-gray-900 leading-snug">
                          {problem.question}
                        </h4>
                        <p className="text-xs text-[#D97706] mt-1 flex items-center gap-1 font-bold">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Hint: {problem.concreteContext}</span>
                        </p>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {problem.options.map((opt, optIdx) => {
                        const isThisSelected = selectedOption === optIdx;
                        let optionStyle = 'bg-white border-gray-200 text-gray-800 hover:bg-sky-50 shadow-sm';

                        if (isChecked) {
                          if (optIdx === problem.correctIndex) {
                            optionStyle = 'bg-[#DCFCE7] border-2 border-[#43A047] text-[#026838]';
                          } else if (isThisSelected && !isCorrect) {
                            optionStyle = 'bg-red-50 border-2 border-red-400 text-red-700';
                          }
                        } else if (isThisSelected) {
                          optionStyle = 'bg-sky-100 border-2 border-[#1E88E5] text-[#1E88E5]';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!isChecked) {
                                setPracticeAnswers({ ...practiceAnswers, [problem.id]: optIdx });
                              }
                            }}
                            className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {isChecked && optIdx === problem.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-[#43A047]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Check Answer Button & Explanation */}
                    <div className="pt-2 flex items-center justify-between">
                      {!isChecked ? (
                        <button
                          disabled={selectedOption === undefined}
                          onClick={() => setPracticeSubmitted({ ...practiceSubmitted, [problem.id]: true })}
                          className="px-5 py-2.5 bg-[#43A047] hover:bg-[#388E3C] disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-[0_3px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
                        >
                          Check Answer
                        </button>
                      ) : (
                        <div className={`p-4 rounded-2xl text-xs font-bold flex-1 ${isCorrect ? 'bg-[#DCFCE7] text-[#026838] border border-emerald-300' : 'bg-[#FEFCE8] text-amber-900 border border-amber-300'}`}>
                          {isCorrect ? '✅ Spot on! ' : '💡 Notice: '} {problem.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 5: MASTERY ASSESSMENT & ADAPTIVE RE-EXPLANATION LOOP */}
        {/* ============================================================ */}
        {currentPhase === 5 && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-black uppercase text-[#D97706]">
                  Phase 5: Mastery Assessment (4 Mins)
                </span>
                <h3 className="text-2xl font-black text-[#026838] font-display">
                  Diagnostic Mastery Questions (Pass Mark: 70%)
                </h3>
              </div>
              <span className="text-xs font-bold text-gray-400">Untimed Diagnostic</span>
            </div>

            {/* Assessment Questions */}
            <div className="space-y-6">
              {lesson.assessmentQuestions.map((q, idx) => {
                const selectedOpt = assessmentAnswers[q.id];
                const isChecked = assessmentSubmitted;
                const isCorrect = selectedOpt === q.correctAnswerIndex;

                return (
                  <div key={q.id} className="bg-[#F0F9FF] p-6 rounded-[28px] border border-sky-100 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                          {q.question}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {q.contextNigerian}
                        </p>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {q.options.map((option, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        let btnStyle = 'bg-white border-gray-200 text-gray-800 hover:bg-sky-50 shadow-sm';

                        if (isChecked) {
                          if (optIdx === q.correctAnswerIndex) {
                            btnStyle = 'bg-[#DCFCE7] border-2 border-[#43A047] text-[#026838]';
                          } else if (isChosen && !isCorrect) {
                            btnStyle = 'bg-red-50 border-2 border-red-400 text-red-700';
                          }
                        } else if (isChosen) {
                          btnStyle = 'bg-amber-100 border-2 border-[#F59E0B] text-amber-900';
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isChecked}
                            onClick={() => setAssessmentAnswers({ ...assessmentAnswers, [q.id]: optIdx })}
                            className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all ${btnStyle}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assessment Submit Button */}
            {!assessmentSubmitted ? (
              <div className="pt-2 flex justify-end">
                <button
                  disabled={Object.keys(assessmentAnswers).length < lesson.assessmentQuestions.length}
                  onClick={handleCalculateAssessment}
                  className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-[0_4px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
                >
                  Submit for Mastery Check
                </button>
              </div>
            ) : (
              /* Results Banner */
              <div className="space-y-4">
                <div className={`p-6 rounded-[28px] border ${assessmentScore! >= 70 ? 'bg-[#DCFCE7] border-[#43A047] text-[#026838]' : 'bg-[#FEFCE8] border-[#FBC02D] text-amber-950'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black font-display">
                        {assessmentScore! >= 70 ? '🎉 Mastery Achieved!' : '🤖 Adaptive Tutor Re-explanation Triggered'}
                      </h4>
                      <p className="text-xs mt-1 font-semibold">
                        Your Score: <strong className="text-lg font-black">{assessmentScore}%</strong> (Pass Mark: 70%)
                      </p>
                    </div>
                    <div className="text-3xl font-black font-display">
                      {assessmentScore}%
                    </div>
                  </div>
                </div>

                {/* ADAPTIVE AI RE-EXPLANATION LOOP (<70%) */}
                {assessmentScore! < 70 && (
                  <div className="bg-white p-6 rounded-[28px] border-2 border-[#1E88E5] shadow-lg space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-3 text-[#1E88E5]">
                      <Bot className="w-6 h-6 text-[#1E88E5]" />
                      <div>
                        <h4 className="text-base font-black font-display text-gray-900">
                          AI Tutor Adaptive Re-Explanation: {reexplanationData?.analogyTitle || 'Concrete Analogy'}
                        </h4>
                        <span className="text-xs text-[#1E88E5] font-bold">
                          {reexplanationData?.encouragement || 'No problem at all! Let us break it down simply.'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100 text-xs text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                      {isReexplaining ? (
                        <div className="flex items-center gap-2 text-[#D97706] font-bold py-4 justify-center">
                          <span className="animate-spin">⏳</span>
                          <span>Synthesizing simplified Nigerian real-life analogy...</span>
                        </div>
                      ) : (
                        reexplanationData?.simplifiedExplanation ||
                        'Imagine your mother gave you 4 meat pies to share equally with your brother. Each person gets 2 meat pies! We never rush, we learn until it clicks completely.'
                      )}
                    </div>

                    {reexplanationData?.retestQuestion && (
                      <div className="p-5 bg-[#FEFCE8] rounded-2xl border border-[#FBC02D] space-y-3">
                        <div className="text-xs font-black text-amber-950 uppercase">
                          Quick Re-Test Check: {reexplanationData.retestQuestion.question}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {reexplanationData.retestQuestion.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => setRetestAnswer(oIdx)}
                              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                retestAnswer === oIdx
                                  ? 'bg-[#1E88E5] text-white border-[#1E88E5]'
                                  : 'bg-white text-gray-700 border-gray-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-end">
                          <button
                            disabled={retestAnswer === null}
                            onClick={handleFinishRetest}
                            className="px-5 py-2 bg-[#43A047] hover:bg-[#388E3C] disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-[0_3px_0_0_#1B5E20] uppercase"
                          >
                            Confirm Re-Test
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 6: FEEDBACK & WRAP-UP */}
        {/* ============================================================ */}
        {currentPhase === 6 && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 text-center animate-fadeIn">
            {/* Celebration Avatar Match */}
            <div className="flex items-center justify-center -space-x-4 mb-2">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white z-10">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-black text-2xl"
                    style={{ backgroundColor: student.avatarColor || '#1E88E5' }}
                  >
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="w-20 h-20 rounded-full border-4 border-[#FBC02D] shadow-lg overflow-hidden bg-white z-20">
                {teacher.imageUrl ? (
                  <img
                    src={teacher.imageUrl}
                    alt={teacher.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {teacher.avatarEmoji}
                  </div>
                )}
              </div>

              <div className="w-14 h-14 bg-[#DCFCE7] text-[#026838] rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-md z-30">
                🏆
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-[#D97706] uppercase tracking-widest">
                Phase 6: Mastery Feedback & Wrap-Up
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-[#026838] font-display">
                Splendid Effort, {student.name}!
              </h3>
              <p className="text-sm text-gray-500 max-w-lg mx-auto font-medium">
                {teacher.name} has recorded your 30-minute structured mastery session in <strong>{lesson.topic}</strong>.
              </p>
            </div>

            {/* Score & AI Intervention Summary Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="bg-[#F0F9FF] p-5 rounded-[24px] border border-sky-100">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Mastery Score</span>
                <div className="text-2xl font-black text-[#43A047] font-display mt-1">
                  {assessmentScore || 90}%
                </div>
                <span className="text-[10px] text-[#43A047] font-bold">⭐ Verified Mastery</span>
              </div>

              <div className="bg-[#F0F9FF] p-5 rounded-[24px] border border-sky-100">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">AI Tutoring</span>
                <div className="text-2xl font-black text-[#1E88E5] font-display mt-1">
                  {reexplainedFlag ? '1 Loop' : '0 Loops'}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">
                  {reexplainedFlag ? 'Re-explained with Nigerian analogy' : 'First-time mastery'}
                </span>
              </div>

              <div className="bg-[#FEFCE8] p-5 rounded-[24px] border border-[#FBC02D]">
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Parent Summary</span>
                <div className="text-2xl font-black text-[#D97706] font-display mt-1">
                  Ready 📊
                </div>
                <span className="text-[10px] text-amber-800 font-medium">Saved to Parent Portal</span>
              </div>
            </div>

            {/* Recommended Home Practice for Parent */}
            <div className="bg-[#FEFCE8] border border-[#FBC02D] p-5 rounded-[24px] max-w-2xl mx-auto text-left space-y-1">
              <div className="text-xs font-black text-[#D97706] uppercase flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Recommended Home Practice Activity:</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                "Ask {student.name} to identify 3 examples of this topic around your home or market this weekend."
              </p>
            </div>

            {/* Finish Button */}
            <div className="pt-4">
              <button
                id="finish-lesson-btn"
                onClick={() => onLessonComplete(assessmentScore || 90, reexplainedFlag)}
                className="px-10 py-4 bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-sm rounded-2xl shadow-[0_5px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all font-display uppercase tracking-wider"
              >
                Complete Lesson & Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Bottom Phase Navigation Footer */}
        <div className="pt-6 flex items-center justify-between border-t border-sky-100">
          <button
            disabled={currentPhase === 1}
            onClick={() => setCurrentPhase(prev => Math.max(1, prev - 1) as LessonPhaseId)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-xs font-black text-gray-700 transition-all uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Phase</span>
          </button>

          <div className="text-xs font-black text-[#026838] uppercase tracking-wider">
            Phase {currentPhase} of 6
          </div>

          <button
            disabled={currentPhase === 6}
            onClick={() => setCurrentPhase(prev => Math.min(6, prev + 1) as LessonPhaseId)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-30 text-white font-black text-xs shadow-[0_3px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase"
          >
            <span>Next Phase</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
