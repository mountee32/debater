import axios from 'axios';
import { generateTopic, startDebate, continueDebate, generateHint, endDebate, getLeaderboard, submitScore } from './openRouterApi';
import { AIPersonality } from '../data/aiPersonalities';

// Mock dependencies
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('openRouterApi', () => {
  const mockAIPersonality: AIPersonality = {
    id: 'test_ai',
    name: 'Test AI',
    description: 'Test Description',
    traits: {
      argumentStyle: 'logical',
      vocabulary: 'formal',
      exampleTypes: 'statistical',
      debateStrategy: 'analytical'
    },
    avatarUrl: '/assets/test.svg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTopic', () => {
    it('should generate a topic successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Test Topic' } }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await generateTopic('Technology');
      expect(result).toBe('Test Topic');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should throw error on invalid response format', async () => {
      mockedAxios.post.mockResolvedValueOnce({});
      await expect(generateTopic('Technology')).rejects.toThrow('Invalid response format');
    });
  });

  describe('startDebate', () => {
    it('should start debate successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Opening argument' } }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await startDebate('Test Topic', 'easy', 'for', mockAIPersonality);
      expect(result).toBe('Opening argument');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should throw error on invalid response format', async () => {
      mockedAxios.post.mockResolvedValueOnce({});
      await expect(startDebate('Test Topic', 'easy', 'for', mockAIPersonality)).rejects.toThrow('Invalid response format');
    });
  });

  describe('continueDebate', () => {
    const mockMessages = [{ role: 'user', content: 'argument' }];

    it('should continue debate and evaluate successfully', async () => {
      const mockResponseData = {
        data: {
          choices: [{ message: { content: 'AI Response' } }]
        }
      };
      const mockEvaluationData = {
        data: {
          choices: [{ message: { content: '8,7,6,7,8,Good argument' } }]
        }
      };

      mockedAxios.post
        .mockResolvedValueOnce(mockResponseData)
        .mockResolvedValueOnce(mockEvaluationData);

      const result = await continueDebate(
        'Test Topic',
        mockMessages,
        'User Argument',
        'easy',
        'for',
        mockAIPersonality
      );

      expect(result.response).toBe('AI Response');
      expect(result.evaluation.score).toBe(8);
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should handle evaluation with different format', async () => {
      const mockResponseData = {
        data: {
          choices: [{ message: { content: 'AI Response' } }]
        }
      };
      const mockEvaluationData = {
        data: {
          choices: [{ message: { content: 'Score: 8 Consistency: 7 Facts: 6 Style: 7 Audience: 8 Feedback: Good' } }]
        }
      };

      mockedAxios.post
        .mockResolvedValueOnce(mockResponseData)
        .mockResolvedValueOnce(mockEvaluationData);

      const result = await continueDebate(
        'Test Topic',
        mockMessages,
        'User Argument',
        'easy',
        'for',
        mockAIPersonality
      );

      expect(result.evaluation.score).toBeGreaterThan(0);
      expect(result.evaluation.feedback).toBeTruthy();
    });
  });

  describe('generateHint', () => {
    it('should generate hint successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Hint text' } }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await generateHint('Test Topic', [], 'easy', 'for');
      expect(result).toBe('Hint text');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('endDebate', () => {
    it('should end debate with evaluation', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: '9,Great performance,Keep practicing' } }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await endDebate('Test Topic', ['Argument 1', 'Argument 2'], 'for');
      expect(result.overallScore).toBe(9);
      expect(result.rationale).toBe('Great performance');
      expect(result.recommendations).toBe('Keep practicing');
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch and filter leaderboard data', async () => {
      const mockLeaderboardData = [
        { id: 1, username: 'user1', score: 100, difficulty: 'easy', category: 'tech', subject: 'AI' },
        { id: 2, username: 'user2', score: 90, difficulty: 'hard', category: 'science', subject: 'Physics' }
      ];
      mockedAxios.get.mockResolvedValueOnce({ data: mockLeaderboardData });

      const result = await getLeaderboard('easy', 'tech');
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('user1');
    });
  });

  describe('submitScore', () => {
    it('should submit score successfully', async () => {
      await submitScore('testUser', 100, 'easy', 'tech', 'AI');
      // Verify the score was added to leaderboard data
      const result = await getLeaderboard('easy', 'tech');
      expect(result.some(entry => entry.username === 'testUser')).toBe(true);
    });
  });
});
