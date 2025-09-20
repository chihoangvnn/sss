/**
 * 🚀 LIMIT MANAGEMENT API ENDPOINTS
 * 
 * REST API endpoints for the robust Tier 1 limit management engine
 * Provides real-time limit monitoring and posting capacity checks
 */

import { Router } from 'express';
import { z } from 'zod';
import { limitEngine } from '../services/limit-management-engine';

const router = Router();

// Request validation schemas
const PostingCapacitySchema = z.object({
  socialAccountId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  appId: z.string().uuid().optional()
});

const BulkCapacitySchema = z.object({
  posts: z.array(z.object({
    socialAccountId: z.string().uuid(),
    groupId: z.string().uuid().optional(),
    appId: z.string().uuid().optional(),
    scheduledTime: z.string().datetime()
  })).min(1).max(100)
});

const LimitStatusSchema = z.object({
  scope: z.enum(['app', 'group', 'account']).optional(),
  scopeId: z.string().uuid().optional()
});

// Authentication middleware (development bypass)
const requireAuth = (req: any, res: any, next: any) => {
  // Development bypass
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Limit Management Auth Check - NODE_ENV: development - bypassing auth');
    return next();
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Authentication required for limit management.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

/**
 * 🎯 POST /api/limits/check-capacity - Check posting capacity for specific account/group
 * 
 * Core endpoint for validating if posting is allowed before scheduling
 */
router.post('/check-capacity', requireAuth, async (req, res) => {
  try {
    const validation = PostingCapacitySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validation.error.errors
      });
    }

    const { socialAccountId, groupId, appId } = validation.data;
    
    console.log(`🎯 Checking posting capacity for account: ${socialAccountId}, group: ${groupId}, app: ${appId}`);
    
    const capacity = await limitEngine.checkPostingCapacity(socialAccountId, groupId, appId);
    
    // Add metadata
    const response = {
      ...capacity,
      metadata: {
        checkedAt: new Date().toISOString(),
        scope: {
          account: socialAccountId,
          group: groupId,
          app: appId
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking posting capacity:', error);
    res.status(500).json({
      error: 'Failed to check posting capacity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🔄 POST /api/limits/bulk-check - Bulk posting capacity check for Smart Scheduler
 * 
 * Advanced endpoint for checking multiple posts at once
 */
router.post('/bulk-check', requireAuth, async (req, res) => {
  try {
    const validation = BulkCapacitySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid bulk request parameters',
        details: validation.error.errors
      });
    }

    const { posts } = validation.data;
    
    console.log(`🔄 Bulk checking capacity for ${posts.length} posts`);
    
    // Convert scheduledTime strings to Date objects
    const postsWithDates = posts.map(post => ({
      ...post,
      scheduledTime: new Date(post.scheduledTime)
    }));
    
    const bulkResult = await limitEngine.checkBulkPostingCapacity(postsWithDates);
    
    // Add summary statistics
    const response = {
      ...bulkResult,
      summary: {
        totalPosts: posts.length,
        allowedCount: bulkResult.allowedPosts.length,
        blockedCount: bulkResult.blockedPosts.length,
        alternativeCount: bulkResult.suggestedAlternatives.length,
        successRate: Math.round((bulkResult.allowedPosts.length / posts.length) * 100)
      },
      checkedAt: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking bulk posting capacity:', error);
    res.status(500).json({
      error: 'Failed to check bulk posting capacity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 📊 GET /api/limits/status - Get comprehensive limit status
 * 
 * Real-time monitoring endpoint for dashboard display
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const validation = LimitStatusSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }

    const filters = validation.data;
    
    console.log('📊 Getting limit status with filters:', filters);
    
    const status = await limitEngine.getLimitStatus(filters);
    
    // Add dashboard-friendly metadata
    const response = {
      ...status,
      dashboard: {
        refreshedAt: new Date().toISOString(),
        nextRefreshRecommended: new Date(Date.now() + 60000).toISOString(), // 1 minute
        alerts: {
          criticalViolations: status.violations.filter(v => v.violatedRule.priority <= 2).length,
          warnings: status.violations.filter(v => v.violatedRule.priority > 2).length,
          healthStatus: status.summary.healthScore >= 80 ? 'healthy' : 
                      status.summary.healthScore >= 60 ? 'warning' : 'critical'
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting limit status:', error);
    res.status(500).json({
      error: 'Failed to get limit status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🗑️ POST /api/limits/clear-cache - Clear limit usage cache
 * 
 * Administrative endpoint for forcing cache refresh
 */
router.post('/clear-cache', requireAuth, async (req, res) => {
  try {
    console.log('🗑️ Clearing limit management cache');
    
    limitEngine.clearCache();
    
    res.json({
      success: true,
      message: 'Limit management cache cleared successfully',
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ⚙️ GET /api/limits/config - Get limit management configuration
 * 
 * Administrative endpoint for configuration management
 */
router.get('/config', requireAuth, async (req, res) => {
  try {
    console.log('⚙️ Getting limit management configuration');
    
    const config = limitEngine.exportConfiguration();
    
    res.json({
      configuration: config,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      error: 'Failed to get configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * ⚙️ POST /api/limits/config - Import limit management configuration
 * 
 * Administrative endpoint for configuration import
 */
router.post('/config', requireAuth, async (req, res) => {
  try {
    console.log('⚙️ Importing limit management configuration');
    
    const { configuration } = req.body;
    
    if (!configuration) {
      return res.status(400).json({
        error: 'Configuration object required'
      });
    }
    
    limitEngine.importConfiguration(configuration);
    
    res.json({
      success: true,
      message: 'Configuration imported successfully',
      importedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error importing configuration:', error);
    res.status(500).json({
      error: 'Failed to import configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 🏥 GET /api/limits/health - Health check endpoint
 * 
 * Quick health status for monitoring systems
 */
router.get('/health', async (req, res) => {
  try {
    const status = await limitEngine.getLimitStatus();
    const healthScore = status.summary.healthScore;
    
    const health = {
      status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'critical',
      score: healthScore,
      violations: status.violations.length,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    const httpStatus = healthScore >= 60 ? 200 : 503;
    res.status(httpStatus).json(health);
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;