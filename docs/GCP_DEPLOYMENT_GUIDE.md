# Miyabi Web API - GCP Cloud Run デプロイガイド

**更新日**: 2025-10-26
**バージョン**: 1.0.0

## 🎯 概要

Miyabi Web APIをGoogle Cloud Run上にデプロイし、Telegram Bot Webhookを本番稼働させるための完全ガイド。

---

## 📋 前提条件

### 必須ツール
- ✅ Google Cloud アカウント
- ✅ gcloud CLI (最新版)
- ✅ Docker Desktop
- ✅ Git

### 必須情報
- Telegram Bot Token (BotFatherから取得)
- OpenAI API Key (GPT-4用)
- GitHub Personal Access Token
- PostgreSQL データベースURL (Cloud SQLまたは外部)

---

## 🚀 デプロイ手順

### Method 1: 自動デプロイスクリプト（推奨）

```bash
# リポジトリルートで実行
cd /Users/shunsuke/Dev/miyabi-private

# デプロイスクリプトを実行
./scripts/deploy-gcp.sh
```

**スクリプトが自動実行する内容**:
1. ✅ 前提条件チェック (gcloud, Docker)
2. ✅ GCP APIs有効化 (Cloud Run, Cloud Build, Secret Manager)
3. ✅ Secret Manager でシークレット作成
4. ✅ Dockerイメージビルド＆プッシュ
5. ✅ Cloud Runデプロイ
6. ✅ Telegram Webhook URL更新
7. ✅ ヘルスチェック

---

### Method 2: 手動デプロイ

#### Step 1: GCP プロジェクト設定

```bash
# GCPプロジェクトIDを設定
export GCP_PROJECT_ID="miyabi-production"
export GCP_REGION="asia-northeast1"  # 東京リージョン

# gcloud設定
gcloud config set project $GCP_PROJECT_ID
gcloud config set run/region $GCP_REGION
```

#### Step 2: APIs有効化

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com
```

#### Step 3: Secret Manager でシークレット作成

```bash
# Telegram Bot Token
echo -n "8027366064:AAFcZ57624QNiKfzwk6rOVpsSCYS8QIpfHI" | \
  gcloud secrets create telegram-bot-token --data-file=-

# OpenAI API Key
echo -n "sk-proj-xxx" | \
  gcloud secrets create openai-api-key --data-file=-

# GitHub Token
echo -n "ghp_xxx" | \
  gcloud secrets create github-token --data-file=-

# JWT Secret (ランダム文字列)
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create jwt-secret --data-file=-

# 認証済みChat IDs
echo -n "7654362070" | \
  gcloud secrets create authorized-chat-ids --data-file=-

# Database URL
echo -n "postgresql://user:pass@host:5432/miyabi" | \
  gcloud secrets create miyabi-database-url --data-file=-
```

#### Step 4: Dockerイメージビルド

```bash
# Dockerイメージをビルド
docker build \
  -t gcr.io/$GCP_PROJECT_ID/miyabi-web-api:latest \
  -f crates/miyabi-web-api/Dockerfile \
  .

# Google Container Registryにプッシュ
docker push gcr.io/$GCP_PROJECT_ID/miyabi-web-api:latest
```

#### Step 5: Cloud Runデプロイ

```bash
gcloud run deploy miyabi-web-api \
  --image=gcr.io/$GCP_PROJECT_ID/miyabi-web-api:latest \
  --region=$GCP_REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --min-instances=0 \
  --timeout=300 \
  --concurrency=80 \
  --set-env-vars="RUST_LOG=info,SERVER_ADDRESS=0.0.0.0:8080,GITHUB_OWNER=ShunsukeHayashi,GITHUB_REPO=Miyabi" \
  --set-secrets="DATABASE_URL=miyabi-database-url:latest,TELEGRAM_BOT_TOKEN=telegram-bot-token:latest,OPENAI_API_KEY=openai-api-key:latest,GITHUB_TOKEN=github-token:latest,JWT_SECRET=jwt-secret:latest,AUTHORIZED_CHAT_IDS=authorized-chat-ids:latest"
```

#### Step 6: サービスURL取得

```bash
SERVICE_URL=$(gcloud run services describe miyabi-web-api \
  --region=$GCP_REGION \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"
```

#### Step 7: Telegram Webhook設定

```bash
# Bot Tokenを取得
BOT_TOKEN=$(gcloud secrets versions access latest --secret=telegram-bot-token)

# Webhook URLを設定
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${SERVICE_URL}/api/v1/telegram/webhook"

# Webhook確認
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq '.'
```

---

## 🔧 Cloud Build自動デプロイ（CI/CD）

### GitHub連携設定

1. **Cloud Build トリガー作成**

```bash
gcloud builds triggers create github \
  --repo-name=miyabi-private \
  --repo-owner=customer-cloud \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml
```

2. **GitHub App接続**
   - GCP Console → Cloud Build → トリガー → リポジトリを接続
   - GitHub認証 → リポジトリ選択

3. **自動デプロイ**

```bash
# mainブランチにpushすると自動的にデプロイ
git push origin main
```

**ビルドログ確認**:
```bash
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

---

## 🗄️ PostgreSQL データベース設定

### Option 1: Cloud SQL (推奨)

```bash
# Cloud SQL インスタンス作成
gcloud sql instances create miyabi-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$GCP_REGION \
  --root-password=<SECURE_PASSWORD>

# データベース作成
gcloud sql databases create miyabi \
  --instance=miyabi-postgres

# ユーザー作成
gcloud sql users create miyabi \
  --instance=miyabi-postgres \
  --password=<SECURE_PASSWORD>

# 接続文字列を取得
gcloud sql instances describe miyabi-postgres \
  --format='value(connectionName)'

# Cloud Runから接続するための設定
gcloud run services update miyabi-web-api \
  --add-cloudsql-instances=<CONNECTION_NAME> \
  --region=$GCP_REGION
```

**接続文字列**:
```
postgresql://miyabi:<PASSWORD>@/miyabi?host=/cloudsql/<CONNECTION_NAME>
```

### Option 2: 外部PostgreSQL

```bash
# Supabase, ElephantSQL, Heroku等の外部PostgreSQL URLを使用
echo -n "postgresql://user:pass@host:5432/miyabi" | \
  gcloud secrets versions add miyabi-database-url --data-file=-
```

---

## 📊 モニタリング＆ログ

### ログ確認

```bash
# リアルタイムログ
gcloud run logs tail miyabi-web-api --region=$GCP_REGION

# 過去のログ
gcloud run logs read miyabi-web-api \
  --region=$GCP_REGION \
  --limit=100

# エラーログのみ
gcloud run logs read miyabi-web-api \
  --region=$GCP_REGION \
  --filter="severity>=ERROR"
```

### メトリクス確認

```bash
# Cloud Consoleで確認
https://console.cloud.google.com/run/detail/$GCP_REGION/miyabi-web-api/metrics
```

**主要メトリクス**:
- リクエスト数
- レスポンスタイム
- エラー率
- CPU/メモリ使用率
- コンテナインスタンス数

### アラート設定

```bash
# Cloud Monitoring でアラートポリシー作成
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="Miyabi API High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

---

## 🔐 セキュリティ設定

### IAM権限

```bash
# Cloud Runサービスアカウントにシークレットアクセス権限付与
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding telegram-bot-token \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

# 全シークレットに適用
for secret in telegram-bot-token openai-api-key github-token jwt-secret authorized-chat-ids miyabi-database-url; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
done
```

### VPC設定（Optional）

```bash
# VPC Connectorを作成（Cloud SQLプライベート接続用）
gcloud compute networks vpc-access connectors create miyabi-connector \
  --region=$GCP_REGION \
  --range=10.8.0.0/28

# Cloud Runに適用
gcloud run services update miyabi-web-api \
  --vpc-connector=miyabi-connector \
  --region=$GCP_REGION
```

---

## 💰 コスト見積もり

### Cloud Run 料金

**無料枠** (毎月):
- CPU時間: 180,000 vCPU-秒
- メモリ: 360,000 GiB-秒
- リクエスト: 200万回

**通常料金** (asia-northeast1):
- CPU: $0.00002400 / vCPU-秒
- メモリ: $0.00000250 / GiB-秒
- リクエスト: $0.40 / 100万回

**月額見積もり** (中規模使用):
- リクエスト: 10万回/月 → 無料
- CPU/メモリ: $5-10/月
- **合計**: ~$10/月

### Cloud SQL 料金

**db-f1-micro** (最小インスタンス):
- 月額: ~$7.67

**db-g1-small** (推奨):
- 月額: ~$25

---

## 🧪 テスト

### ローカルテスト

```bash
# Dockerイメージをローカルで実行
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e TELEGRAM_BOT_TOKEN="..." \
  -e OPENAI_API_KEY="..." \
  -e GITHUB_TOKEN="..." \
  -e AUTHORIZED_CHAT_IDS="7654362070" \
  gcr.io/$GCP_PROJECT_ID/miyabi-web-api:latest

# ヘルスチェック
curl http://localhost:8080/api/v1/health
```

### 本番テスト

```bash
# Telegram Botでテスト
# 1. /getid でChat ID確認
# 2. 自然言語メッセージ送信
# 3. Issue作成確認
# 4. Agent実行完了通知確認
```

---

## 🔧 トラブルシューティング

### Issue 1: Webhook not receiving updates

**症状**: Telegram Botがメッセージを受信しない

**解決策**:
```bash
# Webhook情報確認
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq '.'

# pending_update_countが0以外なら削除
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${SERVICE_URL}/api/v1/telegram/webhook" \
  -d "drop_pending_updates=true"
```

### Issue 2: 503 Service Unavailable

**症状**: Cloud Runが503エラーを返す

**解決策**:
```bash
# ログ確認
gcloud run logs read miyabi-web-api --region=$GCP_REGION --limit=50

# コンテナが起動失敗している可能性
# - 環境変数の確認
# - シークレットアクセス権限確認
# - データベース接続確認
```

### Issue 3: Out of Memory

**症状**: メモリ不足でコンテナが再起動

**解決策**:
```bash
# メモリを増やす
gcloud run services update miyabi-web-api \
  --memory=4Gi \
  --region=$GCP_REGION
```

---

## 📝 チェックリスト

デプロイ前:
- [ ] GCPプロジェクト作成
- [ ] gcloud CLI認証
- [ ] Telegram Bot作成（BotFather）
- [ ] OpenAI API Key取得
- [ ] GitHub Token作成
- [ ] PostgreSQLデータベース準備

デプロイ:
- [ ] APIs有効化
- [ ] Secret Manager設定
- [ ] Dockerイメージビルド
- [ ] Cloud Runデプロイ
- [ ] Telegram Webhook設定

デプロイ後:
- [ ] ヘルスチェック確認
- [ ] Telegram Botテスト
- [ ] ログ確認
- [ ] メトリクス確認
- [ ] アラート設定

---

## 🔗 参考リンク

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Build](https://cloud.google.com/build/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**問題が発生した場合**: GitHub Issues (#563) に報告してください。
