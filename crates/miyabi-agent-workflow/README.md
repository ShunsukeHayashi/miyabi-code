# miyabi-agent-workflow

**GitHub workflow automation agents: PR creation, Issue analysis, and Deployment for the Miyabi framework.**

[![Crates.io](https://img.shields.io/crates/v/miyabi-agent-workflow.svg)](https://crates.io/crates/miyabi-agent-workflow)
[![Documentation](https://docs.rs/miyabi-agent-workflow/badge.svg)](https://docs.rs/miyabi-agent-workflow)
[![License](https://img.shields.io/crates/l/miyabi-agent-workflow.svg)](../../LICENSE)

## 📋 Overview

`miyabi-agent-workflow` provides three specialized agents for automating GitHub-based development workflows:

- **PRAgent** (まとめるん): Automatic Pull Request creation with Conventional Commits
- **IssueAgent** (みつけるん): Issue analysis, classification, and label inference
- **DeploymentAgent** (はこぶん): CI/CD automation with build, test, deploy, and rollback

**Key Capabilities**:
- 📝 **Conventional Commits**: Auto-generates PR titles following `feat(scope): description` format
- 🏷️ **Smart Labeling**: Infers appropriate labels from Miyabi's 57-label system
- 🤖 **Agent Assignment**: Automatically assigns tasks to the right agent (Coordinator, CodeGen, etc.)
- 🚀 **CI/CD Pipeline**: End-to-end deployment from build to health check
- 🔄 **Auto-Rollback**: Automatic rollback on deployment failure
- 📊 **Impact Assessment**: Evaluates issue severity and business impact

## 🚀 Features

### PRAgent (まとめるん)
- **Conventional Commits Compliance**: Generates `feat`, `fix`, `refactor`, `docs`, `test`, `ci` prefixes
- **Scope Detection**: Extracts scope from title (e.g., "Auth: login bug" → `fix(auth): login bug`)
- **PR Body Generation**: Includes overview, changes, test results, checklist, and related issues
- **Label Assignment**: Automatically applies labels based on task type and priority
- **Reviewer Assignment**: Assigns appropriate reviewers based on code owners

### IssueAgent (みつけるん)
- **Type Inference**: Detects Feature, Bug, Refactor, Docs, Test, or Deployment
- **Severity Assessment**: Evaluates Critical, High, Medium, or Low severity
- **Impact Evaluation**: Determines System, User, or Cosmetic impact level
- **Agent Routing**: Assigns to Coordinator, CodeGen, Review, PR, or Deployment agents
- **Duration Estimation**: Predicts task completion time (e.g., Feature: 60 min, Bug: 30 min)
- **Dependency Extraction**: Parses dependencies from issue body (e.g., `Depends on #123`)
- **Label Generation**: Selects from 57-label system across 11 categories

### DeploymentAgent (はこぶん)
- **Build Execution**: Runs `cargo build --release` with error handling
- **Test Execution**: Runs `cargo test --all` with pass/fail tracking
- **Environment Support**: Staging (auto-deploy) and Production (approval-required)
- **Health Checks**: Validates deployment success with HTTP health checks
- **Auto-Rollback**: Reverts to previous version on failure
- **Deployment Status**: Tracks Pending → Building → Testing → Deploying → HealthChecking → Success

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-agent-workflow = "0.1.0"
```

Or install the CLI:

```bash
cargo install miyabi-cli
```

## 🔧 Usage

### PRAgent Example

```rust
use miyabi_agent_workflow::PRAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task, TaskType};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = AgentConfig {
        github_token: std::env::var("GITHUB_TOKEN")?,
        repo_owner: Some("your-org".to_string()),
        repo_name: Some("your-repo".to_string()),
        ..Default::default()
    };

    let pr_agent = PRAgent::new(config);

    let task = Task {
        id: "task-001".to_string(),
        title: "Auth: Add Google OAuth support".to_string(),
        description: "Implement Google OAuth 2.0 authentication".to_string(),
        task_type: TaskType::Feature,
        ..Default::default()
    };

    // Generates PR:
    // Title: feat(auth): Add Google OAuth support
    // Body: Overview, changes, checklist
    // Labels: ✨ type:feature, 🏗️ state:implementing
    let result = pr_agent.execute(&task).await?;

    println!("PR created: {:?}", result.data);
    Ok(())
}
```

### IssueAgent Example

```rust
use miyabi_agent_workflow::IssueAgent;
use miyabi_types::{AgentConfig, Issue};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = AgentConfig::default();
    let issue_agent = IssueAgent::new(config);

    let issue = Issue {
        number: 42,
        title: "Critical: Database connection timeout".to_string(),
        body: "Users cannot login. Database times out after 5s.".to_string(),
        labels: vec!["bug".to_string()],
        ..Default::default()
    };

    let analysis = issue_agent.analyze_issue(&issue)?;

    // Output:
    // Type: Bug
    // Severity: Critical
    // Impact: System
    // Agent: CodeGenAgent
    // Duration: 30 minutes
    // Labels: ["🐛 type:bug", "🔥 priority:P0-Critical", "🤖 agent:codegen"]

    println!("Analysis: {:?}", analysis);
    Ok(())
}
```

### DeploymentAgent Example

```rust
use miyabi_agent_workflow::{DeploymentAgent, Environment};
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task, TaskType};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = AgentConfig {
        firebase_staging_project: Some("miyabi-staging".to_string()),
        staging_url: Some("https://staging.miyabi.dev".to_string()),
        ..Default::default()
    };

    let deploy_agent = DeploymentAgent::new(config);

    let task = Task {
        id: "deploy-001".to_string(),
        title: "Deploy to staging".to_string(),
        task_type: TaskType::Deployment,
        ..Default::default()
    };

    // Executes:
    // 1. cargo build --release
    // 2. cargo test --all
    // 3. Deploy to staging
    // 4. Health check (https://staging.miyabi.dev/health)
    // 5. Rollback if health check fails

    let result = deploy_agent.execute(&task).await?;

    println!("Deployment: {:?}", result.status);
    Ok(())
}
```

## 📊 Label System Integration

IssueAgent integrates with Miyabi's **57-label system** across 11 categories:

| Category | Labels | Examples |
|----------|--------|----------|
| **Type** | 7 | `✨ type:feature`, `🐛 type:bug`, `♻️ type:refactor` |
| **Priority** | 5 | `🔥 priority:P0-Critical`, `⚠️ priority:P1-High` |
| **State** | 8 | `📥 state:pending`, `🏗️ state:implementing`, `✅ state:done` |
| **Agent** | 7 | `🤖 agent:coordinator`, `🤖 agent:codegen`, `🤖 agent:review` |
| **Phase** | 6 | `🎯 phase:planning`, `🏗️ phase:implementation` |
| **Size** | 5 | `📏 size:XS`, `📏 size:S`, `📏 size:M`, `📏 size:L`, `📏 size:XL` |
| **Impact** | 3 | `💥 impact:system`, `👤 impact:user`, `🎨 impact:cosmetic` |
| **Severity** | 4 | `🔥 severity:critical`, `⚠️ severity:high` |
| **Technical** | 7 | `🔧 tech:api`, `🗄️ tech:db`, `🎨 tech:ui` |
| **Business** | 3 | `💼 biz:marketing`, `💰 biz:sales`, `📊 biz:analytics` |
| **Meta** | 2 | `🏷️ good first issue`, `🙋 help wanted` |

See [LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md) for full documentation.

## 🔄 Deployment Workflow

```
┌─────────────────────┐
│  cargo build        │ → BuildResult
└─────────────────────┘
          ↓
┌─────────────────────┐
│  cargo test         │ → TestResult
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Deploy (Staging)   │ → Automatic
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Health Check       │ → GET /health
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Success / Rollback │
└─────────────────────┘
```

## 🏗️ Architecture

### PRAgent
```
PRAgent::execute(task)
  ├── generate_pr_title()         → feat(scope): description
  ├── generate_pr_body()          → Markdown body
  ├── infer_labels()              → [type:feature, state:implementing]
  └── create_pull_request()       → GitHub PR
```

### IssueAgent
```
IssueAgent::analyze_issue(issue)
  ├── infer_issue_type()          → Feature/Bug/Refactor...
  ├── assess_severity()           → Critical/High/Medium/Low
  ├── evaluate_impact()           → System/User/Cosmetic
  ├── determine_agent()           → CodeGenAgent/ReviewAgent...
  ├── estimate_duration()         → 30-120 minutes
  ├── extract_dependencies()      → [#123, #456]
  └── generate_labels()           → [57-label system]
```

### DeploymentAgent
```
DeploymentAgent::deploy(task)
  ├── execute_build()             → cargo build --release
  ├── execute_tests()             → cargo test --all
  ├── deploy_to_environment()     → Staging/Production
  ├── run_health_check()          → GET /health (3 retries)
  └── rollback_if_failed()        → git revert + redeploy
```

## 🔗 Dependencies

- **Core**: `miyabi-agent-core`, `miyabi-types`, `miyabi-core`, `miyabi-github`
- **Runtime**: `tokio`, `async-trait`
- **GitHub**: `octocrab`, `reqwest`
- **Serialization**: `serde`, `serde_json`
- **Utilities**: `chrono`, `regex`, `thiserror`, `tracing`

## 🧪 Testing

```bash
# Run all tests
cargo test --package miyabi-agent-workflow

# Test specific agent
cargo test --package miyabi-agent-workflow pr_agent
cargo test --package miyabi-agent-workflow issue_agent
cargo test --package miyabi-agent-workflow deployment_agent

# Integration tests (requires GitHub token)
GITHUB_TOKEN=ghp_xxx cargo test --package miyabi-agent-workflow --test integration
```

## 📚 Related Crates

- [`miyabi-agent-coordinator`](../miyabi-agent-coordinator) - Task orchestration and DAG planning
- [`miyabi-agent-codegen`](../miyabi-agent-codegen) - AI-powered code generation
- [`miyabi-agent-review`](../miyabi-agent-review) - Code quality review and scoring
- [`miyabi-github`](../miyabi-github) - GitHub API client wrapper
- [`miyabi-types`](../miyabi-types) - Shared type definitions

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

## 🔖 Version History

- **v0.1.0** (2025-10-25): Initial release
  - PRAgent with Conventional Commits support
  - IssueAgent with 57-label system integration
  - DeploymentAgent with build/test/deploy/rollback workflow
  - Automatic agent routing and label inference

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform
