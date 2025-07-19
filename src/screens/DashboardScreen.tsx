import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme, FAB, Snackbar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';

import CalorieRing from '../components/dashboard/CalorieRing';
import WaterTracker from '../components/dashboard/WaterTracker';
import MoodTracker from '../components/dashboard/MoodTracker';
import NutritionSummary from '../components/dashboard/NutritionSummary';
import { LoadingSpinner, ErrorMessage } from '../components/common';

import { RootState } from '../store';
import { updateNutritionData, updateWaterIntake, updateMoodEntry } from '../store/slices/nutritionSlice';
import { DailyStats, MoodRating, MealEntry } from '../types';
import { logger } from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { width: screenWidth } = Dimensions.get('window');

  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { 
    dailyStats, 
    isLoading, 
    error,
    lastUpdated 
  } = useSelector((state: RootState) => state.nutrition);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  // Performance monitoring
  const renderTimer = React.useRef<() => void>();

  useEffect(() => {
    renderTimer.current = performanceMonitor.startTimer('dashboard_render');
    return () => {
      if (renderTimer.current) {
        renderTimer.current();
      }
    };
  }, []);

  // Focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!dailyStats || isDataStale()) {
        loadDashboardData();
      }
      
      logger.logUserAction('dashboard_viewed', {
        hasData: !!dailyStats,
        component: 'DashboardScreen',
      });
    }, [dailyStats])
  );

  // Check if data is stale (older than 5 minutes)
  const isDataStale = useCallback((): boolean => {
    if (!lastUpdated) return true;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return new Date(lastUpdated).getTime() < fiveMinutesAgo;
  }, [lastUpdated]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const timer = performanceMonitor.startTimer('dashboard_data_load');
      
      // Dispatch action to load nutrition data
      await dispatch(updateNutritionData({
        userId: user.id,
        date: new Date().toISOString().split('T')[0],
      })).unwrap();

      timer();
      
      logger.info('Dashboard data loaded successfully', {
        userId: user.id,
        component: 'DashboardScreen',
      });
    } catch (error) {
      logger.error('Failed to load dashboard data', error as Error, {
        userId: user?.id,
        component: 'DashboardScreen',
      });
      
      showSnackbar('Failed to load dashboard data. Please try again.');
    }
  }, [user, dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Handle water intake update
  const handleWaterIntakeUpdate = useCallback(async (amount: number) => {
    if (!user) return;

    try {
      await dispatch(updateWaterIntake({
        userId: user.id,
        amount,
        timestamp: new Date().toISOString(),
      })).unwrap();

      logger.logUserAction('water_intake_updated', {
        amount,
        component: 'DashboardScreen',
      });
    } catch (error) {
      logger.error('Failed to update water intake', error as Error, {
        amount,
        component: 'DashboardScreen',
      });
      
      showSnackbar('Failed to update water intake. Please try again.');
    }
  }, [user, dispatch]);

  // Handle mood update
  const handleMoodUpdate = useCallback(async (mood: MoodRating, note?: string) => {
    if (!user) return;

    try {
      await dispatch(updateMoodEntry({
        userId: user.id,
        mood,
        note,
        timestamp: new Date().toISOString(),
      })).unwrap();

      showSnackbar(`Mood logged: ${['😢', '😕', '😐', '😊', '😄'][mood - 1]}`);
      
      logger.logUserAction('mood_updated', {
        mood,
        hasNote: !!note,
        component: 'DashboardScreen',
      });
    } catch (error) {
      logger.error('Failed to update mood', error as Error, {
        mood,
        component: 'DashboardScreen',
      });
      
      showSnackbar('Failed to log mood. Please try again.');
    }
  }, [user, dispatch]);

  // Handle meal press
  const handleMealPress = useCallback((meal: MealEntry) => {
    navigation.navigate('MealDetails', { mealId: meal.id });
  }, [navigation]);

  // Handle nutrient press
  const handleNutrientPress = useCallback((nutrient: string) => {
    navigation.navigate('NutrientDetails', { nutrient });
  }, [navigation]);

  // Handle scan navigation
  const handleScanPress = useCallback(() => {
    navigation.navigate('Scanner');
  }, [navigation]);

  // Show snackbar message
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  // Get greeting based on time of day
  const getGreeting = useCallback((): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Render loading state
  if (isLoading && !dailyStats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LoadingSpinner size="large" />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading your nutrition data...
        </Text>
      </View>
    );
  }

  // Render error state
  if (error && !dailyStats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ErrorMessage
          message={error}
          onRetry={loadDashboardData}
          showRetry
        />
      </View>
    );
  }

  // Render empty state
  if (!dailyStats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          Welcome to NutriScan Pro!
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Start by scanning your first meal
        </Text>
        <FAB
          icon="camera"
          label="Scan Food"
          onPress={handleScanPress}
          style={[styles.emptyFab, { backgroundColor: theme.colors.primary }]}
        />
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.onSurface }]}>
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Here's your nutrition overview
          </Text>
        </View>

        {/* Calorie Ring */}
        <View style={styles.section}>
          <CalorieRing
            progress={dailyStats.progress}
            size={Math.min(screenWidth * 0.6, 240)}
            animated
          />
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStats}>
          <View style={[styles.quickStatItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.quickStatValue, { color: theme.colors.primary }]}>
              {dailyStats.scanCount}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.onSurfaceVariant }]}>
              Scans Today
            </Text>
          </View>
          
          <View style={[styles.quickStatItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.quickStatValue, { color: theme.colors.secondary }]}>
              {Math.round(dailyStats.accuracyRate * 100)}%
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.onSurfaceVariant }]}>
              Accuracy
            </Text>
          </View>
          
          <View style={[styles.quickStatItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.quickStatValue, { color: theme.colors.tertiary }]}>
              {dailyStats.meals.length}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme.colors.onSurfaceVariant }]}>
              Meals
            </Text>
          </View>
        </View>

        {/* Water Tracker */}
        <View style={styles.section}>
          <WaterTracker
            currentIntake={dailyStats.water}
            dailyGoal={dailyStats.goals.water}
            onIntakeUpdate={handleWaterIntakeUpdate}
            showChart={false}
            animated
          />
        </View>

        {/* Mood Tracker */}
        <View style={styles.section}>
          <MoodTracker
            currentMood={dailyStats.mood}
            onMoodUpdate={handleMoodUpdate}
            showChart={false}
            showInsights={false}
            animated
          />
        </View>

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <NutritionSummary
            dailyStats={dailyStats}
            onMealPress={handleMealPress}
            onNutrientPress={handleNutrientPress}
            showMacroBreakdown
            showMealBreakdown
            animated
          />
        </View>

        {/* Bottom spacing for FAB */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="camera"
        onPress={handleScanPress}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        label="Scan"
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.inverseSurface }}
      >
        {snackbarMessage}
      </Snackbar>
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyFab: {
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default DashboardScreen;

