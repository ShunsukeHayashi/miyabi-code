# Miyabi Lambda - DynamoDB Table Schema Design

**Version**: 1.0
**Date**: 2025-11-29
**Purpose**: Lambda関数用DynamoDBテーブル設計

---

## 📋 Table of Contents

1. [Design Overview](#design-overview)
2. [Access Patterns](#access-patterns)
3. [Table Schema](#table-schema)
4. [Global Secondary Indexes (GSI)](#global-secondary-indexes-gsi)
5. [Entity Definitions](#entity-definitions)
6. [Data Examples](#data-examples)
7. [Migration Strategy](#migration-strategy)
8. [Terraform Configuration](#terraform-configuration)

---

## Design Overview

### Architecture Decision

**Single Table Design** - 全エンティティを1つのDynamoDBテーブルに格納し、GSIで複数のアクセスパターンに対応

### Why Single Table?

1. **コスト削減**: テーブル数削減によるプロビジョニングコスト最適化
2. **パフォーマンス**: 1回のクエリで関連データを取得可能
3. **Lambda最適化**: コールドスタート削減、接続オーバーヘッド最小化
4. **スケーラビリティ**: DynamoDBの自動スケーリングを最大限活用

---

## Access Patterns

### Primary Access Patterns

| Pattern | Description | Keys Used |
|---------|-------------|-----------|
| AP1 | ユーザー情報取得 | PK: `USER#<userId>`, SK: `METADATA` |
| AP2 | ユーザーのリポジトリ一覧取得 | PK: `USER#<userId>`, SK: `REPO#<repoId>` |
| AP3 | リポジトリのAgent実行履歴取得 | PK: `REPO#<repoId>`, SK: `EXEC#<timestamp>#<execId>` |
| AP4 | Agent実行詳細取得 | PK: `EXEC#<execId>`, SK: `METADATA` |
| AP5 | 実行ステータス別検索 | GSI1: PK: `STATUS#<status>`, SK: `<timestamp>` |
| AP6 | ユーザーのタスク一覧取得 | PK: `USER#<userId>`, SK: `TASK#<taskId>` |
| AP7 | タスクの依存関係取得 | PK: `TASK#<taskId>`, SK: `DEP#<dependencyTaskId>` |
| AP8 | WebSocket接続管理 | PK: `WS#<connectionId>`, SK: `METADATA` |
| AP9 | Organization配下のユーザー取得 | GSI2: PK: `ORG#<orgId>`, SK: `USER#<userId>` |
| AP10 | ワークフロー定義取得 | PK: `REPO#<repoId>`, SK: `WORKFLOW#<workflowId>` |

---

## Table Schema

### Main Table: `miyabi-lambda-data`

| Attribute | Type | Description | Notes |
|-----------|------|-------------|-------|
| **PK** | String (S) | Partition Key | Format: `<ENTITY>#<ID>` |
| **SK** | String (S) | Sort Key | Format: `<TYPE>#<VALUE>` |
| **GSI1PK** | String (S) | GSI1 Partition Key | ステータス/タイプ別検索用 |
| **GSI1SK** | String (S) | GSI1 Sort Key | タイムスタンプソート用 |
| **GSI2PK** | String (S) | GSI2 Partition Key | Organization/リレーション用 |
| **GSI2SK** | String (S) | GSI2 Sort Key | 二次リレーション用 |
| **EntityType** | String (S) | エンティティタイプ | `USER`, `REPO`, `EXEC`, etc. |
| **Data** | Map (M) | エンティティ固有データ | JSON形式のネストデータ |
| **CreatedAt** | String (S) | 作成日時 | ISO 8601形式 |
| **UpdatedAt** | String (S) | 更新日時 | ISO 8601形式 |
| **TTL** | Number (N) | Time To Live | Unix timestamp (秒) |

### Billing Mode

**PAY_PER_REQUEST** (On-Demand)
- Lambda使用パターンに最適
- スパイクトラフィックに対応
- プロビジョニング管理不要

### Capacity (参考値)

**バースト時の想定**:
- Read: 最大 100 RCU/秒
- Write: 最大 50 WCU/秒

---

## Global Secondary Indexes (GSI)

### GSI1: StatusIndex

**Purpose**: ステータス・タイプ別の検索とタイムスタンプソート

| Attribute | Type | Key Type |
|-----------|------|----------|
| GSI1PK | String (S) | HASH |
| GSI1SK | String (S) | RANGE |

**Access Patterns**:
- `STATUS#pending` でPending状態の実行を取得
- `STATUS#running` でRunning状態の実行を取得
- `AGENT_TYPE#codegen` でCodeGen実行履歴を取得

**ProjectionType**: `ALL`

---

### GSI2: OrganizationIndex

**Purpose**: Organization-User, Organization-Repositoryリレーション

| Attribute | Type | Key Type |
|-----------|------|----------|
| GSI2PK | String (S) | HASH |
| GSI2SK | String (S) | RANGE |

**Access Patterns**:
- `ORG#<orgId>` で組織配下のユーザー一覧取得
- `ORG#<orgId>` で組織配下のリポジトリ一覧取得

**ProjectionType**: `ALL`

---

## Entity Definitions

### 1. User Entity

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "METADATA",
  "EntityType": "USER",
  "GSI2PK": "ORG#org-123",
  "GSI2SK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "Data": {
    "githubId": 12345678,
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://github.com/avatar.jpg",
    "accessToken": "encrypted_token_here",
    "orgRole": "admin"
  },
  "CreatedAt": "2025-11-29T00:00:00Z",
  "UpdatedAt": "2025-11-29T00:00:00Z"
}
```

---

### 2. Repository Entity

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "REPO#repo-abc123",
  "EntityType": "REPOSITORY",
  "GSI2PK": "ORG#org-123",
  "GSI2SK": "REPO#repo-abc123",
  "Data": {
    "githubRepoId": 987654321,
    "owner": "customer-cloud",
    "name": "miyabi-private",
    "fullName": "customer-cloud/miyabi-private",
    "isActive": true
  },
  "CreatedAt": "2025-11-29T00:00:00Z",
  "UpdatedAt": "2025-11-29T00:00:00Z"
}
```

**Reverse Lookup Item** (リポジトリIDから取得用):

```json
{
  "PK": "REPO#repo-abc123",
  "SK": "METADATA",
  "EntityType": "REPOSITORY",
  "Data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "githubRepoId": 987654321,
    "owner": "customer-cloud",
    "name": "miyabi-private",
    "fullName": "customer-cloud/miyabi-private",
    "isActive": true
  },
  "CreatedAt": "2025-11-29T00:00:00Z",
  "UpdatedAt": "2025-11-29T00:00:00Z"
}
```

---

### 3. Agent Execution Entity

```json
{
  "PK": "REPO#repo-abc123",
  "SK": "EXEC#2025-11-29T10:30:00Z#exec-xyz789",
  "EntityType": "AGENT_EXECUTION",
  "GSI1PK": "STATUS#running",
  "GSI1SK": "2025-11-29T10:30:00Z",
  "Data": {
    "issueNumber": 123,
    "agentType": "codegen",
    "status": "running",
    "startedAt": "2025-11-29T10:30:00Z",
    "completedAt": null,
    "resultSummary": null,
    "qualityScore": null,
    "prNumber": null
  },
  "CreatedAt": "2025-11-29T10:30:00Z",
  "UpdatedAt": "2025-11-29T10:35:00Z"
}
```

**Reverse Lookup Item** (実行IDから取得用):

```json
{
  "PK": "EXEC#exec-xyz789",
  "SK": "METADATA",
  "EntityType": "AGENT_EXECUTION",
  "Data": {
    "repositoryId": "repo-abc123",
    "issueNumber": 123,
    "agentType": "codegen",
    "status": "running",
    "startedAt": "2025-11-29T10:30:00Z"
  },
  "CreatedAt": "2025-11-29T10:30:00Z",
  "UpdatedAt": "2025-11-29T10:35:00Z"
}
```

---

### 4. Workflow Entity

```json
{
  "PK": "REPO#repo-abc123",
  "SK": "WORKFLOW#workflow-def456",
  "EntityType": "WORKFLOW",
  "Data": {
    "name": "CI/CD Pipeline",
    "description": "Main deployment workflow",
    "dagDefinition": {
      "nodes": [...],
      "edges": [...]
    },
    "isActive": true
  },
  "CreatedAt": "2025-11-29T00:00:00Z",
  "UpdatedAt": "2025-11-29T00:00:00Z"
}
```

---

### 5. Task Entity

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "TASK#task-ghi789",
  "EntityType": "TASK",
  "GSI1PK": "TASK_STATUS#pending",
  "GSI1SK": "2025-11-29T09:00:00Z",
  "Data": {
    "repositoryId": "repo-abc123",
    "name": "Fix authentication bug",
    "description": "Update OAuth flow",
    "priority": "P0",
    "status": "pending",
    "agentType": "codegen",
    "issueNumber": 456,
    "retryCount": 0,
    "maxRetries": 3,
    "metadata": {
      "estimatedDuration": "30m"
    }
  },
  "CreatedAt": "2025-11-29T09:00:00Z",
  "UpdatedAt": "2025-11-29T09:00:00Z"
}
```

---

### 6. Task Dependency Entity

```json
{
  "PK": "TASK#task-ghi789",
  "SK": "DEP#task-jkl012",
  "EntityType": "TASK_DEPENDENCY",
  "Data": {
    "dependsOnTaskId": "task-jkl012"
  },
  "CreatedAt": "2025-11-29T09:00:00Z"
}
```

---

### 7. WebSocket Connection Entity

```json
{
  "PK": "WS#connection-mno345",
  "SK": "METADATA",
  "EntityType": "WEBSOCKET",
  "Data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "connectedAt": "2025-11-29T10:00:00Z",
    "lastPingAt": "2025-11-29T10:05:00Z"
  },
  "TTL": 1733068800,
  "CreatedAt": "2025-11-29T10:00:00Z",
  "UpdatedAt": "2025-11-29T10:05:00Z"
}
```

**Reverse Lookup Item** (UserIDから接続一覧取得用):

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "WS#connection-mno345",
  "EntityType": "WEBSOCKET",
  "Data": {
    "connectionId": "connection-mno345",
    "connectedAt": "2025-11-29T10:00:00Z"
  },
  "TTL": 1733068800,
  "CreatedAt": "2025-11-29T10:00:00Z",
  "UpdatedAt": "2025-11-29T10:05:00Z"
}
```

---

### 8. LINE Message Entity

```json
{
  "PK": "USER#550e8400-e29b-41d4-a716-446655440000",
  "SK": "LINE_MSG#2025-11-29T11:00:00Z#msg-pqr678",
  "EntityType": "LINE_MESSAGE",
  "Data": {
    "lineUserId": "U123456789abcdef",
    "messageType": "text",
    "content": "Hello Miyabi!",
    "metadata": {
      "replyToken": "abc123"
    }
  },
  "TTL": 1735660800,
  "CreatedAt": "2025-11-29T11:00:00Z"
}
```

**TTL設定**: 30日後に自動削除 (メッセージ履歴保持期間)

---

### 9. Organization Entity

```json
{
  "PK": "ORG#org-123",
  "SK": "METADATA",
  "EntityType": "ORGANIZATION",
  "Data": {
    "name": "Acme Corp",
    "githubOrgId": 123456,
    "plan": "enterprise",
    "billingEmail": "billing@acme.com",
    "settings": {
      "allowedAgents": ["codegen", "review", "pr"],
      "maxConcurrentExecutions": 10
    }
  },
  "CreatedAt": "2025-11-29T00:00:00Z",
  "UpdatedAt": "2025-11-29T00:00:00Z"
}
```

---

### 10. Organization Member Entity

```json
{
  "PK": "ORG#org-123",
  "SK": "MEMBER#550e8400-e29b-41d4-a716-446655440000",
  "EntityType": "ORG_MEMBER",
  "Data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "admin",
    "permissions": ["read", "write", "admin"],
    "joinedAt": "2025-11-29T00:00:00Z"
  },
  "CreatedAt": "2025-11-29T00:00:00Z",
  "UpdatedAt": "2025-11-29T00:00:00Z"
}
```

---

### 11. Execution Log Entity

```json
{
  "PK": "EXEC#exec-xyz789",
  "SK": "LOG#2025-11-29T10:32:15Z#log-stu901",
  "EntityType": "EXECUTION_LOG",
  "Data": {
    "logLevel": "INFO",
    "message": "Starting code generation for issue #123",
    "metadata": {
      "module": "agent_executor",
      "function": "execute"
    }
  },
  "TTL": 1735660800,
  "CreatedAt": "2025-11-29T10:32:15Z"
}
```

**TTL設定**: 30日後に自動削除 (ログ保持期間)

---

## Data Examples

### Query Examples

#### 1. ユーザー情報取得

```python
response = dynamodb.get_item(
    TableName='miyabi-lambda-data',
    Key={
        'PK': {'S': 'USER#550e8400-e29b-41d4-a716-446655440000'},
        'SK': {'S': 'METADATA'}
    }
)
```

#### 2. ユーザーのリポジトリ一覧取得

```python
response = dynamodb.query(
    TableName='miyabi-lambda-data',
    KeyConditionExpression='PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues={
        ':pk': {'S': 'USER#550e8400-e29b-41d4-a716-446655440000'},
        ':sk': {'S': 'REPO#'}
    }
)
```

#### 3. ステータス別実行履歴取得

```python
response = dynamodb.query(
    TableName='miyabi-lambda-data',
    IndexName='GSI1',
    KeyConditionExpression='GSI1PK = :pk',
    ExpressionAttributeValues={
        ':pk': {'S': 'STATUS#running'}
    },
    ScanIndexForward=False  # 新しい順
)
```

#### 4. Organization配下のユーザー取得

```python
response = dynamodb.query(
    TableName='miyabi-lambda-data',
    IndexName='GSI2',
    KeyConditionExpression='GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
    ExpressionAttributeValues={
        ':pk': {'S': 'ORG#org-123'},
        ':sk': {'S': 'USER#'}
    }
)
```

---

## Migration Strategy

### Phase 1: DynamoDB環境構築

1. **Terraformでテーブル作成** (下記参照)
2. **GSI設定**
3. **TTL有効化**
4. **Point-in-Time Recovery有効化**

### Phase 2: 二重書き込み期間

1. **PostgreSQL + DynamoDB並行書き込み**
2. **読み取りはPostgreSQLから**
3. **データ整合性検証**

### Phase 3: データ移行

1. **PostgreSQLからDynamoDBへデータコピー**
2. **整合性チェック**
3. **読み取り先をDynamoDBへ切り替え**

### Phase 4: 完全移行

1. **PostgreSQL書き込み停止**
2. **DynamoDBのみ使用**
3. **PostgreSQL非推奨化**

---

## Terraform Configuration

### テーブル定義

```hcl
# deploy/terraform/dynamodb.tf

resource "aws_dynamodb_table" "miyabi_lambda_data" {
  name           = "miyabi-lambda-data-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Point-in-Time Recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Primary Keys
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI1 attributes
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI2 attributes
  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # GSI1: StatusIndex
  global_secondary_index {
    name               = "GSI1"
    hash_key           = "GSI1PK"
    range_key          = "GSI1SK"
    projection_type    = "ALL"
  }

  # GSI2: OrganizationIndex
  global_secondary_index {
    name               = "GSI2"
    hash_key           = "GSI2PK"
    range_key          = "GSI2SK"
    projection_type    = "ALL"
  }

  # TTL設定
  ttl {
    attribute_name = "TTL"
    enabled        = true
  }

  tags = {
    Name        = "miyabi-lambda-data"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "miyabi"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "miyabi-dynamodb-throttle-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "DynamoDB throttling detected"
  alarm_actions       = [var.sns_alarm_topic_arn]

  dimensions = {
    TableName = aws_dynamodb_table.miyabi_lambda_data.name
  }
}

# DynamoDB Streams用Lambda関数 (オプション)
resource "aws_lambda_function" "dynamodb_stream_processor" {
  filename         = "lambda-stream-processor.zip"
  function_name    = "miyabi-dynamodb-stream-processor-${var.environment}"
  role             = aws_iam_role.lambda_stream_processor.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("lambda-stream-processor.zip")
  runtime          = "nodejs18.x"

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }
}

resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
  event_source_arn  = aws_dynamodb_table.miyabi_lambda_data.stream_arn
  function_name     = aws_lambda_function.dynamodb_stream_processor.arn
  starting_position = "LATEST"
}
```

### IAM Policy

```hcl
# deploy/terraform/iam-dynamodb.tf

data "aws_iam_policy_document" "lambda_dynamodb" {
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ]

    resources = [
      aws_dynamodb_table.miyabi_lambda_data.arn,
      "${aws_dynamodb_table.miyabi_lambda_data.arn}/index/*"
    ]
  }

  statement {
    sid    = "DynamoDBStreams"
    effect = "Allow"

    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams"
    ]

    resources = [
      "${aws_dynamodb_table.miyabi_lambda_data.arn}/stream/*"
    ]
  }
}

resource "aws_iam_policy" "lambda_dynamodb" {
  name        = "miyabi-lambda-dynamodb-${var.environment}"
  description = "DynamoDB access policy for Miyabi Lambda functions"
  policy      = data.aws_iam_policy_document.lambda_dynamodb.json
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}
```

---

## Cost Estimation

### Pay-Per-Request Pricing (東京リージョン)

**想定ワークロード (月間)**:
- Read: 1,000,000 requests
- Write: 500,000 requests
- Storage: 5GB

**料金計算**:
- Read: 1M × $0.0000025 = **$2.50**
- Write: 500K × $0.0000125 = **$6.25**
- Storage: 5GB × $0.25 = **$1.25**
- **合計**: **$10.00/月**

### GSI追加コスト

- GSI Read: 同上
- GSI Write: 同上
- **GSI合計**: **約$10.00/月** × 2 GSI = **$20.00/月**

**総計**: **約$30.00/月**

---

## Best Practices

### 1. Hot Key対策

**問題**: 特定のPKに大量アクセスが集中
**対策**:
- Write Sharding: `USER#<userId>#<shard>` でシャーディング
- Read Replica: DAXキャッシュ使用

### 2. Large Item対策

**問題**: 400KB制限
**対策**:
- S3オフロード: 大きなJSONはS3に保存しURLのみ格納
- 分割保存: `EXEC#<execId>#CHUNK#1`, `EXEC#<execId>#CHUNK#2`

### 3. Transaction使用

**ユースケース**: ユーザー作成 + Organization割り当て
**実装**: `TransactWriteItems` で原子性保証

```python
dynamodb.transact_write_items(
    TransactItems=[
        {
            'Put': {
                'TableName': 'miyabi-lambda-data',
                'Item': user_item
            }
        },
        {
            'Put': {
                'TableName': 'miyabi-lambda-data',
                'Item': org_member_item
            }
        }
    ]
)
```

---

## Monitoring & Alerting

### CloudWatch Metrics

1. **ConsumedReadCapacityUnits**
2. **ConsumedWriteCapacityUnits**
3. **UserErrors** (スロットリング)
4. **SystemErrors**
5. **SuccessfulRequestLatency**

### Alarms設定

- **Throttling**: UserErrors > 10 in 5 minutes
- **Latency**: SuccessfulRequestLatency > 50ms (p99)
- **Error Rate**: SystemErrors > 1%

---

## Security

### 1. Encryption

- **At Rest**: AWS KMS (デフォルト有効)
- **In Transit**: TLS 1.2+

### 2. Access Control

- **IAM Policies**: 最小権限原則
- **VPC Endpoint**: パブリックインターネット経由禁止

### 3. Sensitive Data

- **アクセストークン**: AWS Secrets Manager参照
- **PII**: 暗号化保存 (クライアント側暗号化推奨)

---

## Backup & Recovery

### Point-in-Time Recovery (PITR)

- **有効化**: Terraform設定済み
- **保持期間**: 35日
- **RPO**: 5分

### On-Demand Backup

```bash
aws dynamodb create-backup \
  --table-name miyabi-lambda-data-production \
  --backup-name miyabi-backup-$(date +%Y%m%d)
```

---

## Testing Strategy

### 1. Unit Tests

- モックDynamoDB (localstack)
- アクセスパターンテスト

### 2. Integration Tests

- DynamoDB Local使用
- E2Eクエリテスト

### 3. Load Testing

- Artillery/Locust使用
- 1000 RPS シミュレーション

---

## Future Enhancements

### Phase 2

- [ ] DAX (DynamoDB Accelerator) 導入
- [ ] Global Tables (Multi-Region)
- [ ] S3 Export for Analytics

### Phase 3

- [ ] DynamoDB Streams → EventBridge統合
- [ ] Change Data Capture (CDC) パイプライン
- [ ] Machine Learning統合 (Sage Maker)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-29
**Maintainer**: Miyabi Team
