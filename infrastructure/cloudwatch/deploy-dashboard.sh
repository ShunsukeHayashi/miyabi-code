#!/bin/bash
# CloudWatch Dashboard Deployment Script
# Issue: #847 - CloudWatch監視ダッシュボード構築
#
# Usage:
#   ./deploy-dashboard.sh [staging|production] [email@example.com]
#
# Examples:
#   ./deploy-dashboard.sh staging
#   ./deploy-dashboard.sh production alerts@company.com

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/dashboard.yaml"

# Parameters
ENVIRONMENT="${1:-staging}"
ALARM_EMAIL="${2:-}"
STACK_NAME="miyabi-cloudwatch-${ENVIRONMENT}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

# Validate environment
if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
    echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'.${NC}"
    exit 1
fi

# Check template exists
if [[ ! -f "${TEMPLATE_FILE}" ]]; then
    echo -e "${RED}Error: Template file not found at ${TEMPLATE_FILE}${NC}"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    exit 1
fi

echo -e "${BLUE}=== CloudWatch Dashboard Deployment ===${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Stack Name: ${STACK_NAME}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo ""

# Build parameter overrides
PARAMETERS="Environment=${ENVIRONMENT}"

if [[ -n "${ALARM_EMAIL}" ]]; then
    PARAMETERS="${PARAMETERS} AlarmEmail=${ALARM_EMAIL}"
    echo -e "${YELLOW}Alarm notifications will be sent to: ${ALARM_EMAIL}${NC}"
fi

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID}" ]]; then
    PARAMETERS="${PARAMETERS} CloudFrontDistributionId=${CLOUDFRONT_DISTRIBUTION_ID}"
fi

if [[ -n "${API_SERVICE_NAME}" ]]; then
    PARAMETERS="${PARAMETERS} ApiServiceName=${API_SERVICE_NAME}"
fi

if [[ -n "${WEBAPP_BUCKET_NAME}" ]]; then
    PARAMETERS="${PARAMETERS} WebAppBucketName=${WEBAPP_BUCKET_NAME}"
fi

echo ""
echo -e "${YELLOW}Validating template...${NC}"
aws cloudformation validate-template \
    --template-body "file://${TEMPLATE_FILE}" \
    --region "${AWS_REGION}" > /dev/null

echo -e "${GREEN}Template validation passed.${NC}"

echo ""
echo -e "${YELLOW}Deploying CloudFormation stack...${NC}"

aws cloudformation deploy \
    --template-file "${TEMPLATE_FILE}" \
    --stack-name "${STACK_NAME}" \
    --parameter-overrides ${PARAMETERS} \
    --capabilities CAPABILITY_IAM \
    --region "${AWS_REGION}" \
    --tags \
        Project=Miyabi \
        Environment="${ENVIRONMENT}" \
        ManagedBy=CloudFormation

echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""

# Get stack outputs
echo -e "${YELLOW}Stack Outputs:${NC}"
aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo -e "${GREEN}Dashboard URL:${NC}"
aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardUrl`].OutputValue' \
    --output text
