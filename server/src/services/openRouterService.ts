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

    // Swap labels and scores based on who we're scoring
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

    const response = await this.generateCompletion(allMessages, model);
    await DiagnosticLogger.log('Received evaluation response:', response);
    
    // Parse response as number, default to current score if parsing fails
    const newScore = parseInt(response);
    if (isNaN(newScore)) {
      await DiagnosticLogger.error('Failed to parse score from response:', {
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

    // Create a single system message with clear instructions
    const systemMessage = {
      role: 'system',
      content: `You are debating ${position} the topic "${topic}". Keep responses under 3 sentences and maintain a clear position.`
    };

    // Format conversation history, excluding any existing system messages
    const conversationHistory = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'opponent' ? 'assistant' : 'user',
        content: msg.content
      }));

    // If there's no conversation history, add an initial prompt
    if (conversationHistory.length === 0) {
      conversationHistory.push({
        role: 'user',
        content: `The topic is: "${topic}". Start with a quick opening argument ${position} the topic.`
      });
    }

    // Combine system message with conversation history
    const allMessages = [systemMessage, ...conversationHistory];
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
