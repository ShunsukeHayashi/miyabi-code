# Miyabi Obsidian MCP Server

MCP Server for Miyabi Documentation Knowledge System - Connect Obsidian vault to Claude Code

## 🎯 Purpose

Provides seamless access to Miyabi's Obsidian-based documentation system from Claude Code via Model Context Protocol (MCP).

## 📍 Vault Location

```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault/
```

## 🛠️ Features

### Document Management
- **obsidian_list_documents** - List all documents with optional filters (category, tags, path)
- **obsidian_read_document** - Read document content with frontmatter
- **obsidian_create_document** - Create new document with auto-generated frontmatter
- **obsidian_update_document** - Update existing document (content and/or frontmatter)

### Search & Discovery
- **obsidian_search** - Full-text search with regex support
- **obsidian_get_backlinks** - Find all documents linking to a specific document

### Metadata Operations
- **obsidian_get_tags** - Get all unique tags in vault
- **obsidian_get_categories** - Get all unique categories in vault

### Structure Operations
- **obsidian_get_directory_tree** - Get vault directory structure

## 📦 Installation

```bash
cd mcp-servers/miyabi-obsidian-server
npm install
npm run build
```

## ⚙️ Configuration

Add to your Claude Code MCP settings (`~/.config/claude/mcp_settings.json`):

```json
{
  "mcpServers": {
    "miyabi-obsidian": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-obsidian-server/dist/index.js"
      ]
    }
  }
}
```

## 🚀 Usage Examples

### List all agent documents

```typescript
// Using obsidian_list_documents
{
  "path": "agents/"
}
```

### Search for specific topic

```typescript
// Using obsidian_search
{
  "query": "worktree",
  "category": "architecture"
}
```

### Create daily report

```typescript
// Using obsidian_create_document
{
  "path": "reports/2025-11-19-sprint-report.md",
  "content": "# Sprint Report\n\n## Achievements\n...",
  "frontmatter": {
    "title": "Sprint Report - 2025-11-19",
    "category": "reports",
    "tags": ["sprint", "daily"],
    "status": "published"
  }
}
```

### Find all references to a document

```typescript
// Using obsidian_get_backlinks
{
  "path": "architecture/worktree.md"
}
```

## 📋 Frontmatter Format

All documents follow this frontmatter structure:

```yaml
---
title: "Document Title"
created: 2025-11-19
updated: 2025-11-19
author: "Claude Code"
category: "architecture | agents | reports | planning"
tags: ["miyabi", "tag1", "tag2"]
status: "draft | review | published"
---
```

## 🏗️ Vault Structure

```
obsidian-vault/
├── agents/           # Agent documentation
├── architecture/     # Architecture docs
├── context/          # Context modules
├── daily-notes/      # Daily notes
├── entities/         # Entity documentation
├── guides/           # User guides
├── labels/           # Label system docs
├── planning/         # Planning documents
├── relations/        # Relation documentation
├── reports/          # Reports and analysis
└── workflows/        # Workflow documentation
```

## 🔗 Integration with Miyabi

This MCP server integrates with:
- **Miyabi tmux MCP Server** - Inter-agent communication
- **Miyabi SSE Gateway** - Real-time updates
- **Miyabi Rules Server** - Validation and governance

## 📊 Version History

- **v1.0.0** (2025-11-19): Initial release
  - 9 core tools
  - Full Obsidian vault access
  - Frontmatter support
  - Search and backlink functionality

## 🤝 Contributing

When adding new tools:
1. Add tool definition to `tools` array
2. Implement handler in switch statement
3. Update this README
4. Test with Claude Code

## 📝 License

Part of Miyabi Private - Internal Use Only
