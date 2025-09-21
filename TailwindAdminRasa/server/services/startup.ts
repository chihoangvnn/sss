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