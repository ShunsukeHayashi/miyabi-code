# Miyabi File Access MCP Server

A Model Context Protocol (MCP) server that provides secure local file system access for Claude Code and other MCP clients.

## Features

- **File Operations**
  - Read file content with encoding support
  - Write files with automatic directory creation
  - Delete files and directories
  - Copy and move files
  - Get detailed file information (size, timestamps, permissions)

- **Directory Operations**
  - List directory contents
  - Recursive directory listing
  - Create directories with parent path support
  - Pattern-based filtering

- **Search Capabilities**
  - Search files by name pattern
  - Search file contents with regex
  - Recursive search support
  - Case-sensitive/insensitive options

- **Security Features**
  - Base path restriction (prevents directory traversal attacks)
  - Configurable file size limits
  - Path validation and sanitization
  - Access control via environment variables

## Installation

```bash
cd mcp-servers/miyabi-file-access
npm install
npm run build
```

## Configuration

Configure the server using environment variables:

```bash
# Base directory for file access (default: current working directory)
export MIYABI_FILE_ACCESS_BASE_PATH="/path/to/allowed/directory"

# Allow access outside base path (default: false)
export MIYABI_FILE_ACCESS_ALLOW_OUTSIDE="false"

# Maximum file size in bytes (default: 10MB)
export MIYABI_FILE_ACCESS_MAX_SIZE="10485760"
```

## Usage with Claude Code

Add to your `.mcp.json` or Claude Code configuration:

```json
{
  "mcpServers": {
    "miyabi-file-access": {
      "command": "node",
      "args": [
        "/path/to/miyabi-private/mcp-servers/miyabi-file-access/dist/index.js"
      ],
      "env": {
        "MIYABI_FILE_ACCESS_BASE_PATH": "/Users/shunsuke/Documents",
        "MIYABI_FILE_ACCESS_ALLOW_OUTSIDE": "false",
        "MIYABI_FILE_ACCESS_MAX_SIZE": "10485760"
      }
    }
  }
}
```

## Available Tools

### 1. `read_file`

Read content from a file.

**Parameters:**
- `path` (required): File path relative to base path
- `encoding` (optional): File encoding (utf-8, ascii, base64, binary)

**Example:**
```json
{
  "path": "documents/note.txt",
  "encoding": "utf-8"
}
```

### 2. `write_file`

Write content to a file.

**Parameters:**
- `path` (required): File path relative to base path
- `content` (required): Content to write
- `encoding` (optional): File encoding (utf-8, ascii, base64)
- `create_directories` (optional): Create parent directories if needed

**Example:**
```json
{
  "path": "documents/new-note.txt",
  "content": "Hello, World!",
  "create_directories": true
}
```

### 3. `list_files`

List files and directories.

**Parameters:**
- `path` (optional): Directory path (default: current directory)
- `recursive` (optional): List recursively
- `include_hidden` (optional): Include hidden files
- `pattern` (optional): Regex pattern to filter files

**Example:**
```json
{
  "path": "documents",
  "recursive": true,
  "pattern": "\\.md$"
}
```

### 4. `get_file_info`

Get detailed file or directory information.

**Parameters:**
- `path` (required): File or directory path

**Example:**
```json
{
  "path": "documents/note.txt"
}
```

### 5. `delete_file`

Delete a file or directory.

**Parameters:**
- `path` (required): Path to delete
- `recursive` (optional): Delete directories recursively

**Example:**
```json
{
  "path": "documents/old-note.txt"
}
```

### 6. `create_directory`

Create a new directory.

**Parameters:**
- `path` (required): Directory path to create
- `recursive` (optional): Create parent directories (default: true)

**Example:**
```json
{
  "path": "documents/archive/2025",
  "recursive": true
}
```

### 7. `copy_file`

Copy a file to a new location.

**Parameters:**
- `source` (required): Source file path
- `destination` (required): Destination file path

**Example:**
```json
{
  "source": "documents/note.txt",
  "destination": "backup/note-backup.txt"
}
```

### 8. `move_file`

Move or rename a file or directory.

**Parameters:**
- `source` (required): Source path
- `destination` (required): Destination path

**Example:**
```json
{
  "source": "documents/old-name.txt",
  "destination": "documents/new-name.txt"
}
```

### 9. `search_files`

Search for files by name or content.

**Parameters:**
- `path` (optional): Directory to search (default: current directory)
- `pattern` (required): Regex pattern to search for
- `search_content` (optional): Search file contents (default: false)
- `case_sensitive` (optional): Case sensitive search (default: false)
- `recursive` (optional): Search recursively (default: true)

**Example:**
```json
{
  "path": "documents",
  "pattern": "TODO|FIXME",
  "search_content": true,
  "recursive": true
}
```

## Security Considerations

### Base Path Restriction

By default, the server restricts file access to a base directory. All file paths are resolved relative to this base path, preventing directory traversal attacks.

```javascript
// ❌ This will fail (outside base path)
read_file({ path: "../../../etc/passwd" })

// ✅ This works (within base path)
read_file({ path: "documents/note.txt" })
```

### File Size Limits

The server enforces a maximum file size limit (default: 10MB) to prevent memory exhaustion when reading large files.

### Path Validation

All paths are validated and sanitized before use. Symbolic links are resolved, and paths are checked against the allowed base path.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch for changes)
npm run dev

# Run server
npm start
```

## Error Handling

All operations return structured error responses:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack trace"
}
```

Common errors:
- **Access denied**: Path is outside allowed base path
- **File not found**: Specified file or directory doesn't exist
- **Permission denied**: Insufficient permissions to perform operation
- **File too large**: File exceeds maximum allowed size

## Integration Examples

### Read a configuration file

```javascript
const result = await callTool("read_file", {
  path: "config/app.json",
  encoding: "utf-8"
});
const config = JSON.parse(result.content);
```

### List all markdown files

```javascript
const files = await callTool("list_files", {
  path: "docs",
  recursive: true,
  pattern: "\\.md$"
});
```

### Search for TODO comments

```javascript
const results = await callTool("search_files", {
  path: "src",
  pattern: "TODO:",
  search_content: true,
  recursive: true
});
```

### Create a new file with directories

```javascript
await callTool("write_file", {
  path: "reports/2025/01/summary.md",
  content: "# Monthly Summary\n\nContent here...",
  create_directories: true
});
```

## Comparison with Built-in File Tools

This MCP server provides several advantages over Claude Code's built-in file tools:

1. **Centralized Access**: All file operations go through a single, secure server
2. **Path Restrictions**: Enforces base path security at the server level
3. **Extended Features**: Provides additional operations like search and copy
4. **Configurable Limits**: Server-level control over file size and access
5. **Consistent API**: Uniform interface across all file operations
6. **Remote Access**: Can be deployed remotely for team collaboration

## License

MIT

## Contributing

Contributions are welcome! Please ensure all changes maintain security best practices and include appropriate tests.

## Support

For issues and questions, please use the GitHub issue tracker or contact the Miyabi team.
