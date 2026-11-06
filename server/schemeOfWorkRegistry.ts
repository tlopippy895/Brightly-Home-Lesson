import fs from 'fs';
import path from 'path';

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

let cachedRecords: SchemeTopicRecord[] | null = null;
let cachedMetadata: any = null;

function loadData() {
  if (cachedRecords) return;
  const p = path.resolve(process.cwd(), 'server/data/extractedSchemeOfWork.json');
  if (fs.existsSync(p)) {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    cachedRecords = raw.records;
    cachedMetadata = raw.metadata;
  } else {
    cachedRecords = [];
    cachedMetadata = {};
  }
}

export function getAllSchemeRecords(): SchemeTopicRecord[] {
  loadData();
  return cachedRecords || [];
}

export function getSchemeTopicsForWeek(grade: number, term: 1 | 2 | 3, week: number): SchemeTopicRecord[] {
  loadData();
  return (cachedRecords || []).filter(r => r.grade === grade && r.term === term && r.week === week);
}

export function getSchemeTopicsForTerm(grade: number, term: 1 | 2 | 3): SchemeTopicRecord[] {
  loadData();
  return (cachedRecords || []).filter(r => r.grade === grade && r.term === term);
}

export function getComprehensiveCoverageReport(publishedLessonIds: Set<string>): ComprehensiveCoverageReport {
  loadData();
  const records = cachedRecords || [];
  const meta = cachedMetadata || {};
  const classesReport: Record<number, ClassCoverageSummary> = {};

  let totalPublished = 0;
  let totalAwaiting = 0;

  for (let g = 1; g <= 6; g++) {
    const gradeRecords = records.filter(r => r.grade === g);
    const gradeMeta = meta.coverageByGrade?.[g] || { subjectsFound: [], totalTopics: 0, terms: { 1: 0, 2: 0, 3: 0 } };
    
    let gradePublished = 0;
    let gradeAwaiting = 0;

    gradeRecords.forEach(r => {
      const isPublished = publishedLessonIds.has(r.id.trim().replace(/_/g, '-'));
      if (isPublished) {
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
    totalTopics: records.length,
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
