import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
} from '../store/slices/authThunks';
import { clearError } from '../store/slices/authSlice';
import { COLORS } from '../constants';
import { LoadingSpinner, ErrorMessage } from '../components/common';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      if (isSignUp) {
        await dispatch(signUpWithEmail({ email, password })).unwrap();
        Alert.alert(
          'Account Created',
          'Please check your email to verify your account before signing in.'
        );
      } else {
        await dispatch(signInWithEmail({ email, password })).unwrap();
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await dispatch(signInWithGoogle()).unwrap();
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await dispatch(signInWithApple()).unwrap();
    } catch (error: any) {
      Alert.alert('Apple Sign-In Error', error);
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        message={isSignUp ? 'Creating your account...' : 'Signing you in...'} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>NutriScan Pro</Text>
        <Text style={styles.subtitle}>
          Smart nutrition tracking with AI-powered food recognition
        </Text>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleClearError}
            retryText="Dismiss"
          />
        )}

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!error}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              error={!!error}
            />

            <Button
              mode="contained"
              onPress={handleAuth}
              loading={isLoading}
              disabled={isLoading}
              style={styles.authButton}
              buttonColor={COLORS.primary}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <View style={styles.socialButtons}>
          <Button
            mode="outlined"
            onPress={handleGoogleSignIn}
            style={styles.socialButton}
            icon="google"
            disabled={isLoading}
          >
            Continue with Google
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleAppleSignIn}
            style={styles.socialButton}
            icon="apple"
            disabled={isLoading}
          >
            Continue with Apple
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  card: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  authButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    borderColor: COLORS.primary,
  },
});

export default AuthScreen;

