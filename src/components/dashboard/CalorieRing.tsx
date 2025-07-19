import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie, VictoryContainer, VictoryLabel } from 'victory-native';
import { useTheme } from 'react-native-paper';

import { NutritionProgress, ProgressMetric } from '../../types';
import { logger } from '../../utils/logger';

interface CalorieRingProps {
  progress: NutritionProgress;
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  animated?: boolean;
}

interface RingData {
  x: string;
  y: number;
  color: string;
}

const CalorieRing: React.FC<CalorieRingProps> = ({
  progress,
  size = 200,
  strokeWidth = 20,
  showLabels = true,
  animated = true,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  
  // Calculate responsive size
  const ringSize = Math.min(size, screenWidth * 0.6);
  const innerRadius = (ringSize / 2) - strokeWidth;
  const outerRadius = ringSize / 2;

  // Prepare data for the calorie ring
  const calorieData = React.useMemo((): RingData[] => {
    const { calories } = progress;
    const consumed = Math.min(calories.current, calories.goal);
    const remaining = Math.max(0, calories.goal - calories.current);
    const excess = Math.max(0, calories.current - calories.goal);

    const data: RingData[] = [];

    // Consumed calories (up to goal)
    if (consumed > 0) {
      data.push({
        x: 'consumed',
        y: consumed,
        color: getCalorieColor(calories),
      });
    }

    // Remaining calories
    if (remaining > 0) {
      data.push({
        x: 'remaining',
        y: remaining,
        color: theme.colors.surfaceVariant,
      });
    }

    // Excess calories (over goal)
    if (excess > 0) {
      data.push({
        x: 'excess',
        y: excess,
        color: theme.colors.error,
      });
    }

    // Ensure we always have data for the ring
    if (data.length === 0) {
      data.push({
        x: 'empty',
        y: 1,
        color: theme.colors.surfaceVariant,
      });
    }

    return data;
  }, [progress.calories, theme.colors]);

  // Get color based on calorie progress
  const getCalorieColor = (calories: ProgressMetric): string => {
    const percentage = calories.percentage;
    
    if (percentage < 50) {
      return theme.colors.error; // Too low
    } else if (percentage <= 85) {
      return theme.colors.primary; // Good range
    } else if (percentage <= 100) {
      return theme.colors.tertiary; // Close to goal
    } else if (percentage <= 120) {
      return theme.colors.secondary; // Slightly over
    } else {
      return theme.colors.error; // Way over
    }
  };

  // Calculate center text values
  const centerText = React.useMemo(() => {
    const { calories } = progress;
    const percentage = Math.round(calories.percentage);
    const current = Math.round(calories.current);
    const goal = Math.round(calories.goal);

    return {
      percentage: `${percentage}%`,
      calories: `${current}`,
      goal: `of ${goal}`,
      status: calories.status,
    };
  }, [progress.calories]);

  // Log performance
  React.useEffect(() => {
    logger.logPerformance('calorie_ring_render', Date.now(), 'ms', {
      component: 'CalorieRing',
      dataPoints: calorieData.length,
    });
  }, [calorieData.length]);

  return (
    <View style={[styles.container, { width: ringSize, height: ringSize }]}>
      <VictoryContainer
        width={ringSize}
        height={ringSize}
        style={styles.chartContainer}
      >
        <VictoryPie
          data={calorieData}
          width={ringSize}
          height={ringSize}
          innerRadius={innerRadius}
          padAngle={2}
          colorScale={calorieData.map(d => d.color)}
          animate={animated ? {
            duration: 1000,
            onLoad: { duration: 500 }
          } : false}
          labelComponent={<VictoryLabel style={{ display: 'none' }} />}
          events={[
            {
              target: 'data',
              eventHandlers: {
                onPressIn: () => {
                  logger.logUserAction('calorie_ring_pressed', {
                    component: 'CalorieRing',
                    progress: progress.calories.percentage,
                  });
                  return [];
                },
              },
            },
          ]}
        />
      </VictoryContainer>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={[styles.percentageText, { color: theme.colors.primary }]}>
          {centerText.percentage}
        </Text>
        <Text style={[styles.caloriesText, { color: theme.colors.onSurface }]}>
          {centerText.calories}
        </Text>
        <Text style={[styles.goalText, { color: theme.colors.onSurfaceVariant }]}>
          {centerText.goal}
        </Text>
        <Text style={[styles.statusText, { color: getStatusColor(centerText.status) }]}>
          {getStatusLabel(centerText.status)}
        </Text>
      </View>

      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <MacroLabel
            label="Protein"
            progress={progress.protein}
            color={theme.colors.secondary}
          />
          <MacroLabel
            label="Carbs"
            progress={progress.carbs}
            color={theme.colors.tertiary}
          />
          <MacroLabel
            label="Fat"
            progress={progress.fat}
            color={theme.colors.primary}
          />
        </View>
      )}
    </View>
  );

  function getStatusColor(status: string): string {
    switch (status) {
      case 'under':
        return theme.colors.error;
      case 'on_track':
        return theme.colors.primary;
      case 'over':
        return theme.colors.secondary;
      case 'exceeded':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'under':
        return 'Under Goal';
      case 'on_track':
        return 'On Track';
      case 'over':
        return 'Over Goal';
      case 'exceeded':
        return 'Exceeded';
      default:
        return '';
    }
  }
};

// Macro nutrient label component
interface MacroLabelProps {
  label: string;
  progress: ProgressMetric;
  color: string;
}

const MacroLabel: React.FC<MacroLabelProps> = ({ label, progress, color }) => {
  const theme = useTheme();
  
  return (
    <View style={styles.macroLabel}>
      <View style={[styles.macroIndicator, { backgroundColor: color }]} />
      <Text style={[styles.macroLabelText, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      <Text style={[styles.macroValue, { color: theme.colors.onSurfaceVariant }]}>
        {Math.round(progress.current)}g
      </Text>
      <Text style={[styles.macroPercentage, { color: color }]}>
        {Math.round(progress.percentage)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chartContainer: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  caloriesText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  goalText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  labelsContainer: {
    marginTop: 20,
    width: '100%',
  },
  macroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  macroLabelText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 14,
    marginRight: 8,
  },
  macroPercentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});

export default CalorieRing;

