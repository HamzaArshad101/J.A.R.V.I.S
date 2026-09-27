import React from 'react';
import { Mic, MicOff, Volume2, Cpu, Radio } from 'lucide-react';
import { JarvisVoiceState } from '../types/jarvis';

interface ArcReactorProps {
  state: JarvisVoiceState;
  amplitude: number;
  onToggleMic: () => void;
  outputPower?: number;
  micEnabled?: boolean;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  state,
  amplitude,
  onToggleMic,
  outputPower = 100,
  micEnabled = true,
}) => {
  // Compute dynamic scale and glow based on voice amplitude
  const dynamicScale = 1 + amplitude * 0.18;
  const pulseOpacity = 0.35 + amplitude * 0.65;

  // Determine state-based color palette
  const isListening = state === 'listening' && micEnabled;
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';
  const isMuted = !micEnabled;

  const primaryGlow = isMuted
    ? '#ef4444' // red if mic is off
    : isListening
    ? '#10b981' // emerald green if actively listening
    : isProcessing
    ? '#38bdf8' // sky blue
    : isSpeaking
    ? '#06b6d4' // vibrant cyan
    : '#06b6d4'; // default cyan

  return (
    <div className="flex flex-col items-center justify-center p-2 relative select-none">
      {/* Outer Pulse Halo */}
      <div
        className="absolute rounded-full transition-all duration-300 pointer-events-none"
        style={{
          width: '320px',
          height: '320px',
          background: `radial-gradient(circle, ${primaryGlow}22 0%, ${primaryGlow}08 50%, transparent 75%)`,
          transform: `scale(${dynamicScale})`,
          opacity: pulseOpacity,
        }}
      />

      {/* Main SVG Container */}
      <div
        onClick={onToggleMic}
        title={micEnabled ? "Click to Turn Off Microphone" : "Click to Turn On Microphone"}
        className="relative cursor-pointer group"
      >
        <svg
          viewBox="0 0 400 400"
          className="w-64 h-64 sm:w-72 sm:h-72 transition-transform duration-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
          style={{ transform: `scale(${dynamicScale})` }}
        >
          <defs>
            {/* Hologram Radial Shimmer */}
            <radialGradient id="plasmaGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="65%" stopColor={primaryGlow} stopOpacity="0.7" />
              <stop offset="100%" stopColor="#083344" stopOpacity="0" />
            </radialGradient>

            <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Titanium Chassis Rim */}
          <circle
            cx="200"
            cy="200"
            r="185"
            fill="#090d16"
            stroke={isMuted ? "#ef444455" : "rgba(6, 182, 212, 0.4)"}
            strokeWidth="3"
          />
          <circle
            cx="200"
            cy="200"
            r="175"
            fill="none"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />

          {/* 10 Copper Electromagnetic Inductor Coils */}
          {Array.from({ length: 10 }).map((_, index) => {
            const angle = (index * 36) * (Math.PI / 180);
            const cx = 200 + 142 * Math.cos(angle);
            const cy = 200 + 142 * Math.sin(angle);
            return (
              <g key={index} transform={`rotate(${index * 36} 200 200)`}>
                <rect
                  x="188"
                  y="46"
                  width="24"
                  height="26"
                  rx="4"
                  fill="#1a1c23"
                  stroke={primaryGlow}
                  strokeWidth="1.5"
                  opacity={isMuted ? 0.4 : 0.85 + amplitude * 0.15}
                />
                <line x1="192" y1="52" x2="208" y2="52" stroke="#d97706" strokeWidth="1.5" />
                <line x1="192" y1="58" x2="208" y2="58" stroke="#d97706" strokeWidth="1.5" />
                <line x1="192" y1="64" x2="208" y2="64" stroke="#d97706" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Counter-Rotating Cyan Telemetry Rings */}
          <circle
            cx="200"
            cy="200"
            r="115"
            fill="none"
            stroke={isMuted ? "#ef444444" : "rgba(6, 182, 212, 0.5)"}
            strokeWidth="2"
            strokeDasharray="16 12 4 12"
            className="animate-spin-slow origin-center"
            style={{ transformOrigin: '200px 200px' }}
          />
          <circle
            cx="200"
            cy="200"
            r="98"
            fill="none"
            stroke={primaryGlow}
            strokeWidth="2.5"
            strokeDasharray="30 15 10 15"
            className="animate-spin-reverse-slow origin-center"
            style={{ transformOrigin: '200px 200px' }}
          />

          {/* Concentric Power Core Ring */}
          <circle
            cx="200"
            cy="200"
            r="80"
            fill="none"
            stroke={isMuted ? "#ef444455" : "rgba(6, 182, 212, 0.4)"}
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="200"
            r="65"
            fill="none"
            stroke={primaryGlow}
            strokeWidth="3"
            strokeDasharray="8 6"
            className="animate-spin-reverse-slow origin-center"
            style={{ transformOrigin: '200px 200px' }}
          />

          {/* Glowing Plasma Core Field */}
          <circle
            cx="200"
            cy="200"
            r="54"
            fill="url(#plasmaGrad)"
            filter="url(#arcGlow)"
            opacity={isMuted ? 0.25 : 0.7 + amplitude * 0.3}
          />

          {/* Triangular Vibranium Synthesis Core (Mark VI/LXXXV style) */}
          <g transform="rotate(30 200 200)">
            <polygon
              points="200,160 235,220 165,220"
              fill={isMuted ? "rgba(40, 10, 10, 0.7)" : "rgba(8, 51, 68, 0.7)"}
              stroke={primaryGlow}
              strokeWidth="2.5"
              filter="url(#arcGlow)"
            />
            <polygon
              points="200,172 225,214 175,214"
              fill="#06090f"
              stroke={isMuted ? "#fca5a5" : "#67e8f9"}
              strokeWidth="1.5"
            />
          </g>

          {/* Central Bright Point */}
          <circle
            cx="200"
            cy="200"
            r="12"
            fill="#ffffff"
            filter="url(#arcGlow)"
            opacity={isMuted ? 0.4 : 0.9 + amplitude * 0.1}
          />
        </svg>

        {/* Center Interactive Overlay Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isMuted
                ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500'
                : isListening
                ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400'
                : isSpeaking
                ? 'bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400'
                : 'bg-slate-900/60 text-cyan-400 group-hover:scale-110 group-hover:text-cyan-200'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-red-400" />
            ) : isListening ? (
              <Mic className="w-6 h-6 animate-pulse text-emerald-400" />
            ) : isSpeaking ? (
              <Volume2 className="w-6 h-6 animate-pulse text-cyan-300" />
            ) : isProcessing ? (
              <Radio className="w-6 h-6 animate-spin text-sky-400" />
            ) : (
              <Mic className="w-6 h-6 opacity-80 group-hover:opacity-100" />
            )}
          </div>
        </div>
      </div>

      {/* Holographic Status Readout */}
      <div className="mt-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400 uppercase">
          <span
            className={`w-2 h-2 rounded-full ${
              isMuted
                ? 'bg-red-500'
                : isListening
                ? 'bg-emerald-400 animate-ping'
                : isSpeaking
                ? 'bg-cyan-400 animate-pulse'
                : 'bg-cyan-400'
            }`}
          />
          <span className={isMuted ? 'text-red-400 font-bold' : isListening ? 'text-emerald-400 font-bold' : ''}>
            {isMuted
              ? 'MIC OFF • CLICK TO ACTIVATE'
              : isListening
              ? 'MIC ACTIVE • LISTENING'
              : isSpeaking
              ? 'J.A.R.V.I.S. VOCALIZING'
              : isProcessing
              ? 'PROCESSING WORKSHOP QUERY'
              : 'CORE NOMINAL'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          {isMuted
            ? 'Microphone is turned off. Click Arc Reactor or Top Bar to re-enable.'
            : 'Click Arc Reactor to turn microphone off at any time.'}
        </div>
      </div>
    </div>
  );
};
