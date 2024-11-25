import type { AxiosResponse, AxiosError } from 'axios';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error';
  message: string;
  data?: any;
}

interface APILogEntry extends LogEntry {
  method: string;
  url: string;
  requestData?: any;
  responseData?: any;
  status?: number;
  duration: number;
}

const logs: LogEntry[] = [];

export const log = (message: string, data?: any) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    data
  };
  
  logs.push(entry);
  console.log(`[${entry.timestamp}] ${message}`, data || '');
};

export const error = (message: string, data?: any) => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    data
  };
  
  logs.push(entry);
  console.error(`[${entry.timestamp}] ERROR: ${message}`, data || '');
};

export const getLogs = () => {
  return [...logs];
};

export const clearLogs = () => {
  logs.length = 0;
};

interface APILogOptions {
  method?: string;
  requestData?: any;
}

export const withAPILogging = async <T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  description: string,
  options?: APILogOptions
): Promise<T> => {
  const startTime = Date.now();
  let logEntry: APILogEntry;

  try {
    const response = await apiCall();
    const duration = Date.now() - startTime;

    logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `API Call: ${description}`,
      method: options?.method || response.config.method?.toUpperCase() || 'UNKNOWN',
      url: response.config.url || 'UNKNOWN',
      requestData: options?.requestData || response.config.data,
      responseData: response.data,
      status: response.status,
      duration
    };

    logs.push(logEntry);
    console.log(`[${logEntry.timestamp}] ${description} - Success`, logEntry);

    return response.data;
  } catch (err) {
    const duration = Date.now() - startTime;
    const axiosError = err as AxiosError;

    logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `API Error: ${description}`,
      method: options?.method || axiosError.config?.method?.toUpperCase() || 'UNKNOWN',
      url: axiosError.config?.url || 'UNKNOWN',
      requestData: options?.requestData || axiosError.config?.data,
      responseData: axiosError.response?.data,
      status: axiosError.response?.status,
      duration
    };

    logs.push(logEntry);
    console.error(`[${logEntry.timestamp}] ${description} - Error`, logEntry);

    throw err;
  }
};
