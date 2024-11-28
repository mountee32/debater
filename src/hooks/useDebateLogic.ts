import { useState } from 'react';
import { AIPersonality } from '../data/aiPersonalities';
import { useMessageHandler } from './useMessageHandler';
import { startDebate, continueDebate, generateHint, endDebate } from '../api/openRouterApi';

export interface DebateState {
  isLoading: boolean;
  isGeneratingHint: boolean;
  audienceScore: { user: number; opponent: number };
  isDebateEnded: boolean;
  isAiThinking: boolean;
  error: string | null;
}

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

  const updateState = (updates: Partial<DebateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateScores = (newUserScore: number) => {
    // Ensure the score is within bounds
    const boundedScore = Math.min(Math.max(newUserScore, 0), 100);
    
    setState(prev => ({
      ...prev,
      audienceScore: {
        user: boundedScore,
        opponent: 100 - boundedScore // AI score is always complementary
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
      // Store current score before update
      const currentScore = state.audienceScore.user;
      
      addMessage('user', currentArgument);

      const { response, newScore } = await continueDebate(
        topic,
        messages,
        currentArgument,
        difficulty,
        userPosition,
        aiPersonality,
        state.audienceScore
      );

      if (response) {
        addMessage('opponent', response);
        
        // Pass both new score and previous score
        updateMessageScore(messages.length + 1, {
          score: newScore,
          previousScore: currentScore
        });
        
        // Update the overall scores
        updateScores(newScore);
      }
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
      const response = await startDebate(topic, difficulty, userPosition, aiPersonality);
      if (response) {
        addMessage('opponent', response);
      }
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
