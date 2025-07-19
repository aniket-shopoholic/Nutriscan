import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS } from '../constants';

const HistoryScreen: React.FC = () => {
  const { dailyEntries } = useSelector((state: RootState) => state.nutrition);

  const renderFoodEntry = ({ item }: { item: any }) => (
    <Card style={styles.entryCard}>
      <Card.Content>
        <View style={styles.entryHeader}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        <Text style={styles.portion}>{item.portion}</Text>
        
        <View style={styles.nutritionRow}>
          <Chip style={styles.nutritionChip}>
            {item.nutrition.calories} cal
          </Chip>
          <Chip style={styles.nutritionChip}>
            {item.nutrition.protein}g protein
          </Chip>
          <Chip style={styles.nutritionChip}>
            {item.nutrition.carbs}g carbs
          </Chip>
          <Chip style={styles.nutritionChip}>
            {item.nutrition.fat}g fat
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food History</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {dailyEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No food entries today</Text>
          <Text style={styles.emptySubtext}>
            Start by scanning or manually adding your first meal!
          </Text>
        </View>
      ) : (
        <FlatList
          data={dailyEntries}
          renderItem={renderFoodEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  entryCard: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  timestamp: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  portion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionChip: {
    backgroundColor: COLORS.primary + '20',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryScreen;

