import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((obj) => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => {
  const RNPaper = jest.requireActual('react-native-paper');
  return {
    ...RNPaper,
    useTheme: () => ({
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
    }),
  };
});

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({
    onReady: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(() => Promise.resolve({ data: () => ({}) })),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
    })),
  }),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  default: () => ({
    logEvent: jest.fn(() => Promise.resolve()),
    setUserId: jest.fn(() => Promise.resolve()),
    setUserProperty: jest.fn(() => Promise.resolve()),
    setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
    resetAnalyticsData: jest.fn(() => Promise.resolve()),
    setDefaultEventParameters: jest.fn(() => Promise.resolve()),
    logScreenView: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  __esModule: true,
  default: () => ({
    recordError: jest.fn(),
    log: jest.fn(),
    setUserId: jest.fn(),
    setAttribute: jest.fn(),
    setAttributes: jest.fn(),
  }),
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
    presentPaymentSheet: jest.fn(() => Promise.resolve({ error: null })),
  }),
  StripeProvider: ({ children }: any) => children,
}));

// Mock React Native Camera
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevices: () => ({
    back: { id: 'back' },
    front: { id: 'front' },
  }),
  useFrameProcessor: jest.fn(),
  runOnJS: jest.fn(),
}));

// Mock TensorFlow
jest.mock('@tensorflow/tfjs-react-native', () => ({
  platform: jest.fn(),
  ready: jest.fn(() => Promise.resolve()),
}));

// Mock React Native Device Info
jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getSystemVersion: jest.fn(() => '14.0'),
  getModel: jest.fn(() => 'iPhone 12'),
  getBrand: jest.fn(() => 'Apple'),
  getDeviceId: jest.fn(() => 'test-device-id'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
  getBatteryLevel: jest.fn(() => Promise.resolve(0.8)),
  getUsedMemory: jest.fn(() => Promise.resolve(1024)),
}));

// Mock React Native Background Job
jest.mock('react-native-background-job', () => ({
  start: jest.fn(() => 'job-id'),
  stop: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
}));

// Mock Encrypted Storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Google Sign In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    })),
    signOut: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  },
}));

// Mock Apple Authentication
jest.mock('@invertase/react-native-apple-authentication', () => ({
  AppleButton: 'AppleButton',
  appleAuth: {
    performRequest: jest.fn(() => Promise.resolve({
      user: 'test-user-id',
      email: 'test@example.com',
      fullName: {
        givenName: 'Test',
        familyName: 'User',
      },
    })),
    requestAsync: jest.fn(),
  },
}));

// Mock React Native Linear Gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock React Native SVG
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
  Text: 'Text',
}));

// Mock Victory Native
jest.mock('victory-native', () => ({
  VictoryChart: 'VictoryChart',
  VictoryLine: 'VictoryLine',
  VictoryArea: 'VictoryArea',
  VictoryPie: 'VictoryPie',
  VictoryBar: 'VictoryBar',
  VictoryAxis: 'VictoryAxis',
  VictoryTheme: {
    material: {},
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.warn and console.error in tests unless explicitly needed
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

