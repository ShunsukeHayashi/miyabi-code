# Lark Suite (グローバル版) セットアップガイド

**Version**: 1.0.0
**Last Updated**: 2025-11-20
**Target**: Lark Suite Global Edition

---

## 🌐 Lark vs Feishu の違い

| 項目 | Lark Suite | Feishu (飛書) |
|------|-----------|--------------|
| **対象地域** | グローバル | 中国国内 |
| **ドメイン** | `larksuite.com` | `feishu.cn` |
| **Open Platform URL** | https://open.larksuite.com | https://open.feishu.cn |
| **API エンドポイント** | `https://open.larksuite.com` | `https://open.feishu.cn` |
| **言語** | 英語/多言語 | 中国語 |

**重要**: Miyabiでは Lark Suite (グローバル版) を使用します。

---

## 📋 前提条件

- ✅ メールアドレス（Gmail、Outlook等）
- ✅ 電話番号（SMS認証用）
- ⚪ クレジットカード（無料プランでは不要）

---

## 🚀 Step 1: Lark Suite アカウント作成

### 1-1. Lark Suite にアクセス

1. ブラウザで [https://www.larksuite.com](https://www.larksuite.com) にアクセス
2. 右上の「**Sign Up**」または「**Get Started**」をクリック

### 1-2. アカウント登録

**方法 A: メールアドレスで登録（推奨）**

```
1. メールアドレスを入力
2. 「Send Code」をクリック
3. メールに届いた認証コードを入力
4. パスワードを設定（8文字以上）
5. 会社名/組織名を入力（例: "Miyabi Development"）
6. 業種を選択（例: "Technology"）
7. 「Continue」をクリック
```

**方法 B: Google/Microsoft アカウントで登録**

```
1. 「Sign up with Google」または「Sign up with Microsoft」を選択
2. アカウントを選択して認証
3. 会社名/組織名を入力
4. 業種を選択
5. 「Continue」をクリック
```

### 1-3. ワークスペース初期設定

```
1. ワークスペース名を設定（例: "Miyabi Workspace"）
2. タイムゾーンを選択（Asia/Tokyo）
3. 言語を選択（日本語 または English）
4. 「Finish Setup」をクリック
```

### 1-4. アカウント確認

✅ Lark Suite デスクトップアプリまたはWebにログイン成功
✅ ワークスペースが作成されている

---

## 🔧 Step 2: Lark Open Platform でアプリ作成

### 2-1. Open Platform にアクセス

1. [https://open.larksuite.com](https://open.larksuite.com) にアクセス
2. 右上の「**Sign In**」をクリック
3. 先ほど作成したLark Suiteアカウントでログイン

### 2-2. Developer Console へ移動

```
1. ログイン後、「Developer Console」をクリック
2. または直接 https://open.larksuite.com/app にアクセス
```

### 2-3. 新規アプリ作成

**方法 A: Custom App（カスタムアプリ）を作成**

```
1. 「Create custom app」ボタンをクリック
2. アプリ情報を入力：

   App Name: Miyabi Bot
   App Description: Autonomous development framework notification bot for Miyabi project

3. アプリアイコンをアップロード（オプション）
4. 「Create」をクリック
```

### 2-4. アプリ基本情報の確認

アプリ作成後、以下の情報が表示されます：

```
App ID: cli_xxxxxxxxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ 重要**: この情報は後で使用するため、安全に保管してください。

---

## 🔐 Step 3: 権限設定（Permissions & Scopes）

### 3-1. 権限ページへ移動

```
1. 左サイドバーの「Permissions & Scopes」をクリック
2. 「Scopes」タブを選択
```

### 3-2. 必要な権限を追加

**P0フェーズ（基本通知）に必要な権限**:

| Permission Scope | 説明 | 必須度 |
|-----------------|------|--------|
| `im:message` | Read messages | ✅ 必須 |
| `im:message:send_as_bot` | Send messages as bot | ✅ 必須 |
| `im:chat` | Read chat information | ✅ 必須 |
| `im:chat:write` | Create and manage chats | ✅ 必須 |

**権限追加手順**:

```
1. 「Add permissions」をクリック
2. 検索ボックスで "im:message" を検索
3. 該当する権限にチェックを入れる
4. 上記4つの権限すべてにチェック
5. 「Confirm」をクリック
```

### 3-3. P1フェーズ以降で追加する権限（オプション）

| Permission Scope | 説明 | 用途 |
|-----------------|------|------|
| `bitable:app` | Manage Base apps | Lark Base同期 |
| `calendar:calendar` | Manage calendars | イベント管理 |
| `task:task` | Manage tasks | タスク同期 |
| `docx:document` | Manage documents | ドキュメント自動化 |

**現時点では追加不要です（P1フェーズで追加予定）**

---

## 🌍 Step 4: 可用性設定（Availability）

### 4-1. Availability ページへ移動

```
1. 左サイドバーの「Availability」をクリック
```

### 4-2. 可用性範囲の設定

**開発・テスト段階（推奨）**:

```
Availability: All members of this workspace
（このワークスペースの全メンバー）

理由: 開発中は制限範囲で安全にテスト
```

**本番運用時**:

```
Availability: All members of the organization
（組織全体のメンバー）
```

### 4-3. 設定を保存

```
1. 範囲を選択
2. 「Save」をクリック
```

---

## ✅ Step 5: App Credentials（認証情報）の取得

### 5-1. Credentials ページへ移動

```
1. 左サイドバーの「Credentials & Basic Info」をクリック
2. 「Credentials」タブを選択
```

### 5-2. 認証情報を確認

以下の情報をコピーしてメモ帳に保存：

```
App ID: cli_xxxxxxxxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Verification Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxx (オプション)
Encrypt Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxx (オプション)
```

**⚠️ セキュリティ注意**:
- App Secret は絶対に公開しないこと
- Gitにコミットしないこと
- 定期的にローテーションすること

---

## 📝 Step 6: Miyabi プロジェクトに認証情報を設定

### 6-1. credentials.json を作成

```bash
# Miyabiプロジェクトルートで実行
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# テンプレートをコピー
cp .lark/config/credentials.json.example .lark/config/credentials.json
```

### 6-2. credentials.json を編集

`.lark/config/credentials.json` を開いて、以下のように編集：

```json
{
  "description": "Lark Suite アプリ認証情報",
  "environments": {
    "development": {
      "app_id": "cli_あなたのApp ID",
      "app_secret": "あなたのApp Secret",
      "user_access_token": "",
      "verification_token": "あなたのVerification Token（オプション）",
      "encrypt_key": "あなたのEncrypt Key（オプション）",
      "domain": "https://open.larksuite.com",
      "language": "en"
    }
  }
}
```

**重要な変更点**:
- `domain`: `https://open.larksuite.com` に設定（Feishuと異なる）
- `language`: `en` または `ja` に設定

### 6-3. MCP Server 用 .env ファイル作成

```bash
# MCP Server ディレクトリへ移動
cd mcp-servers/lark-mcp-enhanced

# .env ファイルを作成
cat > .env << EOF
APP_ID=あなたのApp ID
APP_SECRET=あなたのApp Secret
LARK_DOMAIN=https://open.larksuite.com
LARK_LANGUAGE=en
EOF
```

---

## 🔍 Step 7: 設定の確認

### 7-1. credentials.json の検証

```bash
# ファイルが存在するか確認
ls -la .lark/config/credentials.json

# ファイルが .gitignore に含まれているか確認
git status .lark/config/credentials.json
# → "Untracked files" に表示されないこと（.gitignoreで無視されている）
```

### 7-2. 設定値の確認チェックリスト

- [ ] App ID が `cli_` で始まっている
- [ ] App Secret が設定されている（32文字程度）
- [ ] `domain` が `https://open.larksuite.com` になっている
- [ ] `language` が設定されている（`en` または `ja`）
- [ ] ファイルが `.gitignore` に含まれている

---

## 🎯 Step 8: Open Platform での最終確認

### 8-1. アプリステータス確認

```
1. Developer Console に戻る
2. 作成した「Miyabi Bot」をクリック
3. ダッシュボードで以下を確認：

   ✅ Status: Development（または Active）
   ✅ Permissions: 4 scopes granted
   ✅ Availability: Configured
```

### 8-2. Bot User 確認

```
1. 左サイドバーの「App Features」→「Bot」をクリック
2. Bot が有効になっているか確認
3. Bot Name を設定（例: "Miyabi Bot"）
```

---

## 🚀 次のステップ

### ✅ 完了した項目

- [x] Lark Suite アカウント作成
- [x] Lark Open Platform でアプリ作成
- [x] 必要な権限を設定
- [x] App ID/Secret を取得
- [x] Miyabi プロジェクトに認証情報を設定

### ⏭️ 次に実行すること

1. **MCPサーバーのセットアップ**
   ```bash
   cd mcp-servers/lark-mcp-enhanced
   npm install
   npm run build
   ```

2. **MCPサーバーの起動**
   ```bash
   npm start
   ```

3. **テストグループチャットの作成**
   - Claude Code で MCP ツールを使用してグループ作成

4. **最初の通知送信**
   - テストメッセージを送信して動作確認

---

## 🆘 トラブルシューティング

### 問題: アプリ作成時に「Workspace not found」エラー

**原因**: ワークスペースが正しく作成されていない

**解決策**:
1. Lark Suite にログインしてワークスペースを確認
2. 管理者権限を確認
3. 別のブラウザ/シークレットモードで試す

### 問題: 権限追加時に「Permission denied」エラー

**原因**: アカウントに管理者権限がない

**解決策**:
1. ワークスペースの管理者に権限付与を依頼
2. または自分が管理者であることを確認

### 問題: App Secret が表示されない

**原因**: 一度しか表示されない仕様

**解決策**:
1. 「Reset Secret」をクリックして新しいSecretを生成
2. 表示されたSecretを必ず保存

---

## 📚 参考リンク

- **Lark Suite 公式サイト**: https://www.larksuite.com
- **Lark Open Platform**: https://open.larksuite.com
- **API Documentation**: https://open.larksuite.com/document/
- **Developer Console**: https://open.larksuite.com/app
- **Miyabi SETUP.md**: [SETUP.md](./SETUP.md)

---

## 🔐 セキュリティベストプラクティス

1. ✅ App Secret は環境変数または安全な vault に保存
2. ✅ `.gitignore` に `credentials.json` を追加（既に設定済み）
3. ✅ 開発環境と本番環境で異なるアプリを使用
4. ✅ 定期的に App Secret をローテーション（90日ごと推奨）
5. ✅ 不要な権限は付与しない（最小権限の原則）

---

**セットアップ完了後、次のステップに進んでください！**
