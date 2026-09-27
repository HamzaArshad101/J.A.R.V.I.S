import React, { useRef, useEffect } from 'react';
import { Send, Volume2, Mic, MicOff, Sparkles, Terminal, Globe, ExternalLink, Radio } from 'lucide-react';
import { ChatMessage, JarvisVoiceState } from '../types/jarvis';

interface ChatStreamProps {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (text: string) => void;
  onReplaySpeech: (text: string) => void;
  voiceState: JarvisVoiceState;
  micEnabled: boolean;
  onToggleMic: () => void;
  interimTranscript: string;
  userTitle: string;
  wakeWordActive: boolean;
}

const QUICK_PROMPTS = [
  'Status report on all systems, JARVIS',
  'What is the latest world technology news today?',
  'Current weather in Malibu and flight conditions',
  'Divert auxiliary power to front repulsors',
  'Analyze quantum tunneling resistance in Mark LXXXV armor',
  'Initiate workshop perimeter scan',
];

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  onReplaySpeech,
  voiceState,
  micEnabled,
  onToggleMic,
  interimTranscript,
  userTitle,
  wakeWordActive,
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const isListening = voiceState === 'listening' && micEnabled;

  return (
    <div className="flex flex-col h-[520px] bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-sm overflow-hidden shadow-xl">
      {/* HUD Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-300">
            WORKSHOP LOG & TELEMETRY STREAM
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMic}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
              micEnabled
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                : 'bg-red-950/40 text-red-400 border-red-500/40'
            }`}
          >
            {micEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            <span>{micEnabled ? 'MIC ON' : 'MIC OFF'}</span>
          </button>
          <span className="text-[10px] font-mono text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
            STARK-AI v5.2
          </span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar font-sans text-sm">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
            >
              {/* Sender & Timestamp Header */}
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className={`text-[10px] font-mono tracking-wider ${isUser ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {isUser ? userTitle.toUpperCase() : 'J.A.R.V.I.S.'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                {msg.source && (
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                    {msg.source}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-2.5 leading-relaxed relative ${
                  isUser
                    ? 'bg-cyan-950/70 border border-cyan-500/30 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Real-time search source links */}
                {msg.grounding?.sources && msg.grounding.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div className="flex items-center gap-1 text-cyan-400 text-[10px] mb-1">
                      <Globe className="w-3 h-3" />
                      <span>REAL-TIME SATELLITE SOURCES:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.grounding.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200 transition-colors"
                        >
                          <span className="truncate max-w-[160px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Replay Speech Button for JARVIS responses */}
                {!isUser && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                    <span className="text-[10px] font-mono text-slate-500">VOICE SYNTHESIZED</span>
                    <button
                      onClick={() => onReplaySpeech(msg.cleanSpeech || msg.text)}
                      title="Replay Voice Synthesis"
                      className="text-[10px] font-mono flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      <span>Replay</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Interim Live Transcript Indicator */}
        {interimTranscript && (
          <div className="flex items-start">
            <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-cyan-300 font-mono text-xs flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Transcribing: "{interimTranscript}"</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Strip */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-800/80 transition-colors whitespace-nowrap shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMic}
          title={micEnabled ? 'Click to Turn Off Microphone' : 'Click to Turn On Microphone'}
          className={`p-2.5 rounded-lg border transition-all shrink-0 ${
            micEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-red-500/20 text-red-300 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          }`}
        >
          {micEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-red-400" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            micEnabled
              ? 'Speak with your voice, say "JARVIS", or type instruction...'
              : 'Microphone is OFF. Click Mic button to turn on, or type here...'
          }
          className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-semibold text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Transmit</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
