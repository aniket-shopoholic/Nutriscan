import '@testing-library/jest-native/extend-expect';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock React Native native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      SettingsManager: {
        settings: {
          AppleLocale: 'en_US',
          AppleLanguages: ['en-US'],
          // Add other settings as needed for your tests
        },
      },
      PlatformConstants: {
        getConstants: () => ({
          is</tag>Testing: true,
          reactNativeVersion: {
            major: 0,
            minor: 72,
            patch: 7,
            prerelease: null,
          },
          systemVersion: '17.0',
          interfaceStyle: 'light',
        }),
      },
      // Mock other native modules as needed
    },
    Platform: {
      ...RN.Platform,
      OS: 'ios', // or 'android' depending on your test needs
      select: jest.fn((obj) => obj.ios), // or obj.android
    },
    Alert: {
      alert: jest.fn(),
    },
    // Mock other components/APIs as needed
    UIManager: RN.UIManager,
    View: RN.View,
    Text: RN.Text,
    TextInput: RN.TextInput,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
    SectionList: RN.SectionList,
    // Add other React Native components/APIs that are used in your app
  };
});

// Mock TurboModuleRegistry for all native modules
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn((name: string) => {
    if (name === 'SettingsManager') {
      return {
        settings: {
          AppleLocale: 'en_US',
          AppleLanguages: ['en-US'],
        },
      };
    }
    // Return a generic mock for other modules to prevent errors
    return {};
  }),
  getEnforcing: jest.fn((name: string) => {
    if (name === 'SettingsManager') {
      return {
        settings: {
          AppleLocale: 'en_US',
          AppleLanguages: ['en-US'],
        },
      };
    }
    // Return a generic mock for other modules to prevent errors
    return {};
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    app: jest.fn(() => ({
      analytics: jest.fn(() => ({
        logEvent: jest.fn(),
        setUserProperties: jest.fn(),
        setUserId: jest.fn(),
      })),
      auth: jest.fn(() => ({
        signInWithEmailAndPassword: jest.fn(),
        createUserWithEmailAndPassword: jest.fn(),
        signOut: jest.fn(),
        onAuthStateChanged: jest.fn(),
        currentUser: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          sendEmailVerification: jest.fn(),
          updateProfile: jest.fn(),
        },
      })),
      firestore: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn(),
            get: jest.fn(() => Promise.resolve({
              exists: true,
              data: () => ({}),
            })),
            update: jest.fn(),
          })),
          add: jest.fn(),
        })),
      })),
      crashlytics: jest.fn(() => ({
        recordError: jest.fn(),
        log: jest.fn(),
      })),
    })),
  },
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
    confirmPaymentSheetPayment: jest.fn(),
  }),
  StripeProvider: ({ children }: any) => children,
}));

// Mock react-native-camera-kit
jest.mock('react-native-camera-kit', () => ({
  CameraScreen: 'CameraScreen',
  Camera: {
    requestCameraPermission: jest.fn(() => Promise.resolve(true)),
    requestPhotoLibraryPermission: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  useCameraDevices: jest.fn(() => ({})),
  Camera: 'Camera',
  useFrameProcessor: jest.fn(),
  useSkiaFrameProcessor: jest.fn(),
  useSharedValue: jest.fn(),
  CameraDeviceFormat: jest.fn(),
  CameraRuntimeError: jest.fn(),
  CameraCaptureError: jest.fn(),
  CameraPermissionStatus: jest.fn(),
  sortFormats: jest.fn(),
  getAvailableCameraDevices: jest.fn(() => Promise.resolve([])),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => 'mock-unique-id'),
  getDeviceId: jest.fn(() => 'mock-device-id'),
  getManufacturer: jest.fn(() => 'mock-manufacturer'),
  getModel: jest.fn(() => 'mock-model'),
  getSystemName: jest.fn(() => 'mock-system-name'),
  getSystemVersion: jest.fn(() => 'mock-system-version'),
  getVersion: jest.fn(() => 'mock-app-version'),
  getBuildNumber: jest.fn(() => 'mock-build-number'),
  getBundleId: jest.fn(() => 'mock-bundle-id'),
  getApplicationName: jest.fn(() => 'mock-app-name'),
  getBrand: jest.fn(() => 'mock-brand'),
  getReadableVersion: jest.fn(() => 'mock-readable-version'),
  getIpAddress: jest.fn(() => Promise.resolve('192.168.1.1')),
  getMacAddress: jest.fn(() => Promise.resolve('00:00:00:00:00:00')),
  isEmulator: jest.fn(() => false),
  isTablet: jest.fn(() => false),
  getBatteryLevel: jest.fn(() => Promise.resolve(0.8)),
  // Add other methods as needed
}));

// Mock react-native-encrypted-storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
  Text: 'Text',
  Line: 'Line',
  Rect: 'Rect',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
  // Add other SVG components as needed
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock @invertase/react-native-apple-authentication
jest.mock('@invertase/react-native-apple-authentication', () => ({
  AppleButton: 'AppleButton',
  appleAuth: {
    performRequest: jest.fn(() => Promise.resolve({
      fullName: { givenName: 'Test', familyName: 'User' },
      email: 'test@apple.com',
      user: 'apple-test-user-id',
      identityToken: 'mock-identity-token',
      authorizationCode: 'mock-authorization-code',
    })),
    getCredentialStateForUser: jest.fn(() => Promise.resolve(1)), // 1 for authorized
  },
}));

// Mock react-native-background-job
jest.mock('react-native-background-job', () => ({
  schedule: jest.fn(),
  cancelAll: jest.fn(),
  // Add other methods as needed
}));

// Mock @tensorflow/tfjs-react-native
jest.mock('@tensorflow/tfjs-react-native', () => ({
  bundleResourceIO: jest.fn(),
  fetch: jest.fn(),
  decodeJpeg: jest.fn(),
  decodePng: jest.fn(),
  // Add other methods as needed
}));

// Mock @tensorflow/tfjs
jest.mock('@tensorflow/tfjs', () => ({
  loadGraphModel: jest.fn(() => Promise.resolve({})),
  tensor3d: jest.fn(),
  image: {
    resizeBilinear: jest.fn(),
    toPixels: jest.fn(),
  },
  // Add other methods as needed
}));

// Mock victory-native
jest.mock('victory-native', () => ({
  VictoryPie: 'VictoryPie',
  VictoryChart: 'VictoryChart',
  VictoryAxis: 'VictoryAxis',
  VictoryBar: 'VictoryBar',
  VictoryLine: 'VictoryLine',
  VictoryLabel: 'VictoryLabel',
  VictoryTheme: { material: {} },
  // Add other Victory components as needed
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback, which is not always the behavior we want.
  // Instead, we want to mock it to return a no-op function.
  Reanimated.default.call = () => {};

  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const GestureHandler = jest.requireActual('react-native-gesture-handler');
  return {
    ...GestureHandler,
    GestureHandlerRootView: 'View',
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const RNScreens = jest.requireActual('react-native-screens');
  return {
    ...RNScreens,
    enableScreens: jest.fn(),
  };
});

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const Paper = jest.requireActual('react-native-paper');
  return {
    ...Paper,
    // Mock any specific components if needed, e.g., if they have native dependencies
  };
});

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      dispatch: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({ params: {} }),
  };
});

// Mock @react-navigation/stack
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
}));

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  })),
}));

// Mock AWS Rekognition (if you have a separate service for it)
jest.mock('../utils/awsRekognitionService', () => ({
  detectFood: jest.fn(() => Promise.resolve([
    {
      name: 'apple',
      confidence: 99,
      boundingBox: { Width: 0.5, Height: 0.5, Left: 0.25, Top: 0.25 },
    },
  ])),
  // Add other methods as needed
}));

// Mock other services/utilities as needed

// Global mock for console.error to suppress expected errors during tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('Warning:')) {
    // Suppress React Native warnings
    return;
  }
  originalConsoleError(...args);
};

