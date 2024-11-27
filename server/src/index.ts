import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import debateRoutes from './routes/debateRoutes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });
  next();
});

// Routes
app.use('/api/debate', debateRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    env: {
      NODE_ENV: env.NODE_ENV,
      hasApiKey: !!env.OPENROUTER_API_KEY
    }
  });
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Server error:', {
    error: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Check if error is from OpenRouter API
  if (err.message.includes('OpenRouter API error')) {
    res.status(400).json({
      error: 'OpenRouter API Error',
      message: err.message,
      details: env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      details: env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
  next(err);
};

app.use(errorHandler);

// Start server
const port = env.PORT;
app.listen(port, () => {
  console.log(`Server running on port ${port}`, {
    env: env.NODE_ENV,
    cors: env.CORS_ORIGIN,
    hasApiKey: !!env.OPENROUTER_API_KEY
  });
});

export default app;
