# Filesystem MCP Server Test

## Overview

This directory contains test scripts for the Miyabi MCP (Model Context Protocol) servers.

## Filesystem MCP Server

The `@modelcontextprotocol/server-filesystem` provides secure file system access with 14 tools.

### Configuration

Located in `.claude/mcp.json`:

```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
    "disabled": false,
    "description": "Filesystem access for project files"
  }
}
```

### Available Tools (14)

1. **read_file** - Read complete file contents (DEPRECATED)
2. **read_text_file** - Read text files with encoding support
3. **read_media_file** - Read images/audio as base64
4. **read_multiple_files** - Batch file reading
5. **write_file** - Create/overwrite files
6. **edit_file** - Line-based file editing with diff
7. **create_directory** - Create directories recursively
8. **list_directory** - List directory contents
9. **list_directory_with_sizes** - List with file sizes
10. **directory_tree** - Recursive tree as JSON
11. **move_file** - Move/rename files
12. **search_files** - Recursive file search
13. **get_file_info** - File metadata
14. **list_allowed_directories** - List accessible paths

### Test Suite

Run the comprehensive test suite:

```bash
node .claude/mcp-servers/test-filesystem.js
```

#### Test Coverage

- ✅ **Test 1**: Initialize Connection - Protocol handshake
- ✅ **Test 2**: List Available Tools - Verify 14 tools exposed
- ✅ **Test 3**: Read File - Read README.md
- ✅ **Test 4**: List Directory - List .claude/ contents
- ✅ **Test 5**: Search Files - Find markdown files

#### Test Results

```
============================================================
  MCP Filesystem Server Test
============================================================

Starting MCP server...
✓ Server started

============================================================
  Test 1: Initialize Connection
============================================================
✓ Initialize successful
  Server: secure-filesystem-server v0.2.0

============================================================
  Test 2: List Available Tools
============================================================
✓ Tools list successful
  Available tools (14):
    - read_file, read_text_file, read_media_file...

============================================================
  Test 3: Read File (README.md)
============================================================
✓ Read file successful
  Preview: # 🎨 Miyabi Dashboard...
  Total length: 38280 characters

============================================================
  Test 4: List Directory
============================================================
✓ List directory successful
  Entries in .claude/ (40):
    [FILE] .claude.json
    [FILE] INDEX.md
    ...

============================================================
  Test 5: Search Files (*.md in .claude/)
============================================================
✓ Search files successful

============================================================
  Test Summary
============================================================
✓ All tests passed!

The filesystem MCP server is working correctly.
```

### Security Features

The filesystem server implements:

- **Directory Restrictions**: Only accesses allowed directories
- **Path Validation**: Prevents path traversal attacks
- **Safe Operations**: All write operations are controlled
- **Error Handling**: Detailed error messages for debugging

### Usage in Claude Code

When MCP is enabled, Claude Code automatically has access to these tools via the filesystem MCP server. You can verify by running:

```bash
claude mcp list
```

### Integration with Miyabi

The filesystem MCP is used by:

1. **Agent Execution** - Reading/writing agent state
2. **Worktree Management** - Managing git worktrees
3. **Documentation Generation** - Creating docs
4. **Code Analysis** - Reading source files

### Troubleshooting

#### Server Not Starting

```bash
# Check if npx can find the package
npx -y @modelcontextprotocol/server-filesystem --help

# Verify Node.js version
node --version  # Should be >= 16.0.0
```

#### Permission Errors

The server only accesses directories within the allowed list. Check:

```bash
# Test from project root
cd /Users/shunsuke/Dev/miyabi-private
node .claude/mcp-servers/test-filesystem.js
```

#### Timeout Issues

For large directories, increase timeout in test script:

```javascript
const response = await sendRequest(serverProcess, request, 30000); // 30s timeout
```

### Next Steps

- [ ] Create tests for other MCP servers (miyabi, github-enhanced, etc.)
- [ ] Add integration tests with actual Agent workflows
- [ ] Document MCP server development guide
- [ ] Create MCP server benchmarking suite

---

**Last Updated**: 2025-11-10
**Test Status**: ✅ All Passing
**Server Version**: secure-filesystem-server v0.2.0
