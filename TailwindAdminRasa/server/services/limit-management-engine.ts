/**
 * 🚀 TIER 1 ROBUST LIMIT MANAGEMENT ENGINE
 * 
 * Comprehensive Facebook API limits management system featuring:
 * - Multi-scope limit tracking (app, group, account)
 * - Real-time violation prevention
 * - Intelligent scheduling with limit awareness
 * - Automatic cooldown management
 * - Performance optimization
 */

import { storage } from '../storage';
import { AccountGroup, SocialAccount, ScheduledPost } from '../../shared/schema';

// Types for limit management
interface LimitRule {
  scope: 'app' | 'group' | 'account';
  scopeId?: string;
  limitType: 'posts_per_hour' | 'posts_per_day' | 'posts_per_week' | 'posts_per_month';
  maxCount: number;
  timeWindowHours: number;
  priority: number; // 1 = highest priority
}

interface LimitUsage {
  rule: LimitRule;
  currentUsage: number;
  windowStart: Date;
  windowEnd: Date;
  usagePercent: number;
  isViolated: boolean;
  timeToReset: number; // minutes
}

interface LimitViolation {
  scope: string;
  scopeId?: string;
  violatedRule: LimitRule;
  currentUsage: number;
  maxAllowed: number;
  suggestedDelay: number; // minutes
  nextAvailableSlot: Date;
}

interface PostingCapacity {
  canPost: boolean;
  maxPosts: number;
  remainingSlots: number;
  violations: LimitViolation[];
  suggestedScheduleTimes: Date[];
  priority: number;
}

export class LimitManagementEngine {
  private static instance: LimitManagementEngine;
  private limitRules: Map<string, LimitRule[]> = new Map();
  private usageCache: Map<string, LimitUsage[]> = new Map();
  private cacheExpiryMs = 60000; // 1 minute cache
  private lastCacheUpdate = 0;

  // Singleton pattern for global access
  public static getInstance(): LimitManagementEngine {
    if (!LimitManagementEngine.instance) {
      LimitManagementEngine.instance = new LimitManagementEngine();
    }
    return LimitManagementEngine.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default Facebook API limit rules
   */
  private initializeDefaultRules(): void {
    // Facebook App-level limits (most restrictive)
    const appLimits: LimitRule[] = [
      {
        scope: 'app',
        limitType: 'posts_per_hour',
        maxCount: 600, // Facebook app hourly limit
        timeWindowHours: 1,
        priority: 1
      },
      {
        scope: 'app', 
        limitType: 'posts_per_day',
        maxCount: 10000, // Facebook app daily limit
        timeWindowHours: 24,
        priority: 2
      }
    ];

    // Group-level limits (customizable)
    const groupLimits: LimitRule[] = [
      {
        scope: 'group',
        limitType: 'posts_per_hour',
        maxCount: 50, // Default group hourly limit
        timeWindowHours: 1,
        priority: 3
      },
      {
        scope: 'group',
        limitType: 'posts_per_day', 
        maxCount: 500, // Default group daily limit
        timeWindowHours: 24,
        priority: 4
      }
    ];

    // Account-level limits (most granular)
    const accountLimits: LimitRule[] = [
      {
        scope: 'account',
        limitType: 'posts_per_hour',
        maxCount: 5, // Conservative account hourly limit
        timeWindowHours: 1,
        priority: 5
      },
      {
        scope: 'account',
        limitType: 'posts_per_day',
        maxCount: 50, // Conservative account daily limit  
        timeWindowHours: 24,
        priority: 6
      }
    ];

    this.limitRules.set('app', appLimits);
    this.limitRules.set('group', groupLimits);
    this.limitRules.set('account', accountLimits);
  }

  /**
   * 🎯 Core Method: Check if posting is allowed for specific account/group
   */
  async checkPostingCapacity(
    socialAccountId: string, 
    groupId?: string,
    appId?: string
  ): Promise<PostingCapacity> {
    const violations: LimitViolation[] = [];
    let canPost = true;
    let maxPosts = Infinity;
    let priority = 10;

    // Check app-level limits first (highest priority)
    if (appId) {
      const appViolations = await this.checkAppLimits(appId);
      if (appViolations.length > 0) {
        violations.push(...appViolations);
        canPost = false;
        priority = Math.min(priority, 1);
      }
    }

    // Check group-level limits
    if (groupId && canPost) {
      const groupViolations = await this.checkGroupLimits(groupId);
      if (groupViolations.length > 0) {
        violations.push(...groupViolations);
        canPost = false;
        priority = Math.min(priority, 3);
      }
    }

    // Check account-level limits
    if (canPost) {
      const accountViolations = await this.checkAccountLimits(socialAccountId);
      if (accountViolations.length > 0) {
        violations.push(...accountViolations);
        canPost = false;
        priority = Math.min(priority, 5);
      }
    }

    // Calculate remaining capacity if posting is allowed
    let remainingSlots = 0;
    if (canPost) {
      remainingSlots = await this.calculateRemainingSlots(socialAccountId, groupId, appId);
      maxPosts = Math.min(maxPosts, remainingSlots);
    }

    // Generate suggested schedule times
    const suggestedTimes = canPost ? 
      await this.generateOptimalScheduleTimes(socialAccountId, groupId, maxPosts) : 
      await this.generateRecoveryScheduleTimes(violations);

    return {
      canPost,
      maxPosts: maxPosts === Infinity ? remainingSlots : maxPosts,
      remainingSlots,
      violations,
      suggestedScheduleTimes: suggestedTimes,
      priority
    };
  }

  /**
   * 🔍 Check app-level limits
   */
  private async checkAppLimits(appId: string): Promise<LimitViolation[]> {
    const violations: LimitViolation[] = [];
    const appRules = this.limitRules.get('app') || [];

    for (const rule of appRules) {
      const usage = await this.getCurrentUsage('app', appId, rule);
      
      if (usage.isViolated) {
        violations.push({
          scope: 'app',
          scopeId: appId,
          violatedRule: rule,
          currentUsage: usage.currentUsage,
          maxAllowed: rule.maxCount,
          suggestedDelay: usage.timeToReset,
          nextAvailableSlot: usage.windowEnd
        });
      }
    }

    return violations;
  }

  /**
   * 🎯 Check group-level limits
   */
  private async checkGroupLimits(groupId: string): Promise<LimitViolation[]> {
    const violations: LimitViolation[] = [];
    
    // Get group-specific rules (with potential overrides)
    const groupRules = await this.getGroupSpecificRules(groupId);
    
    for (const rule of groupRules) {
      const usage = await this.getCurrentUsage('group', groupId, rule);
      
      if (usage.isViolated) {
        violations.push({
          scope: 'group',
          scopeId: groupId,
          violatedRule: rule,
          currentUsage: usage.currentUsage,
          maxAllowed: rule.maxCount,
          suggestedDelay: usage.timeToReset,
          nextAvailableSlot: usage.windowEnd
        });
      }
    }

    return violations;
  }

  /**
   * 👤 Check account-level limits
   */
  private async checkAccountLimits(socialAccountId: string): Promise<LimitViolation[]> {
    const violations: LimitViolation[] = [];
    const accountRules = this.limitRules.get('account') || [];

    for (const rule of accountRules) {
      const usage = await this.getCurrentUsage('account', socialAccountId, rule);
      
      if (usage.isViolated) {
        violations.push({
          scope: 'account',
          scopeId: socialAccountId,
          violatedRule: rule,
          currentUsage: usage.currentUsage,
          maxAllowed: rule.maxCount,
          suggestedDelay: usage.timeToReset,
          nextAvailableSlot: usage.windowEnd
        });
      }
    }

    return violations;
  }

  /**
   * 📊 Calculate current usage for a specific scope and rule
   */
  private async getCurrentUsage(
    scope: string, 
    scopeId: string, 
    rule: LimitRule
  ): Promise<LimitUsage> {
    const cacheKey = `${scope}-${scopeId}-${rule.limitType}`;
    
    // Check cache first
    if (this.shouldUseCache()) {
      const cached = this.usageCache.get(cacheKey);
      if (cached && cached.length > 0) {
        return cached[0];
      }
    }

    // Calculate window times
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - (rule.timeWindowHours * 60 * 60 * 1000));

    // Query database for posts in time window
    let currentUsage = 0;
    
    try {
      // Get posts based on scope
      const posts = await this.getPostsInTimeWindow(scope, scopeId, windowStart, windowEnd);
      currentUsage = posts.length;
    } catch (error) {
      console.error(`Error calculating usage for ${scope}:${scopeId}:`, error);
      currentUsage = 0;
    }

    const usagePercent = (currentUsage / rule.maxCount) * 100;
    const isViolated = currentUsage >= rule.maxCount;
    const timeToReset = Math.ceil((windowEnd.getTime() - Date.now()) / (1000 * 60)); // minutes

    const usage: LimitUsage = {
      rule,
      currentUsage,
      windowStart,
      windowEnd,
      usagePercent,
      isViolated,
      timeToReset: Math.max(0, timeToReset)
    };

    // Cache the result
    this.usageCache.set(cacheKey, [usage]);
    this.lastCacheUpdate = Date.now();

    return usage;
  }

  /**
   * 📈 Get posts in time window for specific scope
   */
  private async getPostsInTimeWindow(
    scope: string,
    scopeId: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<ScheduledPost[]> {
    try {
      // Get all scheduled posts within time window
      const allPosts = await storage.getScheduledPosts();
      const filteredPosts = allPosts.filter((post: ScheduledPost) => {
        const postTime = new Date(post.scheduledTime);
        return postTime >= windowStart && postTime <= windowEnd;
      });
      
      // Filter by scope
      switch (scope) {
        case 'account':
          return filteredPosts.filter((post: ScheduledPost) => post.socialAccountId === scopeId);
          
        case 'group':
          // TODO: When schedule_assignments table exists, filter by groupId
          // For now, return empty array for group scope
          return [];
          
        case 'app':
          // TODO: When facebook_apps integration exists, filter by appId
          // For now, return all posts as approximation
          return filteredPosts;
          
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching posts for ${scope}:${scopeId}:`, error);
      return [];
    }
  }

  /**
   * 🔧 Get group-specific rules with potential overrides
   */
  private async getGroupSpecificRules(groupId: string): Promise<LimitRule[]> {
    try {
      // Get group configuration from database
      const groups = await (storage as any).getAccountGroups();
      const group = groups.find((g: AccountGroup) => g.id === groupId);
      
      if (!group) {
        return this.limitRules.get('group') || [];
      }

      // TODO: Implement group-specific rule overrides from posting_formulas table
      // For now, return default group rules
      const defaultRules = this.limitRules.get('group') || [];
      
      return defaultRules.map(rule => ({
        ...rule,
        scopeId: groupId,
        // Apply group priority weighting
        maxCount: Math.floor(rule.maxCount * (parseFloat(group.weight?.toString() || '1') || 1))
      }));
    } catch (error) {
      console.error(`Error getting group rules for ${groupId}:`, error);
      return this.limitRules.get('group') || [];
    }
  }

  /**
   * 🧮 Calculate remaining posting slots
   */
  private async calculateRemainingSlots(
    socialAccountId: string,
    groupId?: string,
    appId?: string
  ): Promise<number> {
    let minRemaining = Infinity;

    // Check all applicable rules and find the most restrictive
    const accountRules = this.limitRules.get('account') || [];
    for (const rule of accountRules) {
      const usage = await this.getCurrentUsage('account', socialAccountId, rule);
      const remaining = rule.maxCount - usage.currentUsage;
      minRemaining = Math.min(minRemaining, Math.max(0, remaining));
    }

    if (groupId) {
      const groupRules = await this.getGroupSpecificRules(groupId);
      for (const rule of groupRules) {
        const usage = await this.getCurrentUsage('group', groupId, rule);
        const remaining = rule.maxCount - usage.currentUsage;
        minRemaining = Math.min(minRemaining, Math.max(0, remaining));
      }
    }

    if (appId) {
      const appRules = this.limitRules.get('app') || [];
      for (const rule of appRules) {
        const usage = await this.getCurrentUsage('app', appId, rule);
        const remaining = rule.maxCount - usage.currentUsage;
        minRemaining = Math.min(minRemaining, Math.max(0, remaining));
      }
    }

    return minRemaining === Infinity ? 0 : minRemaining;
  }

  /**
   * ⏰ Generate optimal schedule times within limits
   */
  private async generateOptimalScheduleTimes(
    socialAccountId: string,
    groupId?: string,
    maxPosts: number = 5
  ): Promise<Date[]> {
    const suggestedTimes: Date[] = [];
    const now = new Date();
    
    // Generate times with intelligent spacing
    const optimalHours = [9, 12, 15, 18, 21]; // Peak engagement hours
    const baseInterval = 2; // hours between posts
    
    for (let i = 0; i < Math.min(maxPosts, 10); i++) {
      const hoursOffset = i * baseInterval;
      const suggestedTime = new Date(now.getTime() + (hoursOffset * 60 * 60 * 1000));
      
      // Align to optimal hours if possible
      const currentHour = suggestedTime.getHours();
      const nearestOptimal = optimalHours.reduce((prev, curr) => 
        Math.abs(curr - currentHour) < Math.abs(prev - currentHour) ? curr : prev
      );
      
      suggestedTime.setHours(nearestOptimal, 0, 0, 0);
      
      // Ensure it's in the future
      if (suggestedTime > now) {
        suggestedTimes.push(suggestedTime);
      }
    }
    
    return suggestedTimes;
  }

  /**
   * 🚨 Generate recovery schedule times when limits are violated
   */
  private async generateRecoveryScheduleTimes(violations: LimitViolation[]): Promise<Date[]> {
    const recoveryTimes: Date[] = [];
    
    // Find the earliest recovery time
    const earliestRecovery = violations.reduce((earliest, violation) => {
      return violation.nextAvailableSlot < earliest ? violation.nextAvailableSlot : earliest;
    }, new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to 24 hours
    
    // Generate times starting from recovery point
    for (let i = 0; i < 5; i++) {
      const recoveryTime = new Date(earliestRecovery.getTime() + (i * 60 * 60 * 1000)); // Every hour
      recoveryTimes.push(recoveryTime);
    }
    
    return recoveryTimes;
  }

  /**
   * 🔄 Check if cache should be used
   */
  private shouldUseCache(): boolean {
    return (Date.now() - this.lastCacheUpdate) < this.cacheExpiryMs;
  }

  /**
   * 🗑️ Clear usage cache (force refresh)
   */
  public clearCache(): void {
    this.usageCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * 📊 Get comprehensive limit status for monitoring
   */
  async getLimitStatus(filters?: {
    scope?: 'app' | 'group' | 'account';
    scopeId?: string;
  }): Promise<{
    byScope: {
      app: LimitUsage[];
      group: LimitUsage[];
      account: LimitUsage[];
    };
    violations: LimitViolation[];
    summary: {
      totalRules: number;
      violatedRules: number;
      healthScore: number; // 0-100%
    };
  }> {
    const result = {
      byScope: {
        app: [] as LimitUsage[],
        group: [] as LimitUsage[],
        account: [] as LimitUsage[]
      },
      violations: [] as LimitViolation[],
      summary: {
        totalRules: 0,
        violatedRules: 0,
        healthScore: 100
      }
    };

    try {
      // Get all groups and accounts for comprehensive check
      const groups = await (storage as any).getAccountGroups();
      const accounts = await storage.getSocialAccounts();

      // Check app-level usage
      if (!filters?.scope || filters.scope === 'app') {
        const appRules = this.limitRules.get('app') || [];
        for (const rule of appRules) {
          const usage = await this.getCurrentUsage('app', 'default', rule);
          result.byScope.app.push(usage);
          if (usage.isViolated) {
            result.violations.push({
              scope: 'app',
              violatedRule: rule,
              currentUsage: usage.currentUsage,
              maxAllowed: rule.maxCount,
              suggestedDelay: usage.timeToReset,
              nextAvailableSlot: usage.windowEnd
            });
          }
        }
      }

      // Check group-level usage
      if (!filters?.scope || filters.scope === 'group') {
        for (const group of groups) {
          if (filters?.scopeId && group.id !== filters.scopeId) continue;
          
          const groupRules = await this.getGroupSpecificRules(group.id);
          for (const rule of groupRules) {
            const usage = await this.getCurrentUsage('group', group.id, rule);
            result.byScope.group.push(usage);
            if (usage.isViolated) {
              result.violations.push({
                scope: 'group',
                scopeId: group.id,
                violatedRule: rule,
                currentUsage: usage.currentUsage,
                maxAllowed: rule.maxCount,
                suggestedDelay: usage.timeToReset,
                nextAvailableSlot: usage.windowEnd
              });
            }
          }
        }
      }

      // Check account-level usage
      if (!filters?.scope || filters.scope === 'account') {
        for (const account of accounts) {
          if (filters?.scopeId && account.id !== filters.scopeId) continue;
          
          const accountRules = this.limitRules.get('account') || [];
          for (const rule of accountRules) {
            const usage = await this.getCurrentUsage('account', account.id, rule);
            result.byScope.account.push(usage);
            if (usage.isViolated) {
              result.violations.push({
                scope: 'account',
                scopeId: account.id,
                violatedRule: rule,
                currentUsage: usage.currentUsage,
                maxAllowed: rule.maxCount,
                suggestedDelay: usage.timeToReset,
                nextAvailableSlot: usage.windowEnd
              });
            }
          }
        }
      }

      // Calculate summary
      const allUsages = [...result.byScope.app, ...result.byScope.group, ...result.byScope.account];
      result.summary.totalRules = allUsages.length;
      result.summary.violatedRules = result.violations.length;
      result.summary.healthScore = result.summary.totalRules > 0 ? 
        Math.round(((result.summary.totalRules - result.summary.violatedRules) / result.summary.totalRules) * 100) : 100;

    } catch (error) {
      console.error('Error getting limit status:', error);
    }

    return result;
  }

  /**
   * 🚀 Advanced: Bulk posting capacity check for Smart Scheduler
   */
  async checkBulkPostingCapacity(
    posts: Array<{
      socialAccountId: string;
      groupId?: string;
      appId?: string;
      scheduledTime: Date;
    }>
  ): Promise<{
    canScheduleAll: boolean;
    allowedPosts: typeof posts;
    blockedPosts: Array<typeof posts[0] & { reason: string }>;
    suggestedAlternatives: Array<typeof posts[0] & { newTime: Date }>;
  }> {
    const allowedPosts: typeof posts = [];
    const blockedPosts: Array<typeof posts[0] & { reason: string }> = [];
    const suggestedAlternatives: Array<typeof posts[0] & { newTime: Date }> = [];

    for (const post of posts) {
      const capacity = await this.checkPostingCapacity(
        post.socialAccountId,
        post.groupId,
        post.appId
      );

      if (capacity.canPost && allowedPosts.length < capacity.maxPosts) {
        allowedPosts.push(post);
      } else {
        const reason = capacity.violations.length > 0 ? 
          `Limit violated: ${capacity.violations[0].scope}` : 
          'Capacity exceeded';
        
        blockedPosts.push({ ...post, reason });

        // Suggest alternative time
        if (capacity.suggestedScheduleTimes.length > 0) {
          suggestedAlternatives.push({
            ...post,
            newTime: capacity.suggestedScheduleTimes[0]
          });
        }
      }
    }

    return {
      canScheduleAll: blockedPosts.length === 0,
      allowedPosts,
      blockedPosts,
      suggestedAlternatives
    };
  }

  /**
   * 💾 Export configuration for backup/import
   */
  exportConfiguration() {
    return {
      limitRules: Object.fromEntries(this.limitRules),
      cacheSettings: {
        cacheExpiryMs: this.cacheExpiryMs
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 📥 Import configuration from backup
   */
  importConfiguration(config: any) {
    if (config.limitRules) {
      this.limitRules = new Map(Object.entries(config.limitRules));
    }
    if (config.cacheSettings) {
      this.cacheExpiryMs = config.cacheSettings.cacheExpiryMs || 60000;
    }
    this.clearCache(); // Force refresh
  }
}

// Export singleton instance
export const limitEngine = LimitManagementEngine.getInstance();

// Export types
export type {
  LimitRule,
  LimitUsage,
  LimitViolation,
  PostingCapacity
};