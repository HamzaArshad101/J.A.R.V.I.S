// Direct WebSocket / WebRTC-compatible ElevenLabs Conversational AI Session Manager
// Seamlessly connects the J.A.R.V.I.S. Arc Reactor to custom ElevenLabs Agent (agent_4601m3fc7rbsedsr24vs0e5vpfzt)
// Powers live two-way conversational voice with connected n8n webhooks.

export type ConvAIStatus = 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening';

export interface ConvAIMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface ConvAICallbacks {
  onStatusChange?: (status: ConvAIStatus) => void;
  onMessage?: (role: 'user' | 'agent', text: string) => void;
  onTranscript?: (interim: string, isFinal: boolean) => void;
  onAmplitude?: (level: number) => void;
  onError?: (error: string) => void;
  onQuotaExceeded?: () => void;
}

class ElevenLabsConvAISession {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private audioInputProcessor: ScriptProcessorNode | null = null;
  private status: ConvAIStatus = 'disconnected';
  private callbacks: ConvAICallbacks = {};
  private currentAgentId = 'agent_4601m3fc7rbsedsr24vs0e5vpfzt';
  private audioQueue: AudioBuffer[] = [];
  private isPlayingAudio = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  public setAgentId(agentId: string) {
    this.currentAgentId = agentId || 'agent_4601m3fc7rbsedsr24vs0e5vpfzt';
  }

  public getAgentId(): string {
    return this.currentAgentId;
  }

  public getStatus(): ConvAIStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected' || this.status === 'speaking' || this.status === 'listening';
  }

  // Start live session using signed URL from backend server
  public async startSession(callbacks: ConvAICallbacks, customAgentId?: string): Promise<boolean> {
    this.callbacks = callbacks;
    if (customAgentId) {
      this.currentAgentId = customAgentId;
    }

    this.setStatus('connecting');

    try {
      // 1. Get signed WebSocket URL from secure backend
      const res = await fetch(`/api/jarvis/convai/signed-url?agent_id=${encodeURIComponent(this.currentAgentId)}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve ElevenLabs agent signed URL');
      }

      const data = await res.json();
      const signedUrl = data.signed_url;

      if (!signedUrl) {
        throw new Error('No signed URL returned for agent');
      }

      // 2. Initialize AudioContext
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtxClass({ sampleRate: 16000 });
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Set up Analyser for visual Arc Reactor reactivity
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.audioContext.destination);

      // Start amplitude loop
      this.startAnalyserLoop();

      // 3. Connect WebSocket
      this.ws = new WebSocket(signedUrl);

      this.ws.onopen = async () => {
        this.setStatus('connected');
        // Start streaming microphone PCM audio (16kHz mono) to agent
        await this.startMicrophoneStream();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleAgentEvent(msg);
        } catch {
          // binary or unformatted
        }
      };

      this.ws.onerror = (err) => {
        console.warn('ConvAI WebSocket error:', err);
        this.callbacks.onError?.('Communication interruption with ElevenLabs agent.');
      };

      this.ws.onclose = (event) => {
        const reason = event.reason || '';
        console.warn('ConvAI WebSocket closed:', event.code, reason);
        if (event.code === 3000 || reason.includes('quota_exceeded') || reason.includes('credits')) {
          this.callbacks.onQuotaExceeded?.();
        }
        this.cleanup();
        this.setStatus('disconnected');
      };

      return true;
    } catch (err: any) {
      console.error('Failed to start ElevenLabs ConvAI session:', err);
      this.cleanup();
      this.setStatus('disconnected');
      this.callbacks.onError?.(err?.message || 'Failed to connect to ElevenLabs agent.');
      return false;
    }
  }

  // Handle incoming agent messages and audio packets
  private handleAgentEvent(msg: any) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'conversation_initiation_metadata':
        this.setStatus('connected');
        break;

      case 'audio':
        // Agent is speaking: decode and queue PCM audio chunk
        if (msg.audio_event?.audio_base_64) {
          this.setStatus('speaking');
          this.queueAudioChunk(msg.audio_event.audio_base_64);
        }
        break;

      case 'agent_response':
        if (msg.agent_response_event?.agent_response) {
          const text = msg.agent_response_event.agent_response;
          this.callbacks.onMessage?.('agent', text);
        }
        break;

      case 'user_transcript':
        if (msg.user_transcription_event?.user_transcript) {
          const transcript = msg.user_transcription_event.user_transcript;
          // Notify interim/final text for HUD display and input bar sync
          this.callbacks.onTranscript?.(transcript, true);
          this.callbacks.onMessage?.('user', transcript);
        }
        break;

      case 'interruption':
        // User interrupted agent: flush current audio queue immediately
        this.flushAudio();
        this.setStatus('listening');
        break;

      case 'ping':
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event?.event_id }));
        }
        break;

      default:
        break;
    }
  }

  // Stream microphone audio to ElevenLabs Agent
  private async startMicrophoneStream() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (!this.audioContext) return;

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      // Process input chunks of 2048 samples
      this.audioInputProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.audioInputProcessor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Calculate user mic amplitude for Arc Reactor visual feedback when agent isn't speaking
        if (this.status !== 'speaking') {
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const amp = Math.min(1, (sum / inputData.length) * 5);
          if (amp > 0.05) {
            this.setStatus('listening');
            this.callbacks.onAmplitude?.(amp);
          } else if (this.status === 'listening') {
            this.setStatus('connected');
            this.callbacks.onAmplitude?.(0);
          }
        }

        // Convert Float32Array to 16-bit PCM (Int16Array)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send binary PCM buffer as base64 audio event to ElevenLabs Agent
        const base64Audio = this.bufferToBase64(pcm16.buffer);
        this.ws.send(
          JSON.stringify({
            user_audio_chunk: base64Audio,
          })
        );
      };

      source.connect(this.audioInputProcessor);
      this.audioInputProcessor.connect(this.audioContext.destination);
    } catch (micErr) {
      console.warn('Could not initialize microphone stream for ConvAI:', micErr);
      this.callbacks.onError?.('Microphone permission required for ElevenLabs voice agent.');
    }
  }

  // Convert ArrayBuffer to Base64
  private bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Queue and play incoming agent PCM chunks
  private async queueAudioChunk(base64Audio: string) {
    if (!this.audioContext) return;

    try {
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM (little endian) to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 16000);
      audioBuffer.getChannelData(0).set(float32Array);

      this.audioQueue.push(audioBuffer);

      if (!this.isPlayingAudio) {
        this.playNextChunk();
      }
    } catch (e) {
      console.warn('Error decoding ConvAI PCM chunk:', e);
    }
  }

  private playNextChunk() {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      this.setStatus('connected');
      this.callbacks.onAmplitude?.(0);
      return;
    }

    this.isPlayingAudio = true;
    this.setStatus('speaking');

    const buffer = this.audioQueue.shift()!;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    if (this.analyser) {
      source.connect(this.analyser);
    } else {
      source.connect(this.audioContext.destination);
    }

    this.currentSource = source;

    source.onended = () => {
      this.playNextChunk();
    };

    source.start();
  }

  // Flush audio buffer on user interruption
  public flushAudio() {
    this.audioQueue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
    this.isPlayingAudio = false;
  }

  // Loop to analyze output audio amplitude for visual Arc Reactor reactivity
  private startAnalyserLoop() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const checkAmplitude = () => {
      if (this.status === 'speaking' && this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        this.callbacks.onAmplitude?.(normalized);
      }

      this.animationFrameId = requestAnimationFrame(checkAmplitude);
    };

    this.animationFrameId = requestAnimationFrame(checkAmplitude);
  }

  private setStatus(status: ConvAIStatus) {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  // Stop session and release microphone
  public stopSession() {
    this.cleanup();
    this.setStatus('disconnected');
  }

  private cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.flushAudio();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.audioInputProcessor) {
      try {
        this.audioInputProcessor.disconnect();
      } catch {}
      this.audioInputProcessor = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
      this.analyser = null;
    }
  }
}

export const convaiSession = new ElevenLabsConvAISession();
