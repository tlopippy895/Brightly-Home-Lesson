import { StudentProfile, ParentAccount, WalletTransaction, GradeLevel, VoiceTone } from './types';

// Initial Seed Data
const initialStudents: StudentProfile[] = [
  {
    id: 'chidi',
    name: 'Chidi',
    grade: 4,
    registeredGrade: 4,
    pin: '1234',
    avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
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
        topicId: 'p4_t1_w1_math',
        subject: 'Mathematics',
        title: 'Whole Numbers & Place Value up to 100,000',
        score: 95,
        badge: 'Math Pioneer',
        reexplained: false,
        completedAt: '2026-01-15T10:00:00Z'
      },
      {
        topicId: 'p4_t1_w2_math',
        subject: 'Mathematics',
        title: 'Fractions with Agege Bread & Nigerian Yam',
        score: 85,
        badge: 'Concrete Thinker',
        reexplained: true,
        completedAt: '2026-01-22T11:30:00Z'
      }
    ],
    activeSubscription: true,
    preferredVoiceTone: 'nigerian_teacher',
    termlyTuition: {
      1: {
        paid: true,
        term: 1,
        grade: 4,
        amount: 12000,
        reference: 'NERDC-TERM1-9842',
        receiptNo: 'BRT-TERM-41-984201',
        channel: 'Paystack',
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
    avatarUrl: '/assets/nigerian_pupil_girl_1788178854346.jpg',
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
        topicId: 'p2_t1_w1_eng',
        subject: 'English Studies',
        title: 'Phonics: Short Vowels with Relatable Words',
        score: 92,
        badge: 'Phonics Star',
        reexplained: false,
        completedAt: '2026-01-18T14:00:00Z'
      }
    ],
    activeSubscription: true,
    preferredVoiceTone: 'phonics',
    termlyTuition: {
      1: {
        paid: true,
        term: 1,
        grade: 2,
        amount: 12000,
        reference: 'NERDC-TERM1-6311',
        receiptNo: 'BRT-TERM-21-631102',
        channel: 'Paystack',
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
    avatarUrl: '/assets/nigerian_pupil_boy_1788178837558.jpg',
    avatarColor: '#D97706',
    currentTerm: 1,
    currentWeek: 3,
    overallScore: 85,
    scoreChangeText: 'UP 3% FROM LAST TERM',
    topSubject: 'Basic Science & Technology',
    lessonsCompletedThisWeek: 4,
    totalLessonsThisWeek: 5,
    completedLessons: [
      {
        topicId: 'p5_t1_w1_sci',
        subject: 'Basic Science & Technology',
        title: 'Living Things & The MR NIGER D Characteristics',
        score: 88,
        badge: 'Science Explorer',
        reexplained: false,
        completedAt: '2026-01-20T09:00:00Z'
      }
    ],
    activeSubscription: true,
    preferredVoiceTone: 'nigerian_teacher',
    termlyTuition: {
      1: {
        paid: true,
        term: 1,
        grade: 5,
        amount: 12000,
        reference: 'NERDC-TERM1-4190',
        receiptNo: 'BRT-TERM-51-419003',
        channel: 'Paystack',
        paidAt: '2026-01-15T11:00:00.000Z'
      }
    }
  }
];

let parentAccount: ParentAccount = {
  id: 'parent_main',
  name: 'Mr. & Mrs. Okafor',
  email: 'parents@brightly.ng',
  pin: '1234',
  phone: '+234 803 123 4567',
  walletBalance: 3500,
  referralCode: 'BRIGHT-PUPIL-88',
  referredCount: 3,
  subscriptionPlan: 'none',
  subscriptionExpiry: '2026-12-31T23:59:59.000Z'
};

const transactions: WalletTransaction[] = [
  {
    id: 'tx_init_01',
    type: 'credit',
    amount: 5000,
    description: 'Wallet funding via Paystack',
    channel: 'Paystack',
    reference: 'PAY-INIT-5000-01',
    date: '2026-01-05T10:00:00Z'
  },
  {
    id: 'tx_init_02',
    type: 'debit',
    amount: 1500,
    description: 'Diagnostic assessment material bundle',
    channel: 'Internal Wallet',
    reference: 'BHL-DIAG-1500',
    date: '2026-01-08T12:00:00Z'
  }
];

const studentsStore: Map<string, StudentProfile> = new Map(
  initialStudents.map(s => [s.id, s])
);

export const db = {
  // Students
  getStudents: (): StudentProfile[] => {
    return Array.from(studentsStore.values());
  },

  getStudentById: (id: string): StudentProfile | undefined => {
    return studentsStore.get(id);
  },

  addStudent: (student: StudentProfile): StudentProfile => {
    studentsStore.set(student.id, student);
    return student;
  },

  updateStudent: (id: string, updates: Partial<StudentProfile>): StudentProfile | null => {
    const existing = studentsStore.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    studentsStore.set(id, updated);
    return updated;
  },

  updateStudentGrade: (id: string, grade: GradeLevel): StudentProfile | null => {
    const existing = studentsStore.get(id);
    if (!existing) return null;
    existing.grade = grade;
    studentsStore.set(id, existing);
    return existing;
  },

  updateStudentVoiceTone: (id: string, tone: VoiceTone): StudentProfile | null => {
    const existing = studentsStore.get(id);
    if (!existing) return null;
    existing.preferredVoiceTone = tone;
    studentsStore.set(id, existing);
    return existing;
  },

  updateStudentAvatar: (id: string, avatarUrl: string): StudentProfile | null => {
    const existing = studentsStore.get(id);
    if (!existing) return null;
    existing.avatarUrl = avatarUrl;
    studentsStore.set(id, existing);
    return existing;
  },

  recordLessonComplete: (
    studentId: string,
    lessonData: {
      topicId: string;
      subject: any;
      title: string;
      score: number;
      reexplained: boolean;
    }
  ): StudentProfile | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;

    const badge = lessonData.score >= 90 ? 'Mastery Champion' : lessonData.score >= 70 ? 'Skill Achiever' : 'Learning Star';
    
    student.completedLessons.push({
      topicId: lessonData.topicId,
      subject: lessonData.subject,
      title: lessonData.title,
      score: lessonData.score,
      badge,
      reexplained: lessonData.reexplained,
      completedAt: new Date().toISOString()
    });

    student.lessonsCompletedThisWeek = Math.min(student.totalLessonsThisWeek, student.lessonsCompletedThisWeek + 1);
    student.overallScore = Math.round((student.overallScore + lessonData.score) / 2);
    student.scoreChangeText = lessonData.score >= 70 ? 'EXCELLENT PROGRESS TODAY' : 'CONTINUING MASTERY';

    studentsStore.set(studentId, student);
    return student;
  },

  // Tuition & Enrollment
  recordTuitionPayment: (
    studentId: string,
    grade: GradeLevel,
    term: number,
    amount: number,
    channel: 'Paystack' | 'Bank Transfer' | 'Flutterwave' | 'USSD' | 'Wallet',
    receiptNo: string
  ): { student: StudentProfile; receipt: any } | null => {
    const student = studentsStore.get(studentId);
    if (!student) return null;

    const now = new Date().toISOString();
    const reference = `REF-${grade}${term}-${Date.now().toString().slice(-6)}`;

    if (!student.termlyTuition) {
      student.termlyTuition = {};
    }

    student.termlyTuition[term] = {
      paid: true,
      paidAt: now,
      amount,
      term,
      grade,
      reference,
      receiptNo,
      channel,
      accessExpires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString() // 100 days term validity
    };

    // Promote / register class
    student.registeredGrade = grade;
    student.grade = grade;
    student.currentTerm = term as 1 | 2 | 3;

    studentsStore.set(studentId, student);

    // Record in transactions if paid via wallet
    if (channel === 'Wallet') {
      db.debitWallet(amount, `Primary ${grade} Term ${term} NERDC Tuition for ${student.name}`);
    } else {
      transactions.unshift({
        id: `tx_${Date.now()}`,
        type: 'credit',
        amount,
        description: `Tuition Paid (${channel}): Pri ${grade} Term ${term} for ${student.name}`,
        channel,
        reference,
        date: now
      });
    }

    const receipt = {
      receiptNo,
      reference,
      studentName: student.name,
      studentId: student.id,
      grade,
      term,
      amount,
      channel,
      date: now,
      curriculum: 'NERDC Basic Education Standard',
      status: 'VERIFIED & ENROLLED'
    };

    return { student, receipt };
  },

  // Wallet
  getWallet: () => {
    return {
      balance: parentAccount.walletBalance,
      transactions: transactions.slice(0, 15)
    };
  },

  creditWallet: (amount: number, description: string, channel = 'Paystack'): number => {
    parentAccount.walletBalance += amount;
    transactions.unshift({
      id: `tx_${Date.now()}`,
      type: 'credit',
      amount,
      description,
      channel,
      reference: `PAY-DEP-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString()
    });
    return parentAccount.walletBalance;
  },

  debitWallet: (amount: number, description: string): { success: boolean; newBalance: number; error?: string } => {
    if (parentAccount.walletBalance < amount) {
      return { success: false, newBalance: parentAccount.walletBalance, error: 'Insufficient wallet balance' };
    }
    parentAccount.walletBalance -= amount;
    transactions.unshift({
      id: `tx_${Date.now()}`,
      type: 'debit',
      amount,
      description,
      channel: 'Wallet Deduction',
      reference: `WAL-DEB-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString()
    });
    return { success: true, newBalance: parentAccount.walletBalance };
  },

  // Parent Auth & PIN
  verifyParentPin: (pin: string): boolean => {
    return pin === parentAccount.pin;
  },

  updateParentPin: (oldPin: string, newPin: string): boolean => {
    if (oldPin === parentAccount.pin && newPin.length === 4) {
      parentAccount.pin = newPin;
      return true;
    }
    return false;
  },

  getParentAccount: (): Omit<ParentAccount, 'pin'> => {
    const { pin, ...safeAccount } = parentAccount;
    return safeAccount;
  }
};
