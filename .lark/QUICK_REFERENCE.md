# Miyabi Lark統合 - クイックリファレンス

**Last Updated**: 2025-11-20
**Version**: 1.0.0

---

## 🚀 クイックスタート（5分）

```bash
# 1. 認証情報設定
cp .lark/config/credentials.json.example .lark/config/credentials.json
# credentials.json を編集してApp ID/Secretを設定

# 2. セットアップスクリプト実行
.lark/scripts/setup-lark-bot.sh

# 3. MCPサーバー起動
cd mcp-servers/lark-mcp-enhanced && npm start
```

---

## 📡 よく使うMCPツール

### グループチャット作成

```javascript
mcp__lark__im_v1_chat_create({
  data: {
    name: "Miyabi Dev Team",
    description: "開発チーム用グループ",
    chat_type: "private",
    user_id_list: ["ou_xxxxxxxx"]
  },
  params: { user_id_type: "open_id" }
})
```

### メッセージ送信

```javascript
mcp__lark__im_v1_message_create({
  data: {
    receive_id: "oc_xxxxxxxx",  // chat_id
    msg_type: "text",
    content: JSON.stringify({ text: "メッセージ内容" })
  },
  params: { receive_id_type: "chat_id" }
})
```

### チャットリスト取得

```javascript
mcp__lark__im_v1_chat_list({
  params: {
    user_id_type: "open_id",
    page_size: 20
  }
})
```

---

## 📋 設定ファイル一覧

| ファイル | 用途 | 必須 |
|---------|------|------|
| `credentials.json` | App ID/Secret | ✅ |
| `environments.json` | 環境別設定 | ✅ |
| `mcp-servers.json` | MCPサーバー設定 | ✅ |
| `sync-settings.json` | 同期設定 | ⚪ |

---

## 🎨 テンプレート使用方法

### Issue通知カード

テンプレート: `.lark/templates/cards/issue-notification.json`

変数:
- `${issue.number}` - Issue番号
- `${issue.title}` - タイトル
- `${issue.html_url}` - URL
- `${issue.priority}` - 優先度

### ビルドレポートカード

テンプレート: `.lark/templates/cards/build-report.json`

変数:
- `${build.status}` - ステータス（success/failure）
- `${build.workflow_name}` - ワークフロー名
- `${build.duration}` - 所要時間

### Agent状態カード

テンプレート: `.lark/templates/cards/agent-status.json`

変数:
- `${agents.active_count}` - 稼働中Agent数
- `${agents.completed_tasks}` - 完了タスク数
- `${agents.blockers_count}` - ブロッカー数

---

## 🔧 トラブルシューティング

### MCPサーバーが起動しない

```bash
cd mcp-servers/lark-mcp-enhanced
rm -rf node_modules package-lock.json
npm install
npm run build
npm start
```

### メッセージ送信エラー

1. App IDとApp Secretを確認
2. Lark Open Platformで権限設定を確認
3. Botがグループに追加されているか確認

### Chat IDの取得方法

```javascript
// 1. チャットリストを取得
mcp__lark__im_v1_chat_list({
  params: { page_size: 50 }
})

// 2. 該当チャットのchat_idをコピー
```

---

## 📊 環境切り替え

### 開発環境

```json
// .lark/config/environments.json
{
  "active_environment": "development"
}
```

### 本番環境

```json
{
  "active_environment": "production"
}
```

---

## 🎯 通知設定

### グループチャット別通知設定

`.lark/groups/miyabi-dev.json` を編集：

```json
{
  "enabled_notifications": {
    "issues": { "opened": true, "closed": true },
    "builds": { "completed": true },
    "agents": { "status_report": true }
  }
}
```

### 通知スケジュール

```json
{
  "schedule": {
    "daily_standup": {
      "enabled": true,
      "time": "09:00"
    },
    "agent_report": {
      "enabled": true,
      "interval": "4h"
    }
  }
}
```

---

## 🔗 リンク集

- **セットアップガイド**: [docs/SETUP.md](./docs/SETUP.md)
- **メインREADME**: [README.md](./README.md)
- **Lark Open Platform**: https://open.feishu.cn
- **Miyabi CLAUDE.md**: [../CLAUDE.md](../CLAUDE.md)

---

## 📞 サポート

問題が発生した場合：

1. [SETUP.md](./docs/SETUP.md) のトラブルシューティングセクションを確認
2. GitHub Issueを作成
3. Miyabi Dev Teamグループで質問

---

**このファイルは.larkディレクトリのクイックリファレンスです**
