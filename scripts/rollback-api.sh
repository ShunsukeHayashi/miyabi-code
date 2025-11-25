#!/bin/bash
# Miyabi API Rollback Script
# Issue: #993 - Phase 4.6: Production Launch
#
# Usage:
#   ./scripts/rollback-api.sh [staging|production] [revision]
#
# Examples:
#   ./scripts/rollback-api.sh production         # Rollback to previous version
#   ./scripts/rollback-api.sh production 5       # Rollback to specific revision

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parameters
ENVIRONMENT="${1:-staging}"
REVISION="${2:-}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

# Validate
if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
    echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'.${NC}"
    exit 1
fi

# ECS Configuration
CLUSTER_NAME="miyabi-${ENVIRONMENT}"
SERVICE_NAME="miyabi-api"
TASK_FAMILY="miyabi-web-api"

echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                 MIYABI API ROLLBACK                          ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment:  ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Cluster:      ${CLUSTER_NAME}"
echo -e "Service:      ${SERVICE_NAME}"
echo ""

# =============================================================================
# Step 1: Get Current and Target Task Definition
# =============================================================================

echo -e "${YELLOW}Step 1/4: Getting task definitions...${NC}"

# Get current task definition
CURRENT_TASK=$(aws ecs describe-services \
    --cluster "${CLUSTER_NAME}" \
    --services "${SERVICE_NAME}" \
    --query 'services[0].taskDefinition' \
    --output text)

CURRENT_REVISION=$(echo "${CURRENT_TASK}" | grep -oE '[0-9]+$')
echo "Current revision: ${CURRENT_REVISION}"

# Determine target revision
if [[ -z "${REVISION}" ]]; then
    # Default: rollback to previous revision
    TARGET_REVISION=$((CURRENT_REVISION - 1))
else
    TARGET_REVISION="${REVISION}"
fi

if [[ ${TARGET_REVISION} -lt 1 ]]; then
    echo -e "${RED}Error: Cannot rollback further. No previous revision exists.${NC}"
    exit 1
fi

TARGET_TASK="arn:aws:ecs:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):task-definition/${TASK_FAMILY}:${TARGET_REVISION}"

echo "Target revision: ${TARGET_REVISION}"
echo ""

# =============================================================================
# Step 2: Confirm Rollback
# =============================================================================

echo -e "${YELLOW}Step 2/4: Confirming rollback...${NC}"

# Show task definition details
echo "Rolling back from:"
echo "  ${CURRENT_TASK}"
echo ""
echo "Rolling back to:"
echo "  ${TARGET_TASK}"
echo ""

if [[ "${ENVIRONMENT}" == "production" ]]; then
    echo -e "${RED}WARNING: This is a PRODUCTION rollback!${NC}"
    read -p "Type 'ROLLBACK' to confirm: " CONFIRM
    if [[ "${CONFIRM}" != "ROLLBACK" ]]; then
        echo "Rollback cancelled."
        exit 1
    fi
fi

# =============================================================================
# Step 3: Execute Rollback
# =============================================================================

echo ""
echo -e "${YELLOW}Step 3/4: Executing rollback...${NC}"

aws ecs update-service \
    --cluster "${CLUSTER_NAME}" \
    --service "${SERVICE_NAME}" \
    --task-definition "${TARGET_TASK}" \
    --force-new-deployment \
    > /dev/null

echo "Rollback initiated. Waiting for stabilization..."

# Wait for service to stabilize
aws ecs wait services-stable \
    --cluster "${CLUSTER_NAME}" \
    --services "${SERVICE_NAME}" \
    --timeout 600 || {
        echo -e "${RED}Rollback did not stabilize within timeout${NC}"
        exit 1
    }

echo -e "${GREEN}Rollback stabilized${NC}"

# =============================================================================
# Step 4: Verify Rollback
# =============================================================================

echo ""
echo -e "${YELLOW}Step 4/4: Verifying rollback...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${SCRIPT_DIR}/smoke-test.sh" "${ENVIRONMENT}" || {
    echo -e "${RED}Smoke tests failed after rollback!${NC}"
    echo -e "${RED}Manual intervention may be required.${NC}"
    exit 1
}

# =============================================================================
# Summary
# =============================================================================

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               ROLLBACK SUCCESSFUL                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Environment:       ${ENVIRONMENT}"
echo -e "Previous Revision: ${CURRENT_REVISION}"
echo -e "Current Revision:  ${TARGET_REVISION}"
echo -e "Rolled back at:    $(date '+%Y-%m-%d %H:%M:%S')"
