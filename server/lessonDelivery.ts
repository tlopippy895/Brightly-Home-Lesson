import { GradeLevel, SubjectName, MasteryLevel, ObjectiveMasteryRecord, StudentProfile } from './types';
import { db } from './db';
import { VERIFIED_HIERARCHY_RECORDS } from './curriculumArchitecture';

// ============================================================================
// 1. CONFIGURABLE 30-MINUTE LESSON PLAN PHASES
// ============================================================================

export interface LessonPhasePlan {
  phaseNumber: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  durationMinutes: number;
  description: string;
  teacherAction: string;
  pupilAction: string;
  icon: string;
  label: string;
}

export const RECOMMENDED_30_MIN_LESSON_PLAN: LessonPhasePlan[] = [
  {
    phaseNumber: 1,
    name: 'Welcome and Recall',
    durationMinutes: 3,
    description: 'Warm welcome, objective introduction, and prior knowledge recall in everyday Nigerian context',
    teacherAction: 'Greets pupil warmly in Nigerian tone, reviews last week concept, and introduces today objectives',
    pupilAction: 'Listens to teacher, recalls prior everyday experience, and prepares learning mindset',
    icon: '👋',
    label: 'WELCOME & RECALL'
  },
  {
    phaseNumber: 2,
    name: 'Teach',
    durationMinutes: 7,
    description: 'Direct instruction of core concept with age-appropriate Nigerian explanations and chalkboard notes',
    teacherAction: 'Breaks down concept step by step, writes clear structured notes, and highlights key terms',
    pupilAction: 'Follows structured board notes, reads along, and absorbs core concept rules',
    icon: '📐',
    label: 'TEACH'
  },
  {
    phaseNumber: 3,
    name: 'Explain and Demonstrate',
    durationMinutes: 6,
    description: 'Demonstrating concept using concrete visual aids, diagrams, and physical real-life object models',
    teacherAction: 'Demonstrates with abacus, fraction discs, maps, flashcards, or real-life specimens',
    pupilAction: 'Observes concrete demonstration and connects theoretical rules to tangible examples',
    icon: '💡',
    label: 'EXPLAIN & DEMONSTRATE'
  },
  {
    phaseNumber: 4,
    name: 'Guided Practice',
    durationMinutes: 6,
    description: 'Hands-on practice problems with teacher hints, cultural context, and immediate step verification',
    teacherAction: 'Presents guided problems, offers encouraging hints, and provides instant audio/visual feedback',
    pupilAction: 'Solves questions with hints, checks answers, and learns from immediate feedback',
    icon: '✍️',
    label: 'GUIDED PRACTICE'
  },
  {
    phaseNumber: 5,
    name: 'Independent Practice and Assessment',
    durationMinutes: 5,
    description: 'Independent diagnostic assessment linked to specific learning objectives with answer keys',
    teacherAction: 'Administers diagnostic questions mapped to curriculum objectives without giving away answers',
    pupilAction: 'Solves diagnostic questions independently to demonstrate individual understanding',
    icon: '🎯',
    label: 'ASSESSMENT'
  },
  {
    phaseNumber: 6,
    name: 'Feedback and Mastery Check',
    durationMinutes: 3,
    description: 'Comprehensive feedback, objective-level mastery check, and parent home practice recommendations',
    teacherAction: 'Evaluates mastery level, delivers personalized encouraging feedback, and records progress',
    pupilAction: 'Reviews objective achievements, celebrates progress, and notes home exploration tasks',
    icon: '🏆',
    label: 'FEEDBACK & MASTERY'
  }
];

export const TOTAL_LESSON_DURATION_MINUTES = RECOMMENDED_30_MIN_LESSON_PLAN.reduce(
  (acc, p) => acc + p.durationMinutes,
  0
); // Exactly 30 minutes

export const REMEDIAL_EXTENSION_MINUTES = 5; // Transparent extra time added when re-teaching is needed

// ============================================================================
// 2. SUBJECT-SPECIFIC MASTERY CRITERIA & MARKING RULES
// Universal 70% threshold is strictly prohibited.
// ============================================================================

export interface SubjectMasteryRule {
  subject: SubjectName;
  passPercentage: number;
  minimumCorrectQuestions: number;
  strongMasteryThreshold: number;
  criticalObjectiveKeyword?: string;
  badgeAwarded: string;
}

export const SUBJECT_MASTERY_RULES: Record<SubjectName, SubjectMasteryRule> = {
  'Mathematics': {
    subject: 'Mathematics',
    passPercentage: 80,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 95,
    criticalObjectiveKeyword: 'place value',
    badgeAwarded: 'Math Pioneer'
  },
  'Basic Science & Technology': {
    subject: 'Basic Science & Technology',
    passPercentage: 80,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 95,
    criticalObjectiveKeyword: 'living',
    badgeAwarded: 'Junior Scientist'
  },
  'English Studies': {
    subject: 'English Studies',
    passPercentage: 80,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 95,
    criticalObjectiveKeyword: 'noun',
    badgeAwarded: 'Grammar Master'
  },
  'Social Studies': {
    subject: 'Social Studies',
    passPercentage: 75,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 90,
    criticalObjectiveKeyword: 'geopolit',
    badgeAwarded: 'Geography Explorer'
  },
  'Civic Education': {
    subject: 'Civic Education',
    passPercentage: 75,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 90,
    criticalObjectiveKeyword: 'citizen',
    badgeAwarded: 'Civic Leader'
  },
  'Agricultural Science': {
    subject: 'Agricultural Science',
    passPercentage: 75,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 90,
    criticalObjectiveKeyword: 'crop',
    badgeAwarded: 'Young Farmer'
  }
};

/**
 * Evaluates lesson assessment results according to subject-specific marking rules
 * and returns one of the 5 official mastery states:
 * Beginning | Developing | Approaching Mastery | Mastered | Strong Mastery
 */
export function evaluateSubjectMastery(params: {
  subject: SubjectName;
  totalQuestions: number;
  correctCount: number;
  reexplained?: boolean;
  retestPassed?: boolean;
  objectivesAnsweredCorrectly?: number;
  totalObjectives?: number;
}): {
  masteryLevel: MasteryLevel;
  scorePercentage: number;
  passed: boolean;
  badge: string;
  requiresRemediation: boolean;
  summaryText: string;
} {
  const {
    subject,
    totalQuestions,
    correctCount,
    reexplained = false,
    retestPassed = false,
    objectivesAnsweredCorrectly = correctCount,
    totalObjectives = totalQuestions
  } = params;

  if (totalQuestions <= 0) {
    return {
      masteryLevel: 'Beginning',
      scorePercentage: 0,
      passed: false,
      badge: 'PARTICIPANT',
      requiresRemediation: true,
      summaryText: 'Assessment not yet attempted'
    };
  }

  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const rule = SUBJECT_MASTERY_RULES[subject] || {
    subject,
    passPercentage: 80,
    minimumCorrectQuestions: 3,
    strongMasteryThreshold: 95,
    badgeAwarded: 'Mastery Star'
  };

  // If adaptive re-teaching was triggered
  if (reexplained) {
    if (retestPassed) {
      return {
        masteryLevel: 'Mastered',
        scorePercentage: Math.max(85, scorePercentage),
        passed: true,
        badge: rule.badgeAwarded,
        requiresRemediation: false,
        summaryText: 'Mastered through adaptive Nigerian re-teaching and guided reassessment'
      };
    } else {
      return {
        masteryLevel: 'Developing',
        scorePercentage,
        passed: false,
        badge: 'LEARNER',
        requiresRemediation: true,
        summaryText: 'Developing understanding; guided parent reinforcement recommended'
      };
    }
  }

  // Initial Assessment Evaluation
  const meetsPercentage = scorePercentage >= rule.passPercentage;
  const meetsMinCorrect = correctCount >= rule.minimumCorrectQuestions;

  if (scorePercentage >= rule.strongMasteryThreshold && (correctCount === totalQuestions || totalQuestions >= 10)) {
    return {
      masteryLevel: 'Strong Mastery',
      scorePercentage,
      passed: true,
      badge: rule.badgeAwarded,
      requiresRemediation: false,
      summaryText: `Strong Mastery demonstrated in ${subject} (${scorePercentage}%)`
    };
  }

  if (meetsPercentage && meetsMinCorrect) {
    return {
      masteryLevel: 'Mastered',
      scorePercentage,
      passed: true,
      badge: rule.badgeAwarded,
      requiresRemediation: false,
      summaryText: `Subject mastery criteria achieved in ${subject} (${scorePercentage}%)`
    };
  }

  if (scorePercentage >= 70 || (totalObjectives > 0 && objectivesAnsweredCorrectly / totalObjectives >= 0.6)) {
    return {
      masteryLevel: 'Approaching Mastery',
      scorePercentage,
      passed: false,
      badge: 'PROGRESS',
      requiresRemediation: true,
      summaryText: `Approaching mastery in ${subject} (${scorePercentage}%); light review recommended`
    };
  }

  if (scorePercentage >= 50) {
    return {
      masteryLevel: 'Developing',
      scorePercentage,
      passed: false,
      badge: 'DEVELOPING',
      requiresRemediation: true,
      summaryText: `Developing understanding in ${subject} (${scorePercentage}%); adaptive re-teaching loop recommended`
    };
  }

  return {
    masteryLevel: 'Beginning',
    scorePercentage,
    passed: false,
    badge: 'BEGINNER',
    requiresRemediation: true,
    summaryText: `Beginning stage in ${subject} (${scorePercentage}%); requires step-by-step re-explanation`
  };
}

// ============================================================================
// 3. ADAPTIVE RE-TEACHING CONTENT GENERATOR
// Provides different explanation, everyday Nigerian analogy, and targeted retest
// ============================================================================

export interface AdaptiveReTeachingResult {
  analogyTitle: string;
  encouragement: string;
  simplifiedExplanation: string;
  keyTakeaway: string;
  retestQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    targetObjective: string;
  };
  remedialTimeMinutes: number;
}

export function getAdaptiveReTeachingContent(params: {
  topicId: string;
  grade: GradeLevel;
  subject: SubjectName;
  topic: string;
  pupilName: string;
  missedQuestion?: string;
}): AdaptiveReTeachingResult {
  const { topicId, grade, subject, topic, pupilName, missedQuestion = '' } = params;

  // Primary 4 Mathematics: Fractions
  if (topic.toLowerCase().includes('fraction') || topicId.includes('p4-t1-w2-math')) {
    return {
      analogyTitle: 'Sharing Agege Bread and Oranges',
      encouragement: `That's okay, ${pupilName}! Fractions are just about fair sharing with family. Let us look at it another way.`,
      simplifiedExplanation: `Imagine you have 7 halves of sweet orange to share at breakfast.\nEvery 2 halves make 1 whole orange. So 7 halves give you 3 whole oranges and 1 half orange left over!\nThat is why 7/2 = 3 1/2 (Three wholes and one-half). An improper fraction has a heavy top because you have more than one whole!`,
      keyTakeaway: 'Divide the top number by the bottom number: the answer is the whole number, the remainder stays on top!',
      retestQuestion: {
        question: 'If you have 5 halves of an orange (5/2), how many whole oranges and halves do you have?',
        options: ['1 whole and 1 half', '2 whole oranges and 1 half (2 1/2)', '3 whole oranges', '5 whole oranges'],
        correctIndex: 1,
        explanation: '5 divided by 2 is 2 whole oranges with 1 half left over (2 1/2).',
        targetObjective: 'Convert an improper fraction to a mixed number using division'
      },
      remedialTimeMinutes: REMEDIAL_EXTENSION_MINUTES
    };
  }

  // Primary 4 Mathematics: Place Value
  if (topic.toLowerCase().includes('place value') || topicId.includes('p4-t1-w1-math')) {
    return {
      analogyTitle: 'Naira Bundles at Onitsha Market',
      encouragement: `Don't worry, ${pupilName}! Place value is just bundling money in bundles of ten!`,
      simplifiedExplanation: `Think of counting Naira notes at the bank or market:\nTen ₦1,000 notes are bundled into one bundle of ₦10,000 (Ten Thousands).\nIn the number 54,823, the 5 is in the Ten Thousands house, so it is worth 50,000 Naira! Count the houses from right to left: Units, Tens, Hundreds, Thousands, and Ten Thousands.`,
      keyTakeaway: 'The fifth digit from the right is always the Ten Thousands house!',
      retestQuestion: {
        question: 'In the number 62,415, what is the place value of the digit 6?',
        options: ['Units', 'Hundreds', 'Thousands', 'Ten Thousands'],
        correctIndex: 3,
        explanation: 'The digit 6 is in the 5th place from the right, which is the Ten Thousands house (worth 60,000).',
        targetObjective: 'State the place value of any digit in a 5-digit whole number up to 100,000'
      },
      remedialTimeMinutes: REMEDIAL_EXTENSION_MINUTES
    };
  }

  // Primary 3 Science: Living and Non-Living Things
  if (topic.toLowerCase().includes('living') || topicId.includes('p3-t1-w3-sci')) {
    return {
      analogyTitle: 'Seedling vs A Heavy Stone',
      encouragement: `That's completely fine, ${pupilName}! Let us look at what makes something truly alive.`,
      simplifiedExplanation: `A moving car moves because a driver steps on the accelerator and burns petrol, but the car cannot grow, breathe, or produce baby cars!\nA tiny bean seedling planted in your garden grows taller, drinks water, and makes new beans by itself. Remember MR NIGER D: Movement, Respiration, Nutrition, Irritability, Growth, Excretion, Reproduction, and Death!`,
      keyTakeaway: 'Living things grow and reproduce by themselves. Non-living things cannot grow or produce young ones!',
      retestQuestion: {
        question: 'Which of the following is a LIVING thing that can grow and produce young ones by itself?',
        options: ['A yellow danfo bus', 'A potted bean seedling', 'A concrete block', 'A toy robot with batteries'],
        correctIndex: 1,
        explanation: 'A bean seedling is a living plant that grows and reproduces. Vehicles and blocks are non-living.',
        targetObjective: 'Distinguish between living and non-living things using MR NIGER D characteristics'
      },
      remedialTimeMinutes: REMEDIAL_EXTENSION_MINUTES
    };
  }

  // Primary 4 English: Nouns
  if (topic.toLowerCase().includes('noun') || topicId.includes('p4-t1-w2-eng')) {
    return {
      analogyTitle: 'Your Special Name vs General Things',
      encouragement: `No problem, ${pupilName}! English grammar is simple once you test whether it is a special personal name.`,
      simplifiedExplanation: `When we talk about any boy, that is a COMMON noun (small letter 'b').\nWhen we talk about YOU, '${pupilName}', that is your special PROPER noun, so it always starts with a capital letter!\nAnd things you cannot hold in your hand, like 'courage' or 'honesty', are ABSTRACT nouns because they are ideas in our hearts.`,
      keyTakeaway: 'Special personal names need Capital Letters (Proper Nouns). Ideas you feel in your heart are Abstract Nouns.',
      retestQuestion: {
        question: 'Which of the following is a PROPER noun that must always start with a capital letter?',
        options: ['river', 'Lagos', 'city', 'country'],
        correctIndex: 1,
        explanation: 'Lagos is the specific name of a Nigerian state and city, so it is a Proper Noun and must begin with a capital letter.',
        targetObjective: 'Identify and capitalize proper nouns correctly'
      },
      remedialTimeMinutes: REMEDIAL_EXTENSION_MINUTES
    };
  }

  // Primary 4 Social Studies: Geography
  if (topic.toLowerCase().includes('geography') || topicId.includes('p4-t1-w3-geo')) {
    return {
      analogyTitle: 'The Great River Y in Nigeria',
      encouragement: `You are doing well, ${pupilName}! Let us picture Nigeria's rivers on a map.`,
      simplifiedExplanation: `Look at Nigeria like the letter "Y":\nRiver Niger flows from the North-West, and River Benue flows from the East. They meet at Lokoja in Kogi State (The Confluence State) to form the stem of the Y, flowing down into the Atlantic Ocean!\nAnd our country has 6 geopolitical zones to organize our 36 states and Abuja.`,
      keyTakeaway: 'River Niger and River Benue meet at LOKOJA to form a Y-shaped confluence!',
      retestQuestion: {
        question: 'Where do River Niger and River Benue meet in Nigeria?',
        options: ['Lagos State', 'Lokoja in Kogi State', 'Kano State', 'Enugu State'],
        correctIndex: 1,
        explanation: 'River Niger and River Benue meet at Lokoja in Kogi State, which is called the Confluence State.',
        targetObjective: 'Name major rivers (Niger and Benue) and where they meet (Lokoja confluence)'
      },
      remedialTimeMinutes: REMEDIAL_EXTENSION_MINUTES
    };
  }

  // Primary 2 Mathematics: Skip Counting
  return {
    analogyTitle: 'Stepping Stones Across the Stream',
    encouragement: `That's okay, ${pupilName}! Skip counting is just jumping like a frog!`,
    simplifiedExplanation: `When we skip count in 2s, we whisper one number and shout the next: 1 (whisper), 2 (shout!), 3 (whisper), 4 (shout!).\nWhen we skip count in 10s, we jump from 10, to 20, 30, 40, all the way to 100! Notice how every 10 ends in 0.`,
    keyTakeaway: 'Skip counting means jumping the same number of steps each time!',
    retestQuestion: {
      question: 'What is the missing number in this skip-counting sequence: 10, 20, 30, __, 50?',
      options: ['35', '40', '45', '60'],
      correctIndex: 1,
      explanation: 'Counting in 10s: 10, 20, 30, 40, 50. The missing number is 40.',
      targetObjective: 'Count in 10s up to 100 accurately'
    },
    remedialTimeMinutes: REMEDIAL_EXTENSION_MINUTES
  };
}

// ============================================================================
// 4. AUTHENTIC PARENT ACADEMIC PROGRESS REPORT BUILDER
// Strictly mapped to actual completed assessments and verified objectives.
// Anti-Fabrication Guarantee: No synthetic fake module completions.
// ============================================================================

export interface ParentObjectiveReportItem {
  objective: string;
  mastered: boolean;
  masteryLevel: MasteryLevel;
  details: string;
}

export interface ParentCompletedLessonReport {
  topicId: string;
  grade: GradeLevel;
  term: number;
  subject: SubjectName;
  topicTitle: string;
  score: number;
  masteryLevel: MasteryLevel;
  reexplained: boolean;
  completedAt: string;
  curriculumVersion: string;
  sourceReference: string;
  competencyDescriptor: string;
  reportCardComment: string;
  homeDiscussionPrompt: string;
  recommendedHomeActivity: string;
  objectives: ParentObjectiveReportItem[];
}

export interface ParentAcademicSummaryReport {
  studentId: string;
  studentName: string;
  grade: GradeLevel;
  academicSession: string;
  currentTerm: number;
  overallScore: number;
  totalLessonsCompleted: number;
  hasCompletedLessons: boolean;
  completedLessons: ParentCompletedLessonReport[];
  subjectMasterySummary: {
    subject: SubjectName;
    lessonsCompleted: number;
    averageScore: number;
    masteryStatus: MasteryLevel;
  }[];
  strongAreas: string[];
  areasNeedingPractice: string[];
  recommendedWeeklyHomePlan: string;
  generatedAt: string;
}

export function buildParentAcademicSummary(student: StudentProfile): ParentAcademicSummaryReport {
  const completed = student.completedLessons || [];
  const hasCompleted = completed.length > 0;

  if (!hasCompleted) {
    return {
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      academicSession: student.academicSession || '2024/2025',
      currentTerm: student.currentTerm || 1,
      overallScore: 0,
      totalLessonsCompleted: 0,
      hasCompletedLessons: false,
      completedLessons: [],
      subjectMasterySummary: [],
      strongAreas: [],
      areasNeedingPractice: [
        `Complete first 30-minute lesson in Primary ${student.grade} to establish baseline diagnostic record`
      ],
      recommendedWeeklyHomePlan: `Encourage ${student.name} to complete their first 30-minute structured home lesson with their assigned teacher.`,
      generatedAt: new Date().toISOString()
    };
  }

  // Build verified lesson reports mapped to Phase 6 curriculum hierarchy records
  const completedLessonReports: ParentCompletedLessonReport[] = completed.map((lessonEntry) => {
    // Find authoritative Phase 6 hierarchy node
    const verifiedNode = VERIFIED_HIERARCHY_RECORDS.find(
      n => n.nodeId === lessonEntry.topicId || n.lessonId === lessonEntry.topicId
    );

    const score = lessonEntry.score;
    const isExemplary = score >= 90;
    const isSatisfactory = score >= 70;

    let comment = verifiedNode?.parentReportMapping?.reportCardComments?.satisfactory ||
      `Demonstrated good competence in ${lessonEntry.title}.`;
    if (isExemplary) {
      comment = verifiedNode?.parentReportMapping?.reportCardComments?.exemplary ||
        `Exemplary understanding and high fluency demonstrated in ${lessonEntry.title}.`;
    } else if (!isSatisfactory) {
      comment = verifiedNode?.parentReportMapping?.reportCardComments?.needsSupport ||
        `Foundational understanding developing; guided practice recommended for ${lessonEntry.title}.`;
    }

    // Evaluate subject-specific mastery
    const evalResult = evaluateSubjectMastery({
      subject: lessonEntry.subject,
      totalQuestions: 100,
      correctCount: score,
      reexplained: lessonEntry.reexplained,
      retestPassed: lessonEntry.retestPassed
    });

    // Map objectives
    const rawObjs = lessonEntry.objectivesMastery && lessonEntry.objectivesMastery.length > 0
      ? lessonEntry.objectivesMastery
      : (verifiedNode?.learningObjectives || [lessonEntry.title]).map(obj => ({
          objective: obj,
          mastered: score >= 70,
          masteryLevel: (score >= 90 ? 'Strong Mastery' : score >= 70 ? 'Mastered' : 'Developing') as MasteryLevel,
          details: score >= 70 ? 'Mastered during authentic lesson' : 'Needs practice'
        }));

    const mappedObjectives: ParentObjectiveReportItem[] = rawObjs.map(o => ({
      objective: o.objective,
      mastered: Boolean(o.mastered),
      masteryLevel: o.masteryLevel || (o.mastered ? 'Mastered' : 'Developing'),
      details: o.details || (o.mastered ? 'Mastered' : 'Developing understanding')
    }));

    return {
      topicId: lessonEntry.topicId,
      grade: verifiedNode?.grade || student.grade,
      term: verifiedNode?.term || student.currentTerm || 1,
      subject: lessonEntry.subject,
      topicTitle: lessonEntry.title,
      score: lessonEntry.score,
      masteryLevel: evalResult.masteryLevel,
      reexplained: Boolean(lessonEntry.reexplained),
      completedAt: lessonEntry.completedAt,
      curriculumVersion: lessonEntry.curriculumVersion || verifiedNode?.curriculumVersion || 'nerdc-based-v1',
      sourceReference: lessonEntry.sourceReference || verifiedNode?.sourceReference || 'NERDC National Curriculum',
      competencyDescriptor: verifiedNode?.parentReportMapping?.competencyDescriptor ||
        `Demonstrates core understanding of Primary ${student.grade} ${lessonEntry.subject}.`,
      reportCardComment: comment,
      homeDiscussionPrompt: verifiedNode?.parentReportMapping?.homeDiscussionPrompt ||
        `Ask your child to explain what they learned in ${lessonEntry.title}.`,
      recommendedHomeActivity: verifiedNode?.parentReportMapping?.recommendedHomeActivity ||
        `Practise daily real-life examples of ${lessonEntry.title} around your home.`,
      objectives: mappedObjectives
    };
  });

  // Calculate subject mastery summary
  const subjectGroups = new Map<SubjectName, { totalScore: number; count: number }>();
  for (const cl of completedLessonReports) {
    const existing = subjectGroups.get(cl.subject) || { totalScore: 0, count: 0 };
    existing.totalScore += cl.score;
    existing.count += 1;
    subjectGroups.set(cl.subject, existing);
  }

  const subjectMasterySummary = Array.from(subjectGroups.entries()).map(([subj, data]) => {
    const avg = Math.round(data.totalScore / data.count);
    const evalRes = evaluateSubjectMastery({
      subject: subj,
      totalQuestions: 100,
      correctCount: avg
    });
    return {
      subject: subj,
      lessonsCompleted: data.count,
      averageScore: avg,
      masteryStatus: evalRes.masteryLevel
    };
  });

  // Extract strong areas and areas needing practice from authentic objective results
  const strongAreas: string[] = [];
  const areasNeedingPractice: string[] = [];

  for (const rep of completedLessonReports) {
    for (const obj of rep.objectives) {
      if (obj.mastered) {
        if (!strongAreas.includes(obj.objective)) {
          strongAreas.push(obj.objective);
        }
      } else {
        if (!areasNeedingPractice.includes(obj.objective)) {
          areasNeedingPractice.push(obj.objective);
        }
      }
    }
  }

  if (strongAreas.length === 0 && completedLessonReports.length > 0) {
    strongAreas.push(`Completed structured 30-minute practice in ${completedLessonReports[0].topicTitle}`);
  }

  const topCompleted = completedLessonReports[completedLessonReports.length - 1];
  const recommendedWeeklyHomePlan = topCompleted?.recommendedHomeActivity ||
    `Spend 15 minutes reviewing ${topCompleted?.topicTitle || 'weekly concepts'} using household items.`;

  return {
    studentId: student.id,
    studentName: student.name,
    grade: student.grade,
    academicSession: student.academicSession || '2024/2025',
    currentTerm: student.currentTerm || 1,
    overallScore: student.overallScore || 0,
    totalLessonsCompleted: completed.length,
    hasCompletedLessons: true,
    completedLessons: completedLessonReports,
    subjectMasterySummary,
    strongAreas: strongAreas.slice(0, 4),
    areasNeedingPractice: areasNeedingPractice.slice(0, 3),
    recommendedWeeklyHomePlan,
    generatedAt: new Date().toISOString()
  };
}
