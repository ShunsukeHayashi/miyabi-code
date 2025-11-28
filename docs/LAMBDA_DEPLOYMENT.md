# 🚀 AWS Lambda + API Gateway デプロイガイド

**Issue**: #1169
**Last Updated**: 2025-11-27

## 概要

```
CloudFront → API Gateway (HTTP API) → Lambda (Rust) → RDS
                                           ↓
                                    VPC (Private Subnet)
```

## アーキテクチャ

| コンポーネント | 設定 |
|--------------|------|
| Runtime | provided.al2023 (Custom Runtime) |
| Architecture | arm64 (Graviton3) |
| Memory | 512MB |
| Timeout | 30s |
| VPC | miyabi-vpc (private subnets) |

## 前提条件

### 完了済み
- ✅ #1167 - AWS RDS PostgreSQL プロビジョニング
- ✅ #1168 - PostgreSQL マイグレーション実行 (13 migrations)
- ✅ #1171 - GitHub Secrets & CI/CD 環境変数設定

### 必要なツール
- Rust toolchain (stable)
- cargo-lambda
- Terraform >= 1.5.0
- AWS CLI v2

## セットアップ

### 1. cargo-lambda インストール

```bash
# Homebrew (macOS)
brew tap cargo-lambda/cargo-lambda
brew install cargo-lambda

# または Cargo
cargo install cargo-lambda
```

### 2. AWS認証設定

```bash
# AWS CLI設定
aws configure

# または環境変数
export AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
export AWS_SECRET_ACCESS_KEY=xxxxxxxx
export AWS_REGION=us-west-2
```

## ビルド

### 自動ビルド（推奨）

```bash
cd /path/to/miyabi-private
./scripts/build-lambda.sh          # arm64 (デフォルト)
./scripts/build-lambda.sh x86_64   # x86_64
```

### 手動ビルド

```bash
cd crates/miyabi-web-api

# arm64 (Graviton) - 推奨
cargo lambda build --release --arm64 --features lambda --bin lambda-api

# x86_64
cargo lambda build --release --features lambda --bin lambda-api
```

ビルド結果:
```
target/lambda/lambda-api/bootstrap
```

### パッケージング

```bash
mkdir -p dist/lambda
cp target/lambda/lambda-api/bootstrap dist/lambda/
cd dist/lambda
zip -j miyabi-api-arm64.zip bootstrap
```

## デプロイ

### Terraform変数設定

`infrastructure/terraform/environments/dev/terraform.tfvars`:

```hcl
# Lambda Configuration
lambda_zip_path = "../../../dist/lambda/miyabi-api-arm64.zip"

# Database (RDS endpoint from #1167)
database_url = "postgres://miyabi:PASSWORD@miyabi-dev.xxxxx.us-west-2.rds.amazonaws.com:5432/miyabi"

# JWT Secret
jwt_secret = "your-32-byte-base64-secret"

# Secrets Manager ARNs
secrets_arns = [
  "arn:aws:secretsmanager:us-west-2:112530848482:secret:miyabi/dev/database-XXXXXX"
]

# CORS
cors_origins = [
  "http://localhost:3000",
  "https://miyabi-society.com"
]
```

### Terraformデプロイ

```bash
cd infrastructure/terraform/environments/dev

# 初期化
terraform init

# プラン確認
terraform plan -var-file=terraform.tfvars

# デプロイ
terraform apply -var-file=terraform.tfvars
```

### デプロイ出力

```
Outputs:

api_gateway_endpoint = "https://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com"
lambda_function_name = "miyabi-api-dev"
cloudwatch_log_group = "/aws/lambda/miyabi-api-dev"
```

## 検証

### Health Check

```bash
# API Gateway経由
curl https://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com/api/v1/health

# 期待レスポンス
{
  "status": "healthy",
  "version": "0.1.2",
  "database": "connected",
  "timestamp": "2025-11-27T12:00:00Z"
}
```

### CloudWatch Logs

```bash
aws logs tail /aws/lambda/miyabi-api-dev --follow
```

### Lambda関数テスト

```bash
aws lambda invoke \
  --function-name miyabi-api-dev \
  --payload '{"path": "/api/v1/health", "httpMethod": "GET"}' \
  response.json

cat response.json
```

## トラブルシューティング

### Cold Start遅延

**症状**: 初回リクエストが遅い (3-5秒)

**対策**:
1. メモリ増加: 512MB → 1024MB
2. Provisioned Concurrency設定

```hcl
# lambda-api/main.tf に追加
resource "aws_lambda_provisioned_concurrency_config" "api" {
  function_name                     = aws_lambda_function.api.function_name
  provisioned_concurrent_executions = 2
  qualifier                         = aws_lambda_function.api.version
}
```

### VPC接続エラー

**症状**: RDSに接続できない

**確認項目**:
1. Security Group - Lambda SG → RDS SG (5432)
2. Subnet - Lambda と RDS が同じ VPC private subnet
3. NAT Gateway - 外部API呼び出しに必要

### 環境変数エラー

**症状**: `Failed to load configuration`

**確認**:
```bash
aws lambda get-function-configuration --function-name miyabi-api-dev \
  --query 'Environment.Variables'
```

## コスト見積もり

| リソース | 月額コスト (dev) |
|----------|-----------------|
| Lambda | ~$0 (free tier) |
| API Gateway | ~$1/月 |
| CloudWatch Logs | ~$0.50/月 |
| **合計** | **~$1.50/月** |

## 次のステップ

- [ ] #1170 - S3 + CloudFront フロントエンドデプロイ
- [ ] #1176 - RBAC Middleware 全ルート適用
- [ ] CloudFront → API Gateway 統合

---

**Document Version**: 1.0.0
**Issue**: #1169

