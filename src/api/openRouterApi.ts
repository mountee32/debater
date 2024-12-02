import axios from 'axios';
import { AIPersonality } from '../data/aiPersonalities';
import modelConfig from '../../models.config.json';

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

type Difficulty = 'easy' | 'medium' | 'hard';

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
  difficulty: Difficulty
) => {
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
${aiPersonality.behaviorGuidelines.map(guideline => `- ${guideline}`).join('\n')}

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
- Keep responses ${difficultyMods.responseLength}
- Maintain ${difficultyMods.argumentComplexity}
- Use ${difficultyMods.vocabularyLevel}
- Focus on ${difficultyMods.exampleTypes.join(' and ')}

Your responses should reflect your personality while adapting to the ${difficulty} difficulty level.`;
};

export const startDebate = async (
  topic: string,
  difficulty: Difficulty,
  userPosition: 'for' | 'against',
  aiPersonality: AIPersonality
): Promise<string> => {
  const aiPosition = userPosition === 'for' ? 'against' : 'for';
  const systemPrompt = generatePersonalityPrompt(aiPersonality, topic, aiPosition, difficulty);

  // First, start a new conversation
  const startResponse = await axios.post(`${API_BASE_URL}/start-conversation`, {
    topic,
    difficulty: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 5 : 10,
    participants: [
      {
        id: 'user',
        name: 'User',
        avatar: 'user.svg',
        role: 'debater'
      },
      {
        id: 'opponent',
        name: aiPersonality.name,
        avatar: aiPersonality.avatarUrl,
        role: 'debater'
      }
    ],
    subjectId: 'REL002', // This should be dynamic based on the topic category
    position: userPosition,
    skill: difficulty
  });

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

  // Then, get the initial response
  const response = await axios.post(`${API_BASE_URL}/response`, {
    topic,
    position: aiPosition,
    messages,
    model: modelConfig.models.opponent.name,
    difficulty
  });

  // Record the AI's response
  await axios.post(`${API_BASE_URL}/record-message`, {
    participantId: 'opponent',
    message: response.data.response
  });

  return response.data.response;
};

export const continueDebate = async (
  topic: string,
  messages: Message[],
  aiPosition: 'for' | 'against',
  difficulty: Difficulty
): Promise<string> => {
  // Find the original system message to maintain personality
  const originalSystemMessage = messages.find(m => m.role === 'system');
  
  // Map all messages to API format, preserving the correct roles
  const apiMessages = mapToApiMessages(messages);

  // Default system message if original not found
  const defaultSystemMessage: ApiMessage = {
    role: 'system',
    content: `You are continuing a debate on the topic "${topic}", taking the ${aiPosition} position.

DIFFICULTY LEVEL: ${difficulty}

RESPONSE GUIDELINES:
1. Keep responses appropriate for ${difficulty} difficulty
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
    model: modelConfig.models.opponent.name,
    difficulty
  });

  // Record the AI's response
  await axios.post(`${API_BASE_URL}/record-message`, {
    participantId: 'opponent',
    message: response.data.response
  });

  return response.data.response;
};

export const evaluateArgument = async (
  topic: string,
  position: 'for' | 'against',
  messages: Message[],
  currentScores: { user: number; opponent: number },
  model: string,
  roleToScore: 'user' | 'opponent',
  difficulty: Difficulty
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
    roleToScore,
    difficulty
  });

  // Record the score
  await axios.post(`${API_BASE_URL}/record-score`, {
    participantId: roleToScore,
    score: response.data.score
  });

  return response.data.score;
};

export const generateHint = async (
  topic: string,
  messages: Message[],
  difficulty: Difficulty,
  userPosition: 'for' | 'against'
): Promise<string> => {
  // Map messages to API format
  const apiMessages = mapToApiMessages(messages);

  const response = await axios.post(`${API_BASE_URL}/hint`, {
    topic,
    position: userPosition,
    messages: apiMessages,
    model: modelConfig.models.hint.name,
    difficulty
  });

  // Record the hint as a system message
  await axios.post(`${API_BASE_URL}/record-message`, {
    participantId: 'system',
    message: response.data.hint
  });

  return response.data.hint;
};
