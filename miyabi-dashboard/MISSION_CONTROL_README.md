# Mission Control Dashboard

## Overview

The Mission Control Dashboard is a real-time monitoring interface for the Miyabi AI Development Operations Platform. It provides operators with a comprehensive view of system status, agent activities, tmux sessions, and recent events.

## Features

### 1. Agent Board
- **Location**: Top-left panel
- **Purpose**: Display real-time status of all 21 Miyabi agents (7 Coding + 14 Business)
- **Features**:
  - Agent type classification (Coding / Business)
  - Real-time status indicators (Active / Idle / Offline)
  - Current task display
  - Task completion statistics

### 2. TMAXL Sessions View
- **Location**: Top-right panel
- **Purpose**: Monitor active tmux sessions for parallel agent execution
- **Features**:
  - Session name and attachment status
  - Window and pane counts
  - Creation timestamps
  - Quick identification of orchestra sessions

### 3. Timeline & Alerts
- **Location**: Bottom-left panel
- **Purpose**: Event stream with color-coded alerts
- **Features**:
  - Real-time event logging
  - Type-based color coding (Success / Info / Warning / Error)
  - Agent attribution
  - Timestamp display

### 4. Reference Hub
- **Location**: Bottom-right panel
- **Purpose**: Quick access to documentation and APIs
- **Features**:
  - Categorized references (Docs / Guides / APIs)
  - Icon-based visual identification
  - External link support

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data**: Mock data (ready for API integration)

## Component Structure

```
miyabi-dashboard/
├── app/
│   └── mission-control/
│       └── page.tsx                    # Main Mission Control page
├── components/
│   └── mission-control/
│       ├── AgentBoard.tsx              # Agent status display
│       ├── TmaxlView.tsx               # Tmux session view
│       ├── Timeline.tsx                # Event timeline
│       └── ReferenceHub.tsx            # Documentation hub
└── lib/
    └── mockData.ts                     # Mock data definitions
```

## Running Locally

```bash
cd miyabi-dashboard
npm install
npm run dev
```

Then navigate to: `http://localhost:3000/mission-control`

## Mock Data

Currently using mock data defined in `lib/mockData.ts`. The data structure is designed to be easily replaced with real API calls.

### Data Interfaces

```typescript
interface Agent {
  id: string;
  name: string;
  type: 'coding' | 'business';
  status: 'active' | 'idle' | 'offline';
  currentTask?: string;
  tasksCompleted: number;
}

interface TmuxSession {
  id: string;
  name: string;
  windows: number;
  panes: number;
  attached: boolean;
  created: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  agent?: string;
  message: string;
}

interface Reference {
  id: string;
  title: string;
  category: 'docs' | 'guide' | 'api';
  url: string;
}
```

## API Integration Points

### Recommended API Endpoints

1. **Agent Status**: `GET /api/agents`
2. **Tmux Sessions**: `GET /api/tmux/sessions`
3. **Timeline Events**: `GET /api/events` (or WebSocket for real-time)
4. **References**: `GET /api/references`

### Integration Strategy

**Option A: REST API**
```typescript
// Replace mock data with API calls
const agents = await fetch('/api/agents').then(r => r.json());
```

**Option B: GraphQL + Apollo**
```typescript
const { data } = useQuery(AGENTS_QUERY);
const agents = data?.agents || [];
```

**Option C: WebSocket (Real-time)**
```typescript
const ws = new WebSocket('ws://localhost:8080/events');
ws.onmessage = (event) => {
  const newEvent = JSON.parse(event.data);
  setTimelineEvents(prev => [newEvent, ...prev]);
};
```

## Styling & Theming

The dashboard uses a "command center" dark theme aesthetic:

- **Background**: Dark gray (#111827)
- **Panels**: White with shadow
- **Header**: Dark gray (#1F2937)
- **Status Indicators**: Color-coded (Green/Yellow/Red)

To customize, modify Tailwind classes in component files or update `tailwind.config.ts`.

## Future Enhancements

### Phase 2 (Post-Prototype)
- [ ] Real API integration
- [ ] WebSocket for real-time updates
- [ ] Agent detail modal on click
- [ ] Tmux session control (attach/detach)
- [ ] Timeline filtering and search
- [ ] Dark/light theme toggle
- [ ] Export timeline to file
- [ ] Mobile responsive optimization

### Phase 3 (Advanced Features)
- [ ] Storybook component documentation
- [ ] Unit tests (Jest + React Testing Library)
- [ ] E2E tests (Playwright)
- [ ] Performance monitoring
- [ ] User authentication
- [ ] Role-based access control

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Main Miyabi project documentation
- [Entity-Relation Model](../../docs/ENTITY_RELATION_MODEL.md) - System architecture
- [Agent Specifications](../../.claude/agents/specs/) - Agent details
- [MCP Integration Protocol](../../.claude/MCP_INTEGRATION_PROTOCOL.md) - MCP usage

## License

Same as Miyabi project

## Contributors

Generated by Miyabi CoordinatorAgent & Claude Code for Issue #758
