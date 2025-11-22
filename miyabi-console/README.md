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

## Production Deployment

### Live URLs

| Environment | URL |
|-------------|-----|
| API | `http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com` |
| WebSocket | `ws://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/ws` |
| Frontend | S3 bucket `miyabi-web-dev-211234825975` |

### AWS Infrastructure

- **Region**: us-west-2 (Oregon)
- **ECS Cluster**: `miyabi-cluster-dev`
- **ECS Service**: `miyabi-service-dev` (2 tasks)
- **ALB**: `miyabi-alb-dev`
- **Redis**: `miyabi-cache-dev`

### Deployment Commands

```bash
# Build frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://miyabi-web-dev-211234825975 --delete

# Restart backend service
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment
```

### Documentation

- [Infrastructure Runbook](docs/INFRASTRUCTURE_RUNBOOK.md) - AWS resources & operations
- [API Documentation](docs/API_DOCUMENTATION.md) - All endpoints & WebSocket events
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues & solutions

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_APP_NAME=Miyabi Console
VITE_APP_VERSION=0.1.0
```

For production (`.env.production`):

```env
VITE_API_BASE_URL=http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com
VITE_WS_URL=ws://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/ws
VITE_AUTH_URL=http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com
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

## Testing

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Current Status**: 104 tests passing

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

**Test Coverage**:
- Authentication flows
- Real-time WebSocket updates
- Dashboard analytics
- Agent management
- Database operations
- Deployment pipelines

**Browser Support**:
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Chrome (Mobile - Pixel 5)
- Safari (Mobile - iPhone 12)

## Implementation Status

✅ **Milestone 1 Completed**:

**Phase 1 - Foundation (Issues #1009, #1010, #1011, #1012, #1013)**:
- [x] Project setup with Vite + React + TypeScript
- [x] HeroUI + Tailwind configuration
- [x] Basic routing structure
- [x] All page components (Dashboard, Agents, Database, Deployment, Infrastructure)
- [x] API client with mock data support
- [x] GitHub OAuth authentication
- [x] WebSocket real-time updates
- [x] Responsive design
- [x] Loading states and error handling

**Phase 2 - API Integration (Issues #1014, #1015, #1016, #1017, #1018, #1019, #1020, #1021, #1022, #1023)**:
- [x] Agents API integration
- [x] Database API integration
- [x] Deployment API integration
- [x] Infrastructure API integration
- [x] Activity API integration
- [x] Auth flow with GitHub OAuth
- [x] WebSocket context with auto-reconnection

**Phase 3 - Testing (Issues #1027, #1028, #1046, #1047)**:
- [x] Unit tests (104 tests)
- [x] Integration tests
- [x] E2E tests with Playwright
- [x] Cross-browser testing
- [x] Mobile testing

**Phase 4 - Deployment (Issues #1024, #1025)**:
- [x] AWS infrastructure (ECS, ALB, S3, Redis)
- [x] Frontend deployed to S3
- [x] Backend deployed to ECS
- [x] Production environment variables
- [x] Documentation (API, Runbook, Troubleshooting)

## Future Enhancements

- [ ] SSL/TLS with ACM certificates
- [ ] CloudFront CDN distribution
- [ ] Custom domain setup
- [ ] CI/CD pipeline with GitHub Actions
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
