// Environment and API configuration management
interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  backendUrl: string;
  fallbackApiUrl?: string;
  healthCheckPath: string;
  timeout: number;
  verifySSL: boolean;
  allowedOrigins: string[];
}

// Get environment configuration with fallbacks
function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';
  
  // Primary API URLs with fallbacks
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
    process.env.NEXT_PUBLIC_BACKEND_URL || 
    'http://localhost:5000';
  
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
    process.env.NEXT_PUBLIC_API_URL || 
    'http://localhost:5000';
  
  const fallbackApiUrl = process.env.NEXT_PUBLIC_FALLBACK_API_URL;
  
  const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://yourdomain.com'
  ];

  return {
    environment: env as 'development' | 'staging' | 'production',
    apiUrl: apiUrl.replace(/\/$/, ''), // Remove trailing slash
    backendUrl: backendUrl.replace(/\/$/, ''),
    fallbackApiUrl: fallbackApiUrl?.replace(/\/$/, ''),
    healthCheckPath: process.env.NEXT_PUBLIC_HEALTH_CHECK_PATH || '/api/health',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
    verifySSL: process.env.NEXT_PUBLIC_VERIFY_SSL !== 'false',
    allowedOrigins
  };
}

// Domain validation utilities
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isDevelopment(): boolean {
  return config.environment === 'development';
}

export function isProduction(): boolean {
  return config.environment === 'production';
}

export function isCustomDomain(url: string): boolean {
  return !url.includes('replit.dev') && !url.includes('localhost');
}

// Health check utility with better browser compatibility
export async function checkBackendHealth(url: string): Promise<boolean> {
  if (!isValidUrl(url)) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${url}${config.healthCheckPath}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`Health check failed for ${url}:`, error);
    return false;
  }
}

// Get best available backend URL
export async function getBestBackendUrl(): Promise<string> {
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
      console.warn(`Primary backend (${apiUrl}) unavailable, using fallback: ${fallbackApiUrl}`);
      return fallbackApiUrl;
    }
  }
  
  // Return primary URL anyway and let error handling deal with it
  console.error(`All backend URLs unavailable. Using primary: ${apiUrl}`);
  return apiUrl;
}

// Export singleton configuration
export const config = getEnvironmentConfig();

// Debug helper (only in development)
if (typeof window !== 'undefined' && isDevelopment()) {
  console.log('Storefront Config:', {
    environment: config.environment,
    apiUrl: config.apiUrl,
    isCustomDomain: isCustomDomain(config.apiUrl),
    fallbackAvailable: !!config.fallbackApiUrl
  });
}