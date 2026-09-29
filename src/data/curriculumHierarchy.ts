import { GradeLevel, SubjectName, LessonTopic } from '../types';
import { NATIONAL_CURRICULUM_LESSONS } from './curriculum';

// ============================================================================
// HIERARCHICAL CURRICULUM ARCHITECTURE (NERDC-BASED)
// Strict Class -> Subject -> Term -> Week -> Topic -> Lesson Chain
// ============================================================================

export const CURRICULUM_VERSION_METADATA = {
  id: 'nerdc-based-v1',
  name: 'NERDC-based curriculum',
  status: 'active' as const,
  description: 'Structured foundation strictly organizing authentic curriculum records for Primary 1–6.',
  note: 'Only verified curriculum records are included. Missing weeks and subjects intentionally remain empty until official curriculum source material is supplied.'
};

export interface WeekCurriculumNode {
  grade: GradeLevel;
  subject: SubjectName;
  term: 1 | 2 | 3;
  week: number;
  
  // Theme & Competency (Intentionally null if not in original source data - NEVER fabricated)
  theme: string | null;
  competency: string[] | null;
  
  // Topic & Subtopic
  topic: string;
  subtopic: string;
  
  // Learning Objectives
  learningObjectives: string[];
  
  // Linked Interactive 30-Minute Lesson
  lessonId: string;
  isFree: boolean;
  teacherId: string;
  status: 'published' | 'requires_curriculum_review';
  
  // Teaching Aids & Pedagogical Content Summary
  concreteTeachingAidCount: number;
  practiceProblemCount: number;
  assessmentQuestionCount: number;
  
  // Direct reference to the complete 30-minute lesson topic object
  lessonData: LessonTopic;
}

export interface TermScheme {
  termNumber: 1 | 2 | 3;
  termName: 'First Term' | 'Second Term' | 'Third Term';
  status: 'active' | 'awaiting_curriculum';
  weeks: WeekCurriculumNode[];
}

export interface ClassSubject {
  grade: GradeLevel;
  subjectName: SubjectName;
  status: 'active' | 'awaiting_curriculum';
  terms: TermScheme[];
}

export interface ClassCurriculum {
  grade: GradeLevel;
  className: string;
  stage: 'Lower Basic' | 'Middle Basic' | 'Upper Basic';
  ageRange: string;
  status: 'active' | 'awaiting_curriculum';
  subjects: ClassSubject[];
}

// ============================================================================
// ID NORMALIZATION HELPER
// Ensures interoperability between hyphenated ('p4-t1-w1-math') and 
// underscore ('p4_t1_w1_math') formats without losing stored progress.
// ============================================================================
export const normalizeLessonId = (id: string): string => {
  return id.trim().replace(/_/g, '-');
};

export const matchLessonId = (idA?: string | null, idB?: string | null): boolean => {
  if (!idA || !idB) return false;
  return normalizeLessonId(idA) === normalizeLessonId(idB);
};

// ============================================================================
// CORE SUBJECTS LIST SUPPORTED BY BRIGHTLY
// ============================================================================
export const ALL_CORE_SUBJECTS: SubjectName[] = [
  'Mathematics',
  'English Studies',
  'Basic Science & Technology',
  'Social Studies',
  'Civic Education',
  'Agricultural Science'
];

// Helper to find existing lesson record by grade, subject, term, week
const findExistingLesson = (
  grade: GradeLevel,
  subject: SubjectName,
  term: 1 | 2 | 3,
  week: number
): LessonTopic | undefined => {
  return NATIONAL_CURRICULUM_LESSONS.find(
    l => l.grade === grade && l.subject === subject && l.term === term && l.week === week
  );
};

// Helper to build a WeekCurriculumNode from an actual existing LessonTopic
const buildWeekNodeFromLesson = (lesson: LessonTopic): WeekCurriculumNode => ({
  grade: lesson.grade,
  subject: lesson.subject,
  term: lesson.term,
  week: lesson.week,
  theme: null, // Intentionally null: not present in source data
  competency: null, // Intentionally null: not present in source data
  topic: lesson.topic,
  subtopic: lesson.subtopic,
  learningObjectives: [...lesson.objectives],
  lessonId: normalizeLessonId(lesson.id),
  isFree: lesson.isFree,
  teacherId: lesson.teacherId,
  status: 'published',
  concreteTeachingAidCount: lesson.concreteVisualAids?.length || 0,
  practiceProblemCount: lesson.practiceProblems?.length || 0,
  assessmentQuestionCount: lesson.assessmentQuestions?.length || 0,
  lessonData: lesson
});

// Build the structure for a specific Class and Subject
const buildClassSubject = (grade: GradeLevel, subjectName: SubjectName): ClassSubject => {
  const terms: TermScheme[] = ([1, 2, 3] as const).map(termNum => {
    const termName = termNum === 1 ? 'First Term' : termNum === 2 ? 'Second Term' : 'Third Term';
    
    // Only extract weeks for which actual lesson records exist in the source data
    const matchedLessons = NATIONAL_CURRICULUM_LESSONS.filter(
      l => l.grade === grade && l.subject === subjectName && l.term === termNum
    ).sort((a, b) => a.week - b.week);

    const weeks = matchedLessons.map(buildWeekNodeFromLesson);

    return {
      termNumber: termNum,
      termName,
      status: weeks.length > 0 ? ('active' as const) : ('awaiting_curriculum' as const),
      weeks
    };
  });

  const hasAnyActiveWeeks = terms.some(t => t.weeks.length > 0);

  return {
    grade,
    subjectName,
    status: hasAnyActiveWeeks ? 'active' : 'awaiting_curriculum',
    terms
  };
};

// ============================================================================
// STRUCTURED CURRICULUM REPOSITORY (PRIMARY 1 - 6) - LAZILY EVALUATED
// ============================================================================
let _cachedCurriculum: ClassCurriculum[] | null = null;

export const getStructuredClassesCurriculum = (): ClassCurriculum[] => {
  if (_cachedCurriculum) return _cachedCurriculum;

  _cachedCurriculum = [
    // PRIMARY 1: Registered class structure, currently awaiting source curriculum data
    {
      grade: 1,
      className: 'Primary 1',
      stage: 'Lower Basic',
      ageRange: 'Ages 5–6',
      status: 'awaiting_curriculum',
      subjects: ALL_CORE_SUBJECTS.map(sub => buildClassSubject(1, sub))
    },
    // PRIMARY 2: Active with verified source record: Mathematics Term 1 Week 3
    {
      grade: 2,
      className: 'Primary 2',
      stage: 'Lower Basic',
      ageRange: 'Ages 6–7',
      status: 'active',
      subjects: ALL_CORE_SUBJECTS.map(sub => buildClassSubject(2, sub))
    },
    // PRIMARY 3: Active with verified source record: Basic Science & Tech Term 1 Week 3
    {
      grade: 3,
      className: 'Primary 3',
      stage: 'Lower Basic',
      ageRange: 'Ages 7–8',
      status: 'active',
      subjects: ALL_CORE_SUBJECTS.map(sub => buildClassSubject(3, sub))
    },
    // PRIMARY 4: Active with verified source records: Mathematics Wk 1 & 2, English Wk 2, Social Studies Wk 3
    {
      grade: 4,
      className: 'Primary 4',
      stage: 'Middle Basic',
      ageRange: 'Ages 8–9',
      status: 'active',
      subjects: ALL_CORE_SUBJECTS.map(sub => buildClassSubject(4, sub))
    },
    // PRIMARY 5: Registered class structure, currently awaiting source curriculum data
    {
      grade: 5,
      className: 'Primary 5',
      stage: 'Middle Basic',
      ageRange: 'Ages 9–10',
      status: 'awaiting_curriculum',
      subjects: ALL_CORE_SUBJECTS.map(sub => buildClassSubject(5, sub))
    },
    // PRIMARY 6: Registered class structure, currently awaiting source curriculum data
    {
      grade: 6,
      className: 'Primary 6',
      stage: 'Upper Basic',
      ageRange: 'Ages 10–11',
      status: 'awaiting_curriculum',
      subjects: ALL_CORE_SUBJECTS.map(sub => buildClassSubject(6, sub))
    }
  ];

  return _cachedCurriculum;
};

// Backwards-compatible exported array via Proxy
export const STRUCTURED_CLASSES_CURRICULUM: ClassCurriculum[] = new Proxy([] as ClassCurriculum[], {
  get(target, prop, receiver) {
    const list = getStructuredClassesCurriculum();
    const val = Reflect.get(list, prop, receiver);
    if (typeof val === 'function') {
      return (val as any).bind(list);
    }
    return val;
  }
});

// ============================================================================
// QUERY & FILTERING SERVICE
// Guarantees strict isolation: a pupil only receives curriculum for their class
// ============================================================================

/**
 * Returns the complete class curriculum container for a given grade
 */
export const getClassCurriculum = (grade: GradeLevel): ClassCurriculum => {
  const curriculum = getStructuredClassesCurriculum();
  const found = curriculum.find(c => c.grade === grade);
  if (!found) {
    throw new Error(`Curriculum container not found for Primary ${grade}`);
  }
  return found;
};

/**
 * Returns all subjects belonging to a class
 */
export const getSubjectsForClass = (grade: GradeLevel): ClassSubject[] => {
  return getClassCurriculum(grade).subjects;
};

/**
 * Returns subjects for a class that currently have active curriculum records
 */
export const getActiveSubjectsForClass = (grade: GradeLevel): ClassSubject[] => {
  return getClassCurriculum(grade).subjects.filter(s => s.status === 'active');
};

/**
 * Returns the weekly scheme of work for a given class, subject, and term
 */
export const getWeekNodesForSubject = (
  grade: GradeLevel,
  subject: SubjectName,
  term: 1 | 2 | 3
): WeekCurriculumNode[] => {
  const classCurr = getClassCurriculum(grade);
  const classSubject = classCurr.subjects.find(s => s.subjectName === subject);
  if (!classSubject) return [];
  const termScheme = classSubject.terms.find(t => t.termNumber === term);
  return termScheme ? termScheme.weeks : [];
};

/**
 * Returns a specific week node
 */
export const getWeekNode = (
  grade: GradeLevel,
  subject: SubjectName,
  term: 1 | 2 | 3,
  week: number
): WeekCurriculumNode | undefined => {
  const weeks = getWeekNodesForSubject(grade, subject, term);
  return weeks.find(w => w.week === week);
};

/**
 * Resolves a full 30-minute LessonTopic by its normalized ID
 */
export const getLessonTopicById = (lessonId: string): LessonTopic | undefined => {
  const normalized = normalizeLessonId(lessonId);
  return NATIONAL_CURRICULUM_LESSONS.find(l => normalizeLessonId(l.id) === normalized);
};

/**
 * Validates the curriculum structure integrity
 */
export const validateCurriculumIntegrity = (): {
  totalClasses: number;
  classesWithActiveCurriculum: number;
  totalPreservedRecords: number;
  recordsByGrade: Record<number, number>;
  unsupportedWeeksOrDuplicates: string[];
} => {
  let totalPreserved = 0;
  const recordsByGrade: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const seenKeys = new Set<string>();
  const duplicates: string[] = [];

  for (const c of STRUCTURED_CLASSES_CURRICULUM) {
    for (const s of c.subjects) {
      for (const t of s.terms) {
        for (const w of t.weeks) {
          totalPreserved++;
          recordsByGrade[c.grade]++;
          const key = `P${c.grade}-${s.subjectName}-T${t.termNumber}-W${w.week}`;
          if (seenKeys.has(key)) {
            duplicates.push(key);
          }
          seenKeys.add(key);
        }
      }
    }
  }

  const activeClasses = STRUCTURED_CLASSES_CURRICULUM.filter(c => c.status === 'active').length;

  return {
    totalClasses: STRUCTURED_CLASSES_CURRICULUM.length,
    classesWithActiveCurriculum: activeClasses,
    totalPreservedRecords: totalPreserved,
    recordsByGrade,
    unsupportedWeeksOrDuplicates: duplicates
  };
};
