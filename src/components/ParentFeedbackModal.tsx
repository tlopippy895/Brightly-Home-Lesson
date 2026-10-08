import React, { useState } from 'react';
import { X, MessageSquareHeart, CheckCircle2, Star, Send } from 'lucide-react';
import { api } from '../services/api';

interface ParentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  topicId: string;
  subject: string;
  lessonTitle: string;
  onSuccess?: () => void;
}

export const ParentFeedbackModal: React.FC<ParentFeedbackModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  topicId,
  subject,
  lessonTitle,
  onSuccess
}) => {
  const [q1, setQ1] = useState<'strongly_agree' | 'agree' | 'neutral' | 'disagree'>('agree');
  const [q2, setQ2] = useState<'strongly_agree' | 'agree' | 'neutral' | 'disagree'>('agree');
  const [q3, setQ3] = useState<'strongly_agree' | 'agree' | 'neutral' | 'disagree'>('agree');
  const [q4, setQ4] = useState<'strongly_agree' | 'agree' | 'neutral' | 'disagree'>('agree');
  const [q5, setQ5] = useState<'no' | 'once' | 'multiple_times'>('no');
  const [q6, setQ6] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.submitParentPilotFeedback({
        studentId,
        studentName,
        topicId,
        subject,
        lessonTitle,
        q1EasyToUnderstand: q1,
        q2ChildEnjoyed: q2,
        q3TeacherExplainedClearly: q3,
        q4HelpedSchoolwork: q4,
        q5NeededRepeatedExplanation: q5,
        q6ImprovementSuggestions: q6.trim()
      });
      if (res.success) {
        setIsSubmitted(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to submit parent feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const agreementOptions = [
    { value: 'strongly_agree', label: 'Strongly Agree' },
    { value: 'agree', label: 'Agree' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'disagree', label: 'Disagree' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Parent Pilot Lesson Feedback</h3>
              <p className="text-[11px] text-slate-500">{studentName} &bull; {subject}: {lessonTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-900 text-base">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-600">Your insights help us refine our Nigerian curriculum lessons for every pupil.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {/* Question 1 */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                1. Was the lesson easy for your child to understand?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {agreementOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ1(opt.value as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      q1 === opt.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2 */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                2. Did the child enjoy the lesson?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {agreementOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ2(opt.value as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      q2 === opt.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3 */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                3. Did the AI Teacher explain clearly?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {agreementOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ3(opt.value as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      q3 === opt.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 4 */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                4. Did the lesson help with schoolwork?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {agreementOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ4(opt.value as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      q4 === opt.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 5 */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                5. Did your child need repeated explanation?
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'no', label: 'No, grasped immediately' },
                  { value: 'once', label: 'Once / One retry' },
                  { value: 'multiple_times', label: 'Multiple times' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setQ5(opt.value as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      q5 === opt.value
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 6 */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                6. What should Brightly improve?
              </label>
              <textarea
                value={q6}
                onChange={(e) => setQ6(e.target.value)}
                placeholder="Share any comments on teacher tone, exercise difficulty, or topics you want next..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0284C7] text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Pilot Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
