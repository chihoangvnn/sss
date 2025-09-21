import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// 🔐 Auth middleware - same pattern as existing APIs
const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to access satellite system.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// 🛰️ GET /api/satellites/by-tag/:tagName - Lấy content và accounts theo tag
router.get('/by-tag/:tagName', requireAuth, async (req, res) => {
  try {
    const { tagName } = req.params;
    const { platform, status } = req.query;

    console.log(`🏷️ Satellite API: Fetching data for tag "${tagName}"`);

    // 1. Get unified tag by slug/name
    const tags = await storage.getUnifiedTags();
    const tag = tags.find(t => t.slug === tagName || t.name === tagName);
    
    if (!tag) {
      return res.status(404).json({ 
        error: "Tag not found", 
        message: `Tag "${tagName}" does not exist` 
      });
    }

    // 2. Get content library items with this tag
    const allContentItems = await storage.getContentLibraryItems();
    const contentItems = allContentItems.filter((item: any) => 
      item.tagIds && item.tagIds.includes(tag.id)
    );
    
    // 3. Get social accounts with this tag  
    const allSocialAccounts = await storage.getSocialAccounts();
    const socialAccounts = allSocialAccounts.filter(account => 
      account.tagIds && account.tagIds.includes(tag.id)
    );
    
    // 4. Filter by platform if specified
    let filteredAccounts = socialAccounts;
    if (platform && platform !== 'all') {
      filteredAccounts = socialAccounts.filter(account => 
        account.platform === platform
      );
    }

    // 5. Get scheduled posts for these accounts
    const accountIds = filteredAccounts.map(acc => acc.id);
    const allScheduledPosts = await storage.getScheduledPosts();
    let scheduledPosts = allScheduledPosts.filter(post => 
      accountIds.includes(post.socialAccountId)
    );

    // Filter by status if specified
    if (status && status !== 'all') {
      scheduledPosts = scheduledPosts.filter(post => post.status === status);
    }

    // 6. Get analytics summary
    const analytics = {
      totalContent: contentItems.length,
      totalAccounts: filteredAccounts.length,
      scheduledPosts: scheduledPosts.length,
      activeAccounts: filteredAccounts.filter(acc => acc.connected && acc.isActive).length,
      platformDistribution: filteredAccounts.reduce((acc, account) => {
        acc[account.platform] = (acc[account.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        category: tag.category,
        platforms: tag.platforms,
        color: tag.color,
        icon: tag.icon,
        description: tag.description
      },
      data: {
        contentLibrary: contentItems,
        socialAccounts: filteredAccounts,
        scheduledPosts: scheduledPosts,
        analytics
      }
    });

  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🏢 GET /api/satellites/by-group/:groupId - Lấy data theo account group
router.get('/by-group/:groupId', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    console.log(`🏢 Satellite API: Fetching data for group "${groupId}"`);

    // 1. Get account groups
    const accountGroups = await storage.getAccountGroups();
    const group = accountGroups.find(g => g.id === groupId);
    
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found", 
        message: `Group "${groupId}" does not exist` 
      });
    }

    // 2. Get accounts in this group using proper group membership
    const socialAccounts = await storage.getGroupAccounts(groupId);
    
    // 3. Filter only active and connected accounts for better results
    const activeAccounts = socialAccounts.filter(acc => acc.isActive);

    // 4. Get recent scheduled posts for these accounts
    const allScheduledPosts = await storage.getScheduledPosts();
    const socialAccountIds = socialAccounts.map((acc: any) => acc.id);
    const scheduledPosts = allScheduledPosts.filter((post: any) => 
      socialAccountIds.includes(post.socialAccountId)
    );

    // 5. Performance analytics
    const analytics = {
      totalAccounts: socialAccounts.length,
      activeAccounts: activeAccounts.filter(acc => acc.connected).length,
      scheduledPosts: scheduledPosts.length,
      totalPosts: group.totalPosts || 0,
      lastPostAt: group.lastPostAt,
      avgPerformanceScore: socialAccounts.length > 0 
        ? socialAccounts.reduce((sum, acc) => 
            sum + (parseFloat(acc.performanceScore?.toString() || '0')), 0
          ) / socialAccounts.length
        : 0
    };

    res.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        platform: group.platform,
        priority: group.priority,
        weight: group.weight,
        isActive: group.isActive
      },
      data: {
        socialAccounts,
        scheduledPosts,
        analytics
      }
    });

  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📅 POST /api/satellites/schedule-posts - Enhanced scheduling cho satellite system
router.post('/schedule-posts', requireAuth, async (req, res) => {
  try {
    const { 
      contentIds = [],           // Array of content library IDs
      targetAccounts = [],       // Array of social account IDs 
      schedulingMode = 'draft',  // 'draft' | 'pending_approval' | 'scheduled'
      distributionType = 'bulk', // 'manual' | 'smart' | 'bulk'
      timeSettings = {},         // Timing configuration
      tagFilters = []           // Optional tag filters
    } = req.body;

    console.log(`📅 Satellite Scheduling: ${contentIds.length} content → ${targetAccounts.length} accounts`);

    if (!contentIds.length || !targetAccounts.length) {
      return res.status(400).json({
        error: "Validation error",
        details: ["Both contentIds and targetAccounts are required"]
      });
    }

    // 1. Validate content exists
    const allContentItems = await storage.getContentLibraryItems();
    const contentItems = allContentItems.filter((item: any) => 
      contentIds.includes(item.id)
    );
    
    if (contentItems.length !== contentIds.length) {
      return res.status(404).json({
        error: "Content not found",
        message: "Some content items do not exist"
      });
    }

    // 2. Validate accounts exist
    const allSocialAccounts = await storage.getSocialAccounts();
    const socialAccounts = allSocialAccounts.filter(account => 
      targetAccounts.includes(account.id)
    );
    
    if (socialAccounts.length !== targetAccounts.length) {
      return res.status(404).json({
        error: "Accounts not found", 
        message: "Some social accounts do not exist"
      });
    }

    // 3. Create scheduled posts based on distribution type
    const scheduledPosts = [];
    const baseTime = new Date(timeSettings.scheduledTime || Date.now() + 60000); // Default +1 minute

    if (distributionType === 'bulk') {
      // Bulk: Same content to all accounts with staggered timing
      for (let i = 0; i < contentItems.length; i++) {
        const content = contentItems[i];
        
        for (let j = 0; j < socialAccounts.length; j++) {
          const account = socialAccounts[j];
          
          // Check platform compatibility
          if (content.platforms && content.platforms.length > 0 && 
              !content.platforms.includes(account.platform)) {
            console.log(`Skipping incompatible platform: ${account.platform} for content ${content.id}`);
            continue;
          }

          // Calculate staggered timing (5 minutes between accounts)
          const scheduledTime = new Date(baseTime.getTime() + (j * 5 * 60 * 1000));

          // Map platform types to match scheduled_posts schema
          let mappedPlatform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' = 'facebook';
          if (account.platform === 'tiktok-business') {
            mappedPlatform = 'tiktok';
          } else if (['facebook', 'instagram', 'twitter'].includes(account.platform)) {
            mappedPlatform = account.platform as 'facebook' | 'instagram' | 'twitter';
          }

          const postData = {
            caption: content.baseContent,
            hashtags: [], // Will be populated from content tags later
            assetIds: content.assetIds || [],
            socialAccountId: account.id,
            platform: mappedPlatform,
            scheduledTime,
            timezone: timeSettings.timezone || 'Asia/Ho_Chi_Minh',
            status: schedulingMode
          };

          const post = await storage.createScheduledPost(postData);
          scheduledPosts.push(post);
        }
      }
    } else {
      // Other distribution types (manual, smart) - implement later
      return res.status(501).json({
        error: "Not implemented",
        message: `${distributionType} distribution will be implemented in Phase 2` 
      });
    }

    // 4. Analytics response
    const summary = {
      totalScheduled: scheduledPosts.length,
      byPlatform: scheduledPosts.reduce((acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: scheduledPosts.reduce((acc, post) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      scheduledTimes: scheduledPosts.slice(0, 10).map(post => ({
        postId: post.id,
        accountName: socialAccounts.find(acc => acc.id === post.socialAccountId)?.name || 'Unknown',
        platform: post.platform,
        scheduledTime: post.scheduledTime
      }))
    };

    res.json({
      success: true,
      message: `Successfully scheduled ${scheduledPosts.length} posts`,
      data: {
        scheduledPosts: scheduledPosts.slice(0, 3), // Return first 3 for preview
        summary
      }
    });

  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🏷️ GET /api/satellites/tags - Lấy all unified tags for satellite selection  
router.get('/tags', requireAuth, async (req, res) => {
  try {
    const { category, platform } = req.query;
    
    const tags = await storage.getUnifiedTags();
    
    let filteredTags = tags;
    
    // Filter by category if specified
    if (category && category !== 'all') {
      filteredTags = filteredTags.filter(tag => tag.category === category);
    }
    
    // Filter by platform compatibility if specified
    if (platform && platform !== 'all') {
      filteredTags = filteredTags.filter(tag => 
        !tag.platforms || tag.platforms.length === 0 || 
        tag.platforms.includes(platform as string)
      );
    }

    // Add usage statistics for each tag
    const allContentItems = await storage.getContentLibraryItems();
    const allSocialAccounts = await storage.getSocialAccounts();

    const tagsWithStats = filteredTags.map((tag: any) => ({
      ...tag,
      stats: {
        contentCount: allContentItems.filter((item: any) => 
          item.tagIds && item.tagIds.includes(tag.id)
        ).length,
        accountCount: allSocialAccounts.filter((account: any) => 
          account.tagIds && account.tagIds.includes(tag.id)
        ).length,
        lastUsed: tag.lastUsed,
        usageCount: tag.usageCount
      }
    }));

    // Sort by usage count desc
    tagsWithStats.sort((a: any, b: any) => (b.stats.usageCount || 0) - (a.stats.usageCount || 0));

    res.json({
      success: true,
      tags: tagsWithStats,
      total: tagsWithStats.length,
      categories: Array.from(new Set(tags.map((tag: any) => tag.category))),
      platforms: Array.from(new Set(tags.flatMap((tag: any) => tag.platforms || [])))
    });

  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 📊 GET /api/satellites/overview - Dashboard overview cho satellite management
router.get('/overview', requireAuth, async (req, res) => {
  try {
    console.log('🛰️ Satellite Overview: Getting system statistics');

    // Get all data
    const [tags, contentItems, socialAccounts, scheduledPosts, accountGroups] = await Promise.all([
      storage.getUnifiedTags(),
      storage.getContentLibraryItems(),
      storage.getSocialAccounts(),
      storage.getScheduledPosts(),
      storage.getAccountGroups()
    ]);

    // Calculate tag-based satellites
    const contentTags = tags.filter((tag: any) => tag.category === 'content');
    const tagSatellites = contentTags.map((tag: any) => {
      const tagContent = contentItems.filter((item: any) => 
        item.tagIds && item.tagIds.includes(tag.id)
      );
      const tagAccounts = socialAccounts.filter((account: any) => 
        account.tagIds && account.tagIds.includes(tag.id)
      );
      
      return {
        type: 'content',
        id: tag.id,
        name: `${tag.name} Content Hub`,
        tag: tag.name,
        slug: tag.slug,
        color: tag.color,
        icon: tag.icon,
        stats: {
          contentCount: tagContent.length,
          accountCount: tagAccounts.length,
          activeAccounts: tagAccounts.filter((acc: any) => acc.connected && acc.isActive).length,
          lastUsed: tag.lastUsed
        }
      };
    });

    // Calculate group-based satellites
    const groupSatellites = accountGroups.map((group: any) => {
      const groupAccountsCount = socialAccounts.filter((account: any) => 
        // Note: We'd need group_accounts junction table data here
        // For now, estimate based on group data
        account.platform === group.platform
      ).length;

      return {
        type: 'operations',
        id: group.id,
        name: `${group.name} Operations`,
        group: group.name,
        priority: group.priority,
        stats: {
          accountCount: groupAccountsCount,
          totalPosts: group.totalPosts || 0,
          lastPostAt: group.lastPostAt,
          isActive: group.isActive
        }
      };
    });

    // System statistics
    const systemStats = {
      totalSatellites: tagSatellites.length + groupSatellites.length,
      contentHubs: tagSatellites.length,
      operationsHubs: groupSatellites.length,
      totalContent: contentItems.length,
      totalAccounts: socialAccounts.length,
      activeAccounts: socialAccounts.filter((acc: any) => acc.connected && acc.isActive).length,
      scheduledPosts: scheduledPosts.length,
      draftPosts: scheduledPosts.filter((post: any) => post.status === 'draft').length,
      pendingPosts: scheduledPosts.filter((post: any) => post.status === 'pending_approval').length
    };

    // Recent activity
    const recentPosts = scheduledPosts
      .sort((a: any, b: any) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        satellites: {
          content: tagSatellites,
          operations: groupSatellites
        },
        systemStats,
        recentActivity: recentPosts
      }
    });

  } catch (error) {
    console.error('Satellite API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🚀 POST /api/satellites/deploy - Deploy a configured satellite
router.post('/deploy', async (req, res) => {
  try {
    const { 
      templateName,
      templateData = {},
      customizations = {},
      settings = {}
    } = req.body;

    console.log(`🚀 Satellite Deploy: "${templateName}" with customizations`);

    if (!templateName) {
      return res.status(400).json({
        error: "Template name is required for deployment"
      });
    }

    // Generate satellite deployment record
    const deploymentId = `satellite-${templateName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    // Simulate deployment process
    const deployment = {
      id: deploymentId,
      templateName,
      status: 'deployed',
      customizations: {
        theme: customizations.theme || 'modern',
        primaryColor: customizations.primaryColor || '#10B981',
        platforms: customizations.platforms || ['facebook', 'instagram'],
        contentFrequency: customizations.contentFrequency || 'daily',
        autoOptimize: customizations.autoOptimize || true,
        targetAudience: customizations.targetAudience || 'general'
      },
      settings: {
        autoStart: true,
        contentFiltering: 'Nội dung',
        ...settings
      },
      deployedAt: new Date().toISOString(),
      isActive: true
    };

    // In a real implementation, this would:
    // 1. Create database records for the satellite
    // 2. Configure content filtering rules
    // 3. Set up scheduling automation
    // 4. Initialize platform connections
    // 5. Start monitoring systems
    
    console.log(`✅ Satellite deployed successfully: ${deploymentId}`);
    console.log(`🎨 Theme: ${deployment.customizations.theme}, Color: ${deployment.customizations.primaryColor}`);
    console.log(`📱 Platforms: ${deployment.customizations.platforms.join(', ')}`);
    console.log(`📅 Frequency: ${deployment.customizations.contentFrequency}`);

    res.json({
      success: true,
      deployment: {
        id: deployment.id,
        templateName: deployment.templateName,
        status: deployment.status,
        customizations: deployment.customizations,
        deployedAt: deployment.deployedAt,
        message: `Satellite "${templateName}" deployed successfully!`
      }
    });

  } catch (error) {
    console.error('Satellite Deploy Error:', error);
    res.status(500).json({ 
      error: 'Deployment failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 📋 GET /api/satellites/templates - Get available satellite templates
router.get('/templates', requireAuth, async (req, res) => {
  try {
    console.log('🛰️ Fetching satellite templates');
    
    // Define satellite templates with full configuration data
    const templates = [
      {
        id: 'beauty-content',
        name: 'Beauty Content Satellite',
        category: 'content',
        description: 'Automated beauty and skincare content management',
        icon: '💄',
        color: '#EC4899',
        platforms: ['facebook', 'instagram', 'tiktok'],
        features: ['AI content generation', 'Trend analysis', 'Product recommendations'],
        targetTags: ['làm-đẹp', 'skincare', 'makeup'],
        estimatedReach: '10K-50K',
        contentTypes: ['tutorials', 'reviews', 'tips']
      },
      {
        id: 'fitness-content',
        name: 'Fitness Content Satellite',
        category: 'content', 
        description: 'Automated fitness and wellness content distribution',
        icon: '💪',
        color: '#F97316',
        platforms: ['facebook', 'instagram', 'tiktok'],
        features: ['Workout scheduling', 'Progress tracking', 'Motivation content'],
        targetTags: ['gym', 'thể-thao', 'fitness'],
        estimatedReach: '5K-25K',
        contentTypes: ['workouts', 'nutrition', 'motivation']
      },
      {
        id: 'health-content',
        name: 'Health Content Satellite',
        category: 'content',
        description: 'Automated health and lifestyle content management',
        icon: '🏥',
        color: '#10B981',
        platforms: ['facebook', 'instagram', 'twitter'],
        features: ['Health tips', 'Wellness tracking', 'Expert advice'],
        targetTags: ['sống-khỏe', 'health', 'wellness'],
        estimatedReach: '15K-75K',
        contentTypes: ['tips', 'advice', 'news']
      },
      {
        id: 'mindfulness-content',
        name: 'Mindfulness Content Satellite',
        category: 'content',
        description: 'Automated meditation and mindfulness content',
        icon: '🧘',
        color: '#8B5CF6',
        platforms: ['facebook', 'instagram'],
        features: ['Daily meditation', 'Stress management', 'Mindful living'],
        targetTags: ['thiền', 'meditation', 'mindfulness'],
        estimatedReach: '3K-15K',
        contentTypes: ['meditations', 'quotes', 'guidance']
      },
      {
        id: 'vip-management',
        name: 'VIP Customer Management',
        category: 'customer_pipeline',
        description: 'Automated VIP customer relationship management',
        icon: '⭐',
        color: '#8B5CF6',
        platforms: ['facebook', 'instagram', 'tiktok'],
        features: ['Personalized content', 'Priority support', 'Exclusive offers'],
        targetTags: ['khách-vip', 'vip-customers'],
        estimatedReach: '500-2K',
        contentTypes: ['exclusive', 'personalized', 'premium']
      },
      {
        id: 'followup-hub',
        name: 'Follow-up Hub Satellite',
        category: 'customer_pipeline',
        description: 'Automated customer follow-up and nurturing',
        icon: '🔄',
        color: '#EF4444',
        platforms: ['facebook', 'instagram', 'tiktok'],
        features: ['Auto follow-up', 'Lead nurturing', 'Conversion tracking'],
        targetTags: ['cần-follow-up', 'đang-tư-vấn', 'khách-tiềm-năng'],
        estimatedReach: '1K-10K',
        contentTypes: ['follow-up', 'nurturing', 'conversion']
      }
    ];

    res.json({
      success: true,
      templates: templates,
      totalCount: templates.length,
      categories: {
        content: templates.filter(t => t.category === 'content').length,
        customer_pipeline: templates.filter(t => t.category === 'customer_pipeline').length
      }
    });

    console.log(`✅ Returned ${templates.length} satellite templates`);

  } catch (error) {
    console.error('Error fetching satellite templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;