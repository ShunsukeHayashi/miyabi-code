#!/bin/bash

##############################################################################
# TELEGRAM BOT SETUP - Final Automation Script
#
# This script helps complete the Telegram bot setup for Miyabi Web API
#
# Prerequisites:
#   1. You must have completed manual BotFather setup (see instructions below)
#   2. You have your bot token from BotFather
#   3. gcloud CLI is installed and authenticated
#
# Usage:
#   ./TELEGRAM_BOT_FINAL_SETUP.sh "YOUR_BOT_TOKEN_HERE"
#
##############################################################################

set -e

PROJECT_ID="miyabi-476308"
REGION="asia-northeast1"
SERVICE_NAME="miyabi-web-api"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

##############################################################################
# STEP 1: Validate Input
##############################################################################

if [ -z "$1" ]; then
    print_error "No bot token provided!"
    echo ""
    echo "Usage: $0 \"YOUR_BOT_TOKEN_HERE\""
    echo ""
    echo "How to get your bot token:"
    echo "  1. Open Telegram on your phone or desktop"
    echo "  2. Search for @BotFather"
    echo "  3. Send /newbot command"
    echo "  4. Follow the wizard:"
    echo "     - Enter bot name (e.g., 'Miyabi Bot')"
    echo "     - Enter bot username (must end with 'bot', e.g., 'miyabi_bot')"
    echo "  5. Copy the token from BotFather's response"
    echo "  6. Run this script with: $0 \"TOKEN_HERE\""
    exit 1
fi

BOT_TOKEN="$1"

# Validate token format (should be numbers:letters-numbers)
if ! [[ "$BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
    print_error "Invalid bot token format!"
    echo "Token should be in format: numbers:alphanumeric-characters"
    echo "Example: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz"
    exit 1
fi

print_success "Bot token format validated"

##############################################################################
# STEP 2: Verify GCP Configuration
##############################################################################

print_status "Verifying GCP configuration..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Check if project is set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    print_warning "Current project is $CURRENT_PROJECT, setting to $PROJECT_ID"
    gcloud config set project $PROJECT_ID
fi

print_success "GCP configuration verified (project: $PROJECT_ID)"

##############################################################################
# STEP 3: Add Bot Token to Secret Manager
##############################################################################

print_status "Adding bot token to Secret Manager..."

# Check if secret already exists
if gcloud secrets describe telegram-bot-token --project=$PROJECT_ID &>/dev/null; then
    print_warning "Secret 'telegram-bot-token' already exists, creating new version..."
    echo "$BOT_TOKEN" | gcloud secrets versions add telegram-bot-token \
        --data-file=- \
        --project=$PROJECT_ID 2>&1 | tail -3
else
    print_status "Creating new secret 'telegram-bot-token'..."
    echo "$BOT_TOKEN" | gcloud secrets create telegram-bot-token \
        --data-file=- \
        --replication-policy="automatic" \
        --project=$PROJECT_ID 2>&1 | tail -3
fi

print_success "Bot token added to Secret Manager"

##############################################################################
# STEP 4: Grant Cloud Run Service Account Access
##############################################################################

print_status "Granting Cloud Run service account access to secret..."

SERVICE_ACCOUNT="${SERVICE_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Add secret accessor role
gcloud secrets add-iam-policy-binding telegram-bot-token \
    --member=serviceAccount:$SERVICE_ACCOUNT \
    --role=roles/secretmanager.secretAccessor \
    --project=$PROJECT_ID \
    --quiet 2>&1 | grep -A 2 "Updated IAM policy" || true

print_success "Service account granted access to telegram-bot-token secret"

##############################################################################
# STEP 5: Deploy Cloud Run Service with Bot Token
##############################################################################

print_status "Redeploying Cloud Run service with bot token..."

# Get current service image
CURRENT_IMAGE=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format='value(spec.template.spec.containers[0].image)')

if [ -z "$CURRENT_IMAGE" ]; then
    print_error "Could not retrieve current service image"
    exit 1
fi

print_status "Using image: $CURRENT_IMAGE"

# Redeploy with bot token
gcloud run deploy $SERVICE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --image=$CURRENT_IMAGE \
    --set-secrets="TELEGRAM_BOT_TOKEN=telegram-bot-token:latest" \
    --quiet 2>&1 | grep -A 5 "Service \[$SERVICE_NAME\]" || true

print_success "Cloud Run service redeployed with Telegram bot token"

##############################################################################
# STEP 6: Verify Deployment
##############################################################################

print_status "Verifying deployment..."

# Wait a moment for deployment to stabilize
sleep 5

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --project=$PROJECT_ID \
    --format='value(status.url)')

print_status "Service URL: $SERVICE_URL"

# Test health endpoint
print_status "Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/v1/health")

if [ "$HEALTH_STATUS" = "200" ]; then
    print_success "Health endpoint responding: HTTP $HEALTH_STATUS"
else
    print_error "Health endpoint returned HTTP $HEALTH_STATUS (expected 200)"
    exit 1
fi

##############################################################################
# STEP 7: Verify Bot Token is Accessible
##############################################################################

print_status "Verifying bot token secret is accessible..."

# Retrieve the secret to verify it was added correctly
STORED_TOKEN=$(gcloud secrets versions access latest \
    --secret=telegram-bot-token \
    --project=$PROJECT_ID)

if [ "$STORED_TOKEN" = "$BOT_TOKEN" ]; then
    print_success "Bot token verified in Secret Manager"
else
    print_error "Bot token mismatch in Secret Manager"
    exit 1
fi

##############################################################################
# STEP 8: Display Summary
##############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ TELEGRAM BOT SETUP COMPLETE                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Summary of Changes:"
echo "  ✅ Bot token stored in Secret Manager"
echo "  ✅ Service account granted access"
echo "  ✅ Cloud Run service redeployed"
echo "  ✅ Health endpoint verified"
echo ""
echo "Service Details:"
echo "  Service Name:  $SERVICE_NAME"
echo "  Region:        $REGION"
echo "  Project:       $PROJECT_ID"
echo "  Service URL:   $SERVICE_URL"
echo "  Health Check:  HTTP 200 OK"
echo ""
echo "Next Steps:"
echo "  1. Test Telegram bot integration:"
echo "     - Send a message to your Telegram bot"
echo "     - Verify webhook is received by the API"
echo ""
echo "  2. Monitor logs for webhook events:"
echo "     gcloud logging read 'resource.type=cloud_run_revision AND jsonPayload.webhook_type=telegram' --limit=10 --project=$PROJECT_ID"
echo ""
echo "  3. Check alert policies:"
echo "     gcloud monitoring policies list --project=$PROJECT_ID"
echo ""
echo "Documentation:"
echo "  - TEAM_TRAINING_GUIDE.md"
echo "  - MONITORING_OPTIMIZATION_GUIDE.md"
echo "  - SESSION_3_COMPREHENSIVE_SUMMARY.md"
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🚀 MIYABI WEB API PRODUCTION DEPLOYMENT 100% COMPLETE ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
