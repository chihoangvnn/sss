// 🛡️ PRODUCTION-GRADE CSRF PROTECTION UTILITY
// Centralized CSRF token management for secure API calls

let csrfToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Fetches CSRF token from server
 * Caches token until expiry for performance
 */
export async function getCSRFToken(): Promise<string> {
  // Return cached token if still valid
  if (csrfToken && Date.now() < tokenExpiry) {
    return csrfToken;
  }

  try {
    const response = await fetch('/api/facebook-apps/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`CSRF token fetch failed: ${response.status}`);
    }

    const data = await response.json();
    csrfToken = data.csrfToken;
    tokenExpiry = Date.now() + (data.expiresIn || 3600000); // Default 1 hour

    return csrfToken!; // Token is guaranteed to be set from server response
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw new Error('Failed to get CSRF protection token');
  }
}

/**
 * Creates secure fetch headers with CSRF protection
 * Use for all state-changing API calls (POST, PUT, DELETE, PATCH)
 */
export async function createSecureHeaders(additionalHeaders: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getCSRFToken();
  
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    ...additionalHeaders
  };
}

/**
 * Secure fetch wrapper with automatic CSRF protection
 * Automatically adds CSRF tokens to destructive operations
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Add CSRF protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfHeaders = await createSecureHeaders(options.headers);
    options.headers = csrfHeaders;
  }

  // Always include credentials for session-based auth
  options.credentials = 'include';

  return fetch(url, options);
}

/**
 * Invalidates cached CSRF token
 * Call when receiving 403 CSRF errors to force refresh
 */
export function invalidateCSRFToken(): void {
  csrfToken = null;
  tokenExpiry = 0;
}

/**
 * React Query mutation helper with CSRF protection
 * Use this for TanStack Query mutations
 */
export function createSecureMutation<T = any>(
  url: string, 
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
) {
  return async (data?: any): Promise<T> => {
    const response = await secureFetch(url, {
      method,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      // If CSRF error, invalidate token and retry once
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === 'CSRF_PROTECTION') {
          invalidateCSRFToken();
          // Retry once with fresh token
          const retryResponse = await secureFetch(url, {
            method,
            body: data ? JSON.stringify(data) : undefined
          });
          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };
}