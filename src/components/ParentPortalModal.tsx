import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Volume2,
  Lock,
  CreditCard,
  GraduationCap,
  Award,
  BookOpen,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { StudentProfile, VoiceTone, GradeLevel } from '../types';
import { TeacherSpeechEngine } from '../utils/speech';

interface ParentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  voiceTone: VoiceTone;
  onSelectVoiceTone: (tone: VoiceTone) => void;
  onRequestTuitionPayment: (grade: GradeLevel, term: number, reason: 'unregistered_class' | 'term_unpaid') => void;
}

export const ParentPortalModal: React.FC<ParentPortalModalProps> = ({
  isOpen,
  onClose,
  student,
  voiceTone,
  onSelectVoiceTone,
  onRequestTuitionPayment,
}) => {
  if (!isOpen) return null;

  const handlePreviewVoice = (tone: VoiceTone) => {
    const previewMessage = tone === 'phonics'
      ? `Hello dear parent! In phonics mode, we enunciate sounds, phonemes, and syllables with high precision. Cat: /k/ /æ/ /t/.`
      : `Good day parent! In the normal Nigerian teacher voice, our lessons carry warm encouragement, local cadence, and high enthusiasm!`;

    TeacherSpeechEngine.speak(previewMessage, undefined, 'female', tone);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#026838] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-emerald-300">
            <span>Parent Control & Governance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#026838] font-display tracking-tight uppercase">
            Parent Governance & Academic Portal
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Configure your preferred teacher voice, manage registered class termly tuition, and review weekly academic progress summaries.
          </p>
        </div>

        {/* Section 1: Teacher Voice Tone Preference */}
        <div className="bg-[#F0FDF4] border-2 border-[#43A047] p-5 sm:p-6 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎙️</span>
              <div>
                <h3 className="text-sm font-black text-[#026838] uppercase font-display">
                  Preferred Teacher Voice Tone
                </h3>
                <p className="text-[11px] text-gray-600 font-medium">
                  Select how the AI Master Teacher speaks during lessons and board readings.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-[#026838] bg-white px-2.5 py-1 rounded-full border border-[#43A047]">
              Current: {voiceTone === 'phonics' ? 'Phonics Voice' : 'Normal Nigerian'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Normal Nigerian Voice Card */}
            <div
              onClick={() => {
                onSelectVoiceTone('nigerian_teacher');
                handlePreviewVoice('nigerian_teacher');
              }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                voiceTone === 'nigerian_teacher'
                  ? 'border-[#026838] bg-white shadow-md ring-2 ring-[#026838]/20'
                  : 'border-emerald-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇳🇬</span>
                  <span className="text-xs font-black text-[#026838] uppercase">
                    Normal Nigerian Teacher Voice
                  </span>
                </div>
                {voiceTone === 'nigerian_teacher' && (
                  <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                Authentic, warm Nigerian classroom tone with upbeat local cadence and culturally resonant encouragement.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVoiceTone('nigerian_teacher');
                  handlePreviewVoice('nigerian_teacher');
                }}
                className="px-3 py-1.5 bg-[#FEFCE8] text-[#D97706] border border-[#FBC02D] rounded-xl text-[11px] font-black flex items-center gap-1.5 hover:bg-[#FDE047] self-start uppercase"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen to Normal Voice</span>
              </button>
            </div>

            {/* Phonics Voice Card */}
            <div
              onClick={() => {
                onSelectVoiceTone('phonics');
                handlePreviewVoice('phonics');
              }}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                voiceTone === 'phonics'
                  ? 'border-[#1E88E5] bg-white shadow-md ring-2 ring-[#1E88E5]/20'
                  : 'border-sky-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗣️</span>
                  <span className="text-xs font-black text-[#1E88E5] uppercase">
                    Phonics Voice
                  </span>
                </div>
                {voiceTone === 'phonics' && (
                  <span className="w-5 h-5 rounded-full bg-[#1E88E5] text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                Slightly slower cadence with crisp, clear phoneme and syllable enunciation for reading fluency.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVoiceTone('phonics');
                  handlePreviewVoice('phonics');
                }}
                className="px-3 py-1.5 bg-[#F0F9FF] text-[#1E88E5] border border-sky-300 rounded-xl text-[11px] font-black flex items-center gap-1.5 hover:bg-sky-100 self-start uppercase"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen to Phonics Voice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Registered Class & Termly Tuition Access */}
        <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] p-5 sm:p-6 rounded-[28px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#D97706]" />
                <h3 className="text-sm font-black text-amber-950 uppercase font-display">
                  Class Registration & Termly Tuition Access
                </h3>
              </div>
              <p className="text-[11px] text-amber-900 font-medium mt-0.5">
                Per school policy, lessons are only accessible for the registered class after termly tuition is settled.
              </p>
            </div>

            <div className="bg-white border border-[#F59E0B] px-3 py-1 rounded-xl text-xs font-black text-amber-950 self-start sm:self-auto">
              Enrolled: Primary {student.registeredGrade}
            </div>
          </div>

          {/* Term Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((term) => {
              const payment = student.termlyTuition?.[term];
              const isPaid = payment?.paid || student.activeSubscription;

              return (
                <div
                  key={term}
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between space-y-3 ${
                    isPaid
                      ? 'bg-white border-[#43A047] shadow-xs'
                      : 'bg-white/80 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800">
                      Term {term}
                    </span>
                    {isPaid ? (
                      <span className="bg-[#DCFCE7] text-[#026838] text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#43A047]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Paid</span>
                      </span>
                    ) : (
                      <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                        <Lock className="w-3 h-3" />
                        <span>Unpaid</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-500">
                    {isPaid ? (
                      <div>
                        <div className="font-bold text-slate-800">Primary {student.registeredGrade} Access Active</div>
                        <div className="text-[10px] text-gray-400">Ref: {payment?.reference || 'TERM-PAID'}</div>
                      </div>
                    ) : (
                      <div>
                        <div>Tuition: <strong>₦12,000</strong></div>
                        <div className="text-[10px] text-amber-800">Requires payment to unlock</div>
                      </div>
                    )}
                  </div>

                  {!isPaid ? (
                    <button
                      onClick={() => onRequestTuitionPayment(student.registeredGrade, term, 'term_unpaid')}
                      className="w-full py-2 bg-[#43A047] hover:bg-[#388E3C] text-white text-[11px] font-black rounded-xl shadow-[0_2px_0_0_#1B5E20] uppercase tracking-wider flex items-center justify-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ₦12,000</span>
                    </button>
                  ) : (
                    <div className="text-center text-[10px] font-black text-[#026838] uppercase py-1">
                      Full Access Granted
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: In-App Weekly Academic Progress Summary */}
        <div className="bg-[#F8FAFC] border-2 border-slate-200 p-5 sm:p-6 rounded-[28px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#026838]" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase font-display">
                  Weekly Academic Mastery Summary
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Continuous performance evaluation aligned with NERDC UBE curriculum benchmarks.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-[#026838] bg-[#DCFCE7] px-2.5 py-1 rounded-full border border-emerald-300">
              Week {student.currentWeek} • Active
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            {/* Student Snapshot */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 rounded-2xl border-2 border-[#43A047] overflow-hidden shrink-0 bg-white shadow-sm">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-black text-lg"
                    style={{ backgroundColor: student.avatarColor || '#1E88E5' }}
                  >
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-base font-black text-slate-900">{student.name}</div>
                <div className="text-xs text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold">Primary {student.grade}</span>
                  <span>•</span>
                  <span>Mastery Score: <strong className="text-[#026838] font-black">{student.overallScore}%</strong></span>
                  <span>•</span>
                  <span>Top Subject: <strong className="text-[#1E88E5] font-black">{student.topSubject}</strong></span>
                </div>
              </div>
            </div>

            {/* Curriculum Modules Covered */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase">
                <BookOpen className="w-4 h-4 text-[#026838]" />
                <span>Modules Mastered This Term</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Social Studies: Nigerian Climates & Geography</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Mathematics: Fractions with Agege Bread</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Basic Science: Living Organisms & MR NIGER D</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">English: Syllable Segmentation & Phonics</span>
                </div>
              </div>
            </div>

            {/* Home Practice Recommendation */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black block uppercase text-[10px] text-amber-800 tracking-wider">
                  Recommended Home Reinforcement Activity
                </strong>
                <p className="mt-0.5 leading-relaxed font-medium">
                  Ask {student.name} to identify place values using 100-Naira notes or practice dividing fruit snacks into equal fractional portions during meals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
