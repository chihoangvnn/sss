import { db } from '../db';
import { socialAccounts, contentLibrary, scheduledPosts, unifiedTags, facebookApps } from '../../shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { 
  SocialAccount, 
  ContentLibrary, 
  FanpageContentPreferences, 
  SmartSchedulingRules 
} from '../../shared/schema';

// Smart Scheduler Configuration Interface
export interface SmartSchedulingConfig {
  selectedTags: string[];
  selectedFanpages: string[];
  contentTypes: ('image' | 'video' | 'text')[];
  includingText: boolean;
  schedulingPeriod: {
    startDate: string;
    endDate: string;
    timeSlots: string[];
    timezone?: string;
  };
  distributionMode: 'even' | 'weighted' | 'smart';
  postsPerDay: number;
  preview?: boolean;
}

// Content Match Result Interface  
export interface ContentMatch {
  contentId: string;
  fanpageId: string;
  score: number;
  reasons: string[];
  scheduledTime: string;
  contentTitle: string;
  fanpageName: string;
  contentType: string;
}

// Smart Scheduler Analytics
export interface SmartSchedulingResult {
  totalPosts: number;
  fanpageCount: number;
  contentMatched: number;
  avgScore: number;
  timeDistribution: Record<string, number>;
  matches: ContentMatch[];
}

export class SmartSchedulerService {
  
  /**
   * Generate preview of smart scheduling distribution
   */
  async generatePreview(config: SmartSchedulingConfig): Promise<ContentMatch[]> {
    console.log('🎯 Smart Scheduler: Generating preview with config:', config);
    
    try {
      // 1. Fetch relevant data - AUTO-SELECT fanpages based on Facebook Apps tags
      const [fanpages, content, tags] = await Promise.all([
        config.selectedFanpages && config.selectedFanpages.length > 0 
          ? this.getFanpagesByIds(config.selectedFanpages) // Use manual selection if provided
          : this.getFanpagesByTags(config.selectedTags), // Auto-select based on Facebook Apps tags
        this.getMatchingContent(config.selectedTags, config.contentTypes),
        this.getTagsMap()
      ]);

      console.log(`📊 Found ${fanpages.length} fanpages, ${content.length} content items`);

      // 2. Generate smart matches
      const matches = await this.generateSmartMatches(
        fanpages, 
        content, 
        config, 
        tags
      );

      console.log(`🔮 Generated ${matches.length} smart matches`);
      return matches;

    } catch (error) {
      console.error('❌ Smart Scheduler preview error:', error);
      throw new Error(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute smart scheduling and create actual scheduled posts
   */
  async executeSmartScheduling(config: SmartSchedulingConfig): Promise<SmartSchedulingResult> {
    console.log('🚀 Smart Scheduler: Executing smart scheduling');
    
    try {
      // 1. Generate matches first (same as preview)
      const matches = await this.generatePreview(config);
      
      if (matches.length === 0) {
        throw new Error('No content matches found for the given configuration');
      }

      // 2. Re-fetch data for post creation - get fanpages from matches, not config
      const fanpageIds = Array.from(new Set(matches.map(m => m.fanpageId)));
      const [fanpages, content] = await Promise.all([
        this.getFanpagesByIds(fanpageIds), // Use fanpage IDs from generated matches
        this.getMatchingContent(config.selectedTags, config.contentTypes)
      ]);

      // 3. Create scheduled posts in database with proper data mapping
      const scheduledPostsData = await Promise.all(matches.map(async match => {
        // Get the content item to extract asset IDs
        const contentItem = content.find(c => c.id === match.contentId);
        const fanpage = fanpages.find(f => f.id === match.fanpageId);
        
        return {
          caption: `${match.contentTitle}\n\n#smartscheduled #automated`,
          hashtags: this.generateHashtagsArray(match.reasons),
          assetIds: contentItem?.assetIds || [], // Use actual asset IDs from content
          socialAccountId: match.fanpageId,
          platform: this.mapPlatformToValidType(fanpage?.platform) || 'facebook' as const, // Use fanpage's actual platform
          scheduledTime: new Date(match.scheduledTime),
          timezone: config.schedulingPeriod?.timezone || 'Asia/Ho_Chi_Minh',
          status: 'scheduled' as const,
        };
      }));

      // 4. Bulk insert scheduled posts with transaction safety
      const createdPosts = await db.insert(scheduledPosts)
        .values(scheduledPostsData)
        .returning();

      // 5. Generate analytics
      const result: SmartSchedulingResult = {
        totalPosts: createdPosts.length,
        fanpageCount: new Set(matches.map(m => m.fanpageId)).size,
        contentMatched: new Set(matches.map(m => m.contentId)).size,
        avgScore: matches.reduce((acc, m) => acc + m.score, 0) / matches.length,
        timeDistribution: this.analyzeTimeDistribution(matches),
        matches
      };

      console.log(`✅ Smart Scheduler completed: ${result.totalPosts} posts scheduled`);
      return result;

    } catch (error) {
      console.error('❌ Smart Scheduler execution error:', error);
      throw new Error(`Failed to execute smart scheduling: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate smart content-fanpage matches
   */
  private async generateSmartMatches(
    fanpages: SocialAccount[],
    content: ContentLibrary[],
    config: SmartSchedulingConfig,
    tagsMap: Map<string, string>
  ): Promise<ContentMatch[]> {
    const matches: ContentMatch[] = [];
    const timeSlots = this.generateTimeSlots(config);
    
    console.log(`📝 Generating matches for ${content.length} content items across ${fanpages.length} fanpages`);
    console.log(`⏰ Time slots generated: ${timeSlots.length} slots`);

    // Filter content based on selected content types and includingText preference
    let filteredContent = content;
    
    // If specific content types are selected, filter to those types
    if (config.contentTypes && config.contentTypes.length > 0) {
      filteredContent = content.filter(item => config.contentTypes.includes(item.contentType as 'image' | 'video' | 'text'));
    }
    
    // Additional filter: exclude text if includingText is false
    if (!config.includingText) {
      filteredContent = filteredContent.filter(item => item.contentType !== 'text');
    }

    console.log(`🧹 Filtered content: ${filteredContent.length} items after filtering`);
    filteredContent.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}" (type: ${item.contentType}, tags: ${JSON.stringify(item.tagIds)})`);
    });

    // Shuffle content for randomness
    const shuffledContent = this.shuffleArray([...filteredContent]);
    let timeSlotIndex = 0;
    const usedTimeSlots = new Set<string>(); // Track used time slots to prevent collisions

    for (const contentItem of shuffledContent) {
      console.log(`🔍 Processing content: "${contentItem.title}" (type: ${contentItem.contentType}, tags: ${JSON.stringify(contentItem.tagIds)})`);
      
      // Find best matching fanpages for this content
      const fanpageScores = fanpages.map(fanpage => {
        const score = this.calculateContentFanpageScore(contentItem, fanpage, config.selectedTags, tagsMap);
        const reasons = this.getMatchingReasons(contentItem, fanpage, config.selectedTags, tagsMap);
        console.log(`💯 Fanpage "${fanpage.name}" score: ${score}, reasons: ${JSON.stringify(reasons)}`);
        return {
          fanpage,
          score,
          reasons
        };
      }).filter(item => {
        const isCompatible = item.score > 0;
        console.log(`🎯 Fanpage "${item.fanpage.name}" compatible: ${isCompatible} (score: ${item.score})`);
        return isCompatible;
      }); // Only include compatible fanpages

      // Sort by score (best matches first)
      fanpageScores.sort((a, b) => b.score - a.score);

      // Distribute content based on mode
      const selectedFanpages = this.selectFanpagesForContent(
        fanpageScores, 
        config.distributionMode
      );

      // Create matches for selected fanpages
      for (const selection of selectedFanpages) {
        if (timeSlotIndex < timeSlots.length) {
          const timeSlot = timeSlots[timeSlotIndex];
          const collisionKey = `${selection.fanpage.id}-${timeSlot}`;
          
          // Skip if this fanpage already has a post at this time
          if (!usedTimeSlots.has(collisionKey)) {
            matches.push({
              contentId: contentItem.id,
              fanpageId: selection.fanpage.id,
              score: selection.score,
              reasons: selection.reasons,
              scheduledTime: timeSlot,
              contentTitle: contentItem.title,
              fanpageName: selection.fanpage.name,
              contentType: contentItem.contentType
            });
            usedTimeSlots.add(collisionKey);
            timeSlotIndex++;
          }
        }
      }

      // Break if we've filled all time slots
      if (timeSlotIndex >= timeSlots.length) {
        break;
      }
    }

    console.log(`🎯 Final matches generated: ${matches.length}`);
    return matches;
  }

  /**
   * Calculate compatibility score between content and fanpage
   */
  private calculateContentFanpageScore(
    content: ContentLibrary,
    fanpage: SocialAccount,
    selectedTags: string[],
    tagsMap: Map<string, string>
  ): number {
    const preferences = fanpage.contentPreferences as FanpageContentPreferences | null;
    if (!preferences) return 50; // Default neutral score

    let score = 0;
    const maxScore = 100;

    // 1. Tag Matching (40% weight)
    const contentTags = content.tagIds || [];
    const preferredTags = preferences.preferredTags || [];
    const excludedTags = preferences.excludedTags || [];

    // Check for excluded tags (immediate disqualification)
    const hasExcludedTag = contentTags.some(tagId => excludedTags.includes(tagId));
    if (hasExcludedTag) return 0;

    // Calculate preferred tag matches
    const matchingPreferredTags = contentTags.filter(tagId => preferredTags.includes(tagId));
    const preferredTagScore = preferredTags.length > 0 
      ? (matchingPreferredTags.length / preferredTags.length) * 40 
      : 20; // Neutral if no preferences set

    score += preferredTagScore;

    // 2. Content Type Compatibility (30% weight)
    const mediaRatio = preferences.mediaRatio || { image: 70, video: 25, textOnly: 5 };
    const contentTypeScore = this.getContentTypeScore(content.contentType, mediaRatio);
    score += contentTypeScore * 0.3;

    // 3. Selected Tag Relevance (20% weight)
    const selectedTagMatches = contentTags.filter(tagId => selectedTags.includes(tagId));
    const selectedTagScore = selectedTags.length > 0 
      ? (selectedTagMatches.length / selectedTags.length) * 20 
      : 10;

    score += selectedTagScore;

    // 4. Performance Score Bonus (10% weight)
    const performanceScore = parseFloat(fanpage.performanceScore?.toString() || '0');
    score += (performanceScore / 100) * 10;

    return Math.min(Math.round(score), maxScore);
  }

  /**
   * Get content type compatibility score
   */
  private getContentTypeScore(contentType: string, mediaRatio: any): number {
    switch (contentType) {
      case 'image': return mediaRatio.image || 70;
      case 'video': return mediaRatio.video || 25; 
      case 'text': return mediaRatio.textOnly || 5;
      default: return 50;
    }
  }

  /**
   * Get matching reasons for debugging/transparency
   */
  private getMatchingReasons(
    content: ContentLibrary,
    fanpage: SocialAccount,
    selectedTags: string[],
    tagsMap: Map<string, string>
  ): string[] {
    const reasons: string[] = [];
    const preferences = fanpage.contentPreferences as FanpageContentPreferences | null;
    
    if (!preferences) {
      reasons.push('Default compatibility');
      return reasons;
    }

    const contentTags = content.tagIds || [];
    
    // Check preferred tags
    const matchingPreferred = contentTags.filter(tagId => preferences.preferredTags.includes(tagId));
    if (matchingPreferred.length > 0) {
      const tagNames = matchingPreferred.map(id => tagsMap.get(id) || id).join(', ');
      reasons.push(`Preferred tags: ${tagNames}`);
    }

    // Check content type preference
    const mediaRatio = preferences.mediaRatio || {};
    const typeScore = this.getContentTypeScore(content.contentType, mediaRatio);
    if (typeScore >= 50) {
      reasons.push(`Content type: ${content.contentType} (${typeScore}% preference)`);
    }

    // Check selected tag overlap
    const selectedTagMatches = contentTags.filter(tagId => selectedTags.includes(tagId));
    if (selectedTagMatches.length > 0) {
      const tagNames = selectedTagMatches.map(id => tagsMap.get(id) || id).join(', ');
      reasons.push(`Campaign tags: ${tagNames}`);
    }

    return reasons.length > 0 ? reasons : ['Basic compatibility'];
  }

  /**
   * Select fanpages for content based on distribution mode
   */
  private selectFanpagesForContent(
    fanpageScores: Array<{fanpage: SocialAccount, score: number, reasons: string[]}>,
    distributionMode: string
  ): Array<{fanpage: SocialAccount, score: number, reasons: string[]}> {
    
    if (fanpageScores.length === 0) return [];

    switch (distributionMode) {
      case 'even':
        // Distribute to all compatible fanpages
        return fanpageScores.filter(item => item.score >= 30);
        
      case 'weighted':
        // Prefer higher-scoring fanpages, but include others probabilistically
        const totalScore = fanpageScores.reduce((sum, item) => sum + item.score, 0);
        return fanpageScores.filter(item => {
          const probability = item.score / totalScore;
          return Math.random() < probability || item.score >= 70;
        });
        
      case 'smart':
        // Use AI-like selection: best match + some diversity
        const selected = [];
        
        // Always include the best match
        if (fanpageScores[0]?.score >= 50) {
          selected.push(fanpageScores[0]);
        }
        
        // Add 1-2 more diverse matches if available
        for (let i = 1; i < Math.min(3, fanpageScores.length); i++) {
          if (fanpageScores[i].score >= 40 && Math.random() < 0.4) {
            selected.push(fanpageScores[i]);
          }
        }
        
        return selected;
        
      default:
        return fanpageScores.slice(0, 1); // Just return the best match
    }
  }

  /**
   * Generate time slots for scheduling
   */
  private generateTimeSlots(config: SmartSchedulingConfig): string[] {
    const { startDate, endDate, timeSlots: dailyTimeSlots } = config.schedulingPeriod;
    const { postsPerDay } = config;
    
    const slots: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Generate time slots for this day
      const daySlots = this.generateDayTimeSlots(currentDate, dailyTimeSlots, postsPerDay);
      slots.push(...daySlots);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return slots;
  }

  /**
   * Generate time slots for a specific day
   */
  private generateDayTimeSlots(date: Date, timeSlots: string[], postsPerDay: number): string[] {
    const slots: string[] = [];
    
    // If specific time slots are provided, use them
    if (timeSlots.length > 0) {
      const slotsToUse = timeSlots.slice(0, postsPerDay);
      
      for (const timeSlot of slotsToUse) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);
        slots.push(slotTime.toISOString());
      }
    } else {
      // Generate evenly distributed slots throughout the day
      const startHour = 9; // 9 AM
      const endHour = 21;   // 9 PM
      const totalHours = endHour - startHour;
      const interval = totalHours / postsPerDay;
      
      for (let i = 0; i < postsPerDay; i++) {
        const hour = Math.floor(startHour + (i * interval));
        const minute = Math.floor((i * interval * 60) % 60);
        
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        slots.push(slotTime.toISOString());
      }
    }
    
    return slots;
  }

  /**
   * Helper: Get fanpages by IDs
   */
  private async getFanpagesByIds(fanpageIds: string[]): Promise<SocialAccount[]> {
    if (fanpageIds.length === 0) return [];
    
    return await db.select()
      .from(socialAccounts)
      .where(inArray(socialAccounts.id, fanpageIds));
  }

  /**
   * Helper: Auto-select fanpages based on Facebook Apps tags
   */
  private async getFanpagesByTags(selectedTags: string[]): Promise<SocialAccount[]> {
    if (selectedTags.length === 0) {
      // If no tags selected, return all Facebook social accounts as fallback
      return await db.select()
        .from(socialAccounts)
        .where(eq(socialAccounts.platform, 'facebook'));
    }

    console.log(`🔍 Auto-selecting fanpages based on tags: ${JSON.stringify(selectedTags)}`);
    
    // Fix SQL injection: use parameterized query
    const tagParams = selectedTags.map(tag => sql`${tag}`);
    const matchingFacebookApps = await db.select()
      .from(facebookApps)
      .where(
        and(
          eq(facebookApps.isActive, true),
          sql`${facebookApps.tagIds} ?| array[${sql.join(tagParams, sql`, `)}]`
        )
      );

    console.log(`📱 Found ${matchingFacebookApps.length} Facebook Apps with matching tags`);
    
    if (matchingFacebookApps.length === 0) {
      console.log(`ℹ️  No Facebook Apps found with matching tags, returning empty array`);
      // If no Facebook Apps match, return empty array (not all accounts)
      return [];
    }

    // Interim solution: Filter Facebook social accounts by tag intersection
    // Get all Facebook social accounts first
    const allFacebookAccounts = await db.select()
      .from(socialAccounts)
      .where(eq(socialAccounts.platform, 'facebook'));
      
    // Filter by tag overlap (tagIds or contentPreferences.preferredTags)
    // Reuse tagParams from above for consistency
    const filteredFanpages = await db.select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.platform, 'facebook'),
          sql`(
            ${socialAccounts.tagIds} ?| array[${sql.join(tagParams, sql`, `)}] OR
            jsonb_extract_path(${socialAccounts.contentPreferences}, 'preferredTags') ?| array[${sql.join(tagParams, sql`, `)}]
          )`
        )
      );
      
    console.log(`🎯 Filtered ${filteredFanpages.length}/${allFacebookAccounts.length} Facebook fanpages by tag intersection`);
    
    // Fallback: if no tag-matched accounts found, use all Facebook accounts
    if (filteredFanpages.length === 0) {
      console.log(`ℹ️  No fanpages matched tags, using all ${allFacebookAccounts.length} Facebook accounts as fallback`);
      return allFacebookAccounts;
    }
    
    return filteredFanpages;
  }

  /**
   * Helper: Get content matching tags and types
   */
  private async getMatchingContent(
    tagIds: string[], 
    contentTypes: string[]
  ): Promise<ContentLibrary[]> {
    
    // Handle empty tagIds case - return all content matching types
    if (tagIds.length === 0) {
      return await db.select()
        .from(contentLibrary)
        .where(inArray(contentLibrary.contentType, contentTypes as any));
    }
    
    const query = db.select()
      .from(contentLibrary)
      .where(
        and(
          sql`${contentLibrary.tagIds} ?| array[${sql.join(tagIds.map(id => sql`${id}`), sql`, `)}]`, // PostgreSQL JSONB ?| operator for array overlap
          inArray(contentLibrary.contentType, contentTypes as any)
        )
      );
      
    return await query;
  }

  /**
   * Helper: Get tags map for name resolution
   */
  private async getTagsMap(): Promise<Map<string, string>> {
    const tags = await db.select().from(unifiedTags);
    return new Map(tags.map((tag: any) => [tag.id, tag.name]));
  }

  /**
   * Map platform to valid type for scheduled posts
   */
  private mapPlatformToValidType(platform?: string): 'facebook' | 'instagram' | 'twitter' | 'tiktok' {
    switch (platform) {
      case 'tiktok-business':
      case 'tiktok-shop':
        return 'tiktok';
      case 'facebook':
      case 'instagram':
      case 'twitter':
      case 'tiktok':
        return platform;
      default:
        return 'facebook';
    }
  }

  /**
   * Helper: Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Helper: Generate hashtags array from reasons
   */
  private generateHashtagsArray(reasons: string[]): string[] {
    const baseHashtags = ['smartscheduled', 'automated'];
    
    // Extract tag names from reasons
    const extractedTags = reasons
      .filter(reason => reason.includes(':'))
      .map(reason => reason.split(':')[1]?.trim())
      .filter(Boolean)
      .flatMap(tagString => tagString.split(',').map(tag => tag.trim().replace(/\s+/g, '').toLowerCase()))
      .slice(0, 3); // Limit to 3 additional hashtags
    
    return [...baseHashtags, ...extractedTags];
  }

  /**
   * Helper: Analyze time distribution
   */
  private analyzeTimeDistribution(matches: ContentMatch[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    matches.forEach(match => {
      const hour = new Date(match.scheduledTime).getHours();
      const timeSlot = `${hour}:00`;
      distribution[timeSlot] = (distribution[timeSlot] || 0) + 1;
    });
    
    return distribution;
  }
}

// Export singleton instance
export const smartSchedulerService = new SmartSchedulerService();