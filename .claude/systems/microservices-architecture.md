# 🏗️ Miyabi Microservices Architecture - Full Breakdown

**Version**: 1.0.0
**Created**: 2025-11-15
**Purpose**: マイクロサービス単位のアーキテクチャ設計

---

## 🎯 システム全体像

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Miyabi Microservices Architecture                 │
│                        (7 Independent Services)                       │
└─────────────────────────────────────────────────────────────────────┘

【Client Layer】
    User Browser
        ↓
┌───────────────────────────────────────────────────────────────────────┐
│ Microservice 1: Web UI Service (静的コンテンツ配信)                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Stack: React.js + CloudFront + S3                                    │
│ Responsibility: フロントエンド HTML/CSS/JS の配信                     │
│ Scale: CloudFront Edge Locations (全世界)                            │
│ SLA: 99.99%                                                          │
└───────────────────────────────────────────────────────────────────────┘
        ↓ HTTPS
┌───────────────────────────────────────────────────────────────────────┐
│ Microservice 2: API Gateway Service (ルーティング・認証)               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Stack: AWS API Gateway (REST API)                                    │
│ Responsibility:                                                       │
│   - リクエストルーティング                                            │
│   - レート制限 (1000 req/s)                                          │
│   - CORS ハンドリング                                                │
│   - JWT 認証 (将来)                                                  │
│ Endpoints:                                                            │
│   - GET  /api/tasks                                                  │
│   - GET  /api/tasks/:id                                              │
│   - POST /api/tasks                                                  │
│   - GET  /api/projects                                               │
│   - GET  /health                                                     │
│ Scale: Auto-scaling (無制限)                                         │
│ SLA: 99.95%                                                          │
└───────────────────────────────────────────────────────────────────────┘
        ↓ Lambda Invocation
┌──────────────────────────┬────────────────────────────────────────────┐
│ Microservice 3:          │ Microservice 4:                            │
│ Task API Service         │ Progress Collector Service                 │
│ (Rust Lambda)            │ (Rust Lambda)                              │
│ ━━━━━━━━━━━━━━━━━━━━━  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Stack: Rust + Lambda     │ Stack: Rust + Lambda                       │
│ Runtime: AL2023          │ Runtime: AL2023                            │
│ Memory: 256MB            │ Memory: 256MB                              │
│ Timeout: 30s             │ Timeout: 60s                               │
│ Arch: ARM64 (Graviton2)  │ Arch: ARM64 (Graviton2)                    │
│                          │                                            │
│ Responsibilities:        │ Responsibilities:                          │
│ ✅ タスク一覧取得        │ ✅ CloudWatch Logs解析                     │
│ ✅ タスク詳細取得        │ ✅ 進捗情報抽出                            │
│ ✅ タスク作成            │ ✅ Redis書き込み                           │
│ ✅ プロジェクト取得      │ ✅ DynamoDB書き込み                        │
│ ✅ Redis読み取り         │ ✅ リトライロジック                        │
│ ✅ DynamoDB fallback     │ ✅ フォールバック処理                      │
│                          │                                            │
│ Cold Start: 150ms        │ Cold Start: 200ms                          │
│ Warm: 3ms                │ Warm: 5ms                                  │
│ Concurrency: 100         │ Trigger: API呼び出し / EventBridge         │
└──────────────────────────┴────────────────────────────────────────────┘
        ↓                              ↓
        ↓                              ↓
┌───────────────────────────────────────────────────────────────────────┐
│ Microservice 5: Cache Service (超高速データアクセス)                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Stack: ElastiCache (Redis 7.0)                                       │
│ Instance: cache.t4g.micro (0.5GB RAM)                                │
│ Latency: 0.1-1ms ⚡                                                  │
│                                                                       │
│ Data Structure:                                                       │
│   task:{task_id}       → JSON (TaskRecord)   TTL: 1h                │
│   project:{project_id} → JSON (ProjectRecord) TTL: 1h                │
│   active_tasks         → Set<task_id>         TTL: 1h                │
│                                                                       │
│ Responsibilities:                                                     │
│ ✅ ホットデータキャッシュ                                             │
│ ✅ 頻繁アクセスデータの超高速配信                                     │
│ ✅ DynamoDB負荷軽減                                                  │
│                                                                       │
│ Availability: Single node (cost optimization)                         │
│ Backup: DynamoDB fallback                                            │
│ SLA: 99.9%                                                           │
│ Cost: $12/month                                                      │
└───────────────────────────────────────────────────────────────────────┘
        ↓ (cache miss)
┌───────────────────────────────────────────────────────────────────────┐
│ Microservice 6: Database Service (永続化・検索)                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Stack: DynamoDB (Provisioned Capacity)                               │
│ Capacity: 5 RCU / 5 WCU                                              │
│ Latency: 1-10ms                                                      │
│                                                                       │
│ Tables:                                                               │
│ ┌──────────────────────────────────────────────────────┐            │
│ │ Table 1: miyabi-tasks                                │            │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │            │
│ │ Partition Key: task_id (String)                      │            │
│ │ Sort Key: timestamp (Number)                         │            │
│ │ GSI-1: ProjectIndex (project_id + updated_at)        │            │
│ │ GSI-2: StatusIndex (status + updated_at)             │            │
│ │ GSI-3: TypeIndex (task_type + created_at)            │            │
│ │ TTL: 90 days                                         │            │
│ │ Point-in-Time Recovery: Enabled                      │            │
│ └──────────────────────────────────────────────────────┘            │
│ ┌──────────────────────────────────────────────────────┐            │
│ │ Table 2: miyabi-projects                             │            │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │            │
│ │ Partition Key: project_id (String)                   │            │
│ │ No GSI                                               │            │
│ │ No TTL (long-term storage)                           │            │
│ │ Point-in-Time Recovery: Enabled                      │            │
│ └──────────────────────────────────────────────────────┘            │
│                                                                       │
│ Responsibilities:                                                     │
│ ✅ 全タスク履歴の永続化                                               │
│ ✅ プロジェクトメタデータ管理                                         │
│ ✅ 複雑なクエリ (GSI活用)                                            │
│ ✅ 90日自動削除 (TTL)                                                │
│                                                                       │
│ Availability: Multi-AZ (3 copies)                                    │
│ Backup: PITR (35 days)                                               │
│ SLA: 99.99%                                                          │
│ Cost: $5.25/month                                                    │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ Microservice 7: Logging Service (ログ収集・解析)                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Stack: CloudWatch Logs + CloudWatch Logs Insights                    │
│                                                                       │
│ Log Groups:                                                           │
│   /miyabi/cdk-deploy  - CDK デプロイログ (30日保持)                  │
│   /miyabi/agents      - Agent 実行ログ (30日保持)                    │
│   /miyabi/system      - システムログ (30日保持)                      │
│   /aws/lambda/*       - Lambda 実行ログ (1週間保持)                  │
│                                                                       │
│ Responsibilities:                                                     │
│ ✅ 全システムログの集約                                               │
│ ✅ ログ解析 (Insights API)                                           │
│ ✅ 進捗情報の抽出元                                                   │
│ ✅ エラートラッキング                                                 │
│                                                                       │
│ Query Frequency: Progress Collectorが5秒ごとにポーリング              │
│ Data Volume: ~1GB/月                                                 │
│ Cost: $0.50/month                                                    │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📊 データフロー: Read Path (タスク取得)

### シナリオ: ユーザーがタスク一覧を表示

```
Step 1: User Browser
   ↓ GET /api/tasks
Step 2: CloudFront (Cache: MISS) → S3 (index.html)
   ↓ XHR Request
Step 3: API Gateway
   ↓ Lambda Invocation
Step 4: Task API Service (Rust Lambda)
   ├─ Redis GET task:* (0.1ms) ✅ HIT
   └─ → Response immediately

   OR (Cache MISS)

   ├─ Redis GET task:* (0.1ms) ❌ MISS
   ├─ DynamoDB Scan miyabi-tasks (5ms)
   ├─ Redis SET task:* (0.5ms) ← Warm cache
   └─ → Response

Step 5: API Gateway → CloudFront → User Browser
   ↓
Display: Tasks shown in WebUI
```

**Total Latency**:
- **Cache Hit**: 0.1ms (Redis) + 3ms (Lambda warm) + 50ms (network) = **53ms** ⚡
- **Cache Miss**: 5ms (DynamoDB) + 0.5ms (Redis write) + 3ms (Lambda) + 50ms (network) = **58ms**

---

## 📊 データフロー: Write Path (進捗更新)

### シナリオ: CDK デプロイ中の進捗更新

```
Step 1: CDK Deploy running locally
   ↓ stdout
Step 2: CloudWatch Logs
   ↓ Log Event: "MiyabiWebUIStack | 15/29 | CREATE_IN_PROGRESS"

Step 3: Progress Collector Service (Triggered every 5s via API)
   ├─ CloudWatch Logs filterLogEvents API call
   ├─ Retry Logic (max 5 attempts, exponential backoff)
   │   ├─ Attempt 1: Success → Continue
   │   OR
   │   ├─ Attempt 1: Throttled → Wait 1s
   │   ├─ Attempt 2: Throttled → Wait 2s
   │   ├─ Attempt 3: Success → Continue
   │
   ├─ Parse Log: Extract "15/29" → 52% complete
   │
   ├─ DynamoDB PutItem (5ms)
   │   {
   │     task_id: "task-cdk-deploy-001",
   │     timestamp: 1731672000000,
   │     progress: { current: 15, total: 29, percentage: 52 },
   │     status: "running"
   │   }
   │
   └─ Redis SET task:task-cdk-deploy-001 (0.5ms, TTL: 1h)

Step 4: User Browser (polling every 5s)
   ↓ GET /api/tasks/task-cdk-deploy-001
Step 5: Task API Service
   ├─ Redis GET task:task-cdk-deploy-001 (0.1ms) ✅ HIT
   └─ → Response: { progress: 52% }

Step 6: WebUI updates progress bar
   ↓
Display: "CDK Deploy: 52% (15/29)"
```

**Update Frequency**: Every 5 seconds
**End-to-End Latency**: **0.1ms** (Redis read)
**Consistency**: Eventually consistent (5s delay)

---

## 🔄 Microservice Communication Patterns

### 1. Synchronous (Request-Response)

```
Web UI → API Gateway → Task API Service
         (HTTP REST)         (Lambda Invoke)
```

**Characteristics**:
- Latency: 50-100ms
- Protocol: HTTPS
- Use Case: User-initiated requests

### 2. Asynchronous (Event-Driven)

```
CloudWatch Logs → Progress Collector Service → DynamoDB + Redis
      (Log Events)    (Background Processing)     (Data Storage)
```

**Characteristics**:
- Latency: 5 seconds (polling interval)
- Protocol: CloudWatch Logs API
- Use Case: Background progress updates

### 3. Cache-Aside Pattern

```
Task API Service:
  1. Check Redis (Cache)
  2. If HIT → Return immediately
  3. If MISS → Query DynamoDB
  4. Write to Redis (warm cache)
  5. Return result
```

**Hit Rate**: ~90% (estimated)
**Cache TTL**: 1 hour

---

## 🛡️ Fault Tolerance & Recovery

### Failure Scenario 1: Redis Down

```
Task API Service detects Redis connection error
   ↓
Automatic fallback to DynamoDB
   ↓
Log warning: "Redis unavailable, using DynamoDB"
   ↓
Continue serving requests (5-10ms latency instead of 0.1ms)
   ↓
Monitor CloudWatch Alarm: RedisConnectionFailures
```

**Impact**: Latency increases from 0.1ms → 5ms (50x slower but still functional)
**Recovery**: Automatic when Redis comes back online

---

### Failure Scenario 2: CloudWatch Logs Throttling

```
Progress Collector Service:
  Attempt 1: filterLogEvents → ThrottlingException
     ↓ Wait 1s (exponential backoff)
  Attempt 2: filterLogEvents → ThrottlingException
     ↓ Wait 2s (with jitter: 1.5-2.5s)
  Attempt 3: filterLogEvents → Success ✅
     ↓
  Continue processing

OR (all 5 attempts fail)

  Fallback to DynamoDB scan
     ↓
  Return last known progress data
     ↓
  Log error: "CloudWatch Logs unavailable, using DynamoDB fallback"
```

**Impact**: Temporary stale data (max 5 seconds old)
**Recovery**: Automatic retry on next invocation

---

### Failure Scenario 3: Lambda Cold Start

```
API Gateway invokes Task API Service:
  First invocation after 5 minutes idle
     ↓ Cold Start: 150ms (VPC + ENI attachment)
     ↓ Initialize Redis connection: 50ms
     ↓ Process request: 3ms
     ↓ Total: 203ms

Solution 1: Provisioned Concurrency
  Keep 2 warm instances always ready
  Cost: +$10/month
  Benefit: No cold starts

Solution 2: Increased Memory
  Current: 256MB → Faster cold start
  Upgrade: 512MB → 20% faster
  Cost: +$2.60/month
```

**Current Strategy**: Accept occasional cold starts (cost optimization)
**Future**: Add Provisioned Concurrency if user complaints increase

---

## 📈 Scaling Strategy

### Horizontal Scaling

| Microservice | Current Scale | Max Scale | Trigger |
|--------------|--------------|-----------|---------|
| **Web UI** | CloudFront (global) | Unlimited | Automatic |
| **API Gateway** | 1000 req/s | 10000 req/s | Manual increase |
| **Task API Service** | 100 concurrent | 1000 concurrent | Lambda auto-scales |
| **Progress Collector** | 10 concurrent | 100 concurrent | Lambda auto-scales |
| **Redis** | 1 node | 6 nodes (cluster) | Manual upgrade |
| **DynamoDB** | 5 RCU/5 WCU | On-Demand (unlimited) | Manual switch |

### Vertical Scaling

| Microservice | Current | Upgrade Path |
|--------------|---------|--------------|
| **Task API Service** | 256MB | 512MB → 1024MB |
| **Progress Collector** | 256MB | 512MB → 1024MB |
| **Redis** | cache.t4g.micro (0.5GB) | cache.m6g.large (6.4GB) |
| **DynamoDB** | Provisioned 5/5 | On-Demand (auto-scale) |

---

## 💰 Cost Breakdown per Microservice

| Microservice | Component | Monthly Cost |
|--------------|-----------|--------------|
| **Web UI** | S3 + CloudFront | Included in free tier |
| **API Gateway** | 1M requests | $3.50 |
| **Task API Service** | Lambda (1M invocations, 256MB, 50ms avg) | $2.60 |
| **Progress Collector** | Lambda (100K invocations, 256MB, 100ms avg) | $0.30 |
| **Cache Service** | ElastiCache (cache.t4g.micro) | $12.00 |
| **Database Service** | DynamoDB (5 RCU/5 WCU) | $5.25 |
| **Logging Service** | CloudWatch Logs (1GB) | $0.50 |
| **Network** | NAT Gateway + Data Transfer | $32.85 |
| **Total** | | **$57/month** |

---

## 🎯 Service Level Objectives (SLOs)

| Microservice | Availability SLO | Latency SLO | Error Rate SLO |
|--------------|-----------------|-------------|----------------|
| **Web UI** | 99.99% | < 100ms (CloudFront) | < 0.01% |
| **API Gateway** | 99.95% | < 50ms (routing) | < 0.1% |
| **Task API Service** | 99.9% | < 100ms (P95) | < 0.5% |
| **Progress Collector** | 99.5% | < 500ms (P95) | < 1% |
| **Cache Service** | 99.9% | < 1ms (P99) | < 0.1% |
| **Database Service** | 99.99% | < 10ms (P99) | < 0.01% |

---

## 🔐 Security per Microservice

### Web UI Service
- ✅ HTTPS only (CloudFront)
- ✅ S3 bucket private (OAI)
- ✅ No direct S3 access

### API Gateway
- ✅ CORS enabled
- ✅ Rate limiting (1000 req/s)
- ⏳ JWT authentication (future)

### Lambda Services (Task API + Progress Collector)
- ✅ VPC isolation (private subnets)
- ✅ No internet access (NAT Gateway for outbound only)
- ✅ IAM role with least privilege
- ✅ Environment variables for secrets

### Redis
- ✅ VPC private subnet only
- ✅ Security Group: Lambda SG only
- ✅ No public endpoint
- ✅ Encryption at rest

### DynamoDB
- ✅ Encryption at rest (AWS managed keys)
- ✅ Point-in-Time Recovery enabled
- ✅ IAM-based access control

---

## 🎯 まとめ: 7 Microservices

1. **Web UI Service** - 静的コンテンツ配信 (CloudFront + S3)
2. **API Gateway Service** - ルーティング・認証 (API Gateway)
3. **Task API Service** - タスクAPI (Rust Lambda)
4. **Progress Collector Service** - 進捗収集 (Rust Lambda)
5. **Cache Service** - 超高速キャッシュ (Redis ElastiCache)
6. **Database Service** - 永続化 (DynamoDB)
7. **Logging Service** - ログ集約 (CloudWatch Logs)

**連携**: 各サービスは独立してスケール・デプロイ可能
**通信**: HTTPS REST API + AWS SDK
**データフロー**: Redis (0.1ms) → DynamoDB (5ms) → CloudWatch Logs (解析元)

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Microservices Architecture Design
**Status**: ✅ Complete

🏗️ **"7つの独立したマイクロサービスで、スケーラブルで堅牢なシステムを構築"** 🏗️
