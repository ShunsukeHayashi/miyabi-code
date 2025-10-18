# Discord通知自動化セットアップガイド

## 概要

Miyabi AgentのHookシステムを使用して、Agent実行時に自動的にDiscord通知を送信する設定方法を説明します。

---

## ✅ 前提条件

1. **Discord Webhook URLの取得**
   - Discordチャンネル設定 → 連携サービス → ウェブフック
   - 新しいウェブフックを作成し、URLをコピー

2. **環境変数の設定**
   ```bash
   export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
   ```

   または `.env` ファイルに追加：
   ```bash
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
   ```

---

## 📋 設定手順

### 1. `.miyabi.yml` に通知設定を追加

`.miyabi.yml` ファイルに以下の設定を追加してください：

```yaml
hooks:
  notification:
    enabled: true
    discordWebhookUrl: ${DISCORD_WEBHOOK_URL}
    notifyOnSuccess: true
    notifyOnFailure: true
    mentionOnFailure: []
```

**設定項目**:
- `enabled`: 通知機能の有効/無効
- `discordWebhookUrl`: Discord Webhook URL（環境変数 `${DISCORD_WEBHOOK_URL}` を使用可能）
- `notifyOnSuccess`: 成功時に通知を送信するか
- `notifyOnFailure`: 失敗時に通知を送信するか
- `mentionOnFailure`: 失敗時にメンションするユーザー名のリスト（例: `["alice", "bob"]`）

---

### 2. Agent実行時に自動通知を有効化

#### 方法A: `createHookManagerWithDiscordNotifications()` を使用（推奨）

```typescript
import { BaseAgent } from '@/base-agent';
import { Task, AgentResult, AgentConfig } from '@/types';
import { createHookManagerWithDiscordNotifications } from '@/hooks';

class MyAgent extends BaseAgent {
  // Discord通知が自動的に有効化されたHookManagerを作成
  private hookManager = createHookManagerWithDiscordNotifications();

  async execute(task: Task): Promise<AgentResult> {
    // Agent実装
    return { status: 'success', data: {} };
  }

  async run(task: Task): Promise<AgentResult> {
    const context = {
      agentType: this.agentType,
      task,
      config: this.config,
      startTime: Date.now(),
    };

    try {
      await this.hookManager.executePreHooks(context);
      const result = await this.execute(task);
      await this.hookManager.executePostHooks(context, result); // ✅ 成功通知
      return result;
    } catch (error) {
      await this.hookManager.executeErrorHooks(context, error); // ❌ 失敗通知
      throw error;
    }
  }
}
```

#### 方法B: 手動でHookを登録

```typescript
import { HookManager } from '@/hooks/hook-manager';
import { setupDiscordNotifications } from '@/hooks';

const hookManager = new HookManager();
setupDiscordNotifications(hookManager);

// あとは方法Aと同じ
```

---

## 📊 通知内容

### 成功時の通知

```
✅ **CodeGenAgent** completed successfully

**Task**: Implement user authentication (#example-1)
**Duration**: 2.50s
**Status**: success
**Quality Score**: 95/100
```

### 失敗時の通知

```
❌ **CodeGenAgent** failed @alice @bob

**Task**: Implement user authentication (#example-1)
**Duration**: 1.23s
**Error**: Failed to generate code: syntax error
```

---

## 🧪 テスト実行

Discordテスト実行スクリプトが用意されています：

```bash
cd /Users/a003/dev/miyabi-private

# 環境変数を設定
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"

# テスト実行
npm run test:discord-notifications
```

または直接実行：

```bash
ts-node packages/coding-agents/hooks/examples/discord-notification-example.ts
```

### 期待される出力

```
🚀 Discord Notification Example

📋 Task: Implement user authentication
🎯 Type: feature
⚡ Priority: P1

⏳ Executing agent...

✅ Success!
   Quality Score: 95/100
   Lines Changed: 150

📢 Discord notification sent!
```

---

## 🔧 カスタマイズ

### メンション機能を追加

失敗時に特定のユーザーをメンションする：

```yaml
hooks:
  notification:
    enabled: true
    discordWebhookUrl: ${DISCORD_WEBHOOK_URL}
    notifyOnSuccess: true
    notifyOnFailure: true
    mentionOnFailure: ["alice", "bob"]  # 失敗時に @alice @bob をメンション
```

### 成功通知を無効化

成功時の通知を無効にして、失敗時のみ通知：

```yaml
hooks:
  notification:
    enabled: true
    discordWebhookUrl: ${DISCORD_WEBHOOK_URL}
    notifyOnSuccess: false   # 成功時は通知しない
    notifyOnFailure: true    # 失敗時のみ通知
```

---

## 🛠️ トラブルシューティング

### 問題1: 通知が送信されない

**確認事項**:
1. `.miyabi.yml` で `enabled: true` になっているか
2. `DISCORD_WEBHOOK_URL` 環境変数が設定されているか
3. Webhook URLが正しいか（`https://discord.com/api/webhooks/...` 形式）

**デバッグ方法**:
```bash
# 環境変数確認
echo $DISCORD_WEBHOOK_URL

# 手動テスト
curl -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message from Miyabi"}'
```

### 問題2: `yaml` モジュールが見つからない

```bash
cd packages/coding-agents
npm install yaml
```

### 問題3: Hookが実行されない

Agent の `run()` メソッドで `hookManager.executePostHooks()` と `hookManager.executeErrorHooks()` を呼び出しているか確認してください。

---

## 📚 関連ファイル

- **設定ファイル**: `.miyabi.yml`
- **Hook実装**: `packages/coding-agents/hooks/setup-discord-notifications.ts`
- **使用例**: `packages/coding-agents/hooks/examples/discord-notification-example.ts`
- **NotificationHook**: `packages/coding-agents/hooks/built-in/notification-hook.ts`

---

## 🎯 まとめ

1. `.miyabi.yml` に通知設定を追加
2. `DISCORD_WEBHOOK_URL` 環境変数を設定
3. Agent実装で `createHookManagerWithDiscordNotifications()` を使用
4. Agent実行時に自動的にDiscord通知が送信される ✅

---

**作成日**: 2025-10-18
**バージョン**: 1.0.0
**更新者**: Claude Code
