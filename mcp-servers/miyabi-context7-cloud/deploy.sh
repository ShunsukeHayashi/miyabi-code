#!/bin/bash
# Miyabi Context7 Cloud - Deployment Script

set -e

STAGE=${1:-prod}
REGION=${AWS_REGION:-ap-northeast-1}

echo "🚀 Deploying Miyabi Context7 Cloud - Stage: $STAGE"
echo "=================================================="

# Navigate to infrastructure directory
cd "$(dirname "$0")/infrastructure"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build Lambda layers
echo "🔧 Building Lambda layers..."
mkdir -p lambda/layers/shared/python
pip install \
    psycopg2-binary \
    redis \
    boto3 \
    -t lambda/layers/shared/python

# Bootstrap CDK (if needed)
echo "🏗️ Bootstrapping CDK..."
cdk bootstrap aws://$AWS_ACCOUNT_ID/$REGION --context stage=$STAGE || true

# Synthesize
echo "📋 Synthesizing CloudFormation templates..."
cdk synth --context stage=$STAGE

# Deploy
echo "🚀 Deploying stacks..."
cdk deploy --all \
    --context stage=$STAGE \
    --require-approval never \
    --outputs-file outputs.json

# Show outputs
echo ""
echo "✅ Deployment Complete!"
echo "======================"
cat outputs.json | jq '.'

echo ""
echo "📋 Next Steps:"
echo "1. Configure DNS for your custom domain"
echo "2. Set up Cognito user pool triggers if needed"
echo "3. Initialize database schema:"
echo "   aws lambda invoke --function-name miyabi-context7-indexer-$STAGE --payload '{\"action\":\"init_schema\"}' response.json"
echo ""
echo "4. Index your first document:"
echo "   curl -X POST https://YOUR_API_URL/v1/index \\"
echo "     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"library_id\":\"/my/docs\",\"content\":\"# My Docs\\n...\"}'"
