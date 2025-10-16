# 🚀 Deployment Guide - Miyabi Rust Edition

**Version**: 2.0 (Rust Edition)
**Target**: Production deployment across platforms
**Deployment Time**: 15-30 minutes

---

## 📋 Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Production Setup](#production-setup)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Deployment Options

| Method | Use Case | Installation Time | Difficulty |
|--------|----------|-------------------|------------|
| **One-Command Install** | Quick setup | 5 mins | ⭐ Easy |
| **Cargo Install** | Development | 10 mins | ⭐⭐ Medium |
| **Docker (GHCR)** | Production, CI/CD | 2 mins | ⭐ Easy |
| **Binary Download** | Air-gapped environments | 1 min | ⭐ Easy |
| **From Source** | Custom builds | 15 mins | ⭐⭐⭐ Advanced |

---

## 📦 Prerequisites

### System Requirements

**Minimum**:
- OS: Linux, macOS, Windows (WSL2), Android (Termux)
- RAM: 2GB
- Disk: 500MB

**Recommended**:
- OS: Ubuntu 22.04+, macOS 13+, Windows 11
- RAM: 4GB
- Disk: 2GB (for build cache)

### Required Tools

#### Option 1: One-Command Install (Recommended)
```bash
# Only curl/wget required
curl --version  # or wget --version
```

#### Option 2: Cargo Install
```bash
# Rust toolchain required
rustc --version  # >= 1.75.0
cargo --version  # >= 1.75.0
```

#### Option 3: Docker
```bash
# Docker required
docker --version  # >= 20.10.0
```

---

## 🚀 Installation Methods

### Method 1: One-Command Install ⭐ Recommended

**Universal installer script - works on all platforms**

```bash
# Download and execute installer
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash

# Or with wget
wget -qO- https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
```

**What it does**:
1. Detects OS and architecture (Linux/macOS/Windows × x86_64/arm64)
2. Downloads pre-compiled binary
3. Installs to `~/.local/bin` or `/usr/local/bin`
4. Adds to PATH automatically
5. Verifies installation

**Supported Platforms**:
- ✅ Linux (x86_64, aarch64)
- ✅ macOS (Intel, Apple Silicon)
- ✅ Windows (WSL2)
- ✅ Android (Termux)

---

### Method 2: Cargo Install

**For Rust developers**

```bash
# Install from crates.io (when published)
cargo install miyabi-cli

# Or install from git
cargo install --git https://github.com/ShunsukeHayashi/miyabi-private miyabi-cli

# Verify
miyabi --version
```

**Build time**: ~10 minutes (first install)
**Install location**: `~/.cargo/bin/miyabi`

---

### Method 3: Docker (GHCR)

**For containerized environments**

```bash
# Pull latest image
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest

# Create alias
echo 'alias miyabi="docker run --rm -v \$(pwd):/workspace -w /workspace ghcr.io/shunsukehayashi/miyabi-private:latest"' >> ~/.bashrc
source ~/.bashrc

# Verify
miyabi --version
```

**Image size**: ~150MB
**Startup time**: <100ms

---

### Method 4: Binary Download

**For air-gapped or restricted environments**

```bash
# Download from GitHub Releases
RELEASE_URL="https://github.com/ShunsukeHayashi/miyabi-private/releases/latest/download"

# Linux x86_64
curl -LO "${RELEASE_URL}/miyabi-linux-x86_64"
chmod +x miyabi-linux-x86_64
sudo mv miyabi-linux-x86_64 /usr/local/bin/miyabi

# macOS Intel
curl -LO "${RELEASE_URL}/miyabi-darwin-x86_64"
chmod +x miyabi-darwin-x86_64
sudo mv miyabi-darwin-x86_64 /usr/local/bin/miyabi

# macOS Apple Silicon
curl -LO "${RELEASE_URL}/miyabi-darwin-aarch64"
chmod +x miyabi-darwin-aarch64
sudo mv miyabi-darwin-aarch64 /usr/local/bin/miyabi

# Verify
miyabi --version
```

---

### Method 5: From Source

**For custom builds or development**

```bash
# Clone repository
git clone https://github.com/ShunsukeHayashi/miyabi-private
cd miyabi-private

# Build release binary
cargo build --release --bin miyabi

# Binary location
./target/release/miyabi --version

# Install globally
cargo install --path crates/miyabi-cli

# Verify
miyabi --version
```

**Build time**: ~15 minutes (first build)
**Requirements**: Rust 1.75.0+, build tools (gcc/clang)

---

## ⚙️ Configuration

### 1. GitHub Token Setup

#### Option A: gh CLI (Recommended)

```bash
# Install gh CLI
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Authenticate
gh auth login

# Miyabi automatically uses gh CLI token
miyabi status
```

#### Option B: Environment Variable

```bash
# Create .env file
cat > .env <<EOF
GITHUB_TOKEN=ghp_your_token_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
RUST_LOG=info
EOF

# Never commit .env to git
echo ".env" >> .gitignore
```

#### Option C: Export

```bash
export GITHUB_TOKEN=ghp_xxxxx
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 2. Project Initialization

```bash
# For new projects
miyabi init my-project

# For existing projects
cd existing-project
miyabi install
```

### 3. Configuration File

Create `.miyabi.yml`:

```yaml
github:
  token: ${GITHUB_TOKEN}
  owner: YourUsername
  repo: your-repo

anthropic:
  api_key: ${ANTHROPIC_API_KEY}

agents:
  coordinator:
    enabled: true
    max_retries: 3
    timeout_seconds: 300

logging:
  level: info  # debug, info, warn, error
  format: json  # json, pretty

cache:
  enabled: true
  ttl_seconds: 3600
```

---

## ✅ Verification

### Basic Tests

```bash
# 1. Version check
miyabi --version
# Expected: miyabi 2.0.0

# 2. Help command
miyabi --help

# 3. Status check
miyabi status
# Expected: Shows GitHub connection status

# 4. Dry-run agent
miyabi agent run coordinator --issue 1 --dry-run
# Expected: Shows execution plan without actual execution
```

### Integration Test

```bash
# Full workflow test
cd your-project

# 1. Check status
miyabi status

# 2. Run agent (actual execution)
miyabi agent run coordinator --issue 270

# 3. Verify output
# - Check GitHub for created branch
# - Check for commit
# - Check for PR (if applicable)
```

---

## 🏭 Production Setup

### GitHub Actions Integration

#### Option 1: Container-based (Recommended)

```yaml
# .github/workflows/miyabi-agent.yml
name: Miyabi Agent Execution

on:
  issues:
    types: [labeled]

jobs:
  run-agent:
    if: contains(github.event.issue.labels.*.name, '🤖 trigger:agent-execute')
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/shunsukehayashi/miyabi-private:latest
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

    steps:
      - name: Execute Agent
        run: miyabi agent run coordinator --issue ${{ github.event.issue.number }}
```

#### Option 2: Binary-based

```yaml
jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - name: Install Miyabi
        run: |
          curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Execute Agent
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: miyabi agent run coordinator --issue ${{ github.event.issue.number }}
```

### Self-Hosted Runner

```bash
# Install on self-hosted runner
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash

# Configure as service
sudo tee /etc/systemd/system/miyabi-agent.service <<EOF
[Unit]
Description=Miyabi Agent Service
After=network.target

[Service]
Type=simple
User=runner
WorkingDirectory=/home/runner/work
EnvironmentFile=/home/runner/.env
ExecStart=/usr/local/bin/miyabi agent run coordinator --watch
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable miyabi-agent
sudo systemctl start miyabi-agent

# Check status
sudo systemctl status miyabi-agent
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  miyabi:
    image: ghcr.io/shunsukehayashi/miyabi-private:latest
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - RUST_LOG=info
    volumes:
      - ./workspace:/workspace
      - ./.worktrees:/app/.worktrees
    working_dir: /workspace
    command: agent run coordinator --watch
    restart: unless-stopped
```

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

---

## 🔧 Troubleshooting

### Issue 1: Command not found

```bash
# Check installation
which miyabi

# If not found, check PATH
echo $PATH | grep -o "$HOME/.local/bin\|$HOME/.cargo/bin"

# Add to PATH
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
```

### Issue 2: Permission denied

```bash
# Make binary executable
chmod +x $(which miyabi)

# Or reinstall
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
```

### Issue 3: GitHub authentication failed

```bash
# Check token
echo $GITHUB_TOKEN

# Verify token with gh CLI
gh auth status

# Test API access
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

### Issue 4: Binary incompatible

```bash
# Check architecture
uname -m
# Expected: x86_64 or aarch64 or arm64

# Check OS
uname -s
# Expected: Linux, Darwin, or MINGW64 (Windows)

# Download correct binary
# See Method 4: Binary Download
```

### Issue 5: Slow performance

```bash
# Check if using debug build
miyabi --version
# Should show "release" not "debug"

# Rebuild with optimizations
cargo build --release --bin miyabi

# Check system resources
top -p $(pgrep miyabi)
```

---

## 📊 Platform-Specific Instructions

### Ubuntu/Debian

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y curl git

# Install Miyabi
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash

# Verify
miyabi --version
```

### macOS

```bash
# Install with Homebrew (if available)
brew tap shunsukehayashi/miyabi
brew install miyabi

# Or use installer
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash

# Verify
miyabi --version
```

### Windows (WSL2)

```powershell
# Enable WSL2
wsl --install

# Open Ubuntu terminal
wsl

# Install Miyabi
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
```

### Termux (Android)

```bash
# Update packages
pkg update && pkg upgrade

# Install dependencies
pkg install rust git

# Install Miyabi
cargo install --git https://github.com/ShunsukeHayashi/miyabi-private miyabi-cli

# Verify
miyabi --version
```

---

## 🔒 Security Best Practices

1. **Never commit secrets**: Use `.env` files (gitignored)
2. **Use gh CLI**: Automatic token management
3. **Rotate tokens**: Regularly regenerate GitHub tokens
4. **Minimal permissions**: Grant only required scopes (repo, workflow)
5. **Audit logs**: Monitor GitHub Actions logs

---

## 🔥 Firebase Deployment

**New in v1.0.0**: Automated Firebase deployment integration via DeploymentAgent

### Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

### Configuration

Add Firebase project configuration to `.miyabi.yml`:

```yaml
deployment:
  firebase:
    production_project: "your-prod-project-id"
    staging_project: "your-staging-project-id"
    production_url: "https://your-prod-project.web.app"
    staging_url: "https://your-staging-project.web.app"
```

Or use environment variables:

```bash
export FIREBASE_PRODUCTION_PROJECT="your-prod-project-id"
export FIREBASE_STAGING_PROJECT="your-staging-project-id"
export PRODUCTION_URL="https://your-prod-project.web.app"
export STAGING_URL="https://your-staging-project.web.app"
```

### Deployment Methods

#### Method 1: Via DeploymentAgent (Recommended)

```bash
# Deploy to staging
miyabi agent run deployment --environment staging

# Deploy to production
miyabi agent run deployment --environment production
```

**What it does**:
1. ✅ **Build** - `cargo build --release`
2. ✅ **Test** - `cargo test --all`
3. ✅ **Deploy** - `firebase deploy --only hosting,functions --project {project_id}`
4. ✅ **Health Check** - HTTP GET with retries (3 attempts, 10s interval)
5. ✅ **Rollback** - Automatic rollback on failure

#### Method 2: Manual Firebase Deploy

```bash
# Build project
cargo build --release

# Run tests
cargo test --all

# Deploy to Firebase
firebase deploy --only hosting,functions --project your-project-id
```

### Deployment Pipeline

DeploymentAgent executes a 5-phase pipeline:

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Build   │ → │   Test   │ → │  Deploy  │ → │  Health  │ → │ Rollback │
│          │   │          │   │          │   │  Check   │   │(on fail) │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Phase Details**:
- **Phase 1 (Build)**: Compiles release binary with optimizations
- **Phase 2 (Test)**: Runs full test suite (375 tests)
- **Phase 3 (Deploy)**: Executes `firebase deploy` command
- **Phase 4 (Health Check)**: Verifies deployment URL accessibility
- **Phase 5 (Rollback)**: Restores previous version on failure

### Environment-Specific Deployment

#### Staging Environment

```bash
# Deploy to staging
miyabi agent run deployment --environment staging

# Expected output:
# ✅ Build completed (3.5s)
# ✅ Tests passed (375/375)
# ✅ Deployed to https://your-staging-project.web.app
# ✅ Health check passed (200 OK)
```

**Use cases**:
- Pre-production testing
- QA validation
- Feature previews
- Hotfix verification

#### Production Environment

```bash
# Deploy to production (requires confirmation)
miyabi agent run deployment --environment production --confirm

# Expected output:
# ✅ Build completed (3.5s)
# ✅ Tests passed (375/375)
# ✅ Deployed to https://your-prod-project.web.app
# ✅ Health check passed (200 OK)
```

**Use cases**:
- Stable releases
- Customer-facing deployments
- Critical hotfixes

### GitHub Actions Integration

#### Automatic Staging Deployment

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Miyabi
        run: |
          curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Deploy to Staging
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          FIREBASE_STAGING_PROJECT: ${{ secrets.FIREBASE_STAGING_PROJECT }}
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          firebase login:ci --token $FIREBASE_TOKEN
          miyabi agent run deployment --environment staging
```

#### Manual Production Deployment

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "DEPLOY" to confirm production deployment'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirm == 'DEPLOY'
    steps:
      - uses: actions/checkout@v3

      - name: Install Miyabi
        run: |
          curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
          echo "$HOME/.local/bin" >> $GITHUB_PATH

      - name: Deploy to Production
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          FIREBASE_PRODUCTION_PROJECT: ${{ secrets.FIREBASE_PRODUCTION_PROJECT }}
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          firebase login:ci --token $FIREBASE_TOKEN
          miyabi agent run deployment --environment production
```

### Troubleshooting

#### Issue 1: Firebase CLI not found

```bash
# Check Firebase CLI installation
which firebase

# Install Firebase CLI
npm install -g firebase-tools

# Verify
firebase --version
```

#### Issue 2: Authentication failed

```bash
# Login to Firebase
firebase login

# Use CI token for automation
firebase login:ci

# Set token as environment variable
export FIREBASE_TOKEN=your-ci-token
```

#### Issue 3: Deployment URL not accessible

```bash
# Check Firebase hosting status
firebase hosting:sites:list --project your-project-id

# Verify domain configuration
firebase hosting:channel:list --project your-project-id

# Check deployment history
firebase hosting:releases:list --project your-project-id
```

#### Issue 4: Build/Test failures

```bash
# Run build manually
cargo build --release

# Run tests manually
cargo test --all

# Check specific test failures
cargo test --package miyabi-agents -- --nocapture
```

### Rollback Procedure

If deployment fails, DeploymentAgent automatically triggers rollback:

```bash
# Manual rollback to previous version
firebase hosting:rollback --project your-project-id

# Verify rollback
curl https://your-project.web.app
```

### Monitoring

```bash
# View deployment logs
firebase hosting:logs --project your-project-id

# Check health status
curl -I https://your-project.web.app

# Monitor performance
firebase performance:data --project your-project-id
```

---

## 📚 Next Steps

After deployment:
1. Read [USER_GUIDE.md](./USER_GUIDE.md) - Usage guide
2. Read [CONTAINER_GUIDE.md](./CONTAINER_GUIDE.md) - Docker details
3. Read [RUST_MIGRATION_GUIDE.md](./RUST_MIGRATION_GUIDE.md) - Migration from TypeScript
4. Join discussions: [GitHub Discussions](https://github.com/ShunsukeHayashi/miyabi-private/discussions)

---

**Last Updated**: 2025-10-16
**Version**: 2.0 (Rust Edition v1.0.0)
