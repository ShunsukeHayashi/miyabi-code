# Full Automation Edge Case Test Plan

**Test Date**: 2025-11-02
**Miyabi Version**: v0.1.x  
**Tauri Desktop**: miyabi-desktop

## Pre-Flight Checks ✅

### Dependencies
- [x] tmux installed: `/opt/homebrew/bin/tmux`
- [x] claude installed: `/opt/homebrew/bin/claude`
- [x] .env file exists: `/Users/shunsuke/Dev/miyabi-private/.env`
- [x] GITHUB_REPOSITORY configured: `customer-cloud/miyabi-private`

### Environment
- [x] Repository root: `/Users/shunsuke/Dev/miyabi-private`
- [x] Log directories: `.ai/logs/claude-code/`, `.ai/logs/codex/`
- [x] Tauri dev running: `http://localhost:1420`
- [x] Vite server: Ready

---

## Edge Case Tests

### Test 1: Existing Session Auto-Cleanup
**Scenario**: User clicks "Start" when session already exists
**Expected**: Auto-cleanup existing session, then create new one

**Test Steps**:
1. Create test session: `miyabi-auto-test-cleanup`
2. Click "Start Full Automation" in UI
3. Verify old session killed
4. Verify new session created

**Current Status**: 🔄 Testing...

### Test 2: Missing Dependencies
**Scenario**: tmux or claude not installed
**Expected**: Graceful error with actionable message

**Test Cases**:
- Missing tmux → "tmux not found. Install: brew install tmux"
- Missing claude → "Claude CLI not found. Install from: https://claude.com/code"

**Current Status**: ⏸️ Pending

### Test 3: Invalid Repository Path
**Scenario**: .env points to non-existent directory
**Expected**: Validation error before tmux session creation

**Test Cases**:
- Non-existent path
- Permission denied
- Not a git repository

**Current Status**: ⏸️ Pending

### Test 4: Concurrent Automation Prevention
**Scenario**: User clicks "Start" multiple times rapidly
**Expected**: Block subsequent clicks until first completes

**Implementation**: Frontend loading state + backend mutex

**Current Status**: ⏸️ Pending

### Test 5: Log Directory Permissions
**Scenario**: Cannot create .ai/logs/ directories
**Expected**: Clear error message with permissions fix command

**Test Cases**:
- Read-only filesystem
- Permission denied on .ai/
- Disk full

**Current Status**: ⏸️ Pending

### Test 6: GitHub API Failures
**Scenario**: GitHub token invalid or rate limited
**Expected**: Graceful degradation, continue with manual mode

**Test Cases**:
- Invalid GITHUB_TOKEN
- Rate limit exceeded
- Network timeout

**Current Status**: ⏸️ Pending

### Test 7: Process Monitoring
**Scenario**: Claude Code/Codex crashes mid-execution
**Expected**: Detect crash, show error, offer restart

**Test Cases**:
- Process killed externally
- Segfault/panic
- OOM kill

**Current Status**: ⏸️ Pending

### Test 8: UI Real-Time Updates
**Scenario**: High-frequency output from tmux
**Expected**: Smooth scrolling, no UI freeze

**Test Load**:
- 100 lines/sec output
- 1000 lines/sec output
- Mixed slow/fast outputs

**Current Status**: ⏸️ Pending

### Test 9: Mid-Execution Cleanup
**Scenario**: User clicks "Stop" while agents running
**Expected**: Clean tmux kill, no orphaned processes

**Verification**:
- All panes closed
- No zombie processes
- Logs flushed

**Current Status**: ⏸️ Pending

### Test 10: Long-Running Stability
**Scenario**: Automation runs for 1+ hours
**Expected**: No memory leaks, stable polling

**Metrics**:
- Memory usage over time
- CPU usage stability
- UI responsiveness

**Current Status**: ⏸️ Pending

---

## Miyabi Concept Alignment

### Core Principles Applied
✅ **GitHub as OS**: Issues → Tasks → Agents → PRs  
✅ **Git Worktree**: Parallel execution foundation  
✅ **Full Autonomy**: Zero human intervention required  
✅ **Observability**: Real-time monitoring of all agents  

### Integration Points
- [ ] Agent coordination through Orchestrator window
- [ ] Issue priority detection (P1-High → P2-Medium → P3-Low)
- [ ] Automatic PR creation on task completion
- [ ] VOICEVOX narration integration
- [ ] Knowledge graph updates

---

## Test Execution Log

