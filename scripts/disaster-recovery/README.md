# Miyabi Disaster Recovery Test Framework

Issue: #854 - 災害復旧テスト実施

## Overview

This framework provides automated disaster recovery testing for Miyabi infrastructure, validating RPO (Recovery Point Objective) and RTO (Recovery Time Objective) targets.

## Quick Start

```bash
# Dry run (show what would be tested)
./dr_test.sh --dry-run

# Run all tests
./dr_test.sh

# Run specific test
./dr_test.sh --test dynamodb
./dr_test.sh --test s3
./dr_test.sh --test az
./dr_test.sh --test region
./dr_test.sh --test backup

# Run for different environment
./dr_test.sh --env production --region us-west-2
```

## Test Scenarios

### 1. DynamoDB Recovery Test

**Target SLO:**
- RPO: 5 minutes
- RTO: 15 minutes

**What is tested:**
- Point-in-Time Recovery (PITR) is enabled
- Latest restorable timestamp is recent
- Table can be restored to a point-in-time

**AWS Services Used:**
- DynamoDB Continuous Backups
- DynamoDB Point-in-Time Recovery

### 2. S3 Recovery Test

**Target SLO:**
- RPO: 1 hour
- RTO: 30 minutes

**What is tested:**
- Versioning is enabled
- Cross-region replication is configured
- Object versions are accessible

**AWS Services Used:**
- S3 Versioning
- S3 Cross-Region Replication

### 3. AZ Failure Test

**Target SLO:**
- RTO: 10 minutes

**What is tested:**
- Services are deployed across multiple AZs
- Tasks are distributed across different AZs
- Load balancer health checks are configured

**AWS Services Used:**
- ECS multi-AZ deployment
- Application Load Balancer

### 4. Region Failure Test

**Target SLO:**
- RTO: 30 minutes

**What is tested:**
- Route53 health checks are configured
- DynamoDB Global Tables replica exists
- S3 backup bucket exists in backup region

**AWS Services Used:**
- Route53 Failover Routing
- DynamoDB Global Tables
- S3 Cross-Region Replication

### 5. Backup Verification Test

**What is tested:**
- DynamoDB on-demand backups exist
- RDS snapshots exist (if applicable)
- Backup retention policies are met

## SLO Target Matrix

| Component | RPO | RTO | Recovery Method |
|-----------|-----|-----|-----------------|
| DynamoDB | 5 min | 15 min | Point-in-Time Recovery |
| S3 | 1 hour | 30 min | Version Recovery |
| AZ Failure | - | 10 min | Multi-AZ Failover |
| Region Failure | - | 30 min | Route53 Failover |

## Report Output

The test generates a detailed Markdown report including:
- Executive summary
- SLO targets
- Individual test results
- Recommendations

Reports are saved to: `dr-test-reports/DR_TEST_REPORT_<timestamp>.md`

## Prerequisites

### Required Permissions

The IAM role/user running these tests needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:DescribeContinuousBackups",
        "dynamodb:ListBackups",
        "s3:GetBucketVersioning",
        "s3:GetBucketReplication",
        "s3:ListObjectVersions",
        "s3api:HeadBucket",
        "ecs:DescribeServices",
        "ecs:ListTasks",
        "ecs:DescribeTasks",
        "route53:ListHealthChecks",
        "rds:DescribeDBSnapshots"
      ],
      "Resource": "*"
    }
  ]
}
```

### Tools

- AWS CLI v2
- jq
- bc (for calculations)

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Show what would be tested | - |
| `--test <name>` | Run specific test | all |
| `--env <name>` | Environment | staging |
| `--region <region>` | Primary AWS region | ap-northeast-1 |
| `--backup-region <region>` | Backup region | ap-northeast-3 |

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run DR Tests
  run: |
    cd scripts/disaster-recovery
    ./dr_test.sh --env staging
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Best Practices

### Regular Testing Schedule

| Test Type | Frequency |
|-----------|-----------|
| Automated DR Tests | Weekly |
| Manual DR Drill | Quarterly |
| Full Region Failover | Annually |

### Documentation

After each DR test:
1. Review the generated report
2. Update runbooks if needed
3. File issues for any gaps
4. Share results with stakeholders

## Related Issues

- Issue #854: 災害復旧テスト実施
- Issue #849: セキュリティ強化 & 監査
- Issue #883: Phase 3 - 200-Agent Live Experiment
