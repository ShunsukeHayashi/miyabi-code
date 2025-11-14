//! WebSocket module
//!
//! Provides WebSocket management for real-time communication

pub mod backpressure;
pub mod manager;
pub mod message;

pub use backpressure::BackpressureMonitor;
pub use manager::{WebSocketConnection, WebSocketManager};
pub use message::{ExecutionStatus, LogLevel, ServerStatus, WSMessage};
