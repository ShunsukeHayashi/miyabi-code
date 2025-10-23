# Entity-Relation Model Diagrams

**Generated**: 2025-10-24
**Source**: [ENTITY_RELATION_MODEL.md](../ENTITY_RELATION_MODEL.md)

---

## 📋 Overview

Visual representation of Miyabi's Entity-Relation Model consisting of **12 core entities** and **27 relationships**. These diagrams provide a comprehensive view of how data flows through the Miyabi system from Issue creation to deployment.

---

## 🎨 Available Diagrams

### 1. Entity-Relation Overview
![Entity-Relation Overview](Miyabi%20Entity-Relation%20Model%20-%20Overview.png)

**Source**: `entity-relation-overview.puml`

Complete ER diagram showing all 12 core entities:

**Entities**:
1. **Issue** (GitHub Issue) - Primary entity, source of truth
2. **Task** (Decomposed Unit) - Executable work unit
3. **Agent** (Autonomous Executor) - 7 Coding + 14 Business agents
4. **PR** (Pull Request) - Code submission
5. **Label** (State/Metadata) - 53 label system
6. **QualityReport** (Review Output) - 0-100 score
7. **Command** (Claude Code Command) - Slash commands
8. **Escalation** (Error Handling) - Human intervention
9. **Deployment** (Deploy Info) - Environment deployment
10. **LDDLog** (Learn-Do-Decide) - Execution log
11. **DAG** (Dependency Graph) - Task dependencies
12. **Worktree** (Git Worktree) - Isolation mechanism

**Key Relationships**:
- 1 Issue → N Tasks (decomposition)
- 1 Task → 1 Agent (execution)
- 1 Agent → 1 QualityReport (review)
- 1 Issue → 1 PR (resolution)
- 1 PR → N Deployments (environments)
- 1 Issue → 1 Worktree (isolation)

---

### 2. Entity State Machines
![Entity State Machines](Entity%20State%20Machines.png)

**Source**: `entity-state-machines.puml`

State machine diagrams for 5 core entities:

#### Issue State Machine
```
Pending → Analyzing → Implementing → Reviewing → Done
         ↓
       Blocked (dependencies)
```

**States**:
- `state:pending` - Created, awaiting triage
- `state:analyzing` - CoordinatorAgent active
- `state:implementing` - Specialist Agents working
- `state:reviewing` - ReviewAgent checking
- `state:done` - Completed & closed
- `state:blocked` - Dependencies unresolved

#### Task State Machine
```
Created → Ready → Queued → Executing → Completed
                                    ↓
                                  Failed (retry)
```

**States**:
- Created - In DAG
- Ready - Dependencies met
- Queued - Priority queue
- Executing - Agent working
- Completed - Success
- Failed - Error (max 3 retries)

#### Agent State Machine
```
Idle → Executing → Completed → Idle
              ↓
          Escalated (need human)
```

**States**:
- Idle - No task assigned
- Executing - Task in progress
- Completed - Task finished
- Escalated - Human intervention required

#### PR State Machine
```
Draft → Open → Approved → Merged
            ↓
          Closed (rejected)
```

**States**:
- Draft - Initial creation
- Open - Ready for review
- Approved - Review passed
- Merged - Merged to main
- Closed - Rejected

#### Worktree State Machine
```
Creating → Active → Completed → Merged → Removed
```

**States**:
- Creating - `git worktree add`
- Active - Agent executing
- Completed - Task done
- Merged - `git merge`
- Removed - `git worktree remove`

---

### 3. Entity Data Flow
![Entity Data Flow](Entity%20Data%20Flow.png)

**Source**: `entity-data-flow.puml`

End-to-end data flow from Issue creation to deployment:

**Flow Sequence**:
1. **Developer** → GitHub Issues (Create Issue + labels)
2. **GitHub Issues** → CoordinatorAgent (Webhook trigger)
3. **CoordinatorAgent** → DAG Builder (Build dependency graph)
4. **CoordinatorAgent** → Task Queue (Create Task[] with priority)
5. **Task Queue** → Worktree Manager (Create isolated worktrees)
6. **Worktree Manager** → Specialist Agents (Assign tasks)
7. **Specialist Agents** → ReviewAgent (Request quality check)
8. **ReviewAgent** → Specialist Agents (QualityReport: 0-100 score)
9. **Specialist Agents** → PRAgent (Create PR)
10. **PRAgent** → GitHub PRs (Submit PR #123)
11. **GitHub PRs** → DeploymentAgent (PR merged)
12. **DeploymentAgent** → Deployed Services (Deploy to staging/prod)
13. **DeploymentAgent** → GitHub Issues (Close Issue + state:done)
14. **GitHub Issues** → Developer (Notification)

**Parallel Logging**:
- All entities → LDDLog (`.ai/logs/YYYY-MM-DD.md`)
- LDDLog → Qdrant (RAG indexing)

**Error Handling**:
- Any entity → Escalation → Developer (@mention)

**Entity Transformations**:
- 1 Issue → N Tasks (CoordinatorAgent)
- N Tasks → N Worktrees (1:1 mapping)
- N Worktrees → N Agents (parallel execution)
- N Agents → N QualityReports (ReviewAgent)
- N QualityReports → N PRs (threshold: 80)

---

### 4. Entity Relationships - Detailed (27 Relations)
![Entity Relationships Detailed](Entity%20Relationships%20-%20Detailed%20%2827%20Relations%29.png)

**Source**: `entity-relationships-detailed.puml`

Complete mapping of all 27 relationships:

#### R1-R7: Issue Relations
- **R1**: Issue → Task[] (decomposed-into)
- **R2**: Issue → Label[] (tagged-with)
- **R3**: Issue → PR (creates)
- **R4**: Issue → DAG (analyzed-by)
- **R5**: Issue → Worktree (isolated-in)
- **R6**: Issue → Agent (assigned-to IssueAgent)
- **R7**: Issue → Escalation[] (triggers on error)

#### R8-R14: Task Relations
- **R8**: Task → Agent (executed-by)
- **R9**: Task → Task[] (depends-on - DAG)
- **R10**: Task → QualityReport (reviewed-as)
- **R11**: Task → LDDLog[] (logged-in)
- **R12**: Task[] → DAG (organized-in)
- **R13**: Task → Worktree (executes-in)
- **R14**: Task → Escalation[] (triggers on block)

#### R15-R20: Agent Relations
- **R15**: Agent → QualityReport[] (generates)
- **R16**: Agent → Escalation[] (triggers)
- **R17**: Agent → PR[] (creates - PRAgent)
- **R18**: Agent → Deployment[] (performs - DeploymentAgent)
- **R19**: Agent → LDDLog[] (logs-to)
- **R20**: Command → Agent[] (invoked-by)

#### R21-R25: PR & Deployment Relations
- **R21**: PR → Deployment[] (deployed-as)
- **R22**: PR → Issue (resolves)
- **R23**: Agent → PR[] (created-by PRAgent)
- **R24**: Agent → Deployment[] (performed-by)
- **R25**: Deployment → LDDLog[] (logged-in)

#### R26-R27: Worktree & DAG Relations
- **R26**: Worktree → LDDLog[] (logged-in)
- **R27**: CoordinatorAgent → DAG (built-by)

---

## 📊 Statistics

| Metric | Count | Description |
|--------|-------|-------------|
| **Entities** | 12 | Core data structures |
| **Relationships** | 27 | Typed connections |
| **State Machines** | 5 | Issue, Task, Agent, PR, Worktree |
| **States (Total)** | 21 | Across all state machines |
| **Transitions** | 30+ | State changes |

---

## 🔍 Key Insights

### 1. Issue-Centric Architecture
- **Issue** is the primary entity (single source of truth)
- All workflows start with an Issue
- Labels drive state management
- GitHub OS as the state layer

### 2. Worktree Isolation
- **1 Issue = 1 Worktree** (strict mapping)
- Parallel execution without conflicts
- Git-based isolation (superior to locks)
- Independent debugging per worktree

### 3. Agent Orchestration
- **21 Agents** (7 Coding + 14 Business)
- CoordinatorAgent builds DAG
- Specialist Agents execute tasks
- ReviewAgent enforces quality (threshold: 80)
- Escalation to human when needed

### 4. Quality-Driven Development
- QualityReport: 0-100 score
- Automatic quality checks
- Threshold-based PR creation
- Continuous improvement via RAG

### 5. Complete Observability
- LDDLog captures all actions
- Indexed in Qdrant (vector search)
- RAG-powered context retrieval
- Learn from past executions

---

## 🔗 Related Documentation

- **Source Model**: [ENTITY_RELATION_MODEL.md](../ENTITY_RELATION_MODEL.md)
- **Template Index**: [TEMPLATE_MASTER_INDEX.md](../TEMPLATE_MASTER_INDEX.md)
- **Label System**: [LABEL_SYSTEM_GUIDE.md](../LABEL_SYSTEM_GUIDE.md)
- **Agent Operations**: [AGENT_OPERATIONS_MANUAL.md](../AGENT_OPERATIONS_MANUAL.md)
- **Worktree Protocol**: [WORKTREE_PROTOCOL.md](../WORKTREE_PROTOCOL.md)

---

## 🔄 Regenerating Diagrams

### Prerequisites
```bash
brew install plantuml
```

### Generate All Entity Diagrams
```bash
plantuml -tpng docs/architecture/entity-*.puml
```

### Generate Individual Diagrams
```bash
plantuml -tpng docs/architecture/entity-relation-overview.puml
plantuml -tpng docs/architecture/entity-state-machines.puml
plantuml -tpng docs/architecture/entity-data-flow.puml
plantuml -tpng docs/architecture/entity-relationships-detailed.puml
```

---

## 💡 Usage Examples

### Query Entity Relations
```rust
use miyabi_types::{Issue, Task, Agent};

// R1: Issue → Task[] (decomposed-into)
let tasks = coordinator.decompose_issue(&issue).await?;

// R8: Task → Agent (executed-by)
let agent = task.assigned_agent()?;

// R10: Task → QualityReport (reviewed-as)
let quality_report = review_agent.review(&task).await?;
```

### Traverse State Machine
```rust
use miyabi_types::{IssueState, TaskState};

// Issue state transitions
issue.transition_to(IssueState::Analyzing)?;
issue.transition_to(IssueState::Implementing)?;
issue.transition_to(IssueState::Reviewing)?;
issue.transition_to(IssueState::Done)?;

// Task state transitions
task.transition_to(TaskState::Ready)?;
task.transition_to(TaskState::Queued)?;
task.transition_to(TaskState::Executing)?;
task.transition_to(TaskState::Completed)?;
```

### Follow Data Flow
```rust
// 1. Issue created
let issue = github.create_issue(title, body, labels).await?;

// 2. CoordinatorAgent analyzes
let dag = coordinator.analyze(&issue).await?;

// 3. Tasks queued
let tasks = coordinator.decompose(&dag).await?;

// 4. Worktrees created
let worktrees = worktree_manager.create_for_tasks(&tasks).await?;

// 5. Agents execute
for (task, worktree) in tasks.iter().zip(worktrees.iter()) {
    agent.execute(task, worktree).await?;
}

// 6. PR created
let pr = pr_agent.create_pr(&issue, &tasks).await?;

// 7. Deployed
let deployment = deployment_agent.deploy(&pr).await?;

// 8. Issue closed
github.close_issue(&issue, "state:done").await?;
```

---

## 📝 Notes

### Design Principles
1. **Single Source of Truth**: GitHub Issues
2. **Label-Driven**: State managed by labels
3. **Immutable Entities**: Entities are immutable, create new versions
4. **Explicit Relations**: All relationships are typed and documented
5. **Bidirectional Traceability**: Entity ↔ Implementation

### Implementation Status
- ✅ Core entities: Implemented in `miyabi-types`
- ✅ State machines: Implemented in `miyabi-core`
- ✅ Data flow: Implemented in `miyabi-agents`
- ✅ Relationships: Enforced by type system
- ⏳ Full visualization: In progress (this document)

---

**Last Updated**: 2025-10-24
**Diagram Count**: 4 diagrams
**Total Size**: ~764 KB
**Format**: PlantUML → PNG
**Source Model**: ENTITY_RELATION_MODEL.md (14 entities, 39 relationships)
**Visualized**: 12 entities, 27 relationships (core subset)
