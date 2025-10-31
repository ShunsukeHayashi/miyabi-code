# Worktree View

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Priority**: 🔴 MVP Critical
**Feature ID**: F-2
**Implementation**: Sprint 3

---

## Overview

The Worktree View visualizes all active Git worktrees created by Miyabi agents. It provides:
- Real-time worktree status (active, paused, error, idle)
- Progress tracking for agent tasks
- Quick actions (open in editor, show logs, open terminal, delete)
- Search and filtering capabilities

---

## Layout Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  🌳 Worktrees (4 active)           [+ Create] [🔍 Search] [Filter ▼]  │ ← Header
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🟢 worktree-issue-270-codegen                          [⋮]       │ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ 📊 65%  ████████░░░░░░  Building...                              │ │
│  │                                                                  │ │
│  │ • Branch: issue/270                                              │ │
│  │ • Agent: CodeGenAgent                                            │ │
│  │ • Files changed: 12 (+450 lines, -23 lines)                      │ │
│  │ • Duration: 8m 34s                                               │ │
│  │                                                                  │ │
│  │ [Open in Editor] [Show Logs] [Open Terminal] [Pause]            │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🟡 worktree-issue-271-review                           [⋮]       │ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ ⏸️  Waiting for approval                                          │ │
│  │                                                                  │ │
│  │ • Branch: issue/271                                              │ │
│  │ • Agent: ReviewAgent                                             │ │
│  │ • Files changed: 3 (+89 lines, -12 lines)                        │ │
│  │ • Paused: 12 minutes ago                                         │ │
│  │                                                                  │ │
│  │ [View PR] [Approve] [Request Changes] [Resume]                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 worktree-issue-272-deploy                           [⋮]       │ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ ❌ Error: Firebase deploy timeout                                │ │
│  │                                                                  │ │
│  │ • Branch: issue/272                                              │ │
│  │ • Agent: DeploymentAgent                                         │ │
│  │ • Error at: 12:45:32 (2 minutes ago)                             │ │
│  │ • Error: Command timed out after 300s                            │ │
│  │                                                                  │ │
│  │ [View Logs] [Retry] [Debug] [Delete]                             │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ⚪ worktree-issue-269-archived                         [⋮]       │ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ ✅ Completed 2 hours ago (Duration: 12m 23s)                     │ │
│  │                                                                  │ │
│  │ • Branch: issue/269 (merged to main)                             │ │
│  │ • Agent: RefresherAgent                                          │ │
│  │ • Files changed: 5 (+234 lines, -45 lines)                       │ │
│  │ • PR: #269 (merged by @alex)                                     │ │
│  │                                                                  │ │
│  │ [View Diff] [View PR] [Delete Worktree]                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Header

**Elements**:
- **Title**: "🌳 Worktrees (X active)" - shows count of active worktrees
- **Create Button**: `[+ Create]` - manually create worktree (advanced feature)
- **Search Input**: `[🔍 Search]` - search by branch name, issue number, agent type
- **Filter Dropdown**: `[Filter ▼]` - filter by status (All, Active, Paused, Error, Idle)

**Styling**:
```css
.worktree-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
```

---

### 2. Worktree Card

**Status Colors**:
- 🟢 **Active** (Green): `#3fb950` - Agent running, making progress
- 🟡 **Paused** (Yellow): `#d29922` - Agent paused, awaiting action
- 🔴 **Error** (Red): `#f85149` - Agent failed, error occurred
- ⚪ **Idle** (Gray): `#8b949e` - Agent completed, archived

**Card Structure**:

```typescript
interface WorktreeCardProps {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error' | 'idle';
  branch: string;
  agentType: string;
  progress?: number; // 0-100, only for active
  message: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  duration?: string; // e.g., "8m 34s"
  error?: string; // Error message if status === 'error'
  prNumber?: number; // PR number if merged
  actions: Action[];
}
```

---

### 3. Progress Bar (Active Only)

**Visual**:
```
📊 65%  ████████░░░░░░  Building...
```

**Segments**:
- Filled: Blue (`--primary`)
- Empty: Gray (`--border`)
- Percentage: 14px font, semibold
- Message: 12px font, muted color

**Styling**:
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}
```

**Animation**: Smooth transition when progress updates (CSS transition)

---

### 4. Metadata

**Fields**:
- **Branch**: Git branch name (e.g., `issue/270`)
- **Agent**: Agent type (e.g., `CodeGenAgent`)
- **Files changed**: Count + diff stats (`+450 -23`)
- **Duration**: Time elapsed (active) or total time (completed)
- **Error**: Error message (if status === 'error')
- **PR**: Pull request number (if merged)

**Styling**:
```css
.worktree-metadata {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--foreground-muted);
}

.worktree-metadata-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

### 5. Actions (Buttons)

**Action Buttons** (vary by status):

| Status | Actions |
|--------|---------|
| **Active** | Open in Editor, Show Logs, Open Terminal, Pause |
| **Paused** | View PR, Approve, Request Changes, Resume |
| **Error** | View Logs, Retry, Debug, Delete |
| **Idle** | View Diff, View PR, Delete Worktree |

**Styling**:
```css
.worktree-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.worktree-action-btn {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
}

.worktree-action-btn:hover {
  background: var(--surface-hover);
  border-color: var(--primary);
}
```

---

### 6. Context Menu (⋮)

**Click "⋮"** → Show dropdown menu:

```
┌──────────────────────┐
│ Open in Finder       │
│ Copy Worktree Path   │
│ Copy Branch Name     │
│ ──────────────────── │
│ Refresh Status       │
│ ──────────────────── │
│ Delete Worktree      │ ← Red text
└──────────────────────┘
```

**Interactions**:
- **Open in Finder**: Reveal worktree directory in macOS Finder
- **Copy Worktree Path**: Copy absolute path to clipboard
- **Copy Branch Name**: Copy Git branch name
- **Refresh Status**: Force refresh worktree metadata
- **Delete Worktree**: Delete worktree (confirm dialog)

---

## Interactions

### Mouse Actions

| Action | Result |
|--------|--------|
| **Click card** | Expand/collapse details (if long metadata) |
| **Click action button** | Execute action (IPC to main process) |
| **Click "⋮"** | Show context menu |
| **Hover card** | Slightly elevate (box-shadow) |
| **Right-click card** | Show context menu |

---

### Keyboard Actions

| Key | Action |
|-----|--------|
| **Cmd+F** | Focus search input |
| **Enter** (in search) | Apply search filter |
| **Escape** (in search) | Clear search, close filter |
| **Up/Down arrows** | Navigate worktree cards |
| **Space** | Expand/collapse focused card |
| **Cmd+R** | Refresh worktree list |

---

### Search & Filter

**Search** (🔍):
- Search by: Branch name, Issue number, Agent type
- Real-time filtering (debounced 300ms)
- Case-insensitive
- Highlight matching text in results

**Filter** (Filter ▼):
```
┌──────────────────┐
│ ✓ All            │ ← Default
│   Active         │
│   Paused         │
│   Error          │
│   Idle           │
└──────────────────┘
```

---

## States

### Loading State

**Skeleton Loader** (while fetching worktrees):
```
┌────────────────────────────────┐
│ 🟢 ████████████████            │ ← Skeleton card
│ ──────────────────────────────│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Animated shimmer
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────────────────────────┘
```

---

### Empty State (No Worktrees)

```
┌─────────────────────────────────┐
│                                 │
│         🌳                      │
│                                 │
│    No Worktrees Yet             │
│                                 │
│    Start an agent to create a   │
│    worktree and begin parallel  │
│    development                  │
│                                 │
│    [Run Agent on Issue]         │
│                                 │
└─────────────────────────────────┘
```

---

### Error State (Failed to Load)

```
┌─────────────────────────────────┐
│         ❌                       │
│                                 │
│    Failed to Load Worktrees     │
│                                 │
│    Unable to read worktree      │
│    metadata from .ai/worktrees/ │
│                                 │
│    [Retry] [View Logs]          │
└─────────────────────────────────┘
```

---

## Data Flow

### Fetch Worktrees

```typescript
// src/renderer/hooks/useWorktrees.ts
import { useQuery } from '@tanstack/react-query';

export function useWorktrees() {
  return useQuery({
    queryKey: ['worktrees'],
    queryFn: async () => {
      return await window.electron.invoke('get-worktrees');
    },
    refetchInterval: 2000, // Poll every 2s for real-time updates
  });
}
```

### IPC Handler (Main Process)

```typescript
// src/main/ipc-handlers.ts
ipcMain.handle('get-worktrees', async () => {
  const worktreesDir = path.join(projectPath, '.ai', 'worktrees');
  const files = await fs.readdir(worktreesDir);

  const worktrees = await Promise.all(
    files.map(async (file) => {
      const data = await fs.readFile(path.join(worktreesDir, file), 'utf-8');
      return JSON.parse(data);
    })
  );

  return worktrees;
});
```

---

## Accessibility

### ARIA Labels

```html
<section aria-label="Worktree list" role="region">
  <div role="list">
    <article
      role="listitem"
      aria-label="Worktree issue-270, status active, 65% complete"
    >
      <!-- Card content -->
    </article>
  </div>
</section>
```

### Keyboard Navigation

- **Tab**: Navigate between cards
- **Enter**: Activate focused action button
- **Arrow keys**: Navigate within card actions
- **Escape**: Close context menu

---

## Implementation Notes

### React Component

```typescript
// src/renderer/components/worktree/WorktreeView.tsx
export function WorktreeView() {
  const { data: worktrees, isLoading } = useWorktrees();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WorktreeStatus | 'all'>('all');

  const filteredWorktrees = useMemo(() => {
    return worktrees?.filter((wt) => {
      if (filter !== 'all' && wt.status !== filter) return false;
      if (search && !wt.name.includes(search)) return false;
      return true;
    });
  }, [worktrees, search, filter]);

  if (isLoading) return <WorktreeSkeleton />;
  if (!worktrees?.length) return <WorktreeEmptyState />;

  return (
    <div className="worktree-view">
      <WorktreeHeader
        count={worktrees.length}
        onSearch={setSearch}
        onFilter={setFilter}
      />
      <div className="worktree-list">
        {filteredWorktrees?.map((wt) => (
          <WorktreeCard key={wt.id} worktree={wt} />
        ))}
      </div>
    </div>
  );
}
```

---

## Changelog

**v1.0.0** (2025-10-31):
- Initial worktree view design
- Defined card structure, states, interactions
- Added search, filter, context menu
- Specified data flow and IPC handlers
