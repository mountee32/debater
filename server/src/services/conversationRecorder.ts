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

  private static async ensureLogDir() {
    try {
      console.log('Current directory:', process.cwd());
      console.log('Log directory path:', this.logDir);
      await DiagnosticLogger.log(`[ConversationRecorder] Current directory: ${process.cwd()}`);
      await DiagnosticLogger.log(`[ConversationRecorder] Log directory path: ${this.logDir}`);

      if (!fs.existsSync(this.logDir)) {
        console.log('Creating conversations directory:', this.logDir);
        await DiagnosticLogger.log(`[ConversationRecorder] Creating conversations directory: ${this.logDir}`);
        await fs.promises.mkdir(this.logDir, { recursive: true });
        await DiagnosticLogger.log('[ConversationRecorder] Conversations directory created successfully');
      }

      // Test write permissions
      const testFile = path.join(this.logDir, 'test.txt');
      console.log('Testing write permissions with file:', testFile);
      await fs.promises.writeFile(testFile, 'test');
      await fs.promises.unlink(testFile);
      await DiagnosticLogger.log('[ConversationRecorder] Write permissions verified');
    } catch (error) {
      console.error('Error in ensureLogDir:', error);
      await DiagnosticLogger.error('[ConversationRecorder] Error in ensureLogDir:', error);
      throw error;
    }
  }

  private static getConversationFilePath(): string {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.logDir, `${date}-conversation-${this.currentConversation.id}.json`);
    console.log('Conversation file path:', filePath);
    return filePath;
  }

  private static async saveConversation() {
    try {
      await this.ensureLogDir();
      const filePath = this.getConversationFilePath();
      console.log('Attempting to save conversation to:', filePath);
      await DiagnosticLogger.log(`[ConversationRecorder] Attempting to save conversation to ${filePath}`);
      
      const content = JSON.stringify(this.currentConversation, null, 2);
      console.log('Conversation content:', content.slice(0, 100) + '...');
      await DiagnosticLogger.log(`[ConversationRecorder] Conversation content prepared: ${content.slice(0, 100)}...`);
      
      await fs.promises.writeFile(filePath, content, 'utf8');
      console.log('Successfully saved conversation');
      await DiagnosticLogger.log(`[ConversationRecorder] Successfully saved conversation to ${filePath}`);
    } catch (error) {
      console.error('Error saving conversation:', error);
      await DiagnosticLogger.error('[ConversationRecorder] Error saving conversation:', error);
      throw error;
    }
  }

  static async startNewConversation(gameSetup: GameSetup): Promise<string> {
    try {
      await this.ensureLogDir();
      
      const conversationId = uuidv4().slice(0, 8);
      this.currentConversation = {
        id: conversationId,
        startTime: new Date().toISOString(),
        gameSetup,
        events: []
      };

      console.log('Created new conversation:', this.currentConversation);
      await DiagnosticLogger.log(`[ConversationRecorder] Created new conversation object: ${JSON.stringify(this.currentConversation)}`);
      await this.saveConversation();
      await DiagnosticLogger.log(`[ConversationRecorder] Started new conversation: ${conversationId}`);
      return conversationId;
    } catch (error) {
      console.error('Error starting new conversation:', error);
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
      console.log('Recorded message from:', speakerId);
      await DiagnosticLogger.log(`[ConversationRecorder] Recorded message from ${speakerId}`);
    } catch (error) {
      console.error('Error recording message:', error);
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
      console.log('Recorded score for:', participantId, newScore);
      await DiagnosticLogger.log(`[ConversationRecorder] Recorded score for ${participantId}: ${newScore}`);
    } catch (error) {
      console.error('Error recording score:', error);
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
      
      // Get the final score from events
      const scoreEvents = this.currentConversation.events.filter(
        (event): event is ScoreEvent => event.type === 'score'
      );
      const finalScore = scoreEvents.length > 0 
        ? scoreEvents[scoreEvents.length - 1].newScore 
        : 0;
      
      // Save one last time to ensure we have the end time
      await this.saveConversation();
      
      const conversationId = this.currentConversation.id;
      const { subjectId, position, skill } = this.currentConversation.gameSetup;

      // Check if this is a high score
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
      console.error('Error ending conversation:', error);
      await DiagnosticLogger.error('[ConversationRecorder] Error ending conversation:', error);
      throw error;
    }
  }

  static async getConversation(conversationId: string): Promise<Conversation | null> {
    const startTime = process.hrtime();
    
    try {
      await DiagnosticLogger.log(`[ConversationRecorder] Beginning conversation retrieval for ID: ${conversationId}`);
      
      const files = await fs.promises.readdir(this.logDir);
      await DiagnosticLogger.log(`[ConversationRecorder] Found ${files.length} conversation files`);
      
      const conversationFile = files.find(file => file.includes(`conversation-${conversationId}`));
      
      if (!conversationFile) {
        await DiagnosticLogger.log(`[ConversationRecorder] No conversation found with ID: ${conversationId}`);
        return null;
      }

      const filePath = path.join(this.logDir, conversationFile);
      await DiagnosticLogger.log(`[ConversationRecorder] Reading conversation from: ${filePath}`);
      
      // Get file stats for size information
      const stats = await fs.promises.stat(filePath);
      await DiagnosticLogger.log(`[ConversationRecorder] Conversation file size: ${stats.size} bytes`);

      const content = await fs.promises.readFile(filePath, 'utf8');
      const conversation = JSON.parse(content);

      // Validate conversation structure
      const validationResults = {
        hasId: Boolean(conversation.id),
        hasStartTime: Boolean(conversation.startTime),
        hasGameSetup: Boolean(conversation.gameSetup),
        hasEvents: Array.isArray(conversation.events),
        eventCount: conversation.events?.length || 0,
        messageEvents: conversation.events?.filter((e: ConversationEvent) => e.type === 'message').length || 0,
        scoreEvents: conversation.events?.filter((e: ConversationEvent) => e.type === 'score').length || 0
      };

      await DiagnosticLogger.log('[ConversationRecorder] Conversation validation results:', validationResults);

      // Calculate and log performance metrics
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
      
      await DiagnosticLogger.log(`[ConversationRecorder] Conversation retrieval completed:`, {
        retrievalTimeMs: totalTime,
        fileSizeBytes: stats.size,
        totalEvents: validationResults.eventCount,
        messageCount: validationResults.messageEvents,
        scoreCount: validationResults.scoreEvents
      });

      return conversation;
    } catch (error) {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000;
      
      await DiagnosticLogger.error('[ConversationRecorder] Error reading conversation:', {
        error,
        conversationId,
        retrievalTimeMs: totalTime
      });
      throw error;
    }
  }
}
