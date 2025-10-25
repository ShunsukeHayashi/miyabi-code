# Miyabi Core - 自律型開発フレームワーク

**バージョン**: v0.1.1
**言語**: Rust 2021 Edition
**ライセンス**: MIT

---

## 🎯 概要

完全自律型AI開発オペレーションプラットフォーム。GitHub as OS アーキテクチャに基づき、Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

---

## 🏗️ アーキテクチャ

### Cargo Workspace構成
```
crates/
├── miyabi-types/          # コア型定義
├── miyabi-core/           # 共通ユーティリティ
├── miyabi-cli/            # CLIツール
├── miyabi-agents/         # 21個のAgent実装
├── miyabi-github/         # GitHub API統合
├── miyabi-worktree/       # Git Worktree管理
├── miyabi-llm/            # LLM抽象化層
├── miyabi-knowledge/      # ナレッジ管理
└── miyabi-mcp-server/     # MCP Server
```

---

## 🤖 21 Agents

### Coding Agents (7個)
- CoordinatorAgent（しきるん）
- CodeGenAgent（つくるん）
- ReviewAgent（めだまん）
- IssueAgent（みつけるん）
- PRAgent（まとめるん）
- DeploymentAgent（はこぶん）
- RefresherAgent（つなぐん）

### Business Agents (14個)
- 戦略・企画系（6個）
- マーケティング系（5個）
- 営業・顧客管理系（3個）

---

## 📚 ドキュメント

- [クイックスタート](../../.claude/QUICK_START.md)
- [エージェント仕様](../../.claude/agents/)
- [トラブルシューティング](../../.claude/TROUBLESHOOTING.md)

---

## 🔗 派生プロジェクト

Miyabi Coreを使用したプロジェクト：

### 1. Historical AI
- **場所**: `projects/historical-ai/`
- **概要**: 歴史偉人AIアバター販売プラットフォーム
- **技術**: Rust + Next.js + OpenAI GPT-4o

### 2. LINE Bot
- **場所**: `projects/line-bot/`
- **概要**: LINE Messaging API統合
- **技術**: Rust + LINE API + GPT-4

### 3. Shinyu
- **場所**: `projects/shinyu/`
- **概要**: 統合占いアプリ
- **技術**: 未定（計画中）

---

🤖 Miyabi Framework
