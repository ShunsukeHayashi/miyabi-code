# 🦀 Rust Lambda Integration - Miyabi Services Cloud Deployment

**Version**: 1.0.0
**Created**: 2025-11-15
**Purpose**: Integrate existing Rust services into AWS Lambda architecture

---

## 🚨 Problem: JavaScript vs Rust Infrastructure Mismatch

### Current Issue

We've been designing **Node.js Lambda functions** when we already have comprehensive **Rust services**:

❌ **What we were building (Node.js)**:
- `lambda/progress-collector/index.js` (NEW)
- `web-ui-lambda/index.js` (NEW)
- ioredis + aws-sdk (JavaScript dependencies)

✅ **What we already have (Rust)**:
- `miyabi-web-api` - Axum web framework with JWT, WebSocket, Swagger
- `miyabi-aws-agent` - Full AWS SDK (DynamoDB, S3, Lambda, CloudWatch)
- `miyabi-orchestrator` - Agent coordination with metrics
- `miyabi-persistence` - SQLite persistence layer
- 40+ other Rust crates in the workspace

---

## 🎯 Solution: Rust Lambda Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│         Rust-Based Lambda Architecture (v2.0)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WebUI (React)                                                │
│     ↓                                                         │
│  CloudFront                                                   │
│     ↓                                                         │
│  API Gateway                                                  │
│     ↓                                                         │
│  【miyabi-web-api】Rust Lambda (Axum)                        │
│     ↓                                                         │
│  Redis (ElastiCache) ⚡ 0.1ms                                │
│     ↑                                                         │
│  【miyabi-aws-agent】Rust Lambda (Background)                │
│     ↓                  ↓                                      │
│  DynamoDB          CloudWatch Logs                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Changes

| Component | Old (Node.js) | New (Rust) |
|-----------|--------------|------------|
| API Lambda | `web-ui-lambda/index.js` | `miyabi-web-api` crate |
| Progress Collector | `progress-collector/index.js` | `miyabi-aws-agent` crate |
| AWS Operations | `aws-sdk` (JavaScript) | `aws-sdk-*` (Rust) |
| Redis Client | `ioredis` | `redis` crate |
| Web Framework | Express.js | Axum |
| Performance | ~100ms cold start | ~10ms cold start (with optimization) |

---

## 📦 Rust Services Mapping

### 1. `miyabi-web-api` → API Lambda

**Current Features**:
- ✅ Axum web framework
- ✅ JWT authentication
- ✅ WebSocket support
- ✅ Swagger/OpenAPI (utoipa)
- ✅ PostgreSQL support (sqlx)

**Needed Additions**:
- ❌ Redis client (add `redis` crate)
- ❌ DynamoDB operations (integrate `miyabi-aws-agent`)
- ❌ Lambda runtime (add `lambda_runtime` crate)

**New Cargo.toml additions**:
```toml
[dependencies]
# Existing miyabi-web-api dependencies...

# Lambda support
lambda_runtime = "0.12"
lambda_http = "0.12"

# Redis
redis = { version = "0.27", features = ["tokio-comp", "connection-manager"] }

# DynamoDB via miyabi-aws-agent
miyabi-aws-agent = { path = "../miyabi-aws-agent" }
```

---

### 2. `miyabi-aws-agent` → Progress Collector Lambda

**Current Features**:
- ✅ Full AWS SDK integration
- ✅ DynamoDB operations (`aws-sdk-dynamodb`)
- ✅ CloudFormation, S3, Lambda support
- ✅ Async operations with Tokio

**Needed Additions**:
- ❌ CloudWatch Logs fetching (add `aws-sdk-cloudwatchlogs`)
- ❌ Redis write operations (add `redis` crate)
- ❌ Lambda runtime
- ❌ Retry logic with exponential backoff

**New Cargo.toml additions**:
```toml
[dependencies]
# Existing miyabi-aws-agent dependencies...

# CloudWatch Logs
aws-sdk-cloudwatchlogs = "1.48"

# Lambda support
lambda_runtime = "0.12"

# Redis
redis = { version = "0.27", features = ["tokio-comp", "connection-manager"] }

# Retry logic
tokio-retry = "0.3"
backoff = "0.4"
```

---

### 3. `miyabi-persistence` → Redis/DynamoDB Abstraction

**Current Features**:
- ✅ SQLite persistence layer
- ✅ Async operations (sqlx)
- ✅ Transaction support

**Needed Changes**:
- Extend to support **DynamoDB** and **Redis** backends
- Create trait-based abstraction for multiple backends

**New Module Structure**:
```rust
miyabi-persistence/
├── src/
│   ├── lib.rs
│   ├── sqlite.rs       (existing)
│   ├── dynamodb.rs     (NEW)
│   ├── redis.rs        (NEW)
│   └── backend.rs      (NEW - trait abstraction)
```

---

## 🛠️ Implementation Steps

### Step 1: Add Lambda Runtime to Rust Crates

**File**: `crates/miyabi-web-api/Cargo.toml`

```toml
[dependencies]
# ... existing dependencies ...

# Lambda runtime
lambda_runtime = "0.12"
lambda_http = "0.12"

# Redis
redis = { version = "0.27", features = ["tokio-comp", "connection-manager"] }

# AWS integration
miyabi-aws-agent = { path = "../miyabi-aws-agent" }

# Tracing for CloudWatch Logs
tracing-subscriber = { version = "0.3", features = ["json"] }
```

---

### Step 2: Create Lambda Binary Targets

**File**: `crates/miyabi-web-api/src/bin/lambda-api.rs` (NEW)

```rust
use lambda_http::{run, service_fn, Error, Request, Response};
use miyabi_web_api::{create_app_state, handle_request};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Error> {
    // CloudWatch Logs integration
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Initialize Redis connection
    let redis_endpoint = std::env::var("REDIS_ENDPOINT")?;
    let redis_port = std::env::var("REDIS_PORT")?;
    let redis_url = format!("redis://{}:{}", redis_endpoint, redis_port);

    let redis_client = redis::Client::open(redis_url)?;
    let redis_conn = redis_client.get_multiplexed_tokio_connection().await?;

    // Initialize DynamoDB client
    let aws_config = aws_config::load_from_env().await;
    let dynamodb_client = aws_sdk_dynamodb::Client::new(&aws_config);

    // Create app state
    let app_state = create_app_state(redis_conn, dynamodb_client).await?;

    // Run Lambda runtime
    run(service_fn(|event: Request| async {
        handle_request(event, &app_state).await
    }))
    .await
}
```

---

### Step 3: Build Rust Lambda with cargo-lambda

**Install cargo-lambda**:
```bash
cargo install cargo-lambda
```

**Build for Lambda**:
```bash
cd crates/miyabi-web-api
cargo lambda build --release --arm64

# Output: target/lambda/miyabi-web-api/bootstrap.zip
```

**Build for Progress Collector**:
```bash
cd crates/miyabi-aws-agent
cargo lambda build --release --arm64 --bin progress-collector

# Output: target/lambda/progress-collector/bootstrap.zip
```

---

### Step 4: Update CDK Stack to Use Rust Binaries

**File**: `infrastructure/aws-cdk/lib/miyabi-webui-stack.ts`

**Replace Node.js Lambda definitions**:
```typescript
// ❌ OLD: Node.js Lambda
const apiLambda = new lambda.Function(this, 'MiyabiAPILambda', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('../web-ui-lambda'),
  // ...
});

// ✅ NEW: Rust Lambda
const apiLambda = new lambda.Function(this, 'MiyabiAPILambda', {
  runtime: lambda.Runtime.PROVIDED_AL2023,  // Custom runtime for Rust
  handler: 'bootstrap',  // Entry point
  code: lambda.Code.fromAsset('../../crates/miyabi-web-api/target/lambda/miyabi-web-api'),
  architecture: lambda.Architecture.ARM_64,  // ARM Graviton2 (cheaper)
  timeout: cdk.Duration.seconds(30),
  memorySize: 512,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [lambdaSecurityGroup],
  environment: {
    REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
    REDIS_PORT: redisCluster.attrRedisEndpointPort,
    TASKS_TABLE_NAME: tasksTable.tableName,
    PROJECTS_TABLE_NAME: projectsTable.tableName,
    RUST_BACKTRACE: '1',
  },
});
```

**Progress Collector Lambda**:
```typescript
const progressCollectorLambda = new lambda.Function(this, 'ProgressCollectorLambda', {
  runtime: lambda.Runtime.PROVIDED_AL2023,
  handler: 'bootstrap',
  code: lambda.Code.fromAsset('../../crates/miyabi-aws-agent/target/lambda/progress-collector'),
  architecture: lambda.Architecture.ARM_64,
  timeout: cdk.Duration.seconds(60),
  memorySize: 512,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [lambdaSecurityGroup],
  environment: {
    TASKS_TABLE_NAME: tasksTable.tableName,
    PROJECTS_TABLE_NAME: projectsTable.tableName,
    CDK_LOG_GROUP: cdkDeployLogGroup.logGroupName,
    AGENTS_LOG_GROUP: agentsLogGroup.logGroupName,
    REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
    REDIS_PORT: redisCluster.attrRedisEndpointPort,
    RUST_BACKTRACE: '1',
  },
});
```

---

## 📊 Performance Comparison

### Cold Start Times

| Runtime | Cold Start (VPC) | Cold Start (No VPC) | Warm Execution |
|---------|-----------------|---------------------|----------------|
| Node.js 18.x | 500-1000ms | 100-200ms | 5-10ms |
| **Rust (optimized)** | **100-300ms** | **10-50ms** | **1-3ms** |

### Memory Usage

| Runtime | Minimum Memory | Typical Usage |
|---------|---------------|---------------|
| Node.js | 512MB | 300-400MB |
| **Rust** | **256MB** | **100-150MB** |

### Cost Implications

**Monthly Lambda Costs** (1M requests, 512MB, 100ms avg):
- Node.js: $20.80/month
- **Rust (256MB, 50ms avg)**: **$5.20/month** (75% cheaper!)

---

## 🚀 Deployment Workflow

### Full Deployment Pipeline

```bash
#!/bin/bash
# deploy-rust-lambdas.sh

set -e

echo "🦀 Building Rust Lambda functions..."

# 1. Build API Lambda
cd crates/miyabi-web-api
cargo lambda build --release --arm64
echo "✅ miyabi-web-api built"

# 2. Build Progress Collector Lambda
cd ../miyabi-aws-agent
cargo lambda build --release --arm64 --bin progress-collector
echo "✅ progress-collector built"

# 3. Deploy CDK stack
cd ../../infrastructure/aws-cdk
npx cdk deploy --require-approval never

echo "🎉 Deployment complete!"
```

---

## 🔄 Migration Strategy

### Phase 1: Parallel Run (Week 1)
- Deploy Rust Lambdas alongside Node.js Lambdas
- Route 10% of traffic to Rust Lambda (using ALB weighted routing)
- Monitor performance and errors

### Phase 2: Gradual Migration (Week 2)
- Increase Rust Lambda traffic to 50%
- Compare metrics (latency, error rate, cost)
- Fix any issues

### Phase 3: Full Rust Migration (Week 3)
- Route 100% traffic to Rust Lambda
- Decommission Node.js Lambda functions
- Update documentation

### Phase 4: Optimization (Week 4)
- Enable Provisioned Concurrency if needed
- Tune memory allocation
- Optimize cold start time

---

## 📈 Expected Benefits

### 1. Performance
- ⚡ **10x faster cold start** (1000ms → 100ms)
- ⚡ **3x faster warm execution** (10ms → 3ms)
- ⚡ **50% lower memory usage** (512MB → 256MB)

### 2. Cost
- 💰 **75% lower Lambda costs** ($20/month → $5/month)
- 💰 **50% lower memory costs** (smaller instances)
- 💰 **Reduced data transfer** (smaller binaries)

### 3. Maintainability
- 🛠️ **Single language** (Rust everywhere)
- 🛠️ **Type safety** (no runtime type errors)
- 🛠️ **Better error handling** (Result<T, E>)
- 🛠️ **Shared code** (reuse existing crates)

### 4. Developer Experience
- 🧑‍💻 **Unified tooling** (cargo, rustfmt, clippy)
- 🧑‍💻 **Better IDE support** (rust-analyzer)
- 🧑‍💻 **Compile-time guarantees** (no undefined is not a function)

---

## 🎯 Next Actions

### Immediate (Today)
1. Add `lambda_runtime` and `redis` to `miyabi-web-api`
2. Add `aws-sdk-cloudwatchlogs` and `redis` to `miyabi-aws-agent`
3. Create Lambda binary targets (`src/bin/lambda-api.rs`, `src/bin/progress-collector.rs`)

### Short-term (This Week)
4. Install `cargo-lambda`: `cargo install cargo-lambda`
5. Build Rust Lambda binaries: `cargo lambda build --release --arm64`
6. Update CDK stack to use Rust binaries
7. Test locally with `cargo lambda watch`

### Medium-term (Next Week)
8. Deploy to AWS with CDK
9. Run parallel testing (Rust + Node.js)
10. Monitor performance metrics

### Long-term (Next Month)
11. Migrate 100% to Rust Lambda
12. Decommission Node.js Lambdas
13. Optimize and tune performance

---

## 🔗 References

**Official Documentation**:
- [Cargo Lambda](https://www.cargo-lambda.info/)
- [AWS Lambda Rust Runtime](https://github.com/awslabs/aws-lambda-rust-runtime)
- [Axum Web Framework](https://docs.rs/axum/latest/axum/)

**Miyabi Crates**:
- `miyabi-web-api` - Web API service
- `miyabi-aws-agent` - AWS operations
- `miyabi-persistence` - Persistence layer
- `miyabi-orchestrator` - Orchestration

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Rust Lambda Integration Plan
**Status**: ✅ Plan Complete → ⏳ Implementation Ready

🦀 **"Rust everywhere, fast and safe"** 🦀
