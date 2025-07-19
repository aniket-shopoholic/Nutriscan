import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';

import authSlice from '../../store/slices/authSlice';
import nutritionSlice from '../../store/slices/nutritionSlice';
import subscriptionSlice from '../../store/slices/subscriptionSlice';
import scanSlice from '../../store/slices/scanSlice';

// Mock store configuration
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      nutrition: nutritionSlice,
      subscription: subscriptionSlice,
      scan: scanSlice,
    },
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

const AllTheProviders = ({ 
  children, 
  store 
}: { 
  children: React.ReactNode;
  store: any;
}) => {
  return (
    <Provider store={store}>
      <PaperProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </PaperProvider>
    </Provider>
  );
};

const customRender = (
  ui: ReactElement,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
};

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  profilePicture: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  profile: {
    age: 30,
    gender: 'male',
    height: 175,
    weight: 70,
    activityLevel: 'moderate',
    goals: ['weight_loss'],
    dietaryRestrictions: [],
    allergies: [],
  },
  preferences: {
    units: 'metric',
    notifications: true,
    darkMode: false,
  },
};

// Mock nutrition data
export const mockNutritionData = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 67,
  fiber: 25,
  sugar: 50,
  sodium: 2300,
  water: 2000,
};

// Mock food item
export const mockFoodItem = {
  id: 'test-food-id',
  name: 'Apple',
  brand: null,
  barcode: null,
  nutrition: {
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4,
    sugar: 19,
    sodium: 2,
  },
  servingSize: {
    amount: 1,
    unit: 'medium',
    grams: 182,
  },
  category: 'fruits',
  verified: true,
};

// Mock scan result
export const mockScanResult = {
  id: 'test-scan-id',
  userId: 'test-user-id',
  imageUrl: 'test-image-url',
  foods: [
    {
      ...mockFoodItem,
      confidence: 0.95,
      boundingBox: {
        x: 0.1,
        y: 0.1,
        width: 0.8,
        height: 0.8,
      },
      portion: {
        amount: 1,
        unit: 'medium',
        grams: 182,
      },
    },
  ],
  totalNutrition: mockNutritionData,
  accuracy: 0.95,
  processingTime: 1500,
  timestamp: '2024-01-01T12:00:00Z',
  feedback: null,
};

// Mock subscription
export const mockSubscription = {
  id: 'test-subscription-id',
  userId: 'test-user-id',
  planId: 'premium_monthly',
  status: 'active',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  trialStart: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
  stripeSubscriptionId: 'sub_test123',
  stripeCustomerId: 'cus_test123',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Test helpers
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockAsyncFunction = <T>(
  returnValue: T,
  delay: number = 0
): jest.MockedFunction<() => Promise<T>> => {
  return jest.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(returnValue), delay))
  );
};

export const mockRejectedAsyncFunction = (
  error: Error,
  delay: number = 0
): jest.MockedFunction<() => Promise<never>> => {
  return jest.fn().mockImplementation(() => 
    new Promise((_, reject) => setTimeout(() => reject(error), delay))
  );
};

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

// Mock route
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

// Mock theme
export const mockTheme = {
  colors: {
    primary: '#6200EE',
    secondary: '#03DAC6',
    surface: '#FFFFFF',
    background: '#F5F5F5',
    error: '#B00020',
    onSurface: '#000000',
    onBackground: '#000000',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onError: '#FFFFFF',
    primaryContainer: '#E8DEF8',
    onPrimaryContainer: '#21005D',
    secondaryContainer: '#B2F2FF',
    onSecondaryContainer: '#001F24',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    outline: '#79747E',
    onSurfaceVariant: '#49454F',
  },
  dark: false,
  mode: 'adaptive' as const,
  roundness: 4,
  fonts: {
    regular: { fontFamily: 'System' },
    medium: { fontFamily: 'System' },
    light: { fontFamily: 'System' },
    thin: { fontFamily: 'System' },
  },
  animation: {
    scale: 1.0,
  },
};

// Mock initial states
export const mockInitialState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  nutrition: {
    dailyGoals: mockNutritionData,
    currentIntake: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      water: 0,
    },
    meals: [],
    isLoading: false,
    error: null,
  },
  subscription: {
    currentSubscription: null,
    currentTier: 'basic',
    dailyScansUsed: 0,
    isLoading: false,
    error: null,
  },
  scan: {
    currentScan: null,
    scanHistory: [],
    isScanning: false,
    isProcessing: false,
    error: null,
  },
};

// Export everything
export * from '@testing-library/react-native';
export { customRender as render, createMockStore };

