//! Test fixtures module
//!
//! Provides pre-defined test data for users, tasks, agents, etc.

pub mod agents;
pub mod tasks;
pub mod users;

#[allow(unused_imports)]
pub use agents::AgentFixture;
#[allow(unused_imports)]
pub use tasks::TaskFixture;
#[allow(unused_imports)]
pub use users::UserFixture;
