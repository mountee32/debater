import { jest } from '@jest/globals';
import type { AxiosStatic } from 'axios';

// Create properly typed mock functions
const mockAxios = {
  get: jest.fn<any, any[]>(),
  put: jest.fn<any, any[]>()
} as unknown as AxiosStatic;

// Mock axios module
jest.mock('axios', () => mockAxios);

import { log, clearLogs, getLogs, type LogEntry } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockResolvedValue({ data: [] });
    mockAxios.put.mockResolvedValue({ data: {} });
  });

  it('should create a log entry', async () => {
    const message = 'Test log message';
    await log(message);

    expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:3001/logs');
    expect(mockAxios.put).toHaveBeenCalledWith('http://localhost:3001/logs', expect.arrayContaining([
      expect.objectContaining({
        message,
        timestamp: expect.any(String),
        id: expect.any(String)
      })
    ]));
  });

  it('should clear logs', async () => {
    await clearLogs();

    expect(mockAxios.put).toHaveBeenCalledWith('http://localhost:3001/logs', []);
  });

  it('should handle errors when creating logs', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

    await log('Test message');

    expect(consoleError).toHaveBeenCalledWith('Failed to write log:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('should handle errors when clearing logs', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAxios.put.mockRejectedValueOnce(new Error('Network error'));

    await clearLogs();

    expect(consoleError).toHaveBeenCalledWith('Failed to clear logs:', expect.any(Error));
    consoleError.mockRestore();
  });
});
