import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import nutritionSlice from './slices/nutritionSlice';
import subscriptionSlice from './slices/subscriptionSlice';
import scanSlice from './slices/scanSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    nutrition: nutritionSlice,
    subscription: subscriptionSlice,
    scan: scanSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

