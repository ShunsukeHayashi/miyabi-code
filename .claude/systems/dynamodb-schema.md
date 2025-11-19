# DynamoDB Schema - Miyabi Progress Tracking

**Version**: 1.0.0
**Created**: 2025-11-15
**Purpose**: Full cloud-based progress tracking with DynamoDB

---

## Table 1: miyabi-tasks

**Purpose**: Store all task records with real-time progress tracking

### Primary Key
- **Partition Key**: `task_id` (String)
- **Sort Key**: `timestamp` (Number) - Unix timestamp in milliseconds

### Attributes

```typescript
interface TaskRecord {
  // Keys
  task_id: string;              // "task-cdk-deploy-1763204866"
  timestamp: number;            // 1731672000000

  // Basic Info
  task_name: string;            // "CDK Deploy - UI Improvements"
  task_type: string;            // "cdk_deploy" | "agent_execution" | "issue_creation" | "build"
  description?: string;

  // Status
  status: string;               // "pending" | "running" | "completed" | "failed" | "blocked"
  priority: string;             // "P0" | "P1" | "P2" | "P3"

  // Progress
  progress: {
    current: number;            // 29
    total: number;              // 29
    percentage: number;         // 100
  };

  // Timing
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
  completed_at?: string;        // ISO 8601
  duration_seconds?: number;

  // Details
  details: {
    phase?: string;             // "CloudFormation Stack Creation"
    current_step?: string;      // "CloudFront Distribution"
    log_stream?: string;        // CloudWatch Log Stream name
    error_message?: string;
  };

  // Metadata
  metadata: {
    project_id: string;         // "miyabi-webui"
    agent?: string;             // "orchestrator" | "mugen" | "majin"
    execution_type?: string;    // "headless" | "interactive"
    user_id?: string;
    template_id?: string;
  };

  // GitHub Integration (optional)
  github?: {
    issue_number?: number;
    issue_url?: string;
    pr_number?: number;
    pr_url?: string;
  };

  // TTL
  ttl?: number;                 // Unix timestamp for auto-deletion (90 days)
}
```

### Global Secondary Indexes

**GSI-1: ProjectIndex**
- Partition Key: `project_id` (from metadata)
- Sort Key: `updated_at`
- Purpose: Query all tasks for a specific project

**GSI-2: StatusIndex**
- Partition Key: `status`
- Sort Key: `updated_at`
- Purpose: Query all tasks by status (e.g., all running tasks)

**GSI-3: TypeIndex**
- Partition Key: `task_type`
- Sort Key: `created_at`
- Purpose: Query tasks by type

### Access Patterns

1. **Get latest task status**
   ```
   Query: PK = task_id, SK descending, Limit = 1
   ```

2. **Get task history**
   ```
   Query: PK = task_id, SK between timestamps
   ```

3. **Get all tasks for a project**
   ```
   Query GSI-1: project_id = "miyabi-webui"
   ```

4. **Get all running tasks**
   ```
   Query GSI-2: status = "running"
   ```

---

## Table 2: miyabi-projects

**Purpose**: Store project metadata and aggregated metrics

### Primary Key
- **Partition Key**: `project_id` (String)

### Attributes

```typescript
interface ProjectRecord {
  // Key
  project_id: string;           // "miyabi-webui"

  // Basic Info
  project_name: string;         // "Miyabi WebUI"
  description?: string;
  status: string;               // "active" | "paused" | "completed" | "archived"

  // Ownership
  owner: string;                // "orchestrator"
  account_id?: string;          // For multi-tenant

  // Resources
  resources: {
    github_repo?: string;
    s3_bucket?: string;
    cloudfront_distribution?: string;
    api_endpoint?: string;
  };

  // Task References
  tasks: string[];              // List of task_ids
  active_task_count: number;

  // Metrics (aggregated)
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    blocked_tasks: number;
    success_rate: number;       // 0.0 - 1.0
    avg_completion_time_seconds: number;
    last_updated: string;       // ISO 8601
  };

  // Timing
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
}
```

### Access Patterns

1. **Get project details**
   ```
   GetItem: PK = project_id
   ```

2. **List all projects**
   ```
   Scan (with ProjectionExpression for list view)
   ```

---

## Table 3: miyabi-logs (Optional - or use CloudWatch Logs)

**Purpose**: Store structured log entries for quick querying

### Primary Key
- **Partition Key**: `log_source` (String) - e.g., "cdk-deploy", "agent-uiux"
- **Sort Key**: `timestamp` (Number)

### Attributes

```typescript
interface LogEntry {
  log_source: string;           // "cdk-deploy"
  timestamp: number;            // Unix timestamp ms

  log_level: string;            // "INFO" | "WARN" | "ERROR" | "DEBUG"
  message: string;

  task_id?: string;             // Link to task

  context?: {
    [key: string]: any;
  };

  ttl: number;                  // 30 days TTL
}
```

**Note**: CloudWatch Logs が推奨。DynamoDBログは高コストになる可能性あり。

---

## CloudWatch Logs Structure

### Log Groups

**1. /miyabi/cdk-deploy**
- CDK deployment logs
- Log Streams: task-{task_id}

**2. /miyabi/agents/{agent_name}**
- Agent execution logs
- Log Streams: task-{task_id}

**3. /miyabi/system**
- System-level logs
- Orchestrator logs
- Error logs

### Log Format (JSON)

```json
{
  "timestamp": "2025-11-15T20:00:00.000Z",
  "level": "INFO",
  "task_id": "task-cdk-deploy-001",
  "message": "Deployment started",
  "phase": "CloudFormation Stack Creation",
  "progress": {
    "current": 5,
    "total": 29,
    "percentage": 17
  }
}
```

---

## DynamoDB Capacity Planning

### Read Capacity

**Estimated Reads per Second**:
- WebUI polling (5s interval): 1 read/5s = 0.2 RPS
- Task status updates: 10 RPS (peak)
- **Total**: ~10 RPS = 360 RCU/hour

**Provisioned Capacity**: 5 RCU (on-demand推奨)

### Write Capacity

**Estimated Writes per Second**:
- Progress updates (5s interval): 0.2 WPS
- Task creation: 1 WPS
- Status updates: 2 WPS
- **Total**: ~5 WPS = 180 WCU/hour

**Provisioned Capacity**: 5 WCU (on-demand推奨)

### Cost Estimate (On-Demand)

| Operation | Monthly Volume | Cost |
|-----------|---------------|------|
| Write requests | 13M writes | $16.25 |
| Read requests | 26M reads | $6.50 |
| Storage (1GB) | 1GB | $0.25 |
| **Total** | | **$23/month** |

**Note**: On-Demandは柔軟だが、Provisioned Capacityの方が安い（予測可能な負荷の場合）

### Provisioned Capacity Option

| Resource | Capacity | Monthly Cost |
|----------|----------|--------------|
| RCU (5) | 5 units | $2.50 |
| WCU (5) | 5 units | $2.50 |
| Storage | 1GB | $0.25 |
| **Total** | | **$5.25/month** |

**推奨**: まずProvisioned (5 RCU/5 WCU) で開始、必要に応じてOn-Demandに切り替え

---

## TTL (Time to Live) Strategy

### Tasks Table
- **TTL**: 90 days after `completed_at` or `updated_at`
- **Purpose**: 古いタスク記録を自動削除してストレージコスト削減

### Projects Table
- **TTL**: なし（長期保存）
- アーカイブされたプロジェクトは別テーブルに移動（オプション）

---

## Migration Strategy

### Phase 1: Parallel Run
- ローカルとDynamoDB両方に書き込み
- WebUIはDynamoDBから読み取り
- 1週間テスト

### Phase 2: DynamoDB Primary
- ローカルは読み取り専用
- DynamoDBがプライマリ
- 2週間運用

### Phase 3: Full Cloud
- ローカル完全停止
- DynamoDBのみ

---

## Backup Strategy

### Point-in-Time Recovery (PITR)
- Enable on both tables
- 35日間のバックアップ保持
- Additional cost: $0.20/GB-month

### On-Demand Backups
- 毎週自動バックアップ（Lambda + EventBridge）
- S3にエクスポート（長期保存用）

---

## Monitoring

### CloudWatch Alarms

1. **High Read Throttle**
   - Metric: `UserErrors`
   - Threshold: > 5 in 5 minutes

2. **High Write Throttle**
   - Metric: `SystemErrors`
   - Threshold: > 5 in 5 minutes

3. **Table Capacity**
   - Metric: `ConsumedReadCapacityUnits`
   - Threshold: > 80% of provisioned

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: DynamoDB Full Cloud Architecture
**Status**: ✅ Design Complete → ⏳ Implementation Starting

🌸 **"クラウドの力で、どこでも動く"** 🌸
