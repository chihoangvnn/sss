import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  averageRenderTime: number;
  averageApiResponseTime: number;
  averageUserInteractionTime: number;
  memoryUsage?: number;
  totalMetrics: number;
  slowOperations: PerformanceMetric[];
}

// Global performance metrics store
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private listeners: Set<(stats: PerformanceStats) => void> = new Set();
  private maxMetrics = 1000; // Keep last 1000 metrics
  
  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Notify listeners if this is a slow operation (>100ms)
    if (metric.duration && metric.duration > 100) {
      this.notifyListeners();
    }
  }
  
  getStats(): PerformanceStats {
    const renderMetrics = this.metrics.filter(m => m.name.includes('render'));
    const apiMetrics = this.metrics.filter(m => m.name.includes('api'));
    const interactionMetrics = this.metrics.filter(m => m.name.includes('interaction'));
    const slowOperations = this.metrics.filter(m => m.duration && m.duration > 100);
    
    const average = (metrics: PerformanceMetric[]) => {
      if (metrics.length === 0) return 0;
      return metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length;
    };
    
    return {
      averageRenderTime: average(renderMetrics),
      averageApiResponseTime: average(apiMetrics),
      averageUserInteractionTime: average(interactionMetrics),
      memoryUsage: this.getMemoryUsage(),
      totalMetrics: this.metrics.length,
      slowOperations: slowOperations.slice(-10), // Last 10 slow operations
    };
  }
  
  private getMemoryUsage(): number | undefined {
    // @ts-ignore - performance.memory is non-standard but available in Chrome
    if (typeof performance !== 'undefined' && performance.memory) {
      // @ts-ignore
      return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }
  
  subscribe(listener: (stats: PerformanceStats) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners() {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }
  
  clear() {
    this.metrics = [];
    this.notifyListeners();
  }
}

const globalPerformanceMonitor = new PerformanceMonitor();

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>(() => 
    globalPerformanceMonitor.getStats()
  );
  
  useEffect(() => {
    const unsubscribe = globalPerformanceMonitor.subscribe(setStats);
    return unsubscribe;
  }, []);
  
  const measureOperation = useCallback((name: string, metadata?: Record<string, any>) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        globalPerformanceMonitor.addMetric({
          name,
          startTime,
          endTime,
          duration,
          metadata,
        });
        
        // Log slow operations in development
        if (import.meta.env.DEV && duration > 50) {
          console.warn(`🐌 Slow operation "${name}": ${duration.toFixed(2)}ms`, metadata);
        }
        
        return duration;
      }
    };
  }, []);
  
  const measureAsync = useCallback(async <T>(
    name: string, 
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const measure = measureOperation(name, metadata);
    try {
      const result = await operation();
      measure.end();
      return result;
    } catch (error) {
      measure.end();
      throw error;
    }
  }, [measureOperation]);
  
  const clearMetrics = useCallback(() => {
    globalPerformanceMonitor.clear();
  }, []);
  
  return {
    stats,
    measureOperation,
    measureAsync,
    clearMetrics,
  };
}

// Component render performance tracker
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>();
  const { measureOperation } = usePerformanceMonitor();
  
  // Track render start
  useEffect(() => {
    renderStartRef.current = performance.now();
  });
  
  // Track render completion
  useEffect(() => {
    if (renderStartRef.current) {
      const duration = performance.now() - renderStartRef.current;
      
      globalPerformanceMonitor.addMetric({
        name: `render-${componentName}`,
        startTime: renderStartRef.current,
        endTime: performance.now(),
        duration,
        metadata: { component: componentName },
      });
      
      // Log slow renders in development
      if (import.meta.env.DEV && duration > 16) { // 60fps = 16.67ms per frame
        console.warn(`🐌 Slow render "${componentName}": ${duration.toFixed(2)}ms`);
      }
    }
  });
}

// API call performance tracker
export function useApiPerformance() {
  const { measureAsync } = usePerformanceMonitor();
  
  const measureApiCall = useCallback(async <T>(
    url: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(`api-${url}`, operation, { url });
  }, [measureAsync]);
  
  return { measureApiCall };
}

// User interaction performance tracker
export function useInteractionPerformance() {
  const { measureOperation } = usePerformanceMonitor();
  
  const measureInteraction = useCallback((interactionType: string, metadata?: Record<string, any>) => {
    return measureOperation(`interaction-${interactionType}`, metadata);
  }, [measureOperation]);
  
  return { measureInteraction };
}

// Performance monitoring component (React component)
export const PerformanceMonitorComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats } = usePerformanceMonitor();
  
  // Show performance warnings in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (stats.averageRenderTime > 20) {
        console.warn('🐌 Average render time is high:', stats.averageRenderTime.toFixed(2) + 'ms');
      }
      
      if (stats.averageApiResponseTime > 500) {
        console.warn('🐌 Average API response time is high:', stats.averageApiResponseTime.toFixed(2) + 'ms');
      }
      
      if (stats.memoryUsage && stats.memoryUsage > 100) {
        console.warn('🧠 High memory usage:', stats.memoryUsage.toFixed(2) + 'MB');
      }
    }
  }, [stats]);
  
  return children as React.ReactElement;
};