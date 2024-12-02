import { OpenRouterService } from '../../services/openRouterService';
import modelConfig from '../../../../models.config.json';

// Mock axios
jest.mock('axios');

// Mock environment variables
process.env.OPENROUTER_API_KEY = 'test-key';

describe('OpenRouterService', () => {
  const mockMessages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTopic', () => {
    it('should generate a topic successfully', async () => {
      const category = 'technology';
      const model = modelConfig.models.opponent.name;
      const mockResponse = { data: { choices: [{ message: { content: 'AI Ethics' } }] } };
      require('axios').post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateTopic(category, model);
      expect(result).toBe('AI Ethics');
    });
  });

  describe('generateCompletion', () => {
    it('should generate a completion successfully', async () => {
      const mockResponse = { data: { choices: [{ message: { content: 'Hello there!' } }] } };
      require('axios').post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        modelConfig.models.opponent.name,
        'medium'
      );
      expect(result).toBe('Hello there!');
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse = { data: { choices: [{ message: { content: '' } }] } };
      require('axios').post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        modelConfig.models.opponent.name,
        'medium'
      );
      expect(result).toBe('');
    });

    it('should retry on failure', async () => {
      const error = new Error('Network error');
      const mockResponse = { data: { choices: [{ message: { content: 'Success!' } }] } };
      
      require('axios').post
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateCompletion(
        mockMessages,
        modelConfig.models.opponent.name,
        'medium'
      );
      expect(result).toBe('Success!');
    });
  });

  describe('evaluateArgument', () => {
    const mockPosition = 'for';
    const mockTopic = 'AI Ethics';
    const mockCurrentScores = { user: 70, opponent: 65 };

    it('should evaluate an argument successfully', async () => {
      const mockResponse = { data: { choices: [{ message: { content: '85' } }] } };
      require('axios').post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.evaluateArgument(
        mockTopic,
        mockPosition,
        mockMessages,
        mockCurrentScores,
        modelConfig.models.turnScoring.name,
        'user',
        'medium'
      );
      expect(result).toBe(85);
    });

    it('should handle invalid score response', async () => {
      const mockResponse = { data: { choices: [{ message: { content: 'invalid' } }] } };
      require('axios').post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.evaluateArgument(
        mockTopic,
        mockPosition,
        mockMessages,
        mockCurrentScores,
        modelConfig.models.turnScoring.name,
        'user',
        'medium'
      );
      expect(result).toBe(50); // Default score
    });
  });

  describe('generateHint', () => {
    it('should generate a hint successfully', async () => {
      const mockResponse = { data: { choices: [{ message: { content: 'Consider this approach...' } }] } };
      require('axios').post.mockResolvedValueOnce(mockResponse);

      const result = await OpenRouterService.generateHint(
        'AI Ethics',
        'for',
        modelConfig.models.hint.name,
        'medium'
      );
      expect(result).toBe('Consider this approach...');
    });
  });
});
