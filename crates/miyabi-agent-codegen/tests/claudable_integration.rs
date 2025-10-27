//! Integration tests for Claudable + CodeGenAgent
//!
//! These tests require:
//! 1. Claudable Docker container running: `docker-compose --profile claudable up -d`
//! 2. ANTHROPIC_API_KEY set in environment
//!
//! Run with: `cargo test --package miyabi-agent-codegen --test claudable_integration -- --ignored`

use miyabi_agent_codegen::CodeGenAgent;
use miyabi_types::{AgentConfig, AgentType, Task};
use miyabi_types::task::TaskType;
use tempfile::TempDir;

fn create_test_config() -> AgentConfig {
    AgentConfig {
        device_identifier: "test-device".to_string(),
        github_token: "test-token".to_string(),
        repo_owner: Some("test-owner".to_string()),
        repo_name: Some("test-repo".to_string()),
        use_task_tool: false,
        use_worktree: false,
        worktree_base_path: None,
        log_directory: "./logs".to_string(),
        report_directory: "./reports".to_string(),
        tech_lead_github_username: None,
        ciso_github_username: None,
        po_github_username: None,
        firebase_production_project: None,
        firebase_staging_project: None,
        production_url: None,
        staging_url: None,
    }
}

fn create_frontend_task(title: &str, description: &str) -> Task {
    Task {
        id: "test-frontend-1".to_string(),
        title: title.to_string(),
        description: description.to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: Some(30),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    }
}

#[tokio::test]
#[ignore] // Requires Claudable server running
async fn test_frontend_task_detection() {
    let config = create_test_config();
    let _agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let task = create_frontend_task(
        "Create dashboard UI",
        "Build a dashboard with charts and tables",
    );

    // Verify frontend detection
    use miyabi_agent_codegen::frontend::is_frontend_task;
    assert!(
        is_frontend_task(&task),
        "Task should be detected as frontend"
    );
}

#[tokio::test]
#[ignore] // Requires Claudable server + ANTHROPIC_API_KEY
async fn test_claudable_code_generation() {
    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let task = create_frontend_task(
        "Create simple homepage",
        "Build a Next.js homepage with a header and footer",
    );

    // Generate code (without worktree)
    let result = agent.generate_code(&task, None).await;

    assert!(result.is_ok(), "Code generation should succeed");

    let code_result = result.unwrap();
    assert!(
        !code_result.files_created.is_empty(),
        "Should create at least one file"
    );
    assert!(code_result.lines_added > 0, "Should add some lines of code");
}

#[tokio::test]
#[ignore] // Requires Claudable server + npm
async fn test_worktree_file_writing() {
    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let temp_dir = TempDir::new().unwrap();
    let worktree_path = temp_dir.path();

    let task = create_frontend_task(
        "Create landing page",
        "Build a marketing landing page with hero section",
    );

    // Generate code with worktree
    let result = agent.generate_code(&task, Some(worktree_path)).await;

    assert!(
        result.is_ok(),
        "Code generation with worktree should succeed"
    );

    let code_result = result.unwrap();

    // Verify files were created
    assert!(
        !code_result.files_created.is_empty(),
        "Should create files in worktree"
    );

    // Verify at least one file exists
    let first_file = &code_result.files_created[0];
    let file_path = worktree_path.join(first_file);
    assert!(
        file_path.exists(),
        "Generated file should exist: {}",
        first_file
    );
}

#[tokio::test]
#[ignore] // Requires Claudable server + npm (long running ~2min)
async fn test_npm_install() {
    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let temp_dir = TempDir::new().unwrap();
    let worktree_path = temp_dir.path();

    let task = create_frontend_task("Create simple app", "Build a minimal Next.js application");

    // Generate code with worktree (includes npm install)
    let result = agent.generate_code(&task, Some(worktree_path)).await;

    assert!(result.is_ok(), "npm install should complete successfully");

    // Verify node_modules exists
    let node_modules = worktree_path.join("node_modules");
    assert!(
        node_modules.exists(),
        "node_modules directory should exist after npm install"
    );
}

#[tokio::test]
#[ignore] // Requires Claudable server + npm (long running ~3min)
async fn test_nextjs_build() {
    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let temp_dir = TempDir::new().unwrap();
    let worktree_path = temp_dir.path();

    let task = create_frontend_task(
        "Create dashboard",
        "Build a dashboard with data visualization",
    );

    // Generate code with worktree (includes npm install + build)
    let result = agent.generate_code(&task, Some(worktree_path)).await;

    assert!(result.is_ok(), "Next.js build should complete successfully");

    // Verify .next directory exists (build output)
    let next_dir = worktree_path.join(".next");
    assert!(
        next_dir.exists(),
        ".next directory should exist after build"
    );
}

#[tokio::test]
#[ignore] // Requires Claudable server (E2E scenario test)
async fn test_e2e_dashboard_generation() {
    // Scenario: User requests dashboard via LINE Bot → Issue created → CodeGen → Claudable → PR

    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let temp_dir = TempDir::new().unwrap();
    let worktree_path = temp_dir.path();

    // Simulate LINE Bot request
    let task = create_frontend_task(
        "売上ダッシュボードを作って",
        "グラフと表を表示したい。レスポンシブ対応で。",
    );

    // 1. Verify frontend detection
    use miyabi_agent_codegen::frontend::is_frontend_task;
    assert!(is_frontend_task(&task), "Should detect as frontend task");

    // 2. Generate code
    let result = agent.generate_code(&task, Some(worktree_path)).await;
    assert!(result.is_ok(), "Code generation should succeed");

    let code_result = result.unwrap();

    // 3. Verify output
    assert!(
        !code_result.files_created.is_empty(),
        "Should create Next.js files"
    );
    assert!(
        code_result.lines_added > 50,
        "Should generate substantial code"
    );

    // 4. Verify Next.js structure
    assert!(
        worktree_path.join("package.json").exists(),
        "Should have package.json"
    );
    assert!(
        worktree_path.join("app").exists(),
        "Should have app/ directory (Next.js 14+ App Router)"
    );
}

#[tokio::test]
#[ignore] // Requires Claudable server
async fn test_e2e_landing_page_generation() {
    // Scenario: Marketing team requests landing page

    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    let temp_dir = TempDir::new().unwrap();
    let worktree_path = temp_dir.path();

    let task = create_frontend_task(
        "Create Miyabi landing page",
        "Build a SaaS landing page with hero section, features grid (6 items), pricing table (3 tiers), and footer",
    );

    // Generate code
    let result = agent.generate_code(&task, Some(worktree_path)).await;
    assert!(result.is_ok(), "Landing page generation should succeed");

    let code_result = result.unwrap();

    // Verify substantial code generated
    assert!(
        code_result.lines_added > 100,
        "Landing page should have 100+ lines of code"
    );

    // Verify Tailwind CSS usage (common in landing pages)
    let package_json_path = worktree_path.join("package.json");
    if package_json_path.exists() {
        let package_json = std::fs::read_to_string(package_json_path).unwrap();
        assert!(package_json.contains("tailwind"), "Should use Tailwind CSS");
    }
}

#[tokio::test]
async fn test_non_frontend_task_skips_claudable() {
    let config = create_test_config();
    let agent = CodeGenAgent::new_with_claudable(config).unwrap();

    // Non-frontend task
    let task = Task {
        id: "backend-1".to_string(),
        title: "Fix database bug".to_string(),
        description: "Optimize SQL query execution speed".to_string(),
        task_type: TaskType::Bug,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: Some(20),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    // Should NOT detect as frontend
    use miyabi_agent_codegen::frontend::is_frontend_task;
    assert!(
        !is_frontend_task(&task),
        "Backend task should not be detected as frontend"
    );

    // Code generation should use fallback (empty result for test config without LLM)
    let result = agent.generate_code(&task, None).await;
    assert!(result.is_ok(), "Should handle non-frontend task gracefully");
}
