require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const {
  authenticateRequest,
  apiLimiter,
  corsConfig,
  helmet,
  validateSendTask,
  validateGetOutput,
  validateGetTaskResult,
} = require('./security-middleware');

const app = express();
const PORT = process.env.PORT || 3002;

// ================================
// P1: 構造化ログ（Winston）
// ================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// セキュリティミドルウェア
app.use(helmet());
app.use(cors(corsConfig()));
app.use(express.json());

// リクエストログ
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// SSEクライアント管理
const sseClients = [];

// タスクキュー
const taskQueue = [];
const taskResults = new Map();

// ================================
// P1: メモリリーク対策
// ================================
const MAX_TASK_RESULTS = 1000;
const TASK_RESULT_TTL = 3600000; // 1時間

function cleanupOldTasks() {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, task] of taskResults.entries()) {
    const age = now - new Date(task.created_at).getTime();

    if (age > TASK_RESULT_TTL || taskResults.size > MAX_TASK_RESULTS) {
      taskResults.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} old task results`, {
      remaining: taskResults.size,
      maxSize: MAX_TASK_RESULTS
    });
  }
}

// 5分ごとにクリーンアップ
setInterval(cleanupOldTasks, 300000);

// ヘルスチェック（認証不要）
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0-p1-fixed',
    metrics: {
      taskQueueLength: taskQueue.length,
      taskResultsCount: taskResults.size,
      sseClientsCount: sseClients.length
    }
  });
});

// SSEエンドポイント（認証不要 - ブラウザからの接続用）
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

  sseClients.push(res);
  logger.info('SSE client connected', { totalClients: sseClients.length });

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
      logger.info('SSE client disconnected', { remainingClients: sseClients.length });
    }
  });
});

// MCP メッセージエンドポイント（認証必須）
app.post('/messages', authenticateRequest, apiLimiter, async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== '2.0') {
    logger.warn('Invalid JSON-RPC version', { jsonrpc });
    return res.status(400).json({ error: 'Invalid JSON-RPC version' });
  }

  try {
    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'miyabi-sse-mcp-server',
            version: '1.0.0-p1-fixed',
          },
        };
        logger.info('Client initialized', { protocolVersion: result.protocolVersion });
        break;

      case 'tools/list':
        result = {
          tools: [
            {
              name: 'send_task',
              description: 'Send a task to Mac Local Claude Code via task queue',
              inputSchema: {
                type: 'object',
                properties: {
                  task: { type: 'string', description: 'Task description' },
                  pane_id: { type: 'string', description: 'tmux pane ID (e.g., %9)', default: '%9' },
                  priority: { type: 'string', enum: ['high', 'normal', 'low'], default: 'normal' },
                },
                required: ['task'],
              },
            },
            {
              name: 'get_output',
              description: 'Get output from a specific tmux pane',
              inputSchema: {
                type: 'object',
                properties: {
                  pane_id: { type: 'string', description: 'tmux pane ID', default: '%9' },
                },
                required: ['pane_id'],
              },
            },
            {
              name: 'get_task_result',
              description: 'Get the result of a previously submitted task',
              inputSchema: {
                type: 'object',
                properties: {
                  task_id: { type: 'string', description: 'Task ID returned from send_task' },
                },
                required: ['task_id'],
              },
            },
          ],
        };
        break;

      case 'tools/call':
        const toolName = params.name;
        const args = params.arguments || {};

        logger.info('Tool called', { tool: toolName });

        switch (toolName) {
          case 'send_task':
            result = await executeSendTask(args);
            break;
          case 'get_output':
            result = await executeGetOutput(args);
            break;
          case 'get_task_result':
            result = await executeGetTaskResult(args);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    res.json({ jsonrpc: '2.0', id, result });
  } catch (error) {
    logger.error('Request processing error', {
      method,
      error: error.message,
      stack: error.stack
    });

    res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: error.message },
    });
  }
});

// タスク実行関数
async function executeSendTask(args) {
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

  taskQueue.push(task);
  logger.info('Task queued', {
    taskId,
    priority: task.priority,
    queueLength: taskQueue.length
  });

  // SSE通知
  broadcast({ type: 'task_queued', task });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ task_id: taskId, status: 'queued', message: 'Task submitted successfully' }, null, 2),
      },
    ],
  };
}

async function executeGetOutput(args) {
  const validated = validateGetOutput(args);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ pane_id: validated.pane_id, output: 'Output retrieval not yet implemented' }, null, 2),
      },
    ],
  };
}

async function executeGetTaskResult(args) {
  const validated = validateGetTaskResult(args);

  const result = taskResults.get(validated.task_id);
  if (!result) {
    logger.warn('Task not found', { taskId: validated.task_id });
    throw new Error(`Task not found: ${validated.task_id}`);
  }

  logger.info('Task result retrieved', { taskId: validated.task_id });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

// Mac Local Pollingエンドポイント（認証必須）
app.get('/api/tasks', authenticateRequest, apiLimiter, (req, res) => {
  const pendingTasks = taskQueue.filter(t => t.status === 'pending');
  res.json({ tasks: pendingTasks });
});

// タスク完了報告エンドポイント（認証必須）
app.post('/api/tasks/:id/complete', authenticateRequest, apiLimiter, (req, res) => {
  const taskId = req.params.id;
  const { result, error } = req.body;

  const task = taskQueue.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.status = error ? 'failed' : 'completed';
  task.completed_at = new Date().toISOString();

  taskResults.set(taskId, {
    task_id: taskId,
    status: task.status,
    result: result || null,
    error: error || null,
    created_at: task.created_at,
    completed_at: task.completed_at,
  });

  logger.info('Task completed', {
    taskId,
    status: task.status,
    duration: new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()
  });

  // SSE通知
  broadcast({ type: 'task_completed', task_id: taskId, status: task.status });

  res.json({ success: true });
});

// SSEブロードキャスト
function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (err) {
      logger.error('SSE broadcast error', { error: err.message });
    }
  });
}

// ================================
// P1: グレースフルシャットダウン改善
// ================================
let isShuttingDown = false;
let server;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received, initiating graceful shutdown`);

  server.close(() => {
    logger.info('HTTP server closed');

    // SSE接続を閉じる
    sseClients.forEach(client => {
      try {
        client.end();
      } catch (e) {}
    });
    logger.info(`Closed ${sseClients.length} SSE connections`);

    // 最終クリーンアップ
    cleanupOldTasks();
    logger.info('Final cleanup completed');

    process.exit(0);
  });

  // 10秒後に強制終了
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// サーバー起動
server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0-p1-fixed',
    security: 'P0+P1 fixes applied'
  });
});
