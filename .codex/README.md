# .claude/ - Claude Code プロジェクト設定

このディレクトリには、Autonomous Operations プロジェクトで Claude Code による開発を最適化するための設定ファイルとツールが含まれています。

## 🚀 クイックスタート

**初めての方はこちら**: [QUICK_START.md](QUICK_START.md) - 3分で始めるMiyabi

**トラブル時は**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - よくある問題と解決策

## 🤖 モデルプロファイルと切り替え

Claude Code を利用する場面でも、Codex CLI 同様に gpt-5 系モデルへ切り替え可能です。タスク特性に応じて以下を目安に `codex -m <model-name>` または `.claude/settings.local.json` の `model` フィールドを更新してください。

- **gpt-5-codex-low**: 低レイテンシ・低コスト重視。短いコード修正、差分レビュー、Lint 対応など即応タスクで Claude Sonnet 4 の代替として利用。  
  `codex -m gpt-5-codex-low`
- **gpt-5-codex-medium**: 推論力とコストのバランス型。複数ファイルを跨ぐリファクタリングや Issue/PR 下書きなど日常開発の標準モデル。  
  `codex -m gpt-5-codex-medium`
- **gpt-5-codex-high**: 長大なコードベース解析や高度推論が必要な設計レビュー、性能チューニング検討時に使用。  
  `codex -m gpt-5-codex-high`
- **gpt-5-base**: ビジネス要件整理、ロードマップ策定、ドキュメント生成など自然言語中心の推論タスクに最適。  
  `codex -m gpt-5-base`
- **gpt-5-longcontext**: 膨大な議事録・設計資料を通読し、依存関係確認や意思決定履歴のトレースを行う際に選択。  
  `codex -m gpt-5-longcontext`

> 運用Tips: モデル切り替え後は `.claude/settings.local.json` でも同じモデル名に揃えることで、Claude Code 起動時に自動適用されます。

## 📁 ディレクトリ構造

```
.claude/
├── README.md                    # このファイル
├── QUICK_START.md              # 🚀 3分で始めるMiyabi（初心者向け）
├── TROUBLESHOOTING.md          # 🔧 トラブルシューティングガイド
├── settings.example.json        # 設定テンプレート
├── settings.local.json          # ローカル設定（Git管理外）
│
├── agents/                      # Agent定義（21個）
│   ├── README.md                # Agent体系説明
│   ├── specs/                   # Agent仕様書
│   │   ├── coding/             # コーディング系（7個）
│   │   └── business/           # ビジネス系（14個）
│   └── prompts/                 # Worktree実行プロンプト
│       ├── coding/             # コーディング系（6個）
│       └── business/           # ビジネス系（将来追加）
│
├── commands/                    # カスタムスラッシュコマンド（9個）
│   ├── test.md                  # /test - テスト実行
│   ├── agent-run.md             # /agent-run - Agent実行
│   ├── deploy.md                # /deploy - デプロイ
│   ├── verify.md                # /verify - 動作確認
│   ├── create-issue.md          # /create-issue - Issue作成
│   ├── generate-docs.md         # /generate-docs - ドキュメント生成
│   ├── miyabi-auto.md           # /miyabi-auto - Miyabi自動実行
│   ├── miyabi-todos.md          # /miyabi-todos - TODO検出
│   └── security-scan.md         # /security-scan - セキュリティスキャン
│
├── hooks/                       # Claude Hooks（4個）
│   ├── auto-format.sh           # 自動フォーマット（ESLint/Prettier）
│   ├── validate-typescript.sh   # TypeScript検証（型チェック）
│   ├── log-commands.sh          # コマンドログ（LDD準拠）
│   └── agent-event.sh           # Agentイベント送信
│
├── mcp-servers/                 # MCP Server実装（5個）
│   ├── ide-integration.js       # VS Code/Jupyter統合
│   ├── github-enhanced.js       # GitHub Issue/PR管理
│   ├── project-context.js       # プロジェクトコンテキスト
│   ├── miyabi-integration.js    # Miyabi CLI統合
│   └── discord-integration.js   # Discord統合
│
└── prompts/                     # プロトコル文書（2個）
    ├── task-management-protocol.md # Todo管理プロトコル
    └── worktree-agent-execution.md # Worktree実行プロンプト
```

## 🤖 Agent定義

### 階層構造

```
Human Layer (戦略・承認)
    ├── TechLead
    ├── PO
    └── CISO
        ↓ Escalation
Coordinator Layer
    └── CoordinatorAgent (タスク分解・並行実行制御)
        ↓ Assignment
Specialist Layer
    ├── CodeGenAgent (AI駆動コード生成)
    ├── ReviewAgent (品質評価・80点基準)
    ├── IssueAgent (Issue分析・Label付与)
    ├── PRAgent (PR自動作成)
    └── DeploymentAgent (CI/CD・Firebase)
```

### Agent実行権限

| Agent | 権限 | エスカレーション先 |
|-------|------|------------------|
| CoordinatorAgent | 🟢 オーケストレーション | TechLead (循環依存時) |
| CodeGenAgent | 🔵 コード生成 | TechLead (アーキテクチャ問題) |
| ReviewAgent | 🟡 品質判定 | CISO (セキュリティ) |
| IssueAgent | 🟢 分析・Label | PO (ビジネス判断) |
| PRAgent | 🔵 PR作成 | TechLead (権限エラー) |
| DeploymentAgent | 🔴 本番デプロイ | CTO (本番環境) |

## 🎯 カスタムコマンド

### /test
プロジェクト全体のテストを実行します。

```bash
cargo check        # Rust型チェック
cargo test --all   # 全テストスイート実行
cargo clippy       # Linterチェック
```

### /agent-run
Autonomous Agent を実行します。

```bash
# 単一Issue処理
miyabi agent run coordinator --issue 123
# または
cargo run --bin miyabi -- agent run coordinator --issue 123

# 複数Issue並行処理（Worktreeベース）
miyabi agent run coordinator --issues 123,124,125 --concurrency 3

# Dry run
miyabi agent run coordinator --issue 123 --dry-run
```

### /deploy
デプロイメントを実行します。

```bash
# Staging環境へデプロイ
miyabi deploy staging
# または
cargo run --bin miyabi -- deploy staging

# Production環境へデプロイ（CTOエスカレーション）
miyabi deploy production
```

### /verify
システム動作確認を実行します。

```bash
cargo check        # 型チェック
cargo test --all   # テスト実行
cargo clippy       # Linterチェック
miyabi --help      # CLIヘルプ表示
```

## 🔌 MCP Servers

Agentic OSは5つのMCPサーバーを統合し、Claude Codeの機能を拡張しています。

### 設定ファイル
`.claude/mcp.json` に全MCPサーバーが定義されています。

### 利用可能なMCPサーバー

| MCP Server | 機能 | 提供ツール |
|------------|------|-----------|
| **IDE Integration** | VS Code診断、Jupyter実行 | `mcp__ide__getDiagnostics`, `mcp__ide__executeCode` |
| **GitHub Enhanced** | Issue/PR管理 | Issue操作、PR作成、Projects V2統合 |
| **Project Context** | 依存関係情報 | package.json解析、依存グラフ |
| **Filesystem** | ファイルアクセス | ファイル読み書き、検索 |
| **Context Engineering** | AIコンテキスト分析・最適化 | セマンティック検索、コンテキスト最適化、品質分析 |

### Context Engineering MCP の特徴

**目的**: コンテキストが不足している時の情報探索ツール

**主要機能**:
- 🧪 **AI駆動分析**: セマンティック一貫性、情報密度、明瞭度スコアリング
- ⚡ **インテリジェント最適化**: トークン効率52%向上、応答速度2倍
- 📋 **セマンティック検索**: Gemini AI搭載のコンテキスト検索
- 🎯 **品質評価**: コンテキスト品質スコア (0-100)

**利用可能なツール**:
- `search_guides_with_gemini` - セマンティック検索
- `analyze_guide` - ガイド分析
- `analyze_guide_url` - 外部コンテンツ分析
- `compare_guides` - 複数ガイド比較

**使用例**:
```
"Geminiを使ってAIエージェントに関するガイドを検索"
"OpenAI GPTベストプラクティスガイドを分析"
"OpenAIとGoogleのAIガイドを比較"
```

**APIサーバー**:
Context Engineering MCPは `http://localhost:8888` で動作するAPIサーバーと連携します。

```bash
# APIサーバー起動
cd external/context-engineering-mcp
uvicorn main:app --port 8888
```

### MCPサーバーの有効化/無効化

`.claude/mcp.json` の `disabled` フラグで制御:

```json
{
  "mcpServers": {
    "context-engineering": {
      "disabled": false  // true で無効化
    }
  }
}
```

## 🪝 Hooks設定

### auto-format.sh ✅
コミット前に自動フォーマット実行（Rust）
- cargo fmtによるコードフォーマット
- cargo clippyによるコード検査
- Git pre-commitフックとして使用可能

### validate-rust.sh ✅
Rust型チェック（strictモード準拠）
- cargo checkによる型チェック
- コンパイルエラー検出
- 型エラーがある場合はコミット中断
- Git pre-commitフックとして使用可能

### log-commands.sh ✅
すべてのコマンドを`.ai/logs/`に記録（LDD準拠）
- 日次ログファイル生成
- タイムスタンプ付きコマンド記録
- codex_prompt_chain形式対応

### agent-event.sh ✅
Agent実行イベントをMiyabi Dashboardに送信
- リアルタイムAgent状態監視
- 4種類のイベント（started/progress/completed/error）
- WebSocket/REST API連携

## 📊 品質基準

### Review基準（80点以上合格）

```rust
// 品質スコア計算
// 基準点: 100点
// - Clippyエラー: -20点/件
// - コンパイルエラー: -30点/件
// - Critical脆弱性: -40点/件
// 合格ライン: 80点以上
```

### エスカレーション基準

| 問題種別 | エスカレーション先 | 重要度 |
|---------|------------------|--------|
| アーキテクチャ問題 | TechLead | Sev.2-High |
| セキュリティ脆弱性 | CISO | Sev.1-Critical |
| ビジネス優先度 | PO | Sev.3-Medium |
| 本番デプロイ | CTO | Sev.1-Critical |

## 🚀 使い方

### 1. 初期設定

```bash
# 設定ファイルコピー
cp .claude/settings.example.json .claude/settings.local.json

# 環境変数設定
cp .env.example .env
vim .env  # API keys設定
```

### 2. カスタムコマンド実行

```bash
# Claude Code内で実行
/test          # テスト実行
/agent-run     # Agent実行
/verify        # 動作確認
/deploy        # デプロイ
```

### 3. フック有効化

```bash
cd .claude/hooks
chmod +x *.sh

# Gitフックとして登録（オプション）
# Option 1: 自動フォーマットのみ
ln -s ../../.claude/hooks/auto-format.sh .git/hooks/pre-commit

# Option 2: Rust検証のみ
ln -s ../../.claude/hooks/validate-rust.sh .git/hooks/pre-commit

# Option 3: 両方実行（カスタムスクリプト作成）
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
.claude/hooks/auto-format.sh
.claude/hooks/validate-rust.sh
EOF
chmod +x .git/hooks/pre-commit
```

## 📊 PlantUML図

プロジェクトのアーキテクチャ図は **[docs/diagrams/](../docs/diagrams/)** に統合されています。

**利用可能な図（12図）**:
- Entity-Relation Model（完全版・簡易版）
- Agent Workflow（21 Agents）
- Label System（53ラベル）
- .claude/ディレクトリ構造図
- MCP統合アーキテクチャ図
- その他システム図（7図）

詳細は [docs/diagrams/README.md](../docs/diagrams/README.md) を参照してください。

## 📚 関連ドキュメント

### 🚀 入門ガイド
- **[QUICK_START.md](QUICK_START.md)** - 3分で始めるMiyabi（初心者向け） ⭐⭐⭐
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - よくある問題と解決策 ⭐⭐⭐

### 📖 詳細ドキュメント
- [README.md](../README.md) - プロジェクト概要
- [docs/diagrams/README.md](../docs/diagrams/README.md) - PlantUML図一覧
- [docs/AGENT_OPERATIONS_MANUAL.md](../docs/AGENT_OPERATIONS_MANUAL.md) - 完全運用マニュアル
- [docs/ENTITY_RELATION_MODEL.md](../docs/ENTITY_RELATION_MODEL.md) - Entity-Relationモデル
- [docs/LABEL_SYSTEM_GUIDE.md](../docs/LABEL_SYSTEM_GUIDE.md) - 53ラベル体系ガイド
- [DEPLOYMENT.md](../DEPLOYMENT.md) - デプロイガイド
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 貢献ガイド

## 🔐 セキュリティ

**重要**: `settings.local.json` は機密情報を含むため `.gitignore` で除外されています。

### 推奨設定

```json
{
  "projectContext": "Miyabi - Autonomous Operations Platform",
  "workingDirectory": "/Users/a003/dev/miyabi-private",
  "preferredStyle": {
    "rust": "2021-edition",
    "commitMessage": "conventional-japanese"
  },
  "hooks": {
    "userPromptSubmit": ".claude/hooks/log-commands.sh"
  }
}
```

## 📊 統計

- **Agents**: 21種類（Coding: 7, Business: 14）
- **Commands**: 9個
- **Hooks**: 4個
- **MCP Servers**: 5個
- **PlantUML Diagrams**: 12図（docs/diagrams/に統合）
- **Total Code**: 20,437行
- **Test Coverage**: 6/6 passing

---

**最終更新**: 2025-10-12
**統合完了**: 2025-10-12 - `.claude/diagrams/`を`docs/diagrams/`へ統合
**管理**: Claude Code Autonomous System

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
