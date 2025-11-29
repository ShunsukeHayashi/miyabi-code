## Tool Search System

Miyabi uses an intelligent tool search system to manage 105+ tools efficiently.

### Statistics
- **Total Tools**: 105
- **Always Loaded**: 7 (immediate access)
- **Deferred**: 98 (loaded on demand)
- **Sources**: MCP (84), Rust (10), Subagent (11)

### Categories
- `ai_design`: 16 tools
- `business`: 3 tools
- `development`: 45 tools
- `file_operations`: 4 tools
- `knowledge`: 12 tools
- `monitoring`: 15 tools
- `other`: 7 tools
- `rust_agents`: 3 tools

### Usage

Search for tools using natural language:
```
search_tools("create github issue")
search_tools("monitor system resources")
search_tools("generate code from spec")
```

Or use regex patterns:
```
search_tools("github_.*", type="regex")
search_tools("resource_.*|process_.*", type="regex")
```

### Always Loaded Tools

These tools are immediately available without search:
- `obsidian_read_document`
- `obsidian_search`
- `tmux_list_sessions`
- `tmux_send_message`
- `github_list_issues`
- `github_get_issue`
- `github_create_issue`


### Token Savings

Without Tool Search: ~31,500 tokens
With Tool Search: ~2,300 tokens
**Savings**: 93%