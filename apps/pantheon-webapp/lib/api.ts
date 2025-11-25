/**
 * Miyabi API Client - Production Ready
 * Issue: #978 - Phase 3.1: API Client Implementation
 *
 * Features:
 * - JWT authentication handling
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - TypeScript types for all responses
 */

// =============================================================================
// Types
// =============================================================================

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  } as RetryConfig,
};

// =============================================================================
// Token Management
// =============================================================================

class TokenManager {
  private static ACCESS_TOKEN_KEY = 'miyabi_access_token';
  private static REFRESH_TOKEN_KEY = 'miyabi_refresh_token';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// =============================================================================
// API Client Class
// =============================================================================

class ApiClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config = DEFAULT_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.retryConfig = config.retry;

    // Add default auth interceptor
    this.addRequestInterceptor(this.authInterceptor.bind(this));
  }

  // ---------------------------------------------------------------------------
  // Interceptors
  // ---------------------------------------------------------------------------

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async authInterceptor(config: RequestInit): Promise<RequestInit> {
    const token = TokenManager.getAccessToken();
    if (token && !TokenManager.isTokenExpired(token)) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  }

  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Retry Logic
  // ---------------------------------------------------------------------------

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  private shouldRetry(status: number, attempt: number): boolean {
    if (attempt >= this.retryConfig.maxRetries) return false;
    // Retry on network errors (status 0) or server errors (5xx)
    return status === 0 || (status >= 500 && status < 600);
  }

  // ---------------------------------------------------------------------------
  // Core Request Method
  // ---------------------------------------------------------------------------

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    let config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Apply request interceptors
    config = await this.applyRequestInterceptors(config);

    try {
      let response = await fetch(url, config);

      // Apply response interceptors
      response = await this.applyResponseInterceptors(response);

      // Handle 401 - try to refresh token
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          return this.request<T>(endpoint, options, attempt);
        }
        // Refresh failed, clear tokens
        TokenManager.clearTokens();
        throw this.createError(response, 'Authentication required');
      }

      // Handle errors
      if (!response.ok) {
        if (this.shouldRetry(response.status, attempt)) {
          await this.sleep(this.calculateDelay(attempt));
          return this.request<T>(endpoint, options, attempt + 1);
        }
        throw await this.parseError(response);
      }

      // Handle empty response
      const text = await response.text();
      if (!text) return {} as T;

      return JSON.parse(text) as T;
    } catch (error) {
      // Network error - retry if appropriate
      if (error instanceof TypeError && this.shouldRetry(0, attempt)) {
        await this.sleep(this.calculateDelay(attempt));
        return this.request<T>(endpoint, options, attempt + 1);
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Token Refresh
  // ---------------------------------------------------------------------------

  private async refreshToken(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      TokenManager.setAccessToken(data.access_token);
      if (data.refresh_token) {
        TokenManager.setRefreshToken(data.refresh_token);
      }
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Error Handling
  // ---------------------------------------------------------------------------

  private createError(response: Response, message: string): ApiError {
    return {
      status: response.status,
      message,
      code: 'API_ERROR',
    };
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      return {
        status: response.status,
        message: data.message || data.error || response.statusText,
        code: data.code,
        details: data.details,
      };
    } catch {
      return {
        status: response.status,
        message: response.statusText,
        code: 'PARSE_ERROR',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP Methods
  // ---------------------------------------------------------------------------

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const apiClient = new ApiClient();

// =============================================================================
// Auth Utilities
// =============================================================================

export const auth = {
  setTokens: (accessToken: string, refreshToken?: string) => {
    TokenManager.setAccessToken(accessToken);
    if (refreshToken) {
      TokenManager.setRefreshToken(refreshToken);
    }
  },
  clearTokens: () => TokenManager.clearTokens(),
  isAuthenticated: () => {
    const token = TokenManager.getAccessToken();
    return token !== null && !TokenManager.isTokenExpired(token);
  },
  getAccessToken: () => TokenManager.getAccessToken(),
};

// =============================================================================
// Legacy Exports (for backward compatibility)
// =============================================================================

import type {
  SystemStatus,
  MiyabiConsultation,
  AdvisorMetrics,
  DivisionMetrics,
  Activity,
} from '../types/miyabi';

export const miyabiApi = {
  getStatus: () => apiClient.get<SystemStatus>('/miyabi/status'),
  getConsultations: (params?: { limit?: number; timeRange?: string }) =>
    apiClient.get<{ consultations: MiyabiConsultation[] }>('/miyabi/consultations', {
      ...(params?.limit && { limit: params.limit.toString() }),
      ...(params?.timeRange && { time_range: params.timeRange }),
    }),
  getAdvisorMetrics: () =>
    apiClient.get<{ advisors: AdvisorMetrics[] }>('/miyabi/metrics/advisors'),
  getDivisionMetrics: () =>
    apiClient.get<{ divisions: DivisionMetrics[] }>('/miyabi/metrics/divisions'),
  getActivity: (params?: { limit?: number }) =>
    apiClient.get<{ activities: Activity[] }>('/miyabi/activity', {
      ...(params?.limit && { limit: params.limit.toString() }),
    }),
};

// Mock data for development (re-exported)
export { mockSystemStatus as mockData } from '../data/miyabi-mock';
