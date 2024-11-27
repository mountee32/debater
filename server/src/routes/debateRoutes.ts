import { Router } from 'express';
import { OpenRouterService } from '../services/openRouterService';
import { ApiLogger } from '../services/apiLogger';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.use(apiLimiter);

// Test logging endpoint
router.post('/test-log', async (req, res) => {
  try {
    console.log('[DebateRoutes] Testing logger');
    const requestId = await ApiLogger.logRequest('test-endpoint', 'POST', {
      test: 'data',
      timestamp: new Date().toISOString()
    });
    
    await ApiLogger.logResponse(requestId, 'test-endpoint', 'POST', {
      result: 'success',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, requestId });
  } catch (error) {
    console.error('[DebateRoutes] Logger test error:', error);
    res.status(500).json({ error: 'Logger test failed' });
  }
});

// Generate debate topic
router.post('/topic', async (req, res) => {
  try {
    console.log('[DebateRoutes] Generating topic:', req.body);
    const { category, model } = req.body;
    
    if (!category || !model) {
      console.error('[DebateRoutes] Missing required fields:', { category, model });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[DebateRoutes] Calling OpenRouterService.generateTopic');
    const topic = await OpenRouterService.generateTopic(category, model);
    console.log('[DebateRoutes] Generated topic:', topic);
    res.json({ topic });
  } catch (error) {
    console.error('[DebateRoutes] Topic generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate topic',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate debate response
router.post('/response', async (req, res) => {
  try {
    console.log('[DebateRoutes] Generating response:', req.body);
    const { topic, position, messages, model } = req.body;
    const response = await OpenRouterService.generateDebateResponse(
      topic,
      position,
      messages,
      model
    );
    console.log('[DebateRoutes] Generated response:', response);
    res.json({ response });
  } catch (error) {
    console.error('[DebateRoutes] Response generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate argument
router.post('/evaluate', async (req, res) => {
  try {
    console.log('[DebateRoutes] Evaluating argument:', req.body);
    const { topic, position, argument, model } = req.body;
    const evaluation = await OpenRouterService.evaluateArgument(
      topic,
      position,
      argument,
      model
    );
    console.log('[DebateRoutes] Evaluation result:', evaluation);
    res.json(evaluation);
  } catch (error) {
    console.error('[DebateRoutes] Evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate argument',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate hint
router.post('/hint', async (req, res) => {
  try {
    console.log('[DebateRoutes] Generating hint:', req.body);
    const { topic, position, model } = req.body;
    const hint = await OpenRouterService.generateHint(topic, position, model);
    console.log('[DebateRoutes] Generated hint:', hint);
    res.json({ hint });
  } catch (error) {
    console.error('[DebateRoutes] Hint generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate hint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate entire debate
router.post('/evaluate-debate', async (req, res) => {
  try {
    console.log('[DebateRoutes] Evaluating debate:', req.body);
    const { topic, userArguments, position, model } = req.body;
    const evaluation = await OpenRouterService.evaluateDebate(
      topic,
      userArguments,
      position,
      model
    );
    console.log('[DebateRoutes] Debate evaluation result:', evaluation);
    res.json(evaluation);
  } catch (error) {
    console.error('[DebateRoutes] Debate evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate debate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
