# Miyabi Desktop - Component Catalog

**Version**: 1.0.0
**Last Updated**: 2025-11-02
**Purpose**: Complete reference for all UI components in Miyabi Desktop

---

## 📋 Table of Contents

1. [Base Components](#base-components)
2. [Layout Components](#layout-components)
3. [Feature Components](#feature-components)
4. [Usage Examples](#usage-examples)
5. [Component API Reference](#component-api-reference)

---

## 🧱 Base Components

### Button

**Location**: `src/components/ui/button.tsx`

**Variants**:

| Variant | Use Case | Visual |
|---------|----------|--------|
| `default` | Primary actions | `bg-blue-600 text-white hover:bg-blue-700` |
| `destructive` | Delete, remove actions | `bg-red-600 text-white hover:bg-red-700` |
| `outline` | Secondary actions | `border border-gray-300 hover:bg-gray-100` |
| `secondary` | Tertiary actions | `bg-gray-200 text-gray-900 hover:bg-gray-300` |
| `ghost` | Minimal actions | `transparent hover:bg-gray-100` |
| `link` | Text links | `text-blue-600 underline-offset-4 hover:underline` |

**Sizes**:

| Size | Dimensions | Use Case |
|------|------------|----------|
| `sm` | `h-9 px-3` | Compact spaces, inline buttons |
| `default` | `h-10 px-4 py-2` | Standard buttons |
| `lg` | `h-11 px-8` | Prominent CTAs |
| `icon` | `h-10 w-10` | Icon-only buttons |

**Example**:
```tsx
import { Button } from './components/ui/button';

<Button variant="default" size="lg">
  Execute Agent
</Button>
```

**States**:
- `:hover` - Darker background
- `:focus-visible` - Ring outline
- `:disabled` - Opacity 50%, no pointer events

---

### Card

**Location**: `src/components/ui/card.tsx`

**Components**:
- `Card` - Container
- `CardHeader` - Top section with padding
- `CardTitle` - Large heading
- `CardDescription` - Subtitle text
- `CardContent` - Main content area
- `CardFooter` - Bottom section for actions

**Example**:
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Agent Execution</CardTitle>
    <CardDescription>Execute Miyabi agents to process tasks</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Execute</Button>
  </CardFooter>
</Card>
```

**Styling**:
```css
.card {
  @apply rounded-lg border border-gray-200 bg-white shadow-sm;
}

.card-header {
  @apply flex flex-col space-y-1.5 p-6;
}

.card-title {
  @apply text-2xl font-semibold leading-none tracking-tight;
}

.card-description {
  @apply text-sm text-gray-600;
}

.card-content {
  @apply p-6 pt-0;
}

.card-footer {
  @apply flex items-center p-6 pt-0;
}
```

---

### Badge

**Location**: `src/components/ui/badge.tsx`

**Purpose**: Small status indicators, labels, tags

**Variants**:
```tsx
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
```

**Custom Badge** (GitHub Labels):
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

---

## 📐 Layout Components

### Sidebar Navigation

**Location**: `src/App.tsx` (lines 67-179)

**Structure**:
```tsx
<div className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-8 space-y-8">
  {/* Logo */}
  <div className="text-3xl font-extralight text-gray-900">M</div>

  {/* Navigation */}
  <nav className="flex-1 flex flex-col space-y-6">
    <button
      onClick={() => setActivePanel("dashboard")}
      className={`p-4 rounded-xl transition-all duration-200 ${
        activePanel === "dashboard"
          ? "bg-gray-900 text-white"
          : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
      }`}
      title="エージェント実行"
    >
      <Bot size={24} strokeWidth={1.5} />
    </button>
    {/* More buttons... */}
  </nav>

  {/* Settings */}
  <button className="p-4 rounded-xl">
    <Settings size={24} strokeWidth={1.5} />
  </button>
</div>
```

**Panel Icons**:
| Panel | Icon | Title |
|-------|------|-------|
| Dashboard | `Bot` | エージェント実行 |
| Deployment | `Rocket` | Deployment Control |
| Terminal | `Terminal` | ターミナル |
| Workflow | `Network` | ワークフローDAG |
| Narration | `Volume2` | VOICEVOX音声 |
| Issues | `ListTodo` | GitHub Issues |
| Auto-Merge | `ShieldCheck` | Auto-Merge Settings |
| Tmux | `Layers` | Tmux Agent Manager |
| Settings | `Settings` | Settings |

---

### Status Bar

**Location**: `src/App.tsx` (lines 197-210)

**Structure**:
```tsx
<div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center px-6 text-xs font-light text-gray-500">
  <span>Agents: Idle</span>
  <span className="mx-3">·</span>
  <span>CPU: 12%</span>
  <span className="mx-3">·</span>
  <span>Memory: 2.3 GB</span>
  <span className="mx-3">·</span>
  <button onClick={() => setCommandPaletteOpen(true)}>
    ⌘K でコマンドパレット
  </button>
</div>
```

**Metrics**:
- Agent status (Idle/Running/N agents active)
- CPU usage %
- Memory usage
- Command palette hint

---

### Panel Header

**Standard Pattern**:
```tsx
<div className="p-6 border-b border-gray-200">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-2xl font-light text-gray-900 mb-1">
        Panel Title
      </h2>
      <p className="text-sm font-light text-gray-500">
        Panel description or stats
      </p>
    </div>
    <div className="flex items-center space-x-3">
      <button className="p-2 text-gray-400 hover:text-gray-900">
        <RefreshCw size={18} />
      </button>
    </div>
  </div>
</div>
```

**With Search**:
```tsx
<div className="relative">
  <Search
    size={18}
    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
  />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200
               rounded-xl focus:outline-none focus:border-gray-900
               text-sm font-light transition-all duration-200"
  />
</div>
```

---

## 🎯 Feature Components

### AgentExecutionPanel

**Location**: `src/components/AgentExecutionPanel.tsx`

**Layout**:
```
┌─────────────────────────────────────────────┐
│ [Left Sidebar: 320px]  │ [Right Panel]     │
│                         │                    │
│ ┌─────────────────┐    │ ┌────────────────┐│
│ │ Header          │    │ │ Header         ││
│ └─────────────────┘    │ └────────────────┘│
│                         │                    │
│ ┌─────────────────┐    │ ┌────────────────┐│
│ │ Agent List      │    │ │ Terminal       ││
│ │ (Scrollable)    │    │ │ Output         ││
│ │                 │    │ │ (Scrollable)   ││
│ └─────────────────┘    │ └────────────────┘│
│                         │                    │
│ ┌─────────────────┐    │ ┌────────────────┐│
│ │ Controls        │    │ │ History        ││
│ └─────────────────┘    │ └────────────────┘│
└─────────────────────────────────────────────┘
```

**Key Features**:
1. **Agent Selection**:
   - Visual cards with agent color dots
   - Character names (e.g., "さとるん" for CoordinatorAgent)
   - Description text

2. **Issue Selection**:
   - Dropdown with open issues
   - Auto-refresh button
   - Optional (can execute without issue)

3. **Execution Output**:
   - Terminal-style display (`bg-gray-900`, `font-mono`)
   - Real-time streaming
   - Auto-scroll to bottom
   - Empty states with status icons

4. **Execution History**:
   - Chronological list
   - Status badges (Running/Success/Failed)
   - Duration display
   - Clickable to view past executions

**Agent Card Design**:
```tsx
<button className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
  selectedAgent === agent.type
    ? "bg-gray-900 text-white"
    : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
}`}>
  <div className="flex items-center space-x-3 mb-2">
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: agent.color }}
    />
    <span className="font-light">{agent.characterName}</span>
  </div>
  <p className="text-xs font-light opacity-80">
    {agent.description}
  </p>
</button>
```

---

### IssueDashboard

**Location**: `src/components/IssueDashboard.tsx`

**Layout**: Kanban board with horizontal scroll

```
┌────────────────────────────────────────────────────────┐
│ Header (Search, Filters, Refresh)                      │
├────────────────────────────────────────────────────────┤
│ [Backlog] [Ready] [In Progress] [Review] [Done]       │
│                                                         │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐     │
│ │ #123 │  │ #124 │  │ #125 │  │ #126 │  │ #127 │     │
│ │ Task │  │ Task │  │ Task │  │ Task │  │ Task │     │
│ └──────┘  └──────┘  └──────┘  └──────┘  └──────┘     │
│ ┌──────┐  ┌──────┐                                     │
│ │ #128 │  │ #129 │                                     │
│ └──────┘  └──────┘                                     │
└────────────────────────────────────────────────────────┘
```

**Columns** (MIYABI_STATE_LABELS):
1. **state:backlog** - 📋 Backlog
2. **state:ready** - ✅ Ready
3. **state:in-progress** - 🚧 In Progress
4. **state:review** - 👀 In Review
5. **state:done** - ✅ Done

**Issue Card Components**:
```tsx
<div className="p-4 bg-gray-50 border border-gray-200 rounded-xl
                hover:border-gray-900 transition-all duration-200
                cursor-pointer group">
  {/* Issue Number + External Link */}
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs font-light text-gray-500">#{issue.number}</span>
    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
      <ExternalLink size={14} />
    </button>
  </div>

  {/* Title */}
  <h4 className="text-sm font-light text-gray-900 mb-3 line-clamp-2">
    {issue.title}
  </h4>

  {/* Labels */}
  <div className="flex flex-wrap gap-1 mb-3">
    {issue.labels.slice(0, 3).map(label => (
      <LabelChip key={label.name} label={label} />
    ))}
  </div>

  {/* Assignees */}
  {issue.assignees.length > 0 && (
    <div className="flex items-center space-x-1">
      <span className="text-xs font-light text-gray-400">Assigned:</span>
      <span className="text-xs font-light text-gray-700">
        {issue.assignees.join(", ")}
      </span>
    </div>
  )}

  {/* Updated Time */}
  <div className="mt-2 text-xs font-light text-gray-400">
    Updated {formatRelativeTime(issue.updated_at)}
  </div>
</div>
```

**Features**:
- Search by title, body, or number
- Filter by labels
- Refresh issues
- Click card to open in GitHub
- Hover to reveal external link icon

---

### TerminalManager

**Location**: `src/components/TerminalManager.tsx`

**Purpose**: Display and manage terminal sessions using xterm.js

**Features**:
- Multiple terminal tabs
- Real-time command output
- Scrollback buffer
- Copy/paste support
- Link detection (URLs, file paths)

**Implementation**:
```tsx
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

const terminal = new Terminal({
  theme: {
    background: '#111827',  // gray-900
    foreground: '#f3f4f6',  // gray-100
  },
  fontFamily: 'SF Mono, Monaco, monospace',
  fontSize: 14,
  lineHeight: 1.5,
  cursorBlink: true,
});

terminal.loadAddon(new FitAddon());
terminal.loadAddon(new WebLinksAddon());
terminal.open(terminalRef.current);
```

---

### WorkflowDAGViewer

**Location**: `src/components/WorkflowDAGViewer.tsx`

**Purpose**: Visualize agent execution workflow as Directed Acyclic Graph

**Tech Stack**:
- `reactflow` 11.11.4
- Custom node types for agents
- Edge types for dependencies

**Node Types**:
1. **Agent Node**: Agent execution step
2. **Conditional Node**: Decision point
3. **Parallel Node**: Concurrent execution

**Example**:
```tsx
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

**Custom Agent Node**:
```tsx
const AgentNode = ({ data }) => (
  <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-md">
    <div className="flex items-center space-x-2 mb-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: data.color }}
      />
      <span className="font-light text-sm">{data.label}</span>
    </div>
    <div className="text-xs text-gray-500">
      Status: {data.status}
    </div>
  </div>
);
```

---

### NarrationPlayer

**Location**: `src/components/NarrationPlayer.tsx`

**Purpose**: Play VOICEVOX-generated narration from Git commits

**Features**:
- Audio player controls
- Playback speed adjustment
- Volume control
- Playlist management
- Auto-generate from Git history

**Design**:
```tsx
<div className="p-6 bg-gray-50 rounded-xl">
  {/* Current Track Info */}
  <div className="mb-4">
    <h3 className="text-lg font-light text-gray-900 mb-1">
      {currentTrack.title}
    </h3>
    <p className="text-sm text-gray-500">
      {currentTrack.speaker} • {currentTrack.duration}
    </p>
  </div>

  {/* Progress Bar */}
  <div className="mb-4">
    <div className="h-2 bg-gray-200 rounded-full">
      <div
        className="h-2 bg-gray-900 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>

  {/* Controls */}
  <div className="flex items-center justify-center space-x-4">
    <button className="p-2 hover:bg-gray-100 rounded-xl">
      <SkipBack size={24} />
    </button>
    <button className="p-4 bg-gray-900 text-white rounded-full">
      {playing ? <Pause size={24} /> : <Play size={24} />}
    </button>
    <button className="p-2 hover:bg-gray-100 rounded-xl">
      <SkipForward size={24} />
    </button>
  </div>
</div>
```

---

### DeploymentDashboard

**Location**: `src/components/DeploymentDashboard.tsx`

**Purpose**: Monitor and trigger deployments (Firebase, Cloud Run, etc.)

**Sections**:
1. **Deployment Status**: Current deployment state
2. **Environment Selector**: Production, Staging, Dev
3. **Deploy Button**: Trigger new deployment
4. **Deployment History**: Past deployments with logs
5. **Health Checks**: Service uptime, response time

**Status Card**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Production Environment</CardTitle>
    <CardDescription>Last deployed 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Status</span>
        <span className="flex items-center space-x-1 text-green-500">
          <CheckCircle size={16} />
          <span>Healthy</span>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Uptime</span>
        <span className="text-sm font-medium">99.99%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Response Time</span>
        <span className="text-sm font-medium">120ms</span>
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="default">Deploy Now</Button>
  </CardFooter>
</Card>
```

---

### CommandPalette

**Location**: `src/components/CommandPalette.tsx`

**Purpose**: Quick access to all app functions (⌘K)

**Features**:
- Fuzzy search
- Keyboard navigation
- Recent commands
- Command categories
- Keyboard shortcuts display

**Design**:
```tsx
{/* Overlay */}
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-32">
  {/* Palette */}
  <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
    {/* Search Input */}
    <div className="p-4 border-b border-gray-200">
      <input
        type="text"
        placeholder="Type a command or search..."
        className="w-full px-4 py-3 text-lg font-light
                   focus:outline-none bg-transparent"
        autoFocus
      />
    </div>

    {/* Results */}
    <div className="max-h-96 overflow-y-auto p-2">
      {filteredCommands.map((cmd, index) => (
        <button
          key={cmd.id}
          className={`w-full text-left p-3 rounded-xl
                      transition-all duration-200 ${
            index === selectedIndex
              ? 'bg-gray-900 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <cmd.icon size={18} />
              <span className="font-light">{cmd.label}</span>
            </div>
            {cmd.shortcut && (
              <kbd className="px-2 py-1 bg-gray-100 text-gray-700
                             rounded text-xs font-mono">
                {cmd.shortcut}
              </kbd>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
</div>
```

**Command Structure**:
```typescript
interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
  category?: string;
}

const commands: Command[] = [
  {
    id: 'dashboard',
    label: 'Go to Agent Dashboard',
    icon: Bot,
    action: () => navigate('dashboard'),
    shortcut: '⌘1',
    category: 'Navigation',
  },
  {
    id: 'execute-agent',
    label: 'Execute Agent',
    icon: Play,
    action: () => executeSelectedAgent(),
    shortcut: '⌘↵',
    category: 'Actions',
  },
  // ... more commands
];
```

---

### TmuxManager

**Location**: `src/components/TmuxManager.tsx`

**Purpose**: Manage external coding agents running in tmux sessions

**Features**:
- Create/destroy tmux sessions
- View session list
- Attach to session (terminal view)
- Session status monitoring
- Automatic session recovery

**Session Card**:
```tsx
<div className="p-4 bg-white border border-gray-200 rounded-xl">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-green-400 rounded-full" />
      <span className="font-light text-gray-900">{session.name}</span>
    </div>
    <button className="text-gray-400 hover:text-gray-900">
      <MoreVertical size={18} />
    </button>
  </div>

  <div className="text-xs text-gray-500 space-y-1">
    <div>Windows: {session.windows}</div>
    <div>Created: {formatRelativeTime(session.created_at)}</div>
  </div>

  <div className="mt-4 flex space-x-2">
    <Button size="sm" variant="outline">Attach</Button>
    <Button size="sm" variant="destructive">Kill</Button>
  </div>
</div>
```

---

## 📚 Usage Examples

### Example 1: Create a New Feature Panel

```tsx
// src/components/MyNewPanel.tsx
export function MyNewPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-1">
              My New Panel
            </h2>
            <p className="text-sm font-light text-gray-500">
              Panel description
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="p-2 text-gray-400 hover:text-gray-900"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {data.map(item => (
              <Card key={item.id}>
                <CardContent>
                  {item.content}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Add to App.tsx**:
```tsx
// Import
import { MyNewPanel } from './components/MyNewPanel';

// Add button to sidebar
<button
  onClick={() => setActivePanel("my-new-panel")}
  className={/* ... */}
>
  <MyIcon size={24} strokeWidth={1.5} />
</button>

// Add panel renderer
{activePanel === "my-new-panel" && <MyNewPanel />}
```

---

### Example 2: Add a Keyboard Shortcut

```tsx
// In App.tsx useEffect
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Existing shortcuts...

    // Add new shortcut: ⌘R to refresh current panel
    if ((e.metaKey || e.ctrlKey) && e.key === "r") {
      e.preventDefault();
      refreshCurrentPanel();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [activePanel]);
```

---

### Example 3: Create a Custom Status Badge

```tsx
// AgentStatusBadge.tsx
export function AgentStatusBadge({ status }: { status: AgentExecutionStatus }) {
  const variants = {
    idle: {
      color: "text-gray-400",
      icon: Clock,
      label: "Idle",
    },
    running: {
      color: "text-blue-400",
      icon: Clock,
      label: "Running...",
      animate: "animate-pulse",
    },
    success: {
      color: "text-green-400",
      icon: CheckCircle,
      label: "Success",
    },
    failed: {
      color: "text-red-400",
      icon: AlertCircle,
      label: "Failed",
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <span className={`flex items-center space-x-1 text-sm font-light ${variant.color}`}>
      <Icon size={14} className={variant.animate} />
      <span>{variant.label}</span>
    </span>
  );
}
```

---

## 📖 Component API Reference

### Button

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}
```

### Card

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
```

### AgentExecutionPanel

```typescript
interface AgentExecution {
  executionId: string;
  agentType: AgentType;
  status: AgentExecutionStatus;
  exitCode?: number;
  durationMs?: number;
  output: string[];
  startTime: number;
}

type AgentExecutionStatus = "idle" | "starting" | "running" | "success" | "failed";

type AgentType =
  | "coordinator"
  | "codegen"
  | "review"
  | "deployment"
  | "issue"
  | "pr"
  | "refresher";
```

### IssueDashboard

```typescript
interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: "open" | "closed";
  labels: IssueLabel[];
  assignees: string[];
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface IssueLabel {
  name: string;
  color: string;
  description?: string;
}
```

### CommandPalette

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (panel: string) => void;
}

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
  category?: string;
}
```

---

## 🎯 Best Practices

### 1. Component Structure

```tsx
// ✅ Good: Clear, readable structure
export function MyComponent() {
  // 1. State
  const [state, setState] = useState(initialState);

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // 3. Event handlers
  const handleClick = () => {
    // Logic
  };

  // 4. Render
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
}

// ❌ Bad: Mixed concerns, unclear structure
export function MyComponent() {
  const handleClick = () => setState(newState);
  useEffect(() => { /* ... */ }, []);
  const [state, setState] = useState(initialState);
  return <div>{/* ... */}</div>;
}
```

### 2. Styling

```tsx
// ✅ Good: Consistent Tailwind classes
<button className="px-6 py-3 bg-gray-900 text-white rounded-xl
                   font-light hover:bg-gray-800
                   transition-all duration-200">
  Button
</button>

// ❌ Bad: Inline styles, inconsistent spacing
<button style={{ padding: "12px 24px", background: "#111827" }}>
  Button
</button>
```

### 3. State Management

```tsx
// ✅ Good: Local state for UI, context for global
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false); // UI state
  const { user } = useAuth(); // Global state

  return <div>{/* ... */}</div>;
}

// ❌ Bad: Everything in context
const { isOpen, setIsOpen, user, ... } = useGlobalState();
```

### 4. Accessibility

```tsx
// ✅ Good: Proper ARIA labels, keyboard support
<button
  aria-label="Execute agent"
  title="Execute selected agent"
  onClick={handleExecute}
  onKeyDown={(e) => e.key === "Enter" && handleExecute()}
>
  <Play size={18} />
</button>

// ❌ Bad: No accessibility features
<div onClick={handleExecute}>
  <Play size={18} />
</div>
```

---

## 🔗 Related Documentation

- [UI/UX Design System](./UI_UX_DESIGN_SYSTEM.md) - Complete design guidelines
- [Component Testing Guide](./COMPONENT_TESTING.md) - How to test components
- [Storybook Documentation](./STORYBOOK.md) - Interactive component catalog

---

**Maintained by**: Miyabi Team
**Version**: 1.0.0
**Last Updated**: 2025-11-02
