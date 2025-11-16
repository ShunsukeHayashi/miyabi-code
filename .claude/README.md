# .claude/ - Claude Code プロジェクト設定

このディレクトリには、Miyabi プロジェクトで Claude Code による開発を最適化するための設定ファイル、Sub-agents、ツールが含まれています。

**Version**: 2.0 (2025-11-11)
**Optimized for**: Claude Code Best Practices

---

## 🚀 クイックスタート

**初めての方**: [`docs/quickstart/QUICK_START.md`](docs/quickstart/QUICK_START.md)
**ワークスペース設定**: [`docs/quickstart/WORKSPACE_QUICKSTART.md`](docs/quickstart/WORKSPACE_QUICKSTART.md)
**トラブルシューティング**: [`guides/TROUBLESHOOTING.md`](guides/TROUBLESHOOTING.md)

---

## 📁 ディレクトリ構造

### **📌 コア設定ファイル**

```
.claude/
├── settings.json              # Claude Code メイン設定
├── mcp.json                   # MCP サーバー設定
├── hooks.json                 # フック設定
├── orchestra-config.yaml      # Orchestra 設定
├── ai-cli-versions.json       # AI CLI バージョン管理
└── INDEX.md                   # ドキュメントインデックス
```

**重要な設定ファイル**:
- **`settings.json`**: Claude Code の動作設定、フック、タイムアウト、セキュリティ設定
- **`mcp.json`**: MCP サーバーの定義（filesystem, miyabi, github-enhanced等）
- **`hooks.json`**: セッション開始/終了フック
- **`orchestra-config.yaml`**: tmux オーケストレーション設定

---

### **🤖 Sub-agents & Agents**

```
.claude/
├── Skills/                    # Managed Skills (Sub-agents)
│   ├── rust-development/      # Rust開発ワークフロー
│   ├── debugging-troubleshooting/
│   ├── git-workflow/
│   ├── documentation-generation/
│   ├── agent-execution/       # Agent実行 + Worktree分離
│   ├── business-strategy-planning/
│   └── ... (19 Skills total)
│
└── agents/                    # Agent仕様・設定
    ├── specs/                 # Agent仕様書
    │   ├── business/          # ビジネスAgent
    │   ├── lark/              # Lark統合Agent
    │   └── paper2agent/       # 論文ベースAgent
    ├── prompts/               # Agentプロンプト
    ├── examples/              # 実行例
    └── triggers.json          # Agentトリガー設定
```

**Skills vs Agents の違い**:
- **Skills**: Claude Code の Sub-agent機能。タスク実行の自動委譲
- **Agents**: Miyabi 固有の Agent仕様（tmux Orchestra で並列実行）

---

### **⚡ コマンド & コンテキスト**

```
.claude/
├── commands/                  # スラッシュコマンド (33)
│   ├── INDEX.md
│   ├── miyabi-auto.md
│   ├── tmux-orchestra-start.md
│   ├── codex.md
│   └── ...
│
├── context/                   # コンテキストモジュール (17)
│   ├── INDEX.md               # コンテキスト索引
│   ├── core-rules.md          # P0ルール
│   ├── agents.md              # Agent設計
│   ├── worktree.md            # Worktree管理
│   ├── rust.md                # Rust開発
│   └── ...
│
└── hooks/                     # フックスクリプト (29)
    ├── INDEX.md
    ├── agent-worktree-pre.sh
    ├── auto-format.sh
    ├── session-keepalive.sh
    └── ...
```

**コマンド使用例**:
```bash
/miyabi-auto           # 自動Issue処理
/tmux-orchestra-start  # Orchestra起動
/codex                 # Codex CLI起動
```

---

### **🔧 MCP サーバー**

```
.claude/
└── mcp-servers/               # MCP実装（ドキュメントは docs/mcp/ へ）
    ├── miyabi-integration.js
    ├── github-enhanced.cjs
    ├── project-context.cjs
    ├── ide-integration.cjs
    ├── discord-integration.js
    ├── lark-integration.cjs
    └── ...
```

**アクティブなMCPサーバー**:
- `filesystem`: ファイルシステムアクセス
- `miyabi`: Miyabi Rust MCP Server (JSON-RPC 2.0)
- `github-enhanced`: Issue/PR管理
- `project-context`: プロジェクトコンテキスト
- `ide-integration`: VS Code/Jupyter統合

**詳細**: [`docs/mcp/MCP_USAGE_GUIDE_JA.md`](docs/mcp/MCP_USAGE_GUIDE_JA.md)

---

### **📚 ドキュメント**

```
.claude/
├── docs/                      # 統合ドキュメント（新設）
│   ├── quickstart/            # クイックスタート類
│   │   ├── QUICK_START.md
│   │   ├── QUICKSTART_OPTIMIZED.md
│   │   ├── WORKSPACE_QUICKSTART.md
│   │   └── MIYABI_WORKSPACE_GUIDE.md
│   │
│   ├── operations/            # tmux/Orchestra操作
│   │   ├── TMUX_OPERATIONS.md
│   │   ├── MIYABI_PARALLEL_ORCHESTRA.md
│   │   ├── TMUX_INTEGRATION_INDEX.md
│   │   └── ...
│   │
│   ├── setup/                 # セットアップ・統合
│   │   ├── MUGEN_INTEGRATION_COMPLETE.md
│   │   ├── SSH_REMOTE_DEVELOPMENT_GUIDE.md
│   │   └── SESSION_END_HOOKS_GUIDE.md
│   │
│   ├── mcp/                   # MCP関連
│   │   ├── MCP_USAGE_GUIDE_JA.md
│   │   ├── MCP_TEST_SUMMARY.md
│   │   └── ...
│   │
│   └── reference/             # その他参考資料
│       ├── OPTIMIZATION_SUMMARY.md
│       └── CONTEXT_REORGANIZATION_PLAN.md
│
└── guides/                    # 操作ガイド
    ├── MCP_INTEGRATION_PROTOCOL.md
    ├── BENCHMARK_IMPLEMENTATION.md
    ├── TROUBLESHOOTING.md
    └── ...
```

---

### **🗄️ その他**

```
.claude/
├── archive/                   # アーカイブ（古い設定・ドキュメント）
├── prompts/                   # プロンプトテンプレート
├── schemas/                   # スキーマ定義
├── scripts/                   # ユーティリティスクリプト
├── templates/                 # テンプレート
└── workflows/                 # ワークフロー定義
```

---

## 🎯 主要ワークフロー

### 1. **通常開発フロー**

```bash
# 1. Claude Code 起動
claude

# 2. Skill を使用してタスク実行
> Use rust-development skill to build and test

# 3. Git 操作
> Use git-workflow skill to commit changes
```

### 2. **tmux Orchestra フロー**

```bash
# 1. Orchestra起動
/tmux-orchestra-start

# 2. Issue自動処理
/miyabi-auto

# 3. 進捗確認
/daily-update
```

### 3. **MCP統合フロー**

```bash
# 1. MCP確認
claude mcp list

# 2. MCP経由でAgentを実行
> Use miyabi MCP to execute agent

# 3. GitHub連携
> Use github-enhanced MCP to create PR
```

---

## 🔒 セキュリティ設定

`settings.json` で以下のパスがブロックされています：

```json
"blockedPaths": [
  ".env",
  ".env.local",
  ".git/",
  "*.key",
  "*.pem",
  "**/node_modules/**",
  "**/.worktrees/**"
]
```

---

## 📖 重要ドキュメント索引

| カテゴリ | ドキュメント | 説明 |
|---------|------------|------|
| **必読** | `INDEX.md` | 全ドキュメント索引 |
| **クイックスタート** | `docs/quickstart/QUICK_START.md` | 3分で始める |
| **tmux操作** | `docs/operations/TMUX_OPERATIONS.md` | tmux操作ガイド |
| **Orchestra** | `docs/operations/MIYABI_PARALLEL_ORCHESTRA.md` | 並列実行 |
| **MCP** | `docs/mcp/MCP_USAGE_GUIDE_JA.md` | MCP使用法 |
| **トラブル** | `guides/TROUBLESHOOTING.md` | 問題解決 |

---

## 🚨 重要な変更履歴

### v2.0 (2025-11-11) - ディレクトリ構造最適化

**変更内容**:
- ✅ `docs/` ディレクトリ新設（ドキュメント集約）
- ✅ ルートの .md ファイルを分類移動
- ✅ `mcp-servers/` からドキュメント分離
- ✅ 設定ファイル重複削除（`mcp-config.json` を archive へ）
- ✅ `Skills/` と `agents/` を維持（Claude Code 公式互換）

**移行パス**:
```
旧: .claude/QUICK_START.md
新: .claude/docs/quickstart/QUICK_START.md

旧: .claude/TMUX_OPERATIONS.md
新: .claude/docs/operations/TMUX_OPERATIONS.md

旧: .claude/mcp-servers/MCP_USAGE_GUIDE_JA.md
新: .claude/docs/mcp/MCP_USAGE_GUIDE_JA.md
```

---

## 📞 サポート

**問題が発生した場合**:
1. [`guides/TROUBLESHOOTING.md`](guides/TROUBLESHOOTING.md) を確認
2. `claude mcp list` で MCP サーバー状態を確認
3. `.claude/hooks/health-check.sh` を実行

**GitHub Issue**: https://github.com/ShunsukeHayashi/Miyabi/issues

---

**Maintained by**: Miyabi Team
**License**: MIT
**Last Updated**: 2025-11-11
