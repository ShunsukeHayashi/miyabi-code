# miyabi-git-inspector

**Version**: 1.0.0
**Status**: ✅ Production Ready

Real-time Git repository monitoring and inspection via Model Context Protocol (MCP).

---

## 🎯 Purpose

Provides comprehensive Git repository state inspection for Claude Code, enabling:
- Real-time repository status monitoring
- Branch and worktree management
- Commit history analysis
- File staging inspection

---

## 📦 Installation

### Method 1: Quick Install

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-git-inspector
npm install
npm run build
```

### Method 2: From Archive

```bash
cd ~/Downloads
tar -xzf miyabi-git-inspector.tar.gz
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/
cp -r ~/Downloads/miyabi-git-inspector .
cd miyabi-git-inspector
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
    "miyabi-git-inspector": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-git-inspector/dist/index.js"
      ],
      "env": {
        "MIYABI_REPO_PATH": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MIYABI_REPO_PATH` | Git repository path | `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private` |

---

## 🛠️ Available Tools

### 1. `git_status`

Get current repository status including branch, tracking info, and file changes.

**Returns**:
```json
{
  "current": "main",
  "tracking": "origin/main",
  "ahead": 0,
  "behind": 0,
  "staged": ["file1.ts", "file2.ts"],
  "modified": ["file3.ts"],
  "untracked": ["file4.ts"],
  "clean": false
}
```

**Example**:
```
Use git_status to check repository status
```

---

### 2. `git_branch_list`

List all branches with remote tracking information.

**Returns**:
```json
{
  "current": "main",
  "branches": [
    {
      "name": "main",
      "current": true,
      "remote": "origin/main"
    },
    {
      "name": "feature/new-agent",
      "current": false,
      "remote": "origin/feature/new-agent"
    }
  ]
}
```

**Example**:
```
Use git_branch_list to see all branches
```

---

### 3. `git_current_branch`

Get the name of the current branch.

**Returns**:
```json
{
  "branch": "main"
}
```

**Example**:
```
Use git_current_branch to get current branch name
```

---

### 4. `git_worktree_list`

List all Git worktrees.

**Returns**:
```json
{
  "worktrees": [
    {
      "path": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private",
      "branch": "main",
      "commit": "abc123",
      "prunable": false
    },
    {
      "path": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.worktrees/issue-123",
      "branch": "feature/issue-123",
      "commit": "def456",
      "prunable": false
    }
  ]
}
```

**Example**:
```
Use git_worktree_list to see all worktrees
```

---

### 5. `git_log`

View commit history.

**Parameters**:
- `limit` (optional): Number of commits to retrieve (default: 10)

**Returns**:
```json
{
  "commits": [
    {
      "hash": "abc123",
      "author": "John Doe <john@example.com>",
      "date": "2025-11-19T10:00:00Z",
      "message": "feat: add new agent"
    }
  ]
}
```

**Example**:
```
Use git_log with limit 5 to see last 5 commits
```

---

### 6. `git_staged_files`

List all staged files (ready for commit).

**Returns**:
```json
{
  "files": [
    "src/index.ts",
    "README.md"
  ]
}
```

**Example**:
```
Use git_staged_files to see what's staged
```

---

### 7. `git_unstaged_files`

List all modified but unstaged files.

**Returns**:
```json
{
  "files": [
    "src/lib.ts",
    "package.json"
  ]
}
```

**Example**:
```
Use git_unstaged_files to see modified files
```

---

### 8. `git_untracked_files`

List all untracked files.

**Returns**:
```json
{
  "files": [
    "new-file.ts",
    "temp.log"
  ]
}
```

**Example**:
```
Use git_untracked_files to see untracked files
```

---

## ✅ Verification

### Test Manually

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-git-inspector
MIYABI_REPO_PATH=/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private npm start
# Press Ctrl+C to exit
```

**Expected Output**:
```
Miyabi Git Inspector MCP Server running on stdio
Repository: /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
```

### Test in Claude

```
Use git_status to check the repository status
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Check Node.js version**:
```bash
node --version  # Should be v20.x+
```

**Clean rebuild**:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Git Commands Fail

**Verify repository path**:
```bash
ls -la /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.git
```

**Check Git installation**:
```bash
git --version
```

---

## 🔗 Related

- **Main Quickstart**: `../MIYABI_MCP_QUICKSTART.md`
- **Miyabi CLAUDE.md**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/CLAUDE.md`
- **Git Worktree Guide**: `.claude/context/worktree.md`

---

**Project**: Miyabi
**Last Updated**: 2025-11-19
