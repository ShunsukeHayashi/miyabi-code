# Lambda Artifacts S3 Bucket

This Terraform configuration creates an S3 bucket specifically designed for storing Lambda function deployment packages (code artifacts).

## Overview

The S3 bucket provides a secure, versioned storage location for Lambda deployment packages (.zip files), enabling:

- **Code Versioning**: Track and rollback Lambda function deployments
- **Lifecycle Management**: Automatically archive old versions to reduce costs
- **Security**: Encrypted at rest with AES256, private access only
- **Access Control**: Strict IAM policies for Lambda service and deployment roles

## Resources Created

### Primary Resources

1. **S3 Bucket**: `miyabi-lambda-artifacts-{account_id}`
   - Naming: `{project_name}-lambda-artifacts-{aws_account_id}`
   - Purpose: Store Lambda deployment packages

2. **Bucket Versioning**: Enabled
   - Allows rollback to previous Lambda versions
   - Supports disaster recovery

3. **Server-Side Encryption**: AES256
   - All objects encrypted at rest
   - Bucket key enabled for cost optimization

4. **Public Access Block**: Fully blocked
   - Block public ACLs
   - Block public policies
   - Ignore public ACLs
   - Restrict public buckets

### Lifecycle Policies

#### Archive Old Versions
- **Day 30**: Move to STANDARD_IA (Infrequent Access)
- **Day 90**: Move to GLACIER
- **Day 365**: Delete non-current versions

#### Cleanup Incomplete Uploads
- **Day 7**: Abort incomplete multipart uploads

### Bucket Policy

The bucket policy grants:

1. **Lambda Service Read Access**
   - `s3:GetObject`
   - `s3:GetObjectVersion`
   - Scoped to same AWS account

2. **Deployment Role Write Access**
   - `s3:PutObject`
   - `s3:PutObjectAcl`
   - `s3:GetObject`
   - `s3:ListBucket`
   - Scoped to root account principals

3. **Security Enforcement**
   - Deny all operations over insecure transport (HTTP)
   - Require HTTPS for all S3 operations

## Usage

### Deploy the Bucket

```bash
cd deploy/terraform

# Initialize Terraform (first time only)
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Upload Lambda Artifact

```bash
# Package Lambda function
cd openai-apps/miyabi-app/server
zip -r miyabi-function.zip .

# Upload to S3 (organized by function name and version)
aws s3 cp miyabi-function.zip \
  s3://miyabi-lambda-artifacts-112530848482/miyabi-mcp-server/v1.0.0/function.zip

# Verify upload
aws s3 ls s3://miyabi-lambda-artifacts-112530848482/miyabi-mcp-server/v1.0.0/
```

### Update Lambda Function Code

```bash
# Update Lambda function from S3
aws lambda update-function-code \
  --function-name miyabi-mcp-server \
  --s3-bucket miyabi-lambda-artifacts-112530848482 \
  --s3-key miyabi-mcp-server/v1.0.0/function.zip

# Verify update
aws lambda get-function --function-name miyabi-mcp-server
```

### Recommended Directory Structure in S3

```
miyabi-lambda-artifacts-{account_id}/
├── miyabi-mcp-server/
│   ├── v1.0.0/
│   │   └── function.zip
│   ├── v1.0.1/
│   │   └── function.zip
│   └── v1.1.0/
│       └── function.zip
├── miyabi-webhook-handler/
│   └── v1.0.0/
│       └── function.zip
└── miyabi-cron-job/
    └── v1.0.0/
        └── function.zip
```

## Security Best Practices

### 1. Use HTTPS Only
The bucket policy enforces HTTPS:
```json
{
  "Condition": {
    "Bool": {
      "aws:SecureTransport": "false"
    }
  }
}
```

### 2. Principle of Least Privilege
Lambda execution role has minimal permissions:
- Read-only access to artifacts
- Scoped to specific bucket

### 3. Encryption at Rest
All objects are encrypted with AES256:
- Server-side encryption enabled
- Bucket key optimization enabled

### 4. Versioning for Rollback
Enable version tracking:
- Quick rollback in case of issues
- Audit trail of all deployments

### 5. Lifecycle Cost Optimization
Automatic archival:
- 30 days → STANDARD_IA
- 90 days → GLACIER
- 365 days → Delete

## Terraform Outputs

After applying, Terraform provides these outputs:

```bash
terraform output lambda_artifacts_bucket_name
# Output: miyabi-lambda-artifacts-112530848482

terraform output lambda_artifacts_bucket_arn
# Output: arn:aws:s3:::miyabi-lambda-artifacts-112530848482

terraform output lambda_deploy_command_example
# Output: Example commands for uploading and deploying
```

## Cost Estimation

### S3 Storage Costs (us-west-2)

| Tier | Storage | Cost/GB/Month | Example Monthly Cost |
|------|---------|---------------|---------------------|
| STANDARD | 10 GB | $0.023 | $0.23 |
| STANDARD_IA | 10 GB | $0.0125 | $0.13 |
| GLACIER | 10 GB | $0.004 | $0.04 |

### Request Costs
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests

### Example Monthly Cost (10 deployments/month, 100MB each)
- Storage: ~$0.25/month
- Requests: ~$0.05/month
- **Total**: ~$0.30/month

## Troubleshooting

### Issue: Access Denied when uploading

**Solution**: Verify your AWS credentials have PutObject permission:

```bash
# Check current identity
aws sts get-caller-identity

# Test upload with explicit profile
aws s3 cp test.zip s3://miyabi-lambda-artifacts-112530848482/test/ \
  --profile miyabi-admin
```

### Issue: Lambda cannot read from bucket

**Solution**: Verify Lambda execution role has GetObject permission:

```bash
# Check Lambda role
aws lambda get-function --function-name miyabi-mcp-server \
  --query 'Configuration.Role'

# Verify role permissions
aws iam get-role-policy --role-name miyabi-lambda-execution-role \
  --policy-name lambda-s3-artifacts-read
```

### Issue: Old versions not being archived

**Solution**: Lifecycle rules apply after the specified days:

```bash
# Check lifecycle configuration
aws s3api get-bucket-lifecycle-configuration \
  --bucket miyabi-lambda-artifacts-112530848482

# Force lifecycle execution (wait 24 hours for AWS processing)
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy Lambda Function

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Package Lambda function
        run: |
          cd openai-apps/miyabi-app/server
          zip -r function.zip .

      - name: Upload to S3
        run: |
          VERSION=$(git describe --tags --always)
          aws s3 cp function.zip \
            s3://miyabi-lambda-artifacts-112530848482/miyabi-mcp-server/${VERSION}/function.zip

      - name: Update Lambda function
        run: |
          VERSION=$(git describe --tags --always)
          aws lambda update-function-code \
            --function-name miyabi-mcp-server \
            --s3-bucket miyabi-lambda-artifacts-112530848482 \
            --s3-key miyabi-mcp-server/${VERSION}/function.zip
```

## Related Resources

- **Lambda Function**: `lambda.tf` - Lambda function configuration
- **IAM Roles**: `iam.tf` - Lambda execution roles and policies
- **Secrets Manager**: `secrets.tf` - Secrets for Lambda environment variables
- **API Gateway**: `api-gateway.tf` - API Gateway integration

## References

- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [AWS Lambda Deployment Packages](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-package.html)
- [Terraform AWS S3 Bucket](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket)
