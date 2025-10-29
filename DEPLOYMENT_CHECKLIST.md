# 🚀 GCP Cloud Run デプロイ チェックリスト

## ✅ デプロイ前の確認

### 1. 環境確認
- [ ] `gcloud auth list` で認証済みアカウント確認
  ```bash
  gcloud auth list
  ```
  
- [ ] GCP プロジェクト設定確認
  ```bash
  gcloud config get project
  # 出力: miyabi-476308
  ```

### 2. Docker 環境確認
- [ ] Docker Desktop が起動しているか確認
  ```bash
  docker --version
  docker ps
  ```

### 3. コード準備確認
- [ ] 最新コミットをプッシュしたか確認
  ```bash
  git log --oneline -1
  git push
  ```

- [ ] 不要なファイルがビルドに含まれていないか確認
  ```bash
  git status
  ```

### 4. GCP リソース確認
- [ ] Cloud Run サービスが存在するか確認
  ```bash
  gcloud run services list --region=asia-northeast1
  ```

- [ ] Secret Manager でシークレットが設定されているか確認
  ```bash
  gcloud secrets list
  ```

- [ ] 必要なシークレット一覧:
  - [ ] `database-url` - PostgreSQL 接続文字列
  - [ ] `telegram-bot-token` - Telegram Bot トークン
  - [ ] `openai-api-key` - OpenAI API キー
  - [ ] `github-token` - GitHub トークン
  - [ ] `jwt-secret` - JWT シークレットキー

### 5. データベース確認
- [ ] Cloud SQL インスタンスが起動しているか確認
  ```bash
  gcloud sql instances list
  ```

- [ ] データベースが初期化されているか確認（初回のみ）
  ```bash
  gcloud sql connect miyabi-db --user=root
  # SQL: CREATE DATABASE IF NOT EXISTS miyabi;
  ```

### 6. イメージレジストリ確認
- [ ] Container Registry が有効か確認
  ```bash
  gcloud services list --enabled | grep container
  ```

## 📋 デプロイ実行手順

### Step 1: デプロイスクリプト実行
```bash
cd /Users/shunsuke/Dev/miyabi-private
bash scripts/deploy-gcp.sh
```

**実行時間**: 
- ビルド: 5-10分（初回）
- プッシュ: 2-3分
- デプロイ: 2-3分
- **合計**: 10-15分

### Step 2: デプロイ結果確認
```bash
# Cloud Run サービス URL確認
gcloud run services describe miyabi-web-api \
  --region=asia-northeast1 \
  --format='value(status.url)'
```

### Step 3: 動作確認
```bash
# ヘルスチェック
SERVICE_URL="https://miyabi-web-api-xxx-asia-northeast1.a.run.app"
curl ${SERVICE_URL}/health

# ログ確認
gcloud run logs read miyabi-web-api \
  --region=asia-northeast1 \
  --limit=50
```

## 🔧 トラブルシューティング

### ビルドが失敗した場合
```bash
# ローカルでビルドテスト
docker build -t test-api \
  -f crates/miyabi-web-api/Dockerfile .

# ビルドログ確認
docker build --progress=plain \
  -f crates/miyabi-web-api/Dockerfile . 2>&1 | tail -100
```

### デプロイが失敗した場合
```bash
# 権限確認
gcloud projects get-iam-policy miyabi-476308

# Cloud Run デプロイログ確認
gcloud logging read \
  "resource.type=cloud_run_revision" \
  --limit=50 \
  --format=json | jq -r '.[] | .textPayload'
```

### イメージプッシュが失敗した場合
```bash
# Docker 認証確認
gcloud auth configure-docker

# イメージプッシュ再試行
docker push gcr.io/miyabi-476308/miyabi-web-api:latest
```

## 📊 デプロイ後の確認

### 1. メトリクス確認
```bash
gcloud monitoring metrics-descriptors list \
  --filter='resource.type:cloud_run_revision'
```

### 2. パフォーマンス確認
```bash
# レスポンスタイム測定
time curl https://miyabi-web-api-xxx-asia-northeast1.a.run.app/health
```

### 3. リソース使用状況確認
```bash
gcloud run services describe miyabi-web-api \
  --region=asia-northeast1 \
  --format='value(spec.template.spec.containers[0].resources)'
```

## 🔄 ロールバック手順

デプロイが失敗した場合の戻し方：

```bash
# 前のリビジョンに戻す
gcloud run services update-traffic miyabi-web-api \
  --region=asia-northeast1 \
  --to-revisions=PREVIOUS=100

# または特定のリビジョンに戻す
gcloud run services update-traffic miyabi-web-api \
  --region=asia-northeast1 \
  --to-revisions=<REVISION_NAME>=100
```

## 📝 重要な注意事項

- ⚠️ 本番環境への最初のデプロイは十分なテストを行ってください
- ⚠️ データベースマイグレーションが必要な場合は事前に実行してください
- ⚠️ API キーやトークンが正しく Secret Manager に設定されていることを確認してください
- ✅ デプロイ後は必ず動作確認を行ってください

## 🎯 デプロイ後のチェック項目

- [ ] サービス URL にアクセスでき、ホームページが表示される
- [ ] `/health` エンドポイントが 200 OK を返す
- [ ] ログにエラーが出ていない
- [ ] Cloud SQL への接続が確立されている
- [ ] Redis キャッシュが動作している
- [ ] WebSocket 接続が確立できる（`/ws` エンドポイント）
