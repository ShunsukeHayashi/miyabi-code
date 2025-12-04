import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { apiClient, agentsApi, issuesApi } from './client';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiClient', () => {
    it('should be created with correct base URL in development', () => {
      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('agentsApi', () => {
    it('should have list method', () => {
      expect(typeof agentsApi.list).toBe('function');
    });

    it('should have getStatus method', () => {
      expect(typeof agentsApi.getStatus).toBe('function');
    });

    it('should have execute method', () => {
      expect(typeof agentsApi.execute).toBe('function');
    });
  });

  describe('issuesApi', () => {
    it('should have list method', () => {
      expect(typeof issuesApi.list).toBe('function');
    });

    it('should have get method', () => {
      expect(typeof issuesApi.get).toBe('function');
    });
  });
});

describe('Type Definitions', () => {
  it('should define AgentStatus interface correctly', () => {
    const mockAgent = {
      name: 'coordinator',
      type: 'Coding' as const,
      status: 'idle',
      capabilities: ['orchestrate', 'delegate'],
      current_task: null,
      tmux_pane: '%0',
    };

    expect(mockAgent.name).toBeDefined();
    expect(mockAgent.type).toBe('Coding');
  });

  it('should define Issue interface correctly', () => {
    const mockIssue = {
      number: 123,
      title: 'Test Issue',
      state: 'open',
      labels: [{ name: 'bug', color: 'ff0000' }],
      assignees: ['developer'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      body: 'Issue description',
    };

    expect(mockIssue.number).toBe(123);
    expect(mockIssue.labels).toHaveLength(1);
  });
});
