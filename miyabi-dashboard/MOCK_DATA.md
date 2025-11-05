# Mock Data Structure Reference

**Mission Control Dashboard - Issue #758**

This document describes the mock data structures used in the Mission Control Dashboard prototype. These structures will be replaced with real API data in future iterations.

---

## Table of Contents

- [Data Types](#data-types)
  - [Agent](#agent)
  - [TmuxSession](#tmuxsession)
  - [TimelineEvent](#timelineevent)
  - [Reference](#reference)
- [Mock Data Collections](#mock-data-collections)
- [Usage Examples](#usage-examples)
- [Future API Integration](#future-api-integration)

---

## Data Types

### Agent

Represents an autonomous agent in the Miyabi system.

```typescript
interface Agent {
  id: string;                                 // Unique identifier
  name: string;                               // Agent name (e.g., "CoordinatorAgent")
  type: 'coding' | 'business';                // Agent category
  status: 'active' | 'idle' | 'offline';      // Current operational status
  currentTask?: string;                       // Optional: Current task description
  tasksCompleted: number;                     // Total tasks completed by this agent
}
```

**Field Descriptions**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier for the agent | `"1"` |
| `name` | `string` | Display name of the agent | `"CoordinatorAgent"` |
| `type` | `'coding' \| 'business'` | Agent category - coding or business operations | `"coding"` |
| `status` | `'active' \| 'idle' \| 'offline'` | Current operational state | `"active"` |
| `currentTask` | `string \| undefined` | Description of current task (if any) | `"Issue #758 - Implementation"` |
| `tasksCompleted` | `number` | Total number of completed tasks | `142` |

**Status Definitions**:
- **active**: Agent is currently executing a task
- **idle**: Agent is online but not currently assigned work
- **offline**: Agent is not available

**Type Definitions**:
- **coding**: Technical agents (CoordinatorAgent, CodeGenAgent, ReviewAgent, etc.)
- **business**: Business-focused agents (MarketingAgent, SalesAgent, etc.)

---

### TmuxSession

Represents a tmux terminal multiplexer session.

```typescript
interface TmuxSession {
  id: string;           // Unique session identifier
  name: string;         // Session name
  windows: number;      // Number of windows in session
  panes: number;        // Total number of panes across all windows
  attached: boolean;    // Whether session is currently attached
  created: string;      // ISO 8601 timestamp of session creation
}
```

**Field Descriptions**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier for the session | `"1"` |
| `name` | `string` | Session name | `"miyabi-refactor"` |
| `windows` | `number` | Number of windows in this session | `2` |
| `panes` | `number` | Total panes across all windows | `12` |
| `attached` | `boolean` | Whether a client is currently attached | `true` |
| `created` | `string` | ISO 8601 creation timestamp | `"2025-11-05T03:56:00Z"` |

**Typical Session Configurations**:
- **Coding Ensemble**: 1 window, 5 panes
- **Hybrid Ensemble**: 1 window, 7 panes
- **Custom Workflows**: Variable configuration

---

### TimelineEvent

Represents a chronological event or alert in the system.

```typescript
interface TimelineEvent {
  id: string;                                    // Unique event identifier
  timestamp: string;                             // ISO 8601 timestamp
  type: 'info' | 'warning' | 'error' | 'success'; // Event severity/type
  agent?: string;                                // Optional: Agent that generated event
  message: string;                               // Event description
}
```

**Field Descriptions**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier for the event | `"1"` |
| `timestamp` | `string` | ISO 8601 timestamp of when event occurred | `"2025-11-05T04:02:49Z"` |
| `type` | `'info' \| 'warning' \| 'error' \| 'success'` | Event severity level | `"success"` |
| `agent` | `string \| undefined` | Name of agent that generated the event | `"IssueAgent"` |
| `message` | `string` | Human-readable event description | `"Issue #758 analysis completed"` |

**Event Type Meanings**:
- **success**: Operation completed successfully (green)
- **info**: Informational message (blue)
- **warning**: Potential issue or degraded state (yellow)
- **error**: Operation failed or critical issue (red)

**Visual Styling**:
Each event type has associated color coding in the UI for quick visual scanning.

---

### Reference

Represents a documentation or API reference link.

```typescript
interface Reference {
  id: string;                           // Unique identifier
  title: string;                        // Display title
  category: 'docs' | 'guide' | 'api';   // Reference category
  url: string;                          // Target URL
}
```

**Field Descriptions**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier for the reference | `"1"` |
| `title` | `string` | Display title for the link | `"Entity-Relation Model"` |
| `category` | `'docs' \| 'guide' \| 'api'` | Type of reference material | `"docs"` |
| `url` | `string` | Absolute or relative URL | `"/docs/ENTITY_RELATION_MODEL.md"` |

**Category Definitions**:
- **docs**: Documentation files (📄 icon)
- **guide**: How-to guides and tutorials (📖 icon)
- **api**: API references and endpoints (⚙️ icon)

---

## Mock Data Collections

### mockAgents

Collection of 6 sample agents (4 coding, 2 business):

```typescript
export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'CoordinatorAgent',
    type: 'coding',
    status: 'active',
    currentTask: 'Issue #758 - Task Decomposition',
    tasksCompleted: 142
  },
  // ... 5 more agents
];
```

**Current Mock Agents**:
1. CoordinatorAgent (coding, active)
2. CodeGenAgent (coding, active)
3. ReviewAgent (coding, idle)
4. DeploymentAgent (coding, idle)
5. MarketingAgent (business, active)
6. SalesAgent (business, offline)

---

### mockTmuxSessions

Collection of 3 sample tmux sessions:

```typescript
export const mockTmuxSessions: TmuxSession[] = [
  {
    id: '1',
    name: 'miyabi-refactor',
    windows: 2,
    panes: 12,
    attached: true,
    created: '2025-11-05T03:56:00Z'
  },
  // ... 2 more sessions
];
```

**Current Mock Sessions**:
1. miyabi-refactor (attached, 2 windows, 12 panes)
2. miyabi-demo (detached, 1 window, 5 panes)
3. coding-ensemble (detached, 1 window, 5 panes)

---

### mockTimelineEvents

Collection of 5 sample events:

```typescript
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    timestamp: '2025-11-05T04:02:49Z',
    type: 'success',
    agent: 'IssueAgent',
    message: 'Issue #758 analysis completed'
  },
  // ... 4 more events
];
```

**Event Types Represented**:
- Success events (issue analysis, file generation)
- Info events (task decomposition)
- Warning events (LLM timeout)
- Error events (missing API keys)

---

### mockReferences

Collection of 6 sample reference links:

```typescript
export const mockReferences: Reference[] = [
  {
    id: '1',
    title: 'Entity-Relation Model',
    category: 'docs',
    url: '/docs/ENTITY_RELATION_MODEL.md'
  },
  // ... 5 more references
];
```

**Reference Categories**:
- 2 docs (Entity-Relation Model, Label System Guide)
- 2 guides (Agent Specifications, MCP Integration Protocol)
- 2 APIs (GitHub API, Miyabi CLI Reference)

---

## Usage Examples

### Importing Mock Data

```typescript
import {
  mockAgents,
  mockTmuxSessions,
  mockTimelineEvents,
  mockReferences,
  type Agent,
  type TmuxSession,
  type TimelineEvent,
  type Reference
} from '@/lib/mockData';
```

### Using in Components

```typescript
// AgentBoard example
<AgentBoard agents={mockAgents} />

// TmaxlView example
<TmaxlView sessions={mockTmuxSessions} />

// Timeline example
<Timeline events={mockTimelineEvents} />

// ReferenceHub example
<ReferenceHub references={mockReferences} />
```

### Type Checking

```typescript
// Create a new agent with proper typing
const newAgent: Agent = {
  id: '7',
  name: 'TestAgent',
  type: 'coding',
  status: 'idle',
  tasksCompleted: 0
};

// Filter agents by type
const codingAgents = mockAgents.filter(agent => agent.type === 'coding');

// Find active agents
const activeAgents = mockAgents.filter(agent => agent.status === 'active');
```

---

## Future API Integration

### Planned API Endpoints

When integrating with real APIs, these endpoints will replace mock data:

#### Agents API
```
GET /api/agents              # List all agents
GET /api/agents/:id          # Get specific agent
PATCH /api/agents/:id        # Update agent status
```

#### Tmux Sessions API
```
GET /api/tmux/sessions       # List all sessions
GET /api/tmux/sessions/:id   # Get session details
POST /api/tmux/sessions      # Create new session
DELETE /api/tmux/sessions/:id # Terminate session
```

#### Timeline Events API
```
GET /api/events              # List recent events
GET /api/events?type=error   # Filter by type
GET /api/events?agent=CodeGenAgent # Filter by agent
POST /api/events             # Create event (for notifications)
```

#### References API
```
GET /api/references          # List all references
GET /api/references?category=docs # Filter by category
```

### WebSocket Integration (Future)

For real-time updates:

```typescript
// Agent status updates
ws://localhost:3000/ws/agents

// Timeline event stream
ws://localhost:3000/ws/events

// Tmux session changes
ws://localhost:3000/ws/tmux
```

### Migration Strategy

1. Create API client wrapper functions that use mock data initially
2. Implement actual API endpoints one by one
3. Switch API client to use real endpoints via environment configuration
4. Keep mock data for testing and Storybook

Example abstraction:

```typescript
// lib/api.ts
export const getAgents = async (): Promise<Agent[]> => {
  if (process.env.USE_MOCK_DATA === 'true') {
    return mockAgents;
  }
  const response = await fetch('/api/agents');
  return response.json();
};
```

---

## Validation & Testing

### Type Safety

All mock data is strongly typed, ensuring:
- Required fields are present
- Enums match expected values
- Optional fields are properly marked

### Data Consistency

Mock data demonstrates realistic scenarios:
- Mix of active, idle, and offline agents
- Various event types and severities
- Different tmux session configurations
- Diverse reference categories

### Testing Recommendations

1. Unit tests should use mock data directly
2. Integration tests can use API mocks with same structure
3. E2E tests should have separate test fixtures
4. Storybook stories should use mock data for consistency

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-05
**Maintained By**: ContentCreation Agent (アヤ)
