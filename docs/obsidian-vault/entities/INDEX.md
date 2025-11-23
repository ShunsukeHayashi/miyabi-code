---
title: "Entities Index"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "index"
tags: ["miyabi", "entities", "index"]
status: "published"
---

# Entities Index

**14 Core Data Entities in the Miyabi System**

← [[../INDEX|Back to Main Index]]

## 🎨 Entity-Relation Diagram

![[../assets/diagrams/Miyabi Entity-Relation Model - 12 Entities.png]]

*Complete visual representation of all 14 entities and their 39 relationships*

## 📊 Entity Categories

### Primary Entities (E1-E5)

Core entities that drive the Miyabi workflow:

| ID | Entity | Type | Description |
|----|--------|------|-------------|
| [[E1\|E1]] | **Issue** | GitHub Issue | Primary entity - GitHub Issue tracking |
| [[E2\|E2]] | **Task** | Task | Decomposed tasks from Issues |
| [[E3\|E3]] | **Agent** | AgentType | Autonomous agents (7 coding + 14 business) |
| [[E4\|E4]] | **PR** | Pull Request | GitHub Pull Requests |
| [[E5\|E5]] | **Label** | GitHub Label | Label system (57 labels, 11 categories) |

### Extended Entities (E6-E10)

Supporting entities for quality and operations:

| ID | Entity | Type | Description |
|----|--------|------|-------------|
| [[E6\|E6]] | **QualityReport** | Quality Report | Code quality analysis reports |
| [[E7\|E7]] | **Command** | Command | Claude Code slash commands (9 commands) |
| [[E8\|E8]] | **Escalation** | Escalation | Error escalation information |
| [[E9\|E9]] | **Deployment** | Deployment | Firebase deployment tracking |
| [[E10\|E10]] | **LDDLog** | LDD Log | Log-Driven Development execution logs |

### System Entities (E11-E14)

Infrastructure and organizational entities:

| ID | Entity | Type | Description |
|----|--------|------|-------------|
| [[E11\|E11]] | **DAG** | Directed Acyclic Graph | Task dependency graph |
| [[E12\|E12]] | **Worktree** | Git Worktree | Parallel execution foundation |
| [[E13\|E13]] | **DiscordServer** | Discord Server | Discord community integration |
| [[E14\|E14]] | **SubIssue** | Hierarchical Issue | Parent-child Issue relationships |

## 🔗 Entity Relationships

### Entity Lifecycle Flow

```
Issue (E1) 
  ↓ analyzed-by (R1)
Agent (E3)
  ↓ decomposed-into (R2)
Task[] (E2)
  ↓ assigned-to (R5)
Agent (E3)
  ↓ generates (R10)
PR (E4)
  ↓ reviewed-by (R19)
Agent (E3) [ReviewAgent]
  ↓ has (R20)
QualityReport (E6)
```

### Key Relationships

**Issue Processing:**
- [[../relations/R1|R1: analyzed-by]] - Issue → Agent (IssueAgent)
- [[../relations/R2|R2: decomposed-into]] - Issue → Task[]
- [[../relations/R3|R3: tagged-with]] - Issue → Label[]

**Task Execution:**
- [[../relations/R5|R5: assigned-to]] - Task → Agent
- [[../relations/R6|R6: depends-on]] - Task → Task (dependencies)
- [[../relations/R7|R7: part-of]] - Task → DAG
- [[../relations/R8|R8: runs-in]] - Task → Worktree

**Pull Request:**
- [[../relations/R4|R4: creates]] - Issue → PR
- [[../relations/R10|R10: generates]] - Agent → PR
- [[../relations/R19|R19: reviewed-by]] - PR → Agent (ReviewAgent)
- [[../relations/R20|R20: has]] - PR → QualityReport

**Complete relationship map**: [[../relations/INDEX|View all 39 relations →]]

## 📈 Entity Statistics

- **Total Entities**: 14
- **Primary Entities**: 5
- **Extended Entities**: 5
- **System Entities**: 4
- **Total Relations**: 39
- **Workflows Using Entities**: 5

## 🎯 Entity by Function

### Data Management
- [[E1|Issue]] - Primary data container
- [[E2|Task]] - Execution units
- [[E14|SubIssue]] - Hierarchical organization

### Execution
- [[E3|Agent]] - Autonomous executors
- [[E11|DAG]] - Dependency management
- [[E12|Worktree]] - Parallel execution

### Quality Control
- [[E6|QualityReport]] - Quality metrics
- [[E8|Escalation]] - Error handling

### Integration
- [[E4|PR]] - GitHub integration
- [[E5|Label]] - Metadata system
- [[E9|Deployment]] - Firebase integration
- [[E13|DiscordServer]] - Community integration

### Operations
- [[E7|Command]] - CLI operations
- [[E10|LDDLog]] - Development logging

## 🔍 Search by Tag

- `#entity` - All entities
- `#E1` - Specific entity (E1-E14)
- View in [[../INDEX#🔍 Search Tags|Main Index Search Tags]]

## 📚 Related Documentation

- [[../agents/INDEX|Agents Index]] - View all 21 agents
- [[../workflows/INDEX|Workflows Index]] - View all 5 workflows
- [[../relations/INDEX|Relations Index]] - View all 39 relationships

---

**Total Entities**: 14  
**Last Updated**: 2025-11-18
