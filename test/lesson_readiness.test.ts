import assert from 'node:assert';
import { db } from '../server/db';
import { validateCurriculumReadiness, LessonReadinessReport } from '../server/readinessValidator';
import { GradeLevel, SubjectName } from '../server/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — LESSON READINESS GATE TEST SUITE');
console.log('================================================================');

async function runReadinessTestSuite() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  \x1b[32m✔\x1b[0m [Lesson Readiness] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  \x1b[31m✖\x1b[0m [Lesson Readiness] ${name}: ${err?.message}`);
      failed++;
    }
  }

  console.log('\n--- 1. Mandatory Metadata Rules (Rules 1 - 4) ---');

  test('Rule 1: Rejects missing or out-of-range class grades (0, 7, negative)', () => {
    const invalidGrades = [0, 7, -1, NaN, undefined];
    for (const g of invalidGrades) {
      const rep = validateCurriculumReadiness({
        grade: g,
        subject: 'Mathematics',
        term: 1,
        week: 1,
        topic: 'Whole Numbers',
        objectives: ['Identify place value'],
        sourceReference: 'NERDC Primary Maths Scheme',
        curriculumVersion: 'nerdc-2024-v1'
      });
      assert.strictEqual(rep.status, 'NOT READY');
      assert.strictEqual(rep.canPublish, false);
      assert.ok(rep.errors.some(e => e.includes('class') || e.includes('Class')));
    }
  });

  test('Rule 1: Accepts valid primary classes Primary 1 through Primary 6', () => {
    for (let g = 1; g <= 6; g++) {
      const rep = validateCurriculumReadiness({
        grade: g,
        subject: 'Mathematics',
        term: 1,
        week: 1,
        topic: 'Whole Numbers',
        objectives: ['Identify place value'],
        sourceReference: 'NERDC Primary Maths Scheme',
        curriculumVersion: 'nerdc-2024-v1'
      });
      const classCheck = rep.checks.find(c => c.ruleId === 'RULE_1_CLASS');
      assert.ok(classCheck?.passed, `Class ${g} should pass Rule 1 check`);
    }
  });

  test('Rule 2: Rejects missing or empty subject string', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: '',
      term: 1,
      week: 1,
      topic: 'Fractions',
      objectives: ['Understand proper fractions'],
      sourceReference: 'NERDC Primary Maths Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('subject')));
  });

  test('Rule 3: Rejects invalid terms (0, 4, or undefined)', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 4,
      week: 1,
      topic: 'Fractions',
      objectives: ['Understand proper fractions'],
      sourceReference: 'NERDC Primary Maths Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('Term')));
  });

  test('Rule 4: Validates instructional week number and classified non-week periods', () => {
    const invalidWeek = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: -2,
      topic: 'Fractions',
      objectives: ['Understand proper fractions'],
      sourceReference: 'NERDC Primary Maths Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(invalidWeek.status, 'NOT READY');

    const validRevisionPeriod = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 6,
      weekType: 'revision',
      topic: 'Mid-Term Revision & Concrete Problem Solving',
      objectives: ['Consolidate Weeks 1-5 learning outcomes'],
      sourceReference: 'NERDC Primary Maths Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.ok(validRevisionPeriod.checks.find(c => c.ruleId === 'RULE_4_WEEK_PERIOD')?.passed);
  });

  console.log('\n--- 2. Topic & Pedagogical Objective Integrity (Rules 5 - 8) ---');

  test('Rule 5: Rejects empty or whitespace topic title', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 2,
      topic: '   ',
      objectives: ['Solve problems'],
      sourceReference: 'NERDC Primary Maths Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('topic')));
  });

  test('Rule 6: Requires at least one authentic learning objective', () => {
    const repNoObj = validateCurriculumReadiness({
      grade: 4,
      subject: 'English Studies',
      term: 1,
      week: 2,
      topic: 'Nouns',
      objectives: [],
      sourceReference: 'NERDC English Curriculum',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(repNoObj.status, 'NOT READY');
    assert.ok(repNoObj.errors.some(e => e.includes('objective')));

    // Authoritative Single Objective is accepted (anti-fabrication discipline)
    const repSingleObj = validateCurriculumReadiness({
      grade: 4,
      subject: 'English Studies',
      term: 1,
      week: 2,
      topic: 'Nouns',
      objectives: ['Identify proper nouns in a given passage.'],
      sourceReference: 'NERDC English Curriculum',
      curriculumVersion: 'nerdc-2024-v1'
    });
    const objCheck = repSingleObj.checks.find(c => c.ruleId === 'RULE_6_OBJECTIVES_PRESENCE');
    assert.ok(objCheck?.passed, 'Authentic single objective must pass Rule 6');
  });

  test('Rule 7: Objectives must not be empty or blank strings', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'English Studies',
      term: 1,
      week: 2,
      topic: 'Nouns',
      objectives: ['Identify nouns', '   ', 'Use collective nouns'],
      sourceReference: 'NERDC English Curriculum',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('blank or whitespace')));
  });

  test('Rule 8: Objectives must not contain duplicate statements', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Social Studies',
      term: 1,
      week: 3,
      topic: 'Nigerian Geography',
      objectives: [
        'Locate the 6 geopolitical zones on the Nigerian map',
        'locate the 6 geopolitical zones on the nigerian map' // duplicate (case-insensitive)
      ],
      sourceReference: 'NERDC Social Studies Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('Duplicate learning objectives')));
  });

  console.log('\n--- 3. Source Citation & Version Governance (Rules 9 - 12) ---');

  test('Rule 9: Rejects records lacking authentic source reference or document citation', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Whole Numbers',
      objectives: ['Count up to 100,000'],
      sourceReference: '',
      sourceDocument: '',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('source reference')));
  });

  test('Rule 10: Rejects records with unidentifiable curriculum version', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Whole Numbers',
      objectives: ['Count up to 100,000'],
      sourceReference: 'NERDC National Curriculum',
      curriculumVersion: ''
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('curriculum version')));
  });

  test('Rule 11: Rejects internal metadata contradictions (e.g. ID class vs explicit class)', () => {
    const rep = validateCurriculumReadiness({
      id: 'p2-t1-w3-math',
      grade: 5, // Contradicts 'p2' in ID
      subject: 'Mathematics',
      term: 1,
      week: 3,
      topic: 'Counting in 2s',
      objectives: ['Count in multiples of 2'],
      sourceReference: 'NERDC Primary Maths',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.ok(rep.errors.some(e => e.includes('Conflicting curriculum information')));
  });

  test('Rule 12: Publishing Gate Integrity prevents PUBLISHED status with blocking defects', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: '', // Blocking defect
      objectives: [],
      publishingStatus: 'PUBLISHED',
      sourceReference: 'NERDC Scheme',
      curriculumVersion: 'nerdc-2024-v1'
    });
    assert.strictEqual(rep.status, 'NOT READY');
    assert.strictEqual(rep.canPublish, false);
    assert.ok(rep.errors.some(e => e.includes('Publishing integrity breach')));
  });

  console.log('\n--- 4. Quality Status Distinction (READY vs WARNING vs NOT READY) ---');

  test('Distinguishes WARNING status when optional pedagogical fields are omitted without blocking', () => {
    const rep = validateCurriculumReadiness({
      grade: 4,
      subject: 'Mathematics',
      term: 1,
      week: 1,
      topic: 'Whole Numbers and Place Value',
      subtopic: 'Whole Numbers and Place Value', // same as topic
      objectives: ['State the place value of 5-digit digits'],
      sourceReference: 'NERDC UBE Primary 4 Scheme',
      curriculumVersion: 'nerdc-2024-v1',
      publishingStatus: 'DRAFT'
      // Omitted: learningActivities, concreteVisualAids, competencies
    });

    assert.strictEqual(rep.status, 'WARNING');
    assert.strictEqual(rep.canPublish, true, 'Records with advisory warnings can still be published');
    assert.strictEqual(rep.errors.length, 0);
    assert.ok(rep.warnings.length > 0, 'Advisory warnings must be registered');
    assert.ok(rep.warnings.some(w => w.includes('activities') || w.includes('aids') || w.includes('subtopic')));
  });

  test('All 6 verified seed curriculum records evaluate to READY when published with full metadata', () => {
    const seedRecords = db.getAllCurriculumRecords();
    assert.strictEqual(seedRecords.length, 6);

    for (const record of seedRecords) {
      const rep = validateCurriculumReadiness(record);
      assert.strictEqual(rep.status, 'READY', `Seed record ${record.id} must have status READY`);
      assert.strictEqual(rep.isReadyForLesson, true, `Seed record ${record.id} must be ready for lesson generation`);
      assert.strictEqual(rep.canPublish, true);
      assert.strictEqual(rep.errors.length, 0);
    }
  });

  console.log('\n--- 5. Database Integration & Publishing Gate Enforcement ---');

  test('Database blocks transitioning a defective record to PUBLISHED via transitionPublishingWorkflow', () => {
    // Create a draft with missing objectives
    const draft = db.createCurriculumRecord({
      grade: 3,
      subject: 'Basic Science & Technology',
      term: 1,
      week: 4,
      topic: 'Living Things Test Topic',
      objectives: [], // Invalid
      publishingStatus: 'DRAFT',
      sourceReference: 'NERDC Science',
      curriculumVersion: 'nerdc-2024-v1'
    });

    // Attempting to publish should be rejected by the gate
    assert.throws(() => {
      db.transitionPublishingWorkflow(draft.id, 'PUBLISHED');
    }, (err: any) => {
      return err.message.includes('Lesson Readiness Gate failed');
    });

    // Cleanup test record
    db.deleteCurriculumRecord(draft.id);
  });

  test('Database attaches updated readiness report to curriculum records', () => {
    const verified = db.getCurriculumRecordById('p4-t1-w1-math');
    assert.ok(verified?.readiness);
    assert.strictEqual(verified.readiness.status, 'READY');
    assert.strictEqual(verified.readiness.isReadyForLesson, true);
  });

  test('getCurriculumCoverage reports accurate readiness breakdown across the platform', () => {
    const coverage = db.getCurriculumCoverage();
    assert.ok(coverage.readinessSummary);
    assert.strictEqual(typeof coverage.readinessSummary.ready, 'number');
    assert.strictEqual(typeof coverage.readinessSummary.readyForLesson, 'number');
    assert.ok(coverage.readinessSummary.ready >= 6);
  });

  console.log('================================================================');
  console.log(`  READINESS TEST SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runReadinessTestSuite();
