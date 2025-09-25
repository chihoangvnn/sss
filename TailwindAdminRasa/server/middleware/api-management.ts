import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { ApiConfiguration } from '@shared/schema';
import pathToRegexp from 'path-to-regexp';

// Enhanced cache for API configurations with pattern matching support
interface PatternCacheEntry {
  configs: ApiConfiguration[];
  compiledPatterns: Map<string, { pattern: RegExp; config: ApiConfiguration }>;
  timestamp: number;
}

class ApiConfigurationCache {
  private allConfigsCache: PatternCacheEntry | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache

  private isExpired(entry: PatternCacheEntry): boolean {
    return Date.now() - entry.timestamp > this.TTL;
  }

  async getAllConfigs(): Promise<PatternCacheEntry> {
    if (this.allConfigsCache && !this.isExpired(this.allConfigsCache)) {
      return this.allConfigsCache;
    }

    // Fetch all configurations from database
    const configs = await storage.getApiConfigurations();
    
    // Compile patterns for each configuration
    const compiledPatterns = new Map<string, { pattern: RegExp; config: ApiConfiguration }>();
    
    for (const config of configs) {
      try {
        // Create a unique key for method + endpoint pattern
        const key = `${config.method}:${config.endpoint}`;
        const pattern = pathToRegexp(config.endpoint);
        console.log(`✅ Compiled pattern for ${config.endpoint}: ${pattern instanceof RegExp} - ${pattern.toString()}`);
        compiledPatterns.set(key, { pattern, config });
      } catch (error) {
        console.warn(`Failed to compile pattern for ${config.method} ${config.endpoint}:`, error);
      }
    }

    // Cache the compiled patterns
    this.allConfigsCache = {
      configs,
      compiledPatterns,
      timestamp: Date.now()
    };

    return this.allConfigsCache;
  }

  async findMatchingConfig(requestPath: string, method: string): Promise<ApiConfiguration | null> {
    const cacheEntry = await this.getAllConfigs();
    
    // First try exact match for performance
    const exactKey = `${method}:${requestPath}`;
    const exactMatch = cacheEntry.compiledPatterns.get(exactKey);
    if (exactMatch) {
      return exactMatch.config;
    }
    
    // Then try pattern matching
    for (const [key, { pattern, config }] of Array.from(cacheEntry.compiledPatterns)) {
      if (key.startsWith(`${method}:`)) {
        if (pattern.test(requestPath)) {
          return config;
        }
      }
    }
    
    return null;
  }

  clear(): void {
    this.allConfigsCache = null;
  }

  // Invalidate the entire cache when configurations change
  invalidate(): void {
    this.allConfigsCache = null;
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

    const requestPath = req.path;
    const method = req.method;
    const startTime = Date.now();

    try {
      // Find matching API configuration using pattern matching
      const config = await configCache.findMatchingConfig(requestPath, method);

      if (!config) {
        // No configuration found - create default tracking for unconfigured APIs
        const defaultConfig = {
          id: 'unconfigured',
          endpoint: requestPath,
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
          endpoint: requestPath,
          timestamp: new Date().toISOString()
        });
      }

      // Check maintenance mode
      if (config.maintenanceMode) {
        return res.status(503).json({
          error: 'Maintenance Mode',
          message: config.maintenanceMessage || 'This API is under maintenance',
          code: 'MAINTENANCE_MODE',
          endpoint: requestPath,
          // No specific maintenance end time in schema
          timestamp: new Date().toISOString()
        });
      }

      // Check rate limiting (basic implementation)
      if (config.rateLimitEnabled && config.rateLimitRequests && config.rateLimitWindowSeconds) {
        // For now, we just log rate limit info
        // A full implementation would require redis or in-memory tracking
        console.log(`Rate limit check: ${config.rateLimitRequests} requests per ${config.rateLimitWindowSeconds}s for ${requestPath}`);
      }

      // Store config and start time for response tracking
      (req as any).apiConfig = config;
      (req as any).apiStartTime = startTime;

      // Continue to the actual route handler
      next();

    } catch (error) {
      console.error('🚨 API Management Middleware Error:', error);
      console.error('🚨 Error details:', error instanceof Error ? error.message : String(error));
      console.error('🚨 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
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
  invalidate: () => configCache.invalidate()
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