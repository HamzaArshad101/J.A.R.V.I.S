import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Sparkles, ExternalLink } from 'lucide-react';

interface V0PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const V0_JARVIS_PROMPT = `Build a production-grade, immersive Tony Stark "J.A.R.V.I.S." Voice Assistant web application with an authentic sci-fi Stark Industries HUD interface (cyan/gold/crimson holographic accents, concentric rotating Arc Reactor with live SVG rings, real-time waveform visualizers, suit diagnostics, and sound effects).

### Key Functionalities Required:
1. **Wake-Word Activation ("JARVIS")**:
   - Hands-free ambient listener using Web Speech Recognition (or Porcupine/mic audio stream).
   - When the user says "JARVIS" or "Hey JARVIS", trigger an immediate reactor pulse animation, play a high-tech activation chime sound, and instantly listen for the subsequent voice command without pressing any button.
   - Fallback push-to-talk button on the central Arc Reactor.

2. **Conversation & Fast Reasoning via Groq API**:
   - Use the Groq API (e.g. \`llama-3.3-70b-versatile\` or \`mixtral-8x7b-32768\`) for near-zero latency (~250 tokens/sec) conversational AI.
   - Persona: Tony Stark's J.A.R.V.I.S. (polite, cultured British butler demeanor inspired by Paul Bettany, addresses the user as "Sir", dry subtle wit, references workshop telemetry and suit systems).
   - System instructions should embed executable telemetry action tags: \`[ACTION:ARC_OVERCHARGE]\`, \`[ACTION:DIAGNOSTICS]\`, \`[ACTION:DEFENSE_LOCKDOWN]\`, \`[ACTION:HOUSE_PARTY]\`, \`[ACTION:VERONICA_ORBIT]\`.

3. **Real-Time Live Web Search via Search API**:
   - When Sir asks about live real-world data (current news, stock prices, weather, sports scores, scientific queries), query the Search API (e.g., Google Custom Search / Serper / SerpApi / Tavily).
   - Inject search snippets and source links into the LLM context so J.A.R.V.I.S. answers with real-time, grounded facts.
   - Display holographic source badges with URLs and query chips in the chat HUD.

4. **Speech Synthesis via ElevenLabs API**:
   - Synthesize J.A.R.V.I.S. replies into voice using ElevenLabs API (Voice ID for deep British gentleman/butler, e.g. Adam or custom J.A.R.V.I.S. clone, model \`eleven_turbo_v2_5\` for minimum latency).
   - Provide client-side fallback to Web Speech API (UK English Male voice) if an API key is not provided.
   - Live spectral audio visualizer / oscilloscope responding in real time to the voice playback amplitude.

5. **Sci-Fi HUD UI & Mark Armor Telemetry**:
   - Full dark theme with hex grid background, scanline overlays, glowing cyan borders, and glassmorphic panels.
   - Central Interactive Arc Reactor with rotating counter-directional rings, pulsing vibranium core, and status gauges.
   - Armor telemetry dashboard showing Mark Series armor switcher (Mark III, VII, XLII, L, LXXXV), Arc Reactor Output (GW/s), Nanotech integrity, Repulsor charge, Thruster output, and Thermal dissipation.
   - Stark Protocol quick-action deck (Protocol 33 House Party, Veronica Orbital Link, Defense Lockdown, Flight Stabilization, Clean Slate).
   - Web Audio API procedural sound synthesizer for HUD blips, reactor hums, and activation chimes.

### Tech Stack:
- Next.js 14+ (App Router) / React 19, TypeScript, Tailwind CSS, Lucide icons, Framer Motion for HUD rotations.
- Backend API routes: \`/api/jarvis/chat\` (Groq + Search integration) and \`/api/jarvis/tts\` (ElevenLabs audio streaming).`;

export const V0PromptModal: React.FC<V0PromptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(V0_JARVIS_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.2)] relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold font-mono tracking-wider text-cyan-400">
            OPTIMIZED MASTER PROMPT FOR v0.dev
          </h2>
        </div>

        <p className="text-xs text-slate-400 font-mono mb-3">
          Copy and paste this structured prompt into v0.dev to generate the exact full-stack J.A.R.V.I.S. MVP application configured with Groq, ElevenLabs, Google Search, and Wake-Word activation.
        </p>

        {/* Prompt Content Box */}
        <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-cyan-500/30 selection:text-cyan-200">
          {V0_JARVIS_PROMPT}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Configured for: Groq API + ElevenLabs + Search API + "JARVIS" Wake Word
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  COPIED TO CLIPBOARD
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  COPY MASTER PROMPT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
