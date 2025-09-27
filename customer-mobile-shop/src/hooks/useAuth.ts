import React from 'react';
import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = 'https://ed0058b6-a4d2-420f-a190-db815028cada-00-emsu2szvz22c.pike.replit.dev';

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
  // DEMO MODE: Since backend isn't available, simulate authentication state
  const [isDemo] = React.useState(true);
  const [demoUser, setDemoUser] = React.useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_auth_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      if (isDemo) {
        // Return demo user if exists
        return demoUser;
      }
      
      // Real API call (when backend is available)
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null; // User not authenticated
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    retry: false, // Don't retry auth requests
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const login = () => {
    if (isDemo) {
      // Demo login - create a mock user
      const mockUser: User = {
        id: 'demo-user-123',
        email: 'demo@nhang-sach.net',
        firstName: 'Người dùng',
        lastName: 'Demo',
        profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setDemoUser(mockUser);
      localStorage.setItem('demo_auth_user', JSON.stringify(mockUser));
      window.location.reload(); // Refresh to update UI
      return;
    }
    
    // Real login redirect
    window.location.href = `${API_BASE_URL}/auth/replit`;
  };

  const logout = async () => {
    if (isDemo) {
      // Demo logout
      setDemoUser(null);
      localStorage.removeItem('demo_auth_user');
      window.location.reload(); // Refresh to update UI
      return;
    }
    
    // Real logout
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const currentUser = isDemo ? demoUser : user;

  return {
    user: currentUser || null,
    isLoading: isDemo ? false : isLoading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    error,
    isDemo // Flag to show demo mode
  };
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}