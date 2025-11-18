import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { promptInjectionGuard } from './middleware/prompt-injection-guard.js';
import { handleMcpAppsRequest } from './mcp-apps-sdk.js';
import { getMCPRouter } from './mcp-router.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// OAuth Configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Simple in-memory token storage (use Redis in production)
const tokenStore = new Map<string, { access_token: string; created_at: number }>();

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
app.use(express.urlencoded({ extended: true }));
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
  const hasOAuthConfig = !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

  res.json({
    name: 'Miyabi Society MCP Server',
    version: '1.0.0',
    description: 'Miyabiエージェント管理・tmux制御・レポート生成システム（日本語対応）',
    protocol: 'mcp',
    capabilities: ['tools'],
    status: 'ready',
    ...(hasOAuthConfig && {
      authentication: {
        type: 'oauth2',
        oauth2: {
          authorizationUrl: `${BASE_URL}/oauth/authorize`,
          tokenUrl: `${BASE_URL}/oauth/token`,
          scopes: []
        }
      }
    })
  });
});

// ==========================================
// OAuth2 Endpoints
// ==========================================

// Step 1: Authorization - Redirect to GitHub
app.get('/oauth/authorize', (req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    logger.error('OAuth authorization attempted but GITHUB_CLIENT_ID not configured');
    return res.status(500).json({ error: 'OAuth not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BASE_URL}/oauth/callback`;

  // Store state for CSRF protection (in production, use Redis)
  tokenStore.set(state, { access_token: '', created_at: Date.now() });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `scope=user:email`;

  logger.info('OAuth authorization initiated', { state, redirectUri });
  res.redirect(githubAuthUrl);
});

// Step 2: Callback - Exchange code for token
app.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    logger.error('OAuth callback missing code or state', { code: !!code, state: !!state });
    return res.status(400).json({ error: 'Missing code or state parameter' });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    logger.error('OAuth callback attempted but GitHub credentials not configured');
    return res.status(500).json({ error: 'OAuth not configured' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code as string,
        redirect_uri: `${BASE_URL}/oauth/callback`
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token, error } = tokenResponse.data;

    if (error || !access_token) {
      logger.error('GitHub OAuth token exchange failed', { error });
      return res.status(500).json({ error: 'Failed to exchange code for token' });
    }

    // Store the access token
    tokenStore.set(state as string, {
      access_token,
      created_at: Date.now()
    });

    logger.info('OAuth flow completed successfully', { state });

    // Return success page
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #667eea;
              margin: 0 0 20px 0;
            }
            p {
              color: #666;
              margin: 0;
            }
            .check {
              font-size: 64px;
              color: #4CAF50;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="check">✓</div>
            <h1>Authentication Successful!</h1>
            <p>You can now close this window and return to ChatGPT.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    logger.error('OAuth callback error', {
      error: error.message,
      response: error.response?.data
    });
    res.status(500).json({
      error: 'OAuth authentication failed',
      details: error.message
    });
  }
});

// Step 3: Token endpoint for ChatGPT Connector
app.post('/oauth/token', async (req: Request, res: Response) => {
  const { code, redirect_uri } = req.body;

  if (!code) {
    logger.error('Token endpoint called without code');
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    logger.error('Token endpoint called but GitHub credentials not configured');
    return res.status(500).json({ error: 'OAuth not configured' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code as string,
        redirect_uri: redirect_uri || `${BASE_URL}/oauth/callback`
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const { access_token, error } = tokenResponse.data;

    if (error || !access_token) {
      logger.error('GitHub token exchange failed in /oauth/token', { error });
      return res.status(400).json({ error: error || 'Failed to exchange code for token' });
    }

    logger.info('Token issued successfully via /oauth/token');

    // Return token in OAuth2 format
    res.json({
      access_token,
      token_type: 'bearer',
      scope: 'user:email'
    });
  } catch (error: any) {
    logger.error('Token endpoint error', {
      error: error.message,
      response: error.response?.data
    });
    res.status(500).json({
      error: 'Token exchange failed',
      details: error.message
    });
  }
});

// ==========================================
// Unified MCP Server Routes (Bearer Token required)
// ==========================================

// MCP Router status endpoint
app.get('/mcp/status', bearerAuth, async (req: Request, res: Response) => {
  const router = getMCPRouter();
  const status = router.getStatus();
  res.json(status);
});

// MCP Router tools listing endpoint
app.get('/mcp/tools', bearerAuth, async (req: Request, res: Response) => {
  try {
    const router = getMCPRouter();
    const tools = await router.listAllTools();
    res.json(tools);
  } catch (error: any) {
    logger.error('Failed to list tools', { error: error.message });
    res.status(500).json({
      error: 'Failed to list tools',
      message: error.message
    });
  }
});

// Tmux MCP Server endpoint
app.post('/mcp/tmux', apiLimiter, bearerAuth, promptInjectionGuard, async (req: Request, res: Response) => {
  try {
    const router = getMCPRouter();
    const { method, params } = req.body;

    if (method === 'tools/list') {
      const result = await router.getServer('tmux')?.listTools();
      return res.json(result);
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const result = await router.callTool('tmux', name, args);
      return res.json(result);
    } else {
      return res.status(400).json({
        error: 'Unknown method',
        available: ['tools/list', 'tools/call']
      });
    }
  } catch (error: any) {
    logger.error('Tmux MCP error', { error: error.message });
    return res.status(500).json({
      error: 'Tmux MCP server error',
      message: error.message
    });
  }
});

// Rules MCP Server endpoint
app.post('/mcp/rules', apiLimiter, bearerAuth, promptInjectionGuard, async (req: Request, res: Response) => {
  try {
    const router = getMCPRouter();
    const { method, params } = req.body;

    if (method === 'tools/list') {
      const result = await router.getServer('rules')?.listTools();
      return res.json(result);
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const result = await router.callTool('rules', name, args);
      return res.json(result);
    } else {
      return res.status(400).json({
        error: 'Unknown method',
        available: ['tools/list', 'tools/call']
      });
    }
  } catch (error: any) {
    logger.error('Rules MCP error', { error: error.message });
    return res.status(500).json({
      error: 'Rules MCP server error',
      message: error.message
    });
  }
});

// Obsidian MCP Server endpoint
app.post('/mcp/obsidian', apiLimiter, bearerAuth, promptInjectionGuard, async (req: Request, res: Response) => {
  try {
    const router = getMCPRouter();
    const { method, params } = req.body;

    if (method === 'tools/list') {
      const result = await router.getServer('obsidian')?.listTools();
      return res.json(result);
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const result = await router.callTool('obsidian', name, args);
      return res.json(result);
    } else {
      return res.status(400).json({
        error: 'Unknown method',
        available: ['tools/list', 'tools/call']
      });
    }
  } catch (error: any) {
    logger.error('Obsidian MCP error', { error: error.message });
    return res.status(500).json({
      error: 'Obsidian MCP server error',
      message: error.message
    });
  }
});

// Society MCP Server endpoint (original mcp-apps-sdk)
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
async function startServer() {
  try {
    // Initialize MCP Router
    console.log('🔄 Initializing MCP Router...');
    const router = getMCPRouter();
    await router.initialize();
    console.log('✅ MCP Router initialized successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV || 'development',
        oauthEnabled: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
      });

      console.log();
      console.log(`🚀 Miyabi Unified MCP Gateway running on port ${PORT}`);
      console.log(`   Base URL: ${BASE_URL}`);
      console.log(`   Health: ${BASE_URL}/health`);
      console.log();
      console.log('📡 MCP Endpoints:');
      console.log(`   Society (Business Agents): ${BASE_URL}/mcp`);
      console.log(`   Tmux (Session Control):    ${BASE_URL}/mcp/tmux`);
      console.log(`   Rules (CLAUDE.md):         ${BASE_URL}/mcp/rules`);
      console.log(`   Obsidian (Knowledge):      ${BASE_URL}/mcp/obsidian`);
      console.log(`   Status:                    ${BASE_URL}/mcp/status`);
      console.log(`   Tools List:                ${BASE_URL}/mcp/tools`);
      console.log();
      console.log('🔐 Security:');
      console.log(`   Bearer Token: ${!!process.env.MIYABI_BEARER_TOKEN ? '✅ Set' : '⚠️  Not set (dev mode)'}`);
      console.log(`   Rate Limiting: ✅ Enabled (30 req/min)`);
      console.log(`   Audit Logging: ✅ Enabled`);
      console.log(`   CORS: ✅ Restricted`);
      console.log(`   Prompt Injection Guard: ✅ Active`);
      console.log();
      console.log('🔑 OAuth2:');
      console.log(`   GitHub OAuth: ${GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET ? '✅ Configured' : '⚠️  Not configured'}`);
      if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
        console.log(`   Authorization URL: ${BASE_URL}/oauth/authorize`);
        console.log(`   Token URL: ${BASE_URL}/oauth/token`);
        console.log(`   Callback URL: ${BASE_URL}/oauth/callback`);
      }

      if (!process.env.MIYABI_BEARER_TOKEN) {
        console.log();
        console.log('   ⚠️  Running in development mode (no bearer authentication)');
      }

      console.log();
      console.log('📊 MCP Servers:');
      const status = router.getStatus();
      console.log(`   Total: ${status.total} servers`);
      console.log(`   Ready: ${status.ready}/${status.total}`);
      Object.entries(status.servers).forEach(([name, info]: [string, any]) => {
        console.log(`   - ${name}: ${info.ready ? '✅' : '❌'}`);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      router.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      router.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Server startup failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

startServer();
