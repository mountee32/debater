import axios from 'axios';
import { OpenRouterService } from '../../services/openRouterService';
import { ApiLogger } from '../../services/apiLogger';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock ApiLogger
jest.mock('../../services/apiLogger', () => ({
  ApiLogger: {
    logRequest: jest.fn().mockResolvedValue('test-request-id'),
    logResponse: jest.fn()
  }
}));

// Mock DiagnosticLogger
jest.mock('../../utils/diagnosticLogger', () => ({
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('OpenRouterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('generateCompletion', () => {
    const mockMessages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ];

    it('should generate completion successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Hello! How can I help you?' } }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        'test-model',
        'medium'
      );

      expect(result).toBe('Hello! How can I help you?');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: mockMessages,
          temperature: 0.5,
          max_tokens: 350
        }),
        expect.any(Object)
      );
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: '' } }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        'test-model'
      );

      expect(result).toBe('');
    });

    it('should handle missing response content', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: {} }]
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        'test-model'
      );

      expect(result).toBe('');
    });

    it('should retry on API error', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Success after retry' } }]
        }
      };

      mockedAxios.post
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        'test-model'
      );

      expect(result).toBe('Success after retry');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      };

      mockedAxios.post
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      await expect(OpenRouterService.generateCompletion(
        mockMessages,
        'test-model'
      )).rejects.toThrow('OpenRouter API failed with status 500');

      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(OpenRouterService.generateCompletion(
        mockMessages,
        'test-model'
      )).rejects.toThrow('Network error');
    });

    it('should apply difficulty configurations', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Test easy difficulty
      await OpenRouterService.generateCompletion(mockMessages, 'test-model', 'easy');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 200
        }),
        expect.any(Object)
      );

      // Test hard difficulty
      await OpenRouterService.generateCompletion(mockMessages, 'test-model', 'hard');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.7,
          max_tokens: 500
        }),
        expect.any(Object)
      );
    });

    it('should clean messages before sending', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const messagesWithEmpty = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: '' }, // Empty content
        { role: 'assistant', content: 'Response' }
      ];

      await OpenRouterService.generateCompletion(messagesWithEmpty, 'test-model');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'System message' },
            { role: 'assistant', content: 'Response' }
          ]
        }),
        expect.any(Object)
      );
    });
  });

  describe('evaluateArgument', () => {
    const mockMessages = [
      { role: 'user', content: 'Test argument' }
    ];

    it('should evaluate argument successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: '85' } }]
        }
      });

      const score = await OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        mockMessages,
        { user: 75, opponent: 70 },
        'test-model',
        'user'
      );

      expect(score).toBe(85);
    });

    it('should handle invalid score format', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'invalid score' } }]
        }
      });

      const score = await OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        mockMessages,
        { user: 75, opponent: 70 },
        'test-model',
        'user'
      );

      expect(score).toBe(50); // Default score
    });

    it('should apply difficulty multipliers to scores', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: '100' } }]
        }
      });

      // Easy difficulty (1.5x multiplier)
      const easyScore = await OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        mockMessages,
        { user: 75, opponent: 70 },
        'test-model',
        'user',
        'easy'
      );

      // Hard difficulty (0.8x multiplier)
      const hardScore = await OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        mockMessages,
        { user: 75, opponent: 70 },
        'test-model',
        'user',
        'hard'
      );

      expect(easyScore).toBe(100); // Capped at 100
      expect(hardScore).toBe(80); // 100 * 0.8
    });

    it('should throw error for empty messages', async () => {
      await expect(OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        [],
        { user: 75, opponent: 70 },
        'test-model',
        'user'
      )).rejects.toThrow('No message to evaluate');
    });

    it('should bound scores between 0 and 100', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: '150' } }] // Over 100
          }
        })
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: '-50' } }] // Under 0
          }
        });

      const highScore = await OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        mockMessages,
        { user: 75, opponent: 70 },
        'test-model',
        'user'
      );

      const lowScore = await OpenRouterService.evaluateArgument(
        'Test topic',
        'for',
        mockMessages,
        { user: 75, opponent: 70 },
        'test-model',
        'user'
      );

      expect(highScore).toBe(100);
      expect(lowScore).toBe(0);
    });
  });

  describe('generateTopic', () => {
    it('should generate topic successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Social media is harmful to society' } }]
        }
      });

      const topic = await OpenRouterService.generateTopic(
        'technology',
        'test-model'
      );

      expect(topic).toBe('Social media is harmful to society');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('technology')
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it('should adapt to different difficulty levels', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Topic' } }]
        }
      });

      await OpenRouterService.generateTopic('technology', 'test-model', 'easy');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 200
        }),
        expect.any(Object)
      );

      await OpenRouterService.generateTopic('technology', 'test-model', 'hard');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.7,
          max_tokens: 500
        }),
        expect.any(Object)
      );
    });
  });

  describe('generateHint', () => {
    it('should generate hint successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Focus on environmental impact' } }]
        }
      });

      const hint = await OpenRouterService.generateHint(
        'Climate change',
        'for',
        'test-model'
      );

      expect(hint).toBe('Focus on environmental impact');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Climate change')
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it('should adapt hint complexity to difficulty level', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Hint' } }]
        }
      });

      await OpenRouterService.generateHint('Climate change', 'for', 'test-model', 'easy');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 200
        }),
        expect.any(Object)
      );

      await OpenRouterService.generateHint('Climate change', 'for', 'test-model', 'hard');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.7,
          max_tokens: 500
        }),
        expect.any(Object)
      );
    });
  });
});
