import { Router } from 'express';
import { OpenRouterService } from '../services/openRouterService';
import { ApiLogger } from '../services/apiLogger';
import DiagnosticLogger from '../utils/diagnosticLogger';
import { ConversationRecorder } from '../services/conversationRecorder';
import { HighScoreManager } from '../services/highScoreManager';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again.'
});

router.use(apiLimiter);

// Get replay data
router.get('/replay/:conversationId', async (req, res) => {
  const startTime = process.hrtime();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { conversationId } = req.params;
    await DiagnosticLogger.log(`[DebateRoutes] [${requestId}] Replay request received:`, {
      conversationId,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      clientIp: req.ip
    });

    // Input validation
    if (!conversationId) {
      const error = 'Missing conversationId';
      await DiagnosticLogger.error(`[DebateRoutes] [${requestId}] Replay validation error:`, error);
      return res.status(400).json({ error });
    }

    if (!/^[a-zA-Z0-9-]+$/.test(conversationId)) {
      const error = 'Invalid conversationId format';
      await DiagnosticLogger.error(`[DebateRoutes] [${requestId}] Replay validation error:`, error);
      return res.status(400).json({ error });
    }

    // Measure conversation retrieval time
    const retrievalStart = process.hrtime();
    const conversation = await ConversationRecorder.getConversation(conversationId);
    const [retrievalSecs, retrievalNanos] = process.hrtime(retrievalStart);
    const retrievalTime = retrievalSecs * 1000 + retrievalNanos / 1000000;

    await DiagnosticLogger.log(`[DebateRoutes] [${requestId}] Conversation retrieval metrics:`, {
      retrievalTimeMs: retrievalTime,
      found: !!conversation
    });
    
    if (!conversation) {
      await DiagnosticLogger.log(`[DebateRoutes] [${requestId}] Replay not found:`, { conversationId });
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Log conversation metrics
    const messageEvents = conversation.events.filter(e => e.type === 'message').length;
    const scoreEvents = conversation.events.filter(e => e.type === 'score').length;
    const conversationDuration = conversation.endTime ? 
      new Date(conversation.endTime).getTime() - new Date(conversation.startTime).getTime() : 
      null;

    await DiagnosticLogger.log(`[DebateRoutes] [${requestId}] Conversation metrics:`, {
      totalEvents: conversation.events.length,
      messageEvents,
      scoreEvents,
      durationMs: conversationDuration,
      topic: conversation.gameSetup.topic,
      difficulty: conversation.gameSetup.difficulty,
      participantCount: conversation.gameSetup.participants.length
    });

    // Calculate response size
    const responseBody = JSON.stringify(conversation);
    const responseSize = Buffer.byteLength(responseBody, 'utf8');

    // Calculate total processing time
    const [totalSecs, totalNanos] = process.hrtime(startTime);
    const totalTime = totalSecs * 1000 + totalNanos / 1000000;

    await DiagnosticLogger.log(`[DebateRoutes] [${requestId}] Replay response metrics:`, {
      responseSizeBytes: responseSize,
      totalProcessingTimeMs: totalTime,
      memoryUsage: process.memoryUsage()
    });

    res.json(conversation);

  } catch (error) {
    const [errorSecs, errorNanos] = process.hrtime(startTime);
    const errorTime = errorSecs * 1000 + errorNanos / 1000000;

    await DiagnosticLogger.error(`[DebateRoutes] [${requestId}] Replay fetch error:`, {
      error,
      timeToErrorMs: errorTime,
      memoryUsage: process.memoryUsage()
    });

    res.status(500).json({
      error: 'Failed to fetch replay data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start new conversation
router.post('/start-conversation', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Starting new conversation:', req.body);
    const { topic, difficulty, participants, subjectId, position, skill } = req.body;

    if (!topic || !difficulty || !participants || !subjectId || !position || !skill) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Start conversation error:', error);
      return res.status(400).json({ error });
    }

    const conversationId = await ConversationRecorder.startNewConversation({
      topic,
      difficulty,
      participants,
      subjectId,
      position,
      skill
    });

    await DiagnosticLogger.log('[DebateRoutes] Started conversation:', { conversationId });
    res.json({ conversationId });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Start conversation error:', error);
    res.status(500).json({
      error: 'Failed to start conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ... (keep all other existing routes the same) ...

export default router;
