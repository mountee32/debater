import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AIPersonality } from '../data/aiPersonalities';
import { withAPILogging } from '../utils/logger';
import modelConfig from '../../models.config.json';
import { env } from '../utils/env';

const API_KEY = env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Load models from config with environment variable overrides
const OPPONENT_MODEL = env.OPPONENT_MODEL || modelConfig.models.opponent.name;
const HINT_MODEL = env.HINT_MODEL || modelConfig.models.hint.name;
const TURN_SCORING_MODEL = env.TURN_SCORING_MODEL || modelConfig.models.turnScoring.name;
const FINAL_SCORING_MODEL = env.FINAL_SCORING_MODEL || modelConfig.models.finalScoring.name;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'HTTP-Referer': 'http://localhost:5174',
  'X-Title': 'Debate Master'
};

type Position = 'for' | 'against';
type Difficulty = 'easy' | 'medium' | 'hard';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  difficulty: Difficulty;
  category: string;
  subject: string;
}

interface Message {
  role: string;
  content: string;
}

interface APIResponse<T> {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  data?: T;
}

let leaderboardData: LeaderboardEntry[] = [];

export const generateTopic = async (category: string, difficulty: Difficulty): Promise<string> => {
  const requestData = {
    model: OPPONENT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Generate a debate topic related to ${category}. For ${difficulty} difficulty level.`
      },
      {
        role: 'user',
        content: 'Generate a concise, controversial debate topic.'
      }
    ]
  };

  const response = await withAPILogging(
    () => axios.post<APIResponse<never>>(API_URL, requestData, { headers }),
    'generateTopic',
    { method: 'POST', requestData }
  );

  if (!response.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format');
  }
  return response.choices[0].message.content;
};

export const startDebate = async (
  topic: string,
  difficulty: Difficulty,
  userPosition: Position,
  aiPersonality: AIPersonality
): Promise<string> => {
  const aiPosition = userPosition === 'for' ? 'against' : 'for';
  const requestData = {
    model: OPPONENT_MODEL,
    messages: [
      { 
        role: 'system', 
        content: `You are ${aiPersonality.name}, debating ${aiPosition} the topic. Keep responses under 3 sentences.`
      },
      { 
        role: 'user', 
        content: `The topic is: "${topic}". Start with a quick opening argument ${aiPosition} the topic.`
      }
    ]
  };

  const response = await withAPILogging(
    () => axios.post<APIResponse<never>>(API_URL, requestData, { headers }),
    'startDebate',
    { method: 'POST', requestData }
  );

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }
  return content.trim();
};

export const continueDebate = async (
  topic: string,
  messages: Message[],
  userArgument: string,
  difficulty: Difficulty,
  userPosition: Position,
  aiPersonality: AIPersonality
): Promise<{
  response: string;
  evaluation: {
    score: number;
    feedback: string;
    consistencyScore: number;
    factScore: number;
    styleScore: number;
    audienceReaction: number;
  };
}> => {
  const aiPosition = userPosition === 'for' ? 'against' : 'for';
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  // First, get the AI's response
  const getAIResponse = async () => {
    const responseRequestData = {
      model: OPPONENT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: `You are ${aiPersonality.name}, debating ${aiPosition} the topic "${topic}". Keep responses under 3 sentences.`
        },
        ...formattedMessages
      ]
    };

    const response = await withAPILogging(
      () => axios.post<APIResponse<never>>(API_URL, responseRequestData, { headers }),
      'continueDebate-response',
      { method: 'POST', requestData: responseRequestData }
    );

    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Invalid response format');
    }
    return content.trim();
  };

  // Then, evaluate the user's argument
  const evaluateArgument = async () => {
    const evaluationRequestData = {
      model: TURN_SCORING_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Rate the argument from 1-10 on: overall quality, consistency, facts, style, and audience reaction. Format: score,consistency,facts,style,audience,feedback'
        },
        {
          role: 'user',
          content: `Topic: "${topic}"\nPosition: ${userPosition}\nArgument: ${userArgument}`
        }
      ]
    };

    const evaluationResponse = await withAPILogging(
      () => axios.post<APIResponse<never>>(API_URL, evaluationRequestData, { headers }),
      'continueDebate-evaluation',
      { method: 'POST', requestData: evaluationRequestData }
    );

    const evaluationText = evaluationResponse.choices?.[0]?.message?.content;
    if (typeof evaluationText !== 'string') {
      throw new Error('Invalid evaluation format');
    }

    // Handle various evaluation response formats
    let score = 5, consistencyScore = 5, factScore = 5, styleScore = 5, audienceReaction = 5, feedback = '';
    
    // Try parsing comma-separated format first
    const parts = evaluationText.split(',');
    if (parts.length >= 5) {
      score = parseInt(parts[0]) || 5;
      consistencyScore = parseInt(parts[1]) || 5;
      factScore = parseInt(parts[2]) || 5;
      styleScore = parseInt(parts[3]) || 5;
      audienceReaction = parseInt(parts[4]) || 5;
      feedback = parts.slice(5).join(',').trim() || 'No feedback provided';
    } else {
      // Try extracting numbers from the text
      const numbers = evaluationText.match(/\d+/g);
      if (numbers && numbers.length >= 5) {
        [score, consistencyScore, factScore, styleScore, audienceReaction] = 
          numbers.slice(0, 5).map(n => parseInt(n));
      }
      // Extract feedback from the remaining text
      feedback = evaluationText.replace(/\d+/g, '').trim() || 'No feedback provided';
    }

    return {
      score: Math.min(Math.max(score, 1), 10),
      consistencyScore: Math.min(Math.max(consistencyScore, 1), 10),
      factScore: Math.min(Math.max(factScore, 1), 10),
      styleScore: Math.min(Math.max(styleScore, 1), 10),
      audienceReaction: Math.min(Math.max(audienceReaction, 1), 10),
      feedback
    };
  };

  try {
    // Get AI response first
    const aiResponse = await getAIResponse();
    
    // Then evaluate the argument
    const evaluation = await evaluateArgument();

    return {
      response: aiResponse,
      evaluation
    };
  } catch (error) {
    console.error('Error in debate continuation:', error);
    throw error;
  }
};

export const generateHint = async (
  topic: string,
  messages: Message[],
  difficulty: Difficulty,
  userPosition: Position
): Promise<string> => {
  const requestData = {
    model: HINT_MODEL,
    messages: [
      { 
        role: 'system', 
        content: `Generate a direct, concise argument ${userPosition} the topic "${topic}". Keep it under 50 words. State the argument directly without any prefixes like "I could" or "You should".`
      },
      {
        role: 'user',
        content: 'Provide a brief, focused argument for this position.'
      }
    ]
  };

  const response = await withAPILogging(
    () => axios.post<APIResponse<never>>(API_URL, requestData, { headers }),
    'generateHint',
    { method: 'POST', requestData }
  );

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }
  return content.trim();
};

export const endDebate = async (
  topic: string,
  userArguments: string[],
  userPosition: Position
): Promise<{ overallScore: number; rationale: string; recommendations: string }> => {
  const requestData = {
    model: FINAL_SCORING_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Evaluate the debate performance and provide a score (1-10), rationale, and recommendations. Format: score,rationale,recommendations'
      },
      {
        role: 'user',
        content: `Topic: "${topic}"\nPosition: ${userPosition}\nArguments:\n${userArguments.join('\n')}`
      }
    ]
  };

  const response = await withAPILogging(
    () => axios.post<APIResponse<never>>(API_URL, requestData, { headers }),
    'endDebate',
    { method: 'POST', requestData }
  );

  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }

  const [score, rationale, recommendations] = content.split(',');
  const overallScore = parseInt(score) || 5;

  return {
    overallScore: Math.min(Math.max(overallScore, 1), 10),
    rationale: rationale?.trim() || 'No rationale provided.',
    recommendations: recommendations?.trim() || 'No recommendations provided.'
  };
};

export const getLeaderboard = async (
  difficulty?: Difficulty,
  category?: string
): Promise<LeaderboardEntry[]> => {
  const response = await withAPILogging(
    () => axios.get<LeaderboardEntry[]>('/src/data/leaderboard.json'),
    'getLeaderboard',
    { method: 'GET', requestData: { difficulty, category } }
  );

  leaderboardData = response.data;

  return leaderboardData.filter(entry => 
    (!difficulty || entry.difficulty === difficulty) &&
    (!category || entry.category === category)
  );
};

export const submitScore = async (
  username: string,
  score: number,
  difficulty: Difficulty,
  category: string,
  subject: string
): Promise<void> => {
  const newEntry: LeaderboardEntry = {
    id: leaderboardData.length + 1,
    username,
    score,
    difficulty,
    category,
    subject,
  };

  await withAPILogging(
    async () => {
      leaderboardData.push(newEntry);
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData = leaderboardData.slice(0, 100); // Keep only top 100 scores
      
      const mockResponse: AxiosResponse = {
        data: null,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new axios.AxiosHeaders(),
        } as InternalAxiosRequestConfig,
      };
      
      return mockResponse;
    },
    'submitScore',
    { method: 'POST', requestData: newEntry }
  );
};
