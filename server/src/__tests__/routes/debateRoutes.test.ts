import request from 'supertest';
import express from 'express';
import debateRoutes from '../../routes/debateRoutes';
import { OpenRouterService } from '../../services/openRouterService';
import { ConversationRecorder } from '../../services/conversationRecorder';
import { ApiLogger } from '../../services/apiLogger';
import modelConfig from '../../../../models.config.json';

// Mock the services
jest.mock('../../services/openRouterService');
jest.mock('../../services/conversationRecorder');
jest.mock('../../services/apiLogger');
jest.mock('../../utils/diagnosticLogger');

// Mock express-rate-limit
jest.mock('express-rate-limit', () => ({
  rateLimit: () => (req: any, res: any, next: any) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/debate', debateRoutes);

describe('Debate Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock ApiLogger methods
    (ApiLogger.startNewSession as jest.Mock).mockReturnValue('test-session');
    (ApiLogger.logRequest as jest.Mock).mockResolvedValue('test-request');
    (ApiLogger.logResponse as jest.Mock).mockResolvedValue(undefined);
    // Mock ConversationRecorder methods
    (ConversationRecorder.startNewConversation as jest.Mock).mockResolvedValue('test-conv-id');
    (ConversationRecorder.recordMessage as jest.Mock).mockResolvedValue(undefined);
    (ConversationRecorder.recordScore as jest.Mock).mockResolvedValue(undefined);
    (ConversationRecorder.endConversation as jest.Mock).mockResolvedValue({
      conversationId: 'test-conv',
      isHighScore: true
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .post('/api/debate/topic')
        .send({ category: 'technology', model: 'test-model' });

      expect(response.status).not.toBe(429);
    });
  });

  describe('POST /api/debate/start-conversation', () => {
    const mockRequest = {
      topic: 'AI Ethics',
      difficulty: 1,
      participants: [
        {
          id: 'user',
          name: 'User',
          avatar: 'user.svg',
          role: 'debater'
        },
        {
          id: 'opponent',
          name: 'AI',
          avatar: 'ai.svg',
          role: 'debater'
        }
      ],
      subjectId: 'SCI001',
      position: 'for',
      skill: 'easy'
    };

    it('should start a conversation successfully', async () => {
      const response = await request(app)
        .post('/api/debate/start-conversation')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ conversationId: 'test-conv-id' });
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/debate/start-conversation')
        .send({
          topic: 'AI Ethics',
          difficulty: 1,
          participants: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle service errors with 500', async () => {
      (ConversationRecorder.startNewConversation as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/debate/start-conversation')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to start conversation',
        details: 'Service error'
      });
    });
  });

  describe('POST /api/debate/record-message', () => {
    it('should record message successfully', async () => {
      const mockRequest = {
        conversationId: 'test-conv',
        participantId: 'user1',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/debate/record-message')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should handle missing fields', async () => {
      const response = await request(app)
        .post('/api/debate/record-message')
        .send({ conversationId: 'test-conv' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle service errors', async () => {
      const mockRequest = {
        conversationId: 'test-conv',
        participantId: 'user1',
        message: 'Test message'
      };

      (ConversationRecorder.recordMessage as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/debate/record-message')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to record message',
        details: 'Service error'
      });
    });
  });

  describe('POST /api/debate/record-score', () => {
    it('should record score successfully', async () => {
      const mockRequest = {
        conversationId: 'test-conv',
        participantId: 'user1',
        score: 85
      };

      const response = await request(app)
        .post('/api/debate/record-score')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('should handle missing score', async () => {
      const response = await request(app)
        .post('/api/debate/record-score')
        .send({ conversationId: 'test-conv', participantId: 'user1' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle service errors', async () => {
      const mockRequest = {
        conversationId: 'test-conv',
        participantId: 'user1',
        score: 85
      };

      (ConversationRecorder.recordScore as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/debate/record-score')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to record score',
        details: 'Service error'
      });
    });
  });

  describe('POST /api/debate/end-conversation', () => {
    it('should end conversation successfully', async () => {
      const response = await request(app)
        .post('/api/debate/end-conversation')
        .send({ conversationId: 'test-conv' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        conversationId: 'test-conv',
        isHighScore: true
      });
    });

    it('should handle missing conversationId', async () => {
      const response = await request(app)
        .post('/api/debate/end-conversation')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing conversationId' });
    });

    it('should handle service errors', async () => {
      (ConversationRecorder.endConversation as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/debate/end-conversation')
        .send({ conversationId: 'test-conv' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to end conversation',
        details: 'Service error'
      });
    });
  });

  describe('POST /api/debate/test-log', () => {
    it('should test logging successfully', async () => {
      const response = await request(app)
        .post('/api/debate/test-log')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        requestId: 'test-request'
      });
      expect(ApiLogger.logRequest).toHaveBeenCalled();
      expect(ApiLogger.logResponse).toHaveBeenCalled();
    });

    it('should handle logging errors', async () => {
      (ApiLogger.logRequest as jest.Mock).mockRejectedValue(new Error('Logging failed'));

      const response = await request(app)
        .post('/api/debate/test-log')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Logger test failed' });
    });
  });

  describe('POST /api/debate/topic', () => {
    it('should generate a topic successfully', async () => {
      const mockRequest = {
        category: 'technology',
        model: modelConfig.models.opponent.name
      };

      (OpenRouterService.generateTopic as jest.Mock).mockResolvedValue('AI Ethics');

      const response = await request(app)
        .post('/api/debate/topic')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ topic: 'AI Ethics' });
      expect(OpenRouterService.generateTopic).toHaveBeenCalledWith(
        'technology',
        modelConfig.models.opponent.name
      );
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/debate/topic')
        .send({ category: 'technology' }); // Missing model

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle service errors', async () => {
      const mockRequest = {
        category: 'technology',
        model: modelConfig.models.opponent.name
      };

      (OpenRouterService.generateTopic as jest.Mock).mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .post('/api/debate/topic')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to generate topic',
        details: 'API error'
      });
    });
  });

  describe('POST /api/debate/response', () => {
    const messages = [
      { role: 'system', content: 'You are a debater.' },
      { role: 'user', content: 'What about AI safety?' }
    ];

    it('should handle difficulty parameter', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages,
        model: modelConfig.models.opponent.name,
        difficulty: 'hard'
      };

      (OpenRouterService.generateCompletion as jest.Mock).mockResolvedValue('Response with difficulty');

      const response = await request(app)
        .post('/api/debate/response')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(OpenRouterService.generateCompletion).toHaveBeenCalledWith(
        messages,
        modelConfig.models.opponent.name,
        'hard'
      );
    });

    it('should use default difficulty if not provided', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages,
        model: modelConfig.models.opponent.name
      };

      (OpenRouterService.generateCompletion as jest.Mock).mockResolvedValue('Default difficulty response');

      const response = await request(app)
        .post('/api/debate/response')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(OpenRouterService.generateCompletion).toHaveBeenCalledWith(
        messages,
        modelConfig.models.opponent.name,
        'medium'
      );
    });

    it('should handle missing model parameter', async () => {
      const response = await request(app)
        .post('/api/debate/response')
        .send({
          topic: 'AI Ethics',
          position: 'for',
          messages
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required model parameter' });
    });

    it('should handle service errors', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages,
        model: modelConfig.models.opponent.name
      };

      (OpenRouterService.generateCompletion as jest.Mock).mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .post('/api/debate/response')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to generate response',
        details: 'API error'
      });
    });
  });

  describe('POST /api/debate/evaluate', () => {
    const mockRequest = {
      topic: 'AI Ethics',
      position: 'for',
      messages: [{ role: 'user', content: 'Test argument' }],
      currentScores: { user: 75, opponent: 70 },
      model: modelConfig.models.turnScoring.name,
      roleToScore: 'user' as const,
      difficulty: 'hard'
    };

    it('should handle difficulty parameter', async () => {
      (OpenRouterService.evaluateArgument as jest.Mock).mockResolvedValue(85);

      const response = await request(app)
        .post('/api/debate/evaluate')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(OpenRouterService.evaluateArgument).toHaveBeenCalledWith(
        mockRequest.topic,
        mockRequest.position,
        mockRequest.messages,
        mockRequest.currentScores,
        mockRequest.model,
        mockRequest.roleToScore,
        'hard'
      );
    });

    it('should use default difficulty if not provided', async () => {
      const { difficulty, ...requestWithoutDifficulty } = mockRequest;

      (OpenRouterService.evaluateArgument as jest.Mock).mockResolvedValue(80);

      const response = await request(app)
        .post('/api/debate/evaluate')
        .send(requestWithoutDifficulty);

      expect(response.status).toBe(200);
      expect(OpenRouterService.evaluateArgument).toHaveBeenCalledWith(
        mockRequest.topic,
        mockRequest.position,
        mockRequest.messages,
        mockRequest.currentScores,
        mockRequest.model,
        mockRequest.roleToScore,
        'medium'
      );
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/debate/evaluate')
        .send({
          topic: 'AI Ethics',
          position: 'for'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
    });

    it('should handle service errors', async () => {
      (OpenRouterService.evaluateArgument as jest.Mock).mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .post('/api/debate/evaluate')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to evaluate argument',
        details: 'API error'
      });
    });
  });

  describe('POST /api/debate/hint', () => {
    it('should handle difficulty parameter', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        model: modelConfig.models.hint.name,
        difficulty: 'hard'
      };

      (OpenRouterService.generateHint as jest.Mock).mockResolvedValue('Hard difficulty hint');

      const response = await request(app)
        .post('/api/debate/hint')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(OpenRouterService.generateHint).toHaveBeenCalledWith(
        mockRequest.topic,
        mockRequest.position,
        mockRequest.model,
        'hard'
      );
    });

    it('should use default difficulty if not provided', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        model: modelConfig.models.hint.name
      };

      (OpenRouterService.generateHint as jest.Mock).mockResolvedValue('Default difficulty hint');

      const response = await request(app)
        .post('/api/debate/hint')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(OpenRouterService.generateHint).toHaveBeenCalledWith(
        mockRequest.topic,
        mockRequest.position,
        mockRequest.model,
        'medium'
      );
    });

    it('should handle missing model parameter', async () => {
      const response = await request(app)
        .post('/api/debate/hint')
        .send({
          topic: 'AI Ethics',
          position: 'for'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required model parameter' });
    });

    it('should handle service errors', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        model: modelConfig.models.hint.name
      };

      (OpenRouterService.generateHint as jest.Mock).mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .post('/api/debate/hint')
        .send(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to generate hint',
        details: 'API error'
      });
    });
  });
});
