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
  id?: number;
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
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Clean and map messages to valid API roles
        const mappedMessages = messages.map(msg => ({
          role: msg.role === 'opponent' ? 'assistant' : 
                msg.role === 'user' || msg.role === 'system' ? msg.role : 'user',
          content: msg.content
        })).filter(msg => msg.content.trim() !== '');

        const requestData = {
          model,
          messages: mappedMessages,
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

        // Safeguard against empty or missing content
        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) {
          const warning = 'Empty or missing content in OpenRouter response';
          await DiagnosticLogger.warn(warning, response.data);
          return ''; // Return an empty string as a default value
        }

        return content.trim();
      } catch (error: any) { // Explicitly cast error to any
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
    model: string,
    roleToScore: 'user' | 'opponent'
  ): Promise<number> {
    await DiagnosticLogger.log('Evaluating argument:', { 
      topic, 
      position, 
      currentScores,
      roleToScore,
      messagesCount: messages.length,
      lastMessage: messages[messages.length - 1]
    });

    const [primaryLabel, secondaryLabel] = roleToScore === 'user' 
        ? ['User (Player)', 'Assistant (AI)']
        : ['Assistant (AI)', 'User (Player)'];
    
    const [primaryScore, secondaryScore] = roleToScore === 'user'
        ? [currentScores.user, currentScores.opponent]
        : [currentScores.opponent, currentScores.user];

    const systemMessage = {
      role: 'system',
      content: `You are scoring a debate on "${topic}". Current scores - ${primaryLabel}: ${primaryScore}%, ${secondaryLabel}: ${secondaryScore}%.

SCORING PRINCIPLES:

Momentum Shifts
- Series of strong arguments should compound for +10-15 points
- Successfully countering main points causes +8-12 point shifts
- Failing to address critical counterpoints results in -10-15 point penalties
- Dropping previously made strong points causes -5-8 point penalties

Point Impact
- Core topic arguments worth +5-8 points more than peripheral points
- Novel arguments worth +3-5 points more than repeated points
- Well-supported claims worth +5-7 points more than unsupported assertions
- Direct rebuttals worth +7-10 points more than tangential responses

Debate Flow
- Building on previous strong points multiplies impact by 1.5x
- Dropping/failing to defend points reduces score by 8-12 points
- Successfully maintaining position against strong counterarguments adds 10-15 points
- Contradicting own points reduces score by 12-15 points

Position Management
- Maintaining consistent position: +5-8 points
- Successfully defending position against pressure: +10-15 points
- Partial agreement while defending core position: -3-5 points
- Agreeing with opponent's core arguments: -15-20 points
- Abandoning position entirely: -30-40 points

Critical Moments
- Defending against strong counterarguments: +10-15 points
- Landing unanswered critical points: +12-18 points
- Minor concessions while maintaining overall position: -5-10 points
- Major concessions undermining core position: -15-25 points
- Agreeing with opponent's main position: -25-35 points
- Complete position reversal: -35-45 points

RESPONSE FORMAT:
Return ONLY a number between 0-100 representing the ${primaryLabel}'s new overall percentage score. No other text.

Example valid responses:
55
48
62`
    };

    const allMessages = [systemMessage, ...messages];
    
    await DiagnosticLogger.log('Sending evaluation request:', {
      systemMessage: systemMessage.content,
      messageCount: allMessages.length
    });

    try {
      const response = await this.generateCompletion(allMessages, model);
      await DiagnosticLogger.log('Received evaluation response:', response);
      
      const newScore = parseInt(response);
      if (isNaN(newScore)) {
        await DiagnosticLogger.warn('Failed to parse score from response:', {
          response,
          parsedValue: newScore
        });
        return roleToScore === 'user' ? currentScores.user : currentScores.opponent;
      }

      const boundedScore = Math.min(Math.max(newScore, 0), 100);
      await DiagnosticLogger.log('Final calculated score:', {
        roleToScore,
        rawScore: newScore,
        boundedScore,
        originalScore: roleToScore === 'user' ? currentScores.user : currentScores.opponent
      });

      return boundedScore;
    } catch (error: any) {
      await DiagnosticLogger.error('Scoring API failed:', error);
      return roleToScore === 'user' ? currentScores.user : currentScores.opponent;
    }
  }

  static async generateHint(topic: string, position: string, model: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are an assistant providing hints for a debate. The topic is "${topic}". Provide a hint for the position "${position}".`
      },
      {
        role: 'user',
        content: `Provide a helpful hint for debating the position "${position}" on the topic "${topic}".`
      }
    ];

    return this.generateCompletion(messages, model);
  }

  static async evaluateDebate(topic: string, userArguments: string[], position: string, model: string): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `You are evaluating a debate on the topic "${topic}". The user has taken the position "${position}". Evaluate the user's arguments and provide feedback.`
      },
      {
        role: 'user',
        content: `Evaluate the following arguments: ${userArguments.join(' ')}`
      }
    ];

    return this.generateCompletion(messages, model);
  }
}
