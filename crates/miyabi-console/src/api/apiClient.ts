import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Custom error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Error response structure
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Get API base URL from environment with validation
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (import.meta.env.DEV) {
    return envUrl || 'http://localhost:8080/api/v1';
  }

  if (!envUrl) {
    console.error('[Miyabi Console] VITE_API_BASE_URL is not configured.');
    return '/api/v1';
  }

  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with proper configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError();
    }

    // Handle network error
    if (!error.response) {
      throw new NetworkError(error.message);
    }

    // Handle API error
    const { status, data } = error.response;
    const errorData = data?.error;

    throw new ApiError(
      errorData?.message || 'An error occurred',
      status,
      errorData?.code || 'UNKNOWN_ERROR',
      errorData?.details
    );
  }
);

// Type-safe API response wrapper
export async function apiRequest<T>(
  request: Promise<AxiosResponse<T>>
): Promise<T> {
  const response = await request;
  return response.data;
}

// Retry wrapper for flaky requests
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error instanceof NetworkError) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('[Miyabi Console] API Base URL:', API_BASE_URL);
}

export { API_BASE_URL };
