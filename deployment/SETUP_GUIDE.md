# Miyabi Web UI - Self-Hosted Deployment Guide

**Version**: 1.0  
**Target Platform**: macOS (Mac mini)  
**Updated**: 2025-10-22

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [GitHub Actions Runner Setup](#github-actions-runner-setup)
7. [Service Management](#service-management)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS**: macOS 13+ (Ventura or later)
- **CPU**: 4 cores or more
- **RAM**: 8GB or more
- **Disk**: 50GB free space

### Software Requirements

Install the following tools:

```bash
# 1. Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 3. PostgreSQL 15
brew install postgresql@15
brew services start postgresql@15

# 4. Redis
brew install redis
brew services start redis

# 5. Node.js 20
brew install node@20

# 6. Git
brew install git
```

---

## Environment Setup

### 1. Clone Repository

```bash
cd ~/dev
git clone https://github.com/customer-cloud/miyabi-private.git
cd miyabi-private
```

### 2. Create Environment File

Create `.env` file in the project root:

```bash
cat > .env << 'EOF'
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/miyabi
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-change-me-to-a-random-string
JWT_EXPIRATION=604800  # 7 days in seconds

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_REDIRECT_URI=https://api.miyabi.dev/api/auth/github/callback

# API Server
API_HOST=0.0.0.0
API_PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=https://api.miyabi.dev

# LINE Bot (optional)
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
LINE_CHANNEL_SECRET=your-line-channel-secret

# OpenAI (for LINE Bot NLP)
OPENAI_API_KEY=your-openai-api-key

# Logging
RUST_LOG=info
EOF
```

### 3. Set Permissions

```bash
chmod 600 .env
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE miyabi;

# Exit
\q
```

### 2. Run Migrations

```bash
# Install SQLx CLI
cargo install sqlx-cli --no-default-features --features postgres

# Run migrations
cd database
sqlx migrate run --database-url postgres://postgres:postgres@localhost:5432/miyabi
```

### 3. Verify Tables

```bash
psql miyabi

# List tables
\dt

# Should show:
# - web_users
# - repositories
# - agent_executions
# - workflows
# - line_messages
# - websocket_connections

# Exit
\q
```

---

## Backend Deployment

### 1. Build Backend

```bash
cd ~/dev/miyabi-private

# Build release binary
cargo build --release --package miyabi-web-api

# Binary location: target/release/miyabi-web-api
```

### 2. Install Binary

```bash
# Copy binary to /usr/local/bin
sudo cp target/release/miyabi-web-api /usr/local/bin/
sudo chmod +x /usr/local/bin/miyabi-web-api
```

### 3. Install systemd Service (macOS uses launchd, but we provide systemd example)

**Note**: macOS uses `launchd` instead of `systemd`. For production, convert to `.plist` format.

For Linux servers (if deploying to Linux):

```bash
# Copy service file
sudo cp deployment/miyabi-web-api.service /etc/systemd/system/

# Edit environment variables
sudo nano /etc/systemd/system/miyabi-web-api.service

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable miyabi-web-api

# Start service
sudo systemctl start miyabi-web-api

# Check status
sudo systemctl status miyabi-web-api
```

For macOS (launchd):

Create `~/Library/LaunchAgents/com.miyabi.web-api.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.miyabi.web-api</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/miyabi-web-api</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/a003/dev/miyabi-private</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>DATABASE_URL</key>
        <string>postgres://postgres:postgres@localhost:5432/miyabi</string>
        <key>REDIS_URL</key>
        <string>redis://localhost:6379</string>
        <key>RUST_LOG</key>
        <string>info</string>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/a003/dev/miyabi-private/logs/web-api.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/a003/dev/miyabi-private/logs/web-api-error.log</string>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Load service:

```bash
launchctl load ~/Library/LaunchAgents/com.miyabi.web-api.plist
launchctl start com.miyabi.web-api
```

### 4. Test API

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","version":"1.0.0"}
```

---

## Frontend Deployment

### 1. Install Dependencies

```bash
cd miyabi-web
npm ci
```

### 2. Build Frontend

```bash
npm run build
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables on Vercel**:

```
NEXT_PUBLIC_API_URL=https://api.miyabi.dev
```

---

## GitHub Actions Runner Setup

### 1. Download Runner

```bash
cd ~/actions-runner

# Download latest runner
curl -o actions-runner-osx-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz

# Extract
tar xzf actions-runner-osx-x64-2.311.0.tar.gz
```

### 2. Configure Runner

```bash
# Replace with your repository URL and token
./config.sh --url https://github.com/customer-cloud/miyabi-private \
  --token YOUR_GITHUB_RUNNER_TOKEN

# When prompted:
# - Enter the name of the runner: miyabi-web-runner
# - Enter any additional labels: self-hosted,macOS,X64
# - Enter name of work folder: _work
```

### 3. Install as Service

```bash
# Install
sudo ./svc.sh install

# Start
sudo ./svc.sh start

# Status
sudo ./svc.sh status
```

### 4. Verify Runner

Go to GitHub repository:
- Settings → Actions → Runners
- You should see your runner listed as "Online"

---

## Service Management

### Backend Service Commands

**macOS (launchd)**:

```bash
# Start
launchctl start com.miyabi.web-api

# Stop
launchctl stop com.miyabi.web-api

# Restart
launchctl stop com.miyabi.web-api
launchctl start com.miyabi.web-api

# View logs
tail -f ~/dev/miyabi-private/logs/web-api.log
```

**Linux (systemd)**:

```bash
# Start
sudo systemctl start miyabi-web-api

# Stop
sudo systemctl stop miyabi-web-api

# Restart
sudo systemctl restart miyabi-web-api

# Status
sudo systemctl status miyabi-web-api

# Logs
sudo journalctl -u miyabi-web-api -f
```

---

## Monitoring

### 1. Logs

```bash
# Backend logs
tail -f ~/dev/miyabi-private/logs/web-api.log

# PostgreSQL logs
tail -f /usr/local/var/log/postgresql@15.log

# Redis logs
tail -f /usr/local/var/log/redis.log
```

### 2. Process Monitoring

```bash
# Check if API is running
ps aux | grep miyabi-web-api

# Check port
lsof -i :3001
```

### 3. Database Monitoring

```bash
# Connect to DB
psql miyabi

# Check active connections
SELECT * FROM pg_stat_activity;

# Check table sizes
SELECT
  schemaname || '.' || tablename AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

---

## Troubleshooting

### Issue: API not starting

```bash
# Check logs
tail -f ~/dev/miyabi-private/logs/web-api-error.log

# Common causes:
# 1. Database connection failed
#    → Check DATABASE_URL in .env
#    → Verify PostgreSQL is running: brew services list

# 2. Port already in use
#    → Check: lsof -i :3001
#    → Kill process: kill -9 <PID>

# 3. Missing environment variables
#    → Check .env file
#    → Verify all required variables are set
```

### Issue: Database migration failed

```bash
# Check migration status
cd database
sqlx migrate info --database-url postgres://postgres:postgres@localhost:5432/miyabi

# Revert last migration
sqlx migrate revert --database-url postgres://postgres:postgres@localhost:5432/miyabi

# Re-run migrations
sqlx migrate run --database-url postgres://postgres:postgres@localhost:5432/miyabi
```

### Issue: Frontend build failed

```bash
# Clean node_modules
cd miyabi-web
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

### Issue: GitHub Actions Runner offline

```bash
# Check status
cd ~/actions-runner
sudo ./svc.sh status

# Restart
sudo ./svc.sh stop
sudo ./svc.sh start

# View logs
tail -f ~/actions-runner/_diag/Runner_*.log
```

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set up firewall rules to restrict API access
- [ ] Enable PostgreSQL SSL connections
- [ ] Configure HTTPS with Let's Encrypt
- [ ] Set up regular database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting

---

## Backup & Recovery

### Database Backup

```bash
# Manual backup
pg_dump miyabi > backup-$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * pg_dump miyabi > /backups/miyabi-$(date +\%Y\%m\%d).sql
```

### Restore Database

```bash
# Stop API
launchctl stop com.miyabi.web-api

# Drop and recreate database
psql postgres -c "DROP DATABASE miyabi;"
psql postgres -c "CREATE DATABASE miyabi;"

# Restore
psql miyabi < backup-20251022.sql

# Start API
launchctl start com.miyabi.web-api
```

---

## Performance Tuning

### PostgreSQL Tuning

Edit `/usr/local/var/postgresql@15/postgresql.conf`:

```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
```

Restart PostgreSQL:

```bash
brew services restart postgresql@15
```

---

## Next Steps

- [ ] Set up DNS for `api.miyabi.dev`
- [ ] Configure SSL/TLS with Let's Encrypt
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure backup automation
- [ ] Set up alert notifications (Slack/Discord)
- [ ] Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-22  
**Contact**: Miyabi Team
