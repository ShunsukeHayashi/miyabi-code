# Lambda VPC Infrastructure - Miyabi

**Version**: 1.0.0
**Created**: 2025-11-29
**AWS Account**: 112530848482 (Hayashi)
**Region**: us-west-2

---

## 📋 Overview

This Terraform configuration creates a **secure, highly available VPC infrastructure** for AWS Lambda functions with the following components:

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VPC: 10.0.0.0/16                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Public Subnet   │  │  Public Subnet   │  │ Public Subnet │ │
│  │   10.0.1.0/24    │  │   10.0.2.0/24    │  │  10.0.3.0/24  │ │
│  │   (us-west-2a)   │  │   (us-west-2b)   │  │  (us-west-2c) │ │
│  ├──────────────────┤  ├──────────────────┤  ├───────────────┤ │
│  │  NAT Gateway 1   │  │  NAT Gateway 2   │  │ NAT Gateway 3 │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Private Subnet   │  │ Private Subnet   │  │Private Subnet │ │
│  │   10.0.11.0/24   │  │   10.0.12.0/24   │  │ 10.0.13.0/24  │ │
│  │   (us-west-2a)   │  │   (us-west-2b)   │  │  (us-west-2c) │ │
│  ├──────────────────┤  ├──────────────────┤  ├───────────────┤ │
│  │ Lambda Functions │  │ Lambda Functions │  │Lambda Functions│ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VPC Endpoints (Gateway)                     │  │
│  │  - S3 (FREE)                                             │  │
│  │  - DynamoDB (FREE)                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           VPC Endpoints (Interface - Optional)           │  │
│  │  - Secrets Manager ($7/month)                            │  │
│  │  - CloudWatch Logs ($7/month)                            │  │
│  │  - Lambda ($7/month)                                     │  │
│  │  - STS, KMS, SQS, SNS ($7/month each)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Breakdown

### Base Configuration (enable_multi_az_nat = true)

| Component | Quantity | Unit Cost | Monthly Cost |
|-----------|----------|-----------|--------------|
| **NAT Gateway** | 3 | $0.045/hour | **$96/month** |
| **NAT Data Transfer** | Variable | $0.045/GB | **$10-50/month** |
| **VPC Endpoints (Gateway)** | 2 (S3, DynamoDB) | $0/month | **$0/month** |
| **VPC Flow Logs (Optional)** | 1 | ~$5/month | **$5/month** |
| **Total (Base)** | - | - | **$111-151/month** |

### With Interface Endpoints (enable_interface_endpoints = true)

| Component | Quantity | Unit Cost | Monthly Cost |
|-----------|----------|-----------|--------------|
| **Interface Endpoints** | 7 | $7/month | **$49/month** |
| **Interface Data Transfer** | Variable | $0.01/GB | **Varies** |
| **Total (with Endpoints)** | - | - | **$160-200/month** |

### Cost Optimization Options

1. **Single NAT Gateway** (enable_multi_az_nat = false)
   - Saves: **$64/month**
   - Risk: Single point of failure in AZ-A

2. **Disable Interface Endpoints** (enable_interface_endpoints = false)
   - Saves: **$49/month**
   - Trade-off: Higher NAT Gateway data transfer costs

3. **Recommended for Production**:
   - Multi-AZ NAT: ✅ Enabled (High Availability)
   - Interface Endpoints: ⚪ Optional (30% data transfer savings)

---

## 🚀 Deployment

### Prerequisites

1. **Terraform** >= 1.5.0
2. **AWS CLI** configured with credentials
3. **AWS Account**: 112530848482

### Step 1: Initialize Terraform

```bash
cd deploy/terraform
terraform init
```

### Step 2: Review Configuration

Check `variables.tf` for default settings:

```hcl
# VPC Configuration
variable "vpc_cidr" {
  default = "10.0.0.0/16"  # 65,536 IPs
}

variable "enable_multi_az_nat" {
  default = true  # 3 NAT Gateways (High Availability)
}

variable "enable_interface_endpoints" {
  default = false  # Cost savings (can enable later)
}

variable "enable_vpc_flow_logs" {
  default = true  # Security monitoring
}
```

### Step 3: Plan Deployment

```bash
terraform plan
```

Expected output:
```
Plan: 35 to add, 0 to change, 0 to destroy.
```

### Step 4: Apply Configuration

```bash
terraform apply
```

Review the plan and type `yes` to proceed.

### Step 5: Verify Deployment

```bash
# Get VPC ID
terraform output vpc_id

# Get Lambda Security Group
terraform output lambda_default_security_group_id

# Get Private Subnet IDs (for Lambda configuration)
terraform output private_subnet_ids
```

---

## 📝 Using VPC with Lambda

### Method 1: Terraform (Recommended)

```hcl
resource "aws_lambda_function" "example" {
  function_name = "miyabi-example-function"
  role          = aws_iam_role.lambda_execution.arn

  # VPC Configuration
  vpc_config {
    subnet_ids         = module.vpc.private_subnet_ids
    security_group_ids = [module.vpc.lambda_default_security_group_id]
  }

  # ... other configuration
}
```

### Method 2: AWS CLI

```bash
# Get outputs from Terraform
VPC_ID=$(terraform output -raw vpc_id)
SG_ID=$(terraform output -raw lambda_default_security_group_id)
SUBNET_IDS=$(terraform output -json private_subnet_ids | jq -r '.[]' | tr '\n' ',' | sed 's/,$//')

# Update Lambda function VPC configuration
aws lambda update-function-configuration \
  --function-name miyabi-example-function \
  --vpc-config SubnetIds=$SUBNET_IDS,SecurityGroupIds=$SG_ID
```

---

## 🔒 Security Groups

### Lambda Default Security Group

**Egress (Outbound)**:
- HTTPS (443) → 0.0.0.0/0
- HTTP (80) → 0.0.0.0/0
- DNS (53) → 0.0.0.0/0 (TCP/UDP)

**Ingress (Inbound)**:
- Lambda-to-Lambda communication (All protocols from same SG)

### VPC Endpoints Security Group

**Ingress (Inbound)**:
- HTTPS (443) ← Lambda Security Group

---

## 🛠️ Configuration Variables

### Required Variables (already set in `variables.tf`)

```hcl
aws_region      = "us-west-2"
aws_account_id  = "112530848482"
project_name    = "miyabi"
environment     = "prod"
```

### Optional VPC Variables

```hcl
# VPC CIDR block
vpc_cidr = "10.0.0.0/16"  # Default

# High Availability vs Cost Savings
enable_multi_az_nat = true   # true = $96/month, false = $32/month

# Interface Endpoints (30% NAT cost reduction)
enable_interface_endpoints = false  # true = $49/month, false = $0/month

# Security Monitoring
enable_vpc_flow_logs = true  # true = $5/month, false = $0/month
```

---

## 📊 Outputs

After deployment, the following outputs are available:

```bash
terraform output vpc_id                               # VPC ID
terraform output private_subnet_ids                   # Lambda subnet IDs
terraform output lambda_default_security_group_id     # Lambda SG ID
terraform output nat_gateway_ips                      # NAT Gateway IPs
terraform output s3_gateway_endpoint_id               # S3 Endpoint ID
terraform output vpc_endpoint_cost_estimate           # Cost breakdown
```

---

## 🔧 Troubleshooting

### Lambda Function Cannot Access Internet

**Symptoms**: Lambda timeout when calling external APIs

**Solution**:
1. Verify NAT Gateway is deployed:
   ```bash
   terraform output nat_gateway_ids
   ```

2. Check route tables:
   ```bash
   aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$(terraform output -raw vpc_id)"
   ```

3. Verify Lambda is in **private subnets**, not public subnets

### Lambda Cannot Access S3

**Symptoms**: S3 access denied or timeout

**Solution**:
1. Verify S3 VPC Endpoint exists:
   ```bash
   terraform output s3_gateway_endpoint_id
   ```

2. Check IAM role has S3 permissions (see `iam.tf`)

3. Verify S3 bucket policy allows VPC Endpoint access

### High NAT Gateway Costs

**Symptoms**: Unexpectedly high AWS bill

**Solution**:
1. Enable Interface Endpoints to reduce NAT traffic:
   ```bash
   # In variables.tf or terraform.tfvars
   enable_interface_endpoints = true
   ```

2. Review VPC Flow Logs to identify high-traffic sources:
   ```bash
   aws logs tail "/aws/vpc/miyabi-lambda-vpc" --follow
   ```

3. Consider disabling Multi-AZ NAT for non-production:
   ```bash
   enable_multi_az_nat = false  # Saves $64/month
   ```

---

## 🎯 Best Practices

### 1. Cost Optimization

✅ **Always enable S3 and DynamoDB Gateway Endpoints** (FREE)
✅ **Enable Interface Endpoints for production** (30% NAT savings)
⚪ **Consider Single NAT for development** (saves $64/month)

### 2. Security

✅ **Enable VPC Flow Logs** (network monitoring)
✅ **Use Security Groups** (not Network ACLs)
✅ **Principle of Least Privilege** (minimal egress rules)

### 3. High Availability

✅ **Deploy Lambda in 3 AZs** (automatic with private subnets)
✅ **Use Multi-AZ NAT Gateways** (production environments)
⚪ **Single NAT acceptable for dev/staging**

### 4. Monitoring

✅ **VPC Flow Logs** → CloudWatch Logs (7-day retention)
✅ **Lambda Metrics** → CloudWatch (duration, errors, throttles)
✅ **Cost Explorer** → Track NAT Gateway data transfer

---

## 📚 Related Files

| File | Description |
|------|-------------|
| `vpc.tf` | VPC, subnets, NAT Gateways, route tables |
| `security-groups.tf` | Lambda and VPC Endpoint security groups |
| `vpc-endpoints.tf` | S3, DynamoDB, Secrets Manager, etc. endpoints |
| `iam.tf` | Lambda execution role with VPC permissions |
| `variables.tf` | All configurable variables |
| `outputs.tf` | Exported values for Lambda configuration |

---

## 🆘 Support

For issues or questions:
1. Check `terraform plan` output for conflicts
2. Review AWS CloudWatch Logs: `/aws/vpc/miyabi-lambda-vpc`
3. Verify AWS credentials: `aws sts get-caller-identity`
4. Contact: Miyabi Platform Team

---

**Last Updated**: 2025-11-29
**Maintainer**: Miyabi Infrastructure Team
