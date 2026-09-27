import React from 'react';

export interface GroundingSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'n8n';
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
  // Mode selection: 'elevenlabs-agent' (Mode A full conversational agent) or 'stark-core' (Groq/Gemini)
  activeMode: 'elevenlabs-agent' | 'stark-core';
  elevenLabsAgentId: string;
  n8nWebhookUrl: string;
  showConvAiWidget: boolean;
  voiceEngine: 'elevenlabs' | 'browser' | 'gemini';
  groqApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  searchApiKey: string;
  enableWebSearch: boolean;
  wakeWordEnabled: boolean;
  autoSpeak: boolean;
  soundFXEnabled: boolean;
}

export interface N8nWebhookLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'failed' | 'pending';
  payload: any;
  response?: any;
}

// Custom element declaration for ElevenLabs Conversational AI Web Component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          [key: string]: any;
        },
        HTMLElement
      >;
    }
  }
}
