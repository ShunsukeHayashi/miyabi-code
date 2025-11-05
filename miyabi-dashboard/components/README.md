# Mission Control Dashboard - Component Documentation

**Issue #758 - Dashboard Components**

This document provides comprehensive documentation for all Mission Control Dashboard components, including APIs, props, usage examples, and best practices.

---

## Table of Contents

- [Overview](#overview)
- [Component Library](#component-library)
  - [AgentBoard](#agentboard)
  - [TmaxlView](#tmaxlview)
  - [Timeline](#timeline)
  - [ReferenceHub](#referencehub)
- [Common Patterns](#common-patterns)
- [Styling Guidelines](#styling-guidelines)
- [Accessibility](#accessibility)
- [Testing](#testing)

---

## Overview

The Mission Control Dashboard provides real-time visibility into Miyabi's autonomous agent operations. Four core components display different aspects of the system:

1. **AgentBoard** - Agent status and activity monitoring
2. **TmaxlView** - Tmux session management interface
3. **Timeline** - Event history and alerts
4. **ReferenceHub** - Quick access to documentation and APIs

All components are built with:
- **React 18+** with TypeScript
- **Next.js 14** App Router
- **Tailwind CSS** for styling
- **Client-side rendering** (`'use client'` directive)

---

## Component Library

### AgentBoard

Displays a grid of agent cards showing current status, type, and activity.

#### Props

```typescript
interface AgentBoardProps {
  agents: Agent[];
}

interface Agent {
  id: string;
  name: string;
  type: 'coding' | 'business';
  status: 'active' | 'idle' | 'offline';
  currentTask?: string;
  tasksCompleted: number;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `agents` | `Agent[]` | Yes | Array of agent objects to display |

#### Agent Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `name` | `string` | Display name (e.g., "CoordinatorAgent") |
| `type` | `'coding' \| 'business'` | Agent category |
| `status` | `'active' \| 'idle' \| 'offline'` | Current operational status |
| `currentTask` | `string \| undefined` | Optional current task description |
| `tasksCompleted` | `number` | Total completed tasks |

#### Usage Example

```typescript
import AgentBoard from '@/components/mission-control/AgentBoard';
import { mockAgents } from '@/lib/mockData';

export default function Dashboard() {
  return (
    <div className="p-8">
      <AgentBoard agents={mockAgents} />
    </div>
  );
}
```

#### Advanced Usage - Filtering

```typescript
import { useState, useMemo } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import { mockAgents, type Agent } from '@/lib/mockData';

export default function FilterableAgentBoard() {
  const [filter, setFilter] = useState<'all' | 'coding' | 'business'>('all');

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return mockAgents;
    return mockAgents.filter(agent => agent.type === filter);
  }, [filter]);

  return (
    <div>
      {/* Filter controls */}
      <div className="mb-4 space-x-2">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('coding')}>Coding</button>
        <button onClick={() => setFilter('business')}>Business</button>
      </div>

      <AgentBoard agents={filteredAgents} />
    </div>
  );
}
```

#### Visual Design

**Status Indicators**:
- 🟢 Green: Active (currently executing task)
- 🟡 Yellow: Idle (online but no current task)
- ⚫ Gray: Offline (not available)

**Type Badges**:
- Blue background: Coding agents
- Purple background: Business agents

**Responsive Layout**:
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns

#### Component Location

```
miyabi-dashboard/components/mission-control/AgentBoard.tsx
```

---

### TmaxlView

Displays active tmux sessions with window and pane counts.

#### Props

```typescript
interface TmaxlViewProps {
  sessions: TmuxSession[];
}

interface TmuxSession {
  id: string;
  name: string;
  windows: number;
  panes: number;
  attached: boolean;
  created: string; // ISO 8601 timestamp
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sessions` | `TmuxSession[]` | Yes | Array of tmux session objects |

#### TmuxSession Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique session identifier |
| `name` | `string` | Session name |
| `windows` | `number` | Number of windows |
| `panes` | `number` | Total panes across all windows |
| `attached` | `boolean` | Whether session is attached |
| `created` | `string` | ISO 8601 creation timestamp |

#### Usage Example

```typescript
import TmaxlView from '@/components/mission-control/TmaxlView';
import { mockTmuxSessions } from '@/lib/mockData';

export default function SessionMonitor() {
  return (
    <div className="p-8">
      <TmaxlView sessions={mockTmuxSessions} />
    </div>
  );
}
```

#### Advanced Usage - Live Updates

```typescript
'use client';

import { useState, useEffect } from 'react';
import TmaxlView from '@/components/mission-control/TmaxlView';
import type { TmuxSession } from '@/lib/mockData';

export default function LiveTmuxMonitor() {
  const [sessions, setSessions] = useState<TmuxSession[]>([]);

  useEffect(() => {
    // Fetch initial data
    fetch('/api/tmux/sessions')
      .then(res => res.json())
      .then(setSessions);

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetch('/api/tmux/sessions')
        .then(res => res.json())
        .then(setSessions);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return <TmaxlView sessions={sessions} />;
}
```

#### Visual Design

**Session Cards**:
- Attached sessions show green "Attached" badge
- Detached sessions have no badge
- Creation time displayed in user-friendly format

**Empty State**:
- Shows "No active tmux sessions" when array is empty

**Interaction**:
- Hover effect: Background changes to light gray
- Cards are clickable (future: navigate to session detail)

#### Component Location

```
miyabi-dashboard/components/mission-control/TmaxlView.tsx
```

---

### Timeline

Displays chronological event history with color-coded severity levels.

#### Props

```typescript
interface TimelineProps {
  events: TimelineEvent[];
}

interface TimelineEvent {
  id: string;
  timestamp: string; // ISO 8601
  type: 'info' | 'warning' | 'error' | 'success';
  agent?: string;
  message: string;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `events` | `TimelineEvent[]` | Yes | Array of timeline events |

#### TimelineEvent Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique event identifier |
| `timestamp` | `string` | ISO 8601 timestamp |
| `type` | `'info' \| 'warning' \| 'error' \| 'success'` | Event severity |
| `agent` | `string \| undefined` | Optional agent name |
| `message` | `string` | Event description |

#### Usage Example

```typescript
import Timeline from '@/components/mission-control/Timeline';
import { mockTimelineEvents } from '@/lib/mockData';

export default function EventTimeline() {
  return (
    <div className="p-8">
      <Timeline events={mockTimelineEvents} />
    </div>
  );
}
```

#### Advanced Usage - Filtering by Type

```typescript
'use client';

import { useState, useMemo } from 'react';
import Timeline from '@/components/mission-control/Timeline';
import { mockTimelineEvents, type TimelineEvent } from '@/lib/mockData';

export default function FilterableTimeline() {
  const [typeFilter, setTypeFilter] = useState<TimelineEvent['type'] | 'all'>('all');

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return mockTimelineEvents;
    return mockTimelineEvents.filter(event => event.type === typeFilter);
  }, [typeFilter]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTypeFilter('all')}>All</button>
        <button onClick={() => setTypeFilter('success')}>Success</button>
        <button onClick={() => setTypeFilter('info')}>Info</button>
        <button onClick={() => setTypeFilter('warning')}>Warning</button>
        <button onClick={() => setTypeFilter('error')}>Error</button>
      </div>

      <Timeline events={filteredEvents} />
    </div>
  );
}
```

#### Advanced Usage - Real-time Event Stream

```typescript
'use client';

import { useState, useEffect } from 'react';
import Timeline from '@/components/mission-control/Timeline';
import type { TimelineEvent } from '@/lib/mockData';

export default function LiveTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    // WebSocket connection for real-time events
    const ws = new WebSocket('ws://localhost:3000/ws/events');

    ws.onmessage = (message) => {
      const newEvent: TimelineEvent = JSON.parse(message.data);
      setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100
    };

    return () => ws.close();
  }, []);

  return <Timeline events={events} />;
}
```

#### Visual Design

**Event Type Colors**:
- 🟢 Success: Green background with green border
- 🔵 Info: Blue background with blue border
- 🟡 Warning: Yellow background with yellow border
- 🔴 Error: Red background with red border

**Layout**:
- Vertical timeline with left border indicating event type
- Agent name displayed in uppercase small text
- Message in main text
- Timestamp on the right

**Scrolling**:
- Max height: 384px (24rem)
- Vertical scroll for overflow
- Maintains aspect ratio on all screen sizes

#### Component Location

```
miyabi-dashboard/components/mission-control/Timeline.tsx
```

---

### ReferenceHub

Displays categorized documentation and API reference links.

#### Props

```typescript
interface ReferenceHubProps {
  references: Reference[];
}

interface Reference {
  id: string;
  title: string;
  category: 'docs' | 'guide' | 'api';
  url: string;
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `references` | `Reference[]` | Yes | Array of reference objects |

#### Reference Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `title` | `string` | Display title |
| `category` | `'docs' \| 'guide' \| 'api'` | Reference type |
| `url` | `string` | Target URL (absolute or relative) |

#### Usage Example

```typescript
import ReferenceHub from '@/components/mission-control/ReferenceHub';
import { mockReferences } from '@/lib/mockData';

export default function Documentation() {
  return (
    <div className="p-8">
      <ReferenceHub references={mockReferences} />
    </div>
  );
}
```

#### Advanced Usage - Dynamic References

```typescript
'use client';

import { useState, useEffect } from 'react';
import ReferenceHub from '@/components/mission-control/ReferenceHub';
import type { Reference } from '@/lib/mockData';

export default function DynamicReferenceHub() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/references')
      .then(res => res.json())
      .then(data => {
        setReferences(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading references...</div>;

  return <ReferenceHub references={references} />;
}
```

#### Advanced Usage - Category Filtering

```typescript
'use client';

import { useState, useMemo } from 'react';
import ReferenceHub from '@/components/mission-control/ReferenceHub';
import { mockReferences, type Reference } from '@/lib/mockData';

export default function FilterableReferenceHub() {
  const [category, setCategory] = useState<Reference['category'] | 'all'>('all');

  const filteredRefs = useMemo(() => {
    if (category === 'all') return mockReferences;
    return mockReferences.filter(ref => ref.category === category);
  }, [category]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setCategory('all')}>All</button>
        <button onClick={() => setCategory('docs')}>Docs</button>
        <button onClick={() => setCategory('guide')}>Guides</button>
        <button onClick={() => setCategory('api')}>APIs</button>
      </div>

      <ReferenceHub references={filteredRefs} />
    </div>
  );
}
```

#### Visual Design

**Category Icons**:
- 📄 Docs: Documentation files
- 📖 Guide: Tutorials and how-tos
- ⚙️ API: API references

**Category Badges**:
- Blue: Docs
- Purple: Guide
- Green: API

**Interaction**:
- Links open in new tab (`target="_blank"`)
- Hover effect: Shadow increases, border becomes blue
- Accessible with keyboard navigation

**Responsive Layout**:
- Mobile: 1 column
- Desktop (> 768px): 2 columns

#### Component Location

```
miyabi-dashboard/components/mission-control/ReferenceHub.tsx
```

---

## Common Patterns

### Data Fetching Pattern

All components accept data via props. Here's a recommended pattern for fetching:

```typescript
// app/mission-control/page.tsx
import { Suspense } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import TmaxlView from '@/components/mission-control/TmaxlView';
import Timeline from '@/components/mission-control/Timeline';
import ReferenceHub from '@/components/mission-control/ReferenceHub';
import { mockAgents, mockTmuxSessions, mockTimelineEvents, mockReferences } from '@/lib/mockData';

export default function MissionControlPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
      <Suspense fallback={<div>Loading agents...</div>}>
        <AgentBoard agents={mockAgents} />
      </Suspense>

      <Suspense fallback={<div>Loading sessions...</div>}>
        <TmaxlView sessions={mockTmuxSessions} />
      </Suspense>

      <Suspense fallback={<div>Loading events...</div>}>
        <Timeline events={mockTimelineEvents} />
      </Suspense>

      <Suspense fallback={<div>Loading references...</div>}>
        <ReferenceHub references={mockReferences} />
      </Suspense>
    </div>
  );
}
```

### Error Handling Pattern

```typescript
'use client';

import { useState, useEffect } from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import type { Agent } from '@/lib/mockData';

export default function SafeAgentBoard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch agents');
        return res.json();
      })
      .then(setAgents)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return <AgentBoard agents={agents} />;
}
```

### Loading States Pattern

```typescript
import { Skeleton } from '@/components/ui/skeleton';

function AgentBoardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Styling Guidelines

### Tailwind Classes

All components use consistent Tailwind styling:

**Card Containers**:
```css
bg-white rounded-lg shadow p-6
```

**Headings**:
```css
text-2xl font-bold mb-4 text-gray-800
```

**Hover Effects**:
```css
hover:shadow-md transition-shadow
hover:bg-gray-50 transition-colors
```

### Custom Styling

If you need to customize beyond Tailwind:

```typescript
import AgentBoard from '@/components/mission-control/AgentBoard';

export default function CustomStyledBoard() {
  return (
    <div className="custom-container">
      <AgentBoard agents={agents} />

      <style jsx>{`
        .custom-container {
          background: linear-gradient(to bottom, #1a1a1a, #2d2d2d);
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}
```

---

## Accessibility

All components follow WCAG 2.1 AA standards:

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order is logical
- Focus indicators are visible

### Screen Readers
- Semantic HTML elements used throughout
- ARIA labels where appropriate
- Meaningful alt text for icons (via emoji)

### Color Contrast
- All text meets 4.5:1 contrast ratio
- Color is not the only indicator of status
- High contrast mode compatible

### Example: Enhanced Accessibility

```typescript
<a
  href={reference.url}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${reference.title} - ${reference.category} reference`}
  className="..."
>
  {/* content */}
</a>
```

---

## Testing

### Unit Testing with Jest & React Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import type { Agent } from '@/lib/mockData';

describe('AgentBoard', () => {
  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'TestAgent',
      type: 'coding',
      status: 'active',
      currentTask: 'Testing',
      tasksCompleted: 5
    }
  ];

  it('renders agent cards', () => {
    render(<AgentBoard agents={mockAgents} />);
    expect(screen.getByText('TestAgent')).toBeInTheDocument();
  });

  it('displays status indicator', () => {
    render(<AgentBoard agents={mockAgents} />);
    const statusDot = screen.getByText('TestAgent')
      .closest('div')
      ?.querySelector('.bg-green-500');
    expect(statusDot).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import MissionControlPage from '@/app/mission-control/page';

describe('Mission Control Page', () => {
  it('renders all components', async () => {
    render(<MissionControlPage />);

    await waitFor(() => {
      expect(screen.getByText('Agent Board')).toBeInTheDocument();
      expect(screen.getByText('TMAXL Sessions')).toBeInTheDocument();
      expect(screen.getByText('Timeline & Alerts')).toBeInTheDocument();
      expect(screen.getByText('Reference Hub')).toBeInTheDocument();
    });
  });
});
```

### Storybook Stories

```typescript
// AgentBoard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import AgentBoard from './AgentBoard';
import { mockAgents } from '@/lib/mockData';

const meta: Meta<typeof AgentBoard> = {
  title: 'MissionControl/AgentBoard',
  component: AgentBoard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AgentBoard>;

export const Default: Story = {
  args: {
    agents: mockAgents,
  },
};

export const CodingAgentsOnly: Story = {
  args: {
    agents: mockAgents.filter(a => a.type === 'coding'),
  },
};

export const Empty: Story = {
  args: {
    agents: [],
  },
};
```

---

## Best Practices

### Performance

1. **Memoization**: Use `useMemo` for filtered/sorted data
2. **Virtualization**: For large lists (>100 items), consider `react-window`
3. **Code Splitting**: Components are lazy-loadable

```typescript
import dynamic from 'next/dynamic';

const AgentBoard = dynamic(() => import('@/components/mission-control/AgentBoard'), {
  loading: () => <div>Loading...</div>,
});
```

### Type Safety

Always import and use TypeScript types:

```typescript
import type { Agent, TimelineEvent } from '@/lib/mockData';
```

### Error Boundaries

Wrap components in error boundaries for production:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <AgentBoard agents={agents} />
</ErrorBoundary>
```

---

## Future Enhancements

### Planned Features

1. **Interactive Controls**
   - Click agents to view detailed stats
   - Attach/detach tmux sessions from UI
   - Clear/filter timeline events
   - Bookmark favorite references

2. **Real-time Updates**
   - WebSocket integration for live data
   - Optimistic UI updates
   - Toast notifications for new events

3. **Customization**
   - User preferences for layout
   - Theme switching (light/dark/command center)
   - Configurable refresh intervals

4. **Advanced Filtering**
   - Multi-select filters
   - Search functionality
   - Date range for timeline
   - Agent performance metrics

---

## Support & Contribution

### Getting Help

- Check [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) for API integration
- See [MOCK_DATA.md](../MOCK_DATA.md) for data structure reference
- Review `.claude/agents/specs/ContentCreation.md` for agent details

### Contributing

When adding new components:
1. Follow existing patterns (props, styling, structure)
2. Add TypeScript types to `lib/mockData.ts`
3. Update this documentation
4. Add Storybook stories
5. Write unit tests

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-05
**Maintained By**: ContentCreation Agent (アヤ)
