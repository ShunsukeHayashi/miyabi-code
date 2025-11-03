# Codex Task: Issue #673 - Integrate @humanu/orchestra (gwr) into miyabi-desktop

**Issue**: #673
**Title**: feat: Integrate @humanu/orchestra (gwr) into miyabi-desktop
**Priority**: P1-High
**Component**: desktop (miyabi-desktop)
**Estimated Duration**: 120 minutes

## Objective

Introduce the gwr (@humanu/orchestra) orchestration toolkit into the miyabi-desktop application so desktop workflows can mirror the tmux/gwr environment used across other execution patterns.

## Tasks

### 1. Dependency Integration
- Add the gwr dependency to the desktop package manager configuration (pnpm + Rust crates if required).
- Ensure licensing compliance and lockfile updates.

### 2. Backend (Rust/Tauri)
- Extend worktree + tmux coordination modules to call gwr APIs.
- Register Tauri commands for initializing and monitoring gwr sessions.
- Persist orchestration metadata in existing state stores.

### 3. Frontend (React/TypeScript)
- Surface gwr session state in the desktop UI via dedicated panels.
- Provide controls to start/stop/attach to gwr-driven tmux layouts.
- Display status indicators and error handling for orchestration lifecycle.

### 4. Testing & Validation
- Add unit/integration coverage for the new orchestration flows.
- Verify lint/test suites across Rust + TypeScript.
- Document manual QA checklist for tmux theme compatibility regression.

## Acceptance Criteria

- ✅ Desktop builds and launches with gwr orchestrator enabled.
- ✅ Users can start and monitor gwr/tmux sessions directly from the desktop app.
- ✅ State synchronization works across existing worktree views.
- ✅ Automated tests covering new flows are in place and passing.

## References

- Plans.md (Issue #673 high-level roadmap)
- EXECUTION_CONTEXT.md (CodeGenAgent context)
- tmux theme artifacts in `.worktrees/tmux-*`
- @humanu/orchestra documentation

---

**Generated**: 2025-11-03
**Agent**: Codex "ツバキ"
