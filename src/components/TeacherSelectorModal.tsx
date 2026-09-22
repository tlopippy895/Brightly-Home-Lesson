import React from 'react';
import { X, Check, Volume2, Sparkles, Mic, Radio } from 'lucide-react';
import { TeacherPersona, VoiceTone } from '../types';
import { NIGERIAN_TEACHERS } from '../data/teachers';
import { TeacherSpeechEngine } from '../utils/speech';

interface TeacherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeacher: TeacherPersona;
  onSelectTeacher: (teacher: TeacherPersona) => void;
  voiceTone: VoiceTone;
  onSelectVoiceTone: (tone: VoiceTone) => void;
}

export const TeacherSelectorModal: React.FC<TeacherSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedTeacher,
  onSelectTeacher,
  voiceTone,
  onSelectVoiceTone,
}) => {
  if (!isOpen) return null;

  const handlePreviewVoice = (teacher: TeacherPersona, tone: VoiceTone = voiceTone) => {
    const previewMessage = tone === 'phonics'
      ? `Hello! I am ${teacher.name}. In phonics mode, we enunciate every sound and syllable clearly. Let us sound out each word together!`
      : `${teacher.greeting}! I am ${teacher.name}, your ${teacher.subjectSpecialty} tutor. Welcome to our mastery class today!`;

    TeacherSpeechEngine.speak(previewMessage, undefined, teacher.gender, tone);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <div>
            <div className="inline-block bg-[#FEFCE8] text-[#D97706] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-[#FBC02D]/40">
              Culturally Relatable Teachers & Voice Tone
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#026838] font-display tracking-tight uppercase">
              Select Teacher & Voice Tone
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Choose your child's primary tutor and select between Normal Voice (Nigerian pronunciation) or Phonics Enunciation Voice.
            </p>
          </div>

          {/* Voice Tone Preference Selector Card */}
          <div className="bg-[#F0FDF4] border-2 border-[#43A047] p-5 rounded-[28px] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#026838]">
                  Parent Voice Tone Setting
                </span>
                <h4 className="text-sm font-black text-slate-900 uppercase font-display">
                  Teacher Voice Tone Preference
                </h4>
              </div>
              <span className="text-[11px] font-bold text-[#026838] bg-white px-3 py-1 rounded-full border border-[#43A047]">
                Live Synthesis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Normal Voice (Nigerian) */}
              <div
                onClick={() => {
                  onSelectVoiceTone('nigerian_teacher');
                  handlePreviewVoice(selectedTeacher, 'nigerian_teacher');
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  voiceTone === 'nigerian_teacher'
                    ? 'border-[#026838] bg-white shadow-md ring-2 ring-[#026838]/20'
                    : 'border-emerald-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎙️</span>
                    <span className="text-xs font-black text-[#026838] uppercase">
                      Normal Voice
                    </span>
                  </div>
                  {voiceTone === 'nigerian_teacher' && (
                    <span className="w-5 h-5 rounded-full bg-[#026838] text-white flex items-center justify-center text-xs font-black">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                  Warm, melodic Nigerian classroom tone with local cadence and energetic encouragement.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVoiceTone('nigerian_teacher');
                    handlePreviewVoice(selectedTeacher, 'nigerian_teacher');
                  }}
                  className="px-3 py-1.5 bg-[#FEFCE8] text-[#D97706] border border-[#FBC02D] rounded-xl text-[11px] font-black flex items-center gap-1.5 hover:bg-[#FDE047] self-start uppercase"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Preview Normal Voice</span>
                </button>
              </div>

              {/* Phonics Voice */}
              <div
                onClick={() => {
                  onSelectVoiceTone('phonics');
                  handlePreviewVoice(selectedTeacher, 'phonics');
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  voiceTone === 'phonics'
                    ? 'border-[#1E88E5] bg-white shadow-md ring-2 ring-[#1E88E5]/20'
                    : 'border-sky-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗣️</span>
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
                  Crisp, slower-paced UK/International synthetic phonics pronunciation for precise syllable enunciation.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVoiceTone('phonics');
                    handlePreviewVoice(selectedTeacher, 'phonics');
                  }}
                  className="px-3 py-1.5 bg-[#F0F9FF] text-[#1E88E5] border border-sky-300 rounded-xl text-[11px] font-black flex items-center gap-1.5 hover:bg-sky-100 self-start uppercase"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Preview Phonics Voice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Teacher Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NIGERIAN_TEACHERS.map((teacher) => {
              const isSelected = selectedTeacher.id === teacher.id;
              return (
                <div
                  key={teacher.id}
                  onClick={() => {
                    onSelectTeacher(teacher);
                    handlePreviewVoice(teacher);
                  }}
                  className={`p-5 rounded-[24px] border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-[#026838] bg-[#F0FDF4] shadow-md ring-2 ring-[#026838]/20'
                      : 'border-gray-200 bg-white hover:border-[#026838]/40 hover:bg-sky-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      {teacher.imageUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#FBC02D] shadow-md bg-white">
                          <img
                            src={teacher.imageUrl}
                            alt={teacher.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#FEFCE8] border border-[#FBC02D] flex items-center justify-center text-3xl shadow-sm">
                          {teacher.avatarEmoji}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-sm">
                        {teacher.avatarEmoji}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="w-7 h-7 rounded-full bg-[#026838] text-white flex items-center justify-center text-xs font-black shadow-sm">
                        ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewVoice(teacher);
                        }}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-all"
                        title="Listen to Voice Greeting"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight uppercase font-display">
                      {teacher.name}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                      {teacher.ethnicGroup} • {teacher.region}
                    </span>
                    <span className="inline-block mt-2 text-[10px] font-black text-[#1E88E5] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 uppercase">
                      {teacher.subjectSpecialty}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 italic font-medium bg-[#F0F9FF] p-3 rounded-xl border border-sky-100 line-clamp-2">
                    "{teacher.greeting}"
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-xs rounded-2xl shadow-[0_4px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
            >
              Confirm Teacher & Voice Tone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

