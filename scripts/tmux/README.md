# 🎓 Miyabi tmux Gradebook

Comprehensive evaluation system for tmux session and agent performance.

## Quick Start

```bash
# Generate full Markdown report
npx tsx tmux-gradebook.ts Miyabi

# Show compact summary
npx tsx tmux-gradebook.ts Miyabi --summary

# Generate JSON and save to file
npx tsx tmux-gradebook.ts Miyabi --json --output .ai/gradebook/report.json
```

## Features

- ✅ **Dual-Level Evaluation**: Session-wide + per-agent grading (0-100 scale)
- ✅ **Multi-Source Data**: tmux commands + `.ai/sessions` + `.ai/logs` + `.ai/codex-tasks`
- ✅ **Weighted Scoring**: Customizable metric weights (completion, quality, performance, collaboration)
- ✅ **Multiple Formats**: Markdown reports, JSON export, compact summary
- ✅ **Testable Architecture**: Mocked shell interactions for unit testing

## Evaluation Categories

### Session Metrics (100-point scale)
- **Completion (30%)**: Task completion rate, issues closed, PRs merged
- **Quality (40%)**: Test pass rate, build success, code quality
- **Performance (20%)**: Tasks/hour, average duration, parallel efficiency
- **Collaboration (10%)**: Handoff success, merge conflicts, interventions

### Agent Metrics (100-point scale)
- **Completion (35%)**: Tasks assigned vs. completed, failure rate
- **Quality (35%)**: Test/build pass rate, PR approval rate, redo rate
- **Performance (20%)**: Task duration, productivity score, uptime
- **Specialization (10%)**: Skill match rate, task type distribution

## Grade Scale

| Grade | Score | Emoji |
|-------|-------|-------|
| A+    | 95-100 | 🏆   |
| A     | 90-94  | 🥇   |
| A-    | 85-89  | 🥈   |
| B+    | 80-84  | 🥉   |
| B     | 75-79  | 😊   |
| ...   | ...    | ...  |
| F     | 0-49   | ❌   |

## Architecture

```
scripts/tmux/
├── types/gradebook.ts        # Type definitions (14 interfaces)
├── utils/
│   ├── tmux-parser.ts         # tmux command parser
│   └── json-loader.ts         # JSON data loader
├── gradebook/
│   ├── collector.ts           # Data aggregation
│   ├── calculator.ts          # Score calculation
│   └── reporter.ts            # Report generation
└── tmux-gradebook.ts          # CLI entry point
```

## CLI Options

```
Usage: tsx tmux-gradebook.ts [session-name] [options]

Options:
  --json              Output JSON instead of Markdown
  --output <file>     Save to file instead of stdout
  --config <file>     Load configuration from file
  --summary, -s       Show compact summary only
  --help, -h          Show help message

Examples:
  tsx tmux-gradebook.ts Miyabi
  tsx tmux-gradebook.ts Miyabi --json --output report.json
  tsx tmux-gradebook.ts Miyabi --summary
```

## Configuration

Create a JSON config file to customize weights and thresholds:

```json
{
  "session_name": "Miyabi",
  "scoring": {
    "weights": {
      "session": {
        "completion": 0.30,
        "quality": 0.40,
        "performance": 0.20,
        "collaboration": 0.10
      }
    },
    "thresholds": {
      "A+": 95,
      "A": 90,
      "B+": 80
    }
  }
}
```

## Output Example

### Compact Summary
```
🎓 Session: Miyabi
   Grade: 🥉 B+ (82.2/100)
   Duration: 5h 30m
   Tasks: 42/45 completed
   Agents: 7
```

### Full Markdown Report
```markdown
# 🎓 Miyabi Orchestra Gradebook

**Session**: Miyabi
**Duration**: 5h 30m

## 🏆 Overall Grade: A (92.5/100)

[██████████████████░░] 92.5%

**Evaluation Breakdown**:
- 📊 Completion (30%): 95.0%
- ✨ Quality (40%): 91.2%
- ⚡ Performance (20%): 88.5%
- 🤝 Collaboration (10%): 97.0%

## 🎯 Session Metrics

### 📊 Completion (30%)
- **Tasks**: 42/45 completed (93.3%)
- **Issues**: 8 closed
- **PRs**: 5 merged

[... detailed metrics ...]

## 👥 Agent Performance

### 🥇 カエデ - Grade: A (94.5/100)

**Completion**: 15/15 tasks (100.0%)
**Quality**: Test 98.5% | Build 100.0% | Review 95.0%
**Performance**: 18m avg | 92.3% uptime
**Specialization**: Implementation (87.5% match)

[... per-agent details ...]
```

## Exit Codes

- `0`: Grade >= B (75+) - Success
- `1`: Grade < B (75) - Needs improvement

## Dependencies

```json
{
  "dependencies": {
    "tsx": "^4.7.0",
    "@types/node": "^20.11.0"
  }
}
```

## Design Credit

Architecture and metrics system designed by **カエデ (Kaede)**.

## License

MIT License - See project LICENSE file for details.
