# GitHub Secrets セットアップ手順

**作成日**: 2025-10-19
**目的**: Discord CI/CD統合に必要なGitHub Secretsの設定

---

## 🔐 必要なSecret

### DISCORD_WEBHOOK_URL

**用途**: Discord通知のWebhook URL

**値**:
```
https://discord.com/api/webhooks/1429073619052400802/OJjiLiZf5BgqHRnS_7MT3zSuZZSmnfUDdhZWi-3aCy6VLNcTtbHGif3NQ0qdgdxzVZi9
```

---

## 📋 セットアップ手順

### 方法1: GitHub Web UI（推奨）

1. **GitHubリポジトリを開く**
   ```
   https://github.com/ShunsukeHayashi/miyabi-private
   ```

2. **Settings → Secrets and variables → Actions**
   - リポジトリページ右上の「Settings」をクリック
   - 左サイドバーの「Secrets and variables」を展開
   - 「Actions」を選択

3. **New repository secret をクリック**

4. **Secretを入力**
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: `https://discord.com/api/webhooks/1429073619052400802/OJjiLiZf5BgqHRnS_7MT3zSuZZSmnfUDdhZWi-3aCy6VLNcTtbHGif3NQ0qdgdxzVZi9`

5. **Add secret をクリック**

---

### 方法2: GitHub CLI

```bash
# GitHub CLIで認証（初回のみ）
gh auth login

# Secretを設定
gh secret set DISCORD_WEBHOOK_URL

# プロンプトが表示されるので、Webhook URLを貼り付け
# または、直接値を渡す
echo "https://discord.com/api/webhooks/1429073619052400802/OJjiLiZf5BgqHRnS_7MT3zSuZZSmnfUDdhZWi-3aCy6VLNcTtbHGif3NQ0qdgdxzVZi9" | gh secret set DISCORD_WEBHOOK_URL
```

---

## ✅ 設定確認

### 1. Secretが登録されているか確認

```bash
# GitHub CLI
gh secret list

# 出力例:
# DISCORD_WEBHOOK_URL  Updated 2025-10-19
```

### 2. Workflowを手動実行してテスト

```bash
# discord-notification workflowを手動トリガー
gh workflow run discord-notification.yml

# 実行状況を確認
gh run list --workflow=discord-notification.yml --limit=1
```

### 3. Discord channelで通知を確認

- Discord serverの通知チャンネルを開く
- 「📦 Push to main」または「✅ Workflow」通知が表示されることを確認

---

## 🔧 トラブルシューティング

### Workflow実行が失敗する

**症状**: GitHub Actions workflowが`failure`ステータス

**原因**: DISCORD_WEBHOOK_URLが未設定、または不正な値

**解決策**:
1. GitHub Secretsを確認
   ```bash
   gh secret list | grep DISCORD
   ```

2. Secretを再設定
   ```bash
   gh secret set DISCORD_WEBHOOK_URL
   ```

3. Workflowを再実行
   ```bash
   gh run rerun <run_id>
   # または最新の失敗したrunを再実行
   gh run rerun $(gh run list --workflow=discord-notification.yml --limit=1 --json databaseId --jq '.[0].databaseId')
   ```

### Discord通知が届かない

**症状**: Workflow成功だが、Discord channelに通知が表示されない

**原因1**: Webhook URLが無効
```bash
# Webhook URLをテスト
curl -H "Content-Type: application/json" \
     -d '{"content":"Test from manual curl"}' \
     "https://discord.com/api/webhooks/1429073619052400802/OJjiLiZf5BgqHRnS_7MT3zSuZZSmnfUDdhZWi-3aCy6VLNcTtbHGif3NQ0qdgdxzVZi9"
```

**原因2**: Discord Webhookが削除された
- Discord Server Settings → Integrations → Webhooks で確認
- 削除されている場合は新しいWebhook URLを作成して再設定

**原因3**: Discord channelの権限不足
- Botに「View Channel」「Send Messages」「Embed Links」権限があるか確認

---

## 📊 現在の設定状況

**リポジトリ**: ShunsukeHayashi/miyabi-private

**必要なSecrets**: 1個
- [⏳] DISCORD_WEBHOOK_URL

**Webhook URL**: `.env`に保存済み

**Workflow**: `.github/workflows/discord-notification.yml` 作成済み

**ローカル設定**: `.miyabi.yml` - `enabled: true`

---

## 🚀 次のステップ

### 1. Secretを設定
```bash
gh auth login
gh secret set DISCORD_WEBHOOK_URL
```

### 2. 動作確認
```bash
# テストコミットをpush
git commit --allow-empty -m "test: Discord notification test"
git push origin main

# GitHub Actionsを確認
gh run list --workflow=discord-notification.yml --limit=1

# Discord channelを確認
# 「📦 Push to main」通知が表示されるはず
```

### 3. Issue/PR通知もテスト
```bash
# Issue作成
gh issue create --title "Test: Discord notification" --body "Testing Issue event notification"

# PR作成
git checkout -b test/discord-pr
echo "# Test" > TEST.md
git add TEST.md
git commit -m "test: Discord PR notification"
git push origin test/discord-pr
gh pr create --title "Test: Discord PR notification" --body "Testing PR event"
```

---

## 📝 関連ドキュメント

- [DISCORD_CI_CD_SETUP.md](./DISCORD_CI_CD_SETUP.md) - Discord CI/CD統合の完全ガイド
- [DISCORD_NOTIFICATION_SETUP.md](./DISCORD_NOTIFICATION_SETUP.md) - Hook-based通知システム
- [NEXT_SESSION_GUIDE.md](./NEXT_SESSION_GUIDE.md) - 次回セッションガイド

---

**作成者**: Claude Code
**最終更新**: 2025-10-19
