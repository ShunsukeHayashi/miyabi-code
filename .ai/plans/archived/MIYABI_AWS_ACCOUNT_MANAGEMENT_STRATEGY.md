# Miyabi AWS Platform - Account Management & Governance Strategy

**Project**: Miyabi AWS Platform
**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: Account Management Design Document

---

## 🎯 Overview

このドキュメントでは、Miyabi AWS Platformを**スケーラブルに管理**するためのアカウント戦略を説明します。

**重要な質問**:
- どうやってアカウントを増やしていくか？
- 権限管理をどうスケールさせるか？
- コストをどう追跡・配分するか？
- セキュリティをどう保つか？

---

## 📊 Account Growth Scenarios - アカウント成長シナリオ

### Phase 1: Launch (4 accounts)
```
Management Account (Root)
├── Security Account
├── Production Account
└── Development Account

Total: 4 accounts
管理難易度: ★☆☆☆☆ (Easy)
```

### Phase 2: Growth (10-20 accounts)
```
Management Account (Root)
├── Security Account
├── Production Account
├── Staging Account
├── Development Account
├── Customer-1 Account (Sandbox)
├── Customer-2 Account (Sandbox)
├── CI/CD Account
├── Logging Account
└── Backup Account

Total: 10+ accounts
管理難易度: ★★★☆☆ (Medium)
```

### Phase 3: Scale (50-100 accounts)
```
Management Account (Root)
├── Core OU
│   ├── Security Account
│   ├── Logging Account
│   ├── Backup Account
│   └── CI/CD Account
├── Production OU
│   ├── Production-US Account
│   ├── Production-EU Account
│   └── Production-AP Account
├── Development OU
│   ├── Dev-Team-A Account
│   ├── Dev-Team-B Account
│   └── Staging Account
└── Customer OU (Multi-tenant)
    ├── Customer-A Account
    ├── Customer-B Account
    └── ... (50+ customers)

Total: 50-100 accounts
管理難易度: ★★★★☆ (Hard)
```

### Phase 4: Hyper-scale (1000+ accounts)
```
Management Account (Root)
├── Core OU (10 accounts)
├── Production OU (20 accounts, multi-region)
├── Development OU (30 accounts, per team)
└── Customer OU (1000+ accounts)
    ├── Customer-0001 to Customer-0100
    ├── Customer-0101 to Customer-0200
    └── ... (1000+ customers)

Total: 1000+ accounts
管理難易度: ★★★★★ (Extreme)

→ 手動管理は不可能！完全自動化が必須
```

---

## 🏗️ Account Architecture Strategy - 3つの戦略

### Strategy 1: Single Shared Account (Phase 1)

**構造**:
```
1 Production Account
└── すべての顧客が共有
    ├── Customer A: DynamoDB items tagged "customer=A"
    ├── Customer B: DynamoDB items tagged "customer=B"
    └── Customer C: DynamoDB items tagged "customer=C"
```

**メリット**:
- ✅ シンプル（アカウント管理不要）
- ✅ コスト効率（リソース共有）
- ✅ 運用が楽

**デメリット**:
- ❌ セキュリティリスク（データ分離が甘い）
- ❌ Noisy neighbor問題（1顧客の負荷が他に影響）
- ❌ コンプライアンス対応困難（GDPR, SOC2等）
- ❌ 顧客別コスト計算が複雑

**適用場面**: Launch phase, MVP検証

---

### Strategy 2: Silo Model (Account per Customer)

**構造**:
```
Customer OU
├── Customer-A Account (完全分離)
│   ├── VPC
│   ├── ECS Cluster
│   ├── DynamoDB
│   └── RDS
├── Customer-B Account (完全分離)
│   └── (同様)
└── Customer-C Account (完全分離)
    └── (同様)
```

**メリット**:
- ✅ 完全データ分離（最高のセキュリティ）
- ✅ コスト計算が明確（アカウント単位）
- ✅ 顧客ごとの設定カスタマイズ可能
- ✅ Blast radius限定（1顧客の障害が他に影響しない）
- ✅ コンプライアンス対応容易

**デメリット**:
- ❌ アカウント数爆発（顧客数 = アカウント数）
- ❌ コストが高い（リソースを共有できない）
- ❌ 運用が複雑（1000個のアカウントを管理）

**適用場面**: Enterprise顧客、高セキュリティ要件

**コスト比較**:
```
10 Customers (Shared):
  - 1 Account × $500/month = $500/month total

10 Customers (Silo):
  - 10 Accounts × $200/month = $2,000/month total
  - 4× more expensive!
```

---

### Strategy 3: Pool Model (ベストプラクティス) ⭐

**構造**:
```
Production OU
├── Pool-1 Account (Customers 1-100)
│   ├── VPC (共有)
│   ├── ECS Cluster (共有)
│   ├── DynamoDB (論理分離)
│   └── RDS (論理分離)
├── Pool-2 Account (Customers 101-200)
│   └── (同様)
└── Pool-3 Account (Customers 201-300)
    └── (同様)

+ VIP OU (高額顧客は専用アカウント)
  ├── Customer-Enterprise-A (Silo)
  └── Customer-Enterprise-B (Silo)
```

**メリット**:
- ✅ コスト効率（リソース共有）× セキュリティ（アカウント分離）
- ✅ 段階的スケール（100顧客ごとに新アカウント）
- ✅ Blast radius制御（1 Pool障害 = 100顧客まで）
- ✅ 運用管理可能（1000顧客 = 10-20 Pool accounts）

**デメリット**:
- ⚠️ 複雑（Shared vs Silo のハイブリッド）
- ⚠️ Pool設計が重要（どう分割するか）

**適用場面**: **Growth phase以降の推奨戦略**

**コスト比較**:
```
1000 Customers:

Shared (1 account):
  - Cost: $1,000/month
  - Risk: High (single point of failure)

Silo (1000 accounts):
  - Cost: $200,000/month (200× !)
  - Management: Impossible

Pool (10 accounts, 100 customers each):
  - Cost: $10,000/month (10×, reasonable)
  - Management: Feasible
  - Risk: Medium (blast radius: 100 customers)
```

---

## 🔐 Identity & Access Management (IAM) Strategy

### Problem: 権限管理のスケーラビリティ

**悪い例（手動管理）**:
```
Account 1: 手動でIAM user作成
Account 2: 手動でIAM user作成（パスワード違う...）
Account 3: 手動でIAM user作成（権限設定ミス...）
...
Account 100: もう無理！管理不可能！
```

**良い例（AWS IAM Identity Center）**:
```
IAM Identity Center (1箇所)
  └── すべてのアカウントに統一的にアクセス

Users:
  - alice@miyabi.io → Permission Set: Admin
  - bob@miyabi.io → Permission Set: Developer
  - charlie@miyabi.io → Permission Set: ReadOnly

Accounts:
  - すべてのアカウントに同じPermission Setが適用される
  - ユーザー追加は1回だけ
```

---

### AWS IAM Identity Center (旧 AWS SSO) セットアップ

**1. Identity Centerの有効化**:
```bash
# Management accountで実行
aws sso-admin create-instance \
  --instance-name "Miyabi-SSO"
```

**2. Permission Sets定義**:

```yaml
# permission-sets/admin.yaml
Name: MiyabiAdministratorAccess
Description: Full admin access to all accounts
ManagedPolicies:
  - arn:aws:iam::aws:policy/AdministratorAccess
SessionDuration: PT8H  # 8 hours
```

```yaml
# permission-sets/developer.yaml
Name: MiyabiDeveloperAccess
Description: Developer access (read/write for dev resources)
ManagedPolicies:
  - arn:aws:iam::aws:policy/PowerUserAccess
InlinePolicies:
  DenyDangerous:
    Version: "2012-10-17"
    Statement:
      - Effect: Deny
        Action:
          - iam:*
          - organizations:*
          - account:*
        Resource: "*"
SessionDuration: PT12H  # 12 hours
```

```yaml
# permission-sets/readonly.yaml
Name: MiyabiReadOnlyAccess
Description: Read-only access for auditors
ManagedPolicies:
  - arn:aws:iam::aws:policy/ReadOnlyAccess
SessionDuration: PT4H  # 4 hours
```

**3. アカウントへの割り当て**:

```bash
# すべてのProduction accountsにAdminを割り当て
for account_id in $(aws organizations list-accounts --query 'Accounts[?Name==`Production-*`].Id' --output text); do
  aws sso-admin create-account-assignment \
    --instance-arn $SSO_INSTANCE_ARN \
    --permission-set-arn $ADMIN_PERMISSION_SET_ARN \
    --principal-type GROUP \
    --principal-id $ADMIN_GROUP_ID \
    --target-type AWS_ACCOUNT \
    --target-id $account_id
done
```

**4. ユーザーアクセス**:
```bash
# ユーザーはブラウザで1箇所にログイン
https://miyabi.awsapps.com/start

# 全アカウントが一覧表示
Production-US (123456789012)
  ├─ MiyabiAdministratorAccess
  └─ MiyabiDeveloperAccess

Production-EU (234567890123)
  ├─ MiyabiAdministratorAccess
  └─ MiyabiDeveloperAccess

# クリックだけでアカウント切り替え
# 認証情報の再入力不要！
```

**スケーラビリティ**:
```
Traditional IAM Users:
  - 100 accounts × 10 users = 1000 IAM users
  - パスワード管理: 1000個
  - 権限更新: 1000箇所

IAM Identity Center:
  - 1 Identity Center × 10 users = 10 users
  - パスワード管理: 10個（または SAML SSO で0個）
  - 権限更新: 1箇所
  - 100× scalable!
```

---

## 🏛️ AWS Organizations - Organizational Units (OU) Design

### OU Hierarchy (階層設計)

**推奨構造**:

```
Root
├── Security OU
│   ├── Security-Hub Account
│   ├── GuardDuty-Master Account
│   └── CloudTrail-Logs Account
│
├── Infrastructure OU
│   ├── Network-Hub Account (Transit Gateway)
│   ├── DNS-Hub Account (Route 53 Resolver)
│   └── Shared-Services Account (AD, SSM, etc)
│
├── Production OU
│   ├── Prod-US-East-1 Account
│   ├── Prod-US-West-2 Account
│   ├── Prod-EU-West-1 Account
│   └── Prod-AP-Northeast-1 Account
│
├── Non-Production OU
│   ├── Staging OU
│   │   ├── Staging-US Account
│   │   └── Staging-EU Account
│   ├── Development OU
│   │   ├── Dev-Team-A Account
│   │   ├── Dev-Team-B Account
│   │   └── Dev-Team-C Account
│   └── Sandbox OU
│       ├── Sandbox-User-1 Account
│       └── Sandbox-User-2 Account
│
└── Workload OU (Customer Pools)
    ├── Pool-1 Account (Customers 1-100)
    ├── Pool-2 Account (Customers 101-200)
    ├── Pool-3 Account (Customers 201-300)
    └── VIP OU
        ├── Customer-Enterprise-A Account
        └── Customer-Enterprise-B Account
```

**OU設計の原則**:
1. **Environment separation**: Prod vs Non-Prod
2. **Function separation**: Security, Infrastructure, Workload
3. **Tenant separation**: Shared Pools vs VIP Silos
4. **Region separation**: Multi-region strategy

---

### Service Control Policies (SCP) - ガードレール

**SCP = OU単位で適用する権限制限**

**例1: Production OUの制限**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringNotEquals": {
          "ec2:InstanceType": [
            "t3.micro",
            "t3.small",
            "t3.medium",
            "c5.large",
            "c5.xlarge"
          ]
        }
      }
    }
  ]
}
```
→ **Productionでは承認済みインスタンスタイプのみ使用可能**

**例2: Sandbox OUの制限**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances"
      ],
      "Resource": "arn:aws:ec2:*:*:instance/*",
      "Condition": {
        "StringNotEquals": {
          "ec2:InstanceType": [
            "t3.micro",
            "t3.small"
          ]
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": [
        "rds:CreateDBInstance"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "rds:DatabaseEngine": "postgres",
          "rds:DatabaseClass": [
            "db.t3.micro",
            "db.t3.small"
          ]
        }
      }
    }
  ]
}
```
→ **Sandboxでは小さいインスタンスのみ（コスト制御）**

**例3: リージョン制限**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "NotAction": [
        "iam:*",
        "organizations:*",
        "cloudfront:*",
        "route53:*",
        "support:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "us-east-1",
            "us-west-2",
            "eu-west-1",
            "ap-northeast-1"
          ]
        }
      }
    }
  ]
}
```
→ **許可されたリージョンのみ使用可能（コスト制御、コンプライアンス）**

---

## 💰 Cost Management & Allocation - コスト管理

### Problem: 誰がいくら使ってるか分からない

**悪い例（Single Account）**:
```
Production Account: $10,000/month

Customer A: ??? (分からない)
Customer B: ??? (分からない)
Customer C: ??? (分からない)
```

### Solution 1: Tag-based Cost Allocation

**タグ戦略**:
```yaml
Required Tags (必須):
  - CostCenter: "customer-id" または "pool-id"
  - Environment: "prod" | "staging" | "dev"
  - Application: "miyabi-platform"
  - Owner: "team-name"

Optional Tags (推奨):
  - Project: "project-name"
  - Compliance: "pci-dss" | "hipaa" | "gdpr"
```

**自動タグ付け（CDK）**:
```typescript
import { Tags } from 'aws-cdk-lib';

export class MiyabiStack extends Stack {
  constructor(scope: Construct, id: string, props: MiyabiStackProps) {
    super(scope, id, props);

    // Stack全体にタグ適用
    Tags.of(this).add('CostCenter', props.customerId);
    Tags.of(this).add('Environment', props.environment);
    Tags.of(this).add('Application', 'miyabi-platform');
    Tags.of(this).add('Owner', props.teamName);

    // リソース作成
    const cluster = new Cluster(this, 'Cluster', { vpc });
    // 自動的に上記タグが適用される
  }
}
```

**Cost Explorer でのフィルタリング**:
```bash
# Customer A のコストを取得
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --filter file://filter.json

# filter.json
{
  "Tags": {
    "Key": "CostCenter",
    "Values": ["customer-a"]
  }
}
```

**結果**:
```json
{
  "ResultsByTime": [
    {
      "TimePeriod": {
        "Start": "2025-11-01",
        "End": "2025-11-30"
      },
      "Total": {
        "UnblendedCost": {
          "Amount": "1234.56",
          "Unit": "USD"
        }
      }
    }
  ]
}
```

---

### Solution 2: Account-based Cost Allocation

**Pool Accountの場合**:
```
Pool-1 Account (Customers 1-100): $5,000/month

→ DynamoDB の ItemCount per customer でコスト按分

Customer 1: 10,000 items → $50 (1%)
Customer 2: 50,000 items → $250 (5%)
Customer 3: 200,000 items → $1,000 (20%)
...
```

**自動コスト配分スクリプト（月次バッチ）**:
```python
import boto3

ce_client = boto3.client('ce')
dynamo_client = boto3.client('dynamodb')

def allocate_costs(pool_account_id, month):
    # 1. Pool全体のコスト取得
    total_cost = get_account_cost(pool_account_id, month)

    # 2. 顧客ごとのリソース使用量取得
    customer_usage = {}
    for customer_id in get_customers(pool_account_id):
        items = count_dynamodb_items(customer_id)
        requests = count_api_requests(customer_id)
        customer_usage[customer_id] = items + requests

    # 3. 按分計算
    total_usage = sum(customer_usage.values())
    for customer_id, usage in customer_usage.items():
        allocated_cost = total_cost * (usage / total_usage)
        save_customer_cost(customer_id, month, allocated_cost)
```

---

### Solution 3: AWS Cost & Usage Reports (CUR) + Athena

**最強のコスト分析基盤**:

```
Step 1: CUR有効化
  └─ S3 bucket: s3://miyabi-billing-data/

Step 2: Athena Tableセットアップ
  └─ AWS Glue Crawler で自動テーブル作成

Step 3: SQL クエリ
```

**クエリ例**:
```sql
-- Customer別コスト（過去30日）
SELECT
  resource_tags_user_cost_center AS customer_id,
  SUM(line_item_unblended_cost) AS total_cost
FROM
  cur_table
WHERE
  line_item_usage_start_date >= DATE_ADD('day', -30, CURRENT_DATE)
GROUP BY
  resource_tags_user_cost_center
ORDER BY
  total_cost DESC;

-- 結果:
-- customer-a | 1234.56
-- customer-b | 987.65
-- customer-c | 543.21
```

**ダッシュボード化（QuickSight）**:
```
QuickSight Dashboard:
  - 顧客別コストトレンド（折れ線グラフ）
  - サービス別コスト内訳（円グラフ）
  - Top 10 高額顧客（棒グラフ）
  - コストアラート（閾値超過）
```

---

## 🤖 Account Automation - アカウント作成自動化

### Problem: 新規顧客のたびに手動アカウント作成？

**手動フロー（悪い例）**:
```
1. AWS Consoleにログイン
2. Organizations → Create Account
3. 名前、メールアドレス入力
4. 15分待つ
5. IAM Role作成
6. VPC作成
7. タグ設定
8. SCP適用
9. CloudTrail有効化
10. Config有効化
... (50ステップ)

時間: 2-3時間/account
エラー率: 高い（手順忘れ）
```

### Solution: AWS Control Tower + Account Factory

**自動フロー**:
```
1. APIコール1回
2. すべて自動（15分で完了）
```

**Service Catalog による Account Factory**:

```typescript
// CDK: Account Factory Product定義
export class AccountFactoryProduct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new CfnCloudFormationProduct(this, 'AccountProduct', {
      name: 'Miyabi Customer Account',
      owner: 'Platform Team',
      productType: 'CLOUD_FORMATION_TEMPLATE',
      provisioningArtifactParameters: [{
        info: {
          LoadTemplateFromURL: 'https://s3.../account-template.yaml'
        }
      }]
    });
  }
}
```

**Account Template (account-template.yaml)**:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Miyabi Customer Account

Parameters:
  AccountName:
    Type: String
    Description: Account name (e.g., Customer-A)
  AccountEmail:
    Type: String
    Description: Root email (e.g., aws+customer-a@miyabi.io)
  PoolId:
    Type: String
    Description: Pool ID (e.g., pool-1)

Resources:
  Account:
    Type: AWS::Organizations::Account
    Properties:
      AccountName: !Ref AccountName
      Email: !Ref AccountEmail
      Tags:
        - Key: CostCenter
          Value: !Ref AccountName
        - Key: PoolId
          Value: !Ref PoolId

  # VPC自動作成
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${AccountName}-vpc"

  # CloudTrail自動有効化
  Trail:
    Type: AWS::CloudTrail::Trail
    Properties:
      S3BucketName: !ImportValue SecurityLoggingBucket
      IsLogging: true
      IsMultiRegionTrail: true

  # Config自動有効化
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RecordingGroup:
        AllSupported: true
      RoleArn: !ImportValue ConfigRoleArn

Outputs:
  AccountId:
    Value: !Ref Account
  VpcId:
    Value: !Ref VPC
```

**API経由でアカウント作成**:
```python
import boto3

sc_client = boto3.client('servicecatalog')

def create_customer_account(customer_name, customer_email):
    response = sc_client.provision_product(
        ProductId='prod-xxxxx',  # Account Factory Product ID
        ProvisioningArtifactId='pa-xxxxx',
        ProvisionedProductName=f'Account-{customer_name}',
        ProvisioningParameters=[
            {'Key': 'AccountName', 'Value': customer_name},
            {'Key': 'AccountEmail', 'Value': customer_email},
            {'Key': 'PoolId', 'Value': 'pool-1'}
        ]
    )

    print(f"Account creation started: {response['RecordDetail']['RecordId']}")
    return response

# 使用例
create_customer_account('Customer-A', 'aws+customer-a@miyabi.io')

# 15分後、完全セットアップされたアカウントが完成
```

**スケーラビリティ**:
```
Manual:
  - 1 account: 2-3 hours
  - 10 accounts: 20-30 hours (full-time job)
  - 100 accounts: Impossible

Automated (Account Factory):
  - 1 account: 15 minutes (unattended)
  - 10 accounts: 15 minutes (parallel)
  - 100 accounts: 15 minutes (parallel)
  - 1000 accounts: 可能！
```

---

## 🛡️ Security & Compliance at Scale

### AWS Control Tower - ガバナンス自動化

**Control Tower = アカウント管理の自動操縦**

**有効化**:
```bash
# Management accountで1回だけ
aws controltower enable-control-tower \
  --landing-zone-version 3.0 \
  --regions us-east-1,us-west-2,eu-west-1,ap-northeast-1
```

**自動で有効化されるもの**:
1. **Preventive Controls** (SCP)
   - 不正なリージョンへのデプロイ防止
   - Root ユーザーの使用を検知
   - MFA必須化

2. **Detective Controls** (AWS Config Rules)
   - 暗号化されていないS3バケット検知
   - Public IPのRDS検知
   - セキュリティグループの過度なオープン検知

3. **Logging & Monitoring**
   - CloudTrail（全アカウント、全リージョン）
   - AWS Config（全アカウント）
   - ログの中央集約（Log Archive Account）

**アカウント作成時の自動適用**:
```
新しいアカウント作成
  ↓
Control Tower が自動で:
  ✅ CloudTrail有効化
  ✅ Config有効化
  ✅ GuardDuty有効化
  ✅ Security Hub有効化
  ✅ SCPを適用
  ✅ ベースラインVPC作成
  ✅ ログをLog Archiveに転送
  ✅ SSO設定
  ↓
15分で完全コンプライアント
```

---

### AWS Config - コンプライアンス自動チェック

**Config Rules（自動評価）**:

```yaml
# config-rules/require-encryption.yaml
ConfigRuleName: s3-bucket-encryption-enabled
Source:
  Owner: AWS
  SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
Scope:
  ComplianceResourceTypes:
    - AWS::S3::Bucket

# すべてのS3バケットが暗号化されているかチェック
# 非準拠の場合 → アラート
```

**Conformance Pack（ルールセット）**:
```yaml
# conformance-packs/miyabi-security-baseline.yaml
ConformancePackName: MiyabiSecurityBaseline
TemplateBody: |
  Resources:
    # 20+ Config Rules
    EncryptedVolumes:
      Type: AWS::Config::ConfigRule
      Properties:
        ConfigRuleName: ec2-encrypted-volumes
        Source:
          Owner: AWS
          SourceIdentifier: ENCRYPTED_VOLUMES

    RdsEncryption:
      Type: AWS::Config::ConfigRule
      Properties:
        ConfigRuleName: rds-storage-encrypted
        Source:
          Owner: AWS
          SourceIdentifier: RDS_STORAGE_ENCRYPTED

    # ... 18 more rules
```

**自動修復（Remediation）**:
```yaml
# remediation/auto-fix-s3-encryption.yaml
ConfigRuleName: s3-bucket-encryption-enabled
TargetType: SSM_DOCUMENT
TargetIdentifier: AWS-EnableS3BucketEncryption
Parameters:
  BucketName:
    ResourceValue:
      Value: RESOURCE_ID
  SSEAlgorithm:
    StaticValue:
      Values:
        - AES256

# 非準拠のバケットを自動で暗号化有効化
```

---

## 📊 Multi-Tenant Architecture Patterns

### Pattern 1: Silo (1 account per tenant)

**実装**:
```python
def create_tenant(tenant_name):
    # 1. 専用アカウント作成
    account_id = create_account(f"Customer-{tenant_name}")

    # 2. インフラデプロイ（CDK）
    deploy_stack(account_id, 'MiyabiPlatformStack')

    # 3. データベース初期化
    init_database(account_id, tenant_name)

    # 4. DNS設定
    create_subdomain(f"{tenant_name}.miyabi.io", account_id)

    return {
        'account_id': account_id,
        'url': f"https://{tenant_name}.miyabi.io"
    }
```

**コスト**:
- **固定コスト**: $50/month/account (NAT Gateway, etc)
- **変動コスト**: Usage-based
- **Total**: $50 + usage

---

### Pattern 2: Pool (shared infrastructure)

**実装**:
```python
def create_tenant(tenant_name):
    # 1. Pool選択（負荷分散）
    pool_account = select_least_loaded_pool()

    # 2. DynamoDB にテナントレコード作成
    dynamodb.put_item(
        TableName='Tenants',
        Item={
            'tenant_id': tenant_name,
            'pool_id': pool_account.id,
            'created_at': datetime.now()
        }
    )

    # 3. データベーススキーマ初期化
    #    (論理分離: tenant_id カラムで分離)
    init_tenant_data(tenant_name)

    # 4. DNS設定（同じPool）
    create_subdomain(f"{tenant_name}.miyabi.io", pool_account.id)

    return {
        'pool_id': pool_account.id,
        'url': f"https://{tenant_name}.miyabi.io"
    }
```

**コスト**:
- **固定コスト**: $500/month/pool (100 tenants共有)
- **テナントあたり**: $5/month + usage
- **Total**: $5 + usage (10×安い)

---

### Pattern 3: Bridge (Silo + Pool hybrid)

**動的移行**:
```python
def migrate_tenant_to_silo(tenant_name):
    # 高額顧客が一定額超えたらSiloに移行

    # 1. 現在のPool情報取得
    tenant = get_tenant(tenant_name)
    current_pool = tenant['pool_id']

    # 2. 専用アカウント作成
    silo_account = create_account(f"Customer-{tenant_name}")

    # 3. データ移行（DynamoDB Export/Import）
    export_data(current_pool, tenant_name, 's3://migration/')
    import_data('s3://migration/', silo_account)

    # 4. DNS切り替え
    update_subdomain(f"{tenant_name}.miyabi.io", silo_account)

    # 5. 旧データ削除（猶予期間後）
    schedule_deletion(current_pool, tenant_name, days=30)

    print(f"Migrated {tenant_name} from Pool to Silo")
```

**適用場面**:
```
Small customers (0-$100/month):
  → Pool (コスト効率)

Medium customers ($100-$1000/month):
  → Pool (まだ共有で十分)

Large customers ($1000+/month):
  → Silo (専用アカウントに移行)
  → 理由: パフォーマンス、カスタマイズ、SLA保証
```

---

## 🎯 Scalability Roadmap

### Phase 1: Launch (1-10 customers)
```
Strategy: Single Shared Account
Accounts: 4 (Management, Security, Production, Development)
IAM: Manual user creation
Cost: ~$200/month
Management: Manual (feasible)
```

### Phase 2: Growth (10-100 customers)
```
Strategy: Pool Model (1 pool = 50 customers)
Accounts: 10 (Core 4 + 2 Pools + 4 VIP Silos)
IAM: AWS IAM Identity Center
Cost Allocation: Tag-based
Cost: ~$2,000/month
Management: Semi-automated (Account Factory)
```

### Phase 3: Scale (100-1000 customers)
```
Strategy: Pool Model (20 pools) + Silo (top 10%)
Accounts: 50 (Core 10 + 20 Pools + 20 VIP Silos)
IAM: IAM Identity Center + SAML SSO
Cost Allocation: CUR + Athena
Cost: ~$20,000/month
Management: Fully automated (Control Tower)
Monitoring: Centralized dashboard (CloudWatch Insights)
```

### Phase 4: Hyper-scale (1000+ customers)
```
Strategy: Pool Model (200 pools) + Silo (top 5%)
Accounts: 300 (Core 20 + 200 Pools + 80 VIP Silos)
IAM: IAM Identity Center + SAML SSO + MFA enforced
Cost Allocation: Real-time (Kinesis + Lambda)
Cost: ~$200,000/month
Management: 100% automated
Compliance: Automated audits (Control Tower + Config)
Team: 1 Platform Engineer (監視のみ)
```

---

## 💡 Key Takeaways

### アカウント管理のベストプラクティス

1. **Pool Model を採用** (Shared + Silo hybrid)
   - コスト効率 × セキュリティのバランス
   - 段階的スケール（100顧客/pool）

2. **IAM Identity Center 必須**
   - 統一認証（1箇所ログイン）
   - 100× scalable

3. **完全自動化**
   - Account Factory（15分でアカウント作成）
   - Control Tower（ガバナンス自動適用）

4. **タグ戦略**
   - CostCenter, Environment, Application, Owner
   - コスト配分の基礎

5. **OU設計**
   - Environment分離（Prod vs Non-Prod）
   - Function分離（Security, Infrastructure, Workload）

6. **SCP でガードレール**
   - Production: 承認済みリソースのみ
   - Sandbox: 小さいインスタンスのみ

7. **動的移行**
   - Small → Pool
   - Large → Silo
   - 柔軟にアーキテクチャ変更

---

## 📝 Summary

**スケーラビリティの鍵**:

```
1 customer    → 1 Shared Account
10 customers  → 1 Pool Account
100 customers → 2-3 Pool Accounts
1000 customers → 20 Pool Accounts + Automated management
```

**管理負荷**:
```
Manual: O(N)   (顧客数に比例)
Automated: O(1) (顧客数に関わらず一定)
```

**コスト効率**:
```
Shared: $5/customer/month
Pool: $10/customer/month
Silo: $50-200/customer/month
```

**推奨アプローチ**:
- Phase 1: Shared (MVP)
- Phase 2-3: Pool (成長期)
- Phase 4: Pool + Silo (大規模)

---

**Status**: ✅ Account Management Strategy Complete

**Next Steps**:
1. AWS Organizations セットアップ
2. IAM Identity Center 有効化
3. Account Factory 構築
4. Pool Account 1つ作成
5. 顧客10社でパイロット運用

**Maintained by**: Miyabi Platform Team
**Location**: `/Users/shunsuke/Dev/miyabi-private/.ai/plans/MIYABI_AWS_ACCOUNT_MANAGEMENT_STRATEGY.md`
**Version**: 1.0.0
**Last Updated**: 2025-11-12
