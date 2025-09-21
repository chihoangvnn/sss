import { v4 as uuidv4 } from 'uuid';
import QueueService, { PostJobPayload } from './queue';
import { storage } from '../storage';
import type { ScheduledPost, SocialAccount } from '@shared/schema';

/**
 * Job Distribution Engine
 * Handles converting scheduled posts into distributed queue jobs
 * Routes jobs to appropriate regions based on account assignments
 */
class JobDistributionEngine {
  /**
   * Default region mapping for different platforms
   */
  private static readonly DEFAULT_REGIONS: Record<string, string> = {
    facebook: 'us-east-1',
    instagram: 'us-east-1', 
    twitter: 'us-west-2',
    tiktok: 'ap-southeast-1'
  };

  /**
   * Enqueue jobs for scheduled posts
   * This is the main entry point for distributing posts to workers
   */
  static async enqueueForAccounts(
    scheduledPostIds: string[],
    options?: {
      forceRegion?: string;
      delay?: number;
      priority?: number;
    }
  ): Promise<{
    success: boolean;
    enqueuedJobs: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let enqueuedJobs = 0;

    for (const scheduledPostId of scheduledPostIds) {
      try {
        const result = await this.enqueuePost(scheduledPostId, options);
        if (result.success) {
          enqueuedJobs++;
        } else {
          errors.push(`${scheduledPostId}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${scheduledPostId}: ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      enqueuedJobs,
      errors
    };
  }

  /**
   * Enqueue a single scheduled post
   */
  private static async enqueuePost(
    scheduledPostId: string,
    options?: {
      forceRegion?: string;
      delay?: number;
      priority?: number;
    }
  ): Promise<{ success: boolean; error?: string; jobId?: string }> {
    try {
      // Get scheduled post details
      const scheduledPost = await storage.getScheduledPost(scheduledPostId);
      if (!scheduledPost) {
        return { success: false, error: 'Scheduled post not found' };
      }

      // Get social account details
      const socialAccount = await storage.getSocialAccount(scheduledPost.socialAccountId);
      if (!socialAccount) {
        return { success: false, error: 'Social account not found' };
      }

      // Determine target region
      const region = this.determineRegion(socialAccount, options?.forceRegion);
      
      // Create job payload
      const jobPayload = await this.createJobPayload(scheduledPost, socialAccount);
      
      // Enqueue job
      const job = await QueueService.addJob(
        scheduledPost.platform,
        region,
        jobPayload,
        {
          delay: options?.delay,
          priority: options?.priority
        }
      );

      // Update scheduled post with job metadata
      await this.updatePostJobMeta(scheduledPostId, {
        jobId: job.id as string,
        queueName: `posts:${scheduledPost.platform}:${region}`,
        region,
        enqueuedAt: new Date().toISOString(),
        status: 'enqueued'
      });

      console.log(`📤 Enqueued post ${scheduledPostId} as job ${job.id} in region ${region}`);
      
      return { success: true, jobId: job.id as string };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to enqueue post ${scheduledPostId}:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Create job payload from scheduled post and social account
   */
  private static async createJobPayload(
    scheduledPost: ScheduledPost,
    socialAccount: SocialAccount
  ): Promise<PostJobPayload> {
    // DO NOT include credentials in job payload for security
    // Credentials will be fetched via /api/workers/credentials when needed

    return {
      jobId: uuidv4(),
      scheduledPostId: scheduledPost.id,
      platform: scheduledPost.platform as 'facebook' | 'instagram' | 'twitter' | 'tiktok',
      accountId: socialAccount.accountId,
      region: region, // Set to computed region
      content: {
        caption: scheduledPost.caption,
        hashtags: (scheduledPost.hashtags as string[]) || [],
        assetIds: (scheduledPost.assetIds as string[]) || []
      },
      targetAccount: {
        id: socialAccount.accountId,
        name: socialAccount.name
        // pageAccessToken REMOVED for security - fetch via /credentials endpoint
      },
      idempotencyKey: `${scheduledPost.id}`, // Stable key for deduplication
      attempt: 1,
      maxRetries: 3,
      scheduledTime: typeof scheduledPost.scheduledTime === 'string' 
        ? scheduledPost.scheduledTime 
        : (scheduledPost.scheduledTime?.toISOString() || new Date().toISOString()),
      timezone: scheduledPost.timezone || 'UTC'
    };
  }

  /**
   * Determine the best region for a social account
   */
  private static determineRegion(socialAccount: SocialAccount, forceRegion?: string): string {
    if (forceRegion) {
      return forceRegion;
    }

    // Check if account has specific region preference
    const settings = socialAccount.contentPreferences as any;
    if (settings?.region) {
      return settings.region;
    }

    // Check account group region assignment (future feature)
    // if (socialAccount.groupId) {
    //   const group = await storage.getAccountGroupById(socialAccount.groupId);
    //   if (group?.settings?.region) return group.settings.region;
    // }

    // Use platform default
    return this.DEFAULT_REGIONS[socialAccount.platform] || 'us-east-1';
  }

  /**
   * Update scheduled post with job metadata
   */
  private static async updatePostJobMeta(
    scheduledPostId: string,
    jobMeta: {
      jobId: string;
      queueName: string;
      region: string;
      enqueuedAt: string;
      status: string;
      workerId?: string;
      dispatchedAt?: string;
      completedAt?: string;
      error?: string;
    }
  ): Promise<void> {
    try {
      await storage.updateScheduledPost(scheduledPostId, {
        status: 'posting', // Update status to show it's being processed
        // Store job metadata in analytics field for now (avoiding schema changes)
        analytics: {
          jobMeta,
          updatedAt: new Date().toISOString()
        } as any
      });
    } catch (error) {
      console.error(`Failed to update job metadata for post ${scheduledPostId}:`, error);
    }
  }

  /**
   * Get job status for scheduled posts
   */
  static async getJobStatus(scheduledPostIds: string[]): Promise<Record<string, any>> {
    const statuses: Record<string, any> = {};

    for (const postId of scheduledPostIds) {
      try {
        const post = await storage.getScheduledPost(postId);
        if (post && post.analytics) {
          const analytics = JSON.parse(post.analytics as string);
          statuses[postId] = analytics.jobMeta || { status: 'unknown' };
        } else {
          statuses[postId] = { status: 'not_enqueued' };
        }
      } catch (error) {
        statuses[postId] = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return statuses;
  }

  /**
   * Retry failed jobs
   */
  static async retryFailedJobs(scheduledPostIds: string[]): Promise<{
    success: boolean;
    retriedJobs: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let retriedJobs = 0;

    for (const postId of scheduledPostIds) {
      try {
        const post = await storage.getScheduledPost(postId);
        if (!post) {
          errors.push(`${postId}: Post not found`);
          continue;
        }

        // Reset status and re-enqueue
        await storage.updateScheduledPost(postId, {
          status: 'scheduled',
          analytics: null
        });

        const result = await this.enqueuePost(postId);
        if (result.success) {
          retriedJobs++;
        } else {
          errors.push(`${postId}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${postId}: ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      retriedJobs,
      errors
    };
  }

  /**
   * Get distribution statistics
   */
  static async getDistributionStats(): Promise<{
    totalEnqueued: number;
    byPlatform: Record<string, number>;
    byRegion: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    // Get queue stats from QueueService
    const queueStats = await QueueService.getQueueStats();
    
    const stats = {
      totalEnqueued: 0,
      byPlatform: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    };

    // Parse queue names and aggregate stats
    for (const [queueName, queueData] of Object.entries(queueStats)) {
      if (typeof queueData === 'object' && queueData.total) {
        const [, platform, region] = queueName.split(':');
        
        stats.totalEnqueued += queueData.total;
        stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + queueData.total;
        stats.byRegion[region] = (stats.byRegion[region] || 0) + queueData.total;
        
        // Aggregate by job status
        for (const [status, count] of Object.entries(queueData)) {
          if (status !== 'total' && typeof count === 'number') {
            stats.byStatus[status] = (stats.byStatus[status] || 0) + count;
          }
        }
      }
    }

    return stats;
  }
}

export default JobDistributionEngine;