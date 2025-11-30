# miyabi-codex

**Version**: 1.0.0
**Status**: ✅ Production Ready

MCP Server wrapper for **Claude Code CLI** (`codex` command).

---

## 🎯 Purpose

Provides MCP access to Claude Code CLI, enabling:
- **Task Automation**: Execute codex tasks from MCP clients
- **Batch Processing**: Run multiple codex tasks in sequence
- **Integration**: Use codex within Miyabi Orchestra
- **YOLO Mode**: Ultra-fast execution (⚠️ DANGEROUS!)

---

## 📦 Installation

### Prerequisites

1. **Install Claude Code CLI**:
   ```bash
   npm install -g codex-cli
   ```

2. **Verify Installation**:
   ```bash
   codex --version
   # Should output: codex-cli 0.58.0 (or higher)
   ```

### Build MCP Server

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex
npm install
npm run build
```

---

## ⚙️ Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-codex": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex/dist/index.js"
      ]
    }
  }
}
```

**Note**: No environment variables required. The server wraps the existing `codex` CLI.

---

## 🛠️ Available Tools

### 1. `codex_exec`

Execute a task using Claude Code CLI.

**Parameters**:
- `prompt` (required): Task description
- `model` (optional): `sonnet`, `opus`, or `haiku`
- `cd` (optional): Working directory
- `search` (optional): Enable web search
- `full_auto` (optional): Run without approvals (limited sandboxing)

**Example**:
```
Use codex_exec with prompt "Fix all TypeScript errors in src/"
```

**With Options**:
```
Use codex_exec with prompt "Refactor this function" and model "opus" and cd "/path/to/project"
```

---

### 2. `codex_reply`

Send a follow-up prompt to the active Claude Code session (codex reply).

**Parameters**:
- `prompt` (required): Follow-up content
- `model` (optional): `sonnet`, `opus`, or `haiku`
- `cd` (optional): Working directory
- `search` (optional): Enable web search
- `full_auto` (optional): Run without approvals (limited sandboxing)

**Example**:
```
Use codex_reply with prompt "続き: テスト追加もお願い" and cd "/path/to/project"
```

---

### 3. `codex_exec_yolo`

🚨 **DANGEROUS**: Execute codex in YOLO mode (NO approvals, NO sandboxing).

**Parameters**:
- `prompt` (required): Task description
- `model` (optional): `sonnet`, `opus`, or `haiku`
- `cd` (optional): Working directory
- `confirm_danger` (required): Must be `true` to acknowledge risks

**Example**:
```
Use codex_exec_yolo with prompt "Deploy to production" and confirm_danger true
```

**⚠️ WARNING**:
- Runs ALL commands without approval
- NO sandboxing protection
- Only use in isolated, hardened environments
- Can cause irreversible damage

---

### 4. `codex_resume`

Resume the previous codex session.

**Parameters**:
- `cd` (optional): Working directory

**Example**:
```
Use codex_resume to continue previous work
```

---

### 5. `codex_version`

Get codex CLI version.

**Example**:
```
Use codex_version
```

**Returns**:
```
codex-cli 0.58.0
```

---

### 6. `codex_login`

Login to codex (ChatGPT OAuth or API key).

**Example**:
```
Use codex_login
```

---

## ✅ Verification

### Test Manually

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex
npm start
# Press Ctrl+C to exit
```

**Expected Output**:
```
Miyabi Codex MCP Server running on stdio
Wrapping Claude Code CLI (codex-cli)
Codex CLI version: codex-cli 0.58.0
```

### Test in Claude

```
Use codex_version to check codex CLI version
```

---

## 🎯 Use Cases

### 1. Automated Code Fixes

```
Use codex_exec with prompt "Fix all linting errors in src/" and full_auto true
```

### 2. Batch Refactoring

```
Use codex_exec with prompt "Refactor all functions in src/ to use async/await"
```

### 3. Documentation Generation

```
Use codex_exec with prompt "Add JSDoc comments to all public functions"
```

### 4. Test Generation

```
Use codex_exec with prompt "Generate unit tests for src/utils.ts" and model "opus"
```

### 5. YOLO Mode for Trusted Environments

```
Use codex_exec_yolo with prompt "Build and deploy to staging" and confirm_danger true
```

---

## 🔒 Safety Considerations

### Standard Mode (`codex_exec`)

- ✅ User approval required for each command
- ✅ Sandboxed execution
- ✅ Safe for production use

### Full Auto Mode (`codex_exec` + `full_auto: true`)

- ⚠️ NO user approval
- ⚠️ Limited sandboxing
- ⚠️ Use with caution

### YOLO Mode (`codex_exec_yolo`)

- 🚨 NO user approval
- 🚨 NO sandboxing
- 🚨 Can execute ANY command
- 🚨 Can modify/delete ANY file
- 🚨 Can access network
- 🚨 **ONLY use in isolated, disposable environments**

**YOLO Mode Safety Checklist**:
- [ ] Running in Docker container
- [ ] No access to production data
- [ ] No network access to production systems
- [ ] Can be destroyed and rebuilt
- [ ] Logs are monitored
- [ ] You understand the risks

---

## 🐛 Troubleshooting

### Codex CLI Not Found

```
⚠️ WARNING: codex CLI not found or not accessible
```

**Solution**:
```bash
npm install -g codex-cli
codex login
```

### Permission Denied

**Solution**:
```bash
chmod +x /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex/dist/index.js
```

### Task Timeout

If tasks take longer than 5 minutes, they will timeout.

**Solution**: Modify `timeout` in `src/index.ts`:
```typescript
timeout: 600000, // 10 minutes
```

---

## 💡 Best Practices

### 1. Start with Standard Mode

Always try `codex_exec` before using `full_auto` or `yolo`.

### 2. Use Specific Prompts

❌ **Bad**:
```
Use codex_exec with prompt "fix stuff"
```

✅ **Good**:
```
Use codex_exec with prompt "Fix TypeScript type errors in src/components/Button.tsx"
```

### 3. Specify Working Directory

```
Use codex_exec with prompt "Run tests" and cd "/path/to/project"
```

### 4. Choose Appropriate Model

- **Haiku**: Fast, simple tasks
- **Sonnet**: Balanced (default)
- **Opus**: Complex refactoring, architecture

### 5. Never Use YOLO in Production

YOLO mode is for:
- Local testing in VMs
- CI/CD in isolated containers
- Experimental environments

**NEVER** for:
- Production servers
- Shared development machines
- Machines with important data

---

## 🔗 Related

- **Claude Code CLI Docs**: https://developers.openai.com/codex/cli/reference
- **Main Quickstart**: `../MIYABI_MCP_QUICKSTART.md`
- **Miyabi CLAUDE.md**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/CLAUDE.md`

---

## 📊 Command Comparison

| Command | Approval | Sandboxing | Speed | Safety |
|---------|----------|------------|-------|--------|
| `codex_exec` | ✅ Yes | ✅ Full | 🐢 Slow | ✅ Safe |
| `codex_exec` + `full_auto` | ❌ No | ⚠️ Limited | 🏃 Fast | ⚠️ Caution |
| `codex_exec_yolo` | ❌ No | ❌ None | 🚀 Ultra Fast | 🚨 Dangerous |

---

## 🚀 Advanced Usage

### Chaining Tasks

```
1. Use codex_exec with prompt "Fix linting errors"
2. Use codex_exec with prompt "Run tests"
3. Use codex_exec with prompt "Build for production"
```

### Model Selection Strategy

```
# Quick fixes
Use codex_exec with prompt "Fix typo in README" and model "haiku"

# Code generation
Use codex_exec with prompt "Generate API client" and model "sonnet"

# Architecture refactoring
Use codex_exec with prompt "Refactor to microservices" and model "opus"
```

---

## 📝 Future Enhancements

- [ ] Streaming output support
- [ ] Session management
- [ ] Task history tracking
- [ ] Parallel task execution
- [ ] Integration with miyabi-git-inspector

---

**Project**: Miyabi
**Last Updated**: 2025-11-19
**Maintainer**: Miyabi Team

**⚠️ REMEMBER**: YOLO mode is extremely dangerous. Use responsibly!
