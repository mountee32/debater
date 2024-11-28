import axios from 'axios';
import { AIPersonality } from '../data/aiPersonalities';
import modelConfig from '../../models.config.json';

// Update API base URL to include /debate
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/debate';

const OPPONENT_MODEL = modelConfig.models.opponent.name;
const HINT_MODEL = modelConfig.models.hint.name;
const TURN_SCORING_MODEL = modelConfig.models.turnScoring.name;
const FINAL_SCORING_MODEL = modelConfig.models.finalScoring.name;

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

let leaderboardData: LeaderboardEntry[] = [];

// Add request interceptor for debugging
axios.interceptors.request.use(request => {
  console.log('Starting Request:', {
    url: request.url,
    method: request.method,
    data: request.data
  });
  return request;
});

// Add response interceptor for debugging
axios.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const generateTopic = async (category: string, difficulty?: Difficulty): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/topic`, {
      category,
      model: OPPONENT_MODEL
    });

    if (!response.data?.topic) {
      throw new Error('Invalid response format: missing topic');
    }

    return response.data.topic;
  } catch (error) {
    console.error('Generate topic error:', error);
    throw new Error('Failed to generate topic');
  }
};

export const startDebate = async (
  topic: string,
  difficulty: Difficulty,
  userPosition: Position,
  aiPersonality: AIPersonality
): Promise<string> => {
  try {
    const aiPosition = userPosition === 'for' ? 'against' : 'for';
    const messages = [
      { 
        role: 'system', 
        content: `You are ${aiPersonality.name}, debating ${aiPosition} the topic. Keep responses under 3 sentences.`
      },
      { 
        role: 'user', 
        content: `The topic is: "${topic}". Start with a quick opening argument ${aiPosition} the topic.`
      }
    ];

    const response = await axios.post(`${API_BASE_URL}/response`, {
      topic,
      position: aiPosition,
      messages,
      model: OPPONENT_MODEL
    });

    if (!response.data?.response) {
      throw new Error('Invalid response format: missing response');
    }

    return response.data.response;
  } catch (error) {
    console.error('Start debate error:', error);
    throw new Error('Failed to start debate');
  }
};

export const continueDebate = async (
  topic: string,
  messages: Message[],
  userArgument: string,
  difficulty: Difficulty,
  userPosition: Position,
  aiPersonality: AIPersonality,
  currentScores: { user: number; opponent: number }
): Promise<{
  response: string;
  newScore: number;
}> => {
  try {
    const aiPosition = userPosition === 'for' ? 'against' : 'for';

    // Map message roles to OpenRouter accepted roles
    const mappedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const [evaluationResponse, aiResponse] = await Promise.all([
      axios.post(`${API_BASE_URL}/evaluate`, {
        topic,
        position: userPosition,
        messages: [...mappedMessages, { role: 'user', content: userArgument }],
        currentScores,
        model: TURN_SCORING_MODEL
      }),
      axios.post(`${API_BASE_URL}/response`, {
        topic,
        position: aiPosition,
        messages: mappedMessages,
        model: OPPONENT_MODEL
      })
    ]);

    if (!aiResponse.data?.response || typeof evaluationResponse.data?.score !== 'number') {
      throw new Error('Invalid response format');
    }

    return {
      response: aiResponse.data.response,
      newScore: evaluationResponse.data.score
    };
  } catch (error) {
    console.error('Continue debate error:', error);
    throw new Error('Failed to continue debate');
  }
};

export const generateHint = async (
  topic: string,
  messages: Message[],
  difficulty: Difficulty,
  userPosition: Position
): Promise<string> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/hint`, {
      topic,
      position: userPosition,
      model: HINT_MODEL
    });

    if (!response.data?.hint) {
      throw new Error('Invalid response format: missing hint');
    }

    return response.data.hint;
  } catch (error) {
    console.error('Generate hint error:', error);
    throw new Error('Failed to generate hint');
  }
};

export const endDebate = async (
  topic: string,
  userArguments: string[],
  userPosition: Position
): Promise<{ overallScore: number; rationale: string; recommendations: string }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/evaluate-debate`, {
      topic,
      userArguments,
      position: userPosition,
      model: FINAL_SCORING_MODEL
    });

    if (!response.data?.overallScore) {
      throw new Error('Invalid response format: missing evaluation data');
    }

    return response.data;
  } catch (error) {
    console.error('End debate error:', error);
    throw new Error('Failed to end debate');
  }
};

export const getLeaderboard = async (
  difficulty?: Difficulty,
  category?: string
): Promise<LeaderboardEntry[]> => {
  if (leaderboardData.length === 0) {
    const response = await axios.get<LeaderboardEntry[]>('/src/data/leaderboard.json');
    leaderboardData = response.data || [];
  }

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

  leaderboardData.push(newEntry);
  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData = leaderboardData.slice(0, 100);
};
