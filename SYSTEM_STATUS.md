# 🎯 Miyabi System Full Status Report
Generated: Sat Nov 29 11:04:12 UTC 2025

## 📊 tmux Sessions Overview

| Session | Windows | Status |
|---------|---------|--------|
| aifactory-dev | 1 | 🔵 Running |
| claude | 1 | 🔵 Running |
| codex-new | 1 | 🔵 Running |
| kaede | 1 | 🔵 Running |
| miyabi-openai | 1 | 🔵 Running |
| miyabi-orchestra | 4 | 🔵 Running |
| orchestra-conductor | 1 | 🔵 Running |
| orchestra-hub | 1 | 🔵 Running |
| orchestra-squad-1 | 3 | 🔵 Running |
| orchestra-squad-10 | 3 | 🔵 Running |
| orchestra-squad-2 | 3 | 🔵 Running |
| orchestra-squad-3 | 3 | 🔵 Running |
| orchestra-squad-4 | 3 | 🔵 Running |
| orchestra-squad-5 | 3 | 🔵 Running |
| orchestra-squad-6 | 3 | 🔵 Running |
| orchestra-squad-7 | 3 | 🔵 Running |
| orchestra-squad-8 | 3 | 🔵 Running |
| orchestra-squad-9 | 3 | 🔵 Running |

## 👑 Coordinators (Claude Code)

### orchestra-conductor
```
  - "Check Codex logs"

  What do you need?

● Ran 2 stop hooks
  ⎿  Stop hook error: Failed with non-blocking status code: No stderr
  output

────────────────────────────────────────────────────────────────────────────────
> 
────────────────────────────────────────────────────────────────────────────────
  ? for shortcuts



```

### orchestra-hub
```

› tmux new-session -d -s fix-mcp && tmux send-keys -t fix-mcp "cd /
  home/ubuntu && sed -i 's|/Users/shunsuke/Dev/01-miyabi/_core/miyabi-
  private|/home/ubuntu/miyabi-private|g' .config/claude/
  claude_code_config.json && echo '=== FIXED ===' && cat .config/
  claude/claude_code_config.json" Enter


■ Your access token could not be refreshed because your refresh token
was already used. Please log out and sign in again.


› Summarize recent commits

  92% context left · ? for shortcuts
```

## 🎭 Orchestra Squads

### Squad-1
```
/scripts/full-status-report.sh

╭─[SSH] 🖥️  MUGEN miyabi-private on  main
 [$!?] 🦀 v1.91.1 ⬢ v20.19.5
╰─❯ /home/ubuntu/miyabi-private/scripts/
full-status-report.sh > /home/ubuntu/miy
abi-private/SYSTEM_STATUS.md

```

### Squad-2
```
  I’ll run claude mcp list, create a
  git worktree, and dispatch the right
  Miyabi skill.


› Summarize recent commits

  100% context left · ? for shortcuts
```

### Squad-3
```
  a small feature (describe), 4) review
  recent changes (path), 5) generate
  docs summary.


› Write tests for @filename

  99% context left · ? for shortcuts
```

### Squad-4
```


  clippy”), and I’ll cr

  skill.
```

### Squad-5
```


  you share it, I’ll spin up a Gi

  Miyabi skill/agent.
```

## 🤖 Agent Directories

Total: 100/100

## 🔧 Codex Workers

Running: 0/100

## 📡 MCP Servers
```
Checking MCP server health...

miyabi-obsidian: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-obsidian-server/dist/index.js - ✓ Connected
gemini3-adaptive-runtime: node /home/ubuntu/miyabi-private/mcp-servers/gemini3-adaptive-runtime/dist/index.js - ✓ Connected
gemini3-uiux-designer: node /home/ubuntu/miyabi-private/mcp-servers/gemini3-uiux-designer/dist/index.js - ✓ Connected
miyabi-tmux: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js - ✓ Connected
miyabi-rules: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-rules-server/dist/index.js - ✓ Connected
miyabi-sse-gateway: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-sse-gateway/dist/index.js - ✗ Failed to connect
miyabi-github: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-github/dist/index.js - ✓ Connected
miyabi-file-access: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-file-access/dist/index.js - ✓ Connected
miyabi-pixel-mcp: node /home/ubuntu/miyabi-private/mcp-servers/miyabi-pixel-mcp/dist/index.js - ✗ Failed to connect
```
