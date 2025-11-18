# Miyabi Console

Production web console for managing Miyabi agents, tasks, and system monitoring.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: HeroUI (React)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router v6
- **HTTP Client**: Axios

## Features

### Agents Page (`/agents`)

Comprehensive agent management interface with the following capabilities:

- ✅ **Layer-based Organization**: Agents grouped by hierarchy layers (Layer 0-4)
- ✅ **Real-time Status Monitoring**: Live status updates every 5 seconds
- ✅ **Agent Cards**: Display uptime, task counts, and current status
- ✅ **Agent Details Modal**: Comprehensive agent information with tabs:
  - Overview: Basic info and task statistics
  - Metrics: Performance visualization with charts
  - Configuration: Agent settings
  - Logs: Real-time log viewer
  - Controls: Start/Stop agent functionality
- ✅ **Statistics Dashboard**: Total agents, active, idle, and error counts
- ✅ **Responsive Design**: Works on mobile and desktop
- ✅ **Mock Data Support**: Development mode with realistic mock data

## Project Structure

```
miyabi-console/
├── src/
│   ├── components/
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx          # Individual agent card
│   │   │   ├── AgentControls.tsx      # Start/Stop controls
│   │   │   ├── AgentDetailModal.tsx   # Detailed agent modal
│   │   │   ├── AgentMetricsChart.tsx  # Performance charts
│   │   │   └── LayerSection.tsx       # Layer-grouped agents
│   │   └── Layout.tsx                 # Main layout with navigation
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts              # API client with mock support
│   │   └── mockData.ts                # Mock agent data
│   ├── pages/
│   │   ├── AgentsPage.tsx             # Main agents page
│   │   └── DashboardPage.tsx          # Dashboard placeholder
│   ├── types/
│   │   └── agent.ts                   # TypeScript type definitions
│   ├── App.tsx                        # App component with routing
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── .env                               # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

**Note**: In development mode, the app uses mock data. No backend API is required.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_NAME=Miyabi Console
VITE_APP_VERSION=0.1.0
```

## API Integration

The application expects the following API endpoints:

### Agent Endpoints

- `GET /api/v1/agents` - Fetch all agents
- `GET /api/v1/agents/:id` - Get agent details
- `POST /api/v1/agents/:id/configure` - Update agent configuration
- `POST /api/v1/agents/:id/start` - Start agent
- `POST /api/v1/agents/:id/stop` - Stop agent
- `GET /api/v1/agents/:id/metrics` - Get agent performance metrics
- `GET /api/v1/agents/:id/logs` - Get agent logs

### Agent Type Definition

```typescript
interface Agent {
  id: string;
  name: string;
  layer: number; // 0-4
  status: 'active' | 'idle' | 'error' | 'offline';
  uptime: number; // in seconds
  tasks: {
    active: number;
    completed: number;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    taskCompletionRate: number;
    averageTaskDuration: number;
  };
  config: {
    maxConcurrentTasks: number;
    timeoutSeconds: number;
    retryAttempts: number;
    enableLogging: boolean;
  };
}
```

## Development Mode

In development, the app uses mock data defined in `src/lib/mockData.ts`. This includes:

- 7 sample agents across layers 2-4
- Realistic metrics and status indicators
- Mock API responses with simulated network delays

To switch to real API in development, modify `src/lib/api/client.ts`:

```typescript
const USE_MOCK_DATA = false; // Change to false
```

## Implementation Status

✅ **Completed (Issue #1009)**:
- [x] Project setup with Vite + React + TypeScript
- [x] HeroUI + Tailwind configuration
- [x] Basic routing structure
- [x] AgentsPage with layer-based organization
- [x] AgentCard, LayerSection, AgentDetailModal components
- [x] API client with mock data support
- [x] Real-time status polling (5s interval)
- [x] Performance metrics visualization
- [x] Agent controls (Start/Stop)
- [x] Log viewer
- [x] Responsive design
- [x] Loading states and error handling

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced filtering and sorting
- [ ] Agent search functionality
- [ ] Bulk operations
- [ ] Export metrics to CSV
- [ ] Custom dashboard widgets
- [ ] Alert notifications
- [ ] Agent performance comparison

## Related Issues

- Issue #1009: [Miyabi Console] Implement Agents Page - Agent Management & Configuration

## License

Private - Miyabi Project

## Contributing

This is a private project. For questions or contributions, contact the Miyabi team.
