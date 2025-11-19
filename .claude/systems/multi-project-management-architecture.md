# 🏗️ Multi-Project Management Architecture

**Version**: 1.0.0
**Created**: 2025-11-15
**Purpose**: 複数プロジェクトの並列管理とマルチテナント対応

---

## 1. 概要

### 1.1 ビジョン

**"1つのMiyabiプラットフォームで複数のプロジェクトを同時進行"**

- 個人開発者: 複数の副業プロジェクトを並行管理
- チーム開発: 複数のプロダクトを同一基盤で運用
- マルチテナント: 各アカウントが独立したプロジェクト空間を持つ

### 1.2 要求事項

ユーザー要求:
> "プロジェクトが複数発生すると思うので、その辺の管理のところも詳細に検討よろしく、頼む!"

**キーポイント**:
1. **プロジェクト独立性**: 各プロジェクトが独立した名前空間を持つ
2. **リソース隔離**: S3, CloudFront, Lambda等が干渉しない
3. **進捗可視化**: 全プロジェクトの進捗を1つのダッシュボードで確認
4. **スケーラビリティ**: 100+プロジェクトに対応可能

---

## 2. アーキテクチャ設計

### 2.1 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│              Miyabi Multi-Project Platform                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Project A   │    │  Project B   │    │  Project C   │ │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤ │
│  │ • S3 Bucket  │    │ • S3 Bucket  │    │ • S3 Bucket  │ │
│  │ • CloudFront │    │ • CloudFront │    │ • CloudFront │ │
│  │ • Lambda     │    │ • Lambda     │    │ • Lambda     │ │
│  │ • API GW     │    │ • API GW     │    │ • API GW     │ │
│  │ • DynamoDB   │    │ • DynamoDB   │    │ • DynamoDB   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Shared Infrastructure                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • Account Management DB                             │  │
│  │  • Authentication (Cognito)                          │  │
│  │  • Secrets Manager                                   │  │
│  │  • CloudWatch Logs                                   │  │
│  │  • EventBridge (Cross-Project Events)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 プロジェクト階層

```
Level 0: Account (AWS Account) - 112530848482
         ↓
Level 1: Organization (Miyabi Society)
         ↓
Level 2: Project (miyabi-webui, miyabi-mobile, miyabi-api...)
         ↓
Level 3: Environment (dev, staging, prod)
         ↓
Level 4: Resources (S3, Lambda, CloudFront...)
```

**命名規則**:
```
{project-id}-{env}-{resource-type}

例:
- miyabi-webui-prod-bucket
- miyabi-mobile-dev-lambda
- miyabi-api-staging-cloudfront
```

---

## 3. データモデル

### 3.1 Project Schema

```typescript
interface Project {
  // Identity
  project_id: string;               // "miyabi-webui"
  project_name: string;             // "Miyabi WebUI"
  slug: string;                     // "miyabi-webui" (URL safe)

  // Ownership
  owner_id: string;                 // User ID or Team ID
  owner_type: "user" | "team";
  account_id: string;               // For multi-tenant

  // Status
  status: "active" | "paused" | "completed" | "archived";
  created_at: string;               // ISO 8601
  updated_at: string;
  archived_at?: string;

  // Configuration
  config: {
    environments: Environment[];
    default_environment: "dev" | "staging" | "prod";
    auto_deploy: boolean;
    auto_scale: boolean;
  };

  // Resources
  resources: {
    github_repo: string;            // "customer-cloud/miyabi-private"
    s3_bucket: string;              // "miyabi-webui-prod-112530848482"
    cloudfront_distribution?: string;
    api_endpoint?: string;
    database?: string;
  };

  // Metadata
  metadata: {
    description: string;
    tags: string[];
    category: "webapp" | "api" | "mobile" | "cli" | "library";
    language: string[];             // ["typescript", "rust", "python"]
    framework: string[];            // ["react", "express", "aws-cdk"]
  };

  // Metrics
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    success_rate: number;           // 0-1
    avg_completion_time_seconds: number;
    last_deployment_at?: string;
  };

  // Team
  team?: {
    members: ProjectMember[];
    permissions: ProjectPermissions;
  };
}

interface Environment {
  name: "dev" | "staging" | "prod";
  region: string;                   // "us-west-2"
  auto_deploy: boolean;
  branch: string;                   // "main", "develop"
  resources: {
    s3_bucket?: string;
    cloudfront_distribution?: string;
    api_endpoint?: string;
  };
}

interface ProjectMember {
  user_id: string;
  role: "owner" | "admin" | "developer" | "viewer";
  joined_at: string;
}

interface ProjectPermissions {
  deploy: "owner_only" | "admin_and_owner" | "all_developers";
  delete: "owner_only";
  invite: "owner_and_admin";
  view_logs: "all_members";
}
```

### 3.2 Account Schema (Multi-tenant)

```typescript
interface Account {
  // Identity
  account_id: string;               // "acc-001"
  account_name: string;             // "Acme Corp"
  account_type: "personal" | "team" | "enterprise";

  // Owner
  owner_user_id: string;
  owner_email: string;

  // Status
  status: "active" | "suspended" | "trial" | "cancelled";
  created_at: string;
  trial_ends_at?: string;

  // Billing
  billing: {
    plan: "free" | "pro" | "enterprise";
    seats: number;
    usage: {
      projects: number;             // Current project count
      storage_gb: number;           // Total storage used
      compute_hours: number;        // Lambda execution hours
      bandwidth_gb: number;         // CloudFront bandwidth
    };
    limits: {
      max_projects: number;
      max_storage_gb: number;
      max_team_members: number;
    };
  };

  // Projects
  projects: string[];               // Project IDs

  // Settings
  settings: {
    default_region: string;
    auto_backup: boolean;
    retention_days: number;
    notification_channels: string[];
  };

  // Security
  security: {
    mfa_enabled: boolean;
    ip_whitelist?: string[];
    sso_enabled: boolean;
    audit_log_enabled: boolean;
  };
}
```

### 3.3 Task Schema (Extended for Multi-Project)

```typescript
interface Task {
  // Existing fields...
  task_id: string;
  status: string;
  priority: string;

  // NEW: Project association
  project_id: string;               // Which project this task belongs to
  environment?: "dev" | "staging" | "prod";

  // NEW: Multi-tenant support
  account_id: string;               // Which account owns this task

  // NEW: Resource isolation
  isolation: {
    namespace: string;              // "miyabi-webui-prod"
    resource_prefix: string;        // For AWS resource naming
    log_group: string;              // Separate CloudWatch log group
  };
}
```

---

## 4. リソース隔離戦略

### 4.1 AWS リソース命名

**原則**: プロジェクトごとに独立したリソース名を付与

```bash
# S3 Buckets
{project-id}-{env}-{resource-type}-{account-id}

例:
miyabi-webui-prod-bucket-112530848482
miyabi-mobile-dev-bucket-112530848482
miyabi-api-staging-bucket-112530848482

# CloudFront Distributions
{project-id}-{env}-cdn

例:
miyabi-webui-prod-cdn
miyabi-mobile-dev-cdn

# Lambda Functions
{project-id}-{env}-{function-name}

例:
miyabi-webui-prod-api-handler
miyabi-mobile-dev-auth-handler

# DynamoDB Tables
{project-id}-{env}-{table-name}

例:
miyabi-webui-prod-tasks
miyabi-mobile-dev-users
```

### 4.2 IAM ポリシー (Least Privilege)

**プロジェクトごとに独立したIAM Role**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::miyabi-webui-prod-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:us-west-2:112530848482:function:miyabi-webui-prod-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-2:112530848482:table/miyabi-webui-prod-*"
      ]
    }
  ]
}
```

### 4.3 ネットワーク隔離 (Optional)

**VPC分離** (エンタープライズプラン):
```
Project A → VPC A (10.0.0.0/16)
Project B → VPC B (10.1.0.0/16)
Project C → VPC C (10.2.0.0/16)
```

**Security Group分離**:
```
sg-miyabi-webui-prod    → Project A resources only
sg-miyabi-mobile-dev    → Project B resources only
```

---

## 5. データベース設計

### 5.1 DynamoDB テーブル構造

**Table 1: Projects**

```
PK: ACCOUNT#{account_id}
SK: PROJECT#{project_id}

Attributes:
- project_name
- status
- owner_id
- created_at
- resources (map)
- metrics (map)

GSI1:
- GSI1PK: PROJECT#{project_id}
- GSI1SK: ACCOUNT#{account_id}
→ Allows querying by project_id across accounts
```

**Table 2: Tasks**

```
PK: PROJECT#{project_id}
SK: TASK#{task_id}

Attributes:
- task_name
- status
- priority
- created_at
- execution (map)

GSI1:
- GSI1PK: ACCOUNT#{account_id}
- GSI1SK: CREATED_AT#{timestamp}
→ Allows querying all tasks for an account
```

**Table 3: Accounts**

```
PK: ACCOUNT#{account_id}
SK: METADATA

Attributes:
- account_name
- owner_user_id
- billing (map)
- settings (map)
- security (map)
```

### 5.2 クエリパターン

```typescript
// 1. Get all projects for an account
QueryInput = {
  TableName: "Projects",
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "ACCOUNT#acc-001"
  }
}

// 2. Get project details
GetItemInput = {
  TableName: "Projects",
  Key: {
    PK: "ACCOUNT#acc-001",
    SK: "PROJECT#miyabi-webui"
  }
}

// 3. Get all tasks for a project
QueryInput = {
  TableName: "Tasks",
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "PROJECT#miyabi-webui"
  }
}

// 4. Get tasks across all projects for an account
QueryInput = {
  TableName: "Tasks",
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "ACCOUNT#acc-001"
  }
}
```

---

## 6. API設計

### 6.1 RESTful API Endpoints

**Account Management**:
```
POST   /api/accounts                    # Create account
GET    /api/accounts/:account_id        # Get account details
PATCH  /api/accounts/:account_id        # Update account
DELETE /api/accounts/:account_id        # Delete account

GET    /api/accounts/:account_id/usage  # Get usage metrics
```

**Project Management**:
```
POST   /api/projects                    # Create project
GET    /api/projects                    # List all projects
GET    /api/projects/:project_id        # Get project details
PATCH  /api/projects/:project_id        # Update project
DELETE /api/projects/:project_id        # Delete project

GET    /api/projects/:project_id/tasks  # Get project tasks
GET    /api/projects/:project_id/metrics # Get project metrics
```

**Task Management** (Project-scoped):
```
POST   /api/projects/:project_id/tasks          # Create task
GET    /api/projects/:project_id/tasks          # List tasks
GET    /api/projects/:project_id/tasks/:task_id # Get task details
PATCH  /api/projects/:project_id/tasks/:task_id # Update task
```

**Progress Monitoring**:
```
GET    /api/progress                            # Get all progress
GET    /api/projects/:project_id/progress       # Get project progress
GET    /api/accounts/:account_id/progress       # Get account progress
```

### 6.2 認証・認可

**JWT Token Payload**:
```json
{
  "user_id": "user-001",
  "account_id": "acc-001",
  "role": "admin",
  "projects": ["miyabi-webui", "miyabi-mobile"],
  "permissions": ["projects:read", "projects:write", "tasks:create"],
  "exp": 1763220000
}
```

**Authorization Check**:
```typescript
function canAccessProject(user: User, project_id: string): boolean {
  // Check if user belongs to the account that owns the project
  const project = getProject(project_id);
  return user.account_id === project.account_id;
}

function canDeployProject(user: User, project_id: string): boolean {
  const project = getProject(project_id);
  const member = project.team.members.find(m => m.user_id === user.user_id);

  if (!member) return false;

  const permissions = project.team.permissions.deploy;
  switch (permissions) {
    case "owner_only":
      return member.role === "owner";
    case "admin_and_owner":
      return ["owner", "admin"].includes(member.role);
    case "all_developers":
      return ["owner", "admin", "developer"].includes(member.role);
    default:
      return false;
  }
}
```

---

## 7. デプロイメント戦略

### 7.1 CDK Stack構造

```
cdk-app/
├── bin/
│   └── app.ts                        # CDK App entry point
├── lib/
│   ├── shared/
│   │   ├── account-stack.ts          # Account management
│   │   ├── auth-stack.ts             # Cognito, API Gateway
│   │   └── monitoring-stack.ts       # CloudWatch, EventBridge
│   │
│   └── projects/
│       ├── webui-stack.ts            # Miyabi WebUI project
│       ├── mobile-stack.ts           # Miyabi Mobile project
│       └── api-stack.ts              # Miyabi API project
└── cdk.json
```

**app.ts**:
```typescript
import * as cdk from 'aws-cdk-lib';
import { AccountStack } from '../lib/shared/account-stack';
import { WebUIStack } from '../lib/projects/webui-stack';
import { MobileStack } from '../lib/projects/mobile-stack';

const app = new cdk.App();

// Shared infrastructure
const accountStack = new AccountStack(app, 'MiyabiAccountStack', {
  env: { account: '112530848482', region: 'us-west-2' }
});

// Project stacks
new WebUIStack(app, 'MiyabiWebUIStack', {
  projectId: 'miyabi-webui',
  environment: 'prod',
  accountStack: accountStack,
  env: { account: '112530848482', region: 'us-west-2' }
});

new MobileStack(app, 'MiyabiMobileStack', {
  projectId: 'miyabi-mobile',
  environment: 'prod',
  accountStack: accountStack,
  env: { account: '112530848482', region: 'us-west-2' }
});

app.synth();
```

### 7.2 デプロイ順序

```bash
# 1. Shared infrastructure (once)
cdk deploy MiyabiAccountStack

# 2. Individual projects (independent)
cdk deploy MiyabiWebUIStack
cdk deploy MiyabiMobileStack
cdk deploy MiyabiAPIStack

# 3. Update all projects
cdk deploy --all
```

---

## 8. モニタリング・ログ

### 8.1 CloudWatch Log Groups

```
/miyabi/account/{account_id}/audit        # Account-level audit logs
/miyabi/project/{project_id}/application  # Application logs
/miyabi/project/{project_id}/access       # Access logs
/miyabi/project/{project_id}/errors       # Error logs
```

### 8.2 メトリクス

**Account-level Metrics**:
- `miyabi.account.projects.count`
- `miyabi.account.storage.used_gb`
- `miyabi.account.compute.hours`
- `miyabi.account.bandwidth.used_gb`

**Project-level Metrics**:
- `miyabi.project.tasks.total`
- `miyabi.project.tasks.completed`
- `miyabi.project.tasks.failed`
- `miyabi.project.deployments.count`
- `miyabi.project.api.requests`
- `miyabi.project.api.latency_ms`

### 8.3 アラート

```yaml
alerts:
  - name: ProjectResourceLimitReached
    condition: project.storage.used_gb > project.limits.storage_gb * 0.9
    action: notify_owner

  - name: AccountBillingLimitExceeded
    condition: account.billing.current_month > account.billing.limit
    action: suspend_account

  - name: ProjectDeploymentFailed
    condition: project.deployment.status == "failed"
    action: notify_team
```

---

## 9. セキュリティ

### 9.1 データ暗号化

- **At Rest**: S3 (SSE-S3), DynamoDB (AWS-managed keys)
- **In Transit**: HTTPS/TLS 1.2+
- **Secrets**: AWS Secrets Manager (per-project rotation)

### 9.2 アクセス制御

```
Layer 1: Account-level isolation
         → Users can only access their own account

Layer 2: Project-level RBAC
         → owner / admin / developer / viewer roles

Layer 3: Resource-level IAM policies
         → Least privilege per project

Layer 4: Network-level security groups (optional)
         → VPC isolation for sensitive projects
```

### 9.3 監査ログ

**記録対象**:
- Account creation/deletion
- Project creation/deletion
- User invitation/removal
- Deployment execution
- Configuration changes
- API access (who, what, when)

**保持期間**:
- Free plan: 7 days
- Pro plan: 90 days
- Enterprise plan: 365 days + export

---

## 10. スケーラビリティ

### 10.1 水平スケーリング

**Auto Scaling設定**:
```typescript
const webUILambda = new lambda.Function(this, 'WebUILambda', {
  // ...
  reservedConcurrentExecutions: 10, // Per-project limit
  autoScaling: {
    minCapacity: 1,
    maxCapacity: 100,
    targetValue: 70, // CPU utilization %
  }
});

const apiGateway = new apigateway.RestApi(this, 'API', {
  // ...
  deployOptions: {
    throttlingRateLimit: 1000,    // requests/second
    throttlingBurstLimit: 2000,
  }
});
```

### 10.2 コスト最適化

**リソース共有**:
- CloudWatch Log Groups: プロジェクトごとに分離だが、同一アカウント内で集約
- Secrets Manager: プロジェクトごとにシークレット分離、定期ローテーション

**リソース自動削除**:
```typescript
const bucket = new s3.Bucket(this, 'Bucket', {
  // ...
  lifecycleRules: [
    {
      id: 'DeleteOldLogs',
      prefix: 'logs/',
      expiration: cdk.Duration.days(30),
    },
    {
      id: 'TransitionToIA',
      prefix: 'archives/',
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        }
      ]
    }
  ]
});
```

---

## 11. 実装ロードマップ

### Phase 1: Foundation (Week 1)
- ✅ Project data model設計
- ✅ Progress monitoring system
- ⏳ DynamoDB table作成
- ⏳ Account management API

### Phase 2: Multi-Project Core (Week 2)
- ⏳ Project CRUD API
- ⏳ Project-scoped task API
- ⏳ Resource isolation (S3, Lambda)
- ⏳ WebUI: Project switcher

### Phase 3: Authentication & Authorization (Week 3)
- ⏳ Cognito integration
- ⏳ JWT token management
- ⏳ RBAC implementation
- ⏳ WebUI: Login/Logout

### Phase 4: Advanced Features (Week 4)
- ⏳ Multi-environment support (dev/staging/prod)
- ⏳ Team collaboration
- ⏳ Billing & usage tracking
- ⏳ Audit logs

### Phase 5: Scale & Optimize (Week 5+)
- ⏳ Auto-scaling configuration
- ⏳ Cost optimization
- ⏳ Performance monitoring
- ⏳ Enterprise features (VPC, SSO)

---

## 12. 使用例

### 12.1 個人開発者のケース

**Scenario**: Freelancer が3つの副業プロジェクトを並行運用

```
Account: personal-acc-001

Projects:
1. miyabi-webui (クライアントA向けWebアプリ)
   - prod: https://d3ev2zsrbkwq8v.cloudfront.net
   - dev: localhost:3000

2. miyabi-mobile (クライアントB向けモバイルアプリ)
   - prod: https://app.client-b.com
   - dev: localhost:8080

3. miyabi-api (自社SaaS API)
   - prod: https://api.mysaas.com
   - dev: localhost:4000
```

**利点**:
- 各プロジェクトが独立して管理される
- リソース干渉なし
- 1つのダッシュボードで全体把握

### 12.2 チーム開発のケース

**Scenario**: スタートアップが5人チームで2つのプロダクトを開発

```
Account: startup-acc-002

Projects:
1. main-product (メインプロダクト)
   - Team: 全員 (5人)
   - Environments: dev, staging, prod

2. side-project (実験的プロジェクト)
   - Team: 2人
   - Environment: dev only

Members:
- alice (owner): main-product, side-project
- bob (admin): main-product
- charlie (developer): main-project
- dave (developer): side-project
- eve (viewer): main-product
```

**利点**:
- プロジェクトごとに異なるメンバー構成
- RBAC で権限管理
- チーム全体の進捗を可視化

---

## 13. まとめ

### 13.1 実装済み機能

✅ **Progress Monitoring System**
- バックグラウンドタスクの進捗収集
- WebUIへのリアルタイム表示
- プロジェクト一覧表示

✅ **Project Data Model**
- 包括的なProjectスキーマ設計
- Account, Task, Environment モデル
- DynamoDB設計

✅ **Documentation**
- 完全なアーキテクチャ設計書
- API設計
- セキュリティ設計

### 13.2 次のステップ

1. **DynamoDB Table作成** (30分)
   - Projects table
   - Tasks table
   - Accounts table

2. **Project Management API実装** (2時間)
   - CRUD endpoints
   - Authentication integration
   - Authorization checks

3. **WebUI拡張** (1.5時間)
   - Project switcher
   - Project creation UI
   - Project settings page

4. **Multi-project CDK Stack** (2時間)
   - Shared infrastructure stack
   - Per-project stacks
   - Deployment automation

### 13.3 期待される効果

1. **開発効率向上**
   - 複数プロジェクトを同一基盤で管理
   - リソース再利用
   - デプロイ自動化

2. **コスト最適化**
   - リソース共有による削減
   - 自動スケーリング
   - 使用量ベース課金

3. **セキュリティ強化**
   - プロジェクト隔離
   - RBAC
   - 監査ログ

4. **スケーラビリティ**
   - 100+ projects対応
   - マルチテナント
   - エンタープライズ対応可能

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Multi-Project Management Architecture
**Status**: ✅ Design Complete → ⏳ Implementation Ready

🌸 **"1つのプラットフォーム、無限のプロジェクト"** 🌸
