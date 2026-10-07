import { StudentProfile, GradeLevel, VoiceTone, ParentAccount, TermPaymentRecord, CurriculumRecord, PublishingStatus, TeachingAidRecord, QuestionRecord, LessonReadinessReport } from '../types';

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

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'parent' | 'pupil' | 'guest';
  parentId?: string;
  studentId?: string;
}

const SESSION_TOKEN_KEY = 'brightly_session_token';
const ACTIVE_USER_KEY = 'brightly_active_user';

export const api = {
  // -------------------------------------------------------------
  // SECURE SESSION TOKEN & AUTHENTICATION MANAGEMENT
  // -------------------------------------------------------------
  setSessionToken(token: string | null, user?: AuthUser | null) {
    if (token) {
      try {
        localStorage.setItem(SESSION_TOKEN_KEY, token);
        if (user) {
          localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
        }
      } catch {
        // Fallback for sandboxed storage
      }
    } else {
      try {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(ACTIVE_USER_KEY);
      } catch {
        // Ignore
      }
    }
  },

  getSessionToken(): string | null {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getCachedUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(ACTIVE_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getSessionToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  async loginAdmin(email: string, password: string): Promise<{ success: boolean; token?: string; user?: AuthUser; message: string }> {
    const res = await fetch('/api/auth/login/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: password.trim() })
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setSessionToken(data.token, data.user);
    }
    return data;
  },

  async rotateAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; token?: string; message: string }> {
    const res = await fetch('/api/admin/rotate-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setSessionToken(data.token, this.getCurrentUser());
    }
    return data;
  },

  async loginParent(email: string, pin: string): Promise<{ success: boolean; token?: string; user?: AuthUser; parent?: ParentAccount; message?: string }> {
    const res = await fetch('/api/auth/login/parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), pin: pin.trim() })
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setSessionToken(data.token, data.user);
    }
    return data;
  },

  async verifyParentPin(pin: string): Promise<{ allowed: boolean; success: boolean; token?: string; message: string; user?: AuthUser; parent?: ParentAccount }> {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin.trim() })
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setSessionToken(data.token, data.user);
    }
    return data;
  },

  async loginPupil(studentId?: string, name?: string, pin = '1234'): Promise<{ success: boolean; token?: string; user?: AuthUser; student?: StudentProfile; message?: string }> {
    const res = await fetch('/api/auth/login/pupil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, name, pin })
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setSessionToken(data.token, data.user);
    }
    return data;
  },

  async getMe(): Promise<{ success: boolean; authenticated: boolean; user?: AuthUser | null }> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { success: false, authenticated: false, user: null };
    }
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {
      // Ignore
    } finally {
      this.setSessionToken(null);
    }
    return { success: true };
  },

  // -------------------------------------------------------------
  // 1. STUDENTS & PROFILES
  // -------------------------------------------------------------
  async getStudents(): Promise<StudentProfile[]> {
    try {
      const res = await fetch('/api/students', {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch students from backend');
      const data = await res.json();
      return data.students || [];
    } catch (err) {
      console.warn('Backend student fetch fallback:', err);
      return [];
    }
  },

  async getStudentById(id: string): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.student || null;
    } catch {
      return null;
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
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
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
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ grade }),
      });
      const data = await res.json();
      return data.student || null;
    } catch (err) {
      console.warn('Network issue updating grade:', err);
      return null;
    }
  },

  async updateVoiceTone(studentId: string, tone: VoiceTone): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`/api/students/${studentId}/voice-tone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ tone }),
      });
      const data = await res.json();
      return data.student || null;
    } catch (err) {
      console.warn('Network issue updating voice tone:', err);
      return null;
    }
  },

  async updateAvatar(studentId: string, avatarUrl: string): Promise<StudentProfile | null> {
    try {
      const res = await fetch(`/api/students/${studentId}/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await res.json();
      return data.student || null;
    } catch (err) {
      console.warn('Network issue updating avatar:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // 2. FEATURE GATING & LESSON ACCESS
  // -------------------------------------------------------------
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
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ studentId, grade, term, week, isFree }),
      });

      if (!res.ok) {
        try {
          const errorData = await res.json();
          return errorData;
        } catch {
          // Fall through to resilient evaluation
        }
      } else {
        const data = await res.json();
        return data;
      }
    } catch {
      // Graceful offline and dev fallback
    }

    const isFreeTrialAllowed = Boolean(isFree) || Number(week) === 1;
    return {
      success: true,
      allowed: isFreeTrialAllowed,
      reason: isFreeTrialAllowed ? undefined : 'term_unpaid',
      message: isFreeTrialAllowed 
        ? 'Introductory lesson preview granted under NERDC Free Trial policy.' 
        : 'This curriculum module requires termly tuition verification.'
    };
  },

  async getFeatureGates(studentId: string): Promise<FeatureGateSummaryResponse | null> {
    try {
      const res = await fetch(`/api/features/gates?studentId=${studentId}`, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Network issue fetching feature gates:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // 3. LESSON COMPLETION & PROGRESS
  // -------------------------------------------------------------
  async completeLesson(
    studentId: string,
    payload: {
      topicId: string;
      subject: string;
      title: string;
      score: number;
      reexplained?: boolean;
      objectivesMastery?: { objective: string; mastered: boolean }[];
    }
  ): Promise<{ success: boolean; student: StudentProfile }> {
    const res = await fetch('/api/lessons/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ studentId, ...payload }),
    });
    return await res.json();
  },

  // -------------------------------------------------------------
  // 4. PARENT ACCOUNT
  // -------------------------------------------------------------
  async getParentAccount(): Promise<ParentAccount | null> {
    try {
      const res = await fetch('/api/parent/account', {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch parent account');
      const data = await res.json();
      return data.parent || null;
    } catch (err) {
      console.warn('Backend parent account fetch fallback:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // 5. TUITION PAYMENT, PAYSTACK & WALLET
  // -------------------------------------------------------------
  async initializePaystack(params: {
    studentId: string;
    grade: number;
    term: number;
    planType?: 'termly' | 'annual';
    referralCode?: string;
  }): Promise<{
    success: boolean;
    reference: string;
    authorizationUrl?: string;
    accessCode?: string;
    publicKey?: string;
    amount: number;
    currency: string;
    currencySymbol: string;
    planTitle: string;
    child: { id: string; name: string; grade: number; term: number };
    message: string;
  }> {
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async verifyPaystack(reference: string): Promise<{
    success: boolean;
    verified: boolean;
    status?: string;
    payment?: TermPaymentRecord;
    student?: StudentProfile;
    message?: string;
  }> {
    const res = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
    });
    return res.json();
  },

  async getStudentPayments(studentId: string): Promise<{ success: boolean; payments: TermPaymentRecord[] }> {
    try {
      const res = await fetch(`/api/parent/payments?studentId=${encodeURIComponent(studentId)}`, {
        headers: this.getAuthHeaders()
      });
      return res.json();
    } catch {
      return { success: true, payments: [] };
    }
  },

  async getParentPayments(): Promise<{ success: boolean; payments: TermPaymentRecord[] }> {
    try {
      const res = await fetch('/api/parent/payments', {
        headers: this.getAuthHeaders()
      });
      return res.json();
    } catch {
      return { success: true, payments: [] };
    }
  },

  async getAdminPayments(): Promise<{ success: boolean; payments: TermPaymentRecord[]; count: number }> {
    try {
      const res = await fetch('/api/admin/payments', {
        headers: this.getAuthHeaders()
      });
      return res.json();
    } catch {
      return { success: false, payments: [], count: 0 };
    }
  },

  async payTuition(
    studentId: string,
    grade: GradeLevel,
    term: number,
    amount: number,
    paymentMethod: string = 'Wallet',
    receiptNo?: string,
    verifiedReference?: string
  ): Promise<{ success: boolean; student: StudentProfile; receipt: any; wallet?: any; message: string }> {
    const res = await fetch('/api/tuition/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        studentId,
        grade,
        term,
        amount,
        paymentMethod,
        receiptNo,
        verifiedReference
      }),
    });
    return res.json();
  },

  async getWallet(): Promise<{ balance: number; transactions: any[] }> {
    try {
      const res = await fetch('/api/wallet', {
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      return { balance: data.balance || 0, transactions: data.transactions || [] };
    } catch {
      return { balance: 3500, transactions: [] };
    }
  },

  async fundWallet(amount: number, channel = 'Paystack'): Promise<{ success: boolean; newBalance: number; message: string }> {
    const res = await fetch('/api/wallet/fund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ amount, channel }),
    });
    return await res.json();
  },

  // -------------------------------------------------------------
  // 6. ADAPTIVE RE-EXPLANATION
  // -------------------------------------------------------------
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
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Adaptive re-explanation failed');
    }
    return await res.json();
  },

  // -------------------------------------------------------------
  // 7. ADMIN CURRICULUM MANAGEMENT CLIENT APIS (STRICT BEARER AUTH)
  // -------------------------------------------------------------
  async getCurriculumCoverage(): Promise<{ success: boolean; coverage: any }> {
    try {
      const res = await fetch('/api/admin/curriculum/coverage', {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { success: false, coverage: null };
    }
  },

  async getCurriculumRecords(params?: {
    grade?: number;
    subject?: string;
    term?: number;
    week?: number;
    status?: string;
  }): Promise<{ success: boolean; count: number; records: CurriculumRecord[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.grade) query.append('grade', String(params.grade));
      if (params?.subject && params.subject !== 'All') query.append('subject', params.subject);
      if (params?.term) query.append('term', String(params.term));
      if (params?.week) query.append('week', String(params.week));
      if (params?.status && params.status !== 'All') query.append('status', params.status);

      const res = await fetch(`/api/admin/curriculum?${query.toString()}`, {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { success: false, count: 0, records: [] };
    }
  },

  async getCurriculumRecordById(id: string): Promise<{ success: boolean; record?: CurriculumRecord }> {
    const res = await fetch(`/api/admin/curriculum/${encodeURIComponent(id)}`, {
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  async createCurriculumRecord(
    data: Partial<CurriculumRecord>
  ): Promise<{ success: boolean; record?: CurriculumRecord; message: string }> {
    const res = await fetch('/api/admin/curriculum', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateCurriculumRecord(
    id: string, 
    updates: Partial<CurriculumRecord>
  ): Promise<{ success: boolean; record?: CurriculumRecord; message: string }> {
    const res = await fetch(`/api/admin/curriculum/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    return await res.json();
  },

  async transitionPublishingWorkflow(
    id: string, 
    status: PublishingStatus, 
    reviewerName?: string, 
    notes?: string
  ): Promise<{ success: boolean; record?: CurriculumRecord; message: string }> {
    const res = await fetch(`/api/admin/curriculum/${encodeURIComponent(id)}/workflow`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ status, reviewerName, notes })
    });
    return await res.json();
  },

  async checkCurriculumReadiness(id: string): Promise<{ success: boolean; report?: LessonReadinessReport; message?: string }> {
    try {
      const res = await fetch(`/api/admin/curriculum/${encodeURIComponent(id)}/readiness`, {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error checking readiness' };
    }
  },

  async validateReadinessPayload(payload: any): Promise<{ success: boolean; report: LessonReadinessReport }> {
    const res = await fetch('/api/admin/curriculum/readiness-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getTeachingAids(): Promise<{ success: boolean; count: number; aids: TeachingAidRecord[] }> {
    try {
      const res = await fetch('/api/admin/teaching-aids', {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { success: false, count: 0, aids: [] };
    }
  },

  async getQuestions(): Promise<{ success: boolean; count: number; questions: QuestionRecord[] }> {
    try {
      const res = await fetch('/api/admin/questions', {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { success: false, count: 0, questions: [] };
    }
  },

  async previewCurriculumImport(
    payload: any
  ): Promise<any> {
    const res = await fetch('/api/admin/curriculum/import-preview', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async commitCurriculumImport(
    payload: {
      documentTitle?: string;
      documentReference?: string;
      entries: any[];
      publishingStatus: PublishingStatus;
    }
  ): Promise<{ success: boolean; message: string; created?: number; updated?: number; totalCommitted?: number; records?: CurriculumRecord[] }> {
    const res = await fetch('/api/admin/curriculum/import-commit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getAuditLogs(): Promise<{ success: boolean; logs: any[]; count: number }> {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: this.getAuthHeaders()
      });
      return await res.json();
    } catch {
      return { success: false, logs: [], count: 0 };
    }
  }
};
