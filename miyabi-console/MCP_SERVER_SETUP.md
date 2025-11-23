# MCP Server Setup for miyabi-console

## ✅ MCP Server Status

**gemini3-uiux-designer**: ✅ Configured and Tested

```bash
Gemini 3 UI/UX Designer MCP Server running on stdio
Model: gemini-3-pro-preview (thinking: high) - UI/UX Design Specialist
Design Philosophy: Jonathan Ive - Extreme Minimalism
```

## 📋 Configuration

The `.mcp.json` file has been copied to this directory with the following servers:

1. **miyabi-obsidian** - Obsidian integration
2. **gemini3-adaptive-runtime** - Adaptive UI runtime
3. **gemini3-uiux-designer** - Ive-style design agent (10 tools)

## 🔧 How to Use

### Starting New Claude Code Session

To enable MCP servers in a new session:

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console
claude
```

Claude Code will automatically load `.mcp.json` from the current directory.

### Available Design Tools (gemini3-uiux-designer)

1. **review_design** - 100-point Ive-style design evaluation
2. **generate_design_system** - Complete design system
3. **create_wireframe** - Minimalist wireframes
4. **generate_high_fidelity_mockup** - Full React components
5. **check_accessibility** - WCAG 2.1 AA compliance
6. **analyze_usability** - Nielsen heuristics analysis
7. **optimize_ux_writing** - Microcopy optimization
8. **design_interaction_flow** - State transitions
9. **create_animation_specs** - Subtle animations
10. **evaluate_consistency** - Cross-design consistency

### Manual Testing

To test the MCP server manually:

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/gemini3-uiux-designer

GEMINI_API_KEY=AIzaSyCLgJKwLjkJzfc010-BLT6igmwXggHTWA8 \
GEMINI_MODEL=gemini-3-pro-preview \
GEMINI_THINKING_LEVEL=high \
node dist/index.js
```

## 📖 Next Steps

1. Restart Claude Code in miyabi-console directory
2. Verify MCP tools are available: `claude mcp list`
3. Use `mcp__gemini3_uiux_designer__review_design` to analyze components
4. Generate improved design systems with Ive principles

## 🎨 Design Philosophy (Jonathan Ive)

The gemini3-uiux-designer follows 5 core principles:

1. **Extreme Minimalism** - Remove all decoration
2. **Generous Whitespace** - Luxury of emptiness (py-48)
3. **Refined Colors** - Grayscale + ONE accent
4. **Typography-Focused** - Huge ultra-light titles
5. **Subtle Animation** - 200ms ease-in-out only

---

**Status**: ✅ Ready
**Last Updated**: 2025-11-19
**Location**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console/`
