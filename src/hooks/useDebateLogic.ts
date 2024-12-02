import { useState } from 'react';
import { AIPersonality } from '../data/aiPersonalities';
import { useMessageHandler } from './useMessageHandler';
import { startDebate, continueDebate, generateHint, evaluateArgument } from '../api/openRouterApi';
import modelConfig from '../../models.config.json';
import { DebateState, Message, GameSummary, DebateHookResult, GameSetup } from '../types/debate';

export const useDebateLogic = (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against',
  aiPersonality: AIPersonality,
  subjectId: string
): DebateHookResult => {
  const { messages, addMessage, updateMessageScore } = useMessageHandler();
  const [state, setState] = useState<DebateState>({
    isLoading: false,
    isGeneratingHint: false,
    audienceScore: { user: 50, opponent: 50 },
    isAiThinking: false,
    error: null,
    summary: null,
    isGeneratingSummary: false,
    conversationId: null
  });

  // Calculate AI's position based on user's position
  const aiPosition = userPosition === 'for' ? 'against' : 'for';

  // Create game setup object for live mode
  const gameSetup: GameSetup = {
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
    subjectId,
    position: userPosition,
    skill: difficulty
  };

  const updateState = (updates: Partial<DebateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateScores = async (newScore: number, role: 'user' | 'opponent') => {
    const boundedScore = Math.min(Math.max(newScore, 0), 100);
    
    const newScores = role === 'user' ? {
      user: boundedScore,
      opponent: 100 - boundedScore
    } : {
      user: 100 - boundedScore,
      opponent: boundedScore
    };

    setState(prev => ({
      ...prev,
      audienceScore: newScores
    }));

    if (state.conversationId) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/record-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: state.conversationId,
            participantId: role,
            score: boundedScore
          })
        });
      } catch (error) {
        console.error('Failed to record score:', error);
      }
    }
  };

  const generateDebateSummary = async (): Promise<void> => {
    if (state.isGeneratingSummary) return;

    updateState({ isGeneratingSummary: true, error: null });

    try {
      const mockSummary: GameSummary = {
        score: state.audienceScore.user,
        feedback: "You demonstrated strong logical reasoning and effectively supported your arguments with evidence. Your responses were clear and well-structured, though there's room for improvement in addressing counterarguments.",
        improvements: [
          "Focus more on directly addressing opponent's key points",
          "Include more specific examples to support your arguments",
          "Consider incorporating more diverse types of evidence"
        ]
      };

      if (state.conversationId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/end-conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: state.conversationId
            })
          });
          
          const result = await response.json();
          if (result.isHighScore) {
            mockSummary.isHighScore = true;
          }
        } catch (error) {
          console.error('Failed to end conversation:', error);
        }
      }

      updateState({ summary: mockSummary });
    } catch (error) {
      updateState({ error: 'Failed to generate debate summary. Please try again.' });
    } finally {
      updateState({ isGeneratingSummary: false });
    }
  };

  const convertToApiMessages = (messages: Message[]) => {
    return messages.map(msg => {
      const { id, content, score } = msg;
      if (msg.role === 'system') return { role: 'system', content, id, score };
      if (msg.role === 'opponent' || msg.role === 'hint') return { role: 'assistant', content, id, score };
      return { role: 'user', content, id, score };
    });
  };

  const handleSendArgument = async (currentArgument: string) => {
    if (currentArgument.trim() === '' || state.isLoading) return;

    updateState({ isLoading: true, isAiThinking: true, error: null });

    try {
      const currentUserScore = state.audienceScore.user;
      const userMessageId = messages.length + 1;
      addMessage('user', currentArgument);

      if (state.conversationId) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/record-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: state.conversationId,
              participantId: 'user',
              message: currentArgument
            })
          });
        } catch (error) {
          console.error('Failed to record message:', error);
        }
      }

      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: currentArgument
      };

      const allMessages = [...messages, userMessage];
      const apiMessages = convertToApiMessages(allMessages);

      const playerScore = await evaluateArgument(
        topic,
        userPosition,
        allMessages,
        state.audienceScore,
        modelConfig.models.turnScoring.name,
        'user',
        difficulty
      );

      updateMessageScore(userMessageId, {
        score: playerScore,
        previousScore: currentUserScore
      });
      await updateScores(playerScore, 'user');

      const difficultyGuide = {
        easy: "Use simpler language and basic arguments. Focus on clear, straightforward points.",
        medium: "Use moderate complexity in language and arguments. Balance between basic and advanced concepts.",
        hard: "Use sophisticated language and complex arguments. Employ advanced debate techniques and deeper analysis."
      };

      const systemMessage: Message = {
        id: 0,
        role: 'system',
        content: `You are ${aiPersonality.name}, a debater ${aiPosition} the topic "${topic}".

DEBATE FORMAT:
- Keep responses under 3 sentences for clarity and impact
- Each response must directly address the previous argument
- Maintain a consistent position throughout the debate
- Use evidence and logical reasoning to support claims

ARGUMENT STRUCTURE:
- Start with a clear position statement
- Support with relevant evidence or reasoning
- Address counterarguments when applicable

DIFFICULTY LEVEL: ${difficulty}
${difficultyGuide[difficulty]}

DEBATE PRINCIPLES:
1. Stay focused on the core topic
2. Build upon previous arguments
3. Use appropriate evidence and examples
4. Maintain logical consistency
5. Avoid logical fallacies
6. Consider ethical implications`
      };

      const aiResponse = await continueDebate(
        topic, 
        [systemMessage, ...allMessages],
        aiPosition,
        difficulty
      );
      
      const aiMessageId = userMessageId + 1;
      addMessage('opponent', aiResponse);

      if (state.conversationId) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/record-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: state.conversationId,
              participantId: 'opponent',
              message: aiResponse
            })
          });
        } catch (error) {
          console.error('Failed to record message:', error);
        }
      }

      const currentAiScore = state.audienceScore.opponent;

      const aiMessage: Message = {
        id: aiMessageId,
        role: 'opponent',
        content: aiResponse
      };

      const updatedMessages = [...allMessages, aiMessage];

      const aiScore = await evaluateArgument(
        topic,
        aiPosition,
        updatedMessages,
        state.audienceScore,
        modelConfig.models.turnScoring.name,
        'opponent',
        difficulty
      );

      updateMessageScore(aiMessageId, {
        score: aiScore,
        previousScore: currentAiScore
      });
      await updateScores(aiScore, 'opponent');

    } catch (error) {
      updateState({ error: 'Failed to get AI response. Please try again.' });
    } finally {
      updateState({ isLoading: false, isAiThinking: false });
    }
  };

  const handleHintRequest = async (): Promise<string | null> => {
    if (state.isGeneratingHint) return null;

    updateState({ isGeneratingHint: true, isAiThinking: true, error: null });

    try {
      const hint = await generateHint(topic, messages, difficulty, userPosition);
      
      if (state.conversationId && hint) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/record-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: state.conversationId,
              participantId: 'system',
              message: hint
            })
          });
        } catch (error) {
          console.error('Failed to record hint:', error);
        }
      }
      
      return hint;
    } catch (error) {
      updateState({ error: 'Failed to generate hint. Please try again.' });
      return null;
    } finally {
      updateState({ isGeneratingHint: false, isAiThinking: false });
    }
  };

  const initializeDebate = async () => {
    updateState({ isLoading: true, isAiThinking: true, error: null });

    try {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/start-conversation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
            subjectId,
            position: userPosition,
            skill: difficulty
          })
        });
        
        const data = await response.json();
        updateState({ conversationId: data.conversationId });
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }

      const aiResponse = await startDebate(topic, difficulty, userPosition, aiPersonality);
      const currentAiScore = state.audienceScore.opponent;
      const aiMessageId = messages.length + 1;
      addMessage('opponent', aiResponse);

      if (state.conversationId) {
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/debate/record-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId: state.conversationId,
              participantId: 'opponent',
              message: aiResponse
            })
          });
        } catch (error) {
          console.error('Failed to record message:', error);
        }
      }

      const aiMessage: Message = {
        id: aiMessageId,
        role: 'opponent',
        content: aiResponse
      };

      const aiScore = await evaluateArgument(
        topic,
        aiPosition,
        [aiMessage],
        state.audienceScore,
        modelConfig.models.turnScoring.name,
        'opponent',
        difficulty
      );

      updateMessageScore(aiMessageId, {
        score: aiScore,
        previousScore: currentAiScore
      });
      await updateScores(aiScore, 'opponent');

    } catch (error) {
      updateState({ error: 'Failed to start debate. Please try again.' });
    } finally {
      updateState({ isLoading: false, isAiThinking: false });
    }
  };

  return {
    state,
    messages,
    handleSendArgument,
    handleHintRequest,
    initializeDebate,
    generateDebateSummary,
    gameSetup
  };
};
