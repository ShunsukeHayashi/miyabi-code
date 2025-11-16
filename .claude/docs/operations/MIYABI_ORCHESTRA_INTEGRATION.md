# 🎭 Miyabi Orchestra - Complete Integration Guide

**Version**: 3.0.0
**Created**: 2025-11-03
**Last Updated**: 2025-11-03
**Purpose**: Integrate ALL miyabi_def features with Claude Code Orchestra System

---

## 📑 Table of Contents

1. [Configuration & Schema Files](#-configuration--schema-files)
2. [Integration Overview](#-integration-overview)
3. [Directory Structure Integration](#-directory-structure-integration)
4. [Agent System Integration](#-agent-system-integration)
5. [Skills Integration](#%EF%B8%8F-skills-integration)
6. [Entity-Relation Model Integration](#-entity-relation-model-integration)
7. [Label System Integration](#%EF%B8%8F-label-system-integration)
8. [Workflow Integration](#-workflow-integration)
9. [Ω-System World Definition Integration](#-ω-system-world-definition-integration)
10. [Step-back Question Method Integration](#-step-back-question-method-integration)
11. [Water Spider v2.0 Integration](#-water-spider-v20-integration)
12. [Slash Commands Integration](#-slash-commands-integration)
13. [Configuration Files](#-configuration-files)
14. [Using orchestra-config.yaml](#-using-orchestra-configyaml)
15. [Quick Start with Full Integration](#-quick-start-with-full-integration)
16. [Integration Verification Checklist](#-integration-verification-checklist)
17. [Usage Examples](#-usage-examples)
18. [Maintenance](#-maintenance)
19. [Related Documentation](#-related-documentation)
20. [Benefits of Full Integration](#-benefits-of-full-integration)
21. [Troubleshooting](#-troubleshooting)
22. [Glossary](#-glossary)

---

## 📋 Configuration & Schema Files

### Master Configuration

**orchestra-config.yaml** - [.claude/orchestra-config.yaml](./orchestra-config.yaml)
- **Lines**: 490
- **Sections**: 15 (miyabi_def_integration, orchestra, agents, workflows, etc.)
- **Features**:
  - miyabi_def統合設定（11ファイル参照）
  - 5 Agent pane配置（カンナ、カエデ、サクラ、ツバキ、ボタン）
  - 7 Message Relayルール（自動連携）
  - VOICEVOX音声通知（6キャラクター）
  - Ω-System統合（World Definition + Step-back Method）
  - Health Check & Auto-recovery

### Schema Validation

**orchestra-config.schema.yaml** - [.claude/schemas/orchestra-config.schema.yaml](./schemas/orchestra-config.schema.yaml)
- **Format**: JSON Schema Draft 07 (YAML)
- **Size**: 12KB
- **Sections**: 7 (orchestration, ensemble, agents, tmux, metrics, logging, reporting)
- **Agent Types**: 21種類定義（Coding 7 + Business 14）
- **Ensemble Types**: 4種類（coding, hybrid, demo, custom）
- **Validation**: 型、範囲、enum、パターン完備

**orchestra-config.example.yaml** - [.claude/schemas/orchestra-config.example.yaml](./schemas/orchestra-config.example.yaml)
- **Lines**: 92
- **Purpose**: コピー＆ペースト可能なサンプル設定
- **Configuration**: Coding Ensemble (5-pane)

**Schema Documentation** - [.claude/schemas/README.md](./schemas/README.md)
- **Lines**: 244
- **Sections**: 使い方、Schema詳細、ユースケース、FAQ
- **Examples**: 3つの完全な設定例

### VS Code Integration

**.vscode/settings.json**
```json
{
  "yaml.schemas": {
    ".claude/schemas/orchestra-config.schema.yaml": [
      "orchestra-config.yaml",
      "**/orchestra-config.*.yaml"
    ]
  }
}
```

### Related Documentation

| Document | Path | Purpose |
|----------|------|---------|
| **Philosophy** | [MIYABI_PARALLEL_ORCHESTRA.md](./MIYABI_PARALLEL_ORCHESTRA.md) | 雅なる並列実行の哲学 |
| **Quick Start** | [../docs/QUICK_START_3STEPS.md](../docs/QUICK_START_3STEPS.md) | 3分でセットアップ |
| **Your Setup** | [../docs/YOUR_CURRENT_SETUP.md](../docs/YOUR_CURRENT_SETUP.md) | あなた専用ガイド |
| **tmux Operations** | [TMUX_OPERATIONS.md](./TMUX_OPERATIONS.md) | tmux技術詳細 |
| **tmux Quickstart** | [../docs/TMUX_QUICKSTART.md](../docs/TMUX_QUICKSTART.md) | 5分で基本操作 |
| **tmux Layouts** | [../docs/TMUX_LAYOUTS.md](../docs/TMUX_LAYOUTS.md) | レイアウト集 |
| **Visual Guide** | [../docs/VISUAL_GUIDE.md](../docs/VISUAL_GUIDE.md) | UI/UX改善ガイド |

---

## 🌟 Integration Overview

This document integrates **ALL** Miyabi features defined in `miyabi_def/` with the Claude Code Orchestra system running in tmux.

### Integrated Components

| Component | Source | Integration Status |
|-----------|--------|-------------------|
| **21 Agents** | `miyabi_def/generated/agents.yaml` | ✅ Integrated |
| **18 Skills** | `miyabi_def/generated/skills.yaml` | ✅ Integrated |
| **15 Crates** | `miyabi_def/generated/crates.yaml` | ✅ Referenced |
| **14 Entities** | `miyabi_def/generated/entities.yaml` | ✅ Referenced |
| **39 Relations** | `miyabi_def/generated/relations.yaml` | ✅ Referenced |
| **57 Labels** | `miyabi_def/generated/labels.yaml` | ✅ Referenced |
| **5 Workflows** | `miyabi_def/generated/workflows.yaml` | ✅ Referenced |
| **World Definition (Ω-System)** | `miyabi_def/generated/world_definition.yaml` | ✅ Referenced |
| **Step-back Method** | `miyabi_def/generated/step_back_question_method.yaml` | ✅ Referenced |

---

## 📁 Directory Structure Integration

```
/Users/shunsuke/Dev/miyabi-private/
│
├── .claude/                           # Claude Code configuration
│   ├── MIYABI_ORCHESTRA_INTEGRATION.md  # ⭐ This file
│   ├── orchestra-config.yaml          # ⭐ NEW - Master orchestra config
│   ├── agents/
│   │   ├── specs/                     # 21 Agent specifications
│   │   ├── tmux_agents_control.md     # tmux control guide
│   │   └── AGENT_CHARACTERS.md        # Character names mapping
│   ├── Skills/                        # 18 Skills (directories)
│   ├── commands/                      # Slash commands
│   ├── context/                       # Context modules
│   └── hooks/                         # Session hooks
│
├── miyabi_def/                        # Definition system
│   ├── INDEX.yaml                     # Master index
│   ├── generated/                     # Generated YAML definitions
│   │   ├── agents.yaml                # 21 Agents
│   │   ├── skills.yaml                # 18 Skills
│   │   ├── crates.yaml                # 15 Crates
│   │   ├── entities.yaml              # 14 Entities
│   │   ├── relations.yaml             # 39 Relations
│   │   ├── labels.yaml                # 57 Labels
│   │   ├── workflows.yaml             # 5 Workflows
│   │   ├── world_definition.yaml      # Ω-System World
│   │   ├── step_back_question_method.yaml  # SWML
│   │   ├── universal_task_execution.yaml   # Ω-System
│   │   └── agent_execution_maximization.yaml
│   ├── variables/                     # YAML variables
│   └── templates/                     # Jinja2 templates
│
└── scripts/
    ├── water-spider-monitor-v2.sh     # Enhanced Water Spider
    └── orchestra-*.sh                 # Orchestra scripts
```

---

## 🤖 Agent System Integration

### 21 Agents Complete Mapping

#### Coding Agents (7)

| Agent | Character | tmux Pane | Skill | miyabi_def Reference |
|-------|-----------|-----------|-------|---------------------|
| CoordinatorAgent | 🎼 カンナ (Conductor) | %1 | `agent-execution` | `agents.coding[0]` |
| CodeGenAgent | 🎹 カエデ (Maple) | %2 | `rust-development` | `agents.coding[1]` |
| ReviewAgent | 🎺 サクラ (Cherry) | %5 | `security-audit`, `debugging-troubleshooting` | `agents.coding[2]` |
| PRAgent | 🥁 ツバキ (Camellia) | %3 | `git-workflow` | `agents.coding[4]` |
| DeploymentAgent | 🎷 ボタン (Peony) | %4 | `agent-execution` | `agents.coding[5]` |
| IssueAgent | 📋 スミレ (Violet) | - | `issue-analysis` | `agents.coding[3]` |
| RefresherAgent | 🔄 アサガオ (Morning Glory) | - | `agent-execution` | `agents.coding[6]` |

#### Business Agents (14)

**Strategy & Planning (6)**:
1. AIEntrepreneurAgent - 🏢 Full business planning
2. ProductConceptAgent - 💡 Product concept design
3. ProductDesignAgent - 🎨 Detailed service design
4. FunnelDesignAgent - 🔀 Customer funnel optimization
5. PersonaAgent - 👤 Target persona development
6. SelfAnalysisAgent - 🔍 Self-analysis & career

**Marketing (5)**:
7. MarketResearchAgent - 📊 Market research & competition analysis
8. MarketingAgent - 📢 Marketing strategy execution
9. ContentCreationAgent - ✍️ Content production
10. SNSStrategyAgent - 📱 Social media strategy
11. YouTubeAgent - 🎬 YouTube channel optimization

**Sales & CRM (3)**:
12. SalesAgent - 💰 Sales process optimization
13. CRMAgent - 🤝 Customer relationship management
14. AnalyticsAgent - 📈 Data analysis & PDCA

**miyabi_def Reference**: `agents.business.strategy_planning[*]`, `agents.business.marketing[*]`, `agents.business.sales_crm[*]`

---

## 🛠️ Skills Integration

### 18 Skills Complete Mapping

#### Development Skills (5)

| Skill | Directory | miyabi_def Reference | Usage |
|-------|-----------|---------------------|-------|
| `rust-development` | `.claude/Skills/rust-development/` | `skills.development[0]` | `Skill tool with command "rust-development"` |
| `debugging-troubleshooting` | `.claude/Skills/debugging-troubleshooting/` | `skills.development[1]` | `Skill tool with command "debugging-troubleshooting"` |
| `dependency-management` | `.claude/Skills/dependency-management/` | `skills.development[2]` | `Skill tool with command "dependency-management"` |
| `performance-analysis` | `.claude/Skills/performance-analysis/` | `skills.development[3]` | `Skill tool with command "performance-analysis"` |
| `security-audit` | `.claude/Skills/security-audit/` | `skills.development[4]` | `Skill tool with command "security-audit"` |

#### Operations Skills (5)

| Skill | Directory | miyabi_def Reference | Usage |
|-------|-----------|---------------------|-------|
| `agent-execution` | `.claude/Skills/agent-execution/` | `skills.operations[0]` | `Skill tool with command "agent-execution"` |
| `git-workflow` | `.claude/Skills/git-workflow/` | `skills.operations[1]` | `Skill tool with command "git-workflow"` |
| `documentation-generation` | `.claude/Skills/documentation-generation/` | `skills.operations[2]` | `Skill tool with command "documentation-generation"` |
| `issue-analysis` | `.claude/Skills/issue-analysis/` | `skills.operations[3]` | `Skill tool with command "issue-analysis"` |
| `project-setup` | `.claude/Skills/project-setup/` | `skills.operations[4]` | `Skill tool with command "project-setup"` |

#### Business Skills (5)

| Skill | Directory | miyabi_def Reference | Usage |
|-------|-----------|---------------------|-------|
| `business-strategy-planning` | `.claude/Skills/business-strategy-planning/` | `skills.business[0]` | `Skill tool with command "business-strategy-planning"` |
| `content-marketing-strategy` | `.claude/Skills/content-marketing-strategy/` | `skills.business[1]` | `Skill tool with command "content-marketing-strategy"` |
| `market-research-analysis` | `.claude/Skills/market-research-analysis/` | `skills.business[2]` | `Skill tool with command "market-research-analysis"` |
| `sales-crm-management` | `.claude/Skills/sales-crm-management/` | `skills.business[3]` | `Skill tool with command "sales-crm-management"` |
| `growth-analytics-dashboard` | `.claude/Skills/growth-analytics-dashboard/` | `skills.business[4]` | `Skill tool with command "growth-analytics-dashboard"` |

#### Specialized Skills (3)

| Skill | Directory | miyabi_def Reference | Usage |
|-------|-----------|---------------------|-------|
| `voicevox` | `.claude/Skills/voicevox/` | `skills.specialized[0]` | `Skill tool with command "voicevox"` |
| `lark-integration` | (planned) | `skills.specialized[1]` | - |
| `knowledge-search` | (planned) | `skills.specialized[2]` | - |

---

## 📊 Entity-Relation Model Integration

### 14 Core Entities (E1-E14)

Reference: `miyabi_def/generated/entities.yaml`

| ID | Entity | Crate | miyabi_def Path |
|----|--------|-------|----------------|
| E1 | Issue | `miyabi-types` | `entities.E1_Issue` |
| E2 | Task | `miyabi-types` | `entities.E2_Task` |
| E3 | Agent | `miyabi-agents` | `entities.E3_Agent` |
| E4 | PR | `miyabi-github` | `entities.E4_PullRequest` |
| E5 | Label | `miyabi-types` | `entities.E5_Label` |
| E6 | QualityReport | `miyabi-types` | `entities.E6_QualityReport` |
| E7 | Command | `miyabi-types` | `entities.E7_Command` |
| E8 | Escalation | `miyabi-types` | `entities.E8_Escalation` |
| E9 | Deployment | `miyabi-types` | `entities.E9_Deployment` |
| E10 | LDDLog | `miyabi-types` | `entities.E10_LDDLog` |
| E11 | DAG | `miyabi-types` | `entities.E11_DAG` |
| E12 | Worktree | `miyabi-worktree` | `entities.E12_Worktree` |
| E13 | DiscordCommunity | `miyabi-types` | `entities.E13_DiscordCommunity` |
| E14 | SubIssue | `miyabi-types` | `entities.E14_SubIssue` |

### 39 Relations (R1-R39)

Reference: `miyabi_def/generated/relations.yaml`

**Cardinality Notation**:
- **N1**: 1:1 relationship
- **N2**: 1:N relationship
- **N3**: N:N relationship

Example:
```yaml
R1_Issue_decomposes_to_Tasks:
  cardinality: N2  # 1 Issue → N Tasks
  from: E1_Issue
  to: E2_Task
```

**Full list**: See `miyabi_def/generated/relations.yaml` for all 39 relations

### Relations Implementation Mapping

The following table shows how the 39 Relations from `miyabi_def` are implemented in the Miyabi Orchestra system:

| Relation ID | From → To | Cardinality | Implementation | File/Location |
|-------------|-----------|-------------|----------------|---------------|
| **Core Workflow Relations** |
| R1 | E1 (Issue) → E2 (Task) | N2 | CoordinatorAgent decomposes Issues into Tasks | `orchestra-config.yaml:L230-254` |
| R2 | E2 (Task) → E3 (Agent) | N2 | Task assignment to Agents in pane configuration | `orchestra-config.yaml:L32-122` |
| R3 | E3 (Agent) → E4 (PR) | N2 | PRAgent creates Pull Requests | `orchestra-config.yaml:L80-93` |
| R4 | E4 (PR) → E9 (Deployment) | N1 | DeploymentAgent deploys merged PRs | `orchestra-config.yaml:L95-108` |
| R5 | E1 (Issue) → E5 (Label) | N3 | Issues tagged with multiple Labels | `orchestra-config.yaml:L295-314` |
| **Agent Execution Relations** |
| R6 | E3 (Agent) → E2 (Task) | N2 | Agent executes assigned Tasks | Message Relay Rules R1-R7 |
| R7 | E3 (Agent) → E7 (Command) | N3 | Agents execute Commands via Skills | `.claude/Skills/*` |
| R8 | E3 (Agent) → E6 (QualityReport) | N2 | ReviewAgent generates QualityReports | `orchestra-config.yaml:L63-78` |
| R9 | E3 (Agent) → E12 (Worktree) | N2 | Agents work in isolated Worktrees | `miyabi-worktree` crate |
| **Message Relay Relations** |
| R10 | E3 (Agent) → E3 (Agent) | N3 | Inter-agent message relay | `orchestra-config.yaml:L124-177` |
| R11 | E3 (Agent) → E8 (Escalation) | N2 | Agent escalates blocked tasks | Water Spider health check |
| **Quality & Review Relations** |
| R12 | E6 (QualityReport) → E4 (PR) | N1 | QualityReport attached to PR | ReviewAgent workflow |
| R13 | E6 (QualityReport) → E5 (Label) | N3 | Quality scores mapped to Labels | `quality:*` labels |
| R14 | E4 (PR) → E5 (Label) | N3 | PRs tagged with state/quality Labels | GitHub PR labels |
| **Workflow Stage Relations** |
| R15 | E2 (Task) → E11 (DAG) | N2 | Tasks organized in DAG structure | CoordinatorAgent decomposition |
| R16 | E11 (DAG) → E2 (Task) | N2 | DAG defines Task dependencies | Workflow W2 (7 stages) |
| R17 | E1 (Issue) → E14 (SubIssue) | N2 | Issues decomposed into SubIssues | Hierarchical Issue management |
| R18 | E14 (SubIssue) → E2 (Task) | N2 | SubIssues further decomposed to Tasks | Multi-level decomposition |
| **Deployment & Logging Relations** |
| R19 | E9 (Deployment) → E10 (LDDLog) | N2 | Deployments logged in LDD format | `.ai/logs/orchestra-*.log` |
| R20 | E3 (Agent) → E10 (LDDLog) | N2 | Agent actions logged | Water Spider logging |
| **Community Relations** |
| R21 | E1 (Issue) → E13 (DiscordCommunity) | N3 | Issues discussed in Discord | (Planned integration) |
| R22 | E13 (DiscordCommunity) → E1 (Issue) | N2 | Community creates Issues | (Planned integration) |

**Note**: Relations R23-R39 are documented in `miyabi_def/generated/relations.yaml`. The above table focuses on Relations actively used in the Orchestra v2.0 implementation.

**Implementation Coverage**:
- **Fully Implemented**: R1-R20 (20 relations, 51%)
- **Partially Implemented**: R21-R22 (2 relations, 5%)
- **Planned/Future**: R23-R39 (17 relations, 44%)

---

## 🏷️ Label System Integration

### 57 Labels (11 Categories)

Reference: `miyabi_def/generated/labels.yaml`

| Category | Count | Labels | miyabi_def Path |
|----------|-------|--------|----------------|
| STATE | 8 | `state:created`, `state:analyzing`, `state:decomposed`, `state:in-progress`, `state:review`, `state:pr-ready`, `state:deployed`, `state:closed` | `labels.categories.STATE[*]` |
| AGENT | 6 | `agent:coordinator`, `agent:codegen`, `agent:review`, `agent:issue`, `agent:pr`, `agent:deployment` | `labels.categories.AGENT[*]` |
| PRIORITY | 4 | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` | `labels.categories.PRIORITY[*]` |
| TYPE | 7 | `type:feature`, `type:bug`, `type:refactor`, `type:docs`, `type:test`, `type:perf`, `type:chore` | `labels.categories.TYPE[*]` |
| SEVERITY | 4 | `severity:blocker`, `severity:major`, `severity:minor`, `severity:trivial` | `labels.categories.SEVERITY[*]` |
| PHASE | 5 | `phase:planning`, `phase:development`, `phase:testing`, `phase:deployment`, `phase:maintenance` | `labels.categories.PHASE[*]` |
| SPECIAL | 7 | `special:hotfix`, `special:security`, `special:breaking`, `special:experimental`, `special:deprecated`, `special:needs-discussion`, `special:blocked` | `labels.categories.SPECIAL[*]` |
| TRIGGER | 4 | `trigger:auto-escalate`, `trigger:auto-decompose`, `trigger:auto-deploy`, `trigger:auto-close` | `labels.categories.TRIGGER[*]` |
| QUALITY | 4 | `quality:passed`, `quality:warning`, `quality:failed`, `quality:pending` | `labels.categories.QUALITY[*]` |
| COMMUNITY | 4 | `community:question`, `community:discussion`, `community:feedback`, `community:contribution` | `labels.categories.COMMUNITY[*]` |
| HIERARCHY | 4 | `hierarchy:parent`, `hierarchy:child`, `hierarchy:dependency`, `hierarchy:blocker` | `labels.categories.HIERARCHY[*]` |

**Total**: 57 labels

**GitHub Integration**: `.github/labels.yml` synced with miyabi_def

---

## 🔄 Workflow Integration

### 5 Core Workflows (W1-W5, 38 Stages)

Reference: `miyabi_def/generated/workflows.yaml`

#### W1: Issue Creation & Triage (8 stages)
1. Issue Created → 2. Initial Triage → 3. Label Assignment → 4. Priority Assessment → 5. Agent Assignment → 6. Escalation Check → 7. SubIssue Creation → 8. Ready for Decomposition

#### W2: Task Decomposition (7 stages)
1. Analyze Issue → 2. Identify Sub-Tasks → 3. Create Task DAG → 4. Assign Dependencies → 5. Estimate Effort → 6. Allocate Resources → 7. Tasks Ready

#### W3: Code Implementation (9 stages)
1. Task Started → 2. Worktree Created → 3. Code Generation → 4. Unit Tests → 5. Integration Tests → 6. Code Quality Check → 7. Documentation → 8. Commit → 9. Implementation Complete

#### W4: Code Review (8 stages)
1. Review Requested → 2. Automated Checks → 3. Security Scan → 4. Performance Analysis → 5. Human Review → 6. Feedback Integration → 7. Re-Review → 8. Review Approved

#### W5: Deployment (6 stages)
1. PR Created → 2. CI/CD Pipeline → 3. Staging Deploy → 4. Verification → 5. Production Deploy → 6. Monitoring

**Total**: 38 stages across 5 workflows

---

## 🌍 Ω-System World Definition Integration

Reference: `miyabi_def/generated/world_definition.yaml`

### World Space (W) - 13 Dimensions

```
Ψ(W) = ∫[t₀→t₁] ∇(s, c, r, e) dt
```

Where:
- **W**: World Space
- **Ψ(W)**: World state function
- **∇(s, c, r, e)**: Gradient of spatial, contextual, resource, environmental dimensions
- **t**: Time

#### Dimensions
1. **Temporal** - Time zones, constraints, horizons
2. **Spatial** - Physical, digital, abstract spaces
3. **Contextual** - Domain, user, system, tech stack
4. **Resources** - Computational, human, information, financial
5. **Environmental** - System load, dependencies, constraints
6. **State Management** - Persistence, synchronization
7. **Ω Integration** - Task execution integration
8. **Evolution** - Continuous improvement
9. **Governance** - Policies, compliance
10. **Observability** - Metrics, logs, traces
11. **Scalability** - Horizontal, vertical scaling
12. **Extensibility** - Plugin system
13. **Roadmap** - Future enhancements

**Ω-System Function**:
```
Ω: I × W → R
```
- **I**: Input (Issue, Task, Context)
- **W**: World (Environment state)
- **R**: Result (Completed task, artifacts)

---

## 📚 Step-back Question Method Integration

Reference: `miyabi_def/generated/step_back_question_method.yaml`

### Mathematical Definition

```
F(Goal, Q) = ∫_{A}^{Z} f(step, Q) d(step) = Result
```

Where:
- **F**: Goal Achievement Function
- **f**: Step Execution Function
- **Q**: Set of Step-back Questions
- **[A, Z]**: 26-step process (Analyze → Zero-in)

### 26-Step Process (A to Z)

**A-M (Analysis & Decomposition)**:
A. Analyze → B. Break-down → C. Clarify → D. Decompose → E. Evaluate → F. Focus → G. Generate → H. Hypothesize → I. Investigate → J. Judge → K. Knowledge → L. Logic → M. Model

**N-Z (Execution & Convergence)**:
N. Navigate → O. Optimize → P. Prioritize → Q. Question → R. Refine → S. Synthesize → T. Test → U. Unify → V. Validate → W. Weigh → X. eXecute → Y. Yield → Z. Zero-in

### Quality Metrics
- **Step-back Effect**: 1.5~2.0x quality improvement
- **Error Reduction**: 40-60%
- **Insight Depth**: 2x increase

---

## 🎮 Water Spider v2.0 Integration

### Enhanced Agent Definitions

Update `scripts/water-spider-monitor-v2.sh`:

```bash
# Agent定義 - miyabi_def統合版
declare -A AGENTS=(
    ["%1"]="カンナ"    # CoordinatorAgent (Conductor)
    ["%2"]="カエデ"    # CodeGenAgent
    ["%5"]="サクラ"    # ReviewAgent
    ["%3"]="ツバキ"    # PRAgent
    ["%4"]="ボタン"    # DeploymentAgent
)

# Agent → Skill マッピング (miyabi_def/generated/agents.yaml準拠)
declare -A AGENT_SKILLS=(
    ["カンナ"]="agent-execution"
    ["カエデ"]="rust-development"
    ["サクラ"]="security-audit,debugging-troubleshooting"
    ["ツバキ"]="git-workflow"
    ["ボタン"]="agent-execution"
)

# Agent → miyabi_def ID マッピング
declare -A AGENT_MIYABI_IDS=(
    ["カンナ"]="agents.coding[0]"  # CoordinatorAgent
    ["カエデ"]="agents.coding[1]"  # CodeGenAgent
    ["サクラ"]="agents.coding[2]"  # ReviewAgent
    ["ツバキ"]="agents.coding[4]"  # PRAgent
    ["ボタン"]="agents.coding[5]"  # DeploymentAgent
)
```

---

## 🔗 Slash Commands Integration

### Miyabi-def Aware Commands

Create new commands in `.claude/commands/`:

#### `/miyabi-agents`
```markdown
List all 21 agents from miyabi_def/generated/agents.yaml and their current status in the Orchestra.

For each agent, show:
- Name & Character
- Category (Coding/Business)
- Current tmux pane (if running)
- Available skills
- miyabi_def reference path
```

#### `/miyabi-skills`
```markdown
List all 18 skills from miyabi_def/generated/skills.yaml.

For each skill, show:
- Name
- Category (Development/Operations/Business/Specialized)
- Claude Code Skill command
- Associated agents
```

#### `/miyabi-workflow <workflow_id>`
```markdown
Show detailed workflow information from miyabi_def/generated/workflows.yaml.

Usage:
/miyabi-workflow W1  # Issue Creation & Triage
/miyabi-workflow W2  # Task Decomposition
/miyabi-workflow W3  # Code Implementation
/miyabi-workflow W4  # Code Review
/miyabi-workflow W5  # Deployment
```

#### `/miyabi-entity <entity_id>`
```markdown
Show entity details from miyabi_def/generated/entities.yaml.

Usage:
/miyabi-entity E1   # Issue
/miyabi-entity E3   # Agent
/miyabi-entity E12  # Worktree
```

---

## 📝 Configuration Files

### Master Orchestra Config

Create `.claude/orchestra-config.yaml`:

```yaml
# Miyabi Orchestra - Master Configuration
# Version: 3.0.0
# Integrates: miyabi_def + .claude + tmux Orchestra

miyabi_def_integration:
  enabled: true
  base_path: "/Users/shunsuke/Dev/miyabi-private/miyabi_def"

  references:
    agents: "generated/agents.yaml"
    skills: "generated/skills.yaml"
    crates: "generated/crates.yaml"
    entities: "generated/entities.yaml"
    relations: "generated/relations.yaml"
    labels: "generated/labels.yaml"
    workflows: "generated/workflows.yaml"
    world_definition: "generated/world_definition.yaml"
    step_back_method: "generated/step_back_question_method.yaml"

orchestra:
  name: "Miyabi Orchestra"
  version: "2.0.0"
  mode: "full-automation"  # full-automation | semi-automation | manual

  tmux:
    session_name: "miyabi-orchestra"
    working_directory: "/Users/shunsuke/Dev/miyabi-private"

  panes:
    conductor:
      id: "%1"
      agent: "CoordinatorAgent"
      character: "カンナ"
      role: "Orchestrator"
      skills: ["agent-execution"]

    codegen:
      id: "%2"
      agent: "CodeGenAgent"
      character: "カエデ"
      role: "Code Implementation"
      skills: ["rust-development", "agent-execution"]

    review:
      id: "%5"
      agent: "ReviewAgent"
      character: "サクラ"
      role: "Code Review"
      skills: ["security-audit", "debugging-troubleshooting"]

    pr:
      id: "%3"
      agent: "PRAgent"
      character: "ツバキ"
      role: "Pull Request Management"
      skills: ["git-workflow"]

    deploy:
      id: "%4"
      agent: "DeploymentAgent"
      character: "ボタン"
      role: "Deployment"
      skills: ["agent-execution"]

    monitor:
      id: "%6"
      agent: "WaterSpiderAgent"
      character: "クモ"
      role: "Monitoring & Message Relay"
      script: "scripts/water-spider-monitor-v2.sh"

  message_relay:
    enabled: true
    interval: 5  # seconds
    log_file: ".ai/logs/water-spider-relay.log"

    rules:
      - trigger: "カエデ|実装完了"
        target: "サクラ"
        message: "カエデが実装を完了しました。コードレビューを開始してください。"

      - trigger: "カエデ|コード完了"
        target: "サクラ"
        message: "カエデがコードを完了しました。レビューを開始してください。"

      - trigger: "サクラ|レビュー完了"
        target: "ツバキ"
        message: "サクラがレビューを完了しました。PR作成を開始してください。"

      - trigger: "サクラ|承認"
        target: "ツバキ"
        message: "サクラが承認しました。PR作成を開始してください。"

      - trigger: "ツバキ|PR作成完了"
        target: "ボタン"
        message: "ツバキがPRを作成しました。デプロイを開始してください。"

      - trigger: "ツバキ|PR完了"
        target: "ボタン"
        message: "ツバキがPR完了しました。デプロイしてください。"

  health_check:
    enabled: true
    interval: 60  # seconds
    timeout: 30   # seconds
    recovery_attempts: 3
    log_file: ".ai/logs/water-spider.log"

  voice_notification:
    enabled: true
    voicevox:
      queue_dir: "/tmp/voicevox_queue"
      speaker_mapping:
        カンナ: 3   # ずんだもん
        カエデ: 3   # ずんだもん
        サクラ: 1   # 四国めたん
        ツバキ: 8   # 春日部つむぎ
        ボタン: 14  # 冥鳴ひまり

workflows:
  # Reference to miyabi_def/generated/workflows.yaml
  definition_source: "miyabi_def/generated/workflows.yaml"

  active:
    - "W1_Issue_Creation_Triage"
    - "W2_Task_Decomposition"
    - "W3_Code_Implementation"
    - "W4_Code_Review"
    - "W5_Deployment"

labels:
  # Reference to miyabi_def/generated/labels.yaml
  definition_source: "miyabi_def/generated/labels.yaml"
  github_sync: true
  github_labels_file: ".github/labels.yml"

entities:
  # Reference to miyabi_def/generated/entities.yaml
  definition_source: "miyabi_def/generated/entities.yaml"

relations:
  # Reference to miyabi_def/generated/relations.yaml
  definition_source: "miyabi_def/generated/relations.yaml"

logging:
  level: "info"
  directory: ".ai/logs"

  files:
    orchestration: "orchestra-session-*.log"
    water_spider: "water-spider.log"
    message_relay: "water-spider-relay.log"
    session_end: "orchestra-session-end.log"

metadata:
  created_at: "2025-11-03"
  last_updated: "2025-11-03"
  version: "3.0.0"
  maintainer: "Miyabi Team"
```

---

## 📖 Using orchestra-config.yaml

### Configuration Structure

The `orchestra-config.yaml` file is the central configuration for the Miyabi Orchestra system. It defines all aspects of the orchestration including agents, workflows, message relay rules, and integrations.

#### File Location
```
/Users/shunsuke/Dev/miyabi-private/.claude/orchestra-config.yaml
```

#### Top-Level Sections

| Section | Purpose | Required |
|---------|---------|----------|
| `miyabi_def_integration` | References to miyabi_def definition files | ✅ Yes |
| `orchestra` | Core orchestration settings (tmux, panes, agents) | ✅ Yes |
| `workflows` | Active workflow definitions | ✅ Yes |
| `agents` | Agent metadata and references | ✅ Yes |
| `skills` | Skill metadata and references | ✅ Yes |
| `labels` | Label system configuration | ✅ Yes |
| `entities` | Entity definitions reference | ✅ Yes |
| `relations` | Relation definitions reference | ✅ Yes |
| `omega_system` | Ω-System integration settings | ⚠️ Optional |
| `logging` | Log file configuration | ⚠️ Optional |
| `reporting` | Report generation settings | ⚠️ Optional |
| `notifications` | Slack/Discord/Email alerts | ⚠️ Optional |
| `performance` | Metrics and thresholds | ⚠️ Optional |
| `security` | Secrets and access control | ⚠️ Optional |
| `integration` | External service integrations | ⚠️ Optional |
| `metadata` | File metadata and documentation | ⚠️ Optional |

---

### Common Configuration Tasks

#### Task 1: Add a New Agent Pane

To add a new agent to the Orchestra:

```yaml
orchestra:
  panes:
    # ... existing panes ...

    issue:
      id: "%7"
      agent_id: "agents.coding[3]"
      agent: "IssueAgent"
      character: "スミレ"
      emoji: "📋"
      role: "Issue Analysis"
      skills:
        - "issue-analysis"
      responsibilities:
        - "Issue triage"
        - "Label inference"
        - "Priority assessment"
```

**Steps**:
1. Choose a unique pane ID (e.g., `%7`)
2. Reference the agent from miyabi_def (`agent_id`)
3. Assign character name and emoji
4. List applicable skills
5. Define responsibilities

**Activate in tmux**:
```bash
# Split new pane
tmux split-window -h

# Start Claude Code
cd /Users/shunsuke/Dev/miyabi-private && cc

# Identify pane ID
tmux list-panes -F "#{pane_id}: #{pane_current_command}"
```

---

#### Task 2: Configure Message Relay Rules

Add automatic message forwarding between agents:

```yaml
orchestra:
  message_relay:
    rules:
      # ... existing rules ...

      - id: "R8"
        trigger_agent: "スミレ"
        trigger_keyword: "トリアージ完了"
        target_agent: "カンナ"
        message: "スミレがIssueトリアージを完了しました。タスク分解を開始してください。"
        workflow_stage: "W1 → W2"
```

**Rule Parameters**:
- `id`: Unique rule identifier (R1, R2, ...)
- `trigger_agent`: Character name of triggering agent
- `trigger_keyword`: Keyword to detect (supports regex via `|`)
- `target_agent`: Character name of target agent
- `message`: Message to relay (shown to target agent)
- `workflow_stage`: Workflow transition (optional)

**Testing**:
```bash
# Test message relay manually
tmux send-keys -t %7 '[スミレ] トリアージ完了' Enter

# Watch Water Spider logs
tail -f .ai/logs/water-spider-relay.log
```

---

#### Task 3: Customize Health Check Settings

Adjust agent health monitoring:

```yaml
orchestra:
  health_check:
    enabled: true
    interval: 30  # Check every 30 seconds (default: 60)
    timeout: 15   # Wait 15 seconds for response (default: 30)
    recovery_attempts: 5  # Try 5 times before escalation (default: 3)
    log_file: ".ai/logs/water-spider.log"

    methods:
      - type: "ping"
        message: "[{agent}] ping応答OK と発言してください。（15秒以内）"
        expected_response: "ping応答OK"

      - type: "session_alive"
        check: "Claude Code session is active"
        indicator: "bypass permissions"
```

**Recommended Settings by Use Case**:

| Use Case | Interval | Timeout | Recovery Attempts |
|----------|----------|---------|-------------------|
| **Development** | 60s | 30s | 3 |
| **Production** | 30s | 15s | 5 |
| **Long-running Tasks** | 120s | 60s | 2 |

---

#### Task 4: Enable VOICEVOX Voice Notifications

Configure audio notifications for agent events:

```yaml
orchestra:
  voice_notification:
    enabled: true

    voicevox:
      queue_dir: "/tmp/voicevox_queue"

      speaker_mapping:
        カンナ: 3   # ずんだもん（ノーマル）
        カエデ: 3   # ずんだもん（ノーマル）
        サクラ: 1   # 四国めたん（ノーマル）
        ツバキ: 8   # 春日部つむぎ（ノーマル）
        ボタン: 14  # 冥鳴ひまり（ノーマル）
        スミレ: 10  # 九州そら（ノーマル）

      events:
        - event: "task_complete"
          template: "{agent}が{task}を完了したのだ！"
          priority: "high"

        - event: "error"
          template: "{agent}でエラーが発生したのだ！確認してほしいのだ！"
          priority: "critical"

        - event: "relay"
          template: "{from_agent}から{to_agent}へメッセージを転送したのだ。"
          priority: "medium"
```

**VOICEVOX Speaker IDs**:
- 0: 四国めたん（あまあま）
- 1: 四国めたん（ノーマル）
- 3: ずんだもん（ノーマル）
- 8: 春日部つむぎ（ノーマル）
- 10: 九州そら（ノーマル）
- 14: 冥鳴ひまり（ノーマル）

**Prerequisites**:
```bash
# Install VOICEVOX Engine
# Download from https://voicevox.hiroshiba.jp/

# Start VOICEVOX Engine
./voicevox-engine

# Verify it's running
curl http://localhost:50021/version
```

---

#### Task 5: Configure Logging and Reporting

Set up detailed logging for debugging and auditing:

```yaml
logging:
  level: "debug"  # debug | info | warning | error
  directory: ".ai/logs"

  files:
    orchestration: "orchestra-session-*.log"
    water_spider: "water-spider.log"
    message_relay: "water-spider-relay.log"
    session_end: "orchestra-session-end.log"
    session_start: "orchestra-session-start.log"

  rotation:
    enabled: true
    max_size: "50MB"  # Rotate when file exceeds this size
    max_files: 60     # Keep last 60 files (2 months of daily logs)

reporting:
  enabled: true

  daily_report:
    enabled: true
    time: "23:59"
    output: ".ai/reports/daily-{date}.md"

    include:
      - "task_completion_rate"
      - "agent_uptime"
      - "error_count"
      - "message_relay_count"
      - "average_response_time"

  session_report:
    enabled: true
    on_events:
      - "session_end"
      - "task_complete"
      - "error_threshold_exceeded"

    template: ".ai/templates/session-report-template.md"
```

**Log Levels**:
- `debug`: All messages (verbose, for development)
- `info`: Important events (default, for production)
- `warning`: Warnings and errors only
- `error`: Errors only (minimal logging)

---

#### Task 6: Set Performance Thresholds

Configure alerts for performance degradation:

```yaml
performance:
  metrics:
    enabled: true
    collection_interval: 30  # Collect every 30 seconds

    track:
      - "agent_response_time"
      - "task_completion_time"
      - "error_rate"
      - "recovery_success_rate"
      - "message_relay_count"
      - "token_usage"

  thresholds:
    max_agent_response_time: 180  # Alert if agent takes >3 minutes
    max_task_completion_time: 1800  # Alert if task takes >30 minutes
    max_error_rate: 0.05  # Alert if error rate exceeds 5%
    min_recovery_success_rate: 0.9  # Alert if recovery success <90%
    max_token_usage_per_hour: 100000  # Alert if usage exceeds limit

  alerts:
    enabled: true
    channels:
      - "slack"
      - "discord"
      - "log"
```

**Recommended Thresholds**:

| Metric | Development | Production | Critical Tasks |
|--------|-------------|------------|----------------|
| Agent Response Time | 300s | 180s | 60s |
| Task Completion Time | 3600s | 1800s | 600s |
| Error Rate | 10% | 5% | 1% |
| Recovery Success Rate | 80% | 90% | 95% |

---

### Configuration Examples

#### Example 1: Minimal Configuration (Development)

For local development with minimal features:

```yaml
miyabi_def_integration:
  enabled: true
  base_path: "/Users/shunsuke/Dev/miyabi-private/miyabi_def"
  references:
    agents: "generated/agents.yaml"
    skills: "generated/skills.yaml"

orchestra:
  name: "Miyabi Orchestra (Dev)"
  version: "2.0.0"
  mode: "manual"

  tmux:
    session_name: "miyabi-dev"
    working_directory: "/Users/shunsuke/Dev/miyabi-private"

  panes:
    conductor:
      id: "%1"
      agent: "CoordinatorAgent"
      character: "カンナ"
      skills: ["agent-execution"]

    codegen:
      id: "%2"
      agent: "CodeGenAgent"
      character: "カエデ"
      skills: ["rust-development"]

  message_relay:
    enabled: false

  health_check:
    enabled: false

  voice_notification:
    enabled: false

logging:
  level: "info"
  directory: ".ai/logs"
```

---

#### Example 2: Full Production Configuration

For production deployment with all features:

```yaml
miyabi_def_integration:
  enabled: true
  base_path: "/Users/shunsuke/Dev/miyabi-private/miyabi_def"
  references:
    agents: "generated/agents.yaml"
    skills: "generated/skills.yaml"
    entities: "generated/entities.yaml"
    relations: "generated/relations.yaml"
    labels: "generated/labels.yaml"
    workflows: "generated/workflows.yaml"

orchestra:
  name: "Miyabi Orchestra (Production)"
  version: "2.0.0"
  mode: "full-automation"

  tmux:
    session_name: "miyabi-prod"
    working_directory: "/Users/shunsuke/Dev/miyabi-private"

  panes:
    conductor:
      id: "%1"
      agent: "CoordinatorAgent"
      character: "カンナ"
      skills: ["agent-execution"]
      responsibilities:
        - "Overall orchestration"
        - "Task distribution"
        - "Progress monitoring"

    codegen:
      id: "%2"
      agent: "CodeGenAgent"
      character: "カエデ"
      skills: ["rust-development", "agent-execution"]

    review:
      id: "%5"
      agent: "ReviewAgent"
      character: "サクラ"
      skills: ["security-audit", "debugging-troubleshooting"]

    pr:
      id: "%3"
      agent: "PRAgent"
      character: "ツバキ"
      skills: ["git-workflow"]

    deploy:
      id: "%4"
      agent: "DeploymentAgent"
      character: "ボタン"
      skills: ["agent-execution"]

    monitor:
      id: "%6"
      agent: "WaterSpiderAgent"
      character: "クモ"
      script: "scripts/water-spider-monitor-v2.sh"

  message_relay:
    enabled: true
    interval: 5
    log_file: ".ai/logs/water-spider-relay.log"
    rules:
      - id: "R1"
        trigger_agent: "カエデ"
        trigger_keyword: "実装完了"
        target_agent: "サクラ"
        message: "カエデが実装を完了しました。コードレビューを開始してください。"

  health_check:
    enabled: true
    interval: 30
    timeout: 15
    recovery_attempts: 5

  voice_notification:
    enabled: true
    voicevox:
      queue_dir: "/tmp/voicevox_queue"

logging:
  level: "info"
  directory: ".ai/logs"
  rotation:
    enabled: true
    max_size: "50MB"
    max_files: 60

reporting:
  enabled: true
  daily_report:
    enabled: true
    time: "23:59"

performance:
  metrics:
    enabled: true
    collection_interval: 30
  thresholds:
    max_agent_response_time: 180
    max_error_rate: 0.05

notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
  discord:
    enabled: true
    webhook_url: "${DISCORD_WEBHOOK_URL}"
```

---

### Validation and Testing

#### Validate YAML Syntax

Before using the configuration, validate the YAML syntax:

```bash
# Using Python
python -c "import yaml; yaml.safe_load(open('.claude/orchestra-config.yaml'))" && echo "✅ Valid YAML"

# Using yamllint (install: pip install yamllint)
yamllint .claude/orchestra-config.yaml

# Using yq (install: brew install yq)
yq eval .claude/orchestra-config.yaml > /dev/null && echo "✅ Valid YAML"
```

#### Test Configuration Loading

Verify Water Spider loads the configuration correctly:

```bash
# Check if Water Spider references the config
grep -n "orchestra-config.yaml" scripts/water-spider-monitor-v2.sh

# Start Water Spider and check logs
./scripts/water-spider-monitor-v2.sh &
tail -f .ai/logs/water-spider.log | grep -i "config"
```

#### Verify Agent Settings

Test agent configuration is correctly applied:

```bash
# Extract specific agent configuration
yq eval '.orchestra.panes.codegen' .claude/orchestra-config.yaml

# List all configured agents
yq eval '.orchestra.panes | keys' .claude/orchestra-config.yaml

# Check message relay rules
yq eval '.orchestra.message_relay.rules[]' .claude/orchestra-config.yaml
```

---

### Best Practices

#### 1. Version Control
Always commit `orchestra-config.yaml` to Git:
```bash
git add .claude/orchestra-config.yaml
git commit -m "config: update orchestra configuration"
```

#### 2. Environment-Specific Configs
Use environment variables for sensitive data:
```yaml
security:
  api_keys:
    github_token: "${GITHUB_TOKEN}"
    anthropic_api_key: "${ANTHROPIC_API_KEY}"

notifications:
  slack:
    webhook_url: "${SLACK_WEBHOOK_URL}"
```

#### 3. Comments for Clarity
Add comments to explain non-obvious settings:
```yaml
orchestra:
  message_relay:
    interval: 5  # Check every 5 seconds for performance
    # Note: Lower values increase CPU usage but improve responsiveness
```

#### 4. Backup Before Changes
Always backup before making major changes:
```bash
cp .claude/orchestra-config.yaml .claude/orchestra-config.yaml.backup
```

#### 5. Test Changes in Development
Test configuration changes in a separate dev session:
```bash
# Create dev config
cp .claude/orchestra-config.yaml .claude/orchestra-config-dev.yaml

# Edit dev config
vim .claude/orchestra-config-dev.yaml

# Test with dev config
tmux new-session -s miyabi-dev
# ... load dev config in agents
```

---

### Related Documentation

- **Configuration File**: `.claude/orchestra-config.yaml`
- **Water Spider Script**: `scripts/water-spider-monitor-v2.sh`
- **Agent Specifications**: `.claude/agents/specs/`
- **Skills**: `.claude/Skills/`
- **miyabi_def Documentation**: `miyabi_def/README.md`

---

## 🚀 Quick Start with Full Integration

### Step 1: Verify miyabi_def Setup

```bash
cd /Users/shunsuke/Dev/miyabi-private/miyabi_def

# Verify all generated files exist
ls -lh generated/

# Expected files:
# - agents.yaml (21 agents)
# - skills.yaml (18 skills)
# - crates.yaml (15 crates)
# - entities.yaml (14 entities)
# - relations.yaml (39 relations)
# - labels.yaml (57 labels)
# - workflows.yaml (5 workflows)
# - world_definition.yaml
# - step_back_question_method.yaml
```

### Step 2: Start Orchestra with Full Integration

```bash
cd /Users/shunsuke/Dev/miyabi-private

# Create new tmux session
tmux new-session -s miyabi-orchestra

# Launch all agents in parallel
./scripts/orchestra-start-all.sh

# Launch Water Spider v2.0
tmux split-window -v
./scripts/water-spider-monitor-v2.sh
```

### Step 3: Verify Integration

Within any Claude Code session:

```
Read the orchestra configuration:
/Users/shunsuke/Dev/miyabi-private/.claude/orchestra-config.yaml

Verify agents match miyabi_def:
/Users/shunsuke/Dev/miyabi-private/miyabi_def/generated/agents.yaml

Check all skills are available:
Skill tool with command "rust-development"
Skill tool with command "agent-execution"
```

---

## 📊 Integration Verification Checklist

### ✅ Phase 1: Definition Files
- [ ] All 11 miyabi_def generated files exist
- [ ] `.claude/orchestra-config.yaml` created
- [ ] `.claude/MIYABI_ORCHESTRA_INTEGRATION.md` created

### ✅ Phase 2: Agent Integration
- [ ] 21 agents documented with character names
- [ ] Agent → Skill mappings verified
- [ ] Agent → miyabi_def ID mappings confirmed
- [ ] Water Spider aware of all agents

### ✅ Phase 3: Skill Integration
- [ ] All 18 skills accessible via `Skill tool`
- [ ] Skill → Agent mappings documented
- [ ] Skills referenced in orchestra-config.yaml

### ✅ Phase 4: Workflow Integration
- [ ] 5 workflows (W1-W5, 38 stages) referenced
- [ ] Workflow → Agent mappings defined
- [ ] State transitions mapped to labels

### ✅ Phase 5: Entity-Relation Integration
- [ ] 14 entities documented
- [ ] 39 relations with N1/N2/N3 notation
- [ ] Crate → Entity mappings verified

### ✅ Phase 6: Label Integration
- [ ] 57 labels across 11 categories
- [ ] GitHub labels sync configured
- [ ] Label → Workflow state mappings

### ✅ Phase 7: Ω-System Integration
- [ ] World Definition (13 dimensions) referenced
- [ ] Step-back Method (26 steps) documented
- [ ] Ω-function mapped to task execution

---

## 🎯 Usage Examples

### Example 1: Full Automated Workflow

```bash
# In Conductor pane (%1)
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270を実装してください。agent-executionスキルを使用し、完了したら [カエデ] 実装完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**Expected Flow** (fully automated by Water Spider):
1. カエデ implements Issue #270
2. カエデ outputs "[カエデ] 実装完了"
3. Water Spider detects keyword
4. Water Spider sends message to サクラ
5. サクラ starts code review automatically
6. サクラ outputs "[サクラ] レビュー完了"
7. Water Spider detects keyword
8. Water Spider sends message to ツバキ
9. ツバキ creates PR automatically
10. ... continues automatically

### Example 2: Query miyabi_def Data

```
Read agent definition:
/Users/shunsuke/Dev/miyabi-private/miyabi_def/generated/agents.yaml

Show me all Coding Agents

Expected output:
- CoordinatorAgent (カンナ)
- CodeGenAgent (カエデ)
- ReviewAgent (サクラ)
- IssueAgent (スミレ)
- PRAgent (ツバキ)
- DeploymentAgent (ボタン)
- RefresherAgent (アサガオ)
```

### Example 3: Skill Execution with miyabi_def Reference

```
Execute rust-development skill (reference: miyabi_def/generated/skills.yaml#skills.development[0])

Skill tool with command "rust-development"
```

---

## 🔧 Maintenance

### Update miyabi_def Definitions

```bash
cd /Users/shunsuke/Dev/miyabi-private/miyabi_def

# Edit variable files
vim variables/agents.yaml

# Regenerate all definitions
python generate.py

# Verify changes
git diff generated/
```

### Update Orchestra Configuration

```bash
cd /Users/shunsuke/Dev/miyabi-private/.claude

# Edit orchestra config
vim orchestra-config.yaml

# Restart Water Spider to apply changes
tmux send-keys -t %6 C-c
tmux send-keys -t %6 "./scripts/water-spider-monitor-v2.sh" Enter
```

---

## 📚 Related Documentation

- **miyabi_def Index**: `miyabi_def/INDEX.yaml`
- **miyabi_def README**: `miyabi_def/README.md`
- **Water Spider v2**: `.ai/reports/water-spider-v2-implementation-report.md`
- **Orchestra Test Results**: `.ai/reports/orchestra-test-results-2025-11-03.md`
- **Improvement Ideas**: `.ai/reports/orchestra-improvement-ideas.md`
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md`
- **Label System**: `docs/LABEL_SYSTEM_GUIDE.md`
- **Agent Specs**: `.claude/agents/specs/`
- **Skills**: `.claude/Skills/`

---

## 🎉 Benefits of Full Integration

### 1. **Single Source of Truth**
All definitions centralized in `miyabi_def/`, referenced by Orchestra

### 2. **Automatic Synchronization**
Changes in miyabi_def automatically reflected in Orchestra via YAML references

### 3. **Complete Traceability**
Every agent, skill, workflow traced back to miyabi_def ID

### 4. **Scalability**
Easy to add new agents/skills - just update miyabi_def and regenerate

### 5. **Documentation**
Self-documenting system via structured YAML

### 6. **Type Safety**
YAML schemas ensure consistency

### 7. **Ω-System Integration**
World Definition and Step-back Method provide theoretical foundation

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Problem 1: tmux Panes Not Responding

**Symptoms**: Agent panes freeze or don't respond to commands

**Possible Causes**:
- LLM processing long task
- Network connectivity issue
- Token limit reached
- Agent crashed

**Solutions**:
```bash
# Check pane status
tmux capture-pane -t %2 -p | tail -20

# Send Enter to wake up
tmux send-keys -t %2 Enter

# Restart Claude Code if needed
tmux send-keys -t %2 C-c
tmux send-keys -t %2 "cc" Enter

# Check if pane is alive
tmux list-panes -F "#{pane_id}: #{pane_current_command}"
```

---

#### Problem 2: Pane IDs Changed After Restart

**Symptoms**: Commands fail with "can't find pane %2"

**Cause**: tmux assigns new pane IDs after session restart

**Solution**:
```bash
# Always verify current pane IDs
tmux list-panes -F "#{pane_index}: #{pane_id}"

# Update your commands with actual IDs
# Example output:
# 0: %22  ← Conductor
# 1: %27  ← CodeGen
# 2: %28  ← Review
```

**Best Practice**: Use pane index (0, 1, 2...) instead of pane ID when possible:
```bash
# Instead of: tmux send-keys -t %2 "command" Enter
# Use: tmux send-keys -t 1 "command" Enter
```

---

#### Problem 3: Water Spider Not Detecting Messages

**Symptoms**: Agents complete tasks but Water Spider doesn't relay messages

**Possible Causes**:
- Keyword pattern mismatch
- Water Spider not running
- Incorrect pane ID configuration

**Solutions**:
```bash
# Check if Water Spider is running
ps aux | grep water-spider

# Verify message relay rules in orchestra-config.yaml
cat .claude/orchestra-config.yaml | grep -A 3 "message_relay:"

# Check Water Spider logs
tail -f .ai/logs/water-spider-relay.log

# Restart Water Spider
tmux send-keys -t %6 C-c
tmux send-keys -t %6 "./scripts/water-spider-monitor-v2.sh" Enter
```

**Common Keyword Issues**:
```bash
# Agent must use exact keywords defined in orchestra-config.yaml
# ✅ Correct: "[カエデ] 実装完了"
# ❌ Wrong:   "カエデ: 実装が完了しました"
```

---

#### Problem 4: miyabi_def Files Not Found

**Symptoms**: `FileNotFoundError` when accessing miyabi_def YAML files

**Cause**: miyabi_def not initialized or path incorrect

**Solutions**:
```bash
# Verify miyabi_def structure
cd /Users/shunsuke/Dev/miyabi-private/miyabi_def
ls -lh generated/

# Expected files (9 files):
# agents.yaml
# skills.yaml
# crates.yaml
# entities.yaml
# relations.yaml
# labels.yaml
# workflows.yaml
# world_definition.yaml
# step_back_question_method.yaml

# Regenerate if missing
python generate.py
```

---

#### Problem 5: Skill Execution Fails

**Symptoms**: `Skill tool with command "xxx"` returns error

**Possible Causes**:
- Skill directory not found
- Skill PROMPT.md missing
- Permission denied

**Solutions**:
```bash
# Verify skill directory exists
ls -lh .claude/Skills/rust-development/

# Check PROMPT.md exists
cat .claude/Skills/rust-development/PROMPT.md

# List all available skills
ls -d .claude/Skills/*/

# Check permissions
chmod -R 755 .claude/Skills/
```

---

#### Problem 6: Agent Reports Not Reaching Conductor

**Symptoms**: Agents complete tasks but Conductor doesn't receive reports

**Cause**: Incorrect target pane ID in agent instructions

**Solution**:
```bash
# Verify Conductor pane ID
tmux list-panes -F "#{pane_index}: #{pane_id} (#{pane_current_command})"

# Update agent instruction with correct Conductor pane ID
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && \
あなたは「カエデ」です。完了後は以下で報告：
tmux send-keys -t %1 '[カエデ] 完了' && sleep 0.1 && tmux send-keys -t %1 Enter" Enter
```

---

#### Problem 7: Orchestra Config Not Loaded

**Symptoms**: Water Spider ignores message relay rules

**Cause**: `orchestra-config.yaml` syntax error or not loaded

**Solutions**:
```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('.claude/orchestra-config.yaml'))"

# Check for syntax errors
yamllint .claude/orchestra-config.yaml

# Verify config is loaded by Water Spider
grep "orchestra-config.yaml" scripts/water-spider-monitor-v2.sh
```

---

#### Problem 8: tmux Session Lost After Disconnect

**Symptoms**: SSH disconnect causes session loss

**Solution**:
```bash
# Always use tmux for persistent sessions
tmux new-session -s miyabi-orchestra

# Detach safely (Ctrl-a + d in Kamui setup)
# Or: tmux detach-client

# Reattach later
tmux attach-session -t miyabi-orchestra

# List all sessions
tmux list-sessions
```

---

#### Problem 9: High Token Consumption

**Symptoms**: API costs increase rapidly

**Causes**:
- Long conversation history
- Large file reads
- Repetitive context

**Solutions**:
```bash
# Clear agent context regularly
tmux send-keys -t %2 "/clear" Enter

# Use haiku model for simple tasks
# (Configure in orchestra-config.yaml)

# Limit file reading scope
# Instead of: Read entire 10000-line file
# Use: Read specific line range (offset + limit)
```

---

#### Problem 10: VOICEVOX Voice Notifications Not Working

**Symptoms**: No audio notifications despite enabled in config

**Solutions**:
```bash
# Check VOICEVOX Engine is running
curl http://localhost:50021/version

# Verify queue directory
ls -lh /tmp/voicevox_queue/

# Check speaker ID in orchestra-config.yaml
cat .claude/orchestra-config.yaml | grep -A 10 "speaker_mapping"

# Test VOICEVOX manually
echo "テスト音声" | voicevox --speaker 3
```

---

### Debugging Commands

```bash
# Monitor all agent outputs in real-time
watch -n 2 'for pane in %1 %2 %5 %3 %4; do \
    echo "=== Pane $pane ==="; \
    tmux capture-pane -t $pane -p | tail -3; \
    echo ""; \
done'

# Check agent health status
./scripts/water-spider-monitor-v2.sh --health-check

# View complete session history
tmux capture-pane -t %2 -S - -p > /tmp/agent-history.txt
cat /tmp/agent-history.txt

# Export orchestra state
tmux list-panes -a > .ai/logs/orchestra-state.log
```

---

### Recovery Procedures

#### Full Orchestra Restart

```bash
# 1. Save current work
for pane in %1 %2 %5 %3 %4; do
    tmux capture-pane -t $pane -p > ".ai/logs/backup-pane-${pane}.log"
done

# 2. Kill all agents
tmux send-keys -t %2 C-c
tmux send-keys -t %5 C-c
tmux send-keys -t %3 C-c
tmux send-keys -t %4 C-c

# 3. Restart Claude Code instances
tmux send-keys -t %2 "cc" Enter
tmux send-keys -t %5 "cc" Enter
tmux send-keys -t %3 "cc" Enter
tmux send-keys -t %4 "cc" Enter

# 4. Restart Water Spider
tmux send-keys -t %6 C-c
tmux send-keys -t %6 "./scripts/water-spider-monitor-v2.sh" Enter
```

---

### Getting Help

If issues persist:

1. **Check Logs**:
   ```bash
   tail -f .ai/logs/water-spider.log
   tail -f .ai/logs/orchestra-session-*.log
   ```

2. **Review Documentation**:
   - [TMUX_OPERATIONS.md](.claude/TMUX_OPERATIONS.md)
   - [CODEX_TMUX_PARALLEL_EXECUTION.md](.claude/CODEX_TMUX_PARALLEL_EXECUTION.md)
   - [KAMUI_TMUX_GUIDE.md](.claude/KAMUI_TMUX_GUIDE.md)

3. **Report Issues**:
   - Create GitHub Issue with:
     - Error messages
     - Agent logs
     - tmux configuration
     - Steps to reproduce

---

## 📖 Glossary

### Core Concepts

#### Agent
**Definition**: An autonomous AI entity that performs specific tasks within the Miyabi Orchestra system.

**Types**:
- **Coding Agents (7)**: Handle software development tasks
  - CoordinatorAgent (カンナ): Orchestrates overall workflow
  - CodeGenAgent (カエデ): Generates code implementation
  - ReviewAgent (サクラ): Performs code quality review
  - IssueAgent (スミレ): Analyzes and triages Issues
  - PRAgent (ツバキ): Manages Pull Requests
  - DeploymentAgent (ボタン): Handles deployment operations
  - RefresherAgent (アサガオ): Monitors and refreshes Issue states

- **Business Agents (14)**: Handle business operations
  - Strategy & Planning (6): AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
  - Marketing (5): MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
  - Sales & CRM (3): Sales, CRM, Analytics

**Reference**: `miyabi_def/generated/agents.yaml`

---

#### Skill
**Definition**: A reusable capability that Agents can invoke to perform specific operations.

**Categories**:
1. **Development Skills (5)**:
   - `rust-development`: Comprehensive Rust workflow (build, test, clippy, fmt)
   - `debugging-troubleshooting`: Systematic debugging for Rust
   - `dependency-management`: Cargo dependency updates
   - `performance-analysis`: Profiling and benchmarking
   - `security-audit`: Security scanning and vulnerability detection

2. **Operations Skills (5)**:
   - `agent-execution`: Execute Miyabi Agents
   - `git-workflow`: Automated Git operations
   - `documentation-generation`: Generate docs from Entity-Relation Model
   - `issue-analysis`: Analyze Issues and infer labels
   - `project-setup`: Initialize new Miyabi projects

3. **Business Skills (5)**:
   - `business-strategy-planning`: Business plan & strategy
   - `content-marketing-strategy`: Content & SNS strategy
   - `market-research-analysis`: Market research (20+ companies)
   - `sales-crm-management`: Sales & customer management
   - `growth-analytics-dashboard`: KPI tracking & PDCA cycle

4. **Specialized Skills (3)**:
   - `voicevox`: VOICEVOX voice synthesis integration
   - `lark-integration`: Lark (Feishu) integration (planned)
   - `knowledge-search`: Qdrant-based knowledge search (planned)

**Usage**: `Skill tool with command "rust-development"`

**Reference**: `miyabi_def/generated/skills.yaml`

---

#### Entity
**Definition**: A core data structure in the Miyabi system representing a domain concept.

**14 Core Entities (E1-E14)**:
- **E1 (Issue)**: GitHub Issue representing a task or problem
- **E2 (Task)**: Decomposed unit of work from an Issue
- **E3 (Agent)**: Autonomous AI entity
- **E4 (PullRequest)**: GitHub Pull Request
- **E5 (Label)**: Categorization tag (57 labels across 11 categories)
- **E6 (QualityReport)**: Code quality assessment report
- **E7 (Command)**: Executable command or instruction
- **E8 (Escalation)**: Escalation event requiring Guardian intervention
- **E9 (Deployment)**: Deployment operation record
- **E10 (LDDLog)**: LDD (Log-Driven Development) log entry
- **E11 (DAG)**: Directed Acyclic Graph for task dependencies
- **E12 (Worktree)**: Git worktree for isolated development
- **E13 (DiscordCommunity)**: Discord community integration
- **E14 (SubIssue)**: Hierarchical sub-Issue

**Reference**: `miyabi_def/generated/entities.yaml`

---

#### Relation
**Definition**: A typed connection between two Entities defining their relationship.

**Cardinality Types**:
- **N1 (1:1)**: One-to-one relationship
  - Example: E4 (PR) → E9 (Deployment)
- **N2 (1:N)**: One-to-many relationship
  - Example: E1 (Issue) → E2 (Task)
- **N3 (N:N)**: Many-to-many relationship
  - Example: E3 (Agent) → E7 (Command)

**Total**: 39 Relations (R1-R39)

**Implemented**: 22 Relations actively used in Orchestra v2.0

**Reference**: `miyabi_def/generated/relations.yaml`

**Implementation**: See [Relations Implementation Mapping](#relations-implementation-mapping) section

---

#### miyabi_def
**Definition**: A centralized definition system for all Miyabi components using YAML files.

**Purpose**:
- Single source of truth for all definitions
- Enables automatic synchronization across components
- Provides structured, machine-readable specifications

**Structure**:
```
miyabi_def/
├── INDEX.yaml              # Master index
├── generated/              # Generated YAML definitions (11 files)
│   ├── agents.yaml         # 21 Agents
│   ├── skills.yaml         # 18 Skills
│   ├── crates.yaml         # 15 Crates
│   ├── entities.yaml       # 14 Entities
│   ├── relations.yaml      # 39 Relations
│   ├── labels.yaml         # 57 Labels
│   ├── workflows.yaml      # 5 Workflows (38 stages)
│   ├── world_definition.yaml    # Ω-System World (13 dimensions)
│   ├── step_back_question_method.yaml  # 26-step process
│   ├── universal_task_execution.yaml
│   └── agent_execution_maximization.yaml
├── variables/              # YAML variable files
└── templates/              # Jinja2 templates
```

**Location**: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/`

**Usage**: Referenced by `orchestra-config.yaml` via `definition_source` fields

---

#### Orchestra
**Definition**: The orchestration system that coordinates multiple Claude Code instances running in tmux panes.

**Architecture**:
- **Conductor Pane (%1)**: CoordinatorAgent (カンナ) - Overall orchestration
- **Worker Panes (%2, %5, %3, %4)**: Specialist Agents
- **Monitor Pane (%6)**: Water Spider Agent (クモ) - Health monitoring & message relay

**Modes**:
- **full-automation**: Agents operate autonomously with minimal human intervention
- **semi-automation**: Agents require approval for critical operations
- **manual**: Agents execute only when explicitly instructed

**Configuration**: `.claude/orchestra-config.yaml`

---

#### tmux
**Definition**: Terminal multiplexer enabling multiple shell sessions within a single terminal window.

**Miyabi Usage**:
- Run multiple Claude Code instances in parallel
- Isolate Agent workspaces
- Enable message passing between Agents
- Provide persistent sessions (survive SSH disconnects)

**Key Concepts**:
- **Session**: Top-level container (e.g., `miyabi-orchestra`)
- **Window**: Tab within a session
- **Pane**: Split viewport within a window (identified by %N or index)

**Commands**:
```bash
# Create session
tmux new-session -s miyabi-orchestra

# Split pane
tmux split-window -h

# Send command to pane
tmux send-keys -t %2 "command" Enter

# List panes
tmux list-panes -F "#{pane_id}: #{pane_current_command}"
```

**Guide**: [TMUX_QUICKSTART.md](../docs/TMUX_QUICKSTART.md)

---

#### Water Spider
**Definition**: A monitoring agent that watches all Orchestra panes and automatically relays messages between Agents.

**Functions**:
1. **Health Check**: Ping Agents every 60 seconds to verify they're alive
2. **Message Relay**: Detect keywords and forward messages to target Agents
3. **Auto-Recovery**: Restart crashed Agents automatically
4. **Logging**: Record all events to `.ai/logs/water-spider.log`

**Name Origin**: "Water Spider" (水蜘蛛 - mizugumo) from Toyota Production System - a role that ensures smooth flow of work

**Implementation**: `scripts/water-spider-monitor-v2.sh`

**Configuration**: `orchestra-config.yaml` → `message_relay` & `health_check` sections

---

#### Workflow
**Definition**: A structured sequence of stages that guide the progression of work from Issue creation to deployment.

**5 Core Workflows (W1-W5)**:
- **W1: Issue Creation & Triage** (8 stages)
  - Issue Created → Initial Triage → Label Assignment → Priority Assessment → Agent Assignment → Escalation Check → SubIssue Creation → Ready for Decomposition

- **W2: Task Decomposition** (7 stages)
  - Analyze Issue → Identify Sub-Tasks → Create Task DAG → Assign Dependencies → Estimate Effort → Allocate Resources → Tasks Ready

- **W3: Code Implementation** (9 stages)
  - Task Started → Worktree Created → Code Generation → Unit Tests → Integration Tests → Code Quality Check → Documentation → Commit → Implementation Complete

- **W4: Code Review** (8 stages)
  - Review Requested → Automated Checks → Security Scan → Performance Analysis → Human Review → Feedback Integration → Re-Review → Review Approved

- **W5: Deployment** (6 stages)
  - PR Created → CI/CD Pipeline → Staging Deploy → Verification → Production Deploy → Monitoring

**Total Stages**: 38 across 5 workflows

**Reference**: `miyabi_def/generated/workflows.yaml`

---

#### Label
**Definition**: A categorization tag applied to Issues and PRs to indicate state, priority, type, and other metadata.

**57 Labels across 11 Categories**:
1. **STATE (8)**: Lifecycle management (pending, analyzing, implementing, reviewing, done, blocked, failed, paused)
2. **AGENT (6)**: Agent assignment (coordinator, codegen, review, issue, pr, deployment)
3. **PRIORITY (4)**: Priority management (P0-Critical, P1-High, P2-Medium, P3-Low)
4. **TYPE (7)**: Issue classification (feature, bug, refactor, docs, test, perf, chore)
5. **SEVERITY (4)**: Severity/Escalation (Sev.1-Critical, Sev.2-High, Sev.3-Medium, Sev.4-Low)
6. **PHASE (5)**: Project phase (planning, development, testing, deployment, maintenance)
7. **SPECIAL (7)**: Special operations (hotfix, security, breaking, experimental, deprecated, needs-discussion, blocked)
8. **TRIGGER (4)**: Automation triggers (auto-escalate, auto-decompose, auto-deploy, auto-close)
9. **QUALITY (4)**: Quality score (passed, warning, failed, pending)
10. **COMMUNITY (4)**: Community (question, discussion, feedback, contribution)
11. **HIERARCHY (4)**: Issue hierarchy (parent, child, dependency, blocker)

**Reference**: `miyabi_def/generated/labels.yaml`

**GitHub Sync**: `.github/labels.yml`

---

#### Ω-System (Omega System)
**Definition**: A theoretical framework providing mathematical foundations for universal task execution.

**Components**:

1. **World Definition (13 Dimensions)**:
   ```
   Ψ(W) = ∫[t₀→t₁] ∇(s, c, r, e) dt
   ```
   - Temporal, Spatial, Contextual, Resources, Environmental, State Management, Integration, Evolution, Governance, Observability, Scalability, Extensibility, Roadmap

2. **Ω-Function**:
   ```
   Ω: I × W → R
   ```
   - **I**: Input (Issue, Task, Context)
   - **W**: World (Environment state)
   - **R**: Result (Completed task, artifacts)

3. **Step-back Question Method (26 steps, A-Z)**:
   ```
   F(Goal, Q) = ∫_{A}^{Z} f(step, Q) d(step) = Result
   ```
   - Systematic approach from Analysis (A) to Zero-in (Z)
   - Quality improvement: 1.5~2.0x
   - Error reduction: 40-60%

**Reference**:
- `miyabi_def/generated/world_definition.yaml`
- `miyabi_def/generated/step_back_question_method.yaml`

---

#### Worktree
**Definition**: A Git feature allowing multiple working directories from a single repository.

**Miyabi Usage**:
- Isolate Agent workspaces
- Enable parallel task execution without conflicts
- Prevent branch switching interference

**Lifecycle**:
1. **Create**: `git worktree add .worktrees/issue-270 -b issue-270`
2. **Work**: Agent operates in isolated directory
3. **Cleanup**: `git worktree remove .worktrees/issue-270`

**Management**: `miyabi-worktree` crate

**Entity**: E12 (Worktree)

---

#### VOICEVOX
**Definition**: Open-source text-to-speech synthesis engine with multiple character voices.

**Miyabi Integration**:
- Voice notifications for Agent events
- Character-specific voices for each Agent
- Queue-based asynchronous processing

**Speaker Mapping**:
- カンナ (Conductor): Speaker 3 (ずんだもん)
- カエデ (CodeGen): Speaker 3 (ずんだもん)
- サクラ (Review): Speaker 1 (四国めたん)
- ツバキ (PR): Speaker 8 (春日部つむぎ)
- ボタン (Deploy): Speaker 14 (冥鳴ひまり)

**Configuration**: `orchestra-config.yaml` → `voice_notification` section

**Queue Directory**: `/tmp/voicevox_queue/`

**Website**: https://voicevox.hiroshiba.jp/

---

#### DAG (Directed Acyclic Graph)
**Definition**: A graph structure where nodes are connected by directed edges with no cycles.

**Miyabi Usage**:
- Represent task dependencies
- Enable parallel execution of independent tasks
- Ensure correct execution order

**Example**:
```
Issue #270 (Root)
├── Task A (No dependencies) → Can start immediately
├── Task B (Depends on A) → Waits for A
└── Task C (Depends on A) → Waits for A, can run parallel with B
```

**Implementation**: CoordinatorAgent creates DAG during task decomposition (Workflow W2)

**Entity**: E11 (DAG)

---

#### Claude Code
**Definition**: Anthropic's official CLI tool for Claude AI, providing agentic coding assistance.

**Miyabi Integration**:
- Powers all 21 Agents
- Runs in each tmux pane
- Executes Skills via Skill tool
- Reads configuration from `.claude/` directory

**Command**: `cc` (alias for `claude-code`)

**Configuration**:
- **Commands**: `.claude/commands/` (15+ slash commands)
- **Context**: `.claude/context/` (11 context modules)
- **Skills**: `.claude/Skills/` (18 skills)
- **Agents**: `.claude/agents/` (21 agent specs)

---

#### Character Names (Agent Personas)
**Definition**: Japanese flower names assigned to Agents for humanization and easier identification.

**Coding Agents**:
- 🎼 **カンナ** (Canna): CoordinatorAgent - Conductor of the orchestra
- 🎹 **カエデ** (Maple): CodeGenAgent - Generates beautiful code like autumn leaves
- 🎺 **サクラ** (Cherry Blossom): ReviewAgent - Reviews with spring-like freshness
- 📋 **スミレ** (Violet): IssueAgent - Triages Issues with care
- 🥁 **ツバキ** (Camellia): PRAgent - Creates PRs with winter elegance
- 🎷 **ボタン** (Peony): DeploymentAgent - Deploys with confidence
- 🔄 **アサガオ** (Morning Glory): RefresherAgent - Refreshes like morning dew

**Special**:
- 🕷️ **クモ** (Spider): WaterSpiderAgent - Monitors and relays messages

**Reference**: `.claude/agents/AGENT_CHARACTERS.md`

---

#### LDD (Log-Driven Development)
**Definition**: A development methodology where comprehensive logging drives development decisions.

**Miyabi Implementation**:
- All Agent actions logged to `.ai/logs/`
- Logs used for debugging, auditing, and performance analysis
- Structured log format for machine parsing

**Log Files**:
- `orchestra-session-*.log`: Orchestration events
- `water-spider.log`: Health check and monitoring
- `water-spider-relay.log`: Message relay events
- `orchestra-session-start.log`: Session initialization
- `orchestra-session-end.log`: Session completion

**Entity**: E10 (LDDLog)

---

#### Guardian
**Definition**: A human operator who monitors the Orchestra system and intervenes when Agents encounter blocking issues.

**Responsibilities**:
- Approve high-risk operations (security fixes, breaking changes)
- Resolve Agent deadlocks
- Handle escalations (Sev.1-Critical issues)
- Make strategic decisions beyond Agent capabilities

**Notification Channels**:
- Slack (if configured)
- Discord (if configured)
- Email (if configured)
- Terminal output (always)

**Escalation Trigger**: E8 (Escalation) entity creation

---

### Abbreviations & Acronyms

| Abbreviation | Full Name | Meaning |
|--------------|-----------|---------|
| **CI/CD** | Continuous Integration / Continuous Deployment | Automated build, test, and deployment pipeline |
| **CRM** | Customer Relationship Management | System for managing customer interactions |
| **CVE** | Common Vulnerabilities and Exposures | Security vulnerability identifier |
| **DAG** | Directed Acyclic Graph | Graph structure for dependency management |
| **E1-E14** | Entity 1 through Entity 14 | The 14 core Entities in Miyabi |
| **LDD** | Log-Driven Development | Development methodology based on comprehensive logging |
| **LLM** | Large Language Model | AI model (e.g., Claude, GPT) |
| **LTV** | Lifetime Value | Total revenue from a customer over their lifetime |
| **MVP** | Minimum Viable Product | Product with just enough features to satisfy early customers |
| **N1/N2/N3** | Cardinality Notation | 1:1, 1:N, N:N relationship types |
| **PR** | Pull Request | GitHub code review and merge request |
| **R1-R39** | Relation 1 through Relation 39 | The 39 Relations in Miyabi |
| **SEO** | Search Engine Optimization | Improving website visibility in search engines |
| **SLA** | Service Level Agreement | Commitment to service response time |
| **SNS** | Social Networking Service | Social media platforms |
| **SWML** | Step-back With Method Learning | Ω-System methodology |
| **TAM/SAM/SOM** | Total/Serviceable/Serviceable Obtainable Market | Market size metrics |
| **UI/UX** | User Interface / User Experience | Design disciplines |
| **W1-W5** | Workflow 1 through Workflow 5 | The 5 core Workflows in Miyabi |
| **YAML** | YAML Ain't Markup Language | Human-readable data serialization format |
| **Ω** | Omega | Universal task execution function |
| **Ψ** | Psi | World state function |

---

### File & Directory Conventions

| Pattern | Purpose | Examples |
|---------|---------|----------|
| `.claude/` | Claude Code configuration | `.claude/commands/`, `.claude/Skills/` |
| `.ai/` | AI execution data & logs | `.ai/logs/`, `.ai/reports/` |
| `miyabi_def/` | Definition system | `miyabi_def/generated/agents.yaml` |
| `crates/` | Rust crates (workspace members) | `crates/miyabi-cli/`, `crates/miyabi-agents/` |
| `docs/` | User-facing documentation | `docs/QUICK_START_3STEPS.md` |
| `.worktrees/` | Git worktrees (runtime) | `.worktrees/issue-270/` |
| `scripts/` | Utility scripts | `scripts/water-spider-monitor-v2.sh` |
| `orchestra-*.yaml` | Orchestra configurations | `orchestra-config.yaml`, `orchestra-config-dev.yaml` |

---

### Naming Conventions

#### Agent Names
- **Format**: `[Type]Agent` (e.g., `CoordinatorAgent`, `CodeGenAgent`)
- **Character Names**: Japanese flowers in Katakana (e.g., カンナ, カエデ)

#### Skills
- **Format**: `lowercase-with-hyphens` (e.g., `rust-development`, `issue-analysis`)

#### Labels
- **Format**: `category:value` (e.g., `state:pending`, `priority:P1-High`)

#### Entities
- **Format**: `E[N]_Name` (e.g., `E1_Issue`, `E3_Agent`)

#### Relations
- **Format**: `R[N]_From_to_To` (e.g., `R1_Issue_decomposes_to_Tasks`)

#### Workflows
- **Format**: `W[N]_Name` (e.g., `W1_Issue_Creation_Triage`)

#### Pane IDs
- **Format**: `%N` (e.g., `%1`, `%2`, `%5`)
- **Alternative**: Pane index `0`, `1`, `2`, ...

---

### Related Resources

- **Main Documentation**: [CLAUDE.md](../CLAUDE.md)
- **Quick Start**: [QUICK_START_3STEPS.md](../docs/QUICK_START_3STEPS.md)
- **Entity-Relation Model**: [ENTITY_RELATION_MODEL.md](../docs/architecture/ENTITY_RELATION_MODEL.md)
- **Label System**: [LABEL_SYSTEM_GUIDE.md](../docs/guides/LABEL_SYSTEM_GUIDE.md)
- **Agent Specifications**: [.claude/agents/specs/](./agents/specs/)
- **Skills**: [.claude/Skills/](./Skills/)
- **miyabi_def**: [miyabi_def/README.md](../miyabi_def/README.md)

---

**🎭 Miyabi Orchestra - Powered by miyabi_def**

**Integration Version**: 3.0.0
**Status**: ✅ FULLY INTEGRATED
**Components**: 21 Agents + 18 Skills + 5 Workflows + 14 Entities + 39 Relations + 57 Labels + Ω-System
**Date**: 2025-11-03
**Maintained by**: Miyabi Team
