# Miyabi Architecture Documentation - Navigation Guide

**Version**: 1.0.0
**Created**: 2025-10-24
**Purpose**: Help users navigate the complete architecture documentation

---

## 📋 Quick Start

**New to Miyabi?** Follow this 5-step path:

1. **[README.md](README.md)** - Master index (5 min read)
2. **[Architecture Map](Miyabi%20Architecture%20Documentation%20Map.png)** - Visual overview (2 min)
3. **[Entity-Relation Model](ENTITY_RELATION_INDEX.md)** - Core data structures (15 min)
4. **[End-to-End Workflow](END_TO_END_WORKFLOW.md)** - Complete workflow (20 min)
5. **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Infrastructure setup (30 min)

**Total Time**: ~1 hour for complete overview

---

## 🗺️ Architecture Map

![Architecture Documentation Map](Miyabi%20Architecture%20Documentation%20Map.png)

**Visual representation** of how all 19 diagrams interconnect and support different user journeys.

---

## 👥 User Journeys

### 🆕 Journey 1: New Developer Onboarding

**Goal**: Understand Miyabi from scratch and start contributing

**Path** (2-3 hours):

1. **Start**: [README.md](README.md)
   - Overview of all collections
   - Understand the 6 architectural layers
   - Note: 19 diagrams available

2. **Data Model**: [ENTITY_RELATION_INDEX.md](ENTITY_RELATION_INDEX.md)
   - Study 12 core entities
   - Understand 27 relationships
   - Review 5 state machines
   - **Key Diagram**: Entity-Relation Overview.png

3. **Complete Workflow**: [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md)
   - Follow 9 phases from Issue → Production
   - Understand autonomous operation (45 min avg)
   - See parallel execution with worktrees
   - **Key Diagram**: End-to-End Workflow.png

4. **Code Structure**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md)
   - Explore 26+ Rust crates
   - Understand 6-layer architecture
   - Learn Agent execution model
   - **Key Diagrams**: Crates Architecture.png, Crates Layers.png

5. **Development Setup**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 1
   - Install local development environment
   - Configure GitHub token
   - Run first agent locally
   - **Commands**: `cargo build`, `miyabi agent run`

**Next Steps**:
- Read Agent specifications: `.claude/agents/specs/coding/*.md`
- Study Worktree protocol: `docs/WORKTREE_PROTOCOL.md`
- Explore Knowledge system: `crates/miyabi-knowledge/README.md`

---

### 💼 Journey 2: Stakeholder/Management

**Goal**: Understand business value, ROI, and investment requirements

**Path** (30-45 minutes):

1. **Executive Summary**: [README.md](README.md)
   - Quick statistics: 19 diagrams, 6 collections
   - 100% autonomous operation
   - Multi-cloud deployment

2. **Business Case**: [CLINE_INTEGRATION_ROADMAP.md](CLINE_INTEGRATION_ROADMAP.md)
   - **Timeline**: 6 months (24 weeks)
   - **Budget**: $129,000 total ($120K dev + $9K infrastructure)
   - **Team**: 2-4 developers
   - **ROI**: 30% productivity increase, 40% code review time reduction
   - **Key Diagram**: Cline + Miyabi Integration Timeline.png

3. **Value Demonstration**: [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md)
   - **Speed**: 45 minutes per feature (vs 4-8 hours manual)
   - **Quality**: 100/100 score automation
   - **Autonomy**: Zero human intervention
   - **Scalability**: Unlimited parallel execution
   - **Key Diagram**: End-to-End Workflow.png

4. **Infrastructure Costs**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Cost Estimation
   - **Production**: $358-458/month (AWS/GCP/Azure)
   - **Staging**: +$150/month
   - **Optimization**: 60-80% savings with spot instances
   - **Key Diagram**: Deployment Architecture.png

5. **Comparative Analysis**: [CLINE_ANALYSIS.md](CLINE_ANALYSIS.md)
   - Miyabi vs Cline strengths
   - Integration opportunities (hybrid approach)
   - Market positioning
   - **Key Diagrams**: Architecture Comparison.png, Integration Opportunities.png

**Decision Points**:
- ✅ Approve integration budget ($129K)?
- ✅ Allocate 2-4 developers for 6 months?
- ✅ Approve cloud infrastructure costs ($358-608/month)?
- ✅ Set timeline expectations (Q2 2026 launch)?

---

### 🔧 Journey 3: DevOps/SRE Engineer

**Goal**: Deploy and operate Miyabi in production

**Path** (4-6 hours for full deployment):

1. **Infrastructure Overview**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
   - 5 environment layers
   - 3 cloud provider options (AWS/GCP/Azure)
   - Kubernetes architecture
   - **Key Diagram**: Deployment Architecture.png

2. **Self-Hosted Runners**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 3
   - Runner setup (GitHub-hosted vs self-hosted)
   - Water Spider Orchestrator (24/7 daemon)
   - SQLite database configuration
   - **Systemd service**: `miyabi-orchestrator.service`

3. **Kubernetes Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 4
   - Choose platform: AWS EKS / GCP GKE / Azure AKS
   - Namespace setup (staging + production)
   - Deploy manifests: `kubectl apply -f k8s/production/`
   - Configure auto-scaling (HPA)

4. **Monitoring Stack**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 5
   - Install Prometheus + Grafana (Helm)
   - Configure Loki (log aggregation)
   - Setup Jaeger (distributed tracing)
   - Create dashboards and alerts

5. **Orchestrator Deep Dive**: [WATER_SPIDER_INDEX.md](WATER_SPIDER_INDEX.md)
   - Understand 24/7 daemon architecture
   - Configure webhook endpoints
   - Set concurrency limits
   - Monitor active sessions
   - **Key Diagrams**: Water Spider System.png, Task Scheduler.png

6. **CI/CD Pipeline**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → CI/CD Section
   - GitHub Actions workflow
   - Docker image build + push
   - Staging deployment + health check
   - Production deployment + rollback

**Operational Tasks**:
```bash
# Check orchestrator status
sudo systemctl status miyabi-orchestrator

# View active sessions
sqlite3 /var/lib/miyabi/orchestrator.db \
  "SELECT * FROM sessions WHERE status='running';"

# Monitor worktrees
ls -la /var/lib/miyabi/worktrees/

# Check Grafana dashboards
kubectl port-forward -n miyabi-monitoring svc/prometheus-grafana 3000:80

# View logs
kubectl logs -f deployment/miyabi-api -n miyabi-production
```

---

### 🤝 Journey 4: Integration Partner

**Goal**: Integrate with Miyabi or build hybrid Cline+Miyabi solution

**Path** (2-3 hours):

1. **Architecture Comparison**: [CLINE_ANALYSIS.md](CLINE_ANALYSIS.md)
   - Interactive (Cline) vs Autonomous (Miyabi)
   - Strengths and weaknesses
   - Complementary nature
   - **Key Diagram**: Architecture Comparison.png

2. **Integration Scenarios**: [CLINE_ANALYSIS.md](CLINE_ANALYSIS.md) → Integration Opportunities
   - **Scenario 1**: Cline UI → Miyabi Backend
   - **Scenario 2**: Miyabi Orchestrator → Cline Execution
   - **Scenario 3**: Shared Context Layer
   - **Key Diagram**: Integration Opportunities.png

3. **Implementation Roadmap**: [CLINE_INTEGRATION_ROADMAP.md](CLINE_INTEGRATION_ROADMAP.md)
   - **Phase 1**: MCP Server Enhancement (2 weeks)
   - **Phase 2**: Cline Extension Fork (2 weeks)
   - **Phase 3**: Interactive Debugging UI (2 weeks)
   - **Phase 4-9**: Full integration (18 more weeks)
   - **Key Diagram**: Integration Timeline.png

4. **Technical Specifications**:
   - **MCP Protocol**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) → MCP Integration.png
   - **Agent System**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) → Agent Execution Flow.png
   - **Data Model**: [ENTITY_RELATION_INDEX.md](ENTITY_RELATION_INDEX.md) → All 4 diagrams

5. **API Integration Points**:
   - **MCP Server**: `crates/miyabi-mcp-server/` (JSON-RPC 2.0)
   - **GitHub API**: `crates/miyabi-github/` (octocrab wrapper)
   - **Knowledge Base**: `crates/miyabi-knowledge/` (Qdrant + RAG)

**Integration Deliverables**:
- WebSocket MCP transport
- Cline extension fork (TypeScript)
- Unified context layer (Redis + Qdrant)
- Event bus (NATS)

---

### 🎓 Journey 5: Technical Writer/Documentarian

**Goal**: Update or extend architecture documentation

**Path** (1-2 hours to understand, ongoing to maintain):

1. **Documentation Structure**: [README.md](README.md)
   - 6 collections, 19 diagrams
   - 6 comprehensive guides
   - Cross-reference navigation

2. **PlantUML Basics**: [README.md](README.md) → Generating Diagrams
   - Install PlantUML: `brew install plantuml`
   - Generate PNGs: `plantuml -tpng *.puml`
   - Preview: VS Code PlantUML extension

3. **Diagram Conventions**: [README.md](README.md) → Diagram Conventions
   - Color coding (6 colors for layers)
   - Arrow types (solid, dashed, dotted)
   - Component stereotypes

4. **Update Process**: [README.md](README.md) → Updating Diagrams
   - When to update (5 scenarios)
   - Edit `.puml` source
   - Regenerate PNG
   - Update index file
   - Commit both files

5. **Documentation Files**:
   ```
   docs/architecture/
   ├── README.md                    # Master index
   ├── NAVIGATION_GUIDE.md          # This file
   ├── architecture-map.puml        # Visual map
   ├── *.puml                       # 20 source files
   ├── *.png                        # 20 generated diagrams
   ├── DIAGRAM_INDEX.md             # Crates collection
   ├── WATER_SPIDER_INDEX.md        # Orchestrator collection
   ├── CLINE_ANALYSIS.md            # Comparative analysis
   ├── CLINE_INTEGRATION_ROADMAP.md # Integration plan
   ├── ENTITY_RELATION_INDEX.md     # Data model
   ├── END_TO_END_WORKFLOW.md       # Complete workflow
   └── DEPLOYMENT_GUIDE.md          # Infrastructure
   ```

**Maintenance Tasks**:
- Add new crate? Update `crates-architecture.puml`
- New agent? Update `agent-execution-flow.puml`
- Architecture change? Update relevant diagram + regenerate
- New deployment target? Update `deployment-architecture.puml`

---

## 📚 Documentation Index by Topic

### By Technology

**Rust Crates**:
- [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) - Complete crate architecture
- Crates Architecture.png - Dependency graph
- Crates Layers.png - 6-layer view

**Kubernetes**:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 4
- Deployment Architecture.png - K8s manifests
- Multi-cloud support (AWS/GCP/Azure)

**GitHub OS**:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 2
- [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md) → Phase 1
- Issues, PRs, Actions, Webhooks as OS primitives

**Agents**:
- [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) - Agent execution flow
- `.claude/agents/specs/coding/*.md` - 7 agent specifications
- `.claude/agents/prompts/coding/*.md` - Execution prompts

**Vector Database (Qdrant)**:
- [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) → Knowledge System
- `crates/miyabi-knowledge/README.md`
- RAG, embeddings, semantic search

**MCP Protocol**:
- [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) → MCP Integration
- `crates/miyabi-mcp-server/README.md`
- JSON-RPC 2.0, Claude Code integration

### By Concern

**Performance**:
- [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md) → Success Metrics
- Parallel execution (unlimited worktrees)
- 45-minute average feature implementation
- Auto-scaling (3-10 replicas)

**Security**:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Security Considerations
- TLS/SSL (Let's Encrypt)
- Network policies (K8s)
- Secrets management (K8s secrets + sealed-secrets)

**Observability**:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Layer 5
- Prometheus + Grafana (metrics)
- Loki (logs)
- Jaeger (traces)

**Cost Optimization**:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Cost Estimation
- Spot/Preemptible instances (60-80% savings)
- Auto-scaling (scale down off-hours)
- Self-hosted runners (free compute)

---

## 🔍 Finding Specific Information

### Common Questions & Answers

**Q: How does an Issue become a deployment?**
**A**: [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md) - Complete 9-phase sequence

**Q: What are the 12 core entities?**
**A**: [ENTITY_RELATION_INDEX.md](ENTITY_RELATION_INDEX.md) → Entity-Relation Overview

**Q: How do I deploy to production?**
**A**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → CI/CD Pipeline

**Q: What's the difference between Cline and Miyabi?**
**A**: [CLINE_ANALYSIS.md](CLINE_ANALYSIS.md) → Comparative Metrics

**Q: How much will it cost to run in production?**
**A**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) → Cost Estimation ($358-458/month)

**Q: How long to implement Cline integration?**
**A**: [CLINE_INTEGRATION_ROADMAP.md](CLINE_INTEGRATION_ROADMAP.md) - 6 months, $129K

**Q: What agents are available?**
**A**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) → Agent Execution Flow (7 coding agents)

**Q: How does parallel execution work?**
**A**: [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md) → Phase 5 (worktree isolation)

**Q: Where are quality checks performed?**
**A**: [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md) → Phase 6 (ReviewAgent)

**Q: How is the knowledge base indexed?**
**A**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md) → Knowledge System (Qdrant + embeddings)

---

## 📊 Diagram Quick Reference

### Component Diagrams (8)

| Diagram | File | Purpose | Audience |
|---------|------|---------|----------|
| Crates Architecture | `Crates Architecture.png` | Complete dependency graph | Developers |
| Crates Layers | `Crates Layers.png` | 6-layer simplified view | All |
| Knowledge System | `Knowledge Management System.png` | Qdrant + RAG architecture | Developers |
| Water Spider System | `Water Spider System.png` | Orchestrator architecture | DevOps |
| Task Scheduler | `Task Scheduler Service.png` | Scheduler internals | Developers |
| Cline Comparison | `Cline vs Miyabi.png` | Architecture comparison | Partners |
| Cline Opportunities | `Cline + Miyabi Integration.png` | Integration scenarios | Partners |
| Deployment | `Deployment Architecture.png` | Infrastructure layers | DevOps |

### Sequence Diagrams (5)

| Diagram | File | Purpose | Audience |
|---------|------|---------|----------|
| Agent Execution | `Agent Execution Flow.png` | Worktree-based execution | Developers |
| MCP Integration | `MCP Integration.png` | JSON-RPC protocol | Developers |
| Task Lifecycle | `Task Lifecycle Flow.png` | Complete task flow | All |
| Entity Data Flow | `Entity Data Flow.png` | Issue → Deployment | All |
| End-to-End | `End-to-End Workflow.png` | Complete sequence | All |

### State Diagrams (3)

| Diagram | File | Purpose | Audience |
|---------|------|---------|----------|
| Water Spider State | `Water Spider State Machine.png` | 11 states, 16 transitions | Developers |
| Entity States | `Entity State Machines.png` | 5 machines, 21 states | Developers |

### ER Diagrams (2)

| Diagram | File | Purpose | Audience |
|---------|------|---------|----------|
| ER Overview | `Entity-Relation Overview.png` | 12 entities overview | All |
| Detailed Relationships | `Entity Relationships.png` | 27 relationships | Developers |

### Timeline Diagrams (1)

| Diagram | File | Purpose | Audience |
|---------|------|---------|----------|
| Cline Timeline | `Cline Integration Timeline.png` | 6-month roadmap | Stakeholders |

### Map Diagrams (1)

| Diagram | File | Purpose | Audience |
|---------|------|---------|----------|
| Documentation Map | `Architecture Documentation Map.png` | Navigation guide | All |

---

## 🛠️ Tools & Resources

### Required Tools

**PlantUML**:
```bash
brew install plantuml
# Or: sudo apt-get install plantuml
# Or: choco install plantuml
```

**VS Code Extensions**:
- PlantUML (jebbs.plantuml)
- Markdown Preview Enhanced
- Mermaid Preview (for future diagrams)

**Optional Tools**:
- Graphviz (for PlantUML rendering)
- Docker Desktop (for local K8s)
- kubectl (for Kubernetes)
- Helm (for package management)

### External Resources

**PlantUML**:
- Official: https://plantuml.com/
- Component Diagrams: https://plantuml.com/component-diagram
- Sequence Diagrams: https://plantuml.com/sequence-diagram
- State Diagrams: https://plantuml.com/state-diagram
- Online Editor: https://www.plantuml.com/plantuml/

**Kubernetes**:
- AWS EKS: https://aws.amazon.com/eks/
- GCP GKE: https://cloud.google.com/kubernetes-engine
- Azure AKS: https://azure.microsoft.com/en-us/services/kubernetes-service/

**Monitoring**:
- Prometheus: https://prometheus.io/
- Grafana: https://grafana.com/
- Loki: https://grafana.com/oss/loki/
- Jaeger: https://www.jaegertracing.io/

---

## 📖 Recommended Reading Order

### Fast Track (1 hour)
1. README.md (5 min)
2. Architecture Map diagram (5 min)
3. Entity-Relation Overview diagram (10 min)
4. End-to-End Workflow diagram (20 min)
5. Deployment Architecture diagram (20 min)

### Standard Track (Half day)
1. README.md
2. ENTITY_RELATION_INDEX.md (all 4 diagrams)
3. END_TO_END_WORKFLOW.md (complete guide)
4. DIAGRAM_INDEX.md (crates architecture)
5. DEPLOYMENT_GUIDE.md (Layer 1-3)

### Complete Track (Full day)
1. All Fast Track items
2. All Standard Track items
3. WATER_SPIDER_INDEX.md (orchestrator)
4. CLINE_INTEGRATION_ROADMAP.md (integration plan)
5. DEPLOYMENT_GUIDE.md (complete guide)
6. All agent specifications (`.claude/agents/specs/`)

---

## 🔄 Keep Documentation Updated

**When to Update**:

1. **New Crate Added**: Update `crates-architecture.puml` + `crates-layers.puml`
2. **Agent Modified**: Update `agent-execution-flow.puml`
3. **Deployment Changes**: Update `deployment-architecture.puml`
4. **Workflow Changes**: Update `end-to-end-workflow.puml`
5. **Integration Progress**: Update `cline-integration-timeline.puml`

**Update Process**:
```bash
# 1. Edit .puml source
vim docs/architecture/crates-architecture.puml

# 2. Regenerate PNG
plantuml -tpng docs/architecture/crates-architecture.puml

# 3. Update index file
vim docs/architecture/DIAGRAM_INDEX.md

# 4. Commit both files
git add docs/architecture/crates-architecture.{puml,png}
git add docs/architecture/DIAGRAM_INDEX.md
git commit -m "docs: update crates architecture diagram"
```

---

## 📞 Getting Help

**Documentation Issues**:
- File issue: https://github.com/your-org/miyabi-private/issues/new
- Label: `documentation`
- Include: Which diagram/section is unclear

**Technical Questions**:
- Architecture decisions: See individual diagram documentation
- Implementation details: Check source code in `crates/`
- Deployment issues: See DEPLOYMENT_GUIDE.md troubleshooting

**Contributing**:
- Architecture changes: Propose via Issue first
- Diagram updates: Follow update process above
- New diagrams: Discuss with team before creating

---

**Last Updated**: 2025-10-24
**Documentation Version**: 1.0.0
**Total Diagrams**: 20 (19 architecture + 1 map)
**Total Guides**: 7 comprehensive documents
**Maintenance**: Update diagrams when architecture changes
