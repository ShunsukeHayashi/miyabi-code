# Codex/Claude Code Integration Roadmap - Miyabi を自律型 CLI Agent に進化

**日付**: 2025-10-25
**目標**: Codex/Claude Code の UX を Miyabi に完全統合し、最強の自律型開発フレームワークを実現

---

## 🎯 ビジョン

```
Before: Claude Code → miyabi コマンド実行
After:  Miyabi 自身が Codex/Claude Code と同等の自律 Agent
```

**Miyabi の新しいアイデンティティ**:
- ✅ Codex/Claude Code 相当の対話型 CLI Agent
- ✅ GitHub OS アーキテクチャによる完全自律実行
- ✅ Issue駆動開発 + 任意タスク実行の両対応
- ✅ WebUI でも同じ体験を提供可能

---

## 📋 実装済み機能 (Phase 1-2)

### ✅ Phase 1: セッション管理システム

**実装完了**:
- `miyabi-core/src/session.rs` - 300行のセッション管理
- `Session`, `Turn`, `Action`, `ExecutionMode` 型定義
- セッション永続化 (`~/.miyabi/sessions/`)
- レジューム機能の基盤

**特徴**:
```rust
pub struct Session {
    pub id: String,              // ses_abc123
    pub task: String,
    pub status: SessionStatus,   // Running/Completed/Failed
    pub turns: Vec<Turn>,        // 複数ターンの会話
    pub mode: ExecutionMode,     // ReadOnly/FileEdits/FullAccess/Interactive
}
```

### ✅ Phase 2: `miyabi exec` コマンド (基礎実装)

**実装完了**:
- `miyabi-cli/src/commands/exec.rs` - 400行の自律実行エンジン
- CLI コマンド定義:
  ```bash
  miyabi exec "count lines of code"
  miyabi exec --full-auto "refactor auth module"
  miyabi exec --full-access "deploy to staging"
  miyabi exec --json "analyze dependencies" | jq
  ```

**特徴**:
- ✅ 段階的権限制御 (ReadOnly → FileEdits → FullAccess)
- ✅ JSONL 出力モード
- ✅ セッション再開 (`miyabi exec-resume --last`)
- ⚠️ LLM統合は stub実装（Phase 3で完成）

---

## 🚀 実装予定機能 (Phase 3-6)

### Phase 3: LLM統合 - 本物の自律実行

#### 目標

Miyabi が **自分で考え、コードを書き、実行する** 能力を獲得

#### 実装内容

**1. `miyabi-llm` crate 作成**

```rust
// crates/miyabi-llm/src/lib.rs

pub struct LlmClient {
    provider: LlmProvider,
    model: String,
}

pub enum LlmProvider {
    Anthropic {   // Claude API
        api_key: String,
        model: String,  // claude-3-5-sonnet-20241022
    },
    GptOss {      // Ollama (ローカル実行)
        endpoint: String,
        model: String,  // gpt-oss-20b
    },
    Groq {        // Groq (超高速)
        api_key: String,
        model: String,  // llama-3-70b
    },
}

impl LlmClient {
    /// 単発の質問応答
    pub async fn chat(&self, prompt: &str) -> Result<String>;

    /// ストリーミング応答 (リアルタイム表示用)
    pub async fn chat_stream(&self, prompt: &str) -> impl Stream<Item = String>;

    /// Tool calls を含む構造化出力
    pub async fn chat_with_tools(
        &self,
        prompt: &str,
        tools: Vec<Tool>,
    ) -> Result<ToolCallResponse>;
}
```

**2. Tool System - Function Calling**

```rust
pub struct Tool {
    name: String,
    description: String,
    parameters: serde_json::Value,  // JSON Schema
}

pub enum ToolCall {
    ReadFile { path: String },
    WriteFile { path: String, content: String },
    RunCommand { command: String, args: Vec<String> },
    CreateIssue { title: String, body: String },
    SearchCode { query: String },
    GetGitStatus,
}

impl ToolCall {
    /// 実行可能かチェック（ExecutionMode による制限）
    pub fn is_allowed(&self, mode: &ExecutionMode) -> bool;

    /// 実行
    pub async fn execute(&self) -> Result<ToolCallResult>;
}
```

**3. Autonomous Execution Loop**

```rust
// crates/miyabi-cli/src/commands/exec.rs

impl TaskExecutor {
    async fn run_autonomous(&mut self) -> Result<()> {
        loop {
            // 1. LLM に現在の状況を渡して次のアクションを尋ねる
            let context = self.build_context();
            let response = self.llm_client
                .chat_with_tools(&context, self.get_available_tools())
                .await?;

            // 2. Tool calls を実行
            match response {
                ToolCallResponse::ToolCalls(calls) => {
                    for call in calls {
                        self.execute_tool_call(call).await?;
                    }
                }
                ToolCallResponse::Conclusion(summary) => {
                    // タスク完了
                    println!("✅ {}", summary);
                    break;
                }
                ToolCallResponse::NeedApproval(action) => {
                    // ユーザー承認待ち (Interactive mode のみ)
                    if !self.request_approval(&action).await? {
                        return Err(CliError::UserAborted);
                    }
                }
            }

            // 3. セッション保存（失敗時の再開用）
            self.session.save()?;
        }

        Ok(())
    }
}
```

**実装ファイル**:
- `crates/miyabi-llm/src/lib.rs` (新規作成)
- `crates/miyabi-llm/src/anthropic.rs`
- `crates/miyabi-llm/src/ollama.rs`
- `crates/miyabi-llm/src/groq.rs`
- `crates/miyabi-llm/src/tools.rs`

---

### Phase 4: `miyabi chat` - インタラクティブモード

#### 目標

Codex/Claude Code の対話型 REPL を実現

#### 実装内容

```bash
$ miyabi chat

miyabi> Refactor the auth module

🤖 Analyzing codebase...
   ✓ Found 15 authentication files
   ✓ Identified 3 improvement opportunities

📋 Plan:
   1. Extract JWT logic → auth/jwt.rs
   2. Add error handling for token expiry
   3. Update tests

❓ Proceed with these changes? [y/n/e]: y

📝 Creating auth/jwt.rs...
   ✓ File created (45 lines)

📝 Updating src/auth/mod.rs...
   ✓ 20 lines changed

🧪 Running tests...
   ✓ 12/12 tests passed

✅ Refactoring complete!

miyabi> /model claude-opus

✅ Switched to claude-3-opus-20240229

miyabi> /approvals interactive

✅ Approval mode: Interactive (confirm each action)

miyabi> exit
```

**スラッシュコマンド**:
- `/model <name>` - LLMモデル切り替え
- `/approvals <mode>` - 承認モード変更 (read-only/interactive/auto)
- `/status` - 現在のセッション状態表示
- `/help` - ヘルプ表示
- `/exit` - 終了

**実装技術**:
- `rustyline` - REPL (コマンド履歴、補完)
- `tokio_stream` - ストリーミング応答
- `console` - カラー出力

**実装ファイル**:
- `crates/miyabi-cli/src/commands/chat.rs` (新規作成)
- `crates/miyabi-core/src/repl.rs` (新規作成)

---

### Phase 5: Approval System - 安全な実行制御

#### 目標

Codex の Approval UX を完全再現

#### 実装内容

**1. 変更プレビュー UI**

```
📝 Proposed Changes:

  src/auth/mod.rs
  ────────────────────────────────────────
  - pub fn verify_token(token: &str) -> bool {
  + pub fn verify_token(token: &str) -> Result<bool> {
  -     token.len() > 0
  +     jwt::decode(token)
  +         .map(|_| true)
  +         .map_err(|e| AuthError::InvalidToken(e))
  }

  Lines changed: +5 -2

⚠️  Command to run:
  cargo fmt && cargo clippy

❓ Approve? [y/n/e/d]
  y = Yes, apply all changes
  n = No, skip this change
  e = Edit before applying
  d = Show full diff
```

**2. Approval Mode 切り替え**

```rust
pub enum ApprovalMode {
    ReadOnly,      // 読み取りのみ（承認不要）
    Interactive,   // 毎回確認
    Auto,          // ファイル編集は自動承認、コマンド実行は確認
    FullAuto,      // 全て自動承認
}
```

**3. Diff Viewer**

```rust
// crates/miyabi-core/src/approval.rs

pub struct ApprovalUI {
    mode: ApprovalMode,
}

impl ApprovalUI {
    /// ファイル変更の承認リクエスト
    pub async fn approve_file_change(&self, change: &FileChange) -> Result<ApprovalDecision>;

    /// コマンド実行の承認リクエスト
    pub async fn approve_command(&self, cmd: &Command) -> Result<ApprovalDecision>;

    /// 差分表示
    fn show_diff(&self, before: &str, after: &str);

    /// インタラクティブエディタ起動
    fn edit_before_apply(&self, content: &str) -> Result<String>;
}

pub enum ApprovalDecision {
    Approve,
    Reject,
    Edit(String),
    ShowFullDiff,
}
```

**実装技術**:
- `similar` - Diff生成
- `console` - カラー差分表示
- `dialoguer` - インタラクティブプロンプト
- `tempfile` + `$EDITOR` - エディタ統合

**実装ファイル**:
- `crates/miyabi-core/src/approval.rs` (新規作成)
- `crates/miyabi-core/src/diff.rs` (新規作成)

---

### Phase 6: JSONL ストリーミング

#### 目標

Codex の `--json` 出力形式を完全再現

#### 実装内容

**1. イベントストリーム定義**

```rust
// crates/miyabi-core/src/output.rs

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum OutputEvent {
    /// セッション開始
    Thread {
        id: String,
        status: String,
    },

    /// ターン開始
    Turn {
        turn_id: String,
        status: String,
    },

    /// アイテムイベント
    Item {
        item_id: String,
        event: ItemEvent,
    },

    /// 結論
    Conclusion {
        summary: String,
        session_id: String,
    },
}

pub enum ItemEvent {
    /// 思考過程
    Reasoning { content: String },

    /// コマンド実行
    Command {
        command: String,
        args: Vec<String>,
    },

    /// コマンド出力
    CommandOutput {
        stdout: String,
        stderr: String,
        exit_code: i32,
    },

    /// ファイル変更
    FileChange {
        path: String,
        diff: String,
    },
}
```

**2. JSONL Writer**

```rust
pub struct JsonlWriter {
    writer: Box<dyn Write>,
}

impl JsonlWriter {
    pub fn write_event(&mut self, event: &OutputEvent) -> Result<()> {
        let json = serde_json::to_string(event)?;
        writeln!(self.writer, "{}", json)?;
        self.writer.flush()?;
        Ok(())
    }
}
```

**3. 使用例**

```bash
$ miyabi exec --json "count lines of code" | jq -r '.events[] | select(.type=="conclusion") | .summary'
Found 15,234 lines of Rust code across 127 files

$ miyabi exec --json "refactor auth" > refactor.jsonl
$ cat refactor.jsonl | grep '"type":"item"' | jq -r '.event.reasoning.content'
```

**実装ファイル**:
- `crates/miyabi-core/src/output.rs` (新規作成)
- `crates/miyabi-cli/src/commands/exec.rs` (JSONL対応追加)

---

## 🌐 Web UI 統合 (Bonus Phase)

### 目標

CLI の体験を Web ブラウザで再現

### 実装案: Monaco Editor + xterm.js

```typescript
// crates/miyabi-web-ui/src/pages/AgentStudioPage.tsx

export function AgentStudioPage() {
  return (
    <Layout>
      {/* ファイルツリー */}
      <Sidebar>
        <FileTree />
      </Sidebar>

      {/* コードエディタ */}
      <EditorPane>
        <MonacoEditor
          language="rust"
          value={code}
          onChange={handleCodeChange}
        />
      </EditorPane>

      {/* ターミナル + Miyabi Chat */}
      <TerminalPane>
        <XTerm
          onCommand={(cmd) => executeMiyabiCommand(cmd)}
        />
      </TerminalPane>
    </Layout>
  );
}
```

**WebSocket 通信**:

```rust
// crates/miyabi-web-api/src/routes/exec.rs

async fn exec_stream(
    ws: WebSocketUpgrade,
    Json(request): Json<ExecRequest>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        // JSONL イベントを WebSocket でストリーミング
        let (tx, rx) = mpsc::channel(100);

        // Miyabi exec 実行
        tokio::spawn(async move {
            let mut executor = TaskExecutor::new(request.task);
            executor.run_with_stream(tx).await;
        });

        // WebSocket 送信
        while let Some(event) = rx.recv().await {
            socket.send(Message::Text(serde_json::to_string(&event)?)).await?;
        }
    })
}
```

---

## 📊 実装優先度とスケジュール

| Phase | タスク | 優先度 | 工数 | 期限目標 |
|-------|--------|--------|------|----------|
| 1 | ✅ セッション管理 | 🔴 HIGH | 2日 | 完了 |
| 2 | ✅ `miyabi exec` 基礎 | 🔴 HIGH | 3日 | 完了 |
| 3 | LLM統合 (Anthropic/Ollama) | 🔴 HIGH | 1週間 | Week 1 |
| 4 | `miyabi chat` REPL | 🟡 MEDIUM | 4日 | Week 2 |
| 5 | Approval System | 🟡 MEDIUM | 5日 | Week 2 |
| 6 | JSONL ストリーミング | 🟢 LOW | 2日 | Week 3 |
| 7 | Web UI 統合 | 🟢 LOW | 1週間 | Week 4 |

---

## 🎯 最初のマイルストーン: `miyabi exec` の完成

### Week 1 Goal

```bash
$ miyabi exec "count lines of code in this Rust project"

🌸 Miyabi Autonomous Agent
────────────────────────────────────────────────────────────
  Task: count lines of code in this Rust project
  Mode: ReadOnly
  Session: ses_a1b2c3d4

🤖 Analyzing task...

📋 Plan:
   1. Find all Rust files (*.rs)
   2. Count lines using wc -l
   3. Summarize results

🔍 Executing: find . -name '*.rs' | xargs wc -l
   ✓ Found 127 files

📊 Results:
   - Total lines: 15,234
   - Average per file: 120 lines

✅ Task completed successfully!

  Session ID: ses_a1b2c3d4
```

### 必要な実装

1. ✅ Session管理 (完了)
2. ✅ Exec コマンド骨格 (完了)
3. ⚠️ LLM統合 (stub → 実装)
4. ⚠️ Tool execution (ReadFile, RunCommand)

---

## 📚 参考リソース

- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Codex Exec Documentation](https://developers.openai.com/codex/cli/)
- [Claude Code (Anthropic)](https://claude.com/claude-code)
- [Model Context Protocol](https://developers.openai.com/codex/mcp/)

---

**次のアクション**: Phase 3 (LLM統合) の実装開始

**作成者**: Claude Code (Sonnet 4.5)
