# miyabi-viz - Molecular Visualization System

A 3D interactive visualization system that represents the Miyabi codebase as a molecular structure, inspired by protein structure visualization tools.

## 🧬 Core Metaphor

Visualize software architecture using molecular structure concepts:

| Software Concept | Molecular Concept | Visualization |
|-----------------|-------------------|---------------|
| **Crate** | Residue (amino acid) | Sphere with size ∝ LOC |
| **Dependency** | Bond (peptide/hydrogen) | Line connecting spheres |
| **Commit Frequency** | B-factor (temperature factor) | Color (blue → red) |
| **Test Coverage** | Occupancy | Opacity (0.0 → 1.0) |
| **Active Agent** | Active site | Glow effect (Phase 2) |

## 🚀 Quick Start

### Installation

```bash
cargo install --path . --features cli
```

### Basic Usage

```bash
# Analyze workspace
miyabi-viz analyze

# Generate visualization data (quick mode)
miyabi-viz generate --quick --output structure.json

# Full analysis with Git history
miyabi-viz generate --output structure.json

# Check for circular dependencies
miyabi-viz generate --check-cycles
```

## 📊 Example Output

```bash
$ miyabi-viz analyze --quick

🔍 Analyzing Miyabi workspace...

📊 Statistics:
   Total crates: 29
   Total dependencies: 96

📦 By category:
   Agent: 8
   Core: 2
   Integration: 3
   Infrastructure: 3
   Tool: 1
   Test: 1
   Business: 1
   Other: 10

📈 Top 5 largest crates (by LOC):
   miyabi-agents (9056 LOC)
   miyabi-agent-business (8318 LOC)
   miyabi-types (5983 LOC)
   miyabi-cli (5883 LOC)
   miyabi-knowledge (5340 LOC)

🌟 Top 5 most depended-upon crates:
   miyabi-types (23 dependents)
   miyabi-core (16 dependents)
   miyabi-agent-core (9 dependents)
   miyabi-github (8 dependents)
   miyabi-llm (7 dependents)
```

## 🎨 Visualization

### Using 3d-force-graph Online Viewer

1. Generate JSON:
   ```bash
   miyabi-viz generate --output structure.json
   ```

2. Open https://vasturiano.github.io/3d-force-graph/example/large-graph/

3. Open browser console and paste:
   ```javascript
   fetch('/path/to/structure.json')
     .then(r => r.json())
     .then(data => {
       const graph = ForceGraph3D()
         (document.getElementById('3d-graph'))
         .graphData(data)
         .dagMode('td')  // Top-down layout
         .nodeLabel('id')
         .nodeColor('color')
         .nodeOpacity('opacity')
         .linkColor('color')
         .linkWidth('width');
     });
   ```

### Local Frontend (Phase 2)

Frontend implementation is planned for Phase 2. See [Issue #545](https://github.com/customer-cloud/miyabi-private/issues/545).

## 🔍 Analysis Features

### Circular Dependency Detection

```bash
miyabi-viz generate --check-cycles
```

Detects and reports circular dependencies using Tarjan's algorithm.

### God Crate Detection

```bash
miyabi-viz generate --god-crate-threshold 15
```

Identifies crates with too many dependencies (default: >15).

### Unstable Hub Detection

Finds crates that are:
- Heavily depended upon (>5 dependents)
- Highly volatile (B-factor >70.0)

These represent high-risk architectural points.

## 📦 Data Model

### CrateNode

```rust
pub struct CrateNode {
    pub id: String,           // Crate name
    pub loc: usize,           // Lines of code
    pub bfactor: f32,         // 0.0 (stable) → 100.0 (volatile)
    pub occupancy: f32,       // 0.0 (no tests) → 1.0 (100% coverage)
    pub category: CrateCategory,
    pub dependencies_count: usize,
    pub dependents_count: usize,
}
```

### Dependency

```rust
pub struct Dependency {
    pub source: String,
    pub target: String,
    pub kind: DependencyKind,  // Runtime, Dev, or Build
}
```

### B-factor Calculation

```
B-factor = (commits_last_30days / total_commits) * 100
```

- Blue (0-50): Stable crate, few recent changes
- Yellow (50-75): Moderate activity
- Red (75-100): Highly volatile, frequent changes

## 🧪 Library Usage

```rust
use miyabi_viz::{MiyabiAnalyzer, exporter::JsonExporter};

let analyzer = MiyabiAnalyzer::new(".")?;
let graph = analyzer.analyze()?;

// Export to JSON
JsonExporter::export_to_file(&graph, "structure.json")?;

// Detect issues
let cycles = graph.detect_cycles();
let god_crates = graph.find_god_crates(15);
let unstable_hubs = graph.find_unstable_hubs(70.0, 5);
```

## 🎯 Roadmap

- [x] **Phase 1**: Static visualization (MVP)
  - [x] Cargo metadata parsing
  - [x] Git history analysis
  - [x] Dependency graph building
  - [x] JSON export for 3d-force-graph
  - [x] CLI tool

- [ ] **Phase 2**: Real-time updates
  - [ ] WebSocket server
  - [ ] Agent execution visualization
  - [ ] React + Next.js frontend
  - [ ] Live B-factor updates

- [ ] **Phase 3**: Advanced features
  - [ ] Git history animation (trajectory playback)
  - [ ] Time-series analysis
  - [ ] NGL.js integration for authentic molecular rendering

## 📚 References

**Inspired by:**
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph) - Primary visualization library
- [cargo-modules](https://github.com/regexident/cargo-modules) - Rust dependency analysis
- [CodeCity](https://wettel.github.io/codecity.html) - Software city metaphor
- [NGL Viewer](http://nglviewer.org/) - Molecular structure visualization

## 📄 License

Apache-2.0

---

**Related Issue**: [#545 - Implement Miyabi Molecular Visualization System (Phase 1 MVP)](https://github.com/customer-cloud/miyabi-private/issues/545)
