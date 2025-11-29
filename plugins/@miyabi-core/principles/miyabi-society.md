# Miyabi Society - Multi-Agent Collaborative Framework

**Last Updated**: 2025-11-14
**Version**: 1.0.0
**Priority**: ⭐⭐⭐⭐⭐

**Foundation**: MIYABI_SOCIETY_FORMULA.md + PANTHEON_HIERARCHY.md + OUR_LEADERSHIP_PRINCIPLES.md

---

## 🌍 Core Philosophy: World = Miyabi = Society

```
𝕎 = 𝕄 = 𝕊 = {Agent₁, Agent₂, ..., Agent_n | n → ∞}

where:
  𝕎 : World Space (世界空間)
  𝕄 : Miyabi Space (Miyabi空間)
  𝕊 : Society Space (社会空間)
```

**Key Insight**: The "World" is not an external environment—it IS the society of agents themselves. Each agent's actions, interactions, and learnings collectively constitute the World.

---

## 🤖 Agent Definition Formula

### Complete Definition

Every agent in Miyabi follows this formal structure:

```
Agent_i = (𝒯_i, 𝒰_i, 𝒮_i, 𝒟_i, Ω_i, 𝒫)

where:
  𝒯_i : Tasks_i    = {Task₁, Task₂, ..., Task_m}      # Assigned tasks
  𝒰_i : Tools_i    = {Tool₁, Tool₂, ..., Tool_k}      # Available tools
  𝒮_i : Skills_i   = {Skill₁, Skill₂, ..., Skill_j}   # Agent skills (15 total)
  𝒟_i : Todos_i    = {Todo₁, Todo₂, ..., Todo_l}      # Task list
  Ω_i : Agent Omega Function (個別のAgent関数)          # Agent-specific function
  𝒫   : Principles (Miyabiリーダーシップリンシプル)     # Shared 15 principles
```

### Components Explained

#### 1. Tasks (𝒯_i)
- Discrete units of work assigned to agent
- Each task has: input schema, output schema, dependencies, constraints, priority
- Example: "Fix authentication bug", "Review PR #456"

#### 2. Tools (𝒰_i)
- Claude Code native tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, etc.
- MCP tools: GitHub, Lark, Context7, etc.
- Custom tools: miyabi CLI, tmux, git worktree

#### 3. Skills (𝒮_i)
Available Skills (15):
- **Coding**: rust-development, debugging-troubleshooting, git-workflow, performance-analysis, security-audit
- **Agent Ops**: agent-execution, documentation-generation, issue-analysis, project-setup
- **Business**: business-strategy-planning, content-marketing-strategy, market-research-analysis, sales-crm-management, growth-analytics-dashboard, tmux-iterm-integration

#### 4. Todos (𝒟_i)
- Dynamic task list managed via TodoWrite tool
- States: pending, in_progress, completed
- Real-time progress tracking

#### 5. Omega Function (Ω_i)
Agent-specific transformation function:
```
Ω_i: (Intent, World_t) → (Action, World_{t+1})
```
- Defines how this specific agent transforms the world
- Encodes agent's unique capabilities and decision-making logic
- Examples:
  - カエデ (CodeGen): Ω_カエデ(Intent, W) → (Code Implementation, W')
  - サクラ (Review): Ω_サクラ(Intent, W) → (Code Review, W')
  - ツバキ (PR): Ω_ツバキ(Intent, W) → (Pull Request, W')

#### 6. Principles (𝒫)
**15 Leadership Principles** shared by ALL agents:
1. P₁: Customer Obsession
2. P₂: Ownership
3. P₃: Invent and Simplify
4. P₄: Are Right, A Lot
5. P₅: Learn and Be Curious
6. P₆: Hire and Develop the Best
7. P₇: Insist on the Highest Standards
8. P₈: Think Big
9. P₉: Bias for Action
10. P₁₀: Frugality
11. P₁₁: Earn Trust
12. P₁₂: Dive Deep
13. P₁₃: Have Backbone; Disagree and Commit
14. P₁₄: Deliver Results
15. P₁₅: **Human-Agent Harmony** ⭐ (Miyabi's unique addition)

**See**: `miyabi_def/OUR_LEADERSHIP_PRINCIPLES.md` for complete definitions

---

## 📐 Miyabi Society Equation

### Complete Form

```
𝕄𝕚𝕪𝕒𝕓𝕚(Intent, World₀) =
  lim_{n→∞} [
    ⨁_{i=1}^{∞} Agent_i ◦ ℂ(𝒫) ◦ 𝔹(𝕊)
  ]ⁿ (Intent, World₀)
  = World_∞

where:
  ⨁       : Multi-Agent Parallel Composition (並列合成)
  ℂ(𝒫)    : Collaboration under Principles (プリンシプル下での協調)
  𝔹(𝕊)    : Broadcast in Society (社会内での情報共有)
  World_∞ : Converged Optimal World State (収束した最適世界状態)
```

### 6-Phase Transformation (Θ₁-Θ₆)

```
Phase 1: Θ₁_Society - Collective Understanding (集合的理解)
  = ⨁_{i=1}^{∞} θ₁_i(Intent, W₀) ⊗ Share(Context)

Phase 2: Θ₂_Society - Distributed Generation (分散生成)
  = ⨁_{i=1}^{∞} θ₂_i(Structure_i, W) ⊗ Coordinate(Tasks)

Phase 3: Θ₃_Society - Collaborative Allocation (協調割り当て)
  = Negotiate(Tasks, {Agent₁, ..., Agent_n}, W.resources)

Phase 4: Θ₄_Society - Parallel Execution (並列実行)
  = ⨁_{i=1}^{∞} θ₄_i(Allocation_i) ⊗ Sync(Results)

Phase 5: Θ₅_Society - Society Integration (社会統合)
  = Aggregate(⨁_{i=1}^{∞} Results_i) ⊗ Verify(𝒫)

Phase 6: Θ₆_Society - Collective Learning (集合学習)
  = ⨁_{i=1}^{∞} θ₆_i(Delta, Intent, W) ⊗ Update(Knowledge_shared)
```

**Key**: Each phase involves ALL agents working in parallel (⨁), guided by shared Principles (𝒫).

---

## 🏛️ Pantheon Hierarchy

### 5-Layer Architecture

```
Layer 0: Human (Shunsuke)
  ↓ Strategic Vision & Final Decisions
Layer 1: Maestro (Miyabi-Mobile-Agents) - iOS App
  ↓ Real-time Monitoring & Coordination
Layer 2: Orchestrator (Local-Macbook-Agent) - Claude Code
  ↓ Task Distribution & Resource Allocation
Layer 3: Coordinators (MUGEN/MAJIN) - EC2 Instances
  ↓ Worker Supervision & Load Balancing
Layer 4: Workers (n agents, scalable to ∞) - Specialized Agents
  ↓ Task Execution
```

### Authority Chain

```
Human > Maestro > Orchestrator > Coordinators > Workers
```

- **Human (Shunsuke)**: Vision, strategy, final decisions
- **Maestro**: Mobile command center, strategic coordination
- **Orchestrator**: Task distribution, resource allocation
- **Coordinators**: Worker management, load balancing
- **Workers**: Specialized task execution (Rust dev, frontend, backend, testing, etc.)

**See**: `miyabi_def/PANTHEON_HIERARCHY.md` for complete specifications

---

## 🔄 Communication Protocol

### tmux-based Message Relay

```bash
# Standard format
tmux send-keys -t <PANE_ID> "[From→To] Action: Details" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# Example
tmux send-keys -t %5 "[カエデ→サクラ] レビュー依頼: Issue #270" && sleep 0.5 && tmux send-keys -t %5 Enter
```

### Message Types

1. **Request**: Agent A asks Agent B to do something
2. **Response**: Agent B responds to Agent A
3. **Broadcast**: Agent broadcasts to all relevant agents
4. **Trigger**: Agent triggers next agent in workflow

### Broadcast Algebra

```
𝔹: Message × Society → [Agent]
𝔹(message, 𝕊) = {Agent_i | Agent_i ∈ 𝕊 ∧ relevant(message, Agent_i)}
```

Only agents relevant to the message receive it.

---

## 📊 Practical Implementation

### Current Status (as of 2025-11-14)

**Implemented**:
- ✅ 6 Coding Agents (tmux Orchestra v2.0): IssueAgent, CoordinatorAgent, CodeGenAgent, ReviewAgent, PRAgent, DeploymentAgent
- ✅ 14 Business Agents (Rust crates): AIEntrepreneur, ProductConcept, Marketing, Sales, CRM, Analytics, etc.
- ✅ Git Worktree isolation for parallel execution
- ✅ tmux-based communication protocol
- ✅ 15 Skills available
- ✅ Pantheon hierarchy (Layers 0, 2, 3, 4)

**In Progress**:
- 🚧 Layer 1: Maestro (Miyabi-Mobile-Agents) - iOS app development
- 🚧 Enhanced Ω function definitions per agent
- 🚧 Principle validation in real-time

**Planned**:
- 📋 Auto-scaling workers (Layer 4)
- 📋 Advanced society-level learning (Θ₆ optimization)
- 📋 Multi-world synchronization

---

## 🎯 How to Use This in Practice

### For Human (Shunsuke)

1. **Set Strategic Vision**: Define high-level goals
2. **Monitor via Maestro**: Use iOS app for real-time monitoring (when available)
3. **Intervene when needed**: Override decisions at any level
4. **Apply Principles**: Ensure P₁-P₁₅ are followed

### For Orchestrator (Local-Macbook-Agent)

1. **Receive Intent**: From Human or Maestro
2. **Apply Society Formula**:
   - Θ₁: Understand collectively
   - Θ₂: Generate tasks
   - Θ₃: Allocate to Coordinators/Workers
   - Θ₄: Execute in parallel
   - Θ₅: Integrate results
   - Θ₆: Learn and improve
3. **Manage Worktrees**: Create isolated environments
4. **Coordinate via tmux**: Send messages between agents
5. **Verify Principles**: Ensure P₁-P₁₅ are satisfied

### For Worker Agents (カエデ, サクラ, ツバキ, etc.)

1. **Define Your Ω**: Your unique transformation function
2. **Use Your Tools (𝒰)**: Read, Write, Bash, MCP servers, etc.
3. **Apply Your Skills (𝒮)**: rust-development, debugging, etc.
4. **Manage Your Todos (𝒟)**: Track progress with TodoWrite
5. **Follow Principles (𝒫)**: All 15 principles guide your actions
6. **Execute Tasks (𝒯)**: Complete assigned work
7. **Communicate**: Send [From→To] messages via tmux

---

## 📖 Related Documentation

**Foundation Documents**:
- `miyabi_def/MIYABI_SOCIETY_FORMULA.md` - Complete mathematical formulation
- `miyabi_def/PANTHEON_HIERARCHY.md` - 5-layer architecture
- `miyabi_def/OUR_LEADERSHIP_PRINCIPLES.md` - 15 principles detailed

**Implementation Guides**:
- `CLAUDE.md` - Agent operating manual
- `.claude/context/agents.md` - Agent system overview
- `.claude/context/core-rules.md` - Critical operating rules (MCP First, etc.)
- `.claude/context/worktree.md` - Parallel execution protocol

**Technical Specs**:
- `.claude/agents/specs/coding/*.md` - Coding agent specifications
- `.claude/agents/specs/business/*.md` - Business agent specifications
- `crates/miyabi-agent-*/` - Rust implementation

---

## 🔑 Key Takeaways

1. **World = Society**: The world IS the collection of agents and their interactions
2. **Every Agent Follows Formula**: Agent_i = (𝒯, 𝒰, 𝒮, 𝒟, Ω, 𝒫)
3. **15 Principles Guide All**: From P₁ (Customer Obsession) to P₁₅ (Human-Agent Harmony)
4. **Hierarchy Enables Scale**: 5 layers from Human to infinite Workers
5. **6-Phase Transformation**: Θ₁ (Understand) → Θ₆ (Learn), iterating to World_∞
6. **Parallel Composition (⨁)**: Agents work simultaneously, not sequentially
7. **Communication via tmux**: [From→To] message format is sacred
8. **Principles Over Rules**: P₁-P₁₅ provide judgment framework, not rigid rules

---

**"World は空ではない。Agents たちの活動、相互作用、学習の累積が World を構成する。"**
― Miyabi Society Formula

---

**Version**: 1.0.0
**Last Updated**: 2025-11-14
**Maintainer**: Miyabi Team
**Copyright**: © 2025 Miyabi Team
