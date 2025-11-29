# Miyabi Context PlantUML Diagrams

**Last Updated**: 2025-11-18
**Version**: 1.0.0

## 📊 Overview

This directory contains comprehensive PlantUML diagrams visualizing the Miyabi system architecture and context modules. These diagrams provide a visual representation of:

- System architecture
- Agent relationships
- Entity-relation models
- Workflow processes
- Communication protocols

## 🗺️ Available Diagrams

### 1. **overview.puml** - Complete System Overview
**Purpose**: High-level view of all 15 context modules and their relationships

**Key Visualizations**:
- Module priority hierarchy (P0-P4)
- Context loading patterns
- Token budget allocation
- Module dependencies
- Legacy vs. active modules

**When to Use**:
- Understanding the overall system structure
- Planning which context modules to load
- Onboarding new team members
- System documentation

**Key Sections**:
```
- Core Context Modules (P0-P1)
- Development Context Modules (P2-P3)
- Legacy Context Modules (P3-P4)
- Special Purpose Modules
- Usage Patterns
```

---

### 2. **agents.puml** - Agent System Architecture
**Purpose**: Complete visualization of the 20-agent system

**Key Visualizations**:
- 6 Coding Agents (tmux Orchestra v2.0)
- 14 Business Agents (Strategy, Marketing, Sales/CRM)
- Agent workflow chain (W1-W5)
- Parallel execution rules
- Agent character system

**Color Coding**:
- 🔴 Red: Leader agents (cannot run in parallel)
- 🟢 Green: Executor agents (parallel execution OK)
- 🔵 Blue: Analyzer agents (parallel execution OK)

**When to Use**:
- Planning agent execution
- Understanding agent dependencies
- Designing new agent workflows
- Debugging agent communication

**Workflow Chain**:
```
W1: みつけるん (Issue Triage)
  ↓
W2: しきるん (Task Decomposition)
  ↓
W3: カエデ (Code Implementation) → ツバキ (PR Creation)
  ↓
W4: サクラ (Code Review)
  ↓
W5: ボタン (Deployment)
```

---

### 3. **entity-relation.puml** - Entity-Relation Model
**Purpose**: Complete data model with 12 entities and 27 relationships

**Key Visualizations**:
- Core entities (Issue, Task, Agent, PR, etc.)
- 27 relationships between entities
- N1/N2/N3 notation for LLM optimization
- 88 Templates system integration

**Entity Categories**:
- **Core Workflow**: Issue, Task, Agent, PR (E1-E4)
- **Management**: Label, QualityReport, Command (E5-E7)
- **Operations**: Escalation, Deployment, LDDLog (E8-E10)
- **Infrastructure**: DAG, Worktree (E11-E12)

**When to Use**:
- Understanding data flow
- Designing new features
- Database schema planning
- Type definition reference

**Key Relationships**:
```
R1-R4: Issue Processing Flow
R5-R7: Task Management
R9-R13: Agent Execution
R14-R27: Extended Workflow
```

---

### 4. **architecture.puml** - System Architecture
**Purpose**: Rust-based Cargo workspace architecture

**Key Visualizations**:
- Cargo workspace structure (15+ crates)
- GitHub as OS integration
- LLM integration layer
- Knowledge management system (NEW v0.1.1)
- Windows platform support
- Parallel execution architecture

**Layer Architecture**:
```
Application Layer (CLI, MCP Server)
    ↓
Agent Layer (21 Agents)
    ↓
Integration Layer (GitHub, LLM, Worktree, Knowledge)
    ↓
Core Layer (Types, Core Utilities)
```

**When to Use**:
- Understanding system dependencies
- Planning new crate additions
- Debugging build issues
- Performance optimization

**Performance Metrics**:
- 50%+ execution time reduction (Rust vs Node.js)
- 30%+ memory usage reduction
- Single binary distribution
- Compile-time type safety

---

### 5. **worktree.puml** - Worktree Protocol
**Purpose**: Git worktree-based parallel execution system

**Key Visualizations**:
- 4-phase worktree lifecycle
- Directory structure
- Agent state management
- Parallel execution architecture
- Troubleshooting workflows

**Lifecycle Phases**:
```
Phase 1: Creation      (git worktree add)
    ↓
Phase 2: Assignment    (Agent allocation)
    ↓
Phase 3: Execution     (Task completion)
    ↓
Phase 4: Cleanup       (Merge & remove)
```

**When to Use**:
- Understanding parallel agent execution
- Debugging worktree issues
- Optimizing concurrency settings
- Planning agent isolation

**Directory Structure**:
```
.worktrees/
├── issue-270/
│   ├── .agent-context.json
│   ├── EXECUTION_CONTEXT.md
│   └── [project files]
├── issue-271/
└── issue-272/
```

---

### 6. **protocols.puml** - Task Management & Reporting
**Purpose**: Task management and reporting protocols

**Key Visualizations**:
- Todo lifecycle (pending → in_progress → completed)
- Task classification logic
- Todo structure
- Reporting protocol format
- Prohibited actions

**Task Management Rules**:
- ✅ Only 1 task can be in_progress at a time
- ✅ Complete tasks immediately
- ❌ No batch updates
- ❌ No completed status on test failures

**When to Use**:
- Implementing task management
- Understanding todo workflows
- Creating status reports
- Debugging task state issues

**Report Structure**:
```
Header (Reporter info)
    ↓
Completed Tasks (With assignments)
    ↓
Change Statistics (Git metrics)
    ↓
Verification Results (Test results)
    ↓
Next Steps (Proposals)
```

---

## 🚀 Quick Start

### Viewing Diagrams

**Option 1: PlantUML VSCode Extension**
1. Install "PlantUML" extension in VSCode
2. Open any `.puml` file
3. Press `Alt+D` (or `Cmd+D` on Mac) to preview

**Option 2: PlantUML CLI**
```bash
# Install PlantUML
brew install plantuml  # macOS
sudo apt-get install plantuml  # Ubuntu

# Generate PNG
plantuml .claude/context/overview.puml

# Generate SVG (better for web)
plantuml -tsvg .claude/context/overview.puml

# Generate all diagrams
plantuml .claude/context/*.puml
```

**Option 3: PlantUML Online Server**
1. Visit https://www.plantuml.com/plantuml/uml/
2. Copy & paste `.puml` content
3. View rendered diagram

### Generating All Diagrams

```bash
# Navigate to context directory
cd /Users/shunsuke/Dev/miyabi-private/.claude/context/

# Generate all diagrams as PNG
plantuml *.puml

# Generate all diagrams as SVG
plantuml -tsvg *.puml

# Generate with custom output directory
plantuml -o ../../docs/diagrams/ *.puml
```

---

## 📋 Usage Patterns

### For Developers

**Scenario 1: Understanding System Architecture**
```
1. Start with: overview.puml
2. Deep dive: architecture.puml
3. Specific area: agents.puml, worktree.puml
```

**Scenario 2: Implementing New Agent**
```
1. Review: agents.puml (agent system)
2. Check: entity-relation.puml (data model)
3. Follow: protocols.puml (task management)
```

**Scenario 3: Debugging Parallel Execution**
```
1. Start: worktree.puml (lifecycle)
2. Cross-reference: agents.puml (agent relationships)
3. Verify: architecture.puml (system integration)
```

### For Documentation

**Adding Diagrams to Documentation**
```markdown
# In your .md file
![System Overview](../diagrams/overview.svg)

# Or with PlantUML embed
```plantuml
@startuml
!include .claude/context/overview.puml
@enduml
```
```

**Generating Documentation Website**
```bash
# Using mkdocs with plantuml plugin
pip install mkdocs-material
pip install mkdocs-with-pdf
pip install plantuml-markdown

# Add to mkdocs.yml
markdown_extensions:
  - plantuml_markdown:
      server: http://www.plantuml.com/plantuml

# Build docs
mkdocs build
```

---

## 🔄 Maintenance

### When to Update Diagrams

**Required Updates**:
- ✅ New agent added → Update `agents.puml`
- ✅ New entity/relation → Update `entity-relation.puml`
- ✅ New crate added → Update `architecture.puml`
- ✅ Workflow change → Update `worktree.puml` or `protocols.puml`
- ✅ New context module → Update `overview.puml`

**Update Checklist**:
```markdown
- [ ] Update diagram content
- [ ] Increment version number in title
- [ ] Update "Last Updated" date
- [ ] Regenerate PNG/SVG files
- [ ] Update this DIAGRAMS.md if needed
- [ ] Commit with message: "docs: Update [diagram-name] diagram vX.Y.Z"
```

### Diagram Versioning

Follow semantic versioning:
- **Major (X.0.0)**: Complete redesign or restructure
- **Minor (X.Y.0)**: Add new sections or significant changes
- **Patch (X.Y.Z)**: Minor corrections or clarifications

Example:
```
v1.0.0 → Initial release
v1.1.0 → Added Knowledge Management section
v1.1.1 → Fixed agent color coding
```

---

## 🎨 PlantUML Styling Guide

### Color Palette

```plantuml
#FFE5E5  // Soft Red (Critical/P0)
#E5F5FF  // Soft Blue (High/P1)
#E5FFE5  // Soft Green (Medium/P2)
#F5FFE5  // Soft Yellow (Low/P3)
#F0F0F0  // Gray (Legacy/Deprecated)
#FFE5F5  // Soft Pink (Special Purpose)
```

### Standard Theme

```plantuml
!theme plain
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "SF Pro Display"
skinparam shadowing false
skinparam roundCorner 10
```

### Common Patterns

**Entity Definition**:
```plantuml
entity "EntityName\n(E1)" as Entity {
  * primary_key : type
  --
  field1 : type
  field2 : type
}
```

**Component with Note**:
```plantuml
component "Component Name\nDetails" as comp #COLOR
note right of comp
  **Description**
  - Point 1
  - Point 2
end note
```

**State Machine**:
```plantuml
state "State Name" as state {
  [*] --> SubState1
  SubState1 --> SubState2 : Transition
  SubState2 --> [*]
}
```

---

## 📚 Related Documentation

**Context Modules**:
- [INDEX.md](./INDEX.md) - Context module index
- [miyabi-definition.md](./miyabi-definition.md) - Primary system definition
- [core-rules.md](./core-rules.md) - Core operating rules

**System Documentation**:
- [ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md) - Detailed entity specs
- [TEMPLATE_MASTER_INDEX.md](../../docs/TEMPLATE_MASTER_INDEX.md) - 88 templates
- [MIYABI_ORCHESTRA_INTEGRATION.md](../.claude/MIYABI_ORCHESTRA_INTEGRATION.md) - tmux integration

**Agent Documentation**:
- [Agent Specs](../agents/specs/) - Individual agent specifications
- [Agent Prompts](../agents/prompts/) - Agent execution prompts
- [AGENT_OPERATIONS_MANUAL.md](../../docs/AGENT_OPERATIONS_MANUAL.md) - Operations guide

---

## 🔗 Quick Links

| Diagram | Purpose | Priority | Lines |
|---------|---------|----------|-------|
| [overview.puml](./overview.puml) | Complete system overview | ⭐⭐⭐⭐⭐ | ~280 |
| [agents.puml](./agents.puml) | 20-agent architecture | ⭐⭐⭐⭐ | ~220 |
| [entity-relation.puml](./entity-relation.puml) | Data model & relations | ⭐⭐⭐⭐ | ~200 |
| [architecture.puml](./architecture.puml) | System architecture | ⭐⭐⭐⭐ | ~240 |
| [worktree.puml](./worktree.puml) | Parallel execution | ⭐⭐⭐ | ~180 |
| [protocols.puml](./protocols.puml) | Task management | ⭐⭐⭐ | ~150 |

**Total Diagrams**: 6
**Total Lines**: ~1,270
**Total Visual Elements**: 100+ components, 50+ relationships

---

## 💡 Tips & Tricks

### Performance Optimization

**Large Diagrams**:
```bash
# Use SVG for large diagrams (better scaling)
plantuml -tsvg large-diagram.puml

# Limit depth for complex hierarchies
!pragma maxMessageLength 1000
```

### Integration with CI/CD

**GitHub Actions Example**:
```yaml
name: Generate Diagrams

on:
  push:
    paths:
      - '.claude/context/*.puml'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate PlantUML diagrams
        uses: grassedge/generate-plantuml-action@v1.5
        with:
          path: .claude/context
          message: "docs: Update generated diagrams"
```

### Export Options

```bash
# High-res PNG (for presentations)
plantuml -tpng -Sdpi=300 diagram.puml

# PDF (for printing)
plantuml -tpdf diagram.puml

# Multiple formats
plantuml -tsvg -tpng -tpdf diagram.puml
```

---

**Last Updated**: 2025-11-18
**Maintainer**: Miyabi Team
**Feedback**: Create an issue with label `documentation` for diagram improvements
