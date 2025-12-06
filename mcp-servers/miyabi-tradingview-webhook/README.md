# Miyabi TradingView Webhook Server 🚀

TradingViewからのWebhookアラートを受信し、Investment Societyの分析機能と連携して自動レポートを生成するサーバー。

## 機能

- ✅ TradingView Webhookアラート受信
- ✅ 自動テクニカル分析（SMA, RSI, トレンド判定）
- ✅ 自動ファンダメンタル分析（PER, PBR, 配当利回り）
- ✅ 投資スコア算出 & 推奨判定
- ✅ マルチチャネル通知（Slack, Discord, LINE, カスタムWebhook）
- ✅ アラート履歴管理

## クイックスタート

### 1. インストール

```bash
cd miyabi-tradingview-webhook
npm install
```

### 2. 環境設定

```bash
cp .env.example .env
# .envファイルを編集して通知先を設定
```

### 3. ビルド & 起動

```bash
npm run build
npm start

# 開発モード
npm run dev
```

### 4. 公開URL取得（ngrok推奨）

```bash
# ngrokをインストール
brew install ngrok

# トンネル開始
ngrok http 3456
```

表示されるURL（例: `https://xxxx.ngrok.io`）をコピー。

## TradingView設定

### Step 1: アラート作成

1. TradingViewでチャートを開く
2. 右クリック → 「アラートを追加」
3. 条件を設定（例: RSI < 30）

### Step 2: Webhook設定

**Webhook URL:**
```
https://your-ngrok-url.ngrok.io/webhook/tradingview
```

**メッセージ（JSON形式推奨）:**
```json
{
  "symbol": "{{ticker}}",
  "action": "buy",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "indicator": "RSI",
  "strategy": "Oversold Bounce",
  "message": "{{ticker}} RSI is oversold at {{close}}"
}
```

### TradingView変数一覧

| 変数 | 説明 |
|------|------|
| `{{ticker}}` | シンボル（AAPL, MSFT等） |
| `{{close}}` | 終値 |
| `{{open}}` | 始値 |
| `{{high}}` | 高値 |
| `{{low}}` | 安値 |
| `{{volume}}` | 出来高 |
| `{{time}}` | タイムスタンプ |
| `{{interval}}` | 時間足 |
| `{{exchange}}` | 取引所 |

## API エンドポイント

### POST /webhook/tradingview
TradingViewからのWebhook受信

**リクエスト:**
```json
{
  "symbol": "AAPL",
  "action": "buy",
  "price": 150.00
}
```

**レスポンス:**
```json
{
  "success": true,
  "alert": { ... },
  "analysis": {
    "symbol": "AAPL",
    "quote": { "price": 150.00, ... },
    "technical": { "rsi14": 28.5, ... },
    "recommendation": "🟢 BUY",
    "score": 65
  }
}
```

### GET /alerts
アラート履歴取得

```bash
curl http://localhost:3456/alerts?limit=10
```

### GET /alerts/:symbol
特定銘柄のアラート取得

```bash
curl http://localhost:3456/alerts/AAPL
```

### POST /analyze
手動分析実行

```bash
curl -X POST http://localhost:3456/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "NVDA"}'
```

### POST /test-notification
通知テスト

```bash
curl -X POST http://localhost:3456/test-notification \
  -H "Content-Type: application/json" \
  -d '{"channel": "slack", "symbol": "AAPL"}'
```

### GET /health
ヘルスチェック

```bash
curl http://localhost:3456/health
```

## 通知設定

### Slack

1. [Slack API](https://api.slack.com/messaging/webhooks)でWebhook URLを作成
2. `.env`に設定:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

### Discord

1. サーバー設定 → 連携サービス → ウェブフック
2. 新しいウェブフック作成
3. `.env`に設定:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
```

### LINE Notify

1. [LINE Notify](https://notify-bot.line.me/)でトークン取得
2. `.env`に設定:
```
LINE_NOTIFY_URL=https://notify-api.line.me/api/notify
```
※ Authorizationヘッダーも必要（別途実装要）

## TradingView アラート例

### RSI Oversold (買いシグナル)
```json
{
  "symbol": "{{ticker}}",
  "action": "buy",
  "price": {{close}},
  "indicator": "RSI",
  "message": "RSI oversold: {{plot_0}}"
}
```

### RSI Overbought (売りシグナル)
```json
{
  "symbol": "{{ticker}}",
  "action": "sell",
  "price": {{close}},
  "indicator": "RSI",
  "message": "RSI overbought: {{plot_0}}"
}
```

### Golden Cross
```json
{
  "symbol": "{{ticker}}",
  "action": "buy",
  "price": {{close}},
  "indicator": "SMA Cross",
  "message": "Golden Cross detected on {{ticker}}"
}
```

### Death Cross
```json
{
  "symbol": "{{ticker}}",
  "action": "sell",
  "price": {{close}},
  "indicator": "SMA Cross",
  "message": "Death Cross detected on {{ticker}}"
}
```

### Price Alert
```json
{
  "symbol": "{{ticker}}",
  "action": "watch",
  "price": {{close}},
  "message": "{{ticker}} reached target price"
}
```

## 本番環境へのデプロイ

### Option 1: AWS EC2

```bash
# サーバーにデプロイ
scp -r miyabi-tradingview-webhook ubuntu@your-ec2:/home/ubuntu/

# PM2で永続化
npm install -g pm2
pm2 start dist/index.js --name tradingview-webhook
pm2 save
```

### Option 2: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3456
CMD ["npm", "start"]
```

### Option 3: Cloudflare Workers / Vercel

軽量なエッジ関数として展開も可能。

## Investment Society との連携

このWebhookサーバーは単独でも動作しますが、
Miyabi Investment Society MCPと組み合わせることで、
より詳細な分析が可能です。

```
TradingView Alert
       ↓
Webhook Server (このサーバー)
       ↓
├── 即時分析 & 通知
└── Investment Society MCP
    ├── にゅーすあつめるん (ニュース取得)
    ├── ちゃーとみるん (詳細テクニカル)
    └── とうしきるん (総合判断)
```

## トラブルシューティング

### アラートが届かない

1. ngrokが起動しているか確認
2. TradingViewのWebhook URLが正しいか確認
3. サーバーログを確認

### 分析エラー

1. シンボルが正しいか確認（米国株: AAPL, 日本株: 7203.T）
2. Yahoo Finance APIの制限に注意

### 通知が届かない

1. `.env`のWebhook URLが正しいか確認
2. `POST /test-notification`でテスト

## ライセンス

MIT License

---

⚠️ **免責事項**: このツールは情報提供のみを目的としており、投資助言ではありません。投資判断はご自身の責任で行ってください。
