import fs from 'fs';
import path from 'path';
import { HighScoreManager } from '../../services/highScoreManager';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn()
  }
}));

// Mock DiagnosticLogger
jest.mock('../../utils/diagnosticLogger', () => ({
  log: jest.fn(),
  error: jest.fn()
}));

describe('HighScoreManager', () => {
  const mockLeaderboard = {
    entries: [
      {
        id: 1,
        username: 'user1',
        score: 95,
        subjectId: 'SCI001',
        position: 'for',
        skill: 'easy',
        conversationId: 'conv1'
      },
      {
        id: 2,
        username: 'user2',
        score: 90,
        subjectId: 'SCI001',
        position: 'against',
        skill: 'easy',
        conversationId: 'conv2'
      },
      {
        id: 3,
        username: 'user3',
        score: 85,
        subjectId: 'SCI001',
        position: 'for',
        skill: 'easy',
        conversationId: 'conv3'
      },
      {
        id: 4,
        username: 'user4',
        score: 80,
        subjectId: 'SCI001',
        position: 'against',
        skill: 'easy',
        conversationId: 'conv4'
      },
      {
        id: 5,
        username: 'user5',
        score: 75,
        subjectId: 'SCI001',
        position: 'for',
        skill: 'easy',
        conversationId: 'conv5'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock fs operations with default success responses
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockLeaderboard));
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  describe('readLeaderboard', () => {
    it('should handle file read error', async () => {
      const error = new Error('File read error');
      (fs.promises.readFile as jest.Mock).mockRejectedValueOnce(error);

      await expect(HighScoreManager.checkAndUpdateHighScore(
        95,
        'SCI001',
        'easy',
        'for',
        'conv6'
      )).rejects.toThrow('File read error');
    });

    it('should handle invalid JSON in leaderboard file', async () => {
      (fs.promises.readFile as jest.Mock).mockResolvedValueOnce('invalid json');

      await expect(HighScoreManager.checkAndUpdateHighScore(
        95,
        'SCI001',
        'easy',
        'for',
        'conv6'
      )).rejects.toThrow(SyntaxError);
    });
  });

  describe('writeLeaderboard', () => {
    it('should handle file write error', async () => {
      const error = new Error('File write error');
      (fs.promises.writeFile as jest.Mock).mockRejectedValueOnce(error);

      await expect(HighScoreManager.addHighScore(
        'newuser',
        95,
        'SCI001',
        'easy',
        'for',
        'conv6'
      )).rejects.toThrow('File write error');
    });
  });

  describe('deleteConversationFile', () => {
    it('should handle readdir error', async () => {
      const error = new Error('Read directory error');
      (fs.promises.readdir as jest.Mock).mockRejectedValueOnce(error);

      await expect(HighScoreManager.checkAndUpdateHighScore(
        50,
        'SCI001',
        'easy',
        'for',
        'conv6'
      )).rejects.toThrow('Read directory error');
    });

    it('should handle unlink error', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValueOnce(['2024-01-01-conversation-conv6.json']);
      const error = new Error('Unlink error');
      (fs.promises.unlink as jest.Mock).mockRejectedValueOnce(error);

      await expect(HighScoreManager.checkAndUpdateHighScore(
        50,
        'SCI001',
        'easy',
        'for',
        'conv6'
      )).rejects.toThrow('Unlink error');
    });

    it('should handle missing conversation file', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValueOnce(['other-file.json']);

      const result = await HighScoreManager.checkAndUpdateHighScore(
        50,
        'SCI001',
        'easy',
        'for',
        'conv6'
      );

      expect(result).toBe(false);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });
  });

  describe('checkAndUpdateHighScore', () => {
    it('should return true for score that makes top 5', async () => {
      const result = await HighScoreManager.checkAndUpdateHighScore(
        98,
        'SCI001',
        'easy',
        'for',
        'conv6'
      );

      expect(result).toBe(true);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it('should return false and delete conversation for low score', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValueOnce(['2024-01-01-conversation-conv6.json']);

      const result = await HighScoreManager.checkAndUpdateHighScore(
        50,
        'SCI001',
        'easy',
        'for',
        'conv6'
      );

      expect(result).toBe(false);
      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should handle first entry for subject/skill', async () => {
      const result = await HighScoreManager.checkAndUpdateHighScore(
        85,
        'NEW001',
        'medium',
        'against',
        'conv6'
      );

      expect(result).toBe(true);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });
  });

  describe('addHighScore', () => {
    it('should add new high score and maintain only top 5', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValueOnce(['2024-01-01-conversation-conv5.json']);

      await HighScoreManager.addHighScore(
        'newuser',
        98,
        'SCI001',
        'easy',
        'for',
        'conv6'
      );

      expect(fs.promises.writeFile).toHaveBeenCalled();
      const savedLeaderboard = JSON.parse((fs.promises.writeFile as jest.Mock).mock.calls[0][1]);
      
      const relevantEntries = savedLeaderboard.entries.filter(
        (entry: any) => entry.subjectId === 'SCI001' && entry.skill === 'easy'
      );
      expect(relevantEntries).toHaveLength(5);
      expect(relevantEntries[0].score).toBe(98); // New highest score
      expect(relevantEntries[4].score).toBe(80); // Previous 4th score becomes 5th

      expect(fs.promises.unlink).toHaveBeenCalled(); // Should delete lowest score's conversation
    });

    it('should handle first entry for subject/skill combination', async () => {
      await HighScoreManager.addHighScore(
        'firstuser',
        85,
        'NEW001',
        'medium',
        'against',
        'conv1'
      );

      expect(fs.promises.writeFile).toHaveBeenCalled();
      const savedLeaderboard = JSON.parse((fs.promises.writeFile as jest.Mock).mock.calls[0][1]);
      
      const newEntry = savedLeaderboard.entries.find(
        (entry: any) => entry.subjectId === 'NEW001' && entry.skill === 'medium'
      );
      expect(newEntry).toBeDefined();
      expect(newEntry.username).toBe('firstuser');
      expect(newEntry.score).toBe(85);
    });

    it('should handle multiple entries for different subjects/skills', async () => {
      // Mock readFile to return updated leaderboard after first addition
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockLeaderboard)) // First call
        .mockResolvedValueOnce(JSON.stringify({
          entries: [
            ...mockLeaderboard.entries,
            {
              id: 6,
              username: 'user1',
              score: 90,
              subjectId: 'SCI002',
              position: 'for',
              skill: 'easy',
              conversationId: 'conv7'
            }
          ]
        })); // Second call

      // Add entry for different subject
      await HighScoreManager.addHighScore(
        'user1',
        90,
        'SCI002',
        'easy',
        'for',
        'conv7'
      );

      // Add entry for different skill level
      await HighScoreManager.addHighScore(
        'user2',
        85,
        'SCI001',
        'hard',
        'for',
        'conv8'
      );

      const finalLeaderboard = JSON.parse((fs.promises.writeFile as jest.Mock).mock.calls[1][1]);

      // Check SCI002 entry
      const sci002Entries = finalLeaderboard.entries.filter(
        (entry: any) => entry.subjectId === 'SCI002' && entry.skill === 'easy'
      );
      expect(sci002Entries).toHaveLength(1);
      expect(sci002Entries[0].score).toBe(90);

      // Check hard skill entry
      const hardEntries = finalLeaderboard.entries.filter(
        (entry: any) => entry.subjectId === 'SCI001' && entry.skill === 'hard'
      );
      expect(hardEntries).toHaveLength(1);
      expect(hardEntries[0].score).toBe(85);

      // Original entries should remain unchanged
      const originalEntries = finalLeaderboard.entries.filter(
        (entry: any) => entry.subjectId === 'SCI001' && entry.skill === 'easy'
      );
      expect(originalEntries).toHaveLength(5);
    });
  });
});
