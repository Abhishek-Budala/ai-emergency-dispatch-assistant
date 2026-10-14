import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '2mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface EmergencyAnalysis {
  emergency_type: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  location: string;
  people_involved: string;
  services_to_alert: Array<'Ambulance' | 'Fire' | 'Police' | 'Social Support'>;
  summary: string;
  suggested_questions: string[];
}

const EMERGENCY_CAD_SYSTEM_PROMPT = `You are an elite Computer-Aided Dispatch (CAD) 911/112 emergency triage artificial intelligence system. 
Analyze emergency call transcripts accurately, rapidly, and objectively.
The caller may speak English, Telugu (native script or English transliteration), Hindi (native script or Hinglish), or mixed.
Services to alert MUST only be drawn from: "Ambulance", "Fire", "Police", "Social Support".
- Ambulance: for injuries, unconsciousness, medical emergencies, bleeding, burns, health collapse.
- Fire: for fire, smoke, hazardous leaks, building collapse, vehicle entrapment requiring extrication.
- Police: for traffic accidents/road blockages, crimes, assaults, crowd control, public safety hazards.
- Social Support: for mental health distress, homeless welfare, domestic disputes needing social mediation, vulnerable persons.
Urgency classification:
- "Critical": Life-threatening, active fire with people trapped, unconscious/unresponsive person, severe bleeding, catastrophic crash.
- "High": Serious injury without immediate death threat, spreading fire/hazard, aggressive public disturbance.
- "Medium": Non-life-threatening injury, property damage, contained incident.
- "Low": Minor incident, inquiries, non-urgent welfare checks.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    emergency_type: {
      type: Type.STRING,
      description: 'Clear emergency type classification, e.g. "Medical Emergency - Unconscious Person", "Structural Fire", "Multi-Vehicle Road Crash"',
    },
    urgency: {
      type: Type.STRING,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      description: 'Urgency tier: Critical, High, Medium, or Low',
    },
    location: {
      type: Type.STRING,
      description: 'Location or landmarks mentioned in the transcript. If unclear, state "Unspecified / Needs confirmation"',
    },
    people_involved: {
      type: Type.STRING,
      description: 'Estimated number, condition, or role of people involved (e.g. "1 adult male unresponsive, crowd gathering")',
    },
    services_to_alert: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: ['Ambulance', 'Fire', 'Police', 'Social Support'],
      },
      description: 'Specific emergency services that need to be alerted and mobilized',
    },
    summary: {
      type: Type.STRING,
      description: 'A crisp, professional one-line situational summary for responders',
    },
    suggested_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: '3-4 critical tactical questions the dispatcher should ask the caller next',
    },
  },
  required: [
    'emergency_type',
    'urgency',
    'location',
    'people_involved',
    'services_to_alert',
    'summary',
    'suggested_questions',
  ],
};

// Emergency fallback heuristic triage if models experience temporary rate limits or 503
function emergencyHeuristicTriage(transcript: string): EmergencyAnalysis {
  const lower = transcript.toLowerCase();
  const services: Array<'Ambulance' | 'Fire' | 'Police' | 'Social Support'> = [];

  let urgency: 'Critical' | 'High' | 'Medium' | 'Low' = 'High';
  let type = 'Emergency Incident';

  // Check fire
  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('flame') || lower.includes('burning') || lower.includes('నిప్పు') || lower.includes('మంటలు') || lower.includes('ఆగ్')) {
    services.push('Fire');
    services.push('Police');
    type = 'Structural / Fire Emergency';
    if (lower.includes('people') || lower.includes('window') || lower.includes('trapped') || lower.includes('shouting')) {
      urgency = 'Critical';
      services.push('Ambulance');
    }
  }

  // Check crash / accident
  if (lower.includes('crash') || lower.includes('accident') || lower.includes('lorry') || lower.includes('bike') || lower.includes('road') || lower.includes('ట్రాఫిక్') || lower.includes('యాక్సిడెంట్')) {
    services.push('Police');
    services.push('Ambulance');
    type = 'Multi-Vehicle Traffic Collision';
    if (lower.includes('bleeding') || lower.includes('severe') || lower.includes('unconscious') || lower.includes('dead')) {
      urgency = 'Critical';
    }
  }

  // Check medical collapse
  if (lower.includes('collapse') || lower.includes('not responding') || lower.includes('fainted') || lower.includes('heart') || lower.includes('unconscious') || lower.includes('bleeding') || lower.includes('పడిపోయాడు')) {
    if (!services.includes('Ambulance')) services.push('Ambulance');
    if (lower.includes('crowd') && !services.includes('Police')) services.push('Police');
    type = 'Medical Emergency - Patient Unresponsive';
    urgency = 'Critical';
  }

  // Fallback defaults if none matched
  if (services.length === 0) {
    services.push('Police', 'Ambulance');
    urgency = 'High';
  }

  // Extract location cues
  let location = 'Unspecified / Needs confirmation';
  const nearMatch = transcript.match(/(?:near|at|around|opposite|behind|on|in)\s+([^,.]+)/i);
  if (nearMatch && nearMatch[1]) {
    location = nearMatch[1].trim();
  }

  return {
    emergency_type: type,
    urgency,
    location,
    people_involved: 'Reported casualties / witnesses at scene',
    services_to_alert: services,
    summary: `Immediate response activated: ${transcript.slice(0, 120)}...`,
    suggested_questions: [
      'Is the patient or victim conscious and breathing?',
      'Are there active fire, chemical, or electrical hazards present?',
      'Can you give the nearest prominent building or intersection landmark?',
      'Is the pathway clear for emergency responder vehicle access?',
    ],
  };
}

async function callGeminiTriage(transcript: string, language: string, modelName: string): Promise<EmergencyAnalysis> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout waiting for ${modelName}`)), 5000)
  );

  const generatePromise = (async () => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Emergency Call Transcript (Language mode: ${language || 'Auto/Multilingual'}):\n"${transcript.trim()}"\n\nAnalyze this emergency call transcript immediately. Identify the emergency type, urgency severity, exact or approximate location mentioned, count/status of people involved, which of the 4 emergency services (Ambulance, Fire, Police, Social Support) must be alerted, a crisp one-line summary, and 3-4 suggested follow-up triage questions for the dispatcher to ask next. Even if the call is in Telugu or Hindi (native script or Roman script transliteration), understand it accurately and output the response in standard English.`
            }
          ]
        }
      ],
      config: {
        systemInstruction: EMERGENCY_CAD_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const textOutput = response.text?.trim();
    if (!textOutput) {
      throw new Error('Empty response from model');
    }
    return JSON.parse(textOutput);
  })();

  return Promise.race([generatePromise, timeoutPromise]);
}

app.post('/api/analyze-emergency', async (req, res) => {
  try {
    const { transcript, language } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required for emergency analysis.' });
    }

    // Try primary model: gemini-3.8-flash
    try {
      const result = await callGeminiTriage(transcript, language, 'gemini-3.8-flash');
      return res.json(result);
    } catch (primaryErr: any) {
      console.warn('Primary model (gemini-3.8-flash) error, trying gemini-3.1-flash-lite fallback:', primaryErr?.message);
      
      try {
        // Fallback model: gemini-3.1-flash-lite
        const result = await callGeminiTriage(transcript, language, 'gemini-3.1-flash-lite');
        return res.json(result);
      } catch (secondaryErr: any) {
        console.warn('Secondary model error, using emergency CAD rule-based fallback:', secondaryErr?.message);
        const fallbackResult = emergencyHeuristicTriage(transcript);
        return res.json(fallbackResult);
      }
    }
  } catch (error: any) {
    console.error('Fatal error in emergency triage API:', error);
    // Even on fatal error, return a valid emergency triage response
    const safeFallback = emergencyHeuristicTriage(req.body?.transcript || 'Emergency reported');
    return res.json(safeFallback);
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Emergency CAD Server running on port ${PORT}`);
  });
}

startServer();
