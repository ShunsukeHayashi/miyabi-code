# Miyabi-Lark Sync Service

GitHub Issues と Lark Tasks/Base を双方向にリアルタイム同期するサービス。

## アーキテクチャ

```
GitHub Webhook → Express Server → Sync Logic → Lark API
     ↓                                            ↑
   Issue Event                              Task Event
     ↓                                            ↑
Lark Callback ← Express Server ← Event Router ← Lark
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# .env を編集して実際の値を設定
```

### 3. 開発サーバー起動

```bash
npm run dev
```

### 4. ビルド

```bash
npm run build
```

### 5. 本番起動

```bash
npm start
```

## エンドポイント

- `POST /webhooks/github` - GitHub Webhook受信
- `POST /webhooks/lark` - Lark Event Callback受信

## 機能

### GitHub → Lark 同期

- Issue作成 → Lark Task + Base Record作成
- Issue編集 → Lark更新
- Issueクローズ → Lark Taskクローズ
- ラベル変更 → Lark同期

### Lark → GitHub 同期

- Lark Task完了 → GitHub Issueクローズ
- Base Record変更 → GitHub同期（予定）

## デプロイ

### Cloud Run (推奨)

```bash
npm run build
gcloud run deploy miyabi-lark-sync \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated
```

### Docker

```bash
docker build -t miyabi-lark-sync .
docker run -p 3000:3000 --env-file .env miyabi-lark-sync
```

## 監視

### ヘルスチェック

```bash
curl http://localhost:3000/health
```

### ログ

```bash
tail -f logs/sync.log
```

## ライセンス

MIT

## メンテナンス

Miyabi Team
