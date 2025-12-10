# Miyabi Lark Integration

Lark (飛書) Bot統合のためのMCPサーバーとイベントサーバー

## セキュリティ

このプロジェクトはセキュアな認証情報管理を実装しています。

### セットアップ手順

1. `.env.example` を `.env` にコピー：
```bash
cp .env.example .env
```

2. `.env` ファイルを編集して実際の認証情報を設定：
```bash
# Lark Developer Console から取得
APP_ID=あなたのAPP_ID
APP_SECRET=あなたのAPP_SECRET
```

3. 環境変数が正しく設定されているか確認：
```bash
node tests/security-test.js
```

### セキュリティガイドライン

- ✓ 認証情報は環境変数から読み込む
- ✓ `.env` ファイルは `.gitignore` に含まれている
- ✓ コードに認証情報をハードコードしない
- ✓ デフォルト値として実際の認証情報を使用しない

詳細は [SECURITY.md](./SECURITY.md) を参照してください。

## 使い方

### イベントサーバーの起動

```bash
cd server
node event-server.js
```

環境変数が設定されていない場合、起動時にエラーが表示されます。

### セキュリティテストの実行

```bash
cd tests
node security-test.js
```

## ファイル構造

```
.lark/
├── server/
│   └── event-server.js       # イベント受信サーバー
├── tests/
│   └── security-test.js      # セキュリティテスト
├── .env.example              # 環境変数テンプレート
├── .env                      # 実際の環境変数（Git管理外）
├── .gitignore                # Git除外設定
├── SECURITY.md               # セキュリティガイドライン
└── README.md                 # このファイル
```

## トラブルシューティング

### 環境変数が設定されていない

```
❌ 必須環境変数が設定されていません:
   - APP_ID (Lark App ID)
   - APP_SECRET (Lark App Secret)
```

→ `.env` ファイルを作成して認証情報を設定してください。

### セキュリティテストが失敗する

```
❌ セキュリティチェックに失敗
```

→ コードに認証情報がハードコードされている可能性があります。`tests/security-test.js` の出力を確認してください。

## 開発ガイドライン

### 新しい環境変数を追加する場合

1. `.env.example` にプレースホルダーを追加
2. `server/event-server.js` の `validateEnvironment()` に検証を追加
3. `SECURITY.md` のドキュメントを更新
4. セキュリティテストを実行して確認

### コミット前のチェック

```bash
# セキュリティテストを実行
node tests/security-test.js

# .env ファイルがステージングされていないことを確認
git status | grep .env
```

## 参考資料

- [Lark Open Platform](https://open.larksuite.com/)
- [SECURITY.md](./SECURITY.md) - セキュリティガイドライン
- [.env.example](./.env.example) - 環境変数テンプレート

---

Last Updated: 2025-12-07
