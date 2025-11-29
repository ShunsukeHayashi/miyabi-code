# A2A Unified Communication Architecture

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Status**: Implementation Guide

---

## Overview

全てのMiyabiエージェント間通信はA2Aプロトコルを使用し、確実なコミュニケーションを保証します。

### 設計原則

1. **A2A First** - 全てのAgent間通信はA2Aプロトコル経由
2. **Agent Card Discovery** - 各Agentは自身のCapabilityを公開
3. **Task-Based Communication** - 全ての通信はTask単位
4. **Guaranteed Delivery** - 確実な配信と応答確認
5. **Audit Trail** - 全通信の記録と追跡

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    A2A Gateway (Central Hub)                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│  │   Router    │   Registry  │   Queue     │   Monitor   │  │
│  └─────────────┴─────────────┴─────────────┴─────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ A2A Protocol
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Coding Agents │     │Business Agents│     │External Agents│
│  (7 agents)   │     │  (14 agents)  │     │  (CrewAI etc) │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Communication Flow

```
Agent A                 A2A Gateway                 Agent B
   │                         │                         │
   │ 1. SendTask             │                         │
   │ ───────────────────────>│                         │
   │                         │ 2. Route & Queue        │
   │                         │ ───────────────────────>│
   │                         │                         │
   │                         │ 3. Acknowledge          │
   │ <───────────────────────│                         │
   │                         │                         │
   │                         │ 4. Execute              │
   │                         │ <───────────────────────│
   │                         │                         │
   │ 5. Result/Artifact      │                         │
   │ <───────────────────────│                         │
   │                         │                         │
   │ 6. Confirm Receipt      │                         │
   │ ───────────────────────>│                         │
```

---

## A2A Gateway Implementation

### Core Components

```rust
// crates/miyabi-a2a-gateway/src/lib.rs

pub struct A2AGateway {
    /// Agent registry
    registry: AgentRegistry,
    /// Message router
    router: MessageRouter,
    /// Task queue
    queue: TaskQueue,
    /// Communication monitor
    monitor: CommunicationMonitor,
}

impl A2AGateway {
    /// Register an agent with its Agent Card
    pub async fn register_agent(&self, card: AgentCard) -> Result<AgentId, Error> {
        self.registry.register(card).await
    }

    /// Send task from one agent to another
    pub async fn send_task(&self, from: AgentId, to: AgentId, task: Task) -> Result<TaskId, Error> {
        // 1. Validate sender and receiver
        self.registry.validate_agents(from, to)?;

        // 2. Check receiver capability
        let receiver_card = self.registry.get_card(to)?;
        self.validate_capability(&task, &receiver_card)?;

        // 3. Queue task
        let task_id = self.queue.enqueue(task).await?;

        // 4. Route to receiver
        self.router.route(to, task_id).await?;

        // 5. Log communication
        self.monitor.log_send(from, to, task_id).await;

        Ok(task_id)
    }

    /// Broadcast task to multiple agents
    pub async fn broadcast(&self, from: AgentId, targets: Vec<AgentId>, task: Task) -> Result<Vec<TaskId>, Error> {
        let mut task_ids = Vec::new();
        for target in targets {
            let task_id = self.send_task(from, target, task.clone()).await?;
            task_ids.push(task_id);
        }
        Ok(task_ids)
    }

    /// Get task status
    pub async fn get_task_status(&self, task_id: TaskId) -> Result<TaskStatus, Error> {
        self.queue.get_status(task_id).await
    }
}
```

### Agent Registry

```rust
// crates/miyabi-a2a-gateway/src/registry.rs

pub struct AgentRegistry {
    agents: RwLock<HashMap<AgentId, RegisteredAgent>>,
}

pub struct RegisteredAgent {
    pub id: AgentId,
    pub card: AgentCard,
    pub status: AgentStatus,
    pub last_heartbeat: DateTime<Utc>,
    pub endpoint: String,
}

impl AgentRegistry {
    /// Register new agent
    pub async fn register(&self, card: AgentCard) -> Result<AgentId, Error> {
        let id = AgentId::new();
        let agent = RegisteredAgent {
            id: id.clone(),
            card,
            status: AgentStatus::Active,
            last_heartbeat: Utc::now(),
            endpoint: format!("a2a://gateway/{}", id),
        };
        self.agents.write().await.insert(id.clone(), agent);
        Ok(id)
    }

    /// Discover agents by skill
    pub async fn discover_by_skill(&self, skill_id: &str) -> Vec<AgentId> {
        self.agents.read().await
            .values()
            .filter(|a| a.card.skills.iter().any(|s| s.id == skill_id))
            .map(|a| a.id.clone())
            .collect()
    }

    /// Get agent card
    pub async fn get_card(&self, id: AgentId) -> Result<AgentCard, Error> {
        self.agents.read().await
            .get(&id)
            .map(|a| a.card.clone())
            .ok_or(Error::AgentNotFound(id))
    }
}
```

### Message Router

```rust
// crates/miyabi-a2a-gateway/src/router.rs

pub struct MessageRouter {
    /// Delivery confirmations
    confirmations: RwLock<HashMap<TaskId, DeliveryStatus>>,
}

pub enum DeliveryStatus {
    Pending,
    Delivered,
    Acknowledged,
    Failed(String),
}

impl MessageRouter {
    /// Route task to target agent
    pub async fn route(&self, target: AgentId, task_id: TaskId) -> Result<(), Error> {
        // Set pending status
        self.confirmations.write().await.insert(task_id.clone(), DeliveryStatus::Pending);

        // Attempt delivery with retry
        for attempt in 1..=3 {
            match self.deliver(target.clone(), task_id.clone()).await {
                Ok(_) => {
                    self.confirmations.write().await.insert(task_id, DeliveryStatus::Delivered);
                    return Ok(());
                }
                Err(e) if attempt < 3 => {
                    tokio::time::sleep(Duration::from_secs(attempt * 2)).await;
                    continue;
                }
                Err(e) => {
                    self.confirmations.write().await.insert(task_id, DeliveryStatus::Failed(e.to_string()));
                    return Err(e);
                }
            }
        }
        Ok(())
    }

    /// Wait for acknowledgment
    pub async fn wait_for_ack(&self, task_id: TaskId, timeout: Duration) -> Result<(), Error> {
        let start = Instant::now();
        loop {
            if start.elapsed() > timeout {
                return Err(Error::AcknowledgmentTimeout);
            }

            if let Some(status) = self.confirmations.read().await.get(&task_id) {
                match status {
                    DeliveryStatus::Acknowledged => return Ok(()),
                    DeliveryStatus::Failed(e) => return Err(Error::DeliveryFailed(e.clone())),
                    _ => {}
                }
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}
```

### Task Queue

```rust
// crates/miyabi-a2a-gateway/src/queue.rs

pub struct TaskQueue {
    /// In-memory queue (can be replaced with Redis/PostgreSQL)
    tasks: RwLock<HashMap<TaskId, QueuedTask>>,
    /// Priority queue
    priority_queue: RwLock<BinaryHeap<PrioritizedTask>>,
}

pub struct QueuedTask {
    pub id: TaskId,
    pub task: Task,
    pub from: AgentId,
    pub to: AgentId,
    pub status: TaskStatus,
    pub created_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl TaskQueue {
    /// Enqueue task
    pub async fn enqueue(&self, task: Task) -> Result<TaskId, Error> {
        let id = TaskId::new();
        let queued = QueuedTask {
            id: id.clone(),
            task: task.clone(),
            from: task.from.clone(),
            to: task.to.clone(),
            status: TaskStatus::Pending,
            created_at: Utc::now(),
            processed_at: None,
            completed_at: None,
        };

        self.tasks.write().await.insert(id.clone(), queued);
        self.priority_queue.write().await.push(PrioritizedTask {
            id: id.clone(),
            priority: task.priority,
        });

        Ok(id)
    }

    /// Dequeue next task for agent
    pub async fn dequeue(&self, agent_id: AgentId) -> Option<QueuedTask> {
        let mut queue = self.priority_queue.write().await;
        let mut tasks = self.tasks.write().await;

        while let Some(prioritized) = queue.pop() {
            if let Some(task) = tasks.get_mut(&prioritized.id) {
                if task.to == agent_id && task.status == TaskStatus::Pending {
                    task.status = TaskStatus::InProgress;
                    task.processed_at = Some(Utc::now());
                    return Some(task.clone());
                }
            }
        }
        None
    }

    /// Complete task
    pub async fn complete(&self, id: TaskId, result: TaskResult) -> Result<(), Error> {
        if let Some(task) = self.tasks.write().await.get_mut(&id) {
            task.status = match result {
                TaskResult::Success(_) => TaskStatus::Completed,
                TaskResult::Failure(_) => TaskStatus::Failed,
            };
            task.completed_at = Some(Utc::now());
        }
        Ok(())
    }
}
```

---

## Agent Card Definitions

### All 21 Miyabi Agents

```rust
// crates/miyabi-a2a-gateway/src/cards/mod.rs

/// Generate Agent Cards for all Miyabi agents
pub fn get_all_agent_cards() -> Vec<AgentCard> {
    vec![
        // Coding Agents (7)
        coordinator_agent_card(),
        codegen_agent_card(),
        review_agent_card(),
        pr_agent_card(),
        issue_agent_card(),
        deployment_agent_card(),
        batch_issue_agent_card(),

        // Business Agents (14)
        self_analysis_agent_card(),
        market_research_agent_card(),
        persona_agent_card(),
        product_concept_agent_card(),
        product_design_agent_card(),
        content_creation_agent_card(),
        funnel_design_agent_card(),
        sns_strategy_agent_card(),
        marketing_agent_card(),
        sales_agent_card(),
        crm_agent_card(),
        analytics_agent_card(),
        ai_entrepreneur_agent_card(),
        youtube_agent_card(),
    ]
}

// Example: Coordinator Agent Card
fn coordinator_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-coordinator".to_string(),
        description: "Task coordination and DAG-based orchestration".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        capabilities: AgentCapabilities {
            streaming: true,
            push_notifications: true,
            state_transition_history: true,
        },
        skills: vec![
            Skill {
                id: "task_coordination".to_string(),
                name: "Task Coordination".to_string(),
                description: "Coordinate and distribute tasks across multiple agents".to_string(),
                input_modes: vec!["text/plain".to_string(), "application/json".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
            Skill {
                id: "dag_orchestration".to_string(),
                name: "DAG Orchestration".to_string(),
                description: "Execute tasks based on dependency graph".to_string(),
                input_modes: vec!["application/json".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
            Skill {
                id: "agent_discovery".to_string(),
                name: "Agent Discovery".to_string(),
                description: "Discover and select appropriate agents for tasks".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
        ],
        default_input_modes: vec!["text/plain".to_string()],
        default_output_modes: vec!["application/json".to_string()],
    }
}

// Example: CodeGen Agent Card
fn codegen_agent_card() -> AgentCard {
    AgentCard {
        name: "miyabi-codegen".to_string(),
        description: "AI-driven code generation with Claude Sonnet 4".to_string(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        capabilities: AgentCapabilities {
            streaming: true,
            push_notifications: false,
            state_transition_history: true,
        },
        skills: vec![
            Skill {
                id: "code_generation".to_string(),
                name: "Code Generation".to_string(),
                description: "Generate code from specifications".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["text/plain".to_string(), "application/json".to_string()],
            },
            Skill {
                id: "code_refactoring".to_string(),
                name: "Code Refactoring".to_string(),
                description: "Refactor and improve existing code".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["text/plain".to_string()],
            },
        ],
        ..Default::default()
    }
}
```

---

## Inter-Agent Communication Patterns

### 1. Request-Response

```rust
// Simple request-response between two agents
let task = Task {
    id: TaskId::new(),
    from: coordinator_id,
    to: codegen_id,
    message: Message {
        role: "user".to_string(),
        parts: vec![Part::Text("Generate user authentication module".to_string())],
    },
    priority: Priority::High,
    timeout: Duration::from_secs(300),
};

let task_id = gateway.send_task(coordinator_id, codegen_id, task).await?;
let result = gateway.wait_for_result(task_id, Duration::from_secs(300)).await?;
```

### 2. Fan-Out (Broadcast)

```rust
// Coordinator broadcasts to multiple agents
let agents = vec![codegen_id, review_id, deployment_id];
let task_ids = gateway.broadcast(coordinator_id, agents, task).await?;

// Wait for all results
let results = gateway.wait_for_all(task_ids, Duration::from_secs(600)).await?;
```

### 3. Pipeline (Chain)

```rust
// Sequential processing through multiple agents
let pipeline = Pipeline::new()
    .add_stage(codegen_id, "Generate code")
    .add_stage(review_id, "Review code")
    .add_stage(pr_id, "Create PR");

let result = gateway.execute_pipeline(coordinator_id, pipeline, initial_task).await?;
```

### 4. Scatter-Gather

```rust
// Send to multiple, gather results
let task_ids = gateway.scatter(
    coordinator_id,
    vec![
        (market_research_id, market_task),
        (persona_id, persona_task),
        (product_concept_id, concept_task),
    ],
).await?;

let results = gateway.gather(task_ids, Duration::from_secs(600)).await?;
let consolidated = consolidate_results(results);
```

---

## Guaranteed Delivery

### Delivery Guarantees

```rust
pub enum DeliveryGuarantee {
    /// At most once - fire and forget
    AtMostOnce,
    /// At least once - retry until ack
    AtLeastOnce,
    /// Exactly once - deduplicate
    ExactlyOnce,
}

impl A2AGateway {
    pub async fn send_with_guarantee(
        &self,
        from: AgentId,
        to: AgentId,
        task: Task,
        guarantee: DeliveryGuarantee,
    ) -> Result<TaskId, Error> {
        match guarantee {
            DeliveryGuarantee::AtMostOnce => {
                self.send_task(from, to, task).await
            }
            DeliveryGuarantee::AtLeastOnce => {
                let task_id = self.send_task(from, to, task).await?;
                self.router.wait_for_ack(task_id.clone(), Duration::from_secs(30)).await?;
                Ok(task_id)
            }
            DeliveryGuarantee::ExactlyOnce => {
                let idempotency_key = task.idempotency_key.clone();
                if self.is_duplicate(&idempotency_key).await {
                    return Err(Error::DuplicateTask);
                }
                let task_id = self.send_task(from, to, task).await?;
                self.router.wait_for_ack(task_id.clone(), Duration::from_secs(30)).await?;
                self.mark_processed(&idempotency_key).await;
                Ok(task_id)
            }
        }
    }
}
```

### Retry Policy

```rust
pub struct RetryPolicy {
    pub max_attempts: u32,
    pub initial_delay: Duration,
    pub max_delay: Duration,
    pub multiplier: f64,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            initial_delay: Duration::from_secs(1),
            max_delay: Duration::from_secs(30),
            multiplier: 2.0,
        }
    }
}
```

---

## Communication Monitor

### Audit Trail

```rust
// crates/miyabi-a2a-gateway/src/monitor.rs

pub struct CommunicationMonitor {
    /// All communication records
    records: RwLock<Vec<CommunicationRecord>>,
}

pub struct CommunicationRecord {
    pub id: RecordId,
    pub from: AgentId,
    pub to: AgentId,
    pub task_id: TaskId,
    pub event: CommunicationEvent,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

pub enum CommunicationEvent {
    TaskSent,
    TaskReceived,
    TaskAcknowledged,
    TaskCompleted,
    TaskFailed,
    DeliveryRetry { attempt: u32 },
}

impl CommunicationMonitor {
    /// Log communication event
    pub async fn log(&self, record: CommunicationRecord) {
        self.records.write().await.push(record);
    }

    /// Get communication history between agents
    pub async fn get_history(
        &self,
        from: Option<AgentId>,
        to: Option<AgentId>,
        since: Option<DateTime<Utc>>,
    ) -> Vec<CommunicationRecord> {
        self.records.read().await
            .iter()
            .filter(|r| {
                from.as_ref().map_or(true, |f| &r.from == f) &&
                to.as_ref().map_or(true, |t| &r.to == t) &&
                since.map_or(true, |s| r.timestamp >= s)
            })
            .cloned()
            .collect()
    }

    /// Get metrics
    pub async fn get_metrics(&self) -> CommunicationMetrics {
        let records = self.records.read().await;
        CommunicationMetrics {
            total_tasks: records.len(),
            successful: records.iter().filter(|r| matches!(r.event, CommunicationEvent::TaskCompleted)).count(),
            failed: records.iter().filter(|r| matches!(r.event, CommunicationEvent::TaskFailed)).count(),
            avg_latency: self.calculate_avg_latency(&records),
        }
    }
}
```

---

## Integration with Existing Agents

### Agent Base Trait

```rust
// crates/miyabi-agent-core/src/a2a_integration.rs

/// All agents must implement this trait for A2A communication
pub trait A2AEnabled: Agent {
    /// Get the agent's A2A card
    fn agent_card(&self) -> AgentCard;

    /// Handle incoming A2A task
    async fn handle_a2a_task(&self, task: Task) -> Result<TaskResult, Error>;

    /// Send task to another agent via gateway
    async fn send_to_agent(&self, gateway: &A2AGateway, to: AgentId, task: Task) -> Result<TaskId, Error> {
        gateway.send_with_guarantee(
            self.agent_id(),
            to,
            task,
            DeliveryGuarantee::AtLeastOnce,
        ).await
    }

    /// Discover agents by skill
    async fn discover_agents(&self, gateway: &A2AGateway, skill: &str) -> Vec<AgentId> {
        gateway.registry.discover_by_skill(skill).await
    }
}
```

### Example: CodeGen Agent with A2A

```rust
// crates/miyabi-agent-codegen/src/a2a.rs

impl A2AEnabled for CodeGenAgent {
    fn agent_card(&self) -> AgentCard {
        codegen_agent_card()
    }

    async fn handle_a2a_task(&self, task: Task) -> Result<TaskResult, Error> {
        // Extract task content
        let prompt = task.message.get_text()?;

        // Execute code generation
        let generated_code = self.generate(prompt).await?;

        // Return result as artifact
        Ok(TaskResult::Success(Artifact {
            type_: "text/plain".to_string(),
            content: generated_code,
        }))
    }
}
```

---

## Startup Sequence

### Gateway Initialization

```rust
// src/main.rs or startup

async fn start_a2a_system() -> Result<A2AGateway, Error> {
    // 1. Create gateway
    let gateway = A2AGateway::new().await?;

    // 2. Register all agents
    let agent_cards = get_all_agent_cards();
    for card in agent_cards {
        let id = gateway.register_agent(card).await?;
        info!("Registered agent: {}", id);
    }

    // 3. Start health check loop
    tokio::spawn(async move {
        loop {
            gateway.health_check().await;
            tokio::time::sleep(Duration::from_secs(30)).await;
        }
    });

    // 4. Start message processing loop
    tokio::spawn(async move {
        gateway.process_queue().await;
    });

    Ok(gateway)
}
```

---

## Usage Example

### Complete Flow: Issue Processing

```rust
async fn process_issue(gateway: &A2AGateway, issue: Issue) -> Result<PR, Error> {
    let coordinator_id = gateway.get_agent_by_name("miyabi-coordinator")?;

    // 1. Coordinator analyzes issue
    let analysis = gateway.send_and_wait(
        coordinator_id,
        gateway.get_agent_by_name("miyabi-issue")?,
        Task::new("Analyze issue", issue.to_json()),
    ).await?;

    // 2. CodeGen implements
    let code = gateway.send_and_wait(
        coordinator_id,
        gateway.get_agent_by_name("miyabi-codegen")?,
        Task::new("Implement", analysis),
    ).await?;

    // 3. Review code
    let review = gateway.send_and_wait(
        coordinator_id,
        gateway.get_agent_by_name("miyabi-review")?,
        Task::new("Review code", code),
    ).await?;

    // 4. Create PR
    let pr = gateway.send_and_wait(
        coordinator_id,
        gateway.get_agent_by_name("miyabi-pr")?,
        Task::new("Create PR", review),
    ).await?;

    Ok(pr)
}
```

---

## Monitoring Dashboard

### Metrics Endpoint

```rust
// GET /a2a/metrics
{
    "total_agents": 21,
    "active_agents": 21,
    "total_tasks": 1547,
    "pending_tasks": 12,
    "completed_tasks": 1520,
    "failed_tasks": 15,
    "avg_latency_ms": 245,
    "throughput_per_minute": 45,
    "communication_matrix": {
        "coordinator -> codegen": 523,
        "coordinator -> review": 412,
        "codegen -> review": 389,
        ...
    }
}
```

---

## References

- [A2A Protocol Document](.claude/context/a2a-protocol.md)
- [Agent Specifications](.claude/agents/specs/)
- [miyabi-a2a Crate](crates/miyabi-a2a/)

---

**Last Updated**: 2025-11-22
**Maintainer**: Miyabi Development Team
