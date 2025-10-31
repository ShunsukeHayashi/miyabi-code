# Miyabi Desktop App

**Status**: ✅ Fully Functional - All 10 Phases Completed

Transform Miyabi's command-line agent system into a beautiful, intuitive desktop application.

---

## 🎯 Vision

A desktop application that:
- **Eliminates CLI friction** - No need to memorize commands
- **Visualizes agent workflows** - See the DAG, understand dependencies
- **Provides real-time feedback** - Live terminal output, VOICEVOX narration
- **Manages issues elegantly** - Kanban board with 57-label system integration

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Tauri 2.0 | Desktop app framework (Rust + Web) |
| **Frontend** | React 18 + TypeScript | UI framework |
| **State** | Zustand | Global state management |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Components** | shadcn/ui | Accessible component library |
| **Terminal** | @xterm/xterm | Terminal emulator |
| **Workflow** | React Flow | Node-based graphs |
| **Audio** | Web Audio API | Audio playback & visualization |
| **Icons** | Lucide React | Icon library |
| **Build** | Vite | Fast bundler |

---

## 📦 Project Structure

```
miyabi-desktop/
├── src-tauri/          # Rust backend (Tauri core)
│   ├── src/
│   │   ├── main.rs     # Tauri entry point
│   │   ├── commands.rs # IPC commands
│   │   └── ...
│   └── Cargo.toml
│
├── src/                # React frontend
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css       # Global styles + Tailwind
│   ├── components/     # React components
│   ├── lib/            # Utilities
│   ├── hooks/          # Custom hooks
│   └── stores/         # Zustand stores
│
├── public/             # Static assets
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── ARCHITECTURE.md     # Detailed architecture doc
└── README.md           # This file
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Rust (required for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js 18+ (via nvm)
nvm install 18

# pnpm
npm install -g pnpm
```

### Installation

```bash
# Clone the repository (if not already in miyabi-private)
cd /Users/shunsuke/Dev/miyabi-private/miyabi-desktop

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

---

## ✨ Key Features (Implemented)

### 1. Live Terminal with Agent Execution ✅

- Full PTY integration with Tauri backend
- ANSI color support with xterm.js
- Multiple terminal tabs with session management
- Real-time terminal output streaming
- Terminal resize and kill functionality
- Orchestrator-managed terminal sessions

### 2. Visual Agent Workflow DAG ✅

- Interactive DAG visualization with React Flow
- 21 agent types with character avatars
- Real-time execution status updates
- Dependency graph visualization
- Task timeline and progress tracking
- Agent filtering by type and status

### 3. VOICEVOX Narration Player ✅

- Audio playback with Web Audio API
- Waveform visualization
- Playback controls (play, pause, seek, speed)
- Narration generation from Git commits
- Speaker selection (40+ VOICEVOX voices)
- Volume control and audio visualization

### 4. GitHub Issue Dashboard ✅

- Kanban board with 6 state columns
- Issue cards with labels, assignees, timestamps
- Search and label filtering
- Miyabi 57-label system integration
- Real-time issue updates via Tauri events
- External link to GitHub issues

### 5. Comprehensive Settings UI ✅

- GitHub integration configuration (token, repository)
- VOICEVOX speaker selection
- Theme customization (light/dark/system)
- localStorage persistence with validation
- Success/error feedback notifications

---

## 🎨 Color Palette (Miyabi Theme)

```css
/* Primary Colors */
--miyabi-primary: #6366f1;      /* Indigo */
--miyabi-secondary: #8b5cf6;    /* Violet */
--miyabi-accent: #ec4899;       /* Pink */

/* Agent Type Colors */
--agent-coordinator: #ef4444;   /* Red */
--agent-codegen: #10b981;       /* Green */
--agent-review: #3b82f6;        /* Blue */
--agent-deployment: #f59e0b;    /* Amber */
--agent-pr: #8b5cf6;            /* Purple */
--agent-issue: #06b6d4;         /* Cyan */
--agent-refresher: #6b7280;     /* Gray */

/* Background (Dark Mode) */
--bg-primary: #0f172a;          /* Slate 900 */
--bg-secondary: #1e293b;        /* Slate 800 */
--bg-tertiary: #334155;         /* Slate 700 */
```

---

## 📋 Development Roadmap

### ✅ Phase 1: Foundation
- [x] Project setup (Tauri + React + TypeScript)
- [x] Tailwind CSS configuration
- [x] Architecture documentation
- [x] Color palette & theme design
- [x] GitHub Issue #635 created

### ✅ Phase 2: UI Structure
- [x] Basic UI layout with navigation sidebar
- [x] Minimal design system implementation
- [x] Panel switching system
- [x] Status bar with system metrics

### ✅ Phase 3: Terminal Integration
- [x] PTY backend implementation (Rust)
- [x] xterm.js frontend integration
- [x] Terminal session management
- [x] Multiple terminal tabs
- [x] Terminal resize and kill commands

### ✅ Phase 4: Agent Execution Panel
- [x] Agent execution backend (Tauri commands)
- [x] Agent execution UI panel
- [x] Real-time status updates
- [x] Log output display

### ✅ Phase 5: Workflow DAG Viewer
- [x] React Flow integration
- [x] DAG data structures and API
- [x] Interactive node visualization
- [x] Agent type filtering
- [x] Character avatars for 21 agents

### ✅ Phase 6: Agent Panel Integration
- [x] Agent dashboard with execution controls
- [x] Agent status tracking
- [x] Log viewer with search
- [x] Task timeline visualization

### ✅ Phase 7: VOICEVOX Integration
- [x] VOICEVOX Engine API wrapper
- [x] Narration generation backend
- [x] Audio player component
- [x] Waveform visualization
- [x] Playback controls

### ✅ Phase 8: GitHub Issue Dashboard
- [x] GitHub REST API integration
- [x] Issue fetching and parsing
- [x] Kanban board UI
- [x] Label filtering and search
- [x] Miyabi 57-label system support

### ✅ Phase 9: Settings UI
- [x] Settings panel component
- [x] GitHub token configuration
- [x] VOICEVOX speaker selection
- [x] Theme customization
- [x] localStorage persistence

### ✅ Phase 10: Polish & Finalization
- [x] Error handling improvements
- [x] README documentation
- [x] Build and test validation
- [x] Final UI polish

---

## 🤖 Agent Execution

This project is tracked in GitHub Issue #635.

To execute the CodeGenAgent for this issue:

```bash
cd /Users/shunsuke/Dev/miyabi-private

# Run CodeGenAgent
./target/release/miyabi agent run codegen --issue 635

# Or via Skill
# In Claude Code: Skill tool with command "agent-execution"
```

---

## 📚 Documentation

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical design
- **Main Project**: [../README.md](../README.md) - Miyabi project overview
- **Agent Specs**: [../.claude/agents/specs/](../.claude/agents/specs/) - Agent specifications
- **Miyabi CLI**: [../crates/miyabi-cli/](../crates/miyabi-cli/) - CLI implementation

---

## 🔗 Related Resources

- **Tauri Docs**: https://tauri.app/
- **React Flow**: https://reactflow.dev/
- **xterm.js**: https://xtermjs.org/
- **shadcn/ui**: https://ui.shadcn.com/
- **GitHub Issue**: https://github.com/customer-cloud/miyabi-private/issues/635

---

## 📝 Notes

- This is a Tauri-based desktop application, NOT Electron (lighter, faster, more secure)
- Uses Rust backend for system-level operations (process management, file I/O)
- React frontend for UI rendering (webview)
- IPC communication via Tauri commands (async Rust ↔ TypeScript)

---

**Last Updated**: 2025-10-31
**Maintained By**: Miyabi Team
**Status**: ✅ All 10 Phases Completed - Production Ready
