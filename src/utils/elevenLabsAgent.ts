import { Conversation } from '@elevenlabs/client';
import { JarvisVoiceState } from '../types/jarvis';

export interface ElevenLabsCallbacks {
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'disconnecting') => void;
  onModeChange?: (mode: 'listening' | 'speaking') => void;
  onMessage?: (message: { source: 'user' | 'ai'; text: string }) => void;
  onAmplitude?: (level: number) => void;
  onError?: (error: string) => void;
  onToolCall?: (toolName: string, params: any) => Promise<any>;
}

export class JarvisElevenLabsManager {
  private conversation: any = null;
  private status: 'disconnected' | 'connecting' | 'connected' | 'disconnecting' = 'disconnected';
  private mode: 'listening' | 'speaking' = 'listening';
  private callbacks: ElevenLabsCallbacks = {};
  private animFrameId: number | null = null;
  private micMuted = false;
  private activeAgentId = 'agent_4601m3fc7rbsedsr24vs0e5vpfzt';

  public setCallbacks(cbs: ElevenLabsCallbacks) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  public getStatus() {
    return this.status;
  }

  public isConnected() {
    return this.status === 'connected';
  }

  public setMicMuted(muted: boolean) {
    this.micMuted = muted;
    if (this.conversation && typeof this.conversation.setMicMuted === 'function') {
      try {
        this.conversation.setMicMuted(muted);
      } catch (err) {
        console.warn('Error toggling mic mute on ElevenLabs conversation:', err);
      }
    }
  }

  public async start(agentId?: string): Promise<boolean> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return true;
    }

    const targetAgentId = agentId || this.activeAgentId;
    this.activeAgentId = targetAgentId;
    this.status = 'connecting';
    this.callbacks.onStatusChange?.('connecting');

    try {
      // Request microphone permission first to ensure clean initialization
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediate test stream; @elevenlabs/client will bind its own controller
        stream.getTracks().forEach((track) => track.stop());
      }

      this.conversation = await Conversation.startSession({
        agentId: targetAgentId,
        clientTools: {
          triggerStarkProtocol: async (params: { protocolName: string; action: string }) => {
            console.log('[ElevenLabs Tool Call] triggerStarkProtocol:', params);
            if (this.callbacks.onToolCall) {
              return await this.callbacks.onToolCall('triggerStarkProtocol', params);
            }
            return { status: 'Protocol acknowledged by Stark Systems', params };
          },
          managePersonalData: async (params: { query: string; action?: string; data?: any }) => {
            console.log('[ElevenLabs Tool Call] managePersonalData:', params);
            if (this.callbacks.onToolCall) {
              return await this.callbacks.onToolCall('managePersonalData', params);
            }
            return { status: 'Dispatched to n8n personal data pipeline', params };
          },
          getLatestInfo: async (params: { topic: string }) => {
            console.log('[ElevenLabs Tool Call] getLatestInfo:', params);
            if (this.callbacks.onToolCall) {
              return await this.callbacks.onToolCall('getLatestInfo', params);
            }
            return { status: 'Latest info queried from n8n integration', params };
          },
        },
        onConnect: () => {
          this.status = 'connected';
          this.callbacks.onStatusChange?.('connected');
          this.startAmplitudeLoop();
          if (this.micMuted && this.conversation?.setMicMuted) {
            this.conversation.setMicMuted(true);
          }
        },
        onDisconnect: () => {
          this.status = 'disconnected';
          this.stopAmplitudeLoop();
          this.callbacks.onStatusChange?.('disconnected');
          this.conversation = null;
        },
        onError: (err: any) => {
          console.error('[ElevenLabs Agent Error]:', err);
          const errorMsg = typeof err === 'string' ? err : err?.message || 'Agent connection error';
          this.callbacks.onError?.(errorMsg);
        },
        onModeChange: ({ mode }: { mode: 'listening' | 'speaking' }) => {
          this.mode = mode;
          this.callbacks.onModeChange?.(mode);
        },
        onMessage: (msg: { source: 'user' | 'ai'; role?: string; message?: string }) => {
          const text = msg.message || '';
          if (text.trim()) {
            this.callbacks.onMessage?.({
              source: msg.source,
              text,
            });
          }
        },
        onStatusChange: ({ status }: { status: any }) => {
          this.status = status;
          this.callbacks.onStatusChange?.(status);
        },
      });

      return true;
    } catch (err: any) {
      console.error('Failed to start ElevenLabs Agent session:', err);
      this.status = 'disconnected';
      this.callbacks.onStatusChange?.('disconnected');
      this.callbacks.onError?.(err?.message || 'Failed to initialize microphone or connect to ElevenLabs Agent');
      return false;
    }
  }

  public async stop(): Promise<void> {
    this.stopAmplitudeLoop();
    if (this.conversation) {
      try {
        await this.conversation.endSession();
      } catch (err) {
        console.warn('Error ending ElevenLabs conversation session:', err);
      }
      this.conversation = null;
    }
    this.status = 'disconnected';
    this.callbacks.onStatusChange?.('disconnected');
    this.callbacks.onAmplitude?.(0);
  }

  private startAmplitudeLoop() {
    this.stopAmplitudeLoop();

    const check = () => {
      if (this.conversation) {
        try {
          let vol = 0;
          if (this.mode === 'speaking' && typeof this.conversation.getOutputVolume === 'function') {
            vol = this.conversation.getOutputVolume();
          } else if (this.mode === 'listening' && typeof this.conversation.getInputVolume === 'function') {
            vol = this.conversation.getInputVolume();
          }
          // Normalize volume to 0..1 scale
          const normalized = Math.min(1, Math.max(0, vol * 1.5));
          this.callbacks.onAmplitude?.(normalized);
        } catch {
          // Ignore transient volume reading errors
        }
      }
      this.animFrameId = requestAnimationFrame(check);
    };

    this.animFrameId = requestAnimationFrame(check);
  }

  private stopAmplitudeLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}

export const jarvisAgent = new JarvisElevenLabsManager();
