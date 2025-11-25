# Miyabi API Disaster Recovery Plan

**Issue**: #991 - Disaster Recovery & Rollback
**Phase**: 4.3 - Resilience & Recovery
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Overview](#1-overview)
2. [Recovery Objectives](#2-recovery-objectives)
3. [Backup Strategy](#3-backup-strategy)
4. [Disaster Scenarios](#4-disaster-scenarios)
5. [Recovery Procedures](#5-recovery-procedures)
6. [Testing & Validation](#6-testing--validation)

---

## 1. Overview

This document outlines the disaster recovery (DR) procedures for the Miyabi Web API platform.

### Scope

- AWS Lambda functions
- RDS PostgreSQL database
- API Gateway configuration
- Secrets and configuration

### Out of Scope

- Client applications
- Third-party integrations (GitHub OAuth)

---

## 2. Recovery Objectives

### Recovery Time Objective (RTO)

| Component | Target RTO | Maximum RTO |
|-----------|------------|-------------|
| Lambda Functions | 15 minutes | 1 hour |
| Database | 1 hour | 4 hours |
| Full System | 2 hours | 6 hours |

### Recovery Point Objective (RPO)

| Component | Target RPO | Maximum RPO |
|-----------|------------|-------------|
| Database | 5 minutes | 1 hour |
| Configuration | 0 (IaC) | 0 |
| Secrets | 0 (versioned) | 0 |

---

## 3. Backup Strategy

### 3.1 Database Backups

#### Automated Backups

```bash
# RDS automated backup configuration
aws rds modify-db-instance \
  --db-instance-identifier miyabi-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --apply-immediately
```

#### Manual Snapshots

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier miyabi-db \
  --db-snapshot-identifier miyabi-db-manual-$(date +%Y%m%d-%H%M)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier miyabi-db \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

#### Point-in-Time Recovery

RDS supports point-in-time recovery to any second within the backup retention period.

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier miyabi-db \
  --target-db-instance-identifier miyabi-db-pitr \
  --restore-time "2025-11-25T10:00:00Z"
```

### 3.2 Infrastructure as Code

All infrastructure is defined in Terraform/CloudFormation:

```
infrastructure/
├── terraform/
│   ├── main.tf
│   ├── rds.tf
│   ├── lambda.tf
│   ├── api-gateway.tf
│   └── variables.tf
└── cloudformation/
    └── miyabi-stack.yaml
```

### 3.3 Secrets Backup

Secrets are stored in AWS Secrets Manager with automatic versioning:

```bash
# List secret versions
aws secretsmanager list-secret-version-ids \
  --secret-id miyabi/production/database

# Retrieve specific version
aws secretsmanager get-secret-value \
  --secret-id miyabi/production/database \
  --version-id <version-id>
```

---

## 4. Disaster Scenarios

### 4.1 Lambda Function Failure

**Cause**: Bad deployment, runtime error, configuration issue

**Impact**: API unavailable

**Detection**:
- CloudWatch alarms (Error rate > 5%)
- Health check failures
- User reports

### 4.2 Database Failure

**Cause**: Hardware failure, corruption, accidental deletion

**Impact**: Data unavailable, API degraded

**Detection**:
- RDS event notifications
- Health endpoint shows database error
- CloudWatch alarms

### 4.3 Region Failure

**Cause**: AWS regional outage

**Impact**: Complete system unavailable

**Detection**:
- AWS Health Dashboard
- External monitoring
- Multiple service failures

### 4.4 Data Corruption

**Cause**: Bug, bad migration, malicious activity

**Impact**: Invalid data, inconsistent state

**Detection**:
- Application errors
- Data validation failures
- User reports

### 4.5 Security Breach

**Cause**: Compromised credentials, vulnerability exploitation

**Impact**: Data exposure, unauthorized access

**Detection**:
- GuardDuty alerts
- Unusual API activity
- Security team notification

---

## 5. Recovery Procedures

### 5.1 Lambda Recovery

#### Rollback to Previous Version

```bash
# 1. List versions
aws lambda list-versions-by-function \
  --function-name miyabi-api-production \
  --query 'Versions[*].[Version,LastModified]' \
  --output table

# 2. Update alias to previous version
aws lambda update-alias \
  --function-name miyabi-api-production \
  --name production \
  --function-version <previous-version>

# 3. Verify
curl -s https://api.miyabi.dev/api/v1/health | jq
```

#### Redeploy from Source

```bash
# 1. Checkout known-good commit
git checkout <commit-sha>

# 2. Build
cargo lambda build --release --arm64

# 3. Deploy
cargo lambda deploy miyabi-api-production \
  --region ap-northeast-1

# 4. Verify
curl -s https://api.miyabi.dev/api/v1/health | jq
```

### 5.2 Database Recovery

#### From Automated Backup (Point-in-Time)

```bash
# 1. Identify recovery point
aws rds describe-db-instances \
  --db-instance-identifier miyabi-db \
  --query 'DBInstances[0].LatestRestorableTime'

# 2. Restore to new instance
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier miyabi-db \
  --target-db-instance-identifier miyabi-db-recovery \
  --restore-time "2025-11-25T09:30:00Z" \
  --db-instance-class db.r6g.medium

# 3. Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier miyabi-db-recovery

# 4. Update Lambda to use new database
aws lambda update-function-configuration \
  --function-name miyabi-api-production \
  --environment "Variables={DATABASE_URL=<new-connection-string>}"

# 5. Verify
curl -s https://api.miyabi.dev/api/v1/health | jq

# 6. (Later) Rename instances
# After thorough verification, swap the database names
```

#### From Manual Snapshot

```bash
# 1. List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier miyabi-db \
  --snapshot-type manual

# 2. Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier miyabi-db-from-snapshot \
  --db-snapshot-identifier miyabi-db-manual-20251125

# 3. Follow steps 3-6 from above
```

### 5.3 Region Failover

**Prerequisites**: Multi-region setup (not currently implemented)

For future implementation:

1. Deploy to secondary region (us-west-2)
2. Set up RDS read replica in secondary region
3. Configure Route 53 health checks
4. Automatic failover on primary failure

### 5.4 Data Corruption Recovery

```bash
# 1. Identify when corruption occurred
# Review logs, user reports, monitoring data

# 2. Create snapshot of current (corrupted) state
aws rds create-db-snapshot \
  --db-instance-identifier miyabi-db \
  --db-snapshot-identifier miyabi-db-corrupted-$(date +%Y%m%d-%H%M)

# 3. Restore to point before corruption
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier miyabi-db \
  --target-db-instance-identifier miyabi-db-clean \
  --restore-time "2025-11-25T08:00:00Z"

# 4. Validate data integrity on restored instance
# Run validation queries

# 5. If needed, migrate valid data to new instance
# Use pg_dump/pg_restore for selective restoration
```

### 5.5 Security Incident Response

```bash
# 1. Rotate all secrets immediately
aws secretsmanager rotate-secret \
  --secret-id miyabi/production/jwt-secret

# 2. Invalidate existing sessions
# Update JWT_SECRET to invalidate all tokens
aws lambda update-function-configuration \
  --function-name miyabi-api-production \
  --environment "Variables={JWT_SECRET=<new-secret>}"

# 3. Review and revoke GitHub OAuth tokens
# In GitHub OAuth app settings

# 4. Change database password
aws rds modify-db-instance \
  --db-instance-identifier miyabi-db \
  --master-user-password <new-password>

# 5. Review CloudTrail and GuardDuty findings

# 6. Engage security team for investigation
```

---

## 6. Testing & Validation

### 6.1 Quarterly DR Tests

| Test | Frequency | Last Test | Next Test |
|------|-----------|-----------|-----------|
| Lambda rollback | Monthly | TBD | TBD |
| Database restore | Quarterly | TBD | TBD |
| Full DR drill | Annually | TBD | TBD |

### 6.2 Test Procedures

#### Lambda Rollback Test

```bash
# 1. Deploy test version with known issue
# 2. Verify issue exists
# 3. Execute rollback procedure
# 4. Verify system healthy
# 5. Document results
```

#### Database Restore Test

```bash
# 1. Create snapshot of current database
# 2. Restore to test instance
# 3. Validate data integrity
# 4. Test application against restored database
# 5. Clean up test resources
# 6. Document results and restore time
```

### 6.3 Validation Checklist

After any recovery:

- [ ] Health endpoint returns 200
- [ ] Database connection successful
- [ ] Authentication working
- [ ] All API endpoints responding
- [ ] No errors in CloudWatch logs
- [ ] Metrics returning to normal
- [ ] User verification (if applicable)

---

## Appendix A: Contact List

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | oncall@miyabi.dev | 15 min |
| Platform Lead | platform@miyabi.dev | 30 min |
| Database Admin | dba@miyabi.dev | 30 min |
| Security Team | security@miyabi.dev | Immediate |

## Appendix B: AWS Resources

| Resource | Identifier | Region |
|----------|-----------|--------|
| Lambda Function | miyabi-api-production | ap-northeast-1 |
| RDS Instance | miyabi-db | ap-northeast-1 |
| API Gateway | miyabi-api | ap-northeast-1 |
| Secrets Manager | miyabi/production/* | ap-northeast-1 |

---

**Document Owner**: Platform Team
**Review Cycle**: Quarterly
**Last DR Test**: TBD
