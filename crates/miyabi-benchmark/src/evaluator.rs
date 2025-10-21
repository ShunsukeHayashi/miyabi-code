//! Evaluator for SWE-bench Pro
//!
//! This module provides the evaluator that runs Miyabi against SWE-bench Pro instances.

use anyhow::{anyhow, Context, Result};
use miyabi_types::benchmark::{PatchOutput, SWEBenchInstance};
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
        let worktree_manager =
            WorktreeManager::new_with_discovery(Some(&config.worktree_base), config.concurrency)?;

        Ok(Self {
            config,
            worktree_manager,
        })
    }

    /// Creates a new evaluator with custom configuration
    pub fn with_config(config: EvaluatorConfig) -> Result<Self> {
        // Discover git repository root automatically
        let worktree_manager =
            WorktreeManager::new_with_discovery(Some(&config.worktree_base), config.concurrency)?;

        Ok(Self {
            config,
            worktree_manager,
        })
    }

    /// Generates a patch for a single instance (OFFICIAL PROTOCOL COMPLIANT)
    ///
    /// **CRITICAL**: This method ONLY generates patches. Testing is delegated to the
    /// official SWE-bench harness as per the official protocol.
    ///
    /// # Arguments
    ///
    /// * `instance` - The SWE-bench Pro instance to generate patch for
    ///
    /// # Returns
    ///
    /// `Result<PatchOutput>` - Generated patch in official format
    pub async fn generate_patch_for_instance(
        &self,
        instance: &SWEBenchInstance,
    ) -> Result<PatchOutput> {
        let start_time = Instant::now();

        info!(
            "Generating patch for instance: {}",
            instance.instance_id
        );

        // 1. Create worktree and checkout base commit
        let worktree_name = format!("swebench-{}", instance.instance_id.replace('/', "-"));
        let worktree_path = self
            .create_worktree(instance, &worktree_name)
            .context("Failed to create worktree")?;

        // Wrap patch generation in timeout
        let timeout_duration = Duration::from_secs(self.config.timeout);
        let patch_result = timeout(timeout_duration, async {
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
            let patch = self
                .generate_patch(&worktree_path, &instance.base_commit)
                .context("Failed to generate patch")?;

            Ok::<String, anyhow::Error>(patch)
        })
        .await;

        // 5. Cleanup worktree
        if let Err(e) = self.cleanup_worktree(&worktree_name) {
            warn!("Failed to cleanup worktree {}: {}", worktree_name, e);
        }

        let execution_time = start_time.elapsed().as_secs_f64();

        // Handle patch generation result (testing delegated to official harness)
        match patch_result {
            Ok(Ok(patch)) => {
                info!(
                    "Patch generated for instance {} in {:.2}s",
                    instance.instance_id, execution_time
                );

                Ok(PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: patch,
                    model_name_or_path: self.config.model_name.clone(),
                })
            }
            Ok(Err(e)) => {
                error!(
                    "Patch generation failed for instance {}: {}",
                    instance.instance_id, e
                );

                // Return empty patch on error (official harness will mark as failed)
                Ok(PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: String::new(),
                    model_name_or_path: self.config.model_name.clone(),
                })
            }
            Err(_) => {
                error!(
                    "Patch generation timed out for instance: {} after {}s",
                    instance.instance_id, self.config.timeout
                );

                // Return empty patch on timeout (official harness will mark as failed)
                Ok(PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: String::new(),
                    model_name_or_path: self.config.model_name.clone(),
                })
            }
        }
    }

    /// Creates a worktree for the given instance
    fn create_worktree(&self, instance: &SWEBenchInstance, worktree_name: &str) -> Result<PathBuf> {
        debug!("Creating worktree: {}", worktree_name);

        // Clone repository if not exists
        let repo_path = self.ensure_repository(&instance.repo)?;

        // Create worktree from base commit
        let worktree_path = PathBuf::from(&self.config.worktree_base).join(worktree_name);

        let output = Command::new("git")
            .args([
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
                .args(["clone", &repo_url, repo_path.to_str().unwrap()])
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

    /// Executes agent via Claude API code generation
    async fn execute_agent(
        &self,
        worktree_path: &Path,
        instance: &SWEBenchInstance,
    ) -> Result<()> {
        info!(
            "Executing Claude API code generation for instance: {} in worktree: {:?}",
            instance.instance_id, worktree_path
        );

        // Try to generate fix using Claude API
        let fix_result = self.generate_fix_with_claude(instance, worktree_path).await;

        match fix_result {
            Ok(_) => {
                info!(
                    "Successfully generated fix with Claude for instance: {}",
                    instance.instance_id
                );
            }
            Err(e) => {
                warn!(
                    "Claude API generation failed for instance {}: {}. Creating placeholder fix.",
                    instance.instance_id, e
                );
                // Fallback: Create a placeholder fix
                self.create_placeholder_fix(instance, worktree_path)?;
            }
        }

        Ok(())
    }

    /// Generate fix using Claude API
    async fn generate_fix_with_claude(
        &self,
        instance: &SWEBenchInstance,
        worktree_path: &Path,
    ) -> Result<()> {
        use std::env;

        // Check for API key
        let api_key = env::var("ANTHROPIC_API_KEY")
            .context("ANTHROPIC_API_KEY environment variable not set")?;

        // Build prompt
        let prompt = format!(
            "You are a software engineer fixing a bug in the {} repository.\n\n\
            Problem Statement:\n{}\n\n\
            Base Commit: {}\n\n\
            Please provide a code fix for this issue. Output ONLY the code changes needed, \
            formatted as a git diff or the actual code to be changed. \
            Be concise and focus on the minimal fix required.",
            instance.repo,
            instance.problem_statement,
            instance.base_commit
        );

        // Call Claude API
        let client = reqwest::Client::new();
        let response = client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&serde_json::json!({
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 4096,
                "messages": [{
                    "role": "user",
                    "content": prompt
                }]
            }))
            .send()
            .await
            .context("Failed to call Claude API")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(anyhow!(
                "Claude API returned error {}: {}",
                status,
                error_text
            ));
        }

        let response_json: serde_json::Value = response
            .json()
            .await
            .context("Failed to parse Claude API response")?;

        // Extract generated fix
        let fix_content = response_json["content"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Failed to extract text from Claude response"))?;

        // Write fix to file
        let fix_path = worktree_path.join("CLAUDE_FIX.md");
        std::fs::write(&fix_path, fix_content)
            .context("Failed to write Claude-generated fix")?;

        // Commit the fix
        self.commit_fix(worktree_path, &format!("Fix: {} (Claude-generated)", instance.instance_id))?;

        Ok(())
    }

    /// Create placeholder fix (fallback)
    fn create_placeholder_fix(
        &self,
        instance: &SWEBenchInstance,
        worktree_path: &Path,
    ) -> Result<()> {
        let fix_doc_path = worktree_path.join("SWE_BENCH_FIX.md");
        let fix_content = format!(
            "# Fix for {}\n\n## Problem Statement\n\n{}\n\n## Repository\n\n{}\n\n## Base Commit\n\n{}\n\n---\n\n**Note**: This is a placeholder fix generated by Miyabi v1.0.0.\nClaude API was not available or failed.\n",
            instance.instance_id,
            instance.problem_statement,
            instance.repo,
            instance.base_commit
        );

        std::fs::write(&fix_doc_path, fix_content)
            .context("Failed to write placeholder fix")?;

        self.commit_fix(worktree_path, &format!("Fix: {} (placeholder)", instance.instance_id))?;

        Ok(())
    }

    /// Commit changes in worktree
    fn commit_fix(&self, worktree_path: &Path, commit_message: &str) -> Result<()> {
        // Stage all changes
        let git_add = Command::new("git")
            .args(["add", "-A"])
            .current_dir(worktree_path)
            .output()
            .context("Failed to stage changes")?;

        if !git_add.status.success() {
            return Err(anyhow!(
                "git add failed: {}",
                String::from_utf8_lossy(&git_add.stderr)
            ));
        }

        // Commit
        let git_commit = Command::new("git")
            .args(["commit", "-m", commit_message])
            .current_dir(worktree_path)
            .output()
            .context("Failed to commit changes")?;

        if !git_commit.status.success() {
            return Err(anyhow!(
                "git commit failed: {}",
                String::from_utf8_lossy(&git_commit.stderr)
            ));
        }

        Ok(())
    }

    /// Generates a patch in unified diff format
    fn generate_patch(&self, worktree_path: &Path, base_commit: &str) -> Result<String> {
        debug!("Generating patch from worktree: {:?}", worktree_path);

        let output = Command::new("git")
            .args(["diff", "--unified=3", base_commit, "HEAD"])
            .current_dir(worktree_path)
            .output()
            .context("Failed to generate patch")?;

        if !output.status.success() {
            return Err(anyhow!(
                "Git diff failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let patch = String::from_utf8(output.stdout).context("Patch is not valid UTF-8")?;

        debug!("Patch generated ({} bytes)", patch.len());
        Ok(patch)
    }

    /// Cleans up a worktree
    fn cleanup_worktree(&self, worktree_name: &str) -> Result<()> {
        debug!("Cleaning up worktree: {}", worktree_name);

        let worktree_path = PathBuf::from(&self.config.worktree_base).join(worktree_name);

        if worktree_path.exists() {
            let output = Command::new("git")
                .args([
                    "worktree",
                    "remove",
                    "--force",
                    worktree_path.to_str().unwrap(),
                ])
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

    /// Generates patches for multiple instances with controlled concurrency
    ///
    /// **CRITICAL**: This method ONLY generates patches. All testing is delegated
    /// to the official SWE-bench harness as per the official protocol.
    ///
    /// # Arguments
    ///
    /// * `instances` - The instances to generate patches for
    ///
    /// # Returns
    ///
    /// `Result<Vec<PatchOutput>>` - Generated patches in official format
    pub async fn evaluate_instances(
        &self,
        instances: &[SWEBenchInstance],
    ) -> Result<Vec<PatchOutput>> {
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

                info!("Starting patch generation: {}", instance.instance_id);

                // Create temporary evaluator for this task
                let evaluator = SWEBenchProEvaluator {
                    config,
                    worktree_manager,
                };

                // Generate patch (testing delegated to official harness)
                evaluator.generate_patch_for_instance(&instance).await
            });

            tasks.push(task);
        }

        // Wait for all tasks to complete
        let mut results = Vec::new();
        for (index, task) in tasks.into_iter().enumerate() {
            match task.await {
                Ok(Ok(patch)) => {
                    info!(
                        "Patch generation {}/{} completed successfully: {}",
                        index + 1,
                        instances.len(),
                        patch.instance_id
                    );
                    results.push(patch);
                }
                Ok(Err(e)) => {
                    error!("Patch generation {}/{} failed: {}", index + 1, instances.len(), e);
                    return Err(e);
                }
                Err(e) => {
                    error!("Task {}/{} panicked: {}", index + 1, instances.len(), e);
                    return Err(anyhow!("Task panicked: {}", e));
                }
            }
        }

        info!(
            "Parallel patch generation completed: {}/{} instances succeeded",
            results.len(),
            instances.len()
        );

        Ok(results)
    }

    /// Generates Predictions JSONL file for official SWE-bench harness
    ///
    /// Creates a JSONL file where each line contains:
    /// ```json
    /// {
    ///   "instance_id": "repo__name-issue_number",
    ///   "model_name_or_path": "miyabi-v1.0.0",
    ///   "model_patch": "diff --git a/..."
    /// }
    /// ```
    ///
    /// # Arguments
    ///
    /// * `patches` - Vector of PatchOutput to serialize
    /// * `output_path` - Path to save the JSONL file
    ///
    /// # Returns
    ///
    /// `Result<()>` - Success or error
    pub fn generate_predictions_jsonl(
        &self,
        patches: &[PatchOutput],
        output_path: &Path,
    ) -> Result<()> {
        info!(
            "Generating Predictions JSONL: {} patches -> {:?}",
            patches.len(),
            output_path
        );

        let mut lines = Vec::with_capacity(patches.len());

        for patch in patches {
            let json = serde_json::to_string(&patch)
                .context(format!("Failed to serialize patch: {}", patch.instance_id))?;
            lines.push(json);
        }

        let content = lines.join("\n") + "\n";
        std::fs::write(output_path, content)
            .context(format!("Failed to write JSONL to {:?}", output_path))?;

        info!(
            "Predictions JSONL generated successfully: {} lines",
            patches.len()
        );

        Ok(())
    }

    /// Runs the official SWE-bench evaluation harness (swe-bench-pro compatible)
    ///
    /// **OFFICIAL HARNESS INTEGRATION**
    /// Executes: `python -m swebench.harness.run_evaluation`
    /// Docker: Automatically pulls and runs princeton-nlp/swebench (docker) containers
    ///
    /// # Arguments
    ///
    /// * `predictions_path` - Path to Predictions JSONL file
    /// * `run_id` - Unique identifier for this evaluation run
    /// * `max_workers` - Number of parallel Docker containers
    /// * `instance_ids` - Optional list of specific instances to evaluate
    ///
    /// # Returns
    ///
    /// `Result<PathBuf>` - Path to evaluation results directory
    pub async fn run_official_harness(
        &self,
        predictions_path: &Path,
        run_id: &str,
        max_workers: usize,
        instance_ids: Option<Vec<String>>,
    ) -> Result<PathBuf> {
        info!(
            "Running official SWE-bench harness: run_id={}, workers={}",
            run_id, max_workers
        );

        if !predictions_path.exists() {
            return Err(anyhow!("Predictions file not found: {:?}", predictions_path));
        }

        // Build command - swe-bench-pro official harness
        let mut cmd = Command::new("python");
        cmd.arg("-m")
            .arg("swebench.harness.run_evaluation") // Official swe-bench-pro evaluation harness
            .arg("--predictions_path")
            .arg(predictions_path)
            .arg("--max_workers")
            .arg(max_workers.to_string())
            .arg("--run_id")
            .arg(run_id);

        // Add instance_ids if specified
        if let Some(ids) = instance_ids {
            cmd.arg("--instance_ids");
            cmd.arg(ids.join(","));
        }

        info!("Executing command: {:?}", cmd);

        // Execute command (requires docker for swe-bench-pro containers)
        let output = cmd
            .output()
            .context("Failed to execute swebench.harness.run_evaluation")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("Official harness execution failed: {}", stderr);
            return Err(anyhow!(
                "Official harness execution failed with status {}: {}",
                output.status,
                stderr
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        info!("Official harness output:\n{}", stdout);

        // Return path to evaluation_results directory
        let results_dir = PathBuf::from("evaluation_results").join(run_id);
        Ok(results_dir)
    }

    /// High-level method: Generate patches, create JSONL, and run official harness
    ///
    /// This is the recommended way to use the evaluator with the official SWE-bench protocol.
    ///
    /// # Arguments
    ///
    /// * `instances` - Instances to evaluate
    /// * `output_dir` - Directory to save predictions and results
    ///
    /// # Returns
    ///
    /// `Result<PathBuf>` - Path to evaluation results
    pub async fn evaluate_with_official_harness(
        &self,
        instances: &[SWEBenchInstance],
        output_dir: &Path,
    ) -> Result<PathBuf> {
        info!(
            "Starting evaluation with official harness: {} instances",
            instances.len()
        );

        // 1. Generate patches (using Miyabi)
        info!("Step 1/3: Generating patches with Miyabi...");
        let patches = self.evaluate_instances(instances).await?;

        // 2. Create Predictions JSONL
        info!("Step 2/3: Creating Predictions JSONL...");
        std::fs::create_dir_all(output_dir).context("Failed to create output directory")?;
        let predictions_path = output_dir.join("predictions.jsonl");
        self.generate_predictions_jsonl(&patches, &predictions_path)?;

        // 3. Run official harness
        info!("Step 3/3: Running official SWE-bench harness...");
        let run_id = format!(
            "{}-{}",
            self.config.model_name,
            chrono::Local::now().format("%Y%m%d-%H%M%S")
        );
        let results_dir = self
            .run_official_harness(&predictions_path, &run_id, self.config.concurrency, None)
            .await?;

        info!("Evaluation with official harness completed successfully");
        Ok(results_dir)
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

        let evaluator =
            SWEBenchProEvaluator::with_config(config).expect("Failed to create evaluator");
        assert_eq!(evaluator.config.timeout, 3600);
        assert_eq!(evaluator.config.concurrency, 10);
    }
}
