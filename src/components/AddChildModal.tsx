import React, { useState, useRef } from 'react';
import { X, UserPlus, Upload, ShieldCheck, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { StudentProfile, GradeLevel, SubjectName } from '../types';
import pupilBoy from '../assets/images/nigerian_pupil_boy_1788178837558.jpg';
import pupilGirl from '../assets/images/nigerian_pupil_girl_1788178854346.jpg';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: any) => Promise<boolean | void> | void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [schoolName, setSchoolName] = useState('');
  const [academicSession, setAcademicSession] = useState('2024/2025');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [pin, setPin] = useState('1234');
  const [topSubject, setTopSubject] = useState<SubjectName>('Mathematics');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(30);
  const [avatarUrl, setAvatarUrl] = useState<string>(pupilBoy);
  const [avatarColor, setAvatarColor] = useState('#026838');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleNameChange = (val: string) => {
    setName(val);
    setError(null);
    if (!loginIdentifier || loginIdentifier === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const autoIdentifier = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setLoginIdentifier(autoIdentifier);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Please enter your child's full name (at least 2 characters).");
      return;
    }

    const cleanIdentifier = (loginIdentifier.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase();
    if (cleanIdentifier.length < 3) {
      setError("Child login identifier must be at least 3 characters.");
      return;
    }

    const cleanPin = pin.trim();
    if (cleanPin.length < 4) {
      setError("Child security PIN or password must be at least 4 digits/characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: cleanName,
        grade,
        schoolName: schoolName.trim() || undefined,
        academicSession: academicSession.trim() || '2024/2025',
        loginIdentifier: cleanIdentifier,
        pin: cleanPin,
        password: cleanPin,
        avatarUrl: avatarUrl || pupilBoy,
        avatarColor: avatarColor || colors[0],
        topSubject,
        learningPreferences: {
          preferredSubjects: [topSubject],
          studyGoalMinutes: Number(dailyGoalMinutes) || 30,
          dailyGoal: 1
        },
        // Subscription enforcement: locked by default until tuition is verified
        activeSubscription: false,
        termlyTuition: {}
      };

      await onAddStudent(payload);
      setIsSubmitting(false);
      onClose();
      // Reset form fields
      setName('');
      setSchoolName('');
      setLoginIdentifier('');
      setPin('1234');
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || "Failed to create child profile. Please check details and retry.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn my-auto max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="w-12 h-12 bg-[#F0FDF4] text-[#026838] border border-emerald-200 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#026838] font-display uppercase tracking-tight">
              Add Child Profile
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Create an individual learning account linked to your family profile.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-xs text-red-800 font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Child Photo / Avatar Selection */}
          <div className="p-3.5 bg-[#F0F9FF] rounded-2xl border border-sky-100 space-y-2.5">
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block">
              Pupil Photo (Optional or Pick Avatar)
            </label>
            <div className="flex items-center gap-3.5">
              <div 
                className="w-14 h-14 rounded-full border-2 border-[#026838] overflow-hidden bg-white shadow-xs shrink-0"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Child preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">
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
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-[#026838] hover:bg-sky-50 text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(pupilBoy)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      avatarUrl === pupilBoy ? 'bg-[#026838] text-white border-[#026838]' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    Boy Avatar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(pupilGirl)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      avatarUrl === pupilGirl ? 'bg-[#026838] text-white border-[#026838]' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    Girl Avatar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Child Full Name */}
          <div>
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
              Child's Full Name *
            </label>
            <input
              id="new-child-name-input"
              type="text"
              required
              placeholder="e.g. Babatunde Okafor, Somto Eze"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#026838]"
            />
          </div>

          {/* Primary 1 to 6 Class */}
          <div>
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
              Primary School Class (Primary 1–6) *
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map((g) => (
                <button
                  type="button"
                  key={g}
                  id={`select-child-grade-${g}`}
                  onClick={() => setGrade(g)}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    grade === g
                      ? 'bg-[#026838] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Pri {g}
                </button>
              ))}
            </div>
          </div>

          {/* Child Login Identifier & Secure PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                Child Login Identifier *
              </label>
              <input
                id="new-child-identifier-input"
                type="text"
                required
                placeholder="e.g. somto_okafor"
                value={loginIdentifier}
                onChange={(e) => {
                  setLoginIdentifier(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                  setError(null);
                }}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#026838]"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Used by child to log in</span>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                Child Security PIN (4 Digits) *
              </label>
              <input
                id="new-child-pin-input"
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 1234"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#026838]"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Easy for child to remember</span>
            </div>
          </div>

          {/* Optional School Name & Academic Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                School Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Corona Primary School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#026838]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                Academic Session
              </label>
              <select
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
              >
                <option value="2024/2025">2024/2025 Session</option>
                <option value="2025/2026">2025/2026 Session</option>
                <option value="2023/2024">2023/2024 Session</option>
              </select>
            </div>
          </div>

          {/* Learning Preferences: Favorite Subject & Daily Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                Favorite Subject
              </label>
              <select
                value={topSubject}
                onChange={(e) => setTopSubject(e.target.value as SubjectName)}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="English Studies">English Studies</option>
                <option value="Basic Science & Technology">Basic Science & Technology</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Civic Education">Civic Education</option>
                <option value="Physical & Health Education">Physical & Health Education</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider block mb-1">
                Daily Study Target
              </label>
              <select
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none"
              >
                <option value={20}>20 Minutes / day</option>
                <option value={30}>30 Minutes / day (Standard)</option>
                <option value={45}>45 Minutes / day</option>
                <option value={60}>60 Minutes / day</option>
              </select>
            </div>
          </div>

          {/* Subscription Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>Adding a child creates their profile. Standard termly tuition applies to unlock full curriculum lessons.</span>
          </div>

          <div className="pt-2">
            <button
              id="submit-child-profile-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#026838] hover:bg-[#014d28] disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all uppercase tracking-wider cursor-pointer"
            >
              {isSubmitting ? 'Creating Profile...' : 'Save Child Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
