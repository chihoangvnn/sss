import Redis from 'ioredis';

/**
 * Redis Client Singleton for Queue Management
 * Used for distributed job queue across multiple serverless workers
 */
class RedisService {
  private static instance: Redis | null = null;
  private static isConnected = false;

  /**
   * Get Redis client instance (singleton pattern)
   */
  static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
      
      if (!redisUrl) {
        throw new Error('REDIS_URL or UPSTASH_REDIS_URL environment variable is required');
      }

      this.instance = new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectionName: 'satellite-brain'
      });

      // Single instance error handling
      if (!this.instance.options.enableOfflineQueue) {
        this.instance.on('connect', () => {
          console.log('🔗 Redis connected');
          this.isConnected = true;
        });
        this.instance.on('error', (err) => {
          console.error('❌ Redis error:', err.message);
          this.isConnected = false;
        });
        this.instance.on('close', () => {
          console.log('🔒 Redis connection closed');
          this.isConnected = false;
        });
      }
    }

    return this.instance;
  }

  /**
   * Check if Redis is connected and healthy
   */
  static async isHealthy(): Promise<boolean> {
    try {
      const redis = this.getInstance();
      await redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Graceful shutdown
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
      this.isConnected = false;
      console.log('🔒 Redis disconnected gracefully');
    }
  }

  /**
   * Get Redis info for monitoring
   */
  static async getInfo(): Promise<Record<string, any>> {
    try {
      const redis = this.getInstance();
      const info = await redis.info();
      const memoryInfo = await redis.info('memory');
      
      return {
        connected: this.isConnected,
        uptime: this.extractInfoValue(info, 'uptime_in_seconds'),
        usedMemory: this.extractInfoValue(memoryInfo, 'used_memory_human'),
        connectedClients: this.extractInfoValue(info, 'connected_clients'),
        version: this.extractInfoValue(info, 'redis_version')
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static extractInfoValue(info: string, key: string): string | null {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : null;
  }
}

export default RedisService;