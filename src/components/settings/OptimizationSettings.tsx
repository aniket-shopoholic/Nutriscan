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
  Slider,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { LoadingSpinner, ErrorMessage } from '../common';
import { 
  optimizationService, 
  OptimizationMetrics,
  BatteryOptimization,
  PerformanceSettings,
  MemoryOptimization,
} from '../../services/optimizationService';
import { analyticsService } from '../../services/analyticsService';
import { logger } from '../../utils/logger';

interface OptimizationSettingsProps {
  onSettingsChange?: (settings: any) => void;
}

const OptimizationSettings: React.FC<OptimizationSettingsProps> = ({
  onSettingsChange,
}) => {
  const theme = useTheme();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [batterySettings, setBatterySettings] = useState<BatteryOptimization | null>(null);
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings | null>(null);
  const [memorySettings, setMemorySettings] = useState<MemoryOptimization | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Load optimization settings and metrics
  useEffect(() => {
    loadOptimizationData();
    
    // Set up periodic metrics updates
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadOptimizationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const settings = optimizationService.getOptimizationSettings();
      const currentMetrics = optimizationService.getOptimizationMetrics();

      setBatterySettings(settings.battery);
      setPerformanceSettings(settings.performance);
      setMemorySettings(settings.memory);
      setMetrics(currentMetrics);

      logger.info('Optimization data loaded', {
        settings,
        metrics: currentMetrics,
        component: 'OptimizationSettings',
      });

    } catch (error) {
      const errorMessage = 'Failed to load optimization settings';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        component: 'OptimizationSettings',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const currentMetrics = optimizationService.getOptimizationMetrics();
      setMetrics(currentMetrics);
    } catch (error) {
      logger.error('Failed to load metrics', error as Error, {
        component: 'OptimizationSettings',
      });
    }
  }, []);

  // Handle battery optimization level change
  const handleBatteryOptimizationLevel = useCallback(async (level: 'low' | 'medium' | 'high') => {
    try {
      setIsLoading(true);
      
      await optimizationService.enableBatteryOptimization(level);
      
      const updatedSettings = optimizationService.getOptimizationSettings();
      setBatterySettings(updatedSettings.battery);

      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange({ batteryOptimization: level });
      }

      // Track analytics event
      await analyticsService.trackUserAction('battery_optimization_changed', {
        level,
      });

      Alert.alert(
        'Battery Optimization Updated',
        `Battery optimization level set to ${level}.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      const errorMessage = 'Failed to update battery optimization';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        level,
        component: 'OptimizationSettings',
      });
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange]);

  // Handle setting change
  const handleSettingChange = useCallback(async (
    category: 'battery' | 'performance' | 'memory',
    setting: string,
    value: any
  ) => {
    try {
      const updateSettings = {
        [category]: { [setting]: value },
      };

      await optimizationService.updateOptimizationSettings(updateSettings);

      // Update local state
      const updatedSettings = optimizationService.getOptimizationSettings();
      setBatterySettings(updatedSettings.battery);
      setPerformanceSettings(updatedSettings.performance);
      setMemorySettings(updatedSettings.memory);

      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange(updateSettings);
      }

      // Track analytics event
      await analyticsService.trackUserAction('optimization_setting_changed', {
        category,
        setting,
        value,
      });

      logger.info('Optimization setting updated', {
        category,
        setting,
        value,
        component: 'OptimizationSettings',
      });

    } catch (error) {
      const errorMessage = 'Failed to update setting';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        category,
        setting,
        value,
        component: 'OptimizationSettings',
      });
    }
  }, [onSettingsChange]);

  // Handle optimization actions
  const handleOptimizePerformance = useCallback(async () => {
    try {
      setIsOptimizing(true);
      
      await optimizationService.optimizePerformance();
      await loadMetrics();

      // Track analytics event
      await analyticsService.trackUserAction('performance_optimization_triggered');

      Alert.alert(
        'Optimization Complete',
        'Performance optimization has been completed successfully.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      const errorMessage = 'Failed to optimize performance';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        component: 'OptimizationSettings',
      });
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const handleOptimizeMemory = useCallback(async () => {
    try {
      setIsOptimizing(true);
      
      await optimizationService.optimizeMemoryUsage();
      await loadMetrics();

      // Track analytics event
      await analyticsService.trackUserAction('memory_optimization_triggered');

      Alert.alert(
        'Memory Optimized',
        'Memory usage has been optimized successfully.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      const errorMessage = 'Failed to optimize memory';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        component: 'OptimizationSettings',
      });
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const handleEnableAdaptiveOptimization = useCallback(async () => {
    try {
      setIsOptimizing(true);
      
      await optimizationService.enableAdaptiveOptimization();
      await loadOptimizationData();

      // Track analytics event
      await analyticsService.trackUserAction('adaptive_optimization_enabled');

      Alert.alert(
        'Adaptive Optimization Enabled',
        'The app will now automatically optimize based on your device conditions.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      const errorMessage = 'Failed to enable adaptive optimization';
      setError(errorMessage);
      logger.error(errorMessage, error as Error, {
        component: 'OptimizationSettings',
      });
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  // Render metric card
  const renderMetricCard = (
    title: string,
    value: number,
    unit: string,
    icon: string,
    color: string,
    maxValue?: number
  ) => (
    <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text style={[styles.metricTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.metricValue, { color }]}>
          {typeof value === 'number' ? value.toFixed(1) : '0.0'} {unit}
        </Text>
        {maxValue && (
          <ProgressBar
            progress={value / maxValue}
            color={color}
            style={styles.metricProgress}
          />
        )}
      </Card.Content>
    </Card>
  );

  // Render setting item
  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string,
    disabled: boolean = false
  ) => (
    <List.Item
      title={title}
      description={description}
      left={(props) => (
        <Icon {...props} name={icon} size={24} color={theme.colors.primary} />
      )}
      right={() => (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || isLoading}
        />
      )}
      titleStyle={{ color: theme.colors.onSurface }}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      style={styles.settingItem}
    />
  );

  // Render slider setting
  const renderSliderSetting = (
    title: string,
    description: string,
    value: number,
    onValueChange: (value: number) => void,
    minimumValue: number,
    maximumValue: number,
    step: number,
    unit: string,
    icon: string
  ) => (
    <View style={styles.sliderContainer}>
      <List.Item
        title={title}
        description={description}
        left={(props) => (
          <Icon {...props} name={icon} size={24} color={theme.colors.primary} />
        )}
        titleStyle={{ color: theme.colors.onSurface }}
        descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      />
      <View style={styles.sliderContent}>
        <Slider
          style={styles.slider}
          value={value}
          onValueChange={onValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          thumbColor={theme.colors.primary}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.outline}
        />
        <Text style={[styles.sliderValue, { color: theme.colors.onSurface }]}>
          {value} {unit}
        </Text>
      </View>
    </View>
  );

  if (isLoading && !metrics) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LoadingSpinner size="large" />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading optimization settings...
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
            <Icon name="tune" size={32} color={theme.colors.primary} />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                Performance & Optimization
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Optimize your app experience and device performance
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
            onRetry={loadOptimizationData}
            showRetry
          />
        </View>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <View style={styles.metricsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Current Performance
          </Text>
          
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Memory Usage',
              metrics.memoryUsage,
              'MB',
              'memory',
              theme.colors.primary,
              1000
            )}
            
            {renderMetricCard(
              'Battery Level',
              metrics.batteryLevel,
              '%',
              'battery',
              metrics.batteryLevel > 50 ? theme.colors.primary : theme.colors.error,
              100
            )}
            
            {renderMetricCard(
              'Render Time',
              metrics.renderTime,
              'ms',
              'speedometer',
              metrics.renderTime < 16 ? theme.colors.primary : theme.colors.error
            )}
            
            {renderMetricCard(
              'Cache Size',
              metrics.cacheSize,
              'MB',
              'database',
              theme.colors.secondary
            )}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Quick Optimization
          </Text>
          
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              onPress={handleOptimizePerformance}
              loading={isOptimizing}
              disabled={isOptimizing}
              style={styles.actionButton}
              icon="rocket"
            >
              Optimize Performance
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleOptimizeMemory}
              loading={isOptimizing}
              disabled={isOptimizing}
              style={styles.actionButton}
              icon="memory"
            >
              Free Memory
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleEnableAdaptiveOptimization}
              loading={isOptimizing}
              disabled={isOptimizing}
              style={styles.actionButton}
              icon="auto-fix"
            >
              Enable Auto-Optimize
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Battery Optimization */}
      <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Battery Optimization
          </Text>
          
          <View style={styles.batteryLevels}>
            <Text style={[styles.subsectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Optimization Level
            </Text>
            
            <View style={styles.levelButtons}>
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Chip
                  key={level}
                  selected={batterySettings?.lowPowerMode === (level === 'high')}
                  onPress={() => handleBatteryOptimizationLevel(level)}
                  style={styles.levelChip}
                  textStyle={{ textTransform: 'capitalize' }}
                >
                  {level}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Content>

        {batterySettings && (
          <>
            {renderSettingItem(
              'Background Processing',
              'Allow optimization tasks to run in background',
              batterySettings.backgroundProcessing,
              (value) => handleSettingChange('battery', 'backgroundProcessing', value),
              'cog-sync'
            )}
            
            <Divider />
            
            {renderSettingItem(
              'Reduced Animations',
              'Minimize animations to save battery',
              batterySettings.reducedAnimations,
              (value) => handleSettingChange('battery', 'reducedAnimations', value),
              'animation'
            )}
            
            <Divider />
            
            {renderSettingItem(
              'Adaptive Refresh',
              'Adjust refresh rates based on usage',
              batterySettings.adaptiveRefresh,
              (value) => handleSettingChange('battery', 'adaptiveRefresh', value),
              'refresh'
            )}
            
            <Divider />
            
            {renderSettingItem(
              'Compressed Images',
              'Use compressed images to save bandwidth',
              batterySettings.compressedImages,
              (value) => handleSettingChange('battery', 'compressedImages', value),
              'image-multiple'
            )}
          </>
        )}
      </Card>

      {/* Performance Settings */}
      {performanceSettings && (
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Performance Settings
            </Text>
          </Card.Content>

          {renderSettingItem(
            'Image Caching',
            'Cache images for faster loading',
            performanceSettings.enableImageCaching,
            (value) => handleSettingChange('performance', 'enableImageCaching', value),
            'image-multiple'
          )}
          
          <Divider />
          
          {renderSettingItem(
            'Preload Images',
            'Preload images for smoother experience',
            performanceSettings.preloadImages,
            (value) => handleSettingChange('performance', 'preloadImages', value),
            'download'
          )}
          
          <Divider />
          
          {renderSettingItem(
            'Lazy Loading',
            'Load content only when needed',
            performanceSettings.enableLazyLoading,
            (value) => handleSettingChange('performance', 'enableLazyLoading', value),
            'loading'
          )}
          
          <Divider />
          
          {renderSettingItem(
            'Optimize Animations',
            'Optimize animations for better performance',
            performanceSettings.optimizeAnimations,
            (value) => handleSettingChange('performance', 'optimizeAnimations', value),
            'animation-play'
          )}
          
          <Divider />
          
          {renderSliderSetting(
            'Max Cache Size',
            'Maximum size for image cache',
            performanceSettings.maxCacheSize,
            (value) => handleSettingChange('performance', 'maxCacheSize', Math.round(value)),
            50,
            500,
            50,
            'MB',
            'database'
          )}
          
          <Divider />
          
          {renderSliderSetting(
            'Concurrent Requests',
            'Maximum number of simultaneous network requests',
            performanceSettings.maxConcurrentRequests,
            (value) => handleSettingChange('performance', 'maxConcurrentRequests', Math.round(value)),
            1,
            10,
            1,
            'requests',
            'network'
          )}
        </Card>
      )}

      {/* Memory Settings */}
      {memorySettings && (
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Memory Management
            </Text>
          </Card.Content>

          {renderSettingItem(
            'Automatic Garbage Collection',
            'Automatically free unused memory',
            memorySettings.enableGarbageCollection,
            (value) => handleSettingChange('memory', 'enableGarbageCollection', value),
            'delete-sweep'
          )}
          
          <Divider />
          
          {renderSettingItem(
            'Clear Cache on Low Memory',
            'Automatically clear cache when memory is low',
            memorySettings.clearCacheOnLowMemory,
            (value) => handleSettingChange('memory', 'clearCacheOnLowMemory', value),
            'delete-circle'
          )}
          
          <Divider />
          
          {renderSettingItem(
            'Image Compression',
            'Compress images in memory to save space',
            memorySettings.enableImageCompression,
            (value) => handleSettingChange('memory', 'enableImageCompression', value),
            'compress'
          )}
          
          <Divider />
          
          {renderSliderSetting(
            'Image Cache Size',
            'Maximum size for image cache in memory',
            memorySettings.maxImageCacheSize,
            (value) => handleSettingChange('memory', 'maxImageCacheSize', Math.round(value)),
            10,
            200,
            10,
            'MB',
            'image-multiple'
          )}
          
          <Divider />
          
          {renderSliderSetting(
            'Compression Quality',
            'Image compression quality (higher = better quality)',
            memorySettings.compressionQuality * 100,
            (value) => handleSettingChange('memory', 'compressionQuality', value / 100),
            10,
            100,
            10,
            '%',
            'tune'
          )}
        </Card>
      )}

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
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  metricsContainer: {
    margin: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    elevation: 1,
  },
  metricContent: {
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metricProgress: {
    width: '100%',
    height: 4,
  },
  quickActions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  batteryLevels: {
    marginBottom: 16,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  levelChip: {
    flex: 1,
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sliderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slider: {
    flex: 1,
    marginRight: 16,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default OptimizationSettings;

