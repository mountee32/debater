import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

type FunctionType = 'debate_message' | 'message_scoring' | 'hint_generation' | 'final_round_scoring';

interface Message {
  role: string;
  content: string;
}

interface Headers {
  'Content-Type': string;
  'Authorization': string;
  'HTTP-Referer': string;
  'X-Title': string;
  [key: string]: string;
}

interface ApiRequestData {
  model: string;
  messages: Message[];
  temperature: number;
  max_tokens: number;
  headers?: Headers;
}

interface ApiResponseData {
  status: number;
  content: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface ApiLog {
  timestamp: string;
  requestId: string;
  type: 'request' | 'response';
  endpoint: string;
  method: string;
  functionType: FunctionType;
  data: ApiRequestData | ApiResponseData;
}

export class ApiLogger {
  private static logDir = process.env.NODE_ENV === 'test' 
    ? path.join(process.cwd(), 'logs')
    : path.join('/home/vscode/debater/server/logs');
  private static currentSessionId: string = '';
  private static logs: ApiLog[] = [];

  private static ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        console.log(`[ApiLogger] Creating log directory: ${this.logDir}`);
        fs.mkdirSync(this.logDir, { recursive: true });
        console.log('[ApiLogger] Log directory created successfully');
      }
    } catch (error) {
      console.error('[ApiLogger] Error creating log directory:', error);
      throw error;
    }
  }

  private static getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `api-${date}-session-${this.currentSessionId}.json`);
  }

  private static determineFunctionType(data: ApiRequestData): FunctionType {
    if (!data.messages || !Array.isArray(data.messages)) {
      return 'debate_message';
    }

    const systemMessage = data.messages.find((m: Message) => m.role === 'system')?.content || '';
    
    if (systemMessage.includes('Score the latest player message') || systemMessage.includes('Current scores')) {
      return 'message_scoring';
    }
    if (systemMessage.includes('Generate a hint') || systemMessage.includes('Generate a direct, concise argument')) {
      return 'hint_generation';
    }
    if (systemMessage.includes('final score') || systemMessage.includes('Rate the overall debate') || systemMessage.includes('Evaluate the debate performance')) {
      return 'final_round_scoring';
    }
    return 'debate_message';
  }

  private static async writeLog(log: ApiLog) {
    try {
      this.ensureLogDir();
      const logFile = this.getLogFilePath();
      console.log(`[ApiLogger] Writing ${log.type} log to ${logFile}`);
      
      // Add log to array
      this.logs.push(log);
      
      // Write entire array to file
      await fs.promises.writeFile(
        logFile,
        JSON.stringify(this.logs, null, 2),
        'utf8'
      );
      
      console.log(`[ApiLogger] Successfully logged ${log.type}`);
    } catch (error) {
      console.error('[ApiLogger] Error writing log:', error);
      throw error;
    }
  }

  private static cleanResponse(data: any): ApiResponseData {
    if (!data) {
      return {
        status: 500,
        content: '',
        usage: {}
      };
    }
    
    return {
      status: data.status,
      content: data.data?.choices?.[0]?.message?.content || data.data?.choices?.[0]?.text || '',
      usage: {
        prompt_tokens: data.data?.usage?.prompt_tokens,
        completion_tokens: data.data?.usage?.completion_tokens,
        total_tokens: data.data?.usage?.total_tokens
      }
    };
  }

  static startNewSession() {
    this.currentSessionId = uuidv4().slice(0, 8); // Use first 8 characters of UUID for shorter filenames
    this.logs = []; // Clear in-memory logs for new session
    this.ensureLogDir(); // Ensure log directory exists when starting new session
    console.log(`[ApiLogger] Started new session: ${this.currentSessionId}`);
  }

  static async logRequest(endpoint: string, method: string, data: ApiRequestData): Promise<string> {
    console.log('[ApiLogger] Logging request...');
    
    // Start new session if none exists
    if (!this.currentSessionId) {
      this.startNewSession();
    }

    const requestId = uuidv4();
    const functionType = this.determineFunctionType(data);
    
    const log: ApiLog = {
      timestamp: new Date().toISOString(),
      requestId,
      type: 'request',
      endpoint,
      method,
      functionType,
      data: {
        model: data.model,
        messages: data.messages,
        temperature: data.temperature,
        max_tokens: data.max_tokens
      }
    };

    await this.writeLog(log);
    return requestId;
  }

  static async logResponse(requestId: string, endpoint: string, method: string, data: any) {
    console.log('[ApiLogger] Logging response...');
    
    // Find the corresponding request to get its function type
    const request = this.logs.find(log => log.requestId === requestId && log.type === 'request');
    const functionType = request?.functionType || 'debate_message';
    
    const log: ApiLog = {
      timestamp: new Date().toISOString(),
      requestId,
      type: 'response',
      endpoint,
      method,
      functionType,
      data: this.cleanResponse(data)
    };

    await this.writeLog(log);
  }
}
