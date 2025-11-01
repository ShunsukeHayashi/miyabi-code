import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  User,
  Funnel,
  Page,
  CreateFunnelRequest,
  UpdateFunnelRequest,
  PaginatedResponse,
  FunnelStats,
} from '../types'

// Use local Rust proxy server to bypass CORS
const BASE_URL = 'http://localhost:3000/api/v1/proxy/clickfunnels'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message)
        if (error.response?.status === 401) {
          console.error('Unauthorized - Please check your access token')
        }
        return Promise.reject(error)
      }
    )
  }

  // ClickFunnels API v2 endpoints
  async getFunnels(page = 1, pageSize = 20): Promise<any> {
    try {
      // Try /teams first to get team information
      const response = await this.client.get('/teams', {
        params: {
          'page[number]': page,
          'page[size]': pageSize
        },
      })
      console.log('ClickFunnels API Response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching teams:', error)
      throw error
    }
  }

  async getTeams(): Promise<any> {
    try {
      const response = await this.client.get('/teams')
      console.log('Teams Response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching teams:', error)
      throw error
    }
  }

  async getWorkspaces(page = 1, pageSize = 20): Promise<any> {
    try {
      const response = await this.client.get('/workspaces', {
        params: {
          'page[number]': page,
          'page[size]': pageSize
        },
      })
      console.log('Workspaces Response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      throw error
    }
  }

  async getFunnel(id: string): Promise<Funnel> {
    const response = await this.client.get(`/workspaces/${id}`)
    return response.data
  }

  async createFunnel(data: CreateFunnelRequest): Promise<Funnel> {
    const response = await this.client.post('/workspaces', data)
    return response.data
  }

  async updateFunnel(id: string, data: UpdateFunnelRequest): Promise<Funnel> {
    const response = await this.client.put(`/workspaces/${id}`, data)
    return response.data
  }

  async deleteFunnel(id: string): Promise<void> {
    await this.client.delete(`/workspaces/${id}`)
  }

  async getFunnelStats(id: string): Promise<FunnelStats> {
    const response = await this.client.get(`/workspaces/${id}/stats`)
    return response.data
  }

  // Test connection to ClickFunnels API
  async testConnection(): Promise<any> {
    try {
      const response = await this.client.get('/workspaces')
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }

  // SWML Ω-System: AI Agent-powered funnel generation
  async executeFunnelAgents(businessContext: string): Promise<any> {
    try {
      // Call the local API server (not the proxy)
      const response = await axios.post(
        'http://localhost:3000/api/v1/agents/execute-funnel',
        { business_context: businessContext },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('Agent Execution Response:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error executing funnel agents:', error)
      throw error
    }
  }
}

export const api = new ApiClient()
export default api
