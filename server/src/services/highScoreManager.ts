import fs from 'fs';
import path from 'path';
import DiagnosticLogger from '../utils/diagnosticLogger';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  subjectId: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
  conversationId?: string;
}

interface Leaderboard {
  entries: LeaderboardEntry[];
}

export class HighScoreManager {
  private static readonly LEADERBOARD_PATH = path.resolve('/home/vscode/debater/src/data/leaderboard.json');
  private static readonly MAX_ENTRIES_PER_SUBJECT_SKILL = 5;

  private static async readLeaderboard(): Promise<Leaderboard> {
    try {
      const content = await fs.promises.readFile(this.LEADERBOARD_PATH, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading leaderboard:', error);
      await DiagnosticLogger.error('[HighScoreManager] Error reading leaderboard:', error);
      throw error;
    }
  }

  private static async writeLeaderboard(leaderboard: Leaderboard): Promise<void> {
    try {
      const content = JSON.stringify(leaderboard, null, 2);
      await fs.promises.writeFile(this.LEADERBOARD_PATH, content, 'utf8');
    } catch (error) {
      console.error('Error writing leaderboard:', error);
      await DiagnosticLogger.error('[HighScoreManager] Error writing leaderboard:', error);
      throw error;
    }
  }

  private static async deleteConversationFile(conversationId: string): Promise<void> {
    try {
      const conversationsDir = path.resolve('/home/vscode/debater/server/logs/conversations');
      const files = await fs.promises.readdir(conversationsDir);
      const conversationFile = files.find(file => file.includes(`conversation-${conversationId}`));
      
      if (conversationFile) {
        const filePath = path.join(conversationsDir, conversationFile);
        await fs.promises.unlink(filePath);
        await DiagnosticLogger.log(`[HighScoreManager] Deleted conversation file: ${filePath}`);
      }
    } catch (error) {
      console.error('Error deleting conversation file:', error);
      await DiagnosticLogger.error('[HighScoreManager] Error deleting conversation file:', error);
      throw error;
    }
  }

  static async checkAndUpdateHighScore(
    score: number,
    subjectId: string,
    skill: 'easy' | 'medium' | 'hard',
    position: 'for' | 'against',
    conversationId: string
  ): Promise<boolean> {
    try {
      const leaderboard = await this.readLeaderboard();

      // Get entries for this subject and skill level
      const relevantEntries = leaderboard.entries.filter(
        entry => entry.subjectId === subjectId && entry.skill === skill
      );

      // Sort by score descending
      relevantEntries.sort((a, b) => b.score - a.score);

      // Check if score makes top 5
      if (relevantEntries.length < this.MAX_ENTRIES_PER_SUBJECT_SKILL || 
          score > relevantEntries[this.MAX_ENTRIES_PER_SUBJECT_SKILL - 1]?.score) {
        
        // Return true to indicate we need a username for the high score
        return true;
      }

      // Score didn't make the cut, delete the conversation file
      await this.deleteConversationFile(conversationId);
      return false;
    } catch (error) {
      console.error('Error checking high score:', error);
      await DiagnosticLogger.error('[HighScoreManager] Error checking high score:', error);
      throw error;
    }
  }

  static async addHighScore(
    username: string,
    score: number,
    subjectId: string,
    skill: 'easy' | 'medium' | 'hard',
    position: 'for' | 'against',
    conversationId: string
  ): Promise<void> {
    try {
      const leaderboard = await this.readLeaderboard();

      // Get entries for this subject and skill level
      const relevantEntries = leaderboard.entries.filter(
        entry => entry.subjectId === subjectId && entry.skill === skill
      );

      // Add new entry
      const newEntry: LeaderboardEntry = {
        id: Math.max(0, ...leaderboard.entries.map(e => e.id)) + 1,
        username,
        score,
        subjectId,
        position,
        skill,
        conversationId
      };

      // Add new entry and sort
      relevantEntries.push(newEntry);
      relevantEntries.sort((a, b) => b.score - a.score);

      // If we now have more than MAX_ENTRIES, remove excess and their conversation files
      if (relevantEntries.length > this.MAX_ENTRIES_PER_SUBJECT_SKILL) {
        const removedEntries = relevantEntries.slice(this.MAX_ENTRIES_PER_SUBJECT_SKILL);
        for (const entry of removedEntries) {
          if (entry.conversationId) {
            await this.deleteConversationFile(entry.conversationId);
          }
        }
      }

      // Update main leaderboard: remove all entries for this subject/skill and add top 5
      leaderboard.entries = [
        ...leaderboard.entries.filter(
          entry => entry.subjectId !== subjectId || entry.skill !== skill
        ),
        ...relevantEntries.slice(0, this.MAX_ENTRIES_PER_SUBJECT_SKILL)
      ];

      await this.writeLeaderboard(leaderboard);
      await DiagnosticLogger.log(`[HighScoreManager] Added new high score for ${username}`);
    } catch (error) {
      console.error('Error adding high score:', error);
      await DiagnosticLogger.error('[HighScoreManager] Error adding high score:', error);
      throw error;
    }
  }
}
