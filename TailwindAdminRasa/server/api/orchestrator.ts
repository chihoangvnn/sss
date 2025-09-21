import { Router } from 'express';
import { jobOrchestrator, type SatelliteStrategy, type OrchestrationPlan } from '../services/job-orchestrator';
import { storage } from '../storage';

const router = Router();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to access orchestrator.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// =====================================
// ORCHESTRATOR OVERVIEW & STATUS
// =====================================

/**
 * GET /api/orchestrator/overview
 * Get orchestrator system overview
 */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    console.log('🎭 Getting orchestrator overview...');
    
    const overview = await jobOrchestrator.getOrchestratorOverview();
    
    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('❌ Error getting orchestrator overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orchestrator overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/orchestrator/campaigns
 * Get all active campaigns
 */
router.get('/campaigns', requireAuth, async (req, res) => {
  try {
    const campaigns = jobOrchestrator.getActiveCampaigns();
    
    res.json({
      success: true,
      campaigns,
      totalCampaigns: campaigns.length
    });
  } catch (error) {
    console.error('❌ Error getting campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get campaigns'
    });
  }
});

/**
 * GET /api/orchestrator/campaigns/:campaignId
 * Get specific campaign status
 */
router.get('/campaigns/:campaignId', requireAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = jobOrchestrator.getCampaignStatus(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('❌ Error getting campaign status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get campaign status'
    });
  }
});

// =====================================
// SATELLITE INTEGRATION
// =====================================

/**
 * POST /api/orchestrator/plan-from-satellite
 * Create orchestration plan from satellite strategy
 */
router.post('/plan-from-satellite', requireAuth, async (req, res) => {
  try {
    const { strategy }: { strategy: SatelliteStrategy } = req.body;
    
    if (!strategy || !strategy.templateName) {
      return res.status(400).json({
        success: false,
        error: 'Invalid strategy provided'
      });
    }

    console.log(`🎭 Planning campaign from satellite: ${strategy.templateName}`);
    
    const plan = await jobOrchestrator.planCampaignFromSatellite(strategy);
    
    res.json({
      success: true,
      plan,
      message: `Campaign plan created with ${plan.timeline.totalJobs} jobs across ${plan.timeline.concurrentWorkers} workers`
    });
  } catch (error) {
    console.error('❌ Error planning campaign from satellite:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to plan campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/orchestrator/execute-plan
 * Execute a planned campaign
 */
router.post('/execute-plan', requireAuth, async (req, res) => {
  try {
    const { plan }: { plan: OrchestrationPlan } = req.body;
    
    if (!plan || !plan.campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan provided'
      });
    }

    console.log(`🚀 Executing campaign: ${plan.campaignId}`);
    
    const execution = await jobOrchestrator.executeCampaign(plan);
    
    res.json({
      success: true,
      execution,
      message: `Campaign ${plan.campaignId} started successfully`
    });
  } catch (error) {
    console.error('❌ Error executing campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================
// MANUAL CAMPAIGN MANAGEMENT
// =====================================

/**
 * POST /api/orchestrator/create-manual-campaign
 * Create campaign from manually selected posts
 */
router.post('/create-manual-campaign', requireAuth, async (req, res) => {
  try {
    const { postIds, strategy, priority } = req.body;
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post IDs array is required'
      });
    }

    console.log(`🎭 Creating manual campaign with ${postIds.length} posts`);
    
    const plan = await jobOrchestrator.createManualCampaign({
      postIds,
      strategy: strategy || 'balanced',
      priority: priority || 'normal'
    });
    
    res.json({
      success: true,
      plan,
      message: `Manual campaign plan created with ${plan.timeline.totalJobs} jobs`
    });
  } catch (error) {
    console.error('❌ Error creating manual campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create manual campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/orchestrator/quick-start
 * Quick start campaign from current scheduled posts
 */
router.post('/quick-start', requireAuth, async (req, res) => {
  try {
    const { limit = 10, strategy = 'balanced' } = req.body;
    
    // Get scheduled posts ready for orchestration
    const scheduledPosts = await storage.getScheduledPosts();
    const readyPosts = scheduledPosts
      .filter(p => p.status === 'scheduled')
      .slice(0, limit)
      .map(p => p.id);
    
    if (readyPosts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No scheduled posts available for quick start'
      });
    }

    console.log(`⚡ Quick starting campaign with ${readyPosts.length} ready posts`);
    
    const plan = await jobOrchestrator.createManualCampaign({
      postIds: readyPosts,
      strategy,
      priority: 'high'
    });
    
    const execution = await jobOrchestrator.executeCampaign(plan);
    
    res.json({
      success: true,
      plan,
      execution,
      message: `Quick start campaign launched with ${readyPosts.length} posts`
    });
  } catch (error) {
    console.error('❌ Error in quick start:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to quick start campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================
// CAMPAIGN CONTROL
// =====================================

/**
 * POST /api/orchestrator/campaigns/:campaignId/pause
 * Pause running campaign
 */
router.post('/campaigns/:campaignId/pause', requireAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const success = await jobOrchestrator.pauseCampaign(campaignId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Campaign not found or cannot be paused'
      });
    }
    
    res.json({
      success: true,
      message: `Campaign ${campaignId} paused`
    });
  } catch (error) {
    console.error('❌ Error pausing campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause campaign'
    });
  }
});

/**
 * POST /api/orchestrator/campaigns/:campaignId/resume
 * Resume paused campaign
 */
router.post('/campaigns/:campaignId/resume', requireAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const success = await jobOrchestrator.resumeCampaign(campaignId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Campaign not found or cannot be resumed'
      });
    }
    
    res.json({
      success: true,
      message: `Campaign ${campaignId} resumed`
    });
  } catch (error) {
    console.error('❌ Error resuming campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume campaign'
    });
  }
});

/**
 * POST /api/orchestrator/campaigns/:campaignId/cancel
 * Cancel campaign
 */
router.post('/campaigns/:campaignId/cancel', requireAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const success = await jobOrchestrator.cancelCampaign(campaignId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      message: `Campaign ${campaignId} cancelled`
    });
  } catch (error) {
    console.error('❌ Error cancelling campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel campaign'
    });
  }
});

// =====================================
// WORKER ANALYSIS
// =====================================

/**
 * GET /api/orchestrator/worker-analysis
 * Get detailed worker analysis for planning
 */
router.get('/worker-analysis', requireAuth, async (req, res) => {
  try {
    const { platform } = req.query;
    
    const workers = await storage.getWorkers();
    let filteredWorkers = workers;
    
    if (platform) {
      filteredWorkers = workers.filter(w => 
        w.platforms.includes(platform as any)
      );
    }

    const onlineWorkers = filteredWorkers.filter(w => w.isOnline && w.isEnabled);
    const regions = Array.from(new Set(onlineWorkers.map(w => w.region)));
    
    const analysis = {
      totalWorkers: filteredWorkers.length,
      onlineWorkers: onlineWorkers.length,
      totalCapacity: onlineWorkers.reduce((sum, w) => sum + (w.maxConcurrentJobs || 1), 0),
      averageSuccessRate: onlineWorkers.length > 0 
        ? onlineWorkers.reduce((sum, w) => sum + (w.successRate || 0), 0) / onlineWorkers.length
        : 0,
      regionDistribution: regions.map(region => ({
        region,
        workerCount: onlineWorkers.filter(w => w.region === region).length,
        capacity: onlineWorkers
          .filter(w => w.region === region)
          .reduce((sum, w) => sum + (w.maxConcurrentJobs || 1), 0)
      })),
      workers: onlineWorkers.map(w => ({
        workerId: w.workerId,
        name: w.name,
        region: w.region,
        platforms: w.platforms,
        capabilities: w.capabilities,
        maxConcurrentJobs: w.maxConcurrentJobs,
        successRate: w.successRate,
        avgExecutionTime: w.avgExecutionTime,
        currentLoad: w.currentLoad,
        lastPingAt: w.lastPingAt
      }))
    };
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ Error getting worker analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get worker analysis'
    });
  }
});

// =====================================
// INTEGRATION ENDPOINTS
// =====================================

/**
 * POST /api/orchestrator/update-progress
 * Update campaign progress (called by external systems)
 */
router.post('/update-progress', requireAuth, async (req, res) => {
  try {
    const { campaignId, completedJobs, failedJobs, currentPhase } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID is required'
      });
    }

    await jobOrchestrator.updateCampaignProgress(campaignId, {
      completedJobs,
      failedJobs,
      currentPhase
    });
    
    res.json({
      success: true,
      message: 'Campaign progress updated'
    });
  } catch (error) {
    console.error('❌ Error updating campaign progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update campaign progress'
    });
  }
});

export default router;