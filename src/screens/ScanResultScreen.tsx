import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AccuracyFeedback from '../components/AccuracyFeedback';
import { COLORS } from '../constants';

const ScanResultScreen: React.FC = () => {
  const { currentScan } = useSelector((state: RootState) => state.scan);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  if (!currentScan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No scan result available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderNutritionCard = () => (
    <Card style={styles.nutritionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Nutrition Information</Text>
        
        <View style={styles.calorieRow}>
          <Text style={styles.calorieNumber}>{currentScan.nutrition.calories}</Text>
          <Text style={styles.calorieLabel}>calories</Text>
        </View>

        <View style={styles.macroGrid}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{currentScan.nutrition.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{currentScan.nutrition.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{currentScan.nutrition.fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{currentScan.nutrition.fiber}g</Text>
            <Text style={styles.macroLabel}>Fiber</Text>
          </View>
        </View>

        <View style={styles.additionalNutrition}>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Sugar:</Text>
            <Text style={styles.nutritionValue}>{currentScan.nutrition.sugar}g</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Sodium:</Text>
            <Text style={styles.nutritionValue}>{currentScan.nutrition.sodium}mg</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPortionCard = () => (
    <Card style={styles.portionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Portion Analysis</Text>
        
        <View style={styles.portionInfo}>
          <View style={styles.portionItem}>
            <Text style={styles.portionValue}>{currentScan.volumeEstimation.estimatedWeight}</Text>
            <Text style={styles.portionLabel}>grams</Text>
          </View>
          <View style={styles.portionItem}>
            <Text style={styles.portionValue}>{currentScan.volumeEstimation.estimatedVolume}</Text>
            <Text style={styles.portionLabel}>ml volume</Text>
          </View>
        </View>

        <View style={styles.methodInfo}>
          <Text style={styles.methodLabel}>Analysis method:</Text>
          <Chip style={styles.methodChip}>
            {currentScan.volumeEstimation.method.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        <View style={styles.confidenceInfo}>
          <Text style={styles.confidenceLabel}>
            Confidence: {Math.round(currentScan.volumeEstimation.confidence * 100)}%
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAccuracyFeedback = () => (
    <Card style={styles.feedbackCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Is this accurate?</Text>
        <Text style={styles.feedbackSubtitle}>
          Your feedback helps improve our AI recognition accuracy
        </Text>
        
        <View style={styles.feedbackButtons}>
          <Button
            mode="contained"
            onPress={() => setShowFeedbackModal(true)}
            style={styles.feedbackButton}
            buttonColor={COLORS.success}
            icon="thumb-up"
          >
            Yes, accurate
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowFeedbackModal(true)}
            style={styles.feedbackButton}
            icon="thumb-down"
          >
            Needs correction
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderProcessingInfo = () => (
    <Card style={styles.processingCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Processing Details</Text>
        
        <View style={styles.processingRow}>
          <Text style={styles.processingLabel}>Processing time:</Text>
          <Text style={styles.processingValue}>
            {(currentScan.recognitionResult.processingTime / 1000).toFixed(1)}s
          </Text>
        </View>
        
        <View style={styles.processingRow}>
          <Text style={styles.processingLabel}>Image quality:</Text>
          <Chip style={styles.qualityChip}>
            {currentScan.recognitionResult.imageAnalysis.quality.toUpperCase()}
          </Chip>
        </View>
        
        <View style={styles.processingRow}>
          <Text style={styles.processingLabel}>Recognition confidence:</Text>
          <Text style={styles.processingValue}>
            {Math.round(currentScan.recognitionResult.confidence * 100)}%
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.imageCard}>
          <Card.Content>
            <Image
              source={{ uri: currentScan.imageUri }}
              style={styles.foodImage}
              resizeMode="cover"
            />
            
            <View style={styles.resultHeader}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{currentScan.foodItem.name}</Text>
                <Text style={styles.foodCategory}>{currentScan.foodItem.category}</Text>
              </View>
              <Chip style={styles.confidenceChip}>
                {Math.round(currentScan.foodItem.confidence * 100)}% confident
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {renderNutritionCard()}
        {renderPortionCard()}
        {renderAccuracyFeedback()}
        {renderProcessingInfo()}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit Details
          </Button>
          <Button
            mode="contained"
            onPress={() => {}}
            style={styles.actionButton}
            buttonColor={COLORS.primary}
            icon="plus"
          >
            Add to Log
          </Button>
        </View>
      </ScrollView>

      <AccuracyFeedback
        visible={showFeedbackModal}
        onDismiss={() => setShowFeedbackModal(false)}
        scanId={currentScan.id}
        foodName={currentScan.foodItem.name}
        estimatedWeight={currentScan.volumeEstimation.estimatedWeight}
        estimatedCalories={currentScan.nutrition.calories}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
  },
  imageCard: {
    marginBottom: 16,
  },
  foodImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  foodCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  confidenceChip: {
    backgroundColor: COLORS.success + '20',
  },
  nutritionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  calorieLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  additionalNutrition: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    paddingTop: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  portionCard: {
    marginBottom: 16,
  },
  portionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  portionItem: {
    alignItems: 'center',
  },
  portionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  portionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  methodLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  methodChip: {
    backgroundColor: COLORS.primary + '20',
  },
  confidenceInfo: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  feedbackCard: {
    marginBottom: 16,
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    flex: 1,
  },
  processingCard: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
  },
  processingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  processingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  processingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  qualityChip: {
    backgroundColor: COLORS.accent + '20',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 4,
  },
});

export default ScanResultScreen;

