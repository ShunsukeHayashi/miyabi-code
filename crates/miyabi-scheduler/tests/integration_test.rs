//! Integration tests for Water Spider Orchestrator

use miyabi_scheduler::{
    AggregatedResult, AgentResult, LoadBalancer, Machine, MilestoneConfig,
    MilestoneState, MilestoneUpdater, PRConfig, PRCreator, ResultAggregator, SshConfig,
};

/// Test complete aggregation workflow
#[tokio::test]
async fn test_aggregation_workflow() {
    let mut aggregator = ResultAggregator::new();

    // Add successful result
    let result1 = AgentResult {
        status: 0,
        success: true,
        message: "Task 1 completed".to_string(),
        error: None,
        files: vec!["src/main.rs".to_string(), "src/lib.rs".to_string()],
    };
    aggregator.add_result("session-1".to_string(), result1);

    // Add failed result
    let result2 = AgentResult {
        status: 1,
        success: false,
        message: "Task 2 failed".to_string(),
        error: Some("Compilation error".to_string()),
        files: vec![],
    };
    aggregator.add_result("session-2".to_string(), result2);

    // Add another successful result
    let result3 = AgentResult {
        status: 0,
        success: true,
        message: "Task 3 completed".to_string(),
        error: None,
        files: vec!["src/lib.rs".to_string(), "tests/test.rs".to_string()],
    };
    aggregator.add_result("session-3".to_string(), result3);

    // Aggregate results
    let aggregated = aggregator.aggregate().unwrap();

    assert_eq!(aggregated.total_sessions, 3);
    assert_eq!(aggregated.successful_sessions, 2);
    assert_eq!(aggregated.failed_sessions, 1);
    assert!((aggregated.success_rate - 0.666).abs() < 0.01);
    assert_eq!(aggregated.errors.len(), 1);
    assert!(aggregated.errors[0].contains("Compilation error"));

    // Check file deduplication
    assert_eq!(aggregated.modified_files.len(), 3);
    assert!(aggregated.modified_files.contains(&"src/main.rs".to_string()));
    assert!(aggregated.modified_files.contains(&"src/lib.rs".to_string()));
    assert!(aggregated.modified_files.contains(&"tests/test.rs".to_string()));

    // Verify summary
    let summary = aggregated.summary();
    assert!(summary.contains("2/3"));
    assert!(summary.contains("66."));
}

/// Test PR creation workflow
#[test]
fn test_pr_creation_workflow() {
    let config = PRConfig {
        owner: "customer-cloud".to_string(),
        repo: "miyabi-private".to_string(),
        base_branch: "main".to_string(),
        draft: false,
    };

    let creator = PRCreator::new(config);

    // Create test aggregated result
    let mut session_results = std::collections::HashMap::new();
    session_results.insert(
        "session-1".to_string(),
        AgentResult {
            status: 0,
            success: true,
            message: "Success".to_string(),
            error: None,
            files: vec!["file1.rs".to_string(), "file2.rs".to_string()],
        },
    );

    let result = AggregatedResult {
        total_sessions: 1,
        successful_sessions: 1,
        failed_sessions: 0,
        success_rate: 1.0,
        session_results,
        errors: vec![],
        modified_files: vec!["file1.rs".to_string(), "file2.rs".to_string()],
    };

    // Generate PR body (without actually creating PR)
    let body = creator.generate_pr_body(&result);

    assert!(body.contains("Summary"));
    assert!(body.contains("Statistics"));
    assert!(body.contains("Modified Files"));
    assert!(body.contains("file1.rs"));
    assert!(body.contains("file2.rs"));
    assert!(body.contains("1/1 sessions succeeded (100.0% success rate)"));
    assert!(body.contains("Water Spider Orchestrator"));
}

/// Test milestone update workflow
#[test]
fn test_milestone_update_workflow() {
    let config = MilestoneConfig {
        owner: "customer-cloud".to_string(),
        repo: "miyabi-private".to_string(),
    };

    let updater = MilestoneUpdater::new(config);

    // Create test milestone
    let milestone = miyabi_scheduler::Milestone {
        number: 37,
        title: "Water Spider v1.0".to_string(),
        description: Some("Complete orchestrator".to_string()),
        state: MilestoneState::Open,
        open_issues: 1,
        closed_issues: 4,
        progress: 80.0,
    };

    // Create test aggregated result
    let mut session_results = std::collections::HashMap::new();
    session_results.insert(
        "session-1".to_string(),
        AgentResult {
            status: 0,
            success: true,
            message: "Phase 5 completed".to_string(),
            error: None,
            files: vec!["src/aggregator.rs".to_string()],
        },
    );

    let result = AggregatedResult {
        total_sessions: 1,
        successful_sessions: 1,
        failed_sessions: 0,
        success_rate: 1.0,
        session_results,
        errors: vec![],
        modified_files: vec!["src/aggregator.rs".to_string()],
    };

    // Generate milestone comment (without actually updating milestone)
    let comment = updater.generate_milestone_comment(&result, &milestone);

    assert!(comment.contains("Water Spider Progress Update"));
    assert!(comment.contains("Water Spider v1.0"));
    assert!(comment.contains("80.0% complete"));
    assert!(comment.contains("Session Results"));
    assert!(comment.contains("1/1 sessions succeeded (100.0% success rate)"));
    assert!(comment.contains("Modified Files"));
    assert!(comment.contains("src/aggregator.rs"));
}

/// Test load balancer workflow
#[tokio::test]
async fn test_load_balancer_workflow() {
    // Create machines
    let machines = vec![
        Machine::new("macmini1".to_string(), "192.168.3.27".to_string(), 3),
        Machine::new("macmini2".to_string(), "192.168.3.26".to_string(), 2),
    ];

    let lb = LoadBalancer::new(machines, SshConfig::default());

    // Assign 5 tasks (full capacity)
    let mut assigned_machines = Vec::new();
    for i in 0..5 {
        let machine = lb.assign_task().await.unwrap();
        assigned_machines.push(machine.hostname.clone());
        println!(
            "Task {} assigned to {} ({}/{})",
            i + 1,
            machine.hostname,
            machine.running_sessions,
            machine.capacity
        );
    }

    // Verify fill-first strategy: macmini1 gets 3, macmini2 gets 2
    assert_eq!(
        assigned_machines.iter().filter(|m| *m == "macmini1").count(),
        3
    );
    assert_eq!(
        assigned_machines.iter().filter(|m| *m == "macmini2").count(),
        2
    );

    // Verify stats
    let stats = lb.get_stats().await;
    assert_eq!(stats.total_capacity, 5);
    assert_eq!(stats.used_capacity, 5);
    assert_eq!(stats.available_capacity, 0);

    // Should fail when no capacity
    let result = lb.assign_task().await;
    assert!(result.is_err());

    // Release a task from macmini1
    lb.release_task("macmini1").await;

    // Verify capacity recovered
    let stats = lb.get_stats().await;
    assert_eq!(stats.used_capacity, 4);
    assert_eq!(stats.available_capacity, 1);

    // Should succeed now
    let machine = lb.assign_task().await.unwrap();
    assert_eq!(machine.hostname, "macmini1");
}

/// Test end-to-end workflow
#[tokio::test]
async fn test_end_to_end_workflow() {
    // Phase 1: Execute sessions and collect results
    let mut aggregator = ResultAggregator::new();

    // Simulate 3 successful sessions
    for i in 1..=3 {
        let result = AgentResult {
            status: 0,
            success: true,
            message: format!("Task {} completed", i),
            error: None,
            files: vec![format!("src/task{}.rs", i)],
        };
        aggregator.add_result(format!("session-{}", i), result);
    }

    // Phase 2: Aggregate results
    let aggregated = aggregator.aggregate().unwrap();
    assert_eq!(aggregated.total_sessions, 3);
    assert!(aggregated.all_succeeded());
    assert_eq!(aggregated.modified_files.len(), 3);

    // Phase 3: Generate PR body
    let pr_config = PRConfig {
        owner: "customer-cloud".to_string(),
        repo: "miyabi-private".to_string(),
        base_branch: "main".to_string(),
        draft: false,
    };
    let pr_creator = PRCreator::new(pr_config);
    let pr_body = pr_creator.generate_pr_body(&aggregated);

    assert!(pr_body.contains("3/3 sessions succeeded (100.0% success rate)"));
    assert!(pr_body.contains("src/task1.rs"));
    assert!(pr_body.contains("src/task2.rs"));
    assert!(pr_body.contains("src/task3.rs"));

    // Phase 4: Generate milestone comment
    let milestone_config = MilestoneConfig {
        owner: "customer-cloud".to_string(),
        repo: "miyabi-private".to_string(),
    };
    let milestone_updater = MilestoneUpdater::new(milestone_config);

    let milestone = miyabi_scheduler::Milestone {
        number: 37,
        title: "Test Milestone".to_string(),
        description: None,
        state: MilestoneState::Open,
        open_issues: 0,
        closed_issues: 5,
        progress: 100.0,
    };

    let milestone_comment = milestone_updater.generate_milestone_comment(&aggregated, &milestone);
    assert!(milestone_comment.contains("100.0% complete"));
    assert!(milestone_comment.contains("3/3 sessions succeeded"));

    // Verify milestone is complete
    assert!(milestone.is_complete());
}

/// Test load balancer statistics
#[tokio::test]
async fn test_load_balancer_statistics() {
    let machines = vec![
        Machine::new("macmini1".to_string(), "192.168.3.27".to_string(), 3),
        Machine::new("macmini2".to_string(), "192.168.3.26".to_string(), 2),
    ];

    let lb = LoadBalancer::new(machines, SshConfig::default());

    // Initial stats
    let stats = lb.get_stats().await;
    assert_eq!(stats.total_machines, 2);
    assert_eq!(stats.available_machines, 2);
    assert_eq!(stats.total_capacity, 5);
    assert_eq!(stats.used_capacity, 0);
    assert_eq!(stats.available_capacity, 5);

    // Assign 2 tasks
    lb.assign_task().await.unwrap();
    lb.assign_task().await.unwrap();

    // Stats after assignment
    let stats = lb.get_stats().await;
    assert_eq!(stats.used_capacity, 2);
    assert_eq!(stats.available_capacity, 3);

    // Assign 3 more tasks (full capacity)
    lb.assign_task().await.unwrap();
    lb.assign_task().await.unwrap();
    lb.assign_task().await.unwrap();

    // Stats at full capacity
    let stats = lb.get_stats().await;
    assert_eq!(stats.available_machines, 0);
    assert_eq!(stats.used_capacity, 5);
    assert_eq!(stats.available_capacity, 0);
}
