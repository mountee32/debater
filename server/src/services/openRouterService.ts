import axios from 'axios';
import { env } from '../config/env';
import { ApiLogger } from './apiLogger';

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

      console.log('[OpenRouterService] About to log request');
      // Log the request
      const requestId = await ApiLogger.logRequest(API_URL, 'POST', {
        ...requestData,
        headers: {
          ...headers,
          'Authorization': 'Bearer [REDACTED]'
        }
      });
      console.log('[OpenRouterService] Request logged with ID:', requestId);

      const response = await axios.post<APIResponse>(
        API_URL,
        requestData,
        { headers }
      );

      console.log('[OpenRouterService] About to log response');
      // Log the response
      await ApiLogger.logResponse(requestId, API_URL, 'POST', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      console.log('[OpenRouterService] Response logged');

      if (!response.data?.choices?.[0]?.message?.content) {
        console.error('Invalid OpenRouter response format:', response.data);
        throw new Error('Invalid response format from OpenRouter API');
      }

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: axios.isAxiosError(error) ? {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        } : undefined
      });
      
      if (axios.isAxiosError(error)) {
        throw new Error(`OpenRouter API error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  static async generateTopic(category: string, model: string): Promise<string> {
    console.log('[OpenRouterService] Generating topic:', { category, model });
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
    argument: string,
    model: string
  ): Promise<{
    score: number;
    consistencyScore: number;
    factScore: number;
    styleScore: number;
    audienceReaction: number;
    feedback: string;
  }> {
    console.log('[OpenRouterService] Evaluating argument:', { topic, position, model });
    const messages = [
      {
        role: 'system',
        content: 'Rate the argument from 1-10 on: overall quality, consistency, facts, style, and audience reaction. Format: score,consistency,facts,style,audience,feedback'
      },
      {
        role: 'user',
        content: `Topic: "${topic}"\nPosition: ${position}\nArgument: ${argument}`
      }
    ];

    const response = await this.generateCompletion(messages, model);
    const parts = response.split(',');
    
    return {
      score: parseInt(parts[0]) || 5,
      consistencyScore: parseInt(parts[1]) || 5,
      factScore: parseInt(parts[2]) || 5,
      styleScore: parseInt(parts[3]) || 5,
      audienceReaction: parseInt(parts[4]) || 5,
      feedback: parts.slice(5).join(',').trim() || 'No feedback provided'
    };
  }

  static async generateDebateResponse(
    topic: string,
    position: 'for' | 'against',
    messages: Message[],
    model: string
  ): Promise<string> {
    console.log('[OpenRouterService] Generating debate response:', { topic, position, model });
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
    console.log('[OpenRouterService] Generating hint:', { topic, position, model });
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
    console.log('[OpenRouterService] Evaluating debate:', { topic, position, model });
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
    const [score, rationale, recommendations] = response.split(',');

    return {
      overallScore: parseInt(score) || 5,
      rationale: rationale?.trim() || 'No rationale provided.',
      recommendations: recommendations?.trim() || 'No recommendations provided.'
    };
  }
}
