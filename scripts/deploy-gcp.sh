#!/bin/bash
# GCP Cloud Run 手動デプロイスクリプト
# Miyabi Web API を GCP にデプロイします

set -e

echo "🚀 Miyabi Web API - GCP Cloud Run デプロイ開始"
echo "=================================================="
echo ""

# === 設定 ===
PROJECT_ID="miyabi-476308"
SERVICE_NAME="miyabi-web-api"
REGION="asia-northeast1"  # Tokyo
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
DOCKERFILE_PATH="crates/miyabi-web-api/Dockerfile"

# 環境設定確認
echo "📋 デプロイ設定確認:"
echo "  PROJECT_ID: $PROJECT_ID"
echo "  SERVICE_NAME: $SERVICE_NAME"
echo "  REGION: $REGION"
echo "  IMAGE: $IMAGE_NAME"
echo ""

# === Step 1: Docker ビルド ===
echo "🔨 Step 1: Docker イメージをビルド中..."
echo "  (初回はビルドに 5-10分かかります)"
echo ""

COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
IMAGE_TAG="${IMAGE_NAME}:${COMMIT_SHA}"

docker buildx build \
  --platform linux/amd64 \
  -t "${IMAGE_TAG}" \
  -t "${IMAGE_NAME}:latest" \
  -f "${DOCKERFILE_PATH}" \
  --push \
  .

if [ $? -eq 0 ]; then
  echo "✅ Docker イメージビルド成功"
  echo "  Image: $IMAGE_TAG"
else
  echo "❌ Docker ビルド失敗"
  exit 1
fi

echo ""

# === Step 2: Container Registry Push (built-in with buildx) ===
echo "📤 Step 2: イメージは buildx で自動的にプッシュされました"
echo "✅ Container Registry プッシュ成功"

echo ""

# === Step 3: Cloud Run にデプロイ ===
echo "☁️  Step 3: Cloud Run にデプロイ中..."

gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --min-instances=0 \
  --timeout=300 \
  --concurrency=80 \
  --project="${PROJECT_ID}" \
  --set-env-vars="RUST_LOG=info,SERVER_ADDRESS=0.0.0.0:8080,ENVIRONMENT=production" \
  --set-secrets="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GITHUB_CLIENT_ID=github-client-id:latest,GITHUB_CLIENT_SECRET=github-client-secret:latest,GITHUB_CALLBACK_URL=github-callback-url:latest,FRONTEND_URL=frontend-url:latest" \
  --labels="app=miyabi,component=web-api,env=production"

if [ $? -eq 0 ]; then
  echo "✅ Cloud Run デプロイ成功"
else
  echo "❌ デプロイ失敗"
  exit 1
fi

echo ""

# === Step 4: デプロイ完了情報 ===
echo "🎉 デプロイ完了！"
echo ""

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" \
  --format='value(status.url)' \
  --project="${PROJECT_ID}")

echo "📍 サービス URL: $SERVICE_URL"
echo ""

echo "次のステップ:"
echo "  1️⃣  ヘルスチェック確認:"
echo "    curl ${SERVICE_URL}/health"
echo ""
echo "  2️⃣  ログ確認:"
echo "    gcloud run logs read ${SERVICE_NAME} --region=${REGION} --limit=50"
echo ""

echo ""
echo "=================================================="
echo "✅ デプロイ完了！"
echo ""
