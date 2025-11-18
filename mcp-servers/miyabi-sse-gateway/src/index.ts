import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { promptInjectionGuard } from './middleware/prompt-injection-guard.js';
import { handleMcpAppsRequest } from './mcp-apps-sdk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Audit Logging Setup
// ==========================================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'miyabi-mcp-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/audit.log', level: 'info' })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// ==========================================
// Bearer Token Authentication Middleware
// ==========================================
const bearerAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.MIYABI_BEARER_TOKEN;

  if (!expectedToken) {
    logger.warn('MIYABI_BEARER_TOKEN not configured');
    return next(); // Allow in development mode
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid Authorization header', { ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Bearer token required'
    });
  }

  const token = authHeader.substring(7);
  if (token !== expectedToken) {
    logger.warn('Invalid bearer token', { ip: req.ip });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid bearer token'
    });
  }

  next();
};

// ==========================================
// Audit Logging Middleware
// ==========================================
const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  logger.info('Request received', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    hasAuth: !!req.headers.authorization
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Response sent', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
};

// ==========================================
// Rate Limiting
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit API calls to 30 per minute
  message: 'Too many API calls, please try again later'
});

// ==========================================
// CORS Configuration
// ==========================================
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://chat.openai.com',
  'https://chatgpt.com',
  'https://claude.ai',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked', { origin, timestamp: new Date().toISOString() });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(auditMiddleware);
app.use(promptInjectionGuard);

// ==========================================
// Health Check (No auth, no rate limit)
// ==========================================
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ==========================================
// MCP Discovery Endpoint (No auth required)
// ==========================================
app.get('/mcp', (req: Request, res: Response) => {
  res.json({
    name: 'Miyabi Society MCP Server',
    version: '1.0.0',
    description: 'Miyabiエージェント管理・tmux制御・レポート生成システム（日本語対応）',
    protocol: 'mcp',
    capabilities: ['tools'],
    status: 'ready'
  });
});

// ==========================================
// MCP Tool Calls Endpoint (Bearer Token required)
// ==========================================
app.post('/mcp', apiLimiter, bearerAuth, promptInjectionGuard, async (req: Request, res: Response) => {
  await handleMcpAppsRequest(req, res);
});

// ==========================================
// Error Handling
// ==========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : err.message
  });
});

// ==========================================
// Server Startup
// ==========================================
app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development'
  });

  console.log(`🚀 Miyabi MCP Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log();
  console.log('🔐 Security:');
  console.log(`   Bearer Token: ${!!process.env.MIYABI_BEARER_TOKEN ? '✅ Set' : '⚠️  Not set (dev mode)'}`);
  console.log(`   Rate Limiting: ✅ Enabled (30 req/min)`);
  console.log(`   Audit Logging: ✅ Enabled`);
  console.log(`   CORS: ✅ Restricted`);
  console.log(`   Prompt Injection Guard: ✅ Active`);

  if (!process.env.MIYABI_BEARER_TOKEN) {
    console.log();
    console.log('   ⚠️  Running in development mode (no authentication)');
  }
});
