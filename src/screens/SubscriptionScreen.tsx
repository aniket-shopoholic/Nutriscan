import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme, Card, Button, Chip, Divider, FAB } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import PaymentSheet from '../components/subscription/PaymentSheet';
import { LoadingSpinner, ErrorMessage } from '../components/common';

import { RootState } from '../store';
import { 
  updateSubscription, 
  cancelSubscription, 
  resumeSubscription,
  restorePurchases 
} from '../store/slices/subscriptionSlice';
import { stripeService } from '../services/stripeService';
import { Subscription, SubscriptionStatus } from '../types';
import { logger } from '../utils/logger';

interface SubscriptionScreenProps {
  navigation: any;
}

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { 
    currentSubscription, 
    isLoading, 
    error,
    dailyScansUsed,
    currentTier 
  } = useSelector((state: RootState) => state.subscription);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(currentTier);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentPlanId, setPaymentPlanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Focus effect to refresh subscription data
  useFocusEffect(
    useCallback(() => {
      loadSubscriptionData();
      
      logger.logUserAction('subscription_screen_viewed', {
        currentTier,
        hasSubscription: !!currentSubscription,
        component: 'SubscriptionScreen',
      });
    }, [currentTier, currentSubscription])
  );

  // Load subscription data
  const loadSubscriptionData = useCallback(async () => {
    if (!user) return;

    try {
      await dispatch(updateSubscription({ userId: user.id })).unwrap();
      
      logger.info('Subscription data loaded successfully', {
        userId: user.id,
        component: 'SubscriptionScreen',
      });
    } catch (error) {
      logger.error('Failed to load subscription data', error as Error, {
        userId: user?.id,
        component: 'SubscriptionScreen',
      });
    }
  }, [user, dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubscriptionData();
    setRefreshing(false);
  }, [loadSubscriptionData]);

  // Handle plan selection
  const handlePlanSelect = useCallback((planId: string) => {
    setSelectedPlan(planId);
    
    logger.logUserAction('subscription_plan_selected', {
      planId,
      currentTier,
      component: 'SubscriptionScreen',
    });
  }, [currentTier]);

  // Handle upgrade
  const handleUpgrade = useCallback(async (planId: string) => {
    if (!user || planId === 'basic' || planId === currentTier) return;

    setPaymentPlanId(planId);
    setShowPaymentSheet(true);
    
    logger.logUserAction('subscription_upgrade_initiated', {
      planId,
      fromTier: currentTier,
      component: 'SubscriptionScreen',
    });
  }, [user, currentTier]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(async (subscription: Subscription) => {
    setShowPaymentSheet(false);
    setIsProcessing(true);

    try {
      // Update subscription in Redux store
      await dispatch(updateSubscription({ 
        userId: user?.id || '',
        subscription 
      })).unwrap();

      Alert.alert(
        'Subscription Activated!',
        'Welcome to NutriScan Pro Premium! You now have access to all premium features.',
        [{ text: 'Great!', style: 'default' }]
      );

      logger.logUserAction('subscription_activated', {
        subscriptionId: subscription.id,
        planId: paymentPlanId,
        component: 'SubscriptionScreen',
      });

    } catch (error) {
      logger.error('Failed to update subscription after payment', error as Error, {
        subscriptionId: subscription.id,
        component: 'SubscriptionScreen',
      });

      Alert.alert(
        'Payment Successful',
        'Your payment was processed successfully. Your subscription will be activated shortly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, user, paymentPlanId]);

  // Handle payment error
  const handlePaymentError = useCallback((error: Error) => {
    setShowPaymentSheet(false);
    
    logger.error('Payment failed', error, {
      planId: paymentPlanId,
      component: 'SubscriptionScreen',
    });

    Alert.alert(
      'Payment Failed',
      error.message || 'We encountered an issue processing your payment. Please try again.',
      [{ text: 'OK' }]
    );
  }, [paymentPlanId]);

  // Handle payment cancel
  const handlePaymentCancel = useCallback(() => {
    setShowPaymentSheet(false);
    
    logger.logUserAction('payment_canceled', {
      planId: paymentPlanId,
      component: 'SubscriptionScreen',
    });
  }, [paymentPlanId]);

  // Handle subscription cancellation
  const handleCancelSubscription = useCallback(async () => {
    if (!currentSubscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              
              await dispatch(cancelSubscription({
                subscriptionId: currentSubscription.id,
                cancelAtPeriodEnd: true,
              })).unwrap();

              Alert.alert(
                'Subscription Canceled',
                'Your subscription has been canceled. You\'ll continue to have access to premium features until the end of your billing period.',
                [{ text: 'OK' }]
              );

              logger.logUserAction('subscription_canceled', {
                subscriptionId: currentSubscription.id,
                component: 'SubscriptionScreen',
              });

            } catch (error) {
              logger.error('Failed to cancel subscription', error as Error, {
                subscriptionId: currentSubscription.id,
                component: 'SubscriptionScreen',
              });

              Alert.alert(
                'Cancellation Failed',
                'We encountered an issue canceling your subscription. Please try again or contact support.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [currentSubscription, dispatch]);

  // Handle subscription resume
  const handleResumeSubscription = useCallback(async () => {
    if (!currentSubscription) return;

    try {
      setIsProcessing(true);
      
      await dispatch(resumeSubscription({
        subscriptionId: currentSubscription.id,
      })).unwrap();

      Alert.alert(
        'Subscription Resumed',
        'Your subscription has been resumed successfully!',
        [{ text: 'Great!' }]
      );

      logger.logUserAction('subscription_resumed', {
        subscriptionId: currentSubscription.id,
        component: 'SubscriptionScreen',
      });

    } catch (error) {
      logger.error('Failed to resume subscription', error as Error, {
        subscriptionId: currentSubscription.id,
        component: 'SubscriptionScreen',
      });

      Alert.alert(
        'Resume Failed',
        'We encountered an issue resuming your subscription. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [currentSubscription, dispatch]);

  // Handle restore purchases
  const handleRestorePurchases = useCallback(async () => {
    if (!user) return;

    try {
      setIsProcessing(true);
      
      await dispatch(restorePurchases({ userId: user.id })).unwrap();

      Alert.alert(
        'Purchases Restored',
        'Your purchases have been restored successfully!',
        [{ text: 'OK' }]
      );

      logger.logUserAction('purchases_restored', {
        userId: user.id,
        component: 'SubscriptionScreen',
      });

    } catch (error) {
      logger.error('Failed to restore purchases', error as Error, {
        userId: user.id,
        component: 'SubscriptionScreen',
      });

      Alert.alert(
        'Restore Failed',
        'No purchases found to restore or an error occurred. Please contact support if you believe this is incorrect.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [user, dispatch]);

  // Get subscription status info
  const getSubscriptionStatusInfo = () => {
    if (!currentSubscription) return null;

    const plan = stripeService.getPlanById(currentSubscription.planId);
    const isActive = currentSubscription.status === 'active';
    const isCanceled = currentSubscription.status === 'canceled';
    const isTrialing = currentSubscription.status === 'trialing';

    return {
      plan,
      isActive,
      isCanceled,
      isTrialing,
      nextBillingDate: currentSubscription.currentPeriodEnd,
      trialEndsAt: currentSubscription.trialEnd,
    };
  };

  const subscriptionInfo = getSubscriptionStatusInfo();

  // Render loading state
  if (isLoading && !currentSubscription) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LoadingSpinner size="large" />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading subscription details...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Current Subscription Status */}
        {subscriptionInfo && (
          <Card style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.statusHeader}>
                <Text style={[styles.statusTitle, { color: theme.colors.onSurface }]}>
                  Current Plan
                </Text>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: subscriptionInfo.isActive 
                        ? theme.colors.primaryContainer
                        : subscriptionInfo.isCanceled
                        ? theme.colors.errorContainer
                        : theme.colors.secondaryContainer,
                    },
                  ]}
                  textStyle={{
                    color: subscriptionInfo.isActive 
                      ? theme.colors.onPrimaryContainer
                      : subscriptionInfo.isCanceled
                      ? theme.colors.onErrorContainer
                      : theme.colors.onSecondaryContainer,
                  }}
                >
                  {subscriptionInfo.isTrialing ? 'Free Trial' : 
                   subscriptionInfo.isActive ? 'Active' : 
                   subscriptionInfo.isCanceled ? 'Canceled' : 'Inactive'}
                </Chip>
              </View>

              <Text style={[styles.planName, { color: theme.colors.primary }]}>
                {subscriptionInfo.plan?.name || 'Premium'}
              </Text>

              {subscriptionInfo.isTrialing && subscriptionInfo.trialEndsAt && (
                <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                  Trial ends: {new Date(subscriptionInfo.trialEndsAt).toLocaleDateString()}
                </Text>
              )}

              {subscriptionInfo.isActive && subscriptionInfo.nextBillingDate && (
                <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                  Next billing: {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString()}
                </Text>
              )}

              {subscriptionInfo.isCanceled && subscriptionInfo.nextBillingDate && (
                <Text style={[styles.statusText, { color: theme.colors.error }]}>
                  Access ends: {new Date(subscriptionInfo.nextBillingDate).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.statusActions}>
                {subscriptionInfo.isCanceled ? (
                  <Button
                    mode="contained"
                    onPress={handleResumeSubscription}
                    disabled={isProcessing}
                    loading={isProcessing}
                    style={styles.actionButton}
                  >
                    Resume Subscription
                  </Button>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handleCancelSubscription}
                    disabled={isProcessing}
                    style={styles.actionButton}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Usage Stats for Basic Plan */}
        {currentTier === 'basic' && (
          <Card style={[styles.usageCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.usageHeader}>
                <Icon name="chart-line" size={24} color={theme.colors.primary} />
                <Text style={[styles.usageTitle, { color: theme.colors.onSurface }]}>
                  Daily Usage
                </Text>
              </View>
              
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={[styles.usageNumber, { color: theme.colors.primary }]}>
                    {dailyScansUsed}
                  </Text>
                  <Text style={[styles.usageLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Scans Used
                  </Text>
                </View>
                
                <View style={styles.usageStat}>
                  <Text style={[styles.usageNumber, { color: theme.colors.secondary }]}>
                    {5 - dailyScansUsed}
                  </Text>
                  <Text style={[styles.usageLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Remaining
                  </Text>
                </View>
              </View>

              {dailyScansUsed >= 5 && (
                <View style={styles.limitReached}>
                  <Icon name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={[styles.limitText, { color: theme.colors.error }]}>
                    Daily scan limit reached. Upgrade to Premium for unlimited scans!
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Subscription Plans */}
        <SubscriptionPlans
          currentPlan={currentTier}
          onPlanSelect={handlePlanSelect}
          onUpgrade={handleUpgrade}
          isLoading={isProcessing}
          showTrialInfo={currentTier === 'basic'}
          highlightRecommended={currentTier === 'basic'}
        />

        {/* Restore Purchases */}
        <Card style={[styles.restoreCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.restoreContent}>
              <Icon name="restore" size={24} color={theme.colors.onSurfaceVariant} />
              <View style={styles.restoreText}>
                <Text style={[styles.restoreTitle, { color: theme.colors.onSurface }]}>
                  Already purchased?
                </Text>
                <Text style={[styles.restoreSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Restore your previous purchases
                </Text>
              </View>
              <Button
                mode="outlined"
                onPress={handleRestorePurchases}
                disabled={isProcessing}
                loading={isProcessing}
                style={styles.restoreButton}
              >
                Restore
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Payment Sheet Modal */}
      {showPaymentSheet && (
        <PaymentSheet
          planId={paymentPlanId}
          customerId={user?.stripeCustomerId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onCancel={handlePaymentCancel}
          visible={showPaymentSheet}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  statusCard: {
    margin: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 16,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  usageCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  usageStat: {
    alignItems: 'center',
  },
  usageNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 14,
  },
  limitReached: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
  },
  limitText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  restoreCard: {
    margin: 16,
    elevation: 2,
  },
  restoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restoreText: {
    flex: 1,
    marginLeft: 16,
  },
  restoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  restoreSubtitle: {
    fontSize: 14,
  },
  restoreButton: {
    marginLeft: 16,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default SubscriptionScreen;

