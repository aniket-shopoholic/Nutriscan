import { analyticsService, ANALYTICS_EVENTS } from '../../services/analyticsService';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// Mock Firebase modules
jest.mock('@react-native-firebase/analytics');
jest.mock('@react-native-firebase/crashlytics');

const mockAnalytics = analytics as jest.Mocked<typeof analytics>;
const mockCrashlytics = crashlytics as jest.Mocked<typeof crashlytics>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAnalytics.mockReturnValue({
      setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
      setUserId: jest.fn(() => Promise.resolve()),
      setUserProperty: jest.fn(() => Promise.resolve()),
      setDefaultEventParameters: jest.fn(() => Promise.resolve()),
      logEvent: jest.fn(() => Promise.resolve()),
      logScreenView: jest.fn(() => Promise.resolve()),
      resetAnalyticsData: jest.fn(() => Promise.resolve()),
    } as any);

    mockCrashlytics.mockReturnValue({
      setUserId: jest.fn(() => Promise.resolve()),
      recordError: jest.fn(),
      log: jest.fn(),
    } as any);
  });

  describe('initialize', () => {
    it('should initialize analytics service successfully', async () => {
      await analyticsService.initialize('test-user-id');

      expect(mockAnalytics().setAnalyticsCollectionEnabled).toHaveBeenCalledWith(true);
      expect(mockAnalytics().setUserId).toHaveBeenCalledWith('test-user-id');
      expect(mockCrashlytics().setUserId).toHaveBeenCalledWith('test-user-id');
      expect(mockAnalytics().setDefaultEventParameters).toHaveBeenCalled();
    });

    it('should initialize without user ID', async () => {
      await analyticsService.initialize();

      expect(mockAnalytics().setAnalyticsCollectionEnabled).toHaveBeenCalledWith(true);
      expect(mockAnalytics().setDefaultEventParameters).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockAnalytics().setAnalyticsCollectionEnabled.mockRejectedValue(error);

      await expect(analyticsService.initialize()).rejects.toThrow('Initialization failed');
    });
  });

  describe('trackEvent', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should track event successfully', async () => {
      const eventName = ANALYTICS_EVENTS.FOOD_SCAN_COMPLETED;
      const parameters = { food_type: 'apple', confidence: 0.95 };

      await analyticsService.trackEvent(eventName, parameters);

      expect(mockAnalytics().logEvent).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          ...parameters,
          timestamp: expect.any(String),
          user_id: 'test-user-id',
          session_id: expect.any(String),
        })
      );
    });

    it('should queue events when not initialized', async () => {
      const uninitializedService = Object.create(analyticsService);
      uninitializedService.isInitialized = false;

      await uninitializedService.trackEvent('test_event', { test: 'data' });

      // Event should be queued, not sent immediately
      expect(mockAnalytics().logEvent).not.toHaveBeenCalled();
    });

    it('should handle tracking errors gracefully', async () => {
      const error = new Error('Tracking failed');
      mockAnalytics().logEvent.mockRejectedValue(error);

      // Should not throw error
      await expect(analyticsService.trackEvent('test_event')).resolves.toBeUndefined();
    });
  });

  describe('trackScreenView', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should track screen view successfully', async () => {
      const screenName = 'DashboardScreen';
      const screenClass = 'Dashboard';

      await analyticsService.trackScreenView(screenName, screenClass);

      expect(mockAnalytics().logScreenView).toHaveBeenCalledWith({
        screen_name: screenName,
        screen_class: screenClass,
      });

      expect(mockAnalytics().logEvent).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.SCREEN_VIEWED,
        expect.objectContaining({
          screen_name: screenName,
          screen_class: screenClass,
        })
      );
    });

    it('should use screen name as class when not provided', async () => {
      const screenName = 'DashboardScreen';

      await analyticsService.trackScreenView(screenName);

      expect(mockAnalytics().logScreenView).toHaveBeenCalledWith({
        screen_name: screenName,
        screen_class: screenName,
      });
    });
  });

  describe('trackUserAction', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should track user action successfully', async () => {
      const action = 'button_clicked';
      const context = { button_name: 'scan_food', screen: 'scanner' };

      await analyticsService.trackUserAction(action, context);

      expect(mockAnalytics().logEvent).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.BUTTON_CLICKED,
        expect.objectContaining({
          action,
          ...context,
        })
      );
    });
  });

  describe('trackError', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should track non-fatal error', async () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      await analyticsService.trackError(error, context, false);

      expect(mockCrashlytics().log).toHaveBeenCalledWith(error.message);
      expect(mockAnalytics().logEvent).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.ERROR_OCCURRED,
        expect.objectContaining({
          error_name: error.name,
          error_message: error.message,
          is_fatal: false,
          ...context,
        })
      );
    });

    it('should track fatal error', async () => {
      const error = new Error('Fatal error');
      const context = { component: 'TestComponent' };

      await analyticsService.trackError(error, context, true);

      expect(mockCrashlytics().recordError).toHaveBeenCalledWith(error);
      expect(mockAnalytics().logEvent).toHaveBeenCalledWith(
        ANALYTICS_EVENTS.ERROR_OCCURRED,
        expect.objectContaining({
          error_name: error.name,
          error_message: error.message,
          is_fatal: true,
          ...context,
        })
      );
    });
  });

  describe('setUserProperties', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should set user properties successfully', async () => {
      const properties = {
        userId: 'test-user-id',
        subscriptionTier: 'premium',
        totalScans: 100,
      };

      await analyticsService.setUserProperties(properties);

      expect(mockAnalytics().setUserProperty).toHaveBeenCalledWith('userId', 'test-user-id');
      expect(mockAnalytics().setUserProperty).toHaveBeenCalledWith('subscriptionTier', 'premium');
      expect(mockAnalytics().setUserProperty).toHaveBeenCalledWith('totalScans', '100');
    });

    it('should skip undefined and null properties', async () => {
      const properties = {
        userId: 'test-user-id',
        subscriptionTier: undefined,
        totalScans: null,
      };

      await analyticsService.setUserProperties(properties as any);

      expect(mockAnalytics().setUserProperty).toHaveBeenCalledWith('userId', 'test-user-id');
      expect(mockAnalytics().setUserProperty).not.toHaveBeenCalledWith('subscriptionTier', expect.anything());
      expect(mockAnalytics().setUserProperty).not.toHaveBeenCalledWith('totalScans', expect.anything());
    });
  });

  describe('setAnalyticsEnabled', () => {
    it('should enable analytics collection', async () => {
      await analyticsService.setAnalyticsEnabled(true);

      expect(mockAnalytics().setAnalyticsCollectionEnabled).toHaveBeenCalledWith(true);
    });

    it('should disable analytics collection', async () => {
      await analyticsService.setAnalyticsEnabled(false);

      expect(mockAnalytics().setAnalyticsCollectionEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('resetAnalyticsData', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should reset analytics data successfully', async () => {
      await analyticsService.resetAnalyticsData();

      expect(mockAnalytics().resetAnalyticsData).toHaveBeenCalled();
    });
  });

  describe('getAnalyticsInsights', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should return analytics insights', async () => {
      const insights = await analyticsService.getAnalyticsInsights();

      expect(insights).toEqual(
        expect.objectContaining({
          sessionId: expect.any(String),
          userId: 'test-user-id',
          isInitialized: true,
          queuedEvents: expect.any(Number),
          isOnline: expect.any(Boolean),
        })
      );
    });
  });

  describe('network status handling', () => {
    beforeEach(async () => {
      await analyticsService.initialize('test-user-id');
    });

    it('should handle network status changes', () => {
      analyticsService.setNetworkStatus(false);
      analyticsService.setNetworkStatus(true);

      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});

