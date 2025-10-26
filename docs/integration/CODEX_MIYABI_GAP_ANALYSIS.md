# OpenAI Codex vs Miyabi CLI - 詳細ギャップ分析レポート

**日付**: 2025-10-25
**バージョン**: Codex v1.x (2025) vs Miyabi v0.1.1 (Rust Edition)
**目的**: Codex が提供する機能で Miyabi に欠けている要素を特定し、実装優先度を提示

---

## 📊 Executive Summary

| カテゴリ | Codex の優位性 | Miyabi の優位性 | 推奨アクション |
|---------|--------------|--------------|--------------|
| **CLI UX** | ⭐⭐⭐⭐⭐ インタラクティブモード完備 | ⭐⭐⭐ Issue駆動に特化 | **HIGH**: 対話型モード実装 |
| **Non-Interactive** | ⭐⭐⭐⭐⭐ `exec` モード完備 | ⭐⭐ Agent実行のみ | **HIGH**: `miyabi exec` 実装 |
| **SDK** | ⭐⭐⭐⭐⭐ TypeScript SDK公式提供 | ⭐⭐ REST API のみ | **MEDIUM**: Rust/TS SDK提供 |
| **認証** | ⭐⭐⭐⭐ ChatGPT/API Key 両対応 | ⭐⭐⭐ GitHub Token のみ | **LOW**: 既存で十分 |
| **画像入力** | ⭐⭐⭐⭐⭐ `-i` フラグで画像解析 | ⭐ 未対応 | **MEDIUM**: GPT-4V統合 |
| **Approval System** | ⭐⭐⭐⭐⭐ 細かい権限制御 | ⭐⭐ Issue単位の承認 | **HIGH**: 実行時承認UI |
| **MCP Integration** | ⭐⭐⭐⭐⭐ ネイティブサポート | ⭐⭐⭐ MCP Server実装済み | **LOW**: 既存で十分 |
| **GitHub Actions** | ⭐⭐⭐⭐⭐ 公式Action提供 | ⭐⭐ 手動統合のみ | **MEDIUM**: Action公開 |
| **出力モード** | ⭐⭐⭐⭐⭐ JSON/JSONL/Schema対応 | ⭐⭐⭐ `--json` フラグのみ | **MEDIUM**: JSONL対応 |
| **セッション管理** | ⭐⭐⭐⭐⭐ Resume機能 | ⭐ 未対応 | **HIGH**: セッション永続化 |

**総合評価**: Codex が **CLI UX/DX の完成度** で優位、Miyabi が **GitHub OS アーキテクチャの深さ** で優位

---

## 🔴 HIGH Priority Gaps - 実装必須

### 1. インタラクティブモード (`codex` コマンド相当)

#### Codex の実装

```bash
# インタラクティブモード起動
$ codex

# プロンプト入力
> Explain this codebase

# モデル切り替え
> /model gpt-5-codex

# 権限モード変更
> /approvals full-access
```

**特徴**:
- REPL風の対話型インターフェース
- コマンド補完とヒストリー
- ストリーミング応答表示
- 複数ターン会話の保持

#### Miyabi の現状

```bash
# 単発実行のみ
$ miyabi agent run coordinator --issue 123

# 対話モードなし
```

**ギャップ**:
- ❌ 対話型モード未実装
- ❌ 複数ターン会話の永続化なし
- ❌ コマンド内での動的な権限変更不可
- ❌ ストリーミング出力未対応

#### 実装推奨案: `miyabi chat` コマンド

```rust
// crates/miyabi-cli/src/commands/chat.rs

pub struct ChatCommand {
    session_id: Option<String>,
    model: String,
    approval_mode: ApprovalMode,
}

impl ChatCommand {
    pub async fn execute(&self) -> Result<()> {
        // 1. セッション復元または新規作成
        let session = self.load_or_create_session()?;

        // 2. REPL起動
        let mut rl = Editor::<()>::new()?;
        loop {
            let readline = rl.readline("miyabi> ");
            match readline {
                Ok(line) => {
                    // 3. スラッシュコマンド処理
                    if line.starts_with('/') {
                        self.handle_slash_command(&line)?;
                        continue;
                    }

                    // 4. LLM呼び出し（ストリーミング）
                    self.stream_llm_response(&line, &session).await?;
                }
                Err(_) => break,
            }
        }

        Ok(())
    }
}
```

**技術スタック**:
- `rustyline` (REPL)
- `tokio_stream` (ストリーミング)
- `serde_json` (セッション永続化)

---

### 2. Non-Interactive 実行モード (`codex exec`)

#### Codex の実装

```bash
# 基本実行（Read-Only）
$ codex exec "count lines of code in this project"

# フルアクセス（ファイル編集許可）
$ codex exec --full-auto "fix the CI failure"

# 危険操作許可（ネットワーク + 編集）
$ codex exec --sandbox danger-full-access "deploy to staging"

# JSON出力モード
$ codex exec --json "analyze test coverage" | jq '.events[] | select(.type=="conclusion")'

# セッション再開
$ codex exec resume --last
```

**特徴**:
- **安全性**: デフォルトRead-Only
- **段階的権限昇格**: `--full-auto` → `--sandbox danger-full-access`
- **パイプライン統合**: JSON Lines出力で他ツールと連携
- **セッション再開**: 失敗時のリトライが容易

#### Miyabi の現状

```bash
# Issue駆動実行のみ
$ miyabi agent run coordinator --issue 123

# 任意タスクの実行は未対応
$ miyabi codegen "create dashboard UI"  # ← これは別目的（Claudable）
```

**ギャップ**:
- ❌ 任意タスクの非対話実行不可
- ❌ 段階的権限制御なし（全部フルアクセス）
- ❌ JSONL出力未対応
- ❌ セッション再開機能なし

#### 実装推奨案: `miyabi exec` コマンド

```rust
// crates/miyabi-cli/src/commands/exec.rs

pub struct ExecCommand {
    task: String,
    full_auto: bool,           // ファイル編集許可
    sandbox: SandboxMode,       // ネットワーク権限
    json: bool,                 // JSONL出力
    output_schema: Option<String>, // 構造化出力
    resume: Option<String>,     // セッションID
}

#[derive(Clone)]
pub enum SandboxMode {
    ReadOnly,             // デフォルト: 読み取りのみ
    FileEdits,            // ファイル編集許可
    DangerFullAccess,     // ネットワーク + 編集
}

impl ExecCommand {
    pub async fn execute(&self) -> Result<()> {
        // 1. セッション復元または新規作成
        let session = if let Some(sid) = &self.resume {
            Session::load(sid)?
        } else {
            Session::new(self.task.clone(), self.sandbox.clone())
        };

        // 2. タスク実行（権限制御付き）
        let executor = TaskExecutor::new(session.clone());
        executor.set_sandbox_mode(self.sandbox.clone());

        // 3. 実行（ストリーミング出力）
        if self.json {
            executor.run_with_jsonl_output().await?;
        } else {
            executor.run_with_human_output().await?;
        }

        // 4. セッション保存（再開用）
        session.save()?;

        Ok(())
    }
}
```

**JSONL出力例**:

```jsonl
{"type":"thread","id":"thr_123","status":"running"}
{"type":"turn","turn_id":"turn_1","status":"started"}
{"type":"item","item_id":"item_1","event":"reasoning","content":"Analyzing codebase structure..."}
{"type":"item","item_id":"item_2","event":"command","command":"find . -name '*.rs' | xargs wc -l"}
{"type":"item","item_id":"item_3","event":"command_output","stdout":"15234 total"}
{"type":"conclusion","summary":"Found 15,234 lines of Rust code"}
```

**技術スタック**:
- `serde_json` (JSONL出力)
- `tokio::fs` (ファイル操作監視)
- `tokio::process` (コマンド実行サンドボックス)

---

### 3. Approval System - 実行時承認UI

#### Codex の実装

```bash
# インタラクティブモードでの承認
$ codex

> Refactor the authentication module

🤖 I'll make the following changes:
  1. Extract JWT logic to auth/jwt.rs
  2. Add error handling for token expiry
  3. Update tests

📝 File changes:
  - src/auth/mod.rs (20 lines changed)
  - src/auth/jwt.rs (new file, 45 lines)

⚠️  Command to run:
  cargo fmt && cargo clippy

❓ Approve these changes? [y/n/e(dit)]: _
```

**特徴**:
- **変更プレビュー**: 実行前に差分表示
- **段階的承認**: ファイル編集/コマンド実行を個別に承認
- **編集可能**: 提案内容を修正してから適用

#### Miyabi の現状

```bash
# Issue番号指定で全自動実行
$ miyabi agent run coordinator --issue 123

# 途中で止まらない（承認フローなし）
```

**ギャップ**:
- ❌ 実行前の変更プレビューなし
- ❌ ユーザー承認ステップなし
- ❌ 危険な操作の警告なし

#### 実装推奨案: `ApprovalHook` の実装

```rust
// crates/miyabi-core/src/approval.rs

pub struct ApprovalHook {
    mode: ApprovalMode,
    ui: Box<dyn ApprovalUI>,
}

pub enum ApprovalMode {
    ReadOnly,      // 承認不要（読み取りのみ）
    Interactive,   // 毎回確認
    FullAuto,      // 承認不要（全自動）
}

pub trait ApprovalUI {
    fn show_file_changes(&self, changes: &[FileChange]) -> Result<bool>;
    fn show_command(&self, cmd: &str) -> Result<bool>;
    fn show_network_request(&self, url: &str) -> Result<bool>;
}

impl ApprovalHook {
    pub async fn approve_file_edit(&self, change: &FileChange) -> Result<bool> {
        match self.mode {
            ApprovalMode::ReadOnly => {
                eprintln!("❌ File edit blocked in read-only mode");
                Ok(false)
            }
            ApprovalMode::Interactive => {
                self.ui.show_file_changes(&[change.clone()])
            }
            ApprovalMode::FullAuto => Ok(true),
        }
    }
}
```

**UI例**:

```
📝 Proposed Changes:

  src/auth/mod.rs
  ────────────────────────────────────
  - pub fn verify_token(token: &str) -> bool {
  + pub fn verify_token(token: &str) -> Result<bool> {
  -     token.len() > 0
  +     jwt::decode(token)
  +         .map(|_| true)
  +         .map_err(|e| AuthError::InvalidToken(e))
  }

  Lines changed: +5 -2

❓ Apply this change? [y/n/e/d]
  y = Yes, apply
  n = No, skip
  e = Edit before applying
  d = Show full diff
```

---

### 4. セッション管理 - Resume機能

#### Codex の実装

```bash
# セッションIDを指定して再開
$ codex exec resume ses_abc123

# 最後のセッションを再開
$ codex exec resume --last

# セッション一覧表示
$ codex sessions list
```

**特徴**:
- **永続化**: 全てのターンを保存
- **失敗時リトライ**: エラーから再開可能
- **セッション履歴**: 過去のタスクを振り返り可能

#### Miyabi の現状

```bash
# セッション概念なし
$ miyabi agent run coordinator --issue 123

# 失敗したら最初からやり直し
```

**ギャップ**:
- ❌ セッション永続化なし
- ❌ 失敗時の部分リトライ不可
- ❌ 実行履歴の管理なし

#### 実装推奨案: `SessionStore`

```rust
// crates/miyabi-core/src/session.rs

#[derive(Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub task: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub status: SessionStatus,
    pub turns: Vec<Turn>,
    pub context: SessionContext,
}

#[derive(Serialize, Deserialize)]
pub enum SessionStatus {
    Running,
    Completed,
    Failed { error: String, resumable: bool },
}

#[derive(Serialize, Deserialize)]
pub struct Turn {
    pub id: String,
    pub prompt: String,
    pub response: String,
    pub actions: Vec<Action>,
    pub completed: bool,
}

impl Session {
    pub fn save(&self) -> Result<()> {
        let path = self.get_session_path();
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    pub fn load(id: &str) -> Result<Self> {
        let path = Self::get_session_path_by_id(id);
        let json = std::fs::read_to_string(path)?;
        let session: Session = serde_json::from_str(&json)?;
        Ok(session)
    }

    fn get_session_path(&self) -> PathBuf {
        dirs::home_dir()
            .unwrap()
            .join(".miyabi")
            .join("sessions")
            .join(format!("{}.json", self.id))
    }
}
```

**使用例**:

```bash
# セッション開始
$ miyabi exec "refactor auth module"
📝 Session ID: ses_abc123
🤖 Starting task...
❌ Error: Network timeout

# 再開
$ miyabi exec resume ses_abc123
📝 Resuming session: ses_abc123
🔄 Retrying from last successful step...
✅ Completed!
```

---

## 🟡 MEDIUM Priority Gaps - 実装推奨

### 5. 画像入力サポート

#### Codex の実装

```bash
# スクリーンショットを解析
$ codex -i error-screenshot.png "Explain this error"

# 複数画像を同時に処理
$ codex --image diagram1.png,diagram2.png "Compare these architectures"
```

**特徴**:
- GPT-4V (Vision) を活用
- エラー画面の診断
- UI/UXのフィードバック

#### Miyabi の現状

- ❌ 画像入力未対応
- ❌ Vision API 統合なし

#### 実装推奨案

```rust
// crates/miyabi-cli/src/commands/chat.rs

pub struct ChatCommand {
    images: Vec<PathBuf>,  // 画像ファイルパス
}

impl ChatCommand {
    async fn process_with_images(&self, prompt: &str) -> Result<String> {
        let mut messages = vec![
            Message::user(prompt),
        ];

        // 画像を Base64 エンコードして添付
        for img_path in &self.images {
            let img_data = self.load_image_as_base64(img_path)?;
            messages.push(Message::image(img_data));
        }

        // GPT-4V API 呼び出し
        let response = self.llm_client.chat_with_vision(messages).await?;
        Ok(response)
    }
}
```

---

### 6. TypeScript SDK

#### Codex の実装

```typescript
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();
const thread = codex.startThread();

// タスク実行
const turn = await thread.run("Fix the failing tests");

// イベントストリーム監視
turn.on("reasoning", (data) => console.log("Thinking:", data.content));
turn.on("command", (data) => console.log("Running:", data.command));
turn.on("conclusion", (data) => console.log("Result:", data.summary));
```

**特徴**:
- Node.js 18+ 対応
- イベントドリブンAPI
- JSONL ストリーム消費

#### Miyabi の現状

- ⭐ REST API提供（`miyabi-web-api`）
- ❌ TypeScript SDK なし
- ❌ Python SDK なし

#### 実装推奨案: `@miyabi/sdk`

```typescript
// sdk/typescript/src/index.ts

export class MiyabiClient {
    private baseUrl: string;
    private token: string;

    constructor(options: { baseUrl?: string; token?: string }) {
        this.baseUrl = options.baseUrl || "http://localhost:4000";
        this.token = options.token || process.env.GITHUB_TOKEN!;
    }

    // Agent実行
    async executeAgent(agentType: string, issueNumber: number): Promise<ExecutionResult> {
        const response = await fetch(`${this.baseUrl}/api/agents/${agentType}/execute`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ issue_number: issueNumber }),
        });
        return response.json();
    }

    // セッション実行（新規）
    async exec(task: string, options?: ExecOptions): Promise<SessionStream> {
        const response = await fetch(`${this.baseUrl}/api/exec`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ task, ...options }),
        });

        // JSONL ストリーム返却
        return new SessionStream(response.body);
    }
}

// ストリーム処理
class SessionStream {
    constructor(private stream: ReadableStream) {}

    async *[Symbol.asyncIterator]() {
        const reader = this.stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split("\n");
            for (const line of lines) {
                if (line.trim()) {
                    yield JSON.parse(line);
                }
            }
        }
    }
}
```

---

### 7. GitHub Actions 統合

#### Codex の実装

```yaml
# .github/workflows/codex-ci.yml
name: Codex CI

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: openai/codex-action@v1
        with:
          task: "Review this PR for security issues"
          full-auto: true
        env:
          CODEX_API_KEY: ${{ secrets.CODEX_API_KEY }}
```

**特徴**:
- 公式GitHub Action提供
- PR自動レビュー
- CI/CD統合が容易

#### Miyabi の現状

- ❌ 公式Action なし
- ⭐ CLI は動作する（手動実行可能）

#### 実装推奨案: `miyabi-action`

```yaml
# action.yml
name: 'Miyabi Agent Runner'
description: 'Execute Miyabi agents in GitHub Actions'
author: 'ShunsukeHayashi'

inputs:
  agent-type:
    description: 'Agent type (coordinator, codegen, review, etc.)'
    required: true
  issue-number:
    description: 'GitHub Issue number'
    required: false
  github-token:
    description: 'GitHub Token'
    required: true
    default: ${{ github.token }}

runs:
  using: 'composite'
  steps:
    - name: Install Miyabi CLI
      shell: bash
      run: cargo install miyabi-cli

    - name: Run Agent
      shell: bash
      env:
        GITHUB_TOKEN: ${{ inputs.github-token }}
      run: |
        miyabi agent run ${{ inputs.agent-type }} \
          --issue ${{ inputs.issue-number }} \
          --json
```

---

### 8. JSONL 出力対応

#### Codex の実装

```bash
$ codex exec --json "analyze test coverage" | \
  jq -r '.events[] | select(.type=="conclusion") | .summary'
```

**出力例**:

```jsonl
{"type":"thread","id":"thr_123"}
{"type":"turn","turn_id":"turn_1","status":"started"}
{"type":"item","event":"reasoning","content":"Analyzing..."}
{"type":"conclusion","summary":"Test coverage is 87%"}
```

#### Miyabi の現状

```bash
$ miyabi agent run coordinator --issue 123 --json
{
  "status": "completed",
  "issue": 123,
  "tasks_created": 5
}
```

**ギャップ**:
- ❌ ストリーミングJSONL未対応
- ✅ 最終結果のJSON出力は可能

#### 実装推奨案

```rust
// crates/miyabi-core/src/output.rs

pub struct JsonlWriter {
    writer: Box<dyn Write>,
}

impl JsonlWriter {
    pub fn write_event(&mut self, event: &Event) -> Result<()> {
        let json = serde_json::to_string(event)?;
        writeln!(self.writer, "{}", json)?;
        self.writer.flush()?;
        Ok(())
    }
}

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum Event {
    Thread { id: String },
    Turn { turn_id: String, status: String },
    Item { event: String, content: String },
    Conclusion { summary: String },
}
```

---

## 🟢 LOW Priority Gaps - 実装オプション

### 9. 認証方式の多様化

#### Codex の実装

- ChatGPT アカウントログイン（推奨）
- API Key 認証（環境変数）

#### Miyabi の現状

- GitHub Token のみ（既存で十分）

**評価**: Miyabi は GitHub OS アーキテクチャなので、GitHub Token のみで問題なし。

---

### 10. `--output-schema` による構造化出力

#### Codex の実装

```bash
$ codex exec --output-schema schema.json "analyze dependencies"
```

**schema.json**:

```json
{
  "type": "object",
  "properties": {
    "dependencies": {
      "type": "array",
      "items": { "type": "string" }
    },
    "vulnerable_count": { "type": "integer" }
  },
  "required": ["dependencies", "vulnerable_count"]
}
```

#### Miyabi の現状

- ❌ スキーマ定義による出力制御なし

**評価**: NICE TO HAVE（優先度低）

---

## 🏗️ アーキテクチャ比較

### Codex の設計哲学

- **Terminal-First**: CLI体験を最優先
- **Stateless**: ステートレスな実行（セッション保存で補完）
- **Sandbox Safety**: デフォルトRead-Only

### Miyabi の設計哲学

- **GitHub OS**: Issue駆動の全自動ワークフロー
- **Stateful**: Worktree + Issue でステート管理
- **Full Autonomy**: 承認不要の完全自律実行

**結論**: **両者は補完的な設計** - Codex の UX を Miyabi に導入することで、最強のCLIツールになる

---

## 📋 実装ロードマップ

### Phase 1: 基盤整備 (1-2週間)

1. ✅ セッション管理システム実装
   - `Session` 型定義
   - `SessionStore` 永続化
   - `miyabi sessions list` コマンド

2. ✅ JSONL 出力対応
   - `JsonlWriter` 実装
   - `--json` フラグ拡張
   - イベントストリーミング

### Phase 2: コアUX実装 (2-3週間)

3. ✅ `miyabi exec` コマンド実装
   - `ExecCommand` + サンドボックス
   - `--full-auto` / `--sandbox` フラグ
   - `exec resume` サブコマンド

4. ✅ `miyabi chat` インタラクティブモード
   - REPL実装 (rustyline)
   - スラッシュコマンド (`/model`, `/approvals`)
   - ストリーミング応答表示

### Phase 3: 高度な機能 (3-4週間)

5. ✅ Approval System実装
   - `ApprovalHook` フレームワーク
   - TUI（`ratatui`）での差分プレビュー
   - `ApprovalMode::Interactive`

6. ✅ 画像入力サポート
   - GPT-4V API統合
   - `-i` / `--image` フラグ

### Phase 4: エコシステム (4-6週間)

7. ✅ TypeScript SDK (`@miyabi/sdk`)
   - `MiyabiClient` クラス
   - JSONL ストリーム処理
   - npm公開

8. ✅ GitHub Actions統合
   - `miyabi-action` リポジトリ作成
   - Marketplace公開
   - ドキュメント整備

---

## 🎯 推奨される最初のステップ

**Week 1**: `miyabi exec` 最小実装

```bash
# 目標: この動作を実現
$ miyabi exec "count lines of code"
📊 Analyzing codebase...
✅ Found 15,234 lines of Rust code

# セッション保存
Session ID: ses_abc123
```

**実装タスク**:
1. `ExecCommand` 構造体作成
2. セッション永続化 (`~/.miyabi/sessions/`)
3. JSONL出力オプション

**期待される効果**:
- Codex風のUXを体験できる
- CI/CDパイプラインで利用可能
- 既存の `miyabi agent run` との共存

---

## 📖 参考リソース

- [Codex CLI Documentation](https://developers.openai.com/codex/cli/)
- [Codex GitHub Repository](https://github.com/openai/codex)
- [Codex Exec Mode Docs](https://github.com/openai/codex/blob/main/docs/exec.md)
- [Model Context Protocol (MCP)](https://developers.openai.com/codex/mcp/)

---

**作成者**: Claude Code (Sonnet 4.5)
**レビュー**: 推奨
**次のアクション**: Phase 1 タスクの Issue 作成
