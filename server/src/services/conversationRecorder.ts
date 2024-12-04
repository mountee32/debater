import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import DiagnosticLogger from '../utils/diagnosticLogger';
import { HighScoreManager } from './highScoreManager';
import { env } from '../config/env';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'debater' | 'judge';
}

interface GameSetup {
  topic: string;
  difficulty: number;
  participants: Participant[];
  subjectId: string;
  position: 'for' | 'against';
  skill: 'easy' | 'medium' | 'hard';
}

type EventType = 'message' | 'score';

interface BaseEvent {
  type: EventType;
  timestamp: string;
}

interface MessageEvent extends BaseEvent {
  type: 'message';
  speakerId: string;
  content: string;
}

interface ScoreEvent extends BaseEvent {
  type: 'score';
  participantId: string;
  newScore: number;
}

type ConversationEvent = MessageEvent | ScoreEvent;

interface Conversation {
  id: string;
  startTime: string;
  endTime?: string;
  gameSetup: GameSetup;
  events: ConversationEvent[];
}

export class ConversationRecorder {
  private static logDir = path.join(env.BASE_PATH, 'server/logs/conversations');
  private static currentConversation: Conversation | null = null;

  private static async ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        await fs.promises.mkdir(this.logDir, { recursive: true });
        await DiagnosticLogger.log('[ConversationRecorder] Conversations directory created successfully');
      }
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error in ensureLogDir:', error);
      throw error;
    }
  }

  private static getConversationFilePath(conversationId: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${date}-conversation-${conversationId}.json`);
  }

  private static async saveConversationToDisk(): Promise<void> {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    try {
      await this.ensureLogDir();
      const filePath = this.getConversationFilePath(this.currentConversation.id);
      await DiagnosticLogger.log(`[ConversationRecorder] Saving conversation to ${filePath}`);
      
      const content = JSON.stringify(this.currentConversation, null, 2);
      await fs.promises.writeFile(filePath, content, 'utf8');
      await DiagnosticLogger.log(`[ConversationRecorder] Successfully saved conversation to ${filePath}`);
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error saving conversation:', error);
      throw error;
    }
  }

  static async startNewConversation(gameSetup: GameSetup): Promise<string> {
    try {
      const conversationId = uuidv4().slice(0, 8);
      await DiagnosticLogger.log(`[ConversationRecorder] Starting new conversation with ID: ${conversationId}`);

      this.currentConversation = {
        id: conversationId,
        startTime: new Date().toISOString(),
        gameSetup,
        events: []
      };

      return conversationId;
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error starting new conversation:', error);
      throw error;
    }
  }

  static async recordMessage(speakerId: string, content: string) {
    try {
      if (!this.currentConversation) {
        throw new Error('No active conversation');
      }

      const messageEvent: MessageEvent = {
        type: 'message',
        timestamp: new Date().toISOString(),
        speakerId,
        content
      };

      this.currentConversation.events.push(messageEvent);
      await DiagnosticLogger.log(`[ConversationRecorder] Recorded message from ${speakerId}`);
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error recording message:', error);
      throw error;
    }
  }

  static async recordScore(participantId: string, newScore: number) {
    try {
      if (!this.currentConversation) {
        throw new Error('No active conversation');
      }

      const scoreEvent: ScoreEvent = {
        type: 'score',
        timestamp: new Date().toISOString(),
        participantId,
        newScore
      };

      this.currentConversation.events.push(scoreEvent);
      await DiagnosticLogger.log(`[ConversationRecorder] Recorded score for ${participantId}: ${newScore}`);
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error recording score:', error);
      throw error;
    }
  }

  static async endConversation(): Promise<{ conversationId: string; isHighScore: boolean }> {
    try {
      if (!this.currentConversation) {
        throw new Error('No active conversation');
      }

      this.currentConversation.endTime = new Date().toISOString();
      
      const scoreEvents = this.currentConversation.events.filter(
        (event): event is ScoreEvent => event.type === 'score'
      );
      const finalScore = scoreEvents.length > 0 
        ? scoreEvents[scoreEvents.length - 1].newScore 
        : 0;
      
      const { subjectId, position, skill } = this.currentConversation.gameSetup;
      const conversationId = this.currentConversation.id;

      // Check if this is a high score before saving to disk
      const isHighScore = await HighScoreManager.checkAndUpdateHighScore(
        finalScore,
        subjectId,
        skill,
        position,
        conversationId
      );

      // Only save to disk if it's a high score
      if (isHighScore) {
        await this.saveConversationToDisk();
      }

      // Clear the conversation from memory
      const result = { conversationId, isHighScore };
      this.currentConversation = null;
      return result;
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error ending conversation:', error);
      throw error;
    }
  }

  static async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      // If this is the current conversation in memory, return it
      if (this.currentConversation?.id === conversationId) {
        return this.currentConversation;
      }

      // Otherwise, look for it on disk
      const files = await fs.promises.readdir(this.logDir);
      const conversationFile = files.find(file => file.includes(`conversation-${conversationId}`));
      
      if (!conversationFile) {
        await DiagnosticLogger.log(`[ConversationRecorder] No conversation found with ID: ${conversationId}`);
        return null;
      }

      const filePath = path.join(this.logDir, conversationFile);
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      let conversation: Conversation;
      try {
        conversation = JSON.parse(content);
      } catch (error) {
        await DiagnosticLogger.log(`[ConversationRecorder] Error parsing conversation JSON: ${error}`);
        throw new SyntaxError(`Invalid JSON in conversation file: ${error instanceof Error ? error.message : String(error)}`);
      }

      await DiagnosticLogger.log(`[ConversationRecorder] Successfully retrieved conversation: ${conversationId}`);
      return conversation;
    } catch (error) {
      await DiagnosticLogger.log('[ConversationRecorder] Error reading conversation:', error);
      throw error;
    }
  }
}
