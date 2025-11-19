# Gemini 3 Adaptive Runtime - Quick Start Guide

## 1. Installation (Already Done!)

The server structure is ready. Now let's build and test it.

## 2. Build the Server

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-adaptive-runtime
npm install
npm run build
```

## 3. Configure MCP Client

### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gemini3-adaptive-runtime": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-adaptive-runtime/dist/index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "AIzaSyCLgJKwLjkJzfc010-BLT6igmwXggHTWA8"
      }
    }
  }
}
```

### For Miyabi .mcp.json

Add to `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.mcp.json`:

```json
{
  "mcpServers": {
    "gemini3-adaptive-runtime": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-adaptive-runtime/dist/index.js"
      ],
      "env": {
        "GEMINI_API_KEY": "AIzaSyCLgJKwLjkJzfc010-BLT6igmwXggHTWA8"
      }
    }
  }
}
```

## 4. Test the Server

### Manual Test (Command Line)

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-adaptive-runtime

# Set API key
export GEMINI_API_KEY="AIzaSyCLgJKwLjkJzfc010-BLT6igmwXggHTWA8"

# Run the server
npm start
```

The server will start on stdio and wait for MCP protocol messages.

## 5. Example Usage in Claude Code

Once configured, you can use these tools:

### Generate a Dynamic UI

```
Use the gemini3-adaptive-runtime MCP server's generate_dynamic_ui tool to create a weather dashboard with hourly forecast timeline
```

### Deep Reasoning

```
Use the gemini3-adaptive-runtime MCP server's deep_reasoning tool to analyze: "Should we migrate to microservices?"
```

### Code Execution

```
Use the gemini3-adaptive-runtime MCP server's execute_code tool to parse this CSV and generate summary statistics
```

## 6. Available Tools Quick Reference

| Tool | Purpose | Best For |
|------|---------|----------|
| `generate_dynamic_ui` | Create React UI components | Dashboards, forms, visualizations |
| `iterate_ui` | Improve existing UI | Refining designs based on feedback |
| `deep_reasoning` | Complex analysis | Decision-making, strategy planning |
| `compare_options` | Option evaluation | Technical choices, architecture decisions |
| `analyze_decision` | Decision consequences | Risk assessment, impact analysis |
| `execute_code` | Generate & run code | Data processing, calculations |
| `analyze_code` | Code review | Bug finding, optimization |
| `generate_tests` | Create test suites | Quality assurance, TDD |
| `solve_algorithm` | Algorithm problems | Coding challenges, optimization |

## 7. Tips for Best Results

### Dynamic UI Generation
- **Be Specific**: "Create a comparison dashboard" → "Create a side-by-side comparison dashboard with filtering"
- **Mention Device**: Add "mobile-friendly" or "desktop dashboard" for better adaptation
- **Include Data**: Provide sample data structure for realistic components

### Deep Reasoning
- **Use `thinking_level: "high"`**: For complex decisions (default)
- **Provide Context**: More context = better reasoning
- **Request Alternatives**: Set `includeAlternatives: true` for multiple perspectives

### Code Execution
- **Specify Language**: Python for data, TypeScript for web logic
- **Include Constraints**: Mention time/space requirements
- **Provide Examples**: Sample inputs help generate better code

## 8. Troubleshooting

### Server won't start
```bash
# Check Node version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API errors
- Verify API key is valid at https://aistudio.google.com/app/apikey
- Check quota limits in Google AI Studio
- Ensure Gemini 3 Pro Preview access is enabled

### Slow responses
- Complex tasks with `thinking_level: "high"` take longer (5-15 seconds)
- Try `thinking_level: "low"` for simple tasks
- This is normal - deep thinking requires time

## 9. Next Steps

1. **Explore Examples**: Try all 9 tools with different prompts
2. **Iterate UIs**: Generate a UI, then use `iterate_ui` to refine it
3. **Combine Tools**: Use reasoning → code execution → UI generation pipeline
4. **Integration**: Connect to Miyabi workflows and agents

## 10. Support

- **Documentation**: See README.md for detailed tool specifications
- **Issues**: Report bugs to Miyabi issue tracker
- **Logs**: Check console output for detailed error messages
- **API Docs**: https://ai.google.dev/gemini-api/docs/gemini-3

---

**Ready to build adaptive experiences! 🚀**
