//! Society Manager - A2A Bridge統合
//! Issue: #970

use crate::repository::{AgentRepository, MessageRepository, SessionRepository, TaskRepository};
use crate::entities::{Agent, Message, MessageType, Session, Task};
use crate::Database;
use chrono::Utc;
use uuid::Uuid;

pub struct SocietyManager {
    pub agents: AgentRepository,
    pub tasks: TaskRepository,
    pub sessions: SessionRepository,
    pub messages: MessageRepository,
}

impl SocietyManager {
    pub async fn new(db: &Database) -> Self {
        let pool = db.pool().clone();
        Self {
            agents: AgentRepository::new(pool.clone()),
            tasks: TaskRepository::new(pool.clone()),
            sessions: SessionRepository::new(pool.clone()),
            messages: MessageRepository::new(pool),
        }
    }

    pub async fn register_agent(&self, name: String, agent_type: String, society: Option<String>) -> Result<Uuid, sqlx::Error> {
        let agent = Agent::new(name, agent_type, society);
        self.agents.create(&agent).await
    }

    pub async fn create_task(&self, title: String, issue_number: Option<i32>) -> Result<Uuid, sqlx::Error> {
        let task = Task::new(title, issue_number);
        self.tasks.create(&task).await
    }

    pub async fn start_session(&self, name: Option<String>) -> Result<Uuid, sqlx::Error> {
        let session = Session {
            id: Uuid::new_v4(),
            name,
            status: crate::entities::SessionStatus::Active,
            agents_count: 0,
            metadata: serde_json::json!({}),
            started_at: Utc::now(),
            ended_at: None,
        };
        self.sessions.create(&session).await
    }

    pub async fn send_message(
        &self,
        session_id: Option<Uuid>,
        from_agent: Option<Uuid>,
        to_agent: Option<Uuid>,
        message_type: MessageType,
        content: serde_json::Value,
    ) -> Result<Uuid, sqlx::Error> {
        let message = Message {
            id: Uuid::new_v4(),
            session_id,
            from_agent,
            to_agent,
            message_type,
            content,
            created_at: Utc::now(),
        };
        self.messages.create(&message).await
    }

    pub async fn get_society_agents(&self, society: &str) -> Result<Vec<Agent>, sqlx::Error> {
        self.agents.find_by_society(society).await
    }

    pub async fn get_active_sessions(&self) -> Result<Vec<Session>, sqlx::Error> {
        self.sessions.find_active().await
    }
}
