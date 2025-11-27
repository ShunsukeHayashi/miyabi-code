# Miyabi OpenAI App

OpenAI ChatGPT integration for the Miyabi autonomous agent framework using the Model Context Protocol (MCP).

## Features

- **Execute Miyabi Agents** - Trigger any of the 21 Miyabi agents from ChatGPT
- **GitHub Issue Management** - Create, list, and manage issues
- **Project Status Dashboard** - View Miyabi metrics and active agents
- **Rich UI Widgets** - Interactive components for agent results and project data

## Architecture

```
┌─────────────┐
│  ChatGPT    │
└──────┬──────┘
       │ MCP Protocol
┌──────▼──────┐
│ MCP Server  │ (Python/FastAPI)
└──────┬──────┘
       │
┌──────▼──────┐
│   Miyabi    │ (Rust Agents + A2A Bridge)
└─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- pnpm (or npm)
- GitHub Token (for issue management)

### Installation

```bash
# Install dependencies
pnpm install
cd server && pip install -r requirements.txt

# Build UI widgets
pnpm run build

# Start asset server (for development)
pnpm run serve  # Runs on localhost:4444

# Start MCP server (in another terminal)
cd server
uvicorn main:app --port 8000 --reload
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# Required
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
MIYABI_REPO_OWNER=customer-cloud
MIYABI_REPO_NAME=miyabi-private

# Optional
MIYABI_ROOT=/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
BASE_URL=http://localhost:4444  # For local dev
```

### Testing Locally

1. **Start the asset server**:
   ```bash
   pnpm run serve
   ```

2. **Start the MCP server**:
   ```bash
   cd server
   uvicorn main:app --port 8000 --reload
   ```

3. **Expose with ngrok** (for ChatGPT integration):
   ```bash
   ngrok http 8000
   ```

4. **Add to ChatGPT**:
   - Go to ChatGPT Settings > Connectors
   - Add endpoint: `https://<your-id>.ngrok-free.app/mcp`

## Available Tools

### 1. execute_agent

Execute a Miyabi agent (CodeGen, Review, Issue, PR, Deploy, etc.)

**Parameters**:
- `agent` (required): Agent name (codegen, review, issue, pr, deploy, etc.)
- `issue_number` (optional): GitHub issue number
- `task` (optional): Task description
- `context` (optional): Additional context

**Example**:
```
"Run the CodeGen agent on issue #123"
"Execute the Review agent to check my latest code"
```

### 2. create_issue

Create a new GitHub issue in the Miyabi repository.

**Parameters**:
- `title` (required): Issue title
- `body` (required): Issue description
- `labels` (optional): Array of label names

**Example**:
```
"Create an issue titled 'Fix authentication bug' with labels bug and priority:high"
```

### 3. list_issues

List GitHub issues in the Miyabi repository.

**Parameters**:
- `state` (optional): "open", "closed", or "all" (default: "open")
- `limit` (optional): Max issues to return (default: 10)

**Example**:
```
"Show me the latest 10 open issues"
"List all closed issues"
```

### 4. get_project_status

Get current Miyabi project status (branch, crates, agents, commits).

**Example**:
```
"What's the current status of the Miyabi project?"
"Show me the project dashboard"
```

## UI Widgets

### AgentResultWidget

Displays agent execution results with status, output, files changed, and commits.

### IssueListWidget

Interactive list of GitHub issues with labels, assignees, and status.

### ProjectStatusWidget

Dashboard showing project metrics (crates, MCP servers, agents, latest commit).

### AgentStatusWidget

Real-time status of running agents with progress indicators.

## Development

### Build Commands

```bash
pnpm run dev      # Development server with hot reload
pnpm run build    # Production build (generates hashed assets)
pnpm run serve    # Serve built assets
```

### Project Structure

```
miyabi-app/
├── src/
│   └── components/
│       ├── AgentResultWidget.tsx
│       ├── IssueListWidget.tsx
│       ├── ProjectStatusWidget.tsx
│       └── AgentStatusWidget.tsx
├── server/
│   ├── main.py              # MCP server
│   └── requirements.txt
├── assets/                  # Built bundles (auto-generated)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Deployment

### Deploy to MUGEN (EC2)

```bash
# 1. Build assets
pnpm run build

# 2. Copy to MUGEN
scp -r assets server mugen:~/miyabi-openai-app/

# 3. SSH to MUGEN
ssh mugen

# 4. Set environment variables
export BASE_URL=https://your-domain.com
export GITHUB_TOKEN=xxx

# 5. Start server
cd ~/miyabi-openai-app/server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Deploy to Production

Use a process manager like systemd or supervisor:

```ini
[program:miyabi-mcp]
command=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
directory=/path/to/miyabi-app/server
environment=BASE_URL="https://your-domain.com",GITHUB_TOKEN="xxx"
autostart=true
autorestart=true
```

## Integration with Miyabi A2A Bridge

The server is designed to integrate with Miyabi's Agent-to-Agent (A2A) Bridge for executing Rust agents. The current implementation includes a placeholder that can be replaced with actual A2A Bridge calls:

```python
# In execute_agent_tool():
# TODO: Replace with actual A2A Bridge execution
# Example:
# result = await a2a_bridge.execute(
#     tool_name=f"a2a.{agent_name}.execute",
#     params={"issue_number": params.issue_number, "context": params.context}
# )
```

## Troubleshooting

### Widgets not displaying

- Ensure asset server is running (`pnpm run serve`)
- Check BASE_URL is correct in server environment
- Verify CORS is enabled

### MCP server errors

- Check GITHUB_TOKEN is valid
- Ensure MIYABI_ROOT points to correct directory
- Verify Python dependencies are installed

### Agent execution fails

- Ensure A2A Bridge integration is properly configured
- Check Miyabi project is properly set up
- Verify agent names match AGENT_MAPPING

## License

MIT
