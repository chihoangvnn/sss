import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';

const router = express.Router();

// 🛡️ CSRF Protection middleware (same pattern as facebook-apps)
const requireCSRFProtection = (req: any, res: any, next: any) => {
  // For development mode, skip CSRF protection
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    next();
    return;
  }

  // Check CSRF token from header or body
  const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;
  const sessionCSRF = req.session?.csrfToken;

  if (!csrfToken || !sessionCSRF || csrfToken !== sessionCSRF) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_PROTECTION'
    });
  }

  // 🛡️ HARDENED ORIGIN VALIDATION - Exact matching only
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [`${req.protocol}://${req.headers.host}`];

  if (!origin) {
    return res.status(403).json({
      error: 'Origin header required',
      code: 'ORIGIN_MISSING'
    });
  }

  // Exact origin matching - prevent substring bypass attacks
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Origin not allowed',
      code: 'ORIGIN_BLOCKED',
      allowedOrigins: allowedOrigins.map(o => o.replace(/https?:\/\//, '[protocol]://')) // Don't expose full URLs
    });
  }

  next();
};

// 🔐 Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

// 📋 Input validation schemas
const schedulePostsSchema = z.object({
  contentIds: z.array(z.string().min(1)).min(1, "At least one content item required"),
  targetAccounts: z.array(z.string().min(1)).min(1, "At least one target account required"),
  schedulingMode: z.enum(['draft', 'pending_approval', 'scheduled']).default('draft'),
  distributionType: z.enum(['manual', 'smart', 'bulk']).default('bulk'),
  timeSettings: z.object({
    scheduledTime: z.string().optional(),
    timezone: z.string().default('Asia/Ho_Chi_Minh'),
    staggerMinutes: z.number().min(1).max(60).default(5)
  }).optional(),
  tagFilters: z.array(z.string()).optional(),
  antiSpam: z.object({
    enableJitter: z.boolean().default(true),
    jitterMinutes: z.number().min(0).max(30).default(3),
    respectCooldowns: z.boolean().default(true),
    skipInactiveAccounts: z.boolean().default(true)
  }).optional()
});

// 📅 POST /api/posts/schedule - Enhanced scheduling endpoint with proper validation
router.post('/schedule', requireAuth, requireCSRFProtection, async (req, res) => {
  try {
    console.log('📅 Posts API: Processing schedule request');
    
    // 1. Validate input using Zod schema
    let validatedInput;
    try {
      validatedInput = schedulePostsSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          code: 'INVALID_INPUT',
          details: error.errors
        });
      }
      throw error;
    }

    const { 
      contentIds,
      targetAccounts,
      schedulingMode,
      distributionType,
      timeSettings,
      tagFilters,
      antiSpam
    } = validatedInput;

    console.log(`📅 Posts API: ${contentIds.length} content → ${targetAccounts.length} accounts`);

    // 2. Validate content exists and is active
    const allContentItems = await storage.getContentLibraryItems();
    const contentItems = allContentItems.filter((item: any) => 
      contentIds.includes(item.id) && item.status === 'active'
    );
    
    if (contentItems.length !== contentIds.length) {
      const missingIds = contentIds.filter(id => !contentItems.find(item => item.id === id));
      return res.status(404).json({
        error: 'Content validation failed',
        code: 'CONTENT_NOT_FOUND',
        details: {
          missingIds,
          message: 'Some content items do not exist or are not active'
        }
      });
    }

    // 3. Validate accounts exist and filter by active/connected if requested
    const allSocialAccounts = await storage.getSocialAccounts();
    let socialAccounts = allSocialAccounts.filter(account => 
      targetAccounts.includes(account.id)
    );
    
    if (antiSpam?.skipInactiveAccounts) {
      socialAccounts = socialAccounts.filter(account => 
        account.isActive && account.connected
      );
      console.log(`📅 Filtered to ${socialAccounts.length} active/connected accounts`);
    }
    
    if (socialAccounts.length === 0) {
      return res.status(400).json({
        error: 'No valid accounts found',
        code: 'NO_VALID_ACCOUNTS',
        details: {
          message: antiSpam?.skipInactiveAccounts 
            ? 'No active and connected accounts found' 
            : 'No accounts found with provided IDs'
        }
      });
    }

    // 4. Calculate enhanced timing with anti-spam measures
    const scheduledPosts = [];
    const baseTime = timeSettings?.scheduledTime 
      ? new Date(timeSettings.scheduledTime) 
      : new Date(Date.now() + 60000); // Default +1 minute
    
    const staggerMinutes = timeSettings?.staggerMinutes || 5;
    const jitterEnabled = antiSpam?.enableJitter ?? true;
    const maxJitter = antiSpam?.jitterMinutes || 3;

    if (distributionType === 'bulk') {
      // Enhanced bulk scheduling with anti-spam measures
      for (let i = 0; i < contentItems.length; i++) {
        const content = contentItems[i];
        
        for (let j = 0; j < socialAccounts.length; j++) {
          const account = socialAccounts[j];
          
          // Platform compatibility check
          if (content.platforms && content.platforms.length > 0 && 
              !content.platforms.includes(account.platform)) {
            console.log(`⏭️ Skipping incompatible platform: ${account.platform} for content ${content.id}`);
            continue;
          }

          // Calculate staggered timing with jitter
          let scheduledTime = new Date(baseTime.getTime() + (j * staggerMinutes * 60 * 1000));
          
          if (jitterEnabled) {
            const jitterMs = Math.random() * maxJitter * 60 * 1000;
            scheduledTime = new Date(scheduledTime.getTime() + jitterMs);
          }

          // Map platform types to match scheduled_posts schema
          let mappedPlatform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' = 'facebook';
          if (account.platform === 'tiktok-business') {
            mappedPlatform = 'tiktok';
          } else if (['facebook', 'instagram', 'twitter'].includes(account.platform)) {
            mappedPlatform = account.platform as 'facebook' | 'instagram' | 'twitter';
          }

          // Create scheduled post with enhanced data
          const scheduledPost = {
            caption: content.baseContent || content.title,
            hashtags: [], // Content hashtags will be extracted from content or generated
            assetIds: content.assetIds || [],
            socialAccountId: account.id,
            platform: mappedPlatform,
            scheduledTime,
            timezone: timeSettings?.timezone || 'Asia/Ho_Chi_Minh',
            status: schedulingMode as 'draft' | 'pending_approval' | 'scheduled',
            analytics: {
              contentLibraryId: content.id,
              distributionType,
              antiSpamEnabled: jitterEnabled,
              source: 'posts_api'
            }
          };

          scheduledPosts.push(scheduledPost);
        }
      }
    } else {
      return res.status(501).json({
        error: 'Distribution type not implemented',
        code: 'NOT_IMPLEMENTED',
        message: `Distribution type '${distributionType}' is not yet implemented. Use 'bulk' for now.`
      });
    }

    // 5. Create scheduled posts in database
    const createdPosts = [];
    for (const postData of scheduledPosts) {
      try {
        const post = await storage.createScheduledPost(postData as any);
        createdPosts.push(post);
      } catch (error) {
        console.error(`❌ Failed to create scheduled post:`, error);
        // Continue creating other posts - don't fail the entire operation
      }
    }

    // 6. Update content usage statistics
    for (const content of contentItems) {
      try {
        await storage.incrementContentUsage(content.id);
      } catch (error) {
        console.error(`❌ Failed to increment usage for content ${content.id}:`, error);
      }
    }

    // 7. Return comprehensive response
    const response = {
      success: true,
      message: `Successfully scheduled ${createdPosts.length} posts`,
      data: {
        scheduledPosts: createdPosts.length,
        contentItems: contentItems.length,
        targetAccounts: socialAccounts.length,
        distributionType,
        schedulingMode,
        antiSpamMeasures: {
          jitterEnabled: antiSpam?.enableJitter ?? true,
          jitterMinutes: maxJitter,
          staggerMinutes,
          inactiveAccountsSkipped: antiSpam?.skipInactiveAccounts ?? true
        },
        timing: {
          firstPost: scheduledPosts.length > 0 ? scheduledPosts[0].scheduledTime : null,
          lastPost: scheduledPosts.length > 0 ? scheduledPosts[scheduledPosts.length - 1].scheduledTime : null
        }
      },
      posts: createdPosts
    };

    console.log(`✅ Posts API completed: ${createdPosts.length} posts scheduled`);
    res.json(response);

  } catch (error) {
    console.error('❌ Posts API scheduling error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'SCHEDULING_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;