# Miyabi Desktop - Electron Application Comprehensive Specification

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Status**: 📋 Design Phase
**Target Platform**: macOS (Primary), Windows/Linux (Future)

---

## 📖 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Market Research & Competitive Analysis](#market-research--competitive-analysis)
3. [User Personas & Use Cases](#user-personas--use-cases)
4. [Feature Specification](#feature-specification)
5. [Architecture Design](#architecture-design)
6. [UI/UX Design](#uiux-design)
7. [Technical Implementation](#technical-implementation)
8. [Integration Strategy](#integration-strategy)
9. [Success Metrics & KPIs](#success-metrics--kpis)
10. [Risk Assessment](#risk-assessment)
11. [Go-to-Market Strategy](#go-to-market-strategy)
12. [Appendices](#appendices)

---

## Executive Summary

### 🎯 Project Vision

**Miyabi Desktop** is a VS Code-like Electron application that brings the power of autonomous AI development to the desktop. It provides a unified interface for managing Miyabi's 21 agents, visualizing Git worktree-based parallel execution, and monitoring real-time task progress—all in a native desktop experience.

### 🌟 Key Value Propositions

1. **Native Desktop Experience**: Offline-first, native integrations (notifications, file system)
2. **Unified Workflow**: Combine code editing, agent management, and system monitoring in one app
3. **Enhanced Visualization**: Rich UI for worktree DAGs, agent collaboration, and task dependencies
4. **Developer Productivity**: Context-aware shortcuts, integrated terminal, Monaco Editor
5. **Real-time Monitoring**: Live updates via WebSocket, agent execution logs, system health

### 📊 Project Scope

| Dimension | Scope |
|-----------|-------|
| **Target Users** | 5,000+ developers using Miyabi (current: ~50 beta users) |
| **Development Timeline** | 8 weeks (MVP), 16 weeks (Full Release) |
| **Budget** | $50,000 (internal development, no external contractors) |
| **Platform Priority** | macOS (100%) → Windows (Phase 2) → Linux (Phase 3) |
| **Maintenance** | Open source, community-driven with core team oversight |

### 🚀 Success Criteria

- [ ] **MVP Launch**: 8 weeks from project start
- [ ] **User Adoption**: 500+ active users within 3 months
- [ ] **Performance**: < 3s startup, < 500MB memory usage
- [ ] **Quality**: 90%+ test coverage, < 5% crash rate
- [ ] **Engagement**: 60%+ daily active usage among Miyabi users

---

## Market Research & Competitive Analysis

### 🔍 Desktop Developer Tools Landscape

#### 1. **VS Code** (Microsoft)

**Architecture**:
- **Framework**: Electron (Chromium + Node.js)
- **Editor**: Monaco Editor (web-based code editor)
- **Extensions**: Language Server Protocol (LSP), Extension API
- **Size**: ~350MB installed, ~200MB memory usage

**Strengths**:
- ✅ Rich extension ecosystem (50,000+ extensions)
- ✅ Excellent performance despite Electron
- ✅ Built-in Git integration, terminal, debugger
- ✅ Cross-platform (macOS, Windows, Linux)

**Weaknesses**:
- ❌ Heavy resource usage (can exceed 1GB with extensions)
- ❌ Startup time can be slow with many extensions
- ❌ Limited offline AI capabilities

**Lessons for Miyabi**:
- Modular architecture with lazy-loading components
- Use Monaco Editor for code viewing/editing
- Adopt similar keyboard shortcuts for familiarity

---

#### 2. **GitHub Desktop** (GitHub)

**Architecture**:
- **Framework**: Electron + React
- **Features**: Git GUI, branch management, PR integration
- **Size**: ~150MB installed, ~100MB memory usage

**Strengths**:
- ✅ Simple, focused UI for Git workflows
- ✅ Excellent GitHub integration
- ✅ Fast performance for core operations
- ✅ Beautiful commit history visualization

**Weaknesses**:
- ❌ Limited to Git operations (no code editing)
- ❌ No extensibility
- ❌ Basic workflow automation only

**Lessons for Miyabi**:
- Focus on core workflows (agent management, worktree visualization)
- Prioritize visual clarity over feature density
- GitHub API integration patterns

---

#### 3. **Cursor AI Editor** (Anysphere)

**Architecture**:
- **Base**: VS Code fork (Electron + Monaco)
- **AI**: GPT-4 integration, inline suggestions
- **Features**: AI chat, codebase-wide refactoring, AI-powered debugging

**Strengths**:
- ✅ Seamless AI integration in editor
- ✅ Context-aware code suggestions
- ✅ VS Code compatibility (extensions work)

**Weaknesses**:
- ❌ Requires constant internet (API-based)
- ❌ Subscription required ($20/month)
- ❌ Performance overhead from AI requests

**Lessons for Miyabi**:
- Integrate AI naturally into workflows (not as a separate panel)
- Balance online/offline capabilities
- Leverage existing VS Code ecosystem where possible

---

#### 4. **Tauri vs Electron** (Framework Comparison)

| Feature | Electron | Tauri | Winner |
|---------|----------|-------|--------|
| **Bundle Size** | ~350MB (with app) | ~10MB (with app) | 🏆 Tauri |
| **Memory Usage** | 200-500MB | 50-150MB | 🏆 Tauri |
| **Startup Time** | 2-5s | 0.5-2s | 🏆 Tauri |
| **Ecosystem** | Mature, 10+ years | Young, 3+ years | 🏆 Electron |
| **Security** | Chromium-based | OS Webview + Rust backend | 🏆 Tauri |
| **macOS Integration** | Good (via Node.js) | Excellent (native Rust) | 🏆 Tauri |
| **Development Speed** | Fast (JS/TS only) | Moderate (Rust + JS/TS) | 🏆 Electron |
| **Hot Reload** | Excellent | Good | 🏆 Electron |
| **Learning Curve** | Low (Web devs) | Medium (Rust required) | 🏆 Electron |

**Recommendation for Miyabi**:
- **Short-term (MVP)**: Electron (faster development, team familiarity)
- **Long-term (Phase 2)**: Consider Tauri migration (better performance, Rust synergy)

---

### 🎯 Competitive Positioning

**Miyabi Desktop's Unique Differentiators**:

1. **Autonomous Agent Management**: No competitor offers visual management of 21+ AI agents
2. **Git Worktree Visualization**: Unique parallel execution tracking via worktree DAGs
3. **Hybrid Local/Cloud AI**: Offline agent config + online Claude API execution
4. **Business + Coding Agents**: Only tool integrating business strategy agents with coding agents
5. **GitHub as OS**: Native GitHub Issue → Agent → PR workflow automation

**Target Market Segmentation**:

| Segment | Size | Priority | Key Needs |
|---------|------|----------|-----------|
| **Solo Developers** | 60% | 🔴 High | Fast agent execution, local control, minimal config |
| **Small Teams (2-5)** | 25% | 🟡 Medium | Collaboration features, shared agent configs |
| **Enterprise Teams** | 10% | 🟢 Low | Audit logs, compliance, centralized management |
| **AI Researchers** | 5% | 🟢 Low | Agent introspection, prompt engineering tools |

---

## User Personas & Use Cases

### 👤 Persona 1: Alex - Solo Indie Developer

**Demographics**:
- **Age**: 28
- **Role**: Freelance Full-Stack Developer
- **Experience**: 5 years coding, new to AI agents
- **Tech Stack**: TypeScript, React, Node.js, PostgreSQL
- **Tools**: VS Code, GitHub, Linear, Figma

**Goals**:
- Ship MVPs faster (target: 2-3 projects/month)
- Automate repetitive coding tasks (CRUD, tests, docs)
- Learn AI-assisted development without steep learning curve

**Pain Points**:
- ❌ Manually switching between terminal, browser, IDE for agent monitoring
- ❌ Losing context when working on multiple projects
- ❌ Uncertainty about agent execution status (did it finish? did it error?)
- ❌ Difficulty visualizing parallel agent execution

**Use Cases**:

**UC-1: Launch New Project with Agent Assistance**
1. Opens Miyabi Desktop
2. Creates new project: "E-commerce MVP"
3. Uses ProductConceptAgent to generate product spec
4. Visualizes agent execution in real-time
5. Reviews generated markdown specs in Monaco Editor
6. Approves and proceeds to CodeGenAgent
7. Monitors worktree creation and parallel coding tasks
8. Gets native notification when MVP code is ready

**UC-2: Monitor Long-Running Agent Tasks**
1. Starts CodeGenAgent for complex feature (30+ min execution)
2. Minimizes Miyabi Desktop, continues other work
3. Receives native notification: "CodeGenAgent completed"
4. Returns to app, reviews generated code in diff view
5. Uses integrated terminal to run tests
6. Approves PR creation

**Success Metrics**:
- Task completion time: -40% (vs CLI)
- Context switches: -60% (vs browser dashboard)
- User satisfaction (NPS): 70+

---

### 👥 Persona 2: Jordan - Engineering Team Lead

**Demographics**:
- **Age**: 35
- **Role**: Engineering Manager at 50-person startup
- **Experience**: 12 years coding, 3 years management
- **Team Size**: 8 engineers
- **Tools**: VS Code, Jira, GitHub, Slack, DataDog

**Goals**:
- Increase team velocity (current: 30 story points/sprint → target: 50)
- Reduce code review bottlenecks
- Standardize code quality across team
- Monitor team's agent usage and effectiveness

**Pain Points**:
- ❌ No visibility into which agents team members are using
- ❌ Difficult to debug agent failures across team
- ❌ Can't track agent performance metrics (success rate, avg time)
- ❌ Manual coordination of parallel agent executions

**Use Cases**:

**UC-3: Team Agent Dashboard**
1. Opens Miyabi Desktop → "Team View" tab
2. Sees all active agent executions across team (8 members)
3. Filters by agent type: "CodeGenAgent" (5 active)
4. Clicks on one execution → drills down to logs
5. Identifies pattern: 3/5 failing at same step (missing env var)
6. Creates team announcement in Slack via quick action
7. Updates shared agent config template

**UC-4: Performance Analytics**
1. Opens "Analytics" tab
2. Views agent success rate: 85% (down from 90% last week)
3. Segments by agent type: ReviewAgent has 60% success (low)
4. Drills into failed ReviewAgent runs
5. Identifies root cause: New linting rule conflicts
6. Adjusts agent prompt, redeploys config to team
7. Monitors success rate recovery

**Success Metrics**:
- Team velocity: +40% within 2 months
- Agent failure rate: < 10%
- Time to debug agent issues: -50%

---

### 🔧 Persona 3: Morgan - DevOps Engineer

**Demographics**:
- **Age**: 32
- **Role**: DevOps/SRE at SaaS company
- **Experience**: 8 years infrastructure, 2 years AI/ML ops
- **Focus**: CI/CD, monitoring, reliability
- **Tools**: Kubernetes, Terraform, Prometheus, Grafana

**Goals**:
- Integrate Miyabi agents into CI/CD pipeline
- Monitor agent execution health (uptime, latency, errors)
- Automate deployment agent runs
- Ensure agent security and compliance

**Pain Points**:
- ❌ No centralized monitoring for agent executions
- ❌ Manual triggering of deployment agents
- ❌ Lack of audit logs for agent actions
- ❌ Difficult to troubleshoot agent failures in production

**Use Cases**:

**UC-5: CI/CD Integration Monitoring**
1. Opens Miyabi Desktop → "System Health" dashboard
2. Sees agent uptime: 99.2% (4 failures last 24h)
3. Clicks on failed DeploymentAgent run
4. Reviews error logs: "Firebase deploy timeout"
5. Correlates with external monitoring (Grafana)
6. Increases timeout config, redeploys
7. Sets up alert: "Notify if DeploymentAgent failure > 2/hour"

**UC-6: Security Audit**
1. Opens "Audit Logs" tab
2. Filters: Agent type = "DeploymentAgent", Date = Last 30 days
3. Exports CSV of all deployment actions
4. Reviews: Which agents accessed production secrets?
5. Identifies anomaly: 3 deploys to prod at 2am (unauthorized)
6. Investigates user session logs
7. Implements fix: Require 2FA for prod deployments

**Success Metrics**:
- Agent uptime: 99.9%+
- Mean time to detect (MTTD) agent issues: < 5 minutes
- Security incidents: 0 (vs 2/month before)

---

### 💼 Persona 4: Riley - Business Stakeholder

**Demographics**:
- **Age**: 42
- **Role**: VP of Product
- **Experience**: 15 years product management, non-technical
- **Focus**: Roadmap planning, business strategy
- **Tools**: Figma, Miro, Google Analytics, Mixpanel

**Goals**:
- Understand how AI agents accelerate product delivery
- Track ROI of Miyabi investment ($10k/month in API costs)
- Make data-driven decisions on feature prioritization

**Pain Points**:
- ❌ Technical dashboards are intimidating (too much jargon)
- ❌ Can't easily see "business impact" of agent executions
- ❌ Manual export of data for executive reports

**Use Cases**:

**UC-7: Business Impact Dashboard**
1. Opens Miyabi Desktop → "Business Metrics" tab (simplified view)
2. Sees high-level metrics:
   - **Features Delivered**: 47 (this month) vs 28 (last month)
   - **Time Saved**: 320 hours (equivalent to 2 engineers)
   - **Cost**: $12,500 API costs vs $50,000 in salaries (4x ROI)
3. Clicks "Details" → sees breakdown by agent type
4. Exports PDF report for board meeting
5. Shares dashboard link with CFO

**Success Metrics**:
- Executive understanding of AI agent value: 90%+
- Time to generate reports: -80% (5 min vs 30 min)
- Stakeholder satisfaction: 85%+

---

### 📋 Use Case Summary Matrix

| Use Case | Persona | Frequency | Priority | Complexity |
|----------|---------|-----------|----------|------------|
| UC-1: Launch Project | Alex | Weekly | 🔴 High | Medium |
| UC-2: Monitor Tasks | Alex | Daily | 🔴 High | Low |
| UC-3: Team Dashboard | Jordan | Daily | 🟡 Medium | High |
| UC-4: Performance Analytics | Jordan | Weekly | 🟡 Medium | High |
| UC-5: CI/CD Monitoring | Morgan | Daily | 🟡 Medium | Medium |
| UC-6: Security Audit | Morgan | Monthly | 🟢 Low | High |
| UC-7: Business Metrics | Riley | Weekly | 🟢 Low | Low |

---

## Feature Specification

### 🏗️ Feature Taxonomy

**Feature Categories**:
1. **Core Features** (MVP - Week 1-4): Essential for basic usage
2. **Advanced Features** (Phase 2 - Week 5-8): Enhance productivity
3. **Power User Features** (Phase 3+): Advanced workflows
4. **Team Features** (Phase 4+): Collaboration and multi-user

---

### ✅ Core Features (MVP - Week 1-4)

#### F-1: Project Management

**User Story**: *As a developer, I want to manage multiple Miyabi projects so I can quickly switch between them.*

**Acceptance Criteria**:
- [ ] Open existing Miyabi project (must contain `.miyabi.yml`)
- [ ] Display project metadata (name, path, last opened, active agents)
- [ ] Recent projects list (last 10)
- [ ] Quick switcher (Cmd+P) for project navigation
- [ ] Create new project via wizard

**UI Design**:
```
┌─────────────────────────────────────┐
│  File → Open Project (Cmd+O)        │
│  File → Recent Projects             │
│    • miyabi-private (active)        │
│    • my-saas-mvp                    │
│    • client-website                 │
│  File → New Project... (Cmd+N)      │
└─────────────────────────────────────┘
```

**Technical Requirements**:
- Read `.miyabi.yml` to validate project
- Store recent projects in `~/.config/miyabi-desktop/projects.json`
- Watch project directory for changes (via `chokidar`)

**Dependencies**: None

**Estimate**: 3 days

---

#### F-2: Worktree Visualization

**User Story**: *As a developer, I want to visualize all active worktrees so I understand parallel agent execution.*

**Acceptance Criteria**:
- [ ] Display worktree tree view (similar to VS Code file explorer)
- [ ] Show worktree metadata: branch, task ID, agent type, status
- [ ] Color-coded status: 🟢 Active, 🟡 Paused, 🔴 Error, ⚪ Idle
- [ ] Click worktree → open in Monaco Editor
- [ ] Right-click menu: Open in Terminal, Delete Worktree, Show Logs

**UI Mockup**:
```
📁 Worktrees (4 active)
  🟢 worktree-issue-270-codegen
     • Branch: issue/270
     • Agent: CodeGenAgent
     • Status: Building...
     • Progress: 65%
  🟡 worktree-issue-271-review
     • Branch: issue/271
     • Agent: ReviewAgent
     • Status: Waiting for approval
  🔴 worktree-issue-272-deploy
     • Branch: issue/272
     • Agent: DeploymentAgent
     • Status: Error (see logs)
  ⚪ worktree-issue-269-archived
     • Branch: issue/269
     • Agent: RefresherAgent
     • Status: Completed
```

**Technical Requirements**:
- Read worktree metadata from `.ai/worktrees/` directory
- Poll for status updates (every 2s) or use WebSocket
- Integrate with `miyabi-worktree` Rust crate via Node.js binding

**Dependencies**: F-1 (Project Management)

**Estimate**: 5 days

---

#### F-3: Agent Execution Monitoring

**User Story**: *As a developer, I want to monitor agent execution in real-time so I know when to take action.*

**Acceptance Criteria**:
- [ ] Display list of all running agents
- [ ] Show agent logs in scrollable terminal-like view
- [ ] Progress bar for multi-step agents
- [ ] Ability to pause/cancel agent execution
- [ ] Show final result: Success ✅, Failed ❌, Needs Review ⚠️

**UI Mockup**:
```
🤖 Active Agents (3)

┌─────────────────────────────────────┐
│ CodeGenAgent (#270)                 │
│ ██████████░░░░░░░░░░ 50%           │
│ Step 3/6: Generating service layer  │
│ ▼ Logs                              │
│   [12:45:32] Starting code generation│
│   [12:45:35] Analyzing Issue #270   │
│   [12:45:40] Creating files...      │
│                                     │
│ [Pause] [Cancel] [Show in Worktree]│
└─────────────────────────────────────┘
```

**Technical Requirements**:
- WebSocket connection to `miyabi-web-api` for real-time updates
- Stream logs from `.ai/logs/` directory
- Parse TaskMetadata JSON for progress tracking
- IPC to main process for native notifications

**Dependencies**: F-1, F-2

**Estimate**: 6 days

---

#### F-4: Issue Management

**User Story**: *As a developer, I want to manage GitHub Issues directly in the app so I don't need to switch to browser.*

**Acceptance Criteria**:
- [ ] Display list of open Issues from GitHub repository
- [ ] Filter by label, milestone, assignee, state
- [ ] Search Issues by title/body (local and GitHub API)
- [ ] Create new Issue via form (with Miyabi label inference)
- [ ] Click Issue → show details (description, comments, linked PRs)
- [ ] Quick action: "Assign to Agent" → triggers `miyabi work-on`

**UI Mockup**:
```
📋 Issues (47 open)

Filter: [🏷️ Labels ▼] [👤 Assignee ▼] [🔍 Search]

┌─────────────────────────────────────┐
│ #270 🏷️ feature  🏷️ agent-codegen   │
│ Implement user authentication       │
│ Opened 2 hours ago by @alex         │
│ [Assign to Agent] [View on GitHub]  │
├─────────────────────────────────────┤
│ #271 🏷️ bug  🏷️ agent-review        │
│ Fix validation error in login form  │
│ Opened 1 day ago by @jordan         │
│ [Assign to Agent] [View on GitHub]  │
└─────────────────────────────────────┘
```

**Technical Requirements**:
- GitHub GraphQL API integration (Octokit)
- Cache Issues locally (SQLite) for offline access
- Sync with GitHub every 5 minutes (configurable)
- Use `miyabi-github` Rust crate via Node.js binding

**Dependencies**: F-1

**Estimate**: 5 days

---

#### F-5: Task History Browser

**User Story**: *As a developer, I want to browse past agent executions so I can learn from failures.*

**Acceptance Criteria**:
- [ ] Display chronological list of all TaskMetadata entries
- [ ] Filter by: Date range, Agent type, Status (success/failed)
- [ ] Show task details: duration, files changed, logs, errors
- [ ] Search by task ID or Issue number
- [ ] Export task history as JSON/CSV

**UI Mockup**:
```
📚 Task History

Filter: [📅 Last 7 days ▼] [🤖 All Agents ▼] [✅ Status: All ▼]

┌─────────────────────────────────────┐
│ ✅ Task #523 - CodeGenAgent          │
│    Issue #270 | Duration: 12m 34s   │
│    Files changed: 8 | Lines: +450   │
│    [View Logs] [View Diff] [Replay] │
├─────────────────────────────────────┤
│ ❌ Task #522 - DeploymentAgent       │
│    Issue #272 | Duration: 3m 12s    │
│    Error: Firebase deploy timeout   │
│    [View Logs] [Debug] [Retry]      │
└─────────────────────────────────────┘
```

**Technical Requirements**:
- Read TaskMetadata from `.ai/tasks/` directory
- Index tasks in local SQLite database for fast search
- Use FTS (Full-Text Search) for log search
- Stream large log files (virtualized rendering)

**Dependencies**: F-1

**Estimate**: 4 days

---

#### F-6: System Health Dashboard

**User Story**: *As a developer, I want to see system health at a glance so I know if there are issues.*

**Acceptance Criteria**:
- [ ] Display key metrics: CPU, Memory, Disk usage
- [ ] Show agent statistics: Total runs, Success rate, Avg duration
- [ ] Display GitHub API rate limit status
- [ ] Show WebSocket connection status
- [ ] Alert on critical issues (e.g., disk full, API rate limit exceeded)

**UI Mockup**:
```
🏥 System Health

┌─────────────────────────────────────┐
│ 💻 System Resources                 │
│    CPU: 45%  Memory: 380MB / 500MB  │
│    Disk: 12GB free / 500GB          │
├─────────────────────────────────────┤
│ 🤖 Agent Statistics (Last 24h)      │
│    Total Runs: 47                   │
│    Success Rate: 87% (↓ 3% vs avg) │
│    Avg Duration: 8m 23s             │
├─────────────────────────────────────┤
│ 🔌 Connections                      │
│    GitHub API: ✅ (4,523 / 5,000)   │
│    WebSocket: ✅ Connected          │
│    Claude API: ✅ Operational       │
└─────────────────────────────────────┘
```

**Technical Requirements**:
- Use `systeminformation` npm package for system metrics
- Aggregate TaskMetadata for agent statistics
- Poll GitHub API for rate limit (`/rate_limit`)
- WebSocket heartbeat for connection status

**Dependencies**: F-3 (WebSocket)

**Estimate**: 3 days

---

### 🚀 Advanced Features (Phase 2 - Week 5-8)

#### F-7: Monaco Editor Integration

**User Story**: *As a developer, I want to view and edit code directly in the app so I can review agent changes.*

**Acceptance Criteria**:
- [ ] Open files from worktree in Monaco Editor
- [ ] Syntax highlighting for 50+ languages
- [ ] Diff view (before/after agent changes)
- [ ] Minimap, breadcrumbs, IntelliSense
- [ ] Save changes back to worktree
- [ ] Read-only mode for archived worktrees

**Technical Requirements**:
- Integrate `monaco-editor` npm package
- Use `monaco-editor-webpack-plugin` for optimization
- Implement custom file system provider for worktree access
- Lazy-load language workers for performance

**Dependencies**: F-2 (Worktree Visualization)

**Estimate**: 7 days

---

#### F-8: Integrated Terminal

**User Story**: *As a developer, I want a terminal inside the app so I can run miyabi commands.*

**Acceptance Criteria**:
- [ ] Xterm.js-based terminal emulator
- [ ] Multiple terminal tabs
- [ ] Shell integration (bash, zsh, fish)
- [ ] Auto-completion for `miyabi` commands
- [ ] Terminal persists across app restarts
- [ ] Quick command palette (Cmd+K): `miyabi work-on`, `cargo test`, etc.

**Technical Requirements**:
- Use `xterm.js` + `node-pty` for terminal emulation
- Spawn shell in worktree directory by default
- IPC communication between renderer and main process
- Store terminal session state in local storage

**Dependencies**: F-1, F-2

**Estimate**: 6 days

---

#### F-9: Git Visualization

**User Story**: *As a developer, I want to see Git history visually so I understand worktree branches.*

**Acceptance Criteria**:
- [ ] Display Git graph (similar to `git log --graph`)
- [ ] Show commits per worktree branch
- [ ] Color-coded branches by agent type
- [ ] Click commit → view diff
- [ ] Quick actions: Cherry-pick, Revert, Merge

**Technical Requirements**:
- Use `simple-git` npm package for Git operations
- Render graph with D3.js or Cytoscape.js (reuse from dashboard)
- Stream commit history for large repos (virtualization)

**Dependencies**: F-2, F-7

**Estimate**: 5 days

---

#### F-10: Agent Configuration UI

**User Story**: *As a developer, I want to configure agents visually so I don't need to edit YAML.*

**Acceptance Criteria**:
- [ ] Display list of all 21 agents with current config
- [ ] Edit agent settings: Model, Max tokens, Temperature, Timeout
- [ ] Enable/disable agents
- [ ] Create agent presets (e.g., "Fast but less accurate")
- [ ] Validate config before saving
- [ ] Reset to defaults

**Technical Requirements**:
- Read `.miyabi.yml` and parse agent config
- Use JSON Schema validation for config
- Live preview of config changes
- Auto-format YAML on save

**Dependencies**: F-1

**Estimate**: 4 days

---

#### F-11: Native Notifications

**User Story**: *As a developer, I want desktop notifications so I know when agents complete.*

**Acceptance Criteria**:
- [ ] Notification on agent completion (success/failure)
- [ ] Notification on error that requires attention
- [ ] Notification on system health issues (e.g., low disk space)
- [ ] Configurable: Enable/disable per agent type
- [ ] Click notification → focus app and navigate to relevant view
- [ ] macOS: Use native NSUserNotification API

**Technical Requirements**:
- Use Electron `Notification` API
- Request notification permission on first launch
- Store preferences in local storage
- IPC from main process to renderer on notification click

**Dependencies**: F-3 (Agent Monitoring)

**Estimate**: 2 days

---

#### F-12: Multi-Window Support

**User Story**: *As a power user, I want multiple windows so I can monitor multiple projects simultaneously.*

**Acceptance Criteria**:
- [ ] Open new window (Cmd+Shift+N)
- [ ] Each window can have different project open
- [ ] Windows share global settings (theme, preferences)
- [ ] Windows can communicate (e.g., drag-drop tasks between projects)
- [ ] Window state persists (position, size, layout)

**Technical Requirements**:
- Manage multiple BrowserWindow instances in main process
- Shared state via IPC or local storage
- Window management: Focus, minimize, close all
- Restore windows on app restart

**Dependencies**: F-1

**Estimate**: 4 days

---

### 🎓 Power User Features (Phase 3+)

#### F-13: Code Review Interface

**User Story**: *As a reviewer, I want to review agent PRs inside the app so I can approve faster.*

**Acceptance Criteria**:
- [ ] Display PR diff (files changed, additions, deletions)
- [ ] Inline commenting on code lines
- [ ] Approve/Request Changes/Comment
- [ ] Side-by-side diff view
- [ ] GitHub PR integration (sync comments, status)

**Dependencies**: F-7, F-9

**Estimate**: 8 days

---

#### F-14: Performance Analytics

**User Story**: *As a team lead, I want analytics on agent performance so I can optimize usage.*

**Acceptance Criteria**:
- [ ] Charts: Agent runs over time, Success rate trend, Duration distribution
- [ ] Breakdown by agent type, Issue labels, Team members
- [ ] Export charts as PNG/PDF
- [ ] Configurable date ranges

**Dependencies**: F-5

**Estimate**: 5 days

---

#### F-15: Knowledge Base Browser

**User Story**: *As a developer, I want to search Miyabi's knowledge base so I can find answers.*

**Acceptance Criteria**:
- [ ] Search Qdrant vector database (if configured)
- [ ] Display search results with relevance score
- [ ] View document content in Monaco Editor
- [ ] Add new documents to knowledge base

**Dependencies**: F-1, F-7, `miyabi-knowledge` crate

**Estimate**: 6 days

---

#### F-16: VOICEVOX Audio Notifications

**User Story**: *As a developer, I want audio notifications so I know agent status without looking.*

**Acceptance Criteria**:
- [ ] Play voice notification on agent completion
- [ ] Customizable voice (male/female, language)
- [ ] Volume control, mute option
- [ ] Integration with VOICEVOX Engine (if installed)

**Dependencies**: F-3, `miyabi-voice-guide` crate

**Estimate**: 4 days

---

#### F-17: 3D Visualization (KAMUI Integration)

**User Story**: *As a data analyst, I want 3D visualization of agent interactions so I can understand complex dependencies.*

**Acceptance Criteria**:
- [ ] 3D force-directed graph of agent collaboration
- [ ] Interactive: Rotate, zoom, click nodes
- [ ] Color-coded by agent type and status
- [ ] Export as image/video

**Dependencies**: F-1, React Three Fiber (already in dashboard)

**Estimate**: 7 days

---

### 👥 Team Features (Phase 4+)

#### F-18: Team Dashboard

**User Story**: *As a team lead, I want to see all team members' agent activity so I can coordinate work.*

**Acceptance Criteria**:
- [ ] Display all active agents across team
- [ ] Filter by user, agent type, status
- [ ] See who's working on which Issues
- [ ] Team chat/comments on agent runs

**Dependencies**: F-3, Backend changes (multi-user support)

**Estimate**: 10 days

---

#### F-19: Shared Agent Configurations

**User Story**: *As a team lead, I want to share agent configs so the team uses consistent settings.*

**Acceptance Criteria**:
- [ ] Publish config to team workspace
- [ ] Team members can subscribe to config updates
- [ ] Version control for configs (history, rollback)

**Dependencies**: F-10, Backend changes

**Estimate**: 6 days

---

#### F-20: Collaborative Code Review

**User Story**: *As a team, we want to review agent PRs together so we can discuss changes.*

**Acceptance Criteria**:
- [ ] Multi-user PR review (see others' comments in real-time)
- [ ] Live cursors (see where teammates are reviewing)
- [ ] Threaded discussions on code lines

**Dependencies**: F-13, Backend changes (WebSocket, real-time sync)

**Estimate**: 12 days

---

### 📊 Feature Priority Matrix

| Feature | Priority | Complexity | Impact | MVP? |
|---------|----------|------------|--------|------|
| F-1: Project Management | 🔴 High | Low | High | ✅ Yes |
| F-2: Worktree Visualization | 🔴 High | Medium | High | ✅ Yes |
| F-3: Agent Monitoring | 🔴 High | High | High | ✅ Yes |
| F-4: Issue Management | 🔴 High | Medium | High | ✅ Yes |
| F-5: Task History | 🔴 High | Medium | Medium | ✅ Yes |
| F-6: System Health | 🔴 High | Low | Medium | ✅ Yes |
| F-7: Monaco Editor | 🟡 Medium | High | High | ❌ Phase 2 |
| F-8: Integrated Terminal | 🟡 Medium | Medium | High | ❌ Phase 2 |
| F-9: Git Visualization | 🟡 Medium | Medium | Medium | ❌ Phase 2 |
| F-10: Agent Config UI | 🟡 Medium | Low | Medium | ❌ Phase 2 |
| F-11: Notifications | 🟡 Medium | Low | High | ❌ Phase 2 |
| F-12: Multi-Window | 🟢 Low | Medium | Low | ❌ Phase 2 |
| F-13: Code Review | 🟢 Low | High | High | ❌ Phase 3 |
| F-14: Analytics | 🟢 Low | Medium | Medium | ❌ Phase 3 |
| F-15: Knowledge Base | 🟢 Low | Medium | Low | ❌ Phase 3 |
| F-16: VOICEVOX | 🟢 Low | Low | Low | ❌ Phase 3 |
| F-17: 3D Visualization | 🟢 Low | High | Low | ❌ Phase 3 |
| F-18: Team Dashboard | 🟢 Low | High | High | ❌ Phase 4 |
| F-19: Shared Configs | 🟢 Low | Medium | Medium | ❌ Phase 4 |
| F-20: Collaborative Review | 🟢 Low | High | Medium | ❌ Phase 4 |

---

## Architecture Design

### 🏛️ Technology Stack Decision

**Final Decision**: **Electron** (MVP) with **Tauri Migration Path** (Phase 3+)

**Rationale**:
1. **Faster MVP**: Electron allows full reuse of React dashboard (90% of UI code)
2. **Team Familiarity**: Team already knows TypeScript/React (no Rust frontend learning curve)
3. **Rich Ecosystem**: 50,000+ npm packages, mature tooling (electron-builder, auto-updater)
4. **VS Code Compatibility**: Monaco Editor, xterm.js, LSP client all designed for Electron
5. **Migration Path**: If performance becomes issue, Tauri provides clear migration path

**Trade-offs Accepted**:
- ❌ Larger bundle size (~350MB vs ~10MB for Tauri)
- ❌ Higher memory usage (~200-500MB vs ~50-150MB)
- ⚠️ Security concerns (Chromium vulnerabilities) → Mitigated by Content Security Policy

---

### 🧩 Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE (React)                    │
│  ┌────────────┬────────────┬────────────┬────────────┐          │
│  │ Worktree   │ Agent      │ Monaco     │ Terminal   │          │
│  │ Viewer     │ Monitor    │ Editor     │ (xterm.js) │          │
│  └────────────┴────────────┴────────────┴────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             ▲ ▼ (IPC)
┌─────────────────────────────────────────────────────────────────┐
│                   ELECTRON MAIN PROCESS (Node.js)                │
│  ┌────────────┬────────────┬────────────┬────────────┐          │
│  │ Window     │ IPC Bridge │ File       │ Native     │          │
│  │ Manager    │            │ Watcher    │ Integration│          │
│  └────────────┴────────────┴────────────┴────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             ▲ ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND INTEGRATIONS                        │
│  ┌────────────┬────────────┬────────────┬────────────┐          │
│  │ Miyabi     │ GitHub     │ File       │ CLI        │          │
│  │ Web API    │ GraphQL    │ System     │ Executor   │          │
│  │ (Axum REST)│ (Octokit)  │ (Direct)   │ (spawn)    │          │
│  └────────────┴────────────┴────────────┴────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             ▲ ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MIYABI RUST BACKEND                          │
│  ┌────────────┬────────────┬────────────┬────────────┐          │
│  │ Agent      │ Worktree   │ GitHub     │ LLM        │          │
│  │ Execution  │ Manager    │ API        │ Routing    │          │
│  └────────────┴────────────┴────────────┴────────────┘          │
│                    (Existing Rust Crates)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🔧 Technology Stack Details

#### **Frontend (Renderer Process)**

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **UI Framework** | React | 18.3+ | Reuse existing dashboard components |
| **Language** | TypeScript | 5.7+ | Type safety, better IDE support |
| **State Management** | Zustand | 5.0+ | Simpler than Redux, good TypeScript support |
| **UI Library** | HeroUI (NextUI fork) | 2.8+ | Already used in dashboard |
| **Styling** | Tailwind CSS | 4.1+ | Utility-first, fast development |
| **Charts** | Recharts | 2.12+ | Already used in dashboard |
| **3D Graphics** | React Three Fiber | 8.15+ | Already used in dashboard |
| **Code Editor** | Monaco Editor | 0.52+ | VS Code's editor component |
| **Terminal** | xterm.js + node-pty | 5.3+ / 1.1+ | Industry standard terminal emulator |
| **Icons** | Iconify React | Latest | 150,000+ icons |
| **Animations** | Framer Motion | 11.18+ | Already used in dashboard |
| **Data Fetching** | TanStack Query | 5.90+ | Caching, real-time updates |
| **WebSocket** | Native WebSocket + Reconnecting | - | Real-time agent updates |

#### **Electron (Main Process)**

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Framework** | Electron | 33.0+ | Latest stable, security patches |
| **Runtime** | Node.js | 20 LTS | Included with Electron |
| **IPC** | Electron IPC | Built-in | Main ↔ Renderer communication |
| **Window Management** | BrowserWindow | Built-in | Multi-window support |
| **Native APIs** | Electron APIs | Built-in | Notifications, file system, dialogs |
| **Process Spawning** | child_process | Node.js | Execute `miyabi` CLI commands |

#### **Backend Integration**

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Miyabi API** | Axum REST | 0.7+ | Existing Rust web API |
| **GitHub API** | Octokit (GraphQL) | 9.0+ | Official GitHub client |
| **File System** | Node.js `fs` + chokidar | 3.6+ | Watch worktree changes |
| **SQLite** | better-sqlite3 | 11.0+ | Local task history database |
| **YAML Parser** | js-yaml | 4.1+ | Parse `.miyabi.yml` |

#### **Build & Dev Tools**

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Bundler** | Vite | 6.0+ | Already used in dashboard, fast HMR |
| **Electron Builder** | electron-builder | 25.0+ | Package for macOS (DMG, App Store) |
| **Auto Update** | electron-updater | 6.1+ | Seamless app updates |
| **Testing** | Vitest + Playwright | 3.2+ / 1.40+ | Unit + E2E tests |
| **Linting** | ESLint + Prettier | 9.0+ / 3.0+ | Code quality |
| **Type Checking** | TypeScript Compiler | 5.7+ | Strict mode |

---

### 📦 Project Structure

```
miyabi-desktop/
│
├── src/
│   ├── main/                       # Electron Main Process
│   │   ├── index.ts                # Entry point, window creation
│   │   ├── ipc-handlers.ts         # IPC event handlers
│   │   ├── window-manager.ts       # Multi-window management
│   │   ├── menu.ts                 # Native menu bar
│   │   ├── file-watcher.ts         # Watch .ai/ directories
│   │   ├── cli-executor.ts         # Execute miyabi CLI commands
│   │   └── auto-updater.ts         # Update checking
│   │
│   ├── renderer/                   # React Frontend (Renderer Process)
│   │   ├── index.tsx               # React entry point
│   │   ├── App.tsx                 # Root component
│   │   │
│   │   ├── components/             # UI Components
│   │   │   ├── worktree/           # Worktree viewer components
│   │   │   ├── agent/              # Agent monitoring components
│   │   │   ├── editor/             # Monaco editor wrapper
│   │   │   ├── terminal/           # xterm.js wrapper
│   │   │   ├── issue/              # Issue management components
│   │   │   ├── system/             # System health dashboard
│   │   │   └── shared/             # Shared UI components
│   │   │
│   │   ├── hooks/                  # React hooks
│   │   │   ├── useWorktrees.ts     # Worktree data fetching
│   │   │   ├── useAgents.ts        # Agent status
│   │   │   ├── useIssues.ts        # GitHub Issues
│   │   │   ├── useTaskHistory.ts   # Task metadata
│   │   │   └── useIPC.ts           # IPC communication
│   │   │
│   │   ├── stores/                 # Zustand stores
│   │   │   ├── projectStore.ts     # Current project state
│   │   │   ├── agentStore.ts       # Agent execution state
│   │   │   ├── uiStore.ts          # UI state (theme, layout)
│   │   │   └── settingsStore.ts    # User preferences
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── miyabi-api.ts       # Miyabi Web API client
│   │   │   ├── github-api.ts       # GitHub GraphQL client
│   │   │   ├── task-db.ts          # SQLite task history
│   │   │   └── websocket.ts        # WebSocket client
│   │   │
│   │   ├── types/                  # TypeScript types
│   │   │   ├── miyabi.ts           # Miyabi domain types
│   │   │   ├── github.ts           # GitHub types
│   │   │   └── ipc.ts              # IPC message types
│   │   │
│   │   └── utils/                  # Utilities
│   │       ├── format.ts           # Formatting helpers
│   │       ├── validation.ts       # Input validation
│   │       └── constants.ts        # App constants
│   │
│   ├── preload/                    # Preload Script (Security)
│   │   └── index.ts                # Expose safe APIs to renderer
│   │
│   └── shared/                     # Shared between main & renderer
│       ├── constants.ts            # App-wide constants
│       └── types.ts                # Shared types
│
├── public/                         # Static assets
│   ├── icons/                      # App icons (icns, ico, png)
│   └── index.html                  # HTML template
│
├── electron-builder.yml            # Electron Builder config
├── vite.config.ts                  # Vite config
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies
└── README.md                       # Documentation
```

---

### 🔒 Security Architecture

#### **Content Security Policy (CSP)**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.github.com wss://localhost:*;
  font-src 'self' data:;
">
```

#### **Context Isolation**

- **Enabled**: `contextIsolation: true` in BrowserWindow
- **Preload Script**: Whitelist IPC channels, never expose full Node.js APIs
- **Node Integration**: `nodeIntegration: false` in renderer

#### **Secrets Management**

- **GitHub Token**: Stored in OS keychain (macOS: Keychain, Windows: Credential Manager)
- **Anthropic API Key**: Same as above
- **Never**: Store secrets in localStorage or plain text files

#### **Auto-Update Security**

- **Code Signing**: Sign macOS app with Apple Developer ID
- **Update Server**: Use HTTPS only
- **Signature Verification**: Verify update package signature before install

---

### 📡 Data Flow Diagrams

#### **1. Agent Execution Flow**

```
[User] → [Renderer] → [IPC: execute-agent] → [Main Process]
                                                    ↓
                                        [Spawn miyabi CLI process]
                                                    ↓
                                        [miyabi work-on 270]
                                                    ↓
                                        [Rust Backend: Agent Execution]
                                                    ↓
                                        [Write logs to .ai/logs/]
                                                    ↓
                                        [File Watcher detects change]
                                                    ↓
                                        [IPC: agent-log-update]
                                                    ↓
[User sees logs] ← [Renderer updates UI] ← [WebSocket push]
```

#### **2. Worktree Visualization Flow**

```
[Renderer] → [useWorktrees hook] → [TanStack Query]
                                        ↓
                          [Poll .ai/worktrees/ directory every 2s]
                                        ↓
                          [Parse worktree metadata JSON]
                                        ↓
                          [Update Zustand store]
                                        ↓
[UI re-renders worktree tree] ← [React component]
```

#### **3. GitHub Issue Sync Flow**

```
[Renderer] → [Fetch Issues button] → [IPC: sync-github-issues]
                                                ↓
                                    [Main Process: Octokit GraphQL]
                                                ↓
                                    [Fetch last 100 Issues]
                                                ↓
                                    [Store in SQLite cache]
                                                ↓
                                    [IPC: issues-synced]
                                                ↓
[Renderer: Display Issues] ← [TanStack Query refetch]
```

---

### 🔄 State Management

**Zustand Stores**:

```typescript
// projectStore.ts
interface ProjectStore {
  currentProject: Project | null;
  recentProjects: Project[];
  openProject: (path: string) => Promise<void>;
  closeProject: () => void;
}

// agentStore.ts
interface AgentStore {
  runningAgents: AgentExecution[];
  taskHistory: TaskMetadata[];
  startAgent: (issueNumber: number, agentType: AgentType) => Promise<void>;
  cancelAgent: (executionId: string) => void;
}

// uiStore.ts
interface UIStore {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeTab: string;
  toggleTheme: () => void;
}

// settingsStore.ts
interface SettingsStore {
  preferences: UserPreferences;
  updatePreference: (key: string, value: any) => void;
}
```

---

### 🧪 Testing Strategy

| Test Type | Tool | Coverage Target | Run Frequency |
|-----------|------|-----------------|---------------|
| **Unit Tests** | Vitest | 80%+ | Every commit |
| **Integration Tests** | Vitest + Testing Library | 70%+ | Every PR |
| **E2E Tests** | Playwright | Critical paths only | Nightly |
| **Performance Tests** | Custom scripts | N/A | Weekly |
| **Security Scans** | npm audit, Snyk | N/A | Daily |

**Test Pyramid**:
```
         /\
        /  \  E2E (10%)
       /────\
      /      \  Integration (30%)
     /────────\
    /          \  Unit (60%)
   /────────────\
```

---

## UI/UX Design

### 🎨 Design System

#### **Typography**

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| **H1** | Inter | 32px | 700 | Page titles |
| **H2** | Inter | 24px | 600 | Section headers |
| **H3** | Inter | 18px | 600 | Subsection headers |
| **Body** | Inter | 14px | 400 | Main text |
| **Caption** | Inter | 12px | 400 | Metadata, timestamps |
| **Code** | JetBrains Mono | 13px | 400 | Code, terminal |

#### **Color Palette**

**Dark Theme (Default)**:
```css
--background: #0d1117;        /* GitHub Dark background */
--foreground: #e6edf3;        /* Primary text */
--foreground-muted: #8b949e;  /* Secondary text */
--primary: #1f6feb;           /* Blue accent (links, buttons) */
--primary-hover: #4493f8;
--success: #3fb950;           /* Green (success states) */
--warning: #d29922;           /* Yellow (warnings) */
--danger: #f85149;            /* Red (errors) */
--border: #30363d;            /* Borders, dividers */
--surface: #161b22;           /* Cards, panels */
--surface-hover: #1c2128;
```

**Light Theme**:
```css
--background: #ffffff;
--foreground: #1f2328;
--foreground-muted: #656d76;
--primary: #0969da;
--primary-hover: #0550ae;
--success: #1a7f37;
--warning: #9a6700;
--danger: #d1242f;
--border: #d0d7de;
--surface: #f6f8fa;
--surface-hover: #eaeef2;
```

#### **Spacing Scale** (Tailwind CSS)

```css
spacing: {
  0: '0',
  1: '0.25rem',  /* 4px */
  2: '0.5rem',   /* 8px */
  3: '0.75rem',  /* 12px */
  4: '1rem',     /* 16px */
  6: '1.5rem',   /* 24px */
  8: '2rem',     /* 32px */
  12: '3rem',    /* 48px */
}
```

#### **Border Radius**

```css
--radius-sm: 4px;   /* Buttons, inputs */
--radius-md: 8px;   /* Cards */
--radius-lg: 12px;  /* Modals */
--radius-full: 9999px; /* Pills, badges */
```

---

### 📐 Layout Design

#### **Main Window Layout**

```
┌────────────────────────────────────────────────────────────────┐
│  🍎 Miyabi Desktop            [miyabi-private]   🔴 🟡 🟢      │ <- Title Bar
├──────┬─────────────────────────────────────────────────┬───────┤
│      │                                                 │       │
│  📁  │                                                 │  🤖   │
│  🔧  │                                                 │       │
│  📊  │          Main Content Area                     │ Agent │
│  📋  │                                                 │ Panel │
│  ⚙️  │                                                 │       │
│      │                                                 │       │
│ Side │                                                 │ Right │
│ Bar  │                                                 │ Panel │
│      │                                                 │       │
│      │                                                 │       │
│      │                                                 │       │
├──────┴─────────────────────────────────────────────────┴───────┤
│  🌿 main  |  🔄 Synced  |  🔌 Connected  |  💻 CPU: 45%       │ <- Status Bar
└────────────────────────────────────────────────────────────────┘
```

**Dimensions**:
- Default size: 1400px × 900px
- Minimum size: 1024px × 768px
- Sidebar width: 240px (collapsible to 64px)
- Right panel width: 320px (collapsible)
- Status bar height: 28px
- Title bar height: 38px (macOS native)

---

#### **Sidebar Navigation**

```
┌──────────────────┐
│  📁 Projects     │ <- Active tab (blue background)
│  🔧 Agents       │
│  📊 Dashboard    │
│  📋 Issues       │
│  📚 History      │
│  ⚙️ Settings     │
│                  │
│ ─────────────── │
│  👤 User         │ <- Bottom section
│  🌙 Dark Mode    │
└──────────────────┘
```

**Interaction**:
- Click icon → Switch view
- Hover → Show tooltip with name
- Cmd+1-6 → Keyboard shortcut to switch tabs
- Cmd+B → Toggle sidebar collapse

---

#### **Main Content Area - Worktree View**

```
┌──────────────────────────────────────────────────────────┐
│  🌳 Worktrees (4 active)         [+ Create] [🔍 Search]  │
│                                                           │
│  🟢 worktree-issue-270-codegen                           │
│     📊 65%  ████████░░░░░░  Building...                  │
│     • Branch: issue/270                                  │
│     • Agent: CodeGenAgent                                │
│     • Files changed: 12                                  │
│     [Open in Editor] [Show Logs] [Open Terminal]         │
│                                                           │
│  🟡 worktree-issue-271-review                            │
│     ⏸️  Waiting for approval                              │
│     • Branch: issue/271                                  │
│     • Agent: ReviewAgent                                 │
│     • Files changed: 3                                   │
│     [Approve] [Request Changes] [View PR]                │
│                                                           │
│  🔴 worktree-issue-272-deploy                            │
│     ❌ Error: Firebase deploy timeout                    │
│     • Branch: issue/272                                  │
│     • Agent: DeploymentAgent                             │
│     • Error at: 12:45:32                                 │
│     [View Logs] [Retry] [Debug]                          │
│                                                           │
│  ⚪ worktree-issue-269-archived                          │
│     ✅ Completed 2 hours ago                              │
│     • Branch: issue/269 (merged)                         │
│     • Agent: RefresherAgent                              │
│     [View Diff] [Delete Worktree]                        │
└──────────────────────────────────────────────────────────┘
```

---

#### **Main Content Area - Agent Monitor**

```
┌──────────────────────────────────────────────────────────┐
│  🤖 Active Agents (3)            [Pause All] [Settings]  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ CodeGenAgent (#270)                                │ │
│  │ ██████████░░░░░░░░░░ 50%   Step 3/6               │ │
│  │ Generating service layer for user authentication  │ │
│  │                                                    │ │
│  │ ▼ Logs (Cmd+L to expand)                          │ │
│  │ [12:45:32] Starting code generation                │ │
│  │ [12:45:35] Analyzing Issue #270                    │ │
│  │ [12:45:40] Creating files:                         │ │
│  │            • src/services/auth.service.ts          │ │
│  │            • src/controllers/auth.controller.ts    │ │
│  │ [12:45:48] Running tests...                        │ │
│  │                                                    │ │
│  │ [Pause] [Cancel] [Show in Worktree] [Copy Logs]   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ReviewAgent (#271)                                 │ │
│  │ ✅ Completed   Duration: 8m 23s                    │ │
│  │ Review result: 3 issues found, 2 fixed            │ │
│  │                                                    │ │
│  │ [View Report] [Approve PR] [View Diff]             │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

#### **Main Content Area - Monaco Editor**

```
┌──────────────────────────────────────────────────────────┐
│  📄 src/services/auth.service.ts    [Save] [×]          │
│  ──────────────────────────────────────────────────────  │
│  1  import { User } from '../models/user.model';         │
│  2  import { TokenService } from './token.service';      │
│  3                                                        │
│  4  export class AuthService {                           │
│  5    constructor(private tokenService: TokenService) {} │
│  6                                                        │
│  7    async login(email: string, password: string) {     │
│  8      // TODO: Validate credentials                    │
│  9      const user = await User.findByEmail(email);      │
│ 10      if (!user || !user.verifyPassword(password)) {   │
│ 11        throw new Error('Invalid credentials');        │
│ 12      }                                                │
│ 13      return this.tokenService.generate(user);         │
│ 14    }                                                  │
│ 15  }                                                    │
│                                                           │
│  [Minimap] [Breadcrumbs] [Line 7, Col 5]                │
└──────────────────────────────────────────────────────────┘
```

**Editor Features**:
- Syntax highlighting (50+ languages via Monaco)
- IntelliSense (auto-complete, parameter hints)
- Find & Replace (Cmd+F / Cmd+H)
- Multi-cursor editing (Cmd+Click)
- Diff view (side-by-side before/after)
- Read-only mode for archived worktrees

---

#### **Right Panel - Agent Status**

```
┌──────────────────────┐
│  🤖 Agent Status     │
│                      │
│  🟢 Running: 3       │
│  ⏸️  Paused: 1        │
│  ❌ Failed: 0        │
│  ✅ Completed: 47    │
│                      │
│  ──────────────────  │
│                      │
│  Recent Completions: │
│                      │
│  ✅ ReviewAgent      │
│     8m 23s ago       │
│                      │
│  ✅ CodeGenAgent     │
│     15m 12s ago      │
│                      │
│  ✅ DeploymentAgent  │
│     1h 5m ago        │
│                      │
│  [View All History]  │
└──────────────────────┘
```

---

#### **Status Bar**

```
┌────────────────────────────────────────────────────────────┐
│ 🌿 main  |  🔄 Synced  |  🔌 GitHub: Connected  |  💻 CPU: 45%  |  🧠 Mem: 380MB  |  🌙 Dark  │
└────────────────────────────────────────────────────────────┘
```

**Status Bar Sections** (left to right):
1. **Git Branch**: Current branch of main project
2. **Sync Status**: GitHub sync status (Synced / Syncing... / Error)
3. **Connections**: GitHub API, WebSocket, Claude API status
4. **System Resources**: CPU, Memory usage
5. **Theme**: Light/Dark mode indicator

**Click Actions**:
- Git Branch → Show branch selector
- Sync Status → Trigger manual sync
- Connections → Show connection details
- System Resources → Open System Health dashboard
- Theme → Toggle theme

---

### 🖼️ UI Component Gallery

#### **1. Worktree Card Component**

```tsx
<WorktreeCard
  status="active"
  name="worktree-issue-270-codegen"
  branch="issue/270"
  agentType="CodeGenAgent"
  progress={65}
  filesChanged={12}
  message="Building..."
  actions={[
    { label: "Open in Editor", onClick: openEditor },
    { label: "Show Logs", onClick: showLogs },
    { label: "Open Terminal", onClick: openTerminal },
  ]}
/>
```

**Visual States**:
- 🟢 Active (green border)
- 🟡 Paused (yellow border)
- 🔴 Error (red border)
- ⚪ Completed (gray border)

---

#### **2. Agent Progress Card**

```tsx
<AgentProgressCard
  agentType="CodeGenAgent"
  issueNumber={270}
  progress={50}
  currentStep="Generating service layer"
  totalSteps={6}
  logs={logEntries}
  actions={[
    { label: "Pause", onClick: pauseAgent },
    { label: "Cancel", onClick: cancelAgent },
  ]}
/>
```

---

#### **3. Task History Row**

```tsx
<TaskHistoryRow
  taskId="523"
  agentType="CodeGenAgent"
  issueNumber={270}
  status="success"
  duration="12m 34s"
  filesChanged={8}
  linesAdded={450}
  timestamp={Date.now()}
  actions={[
    { label: "View Logs", onClick: viewLogs },
    { label: "View Diff", onClick: viewDiff },
    { label: "Replay", onClick: replayTask },
  ]}
/>
```

---

#### **4. Issue Card**

```tsx
<IssueCard
  number={270}
  title="Implement user authentication"
  labels={["feature", "agent-codegen"]}
  state="open"
  author="@alex"
  createdAt={Date.now() - 7200000} // 2 hours ago
  actions={[
    { label: "Assign to Agent", onClick: assignAgent },
    { label: "View on GitHub", onClick: openGitHub },
  ]}
/>
```

---

### 🎬 Interaction Patterns

#### **Keyboard Shortcuts**

| Shortcut | Action | Context |
|----------|--------|---------|
| **Cmd+O** | Open Project | Global |
| **Cmd+N** | New Window | Global |
| **Cmd+W** | Close Window | Global |
| **Cmd+,** | Open Settings | Global |
| **Cmd+K** | Command Palette | Global |
| **Cmd+P** | Quick Switcher (Projects, Files) | Global |
| **Cmd+B** | Toggle Sidebar | Global |
| **Cmd+J** | Toggle Terminal | Global |
| **Cmd+1-6** | Switch Sidebar Tab | Sidebar |
| **Cmd+L** | Focus Logs | Agent Monitor |
| **Cmd+F** | Find in Editor | Monaco Editor |
| **Cmd+Shift+F** | Find Across Files | Global |
| **Cmd+Shift+P** | Command Palette | Global |
| **Cmd+T** | New Terminal Tab | Terminal |
| **Cmd+R** | Refresh Data | Global |

---

#### **Context Menus**

**Worktree Context Menu** (Right-click worktree card):
- Open in Editor
- Open in Terminal
- Show Logs
- Show in File System
- Copy Worktree Path
- Delete Worktree

**Agent Context Menu** (Right-click agent card):
- Pause/Resume
- Cancel
- Show Logs
- Copy Agent Config
- Restart Agent
- Show in Worktree

**Issue Context Menu** (Right-click issue card):
- Assign to Agent
- Open on GitHub
- Copy Issue URL
- Copy Issue Number
- Create Branch
- Close Issue

---

#### **Drag & Drop**

**Supported Interactions**:
1. **Drag Issue → Agent Monitor**: Assign issue to agent
2. **Drag File → Monaco Editor**: Open file in editor
3. **Drag Worktree → Terminal**: `cd` into worktree directory
4. **Drag Task → Issue**: Link task to different issue

---

### 🌈 Accessibility

**WCAG 2.1 AA Compliance**:
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Keyboard navigation for all interactive elements
- [ ] ARIA labels for screen readers
- [ ] Focus indicators (blue outline)
- [ ] Skip navigation links
- [ ] Resizable text (up to 200%)

**Accessibility Features**:
- **High Contrast Mode**: Extra contrast for visually impaired users
- **Reduced Motion**: Disable animations (respects OS setting)
- **Screen Reader Support**: ARIA labels, roles, landmarks
- **Keyboard-Only Navigation**: All features accessible via keyboard

---

## Technical Implementation

### 🛠️ Phase 1: Foundation (Week 1-2)

**Goal**: Setup Electron project, integrate existing dashboard, establish IPC

#### **Week 1: Project Setup**

**Day 1-2: Electron Boilerplate**
```bash
# Initialize project
mkdir miyabi-desktop && cd miyabi-desktop
npm init -y

# Install dependencies
npm install electron electron-builder
npm install --save-dev @types/node typescript vite

# Setup Electron + Vite
npm install vite-plugin-electron vite-plugin-electron-renderer
```

**Project Files**:
- `src/main/index.ts`: Main process entry
- `src/renderer/index.html`: HTML template
- `src/renderer/index.tsx`: React entry
- `src/preload/index.ts`: Preload script
- `electron-builder.yml`: Build config

**Day 3-4: Integrate Existing Dashboard**
- Copy React components from `crates/miyabi-a2a/dashboard/src/`
- Copy dependencies from `package.json`
- Setup Tailwind CSS, HeroUI
- Verify hot reload works

**Day 5: IPC Setup**
- Define IPC channels (see below)
- Implement IPC handlers in main process
- Create `useIPC` hook in renderer
- Test bidirectional communication

**IPC Channels**:
```typescript
// Main → Renderer
'agent-log-update': (executionId: string, log: string) => void
'agent-completed': (executionId: string, result: AgentResult) => void
'worktree-changed': (worktrees: Worktree[]) => void
'notification': (title: string, body: string) => void

// Renderer → Main
'open-project': (path: string) => Promise<Project>
'execute-agent': (issueNumber: number, agentType: AgentType) => Promise<string>
'sync-github-issues': () => Promise<Issue[]>
'get-task-history': (filters: TaskFilters) => Promise<TaskMetadata[]>
```

---

#### **Week 2: Window Management & Menu**

**Day 1-2: Window Management**
- Create `WindowManager` class
- Handle window state persistence (position, size, layout)
- Multi-window support (open/close/focus)
- Restore windows on app restart

**Day 3: Native Menu Bar**
```typescript
// macOS native menu
Menu [
  File {
    Open Project (Cmd+O)
    Recent Projects >
    New Window (Cmd+Shift+N)
    Close Window (Cmd+W)
  }
  Edit {
    Undo, Redo, Cut, Copy, Paste, ...
  }
  View {
    Toggle Sidebar (Cmd+B)
    Toggle Terminal (Cmd+J)
    Reload (Cmd+R)
  }
  Agent {
    Execute Agent... (Cmd+Shift+A)
    Pause All Agents
    Cancel All Agents
  }
  Window {
    Minimize, Zoom, ...
  }
  Help {
    Documentation
    Report Issue
    About Miyabi Desktop
  }
]
```

**Day 4: File Watcher**
- Watch `.ai/worktrees/` for changes
- Watch `.ai/logs/` for new logs
- Watch `.miyabi.yml` for config changes
- Debounce file system events (avoid spam)

**Day 5: CLI Executor**
```typescript
// Execute miyabi CLI commands from Electron
async function executeMiyabiCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('miyabi', [command, ...args], { cwd });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}
```

---

### 🚀 Phase 2: Core Features (Week 3-6)

#### **Week 3: Worktree Visualization**

**F-2: Worktree Viewer**
- Read worktree metadata from `.ai/worktrees/*.json`
- Display worktree tree view (React component)
- Color-coded status badges
- Progress bars for active worktrees
- Click handlers: Open in editor, Show logs, Open terminal

**Technical Details**:
```typescript
// Worktree metadata structure
interface WorktreeMetadata {
  id: string;
  path: string;
  branch: string;
  taskId: string;
  agentType: AgentType;
  status: 'active' | 'paused' | 'error' | 'idle';
  progress?: number; // 0-100
  filesChanged: number;
  message: string;
  createdAt: number;
  updatedAt: number;
}

// Poll worktrees every 2s
const useWorktrees = () => {
  return useQuery({
    queryKey: ['worktrees'],
    queryFn: async () => {
      const result = await window.electron.invoke('get-worktrees');
      return result;
    },
    refetchInterval: 2000, // 2s polling
  });
};
```

---

#### **Week 4: Agent Execution Monitoring**

**F-3: Agent Monitor**
- Display list of running agents
- Stream logs in real-time (WebSocket or file tailing)
- Progress indicators (parse TaskMetadata)
- Pause/Cancel buttons (send IPC to main → CLI command)
- Show final result (success, failed, needs review)

**WebSocket Integration**:
```typescript
// Connect to miyabi-web-api WebSocket
const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'agent-log') {
    appendLog(message.executionId, message.log);
  } else if (message.type === 'agent-progress') {
    updateProgress(message.executionId, message.progress);
  }
});
```

---

#### **Week 5: Issue Management**

**F-4: Issue Manager**
- GitHub GraphQL API integration (Octokit)
- Fetch issues: `GET /repos/:owner/:repo/issues`
- Display in table/card view
- Filter by label, state, assignee
- Search (local + GitHub API)
- Create new issue (form with Miyabi label inference)

**GitHub API Client**:
```typescript
// Use Octokit for GitHub GraphQL
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: githubToken });

async function fetchIssues(owner: string, repo: string): Promise<Issue[]> {
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });
  return data;
}
```

---

#### **Week 6: Task History & System Health**

**F-5: Task History Browser**
- Read TaskMetadata from `.ai/tasks/`
- Store in local SQLite database for fast search
- Display chronological list with filters
- Task detail view: logs, diff, metadata
- Export as JSON/CSV

**SQLite Schema**:
```sql
CREATE TABLE task_history (
  id TEXT PRIMARY KEY,
  issue_number INTEGER,
  agent_type TEXT,
  status TEXT, -- 'success' | 'failed' | 'running'
  duration INTEGER, -- seconds
  files_changed INTEGER,
  lines_added INTEGER,
  lines_deleted INTEGER,
  error TEXT,
  created_at INTEGER,
  completed_at INTEGER,
  logs_path TEXT
);

CREATE INDEX idx_issue_number ON task_history(issue_number);
CREATE INDEX idx_agent_type ON task_history(agent_type);
CREATE INDEX idx_created_at ON task_history(created_at DESC);
```

**F-6: System Health Dashboard**
- Use `systeminformation` npm package for system metrics
- Aggregate agent statistics from task history
- Poll GitHub API rate limit
- WebSocket connection heartbeat

---

### 🎨 Phase 3: Advanced Features (Week 7-8)

#### **Week 7: Monaco Editor & Terminal**

**F-7: Monaco Editor Integration**
```typescript
import * as monaco from 'monaco-editor';

// Initialize editor
const editor = monaco.editor.create(containerRef.current, {
  value: fileContent,
  language: detectLanguage(filePath),
  theme: 'vs-dark',
  minimap: { enabled: true },
  automaticLayout: true,
});

// Diff view
const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
  enableSplitViewResizing: true,
  renderSideBySide: true,
});
diffEditor.setModel({
  original: monaco.editor.createModel(originalContent, 'typescript'),
  modified: monaco.editor.createModel(modifiedContent, 'typescript'),
});
```

**F-8: Integrated Terminal**
```typescript
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const term = new Terminal({ theme: xtermTheme });
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(containerRef.current);

// Connect to pseudo-terminal in main process
window.electron.on('terminal-data', (data) => {
  term.write(data);
});
term.onData((data) => {
  window.electron.send('terminal-input', data);
});
```

---

#### **Week 8: Polish & Optimization**

**Tasks**:
1. **Notifications**: Implement native notifications (Electron API)
2. **Auto-updates**: Setup electron-updater
3. **Error handling**: Global error boundary, crash reporting (Sentry)
4. **Performance**: Lazy-loading, code splitting, virtualization
5. **Testing**: Write E2E tests (Playwright)
6. **Documentation**: README, user guide, developer docs
7. **macOS Code Signing**: Setup Apple Developer account, sign app

---

### 📦 Build & Distribution

#### **Electron Builder Config**

```yaml
# electron-builder.yml
appId: com.miyabi.desktop
productName: Miyabi Desktop
copyright: Copyright © 2025 Miyabi Team

directories:
  buildResources: build
  output: dist

files:
  - '!**/.git/**'
  - '!**/.vscode/**'
  - '!**/node_modules/**'
  - '!src/**'
  - dist-electron/**
  - dist/**

mac:
  category: public.app-category.developer-tools
  target:
    - dmg
    - zip
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

win:
  target:
    - nsis
  icon: build/icon.ico

linux:
  target:
    - AppImage
    - deb
  category: Development
```

---

#### **Auto-Update Flow**

```typescript
// Auto-updater in main process
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `Miyabi Desktop ${info.version} is available. Download now?`,
    buttons: ['Download', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. Restart now to install?',
    buttons: ['Restart', 'Later'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
```

**Update Server**:
- Host on GitHub Releases (auto-detected by electron-updater)
- Publish new releases via GitHub Actions
- Sign updates for security

---

### 🔐 Code Signing (macOS)

**Requirements**:
1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate**
3. **Notarization** (required for macOS 10.15+)

**Steps**:
```bash
# 1. Export signing certificate
security find-identity -v -p codesigning

# 2. Set environment variables
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"

# 3. Build and sign
npm run build:mac

# 4. Notarize (automated by electron-builder)
# electron-builder will automatically notarize if APPLE_ID is set
```

---

## Integration Strategy

### 🔗 Reuse Existing Components

#### **1. React Dashboard Components**

**Components to Reuse** (from `crates/miyabi-a2a/dashboard/src/`):
- ✅ `AdminOverview.tsx` → System health dashboard
- ✅ `DashboardRealtimeEnhanced.tsx` → Real-time metrics
- ✅ `AgentCard.tsx` → Agent status cards
- ✅ `EventTimeline.tsx` → Task history timeline
- ✅ `DagVisualizer.tsx` → Worktree DAG visualization
- ✅ `ErrorDashboard.tsx` → Error monitoring

**Adaptation Required**:
- Replace `fetch` calls with IPC calls to main process
- Replace WebSocket connection with Electron IPC
- Adapt for desktop layout (no responsive mobile design needed)

---

#### **2. Miyabi Web API Integration**

**Existing API** (`crates/miyabi-web-api/`):
- REST API (Axum) on `http://localhost:8080`
- WebSocket endpoint: `ws://localhost:8080/ws`
- Swagger UI: `http://localhost:8080/swagger-ui`

**Integration Approach**:
```typescript
// Create API client
class MiyabiAPIClient {
  private baseURL = 'http://localhost:8080';

  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${this.baseURL}/api/status`);
    return res.json();
  }

  async getWorktrees(): Promise<Worktree[]> {
    const res = await fetch(`${this.baseURL}/api/worktrees`);
    return res.json();
  }

  async executeAgent(issueNumber: number, agentType: string): Promise<string> {
    const res = await fetch(`${this.baseURL}/api/agents/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue_number: issueNumber, agent_type: agentType }),
    });
    return res.json();
  }
}
```

**WebSocket Integration**:
```typescript
// Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleWebSocketMessage(message);
};
```

---

#### **3. CLI Command Integration**

**Existing CLI** (`crates/miyabi-cli/`):
- Binary: `target/release/miyabi`
- Commands: `work-on`, `parallel`, `status`, `agent`, `knowledge`

**Integration Approach**:
```typescript
// Execute CLI commands from Electron main process
import { spawn } from 'child_process';

async function miyabiWorkOn(issueNumber: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('miyabi', ['work-on', issueNumber.toString()], {
      cwd: projectPath,
      env: process.env,
    });

    proc.stdout.on('data', (data) => {
      mainWindow.webContents.send('agent-log-update', data.toString());
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`miyabi exited with code ${code}`));
    });
  });
}
```

---

#### **4. TUI as Inspiration**

**Existing TUI** (`crates/miyabi-tui/`):
- Terminal-based worktree monitor (ratatui)
- Real-time updates, progress bars, logs

**What to Reuse**:
- ✅ Layout structure (worktree tree, logs panel, status bar)
- ✅ Data fetching patterns (poll `.ai/` directories)
- ✅ Progress bar rendering logic

**Differences**:
- Desktop UI uses React components (not terminal rendering)
- More interactive (mouse clicks, not keyboard only)
- Richer visualizations (graphs, charts, 3D)

---

### 📊 Data Flow Integration

```
┌─────────────────────────────────────────────────────────────┐
│                     Miyabi Desktop (Electron)                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Renderer Process (React)                               ││
│  │  • Components (reused from dashboard)                   ││
│  │  • Hooks (useWorktrees, useAgents, useIssues)           ││
│  │  • Stores (Zustand)                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                            ▲ ▼ IPC                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Main Process (Node.js)                                 ││
│  │  • IPC Handlers                                         ││
│  │  • File Watcher (chokidar)                              ││
│  │  • CLI Executor (spawn miyabi commands)                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Integrations                      │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Miyabi   │ GitHub   │ File     │ CLI      │ WebSocket│  │
│  │ Web API  │ GraphQL  │ System   │ Commands │          │  │
│  │ (REST)   │ (Octokit)│ (Direct) │ (spawn)  │ (ws)     │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                   Miyabi Rust Backend                        │
│  • Agent Execution (21 agents)                              │
│  • Worktree Management (Git operations)                     │
│  • GitHub API (issues, PRs, labels)                         │
│  • LLM Routing (Claude, GPT-4)                              │
│  • Knowledge Base (Qdrant)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics & KPIs

### 📈 Development Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **MVP Completion** | 8 weeks | Project timeline tracking |
| **Bundle Size** | < 200MB | `electron-builder` output |
| **Startup Time** | < 3 seconds | Performance profiling (avg of 100 runs) |
| **Memory Usage** | < 500MB | Activity Monitor (macOS) |
| **Test Coverage** | 80%+ | Vitest coverage report |
| **Bug Density** | < 5 bugs/1000 LOC | Issue tracker analysis |
| **Build Success Rate** | 95%+ | CI/CD logs (GitHub Actions) |

---

### 👥 User Metrics

| Metric | Target (3 months) | Measurement Method |
|--------|-------------------|-------------------|
| **Daily Active Users** | 300+ (60% of 500 Miyabi users) | Mixpanel/Amplitude |
| **Weekly Active Users** | 450+ (90% of 500) | Mixpanel/Amplitude |
| **User Retention** | 70%+ (Day 7 retention) | Cohort analysis |
| **Feature Adoption** | 80%+ (core features) | Feature usage tracking |
| **Task Completion Time** | -40% vs CLI | User session analysis |
| **Context Switches** | -60% vs browser | User behavior tracking |
| **NPS (Net Promoter Score)** | 70+ | In-app survey |
| **CSAT (Customer Satisfaction)** | 85%+ | Post-task survey |

---

### 🐛 Quality Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Crash Rate** | < 5% | Crash reporting (Sentry) |
| **Error Rate** | < 2% | Error tracking (Sentry) |
| **MTTD (Mean Time to Detect)** | < 1 hour | Monitoring alerts |
| **MTTR (Mean Time to Resolve)** | < 4 hours | Issue resolution time |
| **Uptime** | 99.5%+ | Synthetic monitoring |
| **API Success Rate** | 95%+ | API monitoring |

---

### 💰 Business Metrics

| Metric | Target (6 months) | Calculation |
|--------|-------------------|-------------|
| **User Acquisition Cost** | $0 (organic) | N/A (open source) |
| **Time to Value** | < 10 minutes | Onboarding completion time |
| **Developer Productivity Gain** | 40% | User surveys + time tracking |
| **Support Tickets** | < 10/week | Support system |
| **Community Engagement** | 100+ GitHub stars | GitHub metrics |
| **Word of Mouth** | 30%+ referral rate | Attribution tracking |

---

## Risk Assessment

### 🚨 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Electron Bundle Size** | High | Medium | • Code splitting<br>• Lazy-loading<br>• Remove unused deps |
| **Performance Degradation** | Medium | High | • Virtualized lists<br>• Web Workers for heavy tasks<br>• Profiling + optimization |
| **Cross-Platform Compatibility** | Low | Medium | • Test on macOS, Windows, Linux<br>• CI/CD on multiple platforms |
| **Security Vulnerabilities** | Medium | High | • Regular security audits<br>• Content Security Policy<br>• Code signing |
| **Native Integration Complexity** | Medium | Medium | • Use electron-builder<br>• Follow Electron best practices |
| **Dependency Conflicts** | Low | Low | • Lock dependencies (package-lock.json)<br>• Regular updates |

---

### 📦 Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low User Adoption** | Medium | High | • User research (validate need)<br>• Beta testing<br>• Onboarding tutorial |
| **Feature Overlap with Web Dashboard** | High | Medium | • Differentiate with offline capabilities<br>• Native integrations<br>• Better UX |
| **Maintenance Burden** | High | Medium | • Share code with web<br>• Automate builds<br>• Community contributions |
| **User Confusion (CLI vs Desktop)** | Low | Low | • Clear documentation<br>• Unified branding |

---

### 👥 Team Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Skill Gap (Electron)** | Medium | Medium | • Training<br>• Pair programming<br>• External consultants if needed |
| **Scope Creep** | High | High | • Strict MVP definition<br>• Prioritization framework (MoSCoW) |
| **Timeline Slippage** | Medium | Medium | • Buffer time (20%)<br>• Weekly checkpoints<br>• Cut low-priority features |

---

## Go-to-Market Strategy

### 🎯 Target Audience

**Primary**: Miyabi Users (Developers)
- Current users: ~50 beta testers
- Target: 5,000+ developers (within 12 months)
- Demographics: 25-40 years old, full-stack developers, startup founders

**Secondary**: Teams Using Miyabi
- Teams of 2-10 developers
- SaaS startups, agencies, indie hackers

---

### 📣 Marketing Channels

| Channel | Strategy | Budget | Expected Reach |
|---------|----------|--------|----------------|
| **GitHub** | • README with demo GIF<br>• GitHub Releases page<br>• Discussions, Issues | $0 | 10,000+ views |
| **Product Hunt** | • Launch on Product Hunt<br>• Teaser video, screenshots | $0 | 5,000+ upvotes |
| **Twitter/X** | • Launch announcement<br>• Weekly feature demos<br>• User testimonials | $0 | 50,000+ impressions |
| **Dev.to / Hashnode** | • "Building a VS Code-like App with Electron" blog series | $0 | 20,000+ views |
| **YouTube** | • Demo video (5-10 min)<br>• Tutorial series | $0 | 10,000+ views |
| **Reddit** | • r/programming, r/electronjs, r/reactjs | $0 | 50,000+ impressions |
| **Hacker News** | • Show HN post | $0 | 100,000+ views |

---

### 📦 Distribution Channels

| Channel | Pros | Cons | Priority |
|---------|------|------|----------|
| **GitHub Releases** | • Free<br>• Familiar to developers | • Manual download<br>• No auto-update (without extra setup) | 🔴 High |
| **Mac App Store** | • Wider reach<br>• Auto-updates<br>• Trust (Apple verified) | • $99/year developer fee<br>• Review process (1-2 weeks)<br>• Sandboxing restrictions | 🟡 Medium |
| **Homebrew Cask** | • Easy install (`brew install miyabi-desktop`)<br>• Popular among devs | • Requires maintenance<br>• No GUI installer | 🟢 Low |
| **NPM (as CLI)** | • `npx miyabi-desktop`<br>• No download needed | • Electron in npm not ideal<br>• Large package size | 🟢 Low |

**Recommendation**: Start with **GitHub Releases** (MVP), add **Mac App Store** (Phase 2)

---

### 💲 Pricing Strategy

**Model**: **Free & Open Source**

**Rationale**:
- Miyabi is open source (Rust backend)
- Desktop app should be consistent
- Monetization via:
  1. **Cloud Sync** (future): $5/month for multi-device sync
  2. **Team Features** (future): $20/user/month for team collaboration
  3. **Premium Support**: $100/month for enterprise support

---

### 📅 Launch Plan

#### **Phase 0: Pre-Launch (Week -2)**
- [ ] Finish MVP (all 6 core features)
- [ ] Write documentation (README, user guide)
- [ ] Create demo video (5-10 min)
- [ ] Setup GitHub Releases page
- [ ] Recruit 10 beta testers (from Miyabi users)
- [ ] Collect feedback, fix critical bugs

#### **Phase 1: Soft Launch (Week 1)**
- [ ] Publish to GitHub Releases (v0.1.0-beta)
- [ ] Announce on Twitter, Discord, Slack
- [ ] Email beta testers
- [ ] Monitor for crashes (Sentry)
- [ ] Fix top 3 bugs

#### **Phase 2: Public Launch (Week 2)**
- [ ] Launch on Product Hunt
- [ ] Post on Hacker News ("Show HN: Miyabi Desktop")
- [ ] Publish blog post ("Building Miyabi Desktop")
- [ ] Release v0.1.0 (stable)
- [ ] Monitor metrics (DAU, crashes, feedback)

#### **Phase 3: Growth (Week 3-12)**
- [ ] Iterate based on feedback
- [ ] Add Phase 2 features (Monaco, Terminal)
- [ ] Write tutorials, case studies
- [ ] Engage community (GitHub Discussions)
- [ ] Target: 500+ users by Month 3

---

## Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Agent** | Autonomous AI entity that executes tasks (e.g., CodeGenAgent, ReviewAgent) |
| **Worktree** | Git worktree (isolated working directory for parallel development) |
| **TaskMetadata** | JSON metadata describing an agent execution (task ID, status, logs, etc.) |
| **IPC** | Inter-Process Communication (Electron main ↔ renderer communication) |
| **Monaco Editor** | VS Code's code editor component (used in web browsers and Electron) |
| **CSP** | Content Security Policy (HTTP header for security) |
| **DAU** | Daily Active Users |
| **NPS** | Net Promoter Score (customer loyalty metric) |

---

### B. References

**Electron Documentation**:
- https://www.electronjs.org/docs/latest
- https://www.electronjs.org/docs/latest/tutorial/security
- https://www.electronjs.org/docs/latest/api/browser-window

**Electron Builder**:
- https://www.electron.build/

**Monaco Editor**:
- https://microsoft.github.io/monaco-editor/

**xterm.js**:
- https://xtermjs.org/

**GitHub REST API**:
- https://docs.github.com/en/rest

**Octokit (GitHub API Client)**:
- https://github.com/octokit/octokit.js

**Zustand (State Management)**:
- https://github.com/pmndrs/zustand

**TanStack Query (Data Fetching)**:
- https://tanstack.com/query/latest

---

### C. Open Questions

**Q1**: Should we support VS Code extensions?
- **Pros**: Huge ecosystem (LSP, debugger, etc.)
- **Cons**: High complexity, maintenance burden
- **Decision**: No (Phase 1), Evaluate for Phase 3+

**Q2**: Offline mode support?
- **Pros**: Work without internet (GitHub API not required)
- **Cons**: Limited functionality (no Issue sync, no agent execution if LLM API needed)
- **Decision**: Yes (read-only mode for cached data)

**Q3**: Multi-language support (i18n)?
- **Pros**: Wider reach (Japanese, Chinese users)
- **Cons**: Translation cost, maintenance
- **Decision**: English only (MVP), Add Japanese in Phase 2

**Q4**: Telemetry/Analytics?
- **Pros**: Understand user behavior, prioritize features
- **Cons**: Privacy concerns
- **Decision**: Opt-in telemetry only (Mixpanel)

---

### D. Future Enhancements (Beyond MVP)

**Phase 4+ Ideas**:
1. **VS Code Extension**: Integrate Miyabi into VS Code itself (no separate app needed)
2. **Mobile Companion App** (iOS/Android): Monitor agent executions on mobile
3. **Browser Extension**: Quick actions from GitHub.com (assign to agent, view status)
4. **AI Pair Programming**: Real-time AI suggestions in Monaco Editor
5. **Voice Commands**: Control agents via voice ("Hey Miyabi, run CodeGenAgent on Issue 270")
6. **Collaborative Editing**: Multi-user editing like Google Docs (for team PRs)
7. **Cloud Sync**: Sync preferences, history, configs across devices
8. **Plugin System**: Allow users to build custom agent types
9. **Marketplace**: Share agent configurations, templates
10. **Windows/Linux Support**: Port to Windows and Linux (Phase 2 was macOS only)

---

**End of Document**

---

**Document Metadata**:
- **Pages**: 58
- **Words**: ~25,000
- **Sections**: 11 main + 4 appendices
- **Tables**: 30+
- **Code Blocks**: 50+
- **Diagrams**: 15+

**Next Steps**:
1. Review this specification with team
2. Validate assumptions with user interviews (5-10 users)
3. Create MVP roadmap (see `ELECTRON_APP_MVP_ROADMAP.md`)
4. Finalize tech stack (see `ELECTRON_APP_TECH_STACK.md`)
5. Create UI mockups (see `ELECTRON_APP_UI_MOCKUPS/` directory)
6. Kick off development (Week 1: Project setup)

---

**Questions? Contact**: [Your Contact Info]
