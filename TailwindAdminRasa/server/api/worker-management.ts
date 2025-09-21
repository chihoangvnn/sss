/**
 * 🚀 WORKER MANAGEMENT API ENDPOINTS
 * 
 * RESTful API for multi-platform worker management featuring:
 * - Worker registration and authentication
 * - Job assignment and tracking
 * - Health monitoring and analytics
 * - Performance metrics and reporting
 * - Multi-platform support (Facebook, Instagram, TikTok, Twitter, YouTube, LinkedIn)
 */

import express from 'express';
import { WorkerManagementService } from '../services/worker-management';
import QueueService from '../services/queue';
// Note: Auth middleware - for now we'll skip auth for development
// import { requireAuth } from '../middleware/auth';
const requireAuth = (req: any, res: any, next: any) => {
  // Development mode - skip auth
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  // In production, implement proper auth
  res.status(401).json({ success: false, error: 'Authentication required' });
};
import type { WorkerPlatform } from '@shared/schema';

const router = express.Router();
const workerManager = WorkerManagementService.getInstance();

/**
 * Register a new worker
 * POST /api/worker-management/register
 * Body: { workerId, name, platforms[], capabilities[], region, deploymentPlatform, endpointUrl, registrationSecret }
 */
router.post('/register', async (req, res) => {
  try {
    const {
      workerId,
      name,
      description,
      platforms,
      capabilities,
      region,
      deploymentPlatform,
      endpointUrl,
      registrationSecret,
      maxConcurrentJobs,
      minJobInterval,
      maxJobsPerHour,
      specialties,
      tags,
      metadata
    } = req.body;

    // Validate required fields
    if (!workerId || !name || !platforms || !capabilities || !region || !deploymentPlatform || !endpointUrl || !registrationSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: workerId, name, platforms, capabilities, region, deploymentPlatform, endpointUrl, registrationSecret'
      });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'platforms must be a non-empty array'
      });
    }

    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'capabilities must be a non-empty array'
      });
    }

    const result = await workerManager.registerWorker({
      workerId,
      name,
      description,
      platforms,
      capabilities,
      region,
      deploymentPlatform,
      endpointUrl,
      registrationSecret,
      maxConcurrentJobs,
      minJobInterval,
      maxJobsPerHour,
      specialties,
      tags,
      metadata
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Worker registered successfully',
      worker: {
        id: result.worker!.id,
        workerId: result.worker!.workerId,
        name: result.worker!.name,
        platforms: result.worker!.platforms,
        region: result.worker!.region,
        status: result.worker!.status
      },
      authToken: result.authToken
    });

  } catch (error) {
    console.error('Worker registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during worker registration'
    });
  }
});

/**
 * List all workers with filtering
 * GET /api/worker-management/workers
 * Query: ?platform=facebook&region=us-east-1&status=active&isOnline=true
 */
router.get('/workers', requireAuth, async (req, res) => {
  try {
    const { platform, region, status, isOnline } = req.query;

    const filters: any = {};
    if (platform) filters.platform = platform as WorkerPlatform;
    if (region) filters.region = region as string;
    if (status) filters.status = status as string;
    if (isOnline !== undefined) filters.isOnline = isOnline === 'true';

    const workers = await workerManager.listWorkers(filters);
    
    // Transform for API response (don't expose sensitive data)
    const workerSummaries = workers.map(worker => ({
      id: worker.id,
      workerId: worker.workerId,
      name: worker.name,
      description: worker.description,
      platforms: worker.platforms,
      capabilities: worker.capabilities,
      specialties: worker.specialties,
      maxConcurrentJobs: worker.maxConcurrentJobs,
      currentLoad: worker.currentLoad,
      region: worker.region,
      deploymentPlatform: worker.deploymentPlatform,
      status: worker.status,
      isOnline: worker.isOnline,
      isEnabled: worker.isEnabled,
      totalJobsCompleted: worker.totalJobsCompleted,
      totalJobsFailed: worker.totalJobsFailed,
      successRate: worker.successRate,
      avgResponseTime: worker.avgResponseTime,
      lastJobAt: worker.lastJobAt,
      lastPingAt: worker.lastPingAt,
      priority: worker.priority,
      tags: worker.tags,
      createdAt: worker.createdAt,
      updatedAt: worker.updatedAt
    }));

    res.json({
      success: true,
      workers: workerSummaries,
      totalCount: workerSummaries.length,
      filters: filters
    });

  } catch (error) {
    console.error('Failed to list workers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workers'
    });
  }
});

/**
 * Get worker details by ID
 * GET /api/worker-management/workers/:workerId
 */
router.get('/workers/:workerId', requireAuth, async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const workers = await workerManager.listWorkers({});
    const worker = workers.find(w => w.workerId === workerId);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found'
      });
    }

    // Get performance metrics
    const metrics = await workerManager.getWorkerMetrics(workerId);

    res.json({
      success: true,
      worker: {
        id: worker.id,
        workerId: worker.workerId,
        name: worker.name,
        description: worker.description,
        platforms: worker.platforms,
        capabilities: worker.capabilities,
        specialties: worker.specialties,
        maxConcurrentJobs: worker.maxConcurrentJobs,
        currentLoad: worker.currentLoad,
        region: worker.region,
        deploymentPlatform: worker.deploymentPlatform,
        endpointUrl: worker.endpointUrl,
        status: worker.status,
        isOnline: worker.isOnline,
        isEnabled: worker.isEnabled,
        priority: worker.priority,
        tags: worker.tags,
        metadata: worker.metadata,
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt
      },
      metrics
    });

  } catch (error) {
    console.error('Failed to get worker details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve worker details'
    });
  }
});

/**
 * Update worker health status
 * POST /api/worker-management/workers/:workerId/health
 * Body: { status, systemMetrics: { responseTime, cpuUsage, memoryUsage }, platformStatus }
 */
router.post('/workers/:workerId/health', async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, systemMetrics, platformStatus } = req.body;

    if (!status || !systemMetrics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: status, systemMetrics'
      });
    }

    const result = await workerManager.updateWorkerHealth(workerId, {
      workerId,
      status,
      systemMetrics,
      platformStatus,
      lastCheckAt: new Date()
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Worker health updated successfully'
    });

  } catch (error) {
    console.error('Failed to update worker health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update worker health'
    });
  }
});

/**
 * Get optimal worker for job assignment
 * POST /api/worker-management/assign
 * Body: { platform, jobType, priority, region?, requiredCapabilities?, excludeWorkers?, preferredWorkers? }
 */
router.post('/assign', requireAuth, async (req, res) => {
  try {
    const {
      platform,
      jobType,
      priority,
      region,
      requiredCapabilities,
      excludeWorkers,
      preferredWorkers
    } = req.body;

    if (!platform || !jobType || priority === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: platform, jobType, priority'
      });
    }

    const result = await workerManager.getOptimalWorker({
      platform,
      jobType,
      priority,
      region,
      requiredCapabilities,
      excludeWorkers,
      preferredWorkers
    });

    if (!result.worker) {
      return res.status(404).json({
        success: false,
        error: result.reason || 'No suitable worker found'
      });
    }

    res.json({
      success: true,
      worker: {
        id: result.worker.id,
        workerId: result.worker.workerId,
        name: result.worker.name,
        platforms: result.worker.platforms,
        capabilities: result.worker.capabilities,
        region: result.worker.region,
        currentLoad: result.worker.currentLoad,
        maxConcurrentJobs: result.worker.maxConcurrentJobs,
        avgExecutionTime: result.worker.avgExecutionTime,
        successRate: result.worker.successRate,
        endpointUrl: result.worker.endpointUrl
      }
    });

  } catch (error) {
    console.error('Failed to get optimal worker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find optimal worker'
    });
  }
});

/**
 * Assign specific job to worker
 * POST /api/worker-management/workers/:workerId/jobs
 * Body: { jobId, scheduledPostId, platform, jobType, priority }
 */
router.post('/workers/:workerId/jobs', requireAuth, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { jobId, scheduledPostId, platform, jobType, priority } = req.body;

    if (!jobId || !scheduledPostId || !platform || !jobType || priority === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, scheduledPostId, platform, jobType, priority'
      });
    }

    const result = await workerManager.assignJobToWorker(workerId, {
      jobId,
      scheduledPostId,
      platform,
      jobType,
      priority
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Job assigned successfully',
      workerJob: {
        id: result.workerJob!.id,
        workerId: result.workerJob!.workerId,
        jobId: result.workerJob!.jobId,
        platform: result.workerJob!.platform,
        jobType: result.workerJob!.jobType,
        status: result.workerJob!.status,
        assignedAt: result.workerJob!.assignedAt
      }
    });

  } catch (error) {
    console.error('Failed to assign job to worker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign job to worker'
    });
  }
});

/**
 * Get worker performance metrics
 * GET /api/worker-management/workers/:workerId/metrics
 */
router.get('/workers/:workerId/metrics', requireAuth, async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const metrics = await workerManager.getWorkerMetrics(workerId);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found or metrics unavailable'
      });
    }

    res.json({
      success: true,
      metrics,
      workerId
    });

  } catch (error) {
    console.error('Failed to get worker metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve worker metrics'
    });
  }
});

/**
 * Get system overview with all workers
 * GET /api/worker-management/overview
 */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const allWorkers = await workerManager.listWorkers({});
    
    // Aggregate statistics
    const stats = {
      totalWorkers: allWorkers.length,
      onlineWorkers: allWorkers.filter(w => w.isOnline).length,
      activeWorkers: allWorkers.filter(w => w.status === 'active').length,
      totalCapacity: allWorkers.reduce((sum, w) => sum + w.maxConcurrentJobs, 0),
      currentLoad: allWorkers.reduce((sum, w) => sum + w.currentLoad, 0),
      totalJobsCompleted: allWorkers.reduce((sum, w) => sum + w.totalJobsCompleted, 0),
      totalJobsFailed: allWorkers.reduce((sum, w) => sum + w.totalJobsFailed, 0),
      platformDistribution: {} as Record<string, number>,
      regionDistribution: {} as Record<string, number>,
      averageSuccessRate: 0
    };

    // Calculate platform and region distributions
    allWorkers.forEach(worker => {
      worker.platforms.forEach(platform => {
        stats.platformDistribution[platform] = (stats.platformDistribution[platform] || 0) + 1;
      });
      
      stats.regionDistribution[worker.region] = (stats.regionDistribution[worker.region] || 0) + 1;
    });

    // Calculate average success rate
    const workersWithJobs = allWorkers.filter(w => w.totalJobsCompleted + w.totalJobsFailed > 0);
    if (workersWithJobs.length > 0) {
      stats.averageSuccessRate = workersWithJobs.reduce((sum, w) => 
        sum + parseFloat(w.successRate || '0'), 0
      ) / workersWithJobs.length;
    }

    // Get recent activity metrics for each worker
    const workerMetrics = await Promise.all(
      allWorkers.map(async (worker) => {
        const metrics = await workerManager.getWorkerMetrics(worker.workerId);
        return {
          workerId: worker.workerId,
          name: worker.name,
          platforms: worker.platforms,
          region: worker.region,
          status: worker.status,
          isOnline: worker.isOnline,
          currentLoad: worker.currentLoad,
          maxConcurrentJobs: worker.maxConcurrentJobs,
          metrics
        };
      })
    );

    res.json({
      success: true,
      overview: {
        stats,
        workers: workerMetrics,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to get system overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system overview'
    });
  }
});

/**
 * Get supported platforms and capabilities
 * GET /api/worker-management/platforms
 */
router.get('/platforms', async (req, res) => {
  try {
    const supportedPlatforms = [
      {
        platform: 'facebook',
        name: 'Facebook',
        actions: ['post_text', 'post_image', 'post_video'],
        description: 'Facebook Pages posting'
      },
      {
        platform: 'instagram',
        name: 'Instagram', 
        actions: ['post_image', 'post_video', 'post_story', 'post_reel'],
        description: 'Instagram Business posting'
      },
      {
        platform: 'twitter',
        name: 'Twitter/X',
        actions: ['post_text', 'post_image', 'post_video'],
        description: 'Twitter/X posting'
      },
      {
        platform: 'tiktok',
        name: 'TikTok',
        actions: ['post_video'],
        description: 'TikTok video posting'
      },
      {
        platform: 'youtube',
        name: 'YouTube',
        actions: ['post_video'],
        description: 'YouTube video uploading'
      },
      {
        platform: 'linkedin',
        name: 'LinkedIn',
        actions: ['post_text', 'post_image', 'post_video'],
        description: 'LinkedIn Company Pages posting'
      }
    ];

    res.json({
      success: true,
      platforms: supportedPlatforms,
      totalPlatforms: supportedPlatforms.length
    });

  } catch (error) {
    console.error('Failed to get platforms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve platform information'
    });
  }
});

export default router;