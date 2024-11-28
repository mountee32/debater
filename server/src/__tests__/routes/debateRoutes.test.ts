import express from 'express';
import request from 'supertest';
import { OpenRouterService } from '../../services/openRouterService';
import { ApiLogger } from '../../services/apiLogger';
import DiagnosticLogger from '../../utils/diagnosticLogger';
import debateRoutes from '../../routes/debateRoutes';

// Get the mocked version of our dependencies
jest.mock('../../services/openRouterService');
jest.mock('../../services/apiLogger');
jest.mock('../../utils/diagnosticLogger');

const mockedOpenRouterService = jest.mocked(OpenRouterService);
const mockedApiLogger = jest.mocked(ApiLogger);
const mockedDiagnosticLogger = jest.mocked(DiagnosticLogger);

describe('Debate Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', debateRoutes);
  });

  describe('POST /api/topic', () => {
    it('should generate a topic successfully', async () => {
      const mockTopic = 'Should artificial intelligence be regulated?';
      const requestBody = {
        category: 'technology',
        model: 'gpt-3.5-turbo'
      };

      mockedOpenRouterService.generateTopic.mockResolvedValueOnce(mockTopic);

      const response = await request(app)
        .post('/api/topic')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ topic: mockTopic });
      expect(mockedApiLogger.startNewSession).toHaveBeenCalled();
      expect(mockedDiagnosticLogger.log).toHaveBeenCalledWith(
        '[DebateRoutes] Generating topic:',
        expect.any(Object)
      );
      expect(mockedOpenRouterService.generateTopic).toHaveBeenCalledWith(
        'technology',
        'gpt-3.5-turbo'
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const requestBody = {
        category: 'technology'
        // missing model field
      };

      const response = await request(app)
        .post('/api/topic')
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
      expect(mockedOpenRouterService.generateTopic).not.toHaveBeenCalled();
    });

    it('should return 500 when topic generation fails', async () => {
      const requestBody = {
        category: 'technology',
        model: 'gpt-3.5-turbo'
      };
      const error = new Error('API error');

      mockedOpenRouterService.generateTopic.mockRejectedValueOnce(error);

      const response = await request(app)
        .post('/api/topic')
        .send(requestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to generate topic',
        details: 'API error'
      });
      expect(mockedDiagnosticLogger.error).toHaveBeenCalledWith(
        '[DebateRoutes] Topic generation error:',
        error
      );
    });
  });

  describe('POST /api/response', () => {
    it('should generate a response successfully', async () => {
      const mockResponse = 'This is a well-reasoned argument...';
      const requestBody = {
        topic: 'Should AI be regulated?',
        position: 'pro',
        messages: [
          { role: 'system', content: 'You are a debate assistant' },
          { role: 'user', content: 'Initial argument' }
        ],
        model: 'gpt-3.5-turbo'
      };

      mockedOpenRouterService.generateCompletion.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/api/response')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ response: mockResponse });
      expect(mockedDiagnosticLogger.log).toHaveBeenCalledWith(
        '[DebateRoutes] Generating response:',
        expect.any(Object)
      );
      expect(mockedOpenRouterService.generateCompletion).toHaveBeenCalledWith(
        requestBody.messages,
        requestBody.model
      );
    });

    it('should return 500 when response generation fails', async () => {
      const requestBody = {
        topic: 'Should AI be regulated?',
        position: 'pro',
        messages: [
          { role: 'system', content: 'You are a debate assistant' },
          { role: 'user', content: 'Initial argument' }
        ],
        model: 'gpt-3.5-turbo'
      };
      const error = new Error('API error');

      mockedOpenRouterService.generateCompletion.mockRejectedValueOnce(error);

      const response = await request(app)
        .post('/api/response')
        .send(requestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to generate response',
        details: 'API error'
      });
      expect(mockedDiagnosticLogger.error).toHaveBeenCalledWith(
        '[DebateRoutes] Response generation error:',
        error
      );
    });
  });

  describe('POST /api/evaluate', () => {
    it('should evaluate an argument successfully', async () => {
      const mockScore = 85; // Score between 0-100
      const requestBody = {
        topic: 'Should AI be regulated?',
        position: 'for',
        messages: [
          { role: 'system', content: 'You are a debate assistant' },
          { role: 'user', content: 'AI needs regulation because...' }
        ],
        currentScores: { user: 75, opponent: 70 },
        model: 'gpt-3.5-turbo',
        roleToScore: 'user' as const
      };

      mockedOpenRouterService.evaluateArgument.mockResolvedValueOnce(mockScore);

      const response = await request(app)
        .post('/api/evaluate')
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ score: mockScore });
      expect(mockedDiagnosticLogger.log).toHaveBeenCalledWith(
        '[DebateRoutes] Evaluating argument request:',
        expect.any(Object)
      );
      expect(mockedOpenRouterService.evaluateArgument).toHaveBeenCalledWith(
        requestBody.topic,
        requestBody.position,
        requestBody.messages,
        requestBody.currentScores,
        requestBody.model,
        requestBody.roleToScore
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const requestBody = {
        topic: 'Should AI be regulated?',
        position: 'for',
        // missing other required fields
      };

      const response = await request(app)
        .post('/api/evaluate')
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Missing required fields' });
      expect(mockedOpenRouterService.evaluateArgument).not.toHaveBeenCalled();
    });

    it('should return 500 when evaluation fails', async () => {
      const requestBody = {
        topic: 'Should AI be regulated?',
        position: 'for',
        messages: [
          { role: 'system', content: 'You are a debate assistant' },
          { role: 'user', content: 'AI needs regulation because...' }
        ],
        currentScores: { user: 75, opponent: 70 },
        model: 'gpt-3.5-turbo',
        roleToScore: 'user' as const
      };
      const error = new Error('API error');

      mockedOpenRouterService.evaluateArgument.mockRejectedValueOnce(error);

      const response = await request(app)
        .post('/api/evaluate')
        .send(requestBody);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to evaluate argument',
        details: 'API error'
      });
      expect(mockedDiagnosticLogger.error).toHaveBeenCalledWith(
        '[DebateRoutes] Evaluation error:',
        error
      );
    });
  });
});
