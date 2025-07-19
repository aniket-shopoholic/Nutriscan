import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme, Card, Button, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';

import { stripeService, SUBSCRIPTION_PLANS } from '../../services/stripeService';
import { LoadingSpinner } from '../common';
import { logger } from '../../utils/logger';

interface SubscriptionPlansProps {
  currentPlan?: string;
  onPlanSelect: (planId: string) => void;
  onUpgrade: (planId: string) => Promise<void>;
  isLoading?: boolean;
  showTrialInfo?: boolean;
  highlightRecommended?: boolean;
}

interface PlanCardProps {
  plan: typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];
  isSelected: boolean;
  isCurrent: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  onUpgrade: () => void;
  isLoading: boolean;
  showTrial: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentPlan = 'basic',
  onPlanSelect,
  onUpgrade,
  isLoading = false,
  showTrialInfo = true,
  highlightRecommended = true,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Handle plan selection
  const handlePlanSelect = useCallback((planId: string) => {
    setSelectedPlan(planId);
    onPlanSelect(planId);
    
    logger.logUserAction('subscription_plan_selected', {
      planId,
      previousPlan: selectedPlan,
      component: 'SubscriptionPlans',
    });
  }, [selectedPlan, onPlanSelect]);

  // Handle upgrade
  const handleUpgrade = useCallback(async (planId: string) => {
    if (planId === 'basic' || planId === currentPlan) return;

    setProcessingPlan(planId);
    
    try {
      await onUpgrade(planId);
      
      logger.logUserAction('subscription_upgrade_initiated', {
        planId,
        fromPlan: currentPlan,
        component: 'SubscriptionPlans',
      });
    } catch (error) {
      logger.error('Failed to upgrade subscription', error as Error, {
        planId,
        component: 'SubscriptionPlans',
      });
      
      Alert.alert(
        'Upgrade Failed',
        'We encountered an issue processing your upgrade. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingPlan(null);
    }
  }, [currentPlan, onUpgrade]);

  // Get annual savings
  const annualSavings = stripeService.getAnnualSavings();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Choose Your Plan
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Unlock the full potential of NutriScan Pro
        </Text>
      </View>

      {/* Trial Info */}
      {showTrialInfo && (
        <Card style={[styles.trialCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.trialContent}>
            <Icon 
              name="gift" 
              size={24} 
              color={theme.colors.onPrimaryContainer} 
            />
            <View style={styles.trialText}>
              <Text style={[styles.trialTitle, { color: theme.colors.onPrimaryContainer }]}>
                7-Day Free Trial
              </Text>
              <Text style={[styles.trialSubtitle, { color: theme.colors.onPrimaryContainer }]}>
                Try Premium features risk-free. Cancel anytime.
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Plans */}
      <View style={styles.plansContainer}>
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            isCurrent={currentPlan === plan.id}
            isRecommended={highlightRecommended && plan.id === 'premium_monthly'}
            onSelect={() => handlePlanSelect(plan.id)}
            onUpgrade={() => handleUpgrade(plan.id)}
            isLoading={processingPlan === plan.id}
            showTrial={showTrialInfo}
          />
        ))}
      </View>

      {/* Annual Savings Highlight */}
      <Card style={[styles.savingsCard, { backgroundColor: theme.colors.secondaryContainer }]}>
        <Card.Content style={styles.savingsContent}>
          <Icon 
            name="piggy-bank" 
            size={32} 
            color={theme.colors.onSecondaryContainer} 
          />
          <View style={styles.savingsText}>
            <Text style={[styles.savingsTitle, { color: theme.colors.onSecondaryContainer }]}>
              Save {annualSavings.percentage}% with Annual Plan
            </Text>
            <Text style={[styles.savingsAmount, { color: theme.colors.onSecondaryContainer }]}>
              That's {stripeService.formatPrice(annualSavings.amount)} saved per year!
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Features Comparison */}
      <Card style={[styles.comparisonCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.comparisonTitle, { color: theme.colors.onSurface }]}>
            Feature Comparison
          </Text>
          
          <View style={styles.comparisonTable}>
            {/* Header */}
            <View style={styles.comparisonRow}>
              <Text style={[styles.comparisonFeature, { color: theme.colors.onSurface }]}>
                Feature
              </Text>
              <Text style={[styles.comparisonPlan, { color: theme.colors.onSurface }]}>
                Free
              </Text>
              <Text style={[styles.comparisonPlan, { color: theme.colors.onSurface }]}>
                Premium
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Features */}
            {[
              { feature: 'Daily Scans', basic: '5', premium: 'Unlimited' },
              { feature: '3D Portion Analysis', basic: '✗', premium: '✓' },
              { feature: 'Meal Planning', basic: '✗', premium: '✓' },
              { feature: 'Data Export', basic: '✗', premium: '✓' },
              { feature: 'Priority Support', basic: '✗', premium: '✓' },
              { feature: 'Custom Goals', basic: '✗', premium: '✓' },
              { feature: 'Voice Logging', basic: '✗', premium: '✓' },
              { feature: 'Barcode Scanning', basic: '✗', premium: '✓' },
            ].map((item, index) => (
              <View key={index} style={styles.comparisonRow}>
                <Text style={[styles.comparisonFeature, { color: theme.colors.onSurfaceVariant }]}>
                  {item.feature}
                </Text>
                <Text style={[
                  styles.comparisonValue,
                  { 
                    color: item.basic === '✗' 
                      ? theme.colors.error 
                      : theme.colors.onSurfaceVariant 
                  }
                ]}>
                  {item.basic}
                </Text>
                <Text style={[
                  styles.comparisonValue,
                  { 
                    color: item.premium === '✓' 
                      ? theme.colors.primary 
                      : theme.colors.onSurfaceVariant 
                  }
                ]}>
                  {item.premium}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

// Plan Card Component
const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected,
  isCurrent,
  isRecommended,
  onSelect,
  onUpgrade,
  isLoading,
  showTrial,
}) => {
  const theme = useTheme();

  const getCardStyle = () => {
    if (isRecommended) {
      return [styles.planCard, styles.recommendedCard];
    }
    if (isSelected) {
      return [styles.planCard, { borderColor: theme.colors.primary, borderWidth: 2 }];
    }
    return [styles.planCard, { backgroundColor: theme.colors.surface }];
  };

  const getButtonText = () => {
    if (isCurrent) return 'Current Plan';
    if (plan.id === 'basic') return 'Free Plan';
    if (isLoading) return 'Processing...';
    return showTrial ? 'Start Free Trial' : 'Subscribe';
  };

  const getButtonMode = () => {
    if (isCurrent) return 'outlined';
    if (plan.id === 'basic') return 'outlined';
    return 'contained';
  };

  return (
    <TouchableOpacity
      style={getCardStyle()}
      onPress={onSelect}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isRecommended && (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.recommendedBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.recommendedText}>MOST POPULAR</Text>
        </LinearGradient>
      )}

      <View style={styles.planHeader}>
        <Text style={[styles.planName, { color: theme.colors.onSurface }]}>
          {plan.name}
        </Text>
        
        {plan.id !== 'basic' && (
          <View style={styles.priceContainer}>
            <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
              {stripeService.formatPrice(plan.price)}
            </Text>
            <Text style={[styles.planInterval, { color: theme.colors.onSurfaceVariant }]}>
              /{plan.interval}
            </Text>
          </View>
        )}

        {plan.id === 'basic' && (
          <Text style={[styles.freeText, { color: theme.colors.secondary }]}>
            Free Forever
          </Text>
        )}

        {plan.id === 'premium_annual' && (
          <Chip
            style={[styles.savingsChip, { backgroundColor: theme.colors.secondaryContainer }]}
            textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
          >
            Save 40%
          </Chip>
        )}
      </View>

      <View style={styles.planFeatures}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Icon 
              name="check" 
              size={16} 
              color={theme.colors.primary} 
              style={styles.featureIcon}
            />
            <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.planFooter}>
        <Button
          mode={getButtonMode()}
          onPress={plan.id === 'basic' ? onSelect : onUpgrade}
          disabled={isCurrent || isLoading}
          loading={isLoading}
          style={styles.planButton}
          labelStyle={{
            color: isCurrent 
              ? theme.colors.onSurfaceVariant 
              : plan.id === 'basic' 
                ? theme.colors.primary 
                : 'white'
          }}
        >
          {getButtonText()}
        </Button>

        {isCurrent && (
          <Text style={[styles.currentPlanText, { color: theme.colors.onSurfaceVariant }]}>
            You're currently on this plan
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  trialCard: {
    marginBottom: 24,
    elevation: 2,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialText: {
    marginLeft: 12,
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trialSubtitle: {
    fontSize: 14,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    position: 'relative',
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    height: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  planInterval: {
    fontSize: 16,
    marginLeft: 4,
  },
  freeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  savingsChip: {
    marginTop: 8,
  },
  planFeatures: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  planFooter: {
    alignItems: 'center',
  },
  planButton: {
    width: '100%',
    marginBottom: 8,
  },
  currentPlanText: {
    fontSize: 12,
    textAlign: 'center',
  },
  savingsCard: {
    marginBottom: 24,
    elevation: 2,
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsText: {
    marginLeft: 16,
    flex: 1,
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savingsAmount: {
    fontSize: 14,
  },
  comparisonCard: {
    marginBottom: 24,
    elevation: 2,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonTable: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  comparisonPlan: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  comparisonValue: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default SubscriptionPlans;

