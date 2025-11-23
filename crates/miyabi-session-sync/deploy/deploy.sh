#!/bin/bash
# ============================================
# Miyabi Session Sync - Deployment Script
# AWS Fargate/Lambda へのデプロイ
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 環境変数
ENVIRONMENT="${DEPLOY_ENV:-dev}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"

echo -e "${GREEN}🚀 Miyabi Session Sync Deployment${NC}"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo ""

# AWS Account ID取得
if [ -z "$AWS_ACCOUNT_ID" ]; then
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
fi

ECR_REPO="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/miyabi-session-sync-$ENVIRONMENT"

# 引数処理
case "${1:-all}" in
    docker)
        echo -e "${YELLOW}📦 Building Docker image...${NC}"
        cd "$PROJECT_ROOT"
        docker build -t miyabi-session-sync:latest -f crates/miyabi-session-sync/Dockerfile .

        echo -e "${YELLOW}🏷️  Tagging image...${NC}"
        docker tag miyabi-session-sync:latest "$ECR_REPO:latest"

        echo -e "${YELLOW}🔑 Logging into ECR...${NC}"
        aws ecr get-login-password --region "$AWS_REGION" | \
            docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

        echo -e "${YELLOW}⬆️  Pushing to ECR...${NC}"
        docker push "$ECR_REPO:latest"

        echo -e "${GREEN}✅ Docker image pushed successfully${NC}"
        ;;

    lambda)
        echo -e "${YELLOW}📦 Building Lambda package...${NC}"
        cd "$PROJECT_ROOT"

        # Cross-compile for Lambda (AL2023)
        cargo lambda build --release -p miyabi-session-sync

        # Package
        mkdir -p "$SCRIPT_DIR/target/lambda"
        cp target/lambda/miyabi-session-sync/bootstrap "$SCRIPT_DIR/target/lambda/"

        echo -e "${GREEN}✅ Lambda package built${NC}"
        ;;

    cdk)
        echo -e "${YELLOW}🏗️  Deploying with CDK...${NC}"
        cd "$SCRIPT_DIR/cdk"

        # Install dependencies
        npm install

        # Build TypeScript
        npm run build

        # Deploy
        npm run deploy:$ENVIRONMENT

        echo -e "${GREEN}✅ CDK deployment complete${NC}"
        ;;

    all)
        # Full deployment
        $0 docker
        $0 cdk
        ;;

    *)
        echo "Usage: $0 {docker|lambda|cdk|all}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
