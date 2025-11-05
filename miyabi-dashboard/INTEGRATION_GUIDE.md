# API Integration Guide

**Mission Control Dashboard - Issue #758**

This guide provides step-by-step instructions for integrating the Mission Control Dashboard with real backend APIs (REST, GraphQL, or WebSocket).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Phase 1: API Client Setup](#phase-1-api-client-setup)
- [Phase 2: REST API Integration](#phase-2-rest-api-integration)
- [Phase 3: GraphQL Integration (Optional)](#phase-3-graphql-integration-optional)
- [Phase 4: WebSocket Real-time Updates](#phase-4-websocket-real-time-updates)
- [Phase 5: Error Handling & Resilience](#phase-5-error-handling--resilience)
- [Testing Strategy](#testing-strategy)
- [Deployment Considerations](#deployment-considerations)

---

## Overview

### Current State

The Mission Control Dashboard currently uses **mock data** defined in `lib/mockData.ts`. All components receive data via props and are ready for API integration.

### Integration Goals

1. Replace mock data with real API calls
2. Maintain component interfaces (no breaking changes)
3. Add real-time updates via WebSocket
4. Implement error handling and loading states
5. Support both REST and GraphQL patterns

### API Endpoints Needed

| Resource | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| Agents | `/api/agents` | GET | List all agents |
| Agent Detail | `/api/agents/:id` | GET | Get single agent |
| Update Agent | `/api/agents/:id` | PATCH | Update agent status |
| Tmux Sessions | `/api/tmux/sessions` | GET | List sessions |
| Session Detail | `/api/tmux/sessions/:id` | GET | Get session info |
| Create Session | `/api/tmux/sessions` | POST | Start new session |
| Timeline Events | `/api/events` | GET | List events |
| Create Event | `/api/events` | POST | Log new event |
| References | `/api/references` | GET | List references |

---

## Architecture

### Data Flow Diagram

```
┌─────────────────┐
│  UI Components  │ (AgentBoard, Timeline, etc.)
└────────┬────────┘
         │ Props
         ↓
┌─────────────────┐
│  Page/Container │ (Server/Client Components)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   API Client    │ (lib/api.ts)
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────┐
    ↓         ↓            ↓          ↓
┌────────┐ ┌─────────┐ ┌──────┐ ┌────────┐
│  REST  │ │ GraphQL │ │  WS  │ │  Mock  │
└────────┘ └─────────┘ └──────┘ └────────┘
```

### Component Independence

Components remain **data-agnostic**. They don't care where data comes from:
- Mock data (development)
- REST API (production)
- GraphQL API (alternative)
- WebSocket stream (real-time)

---

## Phase 1: API Client Setup

### Step 1.1: Create API Client Module

Create `lib/api.ts`:

```typescript
// lib/api.ts
import type { Agent, TmuxSession, TimelineEvent, Reference } from './mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Agent endpoints
  async getAgents(): Promise<Agent[]> {
    return this.fetch<Agent[]>('/api/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return this.fetch<Agent>(`/api/agents/${id}`);
  }

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
    return this.fetch<Agent>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Tmux endpoints
  async getTmuxSessions(): Promise<TmuxSession[]> {
    return this.fetch<TmuxSession[]>('/api/tmux/sessions');
  }

  async getTmuxSession(id: string): Promise<TmuxSession> {
    return this.fetch<TmuxSession>(`/api/tmux/sessions/${id}`);
  }

  async createTmuxSession(name: string, config?: object): Promise<TmuxSession> {
    return this.fetch<TmuxSession>('/api/tmux/sessions', {
      method: 'POST',
      body: JSON.stringify({ name, config }),
    });
  }

  // Timeline endpoints
  async getEvents(params?: { type?: string; agent?: string; limit?: number }): Promise<TimelineEvent[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.fetch<TimelineEvent[]>(`/api/events${query ? `?${query}` : ''}`);
  }

  async createEvent(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
    return this.fetch<TimelineEvent>('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Reference endpoints
  async getReferences(category?: Reference['category']): Promise<Reference[]> {
    const query = category ? `?category=${category}` : '';
    return this.fetch<Reference[]>(`/api/references${query}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### Step 1.2: Environment Configuration

Add to `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=false

# WebSocket Configuration (Phase 4)
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# API Authentication (if needed)
NEXT_PUBLIC_API_KEY=your-api-key
```

### Step 1.3: Feature Flag for Mock Data

Create `lib/config.ts`:

```typescript
// lib/config.ts
export const config = {
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
};
```

Update API client to support mock mode:

```typescript
// lib/api.ts (updated)
import { config } from './config';
import {
  mockAgents,
  mockTmuxSessions,
  mockTimelineEvents,
  mockReferences,
} from './mockData';

class ApiClient {
  // ... existing code ...

  async getAgents(): Promise<Agent[]> {
    if (config.useMockData) {
      return Promise.resolve(mockAgents);
    }
    return this.fetch<Agent[]>('/api/agents');
  }

  // Apply same pattern to all methods
}
```

---

## Phase 2: REST API Integration

### Step 2.1: Update Page Components

Convert from static to dynamic data fetching:

**Before** (Static with Mock Data):
```typescript
// app/mission-control/page.tsx
import AgentBoard from '@/components/mission-control/AgentBoard';
import { mockAgents } from '@/lib/mockData';

export default function MissionControlPage() {
  return <AgentBoard agents={mockAgents} />;
}
```

**After** (Server Component with API):
```typescript
// app/mission-control/page.tsx
import AgentBoard from '@/components/mission-control/AgentBoard';
import { apiClient } from '@/lib/api';

export default async function MissionControlPage() {
  const agents = await apiClient.getAgents();

  return <AgentBoard agents={agents} />;
}
```

### Step 2.2: Add Loading and Error States

```typescript
// app/mission-control/page.tsx
import { Suspense } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import { AgentBoardSkeleton } from '@/components/mission-control/skeletons';
import { apiClient } from '@/lib/api';

async function AgentBoardWrapper() {
  try {
    const agents = await apiClient.getAgents();
    return <AgentBoard agents={agents} />;
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Failed to Load Agents</h3>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}

export default function MissionControlPage() {
  return (
    <Suspense fallback={<AgentBoardSkeleton />}>
      <AgentBoardWrapper />
    </Suspense>
  );
}
```

### Step 2.3: Client-Side Data Fetching (Alternative)

For components that need interactivity:

```typescript
'use client';

import { useState, useEffect } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import { apiClient } from '@/lib/api';
import type { Agent } from '@/lib/mockData';

export default function InteractiveAgentBoard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getAgents()
      .then(setAgents)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading agents...</div>;
  if (error) return <div>Error: {error}</div>;

  return <AgentBoard agents={agents} />;
}
```

### Step 2.4: Polling for Updates

```typescript
'use client';

import { useState, useEffect } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import { apiClient } from '@/lib/api';
import type { Agent } from '@/lib/mockData';

export default function PollingAgentBoard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = () => {
      apiClient.getAgents()
        .then(data => {
          setAgents(data);
          setLastUpdate(new Date());
        })
        .catch(console.error);
    };

    fetchData(); // Initial fetch

    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="text-xs text-gray-500 mb-2">
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>
      <AgentBoard agents={agents} />
    </div>
  );
}
```

---

## Phase 3: GraphQL Integration (Optional)

### Step 3.1: Install GraphQL Client

```bash
npm install @apollo/client graphql
```

### Step 3.2: Create GraphQL Client

```typescript
// lib/graphql-client.ts
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql',
  cache: new InMemoryCache(),
});

export const GET_AGENTS = gql`
  query GetAgents {
    agents {
      id
      name
      type
      status
      currentTask
      tasksCompleted
    }
  }
`;

export const GET_TMUX_SESSIONS = gql`
  query GetTmuxSessions {
    tmuxSessions {
      id
      name
      windows
      panes
      attached
      created
    }
  }
`;

export const GET_TIMELINE_EVENTS = gql`
  query GetTimelineEvents($limit: Int, $type: String) {
    events(limit: $limit, type: $type) {
      id
      timestamp
      type
      agent
      message
    }
  }
`;

export default client;
```

### Step 3.3: Use GraphQL in Components

```typescript
'use client';

import { useQuery } from '@apollo/client';
import AgentBoard from '@/components/mission-control/AgentBoard';
import { GET_AGENTS } from '@/lib/graphql-client';

export default function GraphQLAgentBoard() {
  const { loading, error, data } = useQuery(GET_AGENTS);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <AgentBoard agents={data.agents} />;
}
```

### Step 3.4: Apollo Provider Setup

```typescript
// app/providers.tsx
'use client';

import { ApolloProvider } from '@apollo/client';
import client from '@/lib/graphql-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
```

---

## Phase 4: WebSocket Real-time Updates

### Step 4.1: Create WebSocket Hook

```typescript
// lib/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { config } from '../config';

export function useWebSocket<T>(channel: string) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${config.wsUrl}/ws/${channel}`);

    ws.onopen = () => {
      console.log(`WebSocket connected to ${channel}`);
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setData(parsed);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [channel]);

  return { data, connected };
}
```

### Step 4.2: Real-time Agent Status

```typescript
'use client';

import { useState, useEffect } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { apiClient } from '@/lib/api';
import type { Agent } from '@/lib/mockData';

export default function RealTimeAgentBoard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const { data: agentUpdate, connected } = useWebSocket<{ id: string; changes: Partial<Agent> }>('agents');

  // Initial fetch
  useEffect(() => {
    apiClient.getAgents().then(setAgents);
  }, []);

  // Apply real-time updates
  useEffect(() => {
    if (!agentUpdate) return;

    setAgents(prev => prev.map(agent =>
      agent.id === agentUpdate.id
        ? { ...agent, ...agentUpdate.changes }
        : agent
    ));
  }, [agentUpdate]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-gray-500">
          {connected ? 'Live updates active' : 'Disconnected'}
        </span>
      </div>
      <AgentBoard agents={agents} />
    </div>
  );
}
```

### Step 4.3: Real-time Timeline Events

```typescript
'use client';

import { useState, useEffect } from 'react';
import Timeline from '@/components/mission-control/Timeline';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { apiClient } from '@/lib/api';
import type { TimelineEvent } from '@/lib/mockData';

export default function RealTimeTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const { data: newEvent } = useWebSocket<TimelineEvent>('events');

  // Initial fetch
  useEffect(() => {
    apiClient.getEvents({ limit: 50 }).then(setEvents);
  }, []);

  // Prepend new events
  useEffect(() => {
    if (!newEvent) return;

    setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100
  }, [newEvent]);

  return <Timeline events={events} />;
}
```

---

## Phase 5: Error Handling & Resilience

### Step 5.1: Retry Logic

```typescript
// lib/utils/retry.ts
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}

// Usage
const agents = await fetchWithRetry(() => apiClient.getAgents());
```

### Step 5.2: Error Boundary

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 5.3: Connection Status Indicator

```typescript
// components/ConnectionStatus.tsx
'use client';

import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
      No internet connection. Some features may be unavailable.
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests for API Client

```typescript
// lib/__tests__/api.test.ts
import { apiClient } from '../api';
import { mockAgents } from '../mockData';

global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches agents successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAgents,
    });

    const agents = await apiClient.getAgents();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/agents',
      expect.any(Object)
    );
    expect(agents).toEqual(mockAgents);
  });

  it('handles API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(apiClient.getAgents()).rejects.toThrow('API Error: 500 Internal Server Error');
  });
});
```

### Integration Tests

```typescript
// app/mission-control/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import MissionControlPage from '../page';
import { apiClient } from '@/lib/api';
import { mockAgents } from '@/lib/mockData';

jest.mock('@/lib/api');

describe('Mission Control Page', () => {
  it('renders agent data from API', async () => {
    (apiClient.getAgents as jest.Mock).mockResolvedValue(mockAgents);

    render(<MissionControlPage />);

    await waitFor(() => {
      expect(screen.getByText('CoordinatorAgent')).toBeInTheDocument();
    });
  });
});
```

---

## Deployment Considerations

### Environment Variables

**Development** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=true
```

**Staging** (`.env.staging`):
```bash
NEXT_PUBLIC_API_URL=https://staging-api.miyabi.com
NEXT_PUBLIC_WS_URL=wss://staging-api.miyabi.com
NEXT_PUBLIC_USE_MOCK_DATA=false
```

**Production** (`.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.miyabi.com
NEXT_PUBLIC_WS_URL=wss://api.miyabi.com
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### CORS Configuration

Backend must allow frontend origin:

```javascript
// Express.js example
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
```

### Rate Limiting

Implement rate limiting on frontend to avoid overwhelming backend:

```typescript
// lib/utils/rate-limiter.ts
class RateLimiter {
  private timestamps: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(ts => now - ts < this.window);

    if (this.timestamps.length >= this.limit) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }
}

// 60 requests per minute
export const apiRateLimiter = new RateLimiter(60, 60000);
```

---

## Migration Checklist

### Pre-Integration

- [ ] Backend API endpoints are deployed and accessible
- [ ] API documentation is available (OpenAPI/Swagger)
- [ ] Environment variables are configured
- [ ] CORS is properly set up

### Phase 1: Setup

- [ ] API client created (`lib/api.ts`)
- [ ] Configuration file created (`lib/config.ts`)
- [ ] Mock data toggle implemented
- [ ] TypeScript types match API responses

### Phase 2: REST Integration

- [ ] Agents API integrated
- [ ] Tmux Sessions API integrated
- [ ] Timeline Events API integrated
- [ ] References API integrated
- [ ] Error handling implemented
- [ ] Loading states added

### Phase 3: GraphQL (Optional)

- [ ] Apollo Client configured
- [ ] GraphQL queries defined
- [ ] Components updated to use GraphQL
- [ ] Error handling tested

### Phase 4: WebSocket

- [ ] WebSocket hook created
- [ ] Real-time agent updates working
- [ ] Real-time timeline working
- [ ] Connection indicators added
- [ ] Reconnection logic implemented

### Phase 5: Production Readiness

- [ ] Error boundaries in place
- [ ] Retry logic implemented
- [ ] Rate limiting configured
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Performance tested
- [ ] Security audit completed

---

## Troubleshooting

### Common Issues

**Issue**: CORS errors in browser console
**Solution**: Ensure backend CORS configuration includes your frontend origin

**Issue**: WebSocket connection fails
**Solution**: Check if WebSocket URL uses `wss://` (secure) in production

**Issue**: API returns 401 Unauthorized
**Solution**: Verify API key is correctly set in environment variables

**Issue**: Components show stale data
**Solution**: Implement cache invalidation or reduce polling interval

**Issue**: High bandwidth usage
**Solution**: Implement data compression, use WebSocket instead of polling

---

## Support

For questions or issues:
- Check component documentation: [components/README.md](components/README.md)
- Review mock data structure: [MOCK_DATA.md](MOCK_DATA.md)
- See agent specifications: `.claude/agents/specs/ContentCreation.md`
- Contact: Mission Control team

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-05
**Maintained By**: ContentCreation Agent (アヤ)
**Next Review**: After Phase 2 REST integration complete
