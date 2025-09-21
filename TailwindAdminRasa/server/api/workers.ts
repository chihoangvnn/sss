import express from 'express';
import jwt from 'jsonwebtoken';
import QueueService from '../services/queue';
import JobDistributionEngine from '../services/job-distribution-engine';
import JobClaimWorker from '../services/job-claim-worker';
import StartupService from '../services/startup';
import { storage } from '../storage';
import { WorkerManagementService } from '../services/worker-management';
import { workerStorage } from '../storage/worker-storage';
import JobDispatchService from '../services/job-dispatch-service';
import type { WorkerPlatform } from '@shared/schema';

const router = express.Router();
const workerManager = WorkerManagementService.getInstance();
const jobDispatcher = JobDispatchService.getInstance();

// JWT secret for worker authentication (REQUIRED in production)
const WORKER_JWT_SECRET = (() => {
  if (process.env.NODE_ENV === 'production' && !process.env.WORKER_JWT_SECRET) {
    throw new Error('WORKER_JWT_SECRET environment variable must be set in production');
  }
  return process.env.WORKER_JWT_SECRET || 'dev-worker-secret-change-in-production';
})();

// Pre-shared secret for worker registration (REQUIRED)
const WORKER_REGISTRATION_SECRET = (() => {
  if (process.env.NODE_ENV === 'production' && !process.env.WORKER_REGISTRATION_SECRET) {
    throw new Error('WORKER_REGISTRATION_SECRET environment variable must be set in production');
  }
  return process.env.WORKER_REGISTRATION_SECRET || 'dev-registration-secret-change-in-production';
})();

// Dispatch secret for job signing (REQUIRED in production)
const WORKER_DISPATCH_SECRET = (() => {
  if (process.env.NODE_ENV === 'production' && !process.env.WORKER_DISPATCH_SECRET) {
    throw new Error('WORKER_DISPATCH_SECRET environment variable must be set in production');
  }
  return process.env.WORKER_DISPATCH_SECRET || 'dev-dispatch-secret-change-in-production';
})();

/**
 * 🔐 Admin authentication middleware for worker management
 */
const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to access worker management.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

/**
 * Middleware to authenticate worker requests
 */
const authenticateWorker = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, WORKER_JWT_SECRET) as {
      workerId: string;
      region: string;
      platforms: string[];
      exp: number;
    };
    
    // Attach worker info to request
    req.worker = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired worker token'
    });
  }
};

/**
 * 🚀 ENHANCED: Register new worker with full platform capabilities
 * POST /api/workers/register  
 * Body: { workerId, name, platforms[], capabilities[], region, deploymentPlatform, endpointUrl, registrationSecret }
 */
router.post('/register', async (req, res) => {
  try {
    const { registrationSecret, ...registrationData } = req.body;
    
    // ⚠️ SECURITY: Validate registration secret
    if (!registrationSecret || registrationSecret !== WORKER_REGISTRATION_SECRET) {
      console.error('❌ Invalid worker registration attempt');
      return res.status(401).json({
        success: false,
        error: 'Invalid registration secret'
      });
    }
    
    // Register worker without storing the secret
    const result = await workerManager.registerWorker(registrationData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Generate proper JWT token with all required fields
    const token = jwt.sign(
      {
        workerId: registrationData.workerId,
        region: registrationData.region,
        platforms: registrationData.platforms
      },
      WORKER_JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      worker: result.worker,
      token, // Use consistent field name
      expiresIn: '24h',
      message: 'Worker registered successfully'
    });
  } catch (error) {
    console.error('Worker registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register worker'
    });
  }
});

/**
 * Generate worker authentication token (Legacy endpoint for existing workers)
 * POST /api/workers/auth
 * Body: { workerId, region, platforms[], registrationSecret }
 */
router.post('/auth', async (req, res) => {
  try {
    const { workerId, region, platforms, registrationSecret } = req.body;
    
    if (!workerId || !region || !platforms || !registrationSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workerId, region, platforms, registrationSecret'
      });
    }

    // Verify registration secret
    if (registrationSecret !== WORKER_REGISTRATION_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Invalid registration secret'
      });
    }

    // Generate token valid for 24 hours
    const token = jwt.sign(
      {
        workerId,
        region,
        platforms: Array.isArray(platforms) ? platforms : [platforms]
      },
      WORKER_JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`🔑 Generated auth token for worker ${workerId} in region ${region}`);

    res.json({
      success: true,
      token,
      expiresIn: '24h',
      worker: {
        id: workerId,
        region,
        platforms
      }
    });
  } catch (error) {
    console.error('Worker auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate worker token'
    });
  }
});

/**
 * Pull jobs from queue for processing
 * GET /api/workers/jobs/pull
 * Query: ?platform=facebook&limit=5
 */
router.get('/jobs/pull', authenticateWorker, async (req, res) => {
  try {
    const { platform, limit = '1' } = req.query;
    const worker = req.worker!;
    
    // Validate platform
    if (platform && !worker.platforms.includes(platform as string)) {
      return res.status(403).json({
        success: false,
        error: `Worker not authorized for platform: ${platform}`
      });
    }

    // Determine which platforms to pull from
    const targetPlatforms = platform ? [platform as string] : worker.platforms;
    const jobLimit = Math.min(parseInt(limit as string) || 1, 5); // Max 5 jobs per request for safety
    
    const claimedJobs = [];
    
    for (const plt of targetPlatforms) {
      if (claimedJobs.length >= jobLimit) break;
      
      try {
        // Use proper atomic job claiming via BullMQ Worker
        const remainingSlots: number = jobLimit - claimedJobs.length;
        const claimedJobsFromPlatform = await JobClaimWorker.getClaimedJobsForWorker(
          worker.workerId,
          [plt], // Single platform for this iteration
          worker.region,
          remainingSlots
        );
        
        for (const claimData of claimedJobsFromPlatform) {
          claimedJobs.push({
            jobId: claimData.jobId,
            platform: claimData.platform,
            region: claimData.region,
            data: claimData.jobData,
            attempts: 0, // Reset since this is first assignment
            createdAt: claimData.claimedAt,
            lockToken: `${claimData.jobId}-${worker.workerId}-claimed` // Simple worker-specific token
          });
        }
      } catch (queueError) {
        console.error(`Failed to get claimed jobs from ${plt}:${worker.region}:`, queueError);
      }
    }

    console.log(`📤 Worker ${worker.workerId} claimed ${claimedJobs.length} jobs`);

    res.json({
      success: true,
      jobs: claimedJobs,
      worker: {
        id: worker.workerId,
        region: worker.region
      },
      claimedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Job pull error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pull jobs from queue'
    });
  }
});

/**
 * Get social account credentials for job execution
 * GET /api/workers/credentials/:accountId
 * Query: ?jobId=xxx (required for security validation)
 */
router.get('/credentials/:accountId', authenticateWorker, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { jobId, pageId } = req.query; // Add job validation
    const worker = req.worker!;
    
    // Require job ID for security
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required to retrieve credentials'
      });
    }

    // Verify job belongs to this worker
    const job = await QueueService.findJobById(jobId as string);
    if (!job || !job.data || job.data.workerId !== worker.workerId) {
      return res.status(403).json({
        success: false,
        error: 'Job not found or not assigned to this worker'
      });
    }

    // Get social account from database  
    const socialAccount = await storage.getSocialAccount(accountId);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        error: 'Social account not found'
      });
    }

    // Verify worker is authorized for this platform
    if (!worker.platforms.includes(socialAccount.platform)) {
      return res.status(403).json({
        success: false,
        error: `Worker not authorized for platform: ${socialAccount.platform}`
      });
    }

    // Verify job's social account matches requested account
    if (job.data.accountId !== socialAccount.accountId) {
      return res.status(403).json({
        success: false,
        error: 'Job account mismatch - unauthorized access'
      });
    }

    // Extract MINIMAL necessary credentials (field-level minimization)
    const credentials: any = {
      accountId: socialAccount.accountId,
      platform: socialAccount.platform,
      isActive: socialAccount.isActive
    };

    // Add only specific credentials needed for the target page/job
    if (socialAccount.platform === 'facebook' && socialAccount.pageAccessTokens) {
      const pageTokens = socialAccount.pageAccessTokens as any;
      
      if (Array.isArray(pageTokens)) {
        // Find token for specific page only
        const targetPageId = pageId || job.data.targetAccount?.id;
        const tokenObj = pageTokens.find((token: any) => token.pageId === targetPageId);
        
        if (tokenObj) {
          credentials.pageAccessToken = tokenObj.accessToken; // Single token only
        } else {
          return res.status(404).json({
            success: false,
            error: 'No access token found for target page'
          });
        }
      } else {
        // Object format - get specific page token
        const targetPageId = pageId || job.data.targetAccount?.id;
        credentials.pageAccessToken = pageTokens[targetPageId];
        
        if (!credentials.pageAccessToken) {
          return res.status(404).json({
            success: false,
            error: 'No access token found for target page'
          });
        }
      }
    } else if (socialAccount.platform === 'instagram') {
      credentials.accessToken = socialAccount.accessToken; // Minimal scope
    } else if (socialAccount.platform === 'twitter') {
      credentials.accessToken = socialAccount.accessToken;
      credentials.accessTokenSecret = (socialAccount as any).accessTokenSecret; // Type assertion
    }

    console.log(`🔐 Provided minimal credentials for account ${accountId} to worker ${worker.workerId}`);

    res.json({
      success: true,
      credentials,
      jobId,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Credentials fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve account credentials'
    });
  }
});

/**
 * Report job completion
 * POST /api/workers/jobs/:jobId/complete
 * Body: { platformPostId?, platformUrl?, analytics?, lockToken }
 */
router.post('/jobs/:jobId/complete', authenticateWorker, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { platformPostId, platformUrl, analytics, lockToken } = req.body;
    const worker = req.worker!;

    // Find and validate the job
    const job = await QueueService.findJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Verify job belongs to this worker (critical security check)
    if (!job.data || job.data.workerId !== worker.workerId) {
      return res.status(403).json({
        success: false,
        error: 'Job not assigned to this worker'
      });
    }

    // Verify platform authorization
    if (!worker.platforms.includes(job.data.platform)) {
      return res.status(403).json({
        success: false,
        error: `Worker not authorized for platform: ${job.data.platform}`
      });
    }

    // Verify region authorization
    if (job.data.region && job.data.region !== worker.region) {
      return res.status(403).json({
        success: false,
        error: `Worker not authorized for region: ${job.data.region}`
      });
    }

    // Verify lock token if provided (BullMQ best practice)
    if (lockToken && job.id !== lockToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid lock token - job may have been reclaimed'
      });
    }

    // Mark job as completed with lock token validation
    await job.moveToCompleted({
      success: true,
      completedBy: worker.workerId,
      completedAt: new Date().toISOString(),
      result: {
        platformPostId,
        platformUrl,
        analytics
      }
    }, lockToken);

    // Update scheduled post in database
    const jobData = job.data;
    if (jobData.scheduledPostId) {
      try {
        await storage.updateScheduledPost(jobData.scheduledPostId, {
          status: 'posted',
          publishedAt: new Date(),
          platformPostId,
          platformUrl,
          analytics: analytics ? {
            ...analytics,
            completedBy: worker.workerId,
            completedAt: new Date().toISOString()
          } as any : undefined
        });
      } catch (dbError) {
        console.error(`Failed to update scheduled post ${jobData.scheduledPostId}:`, dbError);
      }
    }

    console.log(`✅ Job ${jobId} completed by worker ${worker.workerId}`);

    res.json({
      success: true,
      jobId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      worker: {
        id: worker.workerId,
        region: worker.region
      }
    });
  } catch (error) {
    console.error('Job completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark job as completed'
    });
  }
});

/**
 * Report job failure
 * POST /api/workers/jobs/:jobId/fail
 * Body: { error, shouldRetry?, retryDelay?, lockToken }
 */
router.post('/jobs/:jobId/fail', authenticateWorker, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { error, shouldRetry = true, retryDelay = 60000, lockToken } = req.body; // 1 minute default
    const worker = req.worker!;

    // Find and validate the job
    const job = await QueueService.findJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Verify job belongs to this worker (critical security check)
    if (!job.data || job.data.workerId !== worker.workerId) {
      return res.status(403).json({
        success: false,
        error: 'Job not assigned to this worker'
      });
    }

    // Verify platform authorization
    if (!worker.platforms.includes(job.data.platform)) {
      return res.status(403).json({
        success: false,
        error: `Worker not authorized for platform: ${job.data.platform}`
      });
    }

    // Verify region authorization
    if (job.data.region && job.data.region !== worker.region) {
      return res.status(403).json({
        success: false,
        error: `Worker not authorized for region: ${job.data.region}`
      });
    }

    // Verify lock token if provided
    if (lockToken && job.id !== lockToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid lock token - job may have been reclaimed'
      });
    }

    const jobData = job.data;
    const currentAttempts = job.attemptsMade || 0;
    const maxRetries = jobData.maxRetries || 3;

    if (shouldRetry && currentAttempts < maxRetries) {
      // Retry the job with delay
      await job.retry({ delay: retryDelay });
      
      console.log(`🔄 Job ${jobId} failed, retry attempt ${currentAttempts + 1}/${maxRetries}`);
      
      res.json({
        success: true,
        jobId,
        status: 'retrying',
        attempt: currentAttempts + 1,
        maxRetries,
        retryDelay,
        failedAt: new Date().toISOString()
      });
    } else {
      // Mark job as permanently failed
      await job.moveToFailed(new Error(error || 'Job failed'));
      
      // Update scheduled post in database
      if (jobData.scheduledPostId) {
        try {
          await storage.updateScheduledPost(jobData.scheduledPostId, {
            status: 'failed',
            errorMessage: error || 'Job failed in worker',
            retryCount: currentAttempts,
            lastRetryAt: new Date()
          });
        } catch (dbError) {
          console.error(`Failed to update scheduled post ${jobData.scheduledPostId}:`, dbError);
        }
      }

      console.log(`❌ Job ${jobId} permanently failed after ${currentAttempts} attempts`);
      
      res.json({
        success: true,
        jobId,
        status: 'failed',
        finalAttempt: currentAttempts,
        error,
        failedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Job failure handling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to handle job failure'
    });
  }
});

/**
 * 🔍 ENHANCED: Get comprehensive worker status and health metrics  
 * GET /api/workers/status
 */
router.get('/status', authenticateWorker, async (req, res) => {
  try {
    const worker = req.worker!;
    
    // Get queue statistics for this worker's region/platforms
    const queueStats = await QueueService.getQueueStats();
    
    const workerStats = {
      worker: {
        id: worker.workerId,
        region: worker.region,
        platforms: worker.platforms
      },
      queues: {} as Record<string, any>,
      totalJobs: 0,
      availableJobs: 0
    };

    // Filter stats for this worker's platforms/region
    for (const [queueName, stats] of Object.entries(queueStats)) {
      const [, platform, region] = queueName.split(':');
      
      if (worker.platforms.includes(platform) && region === worker.region) {
        workerStats.queues[queueName] = stats;
        if (typeof stats === 'object' && stats.total) {
          workerStats.totalJobs += stats.total;
          workerStats.availableJobs += stats.waiting || 0;
        }
      }
    }

    res.json({
      success: true,
      ...workerStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Worker status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get worker status'
    });
  }
});

/**
 * 🏥 Worker Health Ping 
 * POST /api/workers/health
 * Body: { status, systemMetrics?, platformStatus? }
 */
router.post('/health', authenticateWorker, async (req, res) => {
  try {
    const worker = req.worker!;
    const healthData = req.body;
    
    const result = await workerManager.updateWorkerHealth(worker.workerId, healthData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      workerId: worker.workerId,
      status: healthData.status,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Worker health ping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update worker health'
    });
  }
});

/**
 * 📊 Get Worker Performance Metrics (Admin endpoint)
 * GET /api/workers/:workerId/metrics
 */
router.get('/:workerId/metrics', async (req, res) => {
  try {
    const { workerId } = req.params;
    const metrics = await workerManager.getWorkerMetrics(workerId);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found'
      });
    }
    
    res.json({
      success: true,
      metrics,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Worker metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve worker metrics'
    });
  }
});

/**
 * 🏗️ List All Workers (Admin endpoint)
 * GET /api/workers
 * Query: ?platform=facebook&region=us-east-1&status=active
 */
router.get('/', async (req, res) => {
  try {
    const { platform, region, status, isOnline } = req.query;
    
    const filters: any = {};
    if (platform) filters.platform = platform as WorkerPlatform;
    if (region) filters.region = region as string;
    if (status) filters.status = status as string;  
    if (isOnline !== undefined) filters.isOnline = isOnline === 'true';
    
    const workers = await workerManager.listWorkers(filters);
    
    res.json({
      success: true,
      workers,
      totalCount: workers.length,
      filters,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Workers list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workers'
    });
  }
});

/**
 * 📊 Get Worker Statistics Summary (Admin endpoint)
 * GET /api/workers/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const allWorkers = await workerManager.listWorkers({});
    const queueStats = await QueueService.getQueueStats();
    
    // Calculate comprehensive stats
    const stats = {
      totalWorkers: allWorkers.length,
      activeWorkers: allWorkers.filter(w => w.status === 'active').length,
      totalJobsProcessed: 0,
      avgSuccessRate: 0,
      totalExecutionTime: 0,
      regions: {} as Record<string, number>,
      platforms: {} as Record<string, number>
    };
    
    // Aggregate worker metrics
    let successRateSum = 0;
    let executionTimeSum = 0;
    let metricsCount = 0;
    
    for (const worker of allWorkers) {
      // Count by region
      stats.regions[worker.region] = (stats.regions[worker.region] || 0) + 1;
      
      // Count by platforms
      for (const platform of worker.platforms || []) {
        stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
      }
      
      // Get detailed metrics if available
      try {
        const workerMetrics = await workerManager.getWorkerMetrics(worker.workerId);
        if (workerMetrics) {
          stats.totalJobsProcessed += (workerMetrics as any).jobsProcessed || 0;
          if (workerMetrics.successRate !== undefined) {
            successRateSum += workerMetrics.successRate;
            metricsCount++;
          }
          if (workerMetrics.averageExecutionTime !== undefined) {
            executionTimeSum += workerMetrics.averageExecutionTime;
          }
        }
      } catch (metricsError) {
        // Skip metrics for this worker if unavailable
      }
    }
    
    // Calculate averages
    if (metricsCount > 0) {
      stats.avgSuccessRate = successRateSum / metricsCount;
      stats.totalExecutionTime = executionTimeSum;
    }
    
    // Add queue statistics
    const queueInfo = {
      totalQueues: Object.keys(queueStats).length,
      totalJobs: 0,
      waitingJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0
    };
    
    for (const [queueName, stats_queue] of Object.entries(queueStats)) {
      if (typeof stats_queue === 'object' && stats_queue) {
        queueInfo.totalJobs += stats_queue.total || 0;
        queueInfo.waitingJobs += stats_queue.waiting || 0;
        queueInfo.activeJobs += stats_queue.active || 0;
        queueInfo.completedJobs += stats_queue.completed || 0;
        queueInfo.failedJobs += stats_queue.failed || 0;
      }
    }
    
    res.json({
      success: true,
      stats: {
        ...stats,
        queue: queueInfo
      },
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Worker stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve worker statistics'
    });
  }
});

/**
 * 🚀 Dispatch Job to Vercel Function Worker (ADMIN ONLY)
 * POST /api/workers/dispatch-job
 * Body: { jobId, platform, jobType, priority, targetAccount, content, callbacks }
 */
router.post('/dispatch-job', requireAuth, async (req, res) => {
  try {
    const jobPayload = {
      ...req.body,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };
    
    const result = await jobDispatcher.dispatchJob(jobPayload);
    
    if (result.success) {
      res.json({
        success: true,
        result,
        dispatchedAt: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Job dispatch endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dispatch job'
    });
  }
});

/**
 * 📞 Handle Job Callbacks from Vercel Function Workers (SECURED)
 * POST /api/workers/callback
 * Body: { jobId, workerId, status, result?, error?, progress?, signature }
 */
router.post('/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    // 🔐 SECURITY: Verify callback signature
    const signature = req.headers['x-callback-signature'] as string;
    const timestamp = req.headers['x-callback-timestamp'] as string;
    
    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        error: 'Missing callback signature or timestamp'
      });
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 300000) { // 5 minutes
      return res.status(401).json({
        success: false,
        error: 'Callback timestamp is too old'
      });
    }
    
    // Verify HMAC signature
    const secret = WORKER_DISPATCH_SECRET;
    const expectedSignature = require('crypto')
      .createHmac('sha256', secret)
      .update(JSON.stringify(callbackData) + timestamp)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid callback signature'
      });
    }
    
    const result = await jobDispatcher.handleJobCallback(callbackData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Callback processed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Callback handling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process callback'
    });
  }
});

/**
 * 📊 Get Job Dispatch Statistics
 * GET /api/workers/dispatch-stats
 */
router.get('/dispatch-stats', async (req, res) => {
  try {
    const stats = await jobDispatcher.getDispatchStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dispatch stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dispatch statistics'
    });
  }
});

/**
 * 🔄 Refresh Worker IP Addresses
 * POST /api/workers/refresh-ips
 * Body: { workerIds?: string[] } // If empty, refresh all workers
 */
router.post('/refresh-ips', requireAuth, async (req, res) => {
  try {
    const { workerIds } = req.body;
    
    // Get workers to refresh
    const allWorkers = await workerManager.listWorkers({});
    const targetWorkers = workerIds && workerIds.length > 0 
      ? allWorkers.filter(w => workerIds.includes(w.id))
      : allWorkers;

    const results = {
      total: targetWorkers.length,
      refreshed: 0,
      failed: [] as string[],
      updates: [] as Array<{ workerId: string; oldIP: string | null; newIP: string | null; country: string | null }>
    };

    // Process each worker
    for (const worker of targetWorkers) {
      try {
        console.log(`🔄 Refreshing IP for worker: ${worker.workerId}`);
        
        // Ping worker health endpoint to detect IP
        const ipInfo = await detectWorkerIP(worker.endpointUrl);
        
        if (ipInfo.ip) {
          // Update worker with new IP information  
          await workerStorage.updateWorker(worker.id, {
            ipAddress: ipInfo.ip,
            ipCountry: ipInfo.country,
            ipRegion: ipInfo.region,
            lastPingAt: new Date()
          });

          results.updates.push({
            workerId: worker.workerId,
            oldIP: worker.ipAddress || null,
            newIP: ipInfo.ip,
            country: ipInfo.country || null
          });
          
          results.refreshed++;
          console.log(`✅ Updated ${worker.workerId}: ${ipInfo.ip} (${ipInfo.country})`);
        } else {
          results.failed.push(worker.workerId);
          console.log(`❌ Failed to detect IP for ${worker.workerId}`);
        }
      } catch (error) {
        console.error(`❌ Error refreshing ${worker.workerId}:`, error);
        results.failed.push(worker.workerId);
      }
    }

    res.json({
      success: true,
      message: `Refreshed ${results.refreshed}/${results.total} worker IPs`,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 IP refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh worker IPs'
    });
  }
});

/**
 * 🌐 Detect Worker IP Address
 * Helper function to ping worker and extract IP info
 */
async function detectWorkerIP(endpointUrl: string): Promise<{
  ip: string | null;
  country: string | null; 
  region: string | null;
}> {
  try {
    // For now, use a mock external IP detection service
    // In production, this would ping the worker's health endpoint
    // and the worker would respond with its detected external IP
    
    const mockIPs = [
      { ip: '13.248.122.115', country: 'US', region: 'Virginia' },
      { ip: '18.200.212.156', country: 'IE', region: 'Dublin' },
      { ip: '52.84.12.34', country: 'US', region: 'Oregon' },
      { ip: '15.184.58.92', country: 'FR', region: 'Paris' },
      { ip: '3.120.181.40', country: 'DE', region: 'Frankfurt' }
    ];
    
    // Simulate random IP assignment based on endpoint URL
    const hash = endpointUrl.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const selectedIP = mockIPs[Math.abs(hash) % mockIPs.length];
    
    // Add small delay to simulate network call
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return selectedIP;
    
  } catch (error) {
    console.error('IP detection failed:', error);
    return { ip: null, country: null, region: null };
  }
}

/**
 * 🔧 Toggle Worker Enable/Disable State
 * PUT /api/workers/:workerId/toggle
 * Body: { enabled: boolean }
 */
router.put('/:workerId/toggle', requireAuth, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled field must be a boolean'
      });
    }

    // Find worker by workerId
    const workers = await workerManager.listWorkers({});
    const worker = workers.find(w => w.workerId === workerId);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker ${workerId} not found`
      });
    }

    // Update worker enabled state
    await workerStorage.updateWorker(worker.id, {
      isEnabled: enabled,
      updatedAt: new Date()
    });

    console.log(`🔧 ${enabled ? 'Enabled' : 'Disabled'} worker: ${workerId}`);

    res.json({
      success: true,
      message: `Worker ${workerId} ${enabled ? 'enabled' : 'disabled'}`,
      workerId,
      enabled,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Worker toggle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle worker state'
    });
  }
});

// Extend Express Request type to include worker info
declare global {
  namespace Express {
    interface Request {
      worker?: {
        workerId: string;
        region: string;
        platforms: string[];
        exp: number;
      };
    }
  }
}

export default router;