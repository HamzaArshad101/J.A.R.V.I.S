import React from 'react';
import { X, Volume2, Mic, UserCheck, ShieldCheck, Globe, Cpu, Radio, Sparkles, Key, CheckCircle2 } from 'lucide-react';
import { JarvisApiConfig } from '../types/jarvis';

interface JarvisSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JarvisApiConfig;
  updateConfig: (updates: Partial<JarvisApiConfig>) => void;
  serverStatus?: {
    hasGroqKey: boolean;
    hasElevenLabsKey: boolean;
    hasSearchKey: boolean;
  };
}

const TITLE_PRESETS = ['Sir', 'Mr. Stark', 'Tony', 'Boss', 'Commander'];

export const JarvisSettingsModal: React.FC<JarvisSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  updateConfig,
  serverStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold font-mono tracking-wider text-cyan-400">
            J.A.R.V.I.S. SYSTEM ARCHITECTURE & API MATRIX
          </h2>
        </div>

        {/* Live Active Server Indicators */}
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-lg mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400">GROQ LLM</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400">ELEVENLABS TTS</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-400">SEARCHAPI GOOGLE</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
            </span>
          </div>
        </div>

        {/* Creator & System Architect Spotlight */}
        <div className="p-3 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-lg mb-4 flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-mono font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              HA
            </div>
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                SYSTEM CREATOR & ARCHITECT
              </div>
              <div className="text-sm font-mono font-bold text-white tracking-wider flex items-center gap-2">
                HAMZA ARSHAD
                <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 border border-cyan-500/30 px-2 py-1 rounded">
            ORIGINAL AUTHOR
          </span>
        </div>

        <div className="space-y-5">
          {/* Honorific / Address */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              ADDRESS PROTOCOL (HONORIFIC)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {TITLE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateConfig({ userTitle: preset })}
                  className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                    config.userTitle === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={config.userTitle}
              onChange={(e) => updateConfig({ userTitle: e.target.value })}
              placeholder="Or enter custom address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Wake Word Activation */}
          <div className="p-3 bg-slate-950/80 border border-cyan-500/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${config.wakeWordEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-mono text-slate-200 font-semibold flex items-center gap-1.5">
                    "JARVIS" WAKE-WORD ACTIVATION
                    <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[10px] rounded border border-cyan-500/30">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Say "JARVIS" or "Hey JARVIS" to wake him up and talk directly
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ wakeWordEnabled: !config.wakeWordEnabled })}
                className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                  config.wakeWordEnabled
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {config.wakeWordEnabled ? 'ACTIVE' : 'STANDBY'}
              </button>
            </div>
          </div>

          {/* Real-Time Google Web Search Grounding */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${config.enableWebSearch ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-mono text-slate-200 font-semibold">
                    REAL-TIME WEB DATA & GOOGLE SEARCH
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Live SearchApi.io feed for real-time news, weather, sports, and world data
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ enableWebSearch: !config.enableWebSearch })}
                className={`px-3 py-1 text-xs font-mono rounded border transition-all ${
                  config.enableWebSearch
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {config.enableWebSearch ? 'ENABLED' : 'OFFLINE'}
              </button>
            </div>
          </div>

          {/* Voice Engine Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-2">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              VOICE GENERATION SYSTEM
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateConfig({ voiceEngine: 'elevenlabs' })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  config.voiceEngine === 'elevenlabs'
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-mono font-semibold text-cyan-400">ElevenLabs Turbo</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Cultured British Butler (George/Adam)
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ voiceEngine: 'browser' })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  config.voiceEngine === 'browser'
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-mono font-semibold">Web Speech API</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Instant zero-latency browser speech
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ voiceEngine: 'gemini' })}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  config.voiceEngine === 'gemini'
                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-mono font-semibold">Gemini Neural</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Prebuilt Fenrir studio neural voice
                </div>
              </button>
            </div>
          </div>

          {/* Override Keys (Optional if user wants to change) */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                API CREDENTIAL OVERRIDES
              </span>
              <span className="text-[10px] text-emerald-400">SERVER KEYS ACTIVE</span>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">Groq API Key (gsk_...)</div>
              <input
                type="password"
                value={config.groqApiKey}
                onChange={(e) => updateConfig({ groqApiKey: e.target.value })}
                placeholder="Using active server key (Groq Llama / Qwen)"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">ElevenLabs API Key (xi-api-key)</div>
              <input
                type="password"
                value={config.elevenLabsApiKey}
                onChange={(e) => updateConfig({ elevenLabsApiKey: e.target.value })}
                placeholder="Using active server key (ElevenLabs Turbo)"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">ElevenLabs Voice ID</div>
              <input
                type="text"
                value={config.elevenLabsVoiceId}
                onChange={(e) => updateConfig({ elevenLabsVoiceId: e.target.value })}
                placeholder="Voice ID (Default: JBFqnCBsd6RMkjVDRZzb / British Butler George)"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Sound FX & Auto-Speak Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={config.soundFXEnabled}
                onChange={(e) => updateConfig({ soundFXEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-300">HUD Synthesizer FX</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSpeak}
                onChange={(e) => updateConfig({ autoSpeak: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs font-mono text-slate-300">Auto Vocalize Replies</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            CONFIRM & ENGAGE
          </button>
        </div>
      </div>
    </div>
  );
};
