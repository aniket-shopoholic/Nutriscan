import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useTheme, Card, Button, Divider, Chip } from 'react-native-paper';
import { useStripe } from '@stripe/stripe-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { stripeService, SUBSCRIPTION_PLANS } from '../../services/stripeService';
import { LoadingSpinner, ErrorMessage } from '../common';
import { logger } from '../../utils/logger';
import { errorHandler } from '../../utils/errorHandler';

interface PaymentSheetProps {
  planId: string;
  customerId?: string;
  onPaymentSuccess: (subscription: any) => void;
  onPaymentError: (error: Error) => void;
  onCancel: () => void;
  trialDays?: number;
  visible: boolean;
}

interface PaymentState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  clientSecret: string | null;
  ephemeralKey: string | null;
  paymentIntentId: string | null;
}

const PaymentSheet: React.FC<PaymentSheetProps> = ({
  planId,
  customerId,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  trialDays = 7,
  visible,
}) => {
  const theme = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [paymentState, setPaymentState] = useState<PaymentState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    clientSecret: null,
    ephemeralKey: null,
    paymentIntentId: null,
  });

  const plan = stripeService.getPlanById(planId);

  // Initialize payment sheet when component becomes visible
  useEffect(() => {
    if (visible && plan && plan.id !== 'basic') {
      initializePayment();
    }
  }, [visible, planId]);

  // Initialize payment
  const initializePayment = useCallback(async () => {
    if (!plan || plan.id === 'basic') {
      setPaymentState(prev => ({ 
        ...prev, 
        error: 'Invalid subscription plan selected' 
      }));
      return;
    }

    setPaymentState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      logger.info('Initializing payment', {
        planId,
        customerId,
        component: 'PaymentSheet',
      });

      // Create payment intent
      const { clientSecret, ephemeralKey, paymentIntentId } = 
        await stripeService.createPaymentIntent(planId, customerId, trialDays);

      // Initialize Stripe payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'NutriScan Pro',
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'NutriScan Pro User',
        },
        returnURL: Platform.OS === 'ios' ? 'nutriscanpro://payment-return' : undefined,
        style: 'automatic',
        primaryButtonColor: theme.colors.primary,
      });

      if (error) {
        throw new Error(`Payment sheet initialization failed: ${error.message}`);
      }

      setPaymentState(prev => ({
        ...prev,
        isLoading: false,
        clientSecret,
        ephemeralKey,
        paymentIntentId,
      }));

      logger.info('Payment sheet initialized successfully', {
        planId,
        paymentIntentId,
        component: 'PaymentSheet',
      });

    } catch (error) {
      const handledError = errorHandler.handleError(error as Error, {
        component: 'PaymentSheet',
        action: 'initializePayment',
        planId,
      });

      setPaymentState(prev => ({
        ...prev,
        isLoading: false,
        error: handledError.message,
      }));

      logger.error('Failed to initialize payment', error as Error, {
        planId,
        component: 'PaymentSheet',
      });
    }
  }, [plan, planId, customerId, trialDays, initPaymentSheet, theme.colors.primary]);

  // Present payment sheet
  const handlePayment = useCallback(async () => {
    if (!paymentState.clientSecret) {
      Alert.alert('Error', 'Payment not initialized. Please try again.');
      return;
    }

    setPaymentState(prev => ({ ...prev, isProcessing: true }));

    try {
      logger.info('Presenting payment sheet', {
        planId,
        paymentIntentId: paymentState.paymentIntentId,
        component: 'PaymentSheet',
      });

      const { error, paymentOption } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          logger.info('Payment canceled by user', {
            planId,
            component: 'PaymentSheet',
          });
          onCancel();
          return;
        }
        throw new Error(`Payment failed: ${error.message}`);
      }

      // Payment successful
      logger.info('Payment completed successfully', {
        planId,
        paymentIntentId: paymentState.paymentIntentId,
        paymentMethod: paymentOption?.label,
        component: 'PaymentSheet',
      });

      // Create subscription
      if (customerId && paymentOption) {
        const subscription = await stripeService.createSubscription(
          customerId,
          plan?.stripePriceId || '',
          paymentOption.id || '',
          trialDays
        );

        onPaymentSuccess(subscription);
      } else {
        onPaymentSuccess({ paymentIntent: paymentOption });
      }

    } catch (error) {
      const handledError = errorHandler.handleError(error as Error, {
        component: 'PaymentSheet',
        action: 'handlePayment',
        planId,
      });

      logger.error('Payment processing failed', error as Error, {
        planId,
        component: 'PaymentSheet',
      });

      onPaymentError(handledError);
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [
    paymentState.clientSecret,
    paymentState.paymentIntentId,
    planId,
    customerId,
    plan,
    trialDays,
    presentPaymentSheet,
    onPaymentSuccess,
    onPaymentError,
    onCancel,
  ]);

  // Handle retry
  const handleRetry = useCallback(() => {
    initializePayment();
  }, [initializePayment]);

  if (!visible || !plan || plan.id === 'basic') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Complete Your Purchase
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Subscribe to {plan.name}
            </Text>
          </View>

          {/* Plan Summary */}
          <View style={styles.planSummary}>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: theme.colors.onSurface }]}>
                {plan.name}
              </Text>
              <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
                {stripeService.formatPrice(plan.price)}/{plan.interval}
              </Text>
            </View>

            {trialDays > 0 && (
              <Chip
                icon="gift"
                style={[styles.trialChip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                {trialDays}-day free trial
              </Chip>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Features */}
          <View style={styles.features}>
            <Text style={[styles.featuresTitle, { color: theme.colors.onSurface }]}>
              What's included:
            </Text>
            {plan.features.slice(0, 5).map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Icon 
                  name="check-circle" 
                  size={16} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* Billing Info */}
          <View style={styles.billingInfo}>
            <View style={styles.billingRow}>
              <Text style={[styles.billingLabel, { color: theme.colors.onSurfaceVariant }]}>
                Subtotal:
              </Text>
              <Text style={[styles.billingValue, { color: theme.colors.onSurface }]}>
                {stripeService.formatPrice(plan.price)}
              </Text>
            </View>
            
            {trialDays > 0 && (
              <View style={styles.billingRow}>
                <Text style={[styles.billingLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Free trial ({trialDays} days):
                </Text>
                <Text style={[styles.billingValue, { color: theme.colors.primary }]}>
                  -{stripeService.formatPrice(plan.price)}
                </Text>
              </View>
            )}
            
            <View style={[styles.billingRow, styles.totalRow]}>
              <Text style={[styles.totalLabel, { color: theme.colors.onSurface }]}>
                Due today:
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                {trialDays > 0 ? '$0.00' : stripeService.formatPrice(plan.price)}
              </Text>
            </View>
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: theme.colors.onSurfaceVariant }]}>
            {trialDays > 0 
              ? `Your free trial starts today. You'll be charged ${stripeService.formatPrice(plan.price)} after ${trialDays} days. Cancel anytime.`
              : `You'll be charged ${stripeService.formatPrice(plan.price)} ${plan.interval === 'month' ? 'monthly' : 'annually'}. Cancel anytime.`
            }
          </Text>

          {/* Loading State */}
          {paymentState.isLoading && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
              <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                Preparing payment...
              </Text>
            </View>
          )}

          {/* Error State */}
          {paymentState.error && (
            <View style={styles.errorContainer}>
              <ErrorMessage
                message={paymentState.error}
                onRetry={handleRetry}
                showRetry
              />
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handlePayment}
              disabled={paymentState.isLoading || paymentState.isProcessing || !!paymentState.error}
              loading={paymentState.isProcessing}
              style={styles.payButton}
              labelStyle={{ color: 'white' }}
            >
              {paymentState.isProcessing 
                ? 'Processing...' 
                : trialDays > 0 
                  ? 'Start Free Trial' 
                  : 'Subscribe Now'
              }
            </Button>

            <Button
              mode="outlined"
              onPress={onCancel}
              disabled={paymentState.isProcessing}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Icon 
              name="shield-check" 
              size={16} 
              color={theme.colors.onSurfaceVariant} 
            />
            <Text style={[styles.securityText, { color: theme.colors.onSurfaceVariant }]}>
              Secured by Stripe. Your payment information is encrypted and secure.
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    elevation: 8,
    borderRadius: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  planSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trialChip: {
    marginLeft: 16,
  },
  divider: {
    marginVertical: 16,
  },
  features: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  billingInfo: {
    marginBottom: 16,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 14,
  },
  billingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    marginBottom: 24,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  payButton: {
    paddingVertical: 4,
  },
  cancelButton: {
    paddingVertical: 4,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
});

export default PaymentSheet;

