import { useEffect, useRef, useCallback, useState } from 'react';

interface MemoryStats {
  usedJSHeapSize: number; // MB
  totalJSHeapSize: number; // MB
  jsHeapSizeLimit: number; // MB
  timestamp: number;
  isSupported: boolean;
}

interface MemoryMonitorOptions {
  interval?: number; // ms
  alertThreshold?: number; // MB
  leakDetectionWindow?: number; // minutes
  enableGCObservation?: boolean;
}

interface MemoryLeak {
  component: string;
  growth: number; // MB
  duration: number; // minutes
  samples: number;
}

// Global memory monitoring state
class MemoryMonitor {
  private samples: MemoryStats[] = [];
  private maxSamples = 100; // Keep last 100 samples
  private listeners: Set<(stats: MemoryStats) => void> = new Set();
  private leakListeners: Set<(leak: MemoryLeak) => void> = new Set();
  private intervalId?: NodeJS.Timeout;
  
  startMonitoring(interval: number = 5000) {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      if (stats.isSupported) {
        this.addSample(stats);
        this.notifyListeners(stats);
        this.detectMemoryLeaks();
      }
    }, interval);
  }
  
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
  
  private getCurrentMemoryStats(): MemoryStats {
    const timestamp = Date.now();
    
    // Check if performance.memory is available (Chrome/Edge)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore - performance.memory is non-standard but available in Chrome
      const memory = performance.memory;
      
      return {
        usedJSHeapSize: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
        totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024),
        jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024),
        timestamp,
        isSupported: true,
      };
    }
    
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      timestamp,
      isSupported: false,
    };
  }
  
  private addSample(stats: MemoryStats) {
    this.samples.push(stats);
    
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }
  
  private detectMemoryLeaks() {
    if (this.samples.length < 10) return; // Need enough samples
    
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentSamples = this.samples.filter(s => s.timestamp >= fiveMinutesAgo);
    
    if (recentSamples.length < 5) return;
    
    const firstSample = recentSamples[0];
    const lastSample = recentSamples[recentSamples.length - 1];
    const growth = lastSample.usedJSHeapSize - firstSample.usedJSHeapSize;
    const duration = (lastSample.timestamp - firstSample.timestamp) / (1000 * 60);
    
    // Consider it a potential leak if memory grew by > 10MB in 5 minutes
    if (growth > 10) {
      const leak: MemoryLeak = {
        component: 'POS App',
        growth,
        duration,
        samples: recentSamples.length,
      };
      
      this.leakListeners.forEach(listener => listener(leak));
    }
  }
  
  subscribe(listener: (stats: MemoryStats) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  subscribeToLeaks(listener: (leak: MemoryLeak) => void) {
    this.leakListeners.add(listener);
    return () => this.leakListeners.delete(listener);
  }
  
  private notifyListeners(stats: MemoryStats) {
    this.listeners.forEach(listener => listener(stats));
  }
  
  getStats() {
    const current = this.getCurrentMemoryStats();
    const recent = this.samples.slice(-10); // Last 10 samples
    
    const avgMemoryUsage = recent.length > 0
      ? recent.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / recent.length
      : current.usedJSHeapSize;
    
    const peakMemoryUsage = recent.length > 0
      ? Math.max(...recent.map(s => s.usedJSHeapSize))
      : current.usedJSHeapSize;
    
    const trend = recent.length >= 2
      ? recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize
      : 0;
    
    return {
      current,
      avgMemoryUsage,
      peakMemoryUsage,
      trend,
      sampleCount: this.samples.length,
      isMonitoring: !!this.intervalId,
    };
  }
  
  clear() {
    this.samples = [];
  }
  
  forceGC() {
    // Only works in Chrome with --enable-precise-memory-info
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        // @ts-ignore
        window.gc();
        console.log('🗑️ Forced garbage collection');
      } catch (error) {
        console.warn('Garbage collection not available');
      }
    } else {
      console.warn('Garbage collection not supported. Use Chrome with --enable-precise-memory-info flag.');
    }
  }
}

const globalMemoryMonitor = new MemoryMonitor();

export function useMemoryMonitor(options: MemoryMonitorOptions = {}) {
  const {
    interval = 5000,
    alertThreshold = 100, // MB
    leakDetectionWindow = 5, // minutes
    enableGCObservation = true,
  } = options;
  
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [memoryLeaks, setMemoryLeaks] = useState<MemoryLeak[]>([]);
  const alertShownRef = useRef(false);
  
  // Start monitoring
  const startMonitoring = useCallback(() => {
    globalMemoryMonitor.startMonitoring(interval);
    setIsMonitoring(true);
  }, [interval]);
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    globalMemoryMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);
  
  // Force garbage collection (Chrome only)
  const forceGC = useCallback(() => {
    globalMemoryMonitor.forceGC();
  }, []);
  
  // Clear memory statistics
  const clearStats = useCallback(() => {
    globalMemoryMonitor.clear();
    setMemoryLeaks([]);
    alertShownRef.current = false;
  }, []);
  
  // Subscribe to memory updates
  useEffect(() => {
    const unsubscribe = globalMemoryMonitor.subscribe((stats) => {
      setMemoryStats(stats);
      
      // Show alert if memory exceeds threshold
      if (stats.usedJSHeapSize > alertThreshold && !alertShownRef.current) {
        console.warn(`🧠 Memory usage high: ${stats.usedJSHeapSize.toFixed(1)}MB (threshold: ${alertThreshold}MB)`);
        alertShownRef.current = true;
        
        // Reset alert after 5 minutes
        setTimeout(() => {
          alertShownRef.current = false;
        }, 5 * 60 * 1000);
      }
    });
    
    return unsubscribe;
  }, [alertThreshold]);
  
  // Subscribe to memory leak detection
  useEffect(() => {
    const unsubscribe = globalMemoryMonitor.subscribeToLeaks((leak) => {
      setMemoryLeaks(prev => [...prev, leak].slice(-5)); // Keep last 5 leaks
      
      if (import.meta.env.DEV) {
        console.warn(
          `🚨 Potential memory leak detected: ${leak.growth.toFixed(1)}MB growth in ${leak.duration.toFixed(1)} minutes`
        );
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Auto-start monitoring in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      startMonitoring();
    }
    
    return () => {
      if (import.meta.env.DEV) {
        stopMonitoring();
      }
    };
  }, [startMonitoring, stopMonitoring]);
  
  // Component cleanup tracking
  useEffect(() => {
    const componentStartTime = Date.now();
    const componentStartMemory = globalMemoryMonitor.getStats().current.usedJSHeapSize;
    
    return () => {
      // Track memory usage on component unmount
      const componentEndTime = Date.now();
      const componentEndMemory = globalMemoryMonitor.getStats().current.usedJSHeapSize;
      const memoryDelta = componentEndMemory - componentStartMemory;
      const duration = componentEndTime - componentStartTime;
      
      if (import.meta.env.DEV && Math.abs(memoryDelta) > 1) { // More than 1MB difference
        console.log(
          `🧠 Component memory change: ${memoryDelta > 0 ? '+' : ''}${memoryDelta.toFixed(1)}MB over ${(duration / 1000).toFixed(1)}s`
        );
      }
    };
  }, []);
  
  return {
    memoryStats,
    isMonitoring,
    memoryLeaks,
    startMonitoring,
    stopMonitoring,
    forceGC,
    clearStats,
    getDetailedStats: () => globalMemoryMonitor.getStats(),
  };
}

// Hook for component-specific memory tracking
export function useComponentMemoryTracking(componentName: string) {
  const startMemoryRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    const stats = globalMemoryMonitor.getStats();
    startMemoryRef.current = stats.current.usedJSHeapSize;
    startTimeRef.current = Date.now();
    
    if (import.meta.env.DEV) {
      console.log(`🧠 ${componentName} mounted: ${startMemoryRef.current.toFixed(1)}MB`);
    }
    
    return () => {
      const endStats = globalMemoryMonitor.getStats();
      const memoryDelta = endStats.current.usedJSHeapSize - startMemoryRef.current;
      const duration = Date.now() - startTimeRef.current;
      
      if (import.meta.env.DEV) {
        console.log(
          `🧠 ${componentName} unmounted: ${memoryDelta > 0 ? '+' : ''}${memoryDelta.toFixed(1)}MB change in ${(duration / 1000).toFixed(1)}s`
        );
        
        if (Math.abs(memoryDelta) > 5) {
          console.warn(`🚨 Large memory change detected in ${componentName}: ${memoryDelta.toFixed(1)}MB`);
        }
      }
    };
  }, [componentName]);
}

// Hook for multi-tab memory optimization
export function useMultiTabMemoryOptimization() {
  const [isTabVisible, setIsTabVisible] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
      
      if (document.hidden) {
        // Tab is hidden - reduce memory usage
        if (import.meta.env.DEV) {
          console.log('🔄 Tab hidden - reducing memory usage');
        }
        
        // Clear caches that can be rebuilt
        if (typeof window !== 'undefined') {
          // Clear image caches
          const images = document.querySelectorAll('img');
          images.forEach(img => {
            if (img.src && img.src.startsWith('blob:')) {
              // Clear blob URLs to free memory
              URL.revokeObjectURL(img.src);
            }
          });
        }
        
        // Force garbage collection if available
        globalMemoryMonitor.forceGC();
      } else {
        // Tab is visible - restore normal operation
        if (import.meta.env.DEV) {
          console.log('🔄 Tab visible - restoring normal operation');
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return {
    isTabVisible,
    shouldReduceMemoryUsage: !isTabVisible,
  };
}

// Development memory audit utility
export function auditMemoryLeaks() {
  if (!import.meta.env.DEV) return;
  
  console.log('🔍 Starting memory leak audit...');
  
  const stats = globalMemoryMonitor.getStats();
  
  console.group('📊 Memory Statistics');
  console.log(`Current Memory: ${stats.current.usedJSHeapSize.toFixed(1)}MB`);
  console.log(`Average Memory: ${stats.avgMemoryUsage.toFixed(1)}MB`);
  console.log(`Peak Memory: ${stats.peakMemoryUsage.toFixed(1)}MB`);
  console.log(`Trend: ${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}MB`);
  console.log(`Samples: ${stats.sampleCount}`);
  console.groupEnd();
  
  // Check for common memory leak patterns
  const leakPatterns = [
    {
      name: 'Event Listeners',
      check: () => {
        // Count event listeners (rough approximation)
        const elements = document.querySelectorAll('*');
        let listenerCount = 0;
        elements.forEach(el => {
          // @ts-ignore
          if (el._listeners) {
            // @ts-ignore
            listenerCount += Object.keys(el._listeners).length;
          }
        });
        return listenerCount;
      }
    },
    {
      name: 'DOM Nodes',
      check: () => document.querySelectorAll('*').length
    },
    {
      name: 'Images',
      check: () => document.querySelectorAll('img').length
    }
  ];
  
  console.group('🔍 Leak Pattern Analysis');
  leakPatterns.forEach(pattern => {
    try {
      const count = pattern.check();
      console.log(`${pattern.name}: ${count}`);
    } catch (error) {
      console.log(`${pattern.name}: Unable to check`);
    }
  });
  console.groupEnd();
  
  console.log('✅ Memory audit completed');
}