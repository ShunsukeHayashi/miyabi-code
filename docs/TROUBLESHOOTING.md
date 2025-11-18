# Miyabi Troubleshooting Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Environment**: Development (us-west-2)
**Owner**: Miyabi DevOps Team

---

## 📋 Table of Contents

1. [Quick Diagnostic Commands](#quick-diagnostic-commands)
2. [Service Issues](#service-issues)
3. [Network & Connectivity](#network--connectivity)
4. [Database Issues](#database-issues)
5. [Cache (Redis) Issues](#cache-redis-issues)
6. [Deployment Problems](#deployment-problems)
7. [Performance Issues](#performance-issues)
8. [Security & Access](#security--access)
9. [Monitoring & Logs](#monitoring--logs)

---

## 🔍 Quick Diagnostic Commands

**Run these first to quickly assess system health**:

```bash
# Set environment
export AWS_REGION=us-west-2
cd infrastructure/terraform/environments/dev

# 1. Check ECS service status
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Health:healthCheckGracePeriodSeconds}'

# 2. Check ALB target health
TG_ARN=$(terraform output -raw target_group_arn)
aws elbv2 describe-target-health --target-group-arn "$TG_ARN"

# 3. Test API health endpoint
ALB_DNS=$(terraform output -raw alb_dns_name)
curl -i "http://${ALB_DNS}/health"

# 4. Check recent logs for errors
aws logs tail /ecs/miyabi-dev --since 30m --filter-pattern "ERROR"

# 5. Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix miyabi-service \
  --state-value ALARM
```

**Expected Results**:
- ✅ ECS: Status=ACTIVE, Running=2, Desired=2
- ✅ ALB: All targets "healthy"
- ✅ API: HTTP 200 OK
- ✅ Logs: No critical errors
- ✅ Alarms: No ALARM state

---

## 🚨 Service Issues

### Issue #1: Service Not Starting (All Tasks Stopped)

**Symptoms**:
- Running count: 0/2
- Tasks constantly restarting
- Service events show task stopped

**Diagnostic Steps**:

```bash
# 1. Check service events
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].events[:5]'

# 2. Get stopped task details
STOPPED_TASKS=$(aws ecs list-tasks \
  --cluster miyabi-cluster-dev \
  --desired-status STOPPED \
  --query 'taskArns[0]' \
  --output text)

aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks $STOPPED_TASKS \
  --query 'tasks[0].{StoppedReason:stoppedReason,StoppedAt:stoppedAt,Containers:containers[0].reason}'

# 3. Check logs for startup errors
aws logs tail /ecs/miyabi-dev --since 1h
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **ECR Image Pull Failure** | Verify ECR image exists: `aws ecr describe-images --repository-name miyabi-web-api` |
| **Container Crash on Startup** | Check application logs for panic/error during initialization |
| **Insufficient Memory** | Increase task memory: Update `task_memory` in Terraform variables |
| **Health Check Failing** | Verify /health endpoint works: Connect to task directly via private IP |
| **IAM Permissions** | Verify ECS task execution role has ECR and CloudWatch Logs permissions |

**Quick Fix** (Force restart):
```bash
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment
```

---

### Issue #2: Tasks Running But Unhealthy

**Symptoms**:
- Tasks showing RUNNING status
- Target group shows "unhealthy"
- ALB returning 502/503 errors

**Diagnostic Steps**:

```bash
# 1. Check target health details
TG_ARN=$(cd infrastructure/terraform/environments/dev && terraform output -raw target_group_arn)
aws elbv2 describe-target-health \
  --target-group-arn "$TG_ARN" \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason,Description:TargetHealth.Description}'

# 2. Get task private IPs
aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks $(aws ecs list-tasks --cluster miyabi-cluster-dev --service-name miyabi-service-dev --query 'taskArns[0]' --output text) \
  --query 'tasks[0].attachments[0].details[?name==`privateIPv4Address`].value' \
  --output text

# 3. Test health endpoint directly (if you have bastion/VPN access)
# curl http://<TASK_PRIVATE_IP>:8080/health
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **Application not listening on port 8080** | Check app config, verify PORT environment variable |
| **Health endpoint not implemented** | Implement /health endpoint returning 200 OK |
| **Security group blocking traffic** | Verify ECS SG allows port 8080 from ALB SG |
| **Application crash after start** | Check logs: `aws logs tail /ecs/miyabi-dev --follow` |
| **Slow startup** | Increase health check grace period in service config |

**Quick Fix** (Adjust health check):
```bash
# Update health check thresholds (via Terraform)
# In alb module: healthy_threshold = 3, unhealthy_threshold = 5, interval = 60
terraform apply
```

---

### Issue #3: Service Stuck in "Draining" State

**Symptoms**:
- Deployment takes > 10 minutes
- Old tasks not terminating
- Service events show "deregistering targets"

**Diagnostic Steps**:

```bash
# Check deployment status
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].deployments[]'
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **Long-running requests** | Wait for requests to complete (ALB draining timeout: 300s) |
| **Application not gracefully shutting down** | Implement SIGTERM handler in application |
| **Circuit breaker triggered** | Check if new tasks are failing health checks |

**Quick Fix** (Force stop old tasks):
```bash
# Get old task ARNs
OLD_TASKS=$(aws ecs list-tasks \
  --cluster miyabi-cluster-dev \
  --family miyabi-app-dev \
  --query 'taskArns[]' \
  --output text)

# Stop them
for TASK in $OLD_TASKS; do
  aws ecs stop-task --cluster miyabi-cluster-dev --task $TASK
done
```

---

## 🌐 Network & Connectivity

### Issue #4: Cannot Access API via ALB

**Symptoms**:
- `curl http://ALB_DNS/health` times out
- Connection refused or no response

**Diagnostic Steps**:

```bash
# 1. Verify ALB exists and is active
aws elbv2 describe-load-balancers \
  --names miyabi-alb-dev \
  --query 'LoadBalancers[0].{State:State.Code,DNS:DNSName,Scheme:Scheme}'

# 2. Check ALB security group
ALB_SG=$(aws elbv2 describe-load-balancers \
  --names miyabi-alb-dev \
  --query 'LoadBalancers[0].SecurityGroups[0]' \
  --output text)

aws ec2 describe-security-groups \
  --group-ids $ALB_SG \
  --query 'SecurityGroups[0].IpPermissions[]'

# 3. Check listener rules
aws elbv2 describe-listeners \
  --load-balancer-arn $(aws elbv2 describe-load-balancers --names miyabi-alb-dev --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# 4. DNS resolution
nslookup $(cd infrastructure/terraform/environments/dev && terraform output -raw alb_dns_name)
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **ALB Security Group blocks HTTP** | Add inbound rule: HTTP (80) from 0.0.0.0/0 |
| **No healthy targets** | Fix task health issues (see Issue #2) |
| **Listener not configured** | Verify HTTP:80 listener exists and forwards to target group |
| **ALB in wrong subnets** | Verify ALB is in public subnets with IGW route |

---

### Issue #5: CORS Errors from Frontend

**Symptoms**:
- Browser console shows CORS policy errors
- Frontend can't connect to API

**Diagnostic Steps**:

```bash
# Test CORS headers
curl -i -H "Origin: http://localhost:4173" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "http://$(cd infrastructure/terraform/environments/dev && terraform output -raw alb_dns_name)/api/v1/users"
```

**Expected Response Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Solution**:
1. Verify backend has CORS middleware configured
2. Check allowed origins include frontend domain
3. Ensure OPTIONS preflight requests return 200 OK

---

## 🗄️ Database Issues

### Issue #6: Database Connection Failures

**Symptoms**:
- Logs show "connection refused" or "timeout"
- Tasks fail health checks after startup

**Diagnostic Steps**:

```bash
# 1. Check if RDS instance exists (when deployed)
aws rds describe-db-instances \
  --db-instance-identifier miyabi-db-dev \
  --query 'DBInstances[0].{Endpoint:Endpoint.Address,Status:DBInstanceStatus,Port:Endpoint.Port}'

# 2. Check RDS security group
RDS_SG=$(aws rds describe-db-instances \
  --db-instance-identifier miyabi-db-dev \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

aws ec2 describe-security-groups \
  --group-ids $RDS_SG \
  --query 'SecurityGroups[0].IpPermissions[]'

# 3. Check application logs
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "database"
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **RDS SG doesn't allow ECS** | Add inbound rule: PostgreSQL (5432) from ECS security group |
| **Wrong connection string** | Verify DATABASE_URL env var or secret |
| **Connection pool exhausted** | Increase max_connections in RDS parameter group |
| **Database not initialized** | Run migrations: Connect via bastion and run `diesel migration run` |

---

### Issue #7: Slow Database Queries

**Symptoms**:
- API responses taking > 1 second
- High database CPU utilization

**Diagnostic Steps**:

```bash
# Check RDS performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=miyabi-db-dev \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Solutions**:
1. Enable slow query log in RDS
2. Add database indexes for frequently queried columns
3. Optimize N+1 queries (use joins or batch loading)
4. Enable query result caching
5. Upgrade RDS instance type if consistently high CPU

---

## 🔄 Cache (Redis) Issues

### Issue #8: Redis Connection Failures

**Symptoms**:
- Logs show "Redis connection refused"
- Cache misses 100%

**Diagnostic Steps**:

```bash
# 1. Check ElastiCache cluster status
aws elasticache describe-cache-clusters \
  --cache-cluster-id miyabi-cache-dev \
  --show-cache-node-info \
  --query 'CacheClusters[0].{Status:CacheClusterStatus,Endpoint:CacheNodes[0].Endpoint}'

# 2. Check Redis security group
REDIS_SG=$(cd infrastructure/terraform/environments/dev && terraform output -raw redis_security_group_id)
aws ec2 describe-security-groups \
  --group-ids $REDIS_SG \
  --query 'SecurityGroups[0].IpPermissions[]'

# 3. Check logs for Redis errors
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "redis"
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **Redis SG doesn't allow ECS** | Add inbound rule: Redis (6379) from ECS security group |
| **Wrong endpoint** | Verify REDIS_URL env var matches Terraform output |
| **Redis out of memory** | Check memory usage, increase node type or configure eviction policy |

---

### Issue #9: High Cache Miss Rate

**Symptoms**:
- Cache hit ratio < 50%
- Slow API responses

**Diagnostic Steps**:

```bash
# Check Redis memory usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name DatabaseMemoryUsagePercentage \
  --dimensions Name=CacheClusterId,Value=miyabi-cache-dev \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Solutions**:
1. Review cache key expiration times (TTL)
2. Implement cache warming for frequently accessed data
3. Check eviction policy (should be `allkeys-lru`)
4. Increase Redis memory if consistently high usage

---

## 🚀 Deployment Problems

### Issue #10: Terraform Apply Fails

**Symptoms**:
- `terraform apply` returns errors
- Resources not created/updated

**Common Errors & Solutions**:

**Error**: `Error: insufficient subnet IPs`
```bash
# Solution: Expand subnet CIDR or use larger subnet
# In variables.tf: private_subnet_cidrs = ["10.0.11.0/23", "10.0.12.0/23"]
terraform apply
```

**Error**: `Error: InvalidParameterException: No Container Instances`
```bash
# This is expected for Fargate - ignore if using Fargate launch type
# Verify launch_type = "FARGATE" in ECS service config
```

**Error**: `Error: ResourceInUseException: Target group is associated with a different resource`
```bash
# Destroy and recreate:
terraform destroy -target=module.alb.aws_lb_target_group.app
terraform apply
```

**General Troubleshooting**:
```bash
# 1. Check Terraform state
terraform state list

# 2. Refresh state
terraform refresh

# 3. Detailed error output
terraform apply -var-file=terraform.tfvars

# 4. If state corrupted, import resource
terraform import <resource_type>.<resource_name> <resource_id>
```

---

### Issue #11: Docker Image Build Fails

**Symptoms**:
- `docker build` errors
- ECR push fails

**Solutions**:

```bash
# 1. Clean Docker cache
docker system prune -a

# 2. Rebuild with no cache
docker build --no-cache -t miyabi-web-api:latest .

# 3. Check Dockerfile syntax
docker build --progress=plain -t miyabi-web-api:latest .

# 4. Verify ECR permissions
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  112530848482.dkr.ecr.us-west-2.amazonaws.com
```

---

## ⚡ Performance Issues

### Issue #12: High API Latency (> 200ms)

**Symptoms**:
- API responses slow
- CloudWatch shows high response times

**Diagnostic Steps**:

```bash
# 1. Check ECS task CPU/Memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=miyabi-service-dev Name=ClusterName,Value=miyabi-cluster-dev \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# 2. Check ALB response times
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/miyabi-alb-dev/xxx \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,p95,p99

# 3. Check slow queries in logs
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "slow query"
```

**Solutions**:
1. **High CPU**: Scale up (increase vCPU) or scale out (more tasks)
2. **High Memory**: Increase task memory allocation
3. **Database Slow**: Add indexes, optimize queries
4. **Cache Miss**: Implement caching for frequently accessed data
5. **Slow External APIs**: Add timeout and circuit breaker

---

### Issue #13: Auto-Scaling Not Working

**Symptoms**:
- Task count stays at 2 despite high load
- No scaling activities

**Diagnostic Steps**:

```bash
# 1. Check scaling policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/miyabi-cluster-dev/miyabi-service-dev

# 2. Check scaling activities
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/miyabi-cluster-dev/miyabi-service-dev \
  --max-results 10

# 3. Check metric alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix miyabi-service
```

**Common Causes**:
1. CPU/Memory never reaches threshold (70%/80%)
2. Scaling cooldown period (5 minutes)
3. Already at max capacity (4 tasks)
4. Scaling policy misconfigured

**Solution** (Test scaling manually):
```bash
# Manually scale to test
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --desired-count 3
```

---

## 🔒 Security & Access

### Issue #14: Authentication Failures

**Symptoms**:
- Login returns 401 Unauthorized
- "Invalid credentials" error

**Diagnostic Steps**:

```bash
# Test login endpoint
curl -X POST "http://$(cd infrastructure/terraform/environments/dev && terraform output -raw alb_dns_name)/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@miyabi.ai","password":"password123"}' \
  -v
```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| **User doesn't exist** | Create user in database or register via /api/v1/auth/register |
| **Wrong password** | Reset password or use correct credentials |
| **JWT secret mismatch** | Verify JWT_SECRET env var is set correctly |
| **Token expired** | Request new token via login |

---

### Issue #15: Missing IAM Permissions

**Symptoms**:
- Tasks can't pull ECR images
- Can't write to CloudWatch Logs

**Solution**:

```bash
# Check ECS task execution role
aws iam get-role-policy \
  --role-name miyabi-ecs-execution-role-dev \
  --policy-name ecs-execution-policy

# Required policies:
# - AmazonECSTaskExecutionRolePolicy (managed)
# - ECR read access
# - CloudWatch Logs write access

# If missing, re-apply Terraform IAM module
cd infrastructure/terraform/environments/dev
terraform apply -target=module.iam
```

---

## 📊 Monitoring & Logs

### Issue #16: Logs Not Appearing in CloudWatch

**Symptoms**:
- `/ecs/miyabi-dev` log group empty
- No logs from application

**Diagnostic Steps**:

```bash
# 1. Check log group exists
aws logs describe-log-groups \
  --log-group-name-prefix /ecs/miyabi-dev

# 2. Check task definition logging config
aws ecs describe-task-definition \
  --task-definition miyabi-app-dev \
  --query 'taskDefinition.containerDefinitions[0].logConfiguration'

# 3. Check IAM permissions (task execution role)
# Must have logs:CreateLogStream and logs:PutLogEvents
```

**Solutions**:
1. Verify log group exists and matches task definition
2. Check ECS task execution role has CloudWatch Logs permissions
3. Ensure application writes to stdout/stderr (not files)

---

### Issue #17: CloudWatch Alarms Not Triggering

**Symptoms**:
- CPU at 90% but no alarm
- Alarms stuck in "Insufficient Data"

**Diagnostic Steps**:

```bash
# Check alarm configuration
aws cloudwatch describe-alarms \
  --alarm-names miyabi-service-cpu-high-dev

# Check if metrics are being published
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=miyabi-service-dev Name=ClusterName,Value=miyabi-cluster-dev \
  --start-time $(date -u -v-30m +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

**Solutions**:
1. Verify Container Insights is enabled on ECS cluster
2. Check alarm metric name and dimensions match actual metrics
3. Ensure evaluation periods and threshold are reasonable

---

## 🆘 Emergency Procedures

### Complete Service Outage

```bash
# 1. Check all components
./scripts/health-check-all.sh  # (to be created)

# 2. Restart service
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment

# 3. If persistent, rollback
cd infrastructure/terraform/environments/dev
# Revert ecr_image_uri to previous version
terraform apply
aws ecs update-service --cluster miyabi-cluster-dev --service miyabi-service-dev --force-new-deployment
```

### Rollback Deployment

```bash
# Option 1: Terraform rollback
cd infrastructure/terraform/environments/dev
git checkout HEAD~1 -- main.tf variables.tf
terraform apply

# Option 2: Manual task definition rollback
PREV_TASK_DEF=$(aws ecs list-task-definitions \
  --family-prefix miyabi-app-dev \
  --sort DESC \
  --query 'taskDefinitionArns[1]' \
  --output text)

aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --task-definition $PREV_TASK_DEF \
  --force-new-deployment
```

---

## 📞 Support Escalation

### Escalation Path

1. **Level 1**: Check this guide and try documented solutions
2. **Level 2**: Check CloudWatch logs and AWS console
3. **Level 3**: Contact DevOps team with:
   - Error message
   - Steps to reproduce
   - Logs/screenshots
   - Changes made recently
4. **Level 4**: AWS Support (if infrastructure issue)

### Information to Gather Before Escalating

```bash
# Run diagnostic bundle
cat > /tmp/miyabi-diagnostic.sh <<'EOF'
#!/bin/bash
echo "=== ECS Service Status ==="
aws ecs describe-services --cluster miyabi-cluster-dev --services miyabi-service-dev

echo "=== Target Health ==="
aws elbv2 describe-target-health --target-group-arn $(cd infrastructure/terraform/environments/dev && terraform output -raw target_group_arn)

echo "=== Recent Logs (last 100 lines) ==="
aws logs tail /ecs/miyabi-dev --since 30m | tail -100

echo "=== CloudWatch Alarms ==="
aws cloudwatch describe-alarms --alarm-name-prefix miyabi-service --state-value ALARM
EOF

chmod +x /tmp/miyabi-diagnostic.sh
/tmp/miyabi-diagnostic.sh > /tmp/miyabi-diagnostic-output.txt 2>&1
```

---

## 📚 Additional Resources

- [Infrastructure Runbook](./INFRASTRUCTURE_RUNBOOK.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [AWS ECS Troubleshooting](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/troubleshooting.html)
- [AWS ALB Troubleshooting](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html)

---

**Questions or Issues?**

- Create a GitHub issue with label `bug` or `question`
- Contact DevOps team in Slack #miyabi-devops
- Emergency: Call on-call engineer

**Last Review**: 2025-11-18
**Next Review**: 2025-12-18
**Owner**: Miyabi DevOps Team
