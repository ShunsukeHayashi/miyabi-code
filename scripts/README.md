# Miyabi Automation Scripts

**Created**: 2025-10-26
**Version**: 1.0.0
**Architecture**: 3-Layer Decision Tree Automation

Complete automation scripts implementing the Miyabi Autonomous Operation Master Plan with Claude Code Interactive/Headless Mode integration.

---

## 📁 Directory Structure

```
scripts/
├── primitives/              # Layer 1: Basic building blocks
│   ├── check-label.sh       # Validate Miyabi label system
│   ├── run-tests.sh         # Execute cargo test with error handling
│   ├── escalate.sh          # Escalate to appropriate human role
│   └── git-safety-check.sh  # Verify git repository safety
│
├── decision-trees/          # Layer 2: Decision points (D1-D20)
│   ├── D1-label-check.sh    # Label validation (Script mode)
│   └── D2-complexity-check.sh # Complexity estimation (Headless AI)
│
├── orchestrators/           # Layer 3: Complete workflows
│   └── autonomous-issue-processor.sh # Full Issue → Deploy pipeline
│
└── safety/                  # Safety mechanisms (TBD)
```

---

## 🎯 Quick Start

### Basic Usage

```bash
# Process single Issue with default settings (Phase 2: Alert-based)
./scripts/orchestrators/autonomous-issue-processor.sh 270

# Real-time interactive mode (Phase 1)
./scripts/orchestrators/autonomous-issue-processor.sh 270 --mode=phase1

# Async push notification mode (Phase 3)
./scripts/orchestrators/autonomous-issue-processor.sh 270 --mode=phase3

# Dry run (simulation)
./scripts/orchestrators/autonomous-issue-processor.sh 270 --dry-run
```

### Human Intervention Modes

| Mode | Response Time | Operator Engagement | Use Case |
|------|--------------|---------------------|----------|
| **Phase 1** | 0-30 seconds | 100% (always at PC) | Active development session |
| **Phase 2** | 1-5 minutes | 20-30% (alert-driven) | **Default** - Normal workflow |
| **Phase 3** | 1-24 hours | 10-20% (async) | Background processing |

---

## 🏗️ Architecture

### 3-Layer Design

#### Layer 1: Primitives (Reusable Building Blocks)

**Purpose**: Single-responsibility scripts that perform one task well

**Scripts**:
- `check-label.sh` - Validate Issue has required Miyabi labels (type:\*, priority:\*)
- `run-tests.sh` - Run `cargo test` with timeout and error categorization
- `escalate.sh` - Send multi-channel notifications (macOS, VOICEVOX, Stream Deck, GitHub)
- `git-safety-check.sh` - Verify no uncommitted changes, not on main/master, etc.

**Exit Codes**: Consistent 0 (success), 1 (failure), 2 (error)

#### Layer 2: Decision Trees (D1-D20)

**Purpose**: Implement specific decision points from the master plan

**Current Implementation**:
- **D1: Label Check** (Script mode - confirmed process)
  - Binary decision: Valid labels → Continue / Invalid → Escalate to PO
  - Mode: Pure script (no AI)

- **D2: Complexity Check** (Headless AI mode)
  - Ternary decision: Low → Auto / Medium → AI-assisted / High → Human
  - Mode: Claude Code Headless with AI judgment
  - Uses: `claude -p` with JSON output

**Planned**: D3-D20 (see `docs/DECISION_TREE_COMPLETE.md`)

#### Layer 3: Orchestrators (Complete Workflows)

**Purpose**: Chain decision points into end-to-end automation

**Main Orchestrator**: `autonomous-issue-processor.sh`

**Flow**:
```
Pre-flight (Safety)
  ↓
D1: Label Check (Script)
  ↓
D2: Complexity Check (Headless AI)
  ↓
Implementation (Headless)
  ↓
Testing (Script + Auto-fix)
  ↓
Summary & Notification
```

**Features**:
- Rollback stack (trap on ERR)
- Multi-mode support (phase1/2/3)
- Dry-run simulation
- Comprehensive logging
- Multi-channel notifications

---

## 🔧 Primitive Scripts Reference

### check-label.sh

**Purpose**: Validate Miyabi label system compliance

**Usage**:
```bash
./scripts/primitives/check-label.sh <issue_number>
```

**Exit Codes**:
- `0` = Valid labels (type:\*, priority:\* present)
- `1` = Missing required labels
- `2` = Invalid issue number

**Output**: Creates `/tmp/miyabi-labels-<issue_num>.txt`

**Example**:
```bash
$ ./scripts/primitives/check-label.sh 270

VALID: All required labels present
Labels:
  - type:bug
  - priority:high
  - agent:codegen
```

---

### run-tests.sh

**Purpose**: Execute cargo test with error categorization

**Usage**:
```bash
./scripts/primitives/run-tests.sh [package_name]
```

**Exit Codes**:
- `0` = All tests passed
- `1` = Tests failed (logical errors)
- `2` = Compilation error (can attempt auto-fix)

**Features**:
- 10-minute timeout (600s)
- Captures full output to `/tmp/miyabi-automation/test-output.log`
- Distinguishes compilation vs runtime errors

**Example**:
```bash
$ ./scripts/primitives/run-tests.sh miyabi-core

===================================
Miyabi Test Runner
===================================
Package: miyabi-core
Time: 2025-10-26 15:30:00

Running tests...

✅ All tests PASSED

Tests passed: 42
Full log: /tmp/miyabi-automation/test-output.log
```

---

### escalate.sh

**Purpose**: Multi-channel human escalation

**Usage**:
```bash
./scripts/primitives/escalate.sh <role> <message> [issue_number]
```

**Roles**:
- `TechLead` - Technical issues, build errors, test failures
- `CISO` - Security vulnerabilities, audit failures
- `PO` - Product issues, invalid labels, requirements
- `CTO` - Strategic decisions, architecture changes
- `DevOps` - Infrastructure, deployment, CI/CD

**Channels**:
1. macOS Notification (instant)
2. VOICEVOX Audio Alert (if available)
3. Stream Deck Flag (`/tmp/miyabi-escalation-flag`)
4. GitHub Issue Comment (if issue number provided)
5. Log file (`logs/escalations.log`)

**Example**:
```bash
$ ./scripts/primitives/escalate.sh TechLead "Build failed on Issue #270" 270

===================================
Escalation Required
===================================
Role: TechLead
Time: 2025-10-26 15:35:00

Message:
Build failed on Issue #270

Related Issue: #270

✅ Escalation notifications sent

Escalation logged to: logs/escalations.log
```

---

### git-safety-check.sh

**Purpose**: Verify git repository safety before automation

**Usage**:
```bash
./scripts/primitives/git-safety-check.sh
```

**Exit Codes**:
- `0` = Safe to proceed
- `1` = Unsafe state detected

**Checks**:
1. No uncommitted changes
2. No untracked files (except tmp/, .DS_Store, logs/)
3. Not in detached HEAD
4. Not on main/master (unless `ALLOW_MAIN=true`)
5. Remote sync status

**Example**:
```bash
$ ./scripts/primitives/git-safety-check.sh

===================================
Git Safety Check
===================================

✅ Git repository is in safe state
Branch: feature/autonomous-scripts
Commit: a1b2c3d
```

---

## 🌳 Decision Tree Scripts Reference

### D1-label-check.sh

**Decision Point**: D1 - Label Validation
**Mode**: Script (Confirmed Process)
**Type**: Binary (Pass/Fail)

**Logic**:
```
IF labels contain "type:*" AND "priority:*"
  THEN Continue to D2
  ELSE Escalate to ProductOwner
```

**Usage**:
```bash
./scripts/decision-trees/D1-label-check.sh <issue_number>
```

**Exit Codes**:
- `0` = Labels valid → Continue
- `1` = Labels invalid → Escalated

**Example**:
```bash
$ ./scripts/decision-trees/D1-label-check.sh 270

===================================
Decision Point D1: Label Validation
===================================
Issue: #270
Mode: Script (Confirmed Process)
Time: 2025-10-26 15:40:00

VALID: All required labels present
Labels:
  - type:bug
  - priority:high

✅ DECISION: PASS - Labels are valid
→ ACTION: Continue to D2 (Complexity Check)
```

---

### D2-complexity-check.sh

**Decision Point**: D2 - Complexity Estimation
**Mode**: Headless AI Judgment
**Type**: Ternary (Low/Medium/High)

**Logic** (Executed by Claude Code Headless):
```
ANALYZE Issue (title, body, labels)
ESTIMATE complexity based on:
  - Number of files to modify
  - Scope (isolated vs cross-cutting)
  - Testing requirements
  - External dependencies
  - Risk of breaking changes

IF Low (< 30 min, 1-3 files)
  THEN Auto-approve → D3
ELSE IF Medium (30-90 min, 4-10 files)
  THEN AI-assisted → D3 with monitoring
ELSE (High: > 90 min, 10+ files)
  THEN Escalate to TechLead
```

**Usage**:
```bash
./scripts/decision-trees/D2-complexity-check.sh <issue_number>
```

**Exit Codes**:
- `0` = Low complexity → Auto-approve
- `1` = Medium complexity → AI-assisted
- `2` = High complexity → Escalated

**Example**:
```bash
$ ./scripts/decision-trees/D2-complexity-check.sh 270

===================================
Decision Point D2: Complexity Check
===================================
Issue: #270
Mode: Headless AI Judgment
Time: 2025-10-26 15:42:00

Fetching Issue data...
Title: Fix memory leak in logger.rs
Labels: type:bug,priority:high,agent:codegen

Running AI complexity analysis...

===================================
Complexity Analysis Result
===================================
Complexity: Low
Estimated Files: 2
Estimated Duration: 25 minutes

Reasoning:
Isolated fix in miyabi-core/src/logger.rs. Replace mem::forget
with OnceCell pattern. No external dependencies. Existing tests
cover the change area.

✅ DECISION: LOW COMPLEXITY - Auto-approve
→ ACTION: Continue to D3 (Task Decomposition)
```

---

## 🎭 Orchestrator Reference

### autonomous-issue-processor.sh

**Purpose**: Complete Issue → Implementation → Test → Notify workflow

**Usage**:
```bash
./scripts/orchestrators/autonomous-issue-processor.sh <issue_number> [options]
```

**Options**:
- `--dry-run` - Simulate without making changes
- `--mode=phase1` - Real-time interactive (0-30s response)
- `--mode=phase2` - Alert-based sync (1-5 min) **[Default]**
- `--mode=phase3` - Async push (1-24 hr)

**Workflow**:

```
Phase 0: Safety Pre-flight
├─ Git safety check
├─ ANTHROPIC_API_KEY verification
└─ GitHub CLI authentication

Phase 1: Label Validation (D1)
├─ Execute: D1-label-check.sh
└─ Decision: Pass → Continue / Fail → Escalate PO

Phase 2: Complexity Check (D2)
├─ Execute: D2-complexity-check.sh
└─ Decision:
    ├─ Low → Auto-approve → Implementation
    ├─ Medium → AI-assisted → Implementation
    └─ High → Escalate TechLead → STOP

Phase 3: Implementation
├─ Execute: tools/claude-headless/01-process-issue.sh
└─ On Error → Escalate (mode-dependent)

Phase 4: Testing
├─ Execute: primitives/run-tests.sh
├─ If Compilation Error → cargo fix → Retry
└─ If Tests Fail → Escalate TechLead

Phase 5: Summary & Notification
├─ Log workflow results
├─ VOICEVOX notification
└─ Exit
```

**Rollback**: Automatic on error (trap ERR)

**Logs**: `/tmp/miyabi-automation/workflow-<issue_num>.log`

**Example**:
```bash
$ ./scripts/orchestrators/autonomous-issue-processor.sh 270

[PHASE] ==========================================
[PHASE] Miyabi Autonomous Issue Processor
[PHASE] ==========================================
[INFO] Issue: #270
[INFO] Mode: phase2
[INFO] Dry Run: false
[INFO] Time: 2025-10-26 15:45:00
[INFO] Log: /tmp/miyabi-automation/workflow-270.log
[PHASE]

[PHASE] Phase 0: Safety Pre-flight Checks
[PHASE] ==========================================
[INFO] Checking git repository safety...
✅ Git repository is in safe state
[INFO] Checking ANTHROPIC_API_KEY...
[INFO] Checking GitHub CLI authentication...
[SUCCESS] All pre-flight checks passed
[PHASE]

[PHASE] Decision Point D1: Label Validation
[PHASE] ==========================================
[DECISION] Mode: Script (Confirmed Process)
✅ DECISION: PASS - Labels are valid
[SUCCESS] D1 passed: Labels valid
[PHASE]

[PHASE] Decision Point D2: Complexity Estimation
[PHASE] ==========================================
[DECISION] Mode: Headless AI Judgment
✅ DECISION: LOW COMPLEXITY - Auto-approve
[SUCCESS] D2 passed: Low complexity - auto-approved
[PHASE]

[PHASE] Phase 1: Implementation (Headless Mode)
[PHASE] ==========================================
[INFO] Running Headless implementation...
[SUCCESS] Implementation phase complete
[PHASE]

[PHASE] Phase 2: Testing & Validation
[PHASE] ==========================================
[INFO] Running cargo test...
✅ All tests PASSED
[SUCCESS] All tests passed
[PHASE]

[PHASE] ==========================================
[PHASE] Workflow Summary
[PHASE] ==========================================
[INFO] Issue: #270
[INFO] Complexity: Low
[INFO] Mode: phase2
[INFO] Status: ✅ SUCCESS
[INFO] Time: 2025-10-26 15:50:00
[PHASE]

[SUCCESS] Issue #270 processed successfully!
[INFO] Full log: /tmp/miyabi-automation/workflow-270.log
[PHASE]

[INFO] Next Steps:
[INFO] 1. Review implementation in Interactive Mode
[INFO] 2. Create PR: gh pr create
[INFO] 3. Request review from team
[PHASE]
```

---

## 🚨 Error Handling

### Exit Code Standards

All scripts follow consistent exit code conventions:

- `0` - Success / Continue
- `1` - Failure / Escalate
- `2` - Critical error / Stop
- `3+` - Script-specific errors

### Rollback Mechanism

The orchestrator implements automatic rollback on error:

```bash
trap 'execute_rollback' ERR

push_rollback "git reset --hard HEAD"
push_rollback "git clean -fd"

# ... operations ...

# On error, rollback stack executes in LIFO order
```

### Escalation Matrix

| Error Type | Role | Response Mode |
|-----------|------|---------------|
| Invalid labels | PO | Async comment |
| High complexity | TechLead | Alert (phase2) |
| Build error | TechLead | Alert (phase2) |
| Test failure | TechLead | Alert (phase2) |
| Security issue | CISO | Immediate |
| Deploy failure | DevOps | Alert (phase2) |

---

## 📊 Human Intervention Modes

### Phase 1: Real-time Interactive

**Characteristics**:
- Operator always at PC
- 0-30 second response time
- 100% engagement
- Direct Claude Code Interactive conversation

**Use Case**:
- Active development sessions
- Complex architectural decisions
- New feature exploration

**Trigger**:
```bash
./autonomous-issue-processor.sh 270 --mode=phase1
```

**On Error**:
- Immediately activate Claude Code Interactive
- Stream Deck button flash
- macOS notification + VOICEVOX alert

---

### Phase 2: Alert-based Sync (Default)

**Characteristics**:
- Operator responds to alerts
- 1-5 minute response time
- 20-30% engagement
- Headless → Alert → Interactive transition

**Use Case**:
- Normal workflow (recommended)
- Operator available but not actively monitoring
- Batch processing with human oversight

**Trigger**:
```bash
./autonomous-issue-processor.sh 270  # Default
```

**On Error**:
- Multi-channel alert (macOS + VOICEVOX + Stream Deck)
- Operator moves to PC
- Switches to Interactive Mode
- Reviews error and provides guidance

---

### Phase 3: Async Push Notification

**Characteristics**:
- Operator responds hours later
- 1-24 hour response time
- 10-20% engagement
- Non-blocking workflow

**Use Case**:
- Background processing (cron jobs)
- Non-urgent maintenance
- Operator away from PC

**Trigger**:
```bash
./autonomous-issue-processor.sh 270 --mode=phase3
```

**On Error**:
- GitHub Issue comment (async)
- Discord/Slack push notification (future)
- No immediate blocking
- Operator reviews when available

---

## 🔗 Integration with Existing Tools

### Claude Code Headless Mode

**Location**: `tools/claude-headless/`

**Scripts**:
- `01-process-issue.sh` - Basic Issue analysis
- `02-parallel-agent.sh` - Parallel execution
- `03-hybrid-workflow.sh` - Interactive → Headless

**Used By**: Orchestrator Phase 3 (Implementation)

---

### Stream Deck Integration

**Location**: `tools/stream-deck/`

**Buttons**: 32-button layout for Interactive Mode control

**Integration Points**:
- Escalation flag: `/tmp/miyabi-escalation-flag`
- Button scripts can trigger orchestrator with `--mode=phase1`

---

### VOICEVOX Audio Alerts

**Location**: `tools/voicevox_enqueue.sh`

**Used By**:
- `primitives/escalate.sh`
- `orchestrators/autonomous-issue-processor.sh`

**Messages**:
- "Issue XXX の分析が完了しました"
- "エスカレーションが発生しました"
- "自動処理が完了しました"

---

## 📝 Development Guide

### Adding New Primitives

1. Create script in `scripts/primitives/`
2. Follow naming convention: `verb-noun.sh`
3. Implement standard exit codes (0/1/2)
4. Add usage header and documentation
5. Make executable: `chmod +x`
6. Update this README

**Template**:
```bash
#!/bin/bash
# Primitive Script: <Name>
# Purpose: <Description>
# Usage: ./<script-name>.sh <args>
# Exit codes:
#   0 = Success
#   1 = Failure
#   2 = Error

set -e

# Implementation...
```

---

### Adding New Decision Points

1. Create script in `scripts/decision-trees/`
2. Name: `D<number>-<name>.sh` (e.g., `D3-task-decompose.sh`)
3. Document in header:
   - Decision type (Binary/Ternary/Multi-way)
   - Mode (Script/Headless/Interactive)
   - Logic flow
4. Use primitives where possible
5. Update orchestrator to include new decision point

**Template**:
```bash
#!/bin/bash
# Decision Point D<N>: <Name>
# Purpose: <Description>
# Decision: <Binary/Ternary/Multi-way>
# Mode: <Script/Headless AI/Interactive>
# Exit codes:
#   0 = Path A
#   1 = Path B
#   2 = Path C (if ternary)

set -e

# Implementation using primitives and/or Headless Mode...
```

---

### Testing Scripts

**Dry Run**:
```bash
./autonomous-issue-processor.sh 270 --dry-run
```

**Individual Decision Points**:
```bash
./scripts/decision-trees/D1-label-check.sh 270
./scripts/decision-trees/D2-complexity-check.sh 270
```

**Primitives**:
```bash
./scripts/primitives/check-label.sh 270
./scripts/primitives/run-tests.sh
./scripts/primitives/git-safety-check.sh
```

---

## 🗺️ Roadmap

### Phase 2 ✅ (Current)
- [x] Primitive scripts (4 scripts)
- [x] D1: Label check
- [x] D2: Complexity check
- [x] Main orchestrator
- [x] Documentation

### Phase 3 (Next)
- [ ] D3-D7: Implementation decision points
- [ ] D8-D12: Testing decision points
- [ ] Claude Agent SDK integration (TypeScript)
- [ ] Rust bridge crate

### Phase 4 (Future)
- [ ] D13-D16: PR creation decision points
- [ ] D17-D20: Deployment decision points
- [ ] Safety layer implementation
- [ ] Circuit breaker patterns

### Phase 5 (Testing)
- [ ] End-to-end integration tests
- [ ] Performance benchmarks
- [ ] Chaos engineering tests

---

---

## 🔄 Claude Code Session Manager (CSM)

**Purpose**: Manage Claude Code sessions and enable Agent-to-Agent handoff

**Location**: `scripts/csm`

### Setup

```bash
# 1. Initialize
./scripts/csm init

# 2. Add alias to ~/.zshrc
export PATH="$HOME/Dev/miyabi-private/scripts:$PATH"
alias csm="$HOME/Dev/miyabi-private/scripts/csm"

# 3. Reload
source ~/.zshrc
```

### Basic Usage

```bash
# Register current session
csm register "CoordinatorAgent" "Issue #567 Phase 1"

# List active sessions
csm list active

# Handoff to another agent
csm handoff <session_id> "CodeGenAgent" "Implementation complete"

# Teleport to session
csm teleport <session_id>

# Show session details
csm show <session_id>

# Close session
csm close <session_id>
```

### Workflow Integration

Typical Agent-to-Agent workflow:

```bash
# 1. CoordinatorAgent: Task decomposition
csm register "CoordinatorAgent" "Issue #567 Phase 1実装"
# ... work ...

# 2. Handoff to CodeGenAgent
csm handoff <session_id> "CodeGenAgent" "タスク分解完了、実装依頼"
csm teleport <session_id>
# ... implementation ...

# 3. Handoff to ReviewAgent
csm handoff <session_id> "ReviewAgent" "実装完了、レビュー依頼"
csm teleport <session_id>
# ... code review ...

# 4. Handoff to DeploymentAgent
csm handoff <session_id> "DeploymentAgent" "レビュー完了、デプロイ依頼"
csm teleport <session_id>
# ... deployment ...

# 5. Close session
csm close <session_id>
```

### Data Storage

```
~/.claude-sessions/
├── sessions.json     # Session database
└── logs/            # Session logs
    └── <session_id>.log
```

### Session JSON Schema

```json
{
  "sessions": [{
    "id": "96793379-b31a-4e2a-aac7-12f4a715d053",
    "agent": "CoordinatorAgent",
    "purpose": "Issue #567 Phase 1実装",
    "created_at": "2025-10-27T09:44:37+09:00",
    "last_accessed": "2025-10-27T09:44:37+09:00",
    "status": "active",
    "log_file": "~/.claude-sessions/logs/96793379-b31a-4e2a-aac7-12f4a715d053.log",
    "handoff_history": [{
      "from": "CoordinatorAgent",
      "to": "CodeGenAgent",
      "timestamp": "2025-10-27T10:00:00+09:00",
      "note": "Implementation complete"
    }]
  }]
}
```

### Future Enhancements

- [ ] MCP Server implementation
- [ ] Session auto-archiving
- [ ] Session search/filter
- [ ] GitHub Issue linkage
- [ ] Session analytics
- [ ] Worktree integration

---

---

## 🎨 TCG Card Generation System

**Purpose**: Generate MIYABI TCG card images for all 24 agents using BytePlus ARK API

### Quick Start

```bash
# 1. Check environment
python3 scripts/check_tcg_env.py

# 2. Generate all cards
python3 scripts/generate_tcg_cards.py

# 3. Verify results
python3 scripts/verify_cards.py
```

### TCG Scripts

| Script | Purpose | Output |
|--------|---------|--------|
| **check_tcg_env.py** | Environment validation | Readiness report |
| **generate_tcg_cards.py** | Generate 19 missing cards | 19 PNG files |
| **verify_cards.py** | Verify all 24 cards | Quality report |

### Card Specifications

- **Total**: 24 cards (5 existing + 19 new)
- **Rarities**: 6R, 12SR, 4SSR, 2UR
- **Resolution**: 1024x1024 PNG
- **File Size**: 100-200 KB
- **Style**: Cyberpunk anime TCG

### Documentation

- **QUICK_START_TCG_GENERATION.md** - 3-step quick guide
- **README_TCG_GENERATION.md** - Complete usage guide
- **TCG_GENERATION_SUMMARY.md** - Technical summary
- **CARD_DESIGN_SPEC.md** - Design specifications
- **VERIFICATION_CHECKLIST.md** - QA checklist
- **TCG_CARD_GENERATION_COMPLETE.md** - Full package overview

### API Details

- **Model**: BytePlus ARK seedream-4-0-250828
- **Cost**: ~$0.20-0.40 for 19 cards
- **Time**: 40-60 seconds total

---

## 🔗 Related Documentation

- **Master Plan**: `docs/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md`
- **Decision Tree**: `docs/DECISION_TREE_COMPLETE.md`
- **Process Flows**: `docs/MIYABI_PROCESS_FLOW_DIAGRAMS.puml`
- **Human Intervention**: `docs/HUMAN_INTERVENTION_PATTERNS.puml`
- **Headless Tools**: `tools/claude-headless/README.md`
- **Claude Code Integration**: `docs/CLAUDE_CODE_INTEGRATION_STRATEGY.md`
- **Agent Characters**: `.claude/agents/AGENT_CHARACTERS.md`
- **ImageGenAgent Spec**: `.claude/agents/specs/coding/imagegen-agent.md`

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Miyabi Automation - Bringing Autonomous Operation to Reality** 🚀
