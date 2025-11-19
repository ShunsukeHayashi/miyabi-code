# ⚡ Ultra-Fast Real-Time Architecture - ElastiCache + DynamoDB

**Version**: 2.0.0
**Created**: 2025-11-15
**Purpose**: 超高速リアルタイム進捗トラッキング（0.1ms応答）

---

## 🚀 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│              Ultra-Fast Real-Time Architecture                   │
│                 (3-Layer Caching Strategy)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  【Layer 1】ElastiCache (Redis) - 最速 ⚡⚡                      │
│  ├─ レスポンス: 0.1-1ms                                          │
│  ├─ 用途: リアルタイム進捗キャッシュ                             │
│  ├─ データ: アクティブタスク、最新ステータス                     │
│  └─ 自動削除: TTL 1時間                                          │
│                                                                  │
│  【Layer 2】DynamoDB - 永続化 📊                                │
│  ├─ レスポンス: 1-10ms                                           │
│  ├─ 用途: 全タスク履歴、プロジェクト情報                         │
│  ├─ データ: 完全なタスクレコード                                 │
│  └─ 保持: 90日（TTL）                                            │
│                                                                  │
│  【Layer 3】CloudWatch Logs - ログストレージ 📝                 │
│  ├─ レスポンス: リアルタイム                                     │
│  ├─ 用途: ログ解析ソース                                         │
│  └─ 保持: 30日                                                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        Data Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WebUI (5秒ポーリング)                                           │
│     ↓                                                            │
│  API Gateway                                                     │
│     ↓                                                            │
│  Lambda API (VPC内)                                              │
│     ↓                                                            │
│  Redis READ ⚡ 0.1ms                                             │
│     ↑                                                            │
│  Lambda Collector (バックグラウンド)                             │
│     ↓                  ↓                                         │
│  DynamoDB WRITE    Redis WRITE                                   │
│     ↑                                                            │
│  CloudWatch Logs (解析)                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 実装済みリソース

### 1. VPC (Virtual Private Cloud) ✅

```typescript
const vpc = new ec2.Vpc(this, 'MiyabiVPC', {
  vpcName: 'miyabi-vpc',
  maxAzs: 2,
  natGateways: 1,  // コスト最適化
  subnetConfiguration: [
    { name: 'Public', subnetType: PUBLIC },
    { name: 'Private', subnetType: PRIVATE_WITH_EGRESS },
  ],
});
```

**構成**:
- **Public Subnet**: インターネットゲートウェイ経由でインターネットアクセス
- **Private Subnet**: NAT Gateway経由でアウトバウンドのみ
- **AZ数**: 2（高可用性）
- **NAT Gateway**: 1個（月$32 → コスト削減）

---

### 2. ElastiCache Redis Cluster ✅

```typescript
const redisCluster = new elasticache.CfnCacheCluster({
  cacheNodeType: 'cache.t4g.micro',  // 0.5GB RAM
  engine: 'redis',
  engineVersion: '7.0',
  numCacheNodes: 1,
  clusterName: 'miyabi-redis',
  port: 6379,
});
```

**スペック**:
- **インスタンス**: cache.t4g.micro
- **メモリ**: 0.5GB
- **vCPU**: 2
- **月額コスト**: $12
- **レイテンシ**: 0.1-1ms

**データ構造**:
```
Key Pattern: task:{task_id}
Value: JSON (TaskRecord)
TTL: 3600秒 (1時間)

Key Pattern: project:{project_id}
Value: JSON (ProjectRecord)
TTL: 3600秒

Key Pattern: active_tasks
Value: Set<task_id> (アクティブタスク一覧)
```

---

### 3. DynamoDB Tables ✅

#### Table 1: `miyabi-tasks`

**構成**:
- Partition Key: `task_id` (String)
- Sort Key: `timestamp` (Number)
- Billing: Provisioned (5 RCU/5 WCU)
- Point-in-Time Recovery: 有効
- TTL: 90日

**GSI (Global Secondary Indexes)**:
1. **ProjectIndex** - `project_id` + `updated_at`
2. **StatusIndex** - `status` + `updated_at`
3. **TypeIndex** - `task_type` + `created_at`

#### Table 2: `miyabi-projects`

**構成**:
- Partition Key: `project_id` (String)
- Billing: Provisioned (5 RCU/5 WCU)
- Point-in-Time Recovery: 有効

---

### 4. CloudWatch Log Groups ✅

```
/miyabi/cdk-deploy    - CDKデプロイログ
/miyabi/agents        - Agentき実行ログ
/miyabi/system        - システムログ
```

**保持期間**: 30日
**用途**: Lambda CollectorがInsights APIで解析

---

### 5. Lambda Functions ✅

#### Lambda 1: Progress Collector

**目的**: CloudWatch LogsからRedis + DynamoDBに書き込み

```typescript
{
  functionName: 'miyabi-progress-collector',
  runtime: NODEJS_18_X,
  memorySize: 512MB,
  timeout: 60秒,
  vpc: vpc,  // VPC内で実行
  environment: {
    REDIS_ENDPOINT,
    REDIS_PORT,
    TASKS_TABLE_NAME,
    PROJECTS_TABLE_NAME,
  }
}
```

**実行方法**:
- ~~EventBridge 1分ごと~~ ❌ 遅すぎる
- **API Gateway経由で直接呼び出し** ✅

#### Lambda 2: API Backend

**目的**: WebUIからのリクエスト処理、Redisから読み取り

```typescript
{
  functionName: 'miyabi-webui-api',
  runtime: NODEJS_18_X,
  memorySize: 512MB,
  timeout: 30秒,
  vpc: vpc,  // VPC内で実行
  environment: {
    REDIS_ENDPOINT,
    REDIS_PORT,
    TASKS_TABLE_NAME,
  }
}
```

---

### 6. Security Groups ✅

```typescript
// Redis Security Group
redisSecurityGroup.addIngressRule(
  lambdaSecurityGroup,
  Port.tcp(6379),
  'Allow Lambda to access Redis'
);
```

**設定**:
- LambdaからRedisへの6379ポートアクセスを許可
- 外部からのアクセスは完全遮断（VPC内のみ）

---

## 🚫 削除/変更されたもの

### ❌ EventBridge Rule (削除)

**理由**: 1分間隔は遅すぎる

**旧構成**:
```
EventBridge (1分ごと) → Lambda → データ更新
```

**新構成**:
```
WebUI (5秒ごと) → API Gateway → Lambda → Redis (0.1ms)
```

---

## 💰 コスト試算（月額）

| リソース | スペック | 月額 |
|---------|---------|------|
| **ElastiCache** | cache.t4g.micro | $12.00 |
| **NAT Gateway** | 1個 | $32.40 |
| **NAT Gateway Data** | 10GB | $0.45 |
| **DynamoDB** | 5 RCU/5 WCU | $5.25 |
| **Lambda実行** | 100万回 | $0.20 |
| **CloudWatch Logs** | 1GB | $0.50 |
| **VPC** | 基本料金 | $0.00 |
| **S3** | 既存 | $0.00 |
| **CloudFront** | 既存 | $0.00 |
| **合計** | | **$50.80/月** |

**比較** (DynamoDBのみの場合):
- DynamoDBのみ: $5.25/月
- ElastiCache追加: $50.80/月
- **差額**: $45.55/月（9.7倍）

**価値**:
- レスポンス: 10ms → 0.1ms（100倍高速）
- リアルタイム性: 大幅向上
- 将来のWebSocket対応: 容易

---

## ⚡ パフォーマンス比較

### 旧アーキテクチャ（EventBridge + DynamoDB）

| 指標 | 値 |
|------|-----|
| 更新間隔 | 1分 |
| WebUIポーリング | 5秒 |
| 最大ラグ | 60秒 |
| 読み取り | 1-10ms (DynamoDB) |

### 新アーキテクチャ（Redis + DynamoDB）

| 指標 | 値 |
|------|-----|
| 更新間隔 | API呼び出し時 |
| WebUIポーリング | 5秒 |
| 最大ラグ | 5秒 |
| 読み取り | **0.1-1ms (Redis)** ⚡ |

**改善**:
- ラグ: 60秒 → 5秒（12倍高速）
- 読み取り: 10ms → 0.1ms（100倍高速）

---

## 🔄 データフロー詳細

### 1. タスク作成時

```
User → WebUI
  ↓
API Gateway → Lambda API
  ↓
DynamoDB Write (新規タスク)
  ↓
Redis Write (キャッシュ)
  ↓
Response (task_id)
```

### 2. 進捗更新時（バックグラウンド）

```
CloudWatch Logs (ログ蓄積)
  ↓
Lambda Collector (API経由で呼び出し)
  ↓
Log Insights (ログ解析)
  ↓
DynamoDB Write (永続化)
  ↓
Redis Write (キャッシュ更新)
```

### 3. WebUI表示時

```
WebUI (5秒ごと)
  ↓
API Gateway
  ↓
Lambda API (VPC内)
  ↓
Redis Read ⚡ 0.1ms
  ↓  (キャッシュミス時)
DynamoDB Read (1-10ms)
  ↓
Response (JSON)
```

---

## 🛠️ 未実装（残りの作業）

### 1. Lambda実装 ❌

**ファイル**:
- `lambda/progress-collector/index.js`
- `lambda/progress-collector/package.json`

**必要な機能**:
```javascript
const Redis = require('ioredis');
const AWS = require('aws-sdk');

const redis = new Redis({
  host: process.env.REDIS_ENDPOINT,
  port: process.env.REDIS_PORT,
});

exports.handler = async (event) => {
  // 1. CloudWatch Logs取得
  // 2. ログ解析
  // 3. Redis書き込み
  // 4. DynamoDB書き込み
};
```

**推定時間**: 2-3時間

---

### 2. WebUI API Lambda更新 ❌

**ファイル**: `web-ui-lambda/index.js`

**追加エンドポイント**:
```javascript
// GET /api/tasks - Redisから全タスク取得
// GET /api/tasks/:task_id - Redisから特定タスク取得
// GET /api/projects - Redisから全プロジェクト取得
// POST /api/tasks - タスク作成 (Redis + DynamoDB)
```

**推定時間**: 1-2時間

---

### 3. デプロイ ❌

**手順**:
```bash
# 1. Lambda関数ディレクトリ作成
mkdir -p lambda/progress-collector
cd lambda/progress-collector
npm init -y
npm install ioredis aws-sdk

# 2. CDK Deploy
cd infrastructure/aws-cdk
npx cdk deploy
```

**予想デプロイ時間**: 15-20分（VPC + ElastiCache作成に時間がかかる）

---

## 📈 次のフェーズ（将来）

### Phase 4: WebSocket対応

```
WebUI
  ↓ WebSocket接続
API Gateway WebSocket
  ↓
Lambda
  ↓ Pub/Sub
Redis (Pub/Sub)
```

**メリット**:
- ポーリング不要
- 即座にプッシュ通知
- サーバー負荷軽減

### Phase 5: Multi-Region対応

```
CloudFront (Global)
  ↓
ALB (Multi-Region)
  ↓
Lambda (複数リージョン)
  ↓
Redis (Global Datastore)
  ↓
DynamoDB (Global Tables)
```

---

## 🎯 まとめ

### ✅ 完了

1. DynamoDB Schema設計
2. CDK Stack (VPC, ElastiCache, DynamoDB, Lambda, Security Groups)
3. EventBridge削除（API直接呼び出しに変更）
4. CloudWatch Logs設定

### ⏳ 残り

1. Lambda実装（2-3時間）
2. WebUI API更新（1-2時間）
3. デプロイ & テスト（1時間）

**総推定時間**: 4-6時間

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Ultra-Fast Real-Time Architecture
**Status**: ✅ Infrastructure Complete → ⏳ Lambda Implementation

🌸 **"0.1ミリ秒の速さで、リアルタイムの未来を"** 🌸
