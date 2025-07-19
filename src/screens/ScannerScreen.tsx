import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import { Button, IconButton, Card, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AppDispatch, RootState } from '../store';
import { setScanResult, setScanning } from '../store/slices/scanSlice';
import cameraService, { CapturedImage } from '../utils/cameraService';
import foodRecognitionService from '../utils/foodRecognitionService';
import { COLORS } from '../constants';
import { LoadingSpinner } from '../components/common';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isScanning } = useSelector((state: RootState) => state.scan);
  const { subscriptionTier } = useSelector((state: RootState) => state.subscription);
  
  const [isActive, setIsActive] = useState(true);
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);
  
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    // Initialize food recognition service
    foodRecognitionService.initialize().catch(console.error);
    
    return () => {
      // Cleanup when component unmounts
      setIsActive(false);
    };
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    // Check subscription limits for basic users
    if (subscriptionTier === 'basic') {
      // TODO: Check daily scan count from Redux store
      // For now, we'll allow the scan
    }

    try {
      setIsProcessing(true);
      dispatch(setScanning(true));

      // Capture photo
      const capturedImage = await cameraService.capturePhoto(cameraRef.current);
      if (!capturedImage) {
        throw new Error('Failed to capture image');
      }

      // Validate image quality
      const validation = cameraService.validateImageForScanning(capturedImage);
      if (!validation.isValid) {
        Alert.alert('Image Quality Issue', validation.message);
        return;
      }

      // Resize image for processing
      const resizedImageUri = await cameraService.resizeImageForProcessing(capturedImage.uri);

      // Recognize food in image
      const recognitionResult = await foodRecognitionService.recognizeFood(resizedImageUri);

      if (recognitionResult.foodItems.length === 0) {
        Alert.alert(
          'No Food Detected',
          'We couldn\'t identify any food in this image. Please try again with better lighting and make sure the food is clearly visible.'
        );
        return;
      }

      const primaryFoodItem = recognitionResult.foodItems[0];

      // Estimate 3D volume and portion size
      const volumeEstimation = await foodRecognitionService.estimate3DVolume(
        resizedImageUri,
        primaryFoodItem
      );

      // Calculate nutrition for estimated portion
      const nutrition = foodRecognitionService.calculateNutritionForPortion(
        primaryFoodItem,
        volumeEstimation.estimatedWeight
      );

      // Save scan result to Redux store
      const scanResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageUri: capturedImage.uri,
        foodItem: primaryFoodItem,
        volumeEstimation,
        nutrition,
        recognitionResult,
        isAccurate: null, // Will be set by user feedback
      };

      dispatch(setScanResult(scanResult));

      // Navigate to scan result screen
      navigation.navigate('ScanResult' as never);

    } catch (error) {
      console.error('Error processing scan:', error);
      Alert.alert(
        'Scan Failed',
        'Failed to process the image. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      dispatch(setScanning(false));
    }
  };

  const toggleFlash = () => {
    setFlash(current => {
      switch (current) {
        case 'off': return 'auto';
        case 'auto': return 'on';
        case 'on': return 'off';
        default: return 'auto';
      }
    });
  };

  const getFlashIcon = () => {
    switch (flash) {
      case 'on': return 'flash';
      case 'off': return 'flash-off';
      case 'auto': return 'flash-auto';
      default: return 'flash-auto';
    }
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            NutriScan Pro needs camera access to scan and analyze your food.
          </Text>
          <Button
            mode="contained"
            onPress={requestPermission}
            style={styles.permissionButton}
            buttonColor={COLORS.primary}
          >
            Grant Permission
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No camera device available</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Analyzing your food..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={isActive}
        photo={true}
        flash={flash}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top controls */}
        <View style={styles.topControls}>
          <IconButton
            icon="close"
            iconColor="white"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <IconButton
            icon={getFlashIcon()}
            iconColor="white"
            size={24}
            onPress={toggleFlash}
          />
        </View>

        {/* Scanning frame */}
        <View style={styles.scanningFrame}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Card style={styles.instructionsCard}>
            <Card.Content>
              <Text style={styles.instructionsTitle}>Position your food</Text>
              <Text style={styles.instructionsText}>
                • Center the food in the frame{'\n'}
                • Ensure good lighting{'\n'}
                • Include the entire portion{'\n'}
                • Avoid shadows and reflections
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={isProcessing}
            >
              <View style={styles.captureButtonInner}>
                {isProcessing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <View style={styles.captureButtonDot} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription tier indicator */}
        {subscriptionTier === 'basic' && (
          <View style={styles.subscriptionIndicator}>
            <Text style={styles.subscriptionText}>
              Basic Plan • Limited scans
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scanningFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '25%',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
  },
  instructionsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomControls: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  subscriptionIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  subscriptionText: {
    color: 'white',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
  },
});

export default ScannerScreen;

