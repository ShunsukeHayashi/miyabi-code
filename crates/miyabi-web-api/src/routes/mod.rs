pub mod activity;
pub mod agents;
pub mod approval;
pub mod auth;
pub mod codegen;
pub mod dashboard;
pub mod database;
pub mod deployments;
pub mod health;
pub mod infrastructure;
pub mod issues;
pub mod logs;
pub mod logs_stream;
pub mod mcp;
pub mod mission_control;
pub mod organizations;
pub mod preflight;
pub mod prs;
pub mod repositories;
pub mod system;
pub mod tasks;
pub mod telegram;
pub mod timeline;
pub mod tmux;
pub mod websocket;
pub mod workflows;
pub mod worktrees;

// Note: api_routes() removed - routes are directly configured in lib.rs create_app()
// The tasks and organizations routes require AppState and are handled there
