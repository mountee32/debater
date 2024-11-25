import { useState } from 'react';
import { AIPersonality } from '../data/aiPersonalities';
import { useMessageHandler } from './useMessageHandler';
import { startDebate, continueDebate, generateHint, endDebate } from '../api/openRouterApi';
import { log } from '../utils/logger';

export interface DebateState {
  isLoading: boolean;
  isGeneratingHint: boolean;
  currentScore: number;
  audienceScore: { user: number; opponent: number };
  consecutiveGoodArguments: number;
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
    currentScore: 0,
    audienceScore: { user: 50, opponent: 50 },
    consecutiveGoodArguments: 0,
    isDebateEnded: false,
    isAiThinking: false,
    error: null,
  });

  const updateState = (updates: Partial<DebateState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateAudienceScore = (messageScore: number, isUserMessage: boolean) => {
    setState(prev => {
      const scoreDelta = (messageScore - 5) * 2;
      if (isUserMessage) {
        const userNew = Math.min(Math.max(prev.audienceScore.user + scoreDelta, 0), 100);
        return {
          ...prev,
          audienceScore: {
            user: userNew,
            opponent: 100 - userNew
          }
        };
      } else {
        const opponentNew = Math.min(Math.max(prev.audienceScore.opponent + scoreDelta, 0), 100);
        return {
          ...prev,
          audienceScore: {
            user: 100 - opponentNew,
            opponent: opponentNew
          }
        };
      }
    });
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
      log(`DebateGame: Error ending debate: ${error}`);
      updateState({ error: 'Failed to end debate. Please try again.' });
    }
  };

  const handleSendArgument = async (currentArgument: string) => {
    if (currentArgument.trim() === '' || state.isLoading) return;

    updateState({ isLoading: true, isAiThinking: true, error: null });

    try {
      addMessage('user', currentArgument);

      const { response, evaluation } = await continueDebate(
        topic,
        messages,
        currentArgument,
        difficulty,
        userPosition,
        aiPersonality
      );

      if (response) {
        addMessage('opponent', response);

        const totalScore = evaluation.score;
        updateMessageScore(messages.length + 1, totalScore);
        updateState({ currentScore: state.currentScore + totalScore });
        updateAudienceScore(totalScore, true);

        if (evaluation.score >= 7) {
          updateState({ consecutiveGoodArguments: state.consecutiveGoodArguments + 1 });
        } else {
          updateState({ consecutiveGoodArguments: 0 });
        }

        const aiScore = 5 + (Math.random() * 2 - 1);
        updateAudienceScore(aiScore, false);
      }
    } catch (error) {
      log(`DebateGame: Error in debate continuation: ${error}`);
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
      log(`DebateGame: Error generating hint: ${error}`);
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
      log(`DebateGame: Received initial AI response: ${response}`);
      if (response) {
        addMessage('opponent', response);
      }
    } catch (error) {
      log(`DebateGame: Error initializing debate: ${error}`);
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
