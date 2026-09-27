import React from 'react';
import { Volume2, VolumeX, Settings, Mic, MicOff, Radio, Terminal, Sparkles, Globe, RotateCcw } from 'lucide-react';
import { JarvisVoiceState } from '../types/jarvis';

interface TopBarProps {
  activeTab: 'console' | 'telemetry' | 'protocols';
  setActiveTab: (tab: 'console' | 'telemetry' | 'protocols') => void;
  voiceState: JarvisVoiceState;
  micEnabled: boolean;
  onToggleMic: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenV0Prompt: () => void;
  onResetSession: () => void;
  wakeWordActive: boolean;
  onToggleWakeWord: () => void;
  webSearchActive: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  voiceState,
  micEnabled,
  onToggleMic,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenV0Prompt,
  onResetSession,
  wakeWordActive,
  onToggleWakeWord,
  webSearchActive,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('console');
            }}
            className="text-base sm:text-lg font-bold tracking-widest text-cyan-400 font-mono flex items-center gap-2 hover:text-cyan-300 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span>J.A.R.V.I.S.</span>
          </a>

          {/* Prominent Creator Badge */}
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded bg-cyan-950/80 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80 hidden sm:inline">CREATOR:</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-cyan-200 whitespace-nowrap">HAMZA ARSHAD</span>
          </div>

          {/* Real-time search status indicator */}
          {webSearchActive && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-3 h-3 animate-spin text-cyan-400" />
              LIVE SATELLITE
            </span>
          )}

          {/* Persistent Mic status badge */}
          {micEnabled ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              MIC ACTIVE
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/40 text-red-400 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              MIC MUTED
            </span>
          )}
        </div>

        {/* Clean Text Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              activeTab === 'console'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HUD CONSOLE
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              activeTab === 'telemetry'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ARMOR TELEMETRY
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              activeTab === 'protocols'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PROTOCOLS
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* v0 Master Prompt Button */}
          <button
            onClick={onOpenV0Prompt}
            title="View & Copy Master v0.dev Prompt"
            className="px-2.5 py-1.5 rounded text-xs font-mono bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25 hover:border-purple-400 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_10px_rgba(168,85,247,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline font-semibold">v0 Prompt</span>
          </button>

          {/* Quick Session Refresh Button */}
          <button
            onClick={onResetSession}
            title="Refresh Workshop Session & Calibrate Systems"
            className="p-2 rounded text-xs bg-slate-900 text-slate-400 border border-slate-800 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px] font-mono">Refresh</span>
          </button>

          {/* Wake Word Mode Toggle */}
          <button
            onClick={onToggleWakeWord}
            title="Toggle Continuous 'JARVIS' Wake Word Detection"
            className={`px-2.5 py-1.5 rounded text-xs font-mono border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              wakeWordActive && micEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${wakeWordActive && micEnabled ? 'animate-pulse text-amber-400' : ''}`} />
            <span className="hidden sm:inline font-bold">Wake: "JARVIS"</span>
          </button>

          {/* Clear Master Microphone On/Off Toggle Button */}
          <button
            onClick={onToggleMic}
            title={micEnabled ? 'Click to Turn Off Microphone' : 'Click to Turn On Microphone'}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              micEnabled
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30'
                : 'bg-red-500/20 border-red-500/80 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/30'
            }`}
          >
            {micEnabled ? (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mic ON</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-red-400" />
                <span>Mic OFF</span>
              </>
            )}
          </button>

          {/* Mute Audio SFX & Voice */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`p-2 rounded text-xs border transition-colors ${
              isMuted
                ? 'bg-slate-900 text-red-400 border-red-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Configure JARVIS Honorific & Voice Parameters"
            className="p-2 rounded text-xs bg-slate-900 text-slate-400 border border-slate-800 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
