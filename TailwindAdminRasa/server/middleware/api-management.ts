import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { ApiConfiguration } from '@shared/schema';

// Cache for API configurations to avoid database hits on every request
interface CacheEntry {
  config: ApiConfiguration | null;
  timestamp: number;
}

class ApiConfigurationCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache

  private getCacheKey(endpoint: string, method: string): string {
    return `${method}:${endpoint}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.TTL;
  }

  async get(endpoint: string, method: string): Promise<ApiConfiguration | null> {
    const key = this.getCacheKey(endpoint, method);
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached)) {
      return cached.config;
    }

    // Fetch from database
    const config = await storage.getApiConfigurationByEndpoint(endpoint, method);
    
    // Cache the result (even if null)
    this.cache.set(key, {
      config: config || null,
      timestamp: Date.now()
    });

    return config || null;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear cache for specific endpoint
  invalidate(endpoint: string, method?: string): void {
    if (method) {
      const key = this.getCacheKey(endpoint, method);
      this.cache.delete(key);
    } else {
      // Clear all entries for this endpoint
      for (const key of Array.from(this.cache.keys())) {
        if (key.includes(`:${endpoint}`)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

const configCache = new ApiConfigurationCache();

/**
 * API Management Middleware - Controls API endpoint access based on configuration
 * Features:
 * - Enable/disable APIs dynamically
 * - Maintenance mode support
 * - Real-time monitoring and statistics
 * - Caching for performance optimization
 * - Rate limiting checks
 */
export function createApiManagementMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only process API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    // Skip certain endpoints that should always be available
    const skipPaths = [
      '/api/health',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/api-configurations' // API management UI endpoints
    ];

    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const endpoint = req.path;
    const method = req.method;
    const startTime = Date.now();

    try {
      // Get API configuration from cache or database
      const config = await configCache.get(endpoint, method);

      if (!config) {
        // No configuration found - create default tracking for unconfigured APIs
        const defaultConfig = {
          id: 'unconfigured',
          endpoint: endpoint,
          method: method,
          isEnabled: true,
          maintenanceMode: false,
          rateLimitEnabled: false
        } as any;
        
        // Store default config for tracking purposes
        (req as any).apiConfig = defaultConfig;
        (req as any).apiStartTime = startTime;
        (req as any).isUnconfigured = true;
        
        return next();
      }

      // Check if API is disabled
      if (!config.isEnabled) {
        return res.status(503).json({
          error: 'API Disabled',
          message: 'This API endpoint is currently disabled',
          code: 'API_DISABLED',
          endpoint: endpoint,
          timestamp: new Date().toISOString()
        });
      }

      // Check maintenance mode
      if (config.maintenanceMode) {
        return res.status(503).json({
          error: 'Maintenance Mode',
          message: config.maintenanceMessage || 'This API is under maintenance',
          code: 'MAINTENANCE_MODE',
          endpoint: endpoint,
          // No specific maintenance end time in schema
          timestamp: new Date().toISOString()
        });
      }

      // Check rate limiting (basic implementation)
      if (config.rateLimitEnabled && config.rateLimitRequests && config.rateLimitWindowSeconds) {
        // For now, we just log rate limit info
        // A full implementation would require redis or in-memory tracking
        console.log(`Rate limit check: ${config.rateLimitRequests} requests per ${config.rateLimitWindowSeconds}s for ${endpoint}`);
      }

      // Store config and start time for response tracking
      (req as any).apiConfig = config;
      (req as any).apiStartTime = startTime;

      // Continue to the actual route handler
      next();

    } catch (error) {
      console.error('API Management Middleware Error:', error);
      // On error, allow request to proceed to avoid breaking the application
      next();
    }
  };
}

/**
 * Response tracking middleware - Updates API usage statistics
 * Should be mounted after the API management middleware
 */
export function createApiResponseMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only process API routes that have config
    if (!(req as any).apiConfig || !(req as any).apiStartTime) {
      return next();
    }

    const config: ApiConfiguration = (req as any).apiConfig;
    const startTime: number = (req as any).apiStartTime;
    const isUnconfigured = (req as any).isUnconfigured;

    // Hook into response finish event
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;
      
      // Update statistics asynchronously (don't block response)
      setImmediate(async () => {
        try {
          if (isUnconfigured) {
            // For unconfigured APIs, just log the usage (don't update database)
            console.log(`📊 Unconfigured API: ${config.method} ${config.endpoint} - ${res.statusCode} in ${responseTime}ms`);
          } else {
            // For configured APIs, update database statistics
            if (res.statusCode >= 400) {
              // Increment error count
              await storage.incrementApiError(config.id);
            } else {
              // Increment access count and update response time
              await storage.incrementApiAccess(config.id, responseTime);
            }
          }
        } catch (error) {
          console.error('Error updating API statistics:', error);
        }
      });

      // Call original end function
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Cache management functions for external use
 */
export const apiCache = {
  clear: () => configCache.clear(),
  invalidate: (endpoint: string, method?: string) => configCache.invalidate(endpoint, method)
};

/**
 * Middleware setup function - registers both middlewares in correct order
 */
export function setupApiManagement(app: any) {
  // First middleware: Check API status and configuration
  app.use(createApiManagementMiddleware());
  
  // Second middleware: Track response statistics  
  app.use(createApiResponseMiddleware());
  
  console.log('🔧 API Management middleware initialized');
}