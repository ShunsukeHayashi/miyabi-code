# Cost Management Module

Issue: #848 - コストトラッキング & 最適化

Target: Monthly cost **$1,200-1,500**

## Overview

This module implements cost tracking and optimization for Miyabi infrastructure, targeting a 40-60% cost reduction through multiple optimization strategies.

## Cost Optimization Strategies

| Strategy | Potential Savings | Implementation |
|----------|-------------------|----------------|
| Compute Savings Plans | 30% | Purchase separately |
| Spot Instances | 60% | ECS capacity provider |
| S3 Intelligent-Tiering | 50% | Automated via Terraform |
| Reserved DynamoDB | 40% | Purchase separately |
| VPC Endpoints | 90% NAT reduction | Automated via Terraform |

## Usage

```hcl
module "cost_management" {
  source = "../../modules/cost-management"

  environment = "production"

  # Budget settings
  monthly_budget_limit = 1500
  ec2_budget_limit     = 500
  bedrock_budget_limit = 300

  # Notifications
  budget_notification_emails = ["ops@miyabi.dev"]

  # S3 optimization
  enable_s3_intelligent_tiering = true
  s3_bucket_id                  = aws_s3_bucket.data.id

  # VPC endpoints
  enable_vpc_endpoints            = true
  vpc_id                          = aws_vpc.main.id
  route_table_ids                 = [aws_route_table.private.id]
  private_subnet_ids              = aws_subnet.private[*].id
  vpc_endpoint_security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = {
    Team = "Platform"
  }
}
```

## Features

### 1. AWS Budgets

Automated budget tracking with alerts:

- **Monthly Total Budget**: Overall spending limit
- **EC2 Budget**: Compute-specific tracking
- **Bedrock Budget**: AI/ML service tracking

Alert thresholds:
- 50% actual spend
- 80% actual spend
- 100% forecasted spend

### 2. S3 Intelligent-Tiering

Automatic storage class optimization:

```
Standard → Infrequent Access (30 days) → Archive (90 days) → Deep Archive (180 days)
```

Potential savings: **Up to 50%** for infrequently accessed data.

### 3. VPC Endpoints

Reduce NAT Gateway costs by routing traffic internally:

| Endpoint | Type | Service |
|----------|------|---------|
| S3 | Gateway | Amazon S3 |
| DynamoDB | Gateway | Amazon DynamoDB |
| ECR API | Interface | Elastic Container Registry |
| ECR DKR | Interface | ECR Docker Registry |
| Logs | Interface | CloudWatch Logs |

Potential savings: **Up to 90%** reduction in NAT data transfer costs.

### 4. Cost Anomaly Detection

Automatic detection of unusual spending patterns:

- Daily anomaly checks
- Email notifications for anomalies > $50
- Service-level monitoring

### 5. Cost Dashboard

CloudWatch dashboard showing:

- Daily cost trend
- EC2 instance hours
- DynamoDB consumed capacity
- S3 storage size
- NAT Gateway data transfer

## Inputs

| Name | Description | Type | Default |
|------|-------------|------|---------|
| environment | Environment name | string | - |
| monthly_budget_limit | Monthly budget in USD | number | 1500 |
| ec2_budget_limit | EC2 budget in USD | number | 500 |
| bedrock_budget_limit | Bedrock budget in USD | number | 300 |
| daily_cost_threshold | Daily cost alert threshold | number | 100 |
| budget_notification_emails | Alert email addresses | list(string) | [] |
| enable_s3_intelligent_tiering | Enable S3 optimization | bool | true |
| enable_vpc_endpoints | Enable VPC endpoints | bool | true |
| vpc_id | VPC ID for endpoints | string | "" |
| anomaly_threshold_usd | Anomaly detection threshold | string | "50" |

## Outputs

| Name | Description |
|------|-------------|
| monthly_budget_id | Monthly budget ID |
| anomaly_monitor_arn | Cost anomaly monitor ARN |
| cost_dashboard_name | CloudWatch dashboard name |
| estimated_savings | Summary of potential savings |

## Additional Recommendations

### Manual Optimization Steps

These optimizations require manual setup through AWS Console:

1. **Compute Savings Plans**
   - Purchase 1-year commitment for predictable workloads
   - Estimated savings: 30%

2. **Spot Instances for ECS**
   - Configure ECS capacity provider with Spot
   - Estimated savings: 60%

3. **Reserved DynamoDB Capacity**
   - Purchase reserved capacity for steady-state tables
   - Estimated savings: 40%

### Cost Monitoring Best Practices

1. **Weekly Review**
   - Check Cost Explorer for trends
   - Review Budget vs Actual

2. **Monthly Optimization**
   - Identify unused resources
   - Right-size EC2 instances
   - Review storage tiers

3. **Quarterly Assessment**
   - Evaluate Savings Plans coverage
   - Review Reserved Instance utilization
   - Update budgets if needed

## Cost Breakdown Target

| Service | Target % | Target USD |
|---------|----------|------------|
| Compute (EC2/ECS) | 33% | $500 |
| AI/ML (Bedrock) | 20% | $300 |
| Storage (S3/DynamoDB) | 20% | $300 |
| Network | 10% | $150 |
| Other | 17% | $250 |
| **Total** | **100%** | **$1,500** |

## Related Issues

- Issue #848: コストトラッキング & 最適化
- Issue #883: Phase 3 - 200-Agent Live Experiment
