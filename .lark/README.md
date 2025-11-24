# Miyabi Lark統合

**Version**: 1.0.0
**Status**: P0 Phase - 基本通知システム稼働中
**Last Updated**: 2025-11-20

---

## 🎯 概要

Miyabi自律型開発フレームワークとLark/Feishuを統合し、リアルタイム通知・双方向同期・AI駆動ワークフローを実現します。

### 主要機能

| Phase | 機能 | ステータス |
|-------|------|----------|
| **P0** | 基本通知システム | 🟢 実装完了 |
| **P0** | Issue通知 | 🟢 実装完了 |
| **P0** | ビルドレポート | 🟢 実装完了 |
| **P0** | Agent状態レポート | 🟢 実装完了 |
| **P1** | GitHub ↔ Lark Base 双方向同期 | 🟡 計画中 |
| **P1** | 定期レポート自動化 | 🟡 計画中 |
| **P2** | Genesis AI統合 | 🟡 計画中 |
| **P2** | Orchestra ダッシュボード | 🟡 計画中 |

---

## 📂 ディレクトリ構造

```
.lark/
├── config/              # 設定ファイル
│   ├── credentials.json.example
│   ├── environments.json
│   ├── mcp-servers.json
│   └── sync-settings.json
├── templates/           # メッセージ・カードテンプレート
│   ├── cards/          # インタラクティブカード
│   ├── messages/       # テキストメッセージ
│   └── base-apps/      # Genesis AIテンプレート
├── groups/              # グループチャット管理
├── agents/              # Lark専用エージェント
├── scripts/             # 自動化スクリプト
├── docs/                # ドキュメント
└── logs/                # 運用ログ（gitignore）
```

---

## 🚀 クイックスタート

### 1. セットアップ

詳細は [docs/SETUP.md](./docs/SETUP.md) を参照してください。

```bash
# 1. 認証情報の設定
cp .lark/config/credentials.json.example .lark/config/credentials.json
# credentials.json を編集

# 2. MCPサーバーのセットアップ
cd mcp-servers/lark-mcp-enhanced
npm install && npm run build

# 3. MCPサーバー起動
npm start
```

### 2. 最初の通知送信

Claude Codeで以下を実行：

```javascript
mcp__lark__im_v1_message_create({
  data: {
    receive_id: "あなたのchat_id",
    msg_type: "text",
    content: JSON.stringify({
      text: "🎉 Miyabi Lark統合テスト成功！"
    })
  },
  params: {
    receive_id_type: "chat_id"
  }
})
```

---

## 📊 利用可能なMCPツール

現在利用可能なLark MCPツール：

| ツール名 | 機能 | 用途 |
|---------|------|------|
| `im_v1_chat_create` | グループチャット作成 | 新規チーム用グループ作成 |
| `im_v1_chat_list` | チャットリスト取得 | Bot参加チャット確認 |
| `im_v1_chatMembers_get` | メンバーリスト取得 | グループメンバー管理 |
| `im_v1_message_create` | メッセージ送信 | 通知・レポート送信 |
| `im_v1_message_list` | メッセージ履歴取得 | チャット履歴分析 |

---

## 🎨 テンプレート一覧

### インタラクティブカード

1. **issue-notification.json** - GitHub Issue作成通知
   - Issue番号、タイトル、優先度、担当者を表示
   - [GitHubで表示] ボタン付き

2. **build-report.json** - CI/CDビルドレポート
   - ビルド状態、テスト結果、所要時間
   - 成功/失敗で色分け

3. **agent-status.json** - Miyabi Agent状態レポート
   - 稼働中Agent数、完了タスク、ブロッカー
   - 4時間ごとの定期レポート

### テキストメッセージ

1. **daily-standup.md** - デイリースタンドアップ
   - 昨日完了・今日予定・ブロッカー
   - Agent状態・統計情報

---

## 🔧 設定ファイル

### credentials.json

```json
{
  "environments": {
    "development": {
      "app_id": "cli_xxxxxxxxxxxxxxxx",
      "app_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "domain": "https://open.feishu.cn",
      "language": "ja"
    }
  }
}
```

⚠️ **セキュリティ**: このファイルは `.gitignore` に含まれています。

### environments.json

環境別の機能有効化・レート制限設定

```json
{
  "active_environment": "development",
  "environments": {
    "development": {
      "features": {
        "notifications": true,
        "sync": false
      }
    }
  }
}
```

### mcp-servers.json

使用するMCPサーバーとプリセット設定

```json
{
  "active_server": "lark-mcp-enhanced",
  "servers": {
    "lark-mcp-enhanced": {
      "current_preset": "default"
    }
  }
}
```

---

## 📖 ドキュメント

| ドキュメント | 説明 |
|------------|------|
| [SETUP.md](./docs/SETUP.md) | 詳細セットアップガイド |
| [WORKFLOWS.md](./docs/WORKFLOWS.md) | ワークフロー解説（作成予定） |
| [API_REFERENCE.md](./docs/API_REFERENCE.md) | Lark API リファレンス（作成予定） |
| [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | トラブルシューティング（作成予定） |

---

## 🛣️ ロードマップ

### ✅ P0 - Critical（1週目）- 完了

- [x] `.lark/` ディレクトリ構造作成
- [x] 設定ファイルテンプレート
- [x] 基本通知テンプレート（Issue、ビルド、Agent）
- [x] MCPサーバー設定
- [x] セットアップドキュメント

### 🟡 P1 - High Priority（2-3週目）

- [ ] `miyabi-lark-sync` サービスデプロイ
- [ ] GitHub Actions統合
- [ ] 定期レポート自動化
- [ ] Webhookエンドポイント
- [ ] Lark Base同期

### 🟢 P2 - Medium Priority（4週目以降）

- [ ] Genesis AI ワークフロー
- [ ] Orchestra ダッシュボード
- [ ] 自動応答Bot
- [ ] アナリティクス統合

---

## 🤝 利用可能なMCPサーバー

Miyabiプロジェクトには3つのLark MCPサーバーが用意されています：

### 1. lark-mcp-enhanced（推奨）

- **場所**: `mcp-servers/lark-mcp-enhanced`
- **特徴**: Miyabi専用カスタマイズ版
- **機能**: 自動権限管理、プリセット対応
- **起動**: `npm start`

### 2. lark-openapi-mcp-enhanced

- **場所**: `mcp-servers/lark-openapi-mcp-enhanced`
- **特徴**: フル機能版 + Genesis AI
- **機能**: 全OpenAPI、Lark Baseアプリ自動生成
- **起動**: `yarn build && node dist/cli.js mcp`

### 3. lark-wiki-mcp-agents

- **場所**: `mcp-servers/lark-wiki-mcp-agents`
- **特徴**: Wiki特化型マルチエージェント
- **機能**: Wiki管理、ドキュメント自動化

---

## 📊 使用例

### Issue作成時の自動通知

```javascript
// GitHub Issueが作成されたら自動的にLarkに通知
// .lark/workflows/issue-to-lark/config.json で設定
{
  "trigger": "issue.opened",
  "action": "send_notification",
  "template": "issue-notification",
  "target_group": "miyabi-dev"
}
```

### Agent状態の定期レポート

```bash
# cron設定例（4時間ごと）
0 */4 * * * /path/to/miyabi/.lark/scripts/send-agent-report.sh
```

### ビルド完了時の通知

```yaml
# .github/workflows/ci.yml に追加
- name: Notify Lark
  if: always()
  run: |
    .lark/scripts/send-build-report.sh \
      --status ${{ job.status }} \
      --workflow ${{ github.workflow }}
```

---

## 🔐 セキュリティ

### 機密情報の管理

以下のファイルは `.gitignore` に含まれています：

```
.lark/config/credentials.json
.lark/logs/
.lark/**/*.log
.lark/**/secrets.*
.lark/config/*.key
.lark/config/*.pem
```

### 推奨事項

1. ✅ `credentials.json` は絶対にコミットしない
2. ✅ 環境変数で認証情報を管理
3. ✅ 本番環境とテスト環境でApp IDを分ける
4. ✅ 定期的にApp Secretをローテーション

---

## 🆘 サポート

問題が発生した場合：

1. [SETUP.md](./docs/SETUP.md) のトラブルシューティングを確認
2. GitHub Issueを作成
3. Miyabi Dev Teamグループで質問

---

## 📝 バージョン履歴

- **v1.0.0** (2025-11-20) - P0フェーズ完了
  - 基本ディレクトリ構造
  - 設定ファイルテンプレート
  - 基本通知テンプレート
  - セットアップドキュメント

---

**Project**: Miyabi
**Integration**: Lark/Feishu
**Maintained by**: Miyabi Team
