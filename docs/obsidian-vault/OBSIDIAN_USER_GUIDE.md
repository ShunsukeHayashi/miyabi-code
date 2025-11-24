---
title: "Miyabi Obsidian User Guide"
created: 2025-11-23
updated: 2025-11-23
author: "Claude Code"
category: "guide"
tags:
  - guide
  - obsidian
  - miyabi
status: "published"
---

# Miyabi Obsidian User Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-23

---

## Quick Start

### 1. Installation

```bash
# Install required plugins (in Obsidian)
Settings > Community plugins > Browse

# Required (P0):
- Dataview
- Templater
- Git
- Calendar

# Recommended (P1):
- tldraw
- Kanban
- Tasks
```

### 2. First Steps

1. Open `docs/obsidian-vault/` as vault in Obsidian
2. Go to [[INDEX]] for navigation
3. Explore [[QUICK_REFERENCE]] for common patterns

---

## Templates

### Available Templates

| Template | Purpose | Location |
|----------|---------|----------|
| `issue.md` | GitHub Issue tracking | `templates/` |
| `pr.md` | Pull Request docs | `templates/` |
| `daily.md` | Daily notes | `templates/` |
| `sprint.md` | Sprint planning | `templates/` |
| `agent-report.md` | Agent execution logs | `templates/` |
| `meeting.md` | Meeting notes | `templates/` |
| `decision.md` | ADR (Architecture Decision) | `templates/` |
| `retrospective.md` | Sprint retro | `templates/` |
| `drawing.md` | tldraw metadata | `templates/` |

### Using Templates

**With Templater plugin:**
1. Create new note
2. `Ctrl/Cmd + P` → "Templater: Insert template"
3. Select template

**Keyboard shortcut:**
```
Alt + E → Select template
```

---

## Tag System

### Hierarchical Tags (57 Labels)

```yaml
# Priority
#priority/P0      # Critical
#priority/P1      # High
#priority/P2      # Medium
#priority/P3      # Low
#priority/P4      # Trivial

# Type
#type/feature
#type/bug
#type/refactor
#type/docs
#type/test
#type/chore
#type/security
#type/performance

# Status
#status/backlog
#status/ready
#status/in-progress
#status/review
#status/blocked
#status/done

# Phase
#phase/analysis
#phase/design
#phase/implementation
#phase/testing
#phase/review
#phase/deployment

# Size
#size/XS    # ~1h
#size/S     # 1-4h
#size/M     # 4-8h
#size/L     # 1-3d
#size/XL    # 3d+

# Agent
#agent/CoordinatorAgent
#agent/CodeGenAgent
#agent/ReviewAgent
# ... (21 agents)

# Component
#component/core
#component/cli
#component/web-api
#component/agents

# Area
#area/frontend
#area/backend
#area/infrastructure

# Integration
#integration/github
#integration/discord
#integration/lark
```

### Tag Combination Example

```yaml
tags:
  - "#priority/P1"
  - "#type/feature"
  - "#status/in-progress"
  - "#phase/implementation"
  - "#size/M"
  - "#agent/CodeGenAgent"
  - "#component/web-api"
```

---

## tldraw Integration

### Creating Drawings

1. **New drawing**: `Ctrl/Cmd + Shift + D`
2. **Or**: Create file with `.tldraw` extension

### Directory Structure

```
drawings/
├── architecture/    # System diagrams
├── sprints/         # Sprint planning
├── issues/          # Issue analysis
├── console/         # UI designs
└── agents/          # Agent visualizations
```

### Make Real (AI Code Generation)

1. Draw UI in tldraw
2. Click "Make Real" button
3. AI generates React + Tailwind code
4. Iterate: add annotations → regenerate

**Config**: `.claude/makereal-config.yaml`

---

## Daily Notes

### Auto-generation

Daily notes are automatically created each morning at 06:00.

### Manual Creation

1. Click date in Calendar plugin
2. Or: `Ctrl/Cmd + P` → "Create daily note"

### Structure

```markdown
# YYYY-MM-DD (Day)

## Morning Planning
- Today's focus
- Priority issues

## Work Log
- Time-blocked entries

## End of Day Review
- Completed
- Blocked
- Learnings

## Metrics
- Issues closed
- PRs merged
- Commits
- Agent runs
```

---

## Sprint Management

### Sprint Cycle

- **Duration**: 2 weeks
- **Start**: Monday
- **Retrospective**: Friday of week 2

### Sprint Note

```
sprints/
└── sprint-42.md
```

Contains:
- Sprint goal
- Backlog (P0/P1/P2)
- Daily note links
- Velocity metrics
- Burndown data
- Retrospective

---

## Dataview Queries

### Active Issues

```dataview
TABLE
  status as Status,
  priority as Priority,
  assignee as Assignee
FROM "issues"
WHERE status != "done"
SORT priority ASC
```

### Today's Agent Runs

```dataview
LIST
FROM "agent-reports"
WHERE date(created) = date(today)
SORT created DESC
```

### Sprint Backlog

```dataview
TABLE
  sum(story_points) as "Points",
  length(rows) as "Count"
FROM "issues"
WHERE contains(tags, "#sprint/42")
GROUP BY status
```

---

## Graph View

### Color Coding

| Color | Meaning |
|-------|---------|
| 🔴 Red | P0/Critical, Bugs |
| 🟠 Orange | P1/High, In-progress |
| 🟡 Yellow | P2/Medium |
| 🟢 Green | Features |
| 🔵 Blue | Agents |
| 🟣 Purple | Workflows |
| ⚫ Gray | Done/Completed |

### Navigation

1. Click node to open note
2. Drag to rearrange
3. Scroll to zoom
4. Filter by tags in sidebar

---

## MCP Integration

### Available Operations

```bash
# Create note
mcp-obsidian create_note "title" "content"

# Update note
mcp-obsidian update_note "path" "content"

# Search
mcp-obsidian search "query"

# Create daily note
mcp-obsidian create_daily_note "2025-11-23"

# Create drawing
mcp-obsidian create_drawing "path" "template"
```

### Automation

- **Issue created** → Auto-generate issue note
- **PR merged** → Update daily note
- **Agent run** → Create agent report

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New note |
| `Ctrl/Cmd + O` | Quick open |
| `Ctrl/Cmd + P` | Command palette |
| `Ctrl/Cmd + G` | Graph view |
| `Ctrl/Cmd + Shift + D` | New tldraw |
| `Ctrl/Cmd + E` | Toggle tldraw/markdown |
| `Alt + E` | Insert template |

---

## Troubleshooting

### Tags not showing in graph

1. Check tag format: `#category/name`
2. Verify graph.json color groups
3. Reload Obsidian

### Dataview queries not working

1. Install Dataview plugin
2. Enable JavaScript queries in settings
3. Check query syntax

### Templates not appearing

1. Configure template folder in Templater settings
2. Point to `templates/` directory

### tldraw not loading

1. Install tldraw plugin from community
2. Check file extension is `.tldraw`
3. Restart Obsidian

---

## Best Practices

### Naming Conventions

```
# Issues
issues/123.md

# Daily notes
daily-notes/2025-11-23.md

# Sprints
sprints/sprint-42.md

# Drawings
drawings/architecture/system-overview.tldraw
```

### Linking

```markdown
# Internal links
[[issues/123|Issue #123]]
[[agents/CodeGenAgent]]

# Embedded drawings
![[drawings/architecture/overview.tldraw]]
```

### Tags

- Always use hierarchical format
- Include multiple relevant tags
- Update status tags as work progresses

---

## Resources

- **Main Index**: [[INDEX]]
- **Quick Reference**: [[QUICK_REFERENCE]]
- **Diagrams Gallery**: [[DIAGRAMS_GALLERY]]
- **Design Doc**: [[planning/2025-11-23-obsidian-enhancement-design]]

---

**Need help?** Check [[INDEX]] or ask Claude Code!
