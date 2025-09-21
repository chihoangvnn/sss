import express from 'express';
import RegionAssignmentService from '../services/region-assignment';
import { storage } from '../storage';

const router = express.Router();

// Session-based authentication middleware for admin operations
const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Authentication required", 
      message: "Please log in to access region assignment" 
    });
  }
  
  next();
};

/**
 * Get region assignment statistics
 * GET /api/regions/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await RegionAssignmentService.getAssignmentStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Region stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get region assignment statistics'
    });
  }
});

/**
 * Assign optimal region for a social account
 * POST /api/regions/assign
 * Body: { accountId, forceRegion?, considerLoad?, preferredRegions? }
 */
router.post('/assign', requireAuth, async (req, res) => {
  try {
    const { accountId, forceRegion, considerLoad, preferredRegions } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    // Get social account to validate it exists
    const socialAccount = await storage.getSocialAccount(accountId);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        error: 'Social account not found'
      });
    }

    // Assign optimal region
    const assignment = await RegionAssignmentService.assignOptimalRegion(
      socialAccount,
      {
        forceRegion,
        considerLoad: considerLoad === true,
        preferredRegions: Array.isArray(preferredRegions) ? preferredRegions : undefined
      }
    );

    console.log(`📍 Region assignment for ${accountId}: ${assignment.region} (${assignment.reason})`);

    res.json({
      success: true,
      assignment: {
        accountId,
        accountName: socialAccount.name,
        platform: socialAccount.platform,
        assignedRegion: assignment.region,
        reason: assignment.reason,
        alternatives: assignment.alternatives
      },
      assignedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Region assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign region'
    });
  }
});

/**
 * Bulk assign regions for multiple accounts
 * POST /api/regions/bulk-assign
 * Body: { accountIds[], options? }
 */
router.post('/bulk-assign', requireAuth, async (req, res) => {
  try {
    const { accountIds, options = {} } = req.body;
    
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Account IDs array is required'
      });
    }

    if (accountIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 accounts can be assigned at once'
      });
    }

    const assignments = [];
    const errors = [];

    for (const accountId of accountIds) {
      try {
        const socialAccount = await storage.getSocialAccount(accountId);
        if (!socialAccount) {
          errors.push(`Account ${accountId}: Not found`);
          continue;
        }

        const assignment = await RegionAssignmentService.assignOptimalRegion(
          socialAccount,
          options
        );

        assignments.push({
          accountId,
          accountName: socialAccount.name,
          platform: socialAccount.platform,
          assignedRegion: assignment.region,
          reason: assignment.reason
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Account ${accountId}: ${errorMsg}`);
      }
    }

    console.log(`📍 Bulk assignment completed: ${assignments.length} successful, ${errors.length} errors`);

    res.json({
      success: errors.length === 0,
      assignments,
      errors,
      summary: {
        total: accountIds.length,
        successful: assignments.length,
        failed: errors.length
      },
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bulk region assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk region assignment'
    });
  }
});

/**
 * Rebalance account assignments based on current load
 * POST /api/regions/rebalance
 * Body: { platform?, dryRun? }
 */
router.post('/rebalance', requireAuth, async (req, res) => {
  try {
    const { platform, dryRun = true } = req.body;
    
    const result = await RegionAssignmentService.rebalanceAccountAssignments(
      platform,
      dryRun === true
    );

    console.log(`🔄 Rebalancing ${dryRun ? '(DRY RUN)' : ''}: ${result.reassignments.length} reassignments`);

    res.json({
      success: true,
      rebalancing: result,
      message: dryRun 
        ? `Found ${result.reassignments.length} accounts that should be reassigned`
        : `Successfully reassigned ${result.reassignments.length} accounts`,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Region rebalancing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebalance region assignments'
    });
  }
});

/**
 * Get region assignment for a specific account
 * GET /api/regions/assignment/:accountId
 */
router.get('/assignment/:accountId', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Get social account
    const socialAccount = await storage.getSocialAccount(accountId);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        error: 'Social account not found'
      });
    }

    // Get current assignment
    const prefs = socialAccount.contentPreferences as any || {};
    const currentRegion = prefs.assignedRegion;
    const assignmentReason = prefs.assignmentReason;
    const assignedAt = prefs.assignedAt;

    if (!currentRegion) {
      return res.json({
        success: true,
        assignment: null,
        message: 'No region assignment found for this account'
      });
    }

    res.json({
      success: true,
      assignment: {
        accountId,
        accountName: socialAccount.name,
        platform: socialAccount.platform,
        assignedRegion: currentRegion,
        reason: assignmentReason,
        assignedAt
      }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get region assignment'
    });
  }
});

/**
 * Get available regions and their capabilities
 * GET /api/regions/available
 */
router.get('/available', requireAuth, async (req, res) => {
  try {
    const { platform } = req.query;
    
    // Get platform-specific regions or all regions
    const platformRegions: Record<string, string[]> = {
      facebook: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'us-west-2'],
      instagram: ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'us-west-2'], 
      twitter: ['us-west-2', 'us-east-1', 'eu-west-1', 'ap-northeast-1'],
      tiktok: ['ap-southeast-1', 'us-west-2', 'eu-west-1', 'us-east-1']
    };

    const availableRegions = platform 
      ? platformRegions[platform as string] || []
      : Object.values(platformRegions).flat();

    // Get unique regions
    const uniqueRegions = Array.from(new Set(availableRegions));

    // Add region details
    const regionDetails = uniqueRegions.map(region => ({
      id: region,
      name: getRegionName(region),
      location: getRegionLocation(region),
      platforms: Object.entries(platformRegions)
        .filter(([, regions]) => regions.includes(region))
        .map(([plt]) => plt),
      timezone: getRegionTimezone(region)
    }));

    res.json({
      success: true,
      regions: regionDetails,
      total: regionDetails.length
    });
  } catch (error) {
    console.error('Get available regions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available regions'
    });
  }
});

/**
 * Remove region assignment for an account
 * DELETE /api/regions/assignment/:accountId
 */
router.delete('/assignment/:accountId', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Get social account
    const socialAccount = await storage.getSocialAccount(accountId);
    if (!socialAccount) {
      return res.status(404).json({
        success: false,
        error: 'Social account not found'
      });
    }

    // Remove region assignment
    const currentPrefs = socialAccount.contentPreferences as any || {};
    const { assignedRegion, assignmentReason, assignedAt, ...otherPrefs } = currentPrefs;

    await storage.updateSocialAccount(accountId, {
      contentPreferences: otherPrefs as any
    });

    console.log(`🗑️ Removed region assignment for account ${accountId}`);

    res.json({
      success: true,
      message: 'Region assignment removed successfully',
      removedAssignment: {
        accountId,
        accountName: socialAccount.name,
        platform: socialAccount.platform,
        previousRegion: assignedRegion,
        previousReason: assignmentReason,
        removedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove region assignment'
    });
  }
});

// Helper functions for region details
function getRegionName(regionId: string): string {
  const regionNames: Record<string, string> = {
    'us-east-1': 'US East (Virginia)',
    'us-west-2': 'US West (Oregon)',
    'eu-west-1': 'Europe (Ireland)',
    'eu-central-1': 'Europe (Frankfurt)',
    'eu-north-1': 'Europe (Stockholm)',
    'eu-south-1': 'Europe (Milan)',
    'ap-southeast-1': 'Asia Pacific (Singapore)',
    'ap-southeast-2': 'Asia Pacific (Sydney)',
    'ap-northeast-1': 'Asia Pacific (Tokyo)',
    'ap-south-1': 'Asia Pacific (Mumbai)',
    'sa-east-1': 'South America (São Paulo)',
    'me-south-1': 'Middle East (Bahrain)',
    'af-south-1': 'Africa (Cape Town)'
  };
  
  return regionNames[regionId] || regionId;
}

function getRegionLocation(regionId: string): string {
  const regionLocations: Record<string, string> = {
    'us-east-1': 'Virginia, USA',
    'us-west-2': 'Oregon, USA',
    'eu-west-1': 'Dublin, Ireland',
    'eu-central-1': 'Frankfurt, Germany',
    'eu-north-1': 'Stockholm, Sweden',
    'eu-south-1': 'Milan, Italy',
    'ap-southeast-1': 'Singapore',
    'ap-southeast-2': 'Sydney, Australia',
    'ap-northeast-1': 'Tokyo, Japan',
    'ap-south-1': 'Mumbai, India',
    'sa-east-1': 'São Paulo, Brazil',
    'me-south-1': 'Manama, Bahrain',
    'af-south-1': 'Cape Town, South Africa'
  };
  
  return regionLocations[regionId] || 'Unknown';
}

function getRegionTimezone(regionId: string): string {
  const regionTimezones: Record<string, string> = {
    'us-east-1': 'America/New_York',
    'us-west-2': 'America/Los_Angeles',
    'eu-west-1': 'Europe/Dublin',
    'eu-central-1': 'Europe/Berlin',
    'eu-north-1': 'Europe/Stockholm',
    'eu-south-1': 'Europe/Rome',
    'ap-southeast-1': 'Asia/Singapore',
    'ap-southeast-2': 'Australia/Sydney',
    'ap-northeast-1': 'Asia/Tokyo',
    'ap-south-1': 'Asia/Kolkata',
    'sa-east-1': 'America/Sao_Paulo',
    'me-south-1': 'Asia/Bahrain',
    'af-south-1': 'Africa/Johannesburg'
  };
  
  return regionTimezones[regionId] || 'UTC';
}

export default router;