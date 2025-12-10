//! Repository Layer for Miyabi Society
//! Issue: #970

use crate::entities::{Agent, AgentStatus, Message, MessageType, Session, SessionStatus, Task, TaskPriority, TaskStatus};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct AgentRepository {
    pool: SqlitePool,
}

impl AgentRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, agent: &Agent) -> Result<Uuid, sqlx::Error> {
        sqlx::query(
            "INSERT INTO agents (id, name, agent_type, society, status, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(agent.id.to_string())
        .bind(&agent.name)
        .bind(&agent.agent_type)
        .bind(&agent.society)
        .bind(serde_json::to_string(&agent.status).unwrap_or_default())
        .bind(&agent.config)
        .bind(agent.created_at)
        .bind(agent.updated_at)
        .execute(&self.pool)
        .await?;
        Ok(agent.id)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Agent>, sqlx::Error> {
        let row = sqlx::query_as::<_, (String, String, String, Option<String>, String, String, String, String)>(
            "SELECT id, name, agent_type, society, status, config, created_at, updated_at FROM agents WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| Agent {
            id: Uuid::parse_str(&r.0).unwrap_or_default(),
            name: r.1,
            agent_type: r.2,
            society: r.3,
            status: serde_json::from_str(&r.4).unwrap_or_default(),
            config: serde_json::from_str(&r.5).unwrap_or_default(),
            created_at: r.6.parse().unwrap_or_else(|_| Utc::now()),
            updated_at: r.7.parse().unwrap_or_else(|_| Utc::now()),
        }))
    }

    pub async fn find_by_society(&self, society: &str) -> Result<Vec<Agent>, sqlx::Error> {
        let rows = sqlx::query_as::<_, (String, String, String, Option<String>, String, String, String, String)>(
            "SELECT id, name, agent_type, society, status, config, created_at, updated_at FROM agents WHERE society = ?"
        )
        .bind(society)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| Agent {
            id: Uuid::parse_str(&r.0).unwrap_or_default(),
            name: r.1,
            agent_type: r.2,
            society: r.3,
            status: serde_json::from_str(&r.4).unwrap_or_default(),
            config: serde_json::from_str(&r.5).unwrap_or_default(),
            created_at: r.6.parse().unwrap_or_else(|_| Utc::now()),
            updated_at: r.7.parse().unwrap_or_else(|_| Utc::now()),
        }).collect())
    }

    pub async fn update_status(&self, id: Uuid, status: AgentStatus) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE agents SET status = ?, updated_at = ? WHERE id = ?")
            .bind(serde_json::to_string(&status).unwrap_or_default())
            .bind(Utc::now())
            .bind(id.to_string())
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query("DELETE FROM agents WHERE id = ?")
            .bind(id.to_string())
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

pub struct TaskRepository {
    pool: SqlitePool,
}

impl TaskRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, task: &Task) -> Result<Uuid, sqlx::Error> {
        sqlx::query(
            "INSERT INTO tasks (id, title, description, agent_id, status, priority, issue_number, result, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(task.id.to_string())
        .bind(&task.title)
        .bind(&task.description)
        .bind(task.agent_id.map(|id| id.to_string()))
        .bind(serde_json::to_string(&task.status).unwrap_or_default())
        .bind(serde_json::to_string(&task.priority).unwrap_or_default())
        .bind(task.issue_number)
        .bind(&task.result)
        .bind(task.created_at)
        .bind(task.updated_at)
        .execute(&self.pool)
        .await?;
        Ok(task.id)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Task>, sqlx::Error> {
        let row = sqlx::query_as::<_, (String, String, Option<String>, Option<String>, String, String, Option<i32>, Option<String>, String, String)>(
            "SELECT id, title, description, agent_id, status, priority, issue_number, result, created_at, updated_at FROM tasks WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| Task {
            id: Uuid::parse_str(&r.0).unwrap_or_default(),
            title: r.1,
            description: r.2,
            agent_id: r.3.and_then(|s| Uuid::parse_str(&s).ok()),
            status: serde_json::from_str(&r.4).unwrap_or_default(),
            priority: serde_json::from_str(&r.5).unwrap_or_default(),
            issue_number: r.6,
            result: r.7.and_then(|s| serde_json::from_str(&s).ok()),
            created_at: r.8.parse().unwrap_or_else(|_| Utc::now()),
            updated_at: r.9.parse().unwrap_or_else(|_| Utc::now()),
        }))
    }

    pub async fn find_by_agent(&self, agent_id: Uuid) -> Result<Vec<Task>, sqlx::Error> {
        let rows = sqlx::query_as::<_, (String, String, Option<String>, Option<String>, String, String, Option<i32>, Option<String>, String, String)>(
            "SELECT id, title, description, agent_id, status, priority, issue_number, result, created_at, updated_at FROM tasks WHERE agent_id = ?"
        )
        .bind(agent_id.to_string())
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| Task {
            id: Uuid::parse_str(&r.0).unwrap_or_default(),
            title: r.1,
            description: r.2,
            agent_id: r.3.and_then(|s| Uuid::parse_str(&s).ok()),
            status: serde_json::from_str(&r.4).unwrap_or_default(),
            priority: serde_json::from_str(&r.5).unwrap_or_default(),
            issue_number: r.6,
            result: r.7.and_then(|s| serde_json::from_str(&s).ok()),
            created_at: r.8.parse().unwrap_or_else(|_| Utc::now()),
            updated_at: r.9.parse().unwrap_or_else(|_| Utc::now()),
        }).collect())
    }

    pub async fn update_status(&self, id: Uuid, status: TaskStatus) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?")
            .bind(serde_json::to_string(&status).unwrap_or_default())
            .bind(Utc::now())
            .bind(id.to_string())
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

pub struct SessionRepository {
    pool: SqlitePool,
}

impl SessionRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, session: &Session) -> Result<Uuid, sqlx::Error> {
        sqlx::query(
            "INSERT INTO sessions (id, name, status, agents_count, metadata, started_at, ended_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(session.id.to_string())
        .bind(&session.name)
        .bind(serde_json::to_string(&session.status).unwrap_or_default())
        .bind(session.agents_count)
        .bind(&session.metadata)
        .bind(session.started_at)
        .bind(session.ended_at)
        .execute(&self.pool)
        .await?;
        Ok(session.id)
    }

    pub async fn find_active(&self) -> Result<Vec<Session>, sqlx::Error> {
        let rows = sqlx::query_as::<_, (String, Option<String>, String, i32, String, String, Option<String>)>(
            "SELECT id, name, status, agents_count, metadata, started_at, ended_at FROM sessions WHERE status = 'active'"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| Session {
            id: Uuid::parse_str(&r.0).unwrap_or_default(),
            name: r.1,
            status: serde_json::from_str(&r.2).unwrap_or_default(),
            agents_count: r.3,
            metadata: serde_json::from_str(&r.4).unwrap_or_default(),
            started_at: r.5.parse().unwrap_or_else(|_| Utc::now()),
            ended_at: r.6.and_then(|s| s.parse().ok()),
        }).collect())
    }

    pub async fn end_session(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE sessions SET status = 'completed', ended_at = ? WHERE id = ?")
            .bind(Utc::now())
            .bind(id.to_string())
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

pub struct MessageRepository {
    pool: SqlitePool,
}

impl MessageRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, message: &Message) -> Result<Uuid, sqlx::Error> {
        sqlx::query(
            "INSERT INTO messages (id, session_id, from_agent, to_agent, message_type, content, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(message.id.to_string())
        .bind(message.session_id.map(|id| id.to_string()))
        .bind(message.from_agent.map(|id| id.to_string()))
        .bind(message.to_agent.map(|id| id.to_string()))
        .bind(serde_json::to_string(&message.message_type).unwrap_or_default())
        .bind(&message.content)
        .bind(message.created_at)
        .execute(&self.pool)
        .await?;
        Ok(message.id)
    }

    pub async fn find_by_session(&self, session_id: Uuid) -> Result<Vec<Message>, sqlx::Error> {
        let rows = sqlx::query_as::<_, (String, Option<String>, Option<String>, Option<String>, String, String, String)>(
            "SELECT id, session_id, from_agent, to_agent, message_type, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at"
        )
        .bind(session_id.to_string())
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| Message {
            id: Uuid::parse_str(&r.0).unwrap_or_default(),
            session_id: r.1.and_then(|s| Uuid::parse_str(&s).ok()),
            from_agent: r.2.and_then(|s| Uuid::parse_str(&s).ok()),
            to_agent: r.3.and_then(|s| Uuid::parse_str(&s).ok()),
            message_type: serde_json::from_str(&r.4).unwrap_or(MessageType::Data),
            content: serde_json::from_str(&r.5).unwrap_or_default(),
            created_at: r.6.parse().unwrap_or_else(|_| Utc::now()),
        }).collect())
    }
}
