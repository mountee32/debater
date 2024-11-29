import { Router } from 'express';
import { OpenRouterService } from '../services/openRouterService';
import { ApiLogger } from '../services/apiLogger';
import DiagnosticLogger from '../utils/diagnosticLogger';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again.'
});

router.use(apiLimiter);

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
    const { topic, position, messages, model } = req.body;
    const response = await OpenRouterService.generateCompletion(
      messages,
      model
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
    const { topic, position, messages, currentScores, model, roleToScore } = req.body;
    
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
      roleToScore
    });

    const score = await OpenRouterService.evaluateArgument(
      topic,
      position,
      messages,
      currentScores,
      model,
      roleToScore
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
    const { topic, position, model } = req.body;
    const hint = await OpenRouterService.generateHint(topic, position, model);
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

// Evaluate entire debate
router.post('/evaluate-debate', async (req, res) => {
  try {
    await DiagnosticLogger.log('[DebateRoutes] Evaluating debate:', req.body);
    const { topic, userArguments, position, model } = req.body;
    
    if (!topic || !userArguments || !position) {
      const error = 'Missing required fields';
      await DiagnosticLogger.error('[DebateRoutes] Debate evaluation error - missing fields:', {
        topic, userArguments, position
      });
      return res.status(400).json({ error });
    }

    const evaluation = await OpenRouterService.evaluateDebate(
      topic,
      userArguments,
      position,
      model || 'openai/gpt-3.5-turbo' // Default model if not provided
    );
    
    await DiagnosticLogger.log('[DebateRoutes] Debate evaluation result:', evaluation);
    res.json(evaluation);
  } catch (error) {
    await DiagnosticLogger.error('[DebateRoutes] Debate evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate debate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
