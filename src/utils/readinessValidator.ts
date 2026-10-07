import { GradeLevel, SubjectName, PublishingStatus, LessonReadinessStatus, LessonReadinessReport, ReadinessCheckDetail } from '../types';

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

export const VALID_PERIOD_TYPES = [
  'instructional',
  'revision',
  'assessment',
  'examination',
  'special_instructional'
];

/**
 * Client-side Lesson Readiness Gate evaluation for real-time form feedback,
 * staging workbench validation, and quality auditing.
 */
export function validateClientCurriculumReadiness(record: any): LessonReadinessReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: ReadinessCheckDetail[] = [];
  const recordId = String(record?.id || 'staging-item');

  function addCheck(
    ruleId: string,
    ruleName: string,
    category: 'metadata' | 'pedagogy' | 'source' | 'workflow',
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

  // RULE 1: Class
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

  // RULE 2: Subject
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

  // RULE 3: Term
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

  // RULE 4: Week & Period Classification
  const week = Number(record?.week);
  const weekType = record?.weekType || 'instructional';
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

  // RULE 5: Topic
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

  // RULE 6: At least one authentic learning objective
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

  // RULE 7: Objectives must not be empty strings
  const cleanedObjectives = rawObjectives.map((o: any) => typeof o === 'string' ? o.trim() : '');
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

  // RULE 8: Objectives must not be duplicated
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

  // RULE 9: Source Reference
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

  // RULE 10: Curriculum Version
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

  // RULE 11: Internal Consistency
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

  if (week > 16) {
    hasConflicts = true;
    conflictReason = `Week ${week} exceeds the maximum instructional calendar bounds (16 weeks).`;
  }

  addCheck(
    'RULE_11_INTERNAL_CONSISTENCY',
    'Internal Consistency Check',
    'metadata',
    !hasConflicts,
    'blocking',
    'Class, subject, term, and week metadata are internally consistent',
    `Conflicting curriculum information: ${conflictReason}`
  );

  // RULE 12: Publishing Gate Check
  const publishingStatus = record?.publishingStatus || 'DRAFT';
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

  // ADVISORY WARNING CHECKS
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

  const aids = Array.isArray(record?.concreteVisualAids) || Array.isArray(record?.teachingAids)
    ? [...(record?.concreteVisualAids || []), ...(record?.teachingAids || [])]
    : [];
  const resources = Array.isArray(record?.teachingResources) ? record.teachingResources : [];
  const hasAidsOrResources = aids.length > 0 || resources.length > 0;
  addCheck(
    'WARN_TEACHING_RESOURCES',
    'Teaching Resources & Concrete Aids',
    'pedagogy',
    hasAidsOrResources,
    'warning',
    `Teaching aids and resources specified (${aids.length + resources.length} items)`,
    'No concrete visual aids or teaching resources linked. Authentic Nigerian concrete aids are strongly advised.'
  );

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

  let status: LessonReadinessStatus;
  if (errors.length > 0) {
    status = 'NOT READY';
  } else if (warnings.length > 0) {
    status = 'WARNING';
  } else {
    status = 'READY';
  }

  const canPublish = errors.length === 0;
  const isReadyForLesson = canPublish && (publishingStatus === 'PUBLISHED' || publishingStatus === 'APPROVED');
  const passedChecksCount = checks.filter(c => c.passed).length;

  return {
    recordId,
    status,
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
    inspectedAt: new Date().toISOString()
  };
}
