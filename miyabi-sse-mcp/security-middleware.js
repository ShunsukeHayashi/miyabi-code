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
