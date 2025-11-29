# Miyabi Infrastructure - Terraform

AWS infrastructure for the Miyabi project, including:
- S3 + CloudFront for static website hosting
- AWS Secrets Manager for secure credential storage
- IAM roles and policies for Lambda functions
- KMS encryption for secrets

## Quick Start

### Prerequisites

1. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

2. **Terraform** installed (>= 1.5.0):
   ```bash
   terraform version
   ```

3. **AWS Account ID**: 112530848482 (Hayashi)

### Initial Setup

```bash
# Navigate to Terraform directory
cd deploy/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### Set Secrets

After initial deployment, update secrets with actual values:

**Option 1: AWS Console**
1. Go to AWS Secrets Manager
2. Find `miyabi/prod/api-keys`
3. Edit and update values

**Option 2: AWS CLI**
```bash
aws secretsmanager put-secret-value \
  --secret-id miyabi/prod/api-keys \
  --secret-string '{
    "GITHUB_TOKEN": "ghp_your_token_here",
    "MIYABI_ACCESS_TOKEN": "your_access_token",
    "OAUTH_CLIENT_SECRET": "your_oauth_secret",
    "GITHUB_OAUTH_CLIENT_ID": "your_github_oauth_id",
    "GITHUB_OAUTH_CLIENT_SECRET": "your_github_oauth_secret",
    "GITHUB_OAUTH_CALLBACK_URL": "https://api.miyabi-world.com/auth/github/callback"
  }'
```

## Project Structure

```
deploy/terraform/
├── main.tf                       # S3 + CloudFront configuration
├── variables.tf                  # Input variables
├── outputs.tf                    # Output values
├── secrets.tf                    # Secrets Manager + IAM
├── SECRETS_MANAGER_GUIDE.md      # Detailed secrets guide
└── README.md                     # This file
```

## Resources Created

### 1. Secrets Manager
- **KMS Key**: `alias/miyabi-secrets` (for encryption)
- **Secret 1**: `miyabi/prod/api-keys` (API tokens)
- **Secret 2**: `miyabi/prod/config` (project config)

### 2. S3 Buckets
- **WebUI Bucket**: `miyabi-webui-{account-id}`
- **Lambda Artifacts**: (if defined elsewhere)

### 3. CloudFront
- **Distribution**: For static website hosting
- **Custom domain**: miyabi-world.com (if ACM cert provided)

### 4. IAM Roles
- **Lambda Execution Role**: `miyabi-lambda-execution`
  - Policies:
    - AWSLambdaBasicExecutionRole
    - miyabi-lambda-secrets-access
    - miyabi-lambda-github-access

## Variables

### Required Variables

Set via environment variables or `terraform.tfvars`:

```bash
# GitHub credentials
export TF_VAR_github_token="ghp_xxxxx"
export TF_VAR_github_oauth_client_id="xxxxx"
export TF_VAR_github_oauth_client_secret="xxxxx"

# Miyabi credentials
export TF_VAR_miyabi_access_token="xxxxx"
export TF_VAR_oauth_client_secret="xxxxx"
```

### Optional Variables

```hcl
# variables.tf (defaults provided)
aws_region              = "us-west-2"
aws_account_id          = "112530848482"
environment             = "prod"
project_name            = "miyabi"
domain_name             = "miyabi-world.com"
```

## Outputs

After `terraform apply`, view outputs:

```bash
terraform output

# Example outputs:
# cloudfront_domain_name = "d1234567890.cloudfront.net"
# website_url = "https://miyabi-world.com"
# secrets_kms_key_arn = "arn:aws:kms:us-west-2:112530848482:key/..."
# lambda_execution_role_arn = "arn:aws:iam::112530848482:role/miyabi-lambda-execution"
```

## Common Tasks

### Update Secrets

```bash
# Update API keys
aws secretsmanager update-secret \
  --secret-id miyabi/prod/api-keys \
  --secret-string file://secrets.json
```

### Deploy Frontend

```bash
# Build frontend
cd miyabi-console
npm run build

# Sync to S3
aws s3 sync dist/ s3://$(terraform output -raw s3_bucket_name)/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### View Secret Values

```bash
# View API keys
aws secretsmanager get-secret-value \
  --secret-id miyabi/prod/api-keys \
  --query SecretString \
  --output text | jq .

# View specific key
aws secretsmanager get-secret-value \
  --secret-id miyabi/prod/api-keys \
  --query SecretString \
  --output text | jq -r .GITHUB_TOKEN
```

### Rotate KMS Key

KMS keys auto-rotate yearly. To manually rotate:

```bash
# Check rotation status
aws kms get-key-rotation-status \
  --key-id alias/miyabi-secrets

# Enable rotation (already enabled)
aws kms enable-key-rotation \
  --key-id alias/miyabi-secrets
```

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.gitignore` for `terraform.tfvars`
   - Use environment variables for CI/CD

2. **Use least privilege IAM**
   - Lambda role only has access to specific secrets
   - Secrets are encrypted with dedicated KMS key

3. **Enable CloudTrail**
   - Audit all secret access
   - Monitor KMS decrypt operations

4. **Rotate credentials regularly**
   - GitHub tokens: Every 90 days
   - OAuth secrets: Every 180 days

5. **Use separate environments**
   - `miyabi/dev/api-keys`
   - `miyabi/staging/api-keys`
   - `miyabi/prod/api-keys`

## Troubleshooting

### Error: "InvalidClientTokenId"
**Cause**: AWS credentials not configured

**Solution**:
```bash
aws configure
# Or set environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

### Error: "ResourceAlreadyExistsException"
**Cause**: Resources already exist

**Solution**:
```bash
# Import existing resources
terraform import aws_s3_bucket.webui miyabi-webui-112530848482

# Or use different resource names
```

### Error: "AccessDenied" for KMS
**Cause**: IAM user lacks KMS permissions

**Solution**:
Add KMS permissions to IAM user:
```json
{
  "Effect": "Allow",
  "Action": [
    "kms:CreateKey",
    "kms:DescribeKey",
    "kms:PutKeyPolicy"
  ],
  "Resource": "*"
}
```

## Cost Estimate

**Monthly costs (us-west-2):**

| Resource | Quantity | Unit Cost | Monthly Cost |
|----------|----------|-----------|--------------|
| Secrets Manager | 2 secrets | $0.40/secret | $0.80 |
| Secrets Manager API | ~1,000 calls | $0.05/10k | $0.01 |
| KMS | 1 key | $1.00/key | $1.00 |
| S3 (WebUI) | ~500MB | $0.023/GB | $0.01 |
| CloudFront | ~10GB transfer | $0.085/GB | $0.85 |
| **Total** | | | **~$2.67/month** |

*Lambda costs not included (depends on invocations)*

## Cleanup

To destroy all resources:

```bash
# Review what will be deleted
terraform plan -destroy

# Destroy (with confirmation)
terraform destroy

# Force destroy (no confirmation)
terraform destroy -auto-approve
```

**Note**: Secrets have a 30-day recovery window. To force immediate deletion:

```bash
aws secretsmanager delete-secret \
  --secret-id miyabi/prod/api-keys \
  --force-delete-without-recovery
```

## Related Documentation

- [SECRETS_MANAGER_GUIDE.md](./SECRETS_MANAGER_GUIDE.md) - Detailed Secrets Manager guide
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Support

For issues or questions:
- GitHub Issues: https://github.com/customer-cloud/miyabi-private/issues
- Documentation: `SECRETS_MANAGER_GUIDE.md`

---

**Last Updated**: 2025-11-29
**Maintainer**: Miyabi DevOps Team
**AWS Account**: 112530848482 (Hayashi)
**Region**: us-west-2
