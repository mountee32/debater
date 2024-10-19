import axios from 'axios';
import { AIPersonality } from '../data/aiPersonalities';

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`,
};

const MAX_TOKENS = 150;

type Position = 'for' | 'against';

const ensureCompleteSentences = (text: string): string => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.join(' ').trim();
};

export const generateTopic = async (category: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<string> => {
  try {
    const difficultyInstructions = {
      easy: "Generate a simple, concise debate topic suitable for beginners. The topic should be straightforward and relatable.",
      medium: "Generate a brief, moderately complex debate topic. The topic should be thought-provoking but concise.",
      hard: "Generate a short, complex debate topic suitable for advanced debaters. The topic should be nuanced but concise."
    };

    const response = await axios.post(API_URL, {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an AI designed to generate concise debate topics. ${difficultyInstructions[difficulty]} Provide a complete topic in a single sentence, ideally between 10 to 15 words.` },
        { role: 'user', content: `Generate a brief, controversial debate topic related to ${category} that is appropriate for ${difficulty} difficulty.` }
      ],
      max_tokens: 50,
    }, { headers });

    const generatedTopic = response.data.choices[0].message.content.trim();
    return ensureCompleteSentences(generatedTopic);
  } catch (error) {
    console.error('Error generating topic:', error);
    throw new Error('Failed to generate a debate topic. Please try again.');
  }
};

export const startDebate = async (topic: string, difficulty: 'easy' | 'medium' | 'hard', userPosition: Position, aiPersonality: AIPersonality): Promise<string> => {
  try {
    const difficultyInstructions = {
      easy: "Provide simple arguments in a casual, friendly tone.",
      medium: "Provide moderately complex arguments in a conversational tone.",
      hard: "Provide nuanced arguments in a concise, direct tone."
    };

    const aiPosition = userPosition === 'for' ? 'against' : 'for';

    const response = await axios.post(API_URL, {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are ${aiPersonality.name}, an AI debate opponent with the following traits:
          - Argument style: ${aiPersonality.traits.argumentStyle}
          - Vocabulary: ${aiPersonality.traits.vocabulary}
          - Example types: ${aiPersonality.traits.exampleTypes}
          - Debate strategy: ${aiPersonality.traits.debateStrategy}
          Keep your responses short and conversational. ${difficultyInstructions[difficulty]} You are arguing ${aiPosition} the topic.` },
        { role: 'user', content: `The topic is: "${topic}". Start the debate with a brief, engaging opening argument ${aiPosition} the topic.` }
      ],
      max_tokens: MAX_TOKENS,
    }, { headers });

    return ensureCompleteSentences(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error starting debate:', error);
    throw new Error('Failed to start the debate. Please try again.');
  }
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
  try {
    const debateHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    debateHistory.push({ role: 'user', content: userArgument });

    const difficultyInstructions = {
      easy: "Provide simple counter-arguments in a casual, friendly tone.",
      medium: "Provide moderately complex counter-arguments in a conversational tone.",
      hard: "Provide nuanced counter-arguments in a concise, direct tone."
    };

    const aiPosition = userPosition === 'for' ? 'against' : 'for';

    const response = await axios.post(API_URL, {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are ${aiPersonality.name}, an AI debate opponent with the following traits:
          - Argument style: ${aiPersonality.traits.argumentStyle}
          - Vocabulary: ${aiPersonality.traits.vocabulary}
          - Example types: ${aiPersonality.traits.exampleTypes}
          - Debate strategy: ${aiPersonality.traits.debateStrategy}
          Keep your responses short and conversational. The topic is: "${topic}". ${difficultyInstructions[difficulty]} You are arguing ${aiPosition} the topic.` },
        ...debateHistory
      ],
      max_tokens: MAX_TOKENS,
    }, { headers });

    const aiResponse = ensureCompleteSentences(response.data.choices[0].message.content);
    const evaluation = await evaluateArgument(topic, userArgument, difficulty, messages.filter(msg => msg.role === 'user').map(msg => msg.content), userPosition);

    return { response: aiResponse, evaluation };
  } catch (error) {
    console.error('Error continuing debate:', error);
    throw new Error('Failed to continue the debate. Please try again.');
  }
};

export const generateHint = async (topic: string, messages: { role: string; content: string }[], difficulty: 'easy' | 'medium' | 'hard', userPosition: Position): Promise<string> => {
  try {
    const debateHistory = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const difficultyInstructions = {
      easy: "Provide a simple, straightforward argument suggestion.",
      medium: "Provide a moderately complex argument suggestion.",
      hard: "Provide a complex, nuanced argument suggestion."
    };

    const response = await axios.post(API_URL, {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an AI debate assistant. The topic is: "${topic}". ${difficultyInstructions[difficulty]} Respond with a brief, single suggestion that argues ${userPosition} the topic.` },
        ...debateHistory
      ],
      max_tokens: MAX_TOKENS,
    }, { headers });

    return ensureCompleteSentences(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error generating hint:', error);
    throw new Error('Failed to generate a hint. Please try again.');
  }
};

export const evaluateArgument = async (
  topic: string,
  argument: string,
  difficulty: 'easy' | 'medium' | 'hard',
  previousArguments: string[],
  userPosition: Position
): Promise<{
  score: number;
  feedback: string;
  consistencyScore: number;
  factScore: number;
  styleScore: number;
  audienceReaction: number;
}> => {
  try {
    const response = await axios.post(API_URL, {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an AI debate judge. Evaluate the following argument on the topic: "${topic}". The user is arguing ${userPosition} the topic. Provide scores from 1 to 10 for overall quality, consistency with previous arguments, factual accuracy, debate style, and audience reaction. Also provide brief feedback.` },
        { role: 'user', content: `Previous arguments:\n${previousArguments.join('\n')}\n\nCurrent argument:\n${argument}` }
      ],
      max_tokens: MAX_TOKENS,
    }, { headers });

    const content = ensureCompleteSentences(response.data.choices[0].message.content);
    const [scoreStr, consistencyStr, factStr, styleStr, audienceStr, ...feedbackParts] = content.split('\n');
    
    const parseScore = (str: string) => {
      const score = parseInt(str.match(/\d+/)?.[0] ?? '5', 10);
      return isNaN(score) ? 5 : Math.min(Math.max(score, 1), 10);
    };

    return {
      score: parseScore(scoreStr),
      consistencyScore: parseScore(consistencyStr),
      factScore: parseScore(factStr),
      styleScore: parseScore(styleStr),
      audienceReaction: parseScore(audienceStr),
      feedback: feedbackParts.join('\n').trim()
    };
  } catch (error) {
    console.error('Error evaluating argument:', error);
    throw new Error('Failed to evaluate the argument. Please try again.');
  }
};

export const calculateProgressiveScore = (baseScore: number, roundNumber: number): number => {
  const progressiveFactor = 1 + (roundNumber - 1) * 0.1; // 10% increase per round
  return Math.round(baseScore * progressiveFactor);
};

export const calculateComboBonus = (consecutiveGoodArguments: number): number => {
  return Math.min(consecutiveGoodArguments, 5); // Max 5 points bonus
};

export const endDebate = async (
  topic: string,
  userArguments: string[],
  argumentScores: number[],
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: Position
): Promise<{ overallScore: number; rationale: string; recommendations: string }> => {
  try {
    const averageScore = argumentScores.reduce((a, b) => a + b, 0) / argumentScores.length;
    const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 }[difficulty];
    const finalScore = Math.round(averageScore * difficultyMultiplier);
    
    const response = await axios.post(API_URL, {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an AI debate judge. The topic was: "${topic}". The user was arguing ${userPosition} the topic. Evaluate the user's overall performance, provide a final score out of 10, a brief rationale for the score, and concise recommendations for improvement. The user's average argument score was ${averageScore.toFixed(2)}, and the final score after applying the difficulty multiplier (${difficultyMultiplier}x) is ${finalScore}.` },
        { role: 'user', content: `Here are the user's arguments:\n${userArguments.join('\n')}` }
      ],
      max_tokens: MAX_TOKENS,
    }, { headers });

    const content = ensureCompleteSentences(response.data.choices[0].message.content);
    const [scoreStr, rationale, recommendations] = content.split('\n\n');
    const overallScore = parseInt(scoreStr.match(/\d+/)?.[0] ?? '5', 10);

    return { 
      overallScore: isNaN(overallScore) ? finalScore : Math.min(Math.max(overallScore, 1), 10),
      rationale: rationale || 'No rationale provided.',
      recommendations: recommendations || 'No recommendations provided.'
    };
  } catch (error) {
    console.error('Error ending debate:', error);
    throw new Error('Failed to end the debate. Please try again.');
  }
};

// Leaderboard data type
type LeaderboardEntry = {
  id: number;
  username: string;
  score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  subject: string;
};

// Function to load leaderboard data from localStorage
const loadLeaderboardData = (): LeaderboardEntry[] => {
  const storedData = localStorage.getItem('leaderboardData');
  return storedData ? JSON.parse(storedData) : [];
};

// Function to save leaderboard data to localStorage
const saveLeaderboardData = (data: LeaderboardEntry[]) => {
  localStorage.setItem('leaderboardData', JSON.stringify(data));
};

// Initialize leaderboard data from localStorage
let leaderboardData = loadLeaderboardData();

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
  leaderboardData.push(newEntry);
  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData = leaderboardData.slice(0, 100); // Keep only top 100 scores
  saveLeaderboardData(leaderboardData);
};

export const getLeaderboard = async (
  difficulty?: 'easy' | 'medium' | 'hard',
  category?: string
): Promise<LeaderboardEntry[]> => {
  return leaderboardData.filter(entry => 
    (!difficulty || entry.difficulty === difficulty) &&
    (!category || entry.category === category)
  );
};
