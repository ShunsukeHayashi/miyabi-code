# Miyabi SSE MCP Server - Code Analysis

**Analyzed**: 2025-11-21
**File**: `miyabi-sse-mcp-server.js`
**Purpose**: Claude.ai Web → MAJIN → Mac Local Claude Code 通信

---

## 🎯 Architecture Overview

### System Flow
```
Claude.ai Web App (Browser)
    ↓ SSE Connection
MAJIN (54.92.67.11:3002) - SSE MCP Server
    ↓ HTTP Polling
Mac Local (localhost:3003) - Task Executor
    ↓ tmux commands
Claude Code Instances (各Pane)
```

### Component Roles
1. **MAJIN SSE Server**: Public endpoint, task queue management
2. **Mac Local Poller**: Task execution, tmux control
3. **Claude Code Panes**: Actual task execution

---

## ✅ Strengths

### 1. Architecture
- ✅ **Clean separation**: Public endpoint vs local executor
- ✅ **MCP Protocol compliant**: Proper JSON-RPC 2.0 implementation
- ✅ **SSE for real-time**: Efficient server-push notifications
- ✅ **Task queue system**: Handles async operations well

### 2. MCP Implementation
- ✅ **Protocol version**: MCP 2024-11-05
- ✅ **Tool definitions**: Well-structured with JSON Schema
- ✅ **5 tools implemented**:
  - `send_task` - Submit tasks
  - `get_output` - Retrieve pane output
  - `list_sessions` - tmux session list
  - `get_status` - System status
  - `get_task_result` - Task result retrieval

### 3. Features
- ✅ **Task tracking**: UUID-based task IDs
- ✅ **Priority system**: High/Normal/Low
- ✅ **Result caching**: Task results stored in Map
- ✅ **Broadcasting**: SSE clients get notifications
- ✅ **Health endpoint**: `/health` for monitoring

---

## ⚠️ Issues & Risks

### 🔴 Critical Security Issues

#### 1. **No Authentication**
```javascript
app.use(cors({
  origin: '*',  // ❌ Accepts ALL origins
  ...
}));
```
**Risk**: Anyone can access the server
**Impact**: P0 - Critical

#### 2. **No API Key Protection**
```javascript
app.post('/messages', async (req, res) => {
  // ❌ No auth check
  const { jsonrpc, id, method, params } = req.body;
  ...
});
```
**Risk**: Unauthorized command execution
**Impact**: P0 - Critical

#### 3. **Public Task Submission**
```javascript
app.get('/api/tasks', (req, res) => {
  // ❌ Anyone can fetch tasks
  const pendingTasks = taskQueue.filter(...);
  ...
});
```
**Risk**: Task queue exposure
**Impact**: P0 - Critical

### 🟡 Medium Priority Issues

#### 4. **Memory Leak Risk**
```javascript
const taskResults = new Map();
// ❌ No size limit, no cleanup
```
**Risk**: Unlimited Map growth
**Impact**: P1 - Memory exhaustion over time

#### 5. **No Rate Limiting**
```javascript
app.post('/messages', async (req, res) => {
  // ❌ No rate limit
  ...
});
```
**Risk**: DoS attack possible
**Impact**: P1 - Service disruption

#### 6. **Hardcoded Mac Local URL**
```javascript
const MAC_LOCAL_POLL_ENDPOINT = 'http://localhost:3003/api/tasks';
// ❌ Not configurable
```
**Risk**: Deployment inflexibility
**Impact**: P2 - Operational

#### 7. **No Request Validation**
```javascript
async function executeSendTask(args) {
  const task = {
    task: args.task,  // ❌ No sanitization
    pane_id: args.pane_id || '%9',  // ❌ No validation
    ...
  };
}
```
**Risk**: Injection attacks, invalid input
**Impact**: P1 - Security

### 🟢 Low Priority Issues

#### 8. **No Logging Framework**
```javascript
console.log(`📥 Task queued: ${taskId}`);
// ❌ Only console.log, no structured logging
```
**Impact**: P2 - Debugging difficulty

#### 9. **No Metrics**
```javascript
// ❌ No Prometheus/statsd metrics
```
**Impact**: P2 - Monitoring

#### 10. **No Graceful Shutdown**
```javascript
app.listen(PORT, '0.0.0.0', () => {
  // ❌ No SIGTERM handler
});
```
**Impact**: P2 - Deployment

---

## 🔧 Improvement Proposals

### Priority 0: Security (Immediate)

#### 1. Add API Key Authentication
```javascript
const API_KEY = process.env.MIYABI_API_KEY || 'GENERATE_SECURE_KEY';

function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Apply to all endpoints
app.use('/messages', authenticateRequest);
app.use('/api', authenticateRequest);
```

#### 2. Restrict CORS
```javascript
const ALLOWED_ORIGINS = [
  'https://claude.ai',
  'https://your-domain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

#### 3. Input Validation (Zod)
```javascript
const { z } = require('zod');

const SendTaskSchema = z.object({
  task: z.string().min(1).max(10000),
  pane_id: z.string().regex(/^%\d+$/),
  priority: z.enum(['high', 'normal', 'low']).default('normal')
});

async function executeSendTask(args) {
  const validated = SendTaskSchema.parse(args);
  // ... use validated data
}
```

### Priority 1: Reliability

#### 4. Task Result Cleanup
```javascript
const MAX_TASK_RESULTS = 1000;
const TASK_RESULT_TTL = 3600000; // 1 hour

function cleanupOldTasks() {
  const now = Date.now();
  
  for (const [id, task] of taskResults.entries()) {
    const age = now - new Date(task.created_at).getTime();
    
    if (age > TASK_RESULT_TTL || taskResults.size > MAX_TASK_RESULTS) {
      taskResults.delete(id);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldTasks, 300000);
```

#### 5. Rate Limiting (express-rate-limit)
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests'
});

app.use('/messages', limiter);
app.use('/api', limiter);
```

#### 6. Request Timeout
```javascript
const TIMEOUT_MS = 30000;

app.use((req, res, next) => {
  req.setTimeout(TIMEOUT_MS, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});
```

### Priority 2: Operations

#### 7. Structured Logging (Winston)
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Task queued', { taskId, task: args.task });
```

#### 8. Prometheus Metrics
```javascript
const promClient = require('prom-client');

const register = new promClient.Registry();

const taskCounter = new promClient.Counter({
  name: 'miyabi_tasks_total',
  help: 'Total tasks processed',
  labelNames: ['status']
});

const queueGauge = new promClient.Gauge({
  name: 'miyabi_queue_length',
  help: 'Current queue length'
});

register.registerMetric(taskCounter);
register.registerMetric(queueGauge);

// Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### 9. Graceful Shutdown
```javascript
let server;

function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close SSE connections
    sseClients.forEach(client => {
      try {
        client.end();
      } catch (e) {}
    });
    
    process.exit(0);
  });
  
  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server started on port ${PORT}`);
});
```

---

## 📦 Additional Dependencies Needed

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "zod": "^3.22.4",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "prom-client": "^15.1.0",
    "helmet": "^7.1.0"
  }
}
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Add API key authentication
- [ ] Configure CORS whitelist
- [ ] Add input validation
- [ ] Set up structured logging
- [ ] Configure rate limiting

### MAJIN Setup
- [ ] Install Node.js dependencies
- [ ] Set environment variables
- [ ] Configure firewall (port 3002)
- [ ] Set up systemd service
- [ ] Configure Nginx reverse proxy (SSL)

### Monitoring
- [ ] Prometheus scraping
- [ ] Log aggregation (CloudWatch/ELK)
- [ ] Health check alerts
- [ ] Task queue monitoring

### Security
- [ ] HTTPS only (Let's Encrypt)
- [ ] API key rotation plan
- [ ] IP whitelist (optional)
- [ ] DDoS protection

---

## 📊 Performance Considerations

### Current Limitations
- **Memory**: Unbounded task result storage
- **Connections**: No SSE client limit
- **Queue**: No size limit

### Recommendations
- Task results: Max 1000, TTL 1h
- SSE clients: Max 100 concurrent
- Queue: Max 500 tasks
- Request timeout: 30s

---

## 🎯 Summary

**Overall Assessment**: Good foundation, needs security hardening

**Priority Actions**:
1. 🔴 **P0**: Add authentication (API key)
2. 🔴 **P0**: Fix CORS configuration
3. 🔴 **P0**: Add input validation
4. 🟡 **P1**: Implement rate limiting
5. 🟡 **P1**: Add task cleanup
6. 🟢 **P2**: Structured logging
7. 🟢 **P2**: Graceful shutdown

**Estimated Effort**: 1-2 days for P0+P1 fixes

---

**Status**: Ready for hardening
**Next**: Implement security fixes before deployment
