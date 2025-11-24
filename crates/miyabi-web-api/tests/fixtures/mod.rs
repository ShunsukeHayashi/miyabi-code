//! Test fixtures module
//!
//! Provides pre-defined test data for users, tasks, agents, etc.

pub mod users;
pub mod tasks;
pub mod agents;

#[allow(unused_imports)]
pub use users::UserFixture;
#[allow(unused_imports)]
pub use tasks::TaskFixture;
#[allow(unused_imports)]
pub use agents::AgentFixture;
