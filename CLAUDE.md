# AntiGravity Miyabi Edition - Claude Development Manual

**Version**: 1.0.0
**Last Updated**: 2025-12-02
**Project**: AntiGravity Miyabi Edition
**Format**: AI Agent Instruction Manual

---

## 🎯 Executive Summary

**WHO**: AntiGravity開発を担当する自律型AIエージェント
**WHAT**: 完全自律型AI開発オペレーションプラットフォーム
**HOW**: MCP Tools + Multi-Agent Architecture + GitHub Integration

**Core Identity**:
- 🚀 Miyabi Dashboard の開発・保守
- 🤖 21 AI Autonomous Agents の統合管理
- 🔌 28 MCP Servers との連携
- ☁️ Cloud Deployment (S3/CloudFront)

---

## 📋 Priority Rules (P0-P3)

### P0 - Critical (絶対遵守)

#### P0.1 - MCP First Approach
```
全タスク実行前に、まずMCPの活用可能性を検討する
```
- 利用可能なMCPツールを確認
- 最適なツールを選択して実行
- 手動コマンドは最終手段

#### P0.2 - Git Safety Protocol
```
main/developブランチへの直接push禁止
必ずfeatureブランチ経由でPR作成
```

#### P0.3 - Context Awareness
```
作業開始前に必ず.claude/context/を確認
現在のプロジェクト状態を把握してから作業開始
```

### P1 - High Priority (強く推奨)

#### P1.1 - Issue-Driven Development
```
全ての開発作業はGitHub Issueに紐づける
Issue番号をブランチ名・コミットに含める
```

#### P1.2 - Documentation First
```
コード変更前にドキュメントを更新
READMEとCHANGELOGを最新に保つ
```

#### P1.3 - Test Coverage
```
新機能には必ずテストを追加
既存テストが通ることを確認してからPR
```

### P2 - Medium Priority (推奨)

#### P2.1 - Code Style
```
Rust: cargo fmt && cargo clippy
TypeScript: eslint && prettier
```

#### P2.2 - Commit Convention
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
```

### P3 - Low Priority (任意)

#### P3.1 - Performance Optimization
```
パフォーマンス改善は機能完成後に検討
```

---

## 🔌 MCP Servers (利用可能)

### Core Tools
| Server | Description |
|--------|-------------|
| `miyabi-mcp` | メインMCPサーバー |
| `miyabi-github` | GitHub操作 (Issue/PR/Workflow) |
| `miyabi-tmux` | tmuxセッション管理 |
| `miyabi-obsidian` | Obsidian Vault操作 |
| `miyabi-git-inspector` | Git検査・分析 |

### Development Tools
| Server | Description |
|--------|-------------|
| `miyabi-file-watcher` | ファイル監視 |
| `miyabi-log-aggregator` | ログ集約 |
| `miyabi-resource-monitor` | リソース監視 |
| `miyabi-process-inspector` | プロセス監視 |
| `miyabi-codex` | Codex統合 |

### AI Integration
| Server | Description |
|--------|-------------|
| `gemini3-uiux-designer` | UI/UXレビュー |
| `miyabi-commercial-agents` | 商用Agent群 |
| `context7` | ライブラリドキュメント取得 |

---

## 🤖 Agent Architecture

### Coding Agents (7個)
1. **Coordinator** - タスク調整・分配
2. **CodeGen** - コード生成
3. **Review** - コードレビュー
4. **PR** - プルリクエスト管理
5. **Deployment** - デプロイ自動化
6. **Issue** - Issue管理
7. **Refresher** - コンテキスト更新

### Business Agents (14個)
- Market Research, Persona, Product Concept
- Product Design, Content Creation, Funnel Design
- SNS Strategy, Marketing, Sales, CRM
- Analytics, YouTube, Self Analysis, AI Entrepreneur

---

## 📂 Project Structure

```
AntiGravity/
├── CLAUDE.md              # このファイル（エージェント指示書）
├── .claude/               # Claude設定・コンテキスト
│   ├── context/          # コンテキストモジュール
│   ├── agents/           # エージェント定義
│   └── hooks/            # フック設定
├── .miyabi/              # Miyabi設定
│   ├── config.yml        # メイン設定
│   └── agents.yml        # エージェント設定
├── crates/               # Rustクレート
├── mcp-servers/          # MCPサーバー群
├── openai-apps/          # OpenAI連携アプリ
├── frontend/             # フロントエンド
└── docs/                 # ドキュメント
```

---

## 🚀 Quick Start Commands

### プロジェクト状態確認
```bash
# Git状態
miyabi git status

# エージェント状態
miyabi agent status

# Issue一覧
miyabi issue list
```

### 開発フロー
```bash
# 新機能開発
miyabi branch create feature/issue-XXX
miyabi agent codegen --issue XXX
miyabi agent review --branch feature/issue-XXX
miyabi pr create --issue XXX
```

### ビルド・テスト
```bash
# Rustビルド
cargo build --release

# テスト実行
cargo test

# Lintチェック
cargo clippy && cargo fmt --check
```

---

## 📊 Current Sprint Focus

### Active Issues
- 自動取得される（MCP経由）

### Today's Priority
1. MCP統合の安定化
2. エージェント間通信の改善
3. ダッシュボードUI強化

---

## 🔗 References

- [Miyabi Documentation](./docs/)
- [MCP Servers](./mcp-servers/)
- [Agent Cards](./docs/society/)
- [API Reference](./docs/miyabi-api-reference.txt)

---

*Generated by Miyabi System - AntiGravity Edition*
