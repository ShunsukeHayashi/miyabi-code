# Voice-First Onboarding E2E Test Report

**Date**: 2025-10-26
**Version**: miyabi-voice-guide v0.1.0
**Status**: ✅ **PASS** - All critical issues resolved

---

## 📋 Executive Summary

Voice-First Onboarding system has been successfully implemented and tested end-to-end. **Two critical bugs** were identified and resolved during E2E testing. This report documents the issues, fixes, and important warnings for future developers.

---

## 🎯 Test Objectives

1. Verify VOICEVOX Engine integration
2. Confirm voice queue system functionality
3. Test multiline text handling
4. Validate CLI integration
5. Identify and resolve edge cases

---

## ✅ Test Results

### Test 1: VOICEVOX Engine Connection

**Status**: ✅ PASS

```bash
$ curl http://127.0.0.1:50021/version
0.24.1
```

**Result**: Engine running and responsive.

---

### Test 2: Voice Queue System

**Status**: ✅ PASS (after fix)

**Initial Issue**: Queue files were not being created when running `./target/release/miyabi`

**Root Cause**: See Critical Bug #1 below.

**After Fix**: Queue files successfully created and processed.

```bash
$ ls -lh /tmp/voicevox_queue/*.json
-rw-r--r--@ 1 shunsuke  wheel   501B Oct 26 14:41 /tmp/voicevox_queue/1761457261715892000.json
```

---

### Test 3: Multiline Text Handling

**Status**: ✅ PASS (after fix)

**Initial Issue**: Multiline Welcome message caused `AudioFileOpen failed ('typ?')` error

**Root Cause**: See Critical Bug #2 below.

**After Fix**: Multiline text properly encoded and processed.

```
処理完了: やぁやぁ！miyabiへようこそなのだ！
自律型AI開発フレームワークなのだ！
...
準備ができたら `miyabi init プロジェクト名` を
実行してプロジェクトを作るのだ！
```

---

### Test 4: CLI Integration

**Status**: ✅ PASS

```bash
$ ./target/release/miyabi
✨ Miyabi
一つのコマンドで全てが完結

Use --help to see available commands
```

**Voice Output**: Zundamon successfully speaks Welcome message.

---

## 🚨 Critical Bugs Found & Fixed

### Critical Bug #1: Async Task Not Completing Before Program Exit

**Severity**: 🔴 **CRITICAL** - Voice guide completely non-functional

**Description**:
The `speak()` method spawned a background task but did not wait for it to complete. When running short-lived CLI commands like `miyabi` (no arguments), the program exited immediately, killing the tokio runtime before the voice task could execute.

**Code Location**: `crates/miyabi-voice-guide/src/lib.rs:97-109`

**Original Code (BROKEN)**:
```rust
pub async fn speak(&self, message: VoiceMessage) {
    if !self.enabled {
        return;
    }

    let engine = self.engine.clone();
    tokio::spawn(async move {  // ⚠️ Spawns but doesn't await!
        let mut engine = engine.lock().await;
        if let Err(e) = engine.speak(message).await {
            tracing::warn!("Voice guide failed: {}", e);
        }
    });  // ← JoinHandle is dropped immediately
}
```

**Problem Sequence**:
1. `tokio::spawn()` creates background task and returns `JoinHandle`
2. `speak()` returns immediately without awaiting `JoinHandle`
3. `main.rs` completes `voice_guide.speak().await` immediately
4. Program exits, killing tokio runtime
5. Spawned task is terminated before execution

**Fixed Code**:
```rust
pub async fn speak(&self, message: VoiceMessage) {
    if !self.enabled {
        return;
    }

    let engine = self.engine.clone();
    let handle = tokio::spawn(async move {
        let mut engine = engine.lock().await;
        if let Err(e) = engine.speak(message).await {
            tracing::warn!("Voice guide failed: {}", e);
        }
    });

    // ✅ Wait for task to complete - critical for short-lived CLIs
    if let Err(e) = handle.await {
        tracing::warn!("Voice guide task failed: {}", e);
    }
}
```

**Why This Mistake Is Common**:

> ⚠️ **Warning for Developers**:
>
> This is a **classic async Rust pitfall**:
> - `tokio::spawn()` returns immediately - it does NOT block
> - The returned `JoinHandle` must be awaited for the task to complete
> - In long-running servers, you can "fire and forget" spawned tasks
> - **In short-lived CLIs, you MUST await the JoinHandle** or the program will exit before the task runs
>
> **Detection**: If voice messages work in long-running commands but not in short commands (like `miyabi` with no args), this is likely the issue.

**Verification**:
```bash
$ RUST_LOG=debug ./target/release/miyabi 2>&1 | grep "Script exit status"
Script exit status: ExitStatus(unix_wait_status(0))  # ✅ Success!
```

---

### Critical Bug #2: Invalid JSON Due to Unescaped Newlines

**Severity**: 🟠 **HIGH** - Multiline messages completely fail

**Description**:
The `voicevox_enqueue.sh` script created invalid JSON when the text contained newlines. Bash variable interpolation `"$TEXT"` in a heredoc does not escape special characters, resulting in literal newlines in the JSON string which violates JSON spec.

**Code Location**: `tools/voicevox_enqueue.sh:23-31`

**Original Code (BROKEN)**:
```bash
cat > "$QUEUE_FILE" <<EOF
{
  "text": "$TEXT",      # ← Newlines in $TEXT break JSON!
  "speaker": $SPEAKER,
  "speedScale": $SPEED,
  "timestamp": $TIMESTAMP
}
EOF
```

**Example Invalid JSON**:
```json
{
  "text": "Line 1
Line 2          ← Invalid! Literal newline in string
Line 3",
  "speaker": 3,
  "speedScale": 1.2,
  "timestamp": 1761457261715892000
}
```

**Error Symptom**:
```
Error: AudioFileOpen failed ('typ?')
処理開始:  (話者:, 速度:x)  ← Empty fields indicate JSON parse failure
```

**Fixed Code**:
```bash
# Use jq for proper JSON encoding (handles newlines, quotes, escaping)
if command -v jq &> /dev/null; then
  jq -n \
    --arg text "$TEXT" \
    --argjson speaker "$SPEAKER" \
    --argjson speed "$SPEED" \
    --argjson timestamp "$TIMESTAMP" \
    '{text: $text, speaker: $speaker, speedScale: $speed, timestamp: $timestamp}' \
    > "$QUEUE_FILE"
else
  # Fallback: Manual escaping
  ESCAPED_TEXT=$(echo "$TEXT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  cat > "$QUEUE_FILE" <<EOF
{
  "text": "$ESCAPED_TEXT",
  "speaker": $SPEAKER,
  "speedScale": $SPEED,
  "timestamp": $TIMESTAMP
}
EOF
fi
```

**Valid JSON Output**:
```json
{
  "text": "Line 1\nLine 2\nLine 3",  ← Properly escaped newlines
  "speaker": 3,
  "speedScale": 1.2,
  "timestamp": 1761457332379275000
}
```

**Why This Mistake Is Common**:

> ⚠️ **Warning for Developers**:
>
> **Bash heredocs with variable interpolation DO NOT escape JSON special characters!**
>
> Common mistakes:
> - `"$TEXT"` in heredoc → Literal newlines break JSON
> - `"$TEXT"` with quotes → Unescaped quotes break JSON
> - `"$TEXT"` with backslashes → Unescaped backslashes break JSON
>
> **Solution**: ALWAYS use `jq` for JSON generation in bash scripts:
> ```bash
> jq -n --arg text "$TEXT" '{text: $text}'  # ✅ Correct
> echo "{\"text\": \"$TEXT\"}"               # ❌ Dangerous!
> ```
>
> **Detection**: If worker log shows empty fields (`話者:, 速度:x`) or `AudioFileOpen failed`, JSON is likely malformed.

**Verification**:
```bash
$ cat /tmp/voicevox_queue/1761457332379275000.json | jq .
{
  "text": "テスト1行目なのだ\nテスト2行目なのだ\nテスト3行目なのだ",
  "speaker": 3,
  "speedScale": 1.2,
  "timestamp": 1761457332379275000
}  # ✅ Valid JSON with escaped newlines
```

---

## 🔍 Debugging Methodology

### 1. Component Isolation

Test each component independently:

```bash
# Test 1: VOICEVOX Engine
curl http://127.0.0.1:50021/version

# Test 2: Enqueue script
./tools/voicevox_enqueue.sh "Test" 3 1.2

# Test 3: Worker
ls -lht /tmp/voicevox_queue/*.json

# Test 4: Full integration
./target/release/miyabi
```

### 2. Debug Logging

Enable `RUST_LOG=debug` to see internal state:

```bash
RUST_LOG=debug ./target/release/miyabi 2>&1 | grep -E "(Speaking|Script|exit)"
```

**Key Debug Output**:
```
DEBUG miyabi_voice_guide::engine: Speaking: Welcome (speaker: ずんだもん, speed: 1.2)
DEBUG miyabi_voice_guide::engine: Checking enqueue script at: tools/voicevox_enqueue.sh
DEBUG miyabi_voice_guide::engine: Enqueue script found, calling enqueue_voice
DEBUG miyabi_voice_guide::engine: Calling enqueue script: tools/voicevox_enqueue.sh with text length: 411 bytes, speaker: 3, speed: 1.2
DEBUG miyabi_voice_guide::engine: Script exit status: ExitStatus(unix_wait_status(0))
DEBUG miyabi_voice_guide::engine: Script stdout: ✅ キューに追加しました: /tmp/voicevox_queue/1761457261715892000.json
```

### 3. Worker Log Analysis

Always check worker logs for processing errors:

```bash
tail -f /tmp/voicevox_queue/worker.log
```

**Healthy Output**:
```
2025-10-26 14:42:18 処理開始: テストメッセージなのだ (話者:3, 速度:1.2x)
2025-10-26 14:42:20 処理完了: テストメッセージなのだ
```

**Error Indicators**:
```
処理開始:  (話者:, 速度:x)           ← Empty fields = JSON parse error
Error: AudioFileOpen failed ('typ?')  ← Invalid JSON format
```

---

## 📚 Lessons Learned

### For Rust Developers

1. **Always await spawned tasks in short-lived programs**
   - Use `handle.await` on `JoinHandle`
   - Consider using `.block_on()` if not in async context
   - Test with `RUST_LOG=debug` to verify task execution

2. **Add comprehensive debug logging**
   - Log before/after critical operations
   - Log external command outputs (stdout/stderr)
   - Include exit status in logs

### For Bash Script Developers

1. **Never use heredocs for JSON with variable interpolation**
   - Use `jq` for JSON generation
   - Provide fallback with proper escaping
   - Validate JSON output with `jq .`

2. **Always handle special characters**
   - Newlines: `\n`
   - Quotes: `\"`
   - Backslashes: `\\`

---

## 🎯 Test Coverage

| Test Case | Status | Notes |
|-----------|--------|-------|
| VOICEVOX Engine connection | ✅ PASS | Version 0.24.1 |
| Short text (1 line) | ✅ PASS | "短いテストなのだ" |
| Multiline text (3 lines) | ✅ PASS | Newlines properly escaped |
| Long Welcome message (7 lines) | ✅ PASS | 411 bytes, all newlines preserved |
| CLI integration (no args) | ✅ PASS | Welcome message plays |
| CLI integration (init) | 🔶 PENDING | Requires GitHub auth setup |
| CLI integration (work-on) | 🔶 PENDING | Requires GitHub Issue |
| Error handling (GitHub token) | 🔶 PENDING | Requires auth failure scenario |

---

## 🚀 Final Verification

### System Environment
- **OS**: macOS Darwin 25.0.0
- **Rust**: 2021 Edition (Stable)
- **VOICEVOX Engine**: 0.24.1
- **jq**: /usr/bin/jq (available)

### E2E Test Command
```bash
$ ./target/release/miyabi
✨ Miyabi
一つのコマンドで全てが完結

Use --help to see available commands
```

### Voice Output Confirmation
```bash
$ tail -5 /tmp/voicevox_queue/worker.log
2025-10-26 14:42:43 処理開始: やぁやぁ！miyabiへようこそなのだ！
自律型AI開発フレームワークなのだ！

まず最初に、GitHubに接続する必要があるのだ。
GitHub CLIを使う場合は `gh auth login` を実行するのだ！
または、GitHub Personal Access Tokenを設定するのだ！

準備ができたら `miyabi init プロジェクト名` を
実行してプロジェクトを作るのだ！ (話者:3, 速度:1.2x)
2025-10-26 14:42:55 処理完了: やぁやぁ！miyabiへようこそなのだ！
自律型AI開発フレームワークなのだ！
...
```

**Status**: ✅ **COMPLETE** - Zundamon successfully speaks the full Welcome message

---

## 📝 Recommendations

### Before Public Release

1. **Add unit tests for edge cases**
   - Very long text (>1000 bytes)
   - Special characters (emojis, symbols)
   - Empty text handling

2. **Add integration tests**
   - Mock VOICEVOX Engine for CI/CD
   - Test worker error scenarios
   - Validate JSON schema

3. **Documentation updates**
   - Add troubleshooting guide
   - Document common errors
   - Include debug commands

4. **Performance testing**
   - Test with 100+ rapid voice messages
   - Measure queue processing latency
   - Verify memory usage under load

### For Production Deployment

1. **Error Recovery**
   - Auto-restart VOICEVOX Engine on crash
   - Implement retry logic for failed messages
   - Add queue overflow handling

2. **Monitoring**
   - Log aggregation for worker errors
   - Metrics for queue depth
   - Alerts for processing failures

---

## ✅ Sign-off

**E2E Test Status**: ✅ **PASS**

**Bugs Found**: 2 (both critical, both fixed)

**Production Ready**: 🟡 **Ready with Recommendations**
- Core functionality: ✅ Fully operational
- Edge cases: 🔶 Needs additional testing
- Documentation: 🔶 Needs troubleshooting guide

**Tested By**: Claude Code
**Reviewed By**: Pending
**Approved By**: Pending

---

**End of Report**
