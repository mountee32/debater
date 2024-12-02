import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiLogger } from '../../services/apiLogger';

// Create mock types
type MockedFsPromises = {
  writeFile: jest.Mock;
  readFile: jest.Mock;
};

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn()
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

const mockedUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;
const mockedFs = fs as jest.Mocked<typeof fs> & { promises: MockedFsPromises };

describe('ApiLogger', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z');
  const mockSessionId = 'test-ses';
  const mockRequestId = 'test-req';
  const logDir = process.env.NODE_ENV === 'test' 
    ? path.join(process.cwd(), 'logs')
    : path.join('/home/vscode/debater/server/logs');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() and toISOString
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate.toISOString());
    mockedUuidV4.mockReturnValue(mockRequestId);
    // Mock console methods used by ApiLogger
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock fs.existsSync to return true
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
  });

  describe('startNewSession', () => {
    it('should start a new session', () => {
      mockedUuidV4.mockReturnValueOnce(mockSessionId);

      ApiLogger.startNewSession();

      expect(console.log).toHaveBeenCalledWith(
        `[ApiLogger] Started new session: ${mockSessionId}`
      );
    });

    it('should create log directory if it does not exist', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValueOnce(false);
      mockedUuidV4.mockReturnValueOnce(mockSessionId);

      ApiLogger.startNewSession();

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        logDir,
        expect.any(Object)
      );
    });
  });

  describe('logRequest', () => {
    const mockRequest = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    beforeEach(() => {
      ApiLogger.startNewSession();
    });

    it('should log a request successfully', async () => {
      const endpoint = '/api/test';
      const method = 'POST';

      mockedFs.promises.writeFile.mockResolvedValueOnce(undefined);

      const requestId = await ApiLogger.logRequest(endpoint, method, mockRequest);

      expect(requestId).toBe(mockRequestId);
      expect(console.log).toHaveBeenCalledWith('[ApiLogger] Logging request...');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ApiLogger] Writing request log to')
      );
      expect(console.log).toHaveBeenCalledWith('[ApiLogger] Successfully logged request');
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it('should handle file write errors', async () => {
      const endpoint = '/api/test';
      const method = 'POST';
      const error = new Error('Write error');

      mockedFs.promises.writeFile.mockRejectedValueOnce(error);

      await expect(ApiLogger.logRequest(endpoint, method, mockRequest))
        .rejects.toThrow('Write error');

      expect(console.error).toHaveBeenCalledWith(
        '[ApiLogger] Error writing log:',
        error
      );
    });
  });

  describe('logResponse', () => {
    const mockResponse = {
      status: 200,
      data: {
        choices: [{ message: { content: 'Hello! How can I help?' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      }
    };

    beforeEach(() => {
      ApiLogger.startNewSession();
    });

    it('should log a response successfully', async () => {
      const endpoint = '/api/test';
      const method = 'POST';

      mockedFs.promises.writeFile.mockResolvedValueOnce(undefined);

      await ApiLogger.logResponse(mockRequestId, endpoint, method, mockResponse);

      expect(console.log).toHaveBeenCalledWith('[ApiLogger] Logging response...');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[ApiLogger] Writing response log to')
      );
      expect(console.log).toHaveBeenCalledWith('[ApiLogger] Successfully logged response');
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });

    it('should handle file write errors', async () => {
      const endpoint = '/api/test';
      const method = 'POST';
      const error = new Error('Write error');

      mockedFs.promises.writeFile.mockRejectedValueOnce(error);

      await expect(ApiLogger.logResponse(mockRequestId, endpoint, method, mockResponse))
        .rejects.toThrow('Write error');

      expect(console.error).toHaveBeenCalledWith(
        '[ApiLogger] Error writing log:',
        error
      );
    });

    it('should clean response data', async () => {
      const endpoint = '/api/test';
      const method = 'POST';
      const incompleteResponse = {
        status: 200,
        data: {}
      };

      mockedFs.promises.writeFile.mockResolvedValueOnce(undefined);

      await ApiLogger.logResponse(mockRequestId, endpoint, method, incompleteResponse);

      expect(console.log).toHaveBeenCalledWith('[ApiLogger] Successfully logged response');
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
    });
  });
});
