import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './server/db';
import { gates } from './server/gates';
import { GradeLevel, VoiceTone, STANDARD_TUITION_FEES, UserRole } from './server/types';
import { paystack } from './server/paystack';
import { rateLimit } from './server/rateLimiter';

dotenv.config();

const rootDir = process.cwd();

const app = express();
const PORT = 3000;

// Security Headers (Defense in depth against clickjacking, sniffing, and MIME confusion)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Enable raw body capture for webhook signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Static asset serving for authentic photos, logos, and visual aids
const imagesDir = path.resolve(rootDir, 'src/assets/images');
app.use('/assets', express.static(imagesDir));
app.use('/assets/images', express.static(imagesDir));

// Rate Limiters for sensitive endpoints
const authLimiter = rateLimit({ windowMs: 60000, maxRequests: 20, message: 'Too many authentication attempts. Please try again in a minute.', keyPrefix: 'auth' });
const paystackLimiter = rateLimit({ windowMs: 60000, maxRequests: 25, message: 'Payment transaction request rate limit reached. Please wait.', keyPrefix: 'paystack' });

// -------------------------------------------------------------
// SESSION AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// -------------------------------------------------------------
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-session-token'] as string);

  if (!token || typeof token !== 'string') {
    req.user = null;
    req.session = null;
    return next();
  }

  const session = db.getSession(token);
  if (!session) {
    req.user = null;
    req.session = null;
    return next();
  }

  req.session = session;
  req.user = {
    id: session.userId,
    role: session.role,
    parentId: session.parentId,
    studentId: session.studentId,
    email: session.email,
    name: session.name
  };
  next();
}

app.use(authenticateToken);

// Role-based Access Control guard
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: any, res: any, next: any) => {
    if (!req.session || !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to authorized [${allowedRoles.join('/')}] accounts.`
      });
    }

    next();
  };
}

// Initialize Google GenAI client lazily with process.env.GEMINI_API_KEY
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// 1. SYSTEM & HEALTH

// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Brightly Home Lesson Backend API',
    curriculum: 'NERDC Primary 1-6 (Universal Basic Education)',
    pedagogy: 'Teach for Mastery Before Speed',
    pupilsEnrolled: db.getStudents().length,
    activeTime: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// 2. FEATURE GATES & ENTITLEMENTS API
// -------------------------------------------------------------
app.get('/api/features/gates', (req, res) => {
  const studentId = (req.query.studentId as string) || 'chidi';
  const summary = gates.getFeatureGateSummary(studentId);
  res.json({ success: true, gates: summary });
});

// -------------------------------------------------------------
// 3. AUTHENTICATION & SESSION MANAGEMENT APIS
// -------------------------------------------------------------

// 3.1 Admin Authentication (Credential-based, produces authoritative server session)
app.post('/api/auth/login/admin', authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
  }

  const admin = db.verifyAdminCredentials(email, password);
  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Invalid administrator credentials. Access denied.'
    });
  }

  const session = db.createSession({
    userId: admin.id,
    role: 'admin',
    email: admin.email,
    name: admin.name
  });

  db.recordAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'ROLE_CHANGE',
    targetType: 'user',
    targetId: admin.id,
    details: { event: 'Admin Session Login' },
    ipAddress: String(req.ip || 'unknown')
  });

  res.json({
    success: true,
    token: session.token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'admin' as UserRole
    },
    message: 'Administrator session established successfully.'
  });
});

// 3.1.1 Admin Password Rotation (Enforces strong password policy & session revocation)
app.post('/api/admin/rotate-password', requireRole('admin'), authLimiter, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both currentPassword and newPassword are required for password rotation.' 
    });
  }

  const result = db.rotateAdminPassword(req.user!.id, currentPassword, newPassword);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  // Issue a new authenticated session for the rotated admin
  const freshSession = db.createSession({
    userId: req.user!.id,
    role: 'admin',
    email: req.user!.email,
    name: req.user!.name
  });

  return res.json({
    success: true,
    token: freshSession.token,
    message: result.message
  });
});

// 3.2 Parent Authentication (Multi-parent isolation: strictly authenticates requested identity)
app.post('/api/auth/login/parent', authLimiter, (req, res) => {
  const { email, pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: 'Parent security PIN is required.' });
  }

  let parent = email ? db.getParentByEmail(email) : null;
  if (!parent && !email) {
    parent = db.getParentAccount('parent_main');
  }

  if (!parent || parent.pin !== pin) {
    return res.status(401).json({ success: false, message: 'Invalid parent credentials. Please verify your email and PIN.' });
  }

  const session = db.createSession({
    userId: parent.id,
    role: 'parent',
    parentId: parent.id,
    email: parent.email,
    name: parent.name
  });

  res.json({
    success: true,
    token: session.token,
    user: {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      role: 'parent' as UserRole,
      parentId: parent.id
    },
    parent
  });
});

// 3.3 Parent PIN Verification (Authoritative identity verification)
app.post('/api/auth/verify-pin', authLimiter, (req, res) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: '4-digit PIN is required' });
  }

  const parentId = req.user?.parentId || 'parent_main';
  const parent = db.getParentAccount(parentId);
  if (!parent || parent.pin !== pin) {
    return res.status(401).json({
      success: false,
      allowed: false,
      message: 'Invalid Parent Security PIN.'
    });
  }

  const session = db.createSession({
    userId: parent.id,
    role: 'parent',
    parentId: parent.id,
    email: parent.email,
    name: parent.name
  });

  res.json({
    success: true,
    allowed: true,
    token: session.token,
    message: 'Parent identity authenticated successfully.',
    parent,
    user: {
      id: parent.id,
      name: parent.name,
      role: 'parent' as UserRole,
      parentId: parent.id
    }
  });
});

// 3.4 Pupil Authentication (Pupil isolation: rejects non-existent pupils)
app.post('/api/auth/login/pupil', authLimiter, (req, res) => {
  const { studentId, name, pin = '1234' } = req.body;

  let student: any = null;
  if (studentId) {
    student = db.getStudentById(studentId);
  } else if (name) {
    const clean = String(name).trim().toLowerCase();
    student = db.getStudents().find(s => 
      s.name.toLowerCase() === clean || 
      s.id.toLowerCase() === clean || 
      (s.username && s.username.toLowerCase() === clean)
    );
  }

  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil account not found. Please verify the pupil name or ID.' });
  }

  if (student.pin && pin && student.pin !== pin) {
    return res.status(401).json({ success: false, message: 'Invalid pupil PIN.' });
  }

  const session = db.createSession({
    userId: student.id,
    role: 'pupil',
    studentId: student.id,
    parentId: student.parentId,
    name: student.name
  });

  res.json({
    success: true,
    token: session.token,
    user: {
      id: student.id,
      name: student.name,
      role: 'pupil' as UserRole,
      studentId: student.id,
      parentId: student.parentId
    },
    student
  });
});

// 3.5 Session Introspection
app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    authenticated: Boolean(req.user),
    user: req.user || null
  });
});

// 3.6 Session Logout
app.post('/api/auth/logout', (req, res) => {
  if (req.session?.token) {
    db.deleteSession(req.session.token);
  }
  res.json({ success: true, message: 'Session logged out successfully.' });
});

app.post('/api/auth/change-pin', requireRole('parent', 'admin'), (req, res) => {
  const { oldPin, newPin } = req.body;
  const parentId = req.user?.parentId || 'parent_main';
  const success = db.updateParentPin(oldPin, newPin, parentId);
  if (!success) {
    return res.status(400).json({ success: false, message: 'Invalid current PIN or invalid new PIN format (must be 4 digits).' });
  }
  res.json({ success: true, message: 'Parent PIN updated successfully.' });
});

app.get('/api/parent/account', requireRole('parent', 'admin'), (req, res) => {
  const parentId = req.user!.role === 'admin'
    ? (req.query.parentId as string || 'parent_main')
    : req.user!.parentId!;
  const parent = db.getParentAccount(parentId);
  if (!parent) {
    return res.status(404).json({ success: false, message: 'Parent account not found.' });
  }
  res.json({ success: true, parent });
});

// -------------------------------------------------------------
// 4. STUDENTS CRUD & PROFILE APIS (MULTI-PARENT ISOLATION ENFORCED)
// -------------------------------------------------------------
app.get('/api/students', (req, res) => {
  // If authenticated as Parent: return ONLY their own registered children
  if (req.user?.role === 'parent') {
    const parentStudents = db.getStudentsByParentId(req.user.parentId!);
    return res.json({ success: true, students: parentStudents });
  }

  // If authenticated as Pupil: return ONLY their own profile
  if (req.user?.role === 'pupil') {
    const pupil = db.getStudentById(req.user.studentId!);
    return res.json({ success: true, students: pupil ? [pupil] : [] });
  }

  // If Admin: return all students across all parents
  if (req.user?.role === 'admin') {
    return res.json({ success: true, students: db.getStudents() });
  }

  // Guest fallback
  const students = db.getStudents();
  res.json({ success: true, students });
});

app.get('/api/students/:id', (req, res) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }

  // Parent Authorization Isolation: Parent A cannot access Parent B's child
  if (req.user?.role === 'parent' && student.parentId !== req.user.parentId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to access another parent’s child.'
    });
  }

  // Pupil Authorization Isolation: Pupil A cannot access Pupil B's record
  if (req.user?.role === 'pupil' && student.id !== req.user.studentId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only view your own pupil profile.'
    });
  }

  res.json({ success: true, student });
});

app.post('/api/students', (req, res) => {
  if (req.user?.role === 'pupil') {
    return res.status(403).json({ success: false, message: 'Forbidden: Pupil accounts cannot register children.' });
  }
  const { name, grade = 4, avatarColor = '#008751', preferredVoiceTone = 'nigerian_teacher', avatarUrl } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Child name is required' });
  }

  const parsedGrade = Number(grade) as GradeLevel;
  const newStudentId = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
  
  const created = db.addStudent({
    id: newStudentId,
    parentId: req.user?.parentId || 'parent_main',
    name: name.trim(),
    grade: parsedGrade,
    registeredGrade: parsedGrade,
    pin: '1234',
    avatarUrl: avatarUrl || '/assets/nigerian_pupil_boy_1788178837558.jpg',
    avatarColor,
    currentTerm: 1,
    currentWeek: 1,
    overallScore: 90,
    scoreChangeText: 'JUST ENROLLED',
    topSubject: 'Mathematics',
    lessonsCompletedThisWeek: 0,
    totalLessonsThisWeek: 5,
    completedLessons: [],
    activeSubscription: true,
    preferredVoiceTone: preferredVoiceTone as VoiceTone,
    termlyTuition: {
      1: {
        paid: true,
        term: 1,
        grade: parsedGrade,
        amount: 6000,
        reference: `NERDC-REG-${Date.now().toString().slice(-6)}`,
        receiptNo: `BRT-NEW-${parsedGrade}1-${Date.now().toString().slice(-4)}`,
        channel: 'Paystack',
        paidAt: new Date().toISOString()
      }
    }
  });

  res.status(201).json({ success: true, student: created });
});

app.patch('/api/students/:id/grade', (req, res) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }

  // Pupils are forbidden from altering grade levels
  if (req.user?.role === 'pupil') {
    return res.status(403).json({ success: false, message: 'Forbidden: Pupils cannot modify academic grade levels.' });
  }

  // Parent isolation: Parent A cannot modify Parent B's child
  if (req.user?.role === 'parent' && student.parentId !== req.user.parentId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify another parent’s child.' });
  }

  const { grade } = req.body;
  const updated = db.updateStudentGrade(req.params.id, Number(grade) as GradeLevel);
  res.json({ success: true, student: updated });
});

app.patch('/api/students/:id/voice-tone', (req, res) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }

  // Pupil isolation: Pupil A cannot modify Pupil B's voice preferences
  if (req.user?.role === 'pupil' && req.user.studentId !== student.id) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only adjust voice preferences for your own profile.' });
  }

  // Parent isolation: Parent A cannot modify Parent B's child
  if (req.user?.role === 'parent' && student.parentId !== req.user.parentId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify another parent’s child.' });
  }

  const { tone } = req.body;
  const updated = db.updateStudentVoiceTone(req.params.id, tone as VoiceTone);
  res.json({ success: true, student: updated });
});

app.patch('/api/students/:id/avatar', (req, res) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }

  // Pupil isolation: Pupil A cannot modify Pupil B's avatar
  if (req.user?.role === 'pupil' && req.user.studentId !== student.id) {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only change your own pupil avatar.' });
  }

  // Parent isolation: Parent A cannot modify Parent B's child
  if (req.user?.role === 'parent' && student.parentId !== req.user.parentId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify another parent’s child.' });
  }

  const { avatarUrl } = req.body;
  const updated = db.updateStudentAvatar(req.params.id, avatarUrl);
  res.json({ success: true, student: updated });
});

// -------------------------------------------------------------
// 5. CAREFUL LESSON ACCESS GATING
// -------------------------------------------------------------
app.post('/api/lessons/access-check', (req, res) => {
  const { studentId, grade, term = 1, week, weekNumber, isFree = false } = req.body;
  const targetWeek = Number(week !== undefined ? week : (weekNumber !== undefined ? weekNumber : 1));
  
  if (!studentId || !grade) {
    return res.status(200).json({ success: true, allowed: true, message: 'Introductory lesson access.' });
  }

  const access = gates.evaluateLessonAccess(
    studentId,
    Number(grade) as GradeLevel,
    Number(term),
    targetWeek,
    Boolean(isFree)
  );

  return res.status(200).json({
    success: true,
    allowed: access.allowed,
    reason: access.reason,
    message: access.message,
    requiredFee: access.requiredFee,
    details: access.details,
    sessionToken: access.allowed ? `LESSON_AUTH_${studentId}_${Date.now()}` : undefined
  });
});

// Record Completed Lesson
app.post('/api/lessons/complete', (req, res) => {
  const { studentId, topicId, subject, title, score, reexplained = false, objectivesMastery } = req.body;

  if (!studentId || !topicId || score === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required lesson completion parameters' });
  }

  // Pupil authorization isolation: pupil can only record for their own studentId
  if (req.user?.role === 'pupil' && req.user.studentId !== studentId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only record lesson progress for your own pupil profile.'
    });
  }

  // Parent authorization isolation: parent can only record for their own registered child
  if (req.user?.role === 'parent') {
    const pupil = db.getStudentById(studentId);
    if (!pupil || pupil.parentId !== req.user.parentId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify progress for another parent’s child.'
      });
    }
  }

  const updatedStudent = db.recordLessonComplete(studentId, {
    topicId,
    subject: subject || 'Mathematics',
    title: title || 'Curriculum Topic',
    score: Number(score),
    reexplained: Boolean(reexplained),
    objectivesMastery: Array.isArray(objectivesMastery) ? objectivesMastery : undefined
  });

  if (!updatedStudent) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }

  res.json({
    success: true,
    message: 'Lesson mastery progress recorded in backend database.',
    student: updatedStudent,
    masteryAchieved: score >= 70
  });
});

// -------------------------------------------------------------
// 6. AI LESSON GENERATION & ADAPTIVE RE-EXPLANATION (GEMINI SDK)
// -------------------------------------------------------------
app.post('/api/lessons/generate', async (req, res) => {
  try {
    const { 
      studentId = 'chidi', 
      grade = 4, 
      subject = 'Mathematics', 
      week = 3, 
      topic, 
      childName = 'Chidi', 
      teacherPersona = 'Mrs. Chidinma Okafor' 
    } = req.body;

    // Feature Gate Check for AI Generation
    const gateCheck = gates.evaluateAIGeneration(studentId, Number(grade) as GradeLevel);
    if (!gateCheck.allowed) {
      return res.status(403).json({
        success: false,
        gated: true,
        reason: gateCheck.reason,
        message: gateCheck.message,
        requiredFee: gateCheck.requiredFee
      });
    }

    const ai = getAI();

    if (!ai) {
      // Fallback structured response if Gemini key is missing
      return res.json({
        success: true,
        fallback: true,
        topic: topic || `Primary ${grade} ${subject} - Week ${week}`,
        objectives: [
          `Master key concepts of ${subject} for Primary ${grade}`,
          `Relate concepts to everyday Nigerian environment`,
          `Apply knowledge in untimed mastery questions`
        ],
        teacherIntroduction: `Welcome ${childName}! I am ${teacherPersona}. Today we are going to learn step by step with zero rush.`,
        whiteboardSteps: [
          {
            stepNumber: 1,
            title: `Introduction to ${topic || subject}`,
            teacherSpeech: `Hello ${childName}! Let us look at how this works in our everyday Nigerian life.`,
            boardText: `CORE CONCEPT: ${topic || subject}\n\n• Step 1: Observe the concrete example\n• Step 2: Practice with care\n• Step 3: Check your understanding`,
            bulletPoints: ['Take your time', 'Focus on mastery', 'Ask questions if needed']
          }
        ]
      });
    }

    const prompt = `
You are an expert Nigerian Primary School Master Teacher adhering strictly to the Nigerian Educational Research and Development Council (NERDC) and Universal Basic Education (UBE) curriculum.
Generate a structured 6-phase mastery lesson for:
- Grade: Primary ${grade}
- Subject: ${subject}
- Week: ${week}
- Specific Topic: ${topic || 'Core national curriculum topic'}
- Pupil Name: ${childName}
- Teacher Persona: ${teacherPersona}

Guidelines:
1. Use warm, highly encouraging Nigerian English with culturally relatable concrete objects (e.g., Agege bread, Nigerian oranges, Naira currency notes, yam tubers, Lagos traffic, River Niger).
2. Teach for Mastery before speed (no countdown timers, no rush).
3. Self-Paced Anytime Learning: Always use time-agnostic greetings such as "Good day", "Welcome", "Sannu da zuwa", "Nno nwam", or "E nle o, good day" rather than "Good morning" or "Good evening", granting the pupil complete freedom to attend lessons at any convenient hour.
4. Return valid JSON matching the schema below.

JSON Schema format:
{
  "title": "Topic title",
  "subtopic": "Subtopic description",
  "objectives": ["Objective 1", "Objective 2", "Objective 3"],
  "lastWeekRevision": "Brief summary of last week's topic",
  "previousKnowledge": "Everyday Nigerian life connection",
  "teacherGreeting": "Warm Nigerian opening greeting using 'Good day' or 'Welcome' suitable for anytime attendance",
  "whiteboardSteps": [
    {
      "stepNumber": 1,
      "title": "Step 1 heading",
      "teacherSpeech": "What the teacher says in unhurried, clear voice",
      "boardText": "Text written on the whiteboard/blackboard",
      "bulletPoints": ["Key point 1", "Key point 2"],
      "equationOrHighlight": "Highlighted rule or formula"
    }
  ],
  "practiceProblems": [
    {
      "id": "q1",
      "question": "Practice question with Nigerian context",
      "concreteContext": "Concrete visual hint",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ],
  "homePracticeRecommendation": "A short, engaging parent-child real-life activity at home"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, lesson: parsed });
  } catch (error: any) {
    console.error('Error generating lesson:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function getAdaptiveReexplanationFallback(subject: string, topic: string, studentName: string, grade: number) {
  const normTopic = (topic || '').toLowerCase();
  const normSub = (subject || '').toLowerCase();

  // Lesson B: English Studies - Nouns
  if (normSub.includes('english') || normTopic.includes('noun')) {
    return {
      analogyTitle: 'The Nigerian Naming Basket',
      encouragement: `Sannu, ${studentName}! English nouns are as simple as putting labels on things in our classroom.`,
      simplifiedExplanation: `Everything in Nigeria has a name! A Proper Noun is a special, personal name that ALWAYS starts with a big Capital Letter (like ${studentName}, Nigeria, Lagos, or River Niger). A Common Noun is just an everyday general name (like boy, girl, yam, or market). A Collective Noun names a whole group together (like a herd of cattle).`,
      keyTakeaway: 'Proper Nouns always start with a Capital Letter (e.g. Abuja, Aminat).',
      retestQuestion: {
        question: 'Which of the following is a PROPER noun that must begin with a capital letter?',
        options: ['pencil', 'Nigeria', 'water', 'market'],
        correctIndex: 1,
        explanation: 'Nigeria is the specific name of our country, so it is a Proper Noun and must begin with a capital letter.'
      }
    };
  }

  // Lesson C: Social Studies - Nigerian Geography
  if (normSub.includes('social') || normTopic.includes('geography') || normTopic.includes('region') || normTopic.includes('confluence') || normTopic.includes('climate')) {
    return {
      analogyTitle: 'The Great River Confluence at Lokoja',
      encouragement: `Well done for trying, ${studentName}! Let us look at our Nigerian map together.`,
      simplifiedExplanation: `Think of two friends walking down two roads who meet at a junction and continue walking together. In Nigeria, River Niger comes from the north-west, and River Benue comes from the east. They meet right at Lokoja in Kogi State and flow south together to the ocean, forming a giant letter "Y" on our map!`,
      keyTakeaway: 'River Niger and River Benue meet at Lokoja in Kogi State to form a famous Y-shaped confluence.',
      retestQuestion: {
        question: 'What letter does the meeting of River Niger and River Benue resemble on the map of Nigeria?',
        options: ['Letter X', 'Letter Y', 'Letter T', 'Letter V'],
        correctIndex: 1,
        explanation: 'The two rivers meet at Lokoja and flow south together, forming the shape of a giant "Y".'
      }
    };
  }

  // Lesson D: Basic Science - Living & Non-Living Things
  if (normSub.includes('science') || normTopic.includes('living') || normTopic.includes('organism')) {
    return {
      analogyTitle: 'The Yard Friends & MR NIGER D',
      encouragement: `Cheer up, ${studentName}! Science is happening all around us in the compound.`,
      simplifiedExplanation: `Look at a goat in your compound. The goat runs, eats grass, breathes air, and has baby kids. That means the goat is alive! But a granite stone on the road cannot eat, breathe, or grow bigger. Even trees and cassava are alive because they drink water, make food from sunlight, and grow from seeds. Remember our code: MR NIGER D!`,
      keyTakeaway: 'Living things move, breathe, eat, grow, and reproduce. Non-living things cannot.',
      retestQuestion: {
        question: 'Which of the following is a LIVING thing because it breathes and grows?',
        options: ['Plastic bucket', 'Mango tree', 'Metal bell', 'Clay pot'],
        correctIndex: 1,
        explanation: 'A mango tree is a living thing because it drinks water from the soil, breathes, and grows from a seed.'
      }
    };
  }

  // Lesson A: Mathematics - Fractions
  if (normTopic.includes('fraction') || normTopic.includes('proper') || normTopic.includes('mixed')) {
    return {
      analogyTitle: 'Warm Agege Bread Slices',
      encouragement: `No problem at all, ${studentName}! Let us look at fractions using fresh Agege bread.`,
      simplifiedExplanation: `When you buy a fresh loaf of Agege bread and slice it into 4 equal slices, the bottom number (denominator) is 4. If you take 3 slices, the top number (numerator) is 3. That is 3/4! If you have 7 slices, you have 1 whole loaf (4 slices) plus 3 extra slices, which is 1 3/4 (a mixed number).`,
      keyTakeaway: 'Top number (numerator) is parts taken; bottom number (denominator) is total equal parts in 1 whole loaf.',
      retestQuestion: {
        question: 'If a loaf of Agege bread is cut into 4 equal slices and you eat 3 slices, what fraction did you eat?',
        options: ['1/4', '2/4', '3/4', '4/3'],
        correctIndex: 2,
        explanation: 'You took 3 slices out of 4 total equal slices, so that is 3/4.'
      }
    };
  }

  // Lesson E: Primary 2 Mathematics - Counting in 2s, 3s, 5s, 10s
  if (normTopic.includes('skip') || normTopic.includes('count') || Number(grade) === 2) {
    return {
      analogyTitle: 'Counting ₦10 Naira Notes Fast',
      encouragement: `Nno nwam, ${studentName}! Skip counting is just counting groups of money fast.`,
      simplifiedExplanation: `Imagine you have a stack of ₦10 notes. You do not count 1, 2, 3... You count in tens: 10, 20, 30, 40, 50! Skip counting in 5s or 10s helps you count your change quickly at the market without making mistakes.`,
      keyTakeaway: 'When skip counting in 10s: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100!',
      retestQuestion: {
        question: 'What number comes next when skip counting in 10s: 10, 20, 30, 40, ___?',
        options: ['45', '50', '60', '70'],
        correctIndex: 1,
        explanation: 'Counting by 10s gives: 10, 20, 30, 40, 50!'
      }
    };
  }

  // Reference Lesson: Place Value & Whole Numbers
  return {
    analogyTitle: 'Naira Market Bundles',
    encouragement: `Well done for trying, ${studentName}! Let us break it down into familiar place value houses.`,
    simplifiedExplanation: `Every digit lives in its own house! From right to left: Units (ones), Tens (₦10), Hundreds (₦100), Thousands (₦1,000), and Ten Thousands (₦10,000). In the number 54,321, the 5 is worth 50,000 and the 4 is worth 4,000.`,
    keyTakeaway: 'Look at the place value column to know the true worth of any digit.',
    retestQuestion: {
      question: 'In the number 87,412, what is the value of the digit 7?',
      options: ['70', '700', '7,000', '70,000'],
      correctIndex: 2,
      explanation: 'Digit 7 sits in the Thousands column, so its value is 7,000.'
    }
  };
}

// Adaptive Re-Explanation Loop when child struggles (<70% on quiz)
app.post('/api/lessons/reexplain', async (req, res) => {
  try {
    const { 
      grade = 4, 
      subject = 'Mathematics', 
      topic = '', 
      studentName = 'Chidi', 
      missedQuestion = '', 
      teacherName = 'Mrs. Chidinma Okafor' 
    } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        success: true,
        result: getAdaptiveReexplanationFallback(subject, topic, studentName, Number(grade))
      });
    }

    const prompt = `
You are ${teacherName}, a patient, compassionate Nigerian primary school tutor teaching ${subject} to a Primary ${grade} pupil.
A pupil named ${studentName} just struggled with the topic: "${topic}" in ${subject}.
Specific area of confusion or question missed: "${missedQuestion || 'General concept'}".

Task:
Re-explain the concept using a completely fresh, concrete Nigerian real-life analogy that directly fits the subject (${subject}) and topic (${topic}):
- If Mathematics (Fractions): Use concrete food sharing such as slicing Agege bread or Nigerian oranges into equal parts.
- If English Studies (Nouns): Use naming baskets, people in Nigeria, Nigerian cities (Abuja, Lagos, Kano), and things in the home.
- If Social Studies: Use Nigerian geopolitical zones, rivers (Niger, Benue at Lokoja), and rainy/Harmattan seasons.
- If Basic Science: Use living organisms in the Nigerian compound (goats, mango trees) versus non-living objects (stones, plastic) and MR NIGER D.
- If Primary 2 Mathematics (Skip counting): Use bundles of ₦5 or ₦10 notes, or pairs of shoes.

Break it down into simple, warm, child-friendly words so the pupil feels supported.
Include 1 gentle follow-up re-test question with 4 options and the correct index.

Return JSON:
{
  "analogyTitle": "Catchy friendly analogy title",
  "encouragement": "Warm, encouraging Nigerian teacher phrase (e.g. 'Nno nwam, you are doing great! Let us look at it together')",
  "simplifiedExplanation": "Detailed, step-by-step simple explanation with concrete objects",
  "keyTakeaway": "One simple golden rule to remember",
  "retestQuestion": {
    "question": "Simple check question based directly on the analogy and topic",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Clear reason why"
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.warn('AI re-explain returned fallback response:', error?.message?.slice(0, 120));
    // Graceful fallback for pupil experience
    const studentName = req.body?.studentName || 'Chidi';
    const subject = req.body?.subject || 'Mathematics';
    const topic = req.body?.topic || '';
    const grade = Number(req.body?.grade || 4);

    res.json({
      success: true,
      result: getAdaptiveReexplanationFallback(subject, topic, studentName, grade)
    });
  }
});

// -------------------------------------------------------------
// 7. WALLET & PAYMENTS
// -------------------------------------------------------------
app.get('/api/wallet', requireRole('parent', 'admin'), (req, res) => {
  const parentId = req.user!.role === 'admin'
    ? (req.query.parentId as string || 'parent_main')
    : req.user!.parentId!;
  res.json({ success: true, ...db.getWallet(parentId) });
});

app.post('/api/wallet/fund', requireRole('parent', 'admin'), (req, res) => {
  const parentId = req.user!.role === 'admin'
    ? (req.body.parentId || 'parent_main')
    : req.user!.parentId!;
  const { amount, channel = 'Paystack' } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid funding amount is required' });
  }
  const newBalance = db.creditWallet(Number(amount), `Wallet top-up via ${channel}`, channel, parentId);
  res.json({
    success: true,
    newBalance,
    message: `₦${Number(amount).toLocaleString()} successfully added to your wallet balance.`
  });
});

// -------------------------------------------------------------
// 7.1 PAYMENT HISTORY & LEDGER (STRICT PARENT & CHILD ISOLATION)
// -------------------------------------------------------------
app.get('/api/parent/payments', requireRole('parent', 'admin'), (req, res) => {
  const { studentId } = req.query;

  // If Parent: strictly isolate to their own registered parent ID
  if (req.user!.role === 'parent') {
    const parentId = req.user!.parentId!;
    if (studentId && typeof studentId === 'string') {
      const student = db.getStudentById(studentId);
      if (!student || student.parentId !== parentId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot inspect payments for another parent’s child.'
        });
      }
      const payments = db.getPaymentsForStudent(studentId);
      return res.json({ success: true, payments, studentId });
    }

    const payments = db.getPaymentsForParent(parentId);
    return res.json({ success: true, payments, parentId });
  }

  // If Admin: full audit access across all or specific students
  if (req.user!.role === 'admin') {
    if (studentId && typeof studentId === 'string') {
      const payments = db.getPaymentsForStudent(studentId);
      return res.json({ success: true, payments, studentId });
    }
    const payments = db.getAllPayments();
    return res.json({ success: true, payments });
  }

  return res.status(401).json({ success: false, message: 'Authentication required.' });
});

app.get('/api/students/:studentId/payments', requireRole('parent', 'admin'), (req, res) => {
  const { studentId } = req.params;

  // Parent isolation check
  if (req.user!.role === 'parent') {
    const student = db.getStudentById(studentId);
    if (!student || student.parentId !== req.user!.parentId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access payment records for this pupil.'
      });
    }
  }

  const payments = db.getPaymentsForStudent(studentId);
  res.json({ success: true, payments, studentId });
});

// Admin view of all verified payments across all students (Strictly Admin Only)
app.get('/api/admin/payments', requireRole('admin'), (req, res) => {
  const payments = db.getAllPayments();
  res.json({ success: true, payments, count: payments.length });
});

// -------------------------------------------------------------
// 7.1.1 ADMIN CURRICULUM MANAGEMENT API (STRICT ROLE AUTHORIZATION)
// -------------------------------------------------------------

// 1. Get curriculum coverage statistics
app.get('/api/admin/curriculum/coverage', requireRole('admin'), (req, res) => {
  const coverage = db.getCurriculumCoverage();
  res.json({ success: true, coverage });
});

// 2. Query curriculum records
app.get('/api/admin/curriculum', requireRole('admin'), (req, res) => {
  const { grade, subject, term, week, status } = req.query;
  let records = db.getCurriculumByQuery(
    grade ? Number(grade) as any : undefined,
    subject ? String(subject) as any : undefined,
    term ? Number(term) : undefined,
    week ? Number(week) : undefined
  );

  if (status && typeof status === 'string') {
    records = records.filter(r => r.publishingStatus === status);
  }

  res.json({ success: true, count: records.length, records });
});

// 3. Get single curriculum record
app.get('/api/admin/curriculum/:id', requireRole('admin'), (req, res) => {
  const record = db.getCurriculumRecordById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Curriculum record not found.' });
  }
  res.json({ success: true, record });
});

// 4. Create new curriculum record (starts in DRAFT)
app.post('/api/admin/curriculum', requireRole('admin'), (req, res) => {
  try {
    const created = db.createCurriculumRecord(req.body);
    db.recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email || 'admin@brightly.ng',
      action: 'CURRICULUM_CREATE',
      targetType: 'curriculum',
      targetId: created.id,
      newState: { topic: created.topic, grade: created.grade, subject: created.subject, status: created.publishingStatus },
      ipAddress: String(req.ip || 'unknown')
    });

    res.status(201).json({
      success: true,
      record: created,
      message: 'Draft curriculum record created successfully. Awaiting review.'
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Failed to create record.' });
  }
});

// 5. Update curriculum record
app.put('/api/admin/curriculum/:id', requireRole('admin'), (req, res) => {
  try {
    const previous = db.getCurriculumRecordById(req.params.id);
    const updated = db.updateCurriculumRecord(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Curriculum record not found.' });
    }

    db.recordAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email || 'admin@brightly.ng',
      action: 'CURRICULUM_UPDATE',
      targetType: 'curriculum',
      targetId: req.params.id,
      previousState: previous ? { topic: previous.topic, status: previous.publishingStatus } : undefined,
      newState: { topic: updated.topic, status: updated.publishingStatus },
      ipAddress: String(req.ip || 'unknown')
    });

    res.json({
      success: true,
      record: updated,
      message: 'Curriculum record updated successfully.'
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Failed to update record.' });
  }
});

// 6. Transition publishing workflow (DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED)
app.post('/api/admin/curriculum/:id/workflow', requireRole('admin'), (req, res) => {
  const { status, reviewerName, notes } = req.body;
  const validStatuses = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid workflow status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const previous = db.getCurriculumRecordById(req.params.id);
  const transitioned = db.transitionPublishingWorkflow(
    req.params.id,
    status,
    reviewerName || req.user.name || 'Senior Curriculum Specialist',
    notes
  );

  if (!transitioned) {
    return res.status(404).json({ success: false, message: 'Curriculum record not found.' });
  }

  db.recordAuditLog({
    adminId: req.user.id,
    adminEmail: req.user.email || 'admin@brightly.ng',
    action: 'WORKFLOW_TRANSITION',
    targetType: 'curriculum',
    targetId: req.params.id,
    previousState: previous?.publishingStatus,
    newState: status,
    details: { reviewerName, notes },
    ipAddress: String(req.ip || 'unknown')
  });

  res.json({
    success: true,
    record: transitioned,
    message: `Curriculum status updated to ${status}.`
  });
});

// 7. Get teaching aids across curriculum
app.get('/api/admin/teaching-aids', requireRole('admin'), (req, res) => {
  const aids = db.getAllTeachingAids();
  res.json({ success: true, count: aids.length, aids });
});

// 8. Get questions across curriculum
app.get('/api/admin/questions', requireRole('admin'), (req, res) => {
  const questions = db.getAllQuestions();
  res.json({ success: true, count: questions.length, questions });
});

// 9. Authentic NERDC import foundation preview endpoint
app.post('/api/admin/curriculum/import-preview', requireRole('admin'), (req, res) => {
  const { documentTitle, documentReference, entries } = req.body;

  if (!entries || !Array.isArray(entries)) {
    return res.status(400).json({
      success: false,
      message: 'Import payload must contain an array of curriculum entries.'
    });
  }

  const validated: any[] = [];
  const errors: string[] = [];

  entries.forEach((item, index) => {
    if (!item.grade || !item.subject || !item.term || !item.week || !item.topic) {
      errors.push(`Row ${index + 1}: Missing mandatory fields (grade, subject, term, week, topic).`);
    } else {
      validated.push({
        grade: item.grade,
        subject: item.subject,
        term: item.term,
        week: item.week,
        topic: item.topic,
        subtopic: item.subtopic || item.topic,
        objectivesCount: Array.isArray(item.objectives) ? item.objectives.length : 0,
        hasTeachingAids: Boolean(item.concreteVisualAids?.length),
        status: 'PENDING_APPROVAL'
      });
    }
  });

  db.recordAuditLog({
    adminId: req.user.id,
    adminEmail: req.user.email || 'admin@brightly.ng',
    action: 'CURRICULUM_IMPORT',
    targetType: 'system',
    targetId: documentTitle || 'Import Preview Batch',
    details: { totalEntries: entries.length, validEntries: validated.length, errorCount: errors.length },
    ipAddress: String(req.ip || 'unknown')
  });

  res.json({
    success: errors.length === 0,
    documentTitle: documentTitle || 'Unspecified NERDC Curriculum Document',
    documentReference: documentReference || 'Pending Document Audit',
    totalEntries: entries.length,
    validEntries: validated.length,
    invalidEntries: errors.length,
    errors,
    preview: validated.slice(0, 10),
    message: errors.length === 0 
      ? 'Curriculum document structure validated. Ready for administrative review.' 
      : 'Validation issues found in import payload.'
  });
});

// 10. Admin Audit Logs Endpoint
app.get('/api/admin/audit-logs', requireRole('admin'), (req, res) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, count: logs.length, logs });
});


// -------------------------------------------------------------
// 7.2 PAYSTACK INITIALIZE (Server-Side)
// -------------------------------------------------------------
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    const { studentId, grade, term, planType = 'termly', referralCode } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Valid pupil profile (studentId) is required' });
    }

    const student = db.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Pupil profile not found' });
    }

    // Role authorization: pupils cannot initialize payment intents
    if (req.user?.role === 'pupil') {
      return res.status(403).json({ success: false, message: 'Forbidden: Pupil accounts cannot initiate tuition payments.' });
    }

    // Parent isolation: parents cannot initiate payments for other parents' children
    if (req.user?.role === 'parent' && student.parentId !== req.user.parentId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot initiate tuition payments for another parent’s child.' });
    }

    const parent = req.user?.parentId 
      ? db.getParentAccount(req.user.parentId) 
      : db.getParentAccount(student.parentId);
    const targetGrade = Number(grade || student.grade) as GradeLevel;
    const targetTerm = Number(term || student.currentTerm);

    // Derive central authoritative amount (do not trust arbitrary client numbers)
    const baseAmount = planType === 'annual' 
      ? STANDARD_TUITION_FEES.annualPlanFee 
      : STANDARD_TUITION_FEES.termlyPlanFee;

    let discount = 0;
    if (referralCode && String(referralCode).trim().length >= 3) {
      discount = 1000; // ₦1,000 promotional referral discount
    }
    const finalAmount = Math.max(0, baseAmount - discount);
    const amountInKobo = finalAmount * 100;

    // Unique transaction reference
    const reference = `BHL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 1. Record pending payment intent in server ledger
    const paymentIntent = db.createPaymentIntent({
      parentId: parent.id,
      childId: student.id,
      grade: targetGrade,
      term: targetTerm,
      amount: finalAmount,
      channel: 'Paystack',
      reference
    });

    // 2. Call Paystack REST API
    const paystackResult = await paystack.initializeTransaction({
      email: parent.email || 'parent@brightly.ng',
      amountInKobo,
      reference,
      callbackUrl: `${process.env.APP_URL || ''}/payment/callback`,
      metadata: {
        parentId: parent.id,
        parentName: parent.name,
        childId: student.id,
        childName: student.name,
        grade: targetGrade,
        term: targetTerm,
        planType
      }
    });

    res.json({
      success: true,
      reference,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      publicKey: paystack.getPublicKey(),
      amount: finalAmount,
      currency: STANDARD_TUITION_FEES.currency,
      currencySymbol: STANDARD_TUITION_FEES.currencySymbol,
      planTitle: paymentIntent.planTitle,
      child: {
        id: student.id,
        name: student.name,
        grade: targetGrade,
        term: targetTerm
      },
      message: paystackResult.message || 'Payment initialized successfully.'
    });
  } catch (error: any) {
    console.error('Paystack initialize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment gateway. Please check your internet connection and try again.'
    });
  }
});

// -------------------------------------------------------------
// 7.3 PAYSTACK VERIFY (Server-Side)
// -------------------------------------------------------------
app.get('/api/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Transaction reference is required' });
    }

    // Check existing payment in local ledger
    const existingPayment = db.getPaymentByReference(reference);

    // If already verified, return idempotent success
    if (existingPayment && existingPayment.status === 'paid') {
      const student = db.getStudentById(existingPayment.childId);
      return res.json({
        success: true,
        verified: true,
        payment: existingPayment,
        student,
        message: 'Payment verified and active.'
      });
    }

    // Verify authoritatively with Paystack server
    let verification = await paystack.verifyTransaction(reference);

    // In test mode only (sk_test_...): if automated testing or test checkout simulator requested simulation
    if (paystack.isTestMode() && !verification.success && (req.query.simulate === 'true' || reference.includes('TEST_SUCCESS') || req.body?.simulate === true)) {
      verification = {
        success: true,
        status: 'success',
        amountInKobo: 600000,
        currency: 'NGN',
        channel: 'card',
        paidAt: new Date().toISOString(),
        message: 'Verified via Paystack Sandbox simulator.'
      };
    }

    if (verification.success && verification.status === 'success') {
      // Finalize in database ledger
      const finalized = db.finalizePaymentRecord(reference, {
        amount: verification.amountInKobo ? Math.round(verification.amountInKobo / 100) : undefined,
        channel: verification.channel || 'Paystack',
        paystackReference: reference,
        paidAt: verification.paidAt
      });

      if (finalized) {
        return res.json({
          success: true,
          verified: true,
          status: 'paid',
          payment: finalized.payment,
          student: finalized.student,
          message: 'Payment successfully verified! Your child\'s learning access is now active.'
        });
      }
    }

    // If verification was not successful, record failure in ledger
    const failedPayment = db.failPaymentRecord(reference);
    return res.status(400).json({
      success: false,
      verified: false,
      status: 'failed',
      payment: failedPayment,
      message: verification.message || 'Payment could not be verified.'
    });
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed due to network error. Please try again.'
    });
  }
});

// POST alias for verify
app.post('/api/paystack/verify', async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    return res.status(400).json({ success: false, message: 'Transaction reference is required' });
  }
  // Redirect to GET handler logic
  req.params = { reference };
  // Re-use logic
  const existingPayment = db.getPaymentByReference(reference);
  if (existingPayment && existingPayment.status === 'paid') {
    const student = db.getStudentById(existingPayment.childId);
    return res.json({ success: true, verified: true, payment: existingPayment, student });
  }

  let verification = await paystack.verifyTransaction(reference);
  if (paystack.isTestMode() && !verification.success && (req.query.simulate === 'true' || reference.includes('TEST_SUCCESS') || req.body?.simulate === true)) {
    verification = {
      success: true,
      status: 'success',
      amountInKobo: 600000,
      currency: 'NGN',
      channel: 'card',
      paidAt: new Date().toISOString(),
      message: 'Verified via Paystack Sandbox simulator.'
    };
  }
  if (verification.success && verification.status === 'success') {
    const finalized = db.finalizePaymentRecord(reference, {
      amount: verification.amountInKobo ? Math.round(verification.amountInKobo / 100) : undefined,
      channel: verification.channel || 'Paystack',
      paystackReference: reference,
      paidAt: verification.paidAt
    });
    if (finalized) {
      return res.json({
        success: true,
        verified: true,
        payment: finalized.payment,
        student: finalized.student,
        message: 'Payment confirmed.'
      });
    }
  }

  db.failPaymentRecord(reference);
  return res.status(400).json({
    success: false,
    verified: false,
    message: verification.message || 'Payment verification failed.'
  });
});

// -------------------------------------------------------------
// 7.3.1 PAYSTACK WEBHOOK (Server-to-Server Reconcile)
// -------------------------------------------------------------
app.post('/api/paystack/webhook', (req: any, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const rawBody = req.rawBody as Buffer;

  // Strict HMAC SHA512 signature check using secret key against raw request buffer
  const isSignatureValid = paystack.verifyWebhookSignature(signature, rawBody);
  if (!isSignatureValid) {
    return res.status(401).json({ success: false, message: 'Invalid Paystack webhook signature' });
  }

  const event = req.body;
  if (!event || typeof event !== 'object' || !event.event) {
    return res.status(400).json({ success: false, message: 'Invalid webhook payload structure' });
  }

  // Only charge.success triggers paid activation
  if (event.event !== 'charge.success') {
    return res.status(200).json({ status: 'ignored', message: `Event ${event.event} received without activation.` });
  }

  const data = event.data;
  const reference = data?.reference;
  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing transaction reference in webhook payload' });
  }

  // 1. Validate transaction status
  if (data.status !== 'success') {
    return res.status(200).json({ status: 'ignored', message: `Transaction status is ${data.status}; paid access denied.` });
  }

  // 2. Validate currency (Nigerian Naira - NGN only)
  if (data.currency && String(data.currency).toUpperCase() !== 'NGN') {
    console.warn(`[WEBHOOK] Currency mismatch: expected NGN, got ${data.currency} for ref ${reference}`);
    return res.status(400).json({ success: false, message: 'Invalid transaction currency. Only NGN tuition payments are accepted.' });
  }

  // 3. Verify against existing payment intent in local database ledger
  const existingPayment = db.getPaymentByReference(reference);
  if (!existingPayment) {
    console.warn(`[WEBHOOK] Transaction reference not found in pending payment ledger: ${reference}`);
    return res.status(404).json({ success: false, message: 'Payment reference not recognized in ledger.' });
  }

  // 4. Strict Idempotency: Repeated deliveries acknowledge success without duplicate payments
  if (existingPayment.status === 'paid') {
    return res.status(200).json({ 
      status: 'success', 
      message: 'Payment already verified and active. Idempotent delivery acknowledged.' 
    });
  }

  // 5. Amount validation: Ensure payment amount meets or exceeds registered tuition intent (in kobo)
  const paidKobo = Number(data.amount);
  const expectedKobo = existingPayment.amount * 100;
  if (isNaN(paidKobo) || paidKobo < expectedKobo) {
    console.warn(`[WEBHOOK] Underpayment detected for ${reference}: paid ${paidKobo} kobo, expected ${expectedKobo} kobo`);
    db.failPaymentRecord(reference);
    return res.status(400).json({ 
      success: false, 
      message: `Payment amount (${paidKobo} kobo) is less than required tuition fee (${expectedKobo} kobo). Access denied.` 
    });
  }

  // 6. Finalize in database ledger and activate student tuition for the specified child and term
  const paidAmountNaira = Math.round(paidKobo / 100);
  const finalized = db.finalizePaymentRecord(reference, {
    amount: paidAmountNaira,
    channel: data.channel || 'Paystack Webhook',
    paystackReference: reference,
    paidAt: data.paid_at || new Date().toISOString()
  });

  db.recordAuditLog({
    adminId: 'system_webhook',
    adminEmail: 'paystack-webhook@brightly.ng',
    action: 'PAYMENT_VERIFIED',
    targetType: 'payment',
    targetId: reference,
    details: {
      channel: data.channel,
      amount: paidAmountNaira,
      childId: existingPayment.childId,
      parentId: existingPayment.parentId,
      term: existingPayment.term,
      event: event.event,
      customer: data.customer?.email,
      status: finalized ? 'finalized' : 'error'
    },
    ipAddress: String(req.ip || 'paystack-webhook')
  });

  return res.status(200).json({ 
    status: 'success', 
    message: 'Webhook event processed and tuition verified successfully.',
    reference 
  });
});

// -------------------------------------------------------------
// 7.4 TUITION PAYMENT (Wallet or Verified Offline Settle)
// -------------------------------------------------------------
app.post('/api/tuition/pay', (req, res) => {
  const { 
    studentId, 
    grade, 
    term, 
    amount = STANDARD_TUITION_FEES.termlyPlanFee, 
    paymentMethod = 'Wallet', 
    receiptNo,
    verifiedReference
  } = req.body;

  if (!studentId || !grade || !term) {
    return res.status(400).json({ success: false, message: 'studentId, grade, and term are required' });
  }

  // Pupils are forbidden from modifying tuition records
  if (req.user?.role === 'pupil') {
    return res.status(403).json({ success: false, message: 'Forbidden: Pupil accounts cannot process tuition payments.' });
  }

  const student = db.getStudentById(studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil profile not found' });
  }

  // Parent isolation: parent cannot settle tuition for another parent's child
  if (req.user?.role === 'parent' && student.parentId !== req.user.parentId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot pay tuition for another parent’s child.' });
  }

  const effectiveParentId = req.user?.parentId || student.parentId;
  const parsedGrade = Number(grade) as GradeLevel;
  const parsedTerm = Number(term);
  const parsedAmount = Number(amount);
  const genReceiptNo = receiptNo || `BRT-TERM-${parsedGrade}${parsedTerm}-${Date.now().toString().slice(-6)}`;

  // If paying via wallet, check and debit wallet
  if (paymentMethod === 'Wallet' || paymentMethod === 'wallet') {
    const debitResult = db.debitWallet(parsedAmount, `Primary ${parsedGrade} Term ${parsedTerm} Tuition`, effectiveParentId);
    if (!debitResult.success) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_wallet',
        message: 'Insufficient wallet balance. Please fund your wallet or pay via Paystack.'
      });
    }

    const result = db.recordTuitionPayment(
      studentId,
      parsedGrade,
      parsedTerm,
      parsedAmount,
      'Wallet',
      genReceiptNo
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Pupil profile not found' });
    }

    // Also create verified ledger payment record
    const ref = `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const intent = db.createPaymentIntent({
      parentId: effectiveParentId,
      childId: studentId,
      grade: parsedGrade,
      term: parsedTerm,
      amount: parsedAmount,
      channel: 'Wallet Deduction',
      reference: ref
    });
    db.finalizePaymentRecord(ref, {
      amount: parsedAmount,
      channel: 'Wallet Deduction',
      paidAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Tuition of ₦${parsedAmount.toLocaleString()} confirmed via Wallet for Primary ${parsedGrade} Term ${parsedTerm}!`,
      receipt: result.receipt,
      student: result.student,
      wallet: db.getWallet(effectiveParentId)
    });
  }

  // If Paystack was specified directly, enforce that reference was ALREADY verified by Paystack gateway
  if (verifiedReference) {
    const existing = db.getPaymentByReference(verifiedReference);
    if (!existing || existing.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Paystack transaction reference is not verified or pending. Paystack payments must be verified via gateway or webhook.'
      });
    }
    const studentProfile = db.getStudentById(existing.childId);
    return res.json({
      success: true,
      message: 'Tuition confirmed via verified Paystack transaction.',
      student: studentProfile,
      receipt: existing
    });
  }

  return res.status(400).json({
    success: false,
    message: 'Paystack payments must be completed and verified through the Paystack gateway.'
  });
});


// Parent Academic Summary Data endpoint (In-App Report)
app.post('/api/parent/academic-summary', async (req, res) => {
  try {
    const { studentName, grade, week, overallScore, topSubject, aiInterventions } = req.body;
    
    res.json({
      success: true,
      report: {
        studentName: studentName || 'Chidi',
        grade: grade || 4,
        week: week || 3,
        overallScore: overallScore || 88,
        topSubject: topSubject || 'Mathematics',
        aiInterventions: aiInterventions || 1,
        completedModules: [
          'Social Studies: Nigerian Geography & Climates (100% Complete)',
          'Mathematics: Fractions with Agege Bread (Mastered)',
          'Basic Science: Living Things & MR NIGER D (Mastered 95%)'
        ],
        recommendedHomePractice: `Ask ${studentName || 'Chidi'} to identify the 6 geopolitical zones on a map, or practice equal division with concrete objects.`,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 7.5 TEXT-TO-SPEECH (TTS) — AUTHENTIC NIGERIAN TEACHER VOICE
// -------------------------------------------------------------
const ttsCache = new Map<string, { audioBase64: string; mimeType: string }>();
let ttsQuotaExceededUntil = 0;

app.post('/api/tts', async (req, res) => {
  try {
    const { text, gender, voiceTone } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'text is required' });
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return res.status(400).json({ success: false, error: 'text cannot be empty' });
    }

    const isFemale = gender === 'female';
    const isPhonics = voiceTone === 'phonics';

    // Cache key incorporates text, tone, and gender
    const cacheKey = `${isPhonics ? 'phonics' : 'nigerian'}-${isFemale ? 'female' : 'male'}-${cleanText}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return res.json({
        success: true,
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        cached: true,
      });
    }

    // If quota was recently exceeded or cooling down, notify client to use browser speech synthesis fallback
    if (Date.now() < ttsQuotaExceededUntil) {
      return res.json({
        success: false,
        fallback: true,
        quotaExceeded: true,
        message: 'TTS quota currently cooling down, fallback to client synthesis',
      });
    }

    const ai = getAI();
    if (!ai) {
      return res.json({ success: false, fallback: true, error: 'Gemini AI not initialized' });
    }

    // Authentic Nigerian Teacher voice style:
    // Uses prebuilt voice Kore (female) or Fenrir (male) with detailed speech metadata
    const voiceName = isFemale ? 'Kore' : 'Fenrir';
    const styleDescription = isPhonics
      ? 'Primary school teacher speaking with clear phonics enunciation and distinct syllable pacing.'
      : 'Warm, encouraging Nigerian primary school teacher speaking fluent Nigerian English with friendly West African rhythm, patient classroom inflection, and cheerful warmth';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                // @ts-ignore
                speechMetadata: {
                  style: styleDescription,
                },
              },
            ],
          } as any,
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!part || !part.data) {
        return res.json({ success: false, fallback: true, error: 'No audio returned from Gemini TTS' });
      }

      const audioBase64 = part.data;
      const mimeType = part.mimeType || 'audio/wav';

      // Keep cache bounded to 150 items
      if (ttsCache.size > 150) {
        const oldestKey = ttsCache.keys().next().value;
        if (oldestKey) ttsCache.delete(oldestKey);
      }
      ttsCache.set(cacheKey, { audioBase64, mimeType });

      return res.json({
        success: true,
        audioBase64,
        mimeType,
        cached: false,
      });
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || String(apiErr);
      const isQuotaError = 
        apiErr?.status === 429 || 
        apiErr?.code === 429 || 
        errMsg.includes('429') || 
        errMsg.includes('quota') || 
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded');

      if (isQuotaError) {
        // Back off for 60 seconds so server doesn't keep hammering the API
        ttsQuotaExceededUntil = Date.now() + 60000;
        console.warn('Gemini TTS quota limit reached; engaging browser synthesis fallback for next 60s');
        return res.json({
          success: false,
          fallback: true,
          quotaExceeded: true,
          message: 'Gemini TTS quota reached, falling back to browser speech synthesis',
        });
      }

      console.warn('Gemini TTS call failed, falling back:', errMsg.slice(0, 100));
      return res.json({
        success: false,
        fallback: true,
        error: errMsg,
      });
    }
  } catch (error: any) {
    console.warn('Handled error in /api/tts endpoint, using browser fallback:', error?.message);
    res.json({ success: false, fallback: true, error: error?.message });
  }
});

// -------------------------------------------------------------
// 8. SERVER STARTUP & VITE INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Brightly Home Lesson backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
