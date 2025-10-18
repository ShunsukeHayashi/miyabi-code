# Discord CI/CD統合 - セットアップガイド

**作成日**: 2025-10-19
**バージョン**: v1.0.0

---

## 📋 概要

GitHub ActionsとDiscord Webhookを統合し、以下のイベントで自動通知を送信します：

- **Issue イベント**: 作成、クローズ、ラベル付与、アサイン
- **Pull Request イベント**: 作成、クローズ、レビュー準備完了、マージ
- **Workflow 完了**: Autonomous Agent、CI、Rustビルド完了時
- **Push イベント**: mainブランチへのpush

---

## 🚀 セットアップ手順

### 1. GitHub Secretsにwebhook URLを追加

```bash
# GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
Name: DISCORD_WEBHOOK_URL
Value: https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

**現在のWebhook URL** (`.env`に保存済み):
```
https://discord.com/api/webhooks/1429073619052400802/OJjiLiZf5BgqHRnS_7MT3zSuZZSmnfUDdhZWi-3aCy6VLNcTtbHGif3NQ0qdgdxzVZi9
```

### 2. `.miyabi.yml`でDiscord通知を有効化

```yaml
hooks:
  notification:
    enabled: true  # false → trueに変更
    discordWebhookUrl: ${DISCORD_WEBHOOK_URL}
    notifyOnSuccess: true
    notifyOnFailure: true
    mentionOnFailure: []
```

**現在の状態**: ✅ 有効化済み (`enabled: true`)

### 3. GitHub Actions Workflowを確認

`.github/workflows/discord-notification.yml` が以下のイベントをトリガーします：

```yaml
on:
  issues:
    types: [opened, closed, labeled, assigned]
  pull_request:
    types: [opened, closed, ready_for_review, merged]
  workflow_run:
    workflows: ["Autonomous Agent", "Integrated System CI", "Rust"]
    types: [completed]
  push:
    branches:
      - main
```

---

## 📊 通知フォーマット

### Issue通知

```json
{
  "title": "📋 Issue opened",
  "description": "Issue title",
  "url": "https://github.com/owner/repo/issues/270",
  "color": 3447003,
  "fields": [
    { "name": "Issue", "value": "#270" },
    { "name": "Action", "value": "opened" },
    { "name": "Author", "value": "username" }
  ]
}
```

### Pull Request通知

```json
{
  "title": "🔀 Pull Request opened",
  "description": "PR title",
  "url": "https://github.com/owner/repo/pull/42",
  "color": 3066993,
  "fields": [
    { "name": "PR", "value": "#42" },
    { "name": "Action", "value": "opened" },
    { "name": "Author", "value": "username" },
    { "name": "Changes", "value": "+120 / -30" }
  ]
}
```

### Workflow完了通知

```json
{
  "title": "✅ Workflow: Rust",
  "description": "Status: **success**",
  "color": 5763719,
  "fields": [
    { "name": "Branch", "value": "main" },
    { "name": "Commit", "value": "abc1234" },
    { "name": "Triggered by", "value": "username" }
  ]
}
```

### Push通知

```json
{
  "title": "📦 Push to main",
  "description": "feat: Add new feature",
  "color": 5814783,
  "fields": [
    { "name": "Commit", "value": "abc1234" },
    { "name": "Author", "value": "User Name" },
    { "name": "Files Changed", "value": "3 added, 5 modified, 1 removed" }
  ]
}
```

---

## 🎨 カラーコード

| イベント | カラー | 色 |
|---------|--------|-----|
| Issue opened | 3447003 | 🟦 Blue |
| Issue closed | 10181046 | 🟩 Green |
| PR opened | 3066993 | 🟦 Blue |
| PR closed | 10181046 | 🟩 Green |
| Workflow success | 5763719 | 🟢 Green |
| Workflow failure | 15158332 | 🔴 Red |
| Push to main | 5814783 | 🟣 Purple |
| Default | 15844367 | 🟠 Orange |

---

## 🧪 テスト方法

### 1. Issue作成テスト

```bash
# GitHub UIでIssueを作成
# または gh CLI
gh issue create --title "Test Issue for Discord notification" --body "Testing CI/CD integration"
```

**期待される動作**:
- ✅ Discord channelに「📋 Issue opened」通知が届く
- ✅ Issue番号、作成者、リンクが表示される

### 2. Push to mainテスト

```bash
# ファイルを変更してpush
echo "# Test" > TEST.md
git add TEST.md
git commit -m "test: Discord notification on push to main"
git push origin main
```

**期待される動作**:
- ✅ Discord channelに「📦 Push to main」通知が届く
- ✅ コミットメッセージ、変更ファイル数が表示される

### 3. Workflow完了テスト

```bash
# Rust workflowを手動トリガー
gh workflow run rust.yml
```

**期待される動作**:
- ✅ Workflow完了後にDiscord通知が届く
- ✅ 成功時は緑色、失敗時は赤色で表示される

---

## 🔧 トラブルシューティング

### 通知が届かない

**1. Webhook URLを確認**
```bash
# Secretsが設定されているか確認
gh secret list | grep DISCORD

# ローカル環境変数を確認
echo $DISCORD_WEBHOOK_URL
```

**2. Workflowの実行ログを確認**
```bash
# GitHub Actions → discord-notification workflow → 最新の実行ログ
# curlコマンドのレスポンスを確認
```

**3. Discord Webhookが有効か確認**
```bash
# 手動でテスト送信
curl -H "Content-Type: application/json" \
     -d '{"content":"Test from CI/CD"}' \
     https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

### 通知が重複する

**原因**: 複数のworkflowが同じイベントをトリガーしている可能性

**解決策**:
```yaml
# discord-notification.yml の if 条件を追加
jobs:
  notify:
    if: github.repository == 'ShunsukeHayashi/miyabi-private' && !contains(github.event.head_commit.message, '[skip ci]')
```

### 日本語が文字化けする

**原因**: JSON内の日本語文字列のエスケープ問題

**解決策**:
```bash
# 日本語を含むフィールドはbase64エンコード
COMMIT_MSG=$(echo '${{ github.event.head_commit.message }}' | base64)
```

---

## 📈 監視・メンテナンス

### 1. 通知頻度の監視

```bash
# GitHub Actions使用量を確認
gh api repos/ShunsukeHayashi/miyabi-private/actions/billing/usage

# 過去1週間のworkflow実行数
gh run list --workflow=discord-notification.yml --limit=50
```

### 2. Webhook URLのローテーション

**推奨**: 3ヶ月ごとにWebhook URLを更新

```bash
# Discord Server Settings → Integrations → Webhooks
# 新しいWebhook URLを生成

# GitHub Secretsを更新
gh secret set DISCORD_WEBHOOK_URL

# .envも更新
echo "DISCORD_WEBHOOK_URL=new_url" >> .env
```

### 3. 通知フィルタリング

**不要な通知を減らす**:
```yaml
# 特定のラベルが付いた時のみ通知
on:
  issues:
    types: [labeled]

jobs:
  notify:
    if: contains(github.event.issue.labels.*.name, 'priority:P0-Critical')
```

---

## 🔗 関連ドキュメント

- [Discord Webhook API](https://discord.com/developers/docs/resources/webhook)
- [GitHub Actions Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [DISCORD_NOTIFICATION_SETUP.md](./DISCORD_NOTIFICATION_SETUP.md) - Hook-based notification system
- [SESSION_REPORT_2025-10-18.md](./SESSION_REPORT_2025-10-18.md) - Discord統合実装の経緯

---

## ✅ チェックリスト

実装完了確認:

- [x] GitHub SecretにDISCORD_WEBHOOK_URL追加
- [x] `.miyabi.yml`でenabled: true設定
- [x] `.github/workflows/discord-notification.yml`作成
- [ ] Issue作成テスト実施
- [ ] Push to mainテスト実施
- [ ] Workflow完了テスト実施
- [ ] Discord channelで通知確認
- [ ] ドキュメント更新

---

## 📝 変更履歴

### v1.0.0 (2025-10-19)
- ✅ 初回リリース
- ✅ Issue/PR/Workflow/Pushイベント対応
- ✅ 日本語・英語両対応
- ✅ カラーコード体系確立

---

**作成者**: Claude Code
**最終更新**: 2025-10-19
