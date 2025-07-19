import EncryptedStorage from 'react-native-encrypted-storage';
import { firestore, analytics } from './firebase';

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  dataRetention: '1year' | '2years' | '5years' | 'indefinite';
  exportRequested: boolean;
  deletionRequested: boolean;
}

export interface DataExportRequest {
  userId: string;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiryDate?: string;
}

class PrivacyService {
  private readonly PRIVACY_SETTINGS_KEY = 'privacy_settings';
  private readonly CONSENT_KEY = 'gdpr_consent';

  // GDPR Consent Management
  async getConsentStatus(): Promise<boolean> {
    try {
      const consent = await EncryptedStorage.getItem(this.CONSENT_KEY);
      return consent === 'true';
    } catch (error) {
      console.error('Failed to get consent status:', error);
      return false;
    }
  }

  async setConsentStatus(hasConsented: boolean): Promise<void> {
    try {
      await EncryptedStorage.setItem(this.CONSENT_KEY, hasConsented.toString());
      
      // Log consent event
      await analytics().logEvent('gdpr_consent', {
        consent_given: hasConsented,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to set consent status:', error);
    }
  }

  // Privacy Settings Management
  async getPrivacySettings(): Promise<PrivacySettings> {
    try {
      const settings = await EncryptedStorage.getItem(this.PRIVACY_SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
      
      // Default privacy settings (privacy-first approach)
      return {
        dataCollection: false,
        analytics: false,
        personalization: false,
        marketing: false,
        dataRetention: '1year',
        exportRequested: false,
        deletionRequested: false,
      };
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return {
        dataCollection: false,
        analytics: false,
        personalization: false,
        marketing: false,
        dataRetention: '1year',
        exportRequested: false,
        deletionRequested: false,
      };
    }
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    try {
      const currentSettings = await this.getPrivacySettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await EncryptedStorage.setItem(
        this.PRIVACY_SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );

      // Log privacy settings change
      await analytics().logEvent('privacy_settings_updated', {
        settings_changed: Object.keys(settings),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  }

  // Data Export (Right to Data Portability)
  async requestDataExport(userId: string): Promise<void> {
    try {
      const exportRequest: DataExportRequest = {
        userId,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };

      await firestore()
        .collection('dataExportRequests')
        .doc(userId)
        .set(exportRequest);

      // Update privacy settings
      await this.updatePrivacySettings({ exportRequested: true });

      await analytics().logEvent('data_export_requested', {
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to request data export:', error);
      throw new Error('Failed to request data export');
    }
  }

  async getDataExportStatus(userId: string): Promise<DataExportRequest | null> {
    try {
      const doc = await firestore()
        .collection('dataExportRequests')
        .doc(userId)
        .get();

      if (doc.exists) {
        return doc.data() as DataExportRequest;
      }
      return null;
    } catch (error) {
      console.error('Failed to get data export status:', error);
      return null;
    }
  }

  // Data Deletion (Right to be Forgotten)
  async requestDataDeletion(userId: string): Promise<void> {
    try {
      const deletionRequest = {
        userId,
        requestDate: new Date().toISOString(),
        status: 'pending',
        scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      await firestore()
        .collection('dataDeletionRequests')
        .doc(userId)
        .set(deletionRequest);

      // Update privacy settings
      await this.updatePrivacySettings({ deletionRequested: true });

      await analytics().logEvent('data_deletion_requested', {
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      throw new Error('Failed to request data deletion');
    }
  }

  // Data Anonymization
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      const batch = firestore().batch();

      // Anonymize user profile
      const userRef = firestore().collection('users').doc(userId);
      batch.update(userRef, {
        email: `anonymous_${Date.now()}@example.com`,
        displayName: 'Anonymous User',
        photoURL: null,
        anonymized: true,
        anonymizedAt: new Date().toISOString(),
      });

      // Anonymize nutrition data
      const nutritionSnapshot = await firestore()
        .collection('nutrition')
        .where('userId', '==', userId)
        .get();

      nutritionSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          userId: 'anonymous',
          anonymized: true,
          anonymizedAt: new Date().toISOString(),
        });
      });

      await batch.commit();

      await analytics().logEvent('user_data_anonymized', {
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to anonymize user data:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  // Data Retention Management
  async cleanupExpiredData(): Promise<void> {
    try {
      const settings = await this.getPrivacySettings();
      const retentionPeriods = {
        '1year': 365,
        '2years': 730,
        '5years': 1825,
        'indefinite': null,
      };

      const retentionDays = retentionPeriods[settings.dataRetention];
      if (!retentionDays) return; // Indefinite retention

      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Clean up old nutrition entries
      const oldEntries = await firestore()
        .collection('nutrition')
        .where('createdAt', '<', cutoffDate.toISOString())
        .get();

      const batch = firestore().batch();
      oldEntries.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      await analytics().logEvent('expired_data_cleaned', {
        retention_period: settings.dataRetention,
        records_deleted: oldEntries.size,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
    }
  }

  // Cookie and Tracking Management
  async setTrackingPreferences(allowTracking: boolean): Promise<void> {
    try {
      await EncryptedStorage.setItem('allow_tracking', allowTracking.toString());
      
      // Configure analytics based on preference
      await analytics().setAnalyticsCollectionEnabled(allowTracking);

      await analytics().logEvent('tracking_preference_set', {
        allow_tracking: allowTracking,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to set tracking preferences:', error);
    }
  }

  async getTrackingPreferences(): Promise<boolean> {
    try {
      const preference = await EncryptedStorage.getItem('allow_tracking');
      return preference === 'true';
    } catch (error) {
      console.error('Failed to get tracking preferences:', error);
      return false; // Default to no tracking
    }
  }

  // Data Processing Lawful Basis
  async recordProcessingBasis(
    userId: string,
    dataType: string,
    lawfulBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  ): Promise<void> {
    try {
      await firestore()
        .collection('processingBasis')
        .add({
          userId,
          dataType,
          lawfulBasis,
          recordedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to record processing basis:', error);
    }
  }

  // Data Breach Notification
  async notifyDataBreach(
    userId: string,
    breachType: string,
    description: string,
    affectedData: string[]
  ): Promise<void> {
    try {
      await firestore()
        .collection('dataBreachNotifications')
        .add({
          userId,
          breachType,
          description,
          affectedData,
          notifiedAt: new Date().toISOString(),
          status: 'notified',
        });

      await analytics().logEvent('data_breach_notification', {
        user_id: userId,
        breach_type: breachType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to notify data breach:', error);
    }
  }
}

export default new PrivacyService();

