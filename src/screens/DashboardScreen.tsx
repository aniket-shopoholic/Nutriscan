import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, ProgressBar, Button, FAB } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS, MOOD_SCALE } from '../constants';

const DashboardScreen: React.FC = () => {
  const { dailyEntries, waterIntake, dailyGoals } = useSelector((state: RootState) => state.nutrition);
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentTier, dailyScansUsed } = useSelector((state: RootState) => state.subscription);

  // Calculate daily totals
  const dailyTotals = dailyEntries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.nutrition.calories,
      protein: totals.protein + entry.nutrition.protein,
      carbs: totals.carbs + entry.nutrition.carbs,
      fat: totals.fat + entry.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieProgress = dailyTotals.calories / dailyGoals.calories;
  const proteinProgress = dailyTotals.protein / dailyGoals.protein;
  const carbProgress = dailyTotals.carbs / dailyGoals.carbs;
  const fatProgress = dailyTotals.fat / dailyGoals.fat;
  const waterProgress = waterIntake / dailyGoals.water;

  const renderCalorieRing = () => (
    <Card style={styles.calorieCard}>
      <Card.Content style={styles.calorieContent}>
        <View style={styles.calorieRing}>
          <Text style={styles.calorieNumber}>{dailyTotals.calories}</Text>
          <Text style={styles.calorieLabel}>calories</Text>
          <Text style={styles.calorieRemaining}>
            {Math.max(0, dailyGoals.calories - dailyTotals.calories)} remaining
          </Text>
        </View>
        <ProgressBar
          progress={Math.min(calorieProgress, 1)}
          color={calorieProgress > 1 ? COLORS.warning : COLORS.primary}
          style={styles.progressBar}
        />
      </Card.Content>
    </Card>
  );

  const renderMacroCard = (
    title: string,
    current: number,
    goal: number,
    unit: string,
    color: string
  ) => (
    <Card style={styles.macroCard}>
      <Card.Content>
        <Text style={styles.macroTitle}>{title}</Text>
        <Text style={styles.macroValue}>
          {Math.round(current)}{unit}
        </Text>
        <ProgressBar
          progress={Math.min(current / goal, 1)}
          color={color}
          style={styles.macroProgress}
        />
        <Text style={styles.macroGoal}>Goal: {goal}{unit}</Text>
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <Card style={styles.actionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            icon="camera"
          >
            Scan Food
          </Button>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            icon="microphone"
          >
            Voice Log
          </Button>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            icon="water"
          >
            Add Water
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMoodTracker = () => (
    <Card style={styles.moodCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>How are you feeling?</Text>
        <View style={styles.moodButtons}>
          {MOOD_SCALE.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              style={styles.moodButton}
              onPress={() => {}}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodLabel}>{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderSubscriptionStatus = () => {
    if (currentTier === 'basic') {
      return (
        <Card style={styles.subscriptionCard}>
          <Card.Content>
            <Text style={styles.subscriptionTitle}>Free Plan</Text>
            <Text style={styles.subscriptionText}>
              {dailyScansUsed}/5 daily scans used
            </Text>
            <ProgressBar
              progress={dailyScansUsed / 5}
              color={dailyScansUsed >= 5 ? COLORS.error : COLORS.primary}
              style={styles.subscriptionProgress}
            />
            <Button
              mode="contained"
              onPress={() => {}}
              style={styles.upgradeButton}
              buttonColor={COLORS.secondary}
            >
              Upgrade to Premium
            </Button>
          </Card.Content>
        </Card>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName || 'there'}!
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {renderSubscriptionStatus()}
        {renderCalorieRing()}

        <View style={styles.macroRow}>
          {renderMacroCard('Protein', dailyTotals.protein, dailyGoals.protein, 'g', COLORS.secondary)}
          {renderMacroCard('Carbs', dailyTotals.carbs, dailyGoals.carbs, 'g', COLORS.accent)}
        </View>

        <View style={styles.macroRow}>
          {renderMacroCard('Fat', dailyTotals.fat, dailyGoals.fat, 'g', COLORS.warning)}
          {renderMacroCard('Water', waterIntake, dailyGoals.water, ' glasses', COLORS.primary)}
        </View>

        {renderQuickActions()}
        {renderMoodTracker()}
      </ScrollView>

      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => {}}
        label="Scan"
      />
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
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  date: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  calorieCard: {
    marginBottom: 16,
  },
  calorieContent: {
    alignItems: 'center',
  },
  calorieRing: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  calorieLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  calorieRemaining: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  macroCard: {
    flex: 1,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  macroProgress: {
    height: 4,
    marginBottom: 4,
  },
  macroGoal: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  moodCard: {
    marginBottom: 16,
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodButton: {
    alignItems: 'center',
    padding: 8,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  subscriptionCard: {
    marginBottom: 16,
    backgroundColor: COLORS.warning + '20',
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  subscriptionProgress: {
    height: 4,
    marginBottom: 12,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});

export default DashboardScreen;

