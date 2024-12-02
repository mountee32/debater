import express from 'express';
import cors from 'cors';
import debateRoutes from './routes/debateRoutes';
import { env } from './config/env';
import DiagnosticLogger from './utils/diagnosticLogger';

const app = express();

// Starting server initialization
console.log('Starting server initialization...');

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
const port = env.PORT || 3000;
app.listen(port, () => {
  DiagnosticLogger.log('Server running on port ' + port);
  DiagnosticLogger.log('Server configuration', {
    port: port,
    corsOrigin: corsOptions.origin,
    diagnosticLogging: env.ENABLE_DIAGNOSTIC_LOGGING
  });
});
