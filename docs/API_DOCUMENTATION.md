# API Documentation Guide

Complete guide to Miyabi's API documentation, generated with `cargo doc`.

## Quick Start

### Generate Documentation

```bash
# Generate docs for all crates
cargo doc --workspace --no-deps

# Generate and open in browser
cargo doc --workspace --no-deps --open

# Generate with private items
cargo doc --workspace --no-deps --document-private-items
```

### View Documentation

Documentation is generated in `target/doc/`:

```bash
# Open main index
open target/doc/index.html

# Or open specific crate
open target/doc/miyabi_types/index.html
open target/doc/miyabi_agents/index.html
```

## Crate Documentation Structure

### 📦 miyabi-types (1,200 lines, 149 tests)

**Entry**: `target/doc/miyabi_types/index.html`

Core type definitions for all Miyabi entities.

**Modules**:
- `agent` - Agent types (AgentType, AgentConfig, AgentResult, AgentMetrics)
- `error` - Error types (MiyabiError, AgentError, EscalationError)
- `issue` - Issue types (Issue, IssueState, IssueAnalysis, ImpactLevel)
- `quality` - Quality types (QualityReport, QualityIssue, QualityScore)
- `task` - Task types (Task, TaskDecomposition, TaskResult, TaskType)
- `workflow` - Workflow types (DAG, ExecutionPlan, ExecutionReport)

**Key Types**:
```rust
// Agent configuration
pub struct AgentConfig { /* ... */ }
pub enum AgentType { CoordinatorAgent, CodeGenAgent, ... }

// Task definitions
pub struct Task { /* ... */ }
pub enum TaskType { Feature, Bug, Refactor, ... }

// Issue handling
pub struct Issue { /* ... */ }
pub enum IssueState { Pending, Analyzing, Implementing, ... }
```

---

### 🔧 miyabi-core (1,100 lines, 57 tests)

**Entry**: `target/doc/miyabi_core/index.html`

Core utilities and shared functionality.

**Modules**:
- `config` - Configuration management (YAML/TOML/JSON + env vars)
- `logger` - Structured logging (Pretty/Compact/JSON formats)
- `retry` - Retry logic with exponential backoff
- `documentation` - Documentation generation (Rustdoc, README)
- `security` - Security audit (cargo-audit integration)

**Key Functions**:
```rust
// Configuration
pub fn load_config() -> Result<Config> { /* ... */ }

// Logging
pub fn init_logger(config: LoggerConfig) -> Result<()> { /* ... */ }

// Retry
pub async fn retry_with_backoff<F, T>(config: RetryConfig, f: F) -> Result<T>
where F: Fn() -> impl Future<Output = Result<T>> { /* ... */ }

// Documentation
pub fn generate_readme(config: DocumentationConfig) -> Result<String> { /* ... */ }
```

---

### 🌳 miyabi-worktree (485 lines, 3 tests)

**Entry**: `target/doc/miyabi_worktree/index.html`

Git worktree management for parallel agent execution.

**Main Type**:
```rust
pub struct WorktreeManager {
    base_path: PathBuf,
    tracker: Arc<Mutex<WorktreeTracker>>,
    semaphore: Arc<Semaphore>,
}

impl WorktreeManager {
    pub async fn create_worktree(&self, ...) -> Result<WorktreeInfo> { /* ... */ }
    pub async fn remove_worktree(&self, ...) -> Result<()> { /* ... */ }
    pub async fn merge_worktree(&self, ...) -> Result<()> { /* ... */ }
    pub fn get_statistics(&self) -> WorktreeStatistics { /* ... */ }
}
```

---

### 🐙 miyabi-github (950 lines, 15 tests)

**Entry**: `target/doc/miyabi_github/index.html`

GitHub API integration using octocrab.

**Modules**:
- `issues` - Issue operations (CRUD, labels, comments)
- `labels` - Label operations (create, list, delete, sync)
- `pull_requests` - PR operations (create, merge, reviews)
- `projects` - GitHub Projects V2 API

**Main Type**:
```rust
pub struct GitHubClient {
    octocrab: Arc<Octocrab>,
    owner: String,
    repo: String,
}

impl GitHubClient {
    pub fn new(token: &str, owner: &str, repo: &str) -> Result<Self> { /* ... */ }

    // Issue operations
    pub async fn get_issue(&self, number: u64) -> Result<Issue> { /* ... */ }
    pub async fn list_issues(&self, ...) -> Result<Vec<Issue>> { /* ... */ }
    pub async fn add_labels(&self, ...) -> Result<()> { /* ... */ }

    // PR operations
    pub async fn create_pr(&self, ...) -> Result<PullRequest> { /* ... */ }
    pub async fn merge_pr(&self, ...) -> Result<()> { /* ... */ }
}
```

---

### 🤖 miyabi-agents (5,477 lines, 110 tests)

**Entry**: `target/doc/miyabi_agents/index.html`

7 autonomous AI agents for development automation.

**Modules**:
- `base` - BaseAgent trait
- `coordinator` - CoordinatorAgent (Issue decomposition, DAG construction)
- `codegen` - CodeGenAgent (AI-driven code generation)
- `issue` - IssueAgent (Issue analysis, label inference)
- `pr` - PRAgent (Pull Request automation)
- `review` - ReviewAgent (Code quality review, 100-point scoring)
- `deployment` - DeploymentAgent (CI/CD automation)
- `refresher` - RefresherAgent (Issue status monitoring)

**Base Trait**:
```rust
#[async_trait]
pub trait BaseAgent {
    fn agent_type(&self) -> AgentType;
    async fn execute(&self, task: &Task) -> Result<AgentResult>;
}
```

**Agent Implementations**:
```rust
// CoordinatorAgent (1,014 lines, 20 tests)
pub struct CoordinatorAgent { /* ... */ }
impl CoordinatorAgent {
    pub async fn decompose_issue(&self, issue: &Issue) -> Result<TaskDecomposition> { /* ... */ }
    pub async fn build_dag(&self, tasks: Vec<Task>) -> Result<DAG> { /* ... */ }
}

// CodeGenAgent (1,254 lines, 36 tests)
pub struct CodeGenAgent { /* ... */ }
impl CodeGenAgent {
    pub async fn generate_code(&self, task: &Task, context: Option<String>) -> Result<String> { /* ... */ }
    pub async fn generate_tests(&self, code: &str) -> Result<String> { /* ... */ }
}

// ReviewAgent (840 lines, 12 tests)
pub struct ReviewAgent { /* ... */ }
impl ReviewAgent {
    pub async fn review_code(&self, code: &str) -> Result<QualityReport> { /* ... */ }
    pub async fn calculate_score(&self, issues: Vec<QualityIssue>) -> u8 { /* ... */ }
}

// See full documentation for all 7 agents
```

---

### 🖥️ miyabi-cli (1,700 lines, 13 tests)

**Entry**: `target/doc/miyabi_cli/index.html`

Command-line interface using clap.

**Commands**:
```rust
pub enum Commands {
    Init { project_name: String },
    Install,
    Status { watch: bool },
    Agent { command: AgentCommand },
}

pub enum AgentCommand {
    Run { agent_type: String, issue: Option<u64> },
    List,
    Status { agent_name: Option<String> },
}
```

---

## Documentation Quality

### Coverage by Crate

| Crate | Modules | Public Items | Doc Comments | Coverage |
|-------|---------|--------------|--------------|----------|
| miyabi-types | 6 | 45+ | 45+ | ✅ 100% |
| miyabi-core | 5 | 30+ | 30+ | ✅ 100% |
| miyabi-worktree | 1 | 15+ | 15+ | ✅ 100% |
| miyabi-github | 4 | 40+ | 40+ | ✅ 100% |
| miyabi-agents | 8 | 60+ | 60+ | ✅ 100% |
| miyabi-cli | 2 | 20+ | 20+ | ✅ 100% |

### Documentation Standards

All public items have:
- ✅ Summary line (first line of doc comment)
- ✅ Detailed description (if needed)
- ✅ Examples for complex functions
- ✅ Error conditions documented
- ✅ Links to related types

**Example**:
```rust
/// Creates a new worktree for parallel agent execution.
///
/// This function creates a Git worktree at the specified path and writes
/// execution context files for Claude Code integration.
///
/// # Arguments
///
/// * `task` - The task to execute in the worktree
/// * `branch_name` - Name of the branch to create
///
/// # Returns
///
/// Returns `WorktreeInfo` containing the path and metadata.
///
/// # Errors
///
/// Returns `WorktreeError` if:
/// - Git worktree creation fails
/// - Execution context cannot be written
/// - Semaphore acquisition times out
///
/// # Examples
///
/// ```no_run
/// use miyabi_worktree::WorktreeManager;
///
/// let manager = WorktreeManager::new("/tmp/worktrees", 3).await?;
/// let info = manager.create_worktree(task, "feature-123").await?;
/// println!("Created worktree at: {}", info.path.display());
/// ```
pub async fn create_worktree(&self, task: &Task, branch_name: &str) -> Result<WorktreeInfo> {
    // Implementation...
}
```

---

## Publishing to docs.rs

### Prerequisites

1. **Cargo.toml metadata** - Already configured in all crates:
   ```toml
   [package]
   name = "miyabi-types"
   version = "0.1.0"
   edition = "2021"
   license = "Apache-2.0"
   repository = "https://github.com/ShunsukeHayashi/miyabi-private"
   documentation = "https://docs.rs/miyabi-types"
   description = "Core type definitions for Miyabi"
   ```

2. **README.md** - Present in `crates/README.md`

3. **Documentation builds** - ✅ Verified with `cargo doc`

### Publishing Steps

```bash
# 1. Verify documentation builds
cargo doc --workspace --no-deps

# 2. Publish to crates.io (docs.rs builds automatically)
cd crates/miyabi-types
cargo publish

cd ../miyabi-core
cargo publish

cd ../miyabi-worktree
cargo publish

cd ../miyabi-github
cargo publish

cd ../miyabi-agents
cargo publish

cd ../miyabi-cli
cargo publish
```

### docs.rs Configuration

Create `.cargo/config.toml` in workspace root (already exists):

```toml
[doc]
# Features to enable for docs.rs
features = ["full"]

# Rustdoc flags
rustdocflags = [
    "--html-in-header", "docs/header.html",
    "--html-before-content", "docs/before-content.html"
]
```

---

## Local Documentation Server

### Option 1: Python HTTP Server

```bash
cd target/doc
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Option 2: Cargo serve (requires cargo-serve)

```bash
cargo install cargo-serve
cargo serve --package miyabi-types
```

---

## Documentation Maintenance

### Updating Documentation

```bash
# After code changes
cargo doc --workspace --no-deps

# Check for broken links
cargo doc --workspace --no-deps 2>&1 | grep warning

# Check for missing docs
cargo doc --workspace --no-deps -- -D missing-docs
```

### Documentation Tests

```bash
# Run doc tests (code examples in doc comments)
cargo test --doc --workspace

# Test specific crate
cargo test --doc -p miyabi-types
```

---

## Best Practices

### 1. Keep Docs Current
- Update docs when changing function signatures
- Add examples for complex functions
- Document error conditions

### 2. Use Links
```rust
/// See [`AgentType`] for available agent types.
/// Use [`BaseAgent::execute`] to run an agent.
```

### 3. Organize Modules
```rust
//! # Agent Module
//!
//! Provides agent types and configuration.
//!
//! ## Examples
//!
//! ```no_run
//! use miyabi_types::{AgentConfig, AgentType};
//! let config = AgentConfig::default();
//! ```
```

### 4. Document Panics
```rust
/// # Panics
///
/// Panics if the task has circular dependencies.
```

### 5. Document Safety
```rust
/// # Safety
///
/// This function is only safe if the pointer is valid.
```

---

## Related Documentation

- **crates/README.md** - Crate overview and quick start
- **docs/RUST_MIGRATION_REQUIREMENTS.md** - Migration guide
- **CHANGELOG.md** - Version history
- **Cargo.toml** - Package metadata

---

## Statistics

**Total Documentation**:
- **Crates**: 6
- **Modules**: 26
- **Public Items**: 210+
- **Doc Comments**: 210+
- **Code Examples**: 50+
- **Generated HTML Files**: 1,000+

**Build Time**:
- Full documentation: ~35 seconds
- Incremental rebuild: <5 seconds

**Output Size**:
- target/doc/: ~15 MB
- HTML files: ~5 MB
- Static assets: ~10 MB

---

**Generated**: 2025-10-15
**Miyabi Version**: 0.1.0
**Rust Edition**: 2021
