export const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 0,
    dailyScans: 5,
    features: ['5 daily scans', 'Manual logging', 'Basic nutrition tracking']
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    dailyScans: -1, // unlimited
    features: [
      'Unlimited AI scans',
      '3D portion estimation',
      'Advanced nutrition insights',
      'Mood tracking',
      'Voice logging',
      'Export data'
    ]
  },
  ANNUAL: {
    id: 'annual',
    name: 'Annual Premium',
    price: 79.99,
    dailyScans: -1, // unlimited
    features: [
      'Unlimited AI scans',
      '3D portion estimation',
      'Advanced nutrition insights',
      'Mood tracking',
      'Voice logging',
      'Export data',
      '40% discount'
    ]
  }
};

export const COLORS = {
  primary: '#4CAF50',
  secondary: '#FF9800',
  accent: '#2196F3',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800'
};

export const NUTRITION_GOALS = {
  CALORIES: 2000,
  PROTEIN: 150,
  CARBS: 250,
  FAT: 65,
  FIBER: 25,
  WATER: 8 // glasses
};

export const MOOD_SCALE = [
  { value: 1, emoji: '😢', label: 'Very Sad' },
  { value: 2, emoji: '😕', label: 'Sad' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Happy' },
  { value: 5, emoji: '😄', label: 'Very Happy' }
];

export const ANALYTICS_EVENTS = {
  SCAN_FOOD: 'scan_food',
  SCAN_ACCURACY: 'scan_accuracy',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  MOOD_LOGGED: 'mood_logged',
  VOICE_LOG_USED: 'voice_log_used'
};

