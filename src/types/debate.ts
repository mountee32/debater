import { AIPersonality } from '../data/aiPersonalities';

export interface GameSummary {
  score: number;
  feedback: string;
  improvements: string[];
  isHighScore?: boolean;
}

export interface DebateState {
  isLoading: boolean;
  isGeneratingHint: boolean;
  audienceScore: { user: number; opponent: number };
  isAiThinking: boolean;
  error: string | null;
  summary: GameSummary | null;
  isGeneratingSummary: boolean;
  conversationId: string | null;
}

export interface Message {
  id: number;
  role: 'user' | 'opponent' | 'hint' | 'system';
  content: string;
  score?: {
    score: number;
    previousScore: number;
  };
}

export interface GameSetup {
  topic: string;
  difficulty: number;
  participants: {
    id: string;
    name: string;
    avatar: string;
    role: 'debater';
  }[];
  subjectId: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
}

export interface DebateHookResult {
  state: DebateState;
  messages: Message[];
  handleSendArgument: (currentArgument: string) => Promise<void>;
  handleHintRequest: () => Promise<string | null>;
  initializeDebate: () => Promise<void>;
  generateDebateSummary: () => Promise<void>;
  gameSetup?: GameSetup | null;
}
