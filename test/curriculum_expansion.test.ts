import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/db';
import { getTermStructureConfig, getClassCurriculum, validateCurriculumIntegrity } from '../src/data/curriculumHierarchy';
import { GradeLevel } from '../src/types';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — NERDC CURRICULUM EXPANSION TEST SUITE');
console.log('================================================================');

async function runCurriculumTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  \x1b[32m✔\x1b[0m [Curriculum Expansion] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  \x1b[31m✖\x1b[0m [Curriculum Expansion] ${name}: ${err?.message}`);
      failed++;
    }
  }

  console.log('\n--- 1. Variable Week Counts & Authentic Term Structures ---');

  test('Term 1 supports 13-week variable calendar structure', () => {
    const termConfig = getTermStructureConfig(4, 1);
    assert.strictEqual(termConfig.totalWeeks, 13);
    assert.deepStrictEqual(termConfig.revisionWeeks, [6, 12]);
    assert.deepStrictEqual(termConfig.assessmentWeeks, [7]);
    assert.deepStrictEqual(termConfig.examinationWeeks, [13]);
  });

  test('Term 2 supports 12-week variable calendar structure', () => {
    const termConfig = getTermStructureConfig(4, 2);
    assert.strictEqual(termConfig.totalWeeks, 12);
    assert.deepStrictEqual(termConfig.revisionWeeks, [6, 11]);
    assert.deepStrictEqual(termConfig.assessmentWeeks, [7]);
    assert.deepStrictEqual(termConfig.examinationWeeks, [12]);
  });

  test('Term 3 supports 12-week promotional calendar structure', () => {
    const termConfig = getTermStructureConfig(4, 3);
    assert.strictEqual(termConfig.totalWeeks, 12);
    assert.deepStrictEqual(termConfig.revisionWeeks, [6, 11]);
    assert.deepStrictEqual(termConfig.examinationWeeks, [12]);
  });

  console.log('\n--- 2. Strict Anti-Fabrication Guarantee ---');

  test('Primary 1, Primary 5, and Primary 6 have empty curriculum awaiting official NERDC records', () => {
    const p1 = getClassCurriculum(1);
    const p5 = getClassCurriculum(5);
    const p6 = getClassCurriculum(6);

    assert.strictEqual(p1.status, 'awaiting_curriculum');
    assert.strictEqual(p5.status, 'awaiting_curriculum');
    assert.strictEqual(p6.status, 'awaiting_curriculum');

    // Ensure no synthetic lessons exist in Primary 1
    const p1Weeks = p1.subjects.flatMap(s => s.terms.flatMap(t => t.weeks));
    assert.strictEqual(p1Weeks.length, 0, 'Primary 1 must contain 0 fabricated records');

    const p5Weeks = p5.subjects.flatMap(s => s.terms.flatMap(t => t.weeks));
    assert.strictEqual(p5Weeks.length, 0, 'Primary 5 must contain 0 fabricated records');

    const p6Weeks = p6.subjects.flatMap(s => s.terms.flatMap(t => t.weeks));
    assert.strictEqual(p6Weeks.length, 0, 'Primary 6 must contain 0 fabricated records');
  });

  test('Curriculum integrity verification registers only genuine verified source records', () => {
    const integrity = validateCurriculumIntegrity();
    assert.strictEqual(integrity.totalClasses, 6);
    assert.strictEqual(integrity.unsupportedWeeksOrDuplicates.length, 0);
    assert.strictEqual(integrity.totalPreservedRecords, 6);
  });

  console.log('\n--- 3. Batch Ingestion, Period Classification & Database Integration ---');

  test('db.importCurriculumBatch accepts structured NERDC entries with period classifications', () => {
    const testBatch = [
      {
        grade: 1 as GradeLevel,
        subject: 'Mathematics' as const,
        term: 1 as const,
        week: 1,
        weekType: 'instructional' as const,
        periodTitle: 'Instructional Week 1 · Number Work',
        topic: 'Test Counting 1 to 5',
        subtopic: 'Concrete Object Counting',
        objectives: ['Count objects up to 5', 'Match numerals with physical items'],
        concreteVisualAids: [{ title: 'Counters', description: 'Stones and bottle caps' }]
      },
      {
        grade: 1 as GradeLevel,
        subject: 'Mathematics' as const,
        term: 1 as const,
        week: 6,
        weekType: 'revision' as const,
        periodTitle: 'Revision Week 6',
        topic: 'Mid-Term Revision: Number Work',
        subtopic: 'Review counting and writing',
        objectives: ['Consolidate weeks 1-5 learning']
      }
    ];

    const result = db.importCurriculumBatch(testBatch, {
      documentTitle: 'Test NERDC Suite Import',
      documentReference: 'TEST-NERDC-001',
      publishingStatus: 'DRAFT',
      adminName: 'Test Administrator'
    });

    assert.ok(result.created >= 0);
    assert.strictEqual(result.records.length, 2);

    const savedWk6 = db.getCurriculumByQuery(1, 'Mathematics', 1, 6)[0];
    assert.ok(savedWk6);
    assert.strictEqual(savedWk6.weekType, 'revision');
    assert.strictEqual(savedWk6.publishingStatus, 'DRAFT');

    // Clean up test batch records
    for (const r of result.records) {
      db.deleteCurriculumRecord(r.id);
    }
  });

  console.log('================================================================');
  console.log(`  CURRICULUM TEST SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCurriculumTests();
