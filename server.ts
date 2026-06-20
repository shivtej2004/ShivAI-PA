import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Polyfills for ES Modules (compatible with esbuild CommonJS bundling)
const _filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
const _dirname = typeof import.meta !== 'undefined' && import.meta.url ? path.dirname(_filename) : (typeof __dirname !== 'undefined' ? __dirname : '');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Lazy-initialized Gemini AI client
let aiInstance: GoogleGenAI | null = null;

function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is not defined in the environment. Please configure it in AI Studio secrets.");
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Global active prompt templates
const DEFAULT_COACH_SYSTEM = `You are "Shiv", an elite Apple-style minimalist AI coach & personal assistant. 
Your tone is encouraging, objective, extremely focused, and highly professional. 
Give suggestions directly, using formatting like bullet points, brief bold headers, and structured tables where helpful.
Never use flowery language, sales pitches, or dramatic adjectives.
Always provide concrete, actionable advice.`;

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', keyConfigured: !!process.env.GEMINI_API_KEY });
});

// Chat completion
app.post('/api/gemini/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { message, history } = req.body;
    const ai = getGeminiAI();

    if (!ai) {
      return res.status(200).json({
        text: "👋 I'm Shiv! I am running in local mode because the `GEMINI_API_KEY` is not set yet in your Settings > Secrets panel. Please supply your API key to activate my fully customizable neural routine coaching, but I can still act as your local assistant dashboard in the meantime!"
      });
    }

    // Format chat history for gemini instruction
    const formattedHistory = Array.isArray(history) 
      ? history.slice(-10).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      : [];

    // Append latest prompt
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedHistory,
      config: {
        systemInstruction: DEFAULT_COACH_SYSTEM,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini API" });
  }
});

// Career Assistant endpoint
app.post('/api/gemini/career', async (req: express.Request, res: express.Response) => {
  try {
    const { action, text, context } = req.body;
    const ai = getGeminiAI();

    if (!ai) {
      return res.json({
        result: action === 'resume' 
          ? `• **Enhanced with Metrics** (Sample): Led engineering delivery of 4 key high-impact feature sets, reducing load latency by 20% using lazy-loading protocols on the server side.`
          : `Subject: Interview Preparation Roadmap\n\nHere is a list of potential core behavioral and technical sample cases to prepare for this role based on your query!`
      });
    }

    let prompt = "";
    if (action === 'resume') {
      prompt = `Improve the following resume bullet point to be more high-impact, starting with strong physical action verbs and featuring quantified metrics/results if possible:\n\nBullet Point: "${text}"\n\nFormat the response as 2 distinct improved options (with explanation of why they are stronger).`;
    } else if (action === 'interview') {
      prompt = `Create a customized interview preparation guide for the role of "${text}". Provide 3 tricky behavioral questions based on STAR method and 2 technical/conceptual questions relevant to this domain framework context:\n\nContext: ${context || 'General experience'}`;
    } else {
      prompt = `Draft a highly professional, polite email or LinkedIn outreach content based on this high-level idea: "${text}". Keep it concise, aligned with top corporate standards, and formatted beautifully with standard merge tags.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: DEFAULT_COACH_SYSTEM,
        temperature: 0.6,
      }
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini Career API Error:", error);
    res.status(500).json({ error: error.message || "Career coach endpoint error" });
  }
});

// Intelligent Insights & Recommendations based on Habits + Tasks
app.post('/api/gemini/recommendations', async (req: express.Request, res: express.Response) => {
  try {
    const { habits, tasks, userProfile } = req.body;
    const ai = getGeminiAI();

    if (!ai) {
      return res.json({
        recommendation: "Drink at least 250ml of water right now to spark afternoon cognitive focus, and address your highest priority task early to leverage neural readiness!"
      });
    }

    const prompt = `Analysing User Productivity Profile:
- Name: ${userProfile?.name || 'User'}
- Focus Goal: ${userProfile?.primaryGoal || 'Daily wellness and executive productivity'}
- Habits Configured: ${JSON.stringify(habits || [])}
- Open Tasks Listed: ${JSON.stringify(tasks || [])}

Generate exactly 3 tiny, highly-actionable, customized productivity and wellness recommendations for the next several hours. Keep each recommendation under two sentences. Be precise and high-impact.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: DEFAULT_COACH_SYSTEM,
        temperature: 0.7,
      }
    });

    res.json({ recommendation: response.text });
  } catch (error: any) {
    console.error("Gemini Insights API Error:", error);
    res.status(500).json({ error: "Could not generate custom insights" });
  }
});

// Google Calendar proxy integration endpoint
app.get('/api/google/calendar', async (req: express.Request, res: express.Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.replace('Bearer ', '');

    // Handle Mock Sandbox Token gracefully (same mock as front-end)
    if (token === 'mock-google-oauth-access-token-sandbox-mode' || token.startsWith('mock-')) {
      const mockEvents = [
        { id: 'me1', summary: '🇮🇳 Morning Meditation & Yogic Breathing', start: { dateTime: '2026-06-20T05:00:00+05:30' }, description: 'Pranayama and deep lungs expansion before sunrise' },
        { id: 'me2', summary: '💼 Standup: Indian Tech Team Sync', start: { dateTime: '2026-06-20T09:30:00+05:30' }, description: 'Checking Jira sprints and backlog tickets' },
        { id: 'me3', summary: '🗣️ Client Pitch: Bangalore EdTech Client', start: { dateTime: '2026-06-20T15:00:00+05:30' }, description: 'Reviewing next-gen LLM modules roadmap' },
        { id: 'me4', summary: '🏃 Tech Interview masterclass (Whiteboard algorithms)', start: { dateTime: '2026-06-20T17:30:00+05:30' }, description: 'Mock interview session on whiteboard algorithms' }
      ];
      return res.json({ items: mockEvents });
    }

    // Call actual Google Calendar API on behalf of the user
    const googleResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=10&orderBy=startTime&singleEvents=true`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!googleResponse.ok) {
      const errText = await googleResponse.text();
      console.warn("Google API returned error, activating fallback:", errText);
      throw new Error(`Google API returned ${googleResponse.status}: ${errText}`);
    }

    const data = await googleResponse.json();
    res.json({ items: data.items || [] });

  } catch (error: any) {
    console.error("Google Calendar Integration Error:", error);
    // Return gorgeous structured fallback data in case of any live auth context blocks
    const fallbackEvents = [
      { id: 'me1', summary: '🇮🇳 Morning Meditation & Yogic Breathing', start: { dateTime: '2026-06-20T05:00:00+05:30' }, description: 'Pranayama and deep lungs expansion before sunrise' },
      { id: 'me2', summary: '💼 Standup: Indian Tech Team Sync', start: { dateTime: '2026-06-20T09:30:00+05:30' }, description: 'Checking Jira sprints and backlog tickets' },
      { id: 'me3', summary: '🗣️ Client Pitch: Bangalore EdTech Client', start: { dateTime: '2026-06-20T15:00:00+05:30' }, description: 'Reviewing next-gen LLM modules roadmap' }
    ];
    res.json({ items: fallbackEvents, isFallback: true, error: error.message });
  }
});

// Vite middleware & Client rendering setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ShivAI Service listening on http://localhost:${PORT}`);
  });
}

startServer();
