import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/debate';

interface Message {
  role: string;
  content: string;
  id?: number;
  score?: {
    score: number;
    previousScore: number;
  };
}

export const startDebate = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against',
  aiPersonality: { name: string }
): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/response`, {
    topic,
    position: userPosition === 'for' ? 'against' : 'for',
    messages: [
      { 
        role: 'system', 
        content: `You are ${aiPersonality.name}, debating ${userPosition === 'for' ? 'against' : 'for'} the topic. Keep responses under 3 sentences.`
      },
      { 
        role: 'user', 
        content: `The topic is: "${topic}". Start with a quick opening argument ${userPosition === 'for' ? 'against' : 'for'} the topic.`
      }
    ],
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
  
  // Filter out any score or id properties and map roles
  const cleanedMessages = messages.map(msg => ({
    role: msg.role === 'opponent' ? 'assistant' : msg.role,
    content: msg.content
  }));

  // If no system message found, add a default one
  const messagesWithSystem = originalSystemMessage 
    ? cleanedMessages 
    : [
        {
          role: 'system',
          content: `You are Emotional Emma, debating ${aiPosition} the topic. Keep responses under 3 sentences.`
        },
        ...cleanedMessages
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
  const response = await axios.post(`${API_BASE_URL}/evaluate`, {
    topic,
    position,
    messages,
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
  const response = await axios.post(`${API_BASE_URL}/hint`, {
    topic,
    position: userPosition,
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
