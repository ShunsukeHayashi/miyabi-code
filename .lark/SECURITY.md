# Security Guidelines - Miyabi Lark Integration

## 概要

このドキュメントは、Miyabi Lark統合のセキュリティガイドラインを定義します。

## 重要な原則

### P0: 認証情報の保護

**絶対禁止:**
- ✗ ソースコードに認証情報をハードコード
- ✗ Gitリポジトリに `.env` ファイルをコミット
- ✗ ログに認証情報を出力
- ✗ デフォルト値として本番環境の認証情報を設定

**必須事項:**
- ✓ 環境変数から認証情報を読み込む
- ✓ `.env` ファイルを `.gitignore` に追加
- ✓ `.env.example` でテンプレートを提供
- ✓ 起動時に必須環境変数を検証

### P1: 環境変数管理

#### 必須環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `APP_ID` | Lark App ID | Lark Developer Console > 認証情報 |
| `APP_SECRET` | Lark App Secret | Lark Developer Console > 認証情報 |

#### オプション環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `PORT` | サーバーポート | 3000 |
| `WEBHOOK_URL` | カスタムWebhook URL | なし |

### P2: アクセストークン管理

#### Tenant Access Token

- ✓ メモリ内にキャッシュ（有効期限付き）
- ✓ 期限切れ前60秒で自動更新
- ✗ ディスクに保存しない
- ✗ ログに出力しない

### P3: ログとデバッグ

#### 安全なログ出力

```javascript
// ✓ Good
console.log(`APP_ID: ${APP_ID?.substring(0, 8)}...`);

// ✗ Bad
console.log(`APP_ID: ${APP_ID}`);
console.log(`APP_SECRET: ${APP_SECRET}`);
```

## セットアップ手順

### 1. 環境変数ファイルの作成

```bash
# .env.example をコピー
cp .env.example .env

# 実際の認証情報を設定
nano .env
```

### 2. `.gitignore` の確認

```bash
# .env が除外されていることを確認
cat .gitignore | grep .env
```

### 3. 環境変数の検証

```bash
# サーバー起動時に自動検証される
node server/event-server.js
```

## インシデント対応

### 認証情報が漏洩した場合

1. **即座にローテーション**
   - Lark Developer Consoleで新しいApp Secretを発行
   - すべての環境で新しい認証情報に更新

2. **影響範囲の調査**
   - Gitコミット履歴を確認
   - アクセスログを確認
   - 不正なアクセスがないか確認

3. **再発防止策**
   - このガイドラインを再確認
   - コードレビューで認証情報のハードコードを検出

## チェックリスト

開発者は以下のチェックリストを確認してください：

- [ ] 認証情報をハードコードしていない
- [ ] 環境変数から認証情報を読み込んでいる
- [ ] `.env` を `.gitignore` に追加している
- [ ] `.env.example` を提供している
- [ ] 起動時に環境変数を検証している
- [ ] ログに認証情報を出力していない
- [ ] アクセストークンを安全に管理している

## 参考資料

- [Lark Security Best Practices](https://open.larksuite.com/document/home/security-best-practices)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Last Updated**: 2025-12-07
**Version**: 1.0.0
