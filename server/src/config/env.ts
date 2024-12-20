import dotenv from 'dotenv';
import path from 'path';

console.log('Loading environment configuration...');

// Load .env file from project root
const envPath = path.join(__dirname, '../../../.env');
console.log('Loading .env file from:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

interface EnvConfig {
  PORT: number;
  CORS_ORIGIN: string;
  OPENROUTER_API_KEY: string;
  ENABLE_DIAGNOSTIC_LOGGING: boolean;
  API_BASE_URL: string;
  BASE_PATH: string;
}

// Default values
const defaults: EnvConfig = {
  PORT: 3000,
  CORS_ORIGIN: 'http://localhost:5173',
  OPENROUTER_API_KEY: '',
  ENABLE_DIAGNOSTIC_LOGGING: false,
  API_BASE_URL: 'http://localhost:3000/api/debate',
  BASE_PATH: '/data/debater'
};

// Log raw environment variables
console.log('Raw environment variables:', {
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  ENABLE_DIAGNOSTIC_LOGGING: process.env.ENABLE_DIAGNOSTIC_LOGGING,
  BASE_PATH: process.env.BASE_PATH
  // Exclude OPENROUTER_API_KEY and API_BASE_URL for security
});

// Environment variables with validation
export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || String(defaults.PORT)),
  CORS_ORIGIN: process.env.CORS_ORIGIN || defaults.CORS_ORIGIN,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || defaults.OPENROUTER_API_KEY,
  ENABLE_DIAGNOSTIC_LOGGING: process.env.ENABLE_DIAGNOSTIC_LOGGING === 'true' || defaults.ENABLE_DIAGNOSTIC_LOGGING,
  API_BASE_URL: process.env.API_BASE_URL || defaults.API_BASE_URL,
  BASE_PATH: process.env.BASE_PATH || defaults.BASE_PATH
};

// Log processed environment configuration
console.log('Processed environment configuration:', {
  PORT: env.PORT,
  CORS_ORIGIN: env.CORS_ORIGIN,
  ENABLE_DIAGNOSTIC_LOGGING: env.ENABLE_DIAGNOSTIC_LOGGING,
  BASE_PATH: env.BASE_PATH
  // Exclude OPENROUTER_API_KEY and API_BASE_URL for security
});

// Validate required environment variables
const requiredVars: (keyof EnvConfig)[] = ['OPENROUTER_API_KEY', 'BASE_PATH'];
const missingVars = requiredVars.filter(key => !env[key]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Validate PORT is a valid number
if (isNaN(env.PORT) || env.PORT <= 0) {
  throw new Error('PORT must be a positive number');
}

console.log('Environment configuration loaded successfully');
