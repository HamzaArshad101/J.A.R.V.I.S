export interface GroundingSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  cleanSpeech?: string;
  timestamp: string;
  action?: string | null;
  audioAvailable?: boolean;
  source?: string;
  grounding?: {
    queries?: string[];
    sources?: GroundingSource[];
  } | null;
}

export interface SuitTelemetryData {
  activeMark: string;
  arcOutput: number; // e.g. 100%
  coreTemp: number; // Celsius
  nanoIntegrity: number; // percentage
  leftRepulsor: number; // percentage
  rightRepulsor: number; // percentage
  thrusterOutput: number; // percentage
  securityLevel: 'Nominal' | 'Alert' | 'Lockdown';
  protocolActive: string | null;
}

export type JarvisVoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface StarkProtocol {
  id: string;
  name: string;
  code: string;
  description: string;
  prompt: string;
  actionKey: string;
  color: string;
}

export interface JarvisApiConfig {
  userTitle: string;
  voiceEngine: 'browser' | 'gemini' | 'elevenlabs';
  groqApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  searchApiKey: string;
  enableWebSearch: boolean;
  wakeWordEnabled: boolean;
  autoSpeak: boolean;
  soundFXEnabled: boolean;
}
