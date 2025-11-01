# Dashboard Snapshot Implementation

**Issue**: #678
**Feature**: Dashboard snapshot service and UI
**Status**: ✅ Complete (Mock Data Implementation)
**Date**: 2025-11-02

---

## 📋 Overview

This document describes the implementation of Issue #678: Dashboard snapshot service and UI for Miyabi Desktop. The feature provides a centralized dashboard view showing real-time system state including worktrees, agents, issues, history, and system resources.

---

## ✅ Implemented Components

### 1. Type Definitions

**File**: `src/types/dashboard.ts`

Complete TypeScript interface definitions for the dashboard snapshot feature:

- `DashboardSnapshot` - Complete snapshot structure
- `WorktreeInfo` - Worktree statistics
- `AgentStats` - Agent execution metrics
- `AgentExecution` - Individual agent execution record
- `IssueStats` - Issue/task metrics
- `IssueInfo` - Individual issue information
- `HistoryInfo` - Activity timeline data
- `ActivityRecord` - Individual activity entry
- `SystemInfo` - System resource metrics
- `DashboardError` - Error handling types

### 2. Backend Service

**File**: `src-tauri/src/dashboard.rs`

Rust backend service for aggregating dashboard data:

```rust
pub struct DashboardService {
    cache: Arc<RwLock<Option<DashboardSnapshot>>>,
}
```

**Features**:
- 10-second response caching to reduce overhead
- Async data aggregation from multiple sources
- Mock data implementation (ready for real data integration)
- Structured error handling

**Methods**:
- `get_snapshot()` - Get cached or fresh snapshot
- `generate_snapshot()` - Generate new snapshot
- `get_worktree_info()` - Worktree statistics
- `get_agent_stats()` - Agent execution metrics
- `get_issue_stats()` - GitHub issue metrics
- `get_history_info()` - Git history analysis
- `get_system_info()` - System resource metrics

### 3. IPC Integration

**File**: `src-tauri/src/lib.rs`

Added Tauri IPC command for dashboard data:

```rust
#[tauri::command]
async fn get_dashboard_snapshot_command(
    state: State<'_, AppState>,
) -> Result<DashboardSnapshot, String>
```

**Changes**:
- Added `mod dashboard;` import
- Added `DashboardService` to `AppState`
- Registered `get_dashboard_snapshot_command` in invoke handler
- Added `chrono` dependency to `Cargo.toml`

### 4. React Hook

**File**: `src/hooks/useDashboard.ts`

Custom React hook for fetching and polling dashboard data:

```typescript
export function useDashboard(pollingInterval: number = 10000): UseDashboardResult
```

**Features**:
- 10-second automatic polling
- Loading and error states
- Manual refresh function
- Proper cleanup on unmount

**Returns**:
- `snapshot` - Dashboard snapshot data
- `loading` - Loading state
- `error` - Error state
- `refresh` - Manual refresh function

### 5. Dashboard UI Components

**File**: `src/components/DashboardOverview.tsx`

Comprehensive dashboard UI with multiple card components:

**Components**:
- `DashboardCard` - Reusable card wrapper with hover effects
- `WorktreeCard` - Display worktree statistics and recent names
- `AgentStatsCard` - Show agent execution metrics and recent runs
- `IssueStatsCard` - Display issue/task statistics
- `HistoryCard` - Show activity timeline
- `SystemCard` - Display system resource usage
- `DashboardOverview` - Main dashboard panel with grid layout

**Features**:
- Ultra-minimal design matching existing UI
- Responsive grid layout (1/2/3 columns)
- Loading skeleton with RefreshCw animation
- Error handling with retry button
- Manual refresh button
- Last updated timestamp
- Hover effects on clickable cards
- Accessibility (ARIA labels, keyboard navigation)

### 6. App Integration

**File**: `src/App.tsx`

Integrated DashboardOverview into main application:

**Changes**:
- Added lazy-loaded `DashboardOverview` import
- Updated `DashboardPanel` to render `DashboardOverview`
- Updated ARIA label: "ダッシュボード - システム概要とステータス"
- Updated button title: "ダッシュボード"

---

## 🎨 UI/UX Design

### Design Philosophy

Following the existing **Ultra Minimalism** design system:

- **Typography**: Font-weight 300 (light), minimal use of bold
- **Colors**: Light gray palette, semantic colors for status
- **Spacing**: Generous whitespace, breathable layout
- **Transitions**: 200ms duration-default for all animations
- **Borders**: Subtle gray-200 borders, rounded-xl corners

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                    Last updated: HH:MM:SS  [↻]│
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│ │Worktrees │ │ Agents   │ │ Issues   │                │
│ │Total: 3  │ │Running: 1│ │Open: 20  │                │
│ │Active: 2 │ │Done: 18  │ │Today: 3  │                │
│ └──────────┘ └──────────┘ └──────────┘                │
│ ┌──────────┐ ┌──────────┐                             │
│ │ History  │ │ System   │                             │
│ │Commits: 8│ │CPU: 12%  │                             │
│ │PRs: 3    │ │MEM: 2 GB │                             │
│ └──────────┘ └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### Color Semantics

- **Gray-900**: Primary text
- **Gray-600**: Secondary text
- **Gray-400**: Tertiary text
- **Gray-100**: Hover backgrounds
- **Blue-600**: In-progress status
- **Green-600**: Success/completed status
- **Orange-600**: Warning/stale status
- **Red-600**: Error/failed status

---

## 📊 Mock Data

### Current Implementation

All data sources return mock data for demonstration:

**Worktrees**:
```rust
WorktreeInfo {
    total: 3,
    active: 2,
    stale: 1,
    names: vec![
        "phase1-accessibility-perf",
        "phase2-visual-consistency",
        "feat-678-dashboard-snapshot",
    ],
}
```

**Agents**:
```rust
AgentStats {
    total: 21,
    running: 1,
    completed: 18,
    failed: 2,
    recent: vec![/* CodeGenAgent running, ReviewAgent completed */],
}
```

**Issues**:
```rust
IssueStats {
    open: 20,
    in_progress: 5,
    completed_today: 3,
    recent: vec![/* Issue #678 */],
}
```

**History**:
```rust
HistoryInfo {
    commits_today: 8,
    prs_today: 3,
    issues_closed_today: 2,
    recent_activities: vec![/* Recent commits, PRs */],
}
```

**System**:
```rust
SystemInfo {
    cpu_usage: 12.5,
    memory_usage_mb: 2304.0,
    total_memory_mb: 16384.0,
    disk_usage: 45.2,
    uptime_seconds: 86400,
}
```

---

## 🔄 Data Flow

```
┌──────────────┐
│ React UI     │
│ (Dashboard   │
│  Overview)   │
└───────┬──────┘
        │ useDashboard()
        │ 10-second polling
        ↓
┌──────────────┐
│ Tauri IPC    │
│ invoke(      │
│  'get_...')  │
└───────┬──────┘
        │
        ↓
┌──────────────┐
│ DashboardSer │
│ vice         │
│ (Rust)       │
└───────┬──────┘
        │
        ├── get_worktree_info()
        ├── get_agent_stats()
        ├── get_issue_stats()
        ├── get_history_info()
        └── get_system_info()
```

---

## 🚀 Next Steps (Real Data Integration)

### Phase 1: Worktree Integration

**File to modify**: `src-tauri/src/dashboard.rs`

Replace `get_worktree_info()` mock data:

```rust
async fn get_worktree_info(&self) -> Result<WorktreeInfo, String> {
    // Use miyabi-worktree crate to detect actual worktrees
    // Example:
    // let worktrees = miyabi_worktree::list_worktrees()?;
    // let active = worktrees.iter().filter(|w| w.is_active()).count();
    // ...
}
```

**Dependencies needed**:
- `miyabi-worktree` crate (likely already exists)
- Git repository path configuration

### Phase 2: Agent Stats Integration

**File to modify**: `src-tauri/src/dashboard.rs`

Replace `get_agent_stats()` mock data:

```rust
async fn get_agent_stats(&self) -> Result<AgentStats, String> {
    // Read from .ai/logs/ directory
    // Parse agent execution logs
    // Count running/completed/failed agents
    // Extract recent executions
}
```

**Implementation approach**:
- Parse `.ai/logs/*.json` files
- Track agent state (running/completed/failed)
- Store recent execution history

### Phase 3: GitHub API Integration

**File to modify**: `src-tauri/src/dashboard.rs`

Replace `get_issue_stats()` mock data:

```rust
async fn get_issue_stats(&self) -> Result<IssueStats, String> {
    // Use existing GitHub API client
    // Fetch issues with filters
    // Count by state and labels
    // Get recently updated issues
}
```

**Dependencies**:
- Use existing `miyabi-github` crate
- GitHub API token from environment
- Filter by label (e.g., `status:InProgress`)

### Phase 4: Git History Integration

**File to modify**: `src-tauri/src/dashboard.rs`

Replace `get_history_info()` mock data:

```rust
async fn get_history_info(&self) -> Result<HistoryInfo, String> {
    // Run git log commands
    // Parse commit history (today's commits)
    // Check for PRs created today
    // Track recent activities
}
```

**Implementation approach**:
- Use `git log --since="midnight"` for today's commits
- Use GitHub API for PR creation times
- Combine git and GitHub data

### Phase 5: System Monitoring

**File to modify**: `src-tauri/src/dashboard.rs`

Replace `get_system_info()` mock data:

```rust
async fn get_system_info(&self) -> Result<SystemInfo, String> {
    // Use system monitoring crates
    // Example: sysinfo crate
    // Get CPU, memory, disk usage
    // Get system uptime
}
```

**Dependencies needed**:
```toml
[dependencies]
sysinfo = "0.30"
```

**Implementation**:
```rust
use sysinfo::{System, SystemExt, CpuExt, DiskExt};

let mut sys = System::new_all();
sys.refresh_all();

let cpu_usage = sys.global_cpu_info().cpu_usage();
let memory_usage = sys.used_memory() as f64 / (1024.0 * 1024.0);
let total_memory = sys.total_memory() as f64 / (1024.0 * 1024.0);
// ...
```

---

## 🧪 Testing Strategy

### Unit Tests

**Backend tests** (`src-tauri/src/dashboard.rs`):

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_dashboard_service_cache() {
        let service = DashboardService::new();
        let snapshot1 = service.get_snapshot().await.unwrap();
        let snapshot2 = service.get_snapshot().await.unwrap();

        // Should return cached snapshot (< 10 seconds)
        assert_eq!(snapshot1.timestamp, snapshot2.timestamp);
    }

    #[tokio::test]
    async fn test_worktree_info() {
        let service = DashboardService::new();
        let info = service.get_worktree_info().await.unwrap();

        assert!(info.total >= info.active);
        assert!(info.total >= info.stale);
    }

    // Add tests for each data source...
}
```

**Frontend tests** (`src/hooks/useDashboard.test.ts`):

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from './useDashboard';

describe('useDashboard', () => {
  it('should fetch dashboard snapshot on mount', async () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.snapshot).toBeTruthy();
    });
  });

  it('should poll every 10 seconds', async () => {
    // Mock invoke to track call count
    // Assert polling behavior
  });

  // Add more tests...
});
```

### Integration Tests

**Full stack test** (`tests/dashboard_integration.test.tsx`):

```typescript
import { test, expect } from '@playwright/test';

test('dashboard displays system metrics', async ({ page }) => {
  await page.goto('/');

  // Click dashboard button
  await page.click('[aria-label*="ダッシュボード"]');

  // Wait for dashboard to load
  await expect(page.locator('text=Worktrees')).toBeVisible();
  await expect(page.locator('text=Agents')).toBeVisible();
  await expect(page.locator('text=Issues')).toBeVisible();

  // Verify data is displayed
  await expect(page.locator('text=/Total:/')).toBeVisible();
});
```

---

## 📝 Known Limitations

1. **Mock Data**: All data sources currently return hardcoded mock data
2. **No Real-time Updates**: Polling interval is fixed at 10 seconds
3. **No Click Navigation**: Card click handlers not yet implemented
4. **No Data Persistence**: Cache is memory-only, resets on restart
5. **Limited Error Recovery**: No exponential backoff on failures

---

## 🎯 Acceptance Criteria

### ✅ Completed

- [x] Backend: `DashboardService` with caching
- [x] Backend: Tauri IPC command `get_dashboard_snapshot_command`
- [x] Frontend: TypeScript types for all data structures
- [x] Frontend: `useDashboard` hook with polling
- [x] Frontend: `DashboardOverview` component with cards
- [x] Frontend: Integration with `App.tsx`
- [x] UI: Ultra-minimal design matching existing style
- [x] UI: Responsive grid layout
- [x] UI: Loading and error states
- [x] UI: Manual refresh functionality
- [x] Accessibility: ARIA labels and keyboard navigation

### ⏳ Pending (Real Data Integration)

- [ ] Replace mock worktree data with actual Git worktree detection
- [ ] Replace mock agent data with log file parsing
- [ ] Replace mock issue data with GitHub API calls
- [ ] Replace mock history data with Git log analysis
- [ ] Replace mock system data with actual resource monitoring
- [ ] Implement card click navigation to detail views
- [ ] Add unit tests for all components
- [ ] Add integration tests for full stack

---

## 📦 Files Modified/Created

### Created Files

1. `src/types/dashboard.ts` - TypeScript type definitions (159 lines)
2. `src-tauri/src/dashboard.rs` - Rust backend service (281 lines)
3. `src/hooks/useDashboard.ts` - React hook (106 lines)
4. `src/components/DashboardOverview.tsx` - UI components (385 lines)
5. `DASHBOARD_IMPLEMENTATION.md` - This documentation

### Modified Files

1. `src-tauri/src/lib.rs` - Added dashboard module and IPC handler
2. `src-tauri/Cargo.toml` - Added `chrono` dependency
3. `src/App.tsx` - Integrated DashboardOverview, updated ARIA labels

---

## 🔗 Related Documentation

- [Issue #678](https://github.com/customer-cloud/miyabi-private/issues/678)
- [UI/UX Design System](./UI_UX_DESIGN_SYSTEM.md)
- [Component Catalog](./COMPONENT_CATALOG.md)
- [Miyabi CLAUDE.md](../CLAUDE.md)

---

## 📅 Timeline

- **2025-11-02**: Initial implementation with mock data (Phase 1)
- **TBD**: Real data integration (Phase 2-5)
- **TBD**: Testing and refinement
- **TBD**: Production deployment

---

**Status**: ✅ Ready for review and testing with mock data
**Next Action**: Test the UI, then proceed with real data integration

---

_Generated: 2025-11-02_
_Author: Claude Code_
_Issue: #678_
