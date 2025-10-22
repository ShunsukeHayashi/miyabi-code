// API client for Miyabi Dashboard

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Agent {
  id: number;
  name: string;
  role: string;
  category: 'coding' | 'business';
  status: 'active' | 'working' | 'idle' | 'error';
  tasks: number;
  color: 'leader' | 'executor' | 'analyst' | 'support';
  description: string;
}

export interface SystemStatus {
  status: string;
  active_agents: number;
  total_agents: number;
  active_tasks: number;
  queued_tasks: number;
  task_throughput: number;
  avg_completion_time: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchAgents(): Promise<Agent[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/agents`);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch agents: ${response.statusText}`,
        response.status,
        response
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to connect to API server',
      undefined,
      undefined
    );
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/system`);

    if (!response.ok) {
      throw new ApiError(
        `Failed to fetch system status: ${response.statusText}`,
        response.status,
        response
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to connect to API server',
      undefined,
      undefined
    );
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 5000);
    return response.ok;
  } catch {
    return false;
  }
}
