# Contributing to Miyabi Plugin Marketplace

Miyabi Plugin Marketplaceへの貢献をありがとうございます！

## Getting Started

### 1. リポジトリのクローン

```bash
git clone https://github.com/customer-cloud/miyabi-private.git
cd miyabi-private
```

### 2. 開発環境のセットアップ

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js (MCP servers用)
nvm install 20
nvm use 20

# Claude Code
npm install -g @anthropic-ai/claude-code
```

---

## Plugin Development

### 新規プラグインの作成

#### 1. ディレクトリ構造

```
plugins/my-new-plugin/
├── .claude-plugin/
│   └── plugin.json          # プラグインマニフェスト (必須)
├── agents/                   # Agent定義 (オプション)
│   └── my-agent.md
├── commands/                 # スラッシュコマンド (オプション)
│   └── my-command.md
├── skills/                   # スキル (オプション)
│   └── my-skill/
│       └── SKILL.md
├── hooks/                    # フック (オプション)
│   └── hooks.json
├── .mcp.json                 # MCP設定 (オプション)
└── README.md                 # ドキュメント (必須)
```

#### 2. plugin.json の作成

```json
{
  "name": "my-new-plugin",
  "version": "1.0.0",
  "description": "プラグインの説明",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "Apache-2.0",
  "keywords": ["keyword1", "keyword2"],
  "commands": "./commands",
  "agents": "./agents",
  "hooks": "./hooks/hooks.json"
}
```

#### 3. marketplace.json への追加

`.claude-plugin/marketplace.json` に新しいプラグインを追加:

```json
{
  "plugins": [
    // ... 既存のプラグイン
    {
      "name": "my-new-plugin",
      "source": "./plugins/my-new-plugin",
      "version": "1.0.0",
      "description": "プラグインの説明",
      "category": "development",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

---

## Agent Development

### Agent仕様書のテンプレート

```markdown
---
name: MyAgent
description: Agentの説明
authority: 🔵実行権限
escalation: TechLead (問題発生時)
character: キャラクター名 🎯
---

# MyAgent - 役割の説明

## キャラクター詳細

### Background (背景)
キャラクターのバックストーリー

### Speaking Style (話し方)
特徴的なフレーズ

## 役割
Agentの主な役割

## 責任範囲
- 責任1
- 責任2

## 実行権限
🔵 **実行権限**: 説明

## 技術仕様
### 使用モデル
- Model: claude-sonnet-4-20250514

## 成功条件
✅ 必須条件
✅ 品質条件

## エスカレーション条件
🚨 エスカレーション条件

## 🦀 Rust Tool Use (A2A Bridge)
### Tool名
```
a2a.my_agent.my_tool
```

## 関連Agent
- 関連Agent1
- 関連Agent2
```

---

## Skill Development

### SKILL.md テンプレート

```markdown
---
name: my-skill
description: スキルの説明
category: development
---

# My Skill

## 概要
スキルの概要説明

## 使用方法
\`\`\`
skill: "my-skill"
\`\`\`

## ワークフロー
1. ステップ1
2. ステップ2
3. ステップ3

## 出力
期待される出力

## 関連スキル
- 関連スキル1
- 関連スキル2
```

---

## Command Development

### コマンドテンプレート

```markdown
---
name: my-command
description: コマンドの説明
---

# /my-command

## 使用方法
\`\`\`
/my-command [options]
\`\`\`

## オプション
- `--option1`: 説明
- `--option2`: 説明

## 例
\`\`\`
/my-command --option1 value
\`\`\`

## 出力
期待される出力
```

---

## Code Standards

### Rust

- Rust 2021 Edition
- Clippy 32 lints準拠
- `cargo fmt` でフォーマット
- `cargo test` でテスト

```bash
# 品質チェック
cargo build --all-targets
cargo clippy --all-targets -- -D warnings
cargo test
cargo fmt --check
```

### Markdown

- 日本語と英語の混在OK
- コードブロックには言語指定
- 見出しは階層的に

### JSON

- 2スペースインデント
- 末尾カンマなし
- UTF-8エンコーディング

---

## Pull Request Process

### 1. ブランチ作成

```bash
git checkout -b feat/my-new-plugin
```

### 2. 変更をコミット

```bash
git add .
git commit -m "feat(plugins): add my-new-plugin

- Added agent definition
- Added commands
- Added documentation"
```

### 3. PR作成

```bash
gh pr create --title "feat(plugins): add my-new-plugin" --body "..."
```

### PR要件

- [ ] `plugin.json` が正しい形式
- [ ] `README.md` が完備
- [ ] テストが通る
- [ ] ドキュメントが最新

---

## Testing

### ローカルテスト

```bash
# マーケットプレイスをローカルで追加
/plugin marketplace add ./

# プラグインをインストール
/plugin install my-new-plugin@local

# 機能テスト
# ... プラグインの機能を手動テスト
```

### CI/CD

PRを作成すると自動で:
- plugin.json のバリデーション
- Markdownのリント
- 依存関係のチェック

---

## Issues & Discussions

### バグ報告

```markdown
## バグの説明
[問題の説明]

## 再現手順
1. ステップ1
2. ステップ2
3. ステップ3

## 期待する動作
[期待される動作]

## 実際の動作
[実際の動作]

## 環境
- Claude Code: [version]
- OS: [OS]
- Plugin: [plugin name and version]
```

### 機能リクエスト

```markdown
## 概要
[機能の概要]

## 動機
[なぜこの機能が必要か]

## 提案する解決策
[解決策の詳細]

## 代替案
[検討した代替案]
```

---

## License

このプロジェクトは Apache-2.0 ライセンスの下で公開されています。
貢献することで、あなたの貢献も同じライセンスの下で公開されることに同意したものとみなされます。

---

## Contact

- **GitHub Issues**: [miyabi-private/issues](https://github.com/customer-cloud/miyabi-private/issues)
- **Lark**: hayashi.s@customercloud.ai

---

Thank you for contributing to Miyabi! 🌸
