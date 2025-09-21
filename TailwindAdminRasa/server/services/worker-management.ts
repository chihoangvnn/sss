/**
 * 🚀 MULTI-PLATFORM WORKER MANAGEMENT SERVICE
 * 
 * Comprehensive worker management system featuring:
 * - Multi-platform worker registration (Facebook, Instagram, TikTok, Twitter, YouTube, LinkedIn)
 * - Intelligent job routing based on platform capabilities
 * - Real-time health monitoring and performance tracking
 * - Auto-scaling and load balancing across regions
 * - Platform-specific optimization and error handling
 */

import { storage } from '../storage';
import workerStorage from '../storage/worker-storage';
import QueueService from './queue';
import { SUPPORTED_REGIONS } from './regions';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { 
  Worker, 
  InsertWorker, 
  WorkerJob, 
  InsertWorkerJob,
  WorkerHealthCheck,
  InsertWorkerHealthCheck,
  WorkerPlatform,
  WorkerCapability
} from '@shared/schema';
import { SUPPORTED_WORKER_PLATFORMS } from '@shared/schema';

// Worker registration and capabilities
export interface WorkerRegistrationData {
  workerId: string;
  name: string;
  description?: string;
  platforms: WorkerPlatform[];
  capabilities: WorkerCapability[];
  region: string;
  deploymentPlatform: 'vercel' | 'railway' | 'render' | 'netlify';
  endpointUrl: string;
  registrationSecret: string;
  maxConcurrentJobs?: number;
  minJobInterval?: number; // seconds
  maxJobsPerHour?: number;
  specialties?: string[]; // video_posts, high_volume, etc.
  tags?: string[];
  metadata?: Record<string, any>;
}

// Job assignment criteria
export interface JobAssignmentCriteria {
  platform: WorkerPlatform;
  jobType: 'post_text' | 'post_image' | 'post_video' | 'post_story' | 'post_reel';
  priority: number;
  region?: string;
  requiredCapabilities?: string[];
  excludeWorkers?: string[];
  preferredWorkers?: string[];
}

// Worker performance metrics
export interface WorkerPerformanceMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageExecutionTime: number;
  averageResponseTime: number;
  successRate: number;
  currentLoad: number;
  utilizationRate: number;
  errorRate: number;
  lastJobAt?: Date;
  lastPingAt?: Date;
}

// Worker health status
export interface WorkerHealthStatus {
  workerId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  platformStatus: Record<WorkerPlatform, {
    status: 'healthy' | 'degraded' | 'error';
    lastSuccessAt?: string;
    errorCount: number;
    avgResponseTime: number;
  }>;
  systemMetrics: {
    responseTime: number;
    cpuUsage?: number;
    memoryUsage?: number;
    networkLatency?: number;
  };
  lastCheckAt: Date;
}

/**
 * Multi-Platform Worker Management Service
 * Handles worker registration, job assignment, and health monitoring
 */
export class WorkerManagementService {
  private static instance: WorkerManagementService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  // Singleton pattern
  public static getInstance(): WorkerManagementService {
    if (!WorkerManagementService.instance) {
      WorkerManagementService.instance = new WorkerManagementService();
    }
    return WorkerManagementService.instance;
  }

  /**
   * 🔐 Generate secure authentication token for worker (ALIGNED with API middleware)
   */
  private generateWorkerAuthToken(workerId: string, region: string, platforms: WorkerPlatform[]): { token: string; expiresAt: Date } {
    const secret = process.env.WORKER_JWT_SECRET || 'dev-worker-secret-change-in-production';
    const expiresIn = '24h'; // Match existing auth endpoint
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const payload = {
      workerId,
      region,
      platforms,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, secret, { expiresIn });
    
    return { token, expiresAt };
  }

  // NOTE: Token verification is handled by the authenticateWorker middleware in workers.ts API

  constructor() {
    // Start periodic health checks
    this.startHealthMonitoring();
  }

  /**
   * Register a new worker with platform capabilities
   */
  async registerWorker(registrationData: WorkerRegistrationData): Promise<{
    success: boolean;
    worker?: Worker;
    authToken?: string;
    error?: string;
  }> {
    try {
      console.log(`🔧 Registering worker: ${registrationData.workerId} for platforms: ${registrationData.platforms.join(', ')}`);

      // Validate platform support
      const unsupportedPlatforms = registrationData.platforms.filter(
        platform => !SUPPORTED_WORKER_PLATFORMS.includes(platform)
      );
      
      if (unsupportedPlatforms.length > 0) {
        return {
          success: false,
          error: `Unsupported platforms: ${unsupportedPlatforms.join(', ')}`
        };
      }

      // Validate region support
      if (!SUPPORTED_REGIONS.includes(registrationData.region as any)) {
        return {
          success: false,
          error: `Unsupported region: ${registrationData.region}`
        };
      }

      // Check if worker already exists
      const existingWorker = await this.getWorkerByWorkerId(registrationData.workerId);
      if (existingWorker) {
        return {
          success: false,
          error: 'Worker ID already exists'
        };
      }

      // Generate authentication token
      const { token: authToken } = this.generateWorkerAuthToken(
        registrationData.workerId, 
        registrationData.region, 
        registrationData.platforms
      );

      // Create worker record
      const workerData: InsertWorker = {
        workerId: registrationData.workerId,
        name: registrationData.name,
        description: registrationData.description,
        platforms: registrationData.platforms,
        capabilities: registrationData.capabilities,
        specialties: registrationData.specialties || [],
        maxConcurrentJobs: registrationData.maxConcurrentJobs || 3,
        minJobInterval: registrationData.minJobInterval || 300,
        maxJobsPerHour: registrationData.maxJobsPerHour || 12,
        avgExecutionTime: 5000, // Default 5 seconds
        region: registrationData.region,
        environment: 'production',
        deploymentPlatform: registrationData.deploymentPlatform,
        endpointUrl: registrationData.endpointUrl,
        status: 'active',
        isOnline: true,
        lastPingAt: new Date(),
        registrationSecret: registrationData.registrationSecret, // Store secret as required by schema
        authToken,
        tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        tags: registrationData.tags || [],
        priority: 1,
        isEnabled: true,
        metadata: registrationData.metadata || {}
      };

      const worker = await workerStorage.createWorker(workerData);
      
      if (!worker) {
        return {
          success: false,
          error: 'Failed to create worker record'
        };
      }

      console.log(`✅ Worker registered successfully: ${worker.workerId}`);
      
      return {
        success: true,
        worker,
        authToken
      };

    } catch (error) {
      console.error('Failed to register worker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get optimal worker for job assignment
   */
  async getOptimalWorker(criteria: JobAssignmentCriteria): Promise<{
    worker?: Worker;
    reason?: string;
  }> {
    try {
      // Get all active workers that support the platform
      const availableWorkers = await this.getAvailableWorkers(criteria.platform, criteria.region);
      
      if (availableWorkers.length === 0) {
        return { reason: 'No available workers for platform' };
      }

      // Filter by job type capabilities
      const capableWorkers = availableWorkers.filter(worker => 
        worker.capabilities.some(cap => 
          cap.platform === criteria.platform && 
          cap.actions.includes(criteria.jobType)
        )
      );

      if (capableWorkers.length === 0) {
        return { reason: 'No workers with required job type capabilities' };
      }

      // Apply preference filters
      let filteredWorkers = capableWorkers;
      
      if (criteria.excludeWorkers?.length) {
        filteredWorkers = filteredWorkers.filter(w => 
          !criteria.excludeWorkers!.includes(w.workerId)
        );
      }

      if (criteria.preferredWorkers?.length) {
        const preferredWorkers = filteredWorkers.filter(w => 
          criteria.preferredWorkers!.includes(w.workerId)
        );
        if (preferredWorkers.length > 0) {
          filteredWorkers = preferredWorkers;
        }
      }

      if (filteredWorkers.length === 0) {
        return { reason: 'No workers available after filtering' };
      }

      // Score workers based on performance and availability
      const scoredWorkers = await Promise.all(
        filteredWorkers.map(async (worker) => {
          const score = await this.calculateWorkerScore(worker, criteria);
          return { worker, score };
        })
      );

      // Sort by score (highest first)
      scoredWorkers.sort((a, b) => b.score - a.score);
      
      return { worker: scoredWorkers[0].worker };

    } catch (error) {
      console.error('Failed to get optimal worker:', error);
      return { reason: 'Failed to find optimal worker' };
    }
  }

  /**
   * Assign job to worker
   */
  async assignJobToWorker(
    workerId: string, 
    jobData: {
      jobId: string;
      scheduledPostId: string;
      platform: WorkerPlatform;
      jobType: string;
      priority: number;
    }
  ): Promise<{
    success: boolean;
    workerJob?: WorkerJob;
    error?: string;
  }> {
    try {
      // Verify worker exists and is available
      const worker = await this.getWorkerByWorkerId(workerId);
      if (!worker) {
        return { success: false, error: 'Worker not found' };
      }

      if (!worker.isEnabled || worker.status !== 'active') {
        return { success: false, error: 'Worker not available' };
      }

      // Check worker capacity
      const currentLoad = await this.getWorkerCurrentLoad(workerId);
      if (currentLoad >= worker.maxConcurrentJobs) {
        return { success: false, error: 'Worker at capacity' };
      }

      // Create worker job assignment
      const workerJobData: InsertWorkerJob = {
        workerId: worker.id,
        jobId: jobData.jobId,
        scheduledPostId: jobData.scheduledPostId,
        platform: jobData.platform,
        jobType: jobData.jobType,
        priority: jobData.priority,
        status: 'assigned'
      };

      const workerJob = await workerStorage.createWorkerJob(workerJobData);
      
      if (!workerJob) {
        return { success: false, error: 'Failed to create job assignment' };
      }

      // Update worker current load
      await workerStorage.updateWorker(worker.id, {
        currentLoad: currentLoad + 1,
        lastJobAt: new Date()
      });

      console.log(`📋 Job ${jobData.jobId} assigned to worker ${workerId}`);
      
      return { success: true, workerJob };

    } catch (error) {
      console.error('Failed to assign job to worker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign job'
      };
    }
  }

  /**
   * Update worker health status
   */
  async updateWorkerHealth(workerId: string, healthData: Partial<WorkerHealthStatus>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const worker = await this.getWorkerByWorkerId(workerId);
      if (!worker) {
        return { success: false, error: 'Worker not found' };
      }

      // Create health check record
      const healthCheckData: InsertWorkerHealthCheck = {
        workerId: worker.id,
        status: healthData.status || 'healthy',
        responseTime: healthData.systemMetrics?.responseTime || 0,
        cpuUsage: healthData.systemMetrics?.cpuUsage ? healthData.systemMetrics.cpuUsage.toString() : undefined,
        memoryUsage: healthData.systemMetrics?.memoryUsage ? healthData.systemMetrics.memoryUsage.toString() : undefined,
        networkLatency: healthData.systemMetrics?.networkLatency,
        platformStatus: healthData.platformStatus || null,
        errorCount: 0,
        checkedAt: new Date()
      };

      await workerStorage.createWorkerHealthCheck(healthCheckData);

      // Update worker status
      const isOnline = healthData.status !== 'offline';
      await workerStorage.updateWorker(worker.id, {
        isOnline,
        lastPingAt: new Date(),
        avgResponseTime: healthData.systemMetrics?.responseTime || worker.avgResponseTime
      });

      return { success: true };

    } catch (error) {
      console.error('Failed to update worker health:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update health'
      };
    }
  }

  /**
   * Get worker performance metrics
   */
  async getWorkerMetrics(workerId: string): Promise<WorkerPerformanceMetrics | null> {
    try {
      const worker = await this.getWorkerByWorkerId(workerId);
      if (!worker) return null;

      return {
        totalJobs: worker.totalJobsCompleted + worker.totalJobsFailed,
        successfulJobs: worker.totalJobsCompleted,
        failedJobs: worker.totalJobsFailed,
        averageExecutionTime: worker.avgExecutionTime || 0,
        averageResponseTime: worker.avgResponseTime || 0,
        successRate: parseFloat(worker.successRate || '0'),
        currentLoad: worker.currentLoad,
        utilizationRate: (worker.currentLoad / worker.maxConcurrentJobs) * 100,
        errorRate: worker.totalJobsCompleted > 0 ? 
          (worker.totalJobsFailed / (worker.totalJobsCompleted + worker.totalJobsFailed)) * 100 : 0,
        lastJobAt: worker.lastJobAt || undefined,
        lastPingAt: worker.lastPingAt || undefined
      };

    } catch (error) {
      console.error('Failed to get worker metrics:', error);
      return null;
    }
  }

  /**
   * List all workers with filtering options
   */
  async listWorkers(filters?: {
    platform?: WorkerPlatform;
    region?: string;
    status?: string;
    isOnline?: boolean;
  }): Promise<Worker[]> {
    try {
      return await workerStorage.getWorkers(filters);
    } catch (error) {
      console.error('Failed to list workers:', error);
      return [];
    }
  }

  // Private helper methods

  private async getWorkerByWorkerId(workerId: string): Promise<Worker | null> {
    try {
      return await workerStorage.getWorkerByWorkerId(workerId);
    } catch (error) {
      console.error('Failed to get worker by ID:', error);
      return null;
    }
  }

  private async getAvailableWorkers(platform: WorkerPlatform, region?: string): Promise<Worker[]> {
    const filters: any = {
      status: 'active',
      isOnline: true
    };
    
    if (region) {
      filters.region = region;
    }

    const workers = await workerStorage.getWorkers(filters);
    
    // Filter by platform capability
    return workers.filter(worker => 
      worker.platforms.includes(platform) &&
      worker.isEnabled &&
      worker.currentLoad < worker.maxConcurrentJobs
    );
  }

  private async getWorkerCurrentLoad(workerId: string): Promise<number> {
    try {
      return await workerStorage.getWorkerCurrentLoad(workerId);
    } catch (error) {
      console.error('Failed to get worker current load:', error);
      return 0;
    }
  }

  private async calculateWorkerScore(worker: Worker, criteria: JobAssignmentCriteria): Promise<number> {
    let score = 0;

    // Base score from success rate
    score += parseFloat(worker.successRate || '0') * 10;

    // Capacity score (prefer workers with more available capacity)
    const availableCapacity = worker.maxConcurrentJobs - worker.currentLoad;
    score += (availableCapacity / worker.maxConcurrentJobs) * 20;

    // Performance score (prefer faster workers)
    const avgTime = worker.avgExecutionTime || 5000;
    score += Math.max(0, (10000 - avgTime) / 1000); // Better score for faster execution

    // Priority bonus
    score += (5 - worker.priority) * 5; // Higher priority = better score

    // Recent activity bonus (prefer recently active workers)
    if (worker.lastJobAt) {
      const hoursSinceLastJob = (Date.now() - worker.lastJobAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastJob < 1) score += 10;
      else if (hoursSinceLastJob < 24) score += 5;
    }

    return score;
  }

  // NOTE: Duplicate function removed - using the secure JWT version above

  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);

    console.log('🏥 Started worker health monitoring');
  }

  private async performHealthChecks(): Promise<void> {
    try {
      const workers = await workerStorage.getWorkers({ isOnline: true });
      
      for (const worker of workers) {
        // Check if worker hasn't pinged recently
        const lastPing = worker.lastPingAt?.getTime() || 0;
        const timeSinceLastPing = Date.now() - lastPing;
        
        // Mark as offline if no ping in 5 minutes
        if (timeSinceLastPing > 5 * 60 * 1000) {
          await workerStorage.updateWorker(worker.id, {
            isOnline: false,
            status: 'failed'
          });
          
          console.log(`⚠️ Worker ${worker.workerId} marked as offline due to no ping`);
        }
      }
    } catch (error) {
      console.error('Failed to perform health checks:', error);
    }
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export default WorkerManagementService;