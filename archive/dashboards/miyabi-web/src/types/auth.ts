/**
 * Authentication types
 */

export interface User {
  id: string;
  github_id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
