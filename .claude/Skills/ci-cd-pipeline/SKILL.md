---
name: ci-cd-pipeline
description: Design and manage CI/CD pipelines for Miyabi projects using GitHub Actions. Use when creating workflows, automating tests, deployments, or release processes. Triggers include "CI/CD", "GitHub Actions", "pipeline", "automated deployment", "workflow automation", or when setting up continuous integration and deployment.
---

# CI/CD Pipeline

Automate build, test, and deployment workflows with GitHub Actions.

## Pipeline Architecture

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Push   │───▶│  Build  │───▶│  Test   │───▶│ Deploy  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                    │
                              ┌─────┴─────┐
                              │           │
                          ┌───▼───┐  ┌────▼────┐
                          │Staging│  │Production│
                          └───────┘  └─────────┘
```

## Workflow Templates

### Basic CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm test
      
      - name: Build
        run: npm run build
```

### Rust Project CI
```yaml
# .github/workflows/rust-ci.yml
name: Rust CI

on:
  push:
    branches: [main]
  pull_request:

env:
  CARGO_TERM_COLOR: always

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      
      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
      
      - name: Format check
        run: cargo fmt --all -- --check
      
      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings
      
      - name: Test
        run: cargo test --all-features
      
      - name: Build
        run: cargo build --release
```

### Deploy to EC2
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Deploy to EC2
        env:
          PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          HOST: ${{ secrets.EC2_HOST }}
          USER: ubuntu
        run: |
          echo "$PRIVATE_KEY" > private_key.pem
          chmod 600 private_key.pem
          
          ssh -o StrictHostKeyChecking=no -i private_key.pem $USER@$HOST << 'EOF'
            cd /home/ubuntu/miyabi
            git pull origin main
            npm ci --production
            pm2 restart all
          EOF
```

### Docker Build & Push
```yaml
# .github/workflows/docker.yml
name: Docker Build

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: myorg/miyabi
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Release Workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate changelog
        id: changelog
        uses: orhun/git-cliff-action@v3
        with:
          config: cliff.toml
          args: --latest --strip header
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.changelog.outputs.content }}
          files: |
            target/release/miyabi
            dist/*.tar.gz
```

## Environment Management

### Secrets Configuration
```yaml
# Required secrets in GitHub Settings
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
EC2_SSH_KEY
EC2_HOST
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
```

### Environment Protection
```yaml
jobs:
  deploy-prod:
    environment:
      name: production
      url: https://miyabi.example.com
    # Requires manual approval
```

## Matrix Builds

### Multi-Platform
```yaml
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

### Multi-Architecture Docker
```yaml
- name: Build multi-arch
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
```

## Caching Strategies

### Node.js
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Rust
```yaml
- uses: Swatinem/rust-cache@v2
```

### Docker Layers
```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Workflow Triggers

```yaml
on:
  # Push to branches
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'Cargo.toml'
  
  # Pull requests
  pull_request:
    types: [opened, synchronize]
  
  # Manual trigger
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
  
  # Scheduled
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  
  # Release
  release:
    types: [published]
```

## Best Practices

1. Use caching to speed up builds
2. Fail fast with parallel jobs
3. Use environment protection for production
4. Keep secrets secure and rotate regularly
5. Use reusable workflows for common patterns
6. Pin action versions for reproducibility
7. Add status badges to README
8. Use matrix builds for cross-platform testing
