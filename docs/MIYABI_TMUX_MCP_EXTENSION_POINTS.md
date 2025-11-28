# 🔧 miyabi-tmux MCP Server 拡張ポイント詳細

## 📊 現状分析

### 現在のツール一覧 (11個)

| ツール名 | 機能 | 制限事項 |
|---------|------|----------|
| `tmux_list_sessions` | セッション一覧 | ✅ 問題なし |
| `tmux_list_panes` | ペイン一覧 | ✅ 問題なし |
| `tmux_send_message` | メッセージ送信 | ⚠️ テキストのみ、制御文字不可 |
| `tmux_join_commhub` | CommHub参加 | ⚠️ miyabi-orchestra固定 |
| `tmux_get_commhub_status` | CommHub状態 | ⚠️ messageCount未実装 |
| `tmux_broadcast` | 全セッション通知 | ✅ 問題なし |
| `tmux_pane_capture` | ペイン内容取得 | ✅ 問題なし |
| `tmux_pane_search` | ペイン内検索 | ✅ 問題なし |
| `tmux_pane_tail` | 末尾取得 | ✅ 問題なし |
| `tmux_pane_is_busy` | ビジー状態確認 | ✅ 問題なし |
| `tmux_pane_current_command` | 現在コマンド | ✅ 問題なし |

---

## 🚨 クリティカル拡張ポイント

### 1. 制御文字送信機能の追加 (P0-Critical)

**問題**: 現在の `tmux_send_message` はテキストのみ送信可能で、Ctrl-C等の制御文字を送信できない

**現在のコード** (L89-96):
```typescript
async function sendMessage(paneId: string, message: string): Promise<void> {
  const escapedMessage = message.replace(/"/g, '\\"');
  await execTmux(`send-keys -t ${paneId} "${escapedMessage}"`);
  await new Promise(resolve => setTimeout(resolve, 500));
  await execTmux(`send-keys -t ${paneId} Enter`);
}
```

**拡張案**: 新しいツール `tmux_send_keys` を追加

```typescript
/**
 * Send raw keys to pane (including control characters)
 * Supports: C-c (Ctrl-C), C-d (Ctrl-D), C-z (Ctrl-Z), Enter, Escape, etc.
 */
async function sendKeys(paneId: string, keys: string, literal: boolean = false): Promise<void> {
  // literalモード: -l フラグで文字列をそのまま送信
  const literalFlag = literal ? '-l' : '';
  await execTmux(`send-keys ${literalFlag} -t ${paneId} ${keys}`);
}

// 新しいツール定義
{
  name: "tmux_send_keys",
  description: "Send raw keys to a pane including control characters. Use 'C-c' for Ctrl-C, 'C-d' for Ctrl-D, 'Enter' for Enter key, 'Escape' for Escape.",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string", description: "Target pane ID" },
      keys: { type: "string", description: "Keys to send (e.g., 'C-c', 'Enter', 'Escape', or literal text)" },
      literal: { type: "boolean", description: "If true, send keys literally without interpretation" },
    },
    required: ["pane_id", "keys"],
  },
}
```

**ユースケース**:
- `tmux_send_keys("%54", "C-c")` → プロセス中断
- `tmux_send_keys("%54", "C-c C-c 'clear && claude' Enter")` → クリア後Claude起動
- `tmux_send_keys("%54", "C-d")` → EOF送信
- `tmux_send_keys("%54", "Escape")` → Vimモード切替等

---

### 2. セッション・ウィンドウ・ペイン管理機能 (P1-High)

**問題**: セッション/ウィンドウ/ペインの作成・削除・分割ができない

**拡張案**: 管理系ツールを追加

```typescript
// セッション作成
{
  name: "tmux_create_session",
  description: "Create a new tmux session",
  inputSchema: {
    type: "object",
    properties: {
      session_name: { type: "string" },
      window_name: { type: "string" },
      start_directory: { type: "string" },
    },
    required: ["session_name"],
  },
}

// ウィンドウ作成
{
  name: "tmux_create_window",
  description: "Create a new window in a session",
  inputSchema: {
    type: "object",
    properties: {
      session: { type: "string" },
      window_name: { type: "string" },
      start_directory: { type: "string" },
    },
    required: ["session"],
  },
}

// ペイン分割
{
  name: "tmux_split_pane",
  description: "Split a pane horizontally or vertically",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string" },
      direction: { type: "string", enum: ["horizontal", "vertical"] },
      percentage: { type: "number", description: "Size percentage (1-99)" },
      start_directory: { type: "string" },
    },
    required: ["pane_id", "direction"],
  },
}

// セッション終了
{
  name: "tmux_kill_session",
  description: "Kill a tmux session",
  inputSchema: {
    type: "object",
    properties: {
      session_name: { type: "string" },
    },
    required: ["session_name"],
  },
}

// ペイン終了
{
  name: "tmux_kill_pane",
  description: "Kill a specific pane",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string" },
    },
    required: ["pane_id"],
  },
}
```

---

### 3. コマンド実行とプロセス管理 (P1-High)

**問題**: ペインでコマンドを実行して結果を待つ機能がない

**拡張案**:

```typescript
// コマンド実行（結果を待機）
{
  name: "tmux_run_command",
  description: "Run a command in a pane and wait for completion",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string" },
      command: { type: "string" },
      timeout_seconds: { type: "number", default: 30 },
      wait_for_prompt: { type: "boolean", default: true },
    },
    required: ["pane_id", "command"],
  },
}

// プロセス中断
{
  name: "tmux_interrupt",
  description: "Send interrupt signal (Ctrl-C) to a pane",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string" },
    },
    required: ["pane_id"],
  },
}

// Claude Code起動
{
  name: "tmux_start_claude",
  description: "Start Claude Code in a pane (clear and run claude command)",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string" },
      initial_prompt: { type: "string", description: "Optional initial prompt to send to Claude" },
    },
    required: ["pane_id"],
  },
}
```

---

### 4. エージェント専用高レベルAPI (P1-High)

**問題**: Miyabi Agentシステムに特化した操作が低レベルすぎる

**拡張案**:

```typescript
// Agent起動（Claude Code + 初期タスク）
{
  name: "tmux_deploy_agent",
  description: "Deploy an agent to a pane with Claude Code and initial task",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string" },
      agent_name: { type: "string", description: "Agent name (e.g., 'kaede', 'sakura', 'botan')" },
      agent_role: { type: "string", enum: ["coordinator", "codegen", "review", "deployment"] },
      initial_task: { type: "string", description: "Initial task/prompt for the agent" },
    },
    required: ["pane_id", "agent_name", "agent_role"],
  },
}

// Orchestra構成デプロイ
{
  name: "tmux_deploy_orchestra",
  description: "Deploy full orchestra configuration (create session with multiple agents)",
  inputSchema: {
    type: "object",
    properties: {
      session_name: { type: "string", default: "miyabi-orchestra" },
      agents: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            task: { type: "string" },
          },
        },
      },
    },
    required: ["agents"],
  },
}
```

---

## 📋 実装優先順位

### P0 (今すぐ必要)
1. **`tmux_send_keys`** - 制御文字送信 (Ctrl-C等)
2. **`tmux_interrupt`** - プロセス中断
3. **`tmux_start_claude`** - Claude Code起動

### P1 (今週中)
4. **`tmux_create_session`** - セッション作成
5. **`tmux_split_pane`** - ペイン分割
6. **`tmux_deploy_agent`** - Agent一括デプロイ
7. **`tmux_run_command`** - コマンド実行

### P2 (来週)
8. **`tmux_set_layout`** - レイアウト設定
9. **`tmux_deploy_orchestra`** - Orchestra構成デプロイ
10. **`tmux_clear_pane`** - ペインクリア
11. **`tmux_save_buffer`** - バッファ保存

---

## 🔨 P0実装コード

以下のコードを `mcp-servers/miyabi-tmux-server/src/index.ts` に追加:

### 関数追加

```typescript
// === P0 Functions ===

/**
 * Send raw keys including control characters
 */
async function sendKeys(paneId: string, keys: string, literal: boolean = false): Promise<void> {
  const literalFlag = literal ? '-l' : '';
  await execTmux(`send-keys ${literalFlag} -t ${paneId} ${keys}`);
}

/**
 * Interrupt (Ctrl-C) a pane
 */
async function interrupt(paneId: string): Promise<void> {
  await execTmux(`send-keys -t ${paneId} C-c`);
  await new Promise(resolve => setTimeout(resolve, 100));
  await execTmux(`send-keys -t ${paneId} C-c`);
}

/**
 * Start Claude Code in a pane
 */
async function startClaude(paneId: string, initialPrompt?: string): Promise<void> {
  // Interrupt any running process
  await interrupt(paneId);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Clear and start claude
  await execTmux(`send-keys -t ${paneId} 'clear && claude' Enter`);
  
  // Wait for Claude to start (check for claude/node process)
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { command } = await getCurrentCommand(paneId);
    if (command === 'claude' || command.includes('node')) {
      break;
    }
    attempts++;
  }
  
  // Send initial prompt if provided
  if (initialPrompt) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await sendMessage(paneId, initialPrompt);
  }
}
```

### ツール定義追加 (tools配列に追加)

```typescript
{
  name: "tmux_send_keys",
  description: "Send raw keys to a pane including control characters (C-c, C-d, Enter, Escape, etc.)",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string", description: "Target pane ID" },
      keys: { type: "string", description: "Keys to send (e.g., 'C-c', 'C-c C-c', 'clear && claude Enter')" },
      literal: { type: "boolean", description: "Send literally without interpretation", default: false },
    },
    required: ["pane_id", "keys"],
  },
},
{
  name: "tmux_interrupt",
  description: "Send Ctrl-C twice to interrupt any running process in a pane",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string", description: "Target pane ID" },
    },
    required: ["pane_id"],
  },
},
{
  name: "tmux_start_claude",
  description: "Start Claude Code in a pane (interrupts current process, clears, and starts claude)",
  inputSchema: {
    type: "object",
    properties: {
      pane_id: { type: "string", description: "Target pane ID" },
      initial_prompt: { type: "string", description: "Optional initial prompt to send to Claude after startup" },
    },
    required: ["pane_id"],
  },
},
```

### ハンドラー追加 (switchに追加)

```typescript
case "tmux_send_keys": {
  const { pane_id, keys, literal } = args as { pane_id: string; keys: string; literal?: boolean };
  await sendKeys(pane_id, keys, literal ?? false);
  return {
    content: [{ type: "text", text: JSON.stringify({ success: true, pane_id, keys }, null, 2) }],
  };
}

case "tmux_interrupt": {
  const { pane_id } = args as { pane_id: string };
  await interrupt(pane_id);
  return {
    content: [{ type: "text", text: JSON.stringify({ success: true, pane_id, message: "Interrupt sent (C-c C-c)" }, null, 2) }],
  };
}

case "tmux_start_claude": {
  const { pane_id, initial_prompt } = args as { pane_id: string; initial_prompt?: string };
  await startClaude(pane_id, initial_prompt);
  return {
    content: [{ type: "text", text: JSON.stringify({ success: true, pane_id, message: "Claude Code started" }, null, 2) }],
  };
}
```

---

## 📊 拡張後のツール一覧 (予定)

| カテゴリ | ツール | 優先度 | 状態 |
|---------|-------|--------|------|
| **基本操作** | `tmux_list_sessions` | - | ✅ 実装済 |
| | `tmux_list_panes` | - | ✅ 実装済 |
| | `tmux_send_message` | - | ✅ 実装済 |
| | `tmux_send_keys` | P0 | 🔴 要実装 |
| | `tmux_interrupt` | P0 | 🔴 要実装 |
| **セッション管理** | `tmux_create_session` | P1 | 🟡 計画中 |
| | `tmux_kill_session` | P1 | 🟡 計画中 |
| | `tmux_create_window` | P1 | 🟡 計画中 |
| | `tmux_split_pane` | P1 | 🟡 計画中 |
| | `tmux_kill_pane` | P1 | 🟡 計画中 |
| **レイアウト** | `tmux_set_layout` | P2 | 📋 計画中 |
| | `tmux_resize_pane` | P2 | 📋 計画中 |
| | `tmux_swap_pane` | P2 | 📋 計画中 |
| **コマンド実行** | `tmux_run_command` | P1 | 🟡 計画中 |
| | `tmux_start_claude` | P0 | 🔴 要実装 |
| **Agent専用** | `tmux_deploy_agent` | P1 | 🟡 計画中 |
| | `tmux_deploy_orchestra` | P2 | 📋 計画中 |
| | `tmux_get_agent_status` | P2 | 📋 計画中 |
| **バッファ** | `tmux_clear_pane` | P2 | 📋 計画中 |
| | `tmux_save_buffer` | P2 | 📋 計画中 |
| | `tmux_copy_to_clipboard` | P3 | 📋 計画中 |
| **CommHub** | `tmux_join_commhub` | - | ✅ 実装済 |
| | `tmux_get_commhub_status` | - | ✅ 実装済 |
| | `tmux_broadcast` | - | ✅ 実装済 |
| **監視** | `tmux_pane_capture` | - | ✅ 実装済 |
| | `tmux_pane_search` | - | ✅ 実装済 |
| | `tmux_pane_tail` | - | ✅ 実装済 |
| | `tmux_pane_is_busy` | - | ✅ 実装済 |
| | `tmux_pane_current_command` | - | ✅ 実装済 |

---

**作成日**: 2025-11-28
**作成者**: Operator (Claude)
**ステータス**: Guardian承認待ち
