# miyabi-approval

**Status**: Stable
**Category**: Infrastructure

## Overview

Human-in-the-Loop workflow approval gates system. Provides multi-approver support, state persistence, timeout handling, and notification integration for workflow orchestration.

## Features

- **Multi-approver support**: Require approval from multiple stakeholders
- **State persistence**: Approval states stored in embedded database (Sled)
- **Timeout handling**: Automatic escalation and timeout management
- **Notification integration**: Discord and Slack notification support
- **Workflow integration**: Seamless integration with `miyabi-workflow`

## Usage

```rust
use miyabi_approval::{ApprovalGate, ApprovalStore};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create approval gate
    let gate = ApprovalGate::builder("deploy-production")
        .required_approvers(vec!["tech-lead".to_string(), "ciso".to_string()])
        .timeout_seconds(86400) // 24 hours
        .build()?;

    // Pause workflow at approval gate
    let approval_id = gate.create_approval("workflow-123").await?;

    // Later: approve the workflow
    gate.approve(&approval_id, "tech-lead", Some("LGTM".to_string())).await?;

    // Check if all approvals received
    if gate.is_approved(&approval_id).await? {
        println!("Workflow approved!");
    }

    Ok(())
}
```

## Key Components

### ApprovalGate
Central approval gate manager with builder pattern for configuration.

### ApprovalStore
Persistent storage for approval states using Sled embedded database.

### Notifier
Notification system supporting Discord and Slack integrations.

## Dependencies

- `tokio`: Async runtime
- `serde`, `serde_json`: Serialization
- `sled`: Embedded database for state persistence
- `reqwest`: HTTP client for notifications
- `chrono`: Timestamp management
- `miyabi-workflow`: Workflow integration

## Development Status

- [x] Basic functionality
- [x] Multi-approver support
- [x] State persistence
- [x] Notification integration
- [x] Tests
- [x] Documentation
- [ ] Approval UI dashboard
- [ ] Webhook notifications

## Related Crates

- `miyabi-workflow`: Workflow orchestration framework
- `miyabi-core`: Core utilities
- `miyabi-types`: Shared type definitions

## License

Apache-2.0
