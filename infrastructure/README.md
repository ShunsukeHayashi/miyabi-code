# Miyabi Infrastructure

**Issue**: #993 - Phase 4.6: Production Launch

## Overview

This directory contains all infrastructure-as-code (IaC) configurations for the Miyabi platform.

## Directory Structure

```
infrastructure/
├── README.md                       # This file
├── terraform/
│   ├── environments/
│   │   ├── staging/
│   │   │   └── main.tf            # Staging environment (cost-optimized)
│   │   └── production/
│   │       └── main.tf            # Production environment (HA)
│   └── modules/
│       ├── frontend-hosting/       # S3 + CloudFront module
│       └── cloudwatch/             # Monitoring module
├── cloudwatch/
│   ├── dashboard.yaml             # CloudFormation template
│   ├── deploy-dashboard.sh        # Deployment script
│   ├── log-insights-queries.md    # Pre-built queries
│   └── README.md
└── ecs/
    └── task-definition.json       # ECS Fargate task definition
```

## Environments

### Staging

**Purpose**: Testing and validation before production deployment

**Cost Optimization**:
- Single NAT Gateway (vs 3 in production)
- Single-AZ RDS (vs Multi-AZ)
- Smaller instance sizes
- Shorter backup retention

**Deploy**:
```bash
cd infrastructure/terraform/environments/staging
terraform init
terraform plan
terraform apply
```

### Production

**Purpose**: Live customer-facing environment

**High Availability**:
- Multi-AZ deployment
- 3 NAT Gateways (one per AZ)
- Multi-AZ RDS with 30-day backups
- Performance Insights enabled
- Deletion protection enabled

**Deploy**:
```bash
cd infrastructure/terraform/environments/production
terraform init
terraform plan
terraform apply
```

## Components

### 1. Frontend Hosting (S3 + CloudFront)

Static hosting for Next.js application (pantheon-webapp).

**Features**:
- S3 bucket with versioning
- CloudFront with Origin Access Control
- Custom domain support
- Automatic HTTPS redirect
- SPA routing support (404 → index.html)

### 2. API (ECS Fargate)

Container-based API hosting.

**Features**:
- Fargate serverless containers
- Application Load Balancer
- Auto-scaling
- Health checks
- Secrets Manager integration

### 3. Database (RDS PostgreSQL)

Managed PostgreSQL database.

**Features**:
- PostgreSQL 16.1
- Encryption at rest
- Automated backups
- Performance Insights
- CloudWatch Logs export

### 4. Monitoring (CloudWatch)

Comprehensive monitoring and alerting.

**Features**:
- Dashboard with key metrics
- Alarms for error rate/latency
- Log groups with retention
- SNS notifications

## Deployment Scripts

### Frontend Deployment

```bash
# Staging
./scripts/deploy-pantheon.sh staging

# Production
./scripts/deploy-pantheon.sh production
```

### API Deployment

```bash
# Staging
./scripts/deploy-api.sh staging latest

# Production with specific version
./scripts/deploy-api.sh production v1.0.0
```

### Rollback

```bash
# Rollback to previous version
./scripts/rollback-api.sh production

# Rollback to specific revision
./scripts/rollback-api.sh production 5
```

### Smoke Tests

```bash
# Test staging
./scripts/smoke-test.sh staging

# Test production
./scripts/smoke-test.sh production
```

## Secrets Management

All secrets are stored in AWS Secrets Manager:

| Secret Name | Description |
|-------------|-------------|
| `miyabi/{env}/database-url` | PostgreSQL connection string |
| `miyabi/{env}/jwt-secret` | JWT signing secret |
| `miyabi/{env}/github-client-id` | GitHub OAuth client ID |
| `miyabi/{env}/github-client-secret` | GitHub OAuth client secret |

## Cost Estimation

### Staging (Monthly)

| Service | Cost |
|---------|------|
| VPC (NAT Gateway) | ~$45 |
| RDS (t3.micro) | ~$15 |
| S3 + CloudFront | ~$5 |
| ECS Fargate | ~$20 |
| CloudWatch | ~$5 |
| **Total** | **~$90** |

### Production (Monthly)

| Service | Cost |
|---------|------|
| VPC (3x NAT Gateway) | ~$135 |
| RDS (t3.medium Multi-AZ) | ~$80 |
| S3 + CloudFront | ~$20 |
| ECS Fargate | ~$100 |
| CloudWatch | ~$20 |
| ALB | ~$25 |
| **Total** | **~$380** |

## Terraform State

State is stored in S3 with DynamoDB locking:

- **Bucket**: `miyabi-terraform-state`
- **DynamoDB Table**: `miyabi-terraform-locks`
- **Region**: `ap-northeast-1`

### Initialize State Backend

```bash
# Create S3 bucket for state
aws s3 mb s3://miyabi-terraform-state --region ap-northeast-1
aws s3api put-bucket-versioning \
    --bucket miyabi-terraform-state \
    --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
    --table-name miyabi-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-1
```

## Security Best Practices

1. **Network**: Private subnets for all backend services
2. **Encryption**: TLS 1.3 for all traffic, encryption at rest
3. **Secrets**: All credentials in Secrets Manager
4. **IAM**: Least privilege roles for all services
5. **Logging**: All access and application logs captured
6. **Monitoring**: Alerts for anomalies

## Disaster Recovery

### RTO/RPO Targets

| Environment | RTO | RPO |
|-------------|-----|-----|
| Staging | 4 hours | 24 hours |
| Production | 1 hour | 1 hour |

### Backup Strategy

- **RDS**: Automated daily backups, 30-day retention (prod)
- **S3**: Versioning enabled, cross-region replication (optional)
- **Terraform State**: Versioned S3 bucket

### Recovery Procedures

See `scripts/production-launch-checklist.md` for detailed rollback procedures.
