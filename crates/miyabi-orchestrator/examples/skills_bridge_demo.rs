//! Skills Bridge Demo
//!
//! Demonstrates bidirectional communication between Skills and Orchestrator
//!
//! # Usage
//!
//! ```bash
//! cargo run --example skills_bridge_demo
//! ```

use miyabi_orchestrator::skills_bridge::{ErrorSeverity, OrchestratorEvent, SkillRequest, SkillsBridge};
use std::collections::HashMap;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt().with_max_level(tracing::Level::INFO).init();

    println!("🌉 Skills Bridge Demo");
    println!("====================\n");

    // Create Skills Bridge
    let (bridge, mut event_rx) = SkillsBridge::new();
    println!("✅ Skills Bridge initialized\n");

    // Spawn event listener task
    let event_listener = tokio::spawn(async move {
        println!("👂 Event listener started\n");
        while let Some(event) = event_rx.recv().await {
            match event {
                OrchestratorEvent::SkillCompleted { skill_name, phase, metadata } => {
                    println!("📬 Event received: SkillCompleted");
                    println!("   Skill: {}", skill_name);
                    println!("   Phase: {:?}", phase);
                    println!("   Metadata: {:?}", metadata);
                    println!();
                }
                OrchestratorEvent::StopTokenDetected { workflow_id, step_id, context } => {
                    println!("📬 Event received: StopTokenDetected");
                    println!("   Workflow ID: {}", workflow_id);
                    println!("   Step ID: {}", step_id);
                    println!("   Context: {:?}", context);
                    println!();
                }
                OrchestratorEvent::ErrorDetected { skill_name, error_message, severity } => {
                    println!("📬 Event received: ErrorDetected");
                    println!("   Skill: {}", skill_name);
                    println!("   Error: {}", error_message);
                    println!("   Severity: {:?}", severity);
                    println!();
                }
                OrchestratorEvent::QualityCheckResult { score, passed, recommendations } => {
                    println!("📬 Event received: QualityCheckResult");
                    println!("   Score: {:.1}/100", score);
                    println!("   Passed: {}", passed);
                    println!("   Recommendations: {:?}", recommendations);
                    println!();
                }
            }
        }
    });

    // Demo 1: Trigger SkillCompleted event
    println!("🔧 Demo 1: Triggering SkillCompleted event");
    let mut metadata = HashMap::new();
    metadata.insert("tests_passed".to_string(), "42".to_string());
    metadata.insert("duration_ms".to_string(), "1234".to_string());

    bridge.trigger_orchestrator(OrchestratorEvent::SkillCompleted {
        skill_name: "rust-development".to_string(),
        phase: Some("Phase 4".to_string()),
        metadata,
    })?;

    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Demo 2: Trigger StopTokenDetected event
    println!("🔧 Demo 2: Triggering StopTokenDetected event");
    let mut context = HashMap::new();
    context.insert("ISSUE_NUMBER".to_string(), "809".to_string());
    context.insert("OUTPUT_SIZE".to_string(), "1024".to_string());

    bridge.trigger_orchestrator(OrchestratorEvent::StopTokenDetected {
        workflow_id: "wf_123".to_string(),
        step_id: "ai_output_complete".to_string(),
        context,
    })?;

    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Demo 3: Trigger ErrorDetected event
    println!("🔧 Demo 3: Triggering ErrorDetected event");
    bridge.trigger_orchestrator(OrchestratorEvent::ErrorDetected {
        skill_name: "debugging-troubleshooting".to_string(),
        error_message: "Test compilation failed: undefined reference to `main`".to_string(),
        severity: ErrorSeverity::Error,
    })?;

    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Demo 4: Trigger QualityCheckResult event
    println!("🔧 Demo 4: Triggering QualityCheckResult event");
    bridge.trigger_orchestrator(OrchestratorEvent::QualityCheckResult {
        score: 85.5,
        passed: true,
        recommendations: vec![
            "Fix 3 clippy warnings".to_string(),
            "Add unit tests for new functions".to_string(),
        ],
    })?;

    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Demo 5: Execute a skill (will fail because script doesn't exist in this demo)
    println!("🔧 Demo 5: Attempting to execute a skill (expected to fail)");
    let mut skill_context = HashMap::new();
    skill_context.insert("ISSUE_NUMBER".to_string(), "809".to_string());
    skill_context.insert("TASK".to_string(), "Run tests".to_string());

    let request = SkillRequest { skill_name: "demo-skill".to_string(), context: skill_context, timeout_secs: 10 };

    match bridge.execute_skill(request).await {
        Ok(result) => {
            println!("   ✅ Skill executed successfully");
            println!("   Result: {:?}", result);
        }
        Err(e) => {
            println!("   ❌ Skill execution failed (expected): {}", e);
        }
    }

    println!();

    // Demo 6: Serialize and deserialize events
    println!("🔧 Demo 6: JSON serialization/deserialization");

    let event = OrchestratorEvent::SkillCompleted {
        skill_name: "security-audit".to_string(),
        phase: Some("Phase 6".to_string()),
        metadata: HashMap::new(),
    };

    let json = serde_json::to_string_pretty(&event)?;
    println!("   JSON representation:");
    println!("{}", json);

    let deserialized: OrchestratorEvent = serde_json::from_str(&json)?;
    println!("   ✅ Successfully deserialized");
    println!("   Event: {:?}", deserialized);
    println!();

    // Wait for event listener to finish
    println!("🏁 Demo complete. Shutting down...");
    drop(bridge); // Drop bridge to close event channel
    let _ = tokio::time::timeout(tokio::time::Duration::from_secs(1), event_listener).await;

    println!("✅ All demos completed successfully!");

    Ok(())
}
