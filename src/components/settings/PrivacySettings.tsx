import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { 
  useTheme, 
  Card, 
  Button, 
  Switch, 
  List, 
  Divider,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { LoadingSpinner, ErrorMessage } from '../common';
import { complianceService, ConsentRecord } from '../../services/complianceService';
import { analyticsService } from '../../services/analyticsService';
import { logger } from '../../utils/logger';

interface PrivacySettingsProps {
  userId: string;
  onSettingsChange?: (settings: any) => void;
}

interface ConsentSettings {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  userId,
  onSettingsChange,
}) => {
  const theme = useTheme();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });
  const [showDataExportDialog, setShowDataExportDialog] = useState(false);
  const [showDataDeletionDialog, setShowDataDeletionDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // Load current consent settings
  useEffect(() => {
    loadConsentSettings();
  }, []);

  const loadConsentSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const settings: ConsentSettings = {
        necessary: complianceService.getConsentStatus('necessary'),
        functional: complianceService.getConsentStatus('functional'),
        analytics: complianceService.getConsentStatus('analytics'),
        marketing: complianceService.getConsentStatus('marketing'),
      };

      setConsentSettings(settings);

      logger.info('Consent settings loaded', {
        settings,
        component: 'PrivacySettings',
      });

    } catch (error) {
      const errorMessage = 'Failed to load privacy settings';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        component: 'PrivacySettings',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle consent change
  const handleConsentChange = useCallback(async (
    type: keyof ConsentSettings,
    granted: boolean
  ) => {
    try {
      // Necessary and functional consents cannot be disabled
      if ((type === 'necessary' || type === 'functional') && !granted) {
        Alert.alert(
          'Required Consent',
          `${type === 'necessary' ? 'Necessary' : 'Functional'} cookies are required for the app to work properly and cannot be disabled.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setIsLoading(true);
      
      await complianceService.recordConsent(type, granted);
      
      setConsentSettings(prev => ({
        ...prev,
        [type]: granted,
      }));

      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange({ [type]: granted });
      }

      logger.info('Consent updated', {
        type,
        granted,
        component: 'PrivacySettings',
      });

      // Track analytics event
      await analyticsService.trackUserAction('privacy_consent_updated', {
        consent_type: type,
        granted,
      });

    } catch (error) {
      const errorMessage = 'Failed to update consent';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        type,
        granted,
        component: 'PrivacySettings',
      });

      Alert.alert(
        'Error',
        'Failed to update your privacy preferences. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange]);

  // Handle data export request
  const handleDataExport = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const message = await complianceService.requestDataExport(userId);
      
      Alert.alert(
        'Data Export Requested',
        message,
        [{ text: 'OK' }]
      );

      setShowDataExportDialog(false);

      // Track analytics event
      await analyticsService.trackUserAction('data_export_requested', {
        user_id: userId,
      });

    } catch (error) {
      const errorMessage = 'Failed to request data export';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        userId,
        component: 'PrivacySettings',
      });

      Alert.alert(
        'Error',
        'Failed to request data export. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle data deletion request
  const handleDataDeletion = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const message = await complianceService.requestDataDeletion(userId);
      
      setShowDataDeletionDialog(false);

      // Track analytics event
      await analyticsService.trackUserAction('data_deletion_requested', {
        user_id: userId,
      });

    } catch (error) {
      const errorMessage = 'Failed to request data deletion';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        userId,
        component: 'PrivacySettings',
      });

      Alert.alert(
        'Error',
        'Failed to request data deletion. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Show privacy policy
  const showPrivacyPolicy = useCallback(async () => {
    try {
      await complianceService.showPrivacyPolicy();
      
      // Track analytics event
      await analyticsService.trackUserAction('privacy_policy_viewed');

    } catch (error) {
      logger.error('Failed to show privacy policy', error as Error, {
        component: 'PrivacySettings',
      });
    }
  }, []);

  // Show terms of service
  const showTermsOfService = useCallback(async () => {
    try {
      await complianceService.showTermsOfService();
      
      // Track analytics event
      await analyticsService.trackUserAction('terms_of_service_viewed');

    } catch (error) {
      logger.error('Failed to show terms of service', error as Error, {
        component: 'PrivacySettings',
      });
    }
  }, []);

  // Render consent item
  const renderConsentItem = (
    type: keyof ConsentSettings,
    title: string,
    description: string,
    required: boolean = false
  ) => (
    <List.Item
      key={type}
      title={title}
      description={description}
      left={(props) => (
        <Icon 
          {...props} 
          name={getConsentIcon(type)} 
          size={24} 
          color={theme.colors.primary} 
        />
      )}
      right={() => (
        <Switch
          value={consentSettings[type]}
          onValueChange={(value) => handleConsentChange(type, value)}
          disabled={required || isLoading}
        />
      )}
      titleStyle={{ color: theme.colors.onSurface }}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      style={styles.consentItem}
    />
  );

  // Get consent icon
  const getConsentIcon = (type: keyof ConsentSettings): string => {
    switch (type) {
      case 'necessary':
        return 'shield-check';
      case 'functional':
        return 'cog';
      case 'analytics':
        return 'chart-line';
      case 'marketing':
        return 'bullhorn';
      default:
        return 'help-circle';
    }
  };

  if (isLoading && !consentSettings.necessary) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LoadingSpinner size="large" />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading privacy settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Icon name="shield-account" size={32} color={theme.colors.primary} />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                Privacy & Data Protection
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Control how your data is used and processed
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <ErrorMessage
            message={error}
            onRetry={loadConsentSettings}
            showRetry
          />
        </View>
      )}

      {/* Consent Settings */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Cookie & Data Consent
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            Choose what data you're comfortable sharing with us
          </Text>
        </Card.Content>

        {renderConsentItem(
          'necessary',
          'Necessary Cookies',
          'Required for basic app functionality and security',
          true
        )}
        
        <Divider />
        
        {renderConsentItem(
          'functional',
          'Functional Cookies',
          'Enable enhanced features and personalization',
          true
        )}
        
        <Divider />
        
        {renderConsentItem(
          'analytics',
          'Analytics Cookies',
          'Help us improve the app by analyzing usage patterns'
        )}
        
        <Divider />
        
        {renderConsentItem(
          'marketing',
          'Marketing Cookies',
          'Receive personalized recommendations and offers'
        )}
      </Card>

      {/* Data Rights */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Your Data Rights
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            Exercise your rights under GDPR and other privacy laws
          </Text>
        </Card.Content>

        <List.Item
          title="Export My Data"
          description="Download a copy of all your personal data"
          left={(props) => (
            <Icon {...props} name="download" size={24} color={theme.colors.primary} />
          )}
          right={(props) => (
            <Icon {...props} name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          )}
          onPress={() => setShowDataExportDialog(true)}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          style={styles.dataRightItem}
        />

        <Divider />

        <List.Item
          title="Delete My Data"
          description="Permanently delete all your personal data"
          left={(props) => (
            <Icon {...props} name="delete" size={24} color={theme.colors.error} />
          )}
          right={(props) => (
            <Icon {...props} name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          )}
          onPress={() => setShowDataDeletionDialog(true)}
          titleStyle={{ color: theme.colors.error }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          style={styles.dataRightItem}
        />
      </Card>

      {/* Legal Documents */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Legal Documents
          </Text>
        </Card.Content>

        <List.Item
          title="Privacy Policy"
          description="Learn how we collect and use your data"
          left={(props) => (
            <Icon {...props} name="file-document" size={24} color={theme.colors.primary} />
          )}
          right={(props) => (
            <Icon {...props} name="open-in-new" size={24} color={theme.colors.onSurfaceVariant} />
          )}
          onPress={showPrivacyPolicy}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          style={styles.legalItem}
        />

        <Divider />

        <List.Item
          title="Terms of Service"
          description="Read our terms and conditions"
          left={(props) => (
            <Icon {...props} name="file-document-outline" size={24} color={theme.colors.primary} />
          )}
          right={(props) => (
            <Icon {...props} name="open-in-new" size={24} color={theme.colors.onSurfaceVariant} />
          )}
          onPress={showTermsOfService}
          titleStyle={{ color: theme.colors.onSurface }}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
          style={styles.legalItem}
        />
      </Card>

      {/* Data Export Dialog */}
      <Portal>
        <Dialog
          visible={showDataExportDialog}
          onDismiss={() => setShowDataExportDialog(false)}
        >
          <Dialog.Title>Export Your Data</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              We'll prepare a download containing all your personal data including:
            </Paragraph>
            <Text style={styles.dataList}>
              • Profile information{'\n'}
              • Nutrition data and scan history{'\n'}
              • App usage statistics{'\n'}
              • Preferences and settings
            </Text>
            <Paragraph>
              You'll receive an email with a download link within 24 hours.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDataExportDialog(false)}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleDataExport}
              loading={isLoading}
            >
              Request Export
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Data Deletion Dialog */}
      <Portal>
        <Dialog
          visible={showDataDeletionDialog}
          onDismiss={() => setShowDataDeletionDialog(false)}
        >
          <Dialog.Title>Delete Your Data</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.error }}>
              ⚠️ This action cannot be undone!
            </Paragraph>
            <Paragraph>
              Deleting your data will permanently remove:
            </Paragraph>
            <Text style={styles.dataList}>
              • Your account and profile{'\n'}
              • All nutrition data and scan history{'\n'}
              • App preferences and settings{'\n'}
              • Subscription information
            </Text>
            <Paragraph>
              This process may take up to 30 days to complete.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDataDeletionDialog(false)}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              buttonColor={theme.colors.error}
              onPress={handleDataDeletion}
              loading={isLoading}
            >
              Delete Data
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  consentItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dataRightItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  legalItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dataList: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 8,
    paddingLeft: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default PrivacySettings;

