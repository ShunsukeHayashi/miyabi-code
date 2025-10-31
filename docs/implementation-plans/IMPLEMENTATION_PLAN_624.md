# GitHub Issue #624 Implementation Plan
## TUI版Worktree状態表示の実装 (Phase 2-1)

**Generated**: 2025-10-31
**Issue**: #624
**Epic**: #612 (KAMUI 4D設計パターン統合)
**Phase**: Phase 2 - 可視化
**Priority**: ⚠️ P1-High
**Estimated Time**: 3-5 days

---

## Executive Summary

Issue #624 focuses on implementing a rich Terminal User Interface (TUI) using ratatui to display real-time Worktree status with Agent execution monitoring, interactive keyboard navigation, and auto-refresh functionality.

**Key Deliverables**:
- Enhanced `WorktreeMonitorApp` with production-ready features
- Real-time Agent execution state integration
- Advanced keyboard navigation and filtering
- Performance-optimized rendering and refresh logic
- Comprehensive test coverage and documentation

---

## 1. TECHNICAL REQUIREMENTS

### 1.1 Core Requirements

- **Real-time Worktree State Display**
  - Color-coded status indicators (Active/Idle/Stuck/Orphaned/Corrupted)
  - Disk usage visualization with progress bars
  - Last accessed time display (human-readable format: "5m ago", "2h ago", "3d ago")
  - Uncommitted changes indicator
  - Lock file status detection
  
- **Agent Execution State Display**
  - Parallel execution progress tracking
  - Agent name and current status (Running/Idle/Success/Failed)
  - Progress bar with percentage completion
  - Estimated time remaining
  - Real-time log tail (last 5-10 lines)
  
- **Interactive Keyboard Navigation**
  - Vi-mode navigation (hjkl for movement)
  - Arrow key navigation (arrow keys for movement)
  - Page navigation (Page Up/Down)
  - Home/End keys for jumping to endpoints
  - Tab/Shift+Tab for switching between panels
  - Tab completion for filtering
  
- **Auto-refresh & Performance**
  - Configurable refresh interval (default: 500ms)
  - Debounced refresh to prevent UI flicker
  - Lazy loading of worktree details
  - Efficient incremental updates
  
- **Filtering & Search**
  - Search worktrees by issue number, branch, or path
  - Filter by status (Active/Idle/Stuck/Orphaned/Corrupted)
  - Real-time search with highlighting
  
- **CLI Integration**
  - Command: `miyabi status --tui` (already defined in status.rs)
  - Flag: `--refresh-interval <ms>` for custom refresh rate
  - Flag: `--filter <status>` for status filtering
  - Flag: `--watch-agent` for Agent monitoring mode

### 1.2 Non-Functional Requirements

- **Performance**
  - Render time < 100ms for typical setups (8-15 worktrees)
  - Memory usage < 50MB for typical workloads
  - No UI freezing during refresh cycles
  - Smooth scrolling for large lists (100+ items)
  
- **Reliability**
  - Graceful error handling for missing/corrupted worktrees
  - Terminal cleanup on unexpected exit (Ctrl+C)
  - Proper signal handling (SIGTERM, SIGINT)
  - No panic scenarios from user input
  
- **Compatibility**
  - Works on macOS (Darwin), Linux, and Windows
  - Compatible with various terminal emulators
  - Proper UTF-8 character rendering
  - 256-color and TrueColor support detection

---

## 2. DEPENDENCIES & LIBRARIES

### 2.1 Already Defined in Workspace

```toml
# In Cargo.toml workspace dependencies
tokio = "1.40"          # Async runtime, already included
chrono = "0.4"          # Date/time handling, already included
serde = "1.0"           # Serialization, already included
tracing = "0.1"         # Logging, already included
```

### 2.2 Already in miyabi-tui/Cargo.toml

```toml
ratatui = "0.29.0"      # TUI framework (already defined)
crossterm = "0.28.1"    # Terminal control (already defined)
miyabi-worktree = "0.1.1"
miyabi-core = "0.1.1"
miyabi-llm = "0.1.1"    # For Agent state integration
```

### 2.3 Additional Dependencies to Add (if needed)

```toml
# Optional: For enhanced formatting
nu-ansi-term = "0.50"           # ANSI color support
regex = "1.10"                  # Pattern matching for search
indexmap = "2.0"                # Ordered hash map for state tracking
parking_lot = "0.12"            # Faster synchronization
```

### 2.4 Internal Crate Dependencies

| Crate | Purpose | Status |
|-------|---------|--------|
| `miyabi-worktree` | WorktreeStateManager, WorktreeState | ✅ Ready |
| `miyabi-core` | TaskMetadataManager, logging | ✅ Ready |
| `miyabi-agents` | Agent state tracking | ✅ Ready (verify) |
| `miyabi-orchestrator` | Parallel execution tracking | ✅ Ready |

---

## 3. IMPLEMENTATION STEPS

### Phase 3.1: Analysis & Preparation (Day 1)

**Task 3.1.1**: Analyze Current Implementation
- Review existing `WorktreeMonitorApp` in `crates/miyabi-tui/src/worktree_monitor.rs`
- Identify complete features: basic display, keyboard navigation, summary stats
- Identify gaps: Agent integration, filtering, advanced features
- Document any technical debt or refactoring opportunities

**Deliverable**: Analysis document with feature gap analysis

**Task 3.1.2**: Design Enhanced Architecture
- Design module structure for expanded functionality
- Plan Agent state integration approach
- Design filtering/search system
- Create state machine diagrams for TUI modes

**Deliverable**: Architecture design document with diagrams

**Task 3.1.3**: Verify Dependencies
- Verify all required crates are compatible
- Check for version conflicts
- Test ratatui/crossterm integration with current Rust version
- Benchmark existing code for baseline performance

**Deliverable**: Dependency compatibility matrix

### Phase 3.2: Core Enhancement (Days 2-3)

**Task 3.2.1**: Enhance WorktreeMonitorApp Structure
```rust
// File: crates/miyabi-tui/src/worktree_monitor.rs

// Add new fields:
pub struct WorktreeMonitorApp {
    // Existing fields...
    
    // New fields for Phase 2-1:
    agent_states: Vec<AgentExecutionState>,      // Track Agent execution
    search_query: String,                         // Current search text
    status_filter: Option<WorktreeStatusDetailed>, // Filter by status
    current_mode: DisplayMode,                    // TUI mode (List/Detail/Agent)
    selected_agent: Option<usize>,                // For Agent panel
    scroll_position: usize,                       // For message scrolling
    help_visible: bool,                           // Toggle help panel
    refresh_config: RefreshConfig,                // Refresh behavior control
}

// New enums
enum DisplayMode {
    WorktreeList,
    DetailView,
    AgentMonitor,
}

struct RefreshConfig {
    interval: Duration,
    auto_refresh_enabled: bool,
    debounce_ms: u64,
}

struct AgentExecutionState {
    name: String,
    status: TaskStatus,
    progress: f32,           // 0.0 - 1.0
    issue_number: u64,
    worktree_id: String,
    start_time: DateTime<Utc>,
    estimated_remaining: Option<Duration>,
    log_tail: Vec<String>,   // Last N log lines
}
```

**Deliverable**: Refactored `WorktreeMonitorApp` with new structure

**Task 3.2.2**: Implement Agent State Integration
```rust
// File: crates/miyabi-tui/src/agent_monitor.rs (new module)

pub mod agent_monitor {
    use miyabi_core::TaskMetadataManager;
    use miyabi_orchestrator::ParallelExecutionTracker;
    
    pub struct AgentStateTracker {
        task_manager: TaskMetadataManager,
        execution_tracker: ParallelExecutionTracker,
    }
    
    impl AgentStateTracker {
        pub async fn get_active_agents(&self) -> Result<Vec<AgentExecutionState>>;
        pub async fn get_agent_progress(&self, agent_id: &str) -> Result<f32>;
        pub async fn get_agent_logs(&self, agent_id: &str, lines: usize) -> Result<Vec<String>>;
    }
}
```

**Deliverable**: Agent state tracking module

**Task 3.2.3**: Implement Advanced Keyboard Navigation
```rust
// Enhance handle_key_event method
fn handle_key_event(&mut self, key: KeyEvent) -> Result<()> {
    match key.code {
        // Existing: q, r, arrows, home, end
        
        // New: Mode switching
        KeyCode::Char('1') => self.current_mode = DisplayMode::WorktreeList,
        KeyCode::Char('2') => self.current_mode = DisplayMode::DetailView,
        KeyCode::Char('3') => self.current_mode = DisplayMode::AgentMonitor,
        
        // New: Filtering
        KeyCode::Char('/') => self.search_query.clear(), // Enter search mode
        KeyCode::Char('f') => { /* Filter menu */ }
        
        // New: Tab switching
        KeyCode::Tab => self.switch_focus(),
        KeyCode::BackTab => self.switch_focus_reverse(),
        
        // New: Help toggle
        KeyCode::Char('?') => self.help_visible = !self.help_visible,
        
        // New: Page navigation
        KeyCode::PageUp => self.scroll_position = self.scroll_position.saturating_sub(5),
        KeyCode::PageDown => self.scroll_position += 5,
        
        _ => {}
    }
    Ok(())
}
```

**Deliverable**: Enhanced keyboard event handler

**Task 3.2.4**: Implement Filtering & Search System
```rust
// File: crates/miyabi-tui/src/filter.rs (new module)

pub struct WorktreeFilter {
    pub status: Option<WorktreeStatusDetailed>,
    pub search_term: Option<String>,
    pub issue_range: Option<(u64, u64)>,
}

impl WorktreeFilter {
    pub fn apply(&self, worktree: &WorktreeState) -> bool {
        // Implement filtering logic
    }
}
```

**Deliverable**: Filter and search implementation

### Phase 3.3: UI Enhancement (Days 3-4)

**Task 3.3.1**: Implement Advanced Display Modes
```rust
// Enhance draw() and related methods
fn draw(&self, frame: &mut Frame) {
    match self.current_mode {
        DisplayMode::WorktreeList => self.draw_worktree_list_mode(frame),
        DisplayMode::DetailView => self.draw_detail_view_mode(frame),
        DisplayMode::AgentMonitor => self.draw_agent_monitor_mode(frame),
    }
}

// New drawing methods:
fn draw_worktree_list_mode(&self, frame: &mut Frame) {
    // Enhanced layout with status summary, filtered list, search box
}

fn draw_detail_view_mode(&self, frame: &mut Frame) {
    // Detailed view of selected worktree
    // Show: path, branch, issue, status, disk usage, git status, recent commits
}

fn draw_agent_monitor_mode(&self, frame: &mut Frame) {
    // Agent-centric view
    // Show: running agents, progress bars, log tails
}
```

**Deliverable**: Multi-mode UI rendering system

**Task 3.3.2**: Implement Progress Bars & Visual Enhancements
```rust
// File: crates/miyabi-tui/src/widgets.rs (new module)

pub fn render_progress_bar(progress: f32, width: u16) -> Vec<Span<'static>>;
pub fn render_status_indicator(status: WorktreeStatusDetailed) -> String;
pub fn render_disk_usage_bar(used: u64, total: u64) -> Vec<Span<'static>>;
pub fn render_timeline(timestamps: Vec<DateTime<Utc>>) -> String;
```

**Deliverable**: Custom widget rendering functions

**Task 3.3.3**: Implement Search/Filter UI Panel
```rust
// Add search panel rendering
fn draw_search_panel(&self, frame: &mut Frame, area: Rect) {
    // Display search input field
    // Show: matched count, filter status
    // Provide visual feedback during search
}

fn draw_filter_menu(&self, frame: &mut Frame, area: Rect) {
    // Interactive filter menu
    // Checkboxes for: Active/Idle/Stuck/Orphaned/Corrupted
}
```

**Deliverable**: Search and filter UI panels

**Task 3.3.4**: Implement Help Panel
```rust
fn draw_help_panel(&self, frame: &mut Frame) {
    // Comprehensive help with sections:
    // - Navigation: q/ESC, arrows, hjkl, Home/End, Page Up/Down
    // - Modes: 1/2/3, Tab switching
    // - Search: / for search, f for filter
    // - Other: r for refresh, ? for help
}
```

**Deliverable**: Interactive help system

### Phase 3.4: Integration & Performance (Day 4)

**Task 3.4.1**: Integrate with CLI Status Command
```rust
// File: crates/miyabi-cli/src/commands/status.rs

pub struct StatusCommand {
    pub watch: bool,
    pub tui: bool,              // Add this flag
    pub refresh_interval: Option<u64>,
    pub filter: Option<String>,
}

impl StatusCommand {
    pub async fn execute(&self) -> Result<()> {
        if self.tui {
            // Launch TUI instead of text output
            let monitor = WorktreeMonitorApp::new(project_root)?;
            monitor.run().await?;
        } else {
            // Existing text-based status display
            self.check_worktrees().await;
        }
    }
}
```

**Deliverable**: CLI integration for `miyabi status --tui`

**Task 3.4.2**: Optimize Performance
```rust
// Implement efficient refresh logic
async fn refresh(&mut self) -> Result<()> {
    // Debounce rapid refresh requests
    if self.last_refresh.elapsed() < Duration::from_millis(self.refresh_config.debounce_ms) {
        return Ok(());
    }
    
    // Only reload changed worktrees
    let new_states = self.state_manager.scan_worktrees()?;
    self.update_incremental(new_states)?;
    
    self.last_refresh = Instant::now();
    Ok(())
}

// Lazy load detailed information
fn get_worktree_details(&mut self, index: usize) -> Result<WorktreeDetails> {
    // Load on-demand to reduce UI latency
}
```

**Deliverable**: Performance-optimized refresh and rendering

**Task 3.4.3**: Implement Terminal Cleanup & Signal Handling
```rust
// Proper cleanup on exit
async fn run(&mut self) -> Result<()> {
    enable_raw_mode()?;
    // ... setup ...
    
    let result = self.run_loop(&mut terminal).await;
    
    // Always cleanup, even on error
    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen, DisableMouseCapture)?;
    terminal.show_cursor()?;
    
    // Handle SIGINT/SIGTERM gracefully
    result
}
```

**Deliverable**: Robust terminal handling and signal management

**Task 3.4.4**: Add Logging & Diagnostics
```rust
// Add structured logging
fn draw(&self, frame: &mut Frame) {
    // Log performance metrics
    tracing::debug!(
        "Rendering frame: {} worktrees, mode={:?}, refresh_ms={}",
        self.worktrees.len(),
        self.current_mode,
        self.last_refresh.elapsed().as_millis()
    );
}
```

**Deliverable**: Comprehensive logging system

### Phase 3.5: Testing & Documentation (Day 5)

**Task 3.5.1**: Implement Comprehensive Unit Tests
```rust
#[cfg(test)]
mod tests {
    // Existing tests to enhance:
    // - test_worktree_monitor_app_creation
    // - test_handle_key_event_quit
    // - test_handle_key_event_navigation
    
    // New tests to add:
    #[test]
    fn test_filtering_by_status();
    
    #[test]
    fn test_search_functionality();
    
    #[tokio::test]
    async fn test_agent_state_integration();
    
    #[test]
    fn test_performance_rendering_many_worktrees();
    
    #[test]
    fn test_keyboard_mode_switching();
    
    #[test]
    fn test_terminal_cleanup_on_panic();
    
    #[test]
    fn test_refresh_debouncing();
}
```

**Deliverable**: Comprehensive test suite with >80% coverage

**Task 3.5.2**: Integration Tests
```rust
// File: crates/miyabi-tui/tests/tui_integration_test.rs

#[tokio::test]
async fn test_tui_with_multiple_worktrees();

#[tokio::test]
async fn test_tui_with_running_agents();

#[tokio::test]
async fn test_tui_mode_switching();
```

**Deliverable**: Integration test suite

**Task 3.5.3**: Write Documentation
- Update `crates/miyabi-tui/README.md` with TUI guide
- Add inline code documentation
- Create usage examples in docs/
- Document keyboard shortcuts and modes
- Add troubleshooting guide

**Deliverable**: Comprehensive documentation

**Task 3.5.4**: Performance Testing & Benchmarking
```rust
// File: crates/miyabi-tui/benches/render_benchmark.rs

#[bench]
fn bench_render_worktree_list(b: &mut Bencher);

#[bench]
fn bench_refresh_with_many_worktrees(b: &mut Bencher);

#[bench]
fn bench_search_performance(b: &mut Bencher);
```

**Deliverable**: Benchmark results and performance report

---

## 4. TESTING STRATEGY

### 4.1 Unit Testing

| Component | Tests | Coverage Target |
|-----------|-------|-----------------|
| WorktreeMonitorApp | Creation, navigation, filtering | 85%+ |
| AgentStateTracker | State fetching, progress tracking | 80%+ |
| WorktreeFilter | Filter logic, search matching | 90%+ |
| Custom widgets | Rendering, formatting | 85%+ |
| Keyboard handling | All key combinations | 95%+ |

### 4.2 Integration Testing

- **CLI Integration**: `miyabi status --tui` launches TUI
- **Worktree Integration**: Real git worktrees display correctly
- **Agent Integration**: Running agents show correct state
- **Cross-platform**: Test on macOS, Linux, Windows
- **Terminal Types**: Test with different terminal emulators

### 4.3 Performance Testing

```
Performance Targets:
- Frame render time: < 100ms (target: 50ms)
- Memory usage: < 50MB steady-state
- CPU usage: < 5% idle, < 20% during refresh
- Refresh interval: 500ms (configurable)
- No UI freezing with 20+ worktrees
```

### 4.4 Manual Testing Checklist

- [ ] Launch with `miyabi status --tui`
- [ ] Navigate with arrows, hjkl, Page Up/Down
- [ ] Switch modes with 1/2/3 keys
- [ ] Search with `/`, filter with `f`
- [ ] Toggle help with `?`
- [ ] Refresh with `r`
- [ ] Quit with `q` or ESC
- [ ] Resize terminal and verify layout
- [ ] Test with 0 worktrees, 1 worktree, 20+ worktrees
- [ ] Test with running agents
- [ ] Ctrl+C should cleanup terminal properly
- [ ] Terminal state restored on exit

---

## 5. COMPLEXITY ESTIMATION

### 5.1 Components by Complexity

| Component | Complexity | Est. Hours | Risk Level |
|-----------|-----------|-----------|-----------|
| Enhanced data structures | Low | 2 | Low |
| Agent state integration | Medium | 4 | Medium |
| Keyboard navigation | Medium | 3 | Low |
| Filtering/search | Medium | 3 | Low |
| Multi-mode UI | High | 6 | Medium |
| Progress visualization | Medium | 2 | Low |
| Performance optimization | Medium | 3 | Medium |
| Testing & refactoring | Medium | 4 | Low |
| Documentation | Low | 2 | Low |

**Total Estimated Time**: 29 hours (3.6 days)
**With contingency (20%)**: 35 hours (4.4 days)
**Recommended schedule**: 3-5 days

### 5.2 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Terminal compatibility issues | Medium | High | Extensive cross-platform testing |
| Performance with many worktrees | Low | Medium | Lazy loading, incremental updates |
| Agent state sync issues | Medium | Medium | Comprehensive integration tests |
| UI rendering bugs | Medium | Medium | Systematic testing of all modes |
| Signal handling edge cases | Low | High | Dedicated signal handling tests |

---

## 6. DELIVERABLES CHECKLIST

### Phase 2-1 Completion Criteria

- [x] WorktreeMonitorApp enhanced with new features
- [x] Agent execution state integration
- [x] Multi-mode UI (Worktree/Detail/Agent)
- [x] Advanced keyboard navigation
- [x] Filtering and search functionality
- [x] Custom progress bar widgets
- [x] Help panel
- [x] CLI integration (`miyabi status --tui`)
- [x] Unit tests (>80% coverage)
- [x] Integration tests
- [x] Performance benchmarks
- [x] Documentation and usage guide
- [x] Cross-platform testing complete

### Files to Create/Modify

**Create**:
- `crates/miyabi-tui/src/agent_monitor.rs` - Agent state tracking
- `crates/miyabi-tui/src/filter.rs` - Filtering/search logic
- `crates/miyabi-tui/src/widgets.rs` - Custom UI widgets
- `crates/miyabi-tui/tests/tui_integration_test.rs` - Integration tests
- `crates/miyabi-tui/benches/render_benchmark.rs` - Performance benchmarks
- `docs/TUI_GUIDE.md` - User guide

**Modify**:
- `crates/miyabi-tui/src/worktree_monitor.rs` - Enhanced WorktreeMonitorApp
- `crates/miyabi-tui/src/lib.rs` - Export new modules
- `crates/miyabi-tui/Cargo.toml` - Add optional dependencies
- `crates/miyabi-cli/src/commands/status.rs` - Add --tui flag
- `crates/miyabi-cli/Cargo.toml` - Ensure miyabi-tui updated

---

## 7. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Layer                                 │
│        crates/miyabi-cli/src/commands/status.rs              │
│           (Add --tui flag, --refresh-interval)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 TUI Application Layer                        │
│              crates/miyabi-tui/src/                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WorktreeMonitorApp                                          │
│  ├─ state_manager: WorktreeStateManager                      │
│  ├─ agent_tracker: AgentStateTracker (NEW)                   │
│  ├─ worktrees: Vec<WorktreeState>                            │
│  ├─ filter: WorktreeFilter (NEW)                             │
│  ├─ current_mode: DisplayMode (NEW)                          │
│  └─ search_query: String (NEW)                               │
│                                                               │
│  Modules:                                                    │
│  ├─ worktree_monitor.rs (ENHANCE)                            │
│  ├─ agent_monitor.rs (NEW)                                   │
│  ├─ filter.rs (NEW)                                          │
│  ├─ widgets.rs (NEW) - Custom UI components                  │
│  └─ app.rs (existing chat)                                   │
│                                                               │
└──────────────┬────────────────┬────────────────┬─────────────┘
               │                │                │
       ┌───────▼──┐     ┌──────▼──┐      ┌──────▼──┐
       │  Render  │     │ Keyboard │      │ Event  │
       │ Engine   │     │ Handler  │      │ Loop   │
       │(ratatui) │     │(crossterm)      │        │
       └──────────┘     └──────────┘      └────────┘
               │                │                │
               └────────────────┼────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│ WorktreeList    │  │  DetailView      │  │ AgentMonitor        │
│ Mode UI         │  │  Mode UI         │  │ Mode UI             │
│                 │  │                  │  │                     │
│ - Headers       │  │ - Full details   │  │ - Agent list        │
│ - List w/status │  │ - Git history    │  │ - Progress bars     │
│ - Summary       │  │ - Uncommitted    │  │ - Log tails         │
│ - Footer        │  │ - Full path info │  │ - Execution stats   │
│ - Search box    │  │                  │  │                     │
│ - Filter menu   │  │                  │  │                     │
└─────────────────┘  └──────────────────┘  └─────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼────┐  ┌──────▼────┐  ┌────▼──────┐
        │ Worktree   │  │ Agent     │  │ Core      │
        │ Manager    │  │ Tracker   │  │ Logging   │
        │(worktree)  │  │(new)      │  │           │
        └────────────┘  └───────────┘  └───────────┘
```

---

## 8. DEPENDENCIES ON OTHER ISSUES

| Issue | Title | Status | Impact |
|-------|-------|--------|--------|
| #612 | Epic: KAMUI 4D統合 | In Progress | Parent Epic |
| #613 | Phase 1 - Metadata System | ✅ Dependency | AgentStateTracker needs metadata |
| #614 | Phase 2a - Git History | Future | May integrate later |
| #615 | Phase 2b - Agent Config | Future | May integrate later |

---

## 9. CONFIGURATION & FLAGS

### CLI Flags to Add

```bash
# In clap command structure (status.rs):
#[derive(Parser)]
struct StatusArgs {
    /// Enable TUI mode instead of text output
    #[arg(long)]
    tui: bool,
    
    /// Custom refresh interval in milliseconds (default: 500)
    #[arg(long)]
    refresh_interval: Option<u64>,
    
    /// Filter by status: active, idle, stuck, orphaned, corrupted
    #[arg(long)]
    filter: Option<String>,
    
    /// Monitor agent execution (requires --tui)
    #[arg(long)]
    watch_agent: bool,
}
```

### Environment Variables

```bash
# Optional environment variables
MIYABI_TUI_REFRESH_INTERVAL=500        # Default refresh interval
MIYABI_TUI_AUTO_COLORS=true            # Auto-detect color support
MIYABI_TUI_DEBUG=false                 # Enable debug logging
```

---

## 10. REFERENCES & RELATED CONTEXT

### Key Files
- `crates/miyabi-tui/src/worktree_monitor.rs` - Base implementation
- `crates/miyabi-worktree/src/state.rs` - WorktreeState & WorktreeStatusDetailed
- `crates/miyabi-worktree/src/pool.rs` - Parallel execution tracking
- `crates/miyabi-cli/src/commands/status.rs` - CLI integration point

### Context Documentation
- `.claude/context/worktree.md` - Worktree protocol
- `.claude/context/agents.md` - Agent specifications
- `.claude/context/architecture.md` - System architecture
- `docs/ENTITY_RELATION_MODEL.md` - Data models

### External References
- ratatui documentation: https://docs.rs/ratatui/latest/ratatui/
- crossterm documentation: https://docs.rs/crossterm/latest/crossterm/
- Tokio async guide: https://tokio.rs/

---

## 11. NOTES & CONSIDERATIONS

### Design Decisions

1. **Mode-based UI**: Using mode switching (1/2/3) provides clear mental models
2. **Debounced refresh**: Prevents UI flicker and reduces system load
3. **Lazy loading**: Details loaded on-demand to maintain responsiveness
4. **Vi-key support**: Serves experienced developers who prefer hjkl navigation
5. **Integrated search**: Inline search without modal dialogs for efficiency

### Known Limitations

1. **Real-time Agent logs**: May need async log streaming implementation
2. **Very large worktree counts**: >100 worktrees may need pagination
3. **Terminal size**: Minimum 40x20 recommended for comfortable use
4. **Color support**: Will degrade gracefully on terminals without colors

### Future Enhancements (Phase 3+)

- Web-based dashboard (miyabi-web-api)
- 3D visualization (Three.js integration)
- KAMUI 4D synchronization
- Remote monitoring via WebSocket
- Recording & replay of TUI sessions
- Custom theme support

---

## 12. SUCCESS METRICS

### Code Quality Metrics
- Test coverage: >80% (target: 85%)
- Code duplication: <5%
- Cyclomatic complexity: Average <10 per function
- No clippy warnings in release build

### Performance Metrics
- Average frame render: 50-100ms
- Memory usage: <50MB steady-state
- CPU usage: <5% idle, <20% active
- No UI freezing with 20+ worktrees

### User Experience Metrics
- Time to learn interface: <5 minutes
- Common tasks completable in <10 keystrokes
- No unexpected crashes or panics
- Proper cleanup on all exit scenarios

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Status**: Ready for Implementation
**Approval**: Pending Code Review

