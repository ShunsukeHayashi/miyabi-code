# AWS IAM Role Design for Miyabi Lambda Functions

**Last Updated**: 2025-11-29
**Version**: 1.0.0
**Author**: A2-Worker
**Principle**: Least Privilege (PoLP)

---

## 📋 Overview

This document describes the IAM role and policy design for Miyabi Lambda functions, following the **Principle of Least Privilege (PoLP)**. Each policy grants only the minimal permissions required for the Lambda function to operate.

---

## 🎯 Design Goals

1. **Minimal Permissions**: Grant only what's absolutely necessary
2. **Resource-Scoped**: Limit access to specific resources (no wildcards unless unavoidable)
3. **Separation of Concerns**: Separate policies for different resource types
4. **Easy Auditing**: Clear policy names and descriptions
5. **Secure by Default**: Optional policies are commented out until needed

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         aws_iam_role.lambda_execution           │
│   (Miyabi Lambda Execution Role)                │
└─────────────────────────────────────────────────┘
                      │
                      ├─── [REQUIRED] AWSLambdaBasicExecutionRole (AWS Managed)
                      │    └─ CloudWatch Logs write permissions
                      │
                      ├─── [ACTIVE] lambda_s3_read (Custom)
                      │    └─ Read-only access to WebUI S3 bucket
                      │
                      ├─── [ACTIVE] lambda_secrets_read (Custom)
                      │    └─ Read secrets from Secrets Manager
                      │
                      ├─── [OPTIONAL] lambda_dynamodb_access (Custom)
                      │    └─ Read/Write to DynamoDB tables
                      │
                      ├─── [OPTIONAL] lambda_vpc_execution (Custom)
                      │    └─ VPC network interface management
                      │
                      ├─── [OPTIONAL] lambda_xray (Custom)
                      │    └─ X-Ray tracing
                      │
                      └─── [OPTIONAL] lambda_kms_decrypt (Custom)
                           └─ Decrypt environment variables with KMS
```

---

## 📦 IAM Policies

### 1. **Base Execution Role**

#### `aws_iam_role.lambda_execution`

**Purpose**: Main IAM role assumed by Lambda functions

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Attached Policies**: See below

---

### 2. **CloudWatch Logs** (AWS Managed)

#### `AWSLambdaBasicExecutionRole`

**Purpose**: Allow Lambda to write logs to CloudWatch

**Permissions**:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

**Status**: ✅ **REQUIRED** - Always attached

---

### 3. **S3 Read Access** (Custom)

#### `miyabi-lambda-s3-read`

**Purpose**: Read-only access to WebUI S3 bucket

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadWebUIBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::miyabi-webui-112530848482",
        "arn:aws:s3:::miyabi-webui-112530848482/*"
      ]
    }
  ]
}
```

**Status**: ✅ **ACTIVE** - Attached by default

**Use Case**:
- Lambda reads static assets from S3
- Serving files via Lambda@Edge or function URL

**Justification**: Scoped to specific bucket only, read-only

---

### 4. **Secrets Manager Access** (Custom)

#### `miyabi-lambda-secrets-read`

**Purpose**: Read sensitive configuration from AWS Secrets Manager

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadMiyabiSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-west-2:112530848482:secret:miyabi/*"
      ]
    }
  ]
}
```

**Status**: ✅ **ACTIVE** - Attached by default

**Use Case**:
- Storing GitHub tokens
- OAuth client secrets
- API keys for external services

**Justification**:
- Scoped to `miyabi/*` secrets only
- Read-only (no update/delete permissions)

---

### 5. **DynamoDB Access** (Custom)

#### `miyabi-lambda-dynamodb-access`

**Purpose**: Read/Write access to Miyabi DynamoDB tables

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AccessMiyabiTables",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-2:112530848482:table/miyabi-*"
      ]
    }
  ]
}
```

**Status**: ⚪ **OPTIONAL** - Commented out (uncomment when DynamoDB is created)

**Use Case**:
- OAuth token storage
- Agent execution state
- MCP request logs

**Justification**:
- Scoped to `miyabi-*` tables only
- No `DeleteTable` or admin permissions
- No `DeleteItem` permission (can be added if needed)

**To Enable**:
```hcl
# Uncomment in iam.tf:
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}
```

---

### 6. **VPC Execution** (Custom)

#### `miyabi-lambda-vpc-execution`

**Purpose**: Allow Lambda to run in VPC and access private resources

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VPCNetworkInterfaces",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      "Resource": "*"
    }
  ]
}
```

**Status**: ⚪ **OPTIONAL** - Commented out (uncomment when Lambda is deployed in VPC)

**Use Case**:
- Accessing RDS database in VPC
- Connecting to ElastiCache
- Internal API calls within VPC

**Justification**:
- EC2 network interface actions don't support resource-level permissions
- Required only when Lambda is in VPC

**To Enable**:
```hcl
# Uncomment in iam.tf:
resource "aws_iam_role_policy_attachment" "lambda_vpc_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_vpc_execution.arn
}
```

---

### 7. **X-Ray Tracing** (Custom)

#### `miyabi-lambda-xray`

**Purpose**: Enable AWS X-Ray distributed tracing

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "XRayTracing",
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Status**: ⚪ **OPTIONAL** - Commented out (uncomment when X-Ray is enabled)

**Use Case**:
- Debugging Lambda performance
- Tracing MCP requests
- Identifying bottlenecks

**Justification**:
- X-Ray actions don't support resource-level permissions
- Read-only trace submission

**To Enable**:
```hcl
# Uncomment in iam.tf:
resource "aws_iam_role_policy_attachment" "lambda_xray_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_xray.arn
}
```

---

### 8. **KMS Decrypt** (Custom)

#### `miyabi-lambda-kms-decrypt`

**Purpose**: Decrypt environment variables encrypted with KMS

**Permissions**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DecryptEnvironmentVariables",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": [
        "arn:aws:kms:us-west-2:112530848482:key/*"
      ],
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "lambda.us-west-2.amazonaws.com"
        }
      }
    }
  ]
}
```

**Status**: ⚪ **OPTIONAL** - Commented out (uncomment when using encrypted env vars)

**Use Case**:
- Encrypting sensitive environment variables
- Additional layer of security for secrets

**Justification**:
- Scoped to Lambda service via `kms:ViaService` condition
- Decrypt-only (no encrypt/admin permissions)

**To Enable**:
```hcl
# Uncomment in iam.tf:
resource "aws_iam_role_policy_attachment" "lambda_kms_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kms_decrypt.arn
}
```

---

## 🔐 Security Best Practices

### ✅ What We Do

1. **Resource-Level Permissions**: All policies are scoped to specific resources
2. **No Wildcard Resources**: Avoided `"Resource": "*"` except where AWS requires it (VPC, X-Ray)
3. **Read-Only by Default**: Secrets Manager and S3 policies are read-only
4. **Condition Keys**: KMS policy uses `kms:ViaService` condition
5. **Commented Optional Policies**: Unused policies are disabled by default
6. **Clear Naming**: All resources prefixed with `${var.project_name}`
7. **Tagging**: All resources tagged for cost tracking and auditing

### ❌ What We Avoid

1. **Admin Policies**: No `*:*` or `FullAccess` policies
2. **Overly Broad Scopes**: No account-wide permissions
3. **Write Permissions Where Not Needed**: S3 and Secrets Manager are read-only
4. **Unused Policies**: DynamoDB, VPC, X-Ray, KMS are disabled until needed
5. **Untagged Resources**: All IAM resources are tagged

---

## 📊 Permission Matrix

| AWS Service | Permissions | Scope | Status | Justification |
|-------------|-------------|-------|--------|---------------|
| **CloudWatch Logs** | Write | All Lambda logs | ✅ Required | Lambda needs to write logs |
| **S3** | Read | `miyabi-webui-*` bucket only | ✅ Active | Serve static assets |
| **Secrets Manager** | Read | `miyabi/*` secrets only | ✅ Active | Secure config storage |
| **DynamoDB** | Read/Write | `miyabi-*` tables only | ⚪ Optional | State/token storage |
| **VPC/EC2** | Network interfaces | All (required by AWS) | ⚪ Optional | VPC connectivity |
| **X-Ray** | Trace submission | All (required by AWS) | ⚪ Optional | Debugging/tracing |
| **KMS** | Decrypt | All keys (via Lambda service) | ⚪ Optional | Encrypted env vars |

---

## 🚀 Deployment

### 1. **Apply Terraform**

```bash
cd deploy/terraform
terraform init
terraform plan
terraform apply
```

### 2. **Verify IAM Role**

```bash
# Get role ARN
terraform output lambda_execution_role_arn

# Verify attached policies
aws iam list-attached-role-policies \
  --role-name miyabi-lambda-execution-role
```

### 3. **Use in Lambda Function**

```hcl
resource "aws_lambda_function" "miyabi_mcp" {
  filename      = "lambda.zip"
  function_name = "miyabi-mcp-server"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "main.handler"
  runtime       = "python3.12"

  # ... other configuration
}
```

---

## 🔄 Enabling Optional Policies

### Example: Enable DynamoDB Access

1. **Uncomment in `iam.tf`**:
```hcl
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}
```

2. **Apply Changes**:
```bash
terraform plan  # Review changes
terraform apply
```

3. **Verify**:
```bash
aws iam list-attached-role-policies \
  --role-name miyabi-lambda-execution-role \
  | grep dynamodb
```

---

## 📝 Audit & Compliance

### Regular Checks

1. **Review Permissions**: Monthly review of attached policies
2. **Unused Policies**: Identify and remove unused policies
3. **CloudTrail Logs**: Monitor IAM role usage via CloudTrail
4. **IAM Access Analyzer**: Use AWS IAM Access Analyzer to find overly permissive policies

### Audit Commands

```bash
# List all attached policies
aws iam list-attached-role-policies \
  --role-name miyabi-lambda-execution-role

# Get policy document
aws iam get-policy-version \
  --policy-arn <policy-arn> \
  --version-id v1

# Simulate policy (dry-run)
aws iam simulate-principal-policy \
  --policy-source-arn <role-arn> \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::miyabi-webui-112530848482/index.html
```

---

## 🛠️ Troubleshooting

### "Access Denied" Errors

1. **Check Policy Attachment**:
```bash
aws iam list-attached-role-policies --role-name miyabi-lambda-execution-role
```

2. **Verify Resource ARN**: Ensure resource ARN in policy matches the target resource

3. **Check Conditions**: Review any condition keys (e.g., `kms:ViaService`)

4. **CloudTrail Logs**: Check CloudTrail for denied actions

### "Role Not Found" Errors

1. **Verify Role Exists**:
```bash
aws iam get-role --role-name miyabi-lambda-execution-role
```

2. **Check Terraform State**:
```bash
terraform state list | grep iam_role
```

3. **Re-apply Terraform**:
```bash
terraform apply
```

---

## 📚 References

- [AWS Lambda Execution Role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [Principle of Least Privilege](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege)
- [IAM Policy Conditions](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html)
- [AWS IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)

---

## 📄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-29 | Initial IAM role design with minimal permissions |

---

**Last Reviewed**: 2025-11-29
**Next Review**: 2025-12-29 (Monthly)
