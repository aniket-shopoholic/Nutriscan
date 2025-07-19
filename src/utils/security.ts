import CryptoJS from 'crypto-js';
import { config } from '../config/environment';
import { logger } from './logger';

// Security configuration
export interface SecurityConfig {
  encryptionKey: string;
  enableEncryption: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

// Encryption utilities
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(key?: string) {
    this.encryptionKey = key || config.security.encryptionKey || this.generateKey();
    
    if (!key && !config.security.encryptionKey) {
      logger.warn('No encryption key provided, generated temporary key');
    }
  }

  // Generate a random encryption key
  private generateKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  // Encrypt data
  encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  decrypt(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash data (one-way)
  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  // Generate secure random string
  generateSecureRandom(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  // Validate encryption key strength
  validateKeyStrength(key: string): boolean {
    return key.length >= 32; // Minimum 256 bits
  }
}

// Create encryption service instance
export const encryptionService = new EncryptionService();

// Input sanitization
export class InputSanitizer {
  // Sanitize HTML to prevent XSS
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/&/g, '&amp;');
  }

  // Sanitize SQL to prevent injection
  static sanitizeSql(input: string): string {
    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  // Sanitize file names
  static sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  // Sanitize URLs
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      return urlObj.toString();
    } catch (error) {
      logger.warn('Invalid URL provided for sanitization', { url });
      return '';
    }
  }

  // Remove potentially dangerous characters
  static removeDangerousChars(input: string): string {
    return input.replace(/[<>'"&]/g, '');
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.toLowerCase().trim();
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }
}

// Authentication security
export class AuthSecurity {
  private static loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Check if account is locked
  static isAccountLocked(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) return false;

    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;

    // Reset if lockout period has passed
    if (timeSinceLastAttempt > this.LOCKOUT_DURATION) {
      this.loginAttempts.delete(identifier);
      return false;
    }

    return attempts.count >= this.MAX_ATTEMPTS;
  }

  // Record failed login attempt
  static recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

    attempts.count += 1;
    attempts.lastAttempt = now;

    this.loginAttempts.set(identifier, attempts);

    logger.warn('Failed login attempt recorded', {
      identifier: this.hashIdentifier(identifier),
      attempts: attempts.count,
      component: 'auth_security',
    });

    if (attempts.count >= this.MAX_ATTEMPTS) {
      logger.error('Account locked due to too many failed attempts', {
        identifier: this.hashIdentifier(identifier),
        component: 'auth_security',
      });
    }
  }

  // Record successful login
  static recordSuccessfulLogin(identifier: string): void {
    this.loginAttempts.delete(identifier);
    logger.info('Successful login recorded', {
      identifier: this.hashIdentifier(identifier),
      component: 'auth_security',
    });
  }

  // Get remaining lockout time
  static getRemainingLockoutTime(identifier: string): number {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts || attempts.count < this.MAX_ATTEMPTS) return 0;

    const now = Date.now();
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    const remainingTime = this.LOCKOUT_DURATION - timeSinceLastAttempt;

    return Math.max(0, remainingTime);
  }

  // Hash identifier for logging (privacy)
  private static hashIdentifier(identifier: string): string {
    return CryptoJS.SHA256(identifier).toString().substring(0, 8);
  }

  // Generate secure session token
  static generateSessionToken(): string {
    return encryptionService.generateSecureRandom(64);
  }

  // Validate password strength
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      score -= 2;
      feedback.push('Password is too common');
    }

    return {
      isValid: score >= 4,
      score: Math.max(0, score),
      feedback,
    };
  }

  // Check if password is commonly used
  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'football', 'baseball',
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }
}

// Data protection utilities
export class DataProtection {
  // Mask sensitive data for logging
  static maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'apiKey', 'secret', 'key',
      'email', 'phone', 'ssn', 'creditCard', 'cvv',
      'address', 'location', 'coordinates',
    ];

    const masked = { ...data };

    for (const field of sensitiveFields) {
      if (masked[field]) {
        if (typeof masked[field] === 'string') {
          masked[field] = this.maskString(masked[field]);
        } else {
          masked[field] = '[REDACTED]';
        }
      }
    }

    return masked;
  }

  // Mask string (show first and last 2 characters)
  private static maskString(str: string): string {
    if (str.length <= 4) {
      return '*'.repeat(str.length);
    }
    
    const start = str.substring(0, 2);
    const end = str.substring(str.length - 2);
    const middle = '*'.repeat(str.length - 4);
    
    return start + middle + end;
  }

  // Check if data contains PII
  static containsPII(data: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/, // Phone number
    ];

    return piiPatterns.some(pattern => pattern.test(data));
  }

  // Generate privacy-safe user ID
  static generatePrivacySafeId(userId: string): string {
    return CryptoJS.SHA256(userId + 'privacy_salt').toString().substring(0, 16);
  }
}

// Network security
export class NetworkSecurity {
  // Validate SSL certificate (mock implementation)
  static validateSSLCertificate(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      // In a real implementation, this would check the SSL certificate
      // For now, just check if it's HTTPS
      const isHttps = url.startsWith('https://');
      
      if (!isHttps && config.environment === 'production') {
        logger.warn('Insecure HTTP connection detected in production', { url });
        resolve(false);
      } else {
        resolve(true);
      }
    });
  }

  // Add security headers to requests
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
    };
  }

  // Validate API response integrity
  static validateResponseIntegrity(response: any, expectedHash?: string): boolean {
    if (!expectedHash) return true;

    const responseHash = CryptoJS.SHA256(JSON.stringify(response)).toString();
    return responseHash === expectedHash;
  }
}

// Secure storage wrapper
export class SecureStorage {
  // Store encrypted data
  static async storeSecure(key: string, value: string): Promise<void> {
    try {
      const encrypted = encryptionService.encrypt(value);
      // In a real implementation, this would use react-native-keychain or similar
      // For now, just indicate it would be stored securely
      logger.debug('Data stored securely', { key });
    } catch (error) {
      logger.error('Failed to store secure data', error, { key });
      throw error;
    }
  }

  // Retrieve and decrypt data
  static async retrieveSecure(key: string): Promise<string | null> {
    try {
      // In a real implementation, this would retrieve from secure storage
      // For now, just indicate it would be retrieved
      logger.debug('Data retrieved securely', { key });
      return null; // Placeholder
    } catch (error) {
      logger.error('Failed to retrieve secure data', error, { key });
      return null;
    }
  }

  // Remove secure data
  static async removeSecure(key: string): Promise<void> {
    try {
      // In a real implementation, this would remove from secure storage
      logger.debug('Secure data removed', { key });
    } catch (error) {
      logger.error('Failed to remove secure data', error, { key });
      throw error;
    }
  }
}

// Security audit utilities
export class SecurityAudit {
  // Log security event
  static logSecurityEvent(event: string, details?: Record<string, any>): void {
    logger.warn(`Security event: ${event}`, {
      ...DataProtection.maskSensitiveData(details),
      component: 'security_audit',
      timestamp: new Date().toISOString(),
    });
  }

  // Check for security vulnerabilities
  static performSecurityCheck(): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check encryption key
    if (!config.security.encryptionKey) {
      issues.push('No encryption key configured');
    }

    // Check HTTPS in production
    if (config.environment === 'production' && !config.apiBaseUrl.startsWith('https://')) {
      issues.push('API not using HTTPS in production');
    }

    // Check certificate pinning
    if (config.environment === 'production' && !config.security.enableCertificatePinning) {
      issues.push('Certificate pinning not enabled in production');
    }

    // Check session timeout
    if (config.security.sessionTimeout > 60) {
      issues.push('Session timeout too long (>60 minutes)');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}

// Export all security utilities
export {
  InputSanitizer,
  AuthSecurity,
  DataProtection,
  NetworkSecurity,
  SecureStorage,
  SecurityAudit,
};

// Export default encryption service
export default encryptionService;

