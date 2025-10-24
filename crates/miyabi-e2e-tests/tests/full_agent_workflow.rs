//! Full Agent Workflow E2E Test
//!
//! This test demonstrates the complete end-to-end workflow:
//! 1. Issue creation and analysis
//! 2. Task decomposition by CoordinatorAgent
//! 3. Code generation (simulated)
//! 4. Code review
//! 5. PR creation (mocked)
//!
//! Run with:
//! ```bash
//! cargo test --package miyabi-e2e-tests --test full_agent_workflow
//! ```

use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_agent_workflow::IssueAgent;
use miyabi_e2e_tests::{
    create_test_commit, create_test_file, TestHarness,
};
use serial_test::serial;

#[tokio::test]
#[serial]
async fn test_e2e_issue_to_plans_workflow() {
    // Initialize test harness with mock GitHub
    let harness = TestHarness::builder()
        .with_mock_github()
        .with_temp_prefix("miyabi-e2e-")
        .build()
        .await;

    println!("🚀 Starting E2E Test: Issue → Analysis → Decomposition → Plans.md");
    println!("{}", "=".repeat(80));

    // Setup: Initialize git repository
    harness
        .init_git_repo()
        .await
        .expect("Failed to initialize git repo");
    harness
        .create_initial_commit()
        .await
        .expect("Failed to create initial commit");

    println!("✅ Test environment initialized");

    // Step 1: Create test issue
    println!("\n📝 Step 1: Create Test Issue");
    let issue = harness.fixtures().sample_issue();
    println!("  Issue #{}: {}", issue.number, issue.title);
    println!("  Body: {}", issue.body);

    // Add issue to mock GitHub
    if let Some(mock) = harness.mock_github() {
        let mock_issue = miyabi_e2e_tests::mocks::MockIssueResponse {
            number: issue.number,
            title: issue.title.clone(),
            body: issue.body.clone(),
            state: "open".to_string(),
            labels: vec![],
        };
        mock.add_issue(mock_issue).await;
        println!("  ✅ Issue added to mock GitHub");
    }

    // Step 2: Analyze issue with IssueAgent
    println!("\n📝 Step 2: Analyze Issue with IssueAgent");
    let issue_agent = IssueAgent::new(harness.config().clone());
    let analysis = issue_agent
        .analyze_issue(&issue)
        .expect("Failed to analyze issue");

    println!("  Issue Type: {:?}", analysis.issue_type);
    println!("  Severity: {:?}", analysis.severity);
    println!("  Impact: {:?}", analysis.impact);
    println!("  Assigned Agent: {:?}", analysis.assigned_agent);
    println!("  Estimated Duration: {} min", analysis.estimated_duration);
    println!("  Labels: {:?}", analysis.labels);

    assert!(!analysis.labels.is_empty(), "Should generate labels");
    println!("  ✅ Issue analyzed successfully");

    // Step 3: Decompose issue with CoordinatorAgent
    println!("\n📝 Step 3: Decompose Issue with CoordinatorAgent");
    let coordinator = CoordinatorAgent::new(harness.config().clone());
    let decomposition = coordinator
        .decompose_issue(&issue)
        .await
        .expect("Failed to decompose issue");

    println!("  Tasks Created: {}", decomposition.tasks.len());
    println!(
        "  Total Duration: {} min",
        decomposition.estimated_total_duration
    );
    println!("  Has Cycles: {}", decomposition.has_cycles);

    for (i, task) in decomposition.tasks.iter().enumerate() {
        println!(
            "    Task {}: {} ({:?}, {} min)",
            i + 1,
            task.title,
            task.task_type,
            task.estimated_duration.unwrap_or(0)
        );
    }

    assert!(
        !decomposition.tasks.is_empty(),
        "Should create at least one task"
    );
    println!("  ✅ Issue decomposed successfully");

    // Step 4: Generate Plans.md
    println!("\n📝 Step 4: Generate Plans.md");
    let plans_md = coordinator.generate_plans_md(&decomposition);

    println!("  Plans.md Length: {} bytes", plans_md.len());
    assert!(plans_md.contains(&format!("# Plans for Issue #{}", issue.number)));
    assert!(plans_md.contains("```mermaid"), "Should contain Mermaid diagram");
    assert!(plans_md.contains("graph TD"), "Should contain task graph");

    // Save Plans.md to test directory
    let plans_path = harness.context().path("Plans.md");
    tokio::fs::write(&plans_path, &plans_md)
        .await
        .expect("Failed to write Plans.md");

    println!("  ✅ Plans.md generated and saved");

    // Step 5: Verify Plans.md content
    println!("\n📝 Step 5: Verify Plans.md Content");
    let plans_content = tokio::fs::read_to_string(&plans_path)
        .await
        .expect("Failed to read Plans.md");

    assert!(plans_content.contains("## Summary"));
    assert!(plans_content.contains("## Task Breakdown"));
    assert!(plans_content.contains("## Dependencies"));
    assert!(plans_content.contains("## Execution Plan"));

    println!("  ✅ Plans.md content verified");

    // Step 6: Verify mock GitHub state
    if let Some(mock) = harness.mock_github() {
        println!("\n📝 Step 6: Verify Mock GitHub State");
        let issues = mock.get_issues().await;
        assert_eq!(issues.len(), 1, "Should have one issue");
        println!("  ✅ Mock GitHub state verified");
    }

    // Summary
    println!("\n📊 Test Summary:");
    println!("  ✅ Issue created and analyzed");
    println!("  ✅ {} tasks decomposed", decomposition.tasks.len());
    println!("  ✅ Plans.md generated ({} bytes)", plans_md.len());
    println!(
        "  ✅ Total estimated time: {} minutes",
        decomposition.estimated_total_duration
    );

    // Cleanup
    harness.cleanup().await;
    println!("\n🎉 E2E Test Complete: All steps passed!");
}

#[tokio::test]
#[serial]
async fn test_e2e_worktree_workflow() {
    println!("🚀 Starting E2E Test: Worktree Workflow");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder()
        .with_temp_prefix("miyabi-worktree-e2e-")
        .build()
        .await;

    // Initialize git repo
    harness
        .init_git_repo()
        .await
        .expect("Failed to init git repo");
    harness
        .create_initial_commit()
        .await
        .expect("Failed to create initial commit");

    println!("✅ Test environment initialized");

    // Step 1: Create test files
    println!("\n📝 Step 1: Create Test Files");
    let src_dir = harness.context().path("src");
    tokio::fs::create_dir_all(&src_dir)
        .await
        .expect("Failed to create src directory");

    let lib_rs = create_test_file(
        &src_dir,
        "lib.rs",
        r#"//! Test library

pub fn hello() -> String {
    "Hello, E2E Test!".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hello() {
        assert_eq!(hello(), "Hello, E2E Test!");
    }
}
"#,
    )
    .await
    .expect("Failed to create lib.rs");

    println!("  ✅ Created: {:?}", lib_rs);

    // Step 2: Commit changes
    println!("\n📝 Step 2: Commit Changes");
    create_test_commit(
        harness.context().root_path(),
        "feat: add test library with hello function",
    )
    .await
    .expect("Failed to commit");
    println!("  ✅ Changes committed");

    // Step 3: Verify git history
    println!("\n📝 Step 3: Verify Git History");
    let output = tokio::process::Command::new("git")
        .args(["log", "--oneline"])
        .current_dir(harness.context().root_path())
        .output()
        .await
        .expect("Failed to run git log");

    let log = String::from_utf8_lossy(&output.stdout);
    assert!(log.contains("feat: add test library"));
    assert!(log.contains("Initial commit"));
    println!("  ✅ Git history verified");

    // Summary
    println!("\n📊 Test Summary:");
    println!("  ✅ Test files created");
    println!("  ✅ Changes committed");
    println!("  ✅ Git history verified");

    harness.cleanup().await;
    println!("\n🎉 Worktree E2E Test Complete!");
}

#[tokio::test]
#[serial]
async fn test_e2e_mock_github_api() {
    println!("🚀 Starting E2E Test: Mock GitHub API");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder().with_mock_github().build().await;

    let mock = harness
        .mock_github()
        .expect("Mock GitHub should be available");

    // Step 1: Create issues
    println!("\n📝 Step 1: Create Test Issues");
    let issue1 = miyabi_e2e_tests::mocks::MockIssueResponse {
        number: 100,
        title: "Feature: Add authentication".to_string(),
        body: "Implement OAuth2".to_string(),
        state: "open".to_string(),
        labels: vec![],
    };

    let issue2 = miyabi_e2e_tests::mocks::MockIssueResponse {
        number: 101,
        title: "Bug: Fix memory leak".to_string(),
        body: "Worker pool memory leak".to_string(),
        state: "open".to_string(),
        labels: vec![],
    };

    mock.add_issue(issue1.clone()).await;
    mock.add_issue(issue2.clone()).await;
    println!("  ✅ Created 2 issues");

    // Step 2: Verify issues
    println!("\n📝 Step 2: Verify Issues");
    let issues = mock.get_issues().await;
    assert_eq!(issues.len(), 2);
    println!("  ✅ Found {} issues", issues.len());

    // Step 3: Create PR
    println!("\n📝 Step 3: Create Pull Request");
    let pr = miyabi_e2e_tests::mocks::MockPRResponse {
        number: 200,
        title: "feat: implement authentication".to_string(),
        body: "Resolves #100".to_string(),
        head: "feature/auth".to_string(),
        base: "main".to_string(),
        state: "open".to_string(),
    };

    mock.add_pr(pr.clone()).await;
    println!("  ✅ Created PR #{}", pr.number);

    // Step 4: Verify PR
    println!("\n📝 Step 4: Verify Pull Request");
    let prs = mock.get_prs().await;
    assert_eq!(prs.len(), 1);
    assert_eq!(prs[0].number, 200);
    println!("  ✅ PR verified");

    // Step 5: Reset and verify
    println!("\n📝 Step 5: Reset Mock State");
    mock.reset().await;
    let issues_after_reset = mock.get_issues().await;
    let prs_after_reset = mock.get_prs().await;
    assert_eq!(issues_after_reset.len(), 0);
    assert_eq!(prs_after_reset.len(), 0);
    println!("  ✅ Mock state reset verified");

    // Summary
    println!("\n📊 Test Summary:");
    println!("  ✅ Issues created and verified");
    println!("  ✅ PR created and verified");
    println!("  ✅ Mock state reset verified");

    harness.cleanup().await;
    println!("\n🎉 Mock GitHub API Test Complete!");
}
