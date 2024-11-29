import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/debate';

// API Message type for external communication
export type ApiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: number;
  score?: {
    score: number;
    previousScore: number;
  };
}

// Internal Message type
type Message = {
  role: 'user' | 'opponent' | 'hint' | 'system';
  content: string;
  id?: number;
  score?: {
    score: number;
    previousScore: number;
  };
}

// Map internal messages to API format
const mapToApiMessages = (messages: Message[]): ApiMessage[] => {
  return messages.map(msg => {
    const { content, id, score } = msg;
    if (msg.role === 'system') return { role: 'system', content, id, score };
    if (msg.role === 'opponent' || msg.role === 'hint') return { role: 'assistant', content, id, score };
    return { role: 'user', content, id, score };
  });
};

export const startDebate = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against',
  aiPersonality: { name: string }
): Promise<string> => {
  const messages: ApiMessage[] = [
    { 
      role: 'system', 
      content: `You are ${aiPersonality.name}, debating ${userPosition === 'for' ? 'against' : 'for'} the topic. Keep responses under 3 sentences.`
    },
    { 
      role: 'user', 
      content: `The topic is: "${topic}". Start with a quick opening argument ${userPosition === 'for' ? 'against' : 'for'} the topic.`
    }
  ];

  const response = await axios.post(`${API_BASE_URL}/response`, {
    topic,
    position: userPosition === 'for' ? 'against' : 'for',
    messages,
  });

  return response.data.response;
};

export const continueDebate = async (
  topic: string,
  messages: Message[],
  aiPosition: 'for' | 'against'
): Promise<string> => {
  // Find the original system message to maintain personality
  const originalSystemMessage = messages.find(m => m.role === 'system');
  
  // Map all messages to API format, preserving the correct roles
  const apiMessages = messages.map(msg => {
    const { content, id, score } = msg;
    // Keep system messages as is
    if (msg.role === 'system') return { role: 'system', content, id, score };
    // Map opponent messages to assistant
    if (msg.role === 'opponent') return { role: 'assistant', content, id, score };
    // Map hint messages to assistant
    if (msg.role === 'hint') return { role: 'assistant', content, id, score };
    // Map user messages to user
    return { role: 'user', content, id, score };
  });

  // If no system message found, add a default one
  const messagesWithSystem = originalSystemMessage 
    ? apiMessages 
    : [
        {
          role: 'system' as const,
          content: `You are Emotional Emma, debating ${aiPosition} the topic. Keep responses under 3 sentences.`
        },
        ...apiMessages
      ];

  const response = await axios.post(`${API_BASE_URL}/response`, {
    topic,
    position: aiPosition,
    messages: messagesWithSystem,
  });

  return response.data.response;
};

export const evaluateArgument = async (
  topic: string,
  position: 'for' | 'against',
  messages: Message[],
  currentScores: { user: number; opponent: number },
  model: string,
  roleToScore: 'user' | 'opponent'
): Promise<number> => {
  // Map messages to API format, ensuring correct role mapping
  const apiMessages = messages.map(msg => {
    const { content, id, score } = msg;
    if (msg.role === 'system') return { role: 'system', content, id, score };
    
    // For opponent scoring, swap roles
    if (roleToScore === 'opponent') {
      return {
        role: msg.role === 'user' ? 'assistant' : 'user',
        content,
        id,
        score
      };
    }
    
    // For user scoring, map normally
    return {
      role: msg.role === 'opponent' ? 'assistant' : 'user',
      content,
      id,
      score
    };
  });

  const response = await axios.post(`${API_BASE_URL}/evaluate`, {
    topic,
    position,
    messages: apiMessages,
    currentScores,
    model,
    roleToScore
  });

  return response.data.score;
};

export const generateHint = async (
  topic: string,
  messages: Message[],
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against'
): Promise<string> => {
  // Map messages to API format
  const apiMessages = mapToApiMessages(messages);

  const response = await axios.post(`${API_BASE_URL}/hint`, {
    topic,
    position: userPosition,
    messages: apiMessages
  });

  return response.data.hint;
};

export const endDebate = async (
  topic: string,
  userArguments: string[],
  userPosition: 'for' | 'against'
): Promise<{ overallScore: number; rationale: string; recommendations: string }> => {
  const response = await axios.post(`${API_BASE_URL}/evaluate-debate`, {
    topic,
    userArguments,
    position: userPosition,
  });

  return response.data;
};

export const getLeaderboard = async (): Promise<Array<{ name: string; score: number }>> => {
  const response = await axios.get(`${API_BASE_URL}/leaderboard`);
  return response.data.leaderboard;
};

export const submitScore = async (name: string, score: number): Promise<void> => {
  await axios.post(`${API_BASE_URL}/submit-score`, {
    name,
    score
  });
};
