import axios from 'axios';
import { env } from '../config/env';
import { ApiLogger } from './apiLogger';
import DiagnosticLogger from '../utils/diagnosticLogger';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_BASE_URL = env.API_BASE_URL || 'http://localhost:3000/api/debate';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': env.CORS_ORIGIN,
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

export class OpenRouterService {
  static async generateCompletion(messages: Message[], model: string): Promise<string> {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cleanedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })).filter(msg => msg.content.trim() !== '');

        const requestData = {
          model,
          messages: cleanedMessages,
          temperature: 0.7,
          max_tokens: 500
        };

        await DiagnosticLogger.log('Generating completion with request:', requestData);

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
        } else {
          throw new Error(`OpenRouter API failed after ${maxRetries} attempts: ${error.message}`);
        }
      }
    }

    throw new Error('Unexpected error in generateCompletion');
  }

  static async generateTopic(category: string, model: string): Promise<string> {
    await DiagnosticLogger.log('Generating topic:', { category, model });
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
6. Specific enough for focused debate
7. Broad enough for multiple arguments

FORMAT:
- State the topic as a clear proposition
- Avoid loaded language or bias
- Use present tense
- Keep under 15 words

EXAMPLES:
- "Social media does more harm than good to society"
- "Artificial intelligence will benefit humanity more than harm it"
- "Governments should implement universal basic income"

Return ONLY the topic statement, no additional text.`
      },
      {
        role: 'user',
        content: 'Generate a concise, controversial debate topic.'
      }
    ];

    return this.generateCompletion(messages, model);
  }

  static async generateHint(topic: string, position: string, model: string): Promise<string> {
    await DiagnosticLogger.log('Generating hint:', { topic, position, model });
    const messages = [
      {
        role: 'system',
        content: `You are a debate coach providing strategic hints for a debate on "${topic}". The debater is arguing ${position} the topic.

HINT GUIDELINES:
1. Focus on strengthening the ${position} position
2. Suggest specific arguments or evidence
3. Point out potential counterarguments to address
4. Highlight strategic opportunities
5. Keep hints concise and actionable

HINT STRUCTURE:
- Start with a clear strategic direction
- Provide specific supporting details
- Suggest how to counter opponent's likely responses

HINT TYPES:
- Evidence suggestions
- Logical frameworks
- Rhetorical techniques
- Counter-argument preparation
- Position strengthening

Keep the hint under 2 sentences for clarity and impact.`
      },
      {
        role: 'user',
        content: `Provide a strategic hint for arguing ${position} on the topic "${topic}".`
      }
    ];

    return this.generateCompletion(messages, model);
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
