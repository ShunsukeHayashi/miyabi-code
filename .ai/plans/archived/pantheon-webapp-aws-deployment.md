# Pantheon Society Visualization Web APP - AWS Deployment Plan

**Project**: Pantheon Web Visualization
**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: Planning Phase

---

## 🎯 Project Overview

**Goal**: Pantheon Societyの全要素を可視化し、インタラクティブに探索できるWebアプリケーションを構築・AWSデプロイ

**Vision**: 歴史的人物、神話的存在、組織構造、AWS統合を美しく表現する次世代ダッシュボード

---

## 📋 Requirements Definition

### Functional Requirements

#### FR-1: Historical Agents Showcase
- **Must Have**:
  - 各Agentの詳細プロフィール表示
  - 能力値の可視化（5次元レーダーチャート）
  - 担当領域と責任範囲
  - 名言・哲学の表示

#### FR-2: Mythological Guardian Dashboard
- **Must Have**:
  - 3体のGuardian紹介（Cerberus, Michael, Buddha）
  - 各Guardianの役割と機能説明
  - セキュリティステータスリアルタイム表示（Cerberus）
  - 倫理スコアモニタリング（Michael）

#### FR-3: Pantheon Council Visualization
- **Must Have**:
  - 協議会組織図（3 Divisions）
  - 意思決定プロセスフロー
  - 投票システムの説明
  - 協議会セッションログ（将来）

#### FR-4: AWS Architecture Diagram
- **Must Have**:
  - Multi-account構造の可視化
  - Service-as-Agent mappingの表示
  - インタラクティブな依存関係図
  - リアルタイムステータス表示（将来）

#### FR-5: Team Balance Analytics
- **Must Have**:
  - 総合バランススコア表示
  - 8次元レーダーチャート
  - Personality Matrix（7x5テーブル）
  - Team Synergy Score

#### FR-6: Interactive 3D Visualization
- **Nice to Have**:
  - 3D空間でのAgent配置
  - 神話的Guardianの3Dモデル
  - AWS構造の3D表現

### Non-Functional Requirements

#### NFR-1: Performance
- Initial load: <3s
- Page transition: <500ms
- 3D rendering: 60fps (if implemented)

#### NFR-2: Scalability
- Concurrent users: 1,000+
- API response time: <100ms (p95)

#### NFR-3: Security
- HTTPS only
- AWS IAM authentication
- CORS policy enforcement

#### NFR-4: Accessibility
- WCAG 2.1 AA compliance
- Responsive design (Mobile, Tablet, Desktop)
- Dark/Light mode support

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront CDN                        │
│                   (Global Distribution)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   S3 Static     │       │   API Gateway   │
│   Website       │       │   (REST/WebSocket)│
│   (React SPA)   │       └────────┬─────────┘
└─────────────────┘                │
                                   ▼
                          ┌─────────────────┐
                          │  Lambda/Fargate │
                          │  (Rust API)     │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌──────────┐   ┌──────────┐  ┌──────────┐
            │DynamoDB  │   │  RDS     │  │ S3 Data  │
            │(Metadata)│   │(Relations)│  │ (Assets) │
            └──────────┘   └──────────┘  └──────────┘
```

### AWS Services Breakdown

#### Frontend Layer
- **S3**: Static website hosting (React build)
- **CloudFront**: CDN, HTTPS termination, edge caching
- **Route 53**: DNS management

#### Backend Layer
- **API Gateway**: RESTful API + WebSocket (for real-time updates)
- **Lambda** (Option 1): Serverless compute (Node.js or Rust via custom runtime)
- **ECS Fargate** (Option 2): Container-based (Rust API)

#### Data Layer
- **DynamoDB**: Agent metadata, Council records
- **RDS Aurora Serverless**: Relational data (Agent relations, dependencies)
- **S3**: Static assets (images, 3D models)

#### Observability
- **CloudWatch**: Logs, metrics, alarms
- **X-Ray**: Distributed tracing

#### Security
- **WAF**: Web application firewall
- **Secrets Manager**: API keys, DB credentials
- **IAM**: Fine-grained access control

---

## 🛠️ Technology Stack

### Frontend

**Framework**: **Next.js 14** (App Router)
- ✅ SSG/SSR hybrid for optimal performance
- ✅ Built-in image optimization
- ✅ API routes for BFF pattern

**UI Library**: **React 18** + **TypeScript**

**Styling**: **Tailwind CSS** + **Framer Motion**
- Responsive design
- Smooth animations

**Data Visualization**:
- **Recharts**: 2D charts, radar charts
- **D3.js**: Custom visualizations
- **Three.js / React Three Fiber**: 3D visualization (optional)

**State Management**: **Zustand** (lightweight)

**API Client**: **TanStack Query** (React Query)

### Backend

**Language**: **Rust 2021**

**Framework**: **Axum** (tokio-based)
- Async/await native
- Type-safe routing
- Middleware support

**ORM**: **SeaORM** (for RDS)

**Serialization**: **serde** + **serde_json**

### Infrastructure as Code (IaC)

**Primary**: **AWS CDK** (TypeScript)
- Type-safe infrastructure definition
- Higher-level abstractions

**Alternative**: **Terraform**

### CI/CD

**Platform**: **GitHub Actions**

**Stages**:
1. Build & Test (Rust + Node.js)
2. Security Scan (cargo-audit, npm audit)
3. Deploy to Staging
4. E2E Tests
5. Deploy to Production

---

## 📊 Data Model

### DynamoDB Tables

#### Table: `pantheon_agents`
```json
{
  "PK": "AGENT#bill-gates",
  "SK": "METADATA",
  "name": "Bill Gates",
  "role": "Chief Technology Visionary",
  "tier": "Technology Pioneers",
  "personality_traits": {
    "strategic_vision": 95,
    "technical_depth": 90,
    "business_acumen": 98,
    "pragmatism": 92
  },
  "responsibilities": [...],
  "quotes": [...]
}
```

#### Table: `pantheon_guardians`
```json
{
  "PK": "GUARDIAN#cerberus",
  "SK": "METADATA",
  "name": "Cerberus",
  "role": "Chief Security Guardian",
  "powers": {
    "heads": 3,
    "capabilities": ["monitoring", "detection", "response"]
  },
  "status": "active"
}
```

#### Table: `pantheon_council`
```json
{
  "PK": "COUNCIL#technology-division",
  "SK": "METADATA",
  "division": "Technology",
  "members": ["bill-gates", "steve-jobs"],
  "voting_power": 1
}
```

### RDS Schema

```sql
-- Agent Relations
CREATE TABLE agent_relations (
  id UUID PRIMARY KEY,
  source_agent VARCHAR(100),
  target_agent VARCHAR(100),
  relation_type VARCHAR(50), -- 'reports_to', 'collaborates_with', 'advises'
  strength INT CHECK (strength BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AWS Service Mappings
CREATE TABLE service_agents (
  id UUID PRIMARY KEY,
  service_name VARCHAR(100),
  agent_owner VARCHAR(100),
  dependencies JSONB,
  state VARCHAR(50),
  autonomy_level INT CHECK (autonomy_level BETWEEN 1 AND 10)
);
```

---

## 🎨 UI/UX Design

### Page Structure

```
/
├── Home (Landing)
│   ├── Hero section
│   ├── Philosophy overview
│   └── Quick stats
│
├── /agents
│   ├── Historical Agents grid
│   ├── Agent detail pages (dynamic routes)
│   └── Filter/Sort functionality
│
├── /guardians
│   ├── 3 Guardian cards
│   ├── Real-time status dashboard
│   └── Security metrics
│
├── /council
│   ├── Organization chart
│   ├── Decision-making flow
│   └── Governance rules
│
├── /architecture
│   ├── AWS diagram (interactive)
│   ├── Service-as-Agent mapping
│   └── Dependency graph
│
├── /analytics
│   ├── Team balance radar chart
│   ├── Personality matrix
│   └── Synergy scores
│
└── /about
    └── Project philosophy, roadmap
```

### Design System

**Color Palette** (Pantheon Theme):
```css
--primary: #1E3A8A;      /* Deep Blue (Zeus) */
--secondary: #7C3AED;    /* Purple (Mystical) */
--accent: #F59E0B;       /* Gold (Excellence) */
--guardian: #DC2626;     /* Red (Cerberus) */
--wisdom: #059669;       /* Green (Buddha) */
--justice: #0EA5E9;      /* Sky Blue (Michael) */
```

**Typography**:
- Headings: **Inter** (modern, clean)
- Body: **Source Sans Pro** (readable)
- Monospace: **Fira Code** (code blocks)

---

## 🚀 AWS Deployment Architecture

### Account Structure (Pantheon AWS)

```
Management Account (Root)
    ├── Security Account
    │   ├── WAF rules
    │   ├── GuardDuty
    │   └── Security Hub
    │
    ├── Production Account
    │   ├── CloudFront distribution
    │   ├── S3 website bucket
    │   ├── API Gateway
    │   ├── Lambda/Fargate
    │   ├── DynamoDB
    │   └── RDS Aurora
    │
    ├── Staging Account
    │   └── (Same as production, smaller scale)
    │
    └── Dev Account
        └── Developer sandboxes
```

### Infrastructure Components (CDK Stacks)

#### Stack 1: Network (VPC)
```typescript
export class PantheonNetworkStack extends Stack {
  vpc: Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new Vpc(this, 'PantheonVPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public', subnetType: SubnetType.PUBLIC },
        { name: 'Private', subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        { name: 'Isolated', subnetType: SubnetType.PRIVATE_ISOLATED }
      ]
    });
  }
}
```

#### Stack 2: Frontend (S3 + CloudFront)
```typescript
export class PantheonFrontendStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    const distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: websiteBucket,
          originAccessIdentity: new OriginAccessIdentity(this, 'OAI')
        },
        behaviors: [{ isDefaultBehavior: true }]
      }],
      priceClass: PriceClass.PRICE_CLASS_100
    });
  }
}
```

#### Stack 3: Backend (API + Compute)
```typescript
export class PantheonBackendStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc) {
    super(scope, id);

    // Option A: Lambda
    const apiLambda = new Function(this, 'ApiLambda', {
      runtime: Runtime.PROVIDED_AL2,  // Rust custom runtime
      handler: 'bootstrap',
      code: Code.fromAsset('target/lambda/release'),
      timeout: Duration.seconds(30),
      memorySize: 512
    });

    // Option B: Fargate
    const cluster = new Cluster(this, 'Cluster', { vpc });
    const taskDef = new FargateTaskDefinition(this, 'TaskDef');
    taskDef.addContainer('RustAPI', {
      image: ContainerImage.fromRegistry('pantheon-api:latest'),
      memoryLimitMiB: 512
    });

    // API Gateway
    const api = new RestApi(this, 'PantheonAPI', {
      restApiName: 'Pantheon Society API'
    });

    const agentsResource = api.root.addResource('agents');
    agentsResource.addMethod('GET', new LambdaIntegration(apiLambda));
  }
}
```

#### Stack 4: Data (DynamoDB + RDS)
```typescript
export class PantheonDataStack extends Stack {
  constructor(scope: Construct, id: string, vpc: Vpc) {
    super(scope, id);

    // DynamoDB
    const agentsTable = new Table(this, 'AgentsTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });

    // RDS Aurora Serverless v2
    const dbCluster = new ServerlessCluster(this, 'Database', {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_3
      }),
      vpc,
      scaling: {
        minCapacity: 0.5,
        maxCapacity: 2
      }
    });
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Pantheon Web APP Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: .next/

  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - run: cargo build --release
      - run: cargo test --all
      - run: cargo clippy -- -D warnings
      - uses: actions/upload-artifact@v3
        with:
          name: rust-binary
          path: target/release/pantheon-api

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit
      - run: cargo audit

  deploy-staging:
    needs: [build-frontend, build-backend, security-scan]
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: npm run cdk:deploy -- --all --require-approval never
        env:
          ENVIRONMENT: staging

  deploy-production:
    needs: [build-frontend, build-backend, security-scan]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://pantheon.miyabi.dev
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
      - run: npm run cdk:deploy -- --all
        env:
          ENVIRONMENT: production
```

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Week 1**: Project Setup
- [x] Requirements definition
- [ ] AWS account setup (Management + Production)
- [ ] GitHub repository creation
- [ ] Initial CDK project scaffolding
- [ ] Next.js project initialization

**Week 2**: Core Infrastructure
- [ ] VPC + Networking stack deployment
- [ ] S3 + CloudFront setup
- [ ] DynamoDB table creation
- [ ] Basic CI/CD pipeline

### Phase 2: Backend Development (Week 3-4)

**Week 3**: Rust API Foundation
- [ ] Axum server setup
- [ ] Database models (SeaORM)
- [ ] API endpoints: `/agents`, `/guardians`, `/council`
- [ ] Authentication middleware

**Week 4**: Data Integration
- [ ] Seed data from `pantheon-society.md`
- [ ] API testing (integration tests)
- [ ] Lambda packaging (if using Lambda)
- [ ] API Gateway integration

### Phase 3: Frontend Development (Week 5-7)

**Week 5**: Core Pages
- [ ] Home page + Hero section
- [ ] Agents listing page
- [ ] Agent detail pages (dynamic routing)
- [ ] Navigation + Layout

**Week 6**: Visualization Components
- [ ] Radar charts (Recharts)
- [ ] Personality matrix table
- [ ] Council organization chart
- [ ] AWS architecture diagram (interactive)

**Week 7**: Advanced Features
- [ ] Dark mode support
- [ ] Responsive design (mobile/tablet)
- [ ] Loading states + error handling
- [ ] Performance optimization

### Phase 4: Integration & Testing (Week 8)

- [ ] Frontend <-> Backend integration
- [ ] E2E tests (Playwright)
- [ ] Performance testing (Lighthouse)
- [ ] Security audit
- [ ] Staging deployment

### Phase 5: Launch (Week 9)

- [ ] Production deployment
- [ ] DNS configuration (pantheon.miyabi.dev)
- [ ] Monitoring setup (CloudWatch dashboards)
- [ ] Documentation
- [ ] Public announcement

---

## 💰 Cost Estimation (Monthly)

### AWS Services (Production)

| Service | Usage | Cost |
|---------|-------|------|
| CloudFront | 50GB transfer | $4.25 |
| S3 | 10GB storage | $0.23 |
| API Gateway | 1M requests | $3.50 |
| Lambda | 1M invocations, 512MB | $0.20 |
| DynamoDB | On-demand, 1M reads | $0.25 |
| RDS Aurora Serverless | 0.5-2 ACU | $43.80 |
| Route 53 | 1 hosted zone | $0.50 |
| **Total** | | **~$52.73/month** |

**Optimization Options**:
- Use S3 static site only (no backend) → ~$5/month
- Replace RDS with DynamoDB → ~$8/month

---

## 🔒 Security Considerations

### Application Security
- [x] HTTPS only (CloudFront + ACM certificate)
- [ ] CORS policy (whitelist origins)
- [ ] Rate limiting (API Gateway)
- [ ] Input validation (Rust backend)
- [ ] SQL injection prevention (parameterized queries)

### Infrastructure Security
- [x] Private subnets for compute/data layers
- [x] Security groups (least privilege)
- [ ] WAF rules (SQL injection, XSS protection)
- [ ] Secrets Manager for credentials
- [ ] CloudTrail logging

### Data Security
- [x] Encryption at rest (S3, DynamoDB, RDS)
- [x] Encryption in transit (TLS 1.3)
- [ ] Regular backups (DynamoDB PITR, RDS snapshots)

---

## 📈 Success Metrics

### Launch Metrics (Week 1)
- [ ] 0 critical bugs
- [ ] <3s initial load time
- [ ] 100% uptime
- [ ] 0 security vulnerabilities

### Growth Metrics (Month 1)
- [ ] 500+ unique visitors
- [ ] <5% bounce rate
- [ ] 3+ pages per session
- [ ] 10+ GitHub stars

---

## 🔗 Related Resources

### Documentation
- `/Users/shunsuke/Dev/miyabi-private/.claude/context/pantheon-society.md` - Source data
- `/Users/shunsuke/Dev/miyabi-private/.codex/context/pantheon-society.md` - Codex version

### Similar Projects (Inspiration)
- AWS Architecture Icons: https://aws.amazon.com/architecture/icons/
- D3.js Examples: https://observablehq.com/@d3/gallery
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber

### Tools
- Next.js Docs: https://nextjs.org/docs
- Axum Docs: https://docs.rs/axum/latest/axum/
- AWS CDK Examples: https://github.com/aws-samples/aws-cdk-examples

---

## 📝 Next Actions

### Immediate (Today)
1. ✅ Create planning document
2. [ ] Initialize GitHub repository (`pantheon-webapp`)
3. [ ] Set up AWS account structure
4. [ ] Create CDK project

### This Week
1. [ ] Design mockups (Figma)
2. [ ] Set up Next.js project structure
3. [ ] Set up Rust API project structure
4. [ ] Deploy initial infrastructure (VPC, S3, CloudFront)

### This Month
1. [ ] Complete Phase 1-2 (Foundation + Backend)
2. [ ] Begin Phase 3 (Frontend)

---

## 🎯 Success Criteria

**Definition of Done**:
- ✅ All 7 Historical Agents displayed with interactive profiles
- ✅ 3 Mythological Guardians showcased
- ✅ Pantheon Council structure visualized
- ✅ AWS architecture diagram interactive
- ✅ Team balance analytics dashboard
- ✅ Deployed to production on AWS
- ✅ <3s load time, 100% Lighthouse accessibility score
- ✅ CI/CD pipeline functional
- ✅ Documentation complete

---

**Project Status**: 🟢 Planning Complete - Ready to Begin Implementation

**Maintained by**: Miyabi Team
**Location**: `/Users/shunsuke/Dev/miyabi-private/.ai/plans/pantheon-webapp-aws-deployment.md`
**Next Review**: 2025-11-15
