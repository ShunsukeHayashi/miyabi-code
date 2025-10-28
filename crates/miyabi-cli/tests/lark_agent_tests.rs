//! Lark Agent Integration Tests
//!
//! Tests for Lark Agent CLI commands including:
//! - C1-C10 command execution
//! - REPL context loading
//! - MCP tool integration

use std::process::Command;

/// Test C1 command execution
#[test]
fn test_c1_system_analysis() {
    let output = Command::new("cargo")
        .args(&[
            "run",
            "--quiet",
            "--bin",
            "miyabi",
            "--",
            "lark",
            "base",
            "C1",
            "--industry",
            "SaaS",
            "--domain",
            "営業管理",
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute C1 command");

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Verify command execution
    assert!(output.status.success(), "C1 command should succeed");

    // Verify output contains expected sections
    assert!(stdout.contains("C1: System Analysis"), "Should show C1 title");
    assert!(
        stdout.contains("システム要件を分析し、Lark Baseの構造に落とし込む"),
        "Should show Japanese description"
    );
    assert!(stdout.contains("Tasks:"), "Should show Tasks section");
    assert!(
        stdout.contains("T1: 要件定義"),
        "Should show T1 task"
    );
    assert!(
        stdout.contains("T2: データ構造設計"),
        "Should show T2 task"
    );
    assert!(
        stdout.contains("Deliverables:"),
        "Should show Deliverables section"
    );
    assert!(stdout.contains("要件定義書"), "Should show deliverable 1");
    assert!(stdout.contains("ER図"), "Should show deliverable 2");
    assert!(
        stdout.contains("Checklist:"),
        "Should show Checklist section"
    );
    assert!(
        stdout.contains("Industry: SaaS"),
        "Should show industry context"
    );
    assert!(
        stdout.contains("Domain: 営業管理"),
        "Should show domain context"
    );
    assert!(
        stdout.contains("✅ C1 completed"),
        "Should show completion message"
    );
}

/// Test C7 command execution (Dashboard Construction)
#[test]
fn test_c7_dashboard_construction() {
    let output = Command::new("cargo")
        .args(&[
            "run",
            "--quiet",
            "--bin",
            "miyabi",
            "--",
            "lark",
            "base",
            "C7",
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute C7 command");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success(), "C7 command should succeed");
    assert!(
        stdout.contains("C7: Dashboard Construction"),
        "Should show C7 title"
    );
    assert!(
        stdout.contains("分析ダッシュボードを構築"),
        "Should show Japanese description"
    );
    assert!(
        stdout.contains("3-Layer Structure:"),
        "Should show 3-layer structure"
    );
    assert!(
        stdout.contains("KPIカード層"),
        "Should mention KPI layer"
    );
    assert!(stdout.contains("グラフ層"), "Should mention graph layer");
    assert!(
        stdout.contains("詳細テーブル層"),
        "Should mention table layer"
    );
    assert!(
        stdout.contains("T1: KPIカード作成"),
        "Should show T1 task"
    );
    assert!(
        stdout.contains("T2: グラフ作成"),
        "Should show T2 task"
    );
    assert!(
        stdout.contains("✅ C7 completed"),
        "Should show completion message"
    );
}

/// Test ALL command execution (C1-C10)
#[test]
fn test_all_commands() {
    let output = Command::new("cargo")
        .args(&[
            "run",
            "--quiet",
            "--bin",
            "miyabi",
            "--",
            "lark",
            "base",
            "ALL",
            "--industry",
            "SaaS",
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute ALL command");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success(), "ALL command should succeed");

    // Verify all commands are executed
    assert!(stdout.contains("C1: System Analysis"));
    assert!(stdout.contains("C2: Field Implementation"));
    assert!(stdout.contains("C3: Relation Setup"));
    assert!(stdout.contains("C4: Workflow Automation"));
    assert!(stdout.contains("C5: Button Implementation"));
    assert!(stdout.contains("C6: View Creation"));
    assert!(stdout.contains("C7: Dashboard Construction"));
    assert!(stdout.contains("C8: Permission Setup"));
    assert!(stdout.contains("C9: Test & Verification"));
    assert!(stdout.contains("C10: Deployment"));

    // Verify completion
    assert!(
        stdout.contains("✅ All commands completed successfully!"),
        "Should show all completed message"
    );
}

/// Test invalid command handling
#[test]
fn test_invalid_command() {
    let output = Command::new("cargo")
        .args(&[
            "run",
            "--quiet",
            "--bin",
            "miyabi",
            "--",
            "lark",
            "base",
            "C99", // Invalid command
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute invalid command");

    let stderr = String::from_utf8_lossy(&output.stderr);

    assert!(!output.status.success(), "Invalid command should fail");
    assert!(
        stderr.contains("Invalid command") || stderr.contains("C99"),
        "Should show error for invalid command"
    );
}

/// Test C2 field implementation with critical warning
#[test]
fn test_c2_critical_warning() {
    let output = Command::new("cargo")
        .args(&[
            "run", "--quiet", "--bin", "miyabi", "--", "lark", "base", "C2",
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute C2 command");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success());
    assert!(stdout.contains("C2: Field Implementation"));
    assert!(
        stdout.contains("Critical: 主キーフィールドは最左端に配置"),
        "Should show critical warning"
    );
    assert!(
        stdout.contains("T0: 主キーフィールド設定（最優先）"),
        "Should show T0 task"
    );
}

/// Test C3 relation setup with critical warning
#[test]
fn test_c3_critical_warning() {
    let output = Command::new("cargo")
        .args(&[
            "run", "--quiet", "--bin", "miyabi", "--", "lark", "base", "C3",
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute C3 command");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success());
    assert!(stdout.contains("C3: Relation Setup"));
    assert!(
        stdout.contains("Critical: リレーション設定直後に可視性チェック（T0）を実行"),
        "Should show critical warning"
    );
}

/// Test C8 permission setup with roles
#[test]
fn test_c8_roles() {
    let output = Command::new("cargo")
        .args(&[
            "run", "--quiet", "--bin", "miyabi", "--", "lark", "base", "C8",
        ])
        .env("MIYABI_VOICE_GUIDE", "false")
        .output()
        .expect("Failed to execute C8 command");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success());
    assert!(stdout.contains("C8: Permission Setup"));
    assert!(stdout.contains("Roles:"), "Should show roles section");
    assert!(
        stdout.contains("👑 管理者（Admin）: 全権限"),
        "Should show Admin role"
    );
    assert!(
        stdout.contains("📊 管理職（Manager）"),
        "Should show Manager role"
    );
    assert!(
        stdout.contains("✍️  編集者（Editor）"),
        "Should show Editor role"
    );
}

/// Test Wiki create command structure
#[test]
fn test_wiki_create_help() {
    let output = Command::new("cargo")
        .args(&[
            "run",
            "--quiet",
            "--bin",
            "miyabi",
            "--",
            "lark",
            "wiki-create",
            "--help",
        ])
        .output()
        .expect("Failed to get wiki-create help");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success());
    assert!(
        stdout.contains("space-id") || stdout.contains("space_id"),
        "Should show space-id option"
    );
    assert!(
        stdout.contains("parent-node-token") || stdout.contains("parent_node_token"),
        "Should show parent-node-token option"
    );
}

/// Test Lark Agent help
#[test]
fn test_lark_agent_help() {
    let output = Command::new("cargo")
        .args(&[
            "run", "--quiet", "--bin", "miyabi", "--", "lark", "agent", "--help",
        ])
        .output()
        .expect("Failed to get agent help");

    let stdout = String::from_utf8_lossy(&output.stdout);

    assert!(output.status.success());
    assert!(
        stdout.contains("Interactive Lark Agent REPL")
            || stdout.contains("Lark Agent")
            || stdout.contains("agent"),
        "Should show agent help"
    );
}

/// Test context loading (requires .claude/agents directory)
#[test]
#[ignore] // Requires .claude/agents directory structure
fn test_context_loading() {
    use std::path::PathBuf;

    // Check if context files exist
    let spec_path = PathBuf::from(".claude/agents/specs/lark/lark-agent.md");
    let prompt_path = PathBuf::from(".claude/agents/prompts/lark/lark-agent-prompt.md");
    let framework_path = PathBuf::from(".claude/agents/lark/base-construction-framework.md");

    if !spec_path.exists() || !prompt_path.exists() || !framework_path.exists() {
        println!("Skipping test: Context files not found");
        return;
    }

    // This test would require running the REPL in non-interactive mode
    // For now, we just verify the files exist
    assert!(spec_path.exists());
    assert!(prompt_path.exists());
    assert!(framework_path.exists());
}
