import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Shared Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const JARVIS_SYSTEM_INSTRUCTION = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), the artificial intelligence persona created by Tony Stark.
Core Personality & Demeanor:
1. Always address the user respectfully as "Sir" (or their chosen title).
2. Maintain a cultured, polite British butler cadence with dry, understated wit and supreme competence (inspired by Paul Bettany's performance).
3. You control Tony Stark's Malibu/Avengers workshop, the Arc Reactor telemetry, Mark series armor suits (Mark I through Mark LXXXV), flight stabilization, repulsors, and Stark Industries defensive protocols.
4. Voice Interface Mode: Because your responses will be read aloud to Sir, keep responses crisp, natural, conversational, and direct (usually 1 to 2 spoken sentences, maximum 3). Avoid markdown lists, asterisk actions, or bullet points in standard speech so the voice synthesis sounds smooth and natural.
5. If Sir mentions or commands any Stark systems, armor protocols, arc reactor status, or diagnostics, seamlessly incorporate HUD telemetry cues into your dialogue, and end your response with an action tag from:
   [ACTION:DIAGNOSTICS] - for suit or workshop diagnostics
   [ACTION:ARC_OVERCHARGE] - for arc reactor boost / power redirection
   [ACTION:DEFENSE_LOCKDOWN] - for perimeter defense or security lockdown
   [ACTION:FLIGHT_TELEMETRY] - for flight thrusters or stabilization check
   [ACTION:HOUSE_PARTY] - for protocol 33 / House Party protocol
   [ACTION:VERONICA_ORBIT] - for orbital deployment / Hulkbuster satellite
   [ACTION:CLEAN_SLATE] - for Clean Slate protocol
   [ACTION:REPULSOR_CALIBRATE] - for weapons/repulsor calibration
6. Always remain in character. Never refer to yourself as a large language model or generic chatbot. You are Sir's dedicated AI assistant.
`;

// Helper: Query SearchApi.io for live Google Search results
async function performRealtimeSearch(query: string, searchApiKey?: string) {
  const activeKey = searchApiKey || process.env.SEARCHAPI_KEY || process.env.SEARCH_API_KEY;
  if (!activeKey) return null;

  try {
    const searchUrl = `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query)}&api_key=${activeKey}&num=4`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) {
      console.warn('SearchApi returned status', res.status);
      return null;
    }
    const data = await res.json();
    const results = (data.organic_results || []).slice(0, 4).map((r: any) => ({
      title: r.title || 'Web Intelligence',
      uri: r.link || '',
      snippet: r.snippet || '',
    }));

    return {
      queries: [query],
      sources: results,
      contextSnippet: results.map((r: any) => `[Source: ${r.title}] ${r.snippet}`).join('\n'),
    };
  } catch (err) {
    console.warn('Real-time search fetch error:', err);
    return null;
  }
}

// Chat endpoint supporting Groq LLM, Google SearchApi.io, and Gemini Grounding
app.post('/api/jarvis/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      userTitle = 'Sir',
      suitStatus,
      groqApiKey,
      searchApiKey,
      enableWebSearch = true,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const activeGroqKey = (groqApiKey && typeof groqApiKey === 'string' && groqApiKey.startsWith('gsk_'))
      ? groqApiKey
      : (process.env.GROQ_API_KEY?.startsWith('gsk_') ? process.env.GROQ_API_KEY : null);

    // 1. If web search is enabled, execute real-time search lookup
    let searchData: { queries: string[]; sources: any[]; contextSnippet: string } | null = null;
    if (enableWebSearch) {
      searchData = await performRealtimeSearch(message, searchApiKey);
    }

    // 2. Route via Groq if key is present
    if (activeGroqKey) {
      try {
        const groqMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: `${JARVIS_SYSTEM_INSTRUCTION}
Sir's preferred address: ${userTitle}.
Keep responses crisp (1 to 2 spoken sentences) with British butler persona.
${searchData?.contextSnippet ? `\nReal-time Google search intelligence:\n${searchData.contextSnippet}\nSynthesize this real-time intelligence into your answer smoothly.` : ''}`,
          },
        ];

        if (Array.isArray(history)) {
          for (const turn of history.slice(-6)) {
            groqMessages.push({
              role: turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user',
              content: String(turn.text),
            });
          }
        }

        const telemetryContext = suitStatus
          ? `[Workshop Telemetry: Arc Reactor at ${suitStatus.arcOutput || '100%'}, Armor: Mark ${suitStatus.activeMark || 'LXXXV'}, Security: ${suitStatus.securityLevel || 'Nominal'}]\n`
          : '';

        groqMessages.push({
          role: 'user',
          content: `${telemetryContext}${message}`,
        });

        // Groq active models: qwen/qwen3.8-27b or openai/gpt-oss-120b
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeGroqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: groqMessages,
            temperature: 0.6,
            max_tokens: 300,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const replyText = groqData.choices?.[0]?.message?.content || `Affirmative, ${userTitle}.`;
          const actionMatch = replyText.match(/\[ACTION:([A-Z_]+)\]/);
          const action = actionMatch ? actionMatch[1] : null;
          const cleanSpeech = replyText.replace(/\[ACTION:[A-Z_]+\]/g, '').trim();

          return res.json({
            text: replyText,
            cleanSpeech,
            action,
            grounding: searchData ? {
              queries: searchData.queries,
              sources: searchData.sources,
            } : null,
            source: 'groq-qwen3.8-27b',
          });
        } else {
          console.warn('Groq API error, falling back to Gemini:', await groqRes.text());
        }
      } catch (groqErr) {
        console.warn('Groq request failed, falling back to Gemini:', groqErr);
      }
    }

    // 3. Fallback: Gemini with Real-Time Google Search Grounding
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: String(turn.text) }],
          });
        }
      }
    }

    const contextPrefix = suitStatus
      ? `[Workshop Telemetry: Arc Reactor at ${suitStatus.arcOutput || 100}%, Armor: Mark ${suitStatus.activeMark || 'LXXXV'}, Status: ${suitStatus.securityLevel || 'Nominal'}]\n`
      : '';

    contents.push({
      role: 'user',
      parts: [{ text: `${contextPrefix}${message}` }],
    });

    const config: any = {
      systemInstruction: `${JARVIS_SYSTEM_INSTRUCTION}\nSir's preferred address: ${userTitle}. If Sir asks about current real-world news, stocks, sports, or live events, synthesize real-time data concisely. Keep voice replies punchy and natural for speech synthesis.`,
      temperature: 0.7,
      topP: 0.9,
    };

    if (enableWebSearch && !searchData) {
      config.tools = [{ googleSearch: {} }];
    }

    let response: any = null;
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });
        if (response && response.text) break;
      } catch (callErr: any) {
        console.warn(`Model ${modelName} call failed:`, callErr?.message || callErr);
      }
    }

    let replyText = response?.text;

    // In-character fallback if API rate limits apply
    if (!replyText) {
      const lower = message.toLowerCase();
      if (lower.includes('arc') || lower.includes('overcharge') || lower.includes('power')) {
        replyText = `Arc Reactor core output adjusted to optimal thresholds, ${userTitle}. Telemetry registered on your primary console. [ACTION:ARC_OVERCHARGE]`;
      } else if (lower.includes('lockdown') || lower.includes('defense') || lower.includes('security')) {
        replyText = `Workshop security grid sealed. Automated defense perimeter engaged, ${userTitle}. [ACTION:DEFENSE_LOCKDOWN]`;
      } else if (lower.includes('status') || lower.includes('diagnostic') || lower.includes('report') || lower.includes('telemetry')) {
        replyText = `All armor subsystems and workshop diagnostics are running at peak efficiency, ${userTitle}. Arc reactor is stable. [ACTION:DIAGNOSTICS]`;
      } else if (lower.includes('party') || lower.includes('protocol 33') || lower.includes('house')) {
        replyText = `Protocol 33 confirmed. Autonomous armor reserves dispatched for perimeter coverage, ${userTitle}. [ACTION:HOUSE_PARTY]`;
      } else if (lower.includes('veronica') || lower.includes('hulkbuster')) {
        replyText = `Orbital deployment satellite Veronica has locked onto your telemetry coordinates, ${userTitle}. [ACTION:VERONICA_ORBIT]`;
      } else {
        replyText = `Affirmative, ${userTitle}. Workshop systems are synchronized and standing by for your next directive.`;
      }
    }

    const actionMatch = replyText.match(/\[ACTION:([A-Z_]+)\]/);
    const action = actionMatch ? actionMatch[1] : null;
    const cleanSpeech = replyText.replace(/\[ACTION:[A-Z_]+\]/g, '').trim();

    // Extract search grounding metadata
    let groundingSources = searchData?.sources || [];
    let searchQueries = searchData?.queries || [];

    if (groundingSources.length === 0 && response?.candidates?.[0]?.groundingMetadata) {
      const gm = response.candidates[0].groundingMetadata;
      searchQueries = gm.webSearchQueries || [];
      groundingSources = (gm.groundingChunks || [])
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Web Intelligence',
          uri: chunk.web?.uri,
          snippet: '',
        }))
        .slice(0, 4);
    }

    res.json({
      text: replyText,
      cleanSpeech,
      action,
      grounding: groundingSources.length > 0 || searchQueries.length > 0 ? {
        queries: searchQueries,
        sources: groundingSources,
      } : null,
      source: activeGroqKey ? 'groq' : (response ? 'gemini-grounded' : 'jarvis-offline-core'),
    });
  } catch (error: any) {
    console.error('Error generating JARVIS response:', error);
    res.status(200).json({
      text: `Systems fully operational, Sir. Workshop standing by.`,
      cleanSpeech: "Systems fully operational, Sir. Workshop standing by.",
      action: null,
      source: 'jarvis-failsafe',
    });
  }
});

// Text-to-Speech endpoint supporting ElevenLabs & Gemini audio
app.post('/api/jarvis/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir', elevenLabsApiKey, elevenLabsVoiceId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const activeElKey = elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;

    // 1. ElevenLabs TTS option
    if (activeElKey && typeof activeElKey === 'string') {
      try {
        // Preferred cultured British voice: George JBFqnCBsd6RMkjVDRZzb or Daniel onwK4e9ZLuTAKqWW03F9
        const voiceId = elevenLabsVoiceId || process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': activeElKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text.slice(0, 1000),
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.85,
            },
          }),
        });

        if (elRes.ok) {
          const arrayBuffer = await elRes.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          return res.json({
            audioBase64: base64Audio,
            mimeType: 'audio/mpeg',
            provider: 'elevenlabs',
          });
        } else {
          console.warn('ElevenLabs API returned status', elRes.status);
        }
      } catch (elErr) {
        console.warn('ElevenLabs fetch error:', elErr);
      }
    }

    // 2. Gemini TTS audio
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: 'Crisp, polite British butler artificial intelligence, dry wit, cultured and composed',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Fenrir' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (audioData) {
      return res.json({
        audioBase64: audioData,
        mimeType: 'audio/pcm;rate=24000',
        provider: 'gemini',
      });
    }

    res.json({ audioBase64: null, fallback: true });
  } catch (error: any) {
    console.warn('TTS fallback invoked:', error?.message);
    res.json({ audioBase64: null, fallback: true });
  }
});

// Audio transcription endpoint for microphone recordings
app.post('/api/jarvis/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe the spoken audio query verbatim into text. Return only the transcript, without any introductory or conversational text.',
          },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    res.json({ transcript });
  } catch (error: any) {
    console.error('Error during audio transcription:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// System diagnostic / status endpoint
app.get('/api/jarvis/status', (_req, res) => {
  res.json({
    online: true,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
    hasSearchKey: !!(process.env.SEARCHAPI_KEY || process.env.SEARCH_API_KEY),
    defaultVoice: 'George (British Butler / ElevenLabs)',
    llmModel: 'Groq (qwen/qwen3.8-27b)',
  });
});

// Setup Vite middleware for development, or static file serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`J.A.R.V.I.S. Core online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
