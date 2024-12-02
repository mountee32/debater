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

    it('should use appropriate model parameters for each difficulty level', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }]
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);
      mockedApiLogger.logRequest.mockResolvedValue('test-request-id');

      // Test easy difficulty
      await OpenRouterService.generateCompletion(mockMessages, mockModel, 'easy');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'mistral/mistral-tiny',
          temperature: 0.3,
          max_tokens: 200
        }),
        expect.any(Object)
      );

      // Test medium difficulty
      await OpenRouterService.generateCompletion(mockMessages, mockModel, 'medium');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'mistral/mistral-medium',
          temperature: 0.5,
          max_tokens: 350
        }),
        expect.any(Object)
      );

      // Test hard difficulty
      await OpenRouterService.generateCompletion(mockMessages, mockModel, 'hard');
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'mistral/mistral-large',
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
  });

  describe('generateTopic', () => {
    it('should generate topics with appropriate difficulty', async () => {
      const category = 'technology';
      const model = 'gpt-3.5-turbo';

      jest.spyOn(OpenRouterService, 'generateCompletion');

      // Test easy difficulty
      await OpenRouterService.generateTopic(category, model, 'easy');
      expect(OpenRouterService.generateCompletion).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Create topics suitable for young audiences')
          })
        ]),
        model,
        'easy'
      );

      // Test hard difficulty
      await OpenRouterService.generateTopic(category, model, 'hard');
      expect(OpenRouterService.generateCompletion).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Create sophisticated topics')
          })
        ]),
        model,
        'hard'
      );
    });
  });

  describe('generateHint', () => {
    const mockTopic = 'Should AI be regulated?';
    const mockPosition = 'for';
    const mockModel = 'gpt-3.5-turbo';

    it('should generate hints with appropriate difficulty', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion');

      // Test easy difficulty
      await OpenRouterService.generateHint(mockTopic, mockPosition, mockModel, 'easy');
      expect(OpenRouterService.generateCompletion).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Provide clear, straightforward hints')
          })
        ]),
        mockModel,
        'easy'
      );

      // Test hard difficulty
      await OpenRouterService.generateHint(mockTopic, mockPosition, mockModel, 'hard');
      expect(OpenRouterService.generateCompletion).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('sophisticated strategic guidance')
          })
        ]),
        mockModel,
        'hard'
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

    it('should apply difficulty-based score multipliers', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion')
        .mockResolvedValue('80');

      // Test easy difficulty (1.5x multiplier)
      const easyScore = await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore,
        'easy'
      );
      expect(easyScore).toBe(Math.min(100, Math.round(80 * 1.5)));

      // Test hard difficulty (0.8x multiplier)
      const hardScore = await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore,
        'hard'
      );
      expect(hardScore).toBe(Math.round(80 * 0.8));
    });

    it('should use difficulty-appropriate evaluation criteria', async () => {
      jest.spyOn(OpenRouterService, 'generateCompletion');

      // Test easy difficulty
      await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore,
        'easy'
      );
      expect(OpenRouterService.generateCompletion).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Be more lenient with scoring')
          })
        ]),
        mockParams.model,
        'easy'
      );

      // Test hard difficulty
      await OpenRouterService.evaluateArgument(
        mockParams.topic,
        mockParams.position,
        mockParams.messages,
        mockParams.currentScores,
        mockParams.model,
        mockParams.roleToScore,
        'hard'
      );
      expect(OpenRouterService.generateCompletion).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining('Apply strict scoring criteria')
          })
        ]),
        mockParams.model,
        'hard'
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
