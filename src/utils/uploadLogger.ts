/**
 * Comprehensive Upload Pipeline Logger
 * Tracks all stages of file upload and processing
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success';

interface UploadLogEntry {
  timestamp: string;
  level: LogLevel;
  stage: string;
  message: string;
  data?: any;
  error?: Error;
}

class UploadLogger {
  private logs: UploadLogEntry[] = [];
  private maxLogs = 100;
  private enabled = true;

  log(level: LogLevel, stage: string, message: string, data?: any, error?: Error) {
    const entry: UploadLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      data,
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (!this.enabled) return;

    const prefix = `[Upload-${stage}]`;
    const style = {
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
      success: 'color: #10b981',
    }[level];

    if (level === 'error') {
      console.error(prefix, message, data || '', error || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data || '');
    } else {
      console.log(`%c${prefix}`, style, message, data || '');
    }
  }

  // Stage-specific logging methods
  validation(message: string, data?: any) {
    this.log('info', 'Validation', message, data);
  }

  validationError(message: string, error: Error | string) {
    this.log('error', 'Validation', message, undefined, error instanceof Error ? error : new Error(error));
  }

  fileSelection(message: string, data?: any) {
    this.log('info', 'FileSelect', message, data);
  }

  compression(message: string, data?: any) {
    this.log('info', 'Compression', message, data);
  }

  ocr(message: string, data?: any) {
    this.log('info', 'OCR', message, data);
  }

  ocrError(message: string, error: Error) {
    this.log('error', 'OCR', message, undefined, error);
  }

  extraction(message: string, data?: any) {
    this.log('info', 'Extraction', message, data);
  }

  extractionError(message: string, error: any) {
    this.log('error', 'Extraction', message, undefined, error instanceof Error ? error : new Error(JSON.stringify(error)));
  }

  saving(message: string, data?: any) {
    this.log('info', 'Save', message, data);
  }

  saveError(message: string, error: Error) {
    this.log('error', 'Save', message, undefined, error);
  }

  success(stage: string, message: string, data?: any) {
    this.log('success', stage, message, data);
  }

  // Widget-specific logging
  widgetSave(message: string, data?: any) {
    this.log('info', 'WidgetSave', message, data);
  }

  widgetSaveError(message: string, error: Error) {
    this.log('error', 'WidgetSave', message, undefined, error);
  }

  widgetVerification(message: string, data?: any) {
    this.log('info', 'WidgetVerify', message, data);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 20): UploadLogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs for a specific stage
  getLogsByStage(stage: string): UploadLogEntry[] {
    return this.logs.filter(log => log.stage === stage);
  }

  // Get error logs only
  getErrors(): UploadLogEntry[] {
    return this.logs.filter(log => log.level === 'error');
  }

  // Clear logs
  clear() {
    this.logs = [];
    console.log('%c[Upload-Logger] Logs cleared', 'color: #8b5cf6');
  }

  // Enable/disable logging
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const uploadLogger = new UploadLogger();

// Helper to log full upload flow
export const logUploadFlow = (stage: string, status: 'start' | 'complete' | 'error', details?: any) => {
  const message = `${stage} ${status}`;
  if (status === 'error') {
    uploadLogger.log('error', 'Flow', message, details);
  } else if (status === 'complete') {
    uploadLogger.success('Flow', message, details);
  } else {
    uploadLogger.log('info', 'Flow', message, details);
  }
};
