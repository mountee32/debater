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
  try {
    const { conversationId } = req.params;
    await DiagnosticLogger.log('[DebateRoutes] Fetching replay data:', { conversationId });

    if (!conversationId) {
      const error = 'Missing conversationId';
      await DiagnosticLogger.error('[DebateRoutes] Replay fetch error:', error);
      return res.status(400).json({ error });
    }

    const conversation = await ConversationRecorder.getConversation(conversationId);
    
    if (!conversation) {
      await DiagnosticLogger.log('[DebateRoutes] Replay not found:', { conversationId });
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await DiagnosticLogger.log('[DebateRoutes] Successfully fetched replay data');
    res.json(conversation);
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Replay fetch error:', error);
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
