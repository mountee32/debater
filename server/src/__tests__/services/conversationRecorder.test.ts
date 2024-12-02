import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRecorder } from '../../services/conversationRecorder';

// Create mock types
type MockedFsPromises = {
  writeFile: jest.Mock;
  readFile: jest.Mock;
  readdir: jest.Mock;
};

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn()
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

describe('ConversationRecorder', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z');
  const mockConversationId = 'test123';
  const logDir = process.env.NODE_ENV === 'test'
    ? path.join(process.cwd(), 'logs', 'conversations')
    : path.join('/home/vscode/debater/server/logs/conversations');

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
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
  });

  describe('startNewConversation', () => {
    it('should start a new conversation with required fields', () => {
      const conversationId = ConversationRecorder.startNewConversation(mockGameSetup);

      expect(conversationId).toBe(mockConversationId);
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockedFs.promises.writeFile.mock.calls[0][1]);
      expect(savedData.gameSetup).toEqual(expect.objectContaining({
        subjectId: 'TEST001',
        position: 'for',
        skill: 'medium'
      }));
    });

    it('should throw error if required fields are missing', () => {
      const invalidGameSetup = {
        ...mockGameSetup,
        subjectId: undefined
      };

      expect(() => ConversationRecorder.startNewConversation(invalidGameSetup as any))
        .toThrow('Missing required fields');
    });

    it('should create conversations directory if it does not exist', () => {
      (mockedFs.existsSync as jest.Mock).mockReturnValueOnce(false);

      ConversationRecorder.startNewConversation(mockGameSetup);

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        logDir,
        expect.any(Object)
      );
    });
  });

  describe('recordMessage', () => {
    beforeEach(() => {
      ConversationRecorder.startNewConversation(mockGameSetup);
    });

    it('should record a message successfully', async () => {
      const speakerId = 'player1';
      const content = 'Test message';

      mockedFs.promises.writeFile.mockResolvedValueOnce(undefined);

      await ConversationRecorder.recordMessage(speakerId, content);

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockedFs.promises.writeFile.mock.calls[0][1]);
      expect(savedData.events[0]).toEqual({
        type: 'message',
        timestamp: mockDate.toISOString(),
        speakerId,
        content
      });
    });

    it('should throw error if no active conversation', async () => {
      await ConversationRecorder.endConversation();

      await expect(ConversationRecorder.recordMessage('player1', 'test'))
        .rejects.toThrow('No active conversation');
    });
  });

  describe('recordScore', () => {
    beforeEach(() => {
      ConversationRecorder.startNewConversation(mockGameSetup);
    });

    it('should record a score successfully', async () => {
      const participantId = 'player1';
      const newScore = 8;

      mockedFs.promises.writeFile.mockResolvedValueOnce(undefined);

      await ConversationRecorder.recordScore(participantId, newScore);

      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockedFs.promises.writeFile.mock.calls[0][1]);
      expect(savedData.events[0]).toEqual({
        type: 'score',
        timestamp: mockDate.toISOString(),
        participantId,
        newScore
      });
    });

    it('should throw error if no active conversation', async () => {
      await ConversationRecorder.endConversation();

      await expect(ConversationRecorder.recordScore('player1', 8))
        .rejects.toThrow('No active conversation');
    });
  });

  describe('endConversation', () => {
    beforeEach(() => {
      ConversationRecorder.startNewConversation(mockGameSetup);
    });

    it('should end conversation and check for high score', async () => {
      mockedFs.promises.writeFile.mockResolvedValueOnce(undefined);

      const result = await ConversationRecorder.endConversation();

      expect(result).toEqual({
        conversationId: mockConversationId,
        isHighScore: expect.any(Boolean)
      });
      expect(mockedFs.promises.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse(mockedFs.promises.writeFile.mock.calls[0][1]);
      expect(savedData.endTime).toBe(mockDate.toISOString());
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

    it('should retrieve conversation successfully', async () => {
      mockedFs.promises.readdir.mockResolvedValueOnce([
        `2024-01-01-conversation-${mockConversationId}.json`
      ]);
      mockedFs.promises.readFile.mockResolvedValueOnce(
        JSON.stringify(mockConversation)
      );

      const conversation = await ConversationRecorder.getConversation(mockConversationId);

      expect(conversation).toEqual(mockConversation);
    });

    it('should return null if conversation not found', async () => {
      mockedFs.promises.readdir.mockResolvedValueOnce([]);

      const conversation = await ConversationRecorder.getConversation(mockConversationId);

      expect(conversation).toBeNull();
    });

    it('should handle file read errors', async () => {
      const error = new Error('Read error');
      mockedFs.promises.readdir.mockRejectedValueOnce(error);

      await expect(ConversationRecorder.getConversation(mockConversationId))
        .rejects.toThrow('Read error');

      expect(console.error).toHaveBeenCalledWith(
        '[ConversationRecorder] Error reading conversation:',
        error
      );
    });
  });
});
