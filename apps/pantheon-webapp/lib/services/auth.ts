/**
 * Auth Service
 * Issue: #978 - Phase 3.1: API Client Implementation
 */

import { apiClient, auth } from '../api';

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'developer' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface GitHubOAuthResponse {
  authUrl: string;
  state: string;
}

export interface GitHubCallbackRequest {
  code: string;
  state: string;
}

// =============================================================================
// Auth Service
// =============================================================================

export const authService = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    auth.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    auth.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      auth.clearTokens();
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string; refreshToken?: string }>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    );
    auth.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Initiate GitHub OAuth flow
   */
  initiateGitHubOAuth: async (): Promise<GitHubOAuthResponse> => {
    return apiClient.get<GitHubOAuthResponse>('/auth/github');
  },

  /**
   * Complete GitHub OAuth callback
   */
  handleGitHubCallback: async (data: GitHubCallbackRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/github/callback', data);
    auth.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/password/reset', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/password/reset/confirm', {
      token,
      password: newPassword,
    });
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/password/change', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/email/verify', { token });
  },

  /**
   * Resend verification email
   */
  resendVerification: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/email/resend');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return auth.isAuthenticated();
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    return auth.getAccessToken();
  },
};

export default authService;
