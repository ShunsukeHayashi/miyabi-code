# Miyabi - Directory Structure

**Last Updated**: 2025-10-25
**Version**: v0.1.1 (Rust Edition)

---

## 📁 Project Structure Overview

```
miyabi-private/
├── 🦀 RUST CORE (Primary)
│   ├── crates/              # Rust workspace crates (42 crates)
│   │   ├── miyabi-core/           # Core utilities
│   │   ├── miyabi-types/          # Type definitions
│   │   ├── miyabi-cli/            # CLI binary
│   │   ├── miyabi-agents/         # 21 autonomous agents
│   │   ├── miyabi-github/         # GitHub API integration
│   │   ├── miyabi-worktree/       # Git worktree management
│   │   ├── miyabi-llm/            # LLM abstraction layer
│   │   ├── miyabi-knowledge/      # Knowledge management
│   │   ├── miyabi-mcp-server/     # MCP JSON-RPC server
│   │   ├── miyabi-historical-ai/  # Historical AI avatars (NEW)
│   │   ├── miyabi-historical-api/ # Historical AI API (NEW)
│   │   ├── miyabi-line/           # LINE Bot integration
│   │   └── ...                    # (38 more crates)
│   ├── shinyu-ai/           # Fortune-telling app (NEW)
│   └── Cargo.toml           # Workspace manifest
│
├── 📚 PROJECTS (Organized Documentation)
│   ├── projects/            # Multi-project documentation hub
│   │   ├── historical-ai/   # Historical AI platform docs
│   │   ├── line-bot/        # LINE Bot docs
│   │   ├── shinyu/          # Shinyu fortune app docs
│   │   └── miyabi-core/     # Core framework docs
│   └── README.md            # Project index
│
├── 📖 DOCUMENTATION
│   ├── docs/                # Comprehensive documentation (255 files)
│   │   ├── ENTITY_RELATION_MODEL.md
│   │   ├── TEMPLATE_MASTER_INDEX.md
│   │   ├── LABEL_SYSTEM_GUIDE.md
│   │   ├── schemas/         # JSON schemas
│   │   └── ...
│   ├── .claude/             # Claude Code context & agents
│   │   ├── context/         # Context modules
│   │   ├── agents/          # Agent specifications
│   │   └── commands/        # Custom slash commands
│   └── sales-materials/     # Sales & marketing materials
│
├── 🔧 DEVELOPMENT TOOLS
│   ├── scripts/             # Build & utility scripts
│   ├── tools/               # Development tools
│   ├── tests/               # Integration tests
│   ├── tutorials/           # Tutorial examples
│   └── benchmarks/          # Performance benchmarks
│
├── 🌐 WEB & INTEGRATION (Mixed Stack)
│   ├── miyabi-web/          # Web frontend (React/Next.js)
│   ├── miyabi-dashboard/    # Dashboard app (separate git, excluded)
│   ├── api/                 # REST API (TypeScript - Legacy)
│   ├── packages/            # NPM packages (TypeScript - Legacy)
│   └── integrations/        # External integrations (22M)
│
├── 🔌 SERVICES & EXTERNAL
│   ├── mcp-servers/         # MCP server configurations
│   ├── services/            # External service integrations
│   ├── external/            # External dependencies
│   └── database/            # Database schemas
│
├── 📦 BUILD ARTIFACTS (Ignored)
│   ├── target/              # Rust build output
│   ├── node_modules/        # NPM dependencies
│   ├── dist/                # TypeScript compiled output
│   ├── coverage/            # Test coverage reports
│   ├── logs/                # Runtime logs
│   └── reports/             # Test/analysis reports
│
└── 🔒 CONFIGURATION
    ├── Cargo.toml           # Rust workspace config
    ├── package.json         # Node.js config (legacy tests)
    ├── docker-compose.yml   # Docker orchestration
    ├── .gitignore           # Git ignore rules
    └── .env.example         # Environment template
```

---

## 📊 Directory Categories

### 🦀 Rust Core (Primary Development)

**Status**: ✅ Active - Primary development focus
**Language**: Rust 2021 Edition
**Size**: ~42 crates

All active development happens in `crates/` and root-level Rust projects.

#### Key Crates:
- **miyabi-cli**: Main CLI entry point (binary)
- **miyabi-agents**: 21 autonomous agents (7 coding + 14 business)
- **miyabi-worktree**: Parallel execution via git worktrees
- **miyabi-knowledge**: RAG-based knowledge management
- **miyabi-line**: LINE Bot integration
- **shinyu-ai**: Fortune-telling full-stack app

### 📚 Projects Hub

**Status**: 🆕 New - Organized documentation
**Purpose**: Multi-project documentation management

The `projects/` directory provides:
- Project-specific README files
- Business plans & architecture docs
- Symbolic links to implementation crates
- Unified project index

### 📖 Documentation

**Status**: ✅ Active - Continuously updated
**Files**: 255+ markdown files

Key documentation:
- `.claude/`: Claude Code integration & agent specs
- `docs/`: Comprehensive guides & schemas
- `sales-materials/`: Marketing & sales content

### 🌐 Web & TypeScript (Legacy Support)

**Status**: ⚠️ Maintenance - Gradually migrating to Rust
**Language**: TypeScript/JavaScript
**Files**: ~177 TS/JS files

Legacy components still in use:
- `api/`: REST API server (being replaced by Rust Axum)
- `packages/`: NPM packages (some still used for MCP tests)
- `utils/`, `workflow-automation/`: Helper utilities

**Migration Plan**: These will be gradually replaced by Rust equivalents.

### 🔧 Development Tools

**Status**: ✅ Active
**Purpose**: Build automation, testing, tutorials

- `scripts/`: Shell scripts for common tasks
- `tools/`: Development utilities
- `tests/`: Integration test suites
- `tutorials/`: Learning materials

### 🔌 Integrations & Services

**Status**: ✅ Active
**Size**: 22M (integrations/)

External service integrations:
- MCP servers
- Database connectors
- Third-party APIs

---

## 🗂️ File Organization Rules

### What Goes Where?

| Content Type | Location | Example |
|--------------|----------|---------|
| Rust implementation | `crates/miyabi-*/` | Core features, agents, CLI |
| Project docs | `projects/*/` | Business plans, architecture |
| Technical docs | `docs/` | Guides, schemas, references |
| Agent specs | `.claude/agents/` | Agent prompts & specifications |
| Build scripts | `scripts/` | Deployment, testing automation |
| Tests | `tests/`, `crates/*/tests/` | Integration & unit tests |
| Legacy TS code | `api/`, `packages/`, `utils/` | Gradually being replaced |

### Git Tracking

**Tracked**:
- All Rust source code (`crates/`, `shinyu-ai/`)
- Documentation (`docs/`, `projects/`, `.claude/`)
- Configuration files (`Cargo.toml`, `package.json`)
- Scripts & tools

**Ignored** (see `.gitignore`):
- Build artifacts (`target/`, `dist/`, `node_modules/`)
- Runtime files (`logs/`, `reports/`, `coverage/`)
- Environment files (`.env`, `.env.local`)
- Temporary directories (`.worktrees*/`, `miyabi-dashboard/`)
- Build metadata (`*.profraw`, `*.tsbuildinfo`)

---

## 🚀 Quick Navigation

### For Rust Development:
```bash
cd crates/miyabi-cli/        # CLI development
cd crates/miyabi-agents/     # Agent development
cd crates/miyabi-knowledge/  # Knowledge system
```

### For Documentation:
```bash
cd docs/                     # Browse technical docs
cd .claude/agents/           # Agent specifications
cd projects/                 # Project documentation
```

### For Project Management:
```bash
cat projects/README.md       # Project index
cd projects/historical-ai/   # Historical AI project
cd projects/line-bot/        # LINE Bot project
```

---

## 📈 Growth Strategy

### Current Focus (v0.1.1):
- ✅ Rust core implementation
- ✅ 21 autonomous agents
- ✅ Multi-project organization

### Near-term (v0.2.0):
- 🔄 Migrate remaining TypeScript to Rust
- 📦 Publish to crates.io
- 🌐 Enhanced web dashboard

### Long-term:
- 🗑️ Remove legacy TypeScript completely
- 🎯 Pure Rust codebase
- 📊 Enterprise features

---

## 🤝 Contributing

When adding new features:

1. **Rust code** → Create new crate in `crates/`
2. **Project** → Add to `projects/` with README
3. **Documentation** → Update `docs/` and `.claude/context/`
4. **Scripts** → Add to `scripts/` or `tools/`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

**Generated**: 2025-10-25
**Maintainer**: Shunsuke Hayashi
**Framework**: Miyabi v0.1.1 (Rust Edition)
