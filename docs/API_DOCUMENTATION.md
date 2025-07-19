# NutriScan Pro API Documentation

## Overview

This document provides comprehensive documentation for the NutriScan Pro mobile application's API services, including authentication, food scanning, nutrition tracking, and subscription management.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Food Recognition Service](#food-recognition-service)
3. [Nutrition Service](#nutrition-service)
4. [Subscription Service](#subscription-service)
5. [Analytics Service](#analytics-service)
6. [Compliance Service](#compliance-service)
7. [Optimization Service](#optimization-service)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Security](#security)

## Authentication Service

The authentication service handles user registration, login, and session management using Firebase Authentication.

### Methods

#### `initialize()`
Initializes the authentication service and sets up listeners.

```typescript
await authService.initialize();
```

**Returns:** `Promise<void>`

#### `signInWithEmail(email: string, password: string)`
Signs in a user with email and password.

```typescript
const user = await authService.signInWithEmail(
  'user@example.com', 
  'password123'
);
```

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** `Promise<User>`

**Throws:** `AuthError` if credentials are invalid

#### `signUpWithEmail(email: string, password: string, profile: UserProfile)`
Creates a new user account with email and password.

```typescript
const user = await authService.signUpWithEmail(
  'user@example.com',
  'password123',
  {
    name: 'John Doe',
    age: 30,
    gender: 'male',
    height: 175,
    weight: 70,
    activityLevel: 'moderate'
  }
);
```

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password
- `profile` (UserProfile): User profile information

**Returns:** `Promise<User>`

#### `signInWithGoogle()`
Signs in a user with Google OAuth.

```typescript
const user = await authService.signInWithGoogle();
```

**Returns:** `Promise<User>`

#### `signInWithApple()`
Signs in a user with Apple ID (iOS only).

```typescript
const user = await authService.signInWithApple();
```

**Returns:** `Promise<User>`

#### `signOut()`
Signs out the current user.

```typescript
await authService.signOut();
```

**Returns:** `Promise<void>`

#### `getCurrentUser()`
Gets the currently authenticated user.

```typescript
const user = authService.getCurrentUser();
```

**Returns:** `User | null`

#### `updateProfile(updates: Partial<UserProfile>)`
Updates the current user's profile.

```typescript
await authService.updateProfile({
  weight: 72,
  goals: ['weight_loss', 'muscle_gain']
});
```

**Parameters:**
- `updates` (Partial<UserProfile>): Profile fields to update

**Returns:** `Promise<void>`

### Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: string[];
  dietaryRestrictions: string[];
  allergies: string[];
}

interface UserPreferences {
  units: 'metric' | 'imperial';
  notifications: boolean;
  darkMode: boolean;
  language: string;
}
```

## Food Recognition Service

The food recognition service handles AI-powered food identification and nutrition analysis.

### Methods

#### `scanFood(imageUri: string, options?: ScanOptions)`
Scans an image to identify food items and calculate nutrition.

```typescript
const result = await foodRecognitionService.scanFood(
  'file://path/to/image.jpg',
  {
    enableVolumeEstimation: true,
    maxFoodItems: 5,
    confidenceThreshold: 0.7
  }
);
```

**Parameters:**
- `imageUri` (string): Local path to the image file
- `options` (ScanOptions, optional): Scanning configuration

**Returns:** `Promise<ScanResult>`

#### `estimateVolume(imageUri: string, foodBounds: BoundingBox)`
Estimates the 3D volume of a detected food item.

```typescript
const volume = await foodRecognitionService.estimateVolume(
  'file://path/to/image.jpg',
  {
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8
  }
);
```

**Parameters:**
- `imageUri` (string): Local path to the image file
- `foodBounds` (BoundingBox): Bounding box coordinates of the food item

**Returns:** `Promise<VolumeEstimation>`

#### `submitFeedback(scanId: string, feedback: ScanFeedback)`
Submits user feedback to improve AI accuracy.

```typescript
await foodRecognitionService.submitFeedback('scan_123', {
  correctFood: 'Apple',
  correctPortion: { amount: 1, unit: 'medium' },
  issueType: 'incorrect_food',
  comments: 'This is actually a green apple, not red'
});
```

**Parameters:**
- `scanId` (string): ID of the scan result
- `feedback` (ScanFeedback): User correction and feedback

**Returns:** `Promise<void>`

#### `searchFood(query: string, limit?: number)`
Searches for food items in the database.

```typescript
const foods = await foodRecognitionService.searchFood('apple', 10);
```

**Parameters:**
- `query` (string): Search query
- `limit` (number, optional): Maximum number of results (default: 20)

**Returns:** `Promise<FoodItem[]>`

### Types

```typescript
interface ScanResult {
  id: string;
  userId: string;
  imageUrl: string;
  foods: DetectedFood[];
  totalNutrition: NutritionData;
  accuracy: number;
  processingTime: number;
  timestamp: string;
  feedback?: ScanFeedback;
}

interface DetectedFood {
  id: string;
  name: string;
  brand?: string;
  confidence: number;
  boundingBox: BoundingBox;
  portion: Portion;
  nutrition: NutritionData;
  category: string;
  verified: boolean;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Portion {
  amount: number;
  unit: string;
  grams: number;
}

interface VolumeEstimation {
  volume: number; // cubic cm
  confidence: number;
  method: 'depth_analysis' | 'reference_object' | 'ml_estimation';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface ScanFeedback {
  correctFood?: string;
  correctPortion?: Portion;
  issueType: 'incorrect_food' | 'incorrect_portion' | 'missing_food' | 'other';
  comments?: string;
  rating: number; // 1-5
}
```

## Nutrition Service

The nutrition service manages daily nutrition tracking, goals, and meal planning.

### Methods

#### `getDailyNutrition(date?: string)`
Gets nutrition data for a specific date.

```typescript
const nutrition = await nutritionService.getDailyNutrition('2024-01-15');
```

**Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Returns:** `Promise<DailyNutrition>`

#### `addMeal(meal: MealEntry)`
Adds a meal entry to the nutrition log.

```typescript
await nutritionService.addMeal({
  type: 'breakfast',
  foods: [
    {
      foodId: 'food_123',
      portion: { amount: 1, unit: 'medium', grams: 182 },
      nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 }
    }
  ],
  timestamp: new Date().toISOString()
});
```

**Parameters:**
- `meal` (MealEntry): Meal data to add

**Returns:** `Promise<void>`

#### `updateNutritionGoals(goals: NutritionGoals)`
Updates the user's daily nutrition goals.

```typescript
await nutritionService.updateNutritionGoals({
  calories: 2200,
  protein: 165,
  carbs: 275,
  fat: 73,
  fiber: 28,
  water: 2500
});
```

**Parameters:**
- `goals` (NutritionGoals): New nutrition goals

**Returns:** `Promise<void>`

#### `addWaterIntake(amount: number)`
Adds water intake to the daily log.

```typescript
await nutritionService.addWaterIntake(250); // 250ml
```

**Parameters:**
- `amount` (number): Water amount in milliliters

**Returns:** `Promise<void>`

#### `logMood(mood: number, notes?: string)`
Logs the user's mood for mood-food correlation analysis.

```typescript
await nutritionService.logMood(4, 'Feeling great after lunch!');
```

**Parameters:**
- `mood` (number): Mood rating from 1-5
- `notes` (string, optional): Additional notes

**Returns:** `Promise<void>`

#### `getNutritionInsights(period: 'week' | 'month')`
Gets nutrition insights and trends.

```typescript
const insights = await nutritionService.getNutritionInsights('week');
```

**Parameters:**
- `period` ('week' | 'month'): Analysis period

**Returns:** `Promise<NutritionInsights>`

### Types

```typescript
interface DailyNutrition {
  date: string;
  goals: NutritionGoals;
  intake: NutritionData;
  meals: MealEntry[];
  waterIntake: number;
  mood?: MoodEntry;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  water: number;
}

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitamins?: { [key: string]: number };
  minerals?: { [key: string]: number };
}

interface MealEntry {
  id?: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodEntry[];
  timestamp: string;
  notes?: string;
}

interface FoodEntry {
  foodId: string;
  portion: Portion;
  nutrition: NutritionData;
}

interface MoodEntry {
  rating: number; // 1-5
  timestamp: string;
  notes?: string;
}

interface NutritionInsights {
  averageCalories: number;
  caloriesTrend: 'increasing' | 'decreasing' | 'stable';
  macroBalance: {
    protein: number;
    carbs: number;
    fat: number;
  };
  topFoods: string[];
  moodCorrelation: {
    averageMood: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    bestMoodFoods: string[];
  };
  recommendations: string[];
}
```

## Subscription Service

The subscription service handles payment processing and subscription management using Stripe.

### Methods

#### `getSubscriptionTiers()`
Gets available subscription tiers and pricing.

```typescript
const tiers = await subscriptionService.getSubscriptionTiers();
```

**Returns:** `Promise<SubscriptionTier[]>`

#### `createSubscription(tierId: string, paymentMethodId: string)`
Creates a new subscription.

```typescript
const subscription = await subscriptionService.createSubscription(
  'premium_monthly',
  'pm_1234567890'
);
```

**Parameters:**
- `tierId` (string): ID of the subscription tier
- `paymentMethodId` (string): Stripe payment method ID

**Returns:** `Promise<Subscription>`

#### `getCurrentSubscription()`
Gets the user's current subscription.

```typescript
const subscription = await subscriptionService.getCurrentSubscription();
```

**Returns:** `Promise<Subscription | null>`

#### `cancelSubscription(cancelAtPeriodEnd: boolean = true)`
Cancels the current subscription.

```typescript
await subscriptionService.cancelSubscription(true);
```

**Parameters:**
- `cancelAtPeriodEnd` (boolean): Whether to cancel at period end or immediately

**Returns:** `Promise<void>`

#### `resumeSubscription()`
Resumes a canceled subscription.

```typescript
await subscriptionService.resumeSubscription();
```

**Returns:** `Promise<void>`

#### `updatePaymentMethod(paymentMethodId: string)`
Updates the subscription payment method.

```typescript
await subscriptionService.updatePaymentMethod('pm_0987654321');
```

**Parameters:**
- `paymentMethodId` (string): New Stripe payment method ID

**Returns:** `Promise<void>`

#### `getUsageLimits()`
Gets current usage limits and remaining quota.

```typescript
const limits = await subscriptionService.getUsageLimits();
```

**Returns:** `Promise<UsageLimits>`

### Types

```typescript
interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  limits: {
    dailyScans: number;
    advancedFeatures: boolean;
    prioritySupport: boolean;
  };
  stripePriceIds: {
    monthly: string;
    annual: string;
  };
}

interface Subscription {
  id: string;
  userId: string;
  tierId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
}

interface UsageLimits {
  tier: string;
  dailyScans: {
    limit: number;
    used: number;
    remaining: number;
    resetTime: string;
  };
  features: {
    [key: string]: boolean;
  };
}
```

## Analytics Service

The analytics service handles event tracking, performance monitoring, and user behavior analysis.

### Methods

#### `initialize(userId?: string)`
Initializes the analytics service.

```typescript
await analyticsService.initialize('user_123');
```

**Parameters:**
- `userId` (string, optional): User ID for tracking

**Returns:** `Promise<void>`

#### `trackEvent(eventName: string, parameters?: object)`
Tracks a custom event.

```typescript
await analyticsService.trackEvent('food_scan_completed', {
  food_type: 'apple',
  confidence: 0.95,
  processing_time: 1500
});
```

**Parameters:**
- `eventName` (string): Name of the event
- `parameters` (object, optional): Event parameters

**Returns:** `Promise<void>`

#### `trackScreenView(screenName: string, screenClass?: string)`
Tracks a screen view.

```typescript
await analyticsService.trackScreenView('DashboardScreen', 'Dashboard');
```

**Parameters:**
- `screenName` (string): Name of the screen
- `screenClass` (string, optional): Screen class/category

**Returns:** `Promise<void>`

#### `trackUserAction(action: string, context?: object)`
Tracks a user action.

```typescript
await analyticsService.trackUserAction('button_clicked', {
  button_name: 'scan_food',
  screen: 'dashboard'
});
```

**Parameters:**
- `action` (string): Action performed
- `context` (object, optional): Action context

**Returns:** `Promise<void>`

#### `trackError(error: Error, context?: object, isFatal?: boolean)`
Tracks an error or crash.

```typescript
await analyticsService.trackError(
  new Error('Network request failed'),
  { component: 'FoodService', method: 'scanFood' },
  false
);
```

**Parameters:**
- `error` (Error): Error object
- `context` (object, optional): Error context
- `isFatal` (boolean, optional): Whether the error is fatal

**Returns:** `Promise<void>`

#### `setUserProperties(properties: object)`
Sets user properties for analytics.

```typescript
await analyticsService.setUserProperties({
  subscription_tier: 'premium',
  total_scans: 150,
  preferred_language: 'en'
});
```

**Parameters:**
- `properties` (object): User properties to set

**Returns:** `Promise<void>`

## Error Handling

All API methods use consistent error handling with custom error types.

### Error Types

```typescript
class APIError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}

class AuthError extends APIError {
  // Authentication-specific errors
}

class NetworkError extends APIError {
  // Network-related errors
}

class ValidationError extends APIError {
  // Input validation errors
}

class SubscriptionError extends APIError {
  // Subscription-related errors
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| `AUTH_USER_NOT_FOUND` | User account not found |
| `AUTH_EMAIL_ALREADY_EXISTS` | Email already registered |
| `SCAN_PROCESSING_FAILED` | Food scanning failed |
| `SCAN_INVALID_IMAGE` | Invalid image format or size |
| `SUBSCRIPTION_PAYMENT_FAILED` | Payment processing failed |
| `SUBSCRIPTION_NOT_FOUND` | Subscription not found |
| `NETWORK_TIMEOUT` | Request timeout |
| `NETWORK_OFFLINE` | No internet connection |
| `VALIDATION_REQUIRED_FIELD` | Required field missing |
| `VALIDATION_INVALID_FORMAT` | Invalid data format |

### Error Handling Example

```typescript
try {
  const result = await foodRecognitionService.scanFood(imageUri);
  // Handle success
} catch (error) {
  if (error instanceof AuthError) {
    // Handle authentication error
    console.error('Authentication failed:', error.message);
  } else if (error instanceof NetworkError) {
    // Handle network error
    console.error('Network error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error.message);
  }
}
```

## Rate Limiting

API endpoints have rate limiting to ensure fair usage and prevent abuse.

### Limits by Subscription Tier

| Tier | Daily Scans | API Requests/Hour | Concurrent Requests |
|------|-------------|-------------------|-------------------|
| Basic (Free) | 5 | 100 | 2 |
| Premium | Unlimited | 1000 | 10 |
| Annual | Unlimited | 2000 | 15 |

### Rate Limit Headers

API responses include rate limit information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Security

### Authentication
- JWT tokens for API authentication
- Token refresh mechanism for long-lived sessions
- Secure token storage using encrypted storage

### Data Protection
- AES encryption for sensitive data
- HTTPS for all API communications
- Input validation and sanitization
- SQL injection prevention

### Privacy
- GDPR compliance with data export/deletion
- User consent management
- Data anonymization for analytics
- Secure data transmission and storage

### API Security
- Request signing for sensitive operations
- CORS protection
- Rate limiting and DDoS protection
- Input validation and sanitization

---

For more information or support, please contact our development team or refer to the main README documentation.

