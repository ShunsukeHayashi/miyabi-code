# VPC & Infrastructure Deployment - Runbook

**Issue**: #1021
**Part of**: M1 Infrastructure Blitz (#1018)
**Depends on**: Issue #1020 (Docker Image in ECR)
**Created**: 2025-11-18
**Owner**: MUGEN (Primary), Orchestrator (Coordination)
**Duration**: ~30-40 minutes

---

## 🎯 Objectives

1. Deploy production-grade VPC with multi-AZ architecture
2. Create security groups for all infrastructure components
3. Set up IAM roles for ECS task execution
4. Establish networking foundation for ECS deployment

---

## ✅ Prerequisites

Before starting, verify:

```bash
# 1. AWS CLI configured
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "...",
#     "Account": "112530848482",
#     "Arn": "arn:aws:iam::112530848482:user/..."
# }

# 2. Terraform installed
terraform version

# Expected: Terraform v1.5.0 or higher

# 3. ECR image exists (from Issue #1020)
aws ecr describe-images \
  --repository-name miyabi-web-api \
  --region us-west-2 \
  --query 'imageDetails[0].imageTags' \
  --output text

# Expected: latest <git-sha>

# 4. Repository up to date
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
git status
```

---

## 📦 Task 1: Initialize Terraform (5 min)

### 1.1 Navigate to Terraform Directory

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/infrastructure/terraform/environments/dev
```

### 1.2 Review Terraform Configuration

```bash
# List all .tf files
ls -la *.tf

# Expected files:
# - main.tf          (main configuration)
# - variables.tf     (variable definitions)
# - outputs.tf       (output definitions)
# - terraform.tfvars (environment-specific values)

# Verify terraform.tfvars
cat terraform.tfvars
```

**Expected content**:
```hcl
project_name = "miyabi"
environment  = "dev"
aws_region   = "us-west-2"

vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

ecr_image_uri = "112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api:latest"
```

### 1.3 Initialize Terraform

```bash
terraform init
```

**Expected output**:
```
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.x.x...

Terraform has been successfully initialized!
```

**Verification**:
```bash
# Check for .terraform directory
ls -la .terraform

# Verify lock file
cat .terraform.lock.hcl | grep "hashicorp/aws"
```

---

## 🔍 Task 2: Terraform Plan (10 min)

### 2.1 Generate Execution Plan

```bash
terraform plan \
  -out=tfplan-day3-vpc-infrastructure \
  -var-file=terraform.tfvars
```

**Expected resource count**: ~20-25 resources

**Key resources to review**:

1. **VPC** (1 resource):
   - CIDR: 10.0.0.0/16
   - DNS support: enabled
   - DNS hostnames: enabled

2. **Subnets** (4 resources):
   - Public subnets: 2 (10.0.1.0/24, 10.0.2.0/24)
   - Private subnets: 2 (10.0.11.0/24, 10.0.12.0/24)
   - AZs: us-west-2a, us-west-2b

3. **Gateways** (2 resources):
   - Internet Gateway: 1
   - NAT Gateway: 1 (single for dev cost optimization)

4. **Route Tables** (2 resources):
   - Public route table: 1
   - Private route table: 1

5. **Security Groups** (4 resources):
   - ALB SG: Allow 80/443 from internet
   - ECS SG: Allow 8080 from ALB
   - RDS SG: Allow 5432 from ECS
   - Redis SG: Allow 6379 from ECS

6. **IAM Roles** (2 resources):
   - ECS Task Execution Role
   - ECS Task Role

7. **IAM Policies** (3 resources)

### 2.2 Review Plan Output

```bash
# Display plan in human-readable format
terraform show tfplan-day3-vpc-infrastructure

# Or use grep to find specific resources
terraform show tfplan-day3-vpc-infrastructure | grep "will be created"
```

**Critical validations**:

```bash
# Check VPC CIDR
terraform show tfplan-day3-vpc-infrastructure | grep "cidr_block"

# Check subnet configuration
terraform show tfplan-day3-vpc-infrastructure | grep "subnet"

# Check security group rules
terraform show tfplan-day3-vpc-infrastructure | grep "ingress"
```

---

## 🚀 Task 3: Apply Infrastructure (15-20 min)

### 3.1 Execute Terraform Apply

```bash
terraform apply tfplan-day3-vpc-infrastructure
```

**Progress monitoring**:

```
module.networking.aws_vpc.main: Creating...
module.networking.aws_vpc.main: Creation complete after 5s [id=vpc-xxxxx]

module.networking.aws_internet_gateway.main: Creating...
module.networking.aws_internet_gateway.main: Creation complete after 3s

module.networking.aws_subnet.public[0]: Creating...
module.networking.aws_subnet.public[1]: Creating...
module.networking.aws_subnet.private[0]: Creating...
module.networking.aws_subnet.private[1]: Creating...
(All subnets complete after ~20s)

module.networking.aws_eip.nat[0]: Creating...
module.networking.aws_nat_gateway.main[0]: Creating...
module.networking.aws_nat_gateway.main[0]: Still creating... [1m0s elapsed]
module.networking.aws_nat_gateway.main[0]: Still creating... [2m0s elapsed]
...
module.networking.aws_nat_gateway.main[0]: Creation complete after 5-10m

module.security_groups.aws_security_group.alb: Creating...
module.security_groups.aws_security_group.ecs: Creating...
(All security groups complete after ~30s)

module.iam.aws_iam_role.ecs_task_execution: Creating...
module.iam.aws_iam_role.ecs_task: Creating...
(All IAM resources complete after ~30s)

Apply complete! Resources: 22 added, 0 changed, 0 destroyed.
```

**Expected duration**:
- VPC & Subnets: ~2 minutes
- NAT Gateway: ~5-10 minutes (longest)
- Security Groups: ~1 minute
- IAM Roles: ~1 minute
- **Total**: ~15-20 minutes

### 3.2 Capture Output Values

```bash
terraform output -json > /tmp/terraform-outputs-day3.json
terraform output
```

**Expected outputs**:
```
alb_security_group_id = "sg-xxxxx"
ecs_security_group_id = "sg-yyyyy"
ecs_task_execution_role_arn = "arn:aws:iam::112530848482:role/miyabi-ecs-task-execution-dev"
ecs_task_role_arn = "arn:aws:iam::112530848482:role/miyabi-ecs-task-dev"
nat_gateway_id = "nat-xxxxx"
private_subnet_ids = [
  "subnet-xxxxx",
  "subnet-yyyyy",
]
public_subnet_ids = [
  "subnet-aaaaa",
  "subnet-bbbbb",
]
rds_security_group_id = "sg-zzzzz"
redis_security_group_id = "sg-wwwww"
vpc_cidr = "10.0.0.0/16"
vpc_id = "vpc-xxxxx"
```

### 3.3 Save State Information

```bash
# Document VPC ID for future reference
echo "VPC_ID=$(terraform output -raw vpc_id)" >> ~/.miyabi-env

# Save all outputs
terraform output -json > /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.ai/terraform-state/day3-outputs.json
```

---

## ✅ Task 4: Validation (5 min)

### 4.1 Verify VPC

```bash
# Get VPC ID
VPC_ID=$(terraform output -raw vpc_id)

# Describe VPC
aws ec2 describe-vpcs \
  --vpc-ids $VPC_ID \
  --region us-west-2

# Expected output:
# - State: available
# - CidrBlock: 10.0.0.0/16
# - EnableDnsHostnames: true
# - EnableDnsSupport: true
```

### 4.2 Verify Subnets

```bash
# List all subnets in VPC
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' \
  --output table \
  --region us-west-2

# Expected: 4 subnets (2 public, 2 private) across 2 AZs
```

### 4.3 Verify Internet & NAT Gateways

```bash
# Internet Gateway
aws ec2 describe-internet-gateways \
  --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
  --region us-west-2

# NAT Gateway
aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=$VPC_ID" \
  --region us-west-2

# Expected NAT state: available
```

### 4.4 Verify Security Groups

```bash
# List security groups
aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'SecurityGroups[*].[GroupId,GroupName,Description]' \
  --output table \
  --region us-west-2

# Expected: 5 security groups (4 created + 1 default)
# - miyabi-alb-sg-dev
# - miyabi-ecs-sg-dev
# - miyabi-rds-sg-dev
# - miyabi-redis-sg-dev
# - default

# Verify ALB security group rules
ALB_SG_ID=$(terraform output -raw alb_security_group_id)
aws ec2 describe-security-groups \
  --group-ids $ALB_SG_ID \
  --region us-west-2 \
  --query 'SecurityGroups[0].IpPermissions'
```

### 4.5 Verify IAM Roles

```bash
# List Miyabi IAM roles
aws iam list-roles \
  --query 'Roles[?contains(RoleName, `miyabi`)].{Name:RoleName,Arn:Arn}' \
  --output table

# Expected: 2 roles
# - miyabi-ecs-task-execution-dev
# - miyabi-ecs-task-dev

# Verify task execution role policies
aws iam list-attached-role-policies \
  --role-name miyabi-ecs-task-execution-dev

# Expected: AmazonECSTaskExecutionRolePolicy attached
```

### 4.6 Network Connectivity Test

```bash
# Verify route tables
aws ec2 describe-route-tables \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'RouteTables[*].[RouteTableId,Tags[?Key==`Name`].Value|[0],Routes]' \
  --output json \
  --region us-west-2

# Public route table should have route to Internet Gateway
# Private route table should have route to NAT Gateway
```

---

## 🎯 Acceptance Criteria

All of the following must be ✅ before proceeding to Day 4:

- [ ] Terraform apply completed without errors
- [ ] VPC created with CIDR 10.0.0.0/16
- [ ] 2 public subnets in different AZs
- [ ] 2 private subnets in different AZs
- [ ] Internet Gateway attached to VPC
- [ ] NAT Gateway running in public subnet
- [ ] 4 security groups created (ALB, ECS, RDS, Redis)
- [ ] Security group rules correctly configured
- [ ] 2 IAM roles created (task execution, task role)
- [ ] IAM policies attached correctly
- [ ] All Terraform outputs documented
- [ ] No resources in "pending" or "failed" state

---

## 🚨 Troubleshooting

### Issue: Terraform init fails with "provider not found"

**Solution**:
```bash
# Clear Terraform cache
rm -rf .terraform .terraform.lock.hcl

# Re-initialize
terraform init
```

### Issue: NAT Gateway creation times out

**Symptoms**: NAT Gateway stuck in "pending" state for > 15 minutes

**Solution**:
```bash
# Check NAT Gateway status
aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=$VPC_ID" \
  --region us-west-2

# If stuck, cancel and retry
terraform destroy -target=module.networking.aws_nat_gateway.main
terraform apply tfplan-day3-vpc-infrastructure
```

### Issue: Security group ingress rule conflicts

**Symptoms**: Error creating security group - duplicate rule

**Solution**:
```bash
# Check existing security groups
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=miyabi-*" \
  --region us-west-2

# If duplicates exist, delete manually
aws ec2 delete-security-group --group-id sg-xxxxx --region us-west-2

# Retry terraform apply
terraform apply
```

### Issue: IAM role already exists

**Solution**:
```bash
# Import existing role into Terraform state
terraform import module.iam.aws_iam_role.ecs_task_execution miyabi-ecs-task-execution-dev
terraform import module.iam.aws_iam_role.ecs_task miyabi-ecs-task-dev

# Retry apply
terraform apply
```

### Issue: Subnet CIDR conflicts

**Symptoms**: "CIDR block overlaps with existing subnet"

**Solution**:
```bash
# List all subnets in VPC
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].CidrBlock'

# Update terraform.tfvars with non-overlapping CIDRs
# Then re-plan
terraform plan
```

---

## 📊 Resource Summary

After successful deployment:

| Resource Type | Count | Names/IDs |
|---------------|-------|-----------|
| VPC | 1 | vpc-xxxxx (10.0.0.0/16) |
| Public Subnets | 2 | subnet-aaaaa, subnet-bbbbb |
| Private Subnets | 2 | subnet-ccccc, subnet-ddddd |
| Internet Gateway | 1 | igw-xxxxx |
| NAT Gateway | 1 | nat-xxxxx |
| Elastic IP | 1 | eipalloc-xxxxx |
| Route Tables | 2 | rtb-xxxxx (public), rtb-yyyyy (private) |
| Security Groups | 4 | ALB, ECS, RDS, Redis |
| IAM Roles | 2 | Task Execution, Task Role |

**Total Resources Created**: ~22

---

## 📝 Post-Execution Checklist

After completing all tasks:

1. **Update Issue #1021**:
```bash
gh issue comment 1021 --body "✅ VPC & Infrastructure Deployment Complete

**Summary**:
- VPC: $(terraform output -raw vpc_id)
- Public Subnets: $(terraform output -json public_subnet_ids | jq -r '. | join(", ")')
- Private Subnets: $(terraform output -json private_subnet_ids | jq -r '. | join(", ")')
- NAT Gateway: $(terraform output -raw nat_gateway_id)
- Security Groups: ALB, ECS, RDS, Redis
- IAM Roles: ECS Task Execution, ECS Task

**Duration**: ~$(grep 'Apply complete' terraform.log | awk '{print $NF}')

**Next**: Day 4 - ECS Cluster, ALB, Redis Deployment"
```

2. **Save Terraform state snapshot**:
```bash
mkdir -p /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.ai/terraform-state
cp terraform.tfstate .ai/terraform-state/day3-vpc-infrastructure-$(date +%Y%m%d-%H%M%S).tfstate
```

3. **Document in session log**:
```bash
cat >> .ai/logs/session-2025-11-18-infinity-mode.md <<EOF

### $(date '+%H:%M') - Issue #1021 Completed

**Action**: VPC & Infrastructure deployment via Terraform

**Resources Created**:
- VPC: $(terraform output -raw vpc_id)
- Subnets: 4 (2 public, 2 private)
- NAT Gateway: 1
- Security Groups: 4
- IAM Roles: 2

**Duration**: ~20 minutes
**Status**: ✅ Success
EOF
```

---

## 🔗 Next Steps

**Issue #1022**: Deploy ECS Cluster, ALB & Redis (Day 4)

**Dependencies for Day 4**:
- ✅ VPC ID
- ✅ Public subnet IDs (for ALB)
- ✅ Private subnet IDs (for ECS & Redis)
- ✅ Security group IDs
- ✅ IAM role ARNs

All dependencies satisfied ✅

---

## 📚 References

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/)
- [ECS Task IAM Roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- Previous runbooks:
  - [ECR Setup](.ai/runbooks/ecr-setup-runbook.md)
  - [Docker Build](.ai/runbooks/docker-build-push-ecr.md)

---

**Generated**: 2025-11-18
**Format**: Miyabi Runbook v2.0
**Status**: Ready for execution

🌸 Miyabi Society - Infrastructure as Code Excellence 🌸
