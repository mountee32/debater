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
      content: `You are scoring the ${primaryLabel}'s latest message in a debate on "${topic}".

SCORING TARGET: ${primaryLabel}'s message

Current scores - ${primaryLabel}: ${primaryScore}%, ${secondaryLabel}: ${secondaryScore}%.

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

  static async evaluateDebate(
    topic: string, 
    userArguments: string[], 
    position: string, 
    model: string
  ): Promise<{ overallScore: number; rationale: string; recommendations: string }> {
    const messages = [
      {
        role: 'system',
        content: `You are evaluating a completed debate on the topic "${topic}". The user argued ${position}.

EVALUATION CRITERIA:
1. Argument Quality
   - Logical consistency
   - Evidence usage
   - Counterargument handling
   - Position maintenance

2. Debate Strategy
   - Opening strength
   - Point development
   - Response effectiveness
   - Closing impact

3. Technical Skills
   - Clarity of expression
   - Rhetorical effectiveness
   - Argument structure
   - Evidence integration

FORMAT RESPONSE EXACTLY:
SCORE: [0-100]
RATIONALE: [2-3 sentences explaining score]
RECOMMENDATIONS: [3-4 bullet points for improvement]`
      },
      {
        role: 'user',
        content: `Here are all the user's arguments from the debate:\n${userArguments.join('\n')}`
      }
    ];

    const response = await this.generateCompletion(messages, model);
    
    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const rationaleMatch = response.match(/RATIONALE:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/);
    const recommendationsMatch = response.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/);

    return {
      overallScore: scoreMatch ? parseInt(scoreMatch[1]) : 50,
      rationale: rationaleMatch ? rationaleMatch[1].trim() : 'No rationale provided',
      recommendations: recommendationsMatch ? recommendationsMatch[1].trim() : 'No recommendations provided'
    };
  }
}
