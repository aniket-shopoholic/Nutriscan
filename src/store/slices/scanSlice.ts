import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ScanResult {
  id: string;
  timestamp: string;
  imageUri: string;
  foodItem: {
    name: string;
    confidence: number;
    category: string;
    nutritionPer100g: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      sodium: number;
    };
  };
  volumeEstimation: {
    estimatedVolume: number;
    estimatedWeight: number;
    confidence: number;
    method: '3d_analysis' | 'reference_object' | 'ml_estimation';
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  recognitionResult: {
    processingTime: number;
    imageAnalysis: {
      brightness: number;
      contrast: number;
      sharpness: number;
      quality: 'excellent' | 'good' | 'fair' | 'poor';
    };
    confidence: number;
  };
  isAccurate: boolean | null;
  userCorrections?: {
    foodName?: string;
    portionWeight?: number;
    nutritionAdjustments?: Partial<{
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
  };
}

export interface AccuracyFeedback {
  scanId: string;
  isAccurate: boolean;
  corrections?: {
    foodName?: string;
    portionWeight?: number;
    nutritionAdjustments?: any;
  };
  feedback?: string;
  timestamp: string;
}

interface ScanState {
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  dailyScanCount: number;
  maxDailyScans: number;
  accuracyFeedback: AccuracyFeedback[];
  scanningSettings: {
    enableFlash: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    enable3DAnalysis: boolean;
    enableBatteryOptimization: boolean;
  };
  processingStats: {
    averageProcessingTime: number;
    totalScans: number;
    successfulScans: number;
    failedScans: number;
  };
}

const initialState: ScanState = {
  currentScan: null,
  scanHistory: [],
  isScanning: false,
  isProcessing: false,
  error: null,
  dailyScanCount: 0,
  maxDailyScans: 5, // Default for basic plan
  accuracyFeedback: [],
  scanningSettings: {
    enableFlash: true,
    imageQuality: 'medium',
    enable3DAnalysis: true,
    enableBatteryOptimization: true,
  },
  processingStats: {
    averageProcessingTime: 0,
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
  },
};

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setScanResult: (state, action: PayloadAction<ScanResult>) => {
      state.currentScan = action.payload;
      state.scanHistory.unshift(action.payload);
      state.dailyScanCount += 1;
      state.isProcessing = false;
      state.isScanning = false;
      
      // Update processing stats
      state.processingStats.totalScans += 1;
      state.processingStats.successfulScans += 1;
      
      // Update average processing time
      const currentAvg = state.processingStats.averageProcessingTime;
      const newTime = action.payload.recognitionResult.processingTime;
      state.processingStats.averageProcessingTime = 
        (currentAvg * (state.processingStats.successfulScans - 1) + newTime) / state.processingStats.successfulScans;
      
      // Keep only last 100 scans in history
      if (state.scanHistory.length > 100) {
        state.scanHistory = state.scanHistory.slice(0, 100);
      }
    },
    setScanFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isScanning = false;
      state.isProcessing = false;
      state.processingStats.totalScans += 1;
      state.processingStats.failedScans += 1;
    },
    clearCurrentScan: (state) => {
      state.currentScan = null;
    },
    updateScanAccuracy: (state, action: PayloadAction<{ scanId: string; isAccurate: boolean; corrections?: any }>) => {
      const { scanId, isAccurate, corrections } = action.payload;
      
      // Update scan in history
      const scanIndex = state.scanHistory.findIndex(scan => scan.id === scanId);
      if (scanIndex !== -1) {
        state.scanHistory[scanIndex].isAccurate = isAccurate;
        if (corrections) {
          state.scanHistory[scanIndex].userCorrections = corrections;
        }
      }
      
      // Update current scan if it matches
      if (state.currentScan && state.currentScan.id === scanId) {
        state.currentScan.isAccurate = isAccurate;
        if (corrections) {
          state.currentScan.userCorrections = corrections;
        }
      }
    },
    addAccuracyFeedback: (state, action: PayloadAction<AccuracyFeedback>) => {
      state.accuracyFeedback.push(action.payload);
      
      // Keep only last 500 feedback entries
      if (state.accuracyFeedback.length > 500) {
        state.accuracyFeedback = state.accuracyFeedback.slice(-500);
      }
    },
    updateScanningSettings: (state, action: PayloadAction<Partial<ScanState['scanningSettings']>>) => {
      state.scanningSettings = { ...state.scanningSettings, ...action.payload };
    },
    setMaxDailyScans: (state, action: PayloadAction<number>) => {
      state.maxDailyScans = action.payload;
    },
    resetDailyScanCount: (state) => {
      state.dailyScanCount = 0;
    },
    deleteScanFromHistory: (state, action: PayloadAction<string>) => {
      state.scanHistory = state.scanHistory.filter(scan => scan.id !== action.payload);
      
      // Clear current scan if it matches
      if (state.currentScan && state.currentScan.id === action.payload) {
        state.currentScan = null;
      }
    },
    clearScanHistory: (state) => {
      state.scanHistory = [];
      state.currentScan = null;
    },
    updateScanNutrition: (state, action: PayloadAction<{ scanId: string; nutrition: any }>) => {
      const { scanId, nutrition } = action.payload;
      
      // Update scan in history
      const scanIndex = state.scanHistory.findIndex(scan => scan.id === scanId);
      if (scanIndex !== -1) {
        state.scanHistory[scanIndex].nutrition = { ...state.scanHistory[scanIndex].nutrition, ...nutrition };
      }
      
      // Update current scan if it matches
      if (state.currentScan && state.currentScan.id === scanId) {
        state.currentScan.nutrition = { ...state.currentScan.nutrition, ...nutrition };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    // Legacy actions for backward compatibility
    startScanning: (state) => {
      state.isScanning = true;
      state.error = null;
    },
    stopScanning: (state) => {
      state.isScanning = false;
    },
    startProcessing: (state) => {
      state.isProcessing = true;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isScanning = false;
      state.isProcessing = false;
    },
    setAccuracyFeedback: (state, action: PayloadAction<{ scanId: string; isAccurate: boolean }>) => {
      const feedback: AccuracyFeedback = {
        scanId: action.payload.scanId,
        isAccurate: action.payload.isAccurate,
        timestamp: new Date().toISOString(),
      };
      state.accuracyFeedback.push(feedback);
    },
  },
});

export const {
  setScanning,
  setProcessing,
  setScanResult,
  setScanFailed,
  clearCurrentScan,
  updateScanAccuracy,
  addAccuracyFeedback,
  updateScanningSettings,
  setMaxDailyScans,
  resetDailyScanCount,
  deleteScanFromHistory,
  clearScanHistory,
  updateScanNutrition,
  clearError,
  // Legacy exports
  startScanning,
  stopScanning,
  startProcessing,
  setError,
  setAccuracyFeedback,
} = scanSlice.actions;

export default scanSlice.reducer;

