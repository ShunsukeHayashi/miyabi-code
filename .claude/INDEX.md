# 📚 .claude Directory - Master Index

**Version**: 2.0.0
**Date**: 2025-11-11
**Purpose**: Central navigation hub for all Claude Code resources

---

## 🚀 Quick Start

**New to Miyabi?** → [`docs/quickstart/QUICK_START.md`](docs/quickstart/QUICK_START.md)
**Project Overview** → [`README.md`](README.md)
**Core Rules** → [`context/core-rules.md`](context/core-rules.md)
**Workspace Guide** → [`docs/quickstart/WORKSPACE_QUICKSTART.md`](docs/quickstart/WORKSPACE_QUICKSTART.md)

---

## 📖 Documentation by Category

### 📌 Core Configuration

| File | Purpose | Priority |
|------|---------|----------|
| [`settings.json`](settings.json) | Claude Code メイン設定 | ⭐⭐⭐⭐⭐ |
| [`mcp.json`](mcp.json) | MCP サーバー設定 | ⭐⭐⭐⭐⭐ |
| [`hooks.json`](hooks.json) | フック設定 | ⭐⭐⭐⭐ |
| [`orchestra-config.yaml`](orchestra-config.yaml) | Orchestra 設定 | ⭐⭐⭐ |

### 🎯 Essential Contexts

| Document | Purpose | Priority |
|----------|---------|----------|
| [`context/core-rules.md`](context/core-rules.md) | MCP First, Benchmark Protocol, Context7 | ⭐⭐⭐⭐⭐ |
| [`context/architecture.md`](context/architecture.md) | Cargo Workspace, GitHub OS, Worktree | ⭐⭐⭐⭐ |
| [`context/agents.md`](context/agents.md) | Agent システム設計 | ⭐⭐⭐⭐ |
| [`context/worktree.md`](context/worktree.md) | Git worktree 使用法 | ⭐⭐⭐⭐ |
| [`context/rust.md`](context/rust.md) | Rust 2021 開発ガイド | ⭐⭐⭐⭐ |

**Full Context List**: [`context/INDEX.md`](context/INDEX.md)

---

## 🤖 Sub-agents & Skills

### Claude Code Skills (19)

Located in [`Skills/`](Skills/) directory:

| Skill | Purpose | Category |
|-------|---------|----------|
| **rust-development** | Build, test, clippy, fmt | Development |
| **debugging-troubleshooting** | 体系的デバッグ | Development |
| **git-workflow** | Git操作・PR管理 | Development |
| **agent-execution** | Agent実行 + Worktree分離 | Orchestration |
| **documentation-generation** | ドキュメント自動生成 | Development |
| **dependency-management** | Cargo依存関係管理 | Development |
| **performance-analysis** | プロファイリング | Development |
| **security-audit** | セキュリティスキャン | Development |
| **issue-analysis** | Issue分析・ラベル推論 | Management |
| **project-setup** | プロジェクト初期化 | Setup |
| **business-strategy-planning** | ビジネス戦略 | Business |
| **content-marketing-strategy** | コンテンツ戦略 | Business |
| **market-research-analysis** | 市場調査 | Business |
| **sales-crm-management** | CRM管理 | Business |
| **growth-analytics-dashboard** | 成長分析 | Business |
| **voicevox** | 音声ナレーション生成 | Integration |
| **context-eng** | コンテキストエンジニアリング | Advanced |
| **paper2agent** | 論文ベースAgent生成 | Advanced |
| **claude-code-x** | Claude Code X統合 | Advanced |

**Details**: [`Skills/README.md`](Skills/README.md)

### Miyabi Agents

Located in [`agents/`](agents/) directory:

| Category | Location | Count |
|----------|----------|-------|
| **Business Agents** | [`agents/specs/business/`](agents/specs/business/) | 14 specs |
| **Lark Integration** | [`agents/specs/lark/`](agents/specs/lark/) | 6 specs |
| **Paper2Agent** | [`agents/specs/paper2agent/`](agents/specs/paper2agent/) | 1 spec |

**Details**: [`agents/README.md`](agents/README.md)

---

## ⚡ Commands & Hooks

### Slash Commands (33)

Located in [`commands/`](commands/) directory:

**Most Used**:
- `/miyabi-auto` - 自動Issue処理
- `/tmux-orchestra-start` - Orchestra起動
- `/codex` - Codex CLI起動
- `/agent-run` - Agent実行
- `/create-issue` - Issue作成
- `/verify` - システム検証
- `/narrate` - VOICEVOX音声生成

**Full List**: [`commands/INDEX.md`](commands/INDEX.md)

### Hooks (29)

Located in [`hooks/`](hooks/) directory:

**Session Hooks**:
- `session-keepalive.sh` - セッション維持
- `session-continue.sh` - セッション継続

**Agent Hooks**:
- `agent-worktree-pre.sh` - Worktree自動作成
- `agent-complete.sh` - Agent完了処理

**Code Quality**:
- `auto-format.sh` - 自動フォーマット
- `validate-rust.sh` - Rust検証
- `validate-typescript.sh` - TypeScript検証

**Details**: [`hooks/INDEX.md`](hooks/INDEX.md)

---

## 🔧 MCP Servers

Located in [`mcp-servers/`](mcp-servers/) directory:

| Server | Status | Purpose |
|--------|--------|---------|
| **filesystem** | ✅ Active | ファイルシステムアクセス |
| **miyabi** | ✅ Active | Miyabi Rust MCP Server (JSON-RPC 2.0) |
| **github-enhanced** | ✅ Active | Issue/PR管理 |
| **project-context** | ✅ Active | プロジェクトコンテキスト |
| **ide-integration** | ✅ Active | VS Code/Jupyter統合 |
| **gemini-image-generation** | ✅ Active | 画像生成 |
| **discord-community** | ✅ Active | Discord管理 |
| **context-engineering** | ⚠️ Optional | コンテキスト分析 |
| **miyabi-legacy** | ❌ Disabled | Node.js版（deprecated） |

**Documentation**: [`docs/mcp/`](docs/mcp/)

---

## 📚 Documentation Hub

### Quickstart Guides

Located in [`docs/quickstart/`](docs/quickstart/):

- **QUICK_START.md** - 3分で始める
- **QUICKSTART_OPTIMIZED.md** - 最適化版クイックスタート
- **WORKSPACE_QUICKSTART.md** - ワークスペース設定
- **MIYABI_WORKSPACE_GUIDE.md** - ワークスペースガイド

### Operations Guides

Located in [`docs/operations/`](docs/operations/):

**tmux 関連**:
- **TMUX_OPERATIONS.md** - tmux操作ガイド
- **TMUX_INTEGRATION_INDEX.md** - tmux統合索引
- **TMUX_ADVANCED_TECHNIQUES.md** - 高度なテクニック
- **KAMUI_TMUX_GUIDE.md** - Kamui tmuxガイド

**Orchestra 関連**:
- **MIYABI_PARALLEL_ORCHESTRA.md** - 並列実行
- **MIYABI_ORCHESTRA_INTEGRATION.md** - Orchestra統合
- **CODEX_TMUX_PARALLEL_EXECUTION.md** - Codex並列実行

**Architecture**:
- **TMUX_A2A_HYBRID_ARCHITECTURE.md** - A2Aアーキテクチャ

### Setup & Integration

Located in [`docs/setup/`](docs/setup/):

- **MUGEN_INTEGRATION_COMPLETE.md** - Mugen統合完了
- **MUGEN_ENV_COMPLETE.md** - Mugen環境設定
- **SSH_REMOTE_DEVELOPMENT_GUIDE.md** - SSHリモート開発
- **SESSION_END_HOOKS_GUIDE.md** - セッション終了フック

### MCP Documentation

Located in [`docs/mcp/`](docs/mcp/):

- **MCP_USAGE_GUIDE_JA.md** - MCP使用法（日本語）
- **MCP_TEST_SUMMARY.md** - MCPテスト結果
- **MCP_CONFIG_FIX.md** - MCP設定修正
- **ALL_TESTS_REPORT.md** - 全テスト結果

### Reference Materials

Located in [`docs/reference/`](docs/reference/):

- **OPTIMIZATION_SUMMARY.md** - 最適化まとめ
- **CONTEXT_REORGANIZATION_PLAN.md** - コンテキスト再編成計画
- **Clickfunnels_ref_url.md** - ClickFunnels参考URL

---

## 📂 Other Resources

### Guides

Located in [`guides/`](guides/) directory:

- **MCP_INTEGRATION_PROTOCOL.md** - MCP統合プロトコル
- **BENCHMARK_IMPLEMENTATION.md** - ベンチマーク実装
- **TROUBLESHOOTING.md** - トラブルシューティング
- **LABEL_USAGE.md** - ラベル使用法
- **SWML_CONVERGENCE.md** - SWML収束
- **TMUX_AI_AGENT_CONTROL.md** - tmux AI Agent制御

### Templates & Prompts

**Templates** ([`templates/`](templates/)):
- `reporting-protocol.md` - レポート形式

**Prompts** ([`prompts/`](prompts/)):
- `task-management-protocol.md` - タスク管理プロトコル
- `worktree-agent-execution.md` - Worktree Agent実行

### Schemas

Located in [`schemas/`](schemas/) directory:

- `orchestra-config.schema.yaml` - Orchestra設定スキーマ
- `orchestra-config.example.yaml` - Orchestra設定例

### Archive

Located in [`archive/`](archive/) directory:

古い設定ファイル、ドキュメント、移行前のファイルを保管。

---

## 🎯 Use Case Navigation

### Starting a New Task

1. Read [`docs/quickstart/QUICK_START.md`](docs/quickstart/QUICK_START.md)
2. Check [`context/core-rules.md`](context/core-rules.md)
3. Use appropriate Skill or slash command

### Debugging an Issue

1. Check [`guides/TROUBLESHOOTING.md`](guides/TROUBLESHOOTING.md)
2. Review [`context/development.md`](context/development.md)
3. Use `debugging-troubleshooting` Skill

### Running an Agent

1. Review [`agents/README.md`](agents/README.md)
2. Check agent spec in [`agents/specs/`](agents/specs/)
3. Use `agent-execution` Skill or `/agent-run`

### tmux Orchestra

1. Read [`docs/operations/MIYABI_PARALLEL_ORCHESTRA.md`](docs/operations/MIYABI_PARALLEL_ORCHESTRA.md)
2. Start with `/tmux-orchestra-start`
3. Monitor with `/daily-update`

### MCP Integration

1. Read [`guides/MCP_INTEGRATION_PROTOCOL.md`](guides/MCP_INTEGRATION_PROTOCOL.md)
2. Check available servers: `claude mcp list`
3. Add server to [`mcp.json`](mcp.json)

---

## 🔍 Priority Guide

### ⭐⭐⭐⭐⭐ Essential (Read First)

- [`README.md`](README.md)
- [`context/core-rules.md`](context/core-rules.md)
- [`docs/quickstart/QUICK_START.md`](docs/quickstart/QUICK_START.md)
- [`settings.json`](settings.json)
- [`mcp.json`](mcp.json)

### ⭐⭐⭐⭐ High Priority

- [`context/architecture.md`](context/architecture.md)
- [`context/agents.md`](context/agents.md)
- [`context/worktree.md`](context/worktree.md)
- [`context/rust.md`](context/rust.md)
- [`docs/operations/TMUX_OPERATIONS.md`](docs/operations/TMUX_OPERATIONS.md)
- [`guides/MCP_INTEGRATION_PROTOCOL.md`](guides/MCP_INTEGRATION_PROTOCOL.md)

### ⭐⭐⭐ Medium Priority

- Other context files in [`context/`](context/)
- Agent specifications in [`agents/specs/`](agents/specs/)
- Command documentation in [`commands/`](commands/)
- Operation guides in [`docs/operations/`](docs/operations/)

### ⭐⭐ Low Priority (As Needed)

- Setup guides in [`docs/setup/`](docs/setup/)
- Reference materials in [`docs/reference/`](docs/reference/)
- Archive files in [`archive/`](archive/)

---

## 🔄 Recent Updates

### v2.0 (2025-11-11) - Directory Structure Optimization

**Changes**:
- ✅ Created `docs/` directory with categorized subdirectories
- ✅ Moved root .md files to appropriate `docs/` subdirectories
- ✅ Separated MCP documentation from implementation
- ✅ Removed duplicate config files (archived)
- ✅ Maintained `Skills/` and `agents/` structure (Claude Code compatible)
- ✅ Updated `README.md` with new structure
- ✅ Updated this `INDEX.md`

**Migration Paths**:
```
Old: .claude/QUICK_START.md
New: .claude/docs/quickstart/QUICK_START.md

Old: .claude/TMUX_OPERATIONS.md
New: .claude/docs/operations/TMUX_OPERATIONS.md

Old: .claude/mcp-servers/MCP_USAGE_GUIDE_JA.md
New: .claude/docs/mcp/MCP_USAGE_GUIDE_JA.md
```

### See Also

- [`docs/reference/OPTIMIZATION_SUMMARY.md`](docs/reference/OPTIMIZATION_SUMMARY.md)
- [`docs/reference/CONTEXT_REORGANIZATION_PLAN.md`](docs/reference/CONTEXT_REORGANIZATION_PLAN.md)

---

## 📊 Statistics

- **Core Config Files**: 5
- **Context Modules**: 17
- **Skills**: 19
- **Agent Specs**: 21
- **Slash Commands**: 33
- **Hooks**: 29
- **MCP Servers**: 9 (7 active)
- **Documentation Files**: 50+

---

## 📞 Support

**Troubleshooting**: [`guides/TROUBLESHOOTING.md`](guides/TROUBLESHOOTING.md)
**Health Check**: `./hooks/health-check.sh`
**MCP Status**: `claude mcp list`
**GitHub Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues

---

**Maintained by**: Miyabi Team
**Last Updated**: 2025-11-11
**Status**: ✅ Active
**Version**: 2.0.0
