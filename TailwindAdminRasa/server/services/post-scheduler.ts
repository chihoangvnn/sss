import { DatabaseStorage } from '../storage';
import { facebookPostingService } from './facebook-posting-service';
import { ScheduledPost, ContentAsset, SocialAccount, ContentLibrary } from '../../shared/schema';
import { jobOrchestrator } from './job-orchestrator';

export interface PostJobResult {
  success: boolean;
  postId?: string;
  error?: string;
  retryAfter?: number; // Minutes to wait before retry
}

export interface SmartScheduleOptions {
  targetTime: Date;
  platforms: string[];
  tags?: string[];
  priority?: 'high' | 'normal' | 'low';
  accountSelection?: 'all' | 'random' | 'round-robin';
  maxPostsPerAccount?: number;
}

export interface ContentSelectionResult {
  content: ContentLibrary;
  selectedAccounts: SocialAccount[];
  estimatedReach: number;
}

export class PostScheduler {
  private storage: DatabaseStorage;
  private isRunning: boolean = false;
  private jobInterval: NodeJS.Timeout | null = null;
  private readonly checkInterval = 60 * 1000; // Check every minute
  private readonly maxRetries = 3;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  /**
   * Start the background job scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('Post scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting post scheduler - checking every minute for scheduled posts');

    // Run immediately once, then set interval
    this.processScheduledPosts();
    
    this.jobInterval = setInterval(() => {
      this.processScheduledPosts();
    }, this.checkInterval);
  }

  /**
   * Stop the background job scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.jobInterval) {
      clearInterval(this.jobInterval);
      this.jobInterval = null;
    }

    this.isRunning = false;
    console.log('⏹️ Post scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; nextCheck?: Date } {
    return {
      running: this.isRunning,
      nextCheck: this.isRunning ? new Date(Date.now() + this.checkInterval) : undefined
    };
  }

  /**
   * Main method to process all scheduled posts
   * Enhanced to work with Job Orchestrator campaigns
   */
  private async processScheduledPosts(): Promise<void> {
    try {
      const scheduledPosts = await this.getReadyToPostPosts();
      
      if (scheduledPosts.length === 0) {
        return; // No posts ready
      }

      console.log(`📅 Found ${scheduledPosts.length} posts ready to publish`);

      // Separate orchestrator-managed and regular posts
      const orchestratorPosts = scheduledPosts.filter(post => 
        post.analytics && (post.analytics as any).orchestratorManaged
      );
      const regularPosts = scheduledPosts.filter(post => 
        !post.analytics || !(post.analytics as any).orchestratorManaged
      );

      console.log(`🎭 Orchestrator posts: ${orchestratorPosts.length}, Regular posts: ${regularPosts.length}`);

      // Process orchestrator-managed posts with campaign tracking
      for (const post of orchestratorPosts) {
        try {
          await this.processOrchestratorPost(post);
        } catch (error) {
          console.error(`❌ Failed to process orchestrator post ${post.id}:`, error);
          await this.handleOrchestratorPostFailure(post, error as Error);
        }
      }

      // Process regular posts
      for (const post of regularPosts) {
        try {
          await this.processPost(post);
        } catch (error) {
          console.error(`❌ Failed to process post ${post.id}:`, error);
          await this.handlePostFailure(post, error as Error);
        }
      }
    } catch (error) {
      console.error('❌ Error in processScheduledPosts:', error);
    }
  }

  /**
   * Get posts that are ready to be published
   */
  private async getReadyToPostPosts(): Promise<ScheduledPost[]> {
    const now = new Date();
    
    // Get all posts that are:
    // 1. Status is 'scheduled'
    // 2. Scheduled time has passed
    // 3. Haven't exceeded max retries
    const posts = await this.storage.getScheduledPostsToProcess(now);
    
    return posts.filter(post => 
      post.status === 'scheduled' && 
      (post.retryCount || 0) < this.maxRetries
    );
  }

  /**
   * Process a single orchestrator-managed post with campaign tracking
   */
  private async processOrchestratorPost(post: ScheduledPost): Promise<void> {
    console.log(`🎭 Processing orchestrator post ${post.id} for platform ${post.platform}`);
    
    const campaignId = (post.analytics as any)?.orchestrationPlan;
    const assignedWorker = (post.analytics as any)?.assignedWorker;
    
    // Update status to 'posting' to prevent duplicate processing
    await this.storage.updateScheduledPostStatus(post.id, 'posting');

    try {
      const result = await this.executePostInternal(post);
      
      if (result.success) {
        // Update post as completed
        await this.storage.updateScheduledPost(post.id, {
          status: 'posted',
          publishedAt: new Date(),
          analytics: {
            ...post.analytics,
            postedAt: new Date().toISOString(),
            workerExecuted: assignedWorker,
            campaignCompleted: true
          }
        });

        console.log(`✅ Orchestrator post ${post.id} published successfully`);
        
        // Notify orchestrator of completion
        if (campaignId) {
          await this.notifyOrchestratorCompletion(campaignId, post.id, true);
        }
      } else {
        throw new Error(result.error || 'Unknown posting error');
      }
    } catch (error) {
      console.error(`❌ Orchestrator post ${post.id} failed:`, error);
      
      // Notify orchestrator of failure
      if (campaignId) {
        await this.notifyOrchestratorCompletion(campaignId, post.id, false);
      }
      
      throw error;
    }
  }

  /**
   * Process a single scheduled post
   */
  private async processPost(post: ScheduledPost): Promise<void> {
    console.log(`🔄 Processing post ${post.id} for platform ${post.platform}`);

    // Update status to 'posting' to prevent duplicate processing
    await this.storage.updateScheduledPostStatus(post.id, 'posting');

    try {
      // Get social account details
      const socialAccount = await this.storage.getSocialAccountById(post.socialAccountId);
      if (!socialAccount) {
        throw new Error(`Social account ${post.socialAccountId} not found`);
      }

      // Check if platform is supported
      const supportedPlatforms = ['facebook']; // Only Facebook is currently implemented
      if (!supportedPlatforms.includes(post.platform)) {
        throw new Error(`Platform ${post.platform} is not yet implemented. Supported: ${supportedPlatforms.join(', ')}`);
      }

      // Get content assets if any
      const assets: ContentAsset[] = [];
      if (post.assetIds && post.assetIds.length > 0) {
        for (const assetId of post.assetIds) {
          const asset = await this.storage.getContentAsset(assetId);
          if (asset) assets.push(asset);
        }
      }

      // Build post message with hashtags
      const message = facebookPostingService.buildPostMessage(
        post.caption, 
        post.hashtags || []
      );

      // Post based on platform
      let result: PostJobResult;
      switch (post.platform) {
        case 'facebook':
          result = await this.postToFacebook(socialAccount, message, assets);
          break;
        default:
          throw new Error(`Unsupported platform: ${post.platform}`);
      }

      if (result.success && result.postId) {
        // Post successful
        await this.handlePostSuccess(post, result.postId);
        
        // Update Content Library usage if this was from Content Library
        if (post.analytics && typeof post.analytics === 'object') {
          const analytics = post.analytics as any;
          if (analytics.contentLibraryId) {
            await this.storage.incrementContentUsage(analytics.contentLibraryId);
          }
        }
      } else {
        // Post failed
        throw new Error(result.error || 'Unknown posting error');
      }

    } catch (error) {
      console.error(`❌ Post ${post.id} failed:`, error);
      await this.handlePostFailure(post, error as Error);
    }
  }

  /**
   * Post to Facebook
   */
  private async postToFacebook(
    socialAccount: SocialAccount, 
    message: string, 
    assets: ContentAsset[]
  ): Promise<PostJobResult> {
    try {
      // For Facebook, we need to determine which page to post to
      // For now, use the first available page token
      const pageTokens = socialAccount.pageAccessTokens as any[];
      if (!pageTokens || pageTokens.length === 0) {
        return { success: false, error: 'No Facebook page tokens found' };
      }

      const pageToken = pageTokens.find(token => token.status === 'active');
      if (!pageToken) {
        return { success: false, error: 'No active Facebook page tokens found' };
      }

      const imageUrls = assets.map(asset => asset.cloudinarySecureUrl);

      const result = await facebookPostingService.postToPage(
        pageToken.pageId,
        pageToken.accessToken,
        {
          message,
          imageUrls
        }
      );

      return {
        success: result.success,
        postId: result.postId,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Facebook posting failed'
      };
    }
  }

  /**
   * Post to Instagram (placeholder - requires Instagram Business API)
   */
  private async postToInstagram(
    socialAccount: SocialAccount, 
    message: string, 
    assets: ContentAsset[]
  ): Promise<PostJobResult> {
    // Instagram posting is more complex and requires Instagram Business API
    // For now, return not implemented
    return {
      success: false,
      error: 'Instagram posting not yet implemented'
    };
  }

  /**
   * Handle successful post
   */
  private async handlePostSuccess(post: ScheduledPost, platformPostId: string): Promise<void> {
    const now = new Date();
    
    await this.storage.updateScheduledPost(post.id, {
      status: 'posted',
      publishedAt: now,
      platformPostId: platformPostId,
      platformUrl: this.generatePostUrl(post.platform, platformPostId),
      updatedAt: now
    });

    console.log(`✅ Post ${post.id} published successfully: ${platformPostId}`);

    // Update asset usage count
    if (post.assetIds) {
      for (const assetId of post.assetIds) {
        await this.storage.incrementAssetUsage(assetId);
      }
    }
  }

  /**
   * Handle failed post
   */
  private async handlePostFailure(post: ScheduledPost, error: Error): Promise<void> {
    const retryCount = (post.retryCount || 0) + 1;
    const now = new Date();

    if (retryCount >= this.maxRetries) {
      // Max retries reached, mark as failed
      await this.storage.updateScheduledPost(post.id, {
        status: 'failed',
        retryCount,
        lastRetryAt: now,
        errorMessage: error.message,
        updatedAt: now
      });

      console.log(`❌ Post ${post.id} failed permanently after ${retryCount} attempts: ${error.message}`);
    } else {
      // Schedule retry
      const nextRetryTime = new Date(now.getTime() + (retryCount * 5 * 60 * 1000)); // Exponential backoff: 5min, 10min, 15min
      
      await this.storage.updateScheduledPost(post.id, {
        status: 'scheduled', // Set back to scheduled for retry
        retryCount,
        lastRetryAt: now,
        errorMessage: error.message,
        scheduledTime: nextRetryTime, // Reschedule
        updatedAt: now
      });

      console.log(`🔄 Post ${post.id} scheduled for retry ${retryCount}/${this.maxRetries} at ${nextRetryTime.toISOString()}`);
    }
  }

  /**
   * Generate platform-specific post URL
   */
  private generatePostUrl(platform: string, postId: string): string {
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/${postId}`;
      case 'instagram':
        return `https://www.instagram.com/p/${postId}/`;
      default:
        return '';
    }
  }

  /**
   * Get upcoming scheduled posts
   */
  async getUpcomingPosts(limit: number = 50): Promise<ScheduledPost[]> {
    return await this.storage.getUpcomingScheduledPosts(limit);
  }

  /**
   * Manually trigger a specific post
   */
  async triggerPost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const post = await this.storage.getScheduledPost(postId);
      if (!post) {
        return { success: false, error: 'Post not found' };
      }

      if (post.status !== 'scheduled' && post.status !== 'failed') {
        return { success: false, error: `Post is in ${post.status} status and cannot be triggered` };
      }

      await this.processPost(post);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to trigger post' 
      };
    }
  }

  // ===========================================
  // SMART SCHEDULER ENGINE
  // ===========================================

  /**
   * Select smart content from Content Library based on priority and tags
   */
  async selectSmartContent(options: {
    tags?: string[];
    priority?: 'high' | 'normal' | 'low';
    platforms?: string[];
    excludeRecentlyUsed?: boolean;
    limit?: number;
  }): Promise<ContentLibrary[]> {
    const { tags, priority, platforms, excludeRecentlyUsed = true, limit = 10 } = options;
    
    // Build filters for content selection
    const filters: any = {};
    if (tags && tags.length > 0) {
      filters.tags = tags;
    }
    if (priority) {
      filters.priority = priority;
    }
    filters.status = 'active'; // Only active content
    
    // Get content from Content Library
    let contentItems = await this.storage.getContentLibraryItems(filters);
    
    // Filter by platforms if specified
    if (platforms && platforms.length > 0) {
      contentItems = contentItems.filter(item => 
        !item.platforms || item.platforms.some(platform => platforms.includes(platform))
      );
    }
    
    // Exclude recently used content (within last 7 days)
    if (excludeRecentlyUsed) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      contentItems = contentItems.filter(item => 
        !item.lastUsed || new Date(item.lastUsed) < sevenDaysAgo
      );
    }
    
    // Sort by priority: high -> normal -> low, then by usage count (ascending)
    contentItems.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'normal'];
      const bPriority = priorityOrder[b.priority || 'normal'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Same priority, prefer less used content
      return (a.usageCount || 0) - (b.usageCount || 0);
    });
    
    return contentItems.slice(0, limit);
  }

  /**
   * Select accounts for smart distribution
   */
  async selectAccountsForDistribution(options: {
    platforms: string[];
    selectionMode: 'all' | 'random' | 'round-robin';
    maxAccountsPerPlatform?: number;
    excludeInactive?: boolean;
  }): Promise<SocialAccount[]> {
    const { platforms, selectionMode, maxAccountsPerPlatform = 3, excludeInactive = true } = options;
    
    let selectedAccounts: SocialAccount[] = [];
    
    for (const platform of platforms) {
      // Get all accounts for this platform
      let accounts = await this.storage.getSocialAccountsByPlatform(platform);
      
      // Filter out inactive accounts if requested
      if (excludeInactive) {
        accounts = accounts.filter(account => account.isActive && account.connected);
      }
      
      if (accounts.length === 0) continue;
      
      // Apply selection logic
      let selected: SocialAccount[] = [];
      
      switch (selectionMode) {
        case 'all':
          selected = accounts.slice(0, maxAccountsPerPlatform);
          break;
          
        case 'random':
          // Randomly select accounts
          const shuffled = [...accounts].sort(() => Math.random() - 0.5);
          selected = shuffled.slice(0, Math.min(maxAccountsPerPlatform, accounts.length));
          break;
          
        case 'round-robin':
          // Select accounts with least recent posts
          selected = accounts
            .sort((a, b) => {
              const aLastPost = a.lastPost ? new Date(a.lastPost).getTime() : 0;
              const bLastPost = b.lastPost ? new Date(b.lastPost).getTime() : 0;
              return aLastPost - bLastPost; // Oldest last post first
            })
            .slice(0, maxAccountsPerPlatform);
          break;
      }
      
      selectedAccounts.push(...selected);
    }
    
    return selectedAccounts;
  }

  /**
   * Generate smart schedule for Content Library items
   */
  async generateSmartSchedule(options: SmartScheduleOptions): Promise<ScheduledPost[]> {
    const {
      targetTime,
      platforms,
      tags,
      priority,
      accountSelection = 'round-robin',
      maxPostsPerAccount = 1
    } = options;
    
    console.log('🧠 Generating smart schedule with Content Library integration...');
    
    // 1. Select smart content from Content Library
    const contentItems = await this.selectSmartContent({
      tags,
      priority,
      platforms,
      excludeRecentlyUsed: true,
      limit: 20
    });
    
    if (contentItems.length === 0) {
      console.log('⚠️ No suitable content found in Content Library');
      return [];
    }
    
    console.log(`📚 Found ${contentItems.length} content items from Content Library`);
    
    // 2. Select accounts for distribution
    const selectedAccounts = await this.selectAccountsForDistribution({
      platforms,
      selectionMode: accountSelection,
      maxAccountsPerPlatform: maxPostsPerAccount,
      excludeInactive: true
    });
    
    if (selectedAccounts.length === 0) {
      console.log('⚠️ No suitable social accounts found for distribution');
      return [];
    }
    
    console.log(`👥 Selected ${selectedAccounts.length} accounts for distribution`);
    
    // 3. Create scheduled posts by distributing content to accounts
    const scheduledPosts: ScheduledPost[] = [];
    let contentIndex = 0;
    
    for (const account of selectedAccounts) {
      if (contentIndex >= contentItems.length) {
        contentIndex = 0; // Wrap around if we have more accounts than content
      }
      
      const content = contentItems[contentIndex];
      
      // Calculate target time with small random offset for natural distribution
      const offsetMinutes = Math.floor(Math.random() * 30); // 0-30 minute offset
      const scheduledTime = new Date(targetTime.getTime() + offsetMinutes * 60 * 1000);
      
      // Create scheduled post data
      const postData = {
        socialAccountId: account.id,
        platform: account.platform as 'facebook' | 'instagram' | 'twitter' | 'tiktok',
        caption: content.baseContent,
        hashtags: [], // Convert tagIds to hashtags later if needed
        assetIds: content.assetIds || [],
        scheduledTime,
        timezone: 'UTC',
        status: 'scheduled' as const,
        analytics: {
          // Store Content Library metadata for tracking
          contentLibraryId: content.id,
          smartGenerated: true,
          priority: content.priority,
          tagIds: content.tagIds
        } as any
      };
      
      try {
        const scheduledPost = await this.storage.createScheduledPost(postData);
        scheduledPosts.push(scheduledPost);
        
        // Note: Content usage will be incremented when post is actually published
        // This prevents counting scheduled posts that may never be published
        
        console.log(`✅ Scheduled post for ${account.platform} account (${account.name})`);
      } catch (error) {
        console.error(`❌ Failed to schedule post for ${account.platform}:`, error);
      }
      
      contentIndex++;
    }
    
    console.log(`🎯 Generated ${scheduledPosts.length} smart scheduled posts`);
    return scheduledPosts;
  }

  /**
   * Batch generate smart schedules for multiple time slots
   */
  async batchGenerateSmartSchedule(options: {
    startTime: Date;
    endTime: Date;
    intervalHours: number;
    platforms: string[];
    tags?: string[];
    priority?: 'high' | 'normal' | 'low';
    accountSelection?: 'all' | 'random' | 'round-robin';
  }): Promise<ScheduledPost[]> {
    const {
      startTime,
      endTime,
      intervalHours,
      platforms,
      tags,
      priority,
      accountSelection = 'round-robin'
    } = options;
    
    console.log('🔄 Batch generating smart schedules...');
    
    const allScheduledPosts: ScheduledPost[] = [];
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const posts = await this.generateSmartSchedule({
        targetTime: new Date(currentTime),
        platforms,
        tags,
        priority,
        accountSelection,
        maxPostsPerAccount: 1
      });
      
      allScheduledPosts.push(...posts);
      currentTime = new Date(currentTime.getTime() + intervalMs);
    }
    
    console.log(`🎉 Batch generated ${allScheduledPosts.length} smart scheduled posts`);
    return allScheduledPosts;
  }

  /**
   * Get content performance analytics
   */
  async getContentAnalytics(contentId: string): Promise<{
    totalPosts: number;
    totalReach: number;
    averageEngagement: number;
    platformBreakdown: Record<string, number>;
    recentPerformance: any[];
  }> {
    try {
      // Get all scheduled posts that used this content
      const posts = await this.storage.getScheduledPosts();
      const contentPosts = posts.filter(post => 
        post.analytics && 
        typeof post.analytics === 'object' && 
        (post.analytics as any).contentLibraryId === contentId
      );
      
      const platformBreakdown: Record<string, number> = {};
      let totalReach = 0;
      let totalEngagement = 0;
      
      for (const post of contentPosts) {
        platformBreakdown[post.platform] = (platformBreakdown[post.platform] || 0) + 1;
        
        if (post.analytics && typeof post.analytics === 'object') {
          const analytics = post.analytics as any;
          totalReach += analytics.reach || 0;
          totalEngagement += analytics.engagement || 0;
        }
      }
      
      return {
        totalPosts: contentPosts.length,
        totalReach,
        averageEngagement: contentPosts.length > 0 ? totalEngagement / contentPosts.length : 0,
        platformBreakdown,
        recentPerformance: contentPosts
          .filter(post => post.publishedAt)
          .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
          .slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting content analytics:', error);
      return {
        totalPosts: 0,
        totalReach: 0,
        averageEngagement: 0,
        platformBreakdown: {},
        recentPerformance: []
      };
    }
  }

  // =====================================
  // ORCHESTRATOR INTEGRATION METHODS
  // =====================================

  /**
   * Execute post using the same logic as processPost but return result
   */
  private async executePostInternal(post: ScheduledPost): Promise<PostJobResult> {
    try {
      // Get social account details
      const socialAccount = await this.storage.getSocialAccountById(post.socialAccountId);
      if (!socialAccount) {
        return { success: false, error: `Social account ${post.socialAccountId} not found` };
      }

      // Check if platform is supported
      const supportedPlatforms = ['facebook'];
      if (!supportedPlatforms.includes(post.platform)) {
        return { 
          success: false, 
          error: `Platform ${post.platform} is not yet implemented. Supported: ${supportedPlatforms.join(', ')}` 
        };
      }

      // Get content assets if any
      const assets: ContentAsset[] = [];
      if (post.assetIds && post.assetIds.length > 0) {
        for (const assetId of post.assetIds) {
          const asset = await this.storage.getContentAsset(assetId);
          if (asset) assets.push(asset);
        }
      }

      // Build post message with hashtags
      const message = facebookPostingService.buildPostMessage(
        post.caption, 
        post.hashtags || []
      );

      // Post based on platform
      switch (post.platform) {
        case 'facebook':
          return await this.postToFacebook(socialAccount, message, assets);
        default:
          return { success: false, error: `Unsupported platform: ${post.platform}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during post execution' 
      };
    }
  }

  /**
   * Notify orchestrator of post completion/failure
   */
  private async notifyOrchestratorCompletion(
    campaignId: string, 
    postId: string, 
    success: boolean
  ): Promise<void> {
    try {
      // Get current campaign status from orchestrator
      const campaign = jobOrchestrator.getCampaignStatus(campaignId);
      if (!campaign) {
        console.warn(`Campaign ${campaignId} not found in orchestrator`);
        return;
      }

      // Calculate updated progress
      const currentCompleted = campaign.progress.completedJobs;
      const currentFailed = campaign.progress.failedJobs;
      
      const updates = {
        completedJobs: success ? currentCompleted + 1 : currentCompleted,
        failedJobs: success ? currentFailed : currentFailed + 1,
        currentPhase: success ? 'execution' : 'execution_with_errors'
      };

      // Update orchestrator with progress
      await jobOrchestrator.updateCampaignProgress(campaignId, updates);
      
      console.log(`🎭 Notified orchestrator: Campaign ${campaignId}, Post ${postId}, Success: ${success}`);
    } catch (error) {
      console.error(`❌ Failed to notify orchestrator for campaign ${campaignId}:`, error);
    }
  }

  /**
   * Handle orchestrator post failure with campaign tracking
   */
  private async handleOrchestratorPostFailure(post: ScheduledPost, error: Error): Promise<void> {
    const campaignId = (post.analytics as any)?.orchestrationPlan;
    const retryCount = (post.retryCount || 0) + 1;
    
    if (retryCount < this.maxRetries) {
      // Schedule retry with orchestrator-aware logic
      const retryDelay = this.calculateRetryDelay(retryCount);
      const nextRetryAt = new Date(Date.now() + retryDelay * 60 * 1000);
      
      await this.storage.updateScheduledPost(post.id, {
        status: 'scheduled',
        retryCount,
        lastRetryAt: new Date(),
        scheduledTime: nextRetryAt,
        analytics: {
          ...post.analytics,
          lastError: error.message,
          retryHistory: [...((post.analytics as any)?.retryHistory || []), {
            attempt: retryCount,
            error: error.message,
            timestamp: new Date().toISOString()
          }]
        }
      });

      console.log(`🔄 Orchestrator post ${post.id} scheduled for retry ${retryCount}/${this.maxRetries} at ${nextRetryAt}`);
    } else {
      // Max retries exceeded - mark as failed
      await this.storage.updateScheduledPost(post.id, {
        status: 'failed',
        lastRetryAt: new Date(),
        analytics: {
          ...post.analytics,
          lastError: error.message,
          maxRetriesExceeded: true,
          failedAt: new Date().toISOString()
        }
      });

      console.error(`❌ Orchestrator post ${post.id} failed permanently after ${this.maxRetries} retries`);
      
      // Notify orchestrator of permanent failure
      if (campaignId) {
        await this.notifyOrchestratorCompletion(campaignId, post.id, false);
      }
    }
  }

  /**
   * Calculate retry delay for orchestrator posts (with exponential backoff)
   */
  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 2^retryCount minutes, max 60 minutes
    return Math.min(Math.pow(2, retryCount), 60);
  }
}

// Export singleton instance
export const postScheduler = new PostScheduler(new DatabaseStorage());