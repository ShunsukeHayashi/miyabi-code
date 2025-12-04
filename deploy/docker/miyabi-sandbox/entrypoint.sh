#!/bin/bash
# Miyabi Sandbox Entrypoint Script
# Initializes the sandbox environment on container start

set -e

echo "🚀 Starting Miyabi Sandbox..."
echo "================================"

# ============================================
# Environment Validation
# ============================================

required_vars=(
    "MIYABI_USER_ID"
    "MIYABI_REPO_OWNER"
    "MIYABI_REPO_NAME"
    "GITHUB_TOKEN"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✅ Environment validated"

# ============================================
# Git Configuration
# ============================================

echo "📝 Configuring Git..."

git config --global user.name "${MIYABI_USER_GITHUB:-Miyabi Sandbox}"
git config --global user.email "${MIYABI_USER_EMAIL:-sandbox@miyabi-world.com}"
git config --global init.defaultBranch main
git config --global pull.rebase false

# Store GitHub token for HTTPS auth
git config --global credential.helper store
echo "https://${MIYABI_USER_GITHUB:-oauth}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

echo "✅ Git configured"

# ============================================
# GitHub CLI Authentication
# ============================================

echo "🔐 Authenticating GitHub CLI..."

echo "${GITHUB_TOKEN}" | gh auth login --with-token 2>/dev/null || true
gh auth status 2>/dev/null || echo "⚠️ GitHub CLI auth may require re-login"

echo "✅ GitHub CLI ready"

# ============================================
# Clone Repository
# ============================================

REPO_URL="https://github.com/${MIYABI_REPO_OWNER}/${MIYABI_REPO_NAME}.git"
REPO_DIR="/workspace/${MIYABI_REPO_NAME}"

if [ -d "$REPO_DIR" ]; then
    echo "📂 Repository already exists, pulling latest..."
    cd "$REPO_DIR"
    git pull origin main 2>/dev/null || true
else
    echo "📥 Cloning repository: ${REPO_URL}"
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
fi

echo "✅ Repository ready at: ${REPO_DIR}"

# ============================================
# Miyabi Configuration
# ============================================

echo "⚙️ Setting up Miyabi..."

# Create .miyabi directory if not exists
mkdir -p "${REPO_DIR}/.miyabi"

# Generate config file
cat > "${REPO_DIR}/.miyabi/config.yaml" << EOF
# Miyabi Sandbox Configuration
# Auto-generated on $(date -Iseconds)

project:
  owner: ${MIYABI_REPO_OWNER}
  name: ${MIYABI_REPO_NAME}
  
sandbox:
  id: ${MIYABI_SANDBOX_ID:-unknown}
  user_id: ${MIYABI_USER_ID}
  
agents:
  enabled: true
  auto_assign: true
  
logging:
  level: ${MIYABI_LOG_LEVEL:-info}
EOF

echo "✅ Miyabi configured"

# ============================================
# Install Dependencies
# ============================================

cd "$REPO_DIR"

if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies..."
    npm install --silent 2>/dev/null || true
fi

if [ -f "Cargo.toml" ]; then
    echo "🦀 Checking Rust dependencies..."
    cargo check 2>/dev/null || true
fi

echo "✅ Dependencies ready"

# ============================================
# Start Health Check Server
# ============================================

echo "🏥 Starting health check server..."

# Simple health check server using Node.js
cat > /tmp/health-server.js << 'HEALTHEOF'
const http = require('http');
const os = require('os');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      sandbox_id: process.env.MIYABI_SANDBOX_ID,
      user_id: process.env.MIYABI_USER_ID,
      repo: `${process.env.MIYABI_REPO_OWNER}/${process.env.MIYABI_REPO_NAME}`,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      hostname: os.hostname(),
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      miyabi_cli: 'installed',
      git: 'configured',
      repo: 'cloned',
      ready: true
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Health server listening on port 8080');
});
HEALTHEOF

node /tmp/health-server.js &
HEALTH_PID=$!

echo "✅ Health server started (PID: ${HEALTH_PID})"

# ============================================
# Final Setup
# ============================================

echo ""
echo "================================"
echo "🎉 Miyabi Sandbox Ready!"
echo "================================"
echo ""
echo "📋 Sandbox Info:"
echo "   User ID:    ${MIYABI_USER_ID}"
echo "   Sandbox:    ${MIYABI_SANDBOX_ID:-unknown}"
echo "   Repository: ${MIYABI_REPO_OWNER}/${MIYABI_REPO_NAME}"
echo "   Workdir:    ${REPO_DIR}"
echo ""
echo "🛠️ Available Tools:"
echo "   miyabi   - Miyabi CLI"
echo "   gh       - GitHub CLI"
echo "   git      - Git"
echo "   node     - Node.js $(node --version)"
echo "   cargo    - Rust $(cargo --version | cut -d' ' -f2)"
echo ""
echo "💡 Quick Start:"
echo "   cd ${REPO_DIR}"
echo "   miyabi status"
echo "   miyabi agent run codegen --task 'your task'"
echo ""
echo "================================"

# ============================================
# Execute Command
# ============================================

cd "$REPO_DIR"

if [ "$#" -gt 0 ]; then
    exec "$@"
else
    # Keep container running
    echo "🔄 Container running. Use 'docker exec' or ECS Exec to connect."
    
    # Start tmux session
    tmux new-session -d -s main -c "$REPO_DIR" 2>/dev/null || true
    
    # Wait indefinitely
    tail -f /dev/null
fi
