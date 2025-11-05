# Miyabi Desktop

> VS Code-like Electron desktop application for Miyabi autonomous development platform

**Version**: 0.1.0 (MVP - Sprints 0-7 Complete)
**Status**: 🚧 In Development (Polishing & Release Prep)
**Platform**: macOS (initial), Windows/Linux (future)

---

## 📋 Overview

Miyabi Desktop is a native Electron application that provides a rich, unified experience for managing Miyabi's autonomous development workflows. It integrates Worktree visualization, Agent execution monitoring, and Project management in a single interface.

**Key Features** (MVP):
- ✅ **Sprint 0**: Foundation (Electron + React + TypeScript + Vite)
- ✅ **Sprint 2**: Project Management (F-1)
- ✅ **Sprint 3**: Worktree Visualization (F-2)
- ✅ **Sprint 4**: Agent Execution Monitoring (F-3)
- ✅ **Sprint 5**: Issue Management (F-4)
- ✅ **Sprint 6**: Task History Browser (F-5) + System Health Dashboard (F-6)
- ✅ **Sprint 7**: Native Notifications (F-11) + Polish
- ⏳ **Sprint 8**: Release Preparation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20+ (LTS)
- **npm**: 10+
- **macOS**: 13+ (Ventura) for development

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Build for macOS
npm run build:mac
```

---

## 📁 Project Structure

```
crates/miyabi-desktop/
├── src/
│   ├── main/              # Electron main process
│   │   └── index.ts       # Main entry point, IPC handlers
│   ├── preload/           # Preload script (secure IPC bridge)
│   │   └── index.ts       # Context bridge
│   └── renderer/          # React renderer process
│       ├── main.tsx       # React entry point
│       ├── App.tsx        # Main app component
│       ├── index.css      # Global styles
│       └── types/         # TypeScript types
│           └── electron.d.ts
├── build/                 # Build resources (icons, entitlements)
├── public/                # Static assets
├── dist/                  # Built renderer files
├── dist-electron/         # Built main/preload files
├── package.json           # npm dependencies & scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── README.md              # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **React** 18.3.1 - UI framework
- **TypeScript** 5.7.3 - Type safety
- **Tailwind CSS** 4.1.11 - Utility-first styling
- **TanStack Query** 5.90.5 - Data fetching & caching
- **Zustand** 5.0.2 - State management
- **Framer Motion** 11.18.2 - Animations

### Backend (Electron Main)
- **Electron** 34.0.0 - Cross-platform framework
- **Node.js** 20 LTS - Runtime
- **better-sqlite3** 11.0.0 - Local database
- **Octokit** 21.0.0 - GitHub API client
- **chokidar** 3.6.0 - File watcher

### Build & Development
- **Vite** 6.0.11 - Build tool
- **electron-builder** 25.1.8 - Packaging & distribution
- **Vitest** 3.2.4 - Unit testing
- **Playwright** 1.49.1 - E2E testing

---

## 📜 Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev

# Run tests (watch mode)
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Build

```bash
# Build for current platform
npm run build

# Build for macOS (DMG + ZIP)
npm run build:mac

# Build for Windows (NSIS + Portable)
npm run build:win

# Build for Linux (AppImage + deb)
npm run build:linux
```

### Code Quality

```bash
# Lint TypeScript files
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format code with Prettier
npm run format

# Type check without emitting
npm run type-check
```

### Utilities

```bash
# Clean build artifacts
npm run clean

# Preview production build
npm run preview
```

---

## 🎨 UI Design Principles

- **Simplicity**: Clean, uncluttered interface inspired by VS Code
- **Consistency**: Follow VS Code conventions (familiar to developers)
- **Performance**: 60fps animations, instant feedback
- **Accessibility**: Keyboard shortcuts, screen reader support

### Color Palette

- **Primary**: Blue-600 (#1f6feb) - Miyabi brand color
- **Background**: Gray-900 (#0d1117) - Dark mode default
- **Accent**: Green-500 (#3fb950) - Success states
- **Error**: Red-500 (#f85149) - Error states

### Typography

- **Headers**: Inter, font-extralight (200)
- **Body**: Inter, font-normal (400)
- **Code**: JetBrains Mono - Monospace

---

## 🔐 Security

### Content Security Policy (CSP)

Strict CSP enforced in `index.html`:
- `default-src 'self'` - Only load resources from app
- `script-src 'self'` - No inline scripts
- `connect-src` - Allow GitHub API & local WebSocket
- `style-src 'self' 'unsafe-inline'` - Tailwind requires inline styles

### Context Isolation

- ✅ `contextIsolation: true` - Isolate renderer from main
- ✅ `nodeIntegration: false` - No Node.js in renderer
- ✅ `sandbox: true` - Chromium sandbox enabled
- ✅ Preload script exposes minimal, safe APIs

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm test
```

Located in `src/**/*.test.ts(x)`.

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Located in `tests/e2e/**/*.spec.ts`.

---

## 📦 Distribution

### macOS

```bash
npm run build:mac
```

Outputs:
- `dist/Miyabi Desktop-0.1.0.dmg` - DMG installer
- `dist/Miyabi Desktop-0.1.0-mac.zip` - ZIP archive

**Code Signing**: Requires Apple Developer ID certificate.
**Notarization**: Automated via `electron-builder`.

### Windows (Future)

```bash
npm run build:win
```

### Linux (Future)

```bash
npm run build:linux
```

---

## 🗺️ Development Roadmap

### Sprint 0: Foundation (Week 0) ✅
- [x] Electron + React + TypeScript setup
- [x] Vite build system
- [x] IPC communication layer
- [x] Basic UI layout

### Sprint 1: Foundation (Week 1) ✅
- [x] Window management
- [x] Native menu bar
- [x] React Router setup

### Sprint 2: Dashboard Integration (Week 2) ✅
- [x] File watcher (chokidar)
- [x] CLI executor (spawn miyabi commands)
- [x] Project management (F-1)

### Sprint 3: Worktree Visualization (Week 3) ✅
- [x] Worktree data fetching
- [x] Worktree list UI
- [x] Worktree actions (delete, open, copy)

### Sprint 4: Agent Monitoring (Week 4) ✅
- [x] Agent data fetching
- [x] Real-time log streaming
- [x] Pause/Cancel actions
- [x] Agent status tracking
- [x] AgentsView UI with live updates

### Sprint 5: Issue Management (Week 5) ✅
- [x] GitHub API integration (Octokit)
- [x] Issue caching (SQLite)
- [x] Issue list & filters
- [x] Search functionality
- [x] IssuesView UI with detailed view

### Sprint 6: History & Health (Week 6) ✅
- [x] Task history database (SQLite)
- [x] System health monitoring
- [x] Task execution recording
- [x] Statistics and analytics
- [x] Real-time health metrics (CPU, memory, disk)

### Sprint 7: Polish & Notifications (Week 7)
- [ ] Native notifications (F-11)
- [ ] Bug fixes & UX polish

### Sprint 8: Release (Week 8)
- [ ] Build pipeline & code signing
- [ ] Documentation
- [ ] Beta testing
- [ ] Public launch

---

## 📚 Documentation

- **[ELECTRON_APP_SPECIFICATION.md](../../docs/electron-app/ELECTRON_APP_SPECIFICATION.md)** - Full specification (58 pages)
- **[ELECTRON_APP_MVP_ROADMAP.md](../../docs/electron-app/ELECTRON_APP_MVP_ROADMAP.md)** - Sprint-by-sprint plan (35 pages)
- **[ELECTRON_APP_TECH_STACK.md](../../docs/electron-app/ELECTRON_APP_TECH_STACK.md)** - Technology decisions (32 pages)

---

## 🤝 Contributing

This is a major Epic (Issue #632) spanning 8-16 weeks. Contributors needed for:
- Frontend development (React + TypeScript)
- Electron main process development (Node.js)
- UI/UX design (mockups, user testing)
- Documentation (user guides, API docs)
- Testing (unit, integration, E2E)

---

## 📝 License

MIT

---

## 🔗 Links

- **Repository**: https://github.com/ShunsukeHayashi/Miyabi
- **Issue Tracker**: https://github.com/ShunsukeHayashi/Miyabi/issues
- **Documentation**: https://shunsukehayashi.github.io/Miyabi/

---

**Built with ❤️ by the Miyabi Team**

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Sprints 0-3 Complete** | **Next: Sprint 4 (Agent Monitoring)**
