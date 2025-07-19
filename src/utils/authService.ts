import { auth, firestore, analytics } from './firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import EncryptedStorage from 'react-native-encrypted-storage';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isEmailVerified: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals?: string[];
  dietaryRestrictions?: string[];
  dailyGoals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    water: number;
  };
  hasCompletedOnboarding: boolean;
  subscriptionTier: 'basic' | 'premium' | 'annual';
  createdAt: string;
  updatedAt: string;
}

class AuthService {
  constructor() {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', // From Firebase Console
    });
  }

  // Email/Password Authentication
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        isEmailVerified: user.emailVerified,
      };

      await this.storeUserSession(userData);
      await analytics().logLogin({ method: 'email' });
      
      return userData;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Send email verification
      await user.sendEmailVerification();

      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        isEmailVerified: user.emailVerified,
      };

      // Create user profile in Firestore
      await this.createUserProfile(userData);
      await this.storeUserSession(userData);
      await analytics().logSignUp({ method: 'email' });

      return userData;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Google Sign-In
  async signInWithGoogle(): Promise<User> {
    try {
      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the user's ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;

      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        isEmailVerified: user.emailVerified,
      };

      // Create or update user profile
      await this.createOrUpdateUserProfile(userData);
      await this.storeUserSession(userData);
      await analytics().logLogin({ method: 'google' });

      return userData;
    } catch (error: any) {
      throw new Error('Google sign-in failed');
    }
  }

  // Apple Sign-In
  async signInWithApple(): Promise<User> {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

      // Sign the user in with the credential
      const userCredential = await auth().signInWithCredential(appleCredential);
      const user = userCredential.user;

      const userData: User = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        isEmailVerified: user.emailVerified,
      };

      // Create or update user profile
      await this.createOrUpdateUserProfile(userData);
      await this.storeUserSession(userData);
      await analytics().logLogin({ method: 'apple' });

      return userData;
    } catch (error: any) {
      throw new Error('Apple sign-in failed');
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
      await this.clearUserSession();
      await analytics().logEvent('logout');
    } catch (error) {
      throw new Error('Sign out failed');
    }
  }

  // Password Reset
  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    const user = auth().currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isEmailVerified: user.emailVerified,
    };
  }

  // User Profile Management
  async createUserProfile(userData: User): Promise<void> {
    const userProfile: UserProfile = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      hasCompletedOnboarding: false,
      subscriptionTier: 'basic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore()
      .collection('users')
      .doc(userData.uid)
      .set(userProfile);
  }

  async createOrUpdateUserProfile(userData: User): Promise<void> {
    const userRef = firestore().collection('users').doc(userData.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing profile
      await userRef.update({
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new profile
      await this.createUserProfile(userData);
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }

  // Session Management
  private async storeUserSession(userData: User): Promise<void> {
    try {
      await EncryptedStorage.setItem('user_session', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user session:', error);
    }
  }

  private async clearUserSession(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('user_session');
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }

  async getStoredUserSession(): Promise<User | null> {
    try {
      const session = await EncryptedStorage.getItem('user_session');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Failed to get stored user session:', error);
      return null;
    }
  }

  // Error handling
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Auth state listener
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          isEmailVerified: firebaseUser.emailVerified,
        };
        callback(userData);
      } else {
        callback(null);
      }
    });
  }
}

export default new AuthService();

