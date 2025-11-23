# A2A (Agent-to-Agent) Protocol Integration Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-22
**Protocol Version**: 0.2.6

---

## Overview

A2A (Agent-to-Agent) は、Google が主導するエージェント間相互運用性のためのオープンプロトコルです。異なるベンダーやフレームワークで構築されたAIエージェント同士が、安全に通信・情報交換・アクション調整を行えるようにします。

### Miyabi との関係

| プロトコル | 役割 | Miyabi での位置づけ |
|-----------|------|-------------------|
| **MCP** | ツール・コンテキスト提供 | Agent → Tool 連携 |
| **miyabi-a2a** | 内部タスク管理 | GitHub Issues ベース |
| **Google A2A** | 外部エージェント連携 | 標準プロトコル |

### 二つのA2Aシステム

**1. miyabi-a2a (内部)**
- 既存crate: `crates/miyabi-a2a`
- GitHub Issues をタスクストレージとして使用
- Miyabi内部のAgent間通信に最適化

**2. Google A2A Protocol (外部)**
- このドキュメントの主題
- 異なるフレームワーク (CrewAI, LangGraph, AutoGen) との相互運用
- Agent Card + JSON-RPC による標準化

両システムを組み合わせることで、**内部タスク管理**と**外部相互運用性**を両立できます。

---

## 設計原則

### 1. エージェント能力の活用
構造化されていないモダリティでも自然に協力

### 2. 既存標準の活用
- HTTP
- SSE (Server-Sent Events)
- JSON-RPC

### 3. デフォルトセキュリティ
エンタープライズグレードの認証・認可

### 4. 長時間タスク対応
数分〜数日の業務フローに対応

### 5. モダリティ非依存
テキスト、音声、動画ストリーミング対応

---

## コアコンポーネント

### 1. Agent Card

エージェントの機能を公開する JSON 定義。`/.well-known/agent.json` で提供。

```json
{
  "name": "miyabi-coordinator-agent",
  "description": "Miyabi Coordinator Agent for task orchestration",
  "url": "https://miyabi-api.example.com",
  "version": "1.0.0",
  "protocolVersion": "0.2.6",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "stateTransitionHistory": true
  },
  "authentication": {
    "schemes": ["Bearer"]
  },
  "defaultInputModes": ["text/plain", "application/json"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "task_coordination",
      "name": "Task Coordination",
      "description": "Coordinate and distribute tasks across multiple agents",
      "inputModes": ["text/plain"],
      "outputModes": ["application/json"]
    },
    {
      "id": "code_generation",
      "name": "Code Generation",
      "description": "Generate code based on specifications",
      "inputModes": ["text/plain"],
      "outputModes": ["text/plain", "application/json"]
    }
  ]
}
```

### 2. Task Object

クライアント-リモートエージェント間の通信単位。

```json
{
  "id": "task-uuid-12345",
  "status": "in_progress",
  "message": {
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "Implement user authentication feature"
      }
    ]
  },
  "artifacts": [],
  "metadata": {
    "priority": "high",
    "deadline": "2025-11-23T00:00:00Z"
  }
}
```

### 3. Message Parts

メッセージに含まれるコンテンツ要素。

| Type | Description |
|------|-------------|
| `text` | プレーンテキスト |
| `file` | ファイルデータ |
| `data` | 構造化データ (JSON) |

---

## Miyabi A2A Architecture

### Agent 階層と A2A 通信

```
┌─────────────────────────────────────────────────────────┐
│                    External Agents                       │
│  (CrewAI / LangGraph / AutoGen / Custom)                │
└─────────────────────┬───────────────────────────────────┘
                      │ A2A Protocol
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Miyabi A2A Gateway                          │
│  - Agent Card Discovery                                  │
│  - Request Routing                                       │
│  - Authentication                                        │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│Coordinator│  │  CodeGen  │  │  Review   │
│   Agent   │  │   Agent   │  │   Agent   │
└───────────┘  └───────────┘  └───────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │ Internal A2A
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Miyabi Business Agents                      │
│  (14 Agents: Strategy, Marketing, Sales, etc.)          │
└─────────────────────────────────────────────────────────┘
```

### Miyabi Agent → A2A マッピング

| Miyabi Agent | A2A Skill ID | Description |
|-------------|--------------|-------------|
| CoordinatorAgent | `task_coordination` | タスク統括・DAG実行 |
| CodeGenAgent | `code_generation` | AI駆動コード生成 |
| ReviewAgent | `code_review` | 品質・セキュリティレビュー |
| PRAgent | `pr_creation` | PR自動作成 |
| IssueAgent | `issue_analysis` | Issue分析・ラベリング |
| DeploymentAgent | `deployment` | CI/CDデプロイ |

---

## Implementation Guide

### 1. A2A Server (Miyabi Agent)

```rust
// crates/miyabi-a2a/src/server.rs

use axum::{Router, Json, routing::get};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct AgentCard {
    pub name: String,
    pub description: String,
    pub url: String,
    pub version: String,
    pub protocol_version: String,
    pub capabilities: AgentCapabilities,
    pub skills: Vec<Skill>,
}

#[derive(Serialize)]
pub struct AgentCapabilities {
    pub streaming: bool,
    pub push_notifications: bool,
    pub state_transition_history: bool,
}

#[derive(Serialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub input_modes: Vec<String>,
    pub output_modes: Vec<String>,
}

pub fn create_a2a_router() -> Router {
    Router::new()
        .route("/.well-known/agent.json", get(get_agent_card))
        .route("/a2a/tasks/send", post(send_task))
        .route("/a2a/tasks/:id", get(get_task_status))
        .route("/a2a/tasks/:id/cancel", post(cancel_task))
}

async fn get_agent_card() -> Json<AgentCard> {
    Json(AgentCard {
        name: "miyabi-coordinator".to_string(),
        description: "Miyabi Coordinator Agent".to_string(),
        url: std::env::var("AGENT_URL").unwrap_or_default(),
        version: "1.0.0".to_string(),
        protocol_version: "0.2.6".to_string(),
        capabilities: AgentCapabilities {
            streaming: true,
            push_notifications: false,
            state_transition_history: true,
        },
        skills: vec![
            Skill {
                id: "task_coordination".to_string(),
                name: "Task Coordination".to_string(),
                description: "Coordinate tasks across agents".to_string(),
                input_modes: vec!["text/plain".to_string()],
                output_modes: vec!["application/json".to_string()],
            },
        ],
    })
}
```

### 2. A2A Client (Miyabi → External)

```rust
// crates/miyabi-a2a/src/client.rs

use reqwest::Client;
use serde_json::json;
use uuid::Uuid;

pub struct A2AClient {
    client: Client,
    base_url: String,
}

impl A2AClient {
    pub async fn discover_agent(&self) -> Result<AgentCard, Error> {
        let url = format!("{}/.well-known/agent.json", self.base_url);
        let response = self.client.get(&url).send().await?;
        response.json().await
    }

    pub async fn send_message(&self, task: &str) -> Result<TaskResponse, Error> {
        let message_id = Uuid::new_v4().to_string();

        let request = json!({
            "jsonrpc": "2.0",
            "method": "message/send",
            "id": message_id,
            "params": {
                "message": {
                    "role": "user",
                    "parts": [{
                        "type": "text",
                        "text": task
                    }]
                }
            }
        });

        let response = self.client
            .post(format!("{}/a2a", self.base_url))
            .json(&request)
            .send()
            .await?;

        response.json().await
    }
}
```

### 3. Task Management

```rust
// crates/miyabi-a2a/src/task.rs

use std::collections::HashMap;
use tokio::sync::RwLock;

#[derive(Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub status: TaskStatus,
    pub message: Message,
    pub artifacts: Vec<Artifact>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct InMemoryTaskStore {
    tasks: RwLock<HashMap<String, Task>>,
}

impl InMemoryTaskStore {
    pub async fn create_task(&self, message: Message) -> Task {
        let task = Task {
            id: Uuid::new_v4().to_string(),
            status: TaskStatus::Pending,
            message,
            artifacts: vec![],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        self.tasks.write().await.insert(task.id.clone(), task.clone());
        task
    }

    pub async fn update_status(&self, id: &str, status: TaskStatus) {
        if let Some(task) = self.tasks.write().await.get_mut(id) {
            task.status = status;
            task.updated_at = Utc::now();
        }
    }
}
```

---

## Integration with Existing Miyabi Agents

### 1. miyabi-agent-core 拡張

```rust
// crates/miyabi-agent-core/src/a2a.rs

pub trait A2AAgent: Agent {
    /// Get the A2A agent card
    fn agent_card(&self) -> AgentCard;

    /// Handle incoming A2A task
    async fn handle_a2a_task(&self, task: Task) -> Result<TaskResponse, Error>;

    /// Map agent capabilities to A2A skills
    fn skills(&self) -> Vec<Skill>;
}
```

### 2. 既存 Agent への A2A 実装例

```rust
// crates/miyabi-agent-codegen/src/a2a.rs

impl A2AAgent for CodeGenAgent {
    fn agent_card(&self) -> AgentCard {
        AgentCard {
            name: "miyabi-codegen".to_string(),
            skills: vec![
                Skill {
                    id: "generate_code".to_string(),
                    name: "Code Generation".to_string(),
                    description: "Generate code from specifications".to_string(),
                    ..Default::default()
                },
                Skill {
                    id: "refactor_code".to_string(),
                    name: "Code Refactoring".to_string(),
                    description: "Refactor existing code".to_string(),
                    ..Default::default()
                },
            ],
            ..Default::default()
        }
    }

    async fn handle_a2a_task(&self, task: Task) -> Result<TaskResponse, Error> {
        let text = task.message.get_text()?;
        let result = self.execute(text).await?;

        Ok(TaskResponse {
            id: task.id,
            status: TaskStatus::Completed,
            artifacts: vec![Artifact::text(result)],
        })
    }
}
```

---

## Communication Flow

### 1. Agent Discovery

```
Client                    Server
  │                         │
  │ GET /.well-known/agent.json
  │ ───────────────────────>│
  │                         │
  │     AgentCard JSON      │
  │ <───────────────────────│
```

### 2. Task Execution

```
Client                    Server                    Agent
  │                         │                         │
  │  SendMessageRequest     │                         │
  │ ───────────────────────>│                         │
  │                         │    Create Task          │
  │                         │ ───────────────────────>│
  │                         │                         │
  │                         │    Execute              │
  │                         │ <───────────────────────│
  │    TaskResponse         │                         │
  │ <───────────────────────│                         │
```

### 3. Streaming Response

```
Client                    Server
  │                         │
  │  SendMessageRequest     │
  │ ───────────────────────>│
  │                         │
  │  SSE: task/start        │
  │ <───────────────────────│
  │  SSE: artifact/update   │
  │ <───────────────────────│
  │  SSE: artifact/update   │
  │ <───────────────────────│
  │  SSE: task/complete     │
  │ <───────────────────────│
```

---

## Security

### Authentication Schemes

```json
{
  "authentication": {
    "schemes": ["Bearer", "OAuth2"],
    "oauth2": {
      "authorizationUrl": "https://auth.miyabi.dev/authorize",
      "tokenUrl": "https://auth.miyabi.dev/token",
      "scopes": {
        "agent:read": "Read agent capabilities",
        "agent:execute": "Execute agent tasks"
      }
    }
  }
}
```

### Request Authentication

```rust
// Authorization header
Authorization: Bearer <JWT_TOKEN>

// Or API Key
X-API-Key: <API_KEY>
```

---

## Dependencies

### Cargo.toml

```toml
[dependencies]
# A2A SDK (when available for Rust)
# a2a-sdk = "0.2"

# HTTP/JSON-RPC
axum = "0.7"
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async runtime
tokio = { version = "1", features = ["full"] }

# UUID for task IDs
uuid = { version = "1", features = ["v4"] }
```

### Python (for testing/prototyping)

```txt
a2a-sdk==0.2.16
google-adk
google-cloud-aiplatform
```

---

## Use Cases

### 1. Multi-Agent Code Review

```
User Request
    │
    ▼
Coordinator Agent (Miyabi)
    │
    ├──A2A──> CodeGen Agent: Generate tests
    │
    ├──A2A──> Review Agent: Security scan
    │
    └──A2A──> External Linter Agent (CrewAI)
    │
    ▼
Consolidated Report
```

### 2. Cross-Platform Deployment

```
GitHub Issue
    │
    ▼
Issue Agent (Miyabi)
    │
    ├──A2A──> AWS Agent: Infrastructure check
    │
    ├──A2A──> Deployment Agent: Deploy
    │
    └──A2A──> Monitoring Agent (External)
    │
    ▼
Deployment Complete + Monitoring Active
```

---

## Roadmap

### Phase 1: Foundation (Current)
- [ ] Agent Card implementation
- [ ] Basic task send/receive
- [ ] In-memory task store

### Phase 2: Integration
- [ ] Integrate with miyabi-web-api
- [ ] Add A2A routes to existing agents
- [ ] Authentication/Authorization

### Phase 3: Advanced
- [ ] Streaming support
- [ ] Push notifications
- [ ] Multi-agent orchestration via A2A

### Phase 4: Ecosystem
- [ ] Connect with external A2A agents
- [ ] Publish Miyabi agents to A2A registry
- [ ] Cross-framework interoperability

---

## References

- [A2A Protocol Specification](https://github.com/google/a2a-spec)
- [Google Cloud A2A Blog](https://cloud.google.com/blog/products/ai-machine-learning/a2a-a-new-era-of-agent-interoperability)
- [A2A Codelab](https://codelabs.developers.google.com/intro-a2a-purchasing-concierge)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

**Last Updated**: 2025-11-22
**Maintainer**: Miyabi Development Team
