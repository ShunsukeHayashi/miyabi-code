# Miyabi Definition System

**Last Updated**: 2025-10-31
**Version**: 1.0.0
**Priority**: ⭐⭐⭐⭐⭐

## 🎯 Overview

**miyabi_def** is the **machine-readable source of truth** for the entire Miyabi project. It provides structured, template-based definitions using Jinja2 + YAML format.

**Location**: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/`

## 📊 Core Components

### Foundation Definitions (Phase 1 - Complete)

| Definition | File | Items | Lines | Status |
|------------|------|-------|-------|--------|
| **Entities** | `variables/entities.yaml` | 14 entities | 1,420 | ✅ Complete |
| **Relations** | `variables/relations.yaml` | 39 relations | 1,350 | ✅ Complete |
| **Labels** | `variables/labels.yaml` | 57 labels (11 categories) | 840 | ✅ Complete |
| **Workflows** | `variables/workflows.yaml` | 5 workflows (38 stages) | 680 | ✅ Complete |

### Existing Definitions

| Definition | File | Items | Status |
|------------|------|-------|--------|
| **Agents** | `variables/agents.yaml` | 21 agents | ✅ Complete |
| **Crates** | `variables/crates.yaml` | 15 crates | ✅ Complete |
| **Skills** | `variables/skills.yaml` | 18 skills | ✅ Complete |
| **Universal Execution** | `variables/universal_execution.yaml` | Ω-System | ✅ Complete |

## 🔗 Integration with .claude/context

The miyabi_def system **supersedes and unifies** existing context files:

| Legacy Context | Miyabi Def Replacement | Status |
|----------------|------------------------|--------|
| `entity-relation.md` | `variables/entities.yaml` + `variables/relations.yaml` | ✅ **NEW: More Complete** |
| `labels.md` | `variables/labels.yaml` | ✅ **NEW: 57 labels vs 53** |
| `agents.md` | `variables/agents.yaml` | ✅ **Existing** |
| N/A | `variables/workflows.yaml` | ✅ **NEW: 5 workflows** |

## 📚 Key Definitions

### 14 Core Entities (E1-E14)

```yaml
E1: Issue          # GitHub Issue - primary entry point
E2: Task           # Decomposed task from Issue
E3: Agent          # Autonomous agent (21 total: 7 coding, 14 business)
E4: PR             # Pull Request
E5: Label          # GitHub Label (57 labels, 11 categories)
E6: QualityReport  # Code quality evaluation
E7: Command        # Claude Code slash command
E8: Escalation     # Escalation to human (TechLead/CISO/etc)
E9: Deployment     # Deployment to staging/production
E10: LDDLog        # Log-Driven Development log
E11: DAG           # Task dependency graph
E12: Worktree      # Git worktree for parallel execution
E13: DiscordCommunity  # Discord community integration
E14: SubIssue      # Hierarchical Issue (parent/child)
```

### 39 Relations (R1-R39) with N1/N2/N3 Notation

**Issue Workflow** (R1-R4, R36-R37):
- R1: Issue --analyzed-by→ Agent
- R2: Issue --decomposed-into→ Task[]
- R3: Issue --tagged-with→ Label[]
- R4: Issue --creates→ PR
- R36: Issue --parent-of→ SubIssue
- R37: SubIssue --child-of→ Issue

**Agent Operations** (R9-R15):
- R9: Agent --executes→ Task
- R10: Agent --generates→ PR
- R11: Agent --creates→ QualityReport
- R12: Agent --triggers→ Escalation
- R13: Agent --performs→ Deployment
- R14: Agent --logs-to→ LDDLog
- R15: Command --invokes→ Agent

**Full list**: See `miyabi_def/variables/relations.yaml`

### 57 Labels across 11 Categories

| Category | Count | Examples |
|----------|-------|----------|
| **STATE** | 8 | pending, analyzing, implementing, reviewing, done |
| **AGENT** | 6 | agent:coordinator, agent:codegen, agent:review |
| **PRIORITY** | 4 | P0-Critical, P1-High, P2-Medium, P3-Low |
| **TYPE** | 7 | feature, bug, docs, refactor, test |
| **SEVERITY** | 4 | Sev.1-Critical, Sev.2-High, Sev.3-Medium, Sev.4-Low |
| **PHASE** | 5 | planning, implementation, testing, deployment, monitoring |
| **SPECIAL** | 7 | security, cost-watch, dependencies, learning, experiment |
| **TRIGGER** | 4 | trigger:agent-execute, trigger:deploy-staging |
| **QUALITY** | 4 | quality:excellent, quality:good, quality:needs-improvement |
| **COMMUNITY** | 4 | good-first-issue, help-wanted, question, discussion |
| **HIERARCHY** | 4 | hierarchy:root, hierarchy:parent, hierarchy:child, hierarchy:leaf |

**Full definitions**: See `miyabi_def/variables/labels.yaml`

### 5 Core Workflows (W1-W5)

```
W1: Issue Creation & Triage      (~5 min)
  ↓
W2: Task Decomposition & Planning (~10-30 min)
  ↓
W3: Code Implementation           (~30-120 min)
  ↓
W4: Code Review & QA              (~10-20 min)
  ↓
W5: Deployment & Monitoring       (~10-30 min)
```

**Total Duration**: ~65-205 minutes (1-3.5 hours)

**Full specifications**: See `miyabi_def/variables/workflows.yaml`

## 🏗️ Universal Systems

### Ω-System (Omega) - Universal Task Execution

```
Ω: I × W → R

Where:
  I = Intent Space (意図空間)
  W = World Space (環境空間)
  R = Result Space (結果空間)
```

**6-Phase Execution Engine**:
- θ₁: Understanding (Intent → Structure)
- θ₂: Generation (Structure → Tasks)
- θ₃: Allocation (Tasks → Resources)
- θ₄: Execution (Schedule → Results)
- θ₅: Integration (Results → Deliverable)
- θ₆: Learning (Result → Knowledge)

**Full specification**: See `miyabi_def/UNIVERSAL_SYSTEM.md`

### Λ-System (Lambda) - Agent Execution Maximization

```
E_max = C × R × I × T × D

Where:
  C = Complete Control
  R = Role Sequence
  I = Optimal Context (minimal & sufficient)
  T = Appropriate Tools
  D = Clear Deliverable (SMART)
```

**Full specification**: See `miyabi_def/templates/agent_execution_maximization.yaml.j2`

## 🔄 Using Miyabi Definitions in Agent Work

### Pattern 1: Entity-Relation Lookup

When working with entities:
```bash
# Read entity definitions
cat /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/entities.yaml

# Search for specific entity
grep -A 20 "E3_Agent:" /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/entities.yaml
```

### Pattern 2: Label Assignment

When assigning labels to Issues:
```bash
# View all label definitions
cat /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/labels.yaml

# Search for specific category
grep -A 10 "STATE:" /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/labels.yaml
```

### Pattern 3: Workflow Stage Identification

When determining current workflow stage:
```bash
# View workflow definitions
cat /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/workflows.yaml

# Search for specific workflow
grep -A 30 "W3_Code_Implementation:" /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/workflows.yaml
```

### Pattern 4: Agent Capability Lookup

When selecting appropriate agent for task:
```bash
# View agent definitions
cat /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/agents.yaml

# Check agent responsibilities
grep -A 15 "CoordinatorAgent:" /Users/shunsuke/Dev/miyabi-private/miyabi_def/variables/agents.yaml
```

## 📊 Generating Outputs

The miyabi_def system uses Jinja2 templates to generate formatted YAML outputs:

```bash
cd /Users/shunsuke/Dev/miyabi-private/miyabi_def

# Activate virtual environment
source .venv/bin/activate

# Generate all definitions
python generate.py

# View generated files
ls -lh generated/

# Generated outputs:
# - generated/entities.yaml
# - generated/relations.yaml
# - generated/labels.yaml
# - generated/workflows.yaml
# - generated/agents.yaml
# - generated/crates.yaml
# - generated/skills.yaml
```

## 🎯 Agent Work Setting Integration

### For Claude Code Agents

When working on agent tasks, reference miyabi_def for:

1. **Entity Specifications**: `variables/entities.yaml`
   - Complete attribute definitions
   - Implementation file mappings
   - Relation references

2. **Relation Definitions**: `variables/relations.yaml`
   - Cardinality (1:1, 1:N, N:N)
   - Implementation examples
   - Handler specifications

3. **Label Taxonomy**: `variables/labels.yaml`
   - All 57 labels with descriptions
   - Automation rules
   - State transitions

4. **Workflow Stages**: `variables/workflows.yaml`
   - Stage definitions
   - Decision points
   - Success/error handlers

5. **Agent Capabilities**: `variables/agents.yaml`
   - Agent responsibilities
   - Authority levels
   - Escalation targets

### For Codex Agents

The .codex directory mirrors .claude, so all miyabi_def integrations apply equally.

## 📈 Completeness Status

| Component | Status | Coverage |
|-----------|--------|----------|
| **Foundation (Phase 1)** | ✅ Complete | 70% |
| Entity-Relation Model | ✅ Complete | 14/14 entities, 39/39 relations |
| Label System | ✅ Complete | 57/57 labels |
| Workflow Definitions | ✅ Complete | 5/5 workflows |
| Agent Definitions | ✅ Complete | 21/21 agents |
| Crate Definitions | ✅ Complete | 15/15 crates |
| Skill Definitions | ✅ Complete | 18/18 skills |
| **Future Phases** | ⚠️ Pending | 30% |
| Architecture Decisions | ⚠️ Pending | 0/7 ADRs |
| Deployment Configs | ⚠️ Pending | 0/3 environments |
| Testing Strategies | ⚠️ Pending | Not defined |
| Business Strategy | ⚠️ Pending | Not defined |

**Detailed analysis**: See `miyabi_def/COMPLETENESS_ANALYSIS.md`

## 🔗 Related Modules

- **Entity-Relation**: [entity-relation.md](./entity-relation.md) - Legacy context (superseded by miyabi_def)
- **Labels**: [labels.md](./labels.md) - Legacy context (superseded by miyabi_def)
- **Agents**: [agents.md](./agents.md) - Agent overview (unified with miyabi_def)
- **Architecture**: [architecture.md](./architecture.md) - System architecture
- **Worktree**: [worktree.md](./worktree.md) - Git worktree usage

## 📖 Detailed Documentation

**Miyabi Def System**:
- **README**: `miyabi_def/README.md` - Complete usage guide
- **Universal System**: `miyabi_def/UNIVERSAL_SYSTEM.md` - Ω-System & Λ-System specs
- **Completeness Analysis**: `miyabi_def/COMPLETENESS_ANALYSIS.md` - Coverage report
- **Missing Contexts**: `miyabi_def/MISSING_CONTEXTS.md` - Gap analysis

**Legacy Docs** (still valid for implementation details):
- **Entity-Relation Model**: `docs/architecture/ENTITY_RELATION_MODEL.md`
- **Label System Guide**: `docs/guides/LABEL_SYSTEM_GUIDE.md`
- **Template Master Index**: `docs/TEMPLATE_MASTER_INDEX.md`

## 🚀 Quick Reference

### Priority Order for Agent Work

1. **⭐⭐⭐⭐⭐ miyabi_def/variables/** - Primary source of truth
2. **⭐⭐⭐⭐ .claude/context/** - Context modules (this directory)
3. **⭐⭐⭐ docs/** - Detailed implementation documentation
4. **⭐⭐ .claude/agents/specs/** - Agent specifications
5. **⭐ .claude/agents/prompts/** - Execution prompts

### When to Use Which

| Task | Use |
|------|-----|
| **Entity attribute lookup** | `miyabi_def/variables/entities.yaml` |
| **Relation implementation** | `miyabi_def/variables/relations.yaml` |
| **Label assignment rules** | `miyabi_def/variables/labels.yaml` |
| **Workflow stage identification** | `miyabi_def/variables/workflows.yaml` |
| **Agent capability check** | `miyabi_def/variables/agents.yaml` |
| **Crate feature lookup** | `miyabi_def/variables/crates.yaml` |
| **Skill usage** | `miyabi_def/variables/skills.yaml` |
| **Quick context summary** | `.claude/context/*.md` (this directory) |
| **Implementation details** | `docs/architecture/*.md` |

---

**Philosophy**: miyabi_def is the **single source of truth** for all Miyabi definitions. All other documentation should reference and stay consistent with it.

**Last Updated**: 2025-10-31
**Version**: 1.0.0
