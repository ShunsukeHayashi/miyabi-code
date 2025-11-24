/**
 * Repositories Service
 *
 * Handles all repository management API calls including listing,
 * creating, and managing GitHub repositories.
 */

import axios from 'axios';
import { handleApiError } from '../api/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface Repository {
  id: string;
  user_id: string;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRepositoryRequest {
  full_name: string; // Format: "owner/name"
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  created_at: string;
  updated_at: string;
  html_url: string;
}

export class RepositoriesService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * List all repositories for the authenticated user
   */
  async listRepositories(): Promise<Repository[]> {
    try {
      const response = await axios.get<Repository[]>(`${API_BASE_URL}/repositories`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get a single repository by ID
   */
  async getRepository(id: string): Promise<Repository> {
    try {
      const response = await axios.get<Repository>(`${API_BASE_URL}/repositories/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Create (register) a new repository
   */
  async createRepository(request: CreateRepositoryRequest): Promise<Repository> {
    try {
      const response = await axios.post<Repository>(`${API_BASE_URL}/repositories`, request, {
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
   * Update repository settings
   */
  async updateRepository(id: string, data: { is_active?: boolean }): Promise<Repository> {
    try {
      const response = await axios.patch<Repository>(`${API_BASE_URL}/repositories/${id}`, data, {
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
   * Delete (unregister) a repository
   */
  async deleteRepository(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/repositories/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get GitHub issues for a repository
   */
  async getRepositoryIssues(repositoryId: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    try {
      const response = await axios.get<GitHubIssue[]>(`${API_BASE_URL}/repositories/${repositoryId}/issues`, {
        params: { state },
        headers: this.getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get a specific GitHub issue
   */
  async getRepositoryIssue(repositoryId: string, issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await axios.get<GitHubIssue>(
        `${API_BASE_URL}/repositories/${repositoryId}/issues/${issueNumber}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get active repositories only
   */
  async getActiveRepositories(): Promise<Repository[]> {
    const repos = await this.listRepositories();
    return repos.filter(repo => repo.is_active);
  }

  /**
   * Toggle repository active status
   */
  async toggleRepositoryActive(id: string): Promise<Repository> {
    const repo = await this.getRepository(id);
    return await this.updateRepository(id, { is_active: !repo.is_active });
  }
}

// Singleton instance
export const repositoriesService = new RepositoriesService();
