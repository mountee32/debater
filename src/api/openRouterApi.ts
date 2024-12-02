import axios from 'axios';
import { AIPersonality } from '../data/aiPersonalities';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/debate';

// API Message type for external communication
export type ApiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id?: number;
  score?: {
    score: number;
    previousScore: number;
  };
}

// Internal Message type
type Message = {
  role: 'user' | 'opponent' | 'hint' | 'system';
  content: string;
  id?: number;
  score?: {
    score: number;
    previousScore: number;
  };
}

// Map internal messages to API format
const mapToApiMessages = (messages: Message[]): ApiMessage[] => {
  return messages.map(msg => {
    const { content, id, score } = msg;
    if (msg.role === 'system') return { role: 'system', content, id, score };
    if (msg.role === 'opponent' || msg.role === 'hint') return { role: 'assistant', content, id, score };
    return { role: 'user', content, id, score };
  });
};

const generatePersonalityPrompt = (
  aiPersonality: AIPersonality,
  topic: string,
  position: 'for' | 'against',
  difficulty: 'easy' | 'medium' | 'hard'
) => {
  const difficultyGuide = {
    easy: "Use simpler language and basic arguments. Focus on clear, straightforward points.",
    medium: "Use moderate complexity in language and arguments. Balance between basic and advanced concepts.",
    hard: "Use sophisticated language and complex arguments. Employ advanced debate techniques and deeper analysis."
  };

  return `You are ${aiPersonality.name}, ${aiPersonality.description}. You are debating ${position} the topic "${topic}".

PERSONALITY TRAITS:
- Argument Style: ${aiPersonality.traits.argumentStyle}
- Vocabulary Level: ${aiPersonality.traits.vocabulary}
- Example Types: ${aiPersonality.traits.exampleTypes}
- Debate Strategy: ${aiPersonality.traits.debateStrategy}

BEHAVIORAL GUIDELINES:
${aiPersonality.behaviorGuidelines.map(guideline => `- ${guideline}`).join('\n')}

LANGUAGE STYLE:
- Tone: ${aiPersonality.languageStyle.tone}
- Complexity: ${aiPersonality.languageStyle.complexity}
- Preferred Phrases: Use these frequently: ${aiPersonality.languageStyle.preferredPhrases.join(', ')}
- Phrases to Avoid: Do not use: ${aiPersonality.languageStyle.avoidedPhrases.join(', ')}

DEBATE APPROACH:
- Opening Style: ${aiPersonality.debateApproach.openingStyle}
- Counter-Argument Style: ${aiPersonality.debateApproach.counterArgumentStyle}
- Evidence Preference: ${aiPersonality.debateApproach.evidencePreference}
- Persuasion Techniques: ${aiPersonality.debateApproach.persuasionTechniques.join(', ')}

RESPONSE EXAMPLES (emulate this style):
${aiPersonality.responseExamples.map(example => `- ${example}`).join('\n')}

DEBATE FORMAT:
- Keep responses under 3 sentences for clarity and impact
- Each response must directly address the previous argument
- Maintain a consistent position throughout the debate
- Use evidence and logical reasoning to support claims

DIFFICULTY LEVEL: ${difficulty}
${difficultyGuide[difficulty]}

Your responses should consistently reflect your unique personality traits and debate approach while maintaining focus on the topic and adapting to the specified difficulty level.`;
};

export const startDebate = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against',
  aiPersonality: AIPersonality
): Promise<string> => {
  const aiPosition = userPosition === 'for' ? 'against' : 'for';
  const systemPrompt = generatePersonalityPrompt(aiPersonality, topic, aiPosition, difficulty);

  const messages: ApiMessage[] = [
    { 
      role: 'system', 
      content: systemPrompt
    },
    { 
      role: 'user', 
      content: `The topic is: "${topic}". Start with a clear opening argument ${aiPosition} the topic.`
    }
  ];

  const response = await axios.post(`${API_BASE_URL}/response`, {
    topic,
    position: aiPosition,
    messages,
  });

  return response.data.response;
};

export const continueDebate = async (
  topic: string,
  messages: Message[],
  aiPosition: 'for' | 'against'
): Promise<string> => {
  // Find the original system message to maintain personality
  const originalSystemMessage = messages.find(m => m.role === 'system');
  
  // Map all messages to API format, preserving the correct roles
  const apiMessages = messages.map(msg => {
    const { content, id, score } = msg;
    // Keep system messages as is
    if (msg.role === 'system') return { role: 'system', content, id, score };
    // Map opponent messages to assistant
    if (msg.role === 'opponent') return { role: 'assistant', content, id, score };
    // Map hint messages to assistant
    if (msg.role === 'hint') return { role: 'assistant', content, id, score };
    // Map user messages to user
    return { role: 'user', content, id, score };
  });

  // Default system message if original not found
  const defaultSystemMessage: ApiMessage = {
    role: 'system',
    content: `You are continuing a debate on the topic "${topic}", taking the ${aiPosition} position.

RESPONSE GUIDELINES:
1. Keep responses under 3 sentences
2. Directly address the previous argument
3. Maintain consistent position and logic
4. Use evidence when possible
5. Focus on strongest counterpoints
6. Avoid logical fallacies
7. Build upon previous arguments

EVALUATION CRITERIA:
- Relevance to topic and previous points
- Logical consistency
- Evidence quality
- Argument structure
- Rhetorical effectiveness`
  };

  // Use original system message if found, otherwise use default
  const messagesWithSystem = originalSystemMessage 
    ? apiMessages 
    : [defaultSystemMessage, ...apiMessages];

  const response = await axios.post(`${API_BASE_URL}/response`, {
    topic,
    position: aiPosition,
    messages: messagesWithSystem,
  });

  return response.data.response;
};

export const evaluateArgument = async (
  topic: string,
  position: 'for' | 'against',
  messages: Message[],
  currentScores: { user: number; opponent: number },
  model: string,
  roleToScore: 'user' | 'opponent'
): Promise<number> => {
  // Map messages to API format, ensuring correct role mapping
  const apiMessages = messages.map(msg => {
    const { content, id, score } = msg;
    if (msg.role === 'system') return { role: 'system', content, id, score };
    
    // For opponent scoring, swap roles
    if (roleToScore === 'opponent') {
      return {
        role: msg.role === 'user' ? 'assistant' : 'user',
        content,
        id,
        score
      };
    }
    
    // For user scoring, map normally
    return {
      role: msg.role === 'opponent' ? 'assistant' : 'user',
      content,
      id,
      score
    };
  });

  const response = await axios.post(`${API_BASE_URL}/evaluate`, {
    topic,
    position,
    messages: apiMessages,
    currentScores,
    model,
    roleToScore
  });

  return response.data.score;
};

export const generateHint = async (
  topic: string,
  messages: Message[],
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against'
): Promise<string> => {
  // Map messages to API format
  const apiMessages = mapToApiMessages(messages);

  const response = await axios.post(`${API_BASE_URL}/hint`, {
    topic,
    position: userPosition,
    messages: apiMessages
  });

  return response.data.hint;
};
