import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定（Claude Desktopからのアクセスを許可）
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// ヘルスチェックエンドポイント
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SSEエンドポイント - Miyabi tmux MCP
app.get('/sse/tmux', (req: Request, res: Response) => {
  console.log('[SSE tmux] New connection');

  // SSEヘッダーの設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginxのバッファリング無効化

  // Keep-alive (30秒ごと)
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // MCP Serverプロセスを起動
  const mcpServerPath = path.join(__dirname, '../../miyabi-tmux-server/dist/index.js');
  const mcpProcess: ChildProcess = spawn('node', [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  console.log('[SSE tmux] MCP Server spawned:', mcpProcess.pid);

  // MCPサーバーからの出力をSSEでストリーミング
  mcpProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          // JSON-RPCメッセージかどうか確認
          const parsed = JSON.parse(line);
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);
        } catch (e) {
          // JSON-RPCでない場合はログとして送信
          res.write(`event: log\ndata: ${line}\n\n`);
        }
      }
    }
  });

  mcpProcess.stderr?.on('data', (data) => {
    console.error('[MCP tmux Error]:', data.toString());
    res.write(`event: error\ndata: ${data.toString()}\n\n`);
  });

  mcpProcess.on('close', (code) => {
    console.log(`[SSE tmux] MCP Server closed with code ${code}`);
    clearInterval(keepAliveInterval);
    res.end();
  });

  // クライアント切断時のクリーンアップ
  req.on('close', () => {
    console.log('[SSE tmux] Client disconnected');
    clearInterval(keepAliveInterval);
    mcpProcess.kill();
  });
});

// SSEエンドポイント - Miyabi Rules MCP
app.get('/sse/rules', (req: Request, res: Response) => {
  console.log('[SSE rules] New connection');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  const mcpServerPath = path.join(__dirname, '../../miyabi-rules-server/dist/index.js');
  const mcpProcess: ChildProcess = spawn('node', [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      MIYABI_RULES_API_URL: process.env.MIYABI_RULES_API_URL || '',
      MIYABI_API_KEY: process.env.MIYABI_API_KEY || ''
    }
  });

  console.log('[SSE rules] MCP Server spawned:', mcpProcess.pid);

  mcpProcess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed = JSON.parse(line);
          res.write(`data: ${JSON.stringify(parsed)}\n\n`);
        } catch (e) {
          res.write(`event: log\ndata: ${line}\n\n`);
        }
      }
    }
  });

  mcpProcess.stderr?.on('data', (data) => {
    console.error('[MCP rules Error]:', data.toString());
    res.write(`event: error\ndata: ${data.toString()}\n\n`);
  });

  mcpProcess.on('close', (code) => {
    console.log(`[SSE rules] MCP Server closed with code ${code}`);
    clearInterval(keepAliveInterval);
    res.end();
  });

  req.on('close', () => {
    console.log('[SSE rules] Client disconnected');
    clearInterval(keepAliveInterval);
    mcpProcess.kill();
  });
});

// MCPへのJSON-RPCリクエスト送信エンドポイント（POST）
app.post('/mcp/tmux', (req: Request, res: Response) => {
  // TODO: JSON-RPCリクエストをMCPサーバーに送信
  res.json({ message: 'Not implemented yet' });
});

app.post('/mcp/rules', (req: Request, res: Response) => {
  res.json({ message: 'Not implemented yet' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Miyabi SSE Gateway running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   SSE tmux: http://localhost:${PORT}/sse/tmux`);
  console.log(`   SSE rules: http://localhost:${PORT}/sse/rules`);
});
