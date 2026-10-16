import { db } from './db';
import { GradeLevel, FeatureGateEvaluation } from './types';

export const gates = {
  /**
   * Gate: Lesson Access & Classroom Entry
   * Determines whether a pupil can enter and consume a lesson
   */
  evaluateLessonAccess: (
    studentId: string,
    lessonGrade: GradeLevel,
    lessonTerm: number,
    weekNumber: number,
    isFree: boolean = false
  ): FeatureGateEvaluation => {
    // Check publication status: unpublished lessons remain locked and show LESSONS COMING SOON
    const matchingRecords = db.getCurriculumByQuery(lessonGrade, undefined, lessonTerm, weekNumber);
    if (matchingRecords.length > 0) {
      const isPublished = matchingRecords.some(r => r.publishingStatus === 'PUBLISHED');
      if (!isPublished) {
        return {
          allowed: false,
          gate: 'LESSON_ACCESS',
          reason: 'unpublished_lesson',
          message: 'LESSONS COMING SOON. This curriculum lesson is in preparation or review and has not yet been published for pupils.',
          requiredFee: 0
        };
      }
    }

    // Free introductory / week 1 lessons are always open for trial under NERDC regulations
    if (isFree || weekNumber === 1) {
      return {
        allowed: true,
        gate: 'LESSON_ACCESS',
        message: 'Introductory lesson preview granted under NERDC Free Trial policy.'
      };
    }

    const student = db.getStudentById(studentId);
    // 1. Check Administrative Pilot Safety Switch first
    if (db.isPilotPaused()) {
      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: 'pilot_paused',
        message: 'Controlled pilot access is temporarily paused by administration for scheduled inspection. All historical pupil progress and records remain safe.',
        requiredFee: 0
      };
    }

    if (!student) {
      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: 'unregistered_class',
        message: 'Pupil profile not registered on server.',
        requiredFee: 6000
      };
    }

    // 2. Check Class Registration
    const isEnrolledInGrade = student.registeredGrade === lessonGrade || student.grade === lessonGrade;
    if (!isEnrolledInGrade) {
      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: 'unregistered_class',
        message: `${student.name} is enrolled in Primary ${student.registeredGrade}. To take lessons in Primary ${lessonGrade}, please register for Primary ${lessonGrade}.`,
        requiredFee: 6000,
        details: {
          currentEnrolledGrade: student.registeredGrade,
          requestedGrade: lessonGrade,
          term: lessonTerm
        }
      };
    }

    // 2. Check Termly Tuition, Monthly Flexible Pass, or Annual Session Pass
    const parent = db.getParentAccount(student.parentId);
    const now = new Date();

    // Check monthly access
    let isMonthlyActive = false;
    if (student.subscriptionPlan === 'monthly' || student.monthlySubscription?.paid) {
      const exp = student.monthlySubscription?.accessExpires || student.subscriptionExpiresAt;
      if (exp && new Date(exp) > now) {
        isMonthlyActive = true;
      }
    }

    // Check annual access (standard or founding offer)
    let isAnnualActive = false;
    if (
      parent?.subscriptionPlan === 'annual' || 
      student.subscriptionPlan === 'annual' || 
      student.subscriptionPlan === 'founding_annual' ||
      student.annualSubscription?.paid
    ) {
      const exp = student.annualSubscription?.accessExpires || student.subscriptionExpiresAt;
      if (!exp || new Date(exp) > now) {
        isAnnualActive = true;
      }
    }

    // Check termly tuition for the specific purchased term
    const termRecord = student.termlyTuition?.[lessonTerm];
    let isTermActive = false;
    if (termRecord?.paid) {
      if (!termRecord.accessExpires || new Date(termRecord.accessExpires) > now) {
        isTermActive = true;
      }
    }

    const hasActiveSubscription = isMonthlyActive || isAnnualActive || isTermActive;

    if (!hasActiveSubscription) {
      const wasExpired = Boolean(
        (termRecord && termRecord.accessExpires && new Date(termRecord.accessExpires) <= now) ||
        (student.subscriptionExpiresAt && new Date(student.subscriptionExpiresAt) <= now)
      );

      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: wasExpired ? 'subscription_expired' : 'term_unpaid',
        message: wasExpired
          ? `Subscription access has expired. Renew monthly (₦2,500), termly (₦6,000), or annual pass (₦18,000) to continue learning.`
          : `Term ${lessonTerm} tuition has not been activated for Primary ${lessonGrade}. Pay ₦6,000 to unlock all lessons for this term (or ₦18,000 for full annual session).`,
        requiredFee: 6000,
        details: {
          enrolledGrade: student.registeredGrade,
          term: lessonTerm,
          receiptPending: true,
          expired: wasExpired
        }
      };
    }

    return {
      allowed: true,
      gate: 'LESSON_ACCESS',
      message: 'Tuition verified. Full access granted to NERDC classroom module.'
    };
  },

  /**
   * Gate: AI Lesson Generation (Gemini SDK)
   * Gated: Pupil must be enrolled and active in that grade
   */
  evaluateAIGeneration: (studentId: string, grade: GradeLevel): FeatureGateEvaluation => {
    const student = db.getStudentById(studentId);
    if (!student) {
      return {
        allowed: false,
        gate: 'AI_LESSON_GENERATOR',
        reason: 'unregistered_class',
        message: 'Pupil profile required for curriculum synthesis.'
      };
    }

    const isTermPaid = student.termlyTuition?.[student.currentTerm]?.paid || student.activeSubscription;
    if (student.registeredGrade !== grade || !isTermPaid) {
      return {
        allowed: false,
        gate: 'AI_LESSON_GENERATOR',
        reason: student.registeredGrade !== grade ? 'unregistered_class' : 'term_unpaid',
        message: 'Dynamic lesson synthesis is reserved for pupils with active enrolled tuition.',
        requiredFee: 6000
      };
    }

    return {
      allowed: true,
      gate: 'AI_LESSON_GENERATOR',
      message: 'Lesson synthesis unlocked.'
    };
  },

  /**
   * Gate: Parent Portal & Academic Reports
   * Gated: Requires valid 4-digit Parent Security PIN
   */
  evaluateParentPortalAccess: (pin: string): FeatureGateEvaluation => {
    const isValid = db.verifyParentPin(pin);
    if (!isValid) {
      return {
        allowed: false,
        gate: 'PARENT_PORTAL',
        reason: 'pin_required',
        message: 'Incorrect 4-digit Parent PIN. Access restricted to authorized parents.'
      };
    }

    return {
      allowed: true,
      gate: 'PARENT_PORTAL',
      message: 'Parent identity verified. Access granted.'
    };
  },

  /**
   * Gate: Summary of All Features for a Student
   * Powers UI badges, lock indicators, and upgrade triggers
   */
  getFeatureGateSummary: (studentId: string) => {
    const student = db.getStudentById(studentId) || db.getStudents()[0];
    const terms = [1, 2, 3];
    const grades: GradeLevel[] = [1, 2, 3, 4, 5, 6];

    const termsStatus: Record<number, { paid: boolean; fee: number; reference?: string }> = {};
    terms.forEach(t => {
      const rec = student.termlyTuition?.[t];
      termsStatus[t] = {
        paid: !!(rec?.paid || student.activeSubscription),
        fee: 6000,
        reference: rec?.reference
      };
    });

    const gradesStatus: Record<number, { isRegistered: boolean; canAccess: boolean }> = {};
    grades.forEach(g => {
      gradesStatus[g] = {
        isRegistered: student.registeredGrade === g,
        canAccess: student.registeredGrade === g && !!termsStatus[student.currentTerm]?.paid
      };
    });

    return {
      studentId: student.id,
      studentName: student.name,
      registeredGrade: student.registeredGrade,
      currentBrowsingGrade: student.grade,
      currentTerm: student.currentTerm,
      activeSubscription: student.activeSubscription,
      termsStatus,
      gradesStatus,
      features: {
        lessonRoom: {
          enabled: true,
          isGatedForCurrentSelection: student.registeredGrade !== student.grade || !termsStatus[student.currentTerm]?.paid
        },
        aiCurriculumGenerator: {
          enabled: student.registeredGrade === student.grade && !!termsStatus[student.currentTerm]?.paid
        },
        aiAdaptiveReexplanation: {
          enabled: true // Always help a child in an active lesson
        },
        voiceNarration: {
          enabled: true
        },
        parentPortal: {
          requiresPin: true
        },
        tuitionPayment: {
          standardTermFee: 6000,
          annualPlanFee: 15000,
          annualPlanDiscount: 3000,
          referralBonus: 1000,
          referralDiscount: 1000
        }
      }
    };
  }
};
