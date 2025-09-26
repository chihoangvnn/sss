// Optimized hook for lunar calendar data with caching and performance optimizations

import { useState, useCallback, useRef, useEffect } from 'react';
import { lunarDataCache, debounce } from '@/lib/cache';

// Extend window object for global active requests tracking
declare global {
  interface Window {
    __lunarDataActiveRequests?: Map<string, Promise<any>>;
  }
}

interface LunarDay {
  solarDate: string;
  lunarDate: number;
  lunarMonth: number;
  lunarYear: number;
  canChi: string;
  isGoodDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isToday: boolean;
  dayQuality: 'good' | 'normal' | 'bad';
  productSuggestions: string[];
}

interface LunarMonthData {
  days: LunarDay[];
  monthInfo: {
    lunarMonth: number;
    lunarYear: number;
    canChiMonth: string;
    seasonContext: string;
  };
}

interface UseLunarDataState {
  data: LunarMonthData | null;
  loading: boolean;
  error: string | null;
}

interface UseLunarDataOptions {
  prefetchAdjacent?: boolean;
  cacheTime?: number;
}

export function useLunarData(
  year: number,
  month: number,
  options: UseLunarDataOptions = {}
) {
  const { prefetchAdjacent = true, cacheTime = 10 * 60 * 1000 } = options;
  
  const [state, setState] = useState<UseLunarDataState>({
    data: null,
    loading: true,
    error: null,
  });

  // Global requests map to survive re-renders and avoid duplicate fetches
  const getActiveRequests = () => {
    if (!window.__lunarDataActiveRequests) {
      window.__lunarDataActiveRequests = new Map();
    }
    return window.__lunarDataActiveRequests;
  };

  const lastFetchRef = useRef<string>('');

  // Optimized fetch function with request deduplication
  const fetchData = useCallback(async (
    targetYear: number,
    targetMonth: number,
    updateUI = true
  ): Promise<LunarMonthData | null> => {
    const cacheKey = `${targetYear}-${targetMonth}`;
    const activeRequests = getActiveRequests();
    
    // Check cache first
    const cached = lunarDataCache.get(cacheKey);
    if (cached) {
      if (updateUI && cacheKey === `${year}-${month}`) {
        setState(prev => ({ ...prev, data: cached, loading: false, error: null }));
      }
      return cached;
    }

    // Check if request is already in progress
    if (activeRequests.has(cacheKey)) {
      const result = await activeRequests.get(cacheKey);
      if (updateUI && cacheKey === `${year}-${month}`) {
        setState(prev => ({ ...prev, data: result, loading: false, error: null }));
      }
      return result;
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const response = await fetch(
          `/api/lunar-calendar/bulk?startYear=${targetYear}&startMonth=${targetMonth + 1}&months=3`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const bulkData: { [key: string]: LunarMonthData } = await response.json();
        
        // Cache all returned data
        Object.entries(bulkData).forEach(([key, data]) => {
          const [bulkYear, bulkMonth] = key.split('-').map(Number);
          const bulkCacheKey = `${bulkYear}-${bulkMonth - 1}`;
          lunarDataCache.set(bulkCacheKey, data, cacheTime);
        });

        const currentKey = `${targetYear}-${targetMonth + 1}`;
        const result = bulkData[currentKey] || null;
        
        if (!result) {
          throw new Error('Data not found in API response');
        }

        return result;
      } catch (error) {
        console.error(`Failed to fetch lunar data for ${targetYear}-${targetMonth}:`, error);
        throw error;
      } finally {
        getActiveRequests().delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      if (updateUI && cacheKey === `${year}-${month}`) {
        setState(prev => ({ ...prev, data: result, loading: false, error: null }));
      }
      
      return result;
    } catch (error) {
      if (updateUI && cacheKey === `${year}-${month}`) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
      return null;
    }
  }, [year, month, cacheTime]);

  // Debounced fetch to prevent rapid calls
  const debouncedFetch = useCallback(
    debounce(fetchData, 150),
    [fetchData]
  );

  // Main effect for fetching current month data
  useEffect(() => {
    const currentKey = `${year}-${month}`;
    
    // Prevent duplicate requests for the same key
    if (lastFetchRef.current === currentKey) {
      return;
    }
    
    lastFetchRef.current = currentKey;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Fetch current month data
    fetchData(year, month, true);
    
    // Prefetch adjacent months if enabled
    if (prefetchAdjacent) {
      setTimeout(() => {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        
        // Prefetch without UI updates
        fetchData(nextYear, nextMonth, false);
        fetchData(prevYear, prevMonth, false);
      }, 200);
    }
  }, [year, month, prefetchAdjacent, fetchData]);

  return {
    ...state,
    refetch: useCallback(() => {
      // Only clear specific cache entry, not entire cache
      const cacheKey = `${year}-${month}`;
      lunarDataCache.delete(cacheKey);
      setState(prev => ({ ...prev, loading: true, error: null }));
      fetchData(year, month, true);
    }, [year, month, fetchData]),
  };
}