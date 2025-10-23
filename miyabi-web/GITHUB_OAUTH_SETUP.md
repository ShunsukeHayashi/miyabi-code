# GitHub OAuth Setup Guide

このガイドでは、Miyabi Web認証システムのGitHub OAuth設定手順を説明します。

## 📋 前提条件

- GitHubアカウント
- 開発環境でRust backendとNext.jsフロントエンドが動作可能

## 🔧 セットアップ手順

### Step 1: GitHub OAuth Appの作成

1. GitHubにログインし、以下のURLにアクセス：
   ```
   https://github.com/settings/developers
   ```

2. **「New OAuth App」**ボタンをクリック

3. OAuth App情報を入力：

   | フィールド | 値 |
   |-----------|-----|
   | **Application name** | `Miyabi Web (Development)` |
   | **Homepage URL** | `http://localhost:3001` |
   | **Application description** | `AI-Powered Development Automation Platform (Local Development)` |
   | **Authorization callback URL** | `http://localhost:8080/api/auth/github/callback` |

4. **「Register application」**をクリック

5. OAuth Appが作成されたら、以下の情報をコピー：
   - **Client ID** (すぐに表示されます)
   - **Client secrets**セクションで**「Generate a new client secret」**をクリックしてシークレットを生成し、コピー

⚠️ **重要**: Client Secretは一度しか表示されないので、必ずコピーしてください！

### Step 2: 環境変数の設定

#### Rust Backend設定 (`crates/miyabi-web-api/.env`)

```bash
# Server Configuration
PORT=8080

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=<Step 1でコピーしたClient ID>
GITHUB_CLIENT_SECRET=<Step 1でコピーしたClient Secret>
GITHUB_REDIRECT_URI=http://localhost:8080/api/auth/github/callback

# JWT Configuration
JWT_SECRET=development-secret-change-in-production

# Logging
RUST_LOG=info,miyabi_web_api=debug
```

#### フロントエンド設定 (`miyabi-web/.env.local`)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# GitHub OAuth Client ID (フロントエンド用)
NEXT_PUBLIC_GITHUB_CLIENT_ID=<Step 1でコピーしたClient ID>
```

### Step 3: サーバー起動

#### 1. Rust Backendの起動

```bash
cd crates/miyabi-web-api
cargo run --release
```

起動成功ログ：
```
Miyabi Web API listening on 0.0.0.0:8080
```

#### 2. Next.js フロントエンドの起動

```bash
cd ../../  # プロジェクトルートに戻る
npm run dev
```

起動成功ログ：
```
▲ Next.js 14.2.18
- Local:        http://localhost:3001
✓ Ready in 967ms
```

### Step 4: 動作確認

1. ブラウザで `http://localhost:3001/login` にアクセス

2. **「Sign in with GitHub」**ボタンをクリック

3. GitHubの認証画面にリダイレクトされます：
   - アプリケーション名：`Miyabi Web (Development)`
   - 要求される権限：`repo`, `read:user`
   - **「Authorize」**をクリック

4. 成功すると `/dashboard` にリダイレクトされ、ログイン完了

## 🔍 トラブルシューティング

### ❌ 「redirect_uri_mismatch」エラー

**原因**: GitHub OAuth Appの設定と実際のredirect_uriが一致していない

**解決方法**:
1. https://github.com/settings/developers でOAuth Appを開く
2. **Authorization callback URL**が `http://localhost:8080/api/auth/github/callback` になっているか確認
3. 違う場合は修正して**「Update application」**をクリック

### ❌ 「GITHUB_CLIENT_ID must be set」エラー

**原因**: 環境変数が読み込まれていない

**解決方法**:
```bash
# .envファイルが存在するか確認
ls -la crates/miyabi-web-api/.env

# 環境変数が設定されているか確認
cd crates/miyabi-web-api
grep GITHUB_CLIENT_ID .env

# サーバーを再起動
cargo run --release
```

### ❌ ポート衝突エラー

**原因**: ポート8080または3001が既に使用されている

**解決方法**:
```bash
# ポート使用状況を確認
lsof -i :8080
lsof -i :3001

# プロセスを停止するか、.envでポート番号を変更
```

### ❌ CORS エラー

**原因**: フロントエンド（3001）とバックエンド（8080）のCORS設定

**確認方法**:
- Rust backendの `main.rs` で `CorsLayer` が設定されているか確認
- ブラウザのコンソールでCORSエラーログを確認

## 📝 本番環境設定

本番環境では、以下を変更してください：

### GitHub OAuth App（本番用）

1. 新しいOAuth Appを作成（開発用と分ける）
   - **Application name**: `Miyabi Web (Production)`
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://api.your-domain.com/api/auth/github/callback`

2. 環境変数を本番値に更新：
   ```bash
   GITHUB_REDIRECT_URI=https://api.your-domain.com/api/auth/github/callback
   JWT_SECRET=<強力なランダム文字列を生成>
   ```

### セキュリティチェックリスト

- [ ] JWT_SECRETを強力なランダム値に変更
- [ ] HTTPS使用を強制
- [ ] CORS設定を特定のドメインに制限
- [ ] 環境変数をシークレットマネージャーに保存（AWS Secrets Manager, GitHub Secrets等）
- [ ] ログレベルを `info` に設定（デバッグログ無効化）

## 🎉 完了！

これでMiyabi Web認証システムが動作します。

**次のステップ**:
- ユーザー情報をデータベースに保存（PostgreSQL統合）
- トークンリフレッシュ機能の実装
- ログアウト処理の実装
- 権限管理システムの構築
