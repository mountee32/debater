import axios from 'axios';
import { OpenRouterService } from '../../services/openRouterService';
import { ApiLogger } from '../../services/apiLogger';
import DiagnosticLogger from '../../utils/diagnosticLogger';

jest.mock('axios');
jest.mock('../../services/apiLogger');
jest.mock('../../utils/diagnosticLogger');

const mockedAxios = jest.mocked(axios);
const mockedApiLogger = jest.mocked(ApiLogger);
const mockedDiagnosticLogger = jest.mocked(DiagnosticLogger);

describe('OpenRouterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCompletion', () => {
    const mockMessages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' }
    ];
    const mockModel = 'gpt-3.5-turbo';

    it('should generate completion successfully', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Hello! How can I help you?' } }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      mockedApiLogger.logRequest.mockResolvedValueOnce('test-request-id');

      const result = await OpenRouterService.generateCompletion(mockMessages, mockModel);

      expect(result).toBe('Hello! How can I help you?');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: mockModel,
          messages: expect.any(Array),
          temperature: 0.7,
          max_tokens: 500
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
      mockedApiLogger.logRequest.mockResolvedValueOnce('test-request-id');

      const result = await OpenRouterService.generateCompletion(mockMessages, mockModel);

      expect(result).toBe('');
      expect(mockedDiagnosticLogger.warn).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      const error = new Error('Network error');
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Success after retry' } }]
        }
      };

      mockedAxios.post
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockResponse);
      mockedApiLogger.logRequest.mockResolvedValue('test-request-id');

      const result = await OpenRouterService.generateCompletion(mockMessages, mockModel);

      expect(result).toBe('Success after retry');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedDiagnosticLogger.error).toHaveBeenCalledWith(
        'Attempt 1 failed for OpenRouter API:',
        error
      );
    });

    it('should throw error after max retries', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValue(error);
      mockedApiLogger.logRequest.mockResolvedValue('test-request-id');

      await expect(OpenRouterService.generateCompletion(mockMessages, mockModel))
        .rejects
        .toThrow('OpenRouter API failed after 3 attempts');

      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      expect(mockedDiagnosticLogger.error).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed API response', async () => {
      const mockResponse = {
        data: {
          choices: null // Malformed response
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      mockedApiLogger.logRequest.mockResolvedValueOnce('test-request-id');

      const result = await OpenRouterService.generateCompletion(mockMessages, mockModel);

      expect(result).toBe('');
      expect(mockedDiagnosticLogger.warn).toHaveBeenCalled();
    });

    it('should filter out empty messages', async () => {
      const messagesWithEmpty = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: '  ' }, // Empty message
        { role: 'user', content: 'Hello' }
      ];

      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }]
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      mockedApiLogger.logRequest.mockResolvedValueOnce('test-request-id');

      await OpenRouterService.generateCompletion(messagesWithEmpty, mockModel);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ content: 'You are a helpful assistant' }),
            expect.objectContaining({ content: 'Hello' })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe('generateTopic', () => {
    it('should generate a topic successfully', async () => {
      const mockTopic = 'Should artificial intelligence be regulated?';
      const category = 'technology';
      const model = 'gpt-3.5-turbo';

      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValueOnce(mockTopic);

      const result = await OpenRouterService.generateTopic(category, model);

      expect(result).toBe(mockTopic);
      expect(OpenRouterService.generateCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining(category)
          })
        ]),
        model
      );
    });
  });

  describe('generateHint', () => {
    const mockTopic = 'Should AI be regulated?';
    const mockPosition = 'for';
    const mockModel = 'gpt-3.5-turbo';

    it('should generate a hint successfully', async () => {
      const mockHint = 'Focus on AI safety concerns and potential risks to society.';
      
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValueOnce(mockHint);

      const result = await OpenRouterService.generateHint(mockTopic, mockPosition, mockModel);

      expect(result).toBe(mockHint);
      expect(OpenRouterService.generateCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining(mockTopic)
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(mockPosition)
          })
        ]),
        mockModel
      );
      expect(mockedDiagnosticLogger.log).toHaveBeenCalledWith(
        'Generating hint:',
        expect.objectContaining({
          topic: mockTopic,
          position: mockPosition,
          model: mockModel
        })
      );
    });

    it('should handle empty hint response', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValueOnce('');

      const result = await OpenRouterService.generateHint(mockTopic, mockPosition, mockModel);

      expect(result).toBe('');
    });

    it('should propagate errors from generateCompletion', async () => {
      const error = new Error('API error');
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockRejectedValueOnce(error);

      await expect(OpenRouterService.generateHint(mockTopic, mockPosition, mockModel))
        .rejects
        .toThrow('API error');
    });
  });

  describe('evaluateArgument', () => {
    const mockParams = {
      topic: 'AI regulation',
      position: 'for' as const,
      messages: [{ role: 'user', content: 'AI needs regulation' }],
      currentScores: { user: 70, opponent: 65 },
      model: 'gpt-3.5-turbo',
      roleToScore: 'user' as const
    };

    it('should evaluate argument and return valid score', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValueOnce('85');

      const result = await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore
      );

      expect(result).toBe(85);
      expect(OpenRouterService.generateCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining(mockParams.topic)
          })
        ]),
        mockParams.model
      );
    });

    it('should handle invalid score response', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValueOnce('invalid');

      const result = await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore
      );

      expect(result).toBe(50);
      expect(mockedDiagnosticLogger.warn).toHaveBeenCalled();
    });

    it('should bound score between 0 and 100', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValueOnce('150');

      const result = await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore
      );

      expect(result).toBe(100);
    });

    it('should throw error when no message to evaluate', async () => {
      await expect(OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        [], // Empty messages array
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore
      )).rejects.toThrow('No message to evaluate');
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch leaderboard successfully', async () => {
      const mockLeaderboard = [
        { name: 'Player1', score: 100 },
        { name: 'Player2', score: 90 }
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: { leaderboard: mockLeaderboard } });

      const result = await OpenRouterService.getLeaderboard();

      expect(result).toEqual(mockLeaderboard);
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/leaderboard'));
    });
  });

  describe('submitScore', () => {
    it('should submit score successfully', async () => {
      const name = 'Player1';
      const score = 100;

      mockedAxios.post.mockResolvedValueOnce({});

      await OpenRouterService.submitScore(name, score);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/submit-score'),
        { name, score }
      );
    });
  });
});
