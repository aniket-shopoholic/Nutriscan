import { logger } from './logger';

// Performance monitoring interface
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, any>;
}

// Memory usage interface
export interface MemoryUsage {
  used: number;
  total: number;
  available: number;
  percentage: number;
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME: 16, // 60fps = 16.67ms per frame
  API_RESPONSE: 2000, // 2 seconds
  IMAGE_LOAD: 3000, // 3 seconds
  SCAN_PROCESSING: 5000, // 5 seconds
  MEMORY_WARNING: 100 * 1024 * 1024, // 100MB
  MEMORY_CRITICAL: 200 * 1024 * 1024, // 200MB
} as const;

// Performance monitor class
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private memoryCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.startMemoryMonitoring();
  }

  // Start a performance timer
  startTimer(name: string, context?: Record<string, any>): void {
    const startTime = Date.now();
    this.timers.set(name, startTime);
    
    logger.debug(`Performance timer started: ${name}`, context);
  }

  // End a performance timer and record metric
  endTimer(name: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Performance timer not found: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    // Record metric
    this.recordMetric(name, duration, 'ms', context);

    // Check against thresholds
    this.checkPerformanceThreshold(name, duration);

    logger.debug(`Performance timer ended: ${name}`, { duration, ...context });
    return duration;
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: string = 'ms', context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context,
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    logger.logPerformance(name, value, unit, context);
  }

  // Check performance against thresholds
  private checkPerformanceThreshold(name: string, value: number): void {
    let threshold: number | undefined;

    switch (name) {
      case 'render_time':
      case 'component_render':
        threshold = PERFORMANCE_THRESHOLDS.RENDER_TIME;
        break;
      case 'api_call':
      case 'network_request':
        threshold = PERFORMANCE_THRESHOLDS.API_RESPONSE;
        break;
      case 'image_load':
        threshold = PERFORMANCE_THRESHOLDS.IMAGE_LOAD;
        break;
      case 'scan_processing':
        threshold = PERFORMANCE_THRESHOLDS.SCAN_PROCESSING;
        break;
    }

    if (threshold && value > threshold) {
      logger.warn(`Performance threshold exceeded: ${name}`, {
        value,
        threshold,
        component: 'performance_monitor',
      });
    }
  }

  // Get performance metrics
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  // Get average performance for a metric
  getAveragePerformance(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Get performance statistics
  getPerformanceStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0 };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / count;
    const min = values[0];
    const max = values[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = values[p95Index];

    return { count, average, min, max, p95 };
  }

  // Memory monitoring
  private startMemoryMonitoring(): void {
    // Check memory every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
  }

  private checkMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage.used > PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL) {
      logger.error('Critical memory usage detected', {
        component: 'performance_monitor',
        memoryUsage,
      });
      this.triggerMemoryCleanup();
    } else if (memoryUsage.used > PERFORMANCE_THRESHOLDS.MEMORY_WARNING) {
      logger.warn('High memory usage detected', {
        component: 'performance_monitor',
        memoryUsage,
      });
    }

    this.recordMetric('memory_usage', memoryUsage.used, 'bytes', {
      percentage: memoryUsage.percentage,
      total: memoryUsage.total,
    });
  }

  // Get current memory usage
  getMemoryUsage(): MemoryUsage {
    if (global.performance && global.performance.memory) {
      const memory = global.performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        available: memory.jsHeapSizeLimit - memory.usedJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }

    // Fallback for environments without performance.memory
    return {
      used: 0,
      total: 0,
      available: 0,
      percentage: 0,
    };
  }

  // Trigger memory cleanup
  private triggerMemoryCleanup(): void {
    logger.info('Triggering memory cleanup');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Clear old metrics
    this.metrics = this.metrics.slice(-500);
    
    // Clear completed timers
    this.timers.clear();
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared');
  }

  // Stop monitoring
  stop(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }
    this.timers.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Native specific performance utilities
export class ReactNativePerformance {
  // Measure component render time
  static measureRender<T extends React.ComponentType<any>>(
    Component: T,
    displayName?: string
  ): T {
    const componentName = displayName || Component.displayName || Component.name || 'Component';
    
    return React.memo(React.forwardRef((props: any, ref: any) => {
      const renderStart = Date.now();
      
      React.useEffect(() => {
        const renderTime = Date.now() - renderStart;
        performanceMonitor.recordMetric(`${componentName}_render`, renderTime, 'ms', {
          component: componentName,
        });
      });

      return React.createElement(Component, { ...props, ref });
    })) as T;
  }

  // Measure async operation
  static async measureAsync<T>(
    operation: () => Promise<T>,
    name: string,
    context?: Record<string, any>
  ): Promise<T> {
    performanceMonitor.startTimer(name, context);
    try {
      const result = await operation();
      performanceMonitor.endTimer(name, context);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(name, { ...context, error: true });
      throw error;
    }
  }

  // Measure synchronous operation
  static measure<T>(
    operation: () => T,
    name: string,
    context?: Record<string, any>
  ): T {
    performanceMonitor.startTimer(name, context);
    try {
      const result = operation();
      performanceMonitor.endTimer(name, context);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(name, { ...context, error: true });
      throw error;
    }
  }
}

// Performance hooks for React components
export const usePerformanceTimer = (name: string, dependencies: any[] = []) => {
  React.useEffect(() => {
    performanceMonitor.startTimer(name);
    return () => {
      performanceMonitor.endTimer(name);
    };
  }, dependencies);
};

export const useRenderTime = (componentName: string) => {
  const renderStart = React.useRef(Date.now());
  
  React.useEffect(() => {
    const renderTime = Date.now() - renderStart.current;
    performanceMonitor.recordMetric(`${componentName}_render`, renderTime, 'ms');
    renderStart.current = Date.now();
  });
};

// Image loading performance
export const measureImageLoad = (uri: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const image = new Image();
    
    image.onload = () => {
      const loadTime = Date.now() - startTime;
      performanceMonitor.recordMetric('image_load', loadTime, 'ms', { uri });
      resolve();
    };
    
    image.onerror = (error) => {
      const loadTime = Date.now() - startTime;
      performanceMonitor.recordMetric('image_load_error', loadTime, 'ms', { uri, error: true });
      reject(error);
    };
    
    image.src = uri;
  });
};

// Network performance measurement
export const measureNetworkRequest = async (
  request: () => Promise<any>,
  endpoint: string,
  method: string = 'GET'
): Promise<any> => {
  const startTime = Date.now();
  let success = false;
  
  try {
    const result = await request();
    success = true;
    return result;
  } catch (error) {
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    performanceMonitor.recordMetric('network_request', duration, 'ms', {
      endpoint,
      method,
      success,
    });
  }
};

// Bundle size optimization utilities
export const measureBundleSize = () => {
  // This would be implemented with a bundler plugin
  // For now, just log that it would measure bundle size
  logger.info('Bundle size measurement would be implemented here');
};

// FPS monitoring (for animations)
export class FPSMonitor {
  private frameCount = 0;
  private lastTime = Date.now();
  private fps = 0;
  private isMonitoring = false;

  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = Date.now();
    this.measureFrame();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  private measureFrame(): void {
    if (!this.isMonitoring) return;

    requestAnimationFrame(() => {
      this.frameCount++;
      const currentTime = Date.now();
      const elapsed = currentTime - this.lastTime;

      if (elapsed >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed);
        performanceMonitor.recordMetric('fps', this.fps, 'fps');
        
        if (this.fps < 30) {
          logger.warn('Low FPS detected', { fps: this.fps });
        }

        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      this.measureFrame();
    });
  }

  getCurrentFPS(): number {
    return this.fps;
  }
}

// Export utilities
export default performanceMonitor;
export { PERFORMANCE_THRESHOLDS };

// Convenience functions
export const startTimer = (name: string, context?: Record<string, any>) =>
  performanceMonitor.startTimer(name, context);

export const endTimer = (name: string, context?: Record<string, any>) =>
  performanceMonitor.endTimer(name, context);

export const recordMetric = (name: string, value: number, unit?: string, context?: Record<string, any>) =>
  performanceMonitor.recordMetric(name, value, unit, context);

