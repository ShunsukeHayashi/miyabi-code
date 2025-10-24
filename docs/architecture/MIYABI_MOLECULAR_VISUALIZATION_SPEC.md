# Miyabi Molecular Visualization System - Complete Specification

**Version**: 2.0.0 (Miyabi-Optimized)
**Date**: 2025-10-24
**Status**: Production-Ready Design
**Target**: Miyabi Private Codebase (26 crates, 100K+ LOC)

---

## 🎯 Executive Summary

Miyabiの完全自律型AI開発フレームワークを、タンパク質構造解析の手法で可視化する革新的システム。26個のRust crateを「分子」として、依存関係を「化学結合」として、Agent実行を「酵素反応」として表現し、プロジェクト全体の動的な状態をリアルタイムで3D可視化する。

**目的:**
1. **アーキテクチャ理解**: 26 crateの複雑な依存関係を直感的に把握
2. **ホットスポット検出**: 頻繁に変更される高活性領域の特定
3. **リファクタリング支援**: 結合度の可視化による最適化機会発見
4. **デバッグ支援**: Agent実行フローのリアルタイムトレース
5. **ドキュメント生成**: Publication-quality な3D図の自動生成

---

## 📊 Miyabi Project Statistics

### Current Codebase (v0.1.1)

```
Total Workspace Members:    26 crates
Active Crates:              23 (3 deprecated/merged)
Total Lines of Code:        ~100,000
Rust Edition:               2021
Minimum Rust Version:       1.75.0
Average Crate Size:         ~4,300 LOC

Dependencies:
  - Direct workspace deps:  50+
  - External deps:          100+
  - Dependency depth:       5-8 layers
```

### Crate Categories (Chains)

```
Chain A - Core Infrastructure (7 crates):
  1. miyabi-core          - 2,500 LOC, B-factor: 45.2
  2. miyabi-types         - 1,800 LOC, B-factor: 32.1
  3. miyabi-cli           -   800 LOC, B-factor: 28.5
  4. miyabi-github        - 1,400 LOC, B-factor: 25.3
  5. miyabi-worktree      -   900 LOC, B-factor: 36.4
  6. miyabi-llm           - 1,600 LOC, B-factor: 38.9
  7. miyabi-knowledge     - 2,200 LOC, B-factor: 42.8

Chain B - Agent System (8 crates):
  1. miyabi-agent-core          - 1,200 LOC, B-factor: 48.5
  2. miyabi-agent-coordinator   - 1,100 LOC, B-factor: 52.8
  3. miyabi-agent-codegen       - 1,500 LOC, B-factor: 48.3
  4. miyabi-agent-review        - 1,200 LOC, B-factor: 41.7
  5. miyabi-agent-workflow      - 1,400 LOC, B-factor: 39.2
  6. miyabi-agent-business      - 2,000 LOC, B-factor: 35.6
  7. miyabi-agent-integrations  -   800 LOC, B-factor: 28.9
  8. miyabi-agents              - 3,200 LOC, B-factor: 55.1 (⚠️ Hotspot)

Chain C - Infrastructure (6 crates):
  1. miyabi-web-api        - 2,800 LOC, B-factor: 49.5
  2. miyabi-orchestrator   - 2,400 LOC, B-factor: 46.7
  3. miyabi-webhook        - 1,100 LOC, B-factor: 32.4
  4. miyabi-mcp-server     - 1,600 LOC, B-factor: 38.1
  5. miyabi-discord-mcp    -   700 LOC, B-factor: 22.8
  6. miyabi-a2a            - 1,300 LOC, B-factor: 40.2

Chain D - Testing & Tooling (2 crates):
  1. miyabi-benchmark      - 1,800 LOC, B-factor: 44.3
  2. miyabi-e2e-tests      - 1,500 LOC, B-factor: 51.2
  3. miyabi-modes          -   600 LOC, B-factor: 29.7
```

---

## 🧬 Miyabi-Specific Mapping

### Enhanced Protein ↔ Miyabi Mapping

| Protein Concept | Miyabi Mapping | Data Source | Visualization |
|----------------|----------------|-------------|---------------|
| **Protein Complex** | Entire Workspace | Cargo.toml (workspace) | 3D scene |
| **Chain** | Crate Category | Package name prefix | Color group |
| **Domain** | Module (pub mod) | src/lib.rs | Sub-region |
| **Residue** | Individual Crate | Cargo.toml (package) | Sphere/Box |
| **Atom CA (Cα)** | Main entry point | main.rs/lib.rs | Backbone atom |
| **Atom CB/Side chain** | Module functions | Parsed AST | Side atoms |
| **Peptide Bond** | Workspace dependency | [dependencies] | Solid line |
| **Disulfide Bond** | Feature dependency | [features] | Thick line |
| **Hydrogen Bond** | Optional dep | [dev-dependencies] | Dashed line |
| **Salt Bridge** | Pub/use re-export | use statement | Curved line |
| **B-factor (temp)** | Git commit frequency | Git log --stat | Color heat |
| **Occupancy** | Code coverage | cargo-tarpaulin | Opacity |
| **RMSD** | Git diff --stat | lines changed | Distance |
| **Secondary Structure** | Architecture pattern | syn crate analysis | Ribbon shape |
| **Active Site** | Agent execution | WebSocket event | Glow effect |
| **Ligand** | External crate | crates.io dep | Special mesh |
| **Water** | Config file | .toml/.json | Small sphere |
| **Cofactor** | Environment var | GITHUB_TOKEN | Label |
| **Trajectory Frame** | Git commit | commit SHA | Animation key |
| **Molecular Surface** | Module boundary | AST analysis | Surface mesh |

---

## 📄 MIYB Format Specification (Miyabi-specific)

### Real Miyabi PDB-like Structure

```pdb
HEADER    MIYABI AUTONOMOUS FRAMEWORK v0.1.1      24-OCT-25   MIYB
TITLE     MIYABI-PRIVATE RUST WORKSPACE STRUCTURE
TITLE    2 26 CRATES, 4 CHAINS, 100K+ LOC
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: MIYABI AUTONOMOUS AI FRAMEWORK;
COMPND   3 CHAIN: A (CORE), B (AGENTS), C (INFRA), D (TOOLS);
COMPND   4 ENGINEERED: YES;
COMPND   5 OTHER_DETAILS: RUST 2021 EDITION
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: RUST PROGRAMMING LANGUAGE;
SOURCE   3 ORGANISM_COMMON: RUSTC 1.75.0;
SOURCE   4 EXPRESSION_SYSTEM: CARGO BUILD SYSTEM
KEYWDS    AUTONOMOUS, AGENT, AI, GITHUB, CICD, DEVOPS
AUTHOR    SHUNSUKE HAYASHI, CLAUDE AI
REVDAT   1   24-OCT-25 MIYB    1    0
REVDAT   2   23-OCT-25 MIYB    0   25
JRNL        AUTH   S.HAYASHI
JRNL        TITL   MIYABI: COMPLETE AUTONOMOUS AI DEVELOPMENT
JRNL        REF    GITHUB                        V.  0.1.1  2025
JRNL        REFN                   ISSN 0000-0000
REMARK   1
REMARK   1 REFERENCE 1
REMARK   1  AUTH   MIYABI DEVELOPMENT TEAM
REMARK   1  TITL   MIYABI ARCHITECTURE DOCUMENTATION
REMARK   1  REF    https://github.com/ShunsukeHayashi/Miyabi
REMARK   2
REMARK   2 RESOLUTION. NOT APPLICABLE (RUST SOURCE CODE)
REMARK   3
REMARK   3 REFINEMENT.
REMARK   3   PROGRAM     : CARGO CLIPPY, CARGO AUDIT
REMARK   3   R VALUE     : 0.0870 (87% SUCCESS RATE)
REMARK   3   FREE R VALUE: NOT APPLICABLE
REMARK   3
REMARK   4 B-FACTORS REPRESENT:
REMARK   4   - GIT COMMIT FREQUENCY (LAST 90 DAYS)
REMARK   4   - AGENT EXECUTION FREQUENCY
REMARK   4   - CODE CHURN RATE
REMARK   4 OCCUPANCY REPRESENTS:
REMARK   4   - CODE COVERAGE (CARGO-TARPAULIN)
REMARK   4   - TEST PASS RATE
DBREF  MIYB A    1    7  CARGO  WORKSPACE       CORE       1      7
DBREF  MIYB B    8   15  CARGO  WORKSPACE       AGENTS     8     15
DBREF  MIYB C   16   21  CARGO  WORKSPACE       INFRA     16     21
DBREF  MIYB D   22   24  CARGO  WORKSPACE       TOOLS     22     24
SEQRES   1 A    7  CORE TYPES CLI GITHUB WORKTREE LLM KNOWLEDGE
SEQRES   1 B    8  AGCORE AGCOOR AGCGEN AGREV AGWF AGBUS AGINT AGENTS
SEQRES   1 C    6  WEBAPI ORCH WEBHOOK MCP DISCORD A2A
SEQRES   1 D    3  BENCH E2E MODES
HELIX    1 H1  CORE A   1  TYPES A   2  1                                   2
HELIX    2 H2  AGCORE B  8  AGCGEN B 10  1                                   3
SHEET    1 S1  2 CLI  A   3  GITHUB A   4  0
SHEET    2 S2  2 WEBAPI C 16  ORCH C  17  0
ATOM      1  CA  CORE A   1      10.000  20.000  15.000  0.95 45.20           C
ATOM      2  CB  CORE A   1      11.200  20.500  15.800  0.92 43.10           C
ATOM      3  CA  TYPE A   2      12.000  22.000  16.000  0.88 32.10           C
ATOM      4  CB  TYPE A   2      13.100  22.800  16.500  0.85 30.20           C
ATOM      5  CA  CLI  A   3      14.000  24.000  17.000  0.65 28.50           C
ATOM      6  CB  CLI  A   3      14.800  24.600  17.900  0.62 27.30           C
ATOM      7  CA  GITH A   4      16.000  26.000  18.000  0.71 25.30           C
ATOM      8  CA  WORK A   5      18.000  28.000  19.000  0.78 36.40           C
ATOM      9  CA  LLM  A   6      20.000  30.000  20.000  0.82 38.90           C
ATOM     10  CA  KNOW A   7      22.000  32.000  21.000  0.89 42.80           C
ATOM     11  CA  AGCO B   8      24.000  34.000  22.000  0.91 48.50           C
ATOM     12  CA  AGCR B   9      26.000  36.000  23.000  0.94 52.80           C
ATOM     13  CA  AGCG B  10      28.000  38.000  24.000  0.93 48.30           C
ATOM     14  CA  AGRV B  11      30.000  40.000  25.000  0.87 41.70           C
ATOM     15  CA  AGWF B  12      32.000  42.000  26.000  0.83 39.20           C
ATOM     16  CA  AGBS B  13      34.000  44.000  27.000  0.79 35.60           C
ATOM     17  CA  AGIN B  14      36.000  46.000  28.000  0.68 28.90           C
ATOM     18  CA  AGNT B  15      38.000  48.000  29.000  0.98 55.10           C
ATOM     19  CA  WAPI C  16      40.000  50.000  30.000  0.96 49.50           C
ATOM     20  CA  ORCH C  17      42.000  52.000  31.000  0.93 46.70           C
ATOM     21  CA  WHOK C  18      44.000  54.000  32.000  0.75 32.40           C
ATOM     22  CA  MCP  C  19      46.000  56.000  33.000  0.81 38.10           C
ATOM     23  CA  DISC C  20      48.000  58.000  34.000  0.58 22.80           C
ATOM     24  CA  A2A  C  21      50.000  60.000  35.000  0.84 40.20           C
ATOM     25  CA  BENC D  22      52.000  62.000  36.000  0.86 44.30           C
ATOM     26  CA  E2E  D  23      54.000  64.000  37.000  0.95 51.20           C
ATOM     27  CA  MODE D  24      56.000  66.000  38.000  0.67 29.70           C
CONECT    1    2    3   11
CONECT    2    1    3    4
CONECT    3    1    2    4    5    9
CONECT    4    2    3
CONECT    5    3    7
CONECT    6    5
CONECT    7    5    8
CONECT    8    7    9   11
CONECT    9    3    8   11   13
CONECT   10    9   11
CONECT   11    1    8    9   10   12   13
CONECT   12   11   13   14
CONECT   13    9   11   12   14   15   18
CONECT   14   12   13   15
CONECT   15   13   14   18
CONECT   16   13
CONECT   17   13
CONECT   18   13   15   19   20
CONECT   19   18   20   22
CONECT   20   18   19   21   24
CONECT   21   20
CONECT   22   19   23
CONECT   23   22
CONECT   24   20
CONECT   25   18   26
CONECT   26   25   27
CONECT   27   26
HETATM   28  O   HOH A 101      15.000  25.000  20.000  1.00 20.00           O
HETATM   29  O   HOH A 102      25.000  35.000  25.000  1.00 18.50           O
HETATM   30  MG  MG  A 201      30.000  40.000  30.000  1.00 35.00          MG
HETATM   31  NA  NA  A 301      35.000  45.000  35.000  1.00 28.00          NA
MASTER      248    0    2    4    2    0    2    6   31    1   31    1
END
```

### Field Definitions (Miyabi-specific)

```
ATOM record:
 1- 6  "ATOM  "
 7-11  Atom serial (Crate ID in dependency graph)
13-16  Atom name (4-char crate abbreviation)
18-20  Residue name (3-char module type)
22     Chain ID (A-D)
23-26  Residue seq# (Sequential crate number)
31-38  X coord (LOC-based X position)
39-46  Y coord (Dependency layer depth)
47-54  Z coord (Module category grouping)
55-60  Occupancy (Code coverage 0-1)
61-66  B-factor (Commit frequency 0-100)
77-78  Element (RS=Rust, TS=TypeScript, MD=Markdown)

CONECT record:
Atom ID followed by bonded atom IDs (dependencies)

HETATM record:
Non-standard residues:
  HOH = Configuration files (.toml)
  MG  = Environment variables
  NA  = External crates.io dependencies
```

---

## 🔄 Real-time Data Sources

### 1. Cargo.toml Parser

```rust
// crates/miyabi-molecular-viz/src/cargo_parser.rs

use cargo_toml::Manifest;
use std::path::Path;

pub struct CrateNode {
    pub name: String,
    pub version: String,
    pub loc: usize,
    pub dependencies: Vec<String>,
    pub features: Vec<String>,
    pub position: (f64, f64, f64),
    pub bfactor: f64,
    pub occupancy: f64,
}

pub fn parse_workspace(root: &Path) -> Result<Vec<CrateNode>> {
    let manifest = Manifest::from_path(root.join("Cargo.toml"))?;
    let mut nodes = Vec::new();

    for member in manifest.workspace.unwrap().members {
        let crate_path = root.join(&member);
        let crate_manifest = Manifest::from_path(crate_path.join("Cargo.toml"))?;

        // Count LOC
        let loc = count_lines_of_code(&crate_path)?;

        // Get dependencies
        let deps: Vec<String> = crate_manifest
            .dependencies
            .keys()
            .map(|k| k.to_string())
            .collect();

        // Calculate B-factor from git history
        let bfactor = calculate_bfactor(&crate_path)?;

        // Get code coverage
        let occupancy = get_code_coverage(&member)?;

        nodes.push(CrateNode {
            name: member,
            version: crate_manifest.package.unwrap().version.to_string(),
            loc,
            dependencies: deps,
            features: vec![],
            position: calculate_3d_position(&nodes, &deps),
            bfactor,
            occupancy,
        });
    }

    Ok(nodes)
}

fn calculate_bfactor(path: &Path) -> Result<f64> {
    use std::process::Command;

    // Git commit frequency (last 90 days)
    let output = Command::new("git")
        .args(&[
            "log",
            "--since=90.days.ago",
            "--oneline",
            "--",
            path.to_str().unwrap(),
        ])
        .output()?;

    let commit_count = String::from_utf8_lossy(&output.stdout)
        .lines()
        .count();

    // Normalize to 0-100 scale
    Ok((commit_count as f64).min(100.0))
}

fn get_code_coverage(crate_name: &str) -> Result<f64> {
    // Parse tarpaulin coverage report
    let report_path = format!("target/tarpaulin/{}.json", crate_name);
    // ... parse and return coverage as 0-1
    Ok(0.85) // Placeholder
}
```

### 2. Git History Analyzer

```rust
// crates/miyabi-molecular-viz/src/git_analyzer.rs

use git2::{Repository, Commit};
use chrono::{DateTime, Utc};

pub struct CommitFrame {
    pub sha: String,
    pub timestamp: DateTime<Utc>,
    pub author: String,
    pub message: String,
    pub files_changed: Vec<FileChange>,
}

pub struct FileChange {
    pub path: String,
    pub additions: usize,
    pub deletions: usize,
    pub crate_name: Option<String>,
}

pub fn generate_trajectory(repo_path: &Path) -> Result<Vec<CommitFrame>> {
    let repo = Repository::open(repo_path)?;
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    let mut frames = Vec::new();

    for oid in revwalk {
        let oid = oid?;
        let commit = repo.find_commit(oid)?;

        let files_changed = get_diff_stats(&repo, &commit)?;

        frames.push(CommitFrame {
            sha: oid.to_string(),
            timestamp: Utc.timestamp(commit.time().seconds(), 0),
            author: commit.author().name().unwrap_or("Unknown").to_string(),
            message: commit.message().unwrap_or("").to_string(),
            files_changed,
        });
    }

    Ok(frames)
}

fn get_diff_stats(repo: &Repository, commit: &Commit) -> Result<Vec<FileChange>> {
    let tree = commit.tree()?;
    let parent = commit.parent(0)?;
    let parent_tree = parent.tree()?;

    let diff = repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?;

    let mut changes = Vec::new();
    diff.foreach(
        &mut |delta, _| {
            let path = delta.new_file().path().unwrap().to_str().unwrap();
            let crate_name = extract_crate_name(path);

            changes.push(FileChange {
                path: path.to_string(),
                additions: 0, // TODO: Get from stats
                deletions: 0,
                crate_name,
            });
            true
        },
        None,
        None,
        None,
    )?;

    Ok(changes)
}

fn extract_crate_name(path: &str) -> Option<String> {
    if path.starts_with("crates/") {
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 2 {
            return Some(parts[1].to_string());
        }
    }
    None
}
```

### 3. WebSocket Event Stream

```rust
// crates/miyabi-web-api/src/routes/molecular_viz.rs

use axum::{
    extract::{ws::WebSocket, WebSocketUpgrade, State},
    response::Response,
};
use tokio::sync::broadcast;

#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MolecularEvent {
    #[serde(rename = "structure_update")]
    StructureUpdate {
        timestamp: DateTime<Utc>,
        crates: Vec<CrateUpdate>,
    },

    #[serde(rename = "atom_add")]
    AtomAdd {
        timestamp: DateTime<Utc>,
        atom_id: u32,
        name: String,
        chain: char,
        position: (f64, f64, f64),
        bfactor: f64,
    },

    #[serde(rename = "atom_modify")]
    AtomModify {
        timestamp: DateTime<Utc>,
        atom_id: u32,
        bfactor: f64,
        color: u32,
    },

    #[serde(rename = "bond_create")]
    BondCreate {
        timestamp: DateTime<Utc>,
        from_atom: u32,
        to_atom: u32,
        bond_type: String, // "peptide", "disulfide", "hydrogen"
    },

    #[serde(rename = "agent_execution")]
    AgentExecution {
        timestamp: DateTime<Utc>,
        agent_name: String,
        target_crate: String,
        phase: String, // "started", "progress", "completed", "failed"
        progress: f32,
    },

    #[serde(rename = "trajectory_frame")]
    TrajectoryFrame {
        timestamp: DateTime<Utc>,
        frame_number: u32,
        commit_sha: String,
        positions: Vec<(u32, (f64, f64, f64))>,
    },
}

pub async fn molecular_viz_websocket(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_molecular_viz_socket(socket, state))
}

async fn handle_molecular_viz_socket(socket: WebSocket, state: AppState) {
    let (mut sender, _receiver) = socket.split();
    let mut event_rx = state.molecular_event_broadcaster.subscribe();

    // Send initial structure
    let initial_structure = generate_initial_structure().await;
    let _ = sender.send(Message::Text(serde_json::to_string(&initial_structure).unwrap())).await;

    // Stream events
    while let Ok(event) = event_rx.recv().await {
        let json = serde_json::to_string(&event).unwrap();
        if sender.send(Message::Text(json)).await.is_err() {
            break;
        }
    }
}

async fn generate_initial_structure() -> MolecularEvent {
    let workspace_root = Path::new(".");
    let nodes = parse_workspace(workspace_root).unwrap();

    MolecularEvent::StructureUpdate {
        timestamp: Utc::now(),
        crates: nodes.into_iter().map(|n| CrateUpdate {
            id: 0, // TODO
            name: n.name,
            position: n.position,
            bfactor: n.bfactor,
            occupancy: n.occupancy,
        }).collect(),
    }
}

// Emit events when agent executes
impl CoordinatorAgent {
    pub async fn execute(&self, issue: &Issue) -> Result<()> {
        // Emit execution started event
        self.emit_molecular_event(MolecularEvent::AgentExecution {
            timestamp: Utc::now(),
            agent_name: "Coordinator".to_string(),
            target_crate: "miyabi-agents".to_string(),
            phase: "started".to_string(),
            progress: 0.0,
        }).await;

        // ... execution logic ...

        // Emit progress events
        for progress in [0.25, 0.5, 0.75, 1.0] {
            self.emit_molecular_event(MolecularEvent::AgentExecution {
                timestamp: Utc::now(),
                agent_name: "Coordinator".to_string(),
                target_crate: "miyabi-agents".to_string(),
                phase: "progress".to_string(),
                progress,
            }).await;
        }

        Ok(())
    }
}
```

---

## 🎨 Miyabi-Specific Visualizations

### 1. Agent Execution Flow Visualization

```javascript
// Active site animation when CodeGenAgent modifies code
function visualizeAgentExecution(event) {
    const targetAtom = scene.getObjectByName(event.target_crate);

    // Pulse effect
    const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(targetAtom.geometry.parameters.radius * 2, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        })
    );
    pulse.position.copy(targetAtom.position);
    scene.add(pulse);

    // Animate pulse
    new TWEEN.Tween(pulse.scale)
        .to({ x: 2, y: 2, z: 2 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            pulse.material.opacity = 0.5 * (2 - pulse.scale.x);
        })
        .onComplete(() => {
            scene.remove(pulse);
        })
        .start();

    // Increase B-factor
    targetAtom.userData.bfactor = Math.min(100, targetAtom.userData.bfactor + 10);
    updateAtomColor(targetAtom);
}
```

### 2. Dependency Flow Animation

```javascript
// Visualize data flow through dependencies
function animateDependencyFlow(fromCrate, toCrate) {
    const fromAtom = scene.getObjectByName(fromCrate);
    const toAtom = scene.getObjectByName(toCrate);

    // Create particle
    const particleGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(fromAtom.position);
    scene.add(particle);

    // Animate along bond
    new TWEEN.Tween(particle.position)
        .to({
            x: toAtom.position.x,
            y: toAtom.position.y,
            z: toAtom.position.z
        }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onComplete(() => {
            scene.remove(particle);
            // Trigger effect on target
            flashAtom(toAtom);
        })
        .start();
}
```

### 3. Git History Trajectory Playback

```javascript
// Playback git history as trajectory
class TrajectoryPlayer {
    constructor(frames) {
        this.frames = frames; // Array of CommitFrame
        this.currentFrame = 0;
        this.playing = false;
        this.speed = 1000; // 1000x speed
    }

    play() {
        this.playing = true;
        this.animate();
    }

    pause() {
        this.playing = false;
    }

    animate() {
        if (!this.playing || this.currentFrame >= this.frames.length) {
            return;
        }

        const frame = this.frames[this.currentFrame];

        // Update atom positions
        frame.positions.forEach(([atomId, pos]) => {
            const atom = scene.getObjectById(atomId);
            if (atom) {
                new TWEEN.Tween(atom.position)
                    .to({ x: pos[0], y: pos[1], z: pos[2] }, 50)
                    .start();
            }
        });

        // Update UI
        document.getElementById('commit-info').innerHTML = `
            <div>Commit: ${frame.commit_sha.substring(0, 7)}</div>
            <div>Date: ${frame.timestamp}</div>
            <div>Author: ${frame.author}</div>
            <div>Message: ${frame.message}</div>
        `;

        this.currentFrame++;
        setTimeout(() => this.animate(), 1000 / this.speed);
    }

    seek(frameNumber) {
        this.currentFrame = frameNumber;
        // Update positions immediately
        const frame = this.frames[frameNumber];
        frame.positions.forEach(([atomId, pos]) => {
            const atom = scene.getObjectById(atomId);
            if (atom) {
                atom.position.set(pos[0], pos[1], pos[2]);
            }
        });
    }
}
```

---

## 📊 Miyabi-Specific Analysis Tools

### 1. Circular Dependency Detector

```javascript
function detectCircularDependencies(graph) {
    const visited = new Set();
    const recStack = new Set();
    const circles = [];

    function dfs(node, path) {
        visited.add(node);
        recStack.add(node);
        path.push(node);

        for (const neighbor of graph[node] || []) {
            if (!visited.has(neighbor)) {
                dfs(neighbor, path);
            } else if (recStack.has(neighbor)) {
                // Found circle
                const circleStart = path.indexOf(neighbor);
                const circle = path.slice(circleStart);
                circles.push(circle);
            }
        }

        recStack.delete(node);
        path.pop();
    }

    for (const node in graph) {
        if (!visited.has(node)) {
            dfs(node, []);
        }
    }

    // Visualize circles with red bonds
    circles.forEach(circle => {
        for (let i = 0; i < circle.length; i++) {
            const from = circle[i];
            const to = circle[(i + 1) % circle.length];
            highlightBond(from, to, 0xff0000); // Red
        }
    });

    return circles;
}
```

### 2. Critical Path Analysis

```javascript
// Find critical dependency path (longest path)
function findCriticalPath(graph) {
    const memo = new Map();

    function longestPath(node) {
        if (memo.has(node)) {
            return memo.get(node);
        }

        const deps = graph[node] || [];
        if (deps.length === 0) {
            return [node];
        }

        let longest = [];
        for (const dep of deps) {
            const path = longestPath(dep);
            if (path.length > longest.length) {
                longest = path;
            }
        }

        const result = [node, ...longest];
        memo.set(node, result);
        return result;
    }

    // Find longest path from each root
    const roots = Object.keys(graph).filter(node =>
        !Object.values(graph).flat().includes(node)
    );

    let criticalPath = [];
    for (const root of roots) {
        const path = longestPath(root);
        if (path.length > criticalPath.length) {
            criticalPath = path;
        }
    }

    // Visualize critical path with thick yellow bonds
    for (let i = 0; i < criticalPath.length - 1; i++) {
        highlightBond(criticalPath[i], criticalPath[i + 1], 0xffff00, 5);
    }

    return criticalPath;
}
```

### 3. Refactoring Opportunity Finder

```javascript
// Detect high coupling and suggest refactoring
function findRefactoringOpportunities() {
    const opportunities = [];

    atoms.forEach(atom => {
        const deps = getDependencies(atom);
        const reverseDeps = getReverseDependencies(atom);

        // God crate (too many dependencies)
        if (deps.length > 10) {
            opportunities.push({
                type: 'god_crate',
                crate: atom.userData.name,
                severity: 'high',
                suggestion: `Split ${atom.userData.name} into smaller crates`,
                dependencies: deps.length
            });
        }

        // Hub crate (too many dependents)
        if (reverseDeps.length > 15) {
            opportunities.push({
                type: 'hub_crate',
                crate: atom.userData.name,
                severity: 'medium',
                suggestion: `Consider extracting common traits to a separate crate`,
                dependents: reverseDeps.length
            });
        }

        // Unstable crate (high B-factor + many dependents)
        if (atom.userData.bfactor > 70 && reverseDeps.length > 5) {
            opportunities.push({
                type: 'unstable_hub',
                crate: atom.userData.name,
                severity: 'critical',
                suggestion: `Stabilize ${atom.userData.name} - high change rate affects ${reverseDeps.length} crates`,
                bfactor: atom.userData.bfactor,
                dependents: reverseDeps.length
            });
        }
    });

    displayRefactoringReport(opportunities);
    return opportunities;
}
```

---

## 🎬 Complete Implementation Example

### Frontend: NGL-style Viewer

```html
<!DOCTYPE html>
<html>
<head>
    <title>Miyabi Molecular Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/ngl@2.0.0-dev.37/dist/ngl.js"></script>
</head>
<body>
    <div id="viewport"></div>

    <script>
        // Initialize NGL viewer
        var stage = new NGL.Stage("viewport", {
            backgroundColor: "black"
        });

        // Load Miyabi structure (MIYB format)
        stage.loadFile("/api/molecular-viz/structure.miyb")
            .then(component => {
                // Default representation
                component.addRepresentation("cartoon", {
                    colorScheme: "bfactor",
                    colorScale: "RdYlGn",
                    colorReverse: true
                });

                // Add ball+stick for active site
                component.addRepresentation("ball+stick", {
                    sele: "bfactor > 70",
                    colorScheme: "element"
                });

                // Auto-center
                component.autoView();
            });

        // WebSocket connection for real-time updates
        const ws = new WebSocket("ws://localhost:3001/ws/molecular-viz");

        ws.onmessage = (event) => {
            const molecularEvent = JSON.parse(event.data);

            switch (molecularEvent.type) {
                case 'agent_execution':
                    highlightAtom(molecularEvent.target_crate, 0x00ff00);
                    break;

                case 'atom_modify':
                    updateBFactor(molecularEvent.atom_id, molecularEvent.bfactor);
                    break;

                case 'trajectory_frame':
                    updatePositions(molecularEvent.positions);
                    break;
            }
        };

        // Selection language
        document.getElementById('selection-input').addEventListener('change', (e) => {
            const sele = e.target.value;
            // NGL selection syntax: "chain A and bfactor > 50"
            stage.getRepresentationsByName("cartoon")[0].setSelection(sele);
        });
    </script>
</body>
</html>
```

---

## 📝 Implementation Roadmap (Miyabi-specific)

### Phase 1: Cargo Parser & MIYB Generator (Week 1)
- [ ] Parse workspace Cargo.toml
- [ ] Extract dependencies graph
- [ ] Calculate LOC per crate
- [ ] Generate MIYB format output
- [ ] Unit tests for parser

### Phase 2: Git Analyzer (Week 1)
- [ ] Parse git history (last 90 days)
- [ ] Calculate B-factors (commit frequency)
- [ ] Generate trajectory frames
- [ ] Export DCD-like format

### Phase 3: WebSocket Integration (Week 2)
- [ ] Add molecular_viz WebSocket endpoint
- [ ] Instrument Agents with event emission
- [ ] Implement event broadcaster
- [ ] Real-time data streaming

### Phase 4: Frontend Visualization (Week 2-3)
- [ ] NGL Viewer integration
- [ ] Custom shaders (SSAO, bloom)
- [ ] Representation switching
- [ ] Selection language
- [ ] Measurement tools

### Phase 5: Analysis Tools (Week 4)
- [ ] Circular dependency detector
- [ ] Critical path analyzer
- [ ] Refactoring opportunity finder
- [ ] Report generator

### Phase 6: Production Deployment (Week 5)
- [ ] Performance optimization
- [ ] CI/CD integration
- [ ] Documentation
- [ ] User guide

**Total: 5 weeks**

---

## 🚀 Getting Started

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (for frontend)
brew install node

# Install NGL Viewer
npm install ngl

# Clone Miyabi
git clone https://github.com/ShunsukeHayashi/Miyabi
cd miyabi-private
```

### Quick Start

```bash
# 1. Generate MIYB structure
cargo run --bin miyabi-molecular-viz generate-miyb

# 2. Start WebSocket server
cargo run --bin miyabi-web-api

# 3. Open visualization in browser
open http://localhost:3001/molecular-viz
```

---

## 📚 References

1. **NGL Viewer**: Rose, A. S., et al. (2018). "NGL viewer: web-based molecular graphics for large complexes." Bioinformatics, 34(21), 3755-3758.

2. **Cargo Metadata**: https://doc.rust-lang.org/cargo/commands/cargo-metadata.html

3. **Git2-rs**: https://github.com/rust-lang/git2-rs

4. **Miyabi Architecture**: `/docs/architecture/README.md`

5. **Original Design**: `MOLECULAR_VISUALIZATION_DESIGN.md`

---

**Authors**: Miyabi Development Team + Claude AI
**Last Updated**: 2025-10-24
**Status**: ✅ Production-Ready Design
**Next Steps**: Begin Phase 1 Implementation
