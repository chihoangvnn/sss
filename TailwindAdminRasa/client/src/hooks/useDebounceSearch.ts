import { useState, useEffect, useRef, useCallback } from 'react';

interface SearchOptions {
  delay?: number;
  minLength?: number;
  immediate?: boolean;
}

interface SearchState<T> {
  results: T[];
  isLoading: boolean;
  error: string | null;
  lastQuery: string;
}

export function useDebounceSearch<T>(
  searchFn: (query: string, signal: AbortSignal) => Promise<T[]>,
  options: SearchOptions = {}
) {
  const { delay = 300, minLength = 2, immediate = false } = options;
  
  const [state, setState] = useState<SearchState<T>>({
    results: [],
    isLoading: false,
    error: null,
    lastQuery: '',
  });
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const requestIdRef = useRef<number>(0);
  const lastRequestTimeRef = useRef<number>(0);
  
  // Cancel any pending request
  const cancelPendingRequest = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
  }, []);
  
  // Perform search with cancellation support
  const performSearch = useCallback(async (query: string, requestId: number) => {
    if (query.length < minLength) {
      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        error: null,
        lastQuery: query,
      }));
      return;
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastQuery: query,
    }));
    
    try {
      const startTime = performance.now();
      const results = await searchFn(query, controller.signal);
      const endTime = performance.now();
      
      // Log performance metrics
      if (import.meta.env.DEV) {
        console.log(`🔍 Search completed: "${query}" took ${(endTime - startTime).toFixed(2)}ms`);
      }
      
      // Only update state if this is still the latest request
      if (requestId === requestIdRef.current && !controller.signal.aborted) {
        setState(prev => ({
          ...prev,
          results,
          isLoading: false,
          error: null,
        }));
        
        lastRequestTimeRef.current = endTime;
      }
    } catch (error: any) {
      // Only update state if this is still the latest request and not aborted
      if (requestId === requestIdRef.current && !controller.signal.aborted) {
        setState(prev => ({
          ...prev,
          results: [],
          isLoading: false,
          error: error.name === 'AbortError' ? null : error.message,
        }));
      }
    }
  }, [searchFn, minLength]);
  
  // Debounced search function
  const search = useCallback((query: string) => {
    // Cancel any pending request
    cancelPendingRequest();
    
    // Increment request ID for deduplication
    const requestId = ++requestIdRef.current;
    
    if (immediate && query.length >= minLength) {
      // Immediate search for first few characters
      performSearch(query, requestId);
    } else {
      // Debounced search
      debounceRef.current = setTimeout(() => {
        performSearch(query, requestId);
      }, delay);
    }
  }, [delay, immediate, minLength, performSearch, cancelPendingRequest]);
  
  // Clear search results
  const clear = useCallback(() => {
    cancelPendingRequest();
    setState({
      results: [],
      isLoading: false,
      error: null,
      lastQuery: '',
    });
  }, [cancelPendingRequest]);
  
  // Reset search state
  const reset = useCallback(() => {
    cancelPendingRequest();
    requestIdRef.current = 0;
    setState({
      results: [],
      isLoading: false,
      error: null,
      lastQuery: '',
    });
  }, [cancelPendingRequest]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingRequest();
    };
  }, [cancelPendingRequest]);
  
  return {
    ...state,
    search,
    clear,
    reset,
    cancel: cancelPendingRequest,
    isSearching: state.isLoading,
    hasResults: state.results.length > 0,
    isEmpty: state.results.length === 0 && !state.isLoading && state.lastQuery.length >= minLength,
  };
}

// Enhanced search hook with caching
export function useCachedDebounceSearch<T>(
  searchFn: (query: string, signal: AbortSignal) => Promise<T[]>,
  options: SearchOptions & { cacheSize?: number; cacheTimeMs?: number } = {}
) {
  const { cacheSize = 50, cacheTimeMs = 5 * 60 * 1000, ...searchOptions } = options;
  
  const cacheRef = useRef<Map<string, { results: T[]; timestamp: number }>>(new Map());
  
  // Enhanced search function with caching
  const cachedSearchFn = useCallback(async (query: string, signal: AbortSignal): Promise<T[]> => {
    const normalizedQuery = query.toLowerCase().trim();
    const now = Date.now();
    
    // Check cache first
    const cached = cacheRef.current.get(normalizedQuery);
    if (cached && (now - cached.timestamp) < cacheTimeMs) {
      if (import.meta.env.DEV) {
        console.log(`📦 Cache hit for search: "${query}"`);
      }
      return cached.results;
    }
    
    // Perform actual search
    const results = await searchFn(query, signal);
    
    // Cache the results
    if (!signal.aborted) {
      // Clean old entries if cache is full
      if (cacheRef.current.size >= cacheSize) {
        const oldestKey = Array.from(cacheRef.current.keys())[0];
        cacheRef.current.delete(oldestKey);
      }
      
      cacheRef.current.set(normalizedQuery, {
        results,
        timestamp: now,
      });
      
      if (import.meta.env.DEV) {
        console.log(`💾 Cached search results for: "${query}"`);
      }
    }
    
    return results;
  }, [searchFn, cacheTimeMs, cacheSize]);
  
  const searchHook = useDebounceSearch(cachedSearchFn, searchOptions);
  
  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);
  
  return {
    ...searchHook,
    clearCache,
    cacheSize: cacheRef.current.size,
  };
}