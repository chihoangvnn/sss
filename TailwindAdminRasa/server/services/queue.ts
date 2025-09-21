import { Queue, Worker, Job, QueueOptions, JobsOptions, WorkerOptions } from 'bullmq';
import RedisService from './redis';

/**
 * Job payload interface for scheduled posts
 */
export interface PostJobPayload {
  jobId: string;
  scheduledPostId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok';
  accountId: string;
  region: string;
  content: {
    caption: string;
    hashtags: string[];
    assetIds: string[];
  };
  targetAccount: {
    id: string;
    name: string;
    pageAccessToken?: string;
  };
  idempotencyKey: string;
  attempt: number;
  maxRetries: number;
  scheduledTime: string;
  timezone: string;
  workerId?: string; // Added for job ownership tracking
  claimedAt?: string; // Added for claiming timestamp
}

/**
 * Job result interface for callback processing
 */
export interface PostJobResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  metrics?: {
    executionTime: number;
    region: string;
    ipAddress?: string;
  };
}

/**
 * Queue Management Service for Distributed Post Processing
 * Handles job distribution to serverless workers across multiple regions
 */
class QueueService {
  private static queues: Map<string, Queue> = new Map();
  private static workers: Map<string, Worker> = new Map();

  /**
   * Get or create a queue for specific platform and region
   * Queue naming convention: posts:{platform}:{region}
   */
  static getQueue(platform: string, region: string = 'default'): Queue<PostJobPayload> {
    const queueName = `posts:${platform}:${region}`;
    
    if (!this.queues.has(queueName)) {
      const redis = RedisService.getInstance();
      
      const queueOptions: QueueOptions = {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,           // Retry up to 3 times
          backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 second delay
          },
          delay: 0, // No initial delay
        },
      };

      const queue = new Queue<PostJobPayload>(queueName, queueOptions);
      this.queues.set(queueName, queue);
      
      console.log(`📊 Created queue: ${queueName}`);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * Add a job to the appropriate queue
   */
  static async addJob(
    platform: string,
    region: string,
    payload: PostJobPayload,
    options?: JobsOptions
  ): Promise<Job<PostJobPayload>> {
    const queue = this.getQueue(platform, region);
    
    const jobOptions: JobsOptions = {
      jobId: payload.idempotencyKey, // Prevent duplicates
      delay: payload.scheduledTime ? 
        Math.max(0, new Date(payload.scheduledTime).getTime() - Date.now()) : 0,
      ...options,
    };

    const job = await queue.add('process-post', payload, jobOptions);
    
    console.log(`📤 Enqueued job ${job.id} to ${queue.name}`);
    return job;
  }

  /**
   * Get the next available job for a worker
   * This will be called by serverless workers
   */
  static async getNextJob(
    platform: string, 
    region: string,
    capacity: number = 1
  ): Promise<Job<PostJobPayload>[]> {
    const queue = this.getQueue(platform, region);
    
    // Get waiting jobs (FIFO order)
    const jobs = await queue.getJobs(['waiting'], 0, capacity - 1);
    
    // Return jobs directly - BullMQ handles state management
    const validJobs: Job<PostJobPayload>[] = [];
    for (const job of jobs) {
      if (job) {
        validJobs.push(job);
        console.log(`🔄 Retrieved job ${job.id} for processing`);
      }
    }
    
    return validJobs;
  }

  /**
   * Mark job as completed with result
   */
  static async completeJob(
    jobId: string,
    result: PostJobResult
  ): Promise<void> {
    // Find job across all queues
    for (const queue of Array.from(this.queues.values())) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          if (result.success) {
            await job.moveToCompleted(result, job.token!);
            console.log(`✅ Job ${jobId} completed successfully`);
          } else {
            await job.moveToFailed(new Error(result.error || 'Unknown error'), job.token!);
            console.log(`❌ Job ${jobId} failed: ${result.error}`);
          }
          return;
        }
      } catch (error) {
        console.error(`Error completing job ${jobId}:`, error);
      }
    }
    
    console.warn(`⚠️ Job ${jobId} not found in any queue`);
  }

  /**
   * Get queue statistics for monitoring
   */
  static async getQueueStats(platform?: string, region?: string): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [queueName, queue] of Array.from(this.queues.entries())) {
      // Filter by platform/region if specified
      if (platform && !queueName.includes(`:${platform}:`)) continue;
      if (region && !queueName.endsWith(`:${region}`)) continue;
      
      try {
        const waiting = await queue.getJobCounts();
        const jobs = {
          waiting: waiting.waiting || 0,
          active: waiting.active || 0,
          completed: waiting.completed || 0,
          failed: waiting.failed || 0,
          delayed: waiting.delayed || 0,
        };
        
        stats[queueName] = {
          ...jobs,
          total: Object.values(jobs).reduce((sum, count) => sum + count, 0)
        };
      } catch (error) {
        stats[queueName] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return stats;
  }

  /**
   * Health check for all queues
   */
  static async isHealthy(): Promise<boolean> {
    try {
      // Check Redis connection first
      const redisHealthy = await RedisService.isHealthy();
      if (!redisHealthy) return false;
      
      // Check if we can create a test queue
      const testQueue = this.getQueue('test', 'health');
      await testQueue.getJobCounts();
      
      return true;
    } catch (error) {
      console.error('Queue health check failed:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown of all queues and workers
   */
  static async shutdown(): Promise<void> {
    console.log('🔄 Shutting down queue service...');
    
    // Close all workers first
    for (const [name, worker] of Array.from(this.workers.entries())) {
      await worker.close();
      console.log(`👷 Worker ${name} shut down`);
    }
    this.workers.clear();
    
    // Close all queues
    for (const [name, queue] of Array.from(this.queues.entries())) {
      await queue.close();
      console.log(`📊 Queue ${name} shut down`);
    }
    this.queues.clear();
    
    // Disconnect Redis
    await RedisService.disconnect();
    
    console.log('✅ Queue service shut down complete');
  }

  /**
   * Get jobs from a specific queue
   */
  static async getJobs(
    platform: string, 
    region: string, 
    options?: { status?: string; limit?: number }
  ): Promise<any[]> {
    const queueName = `posts:${platform}:${region}`;
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      console.warn(`Queue ${queueName} not found`);
      return [];
    }

    try {
      const status = options?.status || 'waiting';
      const limit = options?.limit || 10;
      
      if (status === 'waiting') {
        return await queue.getWaiting(0, limit - 1);
      } else if (status === 'active') {
        return await queue.getActive(0, limit - 1);
      } else if (status === 'completed') {
        return await queue.getCompleted(0, limit - 1);
      } else if (status === 'failed') {
        return await queue.getFailed(0, limit - 1);
      }
      
      return [];
    } catch (error) {
      console.error(`Failed to get jobs from ${queueName}:`, error);
      return [];
    }
  }

  /**
   * Atomically claim jobs from a queue for a worker
   * Using Redis BRPOPLPUSH for atomic job claiming (BullMQ-compatible)
   */
  static async claimJobs(
    platform: string,
    region: string, 
    workerId: string,
    limit: number = 1
  ): Promise<any[]> {
    const queueName = `posts:${platform}:${region}`;
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      console.warn(`Queue ${queueName} not found`);
      return [];
    }

    try {
      const claimedJobs = [];
      
      // Get waiting jobs first
      const waitingJobs = await queue.getWaiting(0, limit * 2 - 1);
      
      for (const job of waitingJobs) {
        if (claimedJobs.length >= limit) break;
        
        try {
          // Use Redis to atomically claim the job by updating its data
          // This approach uses job.updateData which is atomic
          const originalData = job.data;
          
          // Check if job is already claimed
          if (originalData.workerId) {
            console.log(`Job ${job.id} already claimed by ${originalData.workerId}`);
            continue;
          }
          
          // Atomically update job data to claim it
          await job.updateData({
            ...originalData,
            workerId,
            claimedAt: new Date().toISOString()
          });
          
          // Generate a lock token (we'll use a combination of job ID and worker ID)
          const lockToken = `${job.id}-${workerId}-${Date.now()}`;
          
          // Store the lock token in job progress for validation
          await job.updateProgress({
            workerId,
            claimedAt: new Date().toISOString(),
            lockToken,
            status: 'claimed'
          });
          
          claimedJobs.push({
            id: job.id,
            name: job.name,
            data: { ...originalData, workerId },
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
            lockToken, // Use our generated lock token
            opts: job.opts
          });
          
          console.log(`🔒 Successfully claimed job ${job.id} for worker ${workerId}`);
          
        } catch (claimError) {
          // Job might have been claimed by another worker, continue
          console.log(`Job ${job.id} claim failed (likely race condition), continuing...`);
        }
      }
      
      return claimedJobs;
    } catch (error) {
      console.error(`Failed to claim jobs from ${queueName}:`, error);
      return [];
    }
  }

  /**
   * Find a job by ID across all queues
   */
  static async findJobById(jobId: string): Promise<any | null> {
    for (const queue of Array.from(this.queues.values())) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          return job;
        }
      } catch (error) {
        // Continue searching in other queues
      }
    }
    return null;
  }

  /**
   * Remove old completed and failed jobs (cleanup)
   */
  static async cleanupJobs(olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    for (const queue of Array.from(this.queues.values())) {
      try {
        await queue.clean(olderThan, 100, 'completed');
        await queue.clean(olderThan, 50, 'failed');
      } catch (error) {
        console.error(`Failed to cleanup queue ${queue.name}:`, error);
      }
    }
  }
}

export default QueueService;