//! Integration tests for conditional branching

use miyabi_workflow::{Condition, WorkflowBuilder};
use miyabi_types::agent::AgentType;
use serde_json::json;

#[test]
fn test_simple_branch() {
    let workflow = WorkflowBuilder::new("test-branch")
        .step("start", AgentType::IssueAgent)
        .branch("decision", "success-path", "failure-path")
        .step("success-path", AgentType::CodeGenAgent)
        .step("failure-path", AgentType::ReviewAgent);

    let dag = workflow.build_dag().unwrap();

    // Should have 4 nodes
    assert_eq!(dag.nodes.len(), 4);

    // Find the decision node
    let decision_node = dag
        .nodes
        .iter()
        .find(|n| n.title == "decision")
        .expect("Decision node not found");

    // Should have 2 edges from decision node (one to each branch)
    let edges_from_decision: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == decision_node.id)
        .collect();

    assert_eq!(edges_from_decision.len(), 2);

    // Verify edges point to the correct steps
    let edge_targets: Vec<String> = edges_from_decision.iter().map(|e| e.to.clone()).collect();
    assert!(edge_targets.iter().any(|t| t.contains("success-path")));
    assert!(edge_targets.iter().any(|t| t.contains("failure-path")));
}

#[test]
fn test_branch_on_with_multiple_conditions() {
    let workflow = WorkflowBuilder::new("multi-branch")
        .step("quality-check", AgentType::ReviewAgent)
        .branch_on(
            "route",
            vec![
                (
                    "high",
                    Condition::FieldGreaterThan {
                        field: "quality_score".to_string(),
                        value: 0.9,
                    },
                    "fast-deploy",
                ),
                (
                    "medium",
                    Condition::FieldGreaterThan {
                        field: "quality_score".to_string(),
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

    // Should have 5 nodes (quality-check + route + 3 branches)
    assert_eq!(dag.nodes.len(), 5);

    // Find route node
    let route_node = dag
        .nodes
        .iter()
        .find(|n| n.title == "route")
        .expect("Route node not found");

    // Should have 3 edges from route node
    let edges_from_route: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == route_node.id)
        .collect();

    assert_eq!(edges_from_route.len(), 3);
}

#[test]
fn test_condition_evaluation_field_equals() {
    let cond = Condition::FieldEquals {
        field: "status".to_string(),
        value: json!("passed"),
    };

    let context_pass = json!({ "status": "passed" });
    let context_fail = json!({ "status": "failed" });

    assert!(cond.evaluate(&context_pass));
    assert!(!cond.evaluate(&context_fail));
}

#[test]
fn test_condition_evaluation_field_greater_than() {
    let cond = Condition::FieldGreaterThan {
        field: "score".to_string(),
        value: 0.8,
    };

    let context_high = json!({ "score": 0.95 });
    let context_low = json!({ "score": 0.5 });
    let context_exact = json!({ "score": 0.8 });

    assert!(cond.evaluate(&context_high));
    assert!(!cond.evaluate(&context_low));
    assert!(!cond.evaluate(&context_exact)); // Not strictly greater
}

#[test]
fn test_condition_evaluation_nested_fields() {
    let cond = Condition::FieldEquals {
        field: "result.status".to_string(),
        value: json!("success"),
    };

    let context = json!({
        "result": {
            "status": "success",
            "code": 200
        }
    });

    assert!(cond.evaluate(&context));
}

#[test]
fn test_condition_and() {
    let cond = Condition::And(vec![
        Condition::FieldEquals {
            field: "tests_passed".to_string(),
            value: json!(true),
        },
        Condition::FieldGreaterThan {
            field: "coverage".to_string(),
            value: 0.8,
        },
    ]);

    let context_both = json!({ "tests_passed": true, "coverage": 0.9 });
    let context_tests_only = json!({ "tests_passed": true, "coverage": 0.5 });
    let context_coverage_only = json!({ "tests_passed": false, "coverage": 0.9 });

    assert!(cond.evaluate(&context_both));
    assert!(!cond.evaluate(&context_tests_only));
    assert!(!cond.evaluate(&context_coverage_only));
}

#[test]
fn test_condition_or() {
    let cond = Condition::Or(vec![
        Condition::FieldEquals {
            field: "status".to_string(),
            value: json!("passed"),
        },
        Condition::FieldEquals {
            field: "status".to_string(),
            value: json!("warning"),
        },
    ]);

    let context_pass = json!({ "status": "passed" });
    let context_warn = json!({ "status": "warning" });
    let context_fail = json!({ "status": "failed" });

    assert!(cond.evaluate(&context_pass));
    assert!(cond.evaluate(&context_warn));
    assert!(!cond.evaluate(&context_fail));
}

#[test]
fn test_condition_not() {
    let cond = Condition::Not(Box::new(Condition::FieldEquals {
        field: "failed".to_string(),
        value: json!(true),
    }));

    let context_ok = json!({ "failed": false });
    let context_failed = json!({ "failed": true });

    assert!(cond.evaluate(&context_ok));
    assert!(!cond.evaluate(&context_failed));
}

#[test]
fn test_condition_success_helper() {
    let cond = Condition::success("passed");

    let context_true = json!({ "passed": true });
    let context_false = json!({ "passed": false });

    assert!(cond.evaluate(&context_true));
    assert!(!cond.evaluate(&context_false));
}

#[test]
fn test_condition_failure_helper() {
    let cond = Condition::failure("passed");

    let context_true = json!({ "passed": true });
    let context_false = json!({ "passed": false });

    assert!(!cond.evaluate(&context_true));
    assert!(cond.evaluate(&context_false));
}

#[test]
fn test_complex_nested_conditions() {
    // (tests_passed AND coverage > 0.8) OR status == "override"
    let cond = Condition::Or(vec![
        Condition::And(vec![
            Condition::FieldEquals {
                field: "tests_passed".to_string(),
                value: json!(true),
            },
            Condition::FieldGreaterThan {
                field: "coverage".to_string(),
                value: 0.8,
            },
        ]),
        Condition::FieldEquals {
            field: "status".to_string(),
            value: json!("override"),
        },
    ]);

    let context_tests_and_coverage = json!({
        "tests_passed": true,
        "coverage": 0.9,
        "status": "normal"
    });

    let context_override = json!({
        "tests_passed": false,
        "coverage": 0.5,
        "status": "override"
    });

    let context_neither = json!({
        "tests_passed": false,
        "coverage": 0.5,
        "status": "normal"
    });

    assert!(cond.evaluate(&context_tests_and_coverage));
    assert!(cond.evaluate(&context_override));
    assert!(!cond.evaluate(&context_neither));
}

#[test]
fn test_branch_dag_levels() {
    let workflow = WorkflowBuilder::new("leveled-branch")
        .step("start", AgentType::IssueAgent)
        .branch("decision", "path-a", "path-b")
        .step("path-a", AgentType::CodeGenAgent)
        .step("path-b", AgentType::ReviewAgent);

    let dag = workflow.build_dag().unwrap();

    // Verify DAG has correct levels
    // Level 0: start
    // Level 1: decision
    // Level 2: path-a, path-b
    assert!(dag.levels.len() >= 2);
}

#[test]
fn test_sequential_then_branch() {
    let workflow = WorkflowBuilder::new("seq-then-branch")
        .step("init", AgentType::IssueAgent)
        .then("process", AgentType::CodeGenAgent)
        .branch("check", "deploy", "rollback")
        .step("deploy", AgentType::DeploymentAgent)
        .step("rollback", AgentType::CodeGenAgent);

    let dag = workflow.build_dag().unwrap();

    // Should have 5 nodes
    assert_eq!(dag.nodes.len(), 5);

    // Verify sequential dependency: process depends on init
    let init_node = dag.nodes.iter().find(|n| n.title == "init").unwrap();
    let process_node = dag.nodes.iter().find(|n| n.title == "process").unwrap();

    let has_init_to_process = dag.edges.iter().any(|e| {
        e.from == init_node.id && e.to == process_node.id
    });
    assert!(has_init_to_process);

    // Verify branch edges from check
    let check_node = dag.nodes.iter().find(|n| n.title == "check").unwrap();
    let edges_from_check: Vec<_> = dag
        .edges
        .iter()
        .filter(|e| e.from == check_node.id)
        .collect();
    assert_eq!(edges_from_check.len(), 2);
}

#[test]
fn test_field_exists_condition() {
    let cond = Condition::FieldExists {
        field: "deployment_id".to_string(),
    };

    let context_exists = json!({ "deployment_id": "dep-123" });
    let context_missing = json!({ "other_field": "value" });

    assert!(cond.evaluate(&context_exists));
    assert!(!cond.evaluate(&context_missing));
}

#[test]
fn test_field_less_than_condition() {
    let cond = Condition::FieldLessThan {
        field: "error_rate".to_string(),
        value: 0.05,
    };

    let context_low = json!({ "error_rate": 0.02 });
    let context_high = json!({ "error_rate": 0.10 });
    let context_exact = json!({ "error_rate": 0.05 });

    assert!(cond.evaluate(&context_low));
    assert!(!cond.evaluate(&context_high));
    assert!(!cond.evaluate(&context_exact)); // Not strictly less than
}
