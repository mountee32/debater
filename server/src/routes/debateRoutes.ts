import { Router } from 'express';
import { OpenRouterService } from '../services/openRouterService';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.use(apiLimiter);

// Generate debate topic
router.post('/topic', async (req, res) => {
  try {
    console.log('Generating topic:', req.body);
    const { category, model } = req.body;
    const topic = await OpenRouterService.generateTopic(category, model);
    console.log('Generated topic:', topic);
    res.json({ topic });
  } catch (error) {
    console.error('Topic generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate topic',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate debate response
router.post('/response', async (req, res) => {
  try {
    console.log('Generating response:', req.body);
    const { topic, position, messages, model } = req.body;
    const response = await OpenRouterService.generateDebateResponse(
      topic,
      position,
      messages,
      model
    );
    console.log('Generated response:', response);
    res.json({ response });
  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate argument
router.post('/evaluate', async (req, res) => {
  try {
    console.log('Evaluating argument:', req.body);
    const { topic, position, argument, model } = req.body;
    const evaluation = await OpenRouterService.evaluateArgument(
      topic,
      position,
      argument,
      model
    );
    console.log('Evaluation result:', evaluation);
    res.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate argument',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate hint
router.post('/hint', async (req, res) => {
  try {
    console.log('Generating hint:', req.body);
    const { topic, position, model } = req.body;
    const hint = await OpenRouterService.generateHint(topic, position, model);
    console.log('Generated hint:', hint);
    res.json({ hint });
  } catch (error) {
    console.error('Hint generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate hint',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Evaluate entire debate
router.post('/evaluate-debate', async (req, res) => {
  try {
    console.log('Evaluating debate:', req.body);
    const { topic, userArguments, position, model } = req.body;
    const evaluation = await OpenRouterService.evaluateDebate(
      topic,
      userArguments,
      position,
      model
    );
    console.log('Debate evaluation result:', evaluation);
    res.json(evaluation);
  } catch (error) {
    console.error('Debate evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate debate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
