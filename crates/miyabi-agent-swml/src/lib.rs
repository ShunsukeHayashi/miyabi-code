//! SWML (Shunsuke's World Model Logic) Agent
//!
//! This crate implements the SWML framework as described in the academic paper:
//! "Shunsuke's World Model Logic: A Mathematical Foundation for Autonomous Development Systems"
//!
//! # Key Components
//!
//! - **Ω Function**: Universal execution function with 6-phase decomposition
//! - **Convergence Guarantees**: Geometric convergence with rate (1-α)^n
//! - **Step-back Integration**: 26-step process algebra (A-Z)
//! - **SELF-DISCOVER**: Meta-reasoning framework integration
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_agent_swml::{SWMLAgent, Intent, World};
//!
//! # async fn example() -> anyhow::Result<()> {
//! let agent = SWMLAgent::new().await?;
//! let intent = Intent::from_issue("Fix bug #123");
//! let world = World::current()?;
//!
//! let result = agent.execute(intent, world).await?;
//! println!("Quality: {}", result.quality());
//! # Ok(())
//! # }
//! ```

pub mod agent;
pub mod convergence;
pub mod omega;
pub mod spaces;
pub mod step_back;

pub use agent::SWMLAgent;
pub use convergence::ConvergenceTracker;
pub use omega::{OmegaFunction, PhaseResult};
pub use spaces::{Intent, Result as SWMLResult, World};
pub use step_back::StepBackProcessor;

/// SWML version matching the paper
pub const SWML_VERSION: &str = "1.0.0";

/// Default convergence threshold (ε)
pub const DEFAULT_EPSILON: f64 = 0.01;

/// Default learning rate (α)
pub const DEFAULT_ALPHA: f64 = 0.20;

/// Target quality threshold (Q*)
pub const DEFAULT_Q_STAR: f64 = 0.80;
