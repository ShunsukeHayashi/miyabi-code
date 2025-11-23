---
title: "Labels Index"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Auto-Generator"
category: "index"
tags: ["miyabi", "labels", "index"]
status: "published"
---

# Labels Index

**57 GitHub Labels across 11 Categories**

← [[../INDEX|Back to Main Index]]

## 🏷️ Label System Overview

The Miyabi system uses a comprehensive 57-label classification system organized into 11 functional categories for precise Issue management and workflow automation.

| Category | Count | Role | Description |
|----------|-------|------|-------------|
| **STATE** | 8 | Lifecycle Management | Issue state tracking |
| **AGENT** | 6 | Agent Assignment | Agent type assignment |
| **TYPE** | 6 | Type Classification | Issue type identification |
| **PRIORITY** | 4 | Priority Management | Urgency and importance |
| **COMPLEXITY** | 5 | Effort Estimation | Implementation complexity |
| **IMPACT** | 4 | Impact Assessment | Business and technical impact |
| **DEPLOYMENT** | 3 | Deployment Tracking | Deployment stages |
| **QUALITY** | 3 | Quality Control | Code quality status |
| **TESTING** | 4 | Test Coverage | Testing requirements |
| **APPROVAL** | 3 | Approval Workflow | Review and approval status |
| **HIERARCHY** | 4 | Issue Organization | Hierarchical structure |

**Total Labels**: 57

## 📋 Labels by Category

### STATE (8 labels) - Lifecycle Management

Issue state progression:

| Label | Emoji | Description | Next State |
|-------|-------|-------------|------------|
| `state:pending` | ⏳ | Waiting to start | analyzing |
| `state:analyzing` | 🔍 | Being analyzed by IssueAgent | implementing |
| `state:implementing` | 💻 | Code being written | reviewing |
| `state:reviewing` | 👀 | Under code review | done |
| `state:done` | ✅ | Completed | - |
| `state:blocked` | 🚫 | Blocked by dependencies | pending/implementing |
| `state:failed` | ❌ | Failed (tests/build) | implementing |
| `state:paused` | ⏸️ | Temporarily paused | pending |

**Assigned by**: IssueAgent, CoordinatorAgent, ReviewAgent

### AGENT (6 labels) - Agent Assignment

Agent type assignment for parallel execution:

| Label | Emoji | Character | Description |
|-------|-------|-----------|-------------|
| `agent:coordinator` | 🎯 | 指揮者アーク | DAG orchestration |
| `agent:codegen` | 🧠 | 天才コーダーリリア | Code generation |
| `agent:review` | 🔎 | 厳格審査官クリスタ | Quality review |
| `agent:issue` | 📊 | 戦略家ソフィア | Issue analysis |
| `agent:pr` | 🔀 | 統合の守護者ノア | PR creation |
| `agent:deployment` | 🚀 | デプロイ職人エリオ | Deployment |

**Assigned by**: IssueAgent, CoordinatorAgent

### TYPE (6 labels) - Type Classification

Issue type identification:

| Label | Emoji | Description |
|-------|-------|-------------|
| `type:feature` | ✨ | New feature implementation |
| `type:bug` | 🐛 | Bug fix |
| `type:refactor` | ♻️ | Code refactoring |
| `type:docs` | 📚 | Documentation update |
| `type:test` | 🧪 | Test addition/update |
| `type:deployment` | 🚀 | Deployment task |

**Assigned by**: IssueAgent

### PRIORITY (4 labels) - Priority Management

Urgency and importance levels:

| Label | Color | Description |
|-------|-------|-------------|
| `priority:P0-critical` | 🔴 Red | Highest priority - immediate action |
| `priority:P1-high` | 🟠 Orange | High priority - next sprint |
| `priority:P2-medium` | 🟡 Yellow | Medium priority - backlog |
| `priority:P3-low` | 🟢 Green | Low priority - future |

**Assigned by**: IssueAgent

### COMPLEXITY (5 labels) - Effort Estimation

Implementation effort estimation:

| Label | Estimate | Description |
|-------|----------|-------------|
| `complexity:trivial` | < 1h | Simple change, minimal effort |
| `complexity:simple` | 1-4h | Straightforward implementation |
| `complexity:moderate` | 4-8h | Moderate complexity |
| `complexity:complex` | 1-3 days | Complex implementation |
| `complexity:epic` | > 3 days | Large-scale feature |

**Assigned by**: IssueAgent

### IMPACT (4 labels) - Impact Assessment

Business and technical impact:

| Label | Scope | Description |
|-------|-------|-------------|
| `impact:critical` | System-wide | Critical system impact |
| `impact:high` | Multiple components | Significant impact |
| `impact:medium` | Single component | Moderate impact |
| `impact:low` | Isolated | Minimal impact |

**Assigned by**: IssueAgent

### DEPLOYMENT (3 labels) - Deployment Tracking

Deployment stage tracking:

| Label | Stage | Description |
|-------|-------|-------------|
| `deployment:staging` | Staging | Deployed to staging environment |
| `deployment:production` | Production | Deployed to production |
| `deployment:rollback` | Rollback | Rolled back due to issues |

**Assigned by**: DeploymentAgent

### QUALITY (3 labels) - Quality Control

Code quality status:

| Label | Status | Description |
|-------|--------|-------------|
| `quality:excellent` | ✅ 90%+ | Excellent code quality |
| `quality:good` | ✔️ 70-89% | Good code quality |
| `quality:needs-improvement` | ⚠️ < 70% | Quality issues detected |

**Assigned by**: ReviewAgent

### TESTING (4 labels) - Test Coverage

Testing requirements:

| Label | Requirement | Description |
|-------|-------------|-------------|
| `test:unit` | Unit tests | Requires unit test coverage |
| `test:integration` | Integration tests | Requires integration testing |
| `test:e2e` | E2E tests | Requires end-to-end testing |
| `test:manual` | Manual testing | Requires manual verification |

**Assigned by**: IssueAgent, ReviewAgent

### APPROVAL (3 labels) - Approval Workflow

Review and approval status:

| Label | Status | Description |
|-------|--------|-------------|
| `approval:required` | Pending | Awaiting approval |
| `approval:approved` | Approved | Approved for merge |
| `approval:rejected` | Rejected | Changes requested |

**Assigned by**: ReviewAgent

### HIERARCHY (4 labels) - Issue Organization

Hierarchical Issue structure (SubIssue support):

| Label | Position | Description |
|-------|----------|-------------|
| `hierarchy:root` | 🌳 Root | Root Issue (no parent) |
| `hierarchy:parent` | 📂 Parent | Has child Issues |
| `hierarchy:child` | 📄 Child | Has parent Issue |
| `hierarchy:leaf` | 🍃 Leaf | No child Issues (terminal node) |

**Assigned by**: IssueAgent

## 📊 Label Statistics

- **Total Labels**: 57
- **Categories**: 11
- **Auto-assigned Labels**: 50 (87.7%)
- **Manual Labels**: 7 (12.3%)
- **State Labels**: 8 (14%)
- **Classification Labels**: 15 (26%)

## 🔄 Label Workflow

### Automatic Label Assignment

```
Issue Created
  ↓
IssueAgent analyzes Issue
  ↓
Infers labels from content:
  - TYPE: feature/bug/refactor/docs/test/deployment
  - PRIORITY: P0-P3
  - COMPLEXITY: trivial/simple/moderate/complex/epic
  - IMPACT: critical/high/medium/low
  - TESTING: unit/integration/e2e/manual
  - HIERARCHY: root/parent/child/leaf
  ↓
CoordinatorAgent adds:
  - STATE: pending → analyzing → implementing → reviewing → done
  - AGENT: coordinator/codegen/review/issue/pr/deployment
  ↓
ReviewAgent adds:
  - QUALITY: excellent/good/needs-improvement
  - APPROVAL: required/approved/rejected
  ↓
DeploymentAgent adds:
  - DEPLOYMENT: staging/production/rollback
```

## 🎯 Label Combinations

### Typical Issue Label Set

**Feature Implementation:**
```
- type:feature
- priority:P1-high
- complexity:moderate
- impact:high
- state:implementing
- agent:codegen
- test:unit
- test:integration
```

**Bug Fix:**
```
- type:bug
- priority:P0-critical
- complexity:simple
- impact:critical
- state:implementing
- agent:codegen
- test:unit
```

**Documentation Update:**
```
- type:docs
- priority:P2-medium
- complexity:trivial
- impact:low
- state:implementing
- agent:codegen
```

## 🔍 Search by Category

- Search for specific category: `tag:#state` or `tag:#priority`
- Filter by label: `state:implementing` or `priority:P0-critical`

## 📚 Related Documentation

- [[../entities/E5|Entity E5: Label]] - Label entity definition
- [[../entities/E1|Entity E1: Issue]] - Issue entity with labels
- [[../workflows/W1|Workflow W1]] - Issue Processing with label inference

---

**Total Labels**: 57 across 11 categories  
**Last Updated**: 2025-11-18
