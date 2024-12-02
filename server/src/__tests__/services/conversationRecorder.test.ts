import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRecorder } from '../../services/conversationRecorder';
import { HighScoreManager } from '../../services/highScoreManager';

// Create mock types
type MockedFsPromises = {
  writeFile: jest.Mock;
  readFile: jest.Mock;
  readdir: jest.Mock;
  mkdir: jest.Mock;
  unlink: jest.Mock;
};

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn()
  },
  existsSync: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Mock HighScoreManager
jest.mock('../../services/highScoreManager', () => ({
  HighScoreManager: {
    checkAndUpdateHighScore: jest.fn()
  }
}));

// Mock DiagnosticLogger
jest.mock('../../utils/diagnosticLogger', () => ({
  log: jest.fn(),
  error: jest.fn()
}));

const mockedUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;
const mockedFs = fs as jest.Mocked<typeof fs> & { promises: MockedFsPromises };

describe('ConversationRecorder', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z');
  const mockConversationId = 'test123';
  const logDir = '/home/vscode/debater/server/logs/conversations';

  const mockGameSetup = {
    topic: 'Test Topic',
    difficulty: 5,
    participants: [
      {
        id: 'player1',
        name: 'Player 1',
        avatar: 'avatar1.svg',
        role: 'debater' as const
      },
      {
        id: 'player2',
        name: 'Player 2',
        avatar: 'avatar2.svg',
        role: 'debater' as const
      }
    ],
    subjectId: 'TEST001',
    position: 'for' as const,
    skill: 'medium' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() and toISOString
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate.toISOString());
    mockedUuidV4.mockReturnValue(mockConversationId);
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock fs.existsSync to return true
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
    // Mock HighScoreManager
    (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockResolvedValue(false);
    // Mock fs.promises methods with default success responses
    mockedFs.promises.writeFile.mockResolvedValue(undefined);
    mockedFs.promises.unlink.mockResolvedValue(undefined);
    mockedFs.promises.mkdir.mockResolvedValue(undefined);
  });

  describe('ensureLogDir', () => {
    it('should create directory if it does not exist', async () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValueOnce(false);

      await ConversationRecorder.startNewConversation(mockGameSetup);

      expect(mockedFs.promises.mkdir).toHaveBeenCalledWith(
        logDir,
        expect.objectContaining({ recursive: true })
      );
    });

    it('should handle directory creation error', async () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValueOnce(false);
      const error = new Error('Permission denied');
      mockedFs.promises.mkdir.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.startNewConversation(mockGameSetup))
        .rejects.toThrow('Permission denied');
    });

    it('should handle write permission test error', async () => {
      const error = new Error('Write permission denied');
      mockedFs.promises.writeFile.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.startNewConversation(mockGameSetup))
        .rejects.toThrow('Write permission denied');
    });

    it('should handle unlink error during permission test', async () => {
      const error = new Error('Unlink failed');
      mockedFs.promises.unlink.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.startNewConversation(mockGameSetup))
        .rejects.toThrow('Unlink failed');
    });
  });

  describe('startNewConversation', () => {
    it('should start a new conversation with required fields', async () => {
      const conversationId = await ConversationRecorder.startNewConversation(mockGameSetup);

      expect(conversationId).toBe(mockConversationId);
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
      const writeFileCalls = mockedFs.promises.writeFile.mock.calls;
      const lastWriteCall = writeFileCalls[writeFileCalls.length - 1];
      const savedData = JSON.parse(lastWriteCall[1]);
      expect(savedData).toEqual({
        id: mockConversationId,
        startTime: mockDate.toISOString(),
        gameSetup: mockGameSetup,
        events: []
      });
    });

    it('should handle file write error', async () => {
      const error = new Error('Write failed');
      // First call succeeds (permission test)
      mockedFs.promises.writeFile
        .mockResolvedValueOnce(undefined)
        // Second call fails (actual write)
        .mockRejectedValueOnce(error);

      await expect(ConversationRecorder.startNewConversation(mockGameSetup))
        .rejects.toThrow('Write failed');
    });
  });

  describe('recordMessage and recordScore', () => {
    beforeEach(async () => {
      // Reset mocks and ensure first conversation write succeeds
      mockedFs.promises.writeFile
        .mockResolvedValueOnce(undefined) // permission test
        .mockResolvedValueOnce(undefined); // initial conversation save
      await ConversationRecorder.startNewConversation(mockGameSetup);
      mockedFs.promises.writeFile.mockClear(); // Clear previous calls
    });

    it('should record multiple events in order', async () => {
      await ConversationRecorder.recordMessage('player1', 'First message');
      await ConversationRecorder.recordScore('player1', 5);
      await ConversationRecorder.recordMessage('player2', 'Second message');

      const lastCall = mockedFs.promises.writeFile.mock.calls.slice(-1)[0];
      const savedData = JSON.parse(lastCall[1]);
      
      expect(savedData.events).toHaveLength(3);
      expect(savedData.events[0]).toEqual({
        type: 'message',
        timestamp: mockDate.toISOString(),
        speakerId: 'player1',
        content: 'First message'
      });
      expect(savedData.events[1]).toEqual({
        type: 'score',
        timestamp: mockDate.toISOString(),
        participantId: 'player1',
        newScore: 5
      });
      expect(savedData.events[2]).toEqual({
        type: 'message',
        timestamp: mockDate.toISOString(),
        speakerId: 'player2',
        content: 'Second message'
      });
    });

    it('should handle file write error when recording message', async () => {
      const error = new Error('Write failed');
      mockedFs.promises.writeFile.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.recordMessage('player1', 'Test'))
        .rejects.toThrow('Write failed');
    });

    it('should handle file write error when recording score', async () => {
      const error = new Error('Write failed');
      mockedFs.promises.writeFile.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.recordScore('player1', 5))
        .rejects.toThrow('Write failed');
    });

    it('should throw error if no active conversation when recording message', async () => {
      await ConversationRecorder.endConversation();
      await expect(ConversationRecorder.recordMessage('player1', 'Test'))
        .rejects.toThrow('No active conversation');
    });

    it('should throw error if no active conversation when recording score', async () => {
      await ConversationRecorder.endConversation();
      await expect(ConversationRecorder.recordScore('player1', 5))
        .rejects.toThrow('No active conversation');
    });
  });

  describe('endConversation', () => {
    beforeEach(async () => {
      // Reset mocks and ensure first conversation write succeeds
      mockedFs.promises.writeFile
        .mockResolvedValueOnce(undefined) // permission test
        .mockResolvedValueOnce(undefined); // initial conversation save
      await ConversationRecorder.startNewConversation(mockGameSetup);
      mockedFs.promises.writeFile.mockClear(); // Clear previous calls
    });

    it('should end conversation with final score and check for high score', async () => {
      await ConversationRecorder.recordScore('player1', 95);
      (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockResolvedValueOnce(true);

      const result = await ConversationRecorder.endConversation();

      expect(result).toEqual({
        conversationId: mockConversationId,
        isHighScore: true
      });
      expect(HighScoreManager.checkAndUpdateHighScore).toHaveBeenCalledWith(
        95,
        mockGameSetup.subjectId,
        mockGameSetup.skill,
        mockGameSetup.position,
        mockConversationId
      );

      const lastCall = mockedFs.promises.writeFile.mock.calls.slice(-1)[0];
      const savedData = JSON.parse(lastCall[1]);
      expect(savedData.endTime).toBe(mockDate.toISOString());
    });

    it('should handle no score events when ending conversation', async () => {
      const result = await ConversationRecorder.endConversation();

      expect(result).toEqual({
        conversationId: mockConversationId,
        isHighScore: false
      });
      expect(HighScoreManager.checkAndUpdateHighScore).toHaveBeenCalledWith(
        0,
        mockGameSetup.subjectId,
        mockGameSetup.skill,
        mockGameSetup.position,
        mockConversationId
      );
    });

    it('should handle high score check error', async () => {
      const error = new Error('High score check failed');
      (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockRejectedValueOnce(error);

      await expect(ConversationRecorder.endConversation())
        .rejects.toThrow('High score check failed');
    });

    it('should throw error if no active conversation', async () => {
      await ConversationRecorder.endConversation();
      await expect(ConversationRecorder.endConversation())
        .rejects.toThrow('No active conversation');
    });
  });

  describe('getConversation', () => {
    const mockConversation = {
      id: mockConversationId,
      startTime: mockDate.toISOString(),
      endTime: mockDate.toISOString(),
      gameSetup: mockGameSetup,
      events: []
    };

    it('should retrieve conversation with events', async () => {
      mockedFs.promises.readdir.mockResolvedValueOnce([
        `2024-01-01-conversation-${mockConversationId}.json`
      ]);
      const conversationWithEvents = {
        ...mockConversation,
        events: [
          {
            type: 'message',
            timestamp: mockDate.toISOString(),
            speakerId: 'player1',
            content: 'Test message'
          },
          {
            type: 'score',
            timestamp: mockDate.toISOString(),
            participantId: 'player1',
            newScore: 5
          }
        ]
      };
      mockedFs.promises.readFile.mockResolvedValueOnce(
        JSON.stringify(conversationWithEvents)
      );

      const conversation = await ConversationRecorder.getConversation(mockConversationId);

      expect(conversation).toEqual(conversationWithEvents);
      expect(conversation?.events).toHaveLength(2);
    });

    it('should return null if conversation not found', async () => {
      mockedFs.promises.readdir.mockResolvedValueOnce([
        '2024-01-01-conversation-other.json'
      ]);

      const conversation = await ConversationRecorder.getConversation(mockConversationId);
      expect(conversation).toBeNull();
    });

    it('should handle invalid JSON in conversation file', async () => {
      mockedFs.promises.readdir.mockResolvedValueOnce([
        `2024-01-01-conversation-${mockConversationId}.json`
      ]);
      mockedFs.promises.readFile.mockResolvedValueOnce('invalid json');

      await expect(ConversationRecorder.getConversation(mockConversationId))
        .rejects.toThrow(SyntaxError);
    });

    it('should handle readdir error', async () => {
      const error = new Error('Read directory failed');
      mockedFs.promises.readdir.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.getConversation(mockConversationId))
        .rejects.toThrow('Read directory failed');
    });

    it('should handle readFile error', async () => {
      mockedFs.promises.readdir.mockResolvedValueOnce([
        `2024-01-01-conversation-${mockConversationId}.json`
      ]);
      const error = new Error('Read file failed');
      mockedFs.promises.readFile.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.getConversation(mockConversationId))
        .rejects.toThrow('Read file failed');
    });
  });
});
