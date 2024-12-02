import express from 'express';
import cors from 'cors';
import debateRoutes from './routes/debateRoutes';
import { env } from './config/env';
import DiagnosticLogger from './utils/diagnosticLogger';

// Load environment configuration first
console.log('Loading environment configuration...');
const envConfig = env;
console.log('Environment loaded:', {
  ENABLE_DIAGNOSTIC_LOGGING: envConfig.ENABLE_DIAGNOSTIC_LOGGING
});

const app = express();

// Initialize diagnostic logging after environment is loaded
DiagnosticLogger.initialize();

// Starting server initialization
DiagnosticLogger.log('Starting server initialization...');

// Configure CORS to allow multiple frontend ports
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));

// Log middleware configuration
DiagnosticLogger.log('Middleware configured', {
  cors: corsOptions
});

// Configure JSON parsing
app.use(express.json());

// Configure routes
app.use('/api/debate', debateRoutes);

// Log route configuration
DiagnosticLogger.log('Routes configured', {
  endpoints: ['/api/debate']
});

// Test logging
DiagnosticLogger.log('Testing diagnostic logger', {
  test: 'This is a test log entry',
  timestamp: new Date().toISOString()
});

// Start server
const port = envConfig.PORT || 3000;

// Check if port is in use before starting
const server = app.listen(port, () => {
  DiagnosticLogger.log('Server running on port ' + port);
  DiagnosticLogger.log('Server configuration', {
    port: port,
    corsOrigin: corsOptions.origin,
    diagnosticLogging: envConfig.ENABLE_DIAGNOSTIC_LOGGING
  });
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    DiagnosticLogger.error('Port already in use:', error);
    console.error(`Port ${port} is already in use. Please kill the existing process or use a different port.`);
    process.exit(1);
  } else {
    DiagnosticLogger.error('Server startup error:', error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});
