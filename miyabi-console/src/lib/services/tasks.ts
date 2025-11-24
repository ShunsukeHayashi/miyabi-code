/**
 * Tasks Service
 *
 * Handles all task management API calls including CRUD operations,
 * task dependencies, and status updates.
 */

import axios from 'axios';
import { handleApiError } from '../api/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface Task {
  id: string;
  user_id: string;
  repository_id?: string;
  name: string;
  description?: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'pending' | 'running' | 'completed' | 'failed';
  agent_type?: string;
  issue_number?: number;
  retry_count: number;
  max_retries: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CreateTaskRequest {
  repository_id?: string;
  name: string;
  description?: string;
  priority?: 'P0' | 'P1' | 'P2';
  agent_type?: string;
  issue_number?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  priority?: 'P0' | 'P1' | 'P2';
  status?: 'pending' | 'running' | 'completed' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface TaskQueryFilters {
  status?: string;
  priority?: string;
  repository_id?: string;
  agent_type?: string;
  page?: number;
  limit?: number;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export class TasksService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * List all tasks with optional filters
   */
  async listTasks(filters?: TaskQueryFilters): Promise<{ tasks: Task[]; total: number }> {
    try {
      const response = await axios.get<{ tasks: Task[]; total: number }>(`${API_BASE_URL}/tasks`, {
        params: filters,
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<Task> {
    try {
      const response = await axios.get<Task>(`${API_BASE_URL}/tasks/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Create a new task
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    try {
      const response = await axios.post<Task>(`${API_BASE_URL}/tasks`, request, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    try {
      const response = await axios.patch<Task>(`${API_BASE_URL}/tasks/${id}`, request, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Retry a failed task
   */
  async retryTask(id: string): Promise<Task> {
    try {
      const response = await axios.post<Task>(`${API_BASE_URL}/tasks/${id}/retry`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(id: string): Promise<Task> {
    try {
      const response = await axios.post<Task>(`${API_BASE_URL}/tasks/${id}/cancel`, {}, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get task dependencies
   */
  async getTaskDependencies(id: string): Promise<TaskDependency[]> {
    try {
      const response = await axios.get<TaskDependency[]>(`${API_BASE_URL}/tasks/${id}/dependencies`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Add a task dependency
   */
  async addTaskDependency(taskId: string, dependsOnTaskId: string): Promise<TaskDependency> {
    try {
      const response = await axios.post<TaskDependency>(
        `${API_BASE_URL}/tasks/${taskId}/dependencies`,
        { depends_on_task_id: dependsOnTaskId },
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Remove a task dependency
   */
  async removeTaskDependency(taskId: string, dependencyId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/dependencies/${dependencyId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// Singleton instance
export const tasksService = new TasksService();
