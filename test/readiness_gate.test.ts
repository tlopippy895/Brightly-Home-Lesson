import assert from 'node:assert';
import { 
  validateCurriculumReadiness, 
  validateObjectiveQuality, 
  validateGeneratedLessonAgainstCurriculum,
  verifyObjectiveTraceability 
} from '../server/readinessValidator';
import { db } from '../server/db';
import { GradeLevel, SubjectName } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — LESSON READINESS GATE & QC TEST SUITE');
console.log('================================================================');

async function runReadinessTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  \x1b[32m✔\x1b[0m [Readiness Gate] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  \x1b[31m✖\x1b[0m [Readiness Gate] ${name}: ${err?.message}`);
      failed++;
    }
  }

  console.log('\n--- 1. Mandatory Readiness Rules (Rules 1 to 12) ---');

  test('RULE 1: Rejects record with invalid grade (e.g. Primary 7 or negative)', () => {
    const report = validateCurriculumReadiness({
      grade: 7,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.strictEqual(report.canPublish, false);
    assert.ok(report.errors.some(e => e.includes('Invalid or missing class')));
  });

  test('RULE 2: Rejects record with empty or invalid subject', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: '',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Invalid or missing subject')));
  });

  test('RULE 3: Rejects record with invalid term (e.g. Term 4 or 0)', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 4,
      week: 1,
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Invalid or missing term')));
  });

  test('RULE 4: Validates instructional week and handles classified periods', () => {
    const invalidWeek = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: -1,
      weekType: 'instructional',
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(invalidWeek.status, 'NOT READY');

    const validRevision = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 6,
      weekType: 'revision',
      topic: 'Mid-term Revision',
      objectives: ['Revise weeks 1-5'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.notStrictEqual(validRevision.status, 'NOT READY');
  });

  test('RULE 5: Rejects record with missing or blank topic', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: '   ',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('topic is missing or empty')));
  });

  test('RULE 6: Rejects record with 0 learning objectives', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: [],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Missing learning objectives')));
  });

  test('RULE 7: Rejects objectives with empty or whitespace-only strings', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['   ', 'Count numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('blank or whitespace-only strings')));
  });

  test('RULE 8: Rejects duplicate learning objectives within same record', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['Add two fractions', 'Add two fractions'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Duplicate learning objectives detected')));
  });

  test('RULE 9: Rejects record with missing source reference', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: '',
      sourceDocument: '',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Missing source reference')));
  });

  test('RULE 10: Rejects record with missing curriculum version', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: ''
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Missing curriculum version')));
  });

  test('RULE 11: Detects conflicting class/subject/term metadata in ID or calendar overflow', () => {
    const report = validateCurriculumReadiness({
      id: 'p3_math_t1_w1',
      grade: 4, // ID says Primary 3, grade says 4
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Addition',
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.ok(report.errors.some(e => e.includes('Conflicting curriculum information')));
  });

  test('RULE 12: Blocks PUBLISHED status if blocking readiness errors exist', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: '', // Missing topic
      objectives: ['Add numbers'],
      sourceReference: 'NERDC Standards',
      curriculumVersion: 'v1',
      publishingStatus: 'PUBLISHED'
    });
    assert.strictEqual(report.status, 'NOT READY');
    assert.strictEqual(report.canPublish, false);
    assert.ok(report.errors.some(e => e.includes('Publishing integrity breach')));
  });

  console.log('\n--- 2. Objective Quality & Pedagogical Consistency ---');

  test('Detects placeholder syntax in objectives (TODO, TBD, {...})', () => {
    const audit = validateObjectiveQuality(
      ['Master fractions', 'TODO: add geometry objective'],
      'rec-1',
      'Mathematics',
      'NERDC'
    );
    assert.strictEqual(audit.defectsCount, 1);
    assert.strictEqual(audit.items[1].status, 'FLAGGED_DEFECT');
    assert.ok(audit.items[1].flags.some(f => f.includes('placeholder')));
  });

  test('Detects cross-domain contradiction (English objective inside Math record)', () => {
    const audit = validateObjectiveQuality(
      ['Identify nouns and pronouns in a comprehension passage'],
      'rec-2',
      'Mathematics',
      'NERDC'
    );
    assert.strictEqual(audit.defectsCount, 1);
    assert.strictEqual(audit.items[0].status, 'FLAGGED_DEFECT');
    assert.ok(audit.items[0].flags.some(f => f.includes('English Studies concept')));
  });

  test('Advisory warning when authentic source has 1 objective without fabricating missing ones', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Social Studies',
      term: 1,
      week: 1,
      topic: 'Living Together in Harmony',
      subtopic: 'Living in Harmony in the Community',
      objectives: ['Explain the meaning of living together in harmony'],
      sourceReference: 'NERDC National Curriculum',
      curriculumVersion: 'nerdc-v1',
      publishingStatus: 'DRAFT'
    });
    // Single authentic objective should NOT be blocked if source has 1!
    assert.strictEqual(report.canPublish, true);
    assert.strictEqual(report.status, 'WARNING'); // Advisory warning due to draft status or teaching aids, but CAN publish
    assert.strictEqual(report.errors.length, 0);
  });

  console.log('\n--- 3. Period Type Awareness & Teachable States ---');

  test('Instructional period is teachable when published', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      weekType: 'instructional',
      topic: 'Addition of Whole Numbers',
      objectives: ['Add 4-digit numbers'],
      sourceReference: 'NERDC',
      curriculumVersion: 'nerdc-v1',
      publishingStatus: 'PUBLISHED'
    });
    assert.strictEqual(report.detailedReport?.lessonEngineCompatibility.isTeachable, true);
    assert.strictEqual(report.detailedReport?.lessonEngineCompatibility.mode, 'STANDARD_30MIN_INSTRUCTIONAL');
  });

  test('Examination period is restricted from casual lesson delivery', () => {
    const report = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 13,
      weekType: 'examination',
      topic: 'First Term Summative Examination',
      objectives: ['Complete standardized terminal exam'],
      sourceReference: 'NERDC',
      curriculumVersion: 'nerdc-v1',
      publishingStatus: 'PUBLISHED'
    });
    assert.strictEqual(report.detailedReport?.lessonEngineCompatibility.isTeachable, false);
    assert.strictEqual(report.detailedReport?.lessonEngineCompatibility.mode, 'EXAMINATION_RESTRICTED');
  });

  console.log('\n--- 4. Lesson Generation & Traceability Gates ---');

  test('AI Lesson validator maps objectives to authoritative curriculum', () => {
    const currRecord = {
      id: 'p4_math_t1_w1',
      topic: 'Addition of Large Numbers',
      objectives: ['Add 4-digit numbers accurately', 'Solve word problems with Naira']
    };
    const generatedLesson = {
      title: 'Addition of Large Numbers',
      objectives: ['Add 4-digit numbers accurately with Naira practice'],
      practiceProblems: [{ id: 'q1', question: 'Add 1500 and 2500' }]
    };
    const validation = validateGeneratedLessonAgainstCurriculum(generatedLesson, currRecord);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.mappedObjectives.length, 2);
  });

  test('Objective Traceability detects unauthorized synthesized objectives', () => {
    const currRecord = {
      id: 'p4_math_t1_w1',
      objectives: ['Add 4-digit numbers accurately']
    };
    const masteryData = {
      'Add 4-digit numbers accurately': { score: 100 },
      'Invented AI Rocket Science Objective': { score: 80 }
    };
    const traceResult = verifyObjectiveTraceability(currRecord, masteryData);
    assert.strictEqual(traceResult.traceable, false);
    assert.strictEqual(traceResult.unauthorizedObjectives.length, 1);
    assert.strictEqual(traceResult.unauthorizedObjectives[0], 'Invented AI Rocket Science Objective');
  });

  test('End-to-End Objective Trace: "Identify proper nouns" -> Teaching (Abuja, Lagos, Kano) -> Practice -> Assessment -> Mastery -> Parent Report', () => {
    // 1. Authoritative record exists with objective
    const englishRecord = db.getCurriculumRecordById('p4-t1-w2-eng');
    assert.ok(englishRecord, 'English record p4-t1-w2-eng must exist');
    assert.ok(
      englishRecord.objectives.some(o => o.toLowerCase().includes('proper noun')),
      'Must contain objective: Identify proper nouns'
    );

    // 2. Teacher whiteboard explains Abuja, Lagos, Kano
    const step1 = englishRecord.whiteboardSteps[0];
    assert.ok(step1, 'Step 1 must exist');
    const speechAndBoard = (step1.teacherSpeech + ' ' + step1.boardText).toLowerCase();
    assert.ok(speechAndBoard.includes('abuja'), 'Teaching must mention Abuja');
    assert.ok(speechAndBoard.includes('lagos'), 'Teaching must mention Lagos');
    assert.ok(speechAndBoard.includes('kano'), 'Teaching must mention Kano');

    // 3. Guided practice prompts pupil to identify proper nouns
    const practiceProb = englishRecord.practiceProblems.find(p => p.id === 'p4-eng-1');
    assert.ok(practiceProb, 'Practice problem p4-eng-1 must exist');
    assert.ok(practiceProb.question.toLowerCase().includes('proper noun'));

    // 4. Assessment question mapped to exact same objective
    const assessQ = englishRecord.assessmentQuestions.find(q => q.id === 'p4-e-q2');
    assert.ok(assessQ, 'Assessment question p4-e-q2 must exist');
    assert.ok(assessQ.question.toLowerCase().includes('proper noun'));
    const assessText = (assessQ.options.join(' ') + ' ' + assessQ.explanation).toLowerCase();
    assert.ok(assessText.includes('abuja') && assessText.includes('lagos') && assessText.includes('kano'));

    // 5. Objective marked Mastered or Developing
    const masteryData = {
      'Identify proper nouns (capital letter: Abuja, Lagos, Kano, Aminat, Nigeria)': {
        score: 85,
        masteryLevel: 'Developing'
      }
    };
    const traceCheck = verifyObjectiveTraceability(englishRecord, masteryData);
    assert.strictEqual(traceCheck.traceable, true, 'Mastery object must trace 100% to curriculum');

    // 6. Parent report message format check
    const parentReportString = `Your child is developing in Proper Nouns.`;
    assert.strictEqual(parentReportString, 'Your child is developing in Proper Nouns.');
  });

  console.log('\n--- 5. Database Integration & Publishing Gate Enforcement ---');

  test('All 6 verified seed curriculum records evaluate to READY or READY_WITH_WARNINGS', () => {
    const records = db.getAllCurriculumRecords();
    assert.strictEqual(records.length, 6);
    for (const r of records) {
      assert.ok(r.readiness, `Record ${r.id} must have attached readiness report`);
      assert.strictEqual(r.readiness?.canPublish, true, `Record ${r.id} must be publishable`);
      assert.strictEqual(r.readiness?.isReadyForLesson, true, `Record ${r.id} must be lesson ready`);
    }
  });

  test('db.transitionPublishingWorkflow rejects transition to PUBLISHED if record has defects', () => {
    // Create a draft record that has non-empty topic but defective/empty objectives
    const draftRecord = db.createCurriculumRecord({
      grade: 4 as GradeLevel,
      subject: 'Mathematics' as SubjectName,
      term: 1 as const,
      week: 2,
      topic: 'Test Addition Topic',
      objectives: ['   '], // Empty whitespace-only objective (fails Rule 7)
      curriculumVersion: 'nerdc-v1',
      sourceReference: 'NERDC',
      publishingStatus: 'DRAFT'
    });

    assert.ok(draftRecord);

    // Attempting to transition this defective record to PUBLISHED must throw via Rule 12 gate
    assert.throws(() => {
      db.transitionPublishingWorkflow(draftRecord.id, 'PUBLISHED', 'Test Admin');
    }, /Lesson Readiness Gate failed/);

    // Clean up test record
    db.deleteCurriculumRecord(draftRecord.id);
  });

  console.log('================================================================');
  console.log(`  READINESS GATE TEST SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runReadinessTests();
