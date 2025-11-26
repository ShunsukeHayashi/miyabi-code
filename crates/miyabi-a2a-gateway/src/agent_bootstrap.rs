//! Agent Bootstrap - Auto-registration of A2AEnabled agents with the gateway
//!
//! This module provides automatic discovery and registration of all Miyabi agents
//! that implement the A2AEnabled trait.

use crate::{types::AgentCard, A2AGateway, Result};
use miyabi_agent_core::a2a_integration::{A2AAgentCard, A2AEnabled};
use tracing::info;

/// Convert A2AAgentCard to gateway's AgentCard format
pub fn convert_agent_card(a2a_card: &A2AAgentCard) -> AgentCard {
    AgentCard {
        name: a2a_card.name.clone(),
        description: a2a_card.description.clone(),
        version: a2a_card.version.clone(),
        protocol_version: a2a_card.protocol_version.clone(),
        url: format!("a2a://miyabi/{}", a2a_card.agent_id),
        capabilities: crate::types::AgentCapabilities {
            streaming: true,
            push_notifications: false,
            state_transition_history: true,
        },
        skills: a2a_card
            .capabilities
            .iter()
            .map(|cap| crate::types::Skill {
                id: cap.id.clone(),
                name: cap.name.clone(),
                description: cap.description.clone(),
                input_modes: a2a_card.input_modes.clone(),
                output_modes: a2a_card.output_modes.clone(),
            })
            .collect(),
        default_input_modes: a2a_card.input_modes.clone(),
        default_output_modes: a2a_card.output_modes.clone(),
        authentication: None,
    }
}

/// Register a single A2AEnabled agent with the gateway
pub async fn register_agent<A: A2AEnabled>(gateway: &A2AGateway, agent: &A) -> Result<()> {
    let a2a_card = agent.agent_card();
    let gateway_card = convert_agent_card(&a2a_card);
    let agent_id = gateway.register_agent(gateway_card).await?;
    info!("Registered agent: {} (ID: {})", a2a_card.name, agent_id.0);
    Ok(())
}

/// Agent registry for holding instantiated agents
pub struct AgentRegistry {
    /// Registered agent instances (boxed for dynamic dispatch)
    agents: Vec<Box<dyn A2AEnabled + Send + Sync>>,
}

impl AgentRegistry {
    /// Create a new empty registry
    pub fn new() -> Self {
        Self { agents: vec![] }
    }

    /// Add an agent to the registry
    pub fn add<A: A2AEnabled + Send + Sync + 'static>(&mut self, agent: A) {
        self.agents.push(Box::new(agent));
    }

    /// Get all registered agents
    pub fn agents(&self) -> &[Box<dyn A2AEnabled + Send + Sync>] {
        &self.agents
    }

    /// Register all agents with the gateway
    pub async fn register_all(&self, gateway: &A2AGateway) -> Result<()> {
        for agent in &self.agents {
            let a2a_card = agent.agent_card();
            let gateway_card = convert_agent_card(&a2a_card);
            let agent_id = gateway.register_agent(gateway_card).await?;
            info!("Registered agent: {} (ID: {})", a2a_card.name, agent_id.0);
        }
        Ok(())
    }

    /// Get agent count
    pub fn count(&self) -> usize {
        self.agents.len()
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_registry_creation() {
        let registry = AgentRegistry::new();
        assert_eq!(registry.count(), 0);
    }
}
