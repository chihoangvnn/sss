import { StorefrontData, StorefrontConfig, Product } from '@/types';
import { config, getBestBackendUrl, checkBackendHealth } from './config';

// API Error class for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public url?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request configuration interface
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

// Enhanced fetch with timeout, retries, and error handling
async function enhancedFetch(
  url: string, 
  requestConfig: RequestConfig = {}
): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = config.timeout,
    retries = 1
  } = requestConfig;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...headers
  };

  if (body && typeof body === 'object') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      return response;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      
      if (error instanceof APIError) {
        // Don't retry client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }
      }

      if (isLastAttempt) {
        throw new APIError(
          `Request failed after ${retries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          undefined,
          url
        );
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new APIError('Unexpected error in enhancedFetch', undefined, url);
}

// Build-time API client for static generation with failover support
export class StaticApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.apiUrl;
  }

  // Get best available backend URL for build-time operations
  private async getBuildTimeBackendUrl(): Promise<string> {
    const { apiUrl, fallbackApiUrl } = config;
    
    // Try primary URL first
    const primaryHealthy = await checkBackendHealth(apiUrl);
    if (primaryHealthy) {
      return apiUrl;
    }
    
    // Try fallback if available
    if (fallbackApiUrl) {
      const fallbackHealthy = await checkBackendHealth(fallbackApiUrl);
      if (fallbackHealthy) {
        console.warn(`Build-time: Primary backend (${apiUrl}) unavailable, using fallback: ${fallbackApiUrl}`);
        return fallbackApiUrl;
      }
    }
    
    // Return primary URL anyway for error handling
    console.error(`Build-time: All backend URLs unavailable. Using primary: ${apiUrl}`);
    return apiUrl;
  }

  async fetchStorefrontData(storefrontName: string): Promise<StorefrontData | null> {
    try {
      const baseUrl = await this.getBuildTimeBackendUrl();
      const url = `${baseUrl}/api/storefront/public/${storefrontName}`;
      const response = await enhancedFetch(url, { retries: 2 });
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null;
      }
      console.error(`Error fetching storefront ${storefrontName}:`, error);
      return null;
    }
  }

  async fetchAllStorefronts(): Promise<StorefrontConfig[]> {
    try {
      const baseUrl = await this.getBuildTimeBackendUrl();
      const url = `${baseUrl}/api/storefront/config`;
      const response = await enhancedFetch(url, { retries: 2 });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching all storefronts:', error);
      return [];
    }
  }

  async fetchProducts(): Promise<Product[]> {
    try {
      const baseUrl = await this.getBuildTimeBackendUrl();
      const url = `${baseUrl}/api/products`;
      const response = await enhancedFetch(url, { retries: 2 });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
}

// Runtime API client for dynamic features (form submissions, etc.)
export class RuntimeApiClient {
  private baseUrl: string;
  private isInitialized: boolean = false;

  constructor() {
    this.baseUrl = '';
    if (typeof window !== 'undefined') {
      this.initializeBaseUrl();
    }
  }

  private async initializeBaseUrl() {
    if (this.isInitialized) return;
    
    try {
      this.baseUrl = await getBestBackendUrl();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize backend URL:', error);
      this.baseUrl = config.apiUrl; // Fallback to config
      this.isInitialized = true;
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeBaseUrl();
    }
  }

  async createOrder(orderData: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const url = `${this.baseUrl}/api/storefront/orders`;
      const response = await enhancedFetch(url, {
        method: 'POST',
        body: orderData,
        retries: 1
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async sendChatMessage(message: string, sessionId?: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const url = `${this.baseUrl}/api/rasa/chat`;
      const response = await enhancedFetch(url, {
        method: 'POST',
        body: {
          message,
          sender: sessionId || `user_${Date.now()}`,
        },
        retries: 1
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    await this.ensureInitialized();
    return await checkBackendHealth(this.baseUrl);
  }
}

// Singleton instances
export const staticApi = new StaticApiClient();
export const runtimeApi = new RuntimeApiClient();