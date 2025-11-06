# miyabi-github

[![Crates.io](https://img.shields.io/crates/v/miyabi-github.svg)](https://crates.io/crates/miyabi-github)
[![Documentation](https://docs.rs/miyabi-github/badge.svg)](https://docs.rs/miyabi-github)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Status**: Stable | **Category**: Integration

GitHub API integration for Miyabi - High-level wrapper around Octocrab providing Issue, PR, Label, and Project management for autonomous development workflows.

## 📋 Overview

`miyabi-github` is the GitHub integration layer for the Miyabi autonomous development framework. It provides a unified, type-safe API for all GitHub operations required by Miyabi agents.

**Key Capabilities**:
- 🎫 **Issue Management**: CRUD operations, state filtering, bulk operations
- 🏷️ **Label Management**: Full CRUD, bulk sync for 57-label system
- 🔀 **Pull Request Management**: Create, merge, review, close PRs
- 📊 **Project Management**: GitHub Projects v2 integration, KPI tracking
- 🔐 **Authentication**: Multi-source token discovery (env, gh CLI, config file)
- 🎯 **State-Based Queries**: Filter by Miyabi workflow states (pending, in_progress, review, blocked, completed)

This crate is built on top of [Octocrab](https://github.com/XAMPPRocky/octocrab) and extends it with Miyabi-specific functionality.

## 🚀 Features

### Issue Management

- **CRUD Operations**: Create, read, update, close issues
- **State Filtering**: Query issues by GitHub state (Open/Closed/All)
- **Label Filtering**: Query issues by single or multiple labels
- **Miyabi State Queries**: Built-in methods for workflow states
- **Bulk Operations**: Process multiple issues efficiently
- **Comments**: Add, update, delete issue comments
- **Assignees**: Manage issue assignees

### Label Management

- **Full CRUD**: Create, read, update, delete labels
- **Bulk Sync**: Sync all 57 Miyabi labels from YAML definition
- **Color Management**: Hex color support (e.g., "ff0000")
- **Description Support**: Rich label descriptions
- **Conflict Resolution**: Smart update/create logic

### Pull Request Operations

- **Create PRs**: With title, body, base/head branches, draft mode
- **List PRs**: Filter by state (Open/Closed/All)
- **Merge PRs**: Merge strategies (merge, squash, rebase)
- **Close PRs**: Close without merging
- **Review Operations**: Request reviews, approve, request changes
- **PR Files**: Get changed files in a PR

### Project Management (GitHub Projects v2)

- **Project Items**: Add issues/PRs to projects
- **Field Updates**: Update custom fields (status, priority, etc.)
- **KPI Tracking**: Query project data for analytics
- **Content Types**: Support for Issue and PullRequest content types

### Authentication

- **Multi-Source Discovery**: Automatic token discovery from 3 sources:
  1. `GITHUB_TOKEN` environment variable
  2. `gh auth token` command (GitHub CLI)
  3. `~/.config/gh/hosts.yml` file
- **Token Validation**: Format validation (ghp_* pattern)
- **CLI Status Check**: Detect gh CLI installation and auth status
- **Helpful Errors**: Detailed setup instructions when auth fails

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-github = "0.1.0"
miyabi-types = "0.1.0"
```

Or use `cargo add`:

```bash
cargo add miyabi-github
```

## 🔧 Usage

### Authentication Setup

**Option 1: Environment Variable (Quick)**
```bash
export GITHUB_TOKEN=ghp_your_token_here
# Add to ~/.zshrc or ~/.bashrc for persistence
```

**Option 2: GitHub CLI (Recommended)**
```bash
# Install gh CLI
brew install gh  # macOS
# or: https://cli.github.com/

# Authenticate
gh auth login

# Verify
gh auth status
```

**Option 3: Token Discovery (Automatic)**
```rust
use miyabi_github::auth::discover_token;

// Automatically tries all sources
let token = discover_token()?;
```

### Basic Usage

```rust
use miyabi_github::GitHubClient;
use miyabi_types::issue::IssueState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize client
    let client = GitHubClient::new(
        "ghp_your_token",
        "owner",
        "repo"
    )?;

    // Verify authentication
    let username = client.verify_auth().await?;
    println!("Authenticated as: {}", username);

    // Get repository info
    let repo = client.get_repository().await?;
    println!("Repository: {} (stars: {})", repo.name, repo.stargazers_count.unwrap_or(0));

    Ok(())
}
```

### Issue Operations

```rust
use miyabi_github::GitHubClient;
use octocrab::params::State;

// Get a single issue
let issue = client.get_issue(270).await?;
println!("Issue #{}: {}", issue.number, issue.title);

// List open issues
let open_issues = client.list_issues(Some(State::Open), vec![]).await?;
println!("Found {} open issues", open_issues.len());

// List issues with labels
let bugs = client.list_issues(
    Some(State::Open),
    vec!["kind/bug".to_string()]
).await?;

// Create an issue
let new_issue = client.create_issue(
    "Implement user authentication",
    Some("Add JWT-based authentication with refresh tokens\n\n## Tasks\n- [ ] Setup JWT library\n- [ ] Create auth middleware")
).await?;
println!("Created issue #{}", new_issue.number);

// Update an issue
client.update_issue(270, Some("Updated title"), Some("Updated body")).await?;

// Close an issue
client.close_issue(270).await?;

// Add labels to an issue
client.add_labels_to_issue(270, vec!["kind/feature", "priority/high"]).await?;

// Add a comment
client.create_issue_comment(270, "Review completed ✅").await?;
```

### Miyabi State Queries

```rust
use miyabi_types::issue::IssueState;

// Get issues by Miyabi workflow state
let pending = client.get_issues_by_state(IssueState::Pending).await?;
let in_progress = client.get_issues_by_state(IssueState::InProgress).await?;
let review = client.get_issues_by_state(IssueState::Review).await?;
let blocked = client.get_issues_by_state(IssueState::Blocked).await?;
let completed = client.get_issues_by_state(IssueState::Completed).await?;

println!("Workflow Status:");
println!("  Pending: {}", pending.len());
println!("  In Progress: {}", in_progress.len());
println!("  Review: {}", review.len());
println!("  Blocked: {}", blocked.len());
println!("  Completed: {}", completed.len());
```

### Label Management

```rust
use miyabi_github::Label;

// List all labels
let labels = client.list_labels().await?;
for label in labels {
    println!("- {} ({})", label.name, label.color);
}

// Get a specific label
let label = client.get_label("kind/bug").await?;

// Create a label
client.create_label(
    "priority/urgent",
    "ff0000",  // Red color (hex without #)
    Some("Urgent priority - requires immediate attention")
).await?;

// Update a label
client.update_label(
    "priority/urgent",
    Some("priority/critical"),  // New name
    Some("cc0000"),  // Darker red
    Some("Critical priority")
).await?;

// Delete a label
client.delete_label("old-label").await?;

// Bulk sync Miyabi's 57-label system
// (Loads from .github/labels.yml)
client.sync_labels().await?;
```

### Pull Request Operations

```rust
// Get a PR
let pr = client.get_pull_request(123).await?;
println!("PR #{}: {} ({})", pr.number, pr.title, pr.state);

// List open PRs
let open_prs = client.list_pull_requests(Some(State::Open)).await?;

// Create a PR
let new_pr = client.create_pull_request(
    "feat: Add authentication system",
    "feature/auth",  // head branch
    "main",          // base branch
    Some("## Changes\n\n- Added JWT authentication\n- Implemented refresh tokens\n\n## Test Plan\n\n- [x] Unit tests\n- [x] Integration tests"),
    false  // not a draft
).await?;
println!("Created PR #{}", new_pr.number);

// Merge a PR (squash merge)
client.merge_pull_request(
    123,
    Some("feat: Add authentication system (#123)"),
    octocrab::params::pulls::MergeMethod::Squash
).await?;

// Close a PR without merging
client.close_pull_request(123).await?;
```

### Project Management (Projects v2)

```rust
use miyabi_github::{ProjectItem, ContentType};

// Add issue to project
let item = client.add_to_project(
    "PROJECT_ID",
    "ISSUE_NODE_ID",
    ContentType::Issue
).await?;

// Update project field
client.update_project_item_field(
    "PROJECT_ID",
    item.id,
    "FIELD_ID",
    "In Progress"
).await?;

// Get KPI report
let report = client.get_project_kpi_report("PROJECT_ID").await?;
println!("Total items: {}", report.total_items);
println!("Completed: {}", report.completed_items);
println!("Velocity: {:.1} items/week", report.velocity);
```

### Advanced: Direct Octocrab Access

For operations not yet wrapped, you can access the underlying Octocrab client:

```rust
let octocrab = client.octocrab();

// Use Octocrab directly
let repo = octocrab
    .repos(&client.owner(), &client.repo())
    .get()
    .await?;
```

## 🏗️ Architecture

```
miyabi-github
├── auth.rs            # Multi-source token discovery & validation
├── client.rs          # GitHubClient wrapper around Octocrab
├── issues.rs          # Issue CRUD & state queries
├── labels.rs          # Label management & bulk sync
├── projects.rs        # GitHub Projects v2 integration
├── pull_requests.rs   # PR operations & merge strategies
└── lib.rs             # Public API & re-exports

Dependencies:
├── miyabi-types       # Issue, Label, PR types
├── octocrab           # GitHub API client (v0.41)
├── tokio              # Async runtime
├── serde/serde_json   # Serialization
└── dirs               # Config directory discovery
```

## 🧪 Testing

### Run Tests

```bash
# All tests (requires GITHUB_TOKEN)
cargo test -p miyabi-github

# Unit tests only (no API calls)
cargo test -p miyabi-github --lib

# Integration tests (requires GitHub API access)
cargo test -p miyabi-github --test '*'

# With output
cargo test -p miyabi-github -- --nocapture
```

### Environment Setup for Tests

```bash
# Required for integration tests
export GITHUB_TOKEN=ghp_your_test_token
export TEST_GITHUB_OWNER=your-username
export TEST_GITHUB_REPO=test-repo

# Run tests
cargo test -p miyabi-github
```

### Example Test

```rust
#[tokio::test]
async fn test_issue_lifecycle() {
    let client = GitHubClient::new(
        std::env::var("GITHUB_TOKEN").unwrap(),
        "owner",
        "repo"
    ).unwrap();

    // Create issue
    let issue = client.create_issue("Test issue", Some("Test body")).await.unwrap();
    assert!(issue.number > 0);

    // Get issue
    let fetched = client.get_issue(issue.number).await.unwrap();
    assert_eq!(fetched.title, "Test issue");

    // Close issue
    client.close_issue(issue.number).await.unwrap();
}
```

## 📊 API Coverage

### Implemented

- ✅ Issues (CRUD, comments, labels, assignees)
- ✅ Labels (CRUD, bulk sync)
- ✅ Pull Requests (CRUD, merge, close)
- ✅ Projects v2 (add items, update fields, KPI)
- ✅ Authentication (multi-source discovery)
- ✅ Repository info

### Planned

- ⏳ Releases (create, update, publish)
- ⏳ Webhooks (create, list, delete)
- ⏳ Actions (trigger workflows, get run status)
- ⏳ Code Scanning (SARIF upload, alerts)
- ⏳ Dependabot (alerts, security updates)

## 🔗 Dependencies

### Core Dependencies

- **miyabi-types** - Shared type definitions (Issue, Label, PR)
- **octocrab** (v0.41) - GitHub REST API client
- **tokio** (v1.42) - Async runtime
- **serde** (v1.0) - Serialization framework
- **serde_json** (v1.0) - JSON support
- **tracing** (v0.1) - Structured logging
- **dirs** (v6.0) - Config directory discovery

## 📚 Related Crates

### Agents (Consumers)

- **miyabi-agent-coordinator** - Orchestrates agents, uses GitHub for task management
- **miyabi-agent-issue** - Issue analysis, uses GitHub to fetch/update issues
- **miyabi-agent-pr** - PR creation, uses GitHub to create and manage PRs
- **miyabi-agent-deployment** - Deployment automation, uses GitHub releases
- **miyabi-agent-refresher** - Issue refresh, uses GitHub to update stale issues

### Infrastructure

- **miyabi-cli** - CLI tool, uses GitHub client for all operations
- **miyabi-core** - Core utilities, shared with miyabi-github
- **miyabi-types** - Type definitions for GitHub entities

## 📖 Documentation

- **GitHub API Reference**: [docs.github.com/rest](https://docs.github.com/en/rest)
- **Octocrab Docs**: [docs.rs/octocrab](https://docs.rs/octocrab)
- **Miyabi Label System**: [LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md)
- **Entity-Relation Model**: [ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md)

## 🔐 Security Considerations

### Token Security

- **Never commit tokens**: Add `.env` to `.gitignore`
- **Use gh CLI**: Most secure option, tokens stored in system keychain
- **Rotate tokens regularly**: GitHub Settings → Developer settings → Personal access tokens
- **Scope tokens appropriately**: Only grant necessary permissions (repo, issues, pull_requests)

### Required GitHub Token Scopes

```
repo          # Full control of private repositories
  repo:status   # Commit status
  repo:deployment # Deployment status
  public_repo   # Public repository access
issues        # Read/write access to issues
pull_requests # Read/write access to PRs
```

### Rate Limiting

```rust
// Check rate limit status
let rate_limit = client.octocrab()
    .ratelimit()
    .get()
    .await?;

println!("Rate limit: {}/{}", rate_limit.resources.core.used, rate_limit.resources.core.limit);
println!("Resets at: {:?}", rate_limit.resources.core.reset);
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔖 Version History

- **v0.1.0** (2025-11-06) - Initial release
  - Issue CRUD operations
  - Label management with bulk sync
  - Pull request operations
  - Projects v2 integration
  - Multi-source authentication
  - Miyabi state-based queries

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform
