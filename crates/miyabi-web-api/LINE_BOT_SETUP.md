# LINE Bot Integration - Setup Guide

## 概要

Miyabi LINE Botは、LINEメッセージングAPIを通じてユーザーとインタラクションし、自動的にGitHub Issueを作成・管理する機能を提供します。

## 機能

- ✅ **自然言語解析**: GPT-4でユーザーメッセージを解析
- ✅ **自動Issue作成**: GitHub Issueを自動生成
- ✅ **Agent割り当て**: 適切なMiyabi Agentを自動選択
- ✅ **優先度判定**: P0-P3の優先度を自動設定
- ✅ **リアルタイム通知**: 処理状況をLINEで通知

## 実装状況（MVP）

### ✅ 完了

1. **LINE API Client** (`src/integrations/line.rs`)
   - メッセージ送信（text, flex）
   - プッシュメッセージ
   - ユーザープロフィール取得
   - 署名検証

2. **OpenAI Client** (`src/integrations/openai.rs`)
   - GPT-4統合
   - Issue分析機能
   - JSON構造化出力

3. **Webhook Handler** (`src/handlers/line.rs`)
   - メッセージイベント処理
   - ポストバックイベント処理
   - フォロー/アンフォローイベント処理
   - GitHub Issue自動生成

### ⏳ 今後の実装

- リッチメニュー設定
- Flex Message高度なレイアウト
- Agent実行状況のリアルタイム通知
- 統合テスト

## セットアップ手順

### 1. LINE Developers設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 新しいProvider作成（または既存を選択）
3. Messaging API Channelを作成
4. 以下の情報を取得：
   - **Channel Secret**
   - **Channel Access Token**

### 2. 環境変数設定

`.env`ファイルに以下を追加：

```bash
# LINE Bot Configuration
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_access_token_here

# OpenAI Configuration (for GPT-4)
OPENAI_API_KEY=sk-your-openai-api-key-here

# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_token_here
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=your-repo
```

### 3. Webhook URL設定

LINE Developers Consoleで以下のWebhook URLを設定：

```
https://your-domain.com/api/v1/line/webhook
```

**開発環境の場合**:

[ngrok](https://ngrok.com/)を使用してローカルサーバーを公開：

```bash
# サーバー起動
cargo run --bin miyabi-web-api

# 別ターミナルでngrok起動
ngrok http 8080

# ngrokが表示するHTTPS URLをLINE ConsoleのWebhook URLに設定
# 例: https://abc123.ngrok.io/api/v1/line/webhook
```

### 4. サーバー起動

```bash
cargo run --bin miyabi-web-api
```

### 5. 動作確認

1. LINE Botを友だち追加
2. メッセージを送信:
   ```
   ログイン機能にGoogle OAuth追加して
   ```
3. Botから返信が来てIssue番号が表示されることを確認
4. GitHubで実際にIssueが作成されていることを確認

## 使用例

### 基本的な使い方

```
ユーザー: 「ダッシュボードのグラフを見やすくして」

Bot: ✅ Issue #123 を作成しました！

📋 タイトル: Improve dashboard graph visualization
🤖 担当Agent: codegen
⚡ 優先度: P2-Medium
⏱️ 推定時間: 45分

Agentが自動処理を開始します。完了したらお知らせします！
```

### リッチメニュー（今後実装）

- Agent一覧
- 実行状況確認
- 設定
- ヘルプ
- GitHub連携
- マイページ

## アーキテクチャ

```
LINE User
    ↓ (message)
LINE Messaging API
    ↓ (webhook)
Miyabi Web API (/api/v1/line/webhook)
    ├─ Signature Verification
    ├─ Event Processing
    │   ├─ Text Message → OpenAI GPT-4
    │   │   └─ Issue Analysis (title, description, agent, priority, labels)
    │   └─ GitHub Issue Creation
    └─ LINE Reply Message
```

## トラブルシューティング

### Webhook接続エラー

```
Error: Invalid signature
```

**解決策**: `LINE_CHANNEL_SECRET`が正しいか確認

### GPT-4 API Error

```
Error: OpenAI API error: Unauthorized
```

**解決策**: `OPENAI_API_KEY`が正しいか、残高があるか確認

### GitHub Issue作成失敗

```
Error: Failed to create GitHub Issue
```

**解決策**:
- `GITHUB_TOKEN`のスコープに`repo`が含まれているか確認
- リポジトリ名（`GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`）が正しいか確認

## API Reference

### POST /api/v1/line/webhook

LINE Messaging APIからのWebhookを受信するエンドポイント。

**Headers**:
- `x-line-signature`: LINE署名（自動検証）

**Body**: LINE Webhook Event JSON

**Response**: `200 OK`

## セキュリティ

- ✅ LINE署名検証（HMAC-SHA256）
- ✅ HTTPS必須（本番環境）
- ⚠️ OpenAI API Keyの安全な管理
- ⚠️ GitHub Tokenの適切なスコープ設定

## 今後の拡張

- [ ] Flex Messageによるリッチな通知
- [ ] Agent実行進捗のリアルタイム更新
- [ ] ユーザーごとの設定保存
- [ ] 実行履歴の確認機能
- [ ] スケジュール実行機能

---

**実装日**: 2025-10-25
**バージョン**: MVP v0.1.0
**関連Issue**: #431
