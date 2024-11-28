import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import debateRoutes from './routes/debateRoutes';
import DiagnosticLogger from './utils/diagnosticLogger';

const app = express();

// Initialize diagnostic logging synchronously before anything else
console.log('Starting server initialization...');
DiagnosticLogger.initialize();

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Log middleware setup
DiagnosticLogger.log('Middleware configured', {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Routes
app.use('/api/debate', debateRoutes);
DiagnosticLogger.log('Routes configured', {
  endpoints: ['/api/debate']
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  DiagnosticLogger.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Test diagnostic logging
DiagnosticLogger.log('Testing diagnostic logger', {
  test: 'This is a test log entry',
  timestamp: new Date().toISOString()
});

// Start server
const server = app.listen(env.PORT, () => {
  const startupMessage = `Server running on port ${env.PORT}`;
  console.log(startupMessage);
  DiagnosticLogger.log(startupMessage);
  
  // Log server configuration
  DiagnosticLogger.log('Server configuration', {
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    diagnosticLogging: env.ENABLE_DIAGNOSTIC_LOGGING,
    nodeEnv: process.env.NODE_ENV
  });
});

// Handle server shutdown
process.on('SIGTERM', () => {
  DiagnosticLogger.log('Received SIGTERM signal, shutting down gracefully');
  server.close(() => {
    DiagnosticLogger.log('Server shutdown complete');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  DiagnosticLogger.error('Uncaught exception:', error);
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  DiagnosticLogger.error('Unhandled rejection:', { reason, promise });
  console.error('Unhandled rejection:', reason);
});
