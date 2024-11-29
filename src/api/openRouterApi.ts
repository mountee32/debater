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
  const difficultyGuide = {
    easy: "Use simpler language and basic arguments. Focus on clear, straightforward points.",
    medium: "Use moderate complexity in language and arguments. Balance between basic and advanced concepts.",
    hard: "Use sophisticated language and complex arguments. Employ advanced debate techniques and deeper analysis."
  };

  const messages: ApiMessage[] = [
    { 
      role: 'system', 
      content: `You are ${aiPersonality.name}, an expert debater ${userPosition === 'for' ? 'against' : 'for'} the topic "${topic}".

DEBATE FORMAT:
- Keep responses under 3 sentences for clarity and impact
- Each response must directly address the previous argument
- Maintain a consistent position throughout the debate
- Use evidence and logical reasoning to support claims

ARGUMENT STRUCTURE:
- Start with a clear position statement
- Support with relevant evidence or reasoning
- Address counterarguments when applicable

DIFFICULTY LEVEL: ${difficulty}
${difficultyGuide[difficulty]}

DEBATE PRINCIPLES:
1. Stay focused on the core topic
2. Build upon previous arguments
3. Use appropriate evidence and examples
4. Maintain logical consistency
5. Avoid logical fallacies
6. Consider ethical implications

Your responses will be evaluated based on:
- Relevance to the topic
- Logical consistency
- Evidence quality
- Argument structure
- Rhetorical effectiveness`
    },
    { 
      role: 'user', 
      content: `The topic is: "${topic}". Start with a clear opening argument ${userPosition === 'for' ? 'against' : 'for'} the topic.`
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

  // If no system message found, add a default one with comprehensive debate guidance
  const messagesWithSystem = originalSystemMessage 
    ? apiMessages 
    : [
        {
          role: 'system' as const,
          content: `You are continuing a debate on the topic "${topic}", taking the ${aiPosition} position.

RESPONSE GUIDELINES:
1. Keep responses under 3 sentences
2. Directly address the previous argument
3. Maintain consistent position and logic
4. Use evidence when possible
5. Focus on strongest counterpoints
6. Avoid logical fallacies
7. Build upon previous arguments

EVALUATION CRITERIA:
- Relevance to topic and previous points
- Logical consistency
- Evidence quality
- Argument structure
- Rhetorical effectiveness`
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

  return {
    overallScore: response.data.overallScore,
    rationale: response.data.rationale,
    recommendations: response.data.recommendations
  };
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
