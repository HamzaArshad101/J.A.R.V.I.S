// J.A.R.V.I.S. Multi-Engine Speech Synthesis with Visual Waveform Analysis:
// 1. Web Speech API (instant, zero-latency British Butler voice)
// 2. ElevenLabs Turbo API via server proxy (when API key provided)
// 3. Gemini Studio Neural TTS via /api/jarvis/tts

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  isBritish: boolean;
}

class JarvisSpeechSynthesizer {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private audioCtx: AudioContext | null = null;
  private amplitudeCallback: ((level: number) => void) | null = null;
  private animationFrameId: number | null = null;
  private voicePreference: 'gemini' | 'browser' | 'elevenlabs' = 'browser';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public setVoicePreference(pref: 'gemini' | 'browser' | 'elevenlabs') {
    this.voicePreference = pref;
  }

  public getVoicePreference(): 'gemini' | 'browser' | 'elevenlabs' {
    return this.voicePreference;
  }

  public setAmplitudeCallback(cb: ((level: number) => void) | null) {
    this.amplitudeCallback = cb;
  }

  public findBestBritishVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = this.cachedVoices.length ? this.cachedVoices : window.speechSynthesis.getVoices();

    const preferredNames = [
      /google uk english male/i,
      /daniel/i,
      /arthur/i,
      /george/i,
      /oliver/i,
      /en[-_]gb.*male/i,
    ];

    for (const pattern of preferredNames) {
      const match = voices.find((v) => pattern.test(v.name));
      if (match) return match;
    }

    const gbVoice = voices.find((v) => v.lang === 'en-GB' || v.lang === 'en_GB');
    if (gbVoice) return gbVoice;

    const enVoice = voices.find((v) => v.lang.startsWith('en'));
    return enVoice || voices[0] || null;
  }

  public stop() {
    this.isSpeaking = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.amplitudeCallback) {
      this.amplitudeCallback(0);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
      } catch {
        // already stopped
      }
      this.currentAudioSource = null;
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  private startSimulatedWaveform() {
    let t = 0;
    const animate = () => {
      if (!this.isSpeaking) {
        if (this.amplitudeCallback) this.amplitudeCallback(0);
        return;
      }
      t += 0.08;
      const baseEnergy = 0.45 + Math.sin(t * 1.5) * 0.25;
      const speechFluctuation = Math.sin(t * 7.1) * 0.2 + Math.cos(t * 13.4) * 0.15;
      const amplitude = Math.max(0.1, Math.min(1.0, baseEnergy + speechFluctuation));

      if (this.amplitudeCallback) {
        this.amplitudeCallback(amplitude);
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  // Play decoded audio buffer with real-time waveform inspection
  private async playAudioBuffer(buffer: AudioBuffer, onEnd?: () => void) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;

      const analyzer = this.audioCtx.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);
      analyzer.connect(this.audioCtx.destination);

      this.currentAudioSource = source;
      this.isSpeaking = true;

      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      const checkAudio = () => {
        if (!this.isSpeaking) return;
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        if (this.amplitudeCallback) this.amplitudeCallback(avg);
        this.animationFrameId = requestAnimationFrame(checkAudio);
      };
      this.animationFrameId = requestAnimationFrame(checkAudio);

      source.onended = () => {
        this.isSpeaking = false;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (this.amplitudeCallback) this.amplitudeCallback(0);
        this.currentAudioSource = null;
        if (onEnd) onEnd();
      };

      source.start(0);
      return true;
    } catch (e) {
      console.warn('Failed playing audio buffer:', e);
      return false;
    }
  }

  // Play audio returned as base64 PCM (24kHz, 16-bit mono) from Gemini TTS
  private async playGeminiPCM(base64Data: string, onEnd?: () => void): Promise<boolean> {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const sampleRate = 24000;
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass({ sampleRate });
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.copyToChannel(float32Array, 0);

      return this.playAudioBuffer(audioBuffer, onEnd);
    } catch (e) {
      console.warn('Failed playing Gemini PCM:', e);
      return false;
    }
  }

  // Play audio returned as encoded MP3/audio (e.g. from ElevenLabs)
  private async playEncodedAudio(base64Data: string, onEnd?: () => void): Promise<boolean> {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));
      return this.playAudioBuffer(audioBuffer, onEnd);
    } catch (e) {
      console.warn('Failed decoding audio from provider:', e);
      return false;
    }
  }

  // Primary speech function
  public async speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
      forceBrowser?: boolean;
      elevenLabsApiKey?: string;
      elevenLabsVoiceId?: string;
    }
  ) {
    this.stop();
    if (!text || !text.trim()) return;

    const cleanedText = text
      .replace(/\[ACTION:[A-Z_]+\]/g, '')
      .replace(/[*#_`]/g, '')
      .trim();

    // 1. ElevenLabs TTS engine if selected
    if (this.voicePreference === 'elevenlabs' && !options?.forceBrowser) {
      try {
        const res = await fetch('/api/jarvis/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanedText,
            elevenLabsApiKey: options?.elevenLabsApiKey,
            elevenLabsVoiceId: options?.elevenLabsVoiceId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            if (options?.onStart) options.onStart();
            const played = await this.playEncodedAudio(data.audioBase64, options?.onEnd);
            if (played) return;
          }
        }
      } catch (e) {
        console.warn('ElevenLabs TTS failed, falling back to Web Speech API', e);
      }
    }

    // 2. Gemini Studio Neural TTS if selected
    if (this.voicePreference === 'gemini' && !options?.forceBrowser) {
      try {
        const res = await fetch('/api/jarvis/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanedText, voice: 'Fenrir' }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            if (options?.onStart) options.onStart();
            const played = await this.playGeminiPCM(data.audioBase64, options?.onEnd);
            if (played) return;
          }
        }
      } catch (e) {
        console.warn('Gemini TTS network call failed, falling back to Web Speech API', e);
      }
    }

    // 3. Native Web Speech API (British Butler voice)
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onError) options.onError();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const voice = this.findBestBritishVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || 'en-GB';
    } else {
      utterance.lang = 'en-GB';
    }

    utterance.pitch = 0.94;
    utterance.rate = 1.04;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (options?.onStart) options.onStart();
      this.startSimulatedWaveform();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      if (this.amplitudeCallback) this.amplitudeCallback(0);
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      if (this.amplitudeCallback) this.amplitudeCallback(0);
      if (options?.onError) options.onError();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }
}

export const jarvisVoice = new JarvisSpeechSynthesizer();
