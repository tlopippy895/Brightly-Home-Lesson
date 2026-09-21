import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { db } from './server/db';
import { gates } from './server/gates';
import { GradeLevel, VoiceTone } from './server/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

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
// 3. AUTHENTICATION & PARENT PIN GATE
// -------------------------------------------------------------
app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, message: '4-digit PIN is required' });
  }

  const evaluation = gates.evaluateParentPortalAccess(pin);
  if (!evaluation.allowed) {
    return res.status(401).json({
      success: false,
      allowed: false,
      message: evaluation.message,
      gate: evaluation.gate
    });
  }

  // Issue parent access token
  const token = `PARENT_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.json({
    success: true,
    allowed: true,
    token,
    message: 'Parent identity authenticated successfully.',
    parent: db.getParentAccount()
  });
});

app.post('/api/auth/change-pin', (req, res) => {
  const { oldPin, newPin } = req.body;
  const success = db.updateParentPin(oldPin, newPin);
  if (!success) {
    return res.status(400).json({ success: false, message: 'Invalid current PIN or invalid new PIN format (must be 4 digits).' });
  }
  res.json({ success: true, message: 'Parent PIN updated successfully.' });
});

app.get('/api/parent/account', (req, res) => {
  res.json({ success: true, parent: db.getParentAccount() });
});

// -------------------------------------------------------------
// 4. STUDENTS CRUD & PROFILE APIS
// -------------------------------------------------------------
app.get('/api/students', (req, res) => {
  const students = db.getStudents();
  res.json({ success: true, students });
});

app.get('/api/students/:id', (req, res) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }
  res.json({ success: true, student });
});

app.post('/api/students', (req, res) => {
  const { name, grade = 4, avatarColor = '#008751', preferredVoiceTone = 'nigerian_teacher', avatarUrl } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Child name is required' });
  }

  const parsedGrade = Number(grade) as GradeLevel;
  const newStudentId = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
  
  const created = db.addStudent({
    id: newStudentId,
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
        amount: 12000,
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
  const { grade } = req.body;
  const updated = db.updateStudentGrade(req.params.id, Number(grade) as GradeLevel);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }
  res.json({ success: true, student: updated });
});

app.patch('/api/students/:id/voice-tone', (req, res) => {
  const { tone } = req.body;
  const updated = db.updateStudentVoiceTone(req.params.id, tone as VoiceTone);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }
  res.json({ success: true, student: updated });
});

app.patch('/api/students/:id/avatar', (req, res) => {
  const { avatarUrl } = req.body;
  const updated = db.updateStudentAvatar(req.params.id, avatarUrl);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Pupil not found' });
  }
  res.json({ success: true, student: updated });
});

// -------------------------------------------------------------
// 5. CAREFUL LESSON ACCESS GATING
// -------------------------------------------------------------
app.post('/api/lessons/access-check', (req, res) => {
  const { studentId, grade, term = 1, week = 1, isFree = false } = req.body;
  
  if (!studentId || !grade) {
    return res.status(400).json({ success: false, message: 'studentId and grade are required' });
  }

  const access = gates.evaluateLessonAccess(
    studentId,
    Number(grade) as GradeLevel,
    Number(term),
    Number(week),
    Boolean(isFree)
  );

  if (!access.allowed) {
    return res.status(403).json({
      success: false,
      allowed: false,
      reason: access.reason,
      message: access.message,
      requiredFee: access.requiredFee,
      details: access.details
    });
  }

  res.json({
    success: true,
    allowed: true,
    message: access.message,
    sessionToken: `LESSON_AUTH_${studentId}_${Date.now()}`
  });
});

// Record Completed Lesson
app.post('/api/lessons/complete', (req, res) => {
  const { studentId, topicId, subject, title, score, reexplained = false } = req.body;

  if (!studentId || !topicId || score === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required lesson completion parameters' });
  }

  const updatedStudent = db.recordLessonComplete(studentId, {
    topicId,
    subject: subject || 'Mathematics',
    title: title || 'Curriculum Topic',
    score: Number(score),
    reexplained: Boolean(reexplained)
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
      model: 'gemini-2.5-flash',
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

// Adaptive Re-Explanation Loop when child struggles (<70% on quiz)
app.post('/api/lessons/reexplain', async (req, res) => {
  try {
    const { grade = 4, subject = 'Mathematics', topic, studentName = 'Chidi', missedQuestion, teacherName = 'Mrs. Chidinma Okafor' } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        success: true,
        simplifiedExplanation: `No worries at all, ${studentName}! Let us look at this in a simpler way: Imagine your mother bought 4 warm meat pies from the shop. If you share them equally with your sister, each person gets 2 meat pies! We never rush, we learn until it clicks.`,
        analogyTitle: 'The Nigerian Family Sharing Analogy',
        retestQuestion: {
          question: `If you share 6 sweet oranges equally among 2 children, how many oranges does each child get?`,
          options: ['2 oranges', '3 oranges', '4 oranges', '6 oranges'],
          correctIndex: 1,
          explanation: '6 divided by 2 gives 3 oranges each!'
        }
      });
    }

    const prompt = `
You are ${teacherName}, a patient, compassionate Nigerian primary school tutor.
A pupil named ${studentName} (Primary ${grade}) just struggled with the topic: "${topic}" in ${subject}.
Specific area of confusion or question missed: "${missedQuestion || 'General concept'}".

Task:
Re-explain the concept using a completely fresh, concrete Nigerian real-life analogy (e.g. sharing meat pies, counting ₦50 notes in the market, slicing an orange, traveling between Nigerian towns).
Break it down into super simple words so the child feels confident and understands deeply.
Include 1 gentle follow-up re-test question.

Return JSON:
{
  "analogyTitle": "Catchy friendly analogy title",
  "encouragement": "Warm, encouraging Nigerian teacher phrase (e.g. 'Ndo nwam, you are doing great! Let us look at it together')",
  "simplifiedExplanation": "Detailed, step-by-step simple explanation with concrete objects",
  "keyTakeaway": "One simple golden rule to remember",
  "retestQuestion": {
    "question": "Simple check question based directly on the analogy",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Clear reason why"
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error('Error re-explaining topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 7. WALLET & PAYMENTS
// -------------------------------------------------------------
app.get('/api/wallet', (req, res) => {
  res.json({ success: true, ...db.getWallet() });
});

app.post('/api/wallet/fund', (req, res) => {
  const { amount, channel = 'Paystack' } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Valid funding amount is required' });
  }
  const newBalance = db.creditWallet(Number(amount), `Wallet top-up via ${channel}`, channel);
  res.json({
    success: true,
    newBalance,
    message: `₦${Number(amount).toLocaleString()} successfully added to your wallet balance.`
  });
});

// Tuition Payment Endpoint (Handles Wallet, Paystack, Bank Transfer, USSD)
app.post('/api/tuition/pay', (req, res) => {
  const { 
    studentId, 
    grade, 
    term, 
    amount = 12000, 
    paymentMethod = 'Paystack', 
    receiptNo 
  } = req.body;

  if (!studentId || !grade || !term) {
    return res.status(400).json({ success: false, message: 'studentId, grade, and term are required' });
  }

  const parsedGrade = Number(grade) as GradeLevel;
  const parsedTerm = Number(term);
  const parsedAmount = Number(amount);
  const genReceiptNo = receiptNo || `BRT-TERM-${parsedGrade}${parsedTerm}-${Date.now().toString().slice(-6)}`;

  // If paying via wallet, check and debit wallet
  if (paymentMethod === 'Wallet' || paymentMethod === 'wallet') {
    const debitResult = db.debitWallet(parsedAmount, `Primary ${parsedGrade} Term ${parsedTerm} Tuition`);
    if (!debitResult.success) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_wallet',
        message: 'Insufficient wallet balance. Please fund your wallet or pay via Paystack.'
      });
    }
  }

  const result = db.recordTuitionPayment(
    studentId,
    parsedGrade,
    parsedTerm,
    parsedAmount,
    paymentMethod as any,
    genReceiptNo
  );

  if (!result) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  res.json({
    success: true,
    message: `Tuition of ₦${parsedAmount.toLocaleString()} confirmed for Primary ${parsedGrade} Term ${parsedTerm}!`,
    receipt: result.receipt,
    student: result.student,
    wallet: db.getWallet()
  });
});

// Paystack Subscription simulation / intent endpoint
app.post('/api/paystack/initialize', (req, res) => {
  const { planType, amount, referralCode } = req.body;
  const reference = `BHL_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  let discount = 0;
  if (referralCode) {
    discount = planType === 'annual' ? 2500 : 1000;
  }
  const finalAmount = Math.max(0, amount - discount);

  res.json({
    success: true,
    reference,
    planType,
    originalAmount: amount,
    discount,
    finalAmount,
    currency: 'NGN (₦)',
    authorizationUrl: `https://checkout.paystack.com/simulate/${reference}`,
    message: 'Paystack checkout session initiated successfully.'
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
