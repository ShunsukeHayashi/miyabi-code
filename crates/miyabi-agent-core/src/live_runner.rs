//! Live Agent Runner
//!
//! Connects Claude Agent SDK to actual tmux execution for real agent orchestration.

use std::collections::HashMap;
use std::process::Command;
use std::time::{Duration, Instant};
use uuid::Uuid;

/// Live agent runner that executes agents in tmux
pub struct LiveAgentRunner {
    session_name: String,
    agents: HashMap<Uuid, LiveAgent>,
    next_pane: usize,
}

/// Live agent instance
#[derive(Debug, Clone)]
pub struct LiveAgent {
    pub id: Uuid,
    pub agent_type: String,
    pub instance_name: String,
    pub pane_id: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub status: LiveAgentStatus,
}

/// Live agent status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LiveAgentStatus {
    Starting,
    Running,
    Completed,
    Failed,
}

impl LiveAgentRunner {
    /// Create new runner with session name
    pub fn new(session_name: &str) -> Self {
        Self {
            session_name: session_name.to_string(),
            agents: HashMap::new(),
            next_pane: 0,
        }
    }

    /// Initialize tmux session
    pub fn init_session(&self) -> Result<(), String> {
        // Check if session exists
        let check = Command::new("tmux")
            .args(["has-session", "-t", &self.session_name])
            .output()
            .map_err(|e| e.to_string())?;

        if !check.status.success() {
            // Create new session
            Command::new("tmux")
                .args(["new-session", "-d", "-s", &self.session_name])
                .output()
                .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    /// Spawn an agent in a tmux pane
    pub fn spawn_agent(&mut self, agent_type: &str, instance_name: &str, task: &str) -> Result<Uuid, String> {
        let agent_id = Uuid::new_v4();
        let pane_id = format!("{}:{}", self.session_name, self.next_pane);

        // Create new pane if not first
        if self.next_pane > 0 {
            Command::new("tmux")
                .args(["split-window", "-t", &self.session_name, "-h"])
                .output()
                .map_err(|e| e.to_string())?;

            // Balance panes
            Command::new("tmux")
                .args(["select-layout", "-t", &self.session_name, "tiled"])
                .output()
                .map_err(|e| e.to_string())?;
        }

        // Send agent initialization command
        let init_cmd = format!(
            "echo '🤖 Agent: {} ({})'; echo 'ID: {}'; echo 'Task: {}'; echo '---'",
            instance_name, agent_type, agent_id, task
        );

        Command::new("tmux")
            .args(["send-keys", "-t", &pane_id, &init_cmd, "Enter"])
            .output()
            .map_err(|e| e.to_string())?;

        let agent = LiveAgent {
            id: agent_id,
            agent_type: agent_type.to_string(),
            instance_name: instance_name.to_string(),
            pane_id: pane_id.clone(),
            started_at: chrono::Utc::now(),
            status: LiveAgentStatus::Running,
        };

        self.agents.insert(agent_id, agent);
        self.next_pane += 1;

        Ok(agent_id)
    }

    /// Execute command on agent
    pub fn execute(&self, agent_id: Uuid, command: &str) -> Result<(), String> {
        let agent = self.agents.get(&agent_id)
            .ok_or_else(|| "Agent not found".to_string())?;

        Command::new("tmux")
            .args(["send-keys", "-t", &agent.pane_id, command, "Enter"])
            .output()
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    /// Get agent output
    pub fn get_output(&self, agent_id: Uuid, lines: usize) -> Result<String, String> {
        let agent = self.agents.get(&agent_id)
            .ok_or_else(|| "Agent not found".to_string())?;

        let output = Command::new("tmux")
            .args(["capture-pane", "-t", &agent.pane_id, "-p", "-S", &format!("-{}", lines)])
            .output()
            .map_err(|e| e.to_string())?;

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    /// Broadcast to all agents
    pub fn broadcast(&self, message: &str) -> Result<(), String> {
        for agent in self.agents.values() {
            if agent.status == LiveAgentStatus::Running {
                let cmd = format!("echo '[BROADCAST] {}'", message);
                Command::new("tmux")
                    .args(["send-keys", "-t", &agent.pane_id, &cmd, "Enter"])
                    .output()
                    .map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    /// List all agents
    pub fn list_agents(&self) -> Vec<&LiveAgent> {
        self.agents.values().collect()
    }

    /// Stop agent
    pub fn stop_agent(&mut self, agent_id: Uuid) -> Result<(), String> {
        if let Some(agent) = self.agents.get_mut(&agent_id) {
            Command::new("tmux")
                .args(["send-keys", "-t", &agent.pane_id, "C-c"])
                .output()
                .map_err(|e| e.to_string())?;
            agent.status = LiveAgentStatus::Completed;
        }
        Ok(())
    }

    /// Shutdown all agents
    pub fn shutdown(&mut self) -> Result<(), String> {
        for agent in self.agents.values_mut() {
            agent.status = LiveAgentStatus::Completed;
        }

        // Kill session
        Command::new("tmux")
            .args(["kill-session", "-t", &self.session_name])
            .output()
            .ok();

        self.agents.clear();
        Ok(())
    }

    /// Spawn development workflow (7 agents)
    pub fn spawn_dev_workflow(&mut self, project: &str) -> Result<Vec<Uuid>, String> {
        self.init_session()?;

        let agents = vec![
            ("coordinator", "指揮官", "Orchestrate development workflow"),
            ("codegen", "作ろーん", "Generate and modify code"),
            ("review", "目玉マン", "Review code quality"),
            ("issue", "見つけろーん", "Track and manage issues"),
            ("pr", "まとめろーん", "Manage pull requests"),
            ("deploy", "運ぼーん", "Handle deployments"),
            ("refresher", "繋軍", "Sync state across agents"),
        ];

        let mut ids = Vec::new();
        for (agent_type, name, task) in agents {
            let instance_name = format!("{}-{}", project, name);
            let full_task = format!("{} for {}", task, project);
            let id = self.spawn_agent(agent_type, &instance_name, &full_task)?;
            ids.push(id);
        }

        Ok(ids)
    }

    /// Spawn business workflow (14 agents)
    pub fn spawn_business_workflow(&mut self, project: &str) -> Result<Vec<Uuid>, String> {
        self.init_session()?;

        let agents = vec![
            ("ai_entrepreneur", "AI起業家", "Strategic planning"),
            ("self_analysis", "自己分析", "Analyze strengths"),
            ("market_research", "市場調査", "Research market"),
            ("persona", "ペルソナ", "Design personas"),
            ("product_concept", "商品コンセプト", "Develop concepts"),
            ("product_design", "商品設計", "Design products"),
            ("content_creation", "コンテンツ", "Create content"),
            ("funnel_design", "ファネル", "Design funnels"),
            ("sns_strategy", "SNS戦略", "Plan SNS strategy"),
            ("marketing", "マーケティング", "Execute marketing"),
            ("sales", "セールス", "Manage sales"),
            ("crm", "CRM", "Customer relations"),
            ("analytics", "アナリティクス", "Analyze data"),
            ("youtube", "YouTube", "Manage YouTube"),
        ];

        let mut ids = Vec::new();
        for (agent_type, name, task) in agents {
            let instance_name = format!("{}-{}", project, name);
            let full_task = format!("{} for {}", task, project);
            let id = self.spawn_agent(agent_type, &instance_name, &full_task)?;
            ids.push(id);
        }

        Ok(ids)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_runner_creation() {
        let runner = LiveAgentRunner::new("test-session");
        assert_eq!(runner.session_name, "test-session");
        assert!(runner.agents.is_empty());
    }

    #[test]
    fn test_agent_status() {
        assert_eq!(LiveAgentStatus::Running, LiveAgentStatus::Running);
        assert_ne!(LiveAgentStatus::Running, LiveAgentStatus::Completed);
    }
}
