# Miyabi Project Diagrams

**Generated**: 2025-11-06
**Source**: Issue review and reorganization

This directory contains PlantUML diagrams visualizing the current state of the Miyabi project after the comprehensive issue review and reorganization.

---

## 📊 Available Diagrams

### 1. Milestone Timeline (`milestone-timeline.puml` / `.png`)

**Type**: Gantt Chart
**Purpose**: Visualizes all 8 active milestones on a timeline from Q4 2025 to Q2 2026

**Shows**:
- Milestone durations and due dates
- Progress percentages
- Dependencies between milestones
- Issue counts per milestone
- Completed milestones (Week 12 MVP)

**Key Insights**:
- M35 (Web UI) and M41 (Infrastructure) run through Q4 2025
- M39 (KAMUI) and M38 (Desktop) are critical Q1 2026 deliverables
- M33 (Benchmark) extends through Q1 2026
- Clear dependency chains: KAMUI → Desktop, Infrastructure → Benchmarks

**File Size**: ~25KB PNG

---

### 2. Issue Distribution (`issue-distribution.puml` / `.png`)

**Type**: Component Diagram
**Purpose**: Shows how 64 open issues are organized across milestones and their relationships

**Shows**:
- All 8 milestones as packages with color coding
- Epic issues and their sub-tasks
- Dependencies between issues
- Priority and agent distribution stats
- Issue groupings by feature area

**Key Insights**:
- Clear epic → sub-task hierarchies
- KAMUI epic (#612) has 8 dependent issues
- Benchmark evaluation split into 2 major epics (SWE-bench & AgentBench)
- Desktop app has 4 main feature groups
- Core Infrastructure supports benchmark work

**Color Coding**:
- Purple: Benchmark Evaluation
- Blue: Web UI Complete
- Cyan: Desktop App MVP
- Red: KAMUI 4D Integration
- Green: Historical AI Project
- Orange: Core Infrastructure
- Magenta: LINE Bot Release

**File Size**: ~129KB PNG

---

### 3. Priority Matrix (`priority-matrix.puml` / `.png`)

**Type**: Grid Layout
**Purpose**: Visualizes all 64 issues organized by priority level (P0-P3)

**Shows**:
- 4 priority tiers with color coding
- Issue distribution per priority and milestone
- Specific issue numbers for each priority level
- Priority statistics and percentages
- Top 5 highest priority items highlighted

**Key Insights**:
- Only 1 P0-Critical issue: #402 (Full SWE-bench evaluation)
- 15 P1-High issues (23%) spread across 6 milestones
- 35 P2-Medium issues (55%) - largest group
- 13 P3-Low issues (20%) - mostly enhancements
- KAMUI Epic (#612) and Desktop Init (#635) are top P1 priorities

**Priority Distribution**:
- **P0**: 🔥 Critical (1) - Red
- **P1**: ⚠️ High (15) - Orange
- **P2**: 📊 Medium (35) - Yellow
- **P3**: 📝 Low (13) - Green

**File Size**: ~140KB PNG

---

### 4. Agent Workflow (`agent-workflow.puml` / `.png`)

**Type**: Activity/Flow Diagram
**Purpose**: Shows how issues flow through agents and execution phases

**Shows**:
- 4 main agent types with issue counts
- Issue board with 5 workflow phases
- 8 milestones as execution targets
- Git Worktree system for parallel execution
- Flow from issue creation to completion
- Agent responsibilities and assignments

**Key Insights**:
- CodeGenAgent handles most issues (28)
- CoordinatorAgent manages epics (9)
- Clear phase progression: Pending → Planning → Implementation → Testing → Deployment
- Worktree system enables parallel execution
- Each agent has specific milestone focus

**Agent Breakdown**:
- 🎨 **CoordinatorAgent** (9 issues): Epic management, task breakdown
- 💻 **CodeGenAgent** (28 issues): Feature development, most active
- 📋 **ReviewAgent** (4 issues): Code review, documentation
- 🚀 **DeploymentAgent** (5 issues): Infrastructure, CI/CD

**File Size**: ~169KB PNG

---

## 🎯 How to Use These Diagrams

### For Project Planning
1. **Timeline**: Use milestone-timeline to understand delivery schedule
2. **Distribution**: Use issue-distribution to see work breakdown
3. **Priority**: Use priority-matrix for sprint planning and resource allocation

### For Daily Standup
- Check agent-workflow to understand current task assignments
- Review priority-matrix for today's top priorities
- Use issue-distribution to track epic progress

### For Stakeholder Updates
- Show milestone-timeline for roadmap discussions
- Present priority-matrix for priority alignment
- Use issue-distribution to explain project scope

### For Development
- agent-workflow shows which agent to use for each task type
- issue-distribution reveals dependencies before starting work
- priority-matrix helps decide what to work on next

---

## 🔄 Regenerating Diagrams

To regenerate PNG files from PlantUML source:

```bash
cd /Users/shunsuke/Dev/miyabi-private/.ai/diagrams

# Generate all diagrams
plantuml -tpng *.puml

# Generate specific diagram
plantuml -tpng milestone-timeline.puml

# Generate SVG instead of PNG
plantuml -tsvg *.puml

# With verbose output
plantuml -v -tpng *.puml
```

---

## 📝 Editing PlantUML Files

### Prerequisites
- PlantUML installed: `brew install plantuml`
- Java runtime required for PlantUML
- Optional: VS Code with PlantUML extension for live preview

### File Format
All `.puml` files use PlantUML syntax:
- Gantt charts for timelines
- Component diagrams for distributions
- Activity diagrams for workflows
- Rectangle/card layouts for matrices

### Themes
All diagrams use `!theme vibrant` for consistent, modern styling.

### Color Schemes
Consistent color coding across all diagrams:
- **Benchmark**: Purple (#673AB7)
- **Web UI**: Blue (#2196F3)
- **LINE Bot**: Magenta (#9C27B0)
- **Desktop**: Cyan (#00BCD4)
- **KAMUI**: Red (#F44336)
- **Historical**: Green (#8BC34A)
- **Infrastructure**: Orange (#FF9800)

---

## 📈 Statistics Summary

Based on the diagrams:

| Metric | Value |
|--------|-------|
| Total Open Issues | 64 |
| Active Milestones | 8 |
| Agent Types | 4 |
| Workflow Phases | 5 |
| Priority Levels | 4 |
| Epics with Sub-tasks | 4 |
| Average Issues per Milestone | 8 |

---

## 🔗 Related Documentation

- **Analysis Report**: `../.ai/analysis/issue-review-2025-11-06.md`
- **Update Summary**: `../.ai/reports/issue-update-summary-2025-11-06.md`
- **GitHub Milestones**: https://github.com/customer-cloud/miyabi-private/milestones
- **Issue Board**: https://github.com/customer-cloud/miyabi-private/issues

---

## 📅 Update History

- **2025-11-06**: Initial diagram creation after comprehensive issue review
  - Created 4 PlantUML diagrams
  - Generated PNG exports
  - Documented all visualizations

---

**Note**: These diagrams are automatically generated from the current project state. Regenerate after major issue updates or milestone changes to keep them current.
