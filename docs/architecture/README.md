# Miyabi Architecture Diagrams

This directory contains comprehensive PlantUML architecture diagrams for the Miyabi project.

## 📋 Diagram Collections

### Crates Architecture
**Documentation**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md)

5 diagrams covering the Rust workspace structure:
- Comprehensive crates architecture (26+ crates)
- Layered architecture (6 layers)
- Agent execution flow (Worktree-based parallelism)
- Knowledge management system (Qdrant + RAG)
- MCP integration (Claude Code ↔ JSON-RPC 2.0)

### Water Spider Orchestrator
**Documentation**: [WATER_SPIDER_INDEX.md](WATER_SPIDER_INDEX.md)

4 diagrams covering the autonomous execution system:
- System architecture (GitHub OS + Task Scheduler + Self-hosted runners)
- Task lifecycle flow (Issue → Dispatch → Execute → Complete)
- Task scheduler service (Internal architecture)
- Task state machine (11 states, 16 transitions)

### Cline Analysis & Comparison
**Documentation**: [CLINE_ANALYSIS.md](CLINE_ANALYSIS.md)

3 diagrams comparing Cline and Miyabi:
- Architecture comparison (Interactive vs Autonomous)
- Integration opportunities (Hybrid UI + Engine)
- Key learnings (5 applicable patterns)

### Cline Integration Roadmap
**Documentation**: [CLINE_INTEGRATION_ROADMAP.md](CLINE_INTEGRATION_ROADMAP.md)

Implementation roadmap for Cline + Miyabi integration:
- Timeline diagram (6-month, 3 scenarios)
- Phase-by-phase implementation plan (9 phases)
- Budget & resource allocation ($129K, 484 hours)
- Risk assessment & mitigation strategies

### Entity-Relation Model
**Documentation**: [ENTITY_RELATION_INDEX.md](ENTITY_RELATION_INDEX.md)

4 diagrams visualizing the data model:
- Entity-Relation overview (12 entities)
- Entity state machines (5 state machines, 21 states)
- Entity data flow (Issue → Deployment)
- Detailed relationships (27 relations)

---

## 🎨 Available Diagrams

### Crates & Infrastructure

| Diagram | File | Size | Type |
|---------|------|------|------|
| Crates Architecture | `Miyabi Crates Architecture.png` | 287 KB | Component |
| Crates Layers | `Miyabi Crates Layers.png` | 170 KB | Component |
| Agent Execution Flow | `Agent Execution Flow.png` | 203 KB | Sequence |
| Knowledge System | `Knowledge Management System.png` | 202 KB | Component |
| MCP Integration | `MCP Integration Architecture.png` | 161 KB | Sequence |

### Water Spider Orchestrator

| Diagram | File | Size | Type |
|---------|------|------|------|
| System Architecture | `Water Spider Orchestrator - System Architecture.png` | 277 KB | Component |
| Task Lifecycle | `Water Spider - Task Lifecycle Flow.png` | 245 KB | Sequence |
| Task Scheduler | `Task Scheduler Service Architecture.png` | ~200 KB | Component |
| State Machine | `Water Spider - Task State Machine.png` | 103 KB | State |

### Cline Analysis & Comparison

| Diagram | File | Size | Type |
|---------|------|------|------|
| Architecture Comparison | `Cline vs Miyabi - Architecture Comparison.png` | 254 KB | Component |
| Integration Opportunities | `Cline + Miyabi Integration Opportunities.png` | 305 KB | Component |
| Key Learnings | `Cline Learnings - Applicable to Miyabi.png` | 155 KB | Component |
| Integration Timeline | `Cline + Miyabi Integration Timeline.png` | 162 KB | Component |

---

## 🔄 Generating Diagrams

### Prerequisites
```bash
brew install plantuml
```

### Generate All Diagrams
```bash
# All PlantUML files in this directory
plantuml -tpng docs/architecture/*.puml

# Or generate SVG (scalable)
plantuml -tsvg docs/architecture/*.puml
```

### Generate Specific Collection
```bash
# Crates architecture only
plantuml -tpng docs/architecture/crates-*.puml \
                docs/architecture/agent-*.puml \
                docs/architecture/knowledge-*.puml \
                docs/architecture/mcp-*.puml

# Water Spider orchestrator only
plantuml -tpng docs/architecture/water-spider-*.puml
```

### Generate Single Diagram
```bash
plantuml -tpng docs/architecture/crates-architecture.puml
```

---

## 📚 PlantUML Source Files

### Crates Architecture (`.puml` files)
```
crates-architecture.puml     - Complete 26+ crate dependency graph
crates-layers.puml           - 6-layer simplified architecture
agent-execution-flow.puml    - Worktree-based parallel execution
knowledge-system.puml        - miyabi-knowledge architecture
mcp-integration.puml         - MCP Server ↔ Claude Code
```

### Water Spider Orchestrator (`.puml` files)
```
water-spider-system.puml        - Overall system architecture
water-spider-task-flow.puml     - Complete task lifecycle
water-spider-scheduler.puml     - Task Scheduler Service internals
water-spider-state-machine.puml - Task state transitions
```

---

## 🎯 Diagram Types

### Component Diagrams
Show system structure and dependencies:
- Crates Architecture
- Crates Layers
- Knowledge System
- Water Spider System Architecture
- Task Scheduler Service

### Sequence Diagrams
Show interactions over time:
- Agent Execution Flow
- MCP Integration
- Water Spider Task Lifecycle

### State Diagrams
Show state transitions:
- Water Spider Task State Machine

---

## 📖 Documentation Integration

These diagrams complement the following documentation:

### Core Documentation
- **[ENTITY_RELATION_MODEL.md](../ENTITY_RELATION_MODEL.md)**: 12 entities, 27 relationships
- **[TEMPLATE_MASTER_INDEX.md](../TEMPLATE_MASTER_INDEX.md)**: 88 template files
- **[LABEL_SYSTEM_GUIDE.md](../LABEL_SYSTEM_GUIDE.md)**: 53 label system

### Architecture Documentation
- **[RUST_MIGRATION_REQUIREMENTS.md](../RUST_MIGRATION_REQUIREMENTS.md)**: Rust edition rationale
- **[WORKTREE_PROTOCOL.md](../WORKTREE_PROTOCOL.md)**: Worktree lifecycle protocol
- **[AGENT_OPERATIONS_MANUAL.md](../AGENT_OPERATIONS_MANUAL.md)**: Agent operation guide

### Water Spider Documentation
- **[WATER_SPIDER_ORCHESTRATOR_DESIGN.md](../WATER_SPIDER_ORCHESTRATOR_DESIGN.md)**: Complete design spec
- **[CLAUDE_SESSION_SCHEDULER_DESIGN.md](../CLAUDE_SESSION_SCHEDULER_DESIGN.md)**: Session scheduling
- **[CRATE_DEPENDENCY_OPTIMIZATION_PLAN.md](../CRATE_DEPENDENCY_OPTIMIZATION_PLAN.md)**: Dependency optimization

---

## 🎨 Diagram Conventions

### Colors
- **LightBlue**: Foundation layer / GitHub OS
- **LightGreen**: Core utilities / Task Scheduler
- **LightYellow**: Infrastructure / Self-hosted runner
- **LightCoral**: Agent core
- **LightSalmon**: Specialized agents
- **Wheat**: Aggregator (DEPRECATED)
- **LightPink**: Application layer
- **LightGray**: Support modules

### Arrow Types
- **Solid arrow** (`-->`): Direct dependency, data flow
- **Dashed arrow** (`..>`): Optional dependency, async communication
- **Dotted arrow** (`:>`): Re-export, configuration

### Component Stereotypes
- `<<Core Types>>`: Type definitions
- `<<Configuration & Logging>>`: Core utilities
- `<<GitHub API>>`: External API integration
- `<<Agent Traits>>`: Trait definitions
- `<<CLI Binary>>`: Executable application
- `<<DEPRECATED>>`: Legacy code
- `<<24/7 Daemon>>`: Background service

---

## 🔧 Updating Diagrams

### When to Update

1. **Add new crate**: Update `crates-architecture.puml` and `crates-layers.puml`
2. **Change dependencies**: Update arrows in relevant diagrams
3. **New agent type**: Add to agent execution diagrams
4. **New Water Spider component**: Update `water-spider-system.puml`
5. **New state**: Update `water-spider-state-machine.puml`

### Update Process

1. Edit the `.puml` source file
2. Regenerate PNG: `plantuml -tpng docs/architecture/<file>.puml`
3. Verify the output looks correct
4. Update corresponding index file (DIAGRAM_INDEX.md or WATER_SPIDER_INDEX.md)
5. Commit both `.puml` and `.png` files

---

## 📊 Diagram Statistics

| Collection | Diagrams | Total Size | Avg Complexity |
|------------|----------|------------|----------------|
| Crates Architecture | 5 | ~1.0 MB | Medium-High |
| Water Spider | 4 | ~0.9 MB | Medium-High |
| Cline Analysis | 4 | ~0.9 MB | Medium |
| Entity-Relation | 4 | ~0.8 MB | Medium-High |
| **Total** | **17** | **~3.6 MB** | **Medium-High** |

**Node Count**: 200+ components/actors across all diagrams
**Relationship Count**: 400+ arrows/connections

---

## 🔗 External Resources

- **PlantUML Official**: https://plantuml.com/
- **Component Diagrams**: https://plantuml.com/component-diagram
- **Sequence Diagrams**: https://plantuml.com/sequence-diagram
- **State Diagrams**: https://plantuml.com/state-diagram
- **Themes**: https://plantuml.com/theme
- **Online Editor**: https://www.plantuml.com/plantuml/

---

## 📝 Notes

### Design Principles
1. **Layered Architecture**: Clear separation of concerns
2. **Dependency Inversion**: Core types at bottom, applications at top
3. **Worktree Isolation**: True parallel execution without conflicts
4. **GitHub OS First**: All state stored in GitHub
5. **Zero-Touch Operation**: Complete automation via Water Spider
6. **Knowledge-Driven**: Learn from execution history via RAG

### Maintenance
- Regenerate diagrams after significant architectural changes
- Keep documentation in sync with code
- Use consistent naming and color schemes
- Add notes to explain complex interactions
- Version control both `.puml` and `.png` files

---

**Last Updated**: 2025-10-24
**Diagram Count**: 17 diagrams (5 Crates + 4 Water Spider + 4 Cline + 4 Entity-Relation)
**Total Size**: ~3.6 MB
**Format**: PlantUML → PNG (1200+ DPI)
**Codebase Version**: 0.1.1 (Rust Edition)
**Water Spider Version**: v1.0.0 (Design) / v0.1.1 (Implementation)
**Cline Analysis**: v3.34.0 (analyzed)
**Cline Integration**: Roadmap v1.0.0 (6-month, $129K budget)
