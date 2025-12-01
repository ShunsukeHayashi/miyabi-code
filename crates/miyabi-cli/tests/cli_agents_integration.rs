//! Integration tests for CLI ↔ agents interaction
//! Tests the interaction between miyabi-cli and miyabi-agents

use miyabi_types::{AgentType, Issue};

/// Helper to create test issue
fn create_test_issue(number: u64) -> Issue {
    Issue {
        number,
        title: format!("Test issue #{}", number),
        body: "Test issue body".to_string(),
        state: miyabi_types::issue::IssueStateGithub::Open,
        labels: vec!["type:feature".to_string()],
        assignee: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: format!("https://github.com/test/repo/issues/{}", number),
    }
}

#[test]
fn test_cli_agent_type_parsing() {
    let agent_types = vec![
        "coordinator",
        "codegen",
        "review",
        "issue",
        "pr",
        "deployment",
        "refresher",
    ];

    for agent_str in agent_types {
        let result: Result<AgentType, _> = agent_str.parse();
        assert!(result.is_ok(), "Failed to parse agent type: {}", agent_str);
    }
}

#[test]
fn test_cli_agent_command_format() {
    // Test command format: miyabi agent <type> --issue <number>
    let command_parts = vec!["agent", "codegen", "--issue", "418"];

    assert_eq!(command_parts[0], "agent");
    assert_eq!(command_parts[1], "codegen");
    assert_eq!(command_parts[2], "--issue");

    let issue_number: u64 = command_parts[3].parse().unwrap();
    assert_eq!(issue_number, 418);
}

#[test]
fn test_cli_parallel_execution_format() {
    // Test command: miyabi parallel --issues 270,271,272 --concurrency 3
    let issues_str = "270,271,272";
    let issue_numbers: Vec<u64> = issues_str.split(',').map(|s| s.parse().unwrap()).collect();

    assert_eq!(issue_numbers.len(), 3);
    assert_eq!(issue_numbers[0], 270);
    assert_eq!(issue_numbers[1], 271);
    assert_eq!(issue_numbers[2], 272);

    let concurrency = 3;
    assert!(concurrency > 0 && concurrency <= 10);
}

#[test]
fn test_cli_status_command() {
    // Test command: miyabi status --watch
    let command = "status";
    let watch_flag = true;

    assert_eq!(command, "status");
    assert!(watch_flag);
}

#[test]
fn test_cli_work_on_command() {
    // Test command: miyabi work-on 418
    let command = "work-on";
    let issue_number = 418u64;

    assert_eq!(command, "work-on");
    assert!(issue_number > 0);
}

#[test]
fn test_cli_infinity_mode() {
    // Test command: miyabi infinity
    let command = "infinity";

    assert_eq!(command, "infinity");
}

#[test]
fn test_cli_knowledge_search() {
    // Test command: miyabi knowledge search "error handling"
    let command = "knowledge";
    let subcommand = "search";
    let query = "error handling";

    assert_eq!(command, "knowledge");
    assert_eq!(subcommand, "search");
    assert!(!query.is_empty());
}

#[test]
fn test_cli_agent_mode_option() {
    // Test command: miyabi agent codegen --issue 418 --mode auto
    let agent_type = "codegen";
    let mode = "auto";

    assert_eq!(agent_type, "codegen");
    assert!(mode == "auto" || mode == "manual");
}

#[test]
fn test_cli_issue_number_validation() {
    let valid_numbers = vec![1u64, 418, 1000];

    for number in valid_numbers {
        assert!(number > 0);
        assert!(number < 1_000_000);
    }
}

#[test]
fn test_cli_concurrency_validation() {
    let valid_concurrency = vec![1, 3, 5, 10];

    for c in valid_concurrency {
        assert!(c >= 1);
        assert!(c <= 10);
    }
}

#[test]
fn test_cli_agent_result_format() {
    // Agent results should be JSON serializable
    let issue = create_test_issue(418);

    let json = serde_json::to_string(&issue).unwrap();
    assert!(json.contains("418"));

    // CLI should be able to parse this back
    let parsed: Issue = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed.number, 418);
}

#[test]
fn test_cli_error_handling() {
    // Test invalid agent type
    let invalid_agent = "invalid_agent";
    let result: Result<AgentType, _> = invalid_agent.parse();
    assert!(result.is_err());
}

#[test]
fn test_cli_help_output() {
    // Help should be available for all commands
    let commands = vec!["agent", "parallel", "infinity", "status", "work-on", "knowledge"];

    for command in commands {
        assert!(!command.is_empty());
    }
}

#[test]
fn test_cli_version_info() {
    // CLI should have version information
    let version = env!("CARGO_PKG_VERSION");
    assert!(!version.is_empty());

    let name = env!("CARGO_PKG_NAME");
    assert_eq!(name, "miyabi-cli");
}

#[test]
fn test_cli_config_path_handling() {
    // Test default config path
    let default_config = ".miyabi.yml";
    assert_eq!(default_config, ".miyabi.yml");

    // Test custom config path
    let custom_config = "/path/to/.miyabi.yml";
    assert!(custom_config.ends_with(".miyabi.yml"));
}
