# Miyabi WebUI

🌸 **Modern Web UI for Miyabi - Autonomous AI Development Platform**

## Tech Stack

### Frontend
- **React 18** + **TypeScript 5**
- **Vite 5** - Lightning-fast build tool
- **Ant Design 5** - Enterprise-grade UI components
- **React Router 6** - Client-side routing
- **React Flow 11** - Interactive DAG visualization
- **TanStack Query** - Server state management
- **Axios** - HTTP client for API communication

### Backend (crates/miyabi-web-api)
- **Rust** + **Axum 0.7** - High-performance web framework
- **SQLx 0.8** - Async SQL toolkit
- **Tower-HTTP** - CORS support
- **JWT** - Authentication

## Project Structure

```
crates/
├── miyabi-web-api/          # Backend (Rust/Axum)
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── routes/          # API routes
│   │   │   ├── agents.rs
│   │   │   ├── issues.rs
│   │   │   ├── tasks.rs
│   │   │   └── ...
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   └── auth/            # JWT authentication
│   └── Cargo.toml
│
└── miyabi-web-ui/           # Frontend (React/TypeScript)
    ├── src/
    │   ├── App.tsx          # Root component + routing
    │   ├── main.tsx         # Entry point
    │   ├── pages/           # Page components
    │   │   ├── Dashboard.tsx       # Dashboard page
    │   │   ├── AgentsPage.tsx      # Agent orchestration + DAG
    │   │   ├── IssuesPage.tsx      # Issue management
    │   │   └── PRsPage.tsx         # Pull Request management
    │   ├── api/             # API client
    │   │   └── client.ts           # Axios client + types
    │   ├── hooks/           # Custom React hooks
    │   │   ├── useAgents.ts        # TanStack Query hook
    │   │   ├── useIssues.ts        # TanStack Query hook
    │   │   └── usePRs.ts           # TanStack Query hook
    │   ├── constants/       # Constants
    │   │   └── labels.ts           # 53 label definitions
    │   └── index.css        # Global styles
    └── package.json
```

## Quick Start

### 1. Backend (Rust API Server)

```bash
# From project root
cd /path/to/miyabi-private

# Build backend
cargo build --package miyabi-web-api

# Run backend on http://localhost:3001
cargo run --package miyabi-web-api
```

### 2. Frontend (React App)

```bash
# From project root
cd crates/miyabi-web-ui

# Install dependencies (first time only)
npm install

# Run development server on http://localhost:5173
npm run dev
```

### 3. Open Browser

Visit: **http://localhost:5173**

## API Endpoints

All endpoints are available at `http://localhost:3001`

### Health Check
```bash
GET /health
# Response: { "status": "ok", "version": "0.1.0" }
```

### Agents
```bash
GET  /api/agents                    # List all agents with status
# Response: { "agents": [...] }

GET  /api/agents/:type              # Get specific agent status
POST /api/agents/:type/execute      # Execute agent with params
# Body: { "issue_number": 123, "task_id": "T1" }
```

### Issues ✅ Implemented
```bash
GET /api/issues                     # List all issues
# Response: { "issues": [...], "total": 5 }
# Includes: labels, assignees, timestamps, state
```

### Pull Requests ✅ Implemented
```bash
GET /api/prs                        # List all PRs
# Response: { "prs": [...], "total": 4 }
# Includes: commits, additions, deletions, branches, merge status
```

### Tasks (Coming Soon)
```bash
GET /api/tasks                      # List tasks
```

### Worktrees (Coming Soon)
```bash
GET /api/worktrees                  # List worktrees
```

### Deployments (Coming Soon)
```bash
GET /api/deployments                # List deployments
```

### Logs (Coming Soon)
```bash
GET /api/logs                       # List LDD logs
```

## Development

### Frontend Development

```bash
cd crates/miyabi-web-ui

# Install dependencies
npm install

# Start dev server (hot reload enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
# From project root

# Build backend
cargo build --package miyabi-web-api

# Run backend
cargo run --package miyabi-web-api

# Run with logs
RUST_LOG=debug cargo run --package miyabi-web-api

# Build release
cargo build --release --package miyabi-web-api
```

## Features

### ✅ Implemented

**Dashboard** (/)
- Overview metrics (Open Issues, Running Agents, Merged PRs)
- Real-time agent status
- Quick navigation to all pages

**Agent Orchestration** (/agents)
- Interactive DAG visualization with React Flow
- Issue → Tasks → Review → PR workflow
- Agent execution controls
- Real-time agent status monitoring
- 5 Coding Agents: Coordinator, CodeGen, Review, PR, Deployment

**Issue Management** (/issues)
- 5 sample issues with full metadata
- 53-label filtering system across 11 categories
- Search by title, number, or content
- State filtering (All/Open/Closed)
- Quick filters for common scenarios
- Statistics dashboard

**Pull Request Management** (/prs)
- PR listing with full details
- Code change visualization (+additions/-deletions)
- State filtering (Open/Merged/Draft)
- Branch information display
- Author tracking
- Statistics dashboard

### 🚧 Coming Soon

- [ ] Real-time updates via WebSocket
- [ ] Worktree Manager
- [ ] Deployment Dashboard
- [ ] LDD Logs Viewer
- [ ] Quality Reports integration
- [ ] GitHub integration (live data)

## UI Screenshots

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png) *(coming soon)*

### Agent Orchestration
![Agents](./docs/screenshots/agents.png) *(coming soon)*

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

Apache-2.0

---

**Built with ❤️ by Miyabi Team**
🌸 Miyabi - Complete Autonomous AI Development Platform
