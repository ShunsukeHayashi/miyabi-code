# .ai/ Directory Structure

**Last Updated**: 2025-11-12
**Maintainer**: Miyabi Project
**Purpose**: Organized storage for AI-driven development artifacts

---

## Overview

This directory contains all artifacts generated and managed by the Miyabi autonomous development system, including plans, reports, logs, metrics, and diagrams.

## Directory Structure

```
.ai/
├── README.md                    # This file
├── INDEX.md                     # Project-wide index
├── PROJECT_STATUS_REPORT.md     # Current project status
├── REBOOT_RECOVERY_PLAN.md      # Emergency recovery procedures
├── prd.md                       # Product requirements
├── arch.md                      # Architecture overview
│
├── plans/                       # Execution plans and strategies
│   ├── active/                  # Currently active plans
│   ├── completed/               # Successfully completed plans
│   ├── archived/                # Historical/deprecated plans
│   └── issues/                  # Issue-specific plans (by issue number)
│
├── reports/                     # Generated reports
│   ├── sprints/                 # Sprint completion reports
│   ├── metrics/                 # Performance and KPI reports
│   ├── analysis/                # Deep-dive analysis reports
│   └── archived/                # Old reports (>30 days)
│
├── logs/                        # Execution logs
│   ├── infinity/                # Infinity mode execution logs
│   ├── agents/                  # Agent execution logs
│   ├── errors/                  # Error and debug logs
│   └── archived/                # Old logs (>30 days)
│
├── metrics/                     # Performance metrics
│   ├── executor-metrics.json   # Executor performance data
│   └── performance-metrics.json # System performance data
│
├── diagrams/                    # Architecture diagrams
│   ├── INDEX.md                 # Diagram index
│   ├── README.md                # Diagram documentation
│   ├── activity/                # Activity diagrams
│   ├── architecture/            # Architecture diagrams
│   ├── class/                   # Class diagrams
│   ├── component/               # Component diagrams
│   ├── deployment/              # Deployment diagrams
│   ├── mindmap/                 # Mind maps
│   ├── sequence/                # Sequence diagrams
│   ├── state/                   # State diagrams
│   └── usecase/                 # Use case diagrams
│
├── cache/                       # Temporary cache files
│   └── lint-diagnostics.json   # Lint cache
│
├── config/                      # Configuration files
│   └── pane-mapping.json       # tmux pane mappings
│
├── context/                     # Context-specific files
│   └── lint/                    # Lint context
│
├── debug/                       # Debug artifacts
│   └── codex-crash-*.tar.gz    # Crash dumps
│
├── queue/                       # Task queue data
│   └── tasks.json              # Queued tasks
│
├── registry/                    # Agent registry
│   └── agent-registry.json     # Registered agents
│
├── state/                       # System state tracking
│   ├── agent-states.json       # Agent states
│   ├── system-health.json      # System health
│   ├── ultimate-failsafe.json  # Failsafe state
│   └── watchdog-state.json     # Watchdog state
│
├── sessions/                    # Session data
│   ├── sessions.json           # Session metadata
│   ├── logs/                   # Session logs
│   └── claude-code-x/          # Claude Code sessions
│
├── session-reports/             # Historical session reports
│   └── session-*.md            # Individual session reports
│
├── orchestra/                   # Orchestra coordination
│   ├── desktop-feed.json       # Desktop feed data
│   └── pane-map.json           # Pane mappings
│
├── orchestra-assignments/       # Orchestra task assignments
│   ├── README.md               # Assignment documentation
│   └── *.yaml                  # Assignment files
│
├── analysis/                    # Project analysis
│   └── issue-review-*.md       # Issue reviews
│
├── refactoring/                 # Refactoring tracking
│   ├── phase1-completion-report.md
│   ├── phase2-architectural-decision.md
│   └── phase2-completion-report.md
│
├── reviews/                     # Code and issue reviews
│   └── issue-*-review.md       # Issue reviews
│
├── sprints/                     # Sprint planning
│   └── sprint-*.md             # Sprint plans
│
├── tests/                       # Test artifacts
│   └── automation/             # Test automation
│
├── monitoring/                  # System monitoring
│   └── snapshots/              # State snapshots
│
├── codex-tasks/                 # Codex-specific tasks
│   ├── README.md               # Codex documentation
│   └── CODEX_SESSION_SUMMARY_*.md
│
├── schemas/                     # Data schemas
│   └── Autopilot.yaml          # Autopilot schema
│
└── trace-logs/                  # Trace logging
```

---

## Usage Guidelines

### Plans

**Active Plans** (`plans/active/`)
- Current sprint plans
- Ongoing execution plans
- Task structures and references
- Move to `completed/` when finished

**Completed Plans** (`plans/completed/`)
- Successfully executed plans
- Reference material for similar tasks
- Move to `archived/` after 30 days

**Archived Plans** (`plans/archived/`)
- Historical documentation
- Strategic planning documents
- Deprecated approaches
- Keep for reference only

**Issue Plans** (`plans/issues/`)
- Organized by issue number (e.g., `plans/issues/813/`)
- Contains issue-specific planning documents
- Automatically created by agents
- Clean up when issue is closed and merged

### Reports

**Sprint Reports** (`reports/sprints/`)
- Sprint completion summaries
- Infinity mode execution reports
- Sprint retrospectives

**Metrics Reports** (`reports/metrics/`)
- Performance analysis
- KPI tracking
- System benchmarks

**Analysis Reports** (`reports/analysis/`)
- Deep-dive investigations
- Issue processing analysis
- System operational status
- Test reports

### Logs

**Infinity Logs** (`logs/infinity/`)
- Infinity mode execution logs
- Progress tracking
- Sprint execution details

**Agent Logs** (`logs/agents/`)
- Individual agent execution logs
- Multi-codex execution logs
- System operation logs
- tmux orchestration logs

**Error Logs** (`logs/errors/`)
- Error traces
- Debug information
- Crash dumps (reference only - actual dumps in `debug/`)

### Metrics

**Format**: JSON files containing performance data
**Frequency**: Updated per execution/sprint
**Retention**: Keep all metrics for trend analysis

### Diagrams

**Organization**: By diagram type (activity, sequence, architecture, etc.)
**Format**: PlantUML (.puml) and generated images (.png)
**Index**: See `diagrams/INDEX.md` for complete list

---

## Maintenance

### Retention Policy

| Category | Active | Archive After | Delete After |
|----------|--------|---------------|--------------|
| Plans (active) | Current sprint | Sprint complete | Move to completed |
| Plans (completed) | 30 days | 30 days | Move to archived |
| Plans (archived) | Indefinite | N/A | Never |
| Reports | 60 days | 60 days | 1 year |
| Logs | 30 days | 30 days | 90 days |
| Metrics | Indefinite | N/A | Never |
| Diagrams | Indefinite | N/A | Never |
| Cache | 7 days | N/A | 7 days |

### Cleanup Commands

```bash
# Archive old completed plans (>30 days)
find .ai/plans/completed/ -type f -mtime +30 -exec mv {} .ai/plans/archived/ \;

# Archive old reports (>60 days)
find .ai/reports/sprints/ -type f -mtime +60 -exec mv {} .ai/reports/archived/ \;
find .ai/reports/analysis/ -type f -mtime +60 -exec mv {} .ai/reports/archived/ \;

# Archive old logs (>30 days)
find .ai/logs/infinity/ -type f -mtime +30 -exec mv {} .ai/logs/archived/ \;
find .ai/logs/agents/ -type f -mtime +30 -exec mv {} .ai/logs/archived/ \;

# Delete very old logs (>90 days)
find .ai/logs/archived/ -type f -mtime +90 -delete

# Clear cache (>7 days)
find .ai/cache/ -type f -mtime +7 -delete
```

### Automated Cleanup

The Miyabi CLI includes automated cleanup:

```bash
# Run comprehensive cleanup
miyabi cleanup --age 30

# Dry run to see what would be cleaned
miyabi cleanup --age 30 --dry-run

# Aggressive cleanup (for space recovery)
miyabi cleanup --age 7 --aggressive
```

---

## Integration with Miyabi

### Agent Integration

Agents automatically:
1. Create issue-specific plan directories
2. Generate execution logs in appropriate categories
3. Update metrics after task completion
4. Generate reports for sprint completion

### tmux Orchestra Integration

The tmux orchestra system:
- Writes pane mappings to `.ai/orchestra/pane-map.json`
- Tracks agent states in `.ai/state/agent-states.json`
- Logs execution to `.ai/logs/agents/`

### Session Management

Session data is stored in:
- `.ai/sessions/sessions.json` - Session metadata
- `.ai/sessions/logs/` - Individual session logs
- `.ai/session-reports/` - Historical session reports

---

## Best Practices

### For Developers

1. **Check active plans first**: Before starting work, review `.ai/plans/active/`
2. **Read relevant logs**: Check `.ai/logs/agents/` for recent execution history
3. **Review metrics**: Monitor `.ai/metrics/` for performance trends
4. **Update documentation**: Keep README files updated when structure changes

### For Agents

1. **Use correct directories**: Follow the structure for all generated files
2. **Clean up after completion**: Move files to appropriate directories
3. **Generate meaningful names**: Use timestamps and descriptive names
4. **Update indexes**: Keep INDEX.md files current

### For System Maintenance

1. **Run cleanup weekly**: Execute `miyabi cleanup` regularly
2. **Monitor disk usage**: Check `.ai/` directory size
3. **Archive completed work**: Move finished items to archived directories
4. **Backup metrics**: Metrics are valuable - back them up regularly

---

## File Naming Conventions

### Plans
- Active: `<task-name>-plan.md`
- Execution: `EXECUTION_PLAN_<date>.md`
- Daily: `DAILY_TASKS_<date>.md`
- Issue: `plans/issues/<issue-number>/Plans-<timestamp>.md`

### Reports
- Sprint: `SPRINT<n>_COMPLETION.md` or `sprint-<date>.md`
- Analysis: `<topic>-analysis-<date>.md`
- Metrics: `<metric-type>-<date>.md`

### Logs
- Infinity: `infinity-sprint-<timestamp>.md`
- Agent: `<agent-name>-<timestamp>.log`
- Error: `<component>-error-<timestamp>.log`

### Metrics
- Timestamped: `metrics-<timestamp>.json`
- Named: `<metric-type>-metrics.json`

---

## Troubleshooting

### Common Issues

**Q: Where did my plan file go?**
A: Check `plans/active/`, `plans/completed/`, or `plans/archived/` in that order.

**Q: Logs are too large**
A: Run `miyabi cleanup --age 30` to archive old logs.

**Q: Can't find issue-specific plans**
A: Look in `plans/issues/<issue-number>/`

**Q: Metrics file is missing**
A: Metrics are generated after task execution. Check if the task completed successfully.

**Q: Need to recover archived file**
A: All archived files are retained. Check the appropriate `archived/` subdirectory.

---

## Change Log

### 2025-11-12 - v2.0 (Major Reorganization)
- Created hierarchical directory structure
- Separated plans into active/completed/archived/issues
- Organized reports by category
- Categorized logs by type
- Moved 124 issue directories to `plans/issues/`
- Archived completed strategic plans
- Added comprehensive documentation

### 2025-10-01 - v1.0 (Initial Structure)
- Basic `.ai/` directory structure
- Flat plan and report directories
- Mixed log files

---

## Related Documentation

- **Miyabi Architecture**: `../docs/architecture/`
- **Agent System**: `../.claude/context/agents.md`
- **Worktree System**: `../.claude/context/worktree.md`
- **tmux Operations**: `../.claude/docs/operations/TMUX_OPERATIONS.md`

---

**Maintained by**: Miyabi Autonomous Development System
**Last Reorganized**: 2025-11-12
**Next Review**: 2025-12-12
