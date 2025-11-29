# Lambda CI/CD Setup Guide

**Version**: 1.0
**Last Updated**: 2025-11-29
**Owner**: DevOps Team

---

## 🎯 概要

このドキュメントは、Miyabiプロジェクトの**Lambda CI/CDパイプライン**のセットアップガイドです。

GitHub ActionsでAWS Lambdaへの自動デプロイを実現します。

---

## 📋 前提条件

### 必要なもの

- ✅ AWSアカウント（管理者権限）
- ✅ GitHubリポジトリへの管理者アクセス
- ✅ AWS CLI v2（ローカル設定用）
- ✅ 基本的なTerraformの知識（オプション）

---

## 🔐 AWS認証設定

### ステップ1: IAMユーザー作成

GitHub Actions用のIAMユーザーを作成します。

```bash
# AWS CLIで作成
aws iam create-user --user-name github-actions-lambda-deploy
```

### ステップ2: 必要なポリシーをアタッチ

最小権限の原則に基づいたポリシーを適用します。

**カスタムポリシー `GithubActionsLambdaDeployPolicy.json`**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:PublishVersion",
        "lambda:CreateAlias",
        "lambda:UpdateAlias",
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:us-east-1:*:function:miyabi-api-*",
        "arn:aws:lambda:us-east-1:*:function:miyabi-mcp-server-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::miyabi-lambda-artifacts",
        "arn:aws:s3:::miyabi-lambda-artifacts/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:log-group:/aws/lambda/miyabi-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks",
        "cloudformation:GetTemplate"
      ],
      "Resource": "*"
    }
  ]
}
```

**ポリシーを作成・アタッチ**:

```bash
# ポリシー作成
aws iam create-policy \
  --policy-name GithubActionsLambdaDeployPolicy \
  --policy-document file://GithubActionsLambdaDeployPolicy.json

# ユーザーにアタッチ
aws iam attach-user-policy \
  --user-name github-actions-lambda-deploy \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GithubActionsLambdaDeployPolicy
```

### ステップ3: アクセスキー生成

```bash
aws iam create-access-key --user-name github-actions-lambda-deploy
```

出力:
```json
{
  "AccessKey": {
    "UserName": "github-actions-lambda-deploy",
    "AccessKeyId": "AKIA...",
    "SecretAccessKey": "wJalrXUtn...",
    "Status": "Active",
    "CreateDate": "2025-11-29T..."
  }
}
```

**⚠️ 重要**: `SecretAccessKey`は一度しか表示されません。安全に保存してください。

---

## 🔑 GitHub Secrets設定

### 必須シークレット

GitHubリポジトリに以下のシークレットを追加します。

**Settings → Secrets and variables → Actions → New repository secret**

| シークレット名 | 値 | 説明 |
|---------------|-----|------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAMアクセスキーID |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtn...` | IAMシークレットキー |
| `AWS_REGION` | `us-east-1` | デプロイリージョン |

### オプション（環境固有）

各環境（dev/staging/production）ごとに設定可能：

**Settings → Environments → New environment**

環境名: `dev`, `staging`, `production`

| シークレット名 | 例 | 説明 |
|---------------|-----|------|
| `DATABASE_URL` | `postgres://...` | データベース接続URL |
| `JWT_SECRET` | `your-secret-key` | JWT署名キー |
| `GITHUB_TOKEN` | `ghp_...` | GitHub API Token |
| `LARK_APP_ID` | `cli_...` | Lark App ID |
| `LARK_APP_SECRET` | `...` | Lark App Secret |

### Discord通知（オプション）

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `DISCORD_WEBHOOK_URL` | `https://discord.com/api/webhooks/...` | Discord Webhook URL |

**設定場所**: Settings → Secrets and variables → Actions → Variables

---

## 🚀 Lambda関数の事前デプロイ

CI/CDパイプラインは**既存のLambda関数を更新**します。初回デプロイはTerraformで行います。

### オプションA: Terraformでデプロイ

```bash
cd deploy/terraform

# 初期化
terraform init

# プラン確認
terraform plan

# デプロイ
terraform apply
```

### オプションB: AWS CLIで手動デプロイ

**Rust Lambda**:

```bash
# 関数作成（dev環境）
aws lambda create-function \
  --function-name miyabi-api-dev \
  --runtime provided.al2 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/miyabi-lambda-exec \
  --handler bootstrap \
  --architectures arm64 \
  --zip-file fileb://path/to/rust-lambda.zip
```

**Python Lambda**:

```bash
# 関数作成（dev環境）
aws lambda create-function \
  --function-name miyabi-mcp-server-dev \
  --runtime python3.12 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/miyabi-lambda-exec \
  --handler lambda_handler.handler \
  --architectures arm64 \
  --zip-file fileb://path/to/python-lambda.zip
```

---

## 📝 ワークフロー使用方法

### 自動デプロイ（mainへのpush）

```bash
# コミット & プッシュ
git add .
git commit -m "feat: update lambda function"
git push origin main
```

→ 自動的にCI/CDパイプラインが起動し、`dev`環境にデプロイ

### 手動デプロイ

**GitHub UI**:

1. リポジトリページ → **Actions**
2. **Lambda CI/CD Pipeline** を選択
3. **Run workflow** をクリック
4. 環境を選択（dev/staging/production）
5. オプション選択
   - Skip tests: 緊急時のみ
   - Deploy Rust/Python: デプロイ対象選択
6. **Run workflow** 実行

**GitHub CLI**:

```bash
# Productionへデプロイ
gh workflow run lambda-ci-cd.yml \
  -f environment=production \
  -f deploy_rust=true \
  -f deploy_python=true
```

---

## 🧪 テストとビルド

### ローカルテスト

**Rust**:

```bash
# テスト実行
cargo test --package miyabi-web-api --features lambda

# Clippy
cargo clippy --package miyabi-web-api --features lambda -- -D warnings

# フォーマット確認
cargo fmt --package miyabi-web-api -- --check
```

**Python**:

```bash
cd openai-apps/miyabi-app/server

# 依存関係インストール
pip install -r requirements.txt
pip install pytest black flake8

# テスト
pytest tests/

# フォーマット
black --check .

# Lint
flake8 . --max-line-length=120
```

### ローカルビルド

**Rust Lambda**:

```bash
# cargo-lambdaインストール
pip install cargo-lambda

# ビルド
cargo lambda build --release --arm64 --package miyabi-web-api --bin lambda-api --features lambda
```

**Python Lambda**:

```bash
cd openai-apps/miyabi-app/server

# パッケージング
mkdir -p dist
pip install -r requirements.txt -t dist/
cp *.py dist/
cd dist && zip -r ../python-lambda.zip .
```

---

## 🔍 デプロイメント検証

### 1. GitHub Actions UI確認

**Actions → Lambda CI/CD Pipeline → 最新のrun**

各ジョブのステータスを確認：
- ✅ Test Rust Lambda
- ✅ Test Python Lambda
- ✅ Build Rust Lambda
- ✅ Build Python Lambda
- ✅ Deploy to AWS
- ✅ Verify Deployment

### 2. AWS Consoleで確認

**Lambda → Functions**

- `miyabi-api-dev` / `miyabi-api-staging` / `miyabi-api-production`
- `miyabi-mcp-server-dev` / `miyabi-mcp-server-staging` / `miyabi-mcp-server-production`

**確認項目**:
- Last modified: 最新のデプロイ時刻
- Runtime settings: 正しいランタイム
- Environment variables: 設定済み

### 3. API動作確認

**Rust Lambda (API Gateway経由)**:

```bash
# Health check
curl https://API_GATEWAY_URL/health

# 期待レスポンス
{"status":"healthy","version":"1.0.0"}
```

**Python Lambda (直接invoke)**:

```bash
# Lambda invoke
aws lambda invoke \
  --function-name miyabi-mcp-server-dev \
  --payload '{}' \
  response.json

cat response.json
```

### 4. CloudWatch Logs確認

```bash
# 最新ログ取得
aws logs tail /aws/lambda/miyabi-api-dev --follow

# エラー検索
aws logs filter-log-events \
  --log-group-name /aws/lambda/miyabi-api-dev \
  --filter-pattern "ERROR"
```

---

## 🔄 ロールバック手順

デプロイに問題がある場合、前のバージョンに戻します。

### オプション1: Lambda Versionを使用

```bash
# 前のバージョンを確認
aws lambda list-versions-by-function --function-name miyabi-api-production

# エイリアスを前バージョンに切り替え
aws lambda update-alias \
  --function-name miyabi-api-production \
  --name current \
  --function-version PREVIOUS_VERSION_NUMBER
```

### オプション2: GitHub Actionsで再デプロイ

1. 前回正常だったコミットを特定
2. そのコミットから手動ワークフロー実行

```bash
# 前回のコミットに戻す
git revert HEAD
git push origin main

# または、特定コミットから手動実行
gh workflow run lambda-ci-cd.yml \
  -f environment=production \
  --ref GOOD_COMMIT_SHA
```

---

## 🛡️ セキュリティベストプラクティス

### 1. シークレット管理

- ✅ GitHub Secretsを使用（環境変数直接指定NG）
- ✅ AWS Secrets Managerでランタイムシークレット管理
- ✅ 定期的なアクセスキーローテーション（90日ごと）

### 2. 最小権限の原則

- ✅ Lambda実行ロールは必要最小限のポリシーのみ
- ✅ GitHub Actions IAMユーザーもLambda更新のみ

### 3. 監査ログ

- ✅ CloudTrailでAPI呼び出し記録
- ✅ CloudWatch Logsで実行ログ保存（7日間）

---

## 📊 モニタリング

### CloudWatch Metrics

**Lambda → Functions → miyabi-api-production → Monitoring**

重要メトリクス:
- **Invocations**: 呼び出し回数
- **Duration**: 実行時間
- **Errors**: エラー数
- **Throttles**: スロットリング

### アラート設定

```bash
# CloudWatch アラーム作成
aws cloudwatch put-metric-alarm \
  --alarm-name miyabi-api-production-errors \
  --alarm-description "Lambda errors exceed threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=miyabi-api-production
```

---

## 🐛 トラブルシューティング

### Q1: デプロイが失敗する

**原因**: AWS認証エラー

**確認**:
```bash
# GitHub Secretsが正しく設定されているか確認
# AWS CLIでテスト
aws sts get-caller-identity
```

**解決策**:
- GitHub Secretsを再設定
- IAMポリシーを確認

---

### Q2: ビルドが失敗する

**原因**: cargo-lambdaインストールエラー

**解決策**:
```yaml
# .github/workflows/lambda-ci-cd.yml
- name: Install cargo-lambda
  run: |
    curl -L https://github.com/cargo-lambda/cargo-lambda/releases/download/v1.3.0/cargo-lambda-v1.3.0.x86_64-unknown-linux-gnu.tar.gz | tar xz
    mv cargo-lambda ~/.cargo/bin/
```

---

### Q3: Lambda関数が見つからない

**原因**: 関数が作成されていない

**解決策**:
```bash
# Terraformで初回デプロイ
cd deploy/terraform
terraform apply
```

---

### Q4: テストがスキップされる

**原因**: `skip_tests=true`が設定されている

**解決策**:
- 手動ワークフロー実行時、`skip_tests`をfalseに
- 緊急時以外は常にテスト実行を推奨

---

## 📚 参考リンク

### 公式ドキュメント

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [cargo-lambda Documentation](https://www.cargo-lambda.info/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### Miyabi内部リソース

- **Terraform設定**: `deploy/terraform/lambda.tf`
- **Rust Lambda実装**: `crates/miyabi-web-api/src/bin/lambda-api.rs`
- **Python Lambda実装**: `openai-apps/miyabi-app/server/lambda_handler.py`
- **CI/CDワークフロー**: `.github/workflows/lambda-ci-cd.yml`

---

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2025-11-29 | 1.0 | 初版作成 - Lambda CI/CDセットアップガイド |

---

**メンテナー**: DevOps Team
**最終更新**: 2025-11-29
**次回レビュー**: 2026-01-01
