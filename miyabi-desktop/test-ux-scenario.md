# Miyabi Desktop UX Test Scenario

## Test Date: 2025-10-31
## Target: Real-time Log Streaming Fix

---

## Test Scenario 1: Agent Execution with Real-time Logs

### Pre-conditions
- Miyabi Desktop running at `localhost:1420`
- Chrome DevTools open (Cmd+Option+I)
- Terminal visible to see Tauri backend logs

### Test Steps

#### Step 1: Navigate to Agent Execution Panel
1. Open `http://localhost:1420` in Chrome
2. Click on **Bot icon** (1st icon in sidebar) to open Agent Execution Panel
3. **Expected**: Panel loads with agent cards and issue dropdown

#### Step 2: Open Chrome DevTools
1. Press `Cmd+Option+I` to open DevTools
2. Click on **Console** tab
3. **Expected**: Console is clear or shows initialization logs

#### Step 3: Select Agent and Issue
1. In the Agent Execution Panel, click on **CoordinatorAgent** card
2. From the **Issue** dropdown, select any open issue (or leave as "No Issue")
3. **Expected**: Agent card is highlighted, issue is selected

#### Step 4: Execute Agent
1. Click **Execute Agent** button
2. **Monitor THREE locations simultaneously**:
   - **UI**: Execution status indicator (should show "Running" with loading spinner)
   - **Chrome Console**: Should show debug logs:
     ```
     [DEBUG] Setting up output listener for execution: <uuid>
     [DEBUG] Output listener setup complete
     [DEBUG] Received agent output: <log line>
     [DEBUG] Received agent output: <log line>
     ...
     ```
   - **Terminal**: Should show backend debug logs:
     ```
     [DEBUG] Emitting stdout: <log line>
     [DEBUG] Emitting stderr: <log line>
     [DEBUG] stdout handler completed
     [DEBUG] stderr handler completed
     ```

#### Step 5: Verify Real-time Log Display
1. **During execution**, scroll down in the output area
2. **Expected**:
   - Logs appear line-by-line as agent runs (NOT all at once after completion)
   - Output area auto-scrolls to bottom
   - Each line matches what's shown in Terminal `[DEBUG] Emitting stdout:`

#### Step 6: Verify Completion
1. Wait for agent to complete
2. **Expected**:
   - Status changes to "Success" (green) or "Failed" (red)
   - Duration is displayed (e.g., "59.60s")
   - Action buttons appear:
     - "GitHubを開く"
     - "詳細ログ"
     - "Pull Requests"
     - "Issue #XXX" (if issue was selected)
   - All output is visible in scrollable area

---

## Test Scenario 2: Keyboard Shortcuts

### Test Steps

#### Step 1: Command Palette
1. Press `Cmd+K` or `Cmd+Shift+P`
2. **Expected**: Command Palette opens
3. Type "agent"
4. **Expected**: "エージェント実行" command is filtered
5. Press `Enter`
6. **Expected**: Navigates to Agent Execution Panel

#### Step 2: Quick Panel Switching
1. Press `Cmd+1`
2. **Expected**: Switches to Agent Execution Panel
3. Press `Cmd+2`
4. **Expected**: Switches to Terminal Panel
5. Press `Cmd+3`
6. **Expected**: Switches to Workflow DAG Panel
7. Press `Cmd+4`
8. **Expected**: Switches to VOICEVOX Panel
9. Press `Cmd+5`
10. **Expected**: Switches to GitHub Issues Panel
11. Press `Cmd+6`
12. **Expected**: Switches to Settings Panel

---

## Test Scenario 3: Issue Selection UX

### Test Steps

#### Step 1: Issue Dropdown Loading
1. Navigate to Agent Execution Panel
2. **Expected**: Issue dropdown shows "Loading..." briefly
3. Wait 2-3 seconds
4. **Expected**: Dropdown populates with actual GitHub issues:
   ```
   No Issue (Auto-select)
   #270 - Fix real-time log streaming from ag...
   #271 - Add progress indicator with estimate...
   ...
   ```

#### Step 2: Issue Selection
1. Click on issue dropdown
2. **Expected**: All issues are readable (truncated at 40 chars with "...")
3. Select issue #270
4. **Expected**: Dropdown shows selected issue number and title

#### Step 3: Execute with Issue
1. Select CoordinatorAgent
2. Select Issue #270
3. Click Execute Agent
4. **Expected**:
   - Agent executes with `--issue 270` parameter
   - Terminal shows: `miyabi agent run coordinator --issue 270`
   - After completion, "Issue #270" button appears in action buttons

---

## Test Scenario 4: Workflow DAG Visualization

### Test Steps

#### Step 1: Navigate to Workflow DAG
1. Press `Cmd+3` or click Network icon in sidebar
2. **Expected**: Workflow DAG panel loads

#### Step 2: Verify Usage Guide
1. **Expected**: Blue info box at top with usage instructions in Japanese:
   - "ノードをドラッグしてレイアウトを調整できます"
   - "マウスホイールでズームイン/アウト"
   - "ミニマップで全体を把握できます"

#### Step 3: Interact with DAG
1. Drag a node (e.g., CoordinatorAgent)
2. **Expected**: Node moves smoothly
3. Scroll mouse wheel
4. **Expected**: Graph zooms in/out
5. Check mini-map in bottom-right
6. **Expected**: Mini-map shows full graph with colored nodes

---

## Test Scenario 5: Error Handling

### Test Steps

#### Step 1: Execute Agent with Missing Binary
1. Rename `target/release/miyabi` to `target/release/miyabi.backup`
2. Execute CoordinatorAgent
3. **Expected**:
   - Fallback to `cargo run` command
   - Terminal shows: `cargo run --release --bin miyabi -- agent run coordinator`
   - Execution continues normally (slower)

#### Step 2: Execute Agent that Fails
1. Execute an agent that will fail (e.g., with invalid parameters)
2. **Expected**:
   - Status shows "Failed" (red X icon)
   - Exit code is displayed (e.g., "Exit code: 101")
   - Error logs are visible in output area
   - Chrome Console shows: `[DEBUG] Received agent output: <error message>`

---

## Debug Verification Checklist

### Backend (Terminal Output)
- [ ] `[DEBUG] Emitting stdout:` appears for each output line
- [ ] `[DEBUG] Emitting stderr:` appears for error output
- [ ] `[DEBUG] stdout handler completed` appears after execution
- [ ] `[DEBUG] stderr handler completed` appears after execution

### Frontend (Chrome Console)
- [ ] `[DEBUG] Setting up output listener for execution:` appears when execution starts
- [ ] `[DEBUG] Output listener setup complete` appears immediately after
- [ ] `[DEBUG] Received agent output:` appears for each received line
- [ ] No error messages in console (no "Failed to listen" or "Unhandled promise rejection")

### UI Verification
- [ ] Logs appear **during** execution (not all at once after completion)
- [ ] Output area auto-scrolls to bottom as new logs arrive
- [ ] Loading spinner is visible during execution
- [ ] Status changes correctly: Starting → Running → Success/Failed
- [ ] Duration is displayed accurately
- [ ] Action buttons appear after completion

---

## Success Criteria

✅ **Real-time Log Streaming**: Logs appear line-by-line during execution
✅ **Debug Logs**: Backend and frontend debug logs confirm event flow
✅ **UI Responsiveness**: No freezing or delays in UI updates
✅ **Error Handling**: Graceful fallback and error display
✅ **Keyboard Shortcuts**: All shortcuts work as expected
✅ **Issue Selection**: Dropdown loads actual GitHub issues

---

## Known Issues to Monitor

1. **Event Timing**: If logs appear all at once after completion, task handles may not be awaited properly
2. **Memory**: Monitor for memory leaks with multiple executions
3. **React Flow Warnings**: Check console for React Flow undefined handle warnings

---

## Notes

- Test with different agents (CodeGenAgent, ReviewAgent, etc.)
- Test with and without Issue selection
- Test rapid successive executions
- Monitor terminal for backend panics or errors
- Check Chrome DevTools Network tab for any failed requests
