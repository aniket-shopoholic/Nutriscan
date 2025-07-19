import { Stripe } from '@stripe/stripe-react-native';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { errorHandler, createNetworkError } from '../utils/errorHandler';
import { SubscriptionTier, SubscriptionStatus, Subscription } from '../types';

// Stripe configuration
const STRIPE_CONFIG = {
  publishableKey: config.stripePublishableKey,
  merchantIdentifier: 'merchant.com.nutriscanpro.app',
  urlScheme: 'nutriscanpro',
  setReturnUrlSchemeOnAndroid: true,
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic (Free)',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '5 daily scans',
      'Manual food logging',
      'Basic nutrition tracking',
      'Water intake tracking',
      'Mood logging',
    ],
    limits: {
      dailyScans: 5,
      monthlyScans: 150,
      advancedFeatures: false,
      exportData: false,
      prioritySupport: false,
      customGoals: false,
      mealPlanning: false,
      nutritionistConsultation: false,
    },
  },
  premium: {
    id: 'premium_monthly',
    name: 'Premium',
    price: 999, // $9.99 in cents
    currency: 'USD',
    interval: 'month',
    stripePriceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    features: [
      'Unlimited AI scans',
      'Advanced 3D portion estimation',
      'Detailed nutrition analysis',
      'Meal planning & recipes',
      'Export data & reports',
      'Priority customer support',
      'Custom nutrition goals',
      'Barcode scanning',
      'Voice food logging',
    ],
    limits: {
      dailyScans: -1, // Unlimited
      monthlyScans: -1, // Unlimited
      advancedFeatures: true,
      exportData: true,
      prioritySupport: true,
      customGoals: true,
      mealPlanning: true,
      nutritionistConsultation: false,
    },
  },
  annual: {
    id: 'premium_annual',
    name: 'Premium Annual',
    price: 7999, // $79.99 in cents (40% discount)
    currency: 'USD',
    interval: 'year',
    stripePriceId: 'price_premium_annual', // Replace with actual Stripe price ID
    features: [
      'All Premium features',
      '40% savings vs monthly',
      'Nutritionist consultations (2/year)',
      'Advanced meal insights',
      'Priority feature requests',
    ],
    limits: {
      dailyScans: -1, // Unlimited
      monthlyScans: -1, // Unlimited
      advancedFeatures: true,
      exportData: true,
      prioritySupport: true,
      customGoals: true,
      mealPlanning: true,
      nutritionistConsultation: true,
    },
  },
} as const;

// Stripe service class
class StripeService {
  private stripe: Stripe | null = null;
  private isInitialized = false;

  // Initialize Stripe
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      await Stripe.initStripe(STRIPE_CONFIG);
      this.stripe = Stripe;
      this.isInitialized = true;

      logger.info('Stripe initialized successfully', {
        component: 'StripeService',
        publishableKey: STRIPE_CONFIG.publishableKey.substring(0, 12) + '...',
      });
    } catch (error) {
      logger.error('Failed to initialize Stripe', error as Error, {
        component: 'StripeService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'initialize',
      });
    }
  }

  // Create payment intent for subscription
  async createPaymentIntent(
    planId: string,
    customerId?: string,
    trialDays: number = 7
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    ephemeralKey?: string;
  }> {
    try {
      await this.ensureInitialized();

      const plan = this.getPlanById(planId);
      if (!plan || plan.id === 'basic') {
        throw new Error('Invalid subscription plan');
      }

      // Call backend API to create payment intent
      const response = await fetch(`${config.apiBaseUrl}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          customerId,
          trialDays,
          metadata: {
            planId: plan.id,
            planName: plan.name,
            appVersion: config.version,
          },
        }),
      });

      if (!response.ok) {
        throw createNetworkError(`Payment intent creation failed: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info('Payment intent created successfully', {
        component: 'StripeService',
        planId,
        paymentIntentId: data.paymentIntentId,
      });

      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        ephemeralKey: data.ephemeralKey,
      };
    } catch (error) {
      logger.error('Failed to create payment intent', error as Error, {
        component: 'StripeService',
        planId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'createPaymentIntent',
        planId,
      });
    }
  }

  // Present payment sheet
  async presentPaymentSheet(
    clientSecret: string,
    customerId?: string,
    ephemeralKey?: string
  ): Promise<{ success: boolean; paymentIntent?: any }> {
    try {
      await this.ensureInitialized();

      // Initialize payment sheet
      const { error: initError } = await this.stripe!.initPaymentSheet({
        merchantDisplayName: 'NutriScan Pro',
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'NutriScan Pro User',
        },
        returnURL: 'nutriscanpro://payment-return',
        style: 'automatic',
      });

      if (initError) {
        throw new Error(`Payment sheet initialization failed: ${initError.message}`);
      }

      // Present payment sheet
      const { error: presentError, paymentOption } = await this.stripe!.presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          logger.info('Payment sheet canceled by user', {
            component: 'StripeService',
          });
          return { success: false };
        }
        throw new Error(`Payment sheet presentation failed: ${presentError.message}`);
      }

      logger.info('Payment completed successfully', {
        component: 'StripeService',
        paymentOption: paymentOption?.label,
      });

      return { success: true, paymentIntent: paymentOption };
    } catch (error) {
      logger.error('Failed to present payment sheet', error as Error, {
        component: 'StripeService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'presentPaymentSheet',
      });
    }
  }

  // Create subscription
  async createSubscription(
    customerId: string,
    priceId: string,
    paymentMethodId: string,
    trialDays: number = 7
  ): Promise<Subscription> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          customerId,
          priceId,
          paymentMethodId,
          trialPeriodDays: trialDays,
          metadata: {
            source: 'mobile_app',
            appVersion: config.version,
          },
        }),
      });

      if (!response.ok) {
        throw createNetworkError(`Subscription creation failed: ${response.statusText}`);
      }

      const subscription = await response.json();

      logger.info('Subscription created successfully', {
        component: 'StripeService',
        subscriptionId: subscription.id,
        customerId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', error as Error, {
        component: 'StripeService',
        customerId,
        priceId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'createSubscription',
      });
    }
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          cancelAtPeriodEnd,
          cancellationReason: 'user_requested',
        }),
      });

      if (!response.ok) {
        throw createNetworkError(`Subscription cancellation failed: ${response.statusText}`);
      }

      const subscription = await response.json();

      logger.info('Subscription canceled successfully', {
        component: 'StripeService',
        subscriptionId,
        cancelAtPeriodEnd,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', error as Error, {
        component: 'StripeService',
        subscriptionId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'cancelSubscription',
      });
    }
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw createNetworkError(`Subscription resume failed: ${response.statusText}`);
      }

      const subscription = await response.json();

      logger.info('Subscription resumed successfully', {
        component: 'StripeService',
        subscriptionId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to resume subscription', error as Error, {
        component: 'StripeService',
        subscriptionId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'resumeSubscription',
      });
    }
  }

  // Update payment method
  async updatePaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<Subscription> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}/payment-method`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw createNetworkError(`Payment method update failed: ${response.statusText}`);
      }

      const subscription = await response.json();

      logger.info('Payment method updated successfully', {
        component: 'StripeService',
        subscriptionId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to update payment method', error as Error, {
        component: 'StripeService',
        subscriptionId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'updatePaymentMethod',
      });
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw createNetworkError(`Failed to fetch subscription: ${response.statusText}`);
      }

      const subscription = await response.json();
      return subscription;
    } catch (error) {
      logger.error('Failed to get subscription', error as Error, {
        component: 'StripeService',
        subscriptionId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'getSubscription',
      });
    }
  }

  // Restore purchases (for app store compliance)
  async restorePurchases(userId: string): Promise<Subscription[]> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/subscriptions/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw createNetworkError(`Purchase restoration failed: ${response.statusText}`);
      }

      const subscriptions = await response.json();

      logger.info('Purchases restored successfully', {
        component: 'StripeService',
        userId,
        count: subscriptions.length,
      });

      return subscriptions;
    } catch (error) {
      logger.error('Failed to restore purchases', error as Error, {
        component: 'StripeService',
        userId,
      });
      throw errorHandler.handleError(error as Error, {
        component: 'StripeService',
        action: 'restorePurchases',
      });
    }
  }

  // Get plan by ID
  getPlanById(planId: string) {
    return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.id === planId);
  }

  // Get all available plans
  getAllPlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  // Check if plan has feature
  planHasFeature(planId: string, feature: keyof typeof SUBSCRIPTION_PLANS.premium.limits): boolean {
    const plan = this.getPlanById(planId);
    return plan?.limits[feature] === true || plan?.limits[feature] === -1;
  }

  // Get plan limits
  getPlanLimits(planId: string) {
    const plan = this.getPlanById(planId);
    return plan?.limits || SUBSCRIPTION_PLANS.basic.limits;
  }

  // Format price for display
  formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100);
  }

  // Calculate savings for annual plan
  getAnnualSavings(): { amount: number; percentage: number } {
    const monthlyPrice = SUBSCRIPTION_PLANS.premium.price * 12;
    const annualPrice = SUBSCRIPTION_PLANS.annual.price;
    const savings = monthlyPrice - annualPrice;
    const percentage = Math.round((savings / monthlyPrice) * 100);
    
    return { amount: savings, percentage };
  }

  // Private helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async getAuthToken(): Promise<string> {
    // This would typically get the token from your auth service
    // For now, return a placeholder
    return 'auth_token_placeholder';
  }

  // Handle webhook events (for backend integration)
  static handleWebhookEvent(event: any): void {
    logger.info('Stripe webhook event received', {
      component: 'StripeService',
      eventType: event.type,
      eventId: event.id,
    });

    switch (event.type) {
      case 'customer.subscription.created':
        logger.info('Subscription created via webhook', {
          subscriptionId: event.data.object.id,
          customerId: event.data.object.customer,
        });
        break;
      
      case 'customer.subscription.updated':
        logger.info('Subscription updated via webhook', {
          subscriptionId: event.data.object.id,
          status: event.data.object.status,
        });
        break;
      
      case 'customer.subscription.deleted':
        logger.info('Subscription canceled via webhook', {
          subscriptionId: event.data.object.id,
        });
        break;
      
      case 'invoice.payment_succeeded':
        logger.info('Payment succeeded via webhook', {
          invoiceId: event.data.object.id,
          subscriptionId: event.data.object.subscription,
        });
        break;
      
      case 'invoice.payment_failed':
        logger.warn('Payment failed via webhook', {
          invoiceId: event.data.object.id,
          subscriptionId: event.data.object.subscription,
        });
        break;
      
      default:
        logger.debug('Unhandled webhook event', {
          eventType: event.type,
        });
    }
  }
}

// Create and export singleton instance
export const stripeService = new StripeService();
export default stripeService;

// Export types and constants
export { SUBSCRIPTION_PLANS };
export type { SubscriptionTier, SubscriptionStatus, Subscription };

