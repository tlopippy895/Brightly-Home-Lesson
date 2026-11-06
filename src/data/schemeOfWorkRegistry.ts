import extractedData from './extractedSchemeOfWork.json';
import { NATIONAL_CURRICULUM_LESSONS } from './curriculum';
import { LessonTopic, GradeLevel } from '../types';

export interface SchemeTopicRecord {
  id: string;
  grade: number;
  subject: string;
  term: 1 | 2 | 3;
  termName: string;
  week: number;
  rawWeekLabel: string;
  topic: string;
  subtopics: string[];
  contentDetails: string;
  weekType: 'instructional' | 'revision' | 'assessment' | 'examination';
  isFree: boolean;
  hasFullLesson: boolean;
  publishingStatus: 'DRAFT' | 'PUBLISHED';
  sourceDocument: string;
  sourceReference: string;
  notes: string;
}

export interface ClassCoverageSummary {
  grade: number;
  className: string;
  subjectsFound: {
    subject: string;
    t1Count: number;
    t2Count: number;
    t3Count: number;
    total: number;
  }[];
  totalTopics: number;
  terms: {
    1: number;
    2: number;
    3: number;
  };
  publishedLessonsCount: number;
  awaitingLessonsCount: number;
  flaggedItems: {
    grade: number;
    subject: string;
    term: number;
    week: number;
    issue: string;
  }[];
}

export interface ComprehensiveCoverageReport {
  sourceDocument: string;
  totalClasses: number;
  totalTopics: number;
  totalPublishedLessons: number;
  totalAwaitingLessons: number;
  classes: Record<number, ClassCoverageSummary>;
  provenance: {
    publisher: string;
    sourceFile: string;
    totalPages: number;
    independentVerificationNote: string;
  };
}

// Map of published lessons by normalized ID and by (grade-term-week-subject)
const publishedLessonsMap = new Map<string, LessonTopic>();
const publishedByTupleMap = new Map<string, LessonTopic>();

function normalizeSubjectKey(sub: string): string {
  const s = sub.toLowerCase();
  if (s.includes('math')) return 'mathematics';
  if (s.includes('english')) return 'english';
  if (s.includes('science')) return 'science';
  if (s.includes('social')) return 'social';
  if (s.includes('physical') || s.includes('phe') || s.includes('health')) return 'phe';
  if (s.includes('christian') || s.includes('crs')) return 'crs';
  if (s.includes('islamic') || s.includes('irs') || s.includes('is')) return 'is';
  if (s.includes('history')) return 'history';
  if (s.includes('creative') || s.includes('cca') || s.includes('art')) return 'cca';
  if (s.includes('digital') || s.includes('computer')) return 'digital';
  if (s.includes('prevocational') || s.includes('pvs') || s.includes('vocational') || s.includes('agriculture')) return 'prevocational';
  if (s.includes('french')) return 'french';
  return s.replace(/[^a-z0-9]/g, '');
}

NATIONAL_CURRICULUM_LESSONS.forEach(lesson => {
  const normId = lesson.id.trim().replace(/_/g, '-');
  publishedLessonsMap.set(normId, lesson);
  const tupleKey = `${lesson.grade}-${lesson.term}-${lesson.week}-${normalizeSubjectKey(lesson.subject)}`;
  publishedByTupleMap.set(tupleKey, lesson);
});

// All 2,465 records loaded from the JSON
export const ALL_SCHEME_RECORDS: SchemeTopicRecord[] = (extractedData.records as SchemeTopicRecord[]).map(record => {
  const normId = record.id.trim().replace(/_/g, '-');
  const tupleKey = `${record.grade}-${record.term}-${record.week}-${normalizeSubjectKey(record.subject)}`;
  const hasPublishedLesson = publishedLessonsMap.has(normId) || publishedByTupleMap.has(tupleKey);
  
  return {
    ...record,
    id: normId,
    hasFullLesson: hasPublishedLesson,
    publishingStatus: hasPublishedLesson ? 'PUBLISHED' : 'DRAFT'
  };
});

/**
 * Get all scheme topics for a specific grade, term, and week
 */
export function getSchemeTopicsForWeek(grade: number, term: 1 | 2 | 3, week: number): SchemeTopicRecord[] {
  return ALL_SCHEME_RECORDS.filter(r => r.grade === grade && r.term === term && r.week === week);
}

/**
 * Get all scheme topics for a specific grade and term
 */
export function getSchemeTopicsForTerm(grade: number, term: 1 | 2 | 3): SchemeTopicRecord[] {
  return ALL_SCHEME_RECORDS.filter(r => r.grade === grade && r.term === term);
}

/**
 * Get all subjects configured for a grade and term
 */
export function getSchemeSubjectsForTerm(grade: number, term: 1 | 2 | 3): {
  subject: string;
  topicCount: number;
  publishedCount: number;
}[] {
  const termRecords = getSchemeTopicsForTerm(grade, term);
  const subjectMap = new Map<string, { subject: string; topicCount: number; publishedCount: number }>();

  termRecords.forEach(r => {
    const existing = subjectMap.get(r.subject) || { subject: r.subject, topicCount: 0, publishedCount: 0 };
    existing.topicCount++;
    if (r.hasFullLesson) existing.publishedCount++;
    subjectMap.set(r.subject, existing);
  });

  return Array.from(subjectMap.values());
}

/**
 * Get full lesson if available for a given topic ID or record
 */
export function getFullLessonForSchemeRecord(record: SchemeTopicRecord): LessonTopic | undefined {
  const byId = publishedLessonsMap.get(record.id);
  if (byId) return byId;

  const tupleKey = `${record.grade}-${record.term}-${record.week}-${normalizeSubjectKey(record.subject)}`;
  return publishedByTupleMap.get(tupleKey);
}

/**
 * Generate full Primary 1-6 coverage report with provenance
 */
export function getComprehensiveCoverageReport(): ComprehensiveCoverageReport {
  const meta = extractedData.metadata as any;
  const classesReport: Record<number, ClassCoverageSummary> = {};

  let totalPublished = 0;
  let totalAwaiting = 0;

  for (let g = 1; g <= 6; g++) {
    const gradeRecords = ALL_SCHEME_RECORDS.filter(r => r.grade === g);
    const gradeMeta = meta.coverageByGrade?.[g] || { subjectsFound: [], totalTopics: 0, terms: { 1: 0, 2: 0, 3: 0 } };
    
    let gradePublished = 0;
    let gradeAwaiting = 0;

    gradeRecords.forEach(r => {
      if (r.hasFullLesson) {
        gradePublished++;
        totalPublished++;
      } else {
        gradeAwaiting++;
        totalAwaiting++;
      }
    });

    classesReport[g] = {
      grade: g,
      className: `Primary ${g}`,
      subjectsFound: gradeMeta.subjectsFound || [],
      totalTopics: gradeRecords.length,
      terms: gradeMeta.terms || { 1: 0, 2: 0, 3: 0 },
      publishedLessonsCount: gradePublished,
      awaitingLessonsCount: gradeAwaiting,
      flaggedItems: [
        {
          grade: g,
          subject: 'Curriculum Standards',
          term: 1,
          week: 1,
          issue: 'Source document: Pawills Consulting Scheme of Work. Independent gazette verification recommended for regulatory compliance.'
        }
      ]
    };
  }

  return {
    sourceDocument: 'THE COMPLETE SCHEME OF WORK FOR PRE-PRIMARY & PRIMARY SCHOOLS.pdf',
    totalClasses: 6,
    totalTopics: ALL_SCHEME_RECORDS.length,
    totalPublishedLessons: totalPublished,
    totalAwaitingLessons: totalAwaiting,
    classes: classesReport,
    provenance: {
      publisher: 'Pawills Consulting',
      sourceFile: 'public/assets/aistudio/THE_COMPLETE_SCHEME_OF_WORK_FOR_PRE-PRIMARY___PRIMARY_SCHOOLS_e3568583.pdf',
      totalPages: 985,
      independentVerificationNote: 'This academic scheme has been extracted directly from the uploaded reference document. Claims of national authority alignment require independent ministerial gazette verification.'
    }
  };
}
