//! Evaluator for SWE-bench Pro
//!
//! This module provides the evaluator that runs Miyabi against SWE-bench Pro instances.

use anyhow::{anyhow, Context, Result};
use miyabi_types::benchmark::{EvaluationResult, PatchOutput, SWEBenchInstance};
use miyabi_worktree::WorktreeManager;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Semaphore;
use tokio::time::timeout;
use tracing::{debug, error, info, warn};

/// Configuration for SWE-bench Pro evaluation
#[derive(Debug, Clone)]
pub struct EvaluatorConfig {
    /// Timeout per instance (seconds)
    pub timeout: u64,

    /// Number of concurrent evaluations
    pub concurrency: usize,

    /// Worktree base directory
    pub worktree_base: String,

    /// Model name/version
    pub model_name: String,
}

impl Default for EvaluatorConfig {
    fn default() -> Self {
        Self {
            timeout: 1800, // 30 minutes
            concurrency: 5,
            worktree_base: ".worktrees".to_string(),
            model_name: "miyabi-v1.0.0".to_string(),
        }
    }
}

/// SWE-bench Pro evaluator
///
/// Evaluates Miyabi's performance on SWE-bench Pro instances by:
/// 1. Creating a worktree for each instance
/// 2. Running CoordinatorAgent to generate a fix
/// 3. Generating a patch in unified diff format
/// 4. Evaluating the patch against test cases
pub struct SWEBenchProEvaluator {
    config: EvaluatorConfig,
    worktree_manager: WorktreeManager,
}

impl SWEBenchProEvaluator {
    /// Creates a new evaluator with default configuration
    pub fn new() -> Result<Self> {
        let config = EvaluatorConfig::default();

        // Discover git repository root automatically
        let worktree_manager = WorktreeManager::new_with_discovery(
            Some(&config.worktree_base),
            config.concurrency,
        )?;

        Ok(Self {
            config,
            worktree_manager,
        })
    }

    /// Creates a new evaluator with custom configuration
    pub fn with_config(config: EvaluatorConfig) -> Result<Self> {
        // Discover git repository root automatically
        let worktree_manager = WorktreeManager::new_with_discovery(
            Some(&config.worktree_base),
            config.concurrency,
        )?;

        Ok(Self {
            config,
            worktree_manager,
        })
    }

    /// Evaluates a single instance
    ///
    /// # Arguments
    ///
    /// * `instance` - The SWE-bench Pro instance to evaluate
    ///
    /// # Returns
    ///
    /// `Result<(PatchOutput, EvaluationResult)>` - Generated patch and evaluation result
    pub async fn evaluate_instance(
        &self,
        instance: &SWEBenchInstance,
    ) -> Result<(PatchOutput, EvaluationResult)> {
        let start_time = Instant::now();

        info!(
            "Starting evaluation for instance: {}",
            instance.instance_id
        );

        // 1. Create worktree and checkout base commit
        let worktree_name = format!("swebench-{}", instance.instance_id.replace("/", "-"));
        let worktree_path = self.create_worktree(instance, &worktree_name)
            .context("Failed to create worktree")?;

        // Wrap evaluation in timeout
        let timeout_duration = Duration::from_secs(self.config.timeout);
        let eval_result = timeout(timeout_duration, async {
            // 2. Write execution context
            self.write_execution_context(&worktree_path, instance)
                .context("Failed to write execution context")?;

            // 3. Run CoordinatorAgent (Claude Code integration)
            // TODO: Implement Claude Code execution via worktree protocol
            // For now, this returns a placeholder result
            self.execute_agent(&worktree_path, instance)
                .await
                .context("Failed to execute agent")?;

            // 4. Generate patch in unified diff format
            let patch = self.generate_patch(&worktree_path, &instance.base_commit)
                .context("Failed to generate patch")?;

            Ok::<_, anyhow::Error>(patch)
        })
        .await;

        // 5. Cleanup worktree
        if let Err(e) = self.cleanup_worktree(&worktree_name) {
            warn!("Failed to cleanup worktree {}: {}", worktree_name, e);
        }

        let execution_time = start_time.elapsed().as_secs_f64();

        match eval_result {
            Ok(Ok(patch)) => {
                info!(
                    "Successfully evaluated instance: {} in {:.2}s",
                    instance.instance_id, execution_time
                );

                let patch_output = PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: patch,
                    model_name_or_path: self.config.model_name.clone(),
                };

                // TODO: Actual test execution and result calculation
                // For now, return placeholder values
                let result = EvaluationResult::success(
                    instance.instance_id.clone(),
                    0, // TODO: Calculate actual fail_to_pass
                    instance.fail_to_pass.len(),
                    0, // TODO: Calculate actual pass_to_pass
                    instance.pass_to_pass.len(),
                    execution_time,
                );

                Ok((patch_output, result))
            }
            Ok(Err(e)) => {
                error!(
                    "Evaluation failed for instance {}: {}",
                    instance.instance_id, e
                );

                let result = EvaluationResult::failure(
                    instance.instance_id.clone(),
                    format!("{:#}", e),
                    execution_time,
                );

                // Return empty patch on error
                let patch_output = PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: String::new(),
                    model_name_or_path: self.config.model_name.clone(),
                };

                Ok((patch_output, result))
            }
            Err(_) => {
                error!(
                    "Evaluation timed out for instance: {} after {}s",
                    instance.instance_id, self.config.timeout
                );

                let result = EvaluationResult::failure(
                    instance.instance_id.clone(),
                    format!("Timeout after {}s", self.config.timeout),
                    execution_time,
                );

                let patch_output = PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: String::new(),
                    model_name_or_path: self.config.model_name.clone(),
                };

                Ok((patch_output, result))
            }
        }
    }

    /// Creates a worktree for the given instance
    fn create_worktree(
        &self,
        instance: &SWEBenchInstance,
        worktree_name: &str,
    ) -> Result<PathBuf> {
        debug!("Creating worktree: {}", worktree_name);

        // Clone repository if not exists
        let repo_path = self.ensure_repository(&instance.repo)?;

        // Create worktree from base commit
        let worktree_path = PathBuf::from(&self.config.worktree_base).join(worktree_name);

        let output = Command::new("git")
            .args(&[
                "worktree",
                "add",
                worktree_path.to_str().unwrap(),
                &instance.base_commit,
            ])
            .current_dir(&repo_path)
            .output()
            .context("Failed to create git worktree")?;

        if !output.status.success() {
            return Err(anyhow!(
                "Git worktree creation failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        debug!("Worktree created at: {:?}", worktree_path);
        Ok(worktree_path)
    }

    /// Ensures the repository is cloned locally
    fn ensure_repository(&self, repo: &str) -> Result<PathBuf> {
        let repos_dir = PathBuf::from(&self.config.worktree_base).join("repos");
        std::fs::create_dir_all(&repos_dir)?;

        let repo_name = repo.replace("/", "-");
        let repo_path = repos_dir.join(&repo_name);

        if !repo_path.exists() {
            info!("Cloning repository: {}", repo);

            let repo_url = format!("https://github.com/{}.git", repo);
            let output = Command::new("git")
                .args(&["clone", &repo_url, repo_path.to_str().unwrap()])
                .current_dir(&repos_dir)
                .output()
                .context("Failed to clone repository")?;

            if !output.status.success() {
                return Err(anyhow!(
                    "Git clone failed: {}",
                    String::from_utf8_lossy(&output.stderr)
                ));
            }

            info!("Repository cloned successfully: {}", repo);
        }

        Ok(repo_path)
    }

    /// Writes execution context for Claude Code
    fn write_execution_context(
        &self,
        worktree_path: &Path,
        instance: &SWEBenchInstance,
    ) -> Result<()> {
        let context = serde_json::json!({
            "instance_id": instance.instance_id,
            "repo": instance.repo,
            "base_commit": instance.base_commit,
            "problem_statement": instance.problem_statement,
            "worktree_path": worktree_path,
            "model_name": self.config.model_name,
        });

        let context_file = worktree_path.join(".agent-context.json");
        std::fs::write(&context_file, serde_json::to_string_pretty(&context)?)?;

        debug!("Execution context written to: {:?}", context_file);
        Ok(())
    }

    /// Executes agent via Claude Code (placeholder)
    async fn execute_agent(&self, _worktree_path: &Path, _instance: &SWEBenchInstance) -> Result<()> {
        // TODO: Implement Claude Code integration
        // This should invoke Claude Code in the worktree with the execution context
        //
        // Possible approaches:
        // 1. Shell out to `claude` CLI (if available)
        // 2. Use MCP protocol to communicate with Claude Code
        // 3. Manual intervention prompt (for MVP)

        warn!("Agent execution not implemented yet - placeholder");

        // For now, return success to allow testing the rest of the pipeline
        Ok(())
    }

    /// Generates a patch in unified diff format
    fn generate_patch(&self, worktree_path: &Path, base_commit: &str) -> Result<String> {
        debug!("Generating patch from worktree: {:?}", worktree_path);

        let output = Command::new("git")
            .args(&["diff", "--unified=3", base_commit, "HEAD"])
            .current_dir(worktree_path)
            .output()
            .context("Failed to generate patch")?;

        if !output.status.success() {
            return Err(anyhow!(
                "Git diff failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let patch = String::from_utf8(output.stdout)
            .context("Patch is not valid UTF-8")?;

        debug!("Patch generated ({} bytes)", patch.len());
        Ok(patch)
    }

    /// Cleans up a worktree
    fn cleanup_worktree(&self, worktree_name: &str) -> Result<()> {
        debug!("Cleaning up worktree: {}", worktree_name);

        let worktree_path = PathBuf::from(&self.config.worktree_base).join(worktree_name);

        if worktree_path.exists() {
            let output = Command::new("git")
                .args(&["worktree", "remove", "--force", worktree_path.to_str().unwrap()])
                .output()
                .context("Failed to remove worktree")?;

            if !output.status.success() {
                warn!(
                    "Git worktree remove failed: {}",
                    String::from_utf8_lossy(&output.stderr)
                );
            }
        }

        Ok(())
    }

    /// Evaluates multiple instances with controlled concurrency
    ///
    /// # Arguments
    ///
    /// * `instances` - The instances to evaluate
    ///
    /// # Returns
    ///
    /// `Result<Vec<(PatchOutput, EvaluationResult)>>` - Generated patches and evaluation results
    pub async fn evaluate_instances(
        &self,
        instances: &[SWEBenchInstance],
    ) -> Result<Vec<(PatchOutput, EvaluationResult)>> {
        info!(
            "Starting parallel evaluation of {} instances with concurrency={}",
            instances.len(),
            self.config.concurrency
        );

        // Create semaphore to control concurrency
        let semaphore = Arc::new(Semaphore::new(self.config.concurrency));
        let mut tasks = Vec::new();

        for instance in instances {
            let instance = instance.clone();
            let semaphore = Arc::clone(&semaphore);

            // Clone self fields needed for async execution
            let config = self.config.clone();
            let worktree_manager = self.worktree_manager.clone();

            let task = tokio::spawn(async move {
                // Acquire semaphore permit
                let _permit = semaphore.acquire().await.unwrap();

                info!("Starting evaluation: {}", instance.instance_id);

                // Create temporary evaluator for this task
                let evaluator = SWEBenchProEvaluator {
                    config,
                    worktree_manager,
                };

                // Execute evaluation
                evaluator.evaluate_instance(&instance).await
            });

            tasks.push(task);
        }

        // Wait for all tasks to complete
        let mut results = Vec::new();
        for (index, task) in tasks.into_iter().enumerate() {
            match task.await {
                Ok(Ok(result)) => {
                    info!(
                        "Evaluation {}/{} completed successfully: {}",
                        index + 1,
                        instances.len(),
                        result.1.instance_id
                    );
                    results.push(result);
                }
                Ok(Err(e)) => {
                    error!("Evaluation {}/{} failed: {}", index + 1, instances.len(), e);
                    return Err(e);
                }
                Err(e) => {
                    error!("Task {}/{} panicked: {}", index + 1, instances.len(), e);
                    return Err(anyhow!("Task panicked: {}", e));
                }
            }
        }

        info!(
            "Parallel evaluation completed: {}/{} instances succeeded",
            results.len(),
            instances.len()
        );

        Ok(results)
    }
}

impl Default for SWEBenchProEvaluator {
    fn default() -> Self {
        Self::new().expect("Failed to create default SWEBenchProEvaluator")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_evaluator_creation() {
        let evaluator = SWEBenchProEvaluator::new().expect("Failed to create evaluator");
        assert_eq!(evaluator.config.timeout, 1800);
        assert_eq!(evaluator.config.concurrency, 5);
    }

    #[test]
    fn test_custom_config() {
        let config = EvaluatorConfig {
            timeout: 3600,
            concurrency: 10,
            worktree_base: ".worktrees".to_string(),
            model_name: "miyabi-v2.0.0".to_string(),
        };

        let evaluator = SWEBenchProEvaluator::with_config(config).expect("Failed to create evaluator");
        assert_eq!(evaluator.config.timeout, 3600);
        assert_eq!(evaluator.config.concurrency, 10);
    }
}
