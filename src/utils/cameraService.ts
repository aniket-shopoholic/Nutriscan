import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

export interface CameraPermissions {
  camera: boolean;
  microphone: boolean;
}

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
  timestamp: number;
}

class CameraService {
  private camera: Camera | null = null;

  // Check and request camera permissions
  async requestCameraPermissions(): Promise<CameraPermissions> {
    try {
      if (Platform.OS === 'android') {
        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'NutriScan Pro needs access to your camera to scan food items.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return {
          camera: cameraPermission === PermissionsAndroid.RESULTS.GRANTED,
          microphone: false, // We don't need microphone for food scanning
        };
      } else {
        // iOS permissions are handled automatically by react-native-vision-camera
        const cameraPermission = await Camera.requestCameraPermission();
        
        return {
          camera: cameraPermission === 'authorized',
          microphone: false,
        };
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return { camera: false, microphone: false };
    }
  }

  // Check current permission status
  async getCameraPermissionStatus(): Promise<string> {
    try {
      return await Camera.getCameraPermissionStatus();
    } catch (error) {
      console.error('Error getting camera permission status:', error);
      return 'not-determined';
    }
  }

  // Get available camera devices
  async getAvailableDevices() {
    try {
      const devices = await Camera.getAvailableCameraDevices();
      return devices;
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  // Get the best camera device for food scanning (back camera with good resolution)
  async getBestCameraDevice() {
    try {
      const devices = await this.getAvailableDevices();
      
      // Prefer back camera with highest resolution
      const backCameras = devices.filter(device => device.position === 'back');
      if (backCameras.length > 0) {
        // Sort by resolution and return the best one
        return backCameras.sort((a, b) => {
          const aRes = a.formats[0]?.videoWidth * a.formats[0]?.videoHeight || 0;
          const bRes = b.formats[0]?.videoWidth * b.formats[0]?.videoHeight || 0;
          return bRes - aRes;
        })[0];
      }

      // Fallback to any available camera
      return devices[0] || null;
    } catch (error) {
      console.error('Error getting best camera device:', error);
      return null;
    }
  }

  // Capture photo for food scanning
  async capturePhoto(camera: Camera): Promise<CapturedImage | null> {
    try {
      if (!camera) {
        throw new Error('Camera reference not available');
      }

      const photo = await camera.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'auto',
        enableAutoRedEyeReduction: true,
      });

      // Get image dimensions and size
      const imageInfo = await RNFS.stat(photo.path);
      
      const capturedImage: CapturedImage = {
        uri: `file://${photo.path}`,
        width: photo.width,
        height: photo.height,
        size: imageInfo.size,
        timestamp: Date.now(),
      };

      return capturedImage;
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
      return null;
    }
  }

  // Resize image for processing (to reduce processing time and API costs)
  async resizeImageForProcessing(imageUri: string, maxWidth = 1024, maxHeight = 1024): Promise<string> {
    try {
      const resizedImage = await ImageResizer.createResizedImage(
        imageUri,
        maxWidth,
        maxHeight,
        'JPEG',
        80, // Quality 80%
        0,   // Rotation
        undefined, // Output path (auto-generated)
        false, // Keep metadata
        {
          mode: 'contain',
          onlyScaleDown: true,
        }
      );

      return resizedImage.uri;
    } catch (error) {
      console.error('Error resizing image:', error);
      return imageUri; // Return original if resize fails
    }
  }

  // Save captured image to app's document directory
  async saveImageToDocuments(imageUri: string, filename?: string): Promise<string> {
    try {
      const documentsPath = RNFS.DocumentDirectoryPath;
      const imagesDir = `${documentsPath}/captured_images`;
      
      // Create images directory if it doesn't exist
      const dirExists = await RNFS.exists(imagesDir);
      if (!dirExists) {
        await RNFS.mkdir(imagesDir);
      }

      const fileName = filename || `food_scan_${Date.now()}.jpg`;
      const destinationPath = `${imagesDir}/${fileName}`;

      // Copy image to documents directory
      await RNFS.copyFile(imageUri, destinationPath);

      return destinationPath;
    } catch (error) {
      console.error('Error saving image to documents:', error);
      throw new Error('Failed to save image');
    }
  }

  // Delete captured image
  async deleteImage(imageUri: string): Promise<void> {
    try {
      const exists = await RNFS.exists(imageUri);
      if (exists) {
        await RNFS.unlink(imageUri);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  // Get image metadata for 3D analysis
  async getImageMetadata(imageUri: string) {
    try {
      const stat = await RNFS.stat(imageUri);
      return {
        size: stat.size,
        modificationTime: stat.mtime,
        isFile: stat.isFile(),
        path: imageUri,
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      return null;
    }
  }

  // Validate image for food scanning
  validateImageForScanning(image: CapturedImage): { isValid: boolean; message?: string } {
    // Check minimum resolution
    if (image.width < 480 || image.height < 480) {
      return {
        isValid: false,
        message: 'Image resolution too low. Please ensure good lighting and try again.',
      };
    }

    // Check file size (not too small, indicating poor quality)
    if (image.size < 50000) { // 50KB
      return {
        isValid: false,
        message: 'Image quality too low. Please ensure good lighting and try again.',
      };
    }

    // Check if file size is too large (might cause processing issues)
    if (image.size > 10000000) { // 10MB
      return {
        isValid: false,
        message: 'Image file too large. Please try again.',
      };
    }

    return { isValid: true };
  }

  // Clean up old captured images (keep only last 50)
  async cleanupOldImages(): Promise<void> {
    try {
      const documentsPath = RNFS.DocumentDirectoryPath;
      const imagesDir = `${documentsPath}/captured_images`;
      
      const dirExists = await RNFS.exists(imagesDir);
      if (!dirExists) return;

      const files = await RNFS.readDir(imagesDir);
      const imageFiles = files
        .filter(file => file.isFile() && file.name.endsWith('.jpg'))
        .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

      // Keep only the 50 most recent images
      const filesToDelete = imageFiles.slice(50);
      
      for (const file of filesToDelete) {
        await RNFS.unlink(file.path);
      }

      console.log(`Cleaned up ${filesToDelete.length} old images`);
    } catch (error) {
      console.error('Error cleaning up old images:', error);
    }
  }
}

export default new CameraService();

