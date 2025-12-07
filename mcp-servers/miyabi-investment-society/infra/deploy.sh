#!/bin/bash
set -e

# Miyabi Investment Society - Deployment Script
# Usage: ./deploy.sh [staging|production]

ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-ap-northeast-1}
STACK_NAME="miyabi-investment-society-${ENVIRONMENT}"

echo "=== Miyabi Investment Society Deployment ==="
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${AWS_REGION}"
echo ""

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: ${AWS_ACCOUNT_ID}"

# ECR Repository URI
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/miyabi-investment-society"

# Step 1: Build Docker Image
echo ""
echo "=== Step 1: Building Docker Image ==="
cd "$(dirname "$0")/.."
docker build -t miyabi-investment-society:latest .

# Step 2: Login to ECR
echo ""
echo "=== Step 2: ECR Login ==="
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Step 3: Tag and Push Image
echo ""
echo "=== Step 3: Pushing to ECR ==="
docker tag miyabi-investment-society:latest ${ECR_REPO}:latest
docker tag miyabi-investment-society:latest ${ECR_REPO}:$(git rev-parse --short HEAD)
docker push ${ECR_REPO}:latest
docker push ${ECR_REPO}:$(git rev-parse --short HEAD)

# Step 4: Deploy CloudFormation Stack
echo ""
echo "=== Step 4: Deploying CloudFormation Stack ==="
aws cloudformation deploy \
  --template-file infra/cloudformation.yaml \
  --stack-name ${STACK_NAME} \
  --parameter-overrides \
    Environment=${ENVIRONMENT} \
    VpcId=${VPC_ID} \
    SubnetIds=${SUBNET_IDS} \
    DomainName=${DOMAIN_NAME:-invest.miyabi-world.com} \
    HostedZoneId=${HOSTED_ZONE_ID} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${AWS_REGION}

# Step 5: Get Outputs
echo ""
echo "=== Deployment Complete ==="
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --query 'Stacks[0].Outputs' \
  --output table \
  --region ${AWS_REGION}

echo ""
echo "Investment Society MCP Server deployed successfully!"
