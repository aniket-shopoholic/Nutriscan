import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Button, TextInput, Card, RadioButton, Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { setOnboardingComplete } from '../store/slices/authSlice';
import { updateDailyGoals } from '../store/slices/nutritionSlice';
import { updateUserProfile } from '../store/slices/authThunks';
import { COLORS } from '../constants';

interface UserProfile {
  age: string;
  weight: string;
  height: string;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: string[];
  dietaryRestrictions: string[];
}

const OnboardingScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    age: '',
    weight: '',
    height: '',
    gender: 'other',
    activityLevel: 'moderate',
    goals: [],
    dietaryRestrictions: [],
  });

  const goalOptions = [
    'Weight Loss',
    'Weight Gain',
    'Muscle Building',
    'Maintain Weight',
    'Better Health',
    'Track Nutrition',
  ];

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low Carb',
    'Low Fat',
  ];

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
    { value: 'light', label: 'Light (light exercise 1-3 days/week)' },
    { value: 'moderate', label: 'Moderate (moderate exercise 3-5 days/week)' },
    { value: 'active', label: 'Active (hard exercise 6-7 days/week)' },
    { value: 'very_active', label: 'Very Active (very hard exercise, physical job)' },
  ];

  const calculateCalorieGoal = () => {
    const age = parseInt(profile.age);
    const weight = parseFloat(profile.weight);
    const height = parseFloat(profile.height);

    if (!age || !weight || !height) return 2000;

    // Basic BMR calculation (Mifflin-St Jeor Equation)
    let bmr;
    if (profile.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    return Math.round(bmr * multipliers[profile.activityLevel]);
  };

  const handleGoalToggle = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const handleDietaryToggle = (restriction: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }));
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      const calorieGoal = calculateCalorieGoal();
      
      // Update daily goals in nutrition slice
      dispatch(updateDailyGoals({
        calories: calorieGoal,
        protein: Math.round(calorieGoal * 0.3 / 4), // 30% of calories from protein
        carbs: Math.round(calorieGoal * 0.4 / 4), // 40% from carbs
        fat: Math.round(calorieGoal * 0.3 / 9), // 30% from fat
      }));

      // Update user profile in Firestore
      const profileUpdates = {
        age: parseInt(profile.age),
        weight: parseFloat(profile.weight),
        height: parseFloat(profile.height),
        gender: profile.gender,
        activityLevel: profile.activityLevel,
        goals: profile.goals,
        dietaryRestrictions: profile.dietaryRestrictions,
        dailyGoals: {
          calories: calorieGoal,
          protein: Math.round(calorieGoal * 0.3 / 4),
          carbs: Math.round(calorieGoal * 0.4 / 4),
          fat: Math.round(calorieGoal * 0.3 / 9),
          fiber: 25,
          water: 8,
        },
        hasCompletedOnboarding: true,
      };

      await dispatch(updateUserProfile({ 
        uid: user.uid, 
        updates: profileUpdates 
      })).unwrap();
      
      // Mark onboarding as complete in local state
      dispatch(setOnboardingComplete(true));
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const renderStep1 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.stepTitle}>Basic Information</Text>
        
        <TextInput
          label="Age"
          value={profile.age}
          onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        
        <TextInput
          label="Weight (kg)"
          value={profile.weight}
          onChangeText={(text) => setProfile(prev => ({ ...prev, weight: text }))}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        
        <TextInput
          label="Height (cm)"
          value={profile.height}
          onChangeText={(text) => setProfile(prev => ({ ...prev, height: text }))}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Gender</Text>
        <RadioButton.Group
          onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value as any }))}
          value={profile.gender}
        >
          <View style={styles.radioRow}>
            <RadioButton value="male" />
            <Text>Male</Text>
          </View>
          <View style={styles.radioRow}>
            <RadioButton value="female" />
            <Text>Female</Text>
          </View>
          <View style={styles.radioRow}>
            <RadioButton value="other" />
            <Text>Other</Text>
          </View>
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.stepTitle}>Activity Level</Text>
        
        <RadioButton.Group
          onValueChange={(value) => setProfile(prev => ({ ...prev, activityLevel: value as any }))}
          value={profile.activityLevel}
        >
          {activityLevels.map((level) => (
            <View key={level.value} style={styles.radioRow}>
              <RadioButton value={level.value} />
              <Text style={styles.activityLabel}>{level.label}</Text>
            </View>
          ))}
        </RadioButton.Group>
      </Card.Content>
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.stepTitle}>Your Goals</Text>
        <Text style={styles.subtitle}>Select all that apply</Text>
        
        <View style={styles.chipContainer}>
          {goalOptions.map((goal) => (
            <Chip
              key={goal}
              selected={profile.goals.includes(goal)}
              onPress={() => handleGoalToggle(goal)}
              style={styles.chip}
            >
              {goal}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderStep4 = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.stepTitle}>Dietary Preferences</Text>
        <Text style={styles.subtitle}>Select any that apply (optional)</Text>
        
        <View style={styles.chipContainer}>
          {dietaryOptions.map((restriction) => (
            <Chip
              key={restriction}
              selected={profile.dietaryRestrictions.includes(restriction)}
              onPress={() => handleDietaryToggle(restriction)}
              style={styles.chip}
            >
              {restriction}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to NutriScan Pro</Text>
          <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <Button
              mode="outlined"
              onPress={() => setStep(step - 1)}
              style={styles.button}
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={step === 4 ? handleComplete : () => setStep(step + 1)}
            style={styles.button}
            buttonColor={COLORS.primary}
            disabled={
              isLoading || 
              (step === 1 && (!profile.age || !profile.weight || !profile.height))
            }
            loading={step === 4 && isLoading}
          >
            {step === 4 ? 'Complete Setup' : 'Next'}
          </Button>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.text,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityLabel: {
    flex: 1,
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
});

export default OnboardingScreen;

