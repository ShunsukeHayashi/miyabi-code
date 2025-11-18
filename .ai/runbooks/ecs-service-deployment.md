# ECS Service Deployment & Validation Runbook

**Issue**: #1023
**Date**: 2025-11-18
**Environment**: Development (us-west-2)
**Dependencies**: Issues #1021 (VPC), #1022 (ECS Cluster, ALB, Redis) must be deployed
**Estimated Time**: 30-40 minutes

---

## 📋 Overview

This runbook deploys the ECS Fargate service with:
- 2 ECS tasks running the miyabi-web-api application
- Auto-scaling (min: 2, max: 4 tasks)
- Integration with ALB for load balancing
- Health check monitoring
- CloudWatch alarms for service health

---

## ✅ Prerequisites

### 1. Infrastructure Status Check (5 min)

**Verify all previous deployments completed**:
```bash
cd infrastructure/terraform/environments/dev

# Check Terraform state
terraform state list

# Should show modules:
# - module.networking
# - module.security_groups
# - module.iam
# - module.alb
# - module.ecs
# - module.elasticache
```

**Verify key resources**:
```bash
# ECS Cluster
aws ecs describe-clusters --clusters miyabi-cluster-dev --region us-west-2 --query 'clusters[0].status'
# Expected: "ACTIVE"

# ALB
aws elbv2 describe-load-balancers --names miyabi-alb-dev --region us-west-2 --query 'LoadBalancers[0].State.Code'
# Expected: "active"

# Redis
aws elasticache describe-cache-clusters --cache-cluster-id miyabi-cache-dev --region us-west-2 --query 'CacheClusters[0].CacheClusterStatus'
# Expected: "available"
```

---

## 🚀 Phase 1: Deploy ECS Service (10 min)

### Task 1.1: Review Service Configuration

```bash
# Check ECS Service module configuration
cat ../../modules/ecs-service/main.tf | grep -A 5 "resource \"aws_ecs_service\""

# Verify desired count
grep ecs_desired_count terraform.tfvars || echo "Using default: 2"
```

---

### Task 1.2: Terraform Plan

```bash
terraform plan -out=tfplan-ecs-service
```

**Expected Resources (~15-20 resources)**:
- `aws_ecs_service.app` - ECS Service
- `aws_appautoscaling_target.ecs` - Auto-scaling target
- `aws_appautoscaling_policy.ecs_cpu` - CPU-based scaling
- `aws_appautoscaling_policy.ecs_memory` - Memory-based scaling
- `aws_appautoscaling_policy.ecs_requests` - Request count scaling
- 3x `aws_cloudwatch_metric_alarm` - Service health alarms

**Verify Configuration**:
- Service name: `miyabi-service-dev`
- Desired count: 2
- Launch type: FARGATE
- Network mode: awsvpc
- Subnets: Private subnets
- Load balancer attached: Yes
- Auto-scaling min/max: 2-4

---

### Task 1.3: Deploy Service

```bash
terraform apply tfplan-ecs-service
```

**Creation Timeline** (~5-10 min):
1. **Auto-scaling target** (~30 sec)
2. **Auto-scaling policies** (~1 min)
3. **CloudWatch alarms** (~1 min)
4. **ECS Service** (~2-3 min)
5. **Tasks starting** (~3-5 min)

---

## 🔍 Phase 2: Monitor Task Startup (10 min)

### Task 2.1: Watch Service Status

```bash
# Monitor in real-time
watch -n 5 'aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --region us-west-2 \
  --query "services[0].{RunningCount:runningCount,DesiredCount:desiredCount,Status:status}" \
  --output table'
```

**Expected Progression**:
- Running: 0/2 → 1/2 → 2/2
- Status: ACTIVE

---

### Task 2.2: List and Describe Tasks

```bash
# Get task ARNs
TASK_ARNS=$(aws ecs list-tasks \
  --cluster miyabi-cluster-dev \
  --service-name miyabi-service-dev \
  --region us-west-2 \
  --query 'taskArns[]' \
  --output text)

echo "Tasks: ${TASK_ARNS}"

# Describe first task
aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks $(echo ${TASK_ARNS} | cut -d' ' -f1) \
  --region us-west-2 \
  --query 'tasks[0].{LastStatus:lastStatus,HealthStatus:healthStatus,Containers:containers[0].{Name:name,Status:lastStatus,Health:healthStatus}}'
```

**Expected**:
- LastStatus: RUNNING
- HealthStatus: HEALTHY
- Container Status: RUNNING
- Container Health: HEALTHY

---

### Task 2.3: Stream Application Logs

```bash
# Tail logs
aws logs tail /ecs/miyabi-dev --follow --region us-west-2

# Filter for startup messages
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "started" \
  --limit 10 \
  --region us-west-2
```

**Look for**:
- "Server started successfully"
- "Listening on port 8080"
- No error messages

---

## ✅ Phase 3: Validate Health Checks (5 min)

### Task 3.1: Check Target Group Health

```bash
TG_ARN=$(terraform output -raw target_group_arn)

aws elbv2 describe-target-health \
  --target-group-arn "${TG_ARN}" \
  --region us-west-2 \
  --query 'TargetHealthDescriptions[].{Target:Target.Id,Port:Target.Port,Health:TargetHealth.State}' \
  --output table
```

**Expected Output**:
```
-----------------------------------------
|       DescribeTargetHealth           |
+---------------+------+----------------+
|    Health     | Port |    Target      |
+---------------+------+----------------+
|  healthy      |  8080|  10.0.11.x     |
|  healthy      |  8080|  10.0.11.y     |
+---------------+------+----------------+
```

**Status**: 2/2 targets healthy

---

### Task 3.2: Test ALB Health Endpoint

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)

curl -i "http://${ALB_DNS}/health"
```

**Expected Response**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok","version":"1.0.0","timestamp":"2025-11-18T..."}
```

---

## 🧪 Phase 4: API Endpoint Testing (10 min)

### Task 4.1: Test Authentication Endpoint

```bash
# Login attempt
curl -X POST "http://${ALB_DNS}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@miyabi.ai","password":"test123"}' \
  -v

# Expected: 200 OK with JWT token OR 401 Unauthorized (both valid)
```

---

### Task 4.2: Test Protected Endpoints

```bash
# Without authentication (should fail)
curl -i "http://${ALB_DNS}/api/v1/agents"
# Expected: 401 Unauthorized

# With authentication
TOKEN="<your-jwt-token>"
curl -H "Authorization: Bearer ${TOKEN}" \
  "http://${ALB_DNS}/api/v1/agents"
# Expected: 200 OK with agent list
```

---

### Task 4.3: Performance Test

```bash
# Install apache bench if needed
# brew install apache-bench (macOS)

# Run load test
ab -n 100 -c 10 "http://${ALB_DNS}/health"
```

**Expected Performance**:
- Requests per second: >50
- Time per request: <200ms
- Failed requests: 0

---

## 🔌 Phase 5: Database & Redis Validation (5 min)

### Task 5.1: Check Database Connection Logs

```bash
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "database" \
  --limit 20 \
  --region us-west-2 \
  --query 'events[].message' \
  --output text
```

**Look for**:
- "Database connected successfully"
- "Connection pool initialized"
- NO: "Connection failed" or "Database error"

---

### Task 5.2: Check Redis Connection Logs

```bash
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "redis" \
  --limit 20 \
  --region us-west-2 \
  --query 'events[].message' \
  --output text
```

**Look for**:
- "Redis connected"
- "Cache initialized"
- NO: "Redis connection failed"

---

## 📊 Phase 6: Auto-Scaling Verification (Optional, 5 min)

### Task 6.1: Check Auto-Scaling Configuration

```bash
# List scaling policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/miyabi-cluster-dev/miyabi-service-dev \
  --region us-west-2 \
  --query 'ScalingPolicies[].{Name:PolicyName,Type:PolicyType,TargetValue:TargetTrackingScalingPolicyConfiguration.TargetValue}' \
  --output table
```

**Expected**: 3 policies (CPU, Memory, Requests)

---

### Task 6.2: Verify CloudWatch Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix miyabi-service \
  --region us-west-2 \
  --query 'MetricAlarms[].{Name:AlarmName,State:StateValue,Metric:MetricName}' \
  --output table
```

**Expected Alarms**:
- `miyabi-service-cpu-high-dev` - OK
- `miyabi-service-memory-high-dev` - OK
- `miyabi-service-low-tasks-dev` - OK

---

## 📋 Post-Deployment Checklist

- [ ] ECS service status: ACTIVE
- [ ] Running tasks: 2/2
- [ ] All tasks status: RUNNING
- [ ] All tasks health: HEALTHY
- [ ] ALB target group: 2/2 healthy
- [ ] Health endpoint: 200 OK
- [ ] Auth endpoint: Responding
- [ ] Protected endpoints: Require auth
- [ ] Database: Connected
- [ ] Redis: Connected
- [ ] Auto-scaling: 3 policies active
- [ ] CloudWatch alarms: 3 alarms OK
- [ ] Performance: >50 req/sec
- [ ] No errors in logs

---

## 🔧 Troubleshooting

### Problem 1: Tasks Not Starting

**Symptoms**: Tasks stuck in PENDING or PROVISIONING

**Causes**:
1. Insufficient subnet IP addresses
2. ECR image pull failure
3. Task execution role permissions

**Solutions**:
```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks <task-arn> \
  --query 'tasks[0].stoppedReason'

# Check events
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].events[:5]'

# Common fixes:
# - Verify ECR image exists and is accessible
# - Check subnet CIDR has available IPs
# - Verify task execution role has ECR permissions
```

---

### Problem 2: Health Checks Failing

**Symptoms**: Targets showing "unhealthy" in target group

**Causes**:
1. Application not listening on port 8080
2. Health endpoint not responding
3. Security group blocking traffic

**Solutions**:
```bash
# Check task logs
aws logs tail /ecs/miyabi-dev --follow

# Test from within VPC (if bastion available)
curl http://<task-private-ip>:8080/health

# Verify security group
aws ec2 describe-security-groups \
  --group-ids <ecs-sg-id> \
  --query 'SecurityGroups[0].IpPermissions'
```

---

### Problem 3: Tasks Restarting

**Symptoms**: Tasks continuously stopping and restarting

**Check Logs**:
```bash
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "error" \
  --limit 50
```

**Common Causes**:
- Application crashes (check logs)
- Out of memory (check task memory limits)
- Failed health checks (check /health endpoint)

---

### Problem 4: Database Connection Fails

**Check Connection String**:
```bash
# Verify RDS endpoint is set
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "DATABASE_URL"

# Check security group
# - RDS security group must allow port 5432 from ECS security group
```

---

### Problem 5: Auto-Scaling Not Working

**Verify Policies**:
```bash
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/miyabi-cluster-dev/miyabi-service-dev \
  --region us-west-2
```

**Check Metrics**:
```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=miyabi-service-dev Name=ClusterName,Value=miyabi-cluster-dev \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# Option 1: Scale down to 0 (preserve service)
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --desired-count 0 \
  --region us-west-2

# Option 2: Delete service (clean slate)
terraform destroy -target=module.ecs_service

# Option 3: Full rollback
terraform destroy
```

---

## 📊 Monitoring Dashboard

**CloudWatch Container Insights**: 
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#container-insights:performance/ecs

**Key Metrics to Monitor**:
- CPU Utilization (target: <70%)
- Memory Utilization (target: <80%)
- Running Task Count (target: 2)
- Target Response Time (target: <150ms)
- Healthy Host Count (target: 2)

---

## 🎯 Success Criteria

✅ **Deployment Successful** when:
1. All 2 tasks running and healthy
2. ALB health checks passing (2/2)
3. Application accessible via ALB DNS
4. Auth endpoints responding
5. Database and Redis connected
6. Auto-scaling policies active
7. No errors in CloudWatch logs
8. Performance meets targets

---

## 📝 Next Steps

After successful deployment:

1. **Monitor for 15 minutes** - Ensure stability
2. **Run full test suite** - E2E integration tests
3. **Configure monitoring alerts** - Set up SNS notifications
4. **Document endpoints** - Update API documentation
5. **Plan production deployment** - Apply learnings

---

**Runbook Version**: 1.0
**Last Updated**: 2025-11-18
**Owner**: Miyabi DevOps Team
**Status**: Ready for Execution
