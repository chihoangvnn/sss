import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useApiPerformance } from './usePerformanceMonitor';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  // Enhanced caching options
  prefetch?: boolean;
  prefetchOnMount?: boolean;
  backgroundRefresh?: boolean;
  backgroundRefreshInterval?: number;
  
  // Performance options
  enablePerformanceTracking?: boolean;
  deduplicationWindow?: number; // ms to deduplicate identical requests
  
  // Vietnamese retail specific options
  inventoryTracking?: boolean; // For products with stock tracking
  customerDataCaching?: boolean; // For customer data with longer cache times
}

interface QueryCache<T> {
  data: T;
  timestamp: number;
  requestId: string;
}

// Global request deduplication cache
const requestCache = new Map<string, Promise<any>>();
const dataCache = new Map<string, QueryCache<any>>();

// Cleanup old cache entries
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, cache] of dataCache.entries()) {
    if (now - cache.timestamp > maxAge) {
      dataCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export function useOptimizedQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
): UseQueryResult<T> & {
  prefetch: () => Promise<void>;
  backgroundRefresh: () => Promise<void>;
  clearCache: () => void;
} {
  const {
    prefetch = false,
    prefetchOnMount = false,
    backgroundRefresh = false,
    backgroundRefreshInterval = 5 * 60 * 1000, // 5 minutes
    enablePerformanceTracking = true,
    deduplicationWindow = 1000, // 1 second
    inventoryTracking = false,
    customerDataCaching = false,
    ...queryOptions
  } = options;

  const queryClient = useQueryClient();
  const { measureApiCall } = useApiPerformance();
  const backgroundRefreshRef = useRef<NodeJS.Timeout>();
  const lastRequestRef = useRef<number>(0);

  // Generate cache key
  const cacheKey = useMemo(() => JSON.stringify(queryKey), [queryKey]);

  // Enhanced query function with performance tracking and deduplication
  const enhancedQueryFn = useCallback(async (): Promise<T> => {
    const now = Date.now();
    
    // Request deduplication
    if (deduplicationWindow > 0) {
      const timeSinceLastRequest = now - lastRequestRef.current;
      if (timeSinceLastRequest < deduplicationWindow) {
        // Check if we have a cached response
        const cached = dataCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < deduplicationWindow) {
          if (import.meta.env.DEV) {
            console.log(`🔄 Deduplicated request for key: ${cacheKey}`);
          }
          return cached.data;
        }
      }
      lastRequestRef.current = now;
    }

    // Check for existing request in flight
    if (requestCache.has(cacheKey)) {
      if (import.meta.env.DEV) {
        console.log(`⏳ Request in flight, waiting for key: ${cacheKey}`);
      }
      return await requestCache.get(cacheKey);
    }

    // Create new request with performance tracking
    const requestPromise = enablePerformanceTracking
      ? measureApiCall(cacheKey, queryFn)
      : queryFn();

    // Store request in cache
    requestCache.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result
      dataCache.set(cacheKey, {
        data: result,
        timestamp: now,
        requestId: Math.random().toString(36).substring(7),
      });

      return result;
    } finally {
      // Remove from request cache when complete
      requestCache.delete(cacheKey);
    }
  }, [queryFn, cacheKey, deduplicationWindow, enablePerformanceTracking, measureApiCall]);

  // Optimized stale time based on data type
  const optimizedStaleTime = useMemo(() => {
    if (queryOptions.staleTime !== undefined) {
      return queryOptions.staleTime;
    }

    // Vietnamese retail specific optimizations
    if (inventoryTracking) {
      // Product inventory changes frequently - shorter cache
      return 2 * 60 * 1000; // 2 minutes
    }

    if (customerDataCaching) {
      // Customer data changes less frequently - longer cache
      return 10 * 60 * 1000; // 10 minutes
    }

    // Default for POS operations
    return 5 * 60 * 1000; // 5 minutes
  }, [queryOptions.staleTime, inventoryTracking, customerDataCaching]);

  // Optimized cache time based on data type
  const optimizedCacheTime = useMemo(() => {
    if (queryOptions.cacheTime !== undefined) {
      return queryOptions.cacheTime;
    }

    // Longer cache for stable data
    if (customerDataCaching) {
      return 30 * 60 * 1000; // 30 minutes
    }

    // Shorter cache for inventory data
    if (inventoryTracking) {
      return 10 * 60 * 1000; // 10 minutes
    }

    return 15 * 60 * 1000; // 15 minutes default
  }, [queryOptions.cacheTime, inventoryTracking, customerDataCaching]);

  // Main query with optimized options
  const query = useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    staleTime: optimizedStaleTime,
    cacheTime: optimizedCacheTime,
    refetchOnWindowFocus: false, // Disable for POS environment
    refetchOnMount: false, // Use cache when available
    ...queryOptions,
  });

  // Prefetch function
  const prefetchQuery = useCallback(async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: enhancedQueryFn,
        staleTime: optimizedStaleTime,
      });
      
      if (import.meta.env.DEV) {
        console.log(`🚀 Prefetched query: ${cacheKey}`);
      }
    } catch (error) {
      console.error('Prefetch failed:', error);
    }
  }, [queryClient, queryKey, enhancedQueryFn, optimizedStaleTime, cacheKey]);

  // Background refresh function
  const backgroundRefreshQuery = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey });
      
      if (import.meta.env.DEV) {
        console.log(`🔄 Background refresh: ${cacheKey}`);
      }
    } catch (error) {
      console.error('Background refresh failed:', error);
    }
  }, [queryClient, queryKey, cacheKey]);

  // Clear cache function
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey });
    dataCache.delete(cacheKey);
    requestCache.delete(cacheKey);
    
    if (import.meta.env.DEV) {
      console.log(`🗑️ Cleared cache: ${cacheKey}`);
    }
  }, [queryClient, queryKey, cacheKey]);

  // Prefetch on mount if enabled
  useEffect(() => {
    if (prefetchOnMount && !query.data && !query.isLoading) {
      prefetchQuery();
    }
  }, [prefetchOnMount, prefetchQuery, query.data, query.isLoading]);

  // Background refresh setup
  useEffect(() => {
    if (backgroundRefresh && backgroundRefreshInterval > 0) {
      backgroundRefreshRef.current = setInterval(() => {
        if (!document.hidden) { // Only refresh when tab is visible
          backgroundRefreshQuery();
        }
      }, backgroundRefreshInterval);

      return () => {
        if (backgroundRefreshRef.current) {
          clearInterval(backgroundRefreshRef.current);
        }
      };
    }
  }, [backgroundRefresh, backgroundRefreshInterval, backgroundRefreshQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
      }
    };
  }, []);

  return {
    ...query,
    prefetch: prefetchQuery,
    backgroundRefresh: backgroundRefreshQuery,
    clearCache,
  };
}

// Specialized hooks for different data types
export function useOptimizedProductQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    inventoryTracking: true,
    backgroundRefresh: true,
    backgroundRefreshInterval: 3 * 60 * 1000, // 3 minutes for product data
  });
}

export function useOptimizedCustomerQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    customerDataCaching: true,
    prefetchOnMount: true, // Prefetch customer data for better UX
  });
}

// Batch query invalidation for related data
export function useBatchInvalidation() {
  const queryClient = useQueryClient();

  const invalidateProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

  const invalidateCustomers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }, [queryClient]);

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateProducts,
    invalidateCustomers,
    invalidateOrders,
    invalidateAll,
  };
}