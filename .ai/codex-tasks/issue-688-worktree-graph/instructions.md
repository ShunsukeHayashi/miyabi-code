# Codex Task: Issue #688 - Worktrees Graph Visualization

**Issue**: #688
**Title**: feat: Worktrees graph visualization
**Priority**: P3-Low
**Component**: agent (miyabi-desktop)
**Estimated Duration**: 60-90 minutes

## Objective

Implement a graph visualization for the Worktrees view in miyabi-desktop, showing the relationship between branches and worktrees in a tree-like structure.

## Tasks

### Backend (Tauri/Rust)

1. **Implement `worktrees:graph` IPC handler**
   - Location: `miyabi-desktop/src-tauri/src/lib.rs` or new module
   - Return Git DAG + Worktree info as nodes/edges format

2. **Git relationship logic**
   - Use `git worktree list`, `git log`, `git merge-base`
   - Infer parent-child relationships and HEAD positions
   - Format as graph data structure (nodes + edges)

### Frontend (React/TypeScript)

3. **Add List/Graph tab toggle**
   - Location: `miyabi-desktop/src/views/Worktrees.tsx` (or similar)
   - Add tab switcher: "List" and "Graph" views

4. **Implement Graph rendering component**
   - Choose library: `react-flow` or `vis-network`
   - Install dependency: `pnpm add react-flow` (or vis-network)
   - Display nodes with: status, Issue number, Agent name
   - Display edges showing branch relationships

5. **Node click synchronization**
   - Clicking a node updates existing detail panel
   - Sync with current worktree selection state

6. **Filters and controls**
   - Filter: "Active only", "By Issue"
   - Zoom/Pan controls for graph navigation

### Testing

7. **Unit tests**
   - Test graph data generation logic (Rust)
   - Test React component rendering (Vitest snapshots)
   - Ensure `eslint` and `vitest` pass

## Acceptance Criteria

- ✅ Worktrees tab shows "Graph" view option
- ✅ Graph displays branches/worktrees in tree structure
- ✅ Edges show parent-child relationships (main → feature/issue-123)
- ✅ Clicking node updates detail panel
- ✅ All tests pass (eslint + vitest)

## Technical Notes

**Recommended approach**: Use `react-flow` for better React integration

**Directory structure**:
```
miyabi-desktop/
├── src-tauri/src/
│   ├── worktree.rs          # Existing worktree module
│   └── worktree_graph.rs    # NEW: Graph generation logic
└── src/
    ├── components/
    │   └── WorktreeGraph.tsx # NEW: Graph component
    └── views/
        └── Worktrees.tsx     # MODIFY: Add Graph tab
```

## Dependencies

```bash
cd miyabi-desktop
pnpm add react-flow
```

## Execution Steps

1. Read existing worktree implementation in `miyabi-desktop/src-tauri/src/worktree.rs`
2. Implement graph generation logic
3. Create IPC handler for `worktrees:graph`
4. Install react-flow
5. Create WorktreeGraph.tsx component
6. Integrate into Worktrees.tsx view
7. Add tests
8. Verify with `cargo clippy`, `cargo test`, `pnpm lint`, `pnpm test`

## Related Files

- `miyabi-desktop/src-tauri/src/worktree.rs` - Existing worktree logic
- `miyabi-desktop/src-tauri/src/lib.rs` - IPC handlers
- `miyabi-desktop/src/views/Worktrees.tsx` - Main view (if exists)

## Success Metrics

- Graph displays correctly with all worktrees
- Performance: < 100ms for graph data generation
- No console errors or warnings
- All existing tests still pass

---

**Generated**: 2025-11-03
**Agent**: Codex (pane %25)
