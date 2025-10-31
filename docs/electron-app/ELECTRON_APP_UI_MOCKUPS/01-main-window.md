# Main Window Layout

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Priority**: 🔴 MVP Critical
**Implementation**: Sprint 1-2

---

## Overview

The main window is the primary interface for Miyabi Desktop. It uses a VS Code-inspired layout with:
- Native macOS title bar (traffic lights, drag area)
- Collapsible sidebar for navigation
- Large main content area
- Optional right panel for contextual info
- Status bar at bottom

---

## Layout Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🍎 Miyabi Desktop          [miyabi-private]              🔴 🟡 🟢         │ ← Title Bar (38px height)
├──────┬─────────────────────────────────────────────────────────┬──────────┤
│      │                                                          │          │
│  📁  │                                                          │  🤖      │
│  🔧  │                                                          │          │
│  📊  │                                                          │  Agent   │
│  📋  │          Main Content Area                              │  Status  │
│  📚  │                                                          │  Panel   │
│  ⚙️  │          (Dynamic based on selected tab)                │          │
│      │                                                          │  (320px) │
│ Side │                                                          │  (Can be │
│ Bar  │                                                          │  hidden) │
│ 240px│                                                          │          │
│      │                                                          │          │
│ (Can │                                                          │          │
│  be  │                                                          │          │
│ 64px)│                                                          │          │
│      │                                                          │          │
├──────┴─────────────────────────────────────────────────────────┴──────────┤
│  🌿 main  |  🔄 Synced  |  🔌 GitHub: Connected  |  💻 CPU: 45%  |  🧠 Mem: 380MB  |  🌙  │ ← Status Bar (28px)
└────────────────────────────────────────────────────────────────────────────┘

Total Window:
- Default: 1400px × 900px
- Minimum: 1024px × 768px
- Maximum: Fullscreen
```

---

## Component Breakdown

### 1. Title Bar (Native macOS)

**Dimensions**: Full width × 38px height

**Elements**:
- **Left**: App icon + "Miyabi Desktop" (16px font, semibold)
- **Center**: Current project name (14px font, muted color)
- **Right**: macOS traffic lights (🔴 close, 🟡 minimize, 🟢 zoom)

**Behavior**:
- Drag to move window
- Double-click to maximize/restore
- Traffic lights use native macOS behavior

**Implementation**:
```typescript
// In BrowserWindow options
{
  titleBarStyle: 'hiddenInset', // macOS native style
  trafficLightPosition: { x: 16, y: 16 },
}
```

**States**:
- **Active**: Title bright, traffic lights visible
- **Inactive**: Title muted, traffic lights grayed out

---

### 2. Sidebar (Navigation)

**Dimensions**: 240px × (window height - 66px) (collapsed: 64px)

**Structure**:
```
┌──────────────────┐
│  📁 Projects     │ ← Active (blue background)
│  🔧 Agents       │
│  📊 Dashboard    │
│  📋 Issues       │
│  📚 History      │
│  ⚙️ Settings     │
│                  │
│ ────────────────│
│  👤 User         │ ← Bottom section
│  🌙 Dark Mode    │
│  ❓ Help         │
└──────────────────┘
```

**Tab Definitions**:

| Icon | Label | Keyboard | Description |
|------|-------|----------|-------------|
| 📁 | Projects | Cmd+1 | Project management, recent projects |
| 🔧 | Agents | Cmd+2 | Agent execution monitoring |
| 📊 | Dashboard | Cmd+3 | System health, metrics |
| 📋 | Issues | Cmd+4 | GitHub Issue management |
| 📚 | History | Cmd+5 | Task history browser |
| ⚙️ | Settings | Cmd+, | App settings |

**Bottom Section**:
- **User**: Profile picture + username (click to show account menu)
- **Dark Mode**: Toggle switch (click to toggle, uses system preference by default)
- **Help**: Opens documentation (Cmd+?)

**Interactions**:
- **Click tab**: Switch main content area
- **Cmd+B**: Toggle sidebar collapse (240px ↔ 64px)
- **Hover (collapsed)**: Show tooltip with tab name
- **Right-click tab**: Show context menu (pin, hide, reorder)

**States**:
- **Active tab**: Blue background (`--primary`), icon + label visible
- **Inactive tab**: Transparent, icon + label muted
- **Hover**: Slight gray background (`--surface-hover`)
- **Collapsed**: Only icons visible (64px width)

**Styling**:
```css
.sidebar {
  width: 240px; /* or 64px when collapsed */
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.sidebar-tab {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.sidebar-tab.active {
  background: rgba(31, 111, 235, 0.1);
  border-left-color: var(--primary);
}

.sidebar-tab:hover {
  background: var(--surface-hover);
}
```

---

### 3. Main Content Area

**Dimensions**: (window width - sidebar - right panel) × (window height - 66px)

**Content**: Dynamic based on selected sidebar tab
- **Projects Tab** → Project list, recent projects, open project dialog
- **Agents Tab** → Worktree visualization + agent monitor
- **Dashboard Tab** → System health metrics, charts
- **Issues Tab** → GitHub Issue list, filters, search
- **History Tab** → Task history table, search
- **Settings Tab** → Settings panel

**Behavior**:
- Scrollable vertically (overflow-y: auto)
- Responsive padding (24px on all sides)

**States**:
- **Loading**: Skeleton loader or spinner
- **Empty**: Empty state illustration + CTA button
- **Error**: Error message + retry button

---

### 4. Right Panel (Contextual)

**Dimensions**: 320px × (window height - 66px)

**Visibility**:
- Hidden by default (can toggle with Cmd+R or click "Show Panel" button)
- Visible when relevant context exists (e.g., agent running)

**Content** (depends on context):
- **Agent Status**: When agents are running (see `03-agent-monitor.md`)
- **Issue Details**: When issue is selected (see `04-issue-manager.md`)
- **Task Details**: When task is selected (see `05-task-history.md`)
- **File Details**: When file is open in Monaco (see `07-monaco-editor.md`)

**Structure**:
```
┌──────────────────────┐
│  🤖 Agent Status     │ ← Header (collapsible)
│  ─────────────────── │
│  🟢 Running: 3       │
│  ⏸️  Paused: 1        │
│  ❌ Failed: 0        │
│  ✅ Completed: 47    │
│                      │
│  Recent:             │
│  • ReviewAgent       │
│    8m 23s ago        │
│  • CodeGenAgent      │
│    15m 12s ago       │
│                      │
│  [View All History]  │
└──────────────────────┘
```

**Interactions**:
- **Drag left border**: Resize panel (320px - 600px)
- **Click header**: Collapse section
- **Click "×" (top-right)**: Hide panel

---

### 5. Status Bar

**Dimensions**: Full width × 28px height

**Structure**:
```
┌────────────────────────────────────────────────────────────────────────┐
│ 🌿 main  |  🔄 Synced  |  🔌 GitHub: Connected  |  💻 CPU: 45%  |  🧠 Mem: 380MB  |  🌙  │
└────────────────────────────────────────────────────────────────────────┘
```

**Sections** (left to right):

| Section | Content | Click Action |
|---------|---------|--------------|
| **Git Branch** | Current branch (e.g., `🌿 main`) | Show branch selector dropdown |
| **Sync Status** | GitHub sync status (`🔄 Synced` / `⏳ Syncing...` / `❌ Error`) | Trigger manual sync |
| **Connections** | `🔌 GitHub: Connected`, `🌐 WebSocket: Connected`, `🤖 Claude API: OK` | Show connection details modal |
| **System Resources** | `💻 CPU: 45%` `🧠 Mem: 380MB` | Open system health dashboard |
| **Theme** | `🌙` (dark) or `☀️` (light) | Toggle theme |

**Styling**:
```css
.status-bar {
  height: 28px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  color: var(--foreground-muted);
}

.status-bar-item {
  padding: 0 8px;
  cursor: pointer;
  border-right: 1px solid var(--border);
}

.status-bar-item:hover {
  color: var(--foreground);
  background: var(--surface-hover);
}
```

**States**:
- **GitHub Connected**: Green icon (`🔌`), "Connected"
- **GitHub Disconnected**: Red icon (`❌`), "Disconnected"
- **Syncing**: Animated spinner (`⏳`), "Syncing..."

---

## Interactions

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd+1-6** | Switch sidebar tabs |
| **Cmd+B** | Toggle sidebar collapse |
| **Cmd+R** | Toggle right panel |
| **Cmd+,** | Open settings |
| **Cmd+K** | Command palette |
| **Cmd+P** | Quick switcher (projects, files) |
| **Cmd+Shift+P** | Command palette |
| **Cmd+W** | Close window |
| **Cmd+N** | New window |
| **Cmd+O** | Open project |
| **Cmd+?** | Open help |

---

### Mouse Interactions

| Action | Result |
|--------|--------|
| **Click sidebar tab** | Switch view |
| **Right-click sidebar tab** | Context menu (pin, hide, reorder) |
| **Click status bar item** | Show details/toggle |
| **Drag title bar** | Move window |
| **Double-click title bar** | Maximize/restore |
| **Drag right panel border** | Resize panel |

---

## States

### Window States

**Normal** (default):
- 1400px × 900px
- Centered on screen
- Sidebar visible (240px)
- Right panel hidden

**Maximized** (fullscreen):
- Full screen (macOS native fullscreen)
- Sidebar visible
- More horizontal space for main content

**Minimized**:
- Window in Dock
- App icon badge shows running agents count

---

### Empty State (No Project Open)

**Main Content**:
```
┌──────────────────────────────────┐
│                                  │
│         📁                       │
│                                  │
│    No Project Open               │
│                                  │
│    Open a Miyabi project to      │
│    start managing agents         │
│                                  │
│    [Open Project] [Recent ▼]     │
│                                  │
└──────────────────────────────────┘
```

---

### Loading State

**Skeleton Loader**:
- Sidebar: Show tab icons (no labels)
- Main content: Show skeleton cards
- Status bar: Show "Loading..." text

---

### Error State

**Connection Error**:
```
┌──────────────────────────────────┐
│         ❌                        │
│                                  │
│    Connection Error              │
│                                  │
│    Unable to connect to Miyabi   │
│    Web API (localhost:8080)      │
│                                  │
│    [Retry] [Check Logs]          │
└──────────────────────────────────┘
```

---

## Responsive Behavior

### Window Widths

| Width | Behavior |
|-------|----------|
| **< 1024px** | Minimum width (scroll horizontally if needed) |
| **1024px - 1400px** | Auto-collapse sidebar to 64px (icon-only) |
| **1400px - 1920px** | Normal layout (sidebar 240px, right panel hidden) |
| **> 1920px** | Show right panel by default |

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate focusable elements (tabs, buttons, inputs)
- **Shift+Tab**: Navigate backwards
- **Enter/Space**: Activate focused element
- **Escape**: Close modals, cancel actions
- **Arrow keys**: Navigate lists, tables

### Screen Reader

**ARIA Labels**:
```html
<nav aria-label="Main navigation" role="navigation">
  <button aria-label="Projects" aria-current="page">
    📁 Projects
  </button>
</nav>

<main aria-label="Main content" role="main">
  <!-- Content -->
</main>

<aside aria-label="Agent status panel" role="complementary">
  <!-- Right panel -->
</aside>

<footer aria-label="Status bar" role="contentinfo">
  <!-- Status bar -->
</footer>
```

### Focus Indicators

- Blue outline (2px) on focused elements
- Skip navigation link (for screen readers)

---

## Implementation Notes

### React Component Structure

```
<MainWindow>
  <TitleBar />
  <div className="window-body">
    <Sidebar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      collapsed={sidebarCollapsed}
    />
    <MainContent activeTab={activeTab} />
    <RightPanel visible={rightPanelVisible} />
  </div>
  <StatusBar />
</MainWindow>
```

### State Management (Zustand)

```typescript
interface UIStore {
  activeTab: string;
  sidebarCollapsed: boolean;
  rightPanelVisible: boolean;
  theme: 'light' | 'dark';
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleTheme: () => void;
}
```

---

## Changelog

**v1.0.0** (2025-10-31):
- Initial mockup design
- Defined layout, components, interactions
- Added accessibility guidelines
