# Phase 2: Module Level Visualization - Design Document

**Version**: 1.0.0
**Created**: 2025-10-26
**Status**: Planning

---

## 📋 Overview

Phase 2 extends the visualization system to support **Module Level** analysis, allowing users to drill down from Crate view into individual modules within a crate.

### Molecular Structure Metaphor

- **Level 0 (Current)**: Crate → Protein Complex
- **Level 1 (Phase 2)**: Module → Protein Domain

---

## 🎯 Goals

1. **Hierarchical Navigation**: Click on a crate → View its internal modules
2. **Module Dependency Analysis**: Visualize how modules depend on each other within a crate
3. **Breadcrumb Navigation**: Easy navigation between Crate ↔ Module levels
4. **Module-level Metrics**: LOC, complexity, test coverage per module

---

## 📊 Data Structures

### ModuleNode

```rust
/// A node representing a Rust module within a crate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleNode {
    /// Unique identifier within crate (e.g., "agent_core", "github::api")
    pub id: String,

    /// Parent crate this module belongs to
    pub crate_id: String,

    /// Full module path (e.g., "miyabi_agent_core::rules_context")
    pub full_path: String,

    /// Lines of code in this module
    pub loc: usize,

    /// Cyclomatic complexity (average across functions)
    pub complexity: f32,

    /// Test coverage percentage (0.0 - 1.0)
    pub coverage: f32,

    /// Number of public items (functions, structs, enums, traits)
    pub public_items_count: usize,

    /// Whether this is a public module (pub mod)
    pub is_public: bool,

    /// File path relative to crate root
    pub file_path: String,

    /// Number of dependencies on other modules (outgoing edges)
    pub dependencies_count: usize,

    /// Number of modules depending on this one (incoming edges)
    pub dependents_count: usize,
}
```

### ModuleDependency

```rust
/// A dependency edge between two modules within the same crate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleDependency {
    /// Source module (depends on target)
    pub source: String,

    /// Target module (depended upon by source)
    pub target: String,

    /// Strength of dependency (number of use statements)
    pub strength: usize,

    /// Whether this crosses a major module boundary
    pub is_cross_boundary: bool,
}
```

### ModuleGraph

```rust
/// Module-level dependency graph for a single crate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleGraph {
    /// Parent crate ID
    pub crate_id: String,

    /// All modules in this crate
    pub nodes: Vec<ModuleNode>,

    /// All dependencies between modules
    pub links: Vec<ModuleDependency>,
}
```

---

## 🔬 Analysis Process

### Step 1: Parse Crate Structure

```rust
// Parse lib.rs or main.rs to find all module declarations
pub fn parse_crate_modules(crate_path: &Path) -> Result<Vec<ModuleInfo>> {
    // 1. Find entry point (lib.rs or main.rs)
    // 2. Parse module declarations:
    //    - mod foo;
    //    - pub mod bar;
    //    - mod baz { ... }
    // 3. Recursively parse submodules
    // 4. Build module tree
}
```

### Step 2: Analyze Dependencies

```rust
// Analyze use statements to build dependency graph
pub fn analyze_module_dependencies(modules: &[ModuleInfo]) -> Vec<ModuleDependency> {
    // For each module:
    // 1. Parse use statements
    // 2. Map use paths to module IDs
    // 3. Count dependency strength (number of imports)
    // 4. Detect cross-boundary dependencies
}
```

### Step 3: Calculate Metrics

```rust
// Calculate module-level metrics
pub fn calculate_module_metrics(module: &ModuleInfo) -> ModuleMetrics {
    // 1. Count LOC (excluding comments/blank lines)
    // 2. Calculate cyclomatic complexity
    // 3. Count public items (fn, struct, enum, trait, const)
    // 4. Determine visibility (pub mod vs mod)
}
```

---

## 🌐 API Endpoints

### GET /api/structure/:crate_id/modules

Returns module-level data for a specific crate.

**Request**:
```
GET /api/structure/miyabi-agent-core/modules
```

**Response**:
```json
{
  "crate_id": "miyabi-agent-core",
  "nodes": [
    {
      "id": "rules_context",
      "crate_id": "miyabi-agent-core",
      "full_path": "miyabi_agent_core::rules_context",
      "loc": 245,
      "complexity": 12.5,
      "coverage": 0.78,
      "public_items_count": 8,
      "is_public": true,
      "file_path": "src/rules_context.rs",
      "dependencies_count": 3,
      "dependents_count": 5
    }
  ],
  "links": [
    {
      "source": "rules_context",
      "target": "agent",
      "strength": 5,
      "is_cross_boundary": false
    }
  ]
}
```

---

## 🎨 Frontend Changes

### 1. Drill-Down Interaction

```typescript
// In MiyabiViewer.tsx
const handleNodeClick = (node: CrateNode) => {
  // User clicked a crate node
  if (currentLevel === 'crate') {
    // Fetch module-level data
    fetchModuleData(node.id).then((moduleData) => {
      setCurrentLevel('module');
      setCurrentCrateId(node.id);
      setGraphData(moduleData);
    });
  }
};
```

### 2. Breadcrumb Navigation

```typescript
// New component: Breadcrumb.tsx
<nav className="breadcrumb">
  <button onClick={() => navigateTo('crate')}>
    🧬 Crate Level
  </button>
  {currentCrateId && (
    <>
      <span>/</span>
      <button onClick={() => navigateTo('module', currentCrateId)}>
        📦 {currentCrateId} Modules
      </button>
    </>
  )}
</nav>
```

### 3. Level-Specific Visualization

```typescript
// Adjust visual properties based on level
const getNodeProps = () => {
  if (currentLevel === 'crate') {
    return {
      nodeSize: (n: CrateNode) => n.val * 7,
      nodeColor: (n: CrateNode) => getCategoryColor(n.group),
    };
  } else if (currentLevel === 'module') {
    return {
      nodeSize: (n: ModuleNode) => (n.loc / 100) * 5,
      nodeColor: (n: ModuleNode) => n.is_public ? '#4CAF50' : '#9E9E9E',
    };
  }
};
```

---

## 🔍 Visual Design

### Module Node Appearance

- **Size**: Proportional to LOC (smaller scale than crates)
- **Color**:
  - Green (#4CAF50): Public modules (pub mod)
  - Gray (#9E9E9E): Private modules (mod)
- **Opacity**: Test coverage (0.0-1.0)
- **Labels**:
  - Primary: Module name
  - Secondary: LOC count
  - Tertiary: Complexity score (if high)

### Module Link Appearance

- **Color**:
  - Blue (#2196F3): Internal dependencies (same parent module)
  - Orange (#FF9800): Cross-boundary dependencies
- **Thickness**: Dependency strength (number of use statements)
- **Style**:
  - Solid: Strong dependencies (strength > 5)
  - Dashed: Weak dependencies (strength ≤ 5)

---

## 📁 File Structure

### Backend (Rust)

```
crates/miyabi-viz/src/
├── analyzer/
│   ├── mod.rs
│   ├── cargo_parser.rs
│   ├── git_analyzer.rs
│   ├── graph_builder.rs
│   └── module_analyzer.rs     ← NEW
├── models/
│   ├── mod.rs
│   ├── node.rs
│   ├── graph.rs
│   └── module.rs              ← NEW
└── lib.rs
```

### Frontend (Next.js)

```
crates/miyabi-viz/frontend/
├── app/
│   ├── page.tsx               ← UPDATE (add level state)
│   └── api/
│       └── structure/
│           └── [crate_id]/
│               └── modules/
│                   └── route.ts  ← NEW
├── components/
│   ├── MiyabiViewer.tsx       ← UPDATE (level-aware)
│   ├── Breadcrumb.tsx         ← NEW
│   ├── ControlPanel.tsx       ← UPDATE (level toggle)
│   └── InfoPanel.tsx          ← UPDATE (module info)
└── types/
    └── graph.ts               ← UPDATE (add module types)
```

---

## 🚀 Implementation Plan

### Phase 2.1: Backend Infrastructure (Week 1)

1. ✅ Design data structures (ModuleNode, ModuleDependency, ModuleGraph)
2. ⬜ Implement ModuleAnalyzer
   - Parse module declarations (mod, pub mod)
   - Extract use statements
   - Calculate metrics (LOC, complexity, coverage)
3. ⬜ Implement module dependency analysis
4. ⬜ Add tests for ModuleAnalyzer
5. ⬜ Update CLI to support module-level generation

### Phase 2.2: API Layer (Week 1)

6. ⬜ Create /api/structure/:crate_id/modules endpoint
7. ⬜ Implement caching for module data
8. ⬜ Add error handling for missing crates

### Phase 2.3: Frontend Integration (Week 2)

9. ⬜ Add level state management (crate vs module)
10. ⬜ Implement drill-down interaction
11. ⬜ Create Breadcrumb component
12. ⬜ Update MiyabiViewer for level-aware rendering
13. ⬜ Update ControlPanel with "Back to Crate Level" button
14. ⬜ Update InfoPanel to show module-specific metrics

### Phase 2.4: Testing & Documentation (Week 2)

15. ⬜ Test drill-down navigation
16. ⬜ Test breadcrumb navigation
17. ⬜ Test module visualization
18. ⬜ Update USER_GUIDE.md with module-level usage
19. ⬜ Create Phase 2 demo video/screenshots

---

## ✅ Success Criteria

- [ ] Users can click on a crate node to drill down to module view
- [ ] Module-level dependencies are clearly visualized
- [ ] Breadcrumb navigation works seamlessly
- [ ] Module metrics (LOC, complexity, coverage) are accurate
- [ ] Performance: Module data loads in < 500ms
- [ ] No breaking changes to existing Crate-level view

---

## 📊 Performance Considerations

### Caching Strategy

```typescript
// Cache module data to avoid re-fetching
const moduleCache = new Map<string, ModuleGraphData>();

async function fetchModuleData(crateId: string) {
  if (moduleCache.has(crateId)) {
    return moduleCache.get(crateId);
  }

  const data = await fetch(`/api/structure/${crateId}/modules`).then(r => r.json());
  moduleCache.set(crateId, data);
  return data;
}
```

### Lazy Loading

- Only analyze modules when user clicks on a crate
- Generate crate-level data eagerly (as before)
- Generate module-level data on-demand

---

## 🎓 Learning Resources

### Rust Parsing

- [syn](https://docs.rs/syn/latest/syn/) - Rust syntax parser
- [rust-analyzer](https://rust-analyzer.github.io/) - LSP for Rust
- [cargo metadata](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html) - Crate metadata

### Cyclomatic Complexity

- [cargo-cyclocomp](https://github.com/regexident/cargo-cyclocomp) - Complexity analyzer
- McCabe's Cyclomatic Complexity formula

### Force-Directed Graphs

- [3d-force-graph hierarchical layouts](https://github.com/vasturiano/3d-force-graph#hierarchical-layouts)
- Drill-down interaction patterns

---

## 🔗 Related Documents

- [USER_GUIDE.md](./USER_GUIDE.md) - User-facing documentation
- [HIERARCHICAL_DESIGN.md](./HIERARCHICAL_DESIGN.md) - Full hierarchy design (Levels 0-4)
- [USER_CENTERED_DESIGN.md](./USER_CENTERED_DESIGN.md) - Persona-driven design

---

**Last Updated**: 2025-10-26
**Author**: Miyabi Development Team
