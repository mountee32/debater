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
  });
});
