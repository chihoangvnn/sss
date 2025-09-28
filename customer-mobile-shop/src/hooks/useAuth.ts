import { useQuery } from "@tanstack/react-query";

// Use Next.js API routes as proxy to backend for HTTPS compatibility
const API_BASE_URL = ''; // Empty string uses same origin (Next.js API routes)

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return null; // User not authenticated
          }
          throw new Error(`Failed to fetch user: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.log('Auth check failed:', error);
        return null; // Fail silently, user not authenticated
      }
    },
    retry: false, // Don't retry auth requests
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // OAuth login functions matching API specification
  const loginWithReplit = () => {
    window.location.href = '/auth/replit';
  };

  const loginWithFacebook = () => {
    window.location.href = '/auth/facebook';
  };

  // Legacy login function for backward compatibility
  const login = () => {
    window.location.href = '/auth/replit';
  };

  const logout = () => {
    window.location.href = `${API_BASE_URL}/api/logout`;
  };

  // CSRF token helper for protected APIs
  const getCsrfToken = async () => {
    try {
      const response = await fetch('/api/facebook-apps/csrf-token', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
    return null;
  };

  // Session check helper matching specification
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      if (response.status === 401) {
        // Not logged in, redirect to OAuth
        window.location.href = '/auth/replit';
        return false;
      }
      return true;
    } catch (error) {
      console.error('Auth status check failed:', error);
      return false;
    }
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithReplit,
    loginWithFacebook,
    logout,
    refetch,
    getCsrfToken,
    checkAuthStatus,
    error
  };
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}