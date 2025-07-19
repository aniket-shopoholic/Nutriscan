import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performance';

// Analytics event types
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

// User properties interface
export interface UserProperties {
  userId: string;
  subscriptionTier: string;
  registrationDate: string;
  lastActiveDate: string;
  totalScans: number;
  accuracyRate: number;
  preferredMealTypes: string[];
  deviceInfo: {
    platform: string;
    version: string;
    model: string;
  };
}

// Custom analytics events
export const ANALYTICS_EVENTS = {
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_CRASHED: 'app_crashed',
  
  // User authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  
  // Food scanning
  FOOD_SCAN_STARTED: 'food_scan_started',
  FOOD_SCAN_COMPLETED: 'food_scan_completed',
  FOOD_SCAN_FAILED: 'food_scan_failed',
  SCAN_ACCURACY_FEEDBACK: 'scan_accuracy_feedback',
  MANUAL_FOOD_ENTRY: 'manual_food_entry',
  
  // Nutrition tracking
  NUTRITION_GOAL_SET: 'nutrition_goal_set',
  DAILY_GOAL_REACHED: 'daily_goal_reached',
  WATER_INTAKE_LOGGED: 'water_intake_logged',
  MOOD_LOGGED: 'mood_logged',
  
  // Subscription
  SUBSCRIPTION_VIEWED: 'subscription_viewed',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  TRIAL_STARTED: 'trial_started',
  TRIAL_CONVERTED: 'trial_converted',
  
  // Feature usage
  FEATURE_USED: 'feature_used',
  SCREEN_VIEWED: 'screen_viewed',
  BUTTON_CLICKED: 'button_clicked',
  
  // Performance
  PERFORMANCE_ISSUE: 'performance_issue',
  BATTERY_OPTIMIZATION: 'battery_optimization',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
} as const;

// Analytics service class
class AnalyticsService {
  private isInitialized = false;
  private sessionId: string = '';
  private userId: string = '';
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = true;

  // Initialize analytics
  async initialize(userId?: string): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Generate session ID
      this.sessionId = this.generateSessionId();
      this.userId = userId || '';

      // Initialize Firebase Analytics
      await analytics().setAnalyticsCollectionEnabled(config.enableAnalytics);
      
      // Set user properties
      if (userId) {
        await analytics().setUserId(userId);
        await crashlytics().setUserId(userId);
      }

      // Set default parameters
      await analytics().setDefaultEventParameters({
        app_version: config.version,
        environment: config.environment,
        session_id: this.sessionId,
      });

      this.isInitialized = true;

      // Process queued events
      await this.processEventQueue();

      logger.info('Analytics service initialized', {
        userId,
        sessionId: this.sessionId,
        component: 'AnalyticsService',
      });

    } catch (error) {
      logger.error('Failed to initialize analytics', error as Error, {
        component: 'AnalyticsService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'AnalyticsService',
        action: 'initialize',
      });
    }
  }

  // Track event
  async trackEvent(
    eventName: string, 
    parameters: Record<string, any> = {},
    immediate: boolean = false
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: eventName,
        parameters: {
          ...parameters,
          timestamp: new Date().toISOString(),
          user_id: this.userId,
          session_id: this.sessionId,
        },
        timestamp: new Date().toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
      };

      if (!this.isInitialized || !this.isOnline) {
        // Queue event for later processing
        this.eventQueue.push(event);
        return;
      }

      if (immediate) {
        await this.sendEventImmediately(event);
      } else {
        await this.sendEvent(event);
      }

      // Log to console in development
      if (config.isDevelopment) {
        logger.debug('Analytics event tracked', {
          eventName,
          parameters,
          component: 'AnalyticsService',
        });
      }

    } catch (error) {
      logger.error('Failed to track event', error as Error, {
        eventName,
        parameters,
        component: 'AnalyticsService',
      });
    }
  }

  // Track screen view
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      await this.trackEvent(ANALYTICS_EVENTS.SCREEN_VIEWED, {
        screen_name: screenName,
        screen_class: screenClass,
      });

    } catch (error) {
      logger.error('Failed to track screen view', error as Error, {
        screenName,
        component: 'AnalyticsService',
      });
    }
  }

  // Track user action
  async trackUserAction(
    action: string, 
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(ANALYTICS_EVENTS.BUTTON_CLICKED, {
      action,
      ...context,
    });
  }

  // Track feature usage
  async trackFeatureUsage(
    featureName: string, 
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: featureName,
      ...context,
    });
  }

  // Track performance metrics
  async trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(ANALYTICS_EVENTS.PERFORMANCE_ISSUE, {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      ...context,
    });

    // Also log to performance monitor
    performanceMonitor.recordMetric(metricName, value, unit);
  }

  // Track error
  async trackError(
    error: Error,
    context: Record<string, any> = {},
    isFatal: boolean = false
  ): Promise<void> {
    try {
      // Record to Crashlytics
      if (isFatal) {
        crashlytics().recordError(error);
      } else {
        crashlytics().log(error.message);
      }

      // Track analytics event
      await this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        is_fatal: isFatal,
        ...context,
      }, true); // Send immediately for errors

    } catch (trackingError) {
      logger.error('Failed to track error', trackingError as Error, {
        originalError: error.message,
        component: 'AnalyticsService',
      });
    }
  }

  // Track conversion events
  async trackConversion(
    conversionType: string,
    value?: number,
    currency?: string,
    context: Record<string, any> = {}
  ): Promise<void> {
    const parameters: Record<string, any> = {
      conversion_type: conversionType,
      ...context,
    };

    if (value !== undefined) {
      parameters.value = value;
    }

    if (currency) {
      parameters.currency = currency;
    }

    await analytics().logEvent('conversion', parameters);
    await this.trackEvent('conversion', parameters);
  }

  // Track subscription events
  async trackSubscription(
    eventType: 'started' | 'upgraded' | 'canceled' | 'renewed',
    planId: string,
    value?: number,
    context: Record<string, any> = {}
  ): Promise<void> {
    const parameters = {
      event_type: eventType,
      plan_id: planId,
      value,
      ...context,
    };

    await analytics().logEvent('subscription_event', parameters);
    await this.trackEvent(`subscription_${eventType}`, parameters);
  }

  // Set user properties
  async setUserProperties(properties: Partial<UserProperties>): Promise<void> {
    try {
      // Set Firebase user properties
      for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined && value !== null) {
          await analytics().setUserProperty(key, String(value));
        }
      }

      // Set Crashlytics user properties
      if (properties.userId) {
        await crashlytics().setUserId(properties.userId);
        this.userId = properties.userId;
      }

      logger.debug('User properties set', {
        properties,
        component: 'AnalyticsService',
      });

    } catch (error) {
      logger.error('Failed to set user properties', error as Error, {
        properties,
        component: 'AnalyticsService',
      });
    }
  }

  // Track app lifecycle events
  async trackAppLifecycle(event: 'opened' | 'backgrounded' | 'crashed'): Promise<void> {
    const eventMap = {
      opened: ANALYTICS_EVENTS.APP_OPENED,
      backgrounded: ANALYTICS_EVENTS.APP_BACKGROUNDED,
      crashed: ANALYTICS_EVENTS.APP_CRASHED,
    };

    await this.trackEvent(eventMap[event], {
      app_state: event,
      timestamp: new Date().toISOString(),
    });
  }

  // Track nutrition events
  async trackNutritionEvent(
    eventType: 'goal_set' | 'goal_reached' | 'scan_completed' | 'manual_entry',
    data: Record<string, any> = {}
  ): Promise<void> {
    const eventMap = {
      goal_set: ANALYTICS_EVENTS.NUTRITION_GOAL_SET,
      goal_reached: ANALYTICS_EVENTS.DAILY_GOAL_REACHED,
      scan_completed: ANALYTICS_EVENTS.FOOD_SCAN_COMPLETED,
      manual_entry: ANALYTICS_EVENTS.MANUAL_FOOD_ENTRY,
    };

    await this.trackEvent(eventMap[eventType], {
      nutrition_event_type: eventType,
      ...data,
    });
  }

  // Get analytics insights (for admin/debug purposes)
  async getAnalyticsInsights(): Promise<Record<string, any>> {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized,
      queuedEvents: this.eventQueue.length,
      isOnline: this.isOnline,
    };
  }

  // Enable/disable analytics
  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    try {
      await analytics().setAnalyticsCollectionEnabled(enabled);
      
      logger.info('Analytics collection updated', {
        enabled,
        component: 'AnalyticsService',
      });

    } catch (error) {
      logger.error('Failed to update analytics collection', error as Error, {
        enabled,
        component: 'AnalyticsService',
      });
    }
  }

  // Reset analytics data (for GDPR compliance)
  async resetAnalyticsData(): Promise<void> {
    try {
      await analytics().resetAnalyticsData();
      this.eventQueue = [];
      this.userId = '';
      
      logger.info('Analytics data reset', {
        component: 'AnalyticsService',
      });

    } catch (error) {
      logger.error('Failed to reset analytics data', error as Error, {
        component: 'AnalyticsService',
      });
    }
  }

  // Private methods
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    await analytics().logEvent(event.name, event.parameters);
  }

  private async sendEventImmediately(event: AnalyticsEvent): Promise<void> {
    // For critical events, we might want to send them immediately
    await this.sendEvent(event);
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      for (const event of events) {
        await this.sendEvent(event);
      }

      logger.debug('Processed queued analytics events', {
        count: events.length,
        component: 'AnalyticsService',
      });

    } catch (error) {
      logger.error('Failed to process event queue', error as Error, {
        queueSize: this.eventQueue.length,
        component: 'AnalyticsService',
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Network status handling
  setNetworkStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    
    if (isOnline && this.eventQueue.length > 0) {
      this.processEventQueue();
    }
  }
}

// Create and export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;

// Export constants and types
export { ANALYTICS_EVENTS };
export type { AnalyticsEvent, UserProperties };

