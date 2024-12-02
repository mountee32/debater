import axios from 'axios';
import { env } from '../config/env';
import { ApiLogger } from './apiLogger';
import DiagnosticLogger from '../utils/diagnosticLogger';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_BASE_URL = env.API_BASE_URL || 'http://localhost:3000/api/debate';

// Update headers to include both possible frontend ports
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'].join(','),
  'X-Title': 'Debate Master'
};

interface Message {
  role: string;
  content: string;
  id?: number;
  score?: {
    score: number;
    previousScore: number;
  };
}

interface APIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  temperature: number;
  maxTokens: number;
  scoreMultiplier: number;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    temperature: 0.3,
    maxTokens: 200,
    scoreMultiplier: 1.5 // More lenient scoring
  },
  medium: {
    temperature: 0.5,
    maxTokens: 350,
    scoreMultiplier: 1.0 // Standard scoring
  },
  hard: {
    temperature: 0.7,
    maxTokens: 500,
    scoreMultiplier: 0.8 // Stricter scoring
  }
};

export class OpenRouterService {
  private static generatePersonalityPrompt(aiPersonality: any, position: string, topic: string, difficulty: Difficulty) {
    const difficultyMods = aiPersonality.difficultyModifiers[difficulty];
    
    return `You are ${aiPersonality.name}, ${aiPersonality.description}. You are debating ${position} the topic "${topic}".

DIFFICULTY ADAPTATION (${difficulty}):
- Vocabulary Level: ${difficultyMods.vocabularyLevel}
- Argument Complexity: ${difficultyMods.argumentComplexity}
- Response Length: ${difficultyMods.responseLength}
- Example Types: ${difficultyMods.exampleTypes.join(', ')}

PERSONALITY TRAITS:
- Argument Style: ${aiPersonality.traits.argumentStyle}
- Vocabulary: ${difficultyMods.vocabularyLevel}
- Example Types: ${difficultyMods.exampleTypes.join(', ')}
- Debate Strategy: ${aiPersonality.traits.debateStrategy}

BEHAVIORAL GUIDELINES:
${aiPersonality.behaviorGuidelines.map((guideline: string) => `- ${guideline}`).join('\n')}

LANGUAGE STYLE:
- Tone: ${aiPersonality.languageStyle.tone}
- Complexity: Adapted for ${difficulty} difficulty
- Preferred Phrases: ${aiPersonality.languageStyle.preferredPhrases.join(', ')}
- Phrases to Avoid: ${aiPersonality.languageStyle.avoidedPhrases.join(', ')}

DEBATE APPROACH:
- Opening Style: ${aiPersonality.debateApproach.openingStyle}
- Counter-Argument Style: ${aiPersonality.debateApproach.counterArgumentStyle}
- Evidence Preference: ${aiPersonality.debateApproach.evidencePreference}
- Persuasion Techniques: ${aiPersonality.debateApproach.persuasionTechniques.join(', ')}

RESPONSE FORMAT:
- Keep responses under ${DIFFICULTY_CONFIGS[difficulty].maxTokens / 2} words
- Maintain ${difficultyMods.argumentComplexity}
- Use ${difficultyMods.vocabularyLevel}
- Focus on ${difficultyMods.exampleTypes.join(' and ')}

Your responses should reflect your personality while adapting to the ${difficulty} difficulty level.`;
  }

  static async generateCompletion(messages: Message[], model: string, difficulty: Difficulty = 'medium'): Promise<string> {
    const maxRetries = 3;
    const retryDelay = 1000;
    const config = DIFFICULTY_CONFIGS[difficulty];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cleanedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })).filter(msg => msg.content.trim() !== '');

        const requestData = {
          model: model, // Use the model parameter directly
          messages: cleanedMessages,
          temperature: config.temperature,
          max_tokens: config.maxTokens
        };

        await DiagnosticLogger.log('Generating completion with request:', {
          ...requestData,
          difficulty,
          configUsed: config
        });

        const requestId = await ApiLogger.logRequest(API_URL, 'POST', {
          ...requestData,
          headers: {
            ...headers,
            'Authorization': 'Bearer [REDACTED]'
          }
        });

        const response = await axios.post<APIResponse>(
          API_URL,
          requestData,
          { headers }
        );

        await DiagnosticLogger.log('Received API response:', {
          status: response.status,
          data: response.data
        });

        await ApiLogger.logResponse(requestId, API_URL, 'POST', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers
        });

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          const warning = 'Empty or missing content in OpenRouter response';
          await DiagnosticLogger.warn(warning, response.data);
          return '';
        }

        return content.trim();
      } catch (error: any) {
        await DiagnosticLogger.error(`Attempt ${attempt} failed for OpenRouter API:`, error);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // On final attempt, throw error with more details
        if (error.response) {
          await DiagnosticLogger.error('API Error Response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
          throw new Error(`OpenRouter API failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        }
        throw new Error(`OpenRouter API failed: ${error.message}`);
      }
    }

    throw new Error('Unexpected error in generateCompletion');
  }

  static async generateTopic(category: string, model: string, difficulty: Difficulty = 'medium'): Promise<string> {
    await DiagnosticLogger.log('Generating topic:', { category, model, difficulty });
    
    const difficultyGuidelines = {
      easy: 'Create topics suitable for young audiences (12 and under), using clear positions and everyday concepts.',
      medium: 'Balance complexity with accessibility, suitable for teenagers with some debate experience.',
      hard: 'Create sophisticated topics with multiple valid perspectives, requiring deep analysis.'
    };

    const messages = [
      {
        role: 'system',
        content: `You are a debate topic generator specializing in creating engaging, thought-provoking topics for structured debates.

TOPIC REQUIREMENTS:
1. Related to category: ${category}
2. Controversial but not offensive
3. Clear and concise phrasing
4. Balanced - allows strong arguments on both sides
5. Contemporary relevance
6. Difficulty level: ${difficulty}
${difficultyGuidelines[difficulty]}

FORMAT:
- State the topic as a clear proposition
- Avoid loaded language or bias
- Use present tense
- Keep under 15 words

EXAMPLES:
- Easy: "Schools should have longer lunch breaks"
- Medium: "Social media does more harm than good to society"
- Hard: "Artificial intelligence will fundamentally alter human consciousness"

Return ONLY the topic statement, no additional text.`
      },
      {
        role: 'user',
        content: 'Generate a concise, controversial debate topic.'
      }
    ];

    return this.generateCompletion(messages, model, difficulty);
  }

  static async generateHint(topic: string, position: string, model: string, difficulty: Difficulty = 'medium'): Promise<string> {
    await DiagnosticLogger.log('Generating hint:', { topic, position, model, difficulty });
    
    const difficultyGuidelines = {
      easy: 'Provide clear, straightforward hints with simple examples and basic strategies.',
      medium: 'Balance between basic and advanced strategies, with moderate complexity.',
      hard: 'Offer sophisticated strategic guidance requiring critical thinking and analysis.'
    };

    const messages = [
      {
        role: 'system',
        content: `You are a debate coach providing strategic hints for a debate on "${topic}". The debater is arguing ${position} the topic.

HINT GUIDELINES:
1. Focus on strengthening the ${position} position
2. Suggest specific arguments or evidence
3. Point out potential counterarguments to address
4. Highlight strategic opportunities
5. Adapt to ${difficulty} difficulty level
${difficultyGuidelines[difficulty]}

HINT STRUCTURE:
- Start with a clear strategic direction
- Provide specific supporting details
- Suggest how to counter opponent's likely responses

Keep the hint under 2 sentences for clarity and impact.`
      },
      {
        role: 'user',
        content: `Provide a strategic hint for arguing ${position} on the topic "${topic}".`
      }
    ];

    return this.generateCompletion(messages, model, difficulty);
  }

  static async evaluateArgument(
    topic: string,
    position: string,
    messages: Message[],
    currentScores: { [key: string]: number },
    model: string,
    roleToScore: string,
    difficulty: Difficulty = 'medium'
  ): Promise<number> {
    await DiagnosticLogger.log('Evaluating argument:', { 
      topic, position, messages, currentScores, model, roleToScore, difficulty 
    });

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new Error('No message to evaluate');
    }

    const difficultyScoring = {
      easy: 'Be more lenient with scoring. Focus on basic argument structure and clarity.',
      medium: 'Use balanced scoring criteria. Consider both basic and advanced elements.',
      hard: 'Apply strict scoring criteria. Expect sophisticated arguments and evidence.'
    };

    const systemPrompt = {
      role: 'system',
      content: `You are an expert debate judge evaluating arguments on the topic: "${topic}".
      
SCORING CRITERIA:
1. Relevance to topic
2. Logical reasoning
3. Evidence/examples used
4. Clarity of expression
5. Response to counterarguments
6. Persuasiveness

DIFFICULTY LEVEL: ${difficulty}
${difficultyScoring[difficulty]}

SCORING SCALE:
0-20: Poor - Irrelevant, illogical, or unclear
21-40: Fair - Basic argument with significant flaws
41-60: Good - Clear argument with some supporting evidence
61-80: Very Good - Strong argument with solid evidence
81-100: Excellent - Exceptional argument with compelling evidence

Current scores: ${Object.entries(currentScores).map(([role, score]) => 
  `${role}: ${score}`).join(', ')}

Evaluate the latest argument and return ONLY a number between 0-100.`
    };

    const userPrompt = {
      role: 'user',
      content: `Evaluate this ${position} argument: "${lastMessage.content}"`
    };

    const scoreResponse = await this.generateCompletion(
      [systemPrompt, userPrompt],
      model,
      difficulty
    );

    // Parse and normalize score
    let score = parseInt(scoreResponse);
    
    // Handle invalid scores
    if (isNaN(score)) {
      await DiagnosticLogger.warn('Invalid score format, defaulting to 50:', scoreResponse);
      score = 50;
    }

    // Apply difficulty multiplier
    score = Math.round(score * DIFFICULTY_CONFIGS[difficulty].scoreMultiplier);

    // Bound score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return score;
  }

  static async getLeaderboard(): Promise<Array<{ name: string; score: number }>> {
    const response = await axios.get(`${API_BASE_URL}/leaderboard`);
    return response.data.leaderboard;
  }

  static async submitScore(name: string, score: number): Promise<void> {
    await axios.post(`${API_BASE_URL}/submit-score`, {
      name,
      score
    });
  }
}
