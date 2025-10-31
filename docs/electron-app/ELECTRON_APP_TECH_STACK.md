# Miyabi Desktop - Technology Stack Specification

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Status**: 📋 Design Phase

---

## 📖 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Framework Decision: Electron vs Tauri](#framework-decision-electron-vs-tauri)
3. [Frontend Stack](#frontend-stack)
4. [Backend Stack](#backend-stack)
5. [Build & Development Tools](#build--development-tools)
6. [Testing Stack](#testing-stack)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Dependency Management](#dependency-management)
10. [Security Stack](#security-stack)
11. [Migration Path to Tauri](#migration-path-to-tauri)

---

## Executive Summary

### 🎯 Technology Philosophy

**Core Principles**:
1. **Reuse First**: Leverage existing Miyabi components (React dashboard, Rust backend)
2. **Developer Experience**: Fast iteration, hot reload, type safety
3. **Performance**: < 3s startup, < 500MB memory, responsive UI
4. **Security**: Content Security Policy, code signing, sandboxing
5. **Maintainability**: Modern tooling, comprehensive testing, clear documentation

---

### 📊 Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  React 18 + TypeScript + Tailwind CSS + HeroUI              │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON FRAMEWORK                       │
│  Main Process (Node.js 20) + Renderer (Chromium)            │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                        │
│  Miyabi Web API (Axum) + CLI (Rust) + GitHub API (Octokit)  │
└─────────────────────────────────────────────────────────────┘
                            ▲ ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA & STORAGE                           │
│  SQLite (better-sqlite3) + File System + WebSocket          │
└─────────────────────────────────────────────────────────────┘
```

---

## Framework Decision: Electron vs Tauri

### 🔍 Detailed Comparison

| Criterion | Electron | Tauri | Winner | Rationale |
|-----------|----------|-------|--------|-----------|
| **Bundle Size** | ~350MB (with app) | ~10MB (with app) | 🏆 Tauri | Tauri uses OS webview (no Chromium bundled) |
| **Memory Usage** | 200-500MB | 50-150MB | 🏆 Tauri | Lighter runtime, native Rust backend |
| **Startup Time** | 2-5s | 0.5-2s | 🏆 Tauri | No Chromium initialization overhead |
| **CPU Usage (Idle)** | 1-3% | 0.5-1% | 🏆 Tauri | More efficient process management |
| **Security** | Chromium-based (frequent CVEs) | Rust + OS Webview | 🏆 Tauri | Smaller attack surface, memory-safe Rust |
| **macOS Integration** | Good (via Node.js native modules) | Excellent (native Rust bindings) | 🏆 Tauri | Direct access to macOS APIs |
| **Development Speed** | Fast (JS/TS only, mature ecosystem) | Moderate (Rust + JS/TS) | 🏆 Electron | Lower learning curve for web devs |
| **Hot Reload** | Excellent (Vite HMR) | Good (Vite HMR + Rust rebuild) | 🏆 Electron | Faster iteration in dev mode |
| **Ecosystem** | Mature (10+ years, 50k+ packages) | Young (3+ years, growing) | 🏆 Electron | More third-party plugins, examples |
| **Community** | Large (VS Code, Slack, Discord) | Small but active | 🏆 Electron | Easier to find help, solutions |
| **Learning Curve** | Low (web devs already know) | Medium (Rust required) | 🏆 Electron | Faster onboarding |
| **Auto-Update** | Mature (electron-updater) | Supported (tauri-plugin-updater) | 🏆 Electron | More battle-tested |
| **Cross-Platform** | Excellent (macOS, Windows, Linux) | Excellent (same platforms) | 🤝 Tie | Both support all major platforms |
| **TypeScript Support** | First-class (types for all APIs) | Good (via bindings) | 🏆 Electron | Better IDE autocomplete |
| **Monaco Editor** | Perfect (built for Electron) | Works but less tested | 🏆 Electron | VS Code uses Electron + Monaco |
| **xterm.js** | Perfect (designed for Electron) | Works but edge cases | 🏆 Electron | Better terminal integration |
| **Testing** | Excellent (Playwright, Spectron) | Good (Playwright, WebDriver) | 🏆 Electron | More mature testing tools |
| **Debugging** | Excellent (Chrome DevTools) | Good (Safari/Chrome DevTools) | 🏆 Electron | Better debugging experience |
| **Rust Backend Reuse** | Indirect (spawn processes, REST API) | Direct (Rust crates as modules) | 🏆 Tauri | Can import Rust crates directly |
| **Future-Proofing** | Stable but heavy | Modern, improving rapidly | 🏆 Tauri | Momentum in Rust community |

---

### 🏁 **Final Decision: Electron (MVP) → Tauri (Phase 3+)**

**Rationale**:

**Why Electron for MVP (Phase 1-2)**:
1. ✅ **Faster development**: 90% of React dashboard can be reused without modification
2. ✅ **Team expertise**: Team already knows TypeScript/React (no Rust frontend learning)
3. ✅ **Ecosystem maturity**: Monaco Editor, xterm.js, electron-builder all designed for Electron
4. ✅ **Lower risk**: Proven technology (VS Code, Slack, Figma, Discord all use Electron)
5. ✅ **Faster iteration**: Hot reload, DevTools, easier debugging
6. ✅ **Time to market**: 8-week MVP timeline achievable with Electron (vs 12+ weeks for Tauri)

**Why Tauri for Phase 3+**:
1. ✅ **Performance**: 4-10x smaller bundle, 2-4x less memory usage
2. ✅ **Security**: Rust's memory safety, smaller attack surface
3. ✅ **macOS Native**: Better integration with macOS APIs (notifications, file system)
4. ✅ **Rust Synergy**: Miyabi backend is Rust, Tauri allows direct crate imports
5. ✅ **Future**: Momentum in developer community, modern approach

**Migration Strategy**:
- Build MVP with Electron (Week 1-8)
- Evaluate Tauri migration in Phase 3 (after 6+ months of user feedback)
- Migration effort: ~4-6 weeks (replace Electron APIs with Tauri commands)
- Benefit: 80% of frontend code portable (React components, hooks, stores)

---

## Frontend Stack

### 🎨 UI Framework

#### **React 18.3+**

**Why React**:
- ✅ Already used in Miyabi dashboard (reuse 90% of components)
- ✅ Mature ecosystem (libraries, tools, community)
- ✅ Concurrent rendering (better performance)
- ✅ Team expertise (frontend dev already proficient)

**Version**: `18.3.1`
**Install**: `npm install react react-dom`

**Key Features Used**:
- `useState`, `useEffect`, `useCallback`, `useMemo` (hooks)
- `Suspense` + `React.lazy` (code splitting)
- `ErrorBoundary` (error handling)
- `StrictMode` (development checks)

**Alternatives Considered**:
- ❌ Vue.js: Team not familiar, smaller ecosystem for Electron
- ❌ Svelte: Smaller ecosystem, less mature tooling
- ❌ Solid.js: Too new, unproven in production

---

### 🔧 Language

#### **TypeScript 5.7+**

**Why TypeScript**:
- ✅ Type safety (catch bugs at compile time)
- ✅ Better IDE support (autocomplete, refactoring)
- ✅ Self-documenting code (types as documentation)
- ✅ Team expertise (backend is Rust, similar type system)

**Version**: `5.7.3`
**Install**: `npm install --save-dev typescript @types/react @types/react-dom @types/node`

**Config** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "dist-electron"]
}
```

**Strict Mode Features**:
- `strict: true` (all strict checks enabled)
- `noUncheckedIndexedAccess: true` (safer array/object access)
- `noImplicitOverride: true` (explicit override keyword)

---

### 🎨 UI Component Library

#### **HeroUI 2.8+ (NextUI Fork)**

**Why HeroUI**:
- ✅ Already used in Miyabi dashboard (consistent design)
- ✅ Built on React Aria (accessibility by default)
- ✅ Tailwind CSS integration (utility-first styling)
- ✅ Dark mode support (important for developer tools)
- ✅ 50+ components (buttons, cards, modals, tables, etc.)

**Version**: `2.8.3`
**Install**: `npm install @heroui/react @heroui/use-theme`

**Key Components Used**:
- `Button`, `Input`, `Select`, `Checkbox`, `Switch` (form elements)
- `Card`, `Modal`, `Dropdown`, `Tabs` (layout)
- `Table`, `Pagination`, `Tooltip` (data display)
- `Spinner`, `Progress`, `Skeleton` (feedback)

**Theme Configuration**:
```tsx
// src/renderer/main.tsx
import { HeroUIProvider } from '@heroui/react';

<HeroUIProvider>
  <App />
</HeroUIProvider>
```

**Alternatives Considered**:
- ❌ Material-UI: Heavier, Google design (we want custom brand)
- ❌ Chakra UI: Good but less Tailwind integration
- ❌ Ant Design: Enterprise-focused, not developer-tool aesthetic

---

### 🎨 Styling

#### **Tailwind CSS 4.1+**

**Why Tailwind**:
- ✅ Utility-first (fast prototyping)
- ✅ Already used in dashboard (consistent styles)
- ✅ Small bundle size (unused classes purged)
- ✅ Dark mode support (class-based)
- ✅ Excellent VS Code extension (IntelliSense)

**Version**: `4.1.11`
**Install**: `npm install tailwindcss @tailwindcss/vite`

**Config** (`tailwind.config.ts`):
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1f6feb',
        success: '#3fb950',
        warning: '#d29922',
        danger: '#f85149',
      },
    },
  },
};

export default config;
```

**Vite Plugin** (`vite.config.ts`):
```typescript
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss()],
};
```

---

### 📦 State Management

#### **Zustand 5.0+**

**Why Zustand**:
- ✅ Simpler than Redux (less boilerplate)
- ✅ Excellent TypeScript support
- ✅ React 18 concurrent mode compatible
- ✅ DevTools support (time-travel debugging)
- ✅ < 1KB gzipped (tiny bundle size)

**Version**: `5.0+`
**Install**: `npm install zustand`

**Example Store**:
```typescript
// src/renderer/stores/projectStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Project {
  name: string;
  path: string;
  lastOpened: number;
}

interface ProjectStore {
  currentProject: Project | null;
  recentProjects: Project[];
  openProject: (path: string) => Promise<void>;
  closeProject: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  devtools((set, get) => ({
    currentProject: null,
    recentProjects: [],
    openProject: async (path: string) => {
      const project = await window.electron.invoke('open-project', path);
      set({ currentProject: project });
    },
    closeProject: () => set({ currentProject: null }),
  }))
);
```

**Alternatives Considered**:
- ❌ Redux Toolkit: More complex, unnecessary for Electron app
- ❌ Recoil: Atom-based, less familiar to team
- ❌ Jotai: Similar to Zustand but less mature

---

### 🔄 Data Fetching

#### **TanStack Query 5.90+ (React Query)**

**Why TanStack Query**:
- ✅ Handles caching, refetching, stale data automatically
- ✅ Built-in loading, error states
- ✅ Optimistic updates
- ✅ DevTools for debugging queries
- ✅ Excellent TypeScript support

**Version**: `5.90.5`
**Install**: `npm install @tanstack/react-query @tanstack/react-query-devtools`

**Setup** (`src/renderer/lib/query-client.ts`):
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30s
    },
  },
});
```

**Example Hook**:
```typescript
// src/renderer/hooks/useWorktrees.ts
import { useQuery } from '@tanstack/react-query';

export function useWorktrees() {
  return useQuery({
    queryKey: ['worktrees'],
    queryFn: async () => {
      return await window.electron.invoke('get-worktrees');
    },
    refetchInterval: 2000, // Poll every 2s
  });
}
```

**Alternatives Considered**:
- ❌ SWR: Less feature-rich than TanStack Query
- ❌ Apollo Client: Overkill (we don't use GraphQL heavily)
- ❌ RTK Query: Tied to Redux, unnecessary dependency

---

### 📊 Charts & Visualization

#### **Recharts 2.12+**

**Why Recharts**:
- ✅ Already used in Miyabi dashboard (consistent charts)
- ✅ React-first API (composable components)
- ✅ Responsive, animated
- ✅ Supports line, bar, pie, area charts

**Version**: `2.12.0`
**Install**: `npm install recharts`

**Example**:
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

<LineChart data={data} width={600} height={300}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="value" stroke="#1f6feb" />
</LineChart>
```

---

#### **React Three Fiber 8.15+ (3D Visualization)**

**Why React Three Fiber**:
- ✅ Already used in dashboard (3D agent visualization)
- ✅ React-friendly Three.js wrapper
- ✅ Declarative 3D scene composition

**Version**: `8.15.0`
**Install**: `npm install @react-three/fiber @react-three/drei three`

**Use Case**: KAMUI 3D visualization (Phase 3+)

---

### 🎬 Animations

#### **Framer Motion 11.18+**

**Why Framer Motion**:
- ✅ Already used in dashboard (smooth transitions)
- ✅ Declarative animation API
- ✅ Gesture support (drag, swipe)
- ✅ Layout animations (automatic)

**Version**: `11.18.2`
**Install**: `npm install framer-motion`

**Example**:
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.3 }}
>
  <AgentCard {...props} />
</motion.div>
```

---

### 🎨 Icons

#### **Iconify React**

**Why Iconify**:
- ✅ 150,000+ icons (Material, FontAwesome, Heroicons, etc.)
- ✅ On-demand loading (small bundle)
- ✅ Easy to use (`<Icon icon="mdi:folder-open" />`)

**Version**: `latest`
**Install**: `npm install @iconify/react`

**Example**:
```tsx
import { Icon } from '@iconify/react';

<Icon icon="mdi:folder-open" width={24} height={24} />
```

---

### 🖥️ Code Editor

#### **Monaco Editor 0.52+**

**Why Monaco**:
- ✅ VS Code's editor component (battle-tested)
- ✅ 50+ language syntaxes (TypeScript, Rust, Python, etc.)
- ✅ IntelliSense (autocomplete, hover hints)
- ✅ Diff view (side-by-side comparison)
- ✅ Minimap, breadcrumbs, find/replace

**Version**: `0.52+`
**Install**: `npm install monaco-editor`

**Webpack Plugin** (for optimization):
```bash
npm install --save-dev monaco-editor-webpack-plugin
```

**Setup**:
```typescript
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

const editor = monaco.editor.create(document.getElementById('container'), {
  value: 'console.log("Hello, World!");',
  language: 'typescript',
  theme: 'vs-dark',
});
```

**Phase**: Phase 2 (F-7: Monaco Editor Integration)

---

### 🖥️ Terminal

#### **xterm.js 5.3+ + node-pty 1.1+**

**Why xterm.js**:
- ✅ Industry-standard terminal emulator (VS Code, Hyper use it)
- ✅ ANSI color support
- ✅ Ligature support (for Fira Code, JetBrains Mono)
- ✅ Addons (fit, webgl, search)

**Version**: `5.3+` (xterm.js), `1.1+` (node-pty)
**Install**: `npm install xterm node-pty xterm-addon-fit xterm-addon-webgl`

**Setup**:
```typescript
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const term = new Terminal({
  theme: {
    background: '#0d1117',
    foreground: '#e6edf3',
  },
  fontFamily: 'JetBrains Mono, Fira Code, monospace',
  fontSize: 14,
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();
```

**Phase**: Phase 2 (F-8: Integrated Terminal)

---

## Backend Stack

### ⚡ Electron Framework

#### **Electron 33.0+**

**Why Electron 33**:
- ✅ Latest stable (2025 release)
- ✅ Chromium 130+ (modern web APIs)
- ✅ Node.js 20 LTS (long-term support)
- ✅ Security patches (regular updates)

**Version**: `33.0+`
**Install**: `npm install --save-dev electron`

**Main Process** (`src/main/index.ts`):
```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile('index.html');
});

ipcMain.handle('get-worktrees', async () => {
  // Fetch worktrees from file system
  return [];
});
```

---

### 🔒 Preload Script

**Preload** (`src/preload/index.ts`):
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
});
```

**TypeScript Types** (`src/renderer/types/electron.d.ts`):
```typescript
interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

---

### 🗄️ Database

#### **better-sqlite3 11.0+**

**Why better-sqlite3**:
- ✅ Synchronous API (simpler than async SQLite)
- ✅ Fast (native C++ bindings)
- ✅ Embedded (no server required)
- ✅ ACID transactions

**Version**: `11.0+`
**Install**: `npm install better-sqlite3 @types/better-sqlite3`

**Setup** (`src/main/database.ts`):
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'miyabi.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    number INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    state TEXT NOT NULL,
    labels TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY,
    issue_number INTEGER,
    agent_type TEXT,
    status TEXT,
    duration INTEGER,
    created_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_issue_number ON task_history(issue_number);
  CREATE INDEX IF NOT EXISTS idx_created_at ON task_history(created_at DESC);
`);

export { db };
```

**Alternatives Considered**:
- ❌ `node-sqlite3`: Async API, more complex
- ❌ PostgreSQL: Overkill, requires server

---

### 🔗 GitHub API

#### **Octokit 9.0+ (REST + GraphQL)**

**Why Octokit**:
- ✅ Official GitHub API client
- ✅ REST + GraphQL support
- ✅ Automatic pagination
- ✅ Rate limit handling
- ✅ TypeScript types

**Version**: `9.0+`
**Install**: `npm install @octokit/rest @octokit/graphql`

**Setup** (`src/main/github-client.ts`):
```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function fetchIssues(owner: string, repo: string) {
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });
  return data;
}
```

---

### 🌐 WebSocket

#### **Native WebSocket**

**Why Native WebSocket**:
- ✅ Built into browsers (no extra dependency)
- ✅ Simple API
- ✅ Electron supports it natively

**Setup** (`src/renderer/services/websocket.ts`):
```typescript
export class WebSocketClient {
  private ws: WebSocket | null = null;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => console.log('Connected to WebSocket');
    this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
    this.ws.onerror = (error) => console.error('WebSocket error:', error);
    this.ws.onclose = () => this.reconnect(url);
  }

  private reconnect(url: string) {
    setTimeout(() => this.connect(url), 5000); // Retry after 5s
  }

  private handleMessage(message: any) {
    // Emit to stores/hooks
  }
}
```

---

### 📁 File System

#### **Native fs + chokidar 3.6+**

**Why chokidar**:
- ✅ Cross-platform file watcher
- ✅ Efficient (uses native OS APIs)
- ✅ Filters (ignore node_modules, .git)

**Version**: `3.6+`
**Install**: `npm install chokidar`

**Setup** (`src/main/file-watcher.ts`):
```typescript
import chokidar from 'chokidar';
import { BrowserWindow } from 'electron';

export function watchWorktrees(projectPath: string, window: BrowserWindow) {
  const watcher = chokidar.watch(`${projectPath}/.ai/worktrees`, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
  });

  watcher.on('change', (path) => {
    window.webContents.send('worktree-changed');
  });

  return watcher;
}
```

---

### 🛠️ CLI Executor

#### **Node.js child_process**

**Why child_process**:
- ✅ Built into Node.js
- ✅ Spawn processes, stream stdout/stderr
- ✅ Full control over process lifecycle

**Setup** (`src/main/cli-executor.ts`):
```typescript
import { spawn } from 'child_process';

export async function executeMiyabiCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn('miyabi', [command, ...args], { cwd });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data; });
    proc.stderr.on('data', (data) => { stderr += data; });
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 0 }));
  });
}
```

---

## Build & Development Tools

### 🚀 Build Tool

#### **Vite 6.0+**

**Why Vite**:
- ✅ Already used in Miyabi dashboard (consistent tooling)
- ✅ Fast HMR (< 50ms updates)
- ✅ ES modules (native browser support)
- ✅ Optimized production builds (Rollup under the hood)
- ✅ TypeScript support out of the box

**Version**: `6.0.11`
**Install**: `npm install --save-dev vite @vitejs/plugin-react`

**Config** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      entry: 'src/main/index.ts',
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@heroui/react', 'framer-motion'],
        },
      },
    },
  },
});
```

**Scripts** (`package.json`):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview"
  }
}
```

---

### 📦 Electron Builder

#### **electron-builder 25.0+**

**Why electron-builder**:
- ✅ Industry standard (VS Code, Atom, Slack use it)
- ✅ Auto-update support (electron-updater)
- ✅ Code signing (macOS, Windows)
- ✅ Multi-platform builds (DMG, NSIS, AppImage, deb, rpm)

**Version**: `25.0+`
**Install**: `npm install --save-dev electron-builder`

**Config** (`electron-builder.yml`):
```yaml
appId: com.miyabi.desktop
productName: Miyabi Desktop
copyright: Copyright © 2025 Miyabi Team

directories:
  buildResources: build
  output: dist

files:
  - dist/**
  - dist-electron/**
  - node_modules/**
  - package.json

mac:
  category: public.app-category.developer-tools
  target:
    - dmg
    - zip
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist

dmg:
  backgroundColor: '#0d1117'
  window:
    width: 600
    height: 400

win:
  target:
    - nsis
    - portable
  icon: build/icon.ico

linux:
  target:
    - AppImage
    - deb
  category: Development
```

---

### 🔄 Auto-Update

#### **electron-updater 6.1+**

**Why electron-updater**:
- ✅ Part of electron-builder ecosystem
- ✅ GitHub Releases integration (automatic discovery)
- ✅ Staged rollouts
- ✅ Progress tracking

**Version**: `6.1+`
**Install**: `npm install electron-updater`

**Setup** (`src/main/auto-updater.ts`):
```typescript
import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available. Download now?`,
    buttons: ['Download', 'Later'],
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'Restart to install update?',
    buttons: ['Restart', 'Later'],
  }).then((result) => {
    if (result.response === 0) autoUpdater.quitAndInstall();
  });
});
```

---

## Testing Stack

### 🧪 Unit & Integration Tests

#### **Vitest 3.2+**

**Why Vitest**:
- ✅ Vite-native (same config, faster)
- ✅ Jest-compatible API (easy migration)
- ✅ Fast (parallel execution, watch mode)
- ✅ Built-in coverage (c8)

**Version**: `3.2.4`
**Install**: `npm install --save-dev vitest @vitest/ui jsdom`

**Config** (`vite.config.ts`):
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/renderer/test-setup.ts',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    },
  },
});
```

**Scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

#### **Testing Library (React)**

**Why Testing Library**:
- ✅ User-centric testing (test behavior, not implementation)
- ✅ Accessibility-first (encourages semantic HTML)
- ✅ Industry standard (maintained by Kent C. Dodds)

**Version**: `16.3+`
**Install**: `npm install --save-dev @testing-library/react @testing-library/jest-dom`

**Example Test**:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { WorktreeCard } from './WorktreeCard';

test('renders worktree card with status', () => {
  render(<WorktreeCard name="worktree-270" status="active" />);
  expect(screen.getByText('worktree-270')).toBeInTheDocument();
  expect(screen.getByText('Active')).toBeInTheDocument();
});
```

---

### 🎭 E2E Tests

#### **Playwright 1.40+**

**Why Playwright**:
- ✅ Electron support (official Playwright Electron API)
- ✅ Fast, reliable (auto-wait, retry logic)
- ✅ Multi-browser (Chromium, Firefox, WebKit)
- ✅ Screenshot/video recording
- ✅ Trace viewer (debugging)

**Version**: `1.40+`
**Install**: `npm install --save-dev @playwright/test playwright`

**Config** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Example Test** (`tests/e2e/worktree.spec.ts`):
```typescript
import { test, expect, _electron as electron } from '@playwright/test';

test('open project and view worktrees', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();

  await window.click('text=Open Project');
  await window.fill('input[type="file"]', '/path/to/miyabi-project');
  await window.click('text=Worktrees');

  await expect(window.locator('text=worktree-270')).toBeVisible();

  await app.close();
});
```

---

## CI/CD Pipeline

### 🤖 GitHub Actions

**Why GitHub Actions**:
- ✅ Free for public repos
- ✅ Native GitHub integration
- ✅ Matrix builds (macOS, Windows, Linux)
- ✅ Artifact storage (binaries, logs)

**Workflow** (`.github/workflows/build.yml`):
```yaml
name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run lint
      - uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Sign and notarize
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run build:mac
      - uses: actions/upload-artifact@v3
        with:
          name: miyabi-desktop-macos
          path: dist/*.dmg

  release:
    needs: build
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            miyabi-desktop-macos/*.dmg
```

---

## Monitoring & Analytics

### 📊 Crash Reporting

#### **Sentry 8.0+**

**Why Sentry**:
- ✅ Industry standard (error tracking)
- ✅ Electron SDK (captures main + renderer errors)
- ✅ Source maps support (readable stack traces)
- ✅ Performance monitoring
- ✅ Free tier (5,000 events/month)

**Version**: `8.0+`
**Install**: `npm install @sentry/electron`

**Setup** (`src/main/index.ts`):
```typescript
import * as Sentry from '@sentry/electron/main';

Sentry.init({
  dsn: 'https://xxxxx@sentry.io/xxxxx',
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  },
});
```

**Renderer** (`src/renderer/index.tsx`):
```typescript
import * as Sentry from '@sentry/electron/renderer';

Sentry.init({
  dsn: 'https://xxxxx@sentry.io/xxxxx',
});
```

---

### 📈 Analytics (Optional)

#### **Mixpanel / Amplitude**

**Why Mixpanel**:
- ✅ User behavior tracking (events, funnels)
- ✅ Cohort analysis
- ✅ Free tier (100k events/month)

**Privacy**: Opt-in only (ask user on first launch)

**Setup**:
```typescript
import mixpanel from 'mixpanel-browser';

if (userOptedIn) {
  mixpanel.init('YOUR_PROJECT_TOKEN');
  mixpanel.track('App Opened');
}
```

---

## Dependency Management

### 📦 Package Manager

#### **npm 10+**

**Why npm**:
- ✅ Default with Node.js (no extra install)
- ✅ `package-lock.json` ensures reproducible builds
- ✅ Workspaces support (if needed for multi-package)

**Version**: `10+` (included with Node.js 20)

**Lock File**: Always commit `package-lock.json`

**Scripts**:
```json
{
  "scripts": {
    "install:clean": "rm -rf node_modules package-lock.json && npm install"
  }
}
```

---

### 🔒 Security

#### **npm audit + Dependabot**

**npm audit**:
```bash
npm audit         # Check for vulnerabilities
npm audit fix     # Auto-fix vulnerabilities
```

**Dependabot** (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

### 📌 Version Pinning

**Strategy**: Pin exact versions for stability

```json
{
  "dependencies": {
    "react": "18.3.1",         // Exact version
    "electron": "33.0.1"       // Exact version
  },
  "devDependencies": {
    "vitest": "3.2.4"          // Exact version
  }
}
```

**Rationale**: Electron apps should be deterministic (avoid surprise breakages)

---

## Security Stack

### 🔒 Content Security Policy (CSP)

**CSP Headers** (`index.html`):
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.github.com wss://localhost:*;
  font-src 'self' data:;
">
```

---

### 🔐 Secrets Management

#### **macOS Keychain / Windows Credential Manager**

**Why OS Keychain**:
- ✅ Secure (encrypted by OS)
- ✅ Native integration (no third-party dependency)
- ✅ Survives app uninstall/reinstall

**Library**: `keytar`
**Install**: `npm install keytar`

**Usage**:
```typescript
import keytar from 'keytar';

// Store GitHub token
await keytar.setPassword('miyabi-desktop', 'github-token', token);

// Retrieve GitHub token
const token = await keytar.getPassword('miyabi-desktop', 'github-token');
```

---

### 🛡️ Code Signing

**macOS**:
- Developer ID Application certificate (from Apple Developer account)
- Notarization (required for macOS 10.15+)

**Setup**:
```bash
# Export certificate
security find-identity -v -p codesigning

# Set environment variables
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"

# electron-builder will auto-sign and notarize
npm run build:mac
```

---

## Migration Path to Tauri

### 🔄 Phase 3+ Migration Strategy

**When to Migrate**:
- After 6+ months of Electron app usage
- After validating user feedback (is performance a real issue?)
- After Phase 2 features complete (Monaco, Terminal)

**Migration Effort Estimate**: 4-6 weeks

---

### 🧩 Portability Analysis

| Component | Electron | Tauri | Migration Effort |
|-----------|----------|-------|------------------|
| **React Components** | ✅ Portable | ✅ Portable | ⚪ None (100% reuse) |
| **TypeScript Code** | ✅ Portable | ✅ Portable | ⚪ None (100% reuse) |
| **Tailwind CSS** | ✅ Portable | ✅ Portable | ⚪ None (100% reuse) |
| **Zustand Stores** | ✅ Portable | ✅ Portable | ⚪ None (100% reuse) |
| **TanStack Query** | ✅ Portable | ✅ Portable | ⚪ None (100% reuse) |
| **IPC Handlers** | ❌ Electron-specific | ❌ Tauri commands | 🟡 Medium (rewrite IPC layer) |
| **File Watcher** | ❌ chokidar (Node.js) | ❌ Rust (notify crate) | 🟡 Medium (rewrite in Rust) |
| **SQLite** | ❌ better-sqlite3 | ❌ rusqlite (Rust) | 🟡 Medium (rewrite queries in Rust) |
| **Octokit** | ❌ Node.js library | ❌ octocrab (Rust) | 🟡 Medium (rewrite GitHub API calls) |
| **Auto-Update** | ❌ electron-updater | ❌ tauri-plugin-updater | 🟢 Low (similar API) |
| **Monaco Editor** | ✅ Works | ⚠️ Works (less tested) | 🟢 Low (may need adjustments) |
| **xterm.js** | ✅ Works | ⚠️ Works (edge cases) | 🟡 Medium (test thoroughly) |

**Overall Migration Effort**: ~80% of frontend portable, ~40% of backend needs rewrite

---

### 📝 Migration Checklist

**Phase 1: Preparation (1 week)**
- [ ] Install Tauri CLI: `npm install -g @tauri-apps/cli`
- [ ] Initialize Tauri: `tauri init`
- [ ] Setup Rust backend (`src-tauri/`)
- [ ] Migrate project config (`.miyabi.yml` parsing in Rust)

**Phase 2: IPC Layer (2 weeks)**
- [ ] Replace Electron IPC with Tauri commands
- [ ] Rewrite `get-worktrees` in Rust
- [ ] Rewrite `get-running-agents` in Rust
- [ ] Rewrite `execute-agent` (spawn Rust process)
- [ ] Test IPC layer with integration tests

**Phase 3: Backend Services (2 weeks)**
- [ ] Rewrite file watcher (use `notify` crate)
- [ ] Rewrite SQLite integration (use `rusqlite` crate)
- [ ] Rewrite GitHub API client (use `octocrab` crate)
- [ ] Test backend services

**Phase 4: Testing & Polish (1 week)**
- [ ] E2E tests with Playwright (Tauri mode)
- [ ] Performance testing (bundle size, memory, startup)
- [ ] Fix bugs, polish UX
- [ ] Update documentation

**Phase 5: Release (1 week)**
- [ ] Build Tauri app (DMG, AppImage, NSIS)
- [ ] Code sign + notarize (macOS)
- [ ] Beta test with 10 users
- [ ] Public release

---

## Conclusion

### ✅ Stack Summary

**Frontend**:
- React 18 + TypeScript 5.7 + Tailwind CSS 4.1 + HeroUI 2.8
- Zustand (state) + TanStack Query (data fetching)
- Monaco Editor (code) + xterm.js (terminal)
- Recharts (charts) + Framer Motion (animations)

**Backend**:
- Electron 33 (macOS, Windows, Linux)
- better-sqlite3 (database) + Octokit (GitHub API)
- chokidar (file watcher) + child_process (CLI executor)

**Build**:
- Vite 6 (bundler) + electron-builder 25 (packaging)
- Vitest 3 (unit tests) + Playwright 1.40 (E2E tests)
- GitHub Actions (CI/CD)

**Security**:
- Content Security Policy + Code Signing + Notarization
- keytar (secrets) + Sentry (crash reporting)

---

### 🚀 Next Steps

1. **Review this spec** with team (1 day)
2. **Setup development environment** (Sprint 0)
3. **Kick off Sprint 1** (Foundation)
4. **Iterate weekly** (Sprint reviews, retrospectives)
5. **Launch MVP** (Week 8)
6. **Evaluate Tauri migration** (Phase 3, 6+ months later)

---

**Questions?** Open an issue or contact the team lead.

**Let's build the best Miyabi Desktop experience! 🚀**
