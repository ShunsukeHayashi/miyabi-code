# Codex Halt Monitor - Design Document

**Version**: v1.0.0
**Date**: 2025-11-09
**Status**: Design Phase
**Architecture**: Linter-based Event Detection + Rule Engine + Hook Actions

---

## 🎯 Overview

Codex停止時の自動検知・対応フック機構。リンター原理でログ/プロセスイベントをAST化し、ルールベースで自動復旧・通知を実行。

### Core Concept

```
Event Source → Event AST → Rule Engine → Hook Actions
    ↓              ↓            ↓              ↓
  Log/Process   EventNode   Validation   Restart/Notify
```

---

## 📊 1. Halt Pattern Definition (停止パターン定義)

### 1.1 Event Sources (監視対象)

#### A. Log-based Detection
- **Target**: Claude Code CLI stdout/stderr
- **Patterns**:
  ```typescript
  interface LogEvent {
    type: 'log' | 'error' | 'warn';
    timestamp: Date;
    message: string;
    source: 'stdout' | 'stderr';
  }
  ```

#### B. Process-based Detection
- **Target**: Claude Code プロセス状態
- **Patterns**:
  ```typescript
  interface ProcessEvent {
    type: 'exit' | 'signal' | 'crash';
    pid: number;
    exitCode?: number;
    signal?: string;  // SIGTERM, SIGKILL, etc.
    timestamp: Date;
  }
  ```

#### C. Silence-based Detection
- **Target**: 無出力状態の継続
- **Patterns**:
  ```typescript
  interface SilenceEvent {
    type: 'silence';
    duration: number;  // seconds
    lastActivity: Date;
    threshold: number; // Default: 30s
  }
  ```

### 1.2 Halt Criteria (停止判定基準)

#### P0: Critical Halt (即時対応必須)
1. **Process Exit (非0)**: `exit code !== 0`
2. **Fatal Error Messages**:
   - `"Codex crashed"`
   - `"Unhandled rejection"`
   - `"Fatal error"`
   - `"SIGTERM"`, `"SIGKILL"`
3. **API Limit Exceeded**: `"Rate limit exceeded"`, `"429 Too Many Requests"`

#### P1: Warning (警告レベル)
1. **Long Silence**: 無出力 > 30秒
2. **Repeated Errors**: 同一エラー連続3回
3. **Resource Exhaustion**: `"Out of memory"`, `"ENOMEM"`

#### P2: Info (情報レベル)
1. **Graceful Exit**: `exit code === 0`
2. **User Interrupt**: `SIGINT` (Ctrl+C)

---

## 🏗️ 2. Architecture Design

### 2.1 Component Structure

```
┌─────────────────────────────────────────────────┐
│         Codex Process Wrapper (Go/Shell)        │
│  ┌───────────────────────────────────────────┐  │
│  │  Claude Code CLI (subprocess)             │  │
│  │  ├─ stdout → Event Stream                 │  │
│  │  └─ stderr → Event Stream                 │  │
│  └───────────────────────────────────────────┘  │
│                     ↓                            │
│         Event Parser & AST Builder              │
│  ┌───────────────────────────────────────────┐  │
│  │  LogEvent, ProcessEvent, SilenceEvent     │  │
│  └───────────────────────────────────────────┘  │
│                     ↓                            │
│              Rule Engine (Linter)               │
│  ┌───────────────────────────────────────────┐  │
│  │  Rules: onLogEvent(), onProcessExit(),    │  │
│  │         onSilenceTimeout()                │  │
│  └───────────────────────────────────────────┘  │
│                     ↓                            │
│               Hook Actions                      │
│  ┌───────────────────────────────────────────┐  │
│  │  restart, notify, debug_collect,          │  │
│  │  generate_prompt                          │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 2.2 Event AST Definition

```typescript
// Base Event Node
interface EventNode {
  id: string;           // Unique event ID
  type: EventType;      // 'log' | 'exit' | 'silence' | 'signal'
  timestamp: Date;
  severity: 'P0' | 'P1' | 'P2';
  payload: any;         // Event-specific data
  context: EventContext;
}

type EventType =
  | 'log'      // Log message detected
  | 'exit'     // Process exit
  | 'signal'   // Signal received (SIGTERM, etc.)
  | 'silence'  // Timeout without output
  | 'error';   // Error message

interface EventContext {
  sessionId: string;
  worktreePath?: string;
  issueNumber?: number;
  agentType?: string;
  recentLogs: string[];  // Last 10 lines
}

// Specific Event Types
interface LogEventNode extends EventNode {
  type: 'log';
  payload: {
    message: string;
    source: 'stdout' | 'stderr';
    matchedPattern?: string;  // If matched known pattern
  };
}

interface ProcessExitNode extends EventNode {
  type: 'exit';
  payload: {
    pid: number;
    exitCode: number;
    duration: number;  // Process runtime in seconds
  };
}

interface SilenceEventNode extends EventNode {
  type: 'silence';
  payload: {
    duration: number;
    lastActivity: Date;
    threshold: number;
  };
}
```

### 2.3 Rule Engine Interface

```typescript
type RuleContext = {
  triggerHook: (action: HookAction, meta: HookMetadata) => void;
  getHistory: (count: number) => EventNode[];
  getState: (key: string) => any;
  setState: (key: string, value: any) => void;
  logger: Logger;
};

type Rule = (node: EventNode, ctx: RuleContext) => void;

interface HookMetadata {
  reason: string;
  eventId: string;
  severity: 'P0' | 'P1' | 'P2';
  details: any;
}

type HookAction =
  | 'restart'         // Restart Codex
  | 'notify'          // Send notification
  | 'debug_collect'   // Collect debug info
  | 'generate_prompt' // Generate fix prompt
  | 'escalate';       // Escalate to human
```

### 2.4 Rule Examples

```typescript
// Rule 1: Process Exit Detection
const onProcessExit: Rule = (node, ctx) => {
  if (node.type !== 'exit') return;

  const { exitCode } = (node as ProcessExitNode).payload;

  if (exitCode !== 0) {
    // P0: Abnormal exit
    ctx.triggerHook('restart', {
      reason: `Codex exited with code ${exitCode}`,
      eventId: node.id,
      severity: 'P0',
      details: {
        exitCode,
        recentLogs: node.context.recentLogs,
      }
    });

    ctx.triggerHook('notify', {
      reason: 'Codex crashed and auto-restarted',
      eventId: node.id,
      severity: 'P0',
      details: { exitCode }
    });

    // Collect debug info
    ctx.triggerHook('debug_collect', {
      reason: 'Crash debug collection',
      eventId: node.id,
      severity: 'P0',
      details: { exitCode }
    });
  }
};

// Rule 2: Fatal Error Message Detection
const onLogEvent: Rule = (node, ctx) => {
  if (node.type !== 'log') return;

  const { message } = (node as LogEventNode).payload;
  const fatalPatterns = [
    /Codex crashed/i,
    /Unhandled rejection/i,
    /Fatal error/i,
    /ECONNREFUSED/i,
  ];

  for (const pattern of fatalPatterns) {
    if (pattern.test(message)) {
      ctx.triggerHook('restart', {
        reason: `Fatal error detected: ${message}`,
        eventId: node.id,
        severity: 'P0',
        details: { message, pattern: pattern.source }
      });

      ctx.triggerHook('generate_prompt', {
        reason: 'Generate fix prompt for fatal error',
        eventId: node.id,
        severity: 'P0',
        details: {
          errorMessage: message,
          recentLogs: node.context.recentLogs
        }
      });

      break;
    }
  }
};

// Rule 3: Silence Timeout Detection
const onSilenceTimeout: Rule = (node, ctx) => {
  if (node.type !== 'silence') return;

  const { duration, threshold } = (node as SilenceEventNode).payload;

  if (duration > threshold) {
    // P1: Warning level
    ctx.triggerHook('notify', {
      reason: `Codex silent for ${duration}s (threshold: ${threshold}s)`,
      eventId: node.id,
      severity: 'P1',
      details: { duration, threshold }
    });

    // Check if stuck (e.g., waiting for user input)
    const recentLogs = node.context.recentLogs;
    if (recentLogs.some(log => /waiting/i.test(log))) {
      ctx.triggerHook('escalate', {
        reason: 'Codex appears stuck waiting for input',
        eventId: node.id,
        severity: 'P1',
        details: { recentLogs }
      });
    }
  }
};

// Rule 4: Repeated Error Detection
const onRepeatedError: Rule = (node, ctx) => {
  if (node.type !== 'log') return;

  const { message } = (node as LogEventNode).payload;

  // Get recent error history
  const recentErrors = ctx.getHistory(5)
    .filter(n => n.type === 'log' && n.severity === 'P0')
    .map(n => (n as LogEventNode).payload.message);

  // Check if same error repeated 3+ times
  const errorCount = recentErrors.filter(m => m === message).length;

  if (errorCount >= 3) {
    ctx.triggerHook('generate_prompt', {
      reason: `Error repeated ${errorCount} times: ${message}`,
      eventId: node.id,
      severity: 'P0',
      details: { message, count: errorCount, history: recentErrors }
    });

    // Escalate if repeated more than 5 times
    if (errorCount >= 5) {
      ctx.triggerHook('escalate', {
        reason: `Critical: Error loop detected (${errorCount} repetitions)`,
        eventId: node.id,
        severity: 'P0',
        details: { message, count: errorCount }
      });
    }
  }
};
```

---

## 🔧 3. Hook Actions Implementation

### 3.1 Restart Hook

```bash
#!/bin/bash
# .claude/hooks/codex-restart.sh

set -euo pipefail

# Input: Hook metadata (JSON)
META=$(cat)

EVENT_ID=$(echo "$META" | jq -r '.eventId')
REASON=$(echo "$META" | jq -r '.reason')
SEVERITY=$(echo "$META" | jq -r '.severity')
EXIT_CODE=$(echo "$META" | jq -r '.details.exitCode // "unknown"')

# Log restart event
LOG_DIR=".ai/logs"
LOG_FILE="$LOG_DIR/codex-restart-$(date +%Y-%m-%d).log"
mkdir -p "$LOG_DIR"

echo "[$SEVERITY] $(date -Iseconds) Restarting Codex: $REASON (exit_code=$EXIT_CODE)" >> "$LOG_FILE"

# Check restart count (prevent infinite loop)
RESTART_COUNT_FILE="/tmp/miyabi-codex-restart-count"
RESTART_COUNT=0
if [ -f "$RESTART_COUNT_FILE" ]; then
  RESTART_COUNT=$(cat "$RESTART_COUNT_FILE")
fi

# Increment count
RESTART_COUNT=$((RESTART_COUNT + 1))
echo "$RESTART_COUNT" > "$RESTART_COUNT_FILE"

# Max restart limit
MAX_RESTARTS=3
COOLDOWN_SECONDS=60

if [ "$RESTART_COUNT" -gt "$MAX_RESTARTS" ]; then
  echo "[ERROR] Max restart limit reached ($MAX_RESTARTS). Stopping auto-restart." >> "$LOG_FILE"
  echo "🚨 Codex crashed $RESTART_COUNT times. Manual intervention required." >&2

  # Send notification
  osascript -e 'display notification "Codex crashed multiple times. Check logs." with title "Miyabi Alert"'

  # Reset counter after cooldown
  (sleep "$COOLDOWN_SECONDS" && rm -f "$RESTART_COUNT_FILE") &

  exit 1
fi

# Wait before restart (exponential backoff)
BACKOFF_SECONDS=$((2 ** (RESTART_COUNT - 1)))
echo "Waiting ${BACKOFF_SECONDS}s before restart (attempt $RESTART_COUNT/$MAX_RESTARTS)..." >> "$LOG_FILE"
sleep "$BACKOFF_SECONDS"

# Restart Codex (assuming parent process manages this)
echo "✅ Restart triggered (attempt $RESTART_COUNT/$MAX_RESTARTS)" >> "$LOG_FILE"

# VOICEVOX notification (if enabled)
if command -v curl &>/dev/null && nc -z 127.0.0.1 50021 2>/dev/null; then
  TEXT="コーデックスが再起動されました。リトライ、${RESTART_COUNT}回目です。"
  curl -s -X POST "http://127.0.0.1:50021/audio_query?text=${TEXT}&speaker=3" \
    | curl -s -X POST -H "Content-Type: application/json" -d @- \
      "http://127.0.0.1:50021/synthesis?speaker=3" -o /tmp/codex-restart.wav
  afplay /tmp/codex-restart.wav &
fi

exit 0
```

### 3.2 Notify Hook

```bash
#!/bin/bash
# .claude/hooks/codex-notify.sh

set -euo pipefail

META=$(cat)

REASON=$(echo "$META" | jq -r '.reason')
SEVERITY=$(echo "$META" | jq -r '.severity')
DETAILS=$(echo "$META" | jq -r '.details')

# Severity-based icon
case "$SEVERITY" in
  P0) ICON="🚨" ;;
  P1) ICON="⚠️" ;;
  P2) ICON="ℹ️" ;;
  *) ICON="📌" ;;
esac

# macOS notification
osascript -e "display notification \"$REASON\" with title \"$ICON Miyabi Codex Monitor\""

# Log notification
LOG_FILE=".ai/logs/codex-notify-$(date +%Y-%m-%d).log"
echo "[$SEVERITY] $(date -Iseconds) $REASON" >> "$LOG_FILE"
echo "  Details: $DETAILS" >> "$LOG_FILE"

# Optional: Slack/Webhook (if configured)
WEBHOOK_URL="${MIYABI_WEBHOOK_URL:-}"
if [ -n "$WEBHOOK_URL" ]; then
  curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$ICON [$SEVERITY] $REASON\", \"details\": $DETAILS}"
fi

exit 0
```

### 3.3 Debug Collect Hook

```bash
#!/bin/bash
# .claude/hooks/codex-debug-collect.sh

set -euo pipefail

META=$(cat)

EVENT_ID=$(echo "$META" | jq -r '.eventId')
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEBUG_DIR=".ai/debug/codex-crash-$TIMESTAMP"

mkdir -p "$DEBUG_DIR"

# Collect recent logs
echo "$META" | jq '.' > "$DEBUG_DIR/event-metadata.json"

# Copy recent Codex logs (if available)
if [ -f "/tmp/codex-stdout.log" ]; then
  tail -n 100 /tmp/codex-stdout.log > "$DEBUG_DIR/stdout-tail.log"
fi

if [ -f "/tmp/codex-stderr.log" ]; then
  tail -n 100 /tmp/codex-stderr.log > "$DEBUG_DIR/stderr-tail.log"
fi

# System info
uname -a > "$DEBUG_DIR/system-info.txt"
ps aux | grep -i codex > "$DEBUG_DIR/process-info.txt" || true

# Git status (if in worktree)
if git rev-parse --is-inside-work-tree &>/dev/null; then
  git status > "$DEBUG_DIR/git-status.txt"
  git log -5 --oneline > "$DEBUG_DIR/git-log.txt"
fi

# Compress
tar -czf "$DEBUG_DIR.tar.gz" -C ".ai/debug" "codex-crash-$TIMESTAMP"
rm -rf "$DEBUG_DIR"

echo "✅ Debug info collected: $DEBUG_DIR.tar.gz"

# Optional: Upload to S3 (if configured)
S3_BUCKET="${MIYABI_DEBUG_S3_BUCKET:-}"
if [ -n "$S3_BUCKET" ] && command -v aws &>/dev/null; then
  aws s3 cp "$DEBUG_DIR.tar.gz" "s3://$S3_BUCKET/codex-debug/$TIMESTAMP.tar.gz"
  echo "✅ Uploaded to S3: s3://$S3_BUCKET/codex-debug/$TIMESTAMP.tar.gz"
fi

exit 0
```

### 3.4 Generate Prompt Hook

```bash
#!/bin/bash
# .claude/hooks/codex-generate-prompt.sh

set -euo pipefail

META=$(cat)

ERROR_MESSAGE=$(echo "$META" | jq -r '.details.errorMessage // .details.message // "Unknown error"')
RECENT_LOGS=$(echo "$META" | jq -r '.details.recentLogs // [] | join("\n")')

# Generate fix prompt using template
PROMPT_TEMPLATE=".claude/prompts/codex-error-fix.md"
PROMPT_FILE="/tmp/codex-fix-prompt-$(date +%s).md"

cat > "$PROMPT_FILE" <<EOF
# Codex Error Fix Prompt

**Generated**: $(date -Iseconds)
**Error**: $ERROR_MESSAGE

---

## Recent Logs

\`\`\`
$RECENT_LOGS
\`\`\`

---

## Analysis Request

Please analyze the error above and:

1. **Root Cause**: Identify the root cause of the error
2. **Fix Strategy**: Propose a fix strategy
3. **Code Changes**: Generate specific code changes (if applicable)
4. **Prevention**: Suggest how to prevent this error in the future

---

## Context

- **Session ID**: $(cat /tmp/miyabi-session-id 2>/dev/null || echo "unknown")
- **Worktree**: $(git worktree list --porcelain 2>/dev/null | grep '^worktree' | head -1 | cut -d' ' -f2 || echo "none")
- **Branch**: $(git branch --show-current 2>/dev/null || echo "unknown")
EOF

echo "✅ Fix prompt generated: $PROMPT_FILE"

# Output prompt path for parent process to use
echo "$PROMPT_FILE"

exit 0
```

---

## 📦 4. Implementation Plan

### Phase 1: Prototype (Week 1)
- [ ] Event AST definition (TypeScript interfaces)
- [ ] Basic event parser (shell script)
- [ ] Restart hook implementation
- [ ] Notify hook implementation
- [ ] Manual testing

### Phase 2: Rule Engine (Week 2)
- [ ] Rule engine core logic
- [ ] onProcessExit rule
- [ ] onLogEvent rule (fatal errors)
- [ ] onSilenceTimeout rule
- [ ] Integration testing

### Phase 3: Advanced Features (Week 3)
- [ ] Debug collect hook
- [ ] Generate prompt hook
- [ ] Repeated error detection
- [ ] AST-based code analysis (optional)
- [ ] Performance optimization

### Phase 4: Production (Week 4)
- [ ] Configuration system (JSON)
- [ ] Monitoring dashboard (optional)
- [ ] Documentation
- [ ] Deployment automation

---

## 🔧 5. Configuration File

```json
{
  "codexHaltMonitor": {
    "enabled": true,
    "silenceThreshold": 30,
    "maxRestarts": 3,
    "cooldownSeconds": 60,
    "rules": {
      "processExit": {
        "enabled": true,
        "severity": "P0",
        "actions": ["restart", "notify", "debug_collect"]
      },
      "fatalError": {
        "enabled": true,
        "severity": "P0",
        "patterns": [
          "Codex crashed",
          "Unhandled rejection",
          "Fatal error",
          "ECONNREFUSED"
        ],
        "actions": ["restart", "notify", "generate_prompt"]
      },
      "silenceTimeout": {
        "enabled": true,
        "severity": "P1",
        "thresholdSeconds": 30,
        "actions": ["notify"]
      },
      "repeatedError": {
        "enabled": true,
        "severity": "P0",
        "threshold": 3,
        "actions": ["generate_prompt", "escalate"]
      }
    },
    "hooks": {
      "restart": ".claude/hooks/codex-restart.sh",
      "notify": ".claude/hooks/codex-notify.sh",
      "debug_collect": ".claude/hooks/codex-debug-collect.sh",
      "generate_prompt": ".claude/hooks/codex-generate-prompt.sh"
    },
    "logging": {
      "enabled": true,
      "directory": ".ai/logs",
      "retention": 7
    },
    "notifications": {
      "macOS": true,
      "voicevox": true,
      "webhook": "${MIYABI_WEBHOOK_URL}"
    }
  }
}
```

---

## 📊 6. Metrics & Observability

### Tracked Metrics

```typescript
interface MonitorMetrics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsBySeverity: Record<'P0' | 'P1' | 'P2', number>;
  hookExecutions: Record<HookAction, number>;
  restartCount: number;
  averageUptime: number;  // seconds
  lastCrashTime?: Date;
}
```

### Log Structure

```
.ai/logs/
├── codex-monitor-2025-11-09.log      # Event log
├── codex-restart-2025-11-09.log      # Restart log
├── codex-notify-2025-11-09.log       # Notification log
└── metrics-2025-11-09.json           # Metrics JSON
```

---

## ✅ Success Criteria

1. **Reliability**: 95%+ crash auto-recovery rate
2. **Performance**: Event processing <10ms latency
3. **Safety**: No infinite restart loops
4. **Observability**: All events logged with metrics
5. **Integration**: Seamless with existing Miyabi hooks

---

## 🔗 Related Documentation

- **Existing Hooks**: `.claude/hooks/README.md`
- **Worktree Protocol**: `.claude/context/worktree.md`
- **Git Ops Validator**: `.claude/hooks/git-ops-validator.sh`
- **Miyabi Manifest**: `manifest.md`

---

**Status**: ✅ Design Complete - Ready for Implementation
**Next**: Create prototype scripts (Phase 1)
