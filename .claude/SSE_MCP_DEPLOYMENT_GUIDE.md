# Miyabi SSE MCP Server - Deployment Guide

**Target**: MAJIN (54.92.67.11)
**Port**: 3002
**Purpose**: Claude.ai Web → MAJIN → Mac Local bridge

---

## 📦 Quick Start

### 1. Prerequisites Check
```bash
# On MAJIN
node --version  # Need >=18.0.0
npm --version
```

### 2. Install Dependencies
```bash
cd ~/miyabi-sse-mcp
npm install
```

### 3. Set Environment Variables
```bash
cat > .env << 'ENVEOF'
PORT=3002
MIYABI_API_KEY=GENERATE_SECURE_32CHAR_KEY_HERE
NODE_ENV=production
MAC_LOCAL_HOST=localhost
MAC_LOCAL_PORT=3003
ENVEOF
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

---

## 🔐 Security Hardening (Required)

### Step 1: Generate API Key
```bash
# Generate secure API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "MIYABI_API_KEY=<generated-key>" >> .env
```

### Step 2: Install Security Packages
```bash
npm install helmet express-rate-limit zod winston
```

### Step 3: Apply Security Fixes

Create `security-middleware.js`:
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

// API Key Middleware
function authenticateRequest(req, res, next) {
  const apiKey = process.env.MIYABI_API_KEY;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: 'Too many requests, please try again later'
});

// CORS Configuration
const ALLOWED_ORIGINS = [
  'https://claude.ai',
  'https://api.claude.ai'
];

function corsConfig() {
  return {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
}

// Input Validation Schemas
const SendTaskSchema = z.object({
  task: z.string().min(1).max(10000),
  pane_id: z.string().regex(/^%\d+$/),
  priority: z.enum(['high', 'normal', 'low']).default('normal')
});

module.exports = {
  authenticateRequest,
  apiLimiter,
  corsConfig,
  SendTaskSchema,
  helmet
};
```

### Step 4: Update Main Server

Add to `index.js` (top):
```javascript
const { 
  authenticateRequest, 
  apiLimiter, 
  corsConfig,
  helmet 
} = require('./security-middleware');

// Apply security headers
app.use(helmet());

// Update CORS
app.use(cors(corsConfig()));

// Apply to protected endpoints
app.use('/messages', authenticateRequest, apiLimiter);
app.use('/api', authenticateRequest, apiLimiter);
```

---

## 🚀 Systemd Service Setup

### Create Service File
```bash
sudo vim /etc/systemd/system/miyabi-sse-mcp.service
```

Content:
```ini
[Unit]
Description=Miyabi SSE MCP Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/miyabi-sse-mcp
Environment=NODE_ENV=production
EnvironmentFile=/home/ubuntu/miyabi-sse-mcp/.env
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=miyabi-sse-mcp

[Install]
WantedBy=multi-user.target
```

### Enable & Start
```bash
sudo systemctl daemon-reload
sudo systemctl enable miyabi-sse-mcp
sudo systemctl start miyabi-sse-mcp
sudo systemctl status miyabi-sse-mcp
```

### Manage Service
```bash
# View logs
sudo journalctl -u miyabi-sse-mcp -f

# Restart
sudo systemctl restart miyabi-sse-mcp

# Stop
sudo systemctl stop miyabi-sse-mcp
```

---

## 🌐 Nginx Reverse Proxy (HTTPS)

### Install Nginx & Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configure Nginx
```bash
sudo vim /etc/nginx/sites-available/miyabi-sse-mcp
```

Content:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE specific
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/miyabi-sse-mcp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Setup SSL (Let's Encrypt)
```bash
sudo certbot --nginx -d your-domain.com
```

---

## 🔥 Firewall Configuration

### AWS Security Group (MAJIN)
```
Inbound Rules:
- Port 22 (SSH): Your IP only
- Port 80 (HTTP): 0.0.0.0/0 (Certbot)
- Port 443 (HTTPS): 0.0.0.0/0
- Port 3002: localhost only (not public)

Outbound Rules:
- All traffic: 0.0.0.0/0
```

### UFW (Ubuntu Firewall)
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 📊 Monitoring Setup

### 1. Health Check Endpoint
Already included: `GET /health`

Test:
```bash
curl https://your-domain.com/health
```

### 2. Prometheus Metrics (Optional)

Install:
```bash
npm install prom-client
```

Add to `index.js`:
```javascript
const promClient = require('prom-client');
const register = new promClient.Registry();

// Metrics
const taskCounter = new promClient.Counter({
  name: 'miyabi_tasks_total',
  help: 'Total tasks',
  labelNames: ['status']
});

const queueGauge = new promClient.Gauge({
  name: 'miyabi_queue_length',
  help: 'Queue length'
});

register.registerMetric(taskCounter);
register.registerMetric(queueGauge);

// Endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

### 3. Uptime Monitoring

Use external service:
- UptimeRobot: https://uptimerobot.com
- Pingdom
- AWS CloudWatch

Configure:
- URL: `https://your-domain.com/health`
- Interval: 5 minutes
- Alert: Email/Slack

---

## 🧪 Testing

### Local Test
```bash
# Health check
curl http://localhost:3002/health

# SSE connection
curl -N http://localhost:3002/sse

# Send task (with auth)
curl -X POST http://localhost:3002/messages \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "initialize",
    "params": {}
  }'
```

### Production Test
```bash
# Health check
curl https://your-domain.com/health

# SSE (from browser console)
const es = new EventSource('https://your-domain.com/sse');
es.onmessage = (e) => console.log(e);
```

---

## 🔧 Troubleshooting

### Issue: Server won't start
```bash
# Check logs
sudo journalctl -u miyabi-sse-mcp -n 50

# Check port
sudo lsof -i :3002

# Check Node version
node --version
```

### Issue: CORS errors
Check:
1. ALLOWED_ORIGINS includes `https://claude.ai`
2. Nginx proxy headers configured
3. SSL certificate valid

### Issue: Authentication fails
Check:
1. `.env` file exists and loaded
2. `MIYABI_API_KEY` set
3. Authorization header format: `Bearer <key>`

### Issue: Mac Local not connecting
Check:
1. Mac Local server running on port 3003
2. SSH tunnel established (if remote)
3. Firewall allows localhost:3003

---

## 📝 Claude.ai Configuration

Add to Claude Desktop config (Mac Local):
```json
{
  "mcpServers": {
    "miyabi-remote": {
      "url": "https://your-domain.com/sse",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

---

## 🔄 Update Procedure

### 1. Pull Latest Code
```bash
cd ~/miyabi-sse-mcp
git pull origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Restart Service
```bash
sudo systemctl restart miyabi-sse-mcp
```

### 4. Verify
```bash
sudo systemctl status miyabi-sse-mcp
curl https://your-domain.com/health
```

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check service status
- [ ] Review error logs
- [ ] Monitor queue length

### Weekly
- [ ] Review access logs
- [ ] Check disk space
- [ ] Verify SSL certificate

### Monthly
- [ ] Update dependencies
- [ ] Rotate API keys
- [ ] Review security logs
- [ ] Update documentation

---

## 🚨 Emergency Procedures

### Service Down
```bash
# Quick restart
sudo systemctl restart miyabi-sse-mcp

# If fails, check logs
sudo journalctl -u miyabi-sse-mcp -n 100 --no-pager

# Manual start for debugging
cd ~/miyabi-sse-mcp
node index.js
```

### High CPU/Memory
```bash
# Check processes
top
htop

# Restart service
sudo systemctl restart miyabi-sse-mcp

# If persists, investigate memory leak
```

### Security Breach
```bash
# 1. Stop service immediately
sudo systemctl stop miyabi-sse-mcp

# 2. Rotate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Update .env with new key
vim .env

# 4. Review access logs
sudo journalctl -u miyabi-sse-mcp | grep -i error

# 5. Restart with new key
sudo systemctl start miyabi-sse-mcp
```

---

**Status**: Ready for deployment after security hardening
**Estimated Setup Time**: 2-3 hours
**Next**: Apply P0 security fixes → Deploy to MAJIN → Test → Monitor
