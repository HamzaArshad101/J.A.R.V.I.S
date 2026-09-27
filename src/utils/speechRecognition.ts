// Speech Recognition & Persistent Microphone Listener for J.A.R.V.I.S.
// Supports both Persistent Always-On mode and Instant Mute/Turn-Off toggle.

export type RecognitionState = 'idle' | 'listening' | 'processing' | 'unsupported' | 'denied' | 'muted';

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onTranscript?: (interim: string, isFinal: boolean) => void;
  onFinalResult?: (finalText: string) => void;
  onWakeWordDetected?: (detectedPhrase: string, subsequentCommand: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class JarvisSpeechListener {
  private recognition: any = null;
  private isListening = false;
  private state: RecognitionState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private callbacks: SpeechRecognitionCallbacks = {};
  private wakeWordMode = true;
  private restartTimeout: any = null;
  private keepAlive = true; // Controls whether the mic auto-restarts
  private consecutiveErrors = 0;
  private isSynthesizingSpeech = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.state = 'listening';
          this.consecutiveErrors = 0;
          this.callbacks.onStart?.();
        };

        this.recognition.onresult = (event: any) => {
          // If microphone is turned off or JARVIS is currently speaking, ignore audio
          if (!this.keepAlive || this.isSynthesizingSpeech) return;

          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptChunk;
            } else {
              interimTranscript += transcriptChunk;
            }
          }

          const combinedText = (finalTranscript || interimTranscript).toLowerCase().trim();

          // Instant Wake-Word matching: "JARVIS", "HEY JARVIS", "OK JARVIS", "HI JARVIS"
          const jarvisRegex = /(?:hey\s+|ok\s+|hello\s+|hi\s+)?(?:jarvis|jarves|garvis|travis)[\s,.]*(.*)/i;
          const jarvisMatch = combinedText.match(jarvisRegex);

          if (this.wakeWordMode && jarvisMatch) {
            const subsequent = (jarvisMatch[1] || '').trim();
            this.callbacks.onWakeWordDetected?.('JARVIS', subsequent);

            if (subsequent.length > 2) {
              this.callbacks.onFinalResult?.(subsequent);
              return;
            }
          }

          if (interimTranscript) {
            this.callbacks.onTranscript?.(interimTranscript, false);
          }

          if (finalTranscript.trim()) {
            this.callbacks.onTranscript?.(finalTranscript, true);
            this.callbacks.onFinalResult?.(finalTranscript.trim());
          }
        };

        this.recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            this.state = 'denied';
            this.keepAlive = false;
            this.callbacks.onError?.('Microphone access denied. Please grant permission in browser settings.');
          } else if (event.error === 'no-speech') {
            // Ambient silence
          } else {
            console.warn('SpeechRecognition warning:', event.error);
            this.consecutiveErrors++;
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.state === 'listening') {
            this.state = this.keepAlive ? 'idle' : 'muted';
          }
          this.callbacks.onEnd?.();

          // Only auto-restart if keepAlive is TRUE (microphone is ON)
          if (this.keepAlive && this.state !== 'denied') {
            clearTimeout(this.restartTimeout);
            const delay = this.consecutiveErrors > 3 ? 1200 : 250;
            this.restartTimeout = setTimeout(() => {
              this.ensureListening();
            }, delay);
          }
        };
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
        this.state = 'unsupported';
      }
    } else {
      this.state = 'unsupported';
    }
  }

  // Ensures microphone remains active when keepAlive is true
  private ensureListening() {
    if (!this.keepAlive || this.state === 'denied') return;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch {
        // already active
      }
    }
  }

  public setJarvisSpeaking(isSpeaking: boolean) {
    this.isSynthesizingSpeech = isSpeaking;
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || navigator.mediaDevices?.getUserMedia)
    );
  }

  public getState(): RecognitionState {
    return this.state;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening && this.keepAlive;
  }

  public isMuted(): boolean {
    return !this.keepAlive;
  }

  public setWakeWordMode(enabled: boolean) {
    this.wakeWordMode = enabled;
  }

  // Primary activation: starts microphone and arms persistent listening
  public async startListening(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    this.callbacks = callbacks;
    this.keepAlive = true;
    this.consecutiveErrors = 0;

    if (this.recognition) {
      try {
        if (!this.isListening) {
          this.recognition.start();
        }
        return true;
      } catch {
        return true;
      }
    }

    // MediaRecorder fallback if Web Speech API isn't present
    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      this.audioChunks = [];
      const mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            if (!base64Audio) return;

            const res = await fetch('/api/jarvis/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
            });
            const data = await res.json();
            if (data.transcript && this.keepAlive) {
              const text = data.transcript;
              if (this.wakeWordMode) {
                const match = text.match(/(?:hey\s+|ok\s+|hello\s+|hi\s+)?(?:jarvis|travis)[\s,.]*(.*)/i);
                if (match) {
                  this.callbacks.onWakeWordDetected?.('JARVIS', match[1] || '');
                }
              }
              this.callbacks.onFinalResult?.(text);
            }
          };
        } catch {
          // ignore
        }

        if (this.keepAlive) {
          setTimeout(() => {
            try {
              if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                this.mediaRecorder.start();
              }
            } catch {}
          }, 300);
        }
      };

      mediaRecorder.start();
      this.isListening = true;
      this.state = 'listening';
      this.callbacks.onStart?.();
      return true;
    } catch {
      this.state = 'denied';
      this.callbacks.onError?.('Microphone access is required to speak with JARVIS.');
      return false;
    }
  }

  // Turns off the microphone completely (stops listening, stops auto-restart)
  public turnOffMicrophone() {
    this.keepAlive = false;
    this.isListening = false;
    this.state = 'muted';
    clearTimeout(this.restartTimeout);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    this.callbacks.onEnd?.();
  }

  // Alias for backward compatibility
  public stopListening() {
    this.turnOffMicrophone();
  }
}

export const jarvisListener = new JarvisSpeechListener();
