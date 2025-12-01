//! Composite State Manager

use crate::error::Result;
use miyabi_types::CompositeServiceState;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Composite State Manager
///
/// Manages unified state across all Miyabi systems with optimistic locking.
#[derive(Debug, Clone)]
pub struct CompositeStateManager {
    state: Arc<RwLock<CompositeServiceState>>,
}

impl CompositeStateManager {
    /// Create new Composite State Manager
    pub fn new() -> Self {
        Self { state: Arc::new(RwLock::new(CompositeServiceState::default())) }
    }

    /// Get current state
    pub async fn get_state(&self) -> CompositeServiceState {
        self.state.read().await.clone()
    }

    /// Sync all state sources
    pub async fn sync_all(&self) -> Result<()> {
        // To be implemented in Phase 2
        Ok(())
    }
}

impl Default for CompositeStateManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_new_manager() {
        let manager = CompositeStateManager::new();
        let state = manager.get_state().await;
        assert_eq!(state.version, 0);
    }
}
