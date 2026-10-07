export type MasteryLevel = 
  | 'Beginning' 
  | 'Developing' 
  | 'Approaching Mastery' 
  | 'Mastered' 
  | 'Strong Mastery';

export interface MasteryInfo {
  level: MasteryLevel;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
  needsSupport: boolean;
}

export function getMasteryLevel(score: number): MasteryInfo {
  if (score >= 95) {
    return {
      level: 'Strong Mastery',
      color: '#026838',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-300',
      badgeText: 'text-emerald-900 font-black',
      description: 'Exceptional retention & fluent mastery of the NERDC topic.',
      needsSupport: false,
    };
  } else if (score >= 85) {
    return {
      level: 'Mastered',
      color: '#026838',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-[#026838] font-black',
      description: 'Topic mastered! Ready to advance to the next week.',
      needsSupport: false,
    };
  } else if (score >= 70) {
    return {
      level: 'Approaching Mastery',
      color: '#1E88E5',
      badgeBg: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      badgeText: 'text-blue-800 font-bold',
      description: 'Good understanding. Minor practice recommended before exam.',
      needsSupport: false,
    };
  } else if (score >= 50) {
    return {
      level: 'Developing',
      color: '#D97706',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-200',
      badgeText: 'text-amber-800 font-bold',
      description: 'Developing concept understanding. Additional practice guided.',
      needsSupport: true,
    };
  } else {
    return {
      level: 'Beginning',
      color: '#DC2626',
      badgeBg: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
      badgeText: 'text-rose-800 font-bold',
      description: 'Beginning stage. Adaptive re-teaching loop activated.',
      needsSupport: true,
    };
  }
}

export interface ObjectiveMasteryEvaluation {
  objective: string;
  mastered: boolean;
  masteryLevel: MasteryLevel;
  details: string;
}

/**
 * Objective-Level Mastery Evaluator (Strictly replaces universal 70% shortcut).
 */
export function calculateObjectiveMasteryStatus(params: {
  objective: string;
  totalMappedQuestions: number;
  correctMappedQuestions: number;
  lessonOverallPercentage: number;
  retestPassed?: boolean;
  retestAttempted?: boolean;
}): ObjectiveMasteryEvaluation {
  const {
    objective,
    totalMappedQuestions,
    correctMappedQuestions,
    lessonOverallPercentage,
    retestPassed,
    retestAttempted
  } = params;

  if (retestAttempted) {
    if (retestPassed) {
      return {
        objective,
        mastered: true,
        masteryLevel: 'Mastered',
        details: 'Mastered with adaptive re-explanation support'
      };
    } else {
      return {
        objective,
        mastered: false,
        masteryLevel: 'Developing',
        details: 'Developing understanding • guided practice recommended'
      };
    }
  }

  if (totalMappedQuestions > 0) {
    const accuracy = correctMappedQuestions / totalMappedQuestions;

    if (accuracy === 1) {
      const isStrong = lessonOverallPercentage >= 95 || totalMappedQuestions >= 2;
      return {
        objective,
        mastered: true,
        masteryLevel: isStrong ? 'Strong Mastery' : 'Mastered',
        details: isStrong ? 'Demonstrated strong and fluent mastery' : 'Mastered with high competence'
      };
    }

    if (accuracy >= 0.5) {
      return {
        objective,
        mastered: false,
        masteryLevel: 'Approaching Mastery',
        details: 'Approaching mastery • partial accuracy on mapped questions'
      };
    }

    return {
      objective,
      mastered: false,
      masteryLevel: lessonOverallPercentage >= 50 ? 'Developing' : 'Beginning',
      details: lessonOverallPercentage >= 50 ? 'Developing understanding • guided reinforcement needed' : 'Beginning stage • needs practice'
    };
  }

  if (lessonOverallPercentage >= 85) {
    return {
      objective,
      mastered: true,
      masteryLevel: lessonOverallPercentage >= 95 ? 'Strong Mastery' : 'Mastered',
      details: 'Mastered through authentic lesson completion'
    };
  } else if (lessonOverallPercentage >= 70) {
    return {
      objective,
      mastered: false,
      masteryLevel: 'Approaching Mastery',
      details: 'Approaching mastery'
    };
  } else if (lessonOverallPercentage >= 50) {
    return {
      objective,
      mastered: false,
      masteryLevel: 'Developing',
      details: 'Developing understanding'
    };
  } else {
    return {
      objective,
      mastered: false,
      masteryLevel: 'Beginning',
      details: 'Beginning stage'
    };
  }
}
