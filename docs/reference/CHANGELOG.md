# Changelog

All notable changes to Agentic OS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-10-08

### 🎉 Major Release: Agentic OS v2.0

Complete transformation into production-ready autonomous development framework.

### Added

#### Rich CLI Output System (Issue #4)
- **New Package**: 11 rich CLI libraries (chalk, ora, boxen, cli-table3, gradient-string, figlet, etc.)
- **New Module**: `agents/ui/` with theme system and RichLogger
  - `theme.ts` (315 lines) — Brand colors, symbols, borders, typography
  - `logger.ts` (370 lines) — RichLogger class with 20+ methods
  - `table.ts` (336 lines) — Agent status & KPI table formatters
  - `box.ts` (289 lines) — Success/Error/Warning/Agent boxes
  - `progress.ts` (389 lines) — Multi-step progress, spinners, parallel task tracking
  - `tree.ts` (332 lines) — Task tree & agent execution hierarchy rendering
  - `index.ts` — Unified exports
- **New Script**: `scripts/demo-rich-cli.ts` — Complete demo of all capabilities
- **Agent Integration**: BaseAgent now uses RichLogger throughout
  - All 6 agent types (Coordinator, CodeGen, Review, Issue, PR, Deployment) automatically inherit rich UI
  - Agent-specific colors: CoordinatorAgent (pink), CodeGenAgent (blue), ReviewAgent (green), etc.
  - Backward compatible `log()` method preserved
- **Features**:
  - Beautiful colored output with Agentic OS brand theme
  - Agent-specific styling (6 agent types with unique colors)
  - Status messages (success, error, warning, info)
  - Boxes with customizable borders and titles
  - Spinners with auto-complete states
  - Progress bars (configurable width and style)
  - Gradient text and ASCII art banners
  - Key-value pairs and status indicators
  - Bullet lists with indentation support
  - Dividers (light, heavy, double)
  - Tables (Agent status, KPIs, structured data)
  - Trees (Task dependencies, agent execution hierarchy)
  - Multi-step progress indicators
  - Parallel task tracking
- **npm Scripts**:
  - `npm run demo` — Run rich CLI demo
- **Total**: ~1,800 lines of Rich CLI implementation across 4 phases

#### GitHub as Operating System (Issue #5)
- **New Workflow**: `.github/workflows/project-sync.yml` — Auto-add Issues/PRs to Projects V2
- **New Workflow**: `.github/workflows/webhook-handler.yml` — Central event router (Event Bus)
- **New Document**: `docs/GITHUB_OS_INTEGRATION_PLAN.md` — Complete 15-component OS mapping
- **Features**:
  - Issues → Process Management
  - Actions → Job Scheduler
  - Projects V2 → Database
  - Webhooks → Event Bus
  - Discussions → Inter-Process Communication
  - + 10 more OS components
- **Automation**:
  - Auto-add Issues/PRs to GitHub Project
  - Event-driven agent triggering
  - Command parser (`/agent analyze`, `/agent execute`)
  - Critical workflow failure escalation

#### Parallel Work Architecture (Issue #6)
- **New Document**: `docs/PARALLEL_WORK_ARCHITECTURE.md` (700+ lines)
  - Complete architecture design for multi-worker/multi-agent parallel execution
  - Task Orchestrator, Worker Registry, File Lock Mechanism
  - Git worktree strategy for conflict-free parallel work
  - GitHub Projects V2 integration for real-time visibility
- **New Document**: `docs/CLAUDE_CODE_TASK_TOOL.md` (600+ lines)
  - Comprehensive Task Tool integration guide
  - Usage patterns (single, parallel, sequential)
  - Best practices for writing task prompts
  - Error handling and monitoring
  - Complete examples
- **New Document**: `docs/GETTING_STARTED.md` (500+ lines)
  - Ultra beginner-friendly guide (超初心者向け)
  - Step-by-step setup instructions
  - Interactive FAQ
  - Common errors and solutions
  - Cheat sheet
- **New Script**: `scripts/agentic.ts` (180 lines)
  - Interactive beginner guide CLI
  - Auto-explains Claude Code, Agents, Task Tool concepts
  - Q&A-based Issue creation
  - Guided Task Tool execution
- **New Script**: `scripts/execute-task.ts` (140 lines)
  - Task execution automation
  - GitHub Issue fetching
  - Task complexity analysis
  - Copy-paste ready instructions
- **New Script**: `scripts/setup-agentic-os.ts` (500+ lines)
  - Setup wizard supporting 2 scenarios:
    - New project (template mode)
    - Existing project (integration mode)
  - Interactive Q&A
  - Auto-generates config files
  - Non-destructive integration
- **Core Principle**:
  > "必ず必ず必ず必ず、クロードコードのタスクツールを使ってタスクとして実行していきます"
  > ALL work MUST use Claude Code Task Tool. No exceptions.

#### Workflow Rules & Governance
- **New Document**: `.github/WORKFLOW_RULES.md` (710 lines)
  - Prime Directive: "Everything starts with an Issue. No exceptions."
  - Three Commandments: IDD, LDD, Zero Surprise
  - Mandatory workflow with flowchart
  - Anti-patterns and enforcement
- **New Document**: `.github/GUARDIAN.md`
  - Guardian profile and contact information
  - Responsibilities and authority matrix
  - Escalation protocol (3 levels)
- **New File**: `BUDGET.yml`
  - Monthly budget limit
  - Circuit breaker threshold (150%)
  - Guardian approval threshold (50%)
  - Per-agent cost tracking

#### Competitive Analysis
- **New Document**: `docs/research/SIMILAR_PROJECTS_ANALYSIS.md` (1000+ lines)
  - Analyzed 9+ projects:
    - General Frameworks: CrewAI, AutoGen, Dapr Agents, LangGraph
    - Coding Agents: Devin, GitHub Copilot Agent, OpenDevin
    - Spec-Driven: GitHub Spec Kit, claude-code-spec-workflow
  - Detailed feature comparison matrix
  - Competitive positioning analysis
  - Go-to-market strategy
  - Roadmap recommendations
- **Key Finding**: No direct competitor combines all Agentic OS features
- **Positioning**: "First open-source, economically-governed, beginner-friendly autonomous development framework"

#### Integration Roadmap
- **New Document**: `docs/INTEGRATION_ROADMAP.md` (1200+ lines)
  - Extracted 47 concepts from ai-course-content-generator
  - 4-phase implementation plan (14 weeks)
  - Detailed integration instructions for 15 priority concepts
  - Expected ROI and success metrics
- **New File**: `docs/analysis/agentic-os-integration-report.json`
  - Comprehensive analysis of all 47 concepts
  - Priority, effort, dependencies for each
  - Integration risks and validation metrics
- **Key Concepts**:
  - 6-Agent Type System (CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent)
  - Parallel Execution (83% time reduction)
  - DAG-Based Dependency Resolution
  - Knowledge Persistence with Vector DB
  - Organizational Design Principles (組織設計) Operations Framework
  - HashiCorp Vault Dynamic Secrets (15-min TTL)
  - 24/7 Autonomous System (tmux dashboard)
  - KPI Monitoring & SLA Tracking
  - + 39 more concepts

### Changed

#### Branch Naming Convention
- **Old**: `devin/{timestamp}-{feature-name}` (non-standard)
- **New**: `<type>/issue-<number>/<description>` (conventional)
- Supported types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Examples:
  - `feat/issue-4/rich-cli-output`
  - `fix/issue-5/github-sync-error`
  - `docs/issue-6/parallel-work-guide`
- Updated all documentation with new convention

#### Git Worktree Structure
- **Old**: No worktree strategy
- **New**: Dedicated worktrees per worker
  - `.worktrees/issue-<N>-worker-<name>/`
  - Branch: `<type>/issue-<N>/<desc>-worker-<name>`
  - Conflict-free parallel execution

#### npm Scripts
- **Added**: `npm start` — Launch beginner guide
- **Added**: `npm run task` — Execute specific task
- **Added**: `npm run demo` — Show rich CLI demo

### Fixed
- **Security**: Upgraded Vitest from v1.0.0 to v3.2.4 (fixes esbuild vulnerability GHSA-67mh-4wv8-2f99)
- **GitHub Token Documentation**: Added comprehensive GitHub Token setup guide with required scopes (`repo`, `workflow`, `read:project`, `write:project`) in `docs/GETTING_STARTED.md`

### Documentation

#### New Guides
- Getting Started (500+ lines, 超初心者向け)
- Claude Code Task Tool Integration (600+ lines)
- Parallel Work Architecture (700+ lines)
- Workflow Rules (710 lines, constitutional)
- GitHub OS Integration Plan (500+ lines)
- Similar Projects Analysis (1000+ lines)
- Integration Roadmap (1200+ lines)

#### Updated Guides
- README.md — Enhanced visual appeal, added quick start
- REPOSITORY_OVERVIEW.md — Updated branch naming convention
- AGENTS.md — Clarified agent roles and responsibilities

### Infrastructure

#### GitHub Workflows
- `project-sync.yml` — Auto-add Issues/PRs to Projects V2
- `webhook-handler.yml` — Central event router for GitHub OS

#### Development Tools
- `scripts/agentic.ts` — Interactive beginner CLI
- `scripts/execute-task.ts` — Task execution automation
- `scripts/setup-agentic-os.ts` — Project setup wizard
- `scripts/demo-rich-cli.ts` — Rich CLI demo

#### MCP Servers Integration
- **Context Engineering MCP** (git submodule: `external/context-engineering-mcp`)
  - AI-powered context analysis and optimization
  - Semantic search with Gemini AI
  - 4 tools: `search_guides_with_gemini`, `analyze_guide`, `analyze_guide_url`, `compare_guides`
  - Purpose: Information exploration when context is insufficient
  - API Server: http://localhost:8888
- **Total MCP Servers**: 5
  - IDE Integration (VS Code diagnostics, Jupyter execution)
  - GitHub Enhanced (Issue/PR management)
  - Project Context (Dependency information)
  - Filesystem (File access)
  - Context Engineering (AI-powered context optimization)

---

## [1.0.0] - 2025-10-06

### Initial Release

- Basic agent system design
- Repository structure
- Initial documentation
- Agent operations manual

---

## Versioning Strategy

- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (2.X.0)**: New features, backward compatible
- **Patch (2.0.X)**: Bug fixes, documentation updates

---

## Links

- [GitHub Repository](https://github.com/ShunsukeHayashi/Autonomous-Operations)
- [Documentation](docs/)
- [Issues](https://github.com/ShunsukeHayashi/Autonomous-Operations/issues)
- [Pull Requests](https://github.com/ShunsukeHayashi/Autonomous-Operations/pulls)

---

**Maintained by**: Guardian (@ShunsukeHayashi)
