# Miyabi Development - Quick Index

**Version**: 5.0-Pixel
**Last Updated**: 2025-11-19
**Environment**: Termux on Pixel 9 Pro XL

---

## 🚀 Quick Start

```bash
# Termux起動時に自動実行される
# - ~/Dev/miyabi-private へ自動移動
# - 24個の環境変数ロード
# - 30+個のエイリアス有効化
# - 24個のMCPサーバー利用可能
```

**よく使うコマンド**:
```bash
mstatus       # プロジェクトステータス
mcp-tools     # MCPサーバーリスト
m             # プロジェクトルートへ
c             # MUGEN Claude Code接続
```

---

## 📂 .claude ディレクトリ構造

### 📋 ドキュメント (Top Level)

| ファイル | 説明 |
|---------|------|
| `../CLAUDE.md` | **マスターマニュアル** - Pixel/Termux開発の全て |
| `INDEX.md` | **このファイル** - クイックリファレンス |
| `README.md` | .claudeディレクトリの説明 |

### 🤖 Agents

| パス | 説明 |
|------|------|
| `agents/AGENT_CHARACTERS.md` | Agentキャラクター定義 (14キャラ) |
| `agents/specs/` | 各Agent詳細仕様書 |
| `agents/prompts/` | Agentプロンプトテンプレート |
| `agents/triggers.json` | Agentトリガー設定 |
| `agents/agent-name-mapping.json` | Agent名マッピング |

### 📚 Context

| ファイル | 説明 |
|---------|------|
| `context/agents.md` | Agent概要・一覧 |
| `context/architecture.md` | システムアーキテクチャ |
| `context/development.md` | 開発ガイドライン |
| `context/protocols.md` | 通信プロトコル |
| `context/rust.md` | **Rust開発規約** |
| `context/typescript.md` | **TypeScript開発規約** |
| `context/labels.md` | GitHubラベル体系 |
| `context/worktree.md` | Git Worktree運用 |
| `context/obsidian-integration.md` | **Obsidian連携詳細** |
| `context/external-deps.md` | 外部依存関係 |

### 🎯 Skills (20+個)

| スキル | 説明 |
|--------|------|
| `Skills/agent-execution/` | Agent実行スキル |
| `Skills/business-strategy-planning/` | ビジネス戦略立案 |
| `Skills/content-marketing-strategy/` | コンテンツマーケティング |
| `Skills/debugging-troubleshooting/` | デバッグ・トラブルシュート |
| `Skills/documentation-generation/` | ドキュメント生成 |
| `Skills/git-workflow/` | Git ワークフロー |
| `Skills/issue-analysis/` | Issue分析 |
| `Skills/market-research-analysis/` | 市場調査分析 |
| ... | 他12個のスキル |

### 🔧 Configuration

| ファイル | 説明 |
|---------|------|
| `mcp.json` | **MCP設定** (要Termux最適化) |
| `settings.json` | 開発環境設定 |
| `orchestra-config.yaml` | オーケストラ設定 |
| `hooks.json` | フック設定 |

### 📁 Other Directories

| ディレクトリ | 説明 |
|-------------|------|
| `commands/` | カスタムコマンド |
| `hooks/` | Git/開発フック |
| `prompts/` | プロンプトテンプレート |
| `templates/` | 各種テンプレート |
| `workflows/` | ワークフロー定義 |
| `scripts/` | 開発スクリプト |
| `docs/` | ドキュメント |
| `projects/` | プロジェクト固有設定 |
| `systems/` | システム設定 |
| `tasks/` | タスク定義 |

---

## 🔌 MCP Servers (24個)

### Gemini 3 (2個)
- `gemini3-uiux-designer` - UI/UX設計レビュー
- `gemini3-adaptive-runtime` - 適応的ランタイム

### Lark (3個)
- `lark-openapi-enhanced` - Lark API統合
- `lark-wiki-agents` - Lark Wiki
- `lark-mcp-enhanced` - 拡張Lark

### Miyabi Core (13個)
- `miyabi-obsidian` - Obsidian操作
- `miyabi-github` - GitHub操作
- `miyabi-tmux` - tmux管理
- `miyabi-file-access` - ファイル操作
- `miyabi-file-watcher` - ファイル監視
- `miyabi-git-inspector` - Git検査
- `miyabi-log-aggregator` - ログ集約
- `miyabi-network-inspector` - ネットワーク監視
- `miyabi-process-inspector` - プロセス監視
- `miyabi-resource-monitor` - リソース監視
- `miyabi-rules` - ルールエンジン
- `miyabi-sse-gateway` - SSEゲートウェイ
- `miyabi-mcp` - メインMCP

### AI Integration (3個)
- `miyabi-codex` - Codex統合
- `miyabi-openai-assistant` - OpenAI
- `miyabi-commercial-agents` - 商用Agent

### Dev Tools (3個)
- `context-engineering` - コンテキストエンジニアリング
- `miyabi-claude-code` - Claude Code統合
- `miyabi-pixel-mcp` - Pixel専用MCP

---

## 🎯 タスク別リファレンス

### Issue管理

**Issue確認**:
```bash
# MCP経由
mcp-github list_issues

# MUGEN経由
ssh mugen -t "cd miyabi-private && gh issue list"
```

**Issue作成**:
```bash
mcp-github create_issue "タイトル" "本文"
```

**Issueに取り組む**:
```bash
mi 123    # MUGEN接続してIssue #123開始
```

### コード編集

**軽微な編集 (Pixel)**:
```bash
nano <file>
vim <file>
```

**大規模編集 (MUGEN)**:
```bash
c     # Claude Code起動
```

**高性能環境 (MAJIN)**:
```bash
jcc   # MAJIN CPU + Claude Code
jgc   # MAJIN GPU + Claude Code
```

### ビルド & テスト

**全てMUGENで実行**:
```bash
mb      # build
mbt     # test
mbc     # clippy
mbr     # build --release
```

### Git操作

**ステータス確認**:
```bash
mgit    # または mgs
```

**履歴**:
```bash
mgl     # log (直近10件)
```

**差分**:
```bash
mgd     # diff
```

**同期**:
```bash
mgp     # pull
mgpu    # push
```

### ドキュメント

**Obsidian**:
```bash
# MCP経由
mcp-obsidian create_note "タイトル" "内容"
mcp-obsidian search "キーワード"

# Vault位置
~/storage/shared/Obsidian/MiyabiVault/
```

**音声メモ**:
```bash
mvn     # 音声ノート (voice-notes.txt)
vn      # タイムスタンプ付きボイスノート
```

### ファイル同期

**MUGENから取得**:
```bash
msync   # miyabi-sync-from-mac
```

**MUGENへ送信**:
```bash
mpush   # miyabi-sync-to-mac
```

---

## 🔍 よくある質問

### Q: どのファイルを読めば良い?

**初めての場合**:
1. `../CLAUDE.md` - 全体像把握
2. `context/architecture.md` - アーキテクチャ理解
3. `context/development.md` - 開発規約確認

**Agent開発する場合**:
1. `agents/AGENT_CHARACTERS.md` - キャラクター理解
2. `agents/specs/<agent名>/` - 仕様書確認
3. `context/agents.md` - Agent概要

**Rust開発する場合**:
1. `context/rust.md` - Rust規約
2. `context/development.md` - 一般開発規約
3. `context/worktree.md` - Worktree運用

**Obsidian連携する場合**:
1. `context/obsidian-integration.md` - **最重要**
2. Vault位置確認: `~/storage/shared/Obsidian/MiyabiVault/`

### Q: MCPツールが動かない

**確認項目**:
```bash
# Node.js確認
which node && node --version

# MCP servers確認
ls -la ~/Dev/miyabi-private/mcp-servers/

# 環境変数確認
echo $MIYABI_MCP

# Termux再起動
exit  # 再度開く
```

### Q: MUGEN/MAJINに接続できない

**確認**:
```bash
# SSH設定
cat ~/.ssh/config | grep -A 5 "mugen\|majin"

# 接続テスト
ssh mugen echo "OK"
ssh majin echo "OK"

# 鍵権限
chmod 600 ~/.ssh/id_ed25519
```

### Q: Obsidianで見えない

**原因**: パスが間違っている

**正解**:
```bash
~/storage/shared/Obsidian/MiyabiVault/
```

**不正解**:
```bash
~/Obsidian/MIYABI/  # ←Git管理用、アプリ非対応
```

---

## 📊 環境変数 (自動ロード済み)

```bash
# プロジェクト
$MIYABI_ROOT          # ~/Dev/miyabi-private
$MIYABI_MCP           # MCP servers dir
$MIYABI_SCRIPTS       # scripts dir
$MIYABI_DOCS          # docs dir
$MIYABI_CRATES        # crates dir

# Obsidian
$OBSIDIAN_VAULT       # ~/storage/shared/Obsidian/MiyabiVault

# API Keys
$GEMINI_API_KEY       # Gemini API
$GEMINI_MODEL         # gemini-2.0-flash-thinking-exp-01-21
$LARK_APP_ID          # Lark App ID
$LARK_APP_SECRET      # Lark Secret
$XAI_API_KEY          # Grok API
$GITHUB_TOKEN         # GitHub
$GITHUB_OWNER         # customer-cloud
$GITHUB_REPO          # miyabi-private
$AWS_ACCESS_KEY_ID    # AWS
$AWS_SECRET_ACCESS_KEY
$AWS_DEFAULT_REGION   # us-east-2
$AWS_ACCOUNT_ID       # 112530848482
```

---

## 🎬 開発体制

| マシン | 役割 | 主な用途 |
|--------|------|---------|
| **Pixel (MAESTRO)** | 指揮官 | Issue管理、ドキュメント、音声入力 |
| **MUGEN (ORCHESTRATOR)** | 開発環境 | コーディング、ビルド、テスト |
| **MAJIN (COORDINATOR)** | 並列処理 | 高負荷処理、GPU処理、並列実行 |

---

**詳細**: `../CLAUDE.md` を参照
**更新**: 機能追加時または環境変更時
**管理**: Claude Code on Pixel
