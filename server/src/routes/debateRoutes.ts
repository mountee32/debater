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

// Record message
router.post('/record-message', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Recording message:', req.body);
    const { conversationId, participantId, message } = req.body;

    if (!conversationId || !participantId || !message) {
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
    await DiagnosticLogger.log('[DebateRoutes] Recording score:', req.body);
    const { conversationId, participantId, score } = req.body;

    if (!conversationId || !participantId || score === undefined) {
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
    await DiagnosticLogger.log('[DebateRoutes] Ending conversation:', req.body);
    const { conversationId } = req.body;

    if (!conversationId) {
      const error = 'Missing conversationId';
      await DiagnosticLogger.error('[DebateRoutes] End conversation error:', error);
      return res.status(400).json({ error });
    }

    const result = await ConversationRecorder.endConversation();
    await DiagnosticLogger.log('[DebateRoutes] Ended conversation:', result);
    res.json(result);
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
    await DiagnosticLogger.log('[DebateRoutes] Adding high score:', req.body);
    const { username, score, subjectId, position, skill, conversationId } = req.body;

    if (!username || score === undefined || !subjectId || !position || !skill || !conversationId) {
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

// Test logging endpoint
router.post('/test-log', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Testing logger');
    const requestId = await ApiLogger.logRequest('test-endpoint', 'POST', {
      model: 'test-model',
      messages: [{ role: 'system', content: 'Test message' }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    await ApiLogger.logResponse(requestId, 'test-endpoint', 'POST', {
      status: 200,
      data: {
        choices: [{ message: { content: 'Test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      }
    });

    res.json({ success: true, requestId });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Logger test error:', error);
    res.status(500).json({ error: 'Logger test failed' });
  }
});

// Generate debate topic
router.post('/topic', async (req, res) => {
  try {
    // Start new logging session for new debate
    ApiLogger.startNewSession();
    
    await DiagnosticLogger.log('[DebateRoutes] Generating topic:', req.body);
    const { category, model } = req.body;
    
    if (!category || !model) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Topic generation error:', { category, model });
      return res.status(400).json({ error });
    }

    const topic = await OpenRouterService.generateTopic(category, model);
    await DiagnosticLogger.log('[DebateRoutes] Generated topic:', { topic });
    res.json({ topic });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Topic generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate topic',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate debate response
router.post('/response', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Generating response:', req.body);
    const { topic, position, messages, model, difficulty } = req.body;

    if (!model) {
      const error = 'Missing required model parameter';
      await DiagnosticLogger.error('[DebateRoutes] Response generation error:', error);
      return res.status(400).json({ error });
    }

    const response = await OpenRouterService.generateCompletion(
      messages,
      model,
      difficulty || 'medium'
    );
    await DiagnosticLogger.log('[DebateRoutes] Generated response:', { response });
    res.json({ response });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Response generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate argument
router.post('/evaluate', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Evaluating argument request:', req.body);
    const { topic, position, messages, currentScores, model, roleToScore, difficulty } = req.body;
    
    if (!topic || !position || !messages || !currentScores || !model || !roleToScore) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Evaluation error - missing fields:', { 
        topic, position, messages, currentScores, model, roleToScore 
      });
      return res.status(400).json({ error });
    }

    await DiagnosticLogger.log('[DebateRoutes] Starting evaluation with:', {
      topic,
      position,
      messagesCount: messages.length,
      currentScores,
      model,
      roleToScore,
      difficulty
    });

    const score = await OpenRouterService.evaluateArgument(
      topic,
      position,
      messages,
      currentScores,
      model,
      roleToScore,
      difficulty || 'medium'
    );

    await DiagnosticLogger.log('[DebateRoutes] Evaluation result:', { score });
    res.json({ score });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate argument',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate hint
router.post('/hint', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Generating hint:', req.body);
    const { topic, position, model, difficulty } = req.body;

    if (!model) {
      const error = 'Missing required model parameter';
      await DiagnosticLogger.error('[DebateRoutes] Hint generation error:', error);
      return res.status(400).json({ error });
    }

    const hint = await OpenRouterService.generateHint(
      topic, 
      position, 
      model,
      difficulty || 'medium'
    );
    await DiagnosticLogger.log('[DebateRoutes] Generated hint:', { hint });
    res.json({ hint });
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Hint generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate hint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
