# LINE Developers セットアップガイド

**対象**: Phase 6.1 - LINE Messaging API統合
**Issue**: [#431](https://github.com/customer-cloud/miyabi-private/issues/431)
**所要時間**: 約30分

---

## 📋 目次

1. [事前準備](#事前準備)
2. [LINE Developersアカウント作成](#line-developersアカウント作成)
3. [Providerの作成](#providerの作成)
4. [Messaging API Channelの作成](#messaging-api-channelの作成)
5. [Channel設定](#channel設定)
6. [Webhook URLの設定](#webhook-urlの設定)
7. [環境変数への登録](#環境変数への登録)
8. [動作確認](#動作確認)
9. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 必要なもの

- [ ] LINE アカウント（個人用またはビジネス用）
- [ ] メールアドレス（認証用）
- [ ] 電話番号（2FA用、推奨）
- [ ] 外部公開可能なWebhook URL（後ほど設定、開発時はngrok使用可）

### 参考情報

- **LINE Developers Console**: https://developers.line.biz/console/
- **公式ドキュメント**: https://developers.line.biz/ja/docs/messaging-api/overview/
- **料金**: Messaging API は無料プラン（月1,000通まで）が利用可能

---

## LINE Developersアカウント作成

### Step 1: LINEアカウントでログイン

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 「LINEアカウントでログイン」をクリック
3. LINE アプリで認証（QRコードスキャン or メールアドレス/パスワード）
4. 利用規約に同意

### Step 2: 開発者情報の登録

1. 開発者名を入力（例: `Miyabi Development Team`）
2. メールアドレスを入力（通知受信用）
3. 「登録」をクリック

✅ **確認**: LINE Developers Console のダッシュボードが表示される

---

## Providerの作成

**Provider** = アプリ提供者の組織単位（1つの組織で複数のChannelを管理）

### Step 3: 新規Providerを作成

1. ダッシュボード右上の「Create」 → 「Provider」をクリック
2. Provider名を入力
   - **推奨**: `Miyabi` または `Miyabi Web Service`
   - **注意**: 後から変更不可、ユーザーに表示されることがある
3. 「Create」をクリック

✅ **確認**: Provider一覧に新規Providerが表示される

---

## Messaging API Channelの作成

**Channel** = 個別のLINE Bot（1つのProviderで複数のChannelを管理可能）

### Step 4: Messaging API Channelを作成

1. 作成したProviderをクリック
2. 「Create a Messaging API channel」をクリック
3. 以下の情報を入力:

| 項目 | 設定値 | 説明 |
|------|--------|------|
| **Channel type** | Messaging API | 自動選択済み |
| **Channel name** | `Miyabi Bot` | ユーザーに表示されるBot名 |
| **Channel description** | `AIエージェント実行自動化Bot` | Bot説明（1,000文字以内） |
| **Category** | `IT・技術` | 最も近いカテゴリを選択 |
| **Subcategory** | `開発ツール` | 最も近いサブカテゴリを選択 |
| **Email address** | `your-email@example.com` | 運営者のメールアドレス |
| **Privacy policy URL** | `https://your-domain.com/privacy` | プライバシーポリシー（必須） |
| **Terms of use URL** | `https://your-domain.com/terms` | 利用規約（任意） |

4. 利用規約に同意してチェック
5. 「Create」をクリック

✅ **確認**: Channel基本情報画面が表示される

---

## Channel設定

### Step 5: Channel Access Token（長期）を発行

1. Channel基本情報画面の「Messaging API」タブをクリック
2. 「Channel access token」セクションまでスクロール
3. 「Issue」ボタンをクリック
4. **重要**: 表示されたトークンを安全にコピー（後で確認不可）

```
# 例（実際は異なる値）
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1peWFiaUJvdCIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

✅ **保存先**: `.env` ファイルの `LINE_CHANNEL_ACCESS_TOKEN` に設定（後述）

### Step 6: Channel Secretを取得

1. 同じく「Messaging API」タブ内の「Channel secret」セクションを確認
2. 表示されている Channel Secret をコピー

```
# 例（実際は異なる値）
abc123def456ghi789jkl012mno345pq
```

✅ **保存先**: `.env` ファイルの `LINE_CHANNEL_SECRET` に設定（後述）

### Step 7: 応答設定を調整

1. 「Messaging API」タブ内の「LINE Official Account features」セクションを確認
2. 以下のように設定:

| 項目 | 設定値 | 理由 |
|------|--------|------|
| **応答メッセージ** | `無効` | Webhook経由でカスタム応答するため |
| **あいさつメッセージ** | `有効`（任意） | ユーザーが友だち追加時のメッセージ |
| **Webhook** | `有効` | Webhook受信を許可 |

3. 「Update」をクリック

---

## Webhook URLの設定

### Step 8: Webhook URLを登録

**開発環境**: ngrok を使用して一時的な公開URLを取得

```bash
# ngrok インストール（未インストールの場合）
brew install ngrok

# miyabi-web-api を起動（ポート3000）
cd miyabi-web/crates/miyabi-web-api
cargo run

# 別ターミナルで ngrok 起動
ngrok http 3000

# 出力例:
# Forwarding  https://abcd1234.ngrok.io -> http://localhost:3000
```

**Webhook URL**: `https://abcd1234.ngrok.io/api/line/webhook`

### Step 9: LINE Developers Console で Webhook URL を設定

1. 「Messaging API」タブ内の「Webhook settings」セクションを確認
2. 「Webhook URL」フィールドに上記URLを入力
3. 「Update」をクリック
4. 「Verify」ボタンをクリックして疎通確認

✅ **成功メッセージ**: "Success" と表示される
❌ **エラー**: [トラブルシューティング](#トラブルシューティング) を参照

### Step 10: Use webhook を有効化

1. 同じく「Webhook settings」セクション内の「Use webhook」トグルを `ON` に設定
2. 「Update」をクリック

---

## 環境変数への登録

### Step 11: `.env` ファイルに追加

`miyabi-web/.env` ファイルを編集:

```bash
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Step 5 で取得
LINE_CHANNEL_SECRET=abc123def456ghi789jkl012mno345pq            # Step 6 で取得
LINE_WEBHOOK_URL=https://abcd1234.ngrok.io/api/line/webhook    # Step 8 で設定
```

### Step 12: 環境変数の読み込み確認

```bash
# miyabi-web-api を再起動
cargo run

# ログに以下が表示されることを確認:
# [INFO] LINE_CHANNEL_ACCESS_TOKEN: loaded
# [INFO] LINE_CHANNEL_SECRET: loaded
# [INFO] LINE Webhook endpoint: /api/line/webhook
```

---

## 動作確認

### Step 13: LINE Botを友だち追加

1. LINE Developers Console の「Messaging API」タブを開く
2. 「QR code」セクションでQRコードを表示
3. LINE アプリで QR コードをスキャン
4. 「追加」をクリック

✅ **確認**: Bot からあいさつメッセージが届く（有効にした場合）

### Step 14: テストメッセージ送信

1. LINE アプリで Bot にメッセージを送信（例: `テスト`）
2. miyabi-web-api のログを確認:

```
[INFO] Received LINE webhook event
[DEBUG] Event type: message
[DEBUG] User ID: U1234567890abcdef1234567890abcdef
[DEBUG] Message text: テスト
```

3. Bot から応答メッセージが返ってくることを確認（Phase 6.2 実装後）

---

## トラブルシューティング

### Q1: Webhook Verify が失敗する

**エラー**: "The webhook URL is not reachable"

**原因と対処**:
1. **ngrok が起動していない** → `ngrok http 3000` を実行
2. **miyabi-web-api が起動していない** → `cargo run` を実行
3. **エンドポイントパスが間違っている** → `/api/line/webhook` を確認
4. **ファイアウォールでブロック** → ngrok の HTTPS URL を使用（HTTP は不可）

### Q2: Channel Access Token が表示されない

**原因**: すでに発行済み

**対処**:
1. 既存のトークンを削除: 「Channel access token」セクションの「Revoke」をクリック
2. 新しいトークンを再発行: 「Issue」をクリック

### Q3: Bot からメッセージが届かない

**原因と対処**:
1. **応答メッセージが有効** → 「LINE Official Account features」で無効化
2. **Webhook が無効** → 「Use webhook」を `ON` に設定
3. **コードのバグ** → miyabi-web-api のログを確認

### Q4: ngrok の URL が変わる

**問題**: ngrok 無料版は再起動のたびに URL が変わる

**対処**:
1. **ngrok 有料プラン** (Pro: $8/月) → 固定ドメイン取得
2. **本番環境デプロイ** → Fly.io/Vercel で固定 URL 取得
3. **開発時は都度更新** → LINE Developers Console で Webhook URL を手動更新

### Q5: "Invalid signature" エラー

**原因**: Channel Secret が間違っている

**対処**:
1. LINE Developers Console で Channel Secret を再確認
2. `.env` ファイルの `LINE_CHANNEL_SECRET` を修正
3. miyabi-web-api を再起動

---

## 次のステップ

✅ **Phase 6.1 完了**: LINE Developers アカウントとチャンネルが作成されました！

**Phase 6.2** (次回): Rust Axum で Webhook エンドポイントを実装します。

- `src/handlers/line.rs` - Webhook ハンドラー
- `src/middleware/line_signature.rs` - 署名検証ミドルウェア
- `src/integrations/line_client.rs` - LINE Messaging API クライアント

---

## 参考リンク

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [Webhook イベントオブジェクト](https://developers.line.biz/ja/reference/messaging-api/#webhook-event-objects)
- [署名検証](https://developers.line.biz/ja/reference/messaging-api/#signature-validation)
- [Reply Message API](https://developers.line.biz/ja/reference/messaging-api/#send-reply-message)
- [Push Message API](https://developers.line.biz/ja/reference/messaging-api/#send-push-message)
- [Rich Menu API](https://developers.line.biz/ja/reference/messaging-api/#rich-menu)

---

**作成日**: 2025-10-24
**担当**: Claude Code
**Issue**: [#431](https://github.com/customer-cloud/miyabi-private/issues/431)
