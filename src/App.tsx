import React, { useState, useEffect } from 'react';
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
import { SignInGateway } from './components/SignInGateway';
import { UserProfileSettingsModal } from './components/UserProfileSettingsModal';
import { ClassSelectionView } from './components/ClassSelectionView';
import { SubjectSelectionView } from './components/SubjectSelectionView';
import { MasteryResultView } from './components/MasteryResultView';
import { PaymentSubscriptionView } from './components/PaymentSubscriptionView';
import { ParentDashboardView } from './components/ParentDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { PupilPortalView } from './components/PupilPortalView';

import { StudentProfile, LessonTopic, GradeLevel, TeacherPersona, VoiceTone, SubjectName, UserRole } from './types';
import { NIGERIAN_TEACHERS, getTeacherForLesson, getTeacherForGrade } from './data/teachers';
import { CURRICULUM_DATA } from './data/curriculum';
import { api } from './services/api';
import pupilBoy from './assets/images/nigerian_pupil_boy_1788178837558.jpg';
import pupilGirl from './assets/images/nigerian_pupil_girl_1788178854346.jpg';
import { ParentSignUpResult } from './components/ParentSignUpFlow';

export function App() {
  // Active App State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'classes' | 'subjects' | 'lessons' | 'progress' | 'subscriptions' | 'admin' | 'settings' | 'help' | 'regulatory' | 'assessment-result'>('dashboard');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');

  // User Authentication & Role Gateway ('parent' | 'pupil' | 'admin' | 'guest')
  // Initialized to null so the SignInGateway matching the user's screenshot is the very first thing shown!
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  // Last Completed Lesson Assessment (for the dedicated Assessment / Mastery Result Page)
  const [lastCompletedAssessment, setLastCompletedAssessment] = useState<{
    lesson: LessonTopic;
    score: number;
    reexplained: boolean;
  } | null>(null);

  // Student Profiles State with Class Registration & Termly Tuition Tracking
  const [students, setStudents] = useState<StudentProfile[]>([
    {
      id: 'chidi',
      name: 'Chidi',
      username: 'chidi',
      password: '1234',
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
      completedLessons: [
        {
          topicId: 'p4-t1-w1-math',
          subject: 'Mathematics',
          title: 'Whole Numbers & Place Value up to 100,000',
          score: 95,
          badge: 'Strong Mastery',
          reexplained: false,
          completedAt: '2026-01-15T10:00:00Z'
        },
        {
          topicId: 'p4-t1-w2-math',
          subject: 'Mathematics',
          title: 'Proper & Improper Fractions',
          score: 85,
          badge: 'Mastered',
          reexplained: true,
          completedAt: '2026-01-22T11:30:00Z'
        },
        {
          topicId: 'p4-t1-w1-sci',
          subject: 'Basic Science & Technology',
          title: 'Living & Non-Living Things in Our Environment',
          score: 96,
          badge: 'Strong Mastery',
          reexplained: false,
          completedAt: '2026-01-24T14:00:00Z'
        }
      ],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 4,
          amount: 6000,
          reference: 'NERDC-TERM1-9842',
          paidAt: '2026-01-10T08:30:00.000Z'
        }
      }
    },
    {
      id: 'aminat',
      name: 'Aminat',
      username: 'aminat',
      password: '1234',
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
      completedLessons: [
        {
          topicId: 'p2-t1-w1-eng',
          subject: 'English Studies',
          title: 'Phonics & Two-Letter Word Blending',
          score: 94,
          badge: 'Mastered',
          reexplained: false,
          completedAt: '2026-01-14T09:00:00Z'
        },
        {
          topicId: 'p2-t1-w1-math',
          subject: 'Mathematics',
          title: 'Counting 1 to 50 with Bottle Tops',
          score: 90,
          badge: 'Mastered',
          reexplained: true,
          completedAt: '2026-01-20T10:15:00Z'
        }
      ],
      activeSubscription: true,
      preferredVoiceTone: 'nigerian_teacher',
      termlyTuition: {
        1: {
          paid: true,
          term: 1,
          grade: 2,
          amount: 6000,
          reference: 'NERDC-TERM1-6311',
          paidAt: '2026-01-12T09:15:00.000Z'
        }
      }
    },
    {
      id: 'tunde',
      name: 'Tunde',
      username: 'tunde',
      password: '1234',
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
          amount: 6000,
          reference: 'NERDC-TERM1-4190',
          paidAt: '2026-01-15T11:00:00.000Z'
        }
      }
    }
  ]);

  const [activeStudentId, setActiveStudentId] = useState<string>('chidi');
  const activeStudent = students.find(s => s.id === activeStudentId) || students[0];

  // Teacher Persona State
  const [activeTeacher, setActiveTeacher] = useState<TeacherPersona>(() => getTeacherForGrade(activeStudent.grade));

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
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  // Backend Initialization: fetch authoritative student state & wallet balance
  useEffect(() => {
    async function initBackendState() {
      try {
        const [backendStudents, wallet] = await Promise.all([
          api.getStudents(),
          api.getWallet()
        ]);

        if (backendStudents && backendStudents.length > 0) {
          const synced = backendStudents.map(bs => ({
            ...bs,
            avatarUrl: bs.avatarUrl && (bs.avatarUrl.includes('/assets/') || !bs.avatarUrl.startsWith('data:'))
              ? (bs.name.toLowerCase().includes('aminat') ? pupilGirl : pupilBoy)
              : (bs.avatarUrl || pupilBoy)
          }));
          setStudents(synced);
        }

        if (wallet && typeof wallet.balance === 'number') {
          setWalletBalance(wallet.balance);
        }
      } catch (err) {
        console.warn('Backend sync initialized with local state:', err);
      }
    }
    initBackendState();
  }, []);

  // Automatically synchronize active class teacher when active student changes
  useEffect(() => {
    setActiveTeacher(getTeacherForGrade(activeStudent.grade));
  }, [activeStudent.grade, activeStudent.id]);

  // Handle voice tone change & persist to student profile
  const handleSelectVoiceTone = (tone: VoiceTone) => {
    setVoiceTone(tone);
    setStudents(prev =>
      prev.map(s => s.id === activeStudent.id ? { ...s, preferredVoiceTone: tone } : s)
    );
    api.updateVoiceTone(activeStudent.id, tone).catch(() => {});
  };

  // Handle grade level switcher
  const handleGradeChange = (grade: GradeLevel) => {
    setStudents(prev =>
      prev.map(s => s.id === activeStudent.id ? { ...s, grade } : s)
    );
    api.updateGrade(activeStudent.id, grade).catch(() => {});
  };

  // Handle pupil photo customization / upload
  const handleSavePupilPhoto = (newAvatarUrl: string) => {
    setStudents(prev =>
      prev.map(s => s.id === activeStudent.id ? { ...s, avatarUrl: newAvatarUrl } : s)
    );
    api.updateAvatar(activeStudent.id, newAvatarUrl).catch(() => {});
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
  const handleTuitionSuccess = async (...args: any[]) => {
    let studentId = activeStudent.id;
    let grade: GradeLevel = activeStudent.grade;
    let term = activeStudent.currentTerm;
    let amount = 6000;
    let channel: any = 'Paystack';
    let receiptNo = '';
    let updatedStudentFromServer: StudentProfile | undefined;

    if (args.length === 1 && typeof args[0] === 'object') {
      const payment = args[0];
      studentId = payment.studentId || activeStudent.id;
      grade = payment.grade || activeStudent.grade;
      term = payment.term || activeStudent.currentTerm;
      amount = payment.amount || 6000;
      channel = payment.channel || 'Paystack';
      receiptNo = payment.receiptNo || payment.reference || '';
      updatedStudentFromServer = payment.updatedStudent;
    } else if (args.length >= 3) {
      studentId = args[0];
      grade = args[1];
      term = args[2];
      amount = args[3] || 6000;
      channel = args[4] || 'Paystack';
      receiptNo = args[5] || '';
      updatedStudentFromServer = args[6];
    }

    // 1. Immediately apply verified access to React state so user is NEVER blocked
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          if (updatedStudentFromServer) {
            return {
              ...s,
              ...updatedStudentFromServer,
              avatarUrl: s.avatarUrl,
              grade: grade,
              registeredGrade: grade,
              currentTerm: term as 1 | 2 | 3,
              activeSubscription: true
            };
          }

          const updatedTuition = { ...(s.termlyTuition || {}) };
          updatedTuition[term] = {
            paid: true,
            term,
            grade,
            amount,
            reference: receiptNo || `NERDC-TERM${term}-${Date.now().toString().slice(-4)}`,
            receiptNo: receiptNo || `BRT-TERM-${grade}${term}-${Date.now().toString().slice(-4)}`,
            channel: channel || 'Paystack',
            paidAt: new Date().toISOString()
          };

          return {
            ...s,
            registeredGrade: grade,
            grade: grade,
            currentTerm: term as 1 | 2 | 3,
            activeSubscription: true,
            termlyTuition: updatedTuition
          };
        }
        return s;
      })
    );

    // 2. Refresh wallet balance in background
    api.getWallet().then(w => {
      if (w && typeof w.balance === 'number') {
        setWalletBalance(w.balance);
      }
    }).catch(() => {});
  };

  // Direct action when user clicks "Enter Class & Start Learning" from payment receipt
  const handleEnterClassAfterPayment = (grade: GradeLevel, term: number) => {
    setTuitionModalState(prev => ({ ...prev, isOpen: false }));
    const matchedLesson = CURRICULUM_DATA.find(l => l.grade === grade && l.term === term) ||
      CURRICULUM_DATA.find(l => l.grade === grade) ||
      currentLesson;
    setActiveLesson(matchedLesson);
  };

  // Get current active lesson for the student
  const currentGradeLessons = CURRICULUM_DATA.filter(l => l.grade === activeStudent.grade);
  const currentLesson = currentGradeLessons[0] || CURRICULUM_DATA[0];

  // Trigger lesson startup with backend feature gate check
  const handleStartLesson = async (lesson?: LessonTopic) => {
    const target = lesson || currentLesson;
    const targetTeacher = getTeacherForLesson(target);
    setActiveTeacher(targetTeacher);
    const term = target.term || activeStudent.currentTerm;

    const isEnrolledInClass = activeStudent.registeredGrade === target.grade || activeStudent.grade === target.grade;
    const isTermTuitionPaid = isEnrolledInClass && (activeStudent.termlyTuition?.[term]?.paid || activeStudent.activeSubscription);

    // Fast-path: If user has paid for this term, has active subscription, or introductory lesson
    if (target.isFree || (target.week === 1 && isEnrolledInClass) || isTermTuitionPaid) {
      setActiveLesson(target);
      // Synchronize in background with backend
      api.checkLessonAccess(activeStudent.id, target.grade, term, target.week, Boolean(target.isFree)).catch(() => {});
      return;
    }

    try {
      const accessCheck = await api.checkLessonAccess(
        activeStudent.id,
        target.grade,
        term,
        target.week,
        Boolean(target.isFree)
      );

      if (accessCheck.allowed) {
        setActiveLesson(target);
        return;
      }

      // Check if client knows tuition is settled
      if (isTermTuitionPaid) {
        setActiveLesson(target);
        return;
      }

      const modalReason = accessCheck.reason === 'term_unpaid' ? 'term_unpaid' : 'unregistered_class';
      handleRequestTuitionPayment(
        target.grade, 
        term, 
        modalReason
      );
    } catch (err) {
      console.warn('Backend access-check fallback:', err);
      if (isTermTuitionPaid || target.isFree) {
        setActiveLesson(target);
      } else if (!isEnrolledInClass) {
        handleRequestTuitionPayment(target.grade, term, 'unregistered_class');
      } else {
        handleRequestTuitionPayment(target.grade, term, 'term_unpaid');
      }
    }
  };

  const handleLessonComplete = async (score: number, reexplained: boolean) => {
    if (activeLesson) {
      const completed = activeLesson;
      try {
        const result = await api.completeLesson(activeStudent.id, {
          topicId: activeLesson.id,
          subject: activeLesson.subject,
          title: activeLesson.topic,
          score,
          reexplained
        });
        if (result && result.student) {
          setStudents(prev =>
            prev.map(s => s.id === activeStudent.id ? { ...s, ...result.student, avatarUrl: s.avatarUrl } : s)
          );
        }
      } catch (err) {
        console.warn('Backend lesson progress sync fallback:', err);
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
      }

      setLastCompletedAssessment({
        lesson: completed,
        score,
        reexplained
      });
      setActiveLesson(null);
      setActiveTab('assessment-result');
      return;
    }
    setActiveLesson(null);
    setActiveTab('dashboard');
  };

  const handleAddStudent = async (newStudent: StudentProfile) => {
    try {
      const added = await api.addStudent({
        name: newStudent.name,
        grade: newStudent.grade,
        avatarColor: newStudent.avatarColor,
        preferredVoiceTone: newStudent.preferredVoiceTone
      });
      if (added) {
        const studentWithAvatar = {
          ...added,
          avatarUrl: added.avatarUrl && (added.avatarUrl.includes('/assets/') || !added.avatarUrl.startsWith('data:'))
            ? (added.name.toLowerCase().includes('aminat') ? pupilGirl : pupilBoy)
            : added.avatarUrl
        };
        setStudents(prev => [...prev, studentWithAvatar]);
        setActiveStudentId(added.id);
        return;
      }
    } catch (err) {
      console.warn('Backend student creation fallback:', err);
    }
    setStudents(prev => [...prev, newStudent]);
    setActiveStudentId(newStudent.id);
  };

  const handleSubscriptionSuccess = (plan: 'termly' | 'annual', amountPaid: number) => {
    setWalletBalance(prev => Math.max(0, prev - (amountPaid > 0 ? 0 : 3500)));
    // Grant active subscription and unlock terms for active student
    setStudents(prev =>
      prev.map(s => {
        if (s.id === activeStudent.id) {
          const updatedTuition = { ...(s.termlyTuition || {}) };
          [1, 2, 3].forEach(t => {
            updatedTuition[t] = {
              paid: true,
              term: t,
              grade: s.grade,
              amount: plan === 'annual' ? 15000 : 6000,
              reference: `SUB-${plan.toUpperCase()}-${Date.now().toString().slice(-6)}`,
              paidAt: new Date().toISOString()
            };
          });
          return {
            ...s,
            registeredGrade: s.grade,
            activeSubscription: true,
            termlyTuition: updatedTuition
          };
        }
        return s;
      })
    );
  };

  // Handle Parent Sign Up Flow (Sign up parent, pupil/pupils, click term & make payment)
  const handleParentSignUpComplete = (result: ParentSignUpResult) => {
    const createdProfiles: StudentProfile[] = result.pupils.map((p, idx) => {
      const termTuition: Record<number, any> = {};
      if (result.isAnnual) {
        [1, 2, 3].forEach((t) => {
          termTuition[t] = {
            paid: true,
            term: t,
            grade: p.grade,
            amount: 5000, // ₦15,000 total annual divided across 3 terms
            reference: result.receiptNo,
            receiptNo: result.receiptNo,
            channel: result.paymentMethod,
            paidAt: new Date().toISOString(),
          };
        });
      } else {
        termTuition[result.term] = {
          paid: true,
          term: result.term,
          grade: p.grade,
          amount: 6000,
          reference: result.receiptNo,
          receiptNo: result.receiptNo,
          channel: result.paymentMethod,
          paidAt: new Date().toISOString(),
        };
      }

      const generatedId = p.id || `pupil_${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;

      return {
        id: generatedId,
        name: p.name,
        username: p.name.toLowerCase().replace(/\s+/g, ''),
        password: result.parent.pin || '1234',
        grade: p.grade,
        registeredGrade: p.grade,
        pin: result.parent.pin || '1234',
        avatarUrl: p.avatarUrl || (p.gender === 'girl' ? pupilGirl : pupilBoy),
        avatarColor: p.avatarColor || (p.gender === 'girl' ? '#D97706' : '#008751'),
        currentTerm: (result.term as 1 | 2 | 3) || 1,
        currentWeek: 1,
        lessonsCompletedThisWeek: 0,
        totalLessonsThisWeek: 5,
        topSubject: 'Mathematics',
        overallScore: 90,
        scoreChangeText: 'JUST ENROLLED & ACTIVATED',
        completedLessons: [],
        activeSubscription: true,
        preferredVoiceTone: p.preferredVoiceTone || 'nigerian_teacher',
        termlyTuition: termTuition,
      };
    });

    // Sync each created pupil to the backend
    createdProfiles.forEach((cp) => {
      api.addStudent({
        name: cp.name,
        grade: cp.grade,
        avatarColor: cp.avatarColor,
        preferredVoiceTone: cp.preferredVoiceTone,
        avatarUrl: cp.avatarUrl,
      }).catch(() => {});
    });

    // Update students list
    setStudents((prev) => [...prev, ...createdProfiles]);

    // Select the first new pupil as active student
    if (createdProfiles.length > 0) {
      setActiveStudentId(createdProfiles[0].id);
      if (createdProfiles[0].preferredVoiceTone) {
        setVoiceTone(createdProfiles[0].preferredVoiceTone);
      }
    }

    // Set role to 'parent' and view the page after sign up
    setCurrentRole('parent');
    setActiveTab('dashboard');
  };

  // 0. The Gateway Card is the very first thing displayed when the app loads
  if (!currentRole) {
    return (
      <SignInGateway
        onSignInAsParent={(studentId) => {
          if (studentId) {
            setActiveStudentId(studentId);
          }
          setCurrentRole('parent');
          setActiveTab('dashboard');
        }}
        onSignInAsPupil={(studentId) => {
          if (studentId) {
            setActiveStudentId(studentId);
          }
          setCurrentRole('pupil');
          setActiveTab('dashboard');
        }}
        onSignInAsAdmin={() => {
          setCurrentRole('admin');
          setActiveTab('admin');
        }}
        onContinueAsGuest={() => {
          setCurrentRole('guest');
          setActiveTab('dashboard');
        }}
        onSignUpComplete={handleParentSignUpComplete}
        students={students}
        activeStudent={activeStudent}
      />
    );
  }

  // If in active classroom mode, display the full-screen immersive lesson engine
  if (activeLesson) {
    return (
      <ActiveLessonRoom
        lesson={activeLesson}
        student={activeStudent}
        teacher={getTeacherForLesson(activeLesson)}
        voiceEnabled={voiceEnabled}
        onExit={() => setActiveLesson(null)}
        onLessonComplete={handleLessonComplete}
      />
    );
  }

  // DEDICATED CHILD-CENTRED PUPIL LEARNING EXPERIENCE
  // Simple, encouraging, voice-guided virtual classroom without adult LMS complexity
  if (currentRole === 'pupil') {
    if (activeTab === 'assessment-result') {
      return (
        <MasteryResultView
          lesson={lastCompletedAssessment?.lesson || currentLesson}
          student={activeStudent}
          score={lastCompletedAssessment?.score || 90}
          reexplained={lastCompletedAssessment?.reexplained || false}
          teacher={getTeacherForLesson(lastCompletedAssessment?.lesson || currentLesson)}
          onContinueToNextLesson={() => setActiveTab('dashboard')}
          onRetakePractice={() => {
            if (lastCompletedAssessment?.lesson) {
              setActiveLesson(lastCompletedAssessment.lesson);
            } else {
              setActiveLesson(currentLesson);
            }
          }}
          onViewParentReport={() => setActiveTab('dashboard')}
          onExploreCurriculum={() => setActiveTab('dashboard')}
        />
      );
    }

    return (
      <PupilPortalView
        student={activeStudent}
        allLessons={CURRICULUM_DATA}
        voiceEnabled={voiceEnabled}
        voiceTone={voiceTone}
        onStartLesson={handleStartLesson}
        onSignOut={() => setCurrentRole(null)}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
      />
    );
  }

  // Parent Governance Security Guard: only authenticated Parents can directly access Parent Governance
  const handleOpenParentPortal = () => {
    if (currentRole === 'parent') {
      setIsParentDigestOpen(true);
    } else {
      // Must authenticate with 4-digit Parent Security PIN (default: 1234)
      setIsPinHandoffOpen(true);
    }
  };

  return (
    <div className="flex h-screen bg-[#EBF5FB] text-slate-900 overflow-hidden font-sans selection:bg-[#F59E0B] selection:text-black w-full max-w-full">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'subscriptions') {
            setIsSubscribeModalOpen(true);
          } else if (tab === 'regulatory') {
            setIsRegulatoryOpen(true);
          } else if (tab === 'settings') {
            setIsProfileSettingsOpen(true);
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
        onOpenParentSummary={handleOpenParentPortal}
        onOpenPupilPhotoModal={() => setIsPupilPhotoModalOpen(true)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentRole={currentRole}
        onSignOut={() => setCurrentRole(null)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden w-full max-w-full">
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
          onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
          activeTeacher={activeTeacher}
          walletBalance={walletBalance}
          isSidebarOpen={isMobileMenuOpen}
          onToggleSidebar={() => setIsMobileMenuOpen(prev => !prev)}
          currentRole={currentRole}
          onSignOut={() => setCurrentRole(null)}
        />

        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            currentRole === 'admin' ? (
              <AdminDashboardView
                students={students}
                onClose={() => setActiveTab('admin')}
                onSelectLessonForPreview={(l) => {
                  setActiveLesson(l);
                }}
                currentRole={currentRole}
                onAuthenticatedAsAdmin={() => setCurrentRole('admin')}
              />
            ) : currentRole === 'parent' ? (
              <ParentDashboardView
                students={students}
                activeStudent={activeStudent}
                allLessons={CURRICULUM_DATA}
                walletBalance={walletBalance}
                onSelectStudent={(st) => {
                  setActiveStudentId(st.id);
                  if (st.preferredVoiceTone) setVoiceTone(st.preferredVoiceTone);
                }}
                onOpenAddChild={() => setIsAddChildOpen(true)}
                onOpenTuitionPay={(g, t) => handleRequestTuitionPayment(g, t, 'term_unpaid')}
                onLaunchLessonForChild={(target) => handleStartLesson(target || currentLesson)}
                onSelectVoiceTone={handleSelectVoiceTone}
              />
            ) : (
              <DashboardView
                student={activeStudent}
                currentLesson={currentLesson}
                allLessons={CURRICULUM_DATA}
                teacher={getTeacherForLesson(currentLesson)}
                currentRole={currentRole}
                onStartLesson={handleStartLesson}
                onViewAllLessons={() => setActiveTab('lessons')}
                onPickSubjectForTeaching={(sub) => {
                  setSubjectFilter(sub);
                  setActiveTab('lessons');
                }}
                onOpenProgress={() => setActiveTab('progress')}
                onOpenPupilPhotoModal={() => setIsPupilPhotoModalOpen(true)}
                onOpenParentPortal={handleOpenParentPortal}
              />
            )
          )}

          {activeTab === 'classes' && (
            <ClassSelectionView
              activeStudent={activeStudent}
              students={students}
              allLessons={CURRICULUM_DATA}
              onSelectGrade={handleGradeChange}
              onSelectStudent={(st) => setActiveStudentId(st.id)}
              onExploreCurriculum={(g) => {
                handleGradeChange(g);
                setActiveTab('lessons');
              }}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectSelectionView
              activeStudent={activeStudent}
              allLessons={CURRICULUM_DATA}
              onSelectSubject={(sub) => {
                setSubjectFilter(sub);
                setActiveTab('lessons');
              }}
              onStartLesson={handleStartLesson}
              onExploreClassSelection={() => setActiveTab('classes')}
            />
          )}

          {activeTab === 'lessons' && (
            <MyLessonsView
              student={activeStudent}
              initialSubject={subjectFilter}
              onSelectLesson={handleStartLesson}
              onGradeChange={handleGradeChange}
              onRequestTuitionPayment={handleRequestTuitionPayment}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressAnalyticsView
              student={activeStudent}
              currentRole={currentRole}
              onOpenParentDigest={handleOpenParentPortal}
            />
          )}

          {activeTab === 'subscriptions' && (
            currentRole === 'parent' ? (
              <PaymentSubscriptionView
                activeStudent={activeStudent}
                students={students}
                walletBalance={walletBalance}
                onPaymentSuccess={(t, g, amt) => handleSubscriptionSuccess('termly', amt)}
                onSelectStudent={(st) => setActiveStudentId(st.id)}
              />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[32px] border border-amber-200 max-w-md text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#D97706] flex items-center justify-center text-2xl mx-auto shadow-xs">
                    👨‍👩‍👧
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase font-display">
                    Parent Subscription & Tuition Area
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Subscription packages and tuition payments are managed under Parent Oversight. Ask your parent to sign in or authorize with their 4-digit PIN.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPinHandoffOpen(true)}
                    className="w-full py-3 bg-[#026838] hover:bg-[#014d28] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    Enter Parent Security PIN (1234)
                  </button>
                </div>
              </div>
            )
          )}

          {activeTab === 'admin' && (
            <AdminDashboardView
              students={students}
              onClose={() => setActiveTab(currentRole === 'admin' ? 'admin' : 'dashboard')}
              onSelectLessonForPreview={(l) => {
                setActiveLesson(l);
              }}
              currentRole={currentRole}
              onAuthenticatedAsAdmin={() => setCurrentRole('admin')}
            />
          )}

          {activeTab === 'assessment-result' && (
            <MasteryResultView
              lesson={lastCompletedAssessment?.lesson || currentLesson}
              student={activeStudent}
              score={lastCompletedAssessment?.score || 90}
              reexplained={lastCompletedAssessment?.reexplained || false}
              teacher={getTeacherForLesson(lastCompletedAssessment?.lesson || currentLesson)}
              onContinueToNextLesson={() => {
                setActiveTab('lessons');
              }}
              onRetakePractice={() => {
                if (lastCompletedAssessment?.lesson) {
                  setActiveLesson(lastCompletedAssessment.lesson);
                } else {
                  setActiveLesson(currentLesson);
                }
              }}
              onViewParentReport={() => {
                setActiveTab('progress');
              }}
              onExploreCurriculum={() => {
                setActiveTab('lessons');
              }}
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
                    <h4 className="text-xs font-black text-amber-900 uppercase">What if my child needs more support to understand?</h4>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Our Adaptive Tutor operates on "Mastery Before Moving On". It immediately re-explains the concept using Nigerian food and market analogies (Agege bread, meat pies, Naira currency) with gentle re-teaching until your child understands!
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
                      {voiceTone === 'phonics' ? '🗣️ Phonics Voice' : '🎙️ Nigerian Teacher Voice'}
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
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold">Backend Engine Status</span>
                    <span className="text-[#026838] font-black">✓ Express API & Gate Rules Active</span>
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
        students={students}
        onSelectStudent={(student) => {
          setActiveStudentId(student.id);
          if (student.preferredVoiceTone) {
            setVoiceTone(student.preferredVoiceTone);
          }
        }}
        onOpenAddChild={() => setIsAddChildOpen(true)}
        onOpenSubscribeModal={() => setIsSubscribeModalOpen(true)}
        voiceTone={voiceTone}
        onSelectVoiceTone={handleSelectVoiceTone}
        onRequestTuitionPayment={handleRequestTuitionPayment}
        currentRole={currentRole}
        onAuthenticateParent={() => setCurrentRole('parent')}
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
        onSuccess={() => {
          setCurrentRole('parent');
          setIsPinHandoffOpen(false);
          setIsParentDigestOpen(true);
        }}
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
        onEnterClass={handleEnterClassAfterPayment}
      />

      <UserProfileSettingsModal
        isOpen={isProfileSettingsOpen || activeTab === 'settings'}
        onClose={() => {
          setIsProfileSettingsOpen(false);
          if (activeTab === 'settings') {
            setActiveTab('dashboard');
          }
        }}
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
        onOpenPupilPhotoModal={() => setIsPupilPhotoModalOpen(true)}
        onOpenAddChildModal={() => setIsAddChildOpen(true)}
        activeTeacher={activeTeacher}
        walletBalance={walletBalance}
        currentRole={currentRole}
        onSignOut={() => setCurrentRole(null)}
      />
    </div>
  );
}
export default App;

