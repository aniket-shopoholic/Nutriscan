import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ScanResultScreen from '../screens/ScanResultScreen';

import { COLORS } from '../constants';

export type MainTabParamList = {
  Dashboard: undefined;
  Scanner: undefined;
  History: undefined;
  Profile: undefined;
};

export type ScanStackParamList = {
  ScannerMain: undefined;
  ScanResult: { scanId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Subscription: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ScanStackNavigator: React.FC = () => (
  <ScanStack.Navigator>
    <ScanStack.Screen 
      name="ScannerMain" 
      component={ScannerScreen} 
      options={{ headerShown: false }}
    />
    <ScanStack.Screen 
      name="ScanResult" 
      component={ScanResultScreen}
      options={{ 
        title: 'Scan Result',
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: 'white'
      }}
    />
  </ScanStack.Navigator>
);

const ProfileStackNavigator: React.FC = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="Subscription" 
      component={SubscriptionScreen}
      options={{ 
        title: 'Subscription',
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: 'white'
      }}
    />
  </ProfileStack.Navigator>
);

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Scanner':
              iconName = 'camera-alt';
              break;
            case 'History':
              iconName = 'history';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.background,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Scanner" 
        component={ScanStackNavigator}
        options={{ title: 'Scan' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

