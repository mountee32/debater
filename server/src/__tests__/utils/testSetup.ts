import { Request, Response } from 'express';

export const mockRequest = (data?: any): Partial<Request> => ({
  body: data || {},
});

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock services
jest.mock('../../services/openRouterService', () => ({
  OpenRouterService: {
    generateTopic: jest.fn(),
    generateCompletion: jest.fn(),
    evaluateArgument: jest.fn(),
    generateHint: jest.fn(),
    evaluateDebate: jest.fn(),
  },
}));

jest.mock('../../services/apiLogger', () => ({
  ApiLogger: {
    logRequest: jest.fn().mockResolvedValue('test-request-id'),
    logResponse: jest.fn(),
    startNewSession: jest.fn(),
  },
}));

jest.mock('../../utils/diagnosticLogger', () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));
