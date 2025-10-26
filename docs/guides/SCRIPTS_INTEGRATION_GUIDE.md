# Miyabi Scripts Integration Guide

**Created**: 2025-10-26
**Version**: 1.0.0
**Status**: Phase 2 Complete ✅

Complete guide for integrating and using the Miyabi autonomous operation scripts with Claude Code Interactive/Headless modes.

---

## 📋 Quick Reference

### File Locations

```
Miyabi Project Root
├── scripts/                          # NEW: Automation scripts
│   ├── primitives/                   # Layer 1: Building blocks
│   ├── decision-trees/               # Layer 2: Decision points
│   ├── orchestrators/                # Layer 3: Complete workflows
│   ├── safety/                       # Layer 4: Safety mechanisms (TBD)
│   └── README.md                     # Complete documentation
│
├── tools/
│   └── claude-headless/              # EXISTING: Headless Mode scripts
│       ├── 01-process-issue.sh
│       ├── 02-parallel-agent.sh
│       ├── 03-hybrid-workflow.sh
│       └── README.md
│
└── docs/
    ├── MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md  # Architecture
    ├── DECISION_TREE_COMPLETE.md                    # D1-D20 specs
    ├── HUMAN_INTERVENTION_PATTERNS.puml             # 3-phase patterns
    └── SCRIPTS_INTEGRATION_GUIDE.md                 # THIS FILE
```

---

## 🚀 Getting Started

### Prerequisites

**Required**:
```bash
# 1. Claude Code CLI
which claude
# Should output: /usr/local/bin/claude (or similar)

# 2. GitHub CLI
which gh
# Should output: /usr/local/bin/gh

# 3. Anthropic API Key
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-...
```

**Optional**:
```bash
# VOICEVOX worker (audio notifications)
pgrep -f "voicevox_worker.sh"

# Stream Deck software (button control)
# Check: Applications → Elgato Stream Deck.app
```

### Installation

```bash
cd /Users/shunsuke/Dev/miyabi-private

# Verify scripts are executable
ls -l scripts/primitives/*.sh
ls -l scripts/decision-trees/*.sh
ls -l scripts/orchestrators/*.sh

# If not executable:
chmod +x scripts/**/*.sh
```

---

## 📖 Usage Patterns

### Pattern 1: Full Autonomous Processing (Phase 2 - Default)

**Use Case**: Normal workflow, operator responds to alerts within 1-5 minutes

```bash
# Process Issue #270 with default settings
./scripts/orchestrators/autonomous-issue-processor.sh 270

# What happens:
# 1. Git safety check (script)
# 2. D1: Label validation (script)
# 3. D2: Complexity check (Headless AI)
# 4. Implementation (Headless)
# 5. Testing (script + auto-fix)
# 6. Notification (VOICEVOX + macOS)

# If errors occur:
# → Multi-channel alert sent
# → Operator responds within 1-5 min
# → Switches to Interactive Mode to fix
```

**Expected Output**:
```
[PHASE] ==========================================
[PHASE] Miyabi Autonomous Issue Processor
[PHASE] ==========================================
[INFO] Issue: #270
[INFO] Mode: phase2
[INFO] Dry Run: false

[PHASE] Phase 0: Safety Pre-flight Checks
[SUCCESS] All pre-flight checks passed

[PHASE] Decision Point D1: Label Validation
[SUCCESS] D1 passed: Labels valid

[PHASE] Decision Point D2: Complexity Estimation
[SUCCESS] D2 passed: Low complexity - auto-approved

[PHASE] Phase 1: Implementation (Headless Mode)
[SUCCESS] Implementation phase complete

[PHASE] Phase 2: Testing & Validation
[SUCCESS] All tests passed

[SUCCESS] Issue #270 processed successfully!
[INFO] Full log: /tmp/miyabi-automation/workflow-270.log

[INFO] Next Steps:
[INFO] 1. Review implementation in Interactive Mode
[INFO] 2. Create PR: gh pr create
```

---

### Pattern 2: Real-time Interactive (Phase 1)

**Use Case**: Active development, operator always at PC, immediate feedback

```bash
# Process with Phase 1 mode (real-time)
./scripts/orchestrators/autonomous-issue-processor.sh 270 --mode=phase1

# What's different:
# - On error → Immediate Claude Code Interactive activation
# - Stream Deck button flashes
# - No delay for operator response
# - Direct conversation with AI
```

**When to Use**:
- Complex architectural decisions
- Learning new codebase areas
- Pair programming with AI
- Critical production issues

---

### Pattern 3: Async Push Notification (Phase 3)

**Use Case**: Background processing, operator responds hours later

```bash
# Process with Phase 3 mode (async)
./scripts/orchestrators/autonomous-issue-processor.sh 270 --mode=phase3

# What's different:
# - On error → GitHub Issue comment only
# - Discord/Slack push (future integration)
# - No immediate blocking
# - Operator reviews when available

# Ideal for:
# - Cron jobs (nightly batch processing)
# - Non-urgent maintenance tasks
# - Weekend automation
```

**Cron Setup**:
```bash
# Add to crontab (run every night at 2 AM)
0 2 * * * cd /Users/shunsuke/Dev/miyabi-private && ./scripts/orchestrators/autonomous-issue-processor.sh $(gh issue list --label auto-process --json number -q '.[0].number') --mode=phase3 >> /tmp/miyabi-cron.log 2>&1
```

---

### Pattern 4: Dry Run (Testing)

**Use Case**: Test workflow without making changes

```bash
# Simulate processing Issue #270
./scripts/orchestrators/autonomous-issue-processor.sh 270 --dry-run

# What happens:
# ✅ D1: Label check (executes)
# ⚠️  D2: Complexity check (skipped)
# ⚠️  Implementation (skipped)
# ⚠️  Testing (skipped)
# ✅ Summary (shows what would happen)
```

**When to Use**:
- Testing new scripts
- Verifying label setup
- Understanding workflow flow
- Training/demos

---

## 🧪 Testing Individual Components

### Test Primitives

```bash
# 1. Test label checker
./scripts/primitives/check-label.sh 270

# Expected: Lists all labels, validates type:* and priority:* exist

# 2. Test git safety
./scripts/primitives/git-safety-check.sh

# Expected: Checks for uncommitted changes, branch status

# 3. Test escalation (safe - just sends notifications)
./scripts/primitives/escalate.sh "TechLead" "Test message" 270

# Expected: macOS notification, VOICEVOX alert, GitHub comment

# 4. Test runner (on single package)
./scripts/primitives/run-tests.sh miyabi-core

# Expected: Runs cargo test, reports pass/fail
```

### Test Decision Points

```bash
# Test D1 (Label validation)
./scripts/decision-trees/D1-label-check.sh 270

# Test D2 (Complexity check) - requires ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY="sk-ant-..."
./scripts/decision-trees/D2-complexity-check.sh 270

# View results
cat /tmp/miyabi-automation/complexity-270.json
```

---

## 🔗 Integration with Stream Deck

### Current Setup

**Stream Deck Layout**: 32 buttons controlling Claude Code Interactive Mode

**Location**: `tools/stream-deck/`

**New Integration**: Add autonomous processor buttons

### Recommended Button Setup

**Button 25-28**: Autonomous Processing

| Button | Action | Command |
|--------|--------|---------|
| **25** | "Auto Process (Phase 1)" | `./scripts/orchestrators/autonomous-issue-processor.sh $(pbpaste) --mode=phase1` |
| **26** | "Auto Process (Phase 2)" | `./scripts/orchestrators/autonomous-issue-processor.sh $(pbpaste) --mode=phase2` |
| **27** | "Auto Process (Phase 3)" | `./scripts/orchestrators/autonomous-issue-processor.sh $(pbpaste) --mode=phase3` |
| **28** | "Dry Run Test" | `./scripts/orchestrators/autonomous-issue-processor.sh $(pbpaste) --dry-run` |

**Workflow**:
1. Copy Issue number to clipboard (e.g., "270")
2. Press Stream Deck button
3. Script reads from clipboard: `$(pbpaste)`
4. Autonomous processing begins

**Example Stream Deck Script** (`tools/stream-deck/25-auto-process-phase1.sh`):
```bash
#!/bin/bash
cd /Users/shunsuke/Dev/miyabi-private
ISSUE=$(pbpaste)
./scripts/orchestrators/autonomous-issue-processor.sh "$ISSUE" --mode=phase1
```

---

## 🔔 Notification Channels

### 1. macOS Notification Center

**Triggered By**:
- `primitives/escalate.sh`
- `orchestrators/autonomous-issue-processor.sh`

**Example**:
```applescript
osascript -e "display notification \"Issue #270 processing complete\" with title \"Miyabi\" sound name \"Glass\""
```

**Configuration**:
- Settings → Notifications → Script Editor
- Enable "Allow Notifications"

---

### 2. VOICEVOX Audio Alerts

**Triggered By**:
- `primitives/escalate.sh` (on error)
- `orchestrators/autonomous-issue-processor.sh` (on complete)

**Command**:
```bash
tools/voicevox_enqueue.sh "Issue 270 の処理が完了しました"
```

**Setup**:
- VOICEVOX Engine must be running
- Worker: `tools/voicevox_worker.sh`

**Check Status**:
```bash
pgrep -f "voicevox_worker.sh"
# Should output: PID number
```

---

### 3. Stream Deck Visual Alerts

**Mechanism**: Flag file at `/tmp/miyabi-escalation-flag`

**Triggered By**: `primitives/escalate.sh`

**Example Content**:
```
2025-10-26 15:45:00 - TechLead - Build failed on Issue #270
```

**Stream Deck Integration** (Future):
- Poll `/tmp/miyabi-escalation-flag` every 5 seconds
- Flash button red when file exists
- Clear flag on button press

---

### 4. GitHub Issue Comments

**Triggered By**: `primitives/escalate.sh` (if issue number provided)

**Example**:
```bash
./scripts/primitives/escalate.sh "TechLead" "Build error detected" 270
```

**Creates Comment**:
```markdown
## 🚨 Escalation Required

**Role**: TechLead
**Time**: 2025-10-26 15:45:00

**Message**:
Build error detected

**Action Required**: Please review and take appropriate action.

---
🤖 Generated by Miyabi Automation System
```

---

## 📊 Monitoring & Logs

### Log Files

**Workflow Logs**: `/tmp/miyabi-automation/workflow-<issue_num>.log`
```bash
# View recent workflow
tail -f /tmp/miyabi-automation/workflow-270.log
```

**Escalation History**: `logs/escalations.log`
```bash
# View all escalations
cat logs/escalations.log

# Latest 10 escalations
tail -10 logs/escalations.log
```

**Test Output**: `/tmp/miyabi-automation/test-output.log`
```bash
# View test results
cat /tmp/miyabi-automation/test-output.log
```

**Complexity Analysis**: `/tmp/miyabi-automation/complexity-<issue_num>.json`
```bash
# View AI complexity analysis
jq '.' /tmp/miyabi-automation/complexity-270.json
```

---

### Real-time Monitoring

**Watch Workflow Progress**:
```bash
# Terminal 1: Run workflow
./scripts/orchestrators/autonomous-issue-processor.sh 270

# Terminal 2: Watch log
tail -f /tmp/miyabi-automation/workflow-270.log

# Terminal 3: Watch escalations
tail -f logs/escalations.log
```

---

## 🛡️ Safety & Error Handling

### Rollback Mechanism

**Automatic**: Triggered on ERR signal

**Example**:
```bash
# If script fails halfway through:
# 1. Trap catches error
# 2. execute_rollback() is called
# 3. Rollback stack executes in reverse order

# Rollback commands are pushed during workflow:
push_rollback "git reset --hard HEAD"
push_rollback "git clean -fd"
push_rollback "cargo clean"
```

**Manual Rollback**:
```bash
# If autonomous processor crashed:
cd /Users/shunsuke/Dev/miyabi-private
git status
git reset --hard HEAD  # Discard changes
git clean -fd           # Remove untracked files
```

---

### Pre-flight Checks

**Always Run Before Automation**:

1. **Git Safety**
   - No uncommitted changes
   - Not on main/master
   - Not in detached HEAD

2. **API Keys**
   - ANTHROPIC_API_KEY set
   - GitHub CLI authenticated

3. **Environment**
   - Clean working directory
   - Dependencies installed
   - Tests passing

**Override** (if you really need to):
```bash
# Allow automation on main branch (DANGEROUS)
ALLOW_MAIN=true ./scripts/orchestrators/autonomous-issue-processor.sh 270
```

---

### Escalation Matrix

| Error Scenario | Escalation Role | Response Time | Channels |
|---------------|----------------|---------------|----------|
| Invalid labels | ProductOwner | Async (24hr) | GitHub comment |
| High complexity | TechLead | Alert (5min) | All channels |
| Build error | TechLead | Alert (5min) | All channels |
| Test failure | TechLead | Alert (5min) | All channels |
| Security issue | CISO | Immediate | All channels |
| Deploy failure | DevOps | Alert (5min) | All channels |

---

## 🔧 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not set"

```bash
# Set in current shell
export ANTHROPIC_API_KEY="sk-ant-..."

# Set permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc
source ~/.zshrc
```

---

### Issue: "claude: command not found"

```bash
# Install Claude Code CLI
# See: https://docs.claude.com/claude-code

# Verify installation
which claude
claude --version
```

---

### Issue: "GitHub CLI not authenticated"

```bash
# Login to GitHub
gh auth login

# Follow prompts:
# 1. Select: GitHub.com
# 2. Protocol: HTTPS
# 3. Authenticate: Browser
# 4. Paste token

# Verify
gh auth status
```

---

### Issue: "Git safety check failed - uncommitted changes"

```bash
# Option 1: Commit changes
git add .
git commit -m "WIP: Before running automation"

# Option 2: Stash changes
git stash

# Then retry automation
```

---

### Issue: "D2 complexity check returns 'Unknown'"

**Cause**: Claude Code Headless output parsing failed

**Debug**:
```bash
# View raw output
cat /tmp/miyabi-automation/complexity-270.json

# Check if result contains JSON
jq '.result' /tmp/miyabi-automation/complexity-270.json

# If result is markdown with code blocks:
# → Script will auto-extract JSON between ```json ... ```
```

**Fix**: Ensure prompt asks for pure JSON output

---

### Issue: "Tests fail with compilation errors"

**Automatic Fix Attempt**:
```bash
# The orchestrator automatically tries:
cargo fix --allow-dirty --allow-staged

# If this succeeds, tests are re-run
# If this fails → Escalates to TechLead
```

**Manual Fix**:
```bash
# Run clippy for detailed errors
cargo clippy --all

# Fix errors manually
# Then re-run orchestrator
```

---

## 📈 Performance & Costs

### Execution Time

| Phase | Duration | Components |
|-------|----------|-----------|
| Pre-flight | 2-5s | Git checks, auth verification |
| D1: Labels | 1-2s | gh API call, label parsing |
| D2: Complexity | 10-30s | Claude Headless AI analysis |
| Implementation | 30-300s | Depends on complexity |
| Testing | 10-120s | cargo test (varies by package) |
| **Total** | **1-7 min** | Low complexity issues |

### API Costs

**Claude API Usage**:
- **D2 (Complexity Check)**: ~$0.002-0.005 per Issue
- **Implementation (Headless)**: ~$0.01-0.05 per Issue
- **Total per Issue**: ~$0.012-0.055

**Example Monthly Cost** (100 Issues):
```
100 issues × $0.03 avg = $3.00/month
```

**GitHub API**:
- Free tier: 5000 requests/hour
- Automation uses ~5 requests per Issue
- Monthly: Negligible cost

---

## 🗺️ Next Steps (Phase 3+)

### Phase 3: Claude Agent SDK Integration

**Goal**: Replace bash + `claude -p` with programmatic SDK control

**Implementation**:
```typescript
// scripts/sdk-wrapper/headless-runner.ts
import { ClaudeCLI } from '@anthropic-ai/claude-code-sdk';

const session = await ClaudeCLI.createHeadlessSession({
  prompt: "Analyze Issue #270...",
  allowedTools: ["Read", "Grep", "Bash"],
  maxTurns: 10
});

const result = await session.run();
console.log(JSON.stringify(result));
```

**Bridge to Rust**:
```rust
// crates/miyabi-agent-sdk/src/headless.rs
pub struct HeadlessRunner {
    session_id: String,
}

impl HeadlessRunner {
    pub async fn run(&self, prompt: &str) -> Result<SessionResult> {
        // Call TypeScript wrapper via subprocess
        let output = Command::new("node")
            .arg("scripts/sdk-wrapper/headless-runner.js")
            .arg("--prompt").arg(prompt)
            .output()?;

        Ok(serde_json::from_slice(&output.stdout)?)
    }
}
```

---

### Phase 4: Safety Mechanisms

**Goal**: Implement all 6 safety layers

**Scripts to Create**:
- `scripts/safety/input-validator.sh`
- `scripts/safety/pre-flight-checker.sh`
- `scripts/safety/execution-monitor.sh`
- `scripts/safety/result-validator.sh`
- `scripts/safety/rollback-manager.sh`
- `scripts/safety/escalation-router.sh`

---

### Phase 5: End-to-End Testing

**Goal**: Validate complete automation pipeline

**Test Scenarios**:
1. Happy path (Low complexity Issue → Implementation → Tests → Success)
2. Medium complexity (AI-assisted implementation)
3. High complexity (Escalation to human)
4. Build error (Auto-fix attempt)
5. Test failure (Escalation)
6. Git safety failure (Pre-flight check)

**Test Command**:
```bash
# Run full integration test suite
./scripts/tests/e2e-autonomous-workflow.sh
```

---

## 📚 Additional Resources

### Documentation

- **Architecture**: `docs/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md` - Complete design
- **Decision Tree**: `docs/DECISION_TREE_COMPLETE.md` - All D1-D20 specifications
- **Process Flows**: `docs/MIYABI_PROCESS_FLOW_DIAGRAMS.puml` - Visual diagrams
- **Human Patterns**: `docs/HUMAN_INTERVENTION_PATTERNS.puml` - 3-phase patterns
- **Scripts Reference**: `scripts/README.md` - Complete script documentation
- **Headless Tools**: `tools/claude-headless/README.md` - Headless Mode usage

### External Links

- **Claude Code Docs**: https://docs.claude.com/claude-code
- **Claude Agent SDK**: https://github.com/anthropics/claude-agent-sdk
- **GitHub CLI Docs**: https://cli.github.com/manual/
- **VOICEVOX**: https://voicevox.hiroshiba.jp/

---

## 🎓 Learning Path

### Beginner: Understanding the System

1. Read: `docs/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md` (Section 1-3)
2. Run: `./autonomous-issue-processor.sh 270 --dry-run`
3. Test: Individual primitives (`check-label.sh`, `run-tests.sh`)
4. Explore: Logs in `/tmp/miyabi-automation/`

### Intermediate: Using Automation

1. Read: `scripts/README.md` (Complete)
2. Run: Real Issue with Phase 2 mode
3. Monitor: Watch logs in real-time
4. Customize: Create custom decision point script

### Advanced: Extending the System

1. Read: `docs/DECISION_TREE_COMPLETE.md`
2. Implement: New decision point (D3-D20)
3. Integrate: Claude Agent SDK (TypeScript)
4. Contribute: Safety layer implementation

---

## ✅ Checklist for Production Use

Before using autonomous scripts in production:

- [ ] ANTHROPIC_API_KEY set and verified
- [ ] GitHub CLI authenticated (`gh auth status`)
- [ ] Stream Deck integration tested (button triggers)
- [ ] VOICEVOX worker running (audio alerts)
- [ ] Git safety checks passing
- [ ] Test primitives individually (all 4 scripts)
- [ ] Test decision points (D1, D2)
- [ ] Dry run successful on real Issue
- [ ] Phase 2 mode tested with low-complexity Issue
- [ ] Escalation notifications received (all channels)
- [ ] Rollback mechanism tested
- [ ] Log files reviewed and understood
- [ ] Backup strategy in place (git branches, stash)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Ready to bring full autonomy to Miyabi!** 🚀
