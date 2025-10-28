# Lark Agent CLI 使用ガイド

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Author**: Miyabi Development Team

## 📑 目次

- [概要](#概要)
- [インストール](#インストール)
- [環境設定](#環境設定)
- [基本コマンド](#基本コマンド)
- [Wiki操作](#wiki操作)
- [Base構築 (C1-C10)](#base構築-c1-c10)
- [Interactive REPL](#interactive-repl)
- [実践例](#実践例)
- [トラブルシューティング](#トラブルシューティング)

---

## 概要

Lark Agent CLIは、識学理論に基づくLark/Feishu Base統合管理システムを構築するための専門ツールです。

### 主な機能

- **Wiki操作**: ノード作成・取得・一覧表示
- **Base構築**: C1-C10コマンドスタックによる段階的システム構築
- **Interactive REPL**: 対話型インターフェース
- **MCP統合**: 17のLark OpenAPI MCP tools統合

---

## インストール

### 前提条件

- Rust 2021 Edition
- Lark App認証情報 (App ID & App Secret)
- Node.js 18+ (MCP Server用)

### ビルド

```bash
cd /path/to/miyabi-private
cargo build --release --bin miyabi
```

### パスに追加

```bash
export PATH="$PATH:/path/to/miyabi-private/target/release"
```

---

## 環境設定

### 必須環境変数

```bash
# Lark App認証情報
export LARK_APP_ID="cli_xxxxxxxxx"
export LARK_APP_SECRET="xxxxxxxxxxxxxxxxx"

# Wiki Space ID (任意)
export WIKI_SPACE_ID="7324483648537755682"
export ROOT_NODE_TOKEN="K7xUwSKH0i3fPekyD9ojSsCLpna"
```

### 設定確認

```bash
miyabi lark --help
```

---

## 基本コマンド

### コマンド一覧

```bash
miyabi lark <SUBCOMMAND>

Subcommands:
  wiki-create    Create a new Wiki node
  wiki-get       Get Wiki node information
  wiki-list      List Wiki nodes
  base           Execute C1-C10 command stack
  agent          Interactive Lark Agent REPL
```

### ヘルプ表示

```bash
miyabi lark --help
miyabi lark wiki-create --help
miyabi lark base --help
```

---

## Wiki操作

### Wiki ノード作成

```bash
miyabi lark wiki-create \
  --space-id 7324483648537755682 \
  --parent-node-token K7xUwSKH0i3fPekyD9ojSsCLpna \
  "新規ドキュメント"
```

**出力例**:
```
🚀 Creating Wiki node...
✅ Wiki node created successfully!

Node Information:
{
  "node": {
    "node_token": "C1qRwOdyUi5azFkOFfGj9Q5opvb",
    "title": "新規ドキュメント",
    "obj_type": "docx"
  }
}
```

### Wiki ノード取得

```bash
miyabi lark wiki-get \
  --space-id 7324483648537755682 \
  C1qRwOdyUi5azFkOFfGj9Q5opvb
```

### Wiki ノード一覧

```bash
miyabi lark wiki-list --space-id 7324483648537755682
```

---

## Base構築 (C1-C10)

### 10コマンドスタック

| Command | Name | Purpose |
|---------|------|---------|
| **C1** | System Analysis | システム要件分析 |
| **C2** | Field Implementation | フィールド詳細設計 |
| **C3** | Relation Setup | 双方向リンク設定 |
| **C4** | Workflow Automation | ワークフロー構築 |
| **C5** | Button Implementation | アクションボタン設定 |
| **C6** | View Creation | ビュー作成 |
| **C7** | Dashboard Construction | ダッシュボード構築 |
| **C8** | Permission Setup | 権限設定 |
| **C9** | Test & Verification | 動作確認 |
| **C10** | Deployment | 本番展開 |

### 単一コマンド実行

```bash
# C1: System Analysis
miyabi lark base C1 \
  --industry "SaaS" \
  --domain "営業管理"
```

**出力例**:
```
🚀 Executing Lark Base Command: C1

  🏢 Industry: SaaS
  💼 Domain: 営業管理

📊 C1: System Analysis
システム要件を分析し、Lark Baseの構造に落とし込む

Tasks:
  T1: 要件定義
  T2: データ構造設計

Context:
  Industry: SaaS
  Domain: 営業管理

Deliverables:
  - [ ] 要件定義書
  - [ ] ER図
  - [ ] テーブル設計書
  - [ ] フィールド設計書

Checklist:
  - [ ] 全ての業務要件が網羅されているか
  - [ ] テーブル間の関係が明確か
  - [ ] 主キー設計が適切か（識別性・可視性）
  - [ ] ステークホルダーの承認を得たか

✅ C1 completed
```

### フルスタック実行

```bash
# C1→C10を順次実行
miyabi lark base ALL \
  --industry "SaaS" \
  --domain "営業管理"
```

### 特定範囲実行

```bash
# Phase 1のみ (C1-C3)
miyabi lark base C1 --industry "SaaS"
miyabi lark base C2
miyabi lark base C3
```

---

## Interactive REPL

### REPL起動

```bash
miyabi lark agent
```

### REPL画面

```
🤖 Lark Agent REPL
識学理論ベースのLark Base統合管理システム構築

📚 Loading Lark Agent context...
✅ Context loaded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Lark Agent Interactive REPL
  識学理論ベースのLark Base統合管理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commands:
  C1  - Execute C1 (System Analysis)
  C2  - Execute C2 (Field Implementation)
  ...  - ... (C3-C10)
  ALL  - Execute all commands C1→C10
  help - Show available commands
  context - Show loaded context info
  clear - Clear screen
  exit - Exit REPL

Natural Language:
  You can also type natural language requests!
  Example: "Analyze the requirements for a CRM system"

lark> _
```

### REPL コマンド

#### C1-C10実行

```bash
lark> C1
lark> C7
lark> ALL
```

#### ヘルプ表示

```bash
lark> help

Available Commands:

C1-C10 Commands:
  C1 - System Analysis
  C2 - Field Implementation
  ...
```

#### コンテキスト情報

```bash
lark> context

Loaded Context Information:
  Context size: 42004 bytes
  Documents loaded:
    ✅ Agent Spec
    ✅ Agent Prompt
    ✅ Base Construction Framework
```

#### 画面クリア

```bash
lark> clear
```

#### 終了

```bash
lark> exit
```

### 自然言語入力 (基本)

```bash
lark> Analyze the requirements for a CRM system

🤔 Processing natural language request...
💡 Tip: Direct commands are faster (e.g., 'C1', 'C7', 'ALL')

Suggested Commands:
  → Try: C1

⚠️  LLM integration coming in future update
```

---

## 実践例

### 例1: CRMシステム構築

```bash
# Step 1: System Analysis
miyabi lark base C1 \
  --industry "SaaS" \
  --domain "CRM"

# Step 2: Field Implementation
miyabi lark base C2

# Step 3: Relation Setup
miyabi lark base C3

# Step 4-10: 残りのフェーズ
miyabi lark base C4
...
miyabi lark base C10
```

### 例2: REPLでの対話的実行

```bash
$ miyabi lark agent

lark> C1
# C1実行

lark> C2
# C2実行

lark> help
# ヘルプ表示

lark> ALL
# C1-C10全実行

lark> exit
```

### 例3: 環境変数を使った簡易実行

```bash
# .envファイル設定
export LARK_APP_ID="cli_xxxxxxxxx"
export LARK_APP_SECRET="xxxxxxxxxxxxxxxxx"
export WIKI_SPACE_ID="7324483648537755682"
export ROOT_NODE_TOKEN="K7xUwSKH0i3fPekyD9ojSsCLpna"

# 簡易実行
miyabi lark wiki-create \
  --space-id $WIKI_SPACE_ID \
  --parent-node-token $ROOT_NODE_TOKEN \
  "Test Document"
```

---

## トラブルシューティング

### エラー: LARK_APP_ID not set

```bash
Error: Invalid input: LARK_APP_ID environment variable not set
Set it with: export LARK_APP_ID=cli_xxx
```

**解決方法**:
```bash
export LARK_APP_ID="cli_xxxxxxxxx"
export LARK_APP_SECRET="xxxxxxxxxxxxxxxxx"
```

### エラー: MCP server timeout

```bash
Error: MCP timeout: MCP server timed out after 30s
Tool: wiki_v2_spaceNode_create
This may indicate a network issue or the MCP server is stuck.
```

**解決方法**:
1. ネットワーク接続確認
2. MCPサーバーの再起動
3. タイムアウト値の調整

### エラー: Invalid command

```bash
Error: Invalid input: Invalid command: C99. Valid commands: C1-C10, ALL
```

**解決方法**:
- C1-C10のいずれかを指定
- またはALLを指定

### エラー: Context files not found

```bash
Error: Failed to read spec file: No such file or directory
```

**解決方法**:
```bash
# プロジェクトルートから実行
cd /path/to/miyabi-private
miyabi lark agent
```

### デバッグモード

```bash
# Verbose output
miyabi --verbose lark base C1

# JSON output (for debugging)
miyabi --json lark base C1
```

---

## 高度な使い方

### 識学理論準拠チェック

各コマンドは識学理論の5原則に基づいています:

#### C2: フィールド実装
```
Critical: 主キーフィールドは最左端に配置
```

#### C3: リレーション設定
```
Critical: リレーション設定直後に可視性チェック（T0）を実行
```

### カスタムワークフロー

```bash
# Phase 1のみ実行
miyabi lark base C1 --industry "SaaS"
miyabi lark base C2
miyabi lark base C3

# Phase 2-3をスキップしてPhase 4
miyabi lark base C8
miyabi lark base C9
miyabi lark base C10
```

---

## リファレンス

### 関連ドキュメント

- [Lark Agent README](.claude/agents/lark/README.md)
- [Base Construction Framework](.claude/agents/lark/base-construction-framework.md)
- [Agent Spec](.claude/agents/specs/lark/lark-agent.md)

### 外部リンク

- [Lark Open Platform](https://open.larksuite.com/)
- [Lark Base API Documentation](https://open.larksuite.com/document/server-docs/docs/bitable-v1/bitable-overview)
- [識学理論公式サイト](https://www.shikigaku.jp/)

---

**🤖 Generated with Claude Code**
**Version**: 1.0.0
**Maintainer**: Miyabi Development Team
