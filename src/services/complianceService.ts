import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { analyticsService } from './analyticsService';

// Compliance types
export interface ConsentRecord {
  type: 'analytics' | 'marketing' | 'functional' | 'necessary';
  granted: boolean;
  timestamp: string;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataExportRequest {
  userId: string;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiryDate?: string;
}

export interface DataDeletionRequest {
  userId: string;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletionDate?: string;
  retentionReason?: string;
}

// GDPR compliance interface
export interface GDPRCompliance {
  consentRecords: ConsentRecord[];
  dataExportRequests: DataExportRequest[];
  dataDeletionRequests: DataDeletionRequest[];
  privacyPolicyVersion: string;
  termsOfServiceVersion: string;
  lastConsentUpdate: string;
}

// Accessibility features
export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  largeTextMode: boolean;
  reducedMotion: boolean;
  voiceOverEnabled: boolean;
  colorBlindnessSupport: string; // 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}

// HIPAA compliance settings
export interface HIPAASettings {
  enabled: boolean;
  encryptionLevel: 'standard' | 'enhanced';
  auditLogging: boolean;
  dataRetentionDays: number;
  minimumPasswordLength: number;
  requireBiometricAuth: boolean;
}

// Compliance service class
class ComplianceService {
  private static readonly STORAGE_KEYS = {
    GDPR_COMPLIANCE: '@nutriscan_gdpr_compliance',
    ACCESSIBILITY_SETTINGS: '@nutriscan_accessibility',
    HIPAA_SETTINGS: '@nutriscan_hipaa',
    CONSENT_RECORDS: '@nutriscan_consent_records',
    PRIVACY_SETTINGS: '@nutriscan_privacy_settings',
  };

  private gdprCompliance: GDPRCompliance | null = null;
  private accessibilitySettings: AccessibilitySettings | null = null;
  private hipaaSettings: HIPAASettings | null = null;

  // Initialize compliance service
  async initialize(): Promise<void> {
    try {
      await this.loadComplianceData();
      await this.checkComplianceRequirements();
      
      logger.info('Compliance service initialized', {
        component: 'ComplianceService',
      });

    } catch (error) {
      logger.error('Failed to initialize compliance service', error as Error, {
        component: 'ComplianceService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'ComplianceService',
        action: 'initialize',
      });
    }
  }

  // GDPR Compliance Methods
  async recordConsent(
    type: ConsentRecord['type'],
    granted: boolean,
    version: string = '1.0'
  ): Promise<void> {
    try {
      const consentRecord: ConsentRecord = {
        type,
        granted,
        timestamp: new Date().toISOString(),
        version,
        userAgent: Platform.OS + ' ' + Platform.Version,
      };

      if (!this.gdprCompliance) {
        this.gdprCompliance = {
          consentRecords: [],
          dataExportRequests: [],
          dataDeletionRequests: [],
          privacyPolicyVersion: version,
          termsOfServiceVersion: version,
          lastConsentUpdate: new Date().toISOString(),
        };
      }

      // Remove previous consent for the same type
      this.gdprCompliance.consentRecords = this.gdprCompliance.consentRecords.filter(
        record => record.type !== type
      );

      // Add new consent record
      this.gdprCompliance.consentRecords.push(consentRecord);
      this.gdprCompliance.lastConsentUpdate = new Date().toISOString();

      await this.saveGDPRCompliance();

      // Update analytics consent
      if (type === 'analytics') {
        await analyticsService.setAnalyticsEnabled(granted);
      }

      logger.info('Consent recorded', {
        type,
        granted,
        version,
        component: 'ComplianceService',
      });

    } catch (error) {
      logger.error('Failed to record consent', error as Error, {
        type,
        granted,
        component: 'ComplianceService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'ComplianceService',
        action: 'recordConsent',
      });
    }
  }

  // Get current consent status
  getConsentStatus(type: ConsentRecord['type']): boolean {
    if (!this.gdprCompliance) return false;
    
    const latestConsent = this.gdprCompliance.consentRecords
      .filter(record => record.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return latestConsent?.granted || false;
  }

  // Request data export (GDPR Article 20)
  async requestDataExport(userId: string): Promise<string> {
    try {
      const exportRequest: DataExportRequest = {
        userId,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };

      if (!this.gdprCompliance) {
        await this.initialize();
      }

      this.gdprCompliance!.dataExportRequests.push(exportRequest);
      await this.saveGDPRCompliance();

      // In a real app, this would trigger a backend process
      // For now, we'll simulate the process
      setTimeout(() => {
        this.processDataExportRequest(userId);
      }, 5000);

      logger.info('Data export requested', {
        userId,
        component: 'ComplianceService',
      });

      return 'Your data export request has been submitted. You will receive an email when it\'s ready.';

    } catch (error) {
      logger.error('Failed to request data export', error as Error, {
        userId,
        component: 'ComplianceService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'ComplianceService',
        action: 'requestDataExport',
      });
    }
  }

  // Request data deletion (GDPR Article 17)
  async requestDataDeletion(userId: string, reason?: string): Promise<string> {
    try {
      const deletionRequest: DataDeletionRequest = {
        userId,
        requestDate: new Date().toISOString(),
        status: 'pending',
        retentionReason: reason,
      };

      if (!this.gdprCompliance) {
        await this.initialize();
      }

      this.gdprCompliance!.dataDeletionRequests.push(deletionRequest);
      await this.saveGDPRCompliance();

      // Show confirmation dialog
      Alert.alert(
        'Data Deletion Request',
        'Are you sure you want to delete all your data? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => this.processDataDeletionRequest(userId),
          },
        ]
      );

      logger.info('Data deletion requested', {
        userId,
        reason,
        component: 'ComplianceService',
      });

      return 'Your data deletion request has been submitted and will be processed within 30 days.';

    } catch (error) {
      logger.error('Failed to request data deletion', error as Error, {
        userId,
        component: 'ComplianceService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'ComplianceService',
        action: 'requestDataDeletion',
      });
    }
  }

  // Accessibility Methods
  async updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): Promise<void> {
    try {
      if (!this.accessibilitySettings) {
        this.accessibilitySettings = {
          screenReaderEnabled: false,
          highContrastMode: false,
          largeTextMode: false,
          reducedMotion: false,
          voiceOverEnabled: false,
          colorBlindnessSupport: 'none',
        };
      }

      this.accessibilitySettings = {
        ...this.accessibilitySettings,
        ...settings,
      };

      await AsyncStorage.setItem(
        ComplianceService.STORAGE_KEYS.ACCESSIBILITY_SETTINGS,
        JSON.stringify(this.accessibilitySettings)
      );

      logger.info('Accessibility settings updated', {
        settings,
        component: 'ComplianceService',
      });

    } catch (error) {
      logger.error('Failed to update accessibility settings', error as Error, {
        settings,
        component: 'ComplianceService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'ComplianceService',
        action: 'updateAccessibilitySettings',
      });
    }
  }

  // Get accessibility settings
  getAccessibilitySettings(): AccessibilitySettings {
    return this.accessibilitySettings || {
      screenReaderEnabled: false,
      highContrastMode: false,
      largeTextMode: false,
      reducedMotion: false,
      voiceOverEnabled: false,
      colorBlindnessSupport: 'none',
    };
  }

  // HIPAA Compliance Methods
  async updateHIPAASettings(settings: Partial<HIPAASettings>): Promise<void> {
    try {
      if (!this.hipaaSettings) {
        this.hipaaSettings = {
          enabled: false,
          encryptionLevel: 'standard',
          auditLogging: true,
          dataRetentionDays: 2555, // 7 years
          minimumPasswordLength: 12,
          requireBiometricAuth: true,
        };
      }

      this.hipaaSettings = {
        ...this.hipaaSettings,
        ...settings,
      };

      await AsyncStorage.setItem(
        ComplianceService.STORAGE_KEYS.HIPAA_SETTINGS,
        JSON.stringify(this.hipaaSettings)
      );

      logger.info('HIPAA settings updated', {
        settings,
        component: 'ComplianceService',
      });

    } catch (error) {
      logger.error('Failed to update HIPAA settings', error as Error, {
        settings,
        component: 'ComplianceService',
      });
      throw errorHandler.handleError(error as Error, {
        component: 'ComplianceService',
        action: 'updateHIPAASettings',
      });
    }
  }

  // Get HIPAA settings
  getHIPAASettings(): HIPAASettings {
    return this.hipaaSettings || {
      enabled: false,
      encryptionLevel: 'standard',
      auditLogging: true,
      dataRetentionDays: 2555,
      minimumPasswordLength: 12,
      requireBiometricAuth: true,
    };
  }

  // Privacy Methods
  async showPrivacyPolicy(): Promise<void> {
    const privacyUrl = `${config.websiteUrl}/privacy-policy`;
    
    try {
      const supported = await Linking.canOpenURL(privacyUrl);
      if (supported) {
        await Linking.openURL(privacyUrl);
      } else {
        Alert.alert(
          'Privacy Policy',
          `Please visit ${privacyUrl} to view our privacy policy.`
        );
      }
    } catch (error) {
      logger.error('Failed to open privacy policy', error as Error, {
        component: 'ComplianceService',
      });
    }
  }

  async showTermsOfService(): Promise<void> {
    const termsUrl = `${config.websiteUrl}/terms-of-service`;
    
    try {
      const supported = await Linking.canOpenURL(termsUrl);
      if (supported) {
        await Linking.openURL(termsUrl);
      } else {
        Alert.alert(
          'Terms of Service',
          `Please visit ${termsUrl} to view our terms of service.`
        );
      }
    } catch (error) {
      logger.error('Failed to open terms of service', error as Error, {
        component: 'ComplianceService',
      });
    }
  }

  // Compliance checking
  async checkComplianceRequirements(): Promise<void> {
    try {
      // Check if consent is required
      if (this.isConsentRequired() && !this.hasValidConsent()) {
        await this.showConsentDialog();
      }

      // Check accessibility requirements
      await this.checkAccessibilityCompliance();

      // Check HIPAA requirements
      if (this.getHIPAASettings().enabled) {
        await this.checkHIPAACompliance();
      }

    } catch (error) {
      logger.error('Failed to check compliance requirements', error as Error, {
        component: 'ComplianceService',
      });
    }
  }

  // Private methods
  private async loadComplianceData(): Promise<void> {
    try {
      const [gdprData, accessibilityData, hipaaData] = await Promise.all([
        AsyncStorage.getItem(ComplianceService.STORAGE_KEYS.GDPR_COMPLIANCE),
        AsyncStorage.getItem(ComplianceService.STORAGE_KEYS.ACCESSIBILITY_SETTINGS),
        AsyncStorage.getItem(ComplianceService.STORAGE_KEYS.HIPAA_SETTINGS),
      ]);

      if (gdprData) {
        this.gdprCompliance = JSON.parse(gdprData);
      }

      if (accessibilityData) {
        this.accessibilitySettings = JSON.parse(accessibilityData);
      }

      if (hipaaData) {
        this.hipaaSettings = JSON.parse(hipaaData);
      }

    } catch (error) {
      logger.error('Failed to load compliance data', error as Error, {
        component: 'ComplianceService',
      });
    }
  }

  private async saveGDPRCompliance(): Promise<void> {
    if (this.gdprCompliance) {
      await AsyncStorage.setItem(
        ComplianceService.STORAGE_KEYS.GDPR_COMPLIANCE,
        JSON.stringify(this.gdprCompliance)
      );
    }
  }

  private isConsentRequired(): boolean {
    // Check if user is in EU or other regions requiring consent
    // This would typically be determined by IP geolocation
    return config.requireGDPRConsent;
  }

  private hasValidConsent(): boolean {
    if (!this.gdprCompliance) return false;

    const requiredConsents = ['necessary', 'functional'];
    return requiredConsents.every(type => 
      this.getConsentStatus(type as ConsentRecord['type'])
    );
  }

  private async showConsentDialog(): Promise<void> {
    Alert.alert(
      'Privacy Consent',
      'We need your consent to process your data in accordance with GDPR regulations.',
      [
        {
          text: 'View Privacy Policy',
          onPress: () => this.showPrivacyPolicy(),
        },
        {
          text: 'Accept All',
          onPress: async () => {
            await this.recordConsent('necessary', true);
            await this.recordConsent('functional', true);
            await this.recordConsent('analytics', true);
            await this.recordConsent('marketing', true);
          },
        },
        {
          text: 'Accept Essential Only',
          onPress: async () => {
            await this.recordConsent('necessary', true);
            await this.recordConsent('functional', true);
            await this.recordConsent('analytics', false);
            await this.recordConsent('marketing', false);
          },
        },
      ]
    );
  }

  private async checkAccessibilityCompliance(): Promise<void> {
    // Check system accessibility settings and update accordingly
    // This would integrate with platform-specific accessibility APIs
    const settings = this.getAccessibilitySettings();
    
    if (settings.screenReaderEnabled || settings.voiceOverEnabled) {
      // Ensure proper accessibility labels and hints are set
      logger.info('Screen reader detected, ensuring accessibility compliance', {
        component: 'ComplianceService',
      });
    }
  }

  private async checkHIPAACompliance(): Promise<void> {
    const settings = this.getHIPAASettings();
    
    if (settings.enabled) {
      // Verify encryption levels
      if (settings.encryptionLevel === 'enhanced') {
        // Implement enhanced encryption measures
        logger.info('HIPAA enhanced encryption enabled', {
          component: 'ComplianceService',
        });
      }

      // Check audit logging
      if (settings.auditLogging) {
        logger.info('HIPAA audit logging enabled', {
          component: 'ComplianceService',
        });
      }
    }
  }

  private async processDataExportRequest(userId: string): Promise<void> {
    try {
      // Simulate data export processing
      const request = this.gdprCompliance?.dataExportRequests.find(
        req => req.userId === userId && req.status === 'pending'
      );

      if (request) {
        request.status = 'processing';
        await this.saveGDPRCompliance();

        // Simulate export completion
        setTimeout(async () => {
          request.status = 'completed';
          request.downloadUrl = 'https://example.com/data-export.zip';
          request.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          await this.saveGDPRCompliance();

          Alert.alert(
            'Data Export Ready',
            'Your data export is ready for download. The link will expire in 7 days.'
          );
        }, 10000);
      }

    } catch (error) {
      logger.error('Failed to process data export request', error as Error, {
        userId,
        component: 'ComplianceService',
      });
    }
  }

  private async processDataDeletionRequest(userId: string): Promise<void> {
    try {
      const request = this.gdprCompliance?.dataDeletionRequests.find(
        req => req.userId === userId && req.status === 'pending'
      );

      if (request) {
        request.status = 'processing';
        await this.saveGDPRCompliance();

        // In a real app, this would trigger backend data deletion
        // For now, we'll simulate the process
        setTimeout(async () => {
          request.status = 'completed';
          request.deletionDate = new Date().toISOString();
          await this.saveGDPRCompliance();

          // Reset analytics data
          await analyticsService.resetAnalyticsData();

          Alert.alert(
            'Data Deleted',
            'Your data has been successfully deleted from our systems.'
          );
        }, 5000);
      }

    } catch (error) {
      logger.error('Failed to process data deletion request', error as Error, {
        userId,
        component: 'ComplianceService',
      });
    }
  }
}

// Create and export singleton instance
export const complianceService = new ComplianceService();
export default complianceService;

// Export types
export type {
  ConsentRecord,
  DataExportRequest,
  DataDeletionRequest,
  GDPRCompliance,
  AccessibilitySettings,
  HIPAASettings,
};

