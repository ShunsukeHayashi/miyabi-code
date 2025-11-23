# Miyabi Documentation - Quick Reference

**Last Updated**: 2025-11-18

---

## 🎯 Quick Navigation

| I want to... | Go to... |
|--------------|----------|
| Overview the entire system | [[INDEX\|Main Index]] |
| Find an entity | [[entities/INDEX\|Entities Index]] |
| Find an agent | [[agents/INDEX\|Agents Index]] |
| Find a relation | [[relations/INDEX\|Relations Index]] |
| Find a workflow | [[workflows/INDEX\|Workflows Index]] |
| See the label system | [[labels/INDEX\|Labels Index]] |

---

## 📊 System at a Glance

### Entities (14)

| ID | Name | Category | Manages |
|----|------|----------|---------|
| E1 | Issue | Primary | IssueAgent, CoordinatorAgent, RefresherAgent |
| E2 | Task | Primary | CoordinatorAgent, CodeGenAgent, ReviewAgent, DeploymentAgent |
| E3 | Agent | Primary | All Agents |
| E4 | PR | Primary | PRAgent, ReviewAgent |
| E5 | Label | Primary | IssueAgent |
| E6 | QualityReport | Extended | ReviewAgent |
| E7 | Command | Extended | All Agents |
| E8 | Escalation | Extended | CoordinatorAgent |
| E9 | Deployment | Extended | DeploymentAgent |
| E10 | LDDLog | Extended | RefresherAgent |
| E11 | DAG | System | CoordinatorAgent |
| E12 | Worktree | System | CoordinatorAgent |
| E13 | DiscordCommunity | System | All Agents |
| E14 | SubIssue | System | IssueAgent |

### Agents (21)

**Coding Agents (7)**:
- [[agents/CoordinatorAgent|CoordinatorAgent]] - Task orchestration, DAG
- [[agents/CodeGenAgent|CodeGenAgent]] - Code generation
- [[agents/ReviewAgent|ReviewAgent]] - Quality assessment
- [[agents/IssueAgent|IssueAgent]] - Issue analysis, labeling
- [[agents/PRAgent|PRAgent]] - PR automation
- [[agents/DeploymentAgent|DeploymentAgent]] - CI/CD deployment
- [[agents/RefresherAgent|RefresherAgent]] - State monitoring

**Business Agents (14)**: Phase 1-12 business operations

### Workflows (5)

| ID | Name | Duration | Primary Agent |
|----|------|----------|---------------|
| W1 | Issue Creation & Triage | ~5 min | IssueAgent |
| W2 | Task Decomposition & Planning | ~10-30 min | CoordinatorAgent |
| W3 | Code Implementation | ~30-120 min | CodeGenAgent, PRAgent |
| W4 | Code Review & QA | ~10-20 min | ReviewAgent |
| W5 | Deployment & Monitoring | ~10-30 min | DeploymentAgent |

### Relations (39)

**By Category**:
- Issue Lifecycle: R1-R4, R36-R37 (7)
- Task Management: R5-R8 (4)
- Agent Operations: R9-R15 (7)
- Label System: R16-R18 (3)
- PR Lifecycle: R19-R21 (3)
- Quality Control: R22-R23 (2)
- DAG: R24-R25 (2)
- Worktree: R26-R27 (2)
- Discord: R28-R35 (8)
- Hierarchical Issues: R38-R39 (2)

**By Cardinality**:
- 1:1 → 14 relations (36%)
- 1:N → 16 relations (41%)
- N:N → 9 relations (23%)

---

## 🔍 Common Lookup Patterns

### "How does an Issue become code?"

1. [[entities/E1|E1: Issue]] created on GitHub
2. [[agents/IssueAgent|IssueAgent]] analyzes via [[relations/R1|R1: analyzed-by]]
3. [[agents/CoordinatorAgent|CoordinatorAgent]] decomposes via [[relations/R2|R2: decomposed-into]]
4. Creates [[entities/E11|E11: DAG]] and [[entities/E2|E2: Tasks]]
5. [[agents/CodeGenAgent|CodeGenAgent]] executes tasks via [[relations/R9|R9: executes]]
6. [[entities/E12|E12: Worktree]] runs tasks via [[relations/R26|R26: executes]]
7. [[agents/PRAgent|PRAgent]] generates [[entities/E4|E4: PR]] via [[relations/R10|R10: generates]]
8. [[agents/ReviewAgent|ReviewAgent]] reviews via [[relations/R19|R19: reviewed-by]]
9. [[agents/DeploymentAgent|DeploymentAgent]] performs [[entities/E9|E9: Deployment]] via [[relations/R13|R13: performs]]

**Workflows**: W1 → W2 → W3 → W4 → W5

### "Which agent manages which entity?"

See [[agents/INDEX|Agents Index]] → "Manages Entities" section for each agent

### "What relations does an entity have?"

See each entity's "Entity Relationships" section:
- **Outgoing Relations**: What this entity creates/connects to
- **Incoming Relations**: What creates/connects to this entity

### "What happens in a workflow?"

See each workflow's:
- **Uses Entities**: What data is involved
- **Invokes Agents**: Who does the work
- **Creates Relations**: What connections are made

---

## 🎨 Graph View Color Key

Open Graph View in Obsidian to see:

- 🔵 **Blue** = Entities (data structures)
- 🟢 **Green** = Agents (actors)
- 🔴 **Red** = Relations (connections)
- 🟡 **Yellow** = Workflows (processes)
- 🟣 **Purple** = Labels (classifications)

---

## 🏷️ Search Tags

Use Obsidian search with these tags:

- `#entity` - All 14 entities
- `#agent` - All 21 agents
- `#relation` - All 39 relations
- `#workflow` - All 5 workflows
- `#E1` - Specific entity by ID
- `#R1` - Specific relation by ID
- `#W1` - Specific workflow by ID

---

## 📈 Quick Stats

| Metric | Value |
|--------|-------|
| Total Documents | 136 |
| Enhanced Documents | 85 |
| Cross-reference Links | 500+ |
| Color Groups | 5 |
| Index Pages | 6 |
| Coverage | 100% |

---

## 🔗 Related Documents

- [[DOCUMENTATION_SYSTEM_REPORT|Full Enhancement Report]] - Complete details
- [[DIAGRAMS_GALLERY|Diagrams Gallery]] - All visual documentation
- [[WORKFLOWS_DIAGRAM|Workflows Visual Guide]] - Interactive workflow diagrams
- [[.obsidian/GRAPH_VIEW_GUIDE|Graph View Guide]] - Customize graph view
- [[INDEX|Main Index]] - Primary navigation hub

---

**Quick Reference Card** | Version 1.0 | 2025-11-18
