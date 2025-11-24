# 🍎 MacBook - P0セキュリティ修正実装ガイド

**日付**: 2025-11-21
**担当**: Layer 3 Coordinator (MacBook)
**優先度**: 🔴 Critical P0

---

## 🎯 目的

SSE MCPサーバーの3つのP0セキュリティ脆弱性を修正し、本番環境デプロイ可能な状態にする。

---

## 🔴 P0脆弱性（Critical）

### 1. 認証なし
**問題**: 誰でもサーバーにアクセス可能
**影響**: 任意のコマンド実行が可能

### 2. CORS = `*`
**問題**: 全てのオリジンからのリクエストを許可
**影響**: CSRF攻撃のリスク

### 3. 入力検証なし
**問題**: パラメータの検証が一切ない
**影響**: インジェクション攻撃のリスク

---

## 📋 実装手順

### ステップ1: 作業ディレクトリの確認

```bash
# MacBookで
cd ~/Dev/01-miyabi/_core/miyabi-private/.claude

# 必要なファイルを確認
ls -la SSE_MCP_SERVER_ANALYSIS.md
ls -la SSE_MCP_DEPLOYMENT_GUIDE.md
```

### ステップ2: セキュリティミドルウェアの作成

**ファイル**: `~/miyabi-sse-mcp/security-middleware.js`

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

// ================================
// 1. API Key認証ミドルウェア
// ================================
function authenticateRequest(req, res, next) {
  const apiKey = process.env.MIYABI_API_KEY;
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }

  next();
}

// ================================
// 2. レート制限
// ================================
const apiLimiter = rateLimit({
  windowMs: 60000, // 1分
  max: 100, // 1分あたり100リクエスト
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================
// 3. CORS設定
// ================================
const ALLOWED_ORIGINS = [
  'https://claude.ai',
  'https://api.claude.ai',
  'http://localhost:3002', // ローカルテスト用
];

function corsConfig() {
  return {
    origin: (origin, callback) => {
      // originなし（同一オリジン）またはホワイトリストに含まれる場合は許可
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

// ================================
// 4. 入力検証スキーマ
// ================================
const SendTaskSchema = z.object({
  task: z.string().min(1).max(10000),
  pane_id: z.string().regex(/^%\d+$/),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
});

const GetOutputSchema = z.object({
  pane_id: z.string().regex(/^%\d+$/),
});

const GetTaskResultSchema = z.object({
  task_id: z.string().uuid(),
});

// ================================
// 5. バリデーション関数
// ================================
function validateSendTask(args) {
  try {
    return SendTaskSchema.parse(args);
  } catch (error) {
    throw new Error(`Invalid send_task parameters: ${error.message}`);
  }
}

function validateGetOutput(args) {
  try {
    return GetOutputSchema.parse(args);
  } catch (error) {
    throw new Error(`Invalid get_output parameters: ${error.message}`);
  }
}

function validateGetTaskResult(args) {
  try {
    return GetTaskResultSchema.parse(args);
  } catch (error) {
    throw new Error(`Invalid get_task_result parameters: ${error.message}`);
  }
}

// ================================
// Export
// ================================
module.exports = {
  authenticateRequest,
  apiLimiter,
  corsConfig,
  helmet,
  validateSendTask,
  validateGetOutput,
  validateGetTaskResult,
};
```

### ステップ3: 依存パッケージのインストール

```bash
cd ~/miyabi-sse-mcp
npm install helmet express-rate-limit zod winston
```

### ステップ4: メインサーバーの更新

**ファイル**: `~/miyabi-sse-mcp/index.js`

**変更箇所1: requireの追加（ファイル冒頭）**

```javascript
const {
  authenticateRequest,
  apiLimiter,
  corsConfig,
  helmet,
  validateSendTask,
  validateGetOutput,
  validateGetTaskResult,
} = require('./security-middleware');
```

**変更箇所2: ミドルウェアの適用（app設定部分）**

```javascript
// セキュリティヘッダー
app.use(helmet());

// CORSを更新
app.use(cors(corsConfig()));

// 保護されたエンドポイントに認証とレート制限を適用
app.use('/messages', authenticateRequest, apiLimiter);
app.use('/api', authenticateRequest, apiLimiter);
```

**変更箇所3: ツール実装の更新（バリデーション追加）**

```javascript
// executeSendTask関数内
async function executeSendTask(args) {
  // バリデーション追加
  const validated = validateSendTask(args);

  const taskId = uuidv4();
  const task = {
    id: taskId,
    task: validated.task,
    pane_id: validated.pane_id,
    priority: validated.priority,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  // 以下既存コード...
}

// executeGetOutput関数内
async function executeGetOutput(args) {
  // バリデーション追加
  const validated = validateGetOutput(args);

  // 以下既存コード...
}

// executeGetTaskResult関数内
async function executeGetTaskResult(args) {
  // バリデーション追加
  const validated = validateGetTaskResult(args);

  // 以下既存コード...
}
```

### ステップ5: 環境変数の設定

**ファイル**: `~/miyabi-sse-mcp/.env`

```bash
# ポート
PORT=3002

# API Key（セキュアな32文字の鍵を生成）
MIYABI_API_KEY=ここに生成した鍵を入力

# 環境
NODE_ENV=development

# Mac Local設定
MAC_LOCAL_HOST=localhost
MAC_LOCAL_PORT=3003
```

**API Key生成コマンド**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ステップ6: ローカルテスト

```bash
# サーバー起動
cd ~/miyabi-sse-mcp
npm run dev

# 別のターミナルでテスト
# 1. ヘルスチェック（認証不要）
curl http://localhost:3002/health

# 2. 認証なしでのアクセス（401エラーが返るべき）
curl -X POST http://localhost:3002/messages \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{}}'

# 3. 認証ありでのアクセス（成功すべき）
curl -X POST http://localhost:3002/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{}}'

# 4. 不正なCORSオリジンのテスト
curl -X POST http://localhost:3002/messages \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}'
```

---

## ✅ テストチェックリスト

### 認証テスト
- [ ] 認証なしで401エラーが返る
- [ ] 無効なAPI Keyで401エラーが返る
- [ ] 有効なAPI Keyで正常に動作する

### CORSテスト
- [ ] claude.aiからのリクエストが許可される
- [ ] 他のオリジンからのリクエストが拒否される
- [ ] localhostからのリクエストが許可される（開発時）

### バリデーションテスト
- [ ] 不正なpane_id（例: "invalid"）でエラーが返る
- [ ] taskが空文字列でエラーが返る
- [ ] taskが10000文字超でエラーが返る
- [ ] 不正なpriorityでエラーが返る
- [ ] 正しいパラメータで正常に動作する

### レート制限テスト
- [ ] 1分間に100リクエスト以上で429エラーが返る

---

## 🚀 次のステップ（P0完了後）

### P1修正（推奨）

1. **メモリリーク対策**
```javascript
// taskResultsのクリーンアップ
const MAX_TASK_RESULTS = 1000;
const TASK_RESULT_TTL = 3600000; // 1時間

setInterval(() => {
  const now = Date.now();
  for (const [id, task] of taskResults.entries()) {
    const age = now - new Date(task.created_at).getTime();
    if (age > TASK_RESULT_TTL || taskResults.size > MAX_TASK_RESULTS) {
      taskResults.delete(id);
    }
  }
}, 300000); // 5分ごと
```

2. **構造化ログ（Winston）**
```bash
npm install winston
```

3. **グレースフルシャットダウン**
```javascript
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### MAJIN デプロイ

P0修正完了後、MAJINにデプロイ：

```bash
# コードをMAJINに転送
scp -r ~/miyabi-sse-mcp ubuntu@54.92.67.11:~/

# MAJINにSSH
ssh majin

# デプロイガイドに従う
cd ~/miyabi-sse-mcp
# （SSE_MCP_DEPLOYMENT_GUIDE.md参照）
```

---

## 📊 進捗トラッキング

### P0修正
- [ ] security-middleware.js作成
- [ ] 依存パッケージインストール
- [ ] index.js更新
- [ ] .env設定
- [ ] ローカルテスト実行
- [ ] 全テストケース成功確認

### Git管理
- [ ] 変更をコミット
- [ ] feature/ai-factory-hero-fixesにプッシュ
- [ ] Pixel Layer 2に報告

---

## 🆘 トラブルシューティング

### npm installエラー
```bash
# Node.jsバージョン確認（>=18.0.0必要）
node --version

# npmキャッシュクリア
npm cache clean --force
npm install
```

### ポート3002が使用中
```bash
# プロセス確認
lsof -i :3002

# プロセスを終了
kill -9 <PID>
```

### .env読み込まれない
```bash
# dotenvがインストールされているか確認
npm list dotenv

# なければインストール
npm install dotenv
```

---

**推定作業時間**: 2-3時間
**優先度**: 🔴 P0 Critical
**ブロッカー**: なし（全ての必要ファイル転送済み）

**開始準備完了！**
