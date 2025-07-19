import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SubscriptionState {
  currentTier: 'basic' | 'premium' | 'annual';
  isActive: boolean;
  trialEndDate: string | null;
  isTrialActive: boolean;
  dailyScansUsed: number;
  subscriptionEndDate: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  currentTier: 'basic',
  isActive: false,
  trialEndDate: null,
  isTrialActive: false,
  dailyScansUsed: 0,
  subscriptionEndDate: null,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionTier: (state, action: PayloadAction<'basic' | 'premium' | 'annual'>) => {
      state.currentTier = action.payload;
      state.isActive = action.payload !== 'basic';
    },
    startTrial: (state, action: PayloadAction<string>) => {
      state.isTrialActive = true;
      state.trialEndDate = action.payload;
      state.currentTier = 'premium';
      state.isActive = true;
    },
    endTrial: (state) => {
      state.isTrialActive = false;
      state.trialEndDate = null;
      state.currentTier = 'basic';
      state.isActive = false;
    },
    incrementDailyScans: (state) => {
      state.dailyScansUsed += 1;
    },
    resetDailyScans: (state) => {
      state.dailyScansUsed = 0;
    },
    setSubscriptionEndDate: (state, action: PayloadAction<string>) => {
      state.subscriptionEndDate = action.payload;
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
  setSubscriptionTier,
  startTrial,
  endTrial,
  incrementDailyScans,
  resetDailyScans,
  setSubscriptionEndDate,
  setLoading,
  setError,
  clearError,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;

