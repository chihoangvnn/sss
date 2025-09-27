import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Prevent memory leaks

  set(key: string, data: any, ttlSeconds: number = 300): void {
    // Clean old entries if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.cleanExpiredEntries();
      
      // If still too large, remove oldest entries
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for monitoring
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const cache = new InMemoryCache();

/**
 * Cache middleware for API responses
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 * @param keyGenerator - Custom function to generate cache key
 */
export function cacheMiddleware(
  ttlSeconds: number = 300,
  keyGenerator?: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const defaultKey = `${req.originalUrl || req.url}`;
    const cacheKey = keyGenerator ? keyGenerator(req) : defaultKey;
    
    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`🚀 Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttlSeconds);
        console.log(`💾 Cache SET: ${cacheKey} (TTL: ${ttlSeconds}s)`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Cache invalidation middleware for write operations
 * @param pattern - Pattern to match for cache invalidation
 */
export function invalidateCacheMiddleware(pattern?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Override res.json to invalidate cache after successful operations
    const originalJson = res.json;
    res.json = function(data: any) {
      // Only invalidate cache for successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.invalidate(pattern);
        console.log(`🗑️ Cache INVALIDATED: ${pattern || 'all'}`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

// Export cache instance for manual operations
export { cache };

// Performance optimized cache keys for Vietnamese incense business
export const CacheKeys = {
  // Product caching with smart keys
  products: (categoryId?: string, search?: string, sortBy?: string) => {
    const parts = ['products'];
    if (categoryId && categoryId !== 'all') parts.push(`cat:${categoryId}`);
    if (search) parts.push(`search:${search.toLowerCase()}`);
    if (sortBy) parts.push(`sort:${sortBy}`);
    return parts.join('|');
  },
  
  product: (id: string) => `product:${id}`,
  productSlug: (slug: string) => `product:slug:${slug}`,
  categories: () => 'categories',
  popularProducts: () => 'products:popular'
};