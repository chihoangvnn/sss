/**
 * 🏥 SYSTEM HEALTH MONITORING SERVICE
 * 
 * Comprehensive health monitoring cho "Bộ Não - Cánh Tay - Vệ Tinh" architecture
 * 
 * Features:
 * - Worker health monitoring
 * - Database connectivity checks
 * - Queue health monitoring
 * - External service checks (Facebook API, etc.)
 * - Performance metrics
 * - Alert system
 */

import { WorkerManagementService } from './worker-management';
import workerStorage from '../storage/worker-storage';
import QueueService from './queue';
import { storage } from '../storage';
import axios from 'axios';

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
  checkedAt: Date;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: SystemHealthCheck[];
  metrics: {
    totalWorkers: number;
    onlineWorkers: number;
    activeJobs: number;
    queueHealth: 'healthy' | 'degraded' | 'unhealthy';
    averageResponseTime: number;
  };
  alerts: string[];
  reportGeneratedAt: Date;
}

export class SystemHealthService {
  private static instance: SystemHealthService;
  private workerManager: WorkerManagementService;
  private queueService: QueueService;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  
  // Cache for health check data to avoid repeated DB queries
  private healthCheckCache: {
    workers?: any[];
    workerStats?: any;
    lastFetch?: number;
    cacheDuration: number;
  } = {
    cacheDuration: 30000, // 30 seconds cache (aligned better with 60s interval)
  };

  // Static cache shared across all entry points
  private static sharedHealthCache: {
    workers?: any[];
    workerStats?: any;
    lastFetch?: number;
    cacheDuration: number;
  } = {
    cacheDuration: 30000,
  };

  private constructor() {
    this.workerManager = WorkerManagementService.getInstance();
    this.queueService = new QueueService();
    this.startHealthMonitoring();
  }

  public static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  /**
   * 🔍 Generate comprehensive system health report with caching optimization
   */
  async generateHealthReport(): Promise<SystemHealthReport> {
    console.log('🏥 Generating system health report...');
    
    const startTime = Date.now();
    
    // Pre-fetch worker data once to avoid repeated queries
    await this.refreshWorkerCache();
    
    // Run all health checks in parallel
    const [
      databaseCheck,
      workerHealthCheck,
      queueHealthCheck,
      facebookApiCheck,
      storageCheck
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkWorkerHealth(),
      this.checkQueueHealth(),
      this.checkFacebookApiHealth(),
      this.checkStorageHealth()
    ]);

    const components = [
      databaseCheck,
      workerHealthCheck,
      queueHealthCheck,
      facebookApiCheck,
      storageCheck
    ];

    // Calculate overall system health
    const overallStatus = this.calculateOverallHealth(components);
    
    // Get system metrics (using cached data)
    const metrics = await this.getSystemMetrics();
    
    // Generate alerts
    const alerts = this.generateAlerts(components, metrics);

    const report: SystemHealthReport = {
      overall: overallStatus,
      components,
      metrics,
      alerts,
      reportGeneratedAt: new Date()
    };

    console.log(`✅ Health report generated in ${Date.now() - startTime}ms - Overall: ${overallStatus}`);
    return report;
  }

  /**
   * 🔄 Refresh worker data cache to avoid repeated DB queries (shared across instances)
   */
  private async refreshWorkerCache(forceRefresh = false): Promise<void> {
    const now = Date.now();
    const cache = SystemHealthService.sharedHealthCache;
    
    // Check if cache is still valid unless forcing refresh
    if (!forceRefresh && cache.lastFetch && 
        (now - cache.lastFetch) < cache.cacheDuration) {
      // Copy shared cache to instance cache
      this.healthCheckCache = { ...cache };
      return; // Cache is still valid
    }

    try {
      // Fetch data once and cache it
      const [workers, workerStats] = await Promise.all([
        workerStorage.getWorkers({}),
        workerStorage.getWorkerStats()
      ]);

      // Update both shared and instance cache
      const newCacheData = {
        workers,
        workerStats,
        lastFetch: now,
        cacheDuration: cache.cacheDuration
      };

      SystemHealthService.sharedHealthCache = newCacheData;
      this.healthCheckCache = { ...newCacheData };
    } catch (error) {
      console.error('Failed to refresh worker cache:', error);
    }
  }

  /**
   * 📊 Get cached worker data with fallback to shared cache
   */
  private getCachedWorkers(): any[] {
    return this.healthCheckCache.workers || SystemHealthService.sharedHealthCache.workers || [];
  }

  /**
   * 📊 Get cached worker stats with fallback to shared cache  
   */
  private getCachedWorkerStats(): any {
    return this.healthCheckCache.workerStats || SystemHealthService.sharedHealthCache.workerStats || {
      totalWorkers: 0,
      activeWorkers: 0,
      totalJobsInProgress: 0
    };
  }

  /**
   * 🔄 Invalidate worker cache (call when worker data changes)
   */
  public static invalidateWorkerCache(): void {
    SystemHealthService.sharedHealthCache = { cacheDuration: 30000 };
  }

  /**
   * 🗄️ Check database connectivity and performance
   */
  private async checkDatabaseHealth(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic database connectivity
      const users = await storage.getCustomers(1);
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 2000) status = 'unhealthy';
      else if (responseTime > 1000) status = 'degraded';

      return {
        component: 'database',
        status,
        responseTime,
        details: {
          connectionPool: 'active',
          queryTime: responseTime
        },
        checkedAt: new Date()
      };

    } catch (error) {
      return {
        component: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
        checkedAt: new Date()
      };
    }
  }

  /**
   * 👥 Check worker health and availability (using cached data)
   */
  private async checkWorkerHealth(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      const workers = this.getCachedWorkers();
      const onlineWorkers = workers.filter(w => w.isOnline);
      const healthyWorkers = onlineWorkers.filter(w => w.status === 'active');
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      const healthyRatio = workers.length > 0 ? healthyWorkers.length / workers.length : 0;
      
      if (healthyRatio < 0.5) status = 'unhealthy';
      else if (healthyRatio < 0.8) status = 'degraded';

      return {
        component: 'workers',
        status,
        responseTime,
        details: {
          totalWorkers: workers.length,
          onlineWorkers: onlineWorkers.length,
          healthyWorkers: healthyWorkers.length,
          healthyRatio: Math.round(healthyRatio * 100)
        },
        checkedAt: new Date()
      };

    } catch (error) {
      return {
        component: 'workers',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Worker health check failed',
        checkedAt: new Date()
      };
    }
  }

  /**
   * 📋 Check queue system health
   */
  private async checkQueueHealth(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      const queueStats = await QueueService.getQueueStats();
      const responseTime = Date.now() - startTime;
      
      // Calculate queue health based on waiting jobs and failed jobs
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      const totalWaiting = Object.values(queueStats).reduce((total: number, stats: any) => {
        return total + (stats.waiting || 0);
      }, 0);
      
      const totalFailed = Object.values(queueStats).reduce((total: number, stats: any) => {
        return total + (stats.failed || 0);
      }, 0);

      if (totalWaiting > 100 || totalFailed > 50) status = 'unhealthy';
      else if (totalWaiting > 50 || totalFailed > 20) status = 'degraded';

      return {
        component: 'queue',
        status,
        responseTime,
        details: {
          totalWaiting,
          totalFailed,
          queues: Object.keys(queueStats).length
        },
        checkedAt: new Date()
      };

    } catch (error) {
      return {
        component: 'queue',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Queue health check failed',
        checkedAt: new Date()
      };
    }
  }

  /**
   * 📘 Check Facebook API connectivity (without requiring auth token)
   */
  private async checkFacebookApiHealth(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test Facebook Graph API reachability without authentication
      // Using HEAD request to check if the service is reachable
      const response = await axios.head('https://graph.facebook.com/v18.0/', {
        timeout: 5000,
        headers: {
          'User-Agent': 'TailwindAdmin-HealthCheck/1.0'
        },
        validateStatus: (status) => {
          // Accept both success and auth-required responses as "healthy"
          return status < 500; // Accept 2xx, 3xx, 4xx as healthy (service reachable)
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 3000) status = 'degraded';

      return {
        component: 'facebook_api',
        status,
        responseTime,
        details: {
          endpoint: 'graph.facebook.com',
          version: 'v18.0',
          httpStatus: response.status,
          reachable: true
        },
        checkedAt: new Date()
      };

    } catch (error) {
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
      
      // Only mark as unhealthy if there's a network/connectivity issue
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          status = 'unhealthy'; // Network connectivity issue
        } else if (error.response && error.response.status < 500) {
          status = 'healthy'; // Service is reachable, just auth/other 4xx issues
        } else {
          status = 'degraded'; // 5xx errors indicate service issues
        }
      }

      return {
        component: 'facebook_api',
        status,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Facebook API check failed',
        details: {
          endpoint: 'graph.facebook.com',
          errorCode: axios.isAxiosError(error) ? error.code : 'unknown',
          httpStatus: axios.isAxiosError(error) ? error.response?.status : undefined
        },
        checkedAt: new Date()
      };
    }
  }

  /**
   * 💾 Check storage system health (using cached data)
   */
  private async checkStorageHealth(): Promise<SystemHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Use cached storage stats
      const stats = this.getCachedWorkerStats();
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 1000) status = 'degraded';

      return {
        component: 'storage',
        status,
        responseTime,
        details: {
          type: 'in-memory',
          workers: stats.totalWorkers,
          activeWorkers: stats.activeWorkers
        },
        checkedAt: new Date()
      };

    } catch (error) {
      return {
        component: 'storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Storage health check failed',
        checkedAt: new Date()
      };
    }
  }

  /**
   * 📊 Get comprehensive system metrics (using cached data)
   */
  private async getSystemMetrics(): Promise<SystemHealthReport['metrics']> {
    try {
      const workers = this.getCachedWorkers();
      const onlineWorkers = workers.filter(w => w.isOnline);
      const stats = this.getCachedWorkerStats();
      
      const avgResponseTime = workers.length > 0 
        ? workers.reduce((sum, w) => sum + (w.avgResponseTime || 0), 0) / workers.length
        : 0;

      return {
        totalWorkers: workers.length,
        onlineWorkers: onlineWorkers.length,
        activeJobs: stats.totalJobsInProgress,
        queueHealth: 'healthy', // TODO: Calculate based on queue metrics
        averageResponseTime: Math.round(avgResponseTime)
      };

    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        totalWorkers: 0,
        onlineWorkers: 0,
        activeJobs: 0,
        queueHealth: 'unhealthy',
        averageResponseTime: 0
      };
    }
  }

  /**
   * ⚠️ Generate system alerts based on health checks
   */
  private generateAlerts(components: SystemHealthCheck[], metrics: SystemHealthReport['metrics']): string[] {
    const alerts: string[] = [];

    // Check component alerts
    components.forEach(component => {
      if (component.status === 'unhealthy') {
        alerts.push(`🔴 ${component.component.toUpperCase()} is unhealthy: ${component.error || 'Critical issue detected'}`);
      } else if (component.status === 'degraded') {
        alerts.push(`🟡 ${component.component.toUpperCase()} is degraded: Performance issues detected`);
      }
    });

    // Check metrics alerts
    if (metrics.onlineWorkers === 0) {
      alerts.push('🔴 CRITICAL: No workers are online - Auto-posting system is offline');
    } else if (metrics.onlineWorkers < metrics.totalWorkers * 0.5) {
      alerts.push('🟡 WARNING: Less than 50% of workers are online');
    }

    if (metrics.activeJobs > 100) {
      alerts.push('🟡 WARNING: High job queue volume - Consider adding more workers');
    }

    if (metrics.averageResponseTime > 5000) {
      alerts.push('🟡 WARNING: High average response time - Performance degradation detected');
    }

    return alerts;
  }

  /**
   * 🎯 Calculate overall system health
   */
  private calculateOverallHealth(components: SystemHealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyComponents = components.filter(c => c.status === 'unhealthy').length;
    const degradedComponents = components.filter(c => c.status === 'degraded').length;

    if (unhealthyComponents > 0) return 'unhealthy';
    if (degradedComponents > 1) return 'degraded';
    if (degradedComponents > 0) return 'degraded';
    
    return 'healthy';
  }

  /**
   * 🔄 Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const report = await this.generateHealthReport();
        
        // Log critical alerts
        if (report.overall === 'unhealthy') {
          console.error('🚨 SYSTEM HEALTH CRITICAL:', report.alerts);
        } else if (report.overall === 'degraded') {
          console.warn('⚠️ SYSTEM HEALTH DEGRADED:', report.alerts);
        } else {
          console.log('✅ System health check passed');
        }

      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);

    console.log('🏥 Started system health monitoring');
  }

  /**
   * 🛑 Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('🛑 Stopped system health monitoring');
    }
  }
}

export default SystemHealthService;