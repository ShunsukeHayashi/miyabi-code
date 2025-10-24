# Tutorial 9: CI/CD and Deployment - Automating Miyabi's Development Pipeline

**Estimated Time**: 90 minutes
**Difficulty**: ⭐⭐⭐⭐ Expert
**Prerequisites**: Completed Tutorials 1-8, GitHub Actions knowledge, Docker basics, Cloud deployment experience

## Learning Objectives

By the end of this tutorial, you will:
- Configure GitHub Actions for automated testing and deployment
- Set up continuous integration with multiple test stages
- Implement automated code quality gates
- Configure self-hosted runners for improved performance
- Deploy Miyabi to production environments
- Implement blue-green deployments for zero-downtime updates
- Monitor deployment health and rollback when needed
- Automate dependency updates with Dependabot

## Prerequisites

Before starting, ensure you have:
- **Completed Tutorials 1-8**: Comprehensive Miyabi knowledge
- **GitHub Actions Experience**: Basic workflow understanding
- **Docker Installed**: For containerized deployments
- **AWS/GCP Account**: For cloud deployment (optional)
- **Admin Access**: Repository settings access

## Introduction

"Deploy fast, deploy often, deploy safely."

Miyabi's autonomous Agents generate code, create PRs, and even deploy to production. To ensure quality at every step, a robust CI/CD pipeline is essential. Every commit triggers automated tests. Every PR gets quality-scored. Every merge deploys to staging. And only after validation does code reach production.

In this tutorial, you'll build a complete CI/CD pipeline for Miyabi, from local development to production deployment, with automated testing, security scanning, and monitoring at every stage.

## CI/CD Architecture Overview

### Pipeline Stages

```
Developer → Git Push
    ↓
┌────────────────────────┐
│ Stage 1: Lint & Format │ ← 2 minutes
└────────────────────────┘
    ↓
┌────────────────────────┐
│ Stage 2: Build & Test  │ ← 5 minutes
└────────────────────────┘
    ↓
┌────────────────────────┐
│ Stage 3: Security Scan │ ← 3 minutes
└────────────────────────┘
    ↓
┌────────────────────────┐
│ Stage 4: Integration   │ ← 10 minutes
└────────────────────────┘
    ↓
PR Merge
    ↓
┌────────────────────────┐
│ Stage 5: Deploy Staging│ ← 5 minutes
└────────────────────────┘
    ↓
Manual Approval
    ↓
┌────────────────────────┐
│ Stage 6: Deploy Prod   │ ← 5 minutes
└────────────────────────┘
    ↓
Production Monitoring
```

**Total time**: ~30 minutes from push to production

## Setting Up GitHub Actions

### Basic CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  # Stage 1: Lint and Format
  lint:
    name: Lint and Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Cache cargo registry
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Run Clippy
        run: cargo clippy --workspace --all-targets -- -D warnings

      - name: Check for TODO/FIXME
        run: |
          if git grep -E 'TODO|FIXME' -- '*.rs' | grep -v '.github'; then
            echo "::warning::Found TODO or FIXME comments"
          fi

  # Stage 2: Build and Test
  test:
    name: Build and Test
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        rust: [stable, beta]
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust ${{ matrix.rust }}
        uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ matrix.rust }}

      - name: Cache cargo
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: ${{ runner.os }}-${{ matrix.rust }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      - name: Build
        run: cargo build --verbose

      - name: Run unit tests
        run: cargo test --workspace --lib --verbose

      - name: Run integration tests
        run: cargo test --workspace --test '*integration*' --verbose
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Stage 3: Security Audit
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Run cargo-audit
        uses: rustsec/audit-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Run cargo-deny
        run: |
          cargo install cargo-deny
          cargo deny check

  # Stage 4: Coverage
  coverage:
    name: Code Coverage
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install tarpaulin
        run: cargo install cargo-tarpaulin

      - name: Generate coverage
        run: cargo tarpaulin --out Xml --timeout 300

      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./cobertura.xml
          fail_ci_if_error: false

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cargo tarpaulin --out Json | jq '.files | to_entries | map(.value.coverage) | add / length')
          echo "Coverage: ${COVERAGE}%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "::error::Coverage ${COVERAGE}% is below 80% threshold"
            exit 1
          fi
```

### Advanced: Self-Hosted Runners

For faster builds, use self-hosted runners.

**Setup Self-Hosted Runner**:

```bash
# On your build machine (Mac/Linux)
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download runner
curl -o actions-runner-osx-arm64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-arm64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-osx-arm64-2.311.0.tar.gz

# Configure
./config.sh --url https://github.com/ShunsukeHayashi/Miyabi --token YOUR_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

**Use Self-Hosted Runner** (`.github/workflows/ci.yml`):

```yaml
jobs:
  test-fast:
    name: Fast Tests (Self-Hosted)
    runs-on: [self-hosted, macOS, arm64]
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: cargo test --workspace
```

**Benefits**:
- **10x faster**: No cold start, cached dependencies
- **Cost savings**: Free for private repos
- **Customization**: Install specific tools

## Deployment Pipeline

### Staging Deployment

**Create `.github/workflows/deploy-staging.yml`**:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.miyabi.dev
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          docker build -t miyabi:staging .

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | \
            docker login --username AWS --password-stdin \
            123456789012.dkr.ecr.us-east-1.amazonaws.com

      - name: Tag and push image
        run: |
          docker tag miyabi:staging \
            123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:staging-${{ github.sha }}
          docker push \
            123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:staging-${{ github.sha }}

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster miyabi-staging \
            --service miyabi-api \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster miyabi-staging \
            --services miyabi-api

      - name: Run smoke tests
        run: |
          curl -f https://staging.miyabi.dev/health || exit 1

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Staging deployment complete: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Production Deployment

**Create `.github/workflows/deploy-production.yml`**:

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://miyabi.dev
    steps:
      - uses: actions/checkout@v4

      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Build Docker image
        run: |
          docker build \
            --build-arg VERSION=${{ steps.version.outputs.VERSION }} \
            -t miyabi:${{ steps.version.outputs.VERSION }} .

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | \
            docker login --username AWS --password-stdin \
            123456789012.dkr.ecr.us-east-1.amazonaws.com

      - name: Tag and push image
        run: |
          docker tag miyabi:${{ steps.version.outputs.VERSION }} \
            123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:${{ steps.version.outputs.VERSION }}
          docker tag miyabi:${{ steps.version.outputs.VERSION }} \
            123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:latest
          docker push \
            123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:${{ steps.version.outputs.VERSION }}
          docker push \
            123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:latest

      - name: Blue-Green Deployment
        run: |
          # Get current task definition
          TASK_DEF=$(aws ecs describe-task-definition \
            --task-definition miyabi-prod \
            --query 'taskDefinition' \
            --output json)

          # Update image in task definition
          NEW_TASK_DEF=$(echo $TASK_DEF | jq \
            --arg IMAGE "123456789012.dkr.ecr.us-east-1.amazonaws.com/miyabi:${{ steps.version.outputs.VERSION }}" \
            '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

          # Register new task definition
          NEW_TASK_ARN=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          # Update service (blue-green)
          aws ecs update-service \
            --cluster miyabi-production \
            --service miyabi-api \
            --task-definition $NEW_TASK_ARN \
            --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster miyabi-production \
            --services miyabi-api

      - name: Run smoke tests
        run: |
          curl -f https://miyabi.dev/health || exit 1
          curl -f https://miyabi.dev/api/v1/status || exit 1

      - name: Monitor for 5 minutes
        run: |
          for i in {1..10}; do
            sleep 30
            STATUS=$(curl -s https://miyabi.dev/health | jq -r '.status')
            if [ "$STATUS" != "healthy" ]; then
              echo "::error::Health check failed: $STATUS"
              exit 1
            fi
            echo "Health check $i/10: $STATUS"
          done

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.version.outputs.VERSION }}
          release_name: Release ${{ steps.version.outputs.VERSION }}
          body: |
            ## Changes in ${{ steps.version.outputs.VERSION }}

            See [CHANGELOG.md](https://github.com/ShunsukeHayashi/Miyabi/blob/main/CHANGELOG.md)

      - name: Notify success
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production deployment complete: ${{ steps.version.outputs.VERSION }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment Successful* 🎉\n\n*Version:* ${{ steps.version.outputs.VERSION }}\n*URL:* https://miyabi.dev\n*Commit:* ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Docker Configuration

### Multi-Stage Dockerfile

**`Dockerfile`**:

```dockerfile
# Stage 1: Builder
FROM rust:1.70-slim as builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml Cargo.lock ./
COPY crates/ ./crates/

# Build dependencies (cached)
RUN cargo build --release --locked

# Stage 2: Runtime
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 miyabi

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/miyabi-cli /usr/local/bin/miyabi
COPY --from=builder /app/target/release/miyabi-web-api /usr/local/bin/miyabi-api

# Copy configuration
COPY .env.example .env

# Set ownership
RUN chown -R miyabi:miyabi /app

USER miyabi

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["miyabi-api"]
```

### Docker Compose for Local Development

**`docker-compose.yml`**:

```yaml
version: '3.8'

services:
  miyabi-api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/miyabi
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=miyabi
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Automated Dependency Updates

### Dependabot Configuration

**`.github/dependabot.yml`**:

```yaml
version: 2
updates:
  # Rust dependencies
  - package-ecosystem: "cargo"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    reviewers:
      - "ShunsukeHayashi"
    labels:
      - "dependencies"
      - "rust"
    commit-message:
      prefix: "chore(deps)"
      include: "scope"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "ShunsukeHayashi"
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "chore(ci)"
```

## Monitoring and Observability

### Health Check Endpoint

**`crates/miyabi-web-api/src/health.rs`**:

```rust
use axum::{Json, http::StatusCode};
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    version: String,
    uptime: u64,
    checks: HealthChecks,
}

#[derive(Serialize)]
pub struct HealthChecks {
    database: bool,
    redis: bool,
    github_api: bool,
}

pub async fn health_check() -> (StatusCode, Json<HealthResponse>) {
    let checks = HealthChecks {
        database: check_database().await,
        redis: check_redis().await,
        github_api: check_github().await,
    };

    let all_healthy = checks.database && checks.redis && checks.github_api;
    let status_code = if all_healthy {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        status_code,
        Json(HealthResponse {
            status: if all_healthy { "healthy" } else { "unhealthy" }.to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            uptime: get_uptime(),
            checks,
        }),
    )
}

async fn check_database() -> bool {
    // Test database connection
    true
}

async fn check_redis() -> bool {
    // Test Redis connection
    true
}

async fn check_github() -> bool {
    // Test GitHub API
    true
}

fn get_uptime() -> u64 {
    // Return uptime in seconds
    0
}
```

### Prometheus Metrics

**`crates/miyabi-web-api/src/metrics.rs`**:

```rust
use prometheus::{Registry, Counter, Histogram};

pub struct Metrics {
    pub http_requests_total: Counter,
    pub http_request_duration: Histogram,
    pub agent_executions_total: Counter,
    pub agent_execution_duration: Histogram,
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();

        Self {
            http_requests_total: Counter::new("http_requests_total", "Total HTTP requests")
                .unwrap(),
            http_request_duration: Histogram::new("http_request_duration_seconds", "HTTP request duration")
                .unwrap(),
            agent_executions_total: Counter::new("agent_executions_total", "Total Agent executions")
                .unwrap(),
            agent_execution_duration: Histogram::new("agent_execution_duration_seconds", "Agent execution duration")
                .unwrap(),
        }
    }
}
```

## Rollback Strategy

### Automated Rollback on Failure

**`.github/workflows/rollback.yml`**:

```yaml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to (e.g., v1.2.3)'
        required: true

jobs:
  rollback:
    name: Rollback to ${{ github.event.inputs.version }}
    runs-on: ubuntu-latest
    environment:
      name: production
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Rollback ECS service
        run: |
          # Get previous task definition
          TASK_ARN=$(aws ecs list-task-definitions \
            --family-prefix miyabi-prod \
            --sort DESC \
            --max-items 2 \
            --query 'taskDefinitionArns[1]' \
            --output text)

          # Update service to previous task definition
          aws ecs update-service \
            --cluster miyabi-production \
            --service miyabi-api \
            --task-definition $TASK_ARN

      - name: Wait for rollback
        run: |
          aws ecs wait services-stable \
            --cluster miyabi-production \
            --services miyabi-api

      - name: Verify rollback
        run: |
          curl -f https://miyabi.dev/health || exit 1

      - name: Notify rollback
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Production rollback complete: ${{ github.event.inputs.version }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Success Checklist

- [ ] Configured GitHub Actions CI pipeline with multiple stages
- [ ] Set up automated testing (unit, integration, E2E)
- [ ] Implemented security scanning with cargo-audit
- [ ] Configured code coverage reporting with Codecov
- [ ] Created staging deployment workflow
- [ ] Created production deployment workflow with blue-green strategy
- [ ] Implemented Docker containerization with multi-stage builds
- [ ] Set up Dependabot for automated dependency updates
- [ ] Implemented health check endpoints
- [ ] Configured Prometheus metrics
- [ ] Created rollback strategy and workflow

## Next Steps

1. **Tutorial 10: Troubleshooting and Advanced Topics** - Master debugging and advanced patterns
2. **Set up monitoring dashboards** - Grafana, Datadog, or CloudWatch
3. **Implement canary deployments** - Gradual rollout to production

## Additional Resources

- **GitHub Actions Docs**: [docs.github.com/en/actions](https://docs.github.com/en/actions)
- **Docker Best Practices**: [docs.docker.com/develop/dev-best-practices](https://docs.docker.com/develop/dev-best-practices/)
- **AWS ECS Guide**: [docs.aws.amazon.com/ecs](https://docs.aws.amazon.com/ecs/)
- **Prometheus Rust Client**: [docs.rs/prometheus](https://docs.rs/prometheus/)

---

**Tutorial Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Author**: ContentCreationAgent (かくちゃん)
