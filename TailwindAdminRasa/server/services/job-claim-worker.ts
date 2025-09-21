import { Worker, Job } from 'bullmq';
import RedisService from './redis';
import { PostJobPayload } from './queue';
import { SUPPORTED_REGIONS, SUPPORTED_PLATFORMS } from './regions';

/**
 * BullMQ Worker-based Job Claiming Service
 * 
 * This service implements proper atomic job claiming using BullMQ's built-in Worker pattern.
 * It moves jobs to ACTIVE state, captures the real job.token, and stores claim metadata
 * for serverless workers to retrieve.
 * 
 * Architecture:
 * 1. BullMQ Worker claims jobs atomically (moves to ACTIVE)
 * 2. Captures real job.token from BullMQ for completion validation
 * 3. Stores claim metadata in Redis for serverless worker retrieval
 * 4. Jobs remain ACTIVE while being processed by serverless workers
 * 5. Completion/failure uses real job.token for BullMQ state management
 */
class JobClaimWorker {
  private static workers: Map<string, Worker> = new Map();
  private static claimedJobs: Map<string, ClaimedJobData> = new Map();
  private static redis: any = null;

  /**
   * Get Redis instance lazily (only when needed)
   */
  private static getRedis() {
    if (!this.redis) {
      if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_URL) {
        throw new Error('Redis configuration required for distributed job management. Use Simple Mode (Auto) for non-distributed operations.');
      }
      this.redis = RedisService.getInstance();
    }
    return this.redis;
  }

  /**
   * Start a claiming worker for a specific platform/region queue
   */
  static async startClaimWorker(platform: string, region: string): Promise<void> {
    const queueName = `posts:${platform}:${region}`;
    const workerKey = `claim-worker:${queueName}`;

    if (this.workers.has(workerKey)) {
      console.log(`📋 Claim worker for ${queueName} already running`);
      return;
    }

    const worker = new Worker(
      queueName,
      async (job: Job<PostJobPayload>) => {
        // This worker doesn't actually process jobs - it just claims them
        // The real processing happens in serverless functions
        console.log(`🔒 BullMQ Worker claimed job ${job.id} - holding ACTIVE state`);
        
        // Store claim metadata with real job.token
        const claimData: ClaimedJobData = {
          jobId: job.id!,
          queueName,
          platform,
          region,
          jobToken: job.token!, // Real BullMQ token for completion
          jobData: job.data,
          claimedAt: new Date().toISOString(),
          claimedBy: 'brain-worker',
          status: 'claimed-ready'
        };

        // Store in memory and Redis for retrieval
        this.claimedJobs.set(job.id!, claimData);
        await this.getRedis().setex(
          `claimed-job:${job.id}`,
          300, // 5 minute TTL
          JSON.stringify(claimData)
        );

        console.log(`📦 Job ${job.id} claim metadata stored for serverless retrieval`);

        // Return immediately - job stays ACTIVE for serverless processing
        return { claimed: true, claimedAt: claimData.claimedAt };
      },
      {
        connection: this.getRedis(),
        concurrency: 10, // Process up to 10 jobs concurrently
        autorun: true,   // Start processing immediately
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Handle worker events
    worker.on('completed', (job) => {
      console.log(`🔒 Job ${job.id} claimed and ready for serverless processing`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Failed to claim job ${job?.id}:`, err);
      if (job?.id) {
        this.claimedJobs.delete(job.id);
        this.getRedis().del(`claimed-job:${job.id}`);
      }
    });

    worker.on('error', (err) => {
      console.error(`❌ Claim worker error for ${queueName}:`, err);
    });

    this.workers.set(workerKey, worker);
    console.log(`🚀 Started claim worker for ${queueName}`);
  }

  /**
   * Stop a claiming worker for a specific platform/region
   */
  static async stopClaimWorker(platform: string, region: string): Promise<void> {
    const queueName = `posts:${platform}:${region}`;
    const workerKey = `claim-worker:${queueName}`;

    const worker = this.workers.get(workerKey);
    if (worker) {
      await worker.close();
      this.workers.delete(workerKey);
      console.log(`🛑 Stopped claim worker for ${queueName}`);
    }
  }

  /**
   * Get claimed jobs available for a specific worker
   */
  static async getClaimedJobsForWorker(
    workerId: string,
    platforms: string[],
    region: string,
    limit: number = 3
  ): Promise<ClaimedJobData[]> {
    const availableJobs: ClaimedJobData[] = [];

    // Check claimed jobs in memory first
    for (const [jobId, claimData] of Array.from(this.claimedJobs.entries())) {
      if (availableJobs.length >= limit) break;

      // Check if job is available for this worker
      if (platforms.includes(claimData.platform) && 
          claimData.region === region &&
          claimData.status === 'claimed-ready') {
        
        // Assign job to this worker
        claimData.assignedTo = workerId;
        claimData.assignedAt = new Date().toISOString();
        claimData.status = 'assigned';

        // Update in Redis
        await this.getRedis().setex(
          `claimed-job:${jobId}`,
          300,
          JSON.stringify(claimData)
        );

        availableJobs.push(claimData);
        console.log(`📋 Assigned claimed job ${jobId} to worker ${workerId}`);
      }
    }

    return availableJobs;
  }

  /**
   * Complete a job using real BullMQ token
   */
  static async completeJob(
    jobId: string,
    workerId: string,
    result: any,
    lockToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const claimData = this.claimedJobs.get(jobId);
      if (!claimData) {
        return { success: false, error: 'Job claim data not found' };
      }

      // Validate assignment
      if (claimData.assignedTo !== workerId) {
        return { success: false, error: 'Job not assigned to this worker' };
      }

      // Validate custom lock token (from serverless worker)
      if (lockToken !== `${jobId}-${workerId}-claimed`) {
        return { success: false, error: 'Invalid worker lock token' };
      }

      // Get the real BullMQ job to complete it properly
      const job = await this.getJobFromBullMQ(jobId, claimData.queueName);
      if (!job) {
        return { success: false, error: 'BullMQ job not found' };
      }

      // Use real BullMQ token for completion
      await job.moveToCompleted(result, claimData.jobToken);

      // Cleanup
      this.claimedJobs.delete(jobId);
      await this.getRedis().del(`claimed-job:${jobId}`);

      console.log(`✅ Job ${jobId} completed using real BullMQ token`);
      return { success: true };

    } catch (error) {
      console.error(`Failed to complete job ${jobId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fail a job using real BullMQ token
   */
  static async failJob(
    jobId: string,
    workerId: string,
    error: Error,
    lockToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const claimData = this.claimedJobs.get(jobId);
      if (!claimData) {
        return { success: false, error: 'Job claim data not found' };
      }

      // Validate assignment
      if (claimData.assignedTo !== workerId) {
        return { success: false, error: 'Job not assigned to this worker' };
      }

      // Validate custom lock token
      if (lockToken !== `${jobId}-${workerId}-claimed`) {
        return { success: false, error: 'Invalid worker lock token' };
      }

      // Get the real BullMQ job
      const job = await this.getJobFromBullMQ(jobId, claimData.queueName);
      if (!job) {
        return { success: false, error: 'BullMQ job not found' };
      }

      // Use real BullMQ token for failure
      await job.moveToFailed(error, claimData.jobToken);

      // Cleanup
      this.claimedJobs.delete(jobId);
      await this.getRedis().del(`claimed-job:${jobId}`);

      console.log(`❌ Job ${jobId} failed using real BullMQ token`);
      return { success: true };

    } catch (failError) {
      console.error(`Failed to fail job ${jobId}:`, failError);
      return { success: false, error: failError instanceof Error ? failError.message : 'Unknown error' };
    }
  }

  /**
   * Get BullMQ job instance for completion operations
   */
  private static async getJobFromBullMQ(jobId: string, queueName: string): Promise<Job | null> {
    try {
      // Import Queue dynamically to avoid circular dependencies
      const { Queue } = await import('bullmq');
      const queue = new Queue(queueName, { connection: this.getRedis() });
      const job = await queue.getJob(jobId);
      return job || null;
    } catch (error) {
      console.error(`Failed to get BullMQ job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Start all claim workers for active queues
   * Expanded to support global regions for new places
   */
  static async startAllClaimWorkers(): Promise<void> {
    const platforms = SUPPORTED_PLATFORMS;
    const regions = SUPPORTED_REGIONS;

    console.log('🚀 Starting BullMQ claim workers for all platform/region combinations...');
    console.log(`📍 Supporting ${regions.length} global regions for better coverage`);

    let workersStarted = 0;
    for (const platform of platforms) {
      for (const region of regions) {
        try {
          await this.startClaimWorker(platform, region);
          workersStarted++;
        } catch (error) {
          console.warn(`⚠️ Failed to start claim worker for ${platform}:${region}:`, error);
        }
      }
    }

    console.log(`✅ Started ${workersStarted}/${platforms.length * regions.length} claim workers across global regions`);
  }

  /**
   * Stop all claim workers
   */
  static async stopAllClaimWorkers(): Promise<void> {
    console.log('🛑 Stopping all claim workers...');

    for (const [workerKey, worker] of Array.from(this.workers.entries())) {
      await worker.close();
      console.log(`🛑 Stopped worker: ${workerKey}`);
    }

    this.workers.clear();
    this.claimedJobs.clear();
    console.log('✅ All claim workers stopped');
  }

  /**
   * Get statistics about claimed jobs
   */
  static getClaimStats(): ClaimStats {
    const stats: ClaimStats = {
      totalClaimed: this.claimedJobs.size,
      byStatus: { 'claimed-ready': 0, 'assigned': 0 },
      byPlatform: {},
      byRegion: {},
      activeWorkers: this.workers.size
    };

    for (const claimData of Array.from(this.claimedJobs.values())) {
      stats.byStatus[claimData.status]++;
      stats.byPlatform[claimData.platform] = (stats.byPlatform[claimData.platform] || 0) + 1;
      stats.byRegion[claimData.region] = (stats.byRegion[claimData.region] || 0) + 1;
    }

    return stats;
  }
}

// Interfaces
export interface ClaimedJobData {
  jobId: string;
  queueName: string;
  platform: string;
  region: string;
  jobToken: string; // Real BullMQ token for completion
  jobData: PostJobPayload;
  claimedAt: string;
  claimedBy: string;
  status: 'claimed-ready' | 'assigned';
  assignedTo?: string;
  assignedAt?: string;
}

export interface ClaimStats {
  totalClaimed: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  byRegion: Record<string, number>;
  activeWorkers: number;
}

export default JobClaimWorker;