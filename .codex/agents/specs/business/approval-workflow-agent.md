# ApprovalWorkflowAgent (Codex)

**Agent ID**: 205 | **Type**: Business | **Priority**: P1

## 🎯 Purpose
Manage multi-stage approval workflows for documents, orders, and policy changes.

## 📋 Spec

| Property | Value |
|----------|-------|
| Input | Approval request, workflow definition, approvers |
| Output | Workflow status, notifications sent |
| Duration | <1 second (async notifications) |
| Dependencies | PostgreSQL, Email/Lark notifications |

## 💻 Implementation

```rust
pub struct ApprovalWorkflowAgent {
    state_manager: Arc<StateManager>,
    notification_service: Arc<dyn NotificationService>,
    db_pool: PgPool,
}

impl Agent for ApprovalWorkflowAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, AgentError> {
        let request: ApprovalRequest = parse_request(task)?;

        // 1. Create workflow
        let workflow = self.create_workflow(&request).await?;

        // 2. Notify first approver
        self.notification_service
            .notify_approver(workflow.current_stage_approvers())
            .await?;

        // 3. Store workflow state
        sqlx::query!(
            r#"
            INSERT INTO approval_workflows (id, entity_type, entity_id, stages, status)
            VALUES ($1, $2, $3, $4, 'pending')
            "#,
            workflow.id,
            workflow.entity_type as _,
            workflow.entity_id,
            serde_json::to_value(&workflow.stages)?
        )
        .execute(&self.db_pool)
        .await?;

        // 4. Update state
        self.state_manager.update_business_state(|state| {
            state.approvals.push(Approval {
                id: workflow.id.clone(),
                status: ApprovalStatus::Pending,
                created_at: Utc::now(),
                ..Default::default()
            });
        }).await?;

        Ok(AgentResult::success())
    }
}

impl ApprovalWorkflowAgent {
    pub async fn process_approval_action(
        &self,
        workflow_id: &str,
        approver_id: &str,
        action: ApprovalAction,
    ) -> Result<(), AgentError> {
        // 1. Validate approver
        // 2. Update workflow state
        // 3. If approved: move to next stage or complete
        // 4. If rejected: mark workflow as rejected
        // 5. Send notifications
        Ok(())
    }
}
```

## 🔄 Workflow Stages

```rust
pub struct WorkflowDefinition {
    pub stages: Vec<WorkflowStage>,
}

pub struct WorkflowStage {
    pub stage_number: u32,
    pub name: String,
    pub approvers: Vec<String>, // User IDs
    pub approval_type: ApprovalType, // Any | All | Majority
}

pub enum ApprovalAction {
    Approve { comment: Option<String> },
    Reject { reason: String },
    RequestChanges { feedback: String },
}
```

## 🔗 Related
- `miyabi-approval` crate
- `crates/miyabi-business-api/src/approvals.rs`

**Phase**: 4 | **Effort**: 2 days
