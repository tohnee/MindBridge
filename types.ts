export type Platform = 'chatgpt' | 'claude' | 'gemini';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ContextSession {
  sourcePlatform: Platform;
  sourceUrl: string;
  topic?: string;
  messages: Message[];
  summary?: string;
  lastUpdated: number;
}

// Interface for the platform-specific logic
export interface PlatformAdapter {
  platformName: Platform;
  extractConversation(): Promise<Message[]>;
  getInputElement(): HTMLTextAreaElement | HTMLElement | null;
  injectText(text: string): Promise<void>;
}

export interface StorageState {
  currentSession: ContextSession | null;
}