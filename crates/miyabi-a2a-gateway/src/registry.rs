//! Agent Registry - manages registered agents and their capabilities

use crate::{error::Error, types::*, Result};
use chrono::Utc;
use std::collections::HashMap;
use tokio::sync::RwLock;

/// Agent Registry
pub struct AgentRegistry {
    agents: RwLock<HashMap<AgentId, RegisteredAgent>>,
    name_index: RwLock<HashMap<String, AgentId>>,
}

impl AgentRegistry {
    /// Create a new registry
    pub fn new() -> Self {
        Self { agents: RwLock::new(HashMap::new()), name_index: RwLock::new(HashMap::new()) }
    }

    /// Register a new agent
    pub async fn register(&self, card: AgentCard) -> Result<AgentId> {
        let id = AgentId::from_name(&card.name);
        let agent = RegisteredAgent {
            id: id.clone(),
            card: card.clone(),
            status: AgentStatus::Active,
            last_heartbeat: Utc::now(),
            endpoint: format!("a2a://gateway/{}", id.0),
        };

        self.agents.write().await.insert(id.clone(), agent);
        self.name_index.write().await.insert(card.name, id.clone());

        Ok(id)
    }

    /// Get agent by name
    pub async fn get_by_name(&self, name: &str) -> Result<AgentId> {
        self.name_index
            .read()
            .await
            .get(name)
            .cloned()
            .ok_or_else(|| Error::AgentNotFound(AgentId::from_name(name)))
    }

    /// Get agent card
    pub async fn get_card(&self, id: &AgentId) -> Result<AgentCard> {
        self.agents
            .read()
            .await
            .get(id)
            .map(|a| a.card.clone())
            .ok_or_else(|| Error::AgentNotFound(id.clone()))
    }

    /// Validate that both agents exist
    pub async fn validate_agents(&self, from: &AgentId, to: &AgentId) -> Result<()> {
        let agents = self.agents.read().await;
        if !agents.contains_key(from) {
            return Err(Error::AgentNotFound(from.clone()));
        }
        if !agents.contains_key(to) {
            return Err(Error::AgentNotFound(to.clone()));
        }
        Ok(())
    }

    /// Discover agents by skill
    pub async fn discover_by_skill(&self, skill_id: &str) -> Vec<AgentId> {
        self.agents
            .read()
            .await
            .values()
            .filter(|a| a.card.skills.iter().any(|s| s.id == skill_id))
            .map(|a| a.id.clone())
            .collect()
    }

    /// Get all registered agents
    pub async fn get_all(&self) -> Vec<RegisteredAgent> {
        self.agents.read().await.values().cloned().collect()
    }

    /// Update agent status
    pub async fn update_status(&self, id: &AgentId, status: AgentStatus) -> Result<()> {
        if let Some(agent) = self.agents.write().await.get_mut(id) {
            agent.status = status;
            agent.last_heartbeat = Utc::now();
            Ok(())
        } else {
            Err(Error::AgentNotFound(id.clone()))
        }
    }

    /// Update heartbeat
    pub async fn heartbeat(&self, id: &AgentId) -> Result<()> {
        if let Some(agent) = self.agents.write().await.get_mut(id) {
            agent.last_heartbeat = Utc::now();
            Ok(())
        } else {
            Err(Error::AgentNotFound(id.clone()))
        }
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}
