import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme, Card, Button, Chip } from 'react-native-paper';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryScatter, VictoryContainer } from 'victory-native';

import { MoodRating } from '../../types';
import { logger } from '../../utils/logger';

interface MoodEntry {
  date: string;
  mood: MoodRating;
  note?: string;
  timestamp: string;
}

interface MoodTrackerProps {
  currentMood?: MoodRating;
  onMoodUpdate: (mood: MoodRating, note?: string) => void;
  moodHistory?: MoodEntry[];
  showChart?: boolean;
  showInsights?: boolean;
  animated?: boolean;
}

interface MoodOption {
  rating: MoodRating;
  emoji: string;
  label: string;
  color: string;
  description: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    rating: 1,
    emoji: '😢',
    label: 'Very Bad',
    color: '#FF5252',
    description: 'Feeling really down today',
  },
  {
    rating: 2,
    emoji: '😕',
    label: 'Bad',
    color: '#FF9800',
    description: 'Not having a great day',
  },
  {
    rating: 3,
    emoji: '😐',
    label: 'Okay',
    color: '#FFC107',
    description: 'Feeling neutral',
  },
  {
    rating: 4,
    emoji: '😊',
    label: 'Good',
    color: '#4CAF50',
    description: 'Having a good day',
  },
  {
    rating: 5,
    emoji: '😄',
    label: 'Excellent',
    color: '#2196F3',
    description: 'Feeling amazing!',
  },
];

const MoodTracker: React.FC<MoodTrackerProps> = ({
  currentMood,
  onMoodUpdate,
  moodHistory = [],
  showChart = true,
  showInsights = true,
  animated = true,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  
  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(currentMood || null);
  const [animatedValues] = useState(
    MOOD_OPTIONS.map(() => new Animated.Value(0))
  );

  // Animate mood options on mount
  React.useEffect(() => {
    if (animated) {
      const animations = animatedValues.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(100, animations).start();
    } else {
      animatedValues.forEach(value => value.setValue(1));
    }
  }, [animated, animatedValues]);

  // Handle mood selection
  const handleMoodSelect = useCallback((mood: MoodRating) => {
    setSelectedMood(mood);
    
    // Animate selection
    if (animated) {
      const selectedIndex = MOOD_OPTIONS.findIndex(option => option.rating === mood);
      Animated.sequence([
        Animated.timing(animatedValues[selectedIndex], {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues[selectedIndex], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    logger.logUserAction('mood_selected', {
      mood,
      component: 'MoodTracker',
    });
  }, [animated, animatedValues]);

  // Handle mood submission
  const handleMoodSubmit = useCallback((note?: string) => {
    if (selectedMood) {
      onMoodUpdate(selectedMood, note);
      
      logger.logUserAction('mood_logged', {
        mood: selectedMood,
        hasNote: !!note,
        component: 'MoodTracker',
      });
    }
  }, [selectedMood, onMoodUpdate]);

  // Calculate mood statistics
  const moodStats = React.useMemo(() => {
    if (moodHistory.length === 0) {
      return {
        average: 0,
        trend: 'stable',
        mostCommon: null,
        streak: 0,
      };
    }

    const ratings = moodHistory.map(entry => entry.mood);
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    // Calculate trend (last 7 days vs previous 7 days)
    const recent = ratings.slice(-7);
    const previous = ratings.slice(-14, -7);
    const recentAvg = recent.reduce((sum, rating) => sum + rating, 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, rating) => sum + rating, 0) / previous.length 
      : recentAvg;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentAvg > previousAvg + 0.2) trend = 'improving';
    else if (recentAvg < previousAvg - 0.2) trend = 'declining';

    // Find most common mood
    const moodCounts = ratings.reduce((counts, rating) => {
      counts[rating] = (counts[rating] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);
    
    const mostCommon = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Calculate current streak of good moods (4+)
    let streak = 0;
    for (let i = ratings.length - 1; i >= 0; i--) {
      if (ratings[i] >= 4) {
        streak++;
      } else {
        break;
      }
    }

    return {
      average: Math.round(average * 10) / 10,
      trend,
      mostCommon: mostCommon ? parseInt(mostCommon) as MoodRating : null,
      streak,
    };
  }, [moodHistory]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!showChart || moodHistory.length === 0) return [];
    
    return moodHistory.slice(-30).map((entry, index) => ({
      x: index + 1,
      y: entry.mood,
      date: entry.date,
    }));
  }, [moodHistory, showChart]);

  // Get mood option by rating
  const getMoodOption = (rating: MoodRating) => 
    MOOD_OPTIONS.find(option => option.rating === rating);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          How are you feeling?
        </Text>
        {currentMood && (
          <Chip
            icon={() => (
              <Text style={styles.chipEmoji}>
                {getMoodOption(currentMood)?.emoji}
              </Text>
            )}
            style={[
              styles.currentMoodChip,
              { backgroundColor: getMoodOption(currentMood)?.color + '20' }
            ]}
            textStyle={{ color: getMoodOption(currentMood)?.color }}
          >
            {getMoodOption(currentMood)?.label}
          </Chip>
        )}
      </View>

      {/* Mood Selection */}
      <Card style={[styles.selectionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.moodOptions}>
            {MOOD_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.rating}
                style={[
                  styles.moodOptionContainer,
                  {
                    transform: [
                      {
                        scale: animatedValues[index],
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.moodOption,
                    {
                      backgroundColor: selectedMood === option.rating 
                        ? option.color + '20' 
                        : theme.colors.surfaceVariant,
                      borderColor: selectedMood === option.rating 
                        ? option.color 
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleMoodSelect(option.rating)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    {
                      color: selectedMood === option.rating 
                        ? option.color 
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {selectedMood && (
            <View style={styles.selectedMoodInfo}>
              <Text style={[styles.selectedDescription, { color: theme.colors.onSurfaceVariant }]}>
                {getMoodOption(selectedMood)?.description}
              </Text>
              <Button
                mode="contained"
                onPress={() => handleMoodSubmit()}
                style={[
                  styles.submitButton,
                  { backgroundColor: getMoodOption(selectedMood)?.color }
                ]}
                labelStyle={{ color: 'white' }}
              >
                Log Mood
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Mood Chart */}
      {showChart && chartData.length > 0 && (
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Mood Trend (Last 30 Days)
            </Text>
            <VictoryChart
              width={screenWidth - 64}
              height={200}
              padding={{ left: 50, right: 20, top: 20, bottom: 40 }}
              containerComponent={<VictoryContainer />}
            >
              <VictoryAxis
                dependentAxis
                domain={[1, 5]}
                tickCount={5}
                tickFormat={(t) => {
                  const option = getMoodOption(t as MoodRating);
                  return option ? option.emoji : t.toString();
                }}
                style={{
                  tickLabels: { fontSize: 16 },
                  grid: { stroke: theme.colors.outline, strokeWidth: 0.5 },
                }}
              />
              <VictoryAxis
                tickFormat={() => ''}
                style={{
                  axis: { stroke: theme.colors.outline },
                }}
              />
              <VictoryLine
                data={chartData}
                style={{
                  data: {
                    stroke: theme.colors.primary,
                    strokeWidth: 3,
                  },
                }}
                animate={animated ? { duration: 1000 } : false}
              />
              <VictoryScatter
                data={chartData}
                size={4}
                style={{
                  data: {
                    fill: theme.colors.primary,
                  },
                }}
                animate={animated ? { duration: 1000 } : false}
              />
            </VictoryChart>
          </Card.Content>
        </Card>
      )}

      {/* Mood Insights */}
      {showInsights && moodHistory.length > 0 && (
        <Card style={[styles.insightsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.insightsTitle, { color: theme.colors.onSurface }]}>
              Mood Insights
            </Text>
            
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Average Mood
                </Text>
                <View style={styles.insightValue}>
                  <Text style={[styles.insightNumber, { color: theme.colors.primary }]}>
                    {moodStats.average}
                  </Text>
                  <Text style={styles.insightEmoji}>
                    {getMoodOption(Math.round(moodStats.average) as MoodRating)?.emoji}
                  </Text>
                </View>
              </View>

              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Trend
                </Text>
                <Chip
                  style={[
                    styles.trendChip,
                    {
                      backgroundColor: moodStats.trend === 'improving' 
                        ? theme.colors.primaryContainer
                        : moodStats.trend === 'declining'
                        ? theme.colors.errorContainer
                        : theme.colors.surfaceVariant,
                    },
                  ]}
                  textStyle={{
                    color: moodStats.trend === 'improving' 
                      ? theme.colors.onPrimaryContainer
                      : moodStats.trend === 'declining'
                      ? theme.colors.onErrorContainer
                      : theme.colors.onSurfaceVariant,
                  }}
                >
                  {moodStats.trend === 'improving' ? '📈 Improving' :
                   moodStats.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                </Chip>
              </View>

              {moodStats.mostCommon && (
                <View style={styles.insightItem}>
                  <Text style={[styles.insightLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Most Common
                  </Text>
                  <View style={styles.insightValue}>
                    <Text style={styles.insightEmoji}>
                      {getMoodOption(moodStats.mostCommon)?.emoji}
                    </Text>
                    <Text style={[styles.insightText, { color: theme.colors.onSurface }]}>
                      {getMoodOption(moodStats.mostCommon)?.label}
                    </Text>
                  </View>
                </View>
              )}

              {moodStats.streak > 0 && (
                <View style={styles.insightItem}>
                  <Text style={[styles.insightLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Good Mood Streak
                  </Text>
                  <View style={styles.insightValue}>
                    <Text style={[styles.insightNumber, { color: theme.colors.primary }]}>
                      {moodStats.streak}
                    </Text>
                    <Text style={[styles.insightText, { color: theme.colors.onSurface }]}>
                      days
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  currentMoodChip: {
    marginLeft: 8,
  },
  chipEmoji: {
    fontSize: 16,
  },
  selectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodOptionContainer: {
    flex: 1,
    marginHorizontal: 2,
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedMoodInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  selectedDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    paddingHorizontal: 24,
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 14,
    flex: 1,
  },
  insightValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightEmoji: {
    fontSize: 20,
  },
  trendChip: {
    paddingHorizontal: 8,
  },
});

export default MoodTracker;

