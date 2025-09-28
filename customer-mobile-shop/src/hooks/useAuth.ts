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
  const { data: user, isLoading, error } = useQuery<User>({
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

  const login = () => {
    // Redirect to Replit Auth login
    window.location.href = `${API_BASE_URL}/api/login`;
  };

  const logout = () => {
    // Redirect to logout endpoint
    window.location.href = `${API_BASE_URL}/api/logout`;
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    error
  };
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}