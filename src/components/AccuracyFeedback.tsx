import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Button,
  Card,
  TextInput,
  RadioButton,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { addAccuracyFeedback, updateScanAccuracy } from '../store/slices/scanSlice';
import { COLORS } from '../constants';

interface AccuracyFeedbackProps {
  visible: boolean;
  onDismiss: () => void;
  scanId: string;
  foodName: string;
  estimatedWeight: number;
  estimatedCalories: number;
}

const AccuracyFeedback: React.FC<AccuracyFeedbackProps> = ({
  visible,
  onDismiss,
  scanId,
  foodName,
  estimatedWeight,
  estimatedCalories,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isAccurate, setIsAccurate] = useState<boolean | null>(null);
  const [correctedFoodName, setCorrectedFoodName] = useState(foodName);
  const [correctedWeight, setCorrectedWeight] = useState(estimatedWeight.toString());
  const [correctedCalories, setCorrectedCalories] = useState(estimatedCalories.toString());
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  const commonIssues = [
    'Wrong food identified',
    'Portion size too large',
    'Portion size too small',
    'Multiple foods not detected',
    'Poor image quality',
    'Lighting issues',
    'Food partially hidden',
    'Nutrition values incorrect',
  ];

  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev => 
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const handleSubmitFeedback = () => {
    const feedback = {
      scanId,
      isAccurate: isAccurate || false,
      corrections: isAccurate ? undefined : {
        foodName: correctedFoodName !== foodName ? correctedFoodName : undefined,
        portionWeight: parseFloat(correctedWeight) !== estimatedWeight ? parseFloat(correctedWeight) : undefined,
        nutritionAdjustments: parseFloat(correctedCalories) !== estimatedCalories ? {
          calories: parseFloat(correctedCalories),
        } : undefined,
      },
      feedback: feedbackText || selectedIssues.join(', '),
      timestamp: new Date().toISOString(),
    };

    // Update scan accuracy in store
    dispatch(updateScanAccuracy({
      scanId,
      isAccurate: isAccurate || false,
      corrections: feedback.corrections,
    }));

    // Add feedback for analytics
    dispatch(addAccuracyFeedback(feedback));

    // Reset form
    setIsAccurate(null);
    setCorrectedFoodName(foodName);
    setCorrectedWeight(estimatedWeight.toString());
    setCorrectedCalories(estimatedCalories.toString());
    setFeedbackText('');
    setSelectedIssues([]);

    onDismiss();
  };

  const handleCancel = () => {
    // Reset form
    setIsAccurate(null);
    setCorrectedFoodName(foodName);
    setCorrectedWeight(estimatedWeight.toString());
    setCorrectedCalories(estimatedCalories.toString());
    setFeedbackText('');
    setSelectedIssues([]);

    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Is this scan accurate?</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={handleCancel}
          />
        </View>

        <ScrollView style={styles.content}>
          <Card style={styles.scanSummaryCard}>
            <Card.Content>
              <Text style={styles.scanSummaryTitle}>Scan Results</Text>
              <View style={styles.scanSummaryRow}>
                <Text style={styles.scanSummaryLabel}>Food:</Text>
                <Text style={styles.scanSummaryValue}>{foodName}</Text>
              </View>
              <View style={styles.scanSummaryRow}>
                <Text style={styles.scanSummaryLabel}>Weight:</Text>
                <Text style={styles.scanSummaryValue}>{estimatedWeight}g</Text>
              </View>
              <View style={styles.scanSummaryRow}>
                <Text style={styles.scanSummaryLabel}>Calories:</Text>
                <Text style={styles.scanSummaryValue}>{estimatedCalories}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.feedbackCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Accuracy Assessment</Text>
              
              <RadioButton.Group
                onValueChange={(value) => setIsAccurate(value === 'accurate')}
                value={isAccurate === true ? 'accurate' : isAccurate === false ? 'inaccurate' : ''}
              >
                <View style={styles.radioRow}>
                  <RadioButton value="accurate" />
                  <Text style={styles.radioLabel}>✅ Yes, this is accurate</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="inaccurate" />
                  <Text style={styles.radioLabel}>❌ No, this needs correction</Text>
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {isAccurate === false && (
            <>
              <Card style={styles.correctionsCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Corrections</Text>
                  
                  <TextInput
                    label="Correct food name"
                    value={correctedFoodName}
                    onChangeText={setCorrectedFoodName}
                    mode="outlined"
                    style={styles.input}
                  />
                  
                  <TextInput
                    label="Correct weight (grams)"
                    value={correctedWeight}
                    onChangeText={setCorrectedWeight}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  
                  <TextInput
                    label="Correct calories"
                    value={correctedCalories}
                    onChangeText={setCorrectedCalories}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </Card.Content>
              </Card>

              <Card style={styles.issuesCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>What was wrong?</Text>
                  <Text style={styles.sectionSubtitle}>Select all that apply</Text>
                  
                  <View style={styles.issuesContainer}>
                    {commonIssues.map((issue) => (
                      <Chip
                        key={issue}
                        selected={selectedIssues.includes(issue)}
                        onPress={() => handleIssueToggle(issue)}
                        style={styles.issueChip}
                      >
                        {issue}
                      </Chip>
                    ))}
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.additionalFeedbackCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Additional Feedback</Text>
                  <TextInput
                    label="Tell us more (optional)"
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    placeholder="Any additional details that might help us improve..."
                    style={styles.textArea}
                  />
                </Card.Content>
              </Card>
            </>
          )}

          <View style={styles.thankYouSection}>
            <Text style={styles.thankYouTitle}>Thank you for your feedback!</Text>
            <Text style={styles.thankYouText}>
              Your input helps us improve our AI recognition accuracy for everyone.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmitFeedback}
            style={styles.submitButton}
            buttonColor={COLORS.primary}
            disabled={isAccurate === null}
          >
            Submit Feedback
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scanSummaryCard: {
    marginBottom: 16,
    backgroundColor: COLORS.primary + '10',
  },
  scanSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  scanSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scanSummaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scanSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  feedbackCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  correctionsCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  issuesCard: {
    marginBottom: 16,
  },
  issuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    marginBottom: 8,
  },
  additionalFeedbackCard: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
  },
  thankYouSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  thankYouTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  thankYouText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default AccuracyFeedback;

