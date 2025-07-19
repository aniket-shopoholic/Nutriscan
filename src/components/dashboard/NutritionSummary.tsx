import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme, Card, Chip, ProgressBar } from 'react-native-paper';
import { VictoryPie, VictoryContainer, VictoryLabel } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { DailyStats, NutritionProgress, ProgressMetric, MealEntry } from '../../types';
import { logger } from '../../utils/logger';

interface NutritionSummaryProps {
  dailyStats: DailyStats;
  onMealPress?: (meal: MealEntry) => void;
  onNutrientPress?: (nutrient: string) => void;
  showMacroBreakdown?: boolean;
  showMealBreakdown?: boolean;
  animated?: boolean;
}

interface MacroData {
  x: string;
  y: number;
  color: string;
  label: string;
}

const NutritionSummary: React.FC<NutritionSummaryProps> = ({
  dailyStats,
  onMealPress,
  onNutrientPress,
  showMacroBreakdown = true,
  showMealBreakdown = true,
  animated = true,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = Dimensions.get('window');

  // Calculate macro breakdown data
  const macroData = React.useMemo((): MacroData[] => {
    const { nutrition } = dailyStats;
    const totalMacros = nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fat * 9;
    
    if (totalMacros === 0) {
      return [
        { x: 'Empty', y: 1, color: theme.colors.surfaceVariant, label: 'No data' },
      ];
    }

    return [
      {
        x: 'Protein',
        y: nutrition.protein * 4,
        color: theme.colors.secondary,
        label: `${Math.round((nutrition.protein * 4 / totalMacros) * 100)}%`,
      },
      {
        x: 'Carbs',
        y: nutrition.carbs * 4,
        color: theme.colors.tertiary,
        label: `${Math.round((nutrition.carbs * 4 / totalMacros) * 100)}%`,
      },
      {
        x: 'Fat',
        y: nutrition.fat * 9,
        color: theme.colors.primary,
        label: `${Math.round((nutrition.fat * 9 / totalMacros) * 100)}%`,
      },
    ].filter(item => item.y > 0);
  }, [dailyStats.nutrition, theme.colors]);

  // Group meals by type
  const mealsByType = React.useMemo(() => {
    return dailyStats.meals.reduce((groups, meal) => {
      const type = meal.mealType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(meal);
      return groups;
    }, {} as Record<string, MealEntry[]>);
  }, [dailyStats.meals]);

  // Get progress color based on status
  const getProgressColor = (progress: ProgressMetric): string => {
    switch (progress.status) {
      case 'under':
        return theme.colors.error;
      case 'on_track':
        return theme.colors.primary;
      case 'over':
        return theme.colors.secondary;
      case 'exceeded':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'under':
        return 'arrow-down';
      case 'on_track':
        return 'check';
      case 'over':
        return 'arrow-up';
      case 'exceeded':
        return 'alert';
      default:
        return 'minus';
    }
  };

  // Handle nutrient press
  const handleNutrientPress = (nutrient: string) => {
    logger.logUserAction('nutrition_summary_nutrient_pressed', {
      nutrient,
      component: 'NutritionSummary',
    });
    onNutrientPress?.(nutrient);
  };

  // Handle meal press
  const handleMealPress = (meal: MealEntry) => {
    logger.logUserAction('nutrition_summary_meal_pressed', {
      mealType: meal.mealType,
      mealId: meal.id,
      component: 'NutritionSummary',
    });
    onMealPress?.(meal);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Today's Nutrition
        </Text>
        <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
          {new Date(dailyStats.date).toLocaleDateString()}
        </Text>
      </View>

      {/* Calorie Overview */}
      <Card style={[styles.calorieCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.calorieHeader}>
            <Text style={[styles.calorieTitle, { color: theme.colors.onSurface }]}>
              Calories
            </Text>
            <Chip
              icon={() => (
                <Icon
                  name={getStatusIcon(dailyStats.progress.calories.status)}
                  size={16}
                  color={getProgressColor(dailyStats.progress.calories)}
                />
              )}
              style={[
                styles.statusChip,
                { backgroundColor: getProgressColor(dailyStats.progress.calories) + '20' }
              ]}
              textStyle={{ color: getProgressColor(dailyStats.progress.calories) }}
            >
              {dailyStats.progress.calories.status.replace('_', ' ')}
            </Chip>
          </View>
          
          <View style={styles.calorieNumbers}>
            <Text style={[styles.currentCalories, { color: theme.colors.primary }]}>
              {Math.round(dailyStats.nutrition.calories)}
            </Text>
            <Text style={[styles.goalCalories, { color: theme.colors.onSurfaceVariant }]}>
              / {Math.round(dailyStats.goals.dailyCalories)} kcal
            </Text>
          </View>
          
          <ProgressBar
            progress={Math.min(dailyStats.progress.calories.percentage / 100, 1)}
            color={getProgressColor(dailyStats.progress.calories)}
            style={styles.calorieProgress}
          />
          
          <Text style={[styles.remainingText, { color: theme.colors.onSurfaceVariant }]}>
            {dailyStats.progress.calories.current < dailyStats.progress.calories.goal
              ? `${Math.round(dailyStats.progress.calories.goal - dailyStats.progress.calories.current)} kcal remaining`
              : `${Math.round(dailyStats.progress.calories.current - dailyStats.progress.calories.goal)} kcal over goal`
            }
          </Text>
        </Card.Content>
      </Card>

      {/* Macro Breakdown */}
      {showMacroBreakdown && (
        <Card style={[styles.macroCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Macronutrients
            </Text>
            
            <View style={styles.macroContent}>
              {/* Pie Chart */}
              <View style={styles.macroChart}>
                <VictoryPie
                  data={macroData}
                  width={120}
                  height={120}
                  innerRadius={30}
                  padAngle={2}
                  colorScale={macroData.map(d => d.color)}
                  animate={animated ? { duration: 1000 } : false}
                  labelComponent={<VictoryLabel style={{ display: 'none' }} />}
                />
              </View>
              
              {/* Macro Details */}
              <View style={styles.macroDetails}>
                {[
                  { key: 'protein', label: 'Protein', unit: 'g', progress: dailyStats.progress.protein },
                  { key: 'carbs', label: 'Carbs', unit: 'g', progress: dailyStats.progress.carbs },
                  { key: 'fat', label: 'Fat', unit: 'g', progress: dailyStats.progress.fat },
                ].map((macro) => (
                  <TouchableOpacity
                    key={macro.key}
                    style={styles.macroItem}
                    onPress={() => handleNutrientPress(macro.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.macroItemHeader}>
                      <View style={[
                        styles.macroIndicator,
                        { backgroundColor: getProgressColor(macro.progress) }
                      ]} />
                      <Text style={[styles.macroLabel, { color: theme.colors.onSurface }]}>
                        {macro.label}
                      </Text>
                      <Text style={[styles.macroValue, { color: theme.colors.onSurfaceVariant }]}>
                        {Math.round(macro.progress.current)}{macro.unit}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.min(macro.progress.percentage / 100, 1)}
                      color={getProgressColor(macro.progress)}
                      style={styles.macroProgress}
                    />
                    <Text style={[styles.macroGoal, { color: theme.colors.onSurfaceVariant }]}>
                      Goal: {Math.round(macro.progress.goal)}{macro.unit} ({Math.round(macro.progress.percentage)}%)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Other Nutrients */}
      <Card style={[styles.nutrientsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Other Nutrients
          </Text>
          
          <View style={styles.nutrientGrid}>
            {[
              { key: 'fiber', label: 'Fiber', value: dailyStats.nutrition.fiber, unit: 'g', goal: dailyStats.goals.fiber },
              { key: 'sugar', label: 'Sugar', value: dailyStats.nutrition.sugar, unit: 'g', goal: dailyStats.goals.sugar },
              { key: 'sodium', label: 'Sodium', value: dailyStats.nutrition.sodium, unit: 'mg', goal: dailyStats.goals.sodium },
              { key: 'water', label: 'Water', value: dailyStats.water, unit: 'ml', goal: dailyStats.goals.water },
            ].map((nutrient) => {
              const percentage = (nutrient.value / nutrient.goal) * 100;
              const status = percentage < 50 ? 'under' : percentage <= 100 ? 'on_track' : 'over';
              
              return (
                <TouchableOpacity
                  key={nutrient.key}
                  style={[styles.nutrientItem, { borderColor: theme.colors.outline }]}
                  onPress={() => handleNutrientPress(nutrient.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.nutrientLabel, { color: theme.colors.onSurface }]}>
                    {nutrient.label}
                  </Text>
                  <Text style={[styles.nutrientValue, { color: theme.colors.primary }]}>
                    {Math.round(nutrient.value)}
                  </Text>
                  <Text style={[styles.nutrientUnit, { color: theme.colors.onSurfaceVariant }]}>
                    {nutrient.unit}
                  </Text>
                  <Text style={[styles.nutrientPercentage, { color: getProgressColor({ status } as ProgressMetric) }]}>
                    {Math.round(percentage)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      {/* Meal Breakdown */}
      {showMealBreakdown && Object.keys(mealsByType).length > 0 && (
        <Card style={[styles.mealsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Meals Today
            </Text>
            
            <View style={styles.mealsList}>
              {Object.entries(mealsByType).map(([mealType, meals]) => {
                const totalCalories = meals.reduce((sum, meal) => sum + meal.totalNutrition.calories, 0);
                const mealCount = meals.length;
                
                return (
                  <TouchableOpacity
                    key={mealType}
                    style={[styles.mealItem, { borderColor: theme.colors.outline }]}
                    onPress={() => meals[0] && handleMealPress(meals[0])}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mealHeader}>
                      <Text style={[styles.mealType, { color: theme.colors.onSurface }]}>
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </Text>
                      <Text style={[styles.mealCalories, { color: theme.colors.primary }]}>
                        {Math.round(totalCalories)} kcal
                      </Text>
                    </View>
                    <Text style={[styles.mealCount, { color: theme.colors.onSurfaceVariant }]}>
                      {mealCount} item{mealCount !== 1 ? 's' : ''}
                    </Text>
                    {meals[0]?.mood && (
                      <Text style={[styles.mealMood, { color: theme.colors.onSurfaceVariant }]}>
                        Mood: {['😢', '😕', '😐', '😊', '😄'][meals[0].mood - 1]}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Quick Stats */}
      <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Quick Stats
          </Text>
          
          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <Icon name="camera" size={20} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Scans Today
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {dailyStats.scanCount}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="target" size={20} color={theme.colors.secondary} />
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Accuracy Rate
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {Math.round(dailyStats.accuracyRate * 100)}%
              </Text>
            </View>
            
            {dailyStats.weight && (
              <View style={styles.statItem}>
                <Icon name="scale" size={20} color={theme.colors.tertiary} />
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Weight
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                  {dailyStats.weight.toFixed(1)} kg
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  calorieCard: {
    marginBottom: 16,
    elevation: 2,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  calorieNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentCalories: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  goalCalories: {
    fontSize: 16,
    marginLeft: 8,
  },
  calorieProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  macroCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  macroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroChart: {
    marginRight: 16,
  },
  macroDetails: {
    flex: 1,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  macroLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macroProgress: {
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  macroGoal: {
    fontSize: 12,
  },
  nutrientsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutrientItem: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutrientUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  nutrientPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mealsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  mealsList: {
    gap: 8,
  },
  mealItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealCount: {
    fontSize: 12,
  },
  mealMood: {
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsList: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NutritionSummary;

