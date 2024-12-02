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

describe('HighScoreManager', () => {
  const mockLeaderboard = {
    entries: [
      {
        id: 1,
        username: 'user1',
        score: 90,
        subjectId: 'SCI001',
        position: 'for',
        skill: 'easy',
        conversationId: 'conv1'
      },
      {
        id: 2,
        username: 'user2',
        score: 85,
        subjectId: 'SCI001',
        position: 'against',
        skill: 'easy',
        conversationId: 'conv2'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock fs.promises.readFile to return mockLeaderboard
    (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockLeaderboard));
  });

  describe('checkAndUpdateHighScore', () => {
    it('should return true for score that makes top 5', async () => {
      const result = await HighScoreManager.checkAndUpdateHighScore(
        95,
        'SCI001',
        'easy',
        'for',
        'conv3'
      );

      expect(result).toBe(true);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it('should return false and delete conversation for low score', async () => {
      // Mock readdir to return conversation file
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['2024-01-01-conversation-conv3.json']);

      const result = await HighScoreManager.checkAndUpdateHighScore(
        50,
        'SCI001',
        'easy',
        'for',
        'conv3'
      );

      expect(result).toBe(false);
      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('addHighScore', () => {
    it('should add new high score and maintain only top 5', async () => {
      // Create 5 existing entries
      const existingEntries = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        score: 90 - i * 5,
        subjectId: 'SCI001',
        position: 'for',
        skill: 'easy',
        conversationId: `conv${i + 1}`
      }));

      const leaderboardWithFive = {
        entries: existingEntries
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(leaderboardWithFive));
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['2024-01-01-conversation-conv5.json']);

      await HighScoreManager.addHighScore(
        'newuser',
        95,
        'SCI001',
        'easy',
        'for',
        'conv6'
      );

      // Verify writeFile was called with updated leaderboard
      expect(fs.promises.writeFile).toHaveBeenCalled();
      const savedLeaderboard = JSON.parse((fs.promises.writeFile as jest.Mock).mock.calls[0][1]);
      
      // Check that new score was added and lowest score was removed
      const relevantEntries = savedLeaderboard.entries.filter(
        (entry: any) => entry.subjectId === 'SCI001' && entry.skill === 'easy'
      );
      expect(relevantEntries).toHaveLength(5);
      expect(relevantEntries[0].score).toBe(95); // New highest score
      expect(relevantEntries[4].score).toBe(80); // Previous 4th score

      // Verify old conversation file was deleted
      expect(fs.promises.unlink).toHaveBeenCalled();
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
      
      // Check that new entry was added
      const newEntry = savedLeaderboard.entries.find(
        (entry: any) => entry.subjectId === 'NEW001' && entry.skill === 'medium'
      );
      expect(newEntry).toBeDefined();
      expect(newEntry.username).toBe('firstuser');
      expect(newEntry.score).toBe(85);
    });
  });
});
