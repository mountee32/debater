import { useState } from 'react';
import { AIPersonality } from '../data/aiPersonalities';
import { useMessageHandler } from './useMessageHandler';
import { startDebate, continueDebate, generateHint, endDebate, evaluateArgument } from '../api/openRouterApi';
import modelConfig from '../../models.config.json';

export interface DebateState {
  isLoading: boolean;
  isGeneratingHint: boolean;
  audienceScore: { user: number; opponent: number };
  isDebateEnded: boolean;
  isAiThinking: boolean;
  error: string | null;
}

// Import Message type from useMessageHandler
type Message = {
  id: number;
  role: 'user' | 'opponent' | 'hint' | 'system';
  content: string;
  score?: {
    score: number;
    previousScore: number;
  };
};

export const useDebateLogic = (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  userPosition: 'for' | 'against',
  aiPersonality: AIPersonality,
  onEndGame: (result: { overallScore: number; rationale: string; recommendations: string }) => void
) => {
  const { messages, addMessage, updateMessageScore } = useMessageHandler();
  const [state, setState] = useState<DebateState>({
    isLoading: false,
    isGeneratingHint: false,
    audienceScore: { user: 50, opponent: 50 }, // Start at 50/50
    isDebateEnded: false,
    isAiThinking: false,
    error: null,
  });

  // Calculate AI's position based on user's position
  const aiPosition = userPosition === 'for' ? 'against' : 'for';

  const updateState = (updates: Partial<DebateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateScores = (newScore: number, role: 'user' | 'opponent') => {
    // Ensure the score is within bounds
    const boundedScore = Math.min(Math.max(newScore, 0), 100);
    
    setState(prev => ({
      ...prev,
      audienceScore: role === 'user' ? {
        user: boundedScore,
        opponent: 100 - boundedScore
      } : {
        user: 100 - boundedScore,
        opponent: boundedScore
      }
    }));
  };

  const handleEndGame = async () => {
    const userArguments = messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content);
    
    try {
      const result = await endDebate(topic, userArguments, userPosition);
      updateState({ isDebateEnded: true });
      onEndGame(result);
    } catch (error) {
      updateState({ error: 'Failed to end debate. Please try again.' });
    }
  };

  const handleSendArgument = async (currentArgument: string) => {
    if (currentArgument.trim() === '' || state.isLoading) return;

    updateState({ isLoading: true, isAiThinking: true, error: null });

    try {
      // Add and evaluate player's message
      const currentUserScore = state.audienceScore.user;
      const userMessageId = messages.length + 1; // Assign unique ID for the user's message
      addMessage('user', currentArgument);

      // Create message object for API
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: currentArgument
      };

      const playerScore = await evaluateArgument(
        topic,
        userPosition,
        [...messages, userMessage],
        state.audienceScore,
        modelConfig.models.turnScoring.name,
        'user'
      );

      updateMessageScore(userMessageId, {
        score: playerScore,
        previousScore: currentUserScore
      });
      updateScores(playerScore, 'user');

      // Ensure system message is included for AI context
      const systemMessage = {
        id: 0,
        role: 'system',
        content: `You are ${aiPersonality.name}, debating ${aiPosition} the topic. Keep responses under 3 sentences.`
      };

      // Get AI's response with system context
      const aiResponse = await continueDebate(
        topic, 
        [systemMessage, ...messages, userMessage],
        aiPosition
      );
      
      const aiMessageId = userMessageId + 1; // Assign unique ID for the AI's message
      addMessage('opponent', aiResponse);

      // Get current AI score after player's score has been updated
      const currentAiScore = state.audienceScore.opponent;

      // Create message object for API
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'opponent',
        content: aiResponse
      };

      // Evaluate AI's response
      const aiScore = await evaluateArgument(
        topic,
        aiPosition,
        [...messages, aiMessage],
        state.audienceScore,
        modelConfig.models.turnScoring.name,
        'opponent'
      );

      updateMessageScore(aiMessageId, {
        score: aiScore,
        previousScore: currentAiScore
      });
      updateScores(aiScore, 'opponent');

    } catch (error) {
      updateState({ error: 'Failed to get AI response. Please try again.' });
    } finally {
      updateState({ isLoading: false, isAiThinking: false });
    }
  };

  const handleHintRequest = async () => {
    if (state.isGeneratingHint) return;

    updateState({ isGeneratingHint: true, isAiThinking: true, error: null });

    try {
      const hint = await generateHint(topic, messages, difficulty, userPosition);
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
      // Get AI's initial response
      const aiResponse = await startDebate(topic, difficulty, userPosition, aiPersonality);
      const currentAiScore = state.audienceScore.opponent;
      const aiMessageId = messages.length + 1; // Assign unique ID for the AI's message
      addMessage('opponent', aiResponse);

      // Create message object for API
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'opponent',
        content: aiResponse
      };

      // Evaluate AI's initial message
      const aiScore = await evaluateArgument(
        topic,
        aiPosition,
        [...messages, aiMessage],
        state.audienceScore,
        modelConfig.models.turnScoring.name,
        'opponent'
      );

      updateMessageScore(aiMessageId, {
        score: aiScore,
        previousScore: currentAiScore
      });
      updateScores(aiScore, 'opponent');

    } catch (error) {
      updateState({ error: 'Failed to start debate. Please try again.' });
    } finally {
      updateState({ isLoading: false, isAiThinking: false });
    }
  };

  return {
    state,
    messages,
    handleEndGame,
    handleSendArgument,
    handleHintRequest,
    initializeDebate,
  };
};
