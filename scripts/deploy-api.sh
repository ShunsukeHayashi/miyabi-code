#!/bin/bash
# Miyabi API Deployment Script
# Issue: #993 - Phase 4.6: Production Launch
#
# Usage:
#   ./scripts/deploy-api.sh [staging|production] [image-tag]
#
# Examples:
#   ./scripts/deploy-api.sh staging latest
#   ./scripts/deploy-api.sh production v1.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parameters
ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"

# Validate environment
if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
    echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'.${NC}"
    exit 1
fi

# ECS Configuration
CLUSTER_NAME="miyabi-${ENVIRONMENT}"
SERVICE_NAME="miyabi-api"
TASK_FAMILY="miyabi-web-api"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/miyabi-web-api"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               MIYABI API DEPLOYMENT                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment:  ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Image Tag:    ${IMAGE_TAG}"
echo -e "Cluster:      ${CLUSTER_NAME}"
echo -e "Service:      ${SERVICE_NAME}"
echo ""

# =============================================================================
# Step 1: Build and Push Docker Image
# =============================================================================

echo -e "${YELLOW}Step 1/5: Building Docker image...${NC}"

# Login to ECR
aws ecr get-login-password --region "${AWS_REGION}" | \
    docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Build image
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

docker build -t "${ECR_REPO}:${IMAGE_TAG}" -f "${PROJECT_ROOT}/Dockerfile.api" "${PROJECT_ROOT}"

# Push to ECR
echo -e "${YELLOW}Pushing to ECR...${NC}"
docker push "${ECR_REPO}:${IMAGE_TAG}"

# Also tag as environment-specific
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_REPO}:${ENVIRONMENT}"
docker push "${ECR_REPO}:${ENVIRONMENT}"

echo -e "${GREEN}Image pushed: ${ECR_REPO}:${IMAGE_TAG}${NC}"

# =============================================================================
# Step 2: Register New Task Definition
# =============================================================================

echo ""
echo -e "${YELLOW}Step 2/5: Registering task definition...${NC}"

# Generate task definition from template
TASK_DEF_TEMPLATE="${PROJECT_ROOT}/infrastructure/ecs/task-definition.json"

TASK_DEF=$(cat "${TASK_DEF_TEMPLATE}" | \
    sed "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" | \
    sed "s/\${IMAGE_TAG}/${IMAGE_TAG}/g" | \
    sed "s/\${ENVIRONMENT}/${ENVIRONMENT}/g")

# Register task definition
TASK_DEF_ARN=$(echo "${TASK_DEF}" | \
    aws ecs register-task-definition \
        --cli-input-json file:///dev/stdin \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)

echo -e "${GREEN}Task definition registered: ${TASK_DEF_ARN}${NC}"

# =============================================================================
# Step 3: Update ECS Service
# =============================================================================

echo ""
echo -e "${YELLOW}Step 3/5: Updating ECS service...${NC}"

aws ecs update-service \
    --cluster "${CLUSTER_NAME}" \
    --service "${SERVICE_NAME}" \
    --task-definition "${TASK_DEF_ARN}" \
    --force-new-deployment \
    > /dev/null

echo -e "${GREEN}Service update initiated${NC}"

# =============================================================================
# Step 4: Wait for Deployment
# =============================================================================

echo ""
echo -e "${YELLOW}Step 4/5: Waiting for deployment to stabilize...${NC}"

# Wait for service to stabilize (timeout: 10 minutes)
aws ecs wait services-stable \
    --cluster "${CLUSTER_NAME}" \
    --services "${SERVICE_NAME}" \
    --timeout 600 || {
        echo -e "${RED}Deployment did not stabilize within timeout${NC}"
        exit 1
    }

echo -e "${GREEN}Deployment stabilized${NC}"

# =============================================================================
# Step 5: Run Smoke Tests
# =============================================================================

echo ""
echo -e "${YELLOW}Step 5/5: Running smoke tests...${NC}"

"${PROJECT_ROOT}/scripts/smoke-test.sh" "${ENVIRONMENT}" || {
    echo -e "${RED}Smoke tests failed!${NC}"
    echo -e "${YELLOW}Consider rolling back...${NC}"
    exit 1
}

# =============================================================================
# Summary
# =============================================================================

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               DEPLOYMENT SUCCESSFUL                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment:       ${ENVIRONMENT}"
echo -e "Image:             ${ECR_REPO}:${IMAGE_TAG}"
echo -e "Task Definition:   ${TASK_DEF_ARN}"
echo -e "Deployed at:       $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Get service URL
if [[ "${ENVIRONMENT}" == "production" ]]; then
    echo -e "API URL: https://api.pantheon.example.com"
else
    echo -e "API URL: https://api.staging.pantheon.example.com"
fi
