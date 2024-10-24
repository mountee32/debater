import { Message } from '../types/game';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const JUDGE_MODEL = import.meta.env.VITE_JUDGE_MODEL || 'anthropic/claude-2';
const DEBATER_MODEL = import.meta.env.VITE_DEBATER_MODEL || 'anthropic/claude-2';
const FALLBACK_MODEL = import.meta.env.VITE_FALLBACK_MODEL || 'gryphe/mythomist-7b';

export async function sendMessage(messages: Message[], role: 'judge' | 'debater' = 'debater') {
  try {
    const model = role === 'judge' ? JUDGE_MODEL : DEBATER_MODEL;
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5173/',
        'X-Title': 'Debate Game',
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      console.error('Primary model failed, falling back to alternative model');
      // Retry with fallback model
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173/',
          'X-Title': 'Debate Game',
        },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error('Both primary and fallback models failed');
      }

      const fallbackData = await fallbackResponse.json();
      return fallbackData.choices[0].message.content;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}
