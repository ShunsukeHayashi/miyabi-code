# Miyabi A2A Dashboard - Deployment Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-22
**Feature**: Production-Ready Error Recovery System

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Build Instructions](#build-instructions)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Options](#deployment-options)
5. [Health Checks](#health-checks)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Hardware Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 2 GB
- Disk: 1 GB free space

**Recommended**:
- CPU: 4 cores
- RAM: 4 GB
- Disk: 5 GB free space

### Software Requirements

**Backend**:
- Rust: 1.70+ (2021 Edition)
- Operating System: Linux, macOS, or Windows
- Network: WebSocket support required

**Frontend**:
- Node.js: 18.x or 20.x LTS
- npm: 9.x or 10.x

**External Dependencies**:
- GitHub API access (for task storage)
- Network connectivity for WebSocket connections

---

## 🔨 Build Instructions

### Backend Build

#### Development Build
```bash
# Navigate to project root
cd /path/to/miyabi-private

# Build the miyabi-a2a package
cargo build --package miyabi-a2a

# Build the dashboard server binary
cargo build --bin dashboard-server

# Binary location: target/debug/dashboard-server
```

#### Production Build (Optimized)
```bash
# Build with release optimizations
cargo build --release --package miyabi-a2a
cargo build --release --bin dashboard-server

# Binary location: target/release/dashboard-server
# Size: ~15-20 MB (optimized, single binary)
```

#### Build Verification
```bash
# Run integration tests
cargo test --package miyabi-a2a --test error_recovery_tests

# Expected output: 9 passed, 0 failed
```

### Frontend Build

#### Development Build
```bash
cd crates/miyabi-a2a/dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Server runs at: http://localhost:5173
```

#### Production Build
```bash
cd crates/miyabi-a2a/dashboard

# Build for production
npm run build

# Output: dist/ directory
# Size: ~1.5 MB (gzipped assets)
```

#### Serve Production Build
```bash
# Preview production build locally
npm run preview

# Server runs at: http://localhost:4173
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file or set environment variables:

```bash
# GitHub API Configuration (Required)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=YourOrganization
GITHUB_REPO=YourRepository

# Server Configuration (Optional)
HOST=127.0.0.1
PORT=3001

# Device Identifier (Optional)
DEVICE_IDENTIFIER=production-server-01
```

### Environment Variable Details

#### GITHUB_TOKEN
- **Purpose**: GitHub API authentication for task storage
- **Format**: Personal Access Token (classic) with `repo` scope
- **How to get**: GitHub Settings → Developer settings → Personal access tokens
- **Security**: **NEVER commit to git**. Use secrets management.

#### GITHUB_OWNER
- **Purpose**: GitHub repository owner (user or organization name)
- **Default**: `ShunsukeHayashi`
- **Example**: `mycompany` or `myusername`

#### GITHUB_REPO
- **Purpose**: GitHub repository name for task storage
- **Default**: `Miyabi`
- **Example**: `my-project`

#### HOST
- **Purpose**: Server bind address
- **Default**: `127.0.0.1` (localhost only)
- **Production**: Use `0.0.0.0` to accept external connections
- **Security**: Use firewall rules to restrict access

#### PORT
- **Purpose**: HTTP server port
- **Default**: `3001`
- **Production**: Common choices: `3001`, `8080`, `3000`

### Frontend Environment Variables

Create `crates/miyabi-a2a/dashboard/.env`:

```bash
# API Endpoint
VITE_API_URL=http://localhost:3001

# Optional: API Key (if using authentication)
VITE_API_KEY=
```

---

## 🚀 Deployment Options

### Option 1: Single Server Deployment

**Architecture**: Backend + Frontend on same server

#### Step 1: Build Backend
```bash
cargo build --release --bin dashboard-server
```

#### Step 2: Build Frontend
```bash
cd crates/miyabi-a2a/dashboard
npm run build
```

#### Step 3: Start Backend
```bash
# Set environment variables
export GITHUB_TOKEN=ghp_xxx
export GITHUB_OWNER=YourOrg
export GITHUB_REPO=YourRepo
export HOST=0.0.0.0
export PORT=3001

# Start server
./target/release/dashboard-server
```

#### Step 4: Serve Frontend
```bash
# Option A: Use a web server (nginx, Apache)
# Serve files from: crates/miyabi-a2a/dashboard/dist/

# Option B: Use npm preview
cd crates/miyabi-a2a/dashboard
npm run preview
```

### Option 2: Separate Server Deployment

**Architecture**: Backend server + Frontend CDN/static hosting

#### Backend Server
```bash
# Production server (Linux)
cargo build --release --bin dashboard-server

# Copy binary to server
scp target/release/dashboard-server user@server:/opt/miyabi/

# On server: Create systemd service
sudo nano /etc/systemd/system/miyabi-dashboard.service
```

**systemd service file** (`/etc/systemd/system/miyabi-dashboard.service`):
```ini
[Unit]
Description=Miyabi A2A Dashboard Server
After=network.target

[Service]
Type=simple
User=miyabi
WorkingDirectory=/opt/miyabi
Environment="GITHUB_TOKEN=ghp_xxx"
Environment="GITHUB_OWNER=YourOrg"
Environment="GITHUB_REPO=YourRepo"
Environment="HOST=0.0.0.0"
Environment="PORT=3001"
ExecStart=/opt/miyabi/dashboard-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Start service**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable miyabi-dashboard
sudo systemctl start miyabi-dashboard
sudo systemctl status miyabi-dashboard
```

#### Frontend Hosting
```bash
# Build frontend
cd crates/miyabi-a2a/dashboard
npm run build

# Deploy to CDN/static hosting
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - AWS S3: aws s3 sync dist/ s3://your-bucket/
# - GitHub Pages: Use gh-pages or GitHub Actions
```

### Option 3: Docker Deployment

**Coming Soon**: Docker Compose setup for containerized deployment

---

## 🏥 Health Checks

### Backend Health Check

**Endpoint**: `GET /health` (not yet implemented)

**Manual check**:
```bash
# Check if server is listening
curl http://localhost:3001/api/agents

# Expected: JSON response with agents list
```

**WebSocket check**:
```bash
# Using websocat (install: cargo install websocat)
websocat ws://localhost:3001/ws

# Expected: WebSocket connection established
# You should receive periodic updates
```

### Frontend Health Check

**Manual check**:
```bash
# Check if frontend is accessible
curl http://localhost:5173/  # Dev
curl http://localhost:4173/  # Preview

# Expected: HTML response
```

### Integration Health Check

1. Open browser: `http://localhost:5173`
2. Check console for WebSocket connection: `[WebSocket Context] Connected`
3. Verify agent cards are displayed
4. Check Error Dashboard for retry/cancel buttons

---

## 📊 Monitoring & Logging

### Backend Logging

**Log Level**: Configured via `RUST_LOG` environment variable

```bash
# Enable all logs
export RUST_LOG=debug

# Filter by module
export RUST_LOG=miyabi_a2a=debug,tower_http=info

# Production (info level)
export RUST_LOG=info
```

**Log Output**:
```
2025-10-22T04:20:00.123Z INFO  [miyabi_a2a::http::server] 🚀 Starting Miyabi Dashboard API Server...
2025-10-22T04:20:00.456Z INFO  [miyabi_a2a::http::server] 📡 WebSocket endpoint: ws://127.0.0.1:3001/ws
2025-10-22T04:20:01.789Z INFO  [miyabi_a2a::http::websocket] WebSocket client connected
```

### Key Metrics to Monitor

**Backend**:
- WebSocket connections: Number of active clients
- Task retry rate: Retries per hour
- Error rate: Failed tasks per hour
- API response time: P50, P95, P99

**Frontend**:
- WebSocket reconnection rate
- Browser notification delivery rate
- UI responsiveness (Core Web Vitals)

### Recommended Monitoring Tools

- **Logs**: `journalctl -u miyabi-dashboard -f` (systemd)
- **Metrics**: Prometheus + Grafana
- **APM**: Datadog, New Relic, Sentry
- **Uptime**: UptimeRobot, Pingdom

---

## 🔧 Troubleshooting

### Backend Issues

#### Issue: Server fails to start
**Symptom**: `Error: GITHUB_TOKEN environment variable is required`

**Solution**:
```bash
export GITHUB_TOKEN=ghp_xxx
export GITHUB_OWNER=YourOrg
export GITHUB_REPO=YourRepo
```

#### Issue: WebSocket connection refused
**Symptom**: Frontend console error: `WebSocket connection failed`

**Solution**:
1. Check backend is running: `curl http://localhost:3001/api/agents`
2. Verify WebSocket endpoint: `ws://localhost:3001/ws`
3. Check CORS configuration (if frontend on different domain)

#### Issue: Task storage errors
**Symptom**: `Failed to fetch task: Storage error`

**Solution**:
1. Verify GitHub token has `repo` scope
2. Check GitHub API rate limits: https://api.github.com/rate_limit
3. Verify repository exists and token has access

### Frontend Issues

#### Issue: Build fails
**Symptom**: `npm run build` errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Issue: WebSocket not connecting
**Symptom**: Dashboard shows "Disconnected" status

**Solution**:
1. Check `VITE_API_URL` in `.env`
2. Verify backend WebSocket endpoint is accessible
3. Check browser console for detailed error messages

#### Issue: Retry/Cancel buttons not working
**Symptom**: Button click has no effect

**Solution**:
1. Check browser console for API errors
2. Verify backend `/api/tasks/{id}/retry` endpoint is accessible
3. Check task is in correct state (Failed for retry, Submitted/Working for cancel)

### Network Issues

#### Issue: CORS errors
**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Solution**: Configure CORS in backend (future enhancement needed)

#### Issue: WebSocket disconnects frequently
**Symptom**: Constant reconnections in logs

**Solution**:
1. Check network stability
2. Increase WebSocket timeout (if behind proxy)
3. Check firewall/load balancer settings

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] Backend builds successfully (`cargo build --release`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] All tests pass (`cargo test`)
- [ ] Environment variables configured
- [ ] GitHub API token is valid and has correct permissions

### Deployment

- [ ] Backend server started and accessible
- [ ] WebSocket endpoint accessible
- [ ] Frontend served and accessible
- [ ] WebSocket connection established in browser
- [ ] Retry/Cancel buttons functional
- [ ] Browser notifications working (optional)

### Post-Deployment

- [ ] Health checks passing
- [ ] Logs are being collected
- [ ] Monitoring dashboards configured
- [ ] Backup strategy in place (if using local storage)
- [ ] Documentation updated with production URLs

---

## 🔐 Security Considerations

### Secrets Management

**DO NOT**:
- ❌ Commit `.env` files to git
- ❌ Include tokens in source code
- ❌ Log sensitive information

**DO**:
- ✅ Use environment variables
- ✅ Use secrets managers (AWS Secrets Manager, HashiCorp Vault)
- ✅ Rotate tokens regularly
- ✅ Use least-privilege access tokens

### Network Security

**Recommendations**:
- Use HTTPS in production (TLS certificate)
- Restrict server access with firewall rules
- Use VPN or private network for internal deployments
- Implement rate limiting (future enhancement)

---

## 📚 Additional Resources

### Documentation
- [Main README](../../README.md)
- [API Reference](./API_REFERENCE.md)
- [Error Recovery Guide](./ERROR_RECOVERY_GUIDE.md)

### Support
- GitHub Issues: https://github.com/ShunsukeHayashi/Miyabi/issues
- Contact: (your-email@example.com)

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2025-10-22
**Maintained by**: Claude Code (AI Assistant)
