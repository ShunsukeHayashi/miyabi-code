---
title: "Relations Index"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "index"
tags: ["miyabi", "relations", "index"]
status: "published"
---

# Relations Index

**39 Entity Relationships in the Miyabi System**

← [[../INDEX|Back to Main Index]]

## 🔗 Relation Categories

### Issue Lifecycle (R1-R4)

Core Issue processing relationships:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R1]] | analyzed-by | Issue | Agent | 1:1 |
| [[R2]] | decomposed-into | Issue | Task[] | 1:N |
| [[R3]] | tagged-with | Issue | Label[] | N:N |
| [[R4]] | creates | Issue | PR | 1:1 |

### Task Management (R5-R8)

Task assignment and execution:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R5]] | assigned-to | Task | Agent | N:1 |
| [[R6]] | depends-on | Task | Task | N:N |
| [[R7]] | part-of | Task | DAG | N:1 |
| [[R8]] | runs-in | Task | Worktree | N:1 |

### Agent Operations (R9-R15)

Agent execution relationships:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R9]] | executes | Agent | Task | 1:N |
| [[R10]] | generates | Agent | PR | 1:N |
| [[R11]] | creates | Agent | QualityReport | 1:N |
| [[R12]] | triggers | Agent | Escalation | 1:N |
| [[R13]] | performs | Agent | Deployment | 1:N |
| [[R14]] | logs-to | Agent | LDDLog | 1:N |
| [[R15]] | invoked-by | Agent | Command | 1:N |

### Label System (R16-R18)

Label relationships:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R16]] | belongs-to | Label | Category | N:1 |
| [[R17]] | triggers-transition | Label | State | 1:1 |
| [[R18]] | assigned-by | Label | Agent/User | N:1 |

### Pull Request Lifecycle (R19-R21)

PR processing:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R19]] | reviewed-by | PR | Agent | 1:1 |
| [[R20]] | has | PR | QualityReport | 1:1 |
| [[R21]] | attached-to | PR | Issue | 1:1 |

### Quality Control (R22-R23)

Quality assurance:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R22]] | evaluates | QualityReport | PR | 1:1 |
| [[R23]] | contains | QualityReport | Metrics | 1:N |

### DAG & Dependencies (R24-R25)

Dependency graph:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R24]] | decomposed-from | DAG | Issue | 1:1 |
| [[R25]] | contains | DAG | Task[] | 1:N |

### Worktree Management (R26-R28)

Parallel execution:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R26]] | executes | Worktree | Task | 1:N |
| [[R27]] | creates | Worktree | PR | N:1 |
| [[R28]] | belongs-to | Worktree | Issue | N:1 |

### Deployment (R29-R31)

CI/CD relationships:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R29]] | deploys | Deployment | PR | 1:1 |
| [[R30]] | targets | Deployment | Environment | 1:1 |
| [[R31]] | has-status | Deployment | Status | 1:1 |

### Escalation (R32-R33)

Error handling:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R32]] | escalates-to | Escalation | Target | 1:1 |
| [[R33]] | resolves | Escalation | Issue | 1:1 |

### Logging (R34-R35)

Development logging:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R34]] | records | LDDLog | Session | 1:1 |
| [[R35]] | contains | LDDLog | ToolInvocations | 1:N |

### Hierarchical Issues (R36-R39)

SubIssue relationships:

| ID | Relation | Source | Target | Cardinality |
|----|----------|--------|--------|-------------|
| [[R36]] | parent-of | Issue | SubIssue[] | 1:N |
| [[R37]] | child-of | SubIssue | Issue | N:1 |
| [[R38]] | sibling-of | SubIssue | SubIssue | N:N |
| [[R39]] | tracked-by | SubIssue | Label | N:N |

## 📊 Relation Statistics

- **Total Relations**: 39
- **1:1 Relations**: 14
- **1:N Relations**: 16
- **N:N Relations**: 9
- **Entity Coverage**: 14/14 entities (100%)

## 🎯 Relations by Type

### Ownership Relations
- analyzed-by, assigned-to, belongs-to, part-of

### Creation Relations
- creates, generates, decomposed-into, decomposed-from

### Execution Relations
- executes, runs-in, performs, invoked-by

### Quality Relations
- reviewed-by, has, evaluates, contains (metrics)

### Hierarchical Relations
- parent-of, child-of, sibling-of

### Status Relations
- tagged-with, has-status, triggers-transition

## 🔍 Key Relationship Patterns

### Issue → Task → PR Pattern

```
Issue (E1)
  ↓ R1: analyzed-by
Agent (E3)
  ↓ R2: decomposed-into
Task[] (E2)
  ↓ R5: assigned-to
Agent (E3)
  ↓ R4/R10: creates/generates
PR (E4)
```

### Quality Check Pattern

```
PR (E4)
  ↓ R19: reviewed-by
Agent (E3) [ReviewAgent]
  ↓ R11: creates
QualityReport (E6)
  ↓ R22: evaluates
PR (E4)
```

### Parallel Execution Pattern

```
Issue (E1)
  ↓ R24: decomposed-from
DAG (E11)
  ↓ R25: contains
Task[] (E2)
  ↓ R8: runs-in
Worktree[] (E12)
```

## 🔍 Search by Tag

- `#relation` - All relations
- `#R1` - Specific relation (R1-R39)

## 📚 Related Documentation

- [[../entities/INDEX|Entities Index]] - View all 14 entities
- [[../workflows/INDEX|Workflows Index]] - See relations in action
- [[../INDEX|Main Index]] - Complete system overview

---

**Total Relations**: 39  
**Last Updated**: 2025-11-18
