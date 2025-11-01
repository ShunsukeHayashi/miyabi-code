# Miyabi Desktop - UI/UX Design System

**Version**: 1.0.0
**Last Updated**: 2025-11-02
**Status**: Draft

---

## 📋 Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Visual Design System](#visual-design-system)
3. [Component Architecture](#component-architecture)
4. [Layout System](#layout-system)
5. [Interaction Patterns](#interaction-patterns)
6. [Accessibility](#accessibility)
7. [Performance Guidelines](#performance-guidelines)
8. [Implementation Guide](#implementation-guide)

---

## 🎨 Design Philosophy

### Core Principles

#### 1. **Ultra Minimalism**
- **Breathable Space**: Generous padding and margins for visual clarity
- **Reduced Visual Noise**: Minimal borders, shadows, and decorative elements
- **Typography-First**: Font weight and size create hierarchy, not color
- **Monochromatic Base**: Gray-scale foundation with accent colors for states

#### 2. **Developer-Centric UX**
- **Terminal-Like Aesthetics**: Familiarity for developers
- **Keyboard-First**: All actions accessible via shortcuts
- **Command Palette**: Instant access to any function (⌘K)
- **Real-Time Feedback**: Live status updates, streaming logs

#### 3. **Information Density**
- **8-Panel Architecture**: Separate concerns, reduce cognitive load
- **Contextual Details**: Show information when needed, not always
- **Progressive Disclosure**: Start simple, reveal complexity on demand
- **Visual Hierarchy**: Clear primary/secondary/tertiary actions

#### 4. **AI-Native Design**
- **Agent-Centric Interface**: Agents are first-class citizens
- **Execution State Visibility**: Clear status indicators (idle/running/success/failed)
- **Output Streaming**: Real-time log display during execution
- **Character Personality**: Agent names and colors reflect roles

---

## 🎨 Visual Design System

### Color Palette

#### Base Colors (Grayscale)

```css
/* Background */
--gray-50:  hsl(210, 40%, 98%)   /* Light background, secondary panels */
--white:    hsl(0, 0%, 100%)     /* Primary background, cards */

/* Text */
--gray-900: hsl(222, 47%, 11%)   /* Primary text */
--gray-700: hsl(217, 19%, 27%)   /* Secondary text */
--gray-500: hsl(217, 13%, 50%)   /* Tertiary text, labels */
--gray-400: hsl(218, 11%, 65%)   /* Disabled text, hints */

/* Borders & Dividers */
--gray-200: hsl(214, 32%, 91%)   /* Default borders */
--gray-100: hsl(210, 36%, 96%)   /* Hover states */

/* Active/Selected States */
--gray-900: hsl(222, 47%, 11%)   /* Active sidebar button */
--gray-800: hsl(217, 33%, 17%)   /* Hover on active state */
```

#### Accent Colors (Semantic)

```css
/* Status Colors */
--blue-400:   hsl(213, 94%, 68%)  /* Info, running state */
--green-400:  hsl(142, 76%, 59%)  /* Success */
--red-400:    hsl(0, 84%, 60%)    /* Error, destructive */
--yellow-400: hsl(45, 93%, 58%)   /* Warning */
--purple-400: hsl(271, 91%, 73%)  /* Special actions */

/* Agent Role Colors */
--coordinator: hsl(239, 84%, 67%)  /* Purple gradient - Coordination */
--codegen:     hsl(142, 76%, 59%)  /* Green - Code generation */
--review:      hsl(45, 93%, 58%)   /* Yellow - Review */
--deployment:  hsl(0, 84%, 60%)    /* Red - Deployment */
--issue:       hsl(213, 94%, 68%)  /* Blue - Issue management */
--pr:          hsl(271, 91%, 73%)  /* Purple - PR management */
--refresher:   hsl(180, 65%, 55%)  /* Cyan - Refresh/Sync */
```

#### Gradient Overlays (Agent Execution)

```css
/* Background gradients for agent-specific panels */
.gradient-coordinator {
  background: linear-gradient(135deg,
    hsla(239, 84%, 67%, 0.1) 0%,
    hsla(262, 83%, 68%, 0.1) 100%);
}

.gradient-codegen {
  background: linear-gradient(135deg,
    hsla(142, 76%, 59%, 0.1) 0%,
    hsla(158, 64%, 52%, 0.1) 100%);
}
```

---

### Typography

#### Font Stack

```css
/* Primary Font - System UI */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;

/* Monospace Font - Terminal/Code */
--font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono",
             "Courier New", monospace;
```

#### Font Weights

```css
--font-extralight: 200  /* Logo, decorative */
--font-light:      300  /* Default body, labels */
--font-normal:     400  /* Emphasis */
--font-medium:     500  /* Buttons, headings (rare) */
--font-semibold:   600  /* Headings (rare) */
```

**Default**: `font-light (300)` - Creates airy, modern feel

#### Type Scale

```css
/* Headings */
--text-3xl: 1.875rem  /* 30px - Page titles */
--text-2xl: 1.5rem    /* 24px - Section headers */
--text-xl:  1.25rem   /* 20px - Sub-headers */
--text-lg:  1.125rem  /* 18px - Large body */

/* Body */
--text-base: 1rem     /* 16px - Default body */
--text-sm:   0.875rem /* 14px - Secondary text */
--text-xs:   0.75rem  /* 12px - Labels, hints */
```

#### Line Heights

```css
--leading-tight: 1.25   /* Headings */
--leading-normal: 1.5   /* Body text */
--leading-relaxed: 1.75 /* Long-form content */
```

---

### Spacing System

#### Spacing Scale (based on 4px)

```css
--space-1:  0.25rem   /* 4px  - Tight spacing */
--space-2:  0.5rem    /* 8px  - Small gaps */
--space-3:  0.75rem   /* 12px - Default gap */
--space-4:  1rem      /* 16px - Standard spacing */
--space-6:  1.5rem    /* 24px - Large spacing */
--space-8:  2rem      /* 32px - Extra large */
--space-12: 3rem      /* 48px - Section spacing */
--space-16: 4rem      /* 64px - Major sections */
```

#### Usage Guidelines

| Element | Padding | Margin |
|---------|---------|--------|
| Buttons | `py-3 px-6` (12px 24px) | `space-4` between |
| Cards | `p-4` (16px) | `space-3` between |
| Panels | `p-6` (24px) | `space-0` |
| Sections | `p-8` (32px) | `space-6` between |
| Page Header | `p-6` (24px) | `border-b` |

---

### Border Radius

```css
--rounded-lg: 0.5rem   /* 8px  - Cards, inputs */
--rounded-xl: 0.75rem  /* 12px - Buttons, larger cards */
--rounded-2xl: 1rem    /* 16px - Modals, major components */
--rounded-full: 9999px /* Pills, status dots */
```

**Default**: `rounded-xl (12px)` - Soft, modern corners

---

### Shadows

#### Elevation System

```css
/* Minimal shadows - use sparingly */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Active state shadow */
--shadow-active: 0 0 0 3px rgba(107, 114, 128, 0.1);
```

**Philosophy**: Borders over shadows for cleaner aesthetic

---

## 🧩 Component Architecture

### UI Component Hierarchy

```
App.tsx (Root)
│
├── TauriStatusIndicator (Banner)
│
├── Sidebar (80px width)
│   ├── Logo ("M")
│   ├── Navigation Buttons (8 panels)
│   └── Settings Button
│
├── Main Content Area
│   ├── Panel-specific Content
│   │   ├── AgentExecutionPanel
│   │   ├── DeploymentDashboard
│   │   ├── TerminalManager
│   │   ├── WorkflowDAGViewer
│   │   ├── NarrationPlayer
│   │   ├── IssueDashboard
│   │   ├── AutoMergeSettings
│   │   └── TmuxManager
│   │
│   └── Status Bar (40px height)
│
└── CommandPalette (Overlay)
```

---

### Core Components

#### 1. **Sidebar Navigation**

**Design Specs**:
- Width: `80px` (fixed)
- Background: `gray-50`
- Border: `border-r border-gray-200`
- Padding: `py-8` (vertical)
- Item spacing: `space-y-6`

**Button States**:
```css
/* Default */
.sidebar-button {
  @apply p-4 rounded-xl transition-all duration-200;
  @apply text-gray-400 hover:text-gray-900 hover:bg-gray-100;
}

/* Active */
.sidebar-button-active {
  @apply bg-gray-900 text-white;
}
```

**Icon Size**: `24px` (lucide-react icons with `strokeWidth: 1.5`)

---

#### 2. **Panel Headers**

**Standard Header Pattern**:
```tsx
<div className="p-6 border-b border-gray-200">
  <h2 className="text-2xl font-light text-gray-900 mb-1">
    Panel Title
  </h2>
  <p className="text-sm font-light text-gray-500">
    Panel description or stats
  </p>
</div>
```

**With Actions**:
```tsx
<div className="flex items-center justify-between mb-4">
  <div>
    <h2 className="text-2xl font-light text-gray-900 mb-1">
      Panel Title
    </h2>
  </div>
  <div className="flex items-center space-x-3">
    <button className="p-2 text-gray-400 hover:text-gray-900">
      <RefreshCw size={18} />
    </button>
  </div>
</div>
```

---

#### 3. **Buttons**

**Primary Button** (Main actions):
```tsx
<button className="px-6 py-3 bg-gray-900 text-white rounded-xl
                   font-light hover:bg-gray-800
                   transition-all duration-200
                   disabled:bg-gray-200 disabled:text-gray-400">
  Execute Agent
</button>
```

**Secondary Button** (Auxiliary actions):
```tsx
<button className="px-6 py-3 bg-white text-gray-900 border border-gray-200
                   rounded-xl font-light hover:border-gray-900
                   transition-all duration-200">
  Cancel
</button>
```

**Icon Button** (Toolbar):
```tsx
<button className="p-2 text-gray-400 hover:text-gray-900
                   transition-colors rounded-xl hover:bg-gray-100">
  <Settings size={18} />
</button>
```

---

#### 4. **Cards**

**Standard Card**:
```tsx
<div className="p-4 bg-gray-50 border border-gray-200 rounded-xl
                hover:border-gray-900 transition-all duration-200
                cursor-pointer group">
  {/* Card content */}
</div>
```

**Active/Selected Card**:
```tsx
<div className="p-4 bg-gray-900 text-white rounded-xl shadow-lg">
  {/* Card content */}
</div>
```

**Issue Card** (Kanban):
```tsx
<div className="p-4 bg-gray-50 border border-gray-200 rounded-xl
                hover:border-gray-900 transition-all duration-200
                cursor-pointer group">
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs font-light text-gray-500">#{number}</span>
    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
      <ExternalLink size={14} />
    </button>
  </div>
  <h4 className="text-sm font-light text-gray-900 mb-3 line-clamp-2">
    {title}
  </h4>
  {/* Labels, assignees, etc. */}
</div>
```

---

#### 5. **Forms & Inputs**

**Text Input**:
```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-gray-50 border border-gray-200
             rounded-xl focus:outline-none focus:border-gray-900
             text-sm font-light transition-all duration-200"
  placeholder="Search..."
/>
```

**Select Dropdown**:
```tsx
<select className="w-full px-4 py-2 bg-white border border-gray-200
                   rounded-xl focus:outline-none focus:border-gray-900
                   text-sm font-light transition-all duration-200">
  <option value="">Select...</option>
</select>
```

**Search Input** (with icon):
```tsx
<div className="relative">
  <Search
    size={18}
    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
  />
  <input
    type="text"
    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200
               rounded-xl focus:outline-none focus:border-gray-900
               text-sm font-light"
    placeholder="Search issues..."
  />
</div>
```

---

#### 6. **Status Indicators**

**Agent Status Badge**:
```tsx
{/* Running */}
<span className="flex items-center space-x-1 text-sm font-light text-blue-400">
  <Clock size={14} className="animate-pulse" />
  <span>Running...</span>
</span>

{/* Success */}
<span className="flex items-center space-x-1 text-sm font-light text-green-400">
  <CheckCircle size={14} />
  <span>Success</span>
</span>

{/* Failed */}
<span className="flex items-center space-x-1 text-sm font-light text-red-400">
  <AlertCircle size={14} />
  <span>Failed</span>
</span>
```

**Agent Color Dot**:
```tsx
<div
  className="w-3 h-3 rounded-full"
  style={{ backgroundColor: agentColor }}
/>
```

---

#### 7. **Terminal Output Display**

**Terminal Container**:
```tsx
<div className="flex-1 overflow-y-auto bg-gray-900 p-6
                font-mono text-sm text-gray-100">
  {output.map((line, index) => (
    <div key={index} className="mb-1">{line}</div>
  ))}
  <div ref={outputEndRef} />
</div>
```

**Empty State** (No output yet):
```tsx
<div className="flex flex-col items-center justify-center h-full
                text-gray-400 space-y-8 p-8">
  <div className="w-16 h-16 mx-auto">
    <Clock size={64} className="text-blue-400 animate-pulse" />
  </div>
  <p className="text-2xl font-light text-blue-400">実行中...</p>
  <p className="text-sm text-gray-500">
    エージェントがタスクを処理しています
  </p>
</div>
```

---

#### 8. **Labels & Badges**

**GitHub Label Chip**:
```tsx
<span
  className="px-2 py-0.5 text-xs font-light rounded"
  style={{
    backgroundColor: `#${labelColor}20`,
    color: `#${labelColor}`,
    border: `1px solid #${labelColor}40`
  }}
>
  {emoji} {labelName}
</span>
```

**Filter Badge**:
```tsx
<button className="px-3 py-1 text-xs font-light rounded-lg
                   bg-gray-900 text-white">
  {emoji} {labelName}
</button>
```

---

## 📐 Layout System

### Panel Layout Patterns

#### 1. **Two-Column Layout** (AgentExecutionPanel)

```tsx
<div className="h-full flex">
  {/* Left Sidebar - Agent Selection */}
  <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
    <div className="p-6 border-b border-gray-200">
      {/* Header */}
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      {/* Scrollable content */}
    </div>
    <div className="p-6 border-t border-gray-200">
      {/* Controls */}
    </div>
  </div>

  {/* Right Panel - Execution Output */}
  <div className="flex-1 flex flex-col bg-white">
    <div className="p-6 border-b border-gray-200">
      {/* Header */}
    </div>
    <div className="flex-1 overflow-y-auto">
      {/* Main content */}
    </div>
  </div>
</div>
```

**Characteristics**:
- Left sidebar: `w-80` (320px) fixed width
- Right panel: `flex-1` (fills remaining space)
- Header: Fixed height with `border-b`
- Content: Scrollable with `overflow-y-auto`
- Footer/Controls: Fixed height with `border-t`

---

#### 2. **Kanban Board Layout** (IssueDashboard)

```tsx
<div className="h-full flex flex-col bg-white">
  {/* Header */}
  <div className="p-6 border-b border-gray-200">
    {/* Search, filters, actions */}
  </div>

  {/* Horizontal Scrollable Columns */}
  <div className="flex-1 overflow-x-auto">
    <div className="flex p-6 space-x-4 min-w-max">
      {columns.map(column => (
        <div key={column.id} className="w-80 flex-shrink-0">
          {/* Column header */}
          <div className="mb-4">
            <h3 className="text-lg font-light text-gray-900 mb-1">
              {column.title}
            </h3>
          </div>
          {/* Cards */}
          <div className="space-y-3">
            {column.items.map(item => (
              <IssueCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Characteristics**:
- Columns: `w-80` (320px) each
- Horizontal scroll: `overflow-x-auto`
- Cards: Vertical stack with `space-y-3`
- Minimum width: `min-w-max` prevents wrapping

---

#### 3. **Full-Screen Canvas** (WorkflowDAGViewer)

```tsx
<div className="h-full flex flex-col">
  {/* Toolbar */}
  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
    {/* Controls */}
  </div>

  {/* ReactFlow Canvas */}
  <div className="flex-1 bg-gray-50">
    <ReactFlow nodes={nodes} edges={edges}>
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  </div>
</div>
```

---

### Responsive Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

**Current Implementation**: Desktop-first (1280px+ optimized)

**Future**: Add responsive layouts for tablet/mobile

---

## 🖱️ Interaction Patterns

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` or `⌘⇧P` | Open Command Palette |
| `⌘1` - `⌘8` | Switch to Panel 1-8 |
| `Esc` | Close modals/palette |
| `⌘R` | Refresh current panel |
| `⌘Enter` | Execute selected agent |

**Implementation**:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCommandPaletteOpen(true);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

---

### Hover States

**Standard Hover**:
```css
/* Card hover */
.card:hover {
  border-color: var(--gray-900);
}

/* Button hover */
.button:hover {
  background-color: var(--gray-800);
}

/* Icon button hover */
.icon-button:hover {
  color: var(--gray-900);
  background-color: var(--gray-100);
}
```

**Opacity Reveal** (External link icons):
```css
.group .external-link {
  opacity: 0;
  transition: opacity 200ms;
}

.group:hover .external-link {
  opacity: 1;
}
```

---

### Transitions

**Default Duration**: `200ms` (fast, snappy)

```css
/* Standard transition */
transition-all duration-200

/* Color transitions only */
transition-colors duration-200

/* Opacity transitions */
transition-opacity duration-200
```

**Animation**:
```css
/* Pulse (running state) */
.animate-pulse

/* Spin (loading) */
.animate-spin
```

---

### Focus States

**Accessibility-First**:
```css
/* Input focus */
.input:focus {
  outline: none;
  border-color: var(--gray-900);
}

/* Button focus */
.button:focus-visible {
  outline: 2px solid var(--gray-900);
  outline-offset: 2px;
}
```

---

## ♿ Accessibility

### ARIA Labels

```tsx
<button
  aria-label="Execute selected agent"
  title="Execute Agent"
>
  <Play size={18} />
</button>
```

### Keyboard Navigation

- All interactive elements focusable
- Tab order follows visual hierarchy
- Enter/Space activate buttons
- Escape closes modals

### Screen Reader Support

```tsx
<div role="status" aria-live="polite">
  {agentStatus === "running" && "Agent is currently executing"}
</div>
```

### Color Contrast

- **Text on White**: `gray-900` (21:1 contrast) - WCAG AAA
- **Secondary Text**: `gray-700` (8.5:1 contrast) - WCAG AA
- **Status Colors**: All meet WCAG AA minimum

---

## ⚡ Performance Guidelines

### Code Splitting

```tsx
// Lazy load panels
const AgentExecutionPanel = lazy(() => import('./components/AgentExecutionPanel'));
const IssueDashboard = lazy(() => import('./components/IssueDashboard'));
```

### Virtualization

**For long lists** (Issue cards, execution history):
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Memoization

```tsx
// Expensive computations
const filteredIssues = useMemo(() => {
  return issues.filter(issue =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [issues, searchQuery]);

// Component memoization
const IssueCard = memo(({ issue }: { issue: GitHubIssue }) => {
  // ...
});
```

### Debouncing

```tsx
// Search input
const debouncedSearch = useDebouncedCallback(
  (value: string) => setSearchQuery(value),
  300
);
```

---

## 🛠️ Implementation Guide

### Tech Stack

```json
{
  "framework": "React 19.1.0",
  "language": "TypeScript 5.8.3",
  "styling": "Tailwind CSS 3.x",
  "icons": "lucide-react 0.548.0",
  "build": "Vite 7.0.4",
  "desktop": "Tauri 2.x"
}
```

### File Structure

```
miyabi-desktop/src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── AgentExecutionPanel.tsx
│   ├── IssueDashboard.tsx
│   ├── TerminalManager.tsx
│   ├── WorkflowDAGViewer.tsx
│   ├── NarrationPlayer.tsx
│   ├── DeploymentDashboard.tsx
│   ├── AutoMergeSettings.tsx
│   ├── TmuxManager.tsx
│   ├── SettingsPanel.tsx
│   └── CommandPalette.tsx
├── lib/
│   ├── agent-api.ts          # Agent execution API
│   ├── github-api.ts          # GitHub API client
│   └── utils.ts               # Utility functions
├── context/
│   └── Phase9Context.tsx      # Global state
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── index.css                  # Global styles + Tailwind
└── App.css                    # Component styles
```

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Extend with custom colors if needed
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### CSS Custom Properties

```css
/* index.css */
@layer base {
  :root {
    --sidebar-width: 80px;
    --status-bar-height: 40px;
    --panel-header-height: 80px;
  }
}
```

---

## 📚 Design Patterns

### State Management

**Local State** (useState):
- Panel-specific UI state
- Form inputs
- Modal open/closed

**Context** (React Context):
- Global settings
- Theme preferences
- Authentication state

**Server State** (Future: React Query):
- GitHub Issues
- Agent execution results
- Repository metadata

### Error Handling

**User-Facing Errors**:
```tsx
{error && (
  <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200
                  rounded-xl text-sm text-red-700">
    {error}
  </div>
)}
```

**Loading States**:
```tsx
{loading ? (
  <div className="flex items-center justify-center h-full">
    <RefreshCw className="animate-spin text-gray-400" size={24} />
  </div>
) : (
  <Content />
)}
```

---

## 🎯 Design Checklist

### For New Components

- [ ] Uses `font-light` as default weight
- [ ] Rounded corners: `rounded-xl` (12px)
- [ ] Borders: `border-gray-200`
- [ ] Hover states: `hover:border-gray-900` or `hover:bg-gray-100`
- [ ] Transitions: `transition-all duration-200`
- [ ] Text hierarchy: `text-2xl` → `text-sm` → `text-xs`
- [ ] Spacing: `p-6` panels, `p-4` cards, `space-y-3` stacks
- [ ] Icons: `size={18}` for buttons, `size={24}` for navigation
- [ ] Accessibility: `aria-label`, `title` attributes
- [ ] Keyboard: Focus states, Enter/Space handlers

### For New Panels

- [ ] Header: `p-6 border-b border-gray-200`
- [ ] Content: `flex-1 overflow-y-auto`
- [ ] Background: `bg-white`
- [ ] Title: `text-2xl font-light text-gray-900`
- [ ] Description: `text-sm font-light text-gray-500`
- [ ] Consistent padding: `p-6`
- [ ] Status bar: Show relevant stats
- [ ] Keyboard shortcuts: Document and implement

---

## 📖 References

### Design Inspiration

- **Linear**: Clean, minimal, keyboard-first
- **Vercel Dashboard**: Typography-heavy, high contrast
- **GitHub CLI**: Terminal aesthetics
- **Tailwind UI**: Component patterns

### Tools

- **Figma**: Design mockups (future)
- **Tailwind CSS IntelliSense**: VSCode extension
- **React DevTools**: Component debugging
- **Lighthouse**: Performance auditing

---

## 🚀 Future Enhancements

### Phase 1 (Current)
- ✅ 8-panel navigation
- ✅ Agent execution interface
- ✅ GitHub Issues Kanban
- ✅ Terminal output display
- ✅ Command Palette

### Phase 2 (Next 3 Months)
- [ ] Dark mode support
- [ ] Responsive layouts (tablet, mobile)
- [ ] Advanced keyboard shortcuts
- [ ] Custom themes
- [ ] Notification system

### Phase 3 (Next 6 Months)
- [ ] Agent execution history timeline
- [ ] Real-time collaboration
- [ ] Customizable dashboard layouts
- [ ] Performance monitoring dashboard
- [ ] Integrated help system

---

**Maintained by**: Miyabi Team
**Version**: 1.0.0
**Status**: Living Document - Updated as design evolves
