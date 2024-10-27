import axios from 'axios';

interface APILog {
  timestamp: string;
  endpoint: string;
  method: string;
  requestData: any;
  responseData?: any;
  error?: any;
  duration: number;
}

const API_LOGS_FILE = 'api_logs.json';
const LOCAL_JSON_SERVER = 'http://localhost:3001/logs';

function getTimestamp(): string {
  return new Date().toISOString();
}

export function log(message: string): void {
  const timestamp = getTimestamp();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
}

export function clearLog(): void {
  console.clear();
}

export async function logAPICall(
  endpoint: string,
  method: string,
  requestData: any,
  startTime: number,
  responseData?: any,
  error?: any
): Promise<void> {
  const endTime = Date.now();
  const duration = endTime - startTime;

  const logEntry: APILog = {
    timestamp: getTimestamp(),
    endpoint,
    method,
    requestData,
    responseData,
    error: error ? {
      message: error.message,
      stack: error.stack
    } : undefined,
    duration
  };

  try {
    // Send log to local JSON server
    await axios.post(LOCAL_JSON_SERVER, logEntry);
    console.log(`API call logged: ${endpoint}`);
  } catch (err) {
    console.error('Failed to save API log:', err);
    // Fallback to console logging if JSON server is unavailable
    console.log('API Log:', logEntry);
  }
}

// Helper function to wrap API calls with logging
export function withAPILogging<T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string,
  requestData: any
): Promise<T> {
  const startTime = Date.now();

  return apiCall()
    .then((response) => {
      logAPICall(endpoint, method, requestData, startTime, response);
      return response;
    })
    .catch((error) => {
      logAPICall(endpoint, method, requestData, startTime, undefined, error);
      throw error;
    });
}
