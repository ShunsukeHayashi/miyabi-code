# Miyabi Web API Operations Runbook

**Issue**: #992 - Documentation & Runbooks
**Phase**: 4.4 - Production Documentation
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Deployment Procedures](#2-deployment-procedures)
3. [Health Checks](#3-health-checks)
4. [Common Issues & Resolution](#4-common-issues--resolution)
5. [Scaling Procedures](#5-scaling-procedures)
6. [Incident Response](#6-incident-response)
7. [Rollback Procedures](#7-rollback-procedures)
8. [Maintenance Windows](#8-maintenance-windows)

---

## 1. System Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway                                   │
│                  (Rate Limiting, Auth)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Lambda                                    │
│               (miyabi-api-production)                           │
│                   Rust + Axum                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RDS PostgreSQL                               │
│                    (miyabi-db)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Endpoints

| Endpoint | Purpose | SLA |
|----------|---------|-----|
| `GET /api/v1/health` | Health check | 99.9% |
| `GET /api/v1/dashboard/summary` | Dashboard data | 99.5% |
| `GET /api/v1/agents` | Agent list | 99.5% |
| `GET /api/v1/tasks` | Task management | 99.5% |
| `GET /api/v1/organizations` | Organization data | 99.5% |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | Yes |
| `RUST_LOG` | Log level configuration | No |
| `ENVIRONMENT` | deployment/staging/production | No |

---

## 2. Deployment Procedures

### 2.1 Standard Deployment

```bash
# 1. Build Lambda package
cargo lambda build --release --arm64

# 2. Deploy to staging
cargo lambda deploy miyabi-api-staging \
  --region ap-northeast-1 \
  --iam-role arn:aws:iam::ACCOUNT:role/miyabi-lambda-role

# 3. Run smoke tests against staging
./scripts/smoke-test.sh staging

# 4. Deploy to production (if staging passes)
cargo lambda deploy miyabi-api-production \
  --region ap-northeast-1 \
  --iam-role arn:aws:iam::ACCOUNT:role/miyabi-lambda-role

# 5. Verify production health
curl https://api.miyabi.dev/api/v1/health
```

### 2.2 Database Migration

```bash
# 1. Create backup
aws rds create-db-snapshot \
  --db-instance-identifier miyabi-db \
  --db-snapshot-identifier miyabi-db-pre-migration-$(date +%Y%m%d)

# 2. Run migrations
DATABASE_URL=$PROD_DATABASE_URL sqlx migrate run

# 3. Verify migration
DATABASE_URL=$PROD_DATABASE_URL sqlx migrate info
```

### 2.3 Configuration Update

```bash
# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name miyabi-api-production \
  --environment "Variables={KEY=value}"
```

---

## 3. Health Checks

### 3.1 Endpoint Health

```bash
# Basic health check
curl -s https://api.miyabi.dev/api/v1/health | jq

# Expected response:
# {
#   "status": "ok",
#   "version": "0.1.0",
#   "database": {
#     "active_connections": 2,
#     "idle_connections": 8,
#     "max_connections": 10,
#     "status": "connected"
#   }
# }
```

### 3.2 Database Health

```bash
# Check database connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=miyabi-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

### 3.3 Lambda Health

```bash
# Check Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=miyabi-api-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Sum
```

---

## 4. Common Issues & Resolution

### 4.1 High Latency

**Symptoms:**
- P95 latency > 500ms
- CloudWatch alarm triggered

**Diagnosis:**
```bash
# Check Lambda duration
aws logs filter-log-events \
  --log-group-name /aws/lambda/miyabi-api-production \
  --filter-pattern "REPORT" \
  --start-time $(($(date +%s) - 3600))000 | \
  jq '.events[].message' | grep -oP 'Duration: \d+\.\d+ ms'
```

**Resolution:**
1. Check database connection pool exhaustion
2. Review slow queries in RDS Performance Insights
3. Consider increasing Lambda memory (improves CPU)
4. Check for cold starts (enable provisioned concurrency)

### 4.2 Database Connection Errors

**Symptoms:**
- `error connecting to database` in logs
- Health check shows database disconnected

**Diagnosis:**
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier miyabi-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Check security groups
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx
```

**Resolution:**
1. Verify RDS is running
2. Check security group rules allow Lambda VPC
3. Verify DATABASE_URL is correct
4. Check connection pool settings

### 4.3 Authentication Failures

**Symptoms:**
- 401 Unauthorized responses
- `invalid token` errors

**Diagnosis:**
```bash
# Check JWT configuration
aws lambda get-function-configuration \
  --function-name miyabi-api-production \
  --query 'Environment.Variables.JWT_SECRET'
```

**Resolution:**
1. Verify JWT_SECRET matches across services
2. Check token expiration settings
3. Verify GitHub OAuth credentials

### 4.4 Rate Limiting

**Symptoms:**
- 429 Too Many Requests responses
- API Gateway throttling

**Resolution:**
```bash
# Check current limits
aws apigateway get-usage-plan --usage-plan-id xxxxx

# Increase limits if needed
aws apigateway update-usage-plan \
  --usage-plan-id xxxxx \
  --patch-operations op=replace,path=/throttle/rateLimit,value=1000
```

---

## 5. Scaling Procedures

### 5.1 Lambda Scaling

Lambda scales automatically, but you can configure:

```bash
# Set reserved concurrency
aws lambda put-function-concurrency \
  --function-name miyabi-api-production \
  --reserved-concurrent-executions 100

# Enable provisioned concurrency (for cold starts)
aws lambda put-provisioned-concurrency-config \
  --function-name miyabi-api-production \
  --qualifier production \
  --provisioned-concurrent-executions 10
```

### 5.2 Database Scaling

```bash
# Scale up RDS instance
aws rds modify-db-instance \
  --db-instance-identifier miyabi-db \
  --db-instance-class db.r6g.large \
  --apply-immediately

# Add read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier miyabi-db-read \
  --source-db-instance-identifier miyabi-db
```

---

## 6. Incident Response

### 6.1 Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| SEV1 | Complete outage | 15 min | API unreachable |
| SEV2 | Major degradation | 30 min | >50% error rate |
| SEV3 | Minor impact | 2 hours | Slow responses |
| SEV4 | Low impact | 24 hours | Non-critical bug |

### 6.2 Incident Checklist

1. **Acknowledge** the incident
2. **Assess** severity and impact
3. **Communicate** to stakeholders
4. **Investigate** root cause
5. **Mitigate** immediate impact
6. **Resolve** underlying issue
7. **Document** post-mortem

### 6.3 Communication Template

```
Subject: [SEV{X}] Miyabi API - {Brief Description}

Status: Investigating/Identified/Monitoring/Resolved

Impact:
- {Affected services/features}
- {User impact}

Timeline:
- {HH:MM UTC} - {Event}

Current Actions:
- {What we're doing}

Next Update: {Time}
```

---

## 7. Rollback Procedures

### 7.1 Lambda Rollback

```bash
# List versions
aws lambda list-versions-by-function \
  --function-name miyabi-api-production

# Rollback to previous version
aws lambda update-alias \
  --function-name miyabi-api-production \
  --name production \
  --function-version {PREVIOUS_VERSION}
```

### 7.2 Database Rollback

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier miyabi-db-restored \
  --db-snapshot-identifier miyabi-db-backup-YYYYMMDD

# After verification, rename instances
aws rds modify-db-instance \
  --db-instance-identifier miyabi-db \
  --new-db-instance-identifier miyabi-db-old

aws rds modify-db-instance \
  --db-instance-identifier miyabi-db-restored \
  --new-db-instance-identifier miyabi-db
```

---

## 8. Maintenance Windows

### 8.1 Scheduled Maintenance

- **Preferred Window**: Sunday 03:00-05:00 UTC
- **Notification**: 48 hours advance notice
- **Duration**: Maximum 2 hours

### 8.2 Pre-Maintenance Checklist

- [ ] Notify stakeholders
- [ ] Create database backup
- [ ] Verify rollback procedures
- [ ] Test changes in staging
- [ ] Prepare communication

### 8.3 Post-Maintenance Checklist

- [ ] Verify all health checks pass
- [ ] Confirm metrics are normal
- [ ] Update documentation
- [ ] Send completion notification
- [ ] Schedule post-maintenance review

---

## Appendix: Useful Commands

```bash
# View Lambda logs
aws logs tail /aws/lambda/miyabi-api-production --follow

# Query CloudWatch Logs Insights
aws logs start-query \
  --log-group-name /aws/lambda/miyabi-api-production \
  --start-time $(($(date +%s) - 3600)) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/'

# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=miyabi-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Sum
```

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| On-Call Engineer | Rotation | oncall@miyabi.dev |
| Platform Lead | TBD | platform@miyabi.dev |
| Database Admin | TBD | dba@miyabi.dev |

---

**Document Owner**: Platform Team
**Review Cycle**: Monthly
