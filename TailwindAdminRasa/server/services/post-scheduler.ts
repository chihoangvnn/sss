import { DatabaseStorage } from '../storage';
import { facebookPostingService } from './facebook-posting-service';
import { ScheduledPost, ContentAsset, SocialAccount } from '../../shared/schema';

export interface PostJobResult {
  success: boolean;
  postId?: string;
  error?: string;
  retryAfter?: number; // Minutes to wait before retry
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
   */
  private async processScheduledPosts(): Promise<void> {
    try {
      const scheduledPosts = await this.getReadyToPostPosts();
      
      if (scheduledPosts.length === 0) {
        return; // No posts ready
      }

      console.log(`📅 Found ${scheduledPosts.length} posts ready to publish`);

      // Process each post
      for (const post of scheduledPosts) {
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
      post.retryCount < this.maxRetries
    );
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
      const socialAccount = await this.storage.getSocialAccount(post.socialAccountId);
      if (!socialAccount) {
        throw new Error(`Social account ${post.socialAccountId} not found`);
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
        case 'instagram':
          result = await this.postToInstagram(socialAccount, message, assets);
          break;
        default:
          throw new Error(`Unsupported platform: ${post.platform}`);
      }

      if (result.success && result.postId) {
        // Post successful
        await this.handlePostSuccess(post, result.postId);
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
}

// Export singleton instance
export const postScheduler = new PostScheduler(new DatabaseStorage());