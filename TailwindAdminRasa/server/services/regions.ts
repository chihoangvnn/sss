/**
 * Centralized Region Configuration
 * 
 * Single source of truth for all supported regions in the Brain-Arms-Satellites system.
 * Used by RegionAssignmentService, JobClaimWorker, and validation services.
 */

/**
 * All supported regions for global deployment
 * Covers Americas, Europe, Asia Pacific, Middle East, and Africa
 */
export const SUPPORTED_REGIONS = [
  // Americas
  'us-east-1', 'us-west-2', 'sa-east-1',
  // Europe 
  'eu-west-1', 'eu-central-1', 'eu-south-1', 'eu-north-1',
  // Asia Pacific
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1',
  // Middle East & Africa
  'me-south-1', 'af-south-1'
] as const;

/**
 * Type for supported regions
 */
export type SupportedRegion = typeof SUPPORTED_REGIONS[number];

/**
 * All supported platforms for auto-posting
 */
export const SUPPORTED_PLATFORMS = [
  'facebook', 'instagram', 'twitter', 'tiktok'
] as const;

/**
 * Type for supported platforms
 */
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

/**
 * Regional deployment statistics and information
 */
export const REGION_INFO = {
  'us-east-1': { name: 'N. Virginia', continent: 'Americas', timezone: 'America/New_York' },
  'us-west-2': { name: 'Oregon', continent: 'Americas', timezone: 'America/Los_Angeles' },
  'sa-east-1': { name: 'São Paulo', continent: 'Americas', timezone: 'America/Sao_Paulo' },
  'eu-west-1': { name: 'Ireland', continent: 'Europe', timezone: 'Europe/Dublin' },
  'eu-central-1': { name: 'Frankfurt', continent: 'Europe', timezone: 'Europe/Berlin' },
  'eu-south-1': { name: 'Milan', continent: 'Europe', timezone: 'Europe/Rome' },
  'eu-north-1': { name: 'Stockholm', continent: 'Europe', timezone: 'Europe/Stockholm' },
  'ap-southeast-1': { name: 'Singapore', continent: 'Asia Pacific', timezone: 'Asia/Singapore' },
  'ap-southeast-2': { name: 'Sydney', continent: 'Asia Pacific', timezone: 'Australia/Sydney' },
  'ap-northeast-1': { name: 'Tokyo', continent: 'Asia Pacific', timezone: 'Asia/Tokyo' },
  'ap-south-1': { name: 'Mumbai', continent: 'Asia Pacific', timezone: 'Asia/Kolkata' },
  'me-south-1': { name: 'Bahrain', continent: 'Middle East', timezone: 'Asia/Bahrain' },
  'af-south-1': { name: 'Cape Town', continent: 'Africa', timezone: 'Africa/Johannesburg' }
} as const;

/**
 * Utility functions for region validation and management
 */
export class RegionUtils {
  /**
   * Check if a region is supported
   */
  static isValidRegion(region: string): region is SupportedRegion {
    return SUPPORTED_REGIONS.includes(region as SupportedRegion);
  }

  /**
   * Check if a platform is supported
   */
  static isValidPlatform(platform: string): platform is SupportedPlatform {
    return SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform);
  }

  /**
   * Get all regions for a specific continent
   */
  static getRegionsByContinent(continent: string): SupportedRegion[] {
    return SUPPORTED_REGIONS.filter(region => 
      REGION_INFO[region].continent === continent
    );
  }

  /**
   * Get region count for validation
   */
  static getTotalRegionCount(): number {
    return SUPPORTED_REGIONS.length;
  }

  /**
   * Validate that an array contains only valid regions
   */
  static validateRegionArray(regions: string[]): string[] {
    const invalid = regions.filter(r => !RegionUtils.isValidRegion(r));
    if (invalid.length > 0) {
      throw new Error(`Invalid regions: ${invalid.join(', ')}`);
    }
    return regions;
  }
}