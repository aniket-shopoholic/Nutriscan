import { createAsyncThunk } from '@reduxjs/toolkit';
import authService, { User } from '../../utils/authService';

// Sign in with email and password
export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await authService.signInWithEmail(email, password);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Sign up with email and password
export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await authService.signUpWithEmail(email, password);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Sign in with Google
export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.signInWithGoogle();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Sign in with Apple
export const signInWithApple = createAsyncThunk(
  'auth/signInWithApple',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.signInWithApple();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Sign out
export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await authService.signOut();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await authService.resetPassword(email);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Load user profile
export const loadUserProfile = createAsyncThunk(
  'auth/loadUserProfile',
  async (uid: string, { rejectWithValue }) => {
    try {
      const profile = await authService.getUserProfile(uid);
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({ uid, updates }: { uid: string; updates: any }, { rejectWithValue }) => {
    try {
      await authService.updateUserProfile(uid, updates);
      return updates;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Initialize auth state
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Check for stored session
      const storedUser = await authService.getStoredUserSession();
      if (storedUser) {
        // Verify with Firebase and get fresh user data
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const profile = await authService.getUserProfile(currentUser.uid);
          return { user: currentUser, profile };
        }
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

