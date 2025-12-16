# Demo Video Production Guide

## Overview
This document provides scripts and guidelines for creating demo videos/GIFs for Miyabi MCP Bundle.

## Required Demos

### 1. Basic Operation Demo (30 seconds)
**Filename**: `demo-basic.gif`
**Tool**: asciinema + gifski

**Script**:
```
1. Open Claude Desktop
2. Show MCP server connection status
3. Execute: "Check health of all Miyabi Societies"
4. Show the structured response
5. Execute: "Get metrics dashboard"
6. Display the metrics summary
```

### 2. Git Inspector Demo (20 seconds)
**Filename**: `demo-git-inspector.gif`

**Script**:
```
1. Execute: "Inspect current git repository"
2. Show branch information
3. Execute: "Show recent commits"
4. Display formatted commit history
```

### 3. GitHub Integration Demo (25 seconds)
**Filename**: `demo-github.gif`

**Script**:
```
1. Execute: "List open issues"
2. Show issue list
3. Execute: "Create a new issue for feature X"
4. Show issue creation confirmation
```

### 4. Installation Walkthrough (45 seconds)
**Filename**: `demo-install.gif`

**Script**:
```
1. Clone repository
2. Run npm install
3. Run npm run build
4. Configure claude_desktop_config.json
5. Restart Claude Desktop
6. Verify MCP server connection
```

## Technical Setup

### Recording Tools
- **Terminal Recording**: [asciinema](https://asciinema.org/)
- **GIF Conversion**: [gifski](https://gif.ski/)
- **Alternative**: [Terminalizer](https://terminalizer.com/)

### Commands
```bash
# Record terminal session
asciinema rec demo.cast

# Convert to GIF (high quality)
gifski --fps 10 --width 800 demo.cast -o demo.gif
```

### Quality Guidelines
- Resolution: 800x600 minimum
- Frame rate: 10 FPS for GIFs
- Duration: Keep under 45 seconds
- Font size: Large enough to read on mobile

## File Placement
All demo assets should be placed in:
```
docs/assets/
├── demo-basic.gif
├── demo-git-inspector.gif
├── demo-github.gif
├── demo-install.gif
└── screenshots/
    └── claude-desktop-mcp.png
```

## README Integration
Add to README.md header section:
```markdown
<p align="center">
  <img src="docs/assets/demo-basic.gif" alt="Miyabi MCP Bundle Demo" width="600">
</p>
```
