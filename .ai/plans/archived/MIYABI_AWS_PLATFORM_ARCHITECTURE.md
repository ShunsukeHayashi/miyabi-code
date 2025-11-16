# Miyabi AWS Platform Architecture - Complete Design

**Project**: Miyabi AWS Integration
**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: Architecture Design Phase

---

## 🎯 Executive Summary

**Vision**: MiyabiシステムをAWSインフラで完全にラッピングし、スケーラブル・リユーザブル・完全自律型の開発プラットフォームとして提供

**Core Capabilities**:
- ✅ **AWS Service Automation**: 全AWSリソースの自動プロビジョニング・管理
- ✅ **Service-as-Agent Model**: 偉人（Historical Agents）によるAWSサービス管理
- ✅ **Scalable Execution**: ECS Fargate/Lambda による無限並列実行
- ✅ **Multi-Tenancy**: SaaS化対応のマルチテナントアーキテクチャ
- ✅ **Event-Driven**: EventBridge + SQS による完全非同期処理

---

## 📊 Current State Analysis

### Existing Components

#### 1. Miyabi Core System (Rust)
- **Location**: `/Users/shunsuke/Dev/miyabi-private/`
- **Components**:
  - 15+ Cargo crates (CLI, Core, Agents, GitHub, Worktree, LLM, Knowledge)
  - 21 Agents (7 Coding + 14 Business)
  - Git Worktree parallel execution
  - MCP Server (JSON-RPC 2.0)
  - Knowledge Management (Qdrant vector DB)

#### 2. AWS Agent (Partially Implemented)
- **Location**: `crates/miyabi-aws-agent/`
- **Status**: Basic structure exists, implementation incomplete (todo!)
- **Capabilities**:
  - Type definitions complete (AwsAccount, AwsResource, ServiceAgent)
  - Historical Agent assignment logic
  - AWS SDK integration (EC2, S3, Lambda, RDS, DynamoDB, CloudFormation)

#### 3. Pantheon Web App Plan
- **Location**: `.ai/plans/pantheon-webapp-aws-deployment.md`
- **Stack**: Next.js + Rust Axum + AWS (CloudFront, S3, API Gateway, Lambda/Fargate, DynamoDB, RDS)
- **Purpose**: Pantheon Society visualization dashboard

### Gap Analysis

| Component | Current | Target | Gap |
|-----------|---------|--------|-----|
| **AWS Agent** | Types only | Full automation | Implementation needed |
| **Infrastructure** | Manual | IaC (CDK/Terraform) | Automation needed |
| **Execution** | Local | Cloud (ECS/Lambda) | Containerization needed |
| **Scaling** | Git Worktree (local) | Distributed orchestration | Cloud-native redesign |
| **API Layer** | MCP Server (local) | API Gateway + Lambda | SaaS layer needed |
| **Auth** | None | Cognito + IAM | Security layer needed |
| **Monitoring** | Logs | CloudWatch + X-Ray | Observability needed |

---

## 🏗️ Target Architecture - 3-Layer Design

### Layer 1: Infrastructure (AWS Foundation)

**Purpose**: Managed AWS resources with full automation

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Organization                              │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │ Management  │  Security   │ Production  │ Development │     │
│  │  Account    │   Account   │   Account   │   Account   │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                   │
│  Multi-Region Deployment (us-east-1, ap-northeast-1)            │
│                                                                   │
│  ┌──────────────────── Infrastructure Components ─────────────┐ │
│  │                                                              │ │
│  │  Network Layer                                               │ │
│  │  ├─ VPC (Multi-AZ)                                          │ │
│  │  ├─ Subnets (Public, Private, Isolated)                    │ │
│  │  ├─ NAT Gateway, Internet Gateway                           │ │
│  │  └─ Security Groups, NACLs                                  │ │
│  │                                                              │ │
│  │  Compute Layer                                               │ │
│  │  ├─ ECS Fargate Cluster (Miyabi Agent Runner)              │ │
│  │  ├─ Lambda Functions (Event handlers)                       │ │
│  │  └─ Auto Scaling Groups                                     │ │
│  │                                                              │ │
│  │  Storage Layer                                               │ │
│  │  ├─ S3 (Code artifacts, logs, assets)                      │ │
│  │  ├─ EFS (Shared worktree storage)                          │ │
│  │  ├─ DynamoDB (Metadata, state)                             │ │
│  │  └─ RDS Aurora Serverless (Relations)                      │ │
│  │                                                              │ │
│  │  Event & Messaging Layer                                     │ │
│  │  ├─ EventBridge (Event bus)                                │ │
│  │  ├─ SQS (Task queues)                                      │ │
│  │  └─ SNS (Notifications)                                    │ │
│  │                                                              │ │
│  │  Security Layer                                              │ │
│  │  ├─ WAF (DDoS protection)                                  │ │
│  │  ├─ GuardDuty (Threat detection)                           │ │
│  │  ├─ Secrets Manager (Credentials)                          │ │
│  │  └─ KMS (Encryption)                                       │ │
│  │                                                              │ │
│  │  Observability Layer                                         │ │
│  │  ├─ CloudWatch Logs, Metrics                               │ │
│  │  ├─ X-Ray (Distributed tracing)                            │ │
│  │  └─ CloudTrail (Audit logs)                                │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Infrastructure as Code**:
- **Primary**: AWS CDK (TypeScript) - Type-safe, higher abstraction
- **Alternative**: Terraform - Multi-cloud support

**Multi-Account Strategy**:
```
Root (Management Account)
    ├── Security Account
    │   ├── GuardDuty master
    │   ├── Security Hub aggregator
    │   └── CloudTrail logs
    │
    ├── Production Account
    │   ├── Miyabi Platform (live)
    │   ├── Customer workloads
    │   └── High availability setup
    │
    ├── Staging Account
    │   ├── Pre-production testing
    │   └── Integration tests
    │
    └── Development Account
        ├── Developer sandboxes
        └── Experimental features
```

---

### Layer 2: Platform (Miyabi Execution Engine)

**Purpose**: Distributed, scalable Miyabi agent execution

```
┌─────────────────────────────────────────────────────────────────┐
│                   Miyabi Platform Services                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Orchestrator Service (ECS Fargate)                │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  CoordinatorAgent (Control Plane)                   │   │ │
│  │  │  - Task routing & scheduling                        │   │ │
│  │  │  - Worktree management (EFS-backed)                 │   │ │
│  │  │  - State machine coordination                       │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│                           │ Distributes tasks via SQS             │
│                           ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Agent Worker Pool (ECS Fargate Tasks)             │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ CodeGen  │  │ Review   │  │ Deploy   │  │ Business │  │ │
│  │  │  Agent   │  │  Agent   │  │  Agent   │  │  Agents  │  │ │
│  │  │ (Task 1) │  │ (Task 2) │  │ (Task 3) │  │ (Task N) │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                              │ │
│  │  Auto-scaling: 1 → 100+ tasks based on queue depth         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         AWS Agent Service (Lambda + Step Functions)        │ │
│  │                                                              │ │
│  │  Historical Agents (Service-as-Agent):                      │ │
│  │  ├─ Bill Gates    → EC2, Lambda (Compute)                  │ │
│  │  ├─ Steve Jobs    → S3, CloudFront (Frontend)              │ │
│  │  ├─ Napoleon      → Auto Scaling, Load Balancer (Strategy) │ │
│  │  ├─ Hannibal      → Lambda@Edge (Tactics)                  │ │
│  │  ├─ Drucker       → CloudWatch, X-Ray (Management)         │ │
│  │  ├─ Kotler        → API Gateway, SNS (Communication)       │ │
│  │  └─ Noguchi       → RDS, DynamoDB (Research Data)          │ │
│  │                                                              │ │
│  │  Operations:                                                 │ │
│  │  - CreateResource, UpdateResource, DeleteResource           │ │
│  │  - DiscoverResources (inventory)                            │ │
│  │  - OptimizeCosts (rightsizing, spot instances)             │ │
│  │  - SecurityAudit (compliance checks)                        │ │
│  │  - HealthCheck (proactive monitoring)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Knowledge Service (Qdrant on ECS/EC2)              │ │
│  │  - Vector DB for historical logs                            │ │
│  │  - Embedding generation (Ollama/OpenAI)                     │ │
│  │  - Semantic search across past executions                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         GitHub Integration Service (Lambda)                 │ │
│  │  - Issue fetching & parsing                                 │ │
│  │  - PR creation & management                                 │ │
│  │  - Label inference (57-label system)                        │ │
│  │  - Webhook handler                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key Platform Services**:

1. **Orchestrator Service** (ECS Fargate)
   - Single control plane instance
   - Manages task distribution
   - Coordinates worktree allocation
   - State machine (Step Functions) integration

2. **Agent Worker Pool** (ECS Fargate Auto Scaling)
   - Dynamic scaling: 1 → 100+ tasks
   - Each task = isolated Rust agent execution
   - EFS-backed shared storage for worktrees
   - Task routing via SQS

3. **AWS Agent Service** (Lambda + Step Functions)
   - Stateless Lambda functions per operation
   - Step Functions for complex workflows
   - Service-as-Agent model (Historical Agents)
   - CloudFormation/CDK integration

4. **Knowledge Service** (Qdrant on ECS/EC2)
   - Persistent vector DB
   - Embedding pipeline (Lambda triggers)
   - Search API (REST/gRPC)

5. **GitHub Integration** (Lambda)
   - Event-driven (EventBridge + GitHub webhooks)
   - Issue → Task conversion
   - PR lifecycle management

---

### Layer 3: Application (SaaS API & UI)

**Purpose**: User-facing services and API

```
┌─────────────────────────────────────────────────────────────────┐
│                      Public Internet                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CloudFront Distribution                        │
│  ┌──────────────┬─────────────────────┬────────────────────┐   │
│  │   /app/*     │      /api/*         │     /assets/*      │   │
│  └──────┬───────┴──────────┬──────────┴────────┬───────────┘   │
│         │                   │                    │               │
└─────────┼───────────────────┼────────────────────┼───────────────┘
          │                   │                    │
          ▼                   ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
│  S3 Static Site  │  │  API Gateway     │  │  S3 Assets  │
│  (React SPA)     │  │  (REST + WS)     │  │  (Public)   │
└──────────────────┘  └────────┬─────────┘  └─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    ┌─────────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Auth Service    │  │ Task API    │  │ Admin API   │
    │ (Cognito)       │  │ (Lambda)    │  │ (Lambda)    │
    └─────────────────┘  └─────────────┘  └─────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Miyabi Platform    │
                    │  (Layer 2)          │
                    └─────────────────────┘
```

**API Endpoints**:

```typescript
// Public API (API Gateway + Lambda)

// Authentication
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout

// Tasks (Issue processing)
POST   /api/v1/tasks                 // Create task from Issue
GET    /api/v1/tasks                 // List tasks
GET    /api/v1/tasks/:id             // Get task status
DELETE /api/v1/tasks/:id             // Cancel task
GET    /api/v1/tasks/:id/logs        // Stream logs (WebSocket)

// Agents
GET    /api/v1/agents                // List all agents
GET    /api/v1/agents/:type          // Get agent details
POST   /api/v1/agents/:type/execute  // Execute agent

// AWS Resources (Admin only)
GET    /api/v1/aws/accounts          // List accounts
GET    /api/v1/aws/resources         // List resources
POST   /api/v1/aws/resources         // Create resource
GET    /api/v1/aws/resources/:id     // Get resource
PATCH  /api/v1/aws/resources/:id     // Update resource
DELETE /api/v1/aws/resources/:id     // Delete resource

// Knowledge
GET    /api/v1/knowledge/search      // Semantic search
GET    /api/v1/knowledge/stats       // Knowledge base stats

// Webhooks (EventBridge)
POST   /webhooks/github              // GitHub webhook handler

// Admin API (Internal)
GET    /admin/v1/metrics             // Platform metrics
GET    /admin/v1/health              // Health check
```

**Frontend Application** (React SPA):
- **Technology**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Features**:
  - Dashboard: Task execution status
  - Agent gallery: 21 agents with stats
  - AWS resource viewer: Service-as-Agent visualization
  - Pantheon Society: Historical agents showcase
  - Real-time logs: WebSocket streaming
  - Cost analytics: AWS spending dashboard

---

## 🔄 Event-Driven Architecture

### Event Flow

```
GitHub Issue Created
    │
    ▼
GitHub Webhook → API Gateway → Lambda (Webhook Handler)
    │
    ▼
EventBridge (Event Bus)
    │
    ├─ Rule: "issue.created" → SQS Queue (High Priority)
    ├─ Rule: "issue.labeled" → Lambda (Label Processor)
    └─ Rule: "pr.merged"     → Lambda (Deployment Trigger)
    │
    ▼
SQS Queue (Task Queue)
    │
    ▼
ECS Fargate (Agent Worker) polls queue
    │
    ├─ Fetch task from SQS
    ├─ Allocate worktree (EFS)
    ├─ Execute Miyabi Agent (Rust binary)
    ├─ Upload logs to S3
    ├─ Update DynamoDB state
    └─ Send completion event to EventBridge
    │
    ▼
EventBridge (Task Completed Event)
    │
    ├─ Lambda → Create PR
    ├─ Lambda → Update knowledge DB
    └─ SNS → Notify user (email/Discord)
```

### Message Queue Structure

```
SQS Queue: miyabi-tasks-high-priority
├─ Message: { issueNumber, agentType, priority, worktreeId, metadata }
├─ Visibility Timeout: 3600s (1 hour)
└─ DLQ: miyabi-tasks-failed (retry after manual investigation)

SQS Queue: miyabi-tasks-standard
├─ Business agents, low-priority tasks
└─ Visibility Timeout: 7200s (2 hours)
```

---

## 🔐 Security Architecture

### Multi-Layer Security

```
Layer 1: Network Security
├─ VPC with private subnets (no direct internet access)
├─ NAT Gateway for outbound traffic
├─ Security Groups (principle of least privilege)
├─ NACLs (stateless firewall)
└─ WAF (DDoS protection, rate limiting)

Layer 2: Identity & Access
├─ AWS IAM (service-to-service)
│  ├─ ECS Task Role (S3, DynamoDB, SQS access)
│  ├─ Lambda Execution Role (EventBridge, SNS)
│  └─ Cross-account roles (multi-account access)
├─ Cognito (user authentication)
│  ├─ User Pools (email/password, MFA)
│  └─ Identity Pools (federated identities)
└─ API Gateway Authorizers (JWT validation)

Layer 3: Data Security
├─ Encryption at rest
│  ├─ S3: SSE-KMS
│  ├─ DynamoDB: KMS encryption
│  ├─ RDS: Aurora encryption
│  └─ EFS: KMS encryption
├─ Encryption in transit (TLS 1.3)
└─ Secrets Manager (GitHub tokens, API keys)

Layer 4: Application Security
├─ Input validation (API Gateway models)
├─ SQL injection prevention (parameterized queries)
├─ XSS prevention (Content Security Policy)
└─ CORS (whitelist origins)

Layer 5: Monitoring & Compliance
├─ GuardDuty (threat detection)
├─ Security Hub (compliance checks)
├─ CloudTrail (audit logs)
└─ Config Rules (resource compliance)
```

---

## 📈 Scalability Design

### Horizontal Scaling Strategy

```
Component                      Scaling Mechanism              Limit
────────────────────────────────────────────────────────────────────
ECS Fargate (Orchestrator)     None (single control plane)    1 instance
ECS Fargate (Agent Workers)    Auto Scaling (Target: 70% CPU) 1 → 100 tasks
Lambda (AWS Agent)             Auto (concurrent executions)   1000/account
Lambda (API)                   Auto                           1000/account
DynamoDB                       On-demand (auto-scaling)       Unlimited
RDS Aurora Serverless          ACU scaling (0.5 → 128)        128 ACUs
S3                             Unlimited                      Unlimited
SQS                            Unlimited                      Unlimited
```

### Auto-Scaling Rules

**ECS Fargate (Agent Workers)**:
```yaml
ScalingPolicy:
  TargetTrackingScaling:
    TargetValue: 70.0
    PredefinedMetricType: ECSServiceAverageCPUUtilization
    ScaleInCooldown: 300
    ScaleOutCooldown: 60

  StepScaling:
    - QueueDepth < 10      → DesiredCount: 1
    - QueueDepth 10-50     → DesiredCount: 5
    - QueueDepth 50-100    → DesiredCount: 10
    - QueueDepth > 100     → DesiredCount: 20
```

**Lambda (API)**:
```yaml
ReservedConcurrency: 100  # Per function
ProvisionedConcurrency: 10  # Warm instances
```

### Cost Optimization

**Strategies**:
1. **ECS Fargate Spot**: 70% discount (non-critical tasks)
2. **RDS Aurora Serverless v2**: Scale to 0.5 ACU (idle time)
3. **S3 Lifecycle Policies**: Archive logs to Glacier (30 days)
4. **Lambda SnapStart**: Reduce cold start latency
5. **CloudFront Caching**: Reduce origin requests (TTL: 1 hour)

**Estimated Monthly Cost** (Production, moderate usage):
```
Service                          Usage                        Cost
─────────────────────────────────────────────────────────────────────
ECS Fargate (Workers)            10 tasks × 24/7 × 0.5vCPU   $147.00
ECS Fargate (Orchestrator)       1 task × 24/7 × 1vCPU       $29.44
Lambda (API)                     10M requests, 512MB          $20.00
Lambda (AWS Agent)               5M requests, 512MB           $10.00
DynamoDB (On-demand)             10M reads, 5M writes         $6.25
RDS Aurora Serverless v2         Average 1 ACU, 24/7          $43.80
S3 (Standard)                    100GB storage, 50GB transfer $6.75
CloudFront                       100GB transfer               $8.50
API Gateway                      10M requests                 $35.00
EventBridge                      10M events                   $10.00
SQS                              10M requests                 $4.00
Secrets Manager                  10 secrets                   $4.00
CloudWatch Logs                  50GB ingestion               $25.00
NAT Gateway                      100GB data transfer          $4.50
KMS                              10,000 requests/month        $3.00
─────────────────────────────────────────────────────────────────────
Total                                                          ~$357.24/month
```

**Optimization**: Can reduce to ~$150/month by:
- Using Fargate Spot (70% discount)
- Reducing RDS to 0.5 ACU average
- Aggressive Lambda optimization

---

## 🛠️ Implementation Roadmap

### Phase 1: Infrastructure Foundation (Weeks 1-3)

**Week 1: AWS Organization Setup**
- [ ] Create AWS Organizations structure
- [ ] Set up Management, Security, Production, Development accounts
- [ ] Configure AWS SSO (IAM Identity Center)
- [ ] Enable AWS Config, CloudTrail, GuardDuty
- [ ] Create VPCs in each account (Multi-AZ)

**Week 2: Core Infrastructure (CDK)**
- [ ] Initialize AWS CDK project (TypeScript)
- [ ] Create Network Stack (VPC, Subnets, NAT, IGW)
- [ ] Create Security Stack (Security Groups, NACLs, WAF)
- [ ] Create Storage Stack (S3, EFS, DynamoDB, RDS)
- [ ] Create Observability Stack (CloudWatch, X-Ray)

**Week 3: CI/CD Pipeline**
- [ ] Set up GitHub Actions workflow
- [ ] Build & test Rust workspace (cargo build/test)
- [ ] Docker image build (multi-stage)
- [ ] ECR repository creation
- [ ] Automated CDK deployment (staging)

**Deliverable**: Fully automated infrastructure with IaC

---

### Phase 2: AWS Agent Implementation (Weeks 4-6)

**Week 4: AWS Agent Core**
- [ ] Complete `miyabi-aws-agent` implementation
- [ ] EC2 operations (launch, terminate, describe)
- [ ] S3 operations (create bucket, upload, delete)
- [ ] Lambda operations (deploy function, invoke)
- [ ] RDS operations (create instance, snapshot, restore)

**Week 5: Service-as-Agent Logic**
- [ ] Historical Agent decision engine
- [ ] Cost optimization recommendations (Bill Gates)
- [ ] Security posture checks (Cerberus integration)
- [ ] Resource dependency resolver
- [ ] CloudFormation stack management

**Week 6: Integration & Testing**
- [ ] Integration tests (localstack)
- [ ] End-to-end tests (staging account)
- [ ] Performance benchmarks
- [ ] Documentation (API docs, runbooks)

**Deliverable**: Fully functional AWS Agent with 7 Historical Agents

---

### Phase 3: Platform Services (Weeks 7-10)

**Week 7: Orchestrator Service**
- [ ] ECS Fargate task definition (Rust binary)
- [ ] CoordinatorAgent containerization
- [ ] Worktree management on EFS
- [ ] SQS integration (task queue polling)
- [ ] State persistence (DynamoDB)

**Week 8: Agent Worker Pool**
- [ ] Docker image for Miyabi agents (multi-stage)
- [ ] ECS Service with Auto Scaling
- [ ] Task routing logic (agent type → task)
- [ ] Log shipping (CloudWatch Logs)
- [ ] Error handling & retries (DLQ)

**Week 9: Knowledge Service**
- [ ] Qdrant deployment (ECS on EC2 with EBS)
- [ ] Embedding pipeline (Lambda + SQS)
- [ ] Search API (Lambda + API Gateway)
- [ ] Data migration from local Qdrant

**Week 10: GitHub Integration**
- [ ] Webhook receiver (API Gateway + Lambda)
- [ ] EventBridge rule configuration
- [ ] Issue → Task conversion logic
- [ ] PR creation automation
- [ ] Label inference (57-label system)

**Deliverable**: Fully operational Miyabi platform on AWS

---

### Phase 4: SaaS API Layer (Weeks 11-13)

**Week 11: Authentication & API Gateway**
- [ ] Cognito User Pool setup
- [ ] JWT authorizer (Lambda)
- [ ] API Gateway REST API design
- [ ] Rate limiting & throttling
- [ ] API documentation (OpenAPI spec)

**Week 12: Task Management API**
- [ ] POST /api/v1/tasks (create task)
- [ ] GET /api/v1/tasks (list tasks)
- [ ] WebSocket API (real-time logs)
- [ ] Admin API (metrics, health)
- [ ] Multi-tenancy support (tenant isolation)

**Week 13: Frontend Application**
- [ ] Next.js project setup
- [ ] Dashboard UI (task status, agent stats)
- [ ] AWS resource viewer (Pantheon visualization)
- [ ] Real-time log streaming (WebSocket)
- [ ] Deploy to S3 + CloudFront

**Deliverable**: Public SaaS application (MVP)

---

### Phase 5: Optimization & Launch (Weeks 14-16)

**Week 14: Performance Optimization**
- [ ] Load testing (Artillery, k6)
- [ ] Database query optimization
- [ ] Lambda cold start reduction (SnapStart)
- [ ] CloudFront cache tuning
- [ ] Cost optimization review

**Week 15: Security Audit**
- [ ] Penetration testing
- [ ] OWASP Top 10 compliance
- [ ] Secret rotation automation
- [ ] Backup & disaster recovery testing
- [ ] Compliance checks (CIS, NIST)

**Week 16: Launch Preparation**
- [ ] Production deployment
- [ ] DNS configuration (Route 53)
- [ ] Monitoring dashboards (CloudWatch)
- [ ] Runbooks & playbooks
- [ ] Public documentation
- [ ] Blog post & announcement

**Deliverable**: Production-ready Miyabi AWS Platform

---

## 📚 Technical Specifications

### Infrastructure as Code (CDK Stacks)

**Stack 1: Network**
```typescript
export class MiyabiNetworkStack extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'MiyabiVPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public', subnetType: SubnetType.PUBLIC },
        { name: 'Private', subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        { name: 'Isolated', subnetType: SubnetType.PRIVATE_ISOLATED }
      ],
      flowLogs: {
        cloudwatch: { retention: RetentionDays.ONE_WEEK }
      }
    });

    new CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
```

**Stack 2: Compute**
```typescript
export class MiyabiComputeStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc) {
    super(scope, id);

    // ECS Cluster
    const cluster = new Cluster(this, 'MiyabiCluster', { vpc });

    // Orchestrator Service (single instance)
    const orchestratorTaskDef = new FargateTaskDefinition(this, 'OrchestratorTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048
    });

    orchestratorTaskDef.addContainer('Orchestrator', {
      image: ContainerImage.fromRegistry('miyabi-orchestrator:latest'),
      logging: LogDrivers.awsLogs({ streamPrefix: 'orchestrator' }),
      environment: {
        RUST_LOG: 'info',
        WORKTREE_ROOT: '/mnt/efs/worktrees'
      }
    });

    // Agent Worker Service (auto-scaling)
    const workerTaskDef = new FargateTaskDefinition(this, 'WorkerTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024
    });

    workerTaskDef.addContainer('AgentWorker', {
      image: ContainerImage.fromRegistry('miyabi-agent-worker:latest'),
      logging: LogDrivers.awsLogs({ streamPrefix: 'worker' })
    });

    const workerService = new FargateService(this, 'WorkerService', {
      cluster,
      taskDefinition: workerTaskDef,
      desiredCount: 1
    });

    // Auto Scaling
    const scaling = workerService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 100
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70
    });
  }
}
```

**Stack 3: Storage**
```typescript
export class MiyabiStorageStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc) {
    super(scope, id);

    // EFS for Worktrees
    const fileSystem = new FileSystem(this, 'WorktreeFS', {
      vpc,
      encrypted: true,
      lifecyclePolicy: LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: PerformanceMode.GENERAL_PURPOSE,
      throughputMode: ThroughputMode.BURSTING
    });

    // DynamoDB
    const tasksTable = new Table(this, 'TasksTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: TableEncryption.AWS_MANAGED
    });

    // RDS Aurora Serverless v2
    const dbCluster = new ServerlessCluster(this, 'MiyabiDB', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_3
      }),
      vpc,
      scaling: {
        minCapacity: 0.5,
        maxCapacity: 4
      },
      enableDataApi: true
    });
  }
}
```

---

### Containerization (Dockerfile)

**Multi-stage Dockerfile for Miyabi Agents**:
```dockerfile
# Stage 1: Build
FROM rust:1.75-slim as builder

WORKDIR /app

# Copy workspace
COPY Cargo.toml Cargo.lock ./
COPY crates/ ./crates/

# Build release binary
RUN cargo build --release --bin miyabi-agent-worker

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates git && \
    rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/miyabi-agent-worker /usr/local/bin/

# Set environment
ENV RUST_LOG=info
ENV WORKTREE_ROOT=/mnt/efs/worktrees

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/usr/local/bin/miyabi-agent-worker", "--health"]

# Run agent worker
ENTRYPOINT ["/usr/local/bin/miyabi-agent-worker"]
CMD ["run"]
```

---

## 🎯 Success Metrics

### Launch Metrics (Week 1)
- [ ] Infrastructure deployment: 100% automated (CDK)
- [ ] Security audit: 0 critical vulnerabilities
- [ ] Performance: API p95 latency < 100ms
- [ ] Availability: 99.9% uptime SLA

### Growth Metrics (Month 1)
- [ ] Tasks processed: 10,000+
- [ ] Average task completion time: < 15 minutes
- [ ] Cost per task: < $0.50
- [ ] Customer satisfaction: 4.5/5 stars

### Scalability Metrics (Month 3)
- [ ] Concurrent tasks: 100+
- [ ] Total tasks processed: 100,000+
- [ ] Auto-scaling response time: < 60 seconds
- [ ] Zero downtime deployments

---

## 🔗 Related Documentation

- **Pantheon Web App Plan**: `.ai/plans/pantheon-webapp-aws-deployment.md`
- **Miyabi Architecture**: `.claude/context/architecture.md`
- **AWS Agent Types**: `crates/miyabi-types/src/aws.rs`
- **Miyabi Agents**: `AGENTS.md`
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md`

---

**Status**: ✅ Architecture Design Complete - Ready for Implementation

**Next Steps**:
1. Review architecture with stakeholders
2. Create GitHub Issues for Phase 1 tasks
3. Begin AWS Organization setup
4. Initialize CDK project

**Maintained by**: Miyabi Platform Team
**Location**: `/Users/shunsuke/Dev/miyabi-private/.ai/plans/MIYABI_AWS_PLATFORM_ARCHITECTURE.md`
**Version**: 1.0.0
**Last Updated**: 2025-11-12
