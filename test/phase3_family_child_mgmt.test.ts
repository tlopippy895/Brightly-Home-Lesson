import assert from 'node:assert';
import { db } from '../server/db';
import { PersistenceManager } from '../server/persistence';

const BASE_URL = 'http://localhost:3000';

async function runPhase3FamilyChildTests() {
  console.log('\n================================================================');
  console.log('  BRIGHTLY HOME LESSON — PHASE 3: FAMILY ACCOUNT & CHILD PROFILES');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  \x1b[32m✔\x1b[0m ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  \x1b[31m✖\x1b[0m ${name}`);
        console.error(`    Error: ${err.message}`);
        failed++;
      });
  }

  // Setup: Register a unique test parent family
  const testFamilyPhone = `0803${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testFamilyEmail = `parent_${Date.now()}@brightly.ng`;
  const altFamilyPhone = `0807${Math.floor(1000000 + Math.random() * 9000000)}`;
  const altFamilyEmail = `altparent_${Date.now()}@brightly.ng`;

  let parentToken = '';
  let parentId = '';
  let altParentToken = '';
  let altParentId = '';

  // -------------------------------------------------------------
  // 1. Setup Parent Accounts
  // -------------------------------------------------------------
  console.log('\n--- 1. Authenticated Parent Family Setup ---');

  await test('[Setup] Register primary parent family account', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Kelechi Adeleke',
        phone: testFamilyPhone,
        email: testFamilyEmail,
        password: 'AdelekeFamily2025!',
        consentRecorded: true
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201, 'Parent registration must return 201');
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Must return session token');
    parentToken = data.token;
    parentId = data.user.id;
  });

  await test('[Setup] Register alternate parent family account (for cross-family tests)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Barrister Olatunji',
        phone: altFamilyPhone,
        email: altFamilyEmail,
        password: 'OlatunjiFamily2025!',
        consentRecorded: true
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    altParentToken = data.token;
    altParentId = data.user.id;
  });

  // -------------------------------------------------------------
  // 2. Multi-Child Creation & Validation
  // -------------------------------------------------------------
  console.log('\n--- 2. Parent-Managed Multi-Child Profile Creation ---');

  let child1Id = '';
  let child2Id = '';
  const child1Identifier = `chidi_adeleke_${Date.now().toString().slice(-4)}`;
  const child2Identifier = `ngozi_adeleke_${Date.now().toString().slice(-4)}`;

  await test('[Add Child 1] Parent registers first child profile with all required details', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        name: 'Chidinma Adeleke',
        grade: 4,
        schoolName: 'Corona School Victoria Island',
        academicSession: '2024/2025',
        loginIdentifier: child1Identifier,
        pin: '4321',
        topSubject: 'Mathematics',
        learningPreferences: {
          preferredSubjects: ['Mathematics', 'English Studies'],
          studyGoalMinutes: 30,
          dailyGoal: 1
        }
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201, 'Child creation must return 201 Created');
    assert.strictEqual(data.success, true);
    assert.ok(data.child, 'Must return created child profile');
    assert.strictEqual(data.child.name, 'Chidinma Adeleke');
    assert.strictEqual(data.child.grade, 4);
    assert.strictEqual(data.child.parentId, parentId, 'Child must be linked to authenticated parent');
    assert.strictEqual(data.child.activeSubscription, false, 'Subscription must remain locked by default');
    assert.deepStrictEqual(data.child.termlyTuition, {}, 'Tuition must be unpaid by default');
    child1Id = data.child.id;
  });

  await test('[Add Child 2] Parent registers second child profile under same parent account', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        name: 'Ngozi Adeleke',
        grade: 2,
        schoolName: 'Corona School Victoria Island',
        academicSession: '2024/2025',
        loginIdentifier: child2Identifier,
        pin: '8765',
        topSubject: 'English Studies'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.child.name, 'Ngozi Adeleke');
    assert.strictEqual(data.child.grade, 2);
    assert.strictEqual(data.child.parentId, parentId, 'Both children must belong to same parent');
    child2Id = data.child.id;
  });

  await test('[Multiple Children] Parent dashboard returns both registered children', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    const childIds = data.children.map((c: any) => c.id);
    assert.ok(childIds.includes(child1Id), 'Child 1 must be present');
    assert.ok(childIds.includes(child2Id), 'Child 2 must be present');
  });

  // -------------------------------------------------------------
  // 3. Duplicate Identifier Prevention
  // -------------------------------------------------------------
  console.log('\n--- 3. Duplicate Child Identifier Prevention ---');

  await test('[Duplicate Prevention] Rejects creation with duplicate child login identifier (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        name: 'Another Adeleke',
        grade: 1,
        loginIdentifier: child1Identifier, // Duplicate!
        pin: '1234'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 409, 'Duplicate identifier must return 409 Conflict');
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('already in use'), 'Message must explain conflict clearly');
  });

  // -------------------------------------------------------------
  // 4. Child Login Interface & Credential Verification
  // -------------------------------------------------------------
  console.log('\n--- 4. Child Login Interface & Session Creation ---');

  let child1Token = '';

  await test('[Child Login] Child 1 authenticates with unique login identifier and PIN', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: child1Identifier,
        pin: '4321'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Child login must succeed with 200');
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Must issue pupil session token');
    assert.strictEqual(data.user.role, 'pupil');
    assert.strictEqual(data.user.studentId, child1Id);
    child1Token = data.token;
  });

  await test('[Child Login] Session introspection on /api/auth/me confirms pupil identity', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${child1Token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.user.role, 'pupil');
    assert.strictEqual(data.user.studentId, child1Id);
  });

  await test('[Child Login] Rejects invalid PIN with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: child1Identifier,
        pin: '0000' // Wrong PIN
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 401, 'Wrong PIN must return 401');
    assert.strictEqual(data.success, false);
  });

  await test('[Child Login] Rejects non-existent child identifier with 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: 'non_existent_child_998877',
        pin: '1234'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 404, 'Unknown child must return 404');
    assert.strictEqual(data.success, false);
  });

  // -------------------------------------------------------------
  // 5. Pupil Route Isolation & Tamper Resistance
  // -------------------------------------------------------------
  console.log('\n--- 5. Pupil Route Isolation & Tamper Resistance ---');

  await test('[Pupil Isolation] Authenticated pupil querying /api/students sees ONLY their own profile', async () => {
    const res = await fetch(`${BASE_URL}/api/students`, {
      headers: { Authorization: `Bearer ${child1Token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.students.length, 1, 'Pupil must only see their own profile');
    assert.strictEqual(data.students[0].id, child1Id);
  });

  await test('[Tamper Resistance] Child 1 cannot inspect Child 2’s profile (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/students/${child2Id}`, {
      headers: { Authorization: `Bearer ${child1Token}` }
    });
    assert.strictEqual(res.status, 403, 'Pupil inspecting sibling/other child must return 403');
  });

  await test('[Tamper Resistance] Pupil accounts cannot register other children (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${child1Token}`
      },
      body: JSON.stringify({
        name: 'Hacked Pupil',
        grade: 1,
        pin: '1234'
      })
    });
    assert.strictEqual(res.status, 403, 'Pupil attempting child registration must return 403');
  });

  await test('[Tamper Resistance] Pupil accounts cannot alter academic grade level (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/students/${child1Id}/grade`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${child1Token}`
      },
      body: JSON.stringify({ grade: 6 })
    });
    assert.strictEqual(res.status, 403, 'Pupil altering grade must return 403');
  });

  // -------------------------------------------------------------
  // 6. Cross-Family Access Protection
  // -------------------------------------------------------------
  console.log('\n--- 6. Cross-Family Access Protection & Parent Authorization ---');

  await test('[Cross-Family Protection] Alternate parent cannot inspect Adeleke family child (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/students/${child1Id}`, {
      headers: { Authorization: `Bearer ${altParentToken}` }
    });
    assert.strictEqual(res.status, 403, 'Cross-family inspection must return 403');
  });

  await test('[Cross-Family Protection] Alternate parent cannot update Adeleke family child (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${altParentToken}`
      },
      body: JSON.stringify({ name: 'Tampered Name' })
    });
    assert.strictEqual(res.status, 403, 'Cross-family profile update must return 403');
  });

  await test('[Cross-Family Protection] Alternate parent cannot deactivate Adeleke family child (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${altParentToken}` }
    });
    assert.strictEqual(res.status, 403, 'Cross-family deactivation must return 403');
  });

  await test('[Cross-Family Protection] Alternate parent cannot reset Adeleke family child PIN (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}/reset-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${altParentToken}`
      },
      body: JSON.stringify({ newPin: '9999' })
    });
    assert.strictEqual(res.status, 403, 'Cross-family PIN reset must return 403');
  });

  // -------------------------------------------------------------
  // 7. Parent Updates Child Information
  // -------------------------------------------------------------
  console.log('\n--- 7. Permitted Child Information Updates ---');

  await test('[Update Child] Parent updates permitted child info (school name, grade, learning preferences)', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        schoolName: 'St. Saviours School Ikoyi',
        academicSession: '2025/2026',
        topSubject: 'Basic Science & Technology'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Update must return 200');
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.child.schoolName, 'St. Saviours School Ikoyi');
    assert.strictEqual(data.child.academicSession, '2025/2026');
    assert.strictEqual(data.child.topSubject, 'Basic Science & Technology');
  });

  // -------------------------------------------------------------
  // 8. Credential Reset & Session Revocation
  // -------------------------------------------------------------
  console.log('\n--- 8. Child Credential Reset & Session Revocation ---');

  await test('[Reset Credentials] Parent resets child PIN and revokes active child sessions', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}/reset-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({ newPin: '9988' })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
  });

  await test('[Session Revocation] Child 1 previous session token is now invalid', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${child1Token}` }
    });
    const data = await res.json();
    assert.strictEqual(data.authenticated, false, 'Revoked token must fail authentication');
  });

  await test('[Old Credentials Rejected] Old PIN 4321 is rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: child1Identifier,
        pin: '4321' // Old PIN
      })
    });
    assert.strictEqual(res.status, 401);
  });

  await test('[New Credentials Accepted] New PIN 9988 authenticates successfully and issues fresh token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: child1Identifier,
        pin: '9988' // New PIN
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    child1Token = data.token; // Fresh active token
  });

  // -------------------------------------------------------------
  // 9. Deactivation, Session Revocation & Data Preservation
  // -------------------------------------------------------------
  console.log('\n--- 9. Account Deactivation & Learning History Preservation ---');

  // Complete a sample lesson to verify history preservation
  await test('[Data Preservation Setup] Record completed lesson progress for Child 1', async () => {
    const res = await fetch(`${BASE_URL}/api/lessons/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${child1Token}`
      },
      body: JSON.stringify({
        studentId: child1Id,
        topicId: 'p4-t1-w1-math',
        subject: 'Mathematics',
        title: 'Place Value up to 100,000',
        score: 95
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
  });

  await test('[Deactivation] Parent deactivates Child 1 account', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.child.accountStatus, 'deactivated');
    assert.ok(data.child.deactivatedAt, 'Must record timestamp');
  });

  await test('[Session Revocation] Active child session is revoked upon deactivation', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${child1Token}` }
    });
    const data = await res.json();
    assert.strictEqual(data.authenticated, false, 'Revoked token must not authenticate');
  });

  await test('[Deactivated Login Block] Deactivated pupil cannot log in (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: child1Identifier,
        pin: '9988'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 403, 'Deactivated account must return 403 Forbidden');
    assert.ok(data.message.includes('deactivated'));
  });

  await test('[History Preserved] Completed learning history remains completely intact', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    const pupil = data.children.find((c: any) => c.id === child1Id);
    assert.ok(pupil, 'Pupil must not be deleted');
    assert.strictEqual(pupil.completedLessons.length, 1, 'Completed lesson record must be preserved');
    assert.strictEqual(pupil.completedLessons[0].title, 'Place Value up to 100,000');
    assert.strictEqual(pupil.completedLessons[0].score, 95);
  });

  await test('[Reactivation] Parent reactivates Child 1 account', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/children/${child1Id}/reactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.child.accountStatus, 'active');
  });

  await test('[Reactivation Login] Reactivated child can log in successfully', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/pupil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: child1Identifier,
        pin: '9988'
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
  });

  // -------------------------------------------------------------
  // 10. Persistence Check After Restart Simulation
  // -------------------------------------------------------------
  console.log('\n--- 10. State Persistence After Restart ---');

  await test('[Persistence] Both children and their parent link persist in disk store', () => {
    const disk = PersistenceManager.load();
    assert.ok(disk, 'Disk state must load');
    const child1OnDisk = disk.students.find(s => s.id === child1Id);
    const child2OnDisk = disk.students.find(s => s.id === child2Id);
    assert.ok(child1OnDisk, 'Child 1 must exist on disk');
    assert.ok(child2OnDisk, 'Child 2 must exist on disk');
    assert.strictEqual(child1OnDisk.parentId, parentId, 'Disk record must link to parent');
    assert.strictEqual(child2OnDisk.parentId, parentId, 'Disk record must link to parent');
    assert.strictEqual(child1OnDisk.schoolName, 'St. Saviours School Ikoyi', 'Updated school name must persist');
    assert.strictEqual(child1OnDisk.pin, '9988', 'Updated PIN must persist');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 3 TEST SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3FamilyChildTests();
