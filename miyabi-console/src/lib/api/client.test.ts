import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'

// Unmock the client to test the actual implementation
vi.unmock('@/lib/api/client')

// Import the actual client after unmocking
import { apiClient, handleApiError, setTokenRefreshCallback } from './client'

describe('handleApiError', () => {
  it('handles AxiosError with response data message', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: 'Custom error message' },
        status: 400,
      },
      code: 'ERR_BAD_REQUEST',
    } as AxiosError<{ message: string }>

    const result = handleApiError(error)

    expect(result).toEqual({
      message: 'Custom error message',
      code: 'ERR_BAD_REQUEST',
      status: 400,
    })
  })

  it('handles AxiosError with response data error field', () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { error: 'Error from server' },
        status: 500,
      },
      code: 'ERR_INTERNAL',
    } as AxiosError<{ error: string }>

    const result = handleApiError(error)

    expect(result).toEqual({
      message: 'Error from server',
      code: 'ERR_INTERNAL',
      status: 500,
    })
  })

  it('handles AxiosError with message only', () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
      code: 'ERR_NETWORK',
    } as AxiosError

    const result = handleApiError(error)

    expect(result).toEqual({
      message: 'Network Error',
      code: 'ERR_NETWORK',
      status: 500,
    })
  })

  it('handles regular Error', () => {
    const error = new Error('Something went wrong')

    const result = handleApiError(error)

    expect(result).toEqual({
      message: 'Something went wrong',
      code: 'UNKNOWN',
      status: 500,
    })
  })

  it('handles unknown error type', () => {
    const error = 'string error'

    const result = handleApiError(error)

    expect(result).toEqual({
      message: 'An unexpected error occurred',
      code: 'UNKNOWN',
      status: 500,
    })
  })

  it('handles null/undefined error', () => {
    const result = handleApiError(null)

    expect(result).toEqual({
      message: 'An unexpected error occurred',
      code: 'UNKNOWN',
      status: 500,
    })
  })
})

describe('setTokenRefreshCallback', () => {
  it('sets the token refresh callback without error', () => {
    const callback = vi.fn().mockResolvedValue(true)

    expect(() => setTokenRefreshCallback(callback)).not.toThrow()
  })
})

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSystemMetrics', () => {
    it('returns system metrics in mock mode', async () => {
      const metrics = await apiClient.getSystemMetrics()

      expect(metrics).toHaveProperty('cpu_usage')
      expect(metrics).toHaveProperty('memory_usage')
      expect(metrics).toHaveProperty('disk_usage')
      expect(metrics).toHaveProperty('active_agents')
      expect(metrics).toHaveProperty('total_tasks')
      expect(metrics).toHaveProperty('completed_tasks')
      expect(metrics).toHaveProperty('uptime_seconds')

      // Check value ranges
      expect(metrics.cpu_usage).toBeGreaterThanOrEqual(0)
      expect(metrics.cpu_usage).toBeLessThanOrEqual(100)
      expect(metrics.memory_usage).toBeGreaterThanOrEqual(0)
      expect(metrics.memory_usage).toBeLessThanOrEqual(100)
    })
  })

  describe('getAgents', () => {
    it('returns agents array in mock mode', async () => {
      const agents = await apiClient.getAgents()

      expect(Array.isArray(agents)).toBe(true)
      expect(agents.length).toBeGreaterThan(0)

      // Check agent structure
      const agent = agents[0]
      expect(agent).toHaveProperty('id')
      expect(agent).toHaveProperty('name')
      expect(agent).toHaveProperty('status')
    })
  })

  describe('getAgent', () => {
    it('returns a specific agent in mock mode', async () => {
      const agents = await apiClient.getAgents()
      const agentId = agents[0].id

      const agent = await apiClient.getAgent(agentId)

      expect(agent).toHaveProperty('id', agentId)
      expect(agent).toHaveProperty('name')
      expect(agent).toHaveProperty('status')
    })

    it('throws error for non-existent agent', async () => {
      await expect(apiClient.getAgent('non-existent-id')).rejects.toThrow('Agent not found')
    })
  })

  describe('configureAgent', () => {
    it('returns updated agent config in mock mode', async () => {
      const agents = await apiClient.getAgents()
      const agentId = agents[0].id
      const newConfig = { max_tasks: 10 }

      const result = await apiClient.configureAgent(agentId, newConfig)

      expect(result).toHaveProperty('id', agentId)
      expect(result.config).toMatchObject(newConfig)
    })

    it('throws error for non-existent agent', async () => {
      await expect(
        apiClient.configureAgent('non-existent-id', { max_tasks: 10 })
      ).rejects.toThrow('Agent not found')
    })
  })

  describe('agent control methods', () => {
    it('startAgent completes without error in mock mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await expect(apiClient.startAgent('test-agent')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith('Mock: Starting agent test-agent')
    })

    it('stopAgent completes without error in mock mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await expect(apiClient.stopAgent('test-agent')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith('Mock: Stopping agent test-agent')
    })

    it('pauseAgent completes without error in mock mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await expect(apiClient.pauseAgent('test-agent')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith('Mock: Pausing agent test-agent')
    })

    it('resumeAgent completes without error in mock mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await expect(apiClient.resumeAgent('test-agent')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith('Mock: Resuming agent test-agent')
    })

    it('restartAgent completes without error in mock mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await expect(apiClient.restartAgent('test-agent')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith('Mock: Restarting agent test-agent')
    })
  })

  describe('getAgentMetrics', () => {
    it('returns agent metrics in mock mode', async () => {
      const agents = await apiClient.getAgents()
      const agentId = agents[0].id

      const metrics = await apiClient.getAgentMetrics(agentId)

      // AgentMetrics has cpuUsage, memoryUsage, etc.
      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('object')
    })

    it('throws error for non-existent agent', async () => {
      await expect(apiClient.getAgentMetrics('non-existent-id')).rejects.toThrow('Agent not found')
    })
  })

  describe('getAgentLogs', () => {
    it('returns agent logs array in mock mode', async () => {
      const logs = await apiClient.getAgentLogs('test-agent')

      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThan(0)
      expect(typeof logs[0]).toBe('string')
    })

    it('respects limit parameter', async () => {
      const logs = await apiClient.getAgentLogs('test-agent', 3)

      expect(logs.length).toBeLessThanOrEqual(3)
    })
  })

  describe('database methods', () => {
    it('getDatabaseSchema returns schema in mock mode', async () => {
      const schema = await apiClient.getDatabaseSchema()

      expect(schema).toHaveProperty('tables')
      expect(schema).toHaveProperty('total_records')
      expect(schema).toHaveProperty('size_bytes')
      expect(Array.isArray(schema.tables)).toBe(true)
    })

    it('executeQuery returns results in mock mode', async () => {
      const results = await apiClient.executeQuery('SELECT * FROM agents')

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })

    it('getDatabaseStatus returns status in mock mode', async () => {
      const status = await apiClient.getDatabaseStatus()

      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('connections')
      expect(status).toHaveProperty('latency_ms')
      expect(status.status).toBe('healthy')
    })

    it('getDatabaseStatusDetailed returns detailed status in mock mode', async () => {
      const status = await apiClient.getDatabaseStatusDetailed()

      expect(status).toHaveProperty('connected')
      expect(status).toHaveProperty('database_name')
      expect(status).toHaveProperty('tables')
      expect(status).toHaveProperty('total_tables')
      expect(status).toHaveProperty('connection_pool')
      expect(status.connected).toBe(true)
    })
  })

  describe('deployment methods', () => {
    it('getDeployments returns deployments array in mock mode', async () => {
      const deployments = await apiClient.getDeployments()

      expect(Array.isArray(deployments)).toBe(true)
      expect(deployments.length).toBeGreaterThan(0)

      const deployment = deployments[0]
      expect(deployment).toHaveProperty('id')
      expect(deployment).toHaveProperty('name')
      expect(deployment).toHaveProperty('status')
      expect(deployment).toHaveProperty('environment')
    })

    it('triggerDeployment returns new deployment in mock mode', async () => {
      const deployment = await apiClient.triggerDeployment('staging')

      expect(deployment).toHaveProperty('id')
      expect(deployment).toHaveProperty('name')
      expect(deployment).toHaveProperty('status', 'pending')
      expect(deployment).toHaveProperty('environment', 'staging')
    })

    it('getDeploymentStatus returns status in mock mode', async () => {
      const status = await apiClient.getDeploymentStatus()

      expect(status).toHaveProperty('pipeline_name')
      expect(status).toHaveProperty('current_stage')
      expect(status).toHaveProperty('stages')
      expect(Array.isArray(status.stages)).toBe(true)
    })
  })

  describe('infrastructure methods', () => {
    it('getInfrastructureStatus returns status in mock mode', async () => {
      const status = await apiClient.getInfrastructureStatus()

      expect(status).toHaveProperty('docker_containers')
      expect(status).toHaveProperty('services')
      expect(Array.isArray(status.docker_containers)).toBe(true)
      expect(Array.isArray(status.services)).toBe(true)
    })

    it('getInfrastructureTopology returns topology in mock mode', async () => {
      const topology = await apiClient.getInfrastructureTopology()

      expect(topology).toHaveProperty('vpc')
      expect(topology).toHaveProperty('publicSubnets')
      expect(topology).toHaveProperty('privateSubnets')
    })
  })

  describe('activity methods', () => {
    it('getActivityStats returns stats in mock mode', async () => {
      const stats = await apiClient.getActivityStats()

      expect(stats).toHaveProperty('totalEvents')
      expect(stats).toHaveProperty('todayEvents')
      expect(stats).toHaveProperty('activeIssues')
      expect(stats).toHaveProperty('uptime')
    })

    it('getActivityEvents returns events array in mock mode', async () => {
      const events = await apiClient.getActivityEvents()

      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBeGreaterThan(0)

      const event = events[0]
      expect(event).toHaveProperty('id')
      expect(event).toHaveProperty('timestamp')
      expect(event).toHaveProperty('category')
      expect(event).toHaveProperty('title')
      expect(event).toHaveProperty('description')
      expect(event).toHaveProperty('severity')
    })

    it('getActivityEvents respects limit parameter', async () => {
      const events = await apiClient.getActivityEvents(2)

      expect(events.length).toBeLessThanOrEqual(2)
    })
  })

  describe('health check', () => {
    it('healthCheck returns true in mock mode', async () => {
      const isHealthy = await apiClient.healthCheck()

      expect(isHealthy).toBe(true)
    })
  })

  describe('utility methods', () => {
    it('getApiUrl returns the API URL', () => {
      const url = apiClient.getApiUrl()

      expect(typeof url).toBe('string')
      expect(url).toContain('http')
    })

    it('isMockMode returns mock mode status', () => {
      const isMock = apiClient.isMockMode()

      expect(typeof isMock).toBe('boolean')
    })
  })
})
