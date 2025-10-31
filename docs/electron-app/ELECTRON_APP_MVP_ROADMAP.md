# Miyabi Desktop - MVP Development Roadmap

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Timeline**: 8 weeks
**Status**: 📋 Planning Phase

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Sprint Structure](#sprint-structure)
3. [Week-by-Week Plan](#week-by-week-plan)
4. [Task Dependencies (DAG)](#task-dependencies-dag)
5. [Resource Allocation](#resource-allocation)
6. [Milestone Definitions](#milestone-definitions)
7. [Risk Mitigation](#risk-mitigation)
8. [Success Criteria](#success-criteria)

---

## Overview

### 🎯 MVP Goals

**Primary Goal**: Ship a functional Electron desktop app that allows developers to:
1. Manage Miyabi projects visually
2. Monitor agent executions in real-time
3. Visualize worktrees and task dependencies
4. Browse task history
5. Manage GitHub Issues

**Out of Scope (MVP)**:
- Monaco Editor integration (Phase 2)
- Integrated Terminal (Phase 2)
- Git visualization (Phase 2)
- Agent configuration UI (Phase 2)
- Multi-window support (Phase 2)
- Team features (Phase 4+)

---

### 📊 MVP Feature Checklist

| Feature ID | Feature Name | Priority | Complexity | Week | Status |
|------------|--------------|----------|------------|------|--------|
| F-1 | Project Management | 🔴 High | Low | 1-2 | ⚪ Not Started |
| F-2 | Worktree Visualization | 🔴 High | Medium | 3 | ⚪ Not Started |
| F-3 | Agent Execution Monitoring | 🔴 High | High | 4 | ⚪ Not Started |
| F-4 | Issue Management | 🔴 High | Medium | 5 | ⚪ Not Started |
| F-5 | Task History Browser | 🔴 High | Medium | 6 | ⚪ Not Started |
| F-6 | System Health Dashboard | 🔴 High | Low | 6 | ⚪ Not Started |
| F-11 | Native Notifications | 🟡 Medium | Low | 7 | ⚪ Not Started |
| - | Testing & QA | 🔴 High | High | 7-8 | ⚪ Not Started |
| - | Build & Distribution | 🔴 High | Medium | 8 | ⚪ Not Started |

---

### 👥 Team Structure

**Recommended Team Size**: 2-3 developers

| Role | Responsibilities | Time Allocation |
|------|------------------|-----------------|
| **Lead Developer** | Architecture, Electron main process, IPC, CI/CD | 100% (8 weeks) |
| **Frontend Developer** | React components, UI/UX, dashboard integration | 100% (8 weeks) |
| **QA Engineer** | Testing, bug fixing, documentation | 50% (4 weeks) |

**Solo Developer Path**: Possible but challenging (12-16 weeks timeline)

---

## Sprint Structure

### 🏃 Sprint Overview

**Sprint Duration**: 1 week
**Total Sprints**: 8
**Sprint Ceremonies**:
- **Planning** (Monday 9am): Review goals, assign tasks
- **Daily Standup** (Every day 9:30am): 15-minute sync
- **Review** (Friday 4pm): Demo completed features
- **Retrospective** (Friday 4:30pm): What went well, what to improve

---

### 📅 Sprint Calendar

| Sprint | Dates | Theme | Key Deliverables |
|--------|-------|-------|------------------|
| **Sprint 0** | Pre-start (1 week before) | Preparation | Requirements finalized, team onboarded |
| **Sprint 1** | Week 1 | Foundation | Electron boilerplate, IPC, menu bar |
| **Sprint 2** | Week 2 | Dashboard Integration | React dashboard integrated, data flow working |
| **Sprint 3** | Week 3 | Worktree Visualization | Worktree viewer, status tracking |
| **Sprint 4** | Week 4 | Agent Monitoring | Real-time agent logs, WebSocket integration |
| **Sprint 5** | Week 5 | Issue Management | GitHub API, Issue list, create/view |
| **Sprint 6** | Week 6 | History & Health | Task history browser, system health dashboard |
| **Sprint 7** | Week 7 | Polish & Notifications | Native notifications, bug fixes, UX polish |
| **Sprint 8** | Week 8 | Release Prep | Build pipeline, code signing, documentation, launch |

---

## Week-by-Week Plan

---

## 🗓️ Sprint 0: Pre-Start Preparation (Week -1)

**Goal**: Ensure team is ready to hit the ground running

### Tasks

| Task ID | Task Name | Owner | Hours | Status |
|---------|-----------|-------|-------|--------|
| S0-T1 | Finalize MVP requirements | Lead Dev | 4h | ⚪ Not Started |
| S0-T2 | Setup development environment (Node.js, Electron, VS Code) | All | 2h | ⚪ Not Started |
| S0-T3 | Clone Miyabi repo, build Rust backend | All | 2h | ⚪ Not Started |
| S0-T4 | Review existing dashboard code | Frontend Dev | 4h | ⚪ Not Started |
| S0-T5 | Create GitHub project board | Lead Dev | 1h | ⚪ Not Started |
| S0-T6 | Setup Slack/Discord channel for team communication | Lead Dev | 1h | ⚪ Not Started |
| S0-T7 | Review Electron best practices (security, performance) | All | 4h | ⚪ Not Started |

**Total Hours**: 18 hours
**Deliverables**: ✅ Team ready, environment setup, project board created

---

## 🗓️ Sprint 1: Foundation (Week 1)

**Goal**: Setup Electron project structure, IPC, and basic window management

### Day 1: Project Initialization

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S1-D1-T1 | Initialize npm project, install Electron + Vite | Lead Dev | 1h | - |
| S1-D1-T2 | Setup TypeScript config (strict mode) | Lead Dev | 1h | S1-D1-T1 |
| S1-D1-T3 | Create directory structure (main, renderer, preload) | Lead Dev | 1h | S1-D1-T1 |
| S1-D1-T4 | Setup Vite config (main + renderer build) | Lead Dev | 2h | S1-D1-T2 |
| S1-D1-T5 | Create Electron main process entry point | Lead Dev | 2h | S1-D1-T4 |
| S1-D1-T6 | Verify hot reload works (HMR) | Lead Dev | 1h | S1-D1-T5 |

**Day Total**: 8 hours

---

### Day 2: IPC & Preload Script

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S1-D2-T1 | Create preload script (expose safe APIs) | Lead Dev | 2h | S1-D1-T5 |
| S1-D2-T2 | Define IPC channels (types in TypeScript) | Lead Dev | 2h | S1-D2-T1 |
| S1-D2-T3 | Implement IPC handlers in main process | Lead Dev | 3h | S1-D2-T2 |
| S1-D2-T4 | Create `useIPC` React hook | Frontend Dev | 2h | S1-D2-T2 |
| S1-D2-T5 | Test bidirectional IPC (renderer ↔ main) | Lead Dev | 1h | S1-D2-T4 |

**Day Total**: 10 hours

---

### Day 3-4: Dashboard Integration

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S1-D3-T1 | Copy React components from `miyabi-a2a/dashboard/` | Frontend Dev | 2h | - |
| S1-D3-T2 | Install dependencies (React, TailwindCSS, HeroUI, etc.) | Frontend Dev | 1h | S1-D3-T1 |
| S1-D3-T3 | Setup Tailwind CSS config | Frontend Dev | 1h | S1-D3-T2 |
| S1-D3-T4 | Create renderer entry point (index.tsx) | Frontend Dev | 2h | S1-D3-T3 |
| S1-D3-T5 | Replace `fetch` calls with IPC calls | Frontend Dev | 4h | S1-D2-T4 |
| S1-D3-T6 | Verify components render correctly | Frontend Dev | 2h | S1-D3-T5 |
| S1-D3-T7 | Setup React Router (if multi-page) | Frontend Dev | 2h | S1-D3-T6 |

**Day Total**: 14 hours

---

### Day 5: Native Menu & Window Management

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S1-D5-T1 | Create native menu bar (macOS style) | Lead Dev | 3h | S1-D1-T5 |
| S1-D5-T2 | Implement menu actions (Open Project, Settings, etc.) | Lead Dev | 2h | S1-D5-T1 |
| S1-D5-T3 | Create WindowManager class | Lead Dev | 2h | S1-D1-T5 |
| S1-D5-T4 | Persist window state (position, size) to localStorage | Lead Dev | 2h | S1-D5-T3 |
| S1-D5-T5 | Handle macOS-specific events (close, minimize, zoom) | Lead Dev | 1h | S1-D5-T3 |

**Day Total**: 10 hours

---

### Sprint 1 Summary

**Total Hours**: 42 hours
**Deliverables**:
- ✅ Electron project structure
- ✅ IPC working (renderer ↔ main)
- ✅ React dashboard integrated
- ✅ Native menu bar
- ✅ Window management (basic)

**Demo**: Open app, click menu items, send IPC message, see response in UI

---

## 🗓️ Sprint 2: Dashboard Integration & Data Flow (Week 2)

**Goal**: Connect UI to Miyabi backend (Web API, CLI, file system)

### Day 1: File Watcher

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S2-D1-T1 | Install `chokidar` for file watching | Lead Dev | 0.5h | - |
| S2-D1-T2 | Create FileWatcher class | Lead Dev | 2h | S2-D1-T1 |
| S2-D1-T3 | Watch `.ai/worktrees/` directory | Lead Dev | 1h | S2-D1-T2 |
| S2-D1-T4 | Watch `.ai/logs/` directory | Lead Dev | 1h | S2-D1-T2 |
| S2-D1-T5 | Emit IPC events on file changes | Lead Dev | 2h | S2-D1-T4 |
| S2-D1-T6 | Test file watcher (create/modify/delete files) | Lead Dev | 1.5h | S2-D1-T5 |

**Day Total**: 8 hours

---

### Day 2: CLI Executor

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S2-D2-T1 | Create CLIExecutor class (spawn miyabi commands) | Lead Dev | 2h | - |
| S2-D2-T2 | Implement `miyabi work-on` execution | Lead Dev | 2h | S2-D2-T1 |
| S2-D2-T3 | Stream stdout/stderr to renderer via IPC | Lead Dev | 3h | S2-D2-T2 |
| S2-D2-T4 | Handle process exit codes, errors | Lead Dev | 2h | S2-D2-T3 |
| S2-D2-T5 | Test CLI execution (run `miyabi status`) | Lead Dev | 1h | S2-D2-T4 |

**Day Total**: 10 hours

---

### Day 3: Project Management (F-1)

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S2-D3-T1 | Create ProjectStore (Zustand) | Frontend Dev | 2h | - |
| S2-D3-T2 | Implement "Open Project" dialog (native file picker) | Lead Dev | 2h | S1-D5-T2 |
| S2-D3-T3 | Validate `.miyabi.yml` exists in selected directory | Lead Dev | 1h | S2-D3-T2 |
| S2-D3-T4 | Parse `.miyabi.yml` and store project metadata | Lead Dev | 2h | S2-D3-T3 |
| S2-D3-T5 | Display project name in title bar | Frontend Dev | 1h | S2-D3-T4 |
| S2-D3-T6 | Recent projects list (store in `~/.config/`) | Lead Dev | 2h | S2-D3-T4 |

**Day Total**: 10 hours

---

### Day 4: Miyabi Web API Integration

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S2-D4-T1 | Create MiyabiAPIClient class | Frontend Dev | 2h | - |
| S2-D4-T2 | Implement `getSystemStatus()` method | Frontend Dev | 1h | S2-D4-T1 |
| S2-D4-T3 | Implement `getWorktrees()` method | Frontend Dev | 1h | S2-D4-T1 |
| S2-D4-T4 | Setup TanStack Query for data fetching | Frontend Dev | 2h | S2-D4-T3 |
| S2-D4-T5 | Test API client (mock server if needed) | Frontend Dev | 2h | S2-D4-T4 |
| S2-D4-T6 | Handle API errors (network, 404, 500) | Frontend Dev | 2h | S2-D4-T5 |

**Day Total**: 10 hours

---

### Day 5: WebSocket Integration

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S2-D5-T1 | Create WebSocketClient class | Frontend Dev | 2h | - |
| S2-D5-T2 | Connect to `ws://localhost:8080/ws` | Frontend Dev | 1h | S2-D5-T1 |
| S2-D5-T3 | Handle WebSocket messages (agent-log, agent-progress) | Frontend Dev | 2h | S2-D5-T2 |
| S2-D5-T4 | Auto-reconnect on disconnect | Frontend Dev | 2h | S2-D5-T3 |
| S2-D5-T5 | Update UI on WebSocket events | Frontend Dev | 2h | S2-D5-T4 |
| S2-D5-T6 | Test WebSocket (simulate server messages) | Frontend Dev | 1h | S2-D5-T5 |

**Day Total**: 10 hours

---

### Sprint 2 Summary

**Total Hours**: 48 hours
**Deliverables**:
- ✅ File watcher for `.ai/` directories
- ✅ CLI executor (spawn miyabi commands)
- ✅ Project management (F-1): Open, validate, recent projects
- ✅ Miyabi Web API client
- ✅ WebSocket real-time updates

**Demo**: Open project, see project name in title bar, list recent projects, test API call

---

## 🗓️ Sprint 3: Worktree Visualization (Week 3)

**Goal**: Implement F-2 (Worktree Visualization)

### Day 1: Worktree Data Fetching

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S3-D1-T1 | Create WorktreeStore (Zustand) | Frontend Dev | 2h | - |
| S3-D1-T2 | Implement `getWorktrees()` IPC handler | Lead Dev | 2h | S2-D1-T5 |
| S3-D1-T3 | Read worktree metadata from `.ai/worktrees/*.json` | Lead Dev | 2h | S3-D1-T2 |
| S3-D1-T4 | Parse JSON and return WorktreeMetadata[] | Lead Dev | 2h | S3-D1-T3 |
| S3-D1-T5 | Create `useWorktrees` hook (TanStack Query) | Frontend Dev | 2h | S3-D1-T4 |

**Day Total**: 10 hours

---

### Day 2-3: Worktree UI Components

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S3-D2-T1 | Create WorktreeCard component | Frontend Dev | 3h | S3-D1-T5 |
| S3-D2-T2 | Add status badges (🟢 Active, 🟡 Paused, 🔴 Error) | Frontend Dev | 2h | S3-D2-T1 |
| S3-D2-T3 | Add progress bar component | Frontend Dev | 2h | S3-D2-T1 |
| S3-D2-T4 | Create WorktreeList component | Frontend Dev | 2h | S3-D2-T2 |
| S3-D2-T5 | Add worktree context menu (right-click) | Frontend Dev | 3h | S3-D2-T4 |
| S3-D2-T6 | Implement "Delete Worktree" action | Lead Dev | 2h | S3-D2-T5 |
| S3-D2-T7 | Add loading states, empty states | Frontend Dev | 2h | S3-D2-T4 |

**Day Total**: 16 hours

---

### Day 4: Worktree Actions

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S3-D4-T1 | Implement "Open in File System" (reveal in Finder) | Lead Dev | 2h | S3-D2-T5 |
| S3-D4-T2 | Implement "Copy Worktree Path" | Frontend Dev | 1h | S3-D2-T5 |
| S3-D4-T3 | Implement "Show Logs" (navigate to logs view) | Frontend Dev | 2h | S3-D2-T5 |
| S3-D4-T4 | Add search/filter worktrees by status, branch | Frontend Dev | 3h | S3-D2-T4 |

**Day Total**: 8 hours

---

### Day 5: Testing & Polish

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S3-D5-T1 | Write unit tests for WorktreeCard | Frontend Dev | 2h | S3-D2-T1 |
| S3-D5-T2 | Write integration tests for worktree list | Frontend Dev | 2h | S3-D2-T4 |
| S3-D5-T3 | Test with 10+ worktrees (performance) | Frontend Dev | 2h | S3-D2-T4 |
| S3-D5-T4 | Fix UI bugs (spacing, alignment) | Frontend Dev | 2h | S3-D2-T7 |

**Day Total**: 8 hours

---

### Sprint 3 Summary

**Total Hours**: 42 hours
**Deliverables**:
- ✅ F-2 (Worktree Visualization) complete
- ✅ Worktree list with status, progress, actions
- ✅ Context menu, delete worktree
- ✅ Search/filter worktrees

**Demo**: Open project with active worktrees, view list, right-click actions, delete worktree

---

## 🗓️ Sprint 4: Agent Execution Monitoring (Week 4)

**Goal**: Implement F-3 (Agent Execution Monitoring)

### Day 1: Agent Data Fetching

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S4-D1-T1 | Create AgentStore (Zustand) | Frontend Dev | 2h | - |
| S4-D1-T2 | Implement `getRunningAgents()` IPC handler | Lead Dev | 2h | S2-D1-T5 |
| S4-D1-T3 | Read agent metadata from `.ai/agents/*.json` | Lead Dev | 2h | S4-D1-T2 |
| S4-D1-T4 | Create `useAgents` hook (TanStack Query) | Frontend Dev | 2h | S4-D1-T3 |
| S4-D1-T5 | Subscribe to WebSocket for agent updates | Frontend Dev | 2h | S2-D5-T4 |

**Day Total**: 10 hours

---

### Day 2-3: Agent Monitor UI

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S4-D2-T1 | Create AgentProgressCard component | Frontend Dev | 3h | S4-D1-T4 |
| S4-D2-T2 | Add progress bar, step indicator | Frontend Dev | 2h | S4-D2-T1 |
| S4-D2-T3 | Create log viewer component (scrollable terminal) | Frontend Dev | 4h | S4-D2-T1 |
| S4-D2-T4 | Style logs (ANSI colors, timestamps) | Frontend Dev | 2h | S4-D2-T3 |
| S4-D2-T5 | Create AgentList component | Frontend Dev | 2h | S4-D2-T1 |
| S4-D2-T6 | Add loading, empty states | Frontend Dev | 2h | S4-D2-T5 |

**Day Total**: 15 hours

---

### Day 3: Agent Actions (Pause, Cancel)

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S4-D3-T1 | Implement "Pause Agent" IPC handler | Lead Dev | 2h | S2-D2-T1 |
| S4-D3-T2 | Implement "Cancel Agent" IPC handler | Lead Dev | 2h | S2-D2-T1 |
| S4-D3-T3 | Add Pause/Cancel buttons to AgentProgressCard | Frontend Dev | 2h | S4-D2-T1 |
| S4-D3-T4 | Handle agent completion (success, failure) | Frontend Dev | 2h | S2-D5-T5 |
| S4-D3-T5 | Show final result badge (✅ ❌ ⚠️) | Frontend Dev | 1h | S4-D3-T4 |

**Day Total**: 9 hours

---

### Day 4: Log Streaming

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S4-D4-T1 | Tail agent logs from `.ai/logs/*.log` | Lead Dev | 3h | S2-D1-T4 |
| S4-D4-T2 | Stream log updates via IPC | Lead Dev | 2h | S4-D4-T1 |
| S4-D4-T3 | Append logs to log viewer in real-time | Frontend Dev | 2h | S4-D2-T3 |
| S4-D4-T4 | Add auto-scroll to bottom (with manual scroll override) | Frontend Dev | 2h | S4-D4-T3 |

**Day Total**: 9 hours

---

### Day 5: Testing & Polish

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S4-D5-T1 | Write unit tests for AgentProgressCard | Frontend Dev | 2h | S4-D2-T1 |
| S4-D5-T2 | Test pause/cancel actions | QA Engineer | 2h | S4-D3-T3 |
| S4-D5-T3 | Test with long-running agent (30+ min) | QA Engineer | 3h | S4-D4-T4 |
| S4-D5-T4 | Fix bugs (log overflow, scroll issues) | Frontend Dev | 2h | S4-D4-T4 |

**Day Total**: 9 hours

---

### Sprint 4 Summary

**Total Hours**: 52 hours
**Deliverables**:
- ✅ F-3 (Agent Execution Monitoring) complete
- ✅ Real-time agent logs
- ✅ Progress indicators
- ✅ Pause/Cancel actions
- ✅ Agent completion status

**Demo**: Start agent (via CLI), see in agent monitor, view logs streaming, pause/cancel agent

---

## 🗓️ Sprint 5: Issue Management (Week 5)

**Goal**: Implement F-4 (Issue Management)

### Day 1: GitHub API Integration

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S5-D1-T1 | Install Octokit (GitHub API client) | Lead Dev | 0.5h | - |
| S5-D1-T2 | Create GitHubAPIClient class | Lead Dev | 2h | S5-D1-T1 |
| S5-D1-T3 | Implement `fetchIssues()` method (GraphQL) | Lead Dev | 3h | S5-D1-T2 |
| S5-D1-T4 | Handle GitHub authentication (personal access token) | Lead Dev | 2h | S5-D1-T2 |
| S5-D1-T5 | Test API calls (fetch 100 issues) | Lead Dev | 1.5h | S5-D1-T4 |

**Day Total**: 9 hours

---

### Day 2: Issue Caching (SQLite)

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S5-D2-T1 | Install `better-sqlite3` | Lead Dev | 0.5h | - |
| S5-D2-T2 | Create SQLite database schema (issues table) | Lead Dev | 2h | S5-D2-T1 |
| S5-D2-T3 | Implement `cacheIssues()` method | Lead Dev | 2h | S5-D2-T2 |
| S5-D2-T4 | Implement `getIssuesFromCache()` method | Lead Dev | 2h | S5-D2-T3 |
| S5-D2-T5 | Implement sync logic (fetch from GitHub, cache locally) | Lead Dev | 3h | S5-D2-T4 |

**Day Total**: 9.5 hours

---

### Day 3: Issue List UI

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S5-D3-T1 | Create IssueStore (Zustand) | Frontend Dev | 2h | - |
| S5-D3-T2 | Create IssueCard component | Frontend Dev | 3h | S5-D3-T1 |
| S5-D3-T3 | Create IssueList component | Frontend Dev | 2h | S5-D3-T2 |
| S5-D3-T4 | Add issue labels, state badges | Frontend Dev | 2h | S5-D3-T2 |
| S5-D3-T5 | Add loading, empty states | Frontend Dev | 1h | S5-D3-T3 |

**Day Total**: 10 hours

---

### Day 4: Issue Actions

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S5-D4-T1 | Implement "Assign to Agent" action | Lead Dev | 3h | S2-D2-T2 |
| S5-D4-T2 | Implement "View on GitHub" (open in browser) | Frontend Dev | 1h | S5-D3-T2 |
| S5-D4-T3 | Implement "Copy Issue URL" | Frontend Dev | 1h | S5-D3-T2 |
| S5-D4-T4 | Add issue context menu | Frontend Dev | 2h | S5-D3-T2 |
| S5-D4-T5 | Implement "Create New Issue" dialog | Frontend Dev | 3h | S5-D1-T3 |

**Day Total**: 10 hours

---

### Day 5: Issue Filters & Search

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S5-D5-T1 | Add filter by label (dropdown) | Frontend Dev | 2h | S5-D3-T3 |
| S5-D5-T2 | Add filter by state (open/closed) | Frontend Dev | 1h | S5-D3-T3 |
| S5-D5-T3 | Add filter by assignee | Frontend Dev | 2h | S5-D3-T3 |
| S5-D5-T4 | Implement search (local + GitHub API) | Lead Dev | 3h | S5-D2-T4 |
| S5-D5-T5 | Add keyboard shortcut (Cmd+F) for search | Frontend Dev | 1h | S5-D5-T4 |
| S5-D5-T6 | Test with 100+ issues (performance) | QA Engineer | 2h | S5-D5-T4 |

**Day Total**: 11 hours

---

### Sprint 5 Summary

**Total Hours**: 49.5 hours
**Deliverables**:
- ✅ F-4 (Issue Management) complete
- ✅ GitHub API integration (Octokit)
- ✅ Issue caching (SQLite)
- ✅ Issue list with filters, search
- ✅ "Assign to Agent" action

**Demo**: Sync GitHub Issues, view list, filter by label, assign issue to agent, create new issue

---

## 🗓️ Sprint 6: Task History & System Health (Week 6)

**Goal**: Implement F-5 (Task History) and F-6 (System Health)

### Day 1-2: Task History Data

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S6-D1-T1 | Create SQLite schema for task history | Lead Dev | 2h | S5-D2-T2 |
| S6-D1-T2 | Read TaskMetadata from `.ai/tasks/*.json` | Lead Dev | 2h | S2-D1-T5 |
| S6-D1-T3 | Index tasks in SQLite database | Lead Dev | 3h | S6-D1-T2 |
| S6-D1-T4 | Implement FTS (Full-Text Search) for logs | Lead Dev | 3h | S6-D1-T3 |
| S6-D1-T5 | Create `getTaskHistory()` IPC handler | Lead Dev | 2h | S6-D1-T4 |
| S6-D1-T6 | Create `useTaskHistory` hook | Frontend Dev | 2h | S6-D1-T5 |

**Day Total**: 14 hours

---

### Day 2-3: Task History UI

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S6-D2-T1 | Create TaskHistoryRow component | Frontend Dev | 3h | S6-D1-T6 |
| S6-D2-T2 | Create TaskHistoryList component (virtualized) | Frontend Dev | 3h | S6-D2-T1 |
| S6-D2-T3 | Add task detail view (modal or panel) | Frontend Dev | 3h | S6-D2-T1 |
| S6-D2-T4 | Show task logs in detail view | Frontend Dev | 2h | S6-D2-T3 |
| S6-D2-T5 | Add filter by date range, agent type, status | Frontend Dev | 3h | S6-D2-T2 |
| S6-D2-T6 | Add export as JSON/CSV | Lead Dev | 2h | S6-D1-T5 |

**Day Total**: 16 hours

---

### Day 4: System Health Dashboard

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S6-D4-T1 | Install `systeminformation` npm package | Lead Dev | 0.5h | - |
| S6-D4-T2 | Create SystemHealthStore (Zustand) | Frontend Dev | 1h | - |
| S6-D4-T3 | Implement `getSystemMetrics()` IPC handler | Lead Dev | 3h | S6-D4-T1 |
| S6-D4-T4 | Aggregate agent statistics from task history | Lead Dev | 2h | S6-D1-T4 |
| S6-D4-T5 | Poll GitHub API rate limit | Lead Dev | 1.5h | S5-D1-T3 |
| S6-D4-T6 | Create SystemHealthDashboard component | Frontend Dev | 3h | S6-D4-T3 |

**Day Total**: 11 hours

---

### Day 5: Testing & Polish

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S6-D5-T1 | Write unit tests for task history | Frontend Dev | 2h | S6-D2-T2 |
| S6-D5-T2 | Test with 1000+ tasks (performance) | QA Engineer | 2h | S6-D2-T2 |
| S6-D5-T3 | Test system health metrics accuracy | QA Engineer | 2h | S6-D4-T6 |
| S6-D5-T4 | Fix bugs, polish UI | Frontend Dev | 3h | S6-D2-T6 |

**Day Total**: 9 hours

---

### Sprint 6 Summary

**Total Hours**: 50 hours
**Deliverables**:
- ✅ F-5 (Task History Browser) complete
- ✅ F-6 (System Health Dashboard) complete
- ✅ SQLite task history database
- ✅ Full-text search for logs
- ✅ System metrics (CPU, memory, disk)
- ✅ Agent statistics

**Demo**: View task history, filter by date/agent, search logs, export CSV, view system health

---

## 🗓️ Sprint 7: Polish & Notifications (Week 7)

**Goal**: Implement F-11 (Native Notifications), fix bugs, polish UX

### Day 1-2: Native Notifications

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S7-D1-T1 | Implement native notification API (Electron) | Lead Dev | 2h | - |
| S7-D1-T2 | Request notification permission (macOS) | Lead Dev | 1h | S7-D1-T1 |
| S7-D1-T3 | Send notification on agent completion | Lead Dev | 2h | S4-D3-T4 |
| S7-D1-T4 | Send notification on error | Lead Dev | 1h | S7-D1-T3 |
| S7-D1-T5 | Handle notification click (focus app, navigate) | Lead Dev | 2h | S7-D1-T3 |
| S7-D1-T6 | Add notification settings (enable/disable per agent) | Frontend Dev | 3h | S7-D1-T3 |
| S7-D1-T7 | Test notifications on macOS | QA Engineer | 2h | S7-D1-T5 |

**Day Total**: 13 hours

---

### Day 3: Bug Fixes

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S7-D3-T1 | Fix top 5 critical bugs from backlog | All | 8h | - |
| S7-D3-T2 | Fix UI bugs (layout, alignment, colors) | Frontend Dev | 4h | - |
| S7-D3-T3 | Fix IPC edge cases (race conditions, errors) | Lead Dev | 4h | - |

**Day Total**: 16 hours

---

### Day 4: UX Polish

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S7-D4-T1 | Add loading skeletons (replace spinners) | Frontend Dev | 3h | - |
| S7-D4-T2 | Add empty states illustrations | Frontend Dev | 2h | - |
| S7-D4-T3 | Improve error messages (user-friendly) | Frontend Dev | 2h | - |
| S7-D4-T4 | Add keyboard shortcuts for all actions | Lead Dev | 3h | S1-D5-T2 |
| S7-D4-T5 | Add tooltips (hover hints) | Frontend Dev | 2h | - |
| S7-D4-T6 | Improve color contrast (accessibility) | Frontend Dev | 2h | - |

**Day Total**: 14 hours

---

### Day 5: Testing

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S7-D5-T1 | Write E2E tests (Playwright) for critical paths | QA Engineer | 4h | - |
| S7-D5-T2 | Run manual QA (exploratory testing) | QA Engineer | 4h | - |
| S7-D5-T3 | Fix bugs found in QA | All | 4h | S7-D5-T2 |

**Day Total**: 12 hours

---

### Sprint 7 Summary

**Total Hours**: 55 hours
**Deliverables**:
- ✅ F-11 (Native Notifications) complete
- ✅ Top bugs fixed
- ✅ UX polish (loading states, empty states, tooltips)
- ✅ Keyboard shortcuts
- ✅ E2E tests

**Demo**: Receive notification on agent completion, click notification to focus app, test keyboard shortcuts

---

## 🗓️ Sprint 8: Release Preparation (Week 8)

**Goal**: Build, sign, test, and launch MVP

### Day 1: Build Pipeline

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S8-D1-T1 | Create electron-builder config | Lead Dev | 2h | - |
| S8-D1-T2 | Test build for macOS (DMG, ZIP) | Lead Dev | 2h | S8-D1-T1 |
| S8-D1-T3 | Optimize bundle size (code splitting) | Lead Dev | 3h | S8-D1-T2 |
| S8-D1-T4 | Add app icons (1024x1024, icns, ico) | Designer | 2h | - |
| S8-D1-T5 | Setup GitHub Actions for automated builds | Lead Dev | 3h | S8-D1-T2 |

**Day Total**: 12 hours

---

### Day 2: Code Signing & Notarization

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S8-D2-T1 | Setup Apple Developer account | Lead Dev | 1h | - |
| S8-D2-T2 | Create Developer ID Application certificate | Lead Dev | 1h | S8-D2-T1 |
| S8-D2-T3 | Sign macOS app with certificate | Lead Dev | 2h | S8-D2-T2 |
| S8-D2-T4 | Notarize app with Apple (automation) | Lead Dev | 3h | S8-D2-T3 |
| S8-D2-T5 | Test signed app on fresh macOS install | QA Engineer | 2h | S8-D2-T4 |

**Day Total**: 9 hours

---

### Day 3: Documentation

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S8-D3-T1 | Write README.md (installation, usage) | Lead Dev | 2h | - |
| S8-D3-T2 | Write USER_GUIDE.md (features, screenshots) | Frontend Dev | 3h | - |
| S8-D3-T3 | Write DEVELOPER_GUIDE.md (architecture, setup) | Lead Dev | 3h | - |
| S8-D3-T4 | Create demo video (5-10 min) | All | 4h | - |
| S8-D3-T5 | Update CHANGELOG.md (v0.1.0) | Lead Dev | 1h | - |

**Day Total**: 13 hours

---

### Day 4: Beta Testing

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S8-D4-T1 | Recruit 10 beta testers (from Miyabi users) | Lead Dev | 2h | - |
| S8-D4-T2 | Send beta build to testers | Lead Dev | 1h | S8-D2-T5 |
| S8-D4-T3 | Collect feedback (survey, interviews) | All | 4h | S8-D4-T2 |
| S8-D4-T4 | Fix top 3 issues from beta feedback | All | 8h | S8-D4-T3 |

**Day Total**: 15 hours

---

### Day 5: Launch

| Task ID | Task Name | Owner | Hours | Dependencies |
|---------|-----------|-------|-------|--------------|
| S8-D5-T1 | Publish to GitHub Releases (v0.1.0) | Lead Dev | 1h | S8-D4-T4 |
| S8-D5-T2 | Announce on Twitter, Product Hunt, Hacker News | All | 2h | S8-D5-T1 |
| S8-D5-T3 | Monitor crash reports, error logs | Lead Dev | 4h | S8-D5-T1 |
| S8-D5-T4 | Respond to user questions (GitHub Discussions) | All | 4h | S8-D5-T2 |
| S8-D5-T5 | Celebrate launch! 🎉 | All | - | S8-D5-T4 |

**Day Total**: 11 hours

---

### Sprint 8 Summary

**Total Hours**: 60 hours
**Deliverables**:
- ✅ macOS build (DMG, signed, notarized)
- ✅ GitHub Actions CI/CD pipeline
- ✅ Documentation (README, user guide, developer guide)
- ✅ Demo video
- ✅ Beta testing completed
- ✅ Public launch (GitHub Releases, Product Hunt, HN)

**Demo**: Download from GitHub Releases, install, open, test all features

---

## Task Dependencies (DAG)

### 🔀 Dependency Graph

```
S0 (Pre-start)
  ↓
S1 (Foundation)
  ├→ S1-D1 (Project Init) → S1-D2 (IPC) → S1-D3 (Dashboard) → S1-D5 (Menu)
  └→ S1-D4 (Dashboard) → S1-D5 (Menu)
  ↓
S2 (Data Flow)
  ├→ S2-D1 (File Watcher) → S2-D3 (Project Mgmt)
  ├→ S2-D2 (CLI Executor) → S2-D3 (Project Mgmt)
  ├→ S2-D4 (API Client) → S2-D5 (WebSocket)
  ↓
S3 (Worktree)
  ├→ S3-D1 (Data) → S3-D2 (UI) → S3-D4 (Actions) → S3-D5 (Testing)
  ↓
S4 (Agent Monitor)
  ├→ S4-D1 (Data) → S4-D2 (UI) → S4-D3 (Actions) → S4-D4 (Logs) → S4-D5 (Testing)
  ↓
S5 (Issues)
  ├→ S5-D1 (GitHub API) → S5-D2 (Cache) → S5-D3 (UI) → S5-D4 (Actions) → S5-D5 (Filters)
  ↓
S6 (History & Health)
  ├→ S6-D1 (Task Data) → S6-D2 (UI) → S6-D5 (Testing)
  ├→ S6-D4 (System Health) → S6-D5 (Testing)
  ↓
S7 (Polish)
  ├→ S7-D1 (Notifications) → S7-D5 (Testing)
  ├→ S7-D3 (Bug Fixes) → S7-D5 (Testing)
  ├→ S7-D4 (UX Polish) → S7-D5 (Testing)
  ↓
S8 (Release)
  ├→ S8-D1 (Build) → S8-D2 (Signing) → S8-D4 (Beta) → S8-D5 (Launch)
  ├→ S8-D3 (Docs) → S8-D5 (Launch)
```

### 🚧 Critical Path

**Critical Path** (longest sequence, determines minimum timeline):
```
S1-D1 → S1-D2 → S1-D3 → S2-D1 → S2-D2 → S3-D1 → S3-D2 → S4-D1 → S4-D2 →
S4-D4 → S5-D1 → S5-D2 → S6-D1 → S6-D2 → S7-D1 → S7-D3 → S8-D1 → S8-D2 →
S8-D4 → S8-D5
```

**Critical Path Duration**: ~45 days (assumes parallelization)

---

## Resource Allocation

### 👥 Team Capacity

**Assumptions**:
- **Lead Developer**: 8 hours/day × 5 days/week = 40 hours/week
- **Frontend Developer**: 8 hours/day × 5 days/week = 40 hours/week
- **QA Engineer**: 4 hours/day × 5 days/week = 20 hours/week (part-time)

**Total Capacity**: 100 hours/week × 8 weeks = **800 hours**

### 📊 Effort Breakdown by Sprint

| Sprint | Lead Dev | Frontend Dev | QA Engineer | Total |
|--------|----------|--------------|-------------|-------|
| Sprint 0 | 10h | 4h | 0h | 14h |
| Sprint 1 | 28h | 14h | 0h | 42h |
| Sprint 2 | 30h | 18h | 0h | 48h |
| Sprint 3 | 18h | 24h | 0h | 42h |
| Sprint 4 | 22h | 22h | 8h | 52h |
| Sprint 5 | 28h | 17h | 4.5h | 49.5h |
| Sprint 6 | 24h | 20h | 6h | 50h |
| Sprint 7 | 19h | 25h | 11h | 55h |
| Sprint 8 | 32h | 16h | 12h | 60h |
| **Total** | **211h** | **160h** | **41.5h** | **412.5h** |

**Buffer**: 800h - 412.5h = **387.5h** (48% buffer for unknowns)

---

### 🛡️ Risk Buffer Allocation

**Buffer Strategy**: 20% buffer per sprint for unknowns

| Sprint | Planned | Buffer (20%) | Total |
|--------|---------|--------------|-------|
| Sprint 1 | 42h | 8h | 50h |
| Sprint 2 | 48h | 10h | 58h |
| Sprint 3 | 42h | 8h | 50h |
| Sprint 4 | 52h | 10h | 62h |
| Sprint 5 | 49.5h | 10h | 59.5h |
| Sprint 6 | 50h | 10h | 60h |
| Sprint 7 | 55h | 11h | 66h |
| Sprint 8 | 60h | 12h | 72h |

---

## Milestone Definitions

### 🏁 Milestones

| Milestone | Date | Deliverables | Success Criteria |
|-----------|------|--------------|------------------|
| **M0: Kickoff** | Week 0 | Team ready, environment setup | ✅ All devs can run Miyabi locally |
| **M1: Foundation** | End of Week 2 | Electron app with IPC, dashboard integrated | ✅ Can open app, see UI, IPC works |
| **M2: Core Features** | End of Week 4 | Worktree + Agent monitoring working | ✅ Can monitor agents in real-time |
| **M3: Full MVP** | End of Week 6 | All 6 core features complete | ✅ All MVP features testable |
| **M4: Release Candidate** | End of Week 7 | Polished, tested, documented | ✅ Beta testers approve |
| **M5: Public Launch** | End of Week 8 | Published to GitHub Releases | ✅ 100+ downloads in first week |

---

### 🎉 Go/No-Go Criteria

**Before moving to next milestone**:

**M1 → M2**:
- [ ] IPC communication working (renderer ↔ main)
- [ ] React dashboard renders without errors
- [ ] File watcher detects changes in `.ai/` directories
- [ ] No critical bugs (P0, P1)

**M2 → M3**:
- [ ] Worktree visualization shows all active worktrees
- [ ] Agent monitor displays real-time logs
- [ ] No critical bugs (P0, P1)
- [ ] Performance: Startup < 5s, Memory < 600MB

**M3 → M4**:
- [ ] All 6 core features tested and working
- [ ] Task history searchable
- [ ] System health metrics accurate
- [ ] No critical bugs (P0, P1)

**M4 → M5**:
- [ ] Beta testers approve (80%+ satisfaction)
- [ ] Documentation complete (README, user guide)
- [ ] macOS build signed and notarized
- [ ] No P0 bugs, < 5 P1 bugs

---

## Risk Mitigation

### 🚨 Risk Register

| Risk ID | Risk | Probability | Impact | Mitigation | Owner |
|---------|------|-------------|--------|------------|-------|
| R1 | Electron bundle size > 200MB | High | Medium | Code splitting, tree shaking, lazy loading | Lead Dev |
| R2 | Performance degradation (slow startup) | Medium | High | Profiling, optimization, Web Workers | Lead Dev |
| R3 | GitHub API rate limit exceeded | Medium | Medium | Cache locally (SQLite), backoff strategy | Lead Dev |
| R4 | IPC race conditions, deadlocks | Medium | High | Thorough testing, retry logic, timeouts | Lead Dev |
| R5 | Scope creep (adding Phase 2 features) | High | High | Strict prioritization, defer to backlog | All |
| R6 | Team member unavailable (sick, vacation) | Low | Medium | 48% buffer, cross-training | Lead Dev |
| R7 | Apple notarization delays | Low | Medium | Start early (Week 8), plan 2-day buffer | Lead Dev |
| R8 | Beta testers find critical bugs | Medium | High | 2-day buffer for fixes, automated testing | QA Engineer |
| R9 | macOS-specific bugs (not caught in dev) | Medium | Medium | Test on fresh macOS install, VM testing | QA Engineer |
| R10 | Dependency security vulnerabilities | Low | High | npm audit, Dependabot, regular updates | Lead Dev |

---

### 🛠️ Contingency Plans

**Scenario 1: Sprint slips by 1 week**
- **Action**: Cut lowest priority feature (F-11 Notifications → Phase 2)
- **Impact**: MVP still functional, launch delayed by 1 week

**Scenario 2: Critical bug found in Week 8**
- **Action**: Delay launch by 3-5 days, focus all resources on fix
- **Impact**: Launch delayed, but quality maintained

**Scenario 3: Performance unacceptable (startup > 5s)**
- **Action**: Dedicate Sprint 7 Day 4-5 to profiling + optimization
- **Impact**: UX polish deferred to Phase 2

**Scenario 4: GitHub API rate limit issues**
- **Action**: Implement aggressive caching, reduce poll frequency
- **Impact**: Slightly stale data (acceptable for MVP)

---

## Success Criteria

### ✅ MVP Launch Criteria

**Must Have**:
- [ ] All 6 core features (F-1 to F-6) working
- [ ] macOS build (DMG) signed and notarized
- [ ] Documentation: README, USER_GUIDE, DEVELOPER_GUIDE
- [ ] Demo video (5-10 min)
- [ ] No P0 bugs, < 5 P1 bugs
- [ ] Startup time < 3s
- [ ] Memory usage < 500MB
- [ ] Bundle size < 200MB

**Should Have**:
- [ ] F-11 (Native Notifications) working
- [ ] E2E tests (Playwright) for critical paths
- [ ] GitHub Actions CI/CD pipeline
- [ ] Beta testing with 10 users, 80%+ satisfaction

**Nice to Have**:
- [ ] Mac App Store submission (can be done post-launch)
- [ ] Windows/Linux builds (Phase 2)

---

### 📈 Post-Launch Success Metrics (3 months)

**Adoption**:
- [ ] 500+ downloads (GitHub Releases)
- [ ] 300+ DAU (60% of 500 Miyabi users)
- [ ] 450+ WAU (90% of 500)

**Engagement**:
- [ ] 70%+ Day 7 retention
- [ ] 80%+ core feature adoption
- [ ] 60%+ daily active usage

**Quality**:
- [ ] < 5% crash rate
- [ ] < 2% error rate
- [ ] 99.5%+ uptime

**Satisfaction**:
- [ ] NPS: 70+
- [ ] CSAT: 85%+
- [ ] 100+ GitHub stars

---

## Appendices

### A. Sprint Checklist Template

**Start of Sprint**:
- [ ] Sprint planning meeting (review goals, assign tasks)
- [ ] Update GitHub project board
- [ ] Create branch: `sprint-{N}`

**During Sprint**:
- [ ] Daily standup (9:30am)
- [ ] Update task status in project board
- [ ] Commit code daily
- [ ] Write tests for new features
- [ ] Document changes in CHANGELOG.md

**End of Sprint**:
- [ ] Sprint review (demo completed features)
- [ ] Sprint retrospective (what went well, what to improve)
- [ ] Merge `sprint-{N}` → `main`
- [ ] Tag release: `v0.1.0-sprint{N}`
- [ ] Update roadmap with actuals vs planned

---

### B. Daily Standup Template

**Format**: 15 minutes, standing (or video call)

**Each team member answers**:
1. **Yesterday**: What did I accomplish?
2. **Today**: What will I work on?
3. **Blockers**: Any obstacles?

**Example**:
> **Lead Dev**:
> - Yesterday: Implemented IPC handlers for worktree data
> - Today: Wire up file watcher to emit IPC events
> - Blockers: None
>
> **Frontend Dev**:
> - Yesterday: Created WorktreeCard component
> - Today: Add context menu to worktree cards
> - Blockers: Need design for context menu icons
>
> **QA Engineer**:
> - Yesterday: Tested agent monitoring, found 2 bugs
> - Today: Write E2E tests for worktree view
> - Blockers: None

---

### C. Bug Priority Definitions

| Priority | Description | SLA |
|----------|-------------|-----|
| **P0 (Critical)** | App crashes, data loss, security vulnerability | Fix within 24 hours |
| **P1 (High)** | Core feature broken, major UX issue | Fix within 3 days |
| **P2 (Medium)** | Minor feature broken, cosmetic issue | Fix within 1 week |
| **P3 (Low)** | Nice-to-have, enhancement | Backlog |

---

### D. Code Review Checklist

**Before PR Approval**:
- [ ] Code follows TypeScript style guide
- [ ] All tests pass (unit + integration)
- [ ] No ESLint warnings
- [ ] No security vulnerabilities (npm audit)
- [ ] Code is documented (JSDoc comments)
- [ ] Performance acceptable (no obvious bottlenecks)
- [ ] Accessibility: keyboard navigation, screen reader support
- [ ] Tested manually on macOS

---

### E. Release Checklist

**Before Launch**:
- [ ] All MVP features complete and tested
- [ ] Documentation up-to-date
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json (v0.1.0)
- [ ] macOS build created (DMG)
- [ ] App signed with Developer ID
- [ ] App notarized by Apple
- [ ] Tested on fresh macOS install
- [ ] Demo video uploaded to YouTube
- [ ] GitHub Release draft created
- [ ] Tweet/announcement draft written
- [ ] Product Hunt submission ready

**Launch Day**:
- [ ] Publish GitHub Release
- [ ] Post on Twitter, Product Hunt, Hacker News
- [ ] Announce in Miyabi Discord/Slack
- [ ] Monitor crash reports (Sentry)
- [ ] Respond to user questions (GitHub Discussions)

**Post-Launch (Week 1)**:
- [ ] Collect user feedback (surveys, interviews)
- [ ] Fix critical bugs (P0, P1)
- [ ] Publish v0.1.1 patch release if needed
- [ ] Write blog post: "Miyabi Desktop Launch"
- [ ] Plan Phase 2 features based on feedback

---

**End of Document**

**Questions?** Open an issue in GitHub or contact the team lead.

**Let's build Miyabi Desktop! 🚀**
