# Miyabi Environment Variables

このドキュメントは、Miyabiプロジェクトで使用される全ての環境変数を説明します。

## Required Variables (必須)

### GitHub Integration

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxxxxxxxxx` |
| `REPO_OWNER` | Repository owner | `ShunsukeHayashi` |
| `REPO_NAME` | Repository name | `miyabi-private` |

**Token Scopes Required:**
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows
- `read:org` - Read org membership

**取得方法:**
1. https://github.com/settings/tokens にアクセス
2. "Generate new token (classic)" をクリック
3. 必要なスコープを選択
4. トークンをコピーして保存

### Miyabi Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MIYABI_ROOT` | Project root directory | `~/miyabi-private` |
| `MIYABI_ENV` | Environment (development/staging/production) | `development` |

---

## Optional Variables (任意)

### AI Services

| Variable | Description | Used By |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | AI agents |
| `GEMINI_API_KEY` | Google Gemini API key | gemini3-* MCPs |
| `OPENAI_API_KEY` | OpenAI API key | miyabi-openai-assistant |

### Database

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (local) |
| `REDIS_URL` | Redis connection string | (local) |

### External Services

| Variable | Description | Used By |
|----------|-------------|---------|
| `LARK_APP_ID` | Lark/Feishu App ID | lark-mcp |
| `LARK_APP_SECRET` | Lark/Feishu App Secret | lark-mcp |
| `STRIPE_SECRET_KEY` | Stripe API key | billing |
| `AWS_ACCESS_KEY_ID` | AWS access key | S3/CloudFront |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | S3/CloudFront |

### Development

| Variable | Description | Default |
|----------|-------------|---------|
| `RUST_LOG` | Rust logging level | `info` |
| `RUST_BACKTRACE` | Enable backtraces | `0` |
| `NODE_ENV` | Node environment | `development` |
| `VITE_API_BASE_URL` | Frontend API URL | `http://localhost:8080/api/v1` |

---

## Setup Methods

### Method 1: Setup Script (Recommended)

```bash
bash scripts/setup-env.sh
```

This will:
- Prompt for required values
- Create `~/.miyabi-env`
- Add source to `.bashrc`/`.zshrc`

### Method 2: Manual Setup

```bash
# Create env file
cat > ~/.miyabi-env << 'EOF'
export GITHUB_TOKEN="ghp_your_token_here"
export REPO_OWNER="ShunsukeHayashi"
export REPO_NAME="miyabi-private"
export MIYABI_ROOT="$HOME/miyabi-private"
export MIYABI_ENV="development"
EOF

# Add to shell config
echo '[ -f ~/.miyabi-env ] && source ~/.miyabi-env' >> ~/.bashrc

# Apply
source ~/.miyabi-env
```

### Method 3: direnv (Advanced)

```bash
# Install direnv
brew install direnv  # macOS
apt install direnv   # Ubuntu

# Create .envrc in project root
cat > .envrc << 'EOF'
export GITHUB_TOKEN="ghp_your_token_here"
export REPO_OWNER="ShunsukeHayashi"
export REPO_NAME="miyabi-private"
EOF

# Allow
direnv allow
```

---

## Environment-Specific Configuration

### Development
```bash
export MIYABI_ENV="development"
export RUST_LOG="debug"
export VITE_API_BASE_URL="http://localhost:8080/api/v1"
```

### Staging
```bash
export MIYABI_ENV="staging"
export RUST_LOG="info"
export VITE_API_BASE_URL="https://staging-api.miyabi.dev/api/v1"
```

### Production
```bash
export MIYABI_ENV="production"
export RUST_LOG="warn"
export VITE_API_BASE_URL="https://api.miyabi.dev/api/v1"
```

---

## Verification

```bash
# Check all required variables
bash -c '
vars=(GITHUB_TOKEN REPO_OWNER REPO_NAME)
for var in "${vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
    else
        echo "✅ $var is set"
    fi
done
'
```

---

## Security Notes

⚠️ **Never commit secrets to Git!**

- Use `~/.miyabi-env` (not in repo)
- Add to `.gitignore`: `.env`, `.env.*`, `*.local`
- Use GitHub Secrets for CI/CD
- Consider AWS Secrets Manager for production

---

## Troubleshooting

### "GITHUB_TOKEN is required"
```bash
# Check if set
echo $GITHUB_TOKEN

# If empty, set it
export GITHUB_TOKEN="ghp_xxx"
```

### "MIYABI_REPO_OWNER is required"
The MCP server expects `REPO_OWNER` env var:
```bash
export REPO_OWNER="ShunsukeHayashi"
export REPO_NAME="miyabi-private"
```

### Variables not persisting
Ensure you've added to shell config:
```bash
echo '[ -f ~/.miyabi-env ] && source ~/.miyabi-env' >> ~/.bashrc
source ~/.bashrc
```

---

Last Updated: 2025-12-03
