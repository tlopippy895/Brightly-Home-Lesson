import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { MyLessonsView } from './components/MyLessonsView';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView';
import { ActiveLessonRoom } from './components/ActiveLessonRoom';
import { SubscriptionsModal } from './components/SubscriptionsModal';
import { ParentPortalModal } from './components/ParentPortalModal';
import { RegulatoryModal } from './components/RegulatoryModal';
import { TeacherSelectorModal } from './components/TeacherSelectorModal';
import { PinHandoffModal } from './components/PinHandoffModal';
import { AddChildModal } from './components/AddChildModal';
import { PupilPhotoModal } from './components/PupilPhotoModal';
import { TermlyTuitionModal } from './components/TermlyTuitionModal';

import { StudentProfile, LessonTopic, GradeLevel, TeacherPersona, VoiceTone } from './types';
import { NIGERIAN_TEACHERS } from './data/teachers';
import { CURRICULUM_DATA } from './data/curriculum';
import pupilBoy from './assets/images/nigerian_pupil_boy_1788178837558.jpg';
import pupilGirl from './assets/images/nigerian_pupil_girl_1788178854346.jpg';

export function App() {
  // Active App State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lessons' | 'progress' | 'subscriptions' | 'settings' | 'help' | 'regulatory'>('dashboard');

  // Student Profiles State with Class Registration & Termly Tuition Tracking
  const [students, setStudents] = useState<StudentProfile[]>([
    {
      id: 'chidi',
      name: 'Chidi',
      grade: 4,
      registeredGrade: 4,
      pin: '1234',
      avatarUrl: pupilBoy,
      avatarColor: '#1E88E5',
      currentTerm: 1,
      currentWeek: 3,
      overallScore: 88,
      scoreChangeText: 'UP 5% FROM LAST TERM',
      topSubject: 'Mathematics',
      lessonsCompletedThisWeek: 3,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 4,
          amount: 12000,
          reference: 'NERDC-TERM1-9842',
          paidAt: '2026-01-10T08:30:00.000Z'
        }
      }
    },
    {
      id: 'aminat',
      name: 'Aminat',
      grade: 2,
      registeredGrade: 2,
      pin: '1234',
      avatarUrl: pupilGirl,
      avatarColor: '#008751',
      currentTerm: 1,
      currentWeek: 2,
      overallScore: 92,
      scoreChangeText: 'UP 8% FROM LAST TERM',
      topSubject: 'English Studies',
      lessonsCompletedThisWeek: 2,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: true,
      preferredVoiceTone: 'phonics',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 2,
          amount: 12000,
          reference: 'NERDC-TERM1-6311',
          paidAt: '2026-01-12T09:15:00.000Z'
        }
      }
    },
    {
      id: 'tunde',
      name: 'Tunde',
      grade: 5,
      registeredGrade: 5,
      pin: '1234',
      avatarUrl: pupilBoy,
      avatarColor: '#D97706',
      currentTerm: 1,
      currentWeek: 3,
      overallScore: 85,
      scoreChangeText: 'UP 3% FROM LAST TERM',
      topSubject: 'Basic Science & Technology',
      lessonsCompletedThisWeek: 4,
      totalLessonsThisWeek: 5,
      completedLessons: [],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 5,
          amount: 12000,
          reference: 'NERDC-TERM1-4190',
          paidAt: '2026-01-15T11:00:00.000Z'
        }
      }
    }
  ]);

  const [activeStudentId, setActiveStudentId] = useState<string>('chidi');
  const activeStudent = students.find(s => s.id === activeStudentId) || students[0];

  // Teacher Persona State
  const [activeTeacher, setActiveTeacher] = useState<TeacherPersona>(NIGERIAN_TEACHERS[0]); // Mrs. Chidinma Okafor

  // Voice narration global toggle & Voice Tone ('nigerian_teacher' | 'phonics')
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [voiceTone, setVoiceTone] = useState<VoiceTone>(activeStudent.preferredVoiceTone || 'nigerian_teacher');

  // Financial Wallet & Subscriptions State
  const [walletBalance, setWalletBalance] = useState<number>(3500);

  // Active Lesson Room State
  const [activeLesson, setActiveLesson] = useState<LessonTopic | null>(null);

  // Termly Tuition Payment Modal State
  const [tuitionModalState, setTuitionModalState] = useState<{
    isOpen: boolean;
    grade: GradeLevel;
    term: number;
    reason: 'unregistered_class' | 'term_unpaid';
  }>({
    isOpen: false,
    grade: activeStudent.grade,
    term: activeStudent.currentTerm,
    reason: 'term_unpaid'
  });

  // Modals visibility
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isParentDigestOpen, setIsParentDigestOpen] = useState(false);
  const [isRegulatoryOpen, setIsRegulatoryOpen] = useState(false);
  const [isTeacherSelectorOpen, setIsTeacherSelectorOpen] = useState(false);
  const [isPinHandoffOpen, setIsPinHandoffOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isPupilPhotoModalOpen, setIsPupilPhotoModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle voice tone change & persist to student profile
  const handleSelectVoiceTone = (tone: VoiceTone) => {
    setVoiceTone(tone);
    setStudents(prev =>
      prev.map(s => s.id === activeStudent.id ? { ...s, preferredVoiceTone: tone } : s)
    );
  };

  // Handle grade level switcher
  const handleGradeChange = (grade: GradeLevel) => {
    setStudents(prev =>
      prev.map(s => s.id === activeStudent.id ? { ...s, grade } : s)
    );
  };

  // Handle pupil photo customization / upload
  const handleSavePupilPhoto = (newAvatarUrl: string) => {
    setStudents(prev =>
      prev.map(s => s.id === activeStudent.id ? { ...s, avatarUrl: newAvatarUrl } : s)
    );
  };

  // Trigger tuition payment modal
  const handleRequestTuitionPayment = (grade: GradeLevel, term: number, reason: 'unregistered_class' | 'term_unpaid') => {
    setTuitionModalState({
      isOpen: true,
      grade,
      term,
      reason
    });
  };

  // Handle tuition payment completion & grant termly access to registered class
  const handleTuitionSuccess = (payment: any) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === activeStudent.id) {
          const updatedTuition = { ...(s.termlyTuition || {}) };
          updatedTuition[payment.term] = {
            paid: true,
            term: payment.term,
            grade: payment.grade,
            amount: payment.amount,
            reference: payment.reference,
            paidAt: payment.paidAt
          };
          return {
            ...s,
            registeredGrade: payment.grade,
            grade: payment.grade,
            currentTerm: payment.term,
            termlyTuition: updatedTuition
          };
        }
        return s;
      })
    );
  };

  // Get current active lesson for the student
  const currentGradeLessons = CURRICULUM_DATA.filter(l => l.grade === activeStudent.grade);
  const currentLesson = currentGradeLessons[0] || CURRICULUM_DATA[0];

  // Trigger lesson startup with registered class & termly tuition check
  const handleStartLesson = (lesson?: LessonTopic) => {
    const target = lesson || currentLesson;
    const term = target.term || activeStudent.currentTerm;
    const isEnrolledInClass = activeStudent.grade === activeStudent.registeredGrade;
    const isTermTuitionPaid = isEnrolledInClass && (activeStudent.termlyTuition?.[term]?.paid || activeStudent.activeSubscription);

    if (!isEnrolledInClass) {
      handleRequestTuitionPayment(activeStudent.grade, term, 'unregistered_class');
      return;
    }

    if (!isTermTuitionPaid) {
      handleRequestTuitionPayment(activeStudent.grade, term, 'term_unpaid');
      return;
    }

    setActiveLesson(target);
  };

  const handleLessonComplete = (score: number, reexplained: boolean) => {
    // Update student progress metrics
    setStudents(prev =>
      prev.map(s => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            lessonsCompletedThisWeek: Math.min(s.totalLessonsThisWeek, s.lessonsCompletedThisWeek + 1),
            overallScore: Math.round((s.overallScore + score) / 2),
            scoreChangeText: 'EXCELLENT PROGRESS TODAY'
          };
        }
        return s;
      })
    );
    setActiveLesson(null);
    setActiveTab('dashboard');
  };

  const handleAddStudent = (newStudent: StudentProfile) => {
    setStudents(prev => [...prev, newStudent]);
    setActiveStudentId(newStudent.id);
  };

  const handleSubscriptionSuccess = (plan: 'termly' | 'annual', amountPaid: number) => {
    setWalletBalance(prev => Math.max(0, prev - (amountPaid > 0 ? 0 : 3500)));
  };

  // If in active classroom mode, display the full-screen immersive lesson engine
  if (activeLesson) {
    return (
      <ActiveLessonRoom
        lesson={activeLesson}
        student={activeStudent}
        teacher={activeTeacher}
        voiceEnabled={voiceEnabled}
        onExit={() => setActiveLesson(null)}
        onLessonComplete={handleLessonComplete}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F0F9FF] text-slate-900 overflow-hidden font-sans selection:bg-[#FBC02D] selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'subscriptions') {
            setIsSubscribeModalOpen(true);
          } else if (tab === 'regulatory') {
            setIsRegulatoryOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        students={students}
        activeStudent={activeStudent}
        onSelectStudent={(student) => {
          setActiveStudentId(student.id);
          if (student.preferredVoiceTone) {
            setVoiceTone(student.preferredVoiceTone);
          }
        }}
        onOpenAddChildModal={() => setIsAddChildOpen(true)}
        onOpenParentSummary={() => setIsParentDigestOpen(true)}
        onOpenPupilPhotoModal={() => setIsPupilPhotoModalOpen(true)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          activeStudent={activeStudent}
          students={students}
          onSelectStudent={(student) => {
            setActiveStudentId(student.id);
            if (student.preferredVoiceTone) {
              setVoiceTone(student.preferredVoiceTone);
            }
          }}
          onGradeChange={handleGradeChange}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
          voiceTone={voiceTone}
          onSelectVoiceTone={handleSelectVoiceTone}
          onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
          onOpenHandoffModal={() => setIsPinHandoffOpen(true)}
          onOpenTeacherSelector={() => setIsTeacherSelectorOpen(true)}
          activeTeacher={activeTeacher}
          walletBalance={walletBalance}
          isSidebarOpen={isMobileMenuOpen}
          onToggleSidebar={() => setIsMobileMenuOpen(prev => !prev)}
        />

        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              student={activeStudent}
              currentLesson={currentLesson}
              teacher={activeTeacher}
              onStartLesson={handleStartLesson}
              onViewAllLessons={() => setActiveTab('lessons')}
              onOpenProgress={() => setActiveTab('progress')}
              onOpenPupilPhotoModal={() => setIsPupilPhotoModalOpen(true)}
            />
          )}

          {activeTab === 'lessons' && (
            <MyLessonsView
              student={activeStudent}
              onSelectLesson={handleStartLesson}
              onGradeChange={handleGradeChange}
              onRequestTuitionPayment={handleRequestTuitionPayment}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressAnalyticsView
              student={activeStudent}
              onOpenParentDigest={() => setIsParentDigestOpen(true)}
            />
          )}

          {activeTab === 'help' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-xl font-black font-display uppercase text-slate-800">
                  Parent Help & NERDC Guidance
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Brightly Home Lesson is structured around the <strong>"Teach for Mastery Before Speed"</strong> pedagogical philosophy. Pupils learn at their own pace without countdown timers or pressure.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="text-xs font-black text-blue-900 uppercase">How do the 6 Phases work?</h4>
                    <p className="text-[11px] text-blue-800 mt-1">
                      Each 30-minute lesson includes Welcome, Real-life Concrete Context, Whiteboard direct instruction, Guided practice, Diagnostic check, and Parent Wrap-up.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="text-xs font-black text-amber-900 uppercase">What if my child scores below 70%?</h4>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Our Adaptive AI Tutor immediately re-explains the missed concept using Nigerian food and market analogies (Agege bread, meat pies, Naira currency) with zero penalty!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xl font-black font-display uppercase text-slate-800">
                  Account & Parent Settings
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold">Security PIN Protection</span>
                    <span className="text-emerald-600 font-black">Active (1234)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold">Voice Tone Preference</span>
                    <span className="text-[#026838] font-black uppercase">
                      {voiceTone === 'phonics' ? '🗣️ Phonics Voice' : '🎙️ Nigerian Teacher'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold">Registered Class Access</span>
                    <span className="text-blue-600 font-black">Primary {activeStudent.registeredGrade} (Termly Tuition)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold">Academic Progress Reports</span>
                    <span className="text-emerald-600 font-black">In-App Parent Portal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <SubscriptionsModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
        walletBalance={walletBalance}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />

      <ParentPortalModal
        isOpen={isParentDigestOpen}
        onClose={() => setIsParentDigestOpen(false)}
        student={activeStudent}
        voiceTone={voiceTone}
        onSelectVoiceTone={handleSelectVoiceTone}
        onRequestTuitionPayment={handleRequestTuitionPayment}
      />

      <RegulatoryModal
        isOpen={isRegulatoryOpen}
        onClose={() => setIsRegulatoryOpen(false)}
      />

      <TeacherSelectorModal
        isOpen={isTeacherSelectorOpen}
        onClose={() => setIsTeacherSelectorOpen(false)}
        selectedTeacher={activeTeacher}
        onSelectTeacher={(t) => setActiveTeacher(t)}
        voiceTone={voiceTone}
        onSelectVoiceTone={handleSelectVoiceTone}
      />

      <PinHandoffModal
        isOpen={isPinHandoffOpen}
        onClose={() => setIsPinHandoffOpen(false)}
        onSuccess={() => setIsParentDigestOpen(true)}
        targetRole="parent"
      />

      <AddChildModal
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        onAddStudent={handleAddStudent}
      />

      <PupilPhotoModal
        isOpen={isPupilPhotoModalOpen}
        onClose={() => setIsPupilPhotoModalOpen(false)}
        student={activeStudent}
        onSaveAvatar={handleSavePupilPhoto}
      />

      <TermlyTuitionModal
        isOpen={tuitionModalState.isOpen}
        onClose={() => setTuitionModalState(prev => ({ ...prev, isOpen: false }))}
        student={activeStudent}
        targetGrade={tuitionModalState.grade}
        targetTerm={tuitionModalState.term}
        reason={tuitionModalState.reason}
        onPaymentSuccess={handleTuitionSuccess}
      />
    </div>
  );
}
export default App;

