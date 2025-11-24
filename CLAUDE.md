# Miyabi - Pixel/Termux Development Manual

**Version**: 5.0-Pixel
**Last Updated**: 2025-11-19
**Environment**: Termux on Pixel 9 Pro XL
**Format**: Mobile-First Agent Instruction Manual

---

## 🎯 Executive Summary

**WHO**: Pixel上でMiyabi開発を行うモバイル開発環境のAgent
**WHAT**: 自律型AI開発フレームワークのモバイル開発拠点
**HOW**: MCP Tools + Termux + Remote (MUGEN/MAJIN) 連携

**Core Identity**:
- 📱 Pixel Termux環境での開発
- 🔌 24個のMCPサーバーを活用
- 🌉 MacBook (MUGEN) / EC2 (MAJIN) との連携
- 🚀 モバイルファーストな開発体験

---

## 📱 Pixel/Termux 環境情報

### システム構成

**デバイス**: Pixel 9 Pro XL (Android)
**ターミナル**: Termux
**プロジェクトルート**: `~/Dev/miyabi-private`
**Obsidian Vault**: `~/storage/shared/Obsidian/MiyabiVault/`

### 初期化

Termux起動時に自動実行される初期化:
```bash
# ~/.miyabi_init.sh が自動ロード
# - 24個の環境変数
# - 30+個のエイリアス
# - MCP設定
# - 自動的に ~/Dev/miyabi-private へ移動
```

---

## 🔌 MCP First Approach (P0)

**原則**: 全タスク実行前に、まずMCPの活用可能性を検討する

### 利用可能なMCPサーバー (24個)

#### 1. Gemini 3 Series (2個)
- `gemini3-uiux-designer` - UI/UX設計レビュー (Jonathan Ive哲学)
- `gemini3-adaptive-runtime` - 適応的ランタイム

#### 2. Lark Integration (3個)
- `lark-openapi-enhanced` - Larkメッセージ・ドキュメント操作
- `lark-wiki-agents` - Lark Wiki操作
- `lark-mcp-enhanced` - 拡張Lark機能

#### 3. Miyabi Core Tools (13個)
- `miyabi-obsidian` - Obsidian Vault操作
- `miyabi-github` - GitHub操作 (Issue/PR/Workflow)
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
- `miyabi-mcp` - メインMCPサーバー

#### 4. AI Integration (3個)
- `miyabi-codex` - Codex統合
- `miyabi-openai-assistant` - OpenAI Assistant
- `miyabi-commercial-agents` - 商用Agent群

#### 5. Development Tools (3個)
- `context-engineering` - コンテキストエンジニアリング
- `miyabi-claude-code` - Claude Code統合
- `miyabi-pixel-mcp` - Pixel専用MCPサーバー

### MCP呼び出し方法

**Python Client**:
```bash
python3 ~/mcp-call.py <server-name> <method> [params]

# 例: ツールリスト取得
python3 ~/mcp-call.py gemini3-uiux-designer tools/list

# 例: ツール実行
python3 ~/mcp-call.py lark-openapi-enhanced tools/call '{"name":"send_message",...}'
```

**Bash Client**:
```bash
mcp-tool <server-name> <tool-name> [args-json]
```

**Alias使用**:
```bash
mcp-gemini <args>     # Gemini 3呼び出し
mcp-lark <args>       # Lark操作
mcp-obsidian <args>   # Obsidian操作
mcp-github <args>     # GitHub操作
mcp-tools             # 全MCPサーバーリスト表示
```

---

## 🌉 リモート連携 (MUGEN/MAJIN)

### MacBook MUGEN (無限)

**用途**: メイン開発環境・ビルド・テスト実行

**接続**:
```bash
mugen           # SSH接続
c               # Claude Code起動
cc              # Claude Code + tmux
cm              # mosh接続
```

**ファイル同期**:
```bash
msync           # MacBookから同期 (pull)
mpush           # MacBookへ同期 (push)
```

**Git操作**:
```bash
mg              # Git status
mgl             # Git log
mgd             # Git diff
mgp             # Git pull
```

**ビルド & テスト**:
```bash
mb              # Cargo build
mbt             # Cargo test
mbc             # Cargo clippy
mbr             # Cargo build --release
```

### EC2 MAJIN (魔人)

**用途**: 高負荷処理・並列実行・GPU処理

**接続**:
```bash
j               # CPU Server (128GB RAM)
jc              # CPU (明示的)
jg              # GPU Server
jt              # tmux付きCPU接続
jgt             # tmux付きGPU接続
jcc             # Claude Code on CPU
jgc             # Claude Code on GPU
```

**ファイル転送**:
```bash
jup <file>      # アップロード
jdown <file>    # ダウンロード
```

---

## 📂 プロジェクト構造 (.claude ディレクトリ)

```
~/Dev/miyabi-private/.claude/
├── CLAUDE.md                    # このファイル (マスターマニュアル)
├── INDEX.md                     # クイックリファレンス
├── README.md                    # .claudeディレクトリ説明
│
├── agents/                      # Agent仕様・設定
│   ├── AGENT_CHARACTERS.md      # Agentキャラクター定義
│   ├── specs/                   # Agent仕様書
│   ├── prompts/                 # Agentプロンプト
│   ├── triggers.json            # Agentトリガー設定
│   └── agent-name-mapping.json  # Agent名マッピング
│
├── context/                     # コンテキスト管理
│   ├── INDEX.md                 # コンテキスト索引
│   ├── agents.md                # Agent情報
│   ├── architecture.md          # アーキテクチャ
│   ├── development.md           # 開発ガイドライン
│   ├── protocols.md             # 通信プロトコル
│   ├── rust.md                  # Rust開発規約
│   ├── typescript.md            # TypeScript開発規約
│   ├── labels.md                # GitHubラベル体系
│   ├── worktree.md              # Git Worktree運用
│   ├── obsidian-integration.md  # Obsidian連携
│   └── external-deps.md         # 外部依存関係
│
├── Skills/                      # スキルセット (20+個)
│   ├── agent-execution/         # Agent実行スキル
│   ├── business-strategy-planning/
│   ├── content-marketing-strategy/
│   ├── debugging-troubleshooting/
│   ├── documentation-generation/
│   ├── git-workflow/
│   ├── issue-analysis/
│   └── ...
│
├── commands/                    # カスタムコマンド
├── hooks/                       # Git/開発フック
├── prompts/                     # プロンプトテンプレート
├── templates/                   # 各種テンプレート
├── workflows/                   # ワークフロー定義
├── scripts/                     # 開発スクリプト
│
├── mcp.json                     # MCP設定 (Termux用に最適化必要)
├── mcp-servers/                 # MCPサーバー定義
├── settings.json                # 開発設定
└── orchestra-config.yaml        # オーケストラ設定
```

---

## 🚀 開発ワークフロー (Pixel特化)

### 1. Issueベース開発

**Issue確認**:
```bash
# MCP経由でIssue取得
mcp-github list_issues

# または、MUGENで確認
ssh mugen -t "cd miyabi-private && gh issue list"
```

**Issue取り組み開始**:
```bash
# Obsidianにメモ作成
mcp-obsidian create_note "Issue #123 - 〇〇機能実装" "..."

# MUGENで作業開始
mi 123    # Issue #123に取り組む (MUGEN接続)
```

### 2. コード編集

**Pixel上で軽微な編集**:
```bash
# Termux エディタ使用
nano <file>
vim <file>

# 確認
git diff
```

**大規模編集はMUGEN/MAJINで**:
```bash
# MUGENでClaude Code起動
c

# またはMAJINの高性能環境で
jcc
```

### 3. ビルド & テスト

**ビルドはMUGENで実行**:
```bash
# リモートビルド
mb

# テスト実行
mbt

# Clippy
mbc
```

### 4. コミット & PR

**Pixel上でコミット可能**:
```bash
# 変更確認
mgit

# コミット
git add .
git commit -m "..."

# プッシュ
git push
```

**PR作成はMCPまたはMUGEN**:
```bash
# MCP経由
mcp-github create_pr "タイトル" "説明"

# MUGENでgh cli
ssh mugen -t "cd miyabi-private && gh pr create"
```

### 5. ドキュメント更新

**Obsidian連携**:
```bash
# MCPでObsidian操作
mcp-obsidian create_note "タイトル" "内容"
mcp-obsidian update_note "既存ノート" "追記内容"
mcp-obsidian search "キーワード"
```

**注意**: Pixelの場合、Obsidian Vaultパスに注意
```bash
# 正しいパス (モバイルObsidianアプリがアクセス可能)
~/storage/shared/Obsidian/MiyabiVault/

# 間違ったパス (アプリからアクセス不可)
~/Obsidian/MIYABI/
```

---

## 🎨 音声入力 (Pixel特化機能)

Pixel/Termux環境では音声入力が使えます:

```bash
voice           # 音声入力開始
v               # 同上 (短縮版)
vc              # 音声をクリップボードへ
vn              # タイムスタンプ付きボイスノート
mvn             # Miyabiプロジェクト用ボイスノート
```

**活用例**:
```bash
# 音声でIssue作成
voice > /tmp/issue.txt
cat /tmp/issue.txt | mcp-github create_issue "$(head -1 /tmp/issue.txt)" "$(tail -n +2 /tmp/issue.txt)"

# 音声でObsidianメモ
mvn   # 音声入力 → voice-notes.txt に追記
```

---

## 📊 プロジェクトステータス確認

```bash
mstatus         # Miyabiプロジェクト全体ステータス
# - Git branch, status
# - Crates数
# - MCP servers数
# - 最終コミット

allstatus       # 全マシン (Pixel/MUGEN/MAJIN) ステータス
3status         # 同上

mcp-tools       # 利用可能なMCPサーバーリスト
```

---

## 🔧 トラブルシューティング

### MCP接続エラー

**症状**: MCPツールが応答しない

**確認**:
```bash
# MCPサーバーディレクトリ確認
ls -la ~/Dev/miyabi-private/mcp-servers/

# Node.jsインストール確認
which node
node --version

# Python確認
which python3
python3 --version
```

**再接続**:
```bash
# Termux再起動
exit  # Termuxを閉じる
# Termuxを再度開く → 自動初期化が走る
```

### MUGEN/MAJIN接続エラー

**症状**: SSH接続できない

**確認**:
```bash
# SSH設定確認
cat ~/.ssh/config | grep -A 5 "mugen\|majin"

# 接続テスト
ssh mugen echo "OK"
ssh majin echo "OK"
```

**対処**:
```bash
# SSH鍵の権限確認
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# known_hostsクリア (必要な場合)
ssh-keygen -R mugen
ssh-keygen -R majin
```

### Obsidian連携エラー

**症状**: Obsidianアプリでファイルが見えない

**原因**: Vault パスが間違っている

**正しいパス**:
```bash
~/storage/shared/Obsidian/MiyabiVault/
```

**間違ったパス** (Git管理用、アプリ非対応):
```bash
~/Obsidian/MIYABI/
```

**確認**:
```bash
# モバイルObsidianがアクセスできるパス
ls ~/storage/shared/Obsidian/MiyabiVault/

# ファイル作成テスト
echo "test" > ~/storage/shared/Obsidian/MiyabiVault/test.md

# Obsidianアプリで確認
am start -n md.obsidian/.MainActivity
```

---

## 🦀 Rust Tool Use (A2A Bridge)

A2A Bridgeを使用してRust AgentをMCP経由で呼び出すことができます。

### 概要

- **21個のAgent**がA2A Bridgeで利用可能
- **Coding Agents (7個)**: CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent
- **Business Agents (14個)**: AIEntrepreneurAgent, SelfAnalysisAgent, MarketResearchAgent, PersonaAgent, ProductConceptAgent, ProductDesignAgent, ContentCreationAgent, FunnelDesignAgent, SNSStrategyAgent, MarketingAgent, SalesAgent, CRMAgent, AnalyticsAgent, YouTubeAgent

### ツール命名規則

```
a2a.<agent_description>.<capability>
```

**例**:
- `a2a.code_generation_agent.generate_code`
- `a2a.task_coordination_and_parallel_execution_agent.orchestrate_agents`
- `a2a.market_research_and_competitive_analysis_agent.analyze_competitors`

### MCP JSON-RPC呼び出し

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "a2a.execute",
  "params": {
    "tool_name": "a2a.code_generation_agent.generate_code",
    "input": {
      "issue_number": 123,
      "context": "Fix authentication bug"
    }
  }
}
```

### Rust直接呼び出し

```rust
use miyabi_mcp_server::{A2ABridge, initialize_all_agents};
use serde_json::json;

// Bridge初期化
let bridge = A2ABridge::new().await?;
initialize_all_agents(&bridge).await?;

// ツール実行
let result = bridge.execute_tool(
    "a2a.code_generation_agent.generate_code",
    json!({
        "issue_number": 123,
        "language": "rust"
    })
).await?;
```

### Claude Code Sub-agent呼び出し

Task toolで`subagent_type`を指定:
```
- description: "コード生成"
- prompt: "Issue #123のバグを修正"
- subagent_type: "CodeGenAgent"
```

### 詳細ドキュメント

- `.claude/agents/RUST_TOOL_USE_GUIDE.md` - 完全ガイド
- `.claude/agents/agent-name-mapping.json` - Agent名とツール名の対応

---

## 📚 詳細ドキュメント

各トピックの詳細は以下を参照:

### Agent関連
- `.claude/agents/AGENT_CHARACTERS.md` - Agentキャラクター定義
- `.claude/agents/specs/` - 各Agent仕様書
- `.claude/context/agents.md` - Agent概要

### 開発規約
- `.claude/context/rust.md` - Rust開発ガイドライン
- `.claude/context/typescript.md` - TypeScript開発ガイドライン
- `.claude/context/development.md` - 一般開発規約

### アーキテクチャ
- `.claude/context/architecture.md` - システムアーキテクチャ
- `.claude/context/protocols.md` - 通信プロトコル
- `.claude/context/worktree.md` - Git Worktree運用

### ツール連携
- `.claude/context/obsidian-integration.md` - Obsidian連携詳細
- `.claude/mcp.json` - MCP設定
- `.claude/settings.json` - 開発環境設定

---

## 🎯 クイックリファレンス

### よく使うコマンド

```bash
# ナビゲーション
m               # Miyabiルートへ移動
mmcp            # MCPサーバーディレクトリへ
mdocs           # ドキュメントディレクトリへ

# ステータス確認
mstatus         # プロジェクトステータス
mgit            # Git status
mcp-tools       # MCPサーバーリスト

# リモート接続
c               # MUGEN Claude Code
j               # MAJIN CPU接続
jg              # MAJIN GPU接続

# 同期
msync           # MUGENから同期
mpush           # MUGENへ同期

# MCP操作
mcp-gemini      # Gemini 3ツール
mcp-lark        # Larkツール
mcp-obsidian    # Obsidianツール
mcp-github      # GitHubツール

# ビルド (MUGEN)
mb              # build
mbt             # test
mbc             # clippy
```

### 環境変数

全て自動ロード済み (`~/.miyabi_init.sh`):
```bash
$MIYABI_ROOT            # プロジェクトルート
$MIYABI_MCP             # MCPサーバーディレクトリ
$GEMINI_API_KEY         # Gemini API
$LARK_APP_ID            # Lark App ID
$LARK_APP_SECRET        # Lark Secret
$XAI_API_KEY            # Grok API
$GITHUB_TOKEN           # GitHub Token
$AWS_ACCESS_KEY_ID      # AWS認証情報
...
```

---

## 🌸 Miyabiプロジェクト概要

**目的**: 完全自律型AI開発オペレーションプラットフォーム

**主要コンポーネント**:
- **14個のビジネスAgent** (実装済み)
- **10個のAgent** (計画中)
- **59個のRust Crates**
- **24個のMCPサーバー**
- **Git Worktree並列実行基盤**
- **VOICEVOX統合** (音声通知)
- **3D可視化システム**

**開発体制**:
- **Pixel (MAESTRO)**: 指揮・モバイル開発
- **MacBook MUGEN (ORCHESTRATOR)**: メイン開発
- **EC2 MAJIN (COORDINATOR)**: 並列実行・高負荷処理

**GitHub as OS アーキテクチャ**:
Issue作成 → コード実装 → PR作成 → デプロイ を完全自動化

---

**最終更新**: 2025-11-22
**次回レビュー**: 機能追加時または環境変更時
**メンテナー**: Claude Code on Pixel
