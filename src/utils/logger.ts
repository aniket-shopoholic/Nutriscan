import { AppError } from '../types';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemoteLogging: boolean;
  enableFileLogging: boolean;
  maxLogEntries: number;
  remoteEndpoint?: string;
  sensitiveFields: string[];
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableRemoteLogging: !__DEV__,
  enableFileLogging: false,
  maxLogEntries: 1000,
  sensitiveFields: ['password', 'token', 'apiKey', 'email', 'phone'],
};

// Logger class
class Logger {
  private config: LoggerConfig;
  private logEntries: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    // Initialize remote logging if enabled
    if (this.config.enableRemoteLogging) {
      this.initializeRemoteLogging();
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize remote logging
  private initializeRemoteLogging(): void {
    // Implementation would depend on logging service (e.g., LogRocket, DataDog, etc.)
    console.log('Remote logging initialized');
  }

  // Core logging method
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // Check if log level meets threshold
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error,
      sessionId: this.sessionId,
    };

    // Add to in-memory log entries
    this.addLogEntry(logEntry);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Remote logging
    if (this.config.enableRemoteLogging) {
      this.logToRemote(logEntry);
    }

    // File logging (if enabled)
    if (this.config.enableFileLogging) {
      this.logToFile(logEntry);
    }
  }

  // Add log entry to in-memory storage
  private addLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);
    
    // Maintain max entries limit
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
    }
  }

  // Sanitize context to remove sensitive information
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    
    this.config.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Log to console
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] [${levelName}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, context, error);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, context, error);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, context, error);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, message, context, error);
        break;
    }
  }

  // Log to remote service
  private logToRemote(entry: LogEntry): void {
    // Implementation would send to remote logging service
    // For now, just indicate it would be sent
    if (entry.level >= LogLevel.WARN) {
      console.log('Would send to remote logging service:', entry.message);
    }
  }

  // Log to file (mobile-specific implementation needed)
  private logToFile(entry: LogEntry): void {
    // Implementation would write to device storage
    // This would require react-native-fs or similar
    console.log('Would write to log file:', entry.message);
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Specialized logging methods
  logUserAction(action: string, userId?: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      component: 'user_interaction',
      action,
    });
  }

  logApiCall(endpoint: string, method: string, duration: number, status: number): void {
    const level = status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API call: ${method} ${endpoint}`, {
      component: 'api',
      endpoint,
      method,
      duration,
      status,
    });
  }

  logScanEvent(event: string, scanId: string, context?: Record<string, any>): void {
    this.info(`Scan event: ${event}`, {
      ...context,
      component: 'scanner',
      scanId,
      event,
    });
  }

  logPerformance(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      component: 'performance',
      metric,
      value,
      unit,
    });
  }

  logError(error: AppError, context?: Record<string, any>): void {
    this.error(`Error: ${error.code}`, error, {
      ...context,
      errorCode: error.code,
      retryable: error.retryable,
      timestamp: error.timestamp,
    });
  }

  // Configuration methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setUserId(userId: string): void {
    // Add userId to all subsequent logs
    this.info('User session started', { userId });
  }

  // Utility methods
  getLogEntries(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logEntries.filter(entry => entry.level >= level);
    }
    return [...this.logEntries];
  }

  clearLogs(): void {
    this.logEntries = [];
    this.info('Log entries cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  // Performance timing utilities
  startTimer(label: string): () => void {
    const startTime = Date.now();
    this.debug(`Timer started: ${label}`);
    
    return () => {
      const duration = Date.now() - startTime;
      this.logPerformance(label, duration, 'ms');
    };
  }

  // Memory usage logging
  logMemoryUsage(): void {
    if (global.performance && global.performance.memory) {
      const memory = global.performance.memory;
      this.logPerformance('memory_usage', memory.usedJSHeapSize, 'bytes', {
        totalHeapSize: memory.totalJSHeapSize,
        heapSizeLimit: memory.jsHeapSizeLimit,
      });
    }
  }

  // Network status logging
  logNetworkStatus(isConnected: boolean, connectionType?: string): void {
    this.info('Network status changed', {
      component: 'network',
      isConnected,
      connectionType,
    });
  }

  // App lifecycle logging
  logAppStateChange(state: string): void {
    this.info(`App state changed to: ${state}`, {
      component: 'app_lifecycle',
      state,
    });
  }

  // Crash reporting integration
  logCrash(error: Error, context?: Record<string, any>): void {
    this.fatal('Application crash', error, {
      ...context,
      component: 'crash_reporter',
    });
    
    // Send crash report immediately
    if (this.config.enableRemoteLogging) {
      this.sendCrashReport(error, context);
    }
  }

  private sendCrashReport(error: Error, context?: Record<string, any>): void {
    // Implementation would send to crash reporting service
    console.error('Crash report would be sent:', error.message, context);
  }

  // Analytics integration
  logAnalyticsEvent(eventName: string, properties?: Record<string, any>): void {
    this.info(`Analytics event: ${eventName}`, {
      component: 'analytics',
      eventName,
      properties: this.sanitizeContext(properties),
    });
  }

  // Feature flag logging
  logFeatureFlag(flagName: string, value: boolean, context?: Record<string, any>): void {
    this.debug(`Feature flag: ${flagName} = ${value}`, {
      ...context,
      component: 'feature_flags',
      flagName,
      value,
    });
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean): void {
    const level = success ? LogLevel.DEBUG : LogLevel.WARN;
    this.log(level, `Database ${operation} on ${table}`, {
      component: 'database',
      operation,
      table,
      duration,
      success,
    });
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export logger for global use
export default logger;

// Convenience functions for common logging patterns
export const logUserAction = (action: string, context?: Record<string, any>) => 
  logger.logUserAction(action, undefined, context);

export const logApiCall = (endpoint: string, method: string, duration: number, status: number) =>
  logger.logApiCall(endpoint, method, duration, status);

export const logError = (error: AppError, context?: Record<string, any>) =>
  logger.logError(error, context);

export const logPerformance = (metric: string, value: number, unit: string = 'ms') =>
  logger.logPerformance(metric, value, unit);

export const startTimer = (label: string) => logger.startTimer(label);

// Development helpers
export const debugLog = (message: string, data?: any) => {
  if (__DEV__) {
    logger.debug(message, { data });
  }
};

export const devLog = debugLog; // Alias for convenience

