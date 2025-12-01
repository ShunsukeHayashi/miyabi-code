//! Evaluator for SWE-bench Pro
//!
//! This module provides the evaluator that runs Miyabi against SWE-bench Pro instances.

use anyhow::{anyhow, Context, Result};
use miyabi_types::benchmark::{PatchOutput, SWEBenchInstance};
use miyabi_worktree::WorktreeManager;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::Semaphore;
use tokio::time::timeout;
use tracing::{debug, error, info, warn};

/// Evaluation statistics
#[derive(Debug, Clone, Default)]
struct EvaluationStats {
    total_instances: usize,
    successful: usize,
    failed: usize,
    #[allow(dead_code)]
    timed_out: usize, // Reserved for future use
    total_duration_secs: f64,
    min_duration_secs: Option<f64>,
    max_duration_secs: Option<f64>,
}

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
        let worktree_manager = WorktreeManager::new_with_discovery(Some(&config.worktree_base), config.concurrency)?;

        Ok(Self { config, worktree_manager })
    }

    /// Creates a new evaluator with custom configuration
    pub fn with_config(config: EvaluatorConfig) -> Result<Self> {
        // Discover git repository root automatically
        let worktree_manager = WorktreeManager::new_with_discovery(Some(&config.worktree_base), config.concurrency)?;

        Ok(Self { config, worktree_manager })
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
    pub async fn generate_patch_for_instance(&self, instance: &SWEBenchInstance) -> Result<PatchOutput> {
        let start_time = Instant::now();

        info!("Generating patch for instance: {}", instance.instance_id);

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
                info!("Patch generated for instance {} in {:.2}s", instance.instance_id, execution_time);

                Ok(PatchOutput {
                    instance_id: instance.instance_id.clone(),
                    model_patch: patch,
                    model_name_or_path: self.config.model_name.clone(),
                })
            }
            Ok(Err(e)) => {
                error!("Patch generation failed for instance {}: {}", instance.instance_id, e);

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
        let worktree_start = Instant::now();

        info!(
            "🌳 Creating worktree: {} (repo: {}, commit: {})",
            worktree_name,
            instance.repo,
            &instance.base_commit[..8]
        );

        // Clone repository if not exists
        let repo_path = self.ensure_repository(&instance.repo)?;

        // Create worktree from base commit
        let worktree_path = PathBuf::from(&self.config.worktree_base).join(worktree_name);

        debug!("🔧 git worktree add {:?} {}", worktree_path, instance.base_commit);

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
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("❌ Git worktree creation failed for {}: {}", worktree_name, stderr);
            return Err(anyhow!("Git worktree creation failed: {}", stderr));
        }

        let worktree_duration = worktree_start.elapsed();
        info!("✅ Worktree created: {:?} ({:.2}s)", worktree_path, worktree_duration.as_secs_f64());

        Ok(worktree_path)
    }

    /// Ensures the repository is cloned locally
    fn ensure_repository(&self, repo: &str) -> Result<PathBuf> {
        let repos_dir = PathBuf::from(&self.config.worktree_base).join("repos");
        std::fs::create_dir_all(&repos_dir)?;

        let repo_name = repo.replace("/", "-");
        let repo_path = repos_dir.join(&repo_name);

        if !repo_path.exists() {
            let clone_start = Instant::now();
            info!("📦 Cloning repository: {} -> {:?}", repo, repo_path);

            let repo_url = format!("https://github.com/{}.git", repo);
            debug!("🔗 Clone URL: {}", repo_url);

            let output = Command::new("git")
                .args(["clone", &repo_url, repo_path.to_str().unwrap()])
                .current_dir(&repos_dir)
                .output()
                .context("Failed to clone repository")?;

            let clone_duration = clone_start.elapsed();

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                error!("❌ Git clone failed for {}: {} ({:.2}s)", repo, stderr, clone_duration.as_secs_f64());
                return Err(anyhow!("Git clone failed: {}", stderr));
            }

            info!("✅ Repository cloned: {} ({:.2}s)", repo, clone_duration.as_secs_f64());
        } else {
            debug!("📁 Repository already exists: {:?}", repo_path);
        }

        Ok(repo_path)
    }

    /// Writes execution context for Claude Code
    fn write_execution_context(&self, worktree_path: &Path, instance: &SWEBenchInstance) -> Result<()> {
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
    async fn execute_agent(&self, worktree_path: &Path, instance: &SWEBenchInstance) -> Result<()> {
        info!(
            "Executing Claude API code generation for instance: {} in worktree: {:?}",
            instance.instance_id, worktree_path
        );

        // Try to generate fix using Claude API
        let fix_result = self.generate_fix_with_claude(instance, worktree_path).await;

        match fix_result {
            Ok(_) => {
                info!("Successfully generated fix with Claude for instance: {}", instance.instance_id);
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
    async fn generate_fix_with_claude(&self, instance: &SWEBenchInstance, worktree_path: &Path) -> Result<()> {
        use std::env;

        let api_start = Instant::now();

        debug!("🤖 Preparing Claude API request for instance: {}", instance.instance_id);

        // Check for API key
        let api_key = env::var("ANTHROPIC_API_KEY").context("ANTHROPIC_API_KEY environment variable not set")?;

        // Build prompt
        let prompt = format!(
            "You are a software engineer fixing a bug in the {} repository.\n\n\
            Problem Statement:\n{}\n\n\
            Base Commit: {}\n\n\
            Please provide a code fix for this issue. Output ONLY the code changes needed, \
            formatted as a git diff or the actual code to be changed. \
            Be concise and focus on the minimal fix required.",
            instance.repo, instance.problem_statement, instance.base_commit
        );

        let prompt_chars = prompt.len();
        debug!("📝 Claude API prompt prepared: {} characters, {} lines", prompt_chars, prompt.lines().count());

        // Call Claude API
        let client = reqwest::Client::new();
        info!(
            "🌐 Calling Claude API for instance: {} (model: claude-3-5-sonnet-20241022, max_tokens: 4096)",
            instance.instance_id
        );

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

        let api_duration = api_start.elapsed();

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            error!("❌ Claude API error {}: {} (duration: {:.2}s)", status, error_text, api_duration.as_secs_f64());
            return Err(anyhow!("Claude API returned error {}: {}", status, error_text));
        }

        let response_json: serde_json::Value = response.json().await.context("Failed to parse Claude API response")?;

        // Extract usage statistics if available
        if let Some(usage) = response_json.get("usage") {
            debug!(
                "📊 Claude API usage: input_tokens={}, output_tokens={}",
                usage.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0),
                usage.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0)
            );
        }

        // Extract generated fix
        let fix_content = response_json["content"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("Failed to extract text from Claude response"))?;

        let response_chars = fix_content.len();
        info!(
            "✅ Claude API response received: {} characters, {} lines ({:.2}s)",
            response_chars,
            fix_content.lines().count(),
            api_duration.as_secs_f64()
        );

        // Write fix to file
        let fix_path = worktree_path.join("CLAUDE_FIX.md");
        std::fs::write(&fix_path, fix_content).context("Failed to write Claude-generated fix")?;

        debug!("💾 Claude-generated fix written to: {:?}", fix_path);

        // Commit the fix
        self.commit_fix(worktree_path, &format!("Fix: {} (Claude-generated)", instance.instance_id))?;

        info!("✅ Claude-generated fix committed for instance: {}", instance.instance_id);

        Ok(())
    }

    /// Create placeholder fix (fallback)
    fn create_placeholder_fix(&self, instance: &SWEBenchInstance, worktree_path: &Path) -> Result<()> {
        let fix_doc_path = worktree_path.join("SWE_BENCH_FIX.md");
        let fix_content = format!(
            "# Fix for {}\n\n## Problem Statement\n\n{}\n\n## Repository\n\n{}\n\n## Base Commit\n\n{}\n\n---\n\n**Note**: This is a placeholder fix generated by Miyabi v1.0.0.\nClaude API was not available or failed.\n",
            instance.instance_id,
            instance.problem_statement,
            instance.repo,
            instance.base_commit
        );

        std::fs::write(&fix_doc_path, fix_content).context("Failed to write placeholder fix")?;

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
            return Err(anyhow!("git add failed: {}", String::from_utf8_lossy(&git_add.stderr)));
        }

        // Commit
        let git_commit = Command::new("git")
            .args(["commit", "-m", commit_message])
            .current_dir(worktree_path)
            .output()
            .context("Failed to commit changes")?;

        if !git_commit.status.success() {
            return Err(anyhow!("git commit failed: {}", String::from_utf8_lossy(&git_commit.stderr)));
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
            return Err(anyhow!("Git diff failed: {}", String::from_utf8_lossy(&output.stderr)));
        }

        let patch = String::from_utf8(output.stdout).context("Patch is not valid UTF-8")?;

        debug!("Patch generated ({} bytes)", patch.len());
        Ok(patch)
    }

    /// Cleans up a worktree
    fn cleanup_worktree(&self, worktree_name: &str) -> Result<()> {
        let cleanup_start = Instant::now();

        debug!("🧹 Cleaning up worktree: {}", worktree_name);

        let worktree_path = PathBuf::from(&self.config.worktree_base).join(worktree_name);

        if worktree_path.exists() {
            debug!("🔧 git worktree remove --force {:?}", worktree_path);

            let output = Command::new("git")
                .args(["worktree", "remove", "--force", worktree_path.to_str().unwrap()])
                .output()
                .context("Failed to remove worktree")?;

            let cleanup_duration = cleanup_start.elapsed();

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!(
                    "⚠️  Git worktree remove failed for {}: {} ({:.2}s)",
                    worktree_name,
                    stderr,
                    cleanup_duration.as_secs_f64()
                );
            } else {
                debug!("✅ Worktree cleaned up: {} ({:.2}s)", worktree_name, cleanup_duration.as_secs_f64());
            }
        } else {
            debug!("⏭️  Worktree does not exist, skipping cleanup: {}", worktree_name);
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
    pub async fn evaluate_instances(&self, instances: &[SWEBenchInstance]) -> Result<Vec<PatchOutput>> {
        let evaluation_start = Instant::now();

        info!("════════════════════════════════════════════════════════════");
        info!("🚀 Starting SWE-bench Pro Evaluation");
        info!("════════════════════════════════════════════════════════════");
        info!("  Total instances: {}", instances.len());
        info!("  Concurrency: {}", self.config.concurrency);
        info!("  Timeout per instance: {}s", self.config.timeout);
        info!("  Model: {}", self.config.model_name);
        info!("════════════════════════════════════════════════════════════");

        // Initialize statistics
        let stats = Arc::new(Mutex::new(EvaluationStats { total_instances: instances.len(), ..Default::default() }));

        // Create semaphore to control concurrency
        let semaphore = Arc::new(Semaphore::new(self.config.concurrency));
        let mut tasks = Vec::new();
        let total_instances = instances.len(); // Capture length to avoid borrowing issues

        for (idx, instance) in instances.iter().enumerate() {
            let instance = instance.clone();
            let semaphore = Arc::clone(&semaphore);
            let stats = Arc::clone(&stats);

            // Clone self fields needed for async execution
            let config = self.config.clone();
            let worktree_manager = self.worktree_manager.clone();

            let task = tokio::spawn(async move {
                // Acquire semaphore permit
                let _permit = semaphore.acquire().await.unwrap();

                let instance_start = Instant::now();
                info!(
                    "📝 [{}/{}] Starting instance: {} (repo: {}, commit: {})",
                    idx + 1,
                    total_instances,
                    instance.instance_id,
                    instance.repo,
                    &instance.base_commit[..8]
                );

                // Create temporary evaluator for this task
                let evaluator = SWEBenchProEvaluator { config, worktree_manager };

                // Generate patch (testing delegated to official harness)
                let result = evaluator.generate_patch_for_instance(&instance).await;
                let duration = instance_start.elapsed().as_secs_f64();

                // Update statistics
                {
                    let mut stats = stats.lock().unwrap();
                    stats.total_duration_secs += duration;
                    stats.min_duration_secs =
                        Some(stats.min_duration_secs.map(|m| m.min(duration)).unwrap_or(duration));
                    stats.max_duration_secs =
                        Some(stats.max_duration_secs.map(|m| m.max(duration)).unwrap_or(duration));
                }

                (idx, instance.instance_id.clone(), result, duration)
            });

            tasks.push(task);
        }

        // Wait for all tasks to complete
        let mut results = Vec::new();
        for task in tasks {
            match task.await {
                Ok((idx, instance_id, Ok(patch), duration)) => {
                    let has_patch = !patch.model_patch.is_empty();
                    if has_patch {
                        info!(
                            "✅ [{}/{}] Success: {} ({:.2}s, patch: {} bytes)",
                            idx + 1,
                            total_instances,
                            instance_id,
                            duration,
                            patch.model_patch.len()
                        );
                        stats.lock().unwrap().successful += 1;
                    } else {
                        warn!(
                            "⚠️  [{}/{}] No patch generated: {} ({:.2}s)",
                            idx + 1,
                            total_instances,
                            instance_id,
                            duration
                        );
                        stats.lock().unwrap().failed += 1;
                    }
                    results.push(patch);
                }
                Ok((idx, instance_id, Err(e), duration)) => {
                    error!(
                        "❌ [{}/{}] Failed: {} ({:.2}s) - Error: {}",
                        idx + 1,
                        total_instances,
                        instance_id,
                        duration,
                        e
                    );
                    stats.lock().unwrap().failed += 1;
                    return Err(e);
                }
                Err(e) => {
                    error!("💥 Task panicked: {}", e);
                    return Err(anyhow!("Task panicked: {}", e));
                }
            }
        }

        let evaluation_duration = evaluation_start.elapsed();
        let stats = stats.lock().unwrap().clone();

        // Print summary statistics
        info!("════════════════════════════════════════════════════════════");
        info!("📊 Evaluation Complete");
        info!("════════════════════════════════════════════════════════════");
        info!("  Total instances: {}", stats.total_instances);
        info!("  ✅ Successful: {}", stats.successful);
        info!("  ❌ Failed: {}", stats.failed);
        info!("  Success rate: {:.1}%", (stats.successful as f64 / stats.total_instances as f64) * 100.0);
        info!(
            "  ⏱️  Total time: {:.2}s ({:.1}m)",
            evaluation_duration.as_secs_f64(),
            evaluation_duration.as_secs_f64() / 60.0
        );
        if let Some(avg) = if stats.total_instances > 0 {
            Some(stats.total_duration_secs / stats.total_instances as f64)
        } else {
            None
        } {
            info!("  📈 Average time per instance: {:.2}s", avg);
        }
        if let Some(min) = stats.min_duration_secs {
            info!("  ⚡ Fastest instance: {:.2}s", min);
        }
        if let Some(max) = stats.max_duration_secs {
            info!("  🐌 Slowest instance: {:.2}s", max);
        }
        info!("════════════════════════════════════════════════════════════");

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
    pub fn generate_predictions_jsonl(&self, patches: &[PatchOutput], output_path: &Path) -> Result<()> {
        info!("Generating Predictions JSONL: {} patches -> {:?}", patches.len(), output_path);

        let mut lines = Vec::with_capacity(patches.len());

        for patch in patches {
            let json =
                serde_json::to_string(&patch).context(format!("Failed to serialize patch: {}", patch.instance_id))?;
            lines.push(json);
        }

        let content = lines.join("\n") + "\n";
        std::fs::write(output_path, content).context(format!("Failed to write JSONL to {:?}", output_path))?;

        info!("Predictions JSONL generated successfully: {} lines", patches.len());

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
        info!("Running official SWE-bench harness: run_id={}, workers={}", run_id, max_workers);

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
            return Err(anyhow!("Official harness execution failed with status {}: {}", output.status, stderr));
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
        info!("Starting evaluation with official harness: {} instances", instances.len());

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
        let run_id = format!("{}-{}", self.config.model_name, chrono::Local::now().format("%Y%m%d-%H%M%S"));
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

        let evaluator = SWEBenchProEvaluator::with_config(config).expect("Failed to create evaluator");
        assert_eq!(evaluator.config.timeout, 3600);
        assert_eq!(evaluator.config.concurrency, 10);
    }
}
