# Miyabi Mission Control - Component Style Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-05
**Agent**: ProductDesign Agent 'Miyabi' - Issue #758

---

## Overview

This document provides detailed specifications for all UI components in the Miyabi Mission Control dashboard. Each component includes markup examples, styling rules, variants, states, and accessibility guidelines.

---

## 📊 Dashboard Statistics Cards

### Purpose
Display key metrics and KPIs at the top of the dashboard for quick overview.

### Base Component

```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
  <p className="text-gray-400 text-sm mb-2">Label</p>
  <p className="text-4xl font-bold text-white">Value</p>
</div>
```

### Variants

#### With Color Accent
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
  <p className="text-gray-400 text-sm mb-2">Running Agents</p>
  <p className="text-4xl font-bold text-miyabi-blue">3</p>
</div>
```

#### With Trend Indicator
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
  <div className="flex items-center justify-between mb-2">
    <p className="text-gray-400 text-sm">Completion Rate</p>
    <span className="flex items-center text-xs text-miyabi-green">
      <ArrowUpIcon className="w-3 h-3 mr-1" />
      12%
    </span>
  </div>
  <p className="text-4xl font-bold text-white">94%</p>
</div>
```

#### With Icon
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
  <div className="flex items-center justify-between mb-4">
    <p className="text-gray-400 text-sm">Total Issues</p>
    <div className="w-10 h-10 rounded-lg bg-miyabi-blue/10 flex items-center justify-center">
      <DocumentTextIcon className="w-5 h-5 text-miyabi-blue" />
    </div>
  </div>
  <p className="text-4xl font-bold text-white">24</p>
</div>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat cards */}
</div>
```

### Accessibility
- Use semantic HTML (`<dl>`, `<dt>`, `<dd>`) for screen readers:
  ```tsx
  <dl className="bg-gray-900 rounded-xl p-6 border border-gray-800">
    <dt className="text-gray-400 text-sm mb-2">Total Agents</dt>
    <dd className="text-4xl font-bold text-white">7</dd>
  </dl>
  ```
- Ensure color is not the only indicator (use icons/text)

---

## 🤖 Agent Status Cards

### Purpose
Display individual agent status, progress, and current task information.

### Base Component

```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
  {/* Header with name and status */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-semibold text-white">CoordinatorAgent</h3>
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-miyabi-blue text-white">
      実行中
    </span>
  </div>

  {/* Current task */}
  <p className="text-sm text-gray-400 mb-4">Issue #531 分析中</p>

  {/* Progress bar */}
  <div className="w-full bg-gray-800 rounded-full h-2">
    <div
      className="h-2 rounded-full bg-miyabi-blue transition-all duration-500"
      style={{ width: '75%' }}
    />
  </div>
  <p className="text-xs text-gray-500 mt-2 text-right">75%</p>
</div>
```

### Status Variants

#### Idle
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-600 text-white">
  待機中
</span>
```

#### Running
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-miyabi-blue text-white">
  実行中
</span>
```

#### Completed
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-miyabi-green text-white">
  完了
</span>
```

#### Failed
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-miyabi-red text-white">
  失敗
</span>
```

### With Agent Icon
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
  <div className="flex items-start gap-4 mb-4">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-miyabi-blue to-miyabi-purple flex items-center justify-center flex-shrink-0">
      <CpuChipIcon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-white">CodeGenAgent</h3>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-miyabi-blue text-white">
          実行中
        </span>
      </div>
      <p className="text-sm text-gray-400">Next.js コンポーネント生成中</p>
    </div>
  </div>

  {/* Progress bar */}
  <div className="w-full bg-gray-800 rounded-full h-2">
    <div className="h-2 rounded-full bg-miyabi-blue transition-all duration-500" style={{ width: '45%' }} />
  </div>
  <p className="text-xs text-gray-500 mt-2 text-right">45%</p>
</div>
```

### Interactive Variant (Clickable)
```tsx
<button
  className="w-full bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950"
  onClick={handleAgentClick}
>
  {/* Agent content */}
</button>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Agent cards */}
</div>
```

### Accessibility
- Use `<button>` or `<a>` for interactive cards
- Add `aria-label` with full agent information
- Provide `role="status"` for live updates
- Use `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for progress bars

---

## 📋 Issue Cards

### Purpose
Display GitHub issue information with status, labels, and link to GitHub.

### Base Component

```tsx
<a
  href={issue.url}
  target="_blank"
  rel="noopener noreferrer"
  className="block bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950"
>
  <div className="flex items-start justify-between">
    <div className="flex-1">
      {/* Issue number and state */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
        <span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
          open
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-3">{issue.title}</h3>

      {/* Labels */}
      <div className="flex flex-wrap gap-2">
        {issue.labels.map((label) => (
          <span key={label} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
            {label}
          </span>
        ))}
      </div>
    </div>

    {/* External link icon */}
    <ExternalLinkIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
  </div>
</a>
```

### State Variants

#### Open Issue
```tsx
<span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
  open
</span>
```

#### Closed Issue
```tsx
<span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
  closed
</span>
```

### With Assignee
```tsx
<div className="flex items-center gap-3 mb-2">
  <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
  <span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
    open
  </span>
  <div className="flex items-center gap-1 ml-auto">
    <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full" />
    <span className="text-xs text-gray-400">{assignee.name}</span>
  </div>
</div>
```

### With Priority Indicator
```tsx
<div className="flex items-center gap-3 mb-2">
  <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
  <span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
    open
  </span>
  <span className="flex items-center gap-1 text-xs text-miyabi-red">
    <ExclamationCircleIcon className="w-4 h-4" />
    High Priority
  </span>
</div>
```

### List Layout
```tsx
<div className="space-y-4">
  {/* Issue cards */}
</div>
```

---

## 🔘 Buttons

### Primary Button
```tsx
<button className="bg-miyabi-blue hover:bg-miyabi-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950">
  Execute Agent
</button>
```

### Secondary Button
```tsx
<button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950">
  Cancel
</button>
```

### Ghost Button
```tsx
<button className="hover:bg-gray-800 text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950">
  View Details
</button>
```

### Danger Button
```tsx
<button className="bg-miyabi-red hover:bg-miyabi-red/90 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-miyabi-red focus:ring-offset-2 focus:ring-offset-gray-950">
  Stop Agent
</button>
```

### Icon Button
```tsx
<button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950">
  <RefreshIcon className="w-5 h-5" />
</button>
```

### Button Group
```tsx
<div className="flex gap-3">
  <button className="bg-miyabi-blue hover:bg-miyabi-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
    Save
  </button>
  <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
    Cancel
  </button>
</div>
```

### Loading State
```tsx
<button
  disabled
  className="bg-miyabi-blue/50 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed flex items-center gap-2"
>
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
  Processing...
</button>
```

---

## 📊 Progress Bars

### Horizontal Progress Bar
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-400">Task Progress</span>
    <span className="text-white font-medium">75%</span>
  </div>
  <div className="w-full bg-gray-800 rounded-full h-2">
    <div
      className="h-2 rounded-full bg-miyabi-blue transition-all duration-500"
      style={{ width: '75%' }}
    />
  </div>
</div>
```

### With Multiple Segments
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-400">Overall Progress</span>
    <span className="text-white font-medium">85%</span>
  </div>
  <div className="w-full bg-gray-800 rounded-full h-2 flex overflow-hidden">
    <div className="h-2 bg-miyabi-green transition-all duration-500" style={{ width: '60%' }} />
    <div className="h-2 bg-miyabi-blue transition-all duration-500" style={{ width: '25%' }} />
  </div>
  <div className="flex items-center gap-4 text-xs">
    <span className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-miyabi-green"></div>
      <span className="text-gray-400">Completed: 60%</span>
    </span>
    <span className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-miyabi-blue"></div>
      <span className="text-gray-400">Running: 25%</span>
    </span>
  </div>
</div>
```

### Vertical Progress Bar
```tsx
<div className="flex flex-col items-center gap-2">
  <div className="w-2 h-32 bg-gray-800 rounded-full flex flex-col-reverse overflow-hidden">
    <div
      className="w-2 bg-miyabi-blue transition-all duration-500"
      style={{ height: '75%' }}
    />
  </div>
  <span className="text-xs text-gray-400">75%</span>
</div>
```

---

## 🏷️ Badges & Labels

### Status Badge
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-miyabi-blue text-white">
  Running
</span>
```

### Label Badge
```tsx
<span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
  priority:high
</span>
```

### Count Badge
```tsx
<span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-miyabi-red rounded-full">
  3
</span>
```

### Dot Badge
```tsx
<span className="flex items-center gap-2 text-sm">
  <span className="w-2 h-2 rounded-full bg-miyabi-green"></span>
  <span className="text-gray-300">Active</span>
</span>
```

---

## 📝 Input Fields

### Text Input
```tsx
<div className="space-y-2">
  <label htmlFor="agent-name" className="block text-sm font-medium text-gray-300">
    Agent Name
  </label>
  <input
    id="agent-name"
    type="text"
    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:border-transparent transition-colors"
    placeholder="Enter agent name..."
  />
</div>
```

### Text Area
```tsx
<div className="space-y-2">
  <label htmlFor="description" className="block text-sm font-medium text-gray-300">
    Description
  </label>
  <textarea
    id="description"
    rows={4}
    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:border-transparent transition-colors resize-none"
    placeholder="Enter description..."
  />
</div>
```

### Select Dropdown
```tsx
<div className="space-y-2">
  <label htmlFor="agent-type" className="block text-sm font-medium text-gray-300">
    Agent Type
  </label>
  <select
    id="agent-type"
    className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:border-transparent transition-colors"
  >
    <option>CoordinatorAgent</option>
    <option>CodeGenAgent</option>
    <option>ReviewAgent</option>
  </select>
</div>
```

### Checkbox
```tsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="w-5 h-5 rounded border-gray-800 bg-gray-900 text-miyabi-blue focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950"
  />
  <span className="text-sm text-gray-300">Enable auto-merge</span>
</label>
```

### Radio Button
```tsx
<div className="space-y-3">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="priority"
      className="w-5 h-5 border-gray-800 bg-gray-900 text-miyabi-blue focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950"
    />
    <span className="text-sm text-gray-300">High Priority</span>
  </label>
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="radio"
      name="priority"
      className="w-5 h-5 border-gray-800 bg-gray-900 text-miyabi-blue focus:ring-2 focus:ring-miyabi-blue focus:ring-offset-2 focus:ring-offset-gray-950"
    />
    <span className="text-sm text-gray-300">Normal Priority</span>
  </label>
</div>
```

---

## 🎛️ Control Panels

### Filter Panel
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
  <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>

  {/* Status filter */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-300">Status</label>
    <div className="flex flex-wrap gap-2">
      <button className="px-3 py-1.5 rounded-lg bg-miyabi-blue text-white text-sm font-medium">
        All
      </button>
      <button className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors">
        Running
      </button>
      <button className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors">
        Completed
      </button>
    </div>
  </div>

  {/* Search */}
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-300">Search</label>
    <input
      type="text"
      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-miyabi-blue focus:border-transparent text-sm"
      placeholder="Search agents..."
    />
  </div>
</div>
```

### Action Panel
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
  <div className="space-y-3">
    <button className="w-full bg-miyabi-blue hover:bg-miyabi-blue/90 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
      <PlayIcon className="w-5 h-5" />
      Execute All Agents
    </button>
    <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
      <PauseIcon className="w-5 h-5" />
      Pause Execution
    </button>
    <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-left flex items-center gap-3">
      <RefreshIcon className="w-5 h-5" />
      Refresh Status
    </button>
  </div>
</div>
```

---

## 🎨 Data Visualization Panels

### Metrics Chart Panel
```tsx
<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-semibold text-white">Agent Performance</h3>
    <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-miyabi-blue">
      <option>Last 7 days</option>
      <option>Last 30 days</option>
      <option>Last 90 days</option>
    </select>
  </div>

  {/* Chart container */}
  <div className="h-64 bg-gray-800/50 rounded-lg p-4">
    {/* Chart component goes here */}
  </div>

  {/* Legend */}
  <div className="flex items-center justify-center gap-6 mt-4">
    <span className="flex items-center gap-2 text-sm text-gray-400">
      <div className="w-3 h-3 rounded-full bg-miyabi-blue"></div>
      Running
    </span>
    <span className="flex items-center gap-2 text-sm text-gray-400">
      <div className="w-3 h-3 rounded-full bg-miyabi-green"></div>
      Completed
    </span>
  </div>
</div>
```

### Terminal/Log Panel
```tsx
<div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
    <div className="flex items-center gap-3">
      <TerminalIcon className="w-5 h-5 text-miyabi-blue" />
      <h3 className="text-lg font-semibold text-white">Agent Logs</h3>
    </div>
    <button className="text-gray-400 hover:text-white transition-colors">
      <XMarkIcon className="w-5 h-5" />
    </button>
  </div>

  <div className="p-6 bg-black/50 font-mono text-sm max-h-96 overflow-y-auto">
    <div className="space-y-1">
      <div className="text-gray-400">
        <span className="text-miyabi-green">[2025-11-05 13:00:00]</span> INFO: Agent started
      </div>
      <div className="text-gray-400">
        <span className="text-miyabi-blue">[2025-11-05 13:00:05]</span> DEBUG: Processing Issue #531
      </div>
      <div className="text-gray-400">
        <span className="text-miyabi-amber">[2025-11-05 13:00:10]</span> WARN: Rate limit approaching
      </div>
    </div>
  </div>
</div>
```

---

## 🔔 Notifications & Alerts

### Toast Notification
```tsx
<div className="fixed bottom-6 right-6 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4 max-w-md">
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-miyabi-green/10 flex items-center justify-center flex-shrink-0">
      <CheckCircleIcon className="w-6 h-6 text-miyabi-green" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-white mb-1">Agent Completed</h4>
      <p className="text-sm text-gray-400">CodeGenAgent has successfully completed Issue #531</p>
    </div>
    <button className="text-gray-500 hover:text-white transition-colors">
      <XMarkIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

### Alert Banner
```tsx
<div className="bg-miyabi-amber/10 border border-miyabi-amber/20 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <ExclamationTriangleIcon className="w-6 h-6 text-miyabi-amber flex-shrink-0" />
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-miyabi-amber mb-1">API Rate Limit Warning</h4>
      <p className="text-sm text-gray-300">You are approaching your GitHub API rate limit. Consider waiting before the next execution.</p>
    </div>
  </div>
</div>
```

---

## 🎯 Modal Dialogs

### Confirmation Modal
```tsx
<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
  <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-12 h-12 rounded-xl bg-miyabi-red/10 flex items-center justify-center flex-shrink-0">
        <ExclamationTriangleIcon className="w-6 h-6 text-miyabi-red" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2">Stop Agent?</h3>
        <p className="text-sm text-gray-400">
          Are you sure you want to stop CoordinatorAgent? This action cannot be undone.
        </p>
      </div>
    </div>

    <div className="flex gap-3 justify-end">
      <button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
        Cancel
      </button>
      <button className="bg-miyabi-red hover:bg-miyabi-red/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
        Stop Agent
      </button>
    </div>
  </div>
</div>
```

---

## 📱 Responsive Panel Layouts

### 4-Panel Dashboard Layout

```tsx
{/* Mobile: Stack all panels */}
{/* Tablet: 2x2 grid */}
{/* Desktop: 2x2 or custom arrangement */}

<div className="max-w-7xl mx-auto p-8">
  {/* Top Row: Stats + Agent Overview */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    {/* Panel 1: Statistics */}
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Stat cards */}
      </div>
    </div>

    {/* Panel 2: Agent Overview */}
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Active Agents</h2>
      {/* Agent list */}
    </div>
  </div>

  {/* Bottom Row: Issues + Logs */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Panel 3: Issues */}
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Active Issues</h2>
      {/* Issue cards */}
    </div>

    {/* Panel 4: Logs */}
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-6">Recent Logs</h2>
      {/* Log entries */}
    </div>
  </div>
</div>
```

### Alternative: Sidebar + Main Content
```tsx
<div className="flex min-h-screen">
  {/* Sidebar: Fixed width on desktop, collapsible on mobile */}
  <aside className="w-full lg:w-80 bg-gray-900 border-r border-gray-800 p-6">
    {/* Navigation, filters, controls */}
  </aside>

  {/* Main Content: Flexible width */}
  <main className="flex-1 p-8">
    {/* Dashboard content */}
  </main>
</div>
```

---

## 🎨 Empty States

### No Data
```tsx
<div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
    <DocumentIcon className="w-8 h-8 text-gray-600" />
  </div>
  <h3 className="text-xl font-semibold text-white mb-2">No Issues Found</h3>
  <p className="text-gray-400 mb-6">
    There are no active issues to display. Create a new issue to get started.
  </p>
  <button className="bg-miyabi-blue hover:bg-miyabi-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
    Create Issue
  </button>
</div>
```

---

## ♿ Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Keyboard navigation works for all components
- [ ] Screen reader labels (aria-label, aria-labelledby)
- [ ] Color contrast meets WCAG AA standards
- [ ] Loading states announced to screen readers
- [ ] Error messages are descriptive and actionable
- [ ] Touch targets are minimum 44x44px
- [ ] Form validation provides clear feedback

---

**Document maintained by**: ProductDesign Agent 'Miyabi'
**Related Issues**: #758
**Next Review**: 2025-12-05
