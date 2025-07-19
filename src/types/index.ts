// Core application types and interfaces

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  goals: NutritionGoals;
  dietaryRestrictions: string[];
  allergies: string[];
  medicalConditions: string[];
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  mealReminders: boolean;
  waterReminders: boolean;
  goalAchievements: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

export interface PrivacySettings {
  shareDataForResearch: boolean;
  allowAnalytics: boolean;
  shareProgressWithFriends: boolean;
}

export interface NutritionGoals {
  dailyCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
  sodium: number; // mg
  water: number; // ml
  goalType: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain';
  targetWeight?: number; // kg
  weeklyWeightGoal?: number; // kg per week
}

// Food and nutrition types
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  barcode?: string;
  nutritionPer100g: NutritionInfo;
  commonPortions: Portion[];
  verified: boolean;
  source: 'usda' | 'user_generated' | 'brand_verified' | 'ai_recognized';
  createdAt: string;
  updatedAt: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
}

export interface Portion {
  id: string;
  name: string;
  weight: number; // grams
  volume?: number; // ml
  description?: string;
  isDefault?: boolean;
}

export type FoodCategory = 
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'protein'
  | 'dairy'
  | 'fats_oils'
  | 'beverages'
  | 'snacks'
  | 'desserts'
  | 'fast_food'
  | 'prepared_meals'
  | 'condiments'
  | 'other';

// Scanning and recognition types
export interface ScanResult {
  id: string;
  timestamp: string;
  imageUri: string;
  foodItem: RecognizedFood;
  volumeEstimation: VolumeEstimation;
  nutrition: NutritionInfo;
  recognitionResult: RecognitionResult;
  isAccurate: boolean | null;
  userCorrections?: UserCorrections;
  processingMetadata: ProcessingMetadata;
}

export interface RecognizedFood {
  name: string;
  confidence: number;
  category: FoodCategory;
  alternativeNames: string[];
  nutritionPer100g: NutritionInfo;
  boundingBox?: BoundingBox;
}

export interface VolumeEstimation {
  estimatedVolume: number; // ml
  estimatedWeight: number; // grams
  confidence: number;
  method: VolumeEstimationMethod;
  boundingBox: BoundingBox;
  shapeAnalysis: ShapeAnalysis;
  depthEstimation?: DepthEstimation;
  referenceObject?: ReferenceObject;
}

export type VolumeEstimationMethod = 
  | '3d_analysis'
  | 'reference_object'
  | 'ml_estimation'
  | 'shape_analysis'
  | 'user_input';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShapeAnalysis {
  shape: 'spherical' | 'cylindrical' | 'rectangular' | 'irregular';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  surfaceArea: number;
  confidence: number;
}

export interface DepthEstimation {
  hasDepthData: boolean;
  averageDepth: number;
  depthVariance: number;
  method: 'stereo_vision' | 'ml_depth' | 'lidar' | 'estimated';
}

export interface ReferenceObject {
  name: string;
  realWorldSize: {
    width: number;
    height: number;
    depth?: number;
  };
  pixelSize: {
    width: number;
    height: number;
  };
  confidence: number;
}

export interface RecognitionResult {
  processingTime: number;
  imageAnalysis: ImageAnalysis;
  confidence: number;
  alternativeResults: AlternativeRecognition[];
  metadata: RecognitionMetadata;
}

export interface ImageAnalysis {
  brightness: number;
  contrast: number;
  sharpness: number;
  quality: ImageQuality;
  hasFood: boolean;
  multipleItems: boolean;
  lighting: LightingCondition;
}

export type ImageQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type LightingCondition = 'excellent' | 'good' | 'low' | 'harsh_shadows' | 'backlit';

export interface AlternativeRecognition {
  name: string;
  confidence: number;
  category: FoodCategory;
}

export interface RecognitionMetadata {
  modelVersion: string;
  processingNode: string;
  apiVersion: string;
  requestId: string;
}

export interface UserCorrections {
  foodName?: string;
  portionWeight?: number;
  nutritionAdjustments?: Partial<NutritionInfo>;
  notes?: string;
  timestamp: string;
}

export interface ProcessingMetadata {
  deviceInfo: DeviceInfo;
  appVersion: string;
  processingDuration: number;
  batteryLevel?: number;
  networkType?: string;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  osVersion: string;
  deviceModel: string;
  screenDimensions: {
    width: number;
    height: number;
  };
}

// Feedback and accuracy types
export interface AccuracyFeedback {
  id: string;
  scanId: string;
  userId: string;
  isAccurate: boolean;
  corrections?: UserCorrections;
  issues: FeedbackIssue[];
  feedback?: string;
  timestamp: string;
  processed: boolean;
}

export type FeedbackIssue = 
  | 'wrong_food_identified'
  | 'portion_size_too_large'
  | 'portion_size_too_small'
  | 'multiple_foods_not_detected'
  | 'poor_image_quality'
  | 'lighting_issues'
  | 'food_partially_hidden'
  | 'nutrition_values_incorrect'
  | 'other';

// Meal logging types
export interface MealEntry {
  id: string;
  userId: string;
  timestamp: string;
  mealType: MealType;
  foods: FoodEntry[];
  totalNutrition: NutritionInfo;
  notes?: string;
  mood?: MoodRating;
  location?: string;
  tags: string[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export interface FoodEntry {
  id: string;
  foodItem: FoodItem;
  portion: Portion;
  quantity: number;
  nutrition: NutritionInfo;
  source: 'scan' | 'manual' | 'barcode' | 'voice' | 'quick_add';
  scanId?: string;
}

export type MoodRating = 1 | 2 | 3 | 4 | 5;

// Subscription and payment types
export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  priceId: string;
  trialEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionTier = 'basic' | 'premium' | 'annual';

export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface SubscriptionLimits {
  dailyScans: number;
  monthlyScans: number;
  advancedFeatures: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  customGoals: boolean;
  mealPlanning: boolean;
  nutritionistConsultation: boolean;
}

// Analytics and insights types
export interface NutritionInsight {
  id: string;
  userId: string;
  type: InsightType;
  title: string;
  description: string;
  data: any;
  priority: InsightPriority;
  actionable: boolean;
  dismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export type InsightType = 
  | 'calorie_trend'
  | 'macro_balance'
  | 'nutrient_deficiency'
  | 'eating_pattern'
  | 'goal_progress'
  | 'food_variety'
  | 'meal_timing'
  | 'hydration'
  | 'mood_correlation';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export interface DailyStats {
  date: string;
  userId: string;
  nutrition: NutritionInfo;
  goals: NutritionGoals;
  progress: NutritionProgress;
  meals: MealEntry[];
  water: number;
  mood?: MoodRating;
  weight?: number;
  exercise?: ExerciseEntry[];
  scanCount: number;
  accuracyRate: number;
}

export interface NutritionProgress {
  calories: ProgressMetric;
  protein: ProgressMetric;
  carbs: ProgressMetric;
  fat: ProgressMetric;
  fiber: ProgressMetric;
  water: ProgressMetric;
}

export interface ProgressMetric {
  current: number;
  goal: number;
  percentage: number;
  status: 'under' | 'on_track' | 'over' | 'exceeded';
}

export interface ExerciseEntry {
  id: string;
  type: string;
  duration: number; // minutes
  caloriesBurned: number;
  intensity: 'low' | 'moderate' | 'high';
  timestamp: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    enableBetaFeatures: boolean;
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enablePerformanceMonitoring: boolean;
  };
  limits: {
    maxImageSize: number;
    maxUploadSize: number;
    cacheSize: number;
    offlineStorageLimit: number;
  };
  ai: {
    confidenceThreshold: number;
    maxProcessingTime: number;
    enableGpuAcceleration: boolean;
    modelVersion: string;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event types for analytics
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

// Error types
export interface AppError extends Error {
  code: string;
  context?: Record<string, any>;
  retryable: boolean;
  timestamp: string;
}

