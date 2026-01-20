# MiyabiCode

AI Coding Agent for Miyabi Agent Society - inspired by OpenCode.

## 概要

MiyabiCodeはMiyabi Agent Society向けに設計されたAIコーディングエージェントです。Anthropic Claude APIを活用し、Miyabiエコシステム（tmux、MCP Bundle、GitHub Ops）との統合を提供します。

## 特徴

- 🤖 **Anthropic Claude統合** - 最新のClaude APIを使用
- 🎭 **Miyabi Agent Society連携** - 21+の専門エージェントとの協調
- 🔌 **MCP Bundle統合** - 172+ツールへのアクセス
- 📋 **Issue-Driven Development** - GitHub中心のワークフロー
- 🇯🇵 **日本語最適化** - 日本語コメント・ドキュメント

## インストール

```bash
npm install
```

## 使用方法

```bash
# 開発モード
npm run dev

# ビルド
npm run build

# テスト
npm test

# リント
npm run lint
```

## プロジェクト構造

```
src/
├── agent/          # エージェント実装
├── llm/            # LLMプロバイダー
├── mcp/            # MCP統合
├── tmux/           # tmux通信
├── github/         # GitHub API
├── githubops/      # ワークフロー
├── config/         # 設定管理
├── utils/          # ユーティリティ
└── commands/       # CLIコマンド
```

## 設定

`miyabicode.json` をプロジェクトルートに配置:

```json
{
  "name": "my-project",
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4"
  },
  "mcp": {
    "enabled": ["miyabi-mcp-bundle"]
  },
  "tmux": {
    "session": "miyabi",
    "target": "agents.0"
  }
}
```

## ライセンス

MIT
