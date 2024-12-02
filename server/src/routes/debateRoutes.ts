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

// Generate debate response
router.post('/response', async (req, res) => {
  try {
    const { topic, position, messages, model, difficulty } = req.body;
    await DiagnosticLogger.log('[DebateRoutes] Generating response:', {
      topic,
      position,
      model,
      difficulty,
      messageCount: messages.length
    });

    if (!topic || !position || !messages || !model || !difficulty) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Response generation error:', error);
      return res.status(400).json({ error });
    }

    const response = await OpenRouterService.generateCompletion(messages, model, difficulty);
    await DiagnosticLogger.log('[DebateRoutes] Generated response:', {
      responseLength: response.length
    });

    res.json({ response });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Response generation error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate hint
router.post('/hint', async (req, res) => {
  try {
    const { topic, position, messages, model, difficulty } = req.body;
    await DiagnosticLogger.log('[DebateRoutes] Generating hint:', {
      topic,
      position,
      model,
      difficulty
    });

    if (!topic || !position || !messages || !model || !difficulty) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Hint generation error:', error);
      return res.status(400).json({ error });
    }

    const hint = await OpenRouterService.generateHint(topic, position, model, difficulty);
    await DiagnosticLogger.log('[DebateRoutes] Generated hint:', {
      hintLength: hint.length
    });

    res.json({ hint });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Hint generation error:', error);
    res.status(500).json({
      error: 'Failed to generate hint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate argument
router.post('/evaluate', async (req, res) => {
  try {
    const { topic, position, messages, currentScores, model, roleToScore, difficulty } = req.body;
    await DiagnosticLogger.log('[DebateRoutes] Evaluating argument:', {
      topic,
      position,
      model,
      roleToScore,
      difficulty
    });

    if (!topic || !position || !messages || !currentScores || !model || !roleToScore || !difficulty) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Evaluation error:', error);
      return res.status(400).json({ error });
    }

    const score = await OpenRouterService.evaluateArgument(
      topic,
      position,
      messages,
      currentScores,
      model,
      roleToScore,
      difficulty
    );

    await DiagnosticLogger.log('[DebateRoutes] Evaluated argument:', { score });
    res.json({ score });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Evaluation error:', error);
    res.status(500).json({
      error: 'Failed to evaluate argument',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Record message
router.post('/record-message', async (req, res) => {
  try {
    const { participantId, message } = req.body;
    await DiagnosticLogger.log('[DebateRoutes] Recording message:', {
      participantId,
      messageLength: message.length
    });

    if (!participantId || !message) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Record message error:', error);
      return res.status(400).json({ error });
    }

    await ConversationRecorder.recordMessage(participantId, message);
    await DiagnosticLogger.log('[DebateRoutes] Recorded message');
    res.json({ success: true });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Record message error:', error);
    res.status(500).json({
      error: 'Failed to record message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Record score
router.post('/record-score', async (req, res) => {
  try {
    const { participantId, score } = req.body;
    await DiagnosticLogger.log('[DebateRoutes] Recording score:', {
      participantId,
      score
    });

    if (!participantId || score === undefined) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Record score error:', error);
      return res.status(400).json({ error });
    }

    await ConversationRecorder.recordScore(participantId, score);
    await DiagnosticLogger.log('[DebateRoutes] Recorded score');
    res.json({ success: true });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Record score error:', error);
    res.status(500).json({
      error: 'Failed to record score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// End conversation
router.post('/end-conversation', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Ending conversation');

    const result = await ConversationRecorder.endConversation();
    await DiagnosticLogger.log('[DebateRoutes] Ended conversation:', result);
    res.json({ isHighScore: result.isHighScore });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] End conversation error:', error);
    res.status(500).json({
      error: 'Failed to end conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add high score
router.post('/add-high-score', async (req, res) => {
  try {
    const { username, score, subjectId, position, skill, conversationId } = req.body;
    await DiagnosticLogger.log('[DebateRoutes] Adding high score:', {
      username,
      score,
      subjectId,
      position,
      skill,
      conversationId
    });

    if (!username || !score || !subjectId || !position || !skill || !conversationId) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Add high score error:', error);
      return res.status(400).json({ error });
    }

    await HighScoreManager.addHighScore(
      username,
      score,
      subjectId,
      skill,
      position,
      conversationId
    );

    await DiagnosticLogger.log('[DebateRoutes] Added high score');
    res.json({ success: true });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Add high score error:', error);
    res.status(500).json({
      error: 'Failed to add high score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
