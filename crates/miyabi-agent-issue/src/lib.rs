//! Issue Analysis Agent
//!
//! Analyzes GitHub Issues to estimate complexity, suggest labels,
//! and provide implementation guidance.

mod agent;
mod analysis;

pub use agent::IssueAgent;
pub use analysis::{detect_issue_from_tool_response, ComplexityLevel, IssueAnalysis};
