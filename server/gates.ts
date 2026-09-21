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
    const student = db.getStudentById(studentId);
    if (!student) {
      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: 'unregistered_class',
        message: 'Pupil profile not found on server.',
        requiredFee: 12000
      };
    }

    // Free introductory / week 1 lessons are open for trial
    if (isFree || (weekNumber === 1 && lessonGrade === student.registeredGrade)) {
      return {
        allowed: true,
        gate: 'LESSON_ACCESS',
        message: 'Introductory lesson preview granted under NERDC Free Trial policy.'
      };
    }

    // 1. Check Class Registration
    if (student.registeredGrade !== lessonGrade) {
      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: 'unregistered_class',
        message: `${student.name} is enrolled in Primary ${student.registeredGrade}. To take lessons in Primary ${lessonGrade}, please register for Primary ${lessonGrade}.`,
        requiredFee: 12000,
        details: {
          currentEnrolledGrade: student.registeredGrade,
          requestedGrade: lessonGrade,
          term: lessonTerm
        }
      };
    }

    // 2. Check Termly Tuition or Active Subscription
    const isTermPaid = student.termlyTuition?.[lessonTerm]?.paid || student.activeSubscription;
    if (!isTermPaid) {
      return {
        allowed: false,
        gate: 'LESSON_ACCESS',
        reason: 'term_unpaid',
        message: `Term ${lessonTerm} tuition has not been activated for Primary ${lessonGrade}. Pay ₦12,000 to unlock all lessons for this term.`,
        requiredFee: 12000,
        details: {
          enrolledGrade: student.registeredGrade,
          term: lessonTerm,
          receiptPending: true
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
        message: 'Pupil profile required for AI curriculum synthesis.'
      };
    }

    const isTermPaid = student.termlyTuition?.[student.currentTerm]?.paid || student.activeSubscription;
    if (student.registeredGrade !== grade || !isTermPaid) {
      return {
        allowed: false,
        gate: 'AI_LESSON_GENERATOR',
        reason: student.registeredGrade !== grade ? 'unregistered_class' : 'term_unpaid',
        message: 'Dynamic AI lesson synthesis is reserved for pupils with active enrolled tuition.',
        requiredFee: 12000
      };
    }

    return {
      allowed: true,
      gate: 'AI_LESSON_GENERATOR',
      message: 'AI lesson synthesis unlocked.'
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
        fee: 12000,
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
          standardTermFee: 12000,
          annualPlanDiscount: 2500
        }
      }
    };
  }
};
