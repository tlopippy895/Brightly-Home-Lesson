import assert from 'node:assert';
import http from 'node:http';
import { db, normalizeNigerianPhone, isValidNigerianPhone } from '../server/db';
import { PersistenceManager } from '../server/persistence';

const BASE_URL = 'http://localhost:3000';

async function runParentAuthPhase2Tests() {
  console.log('\n================================================================');
  console.log('  BRIGHTLY HOME LESSON — PHASE 2: PARENT AUTH & LANDING AUDIT');
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

  // -------------------------------------------------------------
  // 1. Phone Normalization & Validation Unit Tests
  // -------------------------------------------------------------
  console.log('\n--- 1. Nigerian Phone Normalization & Validation ---');

  await test('[Phone Validation] Accepts valid standard 11-digit local format (08031234567)', () => {
    assert.strictEqual(isValidNigerianPhone('08031234567'), true);
    assert.strictEqual(normalizeNigerianPhone('08031234567'), '08031234567');
  });

  await test('[Phone Validation] Accepts international +234 format and normalizes (+234 803 123 4567)', () => {
    assert.strictEqual(isValidNigerianPhone('+234 803 123 4567'), true);
    assert.strictEqual(normalizeNigerianPhone('+234 803 123 4567'), '08031234567');
  });

  await test('[Phone Validation] Rejects invalid short or non-Nigerian phone numbers', () => {
    assert.strictEqual(isValidNigerianPhone('12345'), false);
    assert.strictEqual(isValidNigerianPhone('01234567890'), false);
    assert.strictEqual(isValidNigerianPhone('abcdefghijk'), false);
  });

  // -------------------------------------------------------------
  // 2. Parent Registration Input Validation & Server Checks
  // -------------------------------------------------------------
  console.log('\n--- 2. Parent Registration Validation ---');

  await test('[Registration Validation] Rejects registration with missing or single-char name', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        phone: '08031234567',
        password: 'SecurePass123!',
        consentRecorded: true
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Full parent name is required'));
  });

  await test('[Registration Validation] Rejects registration with invalid phone number', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Babatunde Adeleke',
        phone: '080123',
        password: 'SecurePass123!',
        consentRecorded: true
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('valid 11-digit Nigerian mobile'));
  });

  await test('[Registration Validation] Rejects registration when parental consent is false or omitted', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Babatunde Adeleke',
        phone: '08039876543',
        password: 'SecurePass123!',
        consentRecorded: false
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('consent'));
  });

  await test('[Registration Validation] Rejects registration with short password (< 6 chars)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Babatunde Adeleke',
        phone: '08039876543',
        password: '123',
        consentRecorded: true
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('at least 6 characters'));
  });

  // -------------------------------------------------------------
  // 3. Successful Parent Registration & Duplicate Prevention
  // -------------------------------------------------------------
  console.log('\n--- 3. Persistent Registration & Duplicate Prevention ---');

  const testParentPhone = `0809${Math.floor(1000000 + Math.random() * 8999999)}`;
  const testParentEmail = `adeleke.family.${Date.now()}.${Math.floor(Math.random() * 1000)}@brightly.ng`;
  const testParentPassword = 'BrightlySecret#2026';
  let createdParentToken = '';
  let createdParentId = '';

  await test('[Registration Success] Successfully creates persistent parent account with PBKDF2 hash & session token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mrs. Ngozi Adeleke',
        phone: testParentPhone,
        email: testParentEmail,
        password: testParentPassword,
        pin: '5678',
        consentRecorded: true
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Must return session token');
    assert.strictEqual(data.user.role, 'parent');
    assert.strictEqual(data.parent.name, 'Mrs. Ngozi Adeleke');
    assert.strictEqual(data.parent.phone, testParentPhone);
    assert.strictEqual(data.parent.passwordHash, undefined, 'Must not expose passwordHash to client');
    assert.strictEqual(data.parent.salt, undefined, 'Must not expose salt to client');
    createdParentToken = data.token;
    createdParentId = data.parent.id;
  });

  await test('[Duplicate Prevention] Rejects duplicate registration with identical phone number (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Parent',
        phone: `+234 ${testParentPhone.slice(1, 4)} ${testParentPhone.slice(4, 7)} ${testParentPhone.slice(7)}`, // Alternate formatting of same phone
        email: `another.${Date.now()}.${Math.floor(Math.random() * 1000)}@example.com`,
        password: 'AnotherPassword#2026',
        consentRecorded: true
      })
    });
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('already registered'));
  });

  await test('[Duplicate Prevention] Rejects duplicate registration with identical email (409 Conflict)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Parent',
        phone: `0808${Math.floor(1000000 + Math.random() * 8999999)}`,
        email: testParentEmail, // same email
        password: 'AnotherPassword#2026',
        consentRecorded: true
      })
    });
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('already registered'));
  });

  // -------------------------------------------------------------
  // 4. Parent Authentication & Multi-Identifier Login
  // -------------------------------------------------------------
  console.log('\n--- 4. Parent Login with Phone, Email & Credentials ---');

  await test('[Parent Login] Authenticates successfully with registered Nigerian mobile number and password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        password: testParentPassword
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.id, createdParentId);
  });

  await test('[Parent Login] Authenticates successfully with registered email and password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentEmail,
        password: testParentPassword
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
  });

  await test('[Parent Login] Authenticates successfully with 4-digit PIN for quick access', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        pin: '5678'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await test('[Parent Login] Rejects incorrect password with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        password: 'WrongPassword123'
      })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Invalid parent credentials'));
  });

  await test('[Parent Login] Rejects non-existent parent identifier with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '08099990000',
        password: 'AnyPassword123'
      })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('Invalid parent credentials'));
  });

  // -------------------------------------------------------------
  // 5. Forgot Password & Account Recovery
  // -------------------------------------------------------------
  console.log('\n--- 5. Forgot Password & Credential Recovery ---');

  await test('[Forgot Password] Rejects unknown identifier with 404 Not Found', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '08099990000'
      })
    });
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.message.includes('No parent account found'));
  });

  await test('[Forgot Password] Verifies existing parent account without exposing secrets', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.verified, true);
    assert.strictEqual(data.parentName, 'Mrs. Ngozi Adeleke');
  });

  const testNewPassword = 'NewlyUpdatedPassword#2026';
  await test('[Forgot Password] Resets password with PBKDF2 hash, revokes old sessions, and issues fresh session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        newPassword: testNewPassword,
        confirmPassword: testNewPassword
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Must issue fresh session token');
  });

  await test('[Forgot Password] Old password is no longer valid; new password authenticates successfully', async () => {
    // Old password fails
    const resOld = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        password: testParentPassword
      })
    });
    assert.strictEqual(resOld.status, 401);

    // New password succeeds
    const resNew = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        password: testNewPassword
      })
    });
    assert.strictEqual(resNew.status, 200);
    const data = await resNew.json();
    assert.strictEqual(data.success, true);
  });

  // -------------------------------------------------------------
  // 6. Session Lifecycle: Introspection, Revocation & Logout
  // -------------------------------------------------------------
  console.log('\n--- 6. Session Lifecycle & Logout ---');

  let activeSessionToken = '';
  await test('[Session Lifecycle] Authenticates and validates session via /api/auth/me', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login/parent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testParentPhone,
        password: testNewPassword
      })
    });
    const loginData = await loginRes.json();
    activeSessionToken = loginData.token;

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${activeSessionToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.authenticated, true);
    assert.strictEqual(meData.user.id, createdParentId);
  });

  await test('[Session Lifecycle] Logout revokes session token immediately', async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeSessionToken}` }
    });
    assert.strictEqual(logoutRes.status, 200);
    const logoutData = await logoutRes.json();
    assert.strictEqual(logoutData.success, true);

    // Subsequent call with same token is unauthenticated
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${activeSessionToken}` }
    });
    const meData = await meRes.json();
    assert.strictEqual(meData.authenticated, false);
  });

  // -------------------------------------------------------------
  // 7. Protected Route Enforcement & Data Isolation
  // -------------------------------------------------------------
  console.log('\n--- 7. Protected Routes & Multi-Parent Isolation ---');

  await test('[Route Protection] Unauthenticated access to /api/parent/account returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/parent/account`);
    assert.strictEqual(res.status, 401);
  });

  await test('[Route Protection] Unauthenticated access to /api/wallet returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/wallet`);
    assert.strictEqual(res.status, 401);
  });

  // -------------------------------------------------------------
  // 8. Disk Persistence & State Integrity
  // -------------------------------------------------------------
  console.log('\n--- 8. Disk Persistence Integrity ---');

  await test('[Persistence] Newly registered parent is present in disk store', () => {
    const diskData = PersistenceManager.load();
    assert.ok(diskData, 'Disk data must load');
    const parentOnDisk = diskData.parents.find(p => p.phone === testParentPhone);
    assert.ok(parentOnDisk, 'Parent must be present in disk store');
    assert.strictEqual(parentOnDisk.name, 'Mrs. Ngozi Adeleke');
    assert.strictEqual(parentOnDisk.phone, testParentPhone);
    assert.ok(parentOnDisk.passwordHash, 'Must have persistent PBKDF2 hash');
  });

  console.log('\n================================================================');
  console.log(`  PHASE 2 PARENT AUTH SUMMARY: ${passed}/${passed + failed} PASSED (${failed} failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runParentAuthPhase2Tests();
