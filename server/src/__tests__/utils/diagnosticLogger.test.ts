import fs from 'fs';
import path from 'path';
import DiagnosticLogger from '../../utils/diagnosticLogger';

// Mock the entire fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    appendFile: jest.fn(),
    unlink: jest.fn()
  }
}));

jest.mock('path', () => ({
  join: jest.fn(),
  dirname: jest.fn()
}));

describe('DiagnosticLogger', () => {
  const mockLogFile = '/mock/path/diagnostic.log';
  const mockDir = '/mock/path';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock path.join and path.dirname
    (path.join as jest.Mock).mockReturnValue(mockLogFile);
    (path.dirname as jest.Mock).mockReturnValue(mockDir);
    
    // Mock process.env
    process.env.ENABLE_DIAGNOSTIC_LOGGING = 'true';

    // Reset console spies
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the static properties
    Object.defineProperties(DiagnosticLogger, {
      logFile: {
        get: () => mockLogFile,
        configurable: true
      },
      enabled: {
        get: () => process.env.ENABLE_DIAGNOSTIC_LOGGING === 'true',
        configurable: true
      }
    });
  });

  describe('initialize', () => {
    it('should initialize logger when enabled', () => {
      // Mock fs.existsSync for directory and file checks
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false)  // Directory doesn't exist
        .mockReturnValueOnce(false); // Log file doesn't exist

      DiagnosticLogger.initialize();

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockDir, { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockLogFile, expect.stringContaining('Diagnostic logging initialized'));
    });

    it('should clear existing log file when it exists', () => {
      // Mock fs.existsSync for directory and file checks
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true)   // Directory exists
        .mockReturnValueOnce(true);  // Log file exists

      DiagnosticLogger.initialize();

      expect(fs.writeFileSync).toHaveBeenCalledWith(mockLogFile, '');
      expect(fs.writeFileSync).toHaveBeenCalledWith(mockLogFile, expect.stringContaining('Diagnostic logging initialized'));
    });

    it('should handle initialization errors', () => {
      const mockError = new Error('Mock error');
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      const consoleSpy = jest.spyOn(console, 'error');
      DiagnosticLogger.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize diagnostic logging:', mockError);
    });

    it('should not initialize when disabled', () => {
      process.env.ENABLE_DIAGNOSTIC_LOGGING = 'false';
      DiagnosticLogger.initialize();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      // Mock fs.promises.appendFile to resolve successfully
      (fs.promises.appendFile as jest.Mock).mockResolvedValue(undefined);
      // Mock fs.appendFileSync
      (fs.appendFileSync as jest.Mock).mockReturnValue(undefined);
      // Mock fs.existsSync to return true for directory
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // Initialize logger
      DiagnosticLogger.initialize();
    });

    it('should log message with timestamp', async () => {
      const message = 'Test message';
      await DiagnosticLogger.log(message);

      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] Test message\n$/)
      );
    });

    it('should log message with data', async () => {
      const message = 'Test message';
      const data = { key: 'value' };
      await DiagnosticLogger.log(message, data);

      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] Test message\nData: {\n\s+"key": "value"\n}\n$/)
      );
    });

    it('should handle data stringification errors', async () => {
      const message = 'Test message';
      const circularData: any = {};
      circularData.self = circularData;

      await DiagnosticLogger.log(message, circularData);

      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] Test message\nData: \[Error stringifying data\]\n$/)
      );
    });

    it('should log warnings', async () => {
      const message = 'Warning message';
      await DiagnosticLogger.warn(message);

      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] WARNING: Warning message\n$/)
      );
    });

    it('should log errors with stack trace', async () => {
      const message = 'Error message';
      const error = new Error('Test error');
      await DiagnosticLogger.error(message, error);

      expect(fs.promises.appendFile).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] ERROR: Error message\nError: Test error\nStack:/)
      );
    });

    it('should use sync write for startup logs', () => {
      const message = 'Server starting';
      DiagnosticLogger.log(message);

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        mockLogFile,
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] Server starting\n$/)
      );
    });

    it('should not log when disabled', async () => {
      process.env.ENABLE_DIAGNOSTIC_LOGGING = 'false';
      await DiagnosticLogger.log('Test message');

      expect(fs.promises.appendFile).not.toHaveBeenCalled();
      expect(fs.appendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      DiagnosticLogger.initialize();
    });

    it('should clear log file when it exists', async () => {
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      await DiagnosticLogger.clear();

      expect(fs.promises.unlink).toHaveBeenCalledWith(mockLogFile);
    });

    it('should handle clear errors', async () => {
      const mockError = new Error('Mock error');
      (fs.promises.unlink as jest.Mock).mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, 'error');
      await DiagnosticLogger.clear();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear diagnostic log:', mockError);
    });

    it('should not attempt to clear when disabled', async () => {
      process.env.ENABLE_DIAGNOSTIC_LOGGING = 'false';
      await DiagnosticLogger.clear();

      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });
  });
});
