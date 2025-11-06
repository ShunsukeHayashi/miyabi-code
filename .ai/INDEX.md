# Miyabi Project - AI Artifacts Index

**Last Updated**: 2025-11-06
**Total Artifacts**: 20+

This index provides quick access to all AI-generated artifacts, reports, and documentation for the Miyabi project.

---

## 📊 Latest Updates (2025-11-06)

### Issue Review & Reorganization

**Comprehensive review of all 64 open issues completed**

- ✅ Created 4 new milestones
- ✅ Assigned all 38 previously unassigned issues
- ✅ Resolved 7 conflicting priority labels
- ✅ Added 30+ agent assignments
- ✅ Added 20+ phase labels
- ✅ Generated 4 PlantUML visualizations

**Quick Links**:
- [Issue Analysis Report](analysis/issue-review-2025-11-06.md)
- [Update Summary](reports/issue-update-summary-2025-11-06.md)
- [Diagrams Directory](diagrams/)

---

## 📂 Directory Structure

```
.ai/
├── INDEX.md                          # This file
├── analysis/                         # Detailed analysis reports
│   └── issue-review-2025-11-06.md   # Latest issue analysis
├── diagrams/                         # PlantUML visualizations
│   ├── README.md                    # Diagram documentation
│   ├── milestone-timeline.puml      # Gantt chart source
│   ├── milestone-timeline.png       # Timeline visualization (25KB)
│   ├── issue-distribution.puml      # Component diagram source
│   ├── issue-distribution.png       # Issue organization (129KB)
│   ├── priority-matrix.puml         # Priority grid source
│   ├── priority-matrix.png          # Priority visualization (140KB)
│   ├── agent-workflow.puml          # Activity diagram source
│   └── agent-workflow.png           # Workflow visualization (169KB)
├── logs/                             # Execution logs
├── plans/                            # Task planning documents
│   └── MASTER_RESTRUCTURING_PLAN.md # Project restructuring plan
├── parallel-reports/                 # Parallel execution reports
└── reports/                          # Summary reports
    └── issue-update-summary-2025-11-06.md
```

---

## 📋 Issue Management

### Latest Issue Review (2025-11-06)

**Files**:
- **Analysis**: [analysis/issue-review-2025-11-06.md](analysis/issue-review-2025-11-06.md)
  - Complete breakdown of all 64 issues
  - Milestone recommendations
  - Priority assessments
  - Agent assignments

- **Summary**: [reports/issue-update-summary-2025-11-06.md](reports/issue-update-summary-2025-11-06.md)
  - Executive summary of changes
  - Before/after statistics
  - Action items and next steps
  - Validation checklist

**Key Metrics**:
- Total Open Issues: 64
- Milestone Coverage: 100% (was 41%)
- Active Milestones: 8 (4 new)
- Priority Conflicts Resolved: 7
- Labels Added: 50+

---

## 📊 Visualizations

### PlantUML Diagrams

**Directory**: [diagrams/](diagrams/)

All diagrams include:
- Source `.puml` files (editable)
- Exported `.png` files (ready to use)
- Comprehensive documentation in `diagrams/README.md`

#### 1. Milestone Timeline
**File**: `milestone-timeline.png` (25KB)
**Type**: Gantt Chart
**Shows**: 8 milestones from Q4 2025 → Q2 2026 with dependencies

#### 2. Issue Distribution
**File**: `issue-distribution.png` (129KB)
**Type**: Component Diagram
**Shows**: 64 issues organized by milestone and feature area

#### 3. Priority Matrix
**File**: `priority-matrix.png` (140KB)
**Type**: Grid Layout
**Shows**: P0-P3 priority breakdown across milestones

#### 4. Agent Workflow
**File**: `agent-workflow.png` (169KB)
**Type**: Activity Diagram
**Shows**: Issue flow through 4 agent types and 5 phases

**View All**:
```bash
open .ai/diagrams/*.png
```

---

## 🎯 Milestones

### Active Milestones (8)

| # | Milestone | Issues | Due Date | Status |
|---|-----------|--------|----------|--------|
| 33 | Benchmark Evaluation | 13 | 2026-04-21 | Planning |
| 34 | Week 12: MVP Launch | 0 | 2026-01-14 | ✅ Complete |
| 35 | Week 16: Web UI Complete | 14 | 2026-02-11 | In Progress |
| 36 | Week 18: LINE Bot | 4 | 2026-02-25 | Planning |
| 38 | Desktop App MVP | 8 | 2026-03-15 | ⭐ New |
| 39 | KAMUI 4D Integration | 9 | 2026-03-01 | ⭐ New |
| 40 | Historical AI Project | 6 | 2026-04-01 | ⭐ New |
| 41 | Core Infrastructure Q1 | 10 | 2026-02-28 | ⭐ New |

---

## ⚡ Priority Distribution

| Priority | Count | % | Description |
|----------|-------|---|-------------|
| 🔥 P0-Critical | 1 | 2% | #402 Full SWE-bench evaluation |
| ⚠️ P1-High | 15 | 23% | Major features, critical bugs |
| 📊 P2-Medium | 35 | 55% | Standard features |
| 📝 P3-Low | 13 | 20% | Nice-to-have improvements |

**Top P1 Priorities**:
1. #612 - KAMUI 4D Epic
2. #635 - Desktop App Init
3. #396 - SWE-bench Pro Epic
4. #397 - AgentBench Epic
5. #615 - Worktree Management

---

## 🤖 Agent Assignments

| Agent | Issues | Primary Focus |
|-------|--------|---------------|
| **CodeGenAgent** | 28 | Feature implementation, refactoring |
| **CoordinatorAgent** | 9 | Epic management, task breakdown |
| **DeploymentAgent** | 5 | Infrastructure, CI/CD |
| **ReviewAgent** | 4 | Code review, documentation |
| **Unassigned** | 18 | Pending allocation |

---

## 📅 Planning Documents

### Master Plans

- **Restructuring Plan**: [plans/MASTER_RESTRUCTURING_PLAN.md](plans/MASTER_RESTRUCTURING_PLAN.md)
  - Project evolution roadmap
  - Phase breakdown (0-6)
  - Timeline: 2025-11-06 → 2026-02-28
  - Goal: Monolith → Ecosystem transformation

---

## 📝 Logs & Execution Reports

### Execution Logs
**Directory**: `logs/`

- Agent execution logs
- Task completion records
- Error logs and debugging info

### Parallel Execution Reports
**Directory**: `parallel-reports/`

- Multi-agent execution summaries
- Performance metrics
- Concurrency analytics

---

## 🔄 Update Workflow

### When to Update This Index

1. **After Issue Reviews**
   - Add new analysis reports
   - Update statistics
   - Link to updated diagrams

2. **After Major Changes**
   - New milestones created
   - Significant priority shifts
   - Agent reassignments

3. **Weekly**
   - Review and archive old reports
   - Update statistics
   - Regenerate visualizations if needed

### How to Regenerate Diagrams

```bash
cd /Users/shunsuke/Dev/miyabi-private/.ai/diagrams
plantuml -tpng *.puml
```

---

## 🔗 Quick Links

### GitHub
- [Issues](https://github.com/customer-cloud/miyabi-private/issues)
- [Milestones](https://github.com/customer-cloud/miyabi-private/milestones)
- [Projects](https://github.com/customer-cloud/miyabi-private/projects)

### Documentation
- [Main README](../README.md)
- [CLAUDE.md](../CLAUDE.md)
- [Entity-Relation Model](../docs/ENTITY_RELATION_MODEL.md)
- [Label System Guide](../docs/LABEL_SYSTEM_GUIDE.md)

### Context Modules
- [Context Index](../.claude/context/INDEX.md)
- [Core Rules](../.claude/context/core-rules.md)
- [Agents](../.claude/context/agents.md)
- [Architecture](../.claude/context/architecture.md)

---

## 📈 Metrics & Statistics

### Current Snapshot (2025-11-06)

**Issues**:
- Total Open: 64
- With Milestones: 64 (100%)
- With Agent: 46 (72%)
- With Phase: 54 (84%)

**Milestones**:
- Active: 8
- Completed: 1 (Week 12 MVP)
- Avg Issues per Milestone: 8

**Agents**:
- Active Agent Types: 4
- Most Loaded: CodeGenAgent (28 issues)
- Epic Coordinators: CoordinatorAgent (9 epics)

**Priority**:
- Critical (P0): 1 issue
- High (P1): 15 issues (focus area)
- Medium (P2): 35 issues (bulk of work)
- Low (P3): 13 issues (enhancements)

---

## 🎯 Recommended Actions

### Immediate (This Week)
1. Start KAMUI Epic #612 (P1-High)
2. Continue Web UI work (M35, 14 issues)
3. Kickoff Desktop App #635 (P1-High)

### Short-term (Next 2 Weeks)
4. Begin SWE-bench Pro evaluation (M33)
5. SDK integration planning (M41)

### Medium-term (Next Month)
6. Complete LINE Bot features (M36)
7. Advance KAMUI integration (M39)

---

## 📚 Using This Index

### For Daily Work
1. Check **Priority Distribution** for today's focus
2. Review **Agent Assignments** for your role
3. Use **Diagrams** to understand dependencies

### For Planning
1. Review **Milestones** section for timeline
2. Check **Analysis Report** for detailed breakdown
3. Use **Visualizations** for roadmap discussions

### For Reporting
1. Use **Update Summary** for stakeholder updates
2. Show **Diagrams** in presentations
3. Reference **Metrics** for progress tracking

---

**Maintained by**: Miyabi AI System
**Format**: Markdown Index
**Auto-generated**: No (manually curated)
**Update Frequency**: After major changes

---

*This index is the central hub for all AI-generated artifacts in the Miyabi project. Keep it updated to maintain project visibility and organization.*
