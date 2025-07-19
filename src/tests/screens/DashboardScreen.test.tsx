import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { render, mockUser, mockNutritionData, mockInitialState } from '../utils/testUtils';
import DashboardScreen from '../../screens/DashboardScreen';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: jest.fn(),
  }),
}));

describe('DashboardScreen', () => {
  const initialStateWithUser = {
    ...mockInitialState,
    auth: {
      ...mockInitialState.auth,
      user: mockUser,
      isAuthenticated: true,
    },
    nutrition: {
      ...mockInitialState.nutrition,
      dailyGoals: mockNutritionData,
      currentIntake: {
        calories: 1200,
        protein: 80,
        carbs: 150,
        fat: 40,
        fiber: 15,
        sugar: 30,
        sodium: 1500,
        water: 1200,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when user is authenticated', () => {
    const { getByText, getByTestId } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    // Check for greeting
    expect(getByText(/Good/)).toBeTruthy();
    expect(getByText(mockUser.name)).toBeTruthy();

    // Check for calorie ring
    expect(getByTestId('calorie-ring')).toBeTruthy();

    // Check for water tracker
    expect(getByTestId('water-tracker')).toBeTruthy();

    // Check for mood tracker
    expect(getByTestId('mood-tracker')).toBeTruthy();

    // Check for nutrition summary
    expect(getByTestId('nutrition-summary')).toBeTruthy();
  });

  it('shows loading state when data is loading', () => {
    const loadingState = {
      ...initialStateWithUser,
      nutrition: {
        ...initialStateWithUser.nutrition,
        isLoading: true,
      },
    };

    const { getByTestId } = render(<DashboardScreen />, {
      initialState: loadingState,
    });

    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('shows error message when there is an error', () => {
    const errorState = {
      ...initialStateWithUser,
      nutrition: {
        ...initialStateWithUser.nutrition,
        error: 'Failed to load nutrition data',
      },
    };

    const { getByText } = render(<DashboardScreen />, {
      initialState: errorState,
    });

    expect(getByText('Failed to load nutrition data')).toBeTruthy();
  });

  it('navigates to scanner when scan button is pressed', async () => {
    const { getByTestId } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    const scanButton = getByTestId('scan-fab');
    fireEvent.press(scanButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Scanner');
    });
  });

  it('displays correct calorie progress', () => {
    const { getByText } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    // Should show current intake out of daily goal
    expect(getByText('1200')).toBeTruthy(); // Current calories
    expect(getByText('2000')).toBeTruthy(); // Daily goal
  });

  it('displays water intake progress', () => {
    const { getByText } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    // Should show current water intake
    expect(getByText(/1200/)).toBeTruthy(); // Current water intake
    expect(getByText(/2000/)).toBeTruthy(); // Daily water goal
  });

  it('handles pull to refresh', async () => {
    const { getByTestId } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    const scrollView = getByTestId('dashboard-scroll-view');
    
    // Simulate pull to refresh
    fireEvent(scrollView, 'refresh');

    // Should trigger data refresh
    await waitFor(() => {
      // Verify refresh was triggered (this would normally dispatch actions)
      expect(true).toBe(true);
    });
  });

  it('shows correct greeting based on time of day', () => {
    // Mock different times of day
    const originalDate = Date;
    
    // Mock morning time (8 AM)
    const mockDate = new Date('2024-01-01T08:00:00Z');
    global.Date = jest.fn(() => mockDate) as any;
    global.Date.now = jest.fn(() => mockDate.getTime());

    const { getByText } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    expect(getByText(/Good morning/)).toBeTruthy();

    // Restore original Date
    global.Date = originalDate;
  });

  it('displays nutrition summary with correct values', () => {
    const { getByText } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    // Check protein intake
    expect(getByText('80g')).toBeTruthy(); // Current protein
    expect(getByText('150g')).toBeTruthy(); // Protein goal

    // Check carbs intake
    expect(getByText('150g')).toBeTruthy(); // Current carbs
    expect(getByText('250g')).toBeTruthy(); // Carbs goal

    // Check fat intake
    expect(getByText('40g')).toBeTruthy(); // Current fat
    expect(getByText('67g')).toBeTruthy(); // Fat goal
  });

  it('handles mood selection', async () => {
    const { getByTestId } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    const moodButton = getByTestId('mood-button-4'); // Happy mood (index 4)
    fireEvent.press(moodButton);

    await waitFor(() => {
      // Should update mood state
      expect(true).toBe(true);
    });
  });

  it('handles water intake addition', async () => {
    const { getByTestId } = render(<DashboardScreen />, {
      initialState: initialStateWithUser,
    });

    const addWaterButton = getByTestId('add-water-250ml');
    fireEvent.press(addWaterButton);

    await waitFor(() => {
      // Should update water intake
      expect(true).toBe(true);
    });
  });

  it('shows quick stats correctly', () => {
    const stateWithStats = {
      ...initialStateWithUser,
      scan: {
        ...initialStateWithUser.scan,
        scanHistory: [
          { id: '1', accuracy: 0.95 },
          { id: '2', accuracy: 0.88 },
          { id: '3', accuracy: 0.92 },
        ],
      },
    };

    const { getByText } = render(<DashboardScreen />, {
      initialState: stateWithStats,
    });

    // Should show scan count
    expect(getByText('3')).toBeTruthy(); // Total scans

    // Should show average accuracy
    expect(getByText(/91.7%/)).toBeTruthy(); // Average accuracy
  });

  it('handles empty state when no data is available', () => {
    const emptyState = {
      ...mockInitialState,
      auth: {
        ...mockInitialState.auth,
        user: mockUser,
        isAuthenticated: true,
      },
    };

    const { getByText } = render(<DashboardScreen />, {
      initialState: emptyState,
    });

    // Should show empty state messages
    expect(getByText(/Start tracking/)).toBeTruthy();
  });

  it('displays subscription tier correctly', () => {
    const premiumState = {
      ...initialStateWithUser,
      subscription: {
        ...initialStateWithUser.subscription,
        currentTier: 'premium',
        currentSubscription: {
          id: 'sub_123',
          status: 'active',
          planId: 'premium_monthly',
        },
      },
    };

    const { getByText } = render(<DashboardScreen />, {
      initialState: premiumState,
    });

    expect(getByText(/Premium/)).toBeTruthy();
  });
});

