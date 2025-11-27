#!/bin/bash
# Miyabi OpenAI App - Deploy to MUGEN (EC2)

set -e

echo "🚀 Miyabi OpenAI App - Deploy to MUGEN EC2"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
MUGEN_HOST="mugen"  # SSH host from ~/.ssh/config
MUGEN_USER="ubuntu"
REMOTE_DIR="/home/$MUGEN_USER/miyabi-private/openai-apps/miyabi-app"
LOCAL_DIR="$(pwd)"

# Step 1: Sync code to MUGEN
echo -e "${GREEN}📤 Step 1: Syncing code to MUGEN...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'assets' \
  --exclude '*.log' --exclude '.env' \
  "$LOCAL_DIR/" "$MUGEN_HOST:$REMOTE_DIR/"

echo -e "${GREEN}✅ Code synced${NC}"
echo ""

# Step 2: Remote deployment script
echo -e "${GREEN}🔧 Step 2: Running deployment on MUGEN...${NC}"

ssh $MUGEN_HOST << 'ENDSSH'
set -e

cd /home/ubuntu/miyabi-private/openai-apps/miyabi-app

echo "📦 Installing dependencies..."

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
  npm install
fi

# Install Python dependencies
cd server
pip3 install -r requirements.txt --user
cd ..

echo "🏗️  Building frontend..."
npm run build

echo "✅ Build complete"

# Create .env if not exists
if [ ! -f "server/.env" ]; then
  echo "⚠️  Creating server/.env template..."
  cat > server/.env << EOF
GITHUB_TOKEN=
MIYABI_REPO_OWNER=customer-cloud
MIYABI_REPO_NAME=miyabi-private
MIYABI_ROOT=/home/ubuntu/miyabi-private
BASE_URL=http://44.250.27.197:4444
MIYABI_ACCESS_TOKEN=
EOF
  echo "⚠️  Please edit server/.env and add GITHUB_TOKEN and MIYABI_ACCESS_TOKEN"
fi

echo "✅ Deployment complete on MUGEN"
ENDSSH

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Set environment variables on MUGEN:"
echo "   ssh $MUGEN_HOST"
echo "   cd $REMOTE_DIR/server"
echo "   nano .env  # Add GITHUB_TOKEN and MIYABI_ACCESS_TOKEN"
echo ""
echo "2. Start servers:"
echo "   cd $REMOTE_DIR"
echo "   ./start-servers.sh"
echo ""
echo "3. Or use systemd (production):"
echo "   sudo systemctl restart miyabi-assets miyabi-mcp"
echo ""
echo "4. View logs:"
echo "   sudo journalctl -u miyabi-mcp -f"
echo ""
