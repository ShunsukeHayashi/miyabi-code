# AWS Lambda Deployment Guide for Miyabi Web API

**Status**: ✅ Code Complete | ⚠️  Build Requires Linux Environment
**Last Updated**: 2025-11-23
**Issue**: #987

---

## 🎯 Phase 2 Completion Summary

###✅ Completed Tasks

1. **#983**: Service Layer Refactoring - Created `WorkerService` and `CoordinatorService`
2. **#984**: Task Management API - Full CRUD with retry logic
3. **#985**: Worker & Coordinator Status APIs - Health monitoring with heartbeats
4. **#986**: Uncomment & Test Existing APIs:
   - Created `mock_login` endpoint for development testing
   - Fixed database schema types (github_id: BIGINT, timestamps: TIMESTAMPTZ)
   - Applied 2 new migrations (20251123000000, 20251123000001)
   - Tested all major endpoints successfully (health, auth, agents, logs, worktrees, deployments)

5. **#987**: Lambda Runtime Setup (partial):
   - ✅ Added Lambda dependencies to Cargo.toml
   - ✅ Created `src/bin/lambda-api.rs` binary
   - ✅ Made redis optional for Lambda builds
   - ⚠️  Cross-compilation blocked by OpenSSL (see below)

---

## ⚠️  macOS → Lambda Cross-Compilation Issue

**Problem**: `cargo-lambda` cross-compiles from macOS (aarch64-apple-darwin) to Lambda (x86_64-unknown-linux-gnu).
Some dependencies (via transitive deps) require OpenSSL which doesn't support easy cross-compilation.

**Error**:
```
Could not find openssl via pkg-config:
pkg-config has not been configured to support cross-compilation.
$HOST = aarch64-apple-darwin
$TARGET = x86_64-unknown-linux-gnu
```

**Attempted Fixes**:
1. ✅ Switched `reqwest` to `rustls-tls` (from native-tls)
2. ✅ Made `redis` optional
3. ❌ Still blocked by transitive OpenSSL deps

---

## 🔧 Recommended Solution: Build on Linux

### Option 1: Use Docker (Recommended)

**Create Dockerfile**:
```dockerfile
FROM rust:1.75-slim as builder
WORKDIR /app

# Install cargo-lambda
RUN cargo install cargo-lambda

# Copy source
COPY . .

# Build Lambda binary
RUN cargo lambda build --release --bin lambda-api --features lambda --no-default-features

# Output will be in target/lambda/lambda-api/bootstrap.zip
```

**Build Command**:
```bash
docker build -t miyabi-lambda-builder .
docker run --rm -v $(pwd)/target:/app/target miyabi-lambda-builder
```

**Deploy**:
```bash
cargo lambda deploy \
  --binary-name lambda-api \
  --iam-role arn:aws:iam::112530848482:role/MiyabiLambdaExecutionRole \
  --region us-west-2 \
  --memory 512 \
  --timeout 30 \
  --env-file .env.production
```

---

### Option 2: Build on EC2 MAJIN

Since MAJIN is already running Linux:

```bash
# On Pixel/Mac - sync code to MAJIN
rsync -avz --exclude target /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private majin:~/

# SSH to MAJIN
ssh majin

# Install cargo-lambda (one-time)
cargo install cargo-lambda

# Build
cd miyabi-private/crates/miyabi-web-api
cargo lambda build --release --bin lambda-api --features lambda --no-default-features

# Deploy
cargo lambda deploy \
  --binary-name lambda-api \
  --iam-role arn:aws:iam::112530848482:role/MiyabiLambdaExecutionRole \
  --region us-west-2 \
  --memory 512 \
  --timeout 30
```

---

### Option 3: Use Zig Cross-Compilation (Advanced)

Install zig and use it as linker:

```bash
brew install zig
cargo install cargo-zigbuild

# Build with zig
cargo zigbuild --target x86_64-unknown-linux-gnu --release --bin lambda-api --features lambda
```

---

## 📋 Deployment Checklist

Once Lambda binary is built:

- [ ] Deploy Lambda function
- [ ] Set environment variables:
  ```bash
  DATABASE_URL=postgresql://...
  JWT_SECRET=...
  GITHUB_CLIENT_ID=...
  GITHUB_CLIENT_SECRET=...
  GITHUB_CALLBACK_URL=...
  FRONTEND_URL=...
  ```
- [ ] Configure provisioned concurrency (2 instances)
- [ ] Create API Gateway HTTP API
- [ ] Configure CORS
- [ ] Update CloudFront dashboard with API URL
- [ ] Create CloudWatch Log Insights queries
- [ ] Create CloudWatch Alarms (error rate, latency)
- [ ] End-to-end testing

---

## 🧪 Local Testing (Completed ✅)

API server successfully tested locally:

```bash
# Server running on http://localhost:8080

# Health check with DB stats
curl http://localhost:8080/api/v1/health
# → {status: "ok", database: {active_connections: 1, idle_connections: 9, max_connections: 100}}

# Mock login
curl -X POST http://localhost:8080/api/v1/auth/mock \
  -H "Content-Type: application/json" \
  -d '{"github_id":12345,"email":"test@example.com"}'
# → {access_token: "...", refresh_token: "...", user: {...}}

# Agents API
curl http://localhost:8080/api/v1/agents
# → {agents: [{id: "coordinator-agent", ...}, ...]}

# Logs API
curl http://localhost:8080/api/v1/logs
# → {logs: [{id: "git-76d42a0", message: "fix(...)", ...}, ...]}

# Worktrees API
curl http://localhost:8080/api/v1/worktrees
# → {worktrees: [{id: "miyabi-private", branch: "feature/972-...", ...}, ...]}

# Deployments API
curl http://localhost:8080/api/v1/deployments
# → {deployments: [{id: "deploy-001", version: "v0.1.4", ...}, ...]}
```

**All endpoints working! ✅**

---

## 📊 Phase 2 Metrics

**Issues Completed**: 4/5 (80%)
**Blocked**: Lambda cross-compilation (solvable on Linux)
**Time**: ~6 hours total
**Database Migrations**: 2 new migrations applied
**New Services**: 2 (WorkerService, CoordinatorService)
**New Models**: 5 (Task, CreateTaskRequest, UpdateTaskRequest, TaskQueryFilters, TaskDependency)
**New Routes**: mock_login endpoint
**Tests**: All major endpoints verified ✅

---

## 🚀 Next Steps

**Immediate** (requires Linux environment):
1. Build Lambda binary on MAJIN or Docker
2. Deploy to AWS Lambda
3. Configure API Gateway
4. Set up CloudWatch monitoring

**Phase 3** (can start now):
- #978: API Client Implementation
- #979: Dashboard UI Modernization
- #980: Real-Time WebSocket Integration
- #981: Authentication Flow Implementation

---

**Parent Issue**: #970, #977
**Related**: #983-#986 (completed), #988-#993 (next phase)
