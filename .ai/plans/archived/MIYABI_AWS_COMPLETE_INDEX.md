# Miyabi AWS Platform - Complete Documentation Index

**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Status**: ✅ Planning Complete - Ready for Implementation

---

## 📋 Quick Navigation

| Document | Purpose | Priority | Read Time |
|----------|---------|----------|-----------|
| [MASTER PLAN](#master-plan) | Start here - Complete overview | **P0** | 10 min |
| [Architecture](#architecture) | 3-layer system design | **P0** | 15 min |
| [Account Management](#account-management) | Multi-account governance | **P0** | 20 min |
| [Scalability](#scalability) | Scaling from 1→500 workers | P1 | 15 min |
| [Implementation](#implementation) | Code templates & patterns | P1 | 20 min |
| [Integration](#integration) | Python→Rust migration | P2 | 15 min |

**Total Reading Time**: ~95 minutes for complete understanding

---

## 🎯 Master Plan

**File**: `MIYABI_AWS_MASTER_PLAN.md`

### What's Inside
- **Executive Summary**: Project vision and goals
- **24-Week Roadmap**: Month-by-month implementation plan
- **Cost Model**: $150/month → $30,000/month scaling
- **Success Criteria**: Measurable KPIs
- **3-Layer Architecture**: Infrastructure, Platform, Application

### Key Sections
```
1. Project Overview (統合概要)
2. 3-Layer Architecture (3層アーキテクチャ)
3. Complete Roadmap (24週間のロードマップ)
4. Cost Estimates (コスト試算)
5. Success Criteria (成功基準)
```

### Quick Facts
- **Duration**: 6 months (24 weeks)
- **Team Size**: 2-3 engineers
- **Initial Budget**: ~$500/month
- **Production Budget**: ~$3,000/month

### When to Read
- **First document to read** - provides context for everything else
- Before presenting to stakeholders
- When planning sprints

---

## 🏗️ Architecture

**File**: `MIYABI_AWS_PLATFORM_ARCHITECTURE.md`

### What's Inside
- **Layer 1 - Infrastructure**: AWS Organizations, multi-account setup
- **Layer 2 - Platform Services**: ECS, Lambda, databases
- **Layer 3 - Application Logic**: 6-phase AWS agent cycle (θ₁-θ₆)
- **Historical Agent Model**: 7 figures managing AWS services

### Key Diagrams
1. `miyabi-aws-overview.puml` - Complete system architecture
2. `aws-multi-account.puml` - Multi-account structure
3. `aws-agent-cycle.puml` - 6-phase optimization cycle
4. `historical-agents.puml` - Service-as-Agent assignments
5. `rust-architecture.puml` - Rust class structure

### Technical Specs
```yaml
Compute:
  - ECS Fargate (1→500 tasks)
  - Lambda (event processing)

Storage:
  - DynamoDB (tasks, state)
  - RDS Aurora (historical data)
  - S3 (artifacts)

Networking:
  - CloudFront + API Gateway
  - Private VPC subnets
  - NAT Gateway for egress

Observability:
  - CloudWatch (logs, metrics)
  - X-Ray (tracing)
  - CloudWatch Dashboards
```

### When to Read
- When designing infrastructure
- Before writing CDK/Terraform code
- When explaining architecture to engineers

---

## 🏢 Account Management

**File**: `MIYABI_AWS_ACCOUNT_MANAGEMENT_STRATEGY.md`

### What's Inside
- **3 Account Patterns**: Silo, Pool, Bridge (comparison)
- **Recommended: Pool Model** - 100 customers per account
- **IAM Identity Center**: Unified authentication across accounts
- **AWS Organizations**: OU hierarchy and SCPs
- **Cost Allocation**: Tag-based tracking and billing
- **Account Factory**: Automated account creation (15 min)
- **AWS Control Tower**: Governance automation

### Account Growth Scenarios
```
Phase 1 (Launch):     4 accounts   → Manual management
Phase 2 (Scale):     10 accounts   → Semi-automated
Phase 3 (Growth):   100 accounts   → Fully automated
Phase 4 (Enterprise): 1000+ accounts → Control Tower + Account Factory
```

### Cost Comparison
| Pattern | Cost/Customer | Management | Security |
|---------|--------------|------------|----------|
| Silo    | $50/month    | O(N)       | ⭐⭐⭐⭐⭐ |
| Pool    | $5/month     | O(1)       | ⭐⭐⭐⭐ |
| Bridge  | $15/month    | O(log N)   | ⭐⭐⭐⭐⭐ |

**Recommended**: Start with Pool, migrate high-value customers to Silo

### Key Commands
```bash
# Create customer account
aws organizations create-account \
  --email customer@example.com \
  --account-name "Pool-1-Customer-ACME"

# Query customer costs
SELECT resource_tags_user_cost_center AS customer_id,
       SUM(line_item_unblended_cost) AS total_cost
FROM cur_table
WHERE line_item_usage_start_date >= DATE_ADD('day', -30, CURRENT_DATE)
GROUP BY resource_tags_user_cost_center
```

### When to Read
- Before setting up AWS Organizations
- When planning multi-tenant strategy
- When designing billing system
- **Critical for production launch**

---

## 📈 Scalability

**File**: `MIYABI_AWS_SCALABILITY_DEEP_DIVE.md`

### What's Inside
- **5 Scalability Dimensions**: Horizontal, Vertical, Temporal, Geographic, Economic
- **Performance Benchmarks**: 1→100→500 workers
- **Bottleneck Analysis**: Top 4 bottlenecks and solutions
- **Cost Efficiency**: $0.20-0.23 per issue at scale

### Scaling Metrics
```
Launch (Month 1):
  - Workers: 1
  - Issues/day: 96
  - Cost/month: $29
  - Cost/issue: $0.30

Production (Month 6):
  - Workers: 100
  - Issues/day: 9,600
  - Cost/month: $2,915
  - Cost/issue: $0.23

Hyper-Scale (Future):
  - Workers: 500
  - Issues/day: 100,000+
  - Cost/month: $30,000
  - Cost/issue: $0.20
```

### Bottlenecks Solved
1. **EFS I/O** → EBS ephemeral storage (10x faster)
2. **GitHub API** → Token rotation + GraphQL batching
3. **DB Connections** → RDS Proxy pooling
4. **Lambda Cold Starts** → Provisioned Concurrency

### Auto-Scaling Rules
```python
# Queue-based scaling
if queue_depth > 100 and queue_age > 5_minutes:
    scale_out(+20 tasks)

if queue_depth < 10 and utilization < 30%:
    scale_in(-10 tasks)
```

### When to Read
- When performance tuning
- Before capacity planning
- When troubleshooting bottlenecks
- When optimizing costs

---

## 💻 Implementation

**File**: `MIYABI_AWS_IMPLEMENTATION_GUIDE.md`

### What's Inside
- **4 Infrastructure Patterns**: Multi-region, Event-driven, Spot Fleet, Blue-Green
- **CDK Code Templates**: TypeScript infrastructure definitions
- **Docker Multi-Stage Builds**: Optimized container images
- **CI/CD Pipeline**: GitHub Actions workflow
- **Monitoring Setup**: CloudWatch, X-Ray, alarms

### Code Examples

**ECS Service with Auto-Scaling (CDK)**
```typescript
const scaling = workerService.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 100
});

scaling.scaleOnMetric('QueueDepthScaling', {
  metric: queue.metricApproximateNumberOfMessagesVisible(),
  scalingSteps: [
    { upper: 10, change: -10 },
    { lower: 100, change: +20 },
    { lower: 500, change: +50 }
  ]
});
```

**Docker Multi-Stage Build**
```dockerfile
FROM rust:1.75 AS builder
WORKDIR /build
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /build/target/release/miyabi-aws-agent /app/
CMD ["/app/miyabi-aws-agent"]
```

**GitHub Actions CI/CD**
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test --all
      - run: cdk deploy --require-approval never
```

### Infrastructure Patterns
1. **Multi-Region Active-Active**: 99.99% availability
2. **Event-Driven Auto-Scaling**: Queue-based scaling
3. **Spot Fleet**: 70% cost savings
4. **Blue-Green Deployment**: Zero-downtime updates

### When to Read
- When writing infrastructure code
- When setting up CI/CD
- When configuring monitoring
- **Before Week 1 implementation starts**

---

## 🔄 Integration

**File**: `MIYABI_AWS_INTEGRATION_STRATEGY.md`

### What's Inside
- **6-Phase Migration**: Python Bridge → Full Rust (24 weeks)
- **Python Bridge Implementation**: Temporary integration layer
- **Gradual Migration Path**: θ₁→θ₂→...→θ₆
- **Testing Strategy**: Integration tests for each phase
- **Rollback Plan**: Safety mechanisms

### Migration Timeline
```
Phase 1 (Week 1-2):   Python Bridge + Discovery (θ₁)
Phase 2 (Week 3-6):   Planning Agent (θ₂) → Rust
Phase 3 (Week 7-12):  Optimization (θ₃) → Rust
Phase 4 (Week 13-16): Deployment (θ₄) → Rust
Phase 5 (Week 17-20): Monitoring (θ₅) → Rust
Phase 6 (Week 21-24): Learning (θ₆) → Rust + Cleanup
```

### Python Bridge Code
```rust
pub struct PythonBridge {
    python_path: PathBuf,
}

impl PythonBridge {
    pub async fn call_discovery_script(&self) -> Result<DiscoveryResult> {
        let output = Command::new("python3")
            .arg(&self.python_path.join("discovery.py"))
            .output()
            .await?;

        serde_json::from_slice(&output.stdout)
    }
}
```

### Testing Strategy
- Unit tests for Rust components
- Integration tests for Python↔Rust bridge
- E2E tests for complete workflows
- Performance benchmarks (96 issues/day target)

### When to Read
- Before starting migration work
- When designing Python↔Rust interface
- When writing integration tests
- When planning sprint work

---

## 📊 Visual Diagrams

**Location**: `.ai/diagrams/`

### Architecture Diagrams
1. **miyabi-aws-overview.puml** (10)
   - Complete 3-layer system
   - CloudFront → API Gateway → Lambda → ECS → Databases

2. **aws-multi-account.puml** (14)
   - AWS Organizations structure
   - Management, Security, Prod, Staging, Dev accounts

### Process Diagrams
3. **aws-agent-cycle.puml** (11)
   - State machine: θ₁→θ₂→...→θ₆
   - World₀ → World₁ → ... → World_∞

4. **task-execution-flow.puml** (12)
   - Sequence diagram: Issue → Completion
   - 14-25 minute execution timeline

### Component Diagrams
5. **historical-agents.puml** (13)
   - 7 historical figures
   - Service-as-Agent assignments
   - Bill Gates (EC2), Steve Jobs (S3), etc.

6. **rust-architecture.puml** (15)
   - Class diagram
   - miyabi-types, miyabi-aws-agent packages
   - DiscoveryAgent, PlanningAgent, etc.

### How to View
```bash
# Install PlantUML (macOS)
brew install plantuml

# Generate PNG
plantuml .ai/diagrams/architecture/miyabi-aws-overview.puml

# Generate SVG (better quality)
plantuml -tsvg .ai/diagrams/architecture/miyabi-aws-overview.puml

# View in VS Code
# Install "PlantUML" extension by jebbs
```

---

## 🚀 Implementation Checklist

### Week 1: Foundation (2 days)
- [ ] Set up AWS Organizations (4 accounts)
- [ ] Configure IAM Identity Center
- [ ] Create root OU structure
- [ ] Deploy Control Tower (optional)

### Week 2: Infrastructure (5 days)
- [ ] Write CDK code for VPC, subnets, security groups
- [ ] Set up ECS cluster (Fargate)
- [ ] Create DynamoDB tables (tasks, state)
- [ ] Set up RDS Aurora (optional)

### Week 3: Python Bridge (5 days)
- [ ] Implement PythonBridge struct in Rust
- [ ] Test calling Python discovery script
- [ ] Write integration tests
- [ ] Deploy to development account

### Week 4: Discovery Agent (5 days)
- [ ] Implement θ₁ (Discovery) in Python
- [ ] Test EC2, S3, RDS discovery
- [ ] Generate World State JSON
- [ ] Verify cost/security analysis

### Month 2-3: Rust Migration (θ₂-θ₃)
- [ ] Planning Agent (θ₂) → Terraform/CloudFormation generation
- [ ] Optimization Agent (θ₃) → Right-sizing recommendations

### Month 4-5: Deployment & Monitoring (θ₄-θ₆)
- [ ] Deployment Agent (θ₄) → Execute IaC
- [ ] Monitoring Agent (θ₅) → CloudWatch integration
- [ ] Learning Agent (θ₆) → Effectiveness analysis

### Month 6: Production Launch
- [ ] Security audit
- [ ] Performance testing (96+ issues/day)
- [ ] Documentation
- [ ] Production deployment

---

## 💰 Cost Summary

| Phase | Duration | Monthly Cost | Details |
|-------|----------|--------------|---------|
| Launch | Month 1 | $150 | 1 worker, minimal infra |
| Development | Month 2-5 | $500 | Dev account, testing |
| Production | Month 6 | $3,000 | 10 workers, full monitoring |
| Scale | Year 1+ | $10,000+ | 100 workers, multi-region |

### Cost Breakdown (Production)
```
ECS Fargate (10 tasks):      $800/month
RDS Aurora (db.t3.medium):   $180/month
DynamoDB (on-demand):        $100/month
Data Transfer:               $50/month
CloudWatch Logs:             $30/month
NAT Gateway:                 $45/month
Misc (S3, Lambda):           $20/month
-------------------------------------------
TOTAL:                       ~$1,225/month

+ Account Management:        $50/month
+ Support (Business):        $100/month
+ Contingency (20%):         $275/month
-------------------------------------------
TOTAL WITH OVERHEAD:         ~$1,650/month
```

---

## 📚 External References

### AWS Documentation
- [AWS Organizations](https://docs.aws.amazon.com/organizations/)
- [IAM Identity Center](https://docs.aws.amazon.com/singlesignon/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [AWS CDK Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)

### Miyabi Project
- Main project: `/Users/shunsuke/Dev/miyabi-private/`
- Python AWS Agent: `/Users/shunsuke/Dev/AWS_Miyabi_Agent/`
- Agent specs: `.claude/agents/specs/`
- Context modules: `.claude/context/`

### Classmethod Resources
- [AWS Summit Japan](https://aws.amazon.com/jp/summits/)
- [Developers.IO](https://dev.classmethod.jp/) - かずあき's blog
- [AWS SAA Study Guide](https://www.amazon.co.jp/dp/4815607648)

---

## 🎓 Learning Path

### For Engineers New to AWS
1. **Start**: Read Master Plan (10 min)
2. **Basics**: AWS Organizations & IAM concepts (30 min)
3. **Architecture**: 3-layer design overview (15 min)
4. **Hands-on**: Week 1 implementation checklist

### For AWS Architects
1. **Start**: Architecture document
2. **Deep Dive**: Account Management strategy
3. **Scaling**: Scalability analysis
4. **Design**: Review PlantUML diagrams

### For DevOps Engineers
1. **Start**: Implementation Guide
2. **Infra**: CDK code templates
3. **CI/CD**: GitHub Actions pipeline
4. **Monitoring**: CloudWatch setup

### For Project Managers
1. **Start**: Master Plan executive summary
2. **Timeline**: 24-week roadmap
3. **Budget**: Cost estimates
4. **Metrics**: Success criteria & KPIs

---

## ❓ FAQ

**Q: どこから始めればいいですか？**
A: まず `MIYABI_AWS_MASTER_PLAN.md` を読んでください（10分）。全体像が理解できます。

**Q: コスト試算は正確ですか？**
A: 保守的な見積もりです。実際のコストは使用量により±20%程度変動します。

**Q: Python Bridge はいつまで使いますか？**
A: Phase 1（Week 1-2）のみ。Week 3以降は段階的にRustへ移行します。

**Q: Silo と Pool、どちらを選ぶべき？**
A: 最初はPoolモデル（100顧客/アカウント）を推奨。高額顧客はSiloへ移行。

**Q: マルチリージョンは必要？**
A: Phase 1は不要。Year 2以降、グローバル展開時に検討してください。

**Q: 開発チームは何人必要？**
A: 最低2人（バックエンド1人 + インフラ1人）。理想は3-4人。

**Q: セキュリティ監査は？**
A: Month 6（本番前）に実施。AWS Control Tower + Security Hub使用。

---

## 📞 Contact & Support

### Project Maintainers
- **Miyabi Team**: `/Users/shunsuke/Dev/miyabi-private/`
- **AWS Expert**: かずあき (Kazuaki Sekihara) - Classmethod

### Internal Resources
- Slack: #miyabi-aws-platform
- Wiki: Confluence space
- Issues: GitHub Projects

### AWS Support
- Plan: Business Support ($100/month)
- TAM: Consider for production
- Well-Architected Review: After Month 3

---

## 📝 Document Metadata

```yaml
Creation Date: 2025-11-12
Last Updated: 2025-11-12
Version: 1.0.0
Status: Complete
Total Pages: ~100 pages across all docs
Total Diagrams: 6 PlantUML files
Estimated Implementation: 24 weeks
Budget Range: $500-$30,000/month
Team Size: 2-4 engineers
```

---

## ✅ Next Steps

1. **Review** all documentation (estimated 95 minutes)
2. **Prioritize** which account pattern to use (Silo/Pool/Bridge)
3. **Set up** AWS Organizations (Week 1, Day 1)
4. **Begin** CDK infrastructure code (Week 2)
5. **Implement** Python Bridge (Week 3)
6. **Deploy** to development account (Week 4)

---

**全ての計画ドキュメントが完成しました。実装の準備が整っています。 🚀**
