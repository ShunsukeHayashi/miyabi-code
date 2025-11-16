# Miyabi AWS Platform - Scalability & Extensibility Deep Dive

**Project**: Miyabi AWS Platform
**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: Scalability Design Document

---

## 🎯 Overview

このドキュメントでは、Miyabi AWS Platformのスケーラビリティと拡張性について、**具体的な数値、メカニズム、ボトルネック、解決策**を詳細に説明します。

---

## 📊 Scalability Dimensions - 5つのスケーラビリティ軸

### 1. Horizontal Scaling (水平スケーリング)

**定義**: 同じ種類のリソースを増やすことで処理能力を向上

#### 1.1 ECS Fargate Agent Workers

**現在の設計**:
```
Min Tasks: 1
Max Tasks: 100
Target CPU: 70%
```

**詳細メカニズム**:

```
Queue Depth (SQS)          Auto-Scaling Action
─────────────────────────────────────────────
0-10 messages         →    Desired Count: 1
11-50 messages        →    Desired Count: 5
51-100 messages       →    Desired Count: 10
101-500 messages      →    Desired Count: 20
501-1000 messages     →    Desired Count: 50
1000+ messages        →    Desired Count: 100
```

**スケーリング速度**:
- **Scale Out**: 60秒以内に新しいタスクが起動
- **Scale In**: 300秒のクールダウン後に縮小（安全性重視）

**実際の処理能力**:
```
1 Worker:
  - 1 Issue処理/15分 = 4 Issues/hour
  - 1日稼働: 96 Issues/day

10 Workers (並列):
  - 10 Issues/15分 = 40 Issues/hour
  - 1日稼働: 960 Issues/day

100 Workers (最大):
  - 100 Issues/15分 = 400 Issues/hour
  - 1日稼働: 9,600 Issues/day
```

**コスト計算**:
```
1 Worker:
  - vCPU: 0.5
  - Memory: 1GB
  - Cost: $0.04048/hour (us-east-1)

10 Workers (24/7):
  - Cost: $0.4048/hour × 24 × 30 = $291.46/month

100 Workers (ピーク時のみ、1日4時間):
  - Cost: $4.048/hour × 4 × 30 = $485.76/month
```

**ボトルネック**:
1. **EFS I/O**: 共有ストレージ（Worktrees）の同時アクセス
   - **解決策**: EFS Provisioned Throughput + 並列度制御
2. **DynamoDB Write Capacity**: 状態更新の書き込み
   - **解決策**: On-Demand Billing Mode（自動スケール）
3. **GitHub API Rate Limit**: 5000 requests/hour
   - **解決策**: Token rotation + Caching + Exponential backoff

---

#### 1.2 Lambda Function Concurrency

**現在の設計**:
```
Reserved Concurrency: 100 per function
Provisioned Concurrency: 10 (warm instances)
```

**詳細メカニズム**:

```
Request Rate               Lambda Scaling
─────────────────────────────────────────────
< 10 req/sec          →    10 instances (warm)
10-100 req/sec        →    Scale to 100 instances
100-500 req/sec       →    Queue + throttle
> 500 req/sec         →    API Gateway throttling
```

**コールドスタート最適化**:
```
Without optimization:
  - Cold start: 3-5 seconds
  - P95 latency: 4.2 seconds

With Provisioned Concurrency (10 instances):
  - Warm start: 50-100ms
  - P95 latency: 150ms
  - Cost increase: ~$100/month
```

**実際の処理能力**:
```
API Gateway + Lambda:
  - 1 Lambda: 1000 req/sec (burst)
  - 100 Lambdas: 100,000 req/sec (theoretical)
  - Realistic: 10,000 req/sec (API Gateway limit)
```

---

#### 1.3 Database Scaling

**DynamoDB**:
```
Mode: On-Demand (Pay per request)

Read Capacity:
  - Auto-scales: 0 → Unlimited
  - Latency: < 10ms (P99)
  - Cost: $0.25 per million reads

Write Capacity:
  - Auto-scales: 0 → Unlimited
  - Latency: < 10ms (P99)
  - Cost: $1.25 per million writes

Burst Capacity:
  - 2× previous peak for 30 minutes
  - Allows sudden spikes
```

**RDS Aurora Serverless v2**:
```
ACU (Aurora Capacity Units):
  - Min: 0.5 ACU (1GB RAM, ~1 vCPU)
  - Max: 128 ACU (256GB RAM, ~64 vCPU)
  - Scaling: Granular (0.5 ACU increments)
  - Response: < 1 second

Cost:
  - 0.5 ACU: $0.12/hour = $87.60/month
  - 1 ACU: $0.24/hour = $175.20/month
  - 4 ACU: $0.96/hour = $700.80/month

Connection Pooling:
  - RDS Proxy: 1000+ concurrent connections
  - Reduces connection overhead
  - Cost: $0.015/hour = $10.80/month
```

**実際の処理能力**:
```
0.5 ACU (Idle):
  - ~500 queries/sec (simple SELECT)
  - ~50 queries/sec (complex JOIN)

4 ACU (Medium load):
  - ~4000 queries/sec (simple SELECT)
  - ~400 queries/sec (complex JOIN)

16 ACU (High load):
  - ~16,000 queries/sec (simple SELECT)
  - ~1600 queries/sec (complex JOIN)
```

---

### 2. Vertical Scaling (垂直スケーリング)

**定義**: 個々のリソースのスペックを向上

#### 2.1 ECS Task Definition Sizing

**Agent Worker タスク**:

| Workload Type | vCPU | Memory | Use Case |
|--------------|------|--------|----------|
| **Light** | 0.25 | 512MB | Issue管理、ラベル推論 |
| **Standard** | 0.5 | 1GB | CodeGen、Review（現在の設定） |
| **Medium** | 1 | 2GB | デプロイメント、複雑なビジネスロジック |
| **Heavy** | 2 | 4GB | 大規模IaC生成、複数リージョン展開 |
| **XL** | 4 | 8GB | マルチアカウント管理、一括最適化 |

**実際のパフォーマンス**:
```
Light (0.25 vCPU, 512MB):
  - Issue処理: ~5分
  - 同時実行: 200 tasks (cost-effective)
  - Cost: $14.54/hour (200 tasks × 24/7)

Standard (0.5 vCPU, 1GB):
  - Issue処理: ~15分 (現在)
  - 同時実行: 100 tasks
  - Cost: $29.10/hour (100 tasks × 24/7)

Heavy (2 vCPU, 4GB):
  - Multi-region deploy: ~30分
  - 同時実行: 25 tasks
  - Cost: $58.20/hour (25 tasks × 24/7)
```

**動的タスクサイジング**:
```rust
fn select_task_size(issue: &Issue) -> TaskDefinition {
    match (issue.labels, issue.complexity) {
        // Light tasks
        (["label"], _) => TaskDefinition::Light,

        // Standard tasks
        (["feature"], Low) => TaskDefinition::Standard,

        // Heavy tasks
        (["aws", "multi-region"], _) => TaskDefinition::Heavy,
        (_, High) => TaskDefinition::Heavy,

        _ => TaskDefinition::Standard
    }
}
```

---

#### 2.2 Lambda Memory Configuration

**Memory vs Performance**:

| Memory | vCPU | Duration (avg) | Cost/invocation | Use Case |
|--------|------|----------------|-----------------|----------|
| 128MB | 0.08 | 2000ms | $0.0000004 | Webhook受信 |
| 512MB | 0.33 | 500ms | $0.0000004 | 軽量API |
| 1024MB | 0.67 | 250ms | $0.0000004 | 標準API |
| 3008MB | 2.00 | 80ms | $0.0000005 | 重い処理 |

**最適メモリの計算**:
```
Cost = (Memory/1024) × Duration × $0.0000166667

Example:
- 512MB, 500ms: $0.00000416
- 1024MB, 250ms: $0.00000416 (同じコスト、2倍速い！)

→ メモリを増やすと処理時間短縮でコストは同じまたは安くなる
```

**Power Tuning**:
```bash
# AWS Lambda Power Tuning ツール使用
aws lambda invoke \
  --function-name my-function \
  --payload '{"powerValues": [128,256,512,1024,1536,3008]}' \
  --output json

# 結果例:
Optimal: 1024MB (最速 & 最安)
```

---

### 3. Auto-Scaling Policies (自動スケーリング)

#### 3.1 Target Tracking Scaling

**ECS Service - CPU Based**:
```yaml
TargetTrackingScalingPolicy:
  TargetValue: 70.0
  ScaleInCooldown: 300    # 5分待ってからスケールイン
  ScaleOutCooldown: 60    # 1分で即座にスケールアウト

  Metric: ECSServiceAverageCPUUtilization
```

**実際の挙動**:
```
Time    CPU%    Desired    Actual    Action
─────────────────────────────────────────────
00:00   50%     10         10        (Stable)
00:05   75%     10         10        CPU > 70% detected
00:06   75%     15         10        Scale out triggered
00:07   75%     15         15        New tasks running
00:10   60%     15         15        (Stable)
00:15   50%     15         15        (Cooldown)
00:20   50%     10         15        Scale in triggered
00:25   50%     10         10        Tasks terminated
```

---

#### 3.2 Step Scaling (Queue Depth)

**SQS Queue Depth Based**:
```yaml
StepScalingPolicy:
  Metric: ApproximateNumberOfMessagesVisible

  Steps:
    - MetricIntervalLowerBound: 0
      MetricIntervalUpperBound: 10
      ScalingAdjustment: -1      # 減らす

    - MetricIntervalLowerBound: 10
      MetricIntervalUpperBound: 50
      ScalingAdjustment: +5

    - MetricIntervalLowerBound: 50
      MetricIntervalUpperBound: 100
      ScalingAdjustment: +10

    - MetricIntervalLowerBound: 100
      MetricIntervalUpperBound: null
      ScalingAdjustment: +20
```

**実際のシミュレーション**:
```
Time    Queue   Desired    Actual    Action
─────────────────────────────────────────────
00:00   5       1          1         (Idle)
00:01   15      1          1         Step triggered
00:02   15      6          1         +5 tasks
00:03   60      6          6         Step triggered
00:04   60      16         6         +10 tasks
00:05   120     16         16        Step triggered
00:06   120     36         16        +20 tasks
00:07   50      36         36        (Draining)
00:10   5       36         36        (Cooldown)
00:15   5       1          36        Scale in
00:20   5       1          1         (Idle)
```

---

#### 3.3 Scheduled Scaling

**予測可能な負荷パターン**:
```yaml
ScheduledActions:
  # 平日朝のピーク対応（日本時間9:00 = UTC 0:00）
  - Name: MorningRampUp
    Schedule: "cron(0 0 * * MON-FRI)"
    MinCapacity: 20
    MaxCapacity: 100

  # 夜間の縮小（日本時間22:00 = UTC 13:00）
  - Name: NightScaleDown
    Schedule: "cron(0 13 * * *)"
    MinCapacity: 1
    MaxCapacity: 10
```

**コスト削減効果**:
```
Without Scheduled Scaling:
  - 24/7 with 10 min tasks
  - Cost: $291.46/month

With Scheduled Scaling:
  - Business hours (9:00-22:00, 13h): 20 tasks avg
  - Night hours (22:00-9:00, 11h): 2 tasks avg
  - Cost: (20×13 + 2×11) × 30 × $0.04048
       = (260 + 22) × 30 × $0.04048
       = $342.45/month... (逆に高い！)

→ Scheduled Scaling は長時間ピークがある場合のみ有効
→ Miyabiの場合、Queue-basedが最適
```

---

### 4. Data Partitioning & Sharding (データ分割)

#### 4.1 DynamoDB Partition Key Strategy

**現在の設計**:
```
PK: "TASK#{issue_number}"
SK: "METADATA" | "EXECUTION#{phase}" | "LOG#{timestamp}"
```

**スケーラビリティのベストプラクティス**:

**❌ Bad Partition Key**:
```
PK: "TASK"  # 全てのタスクが同じパーティションに集中
→ Hot Partition問題
→ Throughput: ~3000 RCU/sec per partition (制限)
```

**✅ Good Partition Key**:
```
PK: "TASK#{issue_number}"  # 各Issueが独立したパーティション
→ Uniform distribution
→ Throughput: Unlimited (理論上)
```

**さらに最適化（大規模時）**:
```
PK: "TASK#{issue_number % 100}#{issue_number}"
     └── 0-99のシャードID

Example:
  Issue #12345 → PK: "TASK#45#12345"
  Issue #12346 → PK: "TASK#46#12346"

→ 負荷を100個のパーティションに均等分散
```

**実際のスループット**:
```
Without sharding (1 partition):
  - Max: 3000 RCU/sec, 1000 WCU/sec
  - 同時処理: ~100 tasks

With sharding (100 partitions):
  - Max: 300,000 RCU/sec, 100,000 WCU/sec
  - 同時処理: ~10,000 tasks
```

---

#### 4.2 RDS Aurora Read Replicas

**現在の設計**:
```
1 Writer + 0 Readers
```

**拡張設計**:
```
1 Writer + 5 Readers (Max: 15 readers)

Read Replica Distribution:
  - Reader 1: Agent queries (high load)
  - Reader 2: Knowledge queries
  - Reader 3: Analytics queries
  - Reader 4: Monitoring queries
  - Reader 5: Backup queries

Routing:
  - Write: Primary endpoint
  - Read: Reader endpoint (round-robin)
```

**実際のスループット**:
```
1 Writer only:
  - Reads: 4000 queries/sec
  - Writes: 1000 queries/sec
  - Total: 5000 queries/sec

1 Writer + 5 Readers:
  - Reads: 20,000 queries/sec (5× readers)
  - Writes: 1000 queries/sec
  - Total: 21,000 queries/sec

Cost increase: 5× reader = +$438/month (from $87.60)
```

**接続プール最適化**:
```rust
// RDS Proxy使用
use aws_sdk_rds::Client;

let pool_config = PoolConfig {
    max_connections: 100,        // Writer: 100
    max_reader_connections: 500, // Readers: 500 (5× 100)
    connection_timeout: Duration::from_secs(30),
};

// Read/Write分離
async fn execute_query(query: &str, read_only: bool) -> Result<Rows> {
    let endpoint = if read_only {
        "reader-endpoint"  // Round-robin across 5 readers
    } else {
        "writer-endpoint"  // Primary only
    };

    client.query(endpoint, query).await
}
```

---

### 5. Caching Strategies (キャッシング)

#### 5.1 Multi-Layer Caching

**Layer 1: CloudFront (Edge Cache)**:
```
TTL: 3600s (1 hour)
Cacheable:
  - Static assets (HTML, CSS, JS, images)
  - API responses (with Cache-Control header)

Cache Hit Rate: 85-90%
Cost Savings: ~70% (origin requests)

Example:
  Without cache: 1M requests/month
    → CloudFront: $8.50
    → Origin (Lambda): $20.00
    → Total: $28.50

  With cache (90% hit):
    → CloudFront: $8.50
    → Origin (100K): $2.00
    → Total: $10.50 (63% savings)
```

**Layer 2: API Gateway Cache**:
```
Cache Size: 0.5GB (small), 6.1GB (medium), 13.5GB (large)
TTL: 300s (5 minutes)
Cost: $0.02/hour/GB = ~$15/month (0.5GB)

Cacheable Endpoints:
  GET /api/v1/agents         → Cache 5min
  GET /api/v1/tasks/:id      → Cache 30sec
  GET /api/v1/knowledge      → Cache 1min
```

**Layer 3: Application Cache (Redis/ElastiCache)**:
```
Node Type: cache.t3.micro
Cost: $12.41/month

Use Cases:
  - Session data (Cognito tokens)
  - Rate limiting counters
  - Hot data (frequently accessed tasks)

TTL Strategy:
  - Session: 24 hours
  - Rate limit: 1 hour
  - Hot data: 5 minutes
```

**Layer 4: Database Query Cache (Aurora)**:
```
Built-in Aurora Query Cache
Size: Configurable (10% of memory)

Automatically caches:
  - Identical SELECT queries
  - Result sets

Cache invalidation:
  - Automatic on writes to related tables
```

**実際のパフォーマンス**:
```
Without caching:
  - API latency: 200ms (Lambda + DB)
  - Cost: $50/month (1M requests)

With 4-layer caching (90% hit):
  - API latency: 10ms (CloudFront edge)
  - Cost: $25/month (100K origin requests + cache cost)
  - 50% cost reduction, 20× faster
```

---

### 6. Asynchronous Processing (非同期処理)

#### 6.1 Event-Driven Architecture

**現在の設計**:
```
Synchronous (Bad):
  User Request → API Gateway → Lambda → [Wait 15min] → Response

Asynchronous (Good):
  User Request → API Gateway → Lambda → SQS → Response (202 Accepted)
                                          ↓
                                     ECS Worker (background)
```

**メリット**:
```
Synchronous:
  - API Gateway timeout: 29 seconds (hard limit)
  - Lambda timeout: 15 minutes (hard limit)
  - User waits: 15 minutes
  - Scalability: Limited by Lambda concurrency

Asynchronous:
  - API response: < 100ms (just enqueue)
  - User doesn't wait
  - Worker timeout: Unlimited (ECS)
  - Scalability: Unlimited (SQS + ECS)
```

---

#### 6.2 Message Queue Patterns

**Dead Letter Queue (DLQ)**:
```yaml
MainQueue:
  MaxReceiveCount: 3    # 3回失敗したらDLQへ
  VisibilityTimeout: 3600s (1 hour)

DeadLetterQueue:
  MessageRetentionPeriod: 1209600s (14 days)
  AlarmOnMessage: true
```

**Priority Queues**:
```
High Priority Queue (Critical Issues):
  - P0, P1 issues
  - Security vulnerabilities
  - Worker poll interval: 10s

Standard Queue (Normal Issues):
  - P2, P3 issues
  - Feature requests
  - Worker poll interval: 30s

Low Priority Queue (Background):
  - Documentation updates
  - Cleanup tasks
  - Worker poll interval: 300s
```

**Batch Processing**:
```rust
// SQS Long Polling (20s)
let messages = sqs_client
    .receive_message()
    .queue_url(queue_url)
    .max_number_of_messages(10)    // Batch size
    .wait_time_seconds(20)          // Long polling
    .send()
    .await?;

// Process in parallel
let tasks: Vec<_> = messages
    .messages
    .unwrap()
    .into_iter()
    .map(|msg| tokio::spawn(process_message(msg)))
    .collect();

futures::future::join_all(tasks).await;
```

**実際のスループット**:
```
Short Polling (0s):
  - 1000 requests/sec
  - Cost: $4.00/month (1B requests)
  - Empty responses: 99.9% (wasteful)

Long Polling (20s):
  - 50 requests/sec
  - Cost: $0.20/month (50M requests)
  - Empty responses: 0.1%
  - 95% cost reduction
```

---

### 7. Multi-Region Architecture (マルチリージョン)

#### 7.1 Active-Active Configuration

**現在の設計 (Single Region)**:
```
us-east-1 (Primary)
  ├─ All traffic (100%)
  └─ Single Point of Failure
```

**拡張設計 (Multi-Region)**:
```
us-east-1 (Primary)          ap-northeast-1 (Secondary)
  ├─ 100% traffic (normal)      ├─ 0% traffic (normal)
  ├─ ECS: 10-100 tasks          ├─ ECS: 5-50 tasks
  ├─ DynamoDB: Global Table     ├─ DynamoDB: Replica
  └─ Aurora: Writer             └─ Aurora: Reader

Route 53 Health Check:
  - Primary healthy → 100% to us-east-1
  - Primary failed → 100% to ap-northeast-1 (failover)
  - Failover time: < 1 minute
```

**DynamoDB Global Tables**:
```
Replication:
  - Multi-region, multi-master
  - Eventual consistency (< 1 second)
  - Conflict resolution: Last-writer-wins

Cost:
  - Replicated write: 2× cost ($2.50/M writes)
  - Cross-region transfer: $0.02/GB
  - Total increase: ~30%
```

**Aurora Global Database**:
```
Primary Region (us-east-1):
  - 1 Writer + 2 Readers
  - Replication lag: < 1 second

Secondary Region (ap-northeast-1):
  - Read-only replicas (up to 5)
  - Promote to Writer: < 1 minute (failover)

Cost:
  - Secondary region: +100% (full cluster)
  - Total: $175/month → $350/month
```

**実際のレイテンシ**:
```
Single Region (us-east-1):
  - New York: 10ms
  - Tokyo: 150ms

Multi-Region (us-east-1 + ap-northeast-1):
  - New York → us-east-1: 10ms
  - Tokyo → ap-northeast-1: 10ms
  - 15× faster for APAC users
```

---

## 🔥 Bottlenecks & Solutions - ボトルネックと解決策

### Bottleneck 1: EFS I/O Performance

**問題**:
```
Worktree operations (git clone, checkout, commit):
  - 100 concurrent tasks
  - Each task: 500 MB repository
  - Total I/O: 50 GB simultaneous

EFS Standard Performance:
  - Baseline: 50 MB/s per TB stored
  - Burst: 100 MB/s (credit-based)
  - 50 GB / 100 MB/s = 500 seconds (8分!)
```

**解決策**:
```yaml
EFS Provisioned Throughput:
  - Provision: 500 MB/s
  - Cost: $6.00/MB/s/month = $3000/month (expensive!)

Alternative: EBS volumes per task
  - Each task: 20GB EBS gp3
  - Performance: 3000 IOPS, 125 MB/s
  - Cost: $1.60/month per task
  - 100 tasks: $160/month (much cheaper!)
```

**実装**:
```typescript
// CDK: EBS volume per task
const taskDef = new FargateTaskDefinition(this, 'WorkerTask', {
  volumes: [{
    name: 'worktree-volume',
    efsVolumeConfiguration: undefined,  // Don't use EFS
  }]
});

// Use ephemeral storage (Docker volume)
taskDef.addContainer('Worker', {
  image: ContainerImage.fromRegistry('miyabi-worker:latest'),
  // Each task gets 20GB ephemeral storage (free!)
  ephemeralStorageGiB: 20,
});
```

---

### Bottleneck 2: GitHub API Rate Limit

**問題**:
```
GitHub API Rate Limit:
  - 5000 requests/hour per token
  - 100 workers × 50 API calls = 5000 calls (limit reached!)
```

**解決策**:

**1. Token Rotation**:
```rust
struct GitHubClientPool {
    tokens: Vec<String>,
    current: AtomicUsize,
}

impl GitHubClientPool {
    async fn get_client(&self) -> GitHubClient {
        let index = self.current.fetch_add(1, Ordering::SeqCst) % self.tokens.len();
        GitHubClient::new(&self.tokens[index])
    }
}

// 10 tokens = 50,000 requests/hour
let pool = GitHubClientPool::new(vec![
    token1, token2, token3, token4, token5,
    token6, token7, token8, token9, token10,
]);
```

**2. Conditional Requests (ETags)**:
```rust
// Cache with ETags
let (data, etag) = client.get_issue(123).await?;
cache.set(123, (data.clone(), etag.clone()));

// Later request
if let Some((cached_data, cached_etag)) = cache.get(&123) {
    match client.get_issue_if_modified(123, &cached_etag).await? {
        Response::NotModified => return Ok(cached_data),
        Response::Modified(new_data, new_etag) => {
            cache.set(123, (new_data.clone(), new_etag));
            return Ok(new_data);
        }
    }
}

// Saves ~50% API calls (for unchanged resources)
```

**3. GraphQL (vs REST)**:
```graphql
# 1 GraphQL request = multiple REST requests
query {
  repository(owner: "org", name: "repo") {
    issue(number: 123) {
      title
      body
      labels { name }
      assignees { login }
      comments(first: 10) {
        nodes { body }
      }
    }
  }
}

# REST equivalent: 3 requests (issue, labels, comments)
# GraphQL: 1 request
# Savings: 67%
```

---

### Bottleneck 3: Database Connection Pool

**問題**:
```
RDS Aurora:
  - Max connections: 1000 (t3.medium)
  - Each Lambda: 1 connection
  - 1000 concurrent Lambdas = connection exhausted
  - New Lambda: Connection refused!
```

**解決策**:

**1. RDS Proxy**:
```typescript
const dbProxy = new DatabaseProxy(this, 'DBProxy', {
  proxyTarget: ProxyTarget.fromCluster(dbCluster),
  secrets: [dbCredentials],
  vpc,
  maxConnectionsPercent: 100,  // Use all connections
  maxIdleConnectionsPercent: 50,  // Reclaim idle
  connectionBorrowTimeout: Duration.seconds(30),
});

// Lambda uses Proxy instead of direct connection
lambda.addEnvironment('DB_ENDPOINT', dbProxy.endpoint);
```

**Benefits**:
```
Without RDS Proxy:
  - Max concurrent: 1000 Lambdas
  - Connection time: 100ms (new connection)
  - Failure rate: 10% (connection refused)

With RDS Proxy:
  - Max concurrent: 10,000+ Lambdas
  - Connection time: 10ms (pooled)
  - Failure rate: 0.1%
  - 10× scalability, 10× faster
```

**2. Connection Pooling in Rust**:
```rust
use deadpool_postgres::{Config, Pool, Runtime};

// Create pool once (application startup)
let mut cfg = Config::new();
cfg.host = Some(db_host.to_string());
cfg.dbname = Some("miyabi".to_string());
cfg.manager = Some(ManagerConfig {
    recycling_method: RecyclingMethod::Fast,
});

let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls)?;

// Reuse connections
async fn query(pool: &Pool) -> Result<Vec<Row>> {
    let client = pool.get().await?;  // Get from pool
    let rows = client.query("SELECT * FROM tasks", &[]).await?;
    Ok(rows)  // Connection automatically returned to pool
}
```

---

### Bottleneck 4: Lambda Cold Start

**問題**:
```
Cold Start:
  - Lambda initialization: 1-3 seconds
  - First request: 3-5 seconds total latency
  - User experience: Poor
```

**解決策**:

**1. Provisioned Concurrency**:
```typescript
const apiFunction = new Function(this, 'ApiFunction', {
  runtime: Runtime.RUST_PROVIDED_AL2,
  code: Code.fromAsset('lambda/'),
  currentVersionOptions: {
    provisionedConcurrentExecutions: 10,  // Keep 10 warm
  },
});

// Cost: $0.015/hour × 10 = $0.15/hour = $108/month
// Benefit: 50× faster (3000ms → 60ms)
```

**2. Lambda SnapStart (Java only)**:
```typescript
// For Java runtimes
const javaFunction = new Function(this, 'JavaFunction', {
  runtime: Runtime.JAVA_11,
  snapStart: lambda.SnapStartConf.ON_PUBLISHED_VERSIONS,
});

// Reduces cold start: 10 seconds → 1 second
```

**3. Reduce Package Size (Rust)**:
```toml
# Cargo.toml
[profile.release]
opt-level = "z"      # Optimize for size
lto = true           # Link-time optimization
codegen-units = 1    # Single codegen unit
strip = true         # Strip debug symbols

# Binary size: 50MB → 5MB (10× smaller)
# Cold start: 3000ms → 500ms (6× faster)
```

**4. Warm-up Lambda**:
```typescript
// CloudWatch Events (every 5 minutes)
const rule = new Rule(this, 'WarmUpRule', {
  schedule: Schedule.rate(Duration.minutes(5)),
});

rule.addTarget(new targets.LambdaFunction(apiFunction, {
  event: RuleTargetInput.fromObject({ warmup: true }),
}));

// Lambda handler
if event.get("warmup"):
    return {"statusCode": 200, "body": "warmed"}
```

---

## 📈 Performance Benchmarks - パフォーマンスベンチマーク

### Scenario 1: Low Load (10 Issues/hour)

```
Configuration:
  - ECS Workers: 1 task
  - Lambda: Provisioned 2 instances
  - DynamoDB: On-Demand
  - RDS: 0.5 ACU

Performance:
  - Issue processing: 15 minutes/issue
  - Throughput: 4 issues/hour
  - Latency: P95 200ms (API)

Cost:
  - ECS: $29.10/month
  - Lambda: $20/month
  - DynamoDB: $5/month
  - RDS: $87.60/month
  - Total: $141.70/month
```

---

### Scenario 2: Medium Load (100 Issues/hour)

```
Configuration:
  - ECS Workers: 10 tasks (auto-scaled)
  - Lambda: Provisioned 5 instances
  - DynamoDB: On-Demand
  - RDS: 2 ACU (auto-scaled)

Performance:
  - Issue processing: 15 minutes/issue
  - Throughput: 40 issues/hour
  - Latency: P95 150ms (API)

Cost:
  - ECS: $291.46/month (10× workers)
  - Lambda: $50/month (5× provisioned)
  - DynamoDB: $30/month
  - RDS: $350.40/month (2 ACU)
  - Total: $721.86/month
```

---

### Scenario 3: High Load (1000 Issues/hour)

```
Configuration:
  - ECS Workers: 100 tasks (auto-scaled)
  - Lambda: Reserved 50 instances
  - DynamoDB: On-Demand (high throughput)
  - RDS: 8 ACU + 3 Read Replicas

Performance:
  - Issue processing: 15 minutes/issue
  - Throughput: 400 issues/hour
  - Latency: P95 100ms (API)

Cost:
  - ECS: $2,914.60/month (100× workers)
  - Lambda: $500/month (50× reserved)
  - DynamoDB: $300/month
  - RDS: $2,803.20/month (8 ACU + replicas)
  - CloudFront: $50/month
  - Total: $6,567.80/month

Cost per Issue: $6,567.80 / (400×24×30) = $0.23/issue
```

---

### Scenario 4: Extreme Load (10,000 Issues/hour)

```
Configuration:
  - ECS Workers: 100 tasks (limit)
  - Lambda: Reserved 100 instances
  - DynamoDB: On-Demand (very high throughput)
  - RDS: 32 ACU + 10 Read Replicas
  - Multi-Region (us-east-1 + ap-northeast-1)

Performance:
  - Issue processing: 15 minutes/issue (queue builds up)
  - Throughput: 400 issues/hour (ECS limit reached)
  - Queue time: ~24 hours (backlog)
  - Latency: P95 50ms (API, cached)

Bottleneck: ECS task limit (100)

Solution: Increase max tasks to 500
  - ECS: 500 tasks
  - Throughput: 2000 issues/hour
  - Queue time: ~5 hours

Cost:
  - ECS: $14,573.00/month (500× workers)
  - Lambda: $1,000/month
  - DynamoDB: $1,500/month
  - RDS: $11,212.80/month (32 ACU × 2 regions)
  - CloudFront: $500/month
  - Total: $28,785.80/month

Cost per Issue: $28,785.80 / (2000×24×30) = $0.20/issue (cheaper!)
```

---

## 🎯 Scalability Recommendations

### Phase 1: Launch (0-100 Issues/day)
```
✅ Use: Single region, minimal resources
✅ Cost: ~$150/month
✅ Max: 100 issues/day
❌ Don't: Over-provision resources
```

### Phase 2: Growth (100-1000 Issues/day)
```
✅ Enable: Auto-scaling (10-50 tasks)
✅ Add: Read replicas (RDS)
✅ Implement: Multi-layer caching
✅ Cost: ~$700/month
✅ Max: 1000 issues/day
```

### Phase 3: Scale (1000-10,000 Issues/day)
```
✅ Enable: Multi-region (failover)
✅ Increase: Max tasks to 100-200
✅ Add: RDS Proxy
✅ Optimize: Token rotation, GraphQL
✅ Cost: ~$7,000/month
✅ Max: 10,000 issues/day
```

### Phase 4: Hyper-scale (10,000+ Issues/day)
```
✅ Enable: Multi-region Active-Active
✅ Increase: Max tasks to 500+
✅ Implement: DynamoDB Global Tables
✅ Add: ElastiCache
✅ Consider: Lambda → ECS for API (no cold start)
✅ Cost: ~$30,000/month
✅ Max: 100,000+ issues/day
```

---

## 📝 Summary

**Key Takeaways**:

1. **Horizontal Scaling**: ECS tasks 1 → 100 → 500 (linear scaling)
2. **Vertical Scaling**: 動的タスクサイジング（light/standard/heavy）
3. **Auto-Scaling**: Queue-based step scaling（最適）
4. **Caching**: 4-layer caching（90% hit rate）
5. **Async Processing**: Event-driven architecture（必須）
6. **Multi-Region**: Active-Passive → Active-Active（フェーズ3以降）

**Cost vs Performance**:
```
$150/month   →  100 issues/day   (launch)
$700/month   →  1,000 issues/day  (growth)
$7,000/month →  10,000 issues/day (scale)
$30,000/month → 100,000 issues/day (hyper-scale)
```

**ボトルネック優先度**:
1. 🔴 **High**: EFS I/O → EBS ephemeral storage
2. 🟠 **Medium**: GitHub API → Token rotation + GraphQL
3. 🟡 **Low**: Lambda cold start → Provisioned concurrency

---

**Status**: ✅ Scalability Deep Dive Complete

**Next Steps**:
1. Implement basic auto-scaling (Phase 1)
2. Monitor metrics and identify bottlenecks
3. Scale gradually based on actual load

**Maintained by**: Miyabi Platform Team
**Location**: `/Users/shunsuke/Dev/miyabi-private/.ai/plans/MIYABI_AWS_SCALABILITY_DEEP_DIVE.md`
**Version**: 1.0.0
**Last Updated**: 2025-11-12
