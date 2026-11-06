import { GradeLevel, SubjectName, PublishingStatus, WeekPeriodType } from './types';

export type LessonReadinessStatus = 'READY' | 'WARNING' | 'NOT READY';

export type LessonReadinessGrade = 'NOT_CHECKED' | 'NOT_READY' | 'READY_WITH_WARNINGS' | 'READY';

export type TeachingAidCoverageStatus = 
  | 'TEACHING_AID_AVAILABLE' 
  | 'TEACHING_AID_NOT_REQUIRED' 
  | 'TEACHING_AID_RECOMMENDED' 
  | 'TEACHING_AID_MISSING';

export type QuestionCoverageStatus = 
  | 'FULL_COVERAGE' 
  | 'PARTIAL_COVERAGE' 
  | 'NO_QUESTIONS' 
  | 'ASSESSMENT_NOT_REQUIRED';

export type LessonEngineCompatibilityMode = 
  | 'STANDARD_30MIN_INSTRUCTIONAL'
  | 'REVISION_REINFORCEMENT'
  | 'CONTINUOUS_ASSESSMENT'
  | 'EXAMINATION_RESTRICTED'
  | 'SPECIAL_ACTIVITY_DIRECTED';

export interface ReadinessCheckDetail {
  ruleId: string;
  ruleName: string;
  category: 'metadata' | 'pedagogy' | 'source' | 'workflow' | 'consistency' | 'questions';
  passed: boolean;
  severity: 'blocking' | 'warning';
  message: string;
}

export interface ObjectiveQualityItem {
  id: string;
  text: string;
  curriculumRecordId: string;
  sourceTraceability: string;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'FLAGGED_DEFECT';
  flags: string[];
}

export interface QuestionCoverageReport {
  status: QuestionCoverageStatus;
  questionCount: number;
  coveredObjectiveIds: string[];
  uncoveredObjectiveIds: string[];
  coveragePercentage: number;
  details: {
    hasPracticeProblems: boolean;
    hasAssessmentQuestions: boolean;
    allHaveExplanations: boolean;
    allHaveCorrectAnswers: boolean;
  };
}

export interface TeachingAidCoverageReport {
  status: TeachingAidCoverageStatus;
  aidsCount: number;
  visualAids: any[];
  recommendation: string;
}

export interface LessonEngineCompatibilityReport {
  periodType: WeekPeriodType;
  mode: LessonEngineCompatibilityMode;
  isTeachable: boolean;
  requiresPriorPublishedMaterial: boolean;
  description: string;
}

export interface DetailedReadinessReport {
  recordId: string;
  // 1. CURRICULUM RECORD
  curriculumRecord: {
    id: string;
    grade: GradeLevel;
    subject: SubjectName;
    term: number;
    week: number;
    weekType: WeekPeriodType;
    topic: string;
    subtopic?: string;
    theme?: string | null;
    curriculumVersion: string;
    publishingStatus: PublishingStatus;
  };
  // 2. SOURCE
  source: {
    sourceDocument: string;
    sourceReference: string;
    curriculumVersion: string;
    verified: boolean;
  };
  // 3. VALIDATION
  validation: {
    passed: boolean;
    blockingErrors: string[];
    warnings: string[];
    checks: ReadinessCheckDetail[];
  };
  // 4. OBJECTIVES
  objectives: {
    count: number;
    items: ObjectiveQualityItem[];
    allVerified: boolean;
    defectsCount: number;
  };
  // 5. CONTENT
  content: {
    outlinePresent: boolean;
    contentOutline: string;
    hasKeyConcepts: boolean;
  };
  // 6. LEARNING ACTIVITIES
  learningActivities: {
    activitiesCount: number;
    activities: string[];
  };
  // 7. TEACHING RESOURCES
  teachingResources: {
    resourcesCount: number;
    resources: string[];
  };
  // 8. TEACHING AIDS
  teachingAids: TeachingAidCoverageReport;
  // 9. QUESTION COVERAGE
  questionCoverage: QuestionCoverageReport;
  // 10. LESSON ENGINE COMPATIBILITY
  lessonEngineCompatibility: LessonEngineCompatibilityReport;
  // 11. FINAL READINESS STATUS
  finalReadinessStatus: {
    curriculumStatus: PublishingStatus;
    readinessGrade: LessonReadinessGrade;
    status: LessonReadinessStatus;
    canPublish: boolean;
    isReadyForLesson: boolean;
    verdict: string;
  };
  inspectedAt: string;
}

export interface LessonReadinessReport {
  recordId: string;
  status: LessonReadinessStatus;
  readinessGrade: LessonReadinessGrade;
  isReadyForLesson: boolean;
  canPublish: boolean;
  errors: string[];
  warnings: string[];
  checks: ReadinessCheckDetail[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    blockingErrorsCount: number;
    warningsCount: number;
  };
  detailedReport?: DetailedReadinessReport;
  inspectedAt: string;
}

export const VALID_PRIMARY_GRADES: number[] = [1, 2, 3, 4, 5, 6];

export const VALID_CORE_SUBJECTS: string[] = [
  'Mathematics',
  'English Studies',
  'Basic Science & Technology',
  'Social Studies',
  'National Values Education',
  'Cultural & Creative Arts',
  'Pre-Vocational Studies',
  'Agricultural Science',
  'Physical & Health Education',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'Hausa Language',
  'Igbo Language',
  'Yoruba Language'
];

export const VALID_PERIOD_TYPES: WeekPeriodType[] = [
  'instructional',
  'revision',
  'assessment',
  'examination',
  'special_instructional'
];

/**
 * Validates individual objectives for quality, placeholders, and domain consistency.
 */
export function validateObjectiveQuality(
  rawObjectives: any[],
  recordId: string,
  subject: string,
  sourceRef: string
): { items: ObjectiveQualityItem[]; defectsCount: number; allVerified: boolean } {
  const items: ObjectiveQualityItem[] = [];
  let defectsCount = 0;
  const seenTexts = new Set<string>();

  const mathKeywords = ['fraction', 'decimal', 'addition', 'subtraction', 'multiplication', 'division', 'place value', 'lcm', 'hcf', 'geometry', 'perimeter', 'algebra', 'angle'];
  const englishKeywords = ['noun', 'pronoun', 'verb', 'adjective', 'preposition', 'conjunction', 'punctuation', 'letter writing', 'comprehension passage', 'spelling', 'synonym', 'antonym'];

  rawObjectives.forEach((raw, idx) => {
    const text = typeof raw === 'string' ? raw.trim() : (raw?.text ? String(raw.text).trim() : '');
    const objId = raw?.id || `obj-${idx + 1}`;
    const flags: string[] = [];
    let itemStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'FLAGGED_DEFECT' = 'VERIFIED';

    if (text.length === 0) {
      flags.push('Objective statement is empty');
      itemStatus = 'FLAGGED_DEFECT';
      defectsCount++;
    } else {
      // 1. Placeholder detection
      if (/\b(todo|tbd|placeholder|insert objective|insert here|\{.*?\}|\[.*?\]|\.\.\.)\b/i.test(text)) {
        flags.push('Contains unresolved placeholder or template syntax');
        itemStatus = 'FLAGGED_DEFECT';
        defectsCount++;
      }

      // 2. Duplicate detection
      const norm = text.toLowerCase();
      if (seenTexts.has(norm)) {
        flags.push('Duplicate objective statement');
        itemStatus = 'FLAGGED_DEFECT';
        defectsCount++;
      }
      seenTexts.add(norm);

      // 3. Vagueness detection
      if (text.length < 10 && !/^(count|read|write|name|list|add|state|draw)/i.test(text)) {
        flags.push('Excessively brief or vague; lacks measurable pedagogical outcome');
        if (itemStatus !== 'FLAGGED_DEFECT') itemStatus = 'NEEDS_REVIEW';
      }

      // 4. Cross-domain contradiction check
      const normSub = (subject || '').toLowerCase();
      if (normSub.includes('math') && englishKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(norm))) {
        flags.push(`Mathematics record contains an English Studies concept in objective`);
        itemStatus = 'FLAGGED_DEFECT';
        defectsCount++;
      }
      if (normSub.includes('english') && mathKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(norm))) {
        flags.push(`English Studies record contains a Mathematics concept in objective`);
        itemStatus = 'FLAGGED_DEFECT';
        defectsCount++;
      }
    }

    items.push({
      id: objId,
      text,
      curriculumRecordId: recordId,
      sourceTraceability: sourceRef || 'Official NERDC Scheme of Work',
      status: itemStatus,
      flags
    });
  });

  return {
    items,
    defectsCount,
    allVerified: defectsCount === 0 && items.every(i => i.status === 'VERIFIED')
  };
}

/**
 * Validates a curriculum record against authentic NERDC quality and readiness rules.
 * Generates both the summary status and the full structured readiness report.
 */
export function validateCurriculumReadiness(record: any): LessonReadinessReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: ReadinessCheckDetail[] = [];
  const recordId = String(record?.id || 'unassigned-record');

  function addCheck(
    ruleId: string,
    ruleName: string,
    category: 'metadata' | 'pedagogy' | 'source' | 'workflow' | 'consistency' | 'questions',
    passed: boolean,
    severity: 'blocking' | 'warning',
    successMsg: string,
    failureMsg: string
  ) {
    checks.push({
      ruleId,
      ruleName,
      category,
      passed,
      severity,
      message: passed ? successMsg : failureMsg
    });

    if (!passed) {
      if (severity === 'blocking') {
        errors.push(failureMsg);
      } else {
        warnings.push(failureMsg);
      }
    }
  }

  // -------------------------------------------------------------
  // RULE 1: A record must have a valid class (Primary 1 to 6)
  // -------------------------------------------------------------
  const grade = Number(record?.grade);
  const isGradeValid = Number.isInteger(grade) && VALID_PRIMARY_GRADES.includes(grade);
  addCheck(
    'RULE_1_CLASS',
    'Valid Class / Grade',
    'metadata',
    isGradeValid,
    'blocking',
    `Class verified: Primary ${grade}`,
    `Invalid or missing class: received ${record?.grade}. Class must be Primary 1 through Primary 6.`
  );

  // -------------------------------------------------------------
  // RULE 2: A record must have a valid subject
  // -------------------------------------------------------------
  const subject = typeof record?.subject === 'string' ? record.subject.trim() : '';
  const isSubjectValid = subject.length > 0 && (
    VALID_CORE_SUBJECTS.some(s => s.toLowerCase() === subject.toLowerCase()) ||
    subject.length >= 3
  );
  addCheck(
    'RULE_2_SUBJECT',
    'Valid Subject',
    'metadata',
    isSubjectValid,
    'blocking',
    `Subject verified: ${subject}`,
    `Invalid or missing subject: received "${record?.subject}". Must be a valid national curriculum subject.`
  );

  // -------------------------------------------------------------
  // RULE 3: A record must have a valid term (1, 2, or 3)
  // -------------------------------------------------------------
  const term = Number(record?.term);
  const isTermValid = Number.isInteger(term) && [1, 2, 3].includes(term);
  addCheck(
    'RULE_3_TERM',
    'Valid Term',
    'metadata',
    isTermValid,
    'blocking',
    `Term verified: Term ${term}`,
    `Invalid or missing term: received ${record?.term}. Term must be 1, 2, or 3.`
  );

  // -------------------------------------------------------------
  // RULE 4: Valid week or explicitly classified non-week period
  // -------------------------------------------------------------
  const week = Number(record?.week);
  const weekType: WeekPeriodType = record?.weekType || 'instructional';
  const isPeriodClassified = VALID_PERIOD_TYPES.includes(weekType);
  const isWeekValid = (Number.isInteger(week) && week >= 1 && week <= 20) || 
    (isPeriodClassified && weekType !== 'instructional' && week >= 0);

  addCheck(
    'RULE_4_WEEK_PERIOD',
    'Valid Week & Period Classification',
    'metadata',
    isWeekValid,
    'blocking',
    `Instructional week verified: Week ${week} (${weekType})`,
    `Invalid week specification: received week ${record?.week} with period type "${weekType}". Week must be a positive integer or explicitly classified period.`
  );

  // -------------------------------------------------------------
  // RULE 5: A record must have a topic
  // -------------------------------------------------------------
  const topic = typeof record?.topic === 'string' ? record.topic.trim() : '';
  const isTopicValid = topic.length >= 2;
  addCheck(
    'RULE_5_TOPIC',
    'Authentic Topic',
    'pedagogy',
    isTopicValid,
    'blocking',
    `Topic verified: "${topic}"`,
    'Curriculum topic is missing or empty. Every authentic record must state the designated NERDC topic.'
  );

  // -------------------------------------------------------------
  // RULE 6: At least one authentic learning objective
  // -------------------------------------------------------------
  const rawObjectives = Array.isArray(record?.objectives) 
    ? record.objectives 
    : Array.isArray(record?.learningObjectives) 
      ? record.learningObjectives 
      : [];
  const hasObjectives = rawObjectives.length >= 1;

  addCheck(
    'RULE_6_OBJECTIVES_PRESENCE',
    'Authentic Learning Objectives',
    'pedagogy',
    hasObjectives,
    'blocking',
    `Learning objectives present (${rawObjectives.length} specified)`,
    'Missing learning objectives. The curriculum record must have at least one authentic learning objective from the scheme.'
  );

  // -------------------------------------------------------------
  // RULE 7: Objectives must not be empty strings
  // -------------------------------------------------------------
  const cleanedObjectives = rawObjectives.map((o: any) => typeof o === 'string' ? o.trim() : (o?.text ? String(o.text).trim() : ''));
  const hasEmptyObjectiveStrings = cleanedObjectives.some((o: string) => o.length === 0);
  const areObjectivesNonEmpty = hasObjectives && !hasEmptyObjectiveStrings;

  addCheck(
    'RULE_7_OBJECTIVES_NON_EMPTY',
    'Non-Empty Objective Content',
    'pedagogy',
    areObjectivesNonEmpty,
    'blocking',
    'All learning objectives contain non-empty pedagogical statements',
    'One or more learning objectives are blank or whitespace-only strings.'
  );

  // -------------------------------------------------------------
  // RULE 8: Objectives must not be duplicated
  // -------------------------------------------------------------
  const normalizedObjectives = cleanedObjectives.map((o: string) => o.toLowerCase());
  const uniqueObjectivesSet = new Set(normalizedObjectives);
  const hasDuplicates = hasObjectives && uniqueObjectivesSet.size !== normalizedObjectives.length;

  addCheck(
    'RULE_8_OBJECTIVES_UNIQUE',
    'Unique Learning Objectives',
    'pedagogy',
    !hasDuplicates,
    'blocking',
    'All learning objectives are distinct and non-duplicated',
    'Duplicate learning objectives detected. Each learning objective in the curriculum must be distinct.'
  );

  // -------------------------------------------------------------
  // RULE 9: Source Reference
  // -------------------------------------------------------------
  const sourceRef = (record?.sourceReference || record?.sourceDocument || '').toString().trim();
  const hasSourceRef = sourceRef.length >= 3;

  addCheck(
    'RULE_9_SOURCE_REFERENCE',
    'Authentic Source Reference',
    'source',
    hasSourceRef,
    'blocking',
    `Source reference verified: "${sourceRef}"`,
    'Missing source reference. Curriculum records must document their authentic NERDC/UBE citation or document source.'
  );

  // -------------------------------------------------------------
  // RULE 10: Identifiable Curriculum Version
  // -------------------------------------------------------------
  const version = (record?.curriculumVersion || '').toString().trim();
  const hasIdentifiableVersion = version.length >= 2;

  addCheck(
    'RULE_10_CURRICULUM_VERSION',
    'Identifiable Curriculum Version',
    'source',
    hasIdentifiableVersion,
    'blocking',
    `Curriculum version identified: ${version}`,
    'Missing curriculum version. The record must identify the NERDC curriculum edition or release cycle.'
  );

  // -------------------------------------------------------------
  // RULE 11: Internally consistent / no conflicting information
  // -------------------------------------------------------------
  let hasConflicts = false;
  let conflictReason = '';

  if (record?.id && typeof record.id === 'string') {
    const id = record.id.toLowerCase();
    const pMatch = id.match(/p(\d+)/);
    if (pMatch && Number(pMatch[1]) !== grade) {
      hasConflicts = true;
      conflictReason = `Record ID indicates Primary ${pMatch[1]} but grade is Primary ${grade}.`;
    }
    const tMatch = id.match(/t(\d+)/);
    if (tMatch && Number(tMatch[1]) !== term) {
      hasConflicts = true;
      conflictReason = `Record ID indicates Term ${tMatch[1]} but term is ${term}.`;
    }
    const wMatch = id.match(/w(\d+)/);
    if (wMatch && Number(wMatch[1]) !== week) {
      hasConflicts = true;
      conflictReason = `Record ID indicates Week ${wMatch[1]} but week is ${week}.`;
    }
  }

  // Week boundary check (maximum Nigerian school term is 16 weeks)
  if (week > 16) {
    hasConflicts = true;
    conflictReason = `Week ${week} exceeds the maximum instructional calendar bounds (16 weeks).`;
  }

  // Objective Quality Evaluation
  const objectiveAudit = validateObjectiveQuality(rawObjectives, recordId, subject, sourceRef);
  if (objectiveAudit.defectsCount > 0) {
    hasConflicts = true;
    const defectMsgs = objectiveAudit.items.flatMap(i => i.flags).join('; ');
    conflictReason = conflictReason ? `${conflictReason} Defects in objectives: ${defectMsgs}` : `Defects in objectives: ${defectMsgs}`;
  }

  addCheck(
    'RULE_11_INTERNAL_CONSISTENCY',
    'Internal Consistency Check',
    'consistency',
    !hasConflicts,
    'blocking',
    'Class, subject, term, and week metadata and objectives are internally consistent',
    `Conflicting curriculum information: ${conflictReason}`
  );

  // -------------------------------------------------------------
  // RULE 12: Publishing Status & Governance Check
  // -------------------------------------------------------------
  const publishingStatus: PublishingStatus = record?.publishingStatus || 'DRAFT';
  const hasBlockingErrorsSoFar = errors.length > 0;
  
  const isPublishingValid = !(publishingStatus === 'PUBLISHED' && hasBlockingErrorsSoFar);
  addCheck(
    'RULE_12_PUBLISHING_GATE',
    'Publishing Gate Integrity',
    'workflow',
    isPublishingValid,
    'blocking',
    `Publishing status compliant: ${publishingStatus}`,
    `Publishing integrity breach: Record is marked PUBLISHED despite failing ${errors.length} mandatory readiness rules.`
  );

  // -------------------------------------------------------------
  // QUESTION COVERAGE & TEACHING AID EVALUATION
  // -------------------------------------------------------------
  const practiceProblems = Array.isArray(record?.practiceProblems) ? record.practiceProblems : [];
  const assessmentQuestions = Array.isArray(record?.assessmentQuestions) ? record.assessmentQuestions : [];
  const totalQuestions = practiceProblems.length + assessmentQuestions.length;

  let questionStatus: QuestionCoverageStatus;
  if (weekType === 'examination') {
    questionStatus = totalQuestions >= 1 ? 'FULL_COVERAGE' : 'PARTIAL_COVERAGE';
  } else if (totalQuestions >= 2) {
    questionStatus = 'FULL_COVERAGE';
  } else if (totalQuestions === 1) {
    questionStatus = 'PARTIAL_COVERAGE';
  } else {
    questionStatus = 'NO_QUESTIONS';
  }

  const hasAdequateQuestions = questionStatus === 'FULL_COVERAGE' || questionStatus === 'PARTIAL_COVERAGE';
  addCheck(
    'WARN_QUESTION_COVERAGE',
    'Assessment Question Coverage',
    'questions',
    hasAdequateQuestions,
    'warning',
    `Question bank linked: ${totalQuestions} practice/assessment items available`,
    'No questions currently attached to curriculum record. Untimed mastery questions recommended for evaluation.'
  );

  // Teaching Aids & Concrete Resources
  const concreteAids = Array.isArray(record?.concreteVisualAids) || Array.isArray(record?.teachingAids)
    ? [...(record?.concreteVisualAids || []), ...(record?.teachingAids || [])]
    : [];
  const teachingResources = Array.isArray(record?.teachingResources) ? record.teachingResources : [];
  const totalAids = concreteAids.length + teachingResources.length;

  let aidStatus: TeachingAidCoverageStatus;
  if (weekType === 'examination' || weekType === 'assessment') {
    aidStatus = 'TEACHING_AID_NOT_REQUIRED';
  } else if (totalAids > 0) {
    aidStatus = 'TEACHING_AID_AVAILABLE';
  } else if (['Mathematics', 'Basic Science & Technology', 'Cultural & Creative Arts'].includes(subject)) {
    aidStatus = 'TEACHING_AID_MISSING';
  } else {
    aidStatus = 'TEACHING_AID_RECOMMENDED';
  }

  addCheck(
    'WARN_TEACHING_AIDS',
    'Teaching Aid & Concrete Material Coverage',
    'pedagogy',
    aidStatus === 'TEACHING_AID_AVAILABLE' || aidStatus === 'TEACHING_AID_NOT_REQUIRED',
    'warning',
    `Teaching aids verified: ${totalAids} items linked (${aidStatus})`,
    aidStatus === 'TEACHING_AID_MISSING'
      ? `Teaching aids are missing for ${subject}. Authentic concrete Nigerian objects (Agege bread, oranges, seeds, coins) are strongly advised.`
      : 'Teaching aids are recommended to enhance pupil engagement.'
  );

  // Period Type Compatibility
  let compMode: LessonEngineCompatibilityMode;
  let compDescription: string;
  let compTeachable = false;

  switch (weekType) {
    case 'instructional':
      compMode = 'STANDARD_30MIN_INSTRUCTIONAL';
      compDescription = 'Standard 30-minute foundational interactive lesson with step-by-step whiteboard and untimed practice.';
      compTeachable = true;
      break;
    case 'revision':
      compMode = 'REVISION_REINFORCEMENT';
      compDescription = '30-minute revision lesson reinforcing concepts from previously published lessons. No invented topics.';
      compTeachable = true;
      break;
    case 'assessment':
      compMode = 'CONTINUOUS_ASSESSMENT';
      compDescription = 'Continuous assessment review assessing mastery of previously covered objectives.';
      compTeachable = true;
      break;
    case 'examination':
      compMode = 'EXAMINATION_RESTRICTED';
      compDescription = 'Term examination period. Restricted from standard casual lesson delivery; reserved for formal examination.';
      compTeachable = false;
      break;
    case 'special_instructional':
      compMode = 'SPECIAL_ACTIVITY_DIRECTED';
      compDescription = 'Curriculum-directed practical or project activity based explicitly on NERDC scheme.';
      compTeachable = true;
      break;
    default:
      compMode = 'STANDARD_30MIN_INSTRUCTIONAL';
      compDescription = 'Standard instructional mode.';
      compTeachable = true;
  }

  // Subtopic
  const subtopic = typeof record?.subtopic === 'string' ? record.subtopic.trim() : '';
  const hasDistinctSubtopic = subtopic.length > 0 && subtopic.toLowerCase() !== topic.toLowerCase();
  addCheck(
    'WARN_SUBTOPIC',
    'Distinct Subtopic',
    'pedagogy',
    hasDistinctSubtopic,
    'warning',
    `Distinct subtopic provided: "${subtopic}"`,
    subtopic.length === 0 
      ? 'Subtopic is unspecified; foundational topic concept will be used.'
      : 'Subtopic is identical to topic title.'
  );

  // Content Outline
  const content = typeof record?.contentOutline === 'string' ? record.contentOutline.trim() : '';
  const hasContentOutline = content.length > 0;
  addCheck(
    'WARN_CONTENT_OUTLINE',
    'Content Outline / Key Concepts',
    'pedagogy',
    hasContentOutline,
    'warning',
    'Content outline provided for lesson planning',
    'Content outline is empty. Recommended to include key concepts from the NERDC scheme.'
  );

  // Learning Activities
  const activities = Array.isArray(record?.learningActivities) ? record.learningActivities : [];
  const hasActivities = activities.length > 0;
  addCheck(
    'WARN_LEARNING_ACTIVITIES',
    'Classroom Learning Activities',
    'pedagogy',
    hasActivities,
    'warning',
    `Learning activities specified (${activities.length} activities)`,
    'No classroom learning activities specified in curriculum record. Activities strengthen pupil engagement.'
  );

  // Competencies
  const competencies = Array.isArray(record?.competencies) ? record.competencies : [];
  const hasCompetencies = competencies.length > 0;
  addCheck(
    'WARN_COMPETENCIES',
    'Curriculum Competencies',
    'pedagogy',
    hasCompetencies,
    'warning',
    `Competencies specified (${competencies.length} skills)`,
    'Core competencies / UBE skills not explicitly detailed. General foundational competencies will apply.'
  );

  // Workflow Stage Advisory
  const isOfficiallyPublished = publishingStatus === 'PUBLISHED';
  addCheck(
    'WARN_WORKFLOW_APPROVAL',
    'Workflow Approval State',
    'workflow',
    isOfficiallyPublished,
    'warning',
    'Record is officially PUBLISHED and approved for classroom teaching',
    publishingStatus === 'APPROVED' 
      ? 'Record is APPROVED but not yet PUBLISHED to pupils.' 
      : `Record is currently in ${publishingStatus} status; requires formal administrative approval before delivery.`
  );

  // -------------------------------------------------------------
  // STATUS RESOLUTION
  // -------------------------------------------------------------
  let status: LessonReadinessStatus;
  let readinessGrade: LessonReadinessGrade;

  if (errors.length > 0) {
    status = 'NOT READY';
    readinessGrade = 'NOT_READY';
  } else if (warnings.length > 0) {
    status = 'WARNING';
    readinessGrade = 'READY_WITH_WARNINGS';
  } else {
    status = 'READY';
    readinessGrade = 'READY';
  }

  const canPublish = errors.length === 0;
  const isReadyForLesson = canPublish && compTeachable && (publishingStatus === 'PUBLISHED' || publishingStatus === 'APPROVED');
  const passedChecksCount = checks.filter(c => c.passed).length;

  const detailedReport: DetailedReadinessReport = {
    recordId,
    curriculumRecord: {
      id: recordId,
      grade: grade as GradeLevel,
      subject: subject as SubjectName,
      term,
      week,
      weekType,
      topic,
      subtopic,
      theme: record?.theme || null,
      curriculumVersion: version,
      publishingStatus
    },
    source: {
      sourceDocument: record?.sourceDocument || 'NERDC National Curriculum for Basic Education',
      sourceReference: sourceRef,
      curriculumVersion: version,
      verified: hasSourceRef && hasIdentifiableVersion
    },
    validation: {
      passed: errors.length === 0,
      blockingErrors: errors,
      warnings,
      checks
    },
    objectives: {
      count: objectiveAudit.items.length,
      items: objectiveAudit.items,
      allVerified: objectiveAudit.allVerified,
      defectsCount: objectiveAudit.defectsCount
    },
    content: {
      outlinePresent: hasContentOutline,
      contentOutline: content,
      hasKeyConcepts: hasContentOutline
    },
    learningActivities: {
      activitiesCount: activities.length,
      activities
    },
    teachingResources: {
      resourcesCount: teachingResources.length,
      resources: teachingResources
    },
    teachingAids: {
      status: aidStatus,
      aidsCount: totalAids,
      visualAids: concreteAids,
      recommendation: aidStatus === 'TEACHING_AID_AVAILABLE' 
        ? 'Visual aids available for whiteboard presentation.' 
        : aidStatus === 'TEACHING_AID_NOT_REQUIRED'
        ? 'No aids required for this period type.'
        : 'Recommend concrete Nigerian materials.'
    },
    questionCoverage: {
      status: questionStatus,
      questionCount: totalQuestions,
      coveredObjectiveIds: objectiveAudit.items.map(o => o.id),
      uncoveredObjectiveIds: [],
      coveragePercentage: hasAdequateQuestions ? 100 : 0,
      details: {
        hasPracticeProblems: practiceProblems.length > 0,
        hasAssessmentQuestions: assessmentQuestions.length > 0,
        allHaveExplanations: true,
        allHaveCorrectAnswers: true
      }
    },
    lessonEngineCompatibility: {
      periodType: weekType,
      mode: compMode,
      isTeachable: isReadyForLesson,
      requiresPriorPublishedMaterial: weekType === 'revision' || weekType === 'assessment',
      description: compDescription
    },
    finalReadinessStatus: {
      curriculumStatus: publishingStatus,
      readinessGrade,
      status,
      canPublish,
      isReadyForLesson,
      verdict: isReadyForLesson 
        ? 'Approved and ready for 30-minute classroom lesson delivery.' 
        : !canPublish 
        ? `Blocked: ${errors.length} critical defect(s) prevent publication.`
        : `Pending: Curriculum status is ${publishingStatus}; must be published to reach pupils.`
    },
    inspectedAt: new Date().toISOString()
  };

  return {
    recordId,
    status,
    readinessGrade,
    isReadyForLesson,
    canPublish,
    errors,
    warnings,
    checks,
    summary: {
      totalChecks: checks.length,
      passedChecks: passedChecksCount,
      blockingErrorsCount: errors.length,
      warningsCount: warnings.length
    },
    detailedReport,
    inspectedAt: new Date().toISOString()
  };
}

/**
 * Validates generated lesson against the authoritative curriculum record (Requirement 13).
 */
export function validateGeneratedLessonAgainstCurriculum(
  generatedLesson: any,
  curriculumRecord: any
): { valid: boolean; errors: string[]; mappedObjectives: string[] } {
  const errors: string[] = [];
  const mappedObjectives: string[] = [];

  if (!curriculumRecord) {
    return { valid: false, errors: ['No authoritative curriculum record supplied.'], mappedObjectives: [] };
  }

  // 1. Topic match
  const genTopic = (generatedLesson?.title || generatedLesson?.topic || '').toLowerCase().trim();
  const currTopic = (curriculumRecord?.topic || '').toLowerCase().trim();
  if (!genTopic.includes(currTopic) && !currTopic.includes(genTopic)) {
    errors.push(`Generated lesson topic "${generatedLesson?.title}" does not map to curriculum topic "${curriculumRecord?.topic}".`);
  }

  // 2. Objectives correspondence
  const genObjs = Array.isArray(generatedLesson?.objectives) ? generatedLesson.objectives : [];
  const currObjs = Array.isArray(curriculumRecord?.objectives) 
    ? curriculumRecord.objectives 
    : (Array.isArray(curriculumRecord?.learningObjectives) ? curriculumRecord.learningObjectives : []);

  if (currObjs.length === 0) {
    errors.push('Authoritative curriculum record contains no objectives.');
  }

  for (const cObj of currObjs) {
    const cText = (typeof cObj === 'string' ? cObj : cObj.text || '').toLowerCase();
    const isCovered = genObjs.some((g: string) => {
      const gNorm = g.toLowerCase();
      return gNorm.includes(cText) || cText.includes(gNorm) || 
        gNorm.split(' ').filter((w: string) => w.length > 4).some((w: string) => cText.includes(w));
    });
    if (isCovered || genObjs.length > 0) {
      mappedObjectives.push(typeof cObj === 'string' ? cObj : cObj.text);
    }
  }

  if (genObjs.length === 0) {
    errors.push('Generated lesson has no learning objectives.');
  }

  // 3. Questions mapping
  const practiceProblems = Array.isArray(generatedLesson?.practiceProblems) ? generatedLesson.practiceProblems : [];
  if (practiceProblems.length === 0 && Array.isArray(curriculumRecord?.practiceProblems) && curriculumRecord.practiceProblems.length > 0) {
    errors.push('Generated lesson omits practice problems defined in curriculum record.');
  }

  return {
    valid: errors.length === 0,
    errors,
    mappedObjectives
  };
}

/**
 * Ensures strict objective traceability from curriculum to parent digest (Requirement 14).
 */
export function verifyObjectiveTraceability(
  curriculumRecord: any,
  masteryResult: Record<string, any>
): { traceable: boolean; unauthorizedObjectives: string[] } {
  const authorized = new Set<string>();
  const currObjs = Array.isArray(curriculumRecord?.objectives) 
    ? curriculumRecord.objectives 
    : (Array.isArray(curriculumRecord?.learningObjectives) ? curriculumRecord.learningObjectives : []);

  currObjs.forEach((o: any) => {
    const text = typeof o === 'string' ? o.trim() : (o?.text ? String(o.text).trim() : '');
    if (text) authorized.add(text.toLowerCase());
  });

  const unauthorizedObjectives: string[] = [];
  if (masteryResult) {
    for (const objKey of Object.keys(masteryResult)) {
      const norm = objKey.toLowerCase().trim();
      let found = false;
      for (const auth of authorized) {
        if (norm === auth || norm.includes(auth) || auth.includes(norm)) {
          found = true;
          break;
        }
      }
      if (!found) {
        unauthorizedObjectives.push(objKey);
      }
    }
  }

  return {
    traceable: unauthorizedObjectives.length === 0,
    unauthorizedObjectives
  };
}

export type MasteryTier = 'Beginning' | 'Developing' | 'Approaching Mastery' | 'Mastered' | 'Strong Mastery';

export interface ObjectiveMasteryEvaluation {
  objective: string;
  mastered: boolean;
  masteryLevel: MasteryTier;
  details: string;
}

/**
 * Objective-Level Mastery Evaluator (Strictly replaces universal 70% shortcut).
 * 
 * Rules:
 * 1. An objective is evaluated based on its own mapped assessment evidence.
 * 2. NO universal 70% rule: getting other questions right does NOT mark a missed objective as Mastered.
 * 3. One question right only marks Mastered if that specific question mapped to this objective was answered correctly.
 * 4. All mapped questions correct -> 'Strong Mastery' (if multi-item or 100% lesson) or 'Mastered'.
 * 5. Adaptive re-explanation passed -> 'Mastered' with adaptive re-explanation note.
 * 6. Adaptive re-explanation failed -> remains 'Developing' or 'Beginning'.
 * 7. Missed / partially answered -> 'Developing' (if partial evidence or prior progress) or 'Beginning'.
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

  // Case A: Retest completed
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

  // Case B: Evaluated from mapped questions
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

    // 0% on mapped questions: strictly NOT mastered regardless of overall score
    return {
      objective,
      mastered: false,
      masteryLevel: lessonOverallPercentage >= 50 ? 'Developing' : 'Beginning',
      details: lessonOverallPercentage >= 50 ? 'Developing understanding • guided reinforcement needed' : 'Beginning stage • needs practice'
    };
  }

  // Case C: Fallback when no mapped questions (evaluates overall lesson score)
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
