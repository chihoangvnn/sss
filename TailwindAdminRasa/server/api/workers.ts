import express from 'express';
import jwt from 'jsonwebtoken';
import QueueService from '../services/queue';
import JobDistributionEngine from '../services/job-distribution-engine';
import JobClaimWorker from '../services/job-claim-worker';
import StartupService from '../services/startup';
import { storage } from '../storage';

const router = express.Router();

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
 * Generate worker authentication token
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
 * Get worker status and stats
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