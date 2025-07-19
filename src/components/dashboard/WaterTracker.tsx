import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme, IconButton, Button, Chip } from 'react-native-paper';
import { VictoryArea, VictoryChart, VictoryAxis, VictoryContainer } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { logger } from '../../utils/logger';
import { validateWaterIntake } from '../../utils/validation';

interface WaterTrackerProps {
  currentIntake: number; // ml
  dailyGoal: number; // ml
  onIntakeUpdate: (amount: number) => void;
  onGoalUpdate?: (goal: number) => void;
  hourlyData?: Array<{ hour: number; amount: number }>;
  showChart?: boolean;
  animated?: boolean;
}

interface WaterPreset {
  label: string;
  amount: number; // ml
  icon: string;
}

const WATER_PRESETS: WaterPreset[] = [
  { label: 'Glass', amount: 250, icon: 'cup' },
  { label: 'Bottle', amount: 500, icon: 'bottle-wine' },
  { label: 'Large', amount: 750, icon: 'bottle-wine-outline' },
  { label: 'Custom', amount: 0, icon: 'plus' },
];

const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentIntake,
  dailyGoal,
  onIntakeUpdate,
  onGoalUpdate,
  hourlyData = [],
  showChart = true,
  animated = true,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  
  const [animatedValue] = useState(new Animated.Value(0));
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate progress
  const progress = Math.min((currentIntake / dailyGoal) * 100, 100);
  const remainingAmount = Math.max(0, dailyGoal - currentIntake);
  const isGoalReached = currentIntake >= dailyGoal;

  // Animate water level
  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated, animatedValue]);

  // Handle water intake addition
  const handleAddWater = useCallback(async (amount: number) => {
    if (isAnimating) return;

    try {
      // Validate input
      const validation = validateWaterIntake(amount);
      if (!validation.isValid) {
        Alert.alert('Invalid Amount', validation.errors[0]?.message || 'Please enter a valid amount');
        return;
      }

      setIsAnimating(true);
      
      // Log user action
      logger.logUserAction('water_intake_added', {
        amount,
        currentIntake,
        progress: progress.toFixed(1),
        component: 'WaterTracker',
      });

      // Update intake
      onIntakeUpdate(currentIntake + amount);

      // Show celebration if goal reached
      if (!isGoalReached && (currentIntake + amount) >= dailyGoal) {
        setTimeout(() => {
          Alert.alert(
            '🎉 Goal Reached!',
            'Congratulations! You\'ve reached your daily water goal.',
            [{ text: 'Great!', style: 'default' }]
          );
        }, 1200);
      }

    } catch (error) {
      logger.error('Failed to add water intake', error as Error, {
        amount,
        component: 'WaterTracker',
      });
      Alert.alert('Error', 'Failed to update water intake. Please try again.');
    } finally {
      setTimeout(() => setIsAnimating(false), 1000);
    }
  }, [currentIntake, dailyGoal, isGoalReached, onIntakeUpdate, progress, isAnimating]);

  // Handle custom amount input
  const handleCustomAmount = useCallback(() => {
    Alert.prompt(
      'Custom Amount',
      'Enter the amount of water (ml):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (value) => {
            const amount = parseInt(value || '0', 10);
            if (amount > 0) {
              handleAddWater(amount);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  }, [handleAddWater]);

  // Handle undo last entry
  const handleUndo = useCallback(() => {
    if (currentIntake > 0) {
      Alert.alert(
        'Undo Last Entry',
        'Remove the last water intake entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Undo',
            style: 'destructive',
            onPress: () => {
              // This would ideally remove the last specific entry
              // For now, we'll subtract a standard glass amount
              const undoAmount = Math.min(250, currentIntake);
              onIntakeUpdate(currentIntake - undoAmount);
              
              logger.logUserAction('water_intake_undone', {
                undoAmount,
                newIntake: currentIntake - undoAmount,
                component: 'WaterTracker',
              });
            },
          },
        ]
      );
    }
  }, [currentIntake, onIntakeUpdate]);

  // Get water level color
  const getWaterColor = useCallback(() => {
    if (isGoalReached) {
      return theme.colors.primary;
    } else if (progress > 75) {
      return theme.colors.tertiary;
    } else if (progress > 50) {
      return theme.colors.secondary;
    } else {
      return theme.colors.outline;
    }
  }, [isGoalReached, progress, theme.colors]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!showChart || hourlyData.length === 0) return [];
    
    return hourlyData.map((data, index) => ({
      x: data.hour,
      y: data.amount,
      y0: 0,
    }));
  }, [hourlyData, showChart]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Water Intake
        </Text>
        <IconButton
          icon="undo"
          size={20}
          onPress={handleUndo}
          disabled={currentIntake === 0}
          iconColor={currentIntake > 0 ? theme.colors.primary : theme.colors.outline}
        />
      </View>

      {/* Water Bottle Visualization */}
      <View style={styles.bottleContainer}>
        <View style={[styles.bottle, { borderColor: theme.colors.outline }]}>
          <Animated.View
            style={[
              styles.waterLevel,
              {
                backgroundColor: getWaterColor(),
                height: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
          
          {/* Measurement lines */}
          {[25, 50, 75].map((percentage) => (
            <View
              key={percentage}
              style={[
                styles.measurementLine,
                {
                  bottom: `${percentage}%`,
                  backgroundColor: theme.colors.outline,
                },
              ]}
            />
          ))}
        </View>

        {/* Progress text */}
        <View style={styles.progressContainer}>
          <Text style={[styles.currentAmount, { color: theme.colors.primary }]}>
            {Math.round(currentIntake)}ml
          </Text>
          <Text style={[styles.goalAmount, { color: theme.colors.onSurfaceVariant }]}>
            of {dailyGoal}ml
          </Text>
          <Text style={[styles.percentage, { color: getWaterColor() }]}>
            {Math.round(progress)}%
          </Text>
          
          {remainingAmount > 0 && (
            <Text style={[styles.remaining, { color: theme.colors.onSurfaceVariant }]}>
              {Math.round(remainingAmount)}ml remaining
            </Text>
          )}
          
          {isGoalReached && (
            <Chip
              icon="check-circle"
              style={[styles.goalChip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: theme.colors.onPrimaryContainer }}
            >
              Goal Reached!
            </Chip>
          )}
        </View>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.presetsContainer}>
        <Text style={[styles.presetsTitle, { color: theme.colors.onSurface }]}>
          Quick Add
        </Text>
        <View style={styles.presetButtons}>
          {WATER_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetButton,
                { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outline,
                },
              ]}
              onPress={() => {
                if (preset.amount === 0) {
                  handleCustomAmount();
                } else {
                  handleAddWater(preset.amount);
                }
              }}
              disabled={isAnimating}
            >
              <Icon
                name={preset.icon}
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.presetLabel, { color: theme.colors.onSurfaceVariant }]}>
                {preset.label}
              </Text>
              {preset.amount > 0 && (
                <Text style={[styles.presetAmount, { color: theme.colors.onSurfaceVariant }]}>
                  {preset.amount}ml
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Hourly Chart */}
      {showChart && chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            Today's Intake
          </Text>
          <VictoryChart
            width={screenWidth - 32}
            height={120}
            padding={{ left: 40, right: 20, top: 10, bottom: 30 }}
            containerComponent={<VictoryContainer />}
          >
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => `${t}ml`}
              style={{
                tickLabels: { fontSize: 10, fill: theme.colors.onSurfaceVariant },
                grid: { stroke: theme.colors.outline, strokeWidth: 0.5 },
              }}
            />
            <VictoryAxis
              tickFormat={(t) => `${t}h`}
              style={{
                tickLabels: { fontSize: 10, fill: theme.colors.onSurfaceVariant },
                axis: { stroke: theme.colors.outline },
              }}
            />
            <VictoryArea
              data={chartData}
              style={{
                data: {
                  fill: theme.colors.primary,
                  fillOpacity: 0.3,
                  stroke: theme.colors.primary,
                  strokeWidth: 2,
                },
              }}
              animate={animated ? { duration: 1000 } : false}
            />
          </VictoryChart>
        </View>
      )}

      {/* Goal Settings */}
      {onGoalUpdate && (
        <View style={styles.goalSettings}>
          <Button
            mode="outlined"
            onPress={() => {
              Alert.prompt(
                'Daily Goal',
                'Set your daily water goal (ml):',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Set',
                    onPress: (value) => {
                      const goal = parseInt(value || '0', 10);
                      if (goal > 0 && goal <= 5000) {
                        onGoalUpdate(goal);
                        logger.logUserAction('water_goal_updated', {
                          newGoal: goal,
                          previousGoal: dailyGoal,
                          component: 'WaterTracker',
                        });
                      }
                    },
                  },
                ],
                'plain-text',
                dailyGoal.toString(),
                'numeric'
              );
            }}
            icon="target"
            style={styles.goalButton}
          >
            Adjust Goal ({dailyGoal}ml)
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  bottle: {
    width: 80,
    height: 200,
    borderWidth: 3,
    borderRadius: 40,
    position: 'relative',
    overflow: 'hidden',
    marginRight: 24,
  },
  waterLevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 37,
  },
  measurementLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  progressContainer: {
    alignItems: 'flex-start',
  },
  currentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  goalAmount: {
    fontSize: 16,
    marginTop: 4,
  },
  percentage: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  remaining: {
    fontSize: 14,
    marginTop: 4,
  },
  goalChip: {
    marginTop: 12,
  },
  presetsContainer: {
    marginBottom: 24,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  presetAmount: {
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalSettings: {
    alignItems: 'center',
  },
  goalButton: {
    marginTop: 8,
  },
});

export default WaterTracker;

