import React, { useState, useRef } from 'react';
import { X, UserPlus, Sparkles, Upload, Camera } from 'lucide-react';
import { StudentProfile, GradeLevel } from '../types';
import pupilBoy from '../assets/images/nigerian_pupil_boy_1788178837558.jpg';
import pupilGirl from '../assets/images/nigerian_pupil_girl_1788178854346.jpg';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: StudentProfile) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [topSubject, setTopSubject] = useState('Mathematics');
  const [avatarUrl, setAvatarUrl] = useState<string>(pupilBoy);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const colors = ['#008751', '#D97706', '#1E88E5', '#7C3AED', '#DB2777', '#059669'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newStudent: StudentProfile = {
      id: `child_${Date.now()}`,
      name: name.trim(),
      grade,
      registeredGrade: grade,
      pin: '1234',
      avatarUrl: avatarUrl || pupilBoy,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      currentTerm: 1,
      currentWeek: 3,
      overallScore: 85,
      scoreChangeText: 'NEW LEARNER ENROLLED',
      topSubject: topSubject as any,
      lessonsCompletedThisWeek: 1,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade,
          amount: 12000,
          reference: `NEW-ENROLL-${Date.now().toString().slice(-6)}`,
          paidAt: new Date().toISOString()
        }
      }
    };

    onAddStudent(newStudent);
    onClose();
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="w-12 h-12 bg-[#F0FDF4] text-[#026838] border border-emerald-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-[#026838] font-display uppercase tracking-tight">
              Add Pupil Profile
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Create a dedicated NERDC learning profile and upload or pick your child's picture.
            </p>
          </div>

          {/* Child Photo Selection / Upload */}
          <div className="p-4 bg-[#F0F9FF] rounded-2xl border border-sky-100 space-y-3">
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block">
              Pupil Photo (Optional or Pick Avatar)
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#026838] overflow-hidden bg-white shadow-sm shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Child preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    👦🏾
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-[#026838] hover:bg-sky-50 text-[11px] font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Child's Photo</span>
                </button>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(pupilBoy)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      avatarUrl === pupilBoy ? 'bg-[#026838] text-white border-[#026838]' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    Boy Avatar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(pupilGirl)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      avatarUrl === pupilGirl ? 'bg-[#026838] text-white border-[#026838]' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    Girl Avatar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1">
              Child's First Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Babatunde, Somto, Farida"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#F0F9FF] border border-sky-100 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#026838]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1">
              Primary School Class (NERDC Standard)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                    grade === g
                      ? 'bg-[#026838] text-white shadow-[0_3px_0_0_#1B5E20]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Primary {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-wider block mb-1">
              Favorite Subject Focus
            </label>
            <select
              value={topSubject}
              onChange={(e) => setTopSubject(e.target.value)}
              className="w-full px-4 py-3 bg-[#F0F9FF] border border-sky-100 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="English Studies">English Studies</option>
              <option value="Basic Science & Technology">Basic Science & Technology</option>
              <option value="Social Studies">Social Studies</option>
              <option value="Civic Education">Civic Education</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-xs rounded-2xl shadow-[0_4px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
            >
              Save Pupil Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
