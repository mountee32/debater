import axios from 'axios';
import { env } from '../config/env';
import { ApiLogger } from './apiLogger';
import DiagnosticLogger from '../utils/diagnosticLogger';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': env.CORS_ORIGIN,
  'X-Title': 'Debate Master'
};

interface Message {
  role: string;
  content: string;
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
    try {
      const requestData = {
        model,
        messages,
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

      if (!response.data?.choices?.[0]?.message?.content) {
        const error = 'Invalid OpenRouter response format';
        await DiagnosticLogger.error(error, response.data);
        throw new Error(error);
      }

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      await DiagnosticLogger.error('OpenRouter API error:', error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`OpenRouter API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  static async generateTopic(category: string, model: string): Promise<string> {
    await DiagnosticLogger.log('Generating topic:', { category, model });
    const messages = [
      {
        role: 'system',
        content: `Generate a debate topic related to ${category}.`
      },
      {
        role: 'user',
        content: 'Generate a concise, controversial debate topic.'
      }
    ];

    return this.generateCompletion(messages, model);
  }

  static async evaluateArgument(
    topic: string,
    position: 'for' | 'against',
    messages: Message[],
    currentScores: { user: number; opponent: number },
    model: string
  ): Promise<number> {
    await DiagnosticLogger.log('Evaluating argument:', { 
      topic, 
      position, 
      currentScores,
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    const systemMessage = {
      role: 'system',
      content: `You are scoring a debate on "${topic}". Current scores - Player: ${currentScores.user}%, AI: ${currentScores.opponent}%.

IMPORTANT: You must respond with ONLY a number between 0 and 100 representing the player's new overall percentage score. No other text or explanation.

This score represents their relative debate performance against the AI opponent. The scores must sum to 100%, so if you give the player 60%, the AI automatically gets 40%.

Example responses:
55
48
62

Analyze the debate history and latest message to determine the new score:`
    };

    const allMessages = [systemMessage, ...messages];
    await DiagnosticLogger.log('Sending evaluation request with messages:', allMessages);

    const response = await this.generateCompletion(allMessages, model);
    await DiagnosticLogger.log('Received evaluation response:', response);
    
    // Parse response as number, default to current score if parsing fails
    const newScore = parseInt(response);
    if (isNaN(newScore)) {
      await DiagnosticLogger.error('Failed to parse score from response:', {
        response,
        parsedValue: newScore
      });
      return currentScores.user;
    }

    const boundedScore = Math.min(Math.max(newScore, 0), 100);
    await DiagnosticLogger.log('Final calculated score:', {
      rawScore: newScore,
      boundedScore,
      originalScore: currentScores.user
    });

    return boundedScore;
  }

  static async generateDebateResponse(
    topic: string,
    position: 'for' | 'against',
    messages: Message[],
    model: string
  ): Promise<string> {
    await DiagnosticLogger.log('Generating debate response:', { 
      topic, 
      position,
      messagesCount: messages.length
    });

    const systemMessage = {
      role: 'system',
      content: `You are debating ${position} the topic "${topic}". Keep responses under 3 sentences.`
    };

    const allMessages = [systemMessage, ...messages];
    return this.generateCompletion(allMessages, model);
  }

  static async generateHint(
    topic: string,
    position: 'for' | 'against',
    model: string
  ): Promise<string> {
    await DiagnosticLogger.log('Generating hint:', { topic, position });
    const messages = [
      {
        role: 'system',
        content: `Generate a direct, concise argument ${position} the topic "${topic}". Keep it under 50 words. State the argument directly without any prefixes like "I could" or "You should".`
      },
      {
        role: 'user',
        content: 'Provide a brief, focused argument for this position.'
      }
    ];

    return this.generateCompletion(messages, model);
  }

  static async evaluateDebate(
    topic: string,
    userArguments: string[],
    position: 'for' | 'against',
    model: string
  ): Promise<{
    overallScore: number;
    rationale: string;
    recommendations: string;
  }> {
    await DiagnosticLogger.log('Evaluating debate:', { 
      topic, 
      position,
      argumentsCount: userArguments.length
    });

    const messages = [
      {
        role: 'system',
        content: 'Evaluate the debate performance and provide a score (1-10), rationale, and recommendations. Format: score,rationale,recommendations'
      },
      {
        role: 'user',
        content: `Topic: "${topic}"\nPosition: ${position}\nArguments:\n${userArguments.join('\n')}`
      }
    ];

    const response = await this.generateCompletion(messages, model);
    await DiagnosticLogger.log('Received debate evaluation response:', response);

    const [score, rationale, recommendations] = response.split(',');

    const result = {
      overallScore: parseInt(score) || 5,
      rationale: rationale?.trim() || 'No rationale provided.',
      recommendations: recommendations?.trim() || 'No recommendations provided.'
    };

    await DiagnosticLogger.log('Parsed debate evaluation result:', result);
    return result;
  }
}
