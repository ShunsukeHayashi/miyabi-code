# 🦀 Rust Lambda Implementation Plan - Full Code Overview

**Version**: 1.0.0
**Created**: 2025-11-15
**Status**: Ready to Implement

---

## ✅ Step 1: Dependencies Added (COMPLETE)

### miyabi-web-api/Cargo.toml
```toml
✅ lambda_runtime = "0.13"
✅ lambda_http = "0.13"
✅ redis = { version = "0.27", features = ["tokio-comp", "connection-manager", "aio"] }
✅ aws-config = "1.5"
✅ aws-sdk-dynamodb = "1.46"
✅ miyabi-aws-agent = { path = "../miyabi-aws-agent" }
```

### miyabi-aws-agent/Cargo.toml
```toml
✅ lambda_runtime = "0.13"
✅ aws-sdk-cloudwatchlogs = "1.48"
✅ redis = { version = "0.27", features = ["tokio-comp", "connection-manager", "aio"] }
✅ tokio-retry = "0.3"
✅ backoff = "0.4"
```

---

## 📦 Step 2: Files to Create

### File 1: `crates/miyabi-web-api/src/bin/lambda-api.rs`

**Purpose**: Lambda entry point for API Gateway requests

**Code Structure**:
```rust
use lambda_http::{run, service_fn, Error, Request, Response, Body};
use miyabi_web_api::*;
use redis::aio::MultiplexedConnection;
use aws_sdk_dynamodb::Client as DynamoDbClient;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    redis: MultiplexedConnection,
    dynamodb: DynamoDbClient,
    tasks_table: String,
    projects_table: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // 1. Initialize CloudWatch Logs tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().json())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // 2. Connect to Redis
    let redis_endpoint = std::env::var("REDIS_ENDPOINT")?;
    let redis_port = std::env::var("REDIS_PORT")?;
    let redis_url = format!("redis://{}:{}", redis_endpoint, redis_port);

    let redis_client = redis::Client::open(redis_url)?;
    let redis_conn = redis_client.get_multiplexed_tokio_connection().await?;

    // 3. Initialize DynamoDB client
    let aws_config = aws_config::load_from_env().await;
    let dynamodb = DynamoDbClient::new(&aws_config);

    // 4. Create app state
    let state = AppState {
        redis: redis_conn,
        dynamodb,
        tasks_table: std::env::var("TASKS_TABLE_NAME")?,
        projects_table: std::env::var("PROJECTS_TABLE_NAME")?,
    };

    // 5. Run Lambda runtime
    run(service_fn(|event: Request| async {
        handle_request(event, &state).await
    }))
    .await
}

async fn handle_request(
    event: Request,
    state: &AppState,
) -> Result<Response<Body>, Error> {
    let path = event.uri().path();
    let method = event.method();

    tracing::info!("Request: {} {}", method, path);

    match (method.as_str(), path) {
        ("GET", "/api/tasks") => get_tasks(state).await,
        ("GET", path) if path.starts_with("/api/tasks/") => {
            let task_id = path.strip_prefix("/api/tasks/").unwrap();
            get_task(state, task_id).await
        }
        ("GET", "/api/projects") => get_projects(state).await,
        ("POST", "/api/tasks") => {
            let body = event.body();
            create_task(state, body).await
        }
        ("GET", "/health") => {
            Ok(Response::builder()
                .status(200)
                .header("content-type", "application/json")
                .body(Body::from(r#"{"status":"healthy"}"#))
                .unwrap())
        }
        _ => {
            Ok(Response::builder()
                .status(404)
                .header("content-type", "application/json")
                .body(Body::from(r#"{"error":"Not Found"}"#))
                .unwrap())
        }
    }
}

// GET /api/tasks - Get all tasks from Redis (with DynamoDB fallback)
async fn get_tasks(state: &AppState) -> Result<Response<Body>, Error> {
    use redis::AsyncCommands;

    let mut redis = state.redis.clone();

    // Try Redis first
    let task_keys: Vec<String> = redis
        .keys("task:*")
        .await
        .unwrap_or_default();

    if !task_keys.is_empty() {
        let tasks_json: Vec<String> = redis
            .mget(&task_keys)
            .await
            .unwrap_or_default();

        let response_body = format!(r#"{{"tasks":{}}}"#,
            serde_json::to_string(&tasks_json).unwrap());

        return Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(Body::from(response_body))
            .unwrap());
    }

    // Fallback to DynamoDB
    tracing::warn!("Redis cache miss, falling back to DynamoDB");

    let result = state.dynamodb
        .scan()
        .table_name(&state.tasks_table)
        .limit(100)
        .send()
        .await?;

    let tasks_json = serde_json::to_string(&result.items).unwrap();
    let response_body = format!(r#"{{"tasks":{}}}"#, tasks_json);

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(Body::from(response_body))
        .unwrap())
}

// GET /api/tasks/:id - Get specific task
async fn get_task(state: &AppState, task_id: &str) -> Result<Response<Body>, Error> {
    use redis::AsyncCommands;

    let mut redis = state.redis.clone();
    let key = format!("task:{}", task_id);

    // Try Redis first
    if let Ok(task_json) = redis.get::<_, String>(&key).await {
        return Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(Body::from(task_json))
            .unwrap());
    }

    // Fallback to DynamoDB
    tracing::warn!("Redis cache miss for task {}, falling back to DynamoDB", task_id);

    let result = state.dynamodb
        .query()
        .table_name(&state.tasks_table)
        .key_condition_expression("task_id = :task_id")
        .expression_attribute_values(":task_id", aws_sdk_dynamodb::types::AttributeValue::S(task_id.to_string()))
        .limit(1)
        .send()
        .await?;

    if let Some(item) = result.items.and_then(|items| items.into_iter().next()) {
        let task_json = serde_json::to_string(&item).unwrap();
        return Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(Body::from(task_json))
            .unwrap());
    }

    Ok(Response::builder()
        .status(404)
        .header("content-type", "application/json")
        .body(Body::from(r#"{"error":"Task not found"}"#))
        .unwrap())
}

// GET /api/projects - Get all projects
async fn get_projects(state: &AppState) -> Result<Response<Body>, Error> {
    use redis::AsyncCommands;

    let mut redis = state.redis.clone();

    // Try Redis first
    let project_keys: Vec<String> = redis
        .keys("project:*")
        .await
        .unwrap_or_default();

    if !project_keys.is_empty() {
        let projects_json: Vec<String> = redis
            .mget(&project_keys)
            .await
            .unwrap_or_default();

        let response_body = format!(r#"{{"projects":{}}}"#,
            serde_json::to_string(&projects_json).unwrap());

        return Ok(Response::builder()
            .status(200)
            .header("content-type", "application/json")
            .body(Body::from(response_body))
            .unwrap());
    }

    // Fallback to DynamoDB
    let result = state.dynamodb
        .scan()
        .table_name(&state.projects_table)
        .limit(50)
        .send()
        .await?;

    let projects_json = serde_json::to_string(&result.items).unwrap();
    let response_body = format!(r#"{{"projects":{}}}"#, projects_json);

    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(Body::from(response_body))
        .unwrap())
}

// POST /api/tasks - Create new task
async fn create_task(state: &AppState, body: &[u8]) -> Result<Response<Body>, Error> {
    // Parse request body
    let task: serde_json::Value = serde_json::from_slice(body)?;

    let task_id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().timestamp_millis();

    // Write to DynamoDB
    state.dynamodb
        .put_item()
        .table_name(&state.tasks_table)
        .item("task_id", aws_sdk_dynamodb::types::AttributeValue::S(task_id.clone()))
        .item("timestamp", aws_sdk_dynamodb::types::AttributeValue::N(timestamp.to_string()))
        .item("task_name", aws_sdk_dynamodb::types::AttributeValue::S(task["task_name"].as_str().unwrap_or("Untitled").to_string()))
        .item("status", aws_sdk_dynamodb::types::AttributeValue::S("pending".to_string()))
        .send()
        .await?;

    // Write to Redis cache
    use redis::AsyncCommands;
    let mut redis = state.redis.clone();
    let key = format!("task:{}", task_id);
    let task_json = serde_json::to_string(&task)?;
    redis.set_ex::<_, _, ()>(&key, task_json, 3600).await?;

    let response_body = format!(r#"{{"task_id":"{}","status":"created"}}"#, task_id);

    Ok(Response::builder()
        .status(201)
        .header("content-type", "application/json")
        .body(Body::from(response_body))
        .unwrap())
}
```

**Size**: ~300 lines

---

### File 2: `crates/miyabi-aws-agent/src/bin/progress-collector.rs`

**Purpose**: Background Lambda for collecting progress from CloudWatch Logs

**Code Structure**:
```rust
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use aws_sdk_cloudwatchlogs::Client as CloudWatchLogsClient;
use aws_sdk_dynamodb::Client as DynamoDbClient;
use redis::aio::MultiplexedConnection;
use serde::{Deserialize, Serialize};
use tokio_retry::strategy::{ExponentialBackoff, jitter};
use tokio_retry::Retry;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProgressEvent {
    log_group: String,
    start_time: i64,
    end_time: i64,
}

#[derive(Clone)]
struct AppState {
    cloudwatch_logs: CloudWatchLogsClient,
    dynamodb: DynamoDbClient,
    redis: MultiplexedConnection,
    tasks_table: String,
    projects_table: String,
    cdk_log_group: String,
    agents_log_group: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize CloudWatch Logs tracing
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Initialize AWS clients
    let aws_config = aws_config::load_from_env().await;
    let cloudwatch_logs = CloudWatchLogsClient::new(&aws_config);
    let dynamodb = DynamoDbClient::new(&aws_config);

    // Connect to Redis
    let redis_endpoint = std::env::var("REDIS_ENDPOINT")?;
    let redis_port = std::env::var("REDIS_PORT")?;
    let redis_url = format!("redis://{}:{}", redis_endpoint, redis_port);

    let redis_client = redis::Client::open(redis_url)?;
    let redis_conn = redis_client.get_multiplexed_tokio_connection().await?;

    // Create app state
    let state = AppState {
        cloudwatch_logs,
        dynamodb,
        redis: redis_conn,
        tasks_table: std::env::var("TASKS_TABLE_NAME")?,
        projects_table: std::env::var("PROJECTS_TABLE_NAME")?,
        cdk_log_group: std::env::var("CDK_LOG_GROUP")?,
        agents_log_group: std::env::var("AGENTS_LOG_GROUP")?,
    };

    // Run Lambda runtime
    run(service_fn(|event: LambdaEvent<ProgressEvent>| async {
        collect_progress(event, &state).await
    }))
    .await
}

async fn collect_progress(
    event: LambdaEvent<ProgressEvent>,
    state: &AppState,
) -> Result<String, Error> {
    let (event, _context) = event.into_parts();

    tracing::info!("Collecting progress from log group: {}", event.log_group);

    // Collect from CDK deploy logs
    let cdk_progress = collect_from_log_group(
        state,
        &state.cdk_log_group,
        event.start_time,
        event.end_time,
    ).await?;

    // Collect from Agent logs
    let agent_progress = collect_from_log_group(
        state,
        &state.agents_log_group,
        event.start_time,
        event.end_time,
    ).await?;

    // Write to DynamoDB and Redis
    for progress in cdk_progress.iter().chain(agent_progress.iter()) {
        write_progress(state, progress).await?;
    }

    Ok(format!("Collected {} progress records", cdk_progress.len() + agent_progress.len()))
}

async fn collect_from_log_group(
    state: &AppState,
    log_group_name: &str,
    start_time: i64,
    end_time: i64,
) -> Result<Vec<ProgressRecord>, Error> {
    // Retry strategy: 5 attempts with exponential backoff + jitter
    let retry_strategy = ExponentialBackoff::from_millis(1000)
        .max_delay(std::time::Duration::from_secs(30))
        .take(5)
        .map(jitter);

    let result = Retry::spawn(retry_strategy, || async {
        fetch_log_events(state, log_group_name, start_time, end_time).await
    })
    .await;

    match result {
        Ok(events) => Ok(parse_log_events(events)),
        Err(e) => {
            tracing::error!("All retries failed for log group {}: {:?}", log_group_name, e);
            // Fallback to DynamoDB
            fallback_to_dynamodb(state).await
        }
    }
}

async fn fetch_log_events(
    state: &AppState,
    log_group_name: &str,
    start_time: i64,
    end_time: i64,
) -> Result<Vec<aws_sdk_cloudwatchlogs::types::FilteredLogEvent>, Error> {
    tracing::info!("Fetching logs from {} ({} - {})", log_group_name, start_time, end_time);

    let result = state.cloudwatch_logs
        .filter_log_events()
        .log_group_name(log_group_name)
        .start_time(start_time)
        .end_time(end_time)
        .limit(1000)
        .send()
        .await?;

    Ok(result.events.unwrap_or_default())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProgressRecord {
    task_id: String,
    timestamp: i64,
    progress: Progress,
    status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Progress {
    current: i32,
    total: i32,
    percentage: i32,
}

fn parse_log_events(events: Vec<aws_sdk_cloudwatchlogs::types::FilteredLogEvent>) -> Vec<ProgressRecord> {
    events
        .into_iter()
        .filter_map(|event| {
            let message = event.message?;

            // Parse CDK deploy logs: "MiyabiWebUIStack | 5/29 | ..."
            if let Some(caps) = regex::Regex::new(r"(\d+)/(\d+)")
                .ok()?
                .captures(&message)
            {
                let current: i32 = caps.get(1)?.as_str().parse().ok()?;
                let total: i32 = caps.get(2)?.as_str().parse().ok()?;
                let percentage = (current * 100) / total;

                Some(ProgressRecord {
                    task_id: format!("task-cdk-deploy-{}", event.timestamp?),
                    timestamp: event.timestamp?,
                    progress: Progress { current, total, percentage },
                    status: if percentage == 100 { "completed" } else { "running" }.to_string(),
                })
            } else {
                None
            }
        })
        .collect()
}

async fn write_progress(state: &AppState, progress: &ProgressRecord) -> Result<(), Error> {
    use redis::AsyncCommands;

    // Write to DynamoDB
    state.dynamodb
        .put_item()
        .table_name(&state.tasks_table)
        .item("task_id", aws_sdk_dynamodb::types::AttributeValue::S(progress.task_id.clone()))
        .item("timestamp", aws_sdk_dynamodb::types::AttributeValue::N(progress.timestamp.to_string()))
        .item("status", aws_sdk_dynamodb::types::AttributeValue::S(progress.status.clone()))
        .item("progress_current", aws_sdk_dynamodb::types::AttributeValue::N(progress.progress.current.to_string()))
        .item("progress_total", aws_sdk_dynamodb::types::AttributeValue::N(progress.progress.total.to_string()))
        .item("progress_percentage", aws_sdk_dynamodb::types::AttributeValue::N(progress.progress.percentage.to_string()))
        .send()
        .await?;

    // Write to Redis cache (TTL 1 hour)
    let mut redis = state.redis.clone();
    let key = format!("task:{}", progress.task_id);
    let value = serde_json::to_string(progress)?;
    redis.set_ex::<_, _, ()>(&key, value, 3600).await?;

    tracing::info!("Wrote progress for task {}: {}%", progress.task_id, progress.progress.percentage);

    Ok(())
}

async fn fallback_to_dynamodb(state: &AppState) -> Result<Vec<ProgressRecord>, Error> {
    tracing::warn!("Falling back to DynamoDB for progress data");

    let result = state.dynamodb
        .scan()
        .table_name(&state.tasks_table)
        .limit(100)
        .send()
        .await?;

    // Convert DynamoDB items to ProgressRecord
    let records: Vec<ProgressRecord> = result.items
        .unwrap_or_default()
        .into_iter()
        .filter_map(|item| {
            Some(ProgressRecord {
                task_id: item.get("task_id")?.as_s().ok()?.clone(),
                timestamp: item.get("timestamp")?.as_n().ok()?.parse().ok()?,
                progress: Progress {
                    current: item.get("progress_current")?.as_n().ok()?.parse().ok()?,
                    total: item.get("progress_total")?.as_n().ok()?.parse().ok()?,
                    percentage: item.get("progress_percentage")?.as_n().ok()?.parse().ok()?,
                },
                status: item.get("status")?.as_s().ok()?.clone(),
            })
        })
        .collect();

    Ok(records)
}
```

**Size**: ~250 lines

---

## 🛠️ Step 3: Build Commands

### Install cargo-lambda (one-time)
```bash
cargo install cargo-lambda
```

### Build miyabi-web-api Lambda
```bash
cd crates/miyabi-web-api
cargo lambda build --release --arm64 --bin lambda-api

# Output: target/lambda/lambda-api/bootstrap.zip
```

### Build progress-collector Lambda
```bash
cd crates/miyabi-aws-agent
cargo lambda build --release --arm64 --bin progress-collector

# Output: target/lambda/progress-collector/bootstrap.zip
```

---

## 📋 Step 4: CDK Stack Updates

### Update `infrastructure/aws-cdk/lib/miyabi-webui-stack.ts`

**Changes Required**:

1. **Replace Node.js Lambda with Rust Lambda** (Line ~329-353):
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
  handler: 'bootstrap',
  code: lambda.Code.fromAsset('../../crates/miyabi-web-api/target/lambda/lambda-api'),
  architecture: lambda.Architecture.ARM_64,  // ARM Graviton2 (cheaper)
  timeout: cdk.Duration.seconds(30),
  memorySize: 256,  // Rust needs less memory
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [lambdaSecurityGroup],
  environment: {
    REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
    REDIS_PORT: redisCluster.attrRedisEndpointPort,
    TASKS_TABLE_NAME: tasksTable.tableName,
    PROJECTS_TABLE_NAME: projectsTable.tableName,
    RUST_BACKTRACE: '1',
    RUST_LOG: 'info',
  },
});
```

2. **Replace Progress Collector Lambda** (Line ~275-296):
```typescript
const progressCollectorLambda = new lambda.Function(this, 'ProgressCollectorLambda', {
  runtime: lambda.Runtime.PROVIDED_AL2023,
  handler: 'bootstrap',
  code: lambda.Code.fromAsset('../../crates/miyabi-aws-agent/target/lambda/progress-collector'),
  architecture: lambda.Architecture.ARM_64,
  timeout: cdk.Duration.seconds(60),
  memorySize: 256,
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
    RUST_LOG: 'info',
  },
});
```

---

## 🚀 Step 5: Deployment Script

### Create `scripts/deploy-rust-lambdas.sh`

```bash
#!/bin/bash
set -e

echo "🦀 Deploying Rust Lambda Functions to AWS"
echo "========================================="

# 1. Install cargo-lambda if not installed
if ! command -v cargo-lambda &> /dev/null; then
    echo "📦 Installing cargo-lambda..."
    cargo install cargo-lambda
fi

# 2. Build API Lambda
echo ""
echo "🔨 Building miyabi-web-api Lambda (ARM64)..."
cd crates/miyabi-web-api
cargo lambda build --release --arm64 --bin lambda-api
echo "✅ miyabi-web-api built: target/lambda/lambda-api/bootstrap"
cd ../..

# 3. Build Progress Collector Lambda
echo ""
echo "🔨 Building progress-collector Lambda (ARM64)..."
cd crates/miyabi-aws-agent
cargo lambda build --release --arm64 --bin progress-collector
echo "✅ progress-collector built: target/lambda/progress-collector/bootstrap"
cd ../..

# 4. Deploy CDK stack
echo ""
echo "🚀 Deploying CDK stack..."
cd infrastructure/aws-cdk
npx cdk deploy --require-approval never 2>&1 | tee ../../.claude/logs/rust-lambda-deploy.log
cd ../..

echo ""
echo "🎉 Rust Lambda Deployment Complete!"
echo ""
echo "📊 Deployment Summary:"
echo "  - API Lambda: miyabi-web-api (Rust, ARM64)"
echo "  - Progress Collector: miyabi-aws-agent (Rust, ARM64)"
echo "  - Runtime: PROVIDED_AL2023 (Amazon Linux 2023)"
echo "  - Architecture: ARM64 (Graviton2)"
echo ""
echo "📝 Logs: .claude/logs/rust-lambda-deploy.log"
```

---

## 📊 Expected Results

### Performance Improvements

| Metric | Node.js (Before) | Rust (After) | Improvement |
|--------|-----------------|--------------|-------------|
| Cold Start (VPC) | 800-1000ms | 100-300ms | **70% faster** |
| Warm Execution | 10-20ms | 3-5ms | **60% faster** |
| Memory Usage | 512MB | 256MB | **50% lower** |
| Binary Size | 50MB (node_modules) | 10MB | **80% smaller** |

### Cost Savings

**Monthly Lambda Costs** (1M requests, 100ms avg):
- Node.js (512MB): $20.80/month
- **Rust (256MB)**: **$5.20/month**
- **Savings**: **$15.60/month (75% reduction)**

Combined with ElastiCache ($51/month total), the overall architecture costs:
- Old: $5.25 (DynamoDB only)
- New: $56/month (ElastiCache + DynamoDB + Rust Lambda)
- **Net increase**: $50.75/month for ultra-fast real-time (0.1ms Redis + ARM Lambda)

---

## ✅ Implementation Checklist

- [x] Add Lambda dependencies to Cargo.toml files
- [ ] Create `crates/miyabi-web-api/src/bin/lambda-api.rs`
- [ ] Create `crates/miyabi-aws-agent/src/bin/progress-collector.rs`
- [ ] Install cargo-lambda: `cargo install cargo-lambda`
- [ ] Build Rust Lambda binaries
- [ ] Update CDK stack to use Rust binaries
- [ ] Create deployment script
- [ ] Test locally with `cargo lambda watch`
- [ ] Deploy to AWS
- [ ] Monitor CloudWatch Logs
- [ ] Verify performance improvements

---

## 🎯 Next Steps

**Option 1: Implement All Files** (Recommended)
- Create both Lambda binaries
- Build with cargo-lambda
- Update CDK
- Deploy

**Option 2: Incremental Approach**
- Start with API Lambda only
- Test and verify
- Add Progress Collector Lambda
- Full deployment

**Option 3: Parallel Testing**
- Deploy Rust Lambda alongside Node.js Lambda
- Route 10% traffic to Rust
- Compare metrics
- Gradual migration

Which option would you like to proceed with?

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Rust Lambda Implementation Plan
**Status**: ⏳ Ready for Implementation

🦀 **"All dependencies added, ready to build Rust Lambda functions!"** 🦀
