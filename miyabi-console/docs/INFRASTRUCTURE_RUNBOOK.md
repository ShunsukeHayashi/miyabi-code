# Infrastructure Runbook

**Environment**: Development (dev)
**Region**: us-west-2 (Oregon)
**Last Updated**: 2025-11-23

---

## AWS Resource Inventory

### Networking

| Resource | ID/ARN | Description |
|----------|--------|-------------|
| VPC | `vpc-*` | Main VPC for Miyabi |
| Public Subnets | `subnet-0d46c7bd1ff1867c8`, `subnet-0b42997421a533a3b` | ALB placement |
| Private Subnets | `subnet-089c7538119188b03`, `subnet-0ce130319d87ac82b` | ECS tasks |
| NAT Gateway | `nat-03af45358666e87ac` | Outbound internet access |

### Load Balancer

| Resource | Value |
|----------|-------|
| ALB ARN | `arn:aws:elasticloadbalancing:us-west-2:112530848482:loadbalancer/app/miyabi-alb-dev/5881ef6ae03743ba` |
| DNS Name | `miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com` |
| Security Group | `sg-041e093ea0d989f40` |
| Target Group | `arn:aws:elasticloadbalancing:us-west-2:112530848482:targetgroup/miyabi-tg-dev/8be3949ef237d5af` |

### ECS

| Resource | Value |
|----------|-------|
| Cluster Name | `miyabi-cluster-dev` |
| Cluster ARN | `arn:aws:ecs:us-west-2:112530848482:cluster/miyabi-cluster-dev` |
| Service Name | `miyabi-service-dev` |
| Service ARN | `arn:aws:ecs:us-west-2:112530848482:service/miyabi-cluster-dev/miyabi-service-dev` |
| Desired Count | 2 |
| Task Definition | `miyabi-app-dev:1` |
| Log Group | `/ecs/miyabi-dev` |

### Security Groups

| Name | ID | Purpose |
|------|-----|---------|
| ALB | `sg-041e093ea0d989f40` | Ingress 80/443 |
| ECS | `sg-0a57679e852c6abbf` | From ALB only |
| RDS | `sg-051602add5413aa27` | From ECS only |
| Redis | `sg-0b13d6ffc744bb2a7` | From ECS only |

### Database (RDS)

| Resource | Value |
|----------|-------|
| Security Group | `sg-051602add5413aa27` |
| Engine | PostgreSQL |
| Access | Private subnets only |

### Cache (ElastiCache Redis)

| Resource | Value |
|----------|-------|
| Cluster ID | `miyabi-cache-dev` |
| Endpoint | `miyabi-cache-dev.87vu8t.0001.usw2.cache.amazonaws.com` |
| Port | 6379 |
| Security Group | `sg-0b13d6ffc744bb2a7` |

### IAM Roles

| Role | ARN | Purpose |
|------|-----|---------|
| Task Execution | `arn:aws:iam::112530848482:role/miyabi-ecs-task-execution-dev` | Pull images, write logs |
| Task Role | `arn:aws:iam::112530848482:role/miyabi-ecs-task-dev` | App permissions |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         VPC                              │
│  ┌─────────────────┐     ┌─────────────────┐            │
│  │  Public Subnet  │     │  Public Subnet  │            │
│  │   (us-west-2a)  │     │   (us-west-2b)  │            │
│  │  ┌───────────┐  │     │                 │            │
│  │  │    ALB    │──┼─────┼─────────────────┼──▶ Internet│
│  │  └─────┬─────┘  │     │                 │            │
│  └────────┼────────┘     └─────────────────┘            │
│           │                                              │
│  ┌────────▼────────┐     ┌─────────────────┐            │
│  │ Private Subnet  │     │ Private Subnet  │            │
│  │  ┌───────────┐  │     │  ┌───────────┐  │            │
│  │  │ ECS Task  │  │     │  │ ECS Task  │  │            │
│  │  └─────┬─────┘  │     │  └─────┬─────┘  │            │
│  └────────┼────────┘     └────────┼────────┘            │
│           │                       │                      │
│           └───────────┬───────────┘                      │
│                       │                                  │
│           ┌───────────▼───────────┐                      │
│           │   RDS PostgreSQL      │                      │
│           │   ElastiCache Redis   │                      │
│           └───────────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## Common Operations

### View ECS Service Status

```bash
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].{running:runningCount,desired:desiredCount,status:status}'
```

### View ECS Tasks

```bash
aws ecs list-tasks \
  --cluster miyabi-cluster-dev \
  --service-name miyabi-service-dev

# Get task details
aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks <task-id>
```

### View CloudWatch Logs

```bash
# Last 50 log entries
aws logs tail /ecs/miyabi-dev --since 1h

# Follow logs in real-time
aws logs tail /ecs/miyabi-dev --follow
```

### Restart ECS Service

```bash
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --force-new-deployment
```

### Scale ECS Service

```bash
# Scale to 3 tasks
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --desired-count 3
```

### Check ALB Health

```bash
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-west-2:112530848482:targetgroup/miyabi-tg-dev/8be3949ef237d5af
```

### Check Redis Status

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id miyabi-cache-dev \
  --show-cache-node-info
```

---

## Access Information

### API Endpoints

| Environment | URL |
|-------------|-----|
| Development | `http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com` |
| WebSocket | `ws://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/ws` |

### Console (Frontend)

| Environment | URL |
|-------------|-----|
| S3 Bucket | `miyabi-web-dev-211234825975` |

### AWS Console Links

- [ECS Cluster](https://us-west-2.console.aws.amazon.com/ecs/home?region=us-west-2#/clusters/miyabi-cluster-dev)
- [CloudWatch Logs](https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Fecs$252Fmiyabi-dev)
- [ALB](https://us-west-2.console.aws.amazon.com/ec2/v2/home?region=us-west-2#LoadBalancers:)

---

## Cost Breakdown (Estimated Monthly)

| Service | Estimated Cost |
|---------|---------------|
| ECS (2 tasks, 0.5 vCPU, 1GB) | ~$30 |
| ALB | ~$20 |
| NAT Gateway | ~$35 |
| RDS (if enabled) | ~$50 |
| ElastiCache Redis | ~$15 |
| CloudWatch | ~$10 |
| S3 | ~$5 |
| **Total** | **~$165/month** |

---

## Terraform Management

### Apply Changes

```bash
cd infrastructure/terraform/environments/dev
terraform plan
terraform apply
```

### View State

```bash
terraform state list
terraform show
```

### Output Values

```bash
terraform output
terraform output -json
```

---

## Security Notes

1. **No public access to databases** - RDS and Redis in private subnets only
2. **Security groups** - Minimal ports open, egress restricted
3. **IAM roles** - Least privilege principle
4. **Secrets** - Stored in AWS Secrets Manager (configure as needed)

---

**Maintained by**: Miyabi Infrastructure Team
**Version**: 1.0.0
