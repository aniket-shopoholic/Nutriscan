import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { COLORS, SUBSCRIPTION_TIERS } from '../constants';

const SubscriptionScreen: React.FC = () => {
  const renderSubscriptionTier = (tier: any, isPopular = false) => (
    <Card style={[styles.tierCard, isPopular && styles.popularTier]}>
      <Card.Content>
        {isPopular && (
          <Chip style={styles.popularChip} textStyle={styles.popularChipText}>
            Most Popular
          </Chip>
        )}
        
        <Text style={styles.tierName}>{tier.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ${tier.price}
            {tier.id === 'annual' && <Text style={styles.originalPrice}> $119.88</Text>}
          </Text>
          <Text style={styles.priceUnit}>
            {tier.price === 0 ? 'Free' : tier.id === 'annual' ? '/year' : '/month'}
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {tier.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Button
          mode={tier.id === 'premium' ? 'contained' : 'outlined'}
          onPress={() => {}}
          style={styles.subscribeButton}
          buttonColor={tier.id === 'premium' ? COLORS.primary : undefined}
          disabled={tier.id === 'basic'}
        >
          {tier.id === 'basic' ? 'Current Plan' : 
           tier.id === 'premium' ? 'Start Free Trial' : 'Subscribe'}
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock the full potential of NutriScan Pro
          </Text>
        </View>

        <Card style={styles.trialCard}>
          <Card.Content>
            <Text style={styles.trialTitle}>🎉 7-Day Free Trial</Text>
            <Text style={styles.trialText}>
              Try Premium features risk-free. Cancel anytime during the trial period.
            </Text>
          </Card.Content>
        </Card>

        {renderSubscriptionTier(SUBSCRIPTION_TIERS.BASIC)}
        {renderSubscriptionTier(SUBSCRIPTION_TIERS.PREMIUM, true)}
        {renderSubscriptionTier(SUBSCRIPTION_TIERS.ANNUAL)}

        <Card style={styles.benefitsCard}>
          <Card.Content>
            <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>
                • Unlimited AI-powered food scans
              </Text>
              <Text style={styles.benefitItem}>
                • 3D portion estimation for accurate tracking
              </Text>
              <Text style={styles.benefitItem}>
                • Advanced nutrition insights and trends
              </Text>
              <Text style={styles.benefitItem}>
                • Mood tracking and food correlation analysis
              </Text>
              <Text style={styles.benefitItem}>
                • Voice logging for hands-free entry
              </Text>
              <Text style={styles.benefitItem}>
                • Export your data anytime
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscriptions auto-renew unless cancelled. You can manage your subscription 
            in your device's settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  trialCard: {
    marginBottom: 20,
    backgroundColor: COLORS.primary + '10',
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  trialText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tierCard: {
    marginBottom: 16,
  },
  popularTier: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  popularChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  popularChipText: {
    color: 'white',
    fontSize: 12,
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  priceUnit: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 4,
  },
  benefitsCard: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SubscriptionScreen;

