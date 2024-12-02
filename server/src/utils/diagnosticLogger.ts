import fs from 'fs';
import path from 'path';

class DiagnosticLogger {
  private static logFile = path.join('/home/vscode/debater/server/logs', 'diagnostic.log');
  private static enabled = process.env.ENABLE_DIAGNOSTIC_LOGGING === 'true';

  static initialize() {
    console.log('Initializing DiagnosticLogger...');
    console.log('Diagnostic logging enabled:', this.enabled);
    console.log('Log file path:', this.logFile);

    if (!this.enabled) {
      console.log('Diagnostic logging is disabled');
      return;
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        console.log('Creating log directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }

      // Clear existing log file
      if (fs.existsSync(this.logFile)) {
        console.log('Clearing existing log file');
        fs.writeFileSync(this.logFile, '');
      }

      // Write initial log entry
      const timestamp = new Date().toISOString();
      fs.writeFileSync(this.logFile, `[${timestamp}] Diagnostic logging initialized\n`);
      console.log('Diagnostic logging initialized successfully');
    } catch (error) {
      console.error('Failed to initialize diagnostic logging:', error);
    }
  }

  private static writeToLogSync(message: string) {
    if (!this.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      console.error('Failed to write to diagnostic log:', error);
    }
  }

  private static async writeToLog(message: string) {
    if (!this.enabled) return;

    try {
      // Ensure directory exists
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      await fs.promises.appendFile(this.logFile, logMessage);
    } catch (error) {
      console.error('Failed to write to diagnostic log:', error);
      // Try synchronous write as fallback
      this.writeToLogSync(`ERROR writing log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static log(message: string, data?: any) {
    if (!this.enabled) return;

    let logMessage = message;
    if (data) {
      try {
        logMessage += '\nData: ' + JSON.stringify(data, null, 2);
      } catch (error) {
        logMessage += '\nData: [Error stringifying data]';
        console.error('Error stringifying log data:', error);
      }
    }
    
    // Use sync write for startup logs
    if (message.includes('Server starting') || message.includes('initialized')) {
      this.writeToLogSync(logMessage);
    } else {
      this.writeToLog(logMessage).catch(error => {
        console.error('Error writing to log:', error);
      });
    }
  }

  static warn(message: string, data?: any) {
    if (!this.enabled) return;

    let logMessage = `WARNING: ${message}`;
    if (data) {
      try {
        logMessage += '\nData: ' + JSON.stringify(data, null, 2);
      } catch (error) {
        logMessage += '\nData: [Error stringifying data]';
        console.error('Error stringifying warning data:', error);
      }
    }

    this.writeToLog(logMessage).catch(error => {
      console.error('Error writing warning log:', error);
      // Try sync write as fallback
      this.writeToLogSync(logMessage);
    });
  }

  static error(message: string, error: any) {
    if (!this.enabled) return;

    let logMessage = `ERROR: ${message}`;
    if (error) {
      if (error instanceof Error) {
        logMessage += `\nError: ${error.message}\nStack: ${error.stack}`;
      } else {
        try {
          logMessage += '\nError Data: ' + JSON.stringify(error, null, 2);
        } catch (jsonError) {
          logMessage += '\nError Data: [Error stringifying error data]';
        }
      }
    }
    
    this.writeToLog(logMessage).catch(error => {
      console.error('Error writing error log:', error);
      // Try sync write as fallback
      this.writeToLogSync(logMessage);
    });
  }

  static async clear() {
    if (!this.enabled) return;

    try {
      if (fs.existsSync(this.logFile)) {
        await fs.promises.unlink(this.logFile);
        console.log('Cleared diagnostic log file');
      }
    } catch (error) {
      console.error('Failed to clear diagnostic log:', error);
    }
  }
}

export default DiagnosticLogger;
