import Config from 'react-native-config';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Configuration interface
export interface AppEnvironmentConfig {
  environment: Environment;
  apiBaseUrl: string;
  apiTimeout: number;
  enableLogging: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableBetaFeatures: boolean;
  stripePublishableKey: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  awsConfig: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  features: {
    enableVoiceLogging: boolean;
    enableMoodTracking: boolean;
    enableSocialFeatures: boolean;
    enableAdvancedAnalytics: boolean;
    enableOfflineMode: boolean;
    enableBiometricAuth: boolean;
    enableDarkMode: boolean;
    enableNotifications: boolean;
  };
  limits: {
    maxImageSize: number; // bytes
    maxUploadSize: number; // bytes
    cacheSize: number; // bytes
    offlineStorageLimit: number; // bytes
    maxRetryAttempts: number;
    requestTimeout: number; // ms
  };
  ai: {
    confidenceThreshold: number;
    maxProcessingTime: number; // ms
    enableGpuAcceleration: boolean;
    modelVersion: string;
    batchSize: number;
  };
  security: {
    enableEncryption: boolean;
    encryptionKey?: string;
    enableCertificatePinning: boolean;
    allowInsecureRequests: boolean;
    sessionTimeout: number; // minutes
  };
}

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  const env = Config.NODE_ENV || __DEV__ ? 'development' : 'production';
  
  if (env === 'development') return 'development';
  if (env === 'staging') return 'staging';
  return 'production';
};

// Environment-specific configurations
const developmentConfig: AppEnvironmentConfig = {
  environment: 'development',
  apiBaseUrl: Config.API_BASE_URL || 'http://localhost:3000/api',
  apiTimeout: 10000,
  enableLogging: true,
  enableAnalytics: false,
  enableCrashReporting: false,
  enablePerformanceMonitoring: true,
  enableBetaFeatures: true,
  stripePublishableKey: Config.STRIPE_PUBLISHABLE_KEY_TEST || 'pk_test_...',
  firebaseConfig: {
    apiKey: Config.FIREBASE_API_KEY || '',
    authDomain: Config.FIREBASE_AUTH_DOMAIN || '',
    projectId: Config.FIREBASE_PROJECT_ID || '',
    storageBucket: Config.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: Config.FIREBASE_APP_ID || '',
    measurementId: Config.FIREBASE_MEASUREMENT_ID,
  },
  awsConfig: {
    region: Config.AWS_REGION || 'us-east-1',
    accessKeyId: Config.AWS_ACCESS_KEY_ID,
    secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
  },
  features: {
    enableVoiceLogging: true,
    enableMoodTracking: true,
    enableSocialFeatures: false,
    enableAdvancedAnalytics: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableDarkMode: true,
    enableNotifications: true,
  },
  limits: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxUploadSize: 50 * 1024 * 1024, // 50MB
    cacheSize: 100 * 1024 * 1024, // 100MB
    offlineStorageLimit: 500 * 1024 * 1024, // 500MB
    maxRetryAttempts: 3,
    requestTimeout: 30000, // 30 seconds
  },
  ai: {
    confidenceThreshold: 0.7,
    maxProcessingTime: 10000, // 10 seconds
    enableGpuAcceleration: true,
    modelVersion: '1.0.0',
    batchSize: 1,
  },
  security: {
    enableEncryption: true,
    encryptionKey: Config.ENCRYPTION_KEY,
    enableCertificatePinning: false,
    allowInsecureRequests: true,
    sessionTimeout: 60, // 1 hour
  },
};

const stagingConfig: AppEnvironmentConfig = {
  ...developmentConfig,
  environment: 'staging',
  apiBaseUrl: Config.API_BASE_URL || 'https://staging-api.nutriscanpro.com/api',
  enableAnalytics: true,
  enableCrashReporting: true,
  enableBetaFeatures: true,
  stripePublishableKey: Config.STRIPE_PUBLISHABLE_KEY_TEST || 'pk_test_...',
  features: {
    ...developmentConfig.features,
    enableSocialFeatures: true,
  },
  security: {
    ...developmentConfig.security,
    allowInsecureRequests: false,
    enableCertificatePinning: true,
  },
};

const productionConfig: AppEnvironmentConfig = {
  ...developmentConfig,
  environment: 'production',
  apiBaseUrl: Config.API_BASE_URL || 'https://api.nutriscanpro.com/api',
  enableLogging: false,
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableBetaFeatures: false,
  stripePublishableKey: Config.STRIPE_PUBLISHABLE_KEY || 'pk_live_...',
  features: {
    ...developmentConfig.features,
    enableSocialFeatures: true,
    enableAdvancedAnalytics: true,
  },
  ai: {
    ...developmentConfig.ai,
    confidenceThreshold: 0.8, // Higher threshold for production
    maxProcessingTime: 8000, // Shorter timeout for production
  },
  security: {
    ...developmentConfig.security,
    allowInsecureRequests: false,
    enableCertificatePinning: true,
    sessionTimeout: 30, // 30 minutes for production
  },
};

// Get configuration based on environment
export const getEnvironmentConfig = (): AppEnvironmentConfig => {
  const environment = getCurrentEnvironment();
  
  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
};

// Export current configuration
export const config = getEnvironmentConfig();

// Configuration validation
export const validateConfig = (config: AppEnvironmentConfig): boolean => {
  const requiredFields = [
    'apiBaseUrl',
    'stripePublishableKey',
    'firebaseConfig.apiKey',
    'firebaseConfig.projectId',
  ];

  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config as any);
    if (!value) {
      console.error(`Missing required configuration: ${field}`);
      return false;
    }
  }

  return true;
};

// Feature flags
export const isFeatureEnabled = (feature: keyof AppEnvironmentConfig['features']): boolean => {
  return config.features[feature];
};

// Environment checks
export const isDevelopment = (): boolean => config.environment === 'development';
export const isStaging = (): boolean => config.environment === 'staging';
export const isProduction = (): boolean => config.environment === 'production';

// Debug helpers
export const getDebugInfo = () => ({
  environment: config.environment,
  version: Config.VERSION || '1.0.0',
  buildNumber: Config.BUILD_NUMBER || '1',
  apiBaseUrl: config.apiBaseUrl,
  enabledFeatures: Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature),
});

// Configuration overrides for testing
export const overrideConfig = (overrides: Partial<AppEnvironmentConfig>): void => {
  if (__DEV__) {
    Object.assign(config, overrides);
    console.log('Configuration overridden:', overrides);
  } else {
    console.warn('Configuration overrides are only allowed in development');
  }
};

// Export utilities
export default config;
export { Environment, AppEnvironmentConfig };

