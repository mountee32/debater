import { renderHook, act } from '@testing-library/react';
import { useDebateLogic } from './useDebateLogic';
import { startDebate, continueDebate, generateHint, endDebate } from '../api/openRouterApi';

// Mock the API functions
jest.mock('../api/openRouterApi', () => ({
  startDebate: jest.fn(),
  continueDebate: jest.fn(),
  generateHint: jest.fn(),
  endDebate: jest.fn(),
}));

const mockAiPersonality = {
  id: 'test-ai',
  name: 'Test AI',
  description: 'Test AI Description',
  avatarUrl: '/test-avatar.png',
  traits: {
    argumentStyle: 'logical',
    vocabulary: 'formal',
    exampleTypes: 'statistical',
    debateStrategy: 'analytical'
  }
};

describe('useDebateLogic', () => {
  const defaultProps = {
    topic: 'Test Topic',
    difficulty: 'medium' as const,
    userPosition: 'for' as const,
    aiPersonality: mockAiPersonality,
    onEndGame: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    expect(result.current.state).toEqual({
      isLoading: false,
      isGeneratingHint: false,
      currentScore: 0,
      audienceScore: { user: 50, opponent: 50 },
      consecutiveGoodArguments: 0,
      isDebateEnded: false,
      isAiThinking: false,
      error: null,
    });
    expect(result.current.messages).toEqual([]);
  });

  it('handles debate initialization', async () => {
    const mockResponse = 'Initial AI response';
    (startDebate as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    await act(async () => {
      await result.current.initializeDebate();
    });

    expect(startDebate).toHaveBeenCalledWith(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality
    );
    expect(result.current.messages[0]).toEqual({
      id: 1,
      role: 'opponent',
      content: mockResponse,
    });
  });

  it('handles sending arguments', async () => {
    const mockResponse = {
      response: 'AI response',
      evaluation: { score: 8 },
    };
    (continueDebate as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    await act(async () => {
      await result.current.handleSendArgument('User argument');
    });

    expect(continueDebate).toHaveBeenCalledWith(
      defaultProps.topic,
      [],
      'User argument',
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality
    );

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({
      id: 1,
      role: 'user',
      content: 'User argument',
      score: mockResponse.evaluation.score,
    });
    expect(result.current.messages[1]).toEqual({
      id: 2,
      role: 'opponent',
      content: mockResponse.response,
    });
  });

  it('handles hint requests', async () => {
    const mockHint = 'Test hint';
    (generateHint as jest.Mock).mockResolvedValueOnce(mockHint);

    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    await act(async () => {
      const hint = await result.current.handleHintRequest();
      expect(hint).toBe(mockHint);
    });

    expect(generateHint).toHaveBeenCalledWith(
      defaultProps.topic,
      [],
      defaultProps.difficulty,
      defaultProps.userPosition
    );
  });

  it('handles ending the debate', async () => {
    const mockResult = {
      overallScore: 85,
      rationale: 'Good performance',
      recommendations: 'Keep it up',
    };
    (endDebate as jest.Mock).mockResolvedValueOnce(mockResult);

    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    await act(async () => {
      await result.current.handleEndGame();
    });

    expect(endDebate).toHaveBeenCalled();
    expect(defaultProps.onEndGame).toHaveBeenCalledWith(mockResult);
    expect(result.current.state.isDebateEnded).toBe(true);
  });

  it('handles errors gracefully', async () => {
    const error = new Error('API Error');
    (startDebate as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    await act(async () => {
      await result.current.initializeDebate();
    });

    expect(result.current.state.error).toBe('Failed to start debate. Please try again.');
  });

  it('updates audience score based on message scores', async () => {
    const mockResponse = {
      response: 'AI response',
      evaluation: { score: 8 },
    };
    (continueDebate as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDebateLogic(
      defaultProps.topic,
      defaultProps.difficulty,
      defaultProps.userPosition,
      defaultProps.aiPersonality,
      defaultProps.onEndGame
    ));

    await act(async () => {
      await result.current.handleSendArgument('User argument');
    });

    // Score of 8 should increase user's score and decrease opponent's
    expect(result.current.state.audienceScore.user).toBeGreaterThan(50);
    expect(result.current.state.audienceScore.opponent).toBeLessThan(50);
  });
});
