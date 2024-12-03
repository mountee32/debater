import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRecorder } from '../../services/conversationRecorder';
import { HighScoreManager } from '../../services/highScoreManager';

// Import types from ConversationRecorder
type MessageEvent = {
  type: 'message';
  timestamp: string;
  speakerId: string;
  content: string;
};

type ScoreEvent = {
  type: 'score';
  timestamp: string;
  participantId: string;
  newScore: number;
};

type ConversationEvent = MessageEvent | ScoreEvent;

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
  __esModule: true,
  default: {
    log: jest.fn().mockImplementation(() => Promise.resolve()),
    error: jest.fn().mockImplementation(() => Promise.resolve())
  }
}));

// Mock env
jest.mock('../../config/env', () => ({
  env: {
    BASE_PATH: '/data/debater'
  }
}));

const mockedUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;
const mockedFs = fs as jest.Mocked<typeof fs> & { promises: MockedFsPromises };

describe('ConversationRecorder', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z');
  const mockConversationId = 'test123';
  const logDir = '/data/debater/server/logs/conversations';

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
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate.toISOString());
    (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
    mockedUuidV4.mockReturnValue(mockConversationId);
    (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockResolvedValue(false);
    mockedFs.promises.writeFile.mockResolvedValue(undefined);
    mockedFs.promises.mkdir.mockResolvedValue(undefined);
  });

  describe('startNewConversation', () => {
    it('should start a new conversation and keep it in memory', async () => {
      const conversationId = await ConversationRecorder.startNewConversation(mockGameSetup);

      expect(conversationId).toBe(mockConversationId);
      // Verify no file was written
      expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();
      
      // Verify conversation is in memory by recording a message
      await ConversationRecorder.recordMessage('player1', 'Test message');
      // Still no file write
      expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('recordMessage and recordScore', () => {
    beforeEach(async () => {
      await ConversationRecorder.startNewConversation(mockGameSetup);
    });

    it('should record events in memory without writing to disk', async () => {
      await ConversationRecorder.recordMessage('player1', 'First message');
      await ConversationRecorder.recordScore('player1', 5);
      await ConversationRecorder.recordMessage('player2', 'Second message');

      // Verify no files were written
      expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();
      
      // Verify events are in memory by ending conversation with high score
      (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockResolvedValueOnce(true);
      await ConversationRecorder.endConversation();
      
      // Now verify file was written with all events
      expect(mockedFs.promises.writeFile).toHaveBeenCalledTimes(1);
      const savedData = JSON.parse(mockedFs.promises.writeFile.mock.calls[0][1]);
      expect(savedData.events).toHaveLength(3);
      
      // Type guard to safely check event properties
      const messageEvents = savedData.events.filter((e: ConversationEvent): e is MessageEvent => e.type === 'message');
      const scoreEvents = savedData.events.filter((e: ConversationEvent): e is ScoreEvent => e.type === 'score');
      
      expect(messageEvents[0].content).toBe('First message');
      expect(scoreEvents[0].newScore).toBe(5);
      expect(messageEvents[1].content).toBe('Second message');
    });
  });

  describe('endConversation', () => {
    beforeEach(async () => {
      await ConversationRecorder.startNewConversation(mockGameSetup);
    });

    it('should save conversation to disk only if high score', async () => {
      await ConversationRecorder.recordScore('player1', 95);
      (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockResolvedValueOnce(true);

      const result = await ConversationRecorder.endConversation();

      expect(result).toEqual({
        conversationId: mockConversationId,
        isHighScore: true
      });
      expect(mockedFs.promises.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should not save conversation to disk if not high score', async () => {
      await ConversationRecorder.recordScore('player1', 50);
      (HighScoreManager.checkAndUpdateHighScore as jest.Mock).mockResolvedValueOnce(false);

      const result = await ConversationRecorder.endConversation();

      expect(result).toEqual({
        conversationId: mockConversationId,
        isHighScore: false
      });
      expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getConversation', () => {
    it('should return current conversation from memory if active', async () => {
      await ConversationRecorder.startNewConversation(mockGameSetup);
      await ConversationRecorder.recordMessage('player1', 'Test message');

      const conversation = await ConversationRecorder.getConversation(mockConversationId);

      expect(conversation).toBeTruthy();
      // Type guard to safely check message content
      const messageEvent = conversation?.events[0];
      expect(messageEvent?.type).toBe('message');
      if (messageEvent?.type === 'message') {
        expect(messageEvent.content).toBe('Test message');
      }
      // Verify no file operations were needed
      expect(mockedFs.promises.readFile).not.toHaveBeenCalled();
    });

    it('should read from disk for completed conversations', async () => {
      // Use a different ID to ensure we're not getting the conversation from memory
      const completedConversationId = 'completed123';
      mockedUuidV4.mockReturnValueOnce(completedConversationId);

      // Mock the file content exactly as it would be saved
      const mockConversation = {
        id: completedConversationId,
        startTime: mockDate.toISOString(),
        gameSetup: mockGameSetup,
        events: [{
          type: 'message' as const,
          timestamp: mockDate.toISOString(),
          speakerId: 'player1',
          content: 'Test message'
        }]
      };

      // Mock fs.existsSync for the log directory
      (mockedFs.existsSync as jest.Mock).mockReturnValueOnce(true);

      // Mock readdir to return our conversation file
      mockedFs.promises.readdir.mockResolvedValueOnce([
        `2024-01-01-conversation-${completedConversationId}.json`
      ]);

      // Mock readFile to return our conversation data
      mockedFs.promises.readFile.mockResolvedValueOnce(JSON.stringify(mockConversation));

      const conversation = await ConversationRecorder.getConversation(completedConversationId);

      expect(conversation).toEqual(mockConversation);
      expect(mockedFs.promises.readdir).toHaveBeenCalledWith(logDir);
      expect(mockedFs.promises.readFile).toHaveBeenCalled();
      const readFilePath = mockedFs.promises.readFile.mock.calls[0][0];
      expect(readFilePath).toContain(completedConversationId);
    });
  });
});
