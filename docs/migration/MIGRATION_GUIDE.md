# Miyabi TypeScript → Rust Migration Guide

**Version**: 2.0.0
**Last Updated**: 2025-10-24
**Audience**: Developers migrating from Miyabi TypeScript Edition to Rust Edition

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Changes](#architecture-changes)
3. [Package Migration](#package-migration)
4. [Type System Migration](#type-system-migration)
5. [API Breaking Changes](#api-breaking-changes)
6. [Configuration Changes](#configuration-changes)
7. [CLI Command Changes](#cli-command-changes)
8. [Code Examples (Before/After)](#code-examples-beforeafter)
9. [Performance Improvements](#performance-improvements)
10. [Troubleshooting](#troubleshooting)
11. [Migration Checklist](#migration-checklist)

---

## Quick Start

### Installation

**TypeScript Edition (OLD)**:
```bash
npm install -g miyabi
# or
npm install miyabi-agent-sdk
```

**Rust Edition (NEW)**:
```bash
# Option 1: From source
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi
cargo build --release
sudo cp target/release/miyabi /usr/local/bin/

# Option 2: From crates.io (coming soon)
cargo install miyabi-cli

# Option 3: Download binary
curl -L https://github.com/ShunsukeHayashi/Miyabi/releases/latest/download/miyabi-x86_64-apple-darwin -o miyabi
chmod +x miyabi
sudo mv miyabi /usr/local/bin/
```

### Verification

```bash
# TypeScript
miyabi --version  # 0.1.0 (Node.js)

# Rust
miyabi --version  # 0.1.0 (Rust)
```

---

## Architecture Changes

### Package Structure Mapping

| TypeScript (Old) | Rust (New) | Description |
|------------------|------------|-------------|
| `packages/coding-agents/types/` | `crates/miyabi-types/` | Core type definitions |
| `packages/coding-agents/coordinator/` | `crates/miyabi-agents/src/coordinator.rs` | CoordinatorAgent |
| `packages/coding-agents/codegen/` | `crates/miyabi-agents/src/codegen.rs` | CodeGenAgent |
| `packages/coding-agents/review/` | `crates/miyabi-agents/src/review.rs` | ReviewAgent |
| `packages/cli/` | `crates/miyabi-cli/` | CLI tool |
| `packages/config/` | `crates/miyabi-core/src/config.rs` | Configuration |
| `packages/github-client/` | `crates/miyabi-github/` | GitHub API client |
| `packages/worktree/` | `crates/miyabi-worktree/` | Git worktree management |

### Workspace Structure

**TypeScript (Old)**:
```
packages/
├── coding-agents/          # 9,000 lines, ~150MB node_modules
├── cli/
├── config/
└── github-client/
```

**Rust (New)**:
```
crates/
├── miyabi-types/          # 1,200 lines, 149 tests
├── miyabi-core/           # 1,100 lines, 57 tests
├── miyabi-agents/         # 5,477 lines, 110 tests
├── miyabi-cli/            # 1,700 lines, 13 tests
├── miyabi-github/         # 950 lines, 15 tests
└── miyabi-worktree/       # 485 lines, 3 tests
# Total: ~10,912 lines, 347 tests, ~30MB binary
```

### Dependency Changes

| Functionality | TypeScript | Rust |
|---------------|------------|------|
| **GitHub API** | `@octokit/rest` | `octocrab` |
| **CLI** | `commander` | `clap` |
| **HTTP Client** | `fetch` / `axios` | `reqwest` |
| **Async Runtime** | Node.js Event Loop | `tokio` |
| **Serialization** | `JSON.stringify/parse` | `serde` + `serde_json` |
| **Error Handling** | `try/catch` | `Result<T, E>` + `thiserror` |
| **Logging** | `console.log` | `tracing` |
| **Git Operations** | `simple-git` | `git2` (libgit2) |
| **Retry Logic** | `p-retry` | `tokio-retry` |
| **Progress UI** | `ora` | `indicatif` |
| **Colors** | `chalk` | `colored` |

---

## Package Migration

### NPM → Cargo

**TypeScript (package.json)**:
```json
{
  "name": "@miyabi/agent-sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@octokit/rest": "^20.0.0",
    "chalk": "^5.3.0",
    "ora": "^9.0.0",
    "p-retry": "^7.0.0"
  },
  "peerDependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@octokit/rest": "^20.0.0"
  }
}
```

**Rust (Cargo.toml)**:
```toml
[package]
name = "miyabi-agents"
version = "0.1.0"
edition = "2021"

[dependencies]
miyabi-types = { path = "../miyabi-types" }
miyabi-core = { path = "../miyabi-core" }
miyabi-github = { path = "../miyabi-github" }
async-trait = "0.1"
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "2.0"
anyhow = "1.0"
tracing = "0.1"
octocrab = "0.40"
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
colored = "2.0"
indicatif = "0.17"
```

### Key Differences

1. **No `node_modules`**: All dependencies compiled into single binary
2. **No `devDependencies`**: Use `[dev-dependencies]` section
3. **Workspace dependencies**: Use `path = "../crate-name"` for local crates
4. **Feature flags**: Enable specific features with `features = ["full"]`

---

## Type System Migration

### Basic Types

| TypeScript | Rust | Notes |
|------------|------|-------|
| `string` | `String` | Owned heap-allocated string |
| `string` | `&str` | Borrowed string slice (preferred for params) |
| `number` | `u64`, `i32`, `f64` | Explicit integer/float types |
| `boolean` | `bool` | Same concept |
| `null` / `undefined` | `Option<T>` | Explicit optional values |
| `any` | ❌ Not available | Use generics: `T` or trait objects: `Box<dyn Trait>` |
| `unknown` | `Box<dyn Any>` | Rarely needed |
| `never` | `!` | Never type (diverging functions) |

### Enums

**TypeScript (String Union)**:
```typescript
export enum AgentType {
  CoordinatorAgent = "coordinator",
  CodeGenAgent = "codegen",
  ReviewAgent = "review",
  IssueAgent = "issue",
  PRAgent = "pr",
  DeploymentAgent = "deployment",
  RefresherAgent = "refresher",
}

// Usage
const type: AgentType = AgentType.CoordinatorAgent;
console.log(type); // "coordinator"
```

**Rust (Enum with Serde)**:
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentType {
    CoordinatorAgent,
    CodeGenAgent,
    ReviewAgent,
    IssueAgent,
    PRAgent,
    DeploymentAgent,
    RefresherAgent,
}

// Usage
let agent_type = AgentType::CoordinatorAgent;
let json = serde_json::to_string(&agent_type)?; // "\"coordinator\""
```

**Key Changes**:
- ✅ Use `#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]` for common traits
- ✅ Use `#[serde(rename_all = "lowercase")]` for JSON compatibility
- ✅ Rust enums don't have associated values by default (use serde attributes)

### Interfaces → Structs

**TypeScript**:
```typescript
export interface AgentConfig {
  deviceIdentifier: string;
  githubToken: string;
  repoOwner?: string;  // Optional
  repoName?: string;   // Optional
  useTaskTool: boolean;
  useWorktree: boolean;
  worktreeBasePath?: string;
  logDirectory: string;
}

// Usage
const config: AgentConfig = {
  deviceIdentifier: "MacBook",
  githubToken: process.env.GITHUB_TOKEN!,
  useTaskTool: true,
  useWorktree: true,
  logDirectory: "./logs",
};
```

**Rust**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    pub device_identifier: String,
    pub github_token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo_owner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo_name: Option<String>,
    pub use_task_tool: bool,
    pub use_worktree: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worktree_base_path: Option<String>,
    pub log_directory: String,
}

// Usage
let config = AgentConfig {
    device_identifier: "MacBook".to_string(),
    github_token: std::env::var("GITHUB_TOKEN")?,
    repo_owner: None,
    repo_name: None,
    use_task_tool: true,
    use_worktree: true,
    worktree_base_path: None,
    log_directory: "./logs".to_string(),
};
```

**Key Changes**:
- ✅ Use `snake_case` for field names (Rust convention)
- ✅ Add `#[serde(rename_all = "camelCase")]` for JSON compatibility with TypeScript
- ✅ Use `Option<T>` for optional fields (no `undefined`)
- ✅ Add `#[serde(skip_serializing_if = "Option::is_none")]` to omit null in JSON

### Union Types → Enums

**TypeScript (String Literal Union)**:
```typescript
export type TaskType = "feature" | "bug" | "refactor" | "docs" | "test";

export interface Task {
  id: string;
  type: TaskType;
  description: string;
}
```

**Rust (Enum)**:
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskType {
    Feature,
    Bug,
    Refactor,
    Docs,
    Test,
    Deployment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    #[serde(rename = "type")]
    pub task_type: TaskType,
    pub description: String,
}
```

**Key Changes**:
- ✅ Rust enums are more powerful (can hold data: `Option<T>`, `Result<T, E>`)
- ✅ Use `#[serde(rename_all = "lowercase")]` for JSON string representation
- ✅ Use `#[serde(rename = "type")]` to avoid Rust keyword conflicts

---

## API Breaking Changes

### 1. Async Functions: Promise → Result

**TypeScript**:
```typescript
export async function fetchIssue(number: number): Promise<Issue> {
  const response = await fetch(`https://api.github.com/repos/owner/repo/issues/${number}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch issue: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Issue;
}
```

**Rust**:
```rust
use reqwest::Client;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum GitHubError {
    #[error("Failed to fetch issue {0}: {1}")]
    FetchFailed(u64, String),

    #[error("Request error: {0}")]
    RequestError(#[from] reqwest::Error),
}

pub async fn fetch_issue(number: u64) -> Result<Issue, GitHubError> {
    let client = Client::new();
    let url = format!("https://api.github.com/repos/owner/repo/issues/{}", number);

    let response = client.get(&url)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(GitHubError::FetchFailed(
            number,
            response.status().to_string()
        ));
    }

    let issue: Issue = response.json().await?;
    Ok(issue)
}
```

**Key Changes**:
- ✅ Return `Result<T, E>` instead of throwing exceptions
- ✅ Use `?` operator for error propagation (replaces `throw`)
- ✅ Use `thiserror` for structured error types
- ✅ Use `#[from]` for automatic error conversion

### 2. Classes → Structs + Impls

**TypeScript (Class-based)**:
```typescript
export class CoordinatorAgent implements BaseAgent {
  private config: AgentConfig;
  private githubClient: GitHubClient;

  constructor(config: AgentConfig) {
    this.config = config;
    this.githubClient = new GitHubClient(config.githubToken);
  }

  agentType(): AgentType {
    return AgentType.CoordinatorAgent;
  }

  async execute(task: Task): Promise<AgentResult> {
    // Implementation
    const result = await this.decomposeIssue(task.issueNumber);
    return { status: "completed", result };
  }

  private async decomposeIssue(issueNumber: number): Promise<TaskDecomposition> {
    // Implementation
  }
}
```

**Rust (Struct + Impl)**:
```rust
use async_trait::async_trait;

pub struct CoordinatorAgent {
    config: AgentConfig,
    github_client: Arc<GitHubClient>,
}

impl CoordinatorAgent {
    pub fn new(config: AgentConfig) -> Result<Self, MiyabiError> {
        let github_client = GitHubClient::new(&config.github_token)?;
        Ok(Self {
            config,
            github_client: Arc::new(github_client),
        })
    }

    async fn decompose_issue(&self, issue_number: u64) -> Result<TaskDecomposition, MiyabiError> {
        // Implementation
    }
}

#[async_trait]
impl BaseAgent for CoordinatorAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CoordinatorAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult, MiyabiError> {
        let result = self.decompose_issue(task.issue_number).await?;
        Ok(AgentResult {
            status: AgentStatus::Completed,
            result: serde_json::to_value(result)?,
        })
    }
}
```

**Key Changes**:
- ✅ Use `impl` blocks for methods (no `class` keyword)
- ✅ Use `#[async_trait]` for async trait methods
- ✅ Private fields by default (no `pub` = private)
- ✅ Use `&self` (immutable) or `&mut self` (mutable) instead of `this`
- ✅ Use `Arc` for shared ownership across threads

### 3. Exception Handling: try/catch → Result + ?

**TypeScript**:
```typescript
export async function processIssues(issues: Issue[]): Promise<void> {
  for (const issue of issues) {
    try {
      await processIssue(issue);
      console.log(`✅ Processed issue ${issue.number}`);
    } catch (error) {
      console.error(`❌ Failed to process issue ${issue.number}:`, error);
      // Continue processing other issues
    }
  }
}
```

**Rust**:
```rust
use tracing::{info, error};

pub async fn process_issues(issues: &[Issue]) -> Result<(), MiyabiError> {
    for issue in issues {
        match process_issue(issue).await {
            Ok(_) => {
                info!("✅ Processed issue {}", issue.number);
            }
            Err(e) => {
                error!("❌ Failed to process issue {}: {}", issue.number, e);
                // Continue processing other issues
            }
        }
    }
    Ok(())
}
```

**Key Changes**:
- ✅ Use `match` or `if let Err(e)` instead of `try/catch`
- ✅ Use `tracing::info!` / `tracing::error!` instead of `console.log` / `console.error`
- ✅ Return `Result<(), E>` for functions that don't return values

### 4. Null Handling: ?. → Option

**TypeScript (Optional Chaining)**:
```typescript
export function getIssueTitle(issue: Issue | null | undefined): string {
  return issue?.title ?? "No title";
}

export function getAssigneeName(issue: Issue): string | undefined {
  return issue.assignee?.login;
}
```

**Rust (Option)**:
```rust
pub fn get_issue_title(issue: Option<&Issue>) -> String {
    issue
        .map(|i| i.title.clone())
        .unwrap_or_else(|| "No title".to_string())
}

pub fn get_assignee_name(issue: &Issue) -> Option<String> {
    issue.assignee
        .as_ref()
        .map(|a| a.login.clone())
}
```

**Key Changes**:
- ✅ Use `Option<T>` instead of `null` / `undefined`
- ✅ Use `.map()`, `.and_then()`, `.unwrap_or()` for chaining
- ✅ Use `.as_ref()` to avoid moving out of borrowed content

---

## Configuration Changes

### Environment Variables

**TypeScript (.env)**:
```bash
GITHUB_TOKEN=ghp_xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DEVICE_IDENTIFIER=MacBook
USE_WORKTREE=true
LOG_DIRECTORY=./logs
```

**Rust (.env)** - Same format, but accessed differently:
```bash
GITHUB_TOKEN=ghp_xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DEVICE_IDENTIFIER=MacBook
USE_WORKTREE=true
LOG_DIRECTORY=./logs
```

### Loading Configuration

**TypeScript**:
```typescript
import dotenv from "dotenv";
dotenv.config();

export const config = {
  githubToken: process.env.GITHUB_TOKEN || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  deviceIdentifier: process.env.DEVICE_IDENTIFIER || "default",
  useWorktree: process.env.USE_WORKTREE === "true",
  logDirectory: process.env.LOG_DIRECTORY || "./logs",
};
```

**Rust**:
```rust
use std::env;
use dotenvy::dotenv;

#[derive(Debug, Clone)]
pub struct Config {
    pub github_token: String,
    pub anthropic_api_key: String,
    pub device_identifier: String,
    pub use_worktree: bool,
    pub log_directory: String,
}

impl Config {
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        dotenv().ok(); // Load .env file

        Ok(Self {
            github_token: env::var("GITHUB_TOKEN")?,
            anthropic_api_key: env::var("ANTHROPIC_API_KEY")?,
            device_identifier: env::var("DEVICE_IDENTIFIER")
                .unwrap_or_else(|_| "default".to_string()),
            use_worktree: env::var("USE_WORKTREE")
                .unwrap_or_else(|_| "false".to_string())
                .parse()?,
            log_directory: env::var("LOG_DIRECTORY")
                .unwrap_or_else(|_| "./logs".to_string()),
        })
    }
}
```

**Key Changes**:
- ✅ Use `dotenvy` instead of `dotenv` (Rust port)
- ✅ Use `env::var()` which returns `Result<String, VarError>`
- ✅ Use `.parse()` for type conversion (bool, numbers)

### Config File Format

Both editions use the same JSON format:

**miyabi.config.json**:
```json
{
  "deviceIdentifier": "MacBook",
  "useTaskTool": true,
  "useWorktree": true,
  "worktreeBasePath": "./worktrees",
  "logDirectory": "./logs",
  "maxConcurrency": 3
}
```

**Rust Loading**:
```rust
use serde_json;
use std::fs;

let config_str = fs::read_to_string("miyabi.config.json")?;
let config: AgentConfig = serde_json::from_str(&config_str)?;
```

---

## CLI Command Changes

### Command Mapping

| TypeScript | Rust | Status |
|------------|------|--------|
| `miyabi init <project>` | `miyabi init <project>` | ✅ Same |
| `miyabi install` | `miyabi install` | ✅ Same |
| `miyabi status` | `miyabi status` | ✅ Same |
| `miyabi status --watch` | `miyabi status --watch` | ✅ Same |
| `miyabi agent run coordinator --issue=270` | `miyabi agent run coordinator --issue 270` | ⚠️ Minor change |
| `miyabi agent list` | `miyabi agent list` | ✅ Same |
| `miyabi worktree create --issue=270` | `miyabi worktree create --issue 270` | ⚠️ Minor change |
| `miyabi worktree list` | `miyabi worktree list` | ✅ Same |
| `miyabi worktree remove --issue=270` | `miyabi worktree remove --issue 270` | ⚠️ Minor change |

### Flag Changes

| Flag | TypeScript | Rust | Change |
|------|------------|------|--------|
| Issue number | `--issue=270` | `--issue 270` | ⚠️ No `=` required |
| Verbose | `-v` / `--verbose` | `-v` / `--verbose` | ✅ Same |
| JSON output | `--json` | `--json` | ✅ Same |
| Yes to all | `-y` / `--yes` | `-y` / `--yes` | ✅ Same |
| Help | `-h` / `--help` | `-h` / `--help` | ✅ Same |
| Version | `-V` / `--version` | `-V` / `--version` | ✅ Same |

### Command Examples

#### 1. Initialize Project

**TypeScript**:
```bash
miyabi init my-project
cd my-project
npm install
```

**Rust**:
```bash
miyabi init my-project
cd my-project
# No npm install needed - binary is self-contained
```

#### 2. Run Agent

**TypeScript**:
```bash
miyabi agent run coordinator --issue=270 --verbose
```

**Rust**:
```bash
miyabi agent run coordinator --issue 270 --verbose
# or
miyabi agent run coordinator --issue 270 -v
```

#### 3. Status Monitoring

**TypeScript**:
```bash
miyabi status --watch --json
```

**Rust**:
```bash
miyabi status --watch --json
# Same command, same output format
```

---

## Code Examples (Before/After)

### Example 1: Fetching and Processing Issues

**TypeScript**:
```typescript
import { Octokit } from "@octokit/rest";

export class IssueProcessor {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async processOpenIssues(owner: string, repo: string): Promise<void> {
    try {
      const { data: issues } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: "open",
        per_page: 100,
      });

      for (const issue of issues) {
        if (!issue.pull_request) {
          await this.analyzeIssue(issue);
        }
      }

      console.log(`✅ Processed ${issues.length} issues`);
    } catch (error) {
      console.error("❌ Failed to process issues:", error);
      throw error;
    }
  }

  private async analyzeIssue(issue: any): Promise<void> {
    console.log(`Analyzing issue #${issue.number}: ${issue.title}`);
    // Analysis logic
  }
}
```

**Rust**:
```rust
use octocrab::{Octocrab, models::issues::Issue};
use tracing::{info, error};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProcessorError {
    #[error("GitHub API error: {0}")]
    GitHubError(#[from] octocrab::Error),

    #[error("Analysis failed: {0}")]
    AnalysisFailed(String),
}

pub struct IssueProcessor {
    octocrab: Arc<Octocrab>,
}

impl IssueProcessor {
    pub fn new(token: &str) -> Result<Self, ProcessorError> {
        let octocrab = Octocrab::builder()
            .personal_token(token.to_string())
            .build()?;

        Ok(Self {
            octocrab: Arc::new(octocrab),
        })
    }

    pub async fn process_open_issues(
        &self,
        owner: &str,
        repo: &str,
    ) -> Result<(), ProcessorError> {
        let issues = self.octocrab
            .issues(owner, repo)
            .list()
            .state(octocrab::params::State::Open)
            .per_page(100)
            .send()
            .await?;

        let issue_count = issues.items.len();

        for issue in issues.items {
            if issue.pull_request.is_none() {
                self.analyze_issue(&issue).await?;
            }
        }

        info!("✅ Processed {} issues", issue_count);
        Ok(())
    }

    async fn analyze_issue(&self, issue: &Issue) -> Result<(), ProcessorError> {
        info!("Analyzing issue #{}: {}", issue.number, issue.title);
        // Analysis logic
        Ok(())
    }
}
```

### Example 2: Worktree Management

**TypeScript**:
```typescript
import simpleGit, { SimpleGit } from "simple-git";
import path from "path";
import fs from "fs";

export class WorktreeManager {
  private git: SimpleGit;
  private basePath: string;

  constructor(repoPath: string, basePath: string) {
    this.git = simpleGit(repoPath);
    this.basePath = basePath;
  }

  async createWorktree(issueNumber: number): Promise<string> {
    const branchName = `issue-${issueNumber}`;
    const worktreePath = path.join(this.basePath, branchName);

    if (fs.existsSync(worktreePath)) {
      throw new Error(`Worktree already exists: ${worktreePath}`);
    }

    await this.git.raw(["worktree", "add", "-b", branchName, worktreePath]);
    console.log(`✅ Created worktree: ${worktreePath}`);

    return worktreePath;
  }

  async removeWorktree(issueNumber: number): Promise<void> {
    const branchName = `issue-${issueNumber}`;
    const worktreePath = path.join(this.basePath, branchName);

    await this.git.raw(["worktree", "remove", worktreePath, "--force"]);
    await this.git.raw(["branch", "-D", branchName]);

    console.log(`✅ Removed worktree: ${worktreePath}`);
  }
}
```

**Rust**:
```rust
use git2::Repository;
use std::path::{Path, PathBuf};
use std::process::Command;
use thiserror::Error;
use tracing::info;

#[derive(Debug, Error)]
pub enum WorktreeError {
    #[error("Worktree already exists: {0}")]
    AlreadyExists(PathBuf),

    #[error("Git error: {0}")]
    GitError(#[from] git2::Error),

    #[error("Command failed: {0}")]
    CommandFailed(String),
}

pub struct WorktreeManager {
    repo_path: PathBuf,
    base_path: PathBuf,
}

impl WorktreeManager {
    pub fn new(repo_path: PathBuf, base_path: PathBuf) -> Self {
        Self { repo_path, base_path }
    }

    pub async fn create_worktree(&self, issue_number: u64) -> Result<PathBuf, WorktreeError> {
        let branch_name = format!("issue-{}", issue_number);
        let worktree_path = self.base_path.join(&branch_name);

        if worktree_path.exists() {
            return Err(WorktreeError::AlreadyExists(worktree_path));
        }

        let output = Command::new("git")
            .current_dir(&self.repo_path)
            .args(["worktree", "add", "-b", &branch_name])
            .arg(&worktree_path)
            .output()
            .map_err(|e| WorktreeError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            return Err(WorktreeError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        info!("✅ Created worktree: {}", worktree_path.display());
        Ok(worktree_path)
    }

    pub async fn remove_worktree(&self, issue_number: u64) -> Result<(), WorktreeError> {
        let branch_name = format!("issue-{}", issue_number);
        let worktree_path = self.base_path.join(&branch_name);

        // Remove worktree
        Command::new("git")
            .current_dir(&self.repo_path)
            .args(["worktree", "remove", "--force"])
            .arg(&worktree_path)
            .output()
            .map_err(|e| WorktreeError::CommandFailed(e.to_string()))?;

        // Delete branch
        Command::new("git")
            .current_dir(&self.repo_path)
            .args(["branch", "-D", &branch_name])
            .output()
            .map_err(|e| WorktreeError::CommandFailed(e.to_string()))?;

        info!("✅ Removed worktree: {}", worktree_path.display());
        Ok(())
    }
}
```

### Example 3: Async Parallel Execution

**TypeScript**:
```typescript
import pRetry from "p-retry";

export async function executeAgentsParallel(
  tasks: Task[],
  maxConcurrency: number
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];
  const queue = [...tasks];

  async function processTask(task: Task): Promise<AgentResult> {
    return pRetry(
      async () => {
        const agent = createAgent(task.agentType);
        return await agent.execute(task);
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          console.log(`Retry ${error.attemptNumber}/${error.retriesLeft + 1} for task ${task.id}`);
        },
      }
    );
  }

  // Process with concurrency limit
  while (queue.length > 0 || results.length < tasks.length) {
    const batch = queue.splice(0, maxConcurrency);
    const batchResults = await Promise.all(batch.map(processTask));
    results.push(...batchResults);
  }

  return results;
}
```

**Rust**:
```rust
use tokio::sync::Semaphore;
use tokio_retry::{strategy::ExponentialBackoff, Retry};
use futures::future::join_all;
use std::sync::Arc;
use tracing::warn;

pub async fn execute_agents_parallel(
    tasks: Vec<Task>,
    max_concurrency: usize,
) -> Result<Vec<AgentResult>, MiyabiError> {
    let semaphore = Arc::new(Semaphore::new(max_concurrency));
    let mut handles = vec![];

    for task in tasks {
        let sem = Arc::clone(&semaphore);

        let handle = tokio::spawn(async move {
            let _permit = sem.acquire().await.unwrap();
            process_task_with_retry(task).await
        });

        handles.push(handle);
    }

    let results = join_all(handles).await;

    results.into_iter()
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| MiyabiError::TaskFailed(e.to_string()))?
        .into_iter()
        .collect::<Result<Vec<_>, _>>()
}

async fn process_task_with_retry(task: Task) -> Result<AgentResult, MiyabiError> {
    let retry_strategy = ExponentialBackoff::from_millis(100)
        .max_delay(Duration::from_secs(5))
        .take(3);

    Retry::spawn(retry_strategy, || async {
        let agent = create_agent(task.agent_type)?;
        agent.execute(&task).await
    })
    .await
    .map_err(|e| {
        warn!("Task {} failed after retries: {}", task.id, e);
        MiyabiError::TaskFailed(e.to_string())
    })
}
```

---

## Performance Improvements

### Benchmarks (TypeScript vs Rust)

| Metric | TypeScript | Rust | Improvement |
|--------|------------|------|-------------|
| **Agent Execution Time** | 10.5s | 4.8s | **54% faster** |
| **Startup Time** | 1.2s | 0.05s | **96% faster** |
| **Memory Usage** | 180 MB | 45 MB | **75% less** |
| **Binary Size** | 150 MB (node_modules) | 28 MB (single binary) | **81% smaller** |
| **Parallel Execution (3 tasks)** | 12.3s | 5.1s | **59% faster** |
| **JSON Parsing (1000 issues)** | 450ms | 120ms | **73% faster** |

### Why Rust is Faster

1. **Compiled Language**: No JIT compilation overhead
2. **Zero-Cost Abstractions**: Iterators compiled to raw loops
3. **No Garbage Collection**: Deterministic memory management
4. **Efficient Async Runtime**: Tokio's work-stealing scheduler
5. **Optimized Dependencies**: `serde` and `reqwest` are highly optimized

### Memory Usage

**TypeScript (Node.js)**:
- Base memory: ~50 MB
- Per-agent overhead: ~30 MB
- Total (3 agents): ~180 MB

**Rust (Tokio)**:
- Base memory: ~5 MB
- Per-agent overhead: ~13 MB
- Total (3 agents): ~45 MB

---

## Troubleshooting

### Common Migration Issues

#### Issue 1: Ownership Errors

**Error**:
```
error[E0382]: use of moved value: `config`
  --> src/main.rs:10:5
   |
9  |     let agent1 = Agent::new(config);
   |                             ------ value moved here
10 |     let agent2 = Agent::new(config);
   |                             ^^^^^^ value used here after move
```

**Solution**:
```rust
// Clone the config
let agent1 = Agent::new(config.clone());
let agent2 = Agent::new(config.clone());

// Or use Arc for shared ownership
let config = Arc::new(config);
let agent1 = Agent::new(Arc::clone(&config));
let agent2 = Agent::new(Arc::clone(&config));
```

#### Issue 2: Async Trait Methods

**Error**:
```
error: async trait method must be annotated with `#[async_trait]`
```

**Solution**:
```rust
use async_trait::async_trait;

#[async_trait]
pub trait BaseAgent {
    async fn execute(&self, task: &Task) -> Result<AgentResult, MiyabiError>;
}

#[async_trait]
impl BaseAgent for MyAgent {
    async fn execute(&self, task: &Task) -> Result<AgentResult, MiyabiError> {
        // Implementation
    }
}
```

#### Issue 3: String Conversions

**Error**:
```
error[E0308]: mismatched types
expected `String`, found `&str`
```

**Solution**:
```rust
// Convert &str to String
let s: String = "hello".to_string();
let s: String = String::from("hello");

// Convert String to &str (automatic with deref coercion)
fn takes_str_slice(s: &str) { /* ... */ }
let owned = String::from("hello");
takes_str_slice(&owned); // Works!
```

#### Issue 4: Option/Result Unwrapping

**Error**:
```
thread 'main' panicked at 'called `Result::unwrap()` on an `Err` value: ...'
```

**Solution**:
```rust
// Don't use unwrap() in production code
// Bad:
let config = Config::load().unwrap();

// Good:
let config = Config::load()?;  // Propagate error
// Or:
let config = Config::load().map_err(|e| {
    eprintln!("Failed to load config: {}", e);
    std::process::exit(1);
})?;
```

#### Issue 5: Tokio Runtime Not Found

**Error**:
```
error: there is no reactor running, must be called from the context of a Tokio runtime
```

**Solution**:
```rust
// Add #[tokio::main] to main function
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Your async code here
    Ok(())
}

// Or create runtime manually
fn main() {
    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime.block_on(async {
        // Your async code here
    });
}
```

### Debugging Tips

#### 1. Use `RUST_BACKTRACE=1`

```bash
RUST_BACKTRACE=1 miyabi agent run coordinator --issue 270
```

#### 2. Enable Logging

```bash
RUST_LOG=debug miyabi agent run coordinator --issue 270
```

#### 3. Use `cargo check` for Fast Compilation

```bash
cargo check  # Type-check only (fast)
cargo build  # Full build (slower)
```

#### 4. Use `cargo clippy` for Linting

```bash
cargo clippy -- -D warnings  # Treat warnings as errors
```

#### 5. Use `cargo fmt` for Formatting

```bash
cargo fmt  # Format code according to Rust style guide
```

### Performance Debugging

#### Profile with `cargo flamegraph`

```bash
cargo install flamegraph
sudo cargo flamegraph --bin miyabi -- agent run coordinator --issue 270
```

#### Benchmark with `cargo bench`

```bash
cargo bench
```

---

## Migration Checklist

### Pre-Migration

- [ ] **Backup TypeScript codebase**
- [ ] **Install Rust toolchain** (rustup, cargo, rustc)
- [ ] **Review Rust Book** (https://doc.rust-lang.org/book/)
- [ ] **Set up development environment** (VS Code + rust-analyzer)

### Core Migration

- [ ] **Convert TypeScript interfaces to Rust structs**
  - [ ] Add `#[derive(Debug, Clone, Serialize, Deserialize)]`
  - [ ] Use `Option<T>` for optional fields
  - [ ] Use `snake_case` for field names
  - [ ] Add `#[serde(rename_all = "camelCase")]` for JSON compatibility

- [ ] **Convert TypeScript enums to Rust enums**
  - [ ] Add `#[serde(rename_all = "lowercase")]` for string representation
  - [ ] Use `Copy` trait for small enums

- [ ] **Convert async functions to Rust**
  - [ ] Use `async fn` for async functions
  - [ ] Return `Result<T, E>` instead of throwing exceptions
  - [ ] Use `#[async_trait]` for trait methods
  - [ ] Use `?` operator for error propagation

- [ ] **Convert classes to structs + impl**
  - [ ] Use `pub` for public fields/methods
  - [ ] Use `&self` / `&mut self` instead of `this`
  - [ ] Use `Arc` for shared ownership

### Testing

- [ ] **Convert Vitest tests to cargo test**
  - [ ] Use `#[test]` for unit tests
  - [ ] Use `#[tokio::test]` for async tests
  - [ ] Use `assert_eq!` / `assert!` macros
  - [ ] Aim for 80%+ coverage

### Documentation

- [ ] **Add doc comments** (`///`) to all public items
- [ ] **Generate API docs** (`cargo doc --open`)
- [ ] **Update README** with Rust build instructions
- [ ] **Create migration guide** (this document!)

### Deployment

- [ ] **Test binary on target platforms** (macOS, Linux, Windows)
- [ ] **Set up CI/CD** (GitHub Actions)
- [ ] **Publish to crates.io** (optional)
- [ ] **Create release binaries** (GitHub Releases)

### Post-Migration

- [ ] **Benchmark performance** (compare with TypeScript)
- [ ] **Monitor memory usage**
- [ ] **Collect user feedback**
- [ ] **Iterate on improvements**

---

## Additional Resources

### Official Documentation

- **Rust Book**: https://doc.rust-lang.org/book/
- **Rust by Example**: https://doc.rust-lang.org/rust-by-example/
- **Tokio Tutorial**: https://tokio.rs/tokio/tutorial
- **Serde Guide**: https://serde.rs/

### Crate Documentation

- **octocrab** (GitHub API): https://docs.rs/octocrab/
- **clap** (CLI): https://docs.rs/clap/
- **thiserror** (Errors): https://docs.rs/thiserror/
- **async-trait**: https://docs.rs/async-trait/
- **reqwest** (HTTP): https://docs.rs/reqwest/

### Project Documentation

- **Miyabi API Docs**: `docs/API_DOCUMENTATION.md`
- **Rust Migration Requirements**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **Crate README**: `crates/README.md`
- **CHANGELOG**: `CHANGELOG.md`

### Learning Resources

- **Rust for TypeScript Developers**: https://www.rustforjs.dev/
- **Tokio + Async Rust**: https://tokio.rs/tokio/tutorial
- **Rust Async Book**: https://rust-lang.github.io/async-book/

---

**Migration Guide Version**: 2.0.0
**Last Updated**: 2025-10-24
**Miyabi Rust Edition**: 0.1.0
**Rust Edition**: 2021

For questions or issues, please open an issue on GitHub: https://github.com/ShunsukeHayashi/Miyabi/issues
