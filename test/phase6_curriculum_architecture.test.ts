import assert from 'node:assert';
import { db } from '../server/db';
import {
  NATIONAL_NERDC_AUTHORITY,
  OFFICIAL_MISSING_NERDC_DOCUMENTS,
  AUTHENTIC_TERM_CALENDARS,
  ALL_NIGERIAN_PRIMARY_CLASSES,
  ALL_CORE_PRIMARY_SUBJECTS,
  VERIFIED_HIERARCHY_RECORDS,
  SAMPLE_SCHOOL_SCHEMES_OF_WORK,
  isCurriculumNodeComplete,
  generateAuditableCoverageReport
} from '../server/curriculumArchitecture';
import { CurriculumHierarchyNode, GradeLevel } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — PHASE 6: THREE-TERM CURRICULUM ARCHITECTURE & VERIFIED CONTENT');
console.log('================================================================');

async function runPhase6CurriculumArchitectureTests() {
  let passed = 0;
  let failed = 0;

  function test(section: string, name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  \x1b[32m✔\x1b[0m [${section}] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  \x1b[31m✖\x1b[0m [${section}] ${name}: ${err?.message}`);
      failed++;
    }
  }

  // ==========================================================================
  // SECTION 1: 17-LAYER HIERARCHY ARCHITECTURE & METADATA TRACEABILITY
  // ==========================================================================
  console.log('\n--- 1. 17-Layer Hierarchy Architecture & Metadata Traceability ---');

  test('Hierarchy Completeness', 'All verified records contain the complete 17-layer pedagogical chain', () => {
    assert.ok(VERIFIED_HIERARCHY_RECORDS.length >= 6, 'Must have at least 6 verified records');

    for (const node of VERIFIED_HIERARCHY_RECORDS) {
      // Layer 1: Authority & Version
      assert.ok(node.authority, `Node ${node.nodeId} must have authority metadata`);
      assert.strictEqual(node.authority.authorityId, 'NERDC_NATIONAL');
      assert.strictEqual(node.curriculumVersion, 'nerdc-based-v1');

      // Layer 2: Class
      assert.ok([1, 2, 3, 4, 5, 6].includes(node.grade));
      assert.ok(['Lower Basic', 'Middle Basic', 'Upper Basic'].includes(node.stage));

      // Layer 3: Subject
      assert.ok(ALL_CORE_PRIMARY_SUBJECTS.includes(node.subject));

      // Layer 4: Academic Session
      assert.strictEqual(node.academicSession, '2024/2025');

      // Layer 5: Term
      assert.ok([1, 2, 3].includes(node.term));
      assert.ok(['First Term', 'Second Term', 'Third Term'].includes(node.termName));

      // Layer 6: Week & Period Classification
      assert.ok(node.week >= 1 && node.week <= 13);
      assert.strictEqual(node.weekType, 'instructional');

      // Layer 7: Strand & Theme
      assert.ok(node.strand && node.strand.length > 0, `Node ${node.nodeId} missing strand`);
      assert.ok(node.theme && node.theme.length > 0, `Node ${node.nodeId} missing theme`);

      // Layer 8: Topic
      assert.ok(node.topic && node.topic.trim().length > 0);

      // Layer 9: Subtopic
      assert.ok(node.subtopic && node.subtopic.trim().length > 0);

      // Layer 10: Learning Objectives
      assert.ok(Array.isArray(node.learningObjectives) && node.learningObjectives.length > 0);

      // Layer 11: Competencies
      assert.ok(Array.isArray(node.competencies) && node.competencies.length > 0);

      // Layer 12: Teaching Content
      assert.ok(node.teachingContent.ageAppropriateExplanation.length > 0);
      assert.ok(node.teachingContent.whiteboardSteps.length > 0);
      assert.ok(node.teachingContent.culturalContext.length > 0);

      // Layer 13: Activities & Resources
      assert.ok(node.activitiesAndResources.concreteVisualAids.length > 0);
      assert.ok(node.activitiesAndResources.homeExplorationTask.length > 0);

      // Layer 14: Lesson Plan (30-Minute 6-Phase)
      assert.strictEqual(node.lessonPlan.phases.length, 6, 'Must contain standard 6-phase journey');
      assert.strictEqual(node.lessonPlan.totalDurationMinutes, 30);

      // Layer 15: Practice
      assert.ok(Array.isArray(node.practice) && node.practice.length > 0);

      // Layer 16: Assessment
      assert.ok(Array.isArray(node.assessment) && node.assessment.length > 0);

      // Layer 17: Mastery Criteria & Remedial/Enrichment
      assert.strictEqual(node.masteryCriteria.passPercentage, 80);
      assert.ok(node.masteryCriteria.remedialWork.remedialSteps.length > 0);
      assert.ok(node.masteryCriteria.enrichment.advancedChallengeTask.length > 0);

      // Layer 18: Parent Report Mapping
      assert.ok(node.parentReportMapping.competencyDescriptor.length > 0);
      assert.ok(node.parentReportMapping.reportCardComments.exemplary.length > 0);
      assert.ok(node.parentReportMapping.homeDiscussionPrompt.length > 0);

      // Metadata Traceability
      assert.strictEqual(node.verificationStatus, 'verified');
      assert.strictEqual(node.lifecycleState, 'published');
      assert.strictEqual(node.isComplete, true);
      assert.strictEqual(node.canPublish, true);
      assert.ok(node.sourceDocument.includes('NERDC'));
      assert.ok(node.importDate);
    }
  });

  // ==========================================================================
  // SECTION 2: PRESERVATION OF THE SIX VERIFIED PUBLISHED LESSON RECORDS
  // ==========================================================================
  console.log('\n--- 2. Preservation of the 6 Verified Published Records ---');

  test('Preservation', 'Preserves all six published records across classes and subjects', () => {
    const publishedRecords = db.getAllCurriculumRecords().filter(r => r.publishingStatus === 'PUBLISHED');
    assert.ok(publishedRecords.length >= 6, 'Must preserve all 6 published records');

    const expectedIds = [
      'p4-t1-w1-math',
      'p4-t1-w2-math',
      'p4-t1-w3-geo',
      'p3-t1-w3-sci',
      'p4-t1-w2-eng',
      'p2-t1-w3-math'
    ];

    for (const expId of expectedIds) {
      const found = db.getCurriculumRecordById(expId);
      assert.ok(found, `Record ${expId} must exist in database`);
      assert.strictEqual(found.publishingStatus, 'PUBLISHED');
    }
  });

  test('Curriculum Accuracy', 'Authoritative record for p3-t1-w3-sci strictly retains Living & Non-Living Things in Our Environment', () => {
    const rec = db.getCurriculumRecordById('p3-t1-w3-sci');
    assert.ok(rec, 'Record p3-t1-w3-sci must exist');
    assert.strictEqual(rec.grade, 3);
    assert.strictEqual(rec.term, 1);
    assert.strictEqual(rec.week, 3);
    assert.strictEqual(rec.subject, 'Basic Science & Technology');
    assert.strictEqual(rec.topic, 'Living & Non-Living Things in Our Environment');
    assert.strictEqual(rec.subtopic, 'Characteristics of Living Organisms (MR NIGER D)');
    assert.strictEqual(rec.publishingStatus, 'PUBLISHED');

    // Confirm that "Sense Organs" does not appear in the authoritative Week 3 record
    assert.ok(!rec.topic.includes('Sense Organs'), 'Topic must NOT be Sense Organs');
    assert.ok(rec.objectives.some(o => o.includes('MR NIGER D')), 'Objectives must include MR NIGER D');
    assert.ok(rec.objectives.some(o => o.includes('living and non-living things')), 'Objectives must include living and non-living things');
  });

  // ==========================================================================
  // SECTION 3: VARIABLE CALENDAR TERM LENGTHS (PRIMARY 1–6, TERMS 1–3)
  // ==========================================================================
  console.log('\n--- 3. Variable Calendar Term Lengths (Primary 1–6, Terms 1–3) ---');

  test('Variable Calendar', 'Term 1 supports 13-week academic calendar with revision and exam structures', () => {
    const t1 = AUTHENTIC_TERM_CALENDARS[1];
    assert.strictEqual(t1.totalWeeks, 13);
    assert.deepStrictEqual(t1.revisionWeeks, [6, 12]);
    assert.deepStrictEqual(t1.assessmentWeeks, [7]);
    assert.deepStrictEqual(t1.examinationWeeks, [13]);
  });

  test('Variable Calendar', 'Term 2 supports 12-week academic calendar with revision and terminal exam', () => {
    const t2 = AUTHENTIC_TERM_CALENDARS[2];
    assert.strictEqual(t2.totalWeeks, 12);
    assert.deepStrictEqual(t2.revisionWeeks, [6, 11]);
    assert.deepStrictEqual(t2.assessmentWeeks, [7]);
    assert.deepStrictEqual(t2.examinationWeeks, [12]);
  });

  test('Variable Calendar', 'Term 3 supports 12-week promotional academic calendar', () => {
    const t3 = AUTHENTIC_TERM_CALENDARS[3];
    assert.strictEqual(t3.totalWeeks, 12);
    assert.deepStrictEqual(t3.revisionWeeks, [6, 11]);
    assert.deepStrictEqual(t3.assessmentWeeks, [7]);
    assert.deepStrictEqual(t3.examinationWeeks, [12]);
  });

  test('Coverage Matrix Scope', 'Architecture defines all 6 primary classes and 6 core subjects across Terms 1–3', () => {
    assert.strictEqual(ALL_NIGERIAN_PRIMARY_CLASSES.length, 6);
    assert.strictEqual(ALL_CORE_PRIMARY_SUBJECTS.length, 6);

    const grades = ALL_NIGERIAN_PRIMARY_CLASSES.map(c => c.grade);
    assert.deepStrictEqual(grades, [1, 2, 3, 4, 5, 6]);
  });

  // ==========================================================================
  // SECTION 4: SEPARATION OF NATIONAL CURRICULUM FROM SCHOOL SCHEME OF WORK
  // ==========================================================================
  console.log('\n--- 4. Separation of National Curriculum from School Scheme of Work ---');

  test('Curriculum Authority Separation', 'Maintains distinct national authority standard metadata', () => {
    const authority = db.getCurriculumAuthority();
    assert.strictEqual(authority.authorityId, 'NERDC_NATIONAL');
    assert.strictEqual(authority.standardType, 'national_curriculum');
    assert.strictEqual(authority.jurisdiction, 'Federal Republic of Nigeria');
  });

  test('School Schemes of Work', 'Allows schools to register adapted schemes linking back to national topic references', () => {
    const schemes = db.getSchoolSchemesOfWork();
    assert.ok(schemes.length >= 2, 'Sample school schemes exist');

    const coronaScheme = schemes.find(s => s.schoolId === 'school_corona_vi');
    assert.ok(coronaScheme);
    assert.strictEqual(coronaScheme.baseNationalCurriculumVersion, 'nerdc-based-v1');
    assert.strictEqual(coronaScheme.grade, 4);
    assert.strictEqual(coronaScheme.subject, 'Mathematics');

    // Week 1 links to national topic reference without altering the national standard
    const w1 = coronaScheme.weeks.find(w => w.week === 1);
    assert.ok(w1);
    assert.strictEqual(w1.nationalTopicReference, 'node-p4-t1-w1-math');
    assert.strictEqual(w1.isAlignedWithNational, true);
  });

  // ==========================================================================
  // SECTION 5: STRICT 5-STATE TRACKING & COMPLETENESS GUARDRAIL
  // ==========================================================================
  console.log('\n--- 5. Strict 5-State Tracking & Completeness Guardrail ---');

  test('Completeness Guardrail', 'Does not mark a topic complete merely because its database entry exists', () => {
    // Incomplete mock entry with only title and grade
    const incompleteNode = {
      grade: 4 as GradeLevel,
      subject: 'Mathematics' as const,
      term: 1 as const,
      week: 4,
      topic: 'Addition of 5-Digit Numbers',
      lifecycleState: 'imported' as const
    };

    assert.strictEqual(
      isCurriculumNodeComplete(incompleteNode as any),
      false,
      'A node missing lesson plan, visual aids, or assessment must NOT be marked complete'
    );
  });

  test('Completeness Guardrail', 'Requires all 17 pedagogical layers before marking isComplete: true', () => {
    const verifiedNode = VERIFIED_HIERARCHY_RECORDS[0];
    assert.strictEqual(isCurriculumNodeComplete(verifiedNode), true, 'Complete verified node passes completeness test');
  });

  // ==========================================================================
  // SECTION 6: ZERO-FABRICATION GUARANTEE & MISSING DOCUMENTS REGISTER
  // ==========================================================================
  console.log('\n--- 6. Zero-Fabrication Guarantee & Missing Documents Register ---');

  test('Anti-Fabrication Policy', 'Primary 1, Primary 5, and Primary 6 contain 0 synthetic fabricated lessons', () => {
    const p1Lessons = VERIFIED_HIERARCHY_RECORDS.filter(r => r.grade === 1);
    const p5Lessons = VERIFIED_HIERARCHY_RECORDS.filter(r => r.grade === 5);
    const p6Lessons = VERIFIED_HIERARCHY_RECORDS.filter(r => r.grade === 6);

    assert.strictEqual(p1Lessons.length, 0, 'Primary 1 must contain 0 fabricated records');
    assert.strictEqual(p5Lessons.length, 0, 'Primary 5 must contain 0 fabricated records');
    assert.strictEqual(p6Lessons.length, 0, 'Primary 6 must contain 0 fabricated records');
  });

  test('Missing Documents Register', 'Registers official federal NERDC documents with citations and request status', () => {
    const docs = db.getMissingDocumentsRegister();
    assert.ok(docs.length >= 8, 'Must have registered all missing official documents');

    for (const d of docs) {
      assert.ok(d.code.startsWith('DOC-NERDC') || d.code.startsWith('DOC-UBEC'));
      assert.ok(d.publisher.includes('NERDC Press') || d.publisher.includes('UBEC'));
      assert.strictEqual(d.status, 'DOCUMENT_REQUESTED');
      assert.ok(d.affectedGrades.length > 0);
      assert.ok(d.affectedSubjects.length > 0);
    }
  });

  // ==========================================================================
  // SECTION 7: HISTORICAL LEARNING PROGRESS & RECORD PRESERVATION
  // ==========================================================================
  console.log('\n--- 7. Historical Learning Progress & Record Preservation ---');

  test('Historical Progress', 'Preserves completed lesson progress with curriculum version locking', () => {
    const students = db.getStudents();
    assert.ok(students.length > 0);

    const chidi = db.getStudentById('chidi');
    assert.ok(chidi, 'Chidi pupil record must exist');
    assert.ok(chidi.completedLessons.length > 0, 'Completed lessons must exist');

    for (const cl of chidi.completedLessons) {
      assert.ok(cl.topicId);
      assert.ok(cl.score >= 0);
      assert.ok(cl.completedAt);
      // Historical version preserved
      if (cl.curriculumVersion) {
        assert.strictEqual(cl.curriculumVersion, 'nerdc-based-v1');
      }
    }
  });

  test('Account Preservation', 'Does not wipe or delete existing parents, pupils, or payments', () => {
    const parents = db.getAllParents();
    const students = db.getStudents();
    const payments = db.getAllPayments();

    assert.ok(parents.length >= 2, 'Parent accounts preserved');
    assert.ok(students.length >= 7, 'Cohort pupil accounts preserved');
    assert.ok(payments.length >= 10, 'Historical payments preserved');
  });

  // ==========================================================================
  // SECTION 8: AUDITABLE CURRICULUM COVERAGE REPORT GENERATION
  // ==========================================================================
  console.log('\n--- 8. Auditable Curriculum Coverage Report Generation ---');

  test('Audit Report Generation', 'Produces auditable coverage report across Primary 1–6 and Terms 1–3', () => {
    const report = db.getAuditableCoverageReport();
    assert.ok(report);
    assert.strictEqual(report.totalClasses, 6);
    assert.strictEqual(report.classes.length, 6);

    // Verify 6 verified published lessons are reported accurately
    assert.strictEqual(report.summary.totalVerifiedPublished, 6);

    // Verify gaps are reported honestly
    assert.ok(report.summary.totalMissingDocumentGaps > 0);
    assert.ok(report.missingDocuments.length >= 8);
    assert.ok(report.summary.antiFabricationGuarantee.includes('Strict adherence'));

    // Check Primary 4 Term 1 Mathematics
    const p4 = report.classes.find(c => c.grade === 4);
    assert.ok(p4);
    const p4t1 = p4.terms.find(t => t.termNumber === 1);
    assert.ok(p4t1);
    const p4Math = p4t1.subjects.find(s => s.subjectName === 'Mathematics');
    assert.ok(p4Math);
    assert.strictEqual(p4Math.verifiedCount, 2, 'P4 Math T1 has 2 verified weeks (W1 & W2)');
    assert.strictEqual(p4Math.missingCount, 11, 'Remaining 11 weeks marked as missing document gaps');

    // Check Primary 3 Term 1 Basic Science
    const p3 = report.classes.find(c => c.grade === 3);
    assert.ok(p3);
    const p3t1 = p3.terms.find(t => t.termNumber === 1);
    assert.ok(p3t1);
    const p3Bst = p3t1.subjects.find(s => s.subjectName === 'Basic Science & Technology');
    assert.ok(p3Bst);
    assert.strictEqual(p3Bst.verifiedCount, 1, 'P3 BST T1 has 1 verified week (W3)');
    const w3Topic = p3Bst.topics.find(t => t.week === 3);
    assert.ok(w3Topic);
    assert.strictEqual(w3Topic.topicTitle, 'Living & Non-Living Things in Our Environment');
    assert.strictEqual(w3Topic.lifecycleState, 'published');
  });

  console.log('================================================================');
  console.log(`  PHASE 6 CURRICULUM ARCHITECTURE SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6CurriculumArchitectureTests();
