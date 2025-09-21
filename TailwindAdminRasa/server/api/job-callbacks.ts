import express from 'express';
import JobResultProcessor from '../services/job-result-processor';
import QueueService from '../services/queue';
import JobClaimWorker from '../services/job-claim-worker';
import jwt from 'jsonwebtoken';

const router = express.Router();

// JWT secret for worker authentication
const WORKER_JWT_SECRET = (() => {
  if (process.env.NODE_ENV === 'production' && !process.env.WORKER_JWT_SECRET) {
    throw new Error('WORKER_JWT_SECRET environment variable must be set in production');
  }
  return process.env.WORKER_JWT_SECRET || 'dev-worker-secret-change-in-production';
})();

/**
 * Middleware to authenticate worker callback requests
 */
const authenticateWorkerCallback = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header'
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, WORKER_JWT_SECRET) as {
      workerId: string;
      region: string;
      platforms: string[];
      exp: number;
    };
    
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
 * Job completion callback from serverless workers
 * POST /api/callbacks/jobs/:jobId/complete
 * Body: { platformPostId?, platformUrl?, analytics?, executionTime?, lockToken }
 */
router.post('/jobs/:jobId/complete', authenticateWorkerCallback, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { platformPostId, platformUrl, analytics, executionTime, lockToken } = req.body;
    const worker = req.worker!;

    console.log(`✅ Received job completion callback: ${jobId} from worker ${worker.workerId}`);

    // Validate job ownership (critical security check)
    const job = await QueueService.findJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Verify job belongs to this worker
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

    // Verify lock token if provided
    if (lockToken) {
      try {
        const progressData = job.progress;
        
        // Check if the lock token matches what was stored during claiming
        if (!progressData || progressData.lockToken !== lockToken) {
          return res.status(403).json({
            success: false,
            error: 'Invalid lock token - job may have been reclaimed'
          });
        }
      } catch (tokenError) {
        return res.status(403).json({
          success: false,
          error: 'Failed to validate lock token'
        });
      }
    }

    // Process job completion
    const result = await JobResultProcessor.processJobCompletion(
      jobId,
      worker.workerId,
      {
        platformPostId,
        platformUrl,
        analytics,
        executionTime,
        region: worker.region
      }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to process job completion'
      });
    }

    // Mark job as completed in queue using proper BullMQ token
    try {
      const completionResult = await JobClaimWorker.completeJob(
        jobId,
        worker.workerId,
        {
          success: true,
          completedBy: worker.workerId,
          completedAt: new Date().toISOString(),
          result: {
            platformPostId,
            platformUrl,
            analytics
          }
        },
        lockToken
      );
      
      if (!completionResult.success) {
        console.warn(`Warning: Failed to complete job in BullMQ: ${completionResult.error}`);
      }
    } catch (queueError) {
      console.warn(`Warning: Failed to update job queue status for ${jobId}:`, queueError);
      // Don't fail the request since database update succeeded
    }

    console.log(`✅ Job ${jobId} completion processed successfully`);

    res.json({
      success: true,
      jobId,
      message: 'Job completion processed successfully',
      result: {
        postId: result.updatedPost?.id,
        platformPostId,
        platformUrl,
        status: 'posted'
      },
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Job completion callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process job completion callback'
    });
  }
});

/**
 * Job failure callback from serverless workers
 * POST /api/callbacks/jobs/:jobId/fail
 * Body: { error, errorCode?, shouldRetry?, retryAfter?, executionTime?, platformError?, lockToken }
 */
router.post('/jobs/:jobId/fail', authenticateWorkerCallback, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      error, 
      errorCode, 
      shouldRetry = true, 
      retryAfter = 60000, 
      executionTime, 
      platformError,
      lockToken 
    } = req.body;
    const worker = req.worker!;

    console.log(`❌ Received job failure callback: ${jobId} from worker ${worker.workerId}`);

    if (!error) {
      return res.status(400).json({
        success: false,
        error: 'Error message is required'
      });
    }

    // Validate job ownership
    const job = await QueueService.findJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Verify job belongs to this worker
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

    // Verify lock token if provided
    if (lockToken) {
      try {
        const progressData = job.progress;
        
        // Check if the lock token matches what was stored during claiming
        if (!progressData || progressData.lockToken !== lockToken) {
          return res.status(403).json({
            success: false,
            error: 'Invalid lock token - job may have been reclaimed'
          });
        }
      } catch (tokenError) {
        return res.status(403).json({
          success: false,
          error: 'Failed to validate lock token'
        });
      }
    }

    // Process job failure
    const result = await JobResultProcessor.processJobFailure(
      jobId,
      worker.workerId,
      {
        error,
        errorCode,
        shouldRetry,
        retryAfter,
        executionTime,
        region: worker.region,
        platformError
      }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to process job failure'
      });
    }

    // Update job in queue using proper BullMQ token
    try {
      if (result.willRetry) {
        // For retries, we'll need to re-enqueue the job
        // This is handled by JobClaimWorker internally
        console.log(`🔄 Job ${jobId} will be retried (handled by claim worker)`);
      } else {
        // Mark as permanently failed using proper BullMQ token
        const failureResult = await JobClaimWorker.failJob(
          jobId,
          worker.workerId,
          new Error(error),
          lockToken
        );
        
        if (!failureResult.success) {
          console.warn(`Warning: Failed to fail job in BullMQ: ${failureResult.error}`);
        } else {
          console.log(`💀 Job ${jobId} marked as permanently failed`);
        }
      }
    } catch (queueError) {
      console.warn(`Warning: Failed to update job queue status for ${jobId}:`, queueError);
      // Don't fail the request since database update succeeded
    }

    console.log(`❌ Job ${jobId} failure processed: ${result.willRetry ? 'Will retry' : 'Permanently failed'}`);

    res.json({
      success: true,
      jobId,
      message: 'Job failure processed successfully',
      result: {
        willRetry: result.willRetry,
        error,
        errorCode,
        status: result.willRetry ? 'retrying' : 'failed'
      },
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Job failure callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process job failure callback'
    });
  }
});

/**
 * Job progress update callback from serverless workers
 * POST /api/callbacks/jobs/:jobId/progress
 * Body: { status, message?, progress?, startedAt?, estimatedCompletion? }
 */
router.post('/jobs/:jobId/progress', authenticateWorkerCallback, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, message, progress, startedAt, estimatedCompletion } = req.body;
    const worker = req.worker!;

    console.log(`📊 Received job progress callback: ${jobId} - ${status}`);

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status values
    const validStatuses = ['started', 'uploading', 'processing', 'posting', 'analyzing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate job ownership
    const job = await QueueService.findJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Verify job belongs to this worker
    if (!job.data || job.data.workerId !== worker.workerId) {
      return res.status(403).json({
        success: false,
        error: 'Job not assigned to this worker'
      });
    }

    // Process progress update
    const result = await JobResultProcessor.processJobProgress(
      jobId,
      worker.workerId,
      {
        status: status as any,
        message,
        progress,
        region: worker.region,
        startedAt,
        estimatedCompletion
      }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to process job progress'
      });
    }

    res.json({
      success: true,
      jobId,
      message: 'Job progress updated successfully',
      progress: {
        status,
        message,
        progress,
        workerId: worker.workerId,
        region: worker.region
      },
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Job progress callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process job progress callback'
    });
  }
});

/**
 * Heartbeat endpoint for workers to report they're alive
 * POST /api/callbacks/heartbeat
 * Body: { region?, status?, queueStats? }
 */
router.post('/heartbeat', authenticateWorkerCallback, async (req, res) => {
  try {
    const { region, status = 'active', queueStats } = req.body;
    const worker = req.worker!;

    console.log(`💓 Heartbeat from worker ${worker.workerId} in region ${region || worker.region}`);

    // Could store worker heartbeat in Redis or database for monitoring
    // For now, just acknowledge the heartbeat
    
    res.json({
      success: true,
      message: 'Heartbeat received',
      worker: {
        id: worker.workerId,
        region: region || worker.region,
        platforms: worker.platforms,
        status
      },
      receivedAt: new Date().toISOString(),
      instructions: {
        // Could send instructions back to worker
        continueProcessing: true,
        maxJobsPerPull: 5,
        heartbeatInterval: 60000 // 1 minute
      }
    });

  } catch (error) {
    console.error('Heartbeat callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process heartbeat'
    });
  }
});

/**
 * Get callback statistics for monitoring
 * GET /api/callbacks/stats
 */
router.get('/stats', authenticateWorkerCallback, async (req, res) => {
  try {
    const { timeframe } = req.query;
    const worker = req.worker!;

    let start: Date | undefined;
    let end: Date | undefined;

    if (timeframe) {
      const now = new Date();
      switch (timeframe) {
        case '1h':
          start = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }
      end = now;
    }

    const stats = await JobResultProcessor.getExecutionStats(
      start && end ? { start, end } : undefined,
      {
        workerId: worker.workerId,
        region: worker.region
      }
    );

    res.json({
      success: true,
      stats,
      worker: {
        id: worker.workerId,
        region: worker.region,
        platforms: worker.platforms
      },
      timeframe: timeframe || 'all',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Callback stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get callback statistics'
    });
  }
});

// Extend Express Request type for worker info
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