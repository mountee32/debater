import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import DiagnosticLogger from '../utils/diagnosticLogger';
import { HighScoreManager } from './highScoreManager';

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
  private static logDir = path.resolve('/home/vscode/debater/server/logs/conversations');
  private static currentConversation: Conversation | null = null;
  private static saveLock: { [key: string]: boolean } = {};

  private static async ensureLogDir() {
    try {
      await DiagnosticLogger.log(`[ConversationRecorder] Current directory: ${process.cwd()}`);
      await DiagnosticLogger.log(`[ConversationRecorder] Log directory path: ${this.logDir}`);

      if (!fs.existsSync(this.logDir)) {
        await DiagnosticLogger.log(`[ConversationRecorder] Creating conversations directory: ${this.logDir}`);
        await fs.promises.mkdir(this.logDir, { recursive: true });
        await DiagnosticLogger.log('[ConversationRecorder] Conversations directory created successfully');
      }
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error in ensureLogDir:', error);
      throw error;
    }
  }

  private static getConversationFilePath(conversationId: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${date}-conversation-${conversationId}.json`);
  }

  private static async acquireLock(filePath: string): Promise<void> {
    while (this.saveLock[filePath]) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    this.saveLock[filePath] = true;
  }

  private static releaseLock(filePath: string): void {
    this.saveLock[filePath] = false;
  }

  private static async generateUniqueId(): Promise<string> {
    let id = uuidv4().slice(0, 8);
    let filePath = this.getConversationFilePath(id);
    
    if (fs.existsSync(filePath)) {
      await DiagnosticLogger.log(`[ConversationRecorder] File exists for ID ${id}, generating new ID`);
      // Get a new UUID and try again
      id = uuidv4().slice(0, 8);
      filePath = this.getConversationFilePath(id);
      
      if (fs.existsSync(filePath)) {
        throw new Error('Failed to generate unique conversation ID after retry');
      }
    }
    
    await DiagnosticLogger.log(`[ConversationRecorder] Generated unique ID: ${id}`);
    return id;
  }

  private static async saveConversation() {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    const filePath = this.getConversationFilePath(this.currentConversation.id);
    await this.acquireLock(filePath);

    try {
      await this.ensureLogDir();
      await DiagnosticLogger.log(`[ConversationRecorder] Saving conversation to ${filePath}`);
      
      const content = JSON.stringify(this.currentConversation, null, 2);
      await fs.promises.writeFile(filePath, content, 'utf8');
      await DiagnosticLogger.log(`[ConversationRecorder] Successfully saved conversation to ${filePath}`);
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error saving conversation:', error);
      throw error;
    } finally {
      this.releaseLock(filePath);
    }
  }

  static async startNewConversation(gameSetup: GameSetup): Promise<string> {
    try {
      await this.ensureLogDir();
      
      const conversationId = await this.generateUniqueId();
      await DiagnosticLogger.log(`[ConversationRecorder] Starting new conversation with ID: ${conversationId}`);

      this.currentConversation = {
        id: conversationId,
        startTime: new Date().toISOString(),
        gameSetup,
        events: []
      };

      await this.saveConversation();
      return conversationId;
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error starting new conversation:', error);
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
      await this.saveConversation();
      await DiagnosticLogger.log(`[ConversationRecorder] Recorded message from ${speakerId}`);
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error recording message:', error);
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
      await this.saveConversation();
      await DiagnosticLogger.log(`[ConversationRecorder] Recorded score for ${participantId}: ${newScore}`);
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error recording score:', error);
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
      
      await this.saveConversation();
      
      const conversationId = this.currentConversation.id;
      const { subjectId, position, skill } = this.currentConversation.gameSetup;

      const isHighScore = await HighScoreManager.checkAndUpdateHighScore(
        finalScore,
        subjectId,
        skill,
        position,
        conversationId
      );

      this.currentConversation = null;
      
      return { conversationId, isHighScore };
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error ending conversation:', error);
      throw error;
    }
  }

  static async getConversation(conversationId: string): Promise<Conversation | null> {
    const startTime = process.hrtime();
    
    try {
      await DiagnosticLogger.log(`[ConversationRecorder] Beginning conversation retrieval for ID: ${conversationId}`);
      
      const files = await fs.promises.readdir(this.logDir);
      const conversationFile = files.find(file => file.includes(`conversation-${conversationId}`));
      
      if (!conversationFile) {
        await DiagnosticLogger.log(`[ConversationRecorder] No conversation found with ID: ${conversationId}`);
        return null;
      }

      const filePath = path.join(this.logDir, conversationFile);
      await this.acquireLock(filePath);

      try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const totalTime = seconds * 1000 + nanoseconds / 1000000;
        
        await DiagnosticLogger.log(`[ConversationRecorder] Successfully retrieved conversation:`, {
          conversationId,
          retrievalTimeMs: totalTime,
          eventCount: conversation.events?.length || 0
        });

        return conversation;
      } finally {
        this.releaseLock(filePath);
      }
    } catch (error) {
      await DiagnosticLogger.error('[ConversationRecorder] Error reading conversation:', error);
      throw error;
    }
  }
}
