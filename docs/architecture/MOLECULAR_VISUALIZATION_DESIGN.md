# Miyabi Molecular Visualization System - Detailed Design Document

**Version**: 1.0.0
**Date**: 2025-10-24
**Status**: Design Phase

---

## 🎯 Executive Summary

Miyabiプロジェクトのコードベースを、タンパク質構造解析の手法を用いて可視化するシステムの詳細設計。実際の分子生物学で使用される可視化ライブラリ（NGL Viewer、3Dmol.js、Mol*、PyMOL）の技術を応用し、コードの構造・依存関係・活動状態を直感的に理解できる3D可視化システムを構築する。

---

## 📚 Reference: Protein Visualization Libraries

### 1. NGL Viewer
- **URL**: http://nglviewer.org/
- **Technology**: WebGL + Three.js
- **Features**:
  - PDB/mmCIF/MOL2 format support
  - 15+ representation types (cartoon, surface, ball-stick, etc.)
  - Real-time rendering with SSAO (Screen Space Ambient Occlusion)
  - Selection language (MDAnalysis-like syntax)
  - Animation and trajectory support

**Applicable to Miyabi:**
```javascript
// NGL-style selection syntax for Miyabi
"chain A and residue 1-5"  →  "module:core and crate:miyabi-types"
"resname GLY"              →  "type:agent"
"backbone"                 →  "dependencies:direct"
```

### 2. 3Dmol.js
- **URL**: https://3dmol.csb.pitt.edu/
- **Technology**: Pure JavaScript + WebGL
- **Features**:
  - Lightweight (~300KB)
  - Multiple coloring schemes (by chain, B-factor, element)
  - Surface rendering (VDW, SAS, SES)
  - Label and measurement tools

**Applicable to Miyabi:**
```javascript
// 3Dmol-style API
viewer.addCrate({name: 'miyabi-core', activity: 0.9});
viewer.setStyle({chain: 'A'}, {cartoon: {color: 'spectrum'}});
viewer.addSurface(viewer.SurfaceType.VDW, {opacity: 0.5});
```

### 3. Mol* (Mol-star)
- **URL**: https://molstar.org/
- **Technology**: TypeScript + WebGL2
- **Features**:
  - High-performance volumetric rendering
  - Large structure support (1M+ atoms)
  - Advanced shaders (depth peeling, multi-pass rendering)
  - Custom representations and plugins

**Applicable to Miyabi:**
- WebGL2 + compute shaders for massive codebase visualization
- Plugin architecture for custom Agent animations
- State management for time-series analysis

### 4. PyMOL (Reference)
- **Technology**: Python + OpenGL
- **Features**:
  - Publication-quality rendering
  - Ray-tracing support
  - Scripting interface
  - Structural alignment (RMSD calculation)

**Applicable to Miyabi:**
- Ray-traced export for documentation
- Scripting interface for automated visualization generation
- Structural comparison (code diff visualization)

---

## 🧬 Mapping: Protein ↔ Miyabi Project

### Core Concepts

| Protein Structure | Miyabi Project | Visualization |
|-------------------|----------------|---------------|
| **Protein** | Entire Codebase | Complete 3D scene |
| **Chain** | Module Group (Core/Agents/Infra) | Color-coded sub-structures |
| **Domain** | Crate Category | Functional regions |
| **Residue** | Individual Crate | Sphere/Box/Mesh |
| **Atom** | File/Function | Sub-components |
| **Bond** | Dependency (Cargo.toml) | Line/Cylinder |
| **Hydrogen Bond** | Weak Dependency (feature flags) | Dashed line |
| **Disulfide Bond** | Strong Coupling | Thick line |
| **Secondary Structure** | Module Architecture | Cartoon/Ribbon |
| **α-helix** | Stable Core Module | Helical ribbon |
| **β-sheet** | Interface Layer | Flat ribbon |
| **Loop** | Utility Functions | Coil |
| **Active Site** | Agent Execution Point | Highlighted region |
| **Ligand** | External Dependency (crates.io) | Special shape |
| **Water Molecule** | Configuration File | Small sphere |
| **B-factor** | Change Frequency | Color intensity |
| **Occupancy** | Code Coverage | Transparency |
| **RMSD** | Code Diff Magnitude | Distance metric |
| **Trajectory** | Git History | Animation frames |

---

## 🎨 Representation Types

### 1. Ball & Stick (Default)
```
Atoms: Spheres (radius = LOC^0.3)
Bonds: Cylinders (radius = 0.3)
Color: By B-factor (activity heat)
```

**Use Case**: Detailed dependency analysis

### 2. Cartoon
```
α-helix: Core modules (cylinder)
β-sheet: Interface modules (flat ribbon)
Loop: Utilities (thin tube)
Width: Proportional to LOC
Color: By chain
```

**Use Case**: Architectural overview

### 3. Surface
```
Type: Solvent Accessible Surface (SAS)
Algorithm: MSMS or EDTSurf
Opacity: 0.5-0.8
Color: By hydrophobicity → By coupling strength
```

**Use Case**: Module boundaries visualization

### 4. Spacefill (VDW)
```
Radius: Van der Waals → Complexity metric
Color: By activity
Overlap: Merge overlapping crates
```

**Use Case**: Complexity hotspot detection

### 5. Ribbon
```
Width: 2-8 (based on importance)
Smoothness: Cubic spline interpolation
Color: Gradient by B-factor
```

**Use Case**: Flow visualization

### 6. Licorice
```
Stick radius: 0.5
Atom radius: 1.5
Detail: Show individual files
```

**Use Case**: Fine-grained analysis

### 7. Trace (Cα)
```
Only main chain: Core dependencies only
Smooth: B-spline curve
Thickness: Activity-based
```

**Use Case**: Simplified architecture view

### 8. Volumetric (Advanced)
```
Density: Code density per cubic unit
Isosurface: Threshold-based rendering
Transparency: Multi-layer depth peeling
```

**Use Case**: Large-scale project visualization

---

## 🎨 Coloring Schemes

### 1. By Chain
```
Chain A (Core):       RGB(255, 100, 100) - Red
Chain B (Agents):     RGB(100, 255, 100) - Green
Chain C (Infra):      RGB(100, 100, 255) - Blue
Chain D (External):   RGB(255, 255, 100) - Yellow
```

### 2. By B-factor (Activity Heat)
```
B-factor Range: 0-100
Color Scale: Blue → Cyan → Green → Yellow → Orange → Red

 0-20:  RGB(0, 0, 255)     - Blue (Idle)
20-40:  RGB(0, 255, 255)   - Cyan (Low activity)
40-60:  RGB(0, 255, 0)     - Green (Medium)
60-80:  RGB(255, 255, 0)   - Yellow (High)
80-100: RGB(255, 0, 0)     - Red (Very high)
```

### 3. By Residue Type
```
Core Type:        Green
Agent Type:       Magenta
Integration:      Cyan
Deprecated:       Gray
```

### 4. By Secondary Structure
```
α-helix:          Magenta
β-sheet:          Yellow
Loop:             White
```

### 5. By Element (File Type)
```
Rust (.rs):       Orange
TypeScript (.ts): Blue
TOML (.toml):     Brown
Markdown (.md):   Green
```

### 6. By Hydrophobicity → Coupling Strength
```
High Coupling:    Hydrophobic (Yellow/Orange)
Low Coupling:     Hydrophilic (Blue)
```

### 7. Custom (User-defined)
```
JavaScript API:
viewer.setColor({crate: 'miyabi-core'}, 0xFF0000);
viewer.setColorGradient([0x0000FF, 0xFF0000], 'activity');
```

---

## 📐 Structural Analysis Features

### 1. Distance Measurement
```
Between two atoms:    d = ||pos1 - pos2||
Label:                "12.5 Å" (scaled units)
Visual:               Dashed line + label

Use Case: Measure coupling distance between modules
```

### 2. Angle Measurement
```
Three atoms: A-B-C
Angle θ = arccos((BA · BC) / (||BA|| ||BC||))
Label: "120.3°"

Use Case: Analyze dependency triangle
```

### 3. Dihedral Angle
```
Four atoms: A-B-C-D
Torsion angle φ = angle between planes ABC and BCD
Label: "-45.7°"

Use Case: Module rotation/refactoring analysis
```

### 4. RMSD (Root Mean Square Deviation)
```
RMSD = sqrt(Σ(pi - qi)^2 / n)

Where:
  pi = position of crate i in version 1
  qi = position of crate i in version 2
  n  = number of crates

Use Case: Compare architectural changes between versions
```

### 5. Radius of Gyration
```
Rg = sqrt(Σ(mi * ri^2) / Σmi)

Where:
  mi = mass (LOC) of crate i
  ri = distance from center of mass

Use Case: Measure codebase compactness
```

### 6. Contact Map
```
2D heatmap of inter-crate distances
Cell (i,j) color = distance(crate_i, crate_j)

Use Case: Dependency matrix visualization
```

### 7. Ramachandran Plot → Dependency Plot
```
X-axis: Direct dependencies
Y-axis: Indirect dependencies
Points: Each crate
Color: By activity

Use Case: Detect dependency anomalies
```

---

## 🎬 Animation & Trajectory

### 1. Git History Trajectory
```
Frame 1: Commit abc123 (2024-01-01)
Frame 2: Commit def456 (2024-01-02)
...
Frame N: Commit xyz789 (2024-10-24)

Interpolation: Linear or cubic spline
Frame rate: 30 FPS
Duration: 60s (configurable)
```

### 2. Agent Execution Animation
```
Phase 1: Issue Created (highlight Issue node)
Phase 2: Agent Started (pulse effect)
Phase 3: Code Generation (add new atoms)
Phase 4: Review (color change)
Phase 5: PR Created (connection to PR node)
Phase 6: Deploy (fade out)

Total duration: 15-25 minutes (real-time)
Playback: 1000x speed
```

### 3. Molecular Dynamics (MD) Simulation
```
Force Field: Code coupling forces
Time Step: 1 ps = 1 second real time
Temperature: Activity heat
Pressure: External dependencies

Algorithm: Velocity Verlet integration
Output: DCD trajectory file (adapted format)
```

### 4. Morph Animation
```
From: Version 1.0.0 structure
To:   Version 2.0.0 structure

Morph frames: 100
Duration: 10s
Method: RMSD-minimized alignment + linear interpolation
```

---

## 🔬 Advanced Rendering Techniques

### 1. SSAO (Screen Space Ambient Occlusion)
```glsl
// Fragment shader
float ssao = 0.0;
for (int i = 0; i < SAMPLE_COUNT; i++) {
    vec3 sample = randomSample[i];
    float depth = texture(depthTex, uv + sample.xy).r;
    float occlusion = (depth > sample.z) ? 1.0 : 0.0;
    ssao += occlusion;
}
ssao = 1.0 - (ssao / float(SAMPLE_COUNT));
fragColor = vec4(baseColor.rgb * ssao, 1.0);
```

**Effect**: Realistic depth perception for crowded modules

### 2. Volumetric Rendering
```glsl
// Ray marching
vec4 raymarch(vec3 origin, vec3 direction) {
    vec4 color = vec4(0.0);
    float t = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 pos = origin + t * direction;
        float density = sampleDensity(pos);
        vec4 sample = vec4(colorMap(density), density);
        color += sample * (1.0 - color.a);
        t += STEP_SIZE;
    }

    return color;
}
```

**Use Case**: Large project visualization (1000+ crates)

### 3. Depth Peeling (Multi-layer Transparency)
```
Pass 1: Render opaque geometry
Pass 2: Render first transparent layer
Pass 3: Render second transparent layer
...
Pass N: Composite all layers

Result: Correct transparency order
```

**Use Case**: Overlapping module visualization

### 4. Bloom Effect
```glsl
// Bright pass
vec3 bright = max(color.rgb - threshold, 0.0);

// Gaussian blur (multiple passes)
vec3 blurred = gaussianBlur(bright, blurSize);

// Composite
vec3 final = color.rgb + blurred * bloomIntensity;
```

**Effect**: Highlight active agents with glow

### 5. Edge Detection (Outline)
```glsl
// Sobel operator
float edge = sobelFilter(depthTex, uv);
vec3 outline = (edge > threshold) ? outlineColor : vec3(0.0);
fragColor = vec4(baseColor.rgb + outline, 1.0);
```

**Use Case**: Emphasize module boundaries

### 6. Ray Tracing (Offline)
```rust
// Rust implementation
fn render_frame(scene: &Scene) -> Image {
    let mut img = Image::new(1920, 1080);

    for y in 0..1080 {
        for x in 0..1920 {
            let ray = camera.get_ray(x, y);
            let color = trace_ray(ray, scene, 0);
            img.set_pixel(x, y, color);
        }
    }

    img
}
```

**Output**: Publication-quality PNG/SVG for documentation

---

## 🛠️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
│  - Control Panel (HUD)                               │
│  - Selection Tools                                   │
│  - Measurement Tools                                 │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              Visualization Engine                    │
│  - Scene Manager (Three.js)                          │
│  - Representation Manager                            │
│  - Animation Controller                              │
│  - Shader Manager                                    │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│               Data Layer                             │
│  - PDB Parser (adapted for code structure)           │
│  - Trajectory Loader (Git history)                   │
│  - Real-time Data Stream (WebSocket)                 │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│             Backend Services                         │
│  - Structure Generator (Cargo.toml → PDB-like)       │
│  - Activity Tracker (Agent execution logs)           │
│  - Metrics Aggregator                                │
└──────────────────────────────────────────────────────┘
```

---

## 📄 PDB-like Format Specification

### MIYB Format (Miyabi Binary/Text)

```
HEADER    MIYABI PROJECT STRUCTURE                    24-OCT-25   MIYB
TITLE     MIYABI-PRIVATE CODEBASE VISUALIZATION
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: MIYABI AUTONOMOUS FRAMEWORK;
COMPND   3 CHAIN: A, B, C;
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: RUST 2021 EDITION;
KEYWDS    AUTONOMOUS, AGENT, CODING, AI
AUTHOR    MIYABI DEVELOPMENT TEAM
REVDAT   1   24-OCT-25 MIYB    0
REMARK   1 RESOLUTION. NOT APPLICABLE.
REMARK   2 B-FACTORS REPRESENT CODE ACTIVITY (0-100)
REMARK   3 OCCUPANCY REPRESENTS CODE COVERAGE (0-1)
SEQRES   1 A   10  CORE TYPES CLI GITHUB WORKTREE LLM KNOWLEDGE MCP WEB
SEQRES   1 B    7  AGENTS CODEGEN REVIEW COORDINATOR PR DEPLOY REFRESH
SEQRES   1 C    5  BENCHMARK INTEGRATION MODES ORCHESTRATOR WEBHOOK
ATOM      1  CA  COR A   1      10.000  20.000  15.000  0.95 45.20      C
ATOM      2  CA  TYP A   2      12.000  22.000  16.000  0.88 32.10      C
ATOM      3  CA  CLI A   3      14.000  24.000  17.000  0.65 28.50      C
...
CONECT    1    2    5
CONECT    2    1    3    6
CONECT    3    2    4
...
END
```

### Field Definitions

```
ATOM record format:
Columns   Type       Field
 1- 6     String     "ATOM  "
 7-11     Integer    Atom serial number (Crate ID)
13-16     String     Atom name (Crate abbreviation)
18-20     String     Residue name (Module type)
22        Character  Chain identifier
23-26     Integer    Residue sequence number
31-38     Float      X coordinate (architectural position)
39-46     Float      Y coordinate (layer)
47-54     Float      Z coordinate (dependency depth)
55-60     Float      Occupancy (code coverage 0-1)
61-66     Float      Temperature factor (activity 0-100)
77-78     String     Element symbol (file type: RS/TS/MD)
```

---

## 🔌 WebSocket Event Protocol

### Event Types

```typescript
interface MolecularEvent {
  type: 'structure_update' | 'atom_add' | 'atom_modify' |
        'atom_delete' | 'bond_create' | 'bond_break' |
        'trajectory_frame' | 'selection_change';
  timestamp: string;
  data: any;
}

// Example: Atom addition (new crate)
{
  type: 'atom_add',
  timestamp: '2025-10-24T12:34:56Z',
  data: {
    atomId: 11,
    name: 'miyabi-new',
    residue: 'AGT',
    chain: 'B',
    position: [16.0, 26.0, 18.0],
    bfactor: 10.0,
    occupancy: 0.5
  }
}

// Example: Agent execution (activity change)
{
  type: 'atom_modify',
  timestamp: '2025-10-24T12:35:10Z',
  data: {
    atomId: 4,
    bfactor: 95.8,  // High activity
    color: 0xFF0000  // Red
  }
}
```

---

## 🎮 User Interactions

### Selection Language

```
// PyMOL-like selection syntax
select crate miyabi-core                  # Select specific crate
select chain A                            # Select all core modules
select activity > 0.8                     # Select high-activity crates
select type agent                         # Select all agent crates
select dependencies < 3                   # Select low-dependency crates
select within 10 of miyabi-core           # Select nearby crates
select (chain A or chain B) and activity > 0.5

// Boolean operations
select core_or_agents = chain A or chain B
select active_core = chain A and activity > 0.7
```

### Measurement Tools

```
// Distance
dist miyabi-core, miyabi-agents
→ Distance: 15.3 Å (15.3 dependency units)

// Angle
angle miyabi-core, miyabi-types, miyabi-cli
→ Angle: 120.5°

// Center of Mass
centerofmass chain A
→ COM: (12.5, 24.3, 16.8)

// RMSD
align version_1_0_0, version_2_0_0
→ RMSD: 3.42 Å (3.42 structural difference units)
```

---

## 📊 Performance Optimization

### Level of Detail (LOD)

```javascript
const lod = new THREE.LOD();

// High detail (< 50 units)
const highDetail = new THREE.Mesh(
  new THREE.SphereGeometry(2, 32, 32),
  material
);
lod.addLevel(highDetail, 0);

// Medium detail (50-100 units)
const medDetail = new THREE.Mesh(
  new THREE.SphereGeometry(2, 16, 16),
  material
);
lod.addLevel(medDetail, 50);

// Low detail (> 100 units)
const lowDetail = new THREE.Mesh(
  new THREE.SphereGeometry(2, 8, 8),
  material
);
lod.addLevel(lowDetail, 100);
```

### Frustum Culling

```javascript
camera.updateMatrixWorld();
const frustum = new THREE.Frustum();
frustum.setFromProjectionMatrix(
  new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  )
);

atoms.forEach(atom => {
  atom.visible = frustum.intersectsObject(atom);
});
```

### Instanced Rendering

```javascript
// For 1000+ atoms
const geometry = new THREE.SphereGeometry(1, 16, 16);
const material = new THREE.MeshPhongMaterial();
const instancedMesh = new THREE.InstancedMesh(
  geometry,
  material,
  atomCount
);

atoms.forEach((atom, i) => {
  const matrix = new THREE.Matrix4();
  matrix.setPosition(atom.position);
  instancedMesh.setMatrixAt(i, matrix);
  instancedMesh.setColorAt(i, atom.color);
});
```

---

## 🧪 Testing & Validation

### Unit Tests

```rust
#[test]
fn test_pdb_parser() {
    let pdb = parse_miyb_file("test.miyb");
    assert_eq!(pdb.chains.len(), 3);
    assert_eq!(pdb.atoms.len(), 22);
}

#[test]
fn test_rmsd_calculation() {
    let rmsd = calculate_rmsd(&structure1, &structure2);
    assert!(rmsd < 5.0);  // Acceptable structural difference
}
```

### Integration Tests

```typescript
describe('Molecular Visualization', () => {
  it('should render 100 atoms at 60 FPS', async () => {
    const viewer = new MolecularViewer();
    await viewer.loadStructure('miyabi-100.miyb');

    const fps = measureFPS(viewer, 1000);
    expect(fps).toBeGreaterThan(60);
  });
});
```

---

## 📝 Implementation Roadmap

### Phase 1: Core Rendering Engine (2 weeks)
- [x] Three.js scene setup
- [ ] Basic representations (ball-stick, cartoon)
- [ ] PDB parser
- [ ] Camera controls

### Phase 2: Data Integration (1 week)
- [ ] Cargo.toml → MIYB converter
- [ ] WebSocket event stream
- [ ] Real-time data updates

### Phase 3: Advanced Features (2 weeks)
- [ ] All representation types
- [ ] Coloring schemes
- [ ] Measurement tools
- [ ] Selection language

### Phase 4: Animation & Trajectory (1 week)
- [ ] Git history trajectory
- [ ] Agent execution animation
- [ ] MD simulation

### Phase 5: Performance & Polish (1 week)
- [ ] LOD implementation
- [ ] Shader optimization
- [ ] UI refinement

**Total: 7 weeks**

---

## 🔗 References

1. NGL Viewer: Rose, A. S., et al. (2018). Bioinformatics, 34(21), 3755-3758.
2. 3Dmol.js: Rego, N., & Koes, D. (2015). Bioinformatics, 31(8), 1322-1324.
3. Mol*: Sehnal, D., et al. (2021). Nucleic Acids Research, 49(W1), W431-W437.
4. PyMOL: Schrödinger, LLC. The PyMOL Molecular Graphics System.
5. PDB Format: Berman, H. M., et al. (2000). Nucleic Acids Research, 28(1), 235-242.

---

**Author**: Miyabi Development Team
**Last Updated**: 2025-10-24
**Status**: Ready for Implementation
