---
title: "Diagrams Gallery"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "diagrams"
tags: ["miyabi", "diagrams", "visual", "architecture"]
status: "published"
---

# Miyabi Diagrams Gallery

**Complete visual documentation of the Miyabi system**

## 📊 Architecture Diagrams

### System Architecture

![[assets/diagrams/Miyabi System Architecture - Rust Edition.png]]

**Description**: High-level overview of the Miyabi framework
- Cargo workspace structure (15+ crates)
- Integration layer (GitHub, LLM, Knowledge, Worktree)
- Agent layer (21 agents)
- Application layer (CLI, MCP Server)
- GitHub as OS integration
- Windows platform support

**Related**: [[INDEX|Main Index]]

---

### Entity-Relation Model

![[assets/diagrams/Miyabi Entity-Relation Model - 12 Entities.png]]

**Description**: Complete entity-relation diagram
- 14 core entities (E1-E14)
- 39 relationships (R1-R39)
- Cardinality indicators (1:1, 1:N, N:N)
- Entity categories (Primary, Extended, System)

**Related**: [[entities/INDEX|Entities Index]]

---

### Agent System Architecture

![[assets/diagrams/Miyabi Agent System - 20 Agents Architecture.png]]

**Description**: Agent orchestration and communication
- 7 Coding agents (W1-W5 coverage)
- 14 Business agents (Strategy, Marketing, Sales)
- Water Spider v2.0 message relay
- BaseAgent trait hierarchy
- Parallel execution rules

**Related**: [[agents/INDEX|Agents Index]]

---

### Context Modules Overview

![[assets/diagrams/Miyabi Context Modules - Complete Overview.png]]

**Description**: Complete context module system
- 15 context modules in `.claude/context/`
- Module hierarchy and dependencies
- Priority levels (P0, P1, P2, P3)
- Usage patterns

**Related**: `.claude/context/INDEX.md`

---

### Protocols & Task Management

![[assets/diagrams/Miyabi Protocols - Task Management & Reporting.png]]

**Description**: Communication protocols
- Task delegation protocol
- Inter-agent communication
- Status reporting format
- Error escalation flow

**Related**: `.claude/context/protocols.md`

---

### Worktree Parallel Execution

![[assets/diagrams/Miyabi Worktree Protocol - Parallel Execution Architecture.png]]

**Description**: Git worktree-based parallel execution
- Worktree lifecycle management
- Parallel task execution
- Agent isolation
- Merge strategies

**Related**: [[entities/E12|E12: Worktree]]

---

## 🔄 Interactive Workflow Diagrams

### Complete Workflow Chain

See [[WORKFLOWS_DIAGRAM|Workflows Visual Guide]] for interactive Mermaid diagrams:

- **Workflow Chain**: W1 → W2 → W3 → W4 → W5
- **Parallel Execution**: DAG-based concurrent task processing
- **Entity Flow**: How entities transform through workflows

---

## 📈 Diagram Statistics

| Diagram | Type | Size | Entities/Components |
|---------|------|------|---------------------|
| System Architecture | PlantUML | 23KB | 9 crates + 6 GitHub components |
| Entity-Relation Model | PlantUML | 154KB | 14 entities + 39 relations |
| Agent System | PlantUML | 25KB | 21 agents + workflows |
| Context Modules | PlantUML | 454KB | 15 modules + dependencies |
| Protocols | PlantUML | 19KB | 4 protocol types |
| Worktree | PlantUML | 18KB | Lifecycle + execution flow |
| Workflows (Mermaid) | Mermaid | N/A | 5 workflows + entities |

**Total Visual Assets**: 7 diagrams (~720KB)

---

## 🎨 Diagram Usage Guide

### Viewing in Obsidian

All PNG diagrams are embedded directly in markdown files:
- **Main Index**: System Architecture
- **Entities Index**: Entity-Relation Model
- **Agents Index**: Agent System
- **Workflows Index**: Link to Mermaid diagrams
- **This Page**: All diagrams in one place

### Viewing Mermaid Diagrams

Mermaid diagrams are rendered interactively in Obsidian:
1. Open [[WORKFLOWS_DIAGRAM|Workflows Visual Guide]]
2. See live-rendered flowcharts
3. Navigate using Obsidian's graph view

### Exporting Diagrams

To export diagrams for presentations:

1. **PNG Files** (already generated):
   - Location: `docs/obsidian-vault/assets/diagrams/`
   - Use directly in PowerPoint, Keynote, etc.

2. **Source Files** (PlantUML):
   - Location: `.claude/context/*.puml`
   - Regenerate with: `plantuml -tpng file.puml`

3. **Mermaid Diagrams**:
   - Copy Mermaid code from markdown
   - Use [Mermaid Live Editor](https://mermaid.live) to export

---

## 🔧 Updating Diagrams

### PlantUML Diagrams

```bash
# Regenerate all PNG diagrams
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/context
plantuml -tpng -o ../../docs/obsidian-vault/assets/diagrams *.puml
```

### Mermaid Diagrams

Edit directly in markdown files:
- [[WORKFLOWS_DIAGRAM|WORKFLOWS_DIAGRAM.md]]

### Source Control

- **PlantUML sources**: `.claude/context/*.puml`
- **Generated PNGs**: `docs/obsidian-vault/assets/diagrams/`
- **Mermaid sources**: Inline in `.md` files

---

## 🔗 Related Documentation

### Visual Navigation
- [[INDEX|Main Index]] - Central navigation
- [[QUICK_REFERENCE|Quick Reference]] - Fast lookup
- [[DOCUMENTATION_SYSTEM_REPORT|System Report]] - Complete details

### Technical Documentation
- [[entities/INDEX|Entities Index]] - 14 entities
- [[agents/INDEX|Agents Index]] - 21 agents
- [[relations/INDEX|Relations Index]] - 39 relations
- [[workflows/INDEX|Workflows Index]] - 5 workflows

### Source Documentation
- `.claude/context/architecture.md` - Architecture details
- `.claude/context/agents.md` - Agent specifications
- `.claude/context/worktree.md` - Worktree protocol

---

## 📝 Diagram Maintenance Log

| Date | Action | Diagrams Updated |
|------|--------|------------------|
| 2025-11-18 | Initial creation | All 7 diagrams generated |
| 2025-11-18 | Obsidian integration | Embedded in 4 index pages |

---

**Diagrams Gallery** | Version 1.0 | 2025-11-18

**Note**: This page provides a comprehensive visual reference for the entire Miyabi system. All diagrams are kept in sync with the canonical PlantUML/Mermaid sources.
