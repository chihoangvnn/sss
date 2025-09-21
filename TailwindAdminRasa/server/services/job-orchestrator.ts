import { DatabaseStorage } from '../storage';
import { WorkerManagementService } from './worker-management';
import { storage } from '../storage';
import QueueService from './queue';
import type { 
  ScheduledPost, 
  SocialAccount, 
  ContentLibrary,
  Worker,
  AccountGroup 
} from '../../shared/schema';

/**
 * 🎭 TRỢ LÝ GIÁM ĐỐC (Job Orchestrator)
 * 
 * Layer trung gian thông minh giữa Satellite Hub và Worker Management.
 * Chịu trách nhiệm phân tích, tối ưu và phân phối công việc cho các "Cánh Tay" (Workers).
 * 
 * Workflow:
 * 1. Satellite Hub → Strategy Definition 
 * 2. Job Orchestrator → Intelligent Analysis & Distribution
 * 3. Worker Management → Execution
 */

export interface SatelliteStrategy {
  templateName: string;
  templateType: 'content' | 'customer_pipeline';
  targetContent: ContentLibrary[];
  targetAccounts: SocialAccount[];
  targetGroups?: AccountGroup[];
  customizations: {
    theme: string;
    primaryColor: string;
    platforms: string[];
    contentFrequency: 'low' | 'normal' | 'high';
  };
  schedulingRules?: {
    timeSlots?: string[];
    timezone?: string;
    maxPostsPerDay?: number;
    cooldownMinutes?: number;
  };
}

export interface OrchestrationPlan {
  campaignId: string;
  strategy: SatelliteStrategy;
  jobDistribution: {
    workerId: string;
    posts: ScheduledPost[];
    estimatedDuration: number;
    region: string;
    capabilities: string[];
  }[];
  timeline: {
    startTime: Date;
    estimatedEndTime: Date;
    totalJobs: number;
    concurrentWorkers: number;
  };
  antiDetection: {
    ipDiversityScore: number;
    timingVariation: number;
    geographicSpread: string[];
  };
}

export interface CampaignExecution {
  campaignId: string;
  status: 'planning' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';
  plan: OrchestrationPlan;
  progress: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    activeWorkers: number;
    currentPhase: string;
  };
  metrics: {
    startedAt?: Date;
    completedAt?: Date;
    avgExecutionTime: number;
    successRate: number;
    throughput: number;
  };
}

/**
 * Job Orchestrator Service - "Trợ lý Giám đốc" thông minh
 */
export class JobOrchestrator {
  private static instance: JobOrchestrator;
  private storage: DatabaseStorage;
  private workerManager: WorkerManagementService;
  private activeCampaigns: Map<string, CampaignExecution> = new Map();

  constructor() {
    this.storage = storage;
    this.workerManager = WorkerManagementService.getInstance();
  }

  static getInstance(): JobOrchestrator {
    if (!JobOrchestrator.instance) {
      JobOrchestrator.instance = new JobOrchestrator();
    }
    return JobOrchestrator.instance;
  }

  // =====================================
  // STRATEGY INTEGRATION WITH SATELLITE HUB
  // =====================================

  /**
   * Receive strategy from Satellite Hub and create orchestration plan
   */
  async planCampaignFromSatellite(strategy: SatelliteStrategy): Promise<OrchestrationPlan> {
    console.log(`🎭 Trợ lý Giám đốc: Planning campaign for ${strategy.templateName}`);

    const campaignId = this.generateCampaignId();
    
    // 1. Analyze available workers
    const workerAnalysis = await this.analyzeWorkerCapacity(strategy.customizations.platforms);
    
    // 2. Optimize job distribution
    const jobDistribution = await this.createOptimalDistribution(
      strategy,
      workerAnalysis
    );

    // 3. Calculate anti-detection metrics
    const antiDetection = await this.calculateAntiDetectionScore(jobDistribution);

    // 4. Create timeline
    const timeline = this.calculateTimeline(jobDistribution);

    const plan: OrchestrationPlan = {
      campaignId,
      strategy,
      jobDistribution,
      timeline,
      antiDetection
    };

    console.log(`📊 Plan created: ${jobDistribution.length} workers, ${timeline.totalJobs} jobs`);
    return plan;
  }

  /**
   * Analyze worker capacity and performance
   */
  private async analyzeWorkerCapacity(platforms: string[]): Promise<{
    availableWorkers: Worker[];
    totalCapacity: number;
    regionDistribution: Record<string, number>;
    performanceMetrics: Record<string, number>;
  }> {
    const availableWorkers: Worker[] = [];
    let totalCapacity = 0;
    const regionDistribution: Record<string, number> = {};
    const performanceMetrics: Record<string, number> = {};

    for (const platform of platforms) {
      const allWorkers = await this.storage.getWorkers();
      const workers = allWorkers.filter((w: Worker) => w.platforms.includes(platform as any));
      const onlineWorkers = workers.filter((w: Worker) => w.isOnline && w.isEnabled);
      
      availableWorkers.push(...onlineWorkers);
      
      for (const worker of onlineWorkers) {
        totalCapacity += worker.maxConcurrentJobs || 1;
        regionDistribution[worker.region] = (regionDistribution[worker.region] || 0) + 1;
        performanceMetrics[worker.workerId] = worker.successRate || 0;
      }
    }

    return {
      availableWorkers,
      totalCapacity,
      regionDistribution,
      performanceMetrics
    };
  }

  /**
   * Create optimal job distribution across workers
   */
  private async createOptimalDistribution(
    strategy: SatelliteStrategy,
    workerAnalysis: any
  ): Promise<OrchestrationPlan['jobDistribution']> {
    const { availableWorkers } = workerAnalysis;
    
    if (availableWorkers.length === 0) {
      throw new Error('No available workers found for campaign execution');
    }

    // Create posts from strategy content + accounts
    const posts = await this.createPostsFromStrategy(strategy);
    
    // Distribute posts across workers intelligently
    const jobDistribution: OrchestrationPlan['jobDistribution'] = [];
    
    // Sort workers by performance and capacity
    const sortedWorkers = availableWorkers.sort((a: Worker, b: Worker) => {
      const scoreA = (a.successRate || 0) * (a.maxConcurrentJobs || 1);
      const scoreB = (b.successRate || 0) * (b.maxConcurrentJobs || 1);
      return scoreB - scoreA;
    });

    // Round-robin distribution with capacity consideration
    let workerIndex = 0;
    const postsPerWorker: Record<string, ScheduledPost[]> = {};
    
    for (const post of posts) {
      const worker = sortedWorkers[workerIndex];
      if (!postsPerWorker[worker.workerId]) {
        postsPerWorker[worker.workerId] = [];
      }
      
      postsPerWorker[worker.workerId].push(post);
      
      // Move to next worker, considering capacity
      workerIndex = (workerIndex + 1) % sortedWorkers.length;
    }

    // Create job distribution objects
    for (const [workerId, assignedPosts] of Object.entries(postsPerWorker)) {
      const worker = sortedWorkers.find((w: Worker) => w.workerId === workerId)!;
      
      jobDistribution.push({
        workerId,
        posts: assignedPosts,
        estimatedDuration: this.estimateExecutionTime(assignedPosts.length, worker),
        region: worker.region,
        capabilities: worker.capabilities || []
      });
    }

    return jobDistribution;
  }

  /**
   * Create scheduled posts from satellite strategy
   */
  private async createPostsFromStrategy(strategy: SatelliteStrategy): Promise<ScheduledPost[]> {
    const posts: ScheduledPost[] = [];
    
    // Cross-product of content and accounts
    for (const content of strategy.targetContent) {
      for (const account of strategy.targetAccounts) {
        // Only match platform compatibility
        if (content.platforms && !content.platforms.includes(account.platform)) {
          continue;
        }

        const postData = {
          socialAccountId: account.id,
          platform: account.platform as any,
          caption: content.baseContent,
          hashtags: [], // Will be populated from content tags
          assetIds: content.assetIds || [],
          scheduledTime: new Date(), // Will be adjusted during execution
          timezone: 'UTC',
          status: 'scheduled' as const,
          analytics: {
            satelliteTemplate: strategy.templateName,
            contentLibraryId: content.id,
            orchestratorManaged: true,
            campaignId: this.generateCampaignId()
          } as any
        };

        // Don't save to database yet - just create the structure
        posts.push(postData as ScheduledPost);
      }
    }

    return posts;
  }

  /**
   * Calculate anti-detection score
   */
  private async calculateAntiDetectionScore(
    jobDistribution: OrchestrationPlan['jobDistribution']
  ): Promise<OrchestrationPlan['antiDetection']> {
    const regions = new Set(jobDistribution.map(j => j.region));
    const workers = jobDistribution.length;
    
    // IP Diversity Score (0-100)
    const ipDiversityScore = Math.min(100, (regions.size / workers) * 100);
    
    // Timing Variation (random jitter in minutes)
    const timingVariation = Math.floor(Math.random() * 15) + 5; // 5-20 minutes
    
    return {
      ipDiversityScore,
      timingVariation,
      geographicSpread: Array.from(regions)
    };
  }

  /**
   * Calculate campaign timeline
   */
  private calculateTimeline(
    jobDistribution: OrchestrationPlan['jobDistribution']
  ): OrchestrationPlan['timeline'] {
    const totalJobs = jobDistribution.reduce((sum, j) => sum + j.posts.length, 0);
    const concurrentWorkers = jobDistribution.length;
    
    // Estimate duration based on slowest worker
    const maxDuration = Math.max(...jobDistribution.map(j => j.estimatedDuration));
    
    const startTime = new Date();
    const estimatedEndTime = new Date(startTime.getTime() + maxDuration * 60 * 1000);

    return {
      startTime,
      estimatedEndTime,
      totalJobs,
      concurrentWorkers
    };
  }

  /**
   * Estimate execution time for worker
   */
  private estimateExecutionTime(jobCount: number, worker: Worker): number {
    const avgTimePerJob = worker.avgExecutionTime || 60; // seconds
    const concurrency = worker.maxConcurrentJobs || 1;
    
    // Calculate time considering concurrency
    const totalSeconds = (jobCount / concurrency) * avgTimePerJob;
    return Math.ceil(totalSeconds / 60); // Return minutes
  }

  // =====================================
  // CAMPAIGN EXECUTION CONTROL
  // =====================================

  /**
   * Execute planned campaign with manual trigger
   */
  async executeCampaign(plan: OrchestrationPlan): Promise<CampaignExecution> {
    console.log(`🚀 Executing campaign ${plan.campaignId}`);

    const execution: CampaignExecution = {
      campaignId: plan.campaignId,
      status: 'running',
      plan,
      progress: {
        totalJobs: plan.timeline.totalJobs,
        completedJobs: 0,
        failedJobs: 0,
        activeWorkers: plan.timeline.concurrentWorkers,
        currentPhase: 'initialization'
      },
      metrics: {
        startedAt: new Date(),
        avgExecutionTime: 0,
        successRate: 0,
        throughput: 0
      }
    };

    // Store execution state
    this.activeCampaigns.set(plan.campaignId, execution);

    try {
      // 1. Create posts in database with orchestrator metadata
      await this.createOrchestrationPosts(plan);
      
      // 2. Distribute jobs to workers with timing jitter
      await this.distributeJobsWithAntiDetection(plan);
      
      execution.progress.currentPhase = 'execution';
      
      console.log(`✅ Campaign ${plan.campaignId} started successfully`);
      
    } catch (error) {
      execution.status = 'failed';
      console.error(`❌ Campaign ${plan.campaignId} failed:`, error);
    }

    return execution;
  }

  /**
   * Create posts in database with orchestrator control
   */
  private async createOrchestrationPosts(plan: OrchestrationPlan): Promise<void> {
    for (const distribution of plan.jobDistribution) {
      for (const post of distribution.posts) {
        // Add timing jitter for anti-detection
        const jitterMinutes = Math.floor(Math.random() * plan.antiDetection.timingVariation);
        const scheduledTime = new Date(Date.now() + jitterMinutes * 60 * 1000);

        const postData = {
          ...post,
          scheduledTime,
          status: 'scheduled' as const, // Use existing status for compatibility
          analytics: {
            ...post.analytics,
            assignedWorker: distribution.workerId,
            orchestrationPlan: plan.campaignId,
            jitterApplied: jitterMinutes
          }
        };

        await this.storage.createScheduledPost(postData);
      }
    }
  }

  /**
   * Distribute jobs with anti-detection measures
   */
  private async distributeJobsWithAntiDetection(plan: OrchestrationPlan): Promise<void> {
    for (const distribution of plan.jobDistribution) {
      // Add delay between worker assignments
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5000)); // 0-5 second delay
      
      // Here we would normally send jobs to the specific worker
      // For now, we'll use the existing PostScheduler system
      console.log(`📤 Assigned ${distribution.posts.length} jobs to worker ${distribution.workerId} in ${distribution.region}`);
    }
  }

  // =====================================
  // CAMPAIGN MONITORING & CONTROL
  // =====================================

  /**
   * Get campaign status
   */
  getCampaignStatus(campaignId: string): CampaignExecution | null {
    return this.activeCampaigns.get(campaignId) || null;
  }

  /**
   * Pause campaign execution
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign || campaign.status !== 'running') {
      return false;
    }

    campaign.status = 'paused';
    console.log(`⏸️ Campaign ${campaignId} paused`);
    return true;
  }

  /**
   * Resume paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign || campaign.status !== 'paused') {
      return false;
    }

    campaign.status = 'running';
    console.log(`▶️ Campaign ${campaignId} resumed`);
    return true;
  }

  /**
   * Get orchestrator overview
   */
  async getOrchestratorOverview(): Promise<{
    activeCampaigns: number;
    totalWorkers: number;
    onlineWorkers: number;
    queuedJobs: number;
    completedToday: number;
    systemHealth: 'healthy' | 'degraded' | 'error';
  }> {
    const activeCampaigns = Array.from(this.activeCampaigns.values())
      .filter(c => c.status === 'running').length;
    
    const allWorkers = await this.storage.getWorkers();
    const onlineWorkers = allWorkers.filter(w => w.isOnline && w.isEnabled).length;
    
    // Get queued jobs (posts ready for orchestration)
    const queuedPosts = await this.storage.getScheduledPosts();
    const queuedJobs = queuedPosts.filter(p => p.status === 'scheduled').length;
    
    // Calculate completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = queuedPosts.filter(p => 
      p.status === 'posted' && 
      p.publishedAt && 
      new Date(p.publishedAt) >= today
    ).length;

    // System health assessment
    let systemHealth: 'healthy' | 'degraded' | 'error' = 'healthy';
    if (onlineWorkers === 0) {
      systemHealth = 'error';
    } else if (onlineWorkers < allWorkers.length * 0.7) {
      systemHealth = 'degraded';
    }

    return {
      activeCampaigns,
      totalWorkers: allWorkers.length,
      onlineWorkers,
      queuedJobs,
      completedToday,
      systemHealth
    };
  }

  // =====================================
  // MANUAL CONTROL OPERATIONS  
  // =====================================

  /**
   * Create campaign from manual selection
   */
  async createManualCampaign(options: {
    postIds: string[];
    strategy?: 'fastest' | 'balanced' | 'regional';
    priority?: 'high' | 'normal' | 'low';
  }): Promise<OrchestrationPlan> {
    console.log(`🎭 Creating manual campaign with ${options.postIds.length} posts`);

    const campaignId = this.generateCampaignId();
    
    // Get posts from database
    const posts: ScheduledPost[] = [];
    for (const postId of options.postIds) {
      const post = await this.storage.getScheduledPost(postId);
      if (post) posts.push(post);
    }

    if (posts.length === 0) {
      throw new Error('No valid posts found for campaign');
    }

    // Extract platforms from posts
    const platforms = Array.from(new Set(posts.map(p => p.platform)));
    
    // Create fake strategy for manual campaigns
    const strategy: SatelliteStrategy = {
      templateName: 'Manual Campaign',
      templateType: 'content',
      targetContent: [],
      targetAccounts: [],
      customizations: {
        theme: 'default',
        primaryColor: '#3b82f6',
        platforms,
        contentFrequency: 'normal'
      }
    };

    // Analyze workers
    const workerAnalysis = await this.analyzeWorkerCapacity(platforms);
    
    // Create distribution based on strategy
    const jobDistribution = await this.createManualDistribution(
      posts,
      workerAnalysis,
      options.strategy || 'balanced'
    );

    const antiDetection = await this.calculateAntiDetectionScore(jobDistribution);
    const timeline = this.calculateTimeline(jobDistribution);

    return {
      campaignId,
      strategy,
      jobDistribution,
      timeline,
      antiDetection
    };
  }

  /**
   * Create distribution for manual campaigns
   */
  private async createManualDistribution(
    posts: ScheduledPost[],
    workerAnalysis: any,
    strategy: string
  ): Promise<OrchestrationPlan['jobDistribution']> {
    const { availableWorkers } = workerAnalysis;
    
    if (availableWorkers.length === 0) {
      throw new Error('No available workers for manual campaign');
    }

    const jobDistribution: OrchestrationPlan['jobDistribution'] = [];
    let sortedWorkers = [...availableWorkers];

    // Apply strategy-specific sorting
    switch (strategy) {
      case 'fastest':
        sortedWorkers = sortedWorkers.sort((a, b) => 
          (a.avgExecutionTime || 0) - (b.avgExecutionTime || 0)
        );
        break;
      case 'balanced':
        sortedWorkers = sortedWorkers.sort((a, b) => {
          const scoreA = (a.successRate || 0) * (a.maxConcurrentJobs || 1);
          const scoreB = (b.successRate || 0) * (b.maxConcurrentJobs || 1);
          return scoreB - scoreA;
        });
        break;
      case 'regional':
        // Group by region for better distribution
        sortedWorkers = sortedWorkers.sort((a, b) => 
          a.region.localeCompare(b.region)
        );
        break;
    }

    // Distribute posts
    const postsPerWorker: Record<string, ScheduledPost[]> = {};
    let workerIndex = 0;
    
    for (const post of posts) {
      const worker = sortedWorkers[workerIndex];
      if (!postsPerWorker[worker.workerId]) {
        postsPerWorker[worker.workerId] = [];
      }
      
      postsPerWorker[worker.workerId].push(post);
      workerIndex = (workerIndex + 1) % sortedWorkers.length;
    }

    // Create distribution objects
    for (const [workerId, assignedPosts] of Object.entries(postsPerWorker)) {
      const worker = sortedWorkers.find((w: Worker) => w.workerId === workerId)!;
      
      jobDistribution.push({
        workerId,
        posts: assignedPosts,
        estimatedDuration: this.estimateExecutionTime(assignedPosts.length, worker),
        region: worker.region,
        capabilities: worker.capabilities || []
      });
    }

    return jobDistribution;
  }

  // =====================================
  // UTILITIES
  // =====================================

  private generateCampaignId(): string {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update campaign progress from external systems
   */
  async updateCampaignProgress(campaignId: string, updates: {
    completedJobs?: number;
    failedJobs?: number;
    currentPhase?: string;
  }): Promise<void> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) return;

    if (updates.completedJobs !== undefined) {
      campaign.progress.completedJobs = updates.completedJobs;
    }
    if (updates.failedJobs !== undefined) {
      campaign.progress.failedJobs = updates.failedJobs;
    }
    if (updates.currentPhase) {
      campaign.progress.currentPhase = updates.currentPhase;
    }

    // Update success rate
    const total = campaign.progress.completedJobs + campaign.progress.failedJobs;
    if (total > 0) {
      campaign.metrics.successRate = (campaign.progress.completedJobs / total) * 100;
    }

    // Check if campaign is complete
    if (campaign.progress.completedJobs + campaign.progress.failedJobs >= campaign.progress.totalJobs) {
      campaign.status = 'completed';
      campaign.metrics.completedAt = new Date();
    }
  }

  /**
   * Get all active campaigns
   */
  getActiveCampaigns(): CampaignExecution[] {
    return Array.from(this.activeCampaigns.values());
  }

  /**
   * Cancel campaign
   */
  async cancelCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) return false;

    campaign.status = 'failed';
    campaign.progress.currentPhase = 'cancelled';
    
    console.log(`❌ Campaign ${campaignId} cancelled`);
    return true;
  }
}

// Export singleton
export const jobOrchestrator = JobOrchestrator.getInstance();