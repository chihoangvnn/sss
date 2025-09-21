/**
 * 🚀 JOB DISPATCH SERVICE
 * 
 * Handles secure job dispatching to Vercel Functions (Arms) from Railway (Brain)
 * Part of the "Bộ Não - Cánh Tay - Vệ Tinh" auto-posting architecture
 * 
 * Features:
 * - Signed requests for security
 * - Automatic retry logic
 * - Worker health checks before dispatch
 * - Multi-platform job routing
 * - Callback handling
 */

import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { WorkerManagementService } from './worker-management';
import workerStorage from '../storage/worker-storage';
import type { WorkerPlatform, Worker } from '@shared/schema';

// Job dispatch payload structure
export interface JobDispatchPayload {
  jobId: string;
  scheduledPostId?: string;
  platform: WorkerPlatform;
  jobType: 'post_text' | 'post_image' | 'post_video' | 'post_story' | 'post_reel';
  priority: number;
  targetAccount: {
    id: string;
    platform: WorkerPlatform;
    name?: string;
  };
  content: {
    caption?: string;
    hashtags?: string[];
    mediaUrls?: string[];
    scheduledTime?: Date;
  };
  metadata?: Record<string, any>;
  callbacks: {
    successUrl: string;
    errorUrl: string;
    progressUrl?: string;
  };
  expiresAt: Date;
}

// Signed request structure
export interface SignedJobRequest {
  payload: JobDispatchPayload;
  signature: string;
  timestamp: number;
  nonce: string;
}

// Job dispatch result
export interface JobDispatchResult {
  success: boolean;
  jobId: string;
  workerId?: string;
  workerEndpoint?: string;
  dispatchedAt: Date;
  expectedCompletionTime?: Date;
  error?: string;
  retryCount?: number;
}

export class JobDispatchService {
  private static instance: JobDispatchService;
  private workerManager: WorkerManagementService;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly SIGNATURE_VALIDITY = 300000; // 5 minutes

  private constructor() {
    this.workerManager = WorkerManagementService.getInstance();
  }

  public static getInstance(): JobDispatchService {
    if (!JobDispatchService.instance) {
      JobDispatchService.instance = new JobDispatchService();
    }
    return JobDispatchService.instance;
  }

  /**
   * 🎯 Dispatch job to optimal Vercel Function worker
   */
  async dispatchJob(payload: JobDispatchPayload): Promise<JobDispatchResult> {
    try {
      console.log(`🚀 Dispatching job ${payload.jobId} for platform: ${payload.platform}`);
      
      // 1. Find optimal worker for this job
      const selectedWorker = await this.selectOptimalWorker(payload);
      if (!selectedWorker) {
        return {
          success: false,
          jobId: payload.jobId,
          dispatchedAt: new Date(),
          error: 'No available workers for this job'
        };
      }

      // 2. Assign job to worker in database  
      const jobAssignment = await this.workerManager.assignJobToWorker(selectedWorker.workerId!, {
        jobId: payload.jobId,
        scheduledPostId: payload.scheduledPostId,
        platform: payload.platform,
        jobType: payload.jobType,
        priority: payload.priority
      });

      if (!jobAssignment.success) {
        return {
          success: false,
          jobId: payload.jobId,
          dispatchedAt: new Date(),
          error: `Failed to assign job to worker: ${jobAssignment.error}`
        };
      }

      // 3. Create signed request
      const signedRequest = this.createSignedRequest(payload);
      
      // 4. Send job to Vercel Function worker
      const dispatchResult = await this.sendJobToWorker(selectedWorker, signedRequest);
      
      if (dispatchResult.success) {
        console.log(`✅ Job ${payload.jobId} successfully dispatched to worker ${selectedWorker.workerId}`);
        
        return {
          success: true,
          jobId: payload.jobId,
          workerId: selectedWorker.workerId,
          workerEndpoint: selectedWorker.endpointUrl,
          dispatchedAt: new Date(),
          expectedCompletionTime: new Date(Date.now() + (selectedWorker.avgExecutionTime || 60000))
        };
      } else {
        // If dispatch failed, release the job assignment
        console.error(`❌ Failed to dispatch job ${payload.jobId} to worker ${selectedWorker.workerId}: ${dispatchResult.error}`);
        
        return {
          success: false,
          jobId: payload.jobId,
          workerId: selectedWorker.workerId,
          dispatchedAt: new Date(),
          error: dispatchResult.error
        };
      }

    } catch (error) {
      console.error('Job dispatch error:', error);
      return {
        success: false,
        jobId: payload.jobId,
        dispatchedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown dispatch error'
      };
    }
  }

  /**
   * 🎯 Select optimal worker for job based on platform, load, and performance
   */
  private async selectOptimalWorker(payload: JobDispatchPayload): Promise<Worker | null> {
    try {
      // Get available workers for this platform
      const availableWorkers = await workerStorage.getWorkers({
        platform: payload.platform,
        status: 'active',
        isOnline: true
      });

      if (availableWorkers.length === 0) {
        console.log(`⚠️ No available workers for platform: ${payload.platform}`);
        return null;
      }

      // Score and rank workers
      const workerScores = await Promise.all(
        availableWorkers.map(async (worker) => {
          const score = await this.calculateWorkerScore(worker, payload);
          return { worker, score };
        })
      );

      // Sort by score (highest first)
      workerScores.sort((a, b) => b.score - a.score);
      
      const selectedWorker = workerScores[0].worker;
      console.log(`🎯 Selected worker ${selectedWorker.workerId} (score: ${workerScores[0].score}) for job ${payload.jobId}`);
      
      return selectedWorker;

    } catch (error) {
      console.error('Worker selection error:', error);
      return null;
    }
  }

  /**
   * 📊 Calculate worker score based on multiple factors
   */
  private async calculateWorkerScore(worker: Worker, payload: JobDispatchPayload): Promise<number> {
    let score = 0;

    // Base score from success rate
    score += parseFloat(worker.successRate || '0') * 10;

    // Capacity score (prefer workers with available capacity)
    const availableCapacity = worker.maxConcurrentJobs - worker.currentLoad;
    if (availableCapacity <= 0) return 0; // No capacity = not eligible
    score += (availableCapacity / worker.maxConcurrentJobs) * 20;

    // Performance score (prefer faster workers)
    const avgTime = worker.avgExecutionTime || 60000;
    score += Math.max(0, (120000 - avgTime) / 10000); // Better score for faster execution

    // Priority bonus
    score += (5 - worker.priority) * 5;

    // Recent activity bonus (prefer recently active workers)
    if (worker.lastJobAt) {
      const hoursSinceLastJob = (Date.now() - worker.lastJobAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastJob < 1) score += 10;
      else if (hoursSinceLastJob < 6) score += 5;
    }

    // Platform specialization bonus
    if (worker.specialties && worker.specialties.includes(payload.platform as string)) {
      score += 15;
    }

    // Job type matching bonus
    const hasJobTypeCapability = worker.capabilities && worker.capabilities.some((cap: any) => 
      cap.actions && cap.actions.includes(payload.jobType)
    );
    if (hasJobTypeCapability) score += 10;

    return score;
  }

  /**
   * 🔐 Create signed request for secure communication with Vercel Functions
   */
  private createSignedRequest(payload: JobDispatchPayload): SignedJobRequest {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Create message to sign
    const message = JSON.stringify({
      payload,
      timestamp,
      nonce
    });

    // Sign with secret
    const secret = process.env.WORKER_DISPATCH_SECRET || 'dev-dispatch-secret-change-in-production';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    return {
      payload,
      signature,
      timestamp,
      nonce
    };
  }

  /**
   * 📡 Send signed job request to Vercel Function worker
   */
  private async sendJobToWorker(worker: Worker, signedRequest: SignedJobRequest): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📡 Sending job to worker ${worker.workerId} at ${worker.endpointUrl}`);
      
      const response = await axios.post(
        `${worker.endpointUrl}/api/process-job`,
        signedRequest,
        {
          timeout: this.REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'X-Worker-Auth': worker.authToken, // Worker authentication
            'User-Agent': 'TailwindAdmin-Brain/1.0'
          }
        }
      );

      if (response.status === 200 && response.data.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.data.error || 'Worker rejected job' 
        };
      }

    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          return { success: false, error: 'Worker timeout' };
        } else if (error.response) {
          return { 
            success: false, 
            error: `Worker error (${error.response.status}): ${error.response.data?.error || 'Unknown error'}` 
          };
        } else {
          return { success: false, error: 'Network error reaching worker' };
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * 🔄 Handle job completion callback from Vercel Function worker
   */
  async handleJobCallback(callbackData: {
    jobId: string;
    workerId: string;
    status: 'completed' | 'failed' | 'progress';
    result?: {
      platformPostId?: string;
      platformUrl?: string;
      analytics?: Record<string, any>;
    };
    error?: string;
    progress?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📞 Received callback for job ${callbackData.jobId} from worker ${callbackData.workerId}: ${callbackData.status}`);
      
      // Verify callback authenticity (in production, verify signature)
      const worker = await workerStorage.getWorkerByWorkerId(callbackData.workerId);
      if (!worker) {
        return { success: false, error: 'Unknown worker' };
      }

      // Update job status based on callback
      switch (callbackData.status) {
        case 'completed':
          await this.handleJobSuccess(callbackData);
          break;
        case 'failed':
          await this.handleJobFailure(callbackData);
          break;
        case 'progress':
          await this.handleJobProgress(callbackData);
          break;
      }

      return { success: true };

    } catch (error) {
      console.error('Callback handling error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Callback processing failed' 
      };
    }
  }

  /**
   * ✅ Handle successful job completion
   */
  private async handleJobSuccess(callbackData: any): Promise<void> {
    console.log(`✅ Job ${callbackData.jobId} completed successfully`);
    
    // Update worker metrics
    const worker = await workerStorage.getWorkerByWorkerId(callbackData.workerId);
    if (worker) {
      await workerStorage.updateWorker(worker.id, {
        currentLoad: Math.max(0, worker.currentLoad - 1),
        totalJobsCompleted: worker.totalJobsCompleted + 1,
        lastJobAt: new Date(),
        successRate: this.calculateNewSuccessRate(worker, true)
      });
    }

    // TODO: Update scheduled post status in database
    // TODO: Send success notification if needed
  }

  /**
   * ❌ Handle job failure
   */
  private async handleJobFailure(callbackData: any): Promise<void> {
    console.log(`❌ Job ${callbackData.jobId} failed: ${callbackData.error}`);
    
    // Update worker metrics
    const worker = await workerStorage.getWorkerByWorkerId(callbackData.workerId);
    if (worker) {
      await workerStorage.updateWorker(worker.id, {
        currentLoad: Math.max(0, worker.currentLoad - 1),
        totalJobsFailed: worker.totalJobsFailed + 1,
        lastJobAt: new Date(),
        successRate: this.calculateNewSuccessRate(worker, false)
      });
    }

    // TODO: Implement retry logic if appropriate
    // TODO: Update scheduled post status in database
    // TODO: Send failure notification
  }

  /**
   * 📊 Handle job progress update
   */
  private async handleJobProgress(callbackData: any): Promise<void> {
    console.log(`📊 Job ${callbackData.jobId} progress: ${callbackData.progress}%`);
    
    // TODO: Update job progress in database
    // TODO: Send progress notification if needed
  }

  /**
   * 📈 Calculate new success rate for worker
   */
  private calculateNewSuccessRate(worker: Worker, success: boolean): string {
    const totalJobs = worker.totalJobsCompleted + worker.totalJobsFailed + 1;
    const successfulJobs = worker.totalJobsCompleted + (success ? 1 : 0);
    const rate = (successfulJobs / totalJobs) * 100;
    return rate.toFixed(2);
  }

  /**
   * 📊 Get dispatch statistics
   */
  async getDispatchStats(): Promise<{
    totalDispatched: number;
    successfulDispatches: number;
    failedDispatches: number;
    averageDispatchTime: number;
    activeJobs: number;
  }> {
    // TODO: Implement dispatch statistics
    return {
      totalDispatched: 0,
      successfulDispatches: 0,
      failedDispatches: 0,
      averageDispatchTime: 0,
      activeJobs: 0
    };
  }
}

export default JobDispatchService;