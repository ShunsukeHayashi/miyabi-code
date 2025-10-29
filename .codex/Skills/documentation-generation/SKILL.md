---
name: Entity-Relation Based Documentation
description: Generate comprehensive documentation based on Miyabi's Entity-Relation Model (14 entities, 39 relationships). Use when creating new docs, updating architecture docs, or explaining system components.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Entity-Relation Based Documentation

Generate accurate, consistent documentation based on Miyabi's Entity-Relation Model, ensuring all components are properly linked and documented.

## When to Use

- User requests "document this feature"
- User asks to "update the architecture docs"
- User wants to "explain how X works"
- After implementing new features or Agents
- When creating onboarding materials
- For API documentation generation

## Miyabi's Entity-Relation Model

### 14 Core Entities

| ID | Entity | Description | Rust Type | TypeScript Type (Legacy) |
|----|--------|-------------|-----------|--------------------------|
| E1 | **Issue** | GitHub Issue | `crates/miyabi-types/src/issue.rs` | `agents/types/index.ts:54-64` |
| E2 | **Task** | Decomposed task | `crates/miyabi-types/src/task.rs` | `agents/types/index.ts:37-52` |
| E3 | **Agent** | Autonomous Agent | `crates/miyabi-types/src/agent.rs` | `agents/types/index.ts:15-22` |
| E4 | **PR** | Pull Request | `crates/miyabi-github/src/pr.rs` | `agents/types/index.ts:240-257` |
| E5 | **Label** | GitHub Label (57 labels) | `docs/LABEL_SYSTEM_GUIDE.md` | `.github/labels.yml` |
| E6 | **QualityReport** | Code quality report | `crates/miyabi-types/src/quality.rs` | `agents/types/index.ts:108-130` |
| E7 | **Command** | Codex command | `.codex/commands/*.md` | `.codex/commands/*.md` |
| E8 | **Escalation** | Escalation info | `crates/miyabi-types/src/error.rs` | `agents/types/index.ts:96-102` |
| E9 | **Deployment** | Deployment info | `crates/miyabi-agents/src/deployment.rs` | `agents/types/index.ts:262-281` |
| E10 | **LDDLog** | Log-Driven Development log | `crates/miyabi-types/src/workflow.rs` | `agents/types/index.ts:284-312` |
| E11 | **DAG** | Task dependency graph | `crates/miyabi-types/src/workflow.rs` | `agents/types/index.ts:66-70` |
| E12 | **Worktree** | Git Worktree | `crates/miyabi-worktree/src/lib.rs` | `CLAUDE.md` |
| E13 | **DiscordCommunity** | Discord community | `docs/DISCORD_COMMUNITY_PLAN.md` | (未実装) |
| E14 | **SubIssue** | Hierarchical Issue | `crates/miyabi-types/src/issue.rs` | `agents/types/index.ts:67-114` |

### 39 Relationships

#### Issue Processing Flow (R1-R4, R36-R38)
- **R1**: Issue --analyzed-by-→ Agent (IssueAgent)
- **R2**: Issue --decomposed-into-→ Task[] (CoordinatorAgent)
- **R3**: Issue --tagged-with-→ Label[]
- **R4**: Issue --creates-→ PR
- **R36**: Issue --parent-of-→ SubIssue (1:N - hierarchy)
- **R37**: SubIssue --child-of-→ Issue (N:1 - hierarchy)
- **R38**: SubIssue --sibling-of-→ SubIssue (N:N - same level)

#### Agent Execution (R5, R9-R15)
- **R5**: Task --assigned-to-→ Agent
- **R9**: Agent --executes-→ Task
- **R10**: Agent --generates-→ PR
- **R11**: Agent --creates-→ QualityReport
- **R12**: Agent --triggers-→ Escalation
- **R13**: Agent --performs-→ Deployment
- **R14**: Agent --logs-to-→ LDDLog
- **R15**: Agent --invoked-by-→ Command

#### Label Control (R16-R18, R39)
- **R16**: Label --triggers-→ Agent (e.g., `trigger:agent-execute`)
- **R17**: Label --defines-state-→ Issue (STATE labels)
- **R18**: Label --categorizes-→ Task (TYPE labels)
- **R39**: SubIssue --tracked-by-→ Label (HIERARCHY labels)

#### Quality Management (R19-R23)
- **R19**: PR --reviewed-by-→ Agent (ReviewAgent)
- **R20**: PR --has-→ QualityReport
- **R21**: PR --attached-to-→ Issue
- **R22**: QualityReport --evaluated-by-→ Agent
- **R23**: QualityReport --attached-to-→ PR

#### Parallel Execution (R6-R8, R24-R27)
- **R6**: Task --depends-on-→ Task (DAG edges)
- **R7**: Task --part-of-→ DAG
- **R8**: Task --runs-in-→ Worktree
- **R24**: DAG --decomposed-from-→ Issue
- **R25**: DAG --contains-→ Task[]
- **R26**: Worktree --executes-→ Task
- **R27**: Worktree --creates-→ PR

#### Community Integration (R28-R35)
- **R28**: Issue --notifies-to-→ DiscordCommunity
- **R29**: Agent --posts-to-→ DiscordCommunity
- **R30**: QualityReport --announces-in-→ DiscordCommunity
- **R31**: PR --announces-in-→ DiscordCommunity
- **R32**: Deployment --notifies-to-→ DiscordCommunity
- **R33**: Label --triggers-notification-to-→ DiscordCommunity
- **R34**: Escalation --notifies-to-→ DiscordCommunity
- **R35**: Command --integrated-with-→ DiscordCommunity

## Documentation Generation Workflow

### Step 1: Identify Relevant Entities

For the feature/component being documented, identify which entities are involved:

```typescript
// Example: Documenting CodeGenAgent
Entities:
- E3: Agent (CodeGenAgent itself)
- E2: Task (what it executes)
- E4: PR (what it generates)
- E1: Issue (what it processes)
- E5: Label (what triggers it)
- E12: Worktree (where it runs)

Relationships:
- R9: Agent --executes-→ Task
- R10: Agent --generates-→ PR
- R2: Issue --decomposed-into-→ Task
- R8: Task --runs-in-→ Worktree
```

### Step 2: Document Entity Properties

Use the Entity-Relation Model as reference:

```rust
// For Rust implementation
struct CodeGenAgent {
    agent_type: AgentType::CodeGen,
    authority: AgentAuthority::Execution,  // 🔵実行権限
    escalation_target: EscalationTarget::TechLead,
    config: AgentConfig,
}
```

```typescript
// For TypeScript implementation (legacy)
interface CodeGenAgent extends BaseAgent {
  agentType: 'CodeGenAgent';
  authority: '🔵実行権限';
  escalationTarget: 'TechLead';
}
```

### Step 3: Document Relationships

Explain how the entity interacts with other entities:

```markdown
## Relationships

### R9: Executes Tasks
CodeGenAgent receives Task objects from CoordinatorAgent and executes them in isolated Worktrees.

**Input**: Task with type `feature`, `bug`, or `refactor`
**Output**: AgentResult with generated code, tests, and documentation

### R10: Generates Pull Requests
After code generation, CodeGenAgent creates a PR via PRAgent.

**Format**: Conventional Commits (e.g., `feat: Issue #270 - Add authentication`)
**Body**: Includes change summary, metrics, and test results
```

### Step 4: Include Code Examples

Provide both Rust and TypeScript examples:

**Rust Implementation**:
```rust
use miyabi_agents::{CodeGenAgent, BaseAgent};
use miyabi_types::{Task, AgentResult};

let agent = CodeGenAgent::new(config)?;
let result = agent.execute(task).await?;

match result.status {
    AgentStatus::Success => println!("Code generated: {:?}", result.data),
    AgentStatus::Failed => eprintln!("Generation failed: {:?}", result.error),
}
```

**TypeScript Implementation (Legacy)**:
```typescript
import { CodeGenAgent } from '@/agents/codegen';

const agent = new CodeGenAgent(config);
const result = await agent.execute(task);

if (result.status === 'success') {
  console.log('Code generated:', result.data);
}
```

### Step 5: Document File Locations

Use the Entity → File mapping from `docs/ENTITY_RELATION_MODEL.md`:

```markdown
## File Locations

### Rust Implementation (Current)
- **Implementation**: `crates/miyabi-agents/src/codegen.rs`
- **Types**: `crates/miyabi-types/src/agent.rs`
- **Tests**: `crates/miyabi-agents/tests/codegen_tests.rs`
- **Examples**: `crates/miyabi-agents/examples/codegen_agent.rs`

### TypeScript Implementation (Legacy - Reference)
- **Implementation**: `agents/codegen/codegen-agent.ts`
- **Types**: `agents/types/index.ts:15-22`
- **Tests**: `agents/codegen/codegen-agent.test.ts`

### Documentation
- **Specification**: `.codex/agents/specs/coding/codegen-agent.md`
- **Execution Prompt**: `.codex/agents/prompts/coding/codegen-agent-prompt.md`
- **Entity Model**: `docs/ENTITY_RELATION_MODEL.md`
```

### Step 6: Add Diagrams

Use Mermaid diagrams to visualize relationships:

```markdown
## Architecture Diagram

\```mermaid
graph TB
    Issue[E1: Issue] -->|R2: decomposed-into| Task[E2: Task]
    Task -->|R9: executes| Agent[E3: CodeGenAgent]
    Agent -->|R10: generates| PR[E4: PR]
    Task -->|R8: runs-in| Worktree[E12: Worktree]
    Label[E5: Label] -->|R16: triggers| Agent
\```
```

## Documentation Templates

### Agent Documentation Template

```markdown
# [Agent Name] - [Purpose]

[Brief description in 1-2 sentences]

## Entity Information

- **Entity**: E3 (Agent)
- **Type**: [AgentType]
- **Authority**: [🔴統括権限 | 🔵実行権限 | 🟢分析権限]
- **Parallel Execution**: [Yes/No]

## Relationships

### Input
- **R[N]**: [Relationship description]

### Output
- **R[N]**: [Relationship description]

## Implementation

### Rust (Current)
\```rust
[Code example]
\```

### TypeScript (Legacy - Reference)
\```typescript
[Code example]
\```

## Workflow

1. [Step 1]
2. [Step 2]
3. [Step 3]

## File Locations

[List of file paths with links]

## Related Documentation

- [Link to related docs]

## Examples

[Usage examples]
```

### Feature Documentation Template

```markdown
# [Feature Name]

[Brief description]

## Entities Involved

| Entity | Role | Relationship |
|--------|------|--------------|
| E[N]: [Name] | [Role] | R[N]: [Relationship] |

## Architecture

\```mermaid
[Mermaid diagram]
\```

## Implementation

### Rust Implementation (Current)
[Code examples]

### TypeScript Implementation (Legacy - Reference)
[Code examples]

## Usage

[Usage examples]

## File Locations

[List of files]
```

### API Documentation Template

```markdown
# [API/Module Name] API Reference

## Overview

[Brief description]

## Types

### Rust Types (Current)
\```rust
[Type definitions]
\```

### TypeScript Types (Legacy - Reference)
\```typescript
[Type definitions]
\```

## Functions/Methods

### `functionName`

**Signature**:
\```rust
pub async fn function_name(param: Type) -> Result<ReturnType, Error>
\```

**Parameters**:
- `param`: [Description]

**Returns**:
- `Result<ReturnType, Error>`: [Description]

**Example**:
\```rust
[Example code]
\```

**Related Entities**: E[N], E[N]

**Related Relationships**: R[N], R[N]
```

## Best Practices

### 1. Always Reference the Entity-Relation Model

Before documenting any component, check:
- `docs/ENTITY_RELATION_MODEL.md` - Entity definitions
- `docs/TEMPLATE_MASTER_INDEX.md` - Template inventory
- `docs/LABEL_SYSTEM_GUIDE.md` - Label system

### 2. Maintain Bidirectional Links

Every documentation should link:
- **Forward**: Entity → Implementation files
- **Backward**: Implementation files → Entity model

### 3. Update Multiple Locations

When documenting a change, update:
- Main documentation (e.g., `CLAUDE.md`)
- Entity-Relation Model (if structure changes)
- Agent specifications (if Agent-related)
- Type definitions (Rust + TypeScript)

### 4. Include Both Rust and TypeScript

For now, maintain both implementations in docs:
- Rust as primary (current implementation)
- TypeScript as reference (legacy implementation)

### 5. Use Consistent Terminology

- **Agent**: Not "worker", "executor", "runner"
- **Task**: Not "job", "work item"
- **Worktree**: Not "workspace", "working directory"
- **Label**: Not "tag", "category"

## Validation Checklist

After generating documentation, verify:

- [ ] All mentioned entities are defined in `docs/ENTITY_RELATION_MODEL.md`
- [ ] All relationships use correct R[N] notation
- [ ] File paths are accurate and up-to-date
- [ ] Both Rust and TypeScript examples provided (if applicable)
- [ ] Mermaid diagrams render correctly
- [ ] Code examples compile/run without errors
- [ ] Links to related docs are valid
- [ ] Terminology is consistent with project standards

## Related Files

- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md` (⭐⭐⭐ required reading)
- **Template Index**: `docs/TEMPLATE_MASTER_INDEX.md`
- **Label System**: `docs/LABEL_SYSTEM_GUIDE.md`
- **Agent Specs**: `.codex/agents/specs/coding/*.md`
- **Type Definitions (Rust)**: `crates/miyabi-types/src/*.rs`
- **Type Definitions (TS)**: `agents/types/index.ts`

## Related Skills

- **Issue Analysis**: For understanding what to document
- **Rust Development**: For verifying code examples
- **Agent Execution**: For documenting Agent workflows
