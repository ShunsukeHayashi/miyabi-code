//! Miyabi Molecular Visualization System
//!
//! A 3D interactive visualization system that represents the Miyabi codebase
//! as a molecular structure, inspired by protein structure visualization tools.
//!
//! ## Core Metaphor
//!
//! - **Crate** → Residue (amino acid)
//! - **Dependency** → Bond (peptide/hydrogen/disulfide)
//! - **Commit Frequency** → B-factor (temperature factor)
//! - **Test Coverage** → Occupancy
//! - **Active Agent** → Active site (glow effect)
//!
//! ## Usage
//!
//! ```no_run
//! use miyabi_viz::analyzer::MiyabiAnalyzer;
//!
//! let analyzer = MiyabiAnalyzer::new(".")?;
//! let graph = analyzer.analyze()?;
//! let json = graph.to_json()?;
//! # Ok::<(), anyhow::Error>(())
//! ```

pub mod analyzer;
pub mod exporter;
pub mod models;

pub use analyzer::MiyabiAnalyzer;
pub use models::{CrateCategory, CrateNode, Dependency, DependencyKind, MiyabiGraph};

/// Result type for this crate
pub type Result<T> = anyhow::Result<T>;
