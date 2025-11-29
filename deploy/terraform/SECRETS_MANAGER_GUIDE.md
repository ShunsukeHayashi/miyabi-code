# AWS Secrets Manager Setup Guide

This guide explains how to configure and use AWS Secrets Manager for the Miyabi Lambda functions.

## Overview

The Miyabi Lambda functions use AWS Secrets Manager to securely store sensitive credentials:
- GitHub Personal Access Token
- OAuth 2.1 credentials
- GitHub OAuth App credentials
- Project configuration

## Architecture

```
┌─────────────────┐
│  Lambda Function│
│  (miyabi-app)   │
└────────┬────────┘
         │
         │ 1. Fetch secrets
         │    (on cold start)
         ▼
┌─────────────────┐
│ Secrets Manager │
│                 │
│ • api-keys      │ ◄─── Encrypted with KMS
│ • config        │
└─────────────────┘
         ▲
         │ 2. Decrypt
         │
┌─────────────────┐
│   KMS Key       │
│ (miyabi-secrets)│
└─────────────────┘
```

## Terraform Resources

### 1. KMS Key (`aws_kms_key.secrets`)
- Purpose: Encrypt secrets at rest
- Key rotation: Enabled (automatic yearly rotation)
- Alias: `alias/miyabi-secrets`

### 2. Secrets
- **`miyabi/prod/api-keys`**: API keys and tokens
  - `GITHUB_TOKEN`
  - `MIYABI_ACCESS_TOKEN`
  - `OAUTH_CLIENT_ID`
  - `OAUTH_CLIENT_SECRET`
  - `OAUTH_ISSUER`
  - `GITHUB_OAUTH_CLIENT_ID`
  - `GITHUB_OAUTH_CLIENT_SECRET`
  - `GITHUB_OAUTH_CALLBACK_URL`

- **`miyabi/prod/config`**: Project configuration
  - `MIYABI_REPO_OWNER`
  - `MIYABI_REPO_NAME`
  - `BASE_URL`
  - `MIYABI_ROOT`

### 3. IAM Role (`aws_iam_role.lambda_execution`)
- Purpose: Lambda execution role
- Attached policies:
  - `AWSLambdaBasicExecutionRole` (AWS managed)
  - `miyabi-lambda-secrets-access` (custom)
  - `miyabi-lambda-github-access` (custom)

### 4. IAM Policy (`aws_iam_policy.secrets_access`)
- Allows:
  - `secretsmanager:GetSecretValue`
  - `secretsmanager:DescribeSecret`
  - `kms:Decrypt`

## Deployment Steps

### Step 1: Initialize Terraform

```bash
cd deploy/terraform
terraform init
```

### Step 2: Set Secrets via Environment Variables

**Option A: Export to shell**
```bash
export TF_VAR_github_token="ghp_xxxxxxxxxxxxxxxxxxxxx"
export TF_VAR_miyabi_access_token="your-secure-token"
export TF_VAR_github_oauth_client_id="your-github-oauth-id"
export TF_VAR_github_oauth_client_secret="your-github-oauth-secret"
export TF_VAR_github_oauth_callback_url="https://api.miyabi-world.com/auth/github/callback"
```

**Option B: Use `.tfvars` file (NOT committed to git)**
```bash
# Create terraform.tfvars (ignored by .gitignore)
cat > terraform.tfvars <<EOF
github_token              = "ghp_xxxxxxxxxxxxxxxxxxxxx"
miyabi_access_token       = "your-secure-token"
github_oauth_client_id    = "your-github-oauth-id"
github_oauth_client_secret = "your-github-oauth-secret"
github_oauth_callback_url  = "https://api.miyabi-world.com/auth/github/callback"
EOF
```

### Step 3: Plan and Apply

```bash
# Review changes
terraform plan

# Apply changes
terraform apply
```

### Step 4: Update Secrets (if needed)

Secrets are created with placeholder values. Update them via AWS Console or CLI:

**AWS Console:**
1. Go to AWS Secrets Manager
2. Find secret: `miyabi/prod/api-keys`
3. Click "Retrieve secret value"
4. Click "Edit"
5. Update JSON values
6. Click "Save"

**AWS CLI:**
```bash
aws secretsmanager put-secret-value \
  --secret-id miyabi/prod/api-keys \
  --secret-string '{
    "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxx",
    "MIYABI_ACCESS_TOKEN": "your-secure-token",
    "OAUTH_CLIENT_ID": "miyabi-mcp-client",
    "OAUTH_CLIENT_SECRET": "your-oauth-secret",
    "OAUTH_ISSUER": "https://miyabi-mcp.local",
    "GITHUB_OAUTH_CLIENT_ID": "your-github-oauth-id",
    "GITHUB_OAUTH_CLIENT_SECRET": "your-github-oauth-secret",
    "GITHUB_OAUTH_CALLBACK_URL": "https://api.miyabi-world.com/auth/github/callback"
  }'
```

## Lambda Function Integration

### Python Code Usage

The Lambda function automatically loads secrets on cold start:

```python
# In lambda_handler.py
from core.secrets import load_secrets_to_env

# Load secrets on cold start
load_secrets_to_env(project_name="miyabi", environment="prod")
```

This merges secrets into `os.environ`, making them available to the FastAPI app:

```python
# In main.py
import os

# These now come from Secrets Manager (in Lambda)
# or from .env file (in local development)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
MIYABI_ACCESS_TOKEN = os.getenv("MIYABI_ACCESS_TOKEN", "")
```

### Manual Secret Retrieval

If you need to fetch a specific secret:

```python
from core.secrets import get_secret

# Get entire secret
api_keys = get_secret("miyabi/prod/api-keys")

# Get specific key
github_token = get_secret("miyabi/prod/api-keys", "GITHUB_TOKEN")
```

## Security Best Practices

### 1. Least Privilege
- Lambda role only has read access to specific secrets
- KMS key can only be used via Secrets Manager

### 2. Encryption
- All secrets encrypted at rest with KMS
- Automatic key rotation enabled

### 3. Audit Trail
- All secret access logged to CloudWatch
- CloudTrail logs all KMS decrypt operations

### 4. Secret Rotation
- Implement secret rotation for long-lived credentials
- GitHub tokens should be rotated periodically

### 5. Environment Separation
- Use different secrets for dev/staging/prod
- Secret names include environment: `miyabi/{environment}/api-keys`

## Local Development

For local development, use `.env` file:

```bash
# openai-apps/miyabi-app/server/.env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
MIYABI_ACCESS_TOKEN=your-local-token
OAUTH_CLIENT_ID=miyabi-mcp-client
OAUTH_CLIENT_SECRET=your-local-secret
GITHUB_OAUTH_CLIENT_ID=your-github-oauth-id
GITHUB_OAUTH_CLIENT_SECRET=your-github-oauth-secret
```

The `load_secrets_to_env()` function automatically skips Secrets Manager when not running in Lambda.

## Monitoring

### CloudWatch Metrics

Monitor secret access:
- Metric: `SecretAccess`
- Namespace: `AWS/SecretsManager`

### CloudWatch Logs

Lambda execution logs include:
```
Successfully loaded secrets from miyabi/prod/api-keys and miyabi/prod/config
```

Or if running locally:
```
Not running in AWS Lambda, skipping Secrets Manager
```

### Alarms (Recommended)

Create alarms for:
1. Failed secret retrievals
2. KMS decrypt errors
3. Unauthorized access attempts

## Troubleshooting

### Error: "AccessDeniedException"

**Cause**: Lambda role lacks permission to access secret

**Solution**:
```bash
# Verify IAM role has secrets policy attached
aws iam list-attached-role-policies --role-name miyabi-lambda-execution

# Re-apply Terraform if needed
terraform apply
```

### Error: "ResourceNotFoundException"

**Cause**: Secret doesn't exist

**Solution**:
```bash
# List secrets
aws secretsmanager list-secrets --query 'SecretList[?starts_with(Name, `miyabi/`)]'

# Create if missing
terraform apply
```

### Error: "KMS.DecryptException"

**Cause**: KMS key policy doesn't allow Lambda to decrypt

**Solution**:
```bash
# Check KMS key policy
aws kms get-key-policy --key-id alias/miyabi-secrets --policy-name default

# Re-apply Terraform to fix
terraform apply
```

## Cost Optimization

### Secrets Manager Pricing (us-west-2)
- $0.40 per secret per month
- $0.05 per 10,000 API calls

**Estimated cost for Miyabi:**
- 2 secrets × $0.40 = $0.80/month
- ~1,000 Lambda cold starts/month × $0.05/10,000 = $0.005/month
- **Total: ~$0.81/month**

### Optimization Tips
1. Use caching (`@lru_cache`) to reduce API calls
2. Combine related secrets into single JSON secret
3. Use Lambda environment variables for non-sensitive config

## Cleanup

To remove all Secrets Manager resources:

```bash
# Delete secrets (with 30-day recovery window)
terraform destroy

# Or force immediate deletion (no recovery)
aws secretsmanager delete-secret \
  --secret-id miyabi/prod/api-keys \
  --force-delete-without-recovery
```

## References

- [AWS Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/)
- [Lambda Environment Variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
- [KMS Key Rotation](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html)

---

**Last Updated**: 2025-11-29
**Maintainer**: Miyabi DevOps Team
