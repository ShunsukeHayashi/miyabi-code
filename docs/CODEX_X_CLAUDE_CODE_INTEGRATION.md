# 🔧 Codex X → Claude Code 統合設計

**作成日**: 2025-10-27
**目的**: Codex XツールをMiyabi AgentシステムからClaude Code直接統合に変更

---

## 🎯 統合方針

### 現状（Before）

```
Claude Code
    ↓
Miyabi Agent
    ↓
miyabi-core::codex_helper
    ↓
codex exec (CLI)
```

**問題点**:
- Claude CodeがCodex Xを直接使えない
- Miyabi Agentを経由する必要がある
- 追加のレイヤーによるオーバーヘッド

---

### 新方式（After）

```
Claude Code ← 直接統合
    ↓
MCP Server (Codex X)
    ↓
codex exec (CLI)
```

**メリット**:
- Claude Codeが直接Codex Xを呼び出し可能
- シンプルなアーキテクチャ
- レイテンシ削減

---

## 📋 統合方法の選択肢

### オプション1: MCP Server（推奨）

**実装方法**:
```typescript
// crates/miyabi-mcp-server/src/codex_rpc.ts

export interface CodexExecuteParams {
  instruction: string;
  model?: string;
  sandbox?: 'read-only' | 'workspace-write' | 'danger-full-access';
  approval?: 'untrusted' | 'on-failure' | 'on-request' | 'never';
  working_dir?: string;
}

export async function handleCodexExecute(
  params: CodexExecuteParams
): Promise<CodexResult> {
  // codex exec を実行
}
```

**claude_desktop_config.json**:
```json
{
  "mcpServers": {
    "miyabi": {
      "command": "node",
      "args": ["/path/to/miyabi-mcp-server/build/index.js"],
      "env": {
        "CODEX_PATH": "/usr/local/bin/codex"
      }
    }
  }
}
```

**使用例（Claude Code内）**:
```
User: "Use Codex X to refactor the authentication module to use async/await"
Claude: [Uses MCP tool mcp__miyabi__codex_execute]
```

**メリット**:
- Claude Codeの標準的なMCP統合
- 他のMCPツールと一貫性がある
- 設定が簡単

**デメリット**:
- Node.js実装が必要（現在Rustで実装中のMCP Serverと別実装）

---

### オプション2: Rust MCP Server拡張（最も統合的）

**実装方法**:
```rust
// crates/miyabi-mcp-server/src/tools/codex.rs

use serde::{Deserialize, Serialize};
use miyabi_core::codex_helper::{execute_codex, CodexConfig};

#[derive(Deserialize)]
pub struct CodexExecuteParams {
    instruction: String,
    model: Option<String>,
    sandbox: Option<String>,
    approval: Option<String>,
    working_dir: Option<String>,
}

pub async fn handle_codex_execute(
    params: CodexExecuteParams
) -> Result<Value> {
    let config = CodexConfig {
        model: params.model,
        sandbox: parse_sandbox(&params.sandbox),
        approval: parse_approval(&params.approval),
        working_dir: params.working_dir,
    };

    let result = execute_codex(&params.instruction, config).await?;

    Ok(json!({
        "success": result.success,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exit_code": result.exit_code,
    }))
}
```

**MCPツール定義**:
```rust
// crates/miyabi-mcp-server/src/rpc.rs

pub fn register_tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "codex_execute".to_string(),
            description: "Execute Codex X with a given instruction".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "instruction": {
                        "type": "string",
                        "description": "Detailed instruction for Codex X"
                    },
                    "model": {
                        "type": "string",
                        "description": "Model to use (e.g., 'gpt-5-codex', 'o3')",
                        "enum": ["gpt-5-codex", "o3"]
                    },
                    "sandbox": {
                        "type": "string",
                        "description": "Sandbox policy",
                        "enum": ["read-only", "workspace-write", "danger-full-access"],
                        "default": "workspace-write"
                    },
                    "approval": {
                        "type": "string",
                        "description": "Approval policy",
                        "enum": ["untrusted", "on-failure", "on-request", "never"],
                        "default": "on-failure"
                    },
                    "working_dir": {
                        "type": "string",
                        "description": "Working directory for Codex execution"
                    }
                },
                "required": ["instruction"]
            }),
        },
    ]
}
```

**メリット**:
- 既存のRust MCP Server実装を活用
- `miyabi-core::codex_helper`を直接使用
- 型安全性が高い

**デメリット**:
- Rust MCP Serverの実装が必要（現在開発中）

---

### オプション3: Claude Code Slash Command

**実装方法**:
```markdown
<!-- .claude/commands/codex.md -->

# /codex - Codex X Integration

Execute Codex X for complex coding tasks.

## Usage

```
/codex <instruction>
```

## Examples

```
/codex Refactor the authentication module to use async/await
/codex Add comprehensive unit tests for the payment module
/codex Optimize database queries in the analytics engine
```

## Behind the scenes

This command executes:
```bash
codex exec --sandbox workspace-write --ask-for-approval on-failure "<instruction>"
```
```

**メリット**:
- 実装が最もシンプル
- すぐに使える

**デメリット**:
- Claude Codeの標準的な統合ではない
- 出力フォーマットの制御が難しい

---

## 🚀 推奨実装方法

### Phase 1: Slash Command（即時利用可能）

**今すぐ実行可能**: `.claude/commands/codex.md` を作成

```bash
cat > .claude/commands/codex.md << 'EOF'
# /codex - Codex X Execution

Execute Codex X (GPT-5 Codex) for complex coding tasks.

## Arguments

- `instruction`: Detailed instruction for Codex X

## Implementation

```bash
codex exec --sandbox workspace-write --ask-for-approval on-failure "$@"
```

## Examples

```
/codex Refactor the authentication module to use async/await
/codex Add comprehensive unit tests for all Agent modules
```
EOF
```

**使用例**:
```
User: "/codex Add comprehensive error handling to miyabi-orchestrator"
Claude Code: [Executes codex exec command]
```

---

### Phase 2: Rust MCP Server統合（本格実装）

**実装タスク**:

1. **MCPツール登録** (2時間)
   ```rust
   // crates/miyabi-mcp-server/src/tools/codex.rs
   ```

2. **RPC handler実装** (2時間)
   ```rust
   // crates/miyabi-mcp-server/src/rpc.rs
   pub async fn handle_tools_call(call: ToolCall) -> Result<Value> {
       match call.name.as_str() {
           "codex_execute" => codex::handle_codex_execute(call.arguments).await,
           // ...
       }
   }
   ```

3. **統合テスト** (1時間)
   ```rust
   #[tokio::test]
   async fn test_codex_execute_via_mcp() {
       let params = json!({
           "instruction": "Add unit tests"
       });
       let result = handle_tools_call(ToolCall {
           name: "codex_execute".to_string(),
           arguments: params,
       }).await.unwrap();

       assert!(result["success"].as_bool().unwrap());
   }
   ```

4. **ドキュメント更新** (1時間)

---

### Phase 3: Context7統合（将来拡張）

**目的**: Codex XがContext7を使って外部ドキュメントを参照

```rust
pub async fn execute_codex_with_context7(
    instruction: &str,
    context7_query: &str,
) -> Result<CodexResult> {
    // 1. Context7で外部ドキュメントを取得
    let context = fetch_context7(context7_query).await?;

    // 2. Codex Xに渡すinstructionを拡張
    let enriched_instruction = format!(
        "{}\n\nContext:\n{}",
        instruction,
        context
    );

    // 3. Codex X実行
    execute_codex_default(&enriched_instruction).await
}
```

**使用例**:
```
User: "Use Codex X to implement Tokio async runtime based on the latest Tokio documentation"
Claude: [Fetches Tokio docs via Context7, then executes Codex X]
```

---

## 📊 実装スケジュール

### 今日（Phase 1）

**時間**: 15分

1. `.claude/commands/codex.md` 作成
2. 動作確認
3. ドキュメント更新

---

### 明日以降（Phase 2）

**時間**: 6時間

1. Rust MCP Server拡張
2. Codex X RPC handler実装
3. 統合テスト
4. Claude Code設定

---

### 来週（Phase 3）

**時間**: 4時間

1. Context7統合
2. 高度な使用例追加
3. パフォーマンス最適化

---

## 💡 使用例

### 例1: リファクタリング

```
User: "Use Codex X to refactor miyabi-orchestrator to use async/await throughout"
Claude Code: [Calls mcp__miyabi__codex_execute]

Codex X Output:
✅ Refactored 15 files
✅ All tests pass
📝 Summary: Converted all sync code to async/await
```

### 例2: テスト追加

```
User: "Use Codex X to add comprehensive unit tests for miyabi-agent-core"
Claude Code: [Calls mcp__miyabi__codex_execute]

Codex X Output:
✅ Added 45 unit tests
✅ Test coverage: 30% → 85%
📝 All tests pass
```

### 例3: Context7統合

```
User: "Use Codex X with Context7 to implement Redis caching based on the latest redis-rs documentation"
Claude Code:
  1. [Fetches redis-rs docs via Context7]
  2. [Calls mcp__miyabi__codex_execute with enriched instruction]

Codex X Output:
✅ Implemented Redis caching layer
✅ Added connection pooling
📝 Based on redis-rs v0.25.0 documentation
```

---

## 🎯 成功基準

### Phase 1（Slash Command）
- [ ] `/codex` コマンドが動作する
- [ ] Codex X実行結果がClaude Codeに返る
- [ ] エラーハンドリングが適切

### Phase 2（MCP Server）
- [ ] MCPツールとして登録される
- [ ] Claude CodeからCodex Xを直接呼び出せる
- [ ] 全てのパラメータ（model, sandbox, approval）が機能する

### Phase 3（Context7）
- [ ] Context7 + Codex X統合が動作する
- [ ] 外部ドキュメントを参照してコード生成できる

---

## 📚 参考リンク

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [Codex X Documentation](https://platform.openai.com/docs/models/gpt-5-codex)
- [miyabi-core::codex_helper](crates/miyabi-core/src/codex_helper.rs)

---

**次のアクション**: Phase 1 Slash Command実装（15分で完了）
