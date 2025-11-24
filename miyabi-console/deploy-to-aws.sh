#!/bin/bash

# Miyabi Console - AWS Deployment Script
# Deploys static React app to S3 with CloudFront

set -e

# Configuration
BUCKET_NAME="miyabi-console-dev"
REGION="us-east-1"
AWS_ACCOUNT="112530848482"

echo "🚀 Miyabi Console - AWS Deployment"
echo "=================================="
echo ""

# Check if bucket exists
echo "📦 Checking S3 bucket..."
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating bucket: ${BUCKET_NAME}"
    aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION}

    # Disable block public access FIRST
    echo "🔧 Configuring bucket access..."
    aws s3api put-public-access-block \
        --bucket ${BUCKET_NAME} \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

    # Enable static website hosting
    echo "🌐 Configuring static website hosting..."
    aws s3 website "s3://${BUCKET_NAME}" \
        --index-document index.html \
        --error-document index.html

    # Set bucket policy for public read access
    echo "🔓 Setting public read access..."
    cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket ${BUCKET_NAME} --policy file:///tmp/bucket-policy.json
else
    echo "✅ Bucket already exists: ${BUCKET_NAME}"
fi

# Sync dist folder to S3
echo ""
echo "📤 Uploading files to S3..."
aws s3 sync ./dist/ "s3://${BUCKET_NAME}/" \
    --delete \
    --cache-control "public,max-age=31536000" \
    --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp ./dist/index.html "s3://${BUCKET_NAME}/index.html" \
    --cache-control "no-cache,no-store,must-revalidate"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Website URL:"
echo "   http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"
echo ""
echo "📝 To create CloudFront distribution (optional):"
echo "   aws cloudfront create-distribution --origin-domain-name ${BUCKET_NAME}.s3.amazonaws.com"
echo ""
