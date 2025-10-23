# Cline + Miyabi Integration Roadmap

**Version**: 1.0.0
**Created**: 2025-10-24
**Status**: Planning Phase
**Related Issue**: #497 - Implement Cline Architecture Learnings

---

## 📋 Executive Summary

This document outlines the implementation roadmap for integrating Cline's interactive UI capabilities with Miyabi's autonomous execution engine, creating a hybrid system that combines the best of both approaches.

**Three Integration Scenarios**:
1. **Scenario 1**: Cline UI → Miyabi Backend (Interactive control of autonomous agents)
2. **Scenario 2**: Miyabi Orchestrator → Cline Execution (Autonomous orchestration with interactive fallback)
3. **Scenario 3**: Shared Context Layer (Unified knowledge base and state management)

**Expected Benefits**:
- ✅ Interactive debugging of autonomous workflows
- ✅ Visual progress monitoring for long-running tasks
- ✅ Human-in-the-loop decision making at critical points
- ✅ Unified context management across both systems
- ✅ Seamless transition between interactive and autonomous modes

---

## 🎯 Scenario 1: Cline UI → Miyabi Backend

**Goal**: Use Cline's interactive UI as a control panel for Miyabi's autonomous agents.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Cline Extension (VS Code)                               │
│ - Interactive UI (webview)                              │
│ - User input handling                                   │
│ - Real-time progress display                            │
└─────────────────────────────────────────────────────────┘
                    │ HTTP/WebSocket
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Miyabi MCP Server (JSON-RPC 2.0)                       │
│ - Agent execution endpoints                              │
│ - State management                                       │
│ - Progress streaming                                     │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Miyabi Agents (Rust)                                    │
│ - CoordinatorAgent, CodeGenAgent, ReviewAgent, etc.     │
│ - Worktree-based parallel execution                     │
│ - Autonomous task decomposition                          │
└─────────────────────────────────────────────────────────┘
```

### Implementation Phases

#### Phase 1.1: MCP Server Enhancement (Week 1-2)
**Priority**: P0-Critical
**Effort**: 40 hours
**Dependencies**: None

**Tasks**:
- [ ] Add WebSocket transport to miyabi-mcp-server
  - Current: stdio only
  - Target: HTTP + WebSocket support
  - Location: `crates/miyabi-mcp-server/src/transport/websocket.rs`

- [ ] Implement progress streaming protocol
  ```rust
  // Example: Progress event structure
  pub struct ProgressEvent {
      pub agent_type: AgentType,
      pub task_id: Uuid,
      pub phase: ExecutionPhase,
      pub progress: f32,  // 0.0 - 1.0
      pub message: String,
      pub timestamp: DateTime<Utc>,
  }
  ```

- [ ] Add authentication/authorization layer
  - API key-based auth for WebSocket connections
  - Rate limiting (10 req/sec per client)
  - Session management

**Deliverables**:
- `crates/miyabi-mcp-server/src/transport/websocket.rs`
- `crates/miyabi-mcp-server/src/auth.rs`
- Integration tests: `tests/websocket_transport.rs`
- API documentation: `docs/api/MCP_WEBSOCKET_API.md`

**Success Criteria**:
- [ ] WebSocket server responds on `ws://localhost:8080/mcp`
- [ ] Can execute agents via WebSocket JSON-RPC calls
- [ ] Progress events stream in real-time
- [ ] Authentication prevents unauthorized access

---

#### Phase 1.2: Cline Extension Fork (Week 3-4)
**Priority**: P1-High
**Effort**: 60 hours
**Dependencies**: Phase 1.1

**Tasks**:
- [ ] Fork Cline repository
  ```bash
  git clone https://github.com/cline/cline.git cline-miyabi-fork
  cd cline-miyabi-fork
  git checkout -b miyabi-integration
  ```

- [ ] Replace Anthropic API client with Miyabi MCP client
  - Location: `src/api/` → `src/api/miyabi-mcp-client.ts`
  - Protocol: JSON-RPC 2.0 over WebSocket

- [ ] Add Miyabi-specific UI components
  - Agent selection dropdown (21 agents)
  - Worktree status panel
  - Parallel execution visualization
  - Quality report display (0-100 score)

- [ ] Implement bi-directional state sync
  - Cline state → Miyabi state
  - Miyabi events → Cline UI updates

**Code Example**:
```typescript
// src/api/miyabi-mcp-client.ts
import { WebSocket } from 'ws';

export class MiyabiMcpClient {
  private ws: WebSocket;
  private requestId = 0;

  async executeAgent(agentType: string, task: Task): Promise<AgentResult> {
    return this.sendRequest('agent.execute', {
      agent_type: agentType,
      task: task,
    });
  }

  onProgress(callback: (event: ProgressEvent) => void): void {
    this.ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      if (event.method === 'progress') {
        callback(event.params);
      }
    });
  }
}
```

**Deliverables**:
- Forked Cline repository: `cline-miyabi-fork/`
- Miyabi MCP client: `src/api/miyabi-mcp-client.ts`
- UI components: `webview-ui/src/components/miyabi/`
- Integration tests: `src/test/integration/miyabi-mcp.test.ts`

**Success Criteria**:
- [ ] Can connect to Miyabi MCP server from Cline UI
- [ ] Can select and execute any of the 21 Miyabi agents
- [ ] Real-time progress updates appear in UI
- [ ] Worktree status displays correctly
- [ ] Can interrupt/cancel running agents

---

#### Phase 1.3: Interactive Debugging UI (Week 5-6)
**Priority**: P1-High
**Effort**: 40 hours
**Dependencies**: Phase 1.2

**Tasks**:
- [ ] Implement step-through execution mode
  - Pause at agent boundaries
  - Display intermediate state
  - Allow manual intervention

- [ ] Add worktree inspector panel
  - File tree view
  - Diff viewer for changes
  - Git status integration

- [ ] Create agent execution timeline
  - Gantt chart for parallel execution
  - Dependency visualization (DAG)
  - Critical path highlighting

- [ ] Add quality report viewer
  - Score breakdown (0-100)
  - Issue list with severity
  - Recommendations display

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│ Miyabi Agent Execution                          [Pause]  │
├─────────────────────────────────────────────────────────┤
│ ┌─ Worktrees ────────┐ ┌─ Timeline ──────────────────┐ │
│ │ • issue-270 (⚙️)    │ │ Coordinator ████           │ │
│ │   ├─ src/          │ │ CodeGen     ░░░░████       │ │
│ │   └─ tests/        │ │ Review          ░░░░░████  │ │
│ ├─ issue-271 (✅)    │ └───────────────────────────────┘ │
│ └─ issue-272 (⏸️)    │ ┌─ Quality Report ────────────┐ │
│                       │ │ Score: 87/100              │ │
│                       │ │ ✅ Tests: 95%              │ │
│                       │ │ ⚠️  Clippy: 3 warnings     │ │
│                       │ └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Deliverables**:
- Step-through execution UI: `webview-ui/src/components/ExecutionStepper.tsx`
- Worktree inspector: `webview-ui/src/components/WorktreeInspector.tsx`
- Timeline visualization: `webview-ui/src/components/ExecutionTimeline.tsx`
- Quality report viewer: `webview-ui/src/components/QualityReportViewer.tsx`

**Success Criteria**:
- [ ] Can pause execution at any agent boundary
- [ ] Can inspect worktree file changes before merge
- [ ] Timeline accurately reflects parallel execution
- [ ] Quality reports display with drill-down capability

---

## 🔄 Scenario 2: Miyabi Orchestrator → Cline Execution

**Goal**: Autonomous orchestration with interactive fallback for complex decisions.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Water Spider Orchestrator (24/7 Daemon)                 │
│ - Issue monitoring (GitHub webhook)                     │
│ - Task decomposition (CoordinatorAgent)                 │
│ - Autonomous decision making                             │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼──────────┐
        │ Easy Task │ Hard Task│
        ▼           ▼          │
┌────────────┐ ┌──────────────┴─────────────────┐
│ Miyabi     │ │ Escalation to Human            │
│ Agents     │ │ "Task complexity: 9/10"        │
│ (Auto)     │ │ "Recommendation: Manual review"│
└────────────┘ └────────────────────────────────┘
                    │
                    ▼
            ┌────────────────────┐
            │ Cline UI Opens     │
            │ - Context pre-loaded│
            │ - Awaiting decision │
            └────────────────────┘
```

### Implementation Phases

#### Phase 2.1: Complexity Scoring System (Week 7-8)
**Priority**: P1-High
**Effort**: 32 hours
**Dependencies**: None

**Tasks**:
- [ ] Implement task complexity analyzer
  ```rust
  pub struct ComplexityAnalyzer;

  impl ComplexityAnalyzer {
      pub fn analyze_task(task: &Task) -> ComplexityScore {
          let mut score = 0.0;

          // Factor 1: Code size estimate
          score += Self::estimate_code_size(task) / 1000.0;

          // Factor 2: Dependency count
          score += task.dependencies.len() as f32 * 0.1;

          // Factor 3: Security sensitivity
          if task.requires_security_review() {
              score += 2.0;
          }

          // Factor 4: Breaking change risk
          score += Self::breaking_change_risk(task);

          ComplexityScore::from_raw(score)
      }
  }
  ```

- [ ] Define escalation thresholds
  - Complexity < 5.0: Fully autonomous
  - Complexity 5.0-7.0: Notify human, proceed after 5 min
  - Complexity > 7.0: Require human approval

- [ ] Add confidence scoring for AI decisions
  - LLM confidence estimation
  - Historical success rate analysis

**Deliverables**:
- `crates/miyabi-agents/src/complexity.rs`
- Escalation policy config: `.miyabi/escalation-policy.yml`
- Tests: `tests/complexity_analysis.rs`

**Success Criteria**:
- [ ] Complexity scores correlate with actual implementation difficulty
- [ ] False positive rate < 10% (tasks wrongly escalated)
- [ ] Critical security tasks always escalate

---

#### Phase 2.2: Human-in-the-Loop Integration (Week 9-10)
**Priority**: P0-Critical
**Effort**: 48 hours
**Dependencies**: Phase 1.2, Phase 2.1

**Tasks**:
- [ ] Implement escalation notification system
  - Slack webhook integration
  - Email notifications
  - VS Code desktop notification (if Cline installed)

- [ ] Create escalation UI in Cline
  - Display task context
  - Show complexity breakdown
  - Provide approval/rejection buttons
  - Allow manual task modification

- [ ] Add decision recording
  - Store human decisions in database
  - Learn from approval patterns
  - Adjust thresholds over time

**Escalation Notification Example**:
```json
{
  "type": "escalation",
  "severity": "high",
  "task": {
    "id": "task-270-1",
    "title": "Refactor authentication system",
    "complexity": 8.5,
    "estimated_effort": "16 hours"
  },
  "reason": "High complexity + security sensitive",
  "recommendation": "Manual review recommended",
  "context": {
    "issue_url": "https://github.com/org/repo/issues/270",
    "worktree_path": ".worktrees/issue-270",
    "related_files": ["src/auth/mod.rs", "src/middleware/auth.rs"]
  },
  "actions": [
    { "id": "approve", "label": "Approve & Continue" },
    { "id": "reject", "label": "Reject & Modify" },
    { "id": "defer", "label": "Defer to PM" }
  ]
}
```

**Deliverables**:
- Notification system: `crates/miyabi-orchestrator/src/notifications.rs`
- Escalation UI: `cline-miyabi-fork/webview-ui/src/components/EscalationPanel.tsx`
- Decision database: SQLite schema in `orchestrator.db`
- Learning module: `crates/miyabi-orchestrator/src/learning.rs`

**Success Criteria**:
- [ ] Notifications arrive within 30 seconds of escalation
- [ ] Cline UI opens automatically (if available)
- [ ] Can approve/reject with one click
- [ ] Decision history tracked and analyzable

---

#### Phase 2.3: Adaptive Threshold Learning (Week 11-12)
**Priority**: P2-Medium
**Effort**: 32 hours
**Dependencies**: Phase 2.2

**Tasks**:
- [ ] Implement machine learning model for threshold adjustment
  - Input: Task features + Human decision
  - Output: Updated complexity thresholds
  - Algorithm: Online gradient descent

- [ ] Create feedback loop
  - Track approval/rejection patterns
  - Analyze false positives/negatives
  - Adjust thresholds weekly

- [ ] Add explainability features
  - Show why task was escalated
  - Display confidence intervals
  - Provide override mechanism

**Deliverables**:
- ML model: `crates/miyabi-orchestrator/src/ml/threshold_learner.rs`
- Feedback analysis: `scripts/analyze-escalations.rs`
- Explainability UI: `webview-ui/src/components/EscalationReasoning.tsx`

**Success Criteria**:
- [ ] Escalation rate decreases by 20% over 3 months
- [ ] False positive rate < 5%
- [ ] Human satisfaction score > 8/10

---

## 🔗 Scenario 3: Shared Context Layer

**Goal**: Unified knowledge base and state management across both systems.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Unified Context Layer                                   │
│ - Shared knowledge base (Qdrant + PostgreSQL)           │
│ - State synchronization (Redis)                          │
│ - Unified event bus (NATS)                               │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────────┐       ┌────────────────────┐
│ Cline Context      │       │ Miyabi Context     │
│ - Chat history     │◄──────►│ - Execution logs   │
│ - File state       │ Sync  │ - Agent state      │
│ - User preferences │       │ - Worktree state   │
└────────────────────┘       └────────────────────┘
```

### Implementation Phases

#### Phase 3.1: Unified Knowledge Base (Week 13-14)
**Priority**: P1-High
**Effort**: 48 hours
**Dependencies**: None

**Tasks**:
- [ ] Extend miyabi-knowledge to support Cline context
  - Add Cline chat history indexing
  - Store Cline task context
  - Link Cline tasks to Miyabi issues

- [ ] Create context synchronization protocol
  ```rust
  pub trait ContextProvider {
      async fn push_context(&self, ctx: Context) -> Result<()>;
      async fn pull_context(&self, query: Query) -> Result<Vec<Context>>;
      async fn subscribe_updates(&self, callback: ContextCallback);
  }

  // Cline implementation
  pub struct ClineContextProvider { /* ... */ }

  // Miyabi implementation
  pub struct MiyabiContextProvider { /* ... */ }
  ```

- [ ] Implement RAG for cross-system queries
  - Query: "What did I work on yesterday in Cline?"
  - Result: Combines Cline chat history + Miyabi execution logs

**Deliverables**:
- Context provider trait: `crates/miyabi-knowledge/src/context.rs`
- Cline adapter: `crates/miyabi-knowledge/src/providers/cline.rs`
- RAG queries: `crates/miyabi-knowledge/src/rag/cross_system.rs`
- Tests: `tests/context_sync.rs`

**Success Criteria**:
- [ ] Can query Cline history from Miyabi
- [ ] Can query Miyabi logs from Cline
- [ ] Search works across both systems
- [ ] Latency < 100ms for context retrieval

---

#### Phase 3.2: State Synchronization (Week 15-16)
**Priority**: P1-High
**Effort**: 40 hours
**Dependencies**: Phase 3.1

**Tasks**:
- [ ] Deploy Redis for real-time state sync
  ```yaml
  # docker-compose.yml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - ./data/redis:/data
  ```

- [ ] Implement pub/sub for state changes
  ```rust
  pub struct StateSync {
      redis: RedisClient,
  }

  impl StateSync {
      pub async fn publish_state_change(&self, entity: Entity, change: Change) {
          let channel = format!("state:{}", entity.type_name());
          self.redis.publish(channel, change.to_json()).await;
      }

      pub async fn subscribe_state_changes(&self, callback: StateCallback) {
          self.redis.subscribe("state:*", callback).await;
      }
  }
  ```

- [ ] Add conflict resolution
  - Last-write-wins for simple fields
  - Vector clocks for complex state
  - Manual resolution UI for conflicts

**Deliverables**:
- State sync service: `crates/miyabi-orchestrator/src/state_sync.rs`
- Redis integration: `crates/miyabi-core/src/redis.rs`
- Conflict resolver: `crates/miyabi-orchestrator/src/conflict_resolution.rs`
- Docker setup: `docker-compose.yml`

**Success Criteria**:
- [ ] State changes propagate within 50ms
- [ ] No data loss during network partitions
- [ ] Conflicts resolve automatically 95% of time

---

#### Phase 3.3: Unified Event Bus (Week 17-18)
**Priority**: P2-Medium
**Effort**: 40 hours
**Dependencies**: Phase 3.2

**Tasks**:
- [ ] Deploy NATS for event streaming
  ```bash
  docker run -d --name nats -p 4222:4222 nats:latest
  ```

- [ ] Implement event schemas
  ```rust
  #[derive(Serialize, Deserialize)]
  pub enum SystemEvent {
      // Cline events
      ClineTaskStarted { task_id: String, ... },
      ClineTaskCompleted { task_id: String, ... },
      ClineUserInput { input: String, ... },

      // Miyabi events
      MiyabiAgentStarted { agent_type: AgentType, ... },
      MiyabiAgentCompleted { result: AgentResult, ... },
      MiyabiWorktreeCreated { worktree_id: String, ... },

      // Shared events
      IssueCreated { issue_number: u32, ... },
      PRMerged { pr_number: u32, ... },
  }
  ```

- [ ] Add event replay capability
  - Store all events in NATS JetStream
  - Allow time-travel debugging
  - Enable audit trails

**Deliverables**:
- Event bus client: `crates/miyabi-core/src/event_bus.rs`
- Event schemas: `crates/miyabi-types/src/events.rs`
- Event replay service: `crates/miyabi-orchestrator/src/event_replay.rs`
- Docker setup: Updated `docker-compose.yml`

**Success Criteria**:
- [ ] All system events published to NATS
- [ ] Event replay works for last 7 days
- [ ] Event throughput > 1000 events/sec

---

## 📊 Implementation Timeline

```
Month 1: Scenario 1 Foundation
├─ Week 1-2: MCP Server Enhancement
├─ Week 3-4: Cline Extension Fork
└─ Week 5-6: Interactive Debugging UI

Month 2: Scenario 2 Implementation
├─ Week 7-8: Complexity Scoring
├─ Week 9-10: Human-in-the-Loop
└─ Week 11-12: Adaptive Learning

Month 3: Scenario 3 Integration
├─ Week 13-14: Unified Knowledge Base
├─ Week 15-16: State Synchronization
└─ Week 17-18: Unified Event Bus

Month 4: Polish & Production
├─ Week 19-20: Integration Testing
├─ Week 21-22: Performance Optimization
└─ Week 23-24: Documentation & Launch
```

**Total Effort**: 484 hours (~12 weeks with 2 developers)

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] System uptime > 99.5%
- [ ] Agent execution latency < 2 seconds
- [ ] Context retrieval latency < 100ms
- [ ] State sync latency < 50ms
- [ ] Event throughput > 1000 events/sec

### User Experience Metrics
- [ ] Time to first agent execution < 30 seconds
- [ ] Escalation response time < 5 minutes
- [ ] False positive rate < 5%
- [ ] User satisfaction score > 8/10

### Business Metrics
- [ ] Developer productivity increase > 30%
- [ ] Code review time reduction > 40%
- [ ] Bug escape rate reduction > 25%
- [ ] Time to production reduction > 50%

---

## 🚧 Risks & Mitigation

### Technical Risks

**Risk 1: WebSocket connection instability**
- Impact: High
- Likelihood: Medium
- Mitigation: Implement automatic reconnection with exponential backoff, fallback to HTTP polling

**Risk 2: State sync conflicts**
- Impact: High
- Likelihood: Medium
- Mitigation: Vector clocks, conflict-free replicated data types (CRDTs), manual resolution UI

**Risk 3: Performance degradation with high event volume**
- Impact: Medium
- Likelihood: Low
- Mitigation: Event batching, rate limiting, dedicated event processing workers

### Integration Risks

**Risk 4: Cline API changes breaking integration**
- Impact: High
- Likelihood: High (Cline is actively developed)
- Mitigation: Pin Cline version, automated integration tests, version compatibility matrix

**Risk 5: Licensing conflicts**
- Impact: Critical
- Likelihood: Low
- Mitigation: Legal review of Cline license (Apache 2.0), maintain clear separation, document attribution

### Operational Risks

**Risk 6: Increased infrastructure costs**
- Impact: Medium
- Likelihood: High
- Mitigation: Cost monitoring, resource quotas, auto-scaling policies

**Risk 7: Support complexity for hybrid mode**
- Impact: Medium
- Likelihood: High
- Mitigation: Comprehensive documentation, runbooks, automated troubleshooting guides

---

## 📚 References

- **Cline Architecture**: [CLINE_ANALYSIS.md](CLINE_ANALYSIS.md)
- **Integration Opportunities Diagram**: [cline-integration-opportunities.puml](cline-integration-opportunities.puml)
- **Miyabi MCP Server**: `crates/miyabi-mcp-server/README.md`
- **Miyabi Knowledge System**: `crates/miyabi-knowledge/README.md`
- **Issue #497**: Implement Cline Architecture Learnings

---

## 🔄 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-24 | 1.0.0 | Initial roadmap creation | Claude Code |

---

**Status**: Ready for review and prioritization
**Next Steps**: Review with team, assign Phase 1.1 to sprint
**Questions**: Contact integration team lead
