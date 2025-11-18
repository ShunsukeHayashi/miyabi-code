# Miyabi Infrastructure Runbook

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Environment**: Development (us-west-2)
**Owner**: Miyabi DevOps Team
**Status**: Production Ready

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AWS Resource Inventory](#aws-resource-inventory)
3. [Access & Credentials](#access--credentials)
4. [Common Operations](#common-operations)
5. [Monitoring & Logs](#monitoring--logs)
6. [Scaling & Performance](#scaling--performance)
7. [Backup & Disaster Recovery](#backup--disaster-recovery)
8. [Cost Management](#cost-management)
9. [Emergency Procedures](#emergency-procedures)

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
Internet
   ↓
Application Load Balancer (ALB)
   ↓ (Public Subnets)
   ├─ us-west-2a
   └─ us-west-2b
   ↓
ECS Fargate Service (2-4 tasks)
   ↓ (Private Subnets)
   ├─ us-west-2a
   └─ us-west-2b
   ↓
   ├─→ RDS PostgreSQL (Private)
   └─→ ElastiCache Redis (Private)
```

### Component Breakdown

| Component | Type | Purpose | High Availability |
|-----------|------|---------|-------------------|
| VPC | Network | Isolated network | Multi-AZ |
| ALB | Load Balancer | Traffic distribution | Multi-AZ |
| ECS Fargate | Compute | Container runtime | Multi-AZ, Auto-scaling |
| RDS PostgreSQL | Database | Data persistence | Multi-AZ capable |
| ElastiCache Redis | Cache | Session/caching | Single-AZ (dev) |
| NAT Gateway | Network | Outbound internet | Single NAT (dev) |

### Network Architecture

**VPC CIDR**: `10.0.0.0/16`

**Public Subnets** (Internet-facing):
- `10.0.1.0/24` (us-west-2a) - ALB, NAT Gateway
- `10.0.2.0/24` (us-west-2b) - ALB

**Private Subnets** (Internal only):
- `10.0.11.0/24` (us-west-2a) - ECS, RDS, Redis
- `10.0.12.0/24` (us-west-2b) - ECS, RDS

### Security Architecture

**Security Groups**:

1. **ALB Security Group**: `miyabi-alb-sg-dev`
   - Inbound: HTTP (80) from 0.0.0.0/0
   - Outbound: All traffic

2. **ECS Security Group**: `miyabi-ecs-sg-dev`
   - Inbound: Port 8080 from ALB SG
   - Outbound: All traffic

3. **RDS Security Group**: `miyabi-rds-sg-dev`
   - Inbound: Port 5432 from ECS SG
   - Outbound: None

4. **Redis Security Group**: `miyabi-redis-sg-dev`
   - Inbound: Port 6379 from ECS SG
   - Outbound: None

---

## 📦 AWS Resource Inventory

### Network Resources (Issue #1021)

| Resource Type | Name | ID/ARN | Purpose |
|---------------|------|--------|---------|
| VPC | miyabi-vpc-dev | `vpc-xxxxx` | Main network |
| Internet Gateway | miyabi-igw-dev | `igw-xxxxx` | Internet access |
| NAT Gateway | miyabi-nat-dev | `nat-xxxxx` | Private subnet outbound |
| Elastic IP | miyabi-nat-eip-dev | `eipalloc-xxxxx` | NAT Gateway IP |
| Public Subnet 1 | miyabi-public-us-west-2a-dev | `subnet-xxxxx` | AZ A public |
| Public Subnet 2 | miyabi-public-us-west-2b-dev | `subnet-xxxxx` | AZ B public |
| Private Subnet 1 | miyabi-private-us-west-2a-dev | `subnet-xxxxx` | AZ A private |
| Private Subnet 2 | miyabi-private-us-west-2b-dev | `subnet-xxxxx` | AZ B private |
| Route Table (Public) | miyabi-public-rt-dev | `rtb-xxxxx` | Public routing |
| Route Table (Private) | miyabi-private-rt-dev | `rtb-xxxxx` | Private routing |

### Security Resources (Issue #1021)

| Resource Type | Name | ID | Rules |
|---------------|------|----|----|
| Security Group (ALB) | miyabi-alb-sg-dev | `sg-xxxxx` | HTTP:80 in |
| Security Group (ECS) | miyabi-ecs-sg-dev | `sg-xxxxx` | 8080 from ALB |
| Security Group (RDS) | miyabi-rds-sg-dev | `sg-xxxxx` | 5432 from ECS |
| Security Group (Redis) | miyabi-redis-sg-dev | `sg-xxxxx` | 6379 from ECS |

### IAM Resources (Issue #1021)

| Resource Type | Name | ARN | Purpose |
|---------------|------|-----|---------|
| IAM Role | miyabi-ecs-execution-role-dev | `arn:aws:iam::xxxxx:role/...` | ECS task execution |
| IAM Role | miyabi-ecs-task-role-dev | `arn:aws:iam::xxxxx:role/...` | ECS task runtime |
| IAM Policy | ECS execution policy | (managed) | ECR, CloudWatch Logs |

### Compute Resources (Issue #1022, #1023)

| Resource Type | Name | ARN/ID | Configuration |
|---------------|------|--------|---------------|
| ECS Cluster | miyabi-cluster-dev | `arn:aws:ecs:...` | Container Insights enabled |
| ECS Task Definition | miyabi-app-dev | `arn:aws:ecs:...` | 0.5 vCPU, 1 GB |
| ECS Service | miyabi-service-dev | `arn:aws:ecs:...` | Desired: 2, Min: 2, Max: 4 |
| Auto-Scaling Target | ECS Service | - | CPU/Memory/Request based |
| Auto-Scaling Policy (CPU) | miyabi-cpu-autoscaling-dev | - | Target: 70% |
| Auto-Scaling Policy (Memory) | miyabi-memory-autoscaling-dev | - | Target: 80% |
| Auto-Scaling Policy (Requests) | miyabi-requests-autoscaling-dev | - | Target: 1000/task |

### Load Balancer Resources (Issue #1022)

| Resource Type | Name | ARN/DNS | Configuration |
|---------------|------|---------|---------------|
| ALB | miyabi-alb-dev | `miyabi-alb-dev-xxxxx.us-west-2.elb.amazonaws.com` | Internet-facing |
| Target Group | miyabi-tg-dev | `arn:aws:elasticloadbalancing:...` | Port 8080, /health |
| HTTP Listener | Port 80 | `arn:aws:elasticloadbalancing:...` | Forward to TG |

### Cache Resources (Issue #1022)

| Resource Type | Name | Endpoint | Configuration |
|---------------|------|----------|---------------|
| ElastiCache Cluster | miyabi-cache-dev | `miyabi-cache-dev.xxxxx.cache.amazonaws.com:6379` | cache.t3.micro, Redis 7.0 |
| Parameter Group | miyabi-redis-params-dev | - | Custom config |
| Subnet Group | miyabi-cache-subnet-dev | - | Multi-AZ |

### Monitoring Resources

| Resource Type | Name | Purpose |
|---------------|------|---------|
| CloudWatch Log Group | /ecs/miyabi-dev | ECS task logs |
| CloudWatch Alarm | miyabi-service-cpu-high-dev | CPU > 70% |
| CloudWatch Alarm | miyabi-service-memory-high-dev | Memory > 80% |
| CloudWatch Alarm | miyabi-service-low-tasks-dev | Tasks < 2 |

### Container Registry (Issue #1019)

| Resource Type | Name | URI | Purpose |
|---------------|------|-----|---------|
| ECR Repository | miyabi-web-api | `112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api` | Docker images |

---

## 🔑 Access & Credentials

### AWS Access

**AWS CLI Configuration**:
```bash
# Profile: miyabi-dev
aws configure --profile miyabi-dev
# AWS Access Key ID: (from Secrets Manager)
# AWS Secret Access Key: (from Secrets Manager)
# Default region name: us-west-2
# Default output format: json
```

**Setting Default Profile**:
```bash
export AWS_PROFILE=miyabi-dev
export AWS_DEFAULT_REGION=us-west-2
```

### Terraform State

**State Location**: Local (for dev)
- Future: S3 backend with DynamoDB locking

**Accessing State**:
```bash
cd infrastructure/terraform/environments/dev
terraform state list
terraform show
```

### Application Secrets

**Stored in AWS Secrets Manager**:
- `miyabi/dev/database-password`
- `miyabi/dev/jwt-secret`
- `miyabi/dev/api-keys`

**Retrieving Secrets**:
```bash
aws secretsmanager get-secret-value \
  --secret-id miyabi/dev/database-password \
  --query SecretString \
  --output text
```

### Database Access

**Connection String** (retrieved from Terraform):
```bash
cd infrastructure/terraform/environments/dev
terraform output -raw rds_endpoint
# Output: miyabi-db-dev.xxxxx.us-west-2.rds.amazonaws.com:5432

# Full connection string
DATABASE_URL=postgresql://miyabi_user:PASSWORD@ENDPOINT/miyabi_dev
```

**Connecting via psql**:
```bash
psql $DATABASE_URL
```

### Redis Access

**Connection String**:
```bash
cd infrastructure/terraform/environments/dev
terraform output -raw redis_connection_string
# Output: redis://miyabi-cache-dev.xxxxx.cache.amazonaws.com:6379

# Test connection
redis-cli -h $(terraform output -raw redis_endpoint)
```

---

## 🛠️ Common Operations

### 1. View Application Logs

**Real-time logs**:
```bash
aws logs tail /ecs/miyabi-dev --follow --region us-west-2
```

**Filter logs**:
```bash
# Errors only
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "ERROR" \
  --region us-west-2

# Specific time range
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --start-time $(date -u -v-1H +%s)000 \
  --end-time $(date -u +%s)000 \
  --region us-west-2
```

### 2. Check Service Health

**ECS Service Status**:
```bash
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --region us-west-2 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

**Target Health**:
```bash
# Get target group ARN
TG_ARN=$(cd infrastructure/terraform/environments/dev && terraform output -raw target_group_arn)

# Check health
aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" \
  --region us-west-2
```

**API Health Check**:
```bash
ALB_DNS=$(cd infrastructure/terraform/environments/dev && terraform output -raw alb_dns_name)
curl -i "http://${ALB_DNS}/health"
```

### 3. Restart Service

**Force new deployment** (pulls latest image):
```bash
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment \
  --region us-west-2
```

**Monitor deployment**:
```bash
watch -n 5 'aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --region us-west-2 \
  --query "services[0].deployments[]" \
  --output table'
```

### 4. Scale Service Manually

**Change desired count**:
```bash
# Scale to 3 tasks
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --desired-count 3 \
  --region us-west-2
```

**Verify scaling**:
```bash
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --region us-west-2 \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount}'
```

### 5. Deploy New Version

**Update task definition** (via Terraform):
```bash
cd infrastructure/terraform/environments/dev

# Update image tag in variables
# ecr_image_uri = "xxx.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api:v1.1.0"

terraform plan
terraform apply

# Force ECS to pick up new task definition
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment \
  --region us-west-2
```

### 6. Stop All Tasks (Maintenance)

```bash
# Scale to 0
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --desired-count 0 \
  --region us-west-2

# Resume
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --desired-count 2 \
  --region us-west-2
```

### 7. Access Running Container

**Execute command in task**:
```bash
# List tasks
TASK_ARN=$(aws ecs list-tasks \
  --cluster miyabi-cluster-dev \
  --service-name miyabi-service-dev \
  --region us-west-2 \
  --query 'taskArns[0]' \
  --output text)

# Execute command
aws ecs execute-command \
  --cluster miyabi-cluster-dev \
  --task ${TASK_ARN} \
  --container miyabi-app \
  --interactive \
  --command "/bin/sh" \
  --region us-west-2
```

### 8. View Metrics

**ECS Service Metrics**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=miyabi-service-dev Name=ClusterName,Value=miyabi-cluster-dev \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-west-2
```

**ALB Metrics**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/miyabi-alb-dev/xxxxx \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-west-2
```

---

## 📊 Monitoring & Logs

### CloudWatch Dashboards

**Container Insights Dashboard**:
- URL: https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#container-insights:performance/ecs

**Key Metrics to Monitor**:
- CPU Utilization (target: < 70%)
- Memory Utilization (target: < 80%)
- Running Task Count (target: 2)
- ALB Request Count
- ALB Target Response Time (target: < 150ms)
- ALB 5xx Errors (target: 0)

### CloudWatch Alarms

**Active Alarms**:

1. **CPU High Alarm** (`miyabi-service-cpu-high-dev`)
   - Condition: CPU > 70% for 2 periods
   - Action: SNS notification (when configured)

2. **Memory High Alarm** (`miyabi-service-memory-high-dev`)
   - Condition: Memory > 80% for 2 periods
   - Action: SNS notification (when configured)

3. **Low Tasks Alarm** (`miyabi-service-low-tasks-dev`)
   - Condition: Running tasks < 2
   - Action: SNS notification (when configured)

### Log Retention

**CloudWatch Logs**:
- Log Group: `/ecs/miyabi-dev`
- Retention: 7 days
- Size: ~100 MB/day (estimated)

**Extending Retention**:
```bash
aws logs put-retention-policy \
  --log-group-name /ecs/miyabi-dev \
  --retention-in-days 30 \
  --region us-west-2
```

---

## ⚡ Scaling & Performance

### Auto-Scaling Configuration

**Current Settings**:
- Minimum tasks: 2
- Maximum tasks: 4
- Desired tasks: 2

**Scaling Policies**:

1. **CPU-Based Scaling**
   - Target: 70% CPU utilization
   - Scale-out cooldown: 60 seconds
   - Scale-in cooldown: 300 seconds

2. **Memory-Based Scaling**
   - Target: 80% memory utilization
   - Scale-out cooldown: 60 seconds
   - Scale-in cooldown: 300 seconds

3. **Request-Based Scaling**
   - Target: 1000 requests/task
   - Scale-out cooldown: 60 seconds
   - Scale-in cooldown: 300 seconds

**Viewing Scaling Activities**:
```bash
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/miyabi-cluster-dev/miyabi-service-dev \
  --region us-west-2
```

### Performance Targets

**API Performance**:
- P50 latency: < 50ms
- P95 latency: < 100ms
- P99 latency: < 200ms
- Throughput: > 100 req/sec

**Database Performance**:
- Connection pool: 10-20 connections
- Query timeout: 5 seconds
- Slow query threshold: 1 second

**Cache Performance**:
- Redis hit ratio: > 80%
- Redis memory usage: < 80%
- Cache eviction: LRU policy

---

## 💾 Backup & Disaster Recovery

### Database Backups

**RDS Automated Backups**:
- Enabled: Yes (default)
- Retention period: 7 days
- Backup window: 03:00-04:00 UTC
- Point-in-time recovery: Enabled

**Manual Snapshot**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier miyabi-db-dev \
  --db-snapshot-identifier miyabi-db-manual-$(date +%Y%m%d-%H%M%S) \
  --region us-west-2
```

### Redis Backups

**ElastiCache Snapshots** (not automated for cache.t3.micro):
- Manual snapshots only
- Create before major changes

```bash
aws elasticache create-snapshot \
  --cache-cluster-id miyabi-cache-dev \
  --snapshot-name miyabi-cache-snapshot-$(date +%Y%m%d) \
  --region us-west-2
```

### Infrastructure as Code Backup

**Terraform State**:
- Location: Local
- Backup: Git repository
- Recommendation: Move to S3 with versioning

### Disaster Recovery Procedures

**Scenario 1: Service Completely Down**

1. Check ECS service status
2. Check ALB target health
3. Check CloudWatch logs for errors
4. Restart service with force new deployment
5. If persistent, rollback to previous task definition

**Scenario 2: Database Failure**

1. Check RDS instance status
2. If corrupted, restore from latest snapshot
3. Update connection string if endpoint changed
4. Restart ECS service

**Scenario 3: Complete Region Failure**

1. Deploy infrastructure to backup region (us-east-1)
2. Restore database from snapshot
3. Update DNS (when configured)
4. Estimated RTO: 2 hours, RPO: 15 minutes

---

## 💰 Cost Management

### Estimated Monthly Costs (Development)

| Service | Configuration | Monthly Cost (USD) |
|---------|---------------|-------------------|
| ECS Fargate | 2 tasks, 0.5 vCPU, 1 GB | ~$30 |
| ALB | 1 ALB, light traffic | ~$20 |
| NAT Gateway | 1 NAT, minimal data | ~$35 |
| RDS (future) | db.t3.micro | ~$15 |
| ElastiCache | cache.t3.micro | ~$12 |
| CloudWatch | Logs, metrics | ~$5 |
| ECR | 1 repository, few images | ~$1 |
| **Total** | | **~$118/month** |

### Cost Optimization Tips

1. **Use single NAT Gateway in dev** ✅ (Already configured)
2. **Use t3.micro instances** ✅ (Already configured)
3. **Enable CloudWatch log retention** ✅ (7 days)
4. **Right-size ECS tasks** (monitor CPU/memory usage)
5. **Consider Savings Plans for production**

### Viewing Current Costs

```bash
# AWS Cost Explorer (requires web console)
# Or use AWS CLI:
aws ce get-cost-and-usage \
  --time-period Start=$(date -v-1m +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://cost-filter.json
```

---

## 🚨 Emergency Procedures

### Emergency Contacts

- **Primary On-Call**: DevOps Team
- **Secondary On-Call**: Backend Team
- **Escalation**: CTO

### Emergency Scenarios

#### 1. Complete Service Outage

**Symptoms**:
- ALB health checks failing
- All tasks stopped
- 5xx errors from ALB

**Actions**:
```bash
# 1. Check service events
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].events[:10]'

# 2. Force restart
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment

# 3. If persistent, rollback task definition
# (via Terraform or manually)

# 4. Check CloudWatch logs for root cause
aws logs tail /ecs/miyabi-dev --since 30m
```

#### 2. Memory Leak / OOM

**Symptoms**:
- Memory utilization climbing to 100%
- Tasks being killed and restarted

**Actions**:
```bash
# 1. Immediate: Increase memory limit
cd infrastructure/terraform/environments/dev
# Edit variables: task_memory = "2048"
terraform apply

# 2. Restart service
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment

# 3. Investigate logs for memory issues
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "OutOfMemory"
```

#### 3. Database Connection Exhaustion

**Symptoms**:
- "Too many connections" errors
- Slow API responses

**Actions**:
```bash
# 1. Check RDS connections
aws rds describe-db-instances \
  --db-instance-identifier miyabi-db-dev \
  --query 'DBInstances[0].DBInstanceStatus'

# 2. Restart service to reset connection pool
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment

# 3. Long-term: Increase max_connections in RDS
# or reduce connection pool size in application
```

#### 4. DDoS / Traffic Spike

**Symptoms**:
- Unusual spike in ALB request count
- Auto-scaling hitting max capacity

**Actions**:
```bash
# 1. Immediately increase max capacity
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/miyabi-cluster-dev/miyabi-service-dev \
  --scalable-dimension ecs:service:DesiredCount \
  --max-capacity 10

# 2. Enable AWS WAF (if configured)
# 3. Monitor CloudWatch for attack patterns
# 4. Contact AWS support if suspected DDoS
```

---

## 📚 Additional Resources

### Documentation Links

- [Terraform Modules](../infrastructure/terraform/modules/)
- [Deployment Runbooks](../.ai/runbooks/)
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### AWS Console Links

- [ECS Cluster](https://console.aws.amazon.com/ecs/home?region=us-west-2#/clusters/miyabi-cluster-dev)
- [ALB](https://console.aws.amazon.com/ec2/home?region=us-west-2#LoadBalancers:)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Fecs$252Fmiyabi-dev)
- [Container Insights](https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#container-insights:performance/ecs)

### Team Runbooks

- [On-Call Procedures](./ON_CALL.md) (to be created)
- [Incident Response](./INCIDENT_RESPONSE.md) (to be created)
- [Change Management](./CHANGE_MANAGEMENT.md) (to be created)

---

## 📝 Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-18 | Initial version for M1 | Claude Code |

---

**Questions or Issues?**

- Create a GitHub issue with label `infrastructure`
- Contact DevOps team
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

**Last Review**: 2025-11-18
**Next Review**: 2025-12-18
**Owner**: Miyabi DevOps Team
