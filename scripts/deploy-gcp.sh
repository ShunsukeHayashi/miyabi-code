#!/bin/bash
# Miyabi Web API - GCP Cloud Run Deployment Script
#
# This script sets up and deploys Miyabi Web API to Google Cloud Run
#
# Prerequisites:
# - gcloud CLI installed and authenticated
# - Docker installed
# - Appropriate GCP permissions

set -e  # Exit on error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-miyabi-production}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="miyabi-web-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Verify prerequisites
info "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    error "gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    error "Docker not found. Please install: https://docs.docker.com/get-docker/"
    exit 1
fi

success "Prerequisites verified"

# Step 2: Set GCP project
info "Setting GCP project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Step 3: Enable required APIs
info "Enabling required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com

success "APIs enabled"

# Step 4: Create secrets in Secret Manager (if not exists)
info "Setting up secrets in Secret Manager..."

create_secret_if_not_exists() {
    local secret_name=$1
    local secret_description=$2

    if ! gcloud secrets describe "$secret_name" &> /dev/null; then
        info "Creating secret: $secret_name"
        echo -n "Enter value for $secret_name ($secret_description): "
        read -s secret_value
        echo
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --data-file=- \
            --replication-policy="automatic"
        success "Secret created: $secret_name"
    else
        warn "Secret already exists: $secret_name (skipping)"
    fi
}

# Create all required secrets
create_secret_if_not_exists "telegram-bot-token" "Telegram Bot Token from BotFather"
create_secret_if_not_exists "openai-api-key" "OpenAI API Key for GPT-4"
create_secret_if_not_exists "github-token" "GitHub Personal Access Token"
create_secret_if_not_exists "jwt-secret" "JWT Secret (random string)"
create_secret_if_not_exists "authorized-chat-ids" "Comma-separated Chat IDs (e.g., 7654362070)"
create_secret_if_not_exists "miyabi-database-url" "PostgreSQL Database URL"

success "Secrets configured"

# Step 5: Build and push Docker image (local build option)
info "Would you like to build locally or use Cloud Build? (local/cloud)"
read -r build_option

if [ "$build_option" = "local" ]; then
    info "Building Docker image locally..."

    docker build \
        -t "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest" \
        -f crates/miyabi-web-api/Dockerfile \
        .

    info "Pushing image to Google Container Registry..."
    docker push "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

    IMAGE_URL="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

    success "Image built and pushed locally"
else
    info "Using Cloud Build (triggered automatically on git push)"
    warn "Make sure to set up Cloud Build trigger in GCP Console"
    warn "Or run: gcloud builds submit --config=cloudbuild.yaml"
    exit 0
fi

# Step 6: Deploy to Cloud Run
info "Deploying to Cloud Run..."

gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_URL" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --memory=2Gi \
    --cpu=2 \
    --max-instances=10 \
    --min-instances=0 \
    --timeout=300 \
    --concurrency=80 \
    --set-env-vars="RUST_LOG=info,SERVER_ADDRESS=0.0.0.0:8080" \
    --set-secrets="DATABASE_URL=miyabi-database-url:latest,TELEGRAM_BOT_TOKEN=telegram-bot-token:latest,OPENAI_API_KEY=openai-api-key:latest,GITHUB_TOKEN=github-token:latest,JWT_SECRET=jwt-secret:latest,AUTHORIZED_CHAT_IDS=authorized-chat-ids:latest" \
    --labels="app=miyabi,component=web-api,env=production"

success "Deployment complete!"

# Step 7: Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format='value(status.url)')

info "Service URL: $SERVICE_URL"

# Step 8: Update Telegram Webhook
info "Updating Telegram Webhook..."

BOT_TOKEN=$(gcloud secrets versions access latest --secret=telegram-bot-token)

WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -d "url=${SERVICE_URL}/api/v1/telegram/webhook" \
    -d "drop_pending_updates=false")

if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
    success "Telegram Webhook updated successfully!"
    info "Webhook URL: ${SERVICE_URL}/api/v1/telegram/webhook"
else
    error "Failed to update Telegram Webhook"
    echo "$WEBHOOK_RESPONSE"
    exit 1
fi

# Step 9: Verify webhook
info "Verifying webhook..."

WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$WEBHOOK_INFO" | jq '.'

# Step 10: Test endpoint
info "Testing health endpoint..."

HEALTH_RESPONSE=$(curl -s "${SERVICE_URL}/api/v1/health")

if echo "$HEALTH_RESPONSE" | grep -q 'ok'; then
    success "Health check passed!"
else
    warn "Health check failed. Response: $HEALTH_RESPONSE"
fi

# Summary
echo ""
success "========================================="
success "  Miyabi Web API Deployment Complete!"
success "========================================="
echo ""
info "Service URL: $SERVICE_URL"
info "Webhook URL: ${SERVICE_URL}/api/v1/telegram/webhook"
info "Region: $REGION"
info "Project: $PROJECT_ID"
echo ""
info "Next steps:"
echo "  1. Test the bot in Telegram"
echo "  2. Monitor logs: gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo "  3. View metrics in Cloud Console"
echo ""
success "Happy automating! 🤖"
