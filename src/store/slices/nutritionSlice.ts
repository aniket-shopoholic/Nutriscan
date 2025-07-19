import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface FoodEntry {
  id: string;
  name: string;
  portion: string;
  nutrition: NutritionData;
  timestamp: string;
  imageUrl?: string;
  accuracy?: number;
  corrected?: boolean;
}

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

interface NutritionState {
  dailyEntries: FoodEntry[];
  waterIntake: number;
  dailyGoals: DailyGoals;
  currentDate: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: NutritionState = {
  dailyEntries: [],
  waterIntake: 0,
  dailyGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25,
    water: 8,
  },
  currentDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  error: null,
};

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    addFoodEntry: (state, action: PayloadAction<FoodEntry>) => {
      state.dailyEntries.push(action.payload);
    },
    updateFoodEntry: (state, action: PayloadAction<{ id: string; updates: Partial<FoodEntry> }>) => {
      const index = state.dailyEntries.findIndex(entry => entry.id === action.payload.id);
      if (index !== -1) {
        state.dailyEntries[index] = { ...state.dailyEntries[index], ...action.payload.updates };
      }
    },
    removeFoodEntry: (state, action: PayloadAction<string>) => {
      state.dailyEntries = state.dailyEntries.filter(entry => entry.id !== action.payload);
    },
    addWaterIntake: (state, action: PayloadAction<number>) => {
      state.waterIntake += action.payload;
    },
    setWaterIntake: (state, action: PayloadAction<number>) => {
      state.waterIntake = action.payload;
    },
    updateDailyGoals: (state, action: PayloadAction<Partial<DailyGoals>>) => {
      state.dailyGoals = { ...state.dailyGoals, ...action.payload };
    },
    setCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
      // Reset daily data when date changes
      state.dailyEntries = [];
      state.waterIntake = 0;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addFoodEntry,
  updateFoodEntry,
  removeFoodEntry,
  addWaterIntake,
  setWaterIntake,
  updateDailyGoals,
  setCurrentDate,
  setLoading,
  setError,
  clearError,
} = nutritionSlice.actions;

export default nutritionSlice.reducer;

