import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  RotateCcw, 
  Clock, 
  Lightbulb, 
  Square, 
  HelpCircle,
  Award,
  BrainCircuit
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LessonTopic, StudentProfile, TeacherPersona, VoiceTone, MasteryLevel } from '../types';
import { TeacherSpeechEngine } from '../utils/speech';
import { getTeacherForLesson } from '../data/teachers';

interface ActiveLessonRoomProps {
  lesson: LessonTopic;
  student: StudentProfile;
  teacher?: TeacherPersona;
  voiceEnabled: boolean;
  initialVoiceTone?: VoiceTone;
  onExit: () => void;
  onLessonComplete: (score: number, reexplained: boolean, objectivesMastery?: { objective: string; mastered: boolean }[]) => void;
}

export type LessonPhaseId = 1 | 2 | 3 | 4 | 5 | 6;

export const ActiveLessonRoom: React.FC<ActiveLessonRoomProps> = ({
  lesson,
  student,
  teacher: propTeacher,
  voiceEnabled,
  initialVoiceTone = 'nigerian_teacher',
  onExit,
  onLessonComplete,
}) => {
  // Automatically pull and display the correct teacher assigned specifically to this lesson's subject
  const teacher = getTeacherForLesson(lesson) || propTeacher;
  const [currentPhase, setCurrentPhase] = useState<LessonPhaseId>(1);
  const [whiteboardStepIndex, setWhiteboardStepIndex] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState<Record<number, boolean>>({});
  const [boardTheme, setBoardTheme] = useState<'chalk' | 'white'>('chalk');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>(student.preferredVoiceTone || initialVoiceTone);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [speakingSnippet, setSpeakingSnippet] = useState('');

  // Live 30-minute lesson timer (1800 seconds total)
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);

  // Phase 2 Recall State
  const [recallAnswer, setRecallAnswer] = useState<number | null>(null);
  const [recallChecked, setRecallChecked] = useState(false);

  // Guided Practice State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState<Record<string, boolean>>({});

  // Assessment State
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [demonstratedMastery, setDemonstratedMastery] = useState(false);
  const [objectivesMastery, setObjectivesMastery] = useState<{ objective: string; mastered: boolean; details?: string }[]>([]);

  // Adaptive Re-explanation Loop State
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
  const [retestSubmitted, setRetestSubmitted] = useState(false);
  const [retestPassed, setRetestPassed] = useState(false);
  const [reexplainedFlag, setReexplainedFlag] = useState(false);
  const [isLessonSidebarOpen, setIsLessonSidebarOpen] = useState(false);

  // 30-Minute Timer Effect: Gentle, non-anxious countdown that doesn't abruptly terminate lesson
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Phase metadata with child-friendly labels (WELCOME, RECALL, LEARN, PRACTISE, CHECK, MASTER)
  const phases = [
    { id: 1, label: 'WELCOME', title: 'Welcome & Warm-up', duration: '3 Mins', icon: '👋' },
    { id: 2, label: 'RECALL', title: 'Recall Prior Knowledge', duration: '3 Mins', icon: '🍞' },
    { id: 3, label: 'LEARN', title: 'Teacher Explanation', duration: '10 Mins', icon: '📐' },
    { id: 4, label: 'PRACTISE', title: 'Guided Practice', duration: '7 Mins', icon: '✍️' },
    { id: 5, label: 'CHECK', title: 'Check Understanding', duration: '4 Mins', icon: '🎯' },
    { id: 6, label: 'MASTER', title: 'Feedback & Wrap-up', duration: '3 Mins', icon: '🏆' },
  ];

  // Subscribe to speech engine activity
  useEffect(() => {
    const unsubscribe = TeacherSpeechEngine.addListener((speaking, text) => {
      setIsSpeakingNow(speaking);
      setSpeakingSnippet(text);
    });
    return () => unsubscribe();
  }, []);

  // Construct complete verbatim text for the active phase
  const getFullBoardSpeech = (phase: LessonPhaseId, stepIdx: number): string => {
    if (phase === 1) {
      const objectivesText = lesson.objectives.map((obj, i) => `Objective ${i + 1}: ${obj}`).join('. ');
      return `Hello, ${student.name}! Welcome to Brightly Home Lesson. ` +
        `Today we are going to learn something exciting together: ${lesson.topic}. ` +
        `In our classroom, we learn step by step until you master it completely. ` +
        (lesson.subtopic ? `Subtopic: ${lesson.subtopic}. ` : '') +
        `Here are today's learning objectives: ${objectivesText}. ` +
        `Last week's quick revision: "${lesson.lastWeekRevision}".`;
    }

    if (phase === 2) {
      const visualAidsText = lesson.concreteVisualAids.map((aid, idx) => 
        `Visual Aid ${idx + 1}: ${aid.title}. ${aid.description}. Notice: ${aid.caption}.`
      ).join(' ');

      return `Recall and Prior Knowledge. Before we begin, let me see what you remember. ` +
        `Teacher's real-life context: ${lesson.previousKnowledge}. ` +
        `Look at our concrete teaching aids on the board: ${visualAidsText}`;
    }

    if (phase === 3) {
      const step = lesson.whiteboardSteps[stepIdx] || lesson.whiteboardSteps[0];
      const bulletText = step.bulletPoints && step.bulletPoints.length > 0 
        ? `Key board highlights: ${step.bulletPoints.map((pt, i) => `Point ${i + 1}: ${pt}`).join('. ')}. `
        : '';
      const formulaText = step.equationOrHighlight 
        ? `Important highlight: ${step.equationOrHighlight}. ` 
        : '';

      return `Direct Instruction on the Blackboard. ` +
        `Step ${stepIdx + 1} of ${lesson.whiteboardSteps.length}: ${step.title}. ` +
        `Teacher's explanation: ${step.teacherSpeech}. ` +
        `Notes written on the blackboard: ${step.boardText}. ` +
        bulletText +
        formulaText;
    }

    if (phase === 4) {
      const problemsText = lesson.practiceProblems.map((prob, pIdx) => {
        const optionsList = prob.options.map((opt, oIdx) => `Option ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('. ');
        return `Practice Problem ${pIdx + 1}: ${prob.question}. Helpful hint: ${prob.concreteContext}. Options on the board: ${optionsList}.`;
      }).join(' ');

      return `Guided Practice. Hands-on practice with hints. ` +
        `Take your time to answer each question: ${problemsText}`;
    }

    if (phase === 5) {
      if (!assessmentSubmitted) {
        const assessmentText = lesson.assessmentQuestions.map((q, idx) => {
          const optList = q.options.map((opt, oIdx) => `Option ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('. ');
          return `Question ${idx + 1}: ${q.question}. Context: ${q.contextNigerian}. Options: ${optList}.`;
        }).join(' ');

        return `Check Understanding. Let us see how well you understand today's lesson. ` +
          `${assessmentText} Choose your answer on the screen.`;
      } else {
        if (demonstratedMastery) {
          return `Splendid effort, ${student.name}! You demonstrated clear understanding of today's key ideas. You are ready for your session feedback!`;
        } else {
          return `That's okay, ${student.name}! Let us look at this another way together. ` +
            (reexplanationData ? `${reexplanationData.encouragement} ${reexplanationData.simplifiedExplanation}` : '');
        }
      }
    }

    if (phase === 6) {
      return `Well done, ${student.name}! You have completed today's 30-minute home lesson in ${lesson.topic}. ` +
        `${teacher.name} has recorded your progress. ` +
        `Remember to practise around your home or market this weekend!`;
    }

    return `${teacher.greeting} Welcome to ${lesson.topic}`;
  };

  const lastSpokenKeyRef = useRef<string>('');

  // Auto-read board aloud whenever phase or whiteboard step changes
  useEffect(() => {
    if (!voiceEnabled) {
      lastSpokenKeyRef.current = '';
      TeacherSpeechEngine.stop();
      return;
    }

    const currentKey = `${currentPhase}-${whiteboardStepIndex}-${voiceTone}-${teacher.id}-${lesson.id}`;
    if (lastSpokenKeyRef.current === currentKey) {
      return;
    }
    lastSpokenKeyRef.current = currentKey;

    const boardText = getFullBoardSpeech(currentPhase, whiteboardStepIndex);
    TeacherSpeechEngine.speak(boardText, undefined, teacher.gender, voiceTone);
  }, [currentPhase, whiteboardStepIndex, voiceEnabled, voiceTone, teacher.id, teacher.gender, lesson.id]);

  // Clean up speech when component unmounts
  useEffect(() => {
    return () => {
      TeacherSpeechEngine.stop();
    };
  }, []);

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

  // Evaluate understanding without a universal 70% threshold
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

    // Demonstration of understanding: pupil got questions correct or demonstrated high grasp
    const hasDemonstrated = correctCount === questions.length || (questions.length >= 3 && correctCount >= 2);
    setDemonstratedMastery(hasDemonstrated);

    // Determine objective-level mastery from approved curriculum objectives
    const curriculumObjectives = (lesson.objectives && lesson.objectives.length > 0)
      ? lesson.objectives
      : [lesson.topic, lesson.subtopic || `Mastery of ${lesson.topic}`];

    const computedObjectives = curriculumObjectives.map((obj, idx) => {
      // Find question specifically mapped to this objective or fallback to index matching
      const objLower = obj.toLowerCase();
      let matchedQuestion = questions.find(q => {
        const qText = (q.question + ' ' + (q.contextNigerian || '') + ' ' + (q.explanation || '')).toLowerCase();
        if (objLower.includes('proper noun') && qText.includes('proper')) return true;
        if (objLower.includes('abstract noun') && qText.includes('abstract')) return true;
        if (objLower.includes('collective noun') && qText.includes('collective')) return true;
        if (objLower.includes('common noun') && qText.includes('common')) return true;
        if (objLower.includes('define a noun') && (qText.includes('defined') || qText.includes('definition'))) return true;
        return false;
      });

      if (!matchedQuestion) {
        matchedQuestion = questions[idx % questions.length];
      }

      const answeredCorrectly = matchedQuestion 
        ? (assessmentAnswers[matchedQuestion.id] === matchedQuestion.correctAnswerIndex) 
        : false;

      // Assign objective-specific mastery without universal 70% shortcut
      const objMastered = answeredCorrectly;
      const masteryLevel: MasteryLevel = answeredCorrectly 
        ? (scorePercentage === 100 ? 'Strong Mastery' : 'Mastered')
        : (scorePercentage >= 50 ? 'Developing' : 'Beginning');

      return {
        objective: obj,
        mastered: objMastered,
        masteryLevel,
        details: objMastered 
          ? (scorePercentage === 100 ? 'Strong Mastery with fluent retention' : 'Mastered with high competence')
          : (masteryLevel === 'Developing' ? 'Developing understanding • guided reinforcement' : 'Beginning stage • needs practice')
      };
    });
    setObjectivesMastery(computedObjectives);

    if (hasDemonstrated) {
      TeacherSpeechEngine.playSuccessChime();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (voiceEnabled) {
        const celebrationSpeech = `Splendid effort, ${student.name}! You demonstrated clear understanding of today's lesson. You are ready for your wrap-up summary!`;
        TeacherSpeechEngine.speak(celebrationSpeech, undefined, teacher.gender, voiceTone);
      }
    } else {
      // Trigger Adaptive Re-Explanation Loop: "That's okay. Let's try it another way."
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
        const payload = data.result || data;
        setReexplanationData(payload);
        if (voiceEnabled && payload) {
          const reexplainSpeech = `That's okay, ${student.name}! Let's try it another way. ` +
            `${payload.analogyTitle ? `Think of ${payload.analogyTitle}. ` : ''}` +
            `${payload.encouragement || 'Let us break it down simply.'} ` +
            `${payload.simplifiedExplanation || ''} ` +
            (payload.retestQuestion 
              ? `Now, try this quick check: ${payload.retestQuestion.question}. ${payload.retestQuestion.options.map((o: string, i: number) => `Option ${String.fromCharCode(65 + i)}: ${o}`).join('. ')}`
              : '');
          TeacherSpeechEngine.speak(reexplainSpeech, undefined, teacher.gender, voiceTone);
        }
      } catch (err) {
        console.error('Failed to trigger adaptive re-explanation:', err);
      } finally {
        setIsReexplaining(false);
      }
    }
  };

  const handleFinishRetest = () => {
    setRetestSubmitted(true);
    if (reexplanationData?.retestQuestion && retestAnswer === reexplanationData.retestQuestion.correctIndex) {
      setRetestPassed(true);
      setDemonstratedMastery(true);
      setAssessmentScore(90);
      setObjectivesMastery(prev => prev.map(o => ({
        ...o,
        mastered: true,
        masteryLevel: 'Mastered' as MasteryLevel,
        details: 'Mastered with adaptive re-explanation support'
      })));
      TeacherSpeechEngine.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      if (voiceEnabled) {
        TeacherSpeechEngine.speak(
          `Wonderful, ${student.name}! You got it right! Your understanding is now strong and ready.`,
          undefined,
          teacher.gender,
          voiceTone
        );
      }
    } else {
      setRetestPassed(false);
      setDemonstratedMastery(false);
      setObjectivesMastery(prev => prev.map(o => o.mastered ? o : ({
        ...o,
        mastered: false,
        masteryLevel: 'Developing' as MasteryLevel,
        details: 'Developing understanding • further practice guided'
      })));
      if (voiceEnabled) {
        TeacherSpeechEngine.speak(
          `Good try, ${student.name}! We will practise this a little more together with your parent. Every step is progress!`,
          undefined,
          teacher.gender,
          voiceTone
        );
      }
    }
  };

  // Derive simple recall options for Phase 2 based on authentic lesson context
  const recallQuestionData = {
    question: `Before we begin today's topic on ${lesson.topic}, let us recall: what connects to this in everyday life?`,
    options: [
      lesson.previousKnowledge.split('.')[0] || 'Everyday counting and observation at home',
      'Things we see around our compound or school',
      'Sharing and grouping objects with friends and family'
    ]
  };

  return (
    <div id="active-lesson-room" className="min-h-screen bg-[#F0F9FF] text-slate-900 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top Classroom Bar */}
      <div className="bg-[#026838] text-white px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-0 z-30 w-full max-w-full">
        <div className="flex items-center gap-3">
          <button
            id="exit-lesson-btn"
            onClick={() => {
              TeacherSpeechEngine.stop();
              onExit();
            }}
            className="flex items-center gap-1.5 text-white hover:bg-white/20 px-3 py-2 rounded-xl bg-white/10 text-xs font-black transition-all uppercase tracking-wider min-h-[44px]"
            title="Exit classroom"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Class</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#F59E0B] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
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

        {/* Live 30-Minute Timer & Voice Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Gentle Live 30-Minute Timer Badge */}
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/25 border border-white/20 text-white font-bold text-xs shadow-xs min-h-[44px]"
            title="Planned 30-minute lesson duration"
          >
            <Clock className="w-4 h-4 text-[#FBC02D] shrink-0" />
            <span className="tracking-wide">
              {remainingSeconds > 0 
                ? `Lesson time: ${formatTimer(remainingSeconds)} remaining`
                : 'Lesson time: Wrapping up'
              }
            </span>
          </div>

          {/* Mobile Phases Drawer Toggle */}
          <button
            onClick={() => setIsLessonSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors border border-white/20 min-h-[44px]"
            title="View Lesson Phases"
          >
            <span>Phases ({currentPhase}/6)</span>
          </button>

          {/* Teacher Voice Switcher */}
          <div className="flex items-center bg-black/25 p-1 rounded-2xl border border-white/20 text-[11px] font-black">
            <button
              onClick={() => {
                setVoiceTone('nigerian_teacher');
                TeacherSpeechEngine.speak('Nigerian teacher voice selected. Welcome to class!', undefined, teacher.gender, 'nigerian_teacher');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 min-h-[36px] ${
                voiceTone === 'nigerian_teacher'
                  ? 'bg-[#FBC02D] text-slate-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Warm Nigerian classroom tone"
            >
              <span>🎙️</span>
              <span className="hidden md:inline">Nigerian Teacher Voice</span>
              <span className="md:hidden">Nigerian</span>
            </button>

            <button
              onClick={() => {
                setVoiceTone('phonics');
                TeacherSpeechEngine.speak('Phonics voice selected for clear enunciation.', undefined, teacher.gender, 'phonics');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 min-h-[36px] ${
                voiceTone === 'phonics'
                  ? 'bg-[#38BDF8] text-slate-950 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
              title="Crisp Phonics Syllable Voice"
            >
              <span>🗣️</span>
              <span className="hidden md:inline">Phonics Voice</span>
              <span className="md:hidden">Phonics</span>
            </button>
          </div>

          {/* Teacher Persona Badge */}
          <div className="hidden xl:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/20 text-xs">
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

          {/* Global Listen Again / Stop Button */}
          {isSpeakingNow ? (
            <button
              id="stop-narrate-btn"
              onClick={handleStopSpeech}
              className="px-3.5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_3px_0_0_#991B1B] active:translate-y-0.5 active:shadow-none transition-all uppercase min-h-[44px]"
              title="Pause Teacher Reading"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              id="audio-narrate-btn"
              onClick={handleReadEntireBoard}
              className="px-3.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs flex items-center gap-1.5 shadow-[0_3px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase min-h-[44px]"
              title="Listen again to this phase"
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Listen Again</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Speaking Indicator Banner */}
      {isSpeakingNow && (
        <div className="bg-[#FEFCE8] border-b border-[#FBC02D] px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-950 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-4 bg-[#026838] rounded-full animate-pulse" />
              <span className="w-1.5 h-6 bg-[#D97706] rounded-full animate-pulse delay-75" />
              <span className="w-1.5 h-3 bg-[#1E88E5] rounded-full animate-pulse delay-150" />
            </div>
            <span className="font-black uppercase text-[10px] text-[#026838]">
              {teacher.name} Speaking ({voiceTone === 'phonics' ? 'Phonics' : 'Nigerian Voice'}):
            </span>
            <span className="italic font-medium truncate text-gray-700">
              "{speakingSnippet || 'Teaching...'}"
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReadEntireBoard}
              className="text-[10px] font-black uppercase text-[#026838] hover:underline shrink-0"
              title="Re-read from the beginning of this phase"
            >
              🔊 Listen Again
            </button>
            <button
              onClick={handleStopSpeech}
              className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 shrink-0 ml-2"
            >
              Pause ✕
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Child-Friendly Lesson Progress Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
          {phases.map((p) => {
            const isDone = currentPhase > p.id;
            const isCurrent = currentPhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setCurrentPhase(p.id as LessonPhaseId)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-black text-[11px] sm:text-xs transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#FEFCE8] text-amber-950 border-2 border-[#FBC02D] shadow-xs'
                    : isDone
                    ? 'bg-[#DCFCE7] text-[#026838] border border-emerald-300'
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[12px]">
                  {isDone ? '✓' : isCurrent ? '●' : '○'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson Room Layout: Sidebar + Main Stage */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80">
            <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
              30-Minute Master Class
            </span>
            <h3 className="text-sm font-black text-gray-900 uppercase font-display">
              Lesson Rhythm
            </h3>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            {phases.map((phase) => {
              const isActive = currentPhase === phase.id;
              const isDone = currentPhase > phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => setCurrentPhase(phase.id as LessonPhaseId)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer border min-h-[48px] ${
                    isActive
                      ? 'bg-[#FEFCE8] border-2 border-[#FBC02D] text-amber-950 shadow-xs'
                      : isDone
                      ? 'bg-[#F0FDF4] border border-[#43A047] text-[#026838] hover:bg-[#DCFCE7]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-[#FBC02D] text-amber-950 shadow-xs'
                        : isDone
                        ? 'bg-[#43A047] text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {isDone ? '✓' : isActive ? '●' : '○'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-tight leading-tight truncate">
                      {phase.label} — {phase.title}
                    </div>
                    <div className="text-[10px] font-bold opacity-75 leading-tight mt-0.5">
                      {phase.duration}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Teacher Card */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0">
              {teacher.imageUrl ? (
                <img src={teacher.imageUrl} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                teacher.avatarEmoji
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-[#026838] block truncate">
                Your Teacher
              </span>
              <span className="text-xs font-black text-slate-900 block truncate">
                {teacher.name}
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {isLessonSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsLessonSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#026838] tracking-wider block">
                    30-Minute Master Class
                  </span>
                  <h3 className="text-sm font-black text-gray-900 uppercase font-display">
                    Lesson Rhythm
                  </h3>
                </div>
                <button
                  onClick={() => setIsLessonSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 font-bold min-h-[44px]"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                {phases.map((phase) => {
                  const isActive = currentPhase === phase.id;
                  const isDone = currentPhase > phase.id;
                  return (
                    <button
                      key={phase.id}
                      onClick={() => {
                        setCurrentPhase(phase.id as LessonPhaseId);
                        setIsLessonSidebarOpen(false);
                      }}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all border min-h-[48px] ${
                        isActive
                          ? 'bg-[#FEFCE8] border-2 border-[#FBC02D] text-amber-950'
                          : isDone
                          ? 'bg-[#F0FDF4] border border-[#43A047] text-[#026838]'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          isActive
                            ? 'bg-[#FBC02D] text-amber-950'
                            : isDone
                            ? 'bg-[#43A047] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isDone ? '✓' : isActive ? '●' : '○'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black uppercase tracking-tight leading-tight truncate">
                          {phase.label} — {phase.title}
                        </div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">
                          {phase.duration}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Stage Interactive Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between space-y-6">

            {/* ============================================================ */}
            {/* PHASE 1: WELCOME & WARM-UP */}
            {/* ============================================================ */}
            {currentPhase === 1 && (
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                {/* Personal Teacher Greeting Card */}
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
                  <div className="space-y-2 text-center md:text-left flex-1">
                    <div className="inline-block bg-[#F59E0B] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      WELCOME & WARM-UP (3 MINS)
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 font-display">
                      Hello, {student.name}!
                    </h3>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed font-semibold">
                      Welcome to Brightly Home Lesson! Today we are going to learn something exciting together: <strong className="text-[#026838] font-black">{lesson.topic}</strong>. Remember: in our classroom, we learn step by step without rush until you master it completely.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <button
                        onClick={() => handleSpeakText(`Hello, ${student.name}! Welcome to Brightly Home Lesson. Today we are going to learn something exciting together: ${lesson.topic}. In our classroom, we learn step by step without rush until you master it completely.`)}
                        className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs flex items-center gap-1.5 transition-all min-h-[44px]"
                      >
                        <Volume2 className="w-4 h-4 text-amber-700" />
                        <span>🔊 LISTEN AGAIN</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Learning Objectives & Last Week's Recap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#F0F9FF] p-6 rounded-[28px] border border-sky-100 space-y-3">
                    <div className="flex items-center justify-between text-[#026838] font-black text-sm uppercase font-display">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#026838]" />
                        <span>Today's Learning Objectives:</span>
                      </div>
                      <button
                        onClick={() => handleSpeakText(`Today's learning objectives: ${lesson.objectives.map((obj, i) => `Objective ${i + 1}: ${obj}`).join('. ')}`)}
                        className="p-1.5 px-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#026838] transition-all flex items-center gap-1 text-[11px] font-bold min-h-[36px]"
                        title="Read Objectives Aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>🔊 Listen Again</span>
                      </button>
                    </div>
                    <ul className="space-y-2.5">
                      {lesson.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 shadow-xs">
                            {i + 1}
                          </span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#FEFCE8] p-6 rounded-[28px] border border-[#FBC02D]/40 space-y-3">
                    <div className="flex items-center justify-between text-[#D97706] font-black text-sm uppercase font-display">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-[#D97706]" />
                        <span>Last Week's Quick Revision:</span>
                      </div>
                      <button
                        onClick={() => handleSpeakText(`Last week's quick revision: "${lesson.lastWeekRevision}". Think about what you already know!`)}
                        className="p-1.5 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#D97706] transition-all flex items-center gap-1 text-[11px] font-bold min-h-[36px]"
                        title="Read Revision Aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>🔊 Listen Again</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed bg-white p-4 rounded-2xl border border-[#FBC02D]/30 font-medium">
                      "{lesson.lastWeekRevision}"
                    </p>
                    <div className="p-3 bg-amber-100/60 rounded-2xl border border-amber-300 text-[11px] text-amber-900 font-bold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Think about what you already know from your home and school!</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: LET'S BEGIN */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      TeacherSpeechEngine.stop();
                      setCurrentPhase(2);
                    }}
                    className="px-8 py-3.5 bg-[#026838] hover:bg-[#014d28] text-white font-black text-sm rounded-2xl shadow-[0_4px_0_0_#013d20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider flex items-center gap-2 min-h-[48px] cursor-pointer"
                  >
                    <span>LET'S BEGIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* PHASE 2: RECALL / PRIOR KNOWLEDGE */}
            {/* ============================================================ */}
            {currentPhase === 2 && (
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#D97706]">
                      RECALL / PRIOR KNOWLEDGE (3 MINS)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#026838] font-display">
                      Before We Begin: What You Already Know
                    </h3>
                  </div>
                  <button
                    onClick={() => handleSpeakText(`Before we begin, let me see what you remember. Teacher's real-life context: ${lesson.previousKnowledge}`)}
                    className="p-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#D97706] transition-all flex items-center gap-1.5 text-xs font-black min-h-[44px]"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>🔊 LISTEN AGAIN</span>
                  </button>
                </div>

                {/* Teacher's Context Card */}
                <div className="bg-[#FEFCE8] border-2 border-[#FBC02D] p-5 rounded-[24px] text-gray-800 text-sm leading-relaxed font-medium">
                  <strong className="text-[#026838] font-black">Teacher's Real-Life Context:</strong> {lesson.previousKnowledge}
                </div>

                {/* Concrete Visual Aids Display */}
                <div>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                    Everyday Nigerian Teaching Aids
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lesson.concreteVisualAids && lesson.concreteVisualAids.length > 0 ? (
                      lesson.concreteVisualAids.map((aid, idx) => (
                        <div key={idx} className="bg-[#F0F9FF] p-5 rounded-[24px] border border-sky-100 flex flex-col items-center text-center space-y-2 shadow-2xs relative group">
                          <button
                            onClick={() => handleSpeakText(`Visual Aid ${idx + 1}: ${aid.title}. ${aid.description}. Notice: ${aid.caption}`)}
                            className="absolute top-3 right-3 p-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-100 shadow-2xs transition-all flex items-center gap-1 text-[10px] font-bold"
                            title="Listen to this visual aid"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-xs border border-sky-100">
                            {aid.icon}
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {aid.aidType || 'Real-Life Object'}
                            </span>
                            <h4 className="text-sm font-black text-gray-900 uppercase font-display mt-1">
                              {aid.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            {aid.description}
                          </p>
                          <span className="text-[10px] font-black text-[#026838] bg-[#DCFCE7] px-3 py-0.5 rounded-full border border-emerald-300 uppercase">
                            {aid.caption}
                          </span>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>

                {/* Interactive Recall Question */}
                <div className="p-5 bg-[#F0FDF4] rounded-[24px] border-2 border-emerald-300 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-[#026838] uppercase">
                    <HelpCircle className="w-4 h-4" />
                    <span>Quick Recall Check (Let's discover what you remember!):</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {recallQuestionData.question}
                  </p>

                  <div className="space-y-2">
                    {recallQuestionData.options.map((opt, oIdx) => {
                      const isSelected = recallAnswer === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setRecallAnswer(oIdx);
                            setRecallChecked(true);
                            if (voiceEnabled) {
                              handleSpeakText(`Good try, ${student.name}! That is a wonderful connection to what we are learning.`);
                            }
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-100 border-2 border-[#026838] text-[#026838]'
                              : 'bg-white border-gray-200 text-gray-800 hover:bg-emerald-50'
                          }`}
                        >
                          <span>{opt}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#026838]" />}
                        </button>
                      );
                    })}
                  </div>

                  {recallChecked && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-[#026838] flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Good try, {student.name}! That is wonderful thinking. You are ready to learn today's main lesson!</span>
                    </div>
                  )}
                </div>

                {/* Next Action: NEXT */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      TeacherSpeechEngine.stop();
                      setCurrentPhase(3);
                    }}
                    className="px-8 py-3.5 bg-[#026838] hover:bg-[#014d28] text-white font-black text-sm rounded-2xl shadow-[0_4px_0_0_#013d20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider flex items-center gap-2 min-h-[48px] cursor-pointer"
                  >
                    <span>NEXT: TEACHER EXPLANATION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* PHASE 3: TEACHER EXPLANATION (WHITEBOARD / CHALKBOARD) */}
            {/* ============================================================ */}
            {currentPhase === 3 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Header with Chalkboard vs Whiteboard Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-[#026838]">
                      TEACHER EXPLANATION (10 MINS)
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Step {whiteboardStepIndex + 1} of {lesson.whiteboardSteps.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const step = lesson.whiteboardSteps[whiteboardStepIndex] || lesson.whiteboardSteps[0];
                        const bullets = step.bulletPoints && step.bulletPoints.length > 0 ? `Highlights: ${step.bulletPoints.join('. ')}` : '';
                        const formula = step.equationOrHighlight ? `Important note: ${step.equationOrHighlight}` : '';
                        handleSpeakText(`Step ${whiteboardStepIndex + 1}: ${step.title}. Teacher's explanation: ${step.teacherSpeech}. Board notes: ${step.boardText}. ${bullets}. ${formula}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5 transition-all min-h-[40px]"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🔊 LISTEN AGAIN</span>
                    </button>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 text-xs shadow-2xs">
                      <button
                        onClick={() => setBoardTheme('chalk')}
                        className={`px-3 py-1.5 rounded-xl font-black transition-all min-h-[36px] ${
                          boardTheme === 'chalk' ? 'bg-[#026838] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        🟢 Chalkboard
                      </button>
                      <button
                        onClick={() => setBoardTheme('white')}
                        className={`px-3 py-1.5 rounded-xl font-black transition-all min-h-[36px] ${
                          boardTheme === 'white' ? 'bg-sky-100 text-[#026838] shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        ⚪ Whiteboard
                      </button>
                    </div>
                  </div>
                </div>

                {/* Whiteboard Surface with Progressive Reveal */}
                <div 
                  className={`rounded-[32px] p-6 sm:p-8 min-h-[340px] border-4 shadow-xl transition-all ${
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

                      {/* Progressive reveal: Pupil can reveal step details smoothly */}
                      {revealedSteps[whiteboardStepIndex] ? (
                        <div className="space-y-4 animate-fadeIn">
                          {/* Board Notes */}
                          <div className="whitespace-pre-line text-sm sm:text-base font-semibold leading-relaxed font-mono">
                            {lesson.whiteboardSteps[whiteboardStepIndex].boardText}
                          </div>

                          {/* Bullet Points */}
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

                          {/* Equation / Highlight */}
                          {lesson.whiteboardSteps[whiteboardStepIndex].equationOrHighlight && (
                            <div className="p-3 bg-[#FBC02D] text-slate-950 rounded-2xl font-black text-center text-sm shadow-md uppercase">
                              ⭐ {lesson.whiteboardSteps[whiteboardStepIndex].equationOrHighlight}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-3 bg-black/10 rounded-2xl border border-current/20">
                          <p className="text-sm font-bold italic opacity-90">
                            Listen to your teacher's explanation, then tap SHOW ME to reveal the board notes!
                          </p>
                          <button
                            onClick={() => setRevealedSteps(prev => ({ ...prev, [whiteboardStepIndex]: true }))}
                            className="px-6 py-2.5 bg-[#FBC02D] text-slate-950 hover:bg-amber-400 font-black text-xs rounded-xl shadow-md uppercase tracking-wider min-h-[44px] cursor-pointer"
                          >
                            [ SHOW ME ]
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Teacher Narration Box */}
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <span className="text-3xl shrink-0">{teacher.avatarEmoji}</span>
                    <p className="text-xs text-gray-700 italic font-semibold leading-snug">
                      "{lesson.whiteboardSteps[whiteboardStepIndex]?.teacherSpeech}"
                    </p>
                  </div>

                  {/* Step Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={whiteboardStepIndex === 0}
                      onClick={() => setWhiteboardStepIndex(prev => Math.max(0, prev - 1))}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-black text-gray-700 uppercase min-h-[44px]"
                    >
                      Previous
                    </button>

                    {whiteboardStepIndex < lesson.whiteboardSteps.length - 1 ? (
                      <button
                        onClick={() => {
                          setWhiteboardStepIndex(prev => prev + 1);
                          setRevealedSteps(prev => ({ ...prev, [whiteboardStepIndex + 1]: true }));
                        }}
                        className="px-5 py-2 bg-[#1E88E5] hover:bg-[#1565C0] text-xs font-black text-white rounded-xl shadow-[0_3px_0_0_#0D47A1] uppercase min-h-[44px] cursor-pointer"
                      >
                        NEXT STEP →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          TeacherSpeechEngine.stop();
                          setCurrentPhase(4);
                        }}
                        className="px-5 py-2 bg-[#026838] hover:bg-[#014d28] text-xs font-black text-white rounded-xl shadow-[0_3px_0_0_#013d20] uppercase min-h-[44px] cursor-pointer"
                      >
                        CONTINUE TO PRACTICE →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* PHASE 4: GUIDED CONCRETE PRACTICE */}
            {/* ============================================================ */}
            {currentPhase === 4 && (
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase text-[#D97706]">
                      GUIDED PRACTICE (7 MINS)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#026838] font-display">
                      Hands-On Interactive Exercises
                    </h3>
                  </div>
                  <button
                    onClick={() => handleSpeakText(`Guided Practice. Solve these friendly questions one at a time. Hints are provided to guide you!`)}
                    className="p-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#D97706] transition-all flex items-center gap-1.5 text-xs font-black min-h-[44px]"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>🔊 LISTEN AGAIN</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {lesson.practiceProblems.map((problem, pIdx) => {
                    const selectedOption = practiceAnswers[problem.id];
                    const isChecked = practiceSubmitted[problem.id];
                    const isCorrect = selectedOption === problem.correctIndex;

                    return (
                      <div key={problem.id} className="bg-[#F0F9FF] p-6 rounded-[28px] border border-sky-100 space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 rounded-2xl bg-[#1E88E5] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            {pIdx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-base font-black text-gray-900 leading-snug">
                                {problem.question}
                              </h4>
                              <button
                                onClick={() => handleSpeakText(`Practice question ${pIdx + 1}: ${problem.question}. Helpful hint: ${problem.concreteContext}. Options: ${problem.options.map((opt, oIdx) => `Option ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('. ')}`)}
                                className="p-1.5 px-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 shrink-0 flex items-center gap-1 text-[11px] font-bold min-h-[36px]"
                                title="Read Problem Aloud"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>🔊 Listen</span>
                              </button>
                            </div>
                            <p className="text-xs text-[#D97706] mt-1 flex items-center gap-1 font-bold">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Hint: {problem.concreteContext}</span>
                            </p>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {problem.options.map((opt, optIdx) => {
                            const isThisSelected = selectedOption === optIdx;
                            let optionStyle = 'bg-white border-gray-200 text-gray-800 hover:bg-sky-50 shadow-2xs';

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
                                className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between min-h-[48px] ${optionStyle}`}
                              >
                                <span>{opt}</span>
                                {isChecked && optIdx === problem.correctIndex && (
                                  <CheckCircle2 className="w-4 h-4 text-[#43A047]" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Check Answer / Explanation */}
                        <div className="pt-2 flex items-center justify-between">
                          {!isChecked ? (
                            <button
                              disabled={selectedOption === undefined}
                              onClick={() => {
                                setPracticeSubmitted({ ...practiceSubmitted, [problem.id]: true });
                                if (voiceEnabled) {
                                  const wasRight = selectedOption === problem.correctIndex;
                                  handleSpeakText(wasRight ? `Spot on, ${student.name}! ${problem.explanation}` : `Good try! Notice that: ${problem.explanation}`);
                                }
                              }}
                              className="px-6 py-2.5 bg-[#43A047] hover:bg-[#388E3C] disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-[0_3px_0_0_#1B5E20] uppercase tracking-wider min-h-[44px] cursor-pointer"
                            >
                              [ ANSWER ]
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

                {/* Continue to Assessment */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      TeacherSpeechEngine.stop();
                      setCurrentPhase(5);
                    }}
                    className="px-8 py-3.5 bg-[#026838] hover:bg-[#014d28] text-white font-black text-sm rounded-2xl shadow-[0_4px_0_0_#013d20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider flex items-center gap-2 min-h-[48px] cursor-pointer"
                  >
                    <span>CONTINUE TO CHECK UNDERSTANDING</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* PHASE 5: CHECK UNDERSTANDING & ADAPTIVE RE-EXPLANATION */}
            {/* ============================================================ */}
            {currentPhase === 5 && (
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase text-[#D97706]">
                      CHECK UNDERSTANDING (4 MINS)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#026838] font-display">
                      Demonstrate What You Understand
                    </h3>
                  </div>
                  <button
                    onClick={() => handleSpeakText(`Check Understanding. Answer each question to show what you understand. In our classroom, we learn until it clicks completely!`)}
                    className="p-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#D97706] transition-all flex items-center gap-1.5 text-xs font-black min-h-[44px]"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>🔊 LISTEN AGAIN</span>
                  </button>
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
                          <span className="w-7 h-7 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                                  {q.question}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {q.contextNigerian}
                                </p>
                              </div>
                              <button
                                onClick={() => handleSpeakText(`Question ${idx + 1}: ${q.question}. Context: ${q.contextNigerian}. Options: ${q.options.map((opt, oIdx) => `Option ${String.fromCharCode(65 + oIdx)}: ${opt}`).join('. ')}`)}
                                className="p-1.5 px-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 shrink-0 flex items-center gap-1 text-[11px] font-bold min-h-[36px]"
                                title="Read Question Aloud"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>🔊 Listen</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {q.options.map((option, optIdx) => {
                            const isChosen = selectedOpt === optIdx;
                            let btnStyle = 'bg-white border-gray-200 text-gray-800 hover:bg-sky-50 shadow-2xs';

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
                                className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all min-h-[48px] ${btnStyle}`}
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

                {/* Submit Assessment Button */}
                {!assessmentSubmitted ? (
                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={Object.keys(assessmentAnswers).length < lesson.assessmentQuestions.length}
                      onClick={handleCalculateAssessment}
                      className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-[0_4px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider min-h-[48px] cursor-pointer"
                    >
                      [ CHECK MY UNDERSTANDING ]
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Demonstrated Understanding Status */}
                    <div className={`p-6 rounded-[28px] border ${demonstratedMastery ? 'bg-[#DCFCE7] border-[#43A047] text-[#026838]' : 'bg-[#FEFCE8] border-[#FBC02D] text-amber-950'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xl font-black font-display">
                            {demonstratedMastery ? '🎉 Clear Understanding Demonstrated!' : '💡 Let\'s Try It Another Way Together'}
                          </h4>
                          <p className="text-xs mt-1 font-semibold">
                            {demonstratedMastery 
                              ? `Splendid job, ${student.name}! You showed great mastery of today's key ideas.`
                              : `That's okay, ${student.name}! In our classroom, we learn until it clicks completely.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Objective-Level Mastery Breakdown */}
                    {objectivesMastery.length > 0 && (
                      <div className="bg-white p-5 rounded-[24px] border-2 border-emerald-200/90 shadow-2xs space-y-3 animate-fadeIn">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#026838]" />
                            <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                              Curriculum Objective-Level Mastery
                            </h5>
                          </div>
                          <span className="text-[11px] font-black text-[#026838] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {objectivesMastery.filter(o => o.mastered).length} of {objectivesMastery.length} Objectives Mastered
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {objectivesMastery.map((item, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 ${item.mastered ? 'bg-[#F0FDF4] border-emerald-200' : 'bg-[#FEFCE8] border-amber-200'}`}>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${item.mastered ? 'bg-[#026838] text-white' : 'bg-amber-500 text-white'}`}>
                                {item.mastered ? '✓' : '!'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 leading-snug">{item.objective}</p>
                                <span className={`text-[10px] font-black uppercase tracking-wider block mt-0.5 ${
                                  item.mastered ? 'text-[#026838]' : item.masteryLevel === 'Developing' ? 'text-amber-800' : 'text-rose-700'
                                }`}>
                                  {item.mastered ? 'Mastered' : item.masteryLevel || 'Developing'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Adaptive Re-Explanation Loop if Difficulty Detected */}
                    {!demonstratedMastery && (
                      <div className="bg-white p-6 rounded-[28px] border-2 border-[#1E88E5] shadow-lg space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-3 text-[#1E88E5]">
                          <Sparkles className="w-6 h-6 text-[#1E88E5]" />
                          <div>
                            <h4 className="text-base font-black font-display text-gray-900">
                              Alternative Explanation: {reexplanationData?.analogyTitle || 'Concrete Analogy'}
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
                              <span>Connecting to simplified Nigerian everyday analogy...</span>
                            </div>
                          ) : (
                            reexplanationData?.simplifiedExplanation ||
                            'Imagine your mother gave you 4 sweet oranges to share equally with your brother. Each person gets 2 oranges! We learn step by step until it clicks.'
                          )}
                        </div>

                        {reexplanationData?.retestQuestion && (
                          <div className="p-5 bg-[#FEFCE8] rounded-2xl border border-[#FBC02D] space-y-3">
                            <div className="text-xs font-black text-amber-950 uppercase">
                              Quick Check: {reexplanationData.retestQuestion.question}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {reexplanationData.retestQuestion.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => setRetestAnswer(oIdx)}
                                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all min-h-[44px] ${
                                    retestAnswer === oIdx
                                      ? 'bg-[#1E88E5] text-white border-[#1E88E5]'
                                      : 'bg-white text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                disabled={retestAnswer === null || retestSubmitted}
                                onClick={handleFinishRetest}
                                className="px-6 py-2.5 bg-[#43A047] hover:bg-[#388E3C] disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-[0_3px_0_0_#1B5E20] uppercase min-h-[44px] cursor-pointer"
                              >
                                [ CONFIRM ANSWER ]
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Continue Button to Phase 6 */}
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          TeacherSpeechEngine.stop();
                          setCurrentPhase(6);
                        }}
                        className="px-8 py-3.5 bg-[#026838] hover:bg-[#014d28] text-white font-black text-sm rounded-2xl shadow-[0_4px_0_0_#013d20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider flex items-center gap-2 min-h-[48px] cursor-pointer"
                      >
                        <span>CONTINUE TO SESSION WRAP-UP</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
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
                    SESSION FEEDBACK & WRAP-UP
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-[#026838] font-display">
                    Well Done, {student.name}!
                  </h3>
                  <p className="text-sm text-gray-600 max-w-lg mx-auto font-medium">
                    {teacher.name} has recorded your 30-minute structured master class in <strong>{lesson.topic}</strong>.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleReadEntireBoard}
                      className="px-4 py-2 rounded-2xl bg-[#DCFCE7] hover:bg-emerald-200 text-[#026838] font-black text-xs inline-flex items-center gap-2 shadow-2xs transition-all min-h-[44px]"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>🔊 LISTEN AGAIN</span>
                    </button>
                  </div>
                </div>

                {/* Session Summary Card */}
                <div className="bg-[#FEFCE8] border-2 border-[#FBC02D] p-5 rounded-[28px] max-w-2xl mx-auto text-left space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                    <Award className="w-5 h-5 text-[#D97706]" />
                    <h4 className="text-sm font-black text-slate-900 uppercase">
                      Today's Lesson Summary
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>
                      <strong className="text-slate-900">Topic:</strong> {lesson.topic}
                    </div>
                    <div>
                      <strong className="text-slate-900">What You Learned:</strong> {lesson.objectives.join('; ')}
                    </div>
                    <div>
                      <strong className="text-slate-900">Demonstrated Progress:</strong> {
                        reexplainedFlag
                          ? (retestPassed ? 'Mastered with adaptive re-explanation support' : 'Developing with guided support')
                          : 'Demonstrated strong mastery'
                      }
                    </div>
                  </div>
                </div>

                {/* Objective-Level Mastery Summary */}
                {objectivesMastery.length > 0 && (
                  <div className="bg-white border-2 border-emerald-300 p-5 rounded-[28px] max-w-2xl mx-auto text-left space-y-3 shadow-xs animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#026838]" />
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          Official Curriculum Objectives Mastered
                        </h4>
                      </div>
                      <span className="text-xs font-black text-[#026838]">
                        NERDC Primary {lesson.grade} Aligned
                      </span>
                    </div>
                    <div className="space-y-2">
                      {objectivesMastery.map((obj, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-[#026838] shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold">{obj.objective}</span>
                            <span className={`ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              obj.mastered
                                ? 'bg-emerald-50 text-[#026838] border-emerald-200'
                                : (obj as any).masteryLevel === 'Developing'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {obj.mastered ? 'Mastered' : (obj as any).masteryLevel || 'Developing'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Home Practice for Parent */}
                <div className="bg-[#F0F9FF] border border-sky-200 p-5 rounded-[24px] max-w-2xl mx-auto text-left space-y-1">
                  <div className="text-xs font-black text-[#1E88E5] uppercase flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>Recommended Weekend Home Practice:</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    "Ask {student.name} to identify 3 examples of {lesson.topic} around your home, market, or compound this weekend."
                  </p>
                </div>

                {/* Primary Finish Button: FINISH LESSON */}
                <div className="pt-4">
                  <button
                    id="finish-lesson-btn"
                    onClick={() => {
                      TeacherSpeechEngine.stop();
                      onLessonComplete(assessmentScore || 90, reexplainedFlag, objectivesMastery);
                    }}
                    className="px-10 py-4 bg-[#026838] hover:bg-[#014d28] text-white font-black text-sm rounded-2xl shadow-[0_5px_0_0_#013d20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all font-display uppercase tracking-wider min-h-[48px] cursor-pointer"
                  >
                    [ FINISH LESSON ]
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Phase Navigation Footer */}
            <div className="pt-6 flex items-center justify-between border-t border-sky-100">
              <button
                disabled={currentPhase === 1}
                onClick={() => setCurrentPhase(prev => Math.max(1, prev - 1) as LessonPhaseId)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 text-xs font-black text-gray-700 transition-all uppercase min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs font-black text-[#026838] uppercase tracking-wider">
                {phases.find(p => p.id === currentPhase)?.label} ({currentPhase} of 6)
              </div>

              <button
                disabled={currentPhase === 6}
                onClick={() => setCurrentPhase(prev => Math.min(6, prev + 1) as LessonPhaseId)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-30 text-white font-black text-xs shadow-[0_3px_0_0_#B45309] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase cursor-pointer min-h-[44px]"
              >
                <span>NEXT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
