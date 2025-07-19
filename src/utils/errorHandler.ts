import { AppError, ApiError } from '../types';

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  
  // Camera and scanning errors
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  CAMERA_NOT_AVAILABLE: 'CAMERA_NOT_AVAILABLE',
  SCAN_PROCESSING_FAILED: 'SCAN_PROCESSING_FAILED',
  SCAN_NO_FOOD_DETECTED: 'SCAN_NO_FOOD_DETECTED',
  SCAN_POOR_IMAGE_QUALITY: 'SCAN_POOR_IMAGE_QUALITY',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTION: 'STORAGE_CORRUPTION',
  
  // Subscription errors
  SUBSCRIPTION_LIMIT_EXCEEDED: 'SUBSCRIPTION_LIMIT_EXCEEDED',
  SUBSCRIPTION_PAYMENT_FAILED: 'SUBSCRIPTION_PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Custom error class
export class NutriScanError extends Error implements AppError {
  public readonly code: string;
  public readonly context?: Record<string, any>;
  public readonly retryable: boolean;
  public readonly timestamp: string;
  public readonly severity: ErrorSeverity;

  constructor(
    code: string,
    message: string,
    options: {
      context?: Record<string, any>;
      retryable?: boolean;
      severity?: ErrorSeverity;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'NutriScanError';
    this.code = code;
    this.context = options.context;
    this.retryable = options.retryable ?? false;
    this.severity = options.severity ?? ErrorSeverity.MEDIUM;
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NutriScanError);
    }
  }
}

// Error handler class
class ErrorHandler {
  private errorListeners: Array<(error: AppError) => void> = [];
  private errorCounts: Map<string, number> = new Map();

  // Add error listener
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  // Remove error listener
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  // Handle error
  handleError(error: Error | AppError, context?: Record<string, any>): AppError {
    let appError: AppError;

    if (error instanceof NutriScanError) {
      appError = error;
    } else {
      // Convert generic error to AppError
      appError = this.convertToAppError(error, context);
    }

    // Track error frequency
    this.trackErrorFrequency(appError.code);

    // Notify listeners
    this.notifyListeners(appError);

    // Log error
    this.logError(appError);

    return appError;
  }

  // Convert generic error to AppError
  private convertToAppError(error: Error, context?: Record<string, any>): AppError {
    let code = ERROR_CODES.UNKNOWN_ERROR;
    let retryable = false;
    let severity = ErrorSeverity.MEDIUM;

    // Determine error type based on error message or type
    if (error.message.includes('Network')) {
      code = ERROR_CODES.NETWORK_ERROR;
      retryable = true;
      severity = ErrorSeverity.LOW;
    } else if (error.message.includes('timeout')) {
      code = ERROR_CODES.TIMEOUT_ERROR;
      retryable = true;
      severity = ErrorSeverity.LOW;
    } else if (error.message.includes('permission')) {
      code = ERROR_CODES.CAMERA_PERMISSION_DENIED;
      retryable = false;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('storage')) {
      code = ERROR_CODES.STORAGE_ACCESS_DENIED;
      retryable = false;
      severity = ErrorSeverity.MEDIUM;
    }

    return new NutriScanError(code, error.message, {
      context: {
        ...context,
        originalError: error.name,
        stack: error.stack,
      },
      retryable,
      severity,
      cause: error,
    });
  }

  // Track error frequency
  private trackErrorFrequency(code: string): void {
    const currentCount = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, currentCount + 1);
  }

  // Notify error listeners
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  // Log error
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      code: error.code,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
      retryable: error.retryable,
      severity: error.severity,
      stack: error.stack,
    };

    switch (logLevel) {
      case 'error':
        console.error('[NutriScan Error]', logData);
        break;
      case 'warn':
        console.warn('[NutriScan Warning]', logData);
        break;
      case 'info':
        console.info('[NutriScan Info]', logData);
        break;
      default:
        console.log('[NutriScan Log]', logData);
    }

    // Send to crash reporting service in production
    if (__DEV__ === false && error.severity === ErrorSeverity.CRITICAL) {
      this.reportToCrashlytics(error);
    }
  }

  // Get log level based on severity
  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  // Report to crash reporting service
  private reportToCrashlytics(error: AppError): void {
    // Implementation would depend on crash reporting service (e.g., Crashlytics, Sentry)
    // For now, just log that it would be reported
    console.log('Would report to crash reporting service:', error.code);
  }

  // Get error statistics
  getErrorStatistics(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  // Clear error statistics
  clearErrorStatistics(): void {
    this.errorCounts.clear();
  }

  // Check if error should be retried
  shouldRetry(error: AppError, attemptCount: number, maxAttempts: number = 3): boolean {
    if (!error.retryable || attemptCount >= maxAttempts) {
      return false;
    }

    // Exponential backoff for retryable errors
    const backoffDelay = Math.pow(2, attemptCount) * 1000; // 1s, 2s, 4s, etc.
    
    return backoffDelay <= 30000; // Max 30 seconds
  }

  // Get retry delay
  getRetryDelay(attemptCount: number): number {
    return Math.min(Math.pow(2, attemptCount) * 1000, 30000);
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const createNetworkError = (message: string, context?: Record<string, any>): NutriScanError => {
  return new NutriScanError(ERROR_CODES.NETWORK_ERROR, message, {
    context,
    retryable: true,
    severity: ErrorSeverity.LOW,
  });
};

export const createAuthError = (message: string, context?: Record<string, any>): NutriScanError => {
  return new NutriScanError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, message, {
    context,
    retryable: false,
    severity: ErrorSeverity.HIGH,
  });
};

export const createScanError = (message: string, context?: Record<string, any>): NutriScanError => {
  return new NutriScanError(ERROR_CODES.SCAN_PROCESSING_FAILED, message, {
    context,
    retryable: true,
    severity: ErrorSeverity.MEDIUM,
  });
};

export const createValidationError = (field: string, message: string): NutriScanError => {
  return new NutriScanError(ERROR_CODES.VALIDATION_REQUIRED_FIELD, message, {
    context: { field },
    retryable: false,
    severity: ErrorSeverity.LOW,
  });
};

// API error converter
export const convertApiError = (apiError: ApiError): NutriScanError => {
  return new NutriScanError(apiError.code, apiError.message, {
    context: apiError.details,
    retryable: apiError.retryable,
    severity: ErrorSeverity.MEDIUM,
  });
};

// Global error boundary helper
export const handleGlobalError = (error: Error, errorInfo?: any): void => {
  const appError = errorHandler.handleError(error, { errorInfo });
  
  // Additional global error handling logic
  if (appError.severity === ErrorSeverity.CRITICAL) {
    // Could trigger app restart, show critical error screen, etc.
    console.error('Critical error occurred:', appError);
  }
};

// Promise rejection handler
export const handleUnhandledRejection = (reason: any): void => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  errorHandler.handleError(error, { type: 'unhandled_rejection' });
};

// Export error handler instance
export default errorHandler;

