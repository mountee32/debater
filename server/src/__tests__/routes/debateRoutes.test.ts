import request from 'supertest';
import express from 'express';
import debateRoutes from '../../routes/debateRoutes';
import { OpenRouterService } from '../../services/openRouterService';
import modelConfig from '../../../../models.config.json';

// Mock the OpenRouterService
jest.mock('../../services/openRouterService');

const app = express();
app.use(express.json());
app.use('/api/debate', debateRoutes);

describe('Debate Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/debate/response', () => {
    it('should generate a response successfully', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages: [
          { role: 'system', content: 'You are a debater.' },
          { role: 'user', content: 'What about AI safety?' }
        ],
        model: modelConfig.models.opponent.name
      };

      (OpenRouterService.generateCompletion as jest.Mock).mockResolvedValue('AI safety is crucial...');

      const response = await request(app)
        .post('/api/debate/response')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ response: 'AI safety is crucial...' });
    });

    it('should handle missing model parameter', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages: [
          { role: 'system', content: 'You are a debater.' },
          { role: 'user', content: 'What about AI safety?' }
        ]
      };

      const response = await request(app)
        .post('/api/debate/response')
        .send(mockRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required model parameter');
    });
  });

  describe('POST /api/debate/evaluate', () => {
    const messages = [
      { role: 'system', content: 'You are a debater.' },
      { role: 'user', content: 'AI has risks and benefits.' }
    ];

    it('should evaluate an argument successfully', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages,
        currentScores: { user: 75, opponent: 70 },
        model: modelConfig.models.turnScoring.name,
        roleToScore: 'user' as const
      };

      (OpenRouterService.evaluateArgument as jest.Mock).mockResolvedValue(85);

      const response = await request(app)
        .post('/api/debate/evaluate')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ score: 85 });
    });

    it('should handle missing required fields', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        messages,
        model: modelConfig.models.turnScoring.name,
        roleToScore: 'user' as const
      };

      const response = await request(app)
        .post('/api/debate/evaluate')
        .send(mockRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/debate/hint', () => {
    it('should generate a hint successfully', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for',
        model: modelConfig.models.hint.name
      };

      (OpenRouterService.generateHint as jest.Mock).mockResolvedValue('Consider discussing safety measures...');

      const response = await request(app)
        .post('/api/debate/hint')
        .send(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ hint: 'Consider discussing safety measures...' });
    });

    it('should handle missing model parameter', async () => {
      const mockRequest = {
        topic: 'AI Ethics',
        position: 'for'
      };

      const response = await request(app)
        .post('/api/debate/hint')
        .send(mockRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required model parameter');
    });
  });
});
