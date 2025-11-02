# 🔄 Post-Reboot Recovery Plan

**Created**: 2025-11-01 19:20
**Reason**: File system errors during Cargo build (error code 2: No such file or directory)
**Target**: Execute all 58 open GitHub Issues

---

## 📋 Current State (Before Reboot)

### ✅ Completed
1. ✅ Lark DX Operation cleanup
   - Killed 5 tmux sessions
   - Removed 5 worktrees
   - Deleted 5 task branches

2. ✅ Miyabi Issue analysis
   - Total: 58 open Issues
   - P0-Critical: 1
   - P1-High: 15
   - P2-Medium: 25
   - P3-Low: 17

### ❌ Blocked
- Miyabi build system: File system errors
- Cannot execute infinity mode without working binary

### 📝 Uncommitted Changes
```
M .kamui/model-versions-cache.json
M Cargo.lock
M miyabi_def/SWML_PAPER.tex
?? .kamui/prompt/
?? miyabi_def/SWML_PAPER_JA.*
```

---

## 🚀 Post-Reboot Action Plan

### Step 1: Navigate to Miyabi Project
```bash
cd /Users/shunsuke/Dev/miyabi-private
```

### Step 2: Verify File System Health
```bash
# Check disk space
df -h .

# Check target directory
ls -la target/ 2>/dev/null || echo "target missing (OK)"
```

### Step 3: Clean Build
```bash
# Remove corrupted build artifacts
rm -rf target

# Rebuild from scratch
cargo build --release --bin miyabi
```

**Expected**: Build should succeed after reboot

### Step 4: Verify Binary
```bash
# Check binary exists
ls -lh target/release/miyabi

# Test execution
./target/release/miyabi --version
```

### Step 5: Execute All 58 Issues (Infinity Mode)

#### Method A: Using Coordinator Agent (Recommended)
```bash
# Process all open Issues automatically
cargo run --release --bin miyabi -- agent run coordinator --infinity

# Or with concurrency limit
cargo run --release --bin miyabi -- agent run coordinator --infinity --concurrency 5
```

#### Method B: Using Skill (Alternative)
```bash
# In Claude Code session:
# 1. Navigate to miyabi-private
# 2. Use skill: agent-execution
# 3. Request: "Process all 58 open Issues"
```

### Step 6: Monitor Progress
```bash
# Watch execution status
./target/release/miyabi status --watch

# Or use KAMUI monitoring
open .ai/logs/latest-execution.html
```

---

## 📊 Expected Results

### Success Criteria
- ✅ All 58 Issues processed
- ✅ PRs created for completed work
- ✅ No merge conflicts
- ✅ All worktrees cleaned up
- ✅ Execution summary generated

### Output Locations
- **Plans**: `.ai/plans/{issue-number}/Plans-*.md`
- **Logs**: `.ai/logs/{timestamp}-execution.log`
- **Reports**: `.ai/reports/{timestamp}-summary.json`
- **Worktrees**: `.worktrees/issue-*/` (temporary, auto-cleanup)

---

## 🔧 Troubleshooting

### If Build Still Fails
```bash
# Nuclear option: Clear all Cargo caches
rm -rf ~/.cargo/registry/cache
rm -rf ~/.cargo/registry/index
rm -rf ~/.cargo/git

# Rebuild
cargo build --release --bin miyabi
```

### If Issues Already Processing
```bash
# Check for existing worktrees
git worktree list

# Check for running agents
ps aux | grep miyabi

# Resume from last checkpoint
./target/release/miyabi resume
```

### If Compilation Errors Persist
```bash
# Fix coordinator_with_llm.rs errors manually
# Line 51: role: if m.role == miyabi_llm::types::ChatRole::User
# Line 58: miyabi_llm::types::ChatMessage::assistant(response)
```

---

## 📞 After Completion

1. **Generate Summary Report**
   ```bash
   ./target/release/miyabi report --format html > .ai/reports/all-issues-summary.html
   ```

2. **Create Completion Announcement**
   - Post to Discord
   - Update project README
   - Send VOICEVOX notification

3. **Cleanup**
   ```bash
   # Remove stale worktrees
   git worktree prune

   # Archive logs
   tar -czf .ai/logs/archive-$(date +%Y%m%d).tar.gz .ai/logs/*.log
   ```

---

## 🎯 Next Session Start

When you return to Claude Code after reboot, say:

> "Continue post-reboot recovery plan. Execute all 58 Miyabi Issues."

Claude will read this file and resume from Step 1.

---

**End of Recovery Plan**
