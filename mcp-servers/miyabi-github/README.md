# 🔐 Miyabi GitHub MCP Server

GitHub API integration for Miyabi - Issue/PR/Label management via MCP.

## 📋 Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | GitHub Personal Access Token (PAT) |
| `GITHUB_DEFAULT_OWNER` | ⚪ Optional | Default repository owner |
| `GITHUB_DEFAULT_REPO` | ⚪ Optional | Default repository name |

## 🚀 Quick Setup

### Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read user profile data)
   - `user:email` (Access user email addresses)
4. Copy the generated token

### Step 2: Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-github": {
      "command": "node",
      "args": ["/path/to/miyabi-private/mcp-servers/miyabi-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GITHUB_DEFAULT_OWNER": "customer-cloud",
        "GITHUB_DEFAULT_REPO": "miyabi-private"
      }
    }
  }
}
```

**⚠️ Replace `/path/to/` with your actual path!**

Example for typical Mac setup:
```json
"args": ["/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-github/dist/index.js"]
```

### Step 3: Build & Restart

```bash
cd /path/to/miyabi-private/mcp-servers/miyabi-github
npm install
npm run build

# Restart Claude Desktop
osascript -e 'tell application "Claude" to quit'
sleep 2
open -a "Claude"
```

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `github_list_issues` | List issues from repository |
| `github_get_issue` | Get detailed issue info |
| `github_create_issue` | Create new issue |
| `github_update_issue` | Update existing issue |
| `github_close_issue` | Close an issue |
| `github_list_prs` | List pull requests |
| `github_get_pr` | Get PR details |
| `github_create_pr` | Create new PR |
| `github_merge_pr` | Merge a PR |

## 🔧 Troubleshooting

### "No GitHub token available"

**Cause**: `GITHUB_TOKEN` not set or invalid

**Solution**:
1. Verify token in Claude Desktop config
2. Ensure token has required scopes
3. Check token hasn't expired
4. Restart Claude Desktop

### "redirect_uri is not associated with this application"

**Cause**: This error occurs with OAuth flow, not PAT

**Solution**: Use Personal Access Token (PAT) instead of OAuth:
1. Generate PAT at https://github.com/settings/tokens
2. Add to Claude Desktop config as shown above
3. Restart Claude Desktop

### Tools not appearing

**Solution**:
1. Check JSON syntax in config file
2. Verify path to `dist/index.js`
3. Run `npm run build` to ensure compiled
4. Check Claude Desktop logs: `~/Library/Logs/Claude/`

## 📊 Example Usage

```
User: List open issues in miyabi-private

Claude: [calls github_list_issues with state="open"]
Found 15 open issues:
- #1224: feat(dev-issue): Dev Issue System
- #1223: fix: OAuth redirect error
...
```

## 🔗 Related

- [Miyabi MCP Quickstart](../MIYABI_MCP_QUICKSTART.md)
- [MCP Protocol Docs](https://modelcontextprotocol.io)
- [GitHub API Reference](https://docs.github.com/en/rest)
