import { StudentProfile, GradeLevel, VoiceTone } from '../types';

export interface LessonAccessCheckResponse {
  success: boolean;
  allowed: boolean;
  reason?: 'unregistered_class' | 'term_unpaid' | 'pin_required';
  message: string;
  requiredFee?: number;
  details?: any;
  sessionToken?: string;
}

export interface FeatureGateSummaryResponse {
  success: boolean;
  gates: {
    studentId: string;
    studentName: string;
    registeredGrade: number;
    currentBrowsingGrade: number;
    currentTerm: number;
    activeSubscription: boolean;
    termsStatus: Record<number, { paid: boolean; fee: number; reference?: string }>;
    gradesStatus: Record<number, { isRegistered: boolean; canAccess: boolean }>;
    features: {
      lessonRoom: { enabled: boolean; isGatedForCurrentSelection: boolean };
      aiCurriculumGenerator: { enabled: boolean };
      aiAdaptiveReexplanation: { enabled: boolean };
      voiceNarration: { enabled: boolean };
      parentPortal: { requiresPin: boolean };
      tuitionPayment: { standardTermFee: number; annualPlanDiscount: number };
    };
  };
}

export const api = {
  // 1. Students & Profiles
  async getStudents(): Promise<StudentProfile[]> {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students from backend');
      const data = await res.json();
      return data.students || [];
    } catch (err) {
      console.warn('Backend student fetch fallback:', err);
      return [];
    }
  },

  async addStudent(studentData: {
    name: string;
    grade: GradeLevel;
    avatarColor?: string;
    preferredVoiceTone?: VoiceTone;
    avatarUrl?: string;
  }): Promise<StudentProfile | null> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add student');
    }
    const data = await res.json();
    return data.student;
  },

  async updateGrade(studentId: string, grade: GradeLevel): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`/api/students/${studentId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      });
      const data = await res.json();
      return data.student || null;
    } catch (err) {
      console.error('Error updating grade:', err);
      return null;
    }
  },

  async updateVoiceTone(studentId: string, tone: VoiceTone): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`/api/students/${studentId}/voice-tone`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone }),
      });
      const data = await res.json();
      return data.student || null;
    } catch (err) {
      console.error('Error updating voice tone:', err);
      return null;
    }
  },

  async updateAvatar(studentId: string, avatarUrl: string): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`/api/students/${studentId}/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await res.json();
      return data.student || null;
    } catch (err) {
      console.error('Error updating avatar:', err);
      return null;
    }
  },

  // 2. Feature Gating & Lesson Access
  async checkLessonAccess(
    studentId: string,
    grade: GradeLevel,
    term: number,
    week: number,
    isFree: boolean = false
  ): Promise<LessonAccessCheckResponse> {
    try {
      const res = await fetch('/api/lessons/access-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, grade, term, week, isFree }),
      });

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error checking lesson access:', err);
      return {
        success: false,
        allowed: false,
        reason: 'unregistered_class',
        message: 'Could not connect to backend authorization service.'
      };
    }
  },

  async getFeatureGates(studentId: string): Promise<FeatureGateSummaryResponse | null> {
    try {
      const res = await fetch(`/api/features/gates?studentId=${studentId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error fetching feature gates:', err);
      return null;
    }
  },

  // 3. Lesson Completion & Progress
  async completeLesson(
    studentId: string,
    payload: {
      topicId: string;
      subject: string;
      title: string;
      score: number;
      reexplained?: boolean;
    }
  ): Promise<{ success: boolean; student: StudentProfile }> {
    const res = await fetch('/api/lessons/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, ...payload }),
    });
    return await res.json();
  },

  // 4. Parent Auth & Security PIN
  async verifyParentPin(pin: string): Promise<{ success: boolean; allowed: boolean; message: string; token?: string }> {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, allowed: false, message: 'Authentication network error' };
    }
  },

  // 5. Tuition Payment & Wallet
  async payTuition(
    studentId: string,
    grade: GradeLevel,
    term: number,
    amount: number,
    paymentMethod: string = 'Paystack',
    receiptNo?: string
  ): Promise<{ success: boolean; student: StudentProfile; receipt: any; wallet?: any; message: string }> {
    const res = await fetch('/api/tuition/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        grade,
        term,
        amount,
        paymentMethod,
        receiptNo
      }),
    });
    return await res.json();
  },

  async getWallet(): Promise<{ balance: number; transactions: any[] }> {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      return { balance: data.balance || 0, transactions: data.transactions || [] };
    } catch (err) {
      return { balance: 3500, transactions: [] };
    }
  },

  async fundWallet(amount: number, channel = 'Paystack'): Promise<{ success: boolean; newBalance: number; message: string }> {
    const res = await fetch('/api/wallet/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, channel }),
    });
    return await res.json();
  },

  // 6. AI Adaptive Re-explanation (Gated)
  async reexplainLesson(payload: {
    studentId: string;
    grade: GradeLevel;
    subject: string;
    topic: string;
    studentName: string;
    teacherName: string;
    missedQuestion?: string;
  }): Promise<any> {
    const res = await fetch('/api/lessons/reexplain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Adaptive AI re-explanation failed');
    }
    return await res.json();
  }
};
