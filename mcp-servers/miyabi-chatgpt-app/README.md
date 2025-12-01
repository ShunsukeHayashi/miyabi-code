# Miyabi ChatGPT App

ChatGPT Apps SDK integration for Miyabi - AI Development Operations Platform.

## Overview

This MCP server provides ChatGPT with access to Miyabi's project management and agent execution capabilities through the Apps SDK.

## Features

### Tools

| Tool | Description |
|------|-------------|
| `list_repos` | List available GitHub repositories |
| `switch_project` | Switch to a different project |
| `get_project_status` | Get project dashboard (issues, PRs, stats) |
| `execute_agent` | Execute Miyabi agents (codegen, review, etc.) |
| `list_files` | List repository files |

### UI Widgets

- **Project Selector**: Browse and switch between repositories
- **Dashboard**: View project status, issues, PRs, and execute agents

## Architecture

```
ChatGPT User Prompt
       ↓
ChatGPT Model → MCP Tool Call → Miyabi MCP Server
       │                              │
       ↓                              ↓
  Narration ←────── Widget (iframe) ←─┘
                    window.openai API
```

## Setup

### Prerequisites

- Node.js 18+
- GitHub Personal Access Token

### Installation

```bash
cd mcp-servers/miyabi-chatgpt-app

# Install server dependencies
npm install

# Install widget dependencies
cd web && npm install && cd ..

# Build everything
npm run build
```

### Environment Variables

```bash
export GITHUB_TOKEN="ghp_xxxxx"
```

### Development

```bash
# Start server in development mode
npm run dev

# Build widgets with watch
cd web && npm run dev
```

### Expose for ChatGPT

```bash
# Use ngrok to expose locally
ngrok http 3000

# Add the ngrok URL as a connector in ChatGPT Developer Mode
# URL: https://xxxx.ngrok.app/mcp
```

## Widget Development

### window.openai API

```typescript
// Read tool output
const data = window.openai.toolOutput;

// Persist state
await window.openai.setWidgetState({ selectedId: "123" });

// Call another tool
await window.openai.callTool("switch_project", { owner, repo });

// Send follow-up message
await window.openai.sendFollowUpMessage({ prompt: "Analyze this" });

// Open external link
await window.openai.openExternal({ href: "https://github.com" });
```

### Theme Support

```tsx
const theme = window.openai?.theme || "light";
const isDark = theme === "dark";
```

## Project Structure

```
miyabi-chatgpt-app/
├── src/
│   └── index.ts          # MCP Server (tools + resources)
├── web/
│   ├── src/
│   │   ├── index.tsx     # React widget
│   │   └── styles.css    # Tailwind styles
│   └── dist/
│       ├── widget.js     # Bundled widget
│       └── widget.css    # Bundled styles
├── package.json
└── README.md
```

## Tool Response Structure

```typescript
return {
  // Visible to model + widget
  structuredContent: {
    repos: [...],
    currentProject: "owner/repo"
  },

  // Narration for conversation
  content: [{
    type: "text",
    text: "Found 10 repositories"
  }],

  // Widget-only data (hidden from model)
  _meta: {
    allRepos: [...],
    timestamp: "..."
  }
};
```

## License

MIT - Part of the Miyabi Project
