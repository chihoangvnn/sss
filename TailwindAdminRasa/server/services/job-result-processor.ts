import { storage } from '../storage';
import JobDistributionEngine from './job-distribution-engine';
import QueueService from './queue';

/**
 * Job Result Processing Service
 * Handles execution results from serverless workers and updates database accordingly
 */
class JobResultProcessor {
  /**
   * Process successful job completion from worker
   */
  static async processJobCompletion(
    jobId: string,
    workerId: string,
    result: {
      platformPostId?: string;
      platformUrl?: string;
      analytics?: any;
      executionTime?: number;
      region?: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
    updatedPost?: any;
  }> {
    try {
      console.log(`✅ Processing job completion: ${jobId} by worker ${workerId}`);

      // Find the job to get scheduled post ID
      const job = await QueueService.findJobById(jobId);
      if (!job || !job.data) {
        return {
          success: false,
          error: 'Job not found or invalid job data'
        };
      }

      const { scheduledPostId } = job.data;
      if (!scheduledPostId) {
        return {
          success: false,
          error: 'No scheduled post ID found in job data'
        };
      }

      // Update scheduled post with completion data
      const updatedPost = await storage.updateScheduledPost(scheduledPostId, {
        status: 'posted',
        publishedAt: new Date(),
        platformPostId: result.platformPostId,
        platformUrl: result.platformUrl,
        analytics: {
          postedBy: workerId,
          postedAt: new Date().toISOString(),
          executionTime: result.executionTime,
          region: result.region,
          platformAnalytics: result.analytics,
          jobId
        } as any
      });

      if (!updatedPost) {
        return {
          success: false,
          error: 'Failed to update scheduled post'
        };
      }

      // Update social account last post time
      await this.updateAccountLastPost(updatedPost.socialAccountId);

      // Log success metrics
      await this.logExecutionMetrics(workerId, result.region, {
        jobId,
        scheduledPostId,
        executionTime: result.executionTime,
        success: true
      });

      console.log(`✅ Job ${jobId} completed successfully - Post ${scheduledPostId} published`);

      return {
        success: true,
        updatedPost
      };

    } catch (error) {
      console.error(`❌ Failed to process job completion ${jobId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process job failure from worker
   */
  static async processJobFailure(
    jobId: string,
    workerId: string,
    failure: {
      error: string;
      errorCode?: string;
      shouldRetry?: boolean;
      retryAfter?: number;
      executionTime?: number;
      region?: string;
      platformError?: any;
    }
  ): Promise<{
    success: boolean;
    willRetry: boolean;
    error?: string;
  }> {
    try {
      console.log(`❌ Processing job failure: ${jobId} by worker ${workerId}`);

      // Find the job to get scheduled post ID and attempt info
      const job = await QueueService.findJobById(jobId);
      if (!job || !job.data) {
        return {
          success: false,
          willRetry: false,
          error: 'Job not found or invalid job data'
        };
      }

      const { scheduledPostId, maxRetries = 3 } = job.data;
      const currentAttempts = job.attemptsMade || 0;
      const willRetry = failure.shouldRetry !== false && currentAttempts < maxRetries;

      if (!scheduledPostId) {
        return {
          success: false,
          willRetry: false,
          error: 'No scheduled post ID found in job data'
        };
      }

      if (willRetry) {
        // Update with retry information
        await storage.updateScheduledPost(scheduledPostId, {
          status: 'scheduled', // Keep as scheduled for retry
          errorMessage: failure.error,
          retryCount: currentAttempts + 1,
          lastRetryAt: new Date(),
          analytics: {
            ...((await storage.getScheduledPost(scheduledPostId))?.analytics as any || {}),
            lastFailure: {
              error: failure.error,
              errorCode: failure.errorCode,
              failedBy: workerId,
              failedAt: new Date().toISOString(),
              attempt: currentAttempts + 1,
              region: failure.region,
              platformError: failure.platformError,
              jobId
            }
          } as any
        });

        console.log(`🔄 Job ${jobId} will retry - Attempt ${currentAttempts + 1}/${maxRetries}`);
      } else {
        // Mark as permanently failed
        await storage.updateScheduledPost(scheduledPostId, {
          status: 'failed',
          errorMessage: failure.error,
          retryCount: currentAttempts,
          lastRetryAt: new Date(),
          analytics: {
            finalFailure: {
              error: failure.error,
              errorCode: failure.errorCode,
              failedBy: workerId,
              failedAt: new Date().toISOString(),
              finalAttempt: currentAttempts,
              region: failure.region,
              platformError: failure.platformError,
              jobId
            }
          } as any
        });

        console.log(`💀 Job ${jobId} permanently failed after ${currentAttempts} attempts`);
      }

      // Log failure metrics
      await this.logExecutionMetrics(workerId, failure.region, {
        jobId,
        scheduledPostId,
        executionTime: failure.executionTime,
        success: false,
        error: failure.error,
        errorCode: failure.errorCode,
        willRetry
      });

      return {
        success: true,
        willRetry
      };

    } catch (error) {
      console.error(`❌ Failed to process job failure ${jobId}:`, error);
      return {
        success: false,
        willRetry: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process partial job progress update from worker
   */
  static async processJobProgress(
    jobId: string,
    workerId: string,
    progress: {
      status: 'started' | 'uploading' | 'processing' | 'posting' | 'analyzing';
      message?: string;
      progress?: number; // 0-100
      region?: string;
      startedAt?: string;
      estimatedCompletion?: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`📊 Processing job progress: ${jobId} - ${progress.status}`);

      // Update job progress in queue
      const job = await QueueService.findJobById(jobId);
      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        };
      }

      // Update job progress
      await job.updateProgress({
        workerId,
        status: progress.status,
        message: progress.message,
        progress: progress.progress,
        region: progress.region,
        updatedAt: new Date().toISOString()
      });

      // Update scheduled post status if applicable
      if (job.data?.scheduledPostId) {
        const statusMap: Record<string, string> = {
          'started': 'posting',
          'uploading': 'posting', 
          'processing': 'posting',
          'posting': 'posting',
          'analyzing': 'posting'
        };

        const newStatus = statusMap[progress.status] || 'posting';
        
        await storage.updateScheduledPost(job.data.scheduledPostId, {
          status: newStatus as any,
          analytics: {
            ...((await storage.getScheduledPost(job.data.scheduledPostId))?.analytics as any || {}),
            progressUpdates: [
              ...((await storage.getScheduledPost(job.data.scheduledPostId))?.analytics as any)?.progressUpdates || [],
              {
                status: progress.status,
                message: progress.message,
                progress: progress.progress,
                workerId,
                region: progress.region,
                timestamp: new Date().toISOString()
              }
            ]
          } as any
        });
      }

      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to process job progress ${jobId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update social account's last post timestamp
   */
  private static async updateAccountLastPost(socialAccountId: string): Promise<void> {
    try {
      await storage.updateSocialAccount(socialAccountId, {
        lastPost: new Date(),
        lastSync: new Date()
      });
    } catch (error) {
      console.error(`Failed to update account last post time for ${socialAccountId}:`, error);
    }
  }

  /**
   * Log execution metrics for analytics and monitoring
   */
  private static async logExecutionMetrics(
    workerId: string,
    region: string | undefined,
    metrics: {
      jobId: string;
      scheduledPostId: string;
      executionTime?: number;
      success: boolean;
      error?: string;
      errorCode?: string;
      willRetry?: boolean;
    }
  ): Promise<void> {
    try {
      // In production, this would log to analytics service
      // For now, just console log with structured data
      console.log('📊 Execution Metrics:', {
        timestamp: new Date().toISOString(),
        workerId,
        region: region || 'unknown',
        ...metrics
      });

      // Could store in a dedicated metrics table or send to external analytics
      // await storage.createExecutionMetric({ workerId, region, ...metrics });

    } catch (error) {
      console.error('Failed to log execution metrics:', error);
    }
  }

  /**
   * Get execution statistics for monitoring
   */
  static async getExecutionStats(
    timeframe?: { start: Date; end: Date },
    filters?: { 
      workerId?: string; 
      region?: string; 
      platform?: string 
    }
  ): Promise<{
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    retryingJobs: number;
    avgExecutionTime: number;
    successRate: number;
    byRegion: Record<string, { total: number; success: number; avgTime: number }>;
    byWorker: Record<string, { total: number; success: number; avgTime: number }>;
    errorBreakdown: Record<string, number>;
  }> {
    try {
      // Get scheduled posts within timeframe
      // Note: Using basic query for now - could be enhanced with timeframe filtering
      const allPosts = await storage.getScheduledPosts();
      const posts = allPosts.filter(post => 
        ['posted', 'failed'].includes(post.status) &&
        (!timeframe || (
          post.createdAt && 
          new Date(post.createdAt) >= timeframe.start &&
          new Date(post.createdAt) <= timeframe.end
        ))
      );

      const stats = {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        retryingJobs: 0,
        avgExecutionTime: 0,
        successRate: 0,
        byRegion: {} as Record<string, { total: number; success: number; avgTime: number }>,
        byWorker: {} as Record<string, { total: number; success: number; avgTime: number }>,
        errorBreakdown: {} as Record<string, number>
      };

      let totalExecutionTime = 0;
      let executionTimeCount = 0;

      for (const post of posts) {
        if (!post.analytics) continue;

        const analytics = post.analytics as any;
        const isSuccess = post.status === 'posted';
        
        stats.totalJobs++;
        if (isSuccess) {
          stats.successfulJobs++;
        } else {
          stats.failedJobs++;
        }

        // Region stats
        const region = analytics.region || 'unknown';
        if (!stats.byRegion[region]) {
          stats.byRegion[region] = { total: 0, success: 0, avgTime: 0 };
        }
        stats.byRegion[region].total++;
        if (isSuccess) stats.byRegion[region].success++;

        // Worker stats
        const workerId = analytics.postedBy || analytics.finalFailure?.failedBy || 'unknown';
        if (!stats.byWorker[workerId]) {
          stats.byWorker[workerId] = { total: 0, success: 0, avgTime: 0 };
        }
        stats.byWorker[workerId].total++;
        if (isSuccess) stats.byWorker[workerId].success++;

        // Execution time
        const execTime = analytics.executionTime || analytics.finalFailure?.executionTime;
        if (execTime) {
          totalExecutionTime += execTime;
          executionTimeCount++;
          
          // Add to region/worker avg time
          stats.byRegion[region].avgTime = 
            (stats.byRegion[region].avgTime * (stats.byRegion[region].total - 1) + execTime) / 
            stats.byRegion[region].total;
            
          stats.byWorker[workerId].avgTime = 
            (stats.byWorker[workerId].avgTime * (stats.byWorker[workerId].total - 1) + execTime) / 
            stats.byWorker[workerId].total;
        }

        // Error breakdown
        if (!isSuccess && analytics.finalFailure?.error) {
          const errorType = analytics.finalFailure.errorCode || 'unknown_error';
          stats.errorBreakdown[errorType] = (stats.errorBreakdown[errorType] || 0) + 1;
        }
      }

      // Calculate overall metrics
      stats.avgExecutionTime = executionTimeCount > 0 ? totalExecutionTime / executionTimeCount : 0;
      stats.successRate = stats.totalJobs > 0 ? (stats.successfulJobs / stats.totalJobs) * 100 : 0;

      return stats;

    } catch (error) {
      console.error('Failed to get execution stats:', error);
      return {
        totalJobs: 0,
        successfulJobs: 0,
        failedJobs: 0,
        retryingJobs: 0,
        avgExecutionTime: 0,
        successRate: 0,
        byRegion: {},
        byWorker: {},
        errorBreakdown: {}
      };
    }
  }

  /**
   * Cleanup old job results and analytics data
   */
  static async cleanupOldResults(olderThanDays: number = 30): Promise<{
    deletedPosts: number;
    deletedJobs: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      console.log(`🧹 Cleaning up job results older than ${olderThanDays} days`);

      // Clean up old completed/failed scheduled posts
      // Note: Using basic query for now - filter manually by date
      const allPosts = await storage.getScheduledPosts();
      const oldPosts = allPosts.filter(post => 
        ['posted', 'failed'].includes(post.status) &&
        post.createdAt &&
        new Date(post.createdAt) < cutoffDate
      );

      let deletedPosts = 0;
      for (const post of oldPosts) {
        await storage.deleteScheduledPost(post.id);
        deletedPosts++;
      }

      // Clean up old jobs from queues
      await QueueService.cleanupJobs(olderThanDays * 24 * 60 * 60 * 1000);
      const deletedJobs = 0; // QueueService.cleanupJobs doesn't return count yet

      console.log(`✅ Cleanup completed: ${deletedPosts} posts, ${deletedJobs} jobs deleted`);

      return { deletedPosts, deletedJobs };

    } catch (error) {
      console.error('Failed to cleanup old results:', error);
      return { deletedPosts: 0, deletedJobs: 0 };
    }
  }
}

export default JobResultProcessor;