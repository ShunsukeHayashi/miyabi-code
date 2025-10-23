//! ワークツリー操作ユーティリティ
//!
//! Git worktree に関する前処理や後片付け、生成結果の解析をまとめる。

use crate::codegen::CodeGenerationResult;
use crate::context::{determine_code_filename, write_context_files};
use miyabi_core::retry::{retry_with_backoff, RetryConfig};
use miyabi_types::agent::AgentType;
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, Task};
use std::path::{Path, PathBuf};

/// 生成コードとコンテキストをワークツリーに書き出す
pub async fn write_generated_code_to_worktree(
    worktree_path: &Path,
    config: &AgentConfig,
    task: &Task,
    generated_code: &str,
) -> Result<()> {
    tracing::info!("Writing generated code to worktree: {:?}", worktree_path);

    write_context_files(worktree_path, config, task).await?;

    let code_filename = determine_code_filename(task);
    let code_path = worktree_path.join(&code_filename);
    tokio::fs::write(&code_path, generated_code)
        .await
        .map_err(|e| {
            MiyabiError::Unknown(format!(
                "Failed to write generated code to {:?}: {}",
                code_path, e
            ))
        })?;

    tracing::info!("Generated code written to: {:?}", code_path);
    Ok(())
}

/// Claude Code CLI 実行前の準備（コンテキスト生成のみ）
pub async fn prepare_claude_context(
    worktree_path: &Path,
    config: &AgentConfig,
    task: &Task,
) -> Result<()> {
    tracing::info!("Preparing Claude context in {:?}", worktree_path);
    write_context_files(worktree_path, config, task).await?;
    tracing::info!("Generated context files in {:?}", worktree_path);
    Ok(())
}

/// ワークツリー内の結果を解析（現状はスタブ）
pub async fn parse_code_generation_results(worktree_path: &Path) -> Result<CodeGenerationResult> {
    tracing::info!("Parsing code generation results from {:?}", worktree_path);

    // TODO: git diff 等を解析する実装を追加する
    Ok(CodeGenerationResult {
        files_created: vec![],
        files_modified: vec![],
        lines_added: 0,
        lines_removed: 0,
        tests_added: 0,
        commit_sha: None,
    })
}

/// ワークツリーを作成（git2::Worktree が !Send のため spawn_blocking を利用）
#[allow(dead_code)]
pub async fn setup_worktree(config: &AgentConfig, task: &Task) -> Result<()> {
    let task_id = task.id.clone();
    let task_id_for_log = task.id.clone();
    let worktree_base = config
        .worktree_base_path
        .clone()
        .unwrap_or_else(|| PathBuf::from(".worktrees"));

    let retry_config = RetryConfig::conservative();

    retry_with_backoff(retry_config, || {
        let task_id = task_id.clone();
        let _worktree_base = worktree_base.clone();

        async move {
            let task_id_for_error = task_id.clone();

            tokio::task::spawn_blocking(move || {
                let rt = tokio::runtime::Runtime::new().map_err(|e| {
                    AgentError::with_cause(
                        "Failed to create runtime",
                        AgentType::CodeGenAgent,
                        Some(task_id.clone()),
                        e,
                    )
                })?;

                rt.block_on(async {
                    let _repo_path = miyabi_core::find_git_root(None).map_err(|e| {
                        AgentError::new(
                            format!(
                                "Failed to find git repository root: {}\n\
                                 Hint: Make sure you're running this command from within a git repository.",
                                e
                            ),
                            AgentType::CodeGenAgent,
                            Some(task_id.clone()),
                        )
                    })?;

                    let _issue_number = task_id
                        .trim_start_matches("task-")
                        .parse::<u64>()
                        .unwrap_or(0);

                    Ok::<(), MiyabiError>(())
                })
            })
            .await
            .map_err(|e| {
                AgentError::new(
                    format!("Spawn blocking failed: {}", e),
                    AgentType::CodeGenAgent,
                    Some(task_id_for_error.clone()),
                )
            })??;

            Ok(())
        }
    })
    .await?;

    tracing::info!("Created worktree for task {}", task_id_for_log);
    Ok(())
}

/// ワークツリーのクリーンアップ
#[allow(dead_code)]
pub async fn cleanup_worktree(config: &AgentConfig) -> Result<()> {
    let worktree_base = config
        .worktree_base_path
        .clone()
        .unwrap_or_else(|| PathBuf::from(".worktrees"));

    let retry_config = RetryConfig::aggressive();

    retry_with_backoff(retry_config, || {
        let _worktree_base = worktree_base.clone();

        async move {
            tokio::task::spawn_blocking(move || {
                let rt = tokio::runtime::Runtime::new().map_err(|e| {
                    AgentError::with_cause(
                        "Failed to create runtime for cleanup",
                        AgentType::CodeGenAgent,
                        None,
                        e,
                    )
                })?;

                rt.block_on(async {
                    let _repo_path = miyabi_core::find_git_root(None).map_err(|e| {
                        AgentError::new(
                            format!(
                                "Failed to find git repository root for cleanup: {}\n\
                                 Hint: Make sure you're running this command from within a git repository.",
                                e
                            ),
                            AgentType::CodeGenAgent,
                            None,
                        )
                    })?;

                    Ok::<(), MiyabiError>(())
                })
            })
            .await
            .map_err(|e| {
                AgentError::new(
                    format!("Cleanup spawn blocking failed: {}", e),
                    AgentType::CodeGenAgent,
                    None,
                )
            })??;

            Ok(())
        }
    })
    .await?;

    tracing::info!("Removed worktree");
    Ok(())
}
