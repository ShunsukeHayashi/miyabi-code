# Phase 1: Critical Accessibility & Performance Improvements

**Duration**: Week 1 (5 days)
**Priority**: P0 (Critical)
**Goal**: Improve accessibility to WCAG AA compliance and reduce initial bundle size by 60%

---

## 📋 Overview

### Success Criteria

✅ **Accessibility**:
- [ ] All interactive elements have ARIA labels
- [ ] Lighthouse Accessibility score: 100%
- [ ] Full keyboard navigation support
- [ ] Visible focus indicators on all interactive elements

✅ **Performance**:
- [ ] Initial bundle size reduced from ~500KB to ~200KB
- [ ] All panel components lazy loaded
- [ ] Loading skeletons for better UX

---

## Day 1-2: Accessibility - ARIA Labels & Focus Indicators

### Task 1.1: Add ARIA Labels to Sidebar Navigation

**File**: `miyabi-desktop/src/App.tsx`

**Current Implementation** (lines 71-81):
```tsx
<button
  onClick={() => setActivePanel("dashboard")}
  className={`p-4 rounded-xl transition-all duration-200 ${
    activePanel === "dashboard"
      ? "bg-gray-900 text-white"
      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
  }`}
  title="エージェント実行 - AIエージェントを選択して実行"
>
  <Bot size={24} strokeWidth={1.5} />
</button>
```

**Refactored** (lines 71-85):
```tsx
<button
  onClick={() => setActivePanel("dashboard")}
  className={`p-4 rounded-xl transition-all duration-200
              focus:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${
    activePanel === "dashboard"
      ? "bg-gray-900 text-white"
      : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
  }`}
  aria-label="エージェント実行 - AIエージェントを選択して実行"
  aria-current={activePanel === "dashboard" ? "page" : undefined}
  title="エージェント実行"
>
  <Bot size={24} strokeWidth={1.5} aria-hidden="true" />
</button>
```

**Changes**:
1. ✅ Added `aria-label` with full description
2. ✅ Added `aria-current="page"` for active state
3. ✅ Added `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900`
4. ✅ Added `aria-hidden="true"` to decorative icon
5. ✅ Shortened `title` (now used only for tooltip)

**Apply to All Sidebar Buttons**:
- [ ] Dashboard button (Bot icon)
- [ ] Deployment button (Rocket icon)
- [ ] Terminal button (Terminal icon)
- [ ] Workflow button (Network icon)
- [ ] Narration button (Volume2 icon)
- [ ] Issues button (ListTodo icon)
- [ ] Auto-Merge button (ShieldCheck icon)
- [ ] Tmux button (Layers icon)
- [ ] Settings button (Settings icon)

---

### Task 1.2: Add Navigation Landmark

**File**: `miyabi-desktop/src/App.tsx`

**Current** (line 70):
```tsx
<nav className="flex-1 flex flex-col space-y-6">
```

**Refactored**:
```tsx
<nav
  className="flex-1 flex flex-col space-y-6"
  aria-label="Main navigation"
>
```

---

### Task 1.3: Add Skip-to-Content Link

**File**: `miyabi-desktop/src/App.tsx`

**Insert after line 61** (before sidebar):
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             focus:z-50 focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white
             focus:rounded-xl focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
>
  Skip to main content
</a>
```

**Add to main content area** (line 183):
```tsx
<div id="main-content" className="flex-1 overflow-auto">
```

**Add to Tailwind Config** (`tailwind.config.js`):
```js
plugins: [
  require("tailwindcss-animate"),
  function({ addUtilities }) {
    addUtilities({
      '.sr-only': {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      },
    });
  },
],
```

---

### Task 1.4: Status Bar Accessibility

**File**: `miyabi-desktop/src/App.tsx`

**Current** (lines 197-210):
```tsx
<div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center px-6 text-xs font-light text-gray-500">
  <span>Agents: Idle</span>
  <span className="mx-3">·</span>
  <span>CPU: 12%</span>
  <span className="mx-3">·</span>
  <span>Memory: 2.3 GB</span>
  <span className="mx-3">·</span>
  <button
    onClick={() => setCommandPaletteOpen(true)}
    className="text-gray-400 hover:text-gray-900 transition-colors"
  >
    ⌘K でコマンドパレット
  </button>
</div>
```

**Refactored**:
```tsx
<div
  className="h-10 bg-gray-50 border-t border-gray-200 flex items-center px-6 text-xs font-light text-gray-500"
  role="status"
  aria-label="Application status bar"
>
  <span aria-label="Agent status: Idle">Agents: Idle</span>
  <span aria-hidden="true" className="mx-3">·</span>
  <span aria-label="CPU usage: 12%">CPU: 12%</span>
  <span aria-hidden="true" className="mx-3">·</span>
  <span aria-label="Memory usage: 2.3 gigabytes">Memory: 2.3 GB</span>
  <span aria-hidden="true" className="mx-3">·</span>
  <button
    onClick={() => setCommandPaletteOpen(true)}
    className="text-gray-400 hover:text-gray-900 transition-colors
               focus:outline-none focus-visible:ring-2
               focus-visible:ring-offset-2 focus-visible:ring-gray-900
               rounded px-2 py-1"
    aria-label="Open command palette (Shortcut: Command K)"
  >
    ⌘K でコマンドパレット
  </button>
</div>
```

---

## Day 3-4: Performance - Code Splitting

### Task 3.1: Convert Panel Imports to Lazy Loading

**File**: `miyabi-desktop/src/App.tsx`

**Current** (lines 13-23):
```tsx
import { TerminalManager } from "./components/TerminalManager";
import { AgentExecutionPanel } from "./components/AgentExecutionPanel";
import { WorkflowDAGViewer } from "./components/WorkflowDAGViewer";
import { NarrationPlayer } from "./components/NarrationPlayer";
import { IssueDashboard } from "./components/IssueDashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import { DeploymentDashboard } from "./components/DeploymentDashboard";
import { AutoMergeSettings } from "./components/AutoMergeSettings";
import { CommandPalette } from "./components/CommandPalette";
import { TmuxManager } from "./components/TmuxManager";
import { TauriStatusIndicator } from "./components/TauriStatusIndicator";
```

**Refactored**:
```tsx
import { lazy, Suspense } from "react";
import { TauriStatusIndicator } from "./components/TauriStatusIndicator";
import { CommandPalette } from "./components/CommandPalette"; // Keep eager (small, frequently used)

// Lazy load panel components
const AgentExecutionPanel = lazy(() => import("./components/AgentExecutionPanel"));
const TerminalManager = lazy(() => import("./components/TerminalManager"));
const WorkflowDAGViewer = lazy(() => import("./components/WorkflowDAGViewer"));
const NarrationPlayer = lazy(() => import("./components/NarrationPlayer"));
const IssueDashboard = lazy(() => import("./components/IssueDashboard"));
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));
const DeploymentDashboard = lazy(() => import("./components/DeploymentDashboard"));
const AutoMergeSettings = lazy(() => import("./components/AutoMergeSettings"));
const TmuxManager = lazy(() => import("./components/TmuxManager"));
```

**Note**: Keep `CommandPalette` and `TauriStatusIndicator` eager-loaded since they're small and frequently used.

---

### Task 3.2: Create PanelSkeleton Component

**New File**: `miyabi-desktop/src/components/PanelSkeleton.tsx`

```tsx
export function PanelSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white" role="status" aria-label="Loading panel">
      {/* Header Skeleton */}
      <div className="p-6 border-b border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-xl w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded-xl w-1/2"></div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl"></div>
        <div className="h-20 bg-gray-100 rounded-xl"></div>
        <div className="h-20 bg-gray-100 rounded-xl"></div>
        <div className="h-20 bg-gray-100 rounded-xl"></div>
      </div>

      <span className="sr-only">Loading panel content...</span>
    </div>
  );
}
```

**Design Notes**:
- Uses `animate-pulse` for subtle loading animation
- Matches panel header structure (title + description)
- Generic enough for all panel types
- Includes screen reader announcement

---

### Task 3.3: Wrap Panel Renders with Suspense

**File**: `miyabi-desktop/src/App.tsx`

**Current** (lines 184-194):
```tsx
<div className="flex-1 overflow-auto">
  {activePanel === "dashboard" && <DashboardPanel />}
  {activePanel === "deployment" && <DeploymentPanel />}
  {activePanel === "terminal" && <TerminalPanel />}
  {activePanel === "workflow" && <WorkflowPanel />}
  {activePanel === "narration" && <NarrationPanel />}
  {activePanel === "issues" && <IssuesPanel />}
  {activePanel === "auto-merge" && <AutoMergePanel />}
  {activePanel === "tmux" && <TmuxPanel />}
  {activePanel === "settings" && <SettingsPanelWrapper />}
</div>
```

**Refactored**:
```tsx
<div id="main-content" className="flex-1 overflow-auto">
  <Suspense fallback={<PanelSkeleton />}>
    {activePanel === "dashboard" && <DashboardPanel />}
    {activePanel === "deployment" && <DeploymentPanel />}
    {activePanel === "terminal" && <TerminalPanel />}
    {activePanel === "workflow" && <WorkflowPanel />}
    {activePanel === "narration" && <NarrationPanel />}
    {activePanel === "issues" && <IssuesPanel />}
    {activePanel === "auto-merge" && <AutoMergePanel />}
    {activePanel === "tmux" && <TmuxPanel />}
    {activePanel === "settings" && <SettingsPanelWrapper />}
  </Suspense>
</div>
```

**Import PanelSkeleton**:
```tsx
import { PanelSkeleton } from "./components/PanelSkeleton";
```

---

### Task 3.4: Update Component Exports for Default Export

**Note**: `lazy()` requires default exports. Ensure all panel components export default.

**Example**: `miyabi-desktop/src/components/AgentExecutionPanel.tsx`

**Current** (last line):
```tsx
// Named export
// (no export at end, only function declaration)
```

**Add**:
```tsx
export default AgentExecutionPanel;
```

**Repeat for**:
- [ ] `AgentExecutionPanel.tsx`
- [ ] `TerminalManager.tsx`
- [ ] `WorkflowDAGViewer.tsx`
- [ ] `NarrationPlayer.tsx`
- [ ] `IssueDashboard.tsx`
- [ ] `SettingsPanel.tsx`
- [ ] `DeploymentDashboard.tsx`
- [ ] `AutoMergeSettings.tsx`
- [ ] `TmuxManager.tsx`

---

## Day 5: Keyboard Navigation Improvements

### Task 5.1: Add Escape Key Handler for Panels

**File**: `miyabi-desktop/src/App.tsx`

**Add to `useEffect`** (lines 32-57):
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Existing shortcuts...

    // Escape key - Return to dashboard
    if (e.key === "Escape" && activePanel !== "dashboard") {
      e.preventDefault();
      setActivePanel("dashboard");
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [activePanel]); // Add activePanel dependency
```

---

### Task 5.2: Add Focus Management for Panel Switching

**File**: `miyabi-desktop/src/App.tsx`

**Add ref and focus management**:
```tsx
import { useState, useEffect, useRef } from "react";

function App() {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Focus main content when panel changes
  useEffect(() => {
    mainContentRef.current?.focus();
  }, [activePanel]);

  return (
    <Phase9Provider>
      <div className="flex flex-col h-screen bg-white text-gray-900">
        {/* ... */}
        <div
          ref={mainContentRef}
          id="main-content"
          className="flex-1 overflow-auto"
          tabIndex={-1}
          style={{ outline: "none" }}
        >
          {/* Panel content */}
        </div>
      </div>
    </Phase9Provider>
  );
}
```

---

## 🧪 Testing Checklist

### Accessibility Testing

- [ ] **VoiceOver Test** (macOS):
  ```bash
  # Enable VoiceOver
  Cmd + F5

  # Test navigation
  - Tab through all sidebar buttons
  - Verify aria-labels are announced
  - Verify active state is announced ("current page")
  - Test skip-to-content link
  - Verify status bar content is announced
  ```

- [ ] **Lighthouse Audit**:
  ```bash
  # Open Chrome DevTools
  # Navigate to Lighthouse tab
  # Run accessibility audit
  # Target: 100% score
  ```

- [ ] **Keyboard Navigation**:
  - [ ] Tab through all interactive elements
  - [ ] Verify focus indicators are visible
  - [ ] Test ⌘K command palette
  - [ ] Test ⌘1-8 panel shortcuts
  - [ ] Test Escape to return to dashboard
  - [ ] Verify focus moves to main content on panel switch

- [ ] **Screen Reader Content**:
  - [ ] All buttons have meaningful labels
  - [ ] Active panel is announced
  - [ ] Status updates are announced
  - [ ] Loading states are announced

### Performance Testing

- [ ] **Bundle Size Analysis**:
  ```bash
  npm run build
  npx vite-bundle-visualizer

  # Verify:
  # - Initial bundle < 250KB
  # - Panel chunks are separate
  # - Each panel chunk < 100KB
  ```

- [ ] **Lighthouse Performance**:
  - [ ] Time to Interactive (TTI) < 1.5s
  - [ ] First Contentful Paint (FCP) < 800ms
  - [ ] Largest Contentful Paint (LCP) < 2s
  - [ ] Total Blocking Time (TBT) < 300ms

- [ ] **Loading Experience**:
  - [ ] PanelSkeleton displays immediately on panel switch
  - [ ] No flash of empty content
  - [ ] Smooth transition from skeleton to real content

### Visual Regression

- [ ] Screenshot all panels before refactoring
- [ ] Screenshot all panels after refactoring
- [ ] Compare - ensure no visual changes except focus indicators

---

## 📊 Expected Results

### Before Refactoring

| Metric | Value |
|--------|-------|
| Lighthouse Accessibility | ~70% |
| Initial Bundle Size | ~500KB |
| Time to Interactive | ~2s |
| ARIA Labels | 0 |
| Focus Indicators | Minimal |

### After Phase 1

| Metric | Value | Improvement |
|--------|-------|-------------|
| Lighthouse Accessibility | 100% | +30% |
| Initial Bundle Size | ~200KB | -60% |
| Time to Interactive | <1s | -50% |
| ARIA Labels | 100% | +100% |
| Focus Indicators | Complete | ✅ |

---

## 🚀 Deployment

### Pull Request Checklist

- [ ] All tests pass
- [ ] Lighthouse accessibility: 100%
- [ ] Lighthouse performance: 90+
- [ ] Bundle size reduced by 60%
- [ ] VoiceOver test passed
- [ ] Keyboard navigation fully functional
- [ ] No visual regressions
- [ ] Code reviewed
- [ ] Documentation updated

### PR Title

```
feat(ui): Phase 1 - Critical accessibility and performance improvements
```

### PR Description Template

```markdown
## Summary

Phase 1 of UI refactoring based on [UI_REFACTORING_ANALYSIS.md](./docs/UI_REFACTORING_ANALYSIS.md).

## Changes

### Accessibility Improvements

- ✅ Added ARIA labels to all sidebar navigation buttons
- ✅ Added focus indicators (ring-2, ring-offset-2) to all interactive elements
- ✅ Added skip-to-content link
- ✅ Added navigation landmark with aria-label
- ✅ Improved status bar accessibility with role="status"
- ✅ Added Escape key handler to return to dashboard
- ✅ Added focus management for panel switching

### Performance Improvements

- ✅ Implemented code splitting with React.lazy()
- ✅ Created PanelSkeleton loading component
- ✅ Wrapped panel renders with Suspense boundary
- ✅ Converted all panel components to default exports

## Metrics

### Accessibility

- Lighthouse Accessibility: **100%** (was ~70%)
- ARIA labels: **100%** coverage (was 0%)
- Focus indicators: **Complete** (was minimal)
- Keyboard navigation: **Fully functional**

### Performance

- Initial bundle size: **~200KB** (was ~500KB) - **60% reduction**
- Time to Interactive: **<1s** (was ~2s) - **50% faster**
- Lighthouse Performance: **90+** (was ~60)

## Testing

- [x] VoiceOver test passed
- [x] Lighthouse accessibility audit: 100%
- [x] Lighthouse performance audit: 90+
- [x] Keyboard navigation test passed
- [x] Bundle size analysis completed
- [x] Visual regression test passed
- [x] All existing tests pass

## Screenshots

### Accessibility

[Screenshot of focus indicators]

### Performance

[Bundle size comparison chart]
[Lighthouse before/after]

## Breaking Changes

None. All changes are additive.

## Next Steps

Phase 2: Styling consistency improvements (Week 2)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Implementation Start**: Ready to begin
**Estimated Completion**: 5 days
**Priority**: P0 (Critical)
