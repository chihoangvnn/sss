import { storage } from '../storage';
import QueueService from './queue';
import type { SocialAccount } from '@shared/schema';
import { SUPPORTED_REGIONS, SupportedRegion, SupportedPlatform } from './regions';

/**
 * Region Assignment Service
 * Manages assignment of social accounts to specific regions/workers
 * Optimizes for performance, compliance, and load distribution
 */
class RegionAssignmentService {
  /**
   * Public getter for global regions (for validation purposes)
   */
  static getGlobalRegions(): string[] {
    return [...SUPPORTED_REGIONS];
  }

  /**
   * Public getter for all geo regions values (for validation purposes)
   */
  static getGeoRegionsValues(): string[] {
    return Object.values(this.GEO_REGIONS);
  }

  /**
   * Default region mappings based on platform optimization
   * All platforms support all global regions for maximum flexibility
   */
  private static readonly PLATFORM_REGIONS: Record<SupportedPlatform, SupportedRegion[]> = {
    facebook: [...SUPPORTED_REGIONS],
    instagram: [...SUPPORTED_REGIONS], 
    twitter: [...SUPPORTED_REGIONS],
    tiktok: [...SUPPORTED_REGIONS]
  };

  /**
   * Geographic region preferences for better latency
   * Expanded coverage for global reach
   */
  private static readonly GEO_REGIONS: Record<string, string> = {
    // Asia Pacific - Existing
    'VN': 'ap-southeast-1', 'TH': 'ap-southeast-1', 'SG': 'ap-southeast-1',
    'MY': 'ap-southeast-1', 'ID': 'ap-southeast-1', 'PH': 'ap-southeast-1',
    'JP': 'ap-northeast-1', 'KR': 'ap-northeast-1', 'TW': 'ap-northeast-1',
    'CN': 'ap-northeast-1', 'HK': 'ap-northeast-1', 'IN': 'ap-south-1',
    'AU': 'ap-southeast-2', 'NZ': 'ap-southeast-2',
    
    // Asia Pacific - New regions
    'BD': 'ap-south-1', 'LK': 'ap-south-1', 'PK': 'ap-south-1', 'NP': 'ap-south-1',
    'MM': 'ap-southeast-1', 'KH': 'ap-southeast-1', 'LA': 'ap-southeast-1',
    'BN': 'ap-southeast-1', 'MN': 'ap-northeast-1', 'KZ': 'ap-south-1',
    'UZ': 'ap-south-1', 'KG': 'ap-south-1', 'TJ': 'ap-south-1', 'TM': 'ap-south-1',
    'FJ': 'ap-southeast-2', 'PG': 'ap-southeast-2', 'NC': 'ap-southeast-2',
    
    // Europe - Existing
    'GB': 'eu-west-1', 'IE': 'eu-west-1', 'FR': 'eu-west-1',
    'DE': 'eu-central-1', 'IT': 'eu-south-1', 'ES': 'eu-west-1',
    'NL': 'eu-west-1', 'BE': 'eu-west-1', 'SE': 'eu-north-1',
    'NO': 'eu-north-1', 'DK': 'eu-north-1', 'FI': 'eu-north-1',
    'PL': 'eu-central-1', 'CZ': 'eu-central-1', 'AT': 'eu-central-1',
    
    // Europe - New regions  
    'PT': 'eu-west-1', 'CH': 'eu-central-1', 'LU': 'eu-west-1',
    'SK': 'eu-central-1', 'SI': 'eu-central-1', 'HU': 'eu-central-1',
    'RO': 'eu-central-1', 'BG': 'eu-central-1', 'HR': 'eu-central-1',
    'RS': 'eu-central-1', 'BA': 'eu-central-1', 'ME': 'eu-central-1',
    'MK': 'eu-central-1', 'AL': 'eu-central-1', 'GR': 'eu-south-1',
    'CY': 'eu-south-1', 'MT': 'eu-south-1', 'IS': 'eu-north-1',
    'EE': 'eu-north-1', 'LV': 'eu-north-1', 'LT': 'eu-north-1',
    'BY': 'eu-central-1', 'UA': 'eu-central-1', 'MD': 'eu-central-1',
    'RU': 'eu-central-1', 'GE': 'eu-central-1', 'AM': 'eu-central-1', 'AZ': 'eu-central-1',
    
    // Americas - Existing
    'US': 'us-east-1', 'CA': 'us-east-1', 'MX': 'us-west-2',
    'BR': 'sa-east-1', 'AR': 'sa-east-1', 'CL': 'sa-east-1',
    'CO': 'sa-east-1', 'PE': 'sa-east-1',
    
    // Americas - New regions
    'GT': 'us-west-2', 'BZ': 'us-west-2', 'SV': 'us-west-2', 'HN': 'us-west-2',
    'NI': 'us-west-2', 'CR': 'us-west-2', 'PA': 'us-west-2', 'CU': 'us-east-1',
    'JM': 'us-east-1', 'HT': 'us-east-1', 'DO': 'us-east-1', 'PR': 'us-east-1',
    'TT': 'us-east-1', 'BB': 'us-east-1', 'GY': 'sa-east-1', 'SR': 'sa-east-1',
    'UY': 'sa-east-1', 'PY': 'sa-east-1', 'BO': 'sa-east-1', 'EC': 'sa-east-1',
    'VE': 'sa-east-1', 'GL': 'us-east-1',
    
    // Middle East & Africa - Existing
    'AE': 'me-south-1', 'SA': 'me-south-1', 'IL': 'me-south-1',
    'ZA': 'af-south-1', 'EG': 'me-south-1', 'KE': 'af-south-1',
    
    // Middle East & Africa - New regions
    'QA': 'me-south-1', 'KW': 'me-south-1', 'BH': 'me-south-1', 'OM': 'me-south-1',
    'JO': 'me-south-1', 'LB': 'me-south-1', 'SY': 'me-south-1', 'IQ': 'me-south-1',
    'IR': 'me-south-1', 'AF': 'ap-south-1', 'TR': 'eu-central-1',
    'MA': 'eu-west-1', 'TN': 'eu-south-1', 'LY': 'eu-south-1', 'DZ': 'eu-west-1',
    'NG': 'af-south-1', 'GH': 'af-south-1', 'SN': 'eu-west-1', 'CI': 'eu-west-1',
    'BF': 'eu-west-1', 'ML': 'eu-west-1', 'NE': 'eu-west-1', 'TD': 'eu-south-1',
    'CF': 'eu-south-1', 'CM': 'eu-south-1', 'GA': 'eu-south-1', 'CG': 'eu-south-1',
    'CD': 'af-south-1', 'AO': 'af-south-1', 'ZM': 'af-south-1', 'ZW': 'af-south-1',
    'MW': 'af-south-1', 'MZ': 'af-south-1', 'TZ': 'af-south-1', 'UG': 'af-south-1',
    'RW': 'af-south-1', 'BI': 'af-south-1', 'ET': 'af-south-1', 'SO': 'af-south-1',
    'DJ': 'me-south-1', 'ER': 'me-south-1', 'SD': 'me-south-1', 'SS': 'af-south-1',
    'BW': 'af-south-1', 'NA': 'af-south-1', 'SZ': 'af-south-1', 'LS': 'af-south-1',
    'MG': 'af-south-1', 'MU': 'af-south-1', 'SC': 'af-south-1'
  };

  /**
   * Region capacity and performance metrics
   */
  private static regionMetrics = new Map<string, {
    activeWorkers: number;
    totalCapacity: number;
    currentLoad: number;
    avgResponseTime: number;
    errorRate: number;
    lastUpdated: Date;
  }>();

  /**
   * Assign optimal region for a social account
   */
  static async assignOptimalRegion(
    socialAccount: SocialAccount,
    options?: {
      forceRegion?: string;
      considerLoad?: boolean;
      preferredRegions?: string[];
    }
  ): Promise<{
    region: string;
    reason: string;
    alternatives: string[];
  }> {
    // Force region if specified
    if (options?.forceRegion) {
      return {
        region: options.forceRegion,
        reason: 'Force assigned by configuration',
        alternatives: []
      };
    }

    // Check existing assignment first
    const existingRegion = await this.getAccountRegion(socialAccount.id);
    if (existingRegion && !options?.considerLoad) {
      return {
        region: existingRegion,
        reason: 'Existing assignment maintained',
        alternatives: []
      };
    }

    // Get available regions for this platform
    const platformRegions = this.PLATFORM_REGIONS[socialAccount.platform] || ['us-east-1'];
    
    // Filter by preferred regions if specified
    const candidateRegions = options?.preferredRegions 
      ? platformRegions.filter(r => options.preferredRegions!.includes(r))
      : platformRegions;

    // Geographic optimization
    let optimalRegion = candidateRegions[0]; // Default fallback
    let reason = 'Default platform region';
    
    try {
      // 1. Geographic preference based on account locale/timezone
      const geoRegion = await this.getGeographicRegion(socialAccount);
      if (geoRegion && candidateRegions.includes(geoRegion)) {
        optimalRegion = geoRegion;
        reason = 'Geographic optimization';
      }

      // 2. Load balancing optimization
      if (options?.considerLoad) {
        const loadOptimalRegion = await this.getLoadOptimalRegion(candidateRegions);
        if (loadOptimalRegion && candidateRegions.includes(loadOptimalRegion.region)) {
          optimalRegion = loadOptimalRegion.region;
          reason = `Load balancing (${loadOptimalRegion.load}% load)`;
        }
      }

      // 3. Performance optimization
      const performanceRegion = await this.getPerformanceOptimalRegion(candidateRegions, socialAccount.platform);
      if (performanceRegion) {
        optimalRegion = performanceRegion.region;
        reason = `Performance optimization (${performanceRegion.avgResponseTime}ms avg)`;
      }

    } catch (error) {
      console.error('Error in region assignment optimization:', error);
      // Fallback to first available region
    }

    // Store assignment
    await this.storeAccountRegion(socialAccount.id, optimalRegion, reason);

    return {
      region: optimalRegion,
      reason,
      alternatives: candidateRegions.filter(r => r !== optimalRegion)
    };
  }

  /**
   * Get geographic region based on account data
   */
  private static async getGeographicRegion(socialAccount: SocialAccount): Promise<string | null> {
    try {
      // Check account metadata for geographic hints
      const metadata = socialAccount.contentPreferences as any || {};
      
      // 1. Explicit country/region setting
      if (metadata.country && this.GEO_REGIONS[metadata.country]) {
        return this.GEO_REGIONS[metadata.country];
      }

      // 2. Timezone-based inference
      if (metadata.timezone) {
        const region = this.timezoneToRegion(metadata.timezone);
        if (region) return region;
      }

      // 3. Page/account locale inference (Facebook specific)
      if (socialAccount.platform === 'facebook' && metadata.locale) {
        const countryCode = metadata.locale.split('_')[1];
        if (countryCode && this.GEO_REGIONS[countryCode]) {
          return this.GEO_REGIONS[countryCode];
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting geographic region:', error);
      return null;
    }
  }

  /**
   * Convert timezone to region
   */
  private static timezoneToRegion(timezone: string): string | null {
    const tzRegionMap: Record<string, string> = {
      // Asia Pacific
      'Asia/Ho_Chi_Minh': 'ap-southeast-1',
      'Asia/Bangkok': 'ap-southeast-1', 
      'Asia/Singapore': 'ap-southeast-1',
      'Asia/Jakarta': 'ap-southeast-1',
      'Asia/Manila': 'ap-southeast-1',
      'Asia/Tokyo': 'ap-northeast-1',
      'Asia/Seoul': 'ap-northeast-1',
      'Asia/Shanghai': 'ap-northeast-1',
      'Asia/Hong_Kong': 'ap-northeast-1',
      'Asia/Kolkata': 'ap-south-1',
      'Australia/Sydney': 'ap-southeast-2',
      
      // Europe
      'Europe/London': 'eu-west-1',
      'Europe/Dublin': 'eu-west-1',
      'Europe/Paris': 'eu-west-1',
      'Europe/Berlin': 'eu-central-1',
      'Europe/Rome': 'eu-south-1',
      'Europe/Madrid': 'eu-west-1',
      'Europe/Amsterdam': 'eu-west-1',
      'Europe/Stockholm': 'eu-north-1',
      'Europe/Warsaw': 'eu-central-1',
      
      // Americas
      'America/New_York': 'us-east-1',
      'America/Chicago': 'us-east-1',
      'America/Denver': 'us-west-2',
      'America/Los_Angeles': 'us-west-2',
      'America/Toronto': 'us-east-1',
      'America/Sao_Paulo': 'sa-east-1',
      'America/Mexico_City': 'us-west-2',
      
      // UTC defaults
      'UTC': 'us-east-1'
    };

    return tzRegionMap[timezone] || null;
  }

  /**
   * Get load-optimal region
   */
  private static async getLoadOptimalRegion(
    candidateRegions: string[]
  ): Promise<{ region: string; load: number } | null> {
    try {
      await this.updateRegionMetrics();
      
      let bestRegion = candidateRegions[0];
      let lowestLoad = 100;

      for (const region of candidateRegions) {
        const metrics = this.regionMetrics.get(region);
        if (metrics && metrics.currentLoad < lowestLoad) {
          lowestLoad = metrics.currentLoad;
          bestRegion = region;
        }
      }

      return { region: bestRegion, load: lowestLoad };
    } catch (error) {
      console.error('Error getting load optimal region:', error);
      return null;
    }
  }

  /**
   * Get performance-optimal region
   */
  private static async getPerformanceOptimalRegion(
    candidateRegions: string[], 
    platform: string
  ): Promise<{ region: string; avgResponseTime: number } | null> {
    try {
      await this.updateRegionMetrics();
      
      let bestRegion = candidateRegions[0];
      let lowestResponseTime = 10000;

      for (const region of candidateRegions) {
        const metrics = this.regionMetrics.get(region);
        if (metrics && metrics.avgResponseTime < lowestResponseTime && metrics.errorRate < 0.05) {
          lowestResponseTime = metrics.avgResponseTime;
          bestRegion = region;
        }
      }

      return { region: bestRegion, avgResponseTime: lowestResponseTime };
    } catch (error) {
      console.error('Error getting performance optimal region:', error);
      return null;
    }
  }

  /**
   * Update region performance metrics
   */
  private static async updateRegionMetrics(): Promise<void> {
    try {
      // Get queue statistics for all regions
      const queueStats = await QueueService.getQueueStats();
      
      // Calculate metrics per region
      const regionData = new Map<string, {
        totalJobs: number;
        activeJobs: number;
        completedJobs: number;
        failedJobs: number;
      }>();

      for (const [queueName, stats] of Object.entries(queueStats)) {
        const [, platform, region] = queueName.split(':');
        if (!region) continue;

        const existing = regionData.get(region) || {
          totalJobs: 0, activeJobs: 0, completedJobs: 0, failedJobs: 0
        };

        if (typeof stats === 'object' && stats) {
          existing.totalJobs += stats.total || 0;
          existing.activeJobs += stats.active || 0;
          existing.completedJobs += stats.completed || 0;
          existing.failedJobs += stats.failed || 0;
        }

        regionData.set(region, existing);
      }

      // Update metrics map
      for (const [region, data] of Array.from(regionData.entries())) {
        const currentLoad = data.totalJobs > 0 
          ? Math.round((data.activeJobs / data.totalJobs) * 100)
          : 0;
          
        const errorRate = data.completedJobs + data.failedJobs > 0
          ? data.failedJobs / (data.completedJobs + data.failedJobs)
          : 0;

        this.regionMetrics.set(region, {
          activeWorkers: Math.ceil(data.activeJobs / 5), // Estimate 5 jobs per worker
          totalCapacity: 100, // Default capacity
          currentLoad,
          avgResponseTime: 2000 + Math.random() * 1000, // Simulated for now
          errorRate,
          lastUpdated: new Date()
        });
      }

      console.log(`📊 Updated metrics for ${regionData.size} regions`);
    } catch (error) {
      console.error('Failed to update region metrics:', error);
    }
  }

  /**
   * Get assigned region for an account
   */
  private static async getAccountRegion(accountId: string): Promise<string | null> {
    try {
      // For now, store in account contentPreferences
      // In production, consider dedicated region_assignments table
      const account = await storage.getSocialAccount(accountId);
      if (account && account.contentPreferences) {
        const prefs = account.contentPreferences as any;
        return prefs.assignedRegion || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting account region:', error);
      return null;
    }
  }

  /**
   * Store region assignment for an account
   */
  private static async storeAccountRegion(
    accountId: string, 
    region: string, 
    reason: string
  ): Promise<void> {
    try {
      const account = await storage.getSocialAccount(accountId);
      if (account) {
        const currentPrefs = account.contentPreferences as any || {};
        
        await storage.updateSocialAccount(accountId, {
          contentPreferences: {
            ...currentPrefs,
            assignedRegion: region,
            assignmentReason: reason,
            assignedAt: new Date().toISOString()
          } as any
        });

        console.log(`📍 Assigned account ${accountId} to region ${region}: ${reason}`);
      }
    } catch (error) {
      console.error('Error storing account region:', error);
    }
  }

  /**
   * Bulk reassign accounts based on current load
   */
  static async rebalanceAccountAssignments(
    platform?: string,
    dryRun: boolean = true
  ): Promise<{
    totalAccounts: number;
    reassignments: Array<{
      accountId: string;
      oldRegion: string;
      newRegion: string;
      reason: string;
    }>;
    dryRun: boolean;
  }> {
    console.log(`🔄 Starting account rebalancing ${dryRun ? '(DRY RUN)' : ''}`);
    
    const reassignments: Array<{
      accountId: string;
      oldRegion: string; 
      newRegion: string;
      reason: string;
    }> = [];

    try {
      // Get all social accounts
      const accounts = await storage.getSocialAccounts();
      const filteredAccounts = platform 
        ? accounts.filter(acc => acc.platform === platform)
        : accounts;

      await this.updateRegionMetrics();

      for (const account of filteredAccounts) {
        const currentRegion = await this.getAccountRegion(account.id);
        if (!currentRegion) continue;

        // Check if current region is overloaded
        const currentMetrics = this.regionMetrics.get(currentRegion);
        if (currentMetrics && currentMetrics.currentLoad > 80) {
          // Find better region
          const assignment = await this.assignOptimalRegion(account, {
            considerLoad: true
          });

          if (assignment.region !== currentRegion) {
            reassignments.push({
              accountId: account.id,
              oldRegion: currentRegion,
              newRegion: assignment.region,
              reason: `Load rebalancing: ${currentMetrics.currentLoad}% → ${assignment.reason}`
            });

            // Apply reassignment if not dry run
            if (!dryRun) {
              await this.storeAccountRegion(account.id, assignment.region, assignment.reason);
            }
          }
        }
      }

      console.log(`✅ Rebalancing complete: ${reassignments.length} reassignments identified`);
      
      return {
        totalAccounts: filteredAccounts.length,
        reassignments,
        dryRun
      };
      
    } catch (error) {
      console.error('Error during account rebalancing:', error);
      return {
        totalAccounts: 0,
        reassignments: [],
        dryRun
      };
    }
  }

  /**
   * Get region assignment statistics
   */
  static async getAssignmentStats(): Promise<{
    byRegion: Record<string, number>;
    byPlatform: Record<string, Record<string, number>>;
    unassigned: number;
    totalAccounts: number;
    regionMetrics: Record<string, any>;
  }> {
    try {
      const accounts = await storage.getSocialAccounts();
      const byRegion: Record<string, number> = {};
      const byPlatform: Record<string, Record<string, number>> = {};
      let unassigned = 0;

      for (const account of accounts) {
        const region = await this.getAccountRegion(account.id);
        
        if (region) {
          byRegion[region] = (byRegion[region] || 0) + 1;
          
          if (!byPlatform[account.platform]) {
            byPlatform[account.platform] = {};
          }
          byPlatform[account.platform][region] = (byPlatform[account.platform][region] || 0) + 1;
        } else {
          unassigned++;
        }
      }

      await this.updateRegionMetrics();
      const regionMetrics = Object.fromEntries(this.regionMetrics);

      return {
        byRegion,
        byPlatform,
        unassigned,
        totalAccounts: accounts.length,
        regionMetrics
      };
      
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return {
        byRegion: {},
        byPlatform: {},
        unassigned: 0,
        totalAccounts: 0,
        regionMetrics: {}
      };
    }
  }
}

export default RegionAssignmentService;