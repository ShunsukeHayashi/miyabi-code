//! Crate node and dependency models

use serde::{Deserialize, Serialize};

/// Category of a crate in the workspace
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CrateCategory {
    /// Core infrastructure crates (miyabi-core, miyabi-types)
    Core,
    /// Agent implementation crates (miyabi-agent-*)
    Agent,
    /// Integration crates (miyabi-github, miyabi-llm, etc.)
    Integration,
    /// Infrastructure services (miyabi-mcp-server, miyabi-web-api)
    Infrastructure,
    /// CLI and tooling (miyabi-cli)
    Tool,
    /// Test utilities (miyabi-e2e-tests)
    Test,
    /// Business logic (miyabi-orchestrator)
    Business,
    /// Other/uncategorized
    Other,
}

impl CrateCategory {
    /// Infer category from crate name
    pub fn from_crate_name(name: &str) -> Self {
        if name == "miyabi-core" || name == "miyabi-types" {
            Self::Core
        } else if name.starts_with("miyabi-agent-") || name == "miyabi-agents" {
            Self::Agent
        } else if name == "miyabi-github" || name == "miyabi-llm" || name == "miyabi-knowledge" {
            Self::Integration
        } else if name == "miyabi-mcp-server"
            || name == "miyabi-web-api"
            || name == "miyabi-webhook"
        {
            Self::Infrastructure
        } else if name == "miyabi-cli" {
            Self::Tool
        } else if name.contains("test") {
            Self::Test
        } else if name == "miyabi-orchestrator" {
            Self::Business
        } else {
            Self::Other
        }
    }

    /// Get display color for this category (hex color string)
    pub fn color(&self) -> &'static str {
        match self {
            Self::Core => "#FF6B6B",        // Red
            Self::Agent => "#4ECDC4",       // Cyan
            Self::Integration => "#45B7D1", // Light Blue
            Self::Infrastructure => "#96CEB4", // Green
            Self::Tool => "#FFEAA7",        // Yellow
            Self::Test => "#DFE6E9",        // Gray
            Self::Business => "#A29BFE",    // Purple
            Self::Other => "#636E72",       // Dark Gray
        }
    }
}

/// A node representing a Rust crate in the workspace
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrateNode {
    /// Unique identifier (crate name)
    pub id: String,

    /// Lines of code (LOC)
    pub loc: usize,

    /// B-factor: temperature factor representing code volatility
    /// Range: 0.0 (stable) to 100.0 (highly volatile)
    /// Calculated from: commits_last_30days / total_commits * 100
    pub bfactor: f32,

    /// Occupancy: reliability factor representing test coverage
    /// Range: 0.0 (no tests) to 1.0 (100% coverage)
    pub occupancy: f32,

    /// Category of this crate
    pub category: CrateCategory,

    /// Number of dependencies (outgoing edges)
    pub dependencies_count: usize,

    /// Number of dependents (incoming edges)
    pub dependents_count: usize,
}

impl CrateNode {
    /// Create a new crate node
    pub fn new(id: String, loc: usize, category: CrateCategory) -> Self {
        Self {
            id,
            loc,
            bfactor: 50.0, // Default: medium volatility
            occupancy: 0.5, // Default: 50% coverage
            category,
            dependencies_count: 0,
            dependents_count: 0,
        }
    }

    /// Get color based on B-factor (blue → red gradient)
    pub fn bfactor_color(&self) -> String {
        // Blue (low) → Yellow (medium) → Red (high)
        let ratio = self.bfactor / 100.0;
        if ratio < 0.5 {
            // Blue → Yellow
            let r = (ratio * 2.0 * 255.0) as u8;
            format!("#{:02X}{:02X}00", r, 255)
        } else {
            // Yellow → Red
            let g = ((1.0 - ratio) * 2.0 * 255.0) as u8;
            format!("#FF{:02X}00", g)
        }
    }

    /// Get node size value for 3d-force-graph
    /// Uses log scale to prevent extreme size differences
    pub fn visual_size(&self) -> f32 {
        ((self.loc as f32) / 100.0).log10().max(1.0)
    }
}

/// Type of dependency between crates
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DependencyKind {
    /// Runtime dependency (dependencies)
    Runtime,
    /// Development dependency ([dev-dependencies])
    Dev,
    /// Build dependency ([build-dependencies])
    Build,
}

impl DependencyKind {
    /// Get display color for this dependency type
    pub fn color(&self) -> &'static str {
        match self {
            Self::Runtime => "#FFFFFF",  // White (strong bond)
            Self::Dev => "#888888",      // Gray (weak bond)
            Self::Build => "#FFD700",    // Gold (special bond)
        }
    }

    /// Get line width for visualization
    pub fn width(&self) -> f32 {
        match self {
            Self::Runtime => 1.0,
            Self::Dev => 0.5,
            Self::Build => 2.0, // Thicker for important build deps
        }
    }
}

/// A dependency edge between two crates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dependency {
    /// Source crate (depends on target)
    pub source: String,

    /// Target crate (depended upon by source)
    pub target: String,

    /// Type of dependency
    pub kind: DependencyKind,
}

impl Dependency {
    /// Create a new dependency
    pub fn new(source: String, target: String, kind: DependencyKind) -> Self {
        Self {
            source,
            target,
            kind,
        }
    }
}
