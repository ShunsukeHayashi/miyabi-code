//! Integration tests for conditional branching functionality
//!
//! Tests the full workflow branching capabilities including:
//! - Simple pass/fail branches
//! - Complex multi-condition branches
//! - Condition evaluation with various data types
//! - DAG generation with conditional edges

use miyabi_types::agent::AgentType;
use miyabi_workflow::{Condition, WorkflowBuilder};
use serde_json::json;

#[tokio::test]
async fn test_conditional_branch_success() {
    let workflow = WorkflowBuilder::new("test")
        .step("start", AgentType::IssueAgent)
        .branch("decision", "success-path", "failure-path")
        .step("success-path", AgentType::CodeGenAgent)
        .step("failure-path", AgentType::ReviewAgent);

    let dag = workflow.build_dag().unwrap();

    // Verify DAG has conditional edges
    let decision_step = dag
        .nodes
        .iter()
        .find(|n| n.title.contains("decision"))
        .unwrap();

    let edges_from_decision: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == decision_step.id)
        .collect();

    assert_eq!(edges_from_decision.len(), 2); // 2 branches
}

#[test]
fn test_condition_evaluation() {
    let cond = Condition::FieldEquals {
        field: "status".to_string(),
        value: json!("passed"),
    };

    let context = json!({
        "status": "passed",
        "score": 95
    });

    assert!(cond.evaluate(&context));
}

#[test]
fn test_quality_based_branching() {
    let workflow = WorkflowBuilder::new("quality-check")
        .step("analyze", AgentType::ReviewAgent)
        .branch_on(
            "route",
            vec![
                (
                    "high",
                    Condition::FieldGreaterThan {
                        field: "quality".to_string(),
                        value: 0.9,
                    },
                    "fast-deploy",
                ),
                (
                    "medium",
                    Condition::FieldGreaterThan {
                        field: "quality".to_string(),
                        value: 0.7,
                    },
                    "manual-review",
                ),
                ("low", Condition::Always, "reject"),
            ],
        )
        .step("fast-deploy", AgentType::DeploymentAgent)
        .step("manual-review", AgentType::ReviewAgent)
        .step("reject", AgentType::CodeGenAgent);

    let dag = workflow.build_dag().unwrap();

    // Find the route step
    let route_step = dag.nodes.iter().find(|n| n.title == "route").unwrap();

    // Check that route step has edges to all three targets
    let edges_from_route: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == route_step.id)
        .collect();

    assert_eq!(edges_from_route.len(), 3);

    // Verify all targets are reachable
    let targets: Vec<&String> = edges_from_route.iter().map(|e| &e.to).collect();
    assert!(targets.iter().any(|t| *t == "fast-deploy"));
    assert!(targets.iter().any(|t| *t == "manual-review"));
    assert!(targets.iter().any(|t| *t == "reject"));
}

#[test]
fn test_nested_condition_with_and_or() {
    let condition = Condition::And(vec![
        Condition::FieldEquals {
            field: "status".to_string(),
            value: json!("completed"),
        },
        Condition::Or(vec![
            Condition::FieldGreaterThan {
                field: "quality".to_string(),
                value: 0.9,
            },
            Condition::FieldExists {
                field: "manual_approval".to_string(),
            },
        ]),
    ]);

    // High quality, no manual approval
    let context1 = json!({
        "status": "completed",
        "quality": 0.95
    });
    assert!(condition.evaluate(&context1));

    // Low quality, but manual approval exists
    let context2 = json!({
        "status": "completed",
        "quality": 0.7,
        "manual_approval": true
    });
    assert!(condition.evaluate(&context2));

    // Wrong status
    let context3 = json!({
        "status": "pending",
        "quality": 0.95
    });
    assert!(!condition.evaluate(&context3));
}

#[test]
fn test_ci_cd_workflow_with_branches() {
    let workflow = WorkflowBuilder::new("ci-cd")
        .step("build", AgentType::CodeGenAgent)
        .then("test", AgentType::ReviewAgent)
        .branch("deploy-decision", "production", "rollback")
        .step("production", AgentType::DeploymentAgent)
        .step("rollback", AgentType::CodeGenAgent);

    let dag = workflow.build_dag().unwrap();

    // Verify structure
    assert_eq!(dag.nodes.len(), 5);

    // Verify the decision step exists
    let decision_step = dag
        .nodes
        .iter()
        .find(|n| n.title == "deploy-decision")
        .unwrap();

    // Verify the decision step has exactly 2 outgoing edges
    let decision_edges: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == decision_step.id)
        .collect();
    assert_eq!(decision_edges.len(), 2);

    // Verify targets are production and rollback
    let targets: Vec<&String> = decision_edges.iter().map(|e| &e.to).collect();
    assert!(targets.iter().any(|t| *t == "production"));
    assert!(targets.iter().any(|t| *t == "rollback"));
}

#[test]
fn test_field_less_than_condition() {
    let condition = Condition::FieldLessThan {
        field: "error_rate".to_string(),
        value: 0.05,
    };

    let context_pass = json!({ "error_rate": 0.02 });
    assert!(condition.evaluate(&context_pass));

    let context_fail = json!({ "error_rate": 0.10 });
    assert!(!condition.evaluate(&context_fail));
}

#[test]
fn test_not_condition() {
    let condition = Condition::Not(Box::new(Condition::FieldEquals {
        field: "failed".to_string(),
        value: json!(true),
    }));

    let context_success = json!({ "failed": false });
    assert!(condition.evaluate(&context_success));

    let context_failed = json!({ "failed": true });
    assert!(!condition.evaluate(&context_failed));
}

#[test]
fn test_nested_field_path() {
    let condition = Condition::FieldGreaterThan {
        field: "result.metrics.score".to_string(),
        value: 80.0,
    };

    let context = json!({
        "result": {
            "metrics": {
                "score": 95.0
            }
        }
    });

    assert!(condition.evaluate(&context));
}

#[test]
fn test_multiple_sequential_branches() {
    let workflow = WorkflowBuilder::new("multi-branch")
        .step("start", AgentType::IssueAgent)
        .branch("first-decision", "path-a", "path-b")
        .step("path-a", AgentType::CodeGenAgent)
        .branch("second-decision", "final-success", "final-retry")
        .step("path-b", AgentType::ReviewAgent)
        .step("final-success", AgentType::DeploymentAgent)
        .step("final-retry", AgentType::CodeGenAgent);

    let dag = workflow.build_dag().unwrap();
    assert_eq!(dag.nodes.len(), 7);

    // Verify both branch points exist
    let first_branch = dag
        .nodes
        .iter()
        .find(|n| n.title == "first-decision")
        .unwrap();
    let second_branch = dag
        .nodes
        .iter()
        .find(|n| n.title == "second-decision")
        .unwrap();

    // Both should have 2 outgoing edges each
    let first_edges: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == first_branch.id)
        .collect();
    let second_edges: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == second_branch.id)
        .collect();

    assert_eq!(first_edges.len(), 2);
    assert_eq!(second_edges.len(), 2);
}
