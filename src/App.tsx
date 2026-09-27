import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { ArcReactor } from './components/ArcReactor';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { ChatStream } from './components/ChatStream';
import { SuitTelemetry } from './components/SuitTelemetry';
import { ProtocolDeck, STARK_PROTOCOLS } from './components/ProtocolDeck';
import { JarvisSettingsModal } from './components/JarvisSettingsModal';
import { V0PromptModal } from './components/V0PromptModal';
import { ChatMessage, JarvisVoiceState, SuitTelemetryData, StarkProtocol, JarvisApiConfig } from './types/jarvis';
import { jarvisVoice } from './utils/speech';
import { jarvisListener } from './utils/speechRecognition';
import { soundFX } from './utils/audioEffects';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'console' | 'telemetry' | 'protocols'>('console');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [v0ModalOpen, setV0ModalOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState({
    hasGroqKey: true,
    hasElevenLabsKey: true,
    hasSearchKey: true,
  });

  // Master Microphone State: user can freely turn ON or OFF
  const [micEnabled, setMicEnabled] = useState(true);

  // System & API Configuration
  const [config, setConfig] = useState<JarvisApiConfig>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('jarvis_config') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      userTitle: 'Sir',
      voiceEngine: 'elevenlabs',
      groqApiKey: '',
      elevenLabsApiKey: '',
      elevenLabsVoiceId: 'JBFqnCBsd6RMkjVDRZzb', // George - Cultured British Butler
      searchApiKey: '',
      enableWebSearch: true,
      wakeWordEnabled: true,
      autoSpeak: true,
      soundFXEnabled: true,
    };
  });

  const updateConfig = (updates: Partial<JarvisApiConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('jarvis_config', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Voice & Audio Real-Time State
  const [voiceState, setVoiceState] = useState<JarvisVoiceState>('idle');
  const [voiceAmplitude, setVoiceAmplitude] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [wakeWordAlert, setWakeWordAlert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Conversation State
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      text: 'Good day, Sir. All Stark Industries systems are online and calibrated. Designed and engineered by creator Hamza Arshad. The workshop is at your disposal. Voice activation and real-time satellite search are standing by. You can click the Arc Reactor or the Mic button anytime to turn the microphone on or off. How may I assist you?',
      cleanSpeech: 'Good day, Sir. All Stark Industries systems are online and calibrated. Designed and engineered by Hamza Arshad. The workshop is at your disposal. Voice activation and real-time satellite search are standing by. How may I assist you?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'SYSTEM_READY',
      audioAvailable: true,
      source: 'Groq + ElevenLabs Online',
    },
  ]);

  // Telemetry State
  const [telemetry, setTelemetry] = useState<SuitTelemetryData>({
    activeMark: 'Mark LXXXV',
    arcOutput: 100.0,
    coreTemp: 34.2,
    nanoIntegrity: 99.4,
    leftRepulsor: 100,
    rightRepulsor: 100,
    thrusterOutput: 88,
    securityLevel: 'Nominal',
    protocolActive: null,
  });

  // Fetch status on mount
  useEffect(() => {
    fetch('/api/jarvis/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.online) {
          setServerStatus({
            hasGroqKey: data.hasGroqKey,
            hasElevenLabsKey: data.hasElevenLabsKey,
            hasSearchKey: data.hasSearchKey,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Keep soundFX and speech engine in sync with settings
  useEffect(() => {
    soundFX.setMuted(!config.soundFXEnabled);
  }, [config.soundFXEnabled]);

  useEffect(() => {
    jarvisVoice.setVoicePreference(config.voiceEngine);
  }, [config.voiceEngine]);

  // Hook up audio amplitude for visual reactivity in Arc Reactor & Waveform
  useEffect(() => {
    jarvisVoice.setAmplitudeCallback((level) => {
      setVoiceAmplitude(level);
    });

    return () => {
      jarvisVoice.stop();
    };
  }, []);

  // Vocalize a message with JARVIS's voice
  const speakWithJarvis = useCallback((text: string) => {
    if (!config.autoSpeak) return;

    setVoiceState('speaking');
    jarvisListener.setJarvisSpeaking(true);
    soundFX.playJarvisAcknowledge();

    jarvisVoice.speak(text, {
      elevenLabsApiKey: config.elevenLabsApiKey,
      elevenLabsVoiceId: config.elevenLabsVoiceId,
      onStart: () => {
        setVoiceState('speaking');
        jarvisListener.setJarvisSpeaking(true);
      },
      onEnd: () => {
        setVoiceState('idle');
        setVoiceAmplitude(0);
        jarvisListener.setJarvisSpeaking(false);
      },
      onError: () => {
        setVoiceState('idle');
        setVoiceAmplitude(0);
        jarvisListener.setJarvisSpeaking(false);
      },
    });
  }, [config.autoSpeak, config.elevenLabsApiKey, config.elevenLabsVoiceId]);

  // Handle Action Tags parsed from JARVIS response
  const applyJarvisAction = useCallback((action: string | null) => {
    if (!action) return;

    switch (action) {
      case 'DIAGNOSTICS':
        soundFX.playProtocolEngaged();
        setTelemetry((prev) => ({
          ...prev,
          nanoIntegrity: 100,
          leftRepulsor: 100,
          rightRepulsor: 100,
          protocolActive: 'Diagnostics Complete',
        }));
        break;

      case 'ARC_OVERCHARGE':
        soundFX.playArcReactorSurge();
        setTelemetry((prev) => ({
          ...prev,
          arcOutput: 145.0,
          coreTemp: 48.7,
          protocolActive: 'Core Overcharged (145%)',
        }));
        setTimeout(() => {
          setTelemetry((prev) => ({
            ...prev,
            arcOutput: 100.0,
            coreTemp: 34.2,
          }));
        }, 8000);
        break;

      case 'DEFENSE_LOCKDOWN':
        soundFX.playLockdownAlarm();
        setTelemetry((prev) => ({
          ...prev,
          securityLevel: 'Lockdown',
          protocolActive: 'Lockdown Active',
        }));
        break;

      case 'HOUSE_PARTY':
        soundFX.playProtocolEngaged();
        setTelemetry((prev) => ({
          ...prev,
          protocolActive: 'House Party (Prot-33)',
        }));
        break;

      case 'VERONICA_ORBIT':
        soundFX.playProtocolEngaged();
        setTelemetry((prev) => ({
          ...prev,
          protocolActive: 'Veronica Uplink',
        }));
        break;

      case 'CLEAN_SLATE':
        soundFX.playProtocolEngaged();
        setTelemetry((prev) => ({
          ...prev,
          securityLevel: 'Nominal',
          arcOutput: 100.0,
          protocolActive: null,
        }));
        break;

      case 'FLIGHT_TELEMETRY':
        soundFX.playProtocolEngaged();
        setTelemetry((prev) => ({
          ...prev,
          thrusterOutput: 98,
          protocolActive: 'Flight Calibrated',
        }));
        break;

      default:
        break;
    }
  }, []);

  // Send message to JARVIS backend
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setInterimTranscript('');

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setVoiceState('processing');

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.cleanSpeech || m.text,
      }));

      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: historyPayload,
          userTitle: config.userTitle,
          suitStatus: {
            arcOutput: `${telemetry.arcOutput.toFixed(1)} GW/s`,
            activeMark: telemetry.activeMark,
            securityLevel: telemetry.securityLevel,
          },
          groqApiKey: config.groqApiKey,
          searchApiKey: config.searchApiKey,
          enableWebSearch: config.enableWebSearch,
        }),
      });

      if (!res.ok) {
        throw new Error('JARVIS server communication failed');
      }

      const data = await res.json();
      const replyCleanSpeech = data.cleanSpeech || data.text || "Understood, Sir. Telemetry confirmed.";

      const jarvisMsg: ChatMessage = {
        id: `jarvis-${Date.now()}`,
        sender: 'jarvis',
        text: data.text || replyCleanSpeech,
        cleanSpeech: replyCleanSpeech,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data.action || null,
        audioAvailable: true,
        source: data.source,
        grounding: data.grounding || null,
      };

      setMessages((prev) => [...prev, jarvisMsg]);
      applyJarvisAction(data.action);
      speakWithJarvis(replyCleanSpeech);
    } catch (err: any) {
      console.error('Error in handleSendMessage:', err);
      const fallbackSpeech = `Apologies, ${config.userTitle}. A momentary communication latency in the satellite link. I am standing by.`;
      const errorMsg: ChatMessage = {
        id: `jarvis-err-${Date.now()}`,
        sender: 'jarvis',
        text: fallbackSpeech,
        cleanSpeech: fallbackSpeech,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      speakWithJarvis(fallbackSpeech);
    }
  }, [messages, config.userTitle, config.groqApiKey, config.searchApiKey, config.enableWebSearch, telemetry, applyJarvisAction, speakWithJarvis]);

  // Continuous Always-On Audio Listener
  const startContinuousListening = useCallback(async () => {
    if (!jarvisListener.isSupported()) return;

    jarvisListener.setWakeWordMode(true);
    await jarvisListener.startListening({
      onStart: () => {
        setVoiceState('listening');
      },
      onWakeWordDetected: (_phrase, subsequent) => {
        soundFX.playArcReactorSurge();
        setWakeWordAlert(true);
        setTimeout(() => setWakeWordAlert(false), 2500);

        setVoiceAmplitude(0.5);
        if (subsequent && subsequent.length > 2) {
          handleSendMessage(subsequent);
        } else {
          speakWithJarvis(`Yes, ${config.userTitle}? Standing by for your instructions.`);
        }
      },
      onTranscript: (interim) => {
        setInterimTranscript(interim);
        if (interim.length > 0) {
          setVoiceAmplitude(0.25 + Math.random() * 0.35);
        }
      },
      onFinalResult: (finalText) => {
        setVoiceAmplitude(0);
        setInterimTranscript('');
        handleSendMessage(finalText);
      },
      onError: (err) => {
        console.warn('Continuous microphone notice:', err);
      },
      onEnd: () => {
        setVoiceAmplitude(0);
      },
    });
  }, [config.userTitle, handleSendMessage, speakWithJarvis]);

  // Turn microphone off completely
  const handleTurnOffMic = useCallback(() => {
    soundFX.playMicStopBeep();
    jarvisListener.turnOffMicrophone();
    setMicEnabled(false);
    setVoiceState('idle');
    setVoiceAmplitude(0);
    setInterimTranscript('');
  }, []);

  // Turn microphone on
  const handleTurnOnMic = useCallback(() => {
    soundFX.playMicListeningBeep();
    setMicEnabled(true);
    startContinuousListening();
  }, [startContinuousListening]);

  // Master Toggle: Turns Mic completely ON or OFF
  const handleToggleMic = useCallback(() => {
    if (micEnabled) {
      handleTurnOffMic();
    } else {
      handleTurnOnMic();
    }
  }, [micEnabled, handleTurnOffMic, handleTurnOnMic]);

  // Start continuous listening immediately on mount if micEnabled is true
  useEffect(() => {
    if (micEnabled) {
      startContinuousListening();
    }

    const unlockAudio = () => {
      if (micEnabled) {
        startContinuousListening();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [micEnabled, startContinuousListening]);

  // Toggle wake-word activation
  const handleToggleWakeWord = () => {
    const nextState = !config.wakeWordEnabled;
    updateConfig({ wakeWordEnabled: nextState });
    jarvisListener.setWakeWordMode(nextState);
    if (nextState) {
      soundFX.playProtocolEngaged();
      if (!micEnabled) {
        setMicEnabled(true);
      }
      startContinuousListening();
    }
  };

  // Instant Session Refresh
  const handleResetSession = useCallback(() => {
    soundFX.playArcReactorSurge();
    jarvisVoice.stop();
    setInterimTranscript('');
    setVoiceState('idle');
    setVoiceAmplitude(0);
    setTelemetry({
      activeMark: 'Mark LXXXV',
      arcOutput: 100.0,
      coreTemp: 34.2,
      nanoIntegrity: 100,
      leftRepulsor: 100,
      rightRepulsor: 100,
      thrusterOutput: 88,
      securityLevel: 'Nominal',
      protocolActive: 'Systems Recalibrated',
    });
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'jarvis',
        text: `Session re-initialized, ${config.userTitle}. All workshop buffers cleared and live satellite telemetry synchronized. System engineered by Hamza Arshad. Standing by.`,
        cleanSpeech: `Session re-initialized, ${config.userTitle}. All workshop buffers cleared and live satellite telemetry synchronized. Standing by.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'SYSTEM_READY',
        audioAvailable: true,
        source: 'Groq + ElevenLabs Online',
      },
    ]);
    speakWithJarvis(`Session refreshed, ${config.userTitle}. Standing by.`);
    if (micEnabled) {
      startContinuousListening();
    }
    setRefreshKey((k) => k + 1);
  }, [config.userTitle, micEnabled, speakWithJarvis, startContinuousListening]);

  // Replay speech button in chat
  const handleReplaySpeech = (text: string) => {
    speakWithJarvis(text);
  };

  // Execute protocol directly from protocol deck
  const handleExecuteProtocol = (protocol: StarkProtocol) => {
    soundFX.playProtocolEngaged();
    handleSendMessage(protocol.prompt);
  };

  // Overcharge Arc Core directly
  const handleTriggerOvercharge = () => {
    soundFX.playArcReactorSurge();
    applyJarvisAction('ARC_OVERCHARGE');
    handleSendMessage('JARVIS, overcharge the Arc Reactor core by 45%.');
  };

  // Calibrate repulsors
  const handleCalibrateRepulsors = () => {
    soundFX.playProtocolEngaged();
    applyJarvisAction('REPULSOR_CALIBRATE');
    handleSendMessage('JARVIS, initiate full repulsor and thruster alignment.');
  };

  return (
    <div key={refreshKey} className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Sci-Fi Hologram Grid & Scanline Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-cyan-950/20 via-transparent to-slate-950 pointer-events-none" />

      {/* Wake-Word Visual Activation Banner */}
      {wakeWordAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-cyan-950/90 border border-cyan-400 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.8)] flex items-center gap-3 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
            "JARVIS" WAKE-WORD DETECTED • AT YOUR SERVICE, {config.userTitle.toUpperCase()}
          </span>
        </div>
      )}

      {/* Top Stark Navigation Bar */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        voiceState={voiceState}
        micEnabled={micEnabled}
        onToggleMic={handleToggleMic}
        isMuted={!config.soundFXEnabled}
        onToggleMute={() => updateConfig({ soundFXEnabled: !config.soundFXEnabled })}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenV0Prompt={() => setV0ModalOpen(true)}
        onResetSession={handleResetSession}
        wakeWordActive={config.wakeWordEnabled}
        onToggleWakeWord={handleToggleWakeWord}
        webSearchActive={config.enableWebSearch}
      />

      {/* Main HUD Body */}
      <main className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden max-w-7xl mx-auto w-full p-3 sm:p-4 gap-4">
        {/* Left / Center Core Deck: Arc Reactor & Holographic HUD */}
        <div className="flex-1 flex flex-col justify-between items-center bg-slate-900/60 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          {/* Corner HUD accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60" />

          {/* Central Reactor System Title & Telemetry Header */}
          <div className="w-full flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-cyan-400/80">
                STARK INDUSTRIES • WORKSHOP MAIN DECK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                CREATOR: HAMZA ARSHAD
              </span>
            </div>
            <div className="flex items-center gap-3">
              {micEnabled ? (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  MIC ACTIVE
                </div>
              ) : (
                <div className="text-[11px] font-mono text-red-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  MIC MUTED
                </div>
              )}
              <div className="text-[11px] font-mono text-cyan-300/70">
                STATUS: <span className="text-cyan-400 font-bold">{telemetry.securityLevel.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Holographic Arc Reactor */}
          <div className="my-auto py-4 flex flex-col items-center justify-center relative">
            <ArcReactor
              state={voiceState}
              amplitude={voiceAmplitude}
              onToggleMic={handleToggleMic}
              outputPower={telemetry.arcOutput}
              micEnabled={micEnabled}
            />

            {/* Live Audio Oscilloscope */}
            <div className="w-full max-w-sm mt-4">
              <WaveformVisualizer
                state={micEnabled ? voiceState : 'idle'}
                amplitude={micEnabled ? voiceAmplitude : 0}
              />
            </div>

            {/* Real-time Voice Prompt Feedback */}
            <div className="text-center mt-3 min-h-[28px] max-w-md px-4">
              {!micEnabled ? (
                <div className="text-xs font-mono text-red-400 bg-red-950/30 border border-red-500/30 px-3 py-1 rounded-full">
                  Microphone is OFF • Click Arc Reactor or "Mic OFF" button to resume
                </div>
              ) : interimTranscript ? (
                <div className="text-xs font-mono text-cyan-300 animate-pulse bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-full">
                  Heard: "{interimTranscript}"
                </div>
              ) : voiceState === 'listening' ? (
                <div className="text-xs font-mono text-emerald-400 animate-pulse">
                  Listening continuously... Say "JARVIS" or any command.
                </div>
              ) : voiceState === 'speaking' ? (
                <div className="text-xs font-mono text-cyan-400">
                  JARVIS speaking via ElevenLabs... Mic standing by.
                </div>
              ) : (
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Microphone active • Say <span className="text-cyan-300 font-semibold font-mono">"JARVIS"</span> or click reactor to mute</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Quick-Action Telemetry Strip */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-cyan-500/20 text-center font-mono">
            <div
              onClick={handleTriggerOvercharge}
              className="p-2 bg-slate-950/60 border border-cyan-500/20 rounded hover:border-cyan-400 cursor-pointer transition-colors"
            >
              <div className="text-[10px] text-slate-400">ARC CORE OUTPUT</div>
              <div className="text-sm font-bold text-cyan-300">{telemetry.arcOutput.toFixed(1)} GW/s</div>
            </div>
            <div className="p-2 bg-slate-950/60 border border-cyan-500/20 rounded">
              <div className="text-[10px] text-slate-400">NANOTECH INTEGRITY</div>
              <div className="text-sm font-bold text-emerald-400">{telemetry.nanoIntegrity}%</div>
            </div>
            <div
              onClick={handleCalibrateRepulsors}
              className="p-2 bg-slate-950/60 border border-cyan-500/20 rounded hover:border-cyan-400 cursor-pointer transition-colors"
            >
              <div className="text-[10px] text-slate-400">REPULSOR ARRAYS</div>
              <div className="text-sm font-bold text-cyan-300">100% ONLINE</div>
            </div>
            <div className="p-2 bg-slate-950/60 border border-cyan-500/20 rounded">
              <div className="text-[10px] text-slate-400">ACTIVE ARMOR</div>
              <div className="text-sm font-bold text-amber-400">{telemetry.activeMark}</div>
            </div>
          </div>
        </div>

        {/* Right HUD Pane: Live Chat Feed or Suit Telemetry or Protocol Deck */}
        <div className="w-full lg:w-[480px] flex flex-col bg-slate-900/60 backdrop-blur-md border border-cyan-500/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          {activeTab === 'console' && (
            <ChatStream
              messages={messages}
              voiceState={voiceState}
              inputText={inputText}
              setInputText={setInputText}
              onSendMessage={handleSendMessage}
              micEnabled={micEnabled}
              onToggleMic={handleToggleMic}
              onReplaySpeech={handleReplaySpeech}
              interimTranscript={interimTranscript}
              userTitle={config.userTitle}
              wakeWordActive={config.wakeWordEnabled}
            />
          )}

          {activeTab === 'telemetry' && (
            <div className="p-4 overflow-y-auto h-full custom-scrollbar">
              <SuitTelemetry
                telemetry={telemetry}
                onUpdateMark={(mark) => setTelemetry((prev) => ({ ...prev, activeMark: mark }))}
                onTriggerOvercharge={handleTriggerOvercharge}
                onCalibrateRepulsors={handleCalibrateRepulsors}
              />
            </div>
          )}

          {activeTab === 'protocols' && (
            <div className="p-4 overflow-y-auto h-full custom-scrollbar">
              <ProtocolDeck
                activeProtocol={telemetry.protocolActive}
                onExecuteProtocol={handleExecuteProtocol}
              />
            </div>
          )}
        </div>
      </main>

      {/* Sleek Creator & System Architecture Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold tracking-wider">J.A.R.V.I.S. AI SYSTEM</span>
            <span className="text-slate-600">•</span>
            <span>Created & Developed by <strong className="text-cyan-300 font-bold tracking-wider">HAMZA ARSHAD</strong></span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-medium">
              LEAD ARCHITECT: HAMZA ARSHAD
            </span>
            <span className="hidden md:inline text-slate-500">STARK INDUSTRIES INTERFACE</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <JarvisSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        updateConfig={updateConfig}
        serverStatus={serverStatus}
      />

      {/* v0 Master Prompt Modal */}
      <V0PromptModal
        isOpen={v0ModalOpen}
        onClose={() => setV0ModalOpen(false)}
      />
    </div>
  );
}
