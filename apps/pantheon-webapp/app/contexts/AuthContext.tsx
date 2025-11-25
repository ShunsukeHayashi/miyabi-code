/**
 * Authentication Context
 * Issue: #981 - Phase 3.4: Authentication Flow Implementation
 *
 * Features:
 * - GitHub OAuth integration
 * - JWT token management (memory + localStorage fallback)
 * - User state management
 * - Auto token refresh
 * - Logout functionality
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { auth as authUtils, apiClient } from '../../lib/api';

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  github_id: number;
  username: string;
  email: string | null;
  avatar_url: string | null;
  name: string | null;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  handleOAuthCallback: (code: string, state?: string) => Promise<boolean>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// =============================================================================
// Constants
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const OAUTH_REDIRECT_URL = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL || 'http://localhost:3000/auth/callback';
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // ---------------------------------------------------------------------------
  // Token Refresh Timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const token = authUtils.getAccessToken();
    if (token) {
      // Parse token expiry
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        // Refresh 5 minutes before expiry
        const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

        if (refreshTime > 0) {
          const timeout = setTimeout(async () => {
            try {
              await apiClient.post('/auth/refresh');
            } catch {
              // Token refresh failed, will be handled by API client
            }
          }, refreshTime);

          return () => clearTimeout(timeout);
        }
      } catch {
        // Invalid token format
      }
    }
  }, [state.isAuthenticated]);

  // ---------------------------------------------------------------------------
  // Initial Auth Check
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authUtils.isAuthenticated();

      if (isAuth) {
        try {
          const userData = await apiClient.get<User>('/auth/me');
          setState({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch {
          // Token invalid or expired
          authUtils.clearTokens();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    checkAuth();
  }, []);

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  const login = useCallback(() => {
    // Generate random state for CSRF protection
    const stateParam = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', stateParam);

    // Construct GitHub OAuth URL
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: OAUTH_REDIRECT_URL,
      scope: 'read:user user:email',
      state: stateParam,
    });

    // Redirect to GitHub OAuth
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }, []);

  // ---------------------------------------------------------------------------
  // OAuth Callback Handler
  // ---------------------------------------------------------------------------

  const handleOAuthCallback = useCallback(async (code: string, state?: string): Promise<boolean> => {
    // Verify CSRF state
    const savedState = sessionStorage.getItem('oauth_state');
    if (state && savedState && state !== savedState) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Invalid OAuth state. Please try logging in again.',
      }));
      return false;
    }
    sessionStorage.removeItem('oauth_state');

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Exchange code for tokens via backend
      const response = await fetch(`${API_BASE}/auth/github/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: OAUTH_REDIRECT_URL }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();

      // Store tokens
      authUtils.setTokens(data.access_token, data.refresh_token);

      // Fetch user data
      const userData = await apiClient.get<User>('/auth/me');

      setState({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Notify backend of logout (optional, for token invalidation)
      await apiClient.post('/auth/logout').catch(() => {
        // Ignore errors - logout should succeed even if API fails
      });
    } finally {
      authUtils.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Refresh User
  // ---------------------------------------------------------------------------

  const refreshUser = useCallback(async () => {
    if (!authUtils.isAuthenticated()) return;

    try {
      const userData = await apiClient.get<User>('/auth/me');
      setState((prev) => ({
        ...prev,
        user: userData,
        error: null,
      }));
    } catch {
      // Token might be invalid
      authUtils.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Context Value
  // ---------------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshUser,
      handleOAuthCallback,
    }),
    [state, login, logout, refreshUser, handleOAuthCallback]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// =============================================================================
// Utility Hook - Require Auth
// =============================================================================

export function useRequireAuth(redirectTo = '/login'): AuthContextValue {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Store intended destination
      sessionStorage.setItem('auth_redirect', window.location.pathname);
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo]);

  return auth;
}

export default AuthContext;
