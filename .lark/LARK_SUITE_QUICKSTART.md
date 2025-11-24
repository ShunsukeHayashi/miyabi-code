# 🚀 Lark Suite クイックスタート（5分）

**対象**: Lark Suite (グローバル版) 初回セットアップ
**所要時間**: 約5-10分

---

## 📝 準備するもの

- [ ] メールアドレス（Gmail、Outlookなど）
- [ ] 電話番号（SMS認証用、オプション）
- [ ] ブラウザ（Chrome、Firefox、Safari推奨）

---

## ⚡ クイックセットアップ（3ステップ）

### Step 1: Lark Suite アカウント作成（2分）

```
1. https://www.larksuite.com にアクセス
2. 「Sign Up」をクリック
3. メールアドレスを入力
4. 届いた認証コードを入力
5. パスワード設定
6. 組織名: "Miyabi Development"
7. 完了！
```

### Step 2: アプリ作成（2分）

```
1. https://open.larksuite.com にアクセス
2. 「Create custom app」をクリック
3. App Name: "Miyabi Bot"
4. Description: "Miyabi notification bot"
5. 「Create」をクリック
```

### Step 3: 権限設定（1分）

```
1. 左サイドバー「Permissions & Scopes」をクリック
2. 以下の4つの権限を追加：
   ✅ im:message
   ✅ im:message:send_as_bot
   ✅ im:chat
   ✅ im:chat:write
3. 「Confirm」をクリック
```

---

## 🔑 認証情報の取得と設定

### App ID と App Secret を取得

```
1. Developer Console で作成したアプリをクリック
2. 「Credentials & Basic Info」→「Credentials」タブ
3. 以下をコピー：
   - App ID: cli_xxxxxxxxxxxxxxxxxxxx
   - App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Miyabi プロジェクトに設定

```bash
# ターミナルで実行
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# 認証情報ファイルを作成
cp .lark/config/credentials.json.example .lark/config/credentials.json

# エディタで開く
open .lark/config/credentials.json
# または
code .lark/config/credentials.json
```

### credentials.json を編集

```json
{
  "environments": {
    "development": {
      "app_id": "cli_あなたのApp ID",
      "app_secret": "あなたのApp Secret",
      "domain": "https://open.larksuite.com",
      "language": "en"
    }
  }
}
```

**保存して閉じる**

---

## ✅ 動作確認

### セットアップスクリプトを実行

```bash
# Miyabiプロジェクトルートで実行
.lark/scripts/setup-lark-bot.sh
```

**期待される出力**:

```
🚀 Miyabi Lark統合 - セットアップ開始
==========================================
📋 Step 1: 認証情報ファイルの確認
✅ credentials.json が存在します

📦 Step 2: MCPサーバーの依存関係インストール
   npm install を実行中...
✅ 依存関係のインストール完了

🔨 Step 3: MCPサーバーのビルド
✅ ビルド完了

🎉 セットアップ完了！
```

---

## 🎯 次のステップ

### 1. MCPサーバーを起動

```bash
cd mcp-servers/lark-mcp-enhanced
npm start
```

### 2. Claude Code でグループチャット作成

```javascript
mcp__lark__im_v1_chat_create({
  data: {
    name: "Miyabi Dev Test",
    description: "テストグループ",
    chat_type: "private"
  }
})
```

### 3. テストメッセージ送信

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

## 📚 詳細ガイド

より詳しい情報は以下を参照：

- **詳細セットアップ**: `.lark/docs/LARK_SUITE_SETUP.md`
- **メインREADME**: `.lark/README.md`
- **クイックリファレンス**: `.lark/QUICK_REFERENCE.md`

---

## 🆘 トラブルシューティング

### Q: アプリ作成時にエラーが出る

**A**: ワークスペースが作成されているか確認してください
```
1. Lark Suite にログイン
2. ワークスペース名が表示されるか確認
3. 管理者権限があるか確認
```

### Q: credentials.json が見つからない

**A**: テンプレートをコピーしてください
```bash
cp .lark/config/credentials.json.example .lark/config/credentials.json
```

### Q: MCPサーバーが起動しない

**A**: 依存関係を再インストール
```bash
cd mcp-servers/lark-mcp-enhanced
rm -rf node_modules
npm install
npm run build
```

---

## 🔗 重要なリンク

| リンク | URL |
|--------|-----|
| Lark Suite 公式 | https://www.larksuite.com |
| Open Platform | https://open.larksuite.com |
| Developer Console | https://open.larksuite.com/app |
| API Docs | https://open.larksuite.com/document/ |

---

**セットアップ完了後、すぐに通知送信が可能です！**
