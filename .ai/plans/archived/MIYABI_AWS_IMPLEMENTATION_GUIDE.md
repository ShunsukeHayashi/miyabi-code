# Miyabi AWS Platform - Implementation Guide

**Project**: Miyabi AWS Implementation
**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: Implementation Planning

---

## 🎯 Overview

This document provides detailed implementation patterns, code templates, and operational procedures for building the Miyabi AWS Platform.

**Prerequisites**:
- AWS Account with Organization setup
- AWS CLI v2 configured
- Node.js 20+ (for CDK)
- Rust 1.75+ (for Miyabi agents)
- Docker Desktop
- GitHub repository access

---

## 📦 Infrastructure Patterns Catalog

### Pattern 1: Multi-Region Active-Active Deployment

**Use Case**: High availability, disaster recovery, low latency globally

**Architecture**:
```
Primary Region (us-east-1)          Secondary Region (ap-northeast-1)
┌────────────────────────┐          ┌────────────────────────┐
│  ECS Fargate Cluster   │ ◄──────► │  ECS Fargate Cluster   │
│  + Agent Workers       │          │  + Agent Workers       │
└───────────┬────────────┘          └───────────┬────────────┘
            │                                    │
            ▼                                    ▼
┌────────────────────────┐          ┌────────────────────────┐
│  DynamoDB Global Table │ ◄──────► │  DynamoDB Global Table │
│  (Replication)         │          │  (Replication)         │
└────────────────────────┘          └────────────────────────┘
            │                                    │
            └────────────────┬───────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Route 53       │
                    │  (Geolocation)  │
                    └─────────────────┘
```

**CDK Code**:
```typescript
export class MultiRegionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Primary region
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'ap-northeast-1';

    // DynamoDB Global Table
    const globalTable = new GlobalTable(this, 'MiyabiGlobalTable', {
      tableName: 'miyabi-tasks',
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      regions: [primaryRegion, secondaryRegion],
      stream: StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Route 53 Health Checks
    const primaryHealthCheck = new CfnHealthCheck(this, 'PrimaryHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: 'api-us-east-1.miyabi.io',
        port: 443,
        requestInterval: 30,
        failureThreshold: 3
      }
    });

    // Geolocation routing
    new ARecord(this, 'GeolocationRoute', {
      zone: hostedZone,
      recordName: 'api',
      target: RecordTarget.fromAlias(
        new LoadBalancerTarget(primaryAlb)
      ),
      geoLocation: GeoLocation.continent(Continent.NORTH_AMERICA)
    });
  }
}
```

**Benefits**:
- 99.99% availability
- < 50ms latency (regional routing)
- Automatic failover
- Compliance (data residency)

**Cost**: +80% (dual infrastructure)

---

### Pattern 2: Event-Driven Auto-Scaling

**Use Case**: Variable workload, cost optimization

**Architecture**:
```
GitHub Webhook → EventBridge → SQS Queue
                                    │
                                    ├─ ApproximateNumberOfMessages metric
                                    ▼
                              CloudWatch Alarm
                                    │
                                    ▼
                         ECS Service Auto Scaling
                              (1 → 100 tasks)
```

**CDK Code**:
```typescript
export class AutoScalingStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc) {
    super(scope, id);

    const cluster = new Cluster(this, 'MiyabiCluster', { vpc });

    // Task definition
    const taskDef = new FargateTaskDefinition(this, 'WorkerTask', {
      cpu: 512,
      memoryLimitMiB: 1024
    });

    taskDef.addContainer('Worker', {
      image: ContainerImage.fromRegistry('miyabi-worker:latest'),
      logging: LogDrivers.awsLogs({ streamPrefix: 'worker' })
    });

    // Service
    const service = new FargateService(this, 'WorkerService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1
    });

    // Auto Scaling based on SQS queue depth
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 100
    });

    // CPU-based scaling
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(60)
    });

    // Custom metric (SQS queue depth)
    const queueDepthMetric = new Metric({
      namespace: 'AWS/SQS',
      metricName: 'ApproximateNumberOfMessagesVisible',
      dimensionsMap: { QueueName: 'miyabi-tasks' },
      statistic: 'Average',
      period: Duration.minutes(1)
    });

    scaling.scaleOnMetric('QueueDepthScaling', {
      metric: queueDepthMetric,
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 50, change: +5 },
        { lower: 100, change: +10 },
        { lower: 500, change: +20 }
      ],
      adjustmentType: AdjustmentType.CHANGE_IN_CAPACITY
    });
  }
}
```

**Benefits**:
- Cost-effective (scale to zero capable)
- Fast response (< 60s scale-out)
- Predictable performance

**Cost**: Variable ($50-500/month depending on workload)

---

### Pattern 3: Spot Instance Fleet for Cost Optimization

**Use Case**: Batch processing, interruptible workloads

**Architecture**:
```
ECS Capacity Provider (Fargate Spot)
├─ 70% Fargate Spot (70% discount)
└─ 30% Fargate On-Demand (reliability)

Auto Scaling Target:
- Spot: Handle bulk tasks
- On-Demand: Handle critical/real-time tasks
```

**CDK Code**:
```typescript
export class SpotFleetStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const cluster = new Cluster(this, 'MiyabiCluster', { vpc });

    // Spot capacity provider
    const spotCapacityProvider = new CfnCapacityProvider(this, 'SpotCapacityProvider', {
      name: 'FARGATE_SPOT',
      autoScalingGroupProvider: {
        autoScalingGroupArn: 'arn:aws:ecs:region:account:capacity-provider/FARGATE_SPOT',
        managedScaling: {
          status: 'ENABLED',
          targetCapacity: 100,
          minimumScalingStepSize: 1,
          maximumScalingStepSize: 10
        }
      }
    });

    // Service with mixed capacity
    const service = new FargateService(this, 'WorkerService', {
      cluster,
      taskDefinition: taskDef,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 7,
          base: 0
        },
        {
          capacityProvider: 'FARGATE',
          weight: 3,
          base: 1
        }
      ]
    });
  }
}
```

**Benefits**:
- 70% cost reduction on Spot
- Graceful degradation (Spot interruption → fallback to On-Demand)

**Risk**: Spot interruption (2-minute warning)

---

### Pattern 4: Blue-Green Deployment for Zero Downtime

**Use Case**: Safe production deployments

**Architecture**:
```
Route 53 Weighted Routing
├─ Blue Environment (100% traffic)
│  └─ ECS Service (current version)
└─ Green Environment (0% traffic)
   └─ ECS Service (new version)

Deployment Process:
1. Deploy to Green (0% traffic)
2. Run smoke tests
3. Shift 10% traffic to Green
4. Monitor metrics (5 minutes)
5. Shift 100% traffic to Green
6. Decommission Blue
```

**CDK Code**:
```typescript
export class BlueGreenDeploymentStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Blue environment
    const blueService = new FargateService(this, 'BlueService', {
      cluster,
      taskDefinition: blueTaskDef,
      desiredCount: 3
    });

    const blueTargetGroup = new ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targets: [blueService]
    });

    // Green environment
    const greenService = new FargateService(this, 'GreenService', {
      cluster,
      taskDefinition: greenTaskDef,
      desiredCount: 3
    });

    const greenTargetGroup = new ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targets: [greenService]
    });

    // ALB with weighted routing
    const alb = new ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true
    });

    const listener = alb.addListener('Listener', { port: 443 });

    listener.addTargetGroups('TargetGroups', {
      targetGroups: [blueTargetGroup, greenTargetGroup]
    });

    // CodeDeploy for traffic shifting
    new EcsDeploymentGroup(this, 'DeploymentGroup', {
      service: greenService,
      blueGreenDeploymentConfig: {
        blueTargetGroup,
        greenTargetGroup,
        listener,
        trafficRoutingConfig: {
          type: TrafficRoutingConfigType.TIME_BASED_LINEAR,
          timeBasedLinear: {
            interval: Duration.minutes(5),
            percentage: 10
          }
        }
      },
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true
      }
    });
  }
}
```

**Benefits**:
- Zero downtime deployments
- Automatic rollback on failure
- A/B testing capability

---

## 🔧 Implementation Templates

### Template 1: Complete CDK Project Structure

```
miyabi-infrastructure/
├── bin/
│   └── miyabi-infra.ts              # CDK app entry point
├── lib/
│   ├── stacks/
│   │   ├── network-stack.ts         # VPC, Subnets, NAT
│   │   ├── security-stack.ts        # IAM, Security Groups, WAF
│   │   ├── compute-stack.ts         # ECS, Lambda
│   │   ├── storage-stack.ts         # S3, DynamoDB, RDS, EFS
│   │   ├── event-stack.ts           # EventBridge, SQS, SNS
│   │   └── observability-stack.ts   # CloudWatch, X-Ray
│   ├── constructs/
│   │   ├── miyabi-agent-service.ts  # Reusable agent service
│   │   └── miyabi-api-gateway.ts    # API Gateway + Lambda
│   └── config/
│       ├── dev.ts                    # Development config
│       ├── staging.ts                # Staging config
│       └── production.ts             # Production config
├── cdk.json
├── package.json
└── tsconfig.json
```

**bin/miyabi-infra.ts**:
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MiyabiNetworkStack } from '../lib/stacks/network-stack';
import { MiyabiComputeStack } from '../lib/stacks/compute-stack';
import { MiyabiStorageStack } from '../lib/stacks/storage-stack';
import { getConfig } from '../lib/config';

const app = new cdk.App();
const env = app.node.tryGetContext('environment') || 'dev';
const config = getConfig(env);

const networkStack = new MiyabiNetworkStack(app, `Miyabi-Network-${env}`, {
  env: { account: config.account, region: config.region }
});

const storageStack = new MiyabiStorageStack(app, `Miyabi-Storage-${env}`, {
  vpc: networkStack.vpc,
  env: { account: config.account, region: config.region }
});

const computeStack = new MiyabiComputeStack(app, `Miyabi-Compute-${env}`, {
  vpc: networkStack.vpc,
  storageStack,
  env: { account: config.account, region: config.region }
});

app.synth();
```

---

### Template 2: Agent Worker Docker Image

**Dockerfile** (Multi-stage, optimized):
```dockerfile
# ────────────────────────────────────────────────────────────
# Stage 1: Chef (dependency caching layer)
# ────────────────────────────────────────────────────────────
FROM rust:1.75-slim as chef

RUN cargo install cargo-chef
WORKDIR /app

# ────────────────────────────────────────────────────────────
# Stage 2: Planner (analyze dependencies)
# ────────────────────────────────────────────────────────────
FROM chef as planner

COPY Cargo.toml Cargo.lock ./
COPY crates/ ./crates/

RUN cargo chef prepare --recipe-path recipe.json

# ────────────────────────────────────────────────────────────
# Stage 3: Builder (build dependencies)
# ────────────────────────────────────────────────────────────
FROM chef as builder

COPY --from=planner /app/recipe.json recipe.json

# Build dependencies (cached layer)
RUN cargo chef cook --release --recipe-path recipe.json

# Copy source code
COPY Cargo.toml Cargo.lock ./
COPY crates/ ./crates/

# Build application
RUN cargo build --release --bin miyabi-agent-worker

# Strip binary
RUN strip /app/target/release/miyabi-agent-worker

# ────────────────────────────────────────────────────────────
# Stage 4: Runtime (minimal image)
# ────────────────────────────────────────────────────────────
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y \
      ca-certificates \
      git \
      libssl3 \
      && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 miyabi && \
    mkdir -p /mnt/efs/worktrees && \
    chown -R miyabi:miyabi /mnt/efs

USER miyabi
WORKDIR /home/miyabi

# Copy binary from builder
COPY --from=builder /app/target/release/miyabi-agent-worker /usr/local/bin/

# Environment
ENV RUST_LOG=info
ENV RUST_BACKTRACE=1
ENV WORKTREE_ROOT=/mnt/efs/worktrees

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/usr/local/bin/miyabi-agent-worker", "health"]

# Entrypoint
ENTRYPOINT ["/usr/local/bin/miyabi-agent-worker"]
CMD ["run"]
```

**Build & Push Script** (build-and-push.sh):
```bash
#!/bin/bash
set -euo pipefail

REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_NAME="miyabi-agent-worker"
VERSION="${1:-latest}"

echo "🔨 Building Docker image..."
docker build \
  --platform linux/amd64 \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  .

echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${REGISTRY}"

echo "📦 Tagging images..."
docker tag "${IMAGE_NAME}:${VERSION}" "${REGISTRY}/${IMAGE_NAME}:${VERSION}"
docker tag "${IMAGE_NAME}:latest" "${REGISTRY}/${IMAGE_NAME}:latest"

echo "🚀 Pushing to ECR..."
docker push "${REGISTRY}/${IMAGE_NAME}:${VERSION}"
docker push "${REGISTRY}/${IMAGE_NAME}:latest"

echo "✅ Done! Image: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
```

---

### Template 3: GitHub Actions CI/CD Pipeline

**.github/workflows/deploy-aws.yml**:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  # ────────────────────────────────────────────────────────────
  # Job 1: Build & Test Rust
  # ────────────────────────────────────────────────────────────
  build-rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - uses: Swatinem/rust-cache@v2

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Build
        run: cargo build --release --all

      - name: Test
        run: cargo test --all --release

      - name: Upload binary
        uses: actions/upload-artifact@v3
        with:
          name: miyabi-agent-worker
          path: target/release/miyabi-agent-worker

  # ────────────────────────────────────────────────────────────
  # Job 2: Build & Push Docker Image
  # ────────────────────────────────────────────────────────────
  build-docker:
    needs: build-rust
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.ECR_REGISTRY }}/miyabi-agent-worker
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ────────────────────────────────────────────────────────────
  # Job 3: Deploy Infrastructure (CDK)
  # ────────────────────────────────────────────────────────────
  deploy-infra:
    needs: build-docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install CDK dependencies
        working-directory: ./infrastructure
        run: npm ci

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: CDK Deploy (Staging)
        if: github.ref == 'refs/heads/staging'
        working-directory: ./infrastructure
        run: |
          npm run cdk deploy -- --all \
            --context environment=staging \
            --require-approval never

      - name: CDK Deploy (Production)
        if: github.ref == 'refs/heads/main'
        working-directory: ./infrastructure
        run: |
          npm run cdk deploy -- --all \
            --context environment=production \
            --require-approval never

  # ────────────────────────────────────────────────────────────
  # Job 4: Integration Tests
  # ────────────────────────────────────────────────────────────
  integration-tests:
    needs: deploy-infra
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        run: |
          cargo test --test integration_tests -- --test-threads=1

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: target/test-results/
```

---

## 📊 Monitoring & Observability

### CloudWatch Dashboard (JSON)

**dashboard.json**:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", { "stat": "Average" }],
          [".", "MemoryUtilization", { "stat": "Average" }]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Cluster - Resource Utilization",
        "yAxis": { "left": { "min": 0, "max": 100 } }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/SQS", "ApproximateNumberOfMessagesVisible", { "stat": "Sum" }],
          [".", "NumberOfMessagesSent", { "stat": "Sum" }],
          [".", "NumberOfMessagesReceived", { "stat": "Sum" }]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "SQS Queue Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", { "stat": "Sum" }],
          [".", "Errors", { "stat": "Sum" }],
          [".", "Duration", { "stat": "Average" }]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Lambda Function Metrics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/ecs/miyabi-agent-worker'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "us-east-1",
        "title": "Recent Errors"
      }
    }
  ]
}
```

**Deploy Dashboard**:
```bash
aws cloudwatch put-dashboard \
  --dashboard-name MiyabiPlatform \
  --dashboard-body file://dashboard.json
```

---

### X-Ray Tracing (Rust Integration)

**Cargo.toml**:
```toml
[dependencies]
aws-xray-sdk = "0.1"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

**main.rs**:
```rust
use tracing::{info, instrument};
use tracing_subscriber::EnvFilter;

#[instrument]
async fn execute_task(task_id: &str) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting task execution: {}", task_id);

    // X-Ray segment
    let segment = aws_xray_sdk::begin_segment("ExecuteTask");

    // Task logic
    let result = process_task(task_id).await?;

    segment.add_annotation("task_id", task_id);
    segment.add_metadata("result", &result);

    aws_xray_sdk::end_segment();

    info!("Task completed: {}", task_id);
    Ok(())
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .json()
        .init();

    // Initialize X-Ray
    aws_xray_sdk::init_daemon("127.0.0.1:2000");

    // Run agent
    execute_task("task-123").await.unwrap();
}
```

---

## 🔒 Security Best Practices

### 1. Secrets Management

**Never commit secrets to Git**. Use AWS Secrets Manager.

**Store secret**:
```bash
aws secretsmanager create-secret \
  --name miyabi/github-token \
  --secret-string "${GITHUB_TOKEN}" \
  --description "GitHub API token for Miyabi"
```

**Retrieve in code** (Rust):
```rust
use aws_sdk_secretsmanager::Client as SecretsClient;

async fn get_github_token() -> Result<String, Box<dyn std::error::Error>> {
    let config = aws_config::load_from_env().await;
    let client = SecretsClient::new(&config);

    let response = client
        .get_secret_value()
        .secret_id("miyabi/github-token")
        .send()
        .await?;

    Ok(response.secret_string().unwrap().to_string())
}
```

### 2. IAM Least Privilege

**ECS Task Role** (CDK):
```typescript
const taskRole = new Role(this, 'AgentWorkerTaskRole', {
  assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
  managedPolicies: [
    // Deny: Don't use AWS managed policies (too broad)
  ]
});

// Grant only specific permissions
taskRole.addToPolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    's3:GetObject',
    's3:PutObject'
  ],
  resources: [
    `arn:aws:s3:::miyabi-artifacts/*`
  ]
}));

taskRole.addToPolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'dynamodb:GetItem',
    'dynamodb:PutItem',
    'dynamodb:UpdateItem'
  ],
  resources: [
    tasksTable.tableArn
  ]
}));
```

### 3. Network Security

**Security Group Rules** (Principle: Deny all, allow specific):
```typescript
const agentWorkerSG = new SecurityGroup(this, 'AgentWorkerSG', {
  vpc,
  description: 'Security group for Miyabi agent workers',
  allowAllOutbound: false  // Explicitly deny all outbound
});

// Allow HTTPS to GitHub API
agentWorkerSG.addEgressRule(
  Peer.anyIpv4(),
  Port.tcp(443),
  'HTTPS to GitHub API'
);

// Allow HTTPS to AWS APIs (via VPC endpoints - preferred)
agentWorkerSG.addEgressRule(
  Peer.ipv4(vpc.vpcCidrBlock),
  Port.tcp(443),
  'HTTPS to VPC endpoints'
);
```

---

## 🚀 Deployment Procedures

### Initial Setup (One-time)

**1. AWS Organization Setup**:
```bash
# Create organization (run in Management account)
aws organizations create-organization --feature-set ALL

# Create accounts
aws organizations create-account \
  --email security@miyabi.io \
  --account-name "Miyabi Security" \
  --role-name OrganizationAccountAccessRole

aws organizations create-account \
  --email production@miyabi.io \
  --account-name "Miyabi Production"

aws organizations create-account \
  --email staging@miyabi.io \
  --account-name "Miyabi Staging"
```

**2. Bootstrap CDK**:
```bash
# Run in each account
aws sts get-caller-identity  # Verify account

cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION} \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

**3. Deploy Infrastructure**:
```bash
cd infrastructure/

# Install dependencies
npm install

# Synthesize CloudFormation
npm run cdk synth

# Deploy to staging
npm run cdk deploy -- --all --context environment=staging

# Deploy to production (requires approval)
npm run cdk deploy -- --all --context environment=production
```

### Updating Services

**1. Update Code**:
```bash
# Make changes to Rust code
vim crates/miyabi-agent-worker/src/main.rs

# Test locally
cargo test --all

# Commit and push
git commit -am "feat: implement new feature"
git push origin main
```

**2. Automated Deployment**:
- GitHub Actions triggers on push to `main`
- Builds Rust binary
- Builds Docker image
- Pushes to ECR
- Updates ECS service (rolling deployment)

**3. Manual Rollback** (if needed):
```bash
# List recent task definitions
aws ecs list-task-definitions \
  --family-prefix miyabi-agent-worker \
  --sort DESC \
  --max-items 5

# Rollback to previous version
aws ecs update-service \
  --cluster miyabi-cluster \
  --service agent-worker-service \
  --task-definition miyabi-agent-worker:42  # Previous version
```

---

## 🐛 Troubleshooting Guide

### Issue 1: ECS Task Fails to Start

**Symptoms**: Tasks stuck in `PENDING` or immediately transition to `STOPPED`

**Diagnosis**:
```bash
# Check task definition
aws ecs describe-task-definition --task-definition miyabi-agent-worker

# Check stopped tasks
aws ecs describe-tasks \
  --cluster miyabi-cluster \
  --tasks $(aws ecs list-tasks --cluster miyabi-cluster --desired-status STOPPED --query 'taskArns[0]' --output text)

# Check CloudWatch Logs
aws logs tail /aws/ecs/miyabi-agent-worker --follow
```

**Common Causes**:
1. **ECR image not found**: Verify image exists in ECR
2. **IAM permissions**: Check task execution role
3. **Resource limits**: Increase CPU/memory
4. **VPC configuration**: Ensure subnets have route to NAT Gateway

**Fix**:
```bash
# Pull image locally to test
aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REGISTRY}
docker pull ${ECR_REGISTRY}/miyabi-agent-worker:latest
docker run -it ${ECR_REGISTRY}/miyabi-agent-worker:latest /bin/bash
```

---

### Issue 2: High Lambda Cold Start Latency

**Symptoms**: First API request takes 3-5 seconds

**Diagnosis**:
```bash
# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=miyabi-api-handler \
  --start-time 2025-11-12T00:00:00Z \
  --end-time 2025-11-12T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum
```

**Fix: Enable SnapStart** (for Java runtimes) or **Provisioned Concurrency**:
```typescript
const apiFunction = new Function(this, 'ApiFunction', {
  runtime: Runtime.RUST_PROVIDED_AL2,
  handler: 'bootstrap',
  code: Code.fromAsset('lambda/'),
  timeout: Duration.seconds(30),
  memorySize: 512,
  reservedConcurrentExecutions: 10,
  currentVersionOptions: {
    provisionedConcurrentExecutions: 2  // Keep 2 warm instances
  }
});
```

---

### Issue 3: DynamoDB Throttling

**Symptoms**: `ProvisionedThroughputExceededException` errors

**Diagnosis**:
```bash
# Check throttled requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=miyabi-tasks \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

**Fix: Switch to On-Demand Billing**:
```bash
aws dynamodb update-table \
  --table-name miyabi-tasks \
  --billing-mode PAY_PER_REQUEST
```

---

## 📚 Additional Resources

### Official Documentation
- **AWS CDK**: https://docs.aws.amazon.com/cdk/
- **ECS Best Practices**: https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/
- **Lambda Performance**: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html

### Miyabi-Specific
- **Main Architecture**: `.ai/plans/MIYABI_AWS_PLATFORM_ARCHITECTURE.md`
- **Pantheon Web App**: `.ai/plans/pantheon-webapp-aws-deployment.md`
- **Miyabi Agents**: `AGENTS.md`

---

**Status**: ✅ Implementation Guide Complete

**Next Steps**:
1. Review patterns with team
2. Set up AWS Organization
3. Initialize CDK project
4. Begin Phase 1 implementation

**Maintained by**: Miyabi Platform Team
**Location**: `/Users/shunsuke/Dev/miyabi-private/.ai/plans/MIYABI_AWS_IMPLEMENTATION_GUIDE.md`
**Version**: 1.0.0
**Last Updated**: 2025-11-12
