import axios from 'axios';
import { AIPersonality } from '../data/aiPersonalities';
import { withAPILogging } from '../utils/logger';
import modelConfig from '../../models.config.json';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Load models from config with environment variable overrides
const OPPONENT_MODEL = import.meta.env.VITE_OPPONENT_MODEL || modelConfig.models.opponent.name;
const HINT_MODEL = import.meta.env.VITE_HINT_MODEL || modelConfig.models.hint.name;
const TURN_SCORING_MODEL = import.meta.env.VITE_TURN_SCORING_MODEL || modelConfig.models.turnScoring.name;
const FINAL_SCORING_MODEL = import.meta.env.VITE_FINAL_SCORING_MODEL || modelConfig.models.finalScoring.name;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
  'HTTP-Referer': 'http://localhost:5174',
  'X-Title': 'Debate Master'
};

type Position = 'for' | 'against';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  subject: string;
}

let leaderboardData: LeaderboardEntry[] = [];

export const generateTopic = async (category: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<string> => {
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

  return withAPILogging(
    async () => {
      const response = await axios.post(API_URL, requestData, { headers });
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format');
      }
      return response.data.choices[0].message.content;
    },
    'generateTopic',
    'POST',
    requestData
  ).catch(error => {
    console.error('Error generating topic:', error);
    throw new Error('Failed to generate a topic. Please try again.');
  });
};

export const startDebate = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
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

  return withAPILogging(
    async () => {
      const response = await axios.post(API_URL, requestData, { headers });
      const content = response.data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Invalid response format');
      }
      return content.trim();
    },
    'startDebate',
    'POST',
    requestData
  ).catch(error => {
    console.error('Error starting debate:', error);
    throw new Error('Failed to start the debate. Please try again.');
  });
};

export const continueDebate = async (
  topic: string,
  messages: { role: string; content: string }[],
  userArgument: string,
  difficulty: 'easy' | 'medium' | 'hard',
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

    try {
      const response = await withAPILogging(
        async () => {
          const response = await axios.post(API_URL, responseRequestData, { headers });
          const content = response.data?.choices?.[0]?.message?.content;
          if (typeof content !== 'string') {
            throw new Error('Invalid response format');
          }
          return content.trim();
        },
        'continueDebate-response',
        'POST',
        responseRequestData
      );
      return response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
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

    try {
      const evaluationText = await withAPILogging(
        async () => {
          const response = await axios.post(API_URL, evaluationRequestData, { headers });
          const content = response.data?.choices?.[0]?.message?.content;
          if (typeof content !== 'string') {
            throw new Error('Invalid evaluation format');
          }
          return content.trim();
        },
        'continueDebate-evaluation',
        'POST',
        evaluationRequestData
      );

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
    } catch (error) {
      console.error('Error evaluating argument:', error);
      // Return default evaluation on error
      return {
        score: 5,
        consistencyScore: 5,
        factScore: 5,
        styleScore: 5,
        audienceReaction: 5,
        feedback: 'Evaluation unavailable at the moment.'
      };
    }
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
  messages: { role: string; content: string }[],
  difficulty: 'easy' | 'medium' | 'hard',
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

  return withAPILogging(
    async () => {
      const response = await axios.post(API_URL, requestData, { headers });
      const content = response.data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('Invalid response format');
      }
      return content.trim();
    },
    'generateHint',
    'POST',
    requestData
  ).catch(error => {
    console.error('Error generating hint:', error);
    throw new Error('Failed to generate a hint. Please try again.');
  });
};

export const endDebate = async (
  topic: string,
  userArguments: string[],
  argumentScores: number[],
  difficulty: 'easy' | 'medium' | 'hard',
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

  return withAPILogging(
    async () => {
      const response = await axios.post(API_URL, requestData, { headers });
      const content = response.data?.choices?.[0]?.message?.content;
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
    },
    'endDebate',
    'POST',
    requestData
  ).catch(error => {
    console.error('Error ending debate:', error);
    throw new Error('Failed to end the debate. Please try again.');
  });
};

export const getLeaderboard = async (
  difficulty?: 'easy' | 'medium' | 'hard',
  category?: string
): Promise<LeaderboardEntry[]> => {
  return withAPILogging(
    async () => {
      const response = await fetch('/src/data/leaderboard.json');
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      const data = await response.json();
      leaderboardData = data;

      return leaderboardData.filter(entry => 
        (!difficulty || entry.difficulty === difficulty) &&
        (!category || entry.category === category)
      );
    },
    'getLeaderboard',
    'GET',
    { difficulty, category }
  ).catch(error => {
    console.error('Error loading leaderboard:', error);
    return [];
  });
};

export const submitScore = async (
  username: string,
  score: number,
  difficulty: 'easy' | 'medium' | 'hard',
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

  return withAPILogging(
    async () => {
      leaderboardData.push(newEntry);
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData = leaderboardData.slice(0, 100); // Keep only top 100 scores
    },
    'submitScore',
    'POST',
    newEntry
  );
};
