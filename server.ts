import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client lazily or with process.env.GEMINI_API_KEY
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Brightly Home Lesson',
    platform: 'Vercel Edge / Node Express',
    curriculum: 'NERDC Primary 1-6',
    time: new Date().toISOString(),
  });
});

// Dynamic Lesson Generation endpoint using Gemini
app.post('/api/lessons/generate', async (req, res) => {
  try {
    const { grade = 4, subject = 'Mathematics', week = 3, topic, childName = 'Chidi', teacherPersona = 'Mrs. Chidinma Okafor' } = req.body;
    const ai = getAI();

    if (!ai) {
      // Fallback structured response if key is missing
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
      model: 'gemini-3.7-flash',
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
      model: 'gemini-3.7-flash',
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

// Paystack Subscription simulation / intent endpoint
app.post('/api/paystack/initialize', (req, res) => {
  const { planType, amount, email, studentName, referralCode } = req.body;
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

async function startServer() {
  // Vite middleware for development
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
    console.log(`Brightly Home Lesson server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
