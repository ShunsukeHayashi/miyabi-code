#!/bin/bash
# Miyabi OpenAI App - Setup Script

set -e

echo "🌸 Miyabi OpenAI App Setup"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing..."
    npm install -g pnpm
fi
echo "✅ pnpm: $(pnpm --version)"

if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.10+"
    exit 1
fi
echo "✅ Python3: $(python3 --version)"

echo ""
echo "📦 Installing dependencies..."

# Install Node dependencies
echo "Installing Node.js dependencies..."
pnpm install

# Install Python dependencies
echo "Installing Python dependencies..."
cd server
python3 -m pip install -r requirements.txt
cd ..

echo ""
echo "🔑 Environment setup..."

# Check for .env file
if [ ! -f "server/.env" ]; then
    echo "Creating server/.env file..."
    cat > server/.env << EOF
# GitHub Configuration
GITHUB_TOKEN=${GITHUB_TOKEN:-}
MIYABI_REPO_OWNER=customer-cloud
MIYABI_REPO_NAME=miyabi-private

# Paths
MIYABI_ROOT=${MIYABI_ROOT:-$HOME/Dev/miyabi-private}
BASE_URL=http://localhost:4444

# Optional: AWS Configuration
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}
EOF

    echo "⚠️  Please edit server/.env and add your GITHUB_TOKEN"
    echo "   You can get a token from: https://github.com/settings/tokens"
else
    echo "✅ server/.env already exists"
fi

echo ""
echo "🏗️  Building UI widgets..."
pnpm run build

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📖 Next steps:"
echo ""
echo "1. Edit server/.env and add your GITHUB_TOKEN"
echo "2. Start the asset server:"
echo "   ${YELLOW}pnpm run serve${NC}"
echo ""
echo "3. In another terminal, start the MCP server:"
echo "   ${YELLOW}cd server && uvicorn main:app --port 8000 --reload${NC}"
echo ""
echo "4. For ChatGPT integration, expose with ngrok:"
echo "   ${YELLOW}ngrok http 8000${NC}"
echo ""
echo "5. Add the ngrok URL to ChatGPT Settings > Connectors:"
echo "   https://<your-id>.ngrok-free.app/mcp"
echo ""
echo "📚 See README.md for more information"
