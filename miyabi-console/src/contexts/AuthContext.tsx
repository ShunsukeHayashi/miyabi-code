import axios from 'axios';
import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { setTokenRefreshCallback } from '../lib/api/client';

// Role types for authorization
export type UserRole = 'admin' | 'developer' | 'viewer';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string | null;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean;
}

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes (before 30min expiry)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate and fetch user info with current token
  const validateToken = async (accessToken: string): Promise<User | null> => {
    try {
      // First, try to get user info from our backend (if available)
      try {
        const backendResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (backendResponse.data) {
          return {
            id: backendResponse.data.id,
            username: backendResponse.data.username,
            email: backendResponse.data.email || '',
            avatar_url: backendResponse.data.avatar_url,
            created_at: backendResponse.data.created_at,
            role: backendResponse.data.role || 'viewer',
          };
        }
      } catch {
        // Backend not available, fall back to GitHub API
      }

      // Fallback: Verify token with GitHub API
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Determine role based on user (default to admin for repo owners)
      // In production, this would come from your backend/JWT
      const userRole: UserRole = 'admin'; // TODO: Get from backend

      return {
        id: response.data.id.toString(),
        username: response.data.login,
        email: response.data.email || '',
        avatar_url: response.data.avatar_url,
        created_at: response.data.created_at,
        role: userRole,
      };
    } catch (err) {
      console.error('Token validation failed:', err);
      return null;
    }
  };

  // Refresh token - attempts to get a new access token using refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = localStorage.getItem('refresh_token');
    const currentAccessToken = localStorage.getItem('access_token');

    // If we have a refresh token, try to use it with our backend
    if (currentRefreshToken) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: currentRefreshToken,
        });

        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem('refresh_token', response.data.refresh_token);
          }

          // Validate the new token
          const validatedUser = await validateToken(response.data.access_token);
          if (validatedUser) {
            setUser(validatedUser);
            setError(null);
            console.log('[Auth] Token refreshed successfully');
            return true;
          }
        }
      } catch (err) {
        console.error('Token refresh failed:', err);
      }
    }

    // If no refresh token or refresh failed, try to validate current access token
    if (currentAccessToken) {
      const validatedUser = await validateToken(currentAccessToken);
      if (validatedUser) {
        setUser(validatedUser);
        return true;
      }
    }

    // Token refresh failed - clear auth state
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setError('Session expired. Please log in again.');
    return false;
  }, []);

  // Register refresh callback with API client
  useEffect(() => {
    setTokenRefreshCallback(refreshToken);
  }, [refreshToken]);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        const validatedUser = await validateToken(accessToken);
        if (validatedUser) {
          setUser(validatedUser);
          setError(null);
        } else {
          // Try to refresh if initial validation fails
          await refreshToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      console.log('[Auth] Proactive token refresh');
      await refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = () => {
    // Redirect to GitHub OAuth
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liZZwnVGZaAa809q';
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'user:email';

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setError(null);
    window.location.href = '/';
  };

  // Role hierarchy: admin > developer > viewer
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    developer: 2,
    viewer: 1,
  };

  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userLevel = roleHierarchy[user.role];

    // Check if user has any of the required roles (or higher)
    return roles.some((role) => userLevel >= roleHierarchy[role]);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
