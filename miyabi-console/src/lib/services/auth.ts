/**
 * Authentication Service
 *
 * Handles all authentication-related API calls including OAuth,
 * token management, and user session handling.
 */

import axios from 'axios';
import { handleApiError } from '../api/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface User {
  id: string;
  github_id: number;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface MockLoginRequest {
  github_id: number;
  email: string;
  name?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export class AuthService {
  /**
   * Initiate GitHub OAuth flow
   * Redirects to GitHub authorization page
   */
  initiateGitHubOAuth(redirectPath?: string): void {
    const params = new URLSearchParams();
    if (redirectPath) {
      params.append('redirect', redirectPath);
    }
    window.location.href = `${API_BASE_URL}/auth/github?${params.toString()}`;
  }

  /**
   * Mock login (development only)
   * Creates a test user without OAuth flow
   */
  async mockLogin(request: MockLoginRequest): Promise<TokenResponse> {
    try {
      const response = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/mock`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Store tokens
      this.setTokens(response.data.access_token, response.data.refresh_token);

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken } as RefreshTokenRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Update stored tokens
      this.setTokens(response.data.access_token, response.data.refresh_token);

      return true;
    } catch (error) {
      // Clear invalid tokens
      this.clearTokens();
      return false;
    }
  }

  /**
   * Logout - clear tokens and redirect to login
   */
  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      // Ignore logout errors - clear tokens anyway
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Set tokens in localStorage
   */
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get user info from stored token
   * Note: This decodes the JWT locally (not cryptographically secure)
   * For production, validate on backend
   */
  getCurrentUser(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // Decode JWT (base64)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      // Return basic user info from token
      // Note: Full user details should come from backend API
      return {
        id: decoded.sub,
        github_id: decoded.github_id,
        email: '', // Not stored in JWT
        name: undefined,
        avatar_url: undefined,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      const exp = decoded.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch (error) {
      return true;
    }
  }

  /**
   * Auto-refresh token if expired
   * Returns true if token is valid (or successfully refreshed)
   */
  async ensureValidToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    if (this.isTokenExpired()) {
      return await this.refreshToken();
    }

    return true;
  }
}

// Singleton instance
export const authService = new AuthService();
