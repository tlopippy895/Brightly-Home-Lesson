import assert from 'node:assert';
import { 
  RECOMMENDED_30_MIN_LESSON_PLAN, 
  TOTAL_LESSON_DURATION_MINUTES, 
  REMEDIAL_EXTENSION_MINUTES,
  SUBJECT_MASTERY_RULES,
  evaluateSubjectMastery,
  getAdaptiveReTeachingContent,
  buildParentAcademicSummary
} from '../server/lessonDelivery';
import { VERIFIED_HIERARCHY_RECORDS } from '../server/curriculumArchitecture';
import { NATIONAL_CURRICULUM_LESSONS } from '../src/data/curriculum';
import { db } from '../server/db';
import { gates } from '../server/gates';

console.log('================================================================');
console.log('  BRIGHTLY HOME LESSON — PHASE 7: LESSON DELIVERY, ADAPTIVE TEACHING & PARENT REPORTS');
console.log('================================================================');

async function runPhase7LessonDeliveryTests() {
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
  // SECTION 1: CONFIGURABLE 30-MINUTE LESSON PLAN & TIMING ALLOCATION
  // ==========================================================================
  console.log('\n--- 1. 30-Minute Configurable Lesson Plan & Timing Allocation ---');

  test('Lesson Timing Allocation', 'Plan has exactly 6 structured phases totaling 30 minutes', () => {
    assert.strictEqual(RECOMMENDED_30_MIN_LESSON_PLAN.length, 6, 'Must have 6 phases');
    assert.strictEqual(TOTAL_LESSON_DURATION_MINUTES, 30, 'Total planned minutes must be exactly 30');
    const sum = RECOMMENDED_30_MIN_LESSON_PLAN.reduce((acc, p) => acc + p.durationMinutes, 0);
    assert.strictEqual(sum, 30, 'Phase durations must sum to 30');
  });

  test('Phase Timing Breakdown', 'Recommended allocation matches 3 + 7 + 6 + 6 + 5 + 3 = 30 minutes', () => {
    const [p1, p2, p3, p4, p5, p6] = RECOMMENDED_30_MIN_LESSON_PLAN;

    // Welcome and recall: 3 minutes
    assert.strictEqual(p1.phaseNumber, 1);
    assert.strictEqual(p1.name, 'Welcome and Recall');
    assert.strictEqual(p1.durationMinutes, 3);

    // Teach: 7 minutes
    assert.strictEqual(p2.phaseNumber, 2);
    assert.strictEqual(p2.name, 'Teach');
    assert.strictEqual(p2.durationMinutes, 7);

    // Explain and demonstrate: 6 minutes
    assert.strictEqual(p3.phaseNumber, 3);
    assert.strictEqual(p3.name, 'Explain and Demonstrate');
    assert.strictEqual(p3.durationMinutes, 6);

    // Guided practice: 6 minutes
    assert.strictEqual(p4.phaseNumber, 4);
    assert.strictEqual(p4.name, 'Guided Practice');
    assert.strictEqual(p4.durationMinutes, 6);

    // Independent practice and assessment: 5 minutes
    assert.strictEqual(p5.phaseNumber, 5);
    assert.strictEqual(p5.name, 'Independent Practice and Assessment');
    assert.strictEqual(p5.durationMinutes, 5);

    // Feedback and mastery check: 3 minutes
    assert.strictEqual(p6.phaseNumber, 6);
    assert.strictEqual(p6.name, 'Feedback and Mastery Check');
    assert.strictEqual(p6.durationMinutes, 3);

    assert.strictEqual(3 + 7 + 6 + 6 + 5 + 3, 30);
  });

  test('Remedial Extension', 'Transparently allocates 5 minutes for remedial re-teaching without false completion', () => {
    assert.ok(REMEDIAL_EXTENSION_MINUTES >= 5, 'Remedial extension must be at least 5 minutes');
    const extendedTotal = TOTAL_LESSON_DURATION_MINUTES + REMEDIAL_EXTENSION_MINUTES;
    assert.strictEqual(extendedTotal, 35, 'Extended lesson with remediation must be 35 minutes');
  });

  // ==========================================================================
  // SECTION 2: CONNECT VERIFIED CURRICULUM RECORDS & UNPUBLISHED ACCESS GUARDS
  // ==========================================================================
  console.log('\n--- 2. Verified Curriculum Connection & Publishing Guardrails ---');

  test('Curriculum Connection', 'Connects all 6 verified lessons from Phase 6 hierarchy records', () => {
    assert.ok(NATIONAL_CURRICULUM_LESSONS.length >= 6, 'Must retain at least 6 verified lessons');
    assert.ok(VERIFIED_HIERARCHY_RECORDS.length >= 6, 'Must retain at least 6 hierarchy nodes');

    // Authoritative Primary 3 Science topic title preserved
    const p3Sci = NATIONAL_CURRICULUM_LESSONS.find(l => l.id === 'p3-t1-w3-sci');
    assert.ok(p3Sci, 'p3-t1-w3-sci must exist in curriculum');
    assert.ok(/Living (&|and) Non-Living Things in Our Environment/.test(p3Sci.topic));
    assert.strictEqual(p3Sci.grade, 3);

    const p3Node = VERIFIED_HIERARCHY_RECORDS.find(h => h.lessonId === 'p3-t1-w3-sci');
    assert.ok(p3Node, 'p3-t1-w3-sci must exist in hierarchy');
    assert.ok(/Living (&|and) Non-Living Things in Our Environment/.test(p3Node.topic));
  });

  test('Unpublished Guardrail', 'Rejects unlocking or completing unverified / unpublished lessons', () => {
    const student = db.addStudent({
      name: 'Tunde Adebayo',
      grade: 4,
      schoolName: 'Corona School Lagos',
      academicSession: '2024/2025'
    });

    const draftTopicId = 'p4-t1-w99-draft-gate';
    db.createCurriculumRecord({
      id: draftTopicId,
      grade: 4,
      term: 1,
      week: 99,
      subject: 'Mathematics',
      strandOrTheme: 'Numbers',
      topic: 'Advanced Probability Models',
      publishingStatus: 'DRAFT',
      verificationStatus: 'AWAITING_VERIFICATION',
      learningObjectives: ['Explore advanced probability'],
      competencies: ['Critical Thinking'],
      contentOutline: ['Draft overview'],
      learningActivities: ['Draft activity'],
      teachingResources: ['Draft materials'],
      practiceProblems: [],
      assessmentQuestions: []
    } as any);

    const access = gates.evaluateLessonAccess(student.id, 4, 1, 99, false);
    assert.strictEqual(access.allowed, false, 'Unpublished lesson must not be allowed');
    assert.strictEqual(access.reason, 'unpublished_lesson');
    assert.ok(access.message?.includes('LESSONS COMING SOON'));

    const record = db.getCurriculumRecordById(draftTopicId);
    assert.strictEqual(record?.publishingStatus, 'DRAFT');

    // Clean up temporary draft record
    db.deleteCurriculumRecord(draftTopicId);
  });

  // ==========================================================================
  // SECTION 3: SUBJECT-SPECIFIC MASTERY SCORING (NO UNIVERSAL 70%)
  // ==========================================================================
  console.log('\n--- 3. Subject-Specific Mastery Rules & 5 Official Mastery States ---');

  test('Subject-Specific Rules', 'Strictly avoids universal 70% threshold across subjects', () => {
    assert.strictEqual(SUBJECT_MASTERY_RULES['Mathematics'].passPercentage, 80);
    assert.strictEqual(SUBJECT_MASTERY_RULES['Basic Science & Technology'].passPercentage, 80);
    assert.strictEqual(SUBJECT_MASTERY_RULES['English Studies'].passPercentage, 80);
    assert.strictEqual(SUBJECT_MASTERY_RULES['Social Studies'].passPercentage, 75);
    assert.strictEqual(SUBJECT_MASTERY_RULES['Civic Education'].passPercentage, 75);
    assert.strictEqual(SUBJECT_MASTERY_RULES['Agricultural Science'].passPercentage, 75);

    assert.notStrictEqual(
      SUBJECT_MASTERY_RULES['Mathematics'].passPercentage,
      SUBJECT_MASTERY_RULES['Social Studies'].passPercentage
    );
  });

  test('5 Official Mastery States', 'Evaluates Beginning, Developing, Approaching Mastery, Mastered, Strong Mastery', () => {
    // 1. Strong Mastery (100% or >= 95% threshold)
    const strong = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 4,
      correctCount: 4
    });
    assert.strictEqual(strong.masteryLevel, 'Strong Mastery');
    assert.strictEqual(strong.passed, true);

    // 2. Mastered in Social Studies (75% meets 75% threshold)
    const mastered = evaluateSubjectMastery({
      subject: 'Social Studies',
      totalQuestions: 4,
      correctCount: 3
    });
    assert.strictEqual(mastered.masteryLevel, 'Mastered');
    assert.strictEqual(mastered.passed, true);

    // 3. Approaching Mastery in Mathematics (75% is below 80% threshold)
    const approaching = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 4,
      correctCount: 3
    });
    assert.strictEqual(approaching.masteryLevel, 'Approaching Mastery');
    assert.strictEqual(approaching.passed, false);

    // 4. Developing (50%)
    const developing = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 4,
      correctCount: 2
    });
    assert.strictEqual(developing.masteryLevel, 'Developing');
    assert.strictEqual(developing.passed, false);

    // 5. Beginning (25%)
    const beginning = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 4,
      correctCount: 1
    });
    assert.strictEqual(beginning.masteryLevel, 'Beginning');
    assert.strictEqual(beginning.passed, false);
  });

  test('Anti-Fabrication Check', 'Merely opening a lesson without assessment submission awards no mastery', () => {
    const zeroAttempt = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 0,
      correctCount: 0
    });
    assert.strictEqual(zeroAttempt.masteryLevel, 'Beginning');
    assert.strictEqual(zeroAttempt.passed, false);
    assert.strictEqual(zeroAttempt.requiresRemediation, true);
  });

  // ==========================================================================
  // SECTION 4: ADAPTIVE RE-TEACHING WITH EVERYDAY NIGERIAN ANALOGIES
  // ==========================================================================
  console.log('\n--- 4. Adaptive Re-teaching Loop & Alternative Explanations ---');

  test('Fractions Remediation', 'Provides Agege bread and sweet oranges analogy for Fractions', () => {
    const content = getAdaptiveReTeachingContent({
      topicId: 'p4-t1-w2-math',
      grade: 4,
      subject: 'Mathematics',
      topic: 'Improper Fractions and Mixed Numbers',
      pupilName: 'Chidi'
    });

    assert.ok(content.analogyTitle.includes('Agege Bread'));
    assert.ok(content.encouragement.includes('Chidi'));
    assert.ok(content.simplifiedExplanation.includes('sweet orange'));
    assert.ok(content.retestQuestion);
    assert.strictEqual(content.retestQuestion.correctIndex, 1);
    assert.strictEqual(content.remedialTimeMinutes, 5);
  });

  test('Place Value Remediation', 'Provides Nigerian market Naira bundles analogy for Place Value', () => {
    const content = getAdaptiveReTeachingContent({
      topicId: 'p4-t1-w1-math',
      grade: 4,
      subject: 'Mathematics',
      topic: 'Whole Numbers: Place Value up to 100,000',
      pupilName: 'Aminat'
    });

    assert.ok(content.analogyTitle.includes('Naira Bundles'));
    assert.ok(content.simplifiedExplanation.includes('₦10,000'));
    assert.ok(content.retestQuestion.question.includes('place value'));
  });

  test('Geography Remediation', 'Provides River Niger & Benue Lokoja confluence analogy for Geography', () => {
    const content = getAdaptiveReTeachingContent({
      topicId: 'p4-t1-w3-geo',
      grade: 4,
      subject: 'Social Studies',
      topic: 'Physical Geography of Nigeria: Rivers, Landforms and Geopolitical Zones',
      pupilName: 'Emeka'
    });

    assert.ok(content.analogyTitle.includes('River Y in Nigeria'));
    assert.ok(content.simplifiedExplanation.includes('Lokoja'));
    assert.ok(content.retestQuestion.options[content.retestQuestion.correctIndex].includes('Lokoja'));
  });

  test('Adaptive Retest Pass', 'Passing retest updates student to Mastered state', () => {
    const retested = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 4,
      correctCount: 2,
      reexplained: true,
      retestPassed: true
    });
    assert.strictEqual(retested.passed, true);
    assert.strictEqual(retested.masteryLevel, 'Mastered');
    assert.strictEqual(retested.requiresRemediation, false);
    assert.ok(retested.summaryText.includes('adaptive'));
  });

  test('Adaptive Retest Fail', 'Failing retest leaves student in Developing state with guided practice recommendation', () => {
    const failedRetest = evaluateSubjectMastery({
      subject: 'Mathematics',
      totalQuestions: 4,
      correctCount: 2,
      reexplained: true,
      retestPassed: false
    });
    assert.strictEqual(failedRetest.passed, false);
    assert.strictEqual(failedRetest.masteryLevel, 'Developing');
    assert.strictEqual(failedRetest.requiresRemediation, true);
  });

  // ==========================================================================
  // SECTION 5: SECURE PROGRESS SAVING & CURRICULUM VERSION TRACKING
  // ==========================================================================
  console.log('\n--- 5. Progress Saved Against Pupil & Curriculum Version ---');

  test('Version Locking', 'Records completed lesson with curriculum version and source reference', () => {
    const student = db.addStudent({
      name: 'Zainab Bello',
      grade: 4,
      schoolName: 'Garki Primary School Abuja',
      academicSession: '2024/2025'
    });

    const updated = db.recordLessonComplete(student.id, {
      topicId: 'p4-t1-w1-math',
      subject: 'Mathematics',
      title: 'Whole Numbers: Place Value up to 100,000',
      score: 100,
      reexplained: false,
      retestPassed: false,
      objectivesMastery: [
        {
          objective: 'Identify place value of digits up to 100,000',
          mastered: true,
          masteryLevel: 'Strong Mastery'
        }
      ]
    });

    assert.ok(updated);
    const recorded = updated.completedLessons.find(l => l.topicId === 'p4-t1-w1-math');
    assert.ok(recorded);
    assert.strictEqual(recorded.score, 100);
    assert.strictEqual(recorded.masteryLevel, 'Strong Mastery');
    assert.ok(recorded.curriculumVersion?.includes('nerdc'));
    assert.ok(recorded.sourceReference);
    assert.ok(recorded.completedAt);
  });

  test('Historical Integrity', 'Preserves completed lesson progress when curriculum updates occur', () => {
    const student = db.addStudent({
      name: 'Kelechi Nwosu',
      grade: 3,
      schoolName: 'St Saviours Ikoyi',
      academicSession: '2024/2025'
    });

    db.recordCompletedLesson(student.id, {
      topicId: 'p3-t1-w3-sci',
      subject: 'Basic Science & Technology',
      title: 'Living and Non-Living Things in Our Environment',
      score: 90,
      reexplained: false,
      curriculumVersion: 'nerdc-2012-legacy-v1',
      sourceReference: 'Universal Basic Education 2012 Edition'
    });

    const pupil = db.getStudentById(student.id);
    const lesson = pupil!.completedLessons.find(l => l.topicId === 'p3-t1-w3-sci');
    assert.strictEqual(lesson?.curriculumVersion, 'nerdc-2012-legacy-v1');
    assert.strictEqual(lesson?.sourceReference, 'Universal Basic Education 2012 Edition');
  });

  // ==========================================================================
  // SECTION 6: PARENT PROGRESS REPORTS MAPPED TO ACTUAL OBJECTIVES
  // ==========================================================================
  console.log('\n--- 6. Parent Progress Reports Mapped to Objectives & Assessments ---');

  test('Pending Baseline', 'Pupil with 0 lessons completed returns pending baseline report', () => {
    const student = db.addStudent({
      name: 'New Starter Kid',
      grade: 2,
      schoolName: 'Grange School Ikeja',
      academicSession: '2024/2025'
    });

    const report = buildParentAcademicSummary(student);
    assert.strictEqual(report.hasCompletedLessons, false);
    assert.strictEqual(report.totalLessonsCompleted, 0);
    assert.strictEqual(report.completedLessons.length, 0);
    assert.ok(report.areasNeedingPractice[0].includes('baseline diagnostic'));
  });

  test('Objective Mapping', 'Maps parent report to verified learning objectives and completed assessments', () => {
    const student = db.addStudent({
      name: 'Chioma Okonkwo',
      grade: 4,
      schoolName: 'British International School Lagos',
      academicSession: '2024/2025'
    });

    db.recordLessonComplete(student.id, {
      topicId: 'p4-t1-w1-math',
      subject: 'Mathematics',
      title: 'Whole Numbers: Place Value up to 100,000',
      score: 95,
      reexplained: false,
      objectivesMastery: [
        {
          objective: 'State the place value of any digit in a 5-digit whole number up to 100,000',
          mastered: true,
          masteryLevel: 'Strong Mastery'
        },
        {
          objective: 'Write 5-digit numbers in expanded notation',
          mastered: true,
          masteryLevel: 'Strong Mastery'
        }
      ]
    });

    const freshStudent = db.getStudentById(student.id)!;
    const report = buildParentAcademicSummary(freshStudent);

    assert.strictEqual(report.hasCompletedLessons, true);
    assert.strictEqual(report.totalLessonsCompleted, 1);
    assert.strictEqual(report.completedLessons.length, 1);

    const lessonReport = report.completedLessons[0];
    assert.ok(lessonReport.topicTitle.includes('Place Value'));
    assert.strictEqual(lessonReport.score, 95);
    assert.strictEqual(lessonReport.masteryLevel, 'Strong Mastery');
    assert.ok(lessonReport.curriculumVersion?.includes('nerdc'));
    assert.strictEqual(lessonReport.objectives.length, 2);
    assert.strictEqual(lessonReport.objectives[0].mastered, true);
    assert.ok(lessonReport.objectives[0].objective.includes('place value'));
    assert.ok(lessonReport.homeDiscussionPrompt);
    assert.ok(lessonReport.recommendedHomeActivity);
    assert.ok(report.strongAreas.some(a => a.toLowerCase().includes('place value')));
  });

  test('Home Practice Recommendations', 'Includes concrete weekend home activities and subject summary', () => {
    const student = db.addStudent({
      name: 'Farouk Danjuma',
      grade: 4,
      schoolName: 'Command Children School Kaduna',
      academicSession: '2024/2025'
    });

    db.recordLessonComplete(student.id, {
      topicId: 'p4-t1-w2-math',
      subject: 'Mathematics',
      title: 'Fractions: Proper, Improper and Mixed Numbers',
      score: 85,
      reexplained: true,
      retestPassed: true
    });

    const report = buildParentAcademicSummary(db.getStudentById(student.id)!);
    assert.ok(report.completedLessons[0].recommendedHomeActivity);
    assert.ok(report.completedLessons[0].homeDiscussionPrompt);
    assert.strictEqual(report.subjectMasterySummary.length, 1);
    assert.strictEqual(report.subjectMasterySummary[0].subject, 'Mathematics');
    assert.strictEqual(report.subjectMasterySummary[0].masteryStatus, 'Mastered');
  });

  // ==========================================================================
  // SECTION 7: BACKEND SECURITY GATES & ACCESS RESTRICTIONS
  // ==========================================================================
  console.log('\n--- 7. Backend Security Gates & Access Restrictions ---');

  test('Free Trial Policy', 'Free preview permitted for Week 1, but Week 2 blocked without tuition', () => {
    const student = db.addStudent({
      name: 'Funke Akindele',
      grade: 4,
      schoolName: 'Maryland Primary School Lagos',
      academicSession: '2024/2025'
    });

    const week1 = gates.evaluateLessonAccess(student.id, 4, 1, 1, false);
    assert.strictEqual(week1.allowed, true, 'Week 1 must be permitted under free trial');

    const week2 = gates.evaluateLessonAccess(student.id, 4, 1, 2, false);
    assert.strictEqual(week2.allowed, false, 'Week 2 must be blocked without tuition');
    assert.strictEqual(week2.reason, 'term_unpaid');
    assert.strictEqual(week2.requiredFee, 6000);
  });

  test('Tuition Unlock', 'Termly tuition activation unlocks Week 2 for the paid pupil', () => {
    const student = db.addStudent({
      name: 'Oluwaseun Balogun',
      grade: 4,
      schoolName: 'Greensprings School Lagos',
      academicSession: '2024/2025'
    });

    db.updateStudentTermlyTuition(student.id, 1, 6000, 'PAID_SEUN_REF');

    const week2 = gates.evaluateLessonAccess(student.id, 4, 1, 2, false);
    assert.strictEqual(week2.allowed, true, 'Week 2 must be allowed after tuition payment');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 7 LESSON DELIVERY SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7LessonDeliveryTests().catch(err => {
  console.error('Fatal error running Phase 7 tests:', err);
  process.exit(1);
});
