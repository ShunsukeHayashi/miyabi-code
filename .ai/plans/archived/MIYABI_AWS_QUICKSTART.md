# Miyabi AWS Platform - Quick Start Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Time to First Deploy**: 3 days

---

## 🚀 Day 1: AWS Foundation (2-3 hours)

### Prerequisites Checklist
```bash
# 1. AWS CLI installed and configured
aws --version  # Should be v2.x+
aws sts get-caller-identity  # Verify credentials

# 2. Terraform or CDK installed
npm install -g aws-cdk  # CDK option (recommended)
# OR
brew install terraform  # Terraform option

# 3. Docker installed
docker --version

# 4. Rust toolchain
rustc --version  # Should be 1.70+
cargo --version
```

### Step 1: Create AWS Organization (30 min)

**Console**: https://console.aws.amazon.com/organizations/

```bash
# Enable AWS Organizations
aws organizations create-organization --feature-set ALL

# Create OUs
aws organizations create-organizational-unit \
  --parent-id r-xxxx \
  --name Infrastructure

aws organizations create-organizational-unit \
  --parent-id r-xxxx \
  --name Workloads

aws organizations create-organizational-unit \
  --parent-id ou-xxxx-infrastructure \
  --name Security
```

### Step 2: Create 4 Core Accounts (60 min)

**Required Accounts**:
1. **Management** (already exists - root account)
2. **Security** - security-ops@yourdomain.com
3. **Production** - prod-ops@yourdomain.com
4. **Development** - dev-ops@yourdomain.com

```bash
# Create Security account
aws organizations create-account \
  --email security-ops@yourdomain.com \
  --account-name "Miyabi-Security" \
  --role-name OrganizationAccountAccessRole

# Create Production account
aws organizations create-account \
  --email prod-ops@yourdomain.com \
  --account-name "Miyabi-Production" \
  --role-name OrganizationAccountAccessRole

# Create Development account
aws organizations create-account \
  --email dev-ops@yourdomain.com \
  --account-name "Miyabi-Development" \
  --role-name OrganizationAccountAccessRole

# Check status
aws organizations list-accounts
```

### Step 3: Set Up IAM Identity Center (30 min)

**Console**: https://console.aws.amazon.com/singlesignon/

1. **Enable IAM Identity Center** in Management account
2. **Choose identity source**: AWS managed (or connect to Google Workspace/Okta)
3. **Create permission sets**:
   - `AdministratorAccess` - Full access
   - `PowerUserAccess` - Developer access
   - `ReadOnlyAccess` - Auditor access

```bash
# Create admin user
aws identitystore create-user \
  --identity-store-id d-xxxxxxxxxx \
  --user-name admin@yourdomain.com \
  --display-name "Admin User" \
  --emails '[{"Value":"admin@yourdomain.com","Type":"Work","Primary":true}]'

# Assign admin to all accounts
aws sso-admin create-account-assignment \
  --instance-arn arn:aws:sso:::instance/ssoins-xxxxxxxxx \
  --target-id <production-account-id> \
  --target-type AWS_ACCOUNT \
  --permission-set-arn arn:aws:sso:::permissionSet/ssoins-xxxx/ps-xxxx \
  --principal-type USER \
  --principal-id <user-id>
```

### Step 4: Basic SCPs (30 min)

Create SCP to deny region usage outside approved regions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": [
            "ap-northeast-1",
            "us-east-1"
          ]
        },
        "StringNotLike": {
          "aws:PrincipalArn": "arn:aws:iam::*:role/OrganizationAccountAccessRole"
        }
      }
    }
  ]
}
```

Apply SCP:
```bash
aws organizations create-policy \
  --content file://region-restriction-scp.json \
  --description "Restrict to ap-northeast-1 and us-east-1" \
  --name RegionRestriction \
  --type SERVICE_CONTROL_POLICY

aws organizations attach-policy \
  --policy-id p-xxxxxxxx \
  --target-id ou-xxxx-workloads
```

---

## 🏗️ Day 2: Infrastructure Setup (4-6 hours)

### Step 1: Initialize CDK Project (30 min)

```bash
# Create CDK project
mkdir miyabi-aws-infra && cd miyabi-aws-infra
cdk init app --language=typescript

# Install dependencies
npm install @aws-cdk/aws-ec2 @aws-cdk/aws-ecs \
  @aws-cdk/aws-ecs-patterns @aws-cdk/aws-rds \
  @aws-cdk/aws-dynamodb @aws-cdk/aws-sqs
```

### Step 2: Define VPC & Networking (60 min)

**File**: `lib/network-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with 2 AZs
    this.vpc = new ec2.Vpc(this, 'MiyabiVpc', {
      maxAzs: 2,
      natGateways: 1,  // Cost optimization
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Endpoints (cost optimization)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('EcrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });
  }
}
```

### Step 3: Define ECS Cluster (60 min)

**File**: `lib/compute-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;

  constructor(
    scope: cdk.App,
    id: string,
    vpc: ec2.Vpc,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'MiyabiCluster', {
      vpc,
      clusterName: 'miyabi-aws-agent-cluster',
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'WorkerTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
      }
    );

    // Add container
    taskDefinition.addContainer('WorkerContainer', {
      image: ecs.ContainerImage.fromAsset('../miyabi-aws-agent'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'miyabi-worker',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        RUST_LOG: 'info',
        MIYABI_ENV: 'development',
      },
    });

    // Create Fargate Service
    const service = new ecs.FargateService(this, 'WorkerService', {
      cluster: this.cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Auto-scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });
  }
}
```

### Step 4: Define DynamoDB Tables (45 min)

**File**: `lib/data-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DataStack extends cdk.Stack {
  public readonly tasksTable: dynamodb.Table;
  public readonly stateTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tasks table
    this.tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: 'miyabi-aws-tasks',
      partitionKey: { name: 'task_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // State table
    this.stateTable = new dynamodb.Table(this, 'StateTable', {
      tableName: 'miyabi-aws-state',
      partitionKey: { name: 'state_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for querying by status
    this.tasksTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.NUMBER },
    });
  }
}
```

### Step 5: Deploy Infrastructure (60 min)

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/ap-northeast-1

# Synthesize CloudFormation template
cdk synth

# Deploy all stacks
cdk deploy --all

# Outputs:
# - VPC ID
# - ECS Cluster ARN
# - DynamoDB Table ARNs
```

---

## 💻 Day 3: Application Deployment (3-4 hours)

### Step 1: Build Rust Application (45 min)

```bash
# Navigate to Miyabi project
cd /Users/shunsuke/Dev/miyabi-private

# Create Dockerfile for AWS Agent
cat > crates/miyabi-aws-agent/Dockerfile <<'EOF'
FROM rust:1.75 as builder
WORKDIR /build

# Copy workspace
COPY Cargo.toml Cargo.lock ./
COPY crates/ ./crates/

# Build release binary
RUN cargo build --release --bin miyabi-aws-agent

# Runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/miyabi-aws-agent /app/miyabi-aws-agent

ENV RUST_LOG=info
WORKDIR /app
CMD ["/app/miyabi-aws-agent"]
EOF

# Build Docker image
docker build -t miyabi-aws-agent:latest crates/miyabi-aws-agent/
```

### Step 2: Push to ECR (30 min)

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name miyabi-aws-agent \
  --region ap-northeast-1

# Login to ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com

# Tag and push
docker tag miyabi-aws-agent:latest \
  ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com/miyabi-aws-agent:latest

docker push ACCOUNT-ID.dkr.ecr.ap-northeast-1.amazonaws.com/miyabi-aws-agent:latest
```

### Step 3: Update ECS Task Definition (30 min)

Update `lib/compute-stack.ts`:

```typescript
// Replace local Docker build with ECR image
taskDefinition.addContainer('WorkerContainer', {
  image: ecs.ContainerImage.fromRegistry(
    `${accountId}.dkr.ecr.ap-northeast-1.amazonaws.com/miyabi-aws-agent:latest`
  ),
  // ... rest of configuration
});
```

Redeploy:
```bash
cdk deploy ComputeStack
```

### Step 4: Verify Deployment (45 min)

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster miyabi-aws-agent-cluster \
  --services miyabi-worker-service

# Check task is running
aws ecs list-tasks \
  --cluster miyabi-aws-agent-cluster

# View logs
aws logs tail /ecs/miyabi-worker --follow

# Test DynamoDB
aws dynamodb scan --table-name miyabi-aws-tasks --limit 10
```

### Step 5: Create Test Task (30 min)

```bash
# Put test task in DynamoDB
aws dynamodb put-item \
  --table-name miyabi-aws-tasks \
  --item '{
    "task_id": {"S": "test-001"},
    "created_at": {"N": "1699564800"},
    "task_type": {"S": "DiscoverResources"},
    "status": {"S": "Pending"},
    "region": {"S": "ap-northeast-1"},
    "account_id": {"S": "123456789012"}
  }'

# Monitor ECS logs to see task processing
aws logs tail /ecs/miyabi-worker --follow --since 1m
```

---

## ✅ Success Verification Checklist

After 3 days, you should have:

### Infrastructure ✓
- [ ] AWS Organizations with 4 accounts (Management, Security, Prod, Dev)
- [ ] IAM Identity Center configured with admin users
- [ ] VPC with public/private/isolated subnets
- [ ] ECS Fargate cluster running
- [ ] DynamoDB tables created
- [ ] ECR repository with Docker image

### Application ✓
- [ ] Rust application compiled and containerized
- [ ] Docker image pushed to ECR
- [ ] ECS task running successfully
- [ ] CloudWatch logs showing application output
- [ ] DynamoDB test task created and processed

### Cost ✓
- [ ] Estimated monthly cost: ~$150-200
  - NAT Gateway: $45
  - Fargate (1 task): $30
  - DynamoDB: $5
  - ECR: $1
  - CloudWatch: $10
  - Data Transfer: $10

### Security ✓
- [ ] SCPs limiting regions applied
- [ ] IAM Identity Center users created
- [ ] VPC endpoints configured
- [ ] Security groups restricting access
- [ ] CloudTrail enabled (in Management account)

---

## 🎯 Next Steps (Week 2+)

### Week 2: Enhanced Monitoring
```bash
# Set up CloudWatch Dashboard
aws cloudwatch put-dashboard --dashboard-name MiyabiAWS --dashboard-body file://dashboard.json

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80
```

### Week 3: Python Bridge Integration
```bash
cd /Users/shunsuke/Dev/miyabi-private/crates/miyabi-aws-agent

# Implement Python bridge
cargo add tokio --features full
cargo add serde_json

# Add Python discovery script
mkdir python_bridge
cp /Users/shunsuke/Dev/AWS_Miyabi_Agent/discovery.py python_bridge/
```

### Week 4: Automation & CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test --all
      - run: docker build -t miyabi-aws-agent .
      - run: cdk deploy --require-approval never
```

---

## 🔧 Troubleshooting

### Issue: CDK bootstrap fails
```bash
# Solution: Verify AWS credentials
aws sts get-caller-identity

# Ensure you have AdministratorAccess
aws iam get-user
```

### Issue: ECS task fails to start
```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster miyabi-aws-agent-cluster \
  --tasks TASK-ID

# Common issues:
# 1. Image not found → Check ECR repository
# 2. No space in subnet → Add more subnets
# 3. Security group issues → Check ingress/egress rules
```

### Issue: Docker build fails
```bash
# Ensure you're building from workspace root
cd /Users/shunsuke/Dev/miyabi-private
docker build -f crates/miyabi-aws-agent/Dockerfile .

# Check Cargo.toml workspace configuration
```

### Issue: DynamoDB permissions denied
```bash
# Attach DynamoDB policy to ECS task role
aws iam attach-role-policy \
  --role-name MiyabiWorkerTaskRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

---

## 📊 Cost Monitoring

### Daily Cost Check
```bash
# Get yesterday's cost
aws ce get-cost-and-usage \
  --time-period Start=$(date -d yesterday +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost

# Expected: ~$5-7/day
```

### Weekly Report
```bash
# Get last 7 days cost by service
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🎓 Learning Resources

### AWS Documentation
- [ECS Developer Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/)
- [CDK Workshop](https://cdkworkshop.com/)
- [Organizations Best Practices](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices.html)

### Miyabi Specific
- Complete docs: `.ai/plans/MIYABI_AWS_COMPLETE_INDEX.md`
- Architecture: `.ai/plans/MIYABI_AWS_PLATFORM_ARCHITECTURE.md`
- Account Management: `.ai/plans/MIYABI_AWS_ACCOUNT_MANAGEMENT_STRATEGY.md`

---

## ✨ You're Ready!

After completing this quick start:
- ✅ Infrastructure deployed in AWS
- ✅ Application running on ECS Fargate
- ✅ Monitoring and logging configured
- ✅ Cost tracking enabled

**Total Time**: 3 days
**Total Cost**: ~$150-200/month

**Next milestone**: Week 4 - Process 96 issues/day 🚀
