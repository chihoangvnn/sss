import JobClaimWorker from './job-claim-worker';

/**
 * Server Startup Service
 * Handles initialization of critical services when the server starts
 */
class StartupService {
  private static initialized = false;

  /**
   * Initialize all critical services
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ StartupService already initialized');
      return;
    }

    console.log('🚀 Initializing distributed auto-posting services...');

    try {
      // Validate region consistency before starting workers
      await this.validateRegionConsistency();
      
      // Start BullMQ claim workers for atomic job claiming
      await JobClaimWorker.startAllClaimWorkers();
      
      this.initialized = true;
      console.log('✅ All distributed auto-posting services initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Validate that region configurations are consistent across services
   */
  private static async validateRegionConsistency(): Promise<void> {
    try {
      // Import region configuration from centralized module
      const { SUPPORTED_REGIONS } = await import('./regions');
      
      // Import services for validation
      const RegionAssignmentModule = await import('./region-assignment');
      const RegionAssignmentService = RegionAssignmentModule.default;
      
      // Get actual regions from services
      const assignmentRegions = new Set(RegionAssignmentService.getGlobalRegions());
      const geoRegionsValues = new Set(RegionAssignmentService.getGeoRegionsValues());
      const supportedRegions = new Set(SUPPORTED_REGIONS);

      console.log('🔍 Validating region consistency...');
      console.log(`📍 Centralized supported regions: ${supportedRegions.size}`);
      console.log(`📍 RegionAssignment regions: ${assignmentRegions.size}`);
      console.log(`📍 GeoRegions unique values: ${geoRegionsValues.size}`);

      // Check RegionAssignment consistency with centralized regions
      const assignmentOnly = [...assignmentRegions].filter(r => !supportedRegions.has(r));
      const supportedOnly = [...supportedRegions].filter(r => !assignmentRegions.has(r));
      const regionDifference = [...assignmentOnly, ...supportedOnly];
      
      if (regionDifference.length > 0) {
        console.error(`❌ Region mismatch between services: ${regionDifference.join(', ')}`);
        throw new Error('RegionAssignmentService regions do not match centralized SUPPORTED_REGIONS');
      }

      // Check all GeoRegions values are in SUPPORTED_REGIONS
      const invalidGeoRegions = [...geoRegionsValues].filter(region => !supportedRegions.has(region));
      if (invalidGeoRegions.length > 0) {
        console.error(`❌ GeoRegions contains invalid regions: ${invalidGeoRegions.join(', ')}`);
        throw new Error('Some GeoRegions point to unsupported regions');
      }

      console.log(`✅ Region validation passed - all ${supportedRegions.size} regions consistent across services`);
      
    } catch (error) {
      console.error('❌ Region validation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Region configuration inconsistency detected: ${errorMessage}`);
    }
  }

  /**
   * Graceful shutdown of all services
   */
  static async shutdown(): Promise<void> {
    if (!this.initialized) {
      console.log('⚠️ StartupService not initialized, nothing to shutdown');
      return;
    }

    console.log('🛑 Shutting down distributed auto-posting services...');

    try {
      // Stop all claim workers
      await JobClaimWorker.stopAllClaimWorkers();
      
      this.initialized = false;
      console.log('✅ All services shut down successfully');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Check if services are initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get system status
   */
  static getStatus(): SystemStatus {
    return {
      initialized: this.initialized,
      claimWorkers: this.initialized ? JobClaimWorker.getClaimStats() : null,
      timestamp: new Date().toISOString()
    };
  }
}

interface SystemStatus {
  initialized: boolean;
  claimWorkers: any;
  timestamp: string;
}

export default StartupService;