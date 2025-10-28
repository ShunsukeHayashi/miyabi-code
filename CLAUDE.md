# Miyabi - Project Root & Control Document

**Version**: 3.0.0
**Last Updated**: 2025-10-28
**Purpose**: Project root documentation & Miyabi autonomous control protocol

---

## 🎯 Critical Rules - 必ず守ること

### ⭐⭐⭐⭐⭐ Rule 1: Task Execution Protocol

**必ず、Task todos は Sub-Agentへアサインする or Skill useで対応**

- ✅ **Coding/Bug修正** → `agent-execution` Skill or `rust-development` Skill
- ✅ **デバッグ** → `debugging-troubleshooting` Skill
- ✅ **パフォーマンス** → `performance-analysis` Skill
- ✅ **セキュリティ** → `security-audit` Skill
- ✅ **ドキュメント** → `documentation-generation` Skill
- ❌ **直接実装禁止** - 必ずSub-AgentまたはSkillを経由すること

### ⭐⭐⭐⭐⭐ Rule 2: MCP First Approach

全てのタスク実行前に、まず MCP の活用可能性を検討する

```bash
# Phase 0: MCP確認（必須）
claude mcp list
```

**詳細**: [.claude/MCP_INTEGRATION_PROTOCOL.md](.claude/MCP_INTEGRATION_PROTOCOL.md)

### ⭐⭐⭐⭐⭐ Rule 3: Benchmark Implementation Protocol

公式ハーネス必須 - 独自実装禁止

**詳細**: [.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md](.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md)

### ⭐⭐⭐⭐⭐ Rule 4: Context7 Usage

外部ライブラリ参照時は必ず Context7 使用

```
Use context7 to get the latest Tokio async runtime documentation
```

**詳細**: [.claude/context/external-deps.md](.claude/context/external-deps.md)

---

## 📁 Project Root Structure

```
/Users/shunsuke/Dev/miyabi-private/
│
├── 🦀 Rust Core (Cargo Workspace)
│   ├── Cargo.toml                    # Workspace定義
│   ├── rust-toolchain.toml            # Rust 2021 Edition (Stable)
│   └── crates/                        # 15+ crates
│       ├── miyabi-cli/                # CLI binary
│       ├── miyabi-core/               # Core utilities
│       ├── miyabi-types/              # Type definitions
│       ├── miyabi-agents/             # 21 Agents (Coding: 7, Business: 14)
│       ├── miyabi-github/             # GitHub API
│       ├── miyabi-worktree/           # Git Worktree管理
│       ├── miyabi-llm/                # LLM抽象化層
│       ├── miyabi-knowledge/          # ナレッジ管理（Qdrant）
│       ├── miyabi-voice-guide/        # VOICEVOX統合
│       └── miyabi-mcp-server/         # MCP Server (JSON-RPC 2.0)
│
├── 🎨 Frontend & Web
│   ├── miyabi-dashboard/              # React Dashboard
│   ├── miyabi-web/                    # Landing page
│   └── assets/                        # Static assets
│
├── 🔧 Configuration
│   ├── .miyabi.yml                    # Miyabi project config
│   ├── .env                           # Environment variables (gitignored)
│   ├── docker-compose.yml             # Docker orchestration
│   ├── vercel.json                    # Vercel deployment
│   ├── cloudbuild.yaml                # GCP Cloud Build
│   ├── codecov.yml                    # Code coverage
│   ├── deny.toml                      # Cargo deny config
│   └── mcp-settings.json              # MCP server settings
│
├── 📚 Documentation
│   ├── README.md                      # Project overview
│   ├── CLAUDE.md                      # ⭐ This file - Control document
│   ├── AGENTS.md                      # Agent system overview
│   ├── QUICKSTART-JA.md               # Quick start guide (日本語)
│   ├── CHANGELOG.md                   # Version history
│   ├── CONTRIBUTING.md                # Contribution guidelines
│   ├── SECURITY.md                    # Security policy
│   ├── PERFORMANCE.md                 # Performance benchmarks
│   ├── MIGRATION_v0.1.1.md            # Migration guide
│   ├── RELEASE_CHECKLIST.md           # Release process
│   └── docs/                          # Detailed docs
│       ├── ENTITY_RELATION_MODEL.md   # 12 Entities, 27 Relations
│       ├── LABEL_SYSTEM_GUIDE.md      # 53 Labels
│       ├── TEMPLATE_MASTER_INDEX.md   # 88 Templates
│       └── ... (20+ files)
│
├── 🤖 Claude Code Integration
│   └── .claude/
│       ├── commands/                  # Slash commands (15+ files)
│       ├── context/                   # Context modules (11 files) ⭐⭐⭐
│       │   ├── INDEX.md               # Context index
│       │   ├── core-rules.md          # Critical rules
│       │   ├── agents.md              # Agent details
│       │   ├── architecture.md        # System architecture
│       │   ├── worktree.md            # Worktree protocol
│       │   └── ... (11 modules)
│       ├── agents/                    # Agent specs & prompts
│       │   ├── specs/                 # 21 Agent specifications
│       │   └── prompts/               # 6 Execution prompts
│       ├── skills/                    # 15 Skills
│       ├── MCP_INTEGRATION_PROTOCOL.md
│       ├── BENCHMARK_IMPLEMENTATION_CHECKLIST.md
│       └── TROUBLESHOOTING.md
│
├── 🧪 Testing & CI/CD
│   ├── .github/
│   │   ├── workflows/                 # GitHub Actions (13 workflows)
│   │   └── labels.yml                 # 53 Label definitions
│   ├── benchmarks/                    # Performance benchmarks
│   └── examples/                      # Usage examples
│
├── 📊 Data & Logs
│   ├── .ai/                           # AI execution data
│   │   ├── logs/                      # Execution logs
│   │   ├── plans/                     # Task plans
│   │   └── parallel-reports/          # Parallel execution reports
│   ├── data/                          # Data files
│   ├── database/                      # Database schemas
│   └── logs/                          # Application logs
│
├── 🔗 Integrations
│   ├── mcp-servers/                   # MCP server implementations
│   ├── integrations/                  # External integrations
│   ├── discord-config.json            # Discord bot config
│   └── external/                      # External dependencies
│
├── 🚀 Deployment
│   ├── deployment/                    # Deployment scripts
│   ├── docker/                        # Dockerfiles
│   └── .worktrees/                    # Git worktrees (runtime)
│
├── 💼 Business & Legal
│   ├── BUDGET.yml                     # Budget tracking
│   ├── marketplace.json               # GitHub Marketplace
│   ├── marketplace-business.json      # Business config
│   ├── legal/                         # Legal documents
│   └── projects/                      # Business projects
│
└── 📝 Miscellaneous
    ├── TODO.md                        # Project TODO
    ├── Plans.md                       # Current plans
    ├── DIRECTORY_STRUCTURE.md         # Directory reference
    ├── CODEX_INTEGRATION_PROGRESS.md  # Codex integration status
    ├── DISCORD_COMMUNITY_PLAN.md      # Community plan
    └── reports/                       # Various reports
```

---

## 🎮 Miyabi Control Interface

### Quick Commands

```bash
# Build
cargo build --release

# Run CLI
./target/release/miyabi --help

# Work on Issue
miyabi work-on <issue-number>

# Parallel execution
miyabi parallel --issues 270,271,272 --concurrency 3

# Infinity mode (all issues)
miyabi infinity

# Status check
miyabi status [--watch]

# Knowledge search
miyabi knowledge search "error handling"

# Agent execution
miyabi agent <type> --issue <num>
```

### Available Skills (15)

1. **agent-execution** - Execute Miyabi Agents with Git Worktree isolation
2. **rust-development** - Comprehensive Rust workflow (build, test, clippy, fmt)
3. **debugging-troubleshooting** - Systematic debugging for Rust
4. **dependency-management** - Cargo dependency updates & vulnerability resolution
5. **performance-analysis** - Profiling, benchmarking, optimization
6. **security-audit** - Security scanning (cargo-audit, clippy, secrets)
7. **git-workflow** - Automated Git operations (commit, PR, merge)
8. **documentation-generation** - Generate docs from Entity-Relation Model
9. **issue-analysis** - Analyze Issues and infer labels (57-label system)
10. **project-setup** - Initialize new Miyabi projects
11. **business-strategy-planning** - Business plan & strategy formulation
12. **content-marketing-strategy** - Content & SNS strategy
13. **market-research-analysis** - Market research (20+ companies)
14. **sales-crm-management** - Sales process & customer management
15. **growth-analytics-dashboard** - KPI tracking & PDCA cycle

**Usage**:
```
Skill tool with command "agent-execution"
Skill tool with command "rust-development"
```

---

## 📚 Context Modules (Just-In-Time Loading)

**Location**: `.claude/context/`

| Priority | Module | File | Description |
|----------|--------|------|-------------|
| ⭐⭐⭐⭐⭐ | **Core Rules** | `core-rules.md` | MCP First, Benchmark Protocol, Context7 |
| ⭐⭐⭐⭐ | **Agents** | `agents.md` | 14 Agents実装済み + 10 Agents計画中 |
| ⭐⭐⭐⭐ | **Architecture** | `architecture.md` | Cargo Workspace, GitHub OS, Worktree |
| ⭐⭐⭐ | **Development** | `development.md` | Rust/TypeScript規約、テスト、CI/CD |
| ⭐⭐⭐ | **Entity-Relation** | `entity-relation.md` | 12 Entities, 27 Relations, N1/N2/N3記法 |
| ⭐⭐⭐ | **Labels** | `labels.md` | 53 Label体系、10カテゴリ |
| ⭐⭐⭐ | **Worktree** | `worktree.md` | Worktreeライフサイクル、並列実行 |
| ⭐⭐⭐ | **Rust** | `rust.md` | Rust 2021 Edition開発ガイド |
| ⭐⭐ | **Protocols** | `protocols.md` | タスク管理、報告プロトコル |
| ⭐⭐ | **External Deps** | `external-deps.md` | Context7、MCP Servers |
| ⭐ | **TypeScript** | `typescript.md` | レガシーTypeScript参考 |

**Full Index**: [.claude/context/INDEX.md](.claude/context/INDEX.md)

---

## 🤖 Agent System

### 21 Agents (Rust Implementation)

**Coding Agents (7)**: CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent

**Business Agents (14)**:
- 戦略・企画系（6個）: AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
- マーケティング系（5個）: MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
- 営業・顧客管理系（3個）: Sales, CRM, Analytics

**Specs**: `.claude/agents/specs/` (21 files)
**Prompts**: `.claude/agents/prompts/` (6 files)

**Character Names**: [.claude/agents/AGENT_CHARACTERS.md](.claude/agents/AGENT_CHARACTERS.md)

---

## 🔐 Environment Variables

Required variables (set in `.env` or environment):

```bash
GITHUB_TOKEN=ghp_xxx           # GitHub access token
ANTHROPIC_API_KEY=sk-xxx       # Anthropic API key (optional)
OPENAI_API_KEY=sk-xxx          # OpenAI API key (for hybrid routing)
DEVICE_IDENTIFIER=MacBook      # Device identifier
GITHUB_REPOSITORY=owner/repo   # Repository name
RUST_LOG=info                  # Log level
RUST_BACKTRACE=1               # Backtrace on panic
```

---

## 🚀 Quick Start

### First Time Setup

1. **Clone & Build**
   ```bash
   cd /Users/shunsuke/Dev/miyabi-private
   cargo build --release
   ```

2. **Setup Environment**
   ```bash
   miyabi setup  # Interactive wizard
   ```

3. **Verify Installation**
   ```bash
   miyabi status
   cargo test --all
   ```

### Daily Workflow

1. **Check Status**
   ```bash
   miyabi status --watch
   ```

2. **Work on Issue**
   ```bash
   miyabi work-on 270
   ```

3. **Parallel Execution**
   ```bash
   miyabi parallel --issues 270,271,272 --concurrency 3
   ```

4. **Review Changes**
   ```bash
   git status
   cargo test --all
   cargo clippy -- -D warnings
   ```

---

## 📖 Key Documentation

**Essential Reading** (⭐⭐⭐⭐⭐):
- [ENTITY_RELATION_MODEL.md](docs/ENTITY_RELATION_MODEL.md) - System architecture
- [LABEL_SYSTEM_GUIDE.md](docs/LABEL_SYSTEM_GUIDE.md) - Label taxonomy
- [.claude/context/core-rules.md](.claude/context/core-rules.md) - Critical rules
- [.claude/MCP_INTEGRATION_PROTOCOL.md](.claude/MCP_INTEGRATION_PROTOCOL.md) - MCP protocol

**Reference**:
- [README.md](README.md) - Project overview
- [QUICKSTART-JA.md](QUICKSTART-JA.md) - Quick start (Japanese)
- [AGENTS.md](AGENTS.md) - Agent system details
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

---

## 🔗 Links

- **Repository**: https://github.com/ShunsukeHayashi/Miyabi
- **Landing Page**: https://shunsukehayashi.github.io/Miyabi/landing.html
- **NPM CLI**: https://www.npmjs.com/package/miyabi
- **NPM SDK**: https://www.npmjs.com/package/miyabi-agent-sdk

---

## 📝 Notes for Claude Code

1. **Always check Context Modules first** - `.claude/context/*.md` contains detailed information
2. **Use Skills for all tasks** - Never implement directly, always delegate
3. **Follow MCP First Approach** - Check MCP availability before starting
4. **Read Issue labels carefully** - 53-label system defines workflow state
5. **Update .ai/logs/** - All executions should be logged

---

**This file is automatically loaded by Claude Code. Keep it up-to-date as the project control center.**

**Version**: 3.0.0 | **Format**: Project Root & Control Document | **Maintained by**: Miyabi Team
