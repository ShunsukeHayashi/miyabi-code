# Miyabi Development - Quick Index

**Version**: 6.0-Universal
**Last Updated**: 2025-12-03
**Environment**: Multi-platform (Sandbox, MUGEN/MAJIN EC2, Mac mini, Pixel)

---

## 🚀 Quick Start

### 環境セットアップ
```bash
# 1. 環境変数設定
bash scripts/setup-env.sh

# 2. 全問題修正
bash scripts/fix-all.sh

# 3. 開発サーバー起動
bash scripts/dev-start.sh --attach
```

### よく使うコマンド
```bash
# ステータス確認
mstatus        # プロジェクトステータス (alias)

# 開発サーバー
cd crates/miyabi-console && npm run dev  # Vite (port 5173)
cd . && npm run dev                       # Next.js (port 3000)

# テスト
cargo test --all                          # Rust tests
cd crates/miyabi-console && npm test      # Frontend tests

# ビルド
cargo build --release -p miyabi-mcp-server
```

---

## 📂 .claude ディレクトリ構造

### 📋 Core Documents

| ファイル | 説明 | 更新頻度 |
|---------|------|----------|
| `../CLAUDE.md` | **マスターマニュアル** - P0-P3ルール | 週次 |
| `INDEX.md` | **このファイル** | 随時 |
| `TODO_ISSUES.md` | **未実装TODO追跡** | 随時 |

### 🤖 Agents (21エージェント)

| パス | 説明 |
|------|------|
| `agents/` | Agent定義・設定 |
| `../agents.yml` (`.miyabi/`) | Agent YAML設定 |

**Coding Agents (7)**:
- Coordinator (シキルーン), CodeGen (ツクルーン), Review (メダマン)
- Issue (ミツケルーン), PR (マトメルーン), Deploy (ハコブーン), Refresher (ツナグン)

**Business Agents (14)**:
- AI Entrepreneur, Market Research, Persona, Product Concept/Design
- Content Creation, Funnel Design, SNS Strategy, Marketing, Sales, CRM, Analytics, YouTube

### 📚 Context

| ファイル | 説明 | 重要度 |
|---------|------|--------|
| `context/agents.md` | Agent一覧・概要 | ⭐⭐⭐ |
| `context/architecture.md` | システム構成 | ⭐⭐⭐ |
| `context/development.md` | 開発ガイドライン | ⭐⭐ |
| `context/rust.md` | Rust規約 | ⭐⭐ |
| `context/typescript.md` | TypeScript規約 | ⭐⭐ |
| `context/worktree.md` | Git Worktree | ⭐ |

### 🎯 Skills

| カテゴリ | スキル数 | 主要スキル |
|---------|---------|-----------|
| Development | 8 | debugging, git-workflow, issue-analysis |
| Business | 6 | business-strategy, market-research, content-marketing |
| Documentation | 4 | doc-generation, api-docs |

### 🔧 Configuration

| ファイル | 説明 |
|---------|------|
| `mcp.json` | MCP設定 (環境別) |
| `settings.json` | 開発環境設定 |
| `coordinator-config.json` | Coordinator設定 |

### 📁 Archive (整理対象)

以下のファイルはアーカイブ対象です：
- `*_2025-11-*.md` - 古いハンドオフファイル
- `PHASE_*_REPORT.md` - 完了したフェーズレポート
- `SESSION_*.md` - 過去セッションログ

---

## 🔌 MCP Servers (33サーバー)

### Core (7)
- miyabi-mcp-server (Rust) ← **要ビルド**
- miyabi-github, miyabi-file-access, miyabi-tmux-server
- miyabi-rules-server, miyabi-sse-gateway, miyabi-obsidian-server

### AI & LLM (6)
- gemini3-adaptive-runtime, gemini3-uiux-designer, gemini3-general
- miyabi-ollama, miyabi-openai-assistant, miyabi-chatgpt-app

### Monitoring (7)
- health-check, log-aggregator, resource-monitor
- network-inspector, process-inspector, git-inspector, file-watcher

### Business (6)
- commercial-agents, lark-mcp-enhanced, lark-openapi
- lark-wiki-mcp, context7, context7-cloud

### Development (7)
- claude-code, codex, pixel-mcp
- tool-search, mcp, context-engineering

---

## 📊 Current Issues

### Critical (P0)
- [ ] A2Aブリッジバイナリ未ビルド
- [ ] JSON-RPC通信未実装 (TODO-001, TODO-002)
- [ ] 環境変数未設定 (GITHUB_TOKEN等)

### High (P1)
- [ ] miyabi-consoleテスト未整備
- [ ] IssueAgent A2A未実装 (TODO-003)

### Medium (P2)
- [ ] ドキュメント整理必要
- [ ] Disk使用量削減

---

## 🔗 Quick Links

- [CLAUDE.md](../CLAUDE.md) - マスターマニュアル
- [TODO_ISSUES.md](TODO_ISSUES.md) - TODO追跡
- [README.md](README.md) - ディレクトリ説明
- [scripts/](../scripts/) - セットアップスクリプト

---

Last Updated: 2025-12-03
