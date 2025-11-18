# ECS Cluster, ALB & Redis Deployment Runbook

**Issue**: #1022
**Date**: 2025-11-18
**Environment**: Development (us-west-2)
**Dependencies**: Issue #1021 (VPC Infrastructure) must be deployed first
**Estimated Time**: 40-50 minutes

---

## 📋 Overview

This runbook guides you through deploying:
1. **ECS Fargate Cluster** with Container Insights enabled
2. **ECS Task Definition** (0.5 vCPU, 1 GB RAM)
3. **Application Load Balancer** (ALB) with health checks
4. **ElastiCache Redis cluster** for session storage

---

## ✅ Prerequisites

### 1. VPC Infrastructure (5 min)

**Status Check**:
```bash
cd infrastructure/terraform/environments/dev

# Verify VPC exists
terraform output vpc_id

# Verify all required outputs
terraform output -json | jq 'keys'
```

**Expected Outputs**:
```json
[
  "alb_security_group_id",
  "ecs_security_group_id",
  "ecs_task_execution_role_arn",
  "ecs_task_role_arn",
  "nat_gateway_id",
  "private_subnet_ids",
  "public_subnet_ids",
  "rds_security_group_id",
  "redis_security_group_id",
  "vpc_cidr",
  "vpc_id"
]
```

**If VPC not deployed**:
```bash
# Deploy VPC first using #1021 runbook
cat ../../.ai/runbooks/vpc-infrastructure-deployment.md
```

---

### 2. ECR Repository (2 min)

**Verify ECR repository exists**:
```bash
aws ecr describe-repositories \
  --repository-names miyabi-web-api \
  --region us-west-2
```

**Expected Output**:
```json
{
  "repositories": [
    {
      "repositoryName": "miyabi-web-api",
      "repositoryUri": "112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api"
    }
  ]
}
```

---

### 3. Docker Image (2 min)

**Verify latest image exists**:
```bash
aws ecr describe-images \
  --repository-name miyabi-web-api \
  --region us-west-2 \
  --query 'sort_by(imageDetails,& imagePushedAt)[-1]' \
  --output json
```

**Expected**: Image with tag `latest` or specific git SHA

**If no image**:
```bash
# Build and push using #1020 runbook
cat ../../.ai/runbooks/docker-build-push-ecr.md
```

---

### 4. Terraform State (1 min)

**Check current state**:
```bash
terraform show -json | jq '.values.root_module.child_modules | length'
```

**Expected**: Should show existing modules (networking, security_groups, iam)

---

## 🚀 Phase 1: Terraform Plan (10 min)

### Task 1.1: Review Module Configuration

**Inspect new modules**:
```bash
# Check ECS module
cat ../../modules/ecs/main.tf

# Check ALB module
cat ../../modules/alb/main.tf

# Check ElastiCache module
cat ../../modules/elasticache/main.tf
```

---

### Task 1.2: Run Terraform Plan

**Generate plan**:
```bash
terraform plan -out=tfplan-ecs-alb-redis
```

**Expected Resource Count**: ~20-25 resources to be created

**Resources to be created**:

1. **ECS Resources** (4):
   - `aws_ecs_cluster.main`
   - `aws_ecs_cluster_capacity_providers.main`
   - `aws_ecs_task_definition.app`
   - `aws_cloudwatch_log_group.ecs`

2. **ALB Resources** (6):
   - `aws_lb.main`
   - `aws_lb_target_group.app`
   - `aws_lb_listener.http`
   - `aws_cloudwatch_metric_alarm.target_response_time`
   - `aws_cloudwatch_metric_alarm.unhealthy_hosts`

3. **ElastiCache Resources** (6):
   - `aws_elasticache_cluster.redis`
   - `aws_elasticache_subnet_group.redis`
   - `aws_elasticache_parameter_group.redis`
   - `aws_cloudwatch_metric_alarm.redis_cpu`
   - `aws_cloudwatch_metric_alarm.redis_memory`
   - `aws_cloudwatch_metric_alarm.redis_evictions`

---

### Task 1.3: Review Plan Output

**Key items to verify**:

```bash
# Filter plan for key resources
terraform show tfplan-ecs-alb-redis | grep -A 5 "aws_ecs_cluster"
terraform show tfplan-ecs-alb-redis | grep -A 5 "aws_lb\."
terraform show tfplan-ecs-alb-redis | grep -A 5 "aws_elasticache_cluster"
```

**Verify**:
- [ ] ECS cluster name: `miyabi-cluster-dev`
- [ ] Task CPU: 512 units (0.5 vCPU)
- [ ] Task memory: 1024 MB (1 GB)
- [ ] Container port: 8080
- [ ] ALB name: `miyabi-alb-dev`
- [ ] ALB scheme: `internet-facing`
- [ ] ALB subnets: 2 public subnets
- [ ] Target group health check path: `/health`
- [ ] Redis cluster ID: `miyabi-cache-dev`
- [ ] Redis node type: `cache.t3.micro`
- [ ] Redis engine version: `7.0`

---

## 🏗️ Phase 2: Terraform Apply (30-40 min)

### Task 2.1: Apply Infrastructure

**Execute plan**:
```bash
terraform apply tfplan-ecs-alb-redis
```

**Expected Duration**: 30-40 minutes

**Creation Timeline**:
1. **ECS Cluster** (~1 min)
2. **CloudWatch Log Groups** (~1 min)
3. **ECS Task Definition** (~1 min)
4. **ALB** (~5-7 min)
5. **ALB Target Group** (~2 min)
6. **ALB Listeners** (~2 min)
7. **CloudWatch Alarms** (~2 min)
8. **ElastiCache Subnet Group** (~1 min)
9. **ElastiCache Parameter Group** (~1 min)
10. **ElastiCache Redis Cluster** ⏰ **15-20 min** (longest wait)

---

### Task 2.2: Monitor Creation Progress

**Monitor in separate terminal**:

```bash
# Watch ECS cluster
watch -n 5 'aws ecs describe-clusters --clusters miyabi-cluster-dev --region us-west-2 --query "clusters[0].status" --output text'

# Watch ALB status
watch -n 5 'aws elbv2 describe-load-balancers --names miyabi-alb-dev --region us-west-2 --query "LoadBalancers[0].State.Code" --output text'

# Watch Redis creation (this will take longest)
watch -n 10 'aws elasticache describe-cache-clusters --cache-cluster-id miyabi-cache-dev --region us-west-2 --query "CacheClusters[0].CacheClusterStatus" --output text'
```

**Expected Status Progression**:
- ECS: `ACTIVE` (after ~1 min)
- ALB: `provisioning` → `active` (after ~5-7 min)
- Redis: `creating` → `available` (after ~15-20 min)

---

### Task 2.3: Handle Terraform Output

**Capture important outputs**:
```bash
# After apply completes
terraform output -json > terraform-outputs.json

# Extract key endpoints
echo "ALB DNS: $(terraform output -raw alb_dns_name)"
echo "Redis Endpoint: $(terraform output -raw redis_connection_string)"
echo "ECS Cluster: $(terraform output -raw ecs_cluster_name)"
```

---

## ✅ Phase 3: Validation (5 min)

### Task 3.1: Verify ECS Cluster

**Check cluster status**:
```bash
aws ecs describe-clusters \
  --clusters miyabi-cluster-dev \
  --region us-west-2 \
  --query 'clusters[0]' \
  --output json
```

**Expected Output**:
```json
{
  "clusterName": "miyabi-cluster-dev",
  "status": "ACTIVE",
  "registeredContainerInstancesCount": 0,
  "runningTasksCount": 0,
  "pendingTasksCount": 0,
  "capacityProviders": ["FARGATE", "FARGATE_SPOT"],
  "settings": [
    {
      "name": "containerInsights",
      "value": "enabled"
    }
  ]
}
```

**Verify**:
- [ ] Status: `ACTIVE`
- [ ] Container Insights: `enabled`
- [ ] Capacity Providers: `FARGATE`, `FARGATE_SPOT`

---

### Task 3.2: Verify Task Definition

**Check task definition**:
```bash
TASK_DEF_ARN=$(terraform output -raw ecs_task_definition_arn)

aws ecs describe-task-definition \
  --task-definition "${TASK_DEF_ARN}" \
  --region us-west-2 \
  --query 'taskDefinition.{Family:family,Revision:revision,CPU:cpu,Memory:memory,NetworkMode:networkMode}' \
  --output json
```

**Expected Output**:
```json
{
  "Family": "miyabi-app-dev",
  "Revision": 1,
  "CPU": "512",
  "Memory": "1024",
  "NetworkMode": "awsvpc"
}
```

**Verify**:
- [ ] CPU: `512` (0.5 vCPU)
- [ ] Memory: `1024` (1 GB)
- [ ] Network mode: `awsvpc`
- [ ] Container image: Points to ECR repository

---

### Task 3.3: Verify ALB

**Check ALB status**:
```bash
ALB_DNS=$(terraform output -raw alb_dns_name)

aws elbv2 describe-load-balancers \
  --names miyabi-alb-dev \
  --region us-west-2 \
  --query 'LoadBalancers[0].{DNS:DNSName,State:State.Code,Scheme:Scheme,Type:Type}' \
  --output json
```

**Expected Output**:
```json
{
  "DNS": "miyabi-alb-dev-XXXXXXXXX.us-west-2.elb.amazonaws.com",
  "State": "active",
  "Scheme": "internet-facing",
  "Type": "application"
}
```

**Verify**:
- [ ] State: `active`
- [ ] Scheme: `internet-facing`
- [ ] DNS name accessible

---

### Task 3.4: Test ALB Health Check

**Test ALB endpoint** (will return 503 - no healthy targets yet):
```bash
curl -I "http://${ALB_DNS}/health"
```

**Expected Response**:
```
HTTP/1.1 503 Service Temporarily Unavailable
```

**This is correct!** No ECS service is deployed yet, so no healthy targets exist.

---

### Task 3.5: Verify Target Group

**Check target group**:
```bash
TG_ARN=$(terraform output -raw target_group_arn)

aws elbv2 describe-target-health \
  --target-group-arn "${TG_ARN}" \
  --region us-west-2
```

**Expected Output**:
```json
{
  "TargetHealthDescriptions": []
}
```

**This is correct!** Target group exists but has no registered targets yet.

---

### Task 3.6: Verify Redis Cluster

**Check Redis status**:
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id miyabi-cache-dev \
  --region us-west-2 \
  --show-cache-node-info \
  --query 'CacheClusters[0].{Status:CacheClusterStatus,NodeType:CacheNodeType,Engine:Engine,EngineVersion:EngineVersion,Endpoint:CacheNodes[0].Endpoint}' \
  --output json
```

**Expected Output**:
```json
{
  "Status": "available",
  "NodeType": "cache.t3.micro",
  "Engine": "redis",
  "EngineVersion": "7.0.x",
  "Endpoint": {
    "Address": "miyabi-cache-dev.xxxxxx.0001.usw2.cache.amazonaws.com",
    "Port": 6379
  }
}
```

**Verify**:
- [ ] Status: `available`
- [ ] Node type: `cache.t3.micro`
- [ ] Engine: `redis`
- [ ] Version: `7.0.x`
- [ ] Endpoint address exists

---

### Task 3.7: Test Redis Connection

**Note**: Redis is in private subnet, so you need to test from within VPC (e.g., via bastion or ECS task)

**Test command** (if you have VPC access):
```bash
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)

redis-cli -h "${REDIS_ENDPOINT}" ping
```

**Expected Response**:
```
PONG
```

**If no VPC access**: Skip this test. Redis connectivity will be verified when ECS service is deployed.

---

## 📊 Phase 4: Resource Documentation (3 min)

### Task 4.1: Capture All Outputs

**Generate summary document**:
```bash
cat > infrastructure-endpoints.txt <<EOF
# Miyabi Infrastructure Endpoints - Dev Environment
# Generated: $(date)

## Application Load Balancer
ALB_DNS: $(terraform output -raw alb_dns_name)
ALB_ARN: $(terraform output -raw alb_arn)
TARGET_GROUP_ARN: $(terraform output -raw target_group_arn)

## ECS Cluster
ECS_CLUSTER_NAME: $(terraform output -raw ecs_cluster_name)
ECS_CLUSTER_ARN: $(terraform output -raw ecs_cluster_arn)
TASK_DEFINITION_ARN: $(terraform output -raw ecs_task_definition_arn)
TASK_DEFINITION_FAMILY: $(terraform output -raw ecs_task_definition_family)
LOG_GROUP_NAME: $(terraform output -raw ecs_log_group_name)

## ElastiCache Redis
REDIS_ENDPOINT: $(terraform output -raw redis_endpoint)
REDIS_PORT: $(terraform output -raw redis_port)
REDIS_CONNECTION_STRING: $(terraform output -raw redis_connection_string)
REDIS_CLUSTER_ID: $(terraform output -raw redis_cluster_id)

## VPC Information
VPC_ID: $(terraform output -raw vpc_id)
PUBLIC_SUBNETS: $(terraform output -json public_subnet_ids | jq -r '.[]' | tr '\n' ',')
PRIVATE_SUBNETS: $(terraform output -json private_subnet_ids | jq -r '.[]' | tr '\n' ',')
EOF

cat infrastructure-endpoints.txt
```

---

### Task 4.2: Document in GitHub Issue

**Copy the above output and post to Issue #1022**:
```bash
gh issue comment 1022 --body "$(cat infrastructure-endpoints.txt)"
```

---

## 🔧 Troubleshooting

### Problem 1: Terraform Plan Shows No Changes

**Symptoms**: `terraform plan` shows "No changes. Your infrastructure matches the configuration."

**Causes**:
1. Modules already deployed
2. Wrong working directory

**Solutions**:
```bash
# Verify working directory
pwd
# Should be: .../infrastructure/terraform/environments/dev

# Check if modules exist
terraform state list | grep -E '(ecs|alb|elasticache)'

# If modules exist, check if they need updates
terraform plan -detailed-exitcode
```

---

### Problem 2: ECS Task Definition Creation Fails

**Symptoms**: Error creating task definition - invalid image URI

**Causes**:
1. ECR image doesn't exist
2. Wrong image URI in variables

**Solutions**:
```bash
# Verify ECR image exists
aws ecr describe-images \
  --repository-name miyabi-web-api \
  --region us-west-2 \
  --query 'imageDetails[*].imageTags' \
  --output json

# Update variable if needed
# Edit terraform.tfvars to set correct ECR image URI
```

---

### Problem 3: ALB Creation Takes Too Long

**Symptoms**: ALB stuck in "provisioning" state for > 10 minutes

**Causes**:
1. Subnet issues
2. Security group conflicts

**Solutions**:
```bash
# Check ALB status directly
aws elbv2 describe-load-balancers \
  --names miyabi-alb-dev \
  --region us-west-2 \
  --query 'LoadBalancers[0].State'

# Check for events/errors
aws elbv2 describe-load-balancers \
  --names miyabi-alb-dev \
  --region us-west-2 \
  --output json | jq '.LoadBalancers[0]'

# If stuck, cancel and retry
terraform destroy -target=module.alb
terraform apply -target=module.alb
```

---

### Problem 4: Redis Cluster Creation Fails

**Symptoms**: Error creating ElastiCache cluster

**Common Errors**:

**Error 1**: `InsufficientCacheClusterCapacity`
```
Solution: Change node type to cache.t3.small or retry later
```

**Error 2**: `InvalidParameterCombination - Encryption at rest not supported`
```
Solution: Disable encryption for dev environment
Edit modules/elasticache/main.tf:
  at_rest_encryption_enabled = false
```

**Error 3**: `SubnetGroupNotFound`
```
Solution: Ensure private subnets exist
terraform apply -target=module.networking
```

---

### Problem 5: CloudWatch Alarms Not Created

**Symptoms**: Alarms missing after apply

**Solution**:
```bash
# Check alarm status
aws cloudwatch describe-alarms \
  --alarm-name-prefix miyabi \
  --region us-west-2

# Recreate if missing
terraform taint module.alb.aws_cloudwatch_metric_alarm.target_response_time
terraform apply
```

---

## 🔄 Rollback Procedure

**If deployment fails and you need to rollback**:

```bash
# Destroy only new modules (keeps VPC)
terraform destroy \
  -target=module.elasticache \
  -target=module.ecs \
  -target=module.alb

# Confirm destruction
# Type: yes

# Verify cleanup
terraform state list
# Should only show: networking, security_groups, iam modules
```

---

## 📋 Post-Deployment Checklist

- [ ] ECS cluster status: `ACTIVE`
- [ ] Container Insights: `enabled`
- [ ] Task definition created with correct CPU/memory
- [ ] ALB state: `active`
- [ ] ALB DNS accessible (returns 503)
- [ ] Target group exists (empty)
- [ ] HTTP listener created (port 80)
- [ ] Redis cluster status: `available`
- [ ] Redis node type: `cache.t3.micro`
- [ ] CloudWatch log groups created
- [ ] CloudWatch alarms configured
- [ ] All outputs captured in `infrastructure-endpoints.txt`
- [ ] GitHub Issue #1022 updated with endpoints

---

## 🎯 Next Steps

**Day 5: ECS Service Deployment** (Issue #1023)

1. Create ECS Service with desired count: 2
2. Configure auto-scaling (min: 2, max: 4)
3. Attach service to ALB target group
4. Configure service discovery
5. Deploy application to ECS Fargate
6. Verify health checks pass
7. Test application via ALB DNS

**Preparation**:
```bash
# Verify all prerequisites are met
terraform output -json > day4-outputs.json

# Ready for next deployment
echo "Infrastructure ready for ECS service deployment"
```

---

## 📝 Estimated Costs (Development)

**Monthly Costs** (us-west-2):

| Resource | Specification | Monthly Cost |
|----------|---------------|--------------|
| ECS Cluster | Free tier | $0.00 |
| ECS Task (not running) | 0.5 vCPU, 1 GB | $0.00 |
| ALB | Application LB | ~$16.00 |
| ALB Processing | Low traffic | ~$2.00 |
| ElastiCache Redis | cache.t3.micro | ~$12.00 |
| CloudWatch Logs | 1 GB/month | ~$0.50 |
| CloudWatch Alarms | 6 alarms | ~$0.60 |
| **Total** | | **~$31.10/month** |

**Note**: ECS tasks will incur additional costs when service is deployed (Day 5)

**Cost Optimization**:
- Using t3.micro for Redis (smallest instance)
- Single ALB for all environments
- 7-day log retention
- No data transfer yet

---

## 📚 Additional Resources

- [AWS ECS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/)
- [ALB Target Groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)
- [ElastiCache for Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/)
- [CloudWatch Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)

---

**Runbook Version**: 1.0
**Last Updated**: 2025-11-18
**Owner**: Miyabi DevOps Team
**Status**: Ready for Execution
