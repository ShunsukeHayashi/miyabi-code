# Miyabi Console Architecture

**Last Updated**: 2025-11-18
**Status**: ✅ Unified - miyabi-console is the official console

---

## 🎯 Overview

Miyabi Console (`crates/miyabi-console/`) is the **unified official console** for the Miyabi project.

**Previous State**: Multiple dashboard implementations existed (miyabi-web-ui, miyabi-dashboard, miyabi-web, miyabi-a2a/dashboard)
**Current State**: Consolidated into a single console - **miyabi-console**

---

## 📊 Miyabi Console - Official Unified Console

**Location**: `crates/miyabi-console/`
**URL**: http://localhost:5173
**Backend**: miyabi-web-api (Port 8080)
**Tech Stack**: React 19 + Vite 7 + Ant Design 5 + TypeScript
**Status**: ✅ **Production Ready** (v1.0.0)

### Purpose
- **統合開発コンソール** - All-in-one development and monitoring console
- Miyabi開発者・運用者向けの統合管理画面
- リアルタイム監視とデバッグツール

### Features (8 Pages)
```
├── Dashboard (/) - Overview metrics & system health
├── Agents (/agents) - DAG visualization, 5 Coding Agents
├── Issues (/issues) - GitHub Issues with 57-label filtering
├── PRs (/prs) - Pull Request management
├── Worktrees (/worktrees) - Real-time worktree monitoring
├── Deployments (/deployments) - Deployment history
├── Logs (/logs) - LDD logs viewer
└── CodeGen (/codegen) - Code generation interface
```

### Backend Integration
- **Rust/Axum** web framework (miyabi-web-api)
- **PostgreSQL 15** database
- **GitHub OAuth 2.0** authentication
- **WebSocket** real-time updates
- Full REST API at `http://localhost:8080/api/v1`

### Key Endpoints
```
/api/v1/agents          - Agent status & DAG
/api/v1/issues          - GitHub Issues
/api/v1/prs             - Pull Requests
/api/v1/worktrees       - Worktree status
/api/v1/deployments     - Deployment history
/api/v1/logs            - LDD logs
/api/v1/codegen         - Code generation
/api/v1/mission-control - Mission Control dashboard
/api/v1/preflight       - System health checks
/api/v1/timeline        - Timeline events
/api/v1/tmux            - tmux sessions
```

---

## 🗂️ Archived Consoles

These consoles have been archived and are no longer actively maintained:

### 1. miyabi-dashboard (Archived)
**Location**: `miyabi-dashboard/`
**Tech Stack**: Next.js 14 + Tailwind CSS + Storybook
**Status**: ⚠️ **Archived** - Functionality moved to miyabi-console

### 2. miyabi-web (Archived)
**Location**: `miyabi-web/`
**Tech Stack**: Next.js + Radix UI
**Status**: ⚠️ **Archived** - Superseded by miyabi-console

### 3. miyabi-a2a/dashboard (Specialized)
**Location**: `crates/miyabi-a2a/dashboard/`
**Tech Stack**: React 18 + HeroUI + Three.js + Cytoscape
**Status**: ✅ **Active** - Specialized A2A communication visualization tool

**Purpose**: A2A通信可視化専用ツール (continues as specialized tool)

---

## 🚀 Quick Start

### Start Backend (miyabi-web-api)
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# Start backend
cargo run -p miyabi-web-api --release
# → http://localhost:8080
```

### Start Frontend (miyabi-console)
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/crates/miyabi-console

npm install  # First time only
npm run dev
# → http://localhost:5173
```

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://miyabi_user:miyabi_password@localhost:5432/miyabi_db
JWT_SECRET=your_jwt_secret_here
GITHUB_TOKEN=your_github_token_here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:8080/api/v1/auth/github/callback
```

#### Frontend (.env in crates/miyabi-console/)
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/api/v1/ws
```

---

## 📋 Page Details

### 1. Dashboard (/)
- **System Health**: Overall status (Healthy/Degraded/Unhealthy)
- **Agent Summary**: Total, running, idle agents
- **tmux Summary**: Active sessions, windows, panes
- **Timeline**: Recent events, task status
- **Preflight Checks**: Environment validation

### 2. Agents (/agents)
- **DAG Visualization**: Agent dependency graph
- **5 Coding Agents**:
  - Coordinator Agent
  - CodeGen Agent
  - Review Agent
  - Deployment Agent
  - PR Agent
- **Status Monitoring**: Real-time agent status
- **Execution Control**: Start/stop agents

### 3. Issues (/issues)
- **GitHub Integration**: Direct GitHub API integration
- **57-Label System**: Comprehensive label filtering
- **Search & Filter**: Advanced filtering capabilities
- **Status Tracking**: Open, in-progress, closed

### 4. PRs (/prs)
- **Pull Request List**: All PRs with status
- **Review Status**: Pending, approved, changes requested
- **GitHub Integration**: Direct PR management

### 5. Worktrees (/worktrees)
- **Real-time Monitoring**: Git worktree status
- **Parallel Execution**: Track concurrent tasks
- **Branch Management**: Active branches and worktrees

### 6. Deployments (/deployments)
- **Deployment History**: All deployments with timestamps
- **Status Tracking**: Success, failed, in-progress
- **Rollback Support**: Deployment rollback capabilities

### 7. Logs (/logs)
- **LDD Logs**: Structured log viewer
- **Filtering**: By level, agent type, time range
- **Real-time Updates**: WebSocket-based live logs

### 8. CodeGen (/codegen)
- **Code Generation**: AI-powered code generation
- **Template Management**: Code templates
- **History**: Generation history and results

---

## 🔧 Development

### Technology Stack

**Frontend**:
- React 19.1.1
- Vite 7.1.7
- Ant Design 5.27.6
- React Router 7.9.4
- React Flow 11.11.4 (DAG visualization)
- Recharts 3.3.0 (Charts)
- Zustand 5.0.8 (State management)
- Axios 1.12.2 (HTTP client)

**Backend**:
- Rust 2021 Edition
- Axum 0.7 (Web framework)
- SQLx (PostgreSQL client)
- Tower (Middleware)
- Tokio (Async runtime)

### Build & Deploy

```bash
# Frontend build
cd crates/miyabi-console
npm run build
# Output: dist/

# Backend build
cargo build -p miyabi-web-api --release
# Output: target/release/miyabi-web-api
```

---

## 📚 Related Documentation

- **Backend API**: `crates/miyabi-web-api/README.md`
- **Architecture**: `docs/MIYABI_API_ARCHITECTURE_COMPLETE_REPORT.pdf`
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md`
- **Label System**: `docs/LABEL_SYSTEM_GUIDE.md`

---

## 🔄 Migration History

### 2025-11-18: Unified Console
- **Action**: Renamed `crates/miyabi-web-ui/` → `crates/miyabi-console/`
- **Version**: 0.0.0 → 1.0.0
- **Status**: Official unified console
- **Reason**: Consolidate multiple dashboard implementations
- **Archived**: miyabi-dashboard, miyabi-web (functionality merged)
- **Kept Active**: miyabi-a2a/dashboard (specialized tool)

### Previous State
- **4 Console Implementations**: miyabi-web-ui, miyabi-dashboard, miyabi-web, miyabi-a2a/dashboard
- **Issue**: Fragmented functionality, maintenance burden
- **Decision**: Adopt miyabi-web-ui as official console (most feature-complete)

---

## 🎯 Design Decisions

### Why miyabi-web-ui (now miyabi-console)?

**Reasons for Selection**:
1. ✅ **8 Pages Implemented** - Most complete feature set
2. ✅ **Backend Integration** - Full miyabi-web-api integration
3. ✅ **Production Ready** - Already stable and tested
4. ✅ **Real-time Updates** - WebSocket integration
5. ✅ **Comprehensive UI** - Ant Design components

**Alternatives Considered**:
- miyabi-dashboard: Next.js based, but only 1 page implemented
- miyabi-web: Purpose unclear, limited functionality
- New implementation: Would take 2-4 weeks, unnecessary

---

**Maintainers**: Miyabi Team
**Last Review**: 2025-11-18
**Next Review**: 2025-12-01
