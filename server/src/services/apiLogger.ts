import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ApiLog {
  timestamp: string;
  requestId: string;
  type: 'request' | 'response';
  endpoint: string;
  method: string;
  data: any;
}

export class ApiLogger {
  private static logDir = path.join('/home/andy/debater/server/logs');
  private static currentLogFile = path.join(ApiLogger.logDir, `api-${new Date().toISOString().split('T')[0]}.json`);

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

  private static async writeLog(log: ApiLog) {
    try {
      this.ensureLogDir();
      console.log(`[ApiLogger] Writing ${log.type} log to ${this.currentLogFile}`);
      
      // Append the log as a new line
      const logString = JSON.stringify(log) + '\n';
      await fs.promises.appendFile(this.currentLogFile, logString, 'utf8');
      
      console.log(`[ApiLogger] Successfully logged ${log.type}`);
      console.log(`[ApiLogger] Current log file path: ${this.currentLogFile}`);
      
      // Verify the file exists and is writable
      try {
        await fs.promises.access(this.currentLogFile, fs.constants.F_OK | fs.constants.W_OK);
        console.log('[ApiLogger] Log file is accessible and writable');
      } catch (error) {
        console.error('[ApiLogger] Log file access error:', error);
      }
    } catch (error) {
      console.error('[ApiLogger] Error writing log:', error);
      throw error;
    }
  }

  static async logRequest(endpoint: string, method: string, data: any): Promise<string> {
    console.log('[ApiLogger] Logging request...');
    const requestId = uuidv4();
    const log: ApiLog = {
      timestamp: new Date().toISOString(),
      requestId,
      type: 'request',
      endpoint,
      method,
      data
    };

    await this.writeLog(log);
    return requestId;
  }

  static async logResponse(requestId: string, endpoint: string, method: string, data: any) {
    console.log('[ApiLogger] Logging response...');
    const log: ApiLog = {
      timestamp: new Date().toISOString(),
      requestId,
      type: 'response',
      endpoint,
      method,
      data
    };

    await this.writeLog(log);
  }
}
