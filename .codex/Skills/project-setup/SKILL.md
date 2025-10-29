---
name: Project Setup and Miyabi Integration
description: Initialize new projects with Miyabi framework including Cargo workspace setup, GitHub integration, label system, and Agent configuration. Use when creating new projects or integrating Miyabi into existing projects.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Project Setup and Miyabi Integration

Complete project initialization workflow for new Rust projects with full Miyabi framework integration.

## When to Use

- User requests "create a new project"
- User asks to "integrate Miyabi into this project"
- User wants to "set up a new Rust workspace"
- Starting a new microservice or library
- Migrating existing project to Miyabi

## Setup Modes

### Mode 1: New Project from Scratch

Complete new project creation with Miyabi integration.

### Mode 2: Add Miyabi to Existing Project

Integrate Miyabi framework into an existing Rust/TypeScript project.

### Mode 3: Create Microservice in Existing Workspace

Add new crate to existing Miyabi workspace.

## Workflow: New Project from Scratch

### Step 1: Create Project Structure

```bash
# Option A: Using cargo
cargo new my-project --name my_project

# Option B: Using miyabi CLI (if available)
miyabi init my-project

cd my-project
```

**Directory structure created**:
```
my-project/
├── Cargo.toml
├── src/
│   └── main.rs  (or lib.rs)
├── README.md
└── .gitignore
```

### Step 2: Convert to Cargo Workspace

```bash
# Backup original Cargo.toml
mv Cargo.toml Cargo.toml.single

# Create workspace Cargo.toml
cat > Cargo.toml <<'EOF'
[workspace]
members = [
    "crates/my-project-core",
    "crates/my-project-cli",
]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["Your Name <your.email@example.com>"]
license = "MIT OR Apache-2.0"
repository = "https://github.com/your-username/my-project"
homepage = "https://github.com/your-username/my-project"
documentation = "https://docs.rs/my-project"

[workspace.dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }
async-trait = "0.1"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# CLI
clap = { version = "4.4", features = ["derive", "env"] }

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
strip = true
EOF
```

### Step 3: Create Workspace Crates

```bash
# Create crates directory
mkdir -p crates

# Create core library
cargo new --lib crates/my-project-core

# Create CLI binary
cargo new crates/my-project-cli

# Move original src to core (if exists)
if [ -d src ]; then
  mv src/* crates/my-project-core/src/
  rmdir src
fi
```

### Step 4: Set Up Git Repository

```bash
# Initialize git
git init

# Create .gitignore
cat > .gitignore <<'EOF'
# Rust
/target/
**/*.rs.bk
*.pdb
Cargo.lock  # Remove this line for binaries

# IDE
.idea/
.vscode/
*.swp
*.swo
*~
.DS_Store

# Miyabi
.worktrees/
.agent-context.json
EXECUTION_CONTEXT.md

# Environment
.env
.env.local
*.key
*.pem
credentials.json

# Logs
*.log
.ai/logs/

# OS
Thumbs.db
EOF

# Initial commit
git add .
git commit -m "chore: initial project setup

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 5: Integrate Miyabi Framework

#### 5.1: Add Miyabi Dependencies

```bash
# Add to workspace Cargo.toml [workspace.dependencies]
cat >> Cargo.toml <<'EOF'

# Miyabi framework (if published to crates.io)
miyabi-types = "0.1"
miyabi-core = "0.1"
miyabi-agents = "0.1"
miyabi-github = "0.1"
miyabi-worktree = "0.1"

# Or use path dependencies (local development)
# miyabi-types = { path = "../miyabi/crates/miyabi-types" }
EOF
```

#### 5.2: Create Miyabi Configuration

```bash
# Create .miyabi.yml
cat > .miyabi.yml <<'EOF'
project_name: my-project
repository:
  owner: your-username
  name: my-project
  branch: main

github:
  # Use environment variable: GITHUB_TOKEN
  # token: ghp_xxx  # Don't commit tokens!

agents:
  enabled:
    - CoordinatorAgent
    - CodeGenAgent
    - ReviewAgent
    - IssueAgent
    - PRAgent
    - DeploymentAgent

  config:
    coordinator:
      max_parallel_tasks: 3
      max_complexity: large

    codegen:
      model: claude-sonnet-4
      temperature: 0.7

    review:
      min_quality_score: 80
      required_checks:
        - clippy
        - format
        - tests

    deployment:
      auto_rollback: true
      health_check_timeout: 30

device_identifier: ${DEVICE_IDENTIFIER:-default}

logging:
  level: info
  output: .ai/logs/
EOF
```

#### 5.3: Create Codex Directory

```bash
# Create .codex directory structure
mkdir -p .codex/{commands,agents/{specs,prompts},Skills}

# Create README
cat > .codex/README.md <<'EOF'
# Codex Configuration

This directory contains Codex configuration for the project.

## Structure

- `commands/` - Custom slash commands
- `agents/` - Agent specifications and prompts
- `Skills/` - Codex Skills

## Usage

See [Miyabi Documentation](https://github.com/your-username/miyabi) for details.
EOF
```

### Step 6: Set Up GitHub Integration

#### 6.1: Create Labels Configuration

```bash
# Copy from Miyabi template
curl -o .github/labels.yml https://raw.githubusercontent.com/ShunsukeHayashi/Miyabi/main/.github/labels.yml

# Or create custom labels.yml
mkdir -p .github
cat > .github/labels.yml <<'EOF'
# STATE Labels (8)
- name: "📥 state:pending"
  color: "E4E4E4"
  description: "Issue created, awaiting triage"

- name: "🔍 state:analyzing"
  color: "0E8A16"
  description: "CoordinatorAgent analyzing dependencies"

- name: "🏗️ state:implementing"
  color: "1D76DB"
  description: "Specialist Agent implementing"

- name: "👀 state:reviewing"
  color: "FBCA04"
  description: "ReviewAgent checking quality"

- name: "✅ state:done"
  color: "2EA44F"
  description: "Completed, PR merged"

- name: "🔴 state:blocked"
  color: "D73A4A"
  description: "Blocked, Guardian intervention needed"

- name: "🛑 state:failed"
  color: "B60205"
  description: "Failed, error occurred"

- name: "⏸️ state:paused"
  color: "D4C5F9"
  description: "Paused, awaiting dependencies or approval"

# Add remaining 49 labels...
# See: https://github.com/ShunsukeHayashi/Miyabi/.github/labels.yml
EOF
```

#### 6.2: Create GitHub Actions Workflows

```bash
mkdir -p .github/workflows

# CI Workflow
cat > .github/workflows/ci.yml <<'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: Cache Cargo
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      - name: Check format
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Test
        run: cargo test --all-features --workspace

      - name: Build
        run: cargo build --release --workspace
EOF

# Label Sync Workflow
cat > .github/workflows/label-sync.yml <<'EOF'
name: Label Sync

on:
  push:
    branches: [main]
    paths:
      - '.github/labels.yml'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: micnncim/action-label-syncer@v1
        with:
          manifest: .github/labels.yml
          token: ${{ secrets.GITHUB_TOKEN }}
EOF
```

### Step 7: Create Issue Templates

```bash
mkdir -p .github/ISSUE_TEMPLATE

# Feature template
cat > .github/ISSUE_TEMPLATE/feature.yml <<'EOF'
name: Feature Request
description: Propose a new feature
title: "[Feature]: "
labels: ["✨ type:feature", "📥 state:pending"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a feature! Please provide details below.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Describe the feature you'd like to see
      placeholder: What should this feature do?
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - 🔥 P0-Critical
        - ⚠️ P1-High
        - 📊 P2-Medium
        - 📝 P3-Low
    validations:
      required: true
EOF

# Bug template
cat > .github/ISSUE_TEMPLATE/bug.yml <<'EOF'
name: Bug Report
description: Report a bug
title: "[Bug]: "
labels: ["🐛 type:bug", "📥 state:pending"]
body:
  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: What went wrong?
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      placeholder: |
        1. Run command X
        2. Observe error Y
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should have happened?
    validations:
      required: true
EOF
```

### Step 8: Create README and Documentation

```bash
cat > README.md <<'EOF'
# My Project

Brief description of your project.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\```bash
cargo install my-project-cli
\```

## Usage

\```bash
my-project-cli --help
\```

## Development

### Prerequisites

- Rust 1.75+
- Git

### Build

\```bash
cargo build
\```

### Test

\```bash
cargo test
\```

### Miyabi Integration

This project uses [Miyabi](https://github.com/ShunsukeHayashi/Miyabi) for autonomous development.

See [CLAUDE.md](CLAUDE.md) for Codex configuration.

## License

MIT OR Apache-2.0
EOF

# Create CLAUDE.md
cat > CLAUDE.md <<'EOF'
# Codex Project Configuration

This file is automatically referenced by Codex.

## Project Overview

[Describe your project]

## Architecture

[Describe architecture]

## Common Commands

\```bash
# Build
cargo build

# Test
cargo test

# Run
cargo run
\```

## Miyabi Integration

This project uses Miyabi framework for autonomous development.

See [.miyabi.yml](.miyabi.yml) for configuration.
EOF
```

### Step 9: Push to GitHub

```bash
# Create repository on GitHub (using gh CLI)
gh repo create my-project --public --source=. --remote=origin --push

# Or manually:
# 1. Create repo on github.com
# 2. Add remote
git remote add origin https://github.com/your-username/my-project.git
git branch -M main
git push -u origin main
```

### Step 10: Sync Labels

```bash
# Install label-syncer (if not installed)
gh extension install github/gh-label-sync

# Sync labels from .github/labels.yml
gh label sync --labels .github/labels.yml
```

## Workflow: Add Miyabi to Existing Project

### Step 1: Verify Project Structure

```bash
# Check if Cargo workspace
if [ -f Cargo.toml ]; then
  echo "Cargo.toml found"
  grep -q "\[workspace\]" Cargo.toml && echo "Already a workspace" || echo "Single crate"
fi

# Check git
git status || echo "Not a git repository"
```

### Step 2: Add Miyabi Configuration

```bash
# Copy .miyabi.yml from template
curl -o .miyabi.yml https://raw.githubusercontent.com/ShunsukeHayashi/Miyabi/main/.miyabi.yml

# Edit for your project
# Update: project_name, repository owner/name
```

### Step 3: Add Codex Directory

```bash
# Copy .codex directory structure
mkdir -p .codex
curl -o .codex/README.md https://raw.githubusercontent.com/ShunsukeHayashi/Miyabi/main/.codex/README.md
```

### Step 4: Add Miyabi Dependencies

```bash
# Add to Cargo.toml [dependencies] or [workspace.dependencies]
cargo add miyabi-types miyabi-core miyabi-agents
```

### Step 5: Add GitHub Workflows

```bash
# Copy workflows
mkdir -p .github/workflows
curl -o .github/workflows/ci.yml https://raw.githubusercontent.com/ShunsukeHayashi/Miyabi/main/.github/workflows/ci.yml
```

### Step 6: Commit Changes

```bash
git add .
git commit -m "chore: integrate Miyabi framework

🤖 Generated with [Codex](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Configuration Checklist

After setup, verify:

- [ ] `Cargo.toml` is valid (`cargo check`)
- [ ] `.miyabi.yml` exists with correct repository info
- [ ] `.codex/` directory structure exists
- [ ] GitHub labels synced
- [ ] CI workflow passes
- [ ] Environment variable `GITHUB_TOKEN` is set
- [ ] README.md is updated
- [ ] CLAUDE.md is created

## Environment Variables

Set these environment variables:

```bash
# GitHub API token (required)
export GITHUB_TOKEN=ghp_your_token_here

# Anthropic API key (for Agents)
export ANTHROPIC_API_KEY=sk-ant-your_key_here

# Device identifier (optional)
export DEVICE_IDENTIFIER=$(hostname)
```

Add to shell profile (`~/.bashrc`, `~/.zshrc`):

```bash
echo 'export GITHUB_TOKEN=ghp_xxx' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY=sk-ant-xxx' >> ~/.bashrc
```

## Related Files

- **Miyabi Template**: https://github.com/ShunsukeHayashi/Miyabi
- **Label System**: `docs/LABEL_SYSTEM_GUIDE.md`
- **Agent Specs**: `.codex/agents/specs/`
- **Cargo Book**: https://doc.rust-lang.org/cargo/

## Related Skills

- **Rust Development**: For building after setup
- **Git Workflow**: For committing setup changes
- **Agent Execution**: For testing Miyabi integration
