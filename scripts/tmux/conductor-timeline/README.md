# Conductor Timeline CLI

**Mission Control Conductor Timeline Reporter** - TypeScript-based tmux monitoring, agent state aggregation, and structured event reporting for the Miyabi project.

## Overview

The Conductor Timeline CLI provides real-time monitoring and reporting of agent activities within tmux sessions. It:

- **Monitors tmux panes** to detect agent states (RUN/IDLE/DEAD)
- **Aggregates conductor events** from `.ai/logs/conductor/` directory
- **Generates timeline reports** with recent completions and events
- **Outputs to multiple formats**: tmux pane (human-readable), JSONL (machine-readable), console

## Installation

```bash
cd scripts/tmux/conductor-timeline
npm install
npm run build
```

## Usage

### Basic Usage

```bash
# Display report in console
node dist/cli/conductorTimeline.js --session miyabi-refactor

# Send report to tmux pane
node dist/cli/conductorTimeline.js --session miyabi-refactor --output-pane %10

# Append to JSONL file
node dist/cli/conductorTimeline.js --session miyabi-refactor --jsonl .ai/logs/conductor_timeline.jsonl

# Combined: tmux pane + JSONL + console
node dist/cli/conductorTimeline.js --session miyabi-refactor --output-pane %10 --jsonl .ai/logs/conductor_timeline.jsonl
```

### Watch Mode

Continuous monitoring with automatic refresh:

```bash
# Watch mode with 10-second interval (default)
node dist/cli/conductorTimeline.js --session miyabi-refactor --watch

# Custom watch interval (30 seconds)
node dist/cli/conductorTimeline.js --session miyabi-refactor --watch --watch-interval 30

# Watch mode with tmux pane output
node dist/cli/conductorTimeline.js --session miyabi-refactor --output-pane %10 --watch
```

### CLI Options

```
Options:
  -s, --session <name>          Tmux session name (default: miyabi-refactor)
  -w, --window <minutes>        Time window for events in minutes (default: 60)
  -o, --output-pane <pane-id>   Tmux pane ID to send output (e.g., %10)
  -j, --jsonl <path>            Path to JSONL output file
  --watch                       Continuous monitoring mode
  --watch-interval <seconds>    Watch mode interval (default: 10)
  -c, --console-only            Output to console only
  --api-url <url>               Mission Control API base URL (env: MISSION_CONTROL_API_URL)
  --api-token <token>           Mission Control API token (optional)
  --api-retries <n>             Number of retry attempts (default: 3)
  --api-timeout <ms>            Request timeout in milliseconds (default: 10000)
  --api-backoff <ms>            Initial retry backoff in milliseconds (default: 2000)
  --no-api                      Disable Mission Control API delivery
  -h, --help                    Show help message

Environment variables:
  MISSION_CONTROL_API_URL         Base URL for Mission Control web API (e.g., http://localhost:8080/api)
  MISSION_CONTROL_API_TOKEN       Optional bearer token for authentication
  MISSION_CONTROL_API_RETRIES     Override retry attempts
  MISSION_CONTROL_API_TIMEOUT_MS  Override request timeout (milliseconds)
  MISSION_CONTROL_API_BACKOFF_MS  Override initial backoff delay (milliseconds)

### Mission Control API Integration

Send timeline data to the Miyabi Mission Control API while keeping local JSONL logs for offline analysis.

```bash
# Append to local JSONL and deliver to API (with env var configuration)
export MISSION_CONTROL_API_URL="http://localhost:8080/api"
export MISSION_CONTROL_API_TOKEN="$GITHUB_TOKEN"
node dist/cli/conductorTimeline.js \
  --session miyabi-refactor \
  --jsonl .ai/logs/conductor_timeline.jsonl

# Explicitly configure via CLI flags
node dist/cli/conductorTimeline.js \
  --session miyabi-refactor \
  --jsonl .ai/logs/conductor_timeline.jsonl \
  --api-url http://localhost:8080/api \
  --api-token "$GITHUB_TOKEN"
```

When the CLI successfully writes to a local JSONL file, the API payload includes `persisted_locally: true` so the server can avoid duplicate storage. Remote hosts can skip local persistence and rely on the API to store the event stream.
```

## Architecture

### Module Structure

```
conductor-timeline/
├── src/
│   ├── adapters/           # Tmux CLI wrapper
│   │   └── TmuxAdapter.ts
│   ├── loaders/            # Event loading from .ai/logs
│   │   └── EventLoader.ts
│   ├── aggregators/        # Timeline aggregation logic
│   │   └── TimelineAggregator.ts
│   ├── formatters/         # Report formatting & writing
│   │   ├── ReportFormatter.ts
│   │   └── ReportWriter.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── cli/                # CLI entry point
│   │   └── conductorTimeline.ts
│   └── index.ts            # Public API exports
├── tests/                  # Jest unit tests
│   └── TmuxAdapter.test.ts
├── dist/                   # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Key Components

#### 1. TmuxAdapter

Abstracts tmux CLI interactions with testable shell executor interface:

```typescript
import { TmuxAdapter } from './adapters/TmuxAdapter.js';

const adapter = new TmuxAdapter();
const panes = adapter.getPanes('miyabi-refactor');
// Returns: AgentPaneInfo[] with state detection (RUN/IDLE/DEAD)
```

#### 2. EventLoader

Loads conductor assignment events from `.ai/logs/conductor/`:

```typescript
import { EventLoader } from './loaders/EventLoader.js';

const loader = new EventLoader();
const events = loader.loadConductorAssignments(60); // Last 60 minutes
const completions = loader.getRecentCompletions(60);
```

#### 3. TimelineAggregator

Aggregates tmux pane data and event logs into timeline reports:

```typescript
import { TimelineAggregator } from './aggregators/TimelineAggregator.js';

const aggregator = new TimelineAggregator();
const report = aggregator.generateReport('miyabi-refactor', 60);
```

#### 4. ReportFormatter & ReportWriter

Formats and writes reports to multiple outputs:

```typescript
import { ReportWriter } from './formatters/ReportWriter.js';

const writer = new ReportWriter();
writer.writeToTmuxPane(report, '%10');
writer.appendToJSONL(report, '.ai/logs/conductor_timeline.jsonl');
```

## Agent State Detection

The CLI detects agent states based on pane command and content:

- **RUN**: Active process running (node, cargo, claude, npm, tsx)
- **IDLE**: Claude Code running but no active execution
- **DEAD**: Only shell running (bash, zsh, sh)

## Output Formats

### Console Output (Human-Readable)

```
════════════════════════════════════════════════════════════════
🎯 Conductor Timeline Report
📅 11/5/2025, 3:30:00 PM
📺 Session: miyabi-refactor
════════════════════════════════════════════════════════════════

📊 Agent States:
   Total: 7
   ▶️  RUN:  3
   ⏸️  IDLE: 2
   💀 DEAD: 2

🤖 Agents:
   ▶️ サクラ (Review) - %2
   ⏸️ キキョウ (Issue) - %3
   💀 ツバキ (CodeGen) - %4

🎼 Conductor Status:
   Name: カンナ
   Mode: FULL_AUTO
   Cycle: 5
   Last Activity: 3:25:00 PM

✅ Recent Completions:
   • #638: E2Eテスト追加 (ボタン)
   • #642: カテゴリアイコン統一 (ボタン)

📜 Recent Events:
   🚀 [3:25:00 PM] Started: カテゴリアイコン統一
   ✅ [3:20:00 PM] Completed: E2Eテスト追加

════════════════════════════════════════════════════════════════
```

### JSONL Output (Machine-Readable)

```jsonl
{"timestamp":"2025-11-05T15:30:00.000Z","session_name":"miyabi-refactor","agent_states":{"run":3,"idle":2,"dead":2},"recent_events":[{"timestamp":"2025-11-05T15:25:00.000Z","event_type":"task_started","agent_id":"botan_codex4","description":"Started: カテゴリアイコン統一"}]}
```

## Integration Examples

### 1. Dedicated tmux Pane

Create a dedicated pane for timeline monitoring:

```bash
# In your tmux session
tmux split-window -h -l 40
tmux send-keys "cd /path/to/miyabi && node scripts/tmux/conductor-timeline/dist/cli/conductorTimeline.js --session miyabi-refactor --output-pane %10 --watch" Enter
```

### 2. Periodic JSONL Logging

Add to crontab for periodic logging:

```bash
# Every 5 minutes
*/5 * * * * cd /path/to/miyabi && node scripts/tmux/conductor-timeline/dist/cli/conductorTimeline.js --session miyabi-refactor --jsonl .ai/logs/conductor_timeline.jsonl
```

### 3. Mission Control UI Integration

The JSONL output is designed for consumption by Mission Control UI:

```typescript
// In Mission Control frontend
import * as fs from 'fs';
import * as readline from 'readline';

async function loadTimeline() {
  const stream = fs.createReadStream('.ai/logs/conductor_timeline.jsonl');
  const rl = readline.createInterface({ input: stream });

  for await (const line of rl) {
    const entry = JSON.parse(line);
    // Process timeline entry for UI visualization
  }
}
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Development

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Dependencies

- **tsx**: TypeScript execution
- **@types/node**: Node.js type definitions
- **jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **eslint**: Code linting

## Related Files

- **Source**: `scripts/tmux/conductor-timeline/src/`
- **Tests**: `scripts/tmux/conductor-timeline/tests/`
- **Build Output**: `scripts/tmux/conductor-timeline/dist/`
- **Conductor Logs**: `.ai/logs/conductor/`
- **JSONL Output**: `.ai/logs/conductor_timeline.jsonl` (configurable)

## License

MIT - Part of the Miyabi project

## Author

Miyabi Team

---

**Version**: 1.0.0
**Last Updated**: 2025-11-05
