# MiyabiCode

AI Coding Agent for Miyabi Agent Society - OpenCode inspired

## 概要 (Overview)

MiyabiCodeはMiyabi Agent SocietyのためのAIコーディングエージェントです。Anthropic Claude APIを活用し、Issue-Driven Development (IDD) ワークフローを自動化します。

## 特徴 (Features)

- 🤖 **AIコード生成**: Anthropic Claude APIによる高品質なコード生成
- 🎭 **エージェント社会**: 6つのコアエージェント（しきるん、カエデ、サクラ、ツバキ、ボタン、ながれるん）による協調開発
- 📋 **Issue-Driven Development**: GitHub Issue中心の開発ワークフロー
- 🔌 **MCP統合**: 172+ツールへのアクセス（Progressive Disclosure対応）
- 🎪 **tmux通信**: エージェント間通信プロトコル（P0.2準拠）

## インストール (Installation)

```bash
npm install -g miyabi-code
```

または

```bash
npx miyabi-code
```

## 使い方 (Usage)

### CLIコマンド

```bash
# 対話モード開始
miyabi-code interactive

# Issueを作成
miyabi-code issue create "バグの説明"

# PRを作成
miyabi-code pr create

# エージェントステータス確認
miyabi-code agent list

# ワークフロー実行
miyabi-code workflow run idd-flow
```

### 設定ファイル

プロジェクトルートに `miyabicode.json` を作成します：

```json
{
  "name": "your-project",
  "llm": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "tmux": {
    "session": "miyabi",
    "target": "agents.0"
  },
  "github": {
    "owner": "your-username",
    "repo": "your-repo"
  }
}
```

## エージェント (Agents)

| エージェント | 役割 | 概要 |
|-----------|------|------|
| 🎭 しきるん | Conductor | タスク分配・進捗管理 |
| 🍁 カエデ | CodeGen | コード生成 |
| 🌸 サクラ | Review | コードレビュー |
| 🌺 ツバキ | PR | Pull Request管理 |
| 🌼 ボタン | Deploy | デプロイ実行 |
| 🌊 ながれるん | Workflow | n8nワークフロー自動化 |

## 開発 (Development)

```bash
# クローン
git clone https://github.com/ShunsukeHayashi/miyabi-code.git
cd miyabi-code

# インストール
npm install

# 開発モード
npm run dev

# ビルド
npm run build

# テスト
npm test

# リント
npm run lint
npm run lint:fix
```

## ライセンス (License)

MIT License - see LICENSE file for details

## リンク (Links)

- [Repository](https://github.com/ShunsukeHayashi/miyabi-code)
- [Issues](https://github.com/ShunsukeHayashi/miyabi-code/issues)
- [Miyabi Agent Society](https://github.com/ShunsukeHayashi/miyabi-private)
