# 🔴 Critical Issues Found & Fixed (Real-Time)

## Session: 2025-11-02 16:30-16:35

### Issue #1: Session Polling Error Loop ✅ FIXED
**Error**: `Session 'miyabi-auto-miyabi-private:0' does not exist` (infinite loop)
**Root Cause**: session state remained after tmux session was killed, causing 2-second polling to continue
**Fix Applied**: FullAutomationPanel.tsx:165-172
```typescript
if (String(err).includes('does not exist')) {
  setSession(null);  // Stop polling
  setError('Automation session ended or was killed externally. Click "Start Full Automation" to restart.');
  setShowMonitor(false);
}
```
**Status**: ✅ Fixed, hot-reloaded via Vite

---

### Issue #2: Window Index Mismatch 🔄 IN PROGRESS
**Error**: `Failed to send keys to pane: can't find window: 3`
**Root Cause**: 
- Only Monitor window created (window 1)
- Code expects windows 0,1,2,3 (Claude Code, Codex, Orchestrator, Monitor)
- `setup_monitoring_dashboard` tries to send-keys to window 3, but it doesn't exist

**Investigation**:
1. Session exists: `miyabi-auto-miyabi-private` ✅
2. Windows: Only "1: Monitor" (instead of 0,1,2,3)
3. Claude Code/Codex/Orchestrator windows not created

**Hypothesis**:
- Config flags (enable_claude_code, enable_codex, orchestrator_mode) might be false
- OR window creation commands failing silently
- OR tmux window indexing issue

**Next Action**: Check default config in FullAutomationPanel.tsx

---

## Real-Time Debug Protocol

✅ **Working**:
- Error detection & logging
- UI error display
- Browser DevTools monitoring
- Tmux session inspection
- リアルタイム可視化 (no background processes)

🔄 **In Progress**:
- Root cause analysis for window creation
- Config validation

⏸️ **Pending**:
- Comprehensive error handlers implementation
- Error → Claude Code messaging
- Recovery UI components

---

**Lessons Learned**:
1. リアルタイム可視化により、エラーを即座に検出できた
2. Browser console が最高のデバッグツール
3. 段階的な修正により、問題を1つずつ解決

